import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BusinessSize } from '@/types';

export type WageType = 'hourly' | 'monthly';
export type PaymentTiming = 'current_month' | 'next_month';
export type ContractType = 'regular' | 'contract';

export type BusinessType =
  | 'restaurant'
  | 'cafe'
  | 'convenience_store'
  | 'retail'
  | 'beauty'
  | 'office'
  | 'pc_cafe'
  | 'startup'
  | null;

export interface ContractFormData {
  // Step 1: 사업장 선택
  workplaceId: string | null;
  workplaceName: string;
  workLocation: string;
  // Step 2: 계약 형태
  contractType: ContractType;
  // Step 3: 사업장 규모
  businessSize: BusinessSize | null;
  // Step 4: 근로자 정보
  workerName: string;
  workerPhone: string;
  // Step 5: 급여
  wageType: WageType;
  hourlyWage: number | null;
  monthlyWage: number | null;
  includesWeeklyAllowance: boolean;
  // Step 6: 근무기간
  startDate: string;
  endDate: string | null;
  hasNoEndDate: boolean;
  // Step 7: 근무요일
  workDays: string[];
  workDaysPerWeek: number | null;
  useWorkDaysPerWeek: boolean;
  // Step 8: 근무시간
  workStartTime: string;
  workEndTime: string;
  // Step 9: 휴게시간
  breakMinutes: number;
  // Step 10: 업무 내용 + 급여일
  businessType: BusinessType;
  jobDescription: string;
  payDay: number;
  paymentTiming: PaymentTiming;
  isLastDayPayment: boolean;
}

interface ContractFormStore {
  step: number;
  data: ContractFormData;
  editingContractId: string | null; // 수정 중인 계약서 ID
  isEditMode: boolean;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (updates: Partial<ContractFormData>) => void;
  loadContractData: (
    contractId: string,
    contractData: Partial<ContractFormData>
  ) => void;
  reset: () => void;
}

const TOTAL_STEPS = 10;

const initialData: ContractFormData = {
  // Step 1: 사업장
  workplaceId: null,
  workplaceName: '',
  workLocation: '',
  // Step 2: 계약 형태
  contractType: 'contract', // 기본값: 계약직
  // Step 3: 사업장 규모
  businessSize: null,
  // Step 4: 근로자 정보
  workerName: '',
  workerPhone: '',
  // Step 5: 급여
  wageType: 'hourly',
  hourlyWage: null,
  monthlyWage: null,
  includesWeeklyAllowance: false,
  // Step 6: 근무기간
  startDate: '',
  endDate: null,
  hasNoEndDate: false,
  // Step 7: 근무요일
  workDays: [],
  workDaysPerWeek: null,
  useWorkDaysPerWeek: false,
  // Step 8: 근무시간
  workStartTime: '09:00',
  workEndTime: '18:00',
  // Step 9: 휴게시간
  breakMinutes: 30,
  // Step 10: 업무 내용 + 급여일
  businessType: null,
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
      editingContractId: null,
      isEditMode: false,
      setStep: (step) =>
        set({ step: Math.min(Math.max(step, 1), TOTAL_STEPS) }),
      nextStep: () =>
        set((state) => ({ step: Math.min(state.step + 1, TOTAL_STEPS) })),
      prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),
      updateData: (updates) =>
        set((state) => ({ data: { ...state.data, ...updates } })),
      loadContractData: (contractId, contractData) =>
        set({
          step: 1,
          editingContractId: contractId,
          isEditMode: true,
          data: { ...initialData, ...contractData },
        }),
      reset: () =>
        set({
          step: 1,
          data: initialData,
          editingContractId: null,
          isEditMode: false,
        }),
    }),
    {
      name: 'contract-form-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const TOTAL_FORM_STEPS = TOTAL_STEPS;
