'use client';

import { useState, useTransition } from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';

interface NamePromptSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  onDismiss: () => void;
}

export default function NamePromptSheet({
  isOpen,
  onClose,
  onSave,
  onDismiss,
}: NamePromptSheetProps) {
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setError('이름을 입력해주세요');
      return;
    }

    if (name.trim().length < 2) {
      setError('2글자 이상 입력해주세요');
      return;
    }

    startTransition(async () => {
      try {
        await onSave(name.trim());
        onClose();
      } catch {
        setError('저장에 실패했어요. 다시 시도해주세요.');
      }
    });
  };

  const handleDismiss = () => {
    onDismiss();
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (error) setError('');
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="text-center mb-6">
        <h2 className="text-[20px] font-bold text-gray-900 mb-2">
          👋 이름을 알려주세요
        </h2>
        <p className="text-[15px] text-gray-500">
          서비스 이용 시 표시될 이름이에요
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={name}
          onChange={handleInputChange}
          placeholder="이름을 입력하세요"
          className={`w-full bg-gray-100 rounded-2xl px-5 py-4 text-[17px] text-gray-900 placeholder-gray-400 border-2 transition-colors focus:outline-none ${
            error
              ? 'border-red-500'
              : 'border-transparent focus:border-blue-500'
          }`}
          maxLength={20}
          autoFocus
        />
        {error && <p className="mt-2 text-[13px] text-red-500 px-1">{error}</p>}
      </div>

      <div className="space-y-3">
        <Button
          variant="primary"
          onClick={handleSave}
          loading={isPending}
          disabled={!name.trim()}
        >
          저장하기
        </Button>

        <button
          type="button"
          onClick={handleDismiss}
          disabled={isPending}
          className="w-full py-3 text-[15px] text-gray-500 font-medium active:text-gray-700 transition-colors disabled:opacity-50"
        >
          다음에 할게요
        </button>
      </div>
    </BottomSheet>
  );
}
