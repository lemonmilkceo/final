'use client';

import { useState } from 'react';
import { useContractFormStore } from '@/stores/contractFormStore';
import clsx from 'clsx';

const BREAK_OPTIONS = [0, 30, 60, 120];

export default function Step7BreakTime() {
  const { data, updateData, nextStep, prevStep } = useContractFormStore();
  const [showCustom, setShowCustom] = useState(
    !BREAK_OPTIONS.includes(data.breakMinutes)
  );

  const handleSelect = (minutes: number) => {
    updateData({ breakMinutes: minutes });
    setShowCustom(false);
  };

  const handleCustom = () => {
    setShowCustom(true);
  };

  const handleNext = () => {
    if (data.breakMinutes >= 0) {
      nextStep();
    }
  };

  return (
    <>
      <div className="flex-1 px-6 pt-8">
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-2">
          휴게시간은
          <br />
          얼마나 줄 건가요?
        </h1>
        <p className="text-[15px] text-gray-500 mb-8">
          4시간 이상 근무 시 30분 이상 필수예요
        </p>

        {/* Break Time Options */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {BREAK_OPTIONS.map((minutes) => (
            <button
              key={minutes}
              onClick={() => handleSelect(minutes)}
              className={clsx(
                'py-4 rounded-2xl font-semibold text-[17px] transition-colors',
                data.breakMinutes === minutes && !showCustom
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              )}
            >
              {minutes === 0 ? '없음' : `${minutes}분`}
            </button>
          ))}
          <button
            onClick={handleCustom}
            className={clsx(
              'py-4 rounded-2xl font-semibold text-[17px] transition-colors col-span-2',
              showCustom ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
            )}
          >
            직접 입력
          </button>
        </div>

        {/* Custom Input */}
        {showCustom && (
          <div className="bg-gray-100 rounded-2xl px-5 py-4 flex items-center justify-center gap-2 mt-4">
            <input
              type="number"
              value={data.breakMinutes}
              onChange={(e) =>
                updateData({
                  breakMinutes: Math.max(0, parseInt(e.target.value, 10) || 0),
                })
              }
              min="0"
              max="180"
              autoFocus
              className="w-20 text-center bg-white rounded-lg py-2 text-[20px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[17px] text-gray-500">분</span>
          </div>
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
          className="flex-1 py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg active:bg-blue-600"
        >
          다음
        </button>
      </div>
    </>
  );
}
