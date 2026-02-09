# 관리자 페이지 구현 계획서

> **작성일**: 2026년 2월 9일
> **기준**: 외부 서비스 연동 없이 즉시 구현 가능한 기능 우선

---

## 목차

1. [즉시 구현 가능 기능](#1-즉시-구현-가능-기능)
2. [구현 상세 계획](#2-구현-상세-계획)
3. [추후 구현 기능](#3-추후-구현-기능-외부-서비스-필요)

---

## 1. 즉시 구현 가능 기능

### 1.1 구현 완료 항목 ✅

| 기능 | 경로 | 상태 |
|------|------|------|
| 관리자 로그인 (JWT + 5회 잠금) | `/admin/login` | ✅ 완료 |
| 환불 요청 관리 | `/admin/refunds` | ✅ 완료 |
| 사용자 관리 (목록/상세) | `/admin/users` | ✅ 완료 |
| 크레딧 수동 지급/차감 | `/admin/users/[id]` | ✅ 완료 |
| 사용자 차단/해제 | `/admin/users/[id]` | ✅ 완료 |
| 로그인 방식 이모지 표시 | `/admin/users` | ✅ 완료 |
| 기본 대시보드 통계 | `/admin` | ✅ 완료 |
| `profiles.is_blocked` 컬럼 | DB | ✅ 완료 |

### 1.2 구현 예정 항목

| 단계 | 기능 | 예상 시간 |
|------|------|----------|
| **1단계** | DB 스키마 보완 + 사용자 관리 완성 | 1.5시간 |
| **2단계** | 결제 내역 페이지 | 2.5시간 |
| **3단계** | 프로모션 코드 시스템 | 5.5시간 |
| **4단계** | 공지/팝업 시스템 | 4시간 |
| **5단계** | 1:1 문의 시스템 (수동) | 8시간 |
| **6단계** | KPI 대시보드 강화 | 3.5시간 |

**총 예상 시간: 약 25시간**

---

## 2. 구현 상세 계획

### 2.1 1단계: DB 스키마 보완 + 사용자 관리 완성

**예상 시간: 1.5시간**

#### Task 1.1: profiles 테이블 컬럼 추가 (10분)

```sql
-- blocked_at, blocked_reason 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_reason text;

-- 코멘트 추가
COMMENT ON COLUMN profiles.blocked_at IS '차단 일시';
COMMENT ON COLUMN profiles.blocked_reason IS '차단 사유';
```

**수정 파일:**
- `types/database.ts` - 타입 재생성

#### Task 1.2: notification_type ENUM 확장 (5분)

```sql
-- 신규 타입 추가
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'system';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'credit_low';
```

#### Task 1.3: 사용자 삭제 기능 (30분)

**수정 파일:**
- `app/admin/(dashboard)/users/[id]/actions.ts`

```typescript
// 추가할 함수
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const supabase = createAdminClient();

  // Supabase Auth에서 사용자 삭제 (CASCADE로 profiles도 삭제됨)
  const { error } = await supabase.auth.admin.deleteUser(userId);
  
  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}
```

**수정 파일:**
- `app/admin/(dashboard)/users/[id]/user-actions.tsx` - 삭제 버튼 추가

#### Task 1.4: 사용자 차단 시 로그인 체크 (30분)

**수정 파일:**
- `lib/supabase/middleware.ts`

```typescript
// updateSession 함수 내, 일반 사용자 인증 후 추가
if (user) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_blocked')
    .eq('id', user.id)
    .single();

  if (profile?.is_blocked) {
    // 차단된 사용자는 로그아웃 처리
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = '/blocked';
    return NextResponse.redirect(url);
  }
}
```

**신규 파일:**
- `app/(public)/blocked/page.tsx` - 차단 안내 페이지

#### Task 1.5: 차단 시 사유 입력 UI (15분)

**수정 파일:**
- `app/admin/(dashboard)/users/[id]/user-actions.tsx` - 차단 사유 모달 추가
- `app/admin/(dashboard)/users/[id]/actions.ts` - toggleUserBlock에 reason 파라미터 추가

---

### 2.2 2단계: 결제 내역 페이지

**예상 시간: 2.5시간**

#### Task 2.1: 결제 목록 페이지 (1.5시간)

**신규 파일:**
- `app/admin/(dashboard)/payments/page.tsx`

```typescript
// 기능:
// - 전체 결제 내역 조회
// - 상태별 필터 (pending, completed, refunded)
// - 사용자 이름/전화번호 검색
// - 날짜 범위 필터
// - 페이지네이션

interface Payment {
  id: string;
  user_id: string;
  order_id: string;
  amount: number;
  product_name: string;
  credits_contract: number;
  credits_ai_review: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  profiles: {
    name: string | null;
    phone: string | null;
  };
}
```

**UI 구성:**
```
┌─────────────────────────────────────────────────────────┐
│ 결제 관리                                               │
├─────────────────────────────────────────────────────────┤
│ 통계: 오늘 결제 3건 / ₩15,000  이번 달 45건 / ₩225,000  │
├─────────────────────────────────────────────────────────┤
│ [검색창]           [상태 필터]  [날짜 범위]              │
├─────────────────────────────────────────────────────────┤
│ 주문번호 | 사용자 | 상품 | 금액 | 상태 | 결제일 | 액션   │
│ ─────────────────────────────────────────────────────── │
│ order_1  | 김철수 | 5회권 | 5,000 | 완료 | 02.09 | 상세  │
│ order_2  | 이영희 | 10회권 | 9,000 | 환불 | 02.08 | 상세  │
└─────────────────────────────────────────────────────────┘
```

#### Task 2.2: 결제 상세 페이지 (1시간)

**신규 파일:**
- `app/admin/(dashboard)/payments/[id]/page.tsx`

```typescript
// 표시 정보:
// - 결제 기본 정보 (주문번호, 금액, 상품, 상태)
// - 사용자 정보 (링크)
// - 지급된 크레딧
// - 영수증 URL (있으면)
// - 환불 내역 (있으면)
```

---

### 2.3 3단계: 프로모션 코드 시스템

**예상 시간: 5.5시간**

#### Task 3.1: 테이블 생성 (30분)

```sql
-- 프로모션 코드 테이블
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  credit_amount integer NOT NULL,
  max_uses integer,                      -- NULL = 무제한
  used_count integer DEFAULT 0,
  expires_at timestamptz,                -- NULL = 무기한
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code) WHERE is_active = true;

-- 프로모션 코드 사용 내역
CREATE TABLE public.promo_code_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  used_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_promo_code_uses_unique ON promo_code_uses(promo_code_id, user_id);
CREATE INDEX idx_promo_code_uses_user_id ON promo_code_uses(user_id);

-- RLS 정책
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promo_code_uses_select_own" ON promo_code_uses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "promo_code_uses_insert_own" ON promo_code_uses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

#### Task 3.2: 프로모션 코드 사용 RPC 함수 (30분)

```sql
CREATE OR REPLACE FUNCTION redeem_promo_code(
  p_user_id uuid,
  p_code text
) RETURNS jsonb AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_new_balance integer;
BEGIN
  -- 코드 조회 + 락
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE code = upper(trim(p_code))
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
    RETURN jsonb_build_object('success', false, 'error', '사용 횟수가 초과된 코드입니다');
  END IF;

  -- 중복 사용 체크
  IF EXISTS (SELECT 1 FROM promo_code_uses WHERE promo_code_id = v_promo.id AND user_id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', '이미 사용한 코드입니다');
  END IF;

  -- 크레딧 지급
  SELECT add_credit(
    p_user_id, 
    'contract', 
    v_promo.credit_amount, 
    '[프로모션] ' || v_promo.code,
    NULL
  ) INTO v_new_balance;

  -- 사용 기록
  INSERT INTO promo_code_uses (promo_code_id, user_id)
  VALUES (v_promo.id, p_user_id);

  -- 사용 횟수 증가
  UPDATE promo_codes SET used_count = used_count + 1 WHERE id = v_promo.id;

  RETURN jsonb_build_object(
    'success', true, 
    'credit_amount', v_promo.credit_amount,
    'new_balance', v_new_balance,
    'description', v_promo.description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Task 3.3: 관리자 프로모션 목록 페이지 (1.5시간)

**신규 파일:**
- `app/admin/(dashboard)/promos/page.tsx`

```typescript
// 기능:
// - 프로모션 코드 목록 조회
// - 활성/비활성 필터
// - 신규 코드 생성 모달
// - 코드 비활성화/삭제

// UI 구성:
// ┌─────────────────────────────────────────────────────────┐
// │ 프로모션 코드 관리                    [+ 새 코드 생성]   │
// ├─────────────────────────────────────────────────────────┤
// │ 코드 | 설명 | 크레딧 | 사용/최대 | 만료일 | 상태 | 액션  │
// │ ─────────────────────────────────────────────────────── │
// │ WELCOME | 신규 가입 | 3 | 45/100 | 무기한 | 활성 | 편집  │
// │ NEWYEAR | 새해 이벤트 | 5 | 100/100 | 02.28 | 마감 | -   │
// └─────────────────────────────────────────────────────────┘
```

#### Task 3.4: 프로모션 생성/수정 액션 (1시간)

**신규 파일:**
- `app/admin/(dashboard)/promos/actions.ts`

```typescript
export async function createPromoCode(data: {
  code: string;
  description?: string;
  creditAmount: number;
  maxUses?: number;
  expiresAt?: string;
}): Promise<{ success: boolean; error?: string }>

export async function updatePromoCode(id: string, data: Partial<...>)

export async function togglePromoActive(id: string)

export async function deletePromoCode(id: string)
```

#### Task 3.5: 사용자 프로모션 코드 입력 UI (1.5시간)

**수정 파일:**
- `app/(protected)/employer/mypage/page.tsx` 또는 새 컴포넌트

```typescript
// 마이페이지에 프로모션 코드 입력 섹션 추가
// - 코드 입력 필드
// - 적용 버튼
// - 결과 표시 (성공: 크레딧 N개 지급! / 실패: 에러 메시지)
```

**신규 파일:**
- `components/promo/PromoCodeInput.tsx`
- `app/actions/promo.ts` - 사용자용 액션

#### Task 3.6: types 업데이트 (30분)

- `types/database.ts` 재생성

---

### 2.4 4단계: 공지/팝업 시스템

**예상 시간: 4시간**

#### Task 4.1: 테이블 생성 (20분)

```sql
-- 공지/팝업 테이블
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  image_url text,
  link_url text,
  link_text text DEFAULT '자세히 보기',
  target_audience text DEFAULT 'all',    -- 'all' | 'employer' | 'worker'
  display_type text DEFAULT 'popup',     -- 'popup' | 'banner'
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,            -- 높을수록 먼저 표시
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_active ON announcements(starts_at, ends_at) 
  WHERE is_active = true;

-- 공지 확인 기록
CREATE TABLE public.announcement_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_announcement_views_unique ON announcement_views(announcement_id, user_id);

-- RLS 정책
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_select_active" ON announcements
  FOR SELECT TO authenticated
  USING (
    is_active = true 
    AND starts_at <= now() 
    AND (ends_at IS NULL OR ends_at > now())
  );

CREATE POLICY "announcement_views_select_own" ON announcement_views
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "announcement_views_insert_own" ON announcement_views
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

#### Task 4.2: 관리자 공지 관리 페이지 (1.5시간)

**신규 파일:**
- `app/admin/(dashboard)/announcements/page.tsx`
- `app/admin/(dashboard)/announcements/actions.ts`

```typescript
// 기능:
// - 공지 목록 조회 (활성/예정/종료)
// - 공지 생성/수정/삭제
// - 미리보기
```

#### Task 4.3: 공지 생성/수정 모달 (1시간)

```typescript
// 입력 필드:
// - 제목 (필수)
// - 내용
// - 이미지 URL
// - 링크 URL + 버튼 텍스트
// - 대상 (전체/사장님/직원)
// - 표시 방식 (팝업/배너)
// - 시작일/종료일
// - 우선순위
```

#### Task 4.4: 사용자 팝업 표시 컴포넌트 (1시간)

**신규 파일:**
- `components/announcement/AnnouncementPopup.tsx`

```typescript
// 로직:
// 1. 로그인 시 활성 공지 조회
// 2. 이미 본 공지(announcement_views) 제외
// 3. 우선순위 높은 순서대로 1개 표시
// 4. "다시 보지 않기" 클릭 시 views에 기록
```

**수정 파일:**
- `app/(protected)/layout.tsx` 또는 적절한 위치에 팝업 컴포넌트 추가

---

### 2.5 5단계: 1:1 문의 시스템 (수동)

**예상 시간: 8시간**

> AI 분석 없이 수동 답변 방식으로 구현

#### Task 5.1: 테이블 생성 (20분)

```sql
-- 문의 카테고리/상태 ENUM
CREATE TYPE public.inquiry_category AS ENUM ('payment', 'usage', 'bug', 'other');
CREATE TYPE public.inquiry_status AS ENUM ('pending', 'answered');

-- 1:1 문의 테이블
CREATE TABLE public.cs_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category inquiry_category NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  status inquiry_status NOT NULL DEFAULT 'pending',
  has_unread_response boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz
);

CREATE INDEX idx_cs_inquiries_user_id ON cs_inquiries(user_id);
CREATE INDEX idx_cs_inquiries_status ON cs_inquiries(status);
CREATE INDEX idx_cs_inquiries_created_at ON cs_inquiries(created_at DESC);
CREATE INDEX idx_cs_inquiries_unread ON cs_inquiries(user_id, has_unread_response) 
  WHERE has_unread_response = true;

-- 답변 테이블
CREATE TABLE public.cs_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES cs_inquiries(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cs_responses_inquiry_id ON cs_responses(inquiry_id);

-- RLS 정책
ALTER TABLE cs_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cs_inquiries_select_own" ON cs_inquiries
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "cs_inquiries_insert_own" ON cs_inquiries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cs_inquiries_update_own" ON cs_inquiries
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cs_responses_select_own" ON cs_responses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cs_inquiries
      WHERE cs_inquiries.id = inquiry_id
      AND cs_inquiries.user_id = auth.uid()
    )
  );
```

#### Task 5.2: 사용자 문의 작성 페이지 (1.5시간)

**신규 파일:**
- `app/(protected)/support/inquiry/new/page.tsx`
- `app/(protected)/support/inquiry/actions.ts`

```typescript
// UI:
// - 카테고리 선택 (결제/환불, 사용법, 오류/버그, 기타)
// - 제목 입력
// - 내용 입력 (textarea)
// - 제출 버튼
```

#### Task 5.3: 사용자 문의 목록 페이지 (1시간)

**신규 파일:**
- `app/(protected)/support/inquiry/page.tsx`

```typescript
// 표시:
// - 내 문의 목록 (최신순)
// - 상태 뱃지 (대기중/답변완료)
// - 읽지 않은 답변 표시
```

#### Task 5.4: 사용자 문의 상세 페이지 (1시간)

**신규 파일:**
- `app/(protected)/support/inquiry/[id]/page.tsx`

```typescript
// 표시:
// - 문의 내용
// - 답변 목록 (시간순)
// - 읽음 처리 (페이지 진입 시)
```

#### Task 5.5: 관리자 문의 목록 페이지 (1.5시간)

**신규 파일:**
- `app/admin/(dashboard)/inquiries/page.tsx`

```typescript
// 기능:
// - 전체 문의 목록
// - 상태별 필터 (대기중/답변완료)
// - 카테고리별 필터
// - 검색 (제목/사용자)
// - 대기중 문의 강조
```

#### Task 5.6: 관리자 문의 상세 + 답변 페이지 (2시간)

**신규 파일:**
- `app/admin/(dashboard)/inquiries/[id]/page.tsx`
- `app/admin/(dashboard)/inquiries/[id]/actions.ts`

```typescript
// 표시:
// - 사용자 정보 (이름, 크레딧, 최근 결제)
// - 문의 내용
// - 기존 답변 목록
// - 답변 작성 폼

// 액션:
// - 답변 등록 (cs_responses INSERT + cs_inquiries 상태 변경)
```

#### Task 5.7: 읽지 않은 답변 뱃지 (30분)

**신규 파일:**
- `lib/cs/badge.ts` - 읽지 않은 답변 수 조회

**수정 파일:**
- `components/layout/BottomNav.tsx` 또는 고객센터 메뉴에 뱃지 추가

#### Task 5.8: 고객센터 페이지 수정 (30분)

**수정 파일:**
- `app/(protected)/support/page.tsx` - 1:1 문의 링크 추가

---

### 2.6 6단계: KPI 대시보드 강화

**예상 시간: 3.5시간**

#### Task 6.1: 통계 함수 확장 (1시간)

**수정 파일:**
- `app/admin/(dashboard)/page.tsx`

```typescript
// 추가 통계:
// - 주간/월간 매출 (금액, 건수)
// - 주간/월간 신규 가입
// - 역할별 사용자 분포 (사장님/직원)
// - 주간/월간 계약서 작성 수
// - 크레딧 사용량
// - 환불 현황
// - 문의 현황 (대기중/완료)
```

#### Task 6.2: 일별 추이 차트 (2시간)

**신규 파일 또는 수정:**
- 차트 라이브러리 사용 (recharts 또는 chart.js)

```typescript
// 차트:
// 1. 일별 매출 추이 (7일/30일)
// 2. 일별 가입자 추이
// 3. 일별 계약서 작성 추이
```

```bash
# 패키지 설치 필요
npm install recharts
```

#### Task 6.3: UI 레이아웃 개선 (30분)

```
┌─────────────────────────────────────────────────────────┐
│ 대시보드                                    2026.02.09   │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ 오늘 매출 │ │ 신규 가입 │ │ 계약서   │ │ 대기 문의 │    │
│ │ ₩15,000  │ │    5명   │ │   12건  │ │   3건    │    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────────────────┤
│ 📈 주간 매출 추이                                       │
│ ┌─────────────────────────────────────────────────────┐│
│ │ (차트)                                              ││
│ └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│ 사용자 분포          │  이번 달 현황                    │
│ 사장님 ████ 120명    │  매출: ₩225,000                 │
│ 직원  ██ 80명        │  가입: 45명                     │
│                      │  계약: 89건                     │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 추후 구현 기능 (외부 서비스 필요)

### 3.1 무료 외부 서비스 연동

| 기능 | 서비스 | 비용 | 예상 작업 |
|------|--------|------|----------|
| 에러 모니터링 | Sentry | $0 | 2시간 |
| 관리자 이메일 알림 | Resend (월 3,000건) | $0 | 1.5시간 |
| 고객 답변 이메일 | Resend | $0 | 1시간 |

**Sentry 연동 작업:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Resend 연동 작업:**
```bash
npm install resend
```

### 3.2 유료 외부 서비스 연동

| 기능 | 서비스 | 비용 | 예상 작업 |
|------|--------|------|----------|
| AI 문의 분석/답변 초안 | OpenAI GPT-4o | ~$10/월 | 8시간 |
| GitHub 코드 조회 | GitHub API | $0 | 2시간 |
| 크레딧 소진 알림톡 | 솔라피 | ~₩3,000/월 | 3시간 |
| 이탈 방지 알림톡 | 솔라피 + Vercel Cron | 포함 | 3시간 |

### 3.3 AI 문의 분석 시스템 (Phase 1 완성)

**구현 순서:**
1. GitHub API 코드 조회 함수 (`lib/cs/github.ts`)
2. 사용자 컨텍스트 수집 함수 (`lib/cs/context.ts`)
3. Sentry 에러 조회 함수 (`lib/cs/sentry.ts`)
4. OpenAI 프롬프트 설계 (`lib/cs/ai.ts`)
5. 문의 상세 페이지에 AI 분석 결과 표시
6. 답변 초안 자동 생성

### 3.4 Growth 자동화 (Phase 2)

**구현 순서:**
1. `growth_logs` 테이블 생성
2. 솔라피 Growth 알림톡 템플릿 등록 (카카오 승인 필요 3-5일)
3. 크레딧 소진 알림 (실시간, `after()` 훅)
4. 이탈 방지 알림 (배치, Vercel Cron)
5. Growth 설정 페이지 (`/admin/growth`)

---

## 구현 체크리스트

### 1단계: DB + 사용자 관리 완성
- [ ] profiles 컬럼 추가 (blocked_at, blocked_reason)
- [ ] notification_type ENUM 확장
- [ ] 사용자 삭제 기능
- [ ] 차단 시 로그인 체크 (미들웨어)
- [ ] 차단 안내 페이지
- [ ] 차단 사유 입력 UI
- [ ] types/database.ts 재생성

### 2단계: 결제 내역 페이지
- [ ] 결제 목록 페이지
- [ ] 결제 상세 페이지

### 3단계: 프로모션 코드
- [ ] 테이블 생성
- [ ] redeem_promo_code RPC 함수
- [ ] 관리자 목록 페이지
- [ ] 생성/수정/삭제 액션
- [ ] 사용자 코드 입력 UI
- [ ] types 업데이트

### 4단계: 공지/팝업
- [ ] 테이블 생성
- [ ] 관리자 목록 페이지
- [ ] 생성/수정 모달
- [ ] 사용자 팝업 표시

### 5단계: 1:1 문의 (수동)
- [ ] 테이블 생성
- [ ] 사용자 문의 작성
- [ ] 사용자 문의 목록
- [ ] 사용자 문의 상세
- [ ] 관리자 문의 목록
- [ ] 관리자 문의 상세 + 답변
- [ ] 읽지 않은 답변 뱃지
- [ ] 고객센터 페이지 수정

### 6단계: KPI 대시보드
- [ ] 통계 함수 확장
- [ ] recharts 설치
- [ ] 일별 추이 차트
- [ ] UI 레이아웃 개선

---

*작성일: 2026년 2월 9일*
