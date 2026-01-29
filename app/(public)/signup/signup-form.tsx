'use client';

import { Button, KakaoIcon } from '@/components/ui/Button';
import { signInWithKakao } from '../login/actions';
import { useTransition } from 'react';
import Image from 'next/image';

export function SignupForm() {
  const [isPending, startTransition] = useTransition();

  const handleKakaoLogin = () => {
    startTransition(async () => {
      await signInWithKakao();
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col px-6">
      {/* Header Spacer */}
      <div className="h-14 safe-top" />

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Logo */}
        <div className="w-20 h-20 mb-4 flex items-center justify-center">
          <Image
            src="/images/logo.png"
            alt="싸인해주세요 로고"
            width={80}
            height={80}
          />
        </div>

        {/* Title */}
        <h1 className="text-[22px] font-bold text-gray-900 mb-2">
          싸인해주세요
        </h1>

        {/* Subtitle */}
        <p className="text-[15px] text-gray-500 text-center">
          계약서 작성부터 서명까지
          <br />한 곳에서 간편하게
        </p>
      </div>

      {/* Bottom Actions */}
      <div className="pb-8 safe-bottom space-y-4">
        {/* Kakao Button */}
        <Button variant="kakao" onClick={handleKakaoLogin} loading={isPending}>
          <KakaoIcon />
          카카오로 시작하기
        </Button>

        {/* Terms Notice */}
        <p className="text-[13px] text-gray-400 text-center leading-relaxed">
          시작하면{' '}
          <span className="underline cursor-pointer">이용약관</span> 및{' '}
          <span className="underline cursor-pointer">개인정보 처리방침</span>에
          <br />
          동의하는 것으로 봐요
        </p>
      </div>
    </div>
  );
}
