import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import PaymentHistoryPage from './payment-history-page';

export default async function PaymentHistory() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 결제 내역 조회
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('paid_at', { ascending: false });

  return <PaymentHistoryPage payments={payments || []} />;
}
