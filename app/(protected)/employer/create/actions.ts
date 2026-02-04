'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  contractFormSchema,
  transformFormToDbSchema,
  type ContractFormInput,
} from '@/lib/utils/validation';
import type { ActionResult } from '@/types';
import { sendAlimtalkWithSDK } from '@/lib/solapi/client';
import { buildContractSignRequestVariables } from '@/lib/solapi/templates';
import { normalizePhoneNumber, isValidMobilePhone } from '@/lib/utils/phone';

export async function createContract(
  formData: ContractFormInput,
  signatureData?: string | null
): Promise<ActionResult<{ contractId: string; shareUrl?: string }>> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  // 역할 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'employer') {
    return { success: false, error: '사장님만 계약서를 작성할 수 있어요' };
  }

  // 유효성 검사
  const validation = contractFormSchema.safeParse(formData);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return {
      success: false,
      error: firstError?.message || '입력 내용을 확인해주세요',
    };
  }

  // 크레딧 확인 및 차감
  const { data: creditResult, error: creditError } = await supabase.rpc(
    'use_credit',
    {
      p_user_id: user.id,
      p_amount: 1,
      p_credit_type: 'contract',
      p_description: '계약서 작성',
    }
  );

  if (creditError || !creditResult) {
    return {
      success: false,
      error: '크레딧이 부족해요. 충전 후 다시 시도해주세요',
    };
  }

  // DB 스키마로 변환
  const contractData = transformFormToDbSchema(validation.data);

  // 계약서 생성 - 서명이 있으면 바로 pending 상태로
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료

  const { data: contract, error: insertError } = await supabase
    .from('contracts')
    .insert({
      employer_id: user.id,
      ...contractData,
      status: signatureData ? 'pending' : 'draft',
      expires_at: signatureData ? expiresAt.toISOString() : null,
    })
    .select('id')
    .single();

  if (insertError || !contract) {
    console.error('Contract insert error:', insertError);
    return { success: false, error: '계약서 저장에 실패했어요' };
  }

  // 서명 데이터가 있으면 서명도 함께 저장하고 공유 토큰 생성
  let shareUrl: string | undefined;

  if (signatureData) {
    // 서명 시점 증적을 위한 IP, User-Agent 수집
    const headersList = await headers();
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      null;
    const userAgent = headersList.get('user-agent') || null;

    const { error: signatureError } = await supabase.from('signatures').insert({
      contract_id: contract.id,
      user_id: user.id,
      signer_role: 'employer',
      signature_data: signatureData,
      signed_at: new Date().toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (signatureError) {
      console.error('Signature insert error:', signatureError);
      // 서명 저장 실패해도 계약서는 이미 저장됨 - 에러 반환하지 않고 경고만
    }

    // 서명이 있으면 바로 공유 토큰 생성
    const shareToken = crypto.randomUUID().replace(/-/g, '').slice(0, 16);

    const { error: tokenError } = await supabase
      .from('contracts')
      .update({ share_token: shareToken })
      .eq('id', contract.id);

    if (!tokenError) {
      // 단축 URL 사용 - 카카오톡에서 하이퍼링크 인식 문제 해결
      shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/s/${shareToken}`;

      // 알림톡 발송 (전화번호가 있는 경우)
      const workerPhone = validation.data.workerPhone;
      if (workerPhone && isValidMobilePhone(workerPhone)) {
        try {
          // 사업장명 가져오기
          const workplaceName = validation.data.workplaceName || '사업장';

          // 알림톡 템플릿 변수 생성
          const templateData = buildContractSignRequestVariables({
            workerName: validation.data.workerName,
            workplaceName,
            shareUrl,
          });

          // Solapi로 알림톡 발송
          const alimtalkResult = await sendAlimtalkWithSDK({
            receiver: normalizePhoneNumber(workerPhone),
            templateId: templateData.templateId,
            variables: templateData.variables,
            pfId: process.env.SOLAPI_KAKAO_PF_ID || '',
          });

          // 발송 이력 저장
          await supabase.from('notification_logs').insert({
            user_id: user.id,
            contract_id: contract.id,
            recipient_phone: normalizePhoneNumber(workerPhone),
            type: 'alimtalk',
            template_code: templateData.templateId,
            status: alimtalkResult.success ? 'sent' : 'failed',
            message_id: alimtalkResult.messageId || null,
            error: alimtalkResult.error || null,
          });

          console.log('[CreateContract] 알림톡 발송 결과:', alimtalkResult);
        } catch (error) {
          console.error('[CreateContract] 알림톡 발송 오류:', error);
          // 알림톡 실패해도 계약서 생성은 성공으로 처리
        }
      }
    }
  }

  // 캐시 무효화
  revalidatePath('/employer');

  return { success: true, data: { contractId: contract.id, shareUrl } };
}

export async function saveContractDraft(
  formData: ContractFormInput
): Promise<ActionResult<{ contractId: string }>> {
  // 임시 저장용 - 크레딧 차감 없이 저장
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  // 유효성 검사 (부분 저장 허용)
  const contractData = transformFormToDbSchema(formData as ContractFormInput);

  const { data: contract, error: insertError } = await supabase
    .from('contracts')
    .insert({
      employer_id: user.id,
      ...contractData,
      status: 'draft',
    })
    .select('id')
    .single();

  if (insertError || !contract) {
    console.error('Draft save error:', insertError);
    return { success: false, error: '임시 저장에 실패했어요' };
  }

  return { success: true, data: { contractId: contract.id } };
}

/**
 * 계약서 수정 (completed 상태도 7일 이내면 수정 가능)
 * - 기존 서명 삭제
 * - 계약서 내용 업데이트
 * - 새로운 사장 서명 저장
 * - 상태를 pending으로 변경
 * - 크레딧 차감 없음 (이미 차감됨)
 */
export async function updateContract(
  contractId: string,
  formData: ContractFormInput,
  signatureData: string
): Promise<ActionResult<{ contractId: string; shareUrl?: string; alimtalkSent?: boolean }>> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  // 기존 계약서 조회 및 권한 확인
  const { data: existingContract, error: fetchError } = await supabase
    .from('contracts')
    .select('id, employer_id, worker_id, worker_name, worker_phone, workplace_name, status, completed_at')
    .eq('id', contractId)
    .single();

  if (fetchError || !existingContract) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  // 권한 확인
  if (existingContract.employer_id !== user.id) {
    return { success: false, error: '수정 권한이 없어요' };
  }

  // 수정 가능 여부 확인
  const canEdit = checkEditableStatus(
    existingContract.status,
    existingContract.completed_at
  );
  if (!canEdit.editable) {
    return {
      success: false,
      error: canEdit.reason || '수정할 수 없는 계약서예요',
    };
  }

  // 유효성 검사
  const validation = contractFormSchema.safeParse(formData);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return {
      success: false,
      error: firstError?.message || '입력 내용을 확인해주세요',
    };
  }

  // 1. 기존 서명 삭제
  const { error: deleteSignatureError } = await supabase
    .from('signatures')
    .delete()
    .eq('contract_id', contractId);

  if (deleteSignatureError) {
    console.error('Signature delete error:', deleteSignatureError);
    return { success: false, error: '기존 서명 삭제에 실패했어요' };
  }

  // 2. 계약서 업데이트
  const contractData = transformFormToDbSchema(validation.data);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료

  const { error: updateError } = await supabase
    .from('contracts')
    .update({
      ...contractData,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      completed_at: null, // 완료 시간 초기화
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId);

  if (updateError) {
    console.error('Contract update error:', updateError);
    return { success: false, error: '계약서 수정에 실패했어요' };
  }

  // 3. 새 사장 서명 저장
  const headersList = await headers();
  const ipAddress =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    null;
  const userAgent = headersList.get('user-agent') || null;

  const { error: signatureError } = await supabase.from('signatures').insert({
    contract_id: contractId,
    user_id: user.id,
    signer_role: 'employer',
    signature_data: signatureData,
    signed_at: new Date().toISOString(),
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  if (signatureError) {
    console.error('Signature insert error:', signatureError);
  }

  // 4. 공유 토큰 생성/갱신
  const shareToken = crypto.randomUUID().replace(/-/g, '').slice(0, 16);

  const { error: tokenError } = await supabase
    .from('contracts')
    .update({ share_token: shareToken })
    .eq('id', contractId);

  let shareUrl: string | undefined;
  if (!tokenError) {
    shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/s/${shareToken}`;
  }

  // 5. 근로자에게 알림 발송
  // 5-1. 인앱 알림 (worker_id가 있는 경우)
  if (existingContract.worker_id) {
    // 사업자 이름 조회
    const { data: employerProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const employerName = employerProfile?.name || '사장님';

    await supabase.from('notifications').insert({
      user_id: existingContract.worker_id,
      type: 'contract_modified',
      title: '📝 계약서가 수정됐어요',
      body: `${employerName}님이 근로계약서를 수정했어요. 다시 서명해주세요.`,
      data: { contractId },
      is_read: false,
    });
  }

  // 5-2. 카카오 알림톡 발송 (worker_phone이 있는 경우)
  let alimtalkSent = false;
  const workerPhone = existingContract.worker_phone;
  
  if (shareUrl && workerPhone && isValidMobilePhone(workerPhone)) {
    try {
      const templateData = buildContractSignRequestVariables({
        workerName: existingContract.worker_name,
        workplaceName: existingContract.workplace_name || '사업장',
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

      alimtalkSent = alimtalkResult.success;
    } catch (error) {
      console.error('Alimtalk send error on update:', error);
    }
  }

  // 캐시 무효화
  revalidatePath('/employer');
  revalidatePath(`/employer/contract/${contractId}`);

  return { success: true, data: { contractId, shareUrl, alimtalkSent } };
}

/**
 * 계약서 수정 가능 여부 확인
 */
function checkEditableStatus(
  status: string,
  completedAt: string | null
): { editable: boolean; reason?: string; daysLeft?: number } {
  // draft, pending 상태는 항상 수정 가능
  if (status === 'draft' || status === 'pending') {
    return { editable: true };
  }

  // completed 상태는 7일 이내만 수정 가능
  if (status === 'completed' && completedAt) {
    const completedDate = new Date(completedAt);
    const now = new Date();
    const diffMs = now.getTime() - completedDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const daysLeft = Math.ceil(7 - diffDays);

    if (diffDays <= 7) {
      return { editable: true, daysLeft };
    } else {
      return {
        editable: false,
        reason: '체결 완료 후 7일이 지나 수정할 수 없어요',
      };
    }
  }

  // expired, deleted 상태는 수정 불가
  return {
    editable: false,
    reason: '수정할 수 없는 상태예요',
  };
}

/**
 * 계약서 수정 가능 여부 조회 (프론트엔드용)
 */
export async function checkContractEditable(
  contractId: string
): Promise<
  ActionResult<{ editable: boolean; reason?: string; daysLeft?: number }>
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  const { data: contract, error: fetchError } = await supabase
    .from('contracts')
    .select('id, employer_id, status, completed_at')
    .eq('id', contractId)
    .single();

  if (fetchError || !contract) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  if (contract.employer_id !== user.id) {
    return { success: false, error: '권한이 없어요' };
  }

  const result = checkEditableStatus(contract.status, contract.completed_at);
  return { success: true, data: result };
}

/**
 * 수정할 계약서 데이터 조회
 */
export async function getContractForEdit(contractId: string): Promise<
  ActionResult<{
    id: string;
    workplaceId: string | null;
    workplaceName: string | null;
    workLocation: string;
    contractType: 'regular' | 'contract';
    businessSize: 'under_5' | 'over_5';
    workerName: string;
    workerPhone: string;
    wageType: 'hourly' | 'monthly';
    hourlyWage: number | null;
    monthlyWage: number | null;
    includesWeeklyAllowance: boolean;
    startDate: string;
    endDate: string | null;
    workDays: string[] | null;
    workDaysPerWeek: number | null;
    workStartTime: string;
    workEndTime: string;
    breakMinutes: number;
    businessType: string | null;
    jobDescription: string | null;
    payDay: number;
    paymentTiming: 'current_month' | 'next_month';
    isLastDayPayment: boolean;
    status: string;
    completedAt: string | null;
  }>
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  const { data: contract, error: fetchError } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .single();

  if (fetchError || !contract) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  if (contract.employer_id !== user.id) {
    return { success: false, error: '수정 권한이 없어요' };
  }

  // 수정 가능 여부 확인
  const editCheck = checkEditableStatus(contract.status, contract.completed_at);
  if (!editCheck.editable) {
    return {
      success: false,
      error: editCheck.reason || '수정할 수 없는 계약서예요',
    };
  }

  return {
    success: true,
    data: {
      id: contract.id,
      workplaceId: contract.workplace_id,
      workplaceName: contract.workplace_name,
      workLocation: contract.work_location,
      contractType: contract.contract_type,
      businessSize: contract.business_size,
      workerName: contract.worker_name,
      workerPhone: contract.worker_phone || '',
      wageType: contract.wage_type as 'hourly' | 'monthly',
      hourlyWage: contract.hourly_wage,
      monthlyWage: contract.monthly_wage,
      includesWeeklyAllowance: contract.includes_weekly_allowance,
      startDate: contract.start_date,
      endDate: contract.end_date,
      workDays: contract.work_days,
      workDaysPerWeek: contract.work_days_per_week,
      workStartTime: contract.work_start_time,
      workEndTime: contract.work_end_time,
      breakMinutes: contract.break_minutes,
      businessType: null, // business_type은 DB에 저장되지 않음
      jobDescription: contract.job_description,
      payDay: contract.pay_day,
      paymentTiming: contract.payment_timing as 'current_month' | 'next_month',
      isLastDayPayment: contract.is_last_day_payment,
      status: contract.status,
      completedAt: contract.completed_at,
    },
  };
}
