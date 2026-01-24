import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';
import ChatRoom from '../../../employer/chat/[contractId]/chat-room';

interface PageProps {
  params: Promise<{ contractId: string }>;
}

export default async function WorkerChatRoomPage({ params }: PageProps) {
  const { contractId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 계약서 정보 조회 및 권한 확인
  const { data: contract, error } = await supabase
    .from('contracts')
    .select('id, status, employer_id, worker_id')
    .eq('id', contractId)
    .eq('worker_id', user.id)
    .single();

  if (error || !contract) {
    notFound();
  }

  // 사업자 프로필 조회
  const { data: employerProfile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', contract.employer_id)
    .single();

  // 기존 메시지 조회
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: true });

  // 읽지 않은 메시지 읽음 처리
  await supabase
    .from('chat_messages')
    .update({ is_read: true })
    .eq('contract_id', contractId)
    .neq('sender_id', user.id)
    .eq('is_read', false);

  const employerName = employerProfile?.name || '사업자';

  return (
    <ChatRoom
      contractId={contractId}
      partnerName={employerName}
      currentUserId={user.id}
      initialMessages={messages || []}
      userRole="worker"
    />
  );
}
