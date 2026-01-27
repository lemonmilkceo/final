'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import Toast from '@/components/ui/Toast';

interface BottomNavProps {
  userRole: 'employer' | 'worker';
}

const BottomNav: React.FC<BottomNavProps> = ({ userRole }) => {
  const pathname = usePathname();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleComingSoon = (feature: string) => {
    setToastMessage(`${feature} 기능은 곧 출시 예정이에요!`);
    setShowToast(true);
  };

  const workerNavItems = [
    {
      href: '/worker',
      icon: (active: boolean) => (
        <svg
          className={clsx('w-6 h-6', active ? 'text-blue-500' : 'text-gray-400')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
      label: '홈',
      comingSoon: false,
    },
    {
      href: '/worker/career',
      icon: (active: boolean) => (
        <svg
          className={clsx('w-6 h-6', active ? 'text-blue-500' : 'text-gray-400')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      label: '경력',
      comingSoon: false,
    },
    {
      href: '/worker/chat',
      icon: (active: boolean) => (
        <svg
          className={clsx('w-6 h-6', active ? 'text-blue-500' : 'text-gray-400')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      label: '채팅',
      comingSoon: true,
      comingSoonLabel: '채팅',
    },
    {
      href: '/profile',
      icon: (active: boolean) => (
        <svg
          className={clsx('w-6 h-6', active ? 'text-blue-500' : 'text-gray-400')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      label: '내 정보',
      comingSoon: false,
    },
  ];

  const navItems = userRole === 'worker' ? workerNavItems : workerNavItems;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-40">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/worker' && pathname.startsWith(item.href));

            // 채팅은 토스트로 "준비 중" 안내
            if (item.comingSoon) {
              return (
                <button
                  key={item.href}
                  onClick={() => handleComingSoon(item.comingSoonLabel || item.label)}
                  className="flex flex-col items-center justify-center flex-1 py-2"
                >
                  {item.icon(false)}
                  <span className="text-[11px] mt-1 text-gray-400">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 py-2"
              >
                {item.icon(isActive)}
                <span
                  className={clsx(
                    'text-[11px] mt-1',
                    isActive ? 'text-blue-500 font-medium' : 'text-gray-400'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Toast */}
      <Toast
        message={toastMessage}
        variant="info"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  );
};

export default BottomNav;
