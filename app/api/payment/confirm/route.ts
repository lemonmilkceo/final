import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 토스페이먼츠 테스트 시크릿 키
const SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';

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

    // 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
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
      return NextResponse.redirect(
        new URL('/pricing?error=payment_not_found', request.url)
      );
    }

    // 금액 검증
    if (payment.amount !== parseInt(amount, 10)) {
      console.error('Amount mismatch:', payment.amount, amount);
      return NextResponse.redirect(
        new URL('/pricing?error=amount_mismatch', request.url)
      );
    }

    // 토스페이먼츠 결제 승인 API 호출
    const confirmResponse = await fetch(
      'https://api.tosspayments.com/v1/payments/confirm',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(SECRET_KEY + ':').toString('base64')}`,
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

      // 결제 실패 상태 업데이트
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      return NextResponse.redirect(
        new URL('/pricing?error=payment_failed', request.url)
      );
    }

    const confirmData = await confirmResponse.json();

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

    // 크레딧 지급
    if (payment.credits_contract > 0) {
      await supabase.rpc('add_credit', {
        p_user_id: user.id,
        p_credit_type: 'contract',
        p_amount: payment.credits_contract,
        p_description: `결제: ${payment.product_name}`,
        p_reference_id: payment.id,
      });
    }

    if (payment.credits_ai_review > 0) {
      await supabase.rpc('add_credit', {
        p_user_id: user.id,
        p_credit_type: 'ai_review',
        p_amount: payment.credits_ai_review,
        p_description: `결제: ${payment.product_name}`,
        p_reference_id: payment.id,
      });
    }

    // 성공 페이지로 리다이렉트
    return NextResponse.redirect(
      new URL('/pricing?success=true', request.url)
    );
  } catch (error) {
    console.error('Payment confirm error:', error);
    return NextResponse.redirect(
      new URL('/pricing?error=server_error', request.url)
    );
  }
}
