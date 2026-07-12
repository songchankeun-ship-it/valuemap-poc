import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const FALLBACK_ADMIN_EMAILS = ["contact@ornscore.com"];

export function adminEmailSet(): Set<string> {
  const configured = (process.env.ADMIN_EMAILS ?? process.env.ORNSCORE_ADMIN_EMAILS ?? "")
    .split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const emails = configured.length > 0 ? configured : FALLBACK_ADMIN_EMAILS;
  return new Set(emails.map((email) => email.toLowerCase()));
}

export async function requireAdminAccess(nextPath: string): Promise<{ email: string; allowed: boolean }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.trim().toLowerCase();
  if (!email) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return { email, allowed: adminEmailSet().has(email) };
}
