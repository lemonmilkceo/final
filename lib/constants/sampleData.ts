/**
 * 게스트 모드 샘플 데이터
 */

// 사장님 샘플 계약서 (목록용)
export const SAMPLE_EMPLOYER_CONTRACTS = [
  {
    id: 'sample-1',
    worker_name: '김민수',
    hourly_wage: 10360,
    status: 'completed' as const,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    folder_id: null,
    signatures: [
      { signer_role: 'employer' as const, signed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
      { signer_role: 'worker' as const, signed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'sample-2',
    worker_name: '이서연',
    hourly_wage: 11000,
    status: 'pending' as const,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    folder_id: null,
    signatures: [
      { signer_role: 'employer' as const, signed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { signer_role: 'worker' as const, signed_at: null },
    ],
  },
  {
    id: 'sample-3',
    worker_name: '박지훈',
    hourly_wage: 12000,
    status: 'draft' as const,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    folder_id: null,
    signatures: [],
  },
];

// 사장님 샘플 계약서 상세 (상세 페이지용)
export const SAMPLE_CONTRACT_DETAILS: Record<string, {
  id: string;
  worker_name: string;
  hourly_wage: number;
  includes_weekly_allowance: boolean;
  status: 'draft' | 'pending' | 'completed' | 'expired' | 'deleted';
  business_size: 'under_5' | 'over_5';
  start_date: string;
  end_date: string | null;
  work_days: string[];
  work_start_time: string;
  work_end_time: string;
  break_minutes: number;
  work_location: string;
  job_description: string;
  pay_day: number;
  created_at: string;
  expires_at: string | null;
  completed_at: string | null;
  share_token: string;
  employer: {
    name: string;
    phone: string | null;
  };
  signatures: {
    id: string;
    signer_role: 'employer' | 'worker';
    signed_at: string | null;
    signature_data: string;
  }[];
}> = {
  'sample-1': {
    id: 'sample-1',
    worker_name: '김민수',
    hourly_wage: 10360,
    includes_weekly_allowance: true,
    status: 'completed',
    business_size: 'over_5',
    start_date: '2026-01-01',
    end_date: '2026-06-30',
    work_days: ['월', '화', '수', '목', '금'],
    work_start_time: '09:00',
    work_end_time: '18:00',
    break_minutes: 60,
    work_location: '서울 강남구 테헤란로 123, 싸인빌딩 5층',
    job_description: '카페 바리스타 (음료 제조, 매장 청소, 재고 관리)',
    pay_day: 10,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: null,
    completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    share_token: 'sample-token-1',
    employer: {
      name: '게스트 사장님',
      phone: '010-1234-5678',
    },
    signatures: [
      { id: 'sig-1-1', signer_role: 'employer', signed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), signature_data: '' },
      { id: 'sig-1-2', signer_role: 'worker', signed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), signature_data: '' },
    ],
  },
  'sample-2': {
    id: 'sample-2',
    worker_name: '이서연',
    hourly_wage: 11000,
    includes_weekly_allowance: false,
    status: 'pending',
    business_size: 'under_5',
    start_date: '2026-02-01',
    end_date: null,
    work_days: ['토', '일'],
    work_start_time: '10:00',
    work_end_time: '17:00',
    break_minutes: 30,
    work_location: '서울 마포구 합정동 456, 카페모카',
    job_description: '주말 홀서빙 (주문 접수, 음식 서빙, 테이블 정리)',
    pay_day: 25,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: null,
    share_token: 'sample-token-2',
    employer: {
      name: '게스트 사장님',
      phone: '010-1234-5678',
    },
    signatures: [
      { id: 'sig-2-1', signer_role: 'employer', signed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), signature_data: '' },
      { id: 'sig-2-2', signer_role: 'worker', signed_at: null, signature_data: '' },
    ],
  },
  'sample-3': {
    id: 'sample-3',
    worker_name: '박지훈',
    hourly_wage: 12000,
    includes_weekly_allowance: true,
    status: 'draft',
    business_size: 'over_5',
    start_date: '2026-03-01',
    end_date: '2026-08-31',
    work_days: ['월', '수', '금'],
    work_start_time: '14:00',
    work_end_time: '22:00',
    break_minutes: 60,
    work_location: '서울 송파구 잠실동 789, 롯데마트',
    job_description: '마트 계산원 (상품 계산, 고객 응대, 매장 정리)',
    pay_day: 15,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: null,
    completed_at: null,
    share_token: 'sample-token-3',
    employer: {
      name: '게스트 사장님',
      phone: '010-1234-5678',
    },
    signatures: [],
  },
};

// 알바생 샘플 계약서
export const SAMPLE_WORKER_CONTRACTS = [
  {
    id: 'sample-w-1',
    employer_name: '스타벅스 강남점',
    hourly_wage: 10500,
    status: 'completed' as const,
    start_date: '2025-03-01',
    end_date: '2025-08-31',
    work_location: '서울 강남구 테헤란로 123',
    job_description: '바리스타',
    total_work_hours: 520,
    total_earnings: 5460000,
    created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sample-w-2',
    employer_name: '투썸플레이스 역삼점',
    hourly_wage: 10200,
    status: 'completed' as const,
    start_date: '2024-09-01',
    end_date: '2025-02-28',
    work_location: '서울 강남구 역삼로 456',
    job_description: '홀서빙',
    total_work_hours: 480,
    total_earnings: 4896000,
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// 알바생 샘플 경력
export const SAMPLE_WORKER_CAREERS = [
  {
    id: 'career-1',
    employer_name: '스타벅스 강남점',
    job_description: '바리스타',
    work_period: '2025.03 - 2025.08',
    total_hours: 520,
    total_earnings: 5460000,
    is_verified: true,
  },
  {
    id: 'career-2',
    employer_name: '투썸플레이스 역삼점',
    job_description: '홀서빙',
    work_period: '2024.09 - 2025.02',
    total_hours: 480,
    total_earnings: 4896000,
    is_verified: true,
  },
];

// 샘플 알림
export const SAMPLE_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'contract_signed' as const,
    title: '계약서가 서명됐어요',
    body: '김민수님이 계약서에 서명했어요',
    is_read: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    type: 'contract_sent' as const,
    title: '계약서가 전송됐어요',
    body: '이서연님에게 계약서를 보냈어요',
    is_read: false,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
