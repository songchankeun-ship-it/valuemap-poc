// Security-boundary regression pack — Slice E of the 2026-07-16 framework
// security hardening plan (docs/ornscore-framework-security-hardening-2026-07-16.md).
// Run: npm run verify:security-regression            (offline half)
//      npm run verify:security-regression -- --base http://127.0.0.1:<port>   (+ live half)
//
// WHY THIS EXISTS
// ---------------
// Slices B–D moved the framework from Next 14.2.13 / React 18 to Next 15.5.18 /
// React 19 to remove the production `next` CRITICAL audit finding without a
// `--force` graph bypass. Slice E re-certifies that the security boundaries the
// migration had to preserve still hold ON the migrated framework, and it maps the
// CURRENTLY reported production advisories to actual ORNScore code-path
// reachability so no residual is waved away with a generic claim.
//
// This pack ADDS regression coverage ONLY for paths an actual Next advisory or a
// migration change reaches, and records concrete source/config evidence for the
// non-applicable ones. It does NOT re-implement the existing operator gates
// (verify:admin-policy proves middleware⟺page-guard parity; verify:admin-access
// proves the live logged-out /admin redirect + no-leak; verify:routes proves
// public-route availability) — those are run alongside this pack by the slice.
//
// COVERAGE (each maps to a re-certification item in the slice brief)
//   §A Advisory reachability map — production critical/high MUST be 0 on the
//      migrated graph; every remaining finding is classified APPLICABLE (backed by
//      a live/offline regression here) or NON-APPLICABLE (with concrete
//      source/config evidence). An unmapped finding fails the gate (forces triage).
//   §B Cron/API unauthorized responses — every scheduled GET route stays
//      fail-closed: CRON_SECRET set + wrong/missing Authorization ⇒ 401, before any
//      side effect. (source contract, offline)
//   §C Safe redirect targets — safeInternalPath() (the single source of truth the
//      login/auth callback uses for the attacker-controlled `next`) rejects
//      open-redirect vectors and preserves genuine internal paths. (offline)
//   §D CVE-2025-29927 middleware-bypass regression (LIVE) — the very class the
//      migration closed: a logged-out request to each /admin route carrying the
//      `x-middleware-subrequest` bypass header MUST still be redirected to /login
//      by the Edge middleware (never a 200 that renders admin content, never an
//      admin-only marker leak). Requires a task-owned prod server via --base.
//
// FROZEN: reads only committed source + the pure returnPath/adminPolicy modules
// and (live half) an already-running server the operator started. Sends NO
// cookies, prints NO secret values, starts/stops NO server, changes NO provider /
// account / schema / runtime setting. Exit 1 on any failure; without --base the
// offline half still runs and the live half is reported NOT RUN.

import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { safeInternalPath } from "../src/lib/auth/returnPath";
import { isAdminRoute } from "../src/lib/adminPolicy";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
function read(rel: string): string {
  return readFileSync(join(repo, rel), "utf8");
}
function argValue(flag: string, fallback: string | null): string | null {
  const i = process.argv.indexOf(flag);
  return i !== -1 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback;
}
const BASE_RAW = argValue("--base", process.env.VERIFY_BASE_URL ?? null);
const BASE = BASE_RAW ? BASE_RAW.replace(/\/+$/, "") : null;
const AUDIT_FILE = argValue("--audit", null);

let failed = 0;
const notes: string[] = [];
function check(name: string, cond: boolean): void {
  if (cond) {
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.error(`  FAIL ${name}`);
  }
}

// ===========================================================================
// §A Advisory reachability map
// ===========================================================================
// Classify every production finding npm audit reports on the migrated graph.
// APPLICABLE findings must be backed by a regression in this pack; NON-APPLICABLE
// findings must carry concrete source/config evidence recorded here (not a generic
// "not exploitable" claim). Any finding not in the table below fails the gate so a
// future advisory cannot slip through unmapped. Keyed by GHSA id.
type Applicability = "applicable" | "non-applicable";
type AdvisoryRule = {
  ghsa: string;
  pkg: string;
  applicability: Applicability;
  // For NON-APPLICABLE findings, a predicate proving the recorded evidence still
  // holds against committed source/config (so the "why it can't reach us" claim
  // is machine-checked, not just prose).
  evidence: string;
  proof: () => boolean;
};

// postcss@8.4.31 is bundled INSIDE next (node_modules/next/node_modules/postcss);
// the top-level postcss is already >=8.5.10 (patched). The advisory is a CSS
// *stringify* XSS: it can only bite if untrusted CSS is stringified through this
// postcss. ORNScore imports postcss nowhere at runtime and feeds the build only
// first-party Tailwind/autoprefixer input — so it is a build-time-only transitive
// finding with no runtime ORNScore code path. Fix is a later Next patch bumping
// its bundled postcss (npm's `next@9.3.3` isSemVerMajor suggestion is a downgrade,
// not a fix); Next 16 is deferred by the plan.
const ADVISORY_RULES: AdvisoryRule[] = [
  {
    ghsa: "GHSA-qx2v-qp2m-jg93",
    pkg: "postcss",
    applicability: "non-applicable",
    evidence:
      "postcss is a build-time CSS transform (postcss.config.mjs → tailwindcss+autoprefixer); " +
      "no runtime `postcss` import in src/; no user-controlled CSS is stringified at runtime.",
    proof: () => {
      // No runtime postcss import anywhere under src/.
      const srcHasPostcss = grepSrc(/from\s+["']postcss["']|require\(\s*["']postcss["']/);
      // postcss appears only as a build-time config (tailwind/autoprefixer plugins).
      const cfg = existsSync(join(repo, "postcss.config.mjs")) ? read("postcss.config.mjs") : "";
      const buildTimeOnly = /tailwindcss/.test(cfg) && /autoprefixer/.test(cfg);
      return srcHasPostcss.length === 0 && buildTimeOnly;
    },
  },
];

// A recognised transitive alias: npm reports `next` moderate ONLY "via postcss"
// (next has no own advisory on 15.5.18). We collapse that to the postcss rule
// rather than treat it as a distinct next finding.
function isNextViaPostcssOnly(auditPkg: any): boolean {
  const via = auditPkg?.via ?? [];
  return via.length > 0 && via.every((v: any) => v === "postcss" || (typeof v === "object" && v?.name === "postcss"));
}

function grepSrc(re: RegExp): string[] {
  const hits: string[] = [];
  const root = join(repo, "src");
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(e.name) && re.test(readFileSync(p, "utf8"))) {
        hits.push(p.slice(repo.length + 1));
      }
    }
  };
  walk(root);
  return hits;
}

function loadAudit(): any {
  if (AUDIT_FILE) return JSON.parse(readFileSync(AUDIT_FILE, "utf8"));
  const run = spawnSync("npm", ["audit", "--omit=dev", "--json"], {
    cwd: repo,
    shell: true,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  // npm audit exits non-zero when findings exist; the JSON is still on stdout.
  const out = run.stdout || "";
  if (!out.trim()) throw new Error(`npm audit produced no JSON output (status ${run.status})`);
  return JSON.parse(out);
}

function sectionAdvisoryMap(): void {
  console.log("\n===== §A advisory reachability map (migrated graph) =====");
  const audit = loadAudit();
  const meta = audit.metadata?.vulnerabilities ?? {};
  const critical = meta.critical ?? 0;
  const high = meta.high ?? 0;
  console.log(
    `  production audit: critical=${critical} high=${high} moderate=${meta.moderate ?? 0} low=${meta.low ?? 0} (total ${meta.total ?? 0})`,
  );
  // The migration's core guarantee: zero critical/high on the production graph.
  check("§A critical production findings == 0", critical === 0);
  check("§A high production findings == 0", high === 0);

  const pkgs = audit.vulnerabilities ?? {};
  for (const [name, info] of Object.entries<any>(pkgs)) {
    // Fold "next via postcss only" into the postcss rule.
    if (name === "next" && isNextViaPostcssOnly(info)) {
      check(`§A ${name} finding is a transitive alias of postcss (no own next advisory)`, true);
      notes.push(`${name}: transitive-only via postcss (no own advisory on 15.5.18) → covered by postcss rule`);
      continue;
    }
    const ghsaIds = (info.via ?? [])
      .filter((v: any) => typeof v === "object" && v.url)
      .map((v: any) => String(v.url).split("/").pop());
    if (ghsaIds.length === 0) {
      // A package whose only `via` entries are string aliases we didn't fold above.
      check(`§A ${name} finding is mappable (has an advisory id or known alias)`, false);
      continue;
    }
    for (const ghsa of ghsaIds) {
      const rule = ADVISORY_RULES.find((r) => r.ghsa === ghsa);
      check(`§A ${name} ${ghsa} is mapped in the reachability table`, Boolean(rule));
      if (!rule) continue;
      if (rule.applicability === "non-applicable") {
        const proven = rule.proof();
        check(`§A ${ghsa} NON-APPLICABLE evidence still holds (${rule.pkg})`, proven);
        notes.push(`${rule.pkg} ${ghsa}: NON-APPLICABLE — ${rule.evidence}`);
      } else {
        // APPLICABLE findings are proven by the live/offline regressions below;
        // just record the linkage here.
        notes.push(`${rule.pkg} ${ghsa}: APPLICABLE — covered by a Slice E regression`);
      }
    }
  }
}

// ===========================================================================
// §B Cron / API unauthorized-response source contract
// ===========================================================================
// Every scheduled GET route must fail closed: when CRON_SECRET is configured, a
// request without the exact `Bearer ${CRON_SECRET}` Authorization is 401 BEFORE
// any Supabase / email side effect. This is a source contract (no server needed):
// the guard is identical across the cron routes and we pin its shape so a future
// edit can't silently open one.
function discoverCronRoutes(): string[] {
  const base = join(repo, "src", "app", "api", "cron");
  const routes: string[] = [];
  const walk = (dir: string, url: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) walk(join(dir, e.name), `${url}/${e.name}`);
      else if (/^route\.(ts|tsx|js|jsx)$/.test(e.name)) routes.push(`${url}`);
    }
  };
  walk(base, "/api/cron");
  return routes.sort();
}

function sectionCronContract(): void {
  console.log("\n===== §B cron/API unauthorized-response source contract =====");
  const routes = discoverCronRoutes();
  check("§B discovered the scheduled cron routes", routes.length >= 4);
  for (const route of routes) {
    const rel = `src/app/api/cron${route.slice("/api/cron".length)}/route.ts`;
    const src = existsSync(join(repo, rel)) ? read(rel) : "";
    check(`§B ${route} reads Authorization header`, /req\.headers\.get\(\s*["']authorization["']\s*\)/.test(src));
    check(`§B ${route} compares against Bearer ${"${"}CRON_SECRET${"}"}`, /Bearer \$\{process\.env\.CRON_SECRET/.test(src));
    check(`§B ${route} returns 401 when secret set and auth mismatches`, /process\.env\.CRON_SECRET\s*&&\s*auth\s*!==\s*expected/.test(src) && /status:\s*401/.test(src));
  }
}

// ===========================================================================
// §C Safe redirect targets — safeInternalPath open-redirect matrix
// ===========================================================================
function sectionSafeRedirect(): void {
  console.log("\n===== §C safe redirect targets (safeInternalPath) =====");
  // Genuine internal paths pass through unchanged (query/hash preserved).
  const keep: string[] = ["/", "/watchlist", "/watchlist?tab=a#b", "/stock/005930", "/compare?stocks=005930,000660"];
  for (const p of keep) check(`§C keeps internal path ${JSON.stringify(p)}`, safeInternalPath(p) === p);

  // Open-redirect / bypass vectors must all collapse to the safe fallback "/".
  const reject: [string, string][] = [
    ["absolute http", "http://evil.com"],
    ["absolute https", "https://evil.com/x"],
    ["protocol-relative", "//evil.com"],
    ["backslash bypass", "/\\evil.com"],
    ["double backslash", "\\\\evil.com"],
    ["javascript scheme", "javascript:alert(1)"],
    ["data scheme", "data:text/html,x"],
    ["scheme with path", "https://evil.com//login"],
    ["CR/LF injection", "/ok\r\n/evil"],
    ["tab injection", "/ok\t/evil"],
    ["leading space", " /evil"],
    ["relative (no slash)", "evil.com"],
  ];
  for (const [label, v] of reject) check(`§C rejects ${label} → "/"`, safeInternalPath(v) === "/");
  // Missing input → fallback; custom fallback honored.
  check("§C null → fallback", safeInternalPath(null) === "/");
  check("§C undefined → fallback", safeInternalPath(undefined) === "/");
  check('§C custom fallback honored', safeInternalPath("http://evil.com", "/login") === "/login");

  // Contract wiring: the auth callback (frozen file, read-only) routes the
  // attacker-controlled `next` through safeInternalPath, not raw.
  const callback = existsSync(join(repo, "src/app/auth/callback/route.ts")) ? read("src/app/auth/callback/route.ts") : "";
  check("§C auth callback sanitizes next via safeInternalPath", /safeInternalPath\(\s*searchParams\.get\(\s*["']next["']\s*\)\s*\)/.test(callback));
}

// ===========================================================================
// §D CVE-2025-29927 middleware-bypass regression (LIVE)
// ===========================================================================
// The bypass class the migration closed: pre-patch Next let a request skip
// middleware entirely by sending `x-middleware-subrequest`. On the migrated
// framework a logged-out /admin request carrying that header MUST still be
// redirected to /login by the Edge middleware — never a 200 rendering admin
// content, never an admin-only marker leak.
const ADMIN_ROUTES: { path: string; marker: string }[] = [
  { path: "/admin", marker: "운영 홈" },
  { path: "/admin/status", marker: "데이터 상태판 (관리자)" },
  { path: "/admin/traffic", marker: "트래픽·이벤트 개요" },
  { path: "/admin/users", marker: "가입자 운영 현황" },
];
// Documented CVE-2025-29927 payload variants (single hop, nested path, and the
// depth-padded chain that defeated the recursion guard in vulnerable versions).
const BYPASS_HEADERS: string[] = [
  "middleware",
  "src/middleware",
  "middleware:middleware:middleware:middleware:middleware",
  "pages/_middleware",
];
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const CRITICAL_MARKERS = ["Application error", "Hydration failed", "Cannot read properties", "ReferenceError:"];

async function sectionMiddlewareBypass(): Promise<void> {
  console.log("\n===== §D CVE-2025-29927 middleware-bypass regression (live) =====");
  if (!BASE) {
    console.log("  NOT RUN — no --base. Start a task-owned prod server and re-run with --base http://127.0.0.1:<port>.");
    notes.push("§D live middleware-bypass regression: NOT RUN (no --base)");
    return;
  }
  // Sanity: every route we probe here really is an admin route the middleware guards.
  for (const r of ADMIN_ROUTES) check(`§D ${r.path} is an /admin route (isAdminRoute)`, isAdminRoute(r.path));

  for (const route of ADMIN_ROUTES) {
    for (const hv of BYPASS_HEADERS) {
      let res: Response;
      let body: string;
      try {
        // No cookies. Inject the bypass header. redirect:manual so we read the 3xx.
        res = await fetch(`${BASE}${route.path}`, {
          redirect: "manual",
          headers: { "x-middleware-subrequest": hv, "cache-control": "no-cache", connection: "close" },
        });
        body = await res.text();
      } catch (err) {
        check(`§D ${route.path} [${hv}] reachable`, false);
        notes.push(`§D ${route.path} request failed: ${String((err as Error)?.message ?? err)}`);
        continue;
      }
      const status = res.status;
      const loc = res.headers.get("location") || "";
      let locPath = loc;
      try {
        locPath = new URL(loc, BASE).pathname + new URL(loc, BASE).search;
      } catch {
        /* keep raw */
      }
      const redirectedToLogin = REDIRECT_STATUSES.has(status) && locPath.startsWith("/login") && locPath.includes(`next=${encodeURIComponent(route.path)}`);
      check(`§D ${route.path} [${hv}] → login redirect, not bypassed`, redirectedToLogin);
      check(`§D ${route.path} [${hv}] not a 200 (no admin content served)`, status !== 200);
      check(`§D ${route.path} [${hv}] no admin marker leak`, !body.includes(route.marker));
      const crit = CRITICAL_MARKERS.filter((m) => body.includes(m));
      check(`§D ${route.path} [${hv}] no runtime-error marker`, crit.length === 0);
    }
  }
}

// ===========================================================================
async function main(): Promise<void> {
  console.log("OrnScore security-boundary regression pack (Slice E) — offline + optional live half.");
  console.log(`live-half=${BASE ? BASE : "NOT RUN (no --base)"}`);

  sectionAdvisoryMap();
  sectionCronContract();
  sectionSafeRedirect();
  await sectionMiddlewareBypass();

  if (notes.length) {
    console.log("\n----- reachability / evidence notes -----");
    for (const n of notes) console.log(`  · ${n}`);
  }

  console.log("");
  if (failed > 0) {
    console.error(`SECURITY REGRESSION PACK FAILED (${failed} check${failed === 1 ? "" : "s"}).`);
    process.exitCode = 1;
    return;
  }
  console.log(
    BASE
      ? "SECURITY REGRESSION PACK PASSED — advisory map + cron/API auth + safe redirects + live CVE-2025-29927 bypass regression all green."
      : "SECURITY REGRESSION PACK: offline half PASSED (advisory map + cron/API auth + safe redirects). LIVE middleware-bypass half NOT RUN (pass --base).",
  );
  process.exitCode = 0;
}

main();
