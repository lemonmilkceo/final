import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import WorkerDashboard from './worker-dashboard';

export default async function WorkerDashboardPage() {
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
    .select('name, avatar_url')
    .eq('id', user.id)
    .single();

  // 온보딩 완료 여부 확인
  const { data: workerDetails } = await supabase
    .from('worker_details')
    .select('id')
    .eq('user_id', user.id)
    .single();

  // 온보딩 미완료 시 온보딩 페이지로 이동
  if (!workerDetails) {
    redirect('/worker/onboarding');
  }

  // 계약서 목록 조회 (worker_id로 또는 초대된 계약서)
  const { data: contracts } = await supabase
    .from('contracts')
    .select(
      `
      id,
      worker_name,
      hourly_wage,
      status,
      expires_at,
      created_at,
      employer:profiles!contracts_employer_id_fkey (
        name
      ),
      signatures (
        signer_role,
        signed_at
      )
    `
    )
    .eq('worker_id', user.id)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  return (
    <WorkerDashboard
      profile={{
        name: profile?.name || '알바생',
        avatarUrl: profile?.avatar_url,
      }}
      contracts={contracts || []}
    />
  );
}
