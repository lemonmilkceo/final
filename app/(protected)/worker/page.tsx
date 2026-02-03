import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import WorkerDashboard from './worker-dashboard';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// 게스트 모드 체크 함수
async function isGuestMode(): Promise<boolean> {
  const cookieStore = await cookies();
  const guestCookie = cookieStore.get('guest-storage');

  if (guestCookie?.value) {
    try {
      const decodedValue = decodeURIComponent(guestCookie.value);
      const guestData = JSON.parse(decodedValue);
      return (
        guestData?.state?.isGuest && guestData?.state?.guestRole === 'worker'
      );
    } catch {
      // JSON 파싱 실패 시 무시
    }
  }

  return false;
}

// 샘플 데이터 생성 함수 (서버에서 한 번만 호출하여 hydration 문제 방지)
function createGuestSampleContracts() {
  const now = Date.now();
  const DAY = 86400000;

  return [
    {
      id: 'sample-1',
      worker_name: '게스트',
      hourly_wage: 10360,
      wage_type: 'hourly',
      monthly_wage: null,
      status: 'pending' as const,
      expires_at: new Date(now + DAY * 3).toISOString(),
      created_at: new Date(now).toISOString(),
      employer: { name: '스타벅스 강남점' },
      signatures: [
        {
          signer_role: 'employer' as const,
          signed_at: new Date(now).toISOString(),
        },
      ],
    },
    {
      id: 'sample-2',
      worker_name: '게스트',
      hourly_wage: 11000,
      wage_type: 'hourly',
      monthly_wage: null,
      status: 'pending' as const,
      expires_at: new Date(now + DAY * 7).toISOString(),
      created_at: new Date(now - DAY).toISOString(),
      employer: { name: 'CU 역삼역점' },
      signatures: [
        {
          signer_role: 'employer' as const,
          signed_at: new Date(now).toISOString(),
        },
      ],
    },
    {
      id: 'sample-3',
      worker_name: '게스트',
      hourly_wage: 12000,
      wage_type: 'hourly',
      monthly_wage: null,
      status: 'completed' as const,
      expires_at: null,
      created_at: new Date(now - DAY * 30).toISOString(),
      employer: { name: '맥도날드 선릉점' },
      signatures: [
        {
          signer_role: 'employer' as const,
          signed_at: new Date(now - DAY * 30).toISOString(),
        },
        {
          signer_role: 'worker' as const,
          signed_at: new Date(now - DAY * 29).toISOString(),
        },
      ],
    },
    {
      id: 'sample-4',
      worker_name: '게스트',
      hourly_wage: 10500,
      wage_type: 'hourly',
      monthly_wage: null,
      status: 'completed' as const,
      expires_at: null,
      created_at: new Date(now - DAY * 60).toISOString(),
      employer: { name: '올리브영 강남역점' },
      signatures: [
        {
          signer_role: 'employer' as const,
          signed_at: new Date(now - DAY * 60).toISOString(),
        },
        {
          signer_role: 'worker' as const,
          signed_at: new Date(now - DAY * 59).toISOString(),
        },
      ],
    },
  ];
}

export default async function WorkerDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const showOnboardingComplete = params.onboarding === 'complete';

  const supabase = await createClient();

  // 먼저 로그인 여부 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인되어 있지 않을 때만 게스트 모드 체크
  const isGuest = !user && (await isGuestMode());

  if (isGuest) {
    // 게스트 모드: 샘플 데이터 반환 (함수 내에서 날짜 계산하여 hydration 문제 방지)
    const guestContracts = createGuestSampleContracts();
    return (
      <WorkerDashboard
        profile={{
          name: '게스트 알바생',
          email: null,
          avatarUrl: null,
        }}
        contracts={guestContracts}
        isGuestMode={true}
      />
    );
  }

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_url')
    .eq('id', user.id)
    .single();

  // 온보딩 완료 여부 확인 (user_id로 조회)
  const { data: workerDetails, error: workerDetailsError } = await supabase
    .from('worker_details')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  // 디버그 로그
  if (workerDetailsError && workerDetailsError.code !== 'PGRST116') {
    console.error('Worker details fetch error:', workerDetailsError);
  }

  // 온보딩 미완료 시 - 첫 방문이면 온보딩으로, 아니면 대시보드 유지
  // (건너뛰기를 허용하기 위해 강제 리다이렉트 제거)
  const isOnboardingComplete = !!workerDetails;

  // 숨긴 계약서 ID 목록 조회
  const { data: hiddenContracts } = await supabase
    .from('worker_hidden_contracts')
    .select('contract_id, hidden_at')
    .eq('worker_id', user.id);

  const hiddenContractIds = new Set(
    (hiddenContracts || []).map((h) => h.contract_id)
  );
  const hiddenAtMap = new Map(
    (hiddenContracts || []).map((h) => [h.contract_id, h.hidden_at])
  );

  // 전체 계약서 목록 조회 (worker_id로)
  const { data: allContracts } = await supabase
    .from('contracts')
    .select(
      `
      id,
      worker_name,
      wage_type,
      hourly_wage,
      monthly_wage,
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

  // 활성 계약서 (숨기지 않은 것)
  const activeContracts = (allContracts || []).filter(
    (c) => !hiddenContractIds.has(c.id)
  );

  // 숨긴 계약서 (hidden_at 추가)
  const hiddenContractsList = (allContracts || [])
    .filter((c) => hiddenContractIds.has(c.id))
    .map((c) => ({
      ...c,
      hidden_at: hiddenAtMap.get(c.id) || null,
    }));

  return (
    <WorkerDashboard
      profile={{
        name: profile?.name || '알바생',
        email: user.email,
        avatarUrl: profile?.avatar_url,
      }}
      contracts={activeContracts}
      hiddenContracts={hiddenContractsList}
      hiddenCount={hiddenContractsList.length}
      showOnboardingComplete={showOnboardingComplete}
      isOnboardingComplete={isOnboardingComplete}
    />
  );
}
