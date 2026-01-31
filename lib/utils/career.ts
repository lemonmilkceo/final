/**
 * 경력/퇴사 관련 유틸리티 함수
 */

export interface ContractForCareer {
  start_date: string;
  end_date: string | null;
  resignation_date: string | null;
}

/**
 * 실제 종료일 계산
 * 우선순위: resignation_date > end_date(과거인 경우) > null(진행 중)
 */
export const getEffectiveEndDate = (contract: ContractForCareer): Date | null => {
  // 1순위: 퇴사일 (근로자가 직접 입력)
  if (contract.resignation_date) {
    return new Date(contract.resignation_date);
  }

  // 2순위: 계약 종료일 (기간 계약의 경우)
  if (contract.end_date) {
    const endDate = new Date(contract.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 계약 종료일이 오늘 이전이면 종료된 것으로 간주
    if (endDate <= today) {
      return endDate;
    }
    // 계약 종료일이 미래면 아직 진행 중
    return null;
  }

  // 3순위: 무기한 계약이면서 퇴사일도 없음 = 현재 진행 중
  return null;
};

/**
 * 계약이 현재 진행 중인지 확인
 */
export const isContractOngoing = (contract: ContractForCareer): boolean => {
  return getEffectiveEndDate(contract) === null;
};

/**
 * 퇴사일 입력이 필요한지 확인
 * - 무기한 계약이면서 퇴사일이 없으면 입력 필요
 * - 기간 계약이더라도 조기 퇴사/연장 근무 후 퇴사 시 입력 가능
 */
export const isResignationNeeded = (contract: ContractForCareer): boolean => {
  // 이미 퇴사일이 입력되어 있으면 불필요
  if (contract.resignation_date) {
    return false;
  }

  // 무기한 계약이면서 퇴사일 없음 = 입력 필요
  if (!contract.end_date) {
    return true;
  }

  // 기간 계약이지만 종료일이 미래 = 아직 진행 중이므로 선택적
  const endDate = new Date(contract.end_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 종료일이 미래면 진행 중
  if (endDate > today) {
    return false;
  }

  // 종료일이 과거면 이미 종료됨 (입력 불필요)
  return false;
};

/**
 * 경력 상태 텍스트 반환
 */
export type CareerStatus = 'ongoing' | 'resigned' | 'expired' | 'needs_input';

export const getCareerStatus = (contract: ContractForCareer): CareerStatus => {
  // 퇴사일이 입력됨
  if (contract.resignation_date) {
    return 'resigned';
  }

  // 무기한 계약이면서 퇴사일 없음
  if (!contract.end_date) {
    return 'needs_input'; // 퇴사일 입력 필요
  }

  // 기간 계약
  const endDate = new Date(contract.end_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (endDate <= today) {
    return 'expired'; // 계약 만료
  }

  return 'ongoing'; // 진행 중
};

/**
 * 경력 상태 라벨 반환
 */
export const getCareerStatusLabel = (status: CareerStatus): string => {
  switch (status) {
    case 'ongoing':
      return '근무 중';
    case 'resigned':
      return '퇴사 완료';
    case 'expired':
      return '계약 만료';
    case 'needs_input':
      return '퇴사일 미입력';
    default:
      return '';
  }
};

/**
 * 근무 기간 계산 (일수)
 */
export const calculateWorkDays = (contract: ContractForCareer): number => {
  const startDate = new Date(contract.start_date);
  const effectiveEnd = getEffectiveEndDate(contract) || new Date();

  const diff = effectiveEnd.getTime() - startDate.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return days > 0 ? days : 1;
};

/**
 * 근무 기간 포맷팅 (예: "3개월 15일")
 */
export const formatWorkDuration = (days: number): string => {
  if (days < 30) {
    return `${days}일`;
  }

  const months = Math.floor(days / 30);
  const remainingDays = days % 30;

  if (remainingDays === 0) {
    return `${months}개월`;
  }

  return `${months}개월 ${remainingDays}일`;
};

/**
 * 근무 기간 문자열 생성 (예: "2026.01.01 ~ 2026.03.15")
 */
export const formatWorkPeriod = (
  contract: ContractForCareer,
  formatDateFn: (date: string) => string
): string => {
  const start = formatDateFn(contract.start_date);
  const effectiveEnd = getEffectiveEndDate(contract);

  if (!effectiveEnd) {
    return `${start} ~ 현재`;
  }

  const endStr = effectiveEnd.toISOString().split('T')[0];
  return `${start} ~ ${formatDateFn(endStr)}`;
};

/**
 * 퇴사일 유효성 검사
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export const validateResignationDate = (
  resignationDate: Date,
  startDate: Date
): ValidationResult => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // 시작일 이후여야 함
  if (resignationDate < startDate) {
    return {
      valid: false,
      message: '퇴사일은 근무 시작일 이후여야 해요',
    };
  }

  // 미래 날짜 불가
  if (resignationDate > today) {
    return {
      valid: false,
      message: '퇴사일은 오늘 이전이어야 해요',
    };
  }

  return { valid: true };
};
