'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import MenuSheet from '@/components/layout/MenuSheet';
import FAB from '@/components/layout/FAB';
import ContractCard from '@/components/contract/ContractCard';
import EmptyState from '@/components/shared/EmptyState';
import NotificationSheet from '@/components/notification/NotificationSheet';
import FolderModal from '@/components/folder/FolderModal';
import { ROUTES } from '@/lib/constants/routes';
import { getNotifications, getUnreadNotificationCount } from '@/app/actions/notifications';
import { createFolder, updateFolder, deleteFolder } from './folders/actions';
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
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 대기중 계약서 (draft + pending)
  const pendingContracts = contracts.filter(
    (c) => c.status === 'draft' || c.status === 'pending'
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

  const handleCreateContract = () => {
    router.push(ROUTES.EMPLOYER_CREATE_CONTRACT);
  };

  const handleFolderManage = () => {
    setIsFolderModalOpen(true);
  };

  // 폴더 CRUD 핸들러
  const handleCreateFolder = async (name: string, color: string) => {
    return await createFolder(name, color);
  };

  const handleUpdateFolder = async (id: string, name: string, color: string) => {
    return await updateFolder(id, name, color);
  };

  const handleDeleteFolder = async (id: string) => {
    return await deleteFolder(id);
  };

  // 폴더 데이터 변환 (FolderModal용)
  const foldersForModal = folders.map((f) => ({
    id: f.id,
    name: f.name,
    color: f.color || '#3B82F6',
    contractCount: f.contractCount || 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header - 닉네임 표시 */}
      <Header
        credits={credits}
        showNotification={true}
        showMenu={true}
        unreadCount={unreadCount}
        userName={profile.name}
        onNotificationClick={() => setIsNotificationSheetOpen(true)}
        onMenuClick={() => setIsMenuSheetOpen(true)}
      />

      {/* 대기중인 계약서 섹션 */}
      <section className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[18px] font-bold text-gray-900">
            대기중인 계약서
            <span className="ml-2 text-blue-500">{pendingContracts.length}</span>
          </h2>
        </div>

        {pendingContracts.length > 0 ? (
          <div className="space-y-3">
            {pendingContracts.slice(0, 5).map((contract) => (
              <ContractCard key={contract.id} contract={contract} />
            ))}
            {pendingContracts.length > 5 && (
              <button
                className="w-full py-3 text-center text-[15px] text-blue-500 font-medium bg-blue-50 rounded-xl active:bg-blue-100"
                onClick={() => {/* TODO: 대기중 계약서 전체보기 */}}
              >
                {pendingContracts.length - 5}개 더보기
              </button>
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
            title="아직 계약서가 없어요"
            description="첫 번째 계약서를 작성해보세요"
            actionLabel="계약서 작성하기"
            onAction={handleCreateContract}
          />
        )}
      </section>

      {/* 완료된 계약서 섹션 */}
      <section className="px-4 pt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[18px] font-bold text-gray-900">
            완료된 계약서
            <span className="ml-2 text-green-500">{completedContracts.length}</span>
          </h2>
          {/* 폴더 관리 버튼 */}
          <button
            onClick={handleFolderManage}
            className="flex items-center gap-1 text-[13px] text-gray-500 font-medium px-2 py-1 rounded-lg active:bg-gray-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span>폴더 관리</span>
          </button>
        </div>

        {/* 폴더 목록 (있을 경우) */}
        {folders.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2 -mx-4 px-4">
            <button className="flex-shrink-0 px-4 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-full">
              전체
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                className="flex-shrink-0 px-4 py-2 bg-gray-100 text-gray-700 text-[13px] font-medium rounded-full active:bg-gray-200"
              >
                {folder.name}
              </button>
            ))}
          </div>
        )}

        {completedContracts.length > 0 ? (
          <div className="space-y-3">
            {completedContracts.slice(0, 5).map((contract) => (
              <ContractCard key={contract.id} contract={contract} />
            ))}
            {completedContracts.length > 5 && (
              <button
                className="w-full py-3 text-center text-[15px] text-gray-500 font-medium bg-gray-100 rounded-xl active:bg-gray-200"
                onClick={() => {/* TODO: 완료 계약서 전체보기 */}}
              >
                {completedContracts.length - 5}개 더보기
              </button>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-[15px] text-gray-400">완료된 계약서가 없어요</p>
          </div>
        )}
      </section>

      {/* FAB */}
      <FAB onClick={handleCreateContract} />

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
    </div>
  );
}
