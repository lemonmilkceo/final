import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { ContractPDFDocument } from '@/lib/pdf/contract-template';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { contractId } = body;

    if (!contractId) {
      return NextResponse.json(
        { error: '계약서 ID가 필요해요' },
        { status: 400 }
      );
    }

    // 계약서 조회
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        signatures (
          signer_role,
          signed_at,
          signature_data
        )
      `)
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: '계약서를 찾을 수 없어요' },
        { status: 404 }
      );
    }

    // 권한 확인 (employer 또는 worker)
    if (contract.employer_id !== user.id && contract.worker_id !== user.id) {
      return NextResponse.json(
        { error: '접근 권한이 없어요' },
        { status: 403 }
      );
    }

    // 사업자 정보 조회
    const { data: employer } = await supabase
      .from('profiles')
      .select('name, phone')
      .eq('id', contract.employer_id)
      .single();

    // PDF 생성
    const pdfBuffer = await renderToBuffer(
      ContractPDFDocument({
        contract: {
          workerName: contract.worker_name,
          wageType: contract.wage_type,
          hourlyWage: contract.hourly_wage,
          monthlyWage: contract.monthly_wage,
          includesWeeklyAllowance: contract.includes_weekly_allowance,
          startDate: contract.start_date,
          endDate: contract.end_date,
          workDays: contract.work_days,
          workDaysPerWeek: contract.work_days_per_week,
          workStartTime: contract.work_start_time,
          workEndTime: contract.work_end_time,
          breakMinutes: contract.break_minutes,
          workLocation: contract.work_location,
          jobDescription: contract.job_description,
          payDay: contract.pay_day,
          paymentTiming: contract.payment_timing,
          isLastDayPayment: contract.is_last_day_payment,
          businessSize: contract.business_size,
          createdAt: contract.created_at,
        },
        employer: {
          name: employer?.name || '',
          phone: employer?.phone || '',
        },
        signatures: contract.signatures || [],
      })
    );

    // Base64 인코딩하여 반환
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      pdf: pdfBase64,
      filename: `근로계약서_${contract.worker_name}_${new Date().toISOString().split('T')[0]}.pdf`,
    });
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    return NextResponse.json(
      { error: 'PDF 생성에 실패했어요' },
      { status: 500 }
    );
  }
}
