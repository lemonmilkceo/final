# 📊 Database Schema Specification

## 싸인해주세요 (SignPlease)

> **버전**: 2.6  
> **최종 수정일**: 2026년 2월 3일  
> **작성자**: Technical PO

---

## 1. ERD Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              auth.users (Supabase)                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ id (uuid, PK) | email | created_at | raw_user_meta_data | ...        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ 1:1
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  profiles                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ id (uuid, PK, FK) | role | name | phone | avatar_url | ...           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
     │            │                                            │
     │ 1:N        │ 1:N                                       │ 1:N
     ▼            ▼                                            ▼
┌──────────┐  ┌──────────┐                              ┌─────────────────┐
│workplaces│  │ folders  │                              │worker_hidden_   │
└──────────┘  └──────────┘                              │contracts        │
     │                                                   └─────────────────┘
     │                                                           │
     └─────────────┬─────────────────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  contracts                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ id | employer_id | worker_id | workplace_id | status | folder_id |...│   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
           │              │               │
           │ 1:N          │ 1:N           │ 1:N
           ▼              ▼               ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────────────┐
│   signatures     │  │ ai_reviews   │  │ notification_logs    │
└──────────────────┘  └──────────────┘  └──────────────────────┘
```

---

## 2. Enums (고정값 정의)

### 2.1 user_role

| Value | Description |
|-------|-------------|
| `employer` | 사업자 (계약서 작성자) |
| `worker` | 근로자 (계약서 서명자) |

### 2.2 contract_status

| Value | Description |
|-------|-------------|
| `draft` | 임시저장 (사업자 서명 전) |
| `pending` | 서명 대기중 (사업자 서명 완료, 근로자 서명 대기) |
| `completed` | 서명 완료 (양측 서명 완료) |
| `expired` | 만료됨 (7일 내 서명 없음) |
| `deleted` | 삭제됨 (휴지통) |

### 2.3 signer_role

| Value | Description |
|-------|-------------|
| `employer` | 사업자 서명 |
| `worker` | 근로자 서명 |

### 2.4 credit_type

| Value | Description |
|-------|-------------|
| `contract` | 계약서 작성 크레딧 |
| `ai_review` | AI 노무사 검토 크레딧 (현재 무료) |

### 2.5 notification_type

| Value | Description |
|-------|-------------|
| `contract_sent` | 계약서 전송됨 |
| `contract_signed` | 계약서 서명됨 |
| `contract_expired_soon` | 서명 기한 임박 (D-1) |
| `contract_expired` | 계약서 만료됨 |
| `contract_modified` | 계약서 수정됨 |

### 2.6 business_size

| Value | Description |
|-------|-------------|
| `under_5` | 5인 미만 (4대보험 선택 가입) |
| `over_5` | 5인 이상 (4대보험 의무 가입) |

---

## 3. Tables

### 3.1 profiles

사용자 프로필 정보를 저장합니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | - | PK, FK → auth.users.id |
| `role` | `user_role` | YES | NULL | 사용자 역할 (선택 전 NULL) |
| `name` | `text` | YES | NULL | 사용자 이름 |
| `phone` | `text` | YES | NULL | 전화번호 |
| `avatar_url` | `text` | YES | NULL | 프로필 이미지 URL |
| `created_at` | `timestamptz` | NO | `now()` | 생성일시 |
| `updated_at` | `timestamptz` | NO | `now()` | 수정일시 |

---

### 3.2 worker_details

근로자 민감 정보를 저장합니다. (암호화 필수)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | - | FK → profiles.id |
| `ssn_encrypted` | `bytea` | NO | - | 주민등록번호 (AES-256 암호화) |
| `ssn_hash` | `text` | NO | - | 주민번호 해시 (중복 체크용) |
| `bank_name` | `text` | NO | - | 은행명 |
| `account_number_encrypted` | `bytea` | NO | - | 계좌번호 (AES-256 암호화) |
| `is_verified` | `boolean` | NO | `false` | 본인인증 완료 여부 |
| `verified_at` | `timestamptz` | YES | NULL | 본인인증 완료 일시 |
| `created_at` | `timestamptz` | NO | `now()` | 생성일시 |
| `updated_at` | `timestamptz` | NO | `now()` | 수정일시 |

⚠️ **보안**: `ssn_encrypted`, `account_number_encrypted`는 AES-256-GCM으로 암호화. 키는 `ENCRYPTION_KEY` 환경변수.

---

### 3.3 workplaces

사업장 정보를 저장합니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | - | FK → profiles.id |
| `name` | `text` | NO | - | 사업장명 |
| `address` | `text` | NO | - | 사업장 주소 |
| `created_at` | `timestamptz` | NO | `now()` | 생성일시 |
| `updated_at` | `timestamptz` | NO | `now()` | 수정일시 |

**Constraints:** UNIQUE(`user_id`, `name`)

---

### 3.4 folders

계약서 폴더 관리

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | - | FK → profiles.id |
| `name` | `text` | NO | - | 폴더 이름 |
| `created_at` | `timestamptz` | NO | `now()` | 생성일시 |
| `updated_at` | `timestamptz` | NO | `now()` | 수정일시 |

**Constraints:** UNIQUE(`user_id`, `name`)

---

### 3.5 contracts

계약서 정보를 저장합니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `employer_id` | `uuid` | NO | - | FK → profiles.id (사업자) |
| `worker_id` | `uuid` | YES | NULL | FK → profiles.id (근로자) |
| `folder_id` | `uuid` | YES | NULL | FK → folders.id |
| `workplace_id` | `uuid` | YES | NULL | FK → workplaces.id |
| `workplace_name` | `text` | YES | NULL | 사업장명 (비정규화) |
| `status` | `contract_status` | NO | `'draft'` | 계약서 상태 |
| `share_token` | `text` | NO | UUID | 공유용 토큰 |
| `contract_type` | `text` | NO | `'contract'` | 계약 형태 (regular/contract) |
| `business_size` | `business_size` | NO | - | 사업장 규모 |
| `worker_name` | `text` | NO | - | 근로자 이름 |
| `worker_phone` | `text` | YES | NULL | 근로자 휴대폰 번호 |
| `hourly_wage` | `integer` | NO | - | 시급 (원) |
| `includes_weekly_allowance` | `boolean` | NO | `false` | 주휴수당 포함 여부 |
| `start_date` | `date` | NO | - | 근무 시작일 |
| `end_date` | `date` | YES | NULL | 근무 예정 종료일 |
| `resignation_date` | `date` | YES | NULL | 실제 퇴사일 (근로자 입력) |
| `work_days` | `text[]` | YES | NULL | 근무 요일 배열 |
| `work_days_per_week` | `integer` | YES | NULL | 주 N일 |
| `work_start_time` | `time` | NO | - | 근무 시작 시간 |
| `work_end_time` | `time` | NO | - | 근무 종료 시간 |
| `break_minutes` | `integer` | NO | - | 휴게시간 (분) |
| `work_location` | `text` | NO | - | 근무 장소 |
| `job_description` | `text` | NO | - | 업무 내용 |
| `special_terms` | `text` | YES | NULL | 특약사항 (선택) |
| `pay_day` | `integer` | NO | - | 급여 지급일 (1-31) |
| `expires_at` | `timestamptz` | YES | NULL | 서명 만료 일시 |
| `completed_at` | `timestamptz` | YES | NULL | 서명 완료 일시 |
| `deleted_at` | `timestamptz` | YES | NULL | 삭제 일시 |
| `pdf_url` | `text` | YES | NULL | 생성된 PDF URL |
| `created_at` | `timestamptz` | NO | `now()` | 생성일시 |
| `updated_at` | `timestamptz` | NO | `now()` | 수정일시 |

**Indexes:**
- `idx_contracts_employer_id`, `idx_contracts_worker_id`
- `idx_contracts_status`, `idx_contracts_share_token`
- `idx_contracts_worker_phone`, `idx_contracts_workplace_id`

---

### 3.6 signatures

서명 데이터를 저장합니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `contract_id` | `uuid` | NO | - | FK → contracts.id |
| `user_id` | `uuid` | NO | - | FK → profiles.id |
| `signer_role` | `signer_role` | NO | - | 서명자 역할 |
| `signature_data` | `text` | NO | - | 서명 이미지 (Base64) |
| `signed_at` | `timestamptz` | NO | `now()` | 서명 일시 |
| `ip_address` | `inet` | YES | NULL | 서명 시 IP 주소 |
| `user_agent` | `text` | YES | NULL | 서명 시 User Agent |

**Constraints:** UNIQUE(`contract_id`, `signer_role`)

---

### 3.7 ai_reviews

AI 노무사 검토 결과를 저장합니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `contract_id` | `uuid` | NO | - | FK → contracts.id |
| `requested_by` | `uuid` | NO | - | FK → profiles.id |
| `result` | `jsonb` | NO | - | 검토 결과 JSON |
| `created_at` | `timestamptz` | NO | `now()` | 검토 요청 일시 |

---

### 3.8 credits

사용자 크레딧 정보를 저장합니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | - | FK → profiles.id |
| `credit_type` | `credit_type` | NO | - | 크레딧 종류 |
| `amount` | `integer` | NO | `0` | 보유 수량 |
| `expires_at` | `timestamptz` | YES | `now() + 1 year` | 만료일시 |
| `updated_at` | `timestamptz` | NO | `now()` | 수정일시 |

**Constraints:** UNIQUE(`user_id`, `credit_type`), CHECK(`amount >= 0`)

**RLS Policies:**
- `credits_select_own`: 자신의 크레딧만 조회

---

### 3.9 credit_transactions

크레딧 거래 내역을 저장합니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | - | FK → profiles.id |
| `credit_type` | `credit_type` | NO | - | 크레딧 종류 |
| `amount` | `integer` | NO | - | 변동 수량 (+/-) |
| `balance_after` | `integer` | NO | - | 거래 후 잔액 |
| `description` | `text` | NO | - | 거래 설명 |
| `reference_id` | `uuid` | YES | NULL | 관련 ID (payments.id 등) |
| `created_at` | `timestamptz` | NO | `now()` | 거래 일시 |

**Indexes:**
- `idx_credit_transactions_user_type`
- `idx_credit_transactions_reference`
- `idx_credit_transactions_created_at`

**RLS Policies:**
- `credit_transactions_select_own`: 자신의 거래 내역만 조회

---

### 3.10 payments

결제 내역을 저장합니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | - | FK → profiles.id |
| `order_id` | `text` | NO | - | 주문 ID (토스페이먼츠) |
| `payment_key` | `text` | YES | NULL | 결제 키 |
| `amount` | `integer` | NO | - | 결제 금액 (원) |
| `product_name` | `text` | NO | - | 상품명 |
| `credits_contract` | `integer` | NO | `0` | 지급 계약서 크레딧 수 |
| `credits_ai_review` | `integer` | NO | `0` | 지급 AI검토 크레딧 수 |
| `status` | `text` | NO | `'pending'` | 결제 상태 |
| `paid_at` | `timestamptz` | YES | NULL | 결제 완료 일시 |
| `receipt_url` | `text` | YES | NULL | 영수증 URL |
| `created_at` | `timestamptz` | NO | `now()` | 생성일시 |

**Constraints:**
- `UNIQUE(order_id)` - 중복 주문 방지
- `CHECK(status IN ('pending', 'completed', 'failed', 'expired', 'refunded'))`

**Indexes:**
- `idx_payments_user_id`, `idx_payments_status`, `idx_payments_created_at`

**RLS Policies:**
- `payments_select_own`: 자신의 결제만 조회
- `payments_insert_own`: 자신의 결제만 생성
- `payments_update_own`: 자신의 결제만 수정

---

### 3.17 refund_requests

환불 요청 내역을 저장합니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | - | FK → auth.users.id |
| `payment_id` | `uuid` | NO | - | FK → payments.id |
| `request_type` | `text` | NO | - | 환불 유형 (full/partial) |
| `reason` | `text` | NO | - | 환불 사유 |
| `total_credits` | `integer` | NO | - | 총 지급 크레딧 |
| `used_credits` | `integer` | NO | - | 사용된 크레딧 |
| `refund_credits` | `integer` | NO | - | 환불 크레딧 |
| `original_amount` | `integer` | NO | - | 원결제 금액 |
| `refund_amount` | `integer` | NO | - | 환불 금액 |
| `status` | `text` | NO | `'pending'` | 환불 상태 |
| `admin_note` | `text` | YES | NULL | 관리자 메모 |
| `processed_at` | `timestamptz` | YES | NULL | 처리 일시 |
| `processed_by` | `uuid` | YES | NULL | 처리자 ID |
| `toss_cancel_key` | `text` | YES | NULL | 토스 취소 키 |
| `toss_cancel_reason` | `text` | YES | NULL | 토스 취소 사유 |
| `base_refund_amount` | `integer` | YES | NULL | 수수료 차감 전 환불 금액 |
| `fee_rate` | `numeric(5,4)` | NO | `0.15` | 적용된 수수료율 (0.15 = 15%) |
| `fee_amount` | `integer` | NO | `0` | 수수료 금액 |
| `created_at` | `timestamptz` | NO | `now()` | 생성일시 |
| `updated_at` | `timestamptz` | NO | `now()` | 수정일시 |

**Constraints:**
- `CHECK(request_type IN ('full', 'partial'))`
- `CHECK(status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled'))`

**Indexes:**
- `idx_refund_requests_user_id`, `idx_refund_requests_payment_id`, `idx_refund_requests_status`

**RLS Policies:**
- 자신의 환불 요청만 SELECT
- 자신의 환불 요청만 INSERT (pending 상태)
- 자신의 환불 요청만 UPDATE (cancelled로 변경만 허용)

**환불 수수료 정책 (2026-02-10 수정):**
- 기본 수수료: **15%** (단건 결제 악용 방지)
- 수수료 면제 조건: 결제 후 7일 이내 + 크레딧 미사용
- 최소 환불 금액: 1,000원 (수수료 차감 후)

---

### 3.11 chat_messages

채팅 메시지를 저장합니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `contract_id` | `uuid` | NO | - | FK → contracts.id |
| `sender_id` | `uuid` | NO | - | FK → profiles.id |
| `content` | `text` | NO | - | 메시지 내용 |
| `file_url` | `text` | YES | NULL | 첨부파일 URL |
| `file_type` | `text` | YES | NULL | 파일 MIME 타입 |
| `is_read` | `boolean` | NO | `false` | 읽음 여부 |
| `created_at` | `timestamptz` | NO | `now()` | 전송 일시 |

---

### 3.12 notifications

알림 정보를 저장합니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | - | FK → profiles.id |
| `type` | `notification_type` | NO | - | 알림 종류 |
| `title` | `text` | NO | - | 알림 제목 |
| `body` | `text` | NO | - | 알림 내용 |
| `data` | `jsonb` | YES | NULL | 추가 데이터 |
| `is_read` | `boolean` | NO | `false` | 읽음 여부 |
| `created_at` | `timestamptz` | NO | `now()` | 생성 일시 |

---

### 3.13 worker_hidden_contracts

근로자가 숨긴 계약서를 저장합니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `worker_id` | `uuid` | NO | - | FK → profiles.id |
| `contract_id` | `uuid` | NO | - | FK → contracts.id |
| `hidden_at` | `timestamptz` | NO | `now()` | 숨긴 시각 |

**Constraints:** UNIQUE(`worker_id`, `contract_id`)

---

### 3.14 sensitive_info_logs

민감정보 열람 로그를 저장합니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | - | FK → profiles.id |
| `contract_id` | `uuid` | NO | - | FK → contracts.id |
| `info_type` | `text` | NO | - | 열람 정보 유형 (ssn/account/both) |
| `accessed_at` | `timestamptz` | NO | `now()` | 열람 시간 |
| `ip_address` | `text` | YES | NULL | 접속 IP 주소 |
| `user_agent` | `text` | YES | NULL | 브라우저 정보 |

---

### 3.15 notification_logs

알림톡/SMS 발송 로그를 저장합니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | - | FK → auth.users.id |
| `contract_id` | `uuid` | YES | NULL | FK → contracts.id |
| `recipient_phone` | `text` | NO | - | 수신자 휴대폰 번호 |
| `type` | `text` | NO | - | alimtalk/sms/push |
| `template_code` | `text` | YES | NULL | 알림톡 템플릿 ID |
| `status` | `text` | NO | `'pending'` | sent/failed/pending |
| `message_id` | `text` | YES | NULL | Solapi 메시지 ID |
| `error` | `text` | YES | NULL | 에러 메시지 |
| `created_at` | `timestamptz` | NO | `now()` | 발송 시각 |

---

## 4. Row Level Security (RLS) Policies

### 4.1 profiles
- `profiles_select_own`: 자신의 프로필만 조회
- `profiles_update_own`: 자신의 프로필만 수정
- `profiles_insert_own`: 자신의 프로필만 생성
- `profiles_select_for_contract`: 공유 링크에서 사업자 정보 조회 (anon 허용)

### 4.2 worker_details
- 자신의 정보만 SELECT/INSERT/UPDATE

### 4.3 workplaces
- 자신의 사업장만 SELECT/INSERT/UPDATE/DELETE

### 4.4 folders
- 자신의 폴더만 SELECT/INSERT/UPDATE/DELETE

### 4.5 contracts
- `contracts_select_employer`: 사업자가 자신의 계약서 조회
- `contracts_select_worker`: 근로자가 자신의 계약서 조회
- `contracts_select_by_token`: 공유 토큰으로 조회 (anon 허용)
- `contracts_insert_employer`: 사업자만 생성
- `contracts_update_employer`: 사업자가 자신의 계약서 수정

### 4.6 signatures
- 계약서 관련자만 SELECT
- 자신의 서명만 INSERT
- 사업자만 DELETE (수정 시 기존 서명 삭제용)

### 4.7 기타 테이블
- 모든 테이블: 본인 데이터만 접근 가능

---

## 5. Database Functions

### 5.1 handle_new_user()
신규 가입 시 profiles 테이블에 자동으로 레코드 생성 + 무료 크레딧 지급 (계약서 3건, AI 검토 5건)

### 5.2 use_credit()
크레딧 사용 함수 (원자적 처리)

### 5.3 add_credit()
크레딧 충전 함수

### 5.4 expire_pending_contracts()
만료된 계약서 자동 처리 (pg_cron 매시간 실행)

### 5.5 process_payment_completion()
결제 완료 처리 함수 (Race Condition 방지)
- Row Lock으로 동시 접근 방지
- 상태 업데이트 + 크레딧 지급 원자적 처리

```sql
process_payment_completion(
  p_payment_id UUID,
  p_user_id UUID,
  p_payment_key TEXT,
  p_receipt_url TEXT
) RETURNS BOOLEAN
```

### 5.6 expire_old_credits()
만료된 크레딧 자동 처리 (pg_cron 매일 실행)

### 5.7 cleanup_pending_payments()
24시간 이상 pending 상태인 결제 expired 처리 (pg_cron 매시간 실행)

---

## 6. Storage Buckets

| Bucket | Public | Description |
|--------|--------|-------------|
| `signatures` | No | 서명 이미지 저장 |
| `contracts-pdf` | No | 계약서 PDF 저장 |
| `chat-files` | No | 채팅 첨부파일 저장 |

---

## 7. 마이그레이션 SQL 보관

### 7.1 workplaces 테이블 생성

```sql
CREATE TABLE public.workplaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_workplaces_user_id ON workplaces(user_id);

ALTER TABLE workplaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workplaces" ON workplaces
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workplaces" ON workplaces
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workplaces" ON workplaces
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workplaces" ON workplaces
  FOR DELETE USING (auth.uid() = user_id);
```

### 7.2 contracts 테이블 추가 컬럼

```sql
-- 사업장 관련
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS workplace_id uuid REFERENCES workplaces(id) ON DELETE SET NULL;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS workplace_name text;
CREATE INDEX IF NOT EXISTS idx_contracts_workplace_id ON contracts(workplace_id);

-- 근로자 휴대폰 번호
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS worker_phone text;
CREATE INDEX IF NOT EXISTS idx_contracts_worker_phone ON contracts(worker_phone);

-- 계약 형태
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_type text NOT NULL DEFAULT 'contract';
ALTER TABLE contracts ADD CONSTRAINT check_contract_type CHECK (contract_type IN ('regular', 'contract'));

-- 퇴사일
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS resignation_date date;
```

### 7.3 worker_hidden_contracts 테이블

```sql
CREATE TABLE worker_hidden_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  hidden_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(worker_id, contract_id)
);

CREATE INDEX idx_worker_hidden_contracts_worker_id ON worker_hidden_contracts(worker_id);
CREATE INDEX idx_worker_hidden_contracts_contract_id ON worker_hidden_contracts(contract_id);

ALTER TABLE worker_hidden_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own hidden contracts" ON worker_hidden_contracts
  FOR SELECT USING (auth.uid() = worker_id);
CREATE POLICY "Workers can hide contracts" ON worker_hidden_contracts
  FOR INSERT WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "Workers can unhide contracts" ON worker_hidden_contracts
  FOR DELETE USING (auth.uid() = worker_id);
```

### 7.4 sensitive_info_logs 테이블

```sql
CREATE TABLE public.sensitive_info_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  info_type text NOT NULL CHECK (info_type IN ('ssn', 'account', 'both')),
  accessed_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

CREATE INDEX idx_sensitive_info_logs_user_id ON sensitive_info_logs(user_id);
CREATE INDEX idx_sensitive_info_logs_contract_id ON sensitive_info_logs(contract_id);
CREATE INDEX idx_sensitive_info_logs_accessed_at ON sensitive_info_logs(accessed_at);

ALTER TABLE sensitive_info_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON sensitive_info_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert logs" ON sensitive_info_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 7.5 notification_logs 테이블

```sql
CREATE TABLE public.notification_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  recipient_phone text NOT NULL,
  type text NOT NULL CHECK (type IN ('alimtalk', 'sms', 'push')),
  template_code text,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'pending')) DEFAULT 'pending',
  message_id text,
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_contract_id ON notification_logs(contract_id);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at DESC);

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_logs_select_own" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notification_logs_insert_own" ON notification_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 7.6 공개 링크 접근 RLS 정책

```sql
-- contracts: 공유 토큰으로 조회 (anon + authenticated)
CREATE POLICY "contracts_select_by_token" ON contracts
  FOR SELECT TO anon, authenticated
  USING (status IN ('pending', 'completed'));

-- profiles: 계약서 조회 시 사업자 정보 조회
CREATE POLICY "profiles_select_for_contract" ON profiles
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.employer_id = id
      AND c.status IN ('pending', 'completed')
    )
  );

-- signatures: 공유 링크에서 서명 정보 조회
CREATE POLICY "signatures_select_by_token" ON signatures
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_id
      AND c.status IN ('pending', 'completed')
    )
  );

-- signatures: 근로자 서명 추가
CREATE POLICY "signatures_insert_by_token" ON signatures
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_id
      AND c.status = 'pending'
    )
    AND auth.uid() = user_id
  );

-- signatures: 사업자 서명 삭제 (수정 시)
CREATE POLICY "signatures_delete_employer" ON signatures
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_id
      AND c.employer_id = auth.uid()
    )
  );
```

### 7.7 notification_type ENUM 확장

```sql
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'contract_modified';
```

### 7.8 결제 시스템 보안 강화 마이그레이션 (2026-02-09)

#### payments 테이블 인덱스 및 제약조건

```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- 중복 주문 방지
ALTER TABLE payments ADD CONSTRAINT payments_order_id_unique UNIQUE (order_id);

-- 유효한 상태값만 허용
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
  CHECK (status IN ('pending', 'completed', 'failed', 'expired', 'refunded'));
```

#### credit_transactions 테이블 인덱스

```sql
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_type 
  ON credit_transactions(user_id, credit_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reference 
  ON credit_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at 
  ON credit_transactions(created_at DESC);
```

#### RLS 정책 (payments, credits, credit_transactions)

```sql
-- payments RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own" ON payments 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payments_insert_own" ON payments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "payments_update_own" ON payments 
  FOR UPDATE USING (auth.uid() = user_id);

-- credits RLS
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credits_select_own" ON credits 
  FOR SELECT USING (auth.uid() = user_id);

-- credit_transactions RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_transactions_select_own" ON credit_transactions 
  FOR SELECT USING (auth.uid() = user_id);
```

#### process_payment_completion 함수 (Race Condition 방지)

```sql
CREATE OR REPLACE FUNCTION process_payment_completion(
  p_payment_id UUID,
  p_user_id UUID,
  p_payment_key TEXT,
  p_receipt_url TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment RECORD;
BEGIN
  -- Row Lock으로 동시 접근 방지 (SKIP LOCKED로 이미 처리 중인 건 제외)
  SELECT * INTO v_payment
  FROM payments
  WHERE id = p_payment_id
    AND user_id = p_user_id
    AND status = 'pending'
  FOR UPDATE SKIP LOCKED;
  
  IF NOT FOUND THEN
    -- 이미 다른 트랜잭션에서 처리 중이거나 완료됨
    RETURN FALSE;
  END IF;
  
  -- 결제 상태 업데이트
  UPDATE payments
  SET status = 'completed',
      payment_key = p_payment_key,
      receipt_url = p_receipt_url,
      paid_at = NOW()
  WHERE id = p_payment_id;
  
  -- 크레딧 지급 (계약서 크레딧)
  IF v_payment.credits_contract > 0 THEN
    PERFORM add_credit(
      p_user_id,
      'contract',
      v_payment.credits_contract,
      '결제: ' || v_payment.product_name,
      p_payment_id
    );
  END IF;
  
  -- 크레딧 지급 (AI 검토 크레딧)
  IF v_payment.credits_ai_review > 0 THEN
    PERFORM add_credit(
      p_user_id,
      'ai_review',
      v_payment.credits_ai_review,
      '결제: ' || v_payment.product_name,
      p_payment_id
    );
  END IF;
  
  RETURN TRUE;
END;
$$;
```

#### expire_old_credits 함수 (크레딧 만료 처리)

```sql
CREATE OR REPLACE FUNCTION expire_old_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE credits
  SET amount = 0,
      updated_at = NOW()
  WHERE expires_at < NOW()
    AND amount > 0;
END;
$$;
```

#### cleanup_pending_payments 함수 (결제 정리)

```sql
CREATE OR REPLACE FUNCTION cleanup_pending_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE payments
  SET status = 'expired'
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$;
```

### 7.9 환불 수수료 시스템 마이그레이션 (2026-02-09)

```sql
-- refund_requests 테이블에 수수료 관련 컬럼 추가
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS base_refund_amount integer;
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS fee_rate numeric(5,4) DEFAULT 0.15;
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS fee_amount integer DEFAULT 0;

-- 기존 데이터 마이그레이션 (기존 refund_amount를 base_refund_amount로)
UPDATE refund_requests 
SET base_refund_amount = refund_amount,
    fee_amount = 0,
    fee_rate = 0
WHERE base_refund_amount IS NULL;

-- 코멘트 추가
COMMENT ON COLUMN refund_requests.base_refund_amount IS '수수료 차감 전 환불 금액';
COMMENT ON COLUMN refund_requests.fee_rate IS '적용된 수수료율 (0.15 = 15%)';
COMMENT ON COLUMN refund_requests.fee_amount IS '수수료 금액';
```

---

## 8. 환경 변수 요구사항

| Key | 설명 | 필수 |
|-----|------|------|
| `ENCRYPTION_KEY` | 민감정보 암호화 키 (32바이트 base64) | ✅ |
| `SSN_HASH_SALT` | 주민번호 해시용 솔트 | ✅ (프로덕션) |

**키 생성 방법:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 9. 추가 테이블 (2026-02-09 이후)

### 9.1 inquiries (문의)

고객 문의를 저장합니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | - | FK → auth.users.id |
| `title` | `text` | NO | - | 문의 제목 |
| `content` | `text` | NO | - | 문의 내용 |
| `category` | `text` | NO | - | 문의 카테고리 |
| `status` | `text` | NO | `'pending'` | 처리 상태 |
| `admin_reply` | `text` | YES | NULL | 관리자 답변 |
| `replied_at` | `timestamptz` | YES | NULL | 답변 시간 |
| `created_at` | `timestamptz` | NO | `now()` | 생성일시 |
| `updated_at` | `timestamptz` | NO | `now()` | 수정일시 |

**Constraints:**
- `CHECK(status IN ('pending', 'replied', 'closed'))`
- `CHECK(category IN ('payment', 'contract', 'technical', 'account', 'other'))`

**RLS Policies:**
- 자신의 문의만 SELECT
- 자신의 문의만 INSERT

### 9.2 promo_codes (프로모션 코드)

프로모션 코드를 저장합니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `code` | `text` | NO | - | 프로모션 코드 (UNIQUE) |
| `credit_amount` | `integer` | NO | - | 지급 크레딧 수 |
| `max_uses` | `integer` | NO | - | 최대 사용 횟수 (필수) |
| `current_uses` | `integer` | NO | `0` | 현재 사용 횟수 |
| `expires_at` | `timestamptz` | YES | NULL | 만료일시 |
| `description` | `text` | YES | NULL | 설명 |
| `is_active` | `boolean` | NO | `true` | 활성화 여부 |
| `created_at` | `timestamptz` | NO | `now()` | 생성일시 |
| `updated_at` | `timestamptz` | NO | `now()` | 수정일시 |

**Constraints:**
- `UNIQUE(code)`
- `CHECK(max_uses >= 1)` - 최소 1회 이상 사용 가능

### 9.3 promo_code_uses (프로모션 코드 사용 기록)

프로모션 코드 사용 기록을 저장합니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `promo_code_id` | `uuid` | NO | - | FK → promo_codes.id |
| `user_id` | `uuid` | NO | - | FK → auth.users.id |
| `created_at` | `timestamptz` | NO | `now()` | 사용 시각 |

**Constraints:**
- `UNIQUE(promo_code_id, user_id)` - 사용자당 1회 사용

---

### 7.10 크레딧 및 환불 정책 변경 마이그레이션 (2026-02-10)

```sql
-- 기본 지급 크레딧 5건 → 3건으로 변경
-- 환불 수수료 10% → 15%로 변경 (단건 결제 악용 방지)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- 무료 크레딧 지급 (계약서 3건, AI노무사 5건)
  INSERT INTO public.credits (user_id, credit_type, amount)
  VALUES 
    (NEW.id, 'contract', 3),
    (NEW.id, 'ai_review', 5);
  
  RETURN NEW;
END;
$function$;

-- refund_requests 테이블 기본 수수료율 변경 (10% → 15%)
ALTER TABLE public.refund_requests ALTER COLUMN fee_rate SET DEFAULT 0.15;

COMMENT ON FUNCTION public.handle_new_user() IS '신규 가입 시 프로필 생성 + 무료 크레딧 지급 (계약서 3건, AI 5건)';
```

---

## 10. 채팅 시스템 (2026-02-10)

### 10.1 chat_rooms (채팅방)

계약서별 1:1 채팅방입니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `contract_id` | `uuid` | NO | - | FK → contracts.id (UNIQUE) |
| `employer_id` | `uuid` | NO | - | FK → auth.users.id |
| `worker_id` | `uuid` | NO | - | FK → auth.users.id |
| `last_message_at` | `timestamptz` | NO | `now()` | 최신 메시지 시간 |
| `employer_unread_count` | `integer` | NO | `0` | 사업자 읽지 않은 메시지 수 |
| `worker_unread_count` | `integer` | NO | `0` | 근로자 읽지 않은 메시지 수 |
| `created_at` | `timestamptz` | NO | `now()` | 생성일시 |

**Constraints:**
- `UNIQUE(contract_id)` - 계약서당 1개 채팅방

**RLS Policies:**
- SELECT: 사업자 또는 근로자만 조회
- INSERT: 사업자 또는 근로자만 생성
- UPDATE: 사업자 또는 근로자만 수정

### 10.2 chat_messages (채팅 메시지)

채팅 메시지를 저장합니다.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `room_id` | `uuid` | YES | - | FK → chat_rooms.id |
| `contract_id` | `uuid` | NO | - | FK → contracts.id |
| `sender_id` | `uuid` | NO | - | FK → auth.users.id |
| `content` | `text` | YES | - | 텍스트 메시지 |
| `file_url` | `text` | YES | - | 파일 URL (Storage) |
| `file_name` | `text` | YES | - | 파일명 |
| `file_type` | `text` | YES | - | 파일 타입 (image, pdf, document) |
| `file_size` | `integer` | YES | - | 파일 크기 (bytes) |
| `is_read` | `boolean` | NO | `false` | 읽음 여부 |
| `created_at` | `timestamptz` | NO | `now()` | 생성일시 |

**RLS Policies:**
- SELECT/INSERT/UPDATE: 계약서 당사자만 접근

**Realtime:**
- `supabase_realtime` publication에 추가됨

### 10.3 채팅 시스템 마이그레이션 (2026-02-10)

```sql
-- 1. cs_inquiries 카테고리에 enterprise 추가
ALTER TABLE cs_inquiries DROP CONSTRAINT IF EXISTS cs_inquiries_category_check;
ALTER TABLE cs_inquiries ADD CONSTRAINT cs_inquiries_category_check 
  CHECK (category IN ('general', 'payment', 'refund', 'technical', 'contract', 'account', 'enterprise', 'other'));

-- 2. chat_rooms 테이블 생성
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE UNIQUE,
  employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  employer_unread_count INTEGER DEFAULT 0,
  worker_unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. chat_messages 테이블 개선
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE;

-- 4. 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_rooms_employer ON chat_rooms(employer_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_worker ON chat_rooms(worker_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message ON chat_rooms(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at DESC);

-- 5. RLS 정책
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_rooms_select" ON chat_rooms
  FOR SELECT USING (auth.uid() = employer_id OR auth.uid() = worker_id);

CREATE POLICY "chat_messages_select_policy" ON chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM contracts WHERE contracts.id = chat_messages.contract_id 
    AND (contracts.employer_id = auth.uid() OR contracts.worker_id = auth.uid()))
  );

-- 6. Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- 7. 메시지 생성 시 채팅방 업데이트 트리거
CREATE OR REPLACE FUNCTION update_chat_room_on_message()
RETURNS TRIGGER AS $$
DECLARE
  v_room chat_rooms%ROWTYPE;
BEGIN
  IF NEW.room_id IS NOT NULL THEN
    SELECT * INTO v_room FROM chat_rooms WHERE id = NEW.room_id;
    UPDATE chat_rooms SET 
      last_message_at = NEW.created_at,
      employer_unread_count = CASE WHEN NEW.sender_id != v_room.employer_id THEN employer_unread_count + 1 ELSE employer_unread_count END,
      worker_unread_count = CASE WHEN NEW.sender_id != v_room.worker_id THEN worker_unread_count + 1 ELSE worker_unread_count END
    WHERE id = NEW.room_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_chat_room_on_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_room_on_message();
```

---

> **문서 끝**
