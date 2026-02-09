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

    // [보안] 토스 API 호출 전 DB에서 결제 정보 먼저 조회
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

    // [보안] 금액 조작 방지: DB에 저장된 금액과 요청된 금액 비교
    const requestedAmount = parseInt(amount, 10);
    if (payment.amount !== requestedAmount) {
      console.error('[Security] Amount mismatch:', {
        expected: payment.amount,
        received: requestedAmount,
        orderId,
      });
      return NextResponse.redirect(
        new URL('/pricing?error=amount_mismatch', request.url)
      );
    }

    // [보안] 이미 처리된 결제인지 확인 (중복 처리 방지)
    if (payment.status !== 'pending') {
      console.log('Payment already processed:', payment.status);
      return NextResponse.redirect(
        new URL('/pricing?success=true', request.url)
      );
    }

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
          amount: payment.amount, // [보안] DB에 저장된 금액 사용
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
    console.log('[Payment Confirmed]', {
      orderId,
      amount: payment.amount,
      receipt: confirmData.receipt?.url,
    });

    // [보안] 결제 상태 업데이트 + 크레딧 지급을 원자적 DB 함수로 처리
    // Race Condition 방지: Row Lock으로 동시 처리 차단
    const { data: processResult, error: processError } = await supabase.rpc(
      'process_payment_completion',
      {
        p_payment_id: payment.id,
        p_user_id: user.id,
        p_payment_key: paymentKey,
        p_receipt_url: confirmData.receipt?.url || null,
      }
    );

    if (processError) {
      console.error('Payment process error:', processError);
      // 토스에서 결제는 성공했으므로 일단 성공 페이지로 이동
      // 관리자가 수동 처리 필요
      return NextResponse.redirect(
        new URL('/pricing?success=true&warning=credit_pending', request.url)
      );
    }

    if (!processResult) {
      // 이미 다른 요청이 처리함 (정상적인 중복 요청)
      console.log('Payment already processed by another request');
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
