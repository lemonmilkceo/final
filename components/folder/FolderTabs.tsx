'use client';

import { useRef, useEffect } from 'react';
import clsx from 'clsx';

export type TabType = 'all' | 'trash' | string; // string for folder IDs

interface Folder {
  id: string;
  name: string;
  color: string;
  contractCount: number;
}

interface FolderTabsProps {
  folders: Folder[];
  deletedCount: number;
  selectedTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenFolderManager: () => void;
  totalCount: number;
}

export default function FolderTabs({
  folders,
  deletedCount,
  selectedTab,
  onSelectTab,
  onOpenFolderManager,
  totalCount,
}: FolderTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedTabRef = useRef<HTMLButtonElement>(null);

  // 선택된 탭으로 스크롤
  useEffect(() => {
    if (selectedTabRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const tab = selectedTabRef.current;
      const containerWidth = container.offsetWidth;
      const tabLeft = tab.offsetLeft;
      const tabWidth = tab.offsetWidth;

      // 탭이 중앙에 오도록 스크롤
      const scrollPosition = tabLeft - containerWidth / 2 + tabWidth / 2;
      container.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
    }
  }, [selectedTab]);

  return (
    <div className="bg-white border-b border-gray-100">
      <div
        ref={scrollRef}
        className="flex items-center gap-2 px-5 py-3 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* 전체 탭 */}
        <button
          ref={selectedTab === 'all' ? selectedTabRef : null}
          onClick={() => onSelectTab('all')}
          className={clsx(
            'flex-shrink-0 px-4 py-2 rounded-full text-[14px] font-medium transition-colors',
            selectedTab === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          전체 ({totalCount})
        </button>

        {/* 폴더 탭들 */}
        {folders.map((folder) => (
          <button
            key={folder.id}
            ref={selectedTab === folder.id ? selectedTabRef : null}
            onClick={() => onSelectTab(folder.id)}
            className={clsx(
              'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-medium transition-colors',
              selectedTab === folder.id
                ? 'text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
            style={{
              backgroundColor: selectedTab === folder.id ? folder.color : undefined,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: selectedTab === folder.id ? 'white' : folder.color,
              }}
            />
            {folder.name} ({folder.contractCount})
          </button>
        ))}

        {/* 휴지통 탭 (삭제된 계약서가 있을 때만) */}
        {deletedCount > 0 && (
          <button
            ref={selectedTab === 'trash' ? selectedTabRef : null}
            onClick={() => onSelectTab('trash')}
            className={clsx(
              'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-medium transition-colors',
              selectedTab === 'trash'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            🗑️ 휴지통 ({deletedCount})
          </button>
        )}

        {/* 폴더 관리 버튼 */}
        <button
          onClick={onOpenFolderManager}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors"
          aria-label="폴더 관리"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
