'use client';

import { useState, useEffect } from 'react';
import { useContractFormStore, type WageType } from '@/stores/contractFormStore';
import clsx from 'clsx';
import { formatCurrency } from '@/lib/utils/format';

const MINIMUM_WAGE_2026 = 10360;
const MINIMUM_WAGE_WITH_WEEKLY_ALLOWANCE = 12432; // 10360 × 1.2

const wageOptions: { value: WageType; label: string; icon: React.ReactNode }[] = [
  {
    value: 'hourly',
    label: '시급',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
  },
  {
    value: 'monthly',
    label: '월급',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
];

export default function Step3Wage() {
  const { data, updateData, nextStep, prevStep } = useContractFormStore();
  const [hourlyDisplayValue, setHourlyDisplayValue] = useState('');
  const [monthlyDisplayValue, setMonthlyDisplayValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (data.hourlyWage) {
      setHourlyDisplayValue(data.hourlyWage.toLocaleString());
    }
    if (data.monthlyWage) {
      setMonthlyDisplayValue(data.monthlyWage.toLocaleString());
    }
  }, [data.hourlyWage, data.monthlyWage]);

  const handleWageTypeChange = (type: WageType) => {
    updateData({ wageType: type });
    setError('');
  };

  const handleHourlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const numValue = parseInt(value, 10);

    if (value === '') {
      setHourlyDisplayValue('');
      updateData({ hourlyWage: null });
      setError('');
      return;
    }

    setHourlyDisplayValue(numValue.toLocaleString());
    updateData({ hourlyWage: numValue });

    const minWage = data.includesWeeklyAllowance
      ? MINIMUM_WAGE_WITH_WEEKLY_ALLOWANCE
      : MINIMUM_WAGE_2026;

    if (numValue < minWage) {
      setError(`최저시급(${formatCurrency(minWage)}) 미만이에요`);
    } else {
      setError('');
    }
  };

  const handleMonthlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const numValue = parseInt(value, 10);

    if (value === '') {
      setMonthlyDisplayValue('');
      updateData({ monthlyWage: null });
      return;
    }

    setMonthlyDisplayValue(numValue.toLocaleString());
    updateData({ monthlyWage: numValue });
  };

  const handleWeeklyAllowanceChange = (checked: boolean) => {
    updateData({ includesWeeklyAllowance: checked });

    // 시급일 때만 최저시급 검증
    if (data.wageType === 'hourly' && data.hourlyWage) {
      const minWage = checked ? MINIMUM_WAGE_WITH_WEEKLY_ALLOWANCE : MINIMUM_WAGE_2026;
      if (data.hourlyWage < minWage) {
        setError(`최저시급(${formatCurrency(minWage)}) 미만이에요`);
      } else {
        setError('');
      }
    }
  };

  const handleNext = () => {
    if (data.wageType === 'hourly') {
      const minWage = data.includesWeeklyAllowance
        ? MINIMUM_WAGE_WITH_WEEKLY_ALLOWANCE
        : MINIMUM_WAGE_2026;
      if (data.hourlyWage && data.hourlyWage >= minWage) {
        nextStep();
      }
    } else {
      if (data.monthlyWage && data.monthlyWage > 0) {
        nextStep();
      }
    }
  };

  const isValid =
    data.wageType === 'hourly'
      ? data.hourlyWage &&
        data.hourlyWage >=
          (data.includesWeeklyAllowance
            ? MINIMUM_WAGE_WITH_WEEKLY_ALLOWANCE
            : MINIMUM_WAGE_2026)
      : data.monthlyWage && data.monthlyWage > 0;

  return (
    <>
      <div className="flex-1 px-6 pt-8 overflow-y-auto">
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-8">
          급여 형태를 선택해주세요
        </h1>

        {/* 급여 형태 선택 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {wageOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleWageTypeChange(option.value)}
              className={clsx(
                'border-2 rounded-2xl p-5 flex flex-col items-center gap-3 transition-colors',
                data.wageType === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              )}
            >
              <span
                className={clsx(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  data.wageType === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                {option.icon}
              </span>
              <span
                className={clsx(
                  'text-[15px] font-semibold',
                  data.wageType === option.value ? 'text-blue-600' : 'text-gray-700'
                )}
              >
                {option.label}
              </span>
            </button>
          ))}
        </div>

        {/* 시급 입력 */}
        {data.wageType === 'hourly' && (
          <>
            <p className="text-[14px] text-gray-600 mb-2">
              2026년 최저시급은 <span className="font-bold text-gray-900">{formatCurrency(MINIMUM_WAGE_2026)}</span>이에요
            </p>
            <div className="bg-gray-50 rounded-2xl px-5 py-4 flex items-center mb-4">
              <input
                type="text"
                inputMode="numeric"
                value={hourlyDisplayValue}
                onChange={handleHourlyChange}
                placeholder="10360"
                autoFocus
                className="flex-1 bg-transparent text-[24px] font-bold text-gray-900 focus:outline-none"
              />
              <span className="text-[16px] font-medium text-gray-500">원</span>
            </div>

            {error && (
              <p className="text-[13px] text-red-500 mb-4 flex items-center gap-1">
                <span>⚠️</span>
                {error}
              </p>
            )}

            {/* 주휴수당 체크박스 카드 */}
            <button
              onClick={() => handleWeeklyAllowanceChange(!data.includesWeeklyAllowance)}
              className={clsx(
                'w-full border-2 rounded-2xl p-5 text-left transition-colors',
                data.includesWeeklyAllowance
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={clsx(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                    data.includesWeeklyAllowance
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  )}
                >
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
                <div className="flex-1">
                  <p
                    className={clsx(
                      'text-[15px] font-semibold mb-1',
                      data.includesWeeklyAllowance ? 'text-blue-700' : 'text-gray-900'
                    )}
                  >
                    위 시급에 주휴수당이 포함되어 있다면 체크해주세요
                  </p>
                  <p
                    className={clsx(
                      'text-[13px] leading-relaxed',
                      data.includesWeeklyAllowance ? 'text-blue-600' : 'text-gray-500'
                    )}
                  >
                    주휴수당이란? 일주일에 15시간 이상 근무하는 직원에게 지급하는 유급휴일 수당이에요
                  </p>

                  {data.includesWeeklyAllowance && (
                    <p className="text-[13px] text-blue-600 mt-3 flex items-center gap-1">
                      <span>✓</span>
                      이 경우 최저시급은{' '}
                      <span className="font-bold">{formatCurrency(MINIMUM_WAGE_WITH_WEEKLY_ALLOWANCE)}</span>{' '}
                      이상이어야 해요
                    </p>
                  )}
                </div>
              </div>
            </button>
          </>
        )}

        {/* 월급 입력 */}
        {data.wageType === 'monthly' && (
          <>
            <p className="text-[14px] text-gray-600 mb-2">월 급여를 입력해주세요</p>
            <div className="bg-gray-50 rounded-2xl px-5 py-4 flex items-center">
              <input
                type="text"
                inputMode="numeric"
                value={monthlyDisplayValue}
                onChange={handleMonthlyChange}
                placeholder="0"
                autoFocus
                className="flex-1 bg-transparent text-[24px] font-bold text-gray-900 focus:outline-none"
              />
              <span className="text-[16px] font-medium text-gray-500">원</span>
            </div>
          </>
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
