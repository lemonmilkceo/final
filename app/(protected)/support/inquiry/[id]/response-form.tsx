'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addUserResponse } from '@/app/actions/inquiry';

interface ResponseFormProps {
  inquiryId: string;
}

export default function ResponseForm({ inquiryId }: ResponseFormProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setError('');
    setIsSubmitting(true);

    const result = await addUserResponse(inquiryId, content);

    if (result.success) {
      setContent('');
      router.refresh();
    } else {
      setError(result.error || '전송에 실패했습니다.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 safe-bottom">
      {error && (
        <div className="mb-2 px-3 py-2 bg-red-50 rounded-lg">
          <p className="text-red-600 text-[13px]">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="추가 메시지를 입력하세요..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
        </div>
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className={`px-4 py-3 rounded-xl transition-colors ${
            content.trim() && !isSubmitting
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          {isSubmitting ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
