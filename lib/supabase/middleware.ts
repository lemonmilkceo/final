import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * 관리자 경로
 */
const ADMIN_ROUTES = ['/admin'];

/**
 * 보호된 경로 (로그인 필수)
 */
const PROTECTED_ROUTES = [
  '/employer',
  '/worker',
  '/select-role',
  '/payment-history',
  '/profile',
];

/**
 * 공개 경로 (게스트/비로그인 모두 접근 가능)
 * pricing은 가격 정보를 미리 볼 수 있게 공개
 */
const PUBLIC_ROUTES = [
  '/pricing',
];

/**
 * 게스트 모드에서 접근 가능한 경로
 */
const GUEST_ALLOWED_ROUTES = [
  '/employer',
  '/employer/create',
  '/employer/preview',
  '/worker',
  '/worker/career',
  '/worker/contract',
  '/support',        // 고객센터 메인
  '/support/faq',    // FAQ (게스트도 접근 가능)
];

// 역할 전환 기능 도입으로 역할별 경로 제한 제거
// 사용자는 employer/worker 경로 모두 접근 가능

/**
 * 미들웨어에서 Supabase 세션을 업데이트하고 접근 제어를 수행합니다.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ⚠️ 중요: getSession() 대신 getUser() 사용
  // getSession()은 JWT 서명을 검증하지 않으므로 보안상 취약
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ═══════════════════════════════════════════════════════════
  // 관리자 경로 보호 (일반 사용자 인증보다 먼저 처리)
  // ═══════════════════════════════════════════════════════════
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  if (isAdminRoute && pathname !== '/admin/login') {
    // 관리자 세션 쿠키 확인 (Supabase 세션과 별개)
    const adminSession = request.cookies.get('admin_session')?.value;

    if (!adminSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    // JWT 검증 (jose는 Edge Runtime 호환)
    try {
      const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);
      await jwtVerify(adminSession, secret);
    } catch {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      const response = NextResponse.redirect(url);
      response.cookies.delete('admin_session');
      return response;
    }

    // 관리자 인증 성공 - 일반 사용자 경로 체크 건너뛰기
    return supabaseResponse;
  }

  // 게스트 모드 체크 (localStorage는 서버에서 접근 불가하므로 쿠키 사용)
  const guestCookie = request.cookies.get('guest-storage');
  let isGuest = false;
  let guestRole: string | null = null;

  if (guestCookie?.value) {
    try {
      // 쿠키 값이 URL 인코딩되어 있을 수 있으므로 디코딩
      const decodedValue = decodeURIComponent(guestCookie.value);
      const guestData = JSON.parse(decodedValue);
      isGuest = guestData?.state?.isGuest || false;
      guestRole = guestData?.state?.guestRole || null;
    } catch {
      // JSON 파싱 실패 시 무시
    }
  }

  // 보호된 경로 체크
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // 게스트 모드에서 허용된 경로인지 체크
  const isGuestAllowedRoute = GUEST_ALLOWED_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // 게스트 모드일 경우 허용된 경로만 접근 가능
  if (isGuest && guestRole && isGuestAllowedRoute) {
    // 게스트 모드에서 역할에 맞는 경로만 허용
    if (guestRole === 'employer' && pathname.startsWith('/employer')) {
      return supabaseResponse;
    }
    if (guestRole === 'worker' && pathname.startsWith('/worker')) {
      return supabaseResponse;
    }
  }

  if (isProtectedRoute && (!user || error)) {
    // 로그인 페이지로 리다이렉트
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 역할별 접근 제한 체크
  if (user) {
    // 프로필에서 역할 및 차단 상태 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_blocked')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role;
    const isBlocked = profile?.is_blocked;

    // 차단된 사용자는 /blocked 페이지로 이동
    if (isBlocked && pathname !== '/blocked') {
      const url = request.nextUrl.clone();
      url.pathname = '/blocked';
      return NextResponse.redirect(url);
    }

    // 차단되지 않은 사용자가 /blocked 페이지 접근 시 대시보드로
    if (!isBlocked && pathname === '/blocked') {
      const url = request.nextUrl.clone();
      url.pathname = userRole ? `/${userRole}` : '/select-role';
      return NextResponse.redirect(url);
    }

    // 역할이 없는 경우 역할 선택 페이지로 (이미 역할 선택 페이지가 아닌 경우만)
    if (!userRole && isProtectedRoute && pathname !== '/select-role') {
      const url = request.nextUrl.clone();
      url.pathname = '/select-role';
      return NextResponse.redirect(url);
    }

    // 역할 전환 기능 도입으로 경로 접근 제한 제거
    // 사용자는 employer/worker 경로 모두 접근 가능
    // 역할 선택 페이지에서 이미 역할이 있으면 현재 역할 대시보드로 이동
    if (userRole && pathname === '/select-role') {
      const url = request.nextUrl.clone();
      url.pathname = `/${userRole}`;
      return NextResponse.redirect(url);
    }
  }

  // 로그인 상태에서 로그인/회원가입 페이지 접근 시 대시보드로
  if (user && (pathname === '/login' || pathname === '/signup')) {
    // 프로필에서 역할 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role;
    const url = request.nextUrl.clone();

    if (userRole) {
      url.pathname = `/${userRole}`;
    } else {
      url.pathname = '/select-role';
    }

    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
