'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import BottomSheet from '@/components/ui/BottomSheet';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useContractFormStore } from '@/stores/contractFormStore';
import { createContract } from '../../create/actions';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { ROUTES } from '@/lib/constants/routes';
import type { Contract, Signature } from '@/types';

interface ContractWithSignatures extends Contract {
  signatures: Signature[];
}

interface ContractPreviewProps {
  contract: ContractWithSignatures | null;
  isNew: boolean;
}

const DAYS_MAP: Record<string, string> = {
  월: '월요일',
  화: '화요일',
  수: '수요일',
  목: '목요일',
  금: '금요일',
  토: '토요일',
  일: '일요일',
};

export default function ContractPreview({
  contract,
  isNew,
}: ContractPreviewProps) {
  const router = useRouter();
  const { data: formData, reset } = useContractFormStore();
  const [isPending, startTransition] = useTransition();
  const [showSignatureSheet, setShowSignatureSheet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 미리보기 데이터 (새 계약서는 폼 데이터, 기존 계약서는 DB 데이터)
  const previewData = isNew
    ? {
        workerName: formData.workerName,
        hourlyWage: formData.hourlyWage || 0,
        includesWeeklyAllowance: formData.includesWeeklyAllowance,
        startDate: formData.startDate,
        endDate: formData.hasNoEndDate ? null : formData.endDate,
        workDays: formData.useWorkDaysPerWeek
          ? null
          : formData.workDays,
        workDaysPerWeek: formData.useWorkDaysPerWeek
          ? formData.workDaysPerWeek
          : null,
        workStartTime: formData.workStartTime,
        workEndTime: formData.workEndTime,
        breakMinutes: formData.breakMinutes,
        workLocation: formData.workLocation,
        jobDescription: formData.jobDescription,
        payDay: formData.payDay,
        businessSize: formData.businessSize,
      }
    : contract;

  if (!previewData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner variant="fullPage" message="로딩 중..." />
      </div>
    );
  }

  const handleSaveAndSign = () => {
    if (isNew) {
      // 새 계약서 저장
      startTransition(async () => {
        const result = await createContract({
          businessSize: formData.businessSize!,
          workerName: formData.workerName,
          hourlyWage: formData.hourlyWage!,
          includesWeeklyAllowance: formData.includesWeeklyAllowance,
          startDate: formData.startDate,
          endDate: formData.hasNoEndDate ? null : formData.endDate,
          hasNoEndDate: formData.hasNoEndDate,
          workDays: formData.workDays,
          workDaysPerWeek: formData.workDaysPerWeek,
          useWorkDaysPerWeek: formData.useWorkDaysPerWeek,
          workStartTime: formData.workStartTime,
          workEndTime: formData.workEndTime,
          breakMinutes: formData.breakMinutes,
          workLocation: formData.workLocation,
          jobDescription: formData.jobDescription,
          payDay: formData.payDay,
        });

        if (result.success && result.contractId) {
          reset();
          router.push(ROUTES.EMPLOYER_PREVIEW_CONTRACT(result.contractId));
        } else {
          setError(result.error || '계약서 저장에 실패했어요.');
        }
      });
    } else {
      // 기존 계약서 서명
      setShowSignatureSheet(true);
    }
  };

  const formatWorkDays = () => {
    if (previewData.workDays && previewData.workDays.length > 0) {
      return previewData.workDays.join(', ');
    }
    if (previewData.workDaysPerWeek) {
      return `주 ${previewData.workDaysPerWeek}일`;
    }
    return '-';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <PageHeader title="계약서 미리보기" />

      {/* Contract Preview */}
      <div className="flex-1 p-4 pb-32">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {/* Title */}
          <h2 className="text-[20px] font-bold text-gray-900 text-center mb-6">
            표준근로계약서
          </h2>

          {/* Contract Details */}
          <div className="space-y-4 text-[15px]">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">근로자</span>
              <span className="text-gray-900 font-medium">
                {previewData.workerName}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">시급</span>
              <span className="text-gray-900 font-medium">
                {formatCurrency(previewData.hourlyWage)}
                {previewData.includesWeeklyAllowance && (
                  <span className="text-[12px] text-gray-400 ml-1">
                    (주휴수당 포함)
                  </span>
                )}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">근무기간</span>
              <span className="text-gray-900 font-medium">
                {previewData.startDate
                  ? formatDate(previewData.startDate, 'yyyy.MM.dd')
                  : '-'}{' '}
                ~{' '}
                {previewData.endDate
                  ? formatDate(previewData.endDate, 'yyyy.MM.dd')
                  : '기간 정함 없음'}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">근무요일</span>
              <span className="text-gray-900 font-medium">
                {formatWorkDays()}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">근무시간</span>
              <span className="text-gray-900 font-medium">
                {previewData.workStartTime} ~ {previewData.workEndTime}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">휴게시간</span>
              <span className="text-gray-900 font-medium">
                {previewData.breakMinutes}분
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">근무장소</span>
              <span className="text-gray-900 font-medium text-right max-w-[200px] truncate">
                {previewData.workLocation}
              </span>
            </div>

            <div className="py-2 border-b border-gray-100">
              <span className="text-gray-500 block mb-1">업무내용</span>
              <span className="text-gray-900 font-medium">
                {previewData.jobDescription}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">급여일</span>
              <span className="text-gray-900 font-medium">
                매월 {previewData.payDay}일
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-gray-500">사업장 규모</span>
              <span className="text-gray-900 font-medium">
                {previewData.businessSize === 'under_5'
                  ? '5인 미만'
                  : '5인 이상'}
              </span>
            </div>
          </div>

          {/* Signature Area */}
          {!isNew && contract && (
            <div className="mt-8 space-y-4">
              <div>
                <p className="text-[14px] text-gray-500 mb-3">사업자 서명</p>
                {contract.signatures?.find(
                  (s) => s.signer_role === 'employer'
                ) ? (
                  <div className="w-full h-20 bg-gray-50 rounded-xl flex items-center justify-center">
                    <Badge variant="complete">서명 완료</Badge>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSignatureSheet(true)}
                    className="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
                  >
                    터치하여 서명
                  </button>
                )}
              </div>
            </div>
          )}
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
          <div className="mt-4 bg-red-50 text-red-600 rounded-xl p-4 text-[14px]">
            {error}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pt-3 pb-4 safe-bottom">
        {/* Share Options */}
        {!isNew && (
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
                <svg
                  className="w-6 h-6 text-[#191919]"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10 2C5.03 2 1 5.26 1 9.29c0 2.57 1.67 4.81 4.2 6.14l-.85 3.14c-.07.26.22.46.45.32l3.7-2.43c.5.06 1 .11 1.5.11 4.97 0 9-3.26 9-7.28C19 5.26 14.97 2 10 2z"
                  />
                </svg>
              </span>
              <span className="text-[12px] text-gray-500">카카오톡</span>
            </button>
          </div>
        )}

        {/* Main CTA */}
        <button
          onClick={handleSaveAndSign}
          disabled={isPending}
          className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg flex items-center justify-center gap-2 active:bg-blue-600 disabled:opacity-70"
        >
          {isPending ? (
            <LoadingSpinner variant="button" />
          ) : isNew ? (
            '계약서 저장하기'
          ) : (
            <>
              서명하고 보내기 ✍️
            </>
          )}
        </button>
      </div>

      {/* Signature Bottom Sheet */}
      <BottomSheet
        isOpen={showSignatureSheet}
        onClose={() => setShowSignatureSheet(false)}
        title="서명해주세요"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <button className="text-[15px] text-gray-500">다시 쓰기</button>
          </div>

          {/* Signature Canvas Placeholder */}
          <div className="w-full h-48 bg-gray-50 rounded-2xl border-2 border-gray-200 relative flex items-center justify-center">
            <p className="text-gray-300 text-[15px]">여기에 서명하세요</p>
          </div>

          <button
            onClick={() => setShowSignatureSheet(false)}
            className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg"
          >
            서명 완료
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
