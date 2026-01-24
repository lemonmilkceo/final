'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  contractFormSchema,
  transformFormToDbSchema,
  type ContractFormInput,
} from '@/lib/utils/validation';
import { ROUTES } from '@/lib/constants/routes';
import type { ActionResult } from '@/types';

export async function createContract(
  formData: ContractFormInput
): Promise<ActionResult<{ contractId: string }>> {
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
    return {
      success: false,
      error: validation.error.errors[0]?.message || '입력 내용을 확인해주세요',
    };
  }

  // 크레딧 확인 및 차감
  const { data: creditResult, error: creditError } = await supabase.rpc(
    'use_credit',
    {
      p_user_id: user.id,
      p_amount: 1,
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

  // 계약서 생성
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
    console.error('Contract insert error:', insertError);
    return { success: false, error: '계약서 저장에 실패했어요' };
  }

  // 캐시 무효화
  revalidatePath('/employer');

  return { success: true, data: { contractId: contract.id } };
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
