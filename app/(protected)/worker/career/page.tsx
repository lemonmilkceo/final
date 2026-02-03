import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import CareerList from './career-list';
import { getEffectiveEndDate, calculateWorkDays } from '@/lib/utils/career';

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

// 게스트용 샘플 경력 데이터 생성 함수 (hydration 문제 방지)
function createGuestSampleCareers() {
  const now = Date.now();
  const DAY = 86400000;

  return [
    {
      id: 'career-1',
      worker_name: '게스트',
      hourly_wage: 12000,
      start_date: new Date(now - DAY * 90).toISOString().split('T')[0],
      end_date: null,
      resignation_date: new Date(now - DAY * 30).toISOString().split('T')[0],
      work_location: '서울 강남구 역삼동',
      job_description: '홀 서빙 및 고객 응대',
      completed_at: new Date(now - DAY * 30).toISOString(),
      employer: { name: '맥도날드 선릉점' },
    },
    {
      id: 'career-2',
      worker_name: '게스트',
      hourly_wage: 10500,
      start_date: new Date(now - DAY * 180).toISOString().split('T')[0],
      end_date: new Date(now - DAY * 120).toISOString().split('T')[0],
      resignation_date: null,
      work_location: '서울 강남구 논현동',
      job_description: '계산 및 상품 진열',
      completed_at: new Date(now - DAY * 120).toISOString(),
      employer: { name: '올리브영 강남역점' },
    },
    {
      id: 'career-3',
      worker_name: '게스트',
      hourly_wage: 11000,
      start_date: new Date(now - DAY * 270).toISOString().split('T')[0],
      end_date: null,
      resignation_date: null,
      work_location: '서울 서초구 서초동',
      job_description: '음료 제조 및 홀 정리',
      completed_at: new Date(now - DAY * 200).toISOString(),
      employer: { name: '스타벅스 교대점' },
    },
  ];
}

export default async function CareerPage() {
  const supabase = await createClient();

  // 먼저 로그인 여부 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인되어 있지 않을 때만 게스트 모드 체크
  const isGuest = !user && (await isGuestMode());

  if (isGuest) {
    // 게스트 모드: 샘플 데이터 반환 (함수 내에서 날짜 계산하여 hydration 문제 방지)
    const guestCareers = createGuestSampleCareers();
    const totalDays = 60 + 60 + 70; // 샘플 근무일수 합계
    return (
      <CareerList
        contracts={guestCareers}
        totalDays={totalDays}
        totalContracts={guestCareers.length}
        isGuestMode={true}
      />
    );
  }

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 완료된 계약서 목록 조회 (경력용)
  const { data: contracts } = await supabase
    .from('contracts')
    .select(
      `
      id,
      worker_name,
      hourly_wage,
      start_date,
      end_date,
      resignation_date,
      work_location,
      job_description,
      completed_at,
      employer:profiles!contracts_employer_id_fkey (
        name
      )
    `
    )
    .eq('worker_id', user.id)
    .eq('status', 'completed')
    .order('start_date', { ascending: false });

  // 총 근무 기간 계산 (resignation_date 우선)
  let totalDays = 0;
  contracts?.forEach((contract) => {
    const days = calculateWorkDays({
      start_date: contract.start_date,
      end_date: contract.end_date,
      resignation_date: contract.resignation_date,
    });
    totalDays += days;
  });

  return (
    <CareerList
      contracts={contracts || []}
      totalDays={totalDays}
      totalContracts={contracts?.length || 0}
    />
  );
}
