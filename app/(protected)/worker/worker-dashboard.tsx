'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDday } from '@/lib/utils/format';
import clsx from 'clsx';
import type { ContractStatus } from '@/types';

interface DashboardContract {
  id: string;
  worker_name: string;
  hourly_wage: number;
  status: ContractStatus;
  expires_at: string | null;
  created_at: string;
  employer?: {
    name: string | null;
  } | null;
  signatures: {
    signer_role: 'employer' | 'worker';
    signed_at: string | null;
  }[];
}

interface WorkerDashboardProps {
  profile: {
    name: string;
    avatarUrl?: string | null;
  };
  contracts: DashboardContract[];
}

export default function WorkerDashboard({
  profile,
  contracts,
}: WorkerDashboardProps) {
  const router = useRouter();

  // 대기중인 계약서 (서명 필요)
  const pendingContracts = contracts.filter(
    (c) =>
      c.status === 'pending' &&
      !c.signatures.some((s) => s.signer_role === 'worker' && s.signed_at)
  );

  // 완료된 계약서
  const completedContracts = contracts.filter((c) => c.status === 'completed');

  const getDdayBadge = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const dday = formatDday(expiresAt);
    const isUrgent = dday === 'D-Day' || dday === 'D-1';
    const isNearDeadline =
      dday.startsWith('D-') && parseInt(dday.replace('D-', '')) <= 3;

    return (
      <span
        className={clsx(
          'text-[12px] font-semibold px-2 py-0.5 rounded-full',
          {
            'bg-red-100 text-red-600': isUrgent,
            'bg-amber-100 text-amber-600': isNearDeadline && !isUrgent,
            'bg-gray-100 text-gray-500': !isNearDeadline && !isUrgent,
          }
        )}
      >
        {dday}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header showProfile avatarEmoji="👷" />

      {/* Content */}
      <div className="px-5 pt-4 pb-24">
        {/* Welcome Message */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-gray-900">
            안녕하세요, {profile.name}님 👋
          </h1>
          <p className="text-[15px] text-gray-500 mt-1">
            {pendingContracts.length > 0
              ? `서명할 계약서가 ${pendingContracts.length}건 있어요`
              : '새로운 계약서가 없어요'}
          </p>
        </div>

        {/* Pending Contracts */}
        {pendingContracts.length > 0 && (
          <section className="mb-8">
            <h2 className="text-[16px] font-semibold text-gray-900 mb-3">
              서명 대기중
            </h2>
            <div className="space-y-3">
              {pendingContracts.map((contract) => (
                <Card
                  key={contract.id}
                  variant="elevated"
                  interactive
                  onClick={() => router.push(`/worker/contract/${contract.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[16px] font-semibold text-gray-900">
                          {contract.employer?.name || '사장님'}
                        </span>
                        {getDdayBadge(contract.expires_at)}
                      </div>
                      <p className="text-[14px] text-gray-500">
                        시급 {formatCurrency(contract.hourly_wage)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-blue-500">
                      <span className="text-[14px] font-medium">서명하기</span>
                      <svg
                        className="w-4 h-4"
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
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Completed Contracts */}
        {completedContracts.length > 0 && (
          <section className="mb-8">
            <h2 className="text-[16px] font-semibold text-gray-900 mb-3">
              체결된 계약서
            </h2>
            <div className="space-y-3">
              {completedContracts.map((contract) => (
                <Card
                  key={contract.id}
                  variant="default"
                  interactive
                  onClick={() => router.push(`/worker/contract/${contract.id}`)}
                  className="border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] font-medium text-gray-900">
                        {contract.employer?.name || '사장님'}
                      </p>
                      <p className="text-[13px] text-gray-500">
                        {formatCurrency(contract.hourly_wage)}
                      </p>
                    </div>
                    <Badge variant="completed">완료</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {contracts.length === 0 && (
          <EmptyState
            icon={<span className="text-6xl">📋</span>}
            title="아직 계약서가 없어요"
            description="사장님이 계약서를 보내면 여기에 나타나요"
          />
        )}
      </div>
    </div>
  );
}
