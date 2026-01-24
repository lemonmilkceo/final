'use client';

import { useContractFormStore } from '@/stores/contractFormStore';
import clsx from 'clsx';
import type { BusinessSize } from '@/types';

const options: {
  value: BusinessSize;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'under_5',
    label: '5명 미만',
    description: '소규모 가게 (1~4명)',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    value: 'over_5',
    label: '5명 이상',
    description: '중소규모 이상 (5명~)',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

// 안내 메시지
const infoMessages: Record<BusinessSize, { color: 'green' | 'yellow'; title: string; description?: string }> = {
  under_5: {
    color: 'green',
    title: '소규모 가게는 간단하게 진행됩니다 ✓',
  },
  over_5: {
    color: 'yellow',
    title: '5명 이상이면 수당을 더 자세히 적어야 해요',
    description: '걱정마세요, 제가 자동으로 계산해드릴게요!',
  },
};

export default function Step1BusinessSize() {
  const { data, updateData, nextStep } = useContractFormStore();

  const handleSelect = (value: BusinessSize) => {
    updateData({ businessSize: value });
  };

  const handleNext = () => {
    if (data.businessSize) {
      nextStep();
    }
  };

  const selectedInfo = data.businessSize ? infoMessages[data.businessSize] : null;

  return (
    <>
      <div className="flex-1 px-6 pt-8">
        {/* 질문 */}
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-2">
          사장님, 가게에 직원이
          <br />
          몇 명인가요?
        </h1>
        <p className="text-[15px] text-gray-500 mb-8">
          사장님 본인도 포함해서 알려주세요
        </p>

        {/* 옵션 카드 */}
        <div className="space-y-3">
          {options.map((option) => {
            const isSelected = data.businessSize === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={clsx(
                  'w-full border-2 rounded-2xl p-5 text-left transition-all',
                  isSelected
                    ? 'border-blue-500 bg-white'
                    : 'border-gray-200 bg-white'
                )}
              >
                <div className="flex items-center gap-4">
                  {/* 아이콘 */}
                  <div
                    className={clsx(
                      'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {option.icon}
                  </div>
                  
                  {/* 텍스트 */}
                  <div>
                    <span
                      className={clsx(
                        'text-[18px] font-bold block',
                        isSelected ? 'text-blue-500' : 'text-gray-900'
                      )}
                    >
                      {option.label}
                    </span>
                    <span className="text-[14px] text-gray-500">
                      {option.description}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 안내 박스 */}
        {selectedInfo && (
          <div
            className={clsx(
              'mt-6 p-4 rounded-2xl border',
              selectedInfo.color === 'green'
                ? 'bg-green-50 border-green-200'
                : 'bg-amber-50 border-amber-200'
            )}
          >
            <div className="flex items-start gap-2">
              <span
                className={clsx(
                  'text-lg',
                  selectedInfo.color === 'green' ? 'text-green-600' : 'text-amber-600'
                )}
              >
                ℹ️
              </span>
              <div>
                <p
                  className={clsx(
                    'text-[15px] font-medium',
                    selectedInfo.color === 'green' ? 'text-green-700' : 'text-amber-700'
                  )}
                >
                  {selectedInfo.title}
                </p>
                {selectedInfo.description && (
                  <p
                    className={clsx(
                      'text-[14px] mt-1',
                      selectedInfo.color === 'green' ? 'text-green-600' : 'text-amber-600'
                    )}
                  >
                    {selectedInfo.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 다음 버튼 */}
      <div className="px-6 pb-4 safe-bottom">
        <button
          onClick={handleNext}
          disabled={!data.businessSize}
          className={clsx(
            'w-full py-4 rounded-2xl font-semibold text-lg transition-colors',
            data.businessSize
              ? 'bg-blue-500 text-white active:bg-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          다음
        </button>
      </div>
    </>
  );
}
