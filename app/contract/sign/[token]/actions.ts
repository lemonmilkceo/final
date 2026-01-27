'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { encryptData, hashSSN } from '@/lib/utils/encryption';
import type { ActionResult } from '@/types';

// 근로자 상세정보 타입
interface WorkerDetailsInput {
  ssn: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
}

/**
 * 근로자 서명을 위한 카카오 로그인
 * 로그인 후 원래 서명 페이지로 리다이렉트
 */
export async function signInForWorkerSign(token: string) {
  const supabase = await createClient();
  
  // next 파라미터를 URL 인코딩하여 손실 방지
  const nextPath = `/s/${token}`;
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(nextPath)}`;
  
  console.log('[Worker Sign] Redirect URL:', redirectUrl);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      // 로그인 후 원래 서명 페이지로 돌아오기 (단축 URL 사용)
      redirectTo: redirectUrl,
      queryParams: {
        scope: 'profile_nickname profile_image',
      },
    },
  });

  if (error) {
    console.error('Kakao OAuth Error:', error.message);
    return { success: false, error: '로그인에 실패했어요' };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { success: false, error: '로그인 URL을 생성하지 못했어요' };
}

export async function signAsWorker(
  token: string,
  signatureImageData: string,
  workerDetails?: WorkerDetailsInput
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

  try {
    // 근로자 정보 암호화 (새로 입력한 경우에만)
    let encryptedSsn: string | undefined;
    let encryptedAccount: string | undefined;
    let workerBankName: string | undefined;
    
    if (workerDetails) {
      encryptedSsn = encryptData(workerDetails.ssn);
      encryptedAccount = encryptData(workerDetails.accountNumber);
      workerBankName = workerDetails.bankName;
      
      // worker_details 테이블에도 저장 (프로필용)
      const ssnHash = hashSSN(workerDetails.ssn);
      const { error: workerDetailsError } = await supabase
        .from('worker_details')
        .upsert(
          {
            user_id: user.id,
            ssn_hash: ssnHash,
            ssn_encrypted: encryptedSsn,
            bank_name: workerDetails.bankName,
            account_number_encrypted: encryptedAccount,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      
      if (workerDetailsError) {
        console.error('Worker details save error:', workerDetailsError);
        // 저장 실패해도 서명은 계속 진행 (치명적 오류 아님)
      }
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

    // 계약서 상태 업데이트 (pending → completed) + 근로자 정보 저장
    const updateData: Record<string, unknown> = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      worker_id: user.id,
    };
    
    // 근로자 정보가 있으면 계약서에도 저장
    if (workerDetails) {
      updateData.worker_ssn_encrypted = encryptedSsn;
      updateData.worker_bank_name = workerBankName;
      updateData.worker_account_encrypted = encryptedAccount;
    }

    const { error: updateError } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', contract.id);

    if (updateError) {
      console.error('Contract update error:', updateError);
      return { success: false, error: '계약서 상태 업데이트에 실패했어요' };
    }

    // 캐시 무효화
    revalidatePath(`/contract/sign/${token}`);

    return { success: true };
  } catch (error) {
    console.error('Worker sign error:', error);
    return { success: false, error: '서명 처리 중 오류가 발생했어요' };
  }
}
