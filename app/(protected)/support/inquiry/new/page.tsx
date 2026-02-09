'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createInquiry } from '@/app/actions/inquiry';

const categories = [
  { value: 'contract', label: '계약서 관련', icon: '📄' },
  { value: 'payment', label: '결제/환불', icon: '💳' },
  { value: 'account', label: '계정/로그인', icon: '👤' },
  { value: 'etc', label: '기타 문의', icon: '💬' },
];

export default function NewInquiryPage() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('category', category);
    formData.append('subject', subject);
    formData.append('content', content);

    const result = await createInquiry(formData);

    if (result.success) {
      router.push('/support/inquiry?success=true');
    } else {
      setError(result.error || '문의 등록에 실패했습니다.');
      setIsSubmitting(false);
    }
  };

  const isFormValid = category && subject.length >= 2 && content.length >= 10;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 px-5 pt-12 pb-4 safe-top">
        <div className="flex items-center gap-3">
          <Link href="/support" className="p-2 -ml-2">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-[20px] font-bold text-gray-900">1:1 문의하기</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-5 py-6 space-y-6">
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* 카테고리 선택 */}
        <div>
          <label className="block text-[15px] font-semibold text-gray-900 mb-3">
            문의 유형
          </label>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  category === cat.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <p className={`mt-2 text-[14px] font-medium ${
                  category === cat.value ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {cat.label}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-[15px] font-semibold text-gray-900 mb-2">
            제목
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="문의 제목을 입력해주세요"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={100}
          />
          <p className="mt-1 text-[13px] text-gray-400 text-right">
            {subject.length}/100
          </p>
        </div>

        {/* 내용 */}
        <div>
          <label className="block text-[15px] font-semibold text-gray-900 mb-2">
            문의 내용
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="문의하실 내용을 자세히 작성해주세요.&#10;&#10;• 오류가 발생한 경우, 어떤 상황에서 발생했는지 알려주세요.&#10;• 결제 관련 문의는 결제일시와 금액을 포함해주세요."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={8}
            maxLength={2000}
          />
          <p className="mt-1 text-[13px] text-gray-400 text-right">
            {content.length}/2000
          </p>
        </div>

        {/* 안내 문구 */}
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="text-[13px] text-gray-600 leading-relaxed">
            • 문의 접수 후 영업일 기준 1-2일 내 답변드립니다.<br />
            • 답변은 앱 내 문의 내역에서 확인하실 수 있습니다.
          </p>
        </div>

        {/* 제출 버튼 */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-4 rounded-xl text-[16px] font-semibold transition-all ${
              isFormValid && !isSubmitting
                ? 'bg-blue-500 text-white active:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? '등록 중...' : '문의 등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
