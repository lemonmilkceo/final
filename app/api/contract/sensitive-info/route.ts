import { createClient } from '@/lib/supabase/server';
import { decryptData } from '@/lib/utils/encryption';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 계약서 민감정보(주민번호, 계좌) 복호화 API
 * - 열람 로그를 기록하여 보안 감사 추적 가능
 * - 계약서 소유자(employer_id)만 접근 가능
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contractId, infoType } = body;

    if (!contractId || !infoType) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      );
    }

    if (!['ssn', 'account', 'both'].includes(infoType)) {
      return NextResponse.json(
        { error: '유효하지 않은 infoType입니다' },
        { status: 400 }
      );
    }

    // 계약서 조회 및 권한 확인
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, employer_id, worker_ssn_encrypted, worker_bank_name, worker_account_encrypted')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: '계약서를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 권한 확인: 계약서 작성자(사업자)만 접근 가능
    if (contract.employer_id !== user.id) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다' },
        { status: 403 }
      );
    }

    // 열람 로그 기록 (타입 정의에 없으므로 타입 단언 사용)
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('sensitive_info_logs').insert({
      user_id: user.id,
      contract_id: contractId,
      info_type: infoType,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // 복호화
    const result: {
      ssn?: string;
      bankName?: string;
      accountNumber?: string;
    } = {};

    if (infoType === 'ssn' || infoType === 'both') {
      if (contract.worker_ssn_encrypted) {
        try {
          result.ssn = decryptData(contract.worker_ssn_encrypted);
        } catch {
          result.ssn = undefined;
        }
      }
    }

    if (infoType === 'account' || infoType === 'both') {
      result.bankName = contract.worker_bank_name || undefined;
      if (contract.worker_account_encrypted) {
        try {
          result.accountNumber = decryptData(contract.worker_account_encrypted);
        } catch {
          result.accountNumber = undefined;
        }
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Sensitive info API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
