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
    worker_name: '박지훈',
    work_location: 'GS25 잠실역점',
    hourly_wage: 12000,
    status: 'draft' as const,
    created_at: new Date().toISOString(),
    folder_id: null,
    signatures: [],
  },
  {
    id: 'sample-2',
    worker_name: '장민서',
    work_location: '홍대 프차',
    hourly_wage: 11000,
    status: 'pending' as const,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    folder_id: null,
    signatures: [{ signer_role: 'employer' as const, signed_at: new Date().toISOString() }],
  },
  {
    id: 'sample-3',
    worker_name: '김서연',
    work_location: '연남동 감성카페',
    hourly_wage: 10500,
    status: 'pending' as const,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    folder_id: null,
    signatures: [{ signer_role: 'employer' as const, signed_at: new Date().toISOString() }],
  },
  {
    id: 'sample-4',
    worker_name: '이수빈',
    work_location: '서초 네일샵',
    hourly_wage: 11500,
    status: 'pending' as const,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    folder_id: null,
    signatures: [{ signer_role: 'employer' as const, signed_at: new Date().toISOString() }],
  },
  {
    id: 'sample-5',
    worker_name: '최유진',
    work_location: '역삼 직화삼겹',
    hourly_wage: 10360,
    status: 'completed' as const,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    folder_id: null,
    signatures: [
      { signer_role: 'employer' as const, signed_at: new Date(Date.now() - 7 * 86400000).toISOString() },
      { signer_role: 'worker' as const, signed_at: new Date(Date.now() - 6 * 86400000).toISOString() },
    ],
  },
  {
    id: 'sample-6',
    worker_name: '한예린',
    work_location: '이태원 브런치클럽',
    hourly_wage: 12500,
    status: 'completed' as const,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    folder_id: null,
    signatures: [
      { signer_role: 'employer' as const, signed_at: new Date(Date.now() - 14 * 86400000).toISOString() },
      { signer_role: 'worker' as const, signed_at: new Date(Date.now() - 13 * 86400000).toISOString() },
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

  // 계약서 목록 조회 (work_location 추가)
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
  // 주의: color 컬럼이 DB에 없는 경우 기본값 사용
  const { data: folders } = await supabase
    .from('folders')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  // 색상 팔레트 (color가 없는 폴더용 fallback)
  const colorPalette = [
    '#3B82F6', '#22C55E', '#EAB308', '#F97316',
    '#EF4444', '#A855F7', '#EC4899', '#6B7280',
  ];

  // 폴더별 계약서 수 계산
  const foldersWithCount = (folders || []).map((folder, index) => {
    const count = (contracts || []).filter((c) => c.folder_id === folder.id).length;
    return {
      id: folder.id,
      name: folder.name,
      color: colorPalette[index % colorPalette.length], // 인덱스 기반 색상
      contractCount: count,
    };
  });

  // 미분류 계약서 수
  const unfiledCount = (contracts || []).filter((c) => c.folder_id === null).length;

  return (
    <EmployerDashboard
      profile={{
        name: profile?.name || '사장님',
        email: user.email,
        avatarUrl: profile?.avatar_url,
      }}
      credits={credit?.amount || 0}
      contracts={contracts || []}
      folders={foldersWithCount}
      unfiledCount={unfiledCount}
    />
  );
}
