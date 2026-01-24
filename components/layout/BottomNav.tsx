'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

interface BottomNavProps {
  items: NavItem[];
  className?: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ items, className }) => {
  const pathname = usePathname();

  return (
    <nav
      className={clsx(
        'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-40',
        className
      )}
    >
      <div className="max-w-md mx-auto flex">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={clsx(
                'flex-1 py-3 flex flex-col items-center transition-colors',
                {
                  'text-blue-500': isActive,
                  'text-gray-400': !isActive,
                }
              )}
            >
              <span className="w-6 h-6 mb-1">
                {isActive && item.activeIcon ? item.activeIcon : item.icon}
              </span>
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
