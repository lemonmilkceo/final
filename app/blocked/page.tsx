'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function BlockedPage() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">🚫</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            계정이 차단되었습니다
          </h1>

          <p className="text-gray-600 mb-6">
            귀하의 계정이 관리자에 의해 일시적으로 차단되었습니다.
            <br />
            문의사항이 있으시면 고객센터로 연락해주세요.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">고객센터</p>
            <a
              href="mailto:support@signplease.kr"
              className="text-blue-600 font-medium hover:underline"
            >
              support@signplease.kr
            </a>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
