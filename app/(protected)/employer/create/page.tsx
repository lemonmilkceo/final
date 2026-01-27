'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import BottomSheet from '@/components/ui/BottomSheet';
import {
  useContractFormStore,
  TOTAL_FORM_STEPS,
} from '@/stores/contractFormStore';
// Step 1: 사업장 선택/등록
import Step1Workplace from '@/components/contract/ContractForm/Step1Workplace';
// Step 2: 사업장 규모
import Step1BusinessSize from '@/components/contract/ContractForm/Step1BusinessSize';
// Step 3: 근로자 이름
import Step2WorkerName from '@/components/contract/ContractForm/Step2WorkerName';
// Step 4: 시급/월급
import Step3Wage from '@/components/contract/ContractForm/Step3Wage';
// Step 5: 근무기간
import Step4WorkPeriod from '@/components/contract/ContractForm/Step4WorkPeriod';
// Step 6: 근무요일
import Step5WorkDays from '@/components/contract/ContractForm/Step5WorkDays';
// Step 7: 근무시간
import Step6WorkTime from '@/components/contract/ContractForm/Step6WorkTime';
// Step 8: 휴게시간
import Step7BreakTime from '@/components/contract/ContractForm/Step7BreakTime';
// Step 9: 업무내용 + 급여일
import Step9JobDescription from '@/components/contract/ContractForm/Step9JobDescription';
import Step10PayDay from '@/components/contract/ContractForm/Step10PayDay';

export default function CreateContractPage() {
  const router = useRouter();
  const { step, prevStep, reset } = useContractFormStore();
  const [isExitSheetOpen, setIsExitSheetOpen] = useState(false);

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
        return <Step1Workplace />;      // 사업장 선택/등록
      case 2:
        return <Step1BusinessSize />;   // 사업장 규모
      case 3:
        return <Step2WorkerName />;     // 근로자 이름
      case 4:
        return <Step3Wage />;           // 시급/월급
      case 5:
        return <Step4WorkPeriod />;     // 근무기간
      case 6:
        return <Step5WorkDays />;       // 근무요일
      case 7:
        return <Step6WorkTime />;       // 근무시간
      case 8:
        return <Step7BreakTime />;      // 휴게시간
      case 9:
        return <Step10PayDay />;        // 급여일 + 업무내용
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PageHeader
        onBack={handleBack}
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
