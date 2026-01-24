'use client';

import React from 'react';
import clsx from 'clsx';

interface CardProps {
  variant?: 'default' | 'elevated';
  interactive?: boolean;
  selected?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  interactive = false,
  selected = false,
  children,
  onClick,
}) => {
  const baseStyles = clsx(
    'w-full rounded-2xl p-5 text-left transition-colors',
    {
      // Default variant
      'bg-white': variant === 'default',
      // Elevated variant
      'bg-white shadow-sm': variant === 'elevated',
      // Interactive state
      'active:bg-gray-50 cursor-pointer': interactive || onClick,
      // Selected state
      'border-2 border-blue-500 bg-blue-50': selected,
      'border-2 border-transparent': !selected,
    },
    className
  );

  if (interactive || onClick) {
    return (
      <button type="button" className={baseStyles} onClick={onClick}>
        {children}
      </button>
    );
  }

  return <div className={baseStyles}>{children}</div>;
};

export default Card;
