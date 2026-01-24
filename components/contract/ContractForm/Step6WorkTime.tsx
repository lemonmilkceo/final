'use client';

import { useContractFormStore } from '@/stores/contractFormStore';
import clsx from 'clsx';

const calculateWorkHours = (start: string, end: string): number => {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  const diff = endMinutes - startMinutes;
  return diff > 0 ? diff / 60 : 0;
};

export default function Step6WorkTime() {
  const { data, updateData, nextStep, prevStep } = useContractFormStore();

  const workHours = calculateWorkHours(data.workStartTime, data.workEndTime);

  const handleNext = () => {
    if (data.workStartTime && data.workEndTime && workHours > 0) {
      nextStep();
    }
  };

  const isValid = workHours > 0;

  return (
    <>
      <div className="flex-1 px-6 pt-8">
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-8">
          몇 시부터 몇 시까지
          <br />
          일하나요?
        </h1>

        {/* Time Picker */}
        <div className="bg-gray-100 rounded-2xl p-6 flex items-center justify-center gap-4">
          <input
            type="time"
            value={data.workStartTime}
            onChange={(e) => updateData({ workStartTime: e.target.value })}
            className="bg-white rounded-xl px-4 py-3 text-[20px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-[20px] text-gray-400">→</span>
          <input
            type="time"
            value={data.workEndTime}
            onChange={(e) => updateData({ workEndTime: e.target.value })}
            className="bg-white rounded-xl px-4 py-3 text-[20px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Auto Calculation */}
        {workHours > 0 && (
          <p className="text-[15px] text-gray-500 text-center mt-4">
            하루에 <span className="font-semibold text-blue-500">{workHours}시간</span>{' '}
            일해요
          </p>
        )}
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
