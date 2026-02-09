import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 환불 요청 생성 API
 * POST /api/refund/request
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

    // 현재 크레딧 잔액 조회
    const { data: credit } = await supabase
      .from('credits')
      .select('amount')
      .eq('user_id', user.id)
      .eq('credit_type', 'contract')
      .single();

    const currentCredits = credit?.amount || 0;
    const totalCredits = payment.credits_contract;
    
    // 사용한 크레딧 계산 (간단히: 구매 크레딧 - 현재 잔액, 단 음수 방지)
    // 실제로는 credit_transactions를 추적해야 정확함
    const usedCredits = Math.max(0, totalCredits - currentCredits);
    const refundCredits = totalCredits - usedCredits;

    // 환불 금액 계산 (미사용 크레딧 비례)
    const refundAmount = Math.floor((refundCredits / totalCredits) * payment.amount);

    // 환불 가능 크레딧이 없는 경우
    if (refundCredits <= 0 || refundAmount <= 0) {
      return NextResponse.json(
        { error: '이미 모든 크레딧을 사용하여 환불이 불가능해요' },
        { status: 400 }
      );
    }

    // 환불 유형 결정
    const requestType = usedCredits === 0 ? 'full' : 'partial';

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
        refundAmount,
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
