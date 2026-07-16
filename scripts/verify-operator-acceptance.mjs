// One reproducible "operator acceptance" verifier for OrnScore: the single
// command an operator (or the owner, before a signed-in review) runs to accept
// the administrator surfaces locally, WITHOUT any private value ever entering an
// artifact.
//
// WHY THIS EXISTS
// ---------------
// The repo already ships every individual operator gate — the signed-out admin
// authorization contract (verify:admin-policy), the live logged-out /admin
// redirect + no-leak gate (verify:admin-access), public route health
// (verify:routes), the four analytics-contract verifiers, and the admin
// diagnostic-state coverage gate. What was missing was a single, documented
// grouping that says, in acceptance terms, "these are the checks that must be
// green for an operator to sign off on the admin surfaces, and here is the one
// command that runs them." This script encodes that acceptance set once, maps
// each gate to the acceptance criterion it proves, and prints an acceptance
// matrix — so nobody re-derives the list or forgets a criterion.
//
// It is a THIN ORCHESTRATOR: it never re-implements a check, it spawns the
// existing scripts and aggregates their exit codes. Like every verifier in this
// repo it NEVER STARTS OR STOPS A SERVER (protects the always-on AI Center
// listener on :4310), and it PRINTS NO PRIVATE VALUES — only gate names, exit
// codes, HTTP-level pass/fail already sanitized by the underlying scripts, and
// generic reason strings. All examples in the paired runbook are synthetic.
//
// FIVE SIGNED-OUT ACCEPTANCE CRITERIA (this is what the matrix pins)
// -----------------------------------------------------------------
//   A. Admin routes redirect correctly       — logged-out /admin* → /login?next=…
//   B. Protected markers do not leak          — no admin-only heading in a
//                                               logged-out body
//   C. Public routes remain healthy           — the public surface still 200s with
//                                               its content anchors, no error marker
//   D. Analytics contracts are consistent     — route_view_public + click event +
//                                               traffic metrics/view contracts hold
//   E. Diagnostic states have test coverage   — the five admin resource states stay
//                                               distinct, labeled, and secret-free
//
// Criteria A (offline half) + D + E are SERVER-INDEPENDENT and run in the offline
// phase. Criteria A (live half) + B + C need a running prod server and run only
// when you point this at one you started yourself, via --base — exactly the
// two-phase shape of release:preflight.
//
// WHAT THIS DELIBERATELY CANNOT DO
// --------------------------------
// The AUTHORIZED (signed-in) side — an allow-listed operator actually sees the
// dashboards, a logged-in non-admin is refused (403), and the users/traffic/
// report panels render their ready states over live data — needs a real Supabase
// session + OAuth round-trip + service-role env and remains an OWNER GATE. This
// script prints that signed-in review matrix as a reminder and points at the
// runbook (docs/ornscore-operator-acceptance-runbook.md); it does not fake it.
//
// USAGE (two-phase, one command each — mirrors release:preflight)
// ---------------------------------------------------------------
//   # Phase 1 — offline acceptance contracts (no server needed):
//   npm run verify:operator-acceptance
//
//   # Phase 2 — start a prod server from a fresh build on a dedicated high port
//   # (NOT 3000 / NOT 4310), then re-run WITH --base to add the live route half:
//   npm run build
//   npx next start -p 4479
//   npm run verify:operator-acceptance -- --base http://127.0.0.1:4479
//
// Flags:
//   --base <url>     also run the live half (criteria A-live, B, C) against this
//                    already-running server
//   --offline-only   run offline criteria only; do not treat the live half as
//                    pending (no "NOT RUN" next-step block)
//   --data <path>    pass through to verify:routes (stocks.json for the data-date
//                    freshness assertion)
//
// Exit code: 1 if any acceptance gate that actually ran failed, else 0. Without
// --base (and not --offline-only) it still exits 0 on green offline criteria but
// prints a clear "LIVE ROUTE HALF: NOT RUN" next-step block so an operator never
// mistakes a half-acceptance for a full one.

import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPTS_DIR, "..");

// --- args -------------------------------------------------------------------
function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i !== -1 && i + 1 < process.argv.length) return process.argv[i + 1];
  return fallback;
}
function hasFlag(flag) {
  return process.argv.includes(flag);
}

const BASE_RAW = argValue("--base", process.env.VERIFY_BASE_URL || process.env.SMOKE_BASE_URL || null);
const BASE = BASE_RAW ? BASE_RAW.replace(/\/+$/, "") : null;
const OFFLINE_ONLY = hasFlag("--offline-only");
const DATA = argValue("--data", null);

// --- acceptance gates -------------------------------------------------------
// Each gate names the acceptance criterion it proves and the phase it belongs
// to. Offline gates run via `npm run <name>` (shell); live gates are spawned by
// script path with --base, like verify:local.
const OFFLINE_GATES = [
  {
    criterion: "A. Admin routes redirect correctly (offline authorization contract)",
    name: "verify:admin-policy",
    kind: "npm",
    command: "npm",
    args: ["run", "verify:admin-policy"],
  },
  {
    criterion: "D. Analytics contracts are consistent",
    name: "verify:route-analytics",
    kind: "npm",
    command: "npm",
    args: ["run", "verify:route-analytics"],
  },
  {
    criterion: "D. Analytics contracts are consistent",
    name: "verify:click-analytics",
    kind: "npm",
    command: "npm",
    args: ["run", "verify:click-analytics"],
  },
  {
    criterion: "D. Analytics contracts are consistent",
    name: "verify:admin-traffic-metrics",
    kind: "npm",
    command: "npm",
    args: ["run", "verify:admin-traffic-metrics"],
  },
  {
    criterion: "D. Analytics contracts are consistent",
    name: "verify:admin-traffic-view",
    kind: "npm",
    command: "npm",
    args: ["run", "verify:admin-traffic-view"],
  },
  {
    criterion: "E. Diagnostic states have test coverage",
    name: "verify:admin-resource-state",
    kind: "npm",
    command: "npm",
    args: ["run", "verify:admin-resource-state"],
  },
];

// Live gates need a running prod server (spawned by script path with --base).
const LIVE_GATES = [
  {
    criterion: "A. Admin routes redirect correctly + B. Protected markers do not leak (live)",
    name: "verify:admin-access",
    kind: "node",
    script: "verify-admin-access.mjs",
    args: [],
  },
  {
    criterion: "C. Public routes remain healthy (live)",
    name: "verify:routes",
    kind: "node",
    script: "verify-routes.mjs",
    args: DATA ? ["--data", DATA] : [],
  },
];

// The signed-in review matrix this script CANNOT automate (owner gate). Printed
// as a reminder; the detail lives in the runbook. Every example there is
// synthetic and no private value is ever emitted.
const OWNER_SIGNED_IN_MATRIX = [
  "allowed operator     — allow-listed email sees /admin home + all four dashboards",
  "denied signed-in user — logged-in NON-allow-listed email gets 403 (never a login loop, never content)",
  "users data readiness  — /admin/users renders auth-list + waitlist + usage cards with honest state badges",
  "traffic readiness     — /admin/traffic shows the numeric shell + provider state (ready vs not_configured)",
  "report readiness      — /admin/status report panel reflects its true diagnostic state (not a look-alike empty)",
];

function pad(str, width) {
  str = String(str);
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}

function runGate(gate) {
  const banner = `===== ${gate.name}  [${gate.criterion.split(".")[0]}] =====`;
  console.log(`\n${banner}`);
  let run;
  if (gate.kind === "npm") {
    run = spawnSync(gate.command, gate.args, { stdio: "inherit", cwd: ROOT, shell: true });
  } else {
    const scriptPath = resolve(SCRIPTS_DIR, gate.script);
    run = spawnSync(process.execPath, [scriptPath, "--base", BASE, ...gate.args], { stdio: "inherit", cwd: ROOT });
  }
  const code = run.status ?? 1;
  return { criterion: gate.criterion, name: gate.name, code, failed: code !== 0 };
}

async function reachable(base) {
  try {
    const res = await fetch(`${base}/`, { redirect: "manual", headers: { "cache-control": "no-cache" } });
    await res.arrayBuffer().catch(() => {});
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log("OrnScore operator acceptance verifier (signed-out; aggregates the operator gates; exits 1 on any failure)");
  console.log(`live-route-half=${BASE ? BASE : OFFLINE_ONLY ? "offline-only" : "NOT RUN (no --base)"}`);
  console.log("NOTE: the SIGNED-IN review (allowed operator / denied user / data readiness) remains an OWNER gate.");

  const results = [];
  for (const gate of OFFLINE_GATES) {
    results.push(runGate(gate));
  }

  let liveHalfPending = false;
  if (BASE) {
    if (await reachable(BASE)) {
      for (const gate of LIVE_GATES) {
        // eslint-disable-next-line no-await-in-loop -- gates share one server; run serially
        results.push(runGate(gate));
      }
    } else {
      console.log(`\nCould not reach ${BASE}/ -- is a local prod server running there?`);
      console.log("Start one from a fresh build: npm run build && npx next start -p <port>  (NOT 3000 / NOT 4310).");
      for (const gate of LIVE_GATES) {
        results.push({ criterion: gate.criterion, name: gate.name, code: 1, failed: true });
      }
    }
  } else if (!OFFLINE_ONLY) {
    liveHalfPending = true;
  }

  // --- acceptance matrix (grouped by criterion) -----------------------------
  console.log(`\n${"=".repeat(60)}`);
  console.log("OPERATOR ACCEPTANCE MATRIX (signed-out, automated)");
  console.log("=".repeat(60));
  const header = `${pad("gate", 30)}${pad("exit", 6)}result`;
  console.log(header);
  console.log("-".repeat(header.length));
  // Print in a stable criterion order (A, C, D, E; live rows appear once run).
  for (const r of results) {
    console.log(`${pad(r.name, 30)}${pad(r.code, 6)}${r.failed ? "FAIL" : "OK"}`);
  }
  console.log("");

  const failed = results.filter((r) => r.failed);
  const passed = results.length - failed.length;
  console.log(`Acceptance gates: ${passed}/${results.length} passed.`);

  if (failed.length) {
    console.log(`OPERATOR ACCEPTANCE FAILED (${failed.map((r) => r.name).join(", ")}).`);
    process.exitCode = 1;
    return;
  }

  // --- owner signed-in reminder (never automated here) ----------------------
  console.log("");
  console.log("OWNER SIGNED-IN REVIEW MATRIX (NOT automatable here — needs a real session + service-role env):");
  for (const line of OWNER_SIGNED_IN_MATRIX) console.log(`  - ${line}`);
  console.log("  Steps + synthetic examples: docs/ornscore-operator-acceptance-runbook.md");

  if (liveHalfPending) {
    console.log("");
    console.log("Offline acceptance PASSED, but LIVE ROUTE HALF: NOT RUN (needs a running prod server).");
    console.log("Finish acceptance in three more commands:");
    console.log("  npm run build");
    console.log("  npx next start -p 4479                                                      # NOT 3000 / NOT 4310");
    console.log("  npm run verify:operator-acceptance -- --base http://127.0.0.1:4479");
    console.log("Then stop ONLY that listener you started. Acceptance is complete when the live half is green too.");
    process.exitCode = 0;
    return;
  }

  console.log("");
  console.log("OPERATOR ACCEPTANCE PASSED. All signed-out acceptance gates green.");
  process.exitCode = 0;
}

main();
