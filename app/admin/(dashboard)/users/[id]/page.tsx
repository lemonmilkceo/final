import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import UserActions from './user-actions';

interface UserDetail {
  id: string;
  name: string | null;
  phone: string | null;
  role: string | null;
  is_blocked: boolean | null;
  created_at: string;
}

interface UserCredits {
  amount: number;
}

interface Payment {
  id: string;
  order_id: string | null;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

interface Contract {
  id: string;
  workplace_name: string | null;
  status: string;
  created_at: string;
}

interface RefundRequest {
  id: string;
  status: string;
  refund_amount: number;
  created_at: string | null;
}

async function getUserDetail(id: string): Promise<UserDetail | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, phone, role, is_blocked, created_at')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getUserCredits(id: string): Promise<UserCredits | null> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('credits')
    .select('amount')
    .eq('user_id', id)
    .eq('credit_type', 'contract')
    .single();

  return data;
}

async function getUserPayments(id: string): Promise<Payment[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('payments')
    .select('id, order_id, amount, status, paid_at, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  return data || [];
}

async function getUserContracts(id: string): Promise<Contract[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('contracts')
    .select('id, workplace_name, status, created_at')
    .eq('employer_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  return data || [];
}

async function getUserRefunds(id: string): Promise<RefundRequest[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('refund_requests')
    .select('id, status, refund_amount, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  return data || [];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateString));
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function StatusBadge({ status, type }: { status: string; type: 'payment' | 'contract' | 'refund' }) {
  const paymentStyles: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
  };

  const contractStyles: Record<string, string> = {
    signed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    draft: 'bg-gray-100 text-gray-800',
    expired: 'bg-red-100 text-red-800',
  };

  const refundStyles: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  const styles = type === 'payment' ? paymentStyles : type === 'contract' ? contractStyles : refundStyles;

  const labels: Record<string, string> = {
    completed: '완료',
    pending: '대기',
    failed: '실패',
    signed: '서명완료',
    draft: '작성중',
    expired: '만료',
    rejected: '거절',
    cancelled: '취소',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const [user, credits, payments, contracts, refunds] = await Promise.all([
    getUserDetail(id),
    getUserCredits(id),
    getUserPayments(id),
    getUserContracts(id),
    getUserRefunds(id),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/admin/users"
          className="text-gray-500 hover:text-gray-700"
        >
          ← 목록으로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {user.name || '이름 없음'}
        </h1>
        {user.is_blocked && (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
            차단됨
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 활동 내역 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 결제 내역 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">결제 내역</h2>
            
            {payments.length === 0 ? (
              <p className="text-gray-500">결제 내역이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {payment.amount.toLocaleString()}원
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(payment.paid_at || payment.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={payment.status} type="payment" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 계약서 내역 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">계약서 내역</h2>
            
            {contracts.length === 0 ? (
              <p className="text-gray-500">계약서가 없습니다</p>
            ) : (
              <div className="space-y-3">
                {contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {contract.workplace_name || '사업장명 없음'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(contract.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={contract.status} type="contract" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 환불 요청 내역 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">환불 요청 내역</h2>
            
            {refunds.length === 0 ? (
              <p className="text-gray-500">환불 요청이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {refunds.map((refund) => (
                  <Link
                    key={refund.id}
                    href={`/admin/refunds/${refund.id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {refund.refund_amount.toLocaleString()}원
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(refund.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={refund.status} type="refund" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 사용자 정보 & 액션 */}
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">이름</p>
                <p className="font-medium text-gray-900">{user.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">전화번호</p>
                <p className="font-medium text-gray-900">{user.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">역할</p>
                <p className="font-medium text-gray-900">
                  {user.role === 'employer' ? '사장님' : user.role === 'worker' ? '직원' : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">가입일</p>
                <p className="font-medium text-gray-900">{formatDate(user.created_at)}</p>
              </div>
            </div>
          </div>

          {/* 크레딧 정보 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">크레딧</h2>
            
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">
                {credits?.amount || 0}
              </p>
              <p className="text-gray-500">잔여 크레딧</p>
            </div>
          </div>

          {/* 액션 */}
          <UserActions
            userId={user.id}
            isBlocked={user.is_blocked || false}
            currentCredits={credits?.amount || 0}
          />
        </div>
      </div>
    </div>
  );
}
