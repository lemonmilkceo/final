import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import ContractPreview from './contract-preview';
import { ROUTES } from '@/lib/constants/routes';

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 게스트 모드 체크
  const cookieStore = await cookies();
  const guestCookie = cookieStore.get('guest-storage');
  let isGuestMode = false;
  if (guestCookie?.value) {
    try {
      const decodedValue = decodeURIComponent(guestCookie.value);
      const parsed = JSON.parse(decodedValue);
      isGuestMode = parsed.state?.isGuest || false;
    } catch {
      isGuestMode = false;
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isGuestMode) {
    redirect(ROUTES.LOGIN);
  }

  // 새 계약서 (store에서 데이터 가져오기)
  if (id === 'new') {
    return <ContractPreview contractId={null} isNew={true} isGuestMode={isGuestMode} />;
  }

  // 게스트 모드에서 기존 계약서 조회는 불가
  if (isGuestMode) {
    notFound();
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
        signature_data
      )
    `
    )
    .eq('id', id)
    .eq('employer_id', user!.id)
    .single();

  if (error || !contract) {
    notFound();
  }

  return <ContractPreview contractId={id} contract={contract} isNew={false} />;
}
