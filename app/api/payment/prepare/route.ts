import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/utils/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요해요' },
        { status: 401 }
      );
    }

    // [보안] Rate Limiting: 사용자당 분당 5회 제한
    const rateLimitKey = getRateLimitKey('payment:prepare', user.id);
    const { allowed, remaining, resetAt } = checkRateLimit(rateLimitKey, 5, 60 * 1000);
    
    if (!allowed) {
      return NextResponse.json(
        { error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': resetAt.toString(),
          }
        }
      );
    }

    const body = await request.json();
    const { orderId, productId, amount, credits } = body;

    // 유효성 검사
    if (!orderId || !productId || !amount || !credits) {
      return NextResponse.json(
        { error: '필수 정보가 누락됐어요' },
        { status: 400 }
      );
    }

    // 1회 충전 한도 검증 (토스페이먼츠 심사 요구사항: 10만원 제한)
    const MAX_PAYMENT_AMOUNT = 100000;
    if (amount > MAX_PAYMENT_AMOUNT) {
      return NextResponse.json(
        { error: '1회 최대 충전 금액은 100,000원입니다' },
        { status: 400 }
      );
    }

    // 상품 정보 검증
    const VALID_PRODUCTS: Record<string, { price: number; credits: number }> = {
      credit_5: { price: 4900, credits: 5 },
      credit_15: { price: 12900, credits: 15 },
      credit_50: { price: 39000, credits: 50 },
    };

    const product = VALID_PRODUCTS[productId];
    if (!product || product.price !== amount || product.credits !== credits) {
      return NextResponse.json(
        { error: '잘못된 상품 정보예요' },
        { status: 400 }
      );
    }

    // payments 테이블에 대기 상태로 기록
    const { error: insertError } = await supabase.from('payments').insert({
      user_id: user.id,
      order_id: orderId,
      amount,
      product_name: `계약서 ${credits}건`,
      credits_contract: credits,
      credits_ai_review: 0,
      status: 'pending',
    });

    if (insertError) {
      console.error('Payment insert error:', insertError);
      return NextResponse.json(
        { error: '결제 준비에 실패했어요' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error('Payment prepare error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했어요' },
      { status: 500 }
    );
  }
}
