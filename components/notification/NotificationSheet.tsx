'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomSheet from '@/components/ui/BottomSheet';
import { formatRelativeTime } from '@/lib/utils/format';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions/notifications';
import clsx from 'clsx';

interface NotificationData {
  contractId?: string;
  inquiryId?: string;
  roomId?: string;
  senderId?: string;
  [key: string]: unknown;
}

interface Notification {
  id: string;
  type: 'contract_sent' | 'contract_signed' | 'contract_expired_soon' | 'contract_expired' | 'system' | 'credit_low' | 'chat_message' | 'inquiry_response' | 'contract_modified';
  title: string;
  body: string;
  data?: NotificationData | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onNotificationsUpdate?: () => void;
  userRole?: 'employer' | 'worker';
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'contract_sent':
      return '📩';
    case 'contract_signed':
      return '✍️';
    case 'contract_expired_soon':
      return '⏰';
    case 'contract_expired':
      return '❌';
    case 'contract_modified':
      return '📝';
    case 'system':
      return '📢';
    case 'credit_low':
      return '💳';
    case 'chat_message':
      return '💬';
    case 'inquiry_response':
      return '📧';
    default:
      return '🔔';
  }
};

export default function NotificationSheet({
  isOpen,
  onClose,
  notifications,
  onNotificationsUpdate,
  userRole = 'employer',
}: NotificationSheetProps) {
  const router = useRouter();
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [isLoading, setIsLoading] = useState(false);

  // props의 notifications가 변경되면 localNotifications도 동기화
  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const unreadCount = localNotifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      // 읽음 처리
      const result = await markNotificationAsRead(notification.id);
      if (result.success) {
        setLocalNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
        onNotificationsUpdate?.();
      }
    }

    // 채팅 알림인 경우 계약서 상세 페이지로 이동 (채팅 가능)
    if (notification.type === 'chat_message' && notification.data?.contractId) {
      const contractPath = userRole === 'employer' 
        ? `/employer/contract/${notification.data.contractId}`
        : `/worker/contract/${notification.data.contractId}`;
      router.push(contractPath);
      onClose();
      return;
    }

    // 알림 데이터에 따라 적절한 페이지로 이동
    if (notification.data?.inquiryId) {
      // 문의 답변 알림 → 문의 상세 페이지로 이동
      router.push(`/support/inquiry/${notification.data.inquiryId}`);
    } else if (notification.data?.contractId) {
      // 계약서 관련 알림 → 계약서 상세 페이지로 이동
      const contractPath = userRole === 'employer' 
        ? `/employer/contract/${notification.data.contractId}`
        : `/worker/contract/${notification.data.contractId}`;
      router.push(contractPath);
    }

    onClose();
  };

  const handleMarkAllAsRead = async () => {
    setIsLoading(true);
    try {
      const result = await markAllNotificationsAsRead();
      if (result.success) {
        setLocalNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true }))
        );
        onNotificationsUpdate?.();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title="알림">
        <div className="max-h-[70vh] overflow-y-auto -mx-5 px-5">
          {/* 헤더 */}
          {unreadCount > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-[14px] text-gray-500">
                읽지 않은 알림 {unreadCount}개
              </p>
              <button
                onClick={handleMarkAllAsRead}
                disabled={isLoading}
                className="text-[14px] text-blue-500 font-medium disabled:opacity-50"
              >
                모두 읽음
              </button>
            </div>
          )}

          {/* 알림 목록 */}
          {localNotifications.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-5xl mb-4 block">🔔</span>
              <p className="text-[15px] text-gray-500">알림이 없어요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {localNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={clsx(
                    'w-full text-left p-4 rounded-xl transition-colors',
                    notification.is_read
                      ? 'bg-gray-50'
                      : 'bg-blue-50 hover:bg-blue-100'
                  )}
                >
                  <div className="flex gap-3">
                    <span className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={clsx(
                          'text-[15px] mb-1',
                          notification.is_read
                            ? 'text-gray-700'
                            : 'text-gray-900 font-semibold'
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-[13px] text-gray-500 truncate">
                        {notification.body}
                      </p>
                      <p className="text-[12px] text-gray-400 mt-1">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
