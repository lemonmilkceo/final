'use client';

import { useRouter } from 'next/navigation';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import { useGuestStore } from '@/stores/guestStore';

interface SignupPromptSheetProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export default function SignupPromptSheet({
  isOpen,
  onClose,
  feature = '이 기능',
}: SignupPromptSheetProps) {
  const router = useRouter();
  const { clearGuestMode } = useGuestStore();

  const handleSignup = () => {
    clearGuestMode();
    onClose();
    router.push('/login');
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="text-center py-4">
        <span className="text-5xl mb-4 block">🔒</span>
        <h2 className="text-[20px] font-bold text-gray-900 mb-2">
          회원가입이 필요해요
        </h2>
        <p className="text-[15px] text-gray-500 mb-6">
          {feature}을 사용하려면
          <br />
          간편하게 로그인해주세요
        </p>

        <div className="space-y-3">
          <Button onClick={handleSignup}>
            카카오로 3초 만에 시작하기
          </Button>
          <button
            onClick={onClose}
            className="w-full py-3 text-gray-500 text-[15px] font-medium"
          >
            나중에 할게요
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
