'use client';

import { useState, useTransition } from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import ConfirmSheet from '@/components/ui/ConfirmSheet';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';

// 폴더 색상 팔레트
export const FOLDER_COLORS = [
  { name: '블루', value: '#3B82F6' },
  { name: '그린', value: '#22C55E' },
  { name: '옐로우', value: '#EAB308' },
  { name: '오렌지', value: '#F97316' },
  { name: '레드', value: '#EF4444' },
  { name: '퍼플', value: '#A855F7' },
  { name: '핑크', value: '#EC4899' },
  { name: '그레이', value: '#6B7280' },
] as const;

export interface Folder {
  id: string;
  name: string;
  color: string;
  contractCount: number;
}

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  unfiledCount: number;
  onCreateFolder: (name: string, color: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateFolder: (id: string, name: string, color: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteFolder: (id: string) => Promise<{ success: boolean; error?: string }>;
  isGuestMode?: boolean;
}

export default function FolderModal({
  isOpen,
  onClose,
  folders,
  unfiledCount,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  isGuestMode = false,
}: FolderModalProps) {
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState<string>(FOLDER_COLORS[0].value);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success');

  const showToastMessage = (message: string, variant: 'success' | 'error') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };

  const resetForm = () => {
    setFolderName('');
    setFolderColor(FOLDER_COLORS[0].value);
    setSelectedFolder(null);
    setMode('list');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleOpenCreate = () => {
    if (isGuestMode) {
      showToastMessage('게스트 모드에서는 폴더를 만들 수 없어요', 'error');
      return;
    }
    setFolderName('');
    setFolderColor(FOLDER_COLORS[0].value);
    setMode('create');
  };

  const handleOpenEdit = (folder: Folder) => {
    if (isGuestMode) {
      showToastMessage('게스트 모드에서는 폴더를 수정할 수 없어요', 'error');
      return;
    }
    setSelectedFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color);
    setMode('edit');
  };

  const handleCreate = () => {
    if (!folderName.trim()) {
      showToastMessage('폴더 이름을 입력해주세요', 'error');
      return;
    }

    startTransition(async () => {
      const result = await onCreateFolder(folderName.trim(), folderColor);
      if (result.success) {
        showToastMessage('폴더가 생성됐어요 📁', 'success');
        resetForm();
      } else {
        showToastMessage(result.error || '폴더 생성에 실패했어요', 'error');
      }
    });
  };

  const handleUpdate = () => {
    if (!selectedFolder || !folderName.trim()) {
      showToastMessage('폴더 이름을 입력해주세요', 'error');
      return;
    }

    startTransition(async () => {
      const result = await onUpdateFolder(selectedFolder.id, folderName.trim(), folderColor);
      if (result.success) {
        showToastMessage('폴더가 수정됐어요', 'success');
        resetForm();
      } else {
        showToastMessage(result.error || '폴더 수정에 실패했어요', 'error');
      }
    });
  };

  const handleDelete = () => {
    if (!selectedFolder) return;

    startTransition(async () => {
      const result = await onDeleteFolder(selectedFolder.id);
      if (result.success) {
        showToastMessage('폴더가 삭제됐어요', 'success');
        setIsDeleteConfirmOpen(false);
        resetForm();
      } else {
        showToastMessage(result.error || '폴더 삭제에 실패했어요', 'error');
      }
    });
  };

  const openDeleteConfirm = (folder: Folder) => {
    if (isGuestMode) {
      showToastMessage('게스트 모드에서는 폴더를 삭제할 수 없어요', 'error');
      return;
    }
    setSelectedFolder(folder);
    setIsDeleteConfirmOpen(true);
  };

  // 모달 제목
  const getTitle = () => {
    switch (mode) {
      case 'create': return '새 폴더 만들기';
      case 'edit': return '폴더 수정';
      default: return '폴더 관리';
    }
  };

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={handleClose}
        title={getTitle()}
      >
        {mode === 'list' && (
          <div className="space-y-4">
            {/* 미분류 */}
            <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center text-lg">
                  📋
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-gray-900">미분류</p>
                  <p className="text-[13px] text-gray-500">{unfiledCount}개 계약서</p>
                </div>
              </div>
            </div>

            {/* 폴더 목록 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-semibold text-gray-500">
                  내 폴더 ({folders.length})
                </h3>
              </div>

              {folders.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-3 block">📂</span>
                  <p className="text-[14px] text-gray-500 mb-1">아직 폴더가 없어요</p>
                  <p className="text-[13px] text-gray-400">폴더를 만들어 계약서를 정리해보세요</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="bg-gray-50 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: folder.color }}
                        >
                          📁
                        </span>
                        <div>
                          <p className="text-[14px] font-medium text-gray-900">{folder.name}</p>
                          <p className="text-[12px] text-gray-500">{folder.contractCount}개</p>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenEdit(folder)}
                          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(folder)}
                          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 새 폴더 만들기 버튼 */}
            <Button onClick={handleOpenCreate} variant="secondary">
              새 폴더 만들기 +
            </Button>
          </div>
        )}

        {(mode === 'create' || mode === 'edit') && (
          <div className="space-y-5">
            {/* 뒤로가기 */}
            <button
              onClick={() => setMode('list')}
              className="flex items-center gap-1 text-[14px] text-gray-500 -mt-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              목록으로
            </button>

            {/* 폴더 이름 */}
            <div>
              <label className="block text-[14px] text-gray-600 mb-2">폴더 이름</label>
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="예: 카페 알바"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={20}
              />
            </div>

            {/* 폴더 색상 */}
            <div>
              <label className="block text-[14px] text-gray-600 mb-2">폴더 색상</label>
              <div className="flex gap-2 flex-wrap">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setFolderColor(color.value)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      folderColor === color.value
                        ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {folderColor === color.value && (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 저장 버튼 */}
            <Button
              onClick={mode === 'create' ? handleCreate : handleUpdate}
              loading={isPending}
            >
              {mode === 'create' ? '폴더 만들기' : '저장하기'}
            </Button>
          </div>
        )}
      </BottomSheet>

      {/* 삭제 확인 시트 */}
      <ConfirmSheet
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setSelectedFolder(null);
        }}
        title="폴더를 삭제할까요?"
        description={`"${selectedFolder?.name}" 폴더를 삭제해요.\n폴더 내 계약서는 미분류로 이동해요.`}
        confirmLabel="삭제하기"
        cancelLabel="취소"
        onConfirm={handleDelete}
        confirmVariant="error"
        isConfirmLoading={isPending}
      />

      {/* Toast */}
      <Toast
        message={toastMessage}
        variant={toastVariant}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  );
}
