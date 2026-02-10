'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SUPPORT_ROUTES } from '@/lib/constants/routes';
import { useGuestStore } from '@/stores/guestStore';
import { createClient } from '@/lib/supabase/client';

export default function SupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isGuest: isGuestFromStore } = useGuestStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // 실제 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      // 로그인된 사용자이고 category 파라미터가 있으면 바로 문의 작성 페이지로 이동
      const category = searchParams.get('category');
      if (user && category) {
        router.replace(`/support/inquiry/new?category=${category}`);
      }
    };
    checkAuth();
  }, [searchParams, router]);

  // 실제 로그인 상태와 게스트 스토어 모두 확인
  // 인증된 사용자면 게스트가 아님
  const isGuest = isAuthenticated === false || (isAuthenticated === null && isGuestFromStore);

  const handleInquiryClick = (e: React.MouseEvent) => {
    if (isGuest) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <header className="bg-blue-500 text-white px-5 pt-12 pb-8 safe-top">
        <h1 className="text-[24px] font-bold">고객센터</h1>
        <p className="text-[15px] text-blue-100 mt-1">무엇을 도와드릴까요?</p>
      </header>

      {/* 메뉴 카드들 */}
      <div className="px-5 py-6 space-y-4">
        {/* 1:1 문의하기 */}
        <Link href="/support/inquiry/new" onClick={handleInquiryClick}>
          <div className="bg-white rounded-2xl p-5 shadow-sm active:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-[17px] font-bold text-gray-900">1:1 문의하기</h2>
                <p className="text-[14px] text-gray-500 mt-0.5">
                  {isGuest ? '로그인 후 이용 가능해요' : '궁금한 점을 직접 물어보세요'}
                </p>
              </div>
              {isGuest ? (
                <span className="text-[12px] text-orange-500 font-medium">로그인 필요</span>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          </div>
        </Link>

        {/* 내 문의 내역 */}
        <Link href="/support/inquiry" onClick={handleInquiryClick}>
          <div className="bg-white rounded-2xl p-5 shadow-sm active:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-[17px] font-bold text-gray-900">내 문의 내역</h2>
                <p className="text-[14px] text-gray-500 mt-0.5">
                  {isGuest ? '로그인 후 이용 가능해요' : '문의 현황과 답변을 확인하세요'}
                </p>
              </div>
              {isGuest ? (
                <span className="text-[12px] text-orange-500 font-medium">로그인 필요</span>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          </div>
        </Link>

        {/* 자주 묻는 질문 */}
        <Link href={SUPPORT_ROUTES.FAQ}>
          <div className="bg-white rounded-2xl p-5 shadow-sm active:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-[17px] font-bold text-gray-900">자주 묻는 질문</h2>
                <p className="text-[14px] text-gray-500 mt-0.5">FAQ에서 답변을 찾아보세요</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* 이메일 문의 (하단으로 이동) */}
        <div className="pt-2">
          <p className="text-[13px] text-gray-400 mb-3 px-1">다른 방법으로 문의하기</p>
          <a href="mailto:lemonmilkceo@gmail.com?subject=[싸인해주세요] 문의드립니다">
            <div className="bg-white rounded-2xl p-4 shadow-sm active:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-[15px] font-semibold text-gray-900">이메일 문의</h2>
                  <p className="text-[13px] text-gray-500">lemonmilkceo@gmail.com</p>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* 운영시간 안내 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-4 safe-bottom">
        <p className="text-center text-[14px] text-gray-500">
          운영시간: 평일 10:00 - 18:00
        </p>
      </div>

      {/* 로그인 필요 모달 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-[18px] font-bold text-gray-900 mb-2">로그인이 필요해요</h3>
              <p className="text-[14px] text-gray-500">
                1:1 문의를 작성하려면 로그인해주세요.<br />
                답변도 로그인 후 확인할 수 있어요.
              </p>
            </div>
            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full py-3 bg-blue-500 text-white text-center text-[15px] font-semibold rounded-xl"
              >
                로그인하기
              </Link>
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full py-3 bg-gray-100 text-gray-700 text-[15px] font-medium rounded-xl"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
