import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import ProfilePage from './profile-page';

export default async function ProfilePageContainer() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, phone, role, avatar_url, created_at')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  // 근로자인 경우 worker_details 조회
  let workerDetails = null;
  if (profile.role === 'worker') {
    const { data } = await supabase
      .from('worker_details')
      .select('bank_name, ssn_encrypted, account_number_encrypted')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      workerDetails = {
        hasSsn: !!data.ssn_encrypted,
        bankName: data.bank_name,
        hasAccount: !!data.account_number_encrypted,
      };
    }
  }

  return (
    <ProfilePage
      profile={{
        ...profile,
        email: user.email || null,
      }}
      workerDetails={workerDetails}
    />
  );
}
