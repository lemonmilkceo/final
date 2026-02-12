'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';
import { ROUTES } from '@/lib/constants/routes';

interface HeaderProps {
  showNotification?: boolean;
  showMenu?: boolean;
  credits?: number;
  unreadCount?: number;
  userName?: string; // 닉네임 표시를 위한 prop 추가
  onNotificationClick?: () => void;
  onMenuClick?: () => void;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  showNotification = true,
  showMenu = true,
  credits,
  unreadCount = 0,
  userName,
  onNotificationClick,
  onMenuClick,
  className,
}) => {
  return (
    <header
      className={clsx(
        'bg-white px-5 safe-top sticky top-0 z-40',
        className
      )}
    >
      <div className="h-14 flex items-center justify-between">
        {/* 좌측: 심볼 로고 */}
        <div className="w-10 h-10 flex items-center justify-center">
          <Image
            src="/images/logo-symbol.png"
            alt="싸인해주세요"
            width={32}
            height={32}
            priority
          />
        </div>

        {/* 중앙: 빈 공간 (flex 균형) */}
        <div className="flex-1" />

        {/* 우측: 크레딧 + 알림 + 메뉴 */}
        <div className="flex items-center gap-2 min-w-[40px] justify-end">
          {/* 크레딧 (사업자만) */}
          {credits !== undefined && (
            <Link
              href={ROUTES.PRICING}
              className="flex items-center gap-1 bg-blue-50 text-blue-500 text-[13px] font-semibold px-2.5 py-1 rounded-full"
            >
              <span>💎</span>
              <span>{credits}</span>
            </Link>
          )}

          {/* 알림 아이콘 */}
          {showNotification && (
            <button
              onClick={onNotificationClick}
              className="relative w-10 h-10 flex items-center justify-center"
              aria-label="알림"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-[11px] text-white flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* 햄버거 메뉴 아이콘 */}
          {showMenu && (
            <button
              onClick={onMenuClick}
              className="w-10 h-10 flex items-center justify-center"
              aria-label="메뉴"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
