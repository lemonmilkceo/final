'use server';

import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/server';

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY!;

/**
 * 환불 승인 및 처리
 */
export async function processRefund(
  refundId: string,
  userId: string,
  paymentKey: string,
  refundAmount: number,
  refundCredits: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // 관리자 권한 확인
    await requireAdmin();

    const supabase = createAdminClient();

    // 1. 토스페이먼츠 환불 API 호출
    const response = await fetch(
      `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelReason: '고객 요청에 의한 환불',
          cancelAmount: refundAmount,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Toss refund error:', errorData);
      return {
        success: false,
        error: `토스페이먼츠 환불 실패: ${errorData.message || '알 수 없는 오류'}`,
      };
    }

    // 2. 크레딧 차감 (RPC 함수 사용)
    const { error: creditError } = await supabase.rpc('add_credit', {
      p_user_id: userId,
      p_amount: -refundCredits, // 음수로 차감
      p_credit_type: 'contract',
      p_description: `환불 처리 (${refundCredits}건)`,
    });

    if (creditError) {
      console.error('Credit deduction error:', creditError);
      // 크레딧 차감 실패해도 환불은 진행됨 - 로그만 남김
    }

    // 3. 환불 요청 상태 업데이트
    const { error: updateError } = await supabase
      .from('refund_requests')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        admin_note: '토스페이먼츠 환불 완료',
      })
      .eq('id', refundId);

    if (updateError) {
      console.error('Refund request update error:', updateError);
      return {
        success: false,
        error: '환불 상태 업데이트에 실패했습니다',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Process refund error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '환불 처리 중 오류가 발생했습니다',
    };
  }
}

/**
 * 환불 거절
 */
export async function rejectRefund(
  refundId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('refund_requests')
      .update({
        status: 'rejected',
        processed_at: new Date().toISOString(),
        admin_note: reason,
      })
      .eq('id', refundId);

    if (error) {
      console.error('Reject refund error:', error);
      return {
        success: false,
        error: '거절 처리에 실패했습니다',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Reject refund error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다',
    };
  }
}
