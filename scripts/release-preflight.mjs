// One documented "release preflight" for OrnScore: the single command a
// maintainer runs to re-certify a branch locally before requesting an
// owner-approved release.
//
// WHY THIS EXISTS
// ---------------
// The repo already has every individual gate (tsc, the Python metrics verifier,
// the analytics-contract verifiers, `next build`, and the route-health
// aggregator `verify:local`). The recurring release mistake is not a missing
// gate -- it is *forgetting one* or running them with the wrong flags. This
// script encodes the correct set and order once so nobody has to remember it.
//
// It runs the deterministic, server-INDEPENDENT gates directly:
//   1. typecheck             npx tsc --noEmit
//   2. verify:metrics        python scripts/verify_metrics.py   (PYTHONUTF8=1)
//   3. verify:route-analytics  sanitized route_view_public classifier contract
//   4. verify:click-analytics  data-analytics-event click contract
//   5. verify:admin-traffic-metrics  future-dashboard boundary vs event map
//   6. build                 next build
//
// The server-DEPENDENT route-health gate (smoke + verify:routes + stocks-seo +
// public-seo + login-preflight + admin-access) is delegated to the existing
// `verify:local` aggregator. Like every verifier in this repo, THIS SCRIPT
// NEVER STARTS OR STOPS A SERVER (protects the always-on AI Center listener on
// :4310). So route-health runs only when you point it at a prod server you
// started yourself, via `--base`.
//
// USAGE (two-phase, one command each)
// -----------------------------------
//   # Phase 1 - offline gates + build (no server needed):
//   npm run release:preflight
//
//   # Phase 2 - start a prod server from the fresh build on a dedicated high
//   # port (NOT 3000 / NOT 4310), then re-run WITH --base to add route-health:
//   npx next start -p 4478
//   npm run release:preflight -- --base http://127.0.0.1:4478 --no-perf
//   # (build auto-skips when --base is given: a running prod server already
//   #  proves the build succeeded. Force it back with --build if you want.)
//
// Flags:
//   --base <url>     also run route-health against this already-running server
//   --no-perf        pass through to verify:local (skip advisory perf timings)
//   --samples <n>    pass through to verify:local (perf sample count)
//   --data <path>    pass through to verify:local (stocks.json for verify:routes)
//   --no-build       skip `next build` (implied when --base is present)
//   --build          force `next build` even when --base is present
//   --offline-only   run offline gates only; do not treat route-health as pending
//
// Exit code: 1 if any real gate that actually ran failed, else 0. When no
// --base is supplied (and not --offline-only) the run still exits 0 on green
// offline gates but prints a clear "ROUTE-HEALTH: NOT RUN" next-step block so a
// maintainer never mistakes a half-preflight for a full one.

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
const NO_PERF = hasFlag("--no-perf");
const SAMPLES = argValue("--samples", null);
const DATA = argValue("--data", null);
const OFFLINE_ONLY = hasFlag("--offline-only");
// Build runs by default, but auto-skips when a server is already up (--base),
// because a running prod server means the build already succeeded. --build
// forces it; --no-build always skips.
const RUN_BUILD = hasFlag("--build") || (!hasFlag("--no-build") && !BASE);

// --- offline (server-independent) gates -------------------------------------
const OFFLINE_GATES = [
  { name: "typecheck", command: "npx", args: ["tsc", "--noEmit"], shell: true },
  {
    name: "verify:metrics",
    command: "python",
    args: ["scripts/verify_metrics.py"],
    shell: true,
    env: { PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" },
  },
  { name: "verify:route-analytics", command: "npm", args: ["run", "verify:route-analytics"], shell: true },
  { name: "verify:click-analytics", command: "npm", args: ["run", "verify:click-analytics"], shell: true },
  { name: "verify:admin-traffic-metrics", command: "npm", args: ["run", "verify:admin-traffic-metrics"], shell: true },
];
if (RUN_BUILD) {
  OFFLINE_GATES.push({ name: "build", command: "npm", args: ["run", "build"], shell: true });
}

function pad(str, width) {
  str = String(str);
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}

function runGate(gate) {
  const banner = `===== ${gate.name} =====`;
  console.log(`\n${banner}`);
  const run = spawnSync(gate.command, gate.args, {
    stdio: "inherit",
    cwd: ROOT,
    shell: gate.shell ?? false,
    env: gate.env ? { ...process.env, ...gate.env } : process.env,
  });
  const code = run.status ?? 1;
  return { name: gate.name, code, failed: code !== 0 };
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
  console.log("OrnScore release preflight (offline code gates + optional local route-health)");
  console.log(
    `build=${RUN_BUILD ? "yes" : "skipped"}  route-health=${BASE ? BASE : OFFLINE_ONLY ? "offline-only" : "NOT RUN (no --base)"}`,
  );

  const results = [];
  for (const gate of OFFLINE_GATES) {
    results.push(runGate(gate));
  }

  // --- route-health (delegated to verify:local; needs a running server) -----
  let routeHealthPending = false;
  if (BASE) {
    if (await reachable(BASE)) {
      const passthrough = ["--base", BASE];
      if (NO_PERF) passthrough.push("--no-perf");
      if (SAMPLES) passthrough.push("--samples", SAMPLES);
      if (DATA) passthrough.push("--data", DATA);
      console.log(`\n===== verify:local (route-health) =====`);
      const run = spawnSync(process.execPath, [resolve(SCRIPTS_DIR, "verify-local.mjs"), ...passthrough], {
        stdio: "inherit",
        cwd: ROOT,
      });
      const code = run.status ?? 1;
      results.push({ name: "verify:local", code, failed: code !== 0 });
    } else {
      console.log(`\nCould not reach ${BASE}/ -- is a local prod server running there?`);
      console.log("Start one from the fresh build: npx next start -p <port>  (NOT 3000 / NOT 4310).");
      results.push({ name: "verify:local", code: 1, failed: true });
    }
  } else if (!OFFLINE_ONLY) {
    routeHealthPending = true;
  }

  // --- aggregate summary ----------------------------------------------------
  console.log(`\n${"=".repeat(50)}`);
  console.log("RELEASE PREFLIGHT SUMMARY");
  console.log("=".repeat(50));
  const header = `${pad("gate", 24)}${pad("exit", 6)}result`;
  console.log(header);
  console.log("-".repeat(header.length));
  for (const r of results) {
    console.log(`${pad(r.name, 24)}${pad(r.code, 6)}${r.failed ? "FAIL" : "OK"}`);
  }
  console.log("");

  const failed = results.filter((r) => r.failed);
  const passed = results.length - failed.length;
  console.log(`Gates: ${passed}/${results.length} passed.`);

  if (failed.length) {
    console.log(`RELEASE PREFLIGHT FAILED (${failed.map((r) => r.name).join(", ")}).`);
    process.exit(1);
  }

  if (routeHealthPending) {
    console.log("");
    console.log("Offline gates PASSED, but ROUTE-HEALTH: NOT RUN (needs a running prod server).");
    console.log("Finish the preflight in two more commands:");
    console.log("  npx next start -p 4478                                             # NOT 3000 / NOT 4310");
    console.log("  npm run release:preflight -- --base http://127.0.0.1:4478 --no-perf");
    console.log("Then stop ONLY that listener you started. Release preflight is complete when this is green too.");
    process.exit(0);
  }

  console.log("RELEASE PREFLIGHT PASSED. All gates green.");
  process.exit(0);
}

main();
