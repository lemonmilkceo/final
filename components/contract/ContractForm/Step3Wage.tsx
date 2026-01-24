'use client';

import { useState, useEffect } from 'react';
import { useContractFormStore } from '@/stores/contractFormStore';
import clsx from 'clsx';
import { formatCurrency } from '@/lib/utils/format';

const MINIMUM_WAGE_2026 = 10030;

export default function Step3Wage() {
  const { data, updateData, nextStep, prevStep } = useContractFormStore();
  const [displayValue, setDisplayValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (data.hourlyWage) {
      setDisplayValue(data.hourlyWage.toLocaleString());
    }
  }, [data.hourlyWage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const numValue = parseInt(value, 10);

    if (value === '') {
      setDisplayValue('');
      updateData({ hourlyWage: null });
      setError('');
      return;
    }

    setDisplayValue(numValue.toLocaleString());
    updateData({ hourlyWage: numValue });

    if (numValue < MINIMUM_WAGE_2026) {
      setError(`최저시급(${formatCurrency(MINIMUM_WAGE_2026)}) 미만이에요`);
    } else {
      setError('');
    }
  };

  const handleNext = () => {
    if (data.hourlyWage && data.hourlyWage >= MINIMUM_WAGE_2026) {
      nextStep();
    }
  };

  const isValid = data.hourlyWage && data.hourlyWage >= MINIMUM_WAGE_2026;

  return (
    <>
      <div className="flex-1 px-6 pt-8">
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-8">
          시급을
          <br />
          얼마로 할까요?
        </h1>

        {/* Wage Input */}
        <div className="flex items-end gap-2 mb-4">
          <input
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            placeholder="0"
            autoFocus
            className={clsx(
              'flex-1 border-0 border-b-2 bg-transparent text-[36px] font-bold text-gray-900 text-right focus:outline-none py-2 transition-colors',
              error
                ? 'border-red-500'
                : 'border-gray-200 focus:border-blue-500'
            )}
          />
          <span className="text-[20px] font-semibold text-gray-500 pb-3">
            원
          </span>
        </div>

        {error && (
          <p className="text-[13px] text-red-500 mb-4 flex items-center gap-1">
            <span>⚠️</span>
            {error}
          </p>
        )}

        {/* Checkbox */}
        <label className="flex items-center gap-3 py-3">
          <input
            type="checkbox"
            checked={data.includesWeeklyAllowance}
            onChange={(e) =>
              updateData({ includesWeeklyAllowance: e.target.checked })
            }
            className="sr-only peer"
          />
          <span className="w-6 h-6 rounded-md border-2 border-gray-300 peer-checked:bg-blue-500 peer-checked:border-blue-500 flex items-center justify-center transition-colors">
            {data.includesWeeklyAllowance && (
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
            주휴수당이 포함된 시급
          </span>
        </label>

        {/* Info Card */}
        <div className="bg-blue-50 rounded-xl p-4 mt-6 flex items-center gap-3">
          <span className="text-xl">💡</span>
          <span className="text-[14px] text-blue-700">
            2026년 최저시급은{' '}
            <strong>{formatCurrency(MINIMUM_WAGE_2026)}</strong>이에요
          </span>
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
