'use client';

import { useContractFormStore } from '@/stores/contractFormStore';
import clsx from 'clsx';
import type { BusinessSize } from '@/types';

const options: { value: BusinessSize; label: string; description: string }[] = [
  { value: 'under_5', label: '5인 미만', description: '4대보험 선택 가입' },
  { value: 'over_5', label: '5인 이상', description: '4대보험 의무 가입' },
];

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

  return (
    <>
      <div className="flex-1 px-6 pt-8">
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-2">
          사업장 규모가
          <br />
          어떻게 되나요?
        </h1>
        <p className="text-[15px] text-gray-500 mb-8">
          4대보험 적용 여부가 달라져요
        </p>

        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={clsx(
                'w-full border-2 rounded-2xl p-5 text-left transition-colors',
                data.businessSize === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={clsx(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                    data.businessSize === option.value
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  )}
                >
                  {data.businessSize === option.value && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </span>
                <div>
                  <span className="text-[17px] font-semibold text-gray-900 block">
                    {option.label}
                  </span>
                  <span className="text-[14px] text-gray-500">
                    {option.description}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

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
