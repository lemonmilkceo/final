# 📋 Development Plan
## 싸인해주세요 (SignPlease)

> **버전**: 1.0  
> **최종 수정일**: 2026년 1월 24일  
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
    - 컬러 팔레트 추가 (--primary, --gray-*, --success, --warning, --error, --kakao)
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

- [ ] **Task 4.1.1.1**: `app/(protected)/employer/layout.tsx` 사업자 레이아웃 생성
  - Header, FAB 포함
  - 역할 체크 (employer가 아니면 리다이렉트)

- [ ] **Task 4.1.1.2**: `app/(protected)/employer/page.tsx` 대시보드 Server Component 구현
  - 참조: `Rules` 섹션 4.1 (Server Component에서 데이터 로드)
  - contracts 테이블에서 employer_id로 조회
  - 상태별 필터링 데이터 전달

- [ ] **Task 4.1.1.3**: `components/contract/ContractCard.tsx` 계약서 카드 컴포넌트 생성
  - 참조: `UI` 섹션 2.1 (Contract Card)
  - 근로자 이름, 시급, 생성일, 상태 배지
  - onClick → 상세 페이지 이동

- [ ] **Task 4.1.1.4**: 대시보드 탭 필터링 및 빈 상태 UI 구현
  - 참조: `UI` 섹션 2.1 (탭 메뉴, Empty State)
  - TabBar 연동
  - 상태별 필터 (대기중, 완료, 폴더, 휴지통)

---

### Epic 4.2: 계약서 작성 Funnel

#### Story 4.2.1: Funnel 기본 구조 및 상태 관리
> 예상 시간: 2시간

- [ ] **Task 4.2.1.1**: `stores/contractFormStore.ts` Zustand 스토어 생성
  - 참조: `Rules` 섹션 5.1 (Zustand 스토어 규칙)
  - step, data, setStep, nextStep, prevStep, updateData, reset
  - sessionStorage persist

- [ ] **Task 4.2.1.2**: `app/(protected)/employer/create/page.tsx` Funnel 레이아웃 구현
  - 참조: `UI` 섹션 2.2 (계약서 작성 Funnel)
  - PageHeader (뒤로가기, 진행률)
  - 동적 Step 렌더링

- [ ] **Task 4.2.1.3**: Funnel 네비게이션 로직 구현
  - 이전/다음 버튼 동작
  - Step 완료 조건 검증
  - 마지막 Step에서 미리보기 이동

---

#### Story 4.2.2: Step 1-5 UI 구현
> 예상 시간: 3시간

- [ ] **Task 4.2.2.1**: `components/contract/ContractForm/Step1BusinessSize.tsx` 구현
  - 참조: `UI` 섹션 2.2 Step 1
  - 5인 미만/이상 라디오 카드
  - 4대보험 안내 문구

- [ ] **Task 4.2.2.2**: `components/contract/ContractForm/Step2WorkerName.tsx` 구현
  - 참조: `UI` 섹션 2.2 Step 2
  - 언더라인 입력 필드
  - 한글 2-10자 검증

- [ ] **Task 4.2.2.3**: `components/contract/ContractForm/Step3Wage.tsx` 구현
  - 참조: `UI` 섹션 2.2 Step 3
  - 숫자 입력 (자동 3자리 콤마)
  - 주휴수당 포함 체크박스
  - 최저시급 정보 카드

- [ ] **Task 4.2.2.4**: `components/contract/ContractForm/Step4WorkPeriod.tsx` 구현
  - 참조: `UI` 섹션 2.2 Step 4
  - 날짜 피커 (시작일, 종료일)
  - "종료일 없음" 체크박스

- [ ] **Task 4.2.2.5**: `components/contract/ContractForm/Step5WorkDays.tsx` 구현
  - 참조: `UI` 섹션 2.2 Step 5
  - 요일 선택 칩 (월-일)
  - "주 N일" 대체 입력

---

#### Story 4.2.3: Step 6-10 UI 구현
> 예상 시간: 2시간

- [ ] **Task 4.2.3.1**: `components/contract/ContractForm/Step6WorkTime.tsx` 구현
  - 참조: `UI` 섹션 2.2 Step 6
  - 시간 피커 (시작, 종료)
  - 일 근무시간 자동 계산 표시

- [ ] **Task 4.2.3.2**: `components/contract/ContractForm/Step7BreakTime.tsx` 구현
  - 참조: `UI` 섹션 2.2 Step 7
  - 30분, 60분, 직접입력 버튼
  - 법적 안내 문구

- [ ] **Task 4.2.3.3**: `components/contract/ContractForm/Step8Location.tsx` 구현
  - 참조: `UI` 섹션 2.2 Step 8
  - 주소 검색 버튼 (또는 직접 입력)
  - 주소 API 연동은 별도 Task

- [ ] **Task 4.2.3.4**: `components/contract/ContractForm/Step9JobDescription.tsx` 구현
  - 참조: `UI` 섹션 2.2 Step 9
  - 텍스트 영역
  - 예시 태그 클릭 시 자동 입력

- [ ] **Task 4.2.3.5**: `components/contract/ContractForm/Step10PayDay.tsx` 구현
  - 참조: `UI` 섹션 2.2 Step 10
  - 숫자 선택 (1-31)
  - 다음 급여일 자동 계산

---

#### Story 4.2.4: 계약서 생성 로직
> 예상 시간: 2시간

- [ ] **Task 4.2.4.1**: `lib/utils/validation.ts` 계약서 유효성 검사 스키마 작성
  - 참조: `Rules` 섹션 4.3 (Server Actions)
  - Zod 스키마: contractSchema
  - 모든 필드 검증 규칙

- [ ] **Task 4.2.4.2**: `app/(protected)/employer/create/actions.ts` Server Action 구현
  - 참조: `Rules` 섹션 4.3
  - 인증 확인
  - 역할 확인
  - 크레딧 차감 (use_credit 함수 호출)
  - contracts 테이블 INSERT

- [ ] **Task 4.2.4.3**: Step 10에서 Server Action 연결 및 미리보기 이동
  - "계약서 미리보기" 버튼 클릭 시 저장 후 이동
  - 에러 처리 (크레딧 부족, 유효성 실패)

---

### Epic 4.3: 계약서 미리보기 & 서명

#### Story 4.3.1: 미리보기 화면
> 예상 시간: 3시간

- [ ] **Task 4.3.1.1**: `app/(protected)/employer/preview/[id]/page.tsx` Server Component 구현
  - 계약서 데이터 조회 (contracts + signatures)
  - 권한 체크 (employer_id 일치)

- [ ] **Task 4.3.1.2**: `components/contract/ContractPreview.tsx` 미리보기 UI 구현
  - 참조: `UI` 섹션 2.3 (계약서 미리보기)
  - 표준근로계약서 형식
  - 모든 필드 표시

- [ ] **Task 4.3.1.3**: 공유 옵션 버튼 UI 구현
  - 참조: `UI` 섹션 2.3 (공유 옵션)
  - PDF, 링크, 카카오톡 버튼
  - 로직은 별도 Task

---

#### Story 4.3.2: 서명 기능
> 예상 시간: 3시간

- [ ] **Task 4.3.2.1**: `components/contract/SignatureCanvas.tsx` 서명 캔버스 컴포넌트 구현
  - 참조: `UI` 섹션 2.4 (서명 입력 Bottom Sheet)
  - Canvas API 기반 자필 서명
  - 다시 쓰기 기능
  - Base64 이미지 출력

- [ ] **Task 4.3.2.2**: 서명 BottomSheet UI 및 연동
  - BottomSheet + SignatureCanvas 결합
  - "서명 완료" 버튼

- [ ] **Task 4.3.2.3**: `app/(protected)/employer/preview/[id]/actions.ts` 서명 저장 Server Action 구현
  - signatures 테이블 INSERT
  - contracts 상태 업데이트 (draft → pending)
  - expires_at 설정 (7일 후)

- [ ] **Task 4.3.2.4**: "서명하고 보내기" 버튼 연결
  - 서명 완료 후 공유 옵션 표시
  - 알림톡 발송 트리거 (별도 Task)

---

### Epic 4.4: AI 노무사 검토

#### Story 4.4.1: AI 검토 기능
> 예상 시간: 4시간

- [ ] **Task 4.4.1.1**: OpenAI 패키지 설치
  ```bash
  npm install openai
  ```

- [ ] **Task 4.4.1.2**: `app/api/ai-review/route.ts` API Route 구현
  - 참조: `Rules` 섹션 6.4 (AI 노무사 검토)
  - 인증/권한 확인
  - 크레딧 차감
  - OpenAI API 호출
  - ai_reviews 테이블 저장

- [ ] **Task 4.4.1.3**: AI 검토 결과 BottomSheet UI 구현
  - 참조: `UI` 섹션 2.5 (AI 검토 결과)
  - overall_status 표시
  - 항목별 상태 (✅, ⚠️, ❌)
  - 수정 제안 표시

- [ ] **Task 4.4.1.4**: 미리보기 화면에 AI 검토 버튼 연동
  - "AI 노무사 검토 받기" 버튼
  - 로딩 상태
  - 결과 BottomSheet 표시
  - 크레딧 부족 시 결제 유도

---

### Epic 4.5: 계약서 공유

#### Story 4.5.1: 공유 기능 구현
> 예상 시간: 4시간

- [ ] **Task 4.5.1.1**: `lib/kakao.ts` 카카오 SDK 초기화 및 공유 유틸 작성
  - 참조: `Rules` 섹션 6.1 (카카오톡 공유)
  - initKakao, shareContract 함수

- [ ] **Task 4.5.1.2**: `app/layout.tsx`에 카카오 SDK 스크립트 추가
  - Script 컴포넌트로 SDK 로드

- [ ] **Task 4.5.1.3**: `lib/utils/share.ts` 링크 복사 유틸 작성
  - `copyContractLink(shareToken)` 함수
  - Clipboard API 사용

- [ ] **Task 4.5.1.4**: PDF 생성 패키지 설치 및 설정
  ```bash
  npm install @react-pdf/renderer
  ```

- [ ] **Task 4.5.1.5**: `app/api/pdf/generate/route.ts` PDF 생성 API Route 구현
  - 계약서 데이터로 PDF 생성
  - Storage에 업로드
  - contracts.pdf_url 업데이트

- [ ] **Task 4.5.1.6**: 공유 버튼들 기능 연결
  - 카카오톡 공유 → shareContract 호출
  - 링크 복사 → copyContractLink 호출
  - PDF 다운로드 → API 호출 후 다운로드

---

### Epic 4.6: 계약서 상세 & 관리

#### Story 4.6.1: 계약서 상세 화면
> 예상 시간: 2시간

- [ ] **Task 4.6.1.1**: `app/(protected)/employer/contract/[id]/page.tsx` Server Component 구현
  - 계약서 데이터 조회
  - 서명 현황 조회
  - AI 검토 결과 조회

- [ ] **Task 4.6.1.2**: 계약서 상세 UI 구현
  - 참조: `PRD` 섹션 4.2.4 (계약서 상세)
  - 상태 배지, 계약서 본문, 서명 현황
  - 액션 버튼 (PDF, 재전송, 삭제)

---

#### Story 4.6.2: 계약서 삭제 및 재전송
> 예상 시간: 1시간

- [ ] **Task 4.6.2.1**: 계약서 삭제 Server Action 구현
  - status → 'deleted', deleted_at 설정
  - revalidatePath 호출

- [ ] **Task 4.6.2.2**: 계약서 재전송 기능 구현
  - 카카오톡 공유 재호출
  - 알림톡 재발송

---

### Epic 4.7: 폴더 관리

#### Story 4.7.1: 폴더 CRUD
> 예상 시간: 3시간

- [ ] **Task 4.7.1.1**: 폴더 목록 및 생성 UI 구현
  - 폴더 탭 내 폴더 카드 목록
  - "+" 버튼 → 폴더 생성 BottomSheet

- [ ] **Task 4.7.1.2**: 폴더 CRUD Server Actions 구현
  - createFolder, renameFolder, deleteFolder
  - folders 테이블 조작

- [ ] **Task 4.7.1.3**: 계약서 폴더 이동 기능 구현
  - Long press 감지
  - 폴더 선택 BottomSheet
  - contracts.folder_id 업데이트

---

## Phase 5: Worker Features (근로자 기능)
> 예상 시간: 16시간 | 우선순위: P0

### Epic 5.1: 근로자 온보딩

#### Story 5.1.1: 민감정보 입력 UI
> 예상 시간: 3시간

- [ ] **Task 5.1.1.1**: `app/(protected)/worker/onboarding/page.tsx` 온보딩 레이아웃 구현
  - 참조: `UI` 섹션 3.1 (근로자 온보딩)
  - 3 Step Progress
  - Step 동적 렌더링

- [ ] **Task 5.1.1.2**: Step 1 본인인증 UI 구현
  - 참조: `UI` 섹션 3.1 Step 1
  - 휴대폰 인증 / 카카오 인증 버튼
  - 보안 안내 문구

- [ ] **Task 5.1.1.3**: Step 2 주민등록번호 입력 UI 구현
  - 참조: `UI` 섹션 3.1 Step 2
  - 앞 6자리 + 뒤 첫자리 입력
  - 마스킹 처리 (●●●●●●)

- [ ] **Task 5.1.1.4**: Step 3 급여 계좌 입력 UI 구현
  - 참조: `UI` 섹션 3.1 Step 3
  - 은행 선택 드롭다운
  - 계좌번호 입력

---

#### Story 5.1.2: 민감정보 저장 로직
> 예상 시간: 2시간

- [ ] **Task 5.1.2.1**: `lib/utils/encryption.ts` 암호화 유틸 구현
  - 참조: `Rules` 섹션 7 (암호화 처리)
  - encrypt, decrypt, hashSSN 함수

- [ ] **Task 5.1.2.2**: `app/(protected)/worker/onboarding/actions.ts` Server Action 구현
  - 참조: `Rules` 섹션 7.2 (근로자 정보 저장)
  - 주민번호 암호화 저장
  - 계좌번호 암호화 저장
  - worker_details 테이블 INSERT

- [ ] **Task 5.1.2.3**: 온보딩 완료 후 대시보드 이동
  - 모든 Step 완료 시 /worker로 리다이렉트

---

### Epic 5.2: 근로자 대시보드

#### Story 5.2.1: 대시보드 구현
> 예상 시간: 3시간

- [ ] **Task 5.2.1.1**: `app/(protected)/worker/layout.tsx` 근로자 레이아웃 생성
  - Header (알림만)
  - BottomNav
  - 역할 체크

- [ ] **Task 5.2.1.2**: `app/(protected)/worker/page.tsx` 대시보드 Server Component 구현
  - 참조: `UI` 섹션 3.2 (근로자 대시보드)
  - worker_id로 계약서 조회
  - 마감 임박 정렬

- [ ] **Task 5.2.1.3**: 마감 임박 표시 로직 구현
  - D-day 계산
  - D-1 빨간색, D-6 이하 노란색 배지

---

### Epic 5.3: 계약서 확인 & 서명

#### Story 5.3.1: 계약서 확인 화면
> 예상 시간: 3시간

- [ ] **Task 5.3.1.1**: 계약서 공유 링크 접근 라우트 구현
  - `app/(public)/contract/sign/[token]/page.tsx`
  - share_token으로 계약서 조회
  - 로그인 유도 또는 자동 연결

- [ ] **Task 5.3.1.2**: `app/(protected)/worker/contract/[id]/page.tsx` Server Component 구현
  - 계약서 데이터 조회
  - 사업자 정보 조회
  - 서명 기한 계산

- [ ] **Task 5.3.1.3**: 계약 조건 카드 UI 구현
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

- [ ] **Task 5.3.2.2**: 근로자 서명 Server Action 구현
  - signatures 테이블 INSERT
  - contracts 상태 → 'completed'
  - completed_at 설정
  - 사업자에게 알림 (별도 Task)

- [ ] **Task 5.3.2.3**: "서명하고 계약하기" 버튼 연결
  - 서명 완료 후 완료 화면 표시
  - 대시보드 이동

---

### Epic 5.4: 경력 관리

#### Story 5.4.1: 경력 목록 및 증명서
> 예상 시간: 3시간

- [ ] **Task 5.4.1.1**: `app/(protected)/worker/career/page.tsx` Server Component 구현
  - 서명 완료된 계약서 목록 조회
  - 근무 기간 계산

- [ ] **Task 5.4.1.2**: 경력 타임라인 UI 구현
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

- [ ] **Task 6.1.1.1**: 토스페이먼츠 SDK 설치
  ```bash
  npm install @tosspayments/tosspayments-sdk
  ```

- [ ] **Task 6.1.1.2**: `app/(protected)/pricing/page.tsx` 크레딧 구매 UI 구현
  - 참조: `UI` 섹션 4.1 (크레딧 구매)
  - 상품 카드 (5개, 15개, 50개)
  - 인기 태그, 할인율 표시
  - 보유 크레딧 표시

- [ ] **Task 6.1.1.3**: 상품 선택 상태 관리 및 결제 버튼 연동
  - 선택된 상품 하이라이트
  - "N원 결제하기" 버튼 텍스트 동적 변경

---

#### Story 6.1.2: 토스페이먼츠 연동
> 예상 시간: 4시간

- [ ] **Task 6.1.2.1**: `app/api/payment/prepare/route.ts` 결제 준비 API 구현
  - 참조: `Rules` 섹션 6.3 (토스페이먼츠 연동)
  - 주문 ID 생성
  - payments 테이블 INSERT

- [ ] **Task 6.1.2.2**: `components/payment/PaymentWidget.tsx` 결제 위젯 컴포넌트 구현
  - 토스페이먼츠 SDK 위젯 렌더링
  - 결제 요청 로직

- [ ] **Task 6.1.2.3**: `app/api/payment/confirm/route.ts` 결제 확인 API 구현
  - 참조: `Rules` 섹션 6.3
  - 토스페이먼츠 승인 API 호출
  - 결제 상태 업데이트
  - 크레딧 지급 (add_credit 함수)

- [ ] **Task 6.1.2.4**: 결제 성공/실패 화면 구현
  - 결제 완료 → 성공 메시지 + 대시보드 이동
  - 결제 실패 → 에러 메시지 + 재시도 버튼

---

#### Story 6.1.3: 결제 내역
> 예상 시간: 2시간

- [ ] **Task 6.1.3.1**: `app/(protected)/payment-history/page.tsx` Server Component 구현
  - payments 테이블 조회 (status = completed)

- [ ] **Task 6.1.3.2**: 결제 내역 목록 UI 구현
  - 참조: `PRD` 섹션 4.5.5 (결제 내역)
  - 결제일시, 상품명, 금액, 영수증 링크

---

## Phase 7: Chat Feature (채팅 기능)
> 예상 시간: 7시간 | 우선순위: P2

### Epic 7.1: 채팅 구현

#### Story 7.1.1: 채팅 목록
> 예상 시간: 3시간

- [ ] **Task 7.1.1.1**: `app/(protected)/employer/chat/page.tsx` 사업자 채팅 목록 구현
  - contracts 기반 채팅방 목록
  - 마지막 메시지, 시간 표시

- [ ] **Task 7.1.1.2**: `app/(protected)/worker/chat/page.tsx` 근로자 채팅 목록 구현
  - 동일 구조

- [ ] **Task 7.1.1.3**: 읽지 않은 메시지 배지 구현
  - chat_messages.is_read 카운트

---

#### Story 7.1.2: 채팅방 상세
> 예상 시간: 4시간

- [ ] **Task 7.1.2.1**: 채팅방 UI 구현
  - 참조: `PRD` 섹션 4.4.2 (채팅방 상세)
  - 메시지 목록 (발신/수신 구분)
  - 입력창

- [ ] **Task 7.1.2.2**: 메시지 전송 Server Action 구현
  - chat_messages INSERT
  - 상대방 읽음 상태 초기화

- [ ] **Task 7.1.2.3**: Supabase Realtime 구독 설정
  - chat_messages 테이블 실시간 구독
  - 새 메시지 수신 시 UI 업데이트

- [ ] **Task 7.1.2.4**: 파일 첨부 기능 구현
  - 이미지/PDF 업로드
  - chat-files 버킷 저장

---

## Phase 8: Notification System (알림 시스템)
> 예상 시간: 7시간 | 우선순위: P2

### Epic 8.1: 알림 구현

#### Story 8.1.1: 인앱 알림
> 예상 시간: 3시간

- [ ] **Task 8.1.1.1**: 알림 목록 BottomSheet UI 구현
  - 참조: `IA` 섹션 9 (모달/팝업 구조)
  - 알림 아이템 목록
  - 읽음/안읽음 구분

- [ ] **Task 8.1.1.2**: 알림 읽음 처리 Server Action 구현
  - notifications.is_read 업데이트

- [ ] **Task 8.1.1.3**: Header 알림 아이콘에 뱃지 표시
  - 읽지 않은 알림 수 표시

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

- [ ] **Task 9.1.1.1**: `stores/guestStore.ts` 게스트 스토어 구현
  - 참조: `Rules` 섹션 5.2 (게스트 모드 스토어)
  - isGuest, guestRole, aiReviewUsed

- [ ] **Task 9.1.1.2**: `app/(public)/guest/page.tsx` 게스트 역할 선택 UI 구현
  - 참조: `UI` 섹션 1.5 (둘러보기 역할 선택)

- [ ] **Task 9.1.1.3**: `components/shared/GuestBanner.tsx` 게스트 배너 컴포넌트 구현
  - 참조: `UI` 섹션 1.6 (게스트 모드 배너)
  - 상단 고정, 가입하기 버튼

- [ ] **Task 9.1.1.4**: `components/shared/SignupPromptSheet.tsx` 회원가입 유도 BottomSheet 구현
  - 참조: `UI` 섹션 1.7 (회원가입 유도)

---

#### Story 9.1.2: 샘플 데이터 및 제한 처리
> 예상 시간: 4시간

- [ ] **Task 9.1.2.1**: `lib/constants/sampleData.ts` 샘플 데이터 정의
  - 참조: `PRD` 섹션 7.3 (샘플 데이터 정의)
  - 사장님 샘플 계약서 3개
  - 알바생 샘플 계약서 2개
  - 알바생 샘플 경력 2개

- [ ] **Task 9.1.2.2**: 대시보드에 게스트 모드 분기 처리
  - isGuest일 때 샘플 데이터 표시
  - GuestBanner 렌더링

- [ ] **Task 9.1.2.3**: 제한 기능 시도 시 회원가입 유도 로직 구현
  - 서명, 전송, PDF, 결제, 채팅 시도 시
  - SignupPromptSheet 표시

- [ ] **Task 9.1.2.4**: AI 검토 1회 체험 제한 로직 구현
  - aiReviewUsed 상태 체크
  - 사용 후 회원가입 유도

---

## Phase 10: Testing & Deployment (테스트 및 배포)
> 예상 시간: 13시간 | 우선순위: P3

### Epic 10.1: 테스트

#### Story 10.1.1: 테스트 환경 설정
> 예상 시간: 2시간

- [ ] **Task 10.1.1.1**: Vitest 설치 및 설정
  ```bash
  npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react
  ```

- [ ] **Task 10.1.1.2**: `vitest.config.ts` 설정 파일 생성

- [ ] **Task 10.1.1.3**: Playwright 설치 및 설정
  ```bash
  npm install -D @playwright/test
  npx playwright install
  ```

---

#### Story 10.1.2: 테스트 작성
> 예상 시간: 6시간

- [ ] **Task 10.1.2.1**: 유틸 함수 단위 테스트 작성
  - format.ts, validation.ts, encryption.ts

- [ ] **Task 10.1.2.2**: 주요 컴포넌트 테스트 작성
  - Button, Input, Card 등

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

| Phase | 예상 시간 | 우선순위 | 완료 기준 |
|-------|----------|----------|----------|
| Phase 1: Foundation | 10시간 | P0 | DB 마이그레이션 완료, 타입 생성 완료 |
| Phase 2: Authentication | 10시간 | P0 | 카카오 로그인/로그아웃 동작 |
| Phase 3: Core UI | 12시간 | P0 | 모든 기본 컴포넌트 구현 |
| Phase 4: Employer | 34시간 | P0 | 계약서 작성 → 서명 → 공유 플로우 완성 |
| Phase 5: Worker | 16시간 | P0 | 계약서 확인 → 서명 플로우 완성 |
| Phase 6: Payment | 9시간 | P1 | 크레딧 구매 동작 |
| Phase 7: Chat | 7시간 | P2 | 실시간 채팅 동작 |
| Phase 8: Notification | 7시간 | P2 | 알림톡 발송 동작 |
| Phase 9: Guest Mode | 7시간 | P2 | 게스트 체험 모드 동작 |
| Phase 10: Testing | 13시간 | P3 | 주요 플로우 테스트 통과 |
| **Total** | **125시간** | - | 약 3-4주 (풀타임 기준) |

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

> **문서 끝**
