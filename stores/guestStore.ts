import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type GuestRole = 'employer' | 'worker' | null;

interface GuestState {
  isGuest: boolean;
  guestRole: GuestRole;
  aiReviewUsed: boolean;
  
  // Actions
  setGuestMode: (role: GuestRole) => void;
  clearGuestMode: () => void;
  useAIReview: () => void;
}

// 쿠키 기반 스토리지 (미들웨어에서 접근 가능)
const cookieStorage = {
  getItem: (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  },
  setItem: (name: string, value: string): void => {
    if (typeof document === 'undefined') return;
    // 7일 유효기간
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
  },
  removeItem: (name: string): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  },
};

export const useGuestStore = create<GuestState>()(
  persist(
    (set) => ({
      isGuest: false,
      guestRole: null,
      aiReviewUsed: false,

      setGuestMode: (role) =>
        set({
          isGuest: true,
          guestRole: role,
          aiReviewUsed: false,
        }),

      clearGuestMode: () =>
        set({
          isGuest: false,
          guestRole: null,
          aiReviewUsed: false,
        }),

      useAIReview: () =>
        set({
          aiReviewUsed: true,
        }),
    }),
    {
      name: 'guest-storage',
      storage: createJSONStorage(() => cookieStorage),
    }
  )
);
