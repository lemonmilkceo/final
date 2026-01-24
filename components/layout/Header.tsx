'use client';

import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ROUTES } from '@/lib/constants/routes';

interface HeaderProps {
  showProfile?: boolean;
  showNotification?: boolean;
  credits?: number;
  avatarEmoji?: string;
  unreadCount?: number;
  onNotificationClick?: () => void;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  showProfile = true,
  showNotification = true,
  credits,
  avatarEmoji = '😊',
  unreadCount = 0,
  onNotificationClick,
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
        {/* Profile */}
        {showProfile ? (
          <Link
            href={ROUTES.PROFILE}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <span className="text-lg">{avatarEmoji}</span>
          </Link>
        ) : (
          <div className="w-9" />
        )}

        {/* Title */}
        <span className="text-[17px] font-bold text-gray-900">싸인해주세요</span>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {showNotification && (
            <button 
              onClick={onNotificationClick}
              className="relative"
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
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[11px] text-white flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {credits !== undefined && (
            <Link
              href={ROUTES.PRICING}
              className="bg-blue-50 text-blue-500 text-[13px] font-semibold px-2.5 py-1 rounded-full"
            >
              {credits}개
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
