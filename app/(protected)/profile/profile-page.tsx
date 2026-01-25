'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { updateProfile, updateWorkerDetails } from './actions';
import clsx from 'clsx';

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

interface ProfilePageProps {
  profile: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: 'employer' | 'worker' | null;
    avatar_url: string | null;
    created_at: string;
  };
  workerDetails?: {
    hasSsn: boolean;
    bankName: string | null;
    hasAccount: boolean;
  } | null;
}

export default function ProfilePage({ profile, workerDetails }: ProfilePageProps) {
  const router = useRouter();
  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // 근로자 정보 상태 (수정 모드)
  const [isEditingWorkerDetails, setIsEditingWorkerDetails] = useState(false);
  const [ssnFront, setSsnFront] = useState('');
  const [ssnBack, setSsnBack] = useState('');
  const [bankCode, setBankCode] = useState(
    workerDetails?.bankName ? 
      BANKS.find(b => b.name === workerDetails.bankName)?.code || '' : ''
  );
  const [accountNumber, setAccountNumber] = useState('');
  const [workerDetailsLoading, setWorkerDetailsLoading] = useState(false);
  const [workerDetailsError, setWorkerDetailsError] = useState<string | null>(null);
  const [workerDetailsSuccess, setWorkerDetailsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const result = await updateProfile({ name, phone });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || '저장에 실패했습니다.');
    }

    setIsLoading(false);
  };

  const handleWorkerDetailsSubmit = async () => {
    const fullSsn = ssnFront + ssnBack;
    
    // 유효성 검사
    if (fullSsn.length !== 13) {
      setWorkerDetailsError('주민등록번호를 정확히 입력해주세요');
      return;
    }
    if (!bankCode) {
      setWorkerDetailsError('은행을 선택해주세요');
      return;
    }
    if (accountNumber.length < 10) {
      setWorkerDetailsError('계좌번호를 정확히 입력해주세요');
      return;
    }

    setWorkerDetailsLoading(true);
    setWorkerDetailsError(null);
    setWorkerDetailsSuccess(false);

    const bankName = BANKS.find(b => b.code === bankCode)?.name || bankCode;
    const result = await updateWorkerDetails({
      ssn: fullSsn,
      bankName,
      accountNumber,
    });

    if (result.success) {
      setWorkerDetailsSuccess(true);
      setIsEditingWorkerDetails(false);
      setTimeout(() => setWorkerDetailsSuccess(false), 3000);
      router.refresh();
    } else {
      setWorkerDetailsError(result.error || '저장에 실패했습니다.');
    }

    setWorkerDetailsLoading(false);
  };

  const roleLabel = profile.role === 'employer' ? '사업자' : '근로자';
  const roleBgColor = profile.role === 'employer' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';

  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="프로필 설정" onBack={() => router.back()} />

      <div className="px-5 pt-6 pb-10">
        {/* 프로필 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          {/* 아바타 */}
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-4xl">😊</span>
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">{profile.name || '사용자'}님</h2>
            <span className={`inline-block mt-1 text-[12px] font-medium px-2.5 py-0.5 rounded-full ${roleBgColor}`}>
              {roleLabel}
            </span>
          </div>
        </div>

        {/* 프로필 정보 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 이름 */}
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-2">
              이름
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          {/* 이메일 (읽기 전용) */}
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-2">
              이메일
            </label>
            <Input
              type="email"
              value={profile.email || '이메일 없음'}
              disabled
              className="bg-gray-50 text-gray-500"
            />
            <p className="mt-1 text-[12px] text-gray-400">카카오 계정에서 가져온 정보입니다</p>
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-2">
              전화번호
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-[14px] rounded-xl">
              {error}
            </div>
          )}

          {/* 성공 메시지 */}
          {success && (
            <div className="p-3 bg-green-50 text-green-600 text-[14px] rounded-xl">
              프로필이 저장되었습니다.
            </div>
          )}

          {/* 저장 버튼 */}
          <div className="pt-4">
            <Button type="submit" disabled={isLoading} loading={isLoading}>
              저장하기
            </Button>
          </div>
        </form>

        {/* 근로자 정보 섹션 (근로자인 경우에만) */}
        {profile.role === 'worker' && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-gray-900">계약 정보</h3>
              {!isEditingWorkerDetails && (
                <button
                  onClick={() => setIsEditingWorkerDetails(true)}
                  className="text-[14px] text-blue-500 font-medium"
                >
                  {workerDetails?.hasSsn ? '수정' : '등록하기'}
                </button>
              )}
            </div>

            {isEditingWorkerDetails ? (
              <div className="space-y-6">
                {/* 주민등록번호 */}
                <div>
                  <label className="block text-[14px] font-medium text-gray-700 mb-2">
                    주민등록번호
                  </label>
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
                      className="flex-1 text-center text-[16px] font-medium py-3 border rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-xl text-gray-300">-</span>
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
                      className="flex-1 text-center text-[16px] font-medium py-3 border rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 은행 선택 */}
                <div>
                  <label className="block text-[14px] font-medium text-gray-700 mb-2">
                    급여 계좌
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {BANKS.map((bank) => (
                      <button
                        key={bank.code}
                        type="button"
                        onClick={() => setBankCode(bank.code)}
                        className={clsx(
                          'py-2.5 px-2 rounded-xl text-[12px] font-medium transition-colors',
                          bankCode === bank.code
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                        )}
                      >
                        {bank.name}
                      </button>
                    ))}
                  </div>
                  <Input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="계좌번호 ('-' 없이 입력)"
                    inputMode="numeric"
                  />
                </div>

                {/* 에러/성공 메시지 */}
                {workerDetailsError && (
                  <div className="p-3 bg-red-50 text-red-600 text-[14px] rounded-xl">
                    {workerDetailsError}
                  </div>
                )}

                {/* 버튼들 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditingWorkerDetails(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium"
                  >
                    취소
                  </button>
                  <Button
                    onClick={handleWorkerDetailsSubmit}
                    disabled={workerDetailsLoading}
                    loading={workerDetailsLoading}
                    className="flex-1"
                  >
                    저장
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-[14px] text-gray-500">주민등록번호</span>
                  <span className="text-[14px] text-gray-900">
                    {workerDetails?.hasSsn ? '등록됨 ✓' : '미등록'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[14px] text-gray-500">급여 계좌</span>
                  <span className="text-[14px] text-gray-900">
                    {workerDetails?.hasAccount && workerDetails?.bankName 
                      ? `${workerDetails.bankName} ✓` 
                      : '미등록'}
                  </span>
                </div>
                
                {workerDetailsSuccess && (
                  <div className="p-3 bg-green-50 text-green-600 text-[14px] rounded-xl">
                    정보가 저장되었습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 가입일 정보 */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-[13px] text-gray-400">
            가입일: {new Date(profile.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
