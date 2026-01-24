'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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
