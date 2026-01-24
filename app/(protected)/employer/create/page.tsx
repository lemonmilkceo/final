'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import {
  useContractFormStore,
  TOTAL_FORM_STEPS,
} from '@/stores/contractFormStore';
import Step1BusinessSize from '@/components/contract/ContractForm/Step1BusinessSize';
import Step2WorkerName from '@/components/contract/ContractForm/Step2WorkerName';
import Step3Wage from '@/components/contract/ContractForm/Step3Wage';
import Step4WorkPeriod from '@/components/contract/ContractForm/Step4WorkPeriod';
import Step5WorkDays from '@/components/contract/ContractForm/Step5WorkDays';
import Step6WorkTime from '@/components/contract/ContractForm/Step6WorkTime';
import Step7BreakTime from '@/components/contract/ContractForm/Step7BreakTime';
import Step8Location from '@/components/contract/ContractForm/Step8Location';
import Step9JobDescription from '@/components/contract/ContractForm/Step9JobDescription';
import Step10PayDay from '@/components/contract/ContractForm/Step10PayDay';

export default function CreateContractPage() {
  const router = useRouter();
  const { step, prevStep, reset } = useContractFormStore();

  const handleBack = () => {
    if (step === 1) {
      reset();
      router.back();
    } else {
      prevStep();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1BusinessSize />;
      case 2:
        return <Step2WorkerName />;
      case 3:
        return <Step3Wage />;
      case 4:
        return <Step4WorkPeriod />;
      case 5:
        return <Step5WorkDays />;
      case 6:
        return <Step6WorkTime />;
      case 7:
        return <Step7BreakTime />;
      case 8:
        return <Step8Location />;
      case 9:
        return <Step9JobDescription />;
      case 10:
        return <Step10PayDay />;
      default:
        return <Step1BusinessSize />;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PageHeader
        onBack={handleBack}
        progress={{ current: step, total: TOTAL_FORM_STEPS }}
      />
      {renderStep()}
    </div>
  );
}
