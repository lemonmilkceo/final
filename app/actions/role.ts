'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export type UserRole = 'employer' | 'worker';

/**
 * 사용자 역할 전환
 * @param newRole 전환할 역할
 */
export async function switchRole(newRole: UserRole) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  // 현재 역할 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === newRole) {
    // 이미 같은 역할이면 해당 대시보드로 이동만
    redirect(`/${newRole}`);
  }

  // 역할 업데이트
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    throw new Error('역할 전환에 실패했습니다.');
  }

  // 캐시 무효화
  revalidatePath('/');
  revalidatePath('/employer');
  revalidatePath('/worker');

  // 새 역할 대시보드로 리다이렉트
  redirect(`/${newRole}`);
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
