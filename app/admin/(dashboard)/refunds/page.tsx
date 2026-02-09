import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface RefundRequest {
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
  created_at: string;
  profiles: {
    name: string | null;
    phone: string | null;
  } | null;
  payments: {
    order_id: string | null;
    payment_key: string | null;
  } | null;
}

async function getRefundRequests(status?: string): Promise<RefundRequest[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from('refund_requests')
    .select(`
      *,
      profiles:user_id (name, phone),
      payments:payment_id (order_id, payment_key)
    `)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching refund requests:', error);
    return [];
  }

  return (data as unknown as RefundRequest[]) || [];
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
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default async function RefundsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const currentStatus = params.status || 'pending';
  const refunds = await getRefundRequests(currentStatus);

  const statusFilters = [
    { value: 'pending', label: '대기중' },
    { value: 'completed', label: '완료' },
    { value: 'rejected', label: '거절' },
    { value: 'all', label: '전체' },
  ];

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">환불 관리</h1>
        <p className="text-gray-500 mt-1">고객 환불 요청을 확인하고 처리합니다</p>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-6">
        {statusFilters.map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/refunds?status=${filter.value}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentStatus === filter.value
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {refunds.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">환불 요청이 없습니다</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">상태</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">요청자</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">유형</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">환불 금액</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">사유</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">요청일</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {refunds.map((refund) => (
                <tr key={refund.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <StatusBadge status={refund.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {refund.profiles?.name || '이름 없음'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {refund.profiles?.phone || '-'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${refund.request_type === 'full' ? 'text-red-600' : 'text-orange-600'}`}>
                      {refund.request_type === 'full' ? '전액' : '부분'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {refund.refund_amount.toLocaleString()}원
                      </p>
                      <p className="text-xs text-gray-500">
                        수수료 {refund.fee_amount.toLocaleString()}원
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 max-w-xs truncate">
                      {refund.reason}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(refund.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/refunds/${refund.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      상세보기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
