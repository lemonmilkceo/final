'use client';

import { useRouter } from 'next/navigation';
import { useGuestStore } from '@/stores/guestStore';

interface SignupPromptSheetProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: 'create' | 'sign' | 'pdf' | 'default';
}

// 기능별 메시지 정의
const FEATURE_MESSAGES = {
  create: {
    title: '회원가입이 필요해요',
    description: '계약서를 생성하려면 회원가입이 필요합니다.',
    benefits: ['무료 5건 계약서 생성', 'AI 노무사 무제한 검토', '계약서 클라우드 보관'],
  },
  sign: {
    title: '서명하려면 로그인이 필요해요',
    description: '로그인하면 이런 혜택이 있어요',
    benefits: ['내 경력 자동 관리', '계약서 PDF 다운로드', '다음 계약 정보 자동 입력'],
  },
  pdf: {
    title: 'PDF 다운로드는 회원 전용이에요',
    description: '로그인하면 계약서를 PDF로 저장할 수 있어요',
    benefits: ['계약서 PDF 다운로드', '경력증명서 발급', '모든 계약서 보관'],
  },
  default: {
    title: '회원가입이 필요해요',
    description: '이 기능을 이용하려면 로그인이 필요합니다.',
    benefits: ['무료 5건 계약서 생성', 'AI 노무사 무제한 검토', '계약서 클라우드 보관'],
  },
};

export default function SignupPromptSheet({
  isOpen,
  onClose,
  feature = 'default',
}: SignupPromptSheetProps) {
  const router = useRouter();
  const { clearGuestMode } = useGuestStore();

  const message = FEATURE_MESSAGES[feature] || FEATURE_MESSAGES.default;

  const handleSignup = () => {
    clearGuestMode();
    onClose();
    router.push('/login');
  };

  const handleLogin = () => {
    clearGuestMode();
    onClose();
    router.push('/login');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 오버레이 */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* 모달 */}
        <div 
          className="bg-white rounded-3xl w-full max-w-sm p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 콘텐츠 */}
          <div className="text-center pt-4">
            <span className="text-4xl block mb-3">✨</span>
            <h2 className="text-[22px] font-bold text-gray-900 mb-2">
              {message.title}
            </h2>
            <p className="text-[15px] text-gray-500 mb-4">
              {message.description}
            </p>

            {/* 혜택 목록 */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
              {message.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 mb-2 last:mb-0">
                  <span className="text-green-500">✓</span>
                  <span className="text-[14px] text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {/* 카카오 로그인 버튼 */}
              <button
                onClick={handleSignup}
                className="w-full py-4 bg-[#FEE500] text-[#191919] rounded-full font-semibold text-[16px] hover:bg-[#FFEB3B] transition-colors flex items-center justify-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.48 3 2 6.68 2 11.18c0 2.86 1.88 5.37 4.72 6.82-.18.66-.66 2.4-.76 2.78-.12.48.18.47.38.34.15-.1 2.44-1.66 3.43-2.33.72.1 1.46.15 2.23.15 5.52 0 10-3.68 10-8.18S17.52 3 12 3z"/>
                </svg>
                카카오로 3초만에 시작하기
              </button>

              {/* 이미 계정이 있어요 */}
              <button
                onClick={handleLogin}
                className="w-full py-4 bg-white border-2 border-gray-200 text-gray-600 rounded-full font-semibold text-[16px] hover:bg-gray-50 transition-colors"
              >
                이미 계정이 있어요
              </button>
            </div>

            {/* 계속 둘러보기 */}
            <button
              onClick={onClose}
              className="mt-4 py-2 text-gray-400 text-[15px] font-medium"
            >
              나중에 할게요
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
