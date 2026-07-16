// Focused verifier for the Next 15 request/caching-semantics migration (Slice C of
// docs/ornscore-framework-security-hardening-2026-07-16.md).
//
// WHY THIS EXISTS
// ---------------
// The Next 14 -> 15 move changes two request/cache contracts that touch OrnScore
// source code:
//   (1) `params` / `searchParams` on pages, route handlers, and metadata/image
//       entry points became ASYNC (a Promise that must be awaited). A route that
//       still types them synchronously would type-check-fail on Next 15 and, worse,
//       silently regress if a `@ts-ignore` ever hid it.
//   (2) GET Route Handlers are NO LONGER cached (prerendered) by default. In Next
//       14 a handler with no dynamic input was prerendered; in Next 15 it renders
//       on demand unless the intended cache behavior is declared explicitly.
//
// This verifier freezes both contracts as a deterministic, OFFLINE, source-only
// check (no build, no server, no network) so a later slice or refactor cannot
// re-introduce a synchronous-params regression or silently flip the one route
// whose prerender contract actually changed.
//
// It is intentionally NARROW: it only asserts the semantics Slice C changed. The
// broader route/admin/SEO/data contracts stay owned by verify:framework-baseline
// and the existing verifiers (reuse, never duplicate).
//
// The pure helpers (computeAsyncParamRoutes / classifyRouteHandlers / checkAll)
// are exported for the focused self-test (scripts/test-request-cache-semantics.mjs).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(SCRIPTS_DIR, "..");
const APP_ROOT = join(ROOT, "src", "app");

// ---------------------------------------------------------------------------
// file discovery (deterministic walk of src/app)
// ---------------------------------------------------------------------------
const PROP_LEAVES = /^(page|route|opengraph-image|twitter-image|icon|apple-icon)\.(tsx|ts|jsx|js)$/;

function walkAppFiles(absDir = APP_ROOT, out = []) {
  for (const e of readdirSync(absDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const abs = join(absDir, e.name);
    if (e.isDirectory()) walkAppFiles(abs, out);
    else if (PROP_LEAVES.test(e.name)) out.push(abs);
  }
  return out;
}

function urlFromFile(abs) {
  const rel = abs.slice(APP_ROOT.length).replace(/\\/g, "/");
  const withoutGroups = rel.replace(/\/\([^/]+\)/g, "");
  const dir = withoutGroups.replace(/\/(page|route|opengraph-image|twitter-image|icon|apple-icon)\.[^/]+$/, "");
  const leaf = withoutGroups.slice(withoutGroups.lastIndexOf("/") + 1).replace(/\.[^.]+$/, "");
  const base = dir === "" ? "/" : dir;
  return leaf === "page" || leaf === "route" ? base : `${base === "/" ? "" : base}/${leaf}`;
}

// Strip line/block comments so commented-out code never counts as a contract hit.
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

// ---------------------------------------------------------------------------
// (1) async params / searchParams contract
// ---------------------------------------------------------------------------
// A file "uses request props" if its default export (or a generate* export)
// destructures params/searchParams. When it does, the declared type MUST be a
// Promise and each use MUST be awaited.
export function analyzeAsyncParams(files) {
  const violations = [];
  const covered = [];
  for (const abs of files) {
    const raw = readFileSync(abs, "utf8");
    const src = stripComments(raw);
    const url = urlFromFile(abs);
    const isDynamicSegment = url.includes("[");

    // Does this file reference params/searchParams as a *route prop* at all?
    // (Match a typed prop declaration: `params:` / `searchParams:` in a props type
    //  or inline destructure annotation.)
    const declares = /\b(params|searchParams)\s*:/.test(src);
    if (!declares) {
      // A dynamic-segment page/route/image that never types params is only OK when
      // it renders nothing dynamic (e.g. blog/[slug] that just calls notFound()).
      // We do not force a params signature; nothing to check.
      continue;
    }

    // Every typed `params:`/`searchParams:` route prop must be a Promise<...>.
    // Require the property to be preceded by `{`, `,`, or a line break so we match
    // object-TYPE-body properties (interface PageProps / inline `{ params: ... }`)
    // but NOT a positional function parameter NAMED params (e.g. a helper
    // `sendEmailViaResend(params: {...})`, where `params` is preceded by `(`).
    const propDecls = [...src.matchAll(/[{,\n]\s*(params|searchParams)\s*:\s*([^;,)\n]+)/g)];
    for (const m of propDecls) {
      const [, name, typeExpr] = m;
      // Ignore obvious non-route-prop helper signatures: a route prop type is an
      // object/Promise of an object with route param keys, never a bare primitive.
      const t = typeExpr.trim();
      const looksLikeRouteProp = /Promise<\s*\{/.test(t) || /^\{/.test(t) || /Promise<\s*(Record|any)/.test(t);
      if (!looksLikeRouteProp) continue;
      if (!/^Promise</.test(t)) {
        violations.push(`${url}: '${name}' is typed synchronously ('${t.slice(0, 40)}') — Next 15 requires Promise<...>`);
        continue;
      }
      covered.push({ url, prop: name, isDynamicSegment });
    }

    // If a route prop is destructured/consumed, it must be awaited somewhere.
    for (const name of ["params", "searchParams"]) {
      const typedAsPromise = new RegExp(`\\b${name}\\s*:\\s*Promise<`).test(src);
      if (!typedAsPromise) continue;
      const awaited = new RegExp(`await\\s+${name}\\b`).test(src);
      if (!awaited) {
        violations.push(`${url}: '${name}' is a Promise but is never awaited`);
      }
    }
  }
  return { covered, violations };
}

// ---------------------------------------------------------------------------
// (2) GET Route Handler cache contract
// ---------------------------------------------------------------------------
// Next 15 stops prerendering GET handlers by default. A handler that reads a
// dynamic request input (URL/searchParams, headers, cookies) is dynamic anyway
// and needs no declaration. A handler with NO dynamic input WOULD have been
// prerendered in Next 14; to keep that intent explicit under Next 15 it must
// declare a cache mode (force-static / revalidate / force-dynamic).
const DYNAMIC_INPUT = [
  /\bnew URL\(\s*(?:req|request)\b/,
  /\b(?:req|request)\.url\b/,
  /\.searchParams\b/,
  /\b(?:req|request)\.headers\b/,
  /\bheaders\(\)/,
  /\bcookies\(\)/,
  /\bawait\s+cookies\b/,
  /\bawait\s+headers\b/,
  /\bawait\s+params\b/, // reading a dynamic route segment ([ticker]) is a dynamic input
];
const CACHE_DECL = /export\s+const\s+(dynamic|revalidate|fetchCache)\s*=/;

export function classifyRouteHandlers(files) {
  const rows = [];
  for (const abs of files) {
    if (!/[\\/]route\.(tsx?|jsx?)$/.test(abs)) continue;
    const raw = readFileSync(abs, "utf8");
    const src = stripComments(raw);
    const url = urlFromFile(abs);
    const hasGET = /export\s+async\s+function\s+GET\b/.test(src) || /export\s+function\s+GET\b/.test(src);
    if (!hasGET) continue;
    // A dynamic URL segment ([ticker]/[slug]) makes the route inherently dynamic:
    // it was never prerendered by default in Next 14 either (no generateStaticParams),
    // so the Next 15 default-cache change cannot silently flip it.
    const isDynamicSegment = url.includes("[");
    const readsDynamicInput = isDynamicSegment || DYNAMIC_INPUT.some((re) => re.test(src));
    const declaresCache = CACHE_DECL.test(src);
    const cacheMode = declaresCache ? (src.match(/export\s+const\s+dynamic\s*=\s*["']([^"']+)["']/)?.[1] ?? "declared") : null;
    rows.push({ url, readsDynamicInput, declaresCache, cacheMode });
  }
  return rows;
}

// A GET handler is "explicit" (no silent Next-15 default-cache flip) when either it
// reads a dynamic input (so it is dynamic in both 14 and 15) or it declares a cache
// mode. The only handler that previously prerendered without dynamic input is
// /api/themes; it must now declare its intent.
export function auditGetCacheContract(rows) {
  const violations = [];
  for (const r of rows) {
    if (!r.readsDynamicInput && !r.declaresCache) {
      violations.push(
        `${r.url}: GET reads no dynamic request input and declares no cache mode — Next 15 silently drops the Next 14 prerender. ` +
          `Declare intent (export const dynamic = "force-static" | "force-dynamic" | revalidate).`,
      );
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// (3) optional build cross-check: /api/themes must be prerendered again
// ---------------------------------------------------------------------------
export function themesPrerendered(root = ROOT) {
  const pm = join(root, ".next", "prerender-manifest.json");
  if (!existsSync(pm)) return { status: "skipped", prerendered: null };
  const json = JSON.parse(readFileSync(pm, "utf8"));
  const routes = Object.keys(json.routes || {});
  return { status: "checked", prerendered: routes.includes("/api/themes"), routes };
}

// ---------------------------------------------------------------------------
// aggregate
// ---------------------------------------------------------------------------
export function checkAll(root = ROOT) {
  const files = walkAppFiles(join(root, "src", "app"));
  const asyncParams = analyzeAsyncParams(files);
  const getRows = classifyRouteHandlers(files);
  const getViolations = auditGetCacheContract(getRows);
  const themes = themesPrerendered(root);
  return { files: files.length, asyncParams, getRows, getViolations, themes };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function main() {
  console.log("OrnScore request/caching-semantics verifier (Slice C) — source-only, offline.");
  const r = checkAll();

  const problems = [];

  console.log(`\n===== async params/searchParams =====`);
  console.log(`Checked ${r.files} page/route/image files; ${r.asyncParams.covered.length} Promise-typed request prop(s).`);
  if (r.asyncParams.violations.length) {
    for (const v of r.asyncParams.violations) console.log(`  · ${v}`);
    problems.push(...r.asyncParams.violations);
  } else {
    console.log("OK — every typed params/searchParams route prop is Promise<...> and awaited.");
  }

  console.log(`\n===== GET Route Handler cache contract =====`);
  for (const row of r.getRows) {
    const tag = row.readsDynamicInput ? "dynamic-input" : row.declaresCache ? `declared:${row.cacheMode}` : "UNDECLARED";
    console.log(`  ${row.url.padEnd(30)} ${tag}`);
  }
  if (r.getViolations.length) {
    for (const v of r.getViolations) console.log(`  · ${v}`);
    problems.push(...r.getViolations);
  } else {
    console.log("OK — every GET handler is explicit (dynamic input or declared cache mode).");
  }

  console.log(`\n===== /api/themes prerender cross-check =====`);
  if (r.themes.status === "skipped") {
    console.log("SKIPPED — no local .next/prerender-manifest.json (run `npm run build` first).");
  } else if (r.themes.prerendered) {
    console.log("OK — /api/themes is prerendered again (Next 14 static cache behavior preserved).");
  } else {
    console.log("DRIFT — /api/themes is NOT prerendered; force-static did not take effect.");
    problems.push("/api/themes is not prerendered in the local build despite force-static");
  }

  console.log(`\n${"=".repeat(56)}`);
  if (problems.length) {
    console.log(`REQUEST/CACHE SEMANTICS FAILED — ${problems.length} problem(s).`);
    process.exit(1);
  }
  console.log("REQUEST/CACHE SEMANTICS PASSED — async request API + GET cache contract frozen.");
  process.exit(0);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
