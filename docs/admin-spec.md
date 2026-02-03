# 📋 관리자 페이지 기획서

## 싸인해주세요 (SignPlease) Admin

> **버전**: 1.0  
> **작성일**: 2026년 2월 2일  
> **상태**: 기획 완료, 개발 대기

---

## 1. 개요

### 1.1 목적

SignPlease 서비스의 운영/관리를 위한 관리자 전용 페이지입니다.

### 1.2 접근 방식

- **경로**: `signplease.kr/admin`
- **접근 권한**: `profiles.is_admin = true`인 계정만 접근 가능
- **인증**: 기존 카카오 로그인 사용 (개발 시 인증 방식 최종 결정)

### 1.3 운영 규모

- 1인 운영 (본인만 사용)
- 추후 확장 가능하도록 권한 시스템 설계

---

## 2. 기능 요구사항

### 2.1 대시보드 (통계)

| 기능                | 설명                                                | 우선순위 |
| ------------------- | --------------------------------------------------- | -------- |
| 핵심 지표 카드      | 총 사용자, 총 계약서, 오늘 가입자, 오늘 계약서      | 🔴 필수  |
| 주간/월간 추이 차트 | 가입자 추이, 계약서 생성 추이 (Line Chart)          | 🔴 필수  |
| 상태별 계약서 분포  | draft, pending, completed, expired 비율 (Pie/Donut) | 🔴 필수  |
| 매출 통계           | 일별/주별/월별 결제 금액, 누적 매출                 | 🟡 중요  |
| 코호트 분석         | 가입 월별 리텐션, 전환율                            | 🟢 선택  |

### 2.2 사용자 관리

| 기능             | 설명                                         | 우선순위 |
| ---------------- | -------------------------------------------- | -------- |
| 사용자 목록 조회 | 페이지네이션, 검색, 필터                     | 🔴 필수  |
| 사용자 상세 정보 | 프로필, 가입일, 역할, 계약서 수, 크레딧 잔액 | 🔴 필수  |
| 역할 변경        | employer ↔ worker 전환                       | 🔴 필수  |
| 정보 수정        | 이름, 전화번호 등                            | 🟡 중요  |
| 계정 차단/해제   | is_blocked 플래그로 로그인 차단              | 🟡 중요  |
| 계정 삭제        | 소프트 삭제 (익명화)                         | 🟡 중요  |
| 관리자 권한 부여 | is_admin 플래그 설정                         | 🟢 선택  |

### 2.3 계약서 관리

| 기능             | 설명                                   | 우선순위 |
| ---------------- | -------------------------------------- | -------- |
| 계약서 목록 조회 | 상태별, 날짜별, 사용자별 필터          | 🔴 필수  |
| 계약서 상세 보기 | 모든 필드 조회, 서명 정보              | 🔴 필수  |
| 상태 변경        | expired → pending 복구, 강제 완료 처리 | 🔴 필수  |
| PDF 다운로드     | 관리자 권한으로 PDF 생성/다운로드      | 🟡 중요  |
| 계약서 삭제      | 소프트 삭제 (status = 'deleted')       | 🟡 중요  |
| 계약서 수정      | 내용 직접 수정 (예외 상황용)           | 🟢 선택  |

### 2.4 결제/크레딧 관리

| 기능             | 설명                                    | 우선순위 |
| ---------------- | --------------------------------------- | -------- |
| 결제 내역 조회   | 전체 결제 목록, 상태별 필터             | 🔴 필수  |
| 결제 상세 정보   | 결제 금액, 상품, 크레딧, 영수증 URL     | 🔴 필수  |
| 수동 크레딧 지급 | 특정 사용자에게 크레딧 추가 (사유 기록) | 🔴 필수  |
| 수동 크레딧 차감 | 오지급 크레딧 회수 (사유 기록)          | 🟡 중요  |
| 환불 처리        | 결제 취소 + 크레딧 회수                 | 🟡 중요  |
| 거래 취소        | credit_transactions 롤백                | 🟢 선택  |

### 2.5 알림 관리

| 기능               | 설명                             | 우선순위 |
| ------------------ | -------------------------------- | -------- |
| 인앱 알림 발송     | 특정 사용자/전체 사용자에게 알림 | 🟡 중요  |
| 카카오 알림톡 발송 | 템플릿 기반 알림톡 발송          | 🟢 선택  |
| 발송 내역 조회     | 발송된 알림/알림톡 이력          | 🟢 선택  |

### 2.6 시스템 설정

| 기능             | 설명                        | 우선순위 |
| ---------------- | --------------------------- | -------- |
| 최저시급 설정    | 연도별 최저시급 값 조정     | 🟡 중요  |
| 서명 만료일 설정 | 기본 7일 → 조정 가능        | 🟢 선택  |
| 무료 크레딧 설정 | 신규 가입 시 지급 크레딧 수 | 🟢 선택  |
| 공지사항 관리    | 앱 내 공지사항 CRUD         | 🟢 선택  |

### 2.7 데이터 관리

| 기능            | 설명                                      | 우선순위 |
| --------------- | ----------------------------------------- | -------- |
| 데이터 내보내기 | CSV/Excel 다운로드 (사용자, 계약서, 결제) | 🟡 중요  |
| 데이터 백업     | DB 스냅샷 다운로드 (JSON)                 | 🟢 선택  |

### 2.8 감사 로그

| 기능               | 설명                           | 우선순위 |
| ------------------ | ------------------------------ | -------- |
| 관리자 활동 기록   | 누가, 언제, 어떤 작업을 했는지 | 🔴 필수  |
| 변경 전/후 값 기록 | 수정 작업 시 이전 값 보존      | 🟡 중요  |
| IP/User-Agent 기록 | 접속 정보 기록                 | 🟡 중요  |
| 로그 검색/필터     | 작업 유형, 날짜, 대상별 필터   | 🟡 중요  |

---

## 3. 검색/필터 요구사항

### 3.1 공통 검색 기능

- 텍스트 검색 (이름, 전화번호, 이메일 등)
- 날짜 범위 필터 (시작일 ~ 종료일)
- 상태별 필터 (드롭다운/체크박스)
- 정렬 (생성일, 수정일, 이름 등)

### 3.2 내보내기 기능

- CSV 다운로드
- Excel 다운로드 (.xlsx)
- 현재 필터 적용된 결과만 내보내기

---

## 4. 민감정보 처리

### 4.1 마스킹 정책

| 정보 유형 | 기본 표시        | 전체 표시 조건                   |
| --------- | ---------------- | -------------------------------- |
| 주민번호  | `******-1******` | 확인 버튼 클릭 + 로그 기록       |
| 계좌번호  | `****1234`       | 확인 버튼 클릭 + 로그 기록       |
| 전화번호  | `010-****-5678`  | 목록에서는 마스킹, 상세에서 전체 |

### 4.2 열람 로그

민감정보 열람 시 `sensitive_info_logs` 테이블에 기록:

- 열람자 (admin_id)
- 대상 (user_id, contract_id)
- 열람 정보 유형 (ssn, account, phone)
- 열람 시간, IP, User-Agent

---

## 5. 일괄 작업 기능

### 5.1 지원 일괄 작업

| 대상   | 작업             | 설명                                 |
| ------ | ---------------- | ------------------------------------ |
| 사용자 | 일괄 크레딧 지급 | 선택한 사용자들에게 동일 크레딧 지급 |
| 사용자 | 일괄 알림 발송   | 선택한 사용자들에게 인앱 알림        |
| 계약서 | 일괄 상태 변경   | expired → pending 복구 등            |
| 계약서 | 일괄 삭제        | 선택한 계약서 소프트 삭제            |

### 5.2 안전장치

- 일괄 작업 전 확인 모달
- 작업 대상 수 표시
- 되돌리기 불가 경고
- 감사 로그 기록

---

## 6. UI/UX 요구사항

### 6.1 디자인 스타일

- **기존 SignPlease 디자인과 통일**
- Tailwind CSS 사용
- 동일한 컬러 팔레트, 타이포그래피
- 다만 정보 밀도는 더 높게 (관리자 효율성 우선)

### 6.2 반응형 디자인

- **데스크톱 최적화** (주 사용 환경)
- **모바일에서도 사용 가능** (긴급 확인용)
- 테이블 → 모바일에서는 카드 뷰로 전환

### 6.3 컴포넌트

| 컴포넌트  | 용도                                 |
| --------- | ------------------------------------ |
| DataTable | 페이지네이션, 정렬, 필터 지원 테이블 |
| StatsCard | 통계 수치 카드                       |
| Chart     | 차트 (recharts 또는 chart.js)        |
| Modal     | 확인, 수정, 상세보기                 |
| Toast     | 작업 완료/실패 알림                  |
| Sidebar   | 관리자 메뉴 네비게이션               |

---

## 7. 데이터베이스 스키마 변경

### 7.1 profiles 테이블 변경

```sql
-- 관리자 플래그 추가
ALTER TABLE profiles ADD COLUMN is_admin boolean NOT NULL DEFAULT false;

-- 차단 플래그 추가
ALTER TABLE profiles ADD COLUMN is_blocked boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN blocked_at timestamptz;
ALTER TABLE profiles ADD COLUMN blocked_reason text;
```

### 7.2 신규 테이블: admin_audit_logs

관리자 활동 감사 로그

```sql
CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,                    -- 'create', 'update', 'delete', 'view_sensitive'
  target_type text NOT NULL,               -- 'user', 'contract', 'payment', 'credit'
  target_id uuid,                          -- 대상 레코드 ID
  changes jsonb,                           -- { before: {...}, after: {...} }
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);
```

### 7.3 신규 테이블: system_settings

시스템 설정값 저장

```sql
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 초기 데이터
INSERT INTO system_settings (key, value, description) VALUES
  ('minimum_wage_2026', '10360', '2026년 최저시급'),
  ('contract_expire_days', '7', '계약서 서명 만료일 (일)'),
  ('free_credits_on_signup', '5', '신규 가입 시 무료 크레딧'),
  ('free_ai_credits_on_signup', '5', '신규 가입 시 무료 AI 크레딧');
```

### 7.4 신규 테이블: announcements (선택)

공지사항 관리

```sql
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  target_role text,                        -- NULL: 전체, 'employer', 'worker'
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 7.5 RLS 정책

```sql
-- admin_audit_logs: 관리자만 조회/삽입
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_audit_logs_select ON admin_audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY admin_audit_logs_insert ON admin_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    AND admin_id = auth.uid()
  );

-- system_settings: 관리자만 조회/수정
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_settings_select ON system_settings
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY system_settings_update ON system_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

---

## 8. 파일 구조

```
app/
├── (admin)/                           # 관리자 라우트 그룹
│   ├── layout.tsx                     # 관리자 레이아웃 + 권한 체크
│   └── admin/
│       ├── page.tsx                   # 대시보드 (통계)
│       ├── users/
│       │   ├── page.tsx               # 사용자 목록
│       │   └── [id]/
│       │       └── page.tsx           # 사용자 상세
│       ├── contracts/
│       │   ├── page.tsx               # 계약서 목록
│       │   └── [id]/
│       │       └── page.tsx           # 계약서 상세
│       ├── payments/
│       │   ├── page.tsx               # 결제 목록
│       │   └── credits/
│       │       └── page.tsx           # 크레딧 관리
│       ├── notifications/
│       │   └── page.tsx               # 알림 발송
│       ├── settings/
│       │   └── page.tsx               # 시스템 설정
│       ├── logs/
│       │   └── page.tsx               # 감사 로그
│       └── export/
│           └── page.tsx               # 데이터 내보내기
│
├── actions/
│   └── admin/
│       ├── users.ts                   # 사용자 관리 Server Actions
│       ├── contracts.ts               # 계약서 관리 Server Actions
│       ├── payments.ts                # 결제/크레딧 관리 Server Actions
│       ├── notifications.ts           # 알림 발송 Server Actions
│       ├── settings.ts                # 시스템 설정 Server Actions
│       ├── audit.ts                   # 감사 로그 Server Actions
│       └── export.ts                  # 데이터 내보내기 Server Actions
│
└── components/
    └── admin/
        ├── Sidebar.tsx                # 관리자 사이드바
        ├── DataTable.tsx              # 범용 데이터 테이블
        ├── StatsCard.tsx              # 통계 카드
        ├── Charts/
        │   ├── LineChart.tsx
        │   ├── PieChart.tsx
        │   └── BarChart.tsx
        ├── UserDetail.tsx
        ├── ContractDetail.tsx
        ├── PaymentDetail.tsx
        ├── CreditModal.tsx            # 크레딧 지급/차감 모달
        ├── BulkActionModal.tsx        # 일괄 작업 모달
        └── SensitiveDataViewer.tsx    # 민감정보 마스킹/열람
```

---

## 9. API/Server Actions

### 9.1 사용자 관리

| Action        | 설명                 | 파라미터                          |
| ------------- | -------------------- | --------------------------------- |
| `getUsers`    | 사용자 목록 조회     | page, limit, search, role, sortBy |
| `getUser`     | 사용자 상세 조회     | userId                            |
| `updateUser`  | 사용자 정보 수정     | userId, data                      |
| `blockUser`   | 사용자 차단          | userId, reason                    |
| `unblockUser` | 사용자 차단 해제     | userId                            |
| `deleteUser`  | 사용자 삭제 (익명화) | userId                            |
| `setAdmin`    | 관리자 권한 설정     | userId, isAdmin                   |

### 9.2 계약서 관리

| Action                 | 설명             | 파라미터                               |
| ---------------------- | ---------------- | -------------------------------------- |
| `getContracts`         | 계약서 목록 조회 | page, limit, status, dateRange, userId |
| `getContract`          | 계약서 상세 조회 | contractId                             |
| `updateContractStatus` | 상태 변경        | contractId, newStatus                  |
| `deleteContract`       | 계약서 삭제      | contractId                             |
| `generatePdf`          | PDF 생성         | contractId                             |

### 9.3 결제/크레딧 관리

| Action          | 설명           | 파라미터                           |
| --------------- | -------------- | ---------------------------------- |
| `getPayments`   | 결제 목록 조회 | page, limit, status, dateRange     |
| `getPayment`    | 결제 상세 조회 | paymentId                          |
| `addCredit`     | 크레딧 지급    | userId, creditType, amount, reason |
| `deductCredit`  | 크레딧 차감    | userId, creditType, amount, reason |
| `refundPayment` | 환불 처리      | paymentId                          |

### 9.4 알림 관리

| Action                 | 설명           | 파라미터                        |
| ---------------------- | -------------- | ------------------------------- |
| `sendNotification`     | 인앱 알림 발송 | userIds, title, body            |
| `sendBulkNotification` | 전체 알림 발송 | role, title, body               |
| `sendAlimtalk`         | 알림톡 발송    | userId, templateCode, variables |

### 9.5 시스템 설정

| Action          | 설명      | 파라미터   |
| --------------- | --------- | ---------- |
| `getSettings`   | 설정 조회 | -          |
| `updateSetting` | 설정 변경 | key, value |

### 9.6 감사 로그

| Action         | 설명               | 파라미터                                   |
| -------------- | ------------------ | ------------------------------------------ |
| `getAuditLogs` | 로그 조회          | page, limit, action, targetType, dateRange |
| `logAction`    | 로그 기록 (내부용) | action, targetType, targetId, changes      |

### 9.7 데이터 내보내기

| Action            | 설명             | 파라미터        |
| ----------------- | ---------------- | --------------- |
| `exportUsers`     | 사용자 CSV/Excel | format, filters |
| `exportContracts` | 계약서 CSV/Excel | format, filters |
| `exportPayments`  | 결제 CSV/Excel   | format, filters |

---

## 10. 보안 고려사항

### 10.1 접근 제어

- 모든 관리자 페이지에서 `is_admin` 체크
- 미들웨어에서 `/admin` 경로 보호
- RLS 정책으로 DB 레벨 보호

### 10.2 감사 추적

- 모든 수정/삭제 작업 로그 기록
- 민감정보 열람 로그 기록
- IP, User-Agent 기록

### 10.3 민감정보 보호

- 기본 마스킹 처리
- 열람 시 명시적 확인 필요
- 열람 로그 기록

### 10.4 일괄 작업 보호

- 대상 수 표시
- 확인 모달 필수
- 롤백 불가 경고

---

## 11. 개발 우선순위

### Phase 1: 핵심 기능 (MVP)

1. 관리자 인증/권한 시스템
2. 대시보드 (기본 통계)
3. 사용자 목록/상세 조회
4. 계약서 목록/상세 조회
5. 결제 목록/상세 조회
6. 기본 감사 로그

### Phase 2: 관리 기능

1. 사용자 수정/차단/삭제
2. 계약서 상태 변경/삭제
3. 수동 크레딧 지급/차감
4. 검색/필터/정렬 고도화

### Phase 3: 고급 기능

1. 차트 시각화 (추이, 분포)
2. 일괄 작업 기능
3. 데이터 내보내기
4. 시스템 설정

### Phase 4: 추가 기능

1. 알림 발송 기능
2. 카카오 알림톡 연동
3. 환불 처리
4. 공지사항 관리

---

## 12. 기술 스택

| 영역       | 기술                      |
| ---------- | ------------------------- |
| 프레임워크 | Next.js 14+ (App Router)  |
| 스타일링   | Tailwind CSS              |
| 차트       | recharts 또는 chart.js    |
| 테이블     | @tanstack/react-table     |
| 폼         | react-hook-form + zod     |
| 상태관리   | React Query (서버 상태)   |
| 내보내기   | xlsx (Excel), 기본 CSV    |
| 인증       | Supabase Auth (기존 활용) |
| DB         | Supabase PostgreSQL       |

---

## 13. 예상 작업량

| Phase          | 예상 작업량 |
| -------------- | ----------- |
| Phase 1 (MVP)  | 중간        |
| Phase 2 (관리) | 중간        |
| Phase 3 (고급) | 높음        |
| Phase 4 (추가) | 낮음-중간   |

---

## 14. 체크리스트 (개발 시작 전)

- [ ] `profiles.is_admin` 컬럼 추가
- [ ] `profiles.is_blocked` 컬럼 추가
- [ ] `admin_audit_logs` 테이블 생성
- [ ] `system_settings` 테이블 생성
- [ ] RLS 정책 적용
- [ ] 본인 계정에 is_admin = true 설정
- [ ] 인증 방식 최종 결정 (카카오 / 이메일 / 둘 다)

---

> **문서 끝**
