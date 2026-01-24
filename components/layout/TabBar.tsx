'use client';

import React from 'react';
import clsx from 'clsx';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <div
      className={clsx(
        'bg-white px-5 sticky top-14 z-30 border-b border-gray-100',
        className
      )}
    >
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={clsx(
              'flex-1 py-3 text-[15px] font-medium transition-colors relative',
              {
                'text-blue-500 font-semibold': activeTab === tab.id,
                'text-gray-400': activeTab !== tab.id,
              }
            )}
          >
            <span className="flex items-center justify-center gap-1">
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={clsx(
                    'text-[11px] px-1.5 py-0.5 rounded-full',
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-500'
                      : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>

            {/* Active Indicator */}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabBar;
