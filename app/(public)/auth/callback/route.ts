import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/select-role';
  
  // 디버깅용 로그
  console.log('[Auth Callback] next param:', next);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 프로필에서 역할 확인
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        // 서명 페이지로 돌아가야 하는 경우 (/s/ 또는 /contract/sign/)
        // role 체크보다 우선 처리 - 반드시 서명 페이지로 리다이렉트
        const isSigningFlow = next.startsWith('/s/') || next.startsWith('/contract/sign/');
        
        // 게스트 모드 쿠키 삭제 함수
        const clearGuestCookie = (response: NextResponse) => {
          response.cookies.set('guest-storage', '', {
            expires: new Date(0),
            path: '/',
          });
          return response;
        };
        
        if (isSigningFlow) {
          console.log('[Auth Callback] Signing flow detected, redirecting to:', next);
          
          // 역할이 없으면 worker로 자동 설정
          if (!profile?.role) {
            await supabase
              .from('profiles')
              .update({ role: 'worker' })
              .eq('id', user.id);
          }
          // 서명 페이지로 무조건 리다이렉트 (role 무시)
          const response = NextResponse.redirect(`${origin}${next}`);
          return clearGuestCookie(response);
        }

        // 일반 로그인: 역할이 이미 설정된 경우 해당 대시보드로
        if (profile?.role) {
          const response = NextResponse.redirect(`${origin}/${profile.role}`);
          return clearGuestCookie(response);
        }
      }

      const response = NextResponse.redirect(`${origin}${next}`);
      // 게스트 쿠키 삭제
      response.cookies.set('guest-storage', '', {
        expires: new Date(0),
        path: '/',
      });
      return response;
    }
  }

  // 에러 시 로그인 페이지로
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
