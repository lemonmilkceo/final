import Link from 'next/link';
import { SUPPORT_ROUTES } from '@/lib/constants/routes';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-blue-500 text-white px-5 pt-12 pb-8 safe-top">
        <h1 className="text-[24px] font-bold">고객센터</h1>
        <p className="text-[15px] text-blue-100 mt-1">무엇을 도와드릴까요?</p>
      </header>

      {/* 메뉴 카드들 */}
      <div className="px-5 py-6 space-y-4">
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

        {/* 이메일 문의하기 */}
        <a href="mailto:lemonmilkceo@gmail.com?subject=[싸인해주세요] 문의드립니다">
          <div className="bg-white rounded-2xl p-5 shadow-sm active:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-[17px] font-bold text-gray-900">이메일 문의</h2>
                <p className="text-[14px] text-gray-500 mt-0.5">lemonmilkceo@gmail.com</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </a>
      </div>

      {/* 운영시간 안내 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-4 safe-bottom">
        <p className="text-center text-[14px] text-gray-500">
          운영시간: 평일 10:00 - 18:00
        </p>
      </div>
    </div>
  );
}
