'use client';

import { useContractFormStore, ContractType } from '@/stores/contractFormStore';
import clsx from 'clsx';

const options: {
  value: ContractType;
  label: string;
  description: string;
  details: string;
  icon: React.ReactNode;
  badge?: string;
}[] = [
  {
    value: 'regular',
    label: '정규직 (4대보험)',
    description: '국민연금, 건강보험, 고용보험, 산재보험',
    details: '사업장과 근로자가 보험료를 분담합니다',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    value: 'contract',
    label: '계약직 (3.3%)',
    description: '사업소득 원천징수 후 지급',
    details: '근로자가 5월에 종합소득세 신고를 합니다',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    badge: '단기 알바',
  },
];

export default function Step2ContractType() {
  const { data, updateData, nextStep } = useContractFormStore();

  const handleSelect = (value: ContractType) => {
    updateData({ contractType: value });
  };

  const handleNext = () => {
    if (data.contractType) {
      nextStep();
    }
  };

  return (
    <>
      <div className="flex-1 px-6 pt-8">
        {/* 질문 */}
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-2">
          계약 형태를 선택해주세요
        </h1>
        <p className="text-[15px] text-gray-500 mb-8">
          세금 처리 방식이 달라요
        </p>

        {/* 옵션 카드 */}
        <div className="space-y-3">
          {options.map((option) => {
            const isSelected = data.contractType === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={clsx(
                  'w-full border-2 rounded-2xl p-5 text-left transition-all',
                  isSelected
                    ? 'border-blue-500 bg-white'
                    : 'border-gray-200 bg-white'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* 아이콘 */}
                  <div
                    className={clsx(
                      'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors flex-shrink-0',
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {option.icon}
                  </div>
                  
                  {/* 텍스트 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={clsx(
                          'text-[18px] font-bold',
                          isSelected ? 'text-blue-500' : 'text-gray-900'
                        )}
                      >
                        {option.label}
                      </span>
                      {option.badge && (
                        <span className="px-2 py-0.5 text-[11px] font-medium bg-orange-100 text-orange-600 rounded-full">
                          {option.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] text-gray-600 mb-1">
                      {option.description}
                    </p>
                    <p className="text-[13px] text-gray-400">
                      {option.details}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 안내 박스 */}
        <div className="mt-6 p-4 rounded-2xl border bg-blue-50 border-blue-200">
          <div className="flex items-start gap-2">
            <span className="text-lg text-blue-600">💡</span>
            <div>
              <p className="text-[15px] font-medium text-blue-700">
                어떤 것을 선택해야 할지 모르겠다면?
              </p>
              <p className="text-[14px] mt-1 text-blue-600">
                일주일에 15시간 미만 근무하면 <span className="font-semibold">계약직</span>,{' '}
                15시간 이상이면 <span className="font-semibold">정규직</span>을 추천해요
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 다음 버튼 */}
      <div className="px-6 pb-4 safe-bottom">
        <button
          onClick={handleNext}
          disabled={!data.contractType}
          className={clsx(
            'w-full py-4 rounded-2xl font-semibold text-lg transition-colors',
            data.contractType
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
