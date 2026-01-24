'use client';

import { useRouter } from 'next/navigation';
import { useContractFormStore } from '@/stores/contractFormStore';
import clsx from 'clsx';

const getNextPayDay = (payDay: number): string => {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let nextMonth: number;
  let nextYear: number;

  if (currentDay >= payDay) {
    // 이번 달 급여일이 지났으면 다음 달
    nextMonth = currentMonth + 1;
    nextYear = currentYear;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }
  } else {
    nextMonth = currentMonth;
    nextYear = currentYear;
  }

  const months = [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ];

  return `${months[nextMonth]} ${payDay}일`;
};

export default function Step10PayDay() {
  const router = useRouter();
  const { data, updateData, prevStep } = useContractFormStore();

  const handlePreview = () => {
    // TODO: 계약서 저장 후 미리보기 페이지로 이동
    router.push('/employer/preview/new');
  };

  const isValid = data.payDay >= 1 && data.payDay <= 31;

  return (
    <>
      <div className="flex-1 px-6 pt-8">
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-8">
          월급은 언제 줄 건가요?
        </h1>

        {/* Pay Day Picker */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-[20px] text-gray-500">매월</span>
          <input
            type="number"
            value={data.payDay}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              updateData({
                payDay: isNaN(value) ? 1 : Math.min(Math.max(value, 1), 31),
              });
            }}
            min="1"
            max="31"
            className="w-20 text-center bg-gray-100 rounded-xl py-3 text-[32px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-[20px] text-gray-500">일</span>
        </div>

        {/* Auto Calculation */}
        <p className="text-[15px] text-gray-500 text-center">
          다음 월급일:{' '}
          <span className="font-semibold text-blue-500">
            {getNextPayDay(data.payDay)}
          </span>
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
          onClick={handlePreview}
          disabled={!isValid}
          className={clsx(
            'flex-1 py-4 rounded-2xl font-semibold text-lg transition-colors flex items-center justify-center gap-2',
            isValid
              ? 'bg-blue-500 text-white active:bg-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          계약서 미리보기
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </>
  );
}
