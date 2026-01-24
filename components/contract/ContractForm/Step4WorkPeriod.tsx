'use client';

import { useContractFormStore } from '@/stores/contractFormStore';
import clsx from 'clsx';

export default function Step4WorkPeriod() {
  const { data, updateData, nextStep, prevStep } = useContractFormStore();

  const handleNext = () => {
    if (data.startDate && (data.hasNoEndDate || data.endDate)) {
      nextStep();
    }
  };

  const isValid = data.startDate && (data.hasNoEndDate || data.endDate);

  return (
    <>
      <div className="flex-1 px-6 pt-8">
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-8">
          언제부터 일하나요?
        </h1>

        <div className="space-y-5">
          {/* Start Date */}
          <div>
            <label className="text-[14px] text-gray-500 font-medium mb-2 block">
              시작일
            </label>
            <input
              type="date"
              value={data.startDate}
              onChange={(e) => updateData({ startDate: e.target.value })}
              className="w-full bg-gray-100 rounded-2xl px-5 py-4 text-[17px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-[14px] text-gray-500 font-medium mb-2 block">
              종료일
            </label>
            <input
              type="date"
              value={data.endDate || ''}
              onChange={(e) => updateData({ endDate: e.target.value || null })}
              disabled={data.hasNoEndDate}
              className={clsx(
                'w-full bg-gray-100 rounded-2xl px-5 py-4 text-[17px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500',
                data.hasNoEndDate && 'opacity-50 cursor-not-allowed'
              )}
            />
          </div>

          {/* No End Date Checkbox */}
          <label className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              checked={data.hasNoEndDate}
              onChange={(e) =>
                updateData({
                  hasNoEndDate: e.target.checked,
                  endDate: e.target.checked ? null : data.endDate,
                })
              }
              className="sr-only peer"
            />
            <span className="w-6 h-6 rounded-md border-2 border-gray-300 peer-checked:bg-blue-500 peer-checked:border-blue-500 flex items-center justify-center transition-colors">
              {data.hasNoEndDate && (
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
            <span className="text-[15px] text-gray-700">
              종료일 없이 계속 일해요
            </span>
          </label>
        </div>
      </div>

      <div className="px-6 pb-4 safe-bottom flex gap-3">
        <button
          onClick={prevStep}
          className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-lg"
        >
          이전
        </button>
        <button
          onClick={handleNext}
          disabled={!isValid}
          className={clsx(
            'flex-1 py-4 rounded-2xl font-semibold text-lg transition-colors',
            isValid
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
