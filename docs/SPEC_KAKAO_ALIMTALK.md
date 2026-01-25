# 📱 카카오 알림톡 연동 스펙

> **버전**: 1.0  
> **작성일**: 2026년 1월 25일  
> **상태**: 사업자등록 후 구현 예정  
> **우선순위**: P0 (1순위)

---

## 1. 개요

### 1.1 목적
사장님이 계약서를 작성 완료 후 근로자에게 자동으로 카카오 알림톡을 발송하여 서명 링크를 전달합니다.

### 1.2 현재 상태
- 현재: 카카오톡 SDK 기반 공유 (사장님이 직접 공유 버튼 클릭)
- 변경: 알림톡으로 자동 발송 (SDK 공유 기능 대체)

### 1.3 선정 제공사
- **알리고 (Aligo)**: 저렴하고 국내에서 많이 사용되는 서비스
- 홈페이지: https://smartsms.aligo.in

---

## 2. 기술 요구사항

### 2.1 사전 준비 (사업자등록 후)

| 항목 | 설명 | 상태 |
|------|------|------|
| 사업자등록증 | 알리고 가입 및 카카오 채널 연동에 필수 | 대기 |
| 알리고 계정 | API Key 발급 | 대기 |
| 카카오 비즈니스 채널 | 알림톡 발송에 필수 (pfId) | 대기 |
| 알림톡 템플릿 | 카카오에 사전 등록/승인 필요 | 대기 |

### 2.2 환경 변수

```bash
# .env.local에 추가 필요
ALIGO_API_KEY=xxx
ALIGO_USER_ID=xxx
ALIGO_SENDER_KEY=xxx  # 발신프로필 키
KAKAO_CHANNEL_ID=xxx  # 카카오 비즈니스 채널 ID (pfId)
```

---

## 3. 알림톡 템플릿

### 3.1 계약서 전송 알림 (contract_sent)

```
[싸인해주세요] 근로계약서가 도착했어요!

#{사장님이름}님이 근로계약서를 보냈어요.
계약 내용을 확인하고 서명해주세요.

📋 근무지: #{근무지}
💰 시급: #{시급}원
📅 근무 시작일: #{시작일}

▶ 서명 기한: #{만료일}까지

[계약서 확인하기]
```

**변수**:
| 변수명 | 설명 | 예시 |
|--------|------|------|
| #{사장님이름} | 사업자 이름 | 김사장 |
| #{근무지} | work_location | GS25 강남점 |
| #{시급} | hourly_wage (포맷팅) | 10,360 |
| #{시작일} | start_date (포맷팅) | 2026.02.01 |
| #{만료일} | expires_at (포맷팅) | 2026.02.08 |

**버튼**:
- 타입: WL (웹링크)
- 버튼명: 계약서 확인하기
- URL: `${APP_URL}/contract/sign/${share_token}`

### 3.2 Fallback SMS 문자

알림톡 발송 실패 시 자동으로 SMS 발송:

```
[싸인해주세요] 근로계약서가 도착했어요!
#{사장님이름}님이 계약서를 보냈습니다.
확인하기: #{링크}
```

---

## 4. API 설계

### 4.1 알림톡 발송 API

```typescript
// app/api/alimtalk/send/route.ts

interface AlimtalkRequest {
  templateCode: string;
  phoneNumber: string;
  variables: Record<string, string>;
  buttonUrl: string;
  fallbackSms?: boolean;  // 실패 시 SMS 발송 여부 (기본: true)
}

interface AlimtalkResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  fallbackUsed?: boolean;  // SMS로 대체 발송되었는지
}
```

### 4.2 알리고 API 연동

```typescript
// lib/aligo/client.ts

import crypto from 'crypto';

const ALIGO_API_URL = 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';

interface AligoAlimtalkParams {
  apikey: string;
  userid: string;
  senderkey: string;
  tpl_code: string;
  sender: string;
  receiver_1: string;
  subject_1: string;
  message_1: string;
  button_1?: {
    button: Array<{
      name: string;
      linkType: 'WL';
      linkTypeName: '웹링크';
      linkMo: string;
      linkPc: string;
    }>;
  };
  failover?: 'Y' | 'N';  // SMS Fallback
  fsubject_1?: string;   // Fallback SMS 제목
  fmessage_1?: string;   // Fallback SMS 내용
}

export async function sendAlimtalk(params: {
  phoneNumber: string;
  templateCode: string;
  message: string;
  buttonUrl: string;
  fallbackMessage?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const body: AligoAlimtalkParams = {
    apikey: process.env.ALIGO_API_KEY!,
    userid: process.env.ALIGO_USER_ID!,
    senderkey: process.env.ALIGO_SENDER_KEY!,
    tpl_code: params.templateCode,
    sender: process.env.SENDER_PHONE_NUMBER!,
    receiver_1: params.phoneNumber,
    subject_1: '[싸인해주세요] 근로계약서 알림',
    message_1: params.message,
    button_1: {
      button: [{
        name: '계약서 확인하기',
        linkType: 'WL',
        linkTypeName: '웹링크',
        linkMo: params.buttonUrl,
        linkPc: params.buttonUrl,
      }]
    },
    failover: 'Y',
    fsubject_1: '[싸인해주세요]',
    fmessage_1: params.fallbackMessage || params.message,
  };

  const response = await fetch(ALIGO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body as any).toString(),
  });

  const result = await response.json();

  if (result.code === 0) {
    return { success: true, messageId: result.info?.mid };
  } else {
    return { success: false, error: result.message };
  }
}
```

---

## 5. 서버 액션 수정

### 5.1 sendContract 액션 수정

```typescript
// app/(protected)/employer/preview/[id]/actions.ts

export async function sendContract(contractId: string): Promise<ActionResult<{ shareUrl: string }>> {
  const supabase = await createClient();

  // 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    return { success: false, error: '인증이 필요합니다.' };
  }

  // 계약서 조회
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*, profiles!contracts_employer_id_fkey(name)')
    .eq('id', contractId)
    .eq('employer_id', user.id)
    .single();

  if (!contract || contractError) {
    return { success: false, error: '계약서를 찾을 수 없습니다.' };
  }

  // 근로자 휴대폰 번호 확인
  if (!contract.worker_phone) {
    return { success: false, error: '근로자 휴대폰 번호가 없습니다.' };
  }

  // 공유 URL 생성
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contract/sign/${contract.share_token}`;

  // 알림톡 발송
  const alimtalkResult = await sendAlimtalk({
    phoneNumber: normalizePhone(contract.worker_phone),
    templateCode: 'CONTRACT_SENT',
    message: buildAlimtalkMessage({
      employerName: contract.profiles?.name || '사장님',
      workLocation: contract.work_location,
      hourlyWage: contract.hourly_wage,
      startDate: contract.start_date,
      expiresAt: contract.expires_at,
    }),
    buttonUrl: shareUrl,
  });

  // 발송 로그 저장
  await supabase.from('notification_logs').insert({
    user_id: user.id,
    contract_id: contractId,
    recipient_phone: contract.worker_phone,
    type: 'alimtalk',
    template_code: 'CONTRACT_SENT',
    status: alimtalkResult.success ? 'sent' : 'failed',
    message_id: alimtalkResult.messageId,
    error: alimtalkResult.error,
    fallback_used: !alimtalkResult.success,  // SMS Fallback 여부
  });

  if (!alimtalkResult.success) {
    // 알림톡 실패해도 SMS Fallback이 되므로 성공 처리
    // 단, UI에 알림톡 실패 사실은 기록
    await createNotification(user.id, {
      type: 'alimtalk_fallback',
      title: '알림톡 발송 실패',
      body: '카카오톡 알림톡 발송에 실패하여 SMS로 대체 발송되었습니다.',
      data: { contract_id: contractId },
    });
  }

  // 계약서 상태 업데이트
  await supabase
    .from('contracts')
    .update({
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', contractId);

  return { success: true, data: { shareUrl } };
}

function buildAlimtalkMessage(params: {
  employerName: string;
  workLocation: string;
  hourlyWage: number;
  startDate: string;
  expiresAt: string | null;
}): string {
  const formattedWage = new Intl.NumberFormat('ko-KR').format(params.hourlyWage);
  const formattedStartDate = new Date(params.startDate).toLocaleDateString('ko-KR');
  const formattedExpiry = params.expiresAt 
    ? new Date(params.expiresAt).toLocaleDateString('ko-KR')
    : '7일 이내';

  return `${params.employerName}님이 근로계약서를 보냈어요.
계약 내용을 확인하고 서명해주세요.

📋 근무지: ${params.workLocation}
💰 시급: ${formattedWage}원
📅 근무 시작일: ${formattedStartDate}

▶ 서명 기한: ${formattedExpiry}까지`;
}
```

---

## 6. 데이터베이스 변경

### 6.1 notification_logs 테이블 추가

```sql
-- 마이그레이션: add_notification_logs_table

CREATE TABLE notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  recipient_phone text NOT NULL,
  type text NOT NULL,  -- 'alimtalk', 'sms', 'push'
  template_code text,
  status text NOT NULL,  -- 'sent', 'failed', 'pending'
  message_id text,  -- 외부 서비스의 메시지 ID
  error text,
  fallback_used boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_contract_id ON notification_logs(contract_id);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at DESC);

-- RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_logs_select_own ON notification_logs
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

---

## 7. 재전송 기능

### 7.1 재전송 제한
- 일일 3회까지 재전송 가능
- 제한 초과 시 에러 메시지 표시

### 7.2 재전송 액션

```typescript
export async function resendContract(contractId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 오늘 발송 횟수 확인
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('notification_logs')
    .select('*', { count: 'exact', head: true })
    .eq('contract_id', contractId)
    .eq('type', 'alimtalk')
    .gte('created_at', today.toISOString());

  if (count && count >= 3) {
    return { 
      success: false, 
      error: '하루에 3번까지만 재전송할 수 있어요. 내일 다시 시도해주세요.' 
    };
  }

  // 기존 sendContract 로직 재사용
  return sendContract(contractId);
}
```

---

## 8. UI 변경사항

### 8.1 미리보기 페이지 버튼 변경

**기존**:
```
[카카오톡으로 공유] [링크 복사]
```

**변경**:
```
[저장하고 전송하기 📤]
```

- 버튼 클릭 시 계약서 저장 + 알림톡 자동 발송
- 발송 완료 후 성공 바텀시트 표시

### 8.2 성공 바텀시트

```
✅ 계약서가 전송됐어요!

홍길동님의 카카오톡으로 계약서가 발송됐어요.
서명이 완료되면 알림을 보내드릴게요.

[대시보드로 이동]
```

### 8.3 발송 실패 알림

발송 실패 시 앱 내 알림 센터에 기록:

```
⚠️ 알림톡 발송 실패

카카오톡 알림톡 발송에 실패하여 
SMS로 대체 발송되었습니다.

계약서: 홍길동
발송 시간: 2026.01.25 14:30
```

---

## 9. 테스트 체크리스트

### 9.1 기능 테스트
- [ ] 알림톡 정상 발송
- [ ] 변수 치환 정상 동작
- [ ] 버튼 URL 정상 작동
- [ ] SMS Fallback 동작
- [ ] 발송 로그 저장
- [ ] 재전송 제한 동작 (일 3회)
- [ ] 에러 알림 표시

### 9.2 엣지 케이스
- [ ] 잘못된 전화번호
- [ ] 카카오톡 미설치 사용자
- [ ] 알리고 API 타임아웃
- [ ] 일일 발송 한도 초과

---

## 10. 구현 일정 (예상)

| 단계 | 작업 | 소요 시간 |
|------|------|----------|
| 1 | 알리고 계정 생성 및 API 키 발급 | 사업자등록 후 1일 |
| 2 | 카카오 비즈니스 채널 생성 | 1일 |
| 3 | 알림톡 템플릿 등록 및 승인 | 2-3일 (카카오 검수) |
| 4 | API 연동 개발 | 2일 |
| 5 | UI 변경 | 1일 |
| 6 | 테스트 및 QA | 2일 |
| **총합** | | **약 1-2주** |

---

## 11. 비용 예상

| 항목 | 단가 | 예상 월 발송량 | 월 비용 |
|------|------|---------------|--------|
| 알림톡 | 약 8원/건 | 1,000건 | 8,000원 |
| SMS Fallback | 약 15원/건 | 100건 (10%) | 1,500원 |
| **총합** | | | **약 10,000원/월** |

---

> **다음 단계**: 사업자등록 완료 후 알리고/카카오 채널 설정
