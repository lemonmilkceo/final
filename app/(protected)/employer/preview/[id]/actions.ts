'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types';
import { sendAlimtalkWithSDK } from '@/lib/solapi/client';
import { buildContractSignRequestVariables } from '@/lib/solapi/templates';
import { normalizePhoneNumber, isValidMobilePhone } from '@/lib/utils/phone';

// 재전송 제한 횟수
const MAX_RESEND_COUNT = 3;

export async function signContract(
  contractId: string,
  signatureImageData: string
): Promise<ActionResult> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  // 서명 시점 증적을 위한 IP, User-Agent 수집
  const headersList = await headers();
  const ipAddress =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    null;
  const userAgent = headersList.get('user-agent') || null;

  // 계약서 조회 및 권한 확인
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('id, employer_id, status')
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  if (contract.employer_id !== user.id) {
    return { success: false, error: '권한이 없어요' };
  }

  // 이미 서명했는지 확인
  const { data: existingSignature } = await supabase
    .from('signatures')
    .select('id')
    .eq('contract_id', contractId)
    .eq('signer_role', 'employer')
    .single();

  if (existingSignature) {
    return { success: false, error: '이미 서명하셨어요' };
  }

  // 서명 레코드 생성 (Base64 Data URL 직접 저장 + 증적 정보)
  const { error: signatureError } = await supabase.from('signatures').insert({
    contract_id: contractId,
    user_id: user.id,
    signer_role: 'employer',
    signature_data: signatureImageData,
    signed_at: new Date().toISOString(),
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  if (signatureError) {
    console.error('Signature insert error:', signatureError);
    return { success: false, error: '서명 저장에 실패했어요' };
  }

  // 계약서 상태 업데이트 (draft → pending)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료

  const { error: updateError } = await supabase
    .from('contracts')
    .update({
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId);

  if (updateError) {
    console.error('Contract update error:', updateError);
    return { success: false, error: '계약서 상태 업데이트에 실패했어요' };
  }

  // 캐시 무효화
  revalidatePath(`/employer/preview/${contractId}`);
  revalidatePath('/employer');

  return { success: true };
}

export async function sendContract(
  contractId: string
): Promise<ActionResult<{ shareUrl: string }>> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  // 계약서 조회
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('id, employer_id, status, share_token')
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  if (contract.employer_id !== user.id) {
    return { success: false, error: '권한이 없어요' };
  }

  if (contract.status !== 'pending') {
    return { success: false, error: '먼저 서명을 완료해주세요' };
  }

  // 이미 공유 토큰이 있으면 반환 (단축 URL 사용)
  if (contract.share_token) {
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/s/${contract.share_token}`;
    return { success: true, data: { shareUrl } };
  }

  // 새 공유 토큰 생성
  const shareToken = crypto.randomUUID().replace(/-/g, '').slice(0, 16);

  const { error: updateError } = await supabase
    .from('contracts')
    .update({
      share_token: shareToken,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId);

  if (updateError) {
    console.error('Share token update error:', updateError);
    return { success: false, error: '공유 링크 생성에 실패했어요' };
  }

  // 단축 URL 사용 - 카카오톡에서 하이퍼링크 인식 문제 해결
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/s/${shareToken}`;

  // 캐시 무효화
  revalidatePath(`/employer/preview/${contractId}`);

  return { success: true, data: { shareUrl } };
}

/**
 * 알림톡으로 계약서 전송
 */
export async function sendContractWithAlimtalk(contractId: string): Promise<
  ActionResult<{
    shareUrl: string;
    alimtalkSent: boolean;
    resendCount: number;
    maxResendCount: number;
    workerPhone: string | null;
    workerName: string;
  }>
> {
  const supabase = await createClient();

  // 1. 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  // 2. 계약서 조회 (근로자 정보 포함)
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select(
      'id, employer_id, status, share_token, worker_name, worker_phone, workplace_name'
    )
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  if (contract.employer_id !== user.id) {
    return { success: false, error: '권한이 없어요' };
  }

  if (contract.status !== 'pending') {
    return { success: false, error: '먼저 서명을 완료해주세요' };
  }

  // 3. 공유 URL 생성 (없으면 새로 생성)
  let shareToken = contract.share_token;

  if (!shareToken) {
    shareToken = crypto.randomUUID().replace(/-/g, '').slice(0, 16);

    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        share_token: shareToken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('Share token update error:', updateError);
      return { success: false, error: '공유 링크 생성에 실패했어요' };
    }
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/s/${shareToken}`;

  // 4. 근로자 전화번호 확인
  const workerPhone = contract.worker_phone;

  if (!workerPhone || !isValidMobilePhone(workerPhone)) {
    // 전화번호가 없으면 알림톡 없이 URL만 반환 (링크 복사 유도)
    revalidatePath(`/employer/preview/${contractId}`);
    return {
      success: true,
      data: {
        shareUrl,
        alimtalkSent: false,
        resendCount: 0,
        maxResendCount: MAX_RESEND_COUNT,
        workerPhone: null,
        workerName: contract.worker_name,
      },
    };
  }

  // 5. 재전송 횟수 확인
  const { count: resendCount } = await supabase
    .from('notification_logs')
    .select('*', { count: 'exact', head: true })
    .eq('contract_id', contractId)
    .eq('type', 'alimtalk')
    .eq('status', 'sent');

  const currentCount = resendCount || 0;

  if (currentCount >= MAX_RESEND_COUNT) {
    return {
      success: true,
      data: {
        shareUrl,
        alimtalkSent: false,
        resendCount: currentCount,
        maxResendCount: MAX_RESEND_COUNT,
        workerPhone,
        workerName: contract.worker_name,
      },
    };
  }

  // 6. 알림톡 템플릿 변수 생성
  const templateData = buildContractSignRequestVariables({
    workerName: contract.worker_name,
    workplaceName: contract.workplace_name || '사업장',
    shareUrl,
  });

  // 7. Solapi로 알림톡 발송
  const alimtalkResult = await sendAlimtalkWithSDK({
    receiver: normalizePhoneNumber(workerPhone),
    templateId: templateData.templateId,
    variables: templateData.variables,
    pfId: process.env.SOLAPI_KAKAO_PF_ID || '',
  });

  // 8. 발송 이력 저장
  await supabase.from('notification_logs').insert({
    user_id: user.id,
    contract_id: contractId,
    recipient_phone: normalizePhoneNumber(workerPhone),
    type: 'alimtalk',
    template_code: templateData.templateId,
    status: alimtalkResult.success ? 'sent' : 'failed',
    message_id: alimtalkResult.messageId || null,
    error: alimtalkResult.error || null,
  });

  // 캐시 무효화
  revalidatePath(`/employer/preview/${contractId}`);

  return {
    success: true,
    data: {
      shareUrl,
      alimtalkSent: alimtalkResult.success,
      resendCount: currentCount + (alimtalkResult.success ? 1 : 0),
      maxResendCount: MAX_RESEND_COUNT,
      workerPhone,
      workerName: contract.worker_name,
    },
  };
}

/**
 * 알림톡 재전송 횟수 조회
 */
export async function getAlimtalkResendCount(
  contractId: string
): Promise<ActionResult<{ resendCount: number; maxResendCount: number }>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  const { count } = await supabase
    .from('notification_logs')
    .select('*', { count: 'exact', head: true })
    .eq('contract_id', contractId)
    .eq('type', 'alimtalk')
    .eq('status', 'sent');

  return {
    success: true,
    data: {
      resendCount: count || 0,
      maxResendCount: MAX_RESEND_COUNT,
    },
  };
}
