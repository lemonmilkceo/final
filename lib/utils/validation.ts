import { z } from 'zod';

/**
 * 계약서 작성 폼 유효성 검사 스키마
 */
export const contractFormSchema = z.object({
  businessSize: z.enum(['under_5', 'over_5'], {
    required_error: '사업장 규모를 선택해주세요',
  }),
  workerName: z
    .string()
    .min(2, '이름은 2자 이상 입력해주세요')
    .max(10, '이름은 10자 이하로 입력해주세요')
    .regex(/^[가-힣]+$/, '한글로만 입력해주세요'),
  hourlyWage: z
    .number()
    .min(10030, '최저시급(10,030원) 이상으로 입력해주세요')
    .max(1000000, '시급이 너무 높아요'),
  includesWeeklyAllowance: z.boolean(),
  startDate: z.string().min(1, '시작일을 선택해주세요'),
  endDate: z.string().nullable(),
  hasNoEndDate: z.boolean(),
  workDays: z.array(z.string()).optional(),
  workDaysPerWeek: z.number().min(1).max(7).nullable(),
  useWorkDaysPerWeek: z.boolean(),
  workStartTime: z.string().min(1, '시작 시간을 선택해주세요'),
  workEndTime: z.string().min(1, '종료 시간을 선택해주세요'),
  breakMinutes: z.number().min(0, '휴게시간은 0분 이상이어야 해요'),
  workLocation: z.string().min(1, '근무 장소를 입력해주세요'),
  jobDescription: z.string().min(1, '업무 내용을 입력해주세요'),
  payDay: z.number().min(1).max(31, '급여일은 1-31 사이로 입력해주세요'),
}).refine(
  (data) => {
    // 종료일이 없으면 hasNoEndDate가 true여야 함
    if (!data.endDate && !data.hasNoEndDate) {
      return false;
    }
    return true;
  },
  { message: '종료일을 선택하거나 "종료일 없음"을 체크해주세요', path: ['endDate'] }
).refine(
  (data) => {
    // 근무일 또는 주 N일 중 하나는 선택해야 함
    if (data.useWorkDaysPerWeek) {
      return data.workDaysPerWeek !== null && data.workDaysPerWeek > 0;
    }
    return data.workDays && data.workDays.length > 0;
  },
  { message: '근무 요일을 선택해주세요', path: ['workDays'] }
);

export type ContractFormInput = z.infer<typeof contractFormSchema>;

/**
 * 근로자 온보딩 데이터 유효성 검사 스키마
 */
export const workerOnboardingSchema = z.object({
  ssn: z
    .string()
    .length(13, '주민등록번호 13자리를 입력해주세요')
    .regex(/^[0-9]+$/, '숫자만 입력해주세요'),
  bankName: z.string().min(1, '은행을 선택해주세요'),
  accountNumber: z
    .string()
    .min(10, '계좌번호를 확인해주세요')
    .max(20, '계좌번호를 확인해주세요')
    .regex(/^[0-9-]+$/, '숫자와 하이픈만 입력해주세요'),
});

export type WorkerOnboardingInput = z.infer<typeof workerOnboardingSchema>;
