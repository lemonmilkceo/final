'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import MenuSheet from '@/components/layout/MenuSheet';
import NotificationSheet from '@/components/notification/NotificationSheet';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Toast from '@/components/ui/Toast';
import { formatCurrency, formatDday } from '@/lib/utils/format';
import { getNotifications, getUnreadNotificationCount } from '@/app/actions/notifications';
import clsx from 'clsx';
import type { ContractStatus } from '@/types';

// 정렬 타입
type SortType = 'latest' | 'employer';

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
  isGuestMode?: boolean;
  showOnboardingComplete?: boolean;
  isOnboardingComplete?: boolean;
}

export default function WorkerDashboard({
  profile,
  contracts,
  isGuestMode = false,
  showOnboardingComplete = false,
  isOnboardingComplete = true,
}: WorkerDashboardProps) {
  const router = useRouter();
  
  // UI 상태
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  
  // 편집 모드 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortType, setSortType] = useState<SortType>('latest');
  
  // 알림
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success');
  
  // 온보딩 완료 축하 모달
  const [showOnboardingModal, setShowOnboardingModal] = useState(showOnboardingComplete);

  const showToastMessage = (message: string, variant: 'success' | 'error') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };

  // 대기중인 계약서 (서명 필요)
  const pendingContracts = contracts.filter(
    (c) =>
      c.status === 'pending' &&
      !c.signatures.some((s) => s.signer_role === 'worker' && s.signed_at)
  );

  // 완료된 계약서
  const completedContracts = contracts.filter((c) => c.status === 'completed');

  // 정렬된 완료 계약서
  const sortedCompleted = useMemo(() => {
    const sorted = [...completedContracts];
    if (sortType === 'latest') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      sorted.sort((a, b) => (a.employer?.name || '').localeCompare(b.employer?.name || ''));
    }
    return sorted;
  }, [completedContracts, sortType]);

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

  // 편집 모드 토글
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setSelectedIds(new Set());
  };

  // 선택 토글
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 전체 선택
  const selectAll = () => {
    const allIds = completedContracts.map((c) => c.id);
    setSelectedIds(new Set(allIds));
  };

  // 삭제 (숨기기)
  const handleDelete = async () => {
    // TODO: 삭제 API 호출
    showToastMessage(`${selectedIds.size}개 계약서가 숨김 처리되었어요`, 'success');
    setSelectedIds(new Set());
    setIsEditMode(false);
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
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* 편집 모드 헤더 */}
      {isEditMode ? (
        <header className="bg-white px-5 py-4 sticky top-0 z-40 safe-top">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={toggleEditMode} className="text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <span className="text-[17px] font-bold text-gray-900">
                {selectedIds.size}개 선택됨
              </span>
            </div>
            <button
              onClick={selectAll}
              className="text-[15px] text-blue-500 font-medium"
            >
              전체 선택
            </button>
          </div>
          
          {/* 액션 바 */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortType(sortType === 'latest' ? 'employer' : 'latest')}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium border',
                'bg-blue-500 text-white border-blue-500'
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              {sortType === 'latest' ? '최신순' : '사업장별'}
            </button>
            
            <button
              onClick={handleDelete}
              disabled={selectedIds.size === 0}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium border',
                selectedIds.size > 0
                  ? 'border-red-200 text-red-500'
                  : 'border-gray-200 text-gray-400'
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              숨기기
            </button>
          </div>
        </header>
      ) : (
        /* 기본 헤더 */
        <Header
          showNotification={true}
          showMenu={true}
          unreadCount={unreadCount}
          onNotificationClick={() => setIsNotificationSheetOpen(true)}
          onMenuClick={() => setIsMenuSheetOpen(true)}
        />
      )}

      {/* Content */}
      <div className="px-5 pt-4 pb-24">
        {/* Welcome Message (편집 모드 아닐 때만) */}
        {!isEditMode && (
          <div className="mb-6">
            <p className="text-[15px] text-gray-500">안녕하세요,</p>
            <h1 className="text-[26px] font-bold text-gray-900">
              {profile.name}님 👋
            </h1>
          </div>
        )}

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
        {completedContracts.length > 0 && !isEditMode && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-semibold text-gray-900">
                  체결된 계약서
                </h2>
                <span className="text-[13px] text-gray-400">
                  ({completedContracts.length}건)
                </span>
              </div>
              <button 
                onClick={toggleEditMode}
                className="text-[14px] text-blue-500 font-medium"
              >
                편집
              </button>
            </div>
            <div className="space-y-3">
              {sortedCompleted.map((contract) => (
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

        {/* 편집 모드 계약서 목록 */}
        {isEditMode && completedContracts.length > 0 && (
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
              {sortedCompleted.map((contract) => (
                <button
                  key={contract.id}
                  onClick={() => toggleSelect(contract.id)}
                  className={clsx(
                    'w-full bg-white rounded-2xl p-4 text-left transition-all',
                    selectedIds.has(contract.id)
                      ? 'ring-2 ring-blue-500 bg-blue-50/50'
                      : 'border border-gray-100'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* 체크박스 */}
                    <div
                      className={clsx(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                        selectedIds.has(contract.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300'
                      )}
                    >
                      {selectedIds.has(contract.id) && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    
                    {/* 계약서 정보 */}
                    <div className="flex-1">
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
                </button>
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
        isGuestMode={isGuestMode}
      />

      {/* Toast */}
      <Toast
        message={toastMessage}
        variant={toastVariant}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* 온보딩 완료 축하 모달 */}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center animate-fade-in-up">
            <span className="text-6xl block mb-4">🎉</span>
            <h2 className="text-[22px] font-bold text-gray-900 mb-2">
              정보 등록 완료!
            </h2>
            <p className="text-[15px] text-gray-500 mb-6">
              이제 다음 계약할 때<br />
              이 정보들이 자동으로 채워져요
            </p>
            
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-green-500">✓</span>
                <span className="text-[14px] text-gray-700">이름</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-green-500">✓</span>
                <span className="text-[14px] text-gray-700">주민등록번호</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span className="text-[14px] text-gray-700">급여 계좌</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowOnboardingModal(false);
                // URL에서 쿼리 파라미터 제거
                router.replace('/worker');
              }}
              className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 온보딩 미완료 시 안내 배너 */}
      {!isOnboardingComplete && !isGuestMode && !isEditMode && (
        <div className="fixed bottom-20 left-4 right-4 z-30">
          <button
            onClick={() => router.push('/worker/onboarding')}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-4 shadow-lg flex items-center gap-3"
          >
            <span className="text-2xl">💡</span>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-semibold">정보를 미리 등록해두세요</p>
              <p className="text-[13px] text-blue-100">다음 계약할 때 다시 입력 안 해도 돼요</p>
            </div>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
