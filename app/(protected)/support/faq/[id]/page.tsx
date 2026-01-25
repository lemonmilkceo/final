'use client';

import { useParams, useRouter } from 'next/navigation';
import { getFAQById } from '@/lib/constants/faqData';
import { SUPPORT_ROUTES } from '@/lib/constants/routes';

export default function FAQDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const faq = getFAQById(id);

  if (!faq) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">FAQ를 찾을 수 없습니다.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-500 font-medium"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <header className="bg-white px-5 py-4 sticky top-0 z-40 safe-top border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 -ml-2 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-[18px] font-bold text-gray-900">FAQ</h1>
        </div>
      </header>

      {/* FAQ 내용 */}
      <div className="px-5 py-6">
        <h2 className="text-[18px] font-bold text-gray-900 leading-relaxed mb-6">
          {faq.question}
        </h2>
        
        <div className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">
          {faq.answer}
        </div>
      </div>

      {/* 추가 문의하기 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 safe-bottom">
        <button
          onClick={() => router.push(SUPPORT_ROUTES.CHAT)}
          className="w-full py-4 border-2 border-blue-500 text-blue-500 rounded-2xl flex items-center justify-center gap-2 font-semibold active:bg-blue-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          추가 문의하기
        </button>
      </div>
    </div>
  );
}
