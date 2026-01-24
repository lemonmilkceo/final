import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import BottomNav from '@/components/layout/BottomNav';
import React from 'react';

export default async function WorkerLayout({
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

  // 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // 역할 체크
  if (profile?.role !== 'worker') {
    redirect('/employer');
  }

  // 온보딩 완료 여부 확인
  const { data: workerDetails } = await supabase
    .from('worker_details')
    .select('id')
    .eq('user_id', user.id)
    .single();

  // 현재 경로 확인 (온보딩 페이지가 아닌데 온보딩이 필요한 경우)
  // 참고: 실제로 경로를 확인하려면 클라이언트 측에서 처리해야 함

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {children}
      <BottomNav userRole="worker" />
    </div>
  );
}
