'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import { createClient } from '@/lib/supabase/client';
import { sendMessage, markMessagesAsRead } from './actions';
import { formatRelativeTime } from '@/lib/utils/format';
import clsx from 'clsx';

interface Message {
  id: string;
  contract_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface ChatRoomProps {
  contractId: string;
  partnerName: string;
  currentUserId: string;
  initialMessages: Message[];
  userRole: 'employer' | 'worker';
}

export default function ChatRoom({
  contractId,
  partnerName,
  currentUserId,
  initialMessages,
  userRole,
}: ChatRoomProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 스크롤을 맨 아래로
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Realtime 구독
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`chat:${contractId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `contract_id=eq.${contractId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // 중복 방지
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // 상대방 메시지면 읽음 처리
          if (newMsg.sender_id !== currentUserId) {
            markMessagesAsRead(contractId, currentUserId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contractId, currentUserId]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const result = await sendMessage(contractId, messageContent);

      if (!result.success) {
        // 전송 실패 시 메시지 복구
        setNewMessage(messageContent);
        console.error('메시지 전송 실패:', result.error);
      }
    } catch {
      setNewMessage(messageContent);
      console.error('메시지 전송 오류');
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 날짜 구분선 표시를 위한 메시지 그룹화
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    msgs.forEach((msg) => {
      const msgDate = new Date(msg.created_at).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <PageHeader title={partnerName} />

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {messageGroups.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-center">
              아직 메시지가 없어요.
              <br />
              먼저 인사를 건네보세요! 👋
            </p>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* 날짜 구분선 */}
              <div className="flex items-center justify-center my-4">
                <span className="bg-gray-200 text-gray-500 text-[12px] px-3 py-1 rounded-full">
                  {new Date(group.date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short',
                  })}
                </span>
              </div>

              {/* 메시지들 */}
              {group.messages.map((message) => {
                const isMyMessage = message.sender_id === currentUserId;

                return (
                  <div
                    key={message.id}
                    className={clsx(
                      'flex mb-3',
                      isMyMessage ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={clsx(
                        'max-w-[75%] px-4 py-2.5 rounded-2xl',
                        isMyMessage
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                      )}
                    >
                      <p className="text-[15px] whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <p
                        className={clsx(
                          'text-[11px] mt-1',
                          isMyMessage ? 'text-blue-100' : 'text-gray-400'
                        )}
                      >
                        {formatRelativeTime(message.created_at)}
                        {isMyMessage && message.is_read && ' · 읽음'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 safe-bottom">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요"
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
              newMessage.trim() && !isSending
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-400'
            )}
          >
            {isSending ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
