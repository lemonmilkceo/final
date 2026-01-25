# 📲 SMS 본인인증 스펙

> **버전**: 1.0  
> **작성일**: 2026년 1월 25일  
> **상태**: 사업자등록 후 구현 예정  
> **우선순위**: P1 (2순위)

---

## 1. 개요

### 1.1 목적
회원가입 시 휴대폰 번호를 SMS 인증번호로 검증하여 본인 확인을 강화합니다.

### 1.2 현재 상태
- 현재: 휴대폰 번호 매칭 (계약서에 저장된 번호와 입력 번호 비교)
- 변경: SMS 인증번호 발송/검증으로 완전 교체

### 1.3 적용 시점
- **회원가입 시**: 모든 신규 사용자 (필수)
- 기존 MVP의 "휴대폰 번호 매칭" 방식은 제거

### 1.4 선정 제공사
- **알리고 (Aligo)**: 카카오 알림톡과 동일한 서비스 사용
- SMS 단가: 약 15~20원/건

---

## 2. 인증 플로우

### 2.1 회원가입 플로우

```
[카카오 로그인 버튼 클릭]
         ↓
[카카오 OAuth 인증]
         ↓
[SMS 본인인증 화면] ← 신규 추가
    │
    ├─ 휴대폰 번호 입력
    │      ↓
    ├─ [인증번호 발송] 버튼
    │      ↓
    ├─ 4자리 인증번호 입력
    │      ↓
    └─ [확인] 버튼
         ↓
[인증 성공]
         ↓
[역할 선택 화면]
```

### 2.2 인증 규칙

| 항목 | 설정값 |
|------|--------|
| 인증번호 길이 | 4자리 숫자 |
| 유효 시간 | 3분 |
| 재발송 제한 | 시간당 3회 |
| 오류 입력 제한 | 3회 실패 시 재발송 필요 |

---

## 3. 데이터베이스 설계

### 3.1 sms_verifications 테이블

```sql
-- 마이그레이션: add_sms_verifications_table

CREATE TABLE sms_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  code text NOT NULL,  -- 해시된 인증번호
  attempts integer NOT NULL DEFAULT 0,  -- 입력 시도 횟수
  verified boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_sms_verifications_phone ON sms_verifications(phone_number);
CREATE INDEX idx_sms_verifications_expires ON sms_verifications(expires_at);

-- 만료된 인증 자동 삭제 (pg_cron)
SELECT cron.schedule('cleanup-sms-verifications', '0 * * * *', $$
  DELETE FROM sms_verifications WHERE expires_at < now() - interval '1 hour';
$$);
```

### 3.2 profiles 테이블 수정

```sql
-- 마이그레이션: add_phone_verified_to_profiles

ALTER TABLE profiles ADD COLUMN phone_verified boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN phone_verified_at timestamptz;
```

---

## 4. API 설계

### 4.1 인증번호 발송 API

```typescript
// app/api/sms/send-code/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendSMS } from '@/lib/aligo/sms';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { phoneNumber } = await request.json();

  // 전화번호 형식 검증
  const normalizedPhone = normalizePhone(phoneNumber);
  if (!isValidPhoneNumber(normalizedPhone)) {
    return NextResponse.json(
      { error: '올바른 휴대폰 번호를 입력해주세요.' },
      { status: 400 }
    );
  }

  // Rate Limit 확인 (시간당 3회)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const { count } = await supabase
    .from('sms_verifications')
    .select('*', { count: 'exact', head: true })
    .eq('phone_number', normalizedPhone)
    .gte('created_at', oneHourAgo.toISOString());

  if (count && count >= 3) {
    return NextResponse.json(
      { error: '인증 요청이 너무 많아요. 1시간 후에 다시 시도해주세요.' },
      { status: 429 }
    );
  }

  // 4자리 인증번호 생성
  const code = generateVerificationCode();
  const codeHash = hashCode(code);

  // 기존 미인증 코드 삭제
  await supabase
    .from('sms_verifications')
    .delete()
    .eq('user_id', user.id)
    .eq('verified', false);

  // 새 인증 코드 저장
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3분
  const { error: insertError } = await supabase
    .from('sms_verifications')
    .insert({
      user_id: user.id,
      phone_number: normalizedPhone,
      code: codeHash,
      expires_at: expiresAt.toISOString(),
    });

  if (insertError) {
    return NextResponse.json(
      { error: '인증번호 생성에 실패했습니다.' },
      { status: 500 }
    );
  }

  // SMS 발송
  const smsResult = await sendSMS({
    phoneNumber: normalizedPhone,
    message: `[싸인해주세요] 인증번호는 [${code}]입니다. 3분 내에 입력해주세요.`,
  });

  if (!smsResult.success) {
    return NextResponse.json(
      { error: 'SMS 발송에 실패했습니다. 다시 시도해주세요.' },
      { status: 500 }
    );
  }

  // 발송 로그 저장
  await supabase.from('notification_logs').insert({
    user_id: user.id,
    recipient_phone: normalizedPhone,
    type: 'sms',
    template_code: 'VERIFICATION_CODE',
    status: 'sent',
    message_id: smsResult.messageId,
  });

  return NextResponse.json({
    success: true,
    expiresAt: expiresAt.toISOString(),
  });
}

function generateVerificationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function hashCode(code: string): string {
  const salt = process.env.SMS_CODE_SALT || 'signplease-sms-salt';
  return crypto
    .createHmac('sha256', salt)
    .update(code)
    .digest('hex');
}
```

### 4.2 인증번호 검증 API

```typescript
// app/api/sms/verify-code/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { phoneNumber, code } = await request.json();
  const normalizedPhone = normalizePhone(phoneNumber);

  // 최신 미인증 코드 조회
  const { data: verification, error } = await supabase
    .from('sms_verifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('phone_number', normalizedPhone)
    .eq('verified', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!verification || error) {
    return NextResponse.json(
      { error: '인증번호를 먼저 발송해주세요.' },
      { status: 400 }
    );
  }

  // 만료 확인
  if (new Date(verification.expires_at) < new Date()) {
    return NextResponse.json(
      { error: '인증번호가 만료됐어요. 다시 발송해주세요.' },
      { status: 400 }
    );
  }

  // 시도 횟수 확인 (3회 제한)
  if (verification.attempts >= 3) {
    return NextResponse.json(
      { error: '입력 횟수를 초과했어요. 인증번호를 다시 발송해주세요.' },
      { status: 400 }
    );
  }

  // 코드 검증
  const codeHash = hashCode(code);
  if (codeHash !== verification.code) {
    // 시도 횟수 증가
    await supabase
      .from('sms_verifications')
      .update({ attempts: verification.attempts + 1 })
      .eq('id', verification.id);

    const remainingAttempts = 2 - verification.attempts;
    return NextResponse.json(
      { 
        error: remainingAttempts > 0 
          ? `인증번호가 틀렸어요. ${remainingAttempts}번 더 시도할 수 있어요.`
          : '입력 횟수를 초과했어요. 인증번호를 다시 발송해주세요.'
      },
      { status: 400 }
    );
  }

  // 인증 성공 처리
  await supabase
    .from('sms_verifications')
    .update({ verified: true })
    .eq('id', verification.id);

  // 프로필 업데이트
  await supabase
    .from('profiles')
    .update({
      phone: normalizedPhone,
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  return NextResponse.json({ success: true });
}

function hashCode(code: string): string {
  const salt = process.env.SMS_CODE_SALT || 'signplease-sms-salt';
  return crypto
    .createHmac('sha256', salt)
    .update(code)
    .digest('hex');
}
```

---

## 5. 알리고 SMS 클라이언트

```typescript
// lib/aligo/sms.ts

const ALIGO_SMS_URL = 'https://apis.aligo.in/send/';

interface SMSParams {
  phoneNumber: string;
  message: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSMS(params: SMSParams): Promise<SMSResult> {
  const formData = new URLSearchParams({
    key: process.env.ALIGO_API_KEY!,
    user_id: process.env.ALIGO_USER_ID!,
    sender: process.env.SENDER_PHONE_NUMBER!,
    receiver: params.phoneNumber,
    msg: params.message,
    msg_type: 'SMS',  // 단문
  });

  try {
    const response = await fetch(ALIGO_SMS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = await response.json();

    if (result.result_code === '1') {
      return { success: true, messageId: result.msg_id };
    } else {
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: 'SMS 발송 중 오류가 발생했습니다.' };
  }
}
```

---

## 6. 환경 변수 추가

```bash
# .env.local에 추가

# 알리고 (이미 알림톡에서 사용)
ALIGO_API_KEY=xxx
ALIGO_USER_ID=xxx
SENDER_PHONE_NUMBER=010-xxxx-xxxx

# SMS 인증 관련
SMS_CODE_SALT=your-random-salt-string
```

---

## 7. UI 컴포넌트

### 7.1 SMS 인증 페이지

```typescript
// app/(public)/auth/verify-phone/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyPhonePage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // 타이머
  useEffect(() => {
    if (!expiresAt) return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setRemainingTime(remaining);

      if (remaining === 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const handleSendCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sms/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      setExpiresAt(new Date(data.expiresAt));
      setStep('code');
    } catch (err) {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sms/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      // 인증 성공 - 역할 선택으로 이동
      router.push('/select-role');
    } catch (err) {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col p-6">
      <h1 className="text-2xl font-bold mb-2">
        휴대폰 인증이 필요해요
      </h1>
      <p className="text-gray-600 mb-8">
        본인 확인을 위해 휴대폰 번호를 인증해주세요
      </p>

      {step === 'phone' ? (
        <>
          <label className="text-sm font-medium mb-2">휴대폰 번호</label>
          <input
            type="tel"
            placeholder="010-0000-0000"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
            className="w-full p-4 border rounded-xl mb-4"
            maxLength={13}
          />

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <button
            onClick={handleSendCode}
            disabled={phoneNumber.length < 13 || isLoading}
            className="w-full py-4 bg-blue-500 text-white rounded-xl font-medium disabled:opacity-50"
          >
            {isLoading ? '발송 중...' : '인증번호 발송'}
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">인증번호 4자리</label>
            {remainingTime > 0 && (
              <span className="text-blue-500 text-sm">
                {formatTime(remainingTime)}
              </span>
            )}
          </div>

          <input
            type="text"
            inputMode="numeric"
            placeholder="0000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="w-full p-4 border rounded-xl text-center text-2xl tracking-widest mb-4"
            maxLength={4}
          />

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <button
            onClick={handleVerifyCode}
            disabled={code.length < 4 || remainingTime === 0 || isLoading}
            className="w-full py-4 bg-blue-500 text-white rounded-xl font-medium disabled:opacity-50 mb-4"
          >
            {isLoading ? '확인 중...' : '확인'}
          </button>

          <button
            onClick={() => {
              setStep('phone');
              setCode('');
              setError('');
            }}
            className="w-full py-4 text-gray-600"
          >
            인증번호 다시 받기
          </button>
        </>
      )}
    </div>
  );
}

function formatPhoneNumber(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
}
```

---

## 8. 인증 플로우 변경

### 8.1 OAuth 콜백 수정

```typescript
// app/(public)/auth/callback/route.ts

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 프로필 확인
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, phone_verified')
          .eq('id', user.id)
          .single();

        // 휴대폰 인증 안됨 → 인증 페이지로
        if (!profile?.phone_verified) {
          return NextResponse.redirect(`${origin}/auth/verify-phone`);
        }

        // 역할 설정 안됨 → 역할 선택으로
        if (!profile?.role) {
          return NextResponse.redirect(`${origin}/select-role`);
        }

        // 모두 완료 → 대시보드로
        return NextResponse.redirect(`${origin}/${profile.role}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
```

---

## 9. 테스트 체크리스트

### 9.1 기능 테스트
- [ ] 인증번호 발송 정상 동작
- [ ] 3분 타이머 정상 동작
- [ ] 인증번호 검증 성공
- [ ] 잘못된 인증번호 에러 메시지
- [ ] 3회 실패 시 재발송 필요 안내
- [ ] 시간당 3회 재발송 제한
- [ ] 만료된 인증번호 에러 처리

### 9.2 엣지 케이스
- [ ] 잘못된 전화번호 형식
- [ ] 이미 인증된 번호로 재시도
- [ ] 세션 만료 상태에서 인증 시도
- [ ] 알리고 API 장애 시

---

## 10. 보안 고려사항

| 항목 | 조치 |
|------|------|
| 인증번호 저장 | 해시하여 저장 (평문 저장 금지) |
| Rate Limiting | 시간당 3회 제한 |
| Brute Force 방지 | 3회 실패 시 재발송 필요 |
| 만료 처리 | 3분 후 자동 만료 |
| 로그 | 발송 내역 notification_logs에 저장 |

---

## 11. 비용 예상

| 항목 | 단가 | 예상 월 발송량 | 월 비용 |
|------|------|---------------|--------|
| SMS 인증 | 약 18원/건 | 500건 | 9,000원 |
| 재발송 | 약 18원/건 | 100건 (20%) | 1,800원 |
| **총합** | | | **약 11,000원/월** |

---

> **다음 단계**: 카카오 알림톡 구현 완료 후 진행
