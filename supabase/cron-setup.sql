-- ================================================
-- Supabase Edge Function Cron Job 설정
-- Supabase Dashboard > SQL Editor에서 실행하세요
-- 
-- ⚠️ 중요: YOUR_SERVICE_ROLE_KEY를 실제 키로 교체하세요
-- Dashboard > Settings > API > service_role에서 복사
-- ================================================

-- ================================================
-- 만료 임박 알림 (매일 KST 09:00 = UTC 00:00)
-- ================================================
SELECT cron.schedule(
  'check-expiring-contracts-daily',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://nckpzsshpmfzhrdjvtjn.supabase.co/functions/v1/check-expiring-contracts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  ) AS request_id;
  $$
);

-- ================================================
-- 만료 처리 (매일 KST 00:00 = UTC 15:00)
-- ================================================
SELECT cron.schedule(
  'expire-contracts-daily',
  '0 15 * * *',
  $$
  SELECT net.http_post(
    url := 'https://nckpzsshpmfzhrdjvtjn.supabase.co/functions/v1/expire-contracts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  ) AS request_id;
  $$
);

-- ================================================
-- 등록된 Cron Job 확인
-- ================================================
SELECT jobid, jobname, schedule, command FROM cron.job;

-- ================================================
-- Cron Job 삭제가 필요한 경우 (참고용)
-- ================================================
-- SELECT cron.unschedule('check-expiring-contracts-daily');
-- SELECT cron.unschedule('expire-contracts-daily');
