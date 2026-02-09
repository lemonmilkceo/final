'use server';

import { createClient } from '@/lib/supabase/server';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'notice' | 'popup' | 'banner';
  target_roles: string[] | null;
  priority: number;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  link_url: string | null;
  link_text: string | null;
  created_at: string;
}

/**
 * 현재 활성화된 공지사항 조회
 * - is_active = true
 * - starts_at <= 현재 시간
 * - ends_at이 없거나 ends_at >= 현재 시간
 * - target_roles에 해당 역할 포함 (또는 null이면 전체 대상)
 */
export async function getActiveAnnouncements(userRole?: string): Promise<Announcement[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  let query = supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .lte('starts_at', now)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('공지사항 조회 오류:', error);
    return [];
  }

  // 필터링: ends_at이 없거나 아직 유효한 것만
  const validAnnouncements = (data || []).filter((a) => {
    if (a.ends_at && new Date(a.ends_at) < new Date()) {
      return false;
    }
    return true;
  });

  // 역할 필터링
  const roleFilteredAnnouncements = validAnnouncements.filter((a) => {
    if (!a.target_roles || a.target_roles.length === 0) {
      return true; // 전체 대상
    }
    if (!userRole) {
      return false; // 역할이 없으면 특정 역할 대상 공지 제외
    }
    return a.target_roles.includes(userRole);
  });

  return roleFilteredAnnouncements as Announcement[];
}

/**
 * 공지사항 조회 기록 (팝업 "다시 보지 않기" 등에 활용)
 */
export async function markAnnouncementViewed(announcementId: string, dismissed: boolean = false) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다' };
  }

  // upsert로 처리 (이미 있으면 업데이트)
  const { error } = await supabase
    .from('announcement_views')
    .upsert(
      {
        announcement_id: announcementId,
        user_id: user.id,
        viewed_at: new Date().toISOString(),
        dismissed,
      },
      {
        onConflict: 'announcement_id,user_id',
      }
    );

  if (error) {
    console.error('공지사항 조회 기록 오류:', error);
    return { success: false, error: '기록 저장에 실패했습니다' };
  }

  return { success: true };
}

/**
 * 사용자가 이미 본(dismissed) 공지 ID 목록 조회
 */
export async function getDismissedAnnouncementIds(): Promise<string[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('announcement_views')
    .select('announcement_id')
    .eq('user_id', user.id)
    .eq('dismissed', true);

  if (error) {
    console.error('dismissed 공지 조회 오류:', error);
    return [];
  }

  return (data || []).map((d) => d.announcement_id);
}
