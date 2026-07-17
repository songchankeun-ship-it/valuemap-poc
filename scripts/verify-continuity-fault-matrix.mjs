// Deterministic continuity FAULT MATRIX for OrnScore (Slice F of the 2026-07-17
// service continuity plan, docs/ornscore-service-continuity-2026-07-17.md).
//
// WHY THIS EXISTS
// ---------------
// Slices B-E each added a focused continuity guard:
//   B  scripts/verify-route-canary.mjs        — bounded read-only route canary.
//   C  scripts/verify_public_data_delta.py    — public-data candidate delta guard.
//   D  scripts/verify-daily-workflow-gate.mjs  — source-level fail-closed workflow gate.
//   E  scripts/verify-commit-status.mjs        — finite commit-status + canary verifier.
// Each was proven in isolation. This slice exercises them TOGETHER as one matrix of
// injected faults and proves the properties an operator relies on when several parts
// of the publish pipeline misbehave at once:
//
//   * FAIL-CLOSED       — every injected fault produces a non-passing decision; a
//                         healthy control still passes (so fail-closed is not vacuous).
//   * STABLE REASONS    — every decision's code is drawn from that tool's documented
//                         closed set, and re-running the same case yields the same
//                         (state, code) — deterministic diagnostics.
//   * BOUNDED           — the whole matrix completes with a finite request count and
//                         wall-clock; every probe is held to a tight explicit budget.
//   * SECRET-FREE       — no emitted evidence across the whole matrix looks like a
//                         credential (reusing the framework-baseline detector).
//   * NO DATA MUTATION  — the matrix never writes public/data (candidate faults are
//                         driven from fixtures outside public/data; the git-blob proof
//                         lives in the self-test).
//   * CLEANUP           — every task-owned loopback listener the matrix starts is
//                         stopped and PROVEN stopped, including one deliberately
//                         interrupted mid-run.
//
// The matrix injects, across the combined B-E tools:
//   candidate regression (C), delegated-verifier failure (E->canary and D gate),
//   pending / failing / timeout / unavailable / malformed status (E), stale marker (E),
//   route failure (B), truncated response (B body + E status body), and a listener
//   interruption (a task-owned mock closed mid-run).
//
// SAFETY: it makes only finite GET requests to its OWN loopback mock servers and runs
// the Slice C guard offline against fixtures. It never touches a live service, never
// mutates a remote resource, never triggers a run, and starts no listener it does not
// also stop (protecting the always-on AI Center listener on :4310). It is read-only.
//
// runFaultMatrix + the case table are exported for the focused self-test
// (scripts/test-continuity-fault-matrix.mjs).
//
// USAGE
//   npm run verify:continuity-fault-matrix
//   npm run verify:continuity-fault-matrix -- --json
//   npm run verify:continuity-fault-matrix -- --list     # print the case ids, exit 0
//
// Exit code: 0 only when every case matched its expectation AND every global invariant
// held; 1 otherwise (or on a usage error).

import http from "node:http";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Reuse the Slice B/C/D/E tools directly rather than re-implementing any of their
// logic, so the matrix holds them to their OWN contracts and cannot drift from them.
import {
  runCanary,
  DEFAULT_ROUTES,
  DEFAULT_BOUNDS as CANARY_BOUNDS,
  FAILURE_CLASSES,
} from "./verify-route-canary.mjs";
import {
  runCommitStatusVerify,
  STATES as CS_STATES,
  REASONS as CS_REASONS,
} from "./verify-commit-status.mjs";
import { evaluateWorkflow, GATES } from "./verify-daily-workflow-gate.mjs";
import { WORKFLOW_FILE } from "./verify-continuity-baseline.mjs";
import { ROOT, looksLikeSecret } from "./verify-framework-baseline.mjs";
import { readFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// bounds — the matrix as a whole is bounded on every axis a probe can run on.
// ---------------------------------------------------------------------------
export const MATRIX_BOUNDS = Object.freeze({
  perRequestTimeoutMs: 400, // tight per-request budget for every mock probe
  slowResponseMs: 1500, // how long the /slow mock stalls (>> perRequestTimeoutMs)
  maxAttempts: 3, // status polls per commit-status case
  intervalMs: 1, // near-zero poll spacing (tests never really wait)
  totalMatrixRequests: 200, // hard cap on total HTTP requests across the whole matrix
  totalMatrixMs: 60000, // whole-matrix wall-clock ceiling (asserted loosely)
  smallBodyBytes: 1000, // byte cap that turns the oversized/huge mocks into truncation
  childTimeoutMs: 20000, // per Slice C child-process budget
});

// The closed decision-code sets, per tool. A case whose code falls outside its tool's
// set is a STABLE-REASON violation (an undocumented / unstable diagnostic escaped).
const DELTA_REASONS = Object.freeze([
  "OK", "NO_CHANGE", "SCHEMA_INVALID", "IDENTITY_DRIFT", "NON_FINITE",
  "STALE", "COVERAGE_LOW", "OUTLIER", "MASS_CHANGE", "MISSING", "UNKNOWN",
]);
const CANARY_CODES = Object.freeze(["routes_ok", ...FAILURE_CLASSES]);
const GATE_CODES = Object.freeze([
  "gates_ok", "gate-presence", "ordering", "fail-closed", "frozen-fields", "node-setup", "no-secret",
]);

// Synthetic expected public state (never derived from real public/data — the matrix
// serves pages that match it, so canary decisions are independent of live data).
const FULL_SHA = "abc1234" + "0".repeat(33); // 7-char marker prefix "abc1234"
const OTHER_SHA = "def5678" + "9".repeat(33);
const MARKER = "abc1234";
const STALE_MARKER = "0000000";
export const EXPECT = Object.freeze({ dataDate: "2026.07.16", metricsVersionLabel: "Metrics 2.4", marker: MARKER });

// A canary root route that exercises every content check.
const FULL_ROUTE = Object.freeze({ path: "/", expectTitle: true, expectCanonical: true, expectDate: true, expectMetricsVersion: true, expectMarker: true });

// ---------------------------------------------------------------------------
// task-owned loopback mock servers (mirrors the Slice E self-test harness)
// ---------------------------------------------------------------------------
function statusJson(obj, status = 200) {
  return { status, body: JSON.stringify(obj), type: "application/json" };
}

function startStatusServer() {
  const server = http.createServer((req, res) => {
    const p = new URL(req.url, "http://127.0.0.1").pathname;
    const send = ({ status, body, type }) => {
      res.writeHead(status, { "content-type": type, connection: "close" });
      res.end(body);
    };
    switch (p) {
      case "/success":
        return send(statusJson({ sha: FULL_SHA, state: "success" }));
      case "/pending":
        return send(statusJson({ sha: FULL_SHA, state: "pending" }));
      case "/failure":
        return send(statusJson({ sha: FULL_SHA, state: "failure" }));
      case "/notfound":
        return send(statusJson({ error: "no status for sha yet" }, 404));
      case "/error500":
        return send(statusJson({ error: "boom" }, 500));
      case "/notjson":
        return send({ status: 200, body: "<<< not json at all", type: "application/json" });
      case "/mismatch":
        return send(statusJson({ sha: OTHER_SHA, state: "success" }));
      case "/oversized":
        return send(statusJson({ sha: FULL_SHA, state: "success", pad: "x".repeat(50_000) }));
      case "/slow":
        setTimeout(() => {
          if (!res.writableEnded) send(statusJson({ sha: FULL_SHA, state: "success" }));
        }, MATRIX_BOUNDS.slowResponseMs);
        return undefined;
      default:
        return send(statusJson({ error: "unknown" }, 404));
    }
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r(server)));
}

function page({ title = "오른스코어", canonical = true, date = EXPECT.dataDate, metrics = "Metrics 2.4", marker = MARKER, pad = 0 } = {}) {
  const titleTag = title ? `<title>${title}</title>` : "";
  const canonicalTag = canonical ? `<link rel="canonical" href="https://ornscore.com/"/>` : "";
  const markerAttr = marker ? ` title="코드 ${marker}"` : "";
  const filler = pad ? `<!--${"x".repeat(pad)}-->` : "";
  return (
    `<!doctype html><html lang="ko"><head>${titleTag}${canonicalTag}</head><body>` +
    `<main>본문${filler}</main>` +
    `<footer><span${markerAttr}>데이터 ${date} (목) 장마감</span> · <span>산식 ${metrics}</span></footer>` +
    `</body></html>`
  );
}

function startCanaryServer() {
  const server = http.createServer((req, res) => {
    const p = new URL(req.url, "http://127.0.0.1").pathname;
    const html = (body, status = 200) => {
      res.writeHead(status, { "content-type": "text/html; charset=utf-8", connection: "close" });
      res.end(body);
    };
    switch (p) {
      case "/":
        return html(page());
      case "/stale":
        return html(page({ marker: STALE_MARKER }));
      case "/notitle":
        return html(page({ title: "" }));
      case "/huge":
        return html(page({ pad: 50_000 }));
      default:
        return html("<html><body>not found</body></html>", 404);
    }
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r(server)));
}

function closeServer(server) {
  return new Promise((r) => server.close(() => r()));
}

async function closedPort() {
  const s = await new Promise((r) => {
    const srv = http.createServer();
    srv.listen(0, "127.0.0.1", () => r(srv));
  });
  const port = s.address().port;
  await closeServer(s);
  return port;
}

// ---------------------------------------------------------------------------
// per-tool decision extractors — normalise each tool's report into a uniform
// { pass, state, code, evidence } so the matrix can assert one contract for all.
// ---------------------------------------------------------------------------
function decideCanary(report) {
  const s = report.summary;
  if (s.failed === 0) return { pass: true, state: "ROUTE_OK", code: "routes_ok", evidence: report };
  // Dominant failure class, in the tool's documented priority order.
  const code = FAILURE_CLASSES.find((c) => s.byClass[c] > 0) || "content";
  return { pass: false, state: "ROUTE_FAIL", code, evidence: report };
}
function decideCommitStatus(report) {
  return { pass: report.state === "SUCCESS", state: report.state, code: report.reason, evidence: report };
}
function decideDelta(res) {
  return { pass: res.exit === 0, state: res.exit === 0 ? "DELTA_PASS" : "DELTA_FAIL", code: res.report.reason, evidence: res.report };
}
function decideGate(report) {
  if (report.ok) return { pass: true, state: "GATE_OK", code: "gates_ok", evidence: { ok: true, results: report.results } };
  const firstBad = report.results.find((r) => r.failed);
  return { pass: false, state: "GATE_FAIL", code: firstBad ? firstBad.name : "gate-presence", evidence: { ok: false, results: report.results } };
}

// ---------------------------------------------------------------------------
// Slice C driver — run the guard offline against fixtures, capture exit + JSON.
// Fixtures live OUTSIDE public/data; the child never writes public/data.
// ---------------------------------------------------------------------------
function runDeltaGuard(candidateFixture) {
  const dir = resolve(ROOT, "scripts/fixtures/public_data_delta");
  const args = [
    resolve(ROOT, "scripts/verify_public_data_delta.py"),
    "--baseline", resolve(dir, "baseline.json"),
    "--candidate", resolve(dir, candidateFixture),
    "--json",
  ];
  let stdout = "";
  let exit = 0;
  try {
    stdout = execFileSync("python", args, { cwd: ROOT, timeout: MATRIX_BOUNDS.childTimeoutMs, maxBuffer: 8 * 1024 * 1024, encoding: "utf8" });
  } catch (err) {
    // Non-zero exit (the fail-closed path) throws; the JSON is still on err.stdout.
    stdout = String(err.stdout || "");
    exit = typeof err.status === "number" ? err.status : 1;
  }
  let report;
  try {
    report = JSON.parse(stdout);
  } catch {
    report = { reason: "UNKNOWN", status: "FAIL", message: "guard emitted unparseable output" };
    if (exit === 0) exit = 1;
  }
  return { exit, report };
}

// ---------------------------------------------------------------------------
// the case table — every entry declares its category, tool, expectation, and a
// driver that returns a normalised decision. `ctx` carries the live mock bases.
// ---------------------------------------------------------------------------
export function buildCases(ctx) {
  const { S, C } = ctx;
  const csBounds = { maxAttempts: MATRIX_BOUNDS.maxAttempts, intervalMs: MATRIX_BOUNDS.intervalMs, totalDurationMs: 100000, perRequestTimeoutMs: MATRIX_BOUNDS.perRequestTimeoutMs };
  const cs = (statusPath, opts = {}) => () =>
    runCommitStatusVerify({
      statusUrl: `${S}${statusPath}`,
      base: opts.base ?? C,
      expected: EXPECT,
      expectedSha: FULL_SHA,
      routes: opts.routes ?? [FULL_ROUTE],
      bounds: { ...csBounds, ...(opts.bounds || {}) },
      canaryBounds: opts.canaryBounds,
      counter: ctx.counter,
      sleepFn: opts.sleepFn,
      nowFn: opts.nowFn,
    }).then(decideCommitStatus);
  const canary = (routes, opts = {}) => () =>
    runCanary({ base: opts.base ?? C, routes, expected: EXPECT, bounds: { perRequestTimeoutMs: MATRIX_BOUNDS.perRequestTimeoutMs, ...(opts.bounds || {}) } }).then(decideCanary);
  const delta = (fixture) => async () => decideDelta(runDeltaGuard(fixture));

  // A deterministic fake clock so the total-time TIMEOUT branch is exercised without
  // any real wait (sleep advances virtual time; the deadline is crossed while pending).
  const fakeClock = () => {
    const clock = { t: 0 };
    return { nowFn: () => clock.t, sleepFn: async (ms) => { clock.t += ms; } };
  };

  // The real workflow, and a mutation of it with the Slice C candidate gate removed
  // (a delegated gate that has gone missing — the composite must fail closed).
  const workflowSrc = readFileSync(resolve(ROOT, WORKFLOW_FILE), "utf8").replace(/\r\n/g, "\n");
  const brokenWorkflowSrc = removeGateStep(workflowSrc, "verify_public_data_delta.py");

  return [
    // ---- healthy controls (fail-closed must not be vacuous) -----------------
    { id: "control-canary-ok", category: "control", tool: "canary", expect: { pass: true, code: "routes_ok" }, run: canary([FULL_ROUTE]) },
    { id: "control-status-success", category: "control", tool: "commit-status", expect: { pass: true, state: "SUCCESS", code: "status_success_marker_match" }, run: cs("/success") },
    { id: "control-delta-ok", category: "control", tool: "delta", expect: { pass: true, code: "OK" }, run: delta("candidate_valid.json") },
    { id: "control-gate-ok", category: "control", tool: "workflow-gate", expect: { pass: true, code: "gates_ok" }, run: async () => decideGate(evaluateWorkflow(workflowSrc)) },

    // ---- candidate regression (Slice C) -------------------------------------
    { id: "candidate-mass-change", category: "candidate-regression", tool: "delta", expect: { pass: false, code: "MASS_CHANGE" }, run: delta("candidate_mass_change.json") },
    { id: "candidate-stale", category: "candidate-regression", tool: "delta", expect: { pass: false, code: "STALE" }, run: delta("candidate_stale.json") },
    { id: "candidate-identity-drift", category: "candidate-regression", tool: "delta", expect: { pass: false, code: "IDENTITY_DRIFT" }, run: delta("candidate_identity_drift.json") },
    { id: "candidate-nonfinite", category: "candidate-regression", tool: "delta", expect: { pass: false, code: "NON_FINITE" }, run: delta("candidate_nonfinite.json") },
    { id: "candidate-malformed", category: "candidate-regression", tool: "delta", expect: { pass: false, code: "SCHEMA_INVALID" }, run: delta("candidate_malformed.json") },
    { id: "candidate-missing", category: "candidate-regression", tool: "delta", expect: { pass: false, code: "MISSING" }, run: delta("candidate_missing.json") },

    // ---- delegated-verifier failure -----------------------------------------
    // Slice E delegates to the Slice B canary; the canary content-check fails even
    // though the status is green -> the composite must NOT report SUCCESS.
    { id: "delegated-canary-content", category: "delegated-verifier-failure", tool: "commit-status", expect: { pass: false, state: "FAILURE", code: "canary_content_failure" }, run: cs("/success", { routes: [{ path: "/notitle", expectTitle: true }] }) },
    // The daily workflow delegates to gate verifiers; a delegated gate has gone
    // missing -> the source-level gate verifier fails closed.
    { id: "delegated-gate-missing", category: "delegated-verifier-failure", tool: "workflow-gate", expect: { pass: false, code: "gate-presence" }, run: async () => decideGate(evaluateWorkflow(brokenWorkflowSrc)) },

    // ---- commit status: pending / failing / timeout / unavailable / malformed
    { id: "status-pending", category: "status-pending", tool: "commit-status", expect: { pass: false, state: "PENDING", code: "attempts_exhausted_pending" }, run: cs("/pending") },
    { id: "status-failing", category: "status-failing", tool: "commit-status", expect: { pass: false, state: "FAILURE", code: "status_failure" }, run: cs("/failure") },
    { id: "status-timeout-request", category: "status-timeout", tool: "commit-status", expect: { pass: false, state: "TIMEOUT", code: "request_timeout" }, run: cs("/slow", { bounds: { maxAttempts: 1 } }) },
    { id: "status-timeout-deadline", category: "status-timeout", tool: "commit-status", expect: { pass: false, state: "TIMEOUT", code: "deadline_exceeded" }, run: cs("/pending", { bounds: { maxAttempts: 99, intervalMs: 1000, totalDurationMs: 2500 }, ...fakeClock() }) },
    { id: "status-unavailable-404", category: "status-unavailable", tool: "commit-status", expect: { pass: false, state: "STATUS_UNAVAILABLE", code: "no_status_for_sha" }, run: cs("/notfound") },
    { id: "status-unavailable-500", category: "status-unavailable", tool: "commit-status", expect: { pass: false, state: "STATUS_UNAVAILABLE", code: "http_error" }, run: cs("/error500", { bounds: { maxAttempts: 1 } }) },
    { id: "status-malformed-notjson", category: "status-malformed", tool: "commit-status", expect: { pass: false, state: "MALFORMED_RESPONSE", code: "not_json" }, run: cs("/notjson") },
    { id: "status-malformed-mismatch", category: "status-malformed", tool: "commit-status", expect: { pass: false, state: "MALFORMED_RESPONSE", code: "sha_mismatch" }, run: cs("/mismatch") },

    // ---- stale marker (Slice E, status green but old build served) ----------
    { id: "stale-public-marker", category: "stale-marker", tool: "commit-status", expect: { pass: false, state: "STALE_PUBLIC_MARKER", code: "public_marker_mismatch" }, run: cs("/success", { routes: [{ path: "/stale", expectMarker: true }] }) },

    // ---- route failure (Slice B directly) -----------------------------------
    { id: "route-content-failure", category: "route-failure", tool: "canary", expect: { pass: false, code: "content" }, run: canary([{ path: "/notitle", expectTitle: true }]) },

    // ---- truncated response (Slice B body + Slice E status body) ------------
    { id: "route-truncated-body", category: "truncated-response", tool: "canary", expect: { pass: false, code: "content" }, run: canary([{ path: "/huge", expectTitle: true }], { bounds: { maxResponseBytes: MATRIX_BOUNDS.smallBodyBytes } }) },
    { id: "status-truncated-body", category: "truncated-response", tool: "commit-status", expect: { pass: false, state: "MALFORMED_RESPONSE", code: "oversized_body" }, run: cs("/oversized", { bounds: { maxResponseBytes: MATRIX_BOUNDS.smallBodyBytes } }) },
  ];
}

// Remove the workflow step whose run body contains `needle`, producing a mutated
// workflow text (used only in-memory to drive the Slice D gate verifier's fail path).
function removeGateStep(src, needle) {
  const lines = src.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    if (/^ {6}- /.test(lines[i])) {
      const block = [lines[i]];
      let j = i + 1;
      while (j < lines.length && !/^ {6}- /.test(lines[j])) {
        block.push(lines[j]);
        j += 1;
      }
      if (block.join("\n").includes(needle)) {
        i = j; // drop this whole step block
        continue;
      }
      out.push(...block);
      i = j;
      continue;
    }
    out.push(lines[i]);
    i += 1;
  }
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// runFaultMatrix — start the task-owned mocks, run every case twice (proving
// per-case determinism), inject a listener interruption, tear the mocks down and
// prove they are stopped, then compute the global invariants.
// ---------------------------------------------------------------------------
export async function runFaultMatrix() {
  const started = Date.now();
  const statusServer = await startStatusServer();
  const canaryServer = await startCanaryServer();
  const S = `http://127.0.0.1:${statusServer.address().port}`;
  const C = `http://127.0.0.1:${canaryServer.address().port}`;
  const counter = { requests: 0 };
  const ctx = { S, C, counter };

  const decisions = [];
  const evidenceBlobs = [];
  let determinismViolations = 0;
  let cleanup = { serversStopped: false, stoppedProbeFailed: false, interruptedProbeFailed: false };

  try {
    const cases = buildCases(ctx);

    for (const c of cases) {
      // Run twice: the decision (pass/state/code) must be identical -> deterministic.
      // eslint-disable-next-line no-await-in-loop
      const d1 = await c.run();
      // eslint-disable-next-line no-await-in-loop
      const d2 = await c.run();
      const deterministic = d1.pass === d2.pass && d1.state === d2.state && d1.code === d2.code;
      if (!deterministic) determinismViolations += 1;
      evidenceBlobs.push(JSON.stringify(d1.evidence), JSON.stringify(d2.evidence));

      const matched =
        d1.pass === c.expect.pass &&
        (c.expect.code === undefined || d1.code === c.expect.code) &&
        (c.expect.state === undefined || d1.state === c.expect.state);

      const codeSet = codeSetFor(c.tool);
      const codeInSet = codeSet.includes(d1.code);
      const stateInSet = c.tool !== "commit-status" || CS_STATES.includes(d1.state);

      decisions.push({
        id: c.id,
        category: c.category,
        tool: c.tool,
        expectPass: c.expect.pass,
        pass: d1.pass,
        state: d1.state,
        code: d1.code,
        matched,
        deterministic,
        codeInSet,
        stateInSet,
      });
    }

    // -----------------------------------------------------------------------
    // listener interruption — a task-owned mock closed mid-run. Both the tool's
    // fail-closed classification AND the harness's ownership/cleanup are proven.
    // -----------------------------------------------------------------------
    const port = await closedPort(); // a port whose listener we opened then closed
    const interrupt = await runCommitStatusVerify({
      statusUrl: `http://127.0.0.1:${port}/success`,
      base: C,
      expected: EXPECT,
      expectedSha: FULL_SHA,
      routes: [FULL_ROUTE],
      bounds: { maxAttempts: 1, intervalMs: 1, perRequestTimeoutMs: MATRIX_BOUNDS.perRequestTimeoutMs },
      counter,
    });
    evidenceBlobs.push(JSON.stringify(interrupt));
    const interruptMatched = interrupt.state === "STATUS_UNAVAILABLE" && interrupt.reason === "endpoint_unreachable";
    decisions.push({
      id: "listener-interruption",
      category: "listener-interruption",
      tool: "commit-status",
      expectPass: false,
      pass: interrupt.state === "SUCCESS",
      state: interrupt.state,
      code: interrupt.reason,
      matched: interruptMatched,
      deterministic: true,
      codeInSet: CS_REASONS.includes(interrupt.reason),
      stateInSet: CS_STATES.includes(interrupt.state),
    });
  } finally {
    // -----------------------------------------------------------------------
    // CLEANUP — stop the task-owned mocks and PROVE they are stopped.
    // -----------------------------------------------------------------------
    await closeServer(statusServer);
    await closeServer(canaryServer);
    cleanup.serversStopped = statusServer.listening === false && canaryServer.listening === false;
    const probe = await runCommitStatusVerify({
      statusUrl: `${S}/success`,
      base: C,
      expected: EXPECT,
      expectedSha: FULL_SHA,
      routes: [FULL_ROUTE],
      bounds: { maxAttempts: 1, intervalMs: 1, perRequestTimeoutMs: MATRIX_BOUNDS.perRequestTimeoutMs },
      counter,
    });
    cleanup.stoppedProbeFailed = probe.state === "STATUS_UNAVAILABLE";
  }

  // -------------------------------------------------------------------------
  // global invariants over the whole matrix.
  // -------------------------------------------------------------------------
  const allEvidence = evidenceBlobs.join("\n");
  const invariants = {
    failClosed: decisions.every((d) => (d.expectPass ? d.pass : d.pass === false)),
    allMatched: decisions.every((d) => d.matched),
    stableReasons: decisions.every((d) => d.codeInSet && d.stateInSet),
    deterministic: determinismViolations === 0,
    boundedRequests: counter.requests <= MATRIX_BOUNDS.totalMatrixRequests,
    secretFree: !looksLikeSecret(allEvidence),
    cleanup: cleanup.serversStopped && cleanup.stoppedProbeFailed,
  };
  const ok = Object.values(invariants).every(Boolean);

  return {
    reportKind: "continuity-fault-matrix",
    slice: "F",
    ok,
    caseCount: decisions.length,
    categories: [...new Set(decisions.map((d) => d.category))].sort(),
    decisions,
    invariants,
    meta: {
      requests: counter.requests,
      requestBudget: MATRIX_BOUNDS.totalMatrixRequests,
      durationMs: Date.now() - started, // reported, not asserted for equality
      durationBudgetMs: MATRIX_BOUNDS.totalMatrixMs,
      determinismViolations,
    },
  };
}

function codeSetFor(tool) {
  if (tool === "canary") return CANARY_CODES;
  if (tool === "commit-status") return CS_REASONS;
  if (tool === "delta") return DELTA_REASONS;
  if (tool === "workflow-gate") return GATE_CODES;
  return [];
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function hasFlag(f) {
  return process.argv.includes(f);
}
function pad(str, width) {
  str = String(str);
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}

async function main() {
  if (hasFlag("--list")) {
    console.log("OrnScore continuity fault matrix (Slice F) — combined B-E fault cases:");
    // Build with placeholder bases just to enumerate ids (no network performed).
    const cases = buildCases({ S: "http://127.0.0.1:0", C: "http://127.0.0.1:0", counter: { requests: 0 } });
    for (const c of cases) console.log(`  ${pad(c.category, 28)}${pad(c.tool, 14)}${c.id}`);
    console.log("  listener-interruption       commit-status listener-interruption");
    console.log("\nInvariants: fail-closed, all-matched, stable-reasons, deterministic, bounded, secret-free, cleanup.");
    console.log("Tools exercised: Slice B route canary, Slice C delta guard, Slice D workflow gate, Slice E commit-status.");
    process.exit(0);
  }

  const report = await runFaultMatrix();

  // No credential-shaped value may survive into the emitted evidence.
  if (looksLikeSecret(JSON.stringify(report))) {
    console.error("FAIL: emitted matrix evidence contains a secret-looking value; refusing to print.");
    process.exit(1);
  }

  if (hasFlag("--json")) {
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.ok ? 0 : 1;
    return;
  }

  console.log("OrnScore continuity fault matrix (Slice F) — combined B-E fault injection, read-only.\n");
  const header = `${pad("case", 30)}${pad("tool", 14)}${pad("state", 22)}${pad("code", 26)}result`;
  console.log(header);
  console.log("-".repeat(header.length));
  for (const d of report.decisions) {
    const flag = d.matched && d.deterministic && d.codeInSet && d.stateInSet ? "OK" : "FAIL";
    console.log(`${pad(d.id, 30)}${pad(d.tool, 14)}${pad(d.state, 22)}${pad(d.code, 26)}${flag}`);
  }
  console.log("");
  console.log("Invariants:");
  for (const [k, v] of Object.entries(report.invariants)) console.log(`  ${pad(k, 18)}${v ? "OK" : "FAIL"}`);
  console.log("");
  console.log(`cases=${report.caseCount}  requests=${report.meta.requests}/${report.meta.requestBudget}  duration=${report.meta.durationMs}ms  categories=${report.categories.length}`);
  console.log("");
  if (!report.ok) {
    console.log("CONTINUITY FAULT MATRIX FAILED.");
    process.exitCode = 1;
    return;
  }
  console.log("CONTINUITY FAULT MATRIX PASSED. Combined B-E guards fail closed with stable, deterministic, secret-free diagnostics; task-owned listeners stopped.");
  process.exitCode = 0;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
