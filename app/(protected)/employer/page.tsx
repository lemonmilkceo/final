import { createClient } from '@/lib/supabase/server';
import EmployerDashboard from './employer-dashboard';

export default async function EmployerDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // 사용자 프로필 조회 (크레딧 포함)
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_url')
    .eq('id', user.id)
    .single();

  // 크레딧 조회
  const { data: credit } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  // 계약서 목록 조회
  const { data: contracts } = await supabase
    .from('contracts')
    .select(
      `
      id,
      worker_name,
      hourly_wage,
      status,
      created_at,
      folder_id,
      signatures (
        signer_role,
        signed_at
      )
    `
    )
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <EmployerDashboard
      profile={{
        name: profile?.name || '사장님',
        avatarUrl: profile?.avatar_url,
      }}
      credits={credit?.balance || 0}
      contracts={contracts || []}
    />
  );
}
