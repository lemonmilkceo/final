/**
 * 애플리케이션 라우트 상수
 * IA.md 문서 기반 정의
 */

// 공통 라우트 (로그인 불필요)
export const PUBLIC_ROUTES = {
  HOME: '/',
  ONBOARDING: '/onboarding',
  LOGIN: '/login',
  SIGNUP: '/signup',
  GUEST: '/guest',
  // 계약서 공유 링크 (토큰 기반)
  CONTRACT_SIGN: (token: string) => `/contract/sign/${token}`,
} as const;

// 인증 관련 라우트
export const AUTH_ROUTES = {
  CALLBACK: '/auth/callback',
  SIGNOUT: '/auth/signout',
} as const;

// 역할 선택 라우트
export const ROLE_ROUTES = {
  SELECT_ROLE: '/select-role',
} as const;

// 사업자(Employer) 라우트
export const EMPLOYER_ROUTES = {
  // 대시보드
  DASHBOARD: '/employer',
  // 계약서 작성
  CREATE: '/employer/create',
  // 계약서 미리보기
  PREVIEW: (id: string) => `/employer/preview/${id}`,
  // 계약서 상세
  CONTRACT: (id: string) => `/employer/contract/${id}`,
  // 채팅
  CHAT: '/employer/chat',
  CHAT_ROOM: (contractId: string) => `/employer/chat/${contractId}`,
} as const;

// 근로자(Worker) 라우트
export const WORKER_ROUTES = {
  // 대시보드
  DASHBOARD: '/worker',
  // 온보딩 (민감정보 입력)
  ONBOARDING: '/worker/onboarding',
  // 계약서 확인/서명
  CONTRACT: (id: string) => `/worker/contract/${id}`,
  // 경력 관리
  CAREER: '/worker/career',
  // 채팅
  CHAT: '/worker/chat',
  CHAT_ROOM: (contractId: string) => `/worker/chat/${contractId}`,
} as const;

// 결제 관련 라우트
export const PAYMENT_ROUTES = {
  PRICING: '/pricing',
  HISTORY: '/payment-history',
} as const;

// 메뉴 시트에서 사용하는 라우트
export const MENU_ROUTES = {
  PROFILE: '/profile',
  PRICING: '/pricing',
  PAYMENT_HISTORY: '/payment-history',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  SIGNOUT: '/auth/signout',
} as const;

// 설정 라우트
export const SETTINGS_ROUTES = {
  PROFILE: '/profile',
} as const;

// 보호된 경로 목록 (미들웨어에서 사용)
export const PROTECTED_PATHS = [
  '/employer',
  '/worker',
  '/select-role',
  '/pricing',
  '/payment-history',
  '/profile',
];

// 역할별 접근 제한 경로
export const ROLE_RESTRICTED_PATHS = {
  employer: ['/employer'],
  worker: ['/worker'],
} as const;

// 통합 ROUTES 객체 (편의를 위해 사용)
export const ROUTES = {
  // Public
  HOME: PUBLIC_ROUTES.HOME,
  ONBOARDING: PUBLIC_ROUTES.ONBOARDING,
  LOGIN: PUBLIC_ROUTES.LOGIN,
  SIGNUP: PUBLIC_ROUTES.SIGNUP,
  GUEST_SELECT_ROLE: PUBLIC_ROUTES.GUEST,
  CONTRACT_SIGN: PUBLIC_ROUTES.CONTRACT_SIGN,

  // Auth
  AUTH_CALLBACK: AUTH_ROUTES.CALLBACK,
  AUTH_SIGNOUT: AUTH_ROUTES.SIGNOUT,

  // Role Selection
  SELECT_ROLE: ROLE_ROUTES.SELECT_ROLE,

  // Employer
  EMPLOYER_DASHBOARD: EMPLOYER_ROUTES.DASHBOARD,
  EMPLOYER_CREATE_CONTRACT: EMPLOYER_ROUTES.CREATE,
  EMPLOYER_PREVIEW_CONTRACT: EMPLOYER_ROUTES.PREVIEW,
  EMPLOYER_CONTRACT_DETAIL: EMPLOYER_ROUTES.CONTRACT,
  EMPLOYER_CHAT: EMPLOYER_ROUTES.CHAT,
  EMPLOYER_CHAT_ROOM: EMPLOYER_ROUTES.CHAT_ROOM,

  // Worker
  WORKER_DASHBOARD: WORKER_ROUTES.DASHBOARD,
  WORKER_ONBOARDING: WORKER_ROUTES.ONBOARDING,
  WORKER_CONTRACT_DETAIL: WORKER_ROUTES.CONTRACT,
  WORKER_CAREER: WORKER_ROUTES.CAREER,
  WORKER_CHAT: WORKER_ROUTES.CHAT,
  WORKER_CHAT_ROOM: WORKER_ROUTES.CHAT_ROOM,

  // Payment
  PRICING: PAYMENT_ROUTES.PRICING,
  PAYMENT_HISTORY: PAYMENT_ROUTES.HISTORY,

  // Settings
  PROFILE: SETTINGS_ROUTES.PROFILE,
} as const;
