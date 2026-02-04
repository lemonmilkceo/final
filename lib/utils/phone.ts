/**
 * 전화번호 유틸리티 함수
 * 알림톡 발송을 위한 전화번호 정규화 및 검증
 */

/**
 * 전화번호를 알리고 API 형식으로 정규화
 * - 하이픈, 공백 등 특수문자 제거
 * - 010-1234-5678 → 01012345678
 * - +82 10 1234 5678 → 01012345678
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';

  // 모든 특수문자 및 공백 제거
  let normalized = phone.replace(/[\s\-\(\)\+]/g, '');

  // +82로 시작하면 0으로 변환 (국제 형식)
  if (normalized.startsWith('82')) {
    normalized = '0' + normalized.slice(2);
  }

  return normalized;
}

/**
 * 휴대폰 번호 유효성 검증
 * - 010, 011, 016, 017, 018, 019로 시작
 * - 총 10-11자리
 */
export function isValidMobilePhone(phone: string | null | undefined): boolean {
  if (!phone) return false;

  const normalized = normalizePhoneNumber(phone);

  // 한국 휴대폰 번호 패턴: 01X-XXXX-XXXX (10-11자리)
  const mobilePattern = /^01[0-9]{8,9}$/;

  return mobilePattern.test(normalized);
}

/**
 * 전화번호 마스킹 (로깅용)
 * - 01012345678 → 010****5678
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';

  const normalized = normalizePhoneNumber(phone);

  if (normalized.length < 8) return '****';

  // 앞 3자리 + **** + 뒤 4자리
  return normalized.slice(0, 3) + '****' + normalized.slice(-4);
}

/**
 * 전화번호 포맷팅 (표시용)
 * - 01012345678 → 010-1234-5678
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';

  const normalized = normalizePhoneNumber(phone);

  if (normalized.length === 11) {
    // 010-1234-5678
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7)}`;
  } else if (normalized.length === 10) {
    // 010-123-4567 (구 형식)
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
  }

  return normalized;
}
