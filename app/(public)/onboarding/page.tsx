'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import clsx from 'clsx';
import { ROUTES } from '@/lib/constants/routes';

interface Slide {
  id: number;
  title: string;
  description: string;
  emoji: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: '10분이면 끝나요',
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

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleSkip = () => {
    router.push(ROUTES.SIGNUP);
  };

  const handleStart = () => {
    router.push(ROUTES.SIGNUP);
  };

  const handleGuest = () => {
    router.push(ROUTES.GUEST_SELECT_ROLE);
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="relative min-h-screen bg-white flex flex-col">
      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 text-gray-400 text-[15px] z-10 safe-top"
      >
        건너뛰기
      </button>

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
          onClick={handleStart}
          className={clsx(
            'w-full py-4 rounded-2xl font-semibold text-lg transition-all',
            isLastSlide
              ? 'bg-blue-500 text-white active:bg-blue-600 animate-pulse-slow'
              : 'bg-blue-500 text-white active:bg-blue-600'
          )}
        >
          시작하기
        </button>
        <button
          onClick={handleGuest}
          className="w-full py-3 text-gray-500 text-[15px] font-medium"
        >
          먼저 둘러볼게요 →
        </button>
      </div>
    </div>
  );
}
