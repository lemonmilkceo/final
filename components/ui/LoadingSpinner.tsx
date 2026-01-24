import React from 'react';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  variant?: 'fullPage' | 'inline' | 'button';
  message?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  variant = 'inline',
  message,
  className,
}) => {
  const spinnerClasses = clsx(
    'border-4 border-gray-200 rounded-full animate-spin',
    {
      'w-12 h-12 border-t-blue-500': variant === 'fullPage',
      'w-6 h-6 border-t-blue-500': variant === 'inline',
      'w-5 h-5 border-2 border-t-white border-white/30': variant === 'button',
    }
  );

  if (variant === 'fullPage') {
    return (
      <div
        className={clsx(
          'fixed inset-0 bg-white z-50 flex flex-col items-center justify-center',
          className
        )}
      >
        <div className={spinnerClasses} />
        {message && (
          <p className="mt-4 text-[15px] text-gray-500">{message}</p>
        )}
      </div>
    );
  }

  if (variant === 'button') {
    return <div className={clsx(spinnerClasses, className)} />;
  }

  return (
    <div
      className={clsx('flex flex-col items-center justify-center', className)}
    >
      <div className={spinnerClasses} />
      {message && <p className="mt-3 text-[14px] text-gray-500">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
