# 🎨 UI Specification
## 싸인해주세요 (SignPlease)

> **버전**: 1.0  
> **최종 수정일**: 2026년 1월 24일  
> **디자인 철학**: Toss-style Radical Simplicity

---

## 0. Design System

### 0.1 Color Palette

```css
/* Primary */
--primary: #3182F6;        /* 토스 블루 - text-blue-500 */
--primary-light: #EBF4FF;  /* 연한 블루 배경 - bg-blue-50 */

/* Neutral */
--white: #FFFFFF;
--gray-50: #F9FAFB;        /* 카드 배경, 구분선 */
--gray-100: #F3F4F6;       /* 입력 필드 배경 */
--gray-300: #D1D5DB;       /* 비활성 텍스트 */
--gray-400: #9CA3AF;       /* placeholder */
--gray-500: #6B7280;       /* 보조 텍스트 */
--gray-900: #191F28;       /* 메인 텍스트 */

/* Semantic */
--success: #22C55E;        /* 완료, 적합 */
--warning: #F59E0B;        /* 대기, 주의 */
--error: #EF4444;          /* 오류, 수정필요 */

/* Kakao */
--kakao: #FEE500;          /* 카카오 버튼 */
--kakao-text: #191919;
```

### 0.2 Typography Scale

```css
/* Heading - 질문, 핵심 메시지 */
.text-hero     { @apply text-[32px] font-bold leading-tight; }      /* 숫자 강조 */
.text-title    { @apply text-[26px] font-bold leading-snug; }       /* 페이지 질문 */
.text-subtitle { @apply text-[20px] font-semibold leading-normal; } /* 섹션 타이틀 */

/* Body */
.text-body     { @apply text-[17px] font-normal leading-relaxed; }  /* 본문 */
.text-caption  { @apply text-[14px] font-normal leading-normal; }   /* 설명, 힌트 */
.text-small    { @apply text-[12px] font-medium; }                  /* 배지, 태그 */
```

### 0.3 Spacing & Layout

```css
/* Container */
.container { @apply max-w-md mx-auto min-h-screen bg-white; }

/* Safe Area */
.safe-top    { @apply pt-[env(safe-area-inset-top)]; }
.safe-bottom { @apply pb-[env(safe-area-inset-bottom)]; }

/* Section Spacing */
.section-gap { @apply space-y-6; }
.item-gap    { @apply space-y-3; }
```

### 0.4 Component Tokens

```css
/* Buttons */
.btn-primary {
  @apply w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg;
  @apply active:bg-blue-600 transition-colors;
  @apply disabled:bg-gray-200 disabled:text-gray-400;
}

.btn-secondary {
  @apply w-full py-4 rounded-2xl bg-gray-100 text-gray-900 font-semibold text-lg;
  @apply active:bg-gray-200 transition-colors;
}

.btn-kakao {
  @apply w-full py-4 rounded-2xl bg-[#FEE500] text-[#191919] font-semibold text-lg;
  @apply flex items-center justify-center gap-2;
}

.btn-ghost {
  @apply text-gray-500 text-[15px] font-medium;
}

/* Cards */
.card {
  @apply bg-white rounded-2xl p-5;
  @apply active:bg-gray-50 transition-colors;
}

.card-elevated {
  @apply bg-white rounded-2xl p-5 shadow-sm;
}

/* Input Fields */
.input-underline {
  @apply w-full border-0 border-b-2 border-gray-200 bg-transparent;
  @apply text-[28px] font-bold text-gray-900 placeholder-gray-300;
  @apply focus:border-blue-500 focus:outline-none transition-colors;
  @apply py-2;
}

.input-box {
  @apply w-full bg-gray-100 rounded-2xl px-5 py-4;
  @apply text-[17px] text-gray-900 placeholder-gray-400;
  @apply border-2 border-transparent focus:border-blue-500 focus:outline-none;
}

/* Bottom Sheet */
.bottom-sheet {
  @apply fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl;
  @apply px-6 pt-3 pb-8 safe-bottom;
}

.bottom-sheet-handle {
  @apply w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6;
}

/* Chip / Badge */
.badge-waiting { @apply bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-small font-medium; }
.badge-complete { @apply bg-green-100 text-green-600 px-3 py-1 rounded-full text-small font-medium; }
.badge-expired { @apply bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-small font-medium; }

/* Progress Bar */
.progress-bar {
  @apply h-1 bg-gray-100 rounded-full overflow-hidden;
}
.progress-fill {
  @apply h-full bg-blue-500 transition-all duration-300;
}
```

---

## 1. 공통 페이지 (Public)

---

### 1.1 스플래시 (`/`)

**Design Intent**  
첫 인상. 브랜드를 각인시키고, 로딩 중임을 인지시킨다. 화려함보다 '신뢰감'.

**Layout Structure**

```
┌─────────────────────────────┐
│                             │
│                             │
│                             │
│          ✏️ (로고)          │   ← 중앙 정렬, 애니메이션
│                             │
│       싸인해주세요           │   ← text-subtitle, text-gray-900
│                             │
│                             │
│         ● ● ●               │   ← 로딩 도트 애니메이션
│                             │
└─────────────────────────────┘

Container: flex flex-col items-center justify-center min-h-screen bg-white
```

**Tailwind Implementation**

```html
<div class="flex flex-col items-center justify-center min-h-screen bg-white">
  <!-- Logo -->
  <div class="w-20 h-20 mb-4 animate-bounce-slow">
    <svg><!-- 펜/서명 아이콘 --></svg>
  </div>
  
  <!-- Service Name -->
  <h1 class="text-[22px] font-bold text-gray-900 tracking-tight">
    싸인해주세요
  </h1>
  
  <!-- Loading Dots -->
  <div class="flex gap-1 mt-8">
    <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
    <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100"></span>
    <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-200"></span>
  </div>
</div>
```

**Interaction**
- 로고 부드럽게 페이드인 (0.3s)
- 2초 후 자동 이동
- 로그인 상태 → 대시보드 / 비로그인 → 온보딩

---

### 1.2 온보딩 (`/onboarding`)

**Design Intent**  
서비스의 3가지 핵심 가치를 빠르게 전달. 읽지 않아도 이해되는 비주얼.

**Layout Structure**

```
┌─────────────────────────────┐
│                   건너뛰기   │   ← fixed top-right, text-gray-400
│                             │
│                             │
│    ┌─────────────────┐      │
│    │   [일러스트]     │      │   ← 240x240, 중앙
│    │   (계약서 작성)  │      │
│    └─────────────────┘      │
│                             │
│   10분이면 끝나요            │   ← text-title, text-gray-900
│                             │
│   어려운 법률 용어 없이       │   ← text-body, text-gray-500
│   질문에 답하기만 하면        │
│   계약서가 완성돼요           │
│                             │
│         ● ○ ○               │   ← 인디케이터
│                             │
├─────────────────────────────┤
│  ┌─────────────────────┐    │
│  │     시작하기        │    │   ← btn-primary, fixed bottom
│  └─────────────────────┘    │
│                             │
│       먼저 둘러볼게요 →      │   ← btn-ghost, 중앙
│                             │
└─────────────────────────────┘

px-6, safe-bottom
```

**Slide Contents**

| Slide | 타이틀 | 설명 | 일러스트 컨셉 |
|-------|--------|------|--------------|
| 1 | 10분이면 끝나요 | 어려운 법률 용어 없이<br>질문에 답하기만 하면<br>계약서가 완성돼요 | 체크리스트 완료 |
| 2 | AI가 검토해줘요 | 작성한 계약서를<br>AI 노무사가 검토하고<br>문제가 있으면 알려줘요 | 로봇 + 문서 |
| 3 | 안전하게 보관돼요 | 서명한 계약서는<br>클라우드에 영구 보관<br>언제든 꺼내볼 수 있어요 | 클라우드 + 자물쇠 |

**Tailwind Implementation**

```html
<div class="relative min-h-screen bg-white flex flex-col">
  <!-- Skip Button -->
  <button class="absolute top-4 right-4 text-gray-400 text-[15px] z-10 safe-top">
    건너뛰기
  </button>
  
  <!-- Slide Content -->
  <div class="flex-1 flex flex-col items-center justify-center px-6">
    <!-- Illustration -->
    <div class="w-60 h-60 mb-10">
      <img src="/illust-1.svg" alt="" class="w-full h-full" />
    </div>
    
    <!-- Title -->
    <h1 class="text-[26px] font-bold text-gray-900 text-center mb-3">
      10분이면 끝나요
    </h1>
    
    <!-- Description -->
    <p class="text-[17px] text-gray-500 text-center leading-relaxed">
      어려운 법률 용어 없이<br/>
      질문에 답하기만 하면<br/>
      계약서가 완성돼요
    </p>
    
    <!-- Indicator -->
    <div class="flex gap-2 mt-8">
      <span class="w-2 h-2 rounded-full bg-blue-500"></span>
      <span class="w-2 h-2 rounded-full bg-gray-200"></span>
      <span class="w-2 h-2 rounded-full bg-gray-200"></span>
    </div>
  </div>
  
  <!-- Bottom Actions (Fixed) -->
  <div class="px-6 pb-4 safe-bottom space-y-3">
    <button class="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg">
      시작하기
    </button>
    <button class="w-full py-3 text-gray-500 text-[15px] font-medium">
      먼저 둘러볼게요 →
    </button>
  </div>
</div>
```

**Interaction**
- 스와이프로 슬라이드 전환
- 마지막 슬라이드에서 "시작하기" 강조 애니메이션
- 인디케이터 현재 위치 표시

**UX Writing**
- Main Copy: "10분이면 끝나요"
- Sub Copy: "어려운 법률 용어 없이 질문에 답하기만 하면 계약서가 완성돼요"
- Button Labels: "시작하기" / "먼저 둘러볼게요 →"

---

### 1.3 회원가입 & 로그인 (`/signup`, `/login`)

**Design Intent**  
한 가지 방법만 제시. 카카오 버튼 하나로 모든 게 끝난다는 느낌.

**Layout Structure**

```
┌─────────────────────────────┐
│ ←                           │   ← 뒤로가기 (로그인만)
│                             │
│                             │
│                             │
│          ✏️                 │   ← 로고
│                             │
│       싸인해주세요           │   ← text-[22px] font-bold
│                             │
│   계약서 작성부터 서명까지    │   ← text-[15px] text-gray-500
│   한 곳에서 간편하게          │
│                             │
│                             │
│                             │
│                             │
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐    │
│  │ 🟡 카카오로 시작하기  │    │   ← btn-kakao
│  └─────────────────────┘    │
│                             │
│   시작하면 이용약관 및        │   ← text-[13px] text-gray-400
│   개인정보 처리방침에         │
│   동의하는 것으로 봐요        │
│                             │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<div class="min-h-screen bg-white flex flex-col px-6">
  <!-- Back Button (로그인 화면만) -->
  <div class="h-14 flex items-center safe-top">
    <button class="w-10 h-10 flex items-center justify-center -ml-2">
      <svg class="w-6 h-6 text-gray-900"><!-- 뒤로가기 아이콘 --></svg>
    </button>
  </div>
  
  <!-- Content -->
  <div class="flex-1 flex flex-col items-center justify-center">
    <!-- Logo -->
    <div class="w-16 h-16 mb-4">
      <svg><!-- 로고 --></svg>
    </div>
    
    <!-- Title -->
    <h1 class="text-[22px] font-bold text-gray-900 mb-2">
      싸인해주세요
    </h1>
    
    <!-- Subtitle -->
    <p class="text-[15px] text-gray-500 text-center">
      계약서 작성부터 서명까지<br/>한 곳에서 간편하게
    </p>
  </div>
  
  <!-- Bottom Actions -->
  <div class="pb-8 safe-bottom space-y-4">
    <!-- Kakao Button -->
    <button class="w-full py-4 rounded-2xl bg-[#FEE500] text-[#191919] font-semibold text-lg flex items-center justify-center gap-2">
      <svg class="w-5 h-5"><!-- 카카오 말풍선 --></svg>
      카카오로 시작하기
    </button>
    
    <!-- Terms Notice -->
    <p class="text-[13px] text-gray-400 text-center leading-relaxed">
      시작하면 <span class="underline">이용약관</span> 및 
      <span class="underline">개인정보 처리방침</span>에<br/>
      동의하는 것으로 봐요
    </p>
  </div>
</div>
```

**Interaction**
- 카카오 버튼 터치 → 카카오 OAuth 페이지 이동
- 가입 완료 시 역할 선택 화면으로 자동 이동
- 로그인 완료 시 대시보드로 이동

**UX Writing**
- Main Copy: "싸인해주세요"
- Sub Copy: "계약서 작성부터 서명까지 한 곳에서 간편하게"
- Button Label: "카카오로 시작하기"
- Notice: "시작하면 이용약관 및 개인정보 처리방침에 동의하는 것으로 봐요"

---

### 1.4 역할 선택 (`/select-role`)

**Design Intent**  
딱 2가지 선택지. 고민 없이 본인에게 해당하는 카드를 누르게.

**Layout Structure**

```
┌─────────────────────────────┐
│                             │
│                             │
│                             │
│   반가워요! 👋               │   ← text-title
│                             │
│   어떻게 사용할 건가요?       │   ← text-body, text-gray-500
│                             │
│                             │
│  ┌─────────────────────┐    │
│  │       👔            │    │   ← 이모지 48px
│  │                     │    │
│  │    사장님이에요      │    │   ← text-[18px] font-bold
│  │    계약서를 작성해요  │    │   ← text-[14px] text-gray-500
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │       👷            │    │
│  │                     │    │
│  │    알바생이에요      │    │
│  │    계약서에 서명해요  │    │
│  └─────────────────────┘    │
│                             │
│                             │
│   나중에 설정에서            │   ← text-[13px] text-gray-400
│   언제든 바꿀 수 있어요       │
│                             │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<div class="min-h-screen bg-white px-6 py-12 safe-top safe-bottom">
  <!-- Header -->
  <div class="mb-10">
    <h1 class="text-[26px] font-bold text-gray-900 mb-2">
      반가워요! 👋
    </h1>
    <p class="text-[17px] text-gray-500">
      어떻게 사용할 건가요?
    </p>
  </div>
  
  <!-- Role Cards -->
  <div class="space-y-4">
    <!-- Employer Card -->
    <button class="w-full bg-gray-50 rounded-2xl p-6 text-left active:bg-gray-100 transition-colors border-2 border-transparent focus:border-blue-500">
      <span class="text-5xl mb-3 block">👔</span>
      <h2 class="text-[18px] font-bold text-gray-900 mb-1">사장님이에요</h2>
      <p class="text-[14px] text-gray-500">계약서를 작성해요</p>
    </button>
    
    <!-- Worker Card -->
    <button class="w-full bg-gray-50 rounded-2xl p-6 text-left active:bg-gray-100 transition-colors border-2 border-transparent focus:border-blue-500">
      <span class="text-5xl mb-3 block">👷</span>
      <h2 class="text-[18px] font-bold text-gray-900 mb-1">알바생이에요</h2>
      <p class="text-[14px] text-gray-500">계약서에 서명해요</p>
    </button>
  </div>
  
  <!-- Footer Notice -->
  <p class="text-[13px] text-gray-400 text-center mt-8">
    나중에 설정에서 언제든 바꿀 수 있어요
  </p>
</div>
```

**Interaction**
- 카드 선택 시 `border-blue-500` 활성화
- 선택 후 0.3초 후 자동 이동
- 사장님 → `/employer`
- 알바생 → `/worker/onboarding`

**UX Writing**
- Main Copy: "반가워요! 👋"
- Sub Copy: "어떻게 사용할 건가요?"
- Notice: "나중에 설정에서 언제든 바꿀 수 있어요"

---

### 1.5 둘러보기 역할 선택 (`/guest`)

**Design Intent**  
온보딩과 같은 역할 선택이지만, '체험'임을 명확히 인지시킴.

**Layout Structure**

```
┌─────────────────────────────┐
│ ←                           │
│                             │
│   어떤 역할로                │   ← text-title
│   체험해볼까요?              │
│                             │
│                             │
│  ┌─────────────────────┐    │
│  │ 👔  사장님으로 체험   │    │
│  │     계약서 작성해보기  │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 👷  알바생으로 체험   │    │
│  │     계약서 확인해보기  │    │
│  └─────────────────────┘    │
│                             │
│                             │
│  ℹ️ 일부 기능은 가입 후      │   ← text-[13px] text-gray-400
│     이용할 수 있어요         │
│                             │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<div class="min-h-screen bg-white px-6 safe-top safe-bottom">
  <!-- Header -->
  <div class="h-14 flex items-center">
    <button class="w-10 h-10 flex items-center justify-center -ml-2">
      <svg class="w-6 h-6 text-gray-900"><!-- back --></svg>
    </button>
  </div>
  
  <!-- Title -->
  <div class="mb-10 mt-4">
    <h1 class="text-[26px] font-bold text-gray-900 leading-tight">
      어떤 역할로<br/>체험해볼까요?
    </h1>
  </div>
  
  <!-- Role Cards -->
  <div class="space-y-4">
    <button class="w-full bg-gray-50 rounded-2xl p-5 flex items-center gap-4 active:bg-gray-100">
      <span class="text-4xl">👔</span>
      <div class="text-left">
        <h2 class="text-[17px] font-bold text-gray-900">사장님으로 체험</h2>
        <p class="text-[14px] text-gray-500">계약서 작성해보기</p>
      </div>
      <svg class="w-5 h-5 text-gray-400 ml-auto"><!-- chevron-right --></svg>
    </button>
    
    <button class="w-full bg-gray-50 rounded-2xl p-5 flex items-center gap-4 active:bg-gray-100">
      <span class="text-4xl">👷</span>
      <div class="text-left">
        <h2 class="text-[17px] font-bold text-gray-900">알바생으로 체험</h2>
        <p class="text-[14px] text-gray-500">계약서 확인해보기</p>
      </div>
      <svg class="w-5 h-5 text-gray-400 ml-auto"><!-- chevron-right --></svg>
    </button>
  </div>
  
  <!-- Notice -->
  <div class="mt-8 flex items-start gap-2 text-[13px] text-gray-400">
    <svg class="w-4 h-4 mt-0.5 flex-shrink-0"><!-- info-circle --></svg>
    <span>일부 기능은 가입 후 이용할 수 있어요</span>
  </div>
</div>
```

---

### 1.6 게스트 모드 배너 (공통 컴포넌트)

**Design Intent**  
게스트임을 항상 인지시키되, 방해하지 않게. 가입 유도 CTA 포함.

**Tailwind Implementation**

```html
<!-- 상단 고정 배너 -->
<div class="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white safe-top">
  <div class="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
    <span class="text-[14px] font-medium flex items-center gap-1.5">
      ⚡️ 둘러보기 중
    </span>
    <button class="bg-white text-blue-500 text-[13px] font-semibold px-3 py-1.5 rounded-full">
      가입하기
    </button>
  </div>
</div>

<!-- 배너 높이만큼 padding -->
<div class="pt-12 safe-top">
  <!-- 페이지 콘텐츠 -->
</div>
```

---

### 1.7 회원가입 유도 Bottom Sheet

**Design Intent**  
팝업이 아닌 바텀시트로 맥락 유지. 강압적이지 않게 유도.

**Tailwind Implementation**

```html
<!-- Backdrop -->
<div class="fixed inset-0 bg-black/40 z-50"></div>

<!-- Bottom Sheet -->
<div class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl safe-bottom">
  <!-- Handle -->
  <div class="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3"></div>
  
  <!-- Content -->
  <div class="px-6 py-8">
    <!-- Icon -->
    <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
      <span class="text-3xl">🔒</span>
    </div>
    
    <!-- Title -->
    <h2 class="text-[20px] font-bold text-gray-900 text-center mb-2">
      가입하면 이용할 수 있어요
    </h2>
    
    <!-- Description -->
    <p class="text-[15px] text-gray-500 text-center mb-6">
      계약서 저장, 서명, PDF 다운로드는<br/>가입 후 이용할 수 있어요
    </p>
    
    <!-- Buttons -->
    <div class="space-y-3">
      <button class="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg">
        가입하고 계속하기
      </button>
      <button class="w-full py-3 text-gray-500 text-[15px] font-medium">
        계속 둘러보기
      </button>
    </div>
  </div>
</div>
```

---

## 2. 사업자 페이지 (Employer)

---

### 2.1 사업자 대시보드 (`/employer`)

**Design Intent**  
내 계약서 현황을 한눈에. 가장 중요한 '새 계약서 작성'은 FAB으로.

**Layout Structure**

```
┌─────────────────────────────┐
│ 😊  싸인해주세요    🔔  5개  │   ← Header (safe-top)
├─────────────────────────────┤
│ 대기중 │ 완료 │ 폴더 │ 휴지통 │   ← Tab Bar
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │ 김알바                 │  │   ← 계약서 카드
│  │ 시급 12,000원          │  │
│  │ 오늘 · 🟡 서명 대기중   │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 이알바                 │  │
│  │ 시급 11,000원          │  │
│  │ 3일 전 · 🟡 서명 대기중  │  │
│  └───────────────────────┘  │
│                             │
│                             │
│                             │
│                       ┌──┐  │
│                       │＋│  │   ← FAB
│                       └──┘  │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white px-5 safe-top sticky top-0 z-40">
    <div class="h-14 flex items-center justify-between">
      <!-- Profile -->
      <button class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
        <span class="text-lg">😊</span>
      </button>
      
      <!-- Title -->
      <span class="text-[17px] font-bold text-gray-900">싸인해주세요</span>
      
      <!-- Right Actions -->
      <div class="flex items-center gap-3">
        <button class="relative">
          <svg class="w-6 h-6 text-gray-700"><!-- bell --></svg>
          <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button class="bg-blue-50 text-blue-500 text-[13px] font-semibold px-2.5 py-1 rounded-full">
          5개
        </button>
      </div>
    </div>
  </header>
  
  <!-- Tab Bar -->
  <div class="bg-white px-5 sticky top-14 z-30 border-b border-gray-100">
    <div class="flex">
      <button class="flex-1 py-3 text-[15px] font-semibold text-blue-500 border-b-2 border-blue-500">
        대기중
      </button>
      <button class="flex-1 py-3 text-[15px] font-medium text-gray-400">
        완료
      </button>
      <button class="flex-1 py-3 text-[15px] font-medium text-gray-400">
        폴더
      </button>
      <button class="flex-1 py-3 text-[15px] font-medium text-gray-400">
        휴지통
      </button>
    </div>
  </div>
  
  <!-- Contract List -->
  <div class="p-4 space-y-3">
    <!-- Contract Card -->
    <button class="w-full bg-white rounded-2xl p-5 text-left active:bg-gray-50 transition-colors">
      <div class="flex items-start justify-between mb-3">
        <h3 class="text-[17px] font-bold text-gray-900">김알바</h3>
        <span class="bg-amber-100 text-amber-600 px-2.5 py-1 rounded-full text-[12px] font-medium">
          서명 대기중
        </span>
      </div>
      <p class="text-[15px] text-gray-700 mb-1">시급 12,000원</p>
      <p class="text-[13px] text-gray-400">오늘</p>
    </button>
    
    <!-- Another Card -->
    <button class="w-full bg-white rounded-2xl p-5 text-left active:bg-gray-50 transition-colors">
      <div class="flex items-start justify-between mb-3">
        <h3 class="text-[17px] font-bold text-gray-900">이알바</h3>
        <span class="bg-amber-100 text-amber-600 px-2.5 py-1 rounded-full text-[12px] font-medium">
          서명 대기중
        </span>
      </div>
      <p class="text-[15px] text-gray-700 mb-1">시급 11,000원</p>
      <p class="text-[13px] text-gray-400">3일 전</p>
    </button>
  </div>
  
  <!-- FAB -->
  <button class="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center active:bg-blue-600 safe-bottom">
    <svg class="w-7 h-7 text-white"><!-- plus --></svg>
  </button>
</div>
```

**Empty State (계약서 없을 때)**

```html
<div class="flex-1 flex flex-col items-center justify-center px-6 py-20">
  <div class="w-24 h-24 mb-6">
    <svg><!-- 빈 문서 일러스트 --></svg>
  </div>
  <h2 class="text-[18px] font-bold text-gray-900 mb-2">
    아직 계약서가 없어요
  </h2>
  <p class="text-[15px] text-gray-500 text-center mb-6">
    첫 번째 계약서를 작성해보세요
  </p>
  <button class="bg-blue-500 text-white text-[15px] font-semibold px-6 py-3 rounded-xl">
    계약서 작성하기
  </button>
</div>
```

**UX Writing**
- Empty State: "아직 계약서가 없어요" / "첫 번째 계약서를 작성해보세요"
- Badge: "서명 대기중" / "서명 완료" / "만료됨"

---

### 2.2 계약서 작성 Funnel (`/employer/create`)

**Design Intent**  
한 화면에 하나의 질문. 생각하지 않아도 되는 입력 경험.

---

#### Step 1: 사업장 규모

**Layout Structure**

```
┌─────────────────────────────┐
│ ←                     1/10  │
│ ████░░░░░░░░░░░░░░░░░░░░░░░ │   ← Progress
│                             │
│                             │
│   사업장 규모가              │   ← text-title
│   어떻게 되나요?             │
│                             │
│   4대보험 적용 여부가         │   ← text-[15px] text-gray-500
│   달라져요                   │
│                             │
│                             │
│  ┌─────────────────────┐    │
│  │ ○  5인 미만           │    │   ← 선택 카드
│  │    (4대보험 선택 가입) │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ ○  5인 이상           │    │
│  │    (4대보험 의무 가입) │    │
│  └─────────────────────┘    │
│                             │
│                             │
├─────────────────────────────┤
│  ┌─────────────────────┐    │
│  │       다음          │    │   ← disabled until selected
│  └─────────────────────┘    │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<div class="min-h-screen bg-white flex flex-col">
  <!-- Header -->
  <header class="px-5 safe-top">
    <div class="h-14 flex items-center justify-between">
      <button class="w-10 h-10 flex items-center justify-center -ml-2">
        <svg class="w-6 h-6 text-gray-900"><!-- back --></svg>
      </button>
      <span class="text-[14px] text-gray-400 font-medium">1/10</span>
    </div>
    <!-- Progress Bar -->
    <div class="h-1 bg-gray-100 rounded-full overflow-hidden">
      <div class="h-full bg-blue-500 w-[10%] transition-all duration-300"></div>
    </div>
  </header>
  
  <!-- Content -->
  <div class="flex-1 px-6 pt-8">
    <!-- Question -->
    <h1 class="text-[26px] font-bold text-gray-900 leading-tight mb-2">
      사업장 규모가<br/>어떻게 되나요?
    </h1>
    <p class="text-[15px] text-gray-500 mb-8">
      4대보험 적용 여부가 달라져요
    </p>
    
    <!-- Options -->
    <div class="space-y-3">
      <button class="w-full border-2 border-gray-200 rounded-2xl p-5 text-left transition-colors [&.selected]:border-blue-500 [&.selected]:bg-blue-50">
        <div class="flex items-center gap-3">
          <span class="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center [.selected_&]:border-blue-500 [.selected_&]:bg-blue-500">
            <svg class="w-4 h-4 text-white hidden [.selected_&]:block"><!-- check --></svg>
          </span>
          <div>
            <span class="text-[17px] font-semibold text-gray-900 block">5인 미만</span>
            <span class="text-[14px] text-gray-500">4대보험 선택 가입</span>
          </div>
        </div>
      </button>
      
      <button class="w-full border-2 border-gray-200 rounded-2xl p-5 text-left transition-colors">
        <div class="flex items-center gap-3">
          <span class="w-6 h-6 rounded-full border-2 border-gray-300"></span>
          <div>
            <span class="text-[17px] font-semibold text-gray-900 block">5인 이상</span>
            <span class="text-[14px] text-gray-500">4대보험 의무 가입</span>
          </div>
        </div>
      </button>
    </div>
  </div>
  
  <!-- Bottom Button -->
  <div class="px-6 pb-4 safe-bottom">
    <button disabled class="w-full py-4 rounded-2xl bg-gray-200 text-gray-400 font-semibold text-lg disabled:bg-gray-200 disabled:text-gray-400 [&:not(:disabled)]:bg-blue-500 [&:not(:disabled)]:text-white">
      다음
    </button>
  </div>
</div>
```

---

#### Step 2: 근로자 이름

**Layout Structure**

```
┌─────────────────────────────┐
│ ←                     2/10  │
│ ████████░░░░░░░░░░░░░░░░░░░ │
│                             │
│                             │
│   근로자 이름이              │
│   어떻게 되나요?             │
│                             │
│                             │
│  ┌─────────────────────┐    │
│  │ 홍길동               │    │   ← input-underline, autofocus
│  └──────────────────────┘    │
│                             │
│                             │
│                             │
├─────────────────────────────┤
│  ┌─────────────────────┐    │
│  │       다음          │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<!-- Content Area -->
<div class="flex-1 px-6 pt-8">
  <h1 class="text-[26px] font-bold text-gray-900 leading-tight mb-8">
    근로자 이름이<br/>어떻게 되나요?
  </h1>
  
  <input 
    type="text" 
    placeholder="이름을 입력하세요"
    autofocus
    class="w-full border-0 border-b-2 border-gray-200 bg-transparent text-[28px] font-bold text-gray-900 placeholder-gray-300 focus:border-blue-500 focus:outline-none py-2 transition-colors"
  />
</div>
```

---

#### Step 3: 시급

**Layout Structure**

```
┌─────────────────────────────┐
│ ←                     3/10  │
│ ████████████░░░░░░░░░░░░░░░ │
│                             │
│                             │
│   시급을                    │
│   얼마로 할까요?             │
│                             │
│                             │
│       12,000           원   │   ← 숫자 입력, 자동 콤마
│  ─────────────────────────  │
│                             │
│  ☐ 주휴수당이 포함된 시급     │   ← 체크박스
│                             │
│  ┌───────────────────────┐  │
│  │ 💡 2026년 최저시급은    │  │   ← 정보 카드
│  │    10,030원이에요      │  │
│  └───────────────────────┘  │
│                             │
├─────────────────────────────┤
│  [이전]        [다음]       │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<div class="flex-1 px-6 pt-8">
  <h1 class="text-[26px] font-bold text-gray-900 leading-tight mb-8">
    시급을<br/>얼마로 할까요?
  </h1>
  
  <!-- Wage Input -->
  <div class="flex items-end gap-2 mb-4">
    <input 
      type="text"
      inputmode="numeric"
      value="12,000"
      class="flex-1 border-0 border-b-2 border-blue-500 bg-transparent text-[36px] font-bold text-gray-900 text-right focus:outline-none py-2"
    />
    <span class="text-[20px] font-semibold text-gray-500 pb-3">원</span>
  </div>
  
  <!-- Checkbox -->
  <label class="flex items-center gap-3 py-3">
    <input type="checkbox" class="sr-only peer" />
    <span class="w-6 h-6 rounded-md border-2 border-gray-300 peer-checked:bg-blue-500 peer-checked:border-blue-500 flex items-center justify-center">
      <svg class="w-4 h-4 text-white hidden peer-checked:block"><!-- check --></svg>
    </span>
    <span class="text-[15px] text-gray-700">주휴수당이 포함된 시급</span>
  </label>
  
  <!-- Info Card -->
  <div class="bg-blue-50 rounded-xl p-4 mt-6 flex items-center gap-3">
    <span class="text-xl">💡</span>
    <span class="text-[14px] text-blue-700">2026년 최저시급은 <strong>10,030원</strong>이에요</span>
  </div>
</div>

<!-- Bottom Buttons -->
<div class="px-6 pb-4 safe-bottom flex gap-3">
  <button class="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-lg">
    이전
  </button>
  <button class="flex-1 py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg">
    다음
  </button>
</div>
```

**Interaction**
- 숫자 입력 시 자동 3자리 콤마
- 최저시급 미만 입력 시 경고 메시지

---

#### Step 4: 근무 기간

**Layout Structure**

```
┌─────────────────────────────┐
│ ←                     4/10  │
│ ████████████████░░░░░░░░░░░ │
│                             │
│                             │
│   언제부터 일하나요?          │
│                             │
│                             │
│   시작일                     │
│  ┌─────────────────────┐    │
│  │ 2026년 1월 27일   📅  │    │   ← 날짜 선택
│  └─────────────────────┘    │
│                             │
│   종료일                     │
│  ┌─────────────────────┐    │
│  │ 2026년 7월 26일   📅  │    │
│  └─────────────────────┘    │
│                             │
│  ☐ 종료일 없이 계속 일해요    │   ← 체크 시 종료일 비활성
│                             │
├─────────────────────────────┤
│  [이전]        [다음]       │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<div class="flex-1 px-6 pt-8">
  <h1 class="text-[26px] font-bold text-gray-900 leading-tight mb-8">
    언제부터 일하나요?
  </h1>
  
  <div class="space-y-5">
    <!-- Start Date -->
    <div>
      <label class="text-[14px] text-gray-500 font-medium mb-2 block">시작일</label>
      <button class="w-full bg-gray-100 rounded-2xl px-5 py-4 flex items-center justify-between">
        <span class="text-[17px] text-gray-900 font-medium">2026년 1월 27일</span>
        <svg class="w-5 h-5 text-gray-400"><!-- calendar --></svg>
      </button>
    </div>
    
    <!-- End Date -->
    <div>
      <label class="text-[14px] text-gray-500 font-medium mb-2 block">종료일</label>
      <button class="w-full bg-gray-100 rounded-2xl px-5 py-4 flex items-center justify-between disabled:opacity-50">
        <span class="text-[17px] text-gray-900 font-medium">2026년 7월 26일</span>
        <svg class="w-5 h-5 text-gray-400"><!-- calendar --></svg>
      </button>
    </div>
    
    <!-- No End Date -->
    <label class="flex items-center gap-3 py-2">
      <input type="checkbox" class="sr-only peer" />
      <span class="w-6 h-6 rounded-md border-2 border-gray-300 peer-checked:bg-blue-500 peer-checked:border-blue-500 flex items-center justify-center">
        <svg class="w-4 h-4 text-white hidden peer-checked:block"><!-- check --></svg>
      </span>
      <span class="text-[15px] text-gray-700">종료일 없이 계속 일해요</span>
    </label>
  </div>
</div>
```

---

#### Step 5: 근무 요일

**Layout Structure**

```
┌─────────────────────────────┐
│ ←                     5/10  │
│ ████████████████████░░░░░░░ │
│                             │
│                             │
│   무슨 요일에 일하나요?       │
│                             │
│                             │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │
│  │월│ │화│ │수│ │목│ │금│  │   ← 다중 선택 칩
│  └──┘ └──┘ └──┘ └──┘ └──┘  │
│                             │
│       ┌──┐ ┌──┐            │
│       │토│ │일│            │
│       └──┘ └──┘            │
│                             │
│         또는                 │
│                             │
│  ┌─────────────────────┐    │
│  │ 일주일에   3   일    │    │   ← 주N일 입력
│  └─────────────────────┘    │
│                             │
├─────────────────────────────┤
│  [이전]        [다음]       │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<div class="flex-1 px-6 pt-8">
  <h1 class="text-[26px] font-bold text-gray-900 leading-tight mb-8">
    무슨 요일에 일하나요?
  </h1>
  
  <!-- Day Chips -->
  <div class="flex flex-wrap gap-2 mb-6">
    <button class="w-12 h-12 rounded-full bg-blue-500 text-white font-semibold text-[15px]">월</button>
    <button class="w-12 h-12 rounded-full bg-gray-100 text-gray-700 font-semibold text-[15px]">화</button>
    <button class="w-12 h-12 rounded-full bg-blue-500 text-white font-semibold text-[15px]">수</button>
    <button class="w-12 h-12 rounded-full bg-gray-100 text-gray-700 font-semibold text-[15px]">목</button>
    <button class="w-12 h-12 rounded-full bg-blue-500 text-white font-semibold text-[15px]">금</button>
    <button class="w-12 h-12 rounded-full bg-gray-100 text-gray-700 font-semibold text-[15px]">토</button>
    <button class="w-12 h-12 rounded-full bg-gray-100 text-gray-700 font-semibold text-[15px]">일</button>
  </div>
  
  <!-- Divider -->
  <div class="flex items-center gap-4 my-6">
    <div class="flex-1 h-px bg-gray-200"></div>
    <span class="text-[14px] text-gray-400">또는</span>
    <div class="flex-1 h-px bg-gray-200"></div>
  </div>
  
  <!-- Weekly Input -->
  <div class="bg-gray-100 rounded-2xl px-5 py-4 flex items-center justify-center gap-2">
    <span class="text-[17px] text-gray-500">일주일에</span>
    <input 
      type="number" 
      value="3"
      min="1" 
      max="7"
      class="w-12 text-center bg-white rounded-lg py-2 text-[20px] font-bold text-gray-900"
    />
    <span class="text-[17px] text-gray-500">일</span>
  </div>
</div>
```

---

#### Step 6: 근무 시간

**Layout Structure**

```
┌─────────────────────────────┐
│ ←                     6/10  │
│ ████████████████████████░░░ │
│                             │
│                             │
│   몇 시부터 몇 시까지         │
│   일하나요?                  │
│                             │
│                             │
│   ┌─────────────────────┐   │
│   │  14:00  →  20:00   │   │   ← 시간 선택
│   └─────────────────────┘   │
│                             │
│   하루에 6시간 일해요         │   ← 자동 계산
│                             │
│                             │
├─────────────────────────────┤
│  [이전]        [다음]       │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<div class="flex-1 px-6 pt-8">
  <h1 class="text-[26px] font-bold text-gray-900 leading-tight mb-8">
    몇 시부터 몇 시까지<br/>일하나요?
  </h1>
  
  <!-- Time Picker -->
  <div class="bg-gray-100 rounded-2xl p-6 flex items-center justify-center gap-4">
    <button class="text-[28px] font-bold text-gray-900">14:00</button>
    <span class="text-[20px] text-gray-400">→</span>
    <button class="text-[28px] font-bold text-gray-900">20:00</button>
  </div>
  
  <!-- Auto Calculation -->
  <p class="text-[15px] text-gray-500 text-center mt-4">
    하루에 <span class="font-semibold text-blue-500">6시간</span> 일해요
  </p>
</div>
```

---

#### Step 7: 휴게 시간

**Layout Structure**

```
┌─────────────────────────────┐
│ ←                     7/10  │
│ ████████████████████████████░ │
│                             │
│                             │
│   휴게시간은                 │
│   얼마나 줄 건가요?           │
│                             │
│   4시간 이상 근무 시          │   ← 법적 안내
│   30분 이상 필수예요          │
│                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ │
│  │ 30분 │ │ 60분 │ │ 직접 │ │   ← 선택 칩
│  └──────┘ └──────┘ │ 입력 │ │
│                    └──────┘ │
│                             │
├─────────────────────────────┤
│  [이전]        [다음]       │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<div class="flex-1 px-6 pt-8">
  <h1 class="text-[26px] font-bold text-gray-900 leading-tight mb-2">
    휴게시간은<br/>얼마나 줄 건가요?
  </h1>
  <p class="text-[15px] text-gray-500 mb-8">
    4시간 이상 근무 시 30분 이상 필수예요
  </p>
  
  <!-- Break Time Options -->
  <div class="flex gap-3">
    <button class="flex-1 py-4 rounded-2xl bg-blue-500 text-white font-semibold text-[17px]">
      30분
    </button>
    <button class="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-[17px]">
      60분
    </button>
    <button class="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-[17px]">
      직접 입력
    </button>
  </div>
</div>
```

---

#### Step 8: 근무 장소

**Layout Structure**

```
┌─────────────────────────────┐
│ ←                     8/10  │
│ ██████████████████████████████░ │
│                             │
│                             │
│   어디서 일하나요?            │
│                             │
│                             │
│  ┌─────────────────────┐    │
│  │ 🔍 주소 검색          │    │   ← 주소 검색 트리거
│  └─────────────────────┘    │
│                             │
│   또는                       │
│                             │
│  ┌─────────────────────┐    │
│  │ 직접 입력             │    │
│  └─────────────────────┘    │
│                             │
├─────────────────────────────┤
│  [이전]        [다음]       │
└─────────────────────────────┘
```

---

#### Step 9: 업무 내용

**Layout Structure**

```
┌─────────────────────────────┐
│ ←                     9/10  │
│ ████████████████████████████████░ │
│                             │
│                             │
│   어떤 일을 하나요?           │
│                             │
│                             │
│  ┌─────────────────────┐    │
│  │ 홀서빙, 주문 접수,    │    │   ← 텍스트 영역
│  │ 매장 청소            │    │
│  │                     │    │
│  └─────────────────────┘    │
│                             │
│   예시: 홀서빙, 주방보조,     │   ← 예시 태그
│   음료 제조, 포장            │
│                             │
│  ┌───┐ ┌──────┐ ┌──────┐   │
│  │홀서빙│ │주방보조│ │음료제조│   │   ← 클릭 시 자동 입력
│  └───┘ └──────┘ └──────┘   │
│                             │
├─────────────────────────────┤
│  [이전]        [다음]       │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<div class="flex-1 px-6 pt-8">
  <h1 class="text-[26px] font-bold text-gray-900 leading-tight mb-8">
    어떤 일을 하나요?
  </h1>
  
  <!-- Textarea -->
  <textarea 
    placeholder="업무 내용을 입력하세요"
    rows="4"
    class="w-full bg-gray-100 rounded-2xl px-5 py-4 text-[17px] text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
  >홀서빙, 주문 접수, 매장 청소</textarea>
  
  <!-- Example Tags -->
  <p class="text-[14px] text-gray-400 mt-4 mb-2">자주 쓰는 예시</p>
  <div class="flex flex-wrap gap-2">
    <button class="px-4 py-2 bg-gray-100 rounded-full text-[14px] text-gray-700 active:bg-gray-200">
      홀서빙
    </button>
    <button class="px-4 py-2 bg-gray-100 rounded-full text-[14px] text-gray-700 active:bg-gray-200">
      주방보조
    </button>
    <button class="px-4 py-2 bg-gray-100 rounded-full text-[14px] text-gray-700 active:bg-gray-200">
      음료 제조
    </button>
    <button class="px-4 py-2 bg-gray-100 rounded-full text-[14px] text-gray-700 active:bg-gray-200">
      포장
    </button>
    <button class="px-4 py-2 bg-gray-100 rounded-full text-[14px] text-gray-700 active:bg-gray-200">
      배달
    </button>
  </div>
</div>
```

---

#### Step 10: 급여 지급일

**Layout Structure**

```
┌─────────────────────────────┐
│ ←                    10/10  │
│ ██████████████████████████████████ │
│                             │
│                             │
│   월급은 언제 줄 건가요?      │
│                             │
│                             │
│         매월                │
│                             │
│    ┌───────────────┐        │
│    │      10       │ 일     │   ← 숫자 롤러/입력
│    └───────────────┘        │
│                             │
│   다음 월급일: 2월 10일       │   ← 자동 계산
│                             │
│                             │
├─────────────────────────────┤
│  ┌─────────────────────┐    │
│  │   계약서 미리보기 →   │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<div class="flex-1 px-6 pt-8">
  <h1 class="text-[26px] font-bold text-gray-900 leading-tight mb-8">
    월급은 언제 줄 건가요?
  </h1>
  
  <!-- Pay Day Picker -->
  <div class="flex items-center justify-center gap-2 mb-4">
    <span class="text-[20px] text-gray-500">매월</span>
    <input 
      type="number"
      value="10"
      min="1"
      max="31"
      class="w-20 text-center bg-gray-100 rounded-xl py-3 text-[32px] font-bold text-gray-900"
    />
    <span class="text-[20px] text-gray-500">일</span>
  </div>
  
  <!-- Auto Calculation -->
  <p class="text-[15px] text-gray-500 text-center">
    다음 월급일: <span class="font-semibold text-blue-500">2월 10일</span>
  </p>
</div>

<!-- Bottom Button -->
<div class="px-6 pb-4 safe-bottom">
  <button class="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg flex items-center justify-center gap-2">
    계약서 미리보기
    <svg class="w-5 h-5"><!-- arrow-right --></svg>
  </button>
</div>
```

---

### 2.3 계약서 미리보기 (`/employer/preview/:id`)

**Design Intent**  
작성한 내용을 한눈에 확인. 서명과 전송으로 이어지는 마지막 관문.

**Layout Structure**

```
┌─────────────────────────────┐
│ ←  계약서 미리보기           │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │     표준근로계약서        │ │   ← 스크롤 영역
│ │                         │ │
│ │  사업장: ○○카페          │ │
│ │  근로자: 홍길동           │ │
│ │  시급: 12,000원          │ │
│ │  근무시간: 14:00~20:00   │ │
│ │  ...                    │ │
│ │                         │ │
│ │  사업자 서명:            │ │
│ │  ┌─────────────────┐    │ │
│ │  │  [터치하여 서명]  │    │ │
│ │  └─────────────────┘    │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🤖 AI 노무사 검토 받기   │ │   ← 보조 버튼
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│ [PDF] [링크] [카카오]        │   ← 공유 옵션
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │   서명하고 보내기 ✍️     │ │   ← 메인 CTA
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<div class="min-h-screen bg-gray-50 flex flex-col">
  <!-- Header -->
  <header class="bg-white px-5 safe-top sticky top-0 z-40 border-b border-gray-100">
    <div class="h-14 flex items-center">
      <button class="w-10 h-10 flex items-center justify-center -ml-2">
        <svg class="w-6 h-6 text-gray-900"><!-- back --></svg>
      </button>
      <span class="text-[17px] font-bold text-gray-900 ml-2">계약서 미리보기</span>
    </div>
  </header>
  
  <!-- Contract Preview -->
  <div class="flex-1 p-4">
    <div class="bg-white rounded-2xl p-6 shadow-sm">
      <!-- Title -->
      <h2 class="text-[20px] font-bold text-gray-900 text-center mb-6">
        표준근로계약서
      </h2>
      
      <!-- Contract Details -->
      <div class="space-y-4 text-[15px]">
        <div class="flex justify-between py-2 border-b border-gray-100">
          <span class="text-gray-500">사업장</span>
          <span class="text-gray-900 font-medium">○○카페</span>
        </div>
        <div class="flex justify-between py-2 border-b border-gray-100">
          <span class="text-gray-500">근로자</span>
          <span class="text-gray-900 font-medium">홍길동</span>
        </div>
        <div class="flex justify-between py-2 border-b border-gray-100">
          <span class="text-gray-500">시급</span>
          <span class="text-gray-900 font-medium">12,000원</span>
        </div>
        <div class="flex justify-between py-2 border-b border-gray-100">
          <span class="text-gray-500">근무시간</span>
          <span class="text-gray-900 font-medium">14:00 ~ 20:00</span>
        </div>
        <div class="flex justify-between py-2 border-b border-gray-100">
          <span class="text-gray-500">근무요일</span>
          <span class="text-gray-900 font-medium">월, 수, 금</span>
        </div>
        <div class="flex justify-between py-2 border-b border-gray-100">
          <span class="text-gray-500">휴게시간</span>
          <span class="text-gray-900 font-medium">30분</span>
        </div>
        <div class="flex justify-between py-2 border-b border-gray-100">
          <span class="text-gray-500">급여일</span>
          <span class="text-gray-900 font-medium">매월 10일</span>
        </div>
      </div>
      
      <!-- Signature Area -->
      <div class="mt-8">
        <p class="text-[14px] text-gray-500 mb-3">사업자 서명</p>
        <button class="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors">
          터치하여 서명
        </button>
      </div>
    </div>
    
    <!-- AI Review Button -->
    <button class="w-full mt-4 bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm active:bg-gray-50">
      <div class="flex items-center gap-3">
        <span class="text-2xl">🤖</span>
        <div>
          <p class="text-[15px] font-semibold text-gray-900">AI 노무사 검토 받기</p>
          <p class="text-[13px] text-gray-500">법적 문제가 없는지 확인해요</p>
        </div>
      </div>
      <svg class="w-5 h-5 text-gray-400"><!-- chevron-right --></svg>
    </button>
  </div>
  
  <!-- Bottom Actions -->
  <div class="bg-white border-t border-gray-100 px-5 pt-3 pb-4 safe-bottom">
    <!-- Share Options -->
    <div class="flex justify-center gap-6 mb-4">
      <button class="flex flex-col items-center gap-1">
        <span class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-gray-600"><!-- document --></svg>
        </span>
        <span class="text-[12px] text-gray-500">PDF</span>
      </button>
      <button class="flex flex-col items-center gap-1">
        <span class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-gray-600"><!-- link --></svg>
        </span>
        <span class="text-[12px] text-gray-500">링크</span>
      </button>
      <button class="flex flex-col items-center gap-1">
        <span class="w-12 h-12 bg-[#FEE500] rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-[#191919]"><!-- kakao --></svg>
        </span>
        <span class="text-[12px] text-gray-500">카카오톡</span>
      </button>
    </div>
    
    <!-- Main CTA -->
    <button class="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg flex items-center justify-center gap-2">
      서명하고 보내기 ✍️
    </button>
  </div>
</div>
```

---

### 2.4 서명 입력 Bottom Sheet

**Design Intent**  
캔버스 기반 자필 서명. 깔끔하고 넓은 서명 공간.

**Tailwind Implementation**

```html
<!-- Backdrop -->
<div class="fixed inset-0 bg-black/40 z-50"></div>

<!-- Bottom Sheet -->
<div class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl safe-bottom">
  <!-- Handle -->
  <div class="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3"></div>
  
  <!-- Content -->
  <div class="px-6 py-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-[20px] font-bold text-gray-900">서명해주세요</h2>
      <button class="text-[15px] text-gray-500">다시 쓰기</button>
    </div>
    
    <!-- Signature Canvas -->
    <div class="w-full h-48 bg-gray-50 rounded-2xl border-2 border-gray-200 relative">
      <canvas class="w-full h-full"></canvas>
      <p class="absolute inset-0 flex items-center justify-center text-gray-300 text-[15px] pointer-events-none">
        여기에 서명하세요
      </p>
    </div>
    
    <!-- Submit Button -->
    <button class="w-full mt-6 py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg">
      서명 완료
    </button>
  </div>
</div>
```

---

### 2.5 AI 검토 결과 Bottom Sheet

**Design Intent**  
법적 검토 결과를 신뢰감 있게 전달. 항목별 상태 표시.

**Tailwind Implementation**

```html
<div class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl safe-bottom max-h-[85vh] overflow-y-auto">
  <!-- Handle -->
  <div class="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 sticky top-0"></div>
  
  <!-- Content -->
  <div class="px-6 py-6">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <span class="text-3xl">🤖</span>
      <div>
        <h2 class="text-[20px] font-bold text-gray-900">AI 검토 완료</h2>
        <p class="text-[14px] text-gray-500">법적 요건을 확인했어요</p>
      </div>
    </div>
    
    <!-- Result Summary -->
    <div class="bg-green-50 rounded-2xl p-4 mb-6">
      <p class="text-[15px] text-green-700 font-medium">
        ✅ 모든 항목이 법적 요건을 충족해요
      </p>
    </div>
    
    <!-- Detail Items -->
    <div class="space-y-4">
      <div class="flex items-center gap-3 py-3 border-b border-gray-100">
        <span class="text-green-500 text-xl">✅</span>
        <div class="flex-1">
          <p class="text-[15px] font-medium text-gray-900">최저시급</p>
          <p class="text-[13px] text-gray-500">2026년 기준 충족</p>
        </div>
      </div>
      
      <div class="flex items-center gap-3 py-3 border-b border-gray-100">
        <span class="text-green-500 text-xl">✅</span>
        <div class="flex-1">
          <p class="text-[15px] font-medium text-gray-900">휴게시간</p>
          <p class="text-[13px] text-gray-500">4시간 근무 시 30분 이상</p>
        </div>
      </div>
      
      <div class="flex items-center gap-3 py-3 border-b border-gray-100">
        <span class="text-green-500 text-xl">✅</span>
        <div class="flex-1">
          <p class="text-[15px] font-medium text-gray-900">근로계약 필수 항목</p>
          <p class="text-[13px] text-gray-500">모든 필수 정보 포함</p>
        </div>
      </div>
      
      <div class="flex items-center gap-3 py-3">
        <span class="text-amber-500 text-xl">⚠️</span>
        <div class="flex-1">
          <p class="text-[15px] font-medium text-gray-900">주휴수당</p>
          <p class="text-[13px] text-gray-500">주 15시간 이상 시 발생, 확인 필요</p>
        </div>
      </div>
    </div>
    
    <!-- Close Button -->
    <button class="w-full mt-6 py-4 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-lg">
      확인
    </button>
  </div>
</div>
```

---

## 3. 근로자 페이지 (Worker)

---

### 3.1 근로자 온보딩 (`/worker/onboarding`)

**Design Intent**  
민감한 정보 입력. 안전함과 신뢰를 강조.

---

#### Step 1: 본인인증

```
┌─────────────────────────────┐
│                       1/3   │
│ ████████████░░░░░░░░░░░░░░░ │
│                             │
│                             │
│   본인인증이 필요해요         │
│                             │
│   계약서에 필요한 정보를       │
│   안전하게 등록할게요         │
│                             │
│                             │
│  ┌─────────────────────┐    │
│  │  📱 휴대폰으로 인증   │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │  🟡 카카오로 인증    │    │
│  └─────────────────────┘    │
│                             │
│                             │
│  🔒 입력한 정보는 암호화되어   │
│     안전하게 보관돼요         │
│                             │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<div class="min-h-screen bg-white flex flex-col px-6 safe-top safe-bottom">
  <!-- Progress -->
  <div class="pt-4">
    <div class="flex justify-end mb-2">
      <span class="text-[14px] text-gray-400">1/3</span>
    </div>
    <div class="h-1 bg-gray-100 rounded-full overflow-hidden">
      <div class="h-full bg-blue-500 w-1/3"></div>
    </div>
  </div>
  
  <!-- Content -->
  <div class="flex-1 pt-10">
    <h1 class="text-[26px] font-bold text-gray-900 leading-tight mb-2">
      본인인증이 필요해요
    </h1>
    <p class="text-[15px] text-gray-500 mb-10">
      계약서에 필요한 정보를 안전하게 등록할게요
    </p>
    
    <!-- Auth Options -->
    <div class="space-y-3">
      <button class="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg flex items-center justify-center gap-2">
        <span>📱</span> 휴대폰으로 인증
      </button>
      <button class="w-full py-4 rounded-2xl bg-[#FEE500] text-[#191919] font-semibold text-lg flex items-center justify-center gap-2">
        <svg class="w-5 h-5"><!-- kakao --></svg> 카카오로 인증
      </button>
    </div>
  </div>
  
  <!-- Security Notice -->
  <div class="pb-8 flex items-center gap-2 text-[13px] text-gray-400">
    <span>🔒</span>
    <span>입력한 정보는 암호화되어 안전하게 보관돼요</span>
  </div>
</div>
```

---

#### Step 2: 주민등록번호

```
┌─────────────────────────────┐
│                       2/3   │
│ ████████████████████░░░░░░░ │
│                             │
│                             │
│   주민등록번호를             │
│   입력해주세요               │
│                             │
│   계약서에 자동으로 들어가요   │
│                             │
│                             │
│   ┌──────┐ - ┌──────┐●●●●●● │
│   │980101│   │1      │       │   ← 마스킹 처리
│   └──────┘   └──────┘       │
│                             │
│                             │
│  🔒 주민번호는 계약서 작성에만 │
│     사용되며, 암호화 저장돼요  │
│                             │
├─────────────────────────────┤
│  ┌─────────────────────┐    │
│  │       다음          │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<div class="flex-1 pt-10 px-6">
  <h1 class="text-[26px] font-bold text-gray-900 leading-tight mb-2">
    주민등록번호를<br/>입력해주세요
  </h1>
  <p class="text-[15px] text-gray-500 mb-10">
    계약서에 자동으로 들어가요
  </p>
  
  <!-- SSN Input -->
  <div class="flex items-center gap-3">
    <input 
      type="text" 
      maxlength="6"
      placeholder="앞 6자리"
      inputmode="numeric"
      class="flex-1 bg-gray-100 rounded-xl px-4 py-4 text-center text-[20px] font-bold text-gray-900 placeholder-gray-400"
    />
    <span class="text-[24px] text-gray-300">-</span>
    <div class="flex-1 flex items-center gap-1">
      <input 
        type="password" 
        maxlength="1"
        inputmode="numeric"
        class="w-10 bg-gray-100 rounded-xl px-2 py-4 text-center text-[20px] font-bold text-gray-900"
      />
      <span class="text-[20px] text-gray-300 tracking-widest">●●●●●●</span>
    </div>
  </div>
  
  <!-- Security Notice -->
  <div class="mt-6 flex items-start gap-2 text-[13px] text-gray-400">
    <span>🔒</span>
    <span>주민번호는 계약서 작성에만 사용되며, 암호화 저장돼요</span>
  </div>
</div>
```

---

#### Step 3: 급여 계좌

```
┌─────────────────────────────┐
│                       3/3   │
│ ██████████████████████████████ │
│                             │
│                             │
│   월급 받을 계좌를           │
│   알려주세요                 │
│                             │
│                             │
│   은행                       │
│  ┌─────────────────────┐    │
│  │ 카카오뱅크        ▼  │    │   ← 셀렉트
│  └─────────────────────┘    │
│                             │
│   계좌번호                   │
│  ┌─────────────────────┐    │
│  │ 3333-12-1234567     │    │
│  └─────────────────────┘    │
│                             │
│                             │
├─────────────────────────────┤
│  ┌─────────────────────┐    │
│  │     시작하기 🎉      │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<div class="flex-1 pt-10 px-6">
  <h1 class="text-[26px] font-bold text-gray-900 leading-tight mb-2">
    월급 받을 계좌를<br/>알려주세요
  </h1>
  <p class="text-[15px] text-gray-500 mb-10">
    계약서에 자동으로 들어가요
  </p>
  
  <div class="space-y-5">
    <!-- Bank Select -->
    <div>
      <label class="text-[14px] text-gray-500 font-medium mb-2 block">은행</label>
      <button class="w-full bg-gray-100 rounded-2xl px-5 py-4 flex items-center justify-between">
        <span class="text-[17px] text-gray-900 font-medium">카카오뱅크</span>
        <svg class="w-5 h-5 text-gray-400"><!-- chevron-down --></svg>
      </button>
    </div>
    
    <!-- Account Number -->
    <div>
      <label class="text-[14px] text-gray-500 font-medium mb-2 block">계좌번호</label>
      <input 
        type="text"
        inputmode="numeric"
        placeholder="계좌번호를 입력하세요"
        class="w-full bg-gray-100 rounded-2xl px-5 py-4 text-[17px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>
</div>

<!-- Bottom Button -->
<div class="px-6 pb-4 safe-bottom">
  <button class="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg flex items-center justify-center gap-2">
    시작하기 🎉
  </button>
</div>
```

---

### 3.2 근로자 대시보드 (`/worker`)

**Design Intent**  
받은 계약서 현황 확인. 사장님 대시보드와 유사하지만 크레딧 표시 없음.

**Tailwind Implementation**

```html
<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white px-5 safe-top sticky top-0 z-40">
    <div class="h-14 flex items-center justify-between">
      <button class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
        <span class="text-lg">👷</span>
      </button>
      <span class="text-[17px] font-bold text-gray-900">싸인해주세요</span>
      <button class="relative">
        <svg class="w-6 h-6 text-gray-700"><!-- bell --></svg>
        <span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[11px] text-white flex items-center justify-center">2</span>
      </button>
    </div>
  </header>
  
  <!-- Tab Bar -->
  <div class="bg-white px-5 sticky top-14 z-30 border-b border-gray-100">
    <div class="flex">
      <button class="flex-1 py-3 text-[15px] font-semibold text-blue-500 border-b-2 border-blue-500">
        대기중
      </button>
      <button class="flex-1 py-3 text-[15px] font-medium text-gray-400">
        서명완료
      </button>
      <button class="flex-1 py-3 text-[15px] font-medium text-gray-400">
        폴더
      </button>
      <button class="flex-1 py-3 text-[15px] font-medium text-gray-400">
        휴지통
      </button>
    </div>
  </div>
  
  <!-- Contract List -->
  <div class="p-4 space-y-3">
    <!-- Contract Card with Urgency -->
    <button class="w-full bg-white rounded-2xl p-5 text-left active:bg-gray-50 transition-colors">
      <div class="flex items-center gap-2 mb-3">
        <span class="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[11px] font-medium">
          D-1 마감 임박
        </span>
      </div>
      <h3 class="text-[17px] font-bold text-gray-900 mb-1">스타벅스 강남점</h3>
      <div class="flex items-center gap-4 text-[14px] text-gray-500">
        <span>시급 12,500원</span>
        <span>14:00~20:00</span>
      </div>
    </button>
    
    <!-- Normal Card -->
    <button class="w-full bg-white rounded-2xl p-5 text-left active:bg-gray-50 transition-colors">
      <div class="flex items-center gap-2 mb-3">
        <span class="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-[11px] font-medium">
          D-6
        </span>
      </div>
      <h3 class="text-[17px] font-bold text-gray-900 mb-1">투썸플레이스 역삼점</h3>
      <div class="flex items-center gap-4 text-[14px] text-gray-500">
        <span>시급 11,000원</span>
        <span>09:00~15:00</span>
      </div>
    </button>
  </div>
  
  <!-- Bottom Navigation -->
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom">
    <div class="max-w-md mx-auto flex">
      <button class="flex-1 py-3 flex flex-col items-center text-blue-500">
        <svg class="w-6 h-6 mb-1"><!-- home --></svg>
        <span class="text-[11px] font-medium">홈</span>
      </button>
      <button class="flex-1 py-3 flex flex-col items-center text-gray-400">
        <svg class="w-6 h-6 mb-1"><!-- chat --></svg>
        <span class="text-[11px] font-medium">채팅</span>
      </button>
      <button class="flex-1 py-3 flex flex-col items-center text-gray-400">
        <svg class="w-6 h-6 mb-1"><!-- briefcase --></svg>
        <span class="text-[11px] font-medium">경력</span>
      </button>
      <button class="flex-1 py-3 flex flex-col items-center text-gray-400">
        <svg class="w-6 h-6 mb-1"><!-- settings --></svg>
        <span class="text-[11px] font-medium">설정</span>
      </button>
    </div>
  </nav>
</div>
```

---

### 3.3 계약서 확인/서명 (`/worker/contract/:id`)

**Design Intent**  
계약 조건을 한눈에 파악. 서명까지 물 흐르듯.

**Layout Structure**

```
┌─────────────────────────────┐
│ ←  계약서 확인               │
├─────────────────────────────┤
│  ⏰ 서명 기한 6일 남았어요    │   ← 카운트다운
├─────────────────────────────┤
│                             │
│   스타벅스 강남점에서         │   ← text-title
│   일하기로 했어요            │
│                             │
│                             │
│  ┌─────────────────────┐    │
│  │ 💰 시급              │    │   ← 조건 카드
│  │ 12,500원            │    │
│  │ (주휴수당 포함)       │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 📅 근무일            │    │
│  │ 월, 수, 금 (주 3일)   │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ ⏰ 근무시간          │    │
│  │ 14:00 ~ 20:00       │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 💵 급여일            │    │
│  │ 매월 10일            │    │
│  └─────────────────────┘    │
│                             │
│   [전체 계약서 보기 ▼]       │
│                             │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │  서명하고 계약하기 ✍️    │ │
│ └─────────────────────────┘ │
│                             │
│   궁금한 점이 있나요?        │
│   [사장님과 채팅하기 →]      │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<div class="min-h-screen bg-gray-50 flex flex-col">
  <!-- Header -->
  <header class="bg-white px-5 safe-top sticky top-0 z-40 border-b border-gray-100">
    <div class="h-14 flex items-center">
      <button class="w-10 h-10 flex items-center justify-center -ml-2">
        <svg class="w-6 h-6 text-gray-900"><!-- back --></svg>
      </button>
      <span class="text-[17px] font-bold text-gray-900 ml-2">계약서 확인</span>
    </div>
  </header>
  
  <!-- Deadline Banner -->
  <div class="bg-blue-50 px-5 py-3 flex items-center gap-2">
    <span>⏰</span>
    <span class="text-[14px] text-blue-700 font-medium">서명 기한 <strong>6일</strong> 남았어요</span>
  </div>
  
  <!-- Content -->
  <div class="flex-1 p-5">
    <!-- Title -->
    <h1 class="text-[22px] font-bold text-gray-900 leading-snug mb-6">
      스타벅스 강남점에서<br/>일하기로 했어요
    </h1>
    
    <!-- Condition Cards -->
    <div class="space-y-3">
      <div class="bg-white rounded-2xl p-5">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-xl">💰</span>
          <span class="text-[14px] text-gray-500">시급</span>
        </div>
        <p class="text-[24px] font-bold text-gray-900">12,500원</p>
        <p class="text-[14px] text-gray-500 mt-1">주휴수당 포함</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-xl">📅</span>
          <span class="text-[14px] text-gray-500">근무일</span>
        </div>
        <p class="text-[20px] font-bold text-gray-900">월, 수, 금</p>
        <p class="text-[14px] text-gray-500 mt-1">주 3일</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-xl">⏰</span>
          <span class="text-[14px] text-gray-500">근무시간</span>
        </div>
        <p class="text-[20px] font-bold text-gray-900">14:00 ~ 20:00</p>
        <p class="text-[14px] text-gray-500 mt-1">휴게시간 30분</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-xl">💵</span>
          <span class="text-[14px] text-gray-500">급여일</span>
        </div>
        <p class="text-[20px] font-bold text-gray-900">매월 10일</p>
      </div>
    </div>
    
    <!-- Full Contract Link -->
    <button class="w-full mt-4 py-4 text-[15px] text-gray-500 font-medium flex items-center justify-center gap-2">
      전체 계약서 보기
      <svg class="w-4 h-4"><!-- chevron-down --></svg>
    </button>
  </div>
  
  <!-- Bottom Actions -->
  <div class="bg-white border-t border-gray-100 px-5 pt-4 pb-4 safe-bottom">
    <button class="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg flex items-center justify-center gap-2 mb-3">
      서명하고 계약하기 ✍️
    </button>
    <button class="w-full py-3 text-[15px] text-gray-500 font-medium flex items-center justify-center gap-2">
      궁금한 점이 있나요?
      <span class="text-blue-500">사장님과 채팅하기 →</span>
    </button>
  </div>
</div>
```

---

### 3.4 용어 설명 Tooltip

**Design Intent**  
어려운 법률 용어를 터치하면 쉽게 설명. 맥락을 유지하며 학습.

**Tailwind Implementation**

```html
<!-- Inline Trigger -->
<span class="text-blue-500 underline underline-offset-2 decoration-dotted cursor-pointer">
  주휴수당
</span>

<!-- Tooltip Bottom Sheet -->
<div class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl safe-bottom">
  <div class="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3"></div>
  
  <div class="px-6 py-6">
    <!-- Term -->
    <div class="flex items-center gap-2 mb-4">
      <span class="text-2xl">📚</span>
      <h2 class="text-[20px] font-bold text-gray-900">주휴수당이 뭐예요?</h2>
    </div>
    
    <!-- Explanation -->
    <div class="bg-gray-50 rounded-2xl p-5 mb-6">
      <p class="text-[15px] text-gray-700 leading-relaxed">
        일주일에 <strong class="text-blue-500">15시간 이상</strong> 일하면 받는 추가 수당이에요.
      </p>
      <p class="text-[15px] text-gray-700 leading-relaxed mt-3">
        쉽게 말해서, 주 5일 일하면 <strong class="text-blue-500">6일치 월급</strong>을 받는 거예요! 
        하루 쉬는 날도 돈을 받는 셈이죠.
      </p>
    </div>
    
    <!-- Example -->
    <div class="mb-6">
      <p class="text-[13px] text-gray-500 mb-2">예를 들면</p>
      <div class="bg-blue-50 rounded-xl p-4 text-[14px] text-blue-700">
        시급 12,000원 × 주 20시간 근무 시<br/>
        주휴수당 약 <strong>19,200원</strong>이 추가로 들어가요
      </div>
    </div>
    
    <!-- Close -->
    <button class="w-full py-4 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-lg">
      이해했어요
    </button>
  </div>
</div>
```

---

### 3.5 경력 관리 (`/worker/career`)

**Design Intent**  
내 근무 이력을 타임라인처럼. 경력증명서 다운로드까지.

**Tailwind Implementation**

```html
<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white px-5 safe-top sticky top-0 z-40 border-b border-gray-100">
    <div class="h-14 flex items-center">
      <button class="w-10 h-10 flex items-center justify-center -ml-2">
        <svg class="w-6 h-6 text-gray-900"><!-- back --></svg>
      </button>
      <span class="text-[17px] font-bold text-gray-900 ml-2">경력 관리</span>
    </div>
  </header>
  
  <!-- Content -->
  <div class="p-5">
    <h1 class="text-[22px] font-bold text-gray-900 mb-6">
      나의 근무 이력
    </h1>
    
    <!-- Career Timeline -->
    <div class="space-y-4">
      <div class="bg-white rounded-2xl p-5">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="text-[17px] font-bold text-gray-900">이디야커피 선릉점</h3>
            <p class="text-[14px] text-gray-500 mt-1">2025.06 ~ 2025.12</p>
          </div>
          <span class="text-[12px] text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">
            7개월
          </span>
        </div>
        <p class="text-[14px] text-gray-600">바리스타, 음료 제조</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="text-[17px] font-bold text-gray-900">맥도날드 삼성점</h3>
            <p class="text-[14px] text-gray-500 mt-1">2024.01 ~ 2025.05</p>
          </div>
          <span class="text-[12px] text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">
            1년 5개월
          </span>
        </div>
        <p class="text-[14px] text-gray-600">홀서빙, 주문 접수</p>
      </div>
    </div>
    
    <!-- Total Experience -->
    <div class="bg-blue-50 rounded-2xl p-5 mt-6">
      <div class="flex items-center justify-between">
        <span class="text-[15px] text-blue-700">총 근무 경력</span>
        <span class="text-[20px] font-bold text-blue-700">2년</span>
      </div>
    </div>
  </div>
  
  <!-- Fixed Bottom Button -->
  <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 safe-bottom">
    <button class="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg flex items-center justify-center gap-2">
      📄 경력증명서 다운로드
    </button>
  </div>
</div>
```

---

## 4. 결제 페이지

---

### 4.1 크레딧 구매 (`/pricing`)

**Design Intent**  
가격표가 아닌 '선택지'. 가장 인기 있는 옵션 강조.

**Layout Structure**

```
┌─────────────────────────────┐
│ ←  크레딧 충전               │
├─────────────────────────────┤
│                             │
│   계약서를 몇 개             │
│   작성할까요?                │
│                             │
│   보유 크레딧: 0개           │
│                             │
│                             │
│  ┌─────────────────────┐    │
│  │ 5개                  │    │
│  │ 5,000원              │    │
│  │ 계약서 5개 작성 가능  │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ ⭐ 인기                │    │   ← 추천 배지
│  │ 15개                 │    │
│  │ 12,000원  (20% 할인) │    │
│  │ 계약서 15개 작성 가능 │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 50개                 │    │
│  │ 35,000원 (30% 할인)  │    │
│  │ 계약서 50개 작성 가능 │    │
│  └─────────────────────┘    │
│                             │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │   12,000원 결제하기     │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Tailwind Implementation**

```html
<div class="min-h-screen bg-white flex flex-col">
  <!-- Header -->
  <header class="px-5 safe-top sticky top-0 bg-white z-40 border-b border-gray-100">
    <div class="h-14 flex items-center">
      <button class="w-10 h-10 flex items-center justify-center -ml-2">
        <svg class="w-6 h-6 text-gray-900"><!-- back --></svg>
      </button>
      <span class="text-[17px] font-bold text-gray-900 ml-2">크레딧 충전</span>
    </div>
  </header>
  
  <!-- Content -->
  <div class="flex-1 px-6 pt-6">
    <h1 class="text-[22px] font-bold text-gray-900 mb-2">
      계약서를 몇 개<br/>작성할까요?
    </h1>
    <p class="text-[15px] text-gray-500 mb-8">
      보유 크레딧: <span class="font-semibold text-blue-500">0개</span>
    </p>
    
    <!-- Pricing Cards -->
    <div class="space-y-3">
      <!-- Basic -->
      <button class="w-full border-2 border-gray-200 rounded-2xl p-5 text-left transition-colors [&.selected]:border-blue-500 [&.selected]:bg-blue-50">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[20px] font-bold text-gray-900">5개</span>
          <span class="text-[17px] font-bold text-gray-900">5,000원</span>
        </div>
        <p class="text-[14px] text-gray-500">계약서 5개 작성 가능</p>
      </button>
      
      <!-- Popular -->
      <button class="w-full border-2 border-blue-500 bg-blue-50 rounded-2xl p-5 text-left relative selected">
        <span class="absolute -top-3 left-4 bg-blue-500 text-white text-[12px] font-semibold px-3 py-1 rounded-full">
          ⭐ 인기
        </span>
        <div class="flex items-center justify-between mb-2">
          <span class="text-[20px] font-bold text-gray-900">15개</span>
          <div class="text-right">
            <span class="text-[17px] font-bold text-gray-900">12,000원</span>
            <span class="text-[13px] text-blue-500 font-medium ml-2">20% 할인</span>
          </div>
        </div>
        <p class="text-[14px] text-gray-500">계약서 15개 작성 가능</p>
      </button>
      
      <!-- Bulk -->
      <button class="w-full border-2 border-gray-200 rounded-2xl p-5 text-left">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[20px] font-bold text-gray-900">50개</span>
          <div class="text-right">
            <span class="text-[17px] font-bold text-gray-900">35,000원</span>
            <span class="text-[13px] text-green-600 font-medium ml-2">30% 할인</span>
          </div>
        </div>
        <p class="text-[14px] text-gray-500">계약서 50개 작성 가능</p>
      </button>
    </div>
  </div>
  
  <!-- Bottom Button -->
  <div class="px-6 pb-4 safe-bottom bg-white border-t border-gray-100 pt-4">
    <button class="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg">
      12,000원 결제하기
    </button>
  </div>
</div>
```

---

## 5. 공통 컴포넌트

---

### 5.1 Toast Message

```html
<!-- Success Toast -->
<div class="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 animate-fade-in-up">
  <span>✅</span>
  <span class="text-[15px] font-medium">저장됐어요</span>
</div>

<!-- Error Toast -->
<div class="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2">
  <span>⚠️</span>
  <span class="text-[15px] font-medium">인터넷 연결을 확인해주세요</span>
</div>
```

---

### 5.2 Loading State

```html
<!-- Full Page Loading -->
<div class="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
  <div class="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
  <p class="mt-4 text-[15px] text-gray-500">잠시만 기다려주세요</p>
</div>

<!-- Inline Loading (Button) -->
<button class="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg flex items-center justify-center gap-2" disabled>
  <svg class="w-5 h-5 animate-spin"><!-- spinner --></svg>
  처리 중...
</button>
```

---

### 5.3 Empty State

```html
<div class="flex-1 flex flex-col items-center justify-center px-6 py-20">
  <div class="w-24 h-24 mb-6 text-gray-200">
    <svg><!-- empty illustration --></svg>
  </div>
  <h2 class="text-[18px] font-bold text-gray-900 mb-2 text-center">
    아직 계약서가 없어요
  </h2>
  <p class="text-[15px] text-gray-500 text-center mb-6">
    첫 번째 계약서를 작성해보세요
  </p>
  <button class="bg-blue-500 text-white text-[15px] font-semibold px-6 py-3 rounded-xl">
    계약서 작성하기
  </button>
</div>
```

---

### 5.4 Confirmation Modal (Alert 대신 Bottom Sheet)

```html
<div class="fixed inset-0 bg-black/40 z-50"></div>

<div class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl safe-bottom">
  <div class="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3"></div>
  
  <div class="px-6 py-6">
    <h2 class="text-[20px] font-bold text-gray-900 text-center mb-2">
      정말 삭제할까요?
    </h2>
    <p class="text-[15px] text-gray-500 text-center mb-6">
      삭제된 계약서는 30일 동안<br/>휴지통에서 복원할 수 있어요
    </p>
    
    <div class="space-y-3">
      <button class="w-full py-4 rounded-2xl bg-red-500 text-white font-semibold text-lg">
        삭제하기
      </button>
      <button class="w-full py-3 text-gray-500 text-[15px] font-medium">
        취소
      </button>
    </div>
  </div>
</div>
```

---

## 6. 애니메이션 & 트랜지션

### 6.1 Tailwind Config 추가

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
}
```

---

## 7. 접근성 체크리스트

| 항목 | 요구사항 | Tailwind 적용 |
|------|----------|--------------|
| 터치 영역 | 최소 44×44px | `min-w-[44px] min-h-[44px]` |
| 폰트 크기 | 최소 16px | `text-[16px]` 이상 |
| 색상 대비 | 4.5:1 이상 | `text-gray-900` on `bg-white` |
| 포커스 표시 | 키보드 접근 시 | `focus:ring-2 focus:ring-blue-500` |
| 레이블 | 모든 입력 필드 | `<label>` 또는 `aria-label` |

---

## 8. 반응형 고려사항

```css
/* 기본: 모바일 (max-w-md = 448px) */
.container {
  @apply max-w-md mx-auto;
}

/* 태블릿 이상에서 중앙 정렬 + 그림자 */
@screen md {
  .container {
    @apply shadow-xl rounded-3xl my-8;
  }
}
```

---

---

## 📝 Amendment 1: UI/UX 개선 스펙 (2026년 1월 24일)

> **버전**: 1.1  
> **변경 사유**: 네비게이션 메뉴 추가 및 대시보드 레이아웃 단순화

---

### A1.1 헤더 컴포넌트 변경

#### A1.1.1 기존 헤더 → 변경된 헤더

**기존:**
```
┌─────────────────────────────┐
│ 😊  싸인해주세요    🔔  5개  │
└─────────────────────────────┘
```

**변경:**
```
┌─────────────────────────────┐
│     싸인해주세요   💎5 🔔 ☰  │
└─────────────────────────────┘
```

#### A1.1.2 Tailwind Implementation

```html
<header class="bg-white px-5 safe-top sticky top-0 z-40">
  <div class="h-14 flex items-center justify-between">
    <!-- 좌측: 빈 공간 또는 뒤로가기 (서브페이지) -->
    <div class="w-10"></div>
    
    <!-- 중앙: 서비스명 -->
    <span class="text-[17px] font-bold text-gray-900">싸인해주세요</span>
    
    <!-- 우측: 크레딧 + 알림 + 메뉴 -->
    <div class="flex items-center gap-2">
      <!-- 크레딧 (사업자만) -->
      <button class="flex items-center gap-1 bg-blue-50 text-blue-500 text-[13px] font-semibold px-2.5 py-1 rounded-full">
        <span>💎</span>
        <span>5</span>
      </button>
      
      <!-- 알림 -->
      <button class="relative w-9 h-9 flex items-center justify-center">
        <svg class="w-6 h-6 text-gray-700"><!-- bell icon --></svg>
        <span class="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>
      
      <!-- 햄버거 메뉴 -->
      <button class="w-9 h-9 flex items-center justify-center">
        <svg class="w-6 h-6 text-gray-700"><!-- menu icon (3 lines) --></svg>
      </button>
    </div>
  </div>
</header>
```

---

### A1.2 메뉴 시트 (MenuSheet) 컴포넌트

**Design Intent**  
햄버거 메뉴 터치 시 우측에서 슬라이드하는 사이드시트. 프로필 정보와 주요 메뉴 제공.

#### A1.2.1 Layout Structure

```
┌─────────────────────────────────────┐
│                            [X]      │   ← 닫기 버튼
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │  [👤 40x40]  김사장님          │  │   ← 프로필 영역
│  │             example@kakao.com │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  👤 프로필 설정                  →  │
│  💳 크레딧 충전                  →  │
│  📋 결제 내역                    →  │
│  🗑️ 휴지통                      →  │
├─────────────────────────────────────┤
│  📄 이용약관                     →  │
│  🔒 개인정보처리방침              →  │
├─────────────────────────────────────┤
│  🚪 로그아웃                        │   ← 빨간색 텍스트
└─────────────────────────────────────┘
```

#### A1.2.2 Tailwind Implementation

```html
<!-- Backdrop -->
<div class="fixed inset-0 bg-black/40 z-50" onclick="closeMenu()"></div>

<!-- Side Sheet (우측에서 슬라이드) -->
<div class="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-xl animate-slide-in-right safe-top safe-bottom">
  <!-- Header -->
  <div class="h-14 flex items-center justify-end px-4">
    <button class="w-10 h-10 flex items-center justify-center">
      <svg class="w-6 h-6 text-gray-500"><!-- X icon --></svg>
    </button>
  </div>
  
  <!-- Profile Section -->
  <div class="px-5 pb-5 border-b border-gray-100">
    <div class="flex items-center gap-4">
      <div class="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
        <span class="text-2xl">👤</span>
      </div>
      <div>
        <p class="text-[17px] font-bold text-gray-900">김사장님</p>
        <p class="text-[14px] text-gray-500">example@kakao.com</p>
      </div>
    </div>
  </div>
  
  <!-- Menu Items -->
  <div class="py-2">
    <!-- Group 1: 주요 메뉴 -->
    <div class="border-b border-gray-100">
      <a href="/profile" class="flex items-center justify-between px-5 py-4 active:bg-gray-50">
        <div class="flex items-center gap-3">
          <span class="text-lg">👤</span>
          <span class="text-[15px] text-gray-900">프로필 설정</span>
        </div>
        <svg class="w-5 h-5 text-gray-400"><!-- chevron-right --></svg>
      </a>
      <a href="/pricing" class="flex items-center justify-between px-5 py-4 active:bg-gray-50">
        <div class="flex items-center gap-3">
          <span class="text-lg">💳</span>
          <span class="text-[15px] text-gray-900">크레딧 충전</span>
        </div>
        <svg class="w-5 h-5 text-gray-400"><!-- chevron-right --></svg>
      </a>
      <a href="/payment-history" class="flex items-center justify-between px-5 py-4 active:bg-gray-50">
        <div class="flex items-center gap-3">
          <span class="text-lg">📋</span>
          <span class="text-[15px] text-gray-900">결제 내역</span>
        </div>
        <svg class="w-5 h-5 text-gray-400"><!-- chevron-right --></svg>
      </a>
      <a href="/employer/trash" class="flex items-center justify-between px-5 py-4 active:bg-gray-50">
        <div class="flex items-center gap-3">
          <span class="text-lg">🗑️</span>
          <span class="text-[15px] text-gray-900">휴지통</span>
        </div>
        <svg class="w-5 h-5 text-gray-400"><!-- chevron-right --></svg>
      </a>
    </div>
    
    <!-- Group 2: 약관 -->
    <div class="border-b border-gray-100">
      <a href="/terms" class="flex items-center justify-between px-5 py-4 active:bg-gray-50">
        <div class="flex items-center gap-3">
          <span class="text-lg">📄</span>
          <span class="text-[15px] text-gray-900">이용약관</span>
        </div>
        <svg class="w-5 h-5 text-gray-400"><!-- chevron-right --></svg>
      </a>
      <a href="/privacy" class="flex items-center justify-between px-5 py-4 active:bg-gray-50">
        <div class="flex items-center gap-3">
          <span class="text-lg">🔒</span>
          <span class="text-[15px] text-gray-900">개인정보처리방침</span>
        </div>
        <svg class="w-5 h-5 text-gray-400"><!-- chevron-right --></svg>
      </a>
    </div>
    
    <!-- Logout -->
    <a href="/auth/signout" class="flex items-center px-5 py-4 active:bg-gray-50">
      <div class="flex items-center gap-3">
        <span class="text-lg">🚪</span>
        <span class="text-[15px] text-red-500">로그아웃</span>
      </div>
    </a>
  </div>
</div>
```

#### A1.2.3 Animation (tailwind.config.js에 추가)

```javascript
// tailwind.config.js extend
animation: {
  'slide-in-right': 'slideInRight 0.3s ease-out',
},
keyframes: {
  slideInRight: {
    '0%': { transform: 'translateX(100%)' },
    '100%': { transform: 'translateX(0)' },
  },
},
```

---

### A1.3 사업자 대시보드 변경

#### A1.3.1 Layout Structure (변경)

**기존: 탭 기반**
```
┌─────────────────────────────┐
│ 대기중 │ 완료 │ 폴더 │ 휴지통 │
├─────────────────────────────┤
│                             │
│     (탭별 컨텐츠)            │
│                             │
└─────────────────────────────┘
```

**변경: 섹션 기반 스크롤**
```
┌─────────────────────────────┐
│     싸인해주세요   💎5 🔔 ☰  │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ 💎 크레딧 5개   [충전 →] │ │   ← 크레딧 카드
│ └─────────────────────────┘ │
│                             │
│ 📋 대기중인 계약서 (2)       │   ← 섹션 제목 + 카운트
│ ┌─────────────────────────┐ │
│ │ 홍길동                   │ │   ← 계약서 카드
│ │ 12,000원 · 🟡 대기중     │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 김철수                   │ │
│ │ 11,000원 · 🟡 대기중     │ │
│ └─────────────────────────┘ │
│                             │
│ ✅ 완료된 계약서 (3) [📁]    │   ← 섹션 제목 + 폴더 버튼
│ ┌─────────────────────────┐ │
│ │ 이영희                   │ │
│ │ 13,000원 · 🟢 완료       │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 박민수                   │ │
│ │ 10,500원 · 🟢 완료       │ │
│ └─────────────────────────┘ │
│                             │
│                       [+]   │   ← FAB
└─────────────────────────────┘
```

#### A1.3.2 Tailwind Implementation

```html
<div class="min-h-screen bg-gray-50 pb-24">
  <!-- Header (변경된 버전) -->
  <!-- ... (A1.1.2 참조) -->
  
  <!-- Content -->
  <div class="p-4 space-y-6">
    <!-- Credit Card -->
    <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-[14px] text-blue-100 mb-1">보유 크레딧</p>
          <p class="text-[28px] font-bold">💎 5개</p>
        </div>
        <a href="/pricing" class="bg-white/20 text-white text-[14px] font-semibold px-4 py-2 rounded-full">
          충전 →
        </a>
      </div>
    </div>
    
    <!-- 대기중인 계약서 섹션 -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-[17px] font-bold text-gray-900 flex items-center gap-2">
          📋 대기중인 계약서
          <span class="text-[14px] font-normal text-gray-500">(2)</span>
        </h2>
      </div>
      
      <div class="space-y-3">
        <!-- Contract Card -->
        <a href="/employer/contract/123" class="block bg-white rounded-2xl p-5 active:bg-gray-50 transition-colors">
          <div class="flex items-start justify-between mb-2">
            <h3 class="text-[17px] font-bold text-gray-900">홍길동</h3>
            <span class="bg-amber-100 text-amber-600 px-2.5 py-1 rounded-full text-[12px] font-medium">
              대기중
            </span>
          </div>
          <p class="text-[15px] text-gray-600">시급 12,000원</p>
          <p class="text-[13px] text-gray-400 mt-1">오늘 생성</p>
        </a>
        
        <!-- 더 많은 카드... -->
      </div>
    </section>
    
    <!-- 완료된 계약서 섹션 -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-[17px] font-bold text-gray-900 flex items-center gap-2">
          ✅ 완료된 계약서
          <span class="text-[14px] font-normal text-gray-500">(3)</span>
        </h2>
        <!-- 폴더 관리 버튼 -->
        <a href="/employer/folders" class="flex items-center gap-1 text-[14px] text-gray-500 font-medium">
          <span>📁</span>
          <span>폴더</span>
        </a>
      </div>
      
      <div class="space-y-3">
        <!-- Contract Card -->
        <a href="/employer/contract/456" class="block bg-white rounded-2xl p-5 active:bg-gray-50 transition-colors">
          <div class="flex items-start justify-between mb-2">
            <h3 class="text-[17px] font-bold text-gray-900">이영희</h3>
            <span class="bg-green-100 text-green-600 px-2.5 py-1 rounded-full text-[12px] font-medium">
              완료
            </span>
          </div>
          <p class="text-[15px] text-gray-600">시급 13,000원</p>
          <p class="text-[13px] text-gray-400 mt-1">1주일 전 완료</p>
        </a>
        
        <!-- 더 많은 카드... -->
      </div>
    </section>
  </div>
  
  <!-- FAB -->
  <a href="/employer/create" class="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center active:bg-blue-600 safe-bottom">
    <svg class="w-7 h-7 text-white"><!-- plus icon --></svg>
  </a>
</div>
```

---

### A1.4 프로필 설정 페이지 (`/profile`)

**Design Intent**  
사용자 정보 조회/수정, 역할 변경, 로그아웃 기능 제공.

#### A1.4.1 Layout Structure

```
┌─────────────────────────────┐
│ ←  프로필 설정               │
├─────────────────────────────┤
│                             │
│     ┌─────────────────┐     │
│     │   [👤 64x64]    │     │   ← 아바타
│     │    김사장님      │     │
│     │example@kakao.com│     │
│     └─────────────────┘     │
│                             │
│ 내 정보                      │
│ ┌─────────────────────────┐ │
│ │ 이름                    │ │
│ │ 김사장님            [→] │ │
│ ├─────────────────────────┤ │
│ │ 연락처                  │ │
│ │ 010-1234-5678       [→] │ │
│ └─────────────────────────┘ │
│                             │
│ 역할                        │
│ ┌─────────────────────────┐ │
│ │ 현재 역할: 사장님    [→] │ │
│ │ 알바생으로 전환 가능     │ │
│ └─────────────────────────┘ │
│                             │
│ 앱 설정                      │
│ ┌─────────────────────────┐ │
│ │ 알림 설정            [→] │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │    🚪 로그아웃          │ │   ← 빨간색
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

#### A1.4.2 Tailwind Implementation

```html
<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white px-5 safe-top sticky top-0 z-40 border-b border-gray-100">
    <div class="h-14 flex items-center">
      <a href="/employer" class="w-10 h-10 flex items-center justify-center -ml-2">
        <svg class="w-6 h-6 text-gray-900"><!-- back arrow --></svg>
      </a>
      <span class="text-[17px] font-bold text-gray-900 ml-2">프로필 설정</span>
    </div>
  </header>
  
  <!-- Profile Header -->
  <div class="bg-white px-5 py-8 text-center border-b border-gray-100">
    <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
      <span class="text-4xl">👤</span>
    </div>
    <h1 class="text-[20px] font-bold text-gray-900">김사장님</h1>
    <p class="text-[14px] text-gray-500 mt-1">example@kakao.com</p>
  </div>
  
  <!-- Settings Sections -->
  <div class="p-4 space-y-4">
    <!-- 내 정보 -->
    <section>
      <h2 class="text-[14px] font-medium text-gray-500 px-1 mb-2">내 정보</h2>
      <div class="bg-white rounded-2xl overflow-hidden">
        <button class="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 active:bg-gray-50">
          <div>
            <p class="text-[13px] text-gray-500 mb-0.5">이름</p>
            <p class="text-[15px] text-gray-900">김사장님</p>
          </div>
          <svg class="w-5 h-5 text-gray-400"><!-- chevron-right --></svg>
        </button>
        <button class="w-full flex items-center justify-between px-5 py-4 active:bg-gray-50">
          <div>
            <p class="text-[13px] text-gray-500 mb-0.5">연락처</p>
            <p class="text-[15px] text-gray-900">010-1234-5678</p>
          </div>
          <svg class="w-5 h-5 text-gray-400"><!-- chevron-right --></svg>
        </button>
      </div>
    </section>
    
    <!-- 역할 -->
    <section>
      <h2 class="text-[14px] font-medium text-gray-500 px-1 mb-2">역할</h2>
      <div class="bg-white rounded-2xl overflow-hidden">
        <button class="w-full flex items-center justify-between px-5 py-4 active:bg-gray-50">
          <div>
            <p class="text-[15px] text-gray-900">현재 역할: <strong class="text-blue-500">사장님</strong></p>
            <p class="text-[13px] text-gray-500 mt-0.5">알바생으로 전환 가능</p>
          </div>
          <svg class="w-5 h-5 text-gray-400"><!-- chevron-right --></svg>
        </button>
      </div>
    </section>
    
    <!-- 앱 설정 -->
    <section>
      <h2 class="text-[14px] font-medium text-gray-500 px-1 mb-2">앱 설정</h2>
      <div class="bg-white rounded-2xl overflow-hidden">
        <button class="w-full flex items-center justify-between px-5 py-4 active:bg-gray-50">
          <span class="text-[15px] text-gray-900">알림 설정</span>
          <svg class="w-5 h-5 text-gray-400"><!-- chevron-right --></svg>
        </button>
      </div>
    </section>
    
    <!-- 로그아웃 -->
    <section>
      <a href="/auth/signout" class="block bg-white rounded-2xl">
        <button class="w-full flex items-center justify-center px-5 py-4 active:bg-gray-50">
          <span class="text-[15px] text-red-500 font-medium">🚪 로그아웃</span>
        </button>
      </a>
    </section>
  </div>
</div>
```

---

### A1.5 근로자 대시보드 변경

사업자 대시보드와 동일한 패턴 적용:
- 탭 제거
- 2개 섹션 (대기중, 완료)
- 헤더에 햄버거 메뉴 추가
- 크레딧 카드는 표시하지 않음 (근로자는 크레딧 불필요)

---

### A1.6 UX Writing 가이드 (추가)

| 위치 | 기존 | 변경 |
|------|------|------|
| 대시보드 섹션 제목 | "대기중" | "📋 대기중인 계약서" |
| 대시보드 섹션 제목 | "완료" | "✅ 완료된 계약서" |
| 메뉴 항목 | - | 아이콘 + 텍스트 조합 |
| 로그아웃 | "로그아웃" | "🚪 로그아웃" (빨간색) |

---

> **Amendment 1 끝**

---

## 📝 Amendment 2: 게스트 모드 UI (2026년 1월 24일)

> **버전**: 1.2  
> **변경 사유**: 게스트 모드 UI 및 환영 메시지

### A2.1 역할 선택 페이지 환영 메시지

#### 기존
```html
<h1 class="text-[26px] font-bold text-gray-900 mb-2">
  반가워요! 👋
</h1>
```

#### 변경
```html
<h1 class="text-[26px] font-bold text-gray-900 mb-2">
  {userName}님, 환영합니다! 👋
</h1>
```

---

### A2.2 게스트 모드 대시보드 표시

게스트 모드에서는 프로필 이름에 "게스트"가 포함됩니다.

**사업자:**
```
┌─────────────────────────────────────┐
│     싸인해주세요    💎3  🔔  ☰     │
├─────────────────────────────────────┤
│                                     │
│ 대기중인 계약서 (1)                  │
│ ┌─────────────────────────────────┐ │
│ │ 홍길동 | 9,860원 | 🟡 대기중    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 완료된 계약서 (1)       [📁 폴더]   │
│ ┌─────────────────────────────────┐ │
│ │ 김철수 | 10,000원 | 🟢 완료    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**근로자:**
```
┌─────────────────────────────────────┐
│     싸인해주세요          🔔  ☰     │
├─────────────────────────────────────┤
│                                     │
│ 안녕하세요, 게스트 알바생님 👋       │
│ 서명할 계약서가 1건 있어요          │
│                                     │
│ 서명 대기중                          │
│ ┌─────────────────────────────────┐ │
│ │ 김사장 | D-2 | 9,860원 [서명] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 체결된 계약서                        │
│ ┌─────────────────────────────────┐ │
│ │ 이사장 | 10,500원 | 완료       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

### A2.3 메뉴 시트 게스트 표시

게스트 모드에서 메뉴 시트:
```
┌─────────────────────────────────────┐
│ 😊 게스트 사장님님                   │
│ (이메일 없음)                        │
├─────────────────────────────────────┤
│ 👤 프로필 설정        →             │
│ 💳 크레딧 충전        →             │
│ 📋 결제 내역          →             │
├─────────────────────────────────────┤
│ 🚪 로그아웃           →             │
└─────────────────────────────────────┘
```

---

> **Amendment 2 끝**
