import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatNumberInput,
  parseFormattedNumber,
  formatDate,
  formatDateShort,
  formatDateISO,
  formatTime,
  calculateWorkMinutes,
  formatMinutesToHours,
  formatPhoneNumber,
  formatWorkDays,
} from '@/lib/utils/format';

describe('formatCurrency', () => {
  it('숫자를 원화 형식으로 포맷해야 한다', () => {
    expect(formatCurrency(10000)).toBe('10,000원');
    expect(formatCurrency(1234567)).toBe('1,234,567원');
    expect(formatCurrency(0)).toBe('0원');
  });

  it('큰 숫자도 올바르게 포맷해야 한다', () => {
    expect(formatCurrency(1000000000)).toBe('1,000,000,000원');
  });
});

describe('formatNumber', () => {
  it('숫자에 천 단위 콤마를 추가해야 한다', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(0)).toBe('0');
  });
});

describe('formatNumberInput', () => {
  it('입력값에서 숫자만 추출하고 콤마를 추가해야 한다', () => {
    expect(formatNumberInput('10000')).toBe('10,000');
    expect(formatNumberInput('1,234,567')).toBe('1,234,567');
    expect(formatNumberInput('abc123def456')).toBe('123,456');
  });

  it('빈 문자열이나 숫자가 없으면 빈 문자열을 반환해야 한다', () => {
    expect(formatNumberInput('')).toBe('');
    expect(formatNumberInput('abc')).toBe('');
  });
});

describe('parseFormattedNumber', () => {
  it('콤마가 포함된 문자열에서 숫자를 추출해야 한다', () => {
    expect(parseFormattedNumber('1,000')).toBe(1000);
    expect(parseFormattedNumber('1,234,567')).toBe(1234567);
  });

  it('숫자가 없으면 0을 반환해야 한다', () => {
    expect(parseFormattedNumber('')).toBe(0);
    expect(parseFormattedNumber('abc')).toBe(0);
  });
});

describe('formatDate', () => {
  it('날짜를 한국어 형식으로 포맷해야 한다', () => {
    expect(formatDate(new Date('2026-01-24'))).toBe('2026년 1월 24일');
    expect(formatDate('2026-12-31')).toBe('2026년 12월 31일');
  });
});

describe('formatDateShort', () => {
  it('날짜를 짧은 형식으로 포맷해야 한다', () => {
    expect(formatDateShort(new Date('2026-01-24'))).toBe('1월 24일');
    expect(formatDateShort('2026-12-31')).toBe('12월 31일');
  });
});

describe('formatDateISO', () => {
  it('날짜를 ISO 형식으로 포맷해야 한다', () => {
    expect(formatDateISO(new Date('2026-01-24'))).toBe('2026-01-24');
  });
});

describe('formatTime', () => {
  it('시간을 HH:mm 형식으로 포맷해야 한다', () => {
    expect(formatTime('14:00')).toBe('14:00');
    expect(formatTime('14:00:00')).toBe('14:00');
    expect(formatTime('09:30')).toBe('09:30');
  });
});

describe('calculateWorkMinutes', () => {
  it('일반 근무시간을 계산해야 한다', () => {
    expect(calculateWorkMinutes('09:00', '18:00')).toBe(540); // 9시간
    expect(calculateWorkMinutes('10:00', '14:00')).toBe(240); // 4시간
  });

  it('야간 근무(다음날까지)를 계산해야 한다', () => {
    expect(calculateWorkMinutes('22:00', '06:00')).toBe(480); // 8시간
  });

  it('분 단위도 계산해야 한다', () => {
    expect(calculateWorkMinutes('09:30', '18:00')).toBe(510); // 8시간 30분
  });
});

describe('formatMinutesToHours', () => {
  it('분을 시간:분 형식으로 변환해야 한다', () => {
    expect(formatMinutesToHours(60)).toBe('1시간');
    expect(formatMinutesToHours(90)).toBe('1시간 30분');
    expect(formatMinutesToHours(540)).toBe('9시간');
    expect(formatMinutesToHours(510)).toBe('8시간 30분');
  });
});

describe('formatPhoneNumber', () => {
  it('11자리 전화번호를 포맷해야 한다', () => {
    expect(formatPhoneNumber('01012345678')).toBe('010-1234-5678');
  });

  it('10자리 전화번호를 포맷해야 한다', () => {
    // 10자리는 3-3-4 형식으로 포맷됨
    expect(formatPhoneNumber('0311234567')).toBe('031-123-4567');
  });

  it('이미 포맷된 전화번호도 처리해야 한다', () => {
    expect(formatPhoneNumber('010-1234-5678')).toBe('010-1234-5678');
  });

  it('올바르지 않은 길이는 그대로 반환해야 한다', () => {
    expect(formatPhoneNumber('123')).toBe('123');
  });
});

describe('formatWorkDays', () => {
  it('요일 배열을 문자열로 변환해야 한다', () => {
    expect(formatWorkDays(['월', '화', '수'])).toBe('월, 화, 수');
    expect(formatWorkDays(['월', '화', '수', '목', '금'])).toBe('월, 화, 수, 목, 금');
  });

  it('빈 배열은 빈 문자열을 반환해야 한다', () => {
    expect(formatWorkDays([])).toBe('');
  });
});
