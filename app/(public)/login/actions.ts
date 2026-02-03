'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signInWithKakao() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      queryParams: {
        // 카카오 추가 동의 항목
        scope: 'profile_nickname profile_image',
      },
    },
  });

  if (error) {
    console.error('Kakao OAuth Error:', error.message);
    redirect('/login?error=auth_failed');
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signInWithApple() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error('Apple OAuth Error:', error.message);
    redirect('/login?error=auth_failed');
  }

  if (data.url) {
    redirect(data.url);
  }
}
