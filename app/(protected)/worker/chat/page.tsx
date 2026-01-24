import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';
import ChatList from '../../employer/chat/chat-list';

export default async function WorkerChatPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 근로자의 계약서 목록 조회
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, employer_id, status, created_at')
    .eq('worker_id', user.id)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  // 각 계약서별 마지막 메시지 및 읽지 않은 메시지 수 조회
  const chatRooms = await Promise.all(
    (contracts || []).map(async (contract) => {
      // 사업자 프로필 조회
      const { data: employerProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', contract.employer_id)
        .single();

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

      const employerName = employerProfile?.name || '사업자';

      return {
        contractId: contract.id,
        workerName: employerName, // 근로자 입장에서는 사업자 이름 표시
        status: contract.status,
        lastMessage: lastMessage?.content || null,
        lastMessageAt: lastMessage?.created_at || contract.created_at,
        unreadCount: unreadCount || 0,
      };
    })
  );

  return <ChatList chatRooms={chatRooms} userRole="worker" />;
}
