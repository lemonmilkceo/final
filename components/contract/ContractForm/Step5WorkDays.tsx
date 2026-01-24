'use client';

import { useState } from 'react';
import { useContractFormStore } from '@/stores/contractFormStore';
import clsx from 'clsx';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const WORK_DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

type WorkDayMode = 'weekly' | 'specific';

export default function Step5WorkDays() {
  const { data, updateData, nextStep, prevStep } = useContractFormStore();
  
  // 모드 결정: workDaysPerWeek가 있으면 weekly, workDays가 있으면 specific
  const initialMode: WorkDayMode = data.useWorkDaysPerWeek ? 'weekly' : 'specific';
  const [mode, setMode] = useState<WorkDayMode>(initialMode);

  const handleModeChange = (newMode: WorkDayMode) => {
    setMode(newMode);
    if (newMode === 'weekly') {
      updateData({ 
        workDays: [], 
        useWorkDaysPerWeek: true,
        workDaysPerWeek: data.workDaysPerWeek || null 
      });
    } else {
      updateData({ 
        workDaysPerWeek: null, 
        useWorkDaysPerWeek: false,
        workDays: data.workDays || []
      });
    }
  };

  const handleWorkDaysPerWeekSelect = (days: number) => {
    updateData({ 
      workDaysPerWeek: days, 
      useWorkDaysPerWeek: true,
      workDays: [] 
    });
  };

  const toggleDay = (day: string) => {
    const newDays = data.workDays.includes(day)
      ? data.workDays.filter((d) => d !== day)
      : [...data.workDays, day];
    updateData({ 
      workDays: newDays, 
      useWorkDaysPerWeek: false,
      workDaysPerWeek: null 
    });
  };

  const handleNext = () => {
    if (isValid) {
      nextStep();
    }
  };

  const isValid =
    (mode === 'weekly' && data.workDaysPerWeek && data.workDaysPerWeek > 0) ||
    (mode === 'specific' && data.workDays.length > 0);

  // 선택된 요일을 순서대로 정렬
  const sortedSelectedDays = DAYS.filter((day) => data.workDays.includes(day));

  return (
    <>
      <div className="flex-1 px-6 pt-8 overflow-y-auto">
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-6">
          근무일을 어떻게 정할까요?
        </h1>

        {/* 모드 선택 토글 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleModeChange('weekly')}
            className={clsx(
              'py-4 rounded-2xl font-semibold text-[15px] transition-colors',
              mode === 'weekly'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700'
            )}
          >
            주 N일
          </button>
          <button
            onClick={() => handleModeChange('specific')}
            className={clsx(
              'py-4 rounded-2xl font-semibold text-[15px] transition-colors',
              mode === 'specific'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700'
            )}
          >
            특정 요일
          </button>
        </div>

        {/* 주 N일 모드 */}
        {mode === 'weekly' && (
          <>
            <p className="text-[14px] text-gray-600 mb-4">주 몇 일 근무하나요?</p>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {WORK_DAYS_OPTIONS.slice(0, 4).map((days) => (
                <button
                  key={days}
                  onClick={() => handleWorkDaysPerWeekSelect(days)}
                  className={clsx(
                    'py-4 rounded-2xl font-semibold text-[15px] transition-colors',
                    data.workDaysPerWeek === days
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  )}
                >
                  주 {days}일
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {WORK_DAYS_OPTIONS.slice(4).map((days) => (
                <button
                  key={days}
                  onClick={() => handleWorkDaysPerWeekSelect(days)}
                  className={clsx(
                    'py-4 rounded-2xl font-semibold text-[15px] transition-colors',
                    data.workDaysPerWeek === days
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  )}
                >
                  주 {days}일
                </button>
              ))}
            </div>
          </>
        )}

        {/* 특정 요일 모드 */}
        {mode === 'specific' && (
          <>
            <p className="text-[14px] text-gray-600 mb-4">근무할 요일을 선택하세요</p>
            <div className="flex justify-between gap-1 mb-4">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={clsx(
                    'flex-1 aspect-square rounded-2xl font-semibold text-[15px] transition-colors flex items-center justify-center',
                    data.workDays.includes(day)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  )}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* 선택된 요일 표시 */}
            {sortedSelectedDays.length > 0 && (
              <p className="text-[14px] text-gray-600 text-center">
                선택: {sortedSelectedDays.join(', ')}
              </p>
            )}
          </>
        )}
      </div>

      <div className="px-6 pb-4 safe-bottom">
        <button
          onClick={handleNext}
          disabled={!isValid}
          className={clsx(
            'w-full py-4 rounded-2xl font-semibold text-lg transition-colors',
            isValid
              ? 'bg-blue-500 text-white active:bg-blue-600'
              : 'bg-blue-300 text-white cursor-not-allowed'
          )}
        >
          다음
        </button>
      </div>
    </>
  );
}
