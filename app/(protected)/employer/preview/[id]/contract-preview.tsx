'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import BottomSheet from '@/components/ui/BottomSheet';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useContractFormStore } from '@/stores/contractFormStore';
import { createContract } from '../../../create/actions';
import { formatCurrency } from '@/lib/utils/format';
import clsx from 'clsx';
import type { Contract, Signature } from '@/types';

interface ContractPreviewProps {
  contractId: string | null;
  contract?: Contract & { signatures?: Signature[] };
  isNew: boolean;
}

export default function ContractPreview({
  contractId,
  contract,
  isNew,
}: ContractPreviewProps) {
  const router = useRouter();
  const { data: formData, reset } = useContractFormStore();
  const [isSignatureSheetOpen, setIsSignatureSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 표시할 데이터 결정 (새 계약서면 store, 아니면 DB)
  const displayData = isNew
    ? {
        workerName: formData.workerName,
        hourlyWage: formData.hourlyWage || 0,
        includesWeeklyAllowance: formData.includesWeeklyAllowance,
        startDate: formData.startDate,
        endDate: formData.endDate,
        workDays: formData.workDays,
        workDaysPerWeek: formData.workDaysPerWeek,
        useWorkDaysPerWeek: formData.useWorkDaysPerWeek,
        workStartTime: formData.workStartTime,
        workEndTime: formData.workEndTime,
        breakMinutes: formData.breakMinutes,
        workLocation: formData.workLocation,
        jobDescription: formData.jobDescription,
        payDay: formData.payDay,
        businessSize: formData.businessSize,
      }
    : {
        workerName: contract?.worker_name || '',
        hourlyWage: contract?.hourly_wage || 0,
        includesWeeklyAllowance: contract?.includes_weekly_allowance || false,
        startDate: contract?.start_date || '',
        endDate: contract?.end_date,
        workDays: contract?.work_days || [],
        workDaysPerWeek: contract?.work_days_per_week,
        useWorkDaysPerWeek: !!contract?.work_days_per_week,
        workStartTime: contract?.work_start_time || '',
        workEndTime: contract?.work_end_time || '',
        breakMinutes: contract?.break_minutes || 0,
        workLocation: contract?.work_location || '',
        jobDescription: contract?.job_description || '',
        payDay: contract?.pay_day || 10,
        businessSize: contract?.business_size || 'under_5',
      };

  const formatWorkDays = () => {
    if (displayData.useWorkDaysPerWeek && displayData.workDaysPerWeek) {
      return `주 ${displayData.workDaysPerWeek}일`;
    }
    if (displayData.workDays && displayData.workDays.length > 0) {
      return displayData.workDays.join(', ');
    }
    return '-';
  };

  const handleSignAndSend = async () => {
    if (!isNew) {
      // 기존 계약서 - 서명 시트 열기
      setIsSignatureSheetOpen(true);
      return;
    }

    // 새 계약서 저장
    setIsLoading(true);
    setError('');

    try {
      const result = await createContract({
        ...formData,
        hourlyWage: formData.hourlyWage || 0,
        businessSize: formData.businessSize || 'under_5',
      });

      if (result.success && result.data) {
        reset(); // 스토어 초기화
        router.push(`/employer/preview/${result.data.contractId}`);
      } else {
        setError(result.error || '계약서 저장에 실패했어요');
      }
    } catch {
      setError('알 수 없는 오류가 발생했어요');
    } finally {
      setIsLoading(false);
    }
  };

  const contractItems = [
    { label: '근로자', value: displayData.workerName },
    {
      label: '시급',
      value: `${formatCurrency(displayData.hourlyWage)}${displayData.includesWeeklyAllowance ? ' (주휴수당 포함)' : ''}`,
    },
    {
      label: '근무기간',
      value: displayData.endDate
        ? `${displayData.startDate} ~ ${displayData.endDate}`
        : `${displayData.startDate} ~`,
    },
    { label: '근무요일', value: formatWorkDays() },
    {
      label: '근무시간',
      value: `${displayData.workStartTime} ~ ${displayData.workEndTime}`,
    },
    { label: '휴게시간', value: `${displayData.breakMinutes}분` },
    { label: '근무장소', value: displayData.workLocation },
    { label: '업무내용', value: displayData.jobDescription },
    { label: '급여일', value: `매월 ${displayData.payDay}일` },
    {
      label: '사업장 규모',
      value: displayData.businessSize === 'under_5' ? '5인 미만' : '5인 이상',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <PageHeader title="계약서 미리보기" />

      {/* Contract Preview */}
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

          {/* Employer Signature Area */}
          <div className="mt-8">
            <p className="text-[14px] text-gray-500 mb-3">사업자 서명</p>
            {contract?.signatures?.find((s) => s.signer_role === 'employer')
              ?.signed_at ? (
              <div className="w-full h-24 border-2 border-green-500 rounded-xl flex items-center justify-center bg-green-50">
                <span className="text-green-600 font-medium">✅ 서명 완료</span>
              </div>
            ) : (
              <button
                onClick={() => setIsSignatureSheetOpen(true)}
                className="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                터치하여 서명
              </button>
            )}
          </div>
        </div>

        {/* AI Review Button */}
        <button className="w-full mt-4 bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm active:bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="text-[15px] font-semibold text-gray-900">
                AI 노무사 검토 받기
              </p>
              <p className="text-[13px] text-gray-500">
                법적 문제가 없는지 확인해요
              </p>
            </div>
          </div>
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 rounded-xl p-4 flex items-center gap-2">
            <span>⚠️</span>
            <span className="text-[14px] text-red-600">{error}</span>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pt-3 pb-4 safe-bottom">
        {/* Share Options */}
        <div className="flex justify-center gap-6 mb-4">
          <button className="flex flex-col items-center gap-1">
            <span className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </span>
            <span className="text-[12px] text-gray-500">PDF</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <span className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </span>
            <span className="text-[12px] text-gray-500">링크</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <span className="w-12 h-12 bg-[#FEE500] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#191919]" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10 2C5.02944 2 1 5.25562 1 9.28571C1 11.8571 2.67188 14.1143 5.19531 15.4286L4.35156 18.5714C4.28516 18.8286 4.57422 19.0286 4.80078 18.8857L8.5 16.4571C9 16.5143 9.5 16.5714 10 16.5714C14.9706 16.5714 19 13.3158 19 9.28571C19 5.25562 14.9706 2 10 2Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="text-[12px] text-gray-500">카카오톡</span>
          </button>
        </div>

        {/* Main CTA */}
        <button
          onClick={handleSignAndSend}
          disabled={isLoading}
          className={clsx(
            'w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2',
            isLoading
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white active:bg-blue-600'
          )}
        >
          {isLoading ? (
            <>
              <LoadingSpinner variant="button" />
              저장 중...
            </>
          ) : isNew ? (
            '계약서 저장하기'
          ) : (
            <>서명하고 보내기 ✍️</>
          )}
        </button>
      </div>

      {/* Signature Sheet */}
      <BottomSheet
        isOpen={isSignatureSheetOpen}
        onClose={() => setIsSignatureSheetOpen(false)}
        title="서명해주세요"
      >
        <div className="flex items-center justify-between mb-4">
          <span />
          <button
            onClick={() => {}}
            className="text-[15px] text-gray-500"
          >
            다시 쓰기
          </button>
        </div>

        {/* Signature Canvas Placeholder */}
        <div className="w-full h-48 bg-gray-50 rounded-2xl border-2 border-gray-200 relative mb-6">
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-[15px]">
            여기에 서명하세요
          </div>
        </div>

        <button
          onClick={() => setIsSignatureSheetOpen(false)}
          className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg"
        >
          서명 완료
        </button>
      </BottomSheet>
    </div>
  );
}
