'use client';

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

interface ToastProps {
  message: string;
  variant?: 'success' | 'error';
  duration?: number;
  onClose?: () => void;
  isVisible: boolean;
}

const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'success',
  duration = 3000,
  onClose,
  isVisible,
}) => {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setShow(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div
      className={clsx(
        'fixed top-20 left-1/2 -translate-x-1/2 z-[60]',
        'px-5 py-3 rounded-full shadow-lg',
        'flex items-center gap-2',
        'animate-fade-in-up',
        {
          'bg-gray-900 text-white': variant === 'success',
          'bg-red-500 text-white': variant === 'error',
        }
      )}
      role="alert"
    >
      <span>{variant === 'success' ? '✅' : '⚠️'}</span>
      <span className="text-[15px] font-medium">{message}</span>
    </div>
  );
};

export default Toast;
