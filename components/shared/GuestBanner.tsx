'use client';

import { useGuestStore } from '@/stores/guestStore';
import { signInWithKakao } from '@/app/(public)/login/actions';

export default function GuestBanner() {
  const { isGuest, clearGuestMode } = useGuestStore();

  if (!isGuest) return null;

  const handleSignup = async () => {
    clearGuestMode();
    await signInWithKakao();
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-lg">🎁</span>
        <span className="text-[14px] font-medium">
          지금 가입하면 무료 5건!
        </span>
      </div>
      <button
        onClick={handleSignup}
        className="bg-white text-blue-500 text-[13px] font-semibold px-3 py-1.5 rounded-full"
      >
        무료로 시작
      </button>
    </div>
  );
}
