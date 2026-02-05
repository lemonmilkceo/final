import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 토스페이먼츠 시크릿 키
 * 환경변수에서 가져오며, 미설정 시 에러 발생
 */
function getTossSecretKey(): string {
  const key = process.env.TOSS_SECRET_KEY;
  if (!key) {
    throw new Error('TOSS_SECRET_KEY 환경 변수가 설정되지 않았습니다.');
  }
  return key;
}

// TODO: 토스 결제 심사 후 게스트 모드 결제 차단 원복 필요
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  // 필수 파라미터 확인
  if (!paymentKey || !orderId || !amount) {
    return NextResponse.redirect(
      new URL('/pricing?error=missing_params', request.url)
    );
  }

  try {
    const supabase = await createClient();

    // 인증 확인 (게스트 모드 허용을 위해 임시 비활성화)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // TODO: 심사 후 아래 주석 해제
    // if (!user) {
    //   return NextResponse.redirect(new URL('/login', request.url));
    // }

    // 토스페이먼츠 시크릿 키 가져오기
    const secretKey = getTossSecretKey();

    // 토스페이먼츠 결제 승인 API 호출
    const confirmResponse = await fetch(
      'https://api.tosspayments.com/v1/payments/confirm',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: parseInt(amount, 10),
        }),
      }
    );

    if (!confirmResponse.ok) {
      const errorData = await confirmResponse.json();
      console.error('Toss confirm error:', errorData);
      return NextResponse.redirect(
        new URL('/pricing?error=payment_failed', request.url)
      );
    }

    const confirmData = await confirmResponse.json();
    console.log('[Payment Success]', {
      orderId,
      amount,
      isGuest: !user,
      receipt: confirmData.receipt?.url,
    });

    // 게스트 모드: DB 업데이트 스킵 (토스 심사용)
    if (!user) {
      console.log('[Guest Mode] Payment confirmed - skipping DB update');
      return NextResponse.redirect(new URL('/pricing?success=true', request.url));
    }

    // 결제 정보 조회
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError);
      // 결제는 성공했으므로 성공 페이지로 이동
      return NextResponse.redirect(new URL('/pricing?success=true', request.url));
    }

    // 결제 성공 상태 업데이트
    await supabase
      .from('payments')
      .update({
        status: 'completed',
        payment_key: paymentKey,
        receipt_url: confirmData.receipt?.url || null,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    // 크레딧 지급 (병렬 처리)
    const creditPromises = [];

    if (payment.credits_contract > 0) {
      creditPromises.push(
        supabase
          .rpc('add_credit', {
            p_user_id: user.id,
            p_credit_type: 'contract',
            p_amount: payment.credits_contract,
            p_description: `결제: ${payment.product_name}`,
            p_reference_id: payment.id,
          })
          .then()
      );
    }

    if (payment.credits_ai_review > 0) {
      creditPromises.push(
        supabase
          .rpc('add_credit', {
            p_user_id: user.id,
            p_credit_type: 'ai_review',
            p_amount: payment.credits_ai_review,
            p_description: `결제: ${payment.product_name}`,
            p_reference_id: payment.id,
          })
          .then()
      );
    }

    if (creditPromises.length > 0) {
      await Promise.all(creditPromises);
    }

    // 성공 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/pricing?success=true', request.url));
  } catch (error) {
    console.error('Payment confirm error:', error);
    return NextResponse.redirect(
      new URL('/pricing?error=server_error', request.url)
    );
  }
}
