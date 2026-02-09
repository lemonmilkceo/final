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
  return <>{children}</>;
}
