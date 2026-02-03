'use client';

import { Ref } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'kakao' | 'apple' | 'ghost';
type ButtonSize = 'default' | 'compact';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  kakao: 'btn-kakao',
  apple: 'btn-apple',
  ghost: 'btn-ghost',
};

const sizeStyles: Record<ButtonSize, string> = {
  default: 'py-4',
  compact: 'py-3.5',
};

export function Button({
  variant = 'primary',
  size = 'default',
  loading = false,
  fullWidth = true,
  disabled,
  className = '',
  children,
  ref,
  ...props
}: ButtonProps) {
  const baseStyles = variantStyles[variant];
  const widthStyles = fullWidth ? 'w-full' : 'w-auto';
  const paddingStyles = sizeStyles[size];

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${baseStyles} ${widthStyles} ${paddingStyles} ${className} relative`}
      {...props}
    >
      {loading ? (
        <>
          <span className="opacity-0">{children}</span>
          <span className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner />
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// 카카오 아이콘 컴포넌트
export function KakaoIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.65 1.734 4.974 4.362 6.308-.19.71-.689 2.57-.789 2.97-.122.49.18.483.38.352.157-.103 2.5-1.697 3.512-2.386.505.075 1.024.115 1.535.115 5.523 0 10-3.463 10-7.691S17.523 3 12 3z" />
    </svg>
  );
}

// Apple 아이콘 컴포넌트
export function AppleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export default Button;
