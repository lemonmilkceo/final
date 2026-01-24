'use client';

import { useContractFormStore } from '@/stores/contractFormStore';
import clsx from 'clsx';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function Step5WorkDays() {
  const { data, updateData, nextStep, prevStep } = useContractFormStore();

  const toggleDay = (day: string) => {
    const newDays = data.workDays.includes(day)
      ? data.workDays.filter((d) => d !== day)
      : [...data.workDays, day];
    updateData({ workDays: newDays, useWorkDaysPerWeek: false });
  };

  const handleNext = () => {
    if (
      data.workDays.length > 0 ||
      (data.useWorkDaysPerWeek && data.workDaysPerWeek)
    ) {
      nextStep();
    }
  };

  const isValid =
    data.workDays.length > 0 ||
    (data.useWorkDaysPerWeek && data.workDaysPerWeek && data.workDaysPerWeek > 0);

  return (
    <>
      <div className="flex-1 px-6 pt-8">
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-8">
          무슨 요일에 일하나요?
        </h1>

        {/* Day Chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              disabled={data.useWorkDaysPerWeek}
              className={clsx(
                'w-12 h-12 rounded-full font-semibold text-[15px] transition-colors',
                data.workDays.includes(day)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700',
                data.useWorkDaysPerWeek && 'opacity-50 cursor-not-allowed'
              )}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[14px] text-gray-400">또는</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Weekly Input */}
        <div
          className={clsx(
            'bg-gray-100 rounded-2xl px-5 py-4 flex items-center justify-center gap-2',
            data.useWorkDaysPerWeek && 'ring-2 ring-blue-500'
          )}
        >
          <span className="text-[17px] text-gray-500">일주일에</span>
          <input
            type="number"
            value={data.workDaysPerWeek || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              updateData({
                workDaysPerWeek: isNaN(value) ? null : Math.min(Math.max(value, 1), 7),
                useWorkDaysPerWeek: true,
                workDays: [],
              });
            }}
            min="1"
            max="7"
            className="w-12 text-center bg-white rounded-lg py-2 text-[20px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-[17px] text-gray-500">일</span>
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
