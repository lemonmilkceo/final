import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * 브라우저 환경에서 사용할 Supabase 클라이언트를 생성합니다.
 * Client Component에서만 사용하세요.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
