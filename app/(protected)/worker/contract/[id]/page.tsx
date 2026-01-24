import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import WorkerContractDetail from './contract-detail';

interface ContractDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContractDetailPage({
  params,
}: ContractDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 계약서 조회
  const { data: contract, error } = await supabase
    .from('contracts')
    .select(
      `
      *,
      signatures (
        id,
        signer_role,
        signed_at,
        signature_data
      ),
      employer:profiles!contracts_employer_id_fkey (
        id,
        name,
        phone
      )
    `
    )
    .eq('id', id)
    .eq('worker_id', user.id)
    .single();

  if (error || !contract) {
    notFound();
  }

  return <WorkerContractDetail contract={contract} />;
}
