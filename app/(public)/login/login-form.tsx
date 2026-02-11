'use client';

import { Button, KakaoIcon, AppleIcon } from '@/components/ui/Button';
import { signInWithKakao, signInWithApple } from './actions';
import { useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleKakaoLogin = () => {
    startTransition(async () => {
      await signInWithKakao();
    });
  };

  const handleAppleLogin = () => {
    startTransition(async () => {
      await signInWithApple();
    });
  };

  const handleGuest = () => {
    router.push(ROUTES.GUEST_SELECT_ROLE);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col px-6">
      {/* Header with Back Button */}
      <div className="h-14 flex items-center safe-top">
        <Link
          href="/"
          className="w-10 h-10 flex items-center justify-center -ml-2"
        >
          <svg
            className="w-6 h-6 text-gray-900"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
      </div>

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
      <div className="pb-8 safe-bottom">
        {/* Social Login Buttons */}
        <div className="space-y-2">
          {/* Kakao Button */}
          <Button
            variant="kakao"
            size="compact"
            onClick={handleKakaoLogin}
            disabled={isPending}
          >
            <KakaoIcon />
            카카오로 시작하기
          </Button>

          {/* Apple Button */}
          <Button
            variant="apple"
            size="compact"
            onClick={handleAppleLogin}
            disabled={isPending}
          >
            <AppleIcon />
            Apple로 시작하기
          </Button>
        </div>

        {/* Guest Button (Text Style) */}
        <button
          onClick={handleGuest}
          disabled={isPending}
          className="w-full py-3 mt-3 text-[15px] text-gray-500 font-medium active:text-gray-700 transition-colors"
        >
          먼저 둘러볼게요
        </button>

        {/* Terms Notice */}
        <p className="text-[12px] text-gray-400 text-center leading-relaxed mt-2">
          시작하면{' '}
          <Link href="/terms" className="underline">
            이용약관
          </Link>{' '}
          및{' '}
          <Link href="/privacy" className="underline">
            개인정보 처리방침
          </Link>
          에 동의하는 것으로 봐요
        </p>

        {/* 사업자 정보 */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="text-[11px] text-gray-400 text-center space-y-0.5">
            <p className="font-medium text-gray-500">레몬밀크AI</p>
            <p>대표: 이현승 | 사업자등록번호: 499-24-02238</p>
            <p>서울특별시 강남구 역삼로 512, 5층-772</p>
            <p>전화: 010-5375-0414</p>
          </div>
        </div>
      </div>
    </div>
  );
}
