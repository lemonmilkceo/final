'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { togglePromoCode, deletePromoCode } from './actions';

interface PromoActionsProps {
  promoId: string;
  isActive: boolean;
}

export default function PromoActions({ promoId, isActive }: PromoActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setLoading(true);
    try {
      const result = await togglePromoCode(promoId, !isActive);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || '처리에 실패했습니다');
      }
    } catch {
      alert('서버 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = confirm('정말 이 프로모션 코드를 삭제하시겠습니까?');
    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await deletePromoCode(promoId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || '삭제에 실패했습니다');
      }
    } catch {
      alert('서버 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
          isActive
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-green-100 text-green-700 hover:bg-green-200'
        } disabled:opacity-50`}
      >
        {isActive ? '비활성화' : '활성화'}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="px-3 py-1 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
      >
        삭제
      </button>
    </div>
  );
}
