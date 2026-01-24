'use client';

import React from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import clsx from 'clsx';

interface ReviewItem {
  category: string;
  status: 'pass' | 'warning' | 'fail';
  title: string;
  description: string;
  suggestion: string | null;
}

interface AIReviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  overallStatus: 'pass' | 'warning' | 'fail';
  items: ReviewItem[];
  aiSummary?: string | null;
}

const statusConfig = {
  pass: {
    icon: '✅',
    label: '통과',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  warning: {
    icon: '⚠️',
    label: '주의',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  fail: {
    icon: '❌',
    label: '문제 발견',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

const overallStatusConfig = {
  pass: {
    emoji: '🎉',
    title: '문제없어요!',
    description: '모든 항목이 법적 기준을 충족해요.',
    bgGradient: 'from-green-50 to-green-100',
  },
  warning: {
    emoji: '🔍',
    title: '확인이 필요해요',
    description: '일부 항목을 검토해주세요.',
    bgGradient: 'from-amber-50 to-amber-100',
  },
  fail: {
    emoji: '🚨',
    title: '수정이 필요해요',
    description: '법적 기준에 미달하는 항목이 있어요.',
    bgGradient: 'from-red-50 to-red-100',
  },
};

export default function AIReviewSheet({
  isOpen,
  onClose,
  overallStatus,
  items,
  aiSummary,
}: AIReviewSheetProps) {
  const overall = overallStatusConfig[overallStatus];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[80vh] overflow-y-auto pb-4">
        {/* 전체 상태 */}
        <div
          className={clsx(
            'rounded-2xl p-6 text-center mb-6 bg-gradient-to-b',
            overall.bgGradient
          )}
        >
          <span className="text-5xl block mb-3">{overall.emoji}</span>
          <h2 className="text-[20px] font-bold text-gray-900 mb-1">
            {overall.title}
          </h2>
          <p className="text-[14px] text-gray-600">{overall.description}</p>
        </div>

        {/* 검토 항목 목록 */}
        <div className="space-y-3 mb-6">
          <p className="text-[14px] font-semibold text-gray-500 px-1">
            검토 항목
          </p>

          {items.map((item, index) => {
            const status = statusConfig[item.status];

            return (
              <div
                key={index}
                className={clsx(
                  'rounded-xl p-4 border',
                  status.bgColor,
                  status.borderColor
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{status.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[15px] font-semibold text-gray-900">
                        {item.title}
                      </span>
                      <span
                        className={clsx(
                          'text-[11px] font-medium px-2 py-0.5 rounded-full',
                          status.bgColor,
                          status.color
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-600 mb-2">
                      {item.description}
                    </p>
                    {item.suggestion && (
                      <p className="text-[12px] text-gray-500 bg-white/50 rounded-lg p-2">
                        💡 {item.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI 요약 (있는 경우) */}
        {aiSummary && (
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <p className="text-[13px] font-semibold text-blue-700 mb-1">
                  AI 노무사 의견
                </p>
                <p className="text-[13px] text-blue-800 leading-relaxed">
                  {aiSummary}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 안내 문구 */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-[12px] text-gray-500 leading-relaxed">
            ℹ️ 이 검토 결과는 참고용이며, 실제 법적 효력은 없어요. 정확한 검토가
            필요하시면 공인 노무사와 상담하세요.
          </p>
        </div>

        {/* 닫기 버튼 */}
        <Button onClick={onClose} variant="secondary">
          확인
        </Button>
      </div>
    </BottomSheet>
  );
}
