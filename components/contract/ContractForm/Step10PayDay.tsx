'use client';

import { useRouter } from 'next/navigation';
import { useContractFormStore, type PaymentTiming } from '@/stores/contractFormStore';
import clsx from 'clsx';

// 1~28일 그리드 (4주 기준)
const PAY_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export default function Step10PayDay() {
  const router = useRouter();
  const { data, updateData } = useContractFormStore();

  const handleTimingChange = (timing: PaymentTiming) => {
    updateData({ paymentTiming: timing });
  };

  const handleLastDayToggle = () => {
    const newValue = !data.isLastDayPayment;
    updateData({ 
      isLastDayPayment: newValue,
      // 말일 지급 시 payDay를 0으로 설정 (말일 표시용)
      payDay: newValue ? 0 : 10
    });
  };

  const handleDaySelect = (day: number) => {
    if (!data.isLastDayPayment) {
      updateData({ payDay: day });
    }
  };

  const handlePreview = () => {
    router.push('/employer/preview/new');
  };

  // 말일 지급이면 무조건 유효, 아니면 1~28 사이 선택 필요
  const isValid = data.isLastDayPayment || (data.payDay >= 1 && data.payDay <= 28);

  return (
    <>
      <div className="flex-1 px-6 pt-8 overflow-y-auto">
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-6">
          임금은 언제 지급하나요?
        </h1>

        {/* 당월/익월 지급 토글 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleTimingChange('current_month')}
            className={clsx(
              'py-4 rounded-2xl font-semibold text-[15px] transition-colors',
              data.paymentTiming === 'current_month'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700'
            )}
          >
            당월 지급
          </button>
          <button
            onClick={() => handleTimingChange('next_month')}
            className={clsx(
              'py-4 rounded-2xl font-semibold text-[15px] transition-colors',
              data.paymentTiming === 'next_month'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700'
            )}
          >
            익월 지급
          </button>
        </div>

        {/* 말일 지급 체크박스 */}
        <button
          onClick={handleLastDayToggle}
          className="flex items-center gap-3 mb-6"
        >
          <span
            className={clsx(
              'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
              data.isLastDayPayment
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
            )}
          >
            {data.isLastDayPayment && (
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
          <span className="text-[15px] text-gray-700">말일 지급</span>
        </button>

        {/* 날짜 그리드 (1~28일) */}
        <div
          className={clsx(
            'grid grid-cols-7 gap-2',
            data.isLastDayPayment && 'opacity-40 pointer-events-none'
          )}
        >
          {PAY_DAYS.map((day) => (
            <button
              key={day}
              onClick={() => handleDaySelect(day)}
              disabled={data.isLastDayPayment}
              className={clsx(
                'aspect-square rounded-xl font-semibold text-[15px] transition-colors flex items-center justify-center',
                data.payDay === day && !data.isLastDayPayment
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              )}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-4 safe-bottom">
        <button
          onClick={handlePreview}
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
