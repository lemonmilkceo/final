'use server';

import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

    revalidatePath(`/admin/users/${userId}`);
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
 * 사용자 차단/해제 (사유 포함)
 */
export async function toggleUserBlock(
  userId: string,
  isBlocked: boolean,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    const updateData = isBlocked
      ? {
          is_blocked: true,
          blocked_at: new Date().toISOString(),
          blocked_reason: reason || null,
        }
      : {
          is_blocked: false,
          blocked_at: null,
          blocked_reason: null,
        };

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('Toggle user block error:', error);
      return {
        success: false,
        error: '처리에 실패했습니다',
      };
    }

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Toggle user block error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다',
    };
  }
}

/**
 * 사용자 삭제
 */
export async function deleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    // Supabase Auth에서 사용자 삭제 (CASCADE로 profiles도 삭제됨)
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Delete user error:', error);
      return {
        success: false,
        error: error.message || '사용자 삭제에 실패했습니다',
      };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Delete user error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다',
    };
  }
}
