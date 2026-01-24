import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';
import ChatList from './chat-list';

export default async function EmployerChatPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 사업자의 계약서 목록 조회 (채팅방 = 계약서 기반)
  const { data: contracts } = await supabase
    .from('contracts')
    .select(`
      id,
      worker_name,
      status,
      created_at,
      worker_id
    `)
    .eq('employer_id', user.id)
    .neq('status', 'deleted')
    .neq('status', 'draft')
    .order('created_at', { ascending: false });

  // 각 계약서별 마지막 메시지 및 읽지 않은 메시지 수 조회
  const chatRooms = await Promise.all(
    (contracts || []).map(async (contract) => {
      // 마지막 메시지
      const { data: lastMessage } = await supabase
        .from('chat_messages')
        .select('content, created_at, sender_id')
        .eq('contract_id', contract.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // 읽지 않은 메시지 수
      const { count: unreadCount } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('contract_id', contract.id)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      return {
        contractId: contract.id,
        workerName: contract.worker_name,
        status: contract.status,
        lastMessage: lastMessage?.content || null,
        lastMessageAt: lastMessage?.created_at || contract.created_at,
        unreadCount: unreadCount || 0,
      };
    })
  );

  return <ChatList chatRooms={chatRooms} userRole="employer" />;
}
