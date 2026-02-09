'use server';

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

// 로그인 실패 추적 (메모리 기반 - 서버리스 환경에서는 제한적)
// 프로덕션에서는 Redis나 DB 사용 권장
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 30 * 60 * 1000; // 30분

/**
 * IP 기반 로그인 시도 횟수 체크
 */
export async function checkLoginAttempts(ip: string): Promise<{
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil?: number;
}> {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (attempt) {
    // 잠금 시간이 지났으면 초기화
    if (attempt.lockedUntil && now > attempt.lockedUntil) {
      loginAttempts.delete(ip);
      return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
    }

    // 아직 잠금 중
    if (attempt.lockedUntil && now <= attempt.lockedUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: attempt.lockedUntil,
      };
    }

    // 시도 횟수 초과
    if (attempt.count >= MAX_ATTEMPTS) {
      const lockedUntil = now + LOCK_DURATION;
      loginAttempts.set(ip, { count: attempt.count, lockedUntil });
      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil,
      };
    }

    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS - attempt.count,
    };
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
}

/**
 * 로그인 실패 기록
 */
export async function recordLoginFailure(ip: string): Promise<{
  remainingAttempts: number;
  locked: boolean;
  lockedUntil?: number;
}> {
  const now = Date.now();
  const attempt = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  
  attempt.count += 1;

  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockedUntil = now + LOCK_DURATION;
    loginAttempts.set(ip, attempt);
    return {
      remainingAttempts: 0,
      locked: true,
      lockedUntil: attempt.lockedUntil,
    };
  }

  loginAttempts.set(ip, attempt);
  return {
    remainingAttempts: MAX_ATTEMPTS - attempt.count,
    locked: false,
  };
}

/**
 * 로그인 성공 시 시도 횟수 초기화
 */
export async function clearLoginAttempts(ip: string): Promise<void> {
  loginAttempts.delete(ip);
}

/**
 * 관리자 로그인
 */
export async function adminLogin(
  password: string,
  ip: string
): Promise<{
  success: boolean;
  error?: string;
  remainingAttempts?: number;
  lockedUntil?: number;
}> {
  // 로그인 시도 체크
  const attemptCheck = await checkLoginAttempts(ip);
  
  if (!attemptCheck.allowed) {
    const remainingMinutes = Math.ceil(
      ((attemptCheck.lockedUntil || 0) - Date.now()) / 60000
    );
    return {
      success: false,
      error: `로그인이 ${remainingMinutes}분간 잠겼습니다`,
      remainingAttempts: 0,
      lockedUntil: attemptCheck.lockedUntil,
    };
  }

  // 비밀번호 검증
  if (password !== process.env.ADMIN_PASSWORD) {
    const failure = await recordLoginFailure(ip);
    
    if (failure.locked) {
      return {
        success: false,
        error: '5회 실패로 30분간 로그인이 잠겼습니다',
        remainingAttempts: 0,
        lockedUntil: failure.lockedUntil,
      };
    }

    return {
      success: false,
      error: `비밀번호가 올바르지 않습니다 (${failure.remainingAttempts}회 남음)`,
      remainingAttempts: failure.remainingAttempts,
    };
  }

  // 성공 시 시도 횟수 초기화
  await clearLoginAttempts(ip);

  // JWT 생성 (24시간 유효)
  const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  // 쿠키에 저장
  const cookieStore = await cookies();
  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24시간
    path: '/',
  });

  return { success: true };
}

/**
 * 관리자 로그아웃
 */
export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}

/**
 * 관리자 세션 검증 (Server Action에서 사용)
 */
export async function verifyAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
      return false;
    }

    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

/**
 * 관리자 권한 필수 (권한 없으면 에러)
 */
export async function requireAdmin(): Promise<void> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error('Unauthorized');
  }
}
