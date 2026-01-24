import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WorkerSignPage from './worker-sign';

interface SignPageProps {
  params: Promise<{ token: string }>;
}

export default async function SignPage({ params }: SignPageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // 계약서 조회 (share_token으로)
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
    .eq('share_token', token)
    .single();

  if (error || !contract) {
    notFound();
  }

  // 만료 체크
  if (contract.expires_at && new Date(contract.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <span className="text-6xl mb-4">⏰</span>
        <h1 className="text-[22px] font-bold text-gray-900 mb-2">
          서명 기한이 지났어요
        </h1>
        <p className="text-[15px] text-gray-500">
          사장님께 새로운 계약서를
          <br />
          요청해주세요
        </p>
      </div>
    );
  }

  // 이미 완료된 계약서
  if (contract.status === 'completed') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <span className="text-6xl mb-4">✅</span>
        <h1 className="text-[22px] font-bold text-gray-900 mb-2">
          이미 서명된 계약서예요
        </h1>
        <p className="text-[15px] text-gray-500">
          계약서 확인이 필요하면
          <br />
          앱에 로그인해주세요
        </p>
      </div>
    );
  }

  return <WorkerSignPage contract={contract} token={token} />;
}
