'use client';

import { useState, useEffect } from 'react';
import { useContractFormStore } from '@/stores/contractFormStore';
import { createClient } from '@/lib/supabase/client';
import BottomSheet from '@/components/ui/BottomSheet';
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
  zonecode: string;
  address: string;
  addressEnglish: string;
  addressType: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName: string;
  apartment: string;
  bname: string;
  bname1: string;
  bname2: string;
  sido: string;
  sigungu: string;
  sigunguCode: string;
  query: string;
}

interface Workplace {
  id: string;
  name: string;
  address: string;
}

export default function Step1Workplace() {
  const { data, updateData, nextStep } = useContractFormStore();
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  
  // 새 사업장 등록 폼
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  // 사업장 목록 로드
  useEffect(() => {
    async function loadWorkplaces() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: workplacesData } = await supabase
          .from('workplaces')
          .select('id, name, address')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        setWorkplaces(workplacesData || []);
      }
      setIsLoading(false);
    }
    
    loadWorkplaces();
  }, []);

  const handleSelectWorkplace = (workplace: Workplace) => {
    updateData({
      workplaceId: workplace.id,
      workplaceName: workplace.name,
      workLocation: workplace.address,
    });
  };

  const handleOpenPostcode = () => {
    if (!isScriptLoaded || !window.daum) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setIsPostcodeOpen(true);
  };

  const handleCompletePostcode = (postcodeData: DaumPostcodeData) => {
    const fullAddress = postcodeData.roadAddress || postcodeData.jibunAddress;
    const buildingName = postcodeData.buildingName ? ` (${postcodeData.buildingName})` : '';
    setNewAddress(fullAddress + buildingName);
    setIsPostcodeOpen(false);
  };

  const handleSaveWorkplace = async () => {
    if (!newName.trim() || !newAddress.trim()) return;
    
    setIsSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setIsSaving(false);
      return;
    }

    const fullAddress = detailAddress.trim() 
      ? `${newAddress}, ${detailAddress}` 
      : newAddress;

    const { data: newWorkplace, error } = await supabase
      .from('workplaces')
      .insert({
        user_id: user.id,
        name: newName.trim(),
        address: fullAddress,
      })
      .select('id, name, address')
      .single();

    if (!error && newWorkplace) {
      setWorkplaces([newWorkplace, ...workplaces]);
      updateData({
        workplaceId: newWorkplace.id,
        workplaceName: newWorkplace.name,
        workLocation: newWorkplace.address,
      });
      setIsAddSheetOpen(false);
      setNewName('');
      setNewAddress('');
      setDetailAddress('');
    }
    
    setIsSaving(false);
  };

  const handleNext = () => {
    if (data.workplaceName && data.workLocation) {
      nextStep();
    }
  };

  const isValid = data.workplaceName.trim().length > 0 && data.workLocation.trim().length > 0;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 px-6 pt-8 overflow-y-auto">
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-2">
          어디서 계약하세요?
        </h1>
        <p className="text-[15px] text-gray-500 mb-6">
          사업장을 선택하거나 새로 등록해주세요
        </p>

        {/* 저장된 사업장 목록 */}
        <div className="space-y-3 mb-4">
          {workplaces.map((workplace) => (
            <button
              key={workplace.id}
              onClick={() => handleSelectWorkplace(workplace)}
              className={clsx(
                'w-full p-4 rounded-2xl text-left transition-all',
                data.workplaceId === workplace.id
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-gray-50 border-2 border-transparent'
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">🏪</span>
                <div className="flex-1 min-w-0">
                  <p className={clsx(
                    'font-semibold text-[16px] mb-1',
                    data.workplaceId === workplace.id ? 'text-blue-700' : 'text-gray-900'
                  )}>
                    {workplace.name}
                  </p>
                  <p className="text-[14px] text-gray-500 truncate">
                    {workplace.address}
                  </p>
                </div>
                {data.workplaceId === workplace.id && (
                  <svg className="w-6 h-6 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* 새 사업장 등록 버튼 */}
        <button
          onClick={() => setIsAddSheetOpen(true)}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 flex items-center justify-center gap-2 hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-medium">새 사업장 등록</span>
        </button>

        {workplaces.length === 0 && (
          <p className="text-center text-[14px] text-gray-400 mt-6">
            등록된 사업장이 없어요.<br />
            위 버튼을 눌러 사업장을 등록해주세요.
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

      {/* 새 사업장 등록 바텀시트 */}
      <BottomSheet
        isOpen={isAddSheetOpen}
        onClose={() => {
          setIsAddSheetOpen(false);
          setNewName('');
          setNewAddress('');
          setDetailAddress('');
          setIsPostcodeOpen(false);
        }}
        title="새 사업장 등록"
      >
        <div className="space-y-5">
          {/* 사업장명 */}
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-2">
              사업장명
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="예: 커피하우스 강남점"
              className="w-full bg-gray-100 rounded-2xl px-5 py-4 text-[17px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 주소 */}
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-2">
              주소
            </label>
            
            {!isPostcodeOpen ? (
              <>
                <button
                  onClick={handleOpenPostcode}
                  className="w-full bg-gray-100 rounded-2xl px-5 py-4 text-left flex items-center justify-between mb-3"
                >
                  <span className={clsx(
                    'text-[17px]',
                    newAddress ? 'text-gray-900' : 'text-gray-400'
                  )}>
                    {newAddress || '주소 검색'}
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

                {newAddress && (
                  <input
                    type="text"
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    placeholder="상세주소 입력 (예: 2층 201호)"
                    className="w-full bg-gray-100 rounded-2xl px-5 py-4 text-[17px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </>
            ) : (
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
                  id="daum-postcode-container-add"
                  className="border border-gray-200 rounded-2xl overflow-hidden"
                  style={{ height: '300px' }}
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
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleSaveWorkplace}
            disabled={!newName.trim() || !newAddress.trim() || isSaving}
            className={clsx(
              'w-full py-4 rounded-2xl font-semibold text-lg transition-colors',
              newName.trim() && newAddress.trim() && !isSaving
                ? 'bg-blue-500 text-white active:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            {isSaving ? '저장 중...' : '저장하고 선택하기'}
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
