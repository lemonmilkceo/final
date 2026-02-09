'use client';

import { Announcement } from '@/app/actions/announcement';

interface BannerProps {
  announcements: Announcement[];
}

export default function Banner({ announcements }: BannerProps) {
  // banner 타입만 필터링
  const banners = announcements.filter((a) => a.type === 'banner');

  if (banners.length === 0) return null;

  // 가장 우선순위 높은 배너 표시
  const banner = banners[0];

  const handleClick = () => {
    if (banner.link_url) {
      window.open(banner.link_url, '_blank');
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-5 text-white cursor-pointer active:opacity-90 transition-opacity"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-[16px] font-bold mb-1">{banner.title}</h3>
          <p className="text-[14px] text-white/80 line-clamp-2">{banner.content}</p>
          {banner.link_url && (
            <p className="text-[13px] text-white/90 font-medium mt-2 flex items-center gap-1">
              {banner.link_text || '자세히 보기'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </p>
          )}
        </div>
        <div className="text-4xl ml-4">🎉</div>
      </div>
    </div>
  );
}
