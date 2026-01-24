'use server';

import { createClient } from '@/lib/supabase/server';
import { encryptData, hashSSN } from '@/lib/utils/encryption';
import type { ActionResult } from '@/types';

interface SaveWorkerDetailsInput {
  name: string;
  ssn: string;
  bankCode: string;
  accountNumber: string;
}

export async function saveWorkerDetails(
  input: SaveWorkerDetailsInput
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

  // 주민번호 유효성 검사 (간단)
  if (input.ssn.length !== 13) {
    return { success: false, error: '주민등록번호를 정확히 입력해주세요' };
  }

  // 은행 코드 검증
  if (!input.bankCode) {
    return { success: false, error: '은행을 선택해주세요' };
  }

  // 계좌번호 검증
  if (input.accountNumber.length < 10) {
    return { success: false, error: '계좌번호를 정확히 입력해주세요' };
  }

  try {
    // 프로필 이름 업데이트
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: input.name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return { success: false, error: '프로필 업데이트에 실패했어요' };
    }

    // 주민번호 해시 (중복 체크용)
    const ssnHash = hashSSN(input.ssn);

    // 민감정보 암호화
    const encryptedSSN = encryptData(input.ssn);
    const encryptedAccount = encryptData(input.accountNumber);

    // 은행 코드를 은행명으로 변환
    const bankNames: Record<string, string> = {
      kb: 'KB국민',
      shinhan: '신한',
      woori: '우리',
      hana: '하나',
      nh: 'NH농협',
      ibk: 'IBK기업',
      kakao: '카카오뱅크',
      toss: '토스뱅크',
      sc: 'SC제일',
      citi: '씨티',
    };
    const bankName = bankNames[input.bankCode] || input.bankCode;

    // worker_details 저장
    const { error: detailsError } = await supabase
      .from('worker_details')
      .upsert(
        {
          user_id: user.id,
          ssn_hash: ssnHash,
          ssn_encrypted: encryptedSSN,
          bank_name: bankName,
          account_number_encrypted: encryptedAccount,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (detailsError) {
      console.error('Worker details save error:', detailsError);
      return { success: false, error: '정보 저장에 실패했어요' };
    }

    return { success: true };
  } catch (error) {
    console.error('Encryption error:', error);
    return { success: false, error: '암호화 처리 중 오류가 발생했어요' };
  }
}
