'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import MenuSheet from '@/components/layout/MenuSheet';
import ContractCard from '@/components/contract/ContractCard';
import EmptyState from '@/components/shared/EmptyState';
import NotificationSheet from '@/components/notification/NotificationSheet';
import FolderModal from '@/components/folder/FolderModal';
import MoveFolderSheet from '@/components/folder/MoveFolderSheet';
import Toast from '@/components/ui/Toast';
import { ROUTES } from '@/lib/constants/routes';
import { getNotifications, getUnreadNotificationCount } from '@/app/actions/notifications';
import { createFolder, updateFolder, deleteFolder, moveContractToFolder } from './folders/actions';
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
  folder_id: string | null;
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
  credits: number;
  contracts: DashboardContract[];
  folders?: Folder[];
  unfiledCount?: number;
  isGuestMode?: boolean;
}

export default function EmployerDashboard({
  profile,
  credits,
  contracts,
  folders = [],
  unfiledCount = 0,
  isGuestMode = false,
}: EmployerDashboardProps) {
  const router = useRouter();
  
  // UI 상태
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isMoveFolderSheetOpen, setIsMoveFolderSheetOpen] = useState(false);
  
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

  const showToastMessage = (message: string, variant: 'success' | 'error') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };

  // 삭제된 계약서 제외
  const activeContracts = contracts.filter((c) => c.status !== 'deleted');
  
  // 진행 중 (draft + pending)
  const inProgressContracts = activeContracts.filter(
    (c) => c.status === 'draft' || c.status === 'pending'
  );
  
  // 완료
  const completedContracts = activeContracts.filter((c) => c.status === 'completed');

  // 정렬된 계약서
  const sortedInProgress = useMemo(() => {
    const sorted = [...inProgressContracts];
    if (sortType === 'latest') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      sorted.sort((a, b) => (a.work_location || '').localeCompare(b.work_location || ''));
    }
    return sorted;
  }, [inProgressContracts, sortType]);

  const sortedCompleted = useMemo(() => {
    const sorted = [...completedContracts];
    if (sortType === 'latest') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      sorted.sort((a, b) => (a.work_location || '').localeCompare(b.work_location || ''));
    }
    return sorted;
  }, [completedContracts, sortType]);

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

  const handleNotificationsUpdate = async () => {
    const count = await getUnreadNotificationCount();
    setUnreadCount(count);
  };

  // 계약서 작성
  const handleCreateContract = () => {
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
    const allIds = activeContracts.map((c) => c.id);
    setSelectedIds(new Set(allIds));
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
    
    // TODO: 삭제 API 호출 (status를 deleted로 변경)
    showToastMessage(`${selectedIds.size}개 계약서가 휴지통으로 이동했어요`, 'success');
    setSelectedIds(new Set());
    setIsEditMode(false);
  };

  // 폴더 CRUD
  const handleCreateFolder = async (name: string, color: string) => {
    const result = await createFolder(name, color);
    return result;
  };

  const handleUpdateFolder = async (id: string, name: string, color: string) => {
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
              onClick={() => setSortType(sortType === 'latest' ? 'location' : 'latest')}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium border',
                'bg-blue-500 text-white border-blue-500'
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              {sortType === 'latest' ? '최신순' : '가게별'}
            </button>
            
            <button
              onClick={() => selectedIds.size > 0 && setIsMoveFolderSheetOpen(true)}
              disabled={selectedIds.size === 0}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium border',
                selectedIds.size > 0
                  ? 'border-gray-300 text-gray-700'
                  : 'border-gray-200 text-gray-400'
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              이동
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
              삭제
            </button>
          </div>
        </header>
      ) : (
        /* 기본 헤더 */
        <header className="bg-white px-5 py-4 sticky top-0 z-40 safe-top">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-gray-500">환영합니다</span>
            <div className="flex items-center gap-2">
              {/* 알림 */}
              <button
                onClick={() => setIsNotificationSheetOpen(true)}
                className="relative w-10 h-10 flex items-center justify-center"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-[11px] text-white flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {/* 메뉴 */}
              <button
                onClick={() => setIsMenuSheetOpen(true)}
                className="w-10 h-10 flex items-center justify-center"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </header>
      )}

      <div className="px-5">
        {/* 닉네임 + 크레딧 (편집 모드 아닐 때만) */}
        {!isEditMode && (
          <>
            <h1 className="text-[28px] font-bold text-gray-900 mt-2 mb-3">
              {profile.name}님 👋
            </h1>
            
            {/* 크레딧 뱃지 */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full mb-6">
              <span className="text-amber-500">🎟️</span>
              <span className="text-[14px] font-semibold text-amber-700">
                {credits}건 남음
              </span>
            </div>
          </>
        )}

        {/* 새 계약서 작성 버튼 */}
        <button
          onClick={handleCreateContract}
          className="w-full py-4 bg-blue-500 text-white text-[16px] font-bold rounded-2xl flex items-center justify-center gap-2 active:bg-blue-600 mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 계약서 작성
        </button>

        {/* 전체 계약서 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-bold text-gray-900">전체 계약서</h2>
            {!isEditMode && (
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

        {/* 계약서 리스트 */}
        {activeContracts.length > 0 ? (
          <div className="space-y-6">
            {/* 진행 중 */}
            {sortedInProgress.length > 0 && (
              <div>
                <h3 className="text-[14px] font-semibold text-gray-500 mb-3">진행 중</h3>
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

            {/* 완료 */}
            {sortedCompleted.length > 0 && (
              <div>
                <h3 className="text-[14px] font-semibold text-gray-500 mb-3">완료</h3>
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
              <svg className="w-full h-full text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="아직 계약서가 없어요"
            description="첫 번째 계약서를 작성해보세요"
          />
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
        userRole="employer"
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

      {/* Toast */}
      <Toast
        message={toastMessage}
        variant={toastVariant}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
