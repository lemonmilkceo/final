'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import type { ContractStatus } from '@/types';

// 카드에서 필요한 계약서 필드
interface ContractCardData {
  id: string;
  worker_name: string;
  work_location: string;
  hourly_wage: number | null;
  wage_type?: string;
  monthly_wage?: number | null;
  status: ContractStatus;
  created_at: string;
  completed_at?: string | null;
  folder_id: string | null;
  signatures: {
    signer_role: 'employer' | 'worker';
    signed_at: string | null;
  }[];
}

interface ContractCardProps {
  contract: ContractCardData;
  basePath?: string;
  isEditMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  isDeleted?: boolean;
}

// 상태별 아이콘 색상
const getStatusIcon = (status: ContractStatus) => {
  switch (status) {
    case 'completed':
      return {
        bgColor: 'bg-green-100',
        iconColor: 'text-green-500',
      };
    case 'pending':
    case 'draft':
    default:
      return {
        bgColor: 'bg-amber-100',
        iconColor: 'text-amber-500',
      };
  }
};

// 상태별 뱃지
const getStatusBadge = (status: ContractStatus) => {
  switch (status) {
    case 'draft':
      return {
        label: '임시저장',
        className: 'bg-gray-100 text-gray-600 border border-gray-200',
      };
    case 'pending':
      return {
        label: '서명 대기',
        className: 'bg-orange-50 text-orange-500 border border-orange-200',
        icon: (
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      };
    case 'completed':
      return {
        label: '완료',
        className: 'bg-green-50 text-green-600 border border-green-200',
        icon: (
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ),
      };
    case 'expired':
      return {
        label: '만료됨',
        className: 'bg-red-50 text-red-500 border border-red-200',
      };
    default:
      return {
        label: '작성중',
        className: 'bg-gray-100 text-gray-600 border border-gray-200',
      };
  }
};

// completed 상태 + 7일 이내인지 확인
const isCompletedWithin7Days = (
  completedAt: string | null | undefined
): boolean => {
  if (!completedAt) return false;
  const completedDate = new Date(completedAt);
  const now = new Date();
  const diffMs = now.getTime() - completedDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
};

// 수정 가능 남은 일수 계산
const getDaysLeftForEdit = (
  completedAt: string | null | undefined
): number | null => {
  if (!completedAt) return null;
  const completedDate = new Date(completedAt);
  const now = new Date();
  const diffMs = now.getTime() - completedDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const daysLeft = Math.ceil(7 - diffDays);
  return daysLeft > 0 ? daysLeft : null;
};

const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  basePath = '/employer/contract',
  isEditMode = false,
  isSelected = false,
  onSelect,
  onEdit,
  isDeleted = false,
}) => {
  const router = useRouter();
  const statusIcon = isDeleted
    ? { bgColor: 'bg-red-100', iconColor: 'text-red-400' }
    : getStatusIcon(contract.status);
  const statusBadge = isDeleted
    ? {
        label: '삭제됨',
        className: 'bg-red-50 text-red-500 border border-red-200',
      }
    : getStatusBadge(contract.status);

  // 수정 가능 조건: draft, pending, 또는 completed 후 7일 이내
  const isCompletedEditable =
    contract.status === 'completed' &&
    isCompletedWithin7Days(contract.completed_at);
  const canEdit =
    !isDeleted &&
    (contract.status === 'draft' ||
      contract.status === 'pending' ||
      isCompletedEditable);
  const daysLeft = isCompletedEditable
    ? getDaysLeftForEdit(contract.completed_at)
    : null;

  const handleClick = () => {
    if (isEditMode) {
      onSelect?.(contract.id);
    } else if (!isDeleted) {
      router.push(`${basePath}/${contract.id}`);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(contract.id);
  };

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'w-full bg-white rounded-2xl p-4 text-left transition-all contract-card',
        isEditMode ? 'active:bg-gray-50' : 'active:bg-gray-50',
        isSelected && 'ring-2 ring-blue-500',
        isDeleted && 'opacity-75'
      )}
    >
      <div className="flex items-center gap-3">
        {/* 편집 모드: 체크박스 */}
        {isEditMode && (
          <div
            className={clsx(
              'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
              isSelected
                ? 'bg-blue-500 border-blue-500'
                : 'border-gray-300 bg-white'
            )}
          >
            {isSelected && (
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        )}

        {/* 아이콘 */}
        <div
          className={clsx(
            'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
            statusIcon.bgColor
          )}
        >
          <svg
            className={clsx('w-6 h-6', statusIcon.iconColor)}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[16px] font-bold text-gray-900 truncate">
            {contract.worker_name}
          </h3>
          <p className="text-[14px] text-gray-500 truncate">
            {contract.work_location || '근무지 미입력'}
          </p>
        </div>

        {/* 우측: 뱃지 + 수정 버튼 + 화살표 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 상태 뱃지 */}
          <span
            className={clsx(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium',
              statusBadge.className
            )}
          >
            {statusBadge.icon}
            {statusBadge.label}
          </span>

          {/* 수정 버튼 (draft, pending, completed 7일 이내) */}
          {!isEditMode && canEdit && (
            <button
              onClick={handleEdit}
              className={clsx(
                'px-3 py-1.5 text-white text-[12px] font-medium rounded-full',
                isCompletedEditable
                  ? 'bg-orange-500 active:bg-orange-600'
                  : 'bg-blue-500 active:bg-blue-600'
              )}
            >
              {isCompletedEditable && daysLeft
                ? `수정 (D-${daysLeft})`
                : '수정'}
            </button>
          )}

          {/* 화살표 (편집 모드 아닐 때만) */}
          {!isEditMode && (
            <svg
              className="w-5 h-5 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
};

export default ContractCard;
