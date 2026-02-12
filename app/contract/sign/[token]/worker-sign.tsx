'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from '@/components/contract/SignatureCanvas';
import BottomSheet from '@/components/ui/BottomSheet';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Toast from '@/components/ui/Toast';
import Input from '@/components/ui/Input';
import { signAsWorker, signInForWorkerSign } from './actions';
import { formatCurrency } from '@/lib/utils/format';
import { normalizePhone } from '@/lib/utils/validation';
import clsx from 'clsx';

// 서명 플로우 단계
// verify_phone → view_contract → login → input_details → sign → completed
type SignStep = 'verify_phone' | 'view_contract' | 'login' | 'input_details' | 'sign' | 'completed';

// 은행 목록
const BANKS = [
  { code: 'kb', name: 'KB국민' },
  { code: 'shinhan', name: '신한' },
  { code: 'woori', name: '우리' },
  { code: 'hana', name: '하나' },
  { code: 'nh', name: 'NH농협' },
  { code: 'ibk', name: 'IBK기업' },
  { code: 'kakao', name: '카카오뱅크' },
  { code: 'toss', name: '토스뱅크' },
  { code: 'sc', name: 'SC제일' },
  { code: 'citi', name: '씨티' },
];

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
  contract_type?: 'regular' | 'contract';
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

// 근로자 상세정보 타입
interface WorkerDetails {
  ssn: string; // 주민등록번호 (앞6 + 뒤7)
  bankCode: string;
  accountNumber: string;
}

interface WorkerSignPageProps {
  contract: WorkerSignContract;
  token: string;
  isLoggedIn: boolean;
  existingWorkerDetails?: {
    hasSsn: boolean;
    bankName: string | null;
    hasAccount: boolean;
  } | null;
}

export default function WorkerSignPage({
  contract,
  token,
  isLoggedIn,
  existingWorkerDetails,
}: WorkerSignPageProps) {
  const router = useRouter();
  
  // 기존 정보가 있는지 확인
  const hasExistingDetails = existingWorkerDetails?.hasSsn && existingWorkerDetails?.hasAccount;
  
  // 초기 단계 결정
  // 1. 휴대폰 번호가 있으면 번호 인증부터
  // 2. 없으면 계약서 보기
  // 3. 로그인된 상태에서 접근하면 정보 입력 또는 서명
  const getInitialStep = (): SignStep => {
    if (isLoggedIn) {
      // 로그인된 상태면 기존 정보 여부에 따라 분기
      if (hasExistingDetails) {
        return 'sign'; // 이미 정보가 있으면 바로 서명
      }
      return 'input_details'; // 정보 입력 필요
    }
    if (contract.worker_phone) {
      return 'verify_phone';
    }
    return 'view_contract';
  };
  
  const [currentStep, setCurrentStep] = useState<SignStep>(getInitialStep());
  
  // OAuth 콜백 후 로그인 상태 변경 시 단계 재계산
  useEffect(() => {
    if (isLoggedIn) {
      // 로그인 완료 → 적절한 단계로 이동
      if (hasExistingDetails) {
        setCurrentStep('sign');
      } else if (currentStep === 'view_contract' || currentStep === 'verify_phone') {
        // 계약서 보기/번호 확인 단계였다면 정보 입력으로
        setCurrentStep('input_details');
      }
    }
  }, [isLoggedIn, hasExistingDetails, currentStep]);
  
  // 휴대폰 인증 상태
  const [inputPhone, setInputPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(!contract.worker_phone);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // 근로자 정보 입력 상태
  const [workerDetails, setWorkerDetails] = useState<WorkerDetails>({
    ssn: '',
    bankCode: existingWorkerDetails?.bankName ? 
      BANKS.find(b => b.name === existingWorkerDetails.bankName)?.code || '' : '',
    accountNumber: '',
  });
  const [ssnFront, setSsnFront] = useState('');
  const [ssnBack, setSsnBack] = useState('');
  const [detailsError, setDetailsError] = useState('');
  
  const [isSignatureSheetOpen, setIsSignatureSheetOpen] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedContractId, setCompletedContractId] = useState<string | null>(null);

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

  // 카카오 로그인 처리
  const handleKakaoLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInForWorkerSign(token);
    } catch {
      setError('로그인 중 오류가 발생했어요');
      setIsLoggingIn(false);
    }
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

  // 정보 입력 유효성 검사
  const isDetailsValid = () => {
    const fullSsn = ssnFront + ssnBack;
    return (
      fullSsn.length === 13 &&
      workerDetails.bankCode &&
      workerDetails.accountNumber.length >= 10
    );
  };

  // 정보 입력 후 서명 단계로 이동
  const handleDetailsSubmit = () => {
    if (!isDetailsValid()) {
      setDetailsError('모든 정보를 입력해주세요');
      return;
    }
    setWorkerDetails(prev => ({
      ...prev,
      ssn: ssnFront + ssnBack,
    }));
    setCurrentStep('sign');
  };

  const handleSignatureComplete = async () => {
    if (!signatureData) {
      setError('서명을 해주세요');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 기존 정보가 있으면 빈 값으로, 없으면 입력한 값 전달
      const detailsToSave = hasExistingDetails ? undefined : {
        ssn: ssnFront + ssnBack,
        bankCode: workerDetails.bankCode,
        bankName: BANKS.find(b => b.code === workerDetails.bankCode)?.name || workerDetails.bankCode,
        accountNumber: workerDetails.accountNumber,
      };
      
      const result = await signAsWorker(token, signatureData, detailsToSave);

      if (result.success) {
        setIsSignatureSheetOpen(false);
        setToastMessage('서명이 완료됐어요! 🎉');
        setShowToast(true);
        setIsCompleted(true);
        // 완료된 계약서 ID 저장 (상세 페이지 이동용)
        if (result.data?.contractId) {
          setCompletedContractId(result.data.contractId);
        }
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

  // 계약 형태 표시 텍스트
  const formatContractType = () => {
    return contract.contract_type === 'regular' 
      ? '정규직 (4대보험)' 
      : '계약직 (3.3%)';
  };

  const contractItems = [
    { label: '사업장', value: (contract as { workplace_name?: string }).workplace_name || '-' },
    { label: '계약형태', value: formatContractType() },
    { label: '근로자', value: contract.worker_name },
    { label: '급여', value: formatWage() },
    {
      label: '근무기간',
      value: contract.end_date
        ? `${contract.start_date} ~ ${contract.end_date}`
        : `${contract.start_date} ~`,
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
    { label: '급여일', value: formatPayDay() },
  ];

  // 서명 완료 화면
  if (isCompleted || workerSigned) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <span className="text-6xl mb-4 animate-bounce">🎉</span>
        <h1 className="text-[22px] font-bold text-gray-900 mb-2">
          계약 완료!
        </h1>
        <p className="text-[15px] text-gray-500 mb-6">
          {contract.employer?.name || '사장님'}과의 계약이 체결됐어요
        </p>
        
        {/* 완료 안내 */}
        <div className="bg-green-50 rounded-2xl p-4 mb-8 w-full max-w-xs text-left">
          <p className="text-[14px] text-green-700 font-medium mb-2">
            ✅ 자동으로 저장된 정보
          </p>
          <ul className="text-[13px] text-green-600 space-y-1">
            <li>• 계약서 원본 안전 보관</li>
            <li>• 내 경력에 자동 등록</li>
            <li>• 언제든 PDF 다운로드 가능</li>
          </ul>
        </div>

        {/* CTA 버튼 */}
        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => router.push(completedContractId ? `/worker/contract/${completedContractId}` : '/worker')}
            className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg text-center"
          >
            계약서 확인하기 📄
          </button>
          <button
            onClick={() => router.push('/worker')}
            className="w-full py-3 rounded-2xl bg-gray-100 text-gray-600 font-medium text-[15px]"
          >
            내 계약서 보관함으로
          </button>
        </div>
        
        {/* 안내 문구 */}
        <p className="text-[12px] text-gray-400 mt-6">
          다음 알바도 싸인플리즈로 간편하게 계약하세요
        </p>
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

  // 정보 입력 화면 (로그인 후)
  if (currentStep === 'input_details') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <header className="px-5 py-4 border-b border-gray-100 safe-top">
          <h1 className="text-[18px] font-bold text-gray-900 text-center">
            정보 입력
          </h1>
          <p className="text-[13px] text-gray-500 text-center mt-1">
            계약서에 기재될 정보예요
          </p>
        </header>

        {/* Content */}
        <div className="flex-1 px-6 py-6 pb-32 overflow-y-auto">
          {/* 주민등록번호 */}
          <div className="mb-8">
            <h2 className="text-[16px] font-bold text-gray-900 mb-2">
              주민등록번호
            </h2>
            <p className="text-[13px] text-gray-500 mb-4">
              4대보험 신고 및 계약서 기재용이에요
            </p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={ssnFront}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 6) setSsnFront(value);
                }}
                placeholder="앞 6자리"
                maxLength={6}
                inputMode="numeric"
                className="flex-1 text-center text-[18px] font-bold py-3 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
              />
              <span className="text-2xl text-gray-300">-</span>
              <input
                type="password"
                value={ssnBack}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 7) setSsnBack(value);
                }}
                placeholder="뒤 7자리"
                maxLength={7}
                inputMode="numeric"
                className="flex-1 text-center text-[18px] font-bold py-3 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* 계좌 정보 */}
          <div className="mb-8">
            <h2 className="text-[16px] font-bold text-gray-900 mb-2">
              급여 계좌
            </h2>
            <p className="text-[13px] text-gray-500 mb-4">
              급여를 받을 계좌 정보예요
            </p>
            
            {/* 은행 선택 */}
            <div className="mb-4">
              <p className="text-[13px] text-gray-500 mb-2">은행 선택</p>
              <div className="grid grid-cols-4 gap-2">
                {BANKS.map((bank) => (
                  <button
                    key={bank.code}
                    type="button"
                    onClick={() => setWorkerDetails(prev => ({ ...prev, bankCode: bank.code }))}
                    className={clsx(
                      'py-2.5 px-2 rounded-xl text-[12px] font-medium transition-colors',
                      workerDetails.bankCode === bank.code
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                    )}
                  >
                    {bank.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 계좌번호 */}
            <Input
              variant="box"
              label="계좌번호"
              value={workerDetails.accountNumber}
              onChange={(e) => setWorkerDetails(prev => ({ 
                ...prev, 
                accountNumber: e.target.value.replace(/[^0-9]/g, '') 
              }))}
              placeholder="'-' 없이 숫자만 입력"
              inputMode="numeric"
            />
          </div>

          {/* 안내 메시지 */}
          <div className="bg-amber-50 rounded-2xl p-4">
            <p className="text-[14px] text-amber-700">
              🔒 입력하신 정보는 암호화되어 안전하게 보관되며, 계약 당사자만 열람할 수 있어요
            </p>
          </div>

          {/* 에러 메시지 */}
          {detailsError && (
            <div className="mt-4 bg-red-50 rounded-xl p-4 flex items-center gap-2">
              <span>⚠️</span>
              <span className="text-[14px] text-red-600">{detailsError}</span>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pt-3 pb-4 safe-bottom">
          <button
            onClick={handleDetailsSubmit}
            disabled={!isDetailsValid()}
            className={clsx(
              'w-full py-4 rounded-2xl font-semibold text-lg transition-colors',
              isDetailsValid()
                ? 'bg-blue-500 text-white active:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            다음으로
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

            {/* Worker Signature - 로그인된 경우에만 서명 가능 */}
            <div>
              <p className="text-[14px] text-gray-500 mb-3">근로자 서명</p>
              {currentStep === 'sign' ? (
                <button
                  onClick={() => setIsSignatureSheetOpen(true)}
                  className="w-full h-20 border-2 border-dashed border-blue-400 rounded-xl flex items-center justify-center text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  터치하여 서명하기 ✍️
                </button>
              ) : (
                <div className="w-full h-20 border-2 border-gray-200 rounded-xl flex items-center justify-center bg-gray-50">
                  <span className="text-gray-400">카카오 로그인 후 서명 가능</span>
                </div>
              )}
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

      {/* Bottom CTA - 로그인 상태에 따라 다른 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pt-3 pb-4 safe-bottom">
        {currentStep === 'sign' ? (
          <button
            onClick={() => setIsSignatureSheetOpen(true)}
            className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg"
          >
            서명하고 계약하기 ✍️
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleKakaoLogin}
              disabled={isLoggingIn}
              className="w-full py-4 rounded-2xl bg-[#FEE500] text-[#191919] font-semibold text-lg flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <LoadingSpinner variant="button" />
                  잠시만요...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10 2C5.02944 2 1 5.25562 1 9.28571C1 11.8571 2.67188 14.1143 5.19531 15.4286L4.35156 18.5714C4.28516 18.8286 4.57422 19.0286 4.80078 18.8857L8.5 16.4571C9 16.5143 9.5 16.5714 10 16.5714C14.9706 16.5714 19 13.3158 19 9.28571C19 5.25562 14.9706 2 10 2Z"
                      fill="currentColor"
                    />
                  </svg>
                  카카오로 시작하고 서명하기
                </>
              )}
            </button>
            <p className="text-[12px] text-gray-400 text-center">
              3초면 회원가입 완료! 계약서가 안전하게 보관돼요
            </p>
          </div>
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
    </div>
  );
}
