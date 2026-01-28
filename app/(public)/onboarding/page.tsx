'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { ROUTES } from '@/lib/constants/routes';
import { signInWithKakao } from '@/app/(public)/login/actions';

interface Slide {
  id: number;
  title: string;
  description: string;
  emoji: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: '1분이면 끝나요',
    description: '어려운 법률 용어 없이\n질문에 답하기만 하면\n계약서가 완성돼요',
    emoji: '📝',
  },
  {
    id: 2,
    title: 'AI가 검토해줘요',
    description: '작성한 계약서를\nAI 노무사가 검토하고\n문제가 있으면 알려줘요',
    emoji: '🤖',
  },
  {
    id: 3,
    title: '안전하게 보관돼요',
    description: '서명한 계약서는\n클라우드에 영구 보관\n언제든 꺼내볼 수 있어요',
    emoji: '☁️',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPending, startTransition] = useTransition();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleKakaoLogin = () => {
    startTransition(async () => {
      await signInWithKakao();
    });
  };

  const handleGuest = () => {
    router.push(ROUTES.GUEST_SELECT_ROLE);
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="relative min-h-screen bg-white flex flex-col">
      {/* Slide Content */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6"
        onClick={handleNext}
      >
        {/* Illustration (Emoji placeholder) */}
        <div className="w-60 h-60 mb-10 flex items-center justify-center bg-gray-50 rounded-full animate-fade-in">
          <span className="text-8xl">{slide.emoji}</span>
        </div>

        {/* Title */}
        <h1
          key={`title-${slide.id}`}
          className="text-[26px] font-bold text-gray-900 text-center mb-3 animate-fade-in-up"
        >
          {slide.title}
        </h1>

        {/* Description */}
        <p
          key={`desc-${slide.id}`}
          className="text-[17px] text-gray-500 text-center leading-relaxed whitespace-pre-line animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          {slide.description}
        </p>

        {/* Indicator */}
        <div className="flex gap-2 mt-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(index);
              }}
              className={clsx(
                'w-2 h-2 rounded-full transition-colors',
                currentSlide === index ? 'bg-blue-500' : 'bg-gray-200'
              )}
              aria-label={`슬라이드 ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Actions (Fixed) */}
      <div className="px-6 pb-4 safe-bottom space-y-3">
        <button
          onClick={handleKakaoLogin}
          disabled={isPending}
          className={clsx(
            'w-full py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-2',
            isLastSlide
              ? 'bg-[#FEE500] text-[#191919] active:bg-[#F5DC00] animate-pulse-slow'
              : 'bg-[#FEE500] text-[#191919] active:bg-[#F5DC00]',
            isPending && 'opacity-70'
          )}
        >
          {isPending ? (
            <span>로그인 중...</span>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.84 5.18 4.6 6.54-.2.74-.74 2.68-.84 3.1-.12.52.2.52.42.38.18-.12 2.76-1.88 3.88-2.64.62.08 1.26.14 1.94.14 5.52 0 10-3.48 10-7.52S17.52 3 12 3z"/>
              </svg>
              카카오로 시작하기
            </>
          )}
        </button>
        <button
          onClick={handleGuest}
          disabled={isPending}
          className="w-full py-4 rounded-2xl font-semibold text-lg bg-gray-100 text-gray-600 active:bg-gray-200 transition-all"
        >
          먼저 둘러볼게요
        </button>
        
        {/* 약관 동의 안내 */}
        <p className="text-[12px] text-gray-400 text-center leading-relaxed">
          시작하면{' '}
          <Link href="/terms" className="underline">이용약관</Link> 및{' '}
          <Link href="/privacy" className="underline">개인정보 처리방침</Link>에 동의하는 것으로 봐요
        </p>
      </div>
    </div>
  );
}
