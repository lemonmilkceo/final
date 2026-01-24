'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import TabBar from '@/components/layout/TabBar';
import FAB from '@/components/layout/FAB';
import ContractCard from '@/components/contract/ContractCard';
import EmptyState from '@/components/shared/EmptyState';
import { ROUTES } from '@/lib/constants/routes';
import type { ContractStatus } from '@/types';

// 대시보드에서 사용하는 계약서 타입 (필요한 필드만)
interface DashboardContract {
  id: string;
  worker_name: string;
  hourly_wage: number;
  status: ContractStatus;
  created_at: string;
  folder_id: string | null;
  signatures: {
    signer_role: 'employer' | 'worker';
    signed_at: string | null;
  }[];
}

interface EmployerDashboardProps {
  profile: {
    name: string;
    avatarUrl?: string | null;
  };
  credits: number;
  contracts: DashboardContract[];
}

type TabId = 'pending' | 'completed' | 'folder' | 'trash';

const tabs = [
  { id: 'pending' as TabId, label: '대기중' },
  { id: 'completed' as TabId, label: '완료' },
  { id: 'folder' as TabId, label: '폴더' },
  { id: 'trash' as TabId, label: '휴지통' },
];

const filterContractsByTab = (
  contracts: DashboardContract[],
  tab: TabId
): DashboardContract[] => {
  switch (tab) {
    case 'pending':
      return contracts.filter(
        (c) => c.status === 'draft' || c.status === 'pending'
      );
    case 'completed':
      return contracts.filter((c) => c.status === 'completed');
    case 'folder':
      return contracts.filter((c) => c.folder_id !== null && c.status !== 'deleted');
    case 'trash':
      return contracts.filter((c) => c.status === 'deleted');
    default:
      return contracts;
  }
};

export default function EmployerDashboard({
  profile,
  credits,
  contracts,
}: EmployerDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('pending');

  const filteredContracts = filterContractsByTab(contracts, activeTab);

  // 탭별 카운트 계산
  const tabsWithCount = tabs.map((tab) => ({
    ...tab,
    count: filterContractsByTab(contracts, tab.id).length,
  }));

  const handleCreateContract = () => {
    router.push(ROUTES.EMPLOYER_CREATE_CONTRACT);
  };

  const getEmptyStateContent = () => {
    switch (activeTab) {
      case 'pending':
        return {
          title: '아직 계약서가 없어요',
          description: '첫 번째 계약서를 작성해보세요',
          actionLabel: '계약서 작성하기',
          onAction: handleCreateContract,
        };
      case 'completed':
        return {
          title: '완료된 계약서가 없어요',
          description: '서명이 완료된 계약서가 여기에 표시돼요',
        };
      case 'folder':
        return {
          title: '폴더가 비어있어요',
          description: '계약서를 폴더로 정리해보세요',
        };
      case 'trash':
        return {
          title: '휴지통이 비어있어요',
          description: '삭제된 계약서가 여기에 표시돼요',
        };
    }
  };

  const emptyState = getEmptyStateContent();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <Header
        credits={credits}
        avatarEmoji="😊"
        showProfile={true}
        showNotification={true}
      />

      {/* Tab Bar */}
      <TabBar
        tabs={tabsWithCount}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabId)}
      />

      {/* Contract List */}
      <div className="p-4 space-y-3">
        {filteredContracts.length > 0 ? (
          filteredContracts.map((contract) => (
            <ContractCard key={contract.id} contract={contract} />
          ))
        ) : (
          <EmptyState
            icon={
              <svg
                className="w-full h-full text-gray-200"
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
            }
            title={emptyState.title}
            description={emptyState.description}
            actionLabel={emptyState.actionLabel}
            onAction={emptyState.onAction}
          />
        )}
      </div>

      {/* FAB */}
      <FAB onClick={handleCreateContract} />
    </div>
  );
}
