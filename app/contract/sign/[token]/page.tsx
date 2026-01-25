import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WorkerSignPage from './worker-sign';

interface SignPageProps {
  params: Promise<{ token: string }>;
}

export default async function SignPage({ params }: SignPageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // 로그인 상태 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

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

  // 로그인한 사용자의 기존 worker_details 조회
  let existingWorkerDetails = null;
  if (user) {
    const { data: workerDetails } = await supabase
      .from('worker_details')
      .select('ssn_encrypted, bank_name, account_number_encrypted')
      .eq('user_id', user.id)
      .single();
    
    if (workerDetails) {
      existingWorkerDetails = {
        hasSsn: !!workerDetails.ssn_encrypted,
        bankName: workerDetails.bank_name,
        hasAccount: !!workerDetails.account_number_encrypted,
      };
    }
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

  return (
    <WorkerSignPage 
      contract={contract} 
      token={token} 
      isLoggedIn={isLoggedIn} 
      existingWorkerDetails={existingWorkerDetails}
    />
  );
}
