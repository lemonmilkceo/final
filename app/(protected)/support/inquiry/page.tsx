import Link from 'next/link';
import { getMyInquiries } from '@/app/actions/inquiry';

const categoryLabels: Record<string, string> = {
  contract: '계약서',
  payment: '결제/환불',
  account: '계정',
  etc: '기타',
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '답변 대기', color: 'text-orange-600', bg: 'bg-orange-50' },
  in_progress: { label: '처리 중', color: 'text-blue-600', bg: 'bg-blue-50' },
  resolved: { label: '답변 완료', color: 'text-green-600', bg: 'bg-green-50' },
  closed: { label: '종료', color: 'text-gray-600', bg: 'bg-gray-100' },
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '오늘';
  } else if (diffDays === 1) {
    return '어제';
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }
}

export default async function MyInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const { inquiries } = await getMyInquiries();
  const showSuccess = params.success === 'true';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 px-5 pt-12 pb-4 safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/support" className="p-2 -ml-2">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-[20px] font-bold text-gray-900">내 문의 내역</h1>
          </div>
          <Link
            href="/support/inquiry/new"
            className="px-4 py-2 bg-blue-500 text-white text-[14px] font-medium rounded-lg"
          >
            문의하기
          </Link>
        </div>
      </header>

      <div className="px-5 py-6">
        {/* 성공 메시지 */}
        {showSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-700 text-[14px] font-medium">문의가 등록되었습니다.</p>
            </div>
          </div>
        )}

        {/* 문의 목록 */}
        {inquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 text-[15px] mb-6">문의 내역이 없습니다</p>
            <Link
              href="/support/inquiry/new"
              className="px-6 py-3 bg-blue-500 text-white text-[15px] font-medium rounded-xl"
            >
              첫 문의하기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inquiry) => {
              const status = statusConfig[inquiry.status] || statusConfig.pending;
              return (
                <Link
                  key={inquiry.id}
                  href={`/support/inquiry/${inquiry.id}`}
                  className="block bg-white rounded-xl p-4 shadow-sm active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-1 rounded-md text-[12px] font-medium ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                    <span className="text-[13px] text-gray-400">
                      {formatDate(inquiry.created_at)}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-medium text-gray-900 mb-1 line-clamp-1">
                    {inquiry.subject}
                  </h3>
                  <p className="text-[13px] text-gray-500">
                    {categoryLabels[inquiry.category] || inquiry.category}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
