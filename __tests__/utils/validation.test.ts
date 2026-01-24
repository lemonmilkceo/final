import { describe, it, expect } from 'vitest';
import {
  contractFormSchema,
  MINIMUM_WAGE_2026,
  transformFormToDbSchema,
  type ContractFormInput,
} from '@/lib/utils/validation';

describe('MINIMUM_WAGE_2026', () => {
  it('2026년 최저시급이 올바르게 설정되어야 한다', () => {
    expect(MINIMUM_WAGE_2026).toBe(10360);
  });
});

describe('contractFormSchema', () => {
  const validFormData: ContractFormInput = {
    businessSize: 'under_5',
    workerName: '홍길동',
    hourlyWage: 10360,
    includesWeeklyAllowance: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    hasNoEndDate: false,
    workDays: ['월', '화', '수', '목', '금'],
    workDaysPerWeek: null,
    useWorkDaysPerWeek: false,
    workStartTime: '09:00',
    workEndTime: '18:00',
    breakMinutes: 60,
    workLocation: '서울시 강남구',
    jobDescription: '서빙',
    payDay: 10,
  };

  it('유효한 데이터는 통과해야 한다', () => {
    const result = contractFormSchema.safeParse(validFormData);
    expect(result.success).toBe(true);
  });

  describe('workerName 검증', () => {
    it('2자 미만이면 실패해야 한다', () => {
      const result = contractFormSchema.safeParse({
        ...validFormData,
        workerName: '김',
      });
      expect(result.success).toBe(false);
    });

    it('10자 초과면 실패해야 한다', () => {
      const result = contractFormSchema.safeParse({
        ...validFormData,
        workerName: '김길동길동길동길동길동',
      });
      expect(result.success).toBe(false);
    });

    it('한글이 아니면 실패해야 한다', () => {
      const result = contractFormSchema.safeParse({
        ...validFormData,
        workerName: 'John',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('hourlyWage 검증', () => {
    it('최저시급 미만이면 실패해야 한다', () => {
      const result = contractFormSchema.safeParse({
        ...validFormData,
        hourlyWage: 9000,
      });
      expect(result.success).toBe(false);
    });

    it('최저시급과 같으면 통과해야 한다', () => {
      const result = contractFormSchema.safeParse({
        ...validFormData,
        hourlyWage: MINIMUM_WAGE_2026,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('payDay 검증', () => {
    it('1 미만이면 실패해야 한다', () => {
      const result = contractFormSchema.safeParse({
        ...validFormData,
        payDay: 0,
      });
      expect(result.success).toBe(false);
    });

    it('31 초과면 실패해야 한다', () => {
      const result = contractFormSchema.safeParse({
        ...validFormData,
        payDay: 32,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('businessSize 검증', () => {
    it('올바른 값이면 통과해야 한다', () => {
      const underFive = contractFormSchema.safeParse({
        ...validFormData,
        businessSize: 'under_5',
      });
      expect(underFive.success).toBe(true);

      const overFive = contractFormSchema.safeParse({
        ...validFormData,
        businessSize: 'over_5',
      });
      expect(overFive.success).toBe(true);
    });

    it('잘못된 값이면 실패해야 한다', () => {
      const result = contractFormSchema.safeParse({
        ...validFormData,
        businessSize: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('transformFormToDbSchema', () => {
  const formData: ContractFormInput = {
    businessSize: 'over_5',
    workerName: '홍길동',
    hourlyWage: 12000,
    includesWeeklyAllowance: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    hasNoEndDate: false,
    workDays: ['월', '화', '수'],
    workDaysPerWeek: null,
    useWorkDaysPerWeek: false,
    workStartTime: '09:00',
    workEndTime: '18:00',
    breakMinutes: 60,
    workLocation: '서울시 강남구',
    jobDescription: '서빙',
    payDay: 25,
  };

  it('폼 데이터를 DB 스키마로 변환해야 한다', () => {
    const result = transformFormToDbSchema(formData);

    expect(result.worker_name).toBe('홍길동');
    expect(result.hourly_wage).toBe(12000);
    expect(result.includes_weekly_allowance).toBe(true);
    expect(result.start_date).toBe('2026-01-01');
    expect(result.end_date).toBe('2026-12-31');
    expect(result.work_days).toEqual(['월', '화', '수']);
    expect(result.work_days_per_week).toBeNull();
    expect(result.work_start_time).toBe('09:00');
    expect(result.work_end_time).toBe('18:00');
    expect(result.break_minutes).toBe(60);
    expect(result.work_location).toBe('서울시 강남구');
    expect(result.job_description).toBe('서빙');
    expect(result.pay_day).toBe(25);
    expect(result.business_size).toBe('over_5');
  });

  it('hasNoEndDate가 true면 end_date를 null로 변환해야 한다', () => {
    const result = transformFormToDbSchema({
      ...formData,
      hasNoEndDate: true,
      endDate: '2026-12-31',
    });
    expect(result.end_date).toBeNull();
  });

  it('useWorkDaysPerWeek가 true면 work_days를 null로 변환해야 한다', () => {
    const result = transformFormToDbSchema({
      ...formData,
      useWorkDaysPerWeek: true,
      workDaysPerWeek: 5,
    });
    expect(result.work_days).toBeNull();
    expect(result.work_days_per_week).toBe(5);
  });
});
