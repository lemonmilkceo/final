import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '싸인해주세요 - 간편한 근로계약서',
  description: '계약서 작성부터 서명까지 한 곳에서 간편하게',
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="container-mobile">{children}</div>
    </div>
  );
}
