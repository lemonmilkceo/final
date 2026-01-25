'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from '@/components/contract/SignatureCanvas';
import BottomSheet from '@/components/ui/BottomSheet';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Toast from '@/components/ui/Toast';
import { signAsWorker } from './actions';
import { formatCurrency } from '@/lib/utils/format';
import { normalizePhone, formatPhone } from '@/lib/utils/validation';
import clsx from 'clsx';

// 서명 플로우 단계
type SignStep = 'verify_phone' | 'view_contract' | 'sign' | 'completed';

// 근로자 서명 페이지에서 사용하는 타입
interface WorkerSignContract {
  worker_name: string;
  worker_phone?: string | null;
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
  signatures?: {
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

interface WorkerSignPageProps {
  contract: WorkerSignContract;
  token: string;
}

export default function WorkerSignPage({
  contract,
  token,
}: WorkerSignPageProps) {
  const router = useRouter();
  
  // 휴대폰 번호가 없으면 바로 계약서 보기로
  const initialStep: SignStep = contract.worker_phone ? 'verify_phone' : 'view_contract';
  const [currentStep, setCurrentStep] = useState<SignStep>(initialStep);
  
  // 휴대폰 인증 상태
  const [inputPhone, setInputPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(!contract.worker_phone);
  
  const [isSignatureSheetOpen, setIsSignatureSheetOpen] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  // 근로자가 이미 서명했는지 확인
  const workerSigned = contract.signatures?.some(
    (s) => s.signer_role === 'worker' && s.signed_at
  );
  
  // 휴대폰 번호 입력 처리
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9-]/g, '');
    const numbersOnly = value.replace(/-/g, '');
    
    if (numbersOnly.length <= 11) {
      if (numbersOnly.length > 7) {
        value = `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7)}`;
      } else if (numbersOnly.length > 3) {
        value = `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
      } else {
        value = numbersOnly;
      }
    }
    
    setInputPhone(value);
    if (phoneError) setPhoneError('');
  };
  
  // 휴대폰 번호 확인
  const handleVerifyPhone = () => {
    const inputNormalized = normalizePhone(inputPhone);
    const contractNormalized = normalizePhone(contract.worker_phone || '');
    
    if (inputNormalized.length < 10) {
      setPhoneError('휴대폰 번호를 입력해주세요');
      return;
    }
    
    if (inputNormalized !== contractNormalized) {
      setPhoneError('계약서에 등록된 번호와 일치하지 않아요');
      return;
    }
    
    // 번호 일치 - 계약서 보기로 이동
    setPhoneVerified(true);
    setCurrentStep('view_contract');
  };
  
  // 마스킹된 휴대폰 번호 (010-****-5678)
  const getMaskedPhone = () => {
    const phone = contract.worker_phone || '';
    const normalized = normalizePhone(phone);
    if (normalized.length >= 11) {
      return `${normalized.slice(0, 3)}-****-${normalized.slice(7)}`;
    }
    return '***-****-****';
  };

  const formatWorkDays = () => {
    if (contract.work_days_per_week) {
      return `주 ${contract.work_days_per_week}일`;
    }
    if (contract.work_days && contract.work_days.length > 0) {
      return contract.work_days.join(', ');
    }
    return '-';
  };

  const handleSignatureComplete = async () => {
    if (!signatureData) {
      setError('서명을 해주세요');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await signAsWorker(token, signatureData);

      if (result.success) {
        setIsSignatureSheetOpen(false);
        setToastMessage('서명이 완료됐어요! 🎉');
        setShowToast(true);
        setIsCompleted(true);
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

  const contractItems = [
    { label: '근로자', value: contract.worker_name },
    { label: '급여', value: formatWage() },
    {
      label: '근무기간',
      value: contract.end_date
        ? `${contract.start_date} ~ ${contract.end_date}`
        : `${contract.start_date} ~`,
    },
    { label: '근무요일', value: formatWorkDays() },
    {
      label: '근무시간',
      value: `${contract.work_start_time} ~ ${contract.work_end_time}`,
    },
    { label: '휴게시간', value: `${contract.break_minutes}분` },
    { label: '근무장소', value: contract.work_location },
    { label: '업무내용', value: contract.job_description },
    { label: '급여일', value: formatPayDay() },
  ];

  // 서명 완료 화면
  if (isCompleted || workerSigned) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <span className="text-6xl mb-4 animate-bounce">🎉</span>
        <h1 className="text-[22px] font-bold text-gray-900 mb-2">
          계약이 완료됐어요!
        </h1>
        <p className="text-[15px] text-gray-500 mb-4">
          이 계약서가 첫 경력으로 저장돼요
        </p>
        
        {/* 혜택 안내 */}
        <div className="bg-blue-50 rounded-2xl p-4 mb-8 w-full max-w-xs text-left">
          <p className="text-[14px] text-blue-700 font-medium mb-2">
            ✨ 회원가입하면 이런 혜택이 있어요
          </p>
          <ul className="text-[13px] text-blue-600 space-y-1">
            <li>• 내 경력 자동 관리</li>
            <li>• 계약서 PDF 다운로드</li>
            <li>• 다음 계약 정보 자동 입력</li>
          </ul>
        </div>

        <a
          href="/signup"
          className="w-full max-w-xs py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg text-center block mb-3"
        >
          3초만에 가입하기
        </a>
        <button
          onClick={() => router.push('/')}
          className="text-[14px] text-gray-400"
        >
          나중에 할게요
        </button>
      </div>
    );
  }
  
  // 휴대폰 번호 확인 화면
  if (currentStep === 'verify_phone') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <header className="px-5 py-4 safe-top">
          <p className="text-[13px] text-gray-500 text-center">
            {contract.employer?.name || '사장님'}이 보낸 계약서
          </p>
        </header>
        
        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <span className="text-5xl mb-6">📱</span>
          <h1 className="text-[22px] font-bold text-gray-900 mb-2 text-center">
            본인 확인이 필요해요
          </h1>
          <p className="text-[15px] text-gray-500 mb-8 text-center">
            계약서에 등록된 휴대폰 번호를 입력해주세요
          </p>
          
          {/* 마스킹된 번호 힌트 */}
          <div className="bg-gray-100 rounded-2xl px-6 py-3 mb-6">
            <p className="text-[14px] text-gray-500">
              등록된 번호: <span className="font-mono">{getMaskedPhone()}</span>
            </p>
          </div>
          
          {/* 휴대폰 번호 입력 */}
          <input
            type="tel"
            value={inputPhone}
            onChange={handlePhoneChange}
            placeholder="010-0000-0000"
            inputMode="tel"
            autoFocus
            className={clsx(
              'w-full max-w-xs text-center text-[24px] font-bold border-b-2 bg-transparent py-3 focus:outline-none transition-colors',
              phoneError ? 'border-red-500 text-red-500' : 'border-gray-200 focus:border-blue-500 text-gray-900'
            )}
          />
          
          {phoneError && (
            <p className="text-[13px] text-red-500 mt-3 flex items-center gap-1">
              <span>⚠️</span>
              {phoneError}
            </p>
          )}
        </div>
        
        {/* Bottom CTA */}
        <div className="px-6 pb-4 safe-bottom">
          <button
            onClick={handleVerifyPhone}
            disabled={inputPhone.length < 10}
            className={clsx(
              'w-full py-4 rounded-2xl font-semibold text-lg transition-colors',
              inputPhone.length >= 10
                ? 'bg-blue-500 text-white active:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white px-5 py-4 border-b border-gray-100 safe-top">
        <h1 className="text-[18px] font-bold text-gray-900 text-center">
          근로계약서
        </h1>
        <p className="text-[13px] text-gray-500 text-center mt-1">
          {contract.employer?.name || '사장님'}이 보낸 계약서예요
        </p>
      </header>

      {/* Contract Content */}
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

          {/* Signatures */}
          <div className="mt-8 space-y-4">
            {/* Employer Signature */}
            <div>
              <p className="text-[14px] text-gray-500 mb-3">사업자 서명</p>
              {contract.signatures?.find((s) => s.signer_role === 'employer')
                ?.signed_at ? (
                <div className="w-full h-20 border-2 border-green-500 rounded-xl flex items-center justify-center bg-green-50">
                  <span className="text-green-600 font-medium">✅ 서명 완료</span>
                </div>
              ) : (
                <div className="w-full h-20 border-2 border-gray-200 rounded-xl flex items-center justify-center bg-gray-50">
                  <span className="text-gray-400">서명 대기중</span>
                </div>
              )}
            </div>

            {/* Worker Signature */}
            <div>
              <p className="text-[14px] text-gray-500 mb-3">근로자 서명</p>
              <button
                onClick={() => setIsSignatureSheetOpen(true)}
                className="w-full h-20 border-2 border-dashed border-blue-400 rounded-xl flex items-center justify-center text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                터치하여 서명하기 ✍️
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 rounded-xl p-4 flex items-center gap-2">
            <span>⚠️</span>
            <span className="text-[14px] text-red-600">{error}</span>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pt-3 pb-4 safe-bottom">
        <button
          onClick={() => setIsSignatureSheetOpen(true)}
          className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg"
        >
          서명하고 계약하기 ✍️
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
    </div>
  );
}
