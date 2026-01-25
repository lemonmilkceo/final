'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types';

export async function signContract(
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
    .select('id, employer_id, status')
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  if (contract.employer_id !== user.id) {
    return { success: false, error: '권한이 없어요' };
  }

  // 이미 서명했는지 확인
  const { data: existingSignature } = await supabase
    .from('signatures')
    .select('id')
    .eq('contract_id', contractId)
    .eq('signer_role', 'employer')
    .single();

  if (existingSignature) {
    return { success: false, error: '이미 서명하셨어요' };
  }

  // 서명 레코드 생성 (Base64 Data URL 직접 저장)
  const { error: signatureError } = await supabase.from('signatures').insert({
    contract_id: contractId,
    user_id: user.id,
    signer_role: 'employer',
    signature_data: signatureImageData,
    signed_at: new Date().toISOString(),
  });

  if (signatureError) {
    console.error('Signature insert error:', signatureError);
    return { success: false, error: '서명 저장에 실패했어요' };
  }

  // 계약서 상태 업데이트 (draft → pending)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료

  const { error: updateError } = await supabase
    .from('contracts')
    .update({
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId);

  if (updateError) {
    console.error('Contract update error:', updateError);
    return { success: false, error: '계약서 상태 업데이트에 실패했어요' };
  }

  // 캐시 무효화
  revalidatePath(`/employer/preview/${contractId}`);
  revalidatePath('/employer');

  return { success: true };
}

export async function sendContract(
  contractId: string
): Promise<ActionResult<{ shareUrl: string }>> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  // 계약서 조회
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('id, employer_id, status, share_token')
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  if (contract.employer_id !== user.id) {
    return { success: false, error: '권한이 없어요' };
  }

  if (contract.status !== 'pending') {
    return { success: false, error: '먼저 서명을 완료해주세요' };
  }

  // 이미 공유 토큰이 있으면 반환 (단축 URL 사용)
  if (contract.share_token) {
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/s/${contract.share_token}`;
    return { success: true, data: { shareUrl } };
  }

  // 새 공유 토큰 생성
  const shareToken = crypto.randomUUID().replace(/-/g, '').slice(0, 16);

  const { error: updateError } = await supabase
    .from('contracts')
    .update({
      share_token: shareToken,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId);

  if (updateError) {
    console.error('Share token update error:', updateError);
    return { success: false, error: '공유 링크 생성에 실패했어요' };
  }

  // 단축 URL 사용 - 카카오톡에서 하이퍼링크 인식 문제 해결
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/s/${shareToken}`;

  // 캐시 무효화
  revalidatePath(`/employer/preview/${contractId}`);

  return { success: true, data: { shareUrl } };
}
