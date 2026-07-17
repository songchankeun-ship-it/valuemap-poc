// One-shot READ-ONLY commit-status verifier for OrnScore (Slice E of the 2026-07-17
// service continuity plan, docs/ornscore-service-continuity-2026-07-17.md).
//
// WHY THIS EXISTS
// ---------------
// After a routine data refresh commits and the hosting platform builds it, an
// operator needs a bounded, evidence-emitting way to answer one question:
//   "Has the hosting commit status for the SHA I just pushed reached success, and
//    is the live public surface actually serving THAT build?"
// This CLI does exactly that, in two ordered phases and nothing more:
//
//   PHASE 1 (status)  — poll an operator-supplied, read-only status URL that reports
//     the hosting commit status for an expected SHA. It waits (bounded) while the
//     status is pending, stops on a terminal status, and never creates or mutates a
//     status. The status JSON contract it reads is minimal and documented below.
//   PHASE 2 (canary)  — ONLY after the status reaches success, it invokes the Slice B
//     route canary (scripts/verify-route-canary.mjs) against the expected public
//     footer build marker (the 7-hex commit prefix the footer surfaces). If the live
//     footer marker is present but wrong, the deploy "succeeded" yet an old build is
//     still served — reported distinctly as STALE_PUBLIC_MARKER.
//
// STATES (exactly seven, deterministic)
//   SUCCESS             — status success AND the canary served the expected marker.
//   PENDING             — the attempts budget was spent while the status was still
//                         pending (poll again later; nothing is wrong yet).
//   FAILURE             — the status reported failure/error, OR the canary confirmed
//                         the public surface is failing/unreachable.
//   TIMEOUT             — a request timed out, or the total-time budget was spent
//                         while waiting for a pending status / the canary timed out.
//   STATUS_UNAVAILABLE  — the status endpoint could not be reached, reported no status
//                         for the SHA, or exhausted the request budget.
//   MALFORMED_RESPONSE  — the status response was not JSON, missing required fields,
//                         reported an unknown state, was for a different SHA, or was
//                         oversized / a bad redirect.
//   STALE_PUBLIC_MARKER — status success but the live footer marker != expected marker
//                         (a stale build is still being served).
//
// Each state carries a granular, deterministic `reason` code (see REASONS below).
//
// STATUS JSON CONTRACT (minimal; the mock fixtures and any real read-only status
// proxy an operator points at must satisfy it):
//   { "sha": "<7-40 hex>", "state": "success|pending|failure|error|..." }
//   `commit`/`commitSha` are accepted as aliases for `sha`; `status` for `state`.
//   Recognised states are normalised: success/ok/passed -> success;
//   pending/in_progress/queued/waiting/running/building -> pending;
//   failure/error/failed/cancelled -> failure; anything else -> MALFORMED_RESPONSE.
//
// BOUNDS: every axis a waiting probe could run away on is finite and explicit —
//   attempts, poll interval, total wall-clock, per-request timeout, redirect hops,
//   response bytes, total request count, and emitted output bytes.
//
// SAFETY: PHASE 1 issues only GET requests to the status URL and PHASE 2 only GETs
// via the route canary. It NEVER triggers a run, creates/updates a status, mutates
// any remote resource, starts a server, or leaves a listener behind. It performs
// finite read-only HTTP only against the URLs the operator supplies. This is an
// operator command; this slice does not wire it into any workflow.
//
// The pure classifiers + pollStatus + runCommitStatusVerify are exported for the
// focused self-test (scripts/test-commit-status.mjs), which drives them against
// task-owned loopback mock HTTP servers — never a live service.
//
// USAGE
//   npm run verify:commit-status -- --status-url http://localhost:4470/status \
//       --base http://localhost:4461 --sha <expected-sha>
//   npm run verify:commit-status -- ... --marker <7-hex> --json
//   npm run verify:commit-status -- --list          # print bounds + states, exit 0
//   VERIFY_STATUS_URL=... VERIFY_BASE_URL=... VERIFY_EXPECT_SHA=... node scripts/verify-commit-status.mjs
//
// Exit code: 0 only when the state is SUCCESS; 1 for every other state or a usage error.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Reuse Slice B's bounded fetch + canary and the framework-baseline secret detector,
// rather than re-implementing any of them, so this verifier is held to the same
// bounds and no-credential-leak bar as every other continuity artifact.
import {
  fetchBounded,
  runCanary,
  buildExpected,
  DEFAULT_ROUTES,
  DEFAULT_BOUNDS as CANARY_BOUNDS,
} from "./verify-route-canary.mjs";
import { looksLikeSecret } from "./verify-framework-baseline.mjs";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// ---------------------------------------------------------------------------
// bounds — every axis a waiting probe could run away on is finite and explicit
// ---------------------------------------------------------------------------
export const DEFAULT_BOUNDS = Object.freeze({
  maxAttempts: 10, // hard cap on status polls
  intervalMs: 5000, // wait between polls (bounded by remaining total time)
  totalDurationMs: 120000, // whole-run wall-clock budget for the status wait
  perRequestTimeoutMs: 8000, // per HTTP request (headers + body) budget
  maxRedirects: 5, // hard transport cap on redirect hops per request
  maxResponseBytes: 1_000_000, // per-response body read cap (status JSON is small)
  maxRequests: 60, // hard cap on total HTTP requests (polls + canary share it)
  maxOutputBytes: 262144, // hard cap on emitted evidence bytes (256 KB)
});

// The seven terminal states this verifier distinguishes.
export const STATES = Object.freeze([
  "SUCCESS",
  "PENDING",
  "FAILURE",
  "TIMEOUT",
  "STATUS_UNAVAILABLE",
  "MALFORMED_RESPONSE",
  "STALE_PUBLIC_MARKER",
]);

// Granular, deterministic reason codes (documentation of the full closed set).
export const REASONS = Object.freeze([
  "status_success_marker_match", // SUCCESS
  "attempts_exhausted_pending", // PENDING
  "status_failure", // FAILURE (status phase)
  "public_unreachable", // FAILURE (canary: public surface unreachable)
  "canary_content_failure", // FAILURE (canary: a content check failed)
  "request_timeout", // TIMEOUT (a status request timed out)
  "deadline_exceeded", // TIMEOUT (total-time budget spent while pending)
  "canary_timeout", // TIMEOUT (canary phase timed out)
  "endpoint_unreachable", // STATUS_UNAVAILABLE (transport error)
  "no_status_for_sha", // STATUS_UNAVAILABLE (endpoint has no status yet)
  "request_budget_exhausted", // STATUS_UNAVAILABLE (request cap hit)
  "http_error", // STATUS_UNAVAILABLE (non-2xx/404 status code)
  "no_observation", // STATUS_UNAVAILABLE (loop ended before any poll)
  "not_json", // MALFORMED_RESPONSE
  "missing_fields", // MALFORMED_RESPONSE
  "sha_mismatch", // MALFORMED_RESPONSE (status is for a different SHA)
  "unknown_state", // MALFORMED_RESPONSE (unrecognised state string)
  "oversized_body", // MALFORMED_RESPONSE (body exceeded byte budget)
  "bad_redirect", // MALFORMED_RESPONSE (unparseable / too many redirects)
  "public_marker_mismatch", // STALE_PUBLIC_MARKER
]);

// ---------------------------------------------------------------------------
// pure helpers (exported for the self-test)
// ---------------------------------------------------------------------------

// Normalise a hosting status string into one of success | pending | failure, or
// null for an unrecognised value (which the caller treats as malformed).
export function normalizeState(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (["success", "ok", "passed", "green", "ready", "completed"].includes(s)) return "success";
  if (["pending", "in_progress", "in-progress", "queued", "waiting", "running", "building", "started"].includes(s)) return "pending";
  if (["failure", "failed", "error", "errored", "red", "cancelled", "canceled"].includes(s)) return "failure";
  return null;
}

// A status is only trustworthy if it is FOR the expected SHA. Accept a prefix match
// in either direction (a full 40-hex status SHA vs a 7-hex expected prefix, etc.).
export function matchSha(expected, actual) {
  const e = String(expected || "").toLowerCase();
  const a = String(actual || "").toLowerCase();
  if (!/^[0-9a-f]{7,40}$/.test(e) || !/^[0-9a-f]{7,40}$/.test(a)) return false;
  const n = Math.min(e.length, a.length);
  return n >= 7 && e.slice(0, n) === a.slice(0, n);
}

// Parse a status response body against the minimal documented contract.
export function parseStatusBody(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, reason: "not_json" };
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return { ok: false, reason: "not_json" };
  const sha = data.sha ?? data.commit ?? data.commitSha;
  const state = data.state ?? data.status;
  if (typeof sha !== "string" || typeof state !== "string") return { ok: false, reason: "missing_fields" };
  return { ok: true, sha, state };
}

// Turn one bounded fetch result into an observation: one of the retryable kinds
// (pending, no_status, unreachable, request_timeout) or a terminal kind
// (success, failure, malformed). `reason` is a deterministic code.
export function classifyPoll(resp, expectedSha) {
  if (resp.outcome === "timeout") return { obs: "request_timeout", reason: "request_timeout" };
  if (resp.outcome === "dns_tls_http") return { obs: "unreachable", reason: "endpoint_unreachable" };
  if (resp.outcome === "content") {
    if (resp.requestBudgetExhausted) return { obs: "unreachable", reason: "request_budget_exhausted" };
    return { obs: "malformed", reason: "bad_redirect" };
  }
  // outcome === "ok"
  if (resp.redirectBudgetExceeded) return { obs: "malformed", reason: "bad_redirect" };
  if (resp.truncated) return { obs: "malformed", reason: "oversized_body" };
  const st = resp.finalStatus;
  if (st === 404 || st === 204) return { obs: "no_status", reason: "no_status_for_sha" };
  if (typeof st !== "number" || st < 200 || st >= 300) return { obs: "unreachable", reason: "http_error" };
  const parsed = parseStatusBody(resp.body || "");
  if (!parsed.ok) return { obs: "malformed", reason: parsed.reason };
  if (!matchSha(expectedSha, parsed.sha)) return { obs: "malformed", reason: "sha_mismatch" };
  const norm = normalizeState(parsed.state);
  if (norm === null) return { obs: "malformed", reason: "unknown_state" };
  return { obs: norm, reason: `status_${norm}` };
}

// Map the loop-exhaustion condition (no terminal observation was reached) onto a
// terminal state + reason, from the LAST retryable observation and why we stopped.
export function mapExhaustion(last, stopCause) {
  if (!last) return { state: "STATUS_UNAVAILABLE", reason: "no_observation" };
  switch (last.obs) {
    case "pending":
      return stopCause === "time"
        ? { state: "TIMEOUT", reason: "deadline_exceeded" }
        : { state: "PENDING", reason: "attempts_exhausted_pending" };
    case "no_status":
      return { state: "STATUS_UNAVAILABLE", reason: "no_status_for_sha" };
    case "unreachable":
      return { state: "STATUS_UNAVAILABLE", reason: last.reason || "endpoint_unreachable" };
    case "request_timeout":
      return { state: "TIMEOUT", reason: stopCause === "time" ? "deadline_exceeded" : "request_timeout" };
    default:
      return { state: "STATUS_UNAVAILABLE", reason: "no_observation" };
  }
}

// Turn a completed canary report into the SUCCESS / STALE_PUBLIC_MARKER / TIMEOUT /
// FAILURE decision. A stale marker takes priority: it is the specific signal this
// whole verifier exists to surface (status green but old build still served).
export function classifyCanary(report) {
  const s = report.summary;
  if (s.failed === 0) return { state: "SUCCESS", reason: "status_success_marker_match" };
  if (s.byClass.stale_marker > 0) return { state: "STALE_PUBLIC_MARKER", reason: "public_marker_mismatch" };
  if (s.byClass.timeout > 0) return { state: "TIMEOUT", reason: "canary_timeout" };
  if (s.byClass.dns_tls_http > 0) return { state: "FAILURE", reason: "public_unreachable" };
  return { state: "FAILURE", reason: "canary_content_failure" };
}

// A real timer sleep (default); the self-test injects a fake clock to exercise the
// total-time branch deterministically without real waits.
const realSleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
const realNow = () => Date.now();

// ---------------------------------------------------------------------------
// PHASE 1: poll the status URL until a terminal status or a spent budget
// ---------------------------------------------------------------------------
export async function pollStatus({ url, expectedSha, bounds, counter, sleepFn = realSleep, nowFn = realNow }) {
  const b = { ...DEFAULT_BOUNDS, ...(bounds || {}) };
  const start = nowFn();
  const observations = [];
  let last = null;
  let attempt = 0;
  let stopCause = "attempts";

  while (attempt < b.maxAttempts) {
    // total-time guard: never spend past the wall-clock budget (but always poll once).
    if (attempt > 0 && nowFn() - start >= b.totalDurationMs) {
      stopCause = "time";
      break;
    }
    attempt += 1;
    // eslint-disable-next-line no-await-in-loop
    const resp = await fetchBounded(url, b, counter);
    const c = classifyPoll(resp, expectedSha);
    last = c;
    observations.push({ attempt, obs: c.obs, reason: c.reason, httpStatus: resp.finalStatus ?? null });

    if (c.obs === "success") return { phase: "status", outcome: "success", attempts: attempt, observations };
    if (c.obs === "failure") return { phase: "status", outcome: "terminal", state: "FAILURE", reason: "status_failure", attempts: attempt, observations };
    if (c.obs === "malformed") return { phase: "status", outcome: "terminal", state: "MALFORMED_RESPONSE", reason: c.reason, attempts: attempt, observations };

    // retryable observation — stop if the attempts budget is spent, else wait.
    if (attempt >= b.maxAttempts) {
      stopCause = "attempts";
      break;
    }
    const remaining = b.totalDurationMs - (nowFn() - start);
    if (remaining <= 0) {
      stopCause = "time";
      break;
    }
    // eslint-disable-next-line no-await-in-loop
    await sleepFn(Math.min(b.intervalMs, remaining));
  }

  const { state, reason } = mapExhaustion(last, stopCause);
  return { phase: "status", outcome: "terminal", state, reason, attempts: attempt, observations };
}

// ---------------------------------------------------------------------------
// orchestrator: status wait, then (only on success) the Slice B canary
// ---------------------------------------------------------------------------
export async function runCommitStatusVerify({
  statusUrl,
  base,
  expected,
  expectedSha,
  routes,
  bounds,
  canaryBounds,
  counter,
  sleepFn,
  nowFn,
}) {
  const b = { ...DEFAULT_BOUNDS, ...(bounds || {}) };
  const sharedCounter = counter || { requests: 0 };

  const poll = await pollStatus({ url: statusUrl, expectedSha, bounds: b, counter: sharedCounter, sleepFn, nowFn });

  if (poll.outcome !== "success") {
    return assembleReport({
      state: poll.state,
      reason: poll.reason,
      phase: "status",
      poll,
      canary: null,
      base,
      statusUrl,
      expected,
      expectedSha,
      bounds: b,
    });
  }

  // Status is success — verify the live surface actually serves the expected marker.
  const canaryReport = await runCanary({
    base,
    routes: routes || DEFAULT_ROUTES,
    expected,
    bounds: { ...CANARY_BOUNDS, ...(canaryBounds || {}) },
  });
  const { state, reason } = classifyCanary(canaryReport);
  return assembleReport({
    state,
    reason,
    phase: "canary",
    poll,
    canary: canaryReport.summary,
    base,
    statusUrl,
    expected,
    expectedSha,
    bounds: b,
  });
}

// Redact any userinfo (http://user:pass@host) from a URL so credentials never reach
// the emitted evidence. Returns the input unchanged if it is not a parseable URL.
export function redactUrl(u) {
  try {
    const url = new URL(u);
    url.username = "";
    url.password = "";
    return url.toString().replace(/\/+$/, "");
  } catch {
    return u;
  }
}

// Build the deterministic (no wall-clock timestamps) evidence object.
function assembleReport({ state, reason, phase, poll, canary, base, statusUrl, expected, expectedSha, bounds }) {
  return {
    reportKind: "commit-status-verify",
    state,
    reason,
    phase,
    ok: state === "SUCCESS",
    expectedSha: String(expectedSha || "").toLowerCase().slice(0, 40),
    expectedMarker: expected ? expected.marker ?? null : null,
    expectedDate: expected ? expected.dataDate ?? null : null,
    statusUrl: redactUrl(statusUrl),
    base: redactUrl(base),
    attempts: poll ? poll.attempts : 0,
    observations: poll ? poll.observations : [],
    canary: canary || null,
    bounds,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i !== -1 && i + 1 < process.argv.length) return process.argv[i + 1];
  return fallback;
}
function hasFlag(f) {
  return process.argv.includes(f);
}
function pad(str, width) {
  str = String(str);
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}
function intArg(flag, fallback) {
  const raw = argValue(flag, undefined);
  if (raw === undefined) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

// Cap the emitted evidence so output cannot run away.
function boundOutput(text, maxBytes) {
  const buf = Buffer.from(text, "utf8");
  if (buf.length <= maxBytes) return text;
  return buf.subarray(0, maxBytes).toString("utf8") + `\n... [output truncated at ${maxBytes} bytes]`;
}

async function main() {
  if (hasFlag("--list")) {
    console.log("OrnScore commit-status verifier — bounded read-only status wait + Slice B canary.");
    console.log("\nStates (exactly seven):");
    for (const s of STATES) console.log(`  ${s}`);
    console.log("\nBounds:");
    for (const [k, v] of Object.entries(DEFAULT_BOUNDS)) console.log(`  ${pad(k, 20)}${v}`);
    console.log("\nStatus JSON contract: { \"sha\": \"<7-40 hex>\", \"state\": \"success|pending|failure|...\" }");
    console.log("Read-only: it never triggers a run or creates/updates a status.");
    process.exit(0);
  }

  const statusUrl = argValue("--status-url", process.env.VERIFY_STATUS_URL);
  const rawBase = argValue("--base", process.env.VERIFY_BASE_URL);
  const rawSha = (argValue("--sha", process.env.VERIFY_EXPECT_SHA) || "").trim().toLowerCase();

  const fail = (msg) => {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  };

  if (!statusUrl) fail("no status URL. Pass --status-url <url> or set VERIFY_STATUS_URL.");
  if (!rawBase) fail("no base URL. Pass --base <url> or set VERIFY_BASE_URL.");
  if (!/^[0-9a-f]{7,40}$/.test(rawSha)) fail(`--sha "${rawSha}" is not a 7-40 char hex commit SHA.`);

  for (const [label, u] of [["--status-url", statusUrl], ["--base", rawBase]]) {
    let parsed;
    try {
      parsed = new URL(u);
    } catch {
      return fail(`${label} "${u}" is not a valid URL.`);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return fail(`${label} must be http(s); got "${parsed.protocol}".`);
  }

  const base = rawBase.replace(/\/+$/, "");
  const marker = (argValue("--marker", process.env.VERIFY_EXPECT_MARKER) || rawSha.slice(0, 7)).trim().toLowerCase();
  if (!/^[0-9a-f]{4,40}$/.test(marker)) fail(`--marker "${marker}" is not a hex commit-sha prefix.`);
  const dataPath = resolve(REPO_ROOT, argValue("--data", "public/data/stocks.json"));
  const asJson = hasFlag("--json");

  const bounds = {
    ...DEFAULT_BOUNDS,
    maxAttempts: intArg("--max-attempts", DEFAULT_BOUNDS.maxAttempts),
    intervalMs: intArg("--interval-ms", DEFAULT_BOUNDS.intervalMs),
    totalDurationMs: intArg("--total-ms", DEFAULT_BOUNDS.totalDurationMs),
  };

  let expected;
  try {
    expected = buildExpected(dataPath, marker);
  } catch (err) {
    return fail(String((err && err.message) || err));
  }

  const report = await runCommitStatusVerify({ statusUrl, base, expected, expectedSha: rawSha, bounds });

  // No credential-shaped value may survive into the emitted evidence.
  if (looksLikeSecret(JSON.stringify(report))) {
    console.error("FAIL: emitted evidence contains a secret-looking value; refusing to print.");
    process.exit(1);
  }

  const maxOut = DEFAULT_BOUNDS.maxOutputBytes;
  if (asJson) {
    console.log(boundOutput(JSON.stringify(report, null, 2), maxOut));
  } else {
    const lines = [];
    lines.push("OrnScore commit-status verifier (one-shot, read-only; exits 0 only on SUCCESS)");
    lines.push(`status=${report.statusUrl}  base=${report.base}  sha=${report.expectedSha.slice(0, 7)}  marker=${report.expectedMarker ?? "-"}  date=${report.expectedDate ?? "-"}`);
    lines.push("");
    lines.push(`${pad("attempt", 9)}${pad("obs", 16)}${pad("http", 6)}reason`);
    lines.push("-".repeat(48));
    for (const o of report.observations) lines.push(`${pad(o.attempt, 9)}${pad(o.obs, 16)}${pad(o.httpStatus ?? "-", 6)}${o.reason}`);
    lines.push("");
    if (report.canary) lines.push(`Canary: ${report.canary.ok}/${report.canary.total} routes OK  by-class: ${Object.entries(report.canary.byClass).map(([c, n]) => `${c}=${n}`).join(" ")}`);
    lines.push("");
    lines.push(`STATE: ${report.state}  (phase=${report.phase}, reason=${report.reason})`);
    console.log(boundOutput(lines.join("\n"), maxOut));
  }

  // Set the exit code and RETURN rather than process.exit(): letting the event loop
  // drain lets undici tear down its sockets cleanly (a hard exit mid-teardown trips a
  // libuv handle assertion on Windows). No listener is held open, so the loop drains.
  process.exitCode = report.state === "SUCCESS" ? 0 : 1;
}

// Only run main when invoked directly (not when imported by the self-test).
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
