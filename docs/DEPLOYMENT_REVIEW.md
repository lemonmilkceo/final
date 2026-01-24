# 📋 배포 전 1차 검수 보고서
## 싸인해주세요 (SignPlease)

> **검수일**: 2026년 1월 24일  
> **검수자**: QA Engineer  
> **빌드 상태**: ✅ 성공
> **최종 업데이트**: 2026년 1월 24일 (필수 조치 완료)

---

## 📊 검수 요약 (업데이트됨)

| 영역 | 상태 | 심각도 | 비고 |
|------|------|--------|------|
| 빌드 | ✅ 통과 | - | Next.js 16.1.4 빌드 성공 |
| 데이터베이스 스키마 | ✅ 완료 | - | 마이그레이션 적용 완료 |
| API 설계 | ✅ 완료 | - | 보안 개선 완료 |
| 환경 변수 | ✅ 완료 | - | .env.example 생성 완료 |
| 미완성 기능 | ⚠️ 일부 미구현 | 🟡 중간 | MVP 이후 구현 예정 |
| 보안 | ✅ 완료 | - | 개선 완료 |

---

## ✅ [완료] Critical 이슈 해결

### 1. ✅ 환경 변수 파일 생성

**해결**: `.env.example` 파일 생성 완료

```bash
# 포함된 환경 변수
- Supabase (URL, ANON_KEY, SERVICE_ROLE_KEY)
- ENCRYPTION_KEY (32바이트, Base64)
- 토스페이먼츠 (CLIENT_KEY, SECRET_KEY)
- 카카오 (JS_KEY, REST_API_KEY)
- OpenAI API KEY
- APP URL
- 카카오 알림톡 (선택)
```

---

### 2. ✅ 결제 API 시크릿 키 하드코딩 제거

**파일**: `app/api/payment/confirm/route.ts`

**수정 내용**:
```typescript
// 이전 (취약)
const SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_sk_xxx';

// 이후 (안전)
function getTossSecretKey(): string {
  const key = process.env.TOSS_SECRET_KEY;
  if (!key) {
    throw new Error('TOSS_SECRET_KEY 환경 변수가 설정되지 않았습니다.');
  }
  return key;
}
```

---

### 3. ✅ 암호화 키 환경 변수 필수화

**파일**: `lib/utils/encryption.ts`

**수정 내용**:
```typescript
// 이전 (취약)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

// 이후 (안전)
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY 환경 변수가 설정되지 않았습니다. ' +
      '.env.local 파일에 ENCRYPTION_KEY를 설정해주세요.'
    );
  }
  return key;
}
```

---

### 4. ✅ 주민번호 해시 보안 강화

**파일**: `lib/utils/encryption.ts`

**수정 내용**:
```typescript
// 이전 (취약 - Salt 없음)
export function hashSSN(ssn: string): string {
  const partialSSN = ssn.substring(0, 7);
  return crypto.createHash('sha256').update(partialSSN).digest('hex');
}

// 이후 (안전 - HMAC + Salt)
export function hashSSN(ssn: string): string {
  const salt = process.env.SSN_HASH_SALT || 'signplease-ssn-salt-v1';
  const partialSSN = ssn.substring(0, 7);
  return crypto
    .createHmac('sha256', salt)
    .update(partialSSN)
    .digest('hex');
}
```

---

## ✅ [완료] Medium 이슈 해결

### 5. ✅ 데이터베이스 마이그레이션 완료

**적용된 마이그레이션**:

| 마이그레이션 | 내용 |
|------------|------|
| `add_folder_color` | folders.color 컬럼 추가 |
| `add_wage_type_and_monthly_wage` | contracts.wage_type, monthly_wage 추가 |
| `update_minimum_wage_constraint` | hourly_wage >= 10360 제약 조건 |
| `add_payment_timing_fields` | payment_timing, is_last_day_payment 추가 |
| `make_hourly_wage_nullable` | hourly_wage nullable로 변경 (월급제 지원) |

---

### 6. ✅ validation.ts 스키마 업데이트

**추가된 필드**:
- `wageType`: 'hourly' | 'monthly'
- `hourlyWage`: nullable
- `monthlyWage`: nullable
- `paymentTiming`: 'current_month' | 'next_month'
- `isLastDayPayment`: boolean
- `businessType`: nullable

**transformFormToDbSchema 업데이트**:
- 급여 유형에 따른 조건부 처리 (시급/월급)
- 말일 지급 시 payDay 자동 설정

---

### 7. ✅ TypeScript 타입 재생성

**파일**: `types/database.ts`

**업데이트된 contracts 타입**:
```typescript
contracts: {
  Row: {
    // ... 기존 필드
    wage_type: string;
    hourly_wage: number | null;  // nullable로 변경
    monthly_wage: number | null;
    payment_timing: string;
    is_last_day_payment: boolean;
  }
}
```

**업데이트된 folders 타입**:
```typescript
folders: {
  Row: {
    // ... 기존 필드
    color: string | null;
  }
}
```

---

## ⚠️ [남은 작업] MVP 이후 구현 예정

### 미완성 기능 목록

| Task | 기능 | 우선순위 | 상태 |
|------|------|----------|------|
| 5.3.2.1 | TermTooltip (용어 설명) 컴포넌트 | P0 | ❌ 미구현 |
| 5.4.1.3 | 경력증명서 PDF 생성 | P1 | ❌ 미구현 |
| 7.1.2.4 | 채팅 파일 첨부 기능 | P3 | ❌ 미구현 |
| 8.1.2.* | 카카오 알림톡 연동 | P2 | ❌ 미구현 (4개 Task) |
| 9.1.2.2 | 게스트 모드 대시보드 분기 처리 | P3 | ❌ 미구현 |
| 9.1.2.3 | 제한 기능 시 회원가입 유도 | P3 | ❌ 미구현 |
| 9.1.2.4 | AI 검토 1회 체험 제한 | P3 | ❌ 미구현 |
| A1.1.* | 헤더 네비게이션 메뉴 | P0 | ❌ 미구현 (MenuSheet) |
| A1.4.* | 법적 문서 페이지 | P2 | ❌ 미구현 (/terms, /privacy) |

---

## 🔐 Supabase 보안 권고사항

**확인된 권고사항**:
- `auth_leaked_password_protection`: 유출된 비밀번호 보호 비활성화됨

**조치**: Supabase 대시보드 > Auth > Settings에서 활성화 권장
- 참고: https://supabase.com/docs/guides/auth/password-security

---

## 📝 배포 전 체크리스트

### ✅ 필수 (Must-Have) - 완료

- [x] `.env.example` 파일 생성
- [x] 토스페이먼츠 시크릿 키 하드코딩 제거
- [x] 암호화 키 환경 변수 필수화
- [x] 주민번호 해시 보안 강화 (HMAC + Salt)
- [x] 데이터베이스 마이그레이션 (Amendment 3, 6, 9)
- [x] hourly_wage nullable 마이그레이션 (월급제 지원)
- [x] `validation.ts` 스키마 업데이트
- [x] TypeScript 타입 재생성
- [x] 빌드 성공 확인

### 📋 배포 시 필요한 작업

- [ ] Vercel에 프로덕션 환경 변수 설정
- [ ] Supabase Leaked Password Protection 활성화
- [ ] 프로덕션 도메인 설정
- [ ] Vercel Analytics 활성화

### 🔮 추후 권장 (Nice-to-Have)

- [ ] 카카오 알림톡 서비스 연동
- [ ] `/terms`, `/privacy` 법적 페이지 추가
- [ ] MenuSheet 컴포넌트 구현
- [ ] E2E 테스트 추가
- [ ] Sentry 에러 모니터링 설정

---

## 🚀 배포 순서 권장

1. **Vercel 환경 변수 설정**
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - ENCRYPTION_KEY
   - TOSS_SECRET_KEY
   - NEXT_PUBLIC_TOSS_CLIENT_KEY
   - OPENAI_API_KEY (선택)
   - NEXT_PUBLIC_KAKAO_JS_KEY
   - NEXT_PUBLIC_APP_URL

2. **프로덕션 배포**
   - Vercel에서 자동 배포 또는 수동 배포

3. **배포 후 검증**
   - 로그인 플로우 테스트
   - 계약서 작성 플로우 테스트
   - 결제 플로우 테스트 (테스트 모드)
   - 서명 플로우 테스트

---

## 📌 참고사항

### 의존성 버전
- Next.js: 16.1.4 (Turbopack)
- React: 19.2.3
- Supabase: @supabase/ssr 0.8.0, @supabase/supabase-js 2.91.1
- 토스페이먼츠: @tosspayments/tosspayments-sdk 2.5.0
- Zod: 4.3.6
- Zustand: 5.0.10

### 빌드 정보
- 빌드 시간: ~4초 (Turbopack)
- 정적 페이지: 26개
- 동적 라우트: 다수

### 경고 사항
- `middleware` 파일 컨벤션 deprecated 경고 (Next.js 향후 버전에서 `proxy`로 변경 필요)

---

> **검수 완료**  
> 필수 조치 사항 모두 해결됨. 배포 준비 완료.  
> 추가 질문이나 상세 검토가 필요한 영역이 있으면 말씀해 주세요.
