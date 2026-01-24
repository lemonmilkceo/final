'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function sendMessage(contractId: string, content: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요해요' };
  }

  if (!content.trim()) {
    return { success: false, error: '메시지를 입력해주세요' };
  }

  // 계약서 권한 확인
  const { data: contract } = await supabase
    .from('contracts')
    .select('id, employer_id, worker_id')
    .eq('id', contractId)
    .single();

  if (!contract) {
    return { success: false, error: '계약서를 찾을 수 없어요' };
  }

  if (contract.employer_id !== user.id && contract.worker_id !== user.id) {
    return { success: false, error: '메시지 전송 권한이 없어요' };
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      contract_id: contractId,
      sender_id: user.id,
      content: content.trim(),
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Message send error:', error);
    return { success: false, error: '메시지 전송에 실패했어요' };
  }

  return { success: true, data };
}

export async function markMessagesAsRead(contractId: string, userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('chat_messages')
    .update({ is_read: true })
    .eq('contract_id', contractId)
    .neq('sender_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Mark as read error:', error);
    return { success: false };
  }

  return { success: true };
}
