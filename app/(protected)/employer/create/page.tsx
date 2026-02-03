'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import BottomSheet from '@/components/ui/BottomSheet';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  useContractFormStore,
  TOTAL_FORM_STEPS,
} from '@/stores/contractFormStore';
import { getContractForEdit } from './actions';
// Step 1: 사업장 선택/등록
import Step1Workplace from '@/components/contract/ContractForm/Step1Workplace';
// Step 2: 계약 형태
import Step2ContractType from '@/components/contract/ContractForm/Step2ContractType';
// Step 3: 사업장 규모
import Step1BusinessSize from '@/components/contract/ContractForm/Step1BusinessSize';
// Step 4: 근로자 이름
import Step2WorkerName from '@/components/contract/ContractForm/Step2WorkerName';
// Step 5: 시급/월급
import Step3Wage from '@/components/contract/ContractForm/Step3Wage';
// Step 6: 근무기간
import Step4WorkPeriod from '@/components/contract/ContractForm/Step4WorkPeriod';
// Step 7: 근무요일
import Step5WorkDays from '@/components/contract/ContractForm/Step5WorkDays';
// Step 8: 근무시간
import Step6WorkTime from '@/components/contract/ContractForm/Step6WorkTime';
// Step 9: 휴게시간
import Step7BreakTime from '@/components/contract/ContractForm/Step7BreakTime';
// Step 10: 업무내용 + 급여일
import Step9JobDescription from '@/components/contract/ContractForm/Step9JobDescription';
import Step10PayDay from '@/components/contract/ContractForm/Step10PayDay';

export default function CreateContractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editContractId = searchParams.get('edit');

  const {
    step,
    prevStep,
    reset,
    loadContractData,
    isEditMode,
    editingContractId,
  } = useContractFormStore();
  const [isExitSheetOpen, setIsExitSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // edit 모드일 때 계약서 데이터 로드
  useEffect(() => {
    const loadEditData = async () => {
      if (!editContractId) return;

      // 이미 같은 계약서를 수정 중이면 스킵
      if (isEditMode && editingContractId === editContractId) return;

      setIsLoading(true);
      setLoadError(null);

      const result = await getContractForEdit(editContractId);

      if (result.success && result.data) {
        const data = result.data;
        loadContractData(editContractId, {
          workplaceId: data.workplaceId,
          workplaceName: data.workplaceName || '',
          workLocation: data.workLocation,
          contractType: data.contractType,
          businessSize: data.businessSize,
          workerName: data.workerName,
          workerPhone: data.workerPhone,
          wageType: data.wageType,
          hourlyWage: data.hourlyWage,
          monthlyWage: data.monthlyWage,
          includesWeeklyAllowance: data.includesWeeklyAllowance,
          startDate: data.startDate,
          endDate: data.endDate,
          hasNoEndDate: !data.endDate,
          workDays: data.workDays || [],
          workDaysPerWeek: data.workDaysPerWeek,
          useWorkDaysPerWeek:
            !!data.workDaysPerWeek &&
            (!data.workDays || data.workDays.length === 0),
          workStartTime: data.workStartTime,
          workEndTime: data.workEndTime,
          breakMinutes: data.breakMinutes,
          businessType: data.businessType as
            | 'restaurant'
            | 'cafe'
            | 'convenience_store'
            | 'retail'
            | 'beauty'
            | 'office'
            | 'pc_cafe'
            | 'startup'
            | null,
          jobDescription: data.jobDescription || '',
          payDay: data.payDay,
          paymentTiming: data.paymentTiming,
          isLastDayPayment: data.isLastDayPayment,
        });
      } else {
        setLoadError(result.error || '계약서를 불러올 수 없어요');
      }

      setIsLoading(false);
    };

    loadEditData();
  }, [editContractId, isEditMode, editingContractId, loadContractData]);

  const handleBack = () => {
    if (step === 1) {
      reset();
      router.back();
    } else {
      prevStep();
    }
  };

  const handleHomeClick = () => {
    setIsExitSheetOpen(true);
  };

  const handleContinue = () => {
    setIsExitSheetOpen(false);
  };

  const handleGoHome = () => {
    // 임시저장은 이미 sessionStorage에 persist 되므로 별도 로직 불필요
    setIsExitSheetOpen(false);
    router.push('/employer');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Workplace />; // 사업장 선택/등록
      case 2:
        return <Step2ContractType />; // 계약 형태
      case 3:
        return <Step1BusinessSize />; // 사업장 규모
      case 4:
        return <Step2WorkerName />; // 근로자 이름
      case 5:
        return <Step3Wage />; // 시급/월급
      case 6:
        return <Step4WorkPeriod />; // 근무기간
      case 7:
        return <Step5WorkDays />; // 근무요일
      case 8:
        return <Step6WorkTime />; // 근무시간
      case 9:
        return <Step7BreakTime />; // 휴게시간
      case 10:
        return <Step10PayDay />; // 급여일 + 업무내용
      default:
        return <Step1Workplace />;
    }
  };

  // 홈 버튼 컴포넌트
  const HomeButton = (
    <button
      onClick={handleHomeClick}
      className="w-10 h-10 flex items-center justify-center -mr-2"
      aria-label="홈으로"
    >
      <svg
        className="w-6 h-6 text-gray-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    </button>
  );

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-500">계약서를 불러오는 중...</p>
      </div>
    );
  }

  // 에러 발생
  if (loadError) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <p className="text-6xl mb-4">😢</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            계약서를 불러올 수 없어요
          </h2>
          <p className="text-gray-500 mb-6">{loadError}</p>
          <button
            onClick={() => router.push('/employer')}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PageHeader
        onBack={handleBack}
        title={isEditMode ? '계약서 수정' : undefined}
        progress={{ current: step, total: TOTAL_FORM_STEPS }}
        rightElement={HomeButton}
      />
      {renderStep()}

      {/* 나가기 확인 바텀시트 */}
      <BottomSheet
        isOpen={isExitSheetOpen}
        onClose={() => setIsExitSheetOpen(false)}
        title="작성을 그만두시겠어요?"
      >
        <div className="space-y-6">
          {/* 안내 메시지 */}
          <div className="bg-blue-50 rounded-2xl p-4">
            <div className="flex gap-3">
              <span className="text-2xl">💾</span>
              <div>
                <p className="text-[15px] font-medium text-blue-800 mb-1">
                  작성 중인 내용이 임시저장돼요
                </p>
                <p className="text-[14px] text-blue-700">
                  나중에 다시 오시면 이어서 작성할 수 있어요
                </p>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleContinue}
              className="flex-1 py-4 rounded-2xl font-semibold text-lg bg-gray-100 text-gray-700"
            >
              계속 작성
            </button>
            <button
              onClick={handleGoHome}
              className="flex-1 py-4 rounded-2xl font-semibold text-lg bg-blue-500 text-white"
            >
              홈으로
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
