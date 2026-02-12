'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import BottomSheet from '@/components/ui/BottomSheet';
import SignatureCanvas from '@/components/contract/SignatureCanvas';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Toast from '@/components/ui/Toast';
import Badge from '@/components/ui/Badge';
import ContractPDF from '@/components/contract/ContractPDF';
import GuestBanner from '@/components/shared/GuestBanner';
import SignupPromptSheet from '@/components/shared/SignupPromptSheet';
import ChatButton from '@/components/chat/ChatButton';
import { signContractAsWorker } from './actions';
import { setResignationDate, clearResignationDate } from '@/app/actions/resignation';
import { formatCurrency, formatDate, formatDday } from '@/lib/utils/format';
import { generatePDF, getContractPDFFilename } from '@/lib/utils/pdf';
import { validateResignationDate } from '@/lib/utils/career';
import clsx from 'clsx';
import type { ContractStatus } from '@/types';

interface ContractDetailData {
  id: string;
  worker_name: string;
  workplace_name?: string | null;
  wage_type?: string;
  hourly_wage: number | null;
  monthly_wage?: number | null;
  includes_weekly_allowance: boolean;
  start_date: string;
  end_date: string | null;
  resignation_date: string | null;
  work_days: string[] | null;
  work_days_per_week: number | null;
  work_start_time: string;
  work_end_time: string;
  break_minutes: number;
  work_location: string;
  job_description: string;
  special_terms?: string | null;
  pay_day: number;
  payment_timing?: string;
  is_last_day_payment?: boolean;
  contract_type?: 'regular' | 'contract';
  business_size?: string | null;
  status: ContractStatus;
  expires_at: string | null;
  created_at: string;
  signatures: {
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

interface WorkerContractDetailProps {
  contract: ContractDetailData;
  isGuestMode?: boolean;
  userId?: string;
}

export default function WorkerContractDetail({
  contract,
  isGuestMode = false,
  userId,
}: WorkerContractDetailProps) {
  const router = useRouter();
  const [isSignatureSheetOpen, setIsSignatureSheetOpen] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // PDF 관련 상태
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isPDFGenerating, setIsPDFGenerating] = useState(false);
  const [showPDFSheet, setShowPDFSheet] = useState(false);
  
  // 게스트 모드 회원가입 유도 시트
  const [showSignupSheet, setShowSignupSheet] = useState(false);
  
  // 퇴사 처리 관련 상태
  const [showResignationSheet, setShowResignationSheet] = useState(false);
  const [resignationDateInput, setResignationDateInput] = useState(
    contract.resignation_date || new Date().toISOString().split('T')[0]
  );
  const [isResignationLoading, setIsResignationLoading] = useState(false);
  const [resignationError, setResignationError] = useState('');

  const workerSigned = contract.signatures.some(
    (s) => s.signer_role === 'worker' && s.signed_at
  );

  const employerSigned = contract.signatures.some(
    (s) => s.signer_role === 'employer' && s.signed_at
  );

  // 계약 완료 여부 (양측 서명 완료 또는 status가 completed)
  const isCompleted = contract.status === 'completed' || (workerSigned && employerSigned);

  const formatWorkDays = () => {
    if (contract.work_days && contract.work_days.length > 0) {
      return contract.work_days.join(', ');
    }
    if (contract.work_days_per_week) {
      return `주 ${contract.work_days_per_week}일`;
    }
    return '-';
  };

  // 휴일(주휴일) 계산
  const formatHolidays = () => {
    const allDays = ['월', '화', '수', '목', '금', '토', '일'];
    
    if (contract.work_days && contract.work_days.length > 0 && !contract.work_days_per_week) {
      const holidays = allDays.filter(day => !contract.work_days?.includes(day));
      if (holidays.length === 0) return '없음';
      return holidays.join(', ');
    }
    
    if (contract.work_days_per_week) {
      const holidayCount = 7 - contract.work_days_per_week;
      if (holidayCount <= 0) return '없음';
      return `주 ${holidayCount}일`;
    }
    
    return '-';
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

  // 상태 배지
  const getStatusBadge = () => {
    if (isCompleted) {
      return <Badge variant="complete">서명 완료</Badge>;
    }
    switch (contract.status) {
      case 'pending':
        return <Badge variant="waiting">서명 대기</Badge>;
      case 'expired':
        return <Badge variant="expired">만료됨</Badge>;
      default:
        return <Badge variant="pending">작성중</Badge>;
    }
  };

  // PDF 다운로드
  const handleDownloadPDF = () => {
    setShowPDFSheet(true);
  };

  // 실제 PDF 생성 및 다운로드
  const handleGeneratePDF = async () => {
    if (!pdfRef.current) {
      setToastMessage('PDF 생성에 실패했어요');
      setShowToast(true);
      return;
    }

    setIsPDFGenerating(true);
    try {
      const filename = getContractPDFFilename(contract.worker_name);
      await generatePDF(pdfRef.current, { filename });
      setToastMessage('PDF가 다운로드됐어요! 📄');
      setShowToast(true);
      setShowPDFSheet(false);
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      setToastMessage('PDF 생성에 실패했어요. 다시 시도해주세요.');
      setShowToast(true);
    } finally {
      setIsPDFGenerating(false);
    }
  };

  const handleSign = async () => {
    if (!signatureData) {
      setError('서명을 해주세요');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await signContractAsWorker(contract.id, signatureData);

      if (result.success) {
        setIsSignatureSheetOpen(false);
        setToastMessage('계약이 완료됐어요! 🎉');
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

  // 계약 형태 표시 텍스트
  const formatContractType = () => {
    return contract.contract_type === 'regular' 
      ? '정규직 (4대보험)' 
      : '계약직 (3.3%)';
  };

  // 계약 상세 항목 (사업자 페이지와 동일)
  // 사업자 이름: employer.name이 없으면 workplace_name 또는 '사업자' 표시
  const employerDisplayName = contract.employer?.name || contract.workplace_name || '사업자';
  
  const contractItems = [
    { label: '사업장', value: contract.workplace_name || '-' },
    { label: '계약형태', value: formatContractType() },
    { label: '사업자', value: employerDisplayName },
    { label: '근로자', value: contract.worker_name },
    { label: '급여', value: formatWage() },
    {
      label: '근무기간',
      value: (() => {
        // 퇴사일이 있으면 퇴사일까지
        if (contract.resignation_date) {
          return `${formatDate(contract.start_date)} ~ ${formatDate(contract.resignation_date)} (퇴사)`;
        }
        // 계약 종료일이 있으면 종료일까지
        if (contract.end_date) {
          return `${formatDate(contract.start_date)} ~ ${formatDate(contract.end_date)}`;
        }
        // 무기한
        return `${formatDate(contract.start_date)} ~`;
      })(),
    },
    { label: '근무요일', value: formatWorkDays() },
    { label: '휴일', value: formatHolidays() },
    {
      label: '근무시간',
      value: `${contract.work_start_time} ~ ${contract.work_end_time}`,
    },
    { label: '휴게시간', value: `${contract.break_minutes}분` },
    { label: '근무장소', value: contract.work_location },
    { label: '업무내용', value: contract.job_description || '-' },
    ...(contract.special_terms
      ? [{ label: '특약사항', value: contract.special_terms }]
      : []),
    { label: '급여일', value: formatPayDay() },
    // 5인 이상 사업장만 표시
    ...(contract.business_size === 'over_5' ? [
      { label: '연차휴가', value: '근로기준법 제60조에 따라 부여' },
      { label: '가산수당', value: '연장·야간·휴일 근로 시 50% 이상 가산' },
    ] : []),
  ];

  // 게스트 모드에서 서명 버튼 클릭 시
  const handleGuestSignClick = () => {
    setShowSignupSheet(true);
  };

  // 게스트 모드에서 PDF 다운로드 클릭 시
  const handleGuestPDFClick = () => {
    setToastMessage('PDF 다운로드는 회원만 가능해요');
    setShowToast(true);
  };

  // 퇴사 처리
  const handleResignation = async () => {
    setResignationError('');
    
    // 유효성 검사
    const validation = validateResignationDate(
      new Date(resignationDateInput),
      new Date(contract.start_date)
    );
    
    if (!validation.valid) {
      setResignationError(validation.message || '유효하지 않은 날짜예요');
      return;
    }
    
    setIsResignationLoading(true);
    
    try {
      const result = await setResignationDate(contract.id, resignationDateInput);
      
      if (result.success) {
        setShowResignationSheet(false);
        setToastMessage('퇴사 처리가 완료됐어요');
        setShowToast(true);
        router.refresh();
      } else {
        setResignationError(result.error || '퇴사 처리에 실패했어요');
      }
    } catch {
      setResignationError('알 수 없는 오류가 발생했어요');
    } finally {
      setIsResignationLoading(false);
    }
  };

  // 퇴사 취소
  const handleClearResignation = async () => {
    setIsResignationLoading(true);
    
    try {
      const result = await clearResignationDate(contract.id);
      
      if (result.success) {
        setShowResignationSheet(false);
        setToastMessage('퇴사가 취소됐어요');
        setShowToast(true);
        router.refresh();
      } else {
        setResignationError(result.error || '퇴사 취소에 실패했어요');
      }
    } catch {
      setResignationError('알 수 없는 오류가 발생했어요');
    } finally {
      setIsResignationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-32">
      <PageHeader title="계약서 상세" />
      
      {/* 게스트 모드 배너 */}
      {isGuestMode && <GuestBanner />}

      <div className="flex-1 p-5">
        {/* 상태 및 기본 정보 */}
        <div className="bg-white rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👔</span>
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-gray-900">
                  {contract.employer?.name || '사장님'}
                </h2>
                <p className="text-[13px] text-gray-500">
                  {contract.work_location}
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          {/* 만료 정보 */}
          {contract.status === 'pending' && contract.expires_at && !workerSigned && (
            <div className="bg-amber-50 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2">
                <span>⏰</span>
                <span className="text-[14px] text-amber-700">
                  서명 마감: {formatDday(contract.expires_at)}
                </span>
              </div>
            </div>
          )}

          {/* 서명 현황 */}
          <div className="flex gap-3">
            <div
              className={clsx(
                'flex-1 rounded-xl p-3 text-center',
                employerSigned ? 'bg-green-50' : 'bg-gray-100'
              )}
            >
              <p className="text-[12px] text-gray-500 mb-1">사업자</p>
              <p
                className={clsx(
                  'text-[14px] font-medium',
                  employerSigned ? 'text-green-600' : 'text-gray-400'
                )}
              >
                {employerSigned ? '✅ 서명 완료' : '⏳ 대기'}
              </p>
            </div>
            <div
              className={clsx(
                'flex-1 rounded-xl p-3 text-center',
                workerSigned ? 'bg-green-50' : 'bg-gray-100'
              )}
            >
              <p className="text-[12px] text-gray-500 mb-1">근로자</p>
              <p
                className={clsx(
                  'text-[14px] font-medium',
                  workerSigned ? 'text-green-600' : 'text-gray-400'
                )}
              >
                {workerSigned ? '✅ 서명 완료' : '⏳ 대기'}
              </p>
            </div>
          </div>
        </div>

        {/* 계약 상세 정보 (사업자 페이지와 동일) */}
        <div className="bg-white rounded-2xl p-5 mb-4">
          <h3 className="text-[16px] font-semibold text-gray-900 mb-4">
            계약 내용
          </h3>
          <div className="space-y-3">
            {contractItems.map((item, index) => (
              <div
                key={index}
                className="flex justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <span className="text-[14px] text-gray-500">{item.label}</span>
                <span className="text-[14px] font-medium text-gray-900 text-right max-w-[60%]">
                  {item.value || '-'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 작성일 정보 */}
        <div className="bg-white rounded-2xl p-5">
          <div className="flex justify-between py-2">
            <span className="text-[14px] text-gray-500">계약서 작성일</span>
            <span className="text-[14px] font-medium text-gray-900">
              {formatDate(contract.created_at)}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-50 rounded-xl p-4 flex items-center gap-2">
            <span>⚠️</span>
            <span className="text-[14px] text-red-600">{error}</span>
          </div>
        )}
      </div>

      {/* 하단 액션 버튼 - BottomNav(z-40) 위에 표시되도록 z-50 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pt-3 pb-4 safe-bottom z-50">
        {/* 서명 대기 중 - 서명 버튼 */}
        {!workerSigned && contract.status === 'pending' && (
          <button
            onClick={isGuestMode ? handleGuestSignClick : () => setIsSignatureSheetOpen(true)}
            className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg"
          >
            서명하고 계약하기 ✍️
          </button>
        )}

        {/* 근로자 서명 완료, 사업자 대기 중 - 안내 메시지 */}
        {workerSigned && !employerSigned && contract.status === 'pending' && (
          <div className="text-center">
            <p className="text-[15px] text-gray-600 mb-2">
              ✅ 서명을 완료했어요
            </p>
            <p className="text-[13px] text-gray-400">
              사업자 서명 후 계약이 완료됩니다
            </p>
          </div>
        )}

        {/* 완료된 계약서 - 아이콘 버튼 표시 */}
        {isCompleted && (
          <div className="flex justify-center gap-8">
            <button
              onClick={isGuestMode ? handleGuestPDFClick : handleDownloadPDF}
              className={clsx(
                "flex flex-col items-center gap-1",
                isGuestMode && "opacity-50"
              )}
            >
              <span className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                📄
              </span>
              <span className="text-[12px] text-gray-500">PDF 다운로드</span>
            </button>
            
            {/* 채팅 버튼 - 게스트 모드가 아닐 때만 */}
            {!isGuestMode && userId && (
              <ChatButton
                contractId={contract.id}
                currentUserId={userId}
                partnerName={contract.employer?.name || '사업자'}
                variant="icon"
              />
            )}
            
            {/* 퇴사 처리 버튼 - 게스트 모드가 아닐 때만 */}
            {!isGuestMode && (
              <button
                onClick={() => setShowResignationSheet(true)}
                className="flex flex-col items-center gap-1"
              >
                <span className={clsx(
                  "w-12 h-12 rounded-full flex items-center justify-center text-xl",
                  contract.resignation_date ? "bg-green-100" : "bg-amber-100"
                )}>
                  {contract.resignation_date ? '✅' : '🚪'}
                </span>
                <span className="text-[12px] text-gray-500">
                  {contract.resignation_date ? '퇴사 완료' : '퇴사 처리'}
                </span>
              </button>
            )}
          </div>
        )}

        {/* 게스트 모드 안내 */}
        {isCompleted && isGuestMode && (
          <p className="text-center text-[13px] text-gray-400 mt-3">
            PDF 다운로드는 회원만 가능해요
          </p>
        )}
      </div>

      {/* Signature Sheet */}
      <BottomSheet
        isOpen={isSignatureSheetOpen}
        onClose={() => setIsSignatureSheetOpen(false)}
        title="서명해주세요"
      >
        <SignatureCanvas
          onSignatureChange={setSignatureData}
          width={320}
          height={192}
          className="mb-6"
        />

        <button
          onClick={handleSign}
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

      {/* PDF 미리보기 시트 */}
      <BottomSheet
        isOpen={showPDFSheet}
        onClose={() => setShowPDFSheet(false)}
        title="PDF 다운로드"
      >
        <div className="space-y-4">
          {/* PDF 미리보기 영역 */}
          <div className="bg-gray-50 rounded-2xl p-4 max-h-[50vh] overflow-auto">
            <div className="transform scale-[0.4] origin-top-left" style={{ width: '250%' }}>
              <ContractPDF
                ref={pdfRef}
                data={{
                  workplaceName: contract.workplace_name || undefined,
                  employerName: contract.employer?.name || undefined,
                  workerName: contract.worker_name,
                  wageType: (contract.wage_type || 'hourly') as 'hourly' | 'monthly',
                  hourlyWage: contract.hourly_wage,
                  monthlyWage: contract.monthly_wage || undefined,
                  includesWeeklyAllowance: contract.includes_weekly_allowance,
                  payDay: contract.pay_day,
                  paymentTiming: (contract.payment_timing || 'current_month') as 'current_month' | 'next_month',
                  isLastDayPayment: contract.is_last_day_payment || false,
                  startDate: contract.start_date,
                  endDate: contract.end_date || undefined,
                  workDays: contract.work_days || undefined,
                  workDaysPerWeek: contract.work_days_per_week || undefined,
                  workStartTime: contract.work_start_time,
                  workEndTime: contract.work_end_time,
                  breakMinutes: contract.break_minutes,
                  workLocation: contract.work_location,
                  jobDescription: contract.job_description || undefined,
                  specialTerms: contract.special_terms || undefined,
                  businessSize: (contract.business_size || 'under_5') as 'under_5' | 'over_5',
                  employerSignature: contract.signatures?.find(s => s.signer_role === 'employer')
                    ? {
                        signatureData: contract.signatures.find(s => s.signer_role === 'employer')?.signature_data,
                        signedAt: contract.signatures.find(s => s.signer_role === 'employer')?.signed_at || undefined,
                      }
                    : undefined,
                  workerSignature: contract.signatures?.find(s => s.signer_role === 'worker')
                    ? {
                        signatureData: contract.signatures.find(s => s.signer_role === 'worker')?.signature_data,
                        signedAt: contract.signatures.find(s => s.signer_role === 'worker')?.signed_at || undefined,
                      }
                    : undefined,
                  createdAt: contract.created_at,
                }}
              />
            </div>
          </div>

          {/* 안내 문구 */}
          <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2">
            <span className="text-lg">💡</span>
            <p className="text-[13px] text-blue-700">
              위 미리보기와 동일한 형식의 PDF 파일이 다운로드됩니다.
            </p>
          </div>

          {/* 다운로드 버튼 */}
          <button
            onClick={handleGeneratePDF}
            disabled={isPDFGenerating}
            className={clsx(
              'w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2',
              isPDFGenerating
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white active:bg-blue-600'
            )}
          >
            {isPDFGenerating ? (
              <>
                <LoadingSpinner variant="button" />
                PDF 생성 중...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF 다운로드
              </>
            )}
          </button>
        </div>
      </BottomSheet>

      {/* Toast */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* 게스트 모드 회원가입 유도 시트 */}
      <SignupPromptSheet
        isOpen={showSignupSheet}
        onClose={() => setShowSignupSheet(false)}
        feature="sign"
      />

      {/* 퇴사 처리 시트 */}
      <BottomSheet
        isOpen={showResignationSheet}
        onClose={() => {
          setShowResignationSheet(false);
          setResignationError('');
        }}
        title={contract.resignation_date ? '퇴사일 수정' : '퇴사 처리'}
      >
        <div className="space-y-4">
          {/* 안내 문구 */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-[14px] text-blue-800 font-medium">
                  퇴사일은 근무이력서에 반영돼요
                </p>
                <p className="text-[13px] text-blue-600 mt-1">
                  정확한 마지막 근무일을 입력해주세요
                </p>
              </div>
            </div>
          </div>

          {/* 날짜 입력 */}
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-2">
              마지막 근무일
            </label>
            <input
              type="date"
              value={resignationDateInput}
              onChange={(e) => setResignationDateInput(e.target.value)}
              min={contract.start_date}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 에러 메시지 */}
          {resignationError && (
            <div className="bg-red-50 rounded-xl p-3 flex items-center gap-2">
              <span>⚠️</span>
              <span className="text-[13px] text-red-600">{resignationError}</span>
            </div>
          )}

          {/* 버튼 */}
          <div className="space-y-3">
            <button
              onClick={handleResignation}
              disabled={isResignationLoading}
              className={clsx(
                'w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2',
                isResignationLoading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white active:bg-blue-600'
              )}
            >
              {isResignationLoading ? (
                <>
                  <LoadingSpinner variant="button" />
                  처리 중...
                </>
              ) : contract.resignation_date ? (
                '퇴사일 수정'
              ) : (
                '퇴사 처리 완료'
              )}
            </button>

            {/* 퇴사 취소 버튼 (이미 퇴사 처리된 경우만) */}
            {contract.resignation_date && (
              <button
                onClick={handleClearResignation}
                disabled={isResignationLoading}
                className="w-full py-3 rounded-xl text-[14px] text-gray-500 hover:bg-gray-100 transition-colors"
              >
                퇴사 취소
              </button>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
