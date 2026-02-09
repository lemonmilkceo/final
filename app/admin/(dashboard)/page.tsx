import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface Stats {
  pendingRefunds: number;
  pendingInquiries: number;
  totalUsers: number;
  todaySignups: number;
  weekSignups: number;
  todayPayments: {
    count: number;
    amount: number;
  };
  monthPayments: {
    count: number;
    amount: number;
  };
  lastMonthPayments: {
    count: number;
    amount: number;
  };
  todayContracts: number;
  completedContracts: number;
  activePromos: number;
  activeAnnouncements: number;
  weeklyPayments: { date: string; amount: number }[];
}

async function getStats(): Promise<Stats> {
  const supabase = createAdminClient();
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  // 병렬 쿼리 실행
  const [
    pendingRefundsResult,
    pendingInquiriesResult,
    totalUsersResult,
    todaySignupsResult,
    weekSignupsResult,
    todayPaymentsResult,
    monthPaymentsResult,
    lastMonthPaymentsResult,
    todayContractsResult,
    completedContractsResult,
    activePromosResult,
    activeAnnouncementsResult,
    weeklyPaymentsResult,
  ] = await Promise.all([
    // 대기 중인 환불 요청
    supabase
      .from('refund_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    
    // 대기 중인 문의
    supabase
      .from('cs_inquiries')
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
    
    // 이번 주 가입자
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart),
    
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
    
    // 지난 달 결제
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('paid_at', lastMonthStart)
      .lte('paid_at', lastMonthEnd),
    
    // 오늘 계약서
    supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart),
    
    // 서명 완료된 계약서
    supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),
    
    // 활성 프로모션 코드
    supabase
      .from('promo_codes')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    
    // 활성 공지사항
    supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .lte('starts_at', now.toISOString()),
    
    // 최근 7일 결제 (차트용)
    supabase
      .from('payments')
      .select('amount, paid_at')
      .eq('status', 'completed')
      .gte('paid_at', weekStart)
      .order('paid_at', { ascending: true }),
  ]);

  const todayPaymentsAmount = todayPaymentsResult.data?.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  ) || 0;

  const monthPaymentsAmount = monthPaymentsResult.data?.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  ) || 0;

  const lastMonthPaymentsAmount = lastMonthPaymentsResult.data?.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  ) || 0;

  // 일별 결제 금액 집계
  const weeklyPaymentsMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    weeklyPaymentsMap.set(dateStr, 0);
  }
  
  weeklyPaymentsResult.data?.forEach((p) => {
    if (p.paid_at) {
      const dateStr = new Date(p.paid_at).toISOString().split('T')[0];
      const current = weeklyPaymentsMap.get(dateStr) || 0;
      weeklyPaymentsMap.set(dateStr, current + (p.amount || 0));
    }
  });

  const weeklyPayments = Array.from(weeklyPaymentsMap.entries()).map(([date, amount]) => ({
    date,
    amount,
  }));

  return {
    pendingRefunds: pendingRefundsResult.count || 0,
    pendingInquiries: pendingInquiriesResult.count || 0,
    totalUsers: totalUsersResult.count || 0,
    todaySignups: todaySignupsResult.count || 0,
    weekSignups: weekSignupsResult.count || 0,
    todayPayments: {
      count: todayPaymentsResult.data?.length || 0,
      amount: todayPaymentsAmount,
    },
    monthPayments: {
      count: monthPaymentsResult.data?.length || 0,
      amount: monthPaymentsAmount,
    },
    lastMonthPayments: {
      count: lastMonthPaymentsResult.data?.length || 0,
      amount: lastMonthPaymentsAmount,
    },
    todayContracts: todayContractsResult.count || 0,
    completedContracts: completedContractsResult.count || 0,
    activePromos: activePromosResult.count || 0,
    activeAnnouncements: activeAnnouncementsResult.count || 0,
    weeklyPayments,
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

function SimpleBarChart({ data }: { data: { date: string; amount: number }[] }) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d) => {
        const height = (d.amount / maxAmount) * 100;
        const day = new Date(d.date).getDate();
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="relative w-full flex justify-center">
              <div
                className="w-full max-w-[40px] bg-blue-500 rounded-t-md transition-all hover:bg-blue-600"
                style={{ height: `${Math.max(height, 4)}%` }}
                title={`${d.amount.toLocaleString()}원`}
              />
            </div>
            <span className="text-xs text-gray-500">{day}일</span>
          </div>
        );
      })}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  // 매출 증감 계산
  const revenueGrowth = stats.lastMonthPayments.amount > 0
    ? ((stats.monthPayments.amount - stats.lastMonthPayments.amount) / stats.lastMonthPayments.amount) * 100
    : 0;

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-500 mt-1">싸인해주세요 운영 현황</p>
      </div>

      {/* 긴급 알림 */}
      {(stats.pendingRefunds > 0 || stats.pendingInquiries > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">처리 필요</h3>
          <div className="flex gap-4">
            {stats.pendingRefunds > 0 && (
              <Link href="/admin/refunds" className="text-red-700 hover:underline">
                환불 요청 {stats.pendingRefunds}건 대기 중
              </Link>
            )}
            {stats.pendingInquiries > 0 && (
              <Link href="/admin/inquiries" className="text-red-700 hover:underline">
                문의 {stats.pendingInquiries}건 대기 중
              </Link>
            )}
          </div>
        </div>
      )}

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
          title="문의 대기"
          value={stats.pendingInquiries}
          subValue={stats.pendingInquiries > 0 ? '응답이 필요합니다' : '대기 중인 문의 없음'}
          icon="💬"
          highlight={stats.pendingInquiries > 0}
        />
        <StatCard
          title="총 사용자"
          value={stats.totalUsers.toLocaleString()}
          subValue={`이번 주 +${stats.weekSignups}명 (오늘 +${stats.todaySignups}명)`}
          icon="👥"
        />
        <StatCard
          title="오늘 결제"
          value={`${stats.todayPayments.amount.toLocaleString()}원`}
          subValue={`${stats.todayPayments.count}건`}
          icon="💰"
        />
      </div>

      {/* 2열 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 이번 달 매출 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">이번 달 매출</h2>
          <div className="flex items-end gap-4 mb-4">
            <div>
              <p className="text-4xl font-bold text-gray-900">
                {stats.monthPayments.amount.toLocaleString()}원
              </p>
              <p className="text-gray-500 mt-1">
                총 {stats.monthPayments.count}건 결제
              </p>
            </div>
            {revenueGrowth !== 0 && (
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                revenueGrowth > 0 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {revenueGrowth > 0 ? '▲' : '▼'} {Math.abs(revenueGrowth).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            지난 달: {stats.lastMonthPayments.amount.toLocaleString()}원 ({stats.lastMonthPayments.count}건)
          </p>
        </div>

        {/* 최근 7일 매출 차트 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 7일 매출</h2>
          <SimpleBarChart data={stats.weeklyPayments} />
        </div>
      </div>

      {/* 추가 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="오늘 계약서"
          value={stats.todayContracts}
          subValue="작성됨"
          icon="📝"
        />
        <StatCard
          title="서명 완료"
          value={stats.completedContracts.toLocaleString()}
          subValue="총 완료 계약서"
          icon="✅"
        />
        <StatCard
          title="활성 프로모션"
          value={stats.activePromos}
          subValue="진행 중인 코드"
          icon="🎁"
        />
        <StatCard
          title="활성 공지"
          value={stats.activeAnnouncements}
          subValue="게시 중인 공지"
          icon="📢"
        />
      </div>

      {/* 빠른 액션 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/refunds"
            className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <span className="text-2xl">💳</span>
            <div>
              <p className="font-medium text-gray-900">환불 요청</p>
              <p className="text-sm text-gray-500">{stats.pendingRefunds}건 대기</p>
            </div>
          </Link>
          <Link
            href="/admin/inquiries"
            className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <span className="text-2xl">💬</span>
            <div>
              <p className="font-medium text-gray-900">문의 관리</p>
              <p className="text-sm text-gray-500">{stats.pendingInquiries}건 대기</p>
            </div>
          </Link>
          <Link
            href="/admin/promos/new"
            className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <span className="text-2xl">🎁</span>
            <div>
              <p className="font-medium text-gray-900">프로모션 생성</p>
              <p className="text-sm text-gray-500">새 코드 만들기</p>
            </div>
          </Link>
          <a
            href="https://dashboard.tosspayments.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <span className="text-2xl">🔗</span>
            <div>
              <p className="font-medium text-gray-900">토스페이먼츠</p>
              <p className="text-sm text-gray-500">결제 대시보드</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
