import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import React from 'react';
import { ROUTES } from '@/lib/constants/routes';

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 역할 체크
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile?.role) {
    redirect(ROUTES.SELECT_ROLE);
  }

  if (profile.role !== 'employer') {
    redirect(ROUTES.WORKER_DASHBOARD);
  }

  return <>{children}</>;
}
