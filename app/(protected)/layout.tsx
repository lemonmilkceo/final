import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '싸인해주세요',
  description: '계약서 작성부터 서명까지 한 곳에서 간편하게',
};

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container-mobile">{children}</div>
    </div>
  );
}
