'use client';

import { useRouter } from 'next/navigation';
import { useGuestStore } from '@/stores/guestStore';

interface SignupPromptSheetProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export default function SignupPromptSheet({
  isOpen,
  onClose,
}: SignupPromptSheetProps) {
  const router = useRouter();
  const { clearGuestMode } = useGuestStore();

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
            <h2 className="text-[22px] font-bold text-gray-900 mb-4">
              회원가입이 필요해요
            </h2>
            <p className="text-[15px] text-gray-500 mb-6 leading-relaxed">
              계약서를 생성하려면 회원가입이 필요합니다.
              <br />
              가입 후 <span className="font-bold text-gray-900">무료 3회</span> 계약서 생성이 가능해요!
            </p>

            <div className="space-y-3">
              {/* 회원가입 버튼 */}
              <button
                onClick={handleSignup}
                className="w-full py-4 bg-blue-500 text-white rounded-full font-semibold text-[16px] hover:bg-blue-600 transition-colors"
              >
                회원가입하기
              </button>

              {/* 로그인 버튼 */}
              <button
                onClick={handleLogin}
                className="w-full py-4 bg-white border-2 border-blue-500 text-blue-500 rounded-full font-semibold text-[16px] hover:bg-blue-50 transition-colors"
              >
                이미 계정이 있어요
              </button>
            </div>

            {/* 계속 둘러보기 */}
            <button
              onClick={onClose}
              className="mt-4 py-2 text-gray-400 text-[15px] font-medium"
            >
              계속 둘러보기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
