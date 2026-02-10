import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ roomId: string }>;
}

/**
 * GET /api/chat/rooms/[roomId]/messages
 * 메시지 목록 조회 (페이지네이션)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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
      .select('id, employer_id, worker_id, contract_id')
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

    // 페이지네이션 파라미터
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // cursor for pagination

    // 메시지 조회
    let query = supabase
      .from('chat_messages')
      .select(`
        id,
        sender_id,
        content,
        file_url,
        file_name,
        file_type,
        file_size,
        is_read,
        created_at,
        sender:sender_id (
          id,
          name,
          avatar_url
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Messages fetch error:', error);
      return NextResponse.json(
        { error: '메시지를 불러올 수 없어요' },
        { status: 500 }
      );
    }

    // 읽지 않은 메시지 읽음 처리 (본인이 보낸 메시지 제외)
    const unreadMessageIds = (messages || [])
      .filter((msg) => !msg.is_read && msg.sender_id !== user.id)
      .map((msg) => msg.id);

    if (unreadMessageIds.length > 0) {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .in('id', unreadMessageIds);

      // 읽지 않은 메시지 카운트 초기화
      const isEmployer = room.employer_id === user.id;
      await supabase
        .from('chat_rooms')
        .update({
          [isEmployer ? 'employer_unread_count' : 'worker_unread_count']: 0,
        })
        .eq('id', roomId);
    }

    return NextResponse.json({
      messages: (messages || []).reverse(), // 오래된 순으로 반환
      hasMore: (messages || []).length === limit,
    });
  } catch (error) {
    console.error('Messages fetch error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했어요' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/rooms/[roomId]/messages
 * 메시지 전송
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
      .select('id, employer_id, worker_id, contract_id')
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

    const body = await request.json();
    const { content, fileUrl, fileName, fileType, fileSize } = body;

    // 내용 또는 파일 중 하나는 필수
    if (!content && !fileUrl) {
      return NextResponse.json(
        { error: '메시지 내용 또는 파일이 필요해요' },
        { status: 400 }
      );
    }

    // 메시지 생성
    const { data: message, error: createError } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        contract_id: room.contract_id,
        sender_id: user.id,
        content: content || null,
        file_url: fileUrl || null,
        file_name: fileName || null,
        file_type: fileType || null,
        file_size: fileSize || null,
      })
      .select(`
        id,
        sender_id,
        content,
        file_url,
        file_name,
        file_type,
        file_size,
        is_read,
        created_at
      `)
      .single();

    if (createError) {
      console.error('Message create error:', createError);
      return NextResponse.json(
        { error: '메시지 전송에 실패했어요' },
        { status: 500 }
      );
    }

    // 상대방에게 알림 생성 (비동기 - 실패해도 메시지 전송은 성공)
    const recipientId = room.employer_id === user.id ? room.worker_id : room.employer_id;
    
    if (recipientId) {
      try {
        // 보낸 사람 이름 조회
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();

        const senderName = senderProfile?.name || '상대방';
        const messagePreview = content 
          ? (content.length > 30 ? content.substring(0, 30) + '...' : content)
          : '파일을 보냈어요';

        // 알림 생성
        await supabase.from('notifications').insert({
          user_id: recipientId,
          type: 'chat_message',
          title: `${senderName}님의 메시지`,
          body: messagePreview,
          data: {
            roomId: roomId,
            contractId: room.contract_id,
            senderId: user.id,
          },
          is_read: false,
        });
      } catch (notificationError) {
        console.error('Notification create error:', notificationError);
      }
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Message create error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했어요' },
      { status: 500 }
    );
  }
}
