import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/chat/rooms
 * 내 채팅방 목록 조회
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

    // 채팅방 목록 조회 (최근 메시지 순)
    const { data: rooms, error } = await supabase
      .from('chat_rooms')
      .select(`
        id,
        contract_id,
        employer_id,
        worker_id,
        last_message_at,
        employer_unread_count,
        worker_unread_count,
        created_at,
        contracts:contract_id (
          id,
          worker_name,
          workplace_name,
          status
        )
      `)
      .or(`employer_id.eq.${user.id},worker_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Chat rooms fetch error:', error);
      return NextResponse.json(
        { error: '채팅방 목록을 불러올 수 없어요' },
        { status: 500 }
      );
    }

    // 상대방 정보 조회
    const roomsWithPartner = await Promise.all(
      (rooms || []).map(async (room) => {
        const partnerId = room.employer_id === user.id ? room.worker_id : room.employer_id;
        const { data: partner } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .eq('id', partnerId)
          .single();

        const unreadCount = room.employer_id === user.id 
          ? room.employer_unread_count 
          : room.worker_unread_count;

        return {
          ...room,
          partner,
          unread_count: unreadCount,
          is_employer: room.employer_id === user.id,
        };
      })
    );

    return NextResponse.json({ rooms: roomsWithPartner });
  } catch (error) {
    console.error('Chat rooms error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했어요' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/rooms
 * 채팅방 생성 (계약서 서명 완료 시 호출)
 */
export async function POST(request: NextRequest) {
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

    const { contractId } = await request.json();

    if (!contractId) {
      return NextResponse.json(
        { error: '계약서 ID가 필요해요' },
        { status: 400 }
      );
    }

    // 계약서 정보 조회
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, employer_id, worker_id, status')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: '계약서를 찾을 수 없어요' },
        { status: 404 }
      );
    }

    // 본인이 계약서 당사자인지 확인
    if (contract.employer_id !== user.id && contract.worker_id !== user.id) {
      return NextResponse.json(
        { error: '접근 권한이 없어요' },
        { status: 403 }
      );
    }

    // 서명 완료된 계약서만 채팅방 생성 가능
    if (contract.status !== 'completed') {
      return NextResponse.json(
        { error: '서명이 완료된 계약서만 채팅이 가능해요' },
        { status: 400 }
      );
    }

    // worker_id가 없으면 채팅방 생성 불가
    if (!contract.worker_id) {
      return NextResponse.json(
        { error: '근로자 정보가 없어요' },
        { status: 400 }
      );
    }

    // 이미 채팅방이 있는지 확인
    const { data: existingRoom } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('contract_id', contractId)
      .single();

    if (existingRoom) {
      return NextResponse.json({ room: existingRoom });
    }

    // 채팅방 생성
    const { data: newRoom, error: createError } = await supabase
      .from('chat_rooms')
      .insert({
        contract_id: contractId,
        employer_id: contract.employer_id,
        worker_id: contract.worker_id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Chat room create error:', createError);
      return NextResponse.json(
        { error: '채팅방 생성에 실패했어요' },
        { status: 500 }
      );
    }

    return NextResponse.json({ room: newRoom }, { status: 201 });
  } catch (error) {
    console.error('Chat room create error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했어요' },
      { status: 500 }
    );
  }
}
