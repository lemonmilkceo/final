import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '관리자 | 싸인해주세요',
  description: '싸인해주세요 관리자 페이지',
  robots: 'noindex, nofollow', // 검색엔진 색인 방지
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 관리자 페이지는 container-mobile 스타일을 무시하고 전체 너비 사용
  return (
    <div className="admin-layout">
      <style>{`
        .container-mobile:has(.admin-layout) {
          max-width: 100% !important;
          margin: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          min-height: 100vh !important;
          background-color: #f9fafb !important;
        }
      `}</style>
      {children}
    </div>
  );
}
