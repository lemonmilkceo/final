import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    }
  )
);
