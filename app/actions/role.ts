'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type UserRole = 'employer' | 'worker';

interface SwitchRoleResult {
  success: boolean;
  redirectTo?: string;
  error?: string;
}

/**
 * 사용자 역할 전환
 * @param newRole 전환할 역할
 * @returns 성공 여부와 리다이렉트 경로
 */
export async function switchRole(newRole: UserRole): Promise<SwitchRoleResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  // 현재 역할 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === newRole) {
    // 이미 같은 역할이면 해당 대시보드로 이동만
    return { success: true, redirectTo: `/${newRole}` };
  }

  // 역할 업데이트
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    return { success: false, error: '역할 전환에 실패했습니다.' };
  }

  // 캐시 무효화
  revalidatePath('/');
  revalidatePath('/employer');
  revalidatePath('/worker');

  // 성공 - 클라이언트에서 리다이렉트 처리
  return { success: true, redirectTo: `/${newRole}` };
}

/**
 * 현재 사용자의 역할 조회
 */
export async function getCurrentRole(): Promise<UserRole | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role as UserRole | null;
}
