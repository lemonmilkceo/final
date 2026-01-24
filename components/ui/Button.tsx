'use client';

import { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'kakao' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  kakao: 'btn-kakao',
  ghost: 'btn-ghost',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      loading = false,
      fullWidth = true,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = variantStyles[variant];
    const widthStyles = fullWidth ? 'w-full' : 'w-auto';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${widthStyles} ${className} relative`}
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
);

Button.displayName = 'Button';

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

export default Button;
