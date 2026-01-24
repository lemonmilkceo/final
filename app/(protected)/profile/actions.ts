'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface UpdateProfileData {
  name: string;
  phone?: string;
}

export async function updateProfile(data: UpdateProfileData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      name: data.name,
      phone: data.phone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('프로필 업데이트 오류:', error);
    return { success: false, error: '프로필 업데이트에 실패했습니다.' };
  }

  revalidatePath('/profile');
  revalidatePath('/employer');
  revalidatePath('/worker');

  return { success: true };
}

export async function getProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.', data: null };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, name, phone, role, avatar_url, created_at')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('프로필 조회 오류:', error);
    return { success: false, error: '프로필 조회에 실패했습니다.', data: null };
  }

  return { success: true, data: profile };
}
