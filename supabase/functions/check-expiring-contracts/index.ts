// Supabase Edge Function: 만료 임박 계약서 알림
// Cron: 매일 오전 9시 KST (0 0 * * * - UTC 기준)
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
  expires_at: string;
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

    // 내일 만료되는 계약서 조회 (KST 기준)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 내일 00:00:00 ~ 23:59:59 범위
    const tomorrowStart = new Date(tomorrow.toISOString().split('T')[0] + 'T00:00:00Z');
    const tomorrowEnd = new Date(tomorrow.toISOString().split('T')[0] + 'T23:59:59Z');

    const { data: expiringContracts, error: queryError } = await supabase
      .from('contracts')
      .select('id, employer_id, worker_id, worker_name, workplace_name, expires_at')
      .eq('status', 'pending')
      .gte('expires_at', tomorrowStart.toISOString())
      .lte('expires_at', tomorrowEnd.toISOString());

    if (queryError) {
      console.error('Query error:', queryError);
      throw queryError;
    }

    console.log(`Found ${expiringContracts?.length || 0} expiring contracts`);

    const notifications: { user_id: string; type: string; title: string; body: string; data: object }[] = [];

    for (const contract of (expiringContracts || []) as Contract[]) {
      // 사업자에게 알림
      if (contract.employer_id) {
        notifications.push({
          user_id: contract.employer_id,
          type: 'contract_expired_soon',
          title: '서명을 기다리고 있어요 ⏰',
          body: `${contract.worker_name}님의 계약서가 내일 만료돼요`,
          data: { contractId: contract.id },
        });
      }

      // 근로자에게 알림 (worker_id가 있는 경우만)
      if (contract.worker_id) {
        notifications.push({
          user_id: contract.worker_id,
          type: 'contract_expired_soon',
          title: '서명이 필요해요 ⏰',
          body: `내일까지 서명하지 않으면 계약서가 만료돼요`,
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
        message: `Created ${notifications.length} notifications for ${expiringContracts?.length || 0} expiring contracts`,
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
