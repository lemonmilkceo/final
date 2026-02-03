'use client';

import { useState, useTransition } from 'react';
import { setUserRole } from './actions';
import type { UserRole } from '@/types';

interface RoleOption {
  value: UserRole;
  emoji: string;
  title: string;
  description: string;
  bgColor: string;
  activeBgColor: string;
}

interface RoleSelectorProps {
  userName?: string | null;
}

const roleOptions: RoleOption[] = [
  {
    value: 'employer',
    emoji: '👔',
    title: '사장님으로 시작',
    description: '계약서를 작성해요',
    bgColor: 'bg-blue-50',
    activeBgColor: 'active:bg-blue-100',
  },
  {
    value: 'worker',
    emoji: '👷',
    title: '알바생으로 시작',
    description: '계약서에 서명해요',
    bgColor: 'bg-green-50',
    activeBgColor: 'active:bg-green-100',
  },
];

export function RoleSelector({ userName }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);

    // 0.3초 후 자동 이동
    setTimeout(() => {
      startTransition(async () => {
        await setUserRole(role);
      });
    }, 300);
  };

  // 환영 메시지
  const welcomeMessage = userName
    ? `${userName}님, 환영합니다! 👋`
    : '반가워요! 👋';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-[24px] font-bold text-gray-900 mb-2">
            {welcomeMessage}
          </h1>
          <p className="text-[15px] text-gray-500">
            먼저 어떤 역할로 시작할까요?
          </p>
        </div>

        {/* Role Cards - 가로 배치 (게스트 모드와 동일) */}
        <div className="w-full max-w-sm space-y-4">
          {roleOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelectRole(option.value)}
              disabled={isPending}
              className={`w-full ${option.bgColor} rounded-2xl p-6 text-left ${option.activeBgColor} transition-colors ${
                selectedRole === option.value ? 'ring-2 ring-blue-500' : ''
              } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{option.emoji}</span>
                <div>
                  <p className="text-[17px] font-bold text-gray-900 mb-1">
                    {option.title}
                  </p>
                  <p className="text-[14px] text-gray-500">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer Notice */}
        <p className="mt-8 text-[13px] text-gray-400 text-center">
          💡 언제든 메뉴에서 역할을 전환할 수 있어요
        </p>
      </div>

      {/* Loading Overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="animate-spin h-8 w-8 text-blue-500"
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
            <p className="text-gray-500">설정 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}
