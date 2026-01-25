import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/select-role';

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

        // next가 서명 페이지인 경우 (/s/ 또는 /contract/sign/)
        // 역할 확인 없이 바로 해당 페이지로 이동
        if (next.startsWith('/s/') || next.startsWith('/contract/sign/')) {
          // 역할이 없으면 worker로 자동 설정
          if (!profile?.role) {
            await supabase
              .from('profiles')
              .update({ role: 'worker' })
              .eq('id', user.id);
          }
          return NextResponse.redirect(`${origin}${next}`);
        }

        // 역할이 이미 설정된 경우 해당 대시보드로
        if (profile?.role) {
          return NextResponse.redirect(`${origin}/${profile.role}`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 에러 시 로그인 페이지로
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
