import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import PricingPage from './pricing-page';

export default async function Pricing() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 현재 크레딧 조회
  const { data: contractCredit } = await supabase
    .from('credits')
    .select('amount')
    .eq('user_id', user.id)
    .eq('credit_type', 'contract')
    .single();

  return (
    <PricingPage
      currentCredits={{
        contract: contractCredit?.amount || 0,
      }}
      userId={user.id}
    />
  );
}
