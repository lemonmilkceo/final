import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BusinessSize } from '@/types';

export type WageType = 'hourly' | 'monthly';
export type PaymentTiming = 'current_month' | 'next_month';

export interface ContractFormData {
  businessSize: BusinessSize | null;
  workerName: string;
  wageType: WageType;
  hourlyWage: number | null;
  monthlyWage: number | null;
  includesWeeklyAllowance: boolean;
  startDate: string;
  endDate: string | null;
  hasNoEndDate: boolean;
  workDays: string[];
  workDaysPerWeek: number | null;
  useWorkDaysPerWeek: boolean;
  workStartTime: string;
  workEndTime: string;
  breakMinutes: number;
  workLocation: string;
  jobDescription: string;
  payDay: number;
  paymentTiming: PaymentTiming;
  isLastDayPayment: boolean;
}

interface ContractFormStore {
  step: number;
  data: ContractFormData;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (updates: Partial<ContractFormData>) => void;
  reset: () => void;
}

const TOTAL_STEPS = 10;

const initialData: ContractFormData = {
  businessSize: null,
  workerName: '',
  wageType: 'hourly',
  hourlyWage: null,
  monthlyWage: null,
  includesWeeklyAllowance: false,
  startDate: '',
  endDate: null,
  hasNoEndDate: false,
  workDays: [],
  workDaysPerWeek: null,
  useWorkDaysPerWeek: false,
  workStartTime: '09:00',
  workEndTime: '18:00',
  breakMinutes: 30,
  workLocation: '',
  jobDescription: '',
  payDay: 10,
  paymentTiming: 'current_month',
  isLastDayPayment: false,
};

export const useContractFormStore = create<ContractFormStore>()(
  persist(
    (set) => ({
      step: 1,
      data: initialData,
      setStep: (step) => set({ step: Math.min(Math.max(step, 1), TOTAL_STEPS) }),
      nextStep: () =>
        set((state) => ({ step: Math.min(state.step + 1, TOTAL_STEPS) })),
      prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),
      updateData: (updates) =>
        set((state) => ({ data: { ...state.data, ...updates } })),
      reset: () => set({ step: 1, data: initialData }),
    }),
    {
      name: 'contract-form-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export const TOTAL_FORM_STEPS = TOTAL_STEPS;
