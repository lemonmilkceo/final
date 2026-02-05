# 📋 Development Plan

## 싸인해주세요 (SignPlease)

> **버전**: 2.0  
> **최종 수정일**: 2026년 2월 5일  
> **목적**: 개발 진행 상황 추적 및 미완료 작업 관리

---

## 📌 계획서 사용 가이드

### 참조 문서 약어

- `Schema`: `docs/schema.md` - 데이터베이스 구조
- `Rules`: `docs/rules.md` - 기술 규칙 및 코딩 컨벤션
- `UI`: `docs/UI_Spec.md` - UI 디자인 스펙
- `IA`: `docs/IA.md` - 정보 구조 및 라우팅

---

## 📊 Phase 완료 현황

| Phase | 이름 | 상태 | 완료율 |
|-------|------|------|--------|
| Phase 1 | Foundation | ✅ 완료 | 100% |
| Phase 2 | Authentication | ✅ 완료 | 100% |
| Phase 3 | Core UI Components | ✅ 완료 | 100% |
| Phase 4 | Employer Features | ✅ 완료 | 100% |
| Phase 5 | Worker Features | ⚠️ 진행중 | 95% |
| Phase 6 | Payment System | ✅ 완료 | 100% |
| Phase 7 | Chat Feature | ⏸️ 보류 (P2) | 80% |
| Phase 8 | Notification System | ⚠️ 진행중 | 70% |
| Phase 9 | Guest Mode | ⚠️ 진행중 | 60% |
| Phase 10 | Testing & Deployment | ⏸️ 보류 (P3) | 30% |

---

## 🚧 미완료 작업 (Outstanding Tasks)

### Phase 5: Worker Features

#### 용어 설명 기능 (P3)
- [ ] **Task 5.3.2.1**: `components/shared/TermTooltip.tsx` 용어 설명 컴포넌트 구현
  - 참조: `UI` 섹션 3.4 (용어 설명 Tooltip)
  - 터치 시 BottomSheet 표시
  - AI 생성 설명 (또는 사전 정의)

#### 경력증명서 PDF (P3)
- [ ] **Task 5.4.1.3**: 경력증명서(근무이력서) PDF 생성 및 다운로드 구현
  - /api/pdf/career-certificate Route
  - 경력 정보 PDF 생성
  - 다운로드 버튼 연결 (현재 "준비 중" 토스트)

---

### Phase 7: Chat Feature (P2 - 추후 구현)

> 현재 "곧 출시 예정" 토스트로 안내 중

- [ ] **Task 7.1.2.4**: 파일 첨부 기능 구현
  - 이미지/PDF 업로드
  - chat-files 버킷 저장

---

### Phase 8: Notification System

#### 카카오 알림톡 (✅ Solapi로 구현 완료)
- [x] 알림톡 서비스 설정 (Solapi)
- [x] 알림톡 템플릿 등록
- [x] 알림톡 API 구현
- [x] 계약서 전송/수정 시 알림톡 발송 트리거 연결

#### 추가 알림톡 템플릿 (P2)
- [ ] 서명 완료 알림톡 템플릿 (사업자에게)
- [ ] 마감 임박 알림톡 템플릿 (근로자에게)

---

### Phase 9: Guest Mode (P2 - 부분 구현)

- [x] 게스트 스토어 구현 ✅
- [x] 게스트 역할 선택 UI ✅
- [x] 게스트 배너 컴포넌트 ✅
- [x] 샘플 데이터 정의 ✅
- [ ] **Task 9.1.2.2**: 대시보드에 게스트 모드 분기 처리 (완전 구현)
- [ ] **Task 9.1.2.3**: 제한 기능 시도 시 회원가입 유도 로직 구현

---

### Phase 10: Testing & Deployment (P3)

#### 테스트
- [x] Vitest 설치 및 설정 ✅
- [x] 유틸 함수 단위 테스트 ✅
- [x] 주요 컴포넌트 테스트 ✅
- [ ] **Task 10.1.1.3**: Playwright 설치 및 설정
- [ ] **Task 10.1.2.3**: 사업자 계약서 작성 플로우 E2E 테스트
- [ ] **Task 10.1.2.4**: 근로자 서명 플로우 E2E 테스트

#### 배포
- [ ] **Task 10.2.1.1**: Vercel 프로젝트 생성 및 연결
- [ ] **Task 10.2.1.2**: 도메인 연결 및 SSL 설정
- [ ] **Task 10.2.2.1**: Vercel Analytics 활성화
- [ ] **Task 10.2.2.2**: Sentry 설치 및 설정
- [ ] **Task 10.2.2.3**: 에러 바운더리 및 로깅 설정

---

## ⚙️ 수동 설정 필요 사항

### 1. 카카오 개발자 콘솔

1. [카카오 개발자](https://developers.kakao.com) 접속
2. 앱 선택 → **제품 링크 관리**
3. **웹 도메인 등록**: `https://signplease.vercel.app`

### 2. Vercel 환경 변수

| Key | 설명 | 필수 |
|-----|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | ✅ |
| `ENCRYPTION_KEY` | 민감정보 암호화 키 | ✅ |
| `SSN_HASH_SALT` | 주민번호 해시용 솔트 | ✅ |
| `NEXT_PUBLIC_APP_URL` | 프로덕션 URL | ✅ |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 카카오 JavaScript 키 | ✅ |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스페이먼츠 클라이언트 키 | ✅ |
| `TOSS_SECRET_KEY` | 토스페이먼츠 시크릿 키 | ✅ |
| `OPENAI_API_KEY` | OpenAI API 키 | ✅ |
| `SOLAPI_API_KEY` | Solapi API 키 | ✅ |
| `SOLAPI_API_SECRET` | Solapi API 시크릿 | ✅ |
| `SOLAPI_KAKAO_PF_ID` | 카카오 채널 프로필 ID | ✅ |
| `SOLAPI_TEMPLATE_CONTRACT_SIGN` | 계약서 서명 템플릿 ID | ✅ |
| `SENDER_PHONE_NUMBER` | 발신자 전화번호 | ✅ |
| `ALIMTALK_ENABLED` | 알림톡 활성화 (true/false) | 선택 |

### 3. DB 마이그레이션 대기

```sql
-- folders 테이블에 색상 컬럼 추가 (선택)
ALTER TABLE folders ADD COLUMN color text DEFAULT '#3B82F6';
```

---

## ✅ 완료된 주요 기능 요약

### Phase 1: Foundation ✅
- Next.js 14 프로젝트 설정
- Tailwind CSS 커스텀 설정
- Supabase 연동 (클라이언트, 서버, 미들웨어)
- 데이터베이스 마이그레이션 (모든 테이블, RLS, Functions)
- Storage Buckets (signatures, contracts-pdf, chat-files)
- TypeScript 타입 생성

### Phase 2: Authentication ✅
- 카카오 OAuth 로그인
- Apple OAuth 로그인
- 역할 선택 (사장님/알바생)
- 미들웨어 보호 라우트

### Phase 3: Core UI Components ✅
- Design System 컴포넌트 (Button, Input, Card, Badge 등)
- 레이아웃 컴포넌트 (Header, MenuSheet, TabBar, BottomNav)
- 스플래시 & 온보딩 화면

### Phase 4: Employer Features ✅
- 사업자 대시보드 (섹션 기반, 폴더 탭)
- 계약서 작성 Funnel (10단계)
  - Step 1: 사업장 선택/등록
  - Step 2: 계약 형태 (정규직/계약직)
  - Step 3: 사업장 규모
  - Step 4: 근로자 이름/연락처
  - Step 5: 급여 (시급/월급)
  - Step 6: 근무 기간
  - Step 7: 근무 요일
  - Step 8: 근무 시간
  - Step 9: 휴게 시간
  - Step 10: 업무 내용 + 급여일
- 계약서 미리보기 & 서명
- AI 노무사 검토 (무료)
- 계약서 공유 (알림톡 + 링크 복사)
- 계약서 상세 & 관리
- 폴더 관리
- 휴지통 (Soft Delete)
- 계약서 수정 (체결 후 7일 이내)
- 민감정보 보안 열람 (4대보험용)

### Phase 5: Worker Features ⚠️ (95% 완료)
- 근로자 온보딩 (본인인증, 주민번호, 계좌)
- 근로자 대시보드
- 계약서 확인 & 서명
- 경력 관리 (퇴사 처리 포함)
- 계약서 숨기기 기능

### Phase 6: Payment System ✅
- 토스페이먼츠 SDK 연동
- 크레딧 구매 UI
- 결제 준비/확인 API
- 결제 내역 조회

### 추가 구현된 기능
- 카카오 알림톡 (Solapi)
- 서명 증적 정보 저장 (IP, User-Agent)
- 법적 페이지 (이용약관, 개인정보처리방침, 환불정책)
- SSN 해시 솔트 보안 강화
- URL 단축 라우트 (/s/[token])

---

## 📅 개발 우선순위

### 즉시 필요 (P0)
- [x] 모든 핵심 기능 완료 ✅

### 권장 (P1)
- [ ] Vercel 배포 설정
- [ ] 프로덕션 환경 변수 설정

### 추후 (P2)
- [ ] 추가 알림톡 템플릿
- [ ] 게스트 모드 완전 구현
- [ ] 채팅 기능 완성

### 선택 (P3)
- [ ] E2E 테스트
- [ ] 용어 설명 기능
- [ ] 경력증명서 PDF

---

> **문서 끝**
