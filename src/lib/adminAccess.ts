import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  FALLBACK_ADMIN_EMAILS,
  adminDecision,
  adminEmailSet,
  normalizeAdminEmail,
} from "@/lib/adminPolicy";

// Re-export the shared allow-list surface so existing importers of these names
// from `@/lib/adminAccess` keep working; the definitions now live in the single
// shared contract (`@/lib/adminPolicy`) that the Edge middleware also uses.
export { FALLBACK_ADMIN_EMAILS, adminEmailSet };

export async function requireAdminAccess(nextPath: string): Promise<{ email: string; allowed: boolean }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = normalizeAdminEmail(data.user?.email);
  const decision = adminDecision(data.user?.email);
  if (decision === "redirect-login") {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return { email, allowed: decision === "allow" };
}
