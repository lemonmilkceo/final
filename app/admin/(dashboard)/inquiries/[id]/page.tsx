import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import InquiryActions from './inquiry-actions';
import ResponseForm from './response-form';

interface Inquiry {
  id: string;
  category: string;
  subject: string;
  content: string;
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
}

interface Response {
  id: string;
  responder_type: string;
  content: string;
  created_at: string;
}

async function getInquiry(id: string): Promise<Inquiry | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('cs_inquiries')
    .select(`
      id,
      category,
      subject,
      content,
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
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as unknown as Inquiry;
}

async function getResponses(inquiryId: string): Promise<Response[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('cs_responses')
    .select('*')
    .eq('inquiry_id', inquiryId)
    .order('created_at', { ascending: true });

  return (data as Response[]) || [];
}

function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function CategoryBadge({ category }: { category: string }) {
  const labels: Record<string, string> = {
    general: '일반',
    payment: '결제',
    refund: '환불',
    technical: '기술',
    contract: '계약서',
    account: '계정',
    enterprise: '기업/구독',
    other: '기타',
  };
  return labels[category] || category;
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
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [inquiry, responses] = await Promise.all([
    getInquiry(id),
    getResponses(id),
  ]);

  if (!inquiry) {
    notFound();
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/inquiries"
            className="text-gray-500 hover:text-gray-700"
          >
            ← 목록으로
          </Link>
          <StatusBadge status={inquiry.status} />
        </div>
        <InquiryActions inquiryId={inquiry.id} currentStatus={inquiry.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 문의 내용 & 대화 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 문의 내용 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900 mb-4">
              {inquiry.subject}
            </h1>
            <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
              {inquiry.content}
            </div>
          </div>

          {/* 대화 내역 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              대화 내역 ({responses.length}개)
            </h2>

            {responses.length === 0 ? (
              <p className="text-gray-500">아직 응답이 없습니다</p>
            ) : (
              <div className="space-y-4">
                {responses.map((response) => (
                  <div
                    key={response.id}
                    className={`p-4 rounded-xl ${
                      response.responder_type === 'admin'
                        ? 'bg-blue-50 ml-8'
                        : 'bg-gray-50 mr-8'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs font-medium ${
                          response.responder_type === 'admin'
                            ? 'text-blue-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {response.responder_type === 'admin' ? '관리자' : '사용자'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDateTime(response.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {response.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 응답 폼 */}
            {inquiry.status !== 'closed' && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <ResponseForm inquiryId={inquiry.id} />
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 문의 정보 */}
        <div className="space-y-6">
          {/* 사용자 정보 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">사용자 정보</h2>
            
            {inquiry.user ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">이름</p>
                  <Link
                    href={`/admin/users/${inquiry.user.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {inquiry.user.name || '이름 없음'}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-gray-500">전화번호</p>
                  <p className="font-medium text-gray-900">
                    {inquiry.user.phone || '-'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">사용자 정보 없음</p>
            )}
          </div>

          {/* 문의 정보 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">문의 정보</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">분류</p>
                <p className="font-medium text-gray-900">
                  <CategoryBadge category={inquiry.category} />
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">우선순위</p>
                <p className="font-medium text-gray-900">
                  {inquiry.priority === 2
                    ? '🔥 긴급'
                    : inquiry.priority === 1
                    ? '⚠️ 높음'
                    : '일반'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">접수일시</p>
                <p className="font-medium text-gray-900">
                  {formatDateTime(inquiry.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">최종 업데이트</p>
                <p className="font-medium text-gray-900">
                  {formatDateTime(inquiry.updated_at)}
                </p>
              </div>
              {inquiry.assigned_to && (
                <div>
                  <p className="text-sm text-gray-500">담당자</p>
                  <p className="font-medium text-gray-900">{inquiry.assigned_to}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
