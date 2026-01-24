'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import ProgressBar from '@/components/ui/ProgressBar';

interface PageHeaderProps {
  title?: string;
  onBack?: () => void;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  progress?: {
    current: number;
    total: number;
  };
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  onBack,
  showBack = true,
  rightElement,
  progress,
  className,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className={clsx('bg-white px-5 safe-top', className)}>
      <div className="h-14 flex items-center justify-between">
        {/* Back Button */}
        {showBack ? (
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center -ml-2"
            aria-label="뒤로가기"
          >
            <svg
              className="w-6 h-6 text-gray-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        ) : (
          <div className="w-10" />
        )}

        {/* Title or Progress Label */}
        {title ? (
          <span className="text-[17px] font-bold text-gray-900">{title}</span>
        ) : progress ? (
          <span className="text-[14px] text-gray-400 font-medium">
            {progress.current}/{progress.total}
          </span>
        ) : (
          <div />
        )}

        {/* Right Element */}
        {rightElement ? rightElement : <div className="w-10" />}
      </div>

      {/* Progress Bar */}
      {progress && <ProgressBar current={progress.current} total={progress.total} />}
    </header>
  );
};

export default PageHeader;
