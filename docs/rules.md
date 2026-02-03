# 📏 Coding Rules & Technical Guidelines

## 싸인해주세요 (SignPlease)

> **버전**: 1.0  
> **최종 수정일**: 2026년 1월 24일  
> **작성자**: Technical PO

---

## 1. 프로젝트 구조 (Directory Structure)

```
signplease/
├── .env.local                    # 환경 변수 (Git 제외)
├── .env.example                  # 환경 변수 예시
├── next.config.ts                # Next.js 설정
├── tailwind.config.ts            # Tailwind CSS 설정
├── tsconfig.json                 # TypeScript 설정
├── middleware.ts                 # Supabase Auth 미들웨어
│
├── app/                          # App Router
│   ├── layout.tsx                # 루트 레이아웃
│   ├── page.tsx                  # 스플래시 (/)
│   ├── globals.css               # 글로벌 스타일
│   │
│   ├── (public)/                 # 비로그인 접근 가능
│   │   ├── onboarding/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── actions.ts        # Server Actions
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── guest/
│   │   │   └── page.tsx
│   │   └── auth/
│   │       ├── callback/
│   │       │   └── route.ts      # OAuth 콜백
│   │       └── signout/
│   │           └── route.ts      # 로그아웃
│   │
│   ├── (protected)/              # 로그인 필수
│   │   ├── layout.tsx            # 인증 체크 레이아웃
│   │   ├── select-role/
│   │   │   └── page.tsx
│   │   │
│   │   ├── employer/             # 사업자 페이지
│   │   │   ├── page.tsx          # 대시보드
│   │   │   ├── create/
│   │   │   │   ├── page.tsx      # 계약서 작성 퍼널
│   │   │   │   └── actions.ts
│   │   │   ├── preview/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── contract/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── chat/
│   │   │       └── page.tsx
│   │   │
│   │   ├── worker/               # 근로자 페이지
│   │   │   ├── page.tsx          # 대시보드
│   │   │   ├── onboarding/
│   │   │   │   ├── page.tsx
│   │   │   │   └── actions.ts
│   │   │   ├── contract/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── career/
│   │   │   │   └── page.tsx
│   │   │   └── chat/
│   │   │       └── page.tsx
│   │   │
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   ├── payment-history/
│   │   │   └── page.tsx
│   │   └── profile/
│   │       └── page.tsx
│   │
│   └── api/                      # API Routes
│       ├── payment/
│       │   ├── prepare/
│       │   │   └── route.ts
│       │   └── confirm/
│       │       └── route.ts
│       ├── ai-review/
│       │   └── route.ts
│       ├── pdf/
│       │   └── generate/
│       │       └── route.ts
│       └── kakao/
│           └── share/
│               └── route.ts
│
├── components/
│   ├── ui/                       # 기본 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── Toast.tsx
│   │   ├── ProgressBar.tsx
│   │   └── ...
│   │
│   ├── layout/                   # 레이아웃 컴포넌트
│   │   ├── Header.tsx
│   │   ├── TabBar.tsx
│   │   ├── BottomNav.tsx
│   │   └── FAB.tsx
│   │
│   ├── contract/                 # 계약서 관련
│   │   ├── ContractCard.tsx
│   │   ├── ContractPreview.tsx
│   │   ├── SignatureCanvas.tsx
│   │   └── ContractForm/
│   │       ├── Step1BusinessSize.tsx
│   │       ├── Step2WorkerName.tsx
│   │       └── ...
│   │
│   └── shared/                   # 공통 컴포넌트
│       ├── GuestBanner.tsx
│       ├── SignupPromptSheet.tsx
│       └── EmptyState.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # 브라우저 클라이언트
│   │   ├── server.ts             # 서버 클라이언트
│   │   └── middleware.ts         # 미들웨어 유틸
│   │
│   ├── utils/
│   │   ├── format.ts             # 포맷팅 유틸
│   │   ├── validation.ts         # 유효성 검사
│   │   ├── encryption.ts         # 암호화 유틸
│   │   └── date.ts               # 날짜 유틸
│   │
│   └── constants/
│       ├── routes.ts             # 라우트 상수
│       └── config.ts             # 설정 상수
│
├── hooks/                        # Custom Hooks
│   ├── useAuth.ts
│   ├── useProfile.ts
│   ├── useCredits.ts
│   └── useContracts.ts
│
├── stores/                       # Zustand Stores
│   ├── authStore.ts
│   ├── contractFormStore.ts
│   └── guestStore.ts
│
├── types/
│   ├── database.ts               # Supabase 생성 타입
│   ├── contract.ts               # 계약서 타입
│   └── index.ts                  # 공통 타입
│
└── supabase/
    ├── config.toml               # Supabase 로컬 설정
    └── migrations/               # 마이그레이션 파일
        ├── 20260124000001_create_enums.sql
        ├── 20260124000002_create_profiles.sql
        └── ...
```

---

## 2. 환경 변수 (.env)

### 2.1 필수 환경 변수

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 서버 전용 (NEXT_PUBLIC_ 접두사 없음)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 암호화 키 (32바이트, Base64 인코딩) - 필수
ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 주민번호 해시용 솔트 (32바이트, Base64 인코딩) - 프로덕션 필수
# 생성: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
SSN_HASH_SALT=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 토스페이먼츠
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxx
TOSS_SECRET_KEY=test_sk_xxx

# 카카오
NEXT_PUBLIC_KAKAO_JS_KEY=xxx
KAKAO_REST_API_KEY=xxx

# OpenAI (AI 노무사)
OPENAI_API_KEY=sk-xxx

# 앱 URL
NEXT_PUBLIC_APP_URL=https://signplease.kr
```

### 2.2 환경 변수 접근 규칙

| 접두사         | 접근 가능 위치    | 용도                                    |
| -------------- | ----------------- | --------------------------------------- |
| `NEXT_PUBLIC_` | 클라이언트 + 서버 | 공개 가능한 키 (API URL, 클라이언트 키) |
| 없음           | 서버만            | 비밀 키 (서비스 롤 키, 암호화 키)       |

```typescript
// ❌ 잘못된 사용 - 클라이언트에서 서버 전용 키 접근
const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // undefined

// ✅ 올바른 사용 - Server Action 또는 Route Handler에서 접근
export async function serverAction() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // 정상 작동
}
```

---

## 3. 인증 (Authentication)

### 3.1 Supabase SSR Auth 설정

#### 3.1.1 클라이언트 생성 유틸

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출 시 무시
          }
        },
      },
    }
  );
}
```

#### 3.1.2 미들웨어 설정

```typescript
// middleware.ts
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 다음 경로는 제외:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico
     * - 이미지 파일들
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

```typescript
// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// 보호된 경로 (로그인 필수)
const PROTECTED_ROUTES = [
  '/employer',
  '/worker',
  '/select-role',
  '/pricing',
  '/payment-history',
  '/profile',
];

// 역할별 접근 제한 경로
const ROLE_ROUTES = {
  employer: ['/employer'],
  worker: ['/worker'],
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ⚠️ 중요: getSession() 대신 getUser() 사용
  // getSession()은 JWT 서명을 검증하지 않음
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 보호된 경로 체크
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && (!user || error)) {
    // 로그인 페이지로 리다이렉트
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 로그인 상태에서 로그인/회원가입 페이지 접근 시 대시보드로
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/employer'; // 또는 역할에 따라 분기
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

#### 3.1.3 카카오 OAuth 설정

```typescript
// app/(public)/login/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signInWithKakao() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      queryParams: {
        // 카카오 추가 동의 항목
        scope: 'profile_nickname profile_image',
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect(data.url);
}
```

```typescript
// app/(public)/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/select-role';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 프로필에서 역할 확인
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        // 역할이 이미 설정된 경우 해당 대시보드로
        if (profile?.role) {
          return NextResponse.redirect(`${origin}/${profile.role}`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 에러 시 로그인 페이지로
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
```

### 3.2 인증 상태 확인 규칙

| 위치             | 사용 함수                    | 안전성               |
| ---------------- | ---------------------------- | -------------------- |
| Server Component | `supabase.auth.getUser()`    | ✅ 안전 (JWT 검증됨) |
| Server Action    | `supabase.auth.getUser()`    | ✅ 안전              |
| Route Handler    | `supabase.auth.getUser()`    | ✅ 안전              |
| Middleware       | `supabase.auth.getUser()`    | ✅ 안전              |
| Client Component | `supabase.auth.getUser()`    | ✅ 안전              |
| 어디서든         | `supabase.auth.getSession()` | ⚠️ 클라이언트 전용   |

```typescript
// ❌ 잘못된 사용 - Server에서 getSession() 사용
export async function Page() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  // session이 조작될 수 있음!
}

// ✅ 올바른 사용 - getUser() 사용
export async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  // JWT가 검증됨
}
```

---

## 4. 데이터 페칭 (Data Fetching)

### 4.1 Server Component에서 데이터 로드

```typescript
// app/(protected)/employer/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function EmployerDashboard() {
  const supabase = await createClient();

  // 인증 확인 (미들웨어에서 이미 체크하지만 이중 확인)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    redirect('/login');
  }

  // 데이터 로드 (RLS가 자동 적용됨)
  const { data: contracts, error } = await supabase
    .from('contracts')
    .select(`
      id,
      worker_name,
      hourly_wage,
      status,
      created_at,
      signatures (
        signer_role,
        signed_at
      )
    `)
    .eq('employer_id', user.id)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('계약서를 불러오는데 실패했습니다.');
  }

  return <DashboardClient contracts={contracts} />;
}
```

### 4.2 React Query 사용 (Client Component)

```typescript
// hooks/useContracts.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useContracts(status?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['contracts', status],
    queryFn: async () => {
      let query = supabase
        .from('contracts')
        .select('*')
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useDeleteContract() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractId: string) => {
      const { error } = await supabase
        .from('contracts')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
        })
        .eq('id', contractId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}
```

### 4.3 Server Actions 사용

```typescript
// app/(protected)/employer/create/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// 유효성 검사 스키마
const contractSchema = z.object({
  business_size: z.enum(['under_5', 'over_5']),
  worker_name: z.string().min(2).max(10),
  hourly_wage: z.number().min(10030),
  includes_weekly_allowance: z.boolean(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  work_days: z.array(z.string()).nullable(),
  work_days_per_week: z.number().min(1).max(7).nullable(),
  work_start_time: z.string(),
  work_end_time: z.string(),
  break_minutes: z.number().min(0),
  work_location: z.string().min(1),
  job_description: z.string().min(1),
  pay_day: z.number().min(1).max(31),
});

export async function createContract(formData: z.infer<typeof contractSchema>) {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (!user || authError) {
    throw new Error('인증이 필요합니다.');
  }

  // 역할 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'employer') {
    throw new Error('사업자만 계약서를 작성할 수 있습니다.');
  }

  // 크레딧 확인 및 차감
  const { data: hasCredit } = await supabase.rpc('use_credit', {
    p_user_id: user.id,
    p_credit_type: 'contract',
    p_amount: 1,
    p_description: '계약서 작성',
  });

  if (!hasCredit) {
    throw new Error('크레딧이 부족합니다.');
  }

  // 유효성 검사
  const validated = contractSchema.parse(formData);

  // 계약서 생성
  const { data: contract, error } = await supabase
    .from('contracts')
    .insert({
      employer_id: user.id,
      ...validated,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error('계약서 생성에 실패했습니다.');
  }

  revalidatePath('/employer');
  redirect(`/employer/preview/${contract.id}`);
}
```

---

## 5. 상태 관리 (State Management)

### 5.1 Zustand 스토어 규칙

```typescript
// stores/contractFormStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ContractFormState {
  step: number;
  data: {
    businessSize?: 'under_5' | 'over_5';
    workerName?: string;
    hourlyWage?: number;
    includesWeeklyAllowance?: boolean;
    startDate?: string;
    endDate?: string | null;
    workDays?: string[] | null;
    workDaysPerWeek?: number | null;
    workStartTime?: string;
    workEndTime?: string;
    breakMinutes?: number;
    workLocation?: string;
    jobDescription?: string;
    payDay?: number;
  };

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (data: Partial<ContractFormState['data']>) => void;
  reset: () => void;
}

const initialState = {
  step: 1,
  data: {},
};

export const useContractFormStore = create<ContractFormState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ step }),

      nextStep: () =>
        set((state) => ({
          step: Math.min(state.step + 1, 10),
        })),

      prevStep: () =>
        set((state) => ({
          step: Math.max(state.step - 1, 1),
        })),

      updateData: (data) =>
        set((state) => ({
          data: { ...state.data, ...data },
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'contract-form-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
```

### 5.2 게스트 모드 스토어

```typescript
// stores/guestStore.ts
import { create } from 'zustand';

interface GuestState {
  isGuest: boolean;
  guestRole: 'employer' | 'worker' | null;
  aiReviewUsed: boolean;

  setGuest: (role: 'employer' | 'worker') => void;
  clearGuest: () => void;
  setAiReviewUsed: () => void;
}

export const useGuestStore = create<GuestState>((set) => ({
  isGuest: false,
  guestRole: null,
  aiReviewUsed: false,

  setGuest: (role) =>
    set({
      isGuest: true,
      guestRole: role,
    }),

  clearGuest: () =>
    set({
      isGuest: false,
      guestRole: null,
      aiReviewUsed: false,
    }),

  setAiReviewUsed: () => set({ aiReviewUsed: true }),
}));
```

---

## 6. 외부 API 연동

### 6.1 카카오톡 공유 (클라이언트 전용)

```typescript
// lib/kakao.ts
'use client';

// Kakao SDK 타입 선언
declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: KakaoShareOptions) => void;
      };
    };
  }
}

interface KakaoShareOptions {
  objectType: 'feed';
  content: {
    title: string;
    description: string;
    imageUrl: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons: Array<{
    title: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  }>;
}

// SDK 초기화 (앱 전체에서 1회만)
export function initKakao() {
  if (typeof window === 'undefined') return;
  if (window.Kakao?.isInitialized()) return;

  const script = document.createElement('script');
  script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
  script.async = true;
  script.onload = () => {
    window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY!);
  };
  document.head.appendChild(script);
}

// 계약서 공유
export function shareContract(params: {
  contractId: string;
  workerName: string;
  shareToken: string;
}) {
  if (typeof window === 'undefined') {
    console.error('카카오 공유는 브라우저에서만 가능합니다.');
    return;
  }

  if (!window.Kakao?.isInitialized()) {
    console.error('Kakao SDK가 초기화되지 않았습니다.');
    return;
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contract/sign/${params.shareToken}`;

  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: '근로계약서가 도착했어요 ✍️',
      description: `${params.workerName}님, 계약 내용을 확인하고 서명해주세요.`,
      imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`,
      link: {
        mobileWebUrl: shareUrl,
        webUrl: shareUrl,
      },
    },
    buttons: [
      {
        title: '계약서 확인하기',
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
    ],
  });
}
```

### 6.2 카카오 알림톡 (서버 전용)

```typescript
// app/api/kakao/alimtalk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 알림톡 발송 (솔라피 API 예시)
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { phoneNumber, templateCode, variables } = body;

  try {
    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SOLAPI_API_KEY}`,
      },
      body: JSON.stringify({
        message: {
          to: phoneNumber,
          from: process.env.SENDER_PHONE_NUMBER,
          kakaoOptions: {
            pfId: process.env.KAKAO_PF_ID,
            templateId: templateCode,
            variables,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error('알림톡 발송 실패');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Alimtalk error:', error);
    return NextResponse.json(
      { error: '알림톡 발송에 실패했습니다.' },
      { status: 500 }
    );
  }
}
```

### 6.3 토스페이먼츠 연동

```typescript
// app/api/payment/prepare/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

// 결제 요청 준비
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { productId, amount, productName, creditsContract, creditsAiReview } =
    body;

  // 주문 ID 생성
  const orderId = `order_${nanoid(16)}`;

  // 결제 정보 저장
  const { error } = await supabase.from('payments').insert({
    user_id: user.id,
    order_id: orderId,
    amount,
    product_name: productName,
    credits_contract: creditsContract,
    credits_ai_review: creditsAiReview,
    status: 'pending',
  });

  if (error) {
    return NextResponse.json(
      { error: '결제 준비에 실패했습니다.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    orderId,
    amount,
    orderName: productName,
    customerKey: user.id,
  });
}
```

```typescript
// app/api/payment/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { paymentKey, orderId, amount } = body;

  // 토스페이먼츠 결제 승인
  const tossResponse = await fetch(
    'https://api.tosspayments.com/v1/payments/confirm',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${process.env.TOSS_SECRET_KEY}:`
        ).toString('base64')}`,
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    }
  );

  if (!tossResponse.ok) {
    const error = await tossResponse.json();
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const paymentData = await tossResponse.json();

  // 결제 정보 업데이트 및 크레딧 지급
  const supabase = await createClient();

  // 결제 정보 조회
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (!payment) {
    return NextResponse.json(
      { error: '결제 정보를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 트랜잭션으로 처리
  // 결제 상태 업데이트
  await supabase
    .from('payments')
    .update({
      payment_key: paymentKey,
      status: 'completed',
      paid_at: new Date().toISOString(),
      receipt_url: paymentData.receipt?.url,
    })
    .eq('order_id', orderId);

  // 크레딧 지급
  if (payment.credits_contract > 0) {
    await supabase.rpc('add_credit', {
      p_user_id: payment.user_id,
      p_credit_type: 'contract',
      p_amount: payment.credits_contract,
      p_description: `${payment.product_name} 구매`,
      p_reference_id: payment.id,
    });
  }

  if (payment.credits_ai_review > 0) {
    await supabase.rpc('add_credit', {
      p_user_id: payment.user_id,
      p_credit_type: 'ai_review',
      p_amount: payment.credits_ai_review,
      p_description: `${payment.product_name} 구매`,
      p_reference_id: payment.id,
    });
  }

  return NextResponse.json({ success: true });
}
```

### 6.4 AI 노무사 검토 (OpenAI)

```typescript
// app/api/ai-review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const REVIEW_PROMPT = `당신은 한국 노동법 전문가입니다. 
다음 근로계약서 내용을 검토하고 법적 문제점을 분석해주세요.

검토 항목:
1. 최저시급 (2026년 기준 10,030원)
2. 휴게시간 (4시간 근무 시 30분 이상)
3. 주휴수당 요건 (주 15시간 이상 근무 시)
4. 근로계약서 필수 기재사항

JSON 형식으로 응답해주세요:
{
  "overall_status": "pass" | "warning" | "fail",
  "items": [
    {
      "category": "string",
      "status": "pass" | "warning" | "fail",
      "title": "string",
      "description": "string",
      "suggestion": "string" | null
    }
  ]
}`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { contractId } = body;

  // 계약서 조회
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .eq('employer_id', user.id)
    .single();

  if (!contract || contractError) {
    return NextResponse.json(
      { error: '계약서를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 크레딧 차감
  const { data: hasCredit } = await supabase.rpc('use_credit', {
    p_user_id: user.id,
    p_credit_type: 'ai_review',
    p_amount: 1,
    p_description: 'AI 노무사 검토',
    p_reference_id: contractId,
  });

  if (!hasCredit) {
    return NextResponse.json(
      { error: '크레딧이 부족합니다.' },
      { status: 402 }
    );
  }

  // OpenAI API 호출
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: REVIEW_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          hourly_wage: contract.hourly_wage,
          includes_weekly_allowance: contract.includes_weekly_allowance,
          work_start_time: contract.work_start_time,
          work_end_time: contract.work_end_time,
          break_minutes: contract.break_minutes,
          work_days: contract.work_days,
          work_days_per_week: contract.work_days_per_week,
          job_description: contract.job_description,
        }),
      },
    ],
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');

  // 검토 결과 저장
  await supabase.from('ai_reviews').insert({
    contract_id: contractId,
    requested_by: user.id,
    result,
  });

  return NextResponse.json(result);
}
```

---

## 7. 암호화 처리

### 7.1 민감 정보 암호화

```typescript
// lib/utils/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

// 환경변수에서 키 로드 (32바이트)
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY is not set');
  return Buffer.from(key, 'base64');
};

/**
 * 문자열 암호화
 * @param plaintext 암호화할 평문
 * @returns Base64 인코딩된 암호문 (IV + 암호문 + Auth Tag)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const tag = cipher.getAuthTag();

  // IV + 암호문 + Tag 결합
  const result = Buffer.concat([iv, encrypted, tag]);

  return result.toString('base64');
}

/**
 * 문자열 복호화
 * @param ciphertext Base64 인코딩된 암호문
 * @returns 복호화된 평문
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const data = Buffer.from(ciphertext, 'base64');

  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(data.length - TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH, data.length - TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * SSN 해시용 솔트를 안전하게 가져옵니다.
 * 프로덕션에서는 필수, 개발에서는 경고 후 기본값 사용
 */
function getSsnHashSalt(): string {
  const salt = process.env.SSN_HASH_SALT;

  if (!salt) {
    // 프로덕션에서는 반드시 에러 발생
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'SSN_HASH_SALT 환경 변수가 설정되지 않았습니다. ' +
          'Vercel 환경 변수에 SSN_HASH_SALT를 설정해주세요.'
      );
    }
    // 개발 환경에서는 경고 후 기본값 사용
    console.warn('⚠️ [DEV] SSN_HASH_SALT 미설정. 기본값 사용 중.');
    return 'dev-only-salt-do-not-use-in-production';
  }

  return salt;
}

/**
 * 주민번호 해시 생성 (중복 체크용)
 * HMAC-SHA256 사용, 솔트는 환경 변수에서 로드
 * @param ssn 주민등록번호
 * @returns SHA-256 해시
 */
export function hashSSN(ssn: string): string {
  const salt = getSsnHashSalt();
  // 주민번호 앞 7자리 + 솔트로 해시 (생년월일 + 성별)
  const partialSSN = ssn.substring(0, 7);
  return crypto.createHmac('sha256', salt).update(partialSSN).digest('hex');
}
```

### 7.2 근로자 정보 저장

```typescript
// app/(protected)/worker/onboarding/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { encrypt, hashSSN } from '@/lib/utils/encryption';
import { redirect } from 'next/navigation';

export async function saveWorkerDetails(formData: {
  ssn: string; // XXXXXX-XXXXXXX
  bankName: string;
  accountNumber: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (!user || authError) {
    throw new Error('인증이 필요합니다.');
  }

  // 주민번호 형식 검증
  const ssnRegex = /^\d{6}-\d{7}$/;
  if (!ssnRegex.test(formData.ssn)) {
    throw new Error('올바른 주민번호 형식이 아닙니다.');
  }

  // 주민번호 중복 체크
  const ssnHash = hashSSN(formData.ssn);
  const { data: existing } = await supabase
    .from('worker_details')
    .select('id')
    .eq('ssn_hash', ssnHash)
    .single();

  if (existing) {
    throw new Error('이미 등록된 주민번호입니다.');
  }

  // 암호화
  const ssnEncrypted = encrypt(formData.ssn);
  const accountEncrypted = encrypt(formData.accountNumber);

  // 저장
  const { error } = await supabase.from('worker_details').insert({
    user_id: user.id,
    ssn_encrypted: ssnEncrypted,
    ssn_hash: ssnHash,
    bank_name: formData.bankName,
    account_number_encrypted: accountEncrypted,
    is_verified: true,
    verified_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error('정보 저장에 실패했습니다.');
  }

  redirect('/worker');
}
```

---

## 8. 타입 정의

### 8.1 Supabase 타입 생성

```bash
# supabase CLI로 타입 생성
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

### 8.2 커스텀 타입

```typescript
// types/contract.ts
import { Database } from './database';

export type Contract = Database['public']['Tables']['contracts']['Row'];
export type ContractInsert =
  Database['public']['Tables']['contracts']['Insert'];
export type ContractUpdate =
  Database['public']['Tables']['contracts']['Update'];

export type ContractStatus = Database['public']['Enums']['contract_status'];
export type BusinessSize = Database['public']['Enums']['business_size'];

export interface ContractWithSignatures extends Contract {
  signatures: {
    signer_role: 'employer' | 'worker';
    signed_at: string;
  }[];
}

export interface ContractFormData {
  businessSize: BusinessSize;
  workerName: string;
  hourlyWage: number;
  includesWeeklyAllowance: boolean;
  startDate: string;
  endDate: string | null;
  workDays: string[] | null;
  workDaysPerWeek: number | null;
  workStartTime: string;
  workEndTime: string;
  breakMinutes: number;
  workLocation: string;
  jobDescription: string;
  payDay: number;
}
```

---

## 9. 코딩 컨벤션

### 9.1 네이밍 규칙

| 대상            | 규칙                        | 예시                |
| --------------- | --------------------------- | ------------------- |
| 컴포넌트        | PascalCase                  | `ContractCard.tsx`  |
| 훅              | camelCase with `use` prefix | `useContracts.ts`   |
| 유틸 함수       | camelCase                   | `formatCurrency.ts` |
| 상수            | UPPER_SNAKE_CASE            | `MAX_FILE_SIZE`     |
| 타입/인터페이스 | PascalCase                  | `ContractFormData`  |
| DB 컬럼         | snake_case                  | `hourly_wage`       |

### 9.2 파일 구조 규칙

```typescript
// 컴포넌트 파일 구조
// components/contract/ContractCard.tsx

'use client'; // 필요한 경우에만

import { useState } from 'react'; // 1. React imports
import { useRouter } from 'next/navigation'; // 2. Next.js imports
import { formatCurrency } from '@/lib/utils/format'; // 3. 프로젝트 imports
import type { Contract } from '@/types'; // 4. 타입 imports

// 타입 정의
interface ContractCardProps {
  contract: Contract;
  onDelete?: (id: string) => void;
}

// 컴포넌트
export function ContractCard({ contract, onDelete }: ContractCardProps) {
  // 상태
  const [isLoading, setIsLoading] = useState(false);

  // 훅
  const router = useRouter();

  // 핸들러
  const handleClick = () => {
    router.push(`/employer/contract/${contract.id}`);
  };

  // 렌더
  return (
    <div onClick={handleClick}>
      {/* ... */}
    </div>
  );
}
```

### 9.3 에러 처리

```typescript
// 표준 에러 응답 형식
interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

// Server Action 에러 처리
export async function createContract(data: ContractFormData) {
  try {
    // ... 로직
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('입력값이 올바르지 않습니다.');
    }

    console.error('Contract creation failed:', error);
    throw new Error('계약서 생성에 실패했습니다.');
  }
}

// Route Handler 에러 처리
export async function POST(request: NextRequest) {
  try {
    // ... 로직
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

---

## 10. 성능 최적화

### 10.1 이미지 최적화

```tsx
// Next.js Image 컴포넌트 사용
import Image from 'next/image';

<Image
  src={avatarUrl}
  alt="프로필 이미지"
  width={40}
  height={40}
  className="rounded-full"
  priority={false} // LCP 이미지가 아닌 경우
/>;
```

### 10.2 동적 임포트

```tsx
// 무거운 컴포넌트 지연 로딩
import dynamic from 'next/dynamic';

const SignatureCanvas = dynamic(
  () => import('@/components/contract/SignatureCanvas'),
  {
    loading: () => <div className="h-48 bg-gray-100 animate-pulse" />,
    ssr: false, // 캔버스는 클라이언트 전용
  }
);
```

### 10.3 React Query 캐싱

```typescript
// 적절한 staleTime 설정
export function useContracts() {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: fetchContracts,
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30, // 30분 (이전 cacheTime)
  });
}
```

---

---

## 📝 Amendment 1: 코딩 규칙 추가 (2026년 1월 24일)

> **버전**: 1.1  
> **변경 사유**: 메뉴 시트 컴포넌트 및 대시보드 레이아웃 변경 관련 규칙 추가

### A1.1 신규 컴포넌트 경로

| 컴포넌트   | 경로                               | 설명                      |
| ---------- | ---------------------------------- | ------------------------- |
| MenuSheet  | `components/layout/MenuSheet.tsx`  | 햄버거 메뉴 사이드시트    |
| CreditCard | `components/shared/CreditCard.tsx` | 대시보드 크레딧 표시 카드 |

### A1.2 라우트 상수 추가 (`lib/constants/routes.ts`)

```typescript
// 메뉴 시트에서 사용하는 라우트
export const MENU_ROUTES = {
  PROFILE: '/profile',
  PRICING: '/pricing',
  PAYMENT_HISTORY: '/payment-history',
  TRASH: '/employer/trash', // 또는 대시보드 내 섹션
  TERMS: '/terms',
  PRIVACY: '/privacy',
  SIGNOUT: '/auth/signout',
} as const;
```

### A1.3 헤더 컴포넌트 Props 변경

**기존:**

```typescript
interface HeaderProps {
  showProfile?: boolean;
  showNotification?: boolean;
  credits?: number;
}
```

**변경:**

```typescript
interface HeaderProps {
  showCredits?: boolean; // 크레딧 표시 여부 (사업자만)
  showNotification?: boolean; // 알림 아이콘 표시
  showMenu?: boolean; // 햄버거 메뉴 표시 (기본값: true)
  credits?: number; // 보유 크레딧 수
  onMenuOpen?: () => void; // 메뉴 열기 핸들러
}
```

### A1.4 대시보드 데이터 페칭 패턴

```typescript
// app/(protected)/employer/page.tsx
export default async function EmployerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 대기중 계약서와 완료 계약서를 한 번에 조회
  const [pendingResult, completedResult] = await Promise.all([
    supabase
      .from('contracts')
      .select('*')
      .eq('employer_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('contracts')
      .select('*')
      .eq('employer_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false }),
  ]);

  return (
    <EmployerDashboardClient
      pendingContracts={pendingResult.data ?? []}
      completedContracts={completedResult.data ?? []}
    />
  );
}
```

### A1.5 메뉴 시트 상태 관리

메뉴 시트 열기/닫기 상태는 로컬 상태로 관리합니다 (Zustand 불필요):

```typescript
// 사용 예시 (클라이언트 컴포넌트)
'use client';

import { useState } from 'react';
import { MenuSheet } from '@/components/layout/MenuSheet';

export function DashboardClient() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <Header onMenuOpen={() => setIsMenuOpen(true)} />
      <MenuSheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
}
```

---

> **Amendment 1 끝**

---

## 📝 Amendment 2: 게스트 모드 코딩 규칙 (2026년 1월 24일)

> **버전**: 1.2  
> **변경 사유**: 게스트 모드 지원을 위한 코딩 규칙 추가

### A2.1 게스트 모드 체크 패턴

모든 `(protected)` 폴더의 Server Component에서 게스트 모드를 체크해야 합니다.

```typescript
import { cookies } from 'next/headers';

async function isGuestMode(): Promise<boolean> {
  const cookieStore = await cookies();
  const guestCookie = cookieStore.get('guest-storage');

  if (guestCookie?.value) {
    try {
      const decodedValue = decodeURIComponent(guestCookie.value);
      const guestData = JSON.parse(decodedValue);
      return guestData?.state?.isGuest || false;
    } catch {
      return false;
    }
  }

  return false;
}
```

### A2.2 게스트 모드 샘플 데이터

게스트 모드에서는 DB 조회 대신 하드코딩된 샘플 데이터를 반환합니다.

```typescript
// 게스트 모드 체크
const isGuest = await isGuestMode();

if (isGuest) {
  return (
    <Dashboard
      profile={{ name: '게스트', email: null }}
      contracts={GUEST_SAMPLE_CONTRACTS}
      isGuestMode={true}
    />
  );
}

// 실제 사용자 처리...
```

### A2.3 쿠키 저장소 (guestStore)

Zustand persist를 쿠키 기반으로 변경:

```typescript
import { createJSONStorage } from 'zustand/middleware';

const cookieStorage = {
  getItem: (name: string) => { /* 쿠키 읽기 */ },
  setItem: (name: string, value: string) => { /* 쿠키 저장 */ },
  removeItem: (name: string) => { /* 쿠키 삭제 */ },
};

// persist 옵션
{
  name: 'guest-storage',
  storage: createJSONStorage(() => cookieStorage),
}
```

### A2.4 카카오 닉네임 가져오기

카카오 로그인 후 `user_metadata`에서 닉네임을 가져옵니다:

```typescript
const kakaoName =
  user.user_metadata?.name || user.user_metadata?.full_name || profile?.name;
```

---

> **Amendment 2 끝**
