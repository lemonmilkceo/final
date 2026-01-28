// Supabase Edge Function: 만료된 계약서 처리
// Cron: 매일 자정 KST (0 15 * * * - UTC 기준, KST 00:00)
// 설정: Supabase Dashboard > Edge Functions > Schedules

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Contract {
  id: string;
  employer_id: string;
  worker_id: string | null;
  worker_name: string;
  workplace_name: string | null;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Supabase 클라이언트 생성 (Service Role Key 사용)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 만료된 계약서 조회 (현재 시간 기준)
    const now = new Date().toISOString();

    const { data: expiredContracts, error: queryError } = await supabase
      .from('contracts')
      .select('id, employer_id, worker_id, worker_name, workplace_name')
      .eq('status', 'pending')
      .lt('expires_at', now);

    if (queryError) {
      console.error('Query error:', queryError);
      throw queryError;
    }

    console.log(`Found ${expiredContracts?.length || 0} expired contracts`);

    if (!expiredContracts || expiredContracts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No expired contracts found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const contractIds = expiredContracts.map((c: Contract) => c.id);
    const notifications: { user_id: string; type: string; title: string; body: string; data: object }[] = [];

    // 계약서 상태를 'expired'로 업데이트
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'expired',
        updated_at: now,
      })
      .in('id', contractIds);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    // 알림 생성
    for (const contract of expiredContracts as Contract[]) {
      // 사업자에게 알림
      if (contract.employer_id) {
        notifications.push({
          user_id: contract.employer_id,
          type: 'contract_expired',
          title: '계약서가 만료됐어요',
          body: `${contract.worker_name}님의 계약서가 만료됐어요`,
          data: { contractId: contract.id },
        });
      }

      // 근로자에게 알림 (worker_id가 있는 경우만)
      if (contract.worker_id) {
        notifications.push({
          user_id: contract.worker_id,
          type: 'contract_expired',
          title: '계약서가 만료됐어요',
          body: `${contract.workplace_name || '사업장'} 계약서가 만료됐어요`,
          data: { contractId: contract.id },
        });
      }
    }

    // 알림 일괄 생성
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications.map(n => ({
          ...n,
          is_read: false,
        })));

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Expired ${contractIds.length} contracts, created ${notifications.length} notifications`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
