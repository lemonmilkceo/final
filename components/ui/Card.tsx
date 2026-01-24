'use client';

import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated';
  interactive?: boolean;
  selected?: boolean;
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      interactive = false,
      selected = false,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const Component = interactive || onClick ? 'button' : 'div';

    return (
      <Component
        ref={ref as React.Ref<HTMLButtonElement & HTMLDivElement>}
        className={clsx(
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
        )}
        onClick={onClick}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

export default Card;
