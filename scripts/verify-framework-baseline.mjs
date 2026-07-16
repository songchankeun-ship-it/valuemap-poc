// One finite "framework-migration baseline" verifier for OrnScore (Slice A of the
// 2026-07-16 framework security hardening plan, docs/ornscore-framework-security-
// hardening-2026-07-16.md).
//
// WHY THIS EXISTS
// ---------------
// The batch upgrades Next (14.2.13 -> 15.5.16) and React (18 -> 19) to clear the
// current production `next` critical audit finding without `--force`. Before any
// package moves, we must freeze the invariants the migration MUST preserve so a
// later slice can prove nothing drifted:
//   * exact runtime (production) dependency versions,
//   * the current `npm audit --omit=dev` production findings,
//   * the Edge middleware boundary (matcher + admin enforcement),
//   * the source route inventory (which routes exist, which are parameterized),
//   * the build's static/dynamic route classification.
//
// This script is BOTH:
//   (1) a generator (`--generate`) that writes the deterministic baseline
//       artifact once from real repo + audit + build evidence, and
//   (2) a verifier (default) that (a) recomputes the deterministic repo facts and
//       fails if the committed baseline is STALE, (b) validates the recorded
//       production-audit block for internal consistency and no leaked secrets,
//       (c) cross-checks the recorded build route classification against the
//       local `.next` manifests when a build is present, and (d) ORCHESTRATES the
//       existing offline route / admin / SEO / data / analytics / Metrics 2.4
//       contract verifiers instead of re-implementing any of their logic.
//
// It is SERVER-INDEPENDENT and NETWORK-INDEPENDENT in verify mode: it never
// starts a server (protects the always-on AI Center listener on :4310) and never
// calls `npm audit` itself. The audit evidence is captured once at generation
// time from a supplied `npm audit --omit=dev --json` file. Build, route-health,
// and local production verification remain the job of `release:preflight` /
// `verify:local`.
//
// USAGE
// -----
//   npm run verify:framework-baseline                 # freshness + audit-block + build cross-check + orchestrated gates
//   npm run verify:framework-baseline -- --freshness-only   # only the pure in-process baseline checks (no child gates)
//   npm run verify:framework-baseline -- --list       # print the orchestrated gate map and exit 0
//   node scripts/verify-framework-baseline.mjs --generate --audit <audit.json>  # (re)write the baseline artifact
//
// Exit code: 1 if the baseline is stale, the audit block is inconsistent, the
// build classification drifted, or any orchestrated gate failed; else 0.
//
// The pure helpers (computeRepoFacts / diffFacts / validateAuditBlock /
// aggregate / computeBuildClassification) are exported for the focused self-test
// (scripts/test-framework-baseline.mjs).

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(SCRIPTS_DIR, "..");
export const BASELINE_PATH = join(ROOT, "docs", "ornscore-framework-migration-baseline-2026-07-16.json");

// The migration target is bounded to Next 15.5.16 + React 19. Next 16 changes the
// build default and the middleware/proxy contract and is deferred (plan §1/§5).
export const MIGRATION_TARGET = { next: "15.5.16", react: "19", note: "Next 16 deferred (plan §5)" };

// ---------------------------------------------------------------------------
// small fs/json helpers
// ---------------------------------------------------------------------------
function readText(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}
function readJson(absOrRel) {
  const p = absOrRel.includes(":") || absOrRel.startsWith("/") ? absOrRel : join(ROOT, absOrRel);
  return JSON.parse(readFileSync(p, "utf8"));
}

// Deterministic canonical JSON (sorted keys) so equal facts stringify equally.
function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v).sort()) o[k] = canon(v[k]);
    return o;
  }
  return v;
}
function stable(v) {
  return JSON.stringify(canon(v));
}

// ---------------------------------------------------------------------------
// (1) runtime (production) dependency versions
// ---------------------------------------------------------------------------
export function computeRuntimeDependencies(root = ROOT) {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
  const declared = {};
  const resolvedVersions = {};
  for (const name of Object.keys(pkg.dependencies || {}).sort()) {
    declared[name] = pkg.dependencies[name];
    const node = (lock.packages || {})[`node_modules/${name}`];
    resolvedVersions[name] = node ? node.version : null;
  }
  return { declared, resolved: resolvedVersions, lockfileVersion: lock.lockfileVersion ?? null };
}

// ---------------------------------------------------------------------------
// (2) middleware boundary (matcher + admin enforcement markers)
// ---------------------------------------------------------------------------
export function parseMiddlewareBoundary(root = ROOT) {
  const file = "src/middleware.ts";
  const src = readFileSync(join(root, file), "utf8");
  // Extract the matcher array literal source exactly as authored (stable).
  const block = src.match(/matcher\s*:\s*\[([\s\S]*?)\]/);
  const matcher = [];
  if (block) {
    const re = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g;
    let m;
    while ((m = re.exec(block[1])) !== null) matcher.push(m[1] ?? m[2]);
  }
  return {
    file,
    matcher,
    sharedPolicyModule: "src/lib/adminPolicy.ts",
    adminEnforcement: {
      usesSharedPolicy: /from\s+["']@\/lib\/adminPolicy["']/.test(src),
      guardsAdminRoute: src.includes("isAdminRoute("),
      redirectLogin: src.includes('"redirect-login"'),
      forbidden403: src.includes("status: 403") || src.includes('"forbidden"'),
    },
  };
}

// ---------------------------------------------------------------------------
// (3) source route inventory (deterministic from src/app, no build needed)
// ---------------------------------------------------------------------------
const ROUTE_LEAF = /^(page|route)\.(tsx|ts|jsx|js)$/;
const METADATA_LEAF = /^(sitemap|robots|manifest|opengraph-image|twitter-image|icon|apple-icon)\.(tsx|ts|jsx|js|svg|png|ico)$/;

function appPathFromDir(absDir, appRoot) {
  const rel = absDir.slice(appRoot.length).replace(/\\/g, "/");
  // strip route groups "(group)" which do not affect the URL
  const url = rel.replace(/\/\([^/]+\)/g, "");
  return url === "" ? "/" : url;
}

export function computeSourceRoutes(root = ROOT) {
  const appRoot = join(root, "src", "app");
  const pages = new Set();
  const routeHandlers = new Set();
  const metadataRoutes = new Set();
  function walk(absDir) {
    const entries = readdirSync(absDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        walk(join(absDir, e.name));
      } else if (ROUTE_LEAF.test(e.name)) {
        const kind = e.name.startsWith("page") ? "page" : "route";
        const urlPath = appPathFromDir(absDir, appRoot);
        (kind === "page" ? pages : routeHandlers).add(urlPath);
      } else if (METADATA_LEAF.test(e.name)) {
        const base = e.name.replace(/\.[^.]+$/, "");
        const urlPath = appPathFromDir(absDir, appRoot);
        metadataRoutes.add(urlPath === "/" ? `/${base}` : `${urlPath}/${base}`);
      }
    }
  }
  walk(appRoot);
  const sortArr = (s) => [...s].sort();
  const all = [...pages, ...routeHandlers];
  const parameterized = sortArr(new Set(all.filter((p) => p.includes("["))));
  return {
    count: pages.size + routeHandlers.size,
    pages: sortArr(pages),
    routeHandlers: sortArr(routeHandlers),
    metadataRoutes: sortArr(metadataRoutes),
    parameterized,
  };
}

// The deterministic freshness surface: everything below is recomputed from
// committed repo files (no build, no network) and diffed against the artifact.
export function computeRepoFacts(root = ROOT) {
  return {
    runtimeDependencies: computeRuntimeDependencies(root),
    middlewareBoundary: parseMiddlewareBoundary(root),
    sourceRoutes: computeSourceRoutes(root),
  };
}

// ---------------------------------------------------------------------------
// deterministic deep diff -> human-readable drift lines
// ---------------------------------------------------------------------------
function typeOf(v) {
  if (Array.isArray(v)) return "array";
  if (v === null) return "null";
  return typeof v;
}
function walkDiff(path, a, b, out) {
  if (stable(a) === stable(b)) return;
  const ta = typeOf(a);
  const tb = typeOf(b);
  if (ta !== tb) {
    out.push(`${path || "(root)"}: type ${ta} -> ${tb}`);
    return;
  }
  if (ta === "object") {
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
    for (const k of keys) {
      const p = path ? `${path}.${k}` : k;
      if (!(k in a)) out.push(`${p}: added (${stable(b[k])})`);
      else if (!(k in b)) out.push(`${p}: removed (was ${stable(a[k])})`);
      else walkDiff(p, a[k], b[k], out);
    }
    return;
  }
  if (ta === "array") {
    if (a.length !== b.length) out.push(`${path}: array length ${a.length} -> ${b.length}`);
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) walkDiff(`${path}[${i}]`, a[i], b[i], out);
    return;
  }
  out.push(`${path}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`);
}
export function diffFacts(recorded, current) {
  const out = [];
  walkDiff("", recorded, current, out);
  return out;
}

// ---------------------------------------------------------------------------
// production-audit evidence block: sanitize + validate consistency / no-secrets
// ---------------------------------------------------------------------------
const SEVERITIES = ["info", "low", "moderate", "high", "critical"];
// Keys we allow to survive into the committed artifact. Anything a future audit
// format adds is dropped, so a token/path can never silently leak into evidence.
const ADVISORY_KEYS = ["ghsa", "title", "severity", "url", "range", "cwe", "source"];

export function summarizeAudit(auditJson) {
  const meta = auditJson.metadata?.vulnerabilities || {};
  const summary = {};
  for (const s of SEVERITIES) summary[s] = meta[s] ?? 0;
  summary.total = meta.total ?? SEVERITIES.reduce((n, s) => n + (summary[s] || 0), 0);

  const packages = [];
  for (const [name, v] of Object.entries(auditJson.vulnerabilities || {})) {
    const advisories = [];
    for (const via of v.via || []) {
      if (typeof via === "string") continue; // a "via: another-package" reference, not an advisory
      const a = {};
      for (const k of ADVISORY_KEYS) {
        if (k === "ghsa") a.ghsa = (via.url || "").split("/").pop() || null;
        else if (via[k] !== undefined) a[k] = via[k];
      }
      advisories.push(a);
    }
    advisories.sort((x, y) => String(x.ghsa).localeCompare(String(y.ghsa)));
    packages.push({
      name: v.name ?? name,
      severity: v.severity ?? null,
      range: v.range ?? null,
      isDirect: v.isDirect ?? null,
      fixAvailable: v.fixAvailable ?? null,
      advisories,
    });
  }
  packages.sort((x, y) => x.name.localeCompare(y.name));
  return {
    command: "npm audit --omit=dev --json",
    summary,
    packages,
    note:
      "npm audit fix recommends a semver-MAJOR bump (Next 16), so `npm audit fix --force` " +
      "is not the migration path; the batch targets Next 15.5.16 explicitly (plan §1).",
  };
}

// Reject only credential-SHAPED values, never plain English words: advisory
// titles legitimately contain "Authorization", "token", etc. We match JWTs,
// provider key prefixes, bearer values, and `secret=<value>` assignments.
const SECRET_PATTERNS = [
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{6,}/, // JWT
  /\bsk-[A-Za-z0-9]{16,}\b/, // sk- style API key
  /\bAKIA[0-9A-Z]{12,}\b/, // AWS access key id
  /\bBearer\s+[A-Za-z0-9._~+/-]{16,}=*/i, // bearer token value
  /\b(secret|token|password|passwd|api[_-]?key|access[_-]?key)\b\s*[:=]\s*["']?[A-Za-z0-9._-]{8,}/i, // key=value
];
export function looksLikeSecret(text) {
  return SECRET_PATTERNS.some((re) => re.test(text));
}
export function validateAuditBlock(audit) {
  const errors = [];
  if (!audit || typeof audit !== "object") return ["productionAudit: missing or not an object"];
  const s = audit.summary || {};
  for (const sev of SEVERITIES) {
    if (typeof s[sev] !== "number") errors.push(`productionAudit.summary.${sev}: not a number`);
  }
  const sum = SEVERITIES.reduce((n, sev) => n + (s[sev] || 0), 0);
  if (s.total !== sum) errors.push(`productionAudit.summary.total ${s.total} != sum of severities ${sum}`);
  if (!Array.isArray(audit.packages)) {
    errors.push("productionAudit.packages: not an array");
    return errors;
  }
  // The recorded finding count (packages with severity >= moderate) must line up
  // with the summary so a hand-edited or truncated block cannot claim "all clear".
  const counted = { info: 0, low: 0, moderate: 0, high: 0, critical: 0 };
  for (const p of audit.packages) {
    if (p.severity && counted[p.severity] !== undefined) counted[p.severity] += 1;
  }
  for (const sev of ["critical", "high", "moderate"]) {
    if ((s[sev] || 0) > 0 && counted[sev] === 0) {
      errors.push(`productionAudit: summary reports ${s[sev]} ${sev} but no package carries ${sev} severity`);
    }
  }
  // No secret-looking values anywhere in the recorded evidence.
  if (looksLikeSecret(JSON.stringify(audit))) errors.push("productionAudit: contains a secret-looking value");
  return errors;
}

// ---------------------------------------------------------------------------
// build route classification (from local .next manifests; evidence + cross-check)
// ---------------------------------------------------------------------------
export function computeBuildClassification(root = ROOT) {
  const dir = join(root, ".next");
  const routesManifest = join(dir, "routes-manifest.json");
  const prerenderManifest = join(dir, "prerender-manifest.json");
  if (!existsSync(routesManifest) || !existsSync(prerenderManifest)) return null;
  const rm = JSON.parse(readFileSync(routesManifest, "utf8"));
  const pm = JSON.parse(readFileSync(prerenderManifest, "utf8"));
  const dynamicServerRoutes = (rm.dynamicRoutes || []).map((r) => r.page).sort();
  const staticRoutePages = (rm.staticRoutes || []).map((r) => r.page).sort();
  const prerendered = Object.keys(pm.routes || {}).sort();
  return {
    capturedFromBuild: true,
    dynamicServerRoutes,
    staticRoutePages,
    staticRouteCount: staticRoutePages.length,
    prerendered,
    note: ".next manifests are regenerated each build; recorded here as the pre-migration classification evidence.",
  };
}

// Cross-check recorded build classification vs the local build, when present.
export function crossCheckBuild(recorded, root = ROOT) {
  const current = computeBuildClassification(root);
  if (!current) return { status: "skipped", messages: ["no local .next build manifests (run `npm run build` first)"] };
  const fields = ["dynamicServerRoutes", "staticRoutePages", "prerendered"];
  const messages = [];
  for (const f of fields) {
    const d = diffFacts({ [f]: recorded?.[f] ?? [] }, { [f]: current[f] });
    for (const line of d) messages.push(line);
  }
  return { status: messages.length ? "drift" : "ok", messages };
}

// ---------------------------------------------------------------------------
// orchestrated existing offline contract gates (reuse, never duplicate)
// ---------------------------------------------------------------------------
export const ORCHESTRATED_GATES = [
  { name: "verify:metrics", concern: "Metrics 2.4 public snapshot integrity (138, no forbidden)", command: "python", args: ["scripts/verify_metrics.py"], env: { PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" } },
  { name: "verify:admin-policy", concern: "admin authorization + middleware boundary drift", command: "npm", args: ["run", "verify:admin-policy"] },
  { name: "verify:route-analytics", concern: "route classifier + sanitized route_view_public", command: "npm", args: ["run", "verify:route-analytics"] },
  { name: "verify:click-analytics", concern: "data-analytics-event click contract", command: "npm", args: ["run", "verify:click-analytics"] },
  { name: "verify:first-run-ux", concern: "shared nav canon + home H1/CTA (SEO surface)", command: "npm", args: ["run", "verify:first-run-ux"] },
  { name: "verify:reaudit", concern: "public data + SEO source contracts (Slices A-M)", command: "npm", args: ["run", "verify:reaudit"] },
];

function runGate(gate) {
  console.log(`\n===== ${gate.name} — ${gate.concern} =====`);
  const run = spawnSync(gate.command, gate.args, {
    stdio: "inherit",
    cwd: ROOT,
    shell: true,
    env: gate.env ? { ...process.env, ...gate.env } : process.env,
  });
  const code = run.status ?? 1;
  return { name: gate.name, code, failed: code !== 0 };
}

// Aggregate a list of {name, failed, code} rows into one pass/fail verdict.
export function aggregate(results) {
  const failed = results.filter((r) => r.failed);
  return { total: results.length, passed: results.length - failed.length, failed: failed.length, failedNames: failed.map((r) => r.name) };
}

function pad(str, width) {
  str = String(str);
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}

// ---------------------------------------------------------------------------
// generation: write the deterministic baseline artifact from real evidence
// ---------------------------------------------------------------------------
function generate(auditFile) {
  if (!auditFile) {
    console.error("--generate requires --audit <path to `npm audit --omit=dev --json` output>");
    process.exit(2);
  }
  const auditJson = readJson(auditFile);
  const build = computeBuildClassification();
  if (!build) {
    console.error("Cannot generate: no local .next build manifests. Run `npm run build` first.");
    process.exit(2);
  }
  const nodeVersion = process.version;
  const npmVersion = spawnSync("npm", ["--version"], { shell: true, encoding: "utf8" }).stdout?.trim() || null;
  const artifact = {
    meta: {
      reportKind: "framework-migration-baseline",
      slice: "A",
      plan: "docs/ornscore-framework-security-hardening-2026-07-16.md",
      target: MIGRATION_TARGET,
      readOnly: true,
      capturedWith: { node: nodeVersion, npm: npmVersion },
      note:
        "Deterministic pre-migration invariant baseline. Freshness facts (runtimeDependencies, " +
        "middlewareBoundary, sourceRoutes) are recomputed from committed repo files and diffed by " +
        "verify-framework-baseline.mjs; productionAudit and buildClassification are recorded evidence.",
    },
    facts: computeRepoFacts(),
    productionAudit: summarizeAudit(auditJson),
    buildClassification: build,
  };
  writeFileSync(BASELINE_PATH, JSON.stringify(canon(artifact), null, 2) + "\n", "utf8");
  console.log(`Wrote ${BASELINE_PATH}`);
  const s = artifact.productionAudit.summary;
  console.log(
    `production audit: critical=${s.critical} high=${s.high} moderate=${s.moderate} low=${s.low} (total ${s.total}); ` +
      `routes: ${artifact.facts.sourceRoutes.count} source (${artifact.facts.sourceRoutes.parameterized.length} parameterized), ` +
      `${build.dynamicServerRoutes.length} dynamic-server, ${build.prerendered.length} prerendered.`,
  );
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function hasFlag(f) {
  return process.argv.includes(f);
}
function argValue(f) {
  const i = process.argv.indexOf(f);
  return i !== -1 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

function main() {
  if (hasFlag("--list")) {
    console.log("OrnScore framework-migration baseline — orchestrated offline contract gates:");
    for (const g of ORCHESTRATED_GATES) console.log(`  ${pad(g.name, 24)}${g.concern}`);
    console.log("  (plus in-process: baseline freshness, audit-block consistency, build classification cross-check)");
    process.exit(0);
  }
  if (hasFlag("--generate")) {
    generate(argValue("--audit"));
    return;
  }

  const freshnessOnly = hasFlag("--freshness-only");
  console.log("OrnScore framework-migration baseline verifier (Slice A) — server- & network-independent.");

  if (!existsSync(BASELINE_PATH)) {
    console.error(`FAIL: baseline artifact missing (${BASELINE_PATH}). Generate it with --generate --audit <file>.`);
    process.exit(1);
  }
  const artifact = readJson(BASELINE_PATH);
  const results = [];

  // Gate 1 — freshness of the deterministic invariant surface.
  const drift = diffFacts(artifact.facts, computeRepoFacts());
  if (drift.length) {
    console.log(`\n===== baseline-freshness =====\nSTALE — ${drift.length} drift(s):`);
    for (const d of drift) console.log(`  · ${d}`);
    console.log("Regenerate: node scripts/verify-framework-baseline.mjs --generate --audit <fresh audit.json>");
  } else {
    console.log("\n===== baseline-freshness =====\nFRESH — runtime deps, middleware boundary, and source routes match the committed baseline.");
  }
  results.push({ name: "baseline-freshness", code: drift.length ? 1 : 0, failed: drift.length > 0 });

  // Gate 2 — production-audit evidence block consistency + no secrets.
  const auditErrors = validateAuditBlock(artifact.productionAudit);
  if (auditErrors.length) {
    console.log(`\n===== audit-block =====\nINCONSISTENT — ${auditErrors.length} issue(s):`);
    for (const e of auditErrors) console.log(`  · ${e}`);
  } else {
    const s = artifact.productionAudit.summary;
    console.log(`\n===== audit-block =====\nOK — recorded production findings: critical=${s.critical} high=${s.high} moderate=${s.moderate} low=${s.low} (total ${s.total}).`);
  }
  results.push({ name: "audit-block", code: auditErrors.length ? 1 : 0, failed: auditErrors.length > 0 });

  // Gate 3 — build route classification cross-check (skipped when no local build).
  const cc = crossCheckBuild(artifact.buildClassification);
  if (cc.status === "drift") {
    console.log(`\n===== build-classification =====\nDRIFT — ${cc.messages.length} difference(s):`);
    for (const m of cc.messages) console.log(`  · ${m}`);
  } else if (cc.status === "skipped") {
    console.log(`\n===== build-classification =====\nSKIPPED — ${cc.messages[0]}`);
  } else {
    console.log("\n===== build-classification =====\nOK — dynamic-server, static, and prerendered route sets match the committed baseline.");
  }
  // A skipped cross-check does not fail the run (build is a separate gate); drift does.
  results.push({ name: "build-classification", code: cc.status === "drift" ? 1 : 0, failed: cc.status === "drift" });

  // Gates 4+ — orchestrate the existing offline contract verifiers.
  if (!freshnessOnly) {
    for (const gate of ORCHESTRATED_GATES) results.push(runGate(gate));
  }

  // Summary.
  console.log(`\n${"=".repeat(56)}`);
  console.log("FRAMEWORK-MIGRATION BASELINE SUMMARY");
  console.log("=".repeat(56));
  const header = `${pad("gate", 24)}${pad("exit", 6)}result`;
  console.log(header);
  console.log("-".repeat(header.length));
  for (const r of results) console.log(`${pad(r.name, 24)}${pad(r.code, 6)}${r.failed ? "FAIL" : "OK"}`);
  console.log("");

  const agg = aggregate(results);
  console.log(`Gates: ${agg.passed}/${agg.total} passed.`);
  if (agg.failed) {
    console.log(`FRAMEWORK-MIGRATION BASELINE FAILED (${agg.failedNames.join(", ")}).`);
    process.exit(1);
  }
  console.log(
    freshnessOnly
      ? "BASELINE FRESHNESS + AUDIT-BLOCK + BUILD CLASSIFICATION: all green (child gates skipped)."
      : "FRAMEWORK-MIGRATION BASELINE PASSED. Invariants frozen; migration may proceed on a later slice.",
  );
  process.exit(0);
}

// Only run main when invoked directly (not when imported by the self-test).
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
