'use client';

import { useState } from 'react';
import ChatRoom from './ChatRoom';

interface ChatButtonProps {
  contractId: string;
  roomId?: string;
  currentUserId: string;
  partnerName: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'icon';
}

export default function ChatButton({
  contractId,
  roomId: initialRoomId,
  currentUserId,
  partnerName,
  className = '',
  variant = 'primary',
}: ChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [roomId, setRoomId] = useState(initialRoomId);
  const [isCreating, setIsCreating] = useState(false);

  const openChat = async () => {
    if (roomId) {
      setIsOpen(true);
      return;
    }

    // 채팅방이 없으면 생성
    setIsCreating(true);
    try {
      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId }),
      });

      const data = await response.json();

      if (response.ok && data.room) {
        setRoomId(data.room.id);
        setIsOpen(true);
      } else {
        alert(data.error || '채팅방을 열 수 없어요');
      }
    } catch (error) {
      console.error('Failed to create chat room:', error);
      alert('채팅방을 열 수 없어요');
    } finally {
      setIsCreating(false);
    }
  };

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={openChat}
          disabled={isCreating}
          className={`p-2 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors ${className}`}
          aria-label="채팅하기"
        >
          {isCreating ? (
            <div className="w-5 h-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          )}
        </button>

        {isOpen && roomId && (
          <ChatRoom
            roomId={roomId}
            contractId={contractId}
            currentUserId={currentUserId}
            partnerName={partnerName}
            onClose={() => setIsOpen(false)}
          />
        )}
      </>
    );
  }

  if (variant === 'secondary') {
    return (
      <>
        <button
          onClick={openChat}
          disabled={isCreating}
          className={`flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 ${className}`}
        >
          {isCreating ? (
            <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              채팅하기
            </>
          )}
        </button>

        {isOpen && roomId && (
          <ChatRoom
            roomId={roomId}
            contractId={contractId}
            currentUserId={currentUserId}
            partnerName={partnerName}
            onClose={() => setIsOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={openChat}
        disabled={isCreating}
        className={`flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 ${className}`}
      >
        {isCreating ? (
          <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            채팅하기
          </>
        )}
      </button>

      {isOpen && roomId && (
        <ChatRoom
          roomId={roomId}
          contractId={contractId}
          currentUserId={currentUserId}
          partnerName={partnerName}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
