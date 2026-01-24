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

  return (
    <ProfilePage
      profile={{
        ...profile,
        email: user.email || null,
      }}
    />
  );
}
