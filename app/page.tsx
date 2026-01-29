'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { ROUTES } from '@/lib/constants/routes';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Wait for splash animation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if user has a role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role) {
          router.push(`/${profile.role}`);
        } else {
          router.push(ROUTES.SELECT_ROLE);
        }
      } else {
        router.push(ROUTES.ONBOARDING);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      {/* Logo */}
      <div className="w-24 h-24 mb-4 animate-bounce-slow">
        <Image
          src="/images/logo.png"
          alt="싸인해주세요 로고"
          width={96}
          height={96}
          priority
        />
      </div>

      {/* Service Name */}
      <h1 className="text-[22px] font-bold text-gray-900 tracking-tight animate-fade-in">
        싸인해주세요
      </h1>

      {/* Loading Dots */}
      <div className="flex gap-1.5 mt-8">
        <span
          className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
}
