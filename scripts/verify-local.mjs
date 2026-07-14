// One-command local route-health gate for OrnScore.
//
// Runs every route verification script in this repo against a SINGLE
// already-running local prod server and aggregates their exit codes into one
// pass/fail summary. This is the "clearer command path": instead of remembering
// and invoking five separate scripts with the right flags per script, a
// maintainer starts one prod server and runs one command.
//
// It orchestrates only; like every sibling script it NEVER starts or stops a
// server (protects the always-on AI Center listener on :4310). Point it at a
// prod preview you started yourself on a dedicated high port.
//
// Gates run (in order):
//   1. smoke:check --all       (real gate) 25 SSR content-anchor routes
//   2. verify:routes           (real gate) 9 cache-busted public routes + data date
//   3. verify:stocks-seo       (real gate) head robots/canonical contract
//   4. verify:public-seo       (real gate) /sitemap.xml + /robots.txt surface:
//                                          public routes in, private routes out,
//                                          host hygiene, cross-file consistency
//   5. verify:login-preflight  (real gate) SSR-stable /login states
//   6. verify:admin-access     (real gate) owner-only /admin routes redirect
//                                          logged-out visitors to /login
//   7. perf:check              (ADVISORY)  per-route median TTFB / total timings
//
// A non-zero exit from any REAL gate fails the whole run (exit 1). perf:check is
// advisory (always exits 0 itself) and never changes the aggregate result — its
// timings are printed so a maintainer sees slow/fragile routes in the same pass.
//
// Usage:
//   npm run build
//   npx next start -p 4459            # dedicated high port (NOT 3000 / NOT 4310)
//   npm run verify:local -- --base http://localhost:4459
//   # options:
//   npm run verify:local -- --base http://localhost:4459 --samples 5
//   npm run verify:local -- --base http://localhost:4459 --no-perf
//   npm run verify:local -- --base http://localhost:4459 --data ./public/data/stocks.json
//   # env form (flag wins over env):
//   VERIFY_BASE_URL=http://localhost:4459 node scripts/verify-local.mjs

import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));

// --- args -------------------------------------------------------------------
function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i !== -1 && i + 1 < process.argv.length) return process.argv[i + 1];
  return fallback;
}
function hasFlag(flag) {
  return process.argv.includes(flag);
}

const BASE = (
  argValue("--base", process.env.VERIFY_BASE_URL || process.env.SMOKE_BASE_URL || process.env.PERF_BASE_URL) ||
  "http://localhost:4459"
).replace(/\/+$/, "");
const SAMPLES = argValue("--samples", "3");
const DATA = argValue("--data", null);
const SKIP_PERF = hasFlag("--no-perf");

// --- gate list --------------------------------------------------------------
// Each real gate returns exit 1 on any failure; perf is advisory. All accept
// `--base`; only the ones that need extra flags carry them here.
const GATES = [
  { name: "smoke:check --all", script: "smoke-check.mjs", args: ["--all"], advisory: false },
  { name: "verify:routes", script: "verify-routes.mjs", args: DATA ? ["--data", DATA] : [], advisory: false },
  { name: "verify:stocks-seo", script: "verify-stocks-seo.mjs", args: [], advisory: false },
  { name: "verify:public-seo", script: "verify-public-seo.mjs", args: [], advisory: false },
  { name: "verify:login-preflight", script: "verify-login-preflight.mjs", args: [], advisory: false },
  { name: "verify:admin-access", script: "verify-admin-access.mjs", args: [], advisory: false },
  { name: "perf:check", script: "perf-check.mjs", args: ["--samples", SAMPLES], advisory: true },
];

// --- reachability preflight -------------------------------------------------
// One clear message if the server is down, instead of five ERR tables.
async function reachable() {
  try {
    const res = await fetch(`${BASE}/`, { redirect: "manual", headers: { "cache-control": "no-cache" } });
    await res.arrayBuffer().catch(() => {});
    return true;
  } catch {
    return false;
  }
}

function pad(str, width) {
  str = String(str);
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}

async function main() {
  console.log("OrnScore local route-health gate (aggregates every route script; exits 1 on any real-gate failure)");
  console.log(`base=${BASE}  gates=${GATES.filter((g) => !(SKIP_PERF && g.advisory)).length}${SKIP_PERF ? " (perf skipped)" : ""}`);
  console.log("");

  if (!(await reachable())) {
    console.log(`Could not reach ${BASE}/ -- is a local prod server running there?`);
    console.log("Hint: npm run build && npx next start -p <port>   (then re-run with --base http://localhost:<port>)");
    console.log("Do NOT use port 3000 or 4310 (4310 is the always-on AI Center dashboard).");
    process.exit(1);
  }

  const results = [];
  for (const gate of GATES) {
    if (SKIP_PERF && gate.advisory) continue;
    const scriptPath = resolve(SCRIPTS_DIR, gate.script);
    const banner = `===== ${gate.name}${gate.advisory ? " (advisory)" : ""} =====`;
    console.log(`\n${banner}`);
    // eslint-disable-next-line no-await-in-loop -- gates share one server; run serially
    const run = spawnSync(process.execPath, [scriptPath, "--base", BASE, ...gate.args], {
      stdio: "inherit",
    });
    const code = run.status ?? 1;
    // Advisory gates never contribute a failure to the aggregate result.
    const failed = gate.advisory ? false : code !== 0;
    results.push({ name: gate.name, code, advisory: gate.advisory, failed });
  }

  // --- aggregate summary ----------------------------------------------------
  console.log(`\n${"=".repeat(50)}`);
  console.log("LOCAL ROUTE-HEALTH SUMMARY");
  console.log("=".repeat(50));
  const header = `${pad("gate", 26)}${pad("exit", 6)}result`;
  console.log(header);
  console.log("-".repeat(header.length));
  for (const r of results) {
    const result = r.advisory ? "ADVISORY" : r.failed ? "FAIL" : "OK";
    console.log(`${pad(r.name, 26)}${pad(r.code, 6)}${result}`);
  }
  console.log("");

  const realGates = results.filter((r) => !r.advisory);
  const failed = realGates.filter((r) => r.failed);
  const passed = realGates.length - failed.length;
  console.log(`Real gates: ${passed}/${realGates.length} passed.`);

  if (failed.length) {
    console.log(`LOCAL ROUTE-HEALTH FAILED (${failed.map((r) => r.name).join(", ")}).`);
    process.exit(1);
  }
  console.log("LOCAL ROUTE-HEALTH PASSED. All real gates green.");
  process.exit(0);
}

main();
