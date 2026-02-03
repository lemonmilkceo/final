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

  // OAuth Provider에서 가져온 이름
  const getUserName = (): string | null => {
    const metadata = user.user_metadata;

    // 카카오: name 또는 full_name (문자열)
    if (typeof metadata?.name === 'string' && metadata.name) {
      return metadata.name;
    }
    if (typeof metadata?.full_name === 'string' && metadata.full_name) {
      return metadata.full_name;
    }

    // Apple: name 객체 { firstName, lastName }
    if (metadata?.name && typeof metadata.name === 'object') {
      const appleNameObj = metadata.name as {
        firstName?: string;
        lastName?: string;
      };
      const firstName = appleNameObj.firstName || '';
      const lastName = appleNameObj.lastName || '';
      const fullName = `${lastName}${firstName}`.trim();
      if (fullName) return fullName;
    }

    // Apple 대체: full_name 객체
    if (metadata?.full_name && typeof metadata.full_name === 'object') {
      const nameObj = metadata.full_name as {
        firstName?: string;
        lastName?: string;
      };
      const firstName = nameObj.firstName || '';
      const lastName = nameObj.lastName || '';
      const fullName = `${lastName}${firstName}`.trim();
      if (fullName) return fullName;
    }

    // DB 프로필에서 가져오기
    if (profile?.name) {
      return profile.name;
    }

    return null;
  };

  const userName = getUserName();

  return <RoleSelector userName={userName} />;
}
