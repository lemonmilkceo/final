'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types';

export async function signAsWorker(
  token: string,
  signatureImageData: string
): Promise<ActionResult> {
  const supabase = await createClient();

  // 계약서 조회 (share_token으로)
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('id, status, expires_at')
    .eq('share_token', token)
    .single();

  if (contractError || !contract) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  // 만료 체크
  if (contract.expires_at && new Date(contract.expires_at) < new Date()) {
    return { success: false, error: '서명 기한이 지났어요' };
  }

  // 상태 체크
  if (contract.status !== 'pending') {
    return {
      success: false,
      error: '서명할 수 없는 계약서예요',
    };
  }

  // 이미 근로자가 서명했는지 확인
  const { data: existingSignature } = await supabase
    .from('signatures')
    .select('id')
    .eq('contract_id', contract.id)
    .eq('signer_role', 'worker')
    .single();

  if (existingSignature) {
    return { success: false, error: '이미 서명하셨어요' };
  }

  // 현재 사용자 확인 (로그인한 경우)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // user_id는 필수이므로 로그인하지 않은 경우 처리 필요
  // 스키마상 user_id가 NOT NULL이므로, 로그인하지 않은 사용자는 서명할 수 없음
  if (!user) {
    return { success: false, error: '서명하려면 로그인이 필요해요' };
  }

  // 서명 레코드 생성 (Base64 Data URL 직접 저장)
  const { error: signatureError } = await supabase.from('signatures').insert({
    contract_id: contract.id,
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
      updated_at: new Date().toISOString(),
      // 로그인한 사용자가 있으면 worker_id 설정
      ...(user?.id ? { worker_id: user.id } : {}),
    })
    .eq('id', contract.id);

  if (updateError) {
    console.error('Contract update error:', updateError);
    return { success: false, error: '계약서 상태 업데이트에 실패했어요' };
  }

  // 캐시 무효화
  revalidatePath(`/contract/sign/${token}`);

  return { success: true };
}
