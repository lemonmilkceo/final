# DevSupport AI - PRD (Product Requirements Document)

> **제품명**: DevSupport AI (가칭)
> **버전**: 1.0
> **작성일**: 2026년 2월 5일
> **대상 앱**: 싸인해주세요 (SignPlease)

---

## 1. 제품 개요

### 1.1 한 줄 설명

1인 개발자를 위한 소스코드 기반 CS 자동화 및 운영 대시보드

### 1.2 핵심 가치

- 앱 사용자가 1:1 문의를 보내면 AI가 소스코드 + 매뉴얼을 참조해 답변 초안 생성
- 오류 문의 시 Sentry 로그까지 분석해 개발자에게 해결방법 제시
- 결제 문제(크레딧 미지급)는 AI가 분석 후 지급 제안, 개발자 승인 시 실행
- 개발자는 답변 확인 후 승인만 하면 끝

### 1.3 타겟 사용자

싸인해주세요 앱 운영자 (1인 개발자)

### 1.4 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend/Backend | Next.js (App Router) |
| Database | Supabase (PostgreSQL + Realtime) |
| 배포 | Vercel (무료 플랜) |
| AI | OpenAI GPT-4o |
| 인증 | 앱 로그인 연동 (사용자), 별도 비밀번호 (관리자) |
| 에러 모니터링 | Sentry |
| 결제 | 토스페이먼츠 (기존) |
| 이메일 | Resend |

---

## 2. 시스템 아키텍처

### 2.1 통합 구조

```
┌─────────────────────────────────────────────────────────────┐
│              싸인해주세요 웹앱 (Next.js PWA/모바일웹)            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  기존 기능들  │  │  고객센터   │  │  1:1 문의 채팅       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ※ 향후 Expo 네이티브 앱으로 배포 예정 (Phase 3)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 싸인해주세요 웹 (Next.js + Vercel)             │
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │  기존 웹 페이지들     │  │  관리자 대시보드 (/admin)    │   │
│  └─────────────────────┘  │  - CS 관리 (Phase 1)       │   │
│                           │  - Growth/운영 (Phase 2)    │   │
│                           └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (통합)                           │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │ 기존 테이블        │  │ CS 테이블 (신규)                  │ │
│  │ - profiles       │  │ - cs_inquiries (문의)            │ │
│  │ - payments       │  │ - cs_responses (답변)            │ │
│  │ - credits        │  │ - cs_manuals (매뉴얼)            │ │
│  │ - contracts      │  │ - cs_codebase_sync (동기화)      │ │
│  └──────────────────┘  │ - cs_settings (설정)             │ │
│                        └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────────┐
        │ OpenAI   │   │ Sentry   │   │   GitHub     │
        │ GPT-4o   │   │ (에러)   │   │  (코드조회)  │
        └──────────┘   └──────────┘   └──────────────┘
```

### 2.2 폴더 구조 (추가)

```
signplease/
├── app/
│   ├── (protected)/
│   │   ├── support/
│   │   │   ├── inquiry/                # 🆕 1:1 문의 (사용자용)
│   │   │   │   ├── page.tsx           # 문의 목록
│   │   │   │   ├── new/               # 새 문의 작성
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/              # 문의 상세
│   │   │   │       └── page.tsx
│   │   │   └── actions.ts
│   │   └── ...
│   └── admin/                          # 🆕 관리자 대시보드
│       ├── login/
│       │   └── page.tsx
│       ├── inquiries/
│       │   ├── page.tsx               # 문의 목록
│       │   └── [id]/
│       │       └── page.tsx           # 문의 상세
│       ├── page.tsx                   # 관리자 홈 (통계)
│       └── actions.ts
│
├── lib/
│   └── cs/                             # 🆕 CS 관련 유틸
│       ├── ai.ts                      # AI 답변 생성
│       ├── github.ts                  # GitHub 코드 조회
│       ├── sentry.ts                  # Sentry 연동
│       ├── context.ts                 # 사용자 컨텍스트 수집
│       └── notifications.ts           # 이메일 알림
│
├── docs/
│   └── manuals/                        # 🆕 CS 매뉴얼
│       ├── faq.md
│       ├── payment-errors.md
│       ├── refund-policy.md
│       └── usage-guide.md
```

---

## 3. 데이터베이스 스키마

### 3.1 Enum 타입

```sql
-- CS 관련 ENUM
CREATE TYPE public.inquiry_category AS ENUM ('payment', 'usage', 'bug', 'other');
CREATE TYPE public.inquiry_status AS ENUM ('pending', 'answered');

-- 기존 notification_type ENUM 확장 (이미 존재하는 ENUM에 추가)
-- ⚠️ 주의: 기존 타입이 있으므로 ALTER TYPE 사용
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'system';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'cs_reply';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'credit_low';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'promo_applied';
```

### 3.2 테이블

#### cs_inquiries (1:1 문의)

```sql
CREATE TABLE public.cs_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category inquiry_category NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  status inquiry_status NOT NULL DEFAULT 'pending',
  
  -- AI 생성
  ai_response text,                    -- 고객용 답변 초안
  ai_developer_note text,              -- 개발자용 분석
  ai_generated_at timestamptz,
  
  -- 사용자 컨텍스트
  user_context jsonb,                  -- 크레딧, 결제 내역 등
  sentry_errors jsonb,                 -- Sentry 에러 로그
  
  -- 제안된 액션
  auto_action_taken text,              -- 실행된 액션 (예: 'credit_added')
  auto_action_details jsonb,
  
  -- 알림
  has_unread_response boolean DEFAULT false,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz
);

CREATE INDEX idx_cs_inquiries_user_id ON cs_inquiries(user_id);
CREATE INDEX idx_cs_inquiries_status ON cs_inquiries(status);
CREATE INDEX idx_cs_inquiries_created_at ON cs_inquiries(created_at DESC);
CREATE INDEX idx_cs_inquiries_unread ON cs_inquiries(user_id, has_unread_response) 
  WHERE has_unread_response = true;
```

#### cs_responses (답변)

```sql
CREATE TABLE public.cs_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES cs_inquiries(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_ai_generated boolean DEFAULT true,
  was_edited boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cs_responses_inquiry_id ON cs_responses(inquiry_id);
```

#### cs_manuals (매뉴얼)

```sql
CREATE TABLE public.cs_manuals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL UNIQUE,
  content text NOT NULL,
  last_commit_sha text,
  synced_at timestamptz NOT NULL DEFAULT now()
);
```

#### cs_codebase_sync (코드 동기화)

```sql
CREATE TABLE public.cs_codebase_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_url text NOT NULL,
  branch text DEFAULT 'main',
  last_commit_sha text,
  file_count integer,
  total_lines integer,
  synced_at timestamptz NOT NULL DEFAULT now()
);
```

#### cs_settings (설정)

```sql
CREATE TABLE public.cs_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 3.3 RLS 정책

```sql
-- cs_inquiries: 사용자는 본인 문의만
ALTER TABLE cs_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cs_inquiries_select_own" ON cs_inquiries
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "cs_inquiries_insert_own" ON cs_inquiries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ⚠️ UPDATE 정책 추가 (읽음 처리용)
CREATE POLICY "cs_inquiries_update_own" ON cs_inquiries
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- cs_responses: 사용자는 본인 문의의 답변만
ALTER TABLE cs_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cs_responses_select_own" ON cs_responses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cs_inquiries
      WHERE cs_inquiries.id = inquiry_id
      AND cs_inquiries.user_id = auth.uid()
    )
  );

-- cs_manuals, cs_codebase_sync, cs_settings: 관리자만 (service_role)
ALTER TABLE cs_manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_codebase_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_settings ENABLE ROW LEVEL SECURITY;
```

---

## 4. 사용자 흐름

### 4.1 고객 문의 흐름

```
사용자 앱
│
├─ 1. 네비게이터바 > 고객센터 > 1:1 문의하기
│
├─ 2. 카테고리 선택 (필수)
│     ○ 결제/환불  ○ 사용법  ○ 오류/버그  ○ 기타
│
├─ 3. 제목 + 내용 작성 후 전송
│
├─ 4. 자동 응답 표시
│     "문의가 접수되었습니다. 빠른 시간 내 답변드리겠습니다."
│
├─ 5. 답변 도착 시
│     • 고객센터 탭에 뱃지 (빨간 점)
│     • 문의 상세에서 답변 확인
│
└─ 6. 추가 질문 시 → 새 문의 작성 (티켓 방식)
```

### 4.2 백엔드 처리 흐름

```
문의 접수
│
├─ 1. cs_inquiries 테이블에 저장 (1-2초)
│
├─ 2. 개발자 이메일 알림 (Resend)
│
└─ 3. 사용자에게 "접수 완료" 응답

--- AI 분석은 관리자가 상세 페이지 열 때 실행 (Lazy Loading) ---

관리자가 문의 상세 열기
│
├─ 1. 분석 안 됐으면 AI 분석 시작 (5-10초, 로딩 UI)
│     ├─ 사용자 컨텍스트 수집 (크레딧, 결제, 사용 이력)
│     ├─ Sentry 에러 조회 (최근 24시간)
│     ├─ GitHub에서 코드 + 매뉴얼 조회
│     └─ OpenAI GPT-4o로 분석
│
├─ 2. 분석 결과 저장
│
└─ 3. 화면 표시
```

### 4.3 개발자 처리 흐름

```
문의 상세 페이지
│
├─ 📋 사용자 정보
│     이름, 크레딧, 최근 결제 등
│
├─ 📝 문의 내용
│
├─ 🤖 AI 분석 (개발자용)
│     • 원인 분석
│     • 코드 위치 (파일:라인)
│     • 권장 조치
│
├─ 💬 고객 답변 초안 + 제안 액션
│     ⚡ 승인 시 실행될 액션:
│        ✓ 크레딧 5개 지급 (제안된 경우)
│        ✓ 위 답변 고객에게 전송
│
│     [수정하기]  [✓ 승인]
│
└─ [승인] 클릭 시:
     → AI가 크레딧 지급 실행 (제안된 경우)
     → AI가 답변 전송 실행
     → 완료
```

---

## 5. AI 프롬프트 설계

### 5.1 입력 구조

```typescript
interface AIInput {
  inquiry: {
    category: 'payment' | 'usage' | 'bug' | 'other';
    title: string;
    content: string;
  };
  
  userContext: {
    userId: string;
    name: string;
    email: string;
    createdAt: string;
    creditBalance: number;
    recentPayments: Payment[];
    recentContracts: Contract[];
  };
  
  sentryErrors?: SentryError[];
  codebase: string;  // 필터링된 코드 (약 118K 토큰 이하)
  manuals: string;
}
```

### 5.2 출력 구조

```typescript
interface AIOutput {
  customerResponse: string;
  
  developerNote: {
    summary: string;
    rootCause: string;
    codeReference?: string;
    solution: string;
  };
  
  suggestedActions: {
    type: 'add_credit' | 'refund' | 'none';
    amount?: number;
    reason: string;
  }[];
}
```

### 5.3 시스템 프롬프트

```
당신은 "싸인해주세요" 앱의 고객 지원 AI입니다.

## 역할
1. 고객 문의를 분석하여 정확한 답변 초안을 작성합니다.
2. 개발자에게 문제의 원인과 해결 방법을 제시합니다.
3. 필요한 경우 크레딧 지급 등의 액션을 제안합니다.

## 답변 톤
- 전문적이고 포멀한 톤을 사용합니다.
- 존댓말을 사용합니다.
- 불필요한 이모지는 사용하지 않습니다.

## 답변 작성 원칙
1. 고객의 문제를 먼저 인정합니다.
2. 원인을 간단히 설명합니다 (기술적 세부사항 제외).
3. 해결 방법 또는 조치 내용을 안내합니다.
4. 추가 문의 안내로 마무리합니다.

## 크레딧 지급 기준
- 결제 완료 + 크레딧 미지급 확인 시: 크레딧 지급 제안
- 앱 오류로 인한 불편 발생 시: 보상 크레딧 1개 제안
- 사용자 실수인 경우: 지급하지 않음

## 환불 기준
- 미사용 크레딧: 환불 가능 안내 (개발자 승인 필요)
- 사용한 크레딧: 환불 불가 안내 (법적 근거 포함)

## 참조 자료
- 소스코드: 아래 제공된 코드베이스
- 매뉴얼: 아래 제공된 CS 매뉴얼
- 사용자 정보: 아래 제공된 사용자 컨텍스트
```

### 5.4 코드베이스 필터링

전체 코드(약 236K 토큰)를 GPT-4o 컨텍스트(128K)에 맞추기 위해 자동 필터링:

```typescript
const EXCLUDE_PATTERNS = [
  '__tests__/**',
  '*.test.ts',
  '*.test.tsx',
  'vitest.*',
  'eslint.*',
  'prettier.*',
  'postcss.*',
  'tsconfig.json',
  'next.config.*',
  'components/ui/**',
  'public/**',
  '*.css',
  '*.svg',
  '*.png',
  '*.d.ts',
  'sampleData.ts',
  'faqData.ts',
];

const MINIFY_OPTIONS = {
  removeComments: true,
  removeEmptyLines: true,
  compressImports: true,
};
```

예상 결과: 236K → 약 118K 토큰 (128K 이내)

---

## 6. 화면 설계

### 6.1 고객용 화면

#### 고객센터 메인 (`/support`)

```
┌─────────────────────────────────────┐
│  ←  고객센터                        │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐│
│  │  📋 자주 묻는 질문              ││
│  │     FAQ 보러가기 →              ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │  💬 1:1 문의하기         🔴     ││
│  │     문의 내역 보기 →            ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

#### 새 문의 작성 (`/support/inquiry/new`)

```
┌─────────────────────────────────────┐
│  ←  새 문의                         │
├─────────────────────────────────────┤
│                                     │
│  카테고리 *                         │
│  ┌────────┐ ┌────────┐             │
│  │ 결제/환불│ │ 사용법 │             │
│  └────────┘ └────────┘             │
│  ┌────────┐ ┌────────┐             │
│  │ 오류/버그│ │  기타  │             │
│  └────────┘ └────────┘             │
│                                     │
│  제목 *                             │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│  문의 내용 *                        │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │          문의하기               ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### 6.2 관리자용 화면

#### 관리자 로그인 (`/admin/login`)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│                                                         │
│                    DevSupport AI                        │
│                                                         │
│                   관리자 전용 페이지                      │
│                                                         │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  비밀번호                                            ││
│  │  ••••••••••••••••••••••••••••••                     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │                    로그인                            ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ❌ 비밀번호가 올바르지 않습니다 (실패 시 표시)           │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**로그인 로직:**

```typescript
// app/admin/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin } from '../actions';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await adminLogin(password);
    
    if (result.success) {
      router.push('/admin');
    } else {
      setError('비밀번호가 올바르지 않습니다');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-2">DevSupport AI</h1>
        <p className="text-gray-500 text-center mb-8">관리자 전용 페이지</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="w-full p-4 border rounded-xl mb-4"
            autoFocus
          />
          
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full p-4 bg-blue-600 text-white rounded-xl font-medium
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        
        {error && (
          <p className="mt-4 text-red-500 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
```

**Server Action:**

```typescript
// app/admin/actions.ts
'use server';

import { cookies } from 'next/headers';
import { SignJWT } from 'jose';

export async function adminLogin(password: string): Promise<{ success: boolean }> {
  // 환경변수 비밀번호와 비교
  if (password !== process.env.ADMIN_PASSWORD) {
    return { success: false };
  }

  // JWT 생성 (24시간 유효)
  const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  // 쿠키에 저장
  const cookieStore = await cookies();
  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24시간
    path: '/',
  });

  return { success: true };
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}
```

**접근 제어:**

| 경로 | 접근 조건 |
|------|----------|
| `/admin/login` | 누구나 (로그인 페이지) |
| `/admin/*` (그 외) | `admin_session` 쿠키 + JWT 유효 |

---

#### 관리자 홈 (`/admin`)

```
┌─────────────────────────────────────────────────────────┐
│  DevSupport AI                              [로그아웃]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 오늘 현황                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  대기중     │  │  오늘 처리  │  │  AI 채택률  │     │
│  │     3      │  │     12     │  │    85%     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
│  📈 이번 주 통계                                        │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 평균 응답 시간: 2시간 30분                          ││
│  │ 총 문의: 47건                                       ││
│  │ 크레딧 지급 승인: 5건                               ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  📋 카테고리별 분포                                     │
│  결제/환불 ████████ 40%                                 │
│  사용법   ██████ 30%                                    │
│  오류/버그 ████ 20%                                     │
│  기타     ██ 10%                                        │
│                                                         │
│  [전체 문의 보기 →]                                     │
└─────────────────────────────────────────────────────────┘
```

#### 문의 상세 (`/admin/inquiries/[id]`)

```
┌─────────────────────────────────────────────────────────┐
│  ←  문의 상세                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  👤 사용자 정보                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 이름: 김철수        가입일: 2026.01.15              ││
│  │ 이메일: kim@example.com                             ││
│  │ 크레딧: 3개         최근 결제: 2026.02.03 (5,000원)  ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  📝 문의 내용                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [결제/환불] 결제했는데 크레딧이 안 들어왔어요        ││
│  │                                                     ││
│  │ 어제 5,000원 결제했는데 크레딧이 안 들어왔어요.      ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  🤖 AI 분석 (개발자용)                                  │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 📊 분석 결과                                        ││
│  │ • 결제 확인: order_abc123 (5,000원) - ✅ 완료       ││
│  │ • 크레딧 지급: ❌ 미지급                            ││
│  │                                                     ││
│  │ 🔍 원인 추정                                        ││
│  │ 토스페이먼츠 웹훅 처리 중 타임아웃 발생 추정         ││
│  │ 참고: app/api/payment/confirm/route.ts:87           ││
│  │                                                     ││
│  │ 💡 권장 조치                                        ││
│  │ 크레딧 5개 수동 지급                                ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  💬 고객 답변 초안                                      │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 안녕하세요. 문의 주신 내용 확인하였습니다.           ││
│  │                                                     ││
│  │ 결제 확인 결과, 크레딧이 정상적으로 지급되지 않은    ││
│  │ 것을 확인하여 5개를 추가 지급해 드렸습니다.          ││
│  │                                                     ││
│  │ 불편을 드려 죄송합니다.                             ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ⚡ 승인 시 실행될 액션                                 │
│  ┌─────────────────────────────────────────────────────┐│
│  │ ✓ 크레딧 5개 지급                                   ││
│  │ ✓ 위 답변 고객에게 전송                             ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌──────────────┐  ┌──────────────────────────────────┐ │
│  │   수정하기   │  │         ✓ 승인                  │ │
│  └──────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 7. API 설계

### 7.0 타입 정의

```typescript
// types/cs.ts

// 문의 카테고리
type InquiryCategory = 'payment' | 'usage' | 'bug' | 'other';
type InquiryStatus = 'pending' | 'answered';

// 기본 문의 타입
interface Inquiry {
  id: string;
  userId: string;
  category: InquiryCategory;
  title: string;
  content: string;
  status: InquiryStatus;
  hasUnreadResponse: boolean;
  createdAt: string;
  answeredAt: string | null;
}

// 문의 상세 (고객용)
interface InquiryDetail extends Inquiry {
  responses: {
    id: string;
    content: string;
    createdAt: string;
  }[];
}

// 문의 상세 + AI 분석 (관리자용)
interface InquiryDetailWithAI extends Inquiry {
  aiResponse: string | null;
  aiDeveloperNote: string | null;
  aiGeneratedAt: string | null;
  userContext: UserContext | null;
  sentryErrors: SentryError[] | null;
  autoActionTaken: string | null;
  autoActionDetails: Record<string, unknown> | null;
  responses: {
    id: string;
    content: string;
    isAiGenerated: boolean;
    wasEdited: boolean;
    createdAt: string;
  }[];
}

// 문의 생성 입력
interface CreateInquiryInput {
  category: InquiryCategory;
  title: string;
  content: string;
}

// 문의 필터 (관리자용)
interface InquiryFilter {
  status?: InquiryStatus | 'all';
  category?: InquiryCategory | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

// 사용자 컨텍스트
interface UserContext {
  userId: string;
  name: string;
  email: string;
  createdAt: string;
  creditBalance: number;
  recentPayments: Payment[];
  recentContracts: ContractSummary[];
}

// Sentry 에러
interface SentryError {
  id: string;
  title: string;
  culprit: string;
  count: number;
  lastSeen: string;
}

// 승인 결과
interface ApproveResult {
  success: boolean;
  actionsExecuted: string[];
  error?: string;
}

// 통계
interface Stats {
  pending: number;
  todayResolved: number;
  aiAdoptionRate: number;
  avgResponseTime: string;
  categoryDistribution: Record<InquiryCategory, number>;
}
```

### 7.1 Server Actions - 고객용

```typescript
// app/(protected)/support/inquiry/actions.ts

export async function getMyInquiries(): Promise<Inquiry[]>
export async function getInquiry(id: string): Promise<InquiryDetail>
export async function createInquiry(data: CreateInquiryInput): Promise<{ success: boolean; id: string }>
// → 저장 + 개발자 이메일 알림 (AI 분석은 나중에)

export async function markAsRead(id: string): Promise<void>
export async function getUnreadCount(): Promise<number>
```

### 7.2 Server Actions - 관리자용

```typescript
// app/admin/actions.ts

export async function adminLogin(password: string): Promise<{ success: boolean }>
export async function adminLogout(): Promise<void>
export async function getInquiries(filter: InquiryFilter): Promise<{ inquiries: Inquiry[]; total: number }>
export async function getInquiryDetail(id: string): Promise<InquiryDetailWithAI>
// → Lazy Loading: 분석 안 됐으면 여기서 AI 분석 실행

export async function updateResponse(id: string, content: string): Promise<void>
export async function approveInquiry(id: string): Promise<ApproveResult>
// → 트랜잭션: 액션 실행 + 답변 저장 + 상태 변경

export async function getStats(): Promise<Stats>
export async function regenerateAIAnalysis(id: string): Promise<void>
```

### 7.3 내부 유틸

```typescript
// lib/cs/github.ts
export async function getCodebase(): Promise<string>
export async function getManuals(): Promise<string>

// lib/cs/sentry.ts
export async function getSentryErrors(userId: string): Promise<SentryError[]>

// lib/cs/ai.ts
export async function analyzeInquiry(...): Promise<AIOutput>

// lib/cs/context.ts
export async function collectUserContext(userId: string): Promise<UserContext>

// lib/cs/notifications.ts
export async function notifyAdmin(inquiry: Inquiry): Promise<void>
```

---

## 8. 외부 서비스 연동

### 8.1 OpenAI

| 항목 | 값 |
|------|-----|
| 모델 | GPT-4o |
| 용도 | 문의 분석 + 답변 생성 |
| 예상 비용 | 월 $10 미만 (1,000명 기준) |

### 8.2 Sentry

| 항목 | 값 |
|------|-----|
| 플랜 | Developer (무료) |
| 용도 | 에러 모니터링 + CS 연동 |
| API | Issues API (사용자별 에러 조회) |

**앱에 추가 필요:**
```typescript
// 로그인 성공 시
Sentry.setUser({ id: user.id, email: user.email });

// 로그아웃 시
Sentry.setUser(null);
```

### 8.3 Resend

| 항목 | 값 |
|------|-----|
| 플랜 | Free (월 3,000건) |
| 용도 | 관리자 알림 이메일 |

### 8.4 GitHub API

| 항목 | 값 |
|------|-----|
| 용도 | 코드베이스 + 매뉴얼 조회 |
| 방식 | Git Trees API (실시간 조회) |
| 인증 | Personal Access Token (public_repo 권한) |

---

## 9. 보안

### 9.1 관리자 인증

- 방식: 별도 비밀번호 + JWT + httpOnly 쿠키
- 비밀번호: 32자 이상 강력한 비밀번호
- 세션: 브라우저 종료 시 만료
- Rate Limit: 생략 (강력한 비밀번호로 대체)

### 9.2 미들웨어 `/admin` 경로 보호

```typescript
// lib/supabase/middleware.ts 수정

// ═══════════════════════════════════════════════════════════
// lib/supabase/middleware.ts 수정 가이드
// ═══════════════════════════════════════════════════════════
// 기존 파일의 updateSession 함수에 아래 코드를 추가합니다.
// 위치: pathname 변수 정의 직후, 보호된 경로 체크 전
// ═══════════════════════════════════════════════════════════

// 1. 파일 상단에 import 추가 (기존 imports 아래)
import { jwtVerify } from 'jose';

// 2. ADMIN_ROUTES 상수 추가 (기존 상수들 아래)
const ADMIN_ROUTES = ['/admin'];

// 3. updateSession 함수 내 pathname 정의 후 아래 코드 추가:
export async function updateSession(request: NextRequest) {
  // ... 기존 Supabase 클라이언트 생성 코드 ...
  
  const pathname = request.nextUrl.pathname;

  // ═══════════════════════════════════════════════════════════
  // 🆕 관리자 경로 보호 (Phase 1 추가)
  // ⚠️ 이 블록은 기존 보호된 경로 체크보다 먼저 실행되어야 함
  // ═══════════════════════════════════════════════════════════
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));
  
  if (isAdminRoute && pathname !== '/admin/login') {
    // 관리자 세션 쿠키 확인 (Supabase 세션과 별개)
    const adminSession = request.cookies.get('admin_session')?.value;
    
    if (!adminSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    // JWT 검증 (jose는 Edge Runtime 호환)
    try {
      const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);
      await jwtVerify(adminSession, secret);
    } catch {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      const response = NextResponse.redirect(url);
      response.cookies.delete('admin_session');
      return response;
    }
    
    // 관리자 인증 성공 - 일반 사용자 경로 체크 건너뛰기
    return supabaseResponse;
  }

  // ═══════════════════════════════════════════════════════════
  // 기존 게스트 모드 체크 및 보호된 경로 로직 유지
  // ═══════════════════════════════════════════════════════════
  
  // ... 기존 코드 그대로 유지 ...
}
```

### 9.3 Server Action 권한 검증

```typescript
// lib/admin/auth.ts
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function verifyAdmin(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  if (!token) {
    throw new Error('Unauthorized');
  }

  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);
    await jwtVerify(token, secret);
  } catch {
    throw new Error('Invalid token');
  }
}

// 모든 관리자 Server Action에서 호출
export async function getInquiries(filter: InquiryFilter) {
  await verifyAdmin();
  // ...
}
```

### 9.4 API 키 보호

| 데이터 | 보호 방식 |
|--------|----------|
| 외부 API 키 | 환경변수, 서버에서만 접근 |
| 사용자 컨텍스트 | RLS + 서버에서만 조회 |
| AI 분석 결과 | 관리자만 전체 조회 |

---

## 10. 성공 기준

### 10.1 핵심 KPI

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 평균 응답 시간 | 24시간 이내 | `answered_at - created_at` |
| AI 초안 채택률 | 60% 이상 | 수정 없이 승인된 비율 |
| 일일 처리율 | 100% | 접수 후 24시간 내 처리 |

### 10.2 측정 기준

- **AI 채택률**: 수정 버튼 안 누르고 바로 승인 = 채택
- **처리율**: 접수 후 24시간 내 답변 완료

---

## 11. 개발 우선순위

### Phase 1: MVP

```
Week 1: 기반 작업
├── Sentry 설치 및 연동
├── Resend 가입 + 도메인 인증 시작
├── DB 스키마 생성 (5개 테이블 + RLS)
├── 관리자 로그인 (JWT)
└── 폴더 구조 생성

Week 2: 고객용 UI + 매뉴얼
├── 기본 매뉴얼 작성 (docs/manuals/)
├── 기존 네비게이터바/고객센터 수정
├── 문의 목록 페이지
├── 문의 작성 페이지
├── 문의 상세 페이지
└── 읽지 않은 답변 뱃지

Week 3: AI 분석
├── GitHub 코드 조회 함수
├── 코드 필터링 스크립트
├── Sentry 에러 조회 함수
├── 사용자 컨텍스트 수집 함수
├── OpenAI 프롬프트 작성
└── AI 분석 함수 (Lazy Loading)

Week 4: 관리자 대시보드
├── 관리자 홈 (통계 요약)
├── 문의 목록 (필터/검색)
├── 문의 상세 (AI 분석 + 답변 초안)
├── 답변 수정 모달
├── 승인 기능
└── Resend 이메일 알림 연동

Week 5: 테스트 및 배포
├── 테스트 시나리오 5개 검증
├── 엣지 케이스 처리
├── 에러 핸들링 보완
└── 배포
```

### Phase 2: 운영 대시보드 + Growth 자동화

> **상세 설계**: 아래 "13. Phase 2 상세 설계" 섹션 참조

| 카테고리 | 기능 |
|----------|------|
| **Growth 자동화** | 크레딧 소진 알림 (실시간), 이탈 방지 알림 (배치) |
| **알림 인프라** | 솔라피 알림톡 (기존 코드 재사용) |
| **KPI 대시보드** | 매출, 사용자, 서비스 지표 전체 |
| **운영 도구** | 크레딧 지급/차감, 환불(자동), 프로모션 코드, 사용자 관리, 공지 팝업 |

### Phase 3: 네이티브 앱 (나중에)

| 기능 | 설명 |
|------|------|
| Expo 앱 개발 | WebView 쉘 + 네이티브 푸시 |
| 앱스토어 배포 | iOS App Store, Google Play Store |
| 푸시 알림 | Expo Push Notifications |
| 푸시 우선 발송 | 푸시 → 알림톡 fallback |

### 테스트 시나리오

1. 결제 문의 → 크레딧 미지급 감지 → 지급 제안 → 승인 → 지급 완료
2. 오류 문의 → Sentry 에러 조회 → 코드 위치 제시 → 답변 승인
3. 사용법 문의 → 매뉴얼 기반 답변 → 승인
4. AI 분석 실패 → 에러 표시 → 수동 답변 작성
5. 문의 → 답변 → 고객 뱃지 확인 → 읽음 처리

---

## 12. 환경 변수

### 12.1 기존 환경 변수 (이미 있음)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# 앱 URL
NEXT_PUBLIC_APP_URL=
```

### 12.2 새로 추가할 환경 변수

```bash
# 관리자 인증
ADMIN_PASSWORD=          # 32자 이상 강력한 비밀번호
ADMIN_JWT_SECRET=        # JWT 서명 키 (32바이트 이상)
ADMIN_EMAIL=             # 알림 받을 이메일 주소

# Resend (이메일)
RESEND_API_KEY=          # Resend API 키

# Sentry
NEXT_PUBLIC_SENTRY_DSN=  # Sentry DSN
SENTRY_AUTH_TOKEN=       # Sentry API 토큰 (에러 조회용)
SENTRY_ORG=              # Sentry 조직 슬러그
SENTRY_PROJECT=          # Sentry 프로젝트 슬러그

# GitHub (코드 조회)
GITHUB_TOKEN=            # Personal Access Token (public_repo 권한)
GITHUB_REPO_OWNER=       # 레포 소유자
GITHUB_REPO_NAME=        # 레포 이름

# Vercel Cron (Phase 2)
CRON_SECRET=             # Cron API 인증용 시크릿
```

### 12.3 키 생성 방법

```bash
# ADMIN_PASSWORD (32자 랜덤)
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"

# ADMIN_JWT_SECRET (32바이트)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 12.4 GitHub Token 생성

1. GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token (classic)
3. 권한 선택: `public_repo` (Public 레포) 또는 `repo` (Private 레포)
4. 토큰 복사 후 환경변수에 저장

---

## 부록: 비용 추정

### 월간 예상 비용 (고객 1,000명 기준)

| 서비스 | 플랜 | 예상 비용 |
|--------|------|----------|
| Vercel | Hobby (무료) | $0 |
| Supabase | Free | $0 |
| OpenAI | 사용량 | ~$10 |
| Sentry | Developer (무료) | $0 |
| Resend | Free (월 3,000건) | $0 |
| **합계** | | **~$10/월** |

---

## 13. Phase 2 상세 설계

> **목표**: 운영 대시보드 + Growth 자동화
> **개발 기간**: 5주
> **추가 비용**: ~₩3,000/월 (알림톡)

### 13.1 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    관리자 대시보드 (/admin)                    │
├─────────────────────────────────────────────────────────────┤
│  Phase 1 (CS)          │  Phase 2 (Growth + 운영)           │
│  ┌───────────┐         │  ┌───────────┐ ┌───────────┐      │
│  │ CS 문의   │         │  │ KPI 현황  │ │ 사용자    │      │
│  │ 관리      │         │  │ 대시보드  │ │ 관리      │      │
│  └───────────┘         │  └───────────┘ └───────────┘      │
│                        │  ┌───────────┐ ┌───────────┐      │
│                        │  │ 프로모션  │ │ 공지/배너 │      │
│                        │  │ 코드      │ │ 관리      │      │
│                        │  └───────────┘ └───────────┘      │
│                        │  ┌───────────┐                    │
│                        │  │ Growth    │                    │
│                        │  │ 설정      │                    │
│                        │  └───────────┘                    │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────────┐  ┌──────────┐  ┌──────────┐
        │ 솔라피       │  │ 토스     │  │ Vercel   │
        │ (알림톡)     │  │ (환불)   │  │ Cron     │
        └──────────────┘  └──────────┘  └──────────┘
```

### 13.2 데이터베이스 스키마 (Phase 2)

#### 13.2.1 신규 테이블

```sql
-- ═══════════════════════════════════════════════════════════
-- 프로모션 코드
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  credit_amount integer NOT NULL,
  max_uses integer,                      -- NULL = 무제한
  used_count integer DEFAULT 0,
  expires_at timestamptz,                -- NULL = 무기한
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code) WHERE is_active = true;

-- ═══════════════════════════════════════════════════════════
-- 프로모션 코드 사용 내역
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.promo_code_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credit_transaction_id uuid REFERENCES credit_transactions(id) ON DELETE SET NULL,  -- nullable (기존 add_credit이 integer 반환)
  used_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_promo_code_uses_unique ON promo_code_uses(promo_code_id, user_id);
CREATE INDEX idx_promo_code_uses_promo_code_id ON promo_code_uses(promo_code_id);
CREATE INDEX idx_promo_code_uses_user_id ON promo_code_uses(user_id);

-- ═══════════════════════════════════════════════════════════
-- 공지/팝업
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  image_url text,
  link_url text,
  target_audience text DEFAULT 'all',    -- 'all' | 'employer' | 'worker'
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_active ON announcements(starts_at, ends_at) 
  WHERE is_active = true;

-- ═══════════════════════════════════════════════════════════
-- 공지 확인 기록
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.announcement_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_announcement_views_unique ON announcement_views(announcement_id, user_id);
CREATE INDEX idx_announcement_views_announcement_id ON announcement_views(announcement_id);
CREATE INDEX idx_announcement_views_user_id ON announcement_views(user_id);

-- ═══════════════════════════════════════════════════════════
-- Growth 알림 발송 기록
-- ═══════════════════════════════════════════════════════════
-- ⚠️ 기존 notification_logs 테이블과의 관계:
--   - notification_logs: 계약서 관련 알림톡 (서명 요청, 만료 알림 등)
--   - growth_logs: 마케팅/리텐션 알림 (크레딧 소진, 이탈 방지 등)
--   - 목적이 다르므로 별도 테이블로 분리 (통계/분석 용이)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.growth_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,                    -- 'credit_low' | 'retention_3d'
  channel text NOT NULL,                 -- 'push' | 'alimtalk'
  status text NOT NULL,                  -- 'sent' | 'failed' | 'skipped'
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_growth_logs_user_id ON growth_logs(user_id);
CREATE INDEX idx_growth_logs_user_type ON growth_logs(user_id, type);
CREATE INDEX idx_growth_logs_sent_at ON growth_logs(sent_at DESC);
```

#### 13.2.2 기존 테이블 수정

```sql
-- profiles 테이블에 차단 관련 컬럼 추가
ALTER TABLE profiles ADD COLUMN is_blocked boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN blocked_at timestamptz;
ALTER TABLE profiles ADD COLUMN blocked_reason text;

-- payments 테이블에 환불 관련 컬럼 추가
ALTER TABLE payments ADD COLUMN refund_status text;         -- 'none' | 'partial' | 'full'
ALTER TABLE payments ADD COLUMN refund_amount integer DEFAULT 0;
ALTER TABLE payments ADD COLUMN refunded_at timestamptz;
ALTER TABLE payments ADD COLUMN refund_reason text;
```

#### 13.2.3 RLS 정책

```sql
-- promo_codes: 관리자만 (service_role로 접근)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- promo_code_uses: 사용자는 본인 것만
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promo_code_uses_select_own" ON promo_code_uses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "promo_code_uses_insert_own" ON promo_code_uses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- announcements: 활성 공지는 모든 인증 사용자 조회 가능
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_select_active" ON announcements
  FOR SELECT TO authenticated
  USING (
    is_active = true 
    AND starts_at <= now() 
    AND (ends_at IS NULL OR ends_at > now())
  );

-- announcement_views: 본인 것만
ALTER TABLE announcement_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcement_views_select_own" ON announcement_views
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "announcement_views_insert_own" ON announcement_views
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- growth_logs: 관리자만 (service_role로 접근)
ALTER TABLE growth_logs ENABLE ROW LEVEL SECURITY;
```

#### 13.2.4 프로모션 코드 RPC 함수 (동시성 처리)

```sql
-- ⚠️ 기존 add_credit RPC는 integer를 반환하므로 credit_transaction_id는 별도 조회
CREATE OR REPLACE FUNCTION redeem_promo_code(
  p_user_id uuid,
  p_code text
) RETURNS jsonb AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_new_balance integer;
BEGIN
  -- 코드 조회 + 락 (동시 사용 방지)
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE code = upper(p_code)
  AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', '유효하지 않은 코드입니다');
  END IF;

  -- 만료 체크
  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', '만료된 코드입니다');
  END IF;

  -- 사용 횟수 체크
  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', '사용 횟수를 초과한 코드입니다');
  END IF;

  -- 중복 사용 체크
  IF EXISTS (SELECT 1 FROM promo_code_uses WHERE promo_code_id = v_promo.id AND user_id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', '이미 사용한 코드입니다');
  END IF;

  -- 크레딧 지급 (기존 add_credit RPC 호출 - integer 반환)
  SELECT add_credit(
    p_user_id, 
    'contract', 
    v_promo.credit_amount, 
    '[프로모션] ' || v_promo.code,
    NULL  -- reference_id
  ) INTO v_new_balance;

  -- 사용 기록 (credit_transaction_id 없이 저장 - nullable)
  INSERT INTO promo_code_uses (promo_code_id, user_id)
  VALUES (v_promo.id, p_user_id);

  -- 사용 횟수 증가
  UPDATE promo_codes SET used_count = used_count + 1 WHERE id = v_promo.id;

  RETURN jsonb_build_object(
    'success', true, 
    'credit_amount', v_promo.credit_amount,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 13.3 알림 인프라

#### 13.3.1 기존 솔라피 코드 재사용

```typescript
// 기존 lib/solapi/client.ts 활용 (수정 없이 그대로 사용)
import { sendAlimtalkWithSDK } from '@/lib/solapi/client';

// lib/solapi/templates.ts 수정 - 기존 TEMPLATE_IDS에 Growth 템플릿 추가
export const TEMPLATE_IDS = {
  // ─── 기존 ───
  CONTRACT_SIGN_REQUEST: process.env.SOLAPI_TEMPLATE_CONTRACT_SIGN || '',
  
  // ─── Growth (Phase 2 추가) ───
  CREDIT_LOW: process.env.SOLAPI_TEMPLATE_CREDIT_LOW || '',
  RETENTION_3D: process.env.SOLAPI_TEMPLATE_RETENTION_3D || '',
} as const;
```

#### 13.3.2 통합 알림 함수

```typescript
// lib/notifications/growth.ts

import { createAdminClient } from '@/lib/supabase/server';
import { sendAlimtalkWithSDK } from '@/lib/solapi/client';
import { TEMPLATE_IDS } from '@/lib/solapi/templates';

export async function sendGrowthNotification(
  userId: string,
  type: 'credit_low' | 'retention_3d',
  data: { name: string; creditBalance?: number }
) {
  const supabase = createAdminClient();
  
  // 1. 사용자 정보 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('phone, name')
    .eq('id', userId)
    .single();

  if (!profile?.phone) {
    await logGrowthNotification(supabase, userId, type, 'skipped', 'no_phone');
    return { success: false, reason: 'no_phone' };
  }

  // 2. 인앱 알림 저장
  const content = getNotificationContent(type, data);
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'system',
    title: content.title,
    body: content.body,
  });

  // 3. 알림톡 발송
  const result = await sendAlimtalkWithSDK({
    receiver: profile.phone,
    templateId: TEMPLATE_IDS[type.toUpperCase() as keyof typeof TEMPLATE_IDS],
    variables: {
      이름: profile.name || '고객',
      남은개수: String(data.creditBalance || 0),
    },
    pfId: process.env.SOLAPI_KAKAO_PF_ID || '',
  });

  // 4. 발송 로그 저장
  await logGrowthNotification(
    supabase, 
    userId, 
    type, 
    result.success ? 'sent' : 'failed',
    result.error
  );

  return result;
}

async function logGrowthNotification(
  supabase: any,
  userId: string,
  type: string,
  status: string,
  errorMessage?: string
) {
  await supabase.from('growth_logs').insert({
    user_id: userId,
    type,
    channel: 'alimtalk',
    status,
    error_message: errorMessage,
  });
}

function getNotificationContent(type: string, data: any) {
  const contents: Record<string, { title: string; body: string }> = {
    credit_low: {
      title: '크레딧이 부족해요',
      body: `크레딧이 ${data.creditBalance}개 남았습니다. 지금 충전하세요!`,
    },
    retention_3d: {
      title: '계약서 작성해보세요',
      body: '아직 계약서를 작성하지 않으셨네요. 무료로 체험해보세요!',
    },
  };
  return contents[type];
}
```

### 13.4 Growth 자동화

#### 13.4.1 크레딧 소진 알림 (실시간)

**기존 코드 구조 반영**: signplease에서는 `use_credit` RPC를 Server Action에서 직접 호출합니다.
새 유틸 파일을 만들지 않고, 기존 호출 위치에 `after()` 훅을 추가합니다.

```typescript
// ═══════════════════════════════════════════════════════════
// 방법 1: 기존 Server Action 수정 (권장)
// ═══════════════════════════════════════════════════════════

// app/(protected)/employer/create/actions.ts 수정
import { after } from 'next/server';
import { checkAndSendCreditLowAlert } from '@/lib/notifications/growth';

export async function createContract(formData: FormData, signatureData: string | null) {
  // ... 기존 코드 ...

  // 크레딧 확인 및 차감
  const { data: creditResult, error: creditError } = await supabase.rpc(
    'use_credit',
    {
      p_user_id: user.id,
      p_amount: 1,
      p_credit_type: 'contract',
      p_description: '계약서 작성',
    }
  );

  if (creditError || !creditResult) {
    return { success: false, error: '크레딧이 부족해요' };
  }

  // 🆕 비동기로 크레딧 소진 알림 체크 (응답 후 실행)
  after(async () => {
    await checkAndSendCreditLowAlert(user.id, 'contract');
  });

  // ... 나머지 계약서 생성 로직 ...
}

// ═══════════════════════════════════════════════════════════
// 방법 2: 래퍼 함수 생성 (선택)
// ═══════════════════════════════════════════════════════════

// lib/credits/index.ts (신규)
import { after } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendGrowthNotification } from '@/lib/notifications/growth';

export async function useCreditWithAlert(
  userId: string, 
  creditType: 'contract' | 'ai_review',
  description: string
) {
  const supabase = await createClient();

  const { data: result, error } = await supabase.rpc('use_credit', {
    p_user_id: userId,
    p_amount: 1,
    p_credit_type: creditType,
    p_description: description,
  });

  if (!error && result) {
    // 비동기로 알림 체크
    after(async () => {
      await checkAndSendCreditLowAlert(userId, creditType);
    });
  }

  return { result, error };
}

async function checkAndSendCreditLowAlert(userId: string, creditType: string) {
  const supabase = createAdminClient();

  // 남은 크레딧 확인
  const { data: credits } = await supabase
    .from('credits')
    .select('amount')
    .eq('user_id', userId)
    .eq('credit_type', creditType)
    .single();

  if (credits?.amount !== 1) return;

  // 중복 발송 방지: 최근 24시간 내 발송 이력 확인
  const { data: recentLog } = await supabase
    .from('growth_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'credit_low')
    .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1);

  if (recentLog?.length) return;

  // 알림 발송
  await sendGrowthNotification(userId, 'credit_low', {
    name: '',
    creditBalance: 1,
  });
}
```

#### 13.4.2 이탈 방지 알림 (배치 - Vercel Cron)

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/retention-alert",
      "schedule": "0 1 * * *"
    }
  ]
}
```

```typescript
// app/api/cron/retention-alert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendGrowthNotification } from '@/lib/notifications/growth';

export async function GET(request: NextRequest) {
  // Vercel Cron 인증
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 대상자 조회: 가입 3일 지남 + 계약서 0건 + 알림 미발송
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();

  const { data: targets } = await supabase
    .from('profiles')
    .select(`
      id,
      name,
      phone,
      created_at,
      contracts:contracts(count)
    `)
    .gte('created_at', fourDaysAgo)
    .lte('created_at', threeDaysAgo)
    .eq('is_blocked', false);

  const inactiveUsers = targets?.filter(
    user => user.contracts?.[0]?.count === 0
  ) || [];

  // 이미 발송된 사용자 제외
  const { data: sentLogs } = await supabase
    .from('growth_logs')
    .select('user_id')
    .eq('type', 'retention_3d')
    .in('user_id', inactiveUsers.map(u => u.id));

  const sentUserIds = new Set(sentLogs?.map(l => l.user_id) || []);
  const finalTargets = inactiveUsers.filter(u => !sentUserIds.has(u.id));

  // 알림 발송
  let sentCount = 0;
  for (const user of finalTargets) {
    await sendGrowthNotification(user.id, 'retention_3d', {
      name: user.name || '고객',
    });
    sentCount++;
  }

  return NextResponse.json({
    success: true,
    targetCount: finalTargets.length,
    sentCount,
  });
}
```

### 13.5 운영 도구

#### 13.5.1 크레딧 수동 지급/차감

```typescript
// app/admin/actions.ts
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/admin/auth';

export async function adminAddCredit(
  userId: string,
  creditType: 'contract' | 'ai_review',
  amount: number,
  reason: string
) {
  await verifyAdmin();
  const supabase = createAdminClient();

  await supabase.rpc('add_credit', {
    p_user_id: userId,
    p_credit_type: creditType,
    p_amount: amount,
    p_description: `[관리자 지급] ${reason}`,
  });

  return { success: true };
}

export async function adminDeductCredit(
  userId: string,
  creditType: 'contract' | 'ai_review',
  amount: number,
  reason: string
) {
  await verifyAdmin();
  const supabase = createAdminClient();

  await supabase.rpc('add_credit', {
    p_user_id: userId,
    p_credit_type: creditType,
    p_amount: -amount,
    p_description: `[관리자 차감] ${reason}`,
  });

  return { success: true };
}
```

#### 13.5.2 환불 처리 (토스페이먼츠 API)

```typescript
// lib/payments/refund.ts

export async function refundPayment(
  paymentKey: string,
  reason: string,
  amount?: number
) {
  const response = await fetch(
    `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancelReason: reason,
        ...(amount && { cancelAmount: amount }),
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

// app/admin/actions.ts
export async function adminRefundPayment(
  paymentId: string,
  reason: string,
  amount?: number
) {
  await verifyAdmin();
  const supabase = createAdminClient();

  // 결제 정보 조회
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (!payment?.payment_key) {
    throw new Error('결제 정보를 찾을 수 없습니다');
  }

  // 토스페이먼츠 환불 요청
  const refundAmount = amount || payment.amount;
  await refundPayment(payment.payment_key, reason, amount);

  // DB 업데이트
  await supabase
    .from('payments')
    .update({
      refund_status: amount ? 'partial' : 'full',
      refund_amount: refundAmount,
      refunded_at: new Date().toISOString(),
      refund_reason: reason,
    })
    .eq('id', paymentId);

  // 크레딧 차감 (지급된 크레딧 회수)
  if (payment.credits_contract > 0) {
    await supabase.rpc('add_credit', {
      p_user_id: payment.user_id,
      p_credit_type: 'contract',
      p_amount: -payment.credits_contract,
      p_description: `[환불] ${reason}`,
      p_reference_id: paymentId,
    });
  }

  return { success: true };
}
```

#### 13.5.3 사용자 관리

```typescript
// app/admin/actions.ts

export async function getUsers(filter: {
  search?: string;
  role?: 'employer' | 'worker';
  isBlocked?: boolean;
  page?: number;
  limit?: number;
}) {
  await verifyAdmin();
  const supabase = createAdminClient();
  const page = filter.page || 1;
  const limit = filter.limit || 20;

  let query = supabase
    .from('profiles')
    .select(`
      *,
      credits(credit_type, amount),
      contracts(count),
      payments(count)
    `, { count: 'exact' });

  if (filter.search) {
    query = query.or(`name.ilike.%${filter.search}%,phone.ilike.%${filter.search}%`);
  }
  if (filter.role) {
    query = query.eq('role', filter.role);
  }
  if (filter.isBlocked !== undefined) {
    query = query.eq('is_blocked', filter.isBlocked);
  }

  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  return { users: data, total: count };
}

export async function blockUser(userId: string, reason: string) {
  await verifyAdmin();
  const supabase = createAdminClient();

  await supabase
    .from('profiles')
    .update({
      is_blocked: true,
      blocked_at: new Date().toISOString(),
      blocked_reason: reason,
    })
    .eq('id', userId);

  return { success: true };
}

export async function unblockUser(userId: string) {
  await verifyAdmin();
  const supabase = createAdminClient();

  await supabase
    .from('profiles')
    .update({
      is_blocked: false,
      blocked_at: null,
      blocked_reason: null,
    })
    .eq('id', userId);

  return { success: true };
}

export async function deleteUser(userId: string) {
  await verifyAdmin();
  const supabase = createAdminClient();

  // Supabase Auth에서 사용자 삭제 (CASCADE로 profiles도 삭제됨)
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;

  return { success: true };
}
```

#### 13.5.4 사용자 차단 시 로그인 체크

```typescript
// middleware.ts 또는 로그인 후 체크에 추가

async function checkUserBlocked(userId: string) {
  const supabase = createAdminClient();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_blocked')
    .eq('id', userId)
    .single();

  if (profile?.is_blocked) {
    await supabase.auth.signOut();
    throw new Error('차단된 계정입니다');
  }
}
```

### 13.6 KPI 대시보드

```typescript
// app/admin/actions.ts

export async function getDashboardStats() {
  await verifyAdmin();
  const supabase = createAdminClient();
  const now = new Date();
  
  const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [revenue, users, service, chart] = await Promise.all([
    getRevenueStats(supabase, todayStart, weekStart, monthStart),
    getUserStats(supabase, todayStart),
    getServiceStats(supabase, todayStart),
    getChartData(supabase, weekStart),
  ]);

  return { revenue, users, service, chart };
}

async function getRevenueStats(supabase: any, today: string, week: string, month: string) {
  const [todayData, weekData, monthData] = await Promise.all([
    supabase.from('payments').select('amount').eq('status', 'paid').gte('paid_at', today),
    supabase.from('payments').select('amount').eq('status', 'paid').gte('paid_at', week),
    supabase.from('payments').select('amount').eq('status', 'paid').gte('paid_at', month),
  ]);

  return {
    today: {
      amount: todayData.data?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0,
      count: todayData.data?.length || 0,
    },
    week: {
      amount: weekData.data?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0,
      count: weekData.data?.length || 0,
    },
    month: {
      amount: monthData.data?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0,
      count: monthData.data?.length || 0,
    },
  };
}

async function getUserStats(supabase: any, today: string) {
  const [total, todaySignups, dau, roles] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today),
    supabase.from('contracts').select('employer_id', { count: 'exact', head: true }).gte('created_at', today),
    supabase.from('profiles').select('role').not('role', 'is', null),
  ]);

  return {
    total: total.count || 0,
    todaySignups: todaySignups.count || 0,
    dau: dau.count || 0,
    employers: roles.data?.filter((p: any) => p.role === 'employer').length || 0,
    workers: roles.data?.filter((p: any) => p.role === 'worker').length || 0,
  };
}

async function getServiceStats(supabase: any, today: string) {
  const [contracts, credits, aiReviews] = await Promise.all([
    supabase.from('contracts').select('*', { count: 'exact', head: true }).gte('created_at', today),
    supabase.from('credit_transactions').select('amount').lt('amount', 0).gte('created_at', today),
    supabase.from('ai_reviews').select('*', { count: 'exact', head: true }).gte('created_at', today),
  ]);

  return {
    contracts: contracts.count || 0,
    creditsUsed: Math.abs(credits.data?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0),
    aiReviews: aiReviews.count || 0,
  };
}
```

### 13.7 관리자 UI 구조 (데스크탑 전용)

```
/admin
├── /                     → 대시보드 (KPI 현황)
├── /inquiries            → CS 문의 관리 (Phase 1)
│   └── /[id]             → 문의 상세
├── /users                → 사용자 관리
│   └── /[id]             → 사용자 상세
├── /payments             → 결제/환불 관리
├── /promos               → 프로모션 코드
├── /announcements        → 공지/팝업 관리
├── /growth               → Growth 설정
└── /login                → 로그인
```

### 13.8 개발 일정

```
Week 1: 알림 인프라 + Growth 기반
├── 알림톡 템플릿 등록 (카카오 승인 신청) ⚠️ 3-5일 소요
├── growth_logs 테이블 생성
├── Vercel Cron 설정
└── 크레딧 소진 알림 구현 (실시간)

Week 2: Growth 완성 + 운영 도구 시작
├── 이탈 방지 알림 구현 (배치)
├── Growth 설정 페이지 (관리자)
├── promo_codes 테이블 생성
├── 프로모션 코드 CRUD + RPC 함수
└── 프로모션 코드 사용 (사용자)

Week 3: 운영 도구 완성
├── profiles 테이블 수정 (is_blocked 등)
├── payments 테이블 수정 (환불 컬럼)
├── 사용자 관리 (조회, 차단, 수정, 삭제)
├── 크레딧 수동 지급/차감
├── 환불 처리 (토스페이먼츠 API)
└── announcements 테이블 + 공지 팝업

Week 4: KPI 대시보드 + 통합
├── 대시보드 통계 함수
├── 대시보드 UI (차트 포함)
├── 관리자 사이드바/레이아웃 정리
└── Phase 1 CS 메뉴와 통합

Week 5: 테스트 + 배포
├── 전체 기능 테스트
├── 엣지 케이스 처리
├── 에러 핸들링 보완
└── 배포
```

### 13.9 환경 변수 (Phase 2 추가분)

```bash
# ─── 기존에 이미 있음 ───
# SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_KAKAO_PF_ID 등

# ─── Phase 2에서 새로 추가 ───

# 솔라피 Growth 템플릿
SOLAPI_TEMPLATE_CREDIT_LOW=       # 크레딧 소진 알림톡 템플릿 ID
SOLAPI_TEMPLATE_RETENTION_3D=     # 이탈 방지 알림톡 템플릿 ID

# Vercel Cron
CRON_SECRET=                      # Cron 인증용 시크릿

# 토스페이먼츠 (환불용)
TOSS_SECRET_KEY=                  # 토스페이먼츠 Secret Key
```

### 13.10 테스트 시나리오 (Phase 2)

| # | 시나리오 | 예상 결과 |
|---|----------|----------|
| 1 | 크레딧 1개 남음 | 인앱 알림 + 알림톡 발송 |
| 2 | 가입 3일 후 미사용 | 다음날 10시 알림톡 발송 |
| 3 | 프로모션 코드 입력 | 크레딧 지급 + 사용 기록 |
| 4 | 동일 코드 재입력 | "이미 사용한 코드" 에러 |
| 5 | 관리자 환불 처리 | 토스 환불 + 크레딧 회수 |
| 6 | 사용자 차단 | 로그아웃 + 재로그인 불가 |
| 7 | 공지 팝업 등록 | 앱 진입 시 1회 표시 |
| 8 | 동시에 같은 프로모션 코드 사용 | 1명만 성공 (락) |

### 13.11 비용 추정 (Phase 2 추가분)

| 서비스 | 용도 | 예상 비용 |
|--------|------|----------|
| 솔라피 알림톡 | Growth 알림 | ~₩3,000/월 (월 300건 × 9원) |
| Vercel Cron | 배치 작업 | $0 (무료) |
| **Phase 2 추가 비용** | | **~₩3,000/월** |

**총 예상 비용 (Phase 1 + 2)**: ~$10 + ₩3,000 ≈ **₩16,000/월**

---

## 14. 기존 signplease 코드베이스와의 정합성 검토

### 14.1 검토 완료 항목

| 항목 | 기존 signplease | PRD 설계 | 상태 |
|------|----------------|----------|------|
| 라우트 그룹 | `(protected)`, `(public)` | 동일 + `/admin` | ✅ 호환 |
| Supabase 클라이언트 | `createClient()`, `createAdminClient()` | 동일 | ✅ 일치 |
| Server Actions 패턴 | `'use server'` + `ActionResult<T>` | 동일 | ✅ 일치 |
| 미들웨어 | `lib/supabase/middleware.ts` | 확장 (9.2절 참조) | ✅ 반영됨 |
| Solapi 클라이언트 | `lib/solapi/client.ts` 존재 | 재사용 | ✅ 호환 |
| `add_credit` RPC | 존재 (integer 반환) | 그대로 사용 | ✅ 반영됨 |
| `notifications` 테이블 | 존재 (5개 type) | ENUM 확장 (3.1절) | ✅ 반영됨 |

### 14.2 마이그레이션 필요 항목

개발 시작 전 아래 마이그레이션 실행 필요:

```sql
-- 1. notification_type ENUM 확장
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'system';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'cs_reply';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'credit_low';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'promo_applied';

-- 2. profiles 테이블 컬럼 추가 (Phase 2)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_reason text;

-- 3. payments 테이블 환불 컬럼 추가 (Phase 2)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_status text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_amount integer DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_at timestamptz;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_reason text;
```

### 14.3 types/database.ts 재생성

테이블 추가/수정 후 TypeScript 타입 재생성 필요:

```bash
npx supabase gen types typescript --project-id <project-id> > types/database.ts
```

### 14.4 기존 고객센터 UI 수정 필요

`app/(protected)/support/page.tsx`에 1:1 문의 링크 추가:

```typescript
// 기존 이메일 문의 외에 1:1 문의 추가
<Link href="/support/inquiry">
  <div className="bg-white rounded-2xl p-5 shadow-sm">
    <h2>💬 1:1 문의하기</h2>
    <p>빠른 답변을 받아보세요</p>
  </div>
</Link>
```

### 14.5 신규 패키지 설치 필요 (Phase 1)

현재 signplease에 설치되지 않은 패키지:

```bash
# Sentry (에러 모니터링 + CS 연동)
npm install @sentry/nextjs

# Resend (관리자 이메일 알림)
npm install resend

# jose (Edge Runtime에서 JWT 검증 - 미들웨어용)
npm install jose
```

### 14.6 Sentry 초기 설정

```bash
# Sentry CLI로 프로젝트 설정
npx @sentry/wizard@latest -i nextjs
```

설정 후 로그인 성공 시 사용자 연동 필요:

```typescript
// app/(public)/auth/callback/route.ts 수정
import * as Sentry from '@sentry/nextjs';

// 로그인 성공 후
Sentry.setUser({ id: user.id, email: user.email });
```

### 14.7 크레딧 사용 후 알림 연동

기존 크레딧 사용 위치에 `after()` 훅 추가 필요:

| 파일 | 함수 | 수정 내용 |
|------|------|----------|
| `app/(protected)/employer/create/actions.ts` | `createContract()` | 계약서 작성 후 알림 체크 |
| AI 리뷰 관련 파일 | 리뷰 요청 함수 | AI 리뷰 사용 후 알림 체크 |

### 14.8 기존 테이블과 신규 테이블 관계

```
┌─────────────────────────────────────────────────────────────┐
│                     기존 테이블                              │
├─────────────────────────────────────────────────────────────┤
│ notifications      │ 계약서 관련 인앱 알림 (5개 타입)        │
│ notification_logs  │ 알림톡/SMS/Push 발송 로그 (계약서용)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 확장
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Phase 1/2 신규/수정                        │
├─────────────────────────────────────────────────────────────┤
│ notifications      │ + system, cs_reply, credit_low 타입    │
│ growth_logs        │ 마케팅/리텐션 알림 발송 로그 (Growth용) │
│ cs_inquiries       │ 1:1 문의 (CS용)                        │
│ cs_responses       │ 문의 답변 (CS용)                       │
│ promo_codes        │ 프로모션 코드 (Growth용)               │
│ announcements      │ 공지/팝업 (운영용)                     │
└─────────────────────────────────────────────────────────────┘
```

---

*이 문서는 브레인스토밍을 통해 작성되었습니다.*
*Phase 1 작성일: 2026년 2월 5일*
*Phase 2 추가일: 2026년 2월 5일*
*코드베이스 정합성 검토일: 2026년 2월 5일*
*심층 검토 완료일: 2026년 2월 6일 (3차 반복 검토 완료, 이슈 0건)*
