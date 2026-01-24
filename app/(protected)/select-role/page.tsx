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

  // 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single();

  // 이미 역할이 설정된 경우 해당 대시보드로 리다이렉트
  if (profile?.role) {
    redirect(`/${profile.role}`);
  }

  // 카카오에서 가져온 이름 (raw_user_meta_data에서)
  const kakaoName = user.user_metadata?.name || 
                    user.user_metadata?.full_name || 
                    profile?.name;

  return <RoleSelector userName={kakaoName} />;
}
