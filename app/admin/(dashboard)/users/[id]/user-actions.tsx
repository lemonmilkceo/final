'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adjustCredits, toggleUserBlock } from './actions';

interface UserActionsProps {
  userId: string;
  isBlocked: boolean;
  currentCredits: number;
}

export default function UserActions({
  userId,
  isBlocked,
  currentCredits,
}: UserActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const router = useRouter();

  const handleToggleBlock = async () => {
    const action = isBlocked ? '차단 해제' : '차단';
    const confirmed = confirm(`정말 이 사용자를 ${action}하시겠습니까?`);

    if (!confirmed) return;

    setLoading(true);
    setError('');

    try {
      const result = await toggleUserBlock(userId, !isBlocked);

      if (result.success) {
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

  const handleCreditAdjust = async () => {
    const amount = parseInt(creditAmount);
    
    if (isNaN(amount) || amount === 0) {
      setError('유효한 숫자를 입력해주세요');
      return;
    }

    if (!creditReason.trim()) {
      setError('사유를 입력해주세요');
      return;
    }

    // 차감 시 잔여 크레딧 체크
    if (amount < 0 && currentCredits + amount < 0) {
      setError('잔여 크레딧보다 많이 차감할 수 없습니다');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await adjustCredits(userId, amount, creditReason);

      if (result.success) {
        alert(`크레딧이 ${amount > 0 ? '지급' : '차감'}되었습니다`);
        setShowCreditModal(false);
        setCreditAmount('');
        setCreditReason('');
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">관리</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => setShowCreditModal(true)}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            크레딧 지급/차감
          </button>

          <button
            onClick={handleToggleBlock}
            disabled={loading}
            className={`w-full py-3 font-medium rounded-xl transition-colors ${
              isBlocked
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            } disabled:opacity-50`}
          >
            {loading ? '처리 중...' : isBlocked ? '차단 해제' : '사용자 차단'}
          </button>
        </div>
      </div>

      {/* 크레딧 조정 모달 */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              크레딧 지급/차감
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              현재 크레딧: <span className="font-bold">{currentCredits}개</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수량 (음수: 차감, 양수: 지급)
              </label>
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="예: 5 또는 -3"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사유
              </label>
              <input
                type="text"
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                placeholder="예: 이벤트 보상 지급"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreditModal(false);
                  setCreditAmount('');
                  setCreditReason('');
                  setError('');
                }}
                disabled={loading}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreditAdjust}
                disabled={loading || !creditAmount || !creditReason.trim()}
                className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
