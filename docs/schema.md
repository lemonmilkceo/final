# 📊 Database Schema Specification

## 싸인해주세요 (SignPlease)

> **버전**: 1.24  
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
           │                                                      │
           │ 1:N (employer)                                       │ 1:N (worker)
           ▼                                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  contracts                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ id | employer_id (FK) | worker_id (FK) | status | folder_id | ...    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
           │                              │
           │ 1:N                          │ 1:N
           ▼                              ▼
┌──────────────────────┐       ┌──────────────────────┐
│      signatures      │       │    chat_messages     │
│  ┌────────────────┐  │       │  ┌────────────────┐  │
│  │id|contract_id  │  │       │  │id|contract_id  │  │
│  │signer_role     │  │       │  │sender_id       │  │
│  │signature_data  │  │       │  │content         │  │
│  └────────────────┘  │       │  └────────────────┘  │
└──────────────────────┘       └──────────────────────┘
```

---

## 2. Enums (고정값 정의)

### 2.1 user_role

사용자 역할을 정의합니다.

| Value      | Description            |
| ---------- | ---------------------- |
| `employer` | 사업자 (계약서 작성자) |
| `worker`   | 근로자 (계약서 서명자) |

```sql
CREATE TYPE public.user_role AS ENUM ('employer', 'worker');
```

### 2.2 contract_status

계약서 상태를 정의합니다.

| Value       | Description                                      |
| ----------- | ------------------------------------------------ |
| `draft`     | 임시저장 (사업자 서명 전)                        |
| `pending`   | 서명 대기중 (사업자 서명 완료, 근로자 서명 대기) |
| `completed` | 서명 완료 (양측 서명 완료)                       |
| `expired`   | 만료됨 (7일 내 서명 없음)                        |
| `deleted`   | 삭제됨 (휴지통)                                  |

```sql
CREATE TYPE public.contract_status AS ENUM ('draft', 'pending', 'completed', 'expired', 'deleted');
```

### 2.3 signer_role

서명자 역할을 정의합니다.

| Value      | Description |
| ---------- | ----------- |
| `employer` | 사업자 서명 |
| `worker`   | 근로자 서명 |

```sql
CREATE TYPE public.signer_role AS ENUM ('employer', 'worker');
```

### 2.4 credit_type

크레딧 유형을 정의합니다.

| Value       | Description           |
| ----------- | --------------------- |
| `contract`  | 계약서 작성 크레딧    |
| `ai_review` | AI 노무사 검토 크레딧 |

```sql
CREATE TYPE public.credit_type AS ENUM ('contract', 'ai_review');
```

### 2.5 notification_type

알림 유형을 정의합니다.

| Value                   | Description          |
| ----------------------- | -------------------- |
| `contract_sent`         | 계약서 전송됨        |
| `contract_signed`       | 계약서 서명됨        |
| `contract_expired_soon` | 서명 기한 임박 (D-1) |
| `contract_expired`      | 계약서 만료됨        |

```sql
CREATE TYPE public.notification_type AS ENUM ('contract_sent', 'contract_signed', 'contract_expired_soon', 'contract_expired');
```

### 2.6 business_size

사업장 규모를 정의합니다.

| Value     | Description                  |
| --------- | ---------------------------- |
| `under_5` | 5인 미만 (4대보험 선택 가입) |
| `over_5`  | 5인 이상 (4대보험 의무 가입) |

```sql
CREATE TYPE public.business_size AS ENUM ('under_5', 'over_5');
```

---

## 3. Tables

### 3.1 profiles

사용자 프로필 정보를 저장합니다.

| Column       | Type          | Nullable | Default | Description                                   |
| ------------ | ------------- | -------- | ------- | --------------------------------------------- |
| `id`         | `uuid`        | NO       | -       | PK, FK → auth.users.id                        |
| `role`       | `user_role`   | YES      | NULL    | 사용자 역할 (선택 전 NULL)                    |
| `name`       | `text`        | YES      | NULL    | 사용자 이름 (카카오/Apple OAuth에서 가져옴)   |
| `phone`      | `text`        | YES      | NULL    | 전화번호                                      |
| `avatar_url` | `text`        | YES      | NULL    | 프로필 이미지 URL                             |
| `created_at` | `timestamptz` | NO       | `now()` | 생성일시                                      |
| `updated_at` | `timestamptz` | NO       | `now()` | 수정일시                                      |

**OAuth Provider별 이름 처리**:
- **카카오**: `user_metadata.name` 또는 `user_metadata.full_name` (문자열)
- **Apple**: `user_metadata.name` 객체 형태 `{ firstName, lastName }` - 첫 로그인 시에만 제공

**Constraints:**

- PRIMARY KEY (`id`)
- FOREIGN KEY (`id`) REFERENCES `auth.users(id)` ON DELETE CASCADE

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role,
  name text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

---

### 3.2 worker_details

근로자 민감 정보를 저장합니다. (암호화 필수)

| Column                     | Type          | Nullable | Default             | Description                   |
| -------------------------- | ------------- | -------- | ------------------- | ----------------------------- |
| `id`                       | `uuid`        | NO       | `gen_random_uuid()` | PK                            |
| `user_id`                  | `uuid`        | NO       | -                   | FK → profiles.id              |
| `ssn_encrypted`            | `bytea`       | NO       | -                   | 주민등록번호 (AES-256 암호화) |
| `ssn_hash`                 | `text`        | NO       | -                   | 주민번호 해시 (중복 체크용)   |
| `bank_name`                | `text`        | NO       | -                   | 은행명                        |
| `account_number_encrypted` | `bytea`       | NO       | -                   | 계좌번호 (AES-256 암호화)     |
| `is_verified`              | `boolean`     | NO       | `false`             | 본인인증 완료 여부            |
| `verified_at`              | `timestamptz` | YES      | NULL                | 본인인증 완료 일시            |
| `created_at`               | `timestamptz` | NO       | `now()`             | 생성일시                      |
| `updated_at`               | `timestamptz` | NO       | `now()`             | 수정일시                      |

**Constraints:**

- PRIMARY KEY (`id`)
- UNIQUE (`user_id`)
- FOREIGN KEY (`user_id`) REFERENCES `profiles(id)` ON DELETE CASCADE
- UNIQUE (`ssn_hash`) — 동일 주민번호 중복 가입 방지

```sql
CREATE TABLE public.worker_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  ssn_encrypted bytea NOT NULL,
  ssn_hash text NOT NULL UNIQUE,
  bank_name text NOT NULL,
  account_number_encrypted bytea NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**⚠️ 보안 주의사항:**

- `ssn_encrypted`, `account_number_encrypted`는 반드시 애플리케이션 레벨에서 AES-256-GCM으로 암호화 후 저장
- 암호화 키는 환경변수 `ENCRYPTION_KEY`에 저장 (32바이트)
- 복호화는 서버 사이드에서만 수행

---

### 3.3 folders

계약서 폴더 관리

| Column       | Type          | Nullable | Default             | Description      |
| ------------ | ------------- | -------- | ------------------- | ---------------- |
| `id`         | `uuid`        | NO       | `gen_random_uuid()` | PK               |
| `user_id`    | `uuid`        | NO       | -                   | FK → profiles.id |
| `name`       | `text`        | NO       | -                   | 폴더 이름        |
| `created_at` | `timestamptz` | NO       | `now()`             | 생성일시         |
| `updated_at` | `timestamptz` | NO       | `now()`             | 수정일시         |

**Constraints:**

- PRIMARY KEY (`id`)
- FOREIGN KEY (`user_id`) REFERENCES `profiles(id)` ON DELETE CASCADE
- UNIQUE (`user_id`, `name`) — 동일 사용자 내 폴더명 중복 방지

```sql
CREATE TABLE public.folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);
```

---

### 3.4 contracts

계약서 정보를 저장합니다.

| Column                      | Type              | Nullable | Default                   | Description                                  |
| --------------------------- | ----------------- | -------- | ------------------------- | -------------------------------------------- |
| `id`                        | `uuid`            | NO       | `gen_random_uuid()`       | PK                                           |
| `employer_id`               | `uuid`            | NO       | -                         | FK → profiles.id (사업자)                    |
| `worker_id`                 | `uuid`            | YES      | NULL                      | FK → profiles.id (근로자, 서명 전 NULL 가능) |
| `folder_id`                 | `uuid`            | YES      | NULL                      | FK → folders.id                              |
| `status`                    | `contract_status` | NO       | `'draft'`                 | 계약서 상태                                  |
| `share_token`               | `text`            | NO       | `gen_random_uuid()::text` | 공유용 토큰                                  |
| `business_size`             | `business_size`   | NO       | -                         | 사업장 규모                                  |
| `worker_name`               | `text`            | NO       | -                         | 근로자 이름 (입력값)                         |
| `hourly_wage`               | `integer`         | NO       | -                         | 시급 (원)                                    |
| `includes_weekly_allowance` | `boolean`         | NO       | `false`                   | 주휴수당 포함 여부                           |
| `start_date`                | `date`            | NO       | -                         | 근무 시작일                                  |
| `end_date`                  | `date`            | YES      | NULL                      | 근무 예정 종료일 (NULL: 무기한)              |
| `resignation_date`          | `date`            | YES      | NULL                      | 실제 퇴사일 (근로자 입력)                    |
| `work_days`                 | `text[]`          | YES      | NULL                      | 근무 요일 배열 ['월', '화', ...]             |
| `work_days_per_week`        | `integer`         | YES      | NULL                      | 주 N일 (work_days가 NULL일 때)               |
| `work_start_time`           | `time`            | NO       | -                         | 근무 시작 시간                               |
| `work_end_time`             | `time`            | NO       | -                         | 근무 종료 시간                               |
| `break_minutes`             | `integer`         | NO       | -                         | 휴게시간 (분)                                |
| `work_location`             | `text`            | NO       | -                         | 근무 장소                                    |
| `job_description`           | `text`            | NO       | -                         | 업무 내용                                    |
| `pay_day`                   | `integer`         | NO       | -                         | 급여 지급일 (1-31)                           |
| `expires_at`                | `timestamptz`     | YES      | NULL                      | 서명 만료 일시 (pending 시 설정)             |
| `completed_at`              | `timestamptz`     | YES      | NULL                      | 서명 완료 일시                               |
| `deleted_at`                | `timestamptz`     | YES      | NULL                      | 삭제 일시 (휴지통 이동)                      |
| `pdf_url`                   | `text`            | YES      | NULL                      | 생성된 PDF URL (Storage)                     |
| `created_at`                | `timestamptz`     | NO       | `now()`                   | 생성일시                                     |
| `updated_at`                | `timestamptz`     | NO       | `now()`                   | 수정일시                                     |

**Constraints:**

- PRIMARY KEY (`id`)
- FOREIGN KEY (`employer_id`) REFERENCES `profiles(id)` ON DELETE CASCADE
- FOREIGN KEY (`worker_id`) REFERENCES `profiles(id)` ON DELETE SET NULL
- FOREIGN KEY (`folder_id`) REFERENCES `folders(id)` ON DELETE SET NULL
- CHECK (`hourly_wage >= 10030`) — 2026년 최저시급
- CHECK (`pay_day >= 1 AND pay_day <= 31`)
- CHECK (`break_minutes >= 0`)
- CHECK (`work_days_per_week >= 1 AND work_days_per_week <= 7`)

**Indexes:**

- `idx_contracts_employer_id` ON (`employer_id`)
- `idx_contracts_worker_id` ON (`worker_id`)
- `idx_contracts_status` ON (`status`)
- `idx_contracts_share_token` ON (`share_token`)
- `idx_contracts_expires_at` ON (`expires_at`) WHERE `status = 'pending'`

```sql
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  status contract_status NOT NULL DEFAULT 'draft',
  share_token text NOT NULL DEFAULT gen_random_uuid()::text,

  -- 계약 내용
  business_size business_size NOT NULL,
  worker_name text NOT NULL,
  hourly_wage integer NOT NULL CHECK (hourly_wage >= 10030),
  includes_weekly_allowance boolean NOT NULL DEFAULT false,
  start_date date NOT NULL,
  end_date date,
  resignation_date date,  -- 실제 퇴사일 (근로자 입력)
  work_days text[],
  work_days_per_week integer CHECK (work_days_per_week >= 1 AND work_days_per_week <= 7),
  work_start_time time NOT NULL,
  work_end_time time NOT NULL,
  break_minutes integer NOT NULL CHECK (break_minutes >= 0),
  work_location text NOT NULL,
  job_description text NOT NULL,
  pay_day integer NOT NULL CHECK (pay_day >= 1 AND pay_day <= 31),

  -- 상태 관련
  expires_at timestamptz,
  completed_at timestamptz,
  deleted_at timestamptz,
  pdf_url text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contracts_employer_id ON contracts(employer_id);
CREATE INDEX idx_contracts_worker_id ON contracts(worker_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_share_token ON contracts(share_token);
CREATE INDEX idx_contracts_expires_at ON contracts(expires_at) WHERE status = 'pending';
```

---

### 3.5 signatures

서명 데이터를 저장합니다.

| Column           | Type          | Nullable | Default             | Description                   |
| ---------------- | ------------- | -------- | ------------------- | ----------------------------- |
| `id`             | `uuid`        | NO       | `gen_random_uuid()` | PK                            |
| `contract_id`    | `uuid`        | NO       | -                   | FK → contracts.id             |
| `user_id`        | `uuid`        | NO       | -                   | FK → profiles.id (서명자)     |
| `signer_role`    | `signer_role` | NO       | -                   | 서명자 역할                   |
| `signature_data` | `text`        | NO       | -                   | 서명 이미지 (Base64 Data URL) |
| `signed_at`      | `timestamptz` | NO       | `now()`             | 서명 일시                     |
| `ip_address`     | `inet`        | YES      | NULL                | 서명 시 IP 주소               |
| `user_agent`     | `text`        | YES      | NULL                | 서명 시 User Agent            |

**Constraints:**

- PRIMARY KEY (`id`)
- FOREIGN KEY (`contract_id`) REFERENCES `contracts(id)` ON DELETE CASCADE
- FOREIGN KEY (`user_id`) REFERENCES `profiles(id)` ON DELETE CASCADE
- UNIQUE (`contract_id`, `signer_role`) — 동일 계약서에 역할당 1개 서명만

```sql
CREATE TABLE public.signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  signer_role signer_role NOT NULL,
  signature_data text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  UNIQUE(contract_id, signer_role)
);

CREATE INDEX idx_signatures_contract_id ON signatures(contract_id);
```

---

### 3.6 ai_reviews

AI 노무사 검토 결과를 저장합니다.

| Column         | Type          | Nullable | Default             | Description       |
| -------------- | ------------- | -------- | ------------------- | ----------------- |
| `id`           | `uuid`        | NO       | `gen_random_uuid()` | PK                |
| `contract_id`  | `uuid`        | NO       | -                   | FK → contracts.id |
| `requested_by` | `uuid`        | NO       | -                   | FK → profiles.id  |
| `result`       | `jsonb`       | NO       | -                   | 검토 결과 JSON    |
| `created_at`   | `timestamptz` | NO       | `now()`             | 검토 요청 일시    |

**result JSONB 구조:**

```json
{
  "overall_status": "pass" | "warning" | "fail",
  "items": [
    {
      "category": "minimum_wage" | "break_time" | "required_fields" | "weekly_allowance",
      "status": "pass" | "warning" | "fail",
      "title": "최저시급",
      "description": "2026년 기준 충족",
      "suggestion": null | "수정 제안 문구"
    }
  ]
}
```

**Constraints:**

- PRIMARY KEY (`id`)
- FOREIGN KEY (`contract_id`) REFERENCES `contracts(id)` ON DELETE CASCADE
- FOREIGN KEY (`requested_by`) REFERENCES `profiles(id)` ON DELETE CASCADE

```sql
CREATE TABLE public.ai_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_reviews_contract_id ON ai_reviews(contract_id);
```

---

### 3.7 credits

사용자 크레딧 정보를 저장합니다.

| Column        | Type          | Nullable | Default             | Description      |
| ------------- | ------------- | -------- | ------------------- | ---------------- |
| `id`          | `uuid`        | NO       | `gen_random_uuid()` | PK               |
| `user_id`     | `uuid`        | NO       | -                   | FK → profiles.id |
| `credit_type` | `credit_type` | NO       | -                   | 크레딧 종류      |
| `amount`      | `integer`     | NO       | `0`                 | 보유 수량        |
| `updated_at`  | `timestamptz` | NO       | `now()`             | 수정일시         |

**Constraints:**

- PRIMARY KEY (`id`)
- UNIQUE (`user_id`, `credit_type`)
- FOREIGN KEY (`user_id`) REFERENCES `profiles(id)` ON DELETE CASCADE
- CHECK (`amount >= 0`)

```sql
CREATE TABLE public.credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credit_type credit_type NOT NULL,
  amount integer NOT NULL DEFAULT 0 CHECK (amount >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, credit_type)
);
```

---

### 3.8 credit_transactions

크레딧 거래 내역을 저장합니다.

| Column          | Type          | Nullable | Default             | Description                  |
| --------------- | ------------- | -------- | ------------------- | ---------------------------- |
| `id`            | `uuid`        | NO       | `gen_random_uuid()` | PK                           |
| `user_id`       | `uuid`        | NO       | -                   | FK → profiles.id             |
| `credit_type`   | `credit_type` | NO       | -                   | 크레딧 종류                  |
| `amount`        | `integer`     | NO       | -                   | 변동 수량 (+: 충전, -: 사용) |
| `balance_after` | `integer`     | NO       | -                   | 거래 후 잔액                 |
| `description`   | `text`        | NO       | -                   | 거래 설명                    |
| `reference_id`  | `uuid`        | YES      | NULL                | 관련 ID (계약서, 결제 등)    |
| `created_at`    | `timestamptz` | NO       | `now()`             | 거래 일시                    |

**Constraints:**

- PRIMARY KEY (`id`)
- FOREIGN KEY (`user_id`) REFERENCES `profiles(id)` ON DELETE CASCADE

```sql
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credit_type credit_type NOT NULL,
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  description text NOT NULL,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
```

---

### 3.9 payments

결제 내역을 저장합니다.

| Column              | Type          | Nullable | Default             | Description            |
| ------------------- | ------------- | -------- | ------------------- | ---------------------- |
| `id`                | `uuid`        | NO       | `gen_random_uuid()` | PK                     |
| `user_id`           | `uuid`        | NO       | -                   | FK → profiles.id       |
| `order_id`          | `text`        | NO       | -                   | 주문 ID (토스페이먼츠) |
| `payment_key`       | `text`        | YES      | NULL                | 결제 키 (토스페이먼츠) |
| `amount`            | `integer`     | NO       | -                   | 결제 금액 (원)         |
| `product_name`      | `text`        | NO       | -                   | 상품명                 |
| `credits_contract`  | `integer`     | NO       | `0`                 | 지급 계약서 크레딧 수  |
| `credits_ai_review` | `integer`     | NO       | `0`                 | 지급 AI검토 크레딧 수  |
| `status`            | `text`        | NO       | `'pending'`         | 결제 상태              |
| `paid_at`           | `timestamptz` | YES      | NULL                | 결제 완료 일시         |
| `receipt_url`       | `text`        | YES      | NULL                | 영수증 URL             |
| `created_at`        | `timestamptz` | NO       | `now()`             | 생성일시               |

**status 값:**

- `pending`: 결제 대기
- `completed`: 결제 완료
- `failed`: 결제 실패
- `cancelled`: 결제 취소

**Constraints:**

- PRIMARY KEY (`id`)
- UNIQUE (`order_id`)
- FOREIGN KEY (`user_id`) REFERENCES `profiles(id)` ON DELETE CASCADE

```sql
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id text NOT NULL UNIQUE,
  payment_key text,
  amount integer NOT NULL,
  product_name text NOT NULL,
  credits_contract integer NOT NULL DEFAULT 0,
  credits_ai_review integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  receipt_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
```

---

### 3.10 chat_messages

채팅 메시지를 저장합니다.

| Column        | Type          | Nullable | Default             | Description       |
| ------------- | ------------- | -------- | ------------------- | ----------------- |
| `id`          | `uuid`        | NO       | `gen_random_uuid()` | PK                |
| `contract_id` | `uuid`        | NO       | -                   | FK → contracts.id |
| `sender_id`   | `uuid`        | NO       | -                   | FK → profiles.id  |
| `content`     | `text`        | NO       | -                   | 메시지 내용       |
| `file_url`    | `text`        | YES      | NULL                | 첨부파일 URL      |
| `file_type`   | `text`        | YES      | NULL                | 파일 MIME 타입    |
| `is_read`     | `boolean`     | NO       | `false`             | 읽음 여부         |
| `created_at`  | `timestamptz` | NO       | `now()`             | 전송 일시         |

**Constraints:**

- PRIMARY KEY (`id`)
- FOREIGN KEY (`contract_id`) REFERENCES `contracts(id)` ON DELETE CASCADE
- FOREIGN KEY (`sender_id`) REFERENCES `profiles(id)` ON DELETE CASCADE

```sql
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  file_url text,
  file_type text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_contract_id ON chat_messages(contract_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
```

---

### 3.11 notifications

알림 정보를 저장합니다.

| Column       | Type                | Nullable | Default             | Description                |
| ------------ | ------------------- | -------- | ------------------- | -------------------------- |
| `id`         | `uuid`              | NO       | `gen_random_uuid()` | PK                         |
| `user_id`    | `uuid`              | NO       | -                   | FK → profiles.id           |
| `type`       | `notification_type` | NO       | -                   | 알림 종류                  |
| `title`      | `text`              | NO       | -                   | 알림 제목                  |
| `body`       | `text`              | NO       | -                   | 알림 내용                  |
| `data`       | `jsonb`             | YES      | NULL                | 추가 데이터 (계약서 ID 등) |
| `is_read`    | `boolean`           | NO       | `false`             | 읽음 여부                  |
| `created_at` | `timestamptz`       | NO       | `now()`             | 생성 일시                  |

**Constraints:**

- PRIMARY KEY (`id`)
- FOREIGN KEY (`user_id`) REFERENCES `profiles(id)` ON DELETE CASCADE

```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

## 4. Row Level Security (RLS) Policies

### 4.1 profiles

| Policy Name           | Operation | Role          | Logic                                        |
| --------------------- | --------- | ------------- | -------------------------------------------- |
| `profiles_select_own` | SELECT    | authenticated | 자신의 프로필만 조회 가능: `auth.uid() = id` |
| `profiles_update_own` | UPDATE    | authenticated | 자신의 프로필만 수정 가능: `auth.uid() = id` |
| `profiles_insert_own` | INSERT    | authenticated | 자신의 프로필만 생성 가능: `auth.uid() = id` |

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);
```

---

### 4.2 worker_details

| Policy Name                 | Operation | Role          | Logic                   |
| --------------------------- | --------- | ------------- | ----------------------- |
| `worker_details_select_own` | SELECT    | authenticated | 자신의 정보만 조회 가능 |
| `worker_details_insert_own` | INSERT    | authenticated | 자신의 정보만 생성 가능 |
| `worker_details_update_own` | UPDATE    | authenticated | 자신의 정보만 수정 가능 |

```sql
ALTER TABLE worker_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY worker_details_select_own ON worker_details
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY worker_details_insert_own ON worker_details
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY worker_details_update_own ON worker_details
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

---

### 4.3 folders

| Policy Name          | Operation | Role          | Logic              |
| -------------------- | --------- | ------------- | ------------------ |
| `folders_select_own` | SELECT    | authenticated | 자신의 폴더만 조회 |
| `folders_insert_own` | INSERT    | authenticated | 자신의 폴더만 생성 |
| `folders_update_own` | UPDATE    | authenticated | 자신의 폴더만 수정 |
| `folders_delete_own` | DELETE    | authenticated | 자신의 폴더만 삭제 |

```sql
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY folders_select_own ON folders
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY folders_insert_own ON folders
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY folders_update_own ON folders
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY folders_delete_own ON folders
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

---

### 4.4 contracts

| Policy Name                 | Operation | Role                | Logic                                              |
| --------------------------- | --------- | ------------------- | -------------------------------------------------- |
| `contracts_select_employer` | SELECT    | authenticated       | 사업자: 자신이 작성한 계약서 조회 가능             |
| `contracts_select_worker`   | SELECT    | authenticated       | 근로자: 자신에게 전송된 계약서 조회 가능           |
| `contracts_select_by_token` | SELECT    | anon, authenticated | 공유 토큰으로 계약서 조회 가능 (로그인 전)         |
| `contracts_insert_employer` | INSERT    | authenticated       | 사업자만 계약서 생성 가능                          |
| `contracts_update_employer` | UPDATE    | authenticated       | 사업자: 자신이 작성한 계약서 수정 가능 (상태 제한) |
| `contracts_update_worker`   | UPDATE    | authenticated       | 근로자: worker_id 설정 및 상태 변경만 가능         |

```sql
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- 사업자: 자신이 작성한 계약서 조회
CREATE POLICY contracts_select_employer ON contracts
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = employer_id);

-- 근로자: 자신에게 전송된 계약서 조회
CREATE POLICY contracts_select_worker ON contracts
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = worker_id);

-- 사업자: 계약서 생성 (role 확인)
CREATE POLICY contracts_insert_employer ON contracts
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = employer_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'employer'
    )
  );

-- 사업자: 계약서 수정 (draft, pending 상태만)
CREATE POLICY contracts_update_employer ON contracts
  FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid()) = employer_id
    AND status IN ('draft', 'pending')
  );
```

---

### 4.5 signatures

| Policy Name             | Operation | Role          | Logic                     |
| ----------------------- | --------- | ------------- | ------------------------- |
| `signatures_select`     | SELECT    | authenticated | 계약서 관련자만 조회 가능 |
| `signatures_insert_own` | INSERT    | authenticated | 자신의 서명만 생성 가능   |

```sql
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY signatures_select ON signatures
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_id
      AND ((SELECT auth.uid()) = c.employer_id OR (SELECT auth.uid()) = c.worker_id)
    )
  );

CREATE POLICY signatures_insert_own ON signatures
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
```

---

### 4.6 ai_reviews

| Policy Name         | Operation | Role          | Logic                     |
| ------------------- | --------- | ------------- | ------------------------- |
| `ai_reviews_select` | SELECT    | authenticated | 계약서 사업자만 조회 가능 |
| `ai_reviews_insert` | INSERT    | authenticated | 계약서 사업자만 생성 가능 |

```sql
ALTER TABLE ai_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_reviews_select ON ai_reviews
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_id AND c.employer_id = (SELECT auth.uid())
    )
  );

CREATE POLICY ai_reviews_insert ON ai_reviews
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = requested_by);
```

---

### 4.7 credits

| Policy Name          | Operation | Role          | Logic                |
| -------------------- | --------- | ------------- | -------------------- |
| `credits_select_own` | SELECT    | authenticated | 자신의 크레딧만 조회 |

```sql
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY credits_select_own ON credits
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- INSERT/UPDATE는 서버 함수를 통해서만 수행 (RLS 우회)
```

---

### 4.8 credit_transactions

| Policy Name                      | Operation | Role          | Logic                  |
| -------------------------------- | --------- | ------------- | ---------------------- |
| `credit_transactions_select_own` | SELECT    | authenticated | 자신의 거래내역만 조회 |

```sql
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY credit_transactions_select_own ON credit_transactions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

---

### 4.9 payments

| Policy Name           | Operation | Role          | Logic                  |
| --------------------- | --------- | ------------- | ---------------------- |
| `payments_select_own` | SELECT    | authenticated | 자신의 결제내역만 조회 |

```sql
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payments_select_own ON payments
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

---

### 4.10 chat_messages

| Policy Name            | Operation | Role          | Logic                     |
| ---------------------- | --------- | ------------- | ------------------------- |
| `chat_messages_select` | SELECT    | authenticated | 계약서 관련자만 조회 가능 |
| `chat_messages_insert` | INSERT    | authenticated | 계약서 관련자만 전송 가능 |
| `chat_messages_update` | UPDATE    | authenticated | 상대방만 읽음 처리 가능   |

```sql
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_messages_select ON chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_id
      AND ((SELECT auth.uid()) = c.employer_id OR (SELECT auth.uid()) = c.worker_id)
    )
  );

CREATE POLICY chat_messages_insert ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = sender_id
    AND EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_id
      AND ((SELECT auth.uid()) = c.employer_id OR (SELECT auth.uid()) = c.worker_id)
    )
  );

CREATE POLICY chat_messages_update ON chat_messages
  FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid()) <> sender_id
    AND EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_id
      AND ((SELECT auth.uid()) = c.employer_id OR (SELECT auth.uid()) = c.worker_id)
    )
  );
```

---

### 4.11 notifications

| Policy Name                | Operation | Role          | Logic                          |
| -------------------------- | --------- | ------------- | ------------------------------ |
| `notifications_select_own` | SELECT    | authenticated | 자신의 알림만 조회             |
| `notifications_update_own` | UPDATE    | authenticated | 자신의 알림만 수정 (읽음 처리) |

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own ON notifications
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

---

## 5. Database Functions

### 5.1 handle_new_user()

신규 가입 시 profiles 테이블에 자동으로 레코드 생성

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- 무료 크레딧 5개 지급 (계약서 5개, AI노무사 5개)
  INSERT INTO public.credits (user_id, credit_type, amount)
  VALUES
    (NEW.id, 'contract', 5),
    (NEW.id, 'ai_review', 5);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5.2 use_credit()

크레딧 사용 함수 (원자적 처리)

```sql
CREATE OR REPLACE FUNCTION public.use_credit(
  p_user_id uuid,
  p_credit_type credit_type,
  p_amount integer,
  p_description text,
  p_reference_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
BEGIN
  -- 현재 잔액 확인 (FOR UPDATE로 락)
  SELECT amount INTO v_current_balance
  FROM credits
  WHERE user_id = p_user_id AND credit_type = p_credit_type
  FOR UPDATE;

  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN false;
  END IF;

  v_new_balance := v_current_balance - p_amount;

  -- 크레딧 차감
  UPDATE credits
  SET amount = v_new_balance, updated_at = now()
  WHERE user_id = p_user_id AND credit_type = p_credit_type;

  -- 거래 내역 기록
  INSERT INTO credit_transactions (user_id, credit_type, amount, balance_after, description, reference_id)
  VALUES (p_user_id, p_credit_type, -p_amount, v_new_balance, p_description, p_reference_id);

  RETURN true;
END;
$$;
```

### 5.3 add_credit()

크레딧 충전 함수

```sql
CREATE OR REPLACE FUNCTION public.add_credit(
  p_user_id uuid,
  p_credit_type credit_type,
  p_amount integer,
  p_description text,
  p_reference_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  -- 크레딧 추가 (UPSERT)
  INSERT INTO credits (user_id, credit_type, amount)
  VALUES (p_user_id, p_credit_type, p_amount)
  ON CONFLICT (user_id, credit_type)
  DO UPDATE SET amount = credits.amount + p_amount, updated_at = now()
  RETURNING amount INTO v_new_balance;

  -- 거래 내역 기록
  INSERT INTO credit_transactions (user_id, credit_type, amount, balance_after, description, reference_id)
  VALUES (p_user_id, p_credit_type, p_amount, v_new_balance, p_description, p_reference_id);

  RETURN v_new_balance;
END;
$$;
```

### 5.4 expire_pending_contracts()

만료된 계약서 자동 처리 (pg_cron 사용)

```sql
CREATE OR REPLACE FUNCTION public.expire_pending_contracts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE contracts
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending'
    AND expires_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- pg_cron 스케줄 (매시간 실행)
SELECT cron.schedule('expire-contracts', '0 * * * *', 'SELECT expire_pending_contracts()');
```

---

## 6. Storage Buckets

### 6.1 signatures

서명 이미지 저장

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', false);

-- RLS: 계약서 관련자만 접근
CREATE POLICY signatures_bucket_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'signatures'
    AND EXISTS (
      SELECT 1 FROM contracts c
      JOIN signatures s ON s.contract_id = c.id
      WHERE s.signature_data LIKE '%' || name || '%'
      AND ((SELECT auth.uid()) = c.employer_id OR (SELECT auth.uid()) = c.worker_id)
    )
  );
```

### 6.2 contracts-pdf

계약서 PDF 저장

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts-pdf', 'contracts-pdf', false);

-- RLS: 계약서 관련자만 다운로드
CREATE POLICY contracts_pdf_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'contracts-pdf'
    AND EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.pdf_url LIKE '%' || name || '%'
      AND ((SELECT auth.uid()) = c.employer_id OR (SELECT auth.uid()) = c.worker_id)
    )
  );
```

### 6.3 chat-files

채팅 첨부파일 저장

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', false);

-- RLS: 채팅 참여자만 업로드/다운로드
CREATE POLICY chat_files_access ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'chat-files'
    AND EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN contracts c ON c.id = cm.contract_id
      WHERE cm.file_url LIKE '%' || name || '%'
      AND ((SELECT auth.uid()) = c.employer_id OR (SELECT auth.uid()) = c.worker_id)
    )
  );
```

---

## 7. 기획서 대비 수정/보완 사항

### 7.1 기술적 수정 제안

| 기획 내용        | 수정 제안                                          | 이유                                                                          |
| ---------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| 주민번호 저장    | 애플리케이션 레벨 암호화 필수                      | Postgres의 pgcrypto보다 애플리케이션 레벨 암호화가 더 안전하고 키 관리가 용이 |
| 서명 기한 7일    | `expires_at` 컬럼으로 관리 + pg_cron으로 자동 만료 | 정확한 만료 처리 보장                                                         |
| 휴지통 30일 보관 | `deleted_at` 컬럼 + pg_cron 스케줄링               | 영구 삭제 자동화                                                              |
| 계약서 상태      | `draft` 상태 추가                                  | 사업자 서명 전 임시저장 지원                                                  |

### 7.2 비효율적인 부분 개선

| 기획 내용          | 개선 방향                                                 |
| ------------------ | --------------------------------------------------------- |
| 폴더별 계약서 분류 | `folder_id` FK로 단순화 (복수 폴더 지원 X)                |
| 채팅 기능          | 계약서 기반 1:1 채팅으로 설계 (별도 채팅방 테이블 불필요) |

---

---

## 📝 Amendment 1: 스키마 변경 없음 (2026년 1월 24일)

> **버전**: 1.1  
> **변경 사유**: UI/UX 개선 관련

### A1.1 스키마 영향 분석

이번 UI/UX 개선(헤더 메뉴, 대시보드 레이아웃 변경)은 **데이터베이스 스키마 변경을 필요로 하지 않습니다.**

| 변경 사항              | 스키마 영향                                          |
| ---------------------- | ---------------------------------------------------- |
| 햄버거 메뉴 추가       | ❌ 없음 (UI 전용)                                    |
| 대시보드 레이아웃 변경 | ❌ 없음 (기존 contracts 테이블 status 필드로 필터링) |
| 프로필 페이지          | ❌ 없음 (기존 profiles 테이블 사용)                  |
| 폴더 접근 방식 변경    | ❌ 없음 (기존 folders 테이블 사용)                   |

### A1.2 쿼리 변경 사항

대시보드에서 사용하는 쿼리는 다음과 같이 변경됩니다:

**기존 (탭별 필터링):**

```sql
-- 대기중 탭
SELECT * FROM contracts WHERE employer_id = $1 AND status = 'pending';

-- 완료 탭
SELECT * FROM contracts WHERE employer_id = $1 AND status = 'completed';
```

**변경 (한 화면에서 2개 쿼리):**

```sql
-- 대기중 섹션
SELECT * FROM contracts
WHERE employer_id = $1 AND status = 'pending'
ORDER BY created_at DESC;

-- 완료 섹션
SELECT * FROM contracts
WHERE employer_id = $1 AND status = 'completed'
ORDER BY completed_at DESC;
```

---

> **Amendment 1 끝**

---

## 📝 Amendment 2: 스키마 변경 없음 (2026년 1월 24일)

> **버전**: 1.2  
> **변경 사유**: 게스트 모드 및 환영 메시지 기능

### A2.1 스키마 영향 분석

이번 변경(게스트 모드, 환영 메시지)은 **데이터베이스 스키마 변경을 필요로 하지 않습니다.**

| 변경 사항                 | 스키마 영향                                  |
| ------------------------- | -------------------------------------------- |
| 환영 메시지 (닉네임 표시) | ❌ 없음 (auth.users.raw_user_meta_data 사용) |
| 게스트 모드 쿠키          | ❌ 없음 (클라이언트 쿠키 사용)               |
| 샘플 데이터               | ❌ 없음 (하드코딩된 데모 데이터)             |

---

> **Amendment 2 끝**

---

## 📝 Amendment 3: 폴더 색상 컬럼 (2026년 1월 24일)

> **버전**: 1.3  
> **변경 사유**: 폴더 색상 선택 기능 지원

### A3.1 스키마 변경 사항

#### folders 테이블에 color 컬럼 추가 필요

| Column  | Type   | Nullable | Default     | Description     |
| ------- | ------ | -------- | ----------- | --------------- |
| `color` | `text` | YES      | `'#3B82F6'` | 폴더 색상 (HEX) |

**마이그레이션 SQL:**

```sql
ALTER TABLE folders ADD COLUMN color text DEFAULT '#3B82F6';
```

### A3.2 현재 상태

- **코드**: color 컬럼 지원 준비 완료 (주석 처리)
- **DB**: 마이그레이션 대기 중
- **임시 처리**: 인덱스 기반 색상 팔레트로 대체

---

> **Amendment 3 끝**

---

## 📝 Amendment 6: 급여 형태 확장 (2026년 1월 24일)

> **버전**: 1.6  
> **변경 사유**: 시급/월급 선택 기능 및 2026년 최저시급 업데이트

### A6.1 스키마 변경 사항

#### contracts 테이블에 컬럼 추가 필요

| Column         | Type      | Nullable | Default    | Description                       |
| -------------- | --------- | -------- | ---------- | --------------------------------- |
| `wage_type`    | `text`    | NO       | `'hourly'` | 급여 형태 ('hourly' \| 'monthly') |
| `monthly_wage` | `integer` | YES      | `NULL`     | 월급 금액 (월급제일 때만 사용)    |

**마이그레이션 SQL:**

```sql
-- 급여 형태 컬럼 추가
ALTER TABLE contracts ADD COLUMN wage_type text NOT NULL DEFAULT 'hourly';

-- 월급 컬럼 추가
ALTER TABLE contracts ADD COLUMN monthly_wage integer;

-- 급여 형태 제약 조건
ALTER TABLE contracts ADD CONSTRAINT check_wage_type
  CHECK (wage_type IN ('hourly', 'monthly'));

-- 월급제일 때 monthly_wage 필수
ALTER TABLE contracts ADD CONSTRAINT check_monthly_wage_required
  CHECK (
    (wage_type = 'monthly' AND monthly_wage IS NOT NULL AND monthly_wage > 0) OR
    (wage_type = 'hourly' AND monthly_wage IS NULL)
  );
```

### A6.2 최저시급 업데이트

| 항목                      | 이전     | 변경                        |
| ------------------------- | -------- | --------------------------- |
| 2026년 최저시급           | 10,030원 | **10,360원**                |
| 주휴수당 포함 시 최저시급 | 없음     | **12,432원** (10,360 × 1.2) |

**영향받는 파일:**

- `lib/utils/validation.ts` - MINIMUM_WAGE_2026 상수
- `app/api/ai-review/route.ts` - AI 검토 최저시급
- `lib/constants/sampleData.ts` - 샘플 데이터
- `components/contract/ContractForm/Step3Wage.tsx` - UI 상수

### A6.3 현재 상태

- **코드**: wage_type, monthly_wage 필드 추가 완료 (contractFormStore)
- **DB**: 마이그레이션 대기 중
- **최저시급**: 10,360원으로 업데이트 완료

---

> **Amendment 6 끝**

---

## 📝 Amendment 9: 임금 지급일 필드 추가 (2026년 1월 24일)

> **버전**: 1.9  
> **변경 사유**: 당월/익월 지급 및 말일 지급 옵션 추가

### A9.1 스키마 변경 사항

#### contracts 테이블에 컬럼 추가 필요

| Column                | Type      | Nullable | Default           | Description                                 |
| --------------------- | --------- | -------- | ----------------- | ------------------------------------------- |
| `payment_timing`      | `text`    | NO       | `'current_month'` | 지급 시기 ('current_month' \| 'next_month') |
| `is_last_day_payment` | `boolean` | NO       | `false`           | 말일 지급 여부                              |

**마이그레이션 SQL:**

```sql
-- 지급 시기 컬럼 추가
ALTER TABLE contracts ADD COLUMN payment_timing text NOT NULL DEFAULT 'current_month';

-- 말일 지급 컬럼 추가
ALTER TABLE contracts ADD COLUMN is_last_day_payment boolean NOT NULL DEFAULT false;

-- 지급 시기 제약 조건
ALTER TABLE contracts ADD CONSTRAINT check_payment_timing
  CHECK (payment_timing IN ('current_month', 'next_month'));
```

### A9.2 현재 상태

- **코드**: paymentTiming, isLastDayPayment 필드 추가 완료 (contractFormStore)
- **DB**: 마이그레이션 대기 중

---

> **Amendment 9 끝**

---

## 📝 Amendment 10: 근로자 휴대폰 번호 필드 추가 (2026년 1월 25일)

> **버전**: 1.10  
> **변경 사유**: 근로자 본인 확인을 위한 휴대폰 번호 매칭 기능
> **상태**: ✅ 완료

### A10.1 스키마 변경 사항

#### contracts 테이블에 worker_phone 컬럼 추가

| Column         | Type   | Nullable | Default | Description                      |
| -------------- | ------ | -------- | ------- | -------------------------------- |
| `worker_phone` | `text` | YES      | `NULL`  | 근로자 휴대폰 번호 (본인 확인용) |

**마이그레이션 SQL (적용 완료):**

```sql
-- 근로자 휴대폰 번호 컬럼 추가
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS worker_phone text;

-- 인덱스 추가 (휴대폰 번호로 검색 시 성능 향상)
CREATE INDEX IF NOT EXISTS idx_contracts_worker_phone ON contracts(worker_phone);

COMMENT ON COLUMN contracts.worker_phone IS '근로자 휴대폰 번호 (본인 확인용)';
```

### A10.2 용도

1. **계약서 작성 시**: 사장님이 근로자 휴대폰 번호 입력
2. **서명 링크 접근 시**: 입력한 번호와 계약서에 저장된 번호 매칭으로 본인 확인
3. **보안**: 마스킹된 힌트 표시 (예: 010-\*\*\*\*-5678)

---

> **Amendment 10 끝**

---

## 📝 Amendment 11: 스키마 변경 없음 - 기능 개선 (2026년 1월 25일)

> **버전**: 1.11  
> **변경 사유**: UX 개선 및 프리미엄 UI 적용
> **스키마 영향**: 없음

### A11.1 스키마 영향 분석

이번 변경 사항은 데이터베이스 스키마 변경을 필요로 하지 않습니다.

| 변경 사항               | 스키마 영향                               |
| ----------------------- | ----------------------------------------- |
| 휴게시간 없음 옵션      | ❌ 없음 (기존 break_minutes = 0으로 저장) |
| 업종 선택 자동 모달     | ❌ 없음 (UI 전용)                         |
| 홈 버튼 + 임시저장      | ❌ 없음 (sessionStorage 사용)             |
| AI 리뷰어 크레딧 표시   | ❌ 없음 (기존 credits 테이블 사용)        |
| 법적 페이지             | ❌ 없음 (정적 페이지)                     |
| AI 버튼 프리미엄 디자인 | ❌ 없음 (UI 전용)                         |
| Coming Soon 메시지      | ❌ 없음 (UI 전용)                         |
| 공유 바텀시트           | ❌ 없음 (기존 share_token 사용)           |
| AI 리뷰 흐름 개선       | ❌ 없음 (API 로직 변경)                   |

### A11.2 쿼리 변경 사항

#### 크레딧 조회 (변경)

**기존 (단일 크레딧 조회):**

```sql
SELECT amount FROM credits
WHERE user_id = $1 AND credit_type = 'contract';
```

**변경 (양쪽 크레딧 조회):**

```sql
-- 계약서 크레딧
SELECT amount FROM credits
WHERE user_id = $1 AND credit_type = 'contract';

-- AI 리뷰 크레딧
SELECT amount FROM credits
WHERE user_id = $1 AND credit_type = 'ai_review';
```

---

> **Amendment 11 끝**

---

## 📝 Amendment 12: worker_hidden_contracts 테이블 추가 (2026년 1월 25일)

> **버전**: 1.12  
> **변경 사유**: 근로자 대시보드 숨기기 기능 지원

### 12.1 신규 테이블: worker_hidden_contracts

```sql
CREATE TABLE worker_hidden_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  hidden_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(worker_id, contract_id)
);
```

#### 컬럼 설명

| 컬럼        | 타입        | 필수 | 설명                     |
| ----------- | ----------- | ---- | ------------------------ |
| id          | uuid        | ✅   | PK                       |
| worker_id   | uuid        | ✅   | 근로자 ID (profiles FK)  |
| contract_id | uuid        | ✅   | 계약서 ID (contracts FK) |
| hidden_at   | timestamptz | ✅   | 숨긴 시각                |

#### 인덱스

```sql
CREATE INDEX idx_worker_hidden_contracts_worker_id ON worker_hidden_contracts(worker_id);
CREATE INDEX idx_worker_hidden_contracts_contract_id ON worker_hidden_contracts(contract_id);
```

### 12.2 RLS 정책

```sql
-- 조회: 본인만
CREATE POLICY "Workers can view own hidden contracts"
  ON worker_hidden_contracts FOR SELECT
  USING (auth.uid() = worker_id);

-- 추가: 본인만
CREATE POLICY "Workers can hide contracts"
  ON worker_hidden_contracts FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

-- 삭제: 본인만
CREATE POLICY "Workers can unhide contracts"
  ON worker_hidden_contracts FOR DELETE
  USING (auth.uid() = worker_id);
```

### 12.3 ERD 업데이트

```
┌─────────────────────────┐
│        profiles         │
│  (id, name, role, ...)  │
└─────────────────────────┘
            │
            │ 1:N
            ▼
┌───────────────────────────────┐
│   worker_hidden_contracts     │
│  (id, worker_id, contract_id, │
│   hidden_at)                  │
└───────────────────────────────┘
            │
            │ N:1
            ▼
┌─────────────────────────┐
│        contracts        │
│  (id, status, ...)      │
└─────────────────────────┘
```

---

> **Amendment 12 끝**

---

## 📝 Amendment 13: 공개 링크 접근 RLS 정책 (2026년 1월 25일)

> **버전**: 1.13  
> **변경 사유**: 비로그인 사용자의 공유 링크 접근 지원

### 13.1 문제점

기존 RLS 정책은 `authenticated` 사용자만 계약서를 조회할 수 있어서,
공유 링크로 접근한 비로그인 사용자가 404 에러를 받는 문제 발생.

### 13.2 추가된 RLS 정책

#### contracts 테이블

```sql
-- 공유 토큰으로 계약서 조회 (anon + authenticated)
CREATE POLICY "contracts_select_by_token" ON contracts
  FOR SELECT
  TO anon, authenticated
  USING (
    status IN ('pending', 'completed')
  );
```

#### profiles 테이블

```sql
-- 계약서 조회 시 사업자 정보 조회 (공유 링크용)
CREATE POLICY "profiles_select_for_contract" ON profiles
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.employer_id = id
      AND c.status IN ('pending', 'completed')
    )
  );
```

#### signatures 테이블

```sql
-- 공유 링크에서 서명 정보 조회
CREATE POLICY "signatures_select_by_token" ON signatures
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_id
      AND c.status IN ('pending', 'completed')
    )
  );

-- 근로자 서명 추가 (authenticated만)
CREATE POLICY "signatures_insert_by_token" ON signatures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_id
      AND c.status = 'pending'
    )
    AND auth.uid() = user_id
  );
```

### 13.3 보안 고려사항

| 항목        | 설명                                           |
| ----------- | ---------------------------------------------- |
| 토큰 복잡성 | UUID 형식으로 충분히 복잡 (무차별 대입 어려움) |
| 상태 제한   | `pending`, `completed` 상태만 공개             |
| 서명 권한   | INSERT는 authenticated 사용자만                |
| 수정 권한   | UPDATE는 기존 정책 유지                        |

---

> **Amendment 13 끝**

---

## 📝 Amendment 14: 민감정보 열람 로그 테이블 (2026년 1월 25일)

> **버전**: 1.14  
> **변경 사유**: 민감정보 열람 기록을 위한 감사 로그 테이블 추가

### 14.1 신규 테이블

#### sensitive_info_logs

| 컬럼명        | 타입        | 제약조건                                       | 설명           |
| ------------- | ----------- | ---------------------------------------------- | -------------- |
| `id`          | uuid        | PK, DEFAULT gen_random_uuid()                  | 로그 고유 ID   |
| `user_id`     | uuid        | NOT NULL, FK → profiles(id) ON DELETE CASCADE  | 열람한 사용자  |
| `contract_id` | uuid        | NOT NULL, FK → contracts(id) ON DELETE CASCADE | 열람한 계약서  |
| `info_type`   | text        | NOT NULL, CHECK IN ('ssn', 'account', 'both')  | 열람 정보 유형 |
| `accessed_at` | timestamptz | NOT NULL, DEFAULT now()                        | 열람 시간      |
| `ip_address`  | text        |                                                | 접속 IP 주소   |
| `user_agent`  | text        |                                                | 브라우저 정보  |

### 14.2 인덱스

```sql
CREATE INDEX idx_sensitive_info_logs_user_id ON sensitive_info_logs(user_id);
CREATE INDEX idx_sensitive_info_logs_contract_id ON sensitive_info_logs(contract_id);
CREATE INDEX idx_sensitive_info_logs_accessed_at ON sensitive_info_logs(accessed_at);
```

### 14.3 RLS 정책

```sql
-- 본인 로그만 조회 가능
CREATE POLICY "Users can view own logs" ON sensitive_info_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 인증된 사용자만 로그 생성 가능
CREATE POLICY "Authenticated users can insert logs" ON sensitive_info_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 14.4 ERD 추가

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            sensitive_info_logs                                │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ id (uuid, PK) | user_id (FK) | contract_id (FK) | info_type | ...      │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
         │                              │
         │                              │
         ▼                              ▼
    ┌─────────┐                  ┌─────────────┐
    │ profiles │                  │  contracts  │
    └─────────┘                  └─────────────┘
```

### 14.5 데이터 활용

| 용도      | 설명                                        |
| --------- | ------------------------------------------- |
| 보안 감사 | 누가, 언제, 어떤 민감정보를 열람했는지 추적 |
| 남용 방지 | 비정상적인 대량 열람 패턴 감지              |
| 법적 증거 | 개인정보 열람 기록으로 법적 분쟁 시 증거    |

---

> **Amendment 14 끝**

---

## 📝 Amendment 15: 사업장 테이블 추가 (2026년 1월 27일)

> **버전**: 1.15  
> **변경 사유**: 다중 사업장 관리 기능 지원
> **상태**: ✅ 완료

### 15.1 신규 테이블: workplaces

사업자가 여러 사업장(지점)을 관리할 수 있도록 사업장 테이블을 추가합니다.

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
```

#### 컬럼 설명

| 컬럼       | 타입        | 필수 | 설명                               |
| ---------- | ----------- | ---- | ---------------------------------- |
| id         | uuid        | ✅   | PK, 자동 생성                      |
| user_id    | uuid        | ✅   | 사업자 ID (profiles FK)            |
| name       | text        | ✅   | 사업장명 (예: "커피하우스 강남점") |
| address    | text        | ✅   | 사업장 주소                        |
| created_at | timestamptz | ✅   | 생성일시                           |
| updated_at | timestamptz | ✅   | 수정일시                           |

#### 제약조건

- `UNIQUE(user_id, name)`: 동일 사용자 내 사업장명 중복 방지

#### 인덱스

```sql
CREATE INDEX idx_workplaces_user_id ON workplaces(user_id);
```

### 15.2 RLS 정책

```sql
ALTER TABLE workplaces ENABLE ROW LEVEL SECURITY;

-- 본인 사업장만 조회
CREATE POLICY "Users can view own workplaces" ON workplaces
  FOR SELECT USING (auth.uid() = user_id);

-- 본인 사업장만 생성
CREATE POLICY "Users can create own workplaces" ON workplaces
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인 사업장만 수정
CREATE POLICY "Users can update own workplaces" ON workplaces
  FOR UPDATE USING (auth.uid() = user_id);

-- 본인 사업장만 삭제
CREATE POLICY "Users can delete own workplaces" ON workplaces
  FOR DELETE USING (auth.uid() = user_id);
```

### 15.3 contracts 테이블 변경

계약서 테이블에 사업장 관련 컬럼을 추가합니다.

#### 추가된 컬럼

| 컬럼           | 타입 | 필수 | 설명                        |
| -------------- | ---- | ---- | --------------------------- |
| workplace_id   | uuid | ❌   | 사업장 ID (workplaces FK)   |
| workplace_name | text | ❌   | 사업장명 (비정규화, 표시용) |

```sql
-- 사업장 ID 컬럼 추가
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS workplace_id uuid REFERENCES workplaces(id) ON DELETE SET NULL;

-- 사업장명 컬럼 추가 (비정규화)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS workplace_name text;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_contracts_workplace_id ON contracts(workplace_id);
```

### 15.4 ERD 업데이트

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  profiles                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ id (uuid, PK, FK) | role | name | phone | avatar_url | ...           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
           │                      │                              │
           │ 1:N (employer)       │ 1:N (workplaces)            │ 1:N (worker)
           ▼                      ▼                              ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────────┐
│    workplaces       │  │                     │  │                             │
│  ┌───────────────┐  │  │                     │  │                             │
│  │id|user_id     │  │  │                     │  │                             │
│  │name|address   │  │  │                     │  │                             │
│  └───────────────┘  │  │                     │  │                             │
└─────────────────────┘  │                     │  │                             │
           │             │                     │  │                             │
           │ 1:N         │                     │  │                             │
           ▼             ▼                     ▼  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  contracts                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ id | employer_id (FK) | worker_id (FK) | workplace_id (FK) | ...     │   │
│  │ workplace_name | status | folder_id | ...                             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 15.5 데이터 활용

| 용도               | 설명                                         |
| ------------------ | -------------------------------------------- |
| 사업장 재사용      | 한 번 등록한 사업장을 다른 계약서에서 재사용 |
| 사업장별 필터링    | 추후 사업장별 계약서 필터링 기능 지원        |
| 근무장소 자동 입력 | 사업장 선택 시 주소 자동 입력                |

---

> **Amendment 15 끝**

---

## Amendment 16: 법적 필수 항목 - DB 변경 없음 (2026년 1월 27일)

### 16.1 개요

근로기준법 제17조 필수 명시 항목(휴일, 연차휴가, 가산수당)을 계약서에 추가하였으나, **DB 스키마 변경은 불필요**합니다.

### 16.2 계산 기반 항목 (DB 저장 안 함)

| 항목         | 계산 방식                                             | 저장 여부 |
| ------------ | ----------------------------------------------------- | --------- |
| **휴일**     | `work_days` 또는 `work_days_per_week`에서 런타임 계산 | ❌        |
| **연차휴가** | `business_size === 'over_5'` 조건부 텍스트 표시       | ❌        |
| **가산수당** | `business_size === 'over_5'` 조건부 텍스트 표시       | ❌        |

### 16.3 기존 컬럼 활용

```sql
-- contracts 테이블의 기존 컬럼
work_days           -- ARRAY: ['월','화','수','목','금']
work_days_per_week  -- INTEGER: 5
business_size       -- ENUM: 'under_5' | 'over_5'
```

### 16.4 휴일 계산 로직 (프론트엔드)

```typescript
const formatHolidays = () => {
  const allDays = ['월', '화', '수', '목', '금', '토', '일'];

  if (workDays && workDays.length > 0) {
    // 특정 요일 선택 시: 선택 안 한 요일이 휴일
    const holidays = allDays.filter((day) => !workDays.includes(day));
    return holidays.join(', '); // "토, 일"
  }

  if (workDaysPerWeek) {
    // 주 N일 선택 시: 7 - N일이 휴일
    return `주 ${7 - workDaysPerWeek}일`; // "주 2일"
  }

  return '-';
};
```

### 16.5 왜 DB에 저장하지 않나?

1. **계산 가능**: 기존 데이터로 언제든 계산 가능
2. **데이터 일관성**: 근무일 변경 시 휴일도 자동 변경
3. **스키마 단순화**: 불필요한 컬럼 추가 방지

---

> **Amendment 16 끝**

---

## 📝 Amendment 17: 사업장 수정/삭제 기능 - 스키마 변경 없음 (2026년 1월 28일)

> **버전**: 1.18  
> **변경 사유**: 사업장 관리 기능 강화

### 17.1 개요

사업장 수정/삭제 기능이 추가되었으나, **DB 스키마 변경은 불필요**합니다.

| 변경 사항            | 스키마 영향                             |
| -------------------- | --------------------------------------- |
| 사업장 수정 UI       | ❌ 없음 (기존 workplaces 테이블 UPDATE) |
| 사업장 삭제 UI       | ❌ 없음 (기존 workplaces 테이블 DELETE) |
| 삭제 확인 다이얼로그 | ❌ 없음 (UI 전용)                       |

### 17.2 사용되는 쿼리

#### 사업장 수정

```sql
UPDATE workplaces
SET name = $1, address = $2, updated_at = now()
WHERE id = $3 AND user_id = $4
RETURNING id, name, address;
```

#### 사업장 삭제

```sql
DELETE FROM workplaces
WHERE id = $1 AND user_id = $2;
```

### 17.3 RLS 정책 (기존 정책 활용)

| 정책명                            | 작업   | 조건                   |
| --------------------------------- | ------ | ---------------------- |
| `Users can update own workplaces` | UPDATE | `auth.uid() = user_id` |
| `Users can delete own workplaces` | DELETE | `auth.uid() = user_id` |

---

> **Amendment 17 끝**

---

## 📝 Amendment 18: AI 노무사 무료화 (2026년 1월 28일)

> **버전**: 1.19  
> **변경 사유**: AI 노무사 검토 기능 무료화

### 18.1 개요

AI 노무사 검토 기능이 무료로 전환되었습니다. 이에 따라 `ai_review` 크레딧 관련 로직이 제거되었습니다.

### 18.2 스키마 변경 없음

데이터베이스 스키마는 변경되지 않습니다. 기존 `credits` 테이블과 `credit_transactions` 테이블은 유지되며, `credit_type` enum의 `ai_review` 값도 유지됩니다 (하위 호환성).

### 18.3 변경된 로직

| 항목                       | 기존                              | 변경          |
| -------------------------- | --------------------------------- | ------------- |
| AI 검토 시 크레딧 차감     | `use_credit('ai_review', 1)` 호출 | **호출 제거** |
| 신규 사용자 AI 크레딧 지급 | 5개 지급                          | 유지 (미사용) |
| AI 크레딧 잔여량 표시      | 대시보드/결제 페이지에 표시       | **표시 제거** |

### 18.4 `use_credit` 함수 동작

`use_credit` 함수는 그대로 유지되나, AI 검토 시에는 호출되지 않습니다. 계약서 작성 시에만 계속 사용됩니다.

---

> **Amendment 18 끝**

---

## 📝 Amendment 19: 업종 타입 확장 (2026년 1월 28일)

> **버전**: 1.20  
> **변경 사유**: PC방 및 스타트업 업종 추가

### 19.1 개요

계약서 작성 시 선택할 수 있는 업종 목록에 "PC방"과 "스타트업"이 추가되었습니다.

### 19.2 스키마 변경 없음

`contracts` 테이블의 `business_type` 컬럼은 TEXT 타입으로, enum이 아니므로 스키마 변경 없이 새 값을 저장할 수 있습니다.

### 19.3 허용되는 business_type 값

| 값                  | 라벨          | 아이콘 |
| ------------------- | ------------- | ------ |
| `restaurant`        | 식당          | 🍽️     |
| `cafe`              | 카페          | ☕     |
| `convenience_store` | 편의점        | 🏪     |
| `retail`            | 소매점        | 🛍️     |
| `beauty`            | 미용실/네일샵 | 💇     |
| `office`            | 사무직        | 💼     |
| `pc_cafe`           | PC방          | 🖥️     |
| `startup`           | 스타트업      | 🚀     |

### 19.4 TypeScript 타입 정의

```typescript
// stores/contractFormStore.ts
export type BusinessType =
  | 'restaurant'
  | 'cafe'
  | 'convenience_store'
  | 'retail'
  | 'beauty'
  | 'office'
  | 'pc_cafe' // 신규
  | 'startup' // 신규
  | null;
```

### 19.5 Validation 스키마

```typescript
// lib/utils/validation.ts
export const businessTypeSchema = z
  .enum([
    'restaurant',
    'cafe',
    'convenience_store',
    'retail',
    'beauty',
    'office',
    'pc_cafe', // 신규
    'startup', // 신규
  ])
  .nullable();
```

---

> **Amendment 19 끝**

---

## 📝 Amendment 20: 계약 형태 필드 추가 (2026년 1월 31일)

> **버전**: 1.21  
> **변경 사유**: 정규직(4대보험)/계약직(3.3% 원천징수) 계약 형태 선택 기능 추가

### 20.1 Enum 타입 추가

| Value      | Description            |
| ---------- | ---------------------- |
| `regular`  | 정규직 (4대보험 가입)  |
| `contract` | 계약직 (3.3% 원천징수) |

```sql
-- 별도 enum 생성 없이 text + CHECK 제약조건 사용
```

### 20.2 스키마 변경 사항

#### contracts 테이블에 contract_type 컬럼 추가

| Column          | Type   | Nullable | Default      | Description               |
| --------------- | ------ | -------- | ------------ | ------------------------- |
| `contract_type` | `text` | NO       | `'contract'` | 계약 형태 (정규직/계약직) |

**마이그레이션 SQL:**

```sql
-- 계약 형태 컬럼 추가
ALTER TABLE contracts ADD COLUMN contract_type text NOT NULL DEFAULT 'contract';

-- 제약 조건 추가
ALTER TABLE contracts ADD CONSTRAINT check_contract_type
  CHECK (contract_type IN ('regular', 'contract'));

-- 컬럼 설명 추가
COMMENT ON COLUMN contracts.contract_type IS '계약 형태: regular(정규직, 4대보험), contract(계약직, 3.3% 원천징수)';
```

### 20.3 TypeScript 타입 정의

```typescript
// stores/contractFormStore.ts
export type ContractType = 'regular' | 'contract';

// lib/utils/validation.ts
export const contractTypeSchema = z.enum(['regular', 'contract']);
```

### 20.4 UI 라벨

| 값         | 라벨             | 설명                                        |
| ---------- | ---------------- | ------------------------------------------- |
| `regular`  | 정규직 (4대보험) | 국민연금, 건강보험, 고용보험, 산재보험 가입 |
| `contract` | 계약직 (3.3%)    | 사업소득으로 3.3% 원천징수 후 지급          |

### 20.5 영향받는 화면

| 화면                 | 변경 내용              |
| -------------------- | ---------------------- |
| 계약서 작성 Step 2   | 계약 형태 선택 UI 추가 |
| 계약서 미리보기      | 계약 형태 표시         |
| 계약서 상세 (사업자) | 계약 형태 표시         |
| 계약서 상세 (근로자) | 계약 형태 표시         |
| 근로자 서명 페이지   | 계약 형태 표시         |
| PDF 계약서           | 계약 형태 포함         |

---

> **Amendment 20 끝**

---

## 📝 Amendment 21: 퇴사일 필드 및 RLS 정책 수정 (2026년 1월 31일)

> **버전**: 1.22  
> **변경 사유**: 근로자 퇴사일 입력 기능 지원

### 21.1 contracts 테이블 - resignation_date 컬럼

#### 컬럼 정의

| Column             | Type   | Nullable | Default | Description               |
| ------------------ | ------ | -------- | ------- | ------------------------- |
| `resignation_date` | `date` | YES      | `NULL`  | 실제 퇴사일 (근로자 입력) |

이미 Amendment 20 이전에 추가되었으나, 명세 문서화를 위해 기록합니다.

```sql
-- 이미 적용됨
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS resignation_date date;

COMMENT ON COLUMN contracts.resignation_date IS '실제 퇴사일 (근로자 입력)';
```

### 21.2 데이터 우선순위 로직

근무 종료일을 결정할 때 다음 우선순위 적용:

| 우선순위 | 필드               | 조건                  | 결과                       |
| -------- | ------------------ | --------------------- | -------------------------- |
| 1순위    | `resignation_date` | NOT NULL              | 퇴사일 사용                |
| 2순위    | `end_date`         | NOT NULL AND < TODAY  | 종료일 사용                |
| 3순위    | `end_date`         | NOT NULL AND >= TODAY | 현재 진행 중               |
| 4순위    | NULL               | 둘 다 NULL            | 무기한 계약 (현재 진행 중) |

### 21.3 RLS 정책 수정

#### contracts_update_employer 정책 수정

**기존 정책 (문제):**

```sql
-- 기존: draft, pending 상태만 UPDATE 가능
CREATE POLICY contracts_update_employer ON contracts
  FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid()) = employer_id
    AND status IN ('draft', 'pending')
  );
```

**변경된 정책:**

```sql
-- 변경: 모든 상태에서 UPDATE 가능 (삭제, 복구 등 지원)
DROP POLICY IF EXISTS contracts_update_employer ON contracts;

CREATE POLICY contracts_update_employer ON contracts
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = employer_id)
  WITH CHECK ((SELECT auth.uid()) = employer_id);
```

#### 변경 이유

- Soft delete (status = 'deleted') 기능을 위해 completed, expired 상태도 UPDATE 필요
- 사업자가 모든 상태의 계약서를 관리할 수 있도록 허용

### 21.4 근로자 퇴사일 업데이트 권한

근로자가 자신의 계약서에 `resignation_date`를 업데이트할 수 있도록 기존 정책 활용:

```sql
-- 근로자가 자신의 계약서 resignation_date 업데이트
-- contracts_update_by_token 정책 활용 (Amendment 13에서 추가됨)
```

### 21.5 TypeScript 타입

```typescript
// types/database.ts - contracts 테이블
export interface ContractsRow {
  // ... 기존 필드들 ...
  resignation_date: string | null; // 실제 퇴사일 (근로자 입력)
}

export interface ContractsInsert {
  // ... 기존 필드들 ...
  resignation_date?: string | null;
}

export interface ContractsUpdate {
  // ... 기존 필드들 ...
  resignation_date?: string | null;
}
```

---

> **Amendment 21 끝**

---

## 📝 Amendment 22: 서명 증적 정보 저장 구현 확인 (2026년 1월 31일)

> **버전**: 1.23  
> **변경 사유**: signatures 테이블의 ip_address, user_agent 컬럼 활용 확인

### 22.1 개요

`signatures` 테이블에는 이미 `ip_address`와 `user_agent` 컬럼이 정의되어 있었으나, 실제 코드에서 저장하지 않고 있었습니다. 이번 수정으로 모든 서명 시 해당 정보가 저장됩니다.

### 22.2 기존 스키마 (변경 없음)

```sql
-- signatures 테이블 (이미 정의됨)
CREATE TABLE public.signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  signer_role signer_role NOT NULL,
  signature_data text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,      -- 이미 정의됨
  user_agent text,      -- 이미 정의됨
  UNIQUE(contract_id, signer_role)
);
```

### 22.3 코드 수정 내용

| 파일                                               | 변경 내용           |
| -------------------------------------------------- | ------------------- |
| `app/(protected)/employer/preview/[id]/actions.ts` | IP, User-Agent 저장 |
| `app/(protected)/employer/create/actions.ts`       | IP, User-Agent 저장 |
| `app/(protected)/worker/contract/[id]/actions.ts`  | IP, User-Agent 저장 |
| `app/contract/sign/[token]/actions.ts`             | IP, User-Agent 저장 |

### 22.4 저장 로직

```typescript
import { headers } from 'next/headers';

// 서명 시점 증적을 위한 IP, User-Agent 수집
const headersList = await headers();
const ipAddress =
  headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  headersList.get('x-real-ip') ||
  null;
const userAgent = headersList.get('user-agent') || null;

// 서명 저장
await supabase.from('signatures').insert({
  contract_id: contractId,
  user_id: user.id,
  signer_role: 'employer',
  signature_data: signatureImageData,
  signed_at: new Date().toISOString(),
  ip_address: ipAddress,
  user_agent: userAgent,
});
```

### 22.5 법적 효력

| 항목         | 설명                    |
| ------------ | ----------------------- |
| `signed_at`  | 서명 시점 (언제)        |
| `ip_address` | 서명 위치 (어디서)      |
| `user_agent` | 서명 기기 (어떤 기기로) |

법적 분쟁 시 서명의 진위를 증명할 수 있는 증거 자료로 활용됩니다.

---

> **Amendment 22 끝**

---

## 📝 Amendment 23: SSN 해시 솔트 환경 변수 필수화 (2026년 2월 3일)

> **버전**: 1.24  
> **변경 사유**: 보안 강화 - 주민번호 해시 솔트 하드코딩 제거

### 23.1 개요

주민번호 해시 솔트가 코드에 하드코딩되어 있던 보안 취약점을 수정했습니다.
프로덕션 환경에서는 환경 변수 설정이 필수이며, 미설정 시 서비스가 시작되지 않습니다.

### 23.2 환경 변수 요구사항

| 환경 변수        | 용도                               | 필수 여부     |
| ---------------- | ---------------------------------- | ------------- |
| `SSN_HASH_SALT`  | 주민번호 해시용 솔트               | 프로덕션 필수 |
| `ENCRYPTION_KEY` | 민감정보(주민번호, 계좌) 암호화 키 | 필수          |

### 23.3 동작 방식

| 환경                  | `SSN_HASH_SALT` 미설정 시       |
| --------------------- | ------------------------------- |
| 개발 (development)    | ⚠️ 콘솔 경고 + 기본값 사용      |
| 프로덕션 (production) | ❌ 에러 발생 (서비스 시작 차단) |

### 23.4 코드 변경

```typescript
// lib/utils/encryption.ts

function getSsnHashSalt(): string {
  const salt = process.env.SSN_HASH_SALT;

  if (!salt) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SSN_HASH_SALT 환경 변수가 설정되지 않았습니다.');
    }
    console.warn('⚠️ [DEV] SSN_HASH_SALT 미설정. 기본값 사용 중.');
    return 'dev-only-salt-do-not-use-in-production';
  }

  return salt;
}

export function hashSSN(ssn: string): string {
  const salt = getSsnHashSalt();
  const partialSSN = ssn.substring(0, 7);
  return crypto.createHmac('sha256', salt).update(partialSSN).digest('hex');
}
```

### 23.5 키 생성 방법

```bash
# SSN_HASH_SALT 생성
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# ENCRYPTION_KEY 생성
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 23.6 주의사항

- ⚠️ 프로덕션에서 `SSN_HASH_SALT`를 변경하면 기존 해시값과 일치하지 않게 됩니다
- ⚠️ 프로덕션에서 `ENCRYPTION_KEY`를 변경하면 기존 암호화 데이터를 복호화할 수 없습니다
- 운영 중 키 변경이 필요한 경우 마이그레이션 계획을 수립해야 합니다

---

> **Amendment 23 끝**
