import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 숫자를 원화 형식으로 포맷
 * @param amount 금액
 * @returns "12,000원" 형식 문자열
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

/**
 * 숫자에 천 단위 콤마 추가
 * @param num 숫자
 * @returns "12,000" 형식 문자열
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num);
}

/**
 * 입력값에서 숫자만 추출하고 콤마 포맷팅
 * @param value 입력 문자열
 * @returns 콤마가 포함된 숫자 문자열
 */
export function formatNumberInput(value: string): string {
  const numericValue = value.replace(/[^0-9]/g, '');
  if (!numericValue) return '';
  return formatNumber(parseInt(numericValue, 10));
}

/**
 * 콤마가 포함된 문자열에서 숫자만 추출
 * @param value 콤마 포함 문자열
 * @returns 숫자
 */
export function parseFormattedNumber(value: string): number {
  return parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
}

/**
 * 날짜를 한국어 형식으로 포맷
 * @param date 날짜 (string | Date)
 * @returns "2026년 1월 24일" 형식
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy년 M월 d일', { locale: ko });
}

/**
 * 날짜를 짧은 형식으로 포맷
 * @param date 날짜
 * @returns "1월 24일" 형식
 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'M월 d일', { locale: ko });
}

/**
 * 날짜를 ISO 형식으로 포맷 (YYYY-MM-DD)
 * @param date 날짜
 * @returns "2026-01-24" 형식
 */
export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * 시간을 24시간 형식으로 포맷
 * @param time 시간 문자열 (HH:mm 또는 HH:mm:ss)
 * @returns "14:00" 형식
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
}

/**
 * 상대적 시간 표시 (오늘, 어제, n일 전 등)
 * @param date 날짜
 * @returns "오늘", "어제", "3일 전" 등
 */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffDays = differenceInDays(now, d);
  
  if (diffDays === 0) {
    return '오늘';
  } else if (diffDays === 1) {
    return '어제';
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return formatDateShort(d);
  }
}

/**
 * D-day 계산 (마감까지 남은 일수)
 * @param date 만료일
 * @returns "D-7", "D-1", "D-Day" 등
 */
export function formatDday(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffDays = differenceInDays(d, now);
  
  if (diffDays < 0) {
    return '만료됨';
  } else if (diffDays === 0) {
    return 'D-Day';
  } else {
    return `D-${diffDays}`;
  }
}

/**
 * 근무시간 계산 (시작~종료)
 * @param startTime 시작 시간 (HH:mm)
 * @param endTime 종료 시간 (HH:mm)
 * @returns 근무 시간 (분)
 */
export function calculateWorkMinutes(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;
  
  // 야간 근무 (종료 시간이 시작 시간보다 작은 경우)
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  
  return endMinutes - startMinutes;
}

/**
 * 분을 시간:분 형식으로 변환
 * @param minutes 분
 * @returns "6시간", "6시간 30분" 형식
 */
export function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}시간`;
  }
  return `${hours}시간 ${mins}분`;
}

/**
 * 전화번호 포맷팅
 * @param phone 전화번호 (숫자만)
 * @returns "010-1234-5678" 형식
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  
  return phone;
}

/**
 * 요일 배열을 문자열로 변환
 * @param days 요일 배열 ['월', '화', '수']
 * @returns "월, 화, 수"
 */
export function formatWorkDays(days: string[]): string {
  return days.join(', ');
}

/**
 * 상대적 시간 표시 (채팅용 - 방금 전, n분 전, n시간 전 등)
 * @param date 날짜
 * @returns "방금 전", "5분 전", "2시간 전", "어제" 등
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ko });
}
