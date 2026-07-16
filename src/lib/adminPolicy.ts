// Owner/admin authorization contract — the SINGLE source of truth shared by both
// enforcement layers: the Edge middleware (`src/middleware.ts`) and the server
// page guard (`src/lib/adminAccess.ts`). The allow-list parsing, session-email
// normalization, /admin route matching, and the fail-closed decision previously
// lived as duplicate copies in each layer and could silently drift apart (one
// tightening normalization, the other not; one changing the fallback, the other
// not). Concentrating them here makes the two layers provably equivalent by
// construction and keeps the drift verifier (`scripts/verify-admin-policy.ts`)
// meaningful.
//
// This module imports NOTHING so it is safe in the Edge runtime (middleware) and
// on the Node server (page guard) alike. It reads only `process.env` for the
// env-backed helpers; the `*From` variants are pure and take the raw config
// string, so tests can pin the allow-list deterministically without touching
// global env.

// Default allow-list used when neither ADMIN_EMAILS nor ORNSCORE_ADMIN_EMAILS is
// configured. Owner-only contact address; keep in sync with Vercel env docs.
export const FALLBACK_ADMIN_EMAILS = ["contact@ornscore.com"];

// Canonicalize a raw session/user email to its allow-list comparison form.
// Missing (null/undefined) and whitespace-only inputs collapse to "" — callers
// treat "" as "no usable identity" and fail closed (redirect to login).
export function normalizeAdminEmail(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}

// Parse a raw comma/space/newline-separated allow-list config string into a
// normalized Set. Blank/whitespace-only config falls back to
// FALLBACK_ADMIN_EMAILS. Pure — no env access.
export function adminEmailSetFrom(configuredRaw: string | null | undefined): Set<string> {
  const configured = (configuredRaw ?? "")
    .split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const emails = configured.length > 0 ? configured : FALLBACK_ADMIN_EMAILS;
  return new Set(emails.map((email) => email.toLowerCase()));
}

// Env-backed allow-list used by both enforcement layers in production.
export function adminEmailSet(): Set<string> {
  return adminEmailSetFrom(process.env.ADMIN_EMAILS ?? process.env.ORNSCORE_ADMIN_EMAILS ?? "");
}

// True for the owner-only admin surface: the /admin index and everything under
// /admin/. Deliberately does NOT match sibling paths like /administrator.
export function isAdminRoute(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/");
}

// The three fail-closed outcomes both layers enforce on an admin request.
export type AdminDecision = "redirect-login" | "forbidden" | "allow";

// The single fail-closed decision. Pure variant takes the raw allow-list config
// so tests can pin it deterministically:
//   - no usable identity            -> "redirect-login" (send to /login)
//   - identity not on the allow-list -> "forbidden"     (403 / denied view)
//   - identity on the allow-list     -> "allow"
export function adminDecisionFrom(
  rawEmail: string | null | undefined,
  configuredRaw: string | null | undefined,
): AdminDecision {
  const email = normalizeAdminEmail(rawEmail);
  if (!email) return "redirect-login";
  return adminEmailSetFrom(configuredRaw).has(email) ? "allow" : "forbidden";
}

// Env-backed decision used in production by both enforcement layers.
export function adminDecision(rawEmail: string | null | undefined): AdminDecision {
  return adminDecisionFrom(
    rawEmail,
    process.env.ADMIN_EMAILS ?? process.env.ORNSCORE_ADMIN_EMAILS ?? "",
  );
}
