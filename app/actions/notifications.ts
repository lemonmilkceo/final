'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Json } from '@/types/database';

export async function getNotifications() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요해요', data: [] };
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Notifications fetch error:', error);
    return { success: false, error: '알림을 불러오는데 실패했어요', data: [] };
  }

  return { success: true, data: data || [] };
}

export async function getUnreadNotificationCount() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  return count || 0;
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Notification mark as read error:', error);
    return { success: false, error: '알림 읽음 처리에 실패했어요' };
  }

  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Mark all as read error:', error);
    return { success: false, error: '알림 읽음 처리에 실패했어요' };
  }

  return { success: true };
}

// DB 스키마에 정의된 알림 타입
type NotificationType = 'contract_sent' | 'contract_signed' | 'contract_expired_soon' | 'contract_expired' | 'contract_modified';

// 알림 데이터 타입 (JSON으로 저장)
interface NotificationData {
  contractId?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: NotificationData;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    data: params.data as Json | undefined,
    is_read: false,
  });

  if (error) {
    console.error('Create notification error:', error);
    return { success: false, error: '알림 생성에 실패했어요' };
  }

  return { success: true };
}
