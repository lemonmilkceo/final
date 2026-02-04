'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendAlimtalkWithSDK } from '@/lib/solapi/client';
import { buildContractSignRequestVariables } from '@/lib/solapi/templates';
import { normalizePhoneNumber, isValidMobilePhone } from '@/lib/utils/phone';

const MAX_RESEND_COUNT = 3;

export async function deleteContract(contractId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  // 계약서 조회 및 권한 확인
  const { data: contract, error: fetchError } = await supabase
    .from('contracts')
    .select('id, employer_id, status')
    .eq('id', contractId)
    .single();

  if (fetchError || !contract) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  if (contract.employer_id !== user.id) {
    return { success: false, error: '삭제 권한이 없어요' };
  }

  // 이미 삭제된 계약서인지 확인
  if (contract.status === 'deleted') {
    return { success: false, error: '이미 삭제된 계약서예요' };
  }

  // 상태 업데이트 (soft delete)
  const { error: updateError } = await supabase
    .from('contracts')
    .update({
      status: 'deleted',
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId);

  if (updateError) {
    console.error('Contract delete error:', updateError);
    return { success: false, error: '삭제에 실패했어요' };
  }

  revalidatePath('/employer');
  revalidatePath(`/employer/contract/${contractId}`);

  return { success: true };
}

export async function resendContract(contractId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  // 계약서 조회 및 권한 확인
  const { data: contract, error: fetchError } = await supabase
    .from('contracts')
    .select('id, employer_id, status, expires_at')
    .eq('id', contractId)
    .single();

  if (fetchError || !contract) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  if (contract.employer_id !== user.id) {
    return { success: false, error: '재전송 권한이 없어요' };
  }

  // 완료/삭제된 계약서는 재전송 불가
  if (contract.status === 'completed' || contract.status === 'deleted') {
    return { success: false, error: '재전송할 수 없는 상태예요' };
  }

  // 만료일 연장 (7일 추가)
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 7);

  const { error: updateError } = await supabase
    .from('contracts')
    .update({
      expires_at: newExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId);

  if (updateError) {
    console.error('Contract resend error:', updateError);
    return { success: false, error: '재전송에 실패했어요' };
  }

  revalidatePath(`/employer/contract/${contractId}`);

  return { success: true };
}

/**
 * 알림톡 재전송
 */
export async function resendAlimtalk(contractId: string): Promise<{
  success: boolean;
  error?: string;
  data?: {
    alimtalkSent: boolean;
    resendCount: number;
    maxResendCount: number;
    workerPhone: string | null;
    workerName: string;
  };
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  // 계약서 조회
  const { data: contract, error: fetchError } = await supabase
    .from('contracts')
    .select('id, employer_id, status, share_token, worker_name, worker_phone, workplace_name')
    .eq('id', contractId)
    .single();

  if (fetchError || !contract) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  if (contract.employer_id !== user.id) {
    return { success: false, error: '권한이 없어요' };
  }

  // 완료/삭제된 계약서는 알림톡 불가
  if (contract.status === 'completed' || contract.status === 'deleted') {
    return { success: false, error: '알림톡을 보낼 수 없는 상태예요' };
  }

  const workerPhone = contract.worker_phone;
  const workerName = contract.worker_name;

  // 전화번호 유효성 검사
  if (!workerPhone || !isValidMobilePhone(workerPhone)) {
    return {
      success: true,
      data: {
        alimtalkSent: false,
        resendCount: 0,
        maxResendCount: MAX_RESEND_COUNT,
        workerPhone: null,
        workerName,
      },
    };
  }

  // 재전송 횟수 확인
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
        alimtalkSent: false,
        resendCount: currentCount,
        maxResendCount: MAX_RESEND_COUNT,
        workerPhone,
        workerName,
      },
    };
  }

  // 공유 URL 생성
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/s/${contract.share_token}`;

  // 알림톡 발송
  const templateData = buildContractSignRequestVariables({
    workerName: contract.worker_name,
    workplaceName: contract.workplace_name || '사업장',
    shareUrl,
  });

  const alimtalkResult = await sendAlimtalkWithSDK({
    receiver: normalizePhoneNumber(workerPhone),
    templateId: templateData.templateId,
    variables: templateData.variables,
    pfId: process.env.SOLAPI_KAKAO_PF_ID || '',
  });

  // 발송 이력 저장
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

  // 만료일도 연장 (7일)
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 7);

  await supabase
    .from('contracts')
    .update({
      expires_at: newExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId);

  revalidatePath(`/employer/contract/${contractId}`);

  return {
    success: true,
    data: {
      alimtalkSent: alimtalkResult.success,
      resendCount: currentCount + (alimtalkResult.success ? 1 : 0),
      maxResendCount: MAX_RESEND_COUNT,
      workerPhone,
      workerName,
    },
  };
}

/**
 * 알림톡 발송 횟수 조회
 */
export async function getAlimtalkStatus(contractId: string): Promise<{
  success: boolean;
  error?: string;
  data?: {
    resendCount: number;
    maxResendCount: number;
    workerPhone: string | null;
    workerName: string;
    lastSentAt: string | null;
  };
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  // 계약서 조회
  const { data: contract, error: fetchError } = await supabase
    .from('contracts')
    .select('id, employer_id, worker_name, worker_phone')
    .eq('id', contractId)
    .single();

  if (fetchError || !contract) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  if (contract.employer_id !== user.id) {
    return { success: false, error: '권한이 없어요' };
  }

  // 발송 횟수 조회
  const { count: resendCount } = await supabase
    .from('notification_logs')
    .select('*', { count: 'exact', head: true })
    .eq('contract_id', contractId)
    .eq('type', 'alimtalk')
    .eq('status', 'sent');

  // 마지막 발송 시간 조회
  const { data: lastLog } = await supabase
    .from('notification_logs')
    .select('created_at')
    .eq('contract_id', contractId)
    .eq('type', 'alimtalk')
    .eq('status', 'sent')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return {
    success: true,
    data: {
      resendCount: resendCount || 0,
      maxResendCount: MAX_RESEND_COUNT,
      workerPhone: contract.worker_phone,
      workerName: contract.worker_name,
      lastSentAt: lastLog?.created_at || null,
    },
  };
}
