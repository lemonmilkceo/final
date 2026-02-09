'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/shared/EmptyState';
import Toast from '@/components/ui/Toast';
import RefundRequestSheet from '@/components/payment/RefundRequestSheet';
import { formatCurrency, formatDate } from '@/lib/utils/format';

interface Payment {
  id: string;
  product_name: string;
  amount: number;
  credits_contract: number;
  credits_ai_review: number;
  paid_at: string | null;
  receipt_url: string | null;
  has_refund_request?: boolean;
  refund_status?: string | null;
}

interface PaymentHistoryPageProps {
  payments: Payment[];
}

export default function PaymentHistoryPage({
  payments,
}: PaymentHistoryPageProps) {
  const router = useRouter();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showRefundSheet, setShowRefundSheet] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 환불 가능 여부 확인 (12개월 이내)
  const canRequestRefund = (payment: Payment) => {
    if (!payment.paid_at) return false;
    if (payment.has_refund_request) return false;
    
    const paymentDate = new Date(payment.paid_at);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - paymentDate.getFullYear()) * 12 
      + (now.getMonth() - paymentDate.getMonth());
    
    return monthsDiff < 12;
  };

  const handleRefundClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowRefundSheet(true);
  };

  const handleRefundSuccess = () => {
    setToastMessage('환불 요청이 접수되었어요 ✅');
    setShowToast(true);
    router.refresh();
  };

  // 환불 상태 배지
  const getRefundStatusBadge = (status: string | null | undefined) => {
    if (!status) return null;
    
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '환불 검토중' },
      approved: { bg: 'bg-blue-100', text: 'text-blue-700', label: '환불 승인' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: '환불 완료' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: '환불 거절' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: '요청 취소' },
    };
    
    const badge = badges[status];
    if (!badge) return null;
    
    return (
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader title="결제 내역" />

      <div className="flex-1 p-5">
        {payments.length > 0 ? (
          <div className="space-y-3">
            {payments.map((payment) => (
              <Card key={payment.id} variant="default" className="border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-semibold text-gray-900">
                        {payment.product_name}
                      </p>
                      {getRefundStatusBadge(payment.refund_status)}
                    </div>
                    <p className="text-[13px] text-gray-500 mt-1">
                      {payment.paid_at ? formatDate(payment.paid_at) : '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[15px] font-bold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-[12px] text-gray-400">
                      {payment.credits_contract > 0 &&
                        `계약서 ${payment.credits_contract}건`}
                      {payment.credits_contract > 0 &&
                        payment.credits_ai_review > 0 &&
                        ', '}
                      {payment.credits_ai_review > 0 &&
                        `AI검토 ${payment.credits_ai_review}건`}
                    </p>
                  </div>
                </div>

                {/* 하단 액션 버튼들 */}
                <div className="mt-3 flex items-center gap-3">
                  {/* 영수증 링크 */}
                  {payment.receipt_url && (
                    <a
                      href={payment.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[13px] text-blue-500"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      영수증
                    </a>
                  )}
                  
                  {/* 환불 요청 버튼 */}
                  {canRequestRefund(payment) && (
                    <button
                      onClick={() => handleRefundClick(payment)}
                      className="inline-flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-700"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                        />
                      </svg>
                      환불 요청
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<span className="text-6xl">💳</span>}
            title="결제 내역이 없어요"
            description="크레딧을 충전하면 여기에 표시돼요"
            actionLabel="크레딧 충전하기"
            onAction={() => (window.location.href = '/pricing')}
          />
        )}
      </div>

      {/* 환불 요청 시트 */}
      {selectedPayment && (
        <RefundRequestSheet
          isOpen={showRefundSheet}
          onClose={() => {
            setShowRefundSheet(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
          onSuccess={handleRefundSuccess}
        />
      )}

      {/* 토스트 */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
