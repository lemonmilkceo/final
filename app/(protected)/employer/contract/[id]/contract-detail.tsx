'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import BottomSheet from '@/components/ui/BottomSheet';
import ConfirmSheet from '@/components/ui/ConfirmSheet';
import Toast from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ContractPDF from '@/components/contract/ContractPDF';
import GuestBanner from '@/components/shared/GuestBanner';
import { formatCurrency, formatDate, formatDday } from '@/lib/utils/format';
import { generatePDF, getContractPDFFilename } from '@/lib/utils/pdf';
import { deleteContract } from './actions';
import clsx from 'clsx';

interface Signature {
  id: string;
  signer_role: 'employer' | 'worker';
  signed_at: string | null;
  signature_data: string;
}

interface ContractData {
  id: string;
  workplaceName?: string | null;
  workerName: string;
  wageType: 'hourly' | 'monthly';
  hourlyWage: number | null;
  monthlyWage: number | null;
  includesWeeklyAllowance: boolean;
  startDate: string;
  endDate: string | null;
  workDays: string[] | null;
  workDaysPerWeek: number | null;
  workStartTime: string;
  workEndTime: string;
  breakMinutes: number;
  workLocation: string;
  jobDescription: string;
  payDay: number;
  paymentTiming: 'current_month' | 'next_month';
  isLastDayPayment: boolean;
  contractType: 'regular' | 'contract';
  businessSize: 'under_5' | 'over_5';
  status: 'draft' | 'pending' | 'completed' | 'expired' | 'deleted';
  createdAt: string;
  expiresAt: string | null;
  completedAt: string | null;
  shareToken: string | null;
  signatures: Signature[];
  // 민감정보 존재 여부 (마스킹 표시용)
  hasSensitiveInfo?: boolean;
  workerBankName?: string | null;
}

interface AIReviewData {
  overallStatus: 'pass' | 'warning' | 'fail';
  items: unknown[];
}

interface ContractDetailProps {
  contract: ContractData;
  aiReview: AIReviewData | null;
  employerName: string;
  isGuestMode?: boolean;
}

export default function ContractDetail({
  contract,
  aiReview,
  isGuestMode = false,
  employerName,
}: ContractDetailProps) {
  const router = useRouter();
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success');
  
  // 민감정보 표시 상태
  const [sensitiveInfo, setSensitiveInfo] = useState<{
    ssn?: string;
    bankName?: string;
    accountNumber?: string;
  } | null>(null);
  const [isSensitiveInfoVisible, setIsSensitiveInfoVisible] = useState(false);
  const [isSensitiveInfoLoading, setIsSensitiveInfoLoading] = useState(false);
  const [sensitiveInfoTimer, setSensitiveInfoTimer] = useState<number>(0);
  
  // PDF 관련 상태
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isPDFGenerating, setIsPDFGenerating] = useState(false);
  const [showPDFSheet, setShowPDFSheet] = useState(false);
  
  // 10초 카운트다운 후 자동 마스킹
  const hideSensitiveInfo = useCallback(() => {
    setIsSensitiveInfoVisible(false);
    setSensitiveInfo(null);
    setSensitiveInfoTimer(0);
  }, []);
  
  useEffect(() => {
    if (isSensitiveInfoVisible && sensitiveInfoTimer > 0) {
      const timer = setTimeout(() => {
        setSensitiveInfoTimer(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isSensitiveInfoVisible && sensitiveInfoTimer === 0) {
      hideSensitiveInfo();
    }
  }, [isSensitiveInfoVisible, sensitiveInfoTimer, hideSensitiveInfo]);
  
  // 민감정보 조회 (API 호출)
  const handleShowSensitiveInfo = async () => {
    if (isSensitiveInfoLoading) return;
    
    setIsSensitiveInfoLoading(true);
    try {
      const response = await fetch('/api/contract/sensitive-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId: contract.id, infoType: 'both' }),
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setSensitiveInfo(data.data);
        setIsSensitiveInfoVisible(true);
        setSensitiveInfoTimer(10); // 10초 카운트다운 시작
      } else {
        setToastMessage(data.error || '정보를 불러올 수 없어요');
        setToastVariant('error');
        setShowToast(true);
      }
    } catch {
      setToastMessage('정보 조회에 실패했어요');
      setToastVariant('error');
      setShowToast(true);
    } finally {
      setIsSensitiveInfoLoading(false);
    }
  };
  
  // 주민번호 마스킹
  const maskSSN = (ssn: string) => {
    if (ssn.length !== 13) return ssn;
    return `${ssn.substring(0, 6)}-${ssn.substring(6, 7)}******`;
  };
  
  // 계좌번호 마스킹
  const maskAccount = (account: string) => {
    if (account.length < 7) return account;
    return `${account.substring(0, 3)}****${account.substring(account.length - 4)}`;
  };
  
  // 단축 URL 생성
  const shareUrl = contract.shareToken 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/s/${contract.shareToken}`
    : null;

  const employerSigned = contract.signatures.find(
    (s) => s.signer_role === 'employer' && s.signed_at
  );
  const workerSigned = contract.signatures.find(
    (s) => s.signer_role === 'worker' && s.signed_at
  );

  const getStatusBadge = () => {
    switch (contract.status) {
      case 'completed':
        return <Badge variant="complete">서명 완료</Badge>;
      case 'pending':
        return <Badge variant="waiting">서명 대기</Badge>;
      case 'expired':
        return <Badge variant="expired">만료됨</Badge>;
      case 'deleted':
        return <Badge variant="expired">삭제됨</Badge>;
      default:
        return <Badge variant="pending">작성중</Badge>;
    }
  };

  const formatWorkDays = () => {
    if (contract.workDays && contract.workDays.length > 0) {
      return contract.workDays.join(', ');
    }
    if (contract.workDaysPerWeek) {
      return `주 ${contract.workDaysPerWeek}일`;
    }
    return '-';
  };

  // 휴일(주휴일) 계산
  const formatHolidays = () => {
    const allDays = ['월', '화', '수', '목', '금', '토', '일'];
    
    if (contract.workDays && contract.workDays.length > 0) {
      // 특정 요일 선택 시: 선택 안 한 요일이 휴일
      const holidays = allDays.filter(day => !contract.workDays?.includes(day));
      if (holidays.length === 0) return '없음';
      return holidays.join(', ');
    }
    
    if (contract.workDaysPerWeek) {
      // 주 N일 선택 시: 7 - N일이 휴일
      const holidayCount = 7 - contract.workDaysPerWeek;
      if (holidayCount <= 0) return '없음';
      return `주 ${holidayCount}일`;
    }
    
    return '-';
  };

  const handleDelete = async () => {
    if (isGuestMode) {
      setToastMessage('게스트 모드에서는 삭제할 수 없어요');
      setToastVariant('error');
      setShowToast(true);
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteContract(contract.id);
      if (result.success) {
        setIsDeleteSheetOpen(false);
        setToastMessage('계약서가 삭제됐어요');
        setToastVariant('success');
        setShowToast(true);
        setTimeout(() => router.push('/employer'), 1500);
      } else {
        setToastMessage(result.error || '삭제에 실패했어요');
        setToastVariant('error');
        setShowToast(true);
      }
    } catch {
      setToastMessage('삭제 중 오류가 발생했어요');
      setToastVariant('error');
      setShowToast(true);
    } finally {
      setIsDeleting(false);
    }
  };

  // 공유 시트 열기
  const handleOpenShareSheet = () => {
    if (isGuestMode) {
      setToastMessage('게스트 모드에서는 공유할 수 없어요');
      setToastVariant('error');
      setShowToast(true);
      return;
    }

    if (!shareUrl) {
      setToastMessage('공유 링크가 없어요');
      setToastVariant('error');
      setShowToast(true);
      return;
    }

    setIsShareSheetOpen(true);
  };

  // 링크 복사
  const handleCopyLink = async () => {
    if (!shareUrl) {
      setToastMessage('공유 링크가 없어요');
      setToastVariant('error');
      setShowToast(true);
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl.trim());
      setToastMessage('링크가 복사됐어요! 카카오톡에 붙여넣기 하세요 📋');
      setToastVariant('success');
      setShowToast(true);
    } catch {
      setToastMessage('링크 복사에 실패했어요');
      setToastVariant('error');
      setShowToast(true);
    }
  };

  // 급여 정보 포맷팅
  const formatWage = () => {
    if (contract.wageType === 'monthly' && contract.monthlyWage) {
      return `월 ${formatCurrency(contract.monthlyWage)}`;
    }
    if (contract.hourlyWage) {
      return `시급 ${formatCurrency(contract.hourlyWage)}${contract.includesWeeklyAllowance ? ' (주휴수당 포함)' : ''}`;
    }
    return '-';
  };

  // 급여일 포맷팅
  const formatPayDay = () => {
    const timing = contract.paymentTiming === 'next_month' ? '익월' : '당월';
    const day = contract.isLastDayPayment ? '말일' : `${contract.payDay}일`;
    return `${timing} ${day}`;
  };

  // PDF 다운로드
  const handleDownloadPDF = () => {
    if (isGuestMode) {
      setToastMessage('게스트 모드에서는 PDF 다운로드를 할 수 없어요');
      setToastVariant('error');
      setShowToast(true);
      return;
    }
    setShowPDFSheet(true);
  };

  // 실제 PDF 생성 및 다운로드
  const handleGeneratePDF = async () => {
    if (!pdfRef.current) {
      setToastMessage('PDF 생성에 실패했어요');
      setToastVariant('error');
      setShowToast(true);
      return;
    }

    setIsPDFGenerating(true);
    try {
      const filename = getContractPDFFilename(contract.workerName);
      await generatePDF(pdfRef.current, { filename });
      setToastMessage('PDF가 다운로드됐어요! 📄');
      setToastVariant('success');
      setShowToast(true);
      setShowPDFSheet(false);
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      setToastMessage('PDF 생성에 실패했어요. 다시 시도해주세요.');
      setToastVariant('error');
      setShowToast(true);
    } finally {
      setIsPDFGenerating(false);
    }
  };

  // 계약 형태 표시 텍스트
  const formatContractType = () => {
    return contract.contractType === 'regular' 
      ? '정규직 (4대보험)' 
      : '계약직 (3.3%)';
  };

  const contractItems = [
    { label: '사업장', value: contract.workplaceName || '-' },
    { label: '계약형태', value: formatContractType() },
    { label: '근로자', value: contract.workerName },
    { label: '급여', value: formatWage() },
    {
      label: '근무기간',
      value: contract.endDate
        ? `${formatDate(contract.startDate)} ~ ${formatDate(contract.endDate)}`
        : `${formatDate(contract.startDate)} ~`,
    },
    { label: '근무요일', value: formatWorkDays() },
    { label: '휴일', value: formatHolidays() },
    {
      label: '근무시간',
      value: `${contract.workStartTime} ~ ${contract.workEndTime}`,
    },
    { label: '휴게시간', value: `${contract.breakMinutes}분` },
    { label: '근무장소', value: contract.workLocation },
    { label: '업무내용', value: contract.jobDescription || '-' },
    { label: '급여일', value: formatPayDay() },
    // 5인 이상 사업장만 표시
    ...(contract.businessSize === 'over_5' ? [
      { label: '연차휴가', value: '근로기준법 제60조에 따라 부여' },
      { label: '가산수당', value: '연장·야간·휴일 근로 시 50% 이상 가산' },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-32">
      <PageHeader title="계약서 상세" />
      
      {/* 게스트 모드 배너 */}
      {isGuestMode && <GuestBanner />}

      <div className="flex-1 p-5">
        {/* 상태 및 기본 정보 */}
        <div className="bg-white rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[20px] font-bold text-gray-900">
                {contract.workerName}
              </h2>
              <p className="text-[14px] text-gray-500">
                {formatDate(contract.createdAt)} 작성
              </p>
            </div>
            {getStatusBadge()}
          </div>

          {/* 만료 정보 */}
          {contract.status === 'pending' && contract.expiresAt && (
            <div className="bg-amber-50 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2">
                <span>⏰</span>
                <span className="text-[14px] text-amber-700">
                  서명 마감: {formatDday(contract.expiresAt)}
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

        {/* AI 검토 결과 요약 */}
        {aiReview && (
          <div
            className={clsx(
              'rounded-2xl p-4 mb-4 flex items-center gap-3',
              aiReview.overallStatus === 'pass' && 'bg-green-50',
              aiReview.overallStatus === 'warning' && 'bg-amber-50',
              aiReview.overallStatus === 'fail' && 'bg-red-50'
            )}
          >
            <span className="text-2xl">
              {aiReview.overallStatus === 'pass' && '✅'}
              {aiReview.overallStatus === 'warning' && '⚠️'}
              {aiReview.overallStatus === 'fail' && '❌'}
            </span>
            <div>
              <p className="text-[14px] font-semibold text-gray-900">
                AI 노무사 검토 완료
              </p>
              <p className="text-[13px] text-gray-600">
                {aiReview.overallStatus === 'pass' && '모든 항목이 통과했어요'}
                {aiReview.overallStatus === 'warning' && '일부 확인이 필요해요'}
                {aiReview.overallStatus === 'fail' && '수정이 필요한 항목이 있어요'}
              </p>
            </div>
          </div>
        )}

        {/* 계약 상세 정보 */}
        <div className="bg-white rounded-2xl p-5">
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

        {/* 근로자 민감정보 (완료된 계약서에만 표시) */}
        {contract.status === 'completed' && contract.hasSensitiveInfo && (
          <div className="bg-white rounded-2xl p-5 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold text-gray-900">
                근로자 정보 (4대보험용)
              </h3>
              {isSensitiveInfoVisible && (
                <span className="text-[12px] text-amber-600 font-medium">
                  🔒 {sensitiveInfoTimer}초 후 자동 숨김
                </span>
              )}
            </div>
            
            {/* 보안 안내 */}
            <div className="bg-amber-50 rounded-xl p-3 mb-4">
              <p className="text-[12px] text-amber-700">
                ⚠️ 열람 기록이 저장됩니다. 4대보험 신고 목적으로만 사용하세요.
              </p>
            </div>
            
            <div className="space-y-3">
              {/* 주민등록번호 */}
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-[14px] text-gray-500">주민등록번호</span>
                <span className="text-[14px] font-medium text-gray-900">
                  {isSensitiveInfoVisible && sensitiveInfo?.ssn
                    ? `${sensitiveInfo.ssn.substring(0, 6)}-${sensitiveInfo.ssn.substring(6)}`
                    : '******-*******'}
                </span>
              </div>
              
              {/* 급여 계좌 */}
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-[14px] text-gray-500">급여 계좌</span>
                <span className="text-[14px] font-medium text-gray-900">
                  {isSensitiveInfoVisible && sensitiveInfo?.accountNumber
                    ? `${sensitiveInfo.bankName || contract.workerBankName} ${sensitiveInfo.accountNumber}`
                    : contract.workerBankName 
                      ? `${contract.workerBankName} ****-****-****`
                      : '미등록'}
                </span>
              </div>
            </div>
            
            {/* 보기/숨기기 버튼 */}
            <div className="mt-4">
              {isSensitiveInfoVisible ? (
                <button
                  onClick={hideSensitiveInfo}
                  className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-medium text-[14px]"
                >
                  숨기기
                </button>
              ) : (
                <button
                  onClick={handleShowSensitiveInfo}
                  disabled={isSensitiveInfoLoading}
                  className="w-full py-3 rounded-xl bg-blue-500 text-white font-medium text-[14px] flex items-center justify-center gap-2"
                >
                  {isSensitiveInfoLoading ? (
                    <>
                      <LoadingSpinner variant="button" />
                      조회 중...
                    </>
                  ) : (
                    <>
                      🔓 정보 보기 (10초간)
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 하단 액션 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pt-3 pb-4 safe-bottom">
        {/* 공유 옵션 - completed 상태에서는 PDF, 공유, 삭제만 표시 */}
        <div className={clsx(
          "flex justify-center gap-4",
          contract.status !== 'completed' && "mb-4"
        )}>
          <button
            onClick={handleDownloadPDF}
            className="flex flex-col items-center gap-1"
          >
            <span className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
              📄
            </span>
            <span className="text-[11px] text-gray-500">PDF</span>
          </button>
          <button
            onClick={handleOpenShareSheet}
            disabled={!shareUrl}
            className={clsx(
              'flex flex-col items-center gap-1',
              !shareUrl && 'opacity-50'
            )}
          >
            <span className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
              🔗
            </span>
            <span className="text-[11px] text-gray-500">공유</span>
          </button>
          {/* 재전송 버튼 - completed가 아닐 때만 표시 */}
          {contract.status !== 'completed' && (
            <button
              onClick={handleOpenShareSheet}
              disabled={!shareUrl}
              className={clsx(
                'flex flex-col items-center gap-1',
                !shareUrl && 'opacity-50'
              )}
            >
              <span className="w-10 h-10 bg-[#FEE500] rounded-full flex items-center justify-center text-lg">
                💬
              </span>
              <span className="text-[11px] text-gray-500">재전송</span>
            </button>
          )}
          <button
            onClick={() => setIsDeleteSheetOpen(true)}
            disabled={contract.status === 'deleted'}
            className={clsx(
              'flex flex-col items-center gap-1',
              contract.status === 'deleted' && 'opacity-50'
            )}
          >
            <span className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-lg">
              🗑️
            </span>
            <span className="text-[11px] text-gray-500">삭제</span>
          </button>
        </div>

        {/* 메인 버튼 - pending 상태에서만 표시 */}
        {contract.status === 'pending' && !workerSigned && (
          <Button onClick={handleOpenShareSheet} disabled={!shareUrl}>
            근로자에게 다시 보내기 📤
          </Button>
        )}
      </div>

      {/* 삭제 확인 시트 */}
      <ConfirmSheet
        isOpen={isDeleteSheetOpen}
        onClose={() => setIsDeleteSheetOpen(false)}
        title="계약서를 삭제할까요?"
        description="삭제된 계약서는 휴지통으로 이동해요. 30일 후 완전히 삭제돼요."
        confirmLabel="삭제하기"
        cancelLabel="취소"
        onConfirm={handleDelete}
        confirmVariant="error"
        isConfirmLoading={isDeleting}
      />

      {/* 공유 링크 시트 */}
      <BottomSheet
        isOpen={isShareSheetOpen}
        onClose={() => setIsShareSheetOpen(false)}
        title="근로자에게 계약서 보내기"
      >
        <div className="space-y-6">
          {/* 중요 안내 - 가장 위에 배치 */}
          <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200">
            <div className="flex gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="text-[15px] font-bold text-blue-900 mb-1">
                  아래 링크를 복사해서 근로자에게
                  <br />
                  <span className="text-blue-600">직접 카카오톡으로 보내주세요!</span>
                </p>
                <p className="text-[13px] text-blue-700 mt-2">
                  * 카카오톡 자동 공유 기능은 준비 중이에요
                </p>
              </div>
            </div>
          </div>

          {/* 링크 표시 영역 */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-[13px] text-gray-500 mb-2">서명 링크</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white rounded-xl px-4 py-3 border border-gray-200 overflow-hidden">
                <p className="text-[14px] text-gray-700 break-all">
                  {shareUrl || '링크 생성 중...'}
                </p>
              </div>
              <button
                onClick={handleCopyLink}
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
            onClick={() => setIsShareSheetOpen(false)}
            className="w-full py-4 rounded-2xl font-semibold text-lg bg-gray-100 text-gray-700"
          >
            닫기
          </button>
        </div>
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
                  workplaceName: contract.workplaceName || undefined,
                  employerName: employerName || undefined,
                  workerName: contract.workerName,
                  wageType: contract.wageType as 'hourly' | 'monthly',
                  hourlyWage: contract.hourlyWage,
                  monthlyWage: contract.monthlyWage,
                  includesWeeklyAllowance: contract.includesWeeklyAllowance,
                  payDay: contract.payDay,
                  paymentTiming: contract.paymentTiming as 'current_month' | 'next_month',
                  isLastDayPayment: contract.isLastDayPayment,
                  startDate: contract.startDate,
                  endDate: contract.endDate || undefined,
                  workDays: contract.workDays || undefined,
                  workDaysPerWeek: contract.workDaysPerWeek || undefined,
                  workStartTime: contract.workStartTime,
                  workEndTime: contract.workEndTime,
                  breakMinutes: contract.breakMinutes,
                  workLocation: contract.workLocation,
                  jobDescription: contract.jobDescription || undefined,
                  businessSize: contract.businessSize as 'under_5' | 'over_5',
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
                  createdAt: contract.createdAt,
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

      {/* 토스트 */}
      <Toast
        message={toastMessage}
        variant={toastVariant}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
