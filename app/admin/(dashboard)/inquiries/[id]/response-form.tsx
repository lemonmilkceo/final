'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addAdminResponse } from './actions';

interface ResponseFormProps {
  inquiryId: string;
}

export default function ResponseForm({ inquiryId }: ResponseFormProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('내용을 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await addAdminResponse(inquiryId, content);

      if (result.success) {
        setContent('');
        router.refresh();
      } else {
        setError(result.error || '응답 추가에 실패했습니다');
      }
    } catch {
      setError('서버 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-sm font-medium text-gray-700 mb-2">관리자 응답</h3>
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="응답 내용을 입력하세요..."
        rows={4}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />

      {error && (
        <p className="mt-2 text-red-500 text-sm">{error}</p>
      )}

      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '전송 중...' : '응답 전송'}
        </button>
      </div>
    </form>
  );
}
