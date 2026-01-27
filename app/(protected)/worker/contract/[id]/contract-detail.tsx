'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import BottomSheet from '@/components/ui/BottomSheet';
import SignatureCanvas from '@/components/contract/SignatureCanvas';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Toast from '@/components/ui/Toast';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import ContractPDF from '@/components/contract/ContractPDF';
import { signContractAsWorker } from './actions';
import { formatCurrency, formatDday } from '@/lib/utils/format';
import { generatePDF, getContractPDFFilename } from '@/lib/utils/pdf';
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
}

export default function WorkerContractDetail({
  contract,
}: WorkerContractDetailProps) {
  const router = useRouter();
  const [isSignatureSheetOpen, setIsSignatureSheetOpen] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showFullContract, setShowFullContract] = useState(false);
  
  // PDF 관련 상태
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isPDFGenerating, setIsPDFGenerating] = useState(false);
  const [showPDFSheet, setShowPDFSheet] = useState(false);

  const workerSigned = contract.signatures.some(
    (s) => s.signer_role === 'worker' && s.signed_at
  );

  const employerSigned = contract.signatures.some(
    (s) => s.signer_role === 'employer' && s.signed_at
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

  // 휴일(주휴일) 계산
  const formatHolidays = () => {
    const allDays = ['월', '화', '수', '목', '금', '토', '일'];
    
    if (contract.work_days && contract.work_days.length > 0 && !contract.work_days_per_week) {
      // 특정 요일 선택 시: 선택 안 한 요일이 휴일
      const holidays = allDays.filter(day => !contract.work_days?.includes(day));
      if (holidays.length === 0) return '없음';
      return holidays.join(', ');
    }
    
    if (contract.work_days_per_week) {
      // 주 N일 선택 시: 7 - N일이 휴일
      const holidayCount = 7 - contract.work_days_per_week;
      if (holidayCount <= 0) return '없음';
      return `주 ${holidayCount}일`;
    }
    
    return '-';
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

  // 급여 정보 포맷팅
  const formatWage = () => {
    if (contract.wage_type === 'monthly' && contract.monthly_wage) {
      return `월 ${formatCurrency(contract.monthly_wage)}`;
    }
    if (contract.hourly_wage) {
      return `시급 ${formatCurrency(contract.hourly_wage)}`;
    }
    return '-';
  };

  // 급여일 포맷팅
  const formatPayDay = () => {
    const timing = contract.payment_timing === 'next_month' ? '익월' : '당월';
    const day = contract.is_last_day_payment ? '말일' : `${contract.pay_day}일`;
    return `${timing} ${day}`;
  };

  // 요약 카드 항목
  const summaryItems = [
    { label: '급여', value: formatWage(), icon: '💰' },
    { label: '근무요일', value: formatWorkDays(), icon: '📅' },
    { label: '휴일', value: formatHolidays(), icon: '🏖️' },
    {
      label: '근무시간',
      value: `${contract.work_start_time}~${contract.work_end_time}`,
      icon: '⏰',
    },
    { label: '급여일', value: formatPayDay(), icon: '💵' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <PageHeader title="계약서 확인" />

      {/* Content */}
      <div className="flex-1 p-4 pb-40">
        {/* Employer Info */}
        <div className="bg-white rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👔</span>
            </div>
            <div>
              <p className="text-[16px] font-semibold text-gray-900">
                {contract.employer?.name || '사장님'}
              </p>
              <p className="text-[13px] text-gray-500">
                {contract.work_location}
              </p>
            </div>
          </div>
        </div>

        {/* D-day Badge */}
        {contract.expires_at && contract.status === 'pending' && (
          <div className="bg-amber-50 rounded-xl p-4 mb-4 flex items-center gap-2">
            <span>⏳</span>
            <span className="text-[14px] text-amber-700">
              서명 마감 {formatDday(contract.expires_at)}
            </span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {summaryItems.map((item, index) => (
            <Card key={index} variant="default" className="border border-gray-100">
              <div className="text-center">
                <span className="text-2xl mb-2 block">{item.icon}</span>
                <p className="text-[12px] text-gray-500 mb-1">{item.label}</p>
                <p className="text-[15px] font-semibold text-gray-900">
                  {item.value}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Full Contract Toggle */}
        <button
          onClick={() => setShowFullContract(!showFullContract)}
          className="w-full bg-white rounded-xl p-4 flex items-center justify-between mb-4"
        >
          <span className="text-[15px] text-gray-700">전체 계약서 보기</span>
          <svg
            className={clsx(
              'w-5 h-5 text-gray-400 transition-transform',
              showFullContract && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Full Contract Details */}
        {showFullContract && (
          <div className="bg-white rounded-2xl p-5 mb-4 animate-fade-in">
            <h3 className="text-[17px] font-bold text-gray-900 text-center mb-4">
              표준근로계약서
            </h3>
            <div className="space-y-3 text-[14px]">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">사업장</span>
                <span className="text-gray-900">{(contract as { workplace_name?: string }).workplace_name || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">근로자</span>
                <span className="text-gray-900">{contract.worker_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">급여</span>
                <span className="text-gray-900">
                  {formatWage()}
                  {contract.wage_type !== 'monthly' && contract.includes_weekly_allowance && ' (주휴 포함)'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">근무기간</span>
                <span className="text-gray-900">
                  {contract.start_date} ~{' '}
                  {contract.end_date || '미정'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">근무시간</span>
                <span className="text-gray-900">
                  {contract.work_start_time} ~ {contract.work_end_time}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">휴게시간</span>
                <span className="text-gray-900">{contract.break_minutes}분</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">업무내용</span>
                <span className="text-gray-900 text-right max-w-[60%]">
                  {contract.job_description}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Signature Status */}
        <div className="bg-white rounded-2xl p-5">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-4">
            서명 현황
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-gray-600">사업자 서명</span>
              {employerSigned ? (
                <Badge variant="completed">완료</Badge>
              ) : (
                <Badge variant="pending">대기중</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-gray-600">근로자 서명</span>
              {workerSigned ? (
                <Badge variant="completed">완료</Badge>
              ) : (
                <Badge variant="pending">대기중</Badge>
              )}
            </div>
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

      {/* Bottom CTA */}
      {!workerSigned && contract.status === 'pending' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pt-3 pb-4 safe-bottom">
          <button
            onClick={() => setIsSignatureSheetOpen(true)}
            className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg"
          >
            서명하고 계약하기 ✍️
          </button>
        </div>
      )}

      {/* 완료된 계약서 - PDF 다운로드 */}
      {(contract.status === 'completed' || (workerSigned && employerSigned)) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pt-3 pb-4 safe-bottom">
          <button
            onClick={handleDownloadPDF}
            className="w-full py-4 rounded-2xl bg-gray-900 text-white font-semibold text-lg flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            계약서 PDF 다운로드
          </button>
        </div>
      )}

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
    </div>
  );
}
