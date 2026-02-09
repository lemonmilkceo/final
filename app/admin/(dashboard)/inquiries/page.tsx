import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface Inquiry {
  id: string;
  category: string;
  subject: string;
  status: string;
  priority: number;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string | null;
    phone: string | null;
  } | null;
  responses_count: number;
}

interface InquiryStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

async function getInquiryStats(): Promise<InquiryStats> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('cs_inquiries')
    .select('status');

  const inquiries = data || [];

  return {
    total: inquiries.length,
    pending: inquiries.filter((i) => i.status === 'pending').length,
    inProgress: inquiries.filter((i) => i.status === 'in_progress').length,
    resolved: inquiries.filter((i) => i.status === 'resolved' || i.status === 'closed').length,
  };
}

async function getInquiries(
  status?: string,
  page: number = 1,
  limit: number = 20
): Promise<{ inquiries: Inquiry[]; total: number }> {
  const supabase = createAdminClient();

  let query = supabase
    .from('cs_inquiries')
    .select(`
      id,
      category,
      subject,
      status,
      priority,
      assigned_to,
      created_at,
      updated_at,
      user:profiles!cs_inquiries_user_id_fkey (
        id,
        name,
        phone
      )
    `, { count: 'exact' })
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, count } = await query;

  // 응답 수 가져오기
  const inquiries = (data as unknown as Inquiry[]) || [];
  
  // 각 문의의 응답 수를 가져옴
  for (const inquiry of inquiries) {
    const { count: responseCount } = await supabase
      .from('cs_responses')
      .select('*', { count: 'exact', head: true })
      .eq('inquiry_id', inquiry.id);
    inquiry.responses_count = responseCount || 0;
  }

  return { inquiries, total: count || 0 };
}

function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    general: 'bg-gray-100 text-gray-800',
    payment: 'bg-blue-100 text-blue-800',
    refund: 'bg-purple-100 text-purple-800',
    technical: 'bg-orange-100 text-orange-800',
    other: 'bg-gray-100 text-gray-600',
  };

  const labels: Record<string, string> = {
    general: '일반',
    payment: '결제',
    refund: '환불',
    technical: '기술',
    other: '기타',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[category] || 'bg-gray-100 text-gray-800'}`}>
      {labels[category] || category}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-red-100 text-red-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-600',
  };

  const labels: Record<string, string> = {
    pending: '대기',
    in_progress: '처리중',
    resolved: '해결됨',
    closed: '종료',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  if (priority === 2) {
    return <span className="text-red-600 font-bold">🔥 긴급</span>;
  }
  if (priority === 1) {
    return <span className="text-orange-600 font-medium">⚠️ 높음</span>;
  }
  return null;
}

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = params.status;
  const page = parseInt(params.page || '1');

  const [stats, { inquiries, total }] = await Promise.all([
    getInquiryStats(),
    getInquiries(status, page),
  ]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">1:1 문의</h1>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">전체 문의</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}건</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">대기 중</p>
          <p className="text-2xl font-bold text-red-600">{stats.pending}건</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">처리 중</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}건</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">해결됨</p>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}건</p>
        </div>
      </div>

      {/* 필터 */}
      <form className="bg-white rounded-2xl p-4 shadow-sm mb-6">
        <div className="flex gap-4">
          <select
            name="status"
            defaultValue={status || 'all'}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">전체 상태</option>
            <option value="pending">대기</option>
            <option value="in_progress">처리중</option>
            <option value="resolved">해결됨</option>
            <option value="closed">종료</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            필터
          </button>
        </div>
      </form>

      {/* 문의 목록 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  접수일시
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  사용자
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  분류
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  제목
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  상태
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  응답
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    문의가 없습니다
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDateTime(inquiry.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {inquiry.user ? (
                        <Link
                          href={`/admin/users/${inquiry.user.id}`}
                          className="hover:text-blue-600"
                        >
                          <p className="font-medium text-gray-900">
                            {inquiry.user.name || '이름 없음'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {inquiry.user.phone || '-'}
                          </p>
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <CategoryBadge category={inquiry.category} />
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/inquiries/${inquiry.id}`}
                        className="hover:text-blue-600"
                      >
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={inquiry.priority} />
                          <p className="font-medium text-gray-900 max-w-[300px] truncate">
                            {inquiry.subject}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inquiry.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {inquiry.responses_count}개
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
                  href={`/admin/inquiries?page=${page - 1}${status ? `&status=${status}` : ''}`}
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
                  href={`/admin/inquiries?page=${page + 1}${status ? `&status=${status}` : ''}`}
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
