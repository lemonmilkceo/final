'use server';

import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * 공지사항 생성
 */
export async function createAnnouncement(formData: {
  title: string;
  content: string;
  type: string;
  targetRoles: string[];
  priority: number;
  startsAt: string;
  endsAt: string | null;
  linkUrl: string | null;
  linkText: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    const { error } = await supabase.from('announcements').insert({
      title: formData.title.trim(),
      content: formData.content.trim(),
      type: formData.type,
      target_roles: formData.targetRoles,
      priority: formData.priority,
      starts_at: formData.startsAt || new Date().toISOString(),
      ends_at: formData.endsAt || null,
      link_url: formData.linkUrl || null,
      link_text: formData.linkText || null,
      created_by: 'admin',
    });

    if (error) {
      console.error('Create announcement error:', error);
      return { success: false, error: '공지사항 생성에 실패했습니다' };
    }

    revalidatePath('/admin/announcements');
    return { success: true };
  } catch (error) {
    console.error('Create announcement error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다',
    };
  }
}

/**
 * 공지사항 활성화/비활성화
 */
export async function toggleAnnouncement(
  announcementId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('announcements')
      .update({ is_active: isActive })
      .eq('id', announcementId);

    if (error) {
      console.error('Toggle announcement error:', error);
      return { success: false, error: '처리에 실패했습니다' };
    }

    revalidatePath('/admin/announcements');
    return { success: true };
  } catch (error) {
    console.error('Toggle announcement error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다',
    };
  }
}

/**
 * 공지사항 삭제
 */
export async function deleteAnnouncement(
  announcementId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId);

    if (error) {
      console.error('Delete announcement error:', error);
      return { success: false, error: '삭제에 실패했습니다' };
    }

    revalidatePath('/admin/announcements');
    return { success: true };
  } catch (error) {
    console.error('Delete announcement error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다',
    };
  }
}
