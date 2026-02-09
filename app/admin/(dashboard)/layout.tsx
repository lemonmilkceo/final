import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import AdminSidebar from '@/components/admin/sidebar';
import { createAdminClient } from '@/lib/supabase/server';

async function getPendingRefundsCount(): Promise<number> {
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from('refund_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    return count || 0;
  } catch {
    return 0;
  }
}

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 서버에서 관리자 세션 검증
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  if (!token) {
    redirect('/admin/login');
  }

  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);
    await jwtVerify(token, secret);
  } catch {
    redirect('/admin/login');
  }

  const pendingRefunds = await getPendingRefundsCount();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pendingRefunds={pendingRefunds} />
      
      {/* 메인 콘텐츠 */}
      <main className="ml-56 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
