'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import clsx from 'clsx';

interface Message {
  id: string;
  sender_id: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
}

interface ChatRoomProps {
  roomId: string;
  contractId: string;
  currentUserId: string;
  partnerName: string;
  onClose: () => void;
}

interface PendingFile {
  file: File;
  previewUrl: string;
  type: 'image' | 'document';
}

export default function ChatRoom({
  roomId,
  contractId,
  currentUserId,
  partnerName,
  onClose,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [hasMore, setHasMore] = useState(false);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 메시지 목록 조회
  const fetchMessages = useCallback(async (before?: string) => {
    try {
      const url = before
        ? `/api/chat/rooms/${roomId}/messages?before=${before}`
        : `/api/chat/rooms/${roomId}/messages`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        if (before) {
          setMessages((prev) => [...data.messages, ...prev]);
        } else {
          setMessages(data.messages);
        }
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  // 초기 로드
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime 구독
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // 중복 방지
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // 새 메시지 시 스크롤
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 메시지 전송 (통합 - 텍스트/파일 함께 전송)
  const sendMessage = () => {
    sendMessageWithFile();
  };

  // 파일 선택 시 미리보기로 표시 (바로 전송하지 않음)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (20MB)
    if (file.size > 20 * 1024 * 1024) {
      alert('파일 크기는 20MB 이하만 가능해요');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const type = file.type.startsWith('image/') ? 'image' : 'document';
    const previewUrl = type === 'image' ? URL.createObjectURL(file) : '';

    setPendingFile({ file, previewUrl, type });

    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 첨부파일 취소
  const cancelPendingFile = () => {
    if (pendingFile?.previewUrl) {
      URL.revokeObjectURL(pendingFile.previewUrl);
    }
    setPendingFile(null);
  };

  // 메시지 전송 (텍스트 + 파일 함께)
  const sendMessageWithFile = async () => {
    if ((!newMessage.trim() && !pendingFile) || isSending) return;

    setIsSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileType: 'image' | 'document' | undefined;
      let fileSize: number | undefined;

      // 첨부파일이 있으면 먼저 업로드
      if (pendingFile) {
        setIsUploading(true);
        setUploadProgress(`${pendingFile.file.name} 업로드 중...`);

        const supabase = createClient();
        const fileExt = pendingFile.file.name.split('.').pop();
        const storagePath = `${roomId}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-files')
          .upload(storagePath, pendingFile.file);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from('chat-files')
          .getPublicUrl(uploadData.path);

        fileUrl = urlData.publicUrl;
        fileName = pendingFile.file.name;
        fileType = pendingFile.type;
        fileSize = pendingFile.file.size;

        // 미리보기 URL 정리
        if (pendingFile.previewUrl) {
          URL.revokeObjectURL(pendingFile.previewUrl);
        }
        setPendingFile(null);
        setUploadProgress('');
        setIsUploading(false);
      }

      // 메시지 전송 (텍스트만, 파일만, 또는 둘 다)
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent || undefined,
          fileUrl,
          fileName,
          fileType,
          fileSize,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        }
      } else {
        const errorData = await response.json();
        console.error('Message API error:', errorData);
        setNewMessage(messageContent);
        throw new Error(errorData.error || '메시지 전송 실패');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('메시지 전송에 실패했어요');
    } finally {
      setIsSending(false);
      setIsUploading(false);
      setUploadProgress('');
      inputRef.current?.focus();
    }
  };

  // 키보드 이벤트
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 safe-top">
        <button onClick={onClose} className="p-2 -ml-2">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-[17px] font-bold text-gray-900">{partnerName}</h1>
          <p className="text-[12px] text-gray-500">계약서 채팅</p>
        </div>
      </header>

      {/* 메시지 목록 */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span className="text-4xl mb-2">💬</span>
            <p className="text-[14px]">아직 메시지가 없어요</p>
            <p className="text-[12px]">먼저 인사해보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isMine = message.sender_id === currentUserId;
              const showDate =
                index === 0 ||
                new Date(message.created_at).toDateString() !==
                  new Date(messages[index - 1].created_at).toDateString();

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center my-4">
                      <span className="text-[12px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        {new Date(message.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  <div
                    className={clsx(
                      'flex',
                      isMine ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={clsx(
                        'max-w-[75%] rounded-2xl px-4 py-2',
                        isMine
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                      )}
                    >
                      {/* 텍스트 메시지 */}
                      {message.content && (
                        <p className="text-[15px] whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      )}

                      {/* 파일 메시지 */}
                      {message.file_url && (
                        <div className="mt-1">
                          {message.file_type === 'image' ? (
                            <a
                              href={message.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={message.file_url}
                                alt={message.file_name || '이미지'}
                                className="max-w-full rounded-lg"
                              />
                            </a>
                          ) : (
                            <a
                              href={message.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={clsx(
                                'flex items-center gap-2 px-3 py-2 rounded-lg',
                                isMine ? 'bg-blue-400' : 'bg-gray-100'
                              )}
                            >
                              <span className="text-xl">📎</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium truncate">
                                  {message.file_name}
                                </p>
                                {message.file_size && (
                                  <p
                                    className={clsx(
                                      'text-[11px]',
                                      isMine ? 'text-blue-200' : 'text-gray-400'
                                    )}
                                  >
                                    {formatFileSize(message.file_size)}
                                  </p>
                                )}
                              </div>
                            </a>
                          )}
                        </div>
                      )}

                      {/* 시간 */}
                      <p
                        className={clsx(
                          'text-[10px] mt-1',
                          isMine ? 'text-blue-200' : 'text-gray-400'
                        )}
                      >
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 입력창 */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 safe-bottom">
        {/* 업로드 상태 표시 */}
        {isUploading && uploadProgress && (
          <div className="flex items-center gap-2 mb-2 px-2 py-2 bg-blue-50 rounded-xl">
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="text-[13px] text-blue-600 truncate flex-1">{uploadProgress}</span>
          </div>
        )}

        {/* 첨부파일 미리보기 */}
        {pendingFile && (
          <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            {pendingFile.type === 'image' && pendingFile.previewUrl ? (
              <img
                src={pendingFile.previewUrl}
                alt="미리보기"
                className="w-14 h-14 object-cover rounded-lg"
              />
            ) : (
              <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
                📎
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-gray-900 truncate">
                {pendingFile.file.name}
              </p>
              <p className="text-[12px] text-gray-500">
                {formatFileSize(pendingFile.file.size)}
              </p>
            </div>
            <button
              onClick={cancelPendingFile}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              disabled={isSending}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="flex items-end gap-2">
          {/* 파일 첨부 버튼 */}
          <label className={clsx(
            "p-2 cursor-pointer transition-colors",
            (isUploading || pendingFile) ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-gray-700"
          )}>
            {isUploading ? (
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xlsx"
              onChange={handleFileSelect}
              disabled={isSending || isUploading || !!pendingFile}
            />
          </label>

          {/* 메시지 입력 */}
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={pendingFile ? "메시지와 함께 전송 (선택)" : "메시지를 입력하세요"}
              className="w-full bg-transparent text-[15px] resize-none focus:outline-none max-h-24"
              rows={1}
              disabled={isSending}
            />
          </div>

          {/* 전송 버튼 */}
          <button
            onClick={sendMessage}
            disabled={(!newMessage.trim() && !pendingFile) || isSending}
            className={clsx(
              'p-2 rounded-full transition-colors',
              (newMessage.trim() || pendingFile) && !isSending
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-400'
            )}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
