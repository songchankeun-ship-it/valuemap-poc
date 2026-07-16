// Regression guard for the shared operator-diagnostics contract that both
// owner-only admin screens map their server-only reads onto
// (src/lib/adminResourceState.ts).
// Run: npx tsx scripts/verify-admin-resource-state.ts  (exits non-zero on FAIL).
//
// The point of the contract is that FIVE genuinely different operator situations
// — healthy-with-data, configured-but-empty, feature disabled, server capability
// unavailable, and a failed read — must classify to five DISTINCT states with
// distinct labels, so a real outage never reads like a quiet launch day. This
// verifier pins:
//   1. the outcome-union classifier (count boundary, every kind mapped),
//   2. the Supabase-read adapter precedence (disabled > unavailable > failure > count),
//   3. that all five states are reachable and each has a complete, distinct,
//      secret-free label/tone/hint descriptor,
//   4. purity/determinism of the classifier.
// It runs offline with no server, no env, and no network.
import {
  RESOURCE_STATES,
  RESOURCE_STATE_META,
  classifyResourceState,
  classifySupabaseRead,
  isResourceStateNominal,
  resourceStateMeta,
  type ResourceState,
} from "../src/lib/adminResourceState";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}

// --- 1. Outcome-union classifier: every kind + the count boundary -------------

check("ok with a positive count is healthy", classifyResourceState({ kind: "ok", count: 3 }) === "healthy");
check("ok with count 1 is healthy (boundary)", classifyResourceState({ kind: "ok", count: 1 }) === "healthy");
check("ok with count 0 is configured_empty (boundary)", classifyResourceState({ kind: "ok", count: 0 }) === "configured_empty");
check("ok with a negative count is configured_empty, never healthy", classifyResourceState({ kind: "ok", count: -5 }) === "configured_empty");
check("ok with a non-finite count is configured_empty, never healthy", classifyResourceState({ kind: "ok", count: Number.NaN }) === "configured_empty");
check("disabled outcome maps to disabled", classifyResourceState({ kind: "disabled" }) === "disabled");
check("unavailable outcome maps to unavailable", classifyResourceState({ kind: "unavailable" }) === "unavailable");
check("read_failure outcome maps to read_failure", classifyResourceState({ kind: "read_failure" }) === "read_failure");

// Every declared state is produced by at least one outcome (no dead state).
const producible = new Set<ResourceState>([
  classifyResourceState({ kind: "ok", count: 1 }),
  classifyResourceState({ kind: "ok", count: 0 }),
  classifyResourceState({ kind: "disabled" }),
  classifyResourceState({ kind: "unavailable" }),
  classifyResourceState({ kind: "read_failure" }),
]);
check("all five declared states are reachable from the classifier", RESOURCE_STATES.every((s) => producible.has(s)) && producible.size === RESOURCE_STATES.length);

// --- 2. Supabase-read adapter: precedence is load-bearing ---------------------

check("adapter: disabled wins over everything (even a live count)", classifySupabaseRead({ disabled: true, capable: false, failed: true, count: 9 }) === "disabled");
check("adapter: unavailable wins over a failed read and a count", classifySupabaseRead({ capable: false, failed: true, count: 9 }) === "unavailable");
check("adapter: a failed read outranks whatever count came back", classifySupabaseRead({ failed: true, count: 9 }) === "read_failure");
check("adapter: healthy on a live count when capable and not failed", classifySupabaseRead({ count: 9 }) === "healthy");
check("adapter: configured_empty on a zero count", classifySupabaseRead({ count: 0 }) === "configured_empty");
check("adapter: a null count (no rows observed) is configured_empty, not a failure", classifySupabaseRead({ count: null }) === "configured_empty");
check("adapter: capable defaults to true (omitted capable + count is a real read)", classifySupabaseRead({ count: 2 }) === "healthy");
check("adapter: capable:true is explicit-happy path", classifySupabaseRead({ capable: true, count: 0 }) === "configured_empty");
// A disabled feature must NEVER masquerade as an empty table (the core bug).
check("adapter: disabled is distinct from configured_empty for a zero count", classifySupabaseRead({ disabled: true, count: 0 }) !== classifySupabaseRead({ count: 0 }));
// A missing capability must NEVER masquerade as a failed query.
check("adapter: unavailable is distinct from read_failure", classifySupabaseRead({ capable: false }) !== classifySupabaseRead({ failed: true }));

// --- 3. Descriptors: complete, distinct, tone-bounded, secret-free ------------

const TONES = new Set(["ok", "neutral", "warn"]);
for (const state of RESOURCE_STATES) {
  const meta = resourceStateMeta(state);
  check(`meta for "${state}" exists and matches the map`, meta === RESOURCE_STATE_META[state]);
  check(`meta for "${state}" has a non-empty label`, typeof meta.label === "string" && meta.label.trim().length > 0);
  check(`meta for "${state}" has a non-empty hint`, typeof meta.hint === "string" && meta.hint.trim().length > 0);
  check(`meta for "${state}" carries a bounded tone`, TONES.has(meta.tone));
}

// Labels must be pairwise distinct — otherwise two states look identical on screen
// and the whole point (distinguishability) is lost.
const labels = RESOURCE_STATES.map((s) => RESOURCE_STATE_META[s].label);
check("every state label is unique", new Set(labels).size === RESOURCE_STATES.length);
const hints = RESOURCE_STATES.map((s) => RESOURCE_STATE_META[s].hint);
check("every state hint is unique", new Set(hints).size === RESOURCE_STATES.length);

// The map has EXACTLY the declared states — no extra key, none missing.
check("meta keys are exactly the declared states", Object.keys(RESOURCE_STATE_META).sort().join(",") === [...RESOURCE_STATES].sort().join(","));

// Secret-free guarantee: descriptors are fixed copy, so no interpolation markers
// or obvious PII tokens can ride into operator-facing text.
const FORBIDDEN = ["${", "@", "http://", "https://", "select ", "error:"];
for (const state of RESOURCE_STATES) {
  const blob = `${RESOURCE_STATE_META[state].label} ${RESOURCE_STATE_META[state].hint}`.toLowerCase();
  for (const token of FORBIDDEN) {
    check(`descriptor for "${state}" contains no "${token}" (no leaked value)`, !blob.includes(token));
  }
}

// Tone severity: exactly the two nominal states are "ok"/"neutral"; the three
// signal states are "warn". This keeps colour honest — a broken read is never
// tinted the same as a healthy one.
check("healthy tone is ok", RESOURCE_STATE_META.healthy.tone === "ok");
check("configured_empty tone is neutral", RESOURCE_STATE_META.configured_empty.tone === "neutral");
check("disabled tone is neutral", RESOURCE_STATE_META.disabled.tone === "neutral");
check("unavailable tone is warn", RESOURCE_STATE_META.unavailable.tone === "warn");
check("read_failure tone is warn", RESOURCE_STATE_META.read_failure.tone === "warn");

// --- 4. Nominal helper: only healthy + configured_empty are "no action" -------

check("healthy is nominal", isResourceStateNominal("healthy"));
check("configured_empty is nominal", isResourceStateNominal("configured_empty"));
check("disabled is NOT nominal (it is a signal)", !isResourceStateNominal("disabled"));
check("unavailable is NOT nominal", !isResourceStateNominal("unavailable"));
check("read_failure is NOT nominal", !isResourceStateNominal("read_failure"));

// --- 5. Purity / determinism -------------------------------------------------

const before = { kind: "ok", count: 7 } as const;
const snapshot = JSON.stringify(before);
classifyResourceState(before);
check("classifier does not mutate its input", JSON.stringify(before) === snapshot);
check(
  "classifier is deterministic (same input → same output)",
  classifyResourceState({ kind: "ok", count: 7 }) === classifyResourceState({ kind: "ok", count: 7 }),
);
check(
  "adapter is deterministic (same input → same output)",
  classifySupabaseRead({ failed: true, count: 3 }) === classifySupabaseRead({ failed: true, count: 3 }),
);

if (failed > 0) {
  console.error(`admin-resource-state verification FAILED (${failed} check${failed === 1 ? "" : "s"})`);
  process.exit(1);
}
console.log(
  `PASS admin-resource-state: ${RESOURCE_STATES.length} distinct operator states (healthy / configured-empty / disabled / unavailable / read-failure), classifier count boundary, Supabase-read precedence, complete + distinct + secret-free labels, and purity verified`,
);
