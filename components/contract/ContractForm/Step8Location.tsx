'use client';

import { useState, useEffect } from 'react';
import { useContractFormStore } from '@/stores/contractFormStore';
import clsx from 'clsx';

// Daum Postcode API 타입 선언
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
        onclose?: () => void;
        width?: string | number;
        height?: string | number;
      }) => {
        embed: (element: HTMLElement) => void;
        open: () => void;
      };
    };
  }
}

interface DaumPostcodeData {
  zonecode: string; // 우편번호
  address: string; // 기본 주소
  addressEnglish: string; // 영문 주소
  addressType: string; // R(도로명), J(지번)
  roadAddress: string; // 도로명 주소
  jibunAddress: string; // 지번 주소
  buildingName: string; // 건물명
  apartment: string; // 아파트 여부 (Y/N)
  bname: string; // 법정동/법정리 이름
  bname1: string; // 법정동/법정리 이름
  bname2: string; // 법정동/법정리 이름
  sido: string; // 시도
  sigungu: string; // 시군구
  sigunguCode: string; // 시군구 코드
  query: string; // 검색어
}

export default function Step8Location() {
  const { data, updateData, nextStep, prevStep } = useContractFormStore();
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [detailAddress, setDetailAddress] = useState('');
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Daum Postcode 스크립트 로드
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.daum) {
      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.async = true;
      script.onload = () => setIsScriptLoaded(true);
      document.head.appendChild(script);
    } else if (window.daum) {
      setIsScriptLoaded(true);
    }
  }, []);

  const handleOpenPostcode = () => {
    if (!isScriptLoaded || !window.daum) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setIsPostcodeOpen(true);
  };

  const handleCompletePostcode = (data: DaumPostcodeData) => {
    // 도로명 주소 우선, 없으면 지번 주소 사용
    const fullAddress = data.roadAddress || data.jibunAddress;
    const buildingName = data.buildingName ? ` (${data.buildingName})` : '';
    
    updateData({ workLocation: fullAddress + buildingName });
    setIsPostcodeOpen(false);
    setDetailAddress('');
  };

  const handleDetailAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const detail = e.target.value;
    setDetailAddress(detail);
    
    // 기존 주소에서 상세주소 부분만 업데이트
    const baseAddress = data.workLocation.split(',')[0] || data.workLocation;
    if (detail.trim()) {
      updateData({ workLocation: `${baseAddress}, ${detail}` });
    } else {
      updateData({ workLocation: baseAddress });
    }
  };

  const handleNext = () => {
    if (data.workLocation.trim()) {
      nextStep();
    }
  };

  const isValid = data.workLocation.trim().length > 0;

  // 주소가 이미 있는지 확인 (기본 주소 부분)
  const hasBaseAddress = data.workLocation.trim().length > 0 && !isPostcodeOpen;

  return (
    <>
      <div className="flex-1 px-6 pt-8 overflow-y-auto">
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-2">
          어디서 일하나요?
        </h1>
        <p className="text-[15px] text-gray-500 mb-6">
          근무지 주소를 검색해주세요
        </p>

        {/* 주소 검색 버튼 / 선택된 주소 표시 */}
        {!isPostcodeOpen && (
          <>
            <button
              onClick={handleOpenPostcode}
              className="w-full bg-gray-100 rounded-2xl px-5 py-4 text-left flex items-center justify-between mb-3"
            >
              <span className={clsx(
                'text-[17px]',
                data.workLocation ? 'text-gray-900' : 'text-gray-400'
              )}>
                {data.workLocation || '주소 검색'}
              </span>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* 상세 주소 입력 */}
            {hasBaseAddress && (
              <input
                type="text"
                value={detailAddress}
                onChange={handleDetailAddressChange}
                placeholder="상세주소 입력 (예: 2층 201호)"
                className="w-full bg-gray-100 rounded-2xl px-5 py-4 text-[17px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </>
        )}

        {/* Daum 우편번호 검색창 */}
        {isPostcodeOpen && isScriptLoaded && (
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[15px] font-medium text-gray-700">주소 검색</span>
              <button
                onClick={() => setIsPostcodeOpen(false)}
                className="text-[14px] text-gray-500"
              >
                닫기
              </button>
            </div>
            <div 
              id="daum-postcode-container"
              className="border border-gray-200 rounded-2xl overflow-hidden"
              style={{ height: '400px' }}
              ref={(el) => {
                if (el && window.daum && !el.hasChildNodes()) {
                  new window.daum.Postcode({
                    oncomplete: handleCompletePostcode,
                    width: '100%',
                    height: '100%',
                  }).embed(el);
                }
              }}
            />
          </div>
        )}

        {!isPostcodeOpen && (
          <p className="text-[13px] text-gray-400 mt-3">
            💡 가게명이나 건물명으로도 검색할 수 있어요
          </p>
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
