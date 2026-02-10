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
  {
    id: 'sample-5',
    worker_name: '최유진',
    hourly_wage: 10800,
    status: 'completed' as const,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    folder_id: null,
    signatures: [
      { signer_role: 'employer' as const, signed_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString() },
      { signer_role: 'worker' as const, signed_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'sample-6',
    worker_name: '정하늘',
    hourly_wage: 11500,
    status: 'pending' as const,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    folder_id: null,
    signatures: [
      { signer_role: 'employer' as const, signed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { signer_role: 'worker' as const, signed_at: null },
    ],
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
  workplace_name: string;
  start_date: string;
  end_date: string | null;
  work_days: string[];
  work_start_time: string;
  work_end_time: string;
  break_minutes: number;
  work_location: string;
  job_description: string;
  special_terms: string | null;
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
    workplace_name: '싸인카페 강남점',
    start_date: '2026-01-01',
    end_date: '2026-06-30',
    work_days: ['월', '화', '수', '목', '금'],
    work_start_time: '09:00',
    work_end_time: '18:00',
    break_minutes: 60,
    work_location: '서울 강남구 테헤란로 123, 싸인빌딩 5층',
    job_description: '카페 바리스타 (음료 제조, 매장 청소, 재고 관리)',
    special_terms: '수습 기간 3개월 적용\n비밀유지 의무 동의\n식대 별도 지급',
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
    workplace_name: '카페모카 합정점',
    start_date: '2026-02-01',
    end_date: null,
    work_days: ['토', '일'],
    work_start_time: '10:00',
    work_end_time: '17:00',
    break_minutes: 30,
    work_location: '서울 마포구 합정동 456, 카페모카',
    job_description: '주말 홀서빙 (주문 접수, 음식 서빙, 테이블 정리)',
    special_terms: '근무복 대여 및 반납 조건',
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
    workplace_name: '롯데마트 잠실점',
    start_date: '2026-03-01',
    end_date: '2026-08-31',
    work_days: ['월', '수', '금'],
    work_start_time: '14:00',
    work_end_time: '22:00',
    break_minutes: 60,
    work_location: '서울 송파구 잠실동 789, 롯데마트',
    job_description: '마트 계산원 (상품 계산, 고객 응대, 매장 정리)',
    special_terms: null,
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
  'sample-5': {
    id: 'sample-5',
    worker_name: '최유진',
    hourly_wage: 10800,
    includes_weekly_allowance: true,
    status: 'completed',
    business_size: 'over_5',
    workplace_name: '이마트 반포점',
    start_date: '2025-09-01',
    end_date: '2026-02-28',
    work_days: ['월', '화', '수', '목', '금'],
    work_start_time: '08:00',
    work_end_time: '17:00',
    break_minutes: 60,
    work_location: '서울 서초구 반포동 321, 이마트',
    job_description: '식품 코너 판매 (상품 진열, 재고 관리, 고객 응대)',
    special_terms: '교육 수료 후 일정 기간 근무 의무\n차량 사용 시 유류비 지원',
    pay_day: 5,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: null,
    completed_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    share_token: 'sample-token-5',
    employer: {
      name: '게스트 사장님',
      phone: '010-1234-5678',
    },
    signatures: [
      { id: 'sig-5-1', signer_role: 'employer', signed_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(), signature_data: '' },
      { id: 'sig-5-2', signer_role: 'worker', signed_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), signature_data: '' },
    ],
  },
  'sample-6': {
    id: 'sample-6',
    worker_name: '정하늘',
    hourly_wage: 11500,
    includes_weekly_allowance: false,
    status: 'pending',
    business_size: 'under_5',
    workplace_name: '브런치카페 이태원점',
    start_date: '2026-02-01',
    end_date: null,
    work_days: ['화', '목', '토'],
    work_start_time: '11:00',
    work_end_time: '19:00',
    break_minutes: 45,
    work_location: '서울 용산구 이태원동 55, 브런치카페',
    job_description: '카페 서빙 및 주방 보조 (음료 제조, 서빙, 설거지)',
    special_terms: '수습 기간 3개월 적용\n식대 별도 지급',
    pay_day: 20,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: null,
    share_token: 'sample-token-6',
    employer: {
      name: '게스트 사장님',
      phone: '010-1234-5678',
    },
    signatures: [
      { id: 'sig-6-1', signer_role: 'employer', signed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), signature_data: '' },
      { id: 'sig-6-2', signer_role: 'worker', signed_at: null, signature_data: '' },
    ],
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
