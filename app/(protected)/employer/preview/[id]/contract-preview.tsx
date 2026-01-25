'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import BottomSheet from '@/components/ui/BottomSheet';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SignatureCanvas from '@/components/contract/SignatureCanvas';
import Toast from '@/components/ui/Toast';
import AIReviewSheet from '@/components/contract/AIReviewSheet';
import SignupPromptSheet from '@/components/shared/SignupPromptSheet';
import { useContractFormStore } from '@/stores/contractFormStore';
import { createContract } from '@/app/(protected)/employer/create/actions';
import { signContract, sendContract } from './actions';
import { formatCurrency } from '@/lib/utils/format';
import { copyContractLink } from '@/lib/utils/share';
import { shareContractViaKakao, initKakao } from '@/lib/kakao';
import clsx from 'clsx';
import type { ContractStatus } from '@/types';

interface ReviewItem {
  category: string;
  status: 'pass' | 'warning' | 'fail';
  title: string;
  description: string;
  suggestion: string | null;
}

// 미리보기에서 사용하는 계약서 타입
interface PreviewContract {
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
  business_size: 'under_5' | 'over_5';
  status: ContractStatus;
  signatures?: {
    id: string;
    signer_role: 'employer' | 'worker';
    signed_at: string | null;
    signature_data: string;
  }[];
}

interface ContractPreviewProps {
  contractId: string | null;
  contract?: PreviewContract;
  isNew: boolean;
  isGuestMode?: boolean;
}

export default function ContractPreview({
  contractId,
  contract,
  isNew,
  isGuestMode = false,
}: ContractPreviewProps) {
  const router = useRouter();
  const { data: formData, reset } = useContractFormStore();
  const [isSignatureSheetOpen, setIsSignatureSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  
  // AI Review 상태
  const [isAIReviewLoading, setIsAIReviewLoading] = useState(false);
  const [isAIReviewSheetOpen, setIsAIReviewSheetOpen] = useState(false);
  const [aiReviewResult, setAiReviewResult] = useState<{
    overall_status: 'pass' | 'warning' | 'fail';
    items: ReviewItem[];
  } | null>(null);
  
  // PDF 상태
  const [isPDFLoading, setIsPDFLoading] = useState(false);
  // Share token (from shareUrl)
  const shareToken = shareUrl?.split('/').pop() || '';
  
  // 회원가입 안내 팝업
  const [isSignupPromptOpen, setIsSignupPromptOpen] = useState(false);

  // 사업자가 이미 서명했는지 확인
  const employerSigned = contract?.signatures?.some(
    (s) => s.signer_role === 'employer' && s.signed_at
  );

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
    // 게스트 모드에서는 회원가입 안내 팝업 표시
    if (isGuestMode) {
      setIsSignupPromptOpen(true);
      return;
    }

    if (isNew) {
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
      return;
    }

    // 기존 계약서 - 서명 여부에 따라 분기
    if (employerSigned) {
      // 이미 서명했으면 전송
      await handleSend();
    } else {
      // 서명 시트 열기
      setIsSignatureSheetOpen(true);
    }
  };

  const handleSignatureComplete = async () => {
    if (!signatureData) {
      setError('서명을 해주세요');
      return;
    }

    // 새 계약서이거나 게스트 모드인 경우: 서명 데이터만 저장하고 시트 닫기
    if (isNew || isGuestMode) {
      setIsSignatureSheetOpen(false);
      setToastMessage('서명이 저장됐어요! ✍️');
      setShowToast(true);
      
      // 게스트 모드에서는 회원가입 안내 팝업 표시
      if (isGuestMode) {
        setTimeout(() => {
          setIsSignupPromptOpen(true);
        }, 1000);
      }
      return;
    }

    // 기존 계약서: DB에 서명 저장
    if (!contractId) {
      setError('계약서 정보를 찾을 수 없어요');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await signContract(contractId, signatureData);

      if (result.success) {
        setIsSignatureSheetOpen(false);
        setToastMessage('서명이 완료됐어요! ✍️');
        setShowToast(true);
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

  const handleSend = async () => {
    if (!contractId) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await sendContract(contractId);

      if (result.success && result.data) {
        setShareUrl(result.data.shareUrl);
        setToastMessage('공유 링크가 생성됐어요! 🔗');
        setShowToast(true);
      } else {
        setError(result.error || '공유 링크 생성에 실패했어요');
      }
    } catch {
      setError('알 수 없는 오류가 발생했어요');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setToastMessage('링크가 복사됐어요! 📋');
      setShowToast(true);
    } catch {
      setError('링크 복사에 실패했어요');
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

  // AI 검토 요청
  const handleAIReview = async () => {
    if (isNew) {
      setError('계약서를 먼저 저장해주세요');
      return;
    }

    if (!contractId) {
      setError('계약서 ID가 없어요');
      return;
    }

    setIsAIReviewLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          setError('AI 검토 크레딧이 부족해요. 크레딧을 충전해주세요.');
        } else {
          setError(data.error || 'AI 검토에 실패했어요');
        }
        return;
      }

      setAiReviewResult({
        overall_status: data.review.overall_status,
        items: data.review.review_items || [],
      });
      setIsAIReviewSheetOpen(true);
    } catch {
      setError('AI 검토 중 오류가 발생했어요');
    } finally {
      setIsAIReviewLoading(false);
    }
  };

  // PDF 다운로드
  const handleDownloadPDF = async () => {
    if (!contractId) {
      setError('계약서를 먼저 저장해주세요');
      return;
    }

    setIsPDFLoading(true);
    setError('');

    try {
      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'PDF 생성에 실패했어요');
        return;
      }

      // Base64를 Blob으로 변환하여 다운로드
      const byteCharacters = atob(data.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToastMessage('PDF가 다운로드됐어요! 📄');
      setShowToast(true);
    } catch {
      setError('PDF 다운로드 중 오류가 발생했어요');
    } finally {
      setIsPDFLoading(false);
    }
  };

  // 링크 복사
  const handleCopyShareLink = async () => {
    if (!shareToken) {
      setError('먼저 근로자에게 보내기를 해주세요');
      return;
    }

    const success = await copyContractLink(shareToken);
    if (success) {
      setToastMessage('링크가 복사됐어요! 📋');
      setShowToast(true);
    } else {
      setError('링크 복사에 실패했어요');
    }
  };

  // 카카오톡 공유
  const handleKakaoShare = () => {
    if (!shareUrl) {
      setError('먼저 근로자에게 보내기를 해주세요');
      return;
    }

    initKakao();
    const success = shareContractViaKakao({
      workerName: displayData.workerName,
      shareUrl,
    });

    if (!success) {
      setError('카카오톡 공유에 실패했어요');
    }
  };

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
            {/* 이미 서명된 경우 (DB에서 가져온 기존 계약서) */}
            {contract?.signatures?.find((s) => s.signer_role === 'employer')
              ?.signed_at ? (
              <div className="w-full h-24 border-2 border-green-500 rounded-xl flex items-center justify-center bg-green-50">
                <span className="text-green-600 font-medium">✅ 서명 완료</span>
              </div>
            ) : signatureData ? (
              /* 새 계약서에서 서명한 경우 (아직 저장 안됨) */
              <div className="w-full h-24 border-2 border-blue-500 rounded-xl flex flex-col items-center justify-center bg-blue-50">
                <span className="text-blue-600 font-medium">✍️ 서명 완료</span>
                <button 
                  onClick={() => setIsSignatureSheetOpen(true)}
                  className="text-[12px] text-blue-400 mt-1"
                >
                  다시 서명하기
                </button>
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
        <button
          onClick={handleAIReview}
          disabled={isAIReviewLoading || isNew}
          className={clsx(
            'w-full mt-4 bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm',
            isAIReviewLoading || isNew
              ? 'opacity-50 cursor-not-allowed'
              : 'active:bg-gray-50'
          )}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {isAIReviewLoading ? '⏳' : '🤖'}
            </span>
            <div>
              <p className="text-[15px] font-semibold text-gray-900">
                {isAIReviewLoading ? 'AI가 검토 중이에요...' : 'AI 노무사 검토 받기'}
              </p>
              <p className="text-[13px] text-gray-500">
                {isNew
                  ? '계약서를 먼저 저장해주세요'
                  : '법적 문제가 없는지 확인해요'}
              </p>
            </div>
          </div>
          {isAIReviewLoading ? (
            <LoadingSpinner variant="inline" className="w-5 h-5" />
          ) : (
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
          )}
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
          <button
            onClick={handleDownloadPDF}
            disabled={isPDFLoading || isNew}
            className={clsx(
              'flex flex-col items-center gap-1',
              (isPDFLoading || isNew) && 'opacity-50'
            )}
          >
            <span className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              {isPDFLoading ? (
                <LoadingSpinner variant="inline" className="w-5 h-5" />
              ) : (
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
              )}
            </span>
            <span className="text-[12px] text-gray-500">PDF</span>
          </button>
          <button
            onClick={handleCopyShareLink}
            disabled={!shareUrl}
            className={clsx(
              'flex flex-col items-center gap-1',
              !shareUrl && 'opacity-50'
            )}
          >
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
          <button
            onClick={handleKakaoShare}
            disabled={!shareUrl}
            className={clsx(
              'flex flex-col items-center gap-1',
              !shareUrl && 'opacity-50'
            )}
          >
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

        {/* Share URL Display */}
        {shareUrl && (
          <div className="mb-4 bg-blue-50 rounded-xl p-3 flex items-center gap-2">
            <span className="flex-1 text-[13px] text-blue-700 truncate">
              {shareUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="text-[13px] text-blue-500 font-medium whitespace-nowrap"
            >
              복사
            </button>
          </div>
        )}

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
              처리 중...
            </>
          ) : isGuestMode ? (
            '체험 완료하기 🎉'
          ) : isNew ? (
            '계약서 저장하기'
          ) : employerSigned ? (
            '근로자에게 보내기 📤'
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

      {/* AI Review Sheet */}
      {aiReviewResult && (
        <AIReviewSheet
          isOpen={isAIReviewSheetOpen}
          onClose={() => setIsAIReviewSheetOpen(false)}
          overallStatus={aiReviewResult.overall_status}
          items={aiReviewResult.items}
        />
      )}

      {/* 회원가입 안내 팝업 (게스트 모드) */}
      <SignupPromptSheet
        isOpen={isSignupPromptOpen}
        onClose={() => setIsSignupPromptOpen(false)}
      />
    </div>
  );
}
