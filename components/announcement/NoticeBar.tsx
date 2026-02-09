'use client';

import { useState } from 'react';
import { Announcement } from '@/app/actions/announcement';

interface NoticeBarProps {
  announcements: Announcement[];
}

export default function NoticeBar({ announcements }: NoticeBarProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // notice 타입만 필터링하고 dismissed 제외
  const notices = announcements
    .filter((a) => a.type === 'notice')
    .filter((a) => !dismissedIds.has(a.id));

  if (notices.length === 0) return null;

  // 가장 우선순위 높은 공지 하나만 표시
  const notice = notices[0];

  const handleDismiss = () => {
    setDismissedIds((prev) => new Set([...prev, notice.id]));
  };

  const handleClick = () => {
    if (notice.link_url) {
      window.open(notice.link_url, '_blank');
    }
  };

  return (
    <div className="bg-blue-500 text-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div 
          className="flex-1 flex items-center gap-2 cursor-pointer"
          onClick={handleClick}
        >
          <span className="text-lg">📢</span>
          <p className="text-[14px] font-medium line-clamp-1">
            {notice.title}
          </p>
          {notice.link_url && (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-blue-600 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
