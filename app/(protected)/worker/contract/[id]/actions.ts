'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/app/actions/notifications';
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

  // 계약서 조회 및 권한 확인 (알림을 위해 employer_id, worker_name도 조회)
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('id, worker_id, employer_id, worker_name, status')
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

  // 사업자에게 알림 생성 (비동기로 처리, 실패해도 서명은 완료됨)
  if (contract.employer_id) {
    try {
      await createNotification({
        userId: contract.employer_id,
        type: 'contract_signed',
        title: '계약 완료! 🎉',
        body: `${contract.worker_name}님이 계약서에 서명했어요`,
        data: { contractId: contract.id },
      });
    } catch (error) {
      // 알림 생성 실패는 로그만 남기고 계속 진행
      console.error('Notification creation error:', error);
    }
  }

  // 캐시 무효화
  revalidatePath(`/worker/contract/${contractId}`);
  revalidatePath('/worker');

  return { success: true };
}
