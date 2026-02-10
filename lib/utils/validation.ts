import { z } from 'zod';

// 최저시급 (2026년 기준)
export const MINIMUM_WAGE_2026 = 10360;

// 사업장 규모 enum
export const businessSizeSchema = z.enum(['under_5', 'over_5']);

// 계약 형태 enum
export const contractTypeSchema = z.enum(['regular', 'contract']);

// 급여 유형 enum
export const wageTypeSchema = z.enum(['hourly', 'monthly']);

// 급여 지급 시점 enum
export const paymentTimingSchema = z.enum(['current_month', 'next_month']);

// 업종 enum
export const businessTypeSchema = z.enum([
  'restaurant',
  'cafe',
  'convenience_store',
  'retail',
  'beauty',
  'office',
  'pc_cafe',
  'startup',
]).nullable();

// 휴대폰 번호 정규식 (010-1234-5678 또는 01012345678)
export const phoneRegex = /^01[016789]-?\d{3,4}-?\d{4}$/;

// 휴대폰 번호 정규화 (하이픈 제거)
export function normalizePhone(phone: string): string {
  return phone.replace(/-/g, '');
}

// 휴대폰 번호 포맷팅 (010-1234-5678)
export function formatPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length === 11) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7)}`;
  }
  if (normalized.length === 10) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
  }
  return phone;
}

// 계약서 폼 스키마
export const contractFormSchema = z.object({
  // Step 1: 사업장
  workplaceId: z.string().nullable(),
  workplaceName: z.string().min(1, '사업장명을 입력해주세요'),
  workLocation: z.string().min(1, '근무 장소를 입력해주세요'),
  // Step 2: 계약 형태
  contractType: contractTypeSchema,
  // Step 3: 사업장 규모
  businessSize: businessSizeSchema,
  // Step 4: 근로자 정보
  workerName: z
    .string()
    .min(2, '이름은 2자 이상 입력해주세요')
    .max(10, '이름은 10자 이하로 입력해주세요')
    .regex(/^[가-힣]+$/, '한글로만 입력해주세요'),
  workerPhone: z
    .string()
    .min(10, '휴대폰 번호를 입력해주세요')
    .regex(phoneRegex, '올바른 휴대폰 번호를 입력해주세요'),
  // Step 4: 급여
  wageType: wageTypeSchema,
  hourlyWage: z.number().nullable(),
  monthlyWage: z.number().nullable(),
  includesWeeklyAllowance: z.boolean(),
  // Step 5: 근무기간
  startDate: z.string().min(1, '시작일을 선택해주세요'),
  endDate: z.string().nullable(),
  hasNoEndDate: z.boolean(),
  // Step 6: 근무요일
  workDays: z.array(z.string()),
  workDaysPerWeek: z.number().nullable(),
  useWorkDaysPerWeek: z.boolean(),
  // Step 7: 근무시간
  workStartTime: z.string().min(1, '시작 시간을 선택해주세요'),
  workEndTime: z.string().min(1, '종료 시간을 선택해주세요'),
  // Step 8: 휴게시간
  breakMinutes: z.number().min(0, '휴게시간은 0분 이상이어야 해요'),
  // Step 9: 업무 + 급여일
  businessType: businessTypeSchema,
  jobDescription: z.string(),
  specialTerms: z.string().optional(), // 특약사항
  payDay: z.number().min(0).max(31, '1~31일 사이로 입력해주세요'),
  paymentTiming: paymentTimingSchema,
  isLastDayPayment: z.boolean(),
}).refine(
  (data) => {
    if (data.wageType === 'hourly') {
      return data.hourlyWage !== null && data.hourlyWage >= MINIMUM_WAGE_2026;
    }
    return data.monthlyWage !== null && data.monthlyWage > 0;
  },
  {
    message: `시급 선택 시 최저시급(${MINIMUM_WAGE_2026}원) 이상, 월급 선택 시 금액을 입력해주세요`,
    path: ['hourlyWage'],
  }
);

// 계약서 생성 스키마 (DB 저장용)
export const createContractSchema = z.object({
  workplace_id: z.string().nullable(),
  workplace_name: z.string().nullable(),
  contract_type: contractTypeSchema,
  worker_name: z
    .string()
    .min(2)
    .max(10)
    .regex(/^[가-힣]+$/),
  worker_phone: z.string().min(10).regex(phoneRegex),
  wage_type: wageTypeSchema,
  hourly_wage: z.number().nullable(),
  monthly_wage: z.number().nullable(),
  includes_weekly_allowance: z.boolean(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  work_days: z.array(z.string()).nullable(),
  work_days_per_week: z.number().nullable(),
  work_start_time: z.string(),
  work_end_time: z.string(),
  break_minutes: z.number().min(0),
  work_location: z.string().min(1),
  job_description: z.string(),
  special_terms: z.string().nullable(), // 특약사항
  pay_day: z.number().min(0).max(31),
  payment_timing: paymentTimingSchema,
  is_last_day_payment: z.boolean(),
  business_size: businessSizeSchema,
});

export type ContractFormInput = z.infer<typeof contractFormSchema>;
export type CreateContractInput = z.infer<typeof createContractSchema>;

// 폼 데이터를 DB 스키마로 변환
export function transformFormToDbSchema(formData: ContractFormInput): CreateContractInput {
  return {
    workplace_id: formData.workplaceId,
    workplace_name: formData.workplaceName || null,
    contract_type: formData.contractType,
    worker_name: formData.workerName,
    worker_phone: normalizePhone(formData.workerPhone),
    wage_type: formData.wageType,
    hourly_wage: formData.wageType === 'hourly' ? formData.hourlyWage : null,
    monthly_wage: formData.wageType === 'monthly' ? formData.monthlyWage : null,
    includes_weekly_allowance: formData.includesWeeklyAllowance,
    start_date: formData.startDate,
    end_date: formData.hasNoEndDate ? null : formData.endDate,
    work_days: formData.useWorkDaysPerWeek ? null : formData.workDays,
    work_days_per_week: formData.useWorkDaysPerWeek ? formData.workDaysPerWeek : null,
    work_start_time: formData.workStartTime,
    work_end_time: formData.workEndTime,
    break_minutes: formData.breakMinutes,
    work_location: formData.workLocation,
    job_description: formData.jobDescription || '',
    special_terms: formData.specialTerms || null,
    pay_day: formData.isLastDayPayment ? 31 : formData.payDay,
    payment_timing: formData.paymentTiming,
    is_last_day_payment: formData.isLastDayPayment,
    business_size: formData.businessSize,
  };
}
