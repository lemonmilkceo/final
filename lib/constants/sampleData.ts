/**
 * 게스트 모드 샘플 데이터
 */

// 사장님 샘플 계약서
export const SAMPLE_EMPLOYER_CONTRACTS = [
  {
    id: 'sample-1',
    worker_name: '김민수',
    hourly_wage: 10030,
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
