# 관리자 페이지 향후 로드맵

> **작성일**: 2026년 2월 9일
> **범위**: 외부 서비스 연동 및 추가 비용이 필요한 기능

---

## 목차

1. [무료 외부 서비스 연동](#1-무료-외부-서비스-연동)
2. [유료 서비스 연동](#2-유료-서비스-연동)
3. [AI CS 자동화 시스템](#3-ai-cs-자동화-시스템)
4. [Growth 자동화 시스템](#4-growth-자동화-시스템)
5. [예상 월 운영 비용](#5-예상-월-운영-비용)

---

## 1. 무료 외부 서비스 연동

### 1.1 Sentry 에러 모니터링

**비용**: $0 (Developer 플랜)

**목적**:
- 앱 전체 에러 모니터링
- CS 문의와 에러 로그 연결
- 버그 리포트 자동 분석

**구현 작업**:

```bash
# 1. 패키지 설치
npm install @sentry/nextjs

# 2. Sentry 위자드 실행
npx @sentry/wizard@latest -i nextjs
```

**설정 후 추가 작업**:

```typescript
// app/(public)/auth/callback/route.ts 수정
import * as Sentry from '@sentry/nextjs';

// 로그인 성공 후
Sentry.setUser({ id: user.id, email: user.email });

// 로그아웃 시
Sentry.setUser(null);
```

**환경 변수**:
```bash
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

**예상 작업 시간**: 2시간

---

### 1.2 Resend 이메일 알림

**비용**: $0 (월 3,000건 무료)

**목적**:
- 새 문의 접수 시 관리자 알림
- 답변 등록 시 고객 알림
- 중요 이벤트 알림

**구현 작업**:

```bash
npm install resend
```

```typescript
// lib/email/resend.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAdminNotification(subject: string, content: string) {
  await resend.emails.send({
    from: 'SignPlease <noreply@signplease.kr>',
    to: process.env.ADMIN_EMAIL!,
    subject,
    html: content,
  });
}

export async function sendCustomerReply(
  to: string,
  customerName: string,
  inquiryTitle: string
) {
  await resend.emails.send({
    from: 'SignPlease <support@signplease.kr>',
    to,
    subject: `[싸인해주세요] "${inquiryTitle}" 문의에 답변이 등록되었습니다`,
    html: `
      <p>${customerName}님, 안녕하세요.</p>
      <p>문의하신 "${inquiryTitle}"에 대한 답변이 등록되었습니다.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/support/inquiry">답변 확인하기</a></p>
    `,
  });
}
```

**환경 변수**:
```bash
RESEND_API_KEY=
ADMIN_EMAIL=
```

**예상 작업 시간**: 1.5시간

---

## 2. 유료 서비스 연동

### 2.1 OpenAI GPT-4o

**비용**: ~$10/월 (예상)

**목적**:
- CS 문의 자동 분석
- 답변 초안 생성
- 코드 기반 원인 분석

**사용량 예측** (월 100건 문의 기준):
| 항목 | 토큰 수 | 비용 |
|------|--------|------|
| 입력 (코드+문의) | ~100K × 100건 | ~$2.50 |
| 출력 (답변) | ~1K × 100건 | ~$0.30 |
| **총합** | | **~$3/월** |

**환경 변수**:
```bash
OPENAI_API_KEY=  # 이미 있음
```

---

### 2.2 솔라피 알림톡 (Growth)

**비용**: ~₩3,000/월 (예상)

**목적**:
- 크레딧 소진 알림
- 이탈 방지 알림
- 마케팅 메시지

**템플릿 등록 필요** (카카오 승인 3-5일):

| 템플릿 | 용도 | 변수 |
|--------|------|------|
| CREDIT_LOW | 크레딧 1개 남음 | #{이름}, #{남은개수} |
| RETENTION_3D | 가입 3일 후 미사용 | #{이름} |

**환경 변수**:
```bash
# 이미 있는 것
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_KAKAO_PF_ID=

# 추가 필요
SOLAPI_TEMPLATE_CREDIT_LOW=
SOLAPI_TEMPLATE_RETENTION_3D=
```

---

## 3. AI CS 자동화 시스템

### 3.1 시스템 구조

```
문의 접수
    │
    ▼
┌─────────────────────────────────────────┐
│ AI 분석 파이프라인                        │
│                                         │
│  1. 사용자 컨텍스트 수집                  │
│     - 크레딧 잔액                        │
│     - 최근 결제 내역                     │
│     - 최근 계약서                        │
│                                         │
│  2. Sentry 에러 조회 (버그 문의 시)       │
│     - 최근 24시간 에러                   │
│     - 사용자 관련 에러                   │
│                                         │
│  3. GitHub 코드 조회                     │
│     - 관련 파일 검색                     │
│     - 매뉴얼 참조                        │
│                                         │
│  4. OpenAI 분석                         │
│     - 원인 분석                          │
│     - 답변 초안 생성                     │
│     - 액션 제안 (크레딧 지급 등)          │
└─────────────────────────────────────────┘
    │
    ▼
관리자 검토 → 승인 → 자동 실행
```

### 3.2 구현 파일 구조

```
lib/
└── cs/
    ├── ai.ts              # OpenAI 분석
    ├── github.ts          # GitHub 코드 조회
    ├── sentry.ts          # Sentry 에러 조회
    ├── context.ts         # 사용자 컨텍스트 수집
    └── notifications.ts   # 이메일/알림 발송

docs/
└── manuals/               # CS 매뉴얼 (AI 참조용)
    ├── faq.md
    ├── payment-errors.md
    ├── refund-policy.md
    └── usage-guide.md
```

### 3.3 AI 프롬프트 설계

**시스템 프롬프트**:
```
당신은 "싸인해주세요" 앱의 고객 지원 AI입니다.

## 역할
1. 고객 문의를 분석하여 정확한 답변 초안을 작성합니다.
2. 개발자에게 문제의 원인과 해결 방법을 제시합니다.
3. 필요한 경우 크레딧 지급 등의 액션을 제안합니다.

## 답변 톤
- 전문적이고 포멀한 톤
- 존댓말 사용
- 불필요한 이모지 사용 금지

## 크레딧 지급 기준
- 결제 완료 + 크레딧 미지급 확인: 크레딧 지급 제안
- 앱 오류로 인한 불편: 보상 크레딧 1개 제안
- 사용자 실수: 지급하지 않음

## 환불 기준
- 미사용 크레딧: 환불 가능 안내
- 사용한 크레딧: 환불 불가 안내 (10% 수수료 안내)
```

**AI 출력 구조**:
```typescript
interface AIOutput {
  customerResponse: string;      // 고객 답변 초안
  
  developerNote: {
    summary: string;             // 요약
    rootCause: string;           // 원인 분석
    codeReference?: string;      // 관련 코드 위치
    solution: string;            // 해결 방법
  };
  
  suggestedActions: {
    type: 'add_credit' | 'refund' | 'none';
    amount?: number;
    reason: string;
  }[];
}
```

### 3.4 구현 순서

| 순서 | 작업 | 예상 시간 |
|------|------|----------|
| 1 | CS 매뉴얼 작성 (docs/manuals/) | 2시간 |
| 2 | GitHub 코드 조회 함수 | 2시간 |
| 3 | 사용자 컨텍스트 수집 함수 | 1시간 |
| 4 | Sentry 에러 조회 함수 | 1.5시간 |
| 5 | OpenAI 분석 함수 + 프롬프트 | 3시간 |
| 6 | 관리자 문의 상세에 AI 결과 표시 | 2시간 |
| 7 | 액션 승인 기능 (자동 크레딧 지급) | 1.5시간 |
| 8 | 테스트 및 프롬프트 튜닝 | 2시간 |

**총 예상 시간**: 15시간

---

## 4. Growth 자동화 시스템

### 4.1 시스템 구조

```
┌─────────────────────────────────────────┐
│ Growth 자동화                            │
├─────────────────────────────────────────┤
│                                         │
│  실시간 트리거 (크레딧 사용 후)            │
│  ┌───────────────────────────────────┐  │
│  │ 크레딧 1개 남음                     │  │
│  │ → 인앱 알림 + 알림톡                │  │
│  └───────────────────────────────────┘  │
│                                         │
│  배치 트리거 (Vercel Cron, 매일 10시)    │
│  ┌───────────────────────────────────┐  │
│  │ 가입 3일 후 계약서 0건              │  │
│  │ → 인앱 알림 + 알림톡                │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### 4.2 테이블 구조

```sql
-- Growth 알림 발송 로그
CREATE TABLE public.growth_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,        -- 'credit_low' | 'retention_3d'
  channel text NOT NULL,     -- 'push' | 'alimtalk' | 'in_app'
  status text NOT NULL,      -- 'sent' | 'failed' | 'skipped'
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_growth_logs_user_type ON growth_logs(user_id, type);
CREATE INDEX idx_growth_logs_sent_at ON growth_logs(sent_at DESC);
```

### 4.3 크레딧 소진 알림 (실시간)

**트리거 위치**: 크레딧 사용 직후

```typescript
// app/(protected)/employer/create/actions.ts 수정
import { after } from 'next/server';

export async function createContract(...) {
  // ... 계약서 생성 로직 ...
  
  // 비동기로 알림 체크
  after(async () => {
    await checkAndSendCreditLowAlert(user.id);
  });
}
```

**알림 조건**:
- 크레딧 잔액이 정확히 1개일 때
- 최근 24시간 내 동일 알림 미발송

### 4.4 이탈 방지 알림 (배치)

**Vercel Cron 설정**:
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

**대상 조건**:
- 가입 3일 경과
- 계약서 작성 0건
- 알림 미발송

### 4.5 관리자 Growth 설정 페이지

**경로**: `/admin/growth`

**기능**:
- 각 알림 활성화/비활성화
- 발송 로그 조회
- 통계 (발송 수, 성공률)

### 4.6 구현 순서

| 순서 | 작업 | 예상 시간 |
|------|------|----------|
| 1 | growth_logs 테이블 생성 | 10분 |
| 2 | 솔라피 템플릿 등록 신청 | 30분 |
| 3 | 알림 발송 함수 구현 | 2시간 |
| 4 | 크레딧 소진 알림 연동 | 1.5시간 |
| 5 | Vercel Cron 설정 | 30분 |
| 6 | 이탈 방지 알림 구현 | 2시간 |
| 7 | 관리자 Growth 설정 페이지 | 2시간 |
| 8 | 테스트 | 1시간 |

**총 예상 시간**: 9.5시간 + 카카오 승인 대기 (3-5일)

---

## 5. 예상 월 운영 비용

### 5.1 현재 비용 (관리자 페이지 추가 전)

| 서비스 | 용도 | 비용 |
|--------|------|------|
| Vercel | 호스팅 | $0 |
| Supabase | DB + Auth | $0 |
| 솔라피 | 계약서 알림톡 | ~₩5,000/월 |
| **합계** | | **~₩5,000/월** |

### 5.2 Phase 1 완료 후 (CS 자동화)

| 서비스 | 용도 | 추가 비용 |
|--------|------|----------|
| Sentry | 에러 모니터링 | $0 |
| Resend | 이메일 알림 | $0 |
| OpenAI | AI 분석 | ~$10/월 |
| **추가 합계** | | **~₩13,000/월** |

### 5.3 Phase 2 완료 후 (Growth 자동화)

| 서비스 | 용도 | 추가 비용 |
|--------|------|----------|
| 솔라피 | Growth 알림톡 | ~₩3,000/월 |
| **추가 합계** | | **~₩3,000/월** |

### 5.4 전체 예상 비용

| 단계 | 월 비용 |
|------|--------|
| 현재 | ~₩5,000 |
| Phase 1 후 | ~₩18,000 |
| Phase 2 후 | ~₩21,000 |

---

## 환경 변수 총정리

### 현재 있는 것 (기존)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# 토스페이먼츠
TOSS_SECRET_KEY=

# 솔라피
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_KAKAO_PF_ID=

# OpenAI
OPENAI_API_KEY=

# 관리자 (추가됨)
ADMIN_PASSWORD=
ADMIN_JWT_SECRET=
```

### 추후 추가 필요
```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=

# Resend
RESEND_API_KEY=
ADMIN_EMAIL=

# GitHub (코드 조회)
GITHUB_TOKEN=
GITHUB_REPO_OWNER=
GITHUB_REPO_NAME=

# 솔라피 Growth 템플릿
SOLAPI_TEMPLATE_CREDIT_LOW=
SOLAPI_TEMPLATE_RETENTION_3D=

# Vercel Cron
CRON_SECRET=
```

---

## 구현 우선순위 요약

```
현재 완료
├── 관리자 인증 (로그인/로그아웃)
├── 환불 요청 관리
├── 사용자 관리 (기본)
└── 기본 대시보드

1단계: 즉시 구현 (비용 0원)
├── DB 스키마 보완
├── 사용자 관리 완성 (삭제, 차단 체크)
├── 결제 내역 페이지
├── 프로모션 코드 시스템
├── 공지/팝업 시스템
├── 1:1 문의 시스템 (수동)
└── KPI 대시보드 강화

2단계: 무료 외부 서비스
├── Sentry 연동
└── Resend 이메일 알림

3단계: AI CS 자동화 (~₩13,000/월)
├── GitHub 코드 조회
├── 사용자 컨텍스트 수집
├── Sentry 에러 연동
└── OpenAI AI 분석

4단계: Growth 자동화 (~₩3,000/월)
├── 크레딧 소진 알림
├── 이탈 방지 알림
└── Growth 설정 페이지
```

---

*작성일: 2026년 2월 9일*
