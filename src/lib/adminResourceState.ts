// Shared, pure operator-diagnostics contract for the owner-only /admin screens.
//
// WHY THIS EXISTS
// ---------------
// /admin/users and /admin/status each perform several SERVER-ONLY reads (Supabase
// Auth admin list, waitlist, per-feature usage tables, data_reports). Before this
// module those reads collapsed into look-alike states: a read that returned no
// rows, a read that FAILED, a missing server capability (service-role env absent),
// and an intentionally-DISABLED feature all rendered as a bare "—" or a generic
// note. An operator could not tell "configured but genuinely empty" from "the read
// broke" from "the env was never set" from "you turned this off" — so a real
// outage read the same as a quiet launch day.
//
// This module fixes the *classification* once, as a closed set of FIVE operator
// states plus one label / tone / hint per state. It performs NO read itself,
// imports nothing (Edge- and Node-safe, deterministic), makes no network or clock
// call, and never carries a private value (email, row contents, raw error text) —
// only the state enum and fixed operator-facing copy. Both admin pages map their
// existing reads onto this contract; scripts/verify-admin-resource-state.ts pins
// the mapping and the labels so the five states can never silently re-collapse.

// The closed set of operator-facing states. Order is the display/severity order
// used by the verifier and the pages (healthy first, hard failures last).
export const RESOURCE_STATES = [
  "healthy",
  "configured_empty",
  "disabled",
  "unavailable",
  "read_failure",
] as const;

export type ResourceState = (typeof RESOURCE_STATES)[number];

// Semantic tone only — each page maps this to its own Tailwind classes (same tone
// vocabulary the existing Stat/UsageCard helpers already use). Keeping the lib to
// a tone enum (not class strings) keeps it pure and unit-testable.
export type ResourceTone = "ok" | "neutral" | "warn";

// What a single server-only read reported, stripped of any private value. This is
// the ONLY input the classifier accepts, so a raw error string / email / row body
// can never ride into the operator-facing state.
export type ResourceReadOutcome =
  | { kind: "ok"; count: number } // read succeeded; count = rows observed (>= 0)
  | { kind: "disabled" } // feature intentionally off (env flag)
  | { kind: "unavailable" } // server capability missing (env absent / client ctor threw)
  | { kind: "read_failure" }; // the read itself errored (missing table / permission)

// Pure classifier over the outcome union. The only judgement it makes is that a
// successful read with a positive row count is "healthy" and a successful read
// with zero rows is "configured_empty" — the distinction the old code lost. A
// non-finite/negative count is treated as the honest empty state, never healthy.
export function classifyResourceState(outcome: ResourceReadOutcome): ResourceState {
  switch (outcome.kind) {
    case "ok":
      return Number.isFinite(outcome.count) && outcome.count > 0 ? "healthy" : "configured_empty";
    case "disabled":
      return "disabled";
    case "unavailable":
      return "unavailable";
    case "read_failure":
      return "read_failure";
    default: {
      // Exhaustiveness guard: a new outcome kind must be handled here explicitly.
      const _exhaustive: never = outcome;
      return _exhaustive;
    }
  }
}

// Convenience adapter: turn a Supabase-style server read into a state in one call.
// Precedence (highest first) is intentional and load-bearing:
//   1. disabled      — an intentionally-off feature never masquerades as "empty".
//   2. unavailable   — a missing server capability never masquerades as a failed
//                      query (env-absent is an operator setup gap, not a bug).
//   3. read_failure  — a query error outranks whatever count/null came back.
//   4. ok(count)     — only then is the honest row count classified.
export function classifySupabaseRead(params: {
  disabled?: boolean;
  capable?: boolean; // server capability present (env configured, client built). default true.
  failed?: boolean; // query returned an error object.
  count?: number | null; // rows observed when the read succeeded.
}): ResourceState {
  if (params.disabled) return classifyResourceState({ kind: "disabled" });
  if (params.capable === false) return classifyResourceState({ kind: "unavailable" });
  if (params.failed) return classifyResourceState({ kind: "read_failure" });
  const count = typeof params.count === "number" && Number.isFinite(params.count) ? params.count : 0;
  return classifyResourceState({ kind: "ok", count });
}

// One operator-facing descriptor per state. All strings are FIXED copy — no
// interpolation of a private value — so rendering a state can never leak a row
// body, an email, or a raw error message. `hint` explains what the operator
// should conclude / do; it is deliberately non-actionable-with-secrets.
export const RESOURCE_STATE_META: Record<ResourceState, { label: string; tone: ResourceTone; hint: string }> = {
  healthy: {
    label: "정상 · 데이터 있음",
    tone: "ok",
    hint: "연결됐고 행이 조회됩니다.",
  },
  configured_empty: {
    label: "연결됨 · 데이터 없음",
    tone: "neutral",
    hint: "테이블은 연결됐지만 아직 행이 없습니다(정상적인 빈 상태).",
  },
  disabled: {
    label: "비활성 · 설정으로 꺼짐",
    tone: "neutral",
    hint: "환경변수 설정으로 이 조회가 꺼져 있습니다(개인정보 보호).",
  },
  unavailable: {
    label: "서버 미구성",
    tone: "warn",
    hint: "서버 환경변수(service role 등)가 없어 조회할 수 없습니다.",
  },
  read_failure: {
    label: "읽기 실패",
    tone: "warn",
    hint: "조회가 실패했습니다(테이블 미생성 또는 권한 확인 필요).",
  },
};

// Lookup helper so a page never indexes the map with an unchecked string.
export function resourceStateMeta(state: ResourceState): { label: string; tone: ResourceTone; hint: string } {
  return RESOURCE_STATE_META[state];
}

// True only for states an operator can safely read as "no action needed": a
// healthy resource or a legitimately empty one. Every other state is a signal
// (turned off, not wired, or broken). Pages use this to decide whether to draw a
// warning affordance without re-deriving the tone.
export function isResourceStateNominal(state: ResourceState): boolean {
  return state === "healthy" || state === "configured_empty";
}
