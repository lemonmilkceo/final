'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/shared/EmptyState';
import Toast from '@/components/ui/Toast';
import SignupPromptSheet from '@/components/shared/SignupPromptSheet';
import { formatCurrency, formatDate } from '@/lib/utils/format';

interface CareerContract {
  id: string;
  worker_name: string;
  wage_type?: string;
  hourly_wage: number | null;
  monthly_wage?: number | null;
  start_date: string;
  end_date: string | null;
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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error' | 'info'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignupSheet, setShowSignupSheet] = useState(false);

  const showToastMessage = (message: string, variant: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };

  const handleExportClick = async () => {
    // 게스트 모드: 회원가입 유도
    if (isGuestMode) {
      setShowSignupSheet(true);
      return;
    }

    // 실제 PDF 다운로드 로직
    setIsLoading(true);
    try {
      const response = await fetch('/api/pdf/career-certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '경력증명서 생성에 실패했어요');
      }

      // Base64 → Blob → 다운로드
      const binaryString = atob(data.pdf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      
      // 다운로드 링크 생성 및 클릭
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename || '경력증명서.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToastMessage('경력증명서가 다운로드되었어요', 'success');
    } catch (error) {
      console.error('경력증명서 다운로드 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '경력증명서 생성에 실패했어요';
      showToastMessage(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPeriod = (startDate: string, endDate: string | null) => {
    const start = formatDate(startDate);
    const end = endDate ? formatDate(endDate) : '현재';
    return `${start} ~ ${end}`;
  };

  const calculateDuration = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff < 30) {
      return `${diff}일`;
    }
    const months = Math.floor(diff / 30);
    const days = diff % 30;
    if (days === 0) {
      return `${months}개월`;
    }
    return `${months}개월 ${days}일`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header showNotification={false} showMenu={false} />

      <div className="px-5 pt-4 pb-24">
        {/* Title */}
        <h1 className="text-[22px] font-bold text-gray-900 mb-4">내 경력</h1>

        {/* Guest Mode Banner */}
        {isGuestMode && (
          <div className="bg-blue-50 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-xl">💡</span>
            <p className="text-[14px] text-blue-700">
              샘플 데이터입니다. 로그인하면 실제 경력을 확인할 수 있어요.
            </p>
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
            {contracts.map((contract) => (
              <Card
                key={contract.id}
                variant="default"
                className="border border-gray-100"
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
                      <p className="text-[13px] text-blue-500 font-medium whitespace-nowrap flex-shrink-0">
                        {calculateDuration(
                          contract.start_date,
                          contract.end_date
                        )}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[12px] text-gray-400">
                      <span>
                        {formatPeriod(contract.start_date, contract.end_date)}
                      </span>
                      <span>•</span>
                      <span>
                        {contract.wage_type === 'monthly' && contract.monthly_wage
                          ? `월 ${formatCurrency(contract.monthly_wage)}`
                          : contract.hourly_wage
                            ? `시급 ${formatCurrency(contract.hourly_wage)}`
                            : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
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
            disabled={isLoading}
            className={`w-full mt-6 py-4 rounded-2xl border-2 font-medium text-[15px] flex items-center justify-center gap-2 transition-colors ${
              isLoading 
                ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed' 
                : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                생성 중...
              </>
            ) : (
              <>
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
                경력증명서 발급
              </>
            )}
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
    </div>
  );
}
