import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import CareerList from './career-list';

export default async function CareerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 완료된 계약서 목록 조회 (경력용)
  const { data: contracts } = await supabase
    .from('contracts')
    .select(
      `
      id,
      worker_name,
      hourly_wage,
      start_date,
      end_date,
      work_location,
      job_description,
      completed_at,
      employer:profiles!contracts_employer_id_fkey (
        name
      )
    `
    )
    .eq('worker_id', user.id)
    .eq('status', 'completed')
    .order('start_date', { ascending: false });

  // 총 근무 기간 계산
  let totalDays = 0;
  contracts?.forEach((contract) => {
    const start = new Date(contract.start_date);
    const end = contract.end_date ? new Date(contract.end_date) : new Date();
    const diff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    totalDays += diff;
  });

  return (
    <CareerList
      contracts={contracts || []}
      totalDays={totalDays}
      totalContracts={contracts?.length || 0}
    />
  );
}
