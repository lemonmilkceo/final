'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type { ContractWithSignatures, ContractStatus } from '@/types';

interface ContractCardProps {
  contract: ContractWithSignatures;
  basePath?: string;
}

const getStatusBadge = (status: ContractStatus) => {
  switch (status) {
    case 'pending':
      return { variant: 'waiting' as const, label: '서명 대기중' };
    case 'completed':
      return { variant: 'complete' as const, label: '서명 완료' };
    case 'expired':
      return { variant: 'expired' as const, label: '만료됨' };
    case 'deleted':
      return { variant: 'expired' as const, label: '삭제됨' };
    default:
      return { variant: 'waiting' as const, label: '작성중' };
  }
};

const getRelativeDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  return formatDate(dateString, 'MM월 dd일');
};

const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  basePath = '/employer/contract',
}) => {
  const router = useRouter();
  const { variant, label } = getStatusBadge(contract.status);

  const handleClick = () => {
    router.push(`${basePath}/${contract.id}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full bg-white rounded-2xl p-5 text-left active:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-[17px] font-bold text-gray-900">
          {contract.worker_name}
        </h3>
        <Badge variant={variant}>{label}</Badge>
      </div>

      <p className="text-[15px] text-gray-700 mb-1">
        시급 {formatCurrency(contract.hourly_wage)}
      </p>

      <p className="text-[13px] text-gray-400">
        {getRelativeDate(contract.created_at)}
      </p>
    </button>
  );
};

export default ContractCard;
