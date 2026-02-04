'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import MenuSheet from '@/components/layout/MenuSheet';
import ContractCard from '@/components/contract/ContractCard';
import EmptyState from '@/components/shared/EmptyState';
import GuestBanner from '@/components/shared/GuestBanner';
import NotificationSheet from '@/components/notification/NotificationSheet';
import FolderModal from '@/components/folder/FolderModal';
import MoveFolderSheet from '@/components/folder/MoveFolderSheet';
import FolderTabs, { type TabType } from '@/components/folder/FolderTabs';
import Toast from '@/components/ui/Toast';
import BottomSheet from '@/components/ui/BottomSheet';
import ConfirmSheet from '@/components/ui/ConfirmSheet';
import NamePromptSheet from '@/components/profile/NamePromptSheet';
import { ROUTES } from '@/lib/constants/routes';
import { updateProfile } from '@/app/(protected)/profile/actions';
import {
  getNotifications,
  getUnreadNotificationCount,
} from '@/app/actions/notifications';
import {
  createFolder,
  updateFolder,
  deleteFolder,
  moveContractToFolder,
  deleteContracts,
  restoreContracts,
  permanentDeleteContracts,
} from './folders/actions';
import { useContractFormStore } from '@/stores/contractFormStore';
import type { ContractStatus } from '@/types';

// 정렬 타입
type SortType = 'latest' | 'location';

// 대시보드에서 사용하는 계약서 타입
interface DashboardContract {
  id: string;
  worker_name: string;
  work_location: string;
  hourly_wage: number | null;
  wage_type?: string;
  monthly_wage?: number | null;
  status: ContractStatus;
  created_at: string;
  deleted_at?: string | null;
  folder_id: string | null;
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

interface Folder {
  id: string;
  name: string;
  color?: string;
  contractCount?: number;
}

interface EmployerDashboardProps {
  profile: {
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
  };
  credits: {
    contract: number;
  };
  contracts: DashboardContract[];
  deletedContracts?: DashboardContract[];
  folders?: Folder[];
  unfiledCount?: number;
  deletedCount?: number;
  isGuestMode?: boolean;
}

export default function EmployerDashboard({
  profile,
  credits,
  contracts,
  deletedContracts = [],
  folders = [],
  unfiledCount = 0,
  deletedCount = 0,
  isGuestMode = false,
}: EmployerDashboardProps) {
  const router = useRouter();

  // UI 상태
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isMoveFolderSheetOpen, setIsMoveFolderSheetOpen] = useState(false);

  // 폴더 탭 상태
  const [selectedTab, setSelectedTab] = useState<TabType>('all');

  // 편집 모드 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortType, setSortType] = useState<SortType>('latest');

  // 확인 다이얼로그
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPermanentDeleteConfirmOpen, setIsPermanentDeleteConfirmOpen] =
    useState(false);

  // 알림
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>(
    'success'
  );

  // 임시저장 복귀 모달
  const [isDraftSheetOpen, setIsDraftSheetOpen] = useState(false);

  // 이름 입력 바텀시트
  const [isNamePromptOpen, setIsNamePromptOpen] = useState(false);

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);

  // 임시저장된 계약서 데이터 확인
  const {
    data: draftData,
    step: draftStep,
    reset: resetDraft,
  } = useContractFormStore();

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

  // 임시저장 데이터가 있는지 확인 (hydration 후에만)
  const hasDraft =
    isHydrated && (draftStep > 1 || draftData.workerName.trim() !== '');

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
      // 페이지 새로고침으로 프로필 업데이트 반영
      router.refresh();
    } else {
      throw new Error(result.error);
    }
  };

  // 이름 입력 스킵 핸들러
  const handleDismissNamePrompt = () => {
    localStorage.setItem('namePromptDismissed', 'true');
  };

  // 폴더 탭 표시 조건: 폴더가 있거나 휴지통에 계약서가 있을 때
  const showFolderTabs = folders.length > 0 || deletedCount > 0;

  // 현재 탭에 따른 계약서 필터링
  const filteredContracts = useMemo(() => {
    if (selectedTab === 'trash') {
      return deletedContracts;
    }
    if (selectedTab === 'all') {
      return contracts;
    }
    // 특정 폴더 선택
    return contracts.filter((c) => c.folder_id === selectedTab);
  }, [contracts, deletedContracts, selectedTab]);

  // 진행 중 (draft + pending)
  const inProgressContracts = useMemo(() => {
    if (selectedTab === 'trash') return [];
    return filteredContracts.filter(
      (c) => c.status === 'draft' || c.status === 'pending'
    );
  }, [filteredContracts, selectedTab]);

  // 완료
  const completedContracts = useMemo(() => {
    if (selectedTab === 'trash') return [];
    return filteredContracts.filter((c) => c.status === 'completed');
  }, [filteredContracts, selectedTab]);

  // 정렬된 계약서
  const sortedInProgress = useMemo(() => {
    const sorted = [...inProgressContracts];
    if (sortType === 'latest') {
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      sorted.sort((a, b) =>
        (a.work_location || '').localeCompare(b.work_location || '')
      );
    }
    return sorted;
  }, [inProgressContracts, sortType]);

  const sortedCompleted = useMemo(() => {
    const sorted = [...completedContracts];
    if (sortType === 'latest') {
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      sorted.sort((a, b) =>
        (a.work_location || '').localeCompare(b.work_location || '')
      );
    }
    return sorted;
  }, [completedContracts, sortType]);

  // 휴지통 계약서 (삭제일 기준 정렬)
  const sortedDeletedContracts = useMemo(() => {
    if (selectedTab !== 'trash') return [];
    return [...deletedContracts].sort(
      (a, b) =>
        new Date(b.deleted_at || b.created_at).getTime() -
        new Date(a.deleted_at || a.created_at).getTime()
    );
  }, [deletedContracts, selectedTab]);

  // 알림 로드
  useEffect(() => {
    const loadNotifications = async () => {
      if (isGuestMode) return;
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
  }, [isGuestMode]);

  // 탭 변경 시 편집 모드 해제
  useEffect(() => {
    setIsEditMode(false);
    setSelectedIds(new Set());
  }, [selectedTab]);

  const handleNotificationsUpdate = async () => {
    const count = await getUnreadNotificationCount();
    setUnreadCount(count);
  };

  // 계약서 작성
  const handleCreateContract = () => {
    if (hasDraft) {
      setIsDraftSheetOpen(true);
    } else {
      router.push(ROUTES.EMPLOYER_CREATE_CONTRACT);
    }
  };

  // 이어서 작성
  const handleContinueDraft = () => {
    setIsDraftSheetOpen(false);
    router.push(ROUTES.EMPLOYER_CREATE_CONTRACT);
  };

  // 처음부터 작성
  const handleStartNew = () => {
    resetDraft();
    setIsDraftSheetOpen(false);
    router.push(ROUTES.EMPLOYER_CREATE_CONTRACT);
  };

  // 계약서 수정
  const handleEditContract = (id: string) => {
    router.push(`/employer/create?edit=${id}`);
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
    if (selectedTab === 'trash') {
      const allIds = deletedContracts.map((c) => c.id);
      setSelectedIds(new Set(allIds));
    } else {
      const allIds = filteredContracts.map((c) => c.id);
      setSelectedIds(new Set(allIds));
    }
  };

  // 폴더 이동
  const handleMoveToFolder = async (folderId: string | null) => {
    if (isGuestMode) {
      return { success: false, error: '게스트 모드에서는 이동할 수 없어요' };
    }

    const results = await Promise.all(
      Array.from(selectedIds).map((contractId) =>
        moveContractToFolder(contractId, folderId)
      )
    );

    const allSuccess = results.every((r) => r.success);
    if (allSuccess) {
      setSelectedIds(new Set());
      setIsEditMode(false);
      return { success: true };
    }
    return { success: false, error: '일부 이동에 실패했어요' };
  };

  // 삭제 (휴지통으로)
  const handleDelete = async () => {
    if (isGuestMode) {
      showToastMessage('게스트 모드에서는 삭제할 수 없어요', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await deleteContracts(Array.from(selectedIds));
      if (result.success) {
        showToastMessage(
          `${selectedIds.size}개 계약서가 휴지통으로 이동했어요`,
          'success'
        );
        setSelectedIds(new Set());
        setIsEditMode(false);
      } else {
        showToastMessage(result.error || '삭제에 실패했어요', 'error');
      }
    } catch {
      showToastMessage('삭제 중 오류가 발생했어요', 'error');
    } finally {
      setIsLoading(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  // 복구 (휴지통에서)
  const handleRestore = async () => {
    if (isGuestMode) {
      showToastMessage('게스트 모드에서는 복구할 수 없어요', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await restoreContracts(Array.from(selectedIds));
      if (result.success) {
        showToastMessage(
          `${selectedIds.size}개 계약서가 복구됐어요`,
          'success'
        );
        setSelectedIds(new Set());
        setIsEditMode(false);
      } else {
        showToastMessage(result.error || '복구에 실패했어요', 'error');
      }
    } catch {
      showToastMessage('복구 중 오류가 발생했어요', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 영구 삭제
  const handlePermanentDelete = async () => {
    if (isGuestMode) {
      showToastMessage('게스트 모드에서는 삭제할 수 없어요', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await permanentDeleteContracts(Array.from(selectedIds));
      if (result.success) {
        showToastMessage(
          `${selectedIds.size}개 계약서가 영구 삭제됐어요`,
          'success'
        );
        setSelectedIds(new Set());
        setIsEditMode(false);
      } else {
        showToastMessage(result.error || '삭제에 실패했어요', 'error');
      }
    } catch {
      showToastMessage('삭제 중 오류가 발생했어요', 'error');
    } finally {
      setIsLoading(false);
      setIsPermanentDeleteConfirmOpen(false);
    }
  };

  // 폴더 CRUD
  const handleCreateFolder = async (name: string, color: string) => {
    const result = await createFolder(name, color);
    return result;
  };

  const handleUpdateFolder = async (
    id: string,
    name: string,
    color: string
  ) => {
    return await updateFolder(id, name, color);
  };

  const handleDeleteFolder = async (id: string) => {
    return await deleteFolder(id);
  };

  // 폴더 데이터 변환
  const foldersForModal = folders.map((f) => ({
    id: f.id,
    name: f.name,
    color: f.color || '#3B82F6',
    contractCount: f.contractCount || 0,
  }));

  // 현재 탭 제목
  const currentTabTitle = useMemo(() => {
    if (selectedTab === 'all') return '전체 계약서';
    if (selectedTab === 'trash') return '휴지통';
    const folder = folders.find((f) => f.id === selectedTab);
    return folder?.name || '계약서';
  }, [selectedTab, folders]);

  // 휴지통 모드인지
  const isTrashMode = selectedTab === 'trash';

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

          {/* 액션 바 - 휴지통 vs 일반 */}
          <div className="flex gap-2">
            {isTrashMode ? (
              // 휴지통 액션
              <>
                <button
                  onClick={handleRestore}
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
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                  복구
                </button>

                <button
                  onClick={() =>
                    selectedIds.size > 0 &&
                    setIsPermanentDeleteConfirmOpen(true)
                  }
                  disabled={selectedIds.size === 0 || isLoading}
                  className={clsx(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium border',
                    selectedIds.size > 0
                      ? 'border-red-200 text-red-500 bg-red-50'
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  영구 삭제
                </button>
              </>
            ) : (
              // 일반 액션
              <>
                <button
                  onClick={() =>
                    setSortType(sortType === 'latest' ? 'location' : 'latest')
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
                  {sortType === 'latest' ? '최신순' : '가게별'}
                </button>

                <button
                  onClick={() =>
                    selectedIds.size > 0 && setIsMoveFolderSheetOpen(true)
                  }
                  disabled={selectedIds.size === 0}
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
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  이동
                </button>

                <button
                  onClick={() =>
                    selectedIds.size > 0 && setIsDeleteConfirmOpen(true)
                  }
                  disabled={selectedIds.size === 0 || isLoading}
                  className={clsx(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium border',
                    selectedIds.size > 0
                      ? 'border-red-200 text-red-500'
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  삭제
                </button>
              </>
            )}
          </div>
        </header>
      ) : (
        /* 기본 헤더 */
        <header className="bg-white px-5 sticky top-0 z-40 safe-top">
          <div className="h-14 flex items-center justify-between">
            <div className="w-10" />
            <span className="text-[17px] font-bold text-gray-900">
              싸인해주세요
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsNotificationSheetOpen(true)}
                className="relative w-10 h-10 flex items-center justify-center"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-[11px] text-white flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsMenuSheetOpen(true)}
                className="w-10 h-10 flex items-center justify-center"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* 게스트 모드 배너 */}
      {isGuestMode && !isEditMode && <GuestBanner />}

      {/* 폴더 탭 (조건부 표시) */}
      {showFolderTabs && !isEditMode && (
        <FolderTabs
          folders={foldersForModal}
          deletedCount={deletedCount}
          selectedTab={selectedTab}
          onSelectTab={setSelectedTab}
          onOpenFolderManager={() => setIsFolderModalOpen(true)}
          totalCount={contracts.length}
        />
      )}

      <div className="px-5">
        {/* 닉네임 + 크레딧 (편집 모드 아닐 때만) */}
        {!isEditMode && !isTrashMode && (
          <div className="mb-6 mt-4">
            <p className="text-[15px] text-gray-500">안녕하세요,</p>
            <h1 className="text-[26px] font-bold text-gray-900">
              {profile.name === '사장님' ? '사장님' : `${profile.name}님`} 👋
            </h1>

            <div className="flex flex-wrap gap-2 mt-3">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-full border border-cyan-200/50 hover:from-cyan-100 hover:to-blue-100 transition-colors"
              >
                <span className="text-lg">💎</span>
                <span className="text-[14px] font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  계약서 {credits.contract}건
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* 휴지통 안내 */}
        {isTrashMode && !isEditMode && (
          <div className="mb-4 mt-4 bg-red-50 rounded-2xl p-4">
            <div className="flex gap-3">
              <span className="text-2xl">🗑️</span>
              <div>
                <p className="text-[15px] font-medium text-red-800 mb-1">
                  휴지통
                </p>
                <p className="text-[13px] text-red-600">
                  30일 후 자동으로 영구 삭제됩니다
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 임시저장된 계약서 배너 */}
        {hasDraft && !isEditMode && !isTrashMode && (
          <button
            onClick={() => setIsDraftSheetOpen(true)}
            className="w-full mb-4 bg-amber-50 rounded-2xl p-4 text-left border border-amber-200/50 active:bg-amber-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-amber-800">
                  작성 중인 계약서가 있어요
                </p>
                <p className="text-[13px] text-amber-600 truncate">
                  {draftData.workerName ? `${draftData.workerName}님` : ''}{' '}
                  {draftStep}단계까지 작성됨
                </p>
              </div>
              <svg
                className="w-5 h-5 text-amber-600 flex-shrink-0"
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
          </button>
        )}

        {/* 새 계약서 작성 버튼 (휴지통이 아닐 때만) */}
        {!isTrashMode && (
          <button
            onClick={handleCreateContract}
            className="w-full py-4 bg-blue-500 text-white text-[16px] font-bold rounded-2xl flex items-center justify-center gap-2 active:bg-blue-600 mb-6"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            새 계약서 작성
          </button>
        )}

        {/* 전체 계약서 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-bold text-gray-900">
              {currentTabTitle}
            </h2>
            {!isEditMode && !isTrashMode && (
              <span className="text-[14px] text-gray-400">(최신순)</span>
            )}
          </div>
          <button
            onClick={toggleEditMode}
            className="text-[14px] text-blue-500 font-medium"
          >
            {isEditMode ? '취소' : '편집'}
          </button>
        </div>

        {/* 휴지통 리스트 */}
        {isTrashMode ? (
          sortedDeletedContracts.length > 0 ? (
            <div className="space-y-3">
              {sortedDeletedContracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  isEditMode={isEditMode}
                  isSelected={selectedIds.has(contract.id)}
                  onSelect={toggleSelect}
                  onEdit={handleEditContract}
                  isDeleted
                />
              ))}
            </div>
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              }
              title="휴지통이 비어있어요"
              description="삭제한 계약서가 여기에 표시됩니다"
            />
          )
        ) : // 일반 계약서 리스트
        filteredContracts.length > 0 ? (
          <div className="space-y-6">
            {sortedInProgress.length > 0 && (
              <div>
                <h3 className="text-[14px] font-semibold text-gray-500 mb-3">
                  진행 중
                </h3>
                <div className="space-y-3">
                  {sortedInProgress.map((contract) => (
                    <ContractCard
                      key={contract.id}
                      contract={contract}
                      isEditMode={isEditMode}
                      isSelected={selectedIds.has(contract.id)}
                      onSelect={toggleSelect}
                      onEdit={handleEditContract}
                    />
                  ))}
                </div>
              </div>
            )}

            {sortedCompleted.length > 0 && (
              <div>
                <h3 className="text-[14px] font-semibold text-gray-500 mb-3">
                  완료
                </h3>
                <div className="space-y-3">
                  {sortedCompleted.map((contract) => (
                    <ContractCard
                      key={contract.id}
                      contract={contract}
                      isEditMode={isEditMode}
                      isSelected={selectedIds.has(contract.id)}
                      onSelect={toggleSelect}
                      onEdit={handleEditContract}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
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
            title={
              selectedTab === 'all'
                ? '아직 계약서가 없어요'
                : '이 폴더에 계약서가 없어요'
            }
            description={
              selectedTab === 'all'
                ? '첫 번째 계약서를 작성해보세요'
                : '계약서를 이 폴더로 이동해보세요'
            }
          />
        )}
      </div>

      {/* Notification Sheet */}
      <NotificationSheet
        isOpen={isNotificationSheetOpen}
        onClose={() => setIsNotificationSheetOpen(false)}
        notifications={notifications}
        onNotificationsUpdate={handleNotificationsUpdate}
        userRole="employer"
      />

      {/* Menu Sheet */}
      <MenuSheet
        isOpen={isMenuSheetOpen}
        onClose={() => setIsMenuSheetOpen(false)}
        userName={profile.name}
        userEmail={profile.email}
        userRole="employer"
        isGuestMode={isGuestMode}
      />

      {/* Folder Modal */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        folders={foldersForModal}
        unfiledCount={unfiledCount}
        onCreateFolder={handleCreateFolder}
        onUpdateFolder={handleUpdateFolder}
        onDeleteFolder={handleDeleteFolder}
        isGuestMode={isGuestMode}
      />

      {/* Move Folder Sheet */}
      <MoveFolderSheet
        isOpen={isMoveFolderSheetOpen}
        onClose={() => setIsMoveFolderSheetOpen(false)}
        folders={foldersForModal}
        selectedCount={selectedIds.size}
        onMoveToFolder={handleMoveToFolder}
        onCreateFolder={handleCreateFolder}
      />

      {/* Draft Resume Sheet */}
      <BottomSheet
        isOpen={isDraftSheetOpen}
        onClose={() => setIsDraftSheetOpen(false)}
        title="작성 중인 계약서가 있어요"
      >
        <div className="space-y-6">
          <div className="bg-amber-50 rounded-2xl p-4">
            <div className="flex gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <p className="text-[15px] font-medium text-amber-800 mb-1">
                  {draftData.workerName
                    ? `${draftData.workerName}님 계약서`
                    : '임시저장된 계약서'}
                </p>
                <p className="text-[14px] text-amber-700">
                  {draftStep}단계까지 작성했어요
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleStartNew}
              className="flex-1 py-4 rounded-2xl font-semibold text-lg bg-gray-100 text-gray-700"
            >
              처음부터
            </button>
            <button
              onClick={handleContinueDraft}
              className="flex-1 py-4 rounded-2xl font-semibold text-lg bg-blue-500 text-white"
            >
              이어서 작성
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Delete Confirm Sheet */}
      <ConfirmSheet
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="계약서를 삭제할까요?"
        description={`${selectedIds.size}개 계약서가 휴지통으로 이동해요.\n30일 후 자동으로 영구 삭제됩니다.`}
        confirmLabel="삭제하기"
        variant="danger"
        onConfirm={handleDelete}
      />

      {/* Permanent Delete Confirm Sheet */}
      <ConfirmSheet
        isOpen={isPermanentDeleteConfirmOpen}
        onClose={() => setIsPermanentDeleteConfirmOpen(false)}
        title="영구 삭제할까요?"
        description={`${selectedIds.size}개 계약서가 완전히 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="영구 삭제"
        variant="danger"
        onConfirm={handlePermanentDelete}
      />

      {/* Toast */}
      <Toast
        message={toastMessage}
        variant={toastVariant}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

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
