'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { adminLogout } from '@/lib/admin/auth';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: '대시보드', href: '/admin', icon: '📊' },
  { label: '환불 관리', href: '/admin/refunds', icon: '💳' },
  { label: '사용자 관리', href: '/admin/users', icon: '👥' },
  // Phase 2에서 추가 예정
  // { label: '문의 관리', href: '/admin/inquiries', icon: '💬' },
  // { label: '프로모션', href: '/admin/promos', icon: '🎁' },
  // { label: '공지사항', href: '/admin/announcements', icon: '📢' },
];

interface AdminSidebarProps {
  pendingRefunds?: number;
}

export default function AdminSidebar({ pendingRefunds = 0 }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await adminLogout();
    router.push('/admin/login');
    router.refresh();
  };

  // 뱃지 추가
  const itemsWithBadges = navItems.map((item) => ({
    ...item,
    badge: item.href === '/admin/refunds' ? pendingRefunds : undefined,
  }));

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-gray-900 text-white flex flex-col">
      {/* 로고 */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-lg font-bold">싸인해주세요</h1>
        <p className="text-gray-400 text-sm mt-1">관리자</p>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 py-4">
        {itemsWithBadges.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white border-l-4 border-blue-500'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 로그아웃 */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          <span>🚪</span>
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
