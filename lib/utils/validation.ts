import { z } from 'zod';

// 최저시급 (2026년 기준)
export const MINIMUM_WAGE_2026 = 10360;

// 사업장 규모 enum
export const businessSizeSchema = z.enum(['under_5', 'over_5']);

// 계약서 폼 스키마
export const contractFormSchema = z.object({
  businessSize: businessSizeSchema,
  workerName: z
    .string()
    .min(2, '이름은 2자 이상 입력해주세요')
    .max(10, '이름은 10자 이하로 입력해주세요')
    .regex(/^[가-힣]+$/, '한글로만 입력해주세요'),
  hourlyWage: z
    .number()
    .min(MINIMUM_WAGE_2026, `최저시급(${MINIMUM_WAGE_2026}원) 이상이어야 해요`),
  includesWeeklyAllowance: z.boolean(),
  startDate: z.string().min(1, '시작일을 선택해주세요'),
  endDate: z.string().nullable(),
  hasNoEndDate: z.boolean(),
  workDays: z.array(z.string()),
  workDaysPerWeek: z.number().nullable(),
  useWorkDaysPerWeek: z.boolean(),
  workStartTime: z.string().min(1, '시작 시간을 선택해주세요'),
  workEndTime: z.string().min(1, '종료 시간을 선택해주세요'),
  breakMinutes: z.number().min(0, '휴게시간은 0분 이상이어야 해요'),
  workLocation: z.string().min(1, '근무 장소를 입력해주세요'),
  jobDescription: z.string().min(1, '업무 내용을 입력해주세요'),
  payDay: z.number().min(1).max(31, '1~31일 사이로 입력해주세요'),
});

// 계약서 생성 스키마 (DB 저장용)
export const createContractSchema = z.object({
  worker_name: z
    .string()
    .min(2)
    .max(10)
    .regex(/^[가-힣]+$/),
  hourly_wage: z.number().min(MINIMUM_WAGE_2026),
  includes_weekly_allowance: z.boolean(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  work_days: z.array(z.string()).nullable(),
  work_days_per_week: z.number().nullable(),
  work_start_time: z.string(),
  work_end_time: z.string(),
  break_minutes: z.number().min(0),
  work_location: z.string().min(1),
  job_description: z.string().min(1),
  pay_day: z.number().min(1).max(31),
  business_size: businessSizeSchema,
});

export type ContractFormInput = z.infer<typeof contractFormSchema>;
export type CreateContractInput = z.infer<typeof createContractSchema>;

// 폼 데이터를 DB 스키마로 변환
export function transformFormToDbSchema(formData: ContractFormInput): CreateContractInput {
  return {
    worker_name: formData.workerName,
    hourly_wage: formData.hourlyWage,
    includes_weekly_allowance: formData.includesWeeklyAllowance,
    start_date: formData.startDate,
    end_date: formData.hasNoEndDate ? null : formData.endDate,
    work_days: formData.useWorkDaysPerWeek ? null : formData.workDays,
    work_days_per_week: formData.useWorkDaysPerWeek ? formData.workDaysPerWeek : null,
    work_start_time: formData.workStartTime,
    work_end_time: formData.workEndTime,
    break_minutes: formData.breakMinutes,
    work_location: formData.workLocation,
    job_description: formData.jobDescription,
    pay_day: formData.payDay,
    business_size: formData.businessSize,
  };
}
