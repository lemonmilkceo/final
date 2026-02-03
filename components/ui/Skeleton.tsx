'use client';

import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'rectangular' }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-200',
        {
          'rounded': variant === 'text',
          'rounded-full': variant === 'circular',
          'rounded-2xl': variant === 'rectangular',
        },
        className
      )}
    />
  );
}

// 계약서 카드 스켈레톤
export function ContractCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        {/* 아이콘 */}
        <Skeleton className="w-10 h-10 flex-shrink-0" variant="circular" />
        
        {/* 텍스트 영역 */}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-24" variant="text" />
          <Skeleton className="h-4 w-32" variant="text" />
        </div>
        
        {/* 배지 */}
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      
      {/* 하단 정보 */}
      <div className="flex gap-3 pt-1">
        <Skeleton className="h-4 w-20" variant="text" />
        <Skeleton className="h-4 w-24" variant="text" />
      </div>
    </div>
  );
}

// 대시보드 스켈레톤
export function DashboardSkeleton() {
  return (
    <div className="space-y-4 px-5 py-4">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between py-2">
        <Skeleton className="h-7 w-32" variant="text" />
        <div className="flex gap-2">
          <Skeleton className="w-10 h-10" variant="circular" />
          <Skeleton className="w-10 h-10" variant="circular" />
        </div>
      </div>
      
      {/* 요약 카드 */}
      <div className="bg-white rounded-2xl p-5 space-y-3">
        <Skeleton className="h-5 w-24" variant="text" />
        <Skeleton className="h-8 w-16" variant="text" />
      </div>
      
      {/* 폴더 탭 */}
      <div className="flex gap-2 overflow-x-auto py-2">
        <Skeleton className="h-9 w-16 rounded-full flex-shrink-0" />
        <Skeleton className="h-9 w-20 rounded-full flex-shrink-0" />
        <Skeleton className="h-9 w-24 rounded-full flex-shrink-0" />
      </div>
      
      {/* 계약서 리스트 */}
      <div className="space-y-3">
        <ContractCardSkeleton />
        <ContractCardSkeleton />
        <ContractCardSkeleton />
      </div>
    </div>
  );
}

// 계약서 상세 스켈레톤
export function ContractDetailSkeleton() {
  return (
    <div className="space-y-6 px-5 py-4">
      {/* 상태 배지 */}
      <div className="flex justify-center">
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      
      {/* 제목 */}
      <div className="text-center space-y-2">
        <Skeleton className="h-7 w-40 mx-auto" variant="text" />
        <Skeleton className="h-5 w-32 mx-auto" variant="text" />
      </div>
      
      {/* 정보 카드 */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" variant="text" />
          <Skeleton className="h-4 w-24" variant="text" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" variant="text" />
          <Skeleton className="h-4 w-20" variant="text" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" variant="text" />
          <Skeleton className="h-4 w-28" variant="text" />
        </div>
      </div>
      
      {/* 버튼 */}
      <div className="space-y-3 pt-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  );
}

export default Skeleton;
