import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import React from 'react';
import { ROUTES } from '@/lib/constants/routes';

// 게스트 모드 체크 함수
async function isGuestMode(): Promise<{ isGuest: boolean; guestRole: string | null }> {
  const cookieStore = await cookies();
  const guestCookie = cookieStore.get('guest-storage');
  
  if (guestCookie?.value) {
    try {
      const decodedValue = decodeURIComponent(guestCookie.value);
      const guestData = JSON.parse(decodedValue);
      return {
        isGuest: guestData?.state?.isGuest || false,
        guestRole: guestData?.state?.guestRole || null,
      };
    } catch {
      // JSON 파싱 실패 시 무시
    }
  }
  
  return { isGuest: false, guestRole: null };
}

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인되어 있지 않을 때만 게스트 모드 체크
  if (!user) {
    const { isGuest, guestRole } = await isGuestMode();
    
    if (isGuest && guestRole === 'employer') {
      // 게스트 모드 사업자인 경우 인증 없이 통과
      return <>{children}</>;
    }
  }

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 역할 체크
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile?.role) {
    redirect(ROUTES.SELECT_ROLE);
  }

  // 역할 전환 기능 도입으로 역할 강제 리다이렉트 제거
  // 사용자는 employer/worker 경로 모두 접근 가능

  return <>{children}</>;
}
