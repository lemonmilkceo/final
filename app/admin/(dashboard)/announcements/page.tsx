import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import AnnouncementActions from './announcement-actions';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  target_roles: string[];
  priority: number;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  link_url: string | null;
  created_at: string;
}

async function getAnnouncements(): Promise<Announcement[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('announcements')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  return (data as Announcement[]) || [];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateString));
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    notice: 'bg-blue-100 text-blue-800',
    popup: 'bg-purple-100 text-purple-800',
    banner: 'bg-orange-100 text-orange-800',
  };

  const labels: Record<string, string> = {
    notice: '공지',
    popup: '팝업',
    banner: '배너',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type] || 'bg-gray-100 text-gray-800'}`}>
      {labels[type] || type}
    </span>
  );
}

function StatusBadge({ announcement }: { announcement: Announcement }) {
  const now = new Date();
  const startsAt = new Date(announcement.starts_at);
  const endsAt = announcement.ends_at ? new Date(announcement.ends_at) : null;

  if (!announcement.is_active) {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
        비활성
      </span>
    );
  }

  if (startsAt > now) {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
        예약됨
      </span>
    );
  }

  if (endsAt && endsAt < now) {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
        종료됨
      </span>
    );
  }

  return (
    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
      게시중
    </span>
  );
}

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();

  const activeCount = announcements.filter((a) => {
    const now = new Date();
    const startsAt = new Date(a.starts_at);
    const endsAt = a.ends_at ? new Date(a.ends_at) : null;
    return a.is_active && startsAt <= now && (!endsAt || endsAt > now);
  }).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">공지사항</h1>
        <Link
          href="/admin/announcements/new"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          + 새 공지 작성
        </Link>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">전체 공지</p>
          <p className="text-2xl font-bold text-gray-900">{announcements.length}개</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">현재 게시중</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}개</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">팝업 공지</p>
          <p className="text-2xl font-bold text-purple-600">
            {announcements.filter((a) => a.type === 'popup').length}개
          </p>
        </div>
      </div>

      {/* 공지사항 목록 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  유형
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  제목
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  대상
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  기간
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  상태
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  우선순위
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {announcements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    공지사항이 없습니다
                  </td>
                </tr>
              ) : (
                announcements.map((announcement) => (
                  <tr key={announcement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <TypeBadge type={announcement.type} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 max-w-[300px] truncate">
                        {announcement.title}
                      </p>
                      {announcement.link_url && (
                        <p className="text-xs text-blue-600 truncate">
                          {announcement.link_url}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {announcement.target_roles.includes('employer') && announcement.target_roles.includes('worker')
                        ? '전체'
                        : announcement.target_roles.includes('employer')
                        ? '사장님'
                        : '직원'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <p>{formatDate(announcement.starts_at)}</p>
                      {announcement.ends_at && (
                        <p className="text-gray-400">~ {formatDate(announcement.ends_at)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge announcement={announcement} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {announcement.priority}
                    </td>
                    <td className="px-6 py-4">
                      <AnnouncementActions
                        announcementId={announcement.id}
                        isActive={announcement.is_active}
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
