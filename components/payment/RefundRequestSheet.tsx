'use client';

import { useState } from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils/format';

interface RefundRequestSheetProps {
  isOpen: boolean;
  onClose: () => void;
  payment: {
    id: string;
    product_name: string;
    amount: number;
    credits_contract: number;
    paid_at: string | null;
  };
  onSuccess: () => void;
}

const REFUND_REASONS = [
  '서비스를 더 이상 사용하지 않아요',
  '다른 서비스를 이용하려고 해요',
  '기능이 기대와 달랐어요',
  '기타',
];

export default function RefundRequestSheet({
  isOpen,
  onClose,
  payment,
  onSuccess,
}: RefundRequestSheetProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refundInfo, setRefundInfo] = useState<{
    refundCredits: number;
    refundAmount: number;
    usedCredits: number;
    baseRefundAmount: number;
    feeAmount: number;
    feeRate: number;
    isNoFeeApplied: boolean;
  } | null>(null);

  const handleSubmit = async () => {
    const reason = selectedReason === '기타' ? customReason : selectedReason;
    
    if (!reason.trim()) {
      setError('환불 사유를 선택해주세요');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/refund/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.id,
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '환불 요청에 실패했어요');
        setIsLoading(false);
        return;
      }

      setRefundInfo({
        refundCredits: data.refundRequest.refundCredits,
        refundAmount: data.refundRequest.refundAmount,
        usedCredits: data.refundRequest.usedCredits,
        baseRefundAmount: data.refundRequest.baseRefundAmount,
        feeAmount: data.refundRequest.feeAmount,
        feeRate: data.refundRequest.feeRate,
        isNoFeeApplied: data.refundRequest.isNoFeeApplied,
      });

      // 성공 시 부모 컴포넌트에 알림
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch {
      setError('네트워크 오류가 발생했어요');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    setError(null);
    setRefundInfo(null);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="환불 요청">
      <div className="space-y-5">
        {refundInfo ? (
          // 성공 화면
          <div className="text-center py-6">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-[18px] font-bold text-gray-900 mb-2">
              환불 요청이 완료됐어요
            </h3>
            <p className="text-[14px] text-gray-600 mb-4">
              영업일 기준 3일 이내 처리될 예정이에요
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-[14px] text-gray-500">환불 크레딧</span>
                <span className="text-[14px] font-medium text-gray-900">
                  {refundInfo.refundCredits}건
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[14px] text-gray-500">환불 기본 금액</span>
                <span className="text-[14px] font-medium text-gray-900">
                  {formatCurrency(refundInfo.baseRefundAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[14px] text-gray-500">
                  환불 수수료 ({Math.round(refundInfo.feeRate * 100)}%)
                </span>
                <span className={`text-[14px] font-medium ${refundInfo.isNoFeeApplied ? 'text-green-600' : 'text-red-500'}`}>
                  {refundInfo.isNoFeeApplied ? '면제' : `-${formatCurrency(refundInfo.feeAmount)}`}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-[14px] font-semibold text-gray-700">환불 예정 금액</span>
                  <span className="text-[14px] font-bold text-blue-600">
                    {formatCurrency(refundInfo.refundAmount)}
                  </span>
                </div>
              </div>
            </div>
            {refundInfo.isNoFeeApplied && (
              <p className="text-[12px] text-green-600 mt-2">
                🎉 7일 이내 미사용 환불로 수수료가 면제됐어요
              </p>
            )}
          </div>
        ) : (
          // 요청 폼
          <>
            {/* 결제 정보 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[15px] font-semibold text-gray-900">
                {payment.product_name}
              </p>
              <p className="text-[14px] text-gray-600 mt-1">
                결제 금액: {formatCurrency(payment.amount)}
              </p>
              <p className="text-[13px] text-gray-400 mt-0.5">
                크레딧 {payment.credits_contract}건
              </p>
            </div>

            {/* 환불 안내 */}
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-[13px] text-blue-700">
                💡 미사용 크레딧에 대해서만 환불이 가능해요.
                <br />
                사용한 크레딧은 환불 금액에서 제외됩니다.
              </p>
            </div>

            {/* 수수료 안내 */}
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-[13px] text-amber-700 font-medium mb-1">
                💰 환불 수수료 안내
              </p>
              <ul className="text-[12px] text-amber-600 space-y-1 list-disc pl-4">
                <li>결제 후 <strong>7일 이내</strong> + <strong>크레딧 미사용</strong> 시: <strong>수수료 0%</strong></li>
                <li>그 외의 경우: <strong>환불 금액의 10%</strong> 수수료 적용</li>
                <li>최소 환불 금액: 1,000원</li>
              </ul>
            </div>

            {/* 환불 사유 */}
            <div>
              <p className="text-[14px] font-medium text-gray-700 mb-3">
                환불 사유를 선택해주세요
              </p>
              <div className="space-y-2">
                {REFUND_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                      selectedReason === reason
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <span className="text-[14px] text-gray-900">{reason}</span>
                  </button>
                ))}
              </div>

              {/* 기타 사유 입력 */}
              {selectedReason === '기타' && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="환불 사유를 입력해주세요"
                  className="mt-3 w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] resize-none focus:border-blue-500 focus:outline-none"
                  rows={3}
                />
              )}
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-[14px] rounded-xl">
                {error}
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleClose}
                className="flex-1 py-3.5 rounded-xl font-semibold text-[16px] text-gray-700 bg-gray-100"
              >
                취소
              </button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !selectedReason}
                loading={isLoading}
                className="flex-1"
              >
                환불 요청
              </Button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
