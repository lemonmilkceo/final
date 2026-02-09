import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface Payment {
  id: string;
  order_id: string;
  amount: number;
  product_name: string;
  credits_contract: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  receipt_url: string | null;
  user: {
    id: string;
    name: string | null;
    phone: string | null;
  } | null;
}

interface PaymentStats {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  totalPayments: number;
}

async function getPaymentStats(): Promise<PaymentStats> {
  const supabase = createAdminClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // 전체 결제 건수 & 총 매출
  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'completed');

  // 오늘 매출
  const { data: todayPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'completed')
    .gte('paid_at', todayStart);

  // 이번 달 매출
  const { data: monthPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'completed')
    .gte('paid_at', monthStart);

  const totalRevenue = allPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const todayRevenue = todayPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const monthRevenue = monthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalPayments = allPayments?.length || 0;

  return { totalRevenue, todayRevenue, monthRevenue, totalPayments };
}

async function getPayments(
  search?: string,
  status?: string,
  page: number = 1,
  limit: number = 20
): Promise<{ payments: Payment[]; total: number }> {
  const supabase = createAdminClient();

  let query = supabase
    .from('payments')
    .select(`
      id,
      order_id,
      amount,
      product_name,
      credits_contract,
      status,
      paid_at,
      created_at,
      receipt_url,
      user:profiles!payments_user_id_fkey (
        id,
        name,
        phone
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  // 상태 필터
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  // 페이지네이션
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, count } = await query;

  let payments = (data as unknown as Payment[]) || [];

  // 검색어 필터 (클라이언트 사이드)
  if (search) {
    const searchLower = search.toLowerCase();
    payments = payments.filter(
      (p) =>
        p.order_id.toLowerCase().includes(searchLower) ||
        p.user?.name?.toLowerCase().includes(searchLower) ||
        p.user?.phone?.includes(search)
    );
  }

  return { payments, total: count || 0 };
}

function formatDateTime(dateString: string | null): string {
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
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  const labels: Record<string, string> = {
    completed: '완료',
    pending: '대기',
    failed: '실패',
    refunded: '환불됨',
    cancelled: '취소',
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${
        styles[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search;
  const status = params.status;
  const page = parseInt(params.page || '1');

  const [stats, { payments, total }] = await Promise.all([
    getPaymentStats(),
    getPayments(search, status, page),
  ]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">결제 내역</h1>

      {/* 매출 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">총 매출</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalRevenue.toLocaleString()}원
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">이번 달 매출</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.monthRevenue.toLocaleString()}원
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">오늘 매출</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.todayRevenue.toLocaleString()}원
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">총 결제 건수</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalPayments.toLocaleString()}건
          </p>
        </div>
      </div>

      {/* 필터 & 검색 */}
      <form className="bg-white rounded-2xl p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="주문번호, 사용자 이름 또는 전화번호"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            name="status"
            defaultValue={status || 'all'}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">전체 상태</option>
            <option value="completed">완료</option>
            <option value="pending">대기</option>
            <option value="failed">실패</option>
            <option value="refunded">환불됨</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            검색
          </button>
        </div>
      </form>

      {/* 결제 목록 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  결제일시
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  사용자
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  상품
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  금액
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  크레딧
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  상태
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  영수증
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    결제 내역이 없습니다
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDateTime(payment.paid_at || payment.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {payment.user ? (
                        <Link
                          href={`/admin/users/${payment.user.id}`}
                          className="hover:text-blue-600"
                        >
                          <p className="font-medium text-gray-900">
                            {payment.user.name || '이름 없음'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.user.phone || '-'}
                          </p>
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {payment.product_name}
                      </p>
                      <p className="text-xs text-gray-500">{payment.order_id}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {payment.amount.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      +{payment.credits_contract}개
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-6 py-4">
                      {payment.receipt_url ? (
                        <a
                          href={payment.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          영수증
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              총 {total}건 중 {(page - 1) * 20 + 1}-{Math.min(page * 20, total)}건
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/payments?page=${page - 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  이전
                </Link>
              )}
              <span className="px-3 py-1 text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/admin/payments?page=${page + 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  다음
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
