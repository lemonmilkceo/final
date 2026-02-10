import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/chat/unread-counts
 * 현재 사용자의 모든 채팅방 unread count를 계약서 ID 기준으로 반환
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요해요' },
        { status: 401 }
      );
    }

    // 사용자가 참여 중인 채팅방 조회
    const { data: chatRooms, error } = await supabase
      .from('chat_rooms')
      .select('contract_id, employer_id, worker_id, employer_unread_count, worker_unread_count')
      .or(`employer_id.eq.${user.id},worker_id.eq.${user.id}`);

    if (error) {
      console.error('Chat rooms fetch error:', error);
      return NextResponse.json(
        { error: '채팅방 조회에 실패했어요' },
        { status: 500 }
      );
    }

    // 계약서 ID별 unread count 매핑
    const unreadCounts: Record<string, number> = {};

    chatRooms?.forEach((room) => {
      const isEmployer = room.employer_id === user.id;
      const unreadCount = isEmployer 
        ? room.employer_unread_count 
        : room.worker_unread_count;
      
      if (room.contract_id && unreadCount && unreadCount > 0) {
        unreadCounts[room.contract_id] = unreadCount;
      }
    });

    return NextResponse.json({ unreadCounts });
  } catch (error) {
    console.error('Unread counts fetch error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했어요' },
      { status: 500 }
    );
  }
}
