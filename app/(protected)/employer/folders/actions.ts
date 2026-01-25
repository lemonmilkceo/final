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

export async function createFolder(name: string, color?: string) {
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

  const folderColor = color || '#3B82F6';

  const { data, error } = await supabase
    .from('folders')
    .insert({
      user_id: user.id,
      name: name.trim(),
      color: folderColor,
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

export async function updateFolder(folderId: string, name: string, color?: string) {
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

  const updateData: { name: string; color?: string; updated_at: string } = {
    name: name.trim(),
    updated_at: new Date().toISOString(),
  };

  if (color) {
    updateData.color = color;
  }

  const { error } = await supabase
    .from('folders')
    .update(updateData)
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

export async function deleteContracts(contractIds: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  // 계약서 소유권 확인
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, employer_id')
    .in('id', contractIds);

  if (!contracts || contracts.length === 0) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  // 권한 확인
  const unauthorized = contracts.find((c) => c.employer_id !== user.id);
  if (unauthorized) {
    return { success: false, error: '삭제 권한이 없는 계약서가 포함되어 있어요' };
  }

  // Soft delete (status를 deleted로 변경)
  const { error } = await supabase
    .from('contracts')
    .update({
      status: 'deleted',
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in('id', contractIds);

  if (error) {
    console.error('Contracts delete error:', error);
    return { success: false, error: '삭제에 실패했어요' };
  }

  revalidatePath('/employer');

  return { success: true };
}

export async function restoreContracts(contractIds: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  // 계약서 소유권 확인
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, employer_id, status')
    .in('id', contractIds);

  if (!contracts || contracts.length === 0) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  // 권한 확인
  const unauthorized = contracts.find((c) => c.employer_id !== user.id);
  if (unauthorized) {
    return { success: false, error: '복구 권한이 없는 계약서가 포함되어 있어요' };
  }

  // 삭제된 계약서만 복구 가능
  const notDeleted = contracts.find((c) => c.status !== 'deleted');
  if (notDeleted) {
    return { success: false, error: '삭제되지 않은 계약서가 포함되어 있어요' };
  }

  // 복구 (status를 draft로 변경, deleted_at을 null로)
  const { error } = await supabase
    .from('contracts')
    .update({
      status: 'draft',
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .in('id', contractIds);

  if (error) {
    console.error('Contracts restore error:', error);
    return { success: false, error: '복구에 실패했어요' };
  }

  revalidatePath('/employer');

  return { success: true };
}

export async function permanentDeleteContracts(contractIds: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  // 계약서 소유권 확인
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, employer_id, status')
    .in('id', contractIds);

  if (!contracts || contracts.length === 0) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  // 권한 확인
  const unauthorized = contracts.find((c) => c.employer_id !== user.id);
  if (unauthorized) {
    return { success: false, error: '삭제 권한이 없는 계약서가 포함되어 있어요' };
  }

  // 휴지통에 있는 계약서만 영구 삭제 가능
  const notInTrash = contracts.find((c) => c.status !== 'deleted');
  if (notInTrash) {
    return { success: false, error: '휴지통에 없는 계약서가 포함되어 있어요' };
  }

  // 영구 삭제 (실제 삭제)
  const { error } = await supabase
    .from('contracts')
    .delete()
    .in('id', contractIds);

  if (error) {
    console.error('Contracts permanent delete error:', error);
    return { success: false, error: '영구 삭제에 실패했어요' };
  }

  revalidatePath('/employer');

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
