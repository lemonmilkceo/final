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
        router.push('/worker');
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
            <h1 className="text-title text-gray-900 mb-2">
              이름을 알려주세요
            </h1>
            <p className="text-body text-gray-500 mb-8">
              계약서에 사용될 이름이에요
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
              <p className="text-error text-caption mt-2">
                한글로만 입력해주세요
              </p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="animate-fade-in-up">
            <h1 className="text-title text-gray-900 mb-2">
              주민등록번호를 입력해주세요
            </h1>
            <p className="text-body text-gray-500 mb-8">
              4대보험 신고를 위해 필요해요
              <br />
              <span className="text-caption">
                암호화되어 안전하게 보관돼요 🔒
              </span>
            </p>

            <div className="flex items-center gap-4">
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
          </div>
        );

      case 3:
        return (
          <div className="animate-fade-in-up">
            <h1 className="text-title text-gray-900 mb-2">
              급여 받을 계좌를 입력해주세요
            </h1>
            <p className="text-body text-gray-500 mb-8">
              본인 명의 계좌만 등록할 수 있어요
            </p>

            <div className="space-y-6">
              {/* 은행 선택 */}
              <div>
                <p className="text-caption text-gray-500 mb-3">은행 선택</p>
                <div className="grid grid-cols-4 gap-2">
                  {BANKS.map((bank) => (
                    <button
                      key={bank.code}
                      onClick={() => setBankCode(bank.code)}
                      className={clsx(
                        'py-3 px-2 rounded-xl text-[13px] font-medium transition-colors',
                        bankCode === bank.code
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700'
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
      <div className="px-6 pb-4 safe-bottom">
        <Button
          fullWidth
          disabled={!isStepValid() || isLoading}
          loading={isLoading}
          onClick={step === TOTAL_STEPS ? handleSubmit : handleNext}
        >
          {step === TOTAL_STEPS ? '완료' : '다음'}
        </Button>
      </div>
    </div>
  );
}
