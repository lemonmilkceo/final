/**
 * 간단한 메모리 기반 Rate Limiter
 * 서버리스 환경에서는 Redis 기반이 권장되지만,
 * 단일 인스턴스에서 기본적인 보호를 제공합니다.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// 메모리 기반 저장소 (서버 재시작 시 초기화)
const rateLimitStore = new Map<string, RateLimitEntry>();

// 오래된 항목 정리 (메모리 누수 방지)
const cleanupInterval = 60 * 1000; // 1분마다
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < cleanupInterval) return;
  
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate Limit 체크
 * @param identifier 사용자 식별자 (user_id 또는 IP)
 * @param limit 허용 요청 수
 * @param windowMs 시간 윈도우 (밀리초)
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup();
  
  const now = Date.now();
  const key = identifier;
  
  let entry = rateLimitStore.get(key);
  
  // 새 항목이거나 윈도우가 리셋됨
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: entry.resetAt,
    };
  }
  
  // 기존 윈도우 내
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }
  
  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate Limit 키 생성 헬퍼
 */
export function getRateLimitKey(
  endpoint: string,
  userId?: string,
  ip?: string
): string {
  const identifier = userId || ip || 'anonymous';
  return `${endpoint}:${identifier}`;
}
