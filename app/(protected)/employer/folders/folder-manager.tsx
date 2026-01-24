'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import BottomSheet from '@/components/ui/BottomSheet';
import ConfirmSheet from '@/components/ui/ConfirmSheet';
import Toast from '@/components/ui/Toast';
import { createFolder, updateFolder, deleteFolder } from './actions';
import clsx from 'clsx';

interface Folder {
  id: string;
  name: string;
  color: string;
  contractCount: number;
  created_at: string;
}

interface FolderManagerProps {
  folders: Folder[];
  unfiledCount: number;
}

export default function FolderManager({
  folders,
  unfiledCount,
}: FolderManagerProps) {
  const router = useRouter();
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success');

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      setToastMessage('폴더 이름을 입력해주세요');
      setToastVariant('error');
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await createFolder(folderName);
      if (result.success) {
        setIsCreateSheetOpen(false);
        setFolderName('');
        setToastMessage('폴더가 생성됐어요 📁');
        setToastVariant('success');
        setShowToast(true);
        router.refresh();
      } else {
        setToastMessage(result.error || '폴더 생성에 실패했어요');
        setToastVariant('error');
        setShowToast(true);
      }
    } catch {
      setToastMessage('폴더 생성 중 오류가 발생했어요');
      setToastVariant('error');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditFolder = async () => {
    if (!selectedFolder) return;

    setIsLoading(true);
    try {
      const result = await updateFolder(selectedFolder.id, folderName);
      if (result.success) {
        setIsEditSheetOpen(false);
        setSelectedFolder(null);
        setFolderName('');
        setToastMessage('폴더가 수정됐어요');
        setToastVariant('success');
        setShowToast(true);
        router.refresh();
      } else {
        setToastMessage(result.error || '폴더 수정에 실패했어요');
        setToastVariant('error');
        setShowToast(true);
      }
    } catch {
      setToastMessage('폴더 수정 중 오류가 발생했어요');
      setToastVariant('error');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!selectedFolder) return;

    setIsLoading(true);
    try {
      const result = await deleteFolder(selectedFolder.id);
      if (result.success) {
        setIsDeleteSheetOpen(false);
        setSelectedFolder(null);
        setToastMessage('폴더가 삭제됐어요');
        setToastVariant('success');
        setShowToast(true);
        router.refresh();
      } else {
        setToastMessage(result.error || '폴더 삭제에 실패했어요');
        setToastVariant('error');
        setShowToast(true);
      }
    } catch {
      setToastMessage('폴더 삭제 중 오류가 발생했어요');
      setToastVariant('error');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditSheet = (folder: Folder) => {
    setSelectedFolder(folder);
    setFolderName(folder.name);
    setIsEditSheetOpen(true);
  };

  const openDeleteSheet = (folder: Folder) => {
    setSelectedFolder(folder);
    setIsDeleteSheetOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      <PageHeader title="폴더 관리" />

      <div className="flex-1 p-5">
        {/* 미분류 */}
        <div className="bg-white rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg">
              📋
            </span>
            <div>
              <p className="text-[15px] font-semibold text-gray-900">미분류</p>
              <p className="text-[13px] text-gray-500">{unfiledCount}개 계약서</p>
            </div>
          </div>
        </div>

        {/* 폴더 목록 */}
        <h3 className="text-[14px] font-semibold text-gray-500 mb-3 px-1">
          내 폴더 ({folders.length})
        </h3>

        {folders.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl mb-4 block">📂</span>
            <p className="text-[15px] text-gray-500 mb-2">아직 폴더가 없어요</p>
            <p className="text-[13px] text-gray-400">
              폴더를 만들어 계약서를 정리해보세요
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="bg-white rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg"
                    style={{ backgroundColor: folder.color }}
                  >
                    📁
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-gray-900">
                      {folder.name}
                    </p>
                    <p className="text-[13px] text-gray-500">
                      {folder.contractCount}개 계약서
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditSheet(folder)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => openDeleteSheet(folder)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 폴더 추가 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pt-3 pb-4 safe-bottom">
        <Button onClick={() => setIsCreateSheetOpen(true)}>
          새 폴더 만들기 +
        </Button>
      </div>

      {/* 폴더 생성 시트 */}
      <BottomSheet
        isOpen={isCreateSheetOpen}
        onClose={() => {
          setIsCreateSheetOpen(false);
          setFolderName('');
        }}
        title="새 폴더 만들기"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-[14px] text-gray-600 mb-2">
              폴더 이름
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="예: 카페 알바"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={20}
            />
          </div>

          <Button onClick={handleCreateFolder} loading={isLoading}>
            폴더 만들기
          </Button>
        </div>
      </BottomSheet>

      {/* 폴더 수정 시트 */}
      <BottomSheet
        isOpen={isEditSheetOpen}
        onClose={() => {
          setIsEditSheetOpen(false);
          setSelectedFolder(null);
          setFolderName('');
        }}
        title="폴더 수정"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-[14px] text-gray-600 mb-2">
              폴더 이름
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="폴더 이름"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={20}
            />
          </div>

          <Button onClick={handleEditFolder} loading={isLoading}>
            저장하기
          </Button>
        </div>
      </BottomSheet>

      {/* 폴더 삭제 확인 시트 */}
      <ConfirmSheet
        isOpen={isDeleteSheetOpen}
        onClose={() => {
          setIsDeleteSheetOpen(false);
          setSelectedFolder(null);
        }}
        title="폴더를 삭제할까요?"
        description={`"${selectedFolder?.name}" 폴더를 삭제해요.\n폴더 내 계약서는 미분류로 이동해요.`}
        confirmLabel="삭제하기"
        cancelLabel="취소"
        onConfirm={handleDeleteFolder}
        confirmVariant="error"
        isConfirmLoading={isLoading}
      />

      {/* 토스트 */}
      <Toast
        message={toastMessage}
        variant={toastVariant}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
