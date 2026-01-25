'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { encryptData, hashSSN } from '@/lib/utils/encryption';

interface UpdateProfileData {
  name: string;
  phone?: string;
}

interface UpdateWorkerDetailsData {
  ssn: string;
  bankName: string;
  accountNumber: string;
}

export async function updateProfile(data: UpdateProfileData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      name: data.name,
      phone: data.phone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('프로필 업데이트 오류:', error);
    return { success: false, error: '프로필 업데이트에 실패했습니다.' };
  }

  revalidatePath('/profile');
  revalidatePath('/employer');
  revalidatePath('/worker');

  return { success: true };
}

export async function getProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.', data: null };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, name, phone, role, avatar_url, created_at')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('프로필 조회 오류:', error);
    return { success: false, error: '프로필 조회에 실패했습니다.', data: null };
  }

  return { success: true, data: profile };
}

export async function updateWorkerDetails(data: UpdateWorkerDetailsData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  // 주민번호 유효성 검사
  if (data.ssn.length !== 13) {
    return { success: false, error: '주민등록번호를 정확히 입력해주세요.' };
  }

  // 계좌번호 검증
  if (data.accountNumber.length < 10) {
    return { success: false, error: '계좌번호를 정확히 입력해주세요.' };
  }

  try {
    // 주민번호 해시 (중복 체크용)
    const ssnHash = hashSSN(data.ssn);

    // 민감정보 암호화
    const encryptedSSN = encryptData(data.ssn);
    const encryptedAccount = encryptData(data.accountNumber);

    // worker_details 저장/업데이트
    const { error: detailsError } = await supabase
      .from('worker_details')
      .upsert(
        {
          user_id: user.id,
          ssn_hash: ssnHash,
          ssn_encrypted: encryptedSSN,
          bank_name: data.bankName,
          account_number_encrypted: encryptedAccount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (detailsError) {
      console.error('Worker details update error:', detailsError);
      return { success: false, error: '정보 저장에 실패했습니다.' };
    }

    revalidatePath('/profile');
    revalidatePath('/worker');

    return { success: true };
  } catch (error) {
    console.error('Encryption error:', error);
    return { success: false, error: '암호화 처리 중 오류가 발생했습니다.' };
  }
}
