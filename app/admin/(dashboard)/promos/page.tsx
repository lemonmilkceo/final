import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import PromoActions from './promo-actions';

interface PromoCode {
  id: string;
  code: string;
  credit_amount: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  description: string | null;
  created_at: string;
}

async function getPromoCodes(): Promise<PromoCode[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false });

  return (data as PromoCode[]) || [];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateString));
}

function StatusBadge({ promo }: { promo: PromoCode }) {
  const now = new Date();
  const isExpired = promo.expires_at && new Date(promo.expires_at) < now;
  const isMaxedOut = promo.max_uses !== null && promo.current_uses >= promo.max_uses;

  if (!promo.is_active) {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
        비활성
      </span>
    );
  }

  if (isExpired) {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
        만료됨
      </span>
    );
  }

  if (isMaxedOut) {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
        소진됨
      </span>
    );
  }

  return (
    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
      활성
    </span>
  );
}

export default async function PromosPage() {
  const promoCodes = await getPromoCodes();

  const activeCount = promoCodes.filter(
    (p) =>
      p.is_active &&
      (!p.expires_at || new Date(p.expires_at) > new Date()) &&
      (p.max_uses === null || p.current_uses < p.max_uses)
  ).length;

  const totalUses = promoCodes.reduce((sum, p) => sum + p.current_uses, 0);
  const totalCreditsGiven = promoCodes.reduce(
    (sum, p) => sum + p.current_uses * p.credit_amount,
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">프로모션 코드</h1>
        <Link
          href="/admin/promos/new"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          + 새 코드 생성
        </Link>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">전체 코드</p>
          <p className="text-2xl font-bold text-gray-900">{promoCodes.length}개</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">활성 코드</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}개</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">총 사용 횟수</p>
          <p className="text-2xl font-bold text-blue-600">{totalUses}회</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">지급된 크레딧</p>
          <p className="text-2xl font-bold text-purple-600">{totalCreditsGiven}개</p>
        </div>
      </div>

      {/* 프로모션 코드 목록 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  코드
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  크레딧
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  사용 현황
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  만료일
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  상태
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  설명
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promoCodes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    프로모션 코드가 없습니다
                  </td>
                </tr>
              ) : (
                promoCodes.map((promo) => (
                  <tr key={promo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono font-bold">
                        {promo.code}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      +{promo.credit_amount}개
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {promo.current_uses}
                      {promo.max_uses !== null && (
                        <span className="text-gray-400">
                          {' '}
                          / {promo.max_uses}
                        </span>
                      )}
                      {promo.max_uses === null && (
                        <span className="text-gray-400"> (무제한)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(promo.expires_at)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge promo={promo} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                      {promo.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <PromoActions
                        promoId={promo.id}
                        isActive={promo.is_active}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
