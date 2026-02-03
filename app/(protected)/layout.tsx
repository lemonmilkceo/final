import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '싸인해주세요',
  description: '계약서 작성부터 서명까지 한 곳에서 간편하게',
};

// 게스트 모드 체크 함수
async function isGuestMode(): Promise<boolean> {
  const cookieStore = await cookies();
  const guestCookie = cookieStore.get('guest-storage');
  
  if (guestCookie?.value) {
    try {
      const decodedValue = decodeURIComponent(guestCookie.value);
      const guestData = JSON.parse(decodedValue);
      return guestData?.state?.isGuest || false;
    } catch {
      // JSON 파싱 실패 시 무시
    }
  }
  
  return false;
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 게스트 모드 체크 - 게스트면 인증 없이 통과
  const isGuest = await isGuestMode();
  
  if (!isGuest) {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!user || error) {
      redirect('/login');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-mobile bg-white">{children}</div>
    </div>
  );
}
