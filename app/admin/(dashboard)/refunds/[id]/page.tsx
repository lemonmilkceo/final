import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import RefundActions from './refund-actions';

interface RefundDetail {
  id: string;
  user_id: string;
  payment_id: string;
  request_type: 'full' | 'partial';
  reason: string;
  total_credits: number;
  used_credits: number;
  refund_credits: number;
  original_amount: number;
  base_refund_amount: number;
  fee_rate: number;
  fee_amount: number;
  refund_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  admin_note: string | null;
  processed_at: string | null;
  created_at: string;
  profiles: {
    id: string;
    name: string | null;
    phone: string | null;
    role: string | null;
  } | null;
  payments: {
    id: string;
    order_id: string | null;
    payment_key: string | null;
    amount: number;
    paid_at: string | null;
  } | null;
}

async function getRefundDetail(id: string): Promise<RefundDetail | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('refund_requests')
    .select(`
      *,
      profiles:user_id (id, name, phone, role),
      payments:payment_id (id, order_id, payment_key, amount, paid_at)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as unknown as RefundDetail;
}

async function getUserCredits(userId: string): Promise<number> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('credits')
    .select('amount')
    .eq('user_id', userId)
    .eq('credit_type', 'contract')
    .single();

  return data?.amount || 0;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  const labels: Record<string, string> = {
    pending: '대기중',
    approved: '승인됨',
    completed: '완료',
    rejected: '거절',
    cancelled: '취소됨',
  };

  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}

export default async function RefundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const refund = await getRefundDetail(id);

  if (!refund) {
    notFound();
  }

  const userCredits = refund.profiles?.id 
    ? await getUserCredits(refund.profiles.id)
    : 0;

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/admin/refunds"
          className="text-gray-500 hover:text-gray-700"
        >
          ← 목록으로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">환불 요청 상세</h1>
        <StatusBadge status={refund.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 요청 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 환불 요청 정보 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">환불 요청 정보</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">환불 유형</p>
                <p className="font-medium text-gray-900">
                  {refund.request_type === 'full' ? '전액 환불' : '부분 환불'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">요청일</p>
                <p className="font-medium text-gray-900">{formatDate(refund.created_at)}</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">환불 사유</p>
              <p className="text-gray-900">{refund.reason}</p>
            </div>
          </div>

          {/* 금액 정보 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">금액 정보</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">원결제 금액</span>
                <span className="font-medium">{refund.original_amount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">총 크레딧</span>
                <span className="font-medium">{refund.total_credits}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">사용한 크레딧</span>
                <span className="font-medium text-red-600">-{refund.used_credits}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">환불 대상 크레딧</span>
                <span className="font-medium">{refund.refund_credits}개</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between">
                <span className="text-gray-600">환불 기본 금액</span>
                <span className="font-medium">{refund.base_refund_amount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">
                  수수료 ({(refund.fee_rate * 100).toFixed(0)}%)
                </span>
                <span className="font-medium text-orange-600">
                  -{refund.fee_amount.toLocaleString()}원
                </span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-lg">
                <span className="font-semibold text-gray-900">최종 환불 금액</span>
                <span className="font-bold text-blue-600">
                  {refund.refund_amount.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>

          {/* 결제 정보 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">원결제 정보</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">주문번호</p>
                <p className="font-mono text-sm text-gray-900">
                  {refund.payments?.order_id || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">결제일</p>
                <p className="font-medium text-gray-900">
                  {formatDate(refund.payments?.paid_at || null)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">결제 키</p>
                <p className="font-mono text-xs text-gray-600 break-all">
                  {refund.payments?.payment_key || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 사용자 정보 & 액션 */}
        <div className="space-y-6">
          {/* 사용자 정보 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">사용자 정보</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">이름</p>
                <p className="font-medium text-gray-900">
                  {refund.profiles?.name || '이름 없음'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">전화번호</p>
                <p className="font-medium text-gray-900">
                  {refund.profiles?.phone || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">역할</p>
                <p className="font-medium text-gray-900">
                  {refund.profiles?.role === 'employer' ? '사장님' : '직원'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">현재 크레딧</p>
                <p className="font-medium text-gray-900">{userCredits}개</p>
              </div>
            </div>

            {refund.profiles?.id && (
              <Link
                href={`/admin/users/${refund.profiles.id}`}
                className="mt-4 block text-center py-2 text-sm text-blue-600 hover:text-blue-800"
              >
                사용자 상세 보기 →
              </Link>
            )}
          </div>

          {/* 처리 액션 */}
          {refund.status === 'pending' && (
            <RefundActions
              refundId={refund.id}
              userId={refund.user_id}
              paymentKey={refund.payments?.payment_key || null}
              refundAmount={refund.refund_amount}
              refundCredits={refund.refund_credits}
            />
          )}

          {/* 처리 완료 정보 */}
          {refund.status !== 'pending' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">처리 정보</h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">처리일</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(refund.processed_at)}
                  </p>
                </div>
                {refund.admin_note && (
                  <div>
                    <p className="text-sm text-gray-500">관리자 메모</p>
                    <p className="text-gray-900">{refund.admin_note}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
