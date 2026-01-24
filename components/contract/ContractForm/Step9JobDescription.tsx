'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useContractFormStore, type BusinessType } from '@/stores/contractFormStore';
import BottomSheet from '@/components/ui/BottomSheet';
import clsx from 'clsx';

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
      '식재료 손질 및 준비',
      '배달 음식 포장',
      '매장 청소 및 정리',
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
      '원두 관리 및 머신 청소',
      '매장 청소 및 정리',
      '재고 관리 및 발주',
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
      '유통기한 관리',
      '매장 청소 및 정리',
      '배달 업무',
      '택배 접수 및 관리',
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
      '재고 관리 및 검수',
      '매장 청소 및 정리',
      '온라인 주문 처리',
    ],
  },
  {
    value: 'beauty',
    label: '미용실/네일샵',
    icon: '💇',
    keywords: [
      '고객 응대 및 예약 관리',
      '헤어 스타일링 보조',
      '네일 아트 보조',
      '샴푸 및 두피 관리',
      '매장 청소 및 정리',
      '재료 준비 및 정리',
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
      '회의 준비 및 지원',
      '사무용품 관리',
      '일정 관리 및 스케줄링',
    ],
  },
];

export default function Step9JobDescription() {
  const router = useRouter();
  const { data, updateData } = useContractFormStore();
  const [isBusinessTypeSheetOpen, setIsBusinessTypeSheetOpen] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [additionalDescription, setAdditionalDescription] = useState('');

  // 현재 선택된 업종 찾기
  const currentBusinessType = BUSINESS_TYPES.find((b) => b.value === data.businessType);

  const handleBusinessTypeSelect = (type: BusinessType) => {
    updateData({ businessType: type });
    setSelectedKeywords([]); // 업종 변경 시 키워드 초기화
    updateData({ jobDescription: '' }); // 업무 내용도 초기화
    setIsBusinessTypeSheetOpen(false);
  };

  const handleKeywordToggle = (keyword: string) => {
    const newKeywords = selectedKeywords.includes(keyword)
      ? selectedKeywords.filter((k) => k !== keyword)
      : [...selectedKeywords, keyword];
    
    setSelectedKeywords(newKeywords);
    
    // 업무 내용 업데이트
    const combined = additionalDescription
      ? [...newKeywords, additionalDescription].join(', ')
      : newKeywords.join(', ');
    updateData({ jobDescription: combined });
  };

  const handleAdditionalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setAdditionalDescription(value);
    
    // 업무 내용 업데이트
    const combined = value
      ? [...selectedKeywords, value].join(', ')
      : selectedKeywords.join(', ');
    updateData({ jobDescription: combined });
  };

  const handlePreview = () => {
    router.push('/employer/preview/new');
  };

  // 업종이 선택되어 있어야만 진행 가능 (키워드는 선택사항)
  const isValid = data.businessType !== null;

  return (
    <>
      <div className="flex-1 px-6 pt-8 overflow-y-auto">
        {/* 업종 선택 영역 */}
        {data.businessType ? (
          <button
            onClick={() => setIsBusinessTypeSheetOpen(true)}
            className="w-full bg-gray-50 rounded-2xl px-5 py-4 flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentBusinessType?.icon}</span>
              <span className="text-[17px] font-semibold text-gray-900">
                {currentBusinessType?.label}
              </span>
            </div>
            <span className="text-[14px] text-blue-500 font-medium">업종 변경</span>
          </button>
        ) : (
          <button
            onClick={() => setIsBusinessTypeSheetOpen(true)}
            className="w-full bg-blue-50 border-2 border-blue-200 border-dashed rounded-2xl px-5 py-6 flex items-center justify-center gap-2 mb-6"
          >
            <span className="text-[15px] text-blue-500 font-semibold">
              업종을 선택해주세요
            </span>
          </button>
        )}

        {/* 업종이 선택된 경우에만 키워드 표시 */}
        {data.businessType && (
          <>
            <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-2">
              주요 업무 내용을 알려주세요
            </h1>
            <p className="text-[15px] text-gray-500 mb-6">선택사항이에요</p>

            {/* 키워드 태그 */}
            <div className="flex flex-wrap gap-2 mb-6">
              {currentBusinessType?.keywords.map((keyword) => (
                <button
                  key={keyword}
                  onClick={() => handleKeywordToggle(keyword)}
                  className={clsx(
                    'px-4 py-2.5 rounded-full text-[14px] transition-colors',
                    selectedKeywords.includes(keyword)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  )}
                >
                  {keyword}
                </button>
              ))}
            </div>

            {/* 추가 입력 */}
            <textarea
              value={additionalDescription}
              onChange={handleAdditionalChange}
              placeholder="추가로 입력하고 싶은 업무 내용을 적어주세요"
              rows={3}
              className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-[15px] text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </>
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

      {/* 업종 선택 바텀시트 */}
      <BottomSheet
        isOpen={isBusinessTypeSheetOpen}
        onClose={() => setIsBusinessTypeSheetOpen(false)}
        title="업종을 선택해주세요"
      >
        <div className="space-y-3">
          {BUSINESS_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => handleBusinessTypeSelect(type.value)}
              className={clsx(
                'w-full border-2 rounded-2xl px-5 py-4 flex items-center gap-4 transition-colors',
                data.businessType === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              )}
            >
              <span className="text-2xl">{type.icon}</span>
              <span className="text-[17px] font-semibold text-gray-900">
                {type.label}
              </span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
