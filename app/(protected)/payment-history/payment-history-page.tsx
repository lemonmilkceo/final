'use client';

import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDate } from '@/lib/utils/format';

interface Payment {
  id: string;
  product_name: string;
  amount: number;
  credits_contract: number;
  credits_ai_review: number;
  paid_at: string | null;
  receipt_url: string | null;
}

interface PaymentHistoryPageProps {
  payments: Payment[];
}

export default function PaymentHistoryPage({
  payments,
}: PaymentHistoryPageProps) {
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
                    <p className="text-[15px] font-semibold text-gray-900">
                      {payment.product_name}
                    </p>
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

                {/* 영수증 링크 */}
                {payment.receipt_url && (
                  <a
                    href={payment.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-[13px] text-blue-500"
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
                    영수증 보기
                  </a>
                )}
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
    </div>
  );
}
