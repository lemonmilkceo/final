'use client';

import React, { useEffect, useState, useCallback } from 'react';
import clsx from 'clsx';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsVisible(false);
      onClose();
    }, 250); // 애니메이션 시간과 맞춤
  }, [onClose]);

  // Handle open/close state changes
  useEffect(() => {
    if (isOpen && !isVisible) {
      setIsVisible(true);
      setIsClosing(false);
    } else if (!isOpen && isVisible && !isClosing) {
      handleClose();
    }
  }, [isOpen, isVisible, isClosing, handleClose]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/40 z-50',
          isClosing ? 'animate-fade-out' : 'animate-fade-in'
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={clsx(
          'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl',
          'max-h-[85vh] overflow-y-auto',
          isClosing ? 'animate-slide-down' : 'animate-slide-up',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      >
        {/* Handle - 클릭하면 닫기 */}
        <div 
          className="sticky top-0 bg-white pt-3 pb-2 cursor-pointer"
          onClick={handleClose}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />
        </div>

        {/* Content */}
        <div className="px-6 pb-8 safe-bottom">
          {title && (
            <h2
              id="bottom-sheet-title"
              className="text-[20px] font-bold text-gray-900 mb-4"
            >
              {title}
            </h2>
          )}
          {children}
        </div>
      </div>
    </>
  );
};

export default BottomSheet;
