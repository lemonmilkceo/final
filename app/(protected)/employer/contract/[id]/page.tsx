import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { SAMPLE_CONTRACT_DETAILS } from '@/lib/constants/sampleData';
import ContractDetail from './contract-detail';

interface PageProps {
  params: Promise<{ id: string }>;
}

// 게스트 모드 체크 함수
async function isGuestMode(): Promise<boolean> {
  const cookieStore = await cookies();
  const guestCookie = cookieStore.get('guest-storage');
  
  if (guestCookie?.value) {
    try {
      const decodedValue = decodeURIComponent(guestCookie.value);
      const guestData = JSON.parse(decodedValue);
      return guestData?.state?.isGuest && guestData?.state?.guestRole === 'employer';
    } catch {
      // JSON 파싱 실패 시 무시
    }
  }
  
  return false;
}

export default async function ContractDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  const supabase = await createClient();

  // 먼저 로그인 여부 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인되어 있지 않을 때만 게스트 모드 체크
  const isGuest = !user && await isGuestMode();
  
  // 게스트 모드: 샘플 데이터에서 조회
  if (isGuest) {
    const sampleContract = SAMPLE_CONTRACT_DETAILS[id];
    
    if (!sampleContract) {
      notFound();
    }
    
    return (
      <ContractDetail
        contract={{
          id: sampleContract.id,
          workplaceName: sampleContract.workplace_name,
          workerName: sampleContract.worker_name,
          wageType: 'hourly',
          hourlyWage: sampleContract.hourly_wage,
          monthlyWage: null,
          includesWeeklyAllowance: sampleContract.includes_weekly_allowance,
          startDate: sampleContract.start_date,
          endDate: sampleContract.end_date,
          resignationDate: null,
          workDays: sampleContract.work_days,
          workDaysPerWeek: null,
          workStartTime: sampleContract.work_start_time,
          workEndTime: sampleContract.work_end_time,
          breakMinutes: sampleContract.break_minutes,
          workLocation: sampleContract.work_location,
          jobDescription: sampleContract.job_description,
          specialTerms: sampleContract.special_terms,
          payDay: sampleContract.pay_day,
          paymentTiming: 'current_month',
          isLastDayPayment: false,
          contractType: 'contract',
          businessSize: sampleContract.business_size,
          status: sampleContract.status,
          createdAt: sampleContract.created_at,
          expiresAt: sampleContract.expires_at,
          completedAt: sampleContract.completed_at,
          shareToken: sampleContract.share_token,
          signatures: sampleContract.signatures || [],
        }}
        aiReview={null}
        employerName={sampleContract.employer.name}
        isGuestMode={true}
      />
    );
  }
  
  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 계약서 조회
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
    .eq('employer_id', user.id)
    .single();

  if (error || !contract) {
    notFound();
  }

  // AI 리뷰 조회
  const { data: aiReview } = await supabase
    .from('ai_reviews')
    .select('*')
    .eq('contract_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // 사업자 프로필
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, phone')
    .eq('id', user.id)
    .single();

  return (
    <ContractDetail
      contract={{
        id: contract.id,
        workplaceName: contract.workplace_name,
        workerName: contract.worker_name,
        wageType: (contract.wage_type as 'hourly' | 'monthly') || 'hourly',
        hourlyWage: contract.hourly_wage,
        monthlyWage: contract.monthly_wage,
        includesWeeklyAllowance: contract.includes_weekly_allowance,
        startDate: contract.start_date,
        endDate: contract.end_date,
        resignationDate: contract.resignation_date,
        workDays: contract.work_days,
        workDaysPerWeek: contract.work_days_per_week,
        workStartTime: contract.work_start_time,
        workEndTime: contract.work_end_time,
        breakMinutes: contract.break_minutes,
        workLocation: contract.work_location,
        jobDescription: contract.job_description,
        specialTerms: contract.special_terms,
        payDay: contract.pay_day,
        paymentTiming: (contract.payment_timing as 'current_month' | 'next_month') || 'current_month',
        isLastDayPayment: contract.is_last_day_payment,
        contractType: (contract.contract_type as 'regular' | 'contract') || 'contract',
        businessSize: contract.business_size,
        status: contract.status,
        createdAt: contract.created_at,
        expiresAt: contract.expires_at,
        completedAt: contract.completed_at,
        shareToken: contract.share_token,
        signatures: contract.signatures || [],
        // 민감정보 존재 여부
        hasSensitiveInfo: !!(contract.worker_ssn_encrypted || contract.worker_account_encrypted),
        workerBankName: contract.worker_bank_name,
      }}
      aiReview={
        aiReview
          ? {
              overallStatus: (aiReview.result as { overall_status: string })?.overall_status as 'pass' | 'warning' | 'fail',
              items: (aiReview.result as { items: unknown[] })?.items || [],
            }
          : null
      }
      employerName={profile?.name || ''}
      userId={user.id}
    />
  );
}
