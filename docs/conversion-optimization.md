# 전환율 최적화 계획 (v2)

## 가입 전환 + 구매 전환 개선 - 가치/신뢰 중심

> **목표**: 가입률 +15~20%, 구매전환율 +10~15%  
> **작업 범위**: 로그인 페이지, 프라이싱 페이지  
> **접근 방식**: FOMO 없이 가치와 신뢰로 설득

---

## 설계 원칙

| 사용 ✅                       | 사용 안함 ❌       |
| ----------------------------- | ------------------ |
| 가치 제안 (Value Proposition) | 카운트다운 타이머  |
| 사회적 증거 (Social Proof)    | "한정", "마감임박" |
| 신뢰 지표 (Trust Signals)     | 붉은색 긴급성 배너 |
| 명확한 혜택 설명              | "지금 아니면" 표현 |
| 고객 후기                     | 인위적 희소성      |

---

## 1. 로그인 페이지 개선 (가입 전환)

### 1.1 현재 상태 (BEFORE)

```
┌─────────────────────────────┐
│ ←                           │
│                             │
│         [로고]              │
│      싸인해주세요            │
│                             │
│   계약서 작성부터 서명까지    │
│   한 곳에서 간편하게          │
│                             │
│                             │
│ ┌─────────────────────────┐ │
│ │  🗨 카카오로 시작하기     │ │
│ └─────────────────────────┘ │
│  이용약관 및 개인정보 처리방침  │
└─────────────────────────────┘
```

**문제점**:

- 가입 혜택이 전혀 보이지 않음
- 서비스 가치 제안이 약함
- 왜 이 서비스를 써야 하는지 모름

### 1.2 개선안 (AFTER) - 가치 중심

```
┌─────────────────────────────┐
│ ←                           │
│                             │
│         [로고]              │
│      싸인해주세요            │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🎁 가입하면 계약서 5건    │ │  ← 혜택 (긴급성 없음)
│ │    무료로 드려요          │ │
│ └─────────────────────────┘ │
│                             │
│  ✓ 12,847명의 사장님이       │  ← 소셜 프루프 (신뢰)
│    선택했어요                │
│                             │
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │ ⏱  │ │ 🤖  │ │ ☁️  │   │  ← 가치 제안 3가지
│  │10분 │ │ AI  │ │영구 │   │
│  │완성 │ │검토 │ │보관 │   │
│  └─────┘ └─────┘ └─────┘   │
│                             │
│ ┌─────────────────────────┐ │
│ │  🗨 카카오로 시작하기     │ │
│ └─────────────────────────┘ │
│  이용약관 및 개인정보 처리방침  │
└─────────────────────────────┘
```

### 1.3 추가되는 요소

| 요소                | 내용                                | 목적                    |
| ------------------- | ----------------------------------- | ----------------------- |
| **혜택 카드**       | "가입하면 계약서 5건 무료로 드려요" | 가입 동기 (긴급성 없음) |
| **소셜 프루프**     | "12,847명의 사장님이 선택했어요"    | 신뢰 형성               |
| **가치 아이콘 3개** | 10분 완성 / AI 검토 / 영구 보관     | 서비스 이해             |

### 1.4 코드 변경

**파일**: `app/(public)/login/login-form.tsx`

```tsx
// 1. 혜택 카드 (긴급성 없음, 담담한 톤)
<div className="bg-blue-50 rounded-2xl px-5 py-4 mb-6">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    </div>
    <div>
      <p className="text-[15px] font-bold text-gray-900">
        가입하면 계약서 5건 무료
      </p>
      <p className="text-[13px] text-gray-500">
        바로 사용할 수 있는 크레딧을 드려요
      </p>
    </div>
  </div>
</div>

// 2. 소셜 프루프 (신뢰 중심)
<div className="flex items-center justify-center gap-2 mb-6">
  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
  <p className="text-[14px] text-gray-600">
    <strong className="text-gray-900">12,847명</strong>의 사장님이 선택했어요
  </p>
</div>

// 3. 가치 제안 아이콘
<div className="flex justify-center gap-8 mb-8">
  <div className="text-center">
    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-2 mx-auto">
      <svg className="w-7 h-7 text-blue-500">
        {/* 시계 아이콘 */}
      </svg>
    </div>
    <p className="text-[13px] font-medium text-gray-700">10분 완성</p>
  </div>
  <div className="text-center">
    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-2 mx-auto">
      <svg className="w-7 h-7 text-green-500">
        {/* AI 아이콘 */}
      </svg>
    </div>
    <p className="text-[13px] font-medium text-gray-700">AI 노무사 검토</p>
  </div>
  <div className="text-center">
    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-2 mx-auto">
      <svg className="w-7 h-7 text-amber-500">
        {/* 클라우드 아이콘 */}
      </svg>
    </div>
    <p className="text-[13px] font-medium text-gray-700">영구 보관</p>
  </div>
</div>
```

---

## 2. 프라이싱 페이지 개선 (구매 전환)

### 2.1 현재 상태 (BEFORE)

```
┌─────────────────────────────┐
│ ←      크레딧 충전           │
│                             │
│ ┌─────────────────────────┐ │
│ │ 현재 보유 크레딧: 3건     │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 계약서 5건      ₩4,900   │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 계약서 15건     ₩12,900  │ │
│ │               [인기]     │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 계약서 50건     ₩39,000  │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │   ₩12,900 결제하기       │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**문제점**:

- 가격 대비 가치가 잘 안 보임
- 신뢰 지표 없음
- 고객 후기 없음

### 2.2 개선안 (AFTER) - 가치/신뢰 중심

```
┌─────────────────────────────┐
│ ←      크레딧 충전           │
│                             │
│ ┌─────────────────────────┐ │
│ │ 현재 보유 크레딧: 3건     │ │
│ └─────────────────────────┘ │
│                             │
│   더 많이 충전할수록 할인돼요  │  ← 가치 설명
│                             │
│ ┌─────────────────────────┐ │
│ │ 계약서 5건      ₩4,900   │ │
│ │              (건당 ₩980) │ │  ← 건당 가격 강조
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 계약서 15건     ₩12,900  │ │
│ │  [추천] (건당 ₩860)      │ │  ← "추천" (인기→추천)
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 계약서 50건     ₩39,000  │ │
│ │        (건당 ₩780 최저가) │ │  ← 최저가 강조
│ └─────────────────────────┘ │
│                             │
│  ✓보안결제 ✓즉시충전 ✓7일환불 │  ← 신뢰 지표
│                             │
│ ┌─────────────────────────┐ │
│ │ "계약서 작성이 정말       │ │  ← 고객 후기
│ │  편해졌어요" - 카페 사장님 │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │   ₩12,900 결제하기       │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### 2.3 추가되는 요소

| 요소          | 내용                           | 목적           |
| ------------- | ------------------------------ | -------------- |
| **가치 설명** | "더 많이 충전할수록 할인돼요"  | 대량 구매 유도 |
| **건당 가격** | 각 상품별 건당 가격 표시       | 가성비 인식    |
| **추천 뱃지** | "인기" → "추천"으로 변경       | FOMO 제거      |
| **신뢰 지표** | 보안결제 / 즉시충전 / 7일 환불 | 결제 불안 해소 |
| **고객 후기** | 실제 사용자 한줄평             | 사회적 증거    |

### 2.4 코드 변경

**파일**: `app/(protected)/pricing/pricing-page.tsx`

```tsx
// 1. 가치 설명 헤더
<p className="text-[15px] text-blue-600 font-medium mb-4">
  더 많이 충전할수록 할인돼요
</p>

// 2. 상품 정의 수정 (건당 가격 추가)
const PRODUCTS = [
  {
    id: 'credit_5',
    name: '계약서 5건',
    credits: 5,
    price: 4900,
    pricePerUnit: 980,
    badge: null,
    description: '가볍게 시작하기',
  },
  {
    id: 'credit_15',
    name: '계약서 15건',
    credits: 15,
    price: 12900,
    pricePerUnit: 860,
    badge: '추천',  // "인기" → "추천"
    description: '가장 많이 선택해요',
  },
  {
    id: 'credit_50',
    name: '계약서 50건',
    credits: 50,
    price: 39000,
    pricePerUnit: 780,
    badge: '최저가',
    description: '대형 사업장 추천',
  },
];

// 3. 상품 카드 내 건당 가격 표시
<p className="text-[12px] text-gray-500">
  건당 {formatCurrency(product.pricePerUnit)}
  {product.badge === '최저가' && (
    <span className="text-green-600 font-medium ml-1">최저가</span>
  )}
</p>

// 4. 뱃지 스타일 (FOMO 없는 색상)
{product.badge && (
  <span className={clsx(
    'text-[11px] font-medium px-2 py-0.5 rounded-full',
    product.badge === '추천' && 'bg-green-100 text-green-700',
    product.badge === '최저가' && 'bg-blue-100 text-blue-700',
  )}>
    {product.badge}
  </span>
)}

// 5. 신뢰 지표
<div className="flex justify-center gap-4 py-4 mb-4">
  <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
    보안결제
  </div>
  <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
    즉시충전
  </div>
  <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
    7일 환불보장
  </div>
</div>

// 6. 고객 후기 (선택적)
<div className="bg-gray-50 rounded-xl p-4 mb-4">
  <p className="text-[14px] text-gray-700 italic">
    "계약서 작성이 정말 편해졌어요"
  </p>
  <p className="text-[12px] text-gray-500 mt-1">
    - 카페 사장님
  </p>
</div>
```

---

## 3. 구현 우선순위

### Phase 1: 즉시 적용 (반나절)

| 작업                        | 파일               | 시간 |
| --------------------------- | ------------------ | ---- |
| 로그인 혜택 카드 추가       | `login-form.tsx`   | 30분 |
| 프라이싱 건당 가격 표시     | `pricing-page.tsx` | 20분 |
| 프라이싱 "인기"→"추천" 변경 | `pricing-page.tsx` | 5분  |
| 프라이싱 신뢰 지표 추가     | `pricing-page.tsx` | 30분 |

### Phase 2: 단기 적용 (1~2일)

| 작업                    | 파일               | 시간  |
| ----------------------- | ------------------ | ----- |
| 로그인 소셜 프루프      | `login-form.tsx`   | 30분  |
| 로그인 가치 아이콘 3개  | `login-form.tsx`   | 1시간 |
| 프라이싱 가치 설명 헤더 | `pricing-page.tsx` | 15분  |
| 프라이싱 고객 후기      | `pricing-page.tsx` | 30분  |

### Phase 3: 중기 적용 (선택)

| 작업                   | 파일             | 시간  |
| ---------------------- | ---------------- | ----- |
| 실제 사용자 수 DB 조회 | Server Component | 2시간 |
| 실제 고객 후기 DB 연동 | 별도 테이블 필요 | 4시간 |

---

## 4. 와이어프레임 이미지

- 로그인 페이지: `assets/login-page-wireframe-v2.png`
- 프라이싱 페이지: `assets/pricing-page-wireframe-v2.png`

---

## 5. 제거한 FOMO 요소

| 제거한 요소                      | 대체한 요소                   |
| -------------------------------- | ----------------------------- |
| ⏰ "이번 달 특가 D-5" 카운트다운 | "더 많이 충전할수록 할인돼요" |
| 🔴 빨간색/주황색 긴급성 배너     | 🔵 파란색/초록색 가치 배너    |
| "이번 달 127명 선택"             | 건당 가격으로 가치 비교       |
| "지금 바로" 표현                 | 일반 CTA 유지                 |
| "인기" 뱃지 (동조 압박)          | "추천" 뱃지 (가이드 역할)     |

---

## 6. 기대 효과

| 지표          | 현재 | 목표 | 방법                    |
| ------------- | ---- | ---- | ----------------------- |
| 로그인→가입   | ~30% | 40%+ | 혜택 명확화 + 가치 제안 |
| 프라이싱→결제 | ~5%  | 7%+  | 신뢰 지표 + 가성비 인식 |

**참고**: FOMO 방식보다 전환율 상승폭은 낮을 수 있지만,
장기적인 브랜드 신뢰도와 고객 만족도에 더 유리합니다.

---

> **문서 끝**
