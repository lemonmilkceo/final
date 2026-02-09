'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adjustCredits, toggleUserBlock, deleteUser } from './actions';

interface UserActionsProps {
  userId: string;
  isBlocked: boolean;
  currentCredits: number;
  blockedReason?: string | null;
}

export default function UserActions({
  userId,
  isBlocked,
  currentCredits,
  blockedReason,
}: UserActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const router = useRouter();

  const handleToggleBlock = async () => {
    // 차단 해제는 바로 실행
    if (isBlocked) {
      const confirmed = confirm('정말 이 사용자의 차단을 해제하시겠습니까?');
      if (!confirmed) return;

      setLoading(true);
      setError('');

      try {
        const result = await toggleUserBlock(userId, false);

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
    } else {
      // 차단은 모달로 사유 입력
      setShowBlockModal(true);
    }
  };

  const handleConfirmBlock = async () => {
    if (!blockReason.trim()) {
      setError('차단 사유를 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await toggleUserBlock(userId, true, blockReason);

      if (result.success) {
        setShowBlockModal(false);
        setBlockReason('');
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

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await deleteUser(userId);

      if (result.success) {
        router.push('/admin/users');
      } else {
        setError(result.error || '삭제에 실패했습니다');
        setShowDeleteModal(false);
      }
    } catch {
      setError('서버 오류가 발생했습니다');
      setShowDeleteModal(false);
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

        {isBlocked && blockedReason && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <span className="font-medium">차단 사유:</span> {blockedReason}
            </p>
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
                : 'bg-amber-600 text-white hover:bg-amber-700'
            } disabled:opacity-50`}
          >
            {loading ? '처리 중...' : isBlocked ? '차단 해제' : '사용자 차단'}
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={loading}
            className="w-full py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            사용자 삭제
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

      {/* 차단 사유 입력 모달 */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              사용자 차단
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              차단 시 사용자는 서비스를 이용할 수 없습니다.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                차단 사유 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="예: 부정 사용 의심, 이용약관 위반 등"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setBlockReason('');
                  setError('');
                }}
                disabled={loading}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmBlock}
                disabled={loading || !blockReason.trim()}
                className="flex-1 py-3 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '처리 중...' : '차단하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">
              ⚠️ 사용자 삭제
            </h3>

            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-800 font-medium mb-2">
                이 작업은 되돌릴 수 없습니다!
              </p>
              <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                <li>사용자 계정이 완전히 삭제됩니다</li>
                <li>모든 계약서 데이터가 삭제될 수 있습니다</li>
                <li>크레딧 및 결제 내역이 삭제됩니다</li>
              </ul>
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setError('');
                }}
                disabled={loading}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
