import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * 보호된 경로 (로그인 필수)
 */
const PROTECTED_ROUTES = [
  '/employer',
  '/worker',
  '/select-role',
  '/pricing',
  '/payment-history',
  '/profile',
];

/**
 * 게스트 모드에서 접근 가능한 경로
 */
const GUEST_ALLOWED_ROUTES = [
  '/employer',
  '/employer/create',
  '/worker',
  '/worker/career',
];

/**
 * 역할별 접근 제한 경로
 */
const ROLE_ROUTES: Record<string, string[]> = {
  employer: ['/employer'],
  worker: ['/worker'],
};

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
    // 프로필에서 역할 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role;

    // 역할이 없는 경우 역할 선택 페이지로 (이미 역할 선택 페이지가 아닌 경우만)
    if (!userRole && isProtectedRoute && pathname !== '/select-role') {
      const url = request.nextUrl.clone();
      url.pathname = '/select-role';
      return NextResponse.redirect(url);
    }

    // 역할별 경로 접근 제한
    if (userRole) {
      // employer가 worker 경로 접근 시도
      if (userRole === 'employer' && pathname.startsWith('/worker')) {
        const url = request.nextUrl.clone();
        url.pathname = '/employer';
        return NextResponse.redirect(url);
      }
      // worker가 employer 경로 접근 시도
      if (userRole === 'worker' && pathname.startsWith('/employer')) {
        const url = request.nextUrl.clone();
        url.pathname = '/worker';
        return NextResponse.redirect(url);
      }
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
