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
