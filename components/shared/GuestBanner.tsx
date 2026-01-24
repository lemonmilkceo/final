'use client';

import { useRouter } from 'next/navigation';
import { useGuestStore } from '@/stores/guestStore';

export default function GuestBanner() {
  const router = useRouter();
  const { isGuest, clearGuestMode } = useGuestStore();

  if (!isGuest) return null;

  const handleSignup = () => {
    clearGuestMode();
    router.push('/login');
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-lg">👀</span>
        <span className="text-[14px] font-medium">
          둘러보기 중이에요
        </span>
      </div>
      <button
        onClick={handleSignup}
        className="bg-white text-blue-500 text-[13px] font-semibold px-3 py-1.5 rounded-full"
      >
        가입하기
      </button>
    </div>
  );
}
