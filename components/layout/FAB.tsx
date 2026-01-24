'use client';

import React from 'react';
import clsx from 'clsx';

interface FABProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
}

const FAB: React.FC<FABProps> = ({
  onClick,
  icon,
  label,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'fixed bottom-6 right-6 bg-blue-500 rounded-full shadow-lg',
        'flex items-center justify-center',
        'active:bg-blue-600 transition-colors',
        'safe-bottom z-30',
        label ? 'px-5 py-4 gap-2' : 'w-14 h-14',
        className
      )}
      aria-label={label || '추가'}
    >
      {icon || (
        <svg
          className="w-7 h-7 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      )}
      {label && (
        <span className="text-white font-semibold text-[15px]">{label}</span>
      )}
    </button>
  );
};

export default FAB;
