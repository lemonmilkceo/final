import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function EmployerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single();

  // 역할 체크
  if (profile?.role !== 'employer') {
    redirect('/worker');
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-gray-500 text-sm">안녕하세요</p>
          <h1 className="text-xl font-bold text-gray-900">
            {profile?.name || '사장'}님
          </h1>
        </div>
        <Link
          href="/auth/signout"
          className="text-sm text-gray-500 underline"
        >
          로그아웃
        </Link>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          🎉 사업자 대시보드
        </h2>
        <p className="text-gray-500 mb-4">
          Phase 4에서 계약서 목록, 작성 기능이 구현됩니다.
        </p>
        <div className="space-y-2 text-sm text-gray-400">
          <p>✅ 카카오 로그인 완료</p>
          <p>✅ 역할 선택 완료</p>
          <p>⏳ 계약서 작성 기능 (Phase 4)</p>
        </div>
      </div>
    </div>
  );
}
