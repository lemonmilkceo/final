'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface RedeemResult {
  success: boolean;
  error?: string;
  creditAmount?: number;
  message?: string;
}

/**
 * 프로모션 코드 적용
 */
export async function redeemPromoCode(code: string): Promise<RedeemResult> {
  try {
    const supabase = await createClient();

    // 현재 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '로그인이 필요합니다' };
    }

    // RPC 함수 호출
    const { data, error } = await supabase.rpc('redeem_promo_code', {
      p_user_id: user.id,
      p_code: code,
    });

    if (error) {
      console.error('Redeem promo code error:', error);
      return { success: false, error: '코드 적용에 실패했습니다' };
    }

    const result = data as { success: boolean; error?: string; credit_amount?: number; message?: string };

    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidatePath('/employer');
    revalidatePath('/worker');
    revalidatePath('/pricing');

    return {
      success: true,
      creditAmount: result.credit_amount,
      message: result.message,
    };
  } catch (error) {
    console.error('Redeem promo code error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다',
    };
  }
}
