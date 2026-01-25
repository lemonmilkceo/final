'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import ProgressBar from '@/components/ui/ProgressBar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { saveWorkerDetails } from './actions';
import clsx from 'clsx';

const TOTAL_STEPS = 3;

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

export default function WorkerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSsnInfo, setShowSsnInfo] = useState(false);

  // Step 1: 이름
  const [name, setName] = useState('');

  // Step 2: 주민등록번호
  const [ssnFront, setSsnFront] = useState('');
  const [ssnBack, setSsnBack] = useState('');

  // Step 3: 계좌정보
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    // 건너뛰기 - 나중에 입력 가능
    router.push('/worker');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await saveWorkerDetails({
        name,
        ssn: ssnFront + ssnBack,
        bankCode,
        accountNumber,
      });

      if (result.success) {
        router.push('/worker?onboarding=complete');
      } else {
        setError(result.error || '저장에 실패했어요');
      }
    } catch {
      setError('알 수 없는 오류가 발생했어요');
    } finally {
      setIsLoading(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return name.length >= 2 && /^[가-힣]+$/.test(name);
      case 2:
        return ssnFront.length === 6 && ssnBack.length === 7;
      case 3:
        return bankCode && accountNumber.length >= 10;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-fade-in-up">
            <h1 className="text-[22px] font-bold text-gray-900 mb-2">
              이름을 알려주세요
            </h1>
            <p className="text-[15px] text-gray-500 mb-8">
              다음 계약서부터 자동으로 채워져요 ✨
            </p>

            <Input
              variant="underline"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              autoFocus
              className="text-2xl font-bold"
            />

            {name && !/^[가-힣]+$/.test(name) && (
              <p className="text-red-500 text-[13px] mt-2">
                한글로만 입력해주세요
              </p>
            )}

            {/* 안내 메시지 */}
            <div className="mt-8 bg-blue-50 rounded-2xl p-4">
              <p className="text-[14px] text-blue-700">
                💡 지금 정보를 등록하면 다음 계약할 때 다시 입력하지 않아도 돼요!
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="animate-fade-in-up">
            <h1 className="text-[22px] font-bold text-gray-900 mb-2">
              주민등록번호를 입력해주세요
            </h1>
            <p className="text-[15px] text-gray-500 mb-6">
              한 번 입력하면 다음 계약엔 안 물어봐요 🎉
            </p>

            <div className="flex items-center gap-4 mb-6">
              <Input
                variant="underline"
                value={ssnFront}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 6) setSsnFront(value);
                }}
                placeholder="앞 6자리"
                maxLength={6}
                inputMode="numeric"
                className="text-2xl font-bold text-center flex-1"
              />
              <span className="text-2xl text-gray-300">-</span>
              <Input
                variant="underline"
                type="password"
                value={ssnBack}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 7) setSsnBack(value);
                }}
                placeholder="뒤 7자리"
                maxLength={7}
                inputMode="numeric"
                className="text-2xl font-bold text-center flex-1"
              />
            </div>

            {/* 용도 안내 토글 */}
            <button
              onClick={() => setShowSsnInfo(!showSsnInfo)}
              className="flex items-center gap-2 text-[14px] text-gray-500 mb-3"
            >
              <span>{showSsnInfo ? '▼' : '▶'}</span>
              <span>이 정보는 어디에 쓰이나요?</span>
            </button>

            {showSsnInfo && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-4 animate-fade-in">
                <ul className="space-y-2 text-[14px] text-gray-600">
                  <li className="flex items-start gap-2">
                    <span>📋</span>
                    <span>근로계약서에 기재돼요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🏥</span>
                    <span>사장님이 4대보험 신고할 때 사용해요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>📊</span>
                    <span>연말정산 자료로 활용돼요</span>
                  </li>
                </ul>
              </div>
            )}

            {/* 안심 메시지 */}
            <div className="bg-amber-50 rounded-2xl p-4">
              <p className="text-[14px] text-amber-700">
                🔒 계약 당사자(사장님, 본인)만 볼 수 있어요
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="animate-fade-in-up">
            <h1 className="text-[22px] font-bold text-gray-900 mb-2">
              급여 받을 계좌를 등록해주세요
            </h1>
            <p className="text-[15px] text-gray-500 mb-6">
              다음 알바도 이 계좌로 바로 받아요 💰
            </p>

            <div className="space-y-6">
              {/* 은행 선택 */}
              <div>
                <p className="text-[13px] text-gray-500 mb-3">은행 선택</p>
                <div className="grid grid-cols-4 gap-2">
                  {BANKS.map((bank) => (
                    <button
                      key={bank.code}
                      onClick={() => setBankCode(bank.code)}
                      className={clsx(
                        'py-3 px-2 rounded-xl text-[13px] font-medium transition-colors',
                        bankCode === bank.code
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
                value={accountNumber}
                onChange={(e) =>
                  setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))
                }
                placeholder="'-' 없이 숫자만 입력"
                inputMode="numeric"
              />
            </div>

            {/* 안내 메시지 */}
            <div className="mt-6 bg-gray-50 rounded-2xl p-4">
              <p className="text-[14px] text-gray-600">
                💡 본인 명의 계좌만 등록할 수 있어요
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <PageHeader
        title={`정보 입력 ${step}/${TOTAL_STEPS}`}
        showBack={step > 1}
        onBack={handlePrev}
        rightElement={
          <button
            onClick={handleSkip}
            className="text-[15px] text-gray-400"
          >
            건너뛰기
          </button>
        }
      />

      {/* Progress */}
      <div className="px-6 pt-2">
        <ProgressBar current={step} total={TOTAL_STEPS} />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">{renderStep()}</div>

      {/* Error */}
      {error && (
        <div className="px-6 mb-4">
          <div className="bg-red-50 rounded-xl p-4 flex items-center gap-2">
            <span>⚠️</span>
            <span className="text-[14px] text-red-600">{error}</span>
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="px-6 pb-4 safe-bottom space-y-3">
        <Button
          fullWidth
          disabled={!isStepValid() || isLoading}
          loading={isLoading}
          onClick={step === TOTAL_STEPS ? handleSubmit : handleNext}
        >
          {step === TOTAL_STEPS ? '완료' : '다음'}
        </Button>
        
        {step > 1 && (
          <button
            onClick={handleSkip}
            className="w-full py-2 text-[14px] text-gray-400"
          >
            나중에 입력할게요
          </button>
        )}
      </div>
    </div>
  );
}
