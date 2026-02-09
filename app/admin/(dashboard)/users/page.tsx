import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface User {
  id: string;
  name: string | null;
  phone: string | null;
  role: string | null;
  is_blocked: boolean | null;
  created_at: string;
  contractCredits: number;
  provider?: string;
}

async function getUsers(search?: string, role?: string): Promise<User[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from('profiles')
    .select(`
      id,
      name,
      phone,
      role,
      is_blocked,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  if (role && role !== 'all' && (role === 'employer' || role === 'worker')) {
    query = query.eq('role', role);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  const profiles = data || [];
  const userIds = profiles.map(p => p.id);

  // credit_type = 'contract'인 크레딧만 가져오기
  const { data: creditsData } = await supabase
    .from('credits')
    .select('user_id, amount')
    .eq('credit_type', 'contract')
    .in('user_id', userIds);

  const creditsMap = new Map<string, number>();
  if (creditsData) {
    for (const c of creditsData) {
      creditsMap.set(c.user_id, c.amount);
    }
  }

  // provider 정보 가져오기
  const { data: providers } = await supabase.rpc('get_user_providers');
  const providerMap = new Map<string, string>();
  if (providers) {
    for (const p of providers) {
      providerMap.set(p.user_id, p.provider);
    }
  }

  // users에 provider 및 크레딧 정보 추가
  return profiles.map(profile => ({
    id: profile.id,
    name: profile.name,
    phone: profile.phone,
    role: profile.role,
    is_blocked: profile.is_blocked,
    created_at: profile.created_at,
    contractCredits: creditsMap.get(profile.id) || 0,
    provider: providerMap.get(profile.id) || 'unknown',
  }));
}

async function getUserStats(): Promise<{
  total: number;
  employers: number;
  workers: number;
  blocked: number;
}> {
  const supabase = createAdminClient();

  const [totalResult, employerResult, workerResult, blockedResult] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'employer'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'worker'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_blocked', true),
  ]);

  return {
    total: totalResult.count || 0,
    employers: employerResult.count || 0,
    workers: workerResult.count || 0,
    blocked: blockedResult.count || 0,
  };
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateString));
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string }>;
}) {
  const params = await searchParams;
  const users = await getUsers(params.search, params.role);
  const stats = await getUserStats();

  const roleFilters = [
    { value: 'all', label: '전체' },
    { value: 'employer', label: '사장님' },
    { value: 'worker', label: '직원' },
  ];

  const currentRole = params.role || 'all';

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
        <p className="text-gray-500 mt-1">전체 사용자를 조회하고 관리합니다</p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-gray-500 text-sm">전체</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-gray-500 text-sm">사장님</p>
          <p className="text-2xl font-bold text-gray-900">{stats.employers}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-gray-500 text-sm">직원</p>
          <p className="text-2xl font-bold text-gray-900">{stats.workers}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-gray-500 text-sm">차단됨</p>
          <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex gap-4 mb-6">
        <form className="flex-1" action="/admin/users" method="GET">
          <input type="hidden" name="role" value={currentRole} />
          <div className="relative">
            <input
              type="text"
              name="search"
              defaultValue={params.search}
              placeholder="이름 또는 전화번호로 검색"
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
        </form>

        <div className="flex gap-2">
          {roleFilters.map((filter) => (
            <Link
              key={filter.value}
              href={`/admin/users?role=${filter.value}${params.search ? `&search=${params.search}` : ''}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentRole === filter.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">사용자가 없습니다</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">이름</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">전화번호</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">역할</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">크레딧</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">상태</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">가입일</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span title={user.provider === 'kakao' ? '카카오 로그인' : user.provider === 'apple' ? '애플 로그인' : user.provider}>
                        {user.provider === 'kakao' ? '💬' : user.provider === 'apple' ? '🍎' : '❓'}
                      </span>
                      <p className="font-medium text-gray-900">
                        {user.name || '이름 없음'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {user.phone || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'employer'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'employer' ? '사장님' : user.role === 'worker' ? '직원' : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {user.contractCredits}
                  </td>
                  <td className="px-6 py-4">
                    {user.is_blocked ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        차단됨
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        정상
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/users/${user.id}`}
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
