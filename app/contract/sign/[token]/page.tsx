import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WorkerSignPage from './worker-sign';
import Link from 'next/link';

// OAuth 콜백 후 캐시 문제 방지 - 항상 최신 데이터 fetch
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    // 로그인 상태면 계약서 상세로 바로 이동 가능
    const isContractOwner = user && contract.worker_id === user.id;
    
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <span className="text-6xl mb-4">✅</span>
        <h1 className="text-[22px] font-bold text-gray-900 mb-2">
          서명이 완료된 계약서예요
        </h1>
        <p className="text-[15px] text-gray-500 mb-8">
          {isContractOwner 
            ? '아래 버튼을 눌러 계약서를 확인하세요'
            : '로그인하면 계약서를 확인할 수 있어요'}
        </p>
        
        <div className="w-full max-w-xs space-y-3">
          {isContractOwner ? (
            <Link
              href={`/worker/contract/${contract.id}`}
              className="block w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-[16px] text-center"
            >
              계약서 확인하기 📄
            </Link>
          ) : isLoggedIn ? (
            <Link
              href="/worker"
              className="block w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-[16px] text-center"
            >
              내 계약서 목록 보기
            </Link>
          ) : (
            <Link
              href="/login"
              className="block w-full py-4 rounded-2xl bg-[#FEE500] text-[#3C1E1E] font-semibold text-[16px] text-center"
            >
              카카오로 로그인하기
            </Link>
          )}
          
          <Link
            href="/"
            className="block w-full py-4 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-[16px] text-center"
          >
            홈으로 가기
          </Link>
        </div>
      </div>
    );
  }

  // contract_type 타입 단언
  const typedContract = {
    ...contract,
    contract_type: contract.contract_type as 'regular' | 'contract' | undefined,
  };

  return (
    <WorkerSignPage 
      contract={typedContract} 
      token={token} 
      isLoggedIn={isLoggedIn} 
      existingWorkerDetails={existingWorkerDetails}
    />
  );
}
