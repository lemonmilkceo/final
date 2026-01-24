'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types';

export async function signContractAsWorker(
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

  // 계약서 조회 및 권한 확인
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('id, worker_id, status')
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  if (contract.worker_id !== user.id) {
    return { success: false, error: '권한이 없어요' };
  }

  if (contract.status !== 'pending') {
    return { success: false, error: '서명할 수 없는 계약서예요' };
  }

  // 이미 서명했는지 확인
  const { data: existingSignature } = await supabase
    .from('signatures')
    .select('id')
    .eq('contract_id', contractId)
    .eq('signer_role', 'worker')
    .single();

  if (existingSignature) {
    return { success: false, error: '이미 서명하셨어요' };
  }

  // 서명 레코드 생성
  const { error: signatureError } = await supabase.from('signatures').insert({
    contract_id: contractId,
    user_id: user.id,
    signer_role: 'worker',
    signature_data: signatureImageData,
    signed_at: new Date().toISOString(),
  });

  if (signatureError) {
    console.error('Signature insert error:', signatureError);
    return { success: false, error: '서명 저장에 실패했어요' };
  }

  // 계약서 상태 업데이트 (pending → completed)
  const { error: updateError } = await supabase
    .from('contracts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId);

  if (updateError) {
    console.error('Contract update error:', updateError);
    return { success: false, error: '계약서 상태 업데이트에 실패했어요' };
  }

  // 캐시 무효화
  revalidatePath(`/worker/contract/${contractId}`);
  revalidatePath('/worker');

  return { success: true };
}
