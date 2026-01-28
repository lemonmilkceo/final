# 🔔 Notifications 스펙

> **버전**: 1.0  
> **작성일**: 2026년 1월 27일  
> **상태**: 구현 완료 (Phase 1), Edge Function 배포 필요 (Phase 2)

---

## 1. 개요

### 1.1 목적
사용자에게 계약서 관련 중요 이벤트를 실시간으로 알려줍니다.

### 1.2 알림 타입

| 타입 | 설명 | 아이콘 |
|------|------|--------|
| `contract_sent` | 계약서 전송됨 | 📩 |
| `contract_signed` | 계약서 서명됨 | ✍️ |
| `contract_expired_soon` | 계약서 만료 임박 (D-1) | ⏰ |
| `contract_expired` | 계약서 만료됨 | ❌ |

---

## 2. 알림 시나리오

### 2.1 사업자(Employer)가 받는 알림

| 이벤트 | 알림 타입 | 제목 | 본문 | 트리거 |
|--------|----------|------|------|--------|
| 근로자 서명 완료 | `contract_signed` | 계약 완료! 🎉 | {근로자명}님이 계약서에 서명했어요 | 즉시 |
| 만료 임박 | `contract_expired_soon` | 서명을 기다리고 있어요 ⏰ | {근로자명}님의 계약서가 내일 만료돼요 | 배치 (D-1) |
| 만료됨 | `contract_expired` | 계약서가 만료됐어요 | {근로자명}님의 계약서가 만료됐어요 | 배치 |

### 2.2 근로자(Worker)가 받는 알림

| 이벤트 | 알림 타입 | 제목 | 본문 | 트리거 |
|--------|----------|------|------|--------|
| 만료 임박 | `contract_expired_soon` | 서명이 필요해요 ⏰ | 내일까지 서명하지 않으면 계약서가 만료돼요 | 배치 (D-1) |
| 만료됨 | `contract_expired` | 계약서가 만료됐어요 | {사업장명} 계약서가 만료됐어요 | 배치 |

---

## 3. 구현 현황

### 3.1 Phase 1: 실시간 알림 (✅ 완료)

#### 근로자 서명 완료 시 사업자 알림

**파일**: 
- `app/(protected)/worker/contract/[id]/actions.ts` - 로그인 사용자 서명
- `app/contract/sign/[token]/actions.ts` - 링크 서명

**로직**:
```typescript
// 서명 완료 후
await createNotification({
  userId: contract.employer_id,
  type: 'contract_signed',
  title: '계약 완료! 🎉',
  body: `${contract.worker_name}님이 계약서에 서명했어요`,
  data: { contractId: contract.id },
});
```

#### 알림 클릭 시 계약서 이동

**파일**: `components/notification/NotificationSheet.tsx`

**로직**:
```typescript
// 알림 클릭 시
if (notification.data?.contractId) {
  const contractPath = userRole === 'employer' 
    ? `/employer/contract/${notification.data.contractId}`
    : `/worker/contract/${notification.data.contractId}`;
  router.push(contractPath);
}
```

### 3.2 Phase 2: 배치 알림 (Edge Function)

#### check-expiring-contracts

**경로**: `supabase/functions/check-expiring-contracts/index.ts`

**기능**: 내일 만료되는 계약서 조회 → 사업자/근로자에게 알림 생성

**Cron 설정**: 매일 오전 9시 KST (Supabase Dashboard에서 설정 필요)

```
0 0 * * *  (UTC 00:00 = KST 09:00)
```

#### expire-contracts

**경로**: `supabase/functions/expire-contracts/index.ts`

**기능**: 
1. 만료된 계약서 조회
2. status를 'expired'로 업데이트
3. 사업자/근로자에게 알림 생성

**Cron 설정**: 매일 자정 KST (Supabase Dashboard에서 설정 필요)

```
0 15 * * *  (UTC 15:00 = KST 00:00)
```

---

## 4. Edge Function 배포 가이드

### 4.1 Supabase CLI 설치

```bash
npm install -g supabase
supabase login
```

### 4.2 프로젝트 연결

```bash
cd signplease
supabase link --project-ref YOUR_PROJECT_REF
```

### 4.3 Edge Function 배포

```bash
# 만료 임박 알림 함수
supabase functions deploy check-expiring-contracts

# 만료 처리 함수
supabase functions deploy expire-contracts
```

### 4.4 Cron 스케줄 설정

Supabase Dashboard > Edge Functions > 해당 함수 선택 > Schedule 탭에서 설정:

| 함수 | Cron Expression | 설명 |
|------|-----------------|------|
| check-expiring-contracts | `0 0 * * *` | 매일 UTC 00:00 (KST 09:00) |
| expire-contracts | `0 15 * * *` | 매일 UTC 15:00 (KST 00:00) |

---

## 5. 데이터베이스 스키마

### notifications 테이블

```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,  -- { contractId: string, ... }
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE notification_type AS ENUM (
  'contract_sent',
  'contract_signed', 
  'contract_expired_soon',
  'contract_expired'
);
```

---

## 6. API 함수

### 6.1 알림 조회

```typescript
getNotifications(): Promise<{ success: boolean; data: Notification[] }>
```

### 6.2 읽지 않은 알림 수

```typescript
getUnreadNotificationCount(): Promise<number>
```

### 6.3 읽음 처리

```typescript
markNotificationAsRead(notificationId: string): Promise<{ success: boolean }>
markAllNotificationsAsRead(): Promise<{ success: boolean }>
```

### 6.4 알림 생성

```typescript
createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: { contractId?: string };
}): Promise<{ success: boolean }>
```

---

## 7. UI 컴포넌트

### NotificationSheet

**경로**: `components/notification/NotificationSheet.tsx`

**Props**:
```typescript
interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onNotificationsUpdate?: () => void;
  userRole?: 'employer' | 'worker';
}
```

**기능**:
- 알림 목록 표시
- 읽음/안읽음 상태 표시
- 모두 읽음 처리
- 알림 클릭 시 해당 계약서로 이동

---

## 8. 향후 개선 사항

- [ ] 푸시 알림 (FCM/APNs)
- [ ] 카카오 알림톡 연동
- [ ] 이메일 알림
- [ ] 알림 설정 (알림 종류별 on/off)
