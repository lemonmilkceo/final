import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ContractPreview from './contract-preview';
import { ROUTES } from '@/lib/constants/routes';

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 새 계약서 (store에서 데이터 가져오기)
  if (id === 'new') {
    return <ContractPreview contractId={null} isNew={true} />;
  }

  // 기존 계약서 조회
  const { data: contract, error } = await supabase
    .from('contracts')
    .select(
      `
      *,
      signatures (
        id,
        signer_role,
        signed_at,
        signature_image_url
      )
    `
    )
    .eq('id', id)
    .eq('employer_id', user.id)
    .single();

  if (error || !contract) {
    notFound();
  }

  return <ContractPreview contractId={id} contract={contract} isNew={false} />;
}
