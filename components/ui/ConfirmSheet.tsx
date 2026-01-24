'use client';

import React from 'react';
import BottomSheet from './BottomSheet';
import clsx from 'clsx';

interface ConfirmSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'danger';
  confirmVariant?: 'primary' | 'error';
  isConfirmLoading?: boolean;
}

const ConfirmSheet: React.FC<ConfirmSheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
  variant = 'default',
  confirmVariant,
  isConfirmLoading = false,
}) => {
  // confirmVariant가 있으면 그것을 사용, 없으면 variant를 기준으로 결정
  const isError = confirmVariant === 'error' || variant === 'danger';
  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <h2 className="text-[20px] font-bold text-gray-900 mb-2">{title}</h2>

        {description && (
          <p className="text-[15px] text-gray-500 mb-6 whitespace-pre-line">
            {description}
          </p>
        )}

        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            disabled={isConfirmLoading}
            className={clsx(
              'w-full py-4 rounded-2xl font-semibold text-lg transition-colors flex items-center justify-center gap-2',
              {
                'bg-blue-500 text-white active:bg-blue-600': !isError,
                'bg-red-500 text-white active:bg-red-600': isError,
                'opacity-70 cursor-not-allowed': isConfirmLoading,
              }
            )}
          >
            {isConfirmLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                처리 중...
              </>
            ) : (
              confirmLabel
            )}
          </button>

          <button
            onClick={handleCancel}
            disabled={isConfirmLoading}
            className="w-full py-3 text-gray-500 text-[15px] font-medium disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default ConfirmSheet;
