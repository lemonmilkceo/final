import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/utils/rate-limiter';

// 환불 수수료 설정
const FEE_RATE = 0.10; // 10% 수수료
const NO_FEE_DAYS = 7; // 7일 이내 미사용 시 수수료 면제
const MINIMUM_REFUND_AMOUNT = 1000; // 최소 환불 금액 1,000원

/**
 * 환불 요청 생성 API
 * POST /api/refund/request
 * 
 * 수수료 정책:
 * - 기본: 10% 수수료 적용
 * - 예외: 결제 후 7일 이내 + 크레딧 미사용 시 수수료 면제
 * - 최소 환불 금액: 1,000원
 */
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

    // [보안] Rate Limiting: 사용자당 분당 3회 제한
    const rateLimitKey = getRateLimitKey('refund:request', user.id);
    const { allowed, remaining, resetAt } = checkRateLimit(rateLimitKey, 3, 60 * 1000);
    
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
    const { paymentId, reason } = body;

    // 유효성 검사
    if (!paymentId || !reason) {
      return NextResponse.json(
        { error: '필수 정보가 누락됐어요' },
        { status: 400 }
      );
    }

    // 결제 정보 조회
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: '결제 정보를 찾을 수 없어요' },
        { status: 404 }
      );
    }

    // 이미 환불 요청이 있는지 확인
    const { data: existingRefund } = await supabase
      .from('refund_requests')
      .select('id, status')
      .eq('payment_id', paymentId)
      .in('status', ['pending', 'approved', 'completed'])
      .single();

    if (existingRefund) {
      return NextResponse.json(
        { error: '이미 환불 요청이 진행 중이에요' },
        { status: 400 }
      );
    }

    // 결제일로부터 12개월 이내인지 확인
    if (!payment.paid_at) {
      return NextResponse.json(
        { error: '결제 정보가 올바르지 않아요' },
        { status: 400 }
      );
    }
    const paymentDate = new Date(payment.paid_at);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - paymentDate.getFullYear()) * 12 
      + (now.getMonth() - paymentDate.getMonth());
    
    if (monthsDiff >= 12) {
      return NextResponse.json(
        { error: '결제일로부터 12개월이 지나 환불이 불가능해요' },
        { status: 400 }
      );
    }

    // [개선] 해당 결제 건에서 지급된 크레딧의 사용량을 정확히 계산
    // credit_transactions에서 reference_id(결제ID)로 추적
    const totalCredits = payment.credits_contract;
    
    // 1. 해당 결제로 지급된 크레딧 확인
    const { data: creditGiven } = await supabase
      .from('credit_transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('credit_type', 'contract')
      .eq('reference_id', paymentId)
      .gt('amount', 0) // 양수만 (지급)
      .single();

    // 2. 지급 기록이 없으면 환불 불가
    if (!creditGiven) {
      return NextResponse.json(
        { error: '결제 크레딧 지급 기록을 찾을 수 없어요' },
        { status: 400 }
      );
    }

    // 3. 현재 잔액과 결제 후 사용량 계산
    // 결제 이후 사용한 크레딧 = 전체 마이너스 트랜잭션 합계 (음수)
    const { data: usedTransactions } = await supabase
      .from('credit_transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('credit_type', 'contract')
      .lt('amount', 0) // 음수만 (사용)
      .gte('created_at', payment.paid_at || payment.created_at);

    // 결제 이후 총 사용량 (양수로 변환)
    const usedAfterPayment = usedTransactions?.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    ) || 0;

    // 해당 결제 건에서 사용된 크레딧 (최대 해당 결제 크레딧까지)
    const usedCredits = Math.min(usedAfterPayment, totalCredits);
    const refundCredits = totalCredits - usedCredits;

    // 환불 기본 금액 계산 (미사용 크레딧 비례)
    const baseRefundAmount = Math.floor((refundCredits / totalCredits) * payment.amount);

    // 환불 가능 크레딧이 없는 경우
    if (refundCredits <= 0 || baseRefundAmount <= 0) {
      return NextResponse.json(
        { error: '이미 모든 크레딧을 사용하여 환불이 불가능해요' },
        { status: 400 }
      );
    }

    // 환불 유형 결정
    const requestType = usedCredits === 0 ? 'full' : 'partial';

    // 수수료 계산
    // 조건: 결제 후 7일 이내 + 크레딧 미사용 시 수수료 면제
    const daysSincePayment = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
    const isNoFeeEligible = daysSincePayment <= NO_FEE_DAYS && usedCredits === 0;
    
    const appliedFeeRate = isNoFeeEligible ? 0 : FEE_RATE;
    const feeAmount = Math.floor(baseRefundAmount * appliedFeeRate);
    const refundAmount = baseRefundAmount - feeAmount;

    // 최소 환불 금액 체크
    if (refundAmount < MINIMUM_REFUND_AMOUNT) {
      return NextResponse.json(
        { error: `최소 환불 금액은 ${MINIMUM_REFUND_AMOUNT.toLocaleString()}원이에요. 수수료 차감 후 환불 금액이 부족해요.` },
        { status: 400 }
      );
    }

    // 환불 요청 생성
    const { data: refundRequest, error: insertError } = await supabase
      .from('refund_requests')
      .insert({
        user_id: user.id,
        payment_id: paymentId,
        request_type: requestType,
        reason,
        total_credits: totalCredits,
        used_credits: usedCredits,
        refund_credits: refundCredits,
        original_amount: payment.amount,
        base_refund_amount: baseRefundAmount,
        fee_rate: appliedFeeRate,
        fee_amount: feeAmount,
        refund_amount: refundAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Refund request insert error:', insertError);
      return NextResponse.json(
        { error: '환불 요청에 실패했어요' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      refundRequest: {
        id: refundRequest.id,
        requestType,
        totalCredits,
        usedCredits,
        refundCredits,
        originalAmount: payment.amount,
        baseRefundAmount,
        feeRate: appliedFeeRate,
        feeAmount,
        refundAmount,
        isNoFeeApplied: isNoFeeEligible,
      },
    });
  } catch (error) {
    console.error('Refund request error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했어요' },
      { status: 500 }
    );
  }
}
