import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ roomId: string }>;
}

/**
 * POST /api/chat/rooms/[roomId]/read
 * 채팅방 메시지 읽음 처리
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { roomId } = await params;
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

    // 채팅방 접근 권한 확인
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select('id, employer_id, worker_id')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: '채팅방을 찾을 수 없어요' },
        { status: 404 }
      );
    }

    if (room.employer_id !== user.id && room.worker_id !== user.id) {
      return NextResponse.json(
        { error: '접근 권한이 없어요' },
        { status: 403 }
      );
    }

    // 읽지 않은 메시지 읽음 처리 (본인이 보낸 메시지 제외)
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('room_id', roomId)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    // 읽지 않은 메시지 카운트 초기화
    const isEmployer = room.employer_id === user.id;
    await supabase
      .from('chat_rooms')
      .update({
        [isEmployer ? 'employer_unread_count' : 'worker_unread_count']: 0,
      })
      .eq('id', roomId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Read mark error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했어요' },
      { status: 500 }
    );
  }
}
