import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  variant: 'waiting' | 'complete' | 'expired' | 'urgent' | 'pending' | 'completed';
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ variant, children, className }) => {
  return (
    <span
      className={clsx(
        'px-2.5 py-1 rounded-full text-[12px] font-medium inline-flex items-center',
        {
          'bg-amber-100 text-amber-600': variant === 'waiting' || variant === 'pending',
          'bg-green-100 text-green-600': variant === 'complete' || variant === 'completed',
          'bg-gray-100 text-gray-500': variant === 'expired',
          'bg-red-100 text-red-600': variant === 'urgent',
        },
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
