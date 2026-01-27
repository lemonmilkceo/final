'use client';

import { useState, useEffect } from 'react';
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
import { getContractShareUrl } from '@/lib/utils/share';
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
  
  // 카카오 SDK 초기화
  const [isKakaoReady, setIsKakaoReady] = useState(false);
  
  // AI Review 상태
  const [isAIReviewLoading, setIsAIReviewLoading] = useState(false);
  const [isAIReviewSheetOpen, setIsAIReviewSheetOpen] = useState(false);
  const [aiReviewResult, setAiReviewResult] = useState<{
    overall_status: 'pass' | 'warning' | 'fail';
    items: ReviewItem[];
  } | null>(null);
  
  // Share token (from shareUrl) - 준비 중 기능에서 사용 예정
  // const shareToken = shareUrl?.split('/').pop() || '';
  
  // 회원가입 안내 팝업
  const [isSignupPromptOpen, setIsSignupPromptOpen] = useState(false);
  
  // 공유 링크 시트
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  
  // 저장 완료 상태 (공유 링크 복사 후)
  const [isSaveCompleted, setIsSaveCompleted] = useState(false);

  // 카카오 SDK 초기화
  useEffect(() => {
    // 약간의 지연 후 카카오 SDK 초기화 (SDK 로드 대기)
    const timer = setTimeout(() => {
      const initialized = initKakao();
      setIsKakaoReady(initialized);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

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
      // 서명이 없으면 서명 먼저 요청
      if (!signatureData) {
        setIsSignatureSheetOpen(true);
        return;
      }

      // 새 계약서 저장 (서명 데이터와 함께) → 바로 공유 시트 열기
      setIsLoading(true);
      setError('');

      try {
        const result = await createContract(
          {
            ...formData,
            hourlyWage: formData.hourlyWage || 0,
            businessSize: formData.businessSize || 'under_5',
          },
          signatureData
        );

        if (result.success && result.data) {
          reset(); // 스토어 초기화
          
          // 공유 URL이 있으면 바로 공유 시트 열기
          if (result.data.shareUrl) {
            setShareUrl(result.data.shareUrl);
            setIsShareSheetOpen(true);
            setToastMessage('계약서가 저장됐어요! 📝');
            setShowToast(true);
          } else {
            // 공유 URL 없으면 계약서 페이지로 이동
            router.push(`/employer/preview/${result.data.contractId}`);
          }
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
        // 공유 링크 시트 열기
        setIsShareSheetOpen(true);
      } else {
        setError(result.error || '공유 링크 생성에 실패했어요');
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

  // AI 검토 요청
  const handleAIReview = async () => {
    setIsAIReviewLoading(true);
    setError('');

    try {
      // 새 계약서면 formData로, 저장된 계약서면 contractId로 요청
      const requestBody = isNew
        ? { contractData: formData }
        : { contractId };

      const response = await fetch('/api/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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

  // PDF 다운로드 (준비 중)
  const handleDownloadPDF = () => {
    setToastMessage('📄 PDF 다운로드 기능을 준비하고 있어요! 조금만 기다려 주세요 🙏');
    setShowToast(true);
  };

  // 링크 복사 - shareUrl이 있으면 공유 시트 열기
  const handleCopyShareLink = () => {
    if (!shareUrl) {
      setError('먼저 근로자에게 보내기를 해주세요');
      return;
    }
    setIsShareSheetOpen(true);
  };

  // 카카오톡 공유
  const handleKakaoShare = () => {
    if (!shareUrl) {
      setError('먼저 서명하고 저장해주세요');
      return;
    }

    if (!isKakaoReady) {
      // SDK가 준비되지 않았으면 다시 시도
      const initialized = initKakao();
      if (!initialized) {
        setToastMessage('카카오톡 공유 준비 중... 잠시 후 다시 시도해주세요');
        setShowToast(true);
        return;
      }
      setIsKakaoReady(true);
    }

    // 공유 토큰 추출
    const shareToken = shareUrl.split('/').pop() || '';
    const fullShareUrl = getContractShareUrl(shareToken);

    const success = shareContractViaKakao({
      workerName: displayData.workerName,
      shareUrl: fullShareUrl,
    });

    if (!success) {
      setToastMessage('카카오톡 공유에 실패했어요. 링크를 복사해서 보내주세요.');
      setShowToast(true);
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

        {/* AI Review Button - Premium Style */}
        <button
          onClick={handleAIReview}
          disabled={isAIReviewLoading}
          className={clsx(
            'w-full mt-4 rounded-2xl p-4 relative overflow-hidden',
            'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50',
            'border-2 border-amber-200/60',
            isAIReviewLoading
              ? 'opacity-70 cursor-not-allowed'
              : 'active:scale-[0.98] transition-transform'
          )}
        >
          {/* Shimmer Effect */}
          {!isAIReviewLoading && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div 
                className="absolute inset-0 animate-shimmer"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.15), transparent)',
                }}
              />
            </div>
          )}
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Icon Box */}
              <div className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                'bg-gradient-to-br from-amber-400 to-orange-500',
                'shadow-sm'
              )}>
                <span className="text-xl">
                  {isAIReviewLoading ? '⏳' : '⚖️'}
                </span>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold text-amber-900">
                    {isAIReviewLoading ? 'AI가 검토 중...' : 'AI 노무사 검토'}
                  </p>
                  {/* PRO Badge */}
                  {!isAIReviewLoading && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-amber-700">
                  최저임금·휴게시간 등 법적 문제 분석
                </p>
              </div>
            </div>

            {/* Right Side - Credits or Loading */}
            <div className="flex items-center gap-2">
              {isAIReviewLoading ? (
                <LoadingSpinner variant="inline" className="w-5 h-5" />
              ) : (
                <>
                  <svg
                    className="w-5 h-5 text-amber-500"
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
                </>
              )}
            </div>
          </div>
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
        {/* 저장 완료 상태 */}
        {isSaveCompleted ? (
          <div className="space-y-4">
            {/* 저장 완료 안내 */}
            <div className="bg-green-50 rounded-2xl p-4 text-center">
              <span className="text-3xl mb-2 block">✅</span>
              <p className="text-[16px] font-bold text-green-800 mb-1">
                계약서가 저장됐어요!
              </p>
              <p className="text-[14px] text-green-700">
                근로자가 서명하면 알림을 보내드릴게요
              </p>
            </div>
            
            {/* 홈으로 돌아가기 버튼 */}
            <button
              onClick={() => router.push('/employer')}
              className="w-full py-4 rounded-2xl font-semibold text-lg bg-blue-500 text-white active:bg-blue-600"
            >
              홈으로 돌아가기
            </button>
          </div>
        ) : (
          <>
            {/* Share Options */}
            <div className="flex justify-center gap-6 mb-4">
              <button
                onClick={handleDownloadPDF}
                className="flex flex-col items-center gap-1"
              >
                <span className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center relative">
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
                className="flex flex-col items-center gap-1"
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
              <button 
                onClick={() => setIsShareSheetOpen(true)}
                className="mb-4 w-full bg-blue-50 rounded-xl p-3 flex items-center gap-2"
              >
                <span className="flex-1 text-[13px] text-blue-700 truncate text-left">
                  {shareUrl}
                </span>
                <span className="text-[13px] text-blue-500 font-medium whitespace-nowrap">
                  복사
                </span>
              </button>
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
                signatureData ? '저장하고 공유하기 📤' : '서명하고 저장하기 ✍️'
              ) : employerSigned ? (
                '근로자에게 보내기 📤'
              ) : (
                <>서명하고 보내기 ✍️</>
              )}
            </button>
          </>
        )}
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

      {/* 공유 링크 시트 */}
      <BottomSheet
        isOpen={isShareSheetOpen}
        onClose={() => {
          setIsShareSheetOpen(false);
          setIsSaveCompleted(true);
        }}
        title="근로자에게 계약서 보내기"
      >
        <div className="space-y-6">
          {/* 카카오톡 공유 버튼 - 메인 CTA */}
          <button
            onClick={() => {
              setIsShareSheetOpen(false);
              handleKakaoShare();
            }}
            className="w-full py-4 rounded-2xl font-semibold text-lg bg-[#FEE500] text-[#191919] flex items-center justify-center gap-3 active:bg-[#F5DC00]"
          >
            <svg className="w-6 h-6" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 2C5.02944 2 1 5.25562 1 9.28571C1 11.8571 2.67188 14.1143 5.19531 15.4286L4.35156 18.5714C4.28516 18.8286 4.57422 19.0286 4.80078 18.8857L8.5 16.4571C9 16.5143 9.5 16.5714 10 16.5714C14.9706 16.5714 19 13.3158 19 9.28571C19 5.25562 14.9706 2 10 2Z"
                fill="currentColor"
              />
            </svg>
            카카오톡으로 보내기
          </button>

          {/* 구분선 */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[13px] text-gray-400">또는</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* 링크 표시 영역 */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-[13px] text-gray-500 mb-2">링크 직접 복사</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white rounded-xl px-4 py-3 border border-gray-200 overflow-hidden">
                <p className="text-[14px] text-gray-700 break-all">
                  {shareUrl || '링크 생성 중...'}
                </p>
              </div>
              <button
                onClick={async () => {
                  if (shareUrl) {
                    // URL만 단독으로 복사 (앞뒤 공백 없이)
                    await navigator.clipboard.writeText(shareUrl.trim());
                    setToastMessage('링크가 복사됐어요! 카카오톡에 붙여넣기 하세요 📋');
                    setShowToast(true);
                  }
                }}
                className="px-4 py-3 bg-blue-500 text-white rounded-xl font-medium text-[14px] whitespace-nowrap"
              >
                복사
              </button>
            </div>
            <p className="text-[12px] text-gray-400 mt-2">
              💡 링크만 단독으로 보내야 클릭이 잘 돼요
            </p>
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={() => {
              setIsShareSheetOpen(false);
              setIsSaveCompleted(true);
            }}
            className="w-full py-4 rounded-2xl font-semibold text-lg bg-gray-100 text-gray-700"
          >
            닫기
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
