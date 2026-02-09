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

  // 환불 요청 상태 조회
  const { data: refundRequests } = await supabase
    .from('refund_requests')
    .select('payment_id, status')
    .eq('user_id', user.id)
    .in('status', ['pending', 'approved', 'completed', 'rejected']);

  // 결제 내역에 환불 상태 추가
  const paymentsWithRefundStatus = (payments || []).map((payment) => {
    const refund = refundRequests?.find((r) => r.payment_id === payment.id);
    return {
      ...payment,
      has_refund_request: !!refund,
      refund_status: refund?.status || null,
    };
  });

  return <PaymentHistoryPage payments={paymentsWithRefundStatus} />;
}
