import { createAdminClient } from '@/lib/supabase/server';

interface Stats {
  pendingRefunds: number;
  totalUsers: number;
  todaySignups: number;
  todayPayments: {
    count: number;
    amount: number;
  };
  monthPayments: {
    count: number;
    amount: number;
  };
  todayContracts: number;
}

async function getStats(): Promise<Stats> {
  const supabase = createAdminClient();
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // 병렬 쿼리 실행
  const [
    pendingRefundsResult,
    totalUsersResult,
    todaySignupsResult,
    todayPaymentsResult,
    monthPaymentsResult,
    todayContractsResult,
  ] = await Promise.all([
    // 대기 중인 환불 요청
    supabase
      .from('refund_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    
    // 총 사용자 수
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true }),
    
    // 오늘 가입자
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart),
    
    // 오늘 결제
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('paid_at', todayStart),
    
    // 이번 달 결제
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('paid_at', monthStart),
    
    // 오늘 계약서
    supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart),
  ]);

  const todayPaymentsAmount = todayPaymentsResult.data?.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  ) || 0;

  const monthPaymentsAmount = monthPaymentsResult.data?.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  ) || 0;

  return {
    pendingRefunds: pendingRefundsResult.count || 0,
    totalUsers: totalUsersResult.count || 0,
    todaySignups: todaySignupsResult.count || 0,
    todayPayments: {
      count: todayPaymentsResult.data?.length || 0,
      amount: todayPaymentsAmount,
    },
    monthPayments: {
      count: monthPaymentsResult.data?.length || 0,
      amount: monthPaymentsAmount,
    },
    todayContracts: todayContractsResult.count || 0,
  };
}

function StatCard({
  title,
  value,
  subValue,
  icon,
  highlight,
}: {
  title: string;
  value: string | number;
  subValue?: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm ${highlight ? 'ring-2 ring-red-200' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${highlight ? 'text-red-600' : 'text-gray-900'}`}>
            {value}
          </p>
          {subValue && (
            <p className="text-gray-400 text-sm mt-1">{subValue}</p>
          )}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-500 mt-1">싸인해주세요 운영 현황</p>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="환불 대기"
          value={stats.pendingRefunds}
          subValue={stats.pendingRefunds > 0 ? '처리가 필요합니다' : '처리할 건이 없습니다'}
          icon="💳"
          highlight={stats.pendingRefunds > 0}
        />
        <StatCard
          title="총 사용자"
          value={stats.totalUsers.toLocaleString()}
          subValue={`오늘 +${stats.todaySignups}명`}
          icon="👥"
        />
        <StatCard
          title="오늘 결제"
          value={`${stats.todayPayments.amount.toLocaleString()}원`}
          subValue={`${stats.todayPayments.count}건`}
          icon="💰"
        />
        <StatCard
          title="오늘 계약서"
          value={stats.todayContracts}
          subValue="작성됨"
          icon="📝"
        />
      </div>

      {/* 이번 달 매출 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">이번 달 매출</h2>
        <div className="flex items-end gap-4">
          <div>
            <p className="text-4xl font-bold text-gray-900">
              {stats.monthPayments.amount.toLocaleString()}원
            </p>
            <p className="text-gray-500 mt-1">
              총 {stats.monthPayments.count}건 결제
            </p>
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/refunds"
            className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <span className="text-2xl">💳</span>
            <div>
              <p className="font-medium text-gray-900">환불 요청 처리</p>
              <p className="text-sm text-gray-500">대기 중인 환불 확인</p>
            </div>
          </a>
          <a
            href="/admin/users"
            className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <span className="text-2xl">👥</span>
            <div>
              <p className="font-medium text-gray-900">사용자 관리</p>
              <p className="text-sm text-gray-500">크레딧 지급/차감</p>
            </div>
          </a>
          <a
            href="https://dashboard.tosspayments.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <span className="text-2xl">🔗</span>
            <div>
              <p className="font-medium text-gray-900">토스페이먼츠</p>
              <p className="text-sm text-gray-500">결제 대시보드 열기</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
