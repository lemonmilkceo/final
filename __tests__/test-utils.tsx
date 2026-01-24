import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 테스트용 QueryClient
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

// AllProviders 래퍼
function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// 커스텀 render 함수
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

// re-export everything from testing-library
export * from '@testing-library/react';

// override render method
export { customRender as render };

// 테스트용 mock 데이터
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {
    name: '테스트 사용자',
    avatar_url: 'https://example.com/avatar.png',
  },
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
};

export const mockContract = {
  id: 'test-contract-id',
  employer_id: 'test-employer-id',
  worker_name: '홍길동',
  hourly_wage: 12000,
  includes_weekly_allowance: true,
  start_date: '2026-01-01',
  end_date: '2026-12-31',
  work_days: ['월', '화', '수', '목', '금'],
  work_days_per_week: null,
  work_start_time: '09:00',
  work_end_time: '18:00',
  break_minutes: 60,
  work_location: '서울시 강남구',
  job_description: '서빙',
  pay_day: 10,
  business_size: 'over_5',
  status: 'draft',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

export const mockProfile = {
  id: 'test-user-id',
  kakao_id: '12345',
  email: 'test@example.com',
  name: '테스트 사용자',
  avatar_url: 'https://example.com/avatar.png',
  role: 'employer',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

// 지연 유틸
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
