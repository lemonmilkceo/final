'use client';

import { useState } from 'react';
import { useContractFormStore } from '@/stores/contractFormStore';
import clsx from 'clsx';

export default function Step2WorkerName() {
  const { data, updateData, nextStep, prevStep } = useContractFormStore();
  const [error, setError] = useState('');

  const validateName = (name: string) => {
    if (name.length < 2) {
      return '이름은 2자 이상 입력해주세요';
    }
    if (name.length > 10) {
      return '이름은 10자 이하로 입력해주세요';
    }
    if (!/^[가-힣]+$/.test(name)) {
      return '한글로만 입력해주세요';
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateData({ workerName: value });
    if (error) setError('');
  };

  const handleNext = () => {
    const validationError = validateName(data.workerName);
    if (validationError) {
      setError(validationError);
      return;
    }
    nextStep();
  };

  const isValid = data.workerName.length >= 2 && /^[가-힣]+$/.test(data.workerName);

  return (
    <>
      <div className="flex-1 px-6 pt-8">
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-8">
          근로자 이름이
          <br />
          어떻게 되나요?
        </h1>

        <input
          type="text"
          value={data.workerName}
          onChange={handleChange}
          placeholder="이름을 입력하세요"
          autoFocus
          className={clsx(
            'w-full border-0 border-b-2 bg-transparent text-[28px] font-bold text-gray-900 placeholder-gray-300 focus:outline-none py-2 transition-colors',
            error ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
          )}
        />

        {error && (
          <p className="text-[13px] text-red-500 mt-2 flex items-center gap-1">
            <span>⚠️</span>
            {error}
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
