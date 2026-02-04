'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import MenuSheet from '@/components/layout/MenuSheet';
import NotificationSheet from '@/components/notification/NotificationSheet';
import GuestBanner from '@/components/shared/GuestBanner';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Toast from '@/components/ui/Toast';
import ConfirmSheet from '@/components/ui/ConfirmSheet';
import NamePromptSheet from '@/components/profile/NamePromptSheet';
import { formatCurrency, formatDday } from '@/lib/utils/format';
import {
  getNotifications,
  getUnreadNotificationCount,
} from '@/app/actions/notifications';
import { hideContracts, unhideContracts } from './actions';
import { updateProfile } from '@/app/(protected)/profile/actions';
import clsx from 'clsx';
import type { ContractStatus } from '@/types';

// 탭 타입
type TabType = 'all' | 'hidden';

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
  hidden_at?: string | null;
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
  type:
    | 'contract_sent'
    | 'contract_signed'
    | 'contract_expired_soon'
    | 'contract_expired';
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
  hiddenContracts?: DashboardContract[];
  hiddenCount?: number;
  isGuestMode?: boolean;
  showOnboardingComplete?: boolean;
  isOnboardingComplete?: boolean;
}

export default function WorkerDashboard({
  profile,
  contracts,
  hiddenContracts = [],
  hiddenCount = 0,
  isGuestMode = false,
  showOnboardingComplete = false,
  isOnboardingComplete = true,
}: WorkerDashboardProps) {
  const router = useRouter();

  // 탭 상태
  const [selectedTab, setSelectedTab] = useState<TabType>('all');

  // UI 상태
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);

  // 편집 모드 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortType, setSortType] = useState<SortType>('latest');

  // 확인 다이얼로그
  const [isHideConfirmOpen, setIsHideConfirmOpen] = useState(false);

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);

  // 알림
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>(
    'success'
  );

  // 온보딩 완료 축하 모달
  const [showOnboardingModal, setShowOnboardingModal] = useState(
    showOnboardingComplete
  );

  // 이름 입력 바텀시트
  const [isNamePromptOpen, setIsNamePromptOpen] = useState(false);

  // Hydration 완료 여부
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration 완료 후 상태 확인
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // 이름 입력 프롬프트 표시 (이름이 없는 경우)
  useEffect(() => {
    if (!isGuestMode && isHydrated) {
      const isDefaultName =
        profile.name === '사장님' || profile.name === '알바생' || !profile.name;
      const isDismissed =
        localStorage.getItem('namePromptDismissed') === 'true';

      if (isDefaultName && !isDismissed) {
        // 약간의 딜레이 후 표시 (대시보드 로드 후)
        const timer = setTimeout(() => {
          setIsNamePromptOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isGuestMode, isHydrated, profile.name]);

  const showToastMessage = (message: string, variant: 'success' | 'error') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };

  // 이름 저장 핸들러
  const handleSaveName = async (name: string) => {
    const result = await updateProfile({ name });
    if (result.success) {
      showToastMessage('이름이 저장되었어요', 'success');
      router.refresh();
    } else {
      throw new Error(result.error);
    }
  };

  // 이름 입력 스킵 핸들러
  const handleDismissNamePrompt = () => {
    localStorage.setItem('namePromptDismissed', 'true');
  };

  // 탭 표시 조건: 숨긴 계약서가 있을 때만
  const showTabs = hiddenCount > 0;

  // 숨김 탭인지
  const isHiddenTab = selectedTab === 'hidden';

  // 숨긴 계약서가 없는데 숨김 탭이면 전체 탭으로 이동
  useEffect(() => {
    if (hiddenCount === 0 && selectedTab === 'hidden') {
      setSelectedTab('all');
    }
  }, [hiddenCount, selectedTab]);

  // 대기중인 계약서 (서명 필요) - 전체 탭에서만 표시
  const pendingContracts = useMemo(() => {
    if (isHiddenTab) return [];
    return contracts.filter(
      (c) =>
        c.status === 'pending' &&
        !c.signatures.some((s) => s.signer_role === 'worker' && s.signed_at)
    );
  }, [contracts, isHiddenTab]);

  // 완료된 계약서
  const completedContracts = useMemo(() => {
    if (isHiddenTab) return [];
    return contracts.filter((c) => c.status === 'completed');
  }, [contracts, isHiddenTab]);

  // 정렬된 완료 계약서
  const sortedCompleted = useMemo(() => {
    const sorted = [...completedContracts];
    if (sortType === 'latest') {
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      sorted.sort((a, b) =>
        (a.employer?.name || '').localeCompare(b.employer?.name || '')
      );
    }
    return sorted;
  }, [completedContracts, sortType]);

  // 정렬된 숨긴 계약서
  const sortedHidden = useMemo(() => {
    return [...hiddenContracts].sort(
      (a, b) =>
        new Date(b.hidden_at || b.created_at).getTime() -
        new Date(a.hidden_at || a.created_at).getTime()
    );
  }, [hiddenContracts]);

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

  // 탭 변경 시 편집 모드 해제
  useEffect(() => {
    setIsEditMode(false);
    setSelectedIds(new Set());
  }, [selectedTab]);

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
    if (isHiddenTab) {
      const allIds = hiddenContracts.map((c) => c.id);
      setSelectedIds(new Set(allIds));
    } else {
      const allIds = completedContracts.map((c) => c.id);
      setSelectedIds(new Set(allIds));
    }
  };

  // 숨기기
  const handleHide = async () => {
    if (isGuestMode) {
      showToastMessage('게스트 모드에서는 숨길 수 없어요', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await hideContracts(Array.from(selectedIds));
      if (result.success) {
        showToastMessage(
          `${selectedIds.size}개 계약서가 숨겨졌어요`,
          'success'
        );
        setSelectedIds(new Set());
        setIsEditMode(false);
      } else {
        showToastMessage(result.error || '숨기기에 실패했어요', 'error');
      }
    } catch {
      showToastMessage('숨기기 중 오류가 발생했어요', 'error');
    } finally {
      setIsLoading(false);
      setIsHideConfirmOpen(false);
    }
  };

  // 숨기기 해제 (다시 보기)
  const handleUnhide = async () => {
    if (isGuestMode) {
      showToastMessage('게스트 모드에서는 복구할 수 없어요', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await unhideContracts(Array.from(selectedIds));
      if (result.success) {
        showToastMessage(
          `${selectedIds.size}개 계약서가 복구됐어요`,
          'success'
        );
        setSelectedIds(new Set());
        setIsEditMode(false);

        // 모든 숨긴 계약서를 복구했으면 전체 탭으로 이동
        if (selectedIds.size >= hiddenContracts.length) {
          setSelectedTab('all');
        }

        router.refresh();
      } else {
        showToastMessage(result.error || '복구에 실패했어요', 'error');
      }
    } catch {
      showToastMessage('복구 중 오류가 발생했어요', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getDdayBadge = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const dday = formatDday(expiresAt);
    const isUrgent = dday === 'D-Day' || dday === 'D-1';
    const isNearDeadline =
      dday.startsWith('D-') && parseInt(dday.replace('D-', '')) <= 3;

    return (
      <span
        className={clsx('text-[12px] font-semibold px-2 py-0.5 rounded-full', {
          'bg-red-100 text-red-600': isUrgent,
          'bg-amber-100 text-amber-600': isNearDeadline && !isUrgent,
          'bg-gray-100 text-gray-500': !isNearDeadline && !isUrgent,
        })}
      >
        {dday}
      </span>
    );
  };

  // 숨긴 날짜 포맷
  const formatHiddenDate = (hiddenAt: string | null) => {
    if (!hiddenAt) return '';
    const date = new Date(hiddenAt);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return '오늘 숨김';
    if (diffDays === 1) return '어제 숨김';
    if (diffDays < 7) return `${diffDays}일 전 숨김`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전 숨김`;
    return `${Math.floor(diffDays / 30)}개월 전 숨김`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* 편집 모드 헤더 */}
      {isEditMode ? (
        <header className="bg-white px-5 py-4 sticky top-0 z-40 safe-top">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={toggleEditMode} className="text-gray-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
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
            {isHiddenTab ? (
              // 숨김 탭: 다시 보기 버튼
              <button
                onClick={handleUnhide}
                disabled={selectedIds.size === 0 || isLoading}
                className={clsx(
                  'flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium border',
                  selectedIds.size > 0
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-gray-200 text-gray-400'
                )}
              >
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                다시 보기
              </button>
            ) : (
              // 전체 탭: 정렬 + 숨기기 버튼
              <>
                <button
                  onClick={() =>
                    setSortType(sortType === 'latest' ? 'employer' : 'latest')
                  }
                  className={clsx(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium border',
                    'bg-blue-500 text-white border-blue-500'
                  )}
                >
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
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                  {sortType === 'latest' ? '최신순' : '사업장별'}
                </button>

                <button
                  onClick={() =>
                    selectedIds.size > 0 && setIsHideConfirmOpen(true)
                  }
                  disabled={selectedIds.size === 0 || isLoading}
                  className={clsx(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium border',
                    selectedIds.size > 0
                      ? 'border-gray-300 text-gray-700'
                      : 'border-gray-200 text-gray-400'
                  )}
                >
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
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                  숨기기
                </button>
              </>
            )}
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

      {/* 게스트 모드 배너 */}
      {isGuestMode && !isEditMode && <GuestBanner />}

      {/* 탭 (숨긴 계약서가 있을 때만) */}
      {showTabs && !isEditMode && (
        <div className="bg-white border-b border-gray-100">
          <div className="flex items-center gap-2 px-5 py-3">
            <button
              onClick={() => setSelectedTab('all')}
              className={clsx(
                'px-4 py-2 rounded-full text-[14px] font-medium transition-colors',
                selectedTab === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              전체 ({contracts.length})
            </button>
            <button
              onClick={() => setSelectedTab('hidden')}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-medium transition-colors',
                selectedTab === 'hidden'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
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
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
              숨김 ({hiddenCount})
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-5 pt-4 pb-24">
        {/* Welcome Message (편집 모드/숨김탭 아닐 때만) */}
        {!isEditMode && !isHiddenTab && (
          <div className="mb-6">
            <p className="text-[15px] text-gray-500">안녕하세요,</p>
            <h1 className="text-[26px] font-bold text-gray-900">
              {profile.name === '알바생' ? '알바생' : `${profile.name}님`} 👋
            </h1>
          </div>
        )}

        {/* 숨김 탭 안내 */}
        {isHiddenTab && !isEditMode && (
          <div className="mb-4 mt-2 bg-gray-100 rounded-2xl p-4">
            <div className="flex gap-3">
              <span className="text-xl">👁️</span>
              <div>
                <p className="text-[15px] font-medium text-gray-800 mb-1">
                  숨긴 계약서
                </p>
                <p className="text-[13px] text-gray-500">
                  숨긴 계약서는 여기서만 볼 수 있어요
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 내 경력 카드 (전체 탭, 편집 모드 아닐 때만) */}
        {!isHiddenTab && !isEditMode && (
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
                <p className="text-[16px] font-semibold text-gray-900">
                  내 경력
                </p>
                <p className="text-[14px] text-gray-500">
                  근무 이력 및 평가 확인
                </p>
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
        )}

        {/* 숨김 탭 컨텐츠 */}
        {isHiddenTab ? (
          hiddenContracts.length > 0 ? (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[16px] font-semibold text-gray-900">
                  숨긴 계약서
                </h2>
                <button
                  onClick={toggleEditMode}
                  className="text-[14px] text-blue-500 font-medium"
                >
                  {isEditMode ? '취소' : '편집'}
                </button>
              </div>
              <div className="space-y-3">
                {sortedHidden.map((contract) => (
                  <button
                    key={contract.id}
                    onClick={() =>
                      isEditMode ? toggleSelect(contract.id) : null
                    }
                    className={clsx(
                      'w-full bg-white rounded-2xl p-4 text-left transition-all',
                      isEditMode && selectedIds.has(contract.id)
                        ? 'ring-2 ring-blue-500 bg-blue-50/50'
                        : 'border border-gray-100',
                      !isEditMode && 'opacity-75'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {isEditMode && (
                        <div
                          className={clsx(
                            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                            selectedIds.has(contract.id)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          )}
                        >
                          {selectedIds.has(contract.id) && (
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      )}

                      <div className="flex-1">
                        <p className="text-[15px] font-medium text-gray-900">
                          {contract.employer?.name || '사장님'}
                        </p>
                        <p className="text-[13px] text-gray-500">
                          {contract.wage_type === 'monthly' &&
                          contract.monthly_wage
                            ? `월 ${formatCurrency(contract.monthly_wage)}`
                            : contract.hourly_wage
                              ? formatCurrency(contract.hourly_wage)
                              : '-'}
                        </p>
                        <p className="text-[12px] text-gray-400 mt-1">
                          {formatHiddenDate(contract.hidden_at || null)}
                        </p>
                      </div>

                      <Badge variant="expired">숨김</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : (
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
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              </div>
              <p className="text-[16px] text-gray-400">숨긴 계약서가 없어요</p>
            </div>
          )
        ) : (
          // 전체 탭 컨텐츠
          <>
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
                      onClick={() =>
                        router.push(`/worker/contract/${contract.id}`)
                      }
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
                            {contract.wage_type === 'monthly' &&
                            contract.monthly_wage
                              ? `월 ${formatCurrency(contract.monthly_wage)}`
                              : contract.hourly_wage
                                ? `시급 ${formatCurrency(contract.hourly_wage)}`
                                : '-'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-blue-500">
                          <span className="text-[14px] font-medium">
                            서명하기
                          </span>
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
                      onClick={() =>
                        router.push(`/worker/contract/${contract.id}`)
                      }
                      className="border border-gray-100"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[15px] font-medium text-gray-900">
                            {contract.employer?.name || '사장님'}
                          </p>
                          <p className="text-[13px] text-gray-500">
                            {contract.wage_type === 'monthly' &&
                            contract.monthly_wage
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
                        <div
                          className={clsx(
                            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                            selectedIds.has(contract.id)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          )}
                        >
                          {selectedIds.has(contract.id) && (
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>

                        <div className="flex-1">
                          <p className="text-[15px] font-medium text-gray-900">
                            {contract.employer?.name || '사장님'}
                          </p>
                          <p className="text-[13px] text-gray-500">
                            {contract.wage_type === 'monthly' &&
                            contract.monthly_wage
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
                <p className="text-[16px] text-gray-400">
                  아직 받은 계약서가 없어요
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Notification Sheet */}
      <NotificationSheet
        isOpen={isNotificationSheetOpen}
        onClose={() => setIsNotificationSheetOpen(false)}
        notifications={notifications}
        onNotificationsUpdate={handleNotificationsUpdate}
        userRole="worker"
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

      {/* Hide Confirm Sheet */}
      <ConfirmSheet
        isOpen={isHideConfirmOpen}
        onClose={() => setIsHideConfirmOpen(false)}
        title="계약서를 숨길까요?"
        description={`${selectedIds.size}개 계약서가 숨김 목록으로 이동해요.\n언제든 다시 볼 수 있어요.`}
        confirmLabel="숨기기"
        onConfirm={handleHide}
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
              이제 다음 계약할 때<br />이 정보들이 자동으로 채워져요
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
                router.replace('/worker');
              }}
              className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 온보딩 배너 제거됨 - 서명 링크에서 정보 입력하므로 불필요 */}

      {/* Name Prompt Sheet */}
      <NamePromptSheet
        isOpen={isNamePromptOpen}
        onClose={() => setIsNamePromptOpen(false)}
        onSave={handleSaveName}
        onDismiss={handleDismissNamePrompt}
      />
    </div>
  );
}
