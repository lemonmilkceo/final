'use server';

import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * 프로모션 코드 생성
 */
export async function createPromoCode(formData: {
  code: string;
  creditAmount: number;
  maxUses: number;
  expiresAt: string | null;
  description: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    const { error } = await supabase.from('promo_codes').insert({
      code: formData.code.toUpperCase().trim(),
      credit_amount: formData.creditAmount,
      max_uses: formData.maxUses,
      expires_at: formData.expiresAt || null,
      description: formData.description || null,
      created_by: 'admin',
    });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: '이미 존재하는 코드입니다' };
      }
      console.error('Create promo code error:', error);
      return { success: false, error: '코드 생성에 실패했습니다' };
    }

    revalidatePath('/admin/promos');
    return { success: true };
  } catch (error) {
    console.error('Create promo code error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다',
    };
  }
}

/**
 * 프로모션 코드 활성화/비활성화
 */
export async function togglePromoCode(
  promoId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: isActive })
      .eq('id', promoId);

    if (error) {
      console.error('Toggle promo code error:', error);
      return { success: false, error: '처리에 실패했습니다' };
    }

    revalidatePath('/admin/promos');
    return { success: true };
  } catch (error) {
    console.error('Toggle promo code error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다',
    };
  }
}

/**
 * 프로모션 코드 삭제
 */
export async function deletePromoCode(
  promoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', promoId);

    if (error) {
      console.error('Delete promo code error:', error);
      return { success: false, error: '삭제에 실패했습니다' };
    }

    revalidatePath('/admin/promos');
    return { success: true };
  } catch (error) {
    console.error('Delete promo code error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다',
    };
  }
}
