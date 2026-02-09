# 결제 시스템 개선 개발 계획

> 작성일: 2026-02-03  
> 상태: 계획 수립

---

## 개요

토스페이먼츠 라이브 전환 후 추가 구현이 필요한 기능들의 개발 계획입니다.

---

## Epic 1: 환불 시스템 구현

### 1.1 DB 스키마 설계

```sql
-- 환불 요청 테이블
CREATE TABLE refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  
  -- 환불 정보
  request_type TEXT NOT NULL CHECK (request_type IN ('full', 'partial')),
  reason TEXT NOT NULL,
  
  -- 크레딧 정보 (요청 시점)
  total_credits INT NOT NULL,         -- 총 구매 크레딧
  used_credits INT NOT NULL,          -- 사용한 크레딧
  refund_credits INT NOT NULL,        -- 환불 요청 크레딧
  
  -- 금액 계산
  original_amount INT NOT NULL,       -- 원 결제 금액
  refund_amount INT NOT NULL,         -- 환불 금액 (비례 계산)
  
  -- 상태
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  
  -- 처리 정보
  admin_note TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  
  -- 토스페이먼츠 취소 정보
  toss_cancel_key TEXT,
  toss_cancel_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX idx_refund_requests_status ON refund_requests(status);
CREATE INDEX idx_refund_requests_created_at ON refund_requests(created_at DESC);

-- RLS
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own refund requests"
  ON refund_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create refund requests"
  ON refund_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 1.2 백엔드 API

| API | Method | 설명 |
|-----|--------|------|
| `/api/refund/request` | POST | 환불 요청 생성 |
| `/api/refund/list` | GET | 내 환불 요청 목록 |
| `/api/refund/[id]` | GET | 환불 요청 상세 |
| `/api/refund/cancel/[id]` | POST | 환불 요청 취소 |
| `/api/admin/refund/list` | GET | (관리자) 전체 환불 요청 |
| `/api/admin/refund/process` | POST | (관리자) 환불 처리 |

**환불 금액 계산 로직:**
```typescript
function calculateRefundAmount(payment: Payment, usedCredits: number): number {
  const totalCredits = payment.credits_contract;
  const unusedCredits = totalCredits - usedCredits;
  
  // 미사용 크레딧 비례 환불
  const refundAmount = Math.floor((unusedCredits / totalCredits) * payment.amount);
  
  return refundAmount;
}
```

**토스페이먼츠 취소 API 연동:**
```typescript
// POST https://api.tosspayments.com/v1/payments/{paymentKey}/cancel
const cancelPayment = async (paymentKey: string, amount: number, reason: string) => {
  const response = await fetch(
    `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancelReason: reason,
        cancelAmount: amount,  // 부분 취소 시
      }),
    }
  );
  return response.json();
};
```

### 1.3 프론트엔드 UI/UX

**환불 요청 플로우:**
1. 설정 → 결제 내역 → 환불 요청
2. 환불 가능 여부 확인 (7일 이내, 12개월 이내)
3. 사용한 크레딧 표시 & 환불 금액 계산
4. 환불 사유 입력
5. 확인 → 요청 완료

**파일 구조:**
```
app/(protected)/settings/
├── page.tsx                    # 설정 메인
├── payments/
│   ├── page.tsx               # 결제 내역 목록
│   └── [id]/
│       └── page.tsx           # 결제 상세 + 환불 요청
└── refunds/
    └── page.tsx               # 환불 요청 내역
```

**UI 컴포넌트:**
```
components/payment/
├── PaymentHistoryCard.tsx     # 결제 내역 카드
├── RefundRequestSheet.tsx     # 환불 요청 바텀시트
├── RefundCalculator.tsx       # 환불 금액 계산기
└── RefundStatusBadge.tsx      # 환불 상태 배지
```

---

## Epic 2: 크레딧 유효기간 관리

### 2.1 DB 스키마 수정

```sql
-- credits 테이블에 유효기간 컬럼 추가
ALTER TABLE credits ADD COLUMN expires_at TIMESTAMPTZ;

-- 기존 데이터 마이그레이션 (생성일 + 12개월)
UPDATE credits 
SET expires_at = created_at + INTERVAL '12 months'
WHERE expires_at IS NULL;

-- 향후 크레딧 생성 시 자동 설정 (트리거)
CREATE OR REPLACE FUNCTION set_credit_expiry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at := NEW.created_at + INTERVAL '12 months';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_credit_expiry
  BEFORE INSERT ON credits
  FOR EACH ROW
  EXECUTE FUNCTION set_credit_expiry();
```

### 2.2 크레딧 만료 처리 (Cron Job)

**Supabase Edge Function (또는 pg_cron):**
```sql
-- 매일 자정 실행: 만료된 크레딧 처리
CREATE OR REPLACE FUNCTION expire_old_credits()
RETURNS void AS $$
BEGIN
  -- 만료된 크레딧을 0으로 설정하고 트랜잭션 기록
  INSERT INTO credit_transactions (user_id, credit_type, amount, description, reference_type)
  SELECT 
    user_id, 
    credit_type, 
    -balance,  -- 음수로 차감
    '유효기간 만료로 인한 크레딧 소멸',
    'expiry'
  FROM credits
  WHERE expires_at < NOW() AND balance > 0;
  
  -- 크레딧 잔액 0으로 업데이트
  UPDATE credits
  SET balance = 0, updated_at = NOW()
  WHERE expires_at < NOW() AND balance > 0;
END;
$$ LANGUAGE plpgsql;
```

### 2.3 프론트엔드 UI

**만료 예정 알림:**
- 마이페이지에서 만료 30일 전 크레딧 경고 표시
- 푸시 알림 (선택적)

```tsx
// 만료 예정 크레딧 표시
<div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
  <p className="text-[13px] text-amber-700">
    ⚠️ <strong>3건</strong>의 크레딧이 30일 내 만료 예정이에요
  </p>
</div>
```

---

## Epic 3: 결제 내역 조회

### 3.1 프론트엔드 페이지

**결제 내역 페이지 구조:**
```
app/(protected)/settings/payments/page.tsx
```

**UI 스펙:**
- 결제 목록 (최신순)
- 각 항목: 날짜, 상품명, 금액, 상태
- 상세 보기 → 영수증 URL, 크레딧 지급 내역, 환불 요청 버튼

**상태 표시:**
| 상태 | 배지 색상 | 텍스트 |
|------|----------|--------|
| pending | 회색 | 결제 대기 |
| completed | 파란색 | 결제 완료 |
| refunded | 주황색 | 환불 완료 |
| failed | 빨간색 | 결제 실패 |

### 3.2 영수증 연동

토스페이먼츠에서 제공하는 `receipt_url`을 활용:
- 이미 `payments.receipt_url`에 저장되어 있음
- 결제 상세 페이지에서 "영수증 보기" 버튼으로 외부 링크 연결

---

## Epic 4: Pending 결제 정리

### 4.1 자동 정리 로직

```sql
-- 24시간 이상 pending 상태인 결제 자동 취소
CREATE OR REPLACE FUNCTION cleanup_pending_payments()
RETURNS void AS $$
BEGIN
  UPDATE payments
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    status = 'pending' 
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;
```

### 4.2 Supabase Cron 설정

```sql
-- pg_cron 확장 활성화 후
SELECT cron.schedule(
  'cleanup-pending-payments',
  '0 4 * * *',  -- 매일 새벽 4시
  $$SELECT cleanup_pending_payments()$$
);
```

---

## Epic 5: 충전 한도 프론트엔드 검증

### 5.1 현재 상태
- 서버: 100,000원 제한 ✅
- 클라이언트: 제한 없음 ❌

### 5.2 구현

현재 상품 목록 기준 최고가가 39,000원이므로 실질적으로 문제 없음.
향후 상품 추가 시 고려 필요.

```tsx
// 상품 추가 시 검증
const PRODUCTS = [
  // ... 기존 상품들
].filter(p => p.price <= 100000); // 10만원 초과 상품 자동 제외
```

---

## 우선순위 및 일정

| 순위 | Epic | 예상 공수 | 필수 여부 |
|------|------|----------|----------|
| 1 | Epic 3: 결제 내역 조회 | 0.5일 | ⭐ 높음 |
| 2 | Epic 1: 환불 시스템 | 2일 | ⭐ 높음 |
| 3 | Epic 2: 크레딧 유효기간 | 1일 | ⭐ 중간 |
| 4 | Epic 4: Pending 정리 | 0.5일 | ⭐ 중간 |
| 5 | Epic 5: 프론트 검증 | 0.5일 | ⭐ 낮음 |

---

## 기술 스택

- **DB**: Supabase PostgreSQL + RLS
- **Backend**: Next.js API Routes (Server Actions)
- **Frontend**: React + Tailwind CSS
- **결제**: 토스페이먼츠 v1 API
- **스케줄러**: Supabase pg_cron 또는 Edge Functions (scheduled)

---

## 체크리스트

### 라이브 전환 완료 ✅
- [x] 라이브 키 적용
- [x] 비회원 결제 차단
- [x] 테스트 UI 제거
- [x] fallback 테스트 키 제거

### 추가 개발 필요 ⏳
- [ ] 결제 내역 조회 페이지
- [ ] 환불 요청 기능
- [ ] 환불 처리 (관리자)
- [ ] 크레딧 유효기간 만료 처리
- [ ] Pending 결제 자동 정리
