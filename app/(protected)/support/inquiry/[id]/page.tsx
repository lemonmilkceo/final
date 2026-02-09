import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getInquiryDetail } from '@/app/actions/inquiry';
import ResponseForm from './response-form';

const categoryLabels: Record<string, string> = {
  contract: '계약서 관련',
  payment: '결제/환불',
  account: '계정/로그인',
  etc: '기타 문의',
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '답변 대기', color: 'text-orange-600', bg: 'bg-orange-50' },
  in_progress: { label: '처리 중', color: 'text-blue-600', bg: 'bg-blue-50' },
  resolved: { label: '답변 완료', color: 'text-green-600', bg: 'bg-green-50' },
  closed: { label: '종료', color: 'text-gray-600', bg: 'bg-gray-100' },
};

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { success, inquiry, responses } = await getInquiryDetail(id);

  if (!success || !inquiry) {
    notFound();
  }

  const status = statusConfig[inquiry.status] || statusConfig.pending;
  const canReply = inquiry.status !== 'closed';

  // 대화 목록 구성 (원본 문의 + 답변들)
  const conversation = [
    {
      type: 'user' as const,
      content: inquiry.content,
      created_at: inquiry.created_at,
      isOriginal: true,
    },
    ...responses.map((r) => ({
      type: r.responder_type as 'user' | 'admin',
      content: r.content,
      created_at: r.created_at,
      isOriginal: false,
    })),
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 px-5 pt-12 pb-4 safe-top sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/support/inquiry" className="p-2 -ml-2">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-[18px] font-bold text-gray-900 truncate">
              {inquiry.subject}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[13px] text-gray-500">
                {categoryLabels[inquiry.category] || inquiry.category}
              </span>
              <span className="text-gray-300">•</span>
              <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${status.bg} ${status.color}`}>
                {status.label}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 대화 내용 */}
      <div className="px-5 py-6 space-y-4">
        {conversation.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {message.type === 'admin' && (
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-[12px] font-medium text-blue-600">고객센터</span>
                </div>
              )}
              <p className={`text-[14px] whitespace-pre-wrap leading-relaxed ${
                message.type === 'user' ? 'text-white' : 'text-gray-800'
              }`}>
                {message.content}
              </p>
              <p className={`text-[11px] mt-2 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
              }`}>
                {formatDateTime(message.created_at)}
                {message.isOriginal && ' · 최초 문의'}
              </p>
            </div>
          </div>
        ))}

        {/* 종료된 문의 안내 */}
        {!canReply && (
          <div className="bg-gray-100 rounded-xl p-4 text-center">
            <p className="text-[14px] text-gray-600">
              종료된 문의입니다. 추가 문의가 필요하시면 새 문의를 등록해주세요.
            </p>
            <Link
              href="/support/inquiry/new"
              className="inline-block mt-3 px-4 py-2 bg-blue-500 text-white text-[14px] font-medium rounded-lg"
            >
              새 문의하기
            </Link>
          </div>
        )}
      </div>

      {/* 답변 입력 폼 (하단 고정) */}
      {canReply && <ResponseForm inquiryId={inquiry.id} />}
    </div>
  );
}
