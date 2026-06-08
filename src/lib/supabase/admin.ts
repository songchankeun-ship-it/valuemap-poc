import { createClient } from "@supabase/supabase-js";

/**
 * Service Role 기반 Supabase 클라이언트.
 *
 * **서버 사이드 전용** — 절대 클라이언트 컴포넌트나 브라우저에서 import 하지 말 것.
 * 모든 RLS를 우회하므로 cron job, admin route 등 서버 환경에서만 사용.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
