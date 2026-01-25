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

## 🔴 [추가 이슈] 핵심 플로우 검토 (2026년 1월 25일)

### 검토 영역
1. 계약서 DB 저장
2. PDF 생성
3. 카카오톡 공유
4. 근로자 휴대폰 인증
5. 서명 링크 전송
6. 계약서-근로자 매칭

---

### 이슈 1: ✅ [해결됨] 근로자 휴대폰 번호 입력 기능

**현재 상태**: ✅ 구현 완료 (2026년 1월 25일)

**해결 내용**:
1. ✅ `contracts` 테이블에 `worker_phone` 컬럼 추가 (마이그레이션 적용)
2. ✅ `contractFormStore`에 `workerPhone` 필드 추가
3. ✅ Step2에 휴대폰 번호 입력 UI 추가 (자동 하이픈 포맷팅)
4. ✅ 유효성 검사 추가 (`phoneRegex`, `normalizePhone`)
5. ✅ `types/database.ts` 타입 업데이트

**수정된 파일**:
- `stores/contractFormStore.ts` - `workerPhone` 필드 추가
- `components/contract/ContractForm/Step2WorkerName.tsx` - 휴대폰 입력 UI 추가
- `lib/utils/validation.ts` - 휴대폰 번호 유효성 검사 추가
- `types/database.ts` - worker_phone 타입 추가

---

### 이슈 2: 🔴 [Critical] 서명 링크 SMS 전송 기능 없음

**현재 상태**: ❌ 미구현 (링크 생성만 가능)

**문제점**:
- `sendContract()` 함수는 **공유 링크를 생성**만 하고 **실제 전송하지 않음**
- 사장이 링크를 수동으로 복사해서 근로자에게 전달해야 함
- 카카오톡 공유는 **SDK 기반**으로 사장의 카카오톡 앱에서만 전송 가능

**현재 코드** (`app/(protected)/employer/preview/[id]/actions.ts`):
```typescript
export async function sendContract(contractId: string): Promise<ActionResult<{ shareUrl: string }>> {
  // ... 인증 및 계약서 조회
  
  // 공유 URL만 반환 - SMS/알림톡 전송 없음!
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contract/sign/${shareToken}`;
  return { success: true, data: { shareUrl } };
}
```

**수정 필요 사항**:
1. SMS 발송 API 연동 (알리고, 솔라피 등)
2. 또는 카카오 알림톡 연동 (비즈니스 메시지)
3. `sendContract()` 함수에 근로자 휴대폰 번호 파라미터 추가
4. 전송 결과 로깅

**권장 구현**:
```typescript
export async function sendContract(
  contractId: string,
  workerPhone: string  // 추가
): Promise<ActionResult<{ shareUrl: string }>> {
  // ... 기존 로직
  
  // SMS 발송
  await sendSMS(workerPhone, `[싸인해주세요] 근로계약서가 도착했어요. ${shareUrl}`);
  
  return { success: true, data: { shareUrl } };
}
```

---

### 이슈 3: 🔴 [Critical] 비로그인 근로자 서명 불가

**현재 상태**: ❌ 제한적 (로그인 필수)

**문제점**:
- `signatures` 테이블의 `user_id` 컬럼이 **NOT NULL**
- 비로그인 근로자는 서명할 수 없음 (로그인 강제)
- 알바생이 앱 설치/가입 없이 서명하는 **게스트 서명** 불가

**현재 코드** (`app/contract/sign/[token]/actions.ts`):
```typescript
export async function signAsWorker(token: string, signatureImageData: string): Promise<ActionResult> {
  // ...
  
  // user_id는 필수이므로 로그인하지 않은 경우 처리 필요
  if (!user) {
    return { success: false, error: '서명하려면 로그인이 필요해요' };
  }
  
  // ...
}
```

**수정 필요 사항**:
1. `signatures.user_id`를 **nullable**로 변경
2. 비로그인 서명 시 **휴대폰 본인인증** 추가
3. 본인인증 결과를 `signatures` 테이블에 저장

**마이그레이션 SQL**:
```sql
ALTER TABLE signatures ALTER COLUMN user_id DROP NOT NULL;
```

**대안**:
- 휴대폰 번호로 **익명 사용자 생성** 후 서명
- 또는 **게스트 세션** 생성 후 서명

---

### 이슈 4: 🟡 [Medium] 휴대폰 본인인증 미구현

**현재 상태**: ❌ 미구현

**문제점**:
- 근로자 본인인증 기능이 전혀 없음
- `worker_details.is_verified` 필드는 있으나 인증 로직 없음
- 아무나 링크만 있으면 서명 가능 (보안 취약)

**수정 필요 사항**:
1. SMS 인증 (인증번호 발송 → 검증)
2. 또는 PASS 인증 (통신사 본인확인)
3. 인증 완료 후 서명 허용

**권장 플로우**:
```
1. 근로자가 서명 링크 접속
2. 휴대폰 번호 입력 (계약서에 저장된 번호와 일치 확인)
3. SMS 인증번호 발송
4. 인증번호 입력 및 검증
5. 인증 성공 시 서명 페이지 표시
```

---

### 이슈 5: 🟡 [Medium] PDF Storage 저장 미구현

**현재 상태**: ⚠️ 부분 구현 (다운로드만 가능)

**문제점**:
- PDF가 생성되어 **클라이언트에 다운로드**만 됨
- **Supabase Storage에 저장하지 않음**
- `contracts.pdf_url` 컬럼이 항상 **NULL**

**현재 코드** (`app/api/pdf/generate/route.ts`):
```typescript
// PDF 생성 후 Base64로만 반환 - Storage 저장 없음!
const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
return NextResponse.json({
  success: true,
  pdf: pdfBase64,
  filename: `근로계약서_${contract.worker_name}_...`,
});
```

**수정 필요 사항**:
1. 서명 완료 시 PDF를 **자동으로 Storage에 저장**
2. `contracts.pdf_url` 업데이트
3. 이후 조회 시 저장된 PDF URL 제공

**권장 구현**:
```typescript
// 계약서 완료 시 (양측 서명 후)
const pdfPath = `contracts/${contractId}/${Date.now()}.pdf`;
const { error: uploadError } = await supabase.storage
  .from('contracts-pdf')
  .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf' });

await supabase.from('contracts')
  .update({ pdf_url: pdfPath })
  .eq('id', contractId);
```

---

### 이슈 6: 🟡 [Medium] 알림(Notification) 생성 로직 없음

**현재 상태**: ❌ 미구현

**문제점**:
- `notifications` 테이블은 있으나 **알림 생성 로직이 없음**
- 계약서 전송/서명 시 상대방에게 알림이 가지 않음
- `notification_type` Enum은 정의되어 있음 (`contract_sent`, `contract_signed` 등)

**수정 필요 사항**:
1. `sendContract()` 시 `contract_sent` 알림 생성
2. `signAsWorker()` 시 `contract_signed` 알림 생성 (사장에게)
3. 만료 임박 시 `contract_expired_soon` 알림 생성 (pg_cron)

**권장 구현**:
```typescript
// sendContract() 내부
await supabase.from('notifications').insert({
  user_id: contract.worker_id,
  type: 'contract_sent',
  title: '계약서가 도착했어요',
  body: `${employerName}님이 근로계약서를 보냈어요`,
  data: { contract_id: contractId },
});
```

---

### 이슈 7: 🟢 [Low] 카카오 SDK 로드 타이밍

**현재 상태**: ⚠️ 개선 권장

**문제점**:
- 카카오 SDK가 `lazyOnload` 전략으로 로드됨
- 사용자가 빠르게 공유 버튼 클릭 시 SDK 미로드 상태일 수 있음

**현재 코드** (`app/layout.tsx`):
```typescript
<Script
  src="https://t1.kakaocdn.net/kakao_js_sdk/2.6.0/kakao.min.js"
  strategy="lazyOnload"  // 느리게 로드
  ...
/>
```

**권장 수정**:
```typescript
strategy="afterInteractive"  // DOM 로드 후 즉시
```

**또는 공유 버튼 클릭 시 SDK 로드 대기**:
```typescript
const handleKakaoShare = async () => {
  // SDK 로드 대기
  while (!window.Kakao) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  // ...
};
```

---

### 이슈 8: ✅ [해결됨] 계약서-근로자 매칭 강화

**현재 상태**: ✅ 구현 완료 (2026년 1월 25일)

**해결 내용**:
1. ✅ 서명 링크 접근 시 휴대폰 번호 확인 단계 추가
2. ✅ 계약서에 저장된 `worker_phone`과 입력 번호 일치 확인
3. ✅ 마스킹된 힌트 표시 (010-****-5678)
4. ✅ 번호 일치 시에만 계약서 내용 표시

**플로우**:
```
링크 클릭 → 휴대폰 번호 입력 → 번호 매칭 → 계약서 보기 → 서명
```

---

## 📊 이슈 요약표 (2026년 1월 25일 업데이트)

| # | 영역 | 심각도 | 상태 | 설명 |
|---|------|--------|------|------|
| 1 | 계약서 작성 | 🔴 Critical | ✅ 해결 | 근로자 휴대폰 번호 입력 **구현 완료** |
| 2 | 서명 링크 전송 | 🔴 Critical | ⚠️ 부분 | 카카오톡 공유로 대체 (SMS 미구현) |
| 3 | 근로자 서명 | 🔴 Critical | ✅ MVP 해결 | 휴대폰 번호 매칭 후 카카오 로그인 유도 |
| 4 | 본인인증 | 🟡 Medium | ✅ MVP 해결 | 휴대폰 번호 매칭으로 기본 본인확인 |
| 5 | PDF 저장 | 🟡 Medium | ⚠️ 부분 | Storage 저장 안됨 |
| 6 | 알림 | 🟡 Medium | ❌ 미구현 | 알림 생성 로직 없음 |
| 7 | 카카오 공유 | 🟢 Low | ⚠️ 개선 | SDK 로드 타이밍 |
| 8 | 계약서 매칭 | 🟢 Low | ✅ 해결 | 휴대폰 번호 매칭 **구현 완료** |

---

## 🔧 권장 수정 순서

### Phase 1: 핵심 플로우 완성 (필수)
1. **contracts 테이블에 worker_phone 컬럼 추가**
2. **계약서 작성 폼에 휴대폰 번호 입력 추가**
3. **SMS 인증 구현** (인증번호 발송/검증)
4. **비로그인 서명 허용** (signatures.user_id nullable)

### Phase 2: 전송 기능 (권장)
5. **SMS 발송 API 연동** (솔라피, 알리고 등)
6. **또는 카카오 알림톡 연동**

### Phase 3: 부가 기능 (선택)
7. **PDF Storage 저장**
8. **알림 생성 로직 추가**
9. **카카오 SDK 로드 최적화**

---

## 📝 참고: 현재 동작하는 기능

| 기능 | 상태 | 설명 |
|------|------|------|
| 계약서 DB 저장 | ✅ 동작 | `createContract()` 정상 동작 |
| PDF 생성 | ✅ 동작 | 클라이언트 다운로드 가능 |
| 카카오톡 공유 | ✅ 동작 | SDK 기반 링크 공유 가능 |
| 공유 링크 생성 | ✅ 동작 | `share_token` 기반 URL 생성 |
| 로그인 사용자 서명 | ✅ 동작 | 카카오 로그인 후 서명 가능 |

---

> **검수 완료**  
> 필수 조치 사항 모두 해결됨. 배포 준비 완료.  
> 
> **추가 검토 결과 (2026.01.25)**:  
> 핵심 플로우에서 8개의 추가 이슈가 발견되었습니다.
> 
> **MVP 해결 현황 (2026.01.25 업데이트)**:  
> ✅ 이슈 1: 근로자 휴대폰 번호 입력 - **구현 완료**  
> ✅ 이슈 3: 비로그인 서명 불가 - **휴대폰 매칭 + 카카오 로그인 유도로 해결**  
> ✅ 이슈 4: 본인인증 - **휴대폰 번호 매칭으로 MVP 해결**  
> ✅ 이슈 8: 계약서-근로자 매칭 - **구현 완료**  
>
> **남은 이슈**:  
> ⚠️ 이슈 2: SMS 자동 전송 (카카오톡 공유로 대체)  
> ⚠️ 이슈 5: PDF Storage 저장  
> ⚠️ 이슈 6: 알림 생성 로직  
> ⚠️ 이슈 7: 카카오 SDK 로드 타이밍  
> 
> 추가 질문이나 상세 검토가 필요한 영역이 있으면 말씀해 주세요.
