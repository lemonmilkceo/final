'use client';

import { useState, useTransition } from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { FOLDER_COLORS } from './FolderModal';

interface Folder {
  id: string;
  name: string;
  color: string;
}

interface MoveFolderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  selectedCount: number;
  onMoveToFolder: (folderId: string | null) => Promise<{ success: boolean; error?: string }>;
  onCreateFolder: (name: string, color: string) => Promise<{ success: boolean; error?: string; data?: { id: string } }>;
}

export default function MoveFolderSheet({
  isOpen,
  onClose,
  folders,
  selectedCount,
  onMoveToFolder,
  onCreateFolder,
}: MoveFolderSheetProps) {
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState<string>(FOLDER_COLORS[0].value);
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

  const handleClose = () => {
    setMode('list');
    setFolderName('');
    setFolderColor(FOLDER_COLORS[0].value);
    onClose();
  };

  const handleMoveToFolder = (folderId: string | null) => {
    startTransition(async () => {
      const result = await onMoveToFolder(folderId);
      if (result.success) {
        showToastMessage(
          folderId ? '폴더로 이동했어요 📁' : '폴더에서 해제했어요',
          'success'
        );
        handleClose();
      } else {
        showToastMessage(result.error || '이동에 실패했어요', 'error');
      }
    });
  };

  const handleCreateAndMove = () => {
    if (!folderName.trim()) {
      showToastMessage('폴더 이름을 입력해주세요', 'error');
      return;
    }

    startTransition(async () => {
      const createResult = await onCreateFolder(folderName.trim(), folderColor);
      if (createResult.success && createResult.data?.id) {
        const moveResult = await onMoveToFolder(createResult.data.id);
        if (moveResult.success) {
          showToastMessage('새 폴더로 이동했어요 📁', 'success');
          handleClose();
        } else {
          showToastMessage(moveResult.error || '이동에 실패했어요', 'error');
        }
      } else {
        showToastMessage(createResult.error || '폴더 생성에 실패했어요', 'error');
      }
    });
  };

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={handleClose}
        title={mode === 'list' ? '폴더로 이동' : '새 폴더 만들기'}
      >
        {mode === 'list' && (
          <div className="space-y-3">
            {/* 새 폴더 만들기 */}
            <button
              onClick={() => setMode('create')}
              className="w-full flex items-center gap-3 p-4 border-2 border-blue-500 rounded-2xl text-blue-500 font-medium"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span>새 폴더 만들기</span>
            </button>

            {/* 전체 (폴더 해제) */}
            <button
              onClick={() => handleMoveToFolder(null)}
              disabled={isPending}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-2xl active:bg-gray-100 disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-gray-700 font-medium">전체 (폴더 해제)</span>
            </button>

            {/* 폴더 목록 */}
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleMoveToFolder(folder.id)}
                disabled={isPending}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-2xl active:bg-gray-100 disabled:opacity-50"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${folder.color}20` }}
                >
                  <svg
                    className="w-5 h-5"
                    style={{ color: folder.color }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">{folder.name}</span>
              </button>
            ))}

            {folders.length === 0 && (
              <p className="text-center text-gray-400 text-[14px] py-4">
                아직 폴더가 없어요
              </p>
            )}
          </div>
        )}

        {mode === 'create' && (
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
                placeholder="폴더 이름"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[15px] focus:outline-none focus:border-blue-500"
                maxLength={20}
              />
            </div>

            {/* 폴더 색상 */}
            <div>
              <label className="block text-[14px] text-gray-600 mb-2">색상</label>
              <div className="flex gap-3">
                {FOLDER_COLORS.slice(0, 6).map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setFolderColor(color.value)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      folderColor === color.value
                        ? 'ring-2 ring-offset-2 ring-blue-500'
                        : ''
                    }`}
                    style={{ backgroundColor: `${color.value}20` }}
                    title={color.name}
                  >
                    <svg
                      className="w-6 h-6"
                      style={{ color: color.value }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setMode('list')}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleCreateAndMove}
                loading={isPending}
                className="flex-1"
              >
                만들기
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

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
