// One finite "service-continuity baseline" verifier for OrnScore (Slice A of the
// 2026-07-17 service continuity plan, docs/ornscore-service-continuity-2026-07-17.md).
//
// WHY THIS EXISTS
// ---------------
// The continuity batch hardens the routine data-refresh + publish pipeline. Before
// any later slice adds a candidate-delta guard or a fail-closed workflow gate, we
// must FREEZE the operational invariants those slices must preserve so drift is
// provable from committed evidence alone:
//   * the exact daily workflow contract (schedule, permissions, concurrency,
//     ordered steps, data-generation commands, commit paths, bot identity, push),
//   * the public-data Git blob identities (stocks.json / prices / market-alerts,
//     plus the public/data tree — the frozen 138-stock output),
//   * the bounded public route canary set (sourced from verify-routes.mjs so it
//     can never silently diverge from the real route gate),
//   * the public footer build-marker contract (commit SHA surfaced in the footer),
//   * the Metrics 2.4 version + 138-stock universe contract,
//   * the frozen login/auth source paths (Naver review pending — must not move).
//
// This script is BOTH:
//   (1) a generator (`--generate`) that writes the deterministic baseline artifact
//       once from real repo + Git evidence, and
//   (2) a verifier (default) that (a) recomputes the deterministic facts and fails
//       if the committed baseline is STALE, (b) validates the recorded evidence for
//       hard invariants + no leaked secrets, (c) cross-checks every route canary
//       against the real source routes, and (d) ORCHESTRATES the existing offline
//       Metrics / routes / SEO / release / framework verifiers instead of copying
//       any of their logic.
//
// It is SERVER-INDEPENDENT and NETWORK-INDEPENDENT: it never starts a server
// (protects the always-on AI Center listener on :4310) and performs only finite,
// offline work (repo reads + `git` object lookups + bounded child gates). It does
// NOT change runtime code or the workflow — it only reads them.
//
// It deliberately REUSES the framework-baseline helpers (computeSourceRoutes,
// diffFacts, looksLikeSecret, aggregate) rather than re-implementing route
// discovery, deterministic diffing, secret detection, or verdict aggregation.
//
// USAGE
// -----
//   npm run verify:continuity-baseline                 # freshness + integrity + route cross-check + orchestrated gates
//   npm run verify:continuity-baseline -- --freeze-only # only the pure in-process checks (no child gates)
//   npm run verify:continuity-baseline -- --list       # print the orchestrated gate map and exit 0
//   node scripts/verify-continuity-baseline.mjs --generate   # (re)write the baseline artifact from live evidence
//
// Exit code: 1 if the baseline is stale, an invariant/secret check fails, a route
// canary has no source route, or any orchestrated gate failed; else 0.
//
// The pure helpers are exported for the focused self-test
// (scripts/test-continuity-baseline.mjs).

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ROOT,
  computeSourceRoutes,
  diffFacts,
  looksLikeSecret,
  aggregate,
} from "./verify-framework-baseline.mjs";

// Re-export the reused generic helpers so the focused self-test drives the exact
// same aggregation/diff logic this verifier uses (no second copy).
export { diffFacts, aggregate };

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
export const BASELINE_PATH = join(ROOT, "docs", "ornscore-service-continuity-baseline-2026-07-17.json");

// The tested base this batch descends from (plan §1). Recorded in meta only, never
// in the freshness surface, so an ordinary local commit does not read STALE.
export const TESTED_BASE = "b4ba1e905064a1d9058f0fa6b46e9ff4b92f44fc";

// ---------------------------------------------------------------------------
// small fs / git helpers
// ---------------------------------------------------------------------------
function readText(rel, root = ROOT) {
  return readFileSync(join(root, rel), "utf8");
}
// Strip a UTF-8 BOM so JSON.parse and marker matching behave (stocks.json is
// written utf-8-sig by the Python pipeline).
function readTextNoBom(rel, root = ROOT) {
  const t = readText(rel, root);
  return t.charCodeAt(0) === 0xfeff ? t.slice(1) : t;
}
function git(args, root = ROOT) {
  const run = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  return { status: run.status ?? 1, out: (run.stdout || "").replace(/\r/g, ""), err: run.stderr || "" };
}
function revParse(ref, root = ROOT) {
  const r = git(["rev-parse", ref], root);
  return r.status === 0 ? r.out.trim() : null;
}
// `git ls-tree -r HEAD -- <paths>` -> [{path, sha}] sorted by path.
function lsTreeBlobs(paths, root = ROOT) {
  const r = git(["ls-tree", "-r", "HEAD", "--", ...paths], root);
  if (r.status !== 0) return [];
  const rows = [];
  for (const line of r.out.split("\n")) {
    // "<mode> blob <sha>\t<path>"
    const m = line.match(/^\d+\s+blob\s+([0-9a-f]{40})\t(.+)$/);
    if (m) rows.push({ path: m[2], sha: m[1] });
  }
  rows.sort((a, b) => a.path.localeCompare(b.path));
  return rows;
}
function worktreeClean(paths, root = ROOT) {
  const r = git(["status", "--porcelain", "--", ...paths], root);
  return r.status === 0 && r.out.trim() === "";
}

// ---------------------------------------------------------------------------
// (1) daily workflow contract (.github/workflows/daily-data.yml)
// ---------------------------------------------------------------------------
export const WORKFLOW_FILE = ".github/workflows/daily-data.yml";
export function parseDailyWorkflow(root = ROOT) {
  const src = readText(WORKFLOW_FILE, root);
  const first = (re) => {
    const m = src.match(re);
    return m ? m[1] : null;
  };
  // ordered step names (the only `- name:` entries in the file are steps)
  const stepNames = [];
  const stepRe = /^\s*-\s*name:\s*(.+?)\s*$/gm;
  let sm;
  while ((sm = stepRe.exec(src)) !== null) stepNames.push(sm[1]);
  // ordered data-generation commands (the deterministic pipeline order)
  const pipeline = [];
  const cmdRe = /python\s+(scripts\/[\w./-]+\.py)/g;
  let cm;
  while ((cm = cmdRe.exec(src)) !== null) pipeline.push(cm[1]);
  // commit-and-push contract
  const addLine = first(/git add\s+(.+)/);
  const addPaths = addLine ? addLine.trim().split(/\s+/) : [];
  return {
    file: WORKFLOW_FILE,
    name: first(/^name:\s*(.+?)\s*$/m),
    schedule: first(/-\s*cron:\s*"([^"]+)"/),
    workflowDispatch: /workflow_dispatch:/.test(src),
    permissionsContents: first(/permissions:[\s\S]*?contents:\s*(\w+)/),
    concurrency: {
      group: first(/concurrency:[\s\S]*?group:\s*(\S+)/),
      cancelInProgress: first(/cancel-in-progress:\s*(\w+)/),
    },
    job: {
      runsOn: first(/runs-on:\s*(\S+)/),
      timeoutMinutes: Number(first(/timeout-minutes:\s*(\d+)/)),
    },
    stepNames,
    pipeline,
    commit: {
      addPaths,
      botName: first(/user\.name\s+"([^"]+)"/),
      botEmail: first(/user\.email\s+"([^"]+)"/),
      messagePrefix: first(/git commit -m\s+"([^"$]+)/)?.trim() ?? null,
      pushes: /\bgit push\b/.test(src),
    },
  };
}

// ---------------------------------------------------------------------------
// (2) public-data Git blob identities (the frozen 138-stock output)
// ---------------------------------------------------------------------------
export function computePublicData(root = ROOT) {
  const prices = lsTreeBlobs(["public/data/prices"], root);
  return {
    treeSha: revParse("HEAD:public/data", root),
    stocksJson: revParse("HEAD:public/data/stocks.json", root),
    marketAlerts: revParse("HEAD:public/data/market-alerts.json", root),
    pricesTree: revParse("HEAD:public/data/prices", root),
    pricesFileCount: prices.length,
    worktreeClean: worktreeClean(["public/data"], root),
  };
}

// ---------------------------------------------------------------------------
// (3) bounded public route canary set (sourced from the real route gate)
// ---------------------------------------------------------------------------
export const ROUTE_GATE_FILE = "scripts/verify-routes.mjs";
export function computeRouteCanary(root = ROOT) {
  const src = readText(ROUTE_GATE_FILE, root);
  // Extract the ROUTES array block, then every `path: "..."` inside it, in order.
  const block = src.match(/const ROUTES\s*=\s*\[([\s\S]*?)\n\];/);
  const paths = [];
  if (block) {
    const re = /path:\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(block[1])) !== null) paths.push(m[1]);
  }
  return { source: ROUTE_GATE_FILE, paths };
}

// A canary path (which may carry a concrete param and/or a query) is "covered"
// when it matches a real source page route segment-by-segment ([param] wildcards).
export function matchesSourceRoute(canaryPath, sourcePages) {
  const clean = canaryPath.split("?")[0].replace(/\/+$/, "") || "/";
  const canarySegs = clean === "/" ? [] : clean.slice(1).split("/");
  return sourcePages.some((page) => {
    const p = page.replace(/\/+$/, "") || "/";
    const pageSegs = p === "/" ? [] : p.slice(1).split("/");
    if (pageSegs.length !== canarySegs.length) return false;
    return pageSegs.every((seg, i) => (seg.startsWith("[") && seg.endsWith("]")) || seg === canarySegs[i]);
  });
}
export function uncoveredCanaryRoutes(canary, root = ROOT) {
  const pages = computeSourceRoutes(root).pages;
  return canary.paths.filter((p) => !matchesSourceRoute(p, pages));
}

// ---------------------------------------------------------------------------
// (4) public footer build-marker contract
// ---------------------------------------------------------------------------
export function parseFooterMarker(root = ROOT) {
  const footer = readText("src/components/AppFooter.tsx", root);
  const layout = readText("src/app/layout.tsx", root);
  const layoutSlice = layout.match(/commitSha=\{process\.env\.(\w+)\?\.slice\(0,\s*(\d+)\)\}/);
  return {
    component: "src/components/AppFooter.tsx",
    layout: "src/app/layout.tsx",
    hasCommitShaProp: /commitSha\??:\s*string/.test(footer),
    rendersCodeTitle: /title=\{commitSha\s*\?/.test(footer) && /copy\.footer\.code/.test(footer),
    envVar: layoutSlice ? layoutSlice[1] : null,
    sliceLength: layoutSlice ? Number(layoutSlice[2]) : null,
    passedInLayout: /commitSha=\{process\.env\./.test(layout),
  };
}

// ---------------------------------------------------------------------------
// (5) Metrics 2.4 version + universe contract
// ---------------------------------------------------------------------------
export function computeMetricsContract(root = ROOT) {
  const verifyPy = readText("scripts/verify_metrics.py", root);
  const dataStatus = readText("src/lib/dataStatus.ts", root);
  const stocks = JSON.parse(readTextNoBom("public/data/stocks.json", root));
  const grab = (src, re) => {
    const m = src.match(re);
    return m ? m[1] : null;
  };
  return {
    expectedVersion: grab(verifyPy, /EXPECTED_METRICS_VERSION\s*=\s*"([^"]+)"/),
    dataStatusExpectedVersion: grab(dataStatus, /EXPECTED_METRICS_VERSION\s*=\s*"([^"]+)"/),
    dataVersion: stocks.metricsVersion ?? null,
    universeCount: Array.isArray(stocks.stocks) ? stocks.stocks.length : null,
  };
}

// ---------------------------------------------------------------------------
// (6) frozen login/auth source paths (Naver review pending)
// ---------------------------------------------------------------------------
export const FROZEN_AUTH_PATHS = ["src/app/login", "src/app/auth"];
export function computeFrozenAuth(root = ROOT) {
  const login = lsTreeBlobs(["src/app/login"], root);
  const auth = lsTreeBlobs(["src/app/auth"], root);
  return {
    paths: FROZEN_AUTH_PATHS,
    login,
    auth,
    worktreeClean: worktreeClean(FROZEN_AUTH_PATHS, root),
  };
}

// ---------------------------------------------------------------------------
// the deterministic freshness surface (recomputed + diffed against the artifact)
// ---------------------------------------------------------------------------
export function computeContinuityFacts(root = ROOT) {
  return {
    dailyWorkflow: parseDailyWorkflow(root),
    publicData: computePublicData(root),
    routeCanary: computeRouteCanary(root),
    footerMarker: parseFooterMarker(root),
    metrics: computeMetricsContract(root),
    frozenAuth: computeFrozenAuth(root),
  };
}

// ---------------------------------------------------------------------------
// hard invariant + no-secret validation of the recorded evidence
// ---------------------------------------------------------------------------
export function validateEvidence(facts, root = ROOT) {
  const errors = [];
  const req = (cond, msg) => {
    if (!cond) errors.push(msg);
  };
  const wf = facts.dailyWorkflow || {};
  req(wf.schedule === "0 8 * * 1-5", `dailyWorkflow.schedule ${JSON.stringify(wf.schedule)} != "0 8 * * 1-5"`);
  req(wf.permissionsContents === "write", `dailyWorkflow.permissionsContents ${JSON.stringify(wf.permissionsContents)} != "write"`);
  req(wf.concurrency?.group === "daily-data", `dailyWorkflow.concurrency.group ${JSON.stringify(wf.concurrency?.group)} != "daily-data"`);
  req(wf.concurrency?.cancelInProgress === "false", `dailyWorkflow.concurrency.cancelInProgress ${JSON.stringify(wf.concurrency?.cancelInProgress)} != "false"`);
  req(wf.commit?.botName === "ornscore-bot", `dailyWorkflow.commit.botName ${JSON.stringify(wf.commit?.botName)} != "ornscore-bot"`);
  req(wf.commit?.pushes === true, "dailyWorkflow.commit.pushes is not true");
  req(Array.isArray(wf.commit?.addPaths) && wf.commit.addPaths.includes("public/data/stocks.json"), "dailyWorkflow.commit.addPaths missing public/data/stocks.json");

  const pd = facts.publicData || {};
  req(/^[0-9a-f]{40}$/.test(pd.stocksJson || ""), "publicData.stocksJson is not a 40-hex blob sha");
  req(/^[0-9a-f]{40}$/.test(pd.treeSha || ""), "publicData.treeSha is not a 40-hex tree sha");
  req(pd.pricesFileCount === 138, `publicData.pricesFileCount ${pd.pricesFileCount} != 138`);
  req(pd.worktreeClean === true, "publicData.worktreeClean is not true (public/data has uncommitted edits)");

  const m = facts.metrics || {};
  req(m.expectedVersion === "2.4", `metrics.expectedVersion ${JSON.stringify(m.expectedVersion)} != "2.4"`);
  req(m.dataStatusExpectedVersion === "2.4", `metrics.dataStatusExpectedVersion ${JSON.stringify(m.dataStatusExpectedVersion)} != "2.4"`);
  req(m.dataVersion === "2.4", `metrics.dataVersion ${JSON.stringify(m.dataVersion)} != "2.4"`);
  req(m.universeCount === 138, `metrics.universeCount ${m.universeCount} != 138`);

  const fm = facts.footerMarker || {};
  req(fm.envVar === "VERCEL_GIT_COMMIT_SHA", `footerMarker.envVar ${JSON.stringify(fm.envVar)} != "VERCEL_GIT_COMMIT_SHA"`);
  req(fm.sliceLength === 7, `footerMarker.sliceLength ${fm.sliceLength} != 7`);
  req(fm.hasCommitShaProp === true, "footerMarker.hasCommitShaProp is not true");
  req(fm.passedInLayout === true, "footerMarker.passedInLayout is not true");

  const fa = facts.frozenAuth || {};
  req(Array.isArray(fa.login) && fa.login.length > 0, "frozenAuth.login has no recorded blobs");
  req(Array.isArray(fa.auth) && fa.auth.length > 0, "frozenAuth.auth has no recorded blobs");
  req(fa.worktreeClean === true, "frozenAuth.worktreeClean is not true (login/auth has uncommitted edits)");

  const rc = facts.routeCanary || {};
  req(Array.isArray(rc.paths) && rc.paths.length >= 5, "routeCanary.paths has fewer than 5 routes");
  const uncovered = uncoveredCanaryRoutes(rc, root);
  for (const p of uncovered) errors.push(`routeCanary: "${p}" has no matching source route`);

  // No credential-shaped value may survive into the recorded evidence.
  if (looksLikeSecret(JSON.stringify(facts))) errors.push("evidence contains a secret-looking value");
  return errors;
}

// ---------------------------------------------------------------------------
// orchestrated existing offline gates (reuse, never duplicate) — one per family
// ---------------------------------------------------------------------------
export const DELEGATED_GATES = [
  { family: "metrics", name: "verify:metrics", concern: "Metrics 2.4 + 138-stock snapshot integrity", command: "python", args: ["scripts/verify_metrics.py"], env: { PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" } },
  { family: "routes", name: "verify:first-run-ux", concern: "shared route/nav canon + home H1/CTA surface", command: "npm", args: ["run", "verify:first-run-ux"] },
  { family: "seo", name: "verify:reaudit", concern: "public data + SEO source contracts (Slices A-M)", command: "npm", args: ["run", "verify:reaudit"] },
  { family: "release", name: "release:preflight", concern: "release umbrella (tsc + offline gates)", command: "npm", args: ["run", "release:preflight", "--", "--offline-only", "--no-build"] },
  { family: "framework", name: "verify:framework-baseline", concern: "framework invariant freeze (freshness)", command: "npm", args: ["run", "verify:framework-baseline", "--", "--freshness-only"] },
];

function runGate(gate) {
  console.log(`\n===== ${gate.name} [${gate.family}] — ${gate.concern} =====`);
  const run = spawnSync(gate.command, gate.args, {
    stdio: "inherit",
    cwd: ROOT,
    shell: true,
    env: gate.env ? { ...process.env, ...gate.env } : process.env,
  });
  const code = run.status ?? 1;
  return { name: gate.name, family: gate.family, code, failed: code !== 0 };
}

function pad(str, width) {
  str = String(str);
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}

// ---------------------------------------------------------------------------
// generation: write the deterministic baseline artifact from real evidence
// ---------------------------------------------------------------------------
function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v).sort()) o[k] = canon(v[k]);
    return o;
  }
  return v;
}
function generate() {
  const facts = computeContinuityFacts();
  const evidenceErrors = validateEvidence(facts);
  if (evidenceErrors.length) {
    console.error("Refusing to generate: live evidence fails invariant checks:");
    for (const e of evidenceErrors) console.error(`  · ${e}`);
    process.exit(2);
  }
  const nodeVersion = process.version;
  const gitVersion = git(["--version"]).out.trim() || null;
  const artifact = {
    meta: {
      reportKind: "service-continuity-baseline",
      slice: "A",
      plan: "docs/ornscore-service-continuity-2026-07-17.md",
      testedBase: TESTED_BASE,
      readOnly: true,
      capturedWith: { node: nodeVersion, git: gitVersion },
      note:
        "Deterministic service-continuity invariant baseline (Slice A). The freshness surface " +
        "(dailyWorkflow, publicData, routeCanary, footerMarker, metrics, frozenAuth) is recomputed " +
        "from committed repo files + Git object identities and diffed by verify-continuity-baseline.mjs. " +
        "This script never changes runtime code or the workflow; it only reads them and orchestrates " +
        "the existing offline Metrics/routes/SEO/release/framework gates.",
    },
    facts,
  };
  writeFileSync(BASELINE_PATH, JSON.stringify(canon(artifact), null, 2) + "\n", "utf8");
  console.log(`Wrote ${BASELINE_PATH}`);
  console.log(
    `workflow steps=${facts.dailyWorkflow.stepNames.length} pipeline=${facts.dailyWorkflow.pipeline.length}; ` +
      `public/data tree=${facts.publicData.treeSha?.slice(0, 12)} (${facts.publicData.pricesFileCount} price files); ` +
      `route canary=${facts.routeCanary.paths.length}; metrics v${facts.metrics.dataVersion} universe=${facts.metrics.universeCount}; ` +
      `frozen auth blobs=${facts.frozenAuth.login.length + facts.frozenAuth.auth.length}.`,
  );
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function hasFlag(f) {
  return process.argv.includes(f);
}
function readArtifact() {
  return JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
}

function main() {
  if (hasFlag("--list")) {
    console.log("OrnScore service-continuity baseline — orchestrated offline gates (one per family):");
    for (const g of DELEGATED_GATES) console.log(`  ${pad(g.family, 11)}${pad(g.name, 26)}${g.concern}`);
    console.log("  (plus in-process: baseline freshness, evidence invariants + no-secret, route-canary source cross-check)");
    process.exit(0);
  }
  if (hasFlag("--generate")) {
    generate();
    return;
  }

  const freezeOnly = hasFlag("--freeze-only");
  console.log("OrnScore service-continuity baseline verifier (Slice A) — server- & network-independent.");

  if (!existsSync(BASELINE_PATH)) {
    console.error(`FAIL: baseline artifact missing (${BASELINE_PATH}). Generate it with --generate.`);
    process.exit(1);
  }
  const artifact = readArtifact();
  const results = [];

  // Gate 1 — freshness of the deterministic invariant surface.
  const drift = diffFacts(artifact.facts, computeContinuityFacts());
  if (drift.length) {
    console.log(`\n===== baseline-freshness =====\nSTALE — ${drift.length} drift(s):`);
    for (const d of drift) console.log(`  · ${d}`);
    console.log("Regenerate: node scripts/verify-continuity-baseline.mjs --generate");
  } else {
    console.log("\n===== baseline-freshness =====\nFRESH — workflow, public-data blobs, route canary, footer marker, metrics, and frozen auth all match the committed baseline.");
  }
  results.push({ name: "baseline-freshness", family: "freeze", code: drift.length ? 1 : 0, failed: drift.length > 0 });

  // Gate 2 — hard invariants + no leaked secrets in the recorded evidence.
  const evidenceErrors = validateEvidence(artifact.facts);
  if (evidenceErrors.length) {
    console.log(`\n===== evidence-integrity =====\nINVALID — ${evidenceErrors.length} issue(s):`);
    for (const e of evidenceErrors) console.log(`  · ${e}`);
  } else {
    console.log("\n===== evidence-integrity =====\nOK — Metrics 2.4 + 138 universe, workflow bot/schedule/concurrency, footer marker, frozen auth, and route-canary coverage all hold; no secret-looking values.");
  }
  results.push({ name: "evidence-integrity", family: "freeze", code: evidenceErrors.length ? 1 : 0, failed: evidenceErrors.length > 0 });

  // Gates 3+ — orchestrate the existing offline Metrics/routes/SEO/release/framework gates.
  if (!freezeOnly) {
    for (const gate of DELEGATED_GATES) results.push(runGate(gate));
  }

  // Summary.
  console.log(`\n${"=".repeat(60)}`);
  console.log("SERVICE-CONTINUITY BASELINE SUMMARY");
  console.log("=".repeat(60));
  const header = `${pad("gate", 28)}${pad("family", 11)}${pad("exit", 6)}result`;
  console.log(header);
  console.log("-".repeat(header.length));
  for (const r of results) console.log(`${pad(r.name, 28)}${pad(r.family, 11)}${pad(r.code, 6)}${r.failed ? "FAIL" : "OK"}`);
  console.log("");

  const agg = aggregate(results);
  console.log(`Gates: ${agg.passed}/${agg.total} passed.`);
  if (agg.failed) {
    console.log(`SERVICE-CONTINUITY BASELINE FAILED (${agg.failedNames.join(", ")}).`);
    process.exit(1);
  }
  console.log(
    freezeOnly
      ? "BASELINE FRESHNESS + EVIDENCE INTEGRITY: all green (child gates skipped)."
      : "SERVICE-CONTINUITY BASELINE PASSED. Continuity invariants frozen for later slices.",
  );
  process.exit(0);
}

// Only run main when invoked directly (not when imported by the self-test).
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
