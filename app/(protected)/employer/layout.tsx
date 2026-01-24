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
  // 게스트 모드 체크
  const { isGuest, guestRole } = await isGuestMode();
  
  if (isGuest && guestRole === 'employer') {
    // 게스트 모드 사업자인 경우 인증 없이 통과
    return <>{children}</>;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  if (profile.role !== 'employer') {
    redirect(ROUTES.WORKER_DASHBOARD);
  }

  return <>{children}</>;
}
