'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useContractFormStore, type PaymentTiming, type BusinessType } from '@/stores/contractFormStore';
import BottomSheet from '@/components/ui/BottomSheet';
import clsx from 'clsx';
import { formatCurrency } from '@/lib/utils/format';

// 1~28일 그리드
const PAY_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

// 업종별 데이터
const BUSINESS_TYPES: {
  value: BusinessType;
  label: string;
  icon: string;
  keywords: string[];
}[] = [
  {
    value: 'restaurant',
    label: '식당',
    icon: '🍽️',
    keywords: [
      '홀과 주방 등 가게 운영의 전반적인 관리',
      '홀 서빙 및 고객 응대',
      '주방 조리 및 음식 준비',
      '설거지 및 주방 정리',
      '테이블 세팅 및 정리',
    ],
  },
  {
    value: 'cafe',
    label: '카페',
    icon: '☕',
    keywords: [
      '음료 제조 (바리스타)',
      '디저트 제조 및 플레이팅',
      '홀 서빙 및 테이블 정리',
      '계산 및 주문 접수',
      '매장 청소 및 정리',
    ],
  },
  {
    value: 'convenience_store',
    label: '편의점',
    icon: '🏪',
    keywords: [
      '계산 및 주문 접수',
      '상품 진열 및 정리',
      '재고 관리 및 검수',
      '매장 청소 및 정리',
    ],
  },
  {
    value: 'retail',
    label: '소매점',
    icon: '🛍️',
    keywords: [
      '고객 응대 및 상담',
      '상품 진열 및 정리',
      '계산 및 포장',
      '매장 청소 및 정리',
    ],
  },
  {
    value: 'beauty',
    label: '미용실/네일샵',
    icon: '💇',
    keywords: [
      '고객 응대 및 예약 관리',
      '헤어 스타일링 보조',
      '샴푸 및 두피 관리',
      '매장 청소 및 정리',
    ],
  },
  {
    value: 'office',
    label: '사무직',
    icon: '💼',
    keywords: [
      '문서 작성 및 관리',
      '전화 응대 및 고객 상담',
      '데이터 입력 및 정리',
      '사무용품 관리',
    ],
  },
];

// 추가수당 계산 함수
function calculateExtraPayments(hourlyWage: number | null, monthlyWage: number | null, wageType: 'hourly' | 'monthly') {
  let baseHourlyWage = 0;
  
  if (wageType === 'hourly' && hourlyWage) {
    baseHourlyWage = hourlyWage;
  } else if (wageType === 'monthly' && monthlyWage) {
    baseHourlyWage = Math.round(monthlyWage / 209);
  }
  
  if (baseHourlyWage === 0) return null;
  
  return {
    baseHourlyWage,
    overtimePay: Math.round(baseHourlyWage * 1.5),
    holidayPay: Math.round(baseHourlyWage * 1.5 * 8),
    annualLeavePay: Math.round(baseHourlyWage * 8),
  };
}

export default function Step10PayDay() {
  const router = useRouter();
  const { data, updateData } = useContractFormStore();
  
  // 바텀시트 상태
  const [isBusinessTypeSheetOpen, setIsBusinessTypeSheetOpen] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [additionalDescription, setAdditionalDescription] = useState('');
  
  // 5인 이상 사업장일 때만 추가수당 계산
  const extraPayments = useMemo(() => {
    if (data.businessSize !== 'over_5') return null;
    return calculateExtraPayments(data.hourlyWage, data.monthlyWage, data.wageType);
  }, [data.businessSize, data.hourlyWage, data.monthlyWage, data.wageType]);

  // 현재 선택된 업종
  const currentBusinessType = BUSINESS_TYPES.find((b) => b.value === data.businessType);

  // 업종 미선택 시 자동으로 바텀시트 열기
  useEffect(() => {
    if (!data.businessType) {
      setIsBusinessTypeSheetOpen(true);
    }
  }, []);

  const handleTimingChange = (timing: PaymentTiming) => {
    updateData({ paymentTiming: timing });
  };

  const handleLastDayToggle = () => {
    const newValue = !data.isLastDayPayment;
    updateData({ 
      isLastDayPayment: newValue,
      payDay: newValue ? 0 : 10
    });
  };

  const handleDaySelect = (day: number) => {
    if (!data.isLastDayPayment) {
      updateData({ payDay: day });
    }
  };

  const handleBusinessTypeSelect = (type: BusinessType) => {
    updateData({ businessType: type });
    setSelectedKeywords([]);
    updateData({ jobDescription: '' });
    setIsBusinessTypeSheetOpen(false);
  };

  const handleKeywordToggle = (keyword: string) => {
    const newKeywords = selectedKeywords.includes(keyword)
      ? selectedKeywords.filter((k) => k !== keyword)
      : [...selectedKeywords, keyword];
    
    setSelectedKeywords(newKeywords);
    
    const combined = additionalDescription
      ? [...newKeywords, additionalDescription].join(', ')
      : newKeywords.join(', ');
    updateData({ jobDescription: combined });
  };

  const handleAdditionalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setAdditionalDescription(value);
    
    const combined = value
      ? [...selectedKeywords, value].join(', ')
      : selectedKeywords.join(', ');
    updateData({ jobDescription: combined });
  };

  const handlePreview = () => {
    router.push('/employer/preview/new');
  };

  // 급여일 + 업종 선택 필수
  const isPayDayValid = data.isLastDayPayment || (data.payDay >= 1 && data.payDay <= 28);
  const isValid = isPayDayValid && data.businessType !== null;

  return (
    <>
      <div className="flex-1 px-6 pt-8 overflow-y-auto pb-6">
        {/* 급여일 섹션 */}
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-4">
          임금은 언제 지급하나요?
        </h1>

        {/* 당월/익월 지급 토글 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => handleTimingChange('current_month')}
            className={clsx(
              'py-3 rounded-2xl font-semibold text-[15px] transition-colors',
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
              'py-3 rounded-2xl font-semibold text-[15px] transition-colors',
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
          className="flex items-center gap-3 mb-4"
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
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
          <span className="text-[15px] text-gray-700">말일 지급</span>
        </button>

        {/* 날짜 그리드 */}
        <div
          className={clsx(
            'grid grid-cols-7 gap-2 mb-8',
            data.isLastDayPayment && 'opacity-40 pointer-events-none'
          )}
        >
          {PAY_DAYS.map((day) => (
            <button
              key={day}
              onClick={() => handleDaySelect(day)}
              disabled={data.isLastDayPayment}
              className={clsx(
                'aspect-square rounded-xl font-semibold text-[14px] transition-colors flex items-center justify-center',
                data.payDay === day && !data.isLastDayPayment
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              )}
            >
              {day}
            </button>
          ))}
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-100 mb-6" />

        {/* 업종 선택 영역 */}
        {data.businessType ? (
          <button
            onClick={() => setIsBusinessTypeSheetOpen(true)}
            className="w-full bg-gray-50 rounded-2xl px-5 py-4 flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentBusinessType?.icon}</span>
              <span className="text-[17px] font-semibold text-gray-900">
                {currentBusinessType?.label}
              </span>
            </div>
            <span className="text-[14px] text-blue-500 font-medium">변경</span>
          </button>
        ) : (
          <button
            onClick={() => setIsBusinessTypeSheetOpen(true)}
            className="w-full bg-blue-50 border-2 border-blue-200 border-dashed rounded-2xl px-5 py-5 flex items-center justify-center gap-2 mb-4"
          >
            <span className="text-[15px] text-blue-500 font-semibold">
              업종을 선택해주세요
            </span>
          </button>
        )}

        {/* 업종 선택 후 키워드 */}
        {data.businessType && (
          <>
            <p className="text-[14px] text-gray-500 mb-3">주요 업무 (선택)</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {currentBusinessType?.keywords.map((keyword) => (
                <button
                  key={keyword}
                  onClick={() => handleKeywordToggle(keyword)}
                  className={clsx(
                    'px-3 py-2 rounded-full text-[13px] transition-colors',
                    selectedKeywords.includes(keyword)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  )}
                >
                  {keyword}
                </button>
              ))}
            </div>

            <textarea
              value={additionalDescription}
              onChange={handleAdditionalChange}
              placeholder="추가 업무 내용 (선택)"
              rows={2}
              className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-[14px] text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </>
        )}

        {/* 5인 이상 사업장: 추가수당 안내 */}
        {extraPayments && data.businessType && (
          <div className="mt-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💰</span>
              <span className="text-[14px] font-semibold text-blue-600">
                추가 근무 시 수당 안내
              </span>
            </div>
            <div className="space-y-2">
              <div className="bg-white rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-[13px] text-gray-700">야근 1시간</span>
                <span className="text-[14px] font-bold text-blue-600">+{formatCurrency(extraPayments.overtimePay)}</span>
              </div>
              <div className="bg-white rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-[13px] text-gray-700">휴일 하루</span>
                <span className="text-[14px] font-bold text-blue-600">+{formatCurrency(extraPayments.holidayPay)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pb-4 safe-bottom">
        <button
          onClick={handlePreview}
          disabled={!isValid}
          className={clsx(
            'w-full py-4 rounded-2xl font-semibold text-lg transition-colors flex items-center justify-center gap-2',
            isValid
              ? 'bg-blue-500 text-white active:bg-blue-600'
              : 'bg-blue-300 text-white cursor-not-allowed'
          )}
        >
          계약서 미리보기
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 업종 선택 바텀시트 */}
      <BottomSheet
        isOpen={isBusinessTypeSheetOpen}
        onClose={() => setIsBusinessTypeSheetOpen(false)}
        title="업종 선택"
      >
        <div className="grid grid-cols-2 gap-3">
          {BUSINESS_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => handleBusinessTypeSelect(type.value)}
              className={clsx(
                'border-2 rounded-2xl px-4 py-4 flex flex-col items-center gap-2 transition-colors',
                data.businessType === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              )}
            >
              <span className="text-3xl">{type.icon}</span>
              <span className="text-[15px] font-semibold text-gray-900">
                {type.label}
              </span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
