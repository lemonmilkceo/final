'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateInquiryStatus } from './actions';

interface InquiryActionsProps {
  inquiryId: string;
  currentStatus: string;
}

export default function InquiryActions({ inquiryId, currentStatus }: InquiryActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;

    setLoading(true);
    try {
      const result = await updateInquiryStatus(inquiryId, newStatus);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || '상태 변경에 실패했습니다');
      }
    } catch {
      alert('서버 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={loading}
        className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
      >
        <option value="pending">대기</option>
        <option value="in_progress">처리중</option>
        <option value="resolved">해결됨</option>
        <option value="closed">종료</option>
      </select>

      {currentStatus !== 'resolved' && currentStatus !== 'closed' && (
        <button
          onClick={() => handleStatusChange('resolved')}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          해결 완료
        </button>
      )}
    </div>
  );
}
