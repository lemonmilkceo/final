import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import ContractDetail from './contract-detail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContractDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        workerName: contract.worker_name,
        hourlyWage: contract.hourly_wage,
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
        businessSize: contract.business_size,
        status: contract.status,
        createdAt: contract.created_at,
        expiresAt: contract.expires_at,
        completedAt: contract.completed_at,
        shareToken: contract.share_token,
        signatures: contract.signatures || [],
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
    />
  );
}
