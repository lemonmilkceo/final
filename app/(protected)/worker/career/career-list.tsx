'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/shared/EmptyState';
import Toast from '@/components/ui/Toast';
import SignupPromptSheet from '@/components/shared/SignupPromptSheet';
import BottomSheet from '@/components/ui/BottomSheet';
import CareerCertificatePDF from '@/components/career/CareerCertificatePDF';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { generatePDF } from '@/lib/utils/pdf';
import { 
  getEffectiveEndDate, 
  getCareerStatus, 
  getCareerStatusLabel,
  calculateWorkDays,
  formatWorkDuration,
  type CareerStatus 
} from '@/lib/utils/career';

interface CareerContract {
  id: string;
  worker_name: string;
  wage_type?: string;
  hourly_wage: number | null;
  monthly_wage?: number | null;
  start_date: string;
  end_date: string | null;
  resignation_date: string | null;
  work_location: string;
  job_description: string;
  completed_at: string | null;
  employer?: {
    name: string | null;
  } | null;
}

interface CareerListProps {
  contracts: CareerContract[];
  totalDays: number;
  totalContracts: number;
  isGuestMode?: boolean;
}

export default function CareerList({
  contracts,
  totalDays,
  totalContracts,
  isGuestMode = false,
}: CareerListProps) {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error' | 'info'>('info');
  const [showSignupSheet, setShowSignupSheet] = useState(false);
  const [showPDFSheet, setShowPDFSheet] = useState(false);
  const [isPDFGenerating, setIsPDFGenerating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  // 퇴사일 미입력 계약 체크 (무기한 계약이면서 퇴사일 없음)
  const contractsNeedingResignation = contracts.filter(
    (c) => !c.resignation_date && !c.end_date
  );

  // 카드 클릭 핸들러
  const handleCardClick = (contractId: string) => {
    if (isGuestMode) {
      setShowSignupSheet(true);
      return;
    }
    router.push(`/worker/contract/${contractId}`);
  };

  const showToastMessage = (message: string, variant: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };

  // 버튼 클릭 시 바텀시트 열기
  const handleExportClick = () => {
    // 게스트 모드: 회원가입 유도
    if (isGuestMode) {
      setShowSignupSheet(true);
      return;
    }

    // 바텀시트 열기
    setShowPDFSheet(true);
  };

  // 실제 PDF 생성 및 다운로드
  const handleGeneratePDF = async () => {
    if (!pdfRef.current) {
      showToastMessage('PDF 생성에 실패했어요', 'error');
      return;
    }

    setIsPDFGenerating(true);
    try {
      const workerName = contracts[0]?.worker_name || '근로자';
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const filename = `근무이력서_${workerName}_${dateStr}.pdf`;
      
      await generatePDF(pdfRef.current, { filename });
      showToastMessage('근무이력서가 다운로드되었어요', 'success');
      setShowPDFSheet(false);
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      showToastMessage('PDF 생성에 실패했어요. 다시 시도해주세요.', 'error');
    } finally {
      setIsPDFGenerating(false);
    }
  };

  // 경력 데이터 변환 (PDF용)
  const getPDFData = () => {
    const careers = contracts.map((contract) => {
      const effectiveEnd = getEffectiveEndDate(contract);
      const durationDays = calculateWorkDays(contract);

      return {
        id: contract.id,
        workplaceName: contract.employer?.name || contract.work_location || '미지정',
        jobDescription: contract.job_description || '업무 내용 미기재',
        startDate: contract.start_date,
        endDate: effectiveEnd ? effectiveEnd.toISOString().split('T')[0] : null,
        resignationDate: contract.resignation_date,
        durationDays: durationDays > 0 ? durationDays : 1,
      };
    });

    return {
      worker: {
        name: contracts[0]?.worker_name || '근로자',
      },
      careers,
      totalDays,
      totalContracts,
      issueDate: new Date().toISOString(),
    };
  };

  // 기간 포맷 (퇴사일 우선)
  const formatPeriod = (contract: CareerContract) => {
    const start = formatDate(contract.start_date);
    const effectiveEnd = getEffectiveEndDate(contract);
    
    if (!effectiveEnd) {
      return `${start} ~ 현재`;
    }
    
    return `${start} ~ ${formatDate(effectiveEnd.toISOString().split('T')[0])}`;
  };

  // 기간 계산 (퇴사일 우선)
  const calculateDuration = (contract: CareerContract) => {
    const days = calculateWorkDays(contract);
    return formatWorkDuration(days);
  };

  // 상태 배지 스타일
  const getStatusBadgeStyle = (status: CareerStatus) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-50 text-green-600';
      case 'resigned':
        return 'bg-gray-100 text-gray-600';
      case 'expired':
        return 'bg-gray-100 text-gray-600';
      case 'needs_input':
        return 'bg-amber-50 text-amber-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <PageHeader title="내 경력" />

      <div className="px-5 pt-4 pb-24">

        {/* Guest Mode Banner */}
        {isGuestMode && (
          <div className="bg-blue-50 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-xl">💡</span>
            <p className="text-[14px] text-blue-700">
              샘플 데이터입니다. 로그인하면 실제 경력을 확인할 수 있어요.
            </p>
          </div>
        )}

        {/* 퇴사일 미입력 안내 배너 */}
        {!isGuestMode && contractsNeedingResignation.length > 0 && (
          <div className="bg-amber-50 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-[14px] font-medium text-amber-800">
                  퇴사일을 입력하면 더 정확한 이력서를 받을 수 있어요
                </p>
                <p className="text-[13px] text-amber-600 mt-1">
                  아래 근무지를 눌러 퇴사 처리를 진행해주세요
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card variant="elevated" className="text-center">
            <p className="text-[12px] text-gray-500 mb-1">총 근무 기간</p>
            <p className="text-[20px] font-bold text-gray-900">
              {totalDays > 30
                ? `${Math.floor(totalDays / 30)}개월`
                : `${totalDays}일`}
            </p>
          </Card>
          <Card variant="elevated" className="text-center">
            <p className="text-[12px] text-gray-500 mb-1">계약 건수</p>
            <p className="text-[20px] font-bold text-gray-900">
              {totalContracts}건
            </p>
          </Card>
        </div>

        {/* Career List */}
        {contracts.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-[16px] font-semibold text-gray-900">
              근무 이력
            </h2>
            {contracts.map((contract) => {
              const status = getCareerStatus(contract);
              const statusLabel = getCareerStatusLabel(status);
              
              return (
                <Card
                  key={contract.id}
                  variant="default"
                  className="border border-gray-100 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  onClick={() => handleCardClick(contract.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🏢</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold text-gray-900 truncate">
                            {contract.employer?.name || contract.work_location}
                          </p>
                          <p className="text-[13px] text-gray-500 line-clamp-2">
                            {contract.job_description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <p className="text-[13px] text-blue-500 font-medium whitespace-nowrap">
                            {calculateDuration(contract)}
                          </p>
                          {/* 상태 배지 */}
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${getStatusBadgeStyle(status)}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[12px] text-gray-400">
                          <span>{formatPeriod(contract)}</span>
                          <span>•</span>
                          <span>
                            {contract.wage_type === 'monthly' && contract.monthly_wage
                              ? `월 ${formatCurrency(contract.monthly_wage)}`
                              : contract.hourly_wage
                                ? `시급 ${formatCurrency(contract.hourly_wage)}`
                                : '-'}
                          </span>
                        </div>
                        {/* 화살표 아이콘 */}
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<span className="text-6xl">📋</span>}
            title="아직 경력이 없어요"
            description="계약을 완료하면 경력이 쌓여요"
          />
        )}

        {/* Export Button */}
        {contracts.length > 0 && (
          <button 
            onClick={handleExportClick}
            className="w-full mt-6 py-4 rounded-2xl bg-blue-500 text-white font-medium text-[15px] flex items-center justify-center gap-2 transition-colors hover:bg-blue-600 active:bg-blue-700"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            근무이력서 발급
          </button>
        )}
      </div>

      {/* Toast */}
      <Toast
        message={toastMessage}
        variant={toastVariant}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* 게스트 모드 회원가입 유도 시트 */}
      <SignupPromptSheet
        isOpen={showSignupSheet}
        onClose={() => setShowSignupSheet(false)}
        feature="pdf"
      />

      {/* PDF 미리보기 시트 */}
      <BottomSheet
        isOpen={showPDFSheet}
        onClose={() => setShowPDFSheet(false)}
        title="근무이력서 미리보기"
      >
        <div className="space-y-4">
          {/* PDF 미리보기 영역 */}
          <div className="bg-gray-50 rounded-2xl p-4 max-h-[50vh] overflow-auto">
            <div className="transform scale-[0.35] origin-top-left" style={{ width: '285%' }}>
              <CareerCertificatePDF
                ref={pdfRef}
                data={getPDFData()}
              />
            </div>
          </div>

          {/* 안내 문구 */}
          <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2">
            <span className="text-lg">💡</span>
            <p className="text-[13px] text-blue-700">
              계약서 정보로 만든 근무이력서예요. 다운로드 후 구직 활동에 활용해보세요.
            </p>
          </div>

          {/* 다운로드 버튼 */}
          <button
            onClick={handleGeneratePDF}
            disabled={isPDFGenerating}
            className={`w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 ${
              isPDFGenerating
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white active:bg-blue-600'
            }`}
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
    </div>
  );
}
