'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { processRefund, rejectRefund } from './actions';

interface RefundActionsProps {
  refundId: string;
  userId: string;
  paymentKey: string | null;
  refundAmount: number;
  refundCredits: number;
}

export default function RefundActions({
  refundId,
  userId,
  paymentKey,
  refundAmount,
  refundCredits,
}: RefundActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const router = useRouter();

  const handleApprove = async () => {
    if (!paymentKey) {
      setError('결제 키가 없어 자동 환불이 불가능합니다');
      return;
    }

    const confirmed = confirm(
      `정말 ${refundAmount.toLocaleString()}원을 환불하시겠습니까?\n\n` +
      `- 토스페이먼츠에서 실제 환불이 진행됩니다\n` +
      `- 사용자의 크레딧 ${refundCredits}개가 차감됩니다`
    );

    if (!confirmed) return;

    setLoading(true);
    setError('');

    try {
      const result = await processRefund(refundId, userId, paymentKey, refundAmount, refundCredits);

      if (result.success) {
        alert('환불이 완료되었습니다');
        router.refresh();
      } else {
        setError(result.error || '환불 처리에 실패했습니다');
      }
    } catch {
      setError('서버 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('거절 사유를 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await rejectRefund(refundId, rejectReason);

      if (result.success) {
        alert('환불 요청이 거절되었습니다');
        setShowRejectModal(false);
        router.refresh();
      } else {
        setError(result.error || '처리에 실패했습니다');
      }
    } catch {
      setError('서버 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">환불 처리</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {!paymentKey && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm">
              결제 키가 없어 자동 환불이 불가능합니다.
              <br />
              토스페이먼츠에서 수동으로 환불 후 완료 처리해주세요.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleApprove}
            disabled={loading || !paymentKey}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '처리 중...' : `${refundAmount.toLocaleString()}원 환불하기`}
          </button>

          <button
            onClick={() => setShowRejectModal(true)}
            disabled={loading}
            className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            거절하기
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          환불 처리 시 토스페이먼츠 API가 호출됩니다
        </p>
      </div>

      {/* 거절 모달 */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              환불 거절
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                거절 사유
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="거절 사유를 입력해주세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setError('');
                }}
                disabled={loading}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !rejectReason.trim()}
                className="flex-1 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '처리 중...' : '거절하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
