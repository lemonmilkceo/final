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
}) => {
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
            className={clsx(
              'w-full py-4 rounded-2xl font-semibold text-lg transition-colors',
              {
                'bg-blue-500 text-white active:bg-blue-600':
                  variant === 'default',
                'bg-red-500 text-white active:bg-red-600': variant === 'danger',
              }
            )}
          >
            {confirmLabel}
          </button>

          <button
            onClick={handleCancel}
            className="w-full py-3 text-gray-500 text-[15px] font-medium"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default ConfirmSheet;
