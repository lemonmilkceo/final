# 📄 PDF Storage 스펙

> **버전**: 1.0  
> **작성일**: 2026년 1월 25일  
> **상태**: 사업자등록 후 구현 예정  
> **우선순위**: P2 (3순위)

---

## 1. 개요

### 1.1 목적
서명이 완료된 계약서를 PDF로 생성하여 Supabase Storage에 저장하고, 사용자가 언제든지 다운로드할 수 있도록 합니다.

### 1.2 현재 상태
- 현재: PDF 생성 후 클라이언트에 Base64로 반환 (다운로드만 가능)
- 변경: Supabase Storage에 자동 저장 + contracts.pdf_url 업데이트

### 1.3 저장 정책
| 항목 | 설정값 |
|------|--------|
| 저장 시점 | 양측 서명 완료 시 자동 생성/저장 |
| 재생성 시점 | 계약서 수정 후 재서명 시 |
| 보관 기간 | 5년 (근로기준법 기준) |
| 버전 관리 | 최신 PDF로 덮어쓰기 (버전 관리 없음) |

---

## 2. 기술 설계

### 2.1 Storage 버킷 구조

```
contracts-pdf/
├── {employer_id}/
│   ├── {contract_id}.pdf
│   ├── {contract_id}.pdf
│   └── ...
```

### 2.2 파일명 규칙

```
{contract_id}.pdf
```

- 버전 관리 없이 덮어쓰기
- contract_id로 고유하게 식별

---

## 3. API 설계

### 3.1 PDF 생성 및 저장 (양측 서명 완료 시)

```typescript
// lib/pdf/generateAndSave.ts

import { createClient } from '@/lib/supabase/server';
import { generateContractPDF } from './generate';

interface SavePDFResult {
  success: boolean;
  pdfUrl?: string;
  error?: string;
}

export async function generateAndSavePDF(contractId: string): Promise<SavePDFResult> {
  const supabase = await createClient();

  // 계약서 조회 (서명 포함)
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select(`
      *,
      profiles:employer_id(name),
      worker_details:worker_id(
        ssn_encrypted,
        bank_name,
        account_number_encrypted
      ),
      signatures(*)
    `)
    .eq('id', contractId)
    .single();

  if (!contract || contractError) {
    return { success: false, error: '계약서를 찾을 수 없습니다.' };
  }

  // 양측 서명 확인
  const employerSignature = contract.signatures?.find(
    (s: any) => s.signer_role === 'employer'
  );
  const workerSignature = contract.signatures?.find(
    (s: any) => s.signer_role === 'worker'
  );

  if (!employerSignature || !workerSignature) {
    return { success: false, error: '양측 서명이 완료되지 않았습니다.' };
  }

  // PDF 생성
  const pdfBuffer = await generateContractPDF({
    contract,
    employerSignature: employerSignature.signature_data,
    workerSignature: workerSignature.signature_data,
  });

  // Storage에 업로드
  const filePath = `${contract.employer_id}/${contractId}.pdf`;
  
  const { error: uploadError } = await supabase.storage
    .from('contracts-pdf')
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,  // 기존 파일 덮어쓰기
    });

  if (uploadError) {
    console.error('PDF upload error:', uploadError);
    return { success: false, error: 'PDF 저장에 실패했습니다.' };
  }

  // Signed URL 생성 (5년 유효)
  const { data: signedUrl } = await supabase.storage
    .from('contracts-pdf')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 5);  // 5년

  // contracts 테이블 업데이트
  await supabase
    .from('contracts')
    .update({ pdf_url: filePath })
    .eq('id', contractId);

  return { success: true, pdfUrl: signedUrl?.signedUrl };
}
```

### 3.2 서명 완료 액션 수정

```typescript
// app/contract/sign/[token]/actions.ts

export async function signAsWorker(
  token: string, 
  signatureImageData: string
): Promise<ActionResult<{ pdfUrl?: string }>> {
  const supabase = await createClient();

  // ... 기존 서명 저장 로직 ...

  // 양측 서명 완료 확인
  const { data: signatures } = await supabase
    .from('signatures')
    .select('signer_role')
    .eq('contract_id', contract.id);

  const hasEmployerSignature = signatures?.some(s => s.signer_role === 'employer');
  const hasWorkerSignature = signatures?.some(s => s.signer_role === 'worker');

  if (hasEmployerSignature && hasWorkerSignature) {
    // 계약 완료 처리
    await supabase
      .from('contracts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', contract.id);

    // PDF 생성 및 저장
    const pdfResult = await generateAndSavePDF(contract.id);

    if (!pdfResult.success) {
      // PDF 저장 실패해도 계약 완료는 유지
      // 로그만 남기고 에러 무시
      console.error('PDF save failed:', pdfResult.error);
    }

    // 사업자에게 알림
    await createNotification(contract.employer_id, {
      type: 'contract_signed',
      title: '서명이 완료됐어요!',
      body: `${contract.worker_name}님이 계약서에 서명했어요.`,
      data: { contract_id: contract.id },
    });

    return { 
      success: true, 
      data: { pdfUrl: pdfResult.pdfUrl } 
    };
  }

  return { success: true, data: {} };
}
```

### 3.3 PDF 다운로드 API

```typescript
// app/api/pdf/download/[contractId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { contractId: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 계약서 조회 및 권한 확인
  const { data: contract, error } = await supabase
    .from('contracts')
    .select('pdf_url, employer_id, worker_id')
    .eq('id', params.contractId)
    .single();

  if (!contract || error) {
    return NextResponse.json({ error: '계약서를 찾을 수 없습니다.' }, { status: 404 });
  }

  // 권한 확인 (사업자 또는 근로자만 접근 가능)
  if (contract.employer_id !== user.id && contract.worker_id !== user.id) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  // PDF URL 없음
  if (!contract.pdf_url) {
    return NextResponse.json({ error: 'PDF가 아직 생성되지 않았습니다.' }, { status: 404 });
  }

  // Signed URL 생성 (1시간 유효)
  const { data: signedUrl, error: signError } = await supabase.storage
    .from('contracts-pdf')
    .createSignedUrl(contract.pdf_url, 60 * 60);

  if (signError || !signedUrl) {
    return NextResponse.json({ error: 'PDF URL 생성에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ url: signedUrl.signedUrl });
}
```

---

## 4. 데이터베이스 변경

### 4.1 Storage 버킷 생성

```sql
-- Supabase Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts-pdf', 'contracts-pdf', false);
```

### 4.2 Storage RLS 정책

```sql
-- 버킷 RLS 활성화
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 업로드 정책 (서버에서만)
CREATE POLICY "contracts_pdf_insert" ON storage.objects
  FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'contracts-pdf');

-- 조회 정책 (계약 당사자만)
CREATE POLICY "contracts_pdf_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'contracts-pdf'
    AND EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.pdf_url = name
      AND (c.employer_id = (SELECT auth.uid()) OR c.worker_id = (SELECT auth.uid()))
    )
  );
```

---

## 5. PDF 생성 개선

### 5.1 서명 로그 정보 추가

현재 PDF에 서명 로그 정보(타임스탬프, IP, User Agent 등)를 추가합니다.

```typescript
// lib/pdf/generate.ts

interface GeneratePDFParams {
  contract: Contract;
  employerSignature: string;
  workerSignature: string;
  signatureLogs?: {
    employer: SignatureLog;
    worker: SignatureLog;
  };
}

interface SignatureLog {
  signedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceInfo?: string;
  location?: string;
  authMethod?: string;
}

export async function generateContractPDF(params: GeneratePDFParams): Promise<Buffer> {
  // ... 기존 PDF 생성 로직 ...

  // 서명 정보 섹션 추가
  if (params.signatureLogs) {
    doc.addPage();
    doc.fontSize(12).text('서명 정보', { underline: true });
    
    doc.fontSize(10);
    
    // 사업자 서명 정보
    doc.text('■ 사업자 서명');
    doc.text(`  서명 일시: ${formatDateTime(params.signatureLogs.employer.signedAt)}`);
    doc.text(`  IP 주소: ${params.signatureLogs.employer.ipAddress || '기록 없음'}`);
    doc.text(`  기기 정보: ${params.signatureLogs.employer.deviceInfo || '기록 없음'}`);
    doc.text(`  인증 방법: ${params.signatureLogs.employer.authMethod || '카카오 로그인'}`);
    
    doc.moveDown();
    
    // 근로자 서명 정보
    doc.text('■ 근로자 서명');
    doc.text(`  서명 일시: ${formatDateTime(params.signatureLogs.worker.signedAt)}`);
    doc.text(`  IP 주소: ${params.signatureLogs.worker.ipAddress || '기록 없음'}`);
    doc.text(`  기기 정보: ${params.signatureLogs.worker.deviceInfo || '기록 없음'}`);
    doc.text(`  인증 방법: ${params.signatureLogs.worker.authMethod || '카카오 로그인'}`);
  }

  return pdfBuffer;
}
```

### 5.2 signatures 테이블 확장

```sql
-- 마이그레이션: add_signature_audit_fields

ALTER TABLE signatures ADD COLUMN device_info text;
ALTER TABLE signatures ADD COLUMN location text;
ALTER TABLE signatures ADD COLUMN auth_method text DEFAULT 'kakao';

COMMENT ON COLUMN signatures.device_info IS '기기 정보 (OS, 브라우저 버전)';
COMMENT ON COLUMN signatures.location IS 'IP 기반 대략적 위치';
COMMENT ON COLUMN signatures.auth_method IS '인증 방법 (kakao, sms 등)';
```

---

## 6. UI 컴포넌트

### 6.1 PDF 다운로드 버튼

```typescript
// components/contract/PDFDownloadButton.tsx

'use client';

import { useState } from 'react';

interface PDFDownloadButtonProps {
  contractId: string;
  workerName: string;
  disabled?: boolean;
}

export function PDFDownloadButton({ 
  contractId, 
  workerName,
  disabled = false 
}: PDFDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/pdf/download/${contractId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      // 새 탭에서 PDF 열기 (미리보기)
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('PDF download error:', error);
      // 에러 토스트 표시
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || isLoading}
      className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
    >
      <span className="text-xl">📄</span>
      <span className="font-medium">
        {isLoading ? 'PDF 불러오는 중...' : 'PDF 다운로드'}
      </span>
    </button>
  );
}
```

### 6.2 계약서 상세 페이지에 버튼 추가

```typescript
// 계약서 상세 페이지에서 사용

{contract.status === 'completed' && (
  <PDFDownloadButton 
    contractId={contract.id}
    workerName={contract.worker_name}
  />
)}

{contract.status !== 'completed' && (
  <p className="text-sm text-gray-500">
    양측 서명이 완료되면 PDF를 다운로드할 수 있어요.
  </p>
)}
```

---

## 7. 5년 보관 정책

### 7.1 자동 삭제 스케줄러

```sql
-- pg_cron으로 5년 이상 된 PDF 삭제
SELECT cron.schedule(
  'delete-old-pdfs',
  '0 3 * * *',  -- 매일 새벽 3시
  $$
    -- 5년 이상 된 완료 계약서 조회
    WITH old_contracts AS (
      SELECT id, pdf_url
      FROM contracts
      WHERE status = 'completed'
      AND completed_at < now() - interval '5 years'
      AND pdf_url IS NOT NULL
    )
    -- PDF URL 목록 반환 (실제 삭제는 Edge Function에서 처리)
    SELECT * FROM old_contracts;
  $$
);
```

### 7.2 Edge Function으로 Storage 파일 삭제

```typescript
// supabase/functions/delete-old-pdfs/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 5년 이상 된 계약서 조회
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const { data: oldContracts } = await supabase
    .from('contracts')
    .select('id, pdf_url')
    .eq('status', 'completed')
    .lt('completed_at', fiveYearsAgo.toISOString())
    .not('pdf_url', 'is', null);

  if (!oldContracts?.length) {
    return new Response(JSON.stringify({ deleted: 0 }));
  }

  let deletedCount = 0;

  for (const contract of oldContracts) {
    // Storage에서 PDF 삭제
    const { error: storageError } = await supabase.storage
      .from('contracts-pdf')
      .remove([contract.pdf_url]);

    if (!storageError) {
      // DB에서 pdf_url 제거
      await supabase
        .from('contracts')
        .update({ pdf_url: null })
        .eq('id', contract.id);

      deletedCount++;
    }
  }

  return new Response(JSON.stringify({ deleted: deletedCount }));
});
```

---

## 8. 테스트 체크리스트

### 8.1 기능 테스트
- [ ] 양측 서명 완료 시 PDF 자동 생성
- [ ] Storage에 PDF 정상 업로드
- [ ] contracts.pdf_url 업데이트
- [ ] PDF 다운로드 정상 동작
- [ ] 권한 없는 사용자 접근 차단
- [ ] 서명 로그 정보 PDF에 포함

### 8.2 엣지 케이스
- [ ] 대용량 서명 이미지 처리
- [ ] PDF 생성 실패 시 에러 처리
- [ ] Storage 업로드 실패 시 재시도
- [ ] 동시 서명 시 경쟁 상태

---

## 9. 비용 예상

### 9.1 Storage 비용 (Supabase)

| 항목 | 예상값 |
|------|--------|
| PDF 평균 크기 | 약 500KB |
| 월 생성 계약서 | 1,000건 |
| 월 Storage 증가 | 약 500MB |
| 5년 누적 | 약 30GB |

Supabase Pro 플랜: 8GB 기본 포함, 초과 시 $0.021/GB/월

### 9.2 예상 월 비용

| 1년 후 | 3년 후 | 5년 후 |
|--------|--------|--------|
| 6GB (무료) | 18GB ($0.21) | 30GB ($0.46) |

---

> **다음 단계**: 알림톡, SMS 인증 구현 후 진행
