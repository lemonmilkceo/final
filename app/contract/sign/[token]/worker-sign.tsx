'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from '@/components/contract/SignatureCanvas';
import BottomSheet from '@/components/ui/BottomSheet';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Toast from '@/components/ui/Toast';
import { signAsWorker } from './actions';
import { formatCurrency } from '@/lib/utils/format';
import clsx from 'clsx';

// 근로자 서명 페이지에서 사용하는 타입
interface WorkerSignContract {
  worker_name: string;
  wage_type?: string;
  hourly_wage: number | null;
  monthly_wage?: number | null;
  includes_weekly_allowance: boolean;
  start_date: string;
  end_date: string | null;
  work_days: string[] | null;
  work_days_per_week: number | null;
  work_start_time: string;
  work_end_time: string;
  break_minutes: number;
  work_location: string;
  job_description: string;
  pay_day: number;
  payment_timing?: string;
  is_last_day_payment?: boolean;
  signatures?: {
    id: string;
    signer_role: 'employer' | 'worker';
    signed_at: string | null;
    signature_data: string;
  }[];
  employer?: {
    id: string;
    name: string | null;
    phone: string | null;
  } | null;
}

interface WorkerSignPageProps {
  contract: WorkerSignContract;
  token: string;
}

export default function WorkerSignPage({
  contract,
  token,
}: WorkerSignPageProps) {
  const router = useRouter();
  const [isSignatureSheetOpen, setIsSignatureSheetOpen] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  // 근로자가 이미 서명했는지 확인
  const workerSigned = contract.signatures?.some(
    (s) => s.signer_role === 'worker' && s.signed_at
  );

  const formatWorkDays = () => {
    if (contract.work_days_per_week) {
      return `주 ${contract.work_days_per_week}일`;
    }
    if (contract.work_days && contract.work_days.length > 0) {
      return contract.work_days.join(', ');
    }
    return '-';
  };

  const handleSignatureComplete = async () => {
    if (!signatureData) {
      setError('서명을 해주세요');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await signAsWorker(token, signatureData);

      if (result.success) {
        setIsSignatureSheetOpen(false);
        setToastMessage('서명이 완료됐어요! 🎉');
        setShowToast(true);
        setIsCompleted(true);
        router.refresh();
      } else {
        setError(result.error || '서명 저장에 실패했어요');
      }
    } catch {
      setError('알 수 없는 오류가 발생했어요');
    } finally {
      setIsLoading(false);
    }
  };

  // 급여 정보 포맷팅
  const formatWage = () => {
    if (contract.wage_type === 'monthly' && contract.monthly_wage) {
      return `월 ${formatCurrency(contract.monthly_wage)}`;
    }
    if (contract.hourly_wage) {
      return `시급 ${formatCurrency(contract.hourly_wage)}${contract.includes_weekly_allowance ? ' (주휴수당 포함)' : ''}`;
    }
    return '-';
  };

  // 급여일 포맷팅
  const formatPayDay = () => {
    const timing = contract.payment_timing === 'next_month' ? '익월' : '당월';
    const day = contract.is_last_day_payment ? '말일' : `${contract.pay_day}일`;
    return `${timing} ${day}`;
  };

  const contractItems = [
    { label: '근로자', value: contract.worker_name },
    { label: '급여', value: formatWage() },
    {
      label: '근무기간',
      value: contract.end_date
        ? `${contract.start_date} ~ ${contract.end_date}`
        : `${contract.start_date} ~`,
    },
    { label: '근무요일', value: formatWorkDays() },
    {
      label: '근무시간',
      value: `${contract.work_start_time} ~ ${contract.work_end_time}`,
    },
    { label: '휴게시간', value: `${contract.break_minutes}분` },
    { label: '근무장소', value: contract.work_location },
    { label: '업무내용', value: contract.job_description },
    { label: '급여일', value: formatPayDay() },
  ];

  // 서명 완료 화면
  if (isCompleted || workerSigned) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <span className="text-6xl mb-4 animate-bounce">🎉</span>
        <h1 className="text-[22px] font-bold text-gray-900 mb-2">
          계약이 완료됐어요!
        </h1>
        <p className="text-[15px] text-gray-500 mb-8">
          서명한 계약서는 앱에서 확인할 수 있어요
        </p>

        <a
          href="/login"
          className="w-full max-w-xs py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg text-center"
        >
          앱으로 이동하기
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white px-5 py-4 border-b border-gray-100 safe-top">
        <h1 className="text-[18px] font-bold text-gray-900 text-center">
          근로계약서
        </h1>
        <p className="text-[13px] text-gray-500 text-center mt-1">
          {contract.employer?.name || '사장님'}이 보낸 계약서예요
        </p>
      </header>

      {/* Contract Content */}
      <div className="flex-1 p-4 pb-40">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {/* Title */}
          <h2 className="text-[20px] font-bold text-gray-900 text-center mb-6">
            표준근로계약서
          </h2>

          {/* Contract Details */}
          <div className="space-y-4 text-[15px]">
            {contractItems.map((item, index) => (
              <div
                key={index}
                className="flex justify-between py-2 border-b border-gray-100"
              >
                <span className="text-gray-500">{item.label}</span>
                <span className="text-gray-900 font-medium text-right max-w-[60%]">
                  {item.value || '-'}
                </span>
              </div>
            ))}
          </div>

          {/* Signatures */}
          <div className="mt-8 space-y-4">
            {/* Employer Signature */}
            <div>
              <p className="text-[14px] text-gray-500 mb-3">사업자 서명</p>
              {contract.signatures?.find((s) => s.signer_role === 'employer')
                ?.signed_at ? (
                <div className="w-full h-20 border-2 border-green-500 rounded-xl flex items-center justify-center bg-green-50">
                  <span className="text-green-600 font-medium">✅ 서명 완료</span>
                </div>
              ) : (
                <div className="w-full h-20 border-2 border-gray-200 rounded-xl flex items-center justify-center bg-gray-50">
                  <span className="text-gray-400">서명 대기중</span>
                </div>
              )}
            </div>

            {/* Worker Signature */}
            <div>
              <p className="text-[14px] text-gray-500 mb-3">근로자 서명</p>
              <button
                onClick={() => setIsSignatureSheetOpen(true)}
                className="w-full h-20 border-2 border-dashed border-blue-400 rounded-xl flex items-center justify-center text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                터치하여 서명하기 ✍️
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 rounded-xl p-4 flex items-center gap-2">
            <span>⚠️</span>
            <span className="text-[14px] text-red-600">{error}</span>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pt-3 pb-4 safe-bottom">
        <button
          onClick={() => setIsSignatureSheetOpen(true)}
          className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg"
        >
          서명하고 계약하기 ✍️
        </button>
      </div>

      {/* Signature Sheet */}
      <BottomSheet
        isOpen={isSignatureSheetOpen}
        onClose={() => setIsSignatureSheetOpen(false)}
        title="서명해주세요"
      >
        {/* Signature Canvas */}
        <SignatureCanvas
          onSignatureChange={setSignatureData}
          width={320}
          height={192}
          className="mb-6"
        />

        <button
          onClick={handleSignatureComplete}
          disabled={!signatureData || isLoading}
          className={clsx(
            'w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2',
            signatureData && !isLoading
              ? 'bg-blue-500 text-white active:bg-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <>
              <LoadingSpinner variant="button" />
              서명 저장 중...
            </>
          ) : (
            '서명 완료'
          )}
        </button>
      </BottomSheet>

      {/* Toast */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
