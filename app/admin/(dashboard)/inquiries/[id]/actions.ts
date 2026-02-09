'use server';

import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * 문의 상태 변경
 */
export async function updateInquiryStatus(
  inquiryId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('cs_inquiries')
      .update({ status })
      .eq('id', inquiryId);

    if (error) {
      console.error('Update inquiry status error:', error);
      return { success: false, error: '상태 변경에 실패했습니다' };
    }

    revalidatePath(`/admin/inquiries/${inquiryId}`);
    revalidatePath('/admin/inquiries');
    return { success: true };
  } catch (error) {
    console.error('Update inquiry status error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다',
    };
  }
}

/**
 * 관리자 응답 추가
 */
export async function addAdminResponse(
  inquiryId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    // 응답 추가
    const { error: responseError } = await supabase.from('cs_responses').insert({
      inquiry_id: inquiryId,
      responder_type: 'admin',
      content: content.trim(),
    });

    if (responseError) {
      console.error('Add response error:', responseError);
      return { success: false, error: '응답 추가에 실패했습니다' };
    }

    // 상태가 pending이면 in_progress로 변경
    const { data: inquiry } = await supabase
      .from('cs_inquiries')
      .select('status')
      .eq('id', inquiryId)
      .single();

    if (inquiry?.status === 'pending') {
      await supabase
        .from('cs_inquiries')
        .update({ status: 'in_progress' })
        .eq('id', inquiryId);
    }

    revalidatePath(`/admin/inquiries/${inquiryId}`);
    revalidatePath('/admin/inquiries');
    return { success: true };
  } catch (error) {
    console.error('Add response error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다',
    };
  }
}

/**
 * 우선순위 변경
 */
export async function updateInquiryPriority(
  inquiryId: string,
  priority: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('cs_inquiries')
      .update({ priority })
      .eq('id', inquiryId);

    if (error) {
      console.error('Update inquiry priority error:', error);
      return { success: false, error: '우선순위 변경에 실패했습니다' };
    }

    revalidatePath(`/admin/inquiries/${inquiryId}`);
    revalidatePath('/admin/inquiries');
    return { success: true };
  } catch (error) {
    console.error('Update inquiry priority error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다',
    };
  }
}
