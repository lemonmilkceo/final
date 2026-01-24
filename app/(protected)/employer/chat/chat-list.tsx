'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { formatRelativeTime } from '@/lib/utils/format';
import clsx from 'clsx';

interface ChatRoom {
  contractId: string;
  workerName: string;
  status: string;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

interface ChatListProps {
  chatRooms: ChatRoom[];
  userRole: 'employer' | 'worker';
}

export default function ChatList({ chatRooms, userRole }: ChatListProps) {
  const router = useRouter();

  const handleChatClick = (contractId: string) => {
    router.push(`/${userRole}/chat/${contractId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <PageHeader title="채팅" showBack={false} />

      <div className="flex-1 p-4">
        {chatRooms.length === 0 ? (
          <EmptyState
            title="채팅이 없어요"
            description="계약서를 전송하면 근로자와 채팅할 수 있어요"
          />
        ) : (
          <div className="space-y-2">
            {chatRooms.map((room) => (
              <button
                key={room.contractId}
                onClick={() => handleChatClick(room.contractId)}
                className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 text-left active:bg-gray-50 transition-colors"
              >
                {/* 아바타 */}
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                  👤
                </div>

                {/* 메시지 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[15px] font-semibold text-gray-900">
                      {room.workerName}
                    </span>
                    <span className="text-[12px] text-gray-400">
                      {formatRelativeTime(room.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-[14px] text-gray-500 truncate">
                    {room.lastMessage || '아직 메시지가 없어요'}
                  </p>
                </div>

                {/* 읽지 않은 메시지 배지 */}
                {room.unreadCount > 0 && (
                  <span className="min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center text-[11px] font-bold text-white px-1.5">
                    {room.unreadCount > 99 ? '99+' : room.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
