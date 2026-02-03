# 📋 Development Plan

## 싸인해주세요 (SignPlease)

> **버전**: 1.27  
> **최종 수정일**: 2026년 1월 31일  
> **목적**: AI 개발자(Cursor)가 실패 없이 따라갈 수 있는 원자 단위 작업 계획서

---

## 📌 계획서 사용 가이드

### Task 실행 규칙

1. **한 번에 하나의 Task만 실행** - 완료 후 체크(✅) 표시
2. **참조 문서 확인 필수** - 각 Task에 명시된 참조 문서를 반드시 확인
3. **의존성 순서 준수** - `Depends on` 필드가 있는 경우 선행 Task 완료 확인
4. **테스트 후 진행** - 각 Task 완료 후 동작 확인

### 참조 문서 약어

- `PRD`: `docs/PRD.md` - 기능 요구사항
- `Schema`: `docs/schema.md` - 데이터베이스 구조
- `Rules`: `docs/rules.md` - 기술 규칙 및 코딩 컨벤션
- `UI`: `docs/UI_Spec.md` - UI 디자인 스펙
- `IA`: `docs/IA.md` - 정보 구조 및 라우팅

---

## Phase 1: Foundation (프로젝트 기반 설정)

> 예상 시간: 10시간 | 우선순위: P0

### Epic 1.1: 프로젝트 초기화

#### Story 1.1.1: Next.js 프로젝트 세팅

> 예상 시간: 2시간

- [x] **Task 1.1.1.1**: Next.js 14 프로젝트 생성 ✅

  ```bash
  # 실행할 명령어
  npx create-next-app@latest signplease --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
  ```

  - 참조: `Rules` 섹션 1 (프로젝트 구조)

- [x] **Task 1.1.1.2**: `tailwind.config.ts` 커스텀 설정 작성 ✅
  - 참조: `UI` 섹션 0 (Design System), `Rules` 섹션 1
  - 작업 내용:
    - 컬러 팔레트 추가 (--primary, --gray-\*, --success, --warning, --error, --kakao)
    - Typography 스케일 설정
    - 커스텀 애니메이션 추가 (fade-in, fade-in-up, slide-up, bounce-slow)
    - Safe area 유틸리티 클래스

- [x] **Task 1.1.1.3**: `app/globals.css` 글로벌 스타일 작성 ✅
  - 참조: `UI` 섹션 0.4 (Component Tokens)
  - 작업 내용:
    - CSS 변수 정의
    - 버튼 스타일 클래스 (.btn-primary, .btn-secondary, .btn-kakao, .btn-ghost)
    - 카드 스타일 클래스 (.card, .card-elevated)
    - 입력 필드 스타일 (.input-underline, .input-box)
    - 배지 스타일 (.badge-waiting, .badge-complete, .badge-expired)

- [x] **Task 1.1.1.4**: ESLint, Prettier 설정 파일 작성 ✅
  - 작업 내용: `.eslintrc.json`, `.prettierrc` 생성
  - 참조: `Rules` 섹션 9 (코딩 컨벤션)

- [x] **Task 1.1.1.5**: `.env.example` 환경변수 템플릿 생성 ✅
  - 참조: `Rules` 섹션 2 (환경 변수)
  - 포함 항목: Supabase, 암호화 키, 토스페이먼츠, 카카오, OpenAI, 앱 URL

---

#### Story 1.1.2: Supabase 연동 설정

> 예상 시간: 3시간

- [x] **Task 1.1.2.1**: Supabase 패키지 설치 ✅

  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```

- [x] **Task 1.1.2.2**: `lib/supabase/client.ts` 클라이언트 유틸 작성 ✅
  - 참조: `Rules` 섹션 3.1.1 (클라이언트 생성 유틸)
  - `createBrowserClient` 사용

- [x] **Task 1.1.2.3**: `lib/supabase/server.ts` 서버 유틸 작성 ✅
  - 참조: `Rules` 섹션 3.1.1 (서버 클라이언트)
  - `createServerClient` + cookies 설정

- [x] **Task 1.1.2.4**: `lib/supabase/middleware.ts` 미들웨어 유틸 작성 ✅
  - 참조: `Rules` 섹션 3.1.2 (미들웨어 설정)
  - 보호된 경로 정의, 역할별 접근 제한 로직

- [x] **Task 1.1.2.5**: `middleware.ts` 루트 미들웨어 생성 ✅
  - 참조: `Rules` 섹션 3.1.2
  - matcher 설정, updateSession 호출

---

#### Story 1.1.3: 데이터베이스 마이그레이션

> 예상 시간: 4시간

- [x] **Task 1.1.3.1**: Supabase CLI 설치 및 프로젝트 링크 ✅ (MCP로 직접 적용)

  ```bash
  npm install -g supabase
  supabase login
  supabase link --project-ref YOUR_PROJECT_ID
  ```

- [x] **Task 1.1.3.2**: Enum 타입 마이그레이션 파일 생성 ✅
  - 참조: `Schema` 섹션 2 (Enums)
  - 생성할 Enum: `user_role`, `contract_status`, `signer_role`, `credit_type`, `notification_type`, `business_size`

- [x] **Task 1.1.3.3**: `profiles` 테이블 마이그레이션 생성 ✅
  - 참조: `Schema` 섹션 3.1

- [x] **Task 1.1.3.4**: `worker_details` 테이블 마이그레이션 생성 ✅
  - 참조: `Schema` 섹션 3.2
  - 주의: 암호화 필드(bytea) 구조

- [x] **Task 1.1.3.5**: `folders` 테이블 마이그레이션 생성 ✅
  - 참조: `Schema` 섹션 3.3

- [x] **Task 1.1.3.6**: `contracts` 테이블 마이그레이션 생성 ✅
  - 참조: `Schema` 섹션 3.4
  - 인덱스 생성 포함

- [x] **Task 1.1.3.7**: `signatures` 테이블 마이그레이션 생성 ✅
  - 참조: `Schema` 섹션 3.5

- [x] **Task 1.1.3.8**: `ai_reviews` 테이블 마이그레이션 생성 ✅
  - 참조: `Schema` 섹션 3.6

- [x] **Task 1.1.3.9**: `credits` 및 `credit_transactions` 테이블 마이그레이션 생성 ✅
  - 참조: `Schema` 섹션 3.7, 3.8

- [x] **Task 1.1.3.10**: `payments` 테이블 마이그레이션 생성 ✅
  - 참조: `Schema` 섹션 3.9

- [x] **Task 1.1.3.11**: `chat_messages` 테이블 마이그레이션 생성 ✅
  - 참조: `Schema` 섹션 3.10

- [x] **Task 1.1.3.12**: `notifications` 테이블 마이그레이션 생성 ✅
  - 참조: `Schema` 섹션 3.11

- [x] **Task 1.1.3.13**: RLS 정책 마이그레이션 생성 (profiles, worker_details, folders) ✅
  - 참조: `Schema` 섹션 4.1, 4.2, 4.3

- [x] **Task 1.1.3.14**: RLS 정책 마이그레이션 생성 (contracts, signatures, ai_reviews) ✅
  - 참조: `Schema` 섹션 4.4, 4.5, 4.6

- [x] **Task 1.1.3.15**: RLS 정책 마이그레이션 생성 (credits, payments, chat_messages, notifications) ✅
  - 참조: `Schema` 섹션 4.7, 4.8, 4.9, 4.10, 4.11

- [x] **Task 1.1.3.16**: Database Functions 마이그레이션 생성 ✅
  - 참조: `Schema` 섹션 5
  - 함수: `handle_new_user`, `use_credit`, `add_credit`, `expire_pending_contracts`

- [x] **Task 1.1.3.17**: Storage Buckets 생성 ✅
  - 참조: `Schema` 섹션 6
  - 버킷: `signatures`, `contracts-pdf`, `chat-files`

- [x] **Task 1.1.3.18**: 마이그레이션 적용 및 TypeScript 타입 생성 ✅
  ```bash
  supabase db push
  supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
  ```

---

#### Story 1.1.4: 필수 패키지 및 유틸리티 설정

> 예상 시간: 1시간

- [x] **Task 1.1.4.1**: 상태 관리 패키지 설치 및 Provider 설정 ✅

  ```bash
  npm install zustand @tanstack/react-query
  ```

  - `app/providers.tsx` 생성 (QueryClientProvider)
  - `app/layout.tsx`에 Provider 래핑

- [x] **Task 1.1.4.2**: 유효성 검사 및 유틸리티 패키지 설치 ✅

  ```bash
  npm install zod date-fns nanoid
  ```

- [x] **Task 1.1.4.3**: `lib/constants/routes.ts` 라우트 상수 정의 ✅
  - 참조: `IA` 섹션 2 (전체 사이트맵)
  - 공통 라우트, 사업자 라우트, 근로자 라우트 상수

- [x] **Task 1.1.4.4**: `lib/utils/format.ts` 포맷팅 유틸 작성 ✅
  - `formatCurrency(number)`: 숫자를 원화 포맷으로
  - `formatDate(date)`: 날짜 포맷
  - `formatTime(time)`: 시간 포맷

- [x] **Task 1.1.4.5**: `types/index.ts` 공통 타입 정의 ✅
  - 참조: `Rules` 섹션 8 (타입 정의)
  - Contract, Profile, Credit 관련 타입

---

## Phase 2: Authentication (인증 시스템)

> 예상 시간: 10시간 | 우선순위: P0

### Epic 2.1: 카카오 OAuth 인증

#### Story 2.1.1: OAuth 기본 설정

> 예상 시간: 2시간

- [x] **Task 2.1.1.1**: 카카오 개발자 콘솔 앱 생성 및 설정 ✅
  - 작업 내용:
    - 카카오 개발자 콘솔에서 앱 생성
    - 플랫폼 등록 (웹)
    - Redirect URI 설정
  - 출력: 카카오 REST API Key, JavaScript Key

- [x] **Task 2.1.1.2**: Supabase 대시보드에서 카카오 Provider 활성화 ✅
  - Authentication > Providers > Kakao 설정
  - Client ID, Client Secret 입력

- [x] **Task 2.1.1.3**: `.env.local`에 카카오 환경변수 추가 ✅
  - `NEXT_PUBLIC_KAKAO_JS_KEY`
  - `KAKAO_REST_API_KEY`

---

#### Story 2.1.2: 로그인/회원가입 UI 구현

> 예상 시간: 3시간

- [x] **Task 2.1.2.1**: `app/(public)/layout.tsx` 공개 라우트 레이아웃 생성 ✅
  - 참조: `Rules` 섹션 1 (프로젝트 구조)
  - 기본 HTML 구조, 메타 태그

- [x] **Task 2.1.2.2**: `components/ui/Button.tsx` 버튼 컴포넌트 생성 ✅
  - 참조: `UI` 섹션 0.4 (Component Tokens)
  - variant: primary, secondary, kakao, ghost
  - Props: loading, disabled, fullWidth

- [x] **Task 2.1.2.3**: `app/(public)/signup/page.tsx` 회원가입 페이지 UI 구현 ✅
  - 참조: `UI` 섹션 1.3 (회원가입 & 로그인)
  - 로고, 서비스명, 카카오 버튼, 약관 동의 문구
  - 로직 제외, 순수 마크업만

- [x] **Task 2.1.2.4**: `app/(public)/login/page.tsx` 로그인 페이지 UI 구현 ✅
  - 참조: `UI` 섹션 1.3
  - 회원가입과 동일 구조, 뒤로가기 버튼 추가

---

#### Story 2.1.3: OAuth 로직 구현

> 예상 시간: 2시간

- [x] **Task 2.1.3.1**: `app/(public)/login/actions.ts` Server Action 작성 ✅
  - 참조: `Rules` 섹션 3.1.3 (카카오 OAuth 설정)
  - `signInWithKakao()` 함수 구현

- [x] **Task 2.1.3.2**: `app/(public)/auth/callback/route.ts` OAuth 콜백 핸들러 구현 ✅
  - 참조: `Rules` 섹션 3.1.3
  - 코드 교환, 프로필 역할 확인, 리다이렉트 분기

- [x] **Task 2.1.3.3**: `app/(public)/auth/signout/route.ts` 로그아웃 핸들러 구현 ✅
  - 세션 종료 후 홈으로 리다이렉트

- [x] **Task 2.1.3.4**: 로그인/회원가입 페이지에 Server Action 연결 ✅
  - 버튼 클릭 시 `signInWithKakao` 호출

---

#### Story 2.1.4: 역할 선택 구현

> 예상 시간: 2시간

- [x] **Task 2.1.4.1**: `app/(protected)/layout.tsx` 보호된 라우트 레이아웃 생성 ✅
  - 인증 체크 로직 포함
  - 미인증 시 로그인 리다이렉트

- [x] **Task 2.1.4.2**: `app/(protected)/select-role/page.tsx` 역할 선택 UI 구현 ✅
  - 참조: `UI` 섹션 1.4 (역할 선택)
  - 사장님/알바생 카드 2개
  - 로직 제외

- [x] **Task 2.1.4.3**: `app/(protected)/select-role/actions.ts` 역할 저장 Server Action 구현 ✅
  - profiles 테이블의 role 컬럼 업데이트
  - 역할에 따른 대시보드 리다이렉트

- [x] **Task 2.1.4.4**: 역할 선택 페이지에 Server Action 연결 ✅
  - 카드 선택 시 역할 저장 및 이동

---

## Phase 3: Core UI Components (공통 컴포넌트)

> 예상 시간: 12시간 | 우선순위: P0

### Epic 3.1: Design System 컴포넌트

#### Story 3.1.1: 기본 UI 컴포넌트 (Part 1)

> 예상 시간: 3시간

- [x] **Task 3.1.1.1**: `components/ui/Input.tsx` 입력 필드 컴포넌트 생성 ✅
  - 참조: `UI` 섹션 0.4 (Input Fields)
  - variant: underline, box
  - Props: label, error, helper

- [x] **Task 3.1.1.2**: `components/ui/Card.tsx` 카드 컴포넌트 생성 ✅
  - 참조: `UI` 섹션 0.4 (Cards)
  - variant: default, elevated
  - Props: onClick, children

- [x] **Task 3.1.1.3**: `components/ui/Badge.tsx` 배지 컴포넌트 생성 ✅
  - 참조: `UI` 섹션 0.4 (Chip / Badge)
  - variant: waiting, complete, expired
  - Props: children

- [x] **Task 3.1.1.4**: `components/ui/ProgressBar.tsx` 진행률 바 컴포넌트 생성 ✅
  - 참조: `UI` 섹션 0.4 (Progress Bar)
  - Props: current, total, showLabel

---

#### Story 3.1.2: 기본 UI 컴포넌트 (Part 2)

> 예상 시간: 3시간

- [x] **Task 3.1.2.1**: `components/ui/BottomSheet.tsx` 바텀시트 컴포넌트 생성 ✅
  - 참조: `UI` 섹션 0.4 (Bottom Sheet)
  - Props: isOpen, onClose, title, children
  - 핸들 바, 백드롭 포함

- [x] **Task 3.1.2.2**: `components/ui/Toast.tsx` 토스트 컴포넌트 생성 ✅
  - 참조: `UI` 섹션 5.1 (Toast Message)
  - variant: success, error
  - 자동 dismiss 로직

- [x] **Task 3.1.2.3**: `components/ui/LoadingSpinner.tsx` 로딩 컴포넌트 생성 ✅
  - 참조: `UI` 섹션 5.2 (Loading State)
  - variant: fullPage, inline, button

- [x] **Task 3.1.2.4**: `components/shared/EmptyState.tsx` 빈 상태 컴포넌트 생성 ✅
  - 참조: `UI` 섹션 5.3 (Empty State)
  - Props: icon, title, description, actionLabel, onAction

- [x] **Task 3.1.2.5**: `components/ui/ConfirmSheet.tsx` 확인 바텀시트 컴포넌트 생성 ✅
  - 참조: `UI` 섹션 5.4 (Confirmation Modal)
  - Props: isOpen, title, description, confirmLabel, onConfirm, onCancel

---

#### Story 3.1.3: 레이아웃 컴포넌트

> 예상 시간: 3시간

- [x] **Task 3.1.3.1**: `components/layout/Header.tsx` 헤더 컴포넌트 생성 ✅
  - 참조: `UI` 섹션 2.1 (사업자 대시보드 헤더)
  - Props: showProfile, showNotification, credits

- [x] **Task 3.1.3.2**: `components/layout/PageHeader.tsx` 페이지 헤더 컴포넌트 생성 ✅
  - 참조: `UI` 섹션 2.2 (계약서 작성 헤더)
  - Props: title, onBack, rightElement, progress

- [x] **Task 3.1.3.3**: `components/layout/TabBar.tsx` 탭 바 컴포넌트 생성 ✅
  - 참조: `UI` 섹션 2.1 (Tab Bar)
  - Props: tabs, activeTab, onTabChange

- [x] **Task 3.1.3.4**: `components/layout/BottomNav.tsx` 하단 네비게이션 컴포넌트 생성 ✅
  - 참조: `UI` 섹션 3.2 (근로자 대시보드)
  - 홈, 채팅, 경력, 설정 4개 탭

- [x] **Task 3.1.3.5**: `components/layout/FAB.tsx` FAB 컴포넌트 생성 ✅
  - 참조: `UI` 섹션 2.1 (FAB 버튼)
  - Props: onClick, icon

---

#### Story 3.1.4: 스플래시 & 온보딩 화면

> 예상 시간: 3시간

- [x] **Task 3.1.4.1**: `app/page.tsx` 스플래시 화면 UI 구현 ✅
  - 참조: `UI` 섹션 1.1 (스플래시)
  - 로고, 서비스명, 로딩 도트 애니메이션

- [x] **Task 3.1.4.2**: `app/page.tsx` 스플래시 자동 리다이렉트 로직 구현 ✅
  - 2초 후 자동 이동
  - 로그인 상태 체크 후 분기 (로그인 → 대시보드, 비로그인 → 온보딩)

- [x] **Task 3.1.4.3**: `app/(public)/onboarding/page.tsx` 온보딩 슬라이드 UI 구현 ✅
  - 참조: `UI` 섹션 1.2 (온보딩)
  - 3장 슬라이드 (일러스트, 타이틀, 설명)
  - 인디케이터

- [x] **Task 3.1.4.4**: `app/(public)/onboarding/page.tsx` 스와이프 및 버튼 로직 구현 ✅
  - 스와이프로 슬라이드 전환 (swipe library or touch events)
  - "시작하기" → 회원가입
  - "둘러보기" → 게스트 모드

---

## Phase 4: Employer Features (사업자 기능)

> 예상 시간: 34시간 | 우선순위: P0

### Epic 4.1: 사업자 대시보드

#### Story 4.1.1: 대시보드 레이아웃 및 데이터 로드

> 예상 시간: 4시간

- [x] **Task 4.1.1.1**: `app/(protected)/employer/layout.tsx` 사업자 레이아웃 생성 ✅
  - Header, FAB 포함
  - 역할 체크 (employer가 아니면 리다이렉트)

- [x] **Task 4.1.1.2**: `app/(protected)/employer/page.tsx` 대시보드 Server Component 구현 ✅
  - 참조: `Rules` 섹션 4.1 (Server Component에서 데이터 로드)
  - contracts 테이블에서 employer_id로 조회
  - 상태별 필터링 데이터 전달

- [x] **Task 4.1.1.3**: `components/contract/ContractCard.tsx` 계약서 카드 컴포넌트 생성 ✅
  - 참조: `UI` 섹션 2.1 (Contract Card)
  - 근로자 이름, 시급, 생성일, 상태 배지
  - onClick → 상세 페이지 이동

- [x] **Task 4.1.1.4**: 대시보드 탭 필터링 및 빈 상태 UI 구현 ✅
  - 참조: `UI` 섹션 2.1 (탭 메뉴, Empty State)
  - TabBar 연동
  - 상태별 필터 (대기중, 완료, 폴더, 휴지통)

---

### Epic 4.2: 계약서 작성 Funnel

#### Story 4.2.1: Funnel 기본 구조 및 상태 관리

> 예상 시간: 2시간

- [x] **Task 4.2.1.1**: `stores/contractFormStore.ts` Zustand 스토어 생성 ✅
  - 참조: `Rules` 섹션 5.1 (Zustand 스토어 규칙)
  - step, data, setStep, nextStep, prevStep, updateData, reset
  - sessionStorage persist

- [x] **Task 4.2.1.2**: `app/(protected)/employer/create/page.tsx` Funnel 레이아웃 구현 ✅
  - 참조: `UI` 섹션 2.2 (계약서 작성 Funnel)
  - PageHeader (뒤로가기, 진행률)
  - 동적 Step 렌더링

- [x] **Task 4.2.1.3**: Funnel 네비게이션 로직 구현 ✅
  - 이전/다음 버튼 동작
  - Step 완료 조건 검증
  - 마지막 Step에서 미리보기 이동

---

#### Story 4.2.2: Step 1-5 UI 구현

> 예상 시간: 3시간

- [x] **Task 4.2.2.1**: `components/contract/ContractForm/Step1BusinessSize.tsx` 구현 ✅
  - 참조: `UI` 섹션 2.2 Step 1
  - 5인 미만/이상 라디오 카드
  - 4대보험 안내 문구

- [x] **Task 4.2.2.2**: `components/contract/ContractForm/Step2WorkerName.tsx` 구현 ✅
  - 참조: `UI` 섹션 2.2 Step 2
  - 언더라인 입력 필드
  - 한글 2-10자 검증

- [x] **Task 4.2.2.3**: `components/contract/ContractForm/Step3Wage.tsx` 구현 ✅
  - 참조: `UI` 섹션 2.2 Step 3
  - 숫자 입력 (자동 3자리 콤마)
  - 주휴수당 포함 체크박스
  - 최저시급 정보 카드

- [x] **Task 4.2.2.4**: `components/contract/ContractForm/Step4WorkPeriod.tsx` 구현 ✅
  - 참조: `UI` 섹션 2.2 Step 4
  - 날짜 피커 (시작일, 종료일)
  - "종료일 없음" 체크박스

- [x] **Task 4.2.2.5**: `components/contract/ContractForm/Step5WorkDays.tsx` 구현 ✅
  - 참조: `UI` 섹션 2.2 Step 5
  - 요일 선택 칩 (월-일)
  - "주 N일" 대체 입력

---

#### Story 4.2.3: Step 6-10 UI 구현

> 예상 시간: 2시간

- [x] **Task 4.2.3.1**: `components/contract/ContractForm/Step6WorkTime.tsx` 구현 ✅
  - 참조: `UI` 섹션 2.2 Step 6
  - 시간 피커 (시작, 종료)
  - 일 근무시간 자동 계산 표시

- [x] **Task 4.2.3.2**: `components/contract/ContractForm/Step7BreakTime.tsx` 구현 ✅
  - 참조: `UI` 섹션 2.2 Step 7
  - 30분, 60분, 직접입력 버튼
  - 법적 안내 문구

- [x] **Task 4.2.3.3**: `components/contract/ContractForm/Step8Location.tsx` 구현 ✅
  - 참조: `UI` 섹션 2.2 Step 8
  - 주소 검색 버튼 (또는 직접 입력)
  - 주소 API 연동은 별도 Task

- [x] **Task 4.2.3.4**: `components/contract/ContractForm/Step9JobDescription.tsx` 구현 ✅
  - 참조: `UI` 섹션 2.2 Step 9
  - 텍스트 영역
  - 예시 태그 클릭 시 자동 입력

- [x] **Task 4.2.3.5**: `components/contract/ContractForm/Step10PayDay.tsx` 구현 ✅
  - 참조: `UI` 섹션 2.2 Step 10
  - 숫자 선택 (1-31)
  - 다음 급여일 자동 계산

---

#### Story 4.2.4: 계약서 생성 로직

> 예상 시간: 2시간

- [x] **Task 4.2.4.1**: `lib/utils/validation.ts` 계약서 유효성 검사 스키마 작성 ✅
  - 참조: `Rules` 섹션 4.3 (Server Actions)
  - Zod 스키마: contractSchema
  - 모든 필드 검증 규칙

- [x] **Task 4.2.4.2**: `app/(protected)/employer/create/actions.ts` Server Action 구현 ✅
  - 참조: `Rules` 섹션 4.3
  - 인증 확인
  - 역할 확인
  - 크레딧 차감 (use_credit 함수 호출)
  - contracts 테이블 INSERT

- [x] **Task 4.2.4.3**: Step 10에서 Server Action 연결 및 미리보기 이동 ✅
  - "계약서 미리보기" 버튼 클릭 시 저장 후 이동
  - 에러 처리 (크레딧 부족, 유효성 실패)

---

### Epic 4.3: 계약서 미리보기 & 서명

#### Story 4.3.1: 미리보기 화면

> 예상 시간: 3시간

- [x] **Task 4.3.1.1**: `app/(protected)/employer/preview/[id]/page.tsx` Server Component 구현 ✅
  - 계약서 데이터 조회 (contracts + signatures)
  - 권한 체크 (employer_id 일치)

- [x] **Task 4.3.1.2**: `components/contract/ContractPreview.tsx` 미리보기 UI 구현 ✅
  - 참조: `UI` 섹션 2.3 (계약서 미리보기)
  - 표준근로계약서 형식
  - 모든 필드 표시

- [x] **Task 4.3.1.3**: 공유 옵션 버튼 UI 구현 ✅
  - 참조: `UI` 섹션 2.3 (공유 옵션)
  - PDF, 링크, 카카오톡 버튼
  - 로직은 별도 Task

---

#### Story 4.3.2: 서명 기능

> 예상 시간: 3시간

- [x] **Task 4.3.2.1**: `components/contract/SignatureCanvas.tsx` 서명 캔버스 컴포넌트 구현 ✅
  - 참조: `UI` 섹션 2.4 (서명 입력 Bottom Sheet)
  - Canvas API 기반 자필 서명
  - 다시 쓰기 기능
  - Base64 이미지 출력

- [x] **Task 4.3.2.2**: 서명 BottomSheet UI 및 연동 ✅
  - BottomSheet + SignatureCanvas 결합
  - "서명 완료" 버튼

- [x] **Task 4.3.2.3**: `app/(protected)/employer/preview/[id]/actions.ts` 서명 저장 Server Action 구현 ✅
  - signatures 테이블 INSERT
  - contracts 상태 업데이트 (draft → pending)
  - expires_at 설정 (7일 후)

- [x] **Task 4.3.2.4**: "서명하고 보내기" 버튼 연결 ✅
  - 서명 완료 후 공유 옵션 표시
  - 알림톡 발송 트리거 (별도 Task)

---

### Epic 4.4: AI 노무사 검토

#### Story 4.4.1: AI 검토 기능

> 예상 시간: 4시간

- [x] **Task 4.4.1.1**: OpenAI 패키지 설치 ✅

  ```bash
  npm install openai
  ```

- [x] **Task 4.4.1.2**: `app/api/ai-review/route.ts` API Route 구현 ✅
  - 참조: `Rules` 섹션 6.4 (AI 노무사 검토)
  - 인증/권한 확인
  - 크레딧 차감
  - OpenAI API 호출 (선택적)
  - ai_reviews 테이블 저장

- [x] **Task 4.4.1.3**: AI 검토 결과 BottomSheet UI 구현 ✅
  - 참조: `UI` 섹션 2.5 (AI 검토 결과)
  - overall_status 표시
  - 항목별 상태 (✅, ⚠️, ❌)
  - 수정 제안 표시

- [x] **Task 4.4.1.4**: 미리보기 화면에 AI 검토 버튼 연동 ✅
  - "AI 노무사 검토 받기" 버튼
  - 로딩 상태
  - 결과 BottomSheet 표시
  - 크레딧 부족 시 결제 유도

---

### Epic 4.5: 계약서 공유

#### Story 4.5.1: 공유 기능 구현

> 예상 시간: 4시간

- [x] **Task 4.5.1.1**: `lib/kakao.ts` 카카오 SDK 초기화 및 공유 유틸 작성 ✅
  - 참조: `Rules` 섹션 6.1 (카카오톡 공유)
  - initKakao, shareContractViaKakao 함수

- [x] **Task 4.5.1.2**: `app/layout.tsx`에 카카오 SDK 스크립트 추가 ✅
  - Script 컴포넌트로 SDK 로드

- [x] **Task 4.5.1.3**: `lib/utils/share.ts` 링크 복사 유틸 작성 ✅
  - `copyContractLink(shareToken)` 함수
  - Clipboard API 사용

- [x] **Task 4.5.1.4**: PDF 생성 패키지 설치 및 설정 ✅

  ```bash
  npm install @react-pdf/renderer
  ```

- [x] **Task 4.5.1.5**: `app/api/pdf/generate/route.ts` PDF 생성 API Route 구현 ✅
  - 계약서 데이터로 PDF 생성
  - Base64 인코딩 반환
  - 다운로드 기능 연동

- [x] **Task 4.5.1.6**: 공유 버튼들 기능 연결 ✅
  - 카카오톡 공유 → shareContractViaKakao 호출
  - 링크 복사 → copyContractLink 호출
  - PDF 다운로드 → API 호출 후 다운로드

---

### Epic 4.6: 계약서 상세 & 관리

#### Story 4.6.1: 계약서 상세 화면

> 예상 시간: 2시간

- [x] **Task 4.6.1.1**: `app/(protected)/employer/contract/[id]/page.tsx` Server Component 구현 ✅
  - 계약서 데이터 조회
  - 서명 현황 조회
  - AI 검토 결과 조회

- [x] **Task 4.6.1.2**: 계약서 상세 UI 구현 ✅
  - 참조: `PRD` 섹션 4.2.4 (계약서 상세)
  - 상태 배지, 계약서 본문, 서명 현황
  - 액션 버튼 (PDF, 재전송, 삭제)

---

#### Story 4.6.2: 계약서 삭제 및 재전송

> 예상 시간: 1시간

- [x] **Task 4.6.2.1**: 계약서 삭제 Server Action 구현 ✅
  - status → 'deleted', deleted_at 설정
  - revalidatePath 호출

- [x] **Task 4.6.2.2**: 계약서 재전송 기능 구현 ✅
  - 카카오톡 공유 재호출
  - 만료일 연장 (7일)

---

### Epic 4.7: 폴더 관리

#### Story 4.7.1: 폴더 CRUD

> 예상 시간: 3시간

- [x] **Task 4.7.1.1**: 폴더 목록 및 생성 UI 구현 ✅
  - 폴더 탭 내 폴더 카드 목록
  - "+" 버튼 → 폴더 생성 BottomSheet

- [x] **Task 4.7.1.2**: 폴더 CRUD Server Actions 구현 ✅
  - createFolder, updateFolder, deleteFolder
  - folders 테이블 조작

- [x] **Task 4.7.1.3**: 계약서 폴더 이동 기능 구현 ✅
  - moveContractToFolder Server Action
  - contracts.folder_id 업데이트

---

## Phase 5: Worker Features (근로자 기능)

> 예상 시간: 16시간 | 우선순위: P0

### Epic 5.1: 근로자 온보딩

#### Story 5.1.1: 민감정보 입력 UI

> 예상 시간: 3시간

- [x] **Task 5.1.1.1**: `app/(protected)/worker/onboarding/page.tsx` 온보딩 레이아웃 구현 ✅
  - 참조: `UI` 섹션 3.1 (근로자 온보딩)
  - 3 Step Progress
  - Step 동적 렌더링

- [x] **Task 5.1.1.2**: Step 1 본인인증 UI 구현 ✅
  - 참조: `UI` 섹션 3.1 Step 1
  - 이름 입력으로 대체 (간소화)
  - 보안 안내 문구

- [x] **Task 5.1.1.3**: Step 2 주민등록번호 입력 UI 구현 ✅
  - 참조: `UI` 섹션 3.1 Step 2
  - 앞 6자리 + 뒤 첫자리 입력
  - 마스킹 처리 (●●●●●●)

- [x] **Task 5.1.1.4**: Step 3 급여 계좌 입력 UI 구현 ✅
  - 참조: `UI` 섹션 3.1 Step 3
  - 은행 선택 드롭다운
  - 계좌번호 입력

---

#### Story 5.1.2: 민감정보 저장 로직

> 예상 시간: 2시간

- [x] **Task 5.1.2.1**: `lib/utils/encryption.ts` 암호화 유틸 구현 ✅
  - 참조: `Rules` 섹션 7 (암호화 처리)
  - encrypt, decrypt, hashSSN 함수

- [x] **Task 5.1.2.2**: `app/(protected)/worker/onboarding/actions.ts` Server Action 구현 ✅
  - 참조: `Rules` 섹션 7.2 (근로자 정보 저장)
  - 주민번호 암호화 저장
  - 계좌번호 암호화 저장
  - worker_details 테이블 INSERT

- [x] **Task 5.1.2.3**: 온보딩 완료 후 대시보드 이동 ✅
  - 모든 Step 완료 시 /worker로 리다이렉트

---

### Epic 5.2: 근로자 대시보드

#### Story 5.2.1: 대시보드 구현

> 예상 시간: 3시간

- [x] **Task 5.2.1.1**: `app/(protected)/worker/layout.tsx` 근로자 레이아웃 생성 ✅
  - Header (알림만)
  - BottomNav
  - 역할 체크

- [x] **Task 5.2.1.2**: `app/(protected)/worker/page.tsx` 대시보드 Server Component 구현 ✅
  - 참조: `UI` 섹션 3.2 (근로자 대시보드)
  - worker_id로 계약서 조회
  - 마감 임박 정렬

- [x] **Task 5.2.1.3**: 마감 임박 표시 로직 구현 ✅
  - D-day 계산
  - D-1 빨간색, D-6 이하 노란색 배지

---

### Epic 5.3: 계약서 확인 & 서명

#### Story 5.3.1: 계약서 확인 화면

> 예상 시간: 3시간

- [x] **Task 5.3.1.1**: 계약서 공유 링크 접근 라우트 구현 ✅
  - `app/(public)/contract/sign/[token]/page.tsx`
  - share_token으로 계약서 조회
  - 로그인 유도 또는 자동 연결

- [x] **Task 5.3.1.2**: `app/(protected)/worker/contract/[id]/page.tsx` Server Component 구현 ✅
  - 계약서 데이터 조회
  - 사업자 정보 조회
  - 서명 기한 계산

- [x] **Task 5.3.1.3**: 계약 조건 카드 UI 구현 ✅
  - 참조: `UI` 섹션 3.3 (계약서 확인)
  - 시급, 근무일, 근무시간, 급여일 카드
  - "전체 계약서 보기" 토글

---

#### Story 5.3.2: 용어 설명 및 서명

> 예상 시간: 2시간

- [ ] **Task 5.3.2.1**: `components/shared/TermTooltip.tsx` 용어 설명 컴포넌트 구현
  - 참조: `UI` 섹션 3.4 (용어 설명 Tooltip)
  - 터치 시 BottomSheet 표시
  - AI 생성 설명 (또는 사전 정의)

- [x] **Task 5.3.2.2**: 근로자 서명 Server Action 구현 ✅
  - signatures 테이블 INSERT
  - contracts 상태 → 'completed'
  - completed_at 설정
  - 사업자에게 알림 (별도 Task)

- [x] **Task 5.3.2.3**: "서명하고 계약하기" 버튼 연결 ✅
  - 서명 완료 후 완료 화면 표시
  - 대시보드 이동

---

### Epic 5.4: 경력 관리

#### Story 5.4.1: 경력 목록 및 증명서

> 예상 시간: 3시간

- [x] **Task 5.4.1.1**: `app/(protected)/worker/career/page.tsx` Server Component 구현 ✅
  - 서명 완료된 계약서 목록 조회
  - 근무 기간 계산

- [x] **Task 5.4.1.2**: 경력 타임라인 UI 구현 ✅
  - 참조: `UI` 섹션 3.5 (경력 관리)
  - 사업장별 카드
  - 총 경력 계산

- [ ] **Task 5.4.1.3**: 경력증명서 PDF 생성 및 다운로드 구현
  - /api/pdf/career Route
  - 경력 정보 PDF 생성
  - 다운로드 버튼 연결

---

## Phase 6: Payment System (결제 시스템)

> 예상 시간: 9시간 | 우선순위: P1

### Epic 6.1: 결제 UI 및 로직

#### Story 6.1.1: 결제 화면 UI

> 예상 시간: 3시간

- [x] **Task 6.1.1.1**: 토스페이먼츠 SDK 설치 ✅

  ```bash
  npm install @tosspayments/tosspayments-sdk
  ```

- [x] **Task 6.1.1.2**: `app/(protected)/pricing/page.tsx` 크레딧 구매 UI 구현 ✅
  - 참조: `UI` 섹션 4.1 (크레딧 구매)
  - 상품 카드 (5개, 15개, 50개)
  - 인기 태그, 할인율 표시
  - 보유 크레딧 표시

- [x] **Task 6.1.1.3**: 상품 선택 상태 관리 및 결제 버튼 연동 ✅
  - 선택된 상품 하이라이트
  - "N원 결제하기" 버튼 텍스트 동적 변경

---

#### Story 6.1.2: 토스페이먼츠 연동

> 예상 시간: 4시간

- [x] **Task 6.1.2.1**: `app/api/payment/prepare/route.ts` 결제 준비 API 구현 ✅
  - 참조: `Rules` 섹션 6.3 (토스페이먼츠 연동)
  - 주문 ID 생성
  - payments 테이블 INSERT

- [x] **Task 6.1.2.2**: `components/payment/PaymentWidget.tsx` 결제 위젯 컴포넌트 구현 ✅
  - 토스페이먼츠 SDK 위젯 렌더링
  - 결제 요청 로직

- [x] **Task 6.1.2.3**: `app/api/payment/confirm/route.ts` 결제 확인 API 구현 ✅
  - 참조: `Rules` 섹션 6.3
  - 토스페이먼츠 승인 API 호출
  - 결제 상태 업데이트
  - 크레딧 지급 (add_credit 함수)

- [x] **Task 6.1.2.4**: 결제 성공/실패 화면 구현 ✅
  - 결제 완료 → 성공 메시지 + 대시보드 이동
  - 결제 실패 → 에러 메시지 + 재시도 버튼

---

#### Story 6.1.3: 결제 내역

> 예상 시간: 2시간

- [x] **Task 6.1.3.1**: `app/(protected)/payment-history/page.tsx` Server Component 구현 ✅
  - payments 테이블 조회 (status = completed)

- [x] **Task 6.1.3.2**: 결제 내역 목록 UI 구현 ✅
  - 참조: `PRD` 섹션 4.5.5 (결제 내역)
  - 결제일시, 상품명, 금액, 영수증 링크

---

## Phase 7: Chat Feature (채팅 기능)

> 예상 시간: 7시간 | 우선순위: P2

### Epic 7.1: 채팅 구현

#### Story 7.1.1: 채팅 목록

> 예상 시간: 3시간

- [x] **Task 7.1.1.1**: `app/(protected)/employer/chat/page.tsx` 사업자 채팅 목록 구현 ✅
  - contracts 기반 채팅방 목록
  - 마지막 메시지, 시간 표시

- [x] **Task 7.1.1.2**: `app/(protected)/worker/chat/page.tsx` 근로자 채팅 목록 구현 ✅
  - 동일 구조

- [x] **Task 7.1.1.3**: 읽지 않은 메시지 배지 구현 ✅
  - chat_messages.is_read 카운트

---

#### Story 7.1.2: 채팅방 상세

> 예상 시간: 4시간

- [x] **Task 7.1.2.1**: 채팅방 UI 구현 ✅
  - 참조: `PRD` 섹션 4.4.2 (채팅방 상세)
  - 메시지 목록 (발신/수신 구분)
  - 입력창

- [x] **Task 7.1.2.2**: 메시지 전송 Server Action 구현 ✅
  - chat_messages INSERT
  - 상대방 읽음 상태 초기화

- [x] **Task 7.1.2.3**: Supabase Realtime 구독 설정 ✅
  - chat_messages 테이블 실시간 구독
  - 새 메시지 수신 시 UI 업데이트

- [ ] **Task 7.1.2.4**: 파일 첨부 기능 구현 (P3 - 추후 구현)
  - 이미지/PDF 업로드
  - chat-files 버킷 저장

---

## Phase 8: Notification System (알림 시스템)

> 예상 시간: 7시간 | 우선순위: P2

### Epic 8.1: 알림 구현

#### Story 8.1.1: 인앱 알림

> 예상 시간: 3시간

- [x] **Task 8.1.1.1**: 알림 목록 BottomSheet UI 구현 ✅
  - 참조: `IA` 섹션 9 (모달/팝업 구조)
  - 알림 아이템 목록
  - 읽음/안읽음 구분

- [x] **Task 8.1.1.2**: 알림 읽음 처리 Server Action 구현 ✅
  - notifications.is_read 업데이트
  - markNotificationAsRead, markAllNotificationsAsRead

- [x] **Task 8.1.1.3**: Header 알림 아이콘에 뱃지 표시 ✅
  - 읽지 않은 알림 수 표시
  - 대시보드에 알림 연결

---

#### Story 8.1.2: 카카오 알림톡

> 예상 시간: 4시간

- [ ] **Task 8.1.2.1**: 알림톡 서비스 선택 및 설정
  - 솔라피 또는 NHN Cloud 선택
  - API 키 환경변수 추가

- [ ] **Task 8.1.2.2**: 알림톡 템플릿 등록
  - 계약서 전송 템플릿
  - 서명 완료 템플릿
  - 마감 임박 템플릿

- [ ] **Task 8.1.2.3**: `app/api/kakao/alimtalk/route.ts` 알림톡 API 구현
  - 참조: `Rules` 섹션 6.2 (카카오 알림톡)

- [ ] **Task 8.1.2.4**: 계약서 전송/서명 완료 시 알림톡 발송 트리거 연결

---

## Phase 9: Guest Mode (게스트 모드)

> 예상 시간: 7시간 | 우선순위: P2

### Epic 9.1: 게스트 모드 구현

#### Story 9.1.1: 게스트 기본 설정

> 예상 시간: 3시간

- [x] **Task 9.1.1.1**: `stores/guestStore.ts` 게스트 스토어 구현 ✅
  - 참조: `Rules` 섹션 5.2 (게스트 모드 스토어)
  - isGuest, guestRole, aiReviewUsed

- [x] **Task 9.1.1.2**: `app/(public)/guest/page.tsx` 게스트 역할 선택 UI 구현 ✅
  - 참조: `UI` 섹션 1.5 (둘러보기 역할 선택)

- [x] **Task 9.1.1.3**: `components/shared/GuestBanner.tsx` 게스트 배너 컴포넌트 구현 ✅
  - 참조: `UI` 섹션 1.6 (게스트 모드 배너)
  - 상단 고정, 가입하기 버튼

- [x] **Task 9.1.1.4**: `components/shared/SignupPromptSheet.tsx` 회원가입 유도 BottomSheet 구현 ✅
  - 참조: `UI` 섹션 1.7 (회원가입 유도)

---

#### Story 9.1.2: 샘플 데이터 및 제한 처리

> 예상 시간: 4시간

- [x] **Task 9.1.2.1**: `lib/constants/sampleData.ts` 샘플 데이터 정의 ✅
  - 참조: `PRD` 섹션 7.3 (샘플 데이터 정의)
  - 사장님 샘플 계약서 3개
  - 알바생 샘플 계약서 2개
  - 알바생 샘플 경력 2개

- [ ] **Task 9.1.2.2**: 대시보드에 게스트 모드 분기 처리 (P3 - 추후)
  - isGuest일 때 샘플 데이터 표시
  - GuestBanner 렌더링

- [ ] **Task 9.1.2.3**: 제한 기능 시도 시 회원가입 유도 로직 구현 (P3 - 추후)
  - 서명, 전송, PDF, 결제, 채팅 시도 시
  - SignupPromptSheet 표시

- [ ] **Task 9.1.2.4**: AI 검토 1회 체험 제한 로직 구현 (P3 - 추후)
  - aiReviewUsed 상태 체크
  - 사용 후 회원가입 유도

---

## Phase 10: Testing & Deployment (테스트 및 배포)

> 예상 시간: 13시간 | 우선순위: P3

### Epic 10.1: 테스트

#### Story 10.1.1: 테스트 환경 설정

> 예상 시간: 2시간

- [x] **Task 10.1.1.1**: Vitest 설치 및 설정 ✅

  ```bash
  npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react
  ```

- [x] **Task 10.1.1.2**: `vitest.config.ts` 설정 파일 생성 ✅

- [ ] **Task 10.1.1.3**: Playwright 설치 및 설정 (P3 - E2E 테스트 시)
  ```bash
  npm install -D @playwright/test
  npx playwright install
  ```

---

#### Story 10.1.2: 테스트 작성

> 예상 시간: 6시간

- [x] **Task 10.1.2.1**: 유틸 함수 단위 테스트 작성 ✅
  - format.ts, validation.ts

- [x] **Task 10.1.2.2**: 주요 컴포넌트 테스트 작성 ✅
  - Button, Badge 등

- [ ] **Task 10.1.2.3**: 사업자 계약서 작성 플로우 E2E 테스트 작성
  - 로그인 → 작성 → 서명 → 공유

- [ ] **Task 10.1.2.4**: 근로자 서명 플로우 E2E 테스트 작성
  - 링크 접근 → 로그인 → 확인 → 서명

---

### Epic 10.2: 배포

#### Story 10.2.1: 배포 설정

> 예상 시간: 3시간

- [ ] **Task 10.2.1.1**: Vercel 프로젝트 생성 및 연결
  - GitHub 연동
  - 환경변수 설정

- [ ] **Task 10.2.1.2**: 도메인 연결 및 SSL 설정

- [ ] **Task 10.2.1.3**: Supabase Production 프로젝트 설정
  - 새 프로젝트 생성 또는 기존 프로젝트 사용
  - 마이그레이션 적용

- [ ] **Task 10.2.1.4**: Production 환경변수 설정
  - Vercel에 Production 환경변수 추가

---

#### Story 10.2.2: 모니터링

> 예상 시간: 2시간

- [ ] **Task 10.2.2.1**: Vercel Analytics 활성화

- [ ] **Task 10.2.2.2**: Sentry 설치 및 설정

  ```bash
  npx @sentry/wizard@latest -i nextjs
  ```

- [ ] **Task 10.2.2.3**: 에러 바운더리 및 로깅 설정

---

## 📊 전체 일정 요약

| Phase                   | 예상 시간   | 우선순위 | 완료 기준                             |
| ----------------------- | ----------- | -------- | ------------------------------------- |
| Phase 1: Foundation     | 10시간      | P0       | DB 마이그레이션 완료, 타입 생성 완료  |
| Phase 2: Authentication | 10시간      | P0       | 카카오 로그인/로그아웃 동작           |
| Phase 3: Core UI        | 12시간      | P0       | 모든 기본 컴포넌트 구현               |
| Phase 4: Employer       | 34시간      | P0       | 계약서 작성 → 서명 → 공유 플로우 완성 |
| Phase 5: Worker         | 16시간      | P0       | 계약서 확인 → 서명 플로우 완성        |
| Phase 6: Payment        | 9시간       | P1       | 크레딧 구매 동작                      |
| Phase 7: Chat           | 7시간       | P2       | 실시간 채팅 동작                      |
| Phase 8: Notification   | 7시간       | P2       | 알림톡 발송 동작                      |
| Phase 9: Guest Mode     | 7시간       | P2       | 게스트 체험 모드 동작                 |
| Phase 10: Testing       | 13시간      | P3       | 주요 플로우 테스트 통과               |
| **Total**               | **125시간** | -        | 약 3-4주 (풀타임 기준)                |

---

## 🚀 MVP 우선순위

### Week 1-2: MVP 필수 (P0)

1. Phase 1: Foundation
2. Phase 2: Authentication
3. Phase 3: Core UI Components
4. Phase 4: Epic 4.1-4.3 (대시보드, 계약서 작성, 미리보기/서명)
5. Phase 5: Epic 5.1-5.3 (온보딩, 대시보드, 서명)

### Week 2-3: 핵심 기능 (P1)

6. Phase 4: Epic 4.4-4.6 (AI 검토, 공유, 관리)
7. Phase 6: Payment

### Week 3-4: 부가 기능 (P2)

8. Phase 4: Epic 4.7 (폴더)
9. Phase 5: Epic 5.4 (경력)
10. Phase 7: Chat
11. Phase 8: Notification
12. Phase 9: Guest Mode

### Week 4+: 안정화 (P3)

13. Phase 10: Testing & Deployment

---

---

## 📝 Amendment 1: UI/UX 개선 작업 계획 (2026년 1월 24일)

> **추가일**: 2026년 1월 24일  
> **변경 사유**: 네비게이션 메뉴 추가 및 대시보드 레이아웃 개선  
> **우선순위**: P0 (핵심 UX 개선)

---

### Epic A1.1: 헤더 네비게이션 개선

> 예상 시간: 4시간

#### Story A1.1.1: 헤더 컴포넌트 수정

> 예상 시간: 1시간

- [ ] **Task A1.1.1.1**: `components/layout/Header.tsx` 수정
  - 참조: `UI_Spec` Amendment A1.1.2
  - 작업 내용:
    - 좌측 프로필 이모지 제거
    - 우측에 햄버거 메뉴 아이콘 (☰) 추가
    - Props에 `onMenuOpen` 핸들러 추가
    - 크레딧 표시 스타일 변경 (💎 아이콘 추가)

- [ ] **Task A1.1.1.2**: 햄버거 메뉴 아이콘 SVG 생성
  - `public/images/icons/menu.svg` 또는 Heroicons 사용
  - 3줄 가로선 아이콘

---

#### Story A1.1.2: 메뉴 시트 컴포넌트 구현

> 예상 시간: 2시간

- [ ] **Task A1.1.2.1**: `components/layout/MenuSheet.tsx` 신규 생성
  - 참조: `UI_Spec` Amendment A1.2
  - 작업 내용:
    - 우측에서 슬라이드하는 사이드시트
    - 프로필 영역 (아바타, 이름, 이메일)
    - 메뉴 항목 목록 (아이콘 + 텍스트 + 화살표)
    - 로그아웃 버튼 (빨간색)
    - 백드롭 클릭 시 닫기
    - 애니메이션 (slide-in-right)

- [ ] **Task A1.1.2.2**: Tailwind 애니메이션 추가
  - `tailwind.config.ts`에 `slide-in-right` 키프레임 추가

- [ ] **Task A1.1.2.3**: 메뉴 시트에서 사용자 정보 표시 로직 구현
  - Server Component에서 profile 데이터 조회
  - 메뉴시트에 props로 전달

---

#### Story A1.1.3: 메뉴 시트 연동

> 예상 시간: 1시간

- [ ] **Task A1.1.3.1**: `app/(protected)/employer/layout.tsx` 수정
  - MenuSheet 상태 관리 (useState)
  - Header와 MenuSheet 연결
  - profile 데이터 조회 및 전달

- [ ] **Task A1.1.3.2**: `app/(protected)/worker/layout.tsx` 수정
  - 동일한 패턴 적용
  - 근로자 전용 메뉴 항목 표시 (크레딧 충전 제외)

---

### Epic A1.2: 대시보드 레이아웃 변경

> 예상 시간: 5시간

#### Story A1.2.1: 사업자 대시보드 재구성

> 예상 시간: 3시간

- [ ] **Task A1.2.1.1**: `components/shared/CreditCard.tsx` 신규 생성
  - 참조: `UI_Spec` Amendment A1.3.2
  - 그라데이션 배경의 크레딧 표시 카드
  - 충전 버튼 (→ /pricing)

- [ ] **Task A1.2.1.2**: `app/(protected)/employer/employer-dashboard.tsx` 수정
  - TabBar 제거
  - 섹션 기반 레이아웃으로 변경
  - "대기중인 계약서" 섹션 구현
  - "완료된 계약서" 섹션 구현
  - 각 섹션에 카운트 표시

- [ ] **Task A1.2.1.3**: 폴더 버튼 UI 추가
  - 완료 섹션 제목 우측에 [📁 폴더] 버튼
  - 클릭 시 `/employer/folders`로 이동

- [ ] **Task A1.2.1.4**: `app/(protected)/employer/page.tsx` 데이터 페칭 수정
  - pending, completed 계약서를 병렬로 조회
  - 참조: `rules.md` Amendment A1.4

---

#### Story A1.2.2: 근로자 대시보드 재구성

> 예상 시간: 2시간

- [ ] **Task A1.2.2.1**: `app/(protected)/worker/worker-dashboard.tsx` 수정
  - 사업자 대시보드와 동일한 패턴 적용
  - 크레딧 카드 제외
  - TabBar 제거
  - 섹션 기반 레이아웃

- [ ] **Task A1.2.2.2**: `app/(protected)/worker/page.tsx` 데이터 페칭 수정
  - pending, completed 계약서를 병렬로 조회

---

### Epic A1.3: 프로필 페이지 구현

> 예상 시간: 3시간

#### Story A1.3.1: 프로필 페이지 UI

> 예상 시간: 2시간

- [ ] **Task A1.3.1.1**: `app/(protected)/profile/page.tsx` 신규 생성
  - 참조: `UI_Spec` Amendment A1.4
  - 프로필 헤더 (아바타, 이름, 이메일)
  - 내 정보 섹션 (이름, 연락처)
  - 역할 변경 섹션
  - 앱 설정 섹션 (알림)
  - 로그아웃 버튼

- [ ] **Task A1.3.1.2**: 프로필 정보 조회 Server Component 구현
  - profiles 테이블에서 현재 사용자 정보 조회

---

#### Story A1.3.2: 프로필 수정 기능

> 예상 시간: 1시간

- [ ] **Task A1.3.2.1**: `app/(protected)/profile/actions.ts` Server Actions 구현
  - updateProfile: 이름, 연락처 수정
  - changeRole: 역할 변경 (사장님 ↔ 알바생)

- [ ] **Task A1.3.2.2**: 역할 변경 ConfirmSheet 연동
  - 역할 변경 시 확인 모달 표시
  - 변경 후 해당 역할 대시보드로 리다이렉트

---

### Epic A1.4: 법적 문서 페이지 (선택)

> 예상 시간: 2시간 | 우선순위: P2

#### Story A1.4.1: 이용약관 및 개인정보처리방침

> 예상 시간: 2시간

- [ ] **Task A1.4.1.1**: `app/(public)/terms/page.tsx` 생성
  - 이용약관 텍스트 표시
  - 정적 페이지

- [ ] **Task A1.4.1.2**: `app/(public)/privacy/page.tsx` 생성
  - 개인정보처리방침 텍스트 표시
  - 정적 페이지

---

## 📊 Amendment 1 일정 요약

| Epic                         | 예상 시간  | 우선순위 | 완료 기준                           |
| ---------------------------- | ---------- | -------- | ----------------------------------- |
| A1.1: 헤더 네비게이션 개선   | 4시간      | P0       | 햄버거 메뉴 클릭 시 사이드시트 열림 |
| A1.2: 대시보드 레이아웃 변경 | 5시간      | P0       | 탭 제거, 섹션 기반 UI 동작          |
| A1.3: 프로필 페이지 구현     | 3시간      | P0       | 프로필 조회/수정/역할변경 동작      |
| A1.4: 법적 문서 페이지       | 2시간      | P2       | (선택) 약관 페이지 표시             |
| **Total**                    | **14시간** | -        | 약 2일 (풀타임 기준)                |

---

## 🚀 Amendment 1 실행 순서

### 1단계: 헤더 및 메뉴 시트 (4시간)

1. Task A1.1.1.1: Header 컴포넌트 수정
2. Task A1.1.2.1: MenuSheet 컴포넌트 생성
3. Task A1.1.2.2: Tailwind 애니메이션 추가
4. Task A1.1.3.1, A1.1.3.2: 레이아웃에 연동

### 2단계: 대시보드 재구성 (5시간)

1. Task A1.2.1.1: CreditCard 컴포넌트 생성
2. Task A1.2.1.2, A1.2.1.3: 사업자 대시보드 UI 변경
3. Task A1.2.1.4: 데이터 페칭 수정
4. Task A1.2.2.1, A1.2.2.2: 근로자 대시보드 변경

### 3단계: 프로필 페이지 (3시간)

1. Task A1.3.1.1, A1.3.1.2: 프로필 페이지 UI
2. Task A1.3.2.1, A1.3.2.2: 프로필 수정 기능

### 4단계 (선택): 법적 문서 (2시간)

1. Task A1.4.1.1, A1.4.1.2: 약관 페이지

---

> **Amendment 1 끝**

---

## 📝 Amendment 2: 게스트 모드 및 환영 메시지 (2026년 1월 24일)

> **추가일**: 2026년 1월 24일  
> **변경 사유**: 게스트 모드 지원 및 환영 메시지 개선  
> **우선순위**: P0 (핵심 기능)  
> **상태**: ✅ 완료

---

### Epic A2.1: 환영 메시지 개선

> 예상 시간: 30분 | **상태: ✅ 완료**

#### Story A2.1.1: 역할 선택 페이지 닉네임 표시

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A2.1.1.1**: `app/(protected)/select-role/page.tsx` 수정
  - 카카오 `user_metadata`에서 닉네임 추출
  - RoleSelector에 userName prop 전달

- [x] **Task A2.1.1.2**: `app/(protected)/select-role/role-selector.tsx` 수정
  - userName prop 추가
  - "닉네임님, 환영합니다! 👋" 메시지 표시

---

### Epic A2.2: 게스트 모드 지원

> 예상 시간: 2시간 | **상태: ✅ 완료**

#### Story A2.2.1: 쿠키 기반 게스트 저장소

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A2.2.1.1**: `stores/guestStore.ts` 수정
  - localStorage → 쿠키 기반 저장소로 변경
  - `createJSONStorage` + `cookieStorage` 사용
  - 7일 유효기간 설정

---

#### Story A2.2.2: Protected Layout 게스트 체크

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A2.2.2.1**: `app/(protected)/layout.tsx` 수정
  - 게스트 쿠키 체크 함수 추가
  - 게스트 모드일 경우 인증 스킵

- [x] **Task A2.2.2.2**: `app/(protected)/employer/layout.tsx` 수정
  - 게스트 모드 체크 추가
  - guestRole === 'employer' 확인

- [x] **Task A2.2.2.3**: `app/(protected)/worker/layout.tsx` 수정
  - 게스트 모드 체크 추가
  - guestRole === 'worker' 확인

---

#### Story A2.2.3: 게스트용 샘플 데이터

> 예상 시간: 1시간 | **상태: ✅ 완료**

- [x] **Task A2.2.3.1**: `app/(protected)/employer/page.tsx` 수정
  - 게스트 모드 체크 추가
  - `GUEST_SAMPLE_CONTRACTS` 샘플 데이터 정의
  - 게스트일 경우 샘플 데이터 반환

- [x] **Task A2.2.3.2**: `app/(protected)/worker/page.tsx` 수정
  - 게스트 모드 체크 추가
  - 근로자용 샘플 계약서 데이터 정의
  - 게스트일 경우 샘플 데이터 반환

- [x] **Task A2.2.3.3**: `app/(public)/guest/page.tsx` 수정
  - 쿠키 설정 후 full page reload로 변경
  - `window.location.href` 사용

---

## 📊 Amendment 2 완료 요약

| Task     | 상태 | 설명                         |
| -------- | ---- | ---------------------------- |
| A2.1.1.1 | ✅   | 역할 선택 페이지 닉네임 전달 |
| A2.1.1.2 | ✅   | 환영 메시지 표시             |
| A2.2.1.1 | ✅   | 쿠키 기반 guestStore         |
| A2.2.2.1 | ✅   | protected layout 게스트 체크 |
| A2.2.2.2 | ✅   | employer layout 게스트 체크  |
| A2.2.2.3 | ✅   | worker layout 게스트 체크    |
| A2.2.3.1 | ✅   | employer 샘플 데이터         |
| A2.2.3.2 | ✅   | worker 샘플 데이터           |
| A2.2.3.3 | ✅   | guest 페이지 수정            |

---

> **Amendment 2 끝**

---

## 📝 Amendment 3: 폴더 모달 및 닉네임 표시 (2026년 1월 24일)

> **추가일**: 2026년 1월 24일  
> **변경 사유**: UX 개선 - 폴더 모달, 헤더 닉네임, 게스트 상세 페이지  
> **우선순위**: P1  
> **상태**: ✅ 완료

---

### Epic A3.1: 폴더 관리 모달

> 예상 시간: 1시간 | **상태: ✅ 완료**

#### Story A3.1.1: FolderModal 컴포넌트 생성

> 예상 시간: 1시간 | **상태: ✅ 완료**

- [x] **Task A3.1.1.1**: `components/folder/FolderModal.tsx` 생성
  - BottomSheet 기반 모달
  - 폴더 목록, 생성, 수정, 삭제 UI
  - 색상 선택 팔레트 (8가지)

- [x] **Task A3.1.1.2**: `employer-dashboard.tsx`에 FolderModal 연동
  - 폴더 관리 버튼 클릭 → 모달 오픈
  - router.push 대신 state로 관리

- [x] **Task A3.1.1.3**: Server Actions 수정 (color 지원 준비)
  - createFolder, updateFolder에 color 매개변수 추가
  - DB 컬럼 추가 전까지 주석 처리

---

### Epic A3.2: 헤더 닉네임 표시

> 예상 시간: 30분 | **상태: ✅ 완료**

#### Story A3.2.1: Header 컴포넌트 수정

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A3.2.1.1**: `components/layout/Header.tsx` 수정
  - userName prop 추가
  - userName이 있으면 "{닉네임}님 👋" 표시, 없으면 "싸인해주세요"

- [x] **Task A3.2.1.2**: `employer-dashboard.tsx`에서 userName 전달
  - Header에 profile.name 전달

---

### Epic A3.3: 게스트 모드 계약서 상세

> 예상 시간: 30분 | **상태: ✅ 완료**

#### Story A3.3.1: 샘플 계약서 상세 데이터

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A3.3.1.1**: `lib/constants/sampleData.ts` 확장
  - SAMPLE_CONTRACT_DETAILS 객체 추가
  - 근무조건, 급여, 서명 등 상세 정보 포함

- [x] **Task A3.3.1.2**: `employer/contract/[id]/page.tsx` 수정
  - 게스트 모드 체크 함수 추가
  - 샘플 ID로 접근 시 SAMPLE_CONTRACT_DETAILS에서 조회

- [x] **Task A3.3.1.3**: `contract-detail.tsx` 게스트 모드 지원
  - isGuestMode prop 추가
  - 게스트 모드에서 삭제/재전송 비활성화

---

## 📊 Amendment 3 완료 요약

| Task     | 상태 | 설명                        |
| -------- | ---- | --------------------------- |
| A3.1.1.1 | ✅   | FolderModal 컴포넌트 생성   |
| A3.1.1.2 | ✅   | 대시보드에 모달 연동        |
| A3.1.1.3 | ✅   | Server Actions 수정         |
| A3.2.1.1 | ✅   | Header에 userName prop      |
| A3.2.1.2 | ✅   | 대시보드에서 닉네임 전달    |
| A3.3.1.1 | ✅   | 샘플 상세 데이터 추가       |
| A3.3.1.2 | ✅   | 상세 페이지 게스트 지원     |
| A3.3.1.3 | ✅   | contract-detail 게스트 모드 |

---

### 📌 향후 작업 (Backlog)

#### DB 마이그레이션 필요

```sql
ALTER TABLE folders ADD COLUMN color text DEFAULT '#3B82F6';
```

마이그레이션 적용 후 코드에서 주석 해제 필요:

- `folders/actions.ts`: createFolder, updateFolder의 color 저장
- `employer/page.tsx`: folders.color 조회

---

> **Amendment 3 끝**

---

## 📝 Amendment 4: 대시보드 UI 개편 (2026년 1월 24일)

> **추가일**: 2026년 1월 24일  
> **변경 사유**: 대시보드 UX 개선 - 통합 리스트, 편집 모드, 폴더 이동  
> **우선순위**: P0  
> **상태**: ✅ 완료

---

### Epic A4.1: 대시보드 레이아웃 재구성

> 예상 시간: 2시간 | **상태: ✅ 완료**

#### Story A4.1.1: 헤더 및 레이아웃 변경

- [x] **Task A4.1.1.1**: 헤더 분리 ("환영합니다" + 알림 + 메뉴)
- [x] **Task A4.1.1.2**: 닉네임 큰 글씨로 분리 (h1)
- [x] **Task A4.1.1.3**: 크레딧 뱃지 추가 (🎟️ N건 남음)
- [x] **Task A4.1.1.4**: FAB → 큰 파란 버튼으로 변경
- [x] **Task A4.1.1.5**: 2개 섹션 → 1개 통합 리스트 (진행 중/완료)

---

### Epic A4.2: ContractCard 재디자인

> 예상 시간: 1시간 | **상태: ✅ 완료**

#### Story A4.2.1: 카드 UI 변경

- [x] **Task A4.2.1.1**: work_location 표시 (시급 대신)
- [x] **Task A4.2.1.2**: 상태별 뱃지 (임시저장/서명 대기/완료)
- [x] **Task A4.2.1.3**: 수정 버튼 (draft, pending만)
- [x] **Task A4.2.1.4**: 편집 모드 체크박스 지원

---

### Epic A4.3: 편집 모드 구현

> 예상 시간: 2시간 | **상태: ✅ 완료**

#### Story A4.3.1: 편집 모드 UI

- [x] **Task A4.3.1.1**: EditModeHeader (선택 카운트, 전체 선택, 닫기)
- [x] **Task A4.3.1.2**: ActionBar (정렬, 이동, 삭제 버튼)
- [x] **Task A4.3.1.3**: 다중 선택 상태 관리 (selectedIds Set)

#### Story A4.3.2: 정렬 기능

- [x] **Task A4.3.2.1**: 최신순 정렬 (created_at DESC)
- [x] **Task A4.3.2.2**: 가게별 정렬 (work_location ASC)

---

### Epic A4.4: 폴더 이동 기능

> 예상 시간: 1.5시간 | **상태: ✅ 완료**

#### Story A4.4.1: MoveFolderSheet 컴포넌트

- [x] **Task A4.4.1.1**: `components/folder/MoveFolderSheet.tsx` 생성
- [x] **Task A4.4.1.2**: 폴더 목록 표시
- [x] **Task A4.4.1.3**: 새 폴더 만들기 모드
- [x] **Task A4.4.1.4**: moveContractToFolder 연동

---

### Epic A4.5: 데이터 수정

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A4.5.1**: contracts 쿼리에 work_location 추가
- [x] **Task A4.5.2**: 게스트 샘플 데이터에 work_location 추가

---

## 📊 Amendment 4 완료 요약

| 기능              | 상태 | 설명                                   |
| ----------------- | ---- | -------------------------------------- |
| 대시보드 레이아웃 | ✅   | 헤더, 닉네임, 크레딧, 버튼 재구성      |
| ContractCard      | ✅   | 근무지, 상태 뱃지, 수정 버튼, 체크박스 |
| 편집 모드         | ✅   | 다중 선택, 정렬, 이동, 삭제            |
| 폴더 이동         | ✅   | MoveFolderSheet, 새 폴더 생성          |
| 정렬              | ✅   | 최신순, 가게별                         |

---

> **Amendment 4 끝**

---

## 📝 Amendment 5: 사업장 규모 선택 UI 개선 (2026년 1월 24일)

> **추가일**: 2026년 1월 24일  
> **변경 사유**: 계약서 작성 Step 1 UX 개선  
> **우선순위**: P1  
> **상태**: ✅ 완료

---

### Epic A5.1: Step1BusinessSize 리디자인

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A5.1.1**: 질문/설명 텍스트 변경
- [x] **Task A5.1.2**: 옵션 라벨/설명 변경
- [x] **Task A5.1.3**: 아이콘 추가 (건물, 사람들)
- [x] **Task A5.1.4**: 선택 시 스타일 변경 (파란 아이콘 배경)
- [x] **Task A5.1.5**: 안내 박스 추가 (초록/노랑)

---

## 📊 Amendment 5 완료 요약

| Task   | 상태 | 설명                                       |
| ------ | ---- | ------------------------------------------ |
| A5.1.1 | ✅   | 질문: "사장님, 가게에 직원이 몇 명인가요?" |
| A5.1.2 | ✅   | 옵션 설명: "소규모 가게", "중소규모 이상"  |
| A5.1.3 | ✅   | 건물/사람 SVG 아이콘                       |
| A5.1.4 | ✅   | 선택 시 파란 배경 + 흰색 아이콘            |
| A5.1.5 | ✅   | 초록/노랑 안내 박스                        |

---

> **Amendment 5 끝**

---

## 📝 Amendment 6: 급여 형태 선택 UI 개선 (2026년 1월 24일)

> **추가일**: 2026년 1월 24일  
> **변경 사유**: 시급/월급 선택 기능 및 주휴수당 카드 UI 개선  
> **우선순위**: P1  
> **상태**: ✅ 완료

---

### Epic A6.1: Step3Wage UI 전면 리디자인

> 예상 시간: 1시간 | **상태: ✅ 완료**

- [x] **Task A6.1.1**: contractFormStore에 wageType, monthlyWage 필드 추가
- [x] **Task A6.1.2**: 시급/월급 선택 카드 UI 구현
- [x] **Task A6.1.3**: 시급 입력 UI (둥근 박스 스타일)
- [x] **Task A6.1.4**: 월급 입력 UI 구현
- [x] **Task A6.1.5**: 주휴수당 체크박스 카드형 UI 구현
- [x] **Task A6.1.6**: 주휴수당 체크 시 최저시급 안내 추가

---

### Epic A6.2: 최저시급 업데이트

> 예상 시간: 15분 | **상태: ✅ 완료**

- [x] **Task A6.2.1**: lib/utils/validation.ts - MINIMUM_WAGE_2026 = 10360
- [x] **Task A6.2.2**: app/api/ai-review/route.ts - MINIMUM_WAGE = 10360
- [x] **Task A6.2.3**: lib/constants/sampleData.ts - hourly_wage 업데이트
- [x] **Task A6.2.4**: 테스트 파일 최저시급 업데이트

---

### Epic A6.3: 스키마 문서화 (DB 마이그레이션 대기)

> 예상 시간: 10분 | **상태: ✅ 완료**

- [x] **Task A6.3.1**: schema.md에 wage_type, monthly_wage 컬럼 문서화
- [ ] **Task A6.3.2**: Supabase 마이그레이션 (사용자 수동 실행 필요)

---

## 📊 Amendment 6 완료 요약

| Task     | 상태 | 설명                                    |
| -------- | ---- | --------------------------------------- |
| A6.1.1   | ✅   | wageType: 'hourly' \| 'monthly' 추가    |
| A6.1.2   | ✅   | 시급/월급 2열 카드 선택                 |
| A6.1.3   | ✅   | 시급 입력 (둥근 박스 + 최저시급 안내)   |
| A6.1.4   | ✅   | 월급 입력 필드                          |
| A6.1.5   | ✅   | 주휴수당 카드형 체크박스                |
| A6.1.6   | ✅   | 체크 시 "12,432원 이상이어야 해요" 안내 |
| A6.2.1~4 | ✅   | 최저시급 10,030 → 10,360원              |
| A6.3.1   | ✅   | 스키마 문서화 완료                      |

---

> **Amendment 6 끝**

---

## 📝 Amendment 7: 근무일 설정 UI 개선 (2026년 1월 24일)

> **추가일**: 2026년 1월 24일  
> **변경 사유**: 주 N일 / 특정 요일 토글 방식으로 UX 개선  
> **우선순위**: P1  
> **상태**: ✅ 완료

---

### Epic A7.1: Step5WorkDays UI 전면 리디자인

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A7.1.1**: 질문 텍스트 변경 ("근무일을 어떻게 정할까요?")
- [x] **Task A7.1.2**: 모드 토글 UI 구현 ("주 N일" / "특정 요일")
- [x] **Task A7.1.3**: 주 N일 모드 - 칩 버튼 7개 (주1일~주7일)
- [x] **Task A7.1.4**: 특정 요일 모드 - 정사각형 칩 버튼 7개
- [x] **Task A7.1.5**: 선택된 요일 표시 라벨 ("선택: 월, 화, ...")
- [x] **Task A7.1.6**: 이전 버튼 제거 (이미지 기준)

---

## 📊 Amendment 7 완료 요약

| Task   | 상태 | 설명                              |
| ------ | ---- | --------------------------------- |
| A7.1.1 | ✅   | 질문: "근무일을 어떻게 정할까요?" |
| A7.1.2 | ✅   | 2열 토글: "주 N일" / "특정 요일"  |
| A7.1.3 | ✅   | 주1일~주7일 칩 버튼 (4열 + 3열)   |
| A7.1.4 | ✅   | 월~일 정사각형 칩 (7열)           |
| A7.1.5 | ✅   | "선택: 월, 화, 수, 목, 금" 표시   |
| A7.1.6 | ✅   | 이전 버튼 제거, 다음 버튼만       |

---

> **Amendment 7 끝**

---

## 📝 Amendment 8: 주소 검색 Daum 우편번호 연동 (2026년 1월 24일)

> **추가일**: 2026년 1월 24일  
> **변경 사유**: 다음(Daum) 우편번호 서비스 연동  
> **우선순위**: P1  
> **상태**: ✅ 완료

---

### Epic A8.1: Step8Location Daum 우편번호 연동

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A8.1.1**: Daum Postcode 스크립트 동적 로드
- [x] **Task A8.1.2**: 주소 검색 버튼 UI 구현
- [x] **Task A8.1.3**: embed 방식 우편번호 검색창 표시
- [x] **Task A8.1.4**: 주소 선택 시 자동 입력 처리
- [x] **Task A8.1.5**: 상세주소 입력 필드 추가
- [x] **Task A8.1.6**: 이전 버튼 제거

---

## 📊 Amendment 8 완료 요약

| Task   | 상태 | 설명                                |
| ------ | ---- | ----------------------------------- |
| A8.1.1 | ✅   | postcode.v2.js 동적 로드            |
| A8.1.2 | ✅   | "주소 검색" 버튼 + 검색 아이콘      |
| A8.1.3 | ✅   | embed 방식 (400px 높이)             |
| A8.1.4 | ✅   | 도로명/지번 주소 + 건물명 자동 입력 |
| A8.1.5 | ✅   | 상세주소 입력 필드                  |
| A8.1.6 | ✅   | 다음 버튼만 표시                    |

---

> **Amendment 8 끝**

---

## 📝 Amendment 9: 임금 지급일 UI 개선 (2026년 1월 24일)

> **추가일**: 2026년 1월 24일  
> **변경 사유**: 당월/익월 지급 및 날짜 그리드 UI  
> **우선순위**: P1  
> **상태**: ✅ 완료

---

### Epic A9.1: Step10PayDay UI 전면 리디자인

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A9.1.1**: 질문 텍스트 변경 ("임금은 언제 지급하나요?")
- [x] **Task A9.1.2**: 당월/익월 지급 토글 구현
- [x] **Task A9.1.3**: 말일 지급 체크박스 구현
- [x] **Task A9.1.4**: 날짜 그리드 (1~28일) 구현
- [x] **Task A9.1.5**: 말일 체크 시 그리드 비활성화
- [x] **Task A9.1.6**: 이전 버튼 제거, 다음 버튼만

### Epic A9.2: contractFormStore 필드 추가

> 예상 시간: 10분 | **상태: ✅ 완료**

- [x] **Task A9.2.1**: paymentTiming 필드 추가
- [x] **Task A9.2.2**: isLastDayPayment 필드 추가

---

## 📊 Amendment 9 완료 요약

| Task   | 상태 | 설명                                           |
| ------ | ---- | ---------------------------------------------- |
| A9.1.1 | ✅   | 질문: "임금은 언제 지급하나요?"                |
| A9.1.2 | ✅   | 당월/익월 2열 토글                             |
| A9.1.3 | ✅   | 말일 지급 원형 체크박스                        |
| A9.1.4 | ✅   | 1~28일 그리드 (7열 × 4행)                      |
| A9.1.5 | ✅   | 말일 체크 시 그리드 비활성화                   |
| A9.1.6 | ✅   | 다음 버튼만 표시                               |
| A9.2.1 | ✅   | paymentTiming: 'current_month' \| 'next_month' |
| A9.2.2 | ✅   | isLastDayPayment: boolean                      |

---

> **Amendment 9 끝**

---

## 📝 Amendment 10: 업종별 업무 키워드 추천 (2026년 1월 24일)

> **추가일**: 2026년 1월 24일  
> **변경 사유**: 업종 선택 + 업무 키워드 추천  
> **우선순위**: P1  
> **상태**: ✅ 완료

---

### Epic A10.1: Step9JobDescription 리디자인

> 예상 시간: 45분 | **상태: ✅ 완료**

- [x] **Task A10.1.1**: 업종 선택 바텀시트 구현
- [x] **Task A10.1.2**: 업종별 키워드 데이터 정의 (6개 업종)
- [x] **Task A10.1.3**: 업종 표시 영역 + "업종 변경" 버튼
- [x] **Task A10.1.4**: 키워드 토글 칩 버튼
- [x] **Task A10.1.5**: 추가 업무 입력 텍스트 영역
- [x] **Task A10.1.6**: contractFormStore에 businessType 필드 추가

---

## 📊 Amendment 10 완료 요약

| Task    | 상태 | 설명                                       |
| ------- | ---- | ------------------------------------------ |
| A10.1.1 | ✅   | 6개 업종 바텀시트                          |
| A10.1.2 | ✅   | 식당, 카페, 편의점, 소매점, 미용실, 사무직 |
| A10.1.3 | ✅   | 아이콘 + 라벨 + 업종 변경 버튼             |
| A10.1.4 | ✅   | 토글 가능한 키워드 칩                      |
| A10.1.5 | ✅   | 추가 입력 텍스트 영역                      |
| A10.1.6 | ✅   | businessType 필드 추가                     |

---

> **Amendment 10 끝**

---

## 📝 Amendment 11: 휴대폰 번호 매칭 기능 (2026년 1월 25일)

> **추가일**: 2026년 1월 25일  
> **변경 사유**: 근로자 본인 확인을 위한 무료 휴대폰 번호 매칭  
> **우선순위**: P0 (MVP 필수)  
> **상태**: ✅ 완료

---

### Epic A11.1: DB 마이그레이션

> 예상 시간: 10분 | **상태: ✅ 완료**

- [x] **Task A11.1.1**: contracts 테이블에 worker_phone 컬럼 추가
  - Supabase MCP로 마이그레이션 적용 완료
  - 인덱스 추가: `idx_contracts_worker_phone`

---

### Epic A11.2: 계약서 작성 폼 수정

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A11.2.1**: `stores/contractFormStore.ts`에 workerPhone 필드 추가
- [x] **Task A11.2.2**: `lib/utils/validation.ts`에 휴대폰 번호 유효성 검사 추가
  - phoneRegex: 한국 휴대폰 번호 형식
  - normalizePhone: 하이픈 제거
  - formatPhone: 포맷팅 (010-0000-0000)
- [x] **Task A11.2.3**: `Step2WorkerName.tsx` 수정
  - 휴대폰 번호 입력 필드 추가
  - 자동 하이픈 포맷팅
  - 안내 메시지: "📱 이 번호로 계약서 서명 링크가 전송돼요"

---

### Epic A11.3: 서명 페이지 수정

> 예상 시간: 1시간 | **상태: ✅ 완료**

- [x] **Task A11.3.1**: `worker-sign.tsx`에 휴대폰 번호 확인 단계 추가
  - 새로운 단계: `verify_phone`
  - 마스킹된 힌트 표시 (010-\*\*\*\*-5678)
  - 번호 일치 확인 로직
- [x] **Task A11.3.2**: 번호 일치 시 계약서 보기로 이동
- [x] **Task A11.3.3**: 서명 완료 화면 개선
  - 회원가입 혜택 안내
  - "3초만에 가입하기" 버튼

---

### Epic A11.4: 타입 업데이트

> 예상 시간: 10분 | **상태: ✅ 완료**

- [x] **Task A11.4.1**: `types/database.ts` 업데이트
  - contracts.Row에 worker_phone 추가
  - contracts.Insert에 worker_phone 추가
  - contracts.Update에 worker_phone 추가

---

## 📊 Amendment 11 완료 요약

| Task    | 상태 | 설명                           |
| ------- | ---- | ------------------------------ |
| A11.1.1 | ✅   | DB 마이그레이션 (worker_phone) |
| A11.2.1 | ✅   | contractFormStore 수정         |
| A11.2.2 | ✅   | 휴대폰 번호 validation         |
| A11.2.3 | ✅   | Step2 UI 수정                  |
| A11.3.1 | ✅   | 본인 확인 단계 추가            |
| A11.3.2 | ✅   | 번호 일치 시 이동              |
| A11.3.3 | ✅   | 서명 완료 화면 개선            |
| A11.4.1 | ✅   | TypeScript 타입 업데이트       |

---

### 📌 플로우 요약

```
1. 사장님: Step 2에서 이름 + 휴대폰 번호 입력
         ↓
2. 카카오톡으로 서명 링크 공유
         ↓
3. 근로자: 링크 클릭 → 본인 확인 화면
   - 마스킹된 힌트 표시 (010-****-5678)
   - 휴대폰 번호 입력
         ↓
4. 번호 일치 → 계약서 보기
         ↓
5. 서명하기 → 카카오 로그인 필요
         ↓
6. 로그인 → 서명 완료
         ↓
7. 🎉 축하 화면 + 회원가입 유도
```

---

> **Amendment 11 끝**

---

## 📝 Amendment 12: UX 개선 및 프리미엄 UI (2026년 1월 25일)

> **추가일**: 2026년 1월 25일  
> **변경 사유**: 사용자 피드백 기반 UX 개선 및 프리미엄 디자인 적용  
> **우선순위**: P1  
> **상태**: ✅ 완료

---

### Epic A12.1: 휴게시간 없음 옵션

> 예상 시간: 10분 | **상태: ✅ 완료**

- [x] **Task A12.1.1**: Step7BreakTime에 0분(없음) 옵션 추가
  - BREAK_OPTIONS 배열에 0 추가
  - 버튼 라벨 "없음"으로 표시
  - 그리드 레이아웃으로 변경 (2열)

---

### Epic A12.2: 업종 선택 모달 자동 열림

> 예상 시간: 15분 | **상태: ✅ 완료**

- [x] **Task A12.2.1**: Step9JobDescription에서 업종 미선택 시 모달 자동 열림
  - useEffect로 businessType null 체크
  - 컴포넌트 마운트 시 BottomSheet 자동 오픈
  - 이미 선택된 경우 변경 가능하도록 유지

---

### Epic A12.3: 홈 버튼 및 임시저장 기능

> 예상 시간: 1시간 | **상태: ✅ 완료**

- [x] **Task A12.3.1**: 계약서 작성 페이지에 홈 버튼 추가
  - PageHeader 우측에 홈 아이콘 버튼
  - 클릭 시 종료 확인 BottomSheet 표시

- [x] **Task A12.3.2**: 종료 확인 BottomSheet 구현
  - "작성 중인 내용은 자동으로 저장돼요" 안내
  - "계속 작성하기" / "홈으로 가기" 버튼

- [x] **Task A12.3.3**: 대시보드에서 임시저장 감지
  - contractFormStore의 draftData, draftStep 확인
  - 임시저장 존재 시 "이어서 작성하기" BottomSheet 표시
  - 새로 시작하기 선택 시 reset() 호출

---

### Epic A12.4: AI 리뷰어 크레딧 표시

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A12.4.1**: 대시보드에 AI 리뷰어 크레딧 표시
  - credits 객체로 { contract: number, aiReview: number } 구조 변경
  - 두 가지 크레딧 뱃지 분리 표시

- [x] **Task A12.4.2**: 크레딧 아이콘 개선
  - 계약서: 💎 아이콘 + cyan/blue 그라데이션
  - AI 노무사: ⚡️ 아이콘 + amber/yellow 그라데이션

---

### Epic A12.5: 법적 페이지 구현

> 예상 시간: 1시간 | **상태: ✅ 완료**

- [x] **Task A12.5.1**: 이용약관 페이지 (`/terms`) 생성
- [x] **Task A12.5.2**: 개인정보처리방침 페이지 (`/privacy`) 생성
- [x] **Task A12.5.3**: 환불정책 페이지 (`/refund`) 생성
- [x] **Task A12.5.4**: MenuSheet에 환불정책 메뉴 항목 추가
- [x] **Task A12.5.5**: routes.ts에 REFUND 경로 추가

---

### Epic A12.6: AI 노무사 버튼 프리미엄 디자인

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A12.6.1**: globals.css에 shimmer 애니메이션 추가
- [x] **Task A12.6.2**: AI 검토 버튼 프리미엄 스타일 적용
  - 그라데이션 배경 (amber-50 → orange-50)
  - Shimmer 효과 오버레이
  - ⚖️ 아이콘 (법적 저울)
  - PRO 배지

---

### Epic A12.7: Coming Soon 메시지

> 예상 시간: 20분 | **상태: ✅ 완료**

- [x] **Task A12.7.1**: PDF 다운로드 "준비 중" 토스트 메시지
- [x] **Task A12.7.2**: 카카오톡 공유 "준비 중" 토스트 메시지

---

### Epic A12.8: 공유 링크 바텀시트

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A12.8.1**: Share Link BottomSheet 구현
  - 공유 링크 표시 + 복사 버튼
  - "카카오톡이나 문자로 링크를 보내주세요" 안내
  - 완료 버튼

---

### Epic A12.9: AI 리뷰 흐름 개선

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A12.9.1**: 서명 전 AI 검토 가능하도록 수정
  - handleAIReview에서 contractData 직접 전달
  - API에서 contractId 또는 contractData 모두 처리

- [x] **Task A12.9.2**: "저장하고 공유하기" 버튼으로 통합
  - 서명 후 바로 공유 링크 생성
  - 공유 바텀시트 직접 열기 (리다이렉트 없음)

---

## 📊 Amendment 12 완료 요약

| 기능                | 상태 | 설명                                 |
| ------------------- | ---- | ------------------------------------ |
| 휴게시간 없음       | ✅   | 0분 옵션 추가                        |
| 업종 모달 자동 열림 | ✅   | 미선택 시 자동 오픈                  |
| 홈 버튼 + 임시저장  | ✅   | 작성 중 홈 이동, 이어서 작성 지원    |
| AI 리뷰어 크레딧    | ✅   | 별도 표시 + 아이콘 개선              |
| 법적 페이지         | ✅   | terms, privacy, refund 페이지        |
| AI 버튼 프리미엄    | ✅   | shimmer, PRO 배지, 그라데이션        |
| Coming Soon         | ✅   | PDF, 카카오톡 공유 안내              |
| 공유 바텀시트       | ✅   | 링크 복사 및 안내                    |
| AI 리뷰 흐름        | ✅   | 저장 전 검토, 저장하고 공유하기 통합 |

---

> **Amendment 12 끝**

---

## 📝 Amendment 13: 대시보드 편집 기능 (2026년 1월 25일)

> **추가일**: 2026년 1월 25일  
> **변경 사유**: 사업자/근로자 대시보드 편집 기능 강화

### 추가된 Task

#### Task 13.1: 사업자 대시보드 편집 기능 ✅

- **구현 내용**:
  - 계약서 삭제 기능 (soft delete → 휴지통)
  - 휴지통 조회 및 복구/영구 삭제
  - 폴더 탭 UI (조건부 표시)
  - 폴더 색상 저장 기능
- **파일**:
  - `app/(protected)/employer/folders/actions.ts`
  - `app/(protected)/employer/page.tsx`
  - `app/(protected)/employer/employer-dashboard.tsx`
  - `components/folder/FolderTabs.tsx`

#### Task 13.2: 근로자 대시보드 숨기기 기능 ✅

- **구현 내용**:
  - 계약서 숨기기 기능 (worker_hidden_contracts 테이블)
  - 숨긴 계약서 조회 및 복구
  - 조건부 탭 UI (숨긴 계약서 있을 때만)
- **파일**:
  - `types/database.ts`
  - `app/(protected)/worker/actions.ts` (신규)
  - `app/(protected)/worker/page.tsx`
  - `app/(protected)/worker/worker-dashboard.tsx`

---

## 📊 Amendment 13 완료 요약

| 기능                 | 대상   | 상태 | 설명             |
| -------------------- | ------ | ---- | ---------------- |
| 삭제 → 휴지통        | 사업자 | ✅   | Soft delete 구현 |
| 휴지통 복구/영구삭제 | 사업자 | ✅   | 탭으로 접근      |
| 폴더 탭 UI           | 사업자 | ✅   | 조건부 표시      |
| 숨기기 기능          | 근로자 | ✅   | 새 테이블 생성   |
| 숨김 탭              | 근로자 | ✅   | 조건부 표시      |

---

> **Amendment 13 끝**

---

## 📝 Amendment 14: 공유 링크 UX 및 RLS 개선 (2026년 1월 25일)

> **추가일**: 2026년 1월 25일  
> **변경 사유**: 카카오톡 링크 공유 문제 해결 및 근로자 서명 플로우 개선  
> **우선순위**: P0 (핫픽스)  
> **상태**: ✅ 완료

---

### Epic A14.1: 공유 링크 URL 단축

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A14.1.1**: `/s/[token]` 리다이렉트 라우트 생성
  - `app/s/[token]/page.tsx` 신규 생성
  - `/contract/sign/[token]`으로 리다이렉트
  - 짧은 URL로 카카오톡 하이퍼링크 인식 문제 해결

- [x] **Task A14.1.2**: 공유 URL 생성 함수 수정
  - `lib/utils/share.ts`: `/s/${token}` 포맷 사용
  - `app/(protected)/employer/create/actions.ts`: shareUrl 생성 수정
  - `app/(protected)/employer/preview/[id]/actions.ts`: shareUrl 생성 수정

---

### Epic A14.2: 계약서 미리보기 공유 UX 개선

> 예상 시간: 1시간 | **상태: ✅ 완료**

- [x] **Task A14.2.1**: 저장 완료 후 UI 상태 변경
  - `isSaveCompleted` 상태 추가
  - 공유 바텀시트 닫을 때 저장 완료 상태로 전환
  - "홈으로 돌아가기" 버튼 표시

- [x] **Task A14.2.2**: 카카오톡 공유 안내 강화
  - Bold 안내문 추가: "직접 카카오톡으로 보내주세요!"
  - `navigator.clipboard.writeText(shareUrl.trim())` 으로 URL만 복사
  - 힌트 추가: "💡 링크만 단독으로 보내야 클릭이 잘 돼요"

---

### Epic A14.3: RLS 정책 추가 (공개 링크 접근)

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A14.3.1**: Supabase 마이그레이션 적용
  - 정책명: `contracts_select_by_token` (anon, authenticated)
  - 정책명: `profiles_select_for_contract` (anon, authenticated)
  - 정책명: `signatures_select_by_token` (anon, authenticated)
  - 정책명: `signatures_insert_by_token` (authenticated)
  - 정책명: `contracts_update_by_token` (authenticated)

---

### Epic A14.4: 근로자 서명 플로우 개선

> 예상 시간: 1시간 | **상태: ✅ 완료**

- [x] **Task A14.4.1**: 로그인 상태 전달
  - `app/contract/sign/[token]/page.tsx`: isLoggedIn prop 추가
  - WorkerSignPage에 로그인 상태 전달

- [x] **Task A14.4.2**: 카카오 로그인 연동 Server Action
  - `signInForWorkerSign(token)` 함수 추가
  - 로그인 후 `/s/${token}`으로 리다이렉트

- [x] **Task A14.4.3**: 서명 단계 UI 변경
  - 미로그인 시: "카카오로 3초 만에 로그인하고 서명하기" 버튼
  - 로그인 후: "서명하고 계약하기 ✍️" 버튼

- [x] **Task A14.4.4**: Auth Callback 라우트 수정
  - `/s/` 또는 `/contract/sign/` 리다이렉트 감지
  - 자동으로 'worker' 역할 설정
  - 역할 선택 없이 바로 서명 페이지로 이동

---

### Epic A14.5: 계약서 상세 공유 UI 통합

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A14.5.1**: `contract-detail.tsx` 공유 바텀시트 추가
  - 미리보기와 동일한 공유 UI 적용
  - `/s/${shareToken}` 형식 URL 사용
  - "근로자에게 다시 보내기" 버튼으로 바텀시트 열기

---

## 📊 Amendment 14 완료 요약

| 기능         | 상태 | 설명                            |
| ------------ | ---- | ------------------------------- |
| URL 단축     | ✅   | `/s/[token]` 리다이렉트 라우트  |
| 공유 UX      | ✅   | 저장 완료 UI, bold 안내문, 힌트 |
| RLS 정책     | ✅   | anon 사용자 공개 접근 허용      |
| 서명 플로우  | ✅   | 카카오 로그인 → 서명 흐름 개선  |
| 상세 공유 UI | ✅   | 미리보기와 동일한 바텀시트 적용 |

---

### 📌 핵심 변경 사항

#### 공유 링크 형식 변경

```
기존: https://signplease.vercel.app/contract/sign/e3c4618d56f1477a
변경: https://signplease.vercel.app/s/e3c4618d56f1477a
```

#### 근로자 서명 플로우 변경

```
기존: 링크 클릭 → 번호 인증 → 서명 시도 → 로그인 필요 오류
변경: 링크 클릭 → 번호 인증 → 카카오 로그인 → 서명
```

#### RLS 정책 추가 이유

- 비로그인(anon) 사용자도 share_token으로 계약서 조회 필요
- 404 에러 해결을 위해 공개 접근 정책 추가

---

> **Amendment 14 끝**

---

## 📝 Amendment 15: 민감정보 보안 열람 기능 (2026년 1월 25일)

> **변경 사유**: 사업자가 4대보험 신고를 위해 근로자 주민번호/계좌 열람 필요 + 보안 강화

---

### Epic A15.1: 열람 로그 테이블 생성

> 예상 시간: 15분 | **상태: ✅ 완료**

- [x] **Task A15.1.1**: Supabase 마이그레이션 적용
  - 테이블명: `sensitive_info_logs`
  - 컬럼: `id`, `user_id`, `contract_id`, `info_type`, `accessed_at`, `ip_address`, `user_agent`
  - RLS: 본인 로그만 조회 가능

---

### Epic A15.2: 민감정보 복호화 API

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A15.2.1**: API 엔드포인트 생성
  - 경로: `/api/contract/sensitive-info`
  - 메서드: POST
  - 파라미터: `contractId`, `infoType` (ssn/account/both)
  - 권한: 계약서 작성자(employer_id)만 접근 가능
  - 기능: 열람 로그 자동 기록 + 복호화 데이터 반환

---

### Epic A15.3: 민감정보 표시 UI

> 예상 시간: 1시간 | **상태: ✅ 완료**

- [x] **Task A15.3.1**: `contract-detail.tsx` 수정
  - 완료된 계약서에만 "근로자 정보 (4대보험용)" 섹션 표시
  - 기본: 마스킹 상태 (`******-*******`)
  - "정보 보기" 버튼 클릭 시 전체 표시

- [x] **Task A15.3.2**: 10초 자동 마스킹 복귀
  - 카운트다운 타이머 표시 ("🔒 10초 후 자동 숨김")
  - 10초 후 자동으로 마스킹 복귀
  - "숨기기" 버튼으로 즉시 숨김 가능

- [x] **Task A15.3.3**: 보안 안내 표시
  - "⚠️ 열람 기록이 저장됩니다. 4대보험 신고 목적으로만 사용하세요."

---

### Epic A15.4: 타입 정의 업데이트

> 예상 시간: 15분 | **상태: ✅ 완료**

- [x] **Task A15.4.1**: `types/database.ts` 수정
  - `contracts` 테이블에 `worker_ssn_encrypted`, `worker_bank_name`, `worker_account_encrypted` 추가

---

## 📊 Amendment 15 완료 요약

| 기능             | 상태 | 설명                                      |
| ---------------- | ---- | ----------------------------------------- |
| 열람 로그 테이블 | ✅   | `sensitive_info_logs` 테이블 생성         |
| 복호화 API       | ✅   | `/api/contract/sensitive-info` 엔드포인트 |
| 민감정보 UI      | ✅   | 마스킹 + 클릭 시 전체 표시                |
| 자동 숨김        | ✅   | 10초 카운트다운 후 자동 마스킹            |
| 보안 안내        | ✅   | 열람 기록 저장 안내문 표시                |

---

> **Amendment 15 끝**

---

## 📝 Amendment 16: 서명 완료 페이지 UX 개선 (2026년 1월 25일)

> **변경 사유**: 서명 완료 후 계약서 확인 버튼 없음 → 사용자 혼란

---

### Epic A16.1: 서명 완료 페이지 버튼 추가

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A16.1.1**: 로그인 상태별 버튼 분기
  - 본인 계약서 (worker_id 일치): "계약서 확인하기 📄" → `/worker/contract/{id}`
  - 다른 로그인 사용자: "내 계약서 목록 보기" → `/worker`
  - 비로그인: "카카오로 로그인하기" → `/login`
  - 공통: "홈으로 가기" → `/`

---

### Epic A16.2: AI 노무사 크레딧 오류 수정

> 예상 시간: 15분 | **상태: ✅ 완료**

- [x] **Task A16.2.1**: reference_id 타입 오류 수정
  - 원인: `use_credit` RPC의 `p_reference_id`가 uuid 타입인데 `'new_contract'` 문자열 전달
  - 해결: 새 계약서 검토 시 `null` 전달

---

## 📊 Amendment 16 완료 요약

| 기능             | 상태 | 설명                         |
| ---------------- | ---- | ---------------------------- |
| 서명 완료 버튼   | ✅   | 상태별 계약서 확인 버튼 추가 |
| 크레딧 오류 수정 | ✅   | uuid 타입 불일치 해결        |

---

> **Amendment 16 끝**

---

## 📝 Amendment 17: 사업장 관리 및 카카오톡 공유 개선 (2026년 1월 27일)

> **추가일**: 2026년 1월 27일  
> **변경 사유**: 사업장 선택/관리 기능, 사업장명 표시, 카카오톡 공유 설정  
> **우선순위**: P0 (MVP 필수)  
> **상태**: ✅ 완료

---

### Epic A17.1: 사업장 선택/관리 기능

> 예상 시간: 2시간 | **상태: ✅ 완료**

#### Story A17.1.1: 사업장 테이블 및 계약서 작성 Step 1 변경

- [x] **Task A17.1.1.1**: `workplaces` 테이블 생성
  - Supabase에 workplaces 테이블 생성 (id, user_id, name, address, created_at)
  - RLS 정책 적용

- [x] **Task A17.1.1.2**: `contracts` 테이블에 `workplace_id`, `workplace_name` 컬럼 추가
  - workplace_id: UUID (FK → workplaces)
  - workplace_name: TEXT (비정규화 - 표시용)

- [x] **Task A17.1.1.3**: `Step1Workplace.tsx` 컴포넌트 신규 생성
  - 기존 사업장 목록 표시 및 선택
  - 새 사업장 등록 UI (Daum Postcode API 연동)
  - contractFormStore 업데이트

- [x] **Task A17.1.1.4**: 계약서 작성 플로우 재구성
  - Step 1: 사업장 선택/등록 (신규)
  - Step 8 (근무장소 입력) 삭제 - Step 1에서 주소 처리
  - TOTAL_STEPS: 10 → 9로 변경

---

### Epic A17.2: 모든 계약서 화면에 사업장명 표시

> 예상 시간: 1시간 | **상태: ✅ 완료**

- [x] **Task A17.2.1**: 계약서 미리보기에 사업장명 표시 (이미 있음)

- [x] **Task A17.2.2**: employer 계약서 상세에 사업장명 표시 추가
  - `contract-detail.tsx`의 contractItems에 "사업장" 항목 추가
  - ContractData 인터페이스에 workplaceName 추가
  - page.tsx에서 workplace_name 전달

- [x] **Task A17.2.3**: worker 계약서 상세에 사업장명 표시 추가
  - `contract-detail.tsx`의 계약서 상세 섹션에 "사업장" 항목 추가

- [x] **Task A17.2.4**: 근로자 서명 페이지에 사업장명 표시 추가
  - `worker-sign.tsx`의 contractItems에 "사업장" 항목 추가

---

### Epic A17.3: 카카오톡 공유 기능 수정

> 예상 시간: 30분 | **상태: ⏳ 환경변수 설정 대기**

- [x] **Task A17.3.1**: 카카오톡 공유 메시지에 사업장명 우선 표시
  - `shareContractViaKakao` 함수에 workplaceName 파라미터 추가
  - description: "{사업장명}에서 {근로자명}님에게 근로계약서를 보냈어요"

- [ ] **Task A17.3.2**: 카카오 개발자 콘솔 웹 도메인 등록 (사용자 수동 설정 필요)
  - 제품 링크 관리 → 웹 도메인 등록
  - `https://signplease.vercel.app` 등록
  - 버튼 표시를 위해 필수

- [ ] **Task A17.3.3**: Vercel 환경변수 설정 (사용자 수동 설정 필요)
  - `NEXT_PUBLIC_APP_URL`: `https://signplease.vercel.app`
  - `NEXT_PUBLIC_KAKAO_JS_KEY`: 카카오 JavaScript 키

---

### Epic A17.4: 역할 전환 버그 수정

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A17.4.1**: 로그인 사용자가 게스트로 처리되는 버그 수정
  - 원인: 대시보드/레이아웃에서 guest 쿠키를 먼저 체크
  - 해결: `auth.getUser()` 먼저 확인 후, 없을 때만 guest 체크

- [x] **Task A17.4.2**: 수정된 파일들
  - `employer/page.tsx`
  - `worker/page.tsx`
  - `employer/layout.tsx`
  - `worker/layout.tsx`
  - `worker/career/page.tsx`
  - `employer/contract/[id]/page.tsx`
  - `employer/preview/[id]/page.tsx`

---

### Epic A17.5: Zustand Hydration 버그 수정

> 예상 시간: 20분 | **상태: ✅ 완료**

- [x] **Task A17.5.1**: 계약서 미리보기에서 사업장명 안 보이는 문제 수정
  - 원인: Zustand sessionStorage 하이드레이션 지연
  - 해결: `isHydrated` 상태로 하이드레이션 완료 대기
  - 새 계약서일 때 로딩 스피너 표시

---

## 📊 Amendment 17 완료 요약

| 기능                 | 상태 | 설명                          |
| -------------------- | ---- | ----------------------------- |
| 사업장 테이블        | ✅   | workplaces 테이블 생성 및 RLS |
| Step 1 사업장 선택   | ✅   | 사업장 선택/등록 컴포넌트     |
| 계약서 단계 재구성   | ✅   | 10단계 → 9단계                |
| 사업장명 표시        | ✅   | 모든 계약서 화면에 추가       |
| 카카오톡 공유 메시지 | ✅   | 사업장명 우선 표시            |
| 카카오 콘솔 설정     | ⏳   | 사용자 수동 설정 필요         |
| 역할 전환 버그       | ✅   | 로그인/게스트 체크 순서 수정  |
| Hydration 버그       | ✅   | 미리보기 사업장명 표시 수정   |

---

### 📌 사용자 설정 필요 사항

#### 1. 카카오 개발자 콘솔

1. [카카오 개발자](https://developers.kakao.com) 접속
2. 앱 선택 → **제품 링크 관리**
3. **웹 도메인 등록**: `https://signplease.vercel.app`

#### 2. Vercel 환경변수

| Key                        | Value                              |
| -------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_APP_URL`      | `https://signplease.vercel.app`    |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | `6a36a3ac7b5dd825dc430ea3ecd4bc53` |

#### 3. 재배포

환경변수 설정 후 Vercel에서 Redeploy 필요

---

> **Amendment 17 끝**

---

## Amendment 18: MVP 기능 정리 및 법적 필수 항목 추가 (2026년 1월 27일)

### Epic A18.1: 고객센터 이메일 문의로 변경

> 예상 시간: 10분 | **상태: ✅ 완료**

- [x] **Task A18.1.1**: 1:1 채팅을 이메일 문의로 변경
  - `/support` 페이지에서 채팅 → 이메일 링크로 변경
  - 이메일: `lemonmilkceo@gmail.com`
  - `/support/chat` 페이지 삭제

---

### Epic A18.2: 미출시 기능 토스트 안내

> 예상 시간: 15분 | **상태: ✅ 완료**

- [x] **Task A18.2.1**: 하단 네비게이션 채팅 탭 토스트 처리
  - 클릭 시 "채팅 기능은 곧 출시 예정이에요!" 토스트 표시
  - 페이지 이동 없이 안내만 표시

- [x] **Task A18.2.2**: 경력증명서 발급 버튼 토스트 처리
  - `/worker/career` 페이지의 "경력증명서 발급" 버튼
  - 클릭 시 "경력증명서 발급 기능은 곧 출시 예정이에요!" 토스트 표시

- [x] **Task A18.2.3**: Toast 컴포넌트 info variant 추가
  - 파란색 배경, 💡 아이콘

---

### Epic A18.3: 계약서 저장 후 미리보기 버그 수정

> 예상 시간: 10분 | **상태: ✅ 완료**

- [x] **Task A18.3.1**: 저장 후 정보가 비어보이는 버그 수정
  - 원인: `reset()` 호출 시 `formData` 초기화되어 `displayData` 빈 값 참조
  - 해결: `savedContractData` 상태 추가하여 저장된 데이터 유지

---

### Epic A18.4: 온보딩 문구 변경

> 예상 시간: 5분 | **상태: ✅ 완료**

- [x] **Task A18.4.1**: "10분이면 끝나요" → "1분이면 끝나요"
  - 온보딩 슬라이드 제목 변경
  - SEO 메타데이터 description 변경

---

### Epic A18.5: 법적 필수 항목 계약서 추가

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A18.5.1**: 휴일(주휴일) 자동 계산 로직 추가
  - 특정 요일 선택 시: 선택 안 한 요일이 휴일
  - 주 N일 선택 시: 주 (7-N)일이 휴일
  - 적용 위치: PDF, 미리보기, 상세 페이지

- [x] **Task A18.5.2**: 5인 이상 사업장 추가 항목 표시
  - 연차휴가: "근로기준법 제60조에 따라 부여"
  - 가산수당: "연장·야간·휴일 근로 시 50% 이상 가산"
  - `businessSize === 'over_5'` 조건부 표시

---

## 📊 Amendment 18 완료 요약

| 기능               | 상태 | 설명                     |
| ------------------ | ---- | ------------------------ |
| 이메일 문의        | ✅   | 1:1 채팅 → 이메일로 변경 |
| 채팅 탭 토스트     | ✅   | 미출시 기능 안내         |
| 경력증명서 토스트  | ✅   | 미출시 기능 안내         |
| 미리보기 버그 수정 | ✅   | 저장 후 정보 표시        |
| 문구 변경          | ✅   | 10분 → 1분               |
| 휴일 표시          | ✅   | 법적 필수 항목           |
| 연차/가산수당      | ✅   | 5인 이상만 표시          |

---

> **Amendment 18 끝**

---

# Amendment 19: 근로자 계약서 상세 UI 개선 및 역할 전환 버그 수정

> **날짜**: 2026년 1월 27일  
> **목적**: 근로자(알바생) 계약서 상세 화면을 사업자 화면과 동일하게 개선, 역할 전환 오류 수정

---

### Epic A19.1: 근로자 계약서 상세 UI 개선

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A19.1.1**: 계약 내용 상세 정보 표시 추가
  - 사업장, 사업자, 근로자, 급여, 근무기간 등
  - 사업자 페이지와 동일한 `contractItems` 배열 사용
  - 적용 파일: `app/(protected)/worker/contract/[id]/contract-detail.tsx`

- [x] **Task A19.1.2**: 서명 현황 카드 UI 추가
  - 사업자/근로자 서명 상태를 카드 형태로 표시
  - 완료 시 녹색 배경, 대기 시 회색 배경

- [x] **Task A19.1.3**: PDF 다운로드 버튼 조건 수정
  - 기존: `status === 'completed'` 또는 `workerSigned && employerSigned`
  - 변경: `isCompleted` 변수로 통합 관리
  - 양측 서명 완료 시 PDF 아이콘 + 다운로드 버튼 표시

---

### Epic A19.2: 역할 전환 NEXT_REDIRECT 오류 수정

> 예상 시간: 15분 | **상태: ✅ 완료**

- [x] **Task A19.2.1**: 서버 액션 리다이렉트 방식 변경
  - 기존: 서버 액션에서 `redirect()` 직접 호출 → NEXT_REDIRECT 에러 발생
  - 변경: 결과 객체 반환 `{ success, redirectTo, error }`
  - 적용 파일: `app/actions/role.ts`

- [x] **Task A19.2.2**: 클라이언트 리다이렉트 처리
  - 서버 액션 결과를 받아 `router.push()`로 리다이렉트
  - 적용 파일: `components/layout/MenuSheet.tsx`

---

## 📊 Amendment 19 완료 요약

| 기능                  | 상태 | 설명                                  |
| --------------------- | ---- | ------------------------------------- |
| 근로자 계약 상세 정보 | ✅   | 사업자 페이지와 동일한 계약 내용 표시 |
| 서명 현황 카드        | ✅   | 시각적으로 개선된 서명 상태 표시      |
| PDF 다운로드 버튼     | ✅   | 양측 서명 완료 시 표시                |
| 역할 전환 오류        | ✅   | NEXT_REDIRECT 에러 수정               |

---

> **Amendment 19 끝**

---

## 📝 Amendment 20: 사업장 수정/삭제 기능 (2026년 1월 28일)

> **추가일**: 2026년 1월 28일  
> **변경 사유**: 계약서 작성 시 등록한 사업장 수정/삭제 기능 추가  
> **우선순위**: P1  
> **상태**: ✅ 완료

---

### Epic A20.1: 사업장 관리 기능 강화

> 예상 시간: 30분 | **상태: ✅ 완료**

#### Story A20.1.1: 사업장 수정/삭제 UI

- [x] **Task A20.1.1.1**: 사업장 카드에 수정/삭제 버튼 추가
  - 각 사업장 카드 하단에 "수정" / "삭제" 버튼 추가
  - 버튼 스타일: 흰색 배경, 회색 테두리
  - 삭제 버튼: 빨간색 텍스트

- [x] **Task A20.1.1.2**: 사업장 수정 바텀시트 구현
  - BottomSheet 컴포넌트 활용
  - 사업장명, 주소 수정 가능
  - Daum Postcode API 연동 (주소 검색)
  - 상세주소 입력 필드

- [x] **Task A20.1.1.3**: 사업장 삭제 확인 다이얼로그
  - 삭제 전 확인 BottomSheet 표시
  - 경고 메시지 표시 (빨간색 배경)
  - "취소" / "삭제" 버튼

---

### Epic A20.2: 삭제 후 상태 처리

> 예상 시간: 10분 | **상태: ✅ 완료**

- [x] **Task A20.2.1**: 삭제된 사업장이 선택된 상태였으면 선택 해제
  - `workplaceId`, `workplaceName`, `workLocation` 초기화

---

## 📊 Amendment 20 완료 요약

| Task      | 상태 | 설명                              |
| --------- | ---- | --------------------------------- |
| A20.1.1.1 | ✅   | 사업장 카드에 수정/삭제 버튼 추가 |
| A20.1.1.2 | ✅   | 수정 바텀시트 (이름, 주소 변경)   |
| A20.1.1.3 | ✅   | 삭제 확인 다이얼로그              |
| A20.2.1   | ✅   | 삭제 후 선택 해제 처리            |

---

### 📌 수정된 파일

| 파일                                                  | 변경 내용                 |
| ----------------------------------------------------- | ------------------------- |
| `components/contract/ContractForm/Step1Workplace.tsx` | 수정/삭제 UI 및 로직 추가 |

---

> **Amendment 20 끝**

---

## 📝 Amendment 21: AI 노무사 무료화 (2026년 1월 28일)

> **추가일**: 2026년 1월 28일  
> **변경 사유**: AI 노무사 검토 기능을 무료로 전환  
> **우선순위**: P1  
> **상태**: ✅ 완료

---

### Epic A21.1: AI 노무사 크레딧 제거

> 예상 시간: 30분 | **상태: ✅ 완료**

- [x] **Task A21.1.1**: AI 노무사 크레딧 차감 로직 제거
  - `app/api/ai-review/route.ts`에서 `use_credit` RPC 호출 제거
  - 크레딧 부족 에러 처리 로직 제거

- [x] **Task A21.1.2**: 대시보드 AI 노무사 크레딧 표시 제거
  - `employer-dashboard.tsx`에서 AI 노무사 크레딧 Link 제거
  - `employer/page.tsx`에서 aiCredit 쿼리 제거

- [x] **Task A21.1.3**: 결제 페이지 AI 노무사 크레딧 표시 제거
  - `pricing-page.tsx`에서 AI 검토 크레딧 UI 제거
  - "AI 노무사 검토는 무료로 이용할 수 있어요" 안내 문구 추가
  - `pricing/page.tsx`에서 aiCredit 쿼리 제거

- [x] **Task A21.1.4**: 게스트 스토어 정리
  - `stores/guestStore.ts`에서 `aiReviewUsed` 상태 제거

---

## 📊 Amendment 21 완료 요약

| Task    | 상태 | 설명                                   |
| ------- | ---- | -------------------------------------- |
| A21.1.1 | ✅   | AI 리뷰 API에서 크레딧 차감 제거       |
| A21.1.2 | ✅   | 대시보드 AI 크레딧 표시 제거           |
| A21.1.3 | ✅   | 결제 페이지 AI 크레딧 제거 + 무료 안내 |
| A21.1.4 | ✅   | 게스트 스토어 정리                     |

---

### 📌 수정된 파일

| 파일                                              | 변경 내용                         |
| ------------------------------------------------- | --------------------------------- |
| `app/api/ai-review/route.ts`                      | 크레딧 차감 로직 제거             |
| `app/(protected)/employer/employer-dashboard.tsx` | AI 크레딧 Link 제거               |
| `app/(protected)/employer/page.tsx`               | aiCredit 쿼리 제거                |
| `app/(protected)/pricing/pricing-page.tsx`        | AI 크레딧 UI 제거, 무료 안내 추가 |
| `app/(protected)/pricing/page.tsx`                | aiCredit 쿼리 제거                |
| `stores/guestStore.ts`                            | aiReviewUsed 상태 제거            |

---

> **Amendment 21 끝**

---

## 📝 Amendment 22: 이용약관 전자서명 법적 효력 명시 (2026년 1월 28일)

> **추가일**: 2026년 1월 28일  
> **변경 사유**: 전자서명의 법적 효력을 명확히 안내  
> **우선순위**: P1  
> **상태**: ✅ 완료

---

### Epic A22.1: 이용약관 업데이트

> 예상 시간: 20분 | **상태: ✅ 완료**

- [x] **Task A22.1.1**: 전자서명 법적 효력 조항 추가 (제3조)
  - 「근로기준법」 제17조 제2항 및 「전자서명법」 제3조 근거 명시
  - 서면 근로계약서와 동일한 법적 효력 가짐을 명시

- [x] **Task A22.1.2**: 면책조항 수정 (제4조로 이동)
  - "전자서명의 법적 효력에 관한 사항" → "특정 기관에서 개별 사안에 따라 전자문서를 인정하지 않는 경우"로 변경
  - 조항 번호 재정렬 (제4조 → 제5조, 제5조 → 제6조, ...)

- [x] **Task A22.1.3**: terms/page.tsx UI 업데이트
  - 제3조 전자서명 법적 효력 섹션 추가 (파란색 배경)
  - 제4조 면책조항 내용 업데이트
  - 후속 조항 번호 재정렬

---

## 📊 Amendment 22 완료 요약

| Task    | 상태 | 설명                          |
| ------- | ---- | ----------------------------- |
| A22.1.1 | ✅   | 제3조 전자서명 법적 효력 추가 |
| A22.1.2 | ✅   | 제4조 면책조항 수정           |
| A22.1.3 | ✅   | UI 업데이트 완료              |

---

### 📌 수정된 파일

| 파일                          | 변경 내용                    |
| ----------------------------- | ---------------------------- |
| `docs/terms.md`               | 제3조 추가, 조항 번호 재정렬 |
| `app/(public)/terms/page.tsx` | UI 업데이트                  |

---

> **Amendment 22 끝**

---

## 📝 Amendment 23: PC방 및 스타트업 업종 추가 (2026년 1월 28일)

> **추가일**: 2026년 1월 28일  
> **변경 사유**: 업종 선택 옵션 확장  
> **우선순위**: P2  
> **상태**: ✅ 완료

---

### Epic A23.1: 업종 타입 및 UI 확장

> 예상 시간: 20분 | **상태: ✅ 완료**

- [x] **Task A23.1.1**: BusinessType 타입 확장
  - `stores/contractFormStore.ts`에 `'pc_cafe'`, `'startup'` 추가

- [x] **Task A23.1.2**: Validation 스키마 확장
  - `lib/utils/validation.ts`의 `businessTypeSchema`에 새 업종 추가

- [x] **Task A23.1.3**: Step9JobDescription 업종 목록 추가
  - PC방 (🖥️): 고객 응대, 음식/음료 서빙, 계산 접수, PC 관리, 매장 청소, 회원 관리
  - 스타트업 (🚀): 기획, 마케팅, 개발, 디자인, CS, 사무 행정, 데이터 분석

- [x] **Task A23.1.4**: Step10PayDay 업종 목록 추가
  - 동일한 업종 및 키워드 추가 (간소화된 버전)

---

## 📊 Amendment 23 완료 요약

| Task    | 상태 | 설명                   |
| ------- | ---- | ---------------------- |
| A23.1.1 | ✅   | BusinessType 타입 확장 |
| A23.1.2 | ✅   | Validation 스키마 확장 |
| A23.1.3 | ✅   | Step9 업종 UI 추가     |
| A23.1.4 | ✅   | Step10 업종 UI 추가    |

---

### 📌 수정된 파일

| 파일                                                       | 변경 내용                            |
| ---------------------------------------------------------- | ------------------------------------ |
| `stores/contractFormStore.ts`                              | BusinessType에 pc_cafe, startup 추가 |
| `lib/utils/validation.ts`                                  | businessTypeSchema 확장              |
| `components/contract/ContractForm/Step9JobDescription.tsx` | PC방, 스타트업 업종 및 키워드 추가   |
| `components/contract/ContractForm/Step10PayDay.tsx`        | PC방, 스타트업 업종 추가             |

---

### 📌 업종 목록 (총 8개)

| 업종         | 아이콘 | 키워드 예시                         |
| ------------ | ------ | ----------------------------------- |
| 식당         | 🍽️     | 홀 서빙, 주방 조리, 주문 접수 등    |
| 카페         | ☕     | 바리스타, 디저트 제조, 매장 청소 등 |
| 편의점       | 🏪     | 계산, 상품 진열, 재고 확인 등       |
| 소매점       | 🛍️     | 고객 응대, 상품 정리, 매장 관리 등  |
| 미용실       | 💇     | 샴푸, 드라이, 매장 청소 등          |
| 사무직       | 💼     | 문서 작성, 전화 응대, 일정 관리 등  |
| **PC방**     | 🖥️     | 고객 응대, 음식 서빙, PC 관리 등    |
| **스타트업** | 🚀     | 기획, 마케팅, 개발, 디자인 등       |

---

> **Amendment 23 끝**

---

## 📝 Amendment 24: 계약 형태 선택 기능 추가

> **버전**: 1.24  
> **날짜**: 2026년 1월 31일  
> **변경 사유**: 정규직(4대보험)/계약직(3.3%) 계약 형태 선택 기능 추가

### 변경 개요

- 계약서 작성 시 사업장 선택 후 "계약 형태" 선택 단계 추가
- 정규직 (4대보험 가입)과 계약직 (3.3% 원천징수) 중 선택
- 전체 스텝 9 → 10단계로 변경

### Story A24.1: 계약 형태 기능 구현

- [x] **Task A24.1.1**: 스키마 문서 업데이트 ✅
  - `docs/schema.md`에 Amendment 20 추가
  - `contract_type` 컬럼 정의 (regular/contract)

- [x] **Task A24.1.2**: DB 마이그레이션 (Supabase MCP) ✅
  - `contracts` 테이블에 `contract_type` 컬럼 추가
  - CHECK 제약조건 추가

- [x] **Task A24.1.3**: 타입 업데이트 ✅
  - `types/database.ts`에 `contract_type` 필드 추가
  - `lib/utils/validation.ts`에 `contractTypeSchema` 추가

- [x] **Task A24.1.4**: 스토어 수정 ✅
  - `stores/contractFormStore.ts`에 `ContractType` 타입 추가
  - `TOTAL_STEPS` 9 → 10으로 변경
  - `contractType` 필드 추가 (기본값: 'contract')

- [x] **Task A24.1.5**: Step2ContractType 컴포넌트 생성 ✅
  - `components/contract/ContractForm/Step2ContractType.tsx` 생성
  - 정규직/계약직 선택 카드 UI

- [x] **Task A24.1.6**: 계약서 작성 페이지 수정 ✅
  - `app/(protected)/employer/create/page.tsx` 스텝 순서 조정
  - Step 2에 계약 형태 컴포넌트 배치

- [x] **Task A24.1.7**: 저장 로직 확인 ✅
  - `transformFormToDbSchema`에 `contract_type` 포함 확인

- [x] **Task A24.1.8**: 표시 로직 수정 ✅
  - 계약서 미리보기, 상세, 근로자 서명 페이지에 계약형태 표시

- [x] **Task A24.1.9**: PDF 수정 ✅
  - `ContractPDF.tsx`에 계약형태 필드 추가

---

## 📊 Amendment 24 완료 요약

| Task    | 상태 | 설명                       |
| ------- | ---- | -------------------------- |
| A24.1.1 | ✅   | 스키마 문서 업데이트       |
| A24.1.2 | ✅   | DB 마이그레이션            |
| A24.1.3 | ✅   | 타입 업데이트              |
| A24.1.4 | ✅   | 스토어 수정                |
| A24.1.5 | ✅   | Step2ContractType 컴포넌트 |
| A24.1.6 | ✅   | 페이지 수정                |
| A24.1.7 | ✅   | 저장 로직 확인             |
| A24.1.8 | ✅   | 표시 로직 수정             |
| A24.1.9 | ✅   | PDF 수정                   |

---

### 📌 수정된 파일

| 파일                                                         | 변경 내용                            |
| ------------------------------------------------------------ | ------------------------------------ |
| `docs/schema.md`                                             | Amendment 20 추가 (contract_type)    |
| `types/database.ts`                                          | contracts 타입에 contract_type 추가  |
| `lib/utils/validation.ts`                                    | contractTypeSchema 추가, 스키마 수정 |
| `stores/contractFormStore.ts`                                | ContractType 타입, TOTAL_STEPS 10    |
| `components/contract/ContractForm/Step2ContractType.tsx`     | 신규 생성                            |
| `app/(protected)/employer/create/page.tsx`                   | 스텝 순서 조정                       |
| `app/(protected)/employer/preview/[id]/contract-preview.tsx` | 계약형태 표시                        |
| `app/(protected)/employer/contract/[id]/contract-detail.tsx` | 계약형태 표시                        |
| `app/(protected)/worker/contract/[id]/contract-detail.tsx`   | 계약형태 표시                        |
| `app/contract/sign/[token]/worker-sign.tsx`                  | 계약형태 표시                        |
| `components/contract/ContractPDF.tsx`                        | 계약형태 필드 추가                   |

---

### 📌 계약 형태 옵션

| 값         | 라벨             | 설명                                        |
| ---------- | ---------------- | ------------------------------------------- |
| `regular`  | 정규직 (4대보험) | 국민연금, 건강보험, 고용보험, 산재보험 가입 |
| `contract` | 계약직 (3.3%)    | 사업소득으로 3.3% 원천징수 후 지급          |

---

> **Amendment 24 끝**

---

## 📝 Amendment 25: 퇴사 처리 및 근무이력서 발급 기능 (2026년 1월 31일)

> **버전**: 1.25  
> **날짜**: 2026년 1월 31일  
> **변경 사유**: 근로자 퇴사일 입력 및 정확한 경력 관리 기능 추가

### 변경 개요

- 근로자 계약서 상세에 "퇴사 처리" 버튼 추가
- 퇴사일 입력 시 근무일수 정확하게 계산
- "경력증명서" → "근무이력서"로 명칭 변경 (법적 면책)
- 내 경력 페이지에서 퇴사일 미입력 안내 배너 추가

### Story A25.1: DB 마이그레이션

- [x] **Task A25.1.1**: contracts 테이블에 resignation_date 컬럼 추가 ✅
  - 타입: date, nullable
  - 설명: 실제 퇴사일 (근로자 입력)

### Story A25.2: 유틸리티 함수 생성

- [x] **Task A25.2.1**: `lib/utils/career.ts` 생성 ✅
  - `getEffectiveEndDate()`: 우선순위(resignation_date > end_date > null)
  - `getCareerStatus()`: 계약 상태 계산 (ongoing, resigned, expired, needs_input)
  - `validateResignationDate()`: 퇴사일 유효성 검사
  - `calculateWorkDays()`: 근무일수 계산

### Story A25.3: Server Actions 생성

- [x] **Task A25.3.1**: `app/actions/resignation.ts` 생성 ✅
  - `setResignationDate()`: 퇴사일 설정
  - `clearResignationDate()`: 퇴사일 초기화

### Story A25.4: 근로자 계약서 상세 UI 수정

- [x] **Task A25.4.1**: 퇴사 처리 버튼 추가 ✅
  - 완료된 계약서에만 표시
  - 퇴사일 입력 BottomSheet 구현

- [x] **Task A25.4.2**: 근무기간 표시 로직 변경 ✅
  - resignation_date 우선 표시
  - "(퇴사)" 라벨 추가

### Story A25.5: 내 경력 페이지 개선

- [x] **Task A25.5.1**: 퇴사일 미입력 안내 배너 추가 ✅
  - "퇴사일을 입력하면 더 정확한 근무이력서를 발급받을 수 있어요"

- [x] **Task A25.5.2**: 계약서 카드 클릭 시 상세 페이지 이동 ✅
  - 카드 hover 효과 및 우측 화살표 추가

- [x] **Task A25.5.3**: 상태 배지 표시 ✅
  - "근무 중", "퇴사 완료", "퇴사일 미입력" 등

### Story A25.6: 경력증명서 → 근무이력서 변경

- [x] **Task A25.6.1**: 명칭 변경 ✅
  - "경력증명서" → "근무이력서"
  - "Certificate of Employment" → "Work History Summary"

- [x] **Task A25.6.2**: 면책 문구 추가 ✅
  - "싸인해주세요 계약 정보 기반 참고용 문서"
  - "공식 증명이 필요하면 해당 사업장에 요청해주세요"

### Story A25.7: 사업자 화면 수정

- [x] **Task A25.7.1**: 계약서 상세에 퇴사일 표시 ✅
  - resignation_date 있으면 "(퇴사)" 라벨과 함께 표시

### Story A25.8: RLS 정책 수정

- [x] **Task A25.8.1**: contracts_update_employer 정책 수정 ✅
  - 모든 상태의 계약서 UPDATE 허용 (삭제 기능 지원)

---

## 📊 Amendment 25 완료 요약

| Task    | 상태 | 설명                               |
| ------- | ---- | ---------------------------------- |
| A25.1.1 | ✅   | DB 마이그레이션 (resignation_date) |
| A25.2.1 | ✅   | 경력 유틸리티 함수                 |
| A25.3.1 | ✅   | 퇴사 처리 Server Actions           |
| A25.4.1 | ✅   | 퇴사 처리 버튼 UI                  |
| A25.4.2 | ✅   | 근무기간 표시 로직                 |
| A25.5.1 | ✅   | 퇴사일 미입력 안내 배너            |
| A25.5.2 | ✅   | 카드 클릭 이동                     |
| A25.5.3 | ✅   | 상태 배지 표시                     |
| A25.6.1 | ✅   | 명칭 변경                          |
| A25.6.2 | ✅   | 면책 문구 추가                     |
| A25.7.1 | ✅   | 사업자 화면 퇴사일 표시            |
| A25.8.1 | ✅   | RLS 정책 수정                      |

---

### 📌 수정된 파일

| 파일                                                         | 변경 내용                              |
| ------------------------------------------------------------ | -------------------------------------- |
| `docs/schema.md`                                             | resignation_date 컬럼 문서화           |
| `types/database.ts`                                          | contracts 타입에 resignation_date 추가 |
| `lib/utils/career.ts`                                        | 신규 생성 - 경력 관련 유틸리티         |
| `app/actions/resignation.ts`                                 | 신규 생성 - 퇴사 처리 Server Actions   |
| `app/(protected)/worker/contract/[id]/contract-detail.tsx`   | 퇴사 처리 UI                           |
| `app/(protected)/worker/contract/[id]/page.tsx`              | resignation_date 전달                  |
| `app/(protected)/worker/career/career-list.tsx`              | 안내 배너, 카드 클릭, 상태 배지        |
| `app/(protected)/worker/career/page.tsx`                     | resignation_date 조회                  |
| `app/(protected)/employer/contract/[id]/contract-detail.tsx` | 퇴사일 표시                            |
| `app/(protected)/employer/contract/[id]/page.tsx`            | resignation_date 전달                  |
| `components/career/CareerCertificatePDF.tsx`                 | 명칭 및 면책 문구 변경                 |

---

### 📌 데이터 우선순위 로직

```typescript
// 근무 종료일 우선순위
1순위: resignation_date (근로자가 직접 입력한 퇴사일)
2순위: end_date (계약서에 명시된 종료일, 오늘 이전이면 종료로 간주)
3순위: null (무기한 계약, 현재 진행 중)
```

---

> **Amendment 25 끝**

---

## 📝 Amendment 26: 서명 증적 정보 저장 (IP, User-Agent) (2026년 1월 31일)

> **버전**: 1.26  
> **날짜**: 2026년 1월 31일  
> **변경 사유**: 법적 효력 강화를 위한 서명 시점 증적 정보 저장

### 변경 개요

- 서명 시 IP 주소와 User-Agent(브라우저/기기 정보)를 DB에 저장
- 스키마에는 이미 정의되어 있었으나 코드에서 누락된 부분 보완
- 법적 분쟁 시 "누가, 언제, 어디서, 어떤 기기로 서명했는지" 증명 가능

### Story A26.1: 서명 증적 정보 저장

- [x] **Task A26.1.1**: 사업자 서명 (미리보기) 수정 ✅
  - `app/(protected)/employer/preview/[id]/actions.ts`
  - `headers()` import 추가
  - `ip_address`, `user_agent` 저장

- [x] **Task A26.1.2**: 사업자 서명 (작성 시) 수정 ✅
  - `app/(protected)/employer/create/actions.ts`
  - `headers()` import 추가
  - `ip_address`, `user_agent` 저장

- [x] **Task A26.1.3**: 근로자 서명 (로그인) 수정 ✅
  - `app/(protected)/worker/contract/[id]/actions.ts`
  - `headers()` import 추가
  - `ip_address`, `user_agent` 저장

- [x] **Task A26.1.4**: 근로자 서명 (링크) 수정 ✅
  - `app/contract/sign/[token]/actions.ts`
  - `headers()` import 추가
  - `ip_address`, `user_agent` 저장

---

## 📊 Amendment 26 완료 요약

| Task    | 상태 | 설명                              |
| ------- | ---- | --------------------------------- |
| A26.1.1 | ✅   | 사업자 서명 (미리보기) IP/UA 저장 |
| A26.1.2 | ✅   | 사업자 서명 (작성 시) IP/UA 저장  |
| A26.1.3 | ✅   | 근로자 서명 (로그인) IP/UA 저장   |
| A26.1.4 | ✅   | 근로자 서명 (링크) IP/UA 저장     |

---

### 📌 수정된 파일

| 파일                                               | 변경 내용                |
| -------------------------------------------------- | ------------------------ |
| `app/(protected)/employer/preview/[id]/actions.ts` | IP, User-Agent 저장 추가 |
| `app/(protected)/employer/create/actions.ts`       | IP, User-Agent 저장 추가 |
| `app/(protected)/worker/contract/[id]/actions.ts`  | IP, User-Agent 저장 추가 |
| `app/contract/sign/[token]/actions.ts`             | IP, User-Agent 저장 추가 |

---

### 📌 저장되는 서명 증적 정보

| 항목      | 컬럼명       | 예시                                        |
| --------- | ------------ | ------------------------------------------- |
| 서명 시점 | `signed_at`  | 2026-01-31T14:30:00.000Z                    |
| IP 주소   | `ip_address` | 211.234.56.78                               |
| 기기 정보 | `user_agent` | Mozilla/5.0 (iPhone; CPU iPhone OS 17_0...) |

---

> **Amendment 26 끝**

---

## Amendment 27: 체결완료 계약서 7일 수정 기능

> **날짜**: 2026년 1월 31일

### 개요

체결 완료된 계약서도 7일 이내에는 사장님이 수정할 수 있도록 기능 추가.
수정 시 기존 서명이 무효화되고, 근로자에게 다시 서명을 받아야 함.

---

### A27.1 DB 변경사항

- [x] **Task A27.1.1**: signatures DELETE 정책 추가 ✅
  - Migration: `add_signatures_delete_policy`
  - 사업자가 자신의 계약서 서명을 삭제할 수 있도록 허용

- [x] **Task A27.1.2**: notification_type ENUM에 'contract_modified' 추가 ✅
  - Migration: `add_contract_modified_notification_type`
  - 계약서 수정 알림 타입

---

### A27.2 Server Action 구현

- [x] **Task A27.2.1**: updateContract 함수 구현 ✅
  - `app/(protected)/employer/create/actions.ts`
  - 수정 가능 여부 확인 (draft/pending/completed 7일 이내)
  - 기존 서명 삭제
  - 계약서 내용 업데이트
  - 상태를 pending으로 변경
  - 새 사장 서명 저장
  - 공유 토큰 갱신
  - 크레딧 차감 없음

- [x] **Task A27.2.2**: getContractForEdit 함수 구현 ✅
  - `app/(protected)/employer/create/actions.ts`
  - 수정할 계약서 데이터 조회
  - 수정 가능 여부 확인

- [x] **Task A27.2.3**: checkContractEditable 함수 구현 ✅
  - `app/(protected)/employer/create/actions.ts`
  - 프론트엔드용 수정 가능 여부 조회

---

### A27.3 Zustand Store 수정

- [x] **Task A27.3.1**: contractFormStore에 edit 모드 추가 ✅
  - `stores/contractFormStore.ts`
  - `editingContractId`, `isEditMode` 상태 추가
  - `loadContractData` 함수 추가

---

### A27.4 프론트엔드 UI

- [x] **Task A27.4.1**: ContractCard 수정 버튼 조건 변경 ✅
  - `components/contract/ContractCard.tsx`
  - completed 상태도 7일 이내면 수정 버튼 표시
  - 남은 일수 표시 (D-N)
  - 주황색 버튼으로 구분

- [x] **Task A27.4.2**: 계약서 상세 페이지에 수정 버튼 추가 ✅
  - `app/(protected)/employer/contract/[id]/contract-detail.tsx`
  - 하단 액션 영역에 ✏️ 수정 버튼 추가
  - 수정 가능 여부에 따라 표시

- [x] **Task A27.4.3**: 수정 경고 팝업 구현 ✅
  - `app/(protected)/employer/contract/[id]/contract-detail.tsx`
  - 체결완료 계약서 수정 시 경고 표시
  - "서명이 무효화됩니다" 안내

- [x] **Task A27.4.4**: create 페이지 edit 모드 구현 ✅
  - `app/(protected)/employer/create/page.tsx`
  - URL 파라미터 `?edit=contractId`로 edit 모드 진입
  - 기존 계약서 데이터 로드

- [x] **Task A27.4.5**: preview 페이지 edit 모드 처리 ✅
  - `app/(protected)/employer/preview/[id]/contract-preview.tsx`
  - edit 모드일 때 updateContract 호출

---

### A27.5 알림 발송

- [x] **Task A27.5.1**: 계약서 수정됨 알림 ✅
  - 수정 시 근로자에게 알림 발송
  - "📝 계약서가 수정됐어요" 알림

---

## 📊 Amendment 27 완료 요약

| Task    | 상태 | 설명                             |
| ------- | ---- | -------------------------------- |
| A27.1.1 | ✅   | DB: signatures DELETE 정책 추가  |
| A27.1.2 | ✅   | DB: notification_type ENUM 추가  |
| A27.2.1 | ✅   | updateContract 함수 구현         |
| A27.2.2 | ✅   | getContractForEdit 함수 구현     |
| A27.2.3 | ✅   | checkContractEditable 함수 구현  |
| A27.3.1 | ✅   | contractFormStore edit 모드 추가 |
| A27.4.1 | ✅   | ContractCard 수정 버튼 조건 변경 |
| A27.4.2 | ✅   | 계약서 상세 수정 버튼 추가       |
| A27.4.3 | ✅   | 수정 경고 팝업 구현              |
| A27.4.4 | ✅   | create 페이지 edit 모드          |
| A27.4.5 | ✅   | preview 페이지 edit 모드         |
| A27.5.1 | ✅   | 계약서 수정됨 알림 발송          |

---

### 📌 수정된 파일

| 파일                                                         | 변경 내용                                                      |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| `app/(protected)/employer/create/actions.ts`                 | updateContract, getContractForEdit, checkContractEditable 추가 |
| `app/(protected)/employer/create/page.tsx`                   | edit 모드 처리 추가                                            |
| `app/(protected)/employer/preview/[id]/contract-preview.tsx` | edit 모드 updateContract 호출                                  |
| `app/(protected)/employer/contract/[id]/contract-detail.tsx` | 수정 버튼, 경고 팝업 추가                                      |
| `components/contract/ContractCard.tsx`                       | 수정 버튼 조건 변경 (completed 7일 이내)                       |
| `stores/contractFormStore.ts`                                | editingContractId, isEditMode, loadContractData 추가           |
| `app/actions/notifications.ts`                               | contract_modified 타입 추가                                    |
| `types/database.ts`                                          | notification_type에 contract_modified 추가                     |
| `app/(protected)/employer/page.tsx`                          | completed_at 필드 조회 추가                                    |

---

### 📌 수정 정책 정리

| 계약서 상태 | 수정 가능 여부 | 조건             |
| ----------- | -------------- | ---------------- |
| draft       | ✅ 가능        | 항상             |
| pending     | ✅ 가능        | 항상             |
| completed   | ✅ 가능        | 완료 후 7일 이내 |
| completed   | ❌ 불가        | 완료 후 7일 초과 |
| expired     | ❌ 불가        | -                |
| deleted     | ❌ 불가        | -                |

---

### 📌 수정 시 동작

1. 기존 서명 (사장+근로자) 모두 삭제
2. 계약서 내용 업데이트
3. 상태를 `pending`으로 변경
4. `completed_at` 초기화
5. `expires_at` 새로 설정 (7일 후)
6. 새 사장 서명 저장
7. 공유 토큰 갱신
8. 근로자에게 알림 발송 (worker_id가 있는 경우)
9. **크레딧 차감 없음** (최초 생성 시 이미 차감됨)

---

> **Amendment 27 끝**

---

> **문서 끝**
