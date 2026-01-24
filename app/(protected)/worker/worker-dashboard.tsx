'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import MenuSheet from '@/components/layout/MenuSheet';
import NotificationSheet from '@/components/notification/NotificationSheet';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDday } from '@/lib/utils/format';
import { getNotifications, getUnreadNotificationCount } from '@/app/actions/notifications';
import clsx from 'clsx';
import type { ContractStatus } from '@/types';

interface DashboardContract {
  id: string;
  worker_name: string;
  wage_type?: string;
  hourly_wage: number | null;
  monthly_wage?: number | null;
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

interface Notification {
  id: string;
  type: 'contract_sent' | 'contract_signed' | 'contract_expired_soon' | 'contract_expired';
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface WorkerDashboardProps {
  profile: {
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
  };
  contracts: DashboardContract[];
}

export default function WorkerDashboard({
  profile,
  contracts,
}: WorkerDashboardProps) {
  const router = useRouter();
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 대기중인 계약서 (서명 필요)
  const pendingContracts = contracts.filter(
    (c) =>
      c.status === 'pending' &&
      !c.signatures.some((s) => s.signer_role === 'worker' && s.signed_at)
  );

  // 완료된 계약서
  const completedContracts = contracts.filter((c) => c.status === 'completed');

  // 알림 데이터 로드
  useEffect(() => {
    const loadNotifications = async () => {
      const [notifResult, count] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);
      if (notifResult.success) {
        setNotifications(notifResult.data as Notification[]);
      }
      setUnreadCount(count);
    };
    loadNotifications();
  }, []);

  const handleNotificationsUpdate = async () => {
    const count = await getUnreadNotificationCount();
    setUnreadCount(count);
  };

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
      <Header
        showNotification={true}
        showMenu={true}
        unreadCount={unreadCount}
        onNotificationClick={() => setIsNotificationSheetOpen(true)}
        onMenuClick={() => setIsMenuSheetOpen(true)}
      />

      {/* Content */}
      <div className="px-5 pt-4 pb-24">
        {/* Welcome Message */}
        <div className="mb-6">
          <p className="text-[15px] text-gray-500">안녕하세요,</p>
          <h1 className="text-[26px] font-bold text-gray-900">
            {profile.name}님 👋
          </h1>
        </div>

        {/* 내 경력 카드 */}
        <Card
          variant="elevated"
          interactive
          onClick={() => router.push('/worker/career')}
          className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100/50"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
              <svg
                className="w-7 h-7 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[16px] font-semibold text-gray-900">내 경력</p>
              <p className="text-[14px] text-gray-500">근무 이력 및 평가 확인</p>
            </div>
            <svg
              className="w-5 h-5 text-gray-400"
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
        </Card>

        {/* Pending Contracts */}
        {pendingContracts.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[16px] font-semibold text-gray-900">
                서명 대기중
              </h2>
              <span className="text-[13px] text-blue-500 font-medium">
                {pendingContracts.length}건
              </span>
            </div>
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
                        {contract.wage_type === 'monthly' && contract.monthly_wage
                          ? `월 ${formatCurrency(contract.monthly_wage)}`
                          : contract.hourly_wage
                            ? `시급 ${formatCurrency(contract.hourly_wage)}`
                            : '-'}
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
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[16px] font-semibold text-gray-900">
                체결된 계약서
              </h2>
              <span className="text-[13px] text-gray-400">
                {completedContracts.length}건
              </span>
            </div>
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
                        {contract.wage_type === 'monthly' && contract.monthly_wage
                          ? `월 ${formatCurrency(contract.monthly_wage)}`
                          : contract.hourly_wage
                            ? formatCurrency(contract.hourly_wage)
                            : '-'}
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
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-gray-300"
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
            <p className="text-[16px] text-gray-400">아직 받은 계약서가 없어요</p>
          </div>
        )}
      </div>

      {/* Notification Sheet */}
      <NotificationSheet
        isOpen={isNotificationSheetOpen}
        onClose={() => setIsNotificationSheetOpen(false)}
        notifications={notifications}
        onNotificationsUpdate={handleNotificationsUpdate}
      />

      {/* Menu Sheet */}
      <MenuSheet
        isOpen={isMenuSheetOpen}
        onClose={() => setIsMenuSheetOpen(false)}
        userName={profile.name}
        userEmail={profile.email}
        userRole="worker"
      />
    </div>
  );
}
