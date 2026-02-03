'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { MENU_ROUTES } from '@/lib/constants/routes';
import { switchRole } from '@/app/actions/role';
import { useGuestStore } from '@/stores/guestStore';

interface MenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string | null;
  userEmail?: string | null;
  userRole: 'employer' | 'worker';
  isGuestMode?: boolean;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
}

const MenuSheet: React.FC<MenuSheetProps> = ({
  isOpen,
  onClose,
  userName,
  userEmail,
  userRole,
  isGuestMode = false,
}) => {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const { setGuestMode } = useGuestStore();

  // 닫기 애니메이션 처리
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 280);
  };

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleSignout = () => {
    handleClose();
    router.push(MENU_ROUTES.SIGNOUT);
  };

  // 역할 전환 핸들러
  const handleSwitchRole = async () => {
    const newRole = userRole === 'employer' ? 'worker' : 'employer';
    setIsSwitching(true);

    try {
      if (isGuestMode) {
        // 게스트 모드: 쿠키 기반으로 역할 전환
        setGuestMode(newRole);
        handleClose();
        router.push(`/${newRole}`);
      } else {
        // 로그인 사용자: DB 업데이트
        const result = await switchRole(newRole);

        if (result.success && result.redirectTo) {
          handleClose();
          router.push(result.redirectTo);
        } else if (!result.success) {
          console.error('역할 전환 실패:', result.error);
          setIsSwitching(false);
        }
      }
    } catch (error) {
      console.error('역할 전환 실패:', error);
      setIsSwitching(false);
    }
  };

  const oppositeRole = userRole === 'employer' ? 'worker' : 'employer';
  const oppositeRoleLabel = userRole === 'employer' ? '알바생' : '사장님';
  const oppositeRoleDescription =
    userRole === 'employer' ? '다른 곳에서도 일해요' : '계약서 작성하기';

  // 사업자용 메뉴
  const employerMenuItems: MenuItem[] = [
    {
      icon: (
        <svg
          className="w-5 h-5"
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
      label: '프로필 설정',
      href: MENU_ROUTES.PROFILE,
    },
    {
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      label: '크레딧 충전',
      href: MENU_ROUTES.PRICING,
    },
    {
      icon: (
        <svg
          className="w-5 h-5"
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
      label: '결제 내역',
      href: MENU_ROUTES.PAYMENT_HISTORY,
    },
  ];

  // 근로자용 메뉴
  const workerMenuItems: MenuItem[] = [
    {
      icon: (
        <svg
          className="w-5 h-5"
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
      label: '프로필 설정',
      href: MENU_ROUTES.PROFILE,
    },
  ];

  // 공통 메뉴 (약관)
  const commonMenuItems: MenuItem[] = [
    {
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      label: '고객센터',
      href: MENU_ROUTES.SUPPORT,
    },
    {
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      label: '이용약관',
      href: MENU_ROUTES.TERMS,
    },
    {
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
      label: '개인정보처리방침',
      href: MENU_ROUTES.PRIVACY,
    },
    {
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      label: '환불정책',
      href: MENU_ROUTES.REFUND,
    },
  ];

  const menuItems =
    userRole === 'employer' ? employerMenuItems : workerMenuItems;

  const renderMenuItem = (item: MenuItem, index: number) => {
    const baseClass = clsx(
      'flex items-center justify-between py-4 px-1',
      'transition-colors active:bg-gray-50',
      item.variant === 'danger' ? 'text-red-500' : 'text-gray-900'
    );

    const content = (
      <>
        <div className="flex items-center gap-3">
          <span
            className={
              item.variant === 'danger' ? 'text-red-500' : 'text-gray-500'
            }
          >
            {item.icon}
          </span>
          <span className="text-[16px] font-medium">{item.label}</span>
        </div>
        <svg
          className={clsx(
            'w-5 h-5',
            item.variant === 'danger' ? 'text-red-400' : 'text-gray-400'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </>
    );

    if (item.href) {
      return (
        <Link
          key={index}
          href={item.href}
          className={baseClass}
          onClick={handleClose}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={index}
        className={clsx(baseClass, 'w-full')}
        onClick={() => {
          item.onClick?.();
          handleClose();
        }}
      >
        {content}
      </button>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/40 z-50',
          isClosing ? 'animate-fade-out' : 'animate-fade-in'
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Side Sheet */}
      <div
        className={clsx(
          'fixed top-0 right-0 bottom-0 z-50 w-[280px] bg-white shadow-2xl',
          isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="메뉴"
      >
        {/* Header - 프로필 영역 */}
        <div className="safe-top bg-gray-50 px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            {/* 아바타 */}
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-2xl">😊</span>
            </div>
            {/* 이름 & 이메일 */}
            <div className="flex-1 min-w-0">
              <p className="text-[17px] font-bold text-gray-900 truncate">
                {userName || '사용자'}님
              </p>
              {userEmail && (
                <p className="text-[13px] text-gray-500 truncate">
                  {userEmail}
                </p>
              )}
            </div>
          </div>

          {/* 역할 전환 버튼 */}
          <button
            onClick={handleSwitchRole}
            disabled={isSwitching}
            className={clsx(
              'mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-xl',
              'bg-white border border-gray-200 transition-all',
              'hover:border-blue-300 hover:bg-blue-50/50',
              'active:scale-[0.98]',
              isSwitching && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-semibold text-gray-900">
                {isSwitching ? '전환 중...' : `${oppositeRoleLabel}으로 전환`}
              </p>
              <p className="text-[13px] text-gray-500">
                {oppositeRoleDescription}
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Menu Items */}
        <div className="px-4 py-2">
          {/* 주요 메뉴 */}
          <div className="border-b border-gray-100 pb-2">
            {menuItems.map(renderMenuItem)}
          </div>

          {/* 약관 메뉴 */}
          <div className="border-b border-gray-100 py-2">
            {commonMenuItems.map(renderMenuItem)}
          </div>

          {/* 로그아웃 */}
          <div className="pt-2">
            <button
              className="flex items-center justify-between w-full py-4 px-1 transition-colors active:bg-gray-50"
              onClick={handleSignout}
            >
              <div className="flex items-center gap-3">
                <span className="text-red-500">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </span>
                <span className="text-[16px] font-medium text-red-500">
                  로그아웃
                </span>
              </div>
              <svg
                className="w-5 h-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MenuSheet;
