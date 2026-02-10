import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import WorkerContractDetail from './contract-detail';

interface ContractDetailPageProps {
  params: Promise<{ id: string }>;
}

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

// 게스트 모드용 샘플 계약서 데이터 생성 함수 (hydration 문제 방지)
function createSampleContracts() {
  const now = Date.now();
  const DAY = 86400000;

  return {
    'sample-pending': {
      id: 'sample-pending',
      worker_name: '홍길동',
      workplace_name: '스타벅스 강남점',
      wage_type: 'hourly',
      hourly_wage: 12500,
      monthly_wage: null,
      includes_weekly_allowance: false,
      start_date: '2026-02-01',
      end_date: null,
      resignation_date: null,
      work_days: ['월', '화', '수', '목', '금'],
      work_days_per_week: null,
      work_start_time: '14:00',
      work_end_time: '20:00',
      break_minutes: 30,
      work_location: '서울시 강남구 테헤란로 123',
      job_description: '음료 제조 (바리스타)',
      special_terms: '수습 기간 3개월 적용\n식대 별도 지급',
      pay_day: 10,
      payment_timing: 'next_month',
      is_last_day_payment: false,
      business_size: 'over_5',
      status: 'pending' as const,
      expires_at: new Date(now + 2 * DAY).toISOString(),
      created_at: new Date(now).toISOString(),
      signatures: [
        {
          id: 'sig-employer-1',
          signer_role: 'employer' as const,
          signed_at: new Date(now).toISOString(),
          signature_data:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        },
      ],
      employer: {
        id: 'sample-employer',
        name: '김사장',
        phone: '010-1234-5678',
      },
    },
    'sample-completed': {
      id: 'sample-completed',
      worker_name: '홍길동',
      workplace_name: '투썸플레이스 역삼점',
      wage_type: 'hourly',
      hourly_wage: 11000,
      monthly_wage: null,
      includes_weekly_allowance: false,
      start_date: '2025-06-01',
      end_date: '2025-12-31',
      resignation_date: null,
      work_days: ['월', '화', '수', '목', '금'],
      work_days_per_week: null,
      work_start_time: '09:00',
      work_end_time: '15:00',
      break_minutes: 30,
      work_location: '서울시 강남구 역삼로 456',
      job_description: '홀 서빙 및 고객 응대',
      special_terms: '근무복 대여 및 반납 조건\n비밀유지 의무 동의',
      pay_day: 25,
      payment_timing: 'current_month',
      is_last_day_payment: false,
      business_size: 'under_5',
      status: 'completed' as const,
      expires_at: null,
      created_at: '2025-05-20T10:00:00Z',
      signatures: [
        {
          id: 'sig-employer-2',
          signer_role: 'employer' as const,
          signed_at: '2025-05-20T10:00:00Z',
          signature_data:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        },
        {
          id: 'sig-worker-2',
          signer_role: 'worker' as const,
          signed_at: '2025-05-21T14:30:00Z',
          signature_data:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        },
      ],
      employer: {
        id: 'sample-employer-2',
        name: '이사장',
        phone: '010-9876-5432',
      },
    },
  };
}

export default async function ContractDetailPage({
  params,
}: ContractDetailPageProps) {
  const { id } = await params;
  const isGuest = await isGuestMode();

  // 게스트 모드: 샘플 데이터 반환 (함수 내에서 날짜 계산하여 hydration 문제 방지)
  if (isGuest) {
    const sampleContracts = createSampleContracts();
    const sampleContract = sampleContracts[id as keyof typeof sampleContracts];

    if (!sampleContract) {
      // 샘플에 없는 ID면 대기중 샘플로 대체
      return (
        <WorkerContractDetail
          contract={sampleContracts['sample-pending']}
          isGuestMode={true}
        />
      );
    }

    return (
      <WorkerContractDetail contract={sampleContract} isGuestMode={true} />
    );
  }

  // 일반 모드: DB에서 조회
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // 계약서 조회
  const { data: contract, error } = await supabase
    .from('contracts')
    .select(
      `
      *,
      signatures (
        id,
        signer_role,
        signed_at,
        signature_data
      ),
      employer:profiles!contracts_employer_id_fkey (
        id,
        name,
        phone
      )
    `
    )
    .eq('id', id)
    .eq('worker_id', user.id)
    .single();

  if (error || !contract) {
    notFound();
  }

  // contract_type 타입 단언
  const typedContract = {
    ...contract,
    contract_type: contract.contract_type as 'regular' | 'contract' | undefined,
  };

  return <WorkerContractDetail contract={typedContract} isGuestMode={false} userId={user.id} />;
}
