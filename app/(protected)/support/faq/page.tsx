'use client';

import { useRouter } from 'next/navigation';
import { FAQ_DATA } from '@/lib/constants/faqData';
import { SUPPORT_ROUTES } from '@/lib/constants/routes';

export default function FAQListPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
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
          <h1 className="text-[18px] font-bold text-gray-900">자주 묻는 질문</h1>
        </div>
      </header>

      {/* FAQ 목록 */}
      <div className="px-5 py-4 space-y-3">
        {FAQ_DATA.map((faq) => (
          <button
            key={faq.id}
            onClick={() => router.push(SUPPORT_ROUTES.FAQ_DETAIL(faq.id))}
            className="w-full bg-white rounded-2xl p-5 text-left shadow-sm active:bg-gray-50 transition-colors"
          >
            <p className="text-[16px] font-medium text-gray-900 leading-relaxed">
              {faq.question}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
