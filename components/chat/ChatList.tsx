'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import ChatRoom from './ChatRoom';

interface ChatRoomItem {
  id: string;
  contract_id: string;
  employer_id: string;
  worker_id: string;
  last_message_at: string;
  unread_count: number;
  is_employer: boolean;
  contracts: {
    id: string;
    worker_name: string;
    workplace_name: string | null;
    status: string;
  };
  partner: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ChatListProps {
  currentUserId: string;
}

export default function ChatList({ currentUserId }: ChatListProps) {
  const [rooms, setRooms] = useState<ChatRoomItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomItem | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/chat/rooms');
      const data = await response.json();

      if (response.ok) {
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-5xl mb-4">💬</span>
        <p className="text-[16px] font-medium text-gray-600">채팅 내역이 없어요</p>
        <p className="text-[14px] mt-1">서명 완료된 계약서에서 채팅을 시작해보세요</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-gray-100">
        {rooms.map((room) => {
          const partnerName = room.is_employer
            ? room.contracts.worker_name
            : room.partner?.name || '사업자';

          return (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
            >
              {/* 아바타 */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                {room.partner?.avatar_url ? (
                  <img
                    src={room.partner.avatar_url}
                    alt={partnerName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xl">
                    {room.is_employer ? '👷' : '👔'}
                  </span>
                )}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[16px] font-semibold text-gray-900 truncate">
                    {partnerName}
                  </p>
                  <span className="text-[12px] text-gray-400 flex-shrink-0 ml-2">
                    {formatDistanceToNow(new Date(room.last_message_at), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>
                </div>
                <p className="text-[14px] text-gray-500 truncate mt-0.5">
                  {room.contracts.workplace_name || '근로계약서'}
                </p>
              </div>

              {/* 읽지 않은 메시지 배지 */}
              {room.unread_count > 0 && (
                <div className="w-6 h-6 rounded-full bg-red-500 text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0">
                  {room.unread_count > 99 ? '99+' : room.unread_count}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 채팅방 모달 */}
      {selectedRoom && (
        <ChatRoom
          roomId={selectedRoom.id}
          contractId={selectedRoom.contract_id}
          currentUserId={currentUserId}
          partnerName={
            selectedRoom.is_employer
              ? selectedRoom.contracts.worker_name
              : selectedRoom.partner?.name || '사업자'
          }
          onClose={() => {
            setSelectedRoom(null);
            fetchRooms(); // 채팅방 닫을 때 목록 새로고침
          }}
        />
      )}
    </>
  );
}
