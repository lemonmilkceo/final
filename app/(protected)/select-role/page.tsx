import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RoleSelector } from './role-selector';

export default async function SelectRolePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 이미 역할이 설정된 경우 해당 대시보드로 리다이렉트
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role) {
    redirect(`/${profile.role}`);
  }

  return <RoleSelector />;
}
