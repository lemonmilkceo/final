import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';
import ContractPreview from './contract-preview';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContractPreviewPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 새 계약서인 경우 (아직 저장되지 않음)
  if (id === 'new') {
    return <ContractPreview contract={null} isNew={true} />;
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

  return <ContractPreview contract={contract} isNew={false} />;
}
