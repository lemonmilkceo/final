'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { contractFormSchema, ContractFormInput } from '@/lib/utils/validation';
import { ROUTES } from '@/lib/constants/routes';
import { nanoid } from 'nanoid';

export interface CreateContractResult {
  success: boolean;
  contractId?: string;
  error?: string;
}

export async function createContract(
  formData: ContractFormInput
): Promise<CreateContractResult> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  // 역할 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'employer') {
    return { success: false, error: '사업자만 계약서를 작성할 수 있어요.' };
  }

  // 유효성 검사
  const validationResult = contractFormSchema.safeParse(formData);

  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    return { success: false, error: firstError.message };
  }

  const data = validationResult.data;

  // 크레딧 확인 및 차감
  const { data: creditResult, error: creditError } = await supabase.rpc(
    'use_credit',
    {
      p_user_id: user.id,
      p_amount: 1,
      p_description: `계약서 작성 - ${data.workerName}`,
    }
  );

  if (creditError || !creditResult) {
    return {
      success: false,
      error: '크레딧이 부족해요. 크레딧을 충전해주세요.',
    };
  }

  // 공유 토큰 생성
  const shareToken = nanoid(16);

  // 계약서 생성
  const { data: contract, error: insertError } = await supabase
    .from('contracts')
    .insert({
      employer_id: user.id,
      share_token: shareToken,
      worker_name: data.workerName,
      business_size: data.businessSize,
      hourly_wage: data.hourlyWage,
      includes_weekly_allowance: data.includesWeeklyAllowance,
      start_date: data.startDate,
      end_date: data.hasNoEndDate ? null : data.endDate,
      work_days: data.useWorkDaysPerWeek ? null : data.workDays,
      work_days_per_week: data.useWorkDaysPerWeek ? data.workDaysPerWeek : null,
      work_start_time: data.workStartTime,
      work_end_time: data.workEndTime,
      break_minutes: data.breakMinutes,
      work_location: data.workLocation,
      job_description: data.jobDescription,
      pay_day: data.payDay,
      status: 'draft',
    })
    .select('id')
    .single();

  if (insertError || !contract) {
    console.error('Contract insert error:', insertError);
    return { success: false, error: '계약서 생성에 실패했어요. 다시 시도해주세요.' };
  }

  return { success: true, contractId: contract.id };
}

export async function redirectToPreview(contractId: string) {
  redirect(ROUTES.EMPLOYER_PREVIEW_CONTRACT(contractId));
}
