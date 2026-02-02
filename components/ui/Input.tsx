'use client';

import React, { Ref } from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'underline' | 'box';
  label?: string;
  error?: string;
  helper?: string;
  suffix?: string;
  ref?: Ref<HTMLInputElement>;
}

function Input({
  className,
  variant = 'box',
  label,
  error,
  helper,
  suffix,
  disabled,
  ref,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="text-[14px] text-gray-500 font-medium mb-2 block">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          disabled={disabled}
          className={clsx(
            'w-full transition-colors focus:outline-none',
            {
              // Underline variant
              'border-0 border-b-2 border-gray-200 bg-transparent text-[28px] font-bold text-gray-900 placeholder-gray-300 focus:border-blue-500 py-2':
                variant === 'underline',
              // Box variant
              'bg-gray-100 rounded-2xl px-5 py-4 text-[17px] text-gray-900 placeholder-gray-400 border-2 border-transparent focus:border-blue-500':
                variant === 'box',
              // Error state
              'border-red-500 focus:border-red-500': error,
              // Disabled state
              'opacity-50 cursor-not-allowed': disabled,
            },
            className
          )}
          {...props}
        />

        {suffix && (
          <span
            className={clsx(
              'absolute right-0 text-gray-500',
              variant === 'underline'
                ? 'bottom-3 text-[20px] font-semibold'
                : 'top-1/2 -translate-y-1/2 right-5 text-[17px]'
            )}
          >
            {suffix}
          </span>
        )}
      </div>

      {error && (
        <p className="text-[13px] text-red-500 mt-2 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}

      {helper && !error && (
        <p className="text-[13px] text-gray-400 mt-2">{helper}</p>
      )}
    </div>
  );
}

export default Input;
