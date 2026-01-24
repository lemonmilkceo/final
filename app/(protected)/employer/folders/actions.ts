'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getFolders() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요해요', data: null };
  }

  const { data, error } = await supabase
    .from('folders')
    .select('*, contracts:contracts(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Folders fetch error:', error);
    return { success: false, error: '폴더 목록을 불러오는데 실패했어요', data: null };
  }

  return { success: true, data };
}

export async function createFolder(name: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  if (!name.trim()) {
    return { success: false, error: '폴더 이름을 입력해주세요' };
  }

  // 이름 중복 확인
  const { data: existing } = await supabase
    .from('folders')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', name.trim())
    .single();

  if (existing) {
    return { success: false, error: '같은 이름의 폴더가 있어요' };
  }

  const { data, error } = await supabase
    .from('folders')
    .insert({
      user_id: user.id,
      name: name.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error('Folder create error:', error);
    return { success: false, error: '폴더 생성에 실패했어요' };
  }

  revalidatePath('/employer');
  revalidatePath('/employer/folders');

  return { success: true, data };
}

export async function updateFolder(folderId: string, name: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  // 폴더 소유권 확인
  const { data: folder } = await supabase
    .from('folders')
    .select('id, user_id')
    .eq('id', folderId)
    .single();

  if (!folder || folder.user_id !== user.id) {
    return { success: false, error: '수정 권한이 없어요' };
  }

  const { error } = await supabase
    .from('folders')
    .update({
      name: name.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', folderId);

  if (error) {
    console.error('Folder update error:', error);
    return { success: false, error: '폴더 수정에 실패했어요' };
  }

  revalidatePath('/employer');
  revalidatePath('/employer/folders');

  return { success: true };
}

export async function deleteFolder(folderId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  // 폴더 소유권 확인
  const { data: folder } = await supabase
    .from('folders')
    .select('id, user_id')
    .eq('id', folderId)
    .single();

  if (!folder || folder.user_id !== user.id) {
    return { success: false, error: '삭제 권한이 없어요' };
  }

  // 폴더 내 계약서들의 folder_id를 null로 변경
  await supabase
    .from('contracts')
    .update({ folder_id: null })
    .eq('folder_id', folderId);

  // 폴더 삭제
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', folderId);

  if (error) {
    console.error('Folder delete error:', error);
    return { success: false, error: '폴더 삭제에 실패했어요' };
  }

  revalidatePath('/employer');
  revalidatePath('/employer/folders');

  return { success: true };
}

export async function moveContractToFolder(contractId: string, folderId: string | null) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  // 계약서 소유권 확인
  const { data: contract } = await supabase
    .from('contracts')
    .select('id, employer_id')
    .eq('id', contractId)
    .single();

  if (!contract || contract.employer_id !== user.id) {
    return { success: false, error: '이동 권한이 없어요' };
  }

  // 폴더가 지정된 경우 소유권 확인
  if (folderId) {
    const { data: folder } = await supabase
      .from('folders')
      .select('id, user_id')
      .eq('id', folderId)
      .single();

    if (!folder || folder.user_id !== user.id) {
      return { success: false, error: '대상 폴더에 접근할 수 없어요' };
    }
  }

  const { error } = await supabase
    .from('contracts')
    .update({
      folder_id: folderId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId);

  if (error) {
    console.error('Contract move error:', error);
    return { success: false, error: '계약서 이동에 실패했어요' };
  }

  revalidatePath('/employer');
  revalidatePath('/employer/folders');

  return { success: true };
}
