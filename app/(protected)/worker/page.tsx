import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import WorkerDashboard from './worker-dashboard';

// 게스트 모드 체크 함수
async function isGuestMode(): Promise<boolean> {
  const cookieStore = await cookies();
  const guestCookie = cookieStore.get('guest-storage');
  
  if (guestCookie?.value) {
    try {
      const decodedValue = decodeURIComponent(guestCookie.value);
      const guestData = JSON.parse(decodedValue);
      return guestData?.state?.isGuest && guestData?.state?.guestRole === 'worker';
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
    worker_name: '게스트',
    hourly_wage: 10360,
    status: 'pending' as const,
    expires_at: new Date(Date.now() + 86400000 * 3).toISOString(), // 3일 후
    created_at: new Date().toISOString(),
    employer: { name: '스타벅스 강남점' },
    signatures: [{ signer_role: 'employer' as const, signed_at: new Date().toISOString() }],
  },
  {
    id: 'sample-2',
    worker_name: '게스트',
    hourly_wage: 11000,
    status: 'pending' as const,
    expires_at: new Date(Date.now() + 86400000 * 7).toISOString(), // 7일 후
    created_at: new Date(Date.now() - 86400000).toISOString(),
    employer: { name: 'CU 역삼역점' },
    signatures: [{ signer_role: 'employer' as const, signed_at: new Date().toISOString() }],
  },
  {
    id: 'sample-3',
    worker_name: '게스트',
    hourly_wage: 12000,
    status: 'completed' as const,
    expires_at: null,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    employer: { name: '맥도날드 선릉점' },
    signatures: [
      { signer_role: 'employer' as const, signed_at: new Date(Date.now() - 86400000 * 30).toISOString() },
      { signer_role: 'worker' as const, signed_at: new Date(Date.now() - 86400000 * 29).toISOString() },
    ],
  },
  {
    id: 'sample-4',
    worker_name: '게스트',
    hourly_wage: 10500,
    status: 'completed' as const,
    expires_at: null,
    created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
    employer: { name: '올리브영 강남역점' },
    signatures: [
      { signer_role: 'employer' as const, signed_at: new Date(Date.now() - 86400000 * 60).toISOString() },
      { signer_role: 'worker' as const, signed_at: new Date(Date.now() - 86400000 * 59).toISOString() },
    ],
  },
];

export default async function WorkerDashboardPage() {
  // 게스트 모드 체크
  const isGuest = await isGuestMode();
  
  if (isGuest) {
    // 게스트 모드: 샘플 데이터 반환
    return (
      <WorkerDashboard
        profile={{
          name: '게스트 알바생',
          email: null,
          avatarUrl: null,
        }}
        contracts={GUEST_SAMPLE_CONTRACTS}
      />
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_url')
    .eq('id', user.id)
    .single();

  // 온보딩 완료 여부 확인
  const { data: workerDetails } = await supabase
    .from('worker_details')
    .select('id')
    .eq('user_id', user.id)
    .single();

  // 온보딩 미완료 시 온보딩 페이지로 이동
  if (!workerDetails) {
    redirect('/worker/onboarding');
  }

  // 계약서 목록 조회 (worker_id로 또는 초대된 계약서)
  const { data: contracts } = await supabase
    .from('contracts')
    .select(
      `
      id,
      worker_name,
      hourly_wage,
      status,
      expires_at,
      created_at,
      employer:profiles!contracts_employer_id_fkey (
        name
      ),
      signatures (
        signer_role,
        signed_at
      )
    `
    )
    .eq('worker_id', user.id)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  return (
    <WorkerDashboard
      profile={{
        name: profile?.name || '알바생',
        email: user.email,
        avatarUrl: profile?.avatar_url,
      }}
      contracts={contracts || []}
    />
  );
}
