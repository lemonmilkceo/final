import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { 
  CareerCertificatePDFDocument, 
  CareerItem 
} from '@/lib/pdf/career-certificate-template';

export async function POST() {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요해요' },
        { status: 401 }
      );
    }

    // 사용자 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: '프로필 정보를 찾을 수 없어요' },
        { status: 404 }
      );
    }

    // 근로자 역할 확인
    if (profile.role !== 'worker') {
      return NextResponse.json(
        { error: '근로자만 경력증명서를 발급받을 수 있어요' },
        { status: 403 }
      );
    }

    // 완료된 계약서 조회 (경력 데이터)
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select(`
        id,
        worker_name,
        work_location,
        job_description,
        start_date,
        end_date,
        completed_at,
        employer:profiles!contracts_employer_id_fkey (
          name
        )
      `)
      .eq('worker_id', user.id)
      .eq('status', 'completed')
      .order('start_date', { ascending: false });

    if (contractsError) {
      console.error('[Career PDF] 계약서 조회 오류:', contractsError);
      return NextResponse.json(
        { error: '경력 정보를 불러오는데 실패했어요' },
        { status: 500 }
      );
    }

    if (!contracts || contracts.length === 0) {
      return NextResponse.json(
        { error: '발급 가능한 경력이 없어요. 완료된 계약서가 필요해요.' },
        { status: 400 }
      );
    }

    // 경력 데이터 변환
    const careers: CareerItem[] = contracts.map((contract) => {
      const startDate = new Date(contract.start_date);
      const endDate = contract.end_date ? new Date(contract.end_date) : new Date();
      const durationDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // employer가 배열로 올 수 있으므로 처리
      const employerData = Array.isArray(contract.employer) 
        ? contract.employer[0] 
        : contract.employer;

      return {
        id: contract.id,
        workplaceName: employerData?.name || contract.work_location || '미지정',
        jobDescription: contract.job_description || '업무 내용 미기재',
        startDate: contract.start_date,
        endDate: contract.end_date,
        durationDays: durationDays > 0 ? durationDays : 1,
      };
    });

    // 총 근무일수 계산 (중복 기간 제외 없이 단순 합산)
    const totalDays = careers.reduce((sum, career) => sum + career.durationDays, 0);
    const totalContracts = careers.length;

    // 발급일 (현재 날짜)
    const issueDate = new Date().toISOString();

    // PDF 데이터 준비
    console.log('[Career PDF] 데이터 준비 완료, PDF 렌더링 시작...');
    const pdfData = {
      worker: {
        name: profile.name || contracts[0]?.worker_name || '이름 없음',
        birthDate: undefined, // 주민번호 복호화가 필요하면 추후 구현
      },
      careers,
      totalDays,
      totalContracts,
      issueDate,
    };

    // PDF 생성
    const pdfBuffer = await renderToBuffer(CareerCertificatePDFDocument(pdfData));
    console.log('[Career PDF] PDF 렌더링 완료, 버퍼 크기:', pdfBuffer.length);

    // Base64 인코딩하여 반환
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    // 파일명 생성
    const workerName = profile.name || '근로자';
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `경력증명서_${workerName}_${dateStr}.pdf`;

    return NextResponse.json({
      success: true,
      pdf: pdfBase64,
      filename,
    });
  } catch (error) {
    console.error('[Career PDF] 생성 오류:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[Career PDF] 상세 오류:', errorMessage);
    console.error('[Career PDF] 스택:', errorStack);
    return NextResponse.json(
      { 
        error: '경력증명서 생성에 실패했어요', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
