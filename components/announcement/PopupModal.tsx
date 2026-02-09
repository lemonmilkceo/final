'use client';

import { useState, useEffect } from 'react';
import { Announcement, markAnnouncementViewed } from '@/app/actions/announcement';

interface PopupModalProps {
  announcement: Announcement;
  onClose: () => void;
}

export default function PopupModal({ announcement, onClose }: PopupModalProps) {
  const [dontShowToday, setDontShowToday] = useState(false);

  const handleClose = async () => {
    if (dontShowToday) {
      // 오늘 하루 보지 않기 - localStorage에 저장
      const today = new Date().toDateString();
      const dismissedKey = `popup_dismissed_${announcement.id}`;
      localStorage.setItem(dismissedKey, today);
      
      // 서버에도 기록
      await markAnnouncementViewed(announcement.id, true);
    }
    onClose();
  };

  const handleLinkClick = () => {
    if (announcement.link_url) {
      window.open(announcement.link_url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-4">
          <h3 className="text-[18px] font-bold text-white">{announcement.title}</h3>
        </div>

        {/* 본문 */}
        <div className="px-5 py-6">
          <p className="text-[15px] text-gray-700 whitespace-pre-wrap leading-relaxed">
            {announcement.content}
          </p>
        </div>

        {/* 링크 버튼 (있는 경우) */}
        {announcement.link_url && (
          <div className="px-5 pb-4">
            <button
              onClick={handleLinkClick}
              className="w-full py-3 bg-blue-500 text-white text-[15px] font-semibold rounded-xl active:bg-blue-600 transition-colors"
            >
              {announcement.link_text || '자세히 보기'}
            </button>
          </div>
        )}

        {/* 하단 옵션 */}
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-[13px] text-gray-500">오늘 하루 보지 않기</span>
          </label>
          
          <button
            onClick={handleClose}
            className="w-full py-3 bg-gray-100 text-gray-700 text-[15px] font-medium rounded-xl active:bg-gray-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

interface PopupContainerProps {
  announcements: Announcement[];
}

export function PopupContainer({ announcements }: PopupContainerProps) {
  const [currentPopup, setCurrentPopup] = useState<Announcement | null>(null);
  const [popupQueue, setPopupQueue] = useState<Announcement[]>([]);

  useEffect(() => {
    // 팝업 타입만 필터링
    const popups = announcements.filter((a) => a.type === 'popup');
    
    // 오늘 이미 본 팝업 제외
    const today = new Date().toDateString();
    const filteredPopups = popups.filter((popup) => {
      const dismissedKey = `popup_dismissed_${popup.id}`;
      const dismissedDate = localStorage.getItem(dismissedKey);
      return dismissedDate !== today;
    });

    if (filteredPopups.length > 0) {
      setCurrentPopup(filteredPopups[0]);
      setPopupQueue(filteredPopups.slice(1));
    }
  }, [announcements]);

  const handleClose = () => {
    if (popupQueue.length > 0) {
      setCurrentPopup(popupQueue[0]);
      setPopupQueue(popupQueue.slice(1));
    } else {
      setCurrentPopup(null);
    }
  };

  if (!currentPopup) return null;

  return <PopupModal announcement={currentPopup} onClose={handleClose} />;
}
