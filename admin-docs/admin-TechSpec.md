# DevSupport AI - Tech Spec (기술 명세서)

> **버전**: 1.0  
> **작성일**: 2026년 2월 6일  
> **기준 문서**: PRD.md, IA.md

---

## 1. 기술 스택 요약

| 구분 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **Framework** | Next.js | 15.x | App Router, Server Actions |
| **Language** | TypeScript | 5.x | 타입 안전성 |
| **Database** | Supabase (PostgreSQL) | 17.x | 데이터 저장, RLS, RPC |
| **Hosting** | Vercel | Hobby | 배포, Cron Jobs |
| **AI** | OpenAI GPT-4o | - | 문의 분석, 답변 생성 |
| **Auth (사용자)** | Supabase Auth | - | 카카오/애플 OAuth |
| **Auth (관리자)** | jose | 5.x | JWT 생성/검증 |
| **Email** | Resend | - | 관리자 알림 |
| **Error Tracking** | Sentry | 8.x | 에러 모니터링 + API |
| **알림톡** | Solapi | - | 카카오 알림톡 (기존) |
| **결제** | 토스페이먼츠 | - | 결제/환불 (기존) |

---

## 2. 패키지 의존성

### 2.1 신규 설치 필요

```bash
# Phase 1 필수
npm install @sentry/nextjs    # 에러 모니터링
npm install resend            # 이메일 발송
npm install jose              # JWT (Edge Runtime 호환)

# 이미 설치됨 (확인 필요)
# openai, @supabase/supabase-js, solapi
```

### 2.2 package.json 추가 항목

```json
{
  "dependencies": {
    "@sentry/nextjs": "^8.0.0",
    "resend": "^3.0.0",
    "jose": "^5.0.0"
  }
}
```

---

## 3. 환경 변수

### 3.1 기존 (이미 설정됨)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# 앱 URL
NEXT_PUBLIC_APP_URL=

# Solapi (알림톡)
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER_PHONE=
SOLAPI_KAKAO_PF_ID=
```

### 3.2 Phase 1 추가

```bash
# 관리자 인증
ADMIN_PASSWORD=              # 32자 이상 랜덤 문자열
ADMIN_JWT_SECRET=            # 32바이트 이상 시크릿
ADMIN_EMAIL=                 # 알림 받을 이메일

# Resend
RESEND_API_KEY=              # Resend Dashboard에서 발급

# Sentry
NEXT_PUBLIC_SENTRY_DSN=      # Sentry 프로젝트 DSN
SENTRY_AUTH_TOKEN=           # API 토큰 (에러 조회용)
SENTRY_ORG=                  # 조직 슬러그
SENTRY_PROJECT=              # 프로젝트 슬러그

# GitHub (코드 조회)
GITHUB_TOKEN=                # Personal Access Token
GITHUB_REPO_OWNER=           # 레포 소유자 (예: username)
GITHUB_REPO_NAME=            # 레포 이름 (예: signplease)
```

### 3.3 Phase 2 추가

```bash
# Vercel Cron 인증
CRON_SECRET=                 # Cron API 호출 인증

# Growth 알림톡 템플릿
SOLAPI_TEMPLATE_CREDIT_LOW=  # 크레딧 부족 템플릿 ID
SOLAPI_TEMPLATE_RETENTION_3D= # 이탈 방지 템플릿 ID
```

### 3.4 키 생성 명령어

```bash
# ADMIN_PASSWORD (32자)
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"

# ADMIN_JWT_SECRET (32바이트)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# CRON_SECRET
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## 4. 데이터베이스 스키마

### 4.1 Phase 1 테이블

#### cs_inquiries (1:1 문의)

```sql
CREATE TABLE public.cs_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category inquiry_category NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  status inquiry_status NOT NULL DEFAULT 'pending',
  
  -- AI 분석 결과
  ai_response text,
  ai_developer_note text,
  ai_generated_at timestamptz,
  
  -- 컨텍스트
  user_context jsonb,
  sentry_errors jsonb,
  
  -- 자동 액션
  auto_action_taken text,
  auto_action_details jsonb,
  
  -- 읽음 상태
  has_unread_response boolean DEFAULT false,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz
);

-- 인덱스
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

#### cs_settings (설정)

```sql
CREATE TABLE public.cs_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 4.2 Phase 2 테이블

#### promo_codes (프로모션 코드)

```sql
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  credit_amount integer NOT NULL,
  max_uses integer,                      -- NULL = 무제한
  used_count integer DEFAULT 0,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code) WHERE is_active = true;
```

#### promo_code_uses (프로모션 사용 내역)

```sql
CREATE TABLE public.promo_code_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credit_transaction_id uuid REFERENCES credit_transactions(id) ON DELETE SET NULL,
  used_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_promo_code_uses_unique ON promo_code_uses(promo_code_id, user_id);
```

#### announcements (공지/팝업)

```sql
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
```

#### growth_logs (Growth 알림 로그)

```sql
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
CREATE INDEX idx_growth_logs_sent_at ON growth_logs(sent_at DESC);
```

### 4.3 기존 테이블 수정

```sql
-- notification_type ENUM 확장
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'system';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'cs_reply';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'credit_low';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'promo_applied';

-- profiles 테이블 (사용자 차단)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_reason text;

-- payments 테이블 (환불 정보)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_status text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_amount integer DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_at timestamptz;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_reason text;
```

### 4.4 ENUM 타입

```sql
CREATE TYPE public.inquiry_category AS ENUM ('payment', 'usage', 'bug', 'other');
CREATE TYPE public.inquiry_status AS ENUM ('pending', 'answered');
```

### 4.5 RPC 함수

#### redeem_promo_code (프로모션 코드 사용)

```sql
CREATE OR REPLACE FUNCTION redeem_promo_code(
  p_user_id uuid,
  p_code text
) RETURNS jsonb AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_new_balance integer;
BEGIN
  -- 코드 조회 + 락 (동시성 제어)
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

  -- 크레딧 지급
  SELECT add_credit(p_user_id, 'contract', v_promo.credit_amount, '[프로모션] ' || v_promo.code, NULL)
  INTO v_new_balance;

  -- 사용 기록
  INSERT INTO promo_code_uses (promo_code_id, user_id)
  VALUES (v_promo.id, p_user_id);

  -- 사용 횟수 증가
  UPDATE promo_codes SET used_count = used_count + 1 WHERE id = v_promo.id;

  RETURN jsonb_build_object('success', true, 'credit_amount', v_promo.credit_amount, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. RLS (Row Level Security) 정책

### 5.1 Phase 1

```sql
-- cs_inquiries
ALTER TABLE cs_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cs_inquiries_select_own" ON cs_inquiries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "cs_inquiries_insert_own" ON cs_inquiries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cs_inquiries_update_own" ON cs_inquiries
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- cs_responses
ALTER TABLE cs_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cs_responses_select_own" ON cs_responses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM cs_inquiries WHERE id = inquiry_id AND user_id = auth.uid()
  ));

-- cs_manuals, cs_settings (관리자 전용 - service_role)
ALTER TABLE cs_manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_settings ENABLE ROW LEVEL SECURITY;
```

### 5.2 Phase 2

```sql
-- promo_codes (관리자 전용)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- promo_code_uses
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promo_code_uses_select_own" ON promo_code_uses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "promo_code_uses_insert_own" ON promo_code_uses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_select_active" ON announcements
  FOR SELECT TO authenticated
  USING (is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()));

-- growth_logs (관리자 전용)
ALTER TABLE growth_logs ENABLE ROW LEVEL SECURITY;
```

---

## 6. API 설계

### 6.1 Server Actions - 고객용

```typescript
// app/(protected)/support/inquiry/actions.ts
'use server';

export async function getMyInquiries(): Promise<Inquiry[]>
export async function getInquiry(id: string): Promise<InquiryDetail>
export async function createInquiry(data: CreateInquiryInput): Promise<{ success: boolean; id: string }>
export async function markAsRead(id: string): Promise<void>
export async function getUnreadCount(): Promise<number>
```

### 6.2 Server Actions - 관리자용

```typescript
// app/admin/actions.ts
'use server';

// 인증
export async function adminLogin(password: string): Promise<{ success: boolean }>
export async function adminLogout(): Promise<void>

// CS (Phase 1)
export async function getInquiries(filter: InquiryFilter): Promise<{ inquiries: Inquiry[]; total: number }>
export async function getInquiryDetail(id: string): Promise<InquiryDetailWithAI>
export async function updateResponse(id: string, content: string): Promise<void>
export async function approveInquiry(id: string): Promise<ApproveResult>
export async function regenerateAIAnalysis(id: string): Promise<void>

// 통계
export async function getStats(): Promise<Stats>
export async function getDashboardStats(): Promise<DashboardStats>

// 사용자 관리 (Phase 2)
export async function getUsers(filter: UserFilter): Promise<{ users: User[]; total: number }>
export async function blockUser(userId: string, reason: string): Promise<void>
export async function unblockUser(userId: string): Promise<void>
export async function deleteUser(userId: string): Promise<void>

// 크레딧 (Phase 2)
export async function adminAddCredit(userId: string, type: CreditType, amount: number, reason: string): Promise<void>
export async function adminDeductCredit(userId: string, type: CreditType, amount: number, reason: string): Promise<void>

// 환불 (Phase 2)
export async function adminRefundPayment(paymentId: string, reason: string, amount?: number): Promise<void>

// 프로모션 (Phase 2)
export async function createPromoCode(data: PromoCodeInput): Promise<void>
export async function updatePromoCode(id: string, data: Partial<PromoCodeInput>): Promise<void>
export async function deletePromoCode(id: string): Promise<void>
```

### 6.3 API Routes

```typescript
// app/api/cron/retention-alert/route.ts (Phase 2)
export async function GET(request: NextRequest): Promise<NextResponse>
// - Vercel Cron에서 호출 (매일 01:00 UTC)
// - CRON_SECRET 헤더 검증
// - 이탈 방지 알림 발송
```

---

## 7. 인증 시스템

### 7.1 관리자 인증 플로우

```
1. POST /admin/login
   └─ adminLogin(password)
      ├─ 비밀번호 검증 (ADMIN_PASSWORD)
      ├─ JWT 생성 (jose, 24h 유효)
      └─ 쿠키 저장 (admin_session, httpOnly)

2. Middleware 검증
   └─ /admin/* 접근 시
      ├─ admin_session 쿠키 확인
      ├─ JWT 검증 (jwtVerify)
      └─ 실패 시 /admin/login 리다이렉트

3. Server Action 검증
   └─ verifyAdmin()
      ├─ 쿠키에서 토큰 추출
      └─ JWT 검증 후 진행
```

### 7.2 JWT 구조

```typescript
// Payload
{
  role: 'admin',
  iat: 1707184800,        // 발급 시간
  exp: 1707271200         // 만료 (24h 후)
}

// 서명: HS256 with ADMIN_JWT_SECRET
```

### 7.3 미들웨어 구현

```typescript
// lib/supabase/middleware.ts (기존 파일 수정)
import { jwtVerify } from 'jose';

const ADMIN_ROUTES = ['/admin'];

export async function updateSession(request: NextRequest) {
  // ... 기존 Supabase 클라이언트 생성 ...
  
  const pathname = request.nextUrl.pathname;

  // 관리자 경로 보호
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));
  
  if (isAdminRoute && pathname !== '/admin/login') {
    const adminSession = request.cookies.get('admin_session')?.value;
    
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);
      await jwtVerify(adminSession, secret);
    } catch {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('admin_session');
      return response;
    }
    
    return supabaseResponse;
  }

  // ... 기존 사용자 인증 로직 ...
}
```

---

## 8. AI 분석 시스템

### 8.1 아키텍처

```
문의 상세 페이지 열림 (관리자)
         │
         ▼
    AI 분석 필요?
    (ai_generated_at == null)
         │
    ┌────┴────┐
    │ Yes     │ No
    ▼         ▼
  분석 실행   캐시 반환
    │
    ├─ 사용자 컨텍스트 수집
    │   └─ 크레딧, 결제 내역, 계약서 수
    │
    ├─ Sentry 에러 조회 (최근 24h)
    │
    ├─ GitHub 코드/매뉴얼 조회
    │
    ├─ OpenAI GPT-4o 호출
    │   └─ 시스템 프롬프트 + 컨텍스트
    │
    └─ 결과 저장 (cs_inquiries)
```

### 8.2 OpenAI 호출

```typescript
// lib/cs/ai.ts

import OpenAI from 'openai';

const openai = new OpenAI();

export async function analyzeInquiry(input: AIInput): Promise<AIOutput> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(input) }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### 8.3 토큰 최적화

| 항목 | 예상 토큰 |
|------|----------|
| 시스템 프롬프트 | ~500 |
| 사용자 컨텍스트 | ~200 |
| Sentry 에러 | ~300 |
| 코드베이스 (필터링 후) | ~80,000 |
| 매뉴얼 | ~5,000 |
| 문의 내용 | ~200 |
| **총 입력** | ~86,000 |
| **GPT-4o 한도** | 128,000 |

---

## 9. 외부 서비스 연동

### 9.1 Sentry API

```typescript
// lib/cs/sentry.ts

export async function getSentryErrors(userId: string): Promise<SentryError[]> {
  const response = await fetch(
    `https://sentry.io/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/issues/`,
    {
      headers: {
        'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`,
      },
    }
  );
  
  const issues = await response.json();
  return issues.filter((issue: any) => 
    issue.tags?.find((t: any) => t.key === 'user' && t.value === userId)
  );
}
```

### 9.2 GitHub API

```typescript
// lib/cs/github.ts

export async function getCodebase(): Promise<string> {
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  
  const { data } = await octokit.repos.getContent({
    owner: GITHUB_REPO_OWNER,
    repo: GITHUB_REPO_NAME,
    path: '',
  });
  
  // 파일 필터링 + 내용 조합
  return filterAndCombineCode(data);
}
```

### 9.3 Resend (이메일)

```typescript
// lib/cs/notifications.ts

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function notifyAdmin(inquiry: Inquiry): Promise<void> {
  await resend.emails.send({
    from: 'DevSupport <noreply@signplease.co.kr>',
    to: process.env.ADMIN_EMAIL!,
    subject: `[새 문의] ${inquiry.title}`,
    html: buildEmailTemplate(inquiry),
  });
}
```

### 9.4 토스페이먼츠 (환불)

```typescript
// lib/payments/refund.ts

export async function refundPayment(
  paymentKey: string,
  reason: string,
  amount?: number
): Promise<TossRefundResponse> {
  const response = await fetch(
    `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancelReason: reason,
        ...(amount && { cancelAmount: amount }),
      }),
    }
  );

  return response.json();
}
```

---

## 10. Cron Jobs (Phase 2)

### 10.1 Vercel Cron 설정

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

### 10.2 이탈 방지 알림

```typescript
// app/api/cron/retention-alert/route.ts

export async function GET(request: NextRequest) {
  // 인증 검증
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 대상자: 가입 3일 + 계약서 0건 + 알림 미발송
  const targets = await getRetentionTargets(supabase);

  for (const user of targets) {
    await sendGrowthNotification(user.id, 'retention_3d', { name: user.name });
  }

  return NextResponse.json({ sent: targets.length });
}
```

---

## 11. 타입 정의

### 11.1 CS 타입 (types/cs.ts)

```typescript
// 카테고리 & 상태
type InquiryCategory = 'payment' | 'usage' | 'bug' | 'other';
type InquiryStatus = 'pending' | 'answered';

// 문의
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

interface InquiryDetail extends Inquiry {
  responses: InquiryResponse[];
}

interface InquiryDetailWithAI extends Inquiry {
  aiResponse: string | null;
  aiDeveloperNote: string | null;
  aiGeneratedAt: string | null;
  userContext: UserContext | null;
  sentryErrors: SentryError[] | null;
  autoActionTaken: string | null;
  autoActionDetails: Record<string, unknown> | null;
  responses: InquiryResponse[];
}

// 입력
interface CreateInquiryInput {
  category: InquiryCategory;
  title: string;
  content: string;
}

interface InquiryFilter {
  status?: InquiryStatus | 'all';
  category?: InquiryCategory | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

// AI 분석
interface AIInput {
  inquiry: { category: string; title: string; content: string };
  userContext: UserContext;
  sentryErrors?: SentryError[];
  codebase: string;
  manuals: string;
}

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

---

## 12. 보안 고려사항

### 12.1 인증 & 인가

| 영역 | 방식 |
|------|------|
| 사용자 인증 | Supabase Auth (OAuth) |
| 관리자 인증 | 환경변수 비밀번호 + JWT |
| DB 접근 제어 | RLS (사용자), Service Role (관리자) |
| API 보호 | Server Actions (서버 전용) |

### 12.2 민감 데이터

| 데이터 | 보호 방식 |
|--------|----------|
| ADMIN_PASSWORD | 환경변수 (코드 노출 없음) |
| JWT Secret | 환경변수 |
| API Keys | 환경변수, 서버에서만 접근 |
| 사용자 정보 | RLS, 본인 데이터만 조회 |

### 12.3 쿠키 설정

```typescript
cookieStore.set('admin_session', token, {
  httpOnly: true,      // JS 접근 차단
  secure: true,        // HTTPS only (production)
  sameSite: 'lax',     // CSRF 방지
  maxAge: 86400,       // 24시간
  path: '/',
});
```

---

## 13. 성능 최적화

### 13.1 AI 분석 Lazy Loading

- 문의 목록에서는 AI 분석 없이 표시
- 상세 페이지 진입 시 분석 실행
- 한 번 분석된 결과는 DB 캐시

### 13.2 인덱스 전략

```sql
-- 자주 사용되는 쿼리 최적화
CREATE INDEX idx_cs_inquiries_status ON cs_inquiries(status);
CREATE INDEX idx_cs_inquiries_created_at ON cs_inquiries(created_at DESC);
CREATE INDEX idx_cs_inquiries_unread ON cs_inquiries(user_id, has_unread_response) 
  WHERE has_unread_response = true;
```

### 13.3 비동기 처리 (after())

```typescript
// 크레딧 사용 후 알림은 응답 후 실행
import { after } from 'next/server';

after(async () => {
  await checkAndSendCreditLowAlert(userId, creditType);
});
```

---

## 14. 비용 추정

### 14.1 월간 비용 (1,000명 기준)

| 서비스 | 플랜 | 비용 |
|--------|------|------|
| Vercel | Hobby | $0 |
| Supabase | Free | $0 |
| OpenAI GPT-4o | 사용량 | ~$10 |
| Sentry | Developer | $0 |
| Resend | Free (3,000건) | $0 |
| Solapi 알림톡 | 사용량 | ~₩3,000 |
| **합계** | | **~₩16,000/월** |

---

## 15. 마이그레이션 체크리스트

### Phase 1 시작 전

- [ ] 패키지 설치 (`@sentry/nextjs`, `resend`, `jose`)
- [ ] 환경변수 설정 (12개)
- [ ] DB 마이그레이션 실행 (ENUM, 테이블)
- [ ] Sentry 초기화 (`npx @sentry/wizard`)
- [ ] types/database.ts 재생성

### Phase 2 시작 전

- [ ] 추가 환경변수 설정 (3개)
- [ ] 추가 DB 마이그레이션 (profiles, payments 컬럼)
- [ ] vercel.json Cron 설정
- [ ] 카카오 알림톡 템플릿 등록

---

*작성일: 2026년 2월 6일*
*PRD 버전 기준: 2026년 2월 6일 (심층 검토 완료)*
