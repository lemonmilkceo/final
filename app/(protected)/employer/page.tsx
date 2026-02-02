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

// 샘플 데이터 (게스트 모드용) - sampleData.ts의 SAMPLE_CONTRACT_DETAILS와 일치
const GUEST_SAMPLE_CONTRACTS = [
  {
    id: 'sample-1',
    worker_name: '김민수',
    work_location: '싸인카페 강남점',
    hourly_wage: 10360,
    status: 'completed' as const,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    completed_at: new Date(Date.now() - 5 * 86400000).toISOString(), // 5일 전 완료 (수정 가능)
    folder_id: null,
    signatures: [
      { signer_role: 'employer' as const, signed_at: new Date(Date.now() - 6 * 86400000).toISOString() },
      { signer_role: 'worker' as const, signed_at: new Date(Date.now() - 5 * 86400000).toISOString() },
    ],
  },
  {
    id: 'sample-2',
    worker_name: '이서연',
    work_location: '카페모카 합정점',
    hourly_wage: 11000,
    status: 'pending' as const,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    completed_at: null,
    folder_id: null,
    signatures: [{ signer_role: 'employer' as const, signed_at: new Date(Date.now() - 2 * 86400000).toISOString() }],
  },
  {
    id: 'sample-3',
    worker_name: '박지훈',
    work_location: '롯데마트 잠실점',
    hourly_wage: 12000,
    status: 'draft' as const,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    completed_at: null,
    folder_id: null,
    signatures: [],
  },
  {
    id: 'sample-5',
    worker_name: '최유진',
    work_location: '이마트 반포점',
    hourly_wage: 10800,
    status: 'completed' as const,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    completed_at: new Date(Date.now() - 12 * 86400000).toISOString(), // 12일 전 완료 (수정 불가)
    folder_id: null,
    signatures: [
      { signer_role: 'employer' as const, signed_at: new Date(Date.now() - 13 * 86400000).toISOString() },
      { signer_role: 'worker' as const, signed_at: new Date(Date.now() - 12 * 86400000).toISOString() },
    ],
  },
  {
    id: 'sample-6',
    worker_name: '정하늘',
    work_location: '브런치카페 이태원점',
    hourly_wage: 11500,
    status: 'pending' as const,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    completed_at: null,
    folder_id: null,
    signatures: [{ signer_role: 'employer' as const, signed_at: new Date(Date.now() - 3 * 86400000).toISOString() }],
  },
];

export default async function EmployerDashboardPage() {
  const supabase = await createClient();

  // 먼저 로그인 여부 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인되어 있지 않을 때만 게스트 모드 체크
  const isGuest = !user && await isGuestMode();
  
  if (isGuest) {
    // 게스트 모드: 샘플 데이터 반환
    return (
      <EmployerDashboard
        profile={{
          name: '게스트 사장',
          email: null,
          avatarUrl: null,
        }}
        credits={{
          contract: 5,
        }}
        contracts={GUEST_SAMPLE_CONTRACTS}
        folders={[]}
        isGuestMode={true}
      />
    );
  }

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
  const { data: contractCredit } = await supabase
    .from('credits')
    .select('amount')
    .eq('user_id', user.id)
    .eq('credit_type', 'contract')
    .single();

  // 활성 계약서 목록 조회 (삭제되지 않은 것만)
  const { data: contracts } = await supabase
    .from('contracts')
    .select(
      `
      id,
      worker_name,
      work_location,
      hourly_wage,
      status,
      created_at,
      completed_at,
      folder_id,
      signatures (
        signer_role,
        signed_at
      )
    `
    )
    .eq('employer_id', user.id)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  // 삭제된 계약서 조회 (휴지통용)
  const { data: deletedContracts } = await supabase
    .from('contracts')
    .select(
      `
      id,
      worker_name,
      work_location,
      hourly_wage,
      status,
      created_at,
      deleted_at,
      folder_id,
      signatures (
        signer_role,
        signed_at
      )
    `
    )
    .eq('employer_id', user.id)
    .eq('status', 'deleted')
    .order('deleted_at', { ascending: false });

  // 폴더 목록 조회 (color 컬럼 포함)
  const { data: folders } = await supabase
    .from('folders')
    .select('id, name, color')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  // 색상 팔레트 (color가 없는 폴더용 fallback)
  const colorPalette = [
    '#3B82F6', '#22C55E', '#EAB308', '#F97316',
    '#EF4444', '#A855F7', '#EC4899', '#6B7280',
  ];

  // 폴더별 계약서 수 계산 (활성 계약서만)
  const foldersWithCount = (folders || []).map((folder, index) => {
    const count = (contracts || []).filter((c) => c.folder_id === folder.id).length;
    return {
      id: folder.id,
      name: folder.name,
      color: folder.color || colorPalette[index % colorPalette.length],
      contractCount: count,
    };
  });

  // 미분류 계약서 수 (활성 계약서 중)
  const unfiledCount = (contracts || []).filter((c) => c.folder_id === null).length;

  // 휴지통 계약서 수
  const deletedCount = deletedContracts?.length || 0;

  return (
    <EmployerDashboard
      profile={{
        name: profile?.name || '사장님',
        email: user.email,
        avatarUrl: profile?.avatar_url,
      }}
      credits={{
        contract: contractCredit?.amount || 0,
      }}
      contracts={contracts || []}
      deletedContracts={deletedContracts || []}
      folders={foldersWithCount}
      unfiledCount={unfiledCount}
      deletedCount={deletedCount}
    />
  );
}
