import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import PricingPage from './pricing-page';

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

export default async function Pricing() {
  const supabase = await createClient();
  const isGuest = await isGuestMode();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 게스트 모드: 크레딧 0, userId null
  if (isGuest || !user) {
    return (
      <PricingPage
        currentCredits={{
          contract: 0,
        }}
        userId={null}
        isGuestMode={true}
      />
    );
  }

  // 현재 크레딧 조회
  const { data: contractCredit } = await supabase
    .from('credits')
    .select('amount')
    .eq('user_id', user.id)
    .eq('credit_type', 'contract')
    .single();

  return (
    <PricingPage
      currentCredits={{
        contract: contractCredit?.amount || 0,
      }}
      userId={user.id}
      isGuestMode={false}
    />
  );
}
