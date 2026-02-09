'use server';

import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * 크레딧 조정 (지급/차감)
 */
export async function adjustCredits(
  userId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();
    const source = amount > 0 ? 'admin_grant' : 'admin_deduct';

    const { error } = await supabase.rpc('add_credit', {
      p_user_id: userId,
      p_amount: amount,
      p_credit_type: 'contract',
      p_description: `[관리자] ${reason}`,
    });

    if (error) {
      console.error('Adjust credits error:', error);
      return {
        success: false,
        error: '크레딧 조정에 실패했습니다',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Adjust credits error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다',
    };
  }
}

/**
 * 사용자 차단/해제
 */
export async function toggleUserBlock(
  userId: string,
  isBlocked: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: isBlocked })
      .eq('id', userId);

    if (error) {
      console.error('Toggle user block error:', error);
      return {
        success: false,
        error: '처리에 실패했습니다',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Toggle user block error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다',
    };
  }
}
