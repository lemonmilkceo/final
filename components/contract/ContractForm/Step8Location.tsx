'use client';

import { useContractFormStore } from '@/stores/contractFormStore';
import clsx from 'clsx';

export default function Step8Location() {
  const { data, updateData, nextStep, prevStep } = useContractFormStore();

  const handleNext = () => {
    if (data.workLocation.trim()) {
      nextStep();
    }
  };

  const isValid = data.workLocation.trim().length > 0;

  return (
    <>
      <div className="flex-1 px-6 pt-8">
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-8">
          어디서 일하나요?
        </h1>

        {/* Location Input */}
        <input
          type="text"
          value={data.workLocation}
          onChange={(e) => updateData({ workLocation: e.target.value })}
          placeholder="주소를 입력하세요"
          autoFocus
          className="w-full bg-gray-100 rounded-2xl px-5 py-4 text-[17px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <p className="text-[13px] text-gray-400 mt-3">
          예: 서울시 강남구 테헤란로 123, OO빌딩 1층
        </p>
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
