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

  // 먼저 로그인 여부 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인되어 있지 않을 때만 게스트 모드 체크
  let isGuestMode = false;
  if (!user) {
    const cookieStore = await cookies();
    const guestCookie = cookieStore.get('guest-storage');
    if (guestCookie?.value) {
      try {
        const decodedValue = decodeURIComponent(guestCookie.value);
        const parsed = JSON.parse(decodedValue);
        isGuestMode = parsed.state?.isGuest || false;
      } catch {
        isGuestMode = false;
      }
    }
  }

  if (!user && !isGuestMode) {
    redirect(ROUTES.LOGIN);
  }

  // 게스트 모드에서 기존 계약서 조회는 불가
  if (isGuestMode && id !== 'new') {
    notFound();
  }

  // 사업자 프로필 조회 (로그인된 사용자만)
  let employerName: string | undefined;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();
    employerName = profile?.name || undefined;
  }

  // 새 계약서 (store에서 데이터 가져오기)
  if (id === 'new') {
    return (
      <ContractPreview
        contractId={null}
        isNew={true}
        isGuestMode={isGuestMode}
        employerName={employerName}
      />
    );
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

  // contract_type 타입 단언 (DB에서는 string으로 반환)
  const typedContract = {
    ...contract,
    contract_type: contract.contract_type as 'regular' | 'contract' | undefined,
  };

  return (
    <ContractPreview
      contractId={id}
      contract={typedContract}
      isNew={false}
      employerName={employerName}
    />
  );
}
