'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface DeleteAccountResult {
  success: boolean;
  error?: string;
}

interface AccountCheckResult {
  success: boolean;
  data?: {
    pendingContracts: number;
    completedContracts: number;
    remainingCredits: number;
    userName: string | null;
  };
  error?: string;
}

/**
 * 회원탈퇴 전 계정 상태를 확인합니다.
 * - 진행 중인 계약서 수
 * - 완료된 계약서 수
 * - 남은 크레딧
 */
export async function checkAccountBeforeDelete(): Promise<AccountCheckResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 프로필 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', user.id)
      .single();

    // 진행 중인 계약서 수 (pending 상태)
    const { count: pendingCount } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .or(`employer_id.eq.${user.id},worker_id.eq.${user.id}`)
      .eq('status', 'pending');

    // 완료된 계약서 수
    const { count: completedCount } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .or(`employer_id.eq.${user.id},worker_id.eq.${user.id}`)
      .eq('status', 'completed');

    // 남은 크레딧 조회 (사업자인 경우)
    let remainingCredits = 0;
    if (profile?.role === 'employer') {
      const { data: credits } = await supabase
        .from('credits')
        .select('amount, credit_type')
        .eq('user_id', user.id);

      if (credits && credits.length > 0) {
        remainingCredits = credits.reduce((sum, c) => sum + (c.amount || 0), 0);
      }
    }

    return {
      success: true,
      data: {
        pendingContracts: pendingCount || 0,
        completedContracts: completedCount || 0,
        remainingCredits,
        userName: profile?.name || null,
      },
    };
  } catch (error) {
    console.error('계정 확인 오류:', error);
    return { success: false, error: '계정 정보를 확인하는 중 오류가 발생했습니다.' };
  }
}

/**
 * 회원탈퇴를 처리합니다.
 * 1. 프로필 익명화 (이름, 전화번호, 아바타 삭제)
 * 2. 민감정보 삭제 (worker_details)
 * 3. auth.users 삭제 (로그인 불가)
 */
export async function deleteAccount(): Promise<DeleteAccountResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const userId = user.id;

    // 1. 프로필 익명화
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: '탈퇴한 회원',
        phone: null,
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('프로필 익명화 오류:', profileError);
      return { success: false, error: '프로필 정보 처리 중 오류가 발생했습니다.' };
    }

    // 2. worker_details 삭제 (민감정보)
    const { error: workerDetailsError } = await supabase
      .from('worker_details')
      .delete()
      .eq('user_id', userId);

    if (workerDetailsError) {
      // worker_details가 없을 수 있으므로 에러 무시
      console.log('worker_details 삭제 (없을 수 있음):', workerDetailsError);
    }

    // 3. Admin API로 auth.users 삭제
    const adminClient = createAdminClient();
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(
      userId
    );

    if (deleteUserError) {
      console.error('사용자 삭제 오류:', deleteUserError);
      return { success: false, error: '계정 삭제 중 오류가 발생했습니다.' };
    }

    // 세션 무효화
    await supabase.auth.signOut();

    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('회원탈퇴 오류:', error);
    return { success: false, error: '회원탈퇴 처리 중 오류가 발생했습니다.' };
  }
}
