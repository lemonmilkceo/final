import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import EmployerDashboard from './employer-dashboard';

// 게스트 모드 체크 함수
async function isGuestMode(): Promise<boolean> {
  const cookieStore = await cookies();
  const guestCookie = cookieStore.get('guest-storage');
  
  if (guestCookie?.value) {
    try {
      const decodedValue = decodeURIComponent(guestCookie.value);
      const guestData = JSON.parse(decodedValue);
      return guestData?.state?.isGuest && guestData?.state?.guestRole === 'employer';
    } catch {
      // JSON 파싱 실패 시 무시
    }
  }
  
  return false;
}

// 샘플 데이터 (게스트 모드용)
const GUEST_SAMPLE_CONTRACTS = [
  {
    id: 'sample-1',
    worker_name: '홍길동',
    hourly_wage: 9860,
    status: 'pending' as const,
    created_at: new Date().toISOString(),
    folder_id: null,
    signatures: [{ signer_role: 'employer' as const, signed_at: new Date().toISOString() }],
  },
  {
    id: 'sample-2',
    worker_name: '김철수',
    hourly_wage: 10000,
    status: 'completed' as const,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    folder_id: null,
    signatures: [
      { signer_role: 'employer' as const, signed_at: new Date().toISOString() },
      { signer_role: 'worker' as const, signed_at: new Date().toISOString() },
    ],
  },
];

export default async function EmployerDashboardPage() {
  // 게스트 모드 체크
  const isGuest = await isGuestMode();
  
  if (isGuest) {
    // 게스트 모드: 샘플 데이터 반환
    return (
      <EmployerDashboard
        profile={{
          name: '게스트 사장님',
          email: null,
          avatarUrl: null,
        }}
        credits={3}
        contracts={GUEST_SAMPLE_CONTRACTS}
        folders={[]}
        isGuestMode={true}
      />
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // 사용자 프로필 조회 (크레딧 포함)
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_url')
    .eq('id', user.id)
    .single();

  // 계약서 크레딧 조회
  const { data: credit } = await supabase
    .from('credits')
    .select('amount')
    .eq('user_id', user.id)
    .eq('credit_type', 'contract')
    .single();

  // 계약서 목록 조회
  const { data: contracts } = await supabase
    .from('contracts')
    .select(
      `
      id,
      worker_name,
      hourly_wage,
      status,
      created_at,
      folder_id,
      signatures (
        signer_role,
        signed_at
      )
    `
    )
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false });

  // 폴더 목록 조회
  const { data: folders } = await supabase
    .from('folders')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  return (
    <EmployerDashboard
      profile={{
        name: profile?.name || '사장님',
        email: user.email,
        avatarUrl: profile?.avatar_url,
      }}
      credits={credit?.amount || 0}
      contracts={contracts || []}
      folders={folders || []}
    />
  );
}
