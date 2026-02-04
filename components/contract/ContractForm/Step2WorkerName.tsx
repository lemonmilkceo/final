'use client';

import { useState } from 'react';
import { useContractFormStore } from '@/stores/contractFormStore';
import { phoneRegex, formatPhone } from '@/lib/utils/validation';
import clsx from 'clsx';

export default function Step2WorkerName() {
  const { data, updateData, nextStep, prevStep } = useContractFormStore();
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const validateName = (name: string) => {
    if (name.length < 2) {
      return '이름은 2자 이상 입력해주세요';
    }
    if (name.length > 10) {
      return '이름은 10자 이하로 입력해주세요';
    }
    if (!/^[가-힣]+$/.test(name)) {
      return '한글로만 입력해주세요';
    }
    return '';
  };

  const validatePhone = (phone: string) => {
    if (!phone || phone.length < 10) {
      return '휴대폰 번호를 입력해주세요';
    }
    if (!phoneRegex.test(phone)) {
      return '올바른 휴대폰 번호를 입력해주세요';
    }
    return '';
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateData({ workerName: value });
    if (nameError) setNameError('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자와 하이픈만 허용
    let value = e.target.value.replace(/[^0-9-]/g, '');
    
    // 숫자만 남기고 포맷팅
    const numbersOnly = value.replace(/-/g, '');
    if (numbersOnly.length <= 11) {
      // 자동 하이픈 추가
      if (numbersOnly.length > 7) {
        value = `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7)}`;
      } else if (numbersOnly.length > 3) {
        value = `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
      } else {
        value = numbersOnly;
      }
    }
    
    updateData({ workerPhone: value });
    if (phoneError) setPhoneError('');
  };

  const handleNext = () => {
    const nameValidationError = validateName(data.workerName);
    const phoneValidationError = validatePhone(data.workerPhone);
    
    if (nameValidationError) {
      setNameError(nameValidationError);
      return;
    }
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      return;
    }
    nextStep();
  };

  const isNameValid = data.workerName.length >= 2 && /^[가-힣]+$/.test(data.workerName);
  const isPhoneValid = phoneRegex.test(data.workerPhone);
  const isValid = isNameValid && isPhoneValid;

  return (
    <>
      <div className="flex-1 px-6 pt-8">
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-8">
          근로자 정보를
          <br />
          입력해주세요
        </h1>

        {/* 이름 입력 */}
        <div className="mb-8">
          <label className="text-[14px] text-gray-500 mb-2 block">이름</label>
          <input
            type="text"
            value={data.workerName}
            onChange={handleNameChange}
            placeholder="이름을 입력하세요"
            autoFocus
            className={clsx(
              'w-full border-0 border-b-2 bg-transparent text-[24px] font-bold text-gray-900 placeholder-gray-300 focus:outline-none py-2 transition-colors',
              nameError ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
            )}
          />
          {nameError && (
            <p className="text-[13px] text-red-500 mt-2 flex items-center gap-1">
              <span>⚠️</span>
              {nameError}
            </p>
          )}
        </div>

        {/* 휴대폰 번호 입력 */}
        <div className="mb-6">
          <label className="text-[14px] text-gray-500 mb-2 block flex items-center gap-1">
            휴대폰 번호
            <span className="text-blue-500 text-[12px]">(알림톡 발송용)</span>
          </label>
          <input
            type="tel"
            value={data.workerPhone}
            onChange={handlePhoneChange}
            placeholder="010-0000-0000"
            inputMode="tel"
            className={clsx(
              'w-full border-0 border-b-2 bg-transparent text-[24px] font-bold text-gray-900 placeholder-gray-300 focus:outline-none py-2 transition-colors',
              phoneError ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
            )}
          />
          {phoneError && (
            <p className="text-[13px] text-red-500 mt-2 flex items-center gap-1">
              <span>⚠️</span>
              {phoneError}
            </p>
          )}
        </div>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">📱</span>
            <div>
              <p className="text-[14px] font-medium text-blue-800">
                이 번호로 카카오 알림톡이 전송돼요
              </p>
              <p className="text-[13px] text-blue-600 mt-1">
                정확한 번호를 입력해야 근로자가 계약서를 받을 수 있어요
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-4 safe-bottom flex gap-3">
        <button
          onClick={prevStep}
          className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-lg"
        >
          이전
        </button>
        <button
          onClick={handleNext}
          disabled={!isValid}
          className={clsx(
            'flex-1 py-4 rounded-2xl font-semibold text-lg transition-colors',
            isValid
              ? 'bg-blue-500 text-white active:bg-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          다음
        </button>
      </div>
    </>
  );
}
