'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { validateResignationDate } from '@/lib/utils/career';

interface ResignationResult {
  success: boolean;
  error?: string;
}

/**
 * 퇴사일 설정
 * @param contractId 계약서 ID
 * @param resignationDate 퇴사일 (YYYY-MM-DD 형식)
 */
export async function setResignationDate(
  contractId: string,
  resignationDate: string
): Promise<ResignationResult> {
  const supabase = await createClient();

  // 1. 사용자 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  // 2. 계약서 조회 및 권한 확인
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('id, worker_id, start_date, end_date, status')
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
    return { success: false, error: '계약서를 찾을 수 없습니다.' };
  }

  // 3. 근로자 본인만 퇴사일 설정 가능
  if (contract.worker_id !== user.id) {
    return { success: false, error: '본인의 계약서만 수정할 수 있습니다.' };
  }

  // 4. 완료된 계약서만 퇴사일 설정 가능
  if (contract.status !== 'completed') {
    return { success: false, error: '완료된 계약서만 퇴사 처리가 가능합니다.' };
  }

  // 5. 퇴사일 유효성 검사
  const resignDate = new Date(resignationDate);
  const startDate = new Date(contract.start_date);
  
  const validation = validateResignationDate(resignDate, startDate);
  if (!validation.valid) {
    return { success: false, error: validation.message };
  }

  // 6. 퇴사일 업데이트
  const { error: updateError } = await supabase
    .from('contracts')
    .update({
      resignation_date: resignationDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId);

  if (updateError) {
    console.error('퇴사일 업데이트 오류:', updateError);
    return { success: false, error: '퇴사 처리에 실패했습니다.' };
  }

  // 7. 캐시 무효화
  revalidatePath(`/worker/contract/${contractId}`);
  revalidatePath('/worker/career');

  return { success: true };
}

/**
 * 퇴사일 취소 (초기화)
 * @param contractId 계약서 ID
 */
export async function clearResignationDate(
  contractId: string
): Promise<ResignationResult> {
  const supabase = await createClient();

  // 1. 사용자 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  // 2. 계약서 조회 및 권한 확인
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('id, worker_id, resignation_date')
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
    return { success: false, error: '계약서를 찾을 수 없습니다.' };
  }

  // 3. 근로자 본인만 취소 가능
  if (contract.worker_id !== user.id) {
    return { success: false, error: '본인의 계약서만 수정할 수 있습니다.' };
  }

  // 4. 퇴사일이 없으면 취소할 것이 없음
  if (!contract.resignation_date) {
    return { success: false, error: '퇴사일이 설정되어 있지 않습니다.' };
  }

  // 5. 퇴사일 초기화
  const { error: updateError } = await supabase
    .from('contracts')
    .update({
      resignation_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId);

  if (updateError) {
    console.error('퇴사일 취소 오류:', updateError);
    return { success: false, error: '퇴사 취소에 실패했습니다.' };
  }

  // 6. 캐시 무효화
  revalidatePath(`/worker/contract/${contractId}`);
  revalidatePath('/worker/career');

  return { success: true };
}
