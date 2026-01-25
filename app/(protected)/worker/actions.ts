'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * 계약서 숨기기 (근로자용)
 */
export async function hideContracts(contractIds: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  if (contractIds.length === 0) {
    return { success: false, error: '숨길 계약서를 선택해주세요' };
  }

  // 계약서 존재 및 권한 확인 (worker_id가 본인인 계약서만)
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, worker_id')
    .in('id', contractIds);

  if (!contracts || contracts.length === 0) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  // 본인의 계약서인지 확인
  const unauthorized = contracts.find((c) => c.worker_id !== user.id);
  if (unauthorized) {
    return { success: false, error: '숨기기 권한이 없는 계약서가 포함되어 있어요' };
  }

  // 이미 숨긴 계약서는 제외하고 새로 숨기기
  const { data: alreadyHidden } = await supabase
    .from('worker_hidden_contracts')
    .select('contract_id')
    .eq('worker_id', user.id)
    .in('contract_id', contractIds);

  const alreadyHiddenIds = new Set((alreadyHidden || []).map((h) => h.contract_id));
  const newHiddenIds = contractIds.filter((id) => !alreadyHiddenIds.has(id));

  if (newHiddenIds.length === 0) {
    return { success: true }; // 이미 모두 숨김 처리됨
  }

  // 숨기기 처리
  const { error } = await supabase.from('worker_hidden_contracts').insert(
    newHiddenIds.map((contractId) => ({
      worker_id: user.id,
      contract_id: contractId,
    }))
  );

  if (error) {
    console.error('Hide contracts error:', error);
    return { success: false, error: '숨기기에 실패했어요' };
  }

  revalidatePath('/worker');

  return { success: true };
}

/**
 * 계약서 숨기기 해제 (근로자용)
 */
export async function unhideContracts(contractIds: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  if (contractIds.length === 0) {
    return { success: false, error: '복구할 계약서를 선택해주세요' };
  }

  // 숨긴 계약서 중에서 삭제
  const { error } = await supabase
    .from('worker_hidden_contracts')
    .delete()
    .eq('worker_id', user.id)
    .in('contract_id', contractIds);

  if (error) {
    console.error('Unhide contracts error:', error);
    return { success: false, error: '복구에 실패했어요' };
  }

  revalidatePath('/worker');

  return { success: true };
}
