'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmSheet from '@/components/ui/ConfirmSheet';
import Toast from '@/components/ui/Toast';
import { formatCurrency, formatDate, formatDday } from '@/lib/utils/format';
import { copyContractLink } from '@/lib/utils/share';
import { shareContractViaKakao, initKakao } from '@/lib/kakao';
import { deleteContract, resendContract } from './actions';
import clsx from 'clsx';

interface Signature {
  id: string;
  signer_role: 'employer' | 'worker';
  signed_at: string | null;
  signature_data: string;
}

interface ContractData {
  id: string;
  workerName: string;
  hourlyWage: number;
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
  businessSize: 'under_5' | 'over_5';
  status: 'draft' | 'pending' | 'completed' | 'expired' | 'deleted';
  createdAt: string;
  expiresAt: string | null;
  completedAt: string | null;
  shareToken: string | null;
  signatures: Signature[];
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success');

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

  const handleResend = async () => {
    if (isGuestMode) {
      setToastMessage('게스트 모드에서는 재전송할 수 없어요');
      setToastVariant('error');
      setShowToast(true);
      return;
    }

    if (!contract.shareToken) {
      setToastMessage('공유 링크가 없어요');
      setToastVariant('error');
      setShowToast(true);
      return;
    }

    setIsResending(true);
    try {
      initKakao();
      const success = shareContractViaKakao({
        workerName: contract.workerName,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/contract/sign/${contract.shareToken}`,
        employerName,
      });

      if (success) {
        // 재전송 로그 기록
        await resendContract(contract.id);
        setToastMessage('카카오톡으로 다시 보냈어요 📤');
        setToastVariant('success');
        setShowToast(true);
      } else {
        setToastMessage('카카오톡 공유에 실패했어요');
        setToastVariant('error');
        setShowToast(true);
      }
    } catch {
      setToastMessage('재전송 중 오류가 발생했어요');
      setToastVariant('error');
      setShowToast(true);
    } finally {
      setIsResending(false);
    }
  };

  const handleCopyLink = async () => {
    if (!contract.shareToken) {
      setToastMessage('공유 링크가 없어요');
      setToastVariant('error');
      setShowToast(true);
      return;
    }

    const success = await copyContractLink(contract.shareToken);
    if (success) {
      setToastMessage('링크가 복사됐어요 📋');
      setToastVariant('success');
      setShowToast(true);
    } else {
      setToastMessage('링크 복사에 실패했어요');
      setToastVariant('error');
      setShowToast(true);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId: contract.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setToastMessage(data.error || 'PDF 생성에 실패했어요');
        setToastVariant('error');
        setShowToast(true);
        return;
      }

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

      setToastMessage('PDF가 다운로드됐어요 📄');
      setToastVariant('success');
      setShowToast(true);
    } catch {
      setToastMessage('PDF 다운로드에 실패했어요');
      setToastVariant('error');
      setShowToast(true);
    }
  };

  const contractItems = [
    { label: '근로자', value: contract.workerName },
    {
      label: '시급',
      value: `${formatCurrency(contract.hourlyWage)}${contract.includesWeeklyAllowance ? ' (주휴수당 포함)' : ''}`,
    },
    {
      label: '근무기간',
      value: contract.endDate
        ? `${formatDate(contract.startDate)} ~ ${formatDate(contract.endDate)}`
        : `${formatDate(contract.startDate)} ~`,
    },
    { label: '근무요일', value: formatWorkDays() },
    {
      label: '근무시간',
      value: `${contract.workStartTime} ~ ${contract.workEndTime}`,
    },
    { label: '휴게시간', value: `${contract.breakMinutes}분` },
    { label: '근무장소', value: contract.workLocation },
    { label: '업무내용', value: contract.jobDescription },
    { label: '급여일', value: `매월 ${contract.payDay}일` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-32">
      <PageHeader title="계약서 상세" />

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
      </div>

      {/* 하단 액션 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pt-3 pb-4 safe-bottom">
        {/* 공유 옵션 */}
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={handleDownloadPDF}
            className="flex flex-col items-center gap-1"
          >
            <span className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
              📄
            </span>
            <span className="text-[11px] text-gray-500">PDF</span>
          </button>
          <button
            onClick={handleCopyLink}
            disabled={!contract.shareToken}
            className={clsx(
              'flex flex-col items-center gap-1',
              !contract.shareToken && 'opacity-50'
            )}
          >
            <span className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
              🔗
            </span>
            <span className="text-[11px] text-gray-500">링크</span>
          </button>
          <button
            onClick={handleResend}
            disabled={!contract.shareToken || contract.status === 'completed' || isResending}
            className={clsx(
              'flex flex-col items-center gap-1',
              (!contract.shareToken || contract.status === 'completed') && 'opacity-50'
            )}
          >
            <span className="w-10 h-10 bg-[#FEE500] rounded-full flex items-center justify-center text-lg">
              💬
            </span>
            <span className="text-[11px] text-gray-500">재전송</span>
          </button>
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

        {/* 메인 버튼 */}
        {contract.status === 'pending' && !workerSigned && (
          <Button onClick={handleResend} loading={isResending}>
            근로자에게 다시 보내기 📤
          </Button>
        )}
        {contract.status === 'completed' && (
          <Button onClick={handleDownloadPDF} variant="secondary">
            계약서 다운로드 📥
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
