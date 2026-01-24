'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/types';

export async function setUserRole(role: UserRole) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', user.id);

  if (error) {
    console.error('Role update error:', error.message);
    throw new Error('역할 설정에 실패했습니다.');
  }

  // 역할에 따라 적절한 페이지로 리다이렉트
  if (role === 'employer') {
    redirect('/employer');
  } else {
    // 근로자는 온보딩 페이지로 (민감정보 입력)
    redirect('/worker');
  }
}
