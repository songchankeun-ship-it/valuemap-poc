// Route-level smoke gate for OrnScore.
//
// Fetches each key route against an ALREADY-RUNNING local prod server and, per
// route, asserts three things:
//   (a) HTTP status is 200,
//   (b) NONE of the CRITICAL runtime-failure markers appear in the HTML,
//   (c) a route-specific positive content anchor IS present (the page actually
//       rendered its own content, not a generic shell / error page).
//
// Unlike the advisory `perf:check`, this is a REAL gate: it prints a per-route
// OK/FAIL table and exits 1 if any route fails any assertion, or if the base
// server is unreachable. This script only measures an already-running server;
// it never starts or stops one.
//
// Usage:
//   npm run build
//   npx next start -p 4455          # a dedicated port (NOT 3000 / NOT AI Center 4310)
//   npm run smoke:check -- --base http://localhost:4455
//   # or:
//   SMOKE_BASE_URL=http://localhost:4455 node scripts/smoke-check.mjs
//   npm run smoke:check -- --base http://localhost:4455 --all   # + extra public routes
//
// Notes:
//   - The default run is finite: the 7 task routes below.
//   - `--all` appends extra public routes for parity with past 12-route passes.
//   - `Hydration failed` is matched precisely so the benign `suppressHydrationWarning`
//     React prop string is NOT a false positive.

// --- args -------------------------------------------------------------------
function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i !== -1 && i + 1 < process.argv.length) return process.argv[i + 1];
  return fallback;
}
function hasFlag(flag) {
  return process.argv.includes(flag);
}

const BASE = (argValue("--base", process.env.SMOKE_BASE_URL) || "http://localhost:4455").replace(/\/+$/, "");
const ALL = hasFlag("--all");

// --- critical markers -------------------------------------------------------
// Substrings that, if present in the served HTML, indicate a real runtime
// failure. `Hydration failed` is the precise Next.js/React error phrase; the
// benign `suppressHydrationWarning` prop does NOT contain it, so it is safe.
const CRITICAL_MARKERS = [
  "Application error",
  "Hydration failed",
  "Cannot read properties",
  "ReferenceError:",
  "Unhandled",
  "Minified React error",
];

// --- routes -----------------------------------------------------------------
// The seven task routes are the core finite set. Each has a positive content
// anchor that proves the route rendered its own content server-side.
const CORE_ROUTES = [
  { path: "/", anchor: "138", why: "home hero shows the 138-stock universe count" },
  { path: "/stocks", anchor: "종목", why: "explorer renders stock/preset content" },
  { path: "/stock/034730", anchor: "상위", why: "detail shows the percentile / rank ('상위 X%') block" },
  { path: "/today", anchor: "오늘", why: "today page renders its dated snapshot heading" },
  { path: "/disclosures", anchor: "공시", why: "disclosures list renders its own content" },
  { path: "/watchlist", anchor: "관심", why: "logged-out watchlist shows the '관심 종목' empty state" },
  { path: "/login", anchor: "카카오", why: "login page renders the Kakao provider button" },
];

// Extra public routes, appended only with --all (parity with past 12-route passes).
const EXTRA_ROUTES = [
  { path: "/compare", anchor: "비교", why: "compare start screen renders" },
  { path: "/pricing", anchor: "베타", why: "pricing shows the free-beta lead" },
  { path: "/status", anchor: "상태", why: "status page renders" },
  { path: "/backtest", anchor: "백테스트", why: "backtest page renders" },
  { path: "/manifest.webmanifest", anchor: "138", why: "manifest description mentions the 138-stock universe" },
];

const ROUTES = ALL ? [...CORE_ROUTES, ...EXTRA_ROUTES] : CORE_ROUTES;

// --- fetch + assert ---------------------------------------------------------
async function checkRoute(route) {
  const url = `${BASE}${route.path}`;
  let res;
  let body;
  try {
    res = await fetch(url, { redirect: "manual", headers: { "cache-control": "no-cache" } });
    body = await res.text();
  } catch (err) {
    return {
      ...route,
      ok: false,
      unreachable: true,
      reasons: [`request failed: ${String(err && err.message ? err.message : err)}`],
    };
  }

  const reasons = [];

  // (a) status 200
  const status = res.status;
  if (status !== 200) reasons.push(`status ${status} (expected 200)`);

  // (b) no critical markers
  const hits = CRITICAL_MARKERS.filter((m) => body.includes(m));
  if (hits.length) reasons.push(`critical marker(s): ${hits.join(", ")}`);

  // (c) positive content anchor present
  if (!body.includes(route.anchor)) reasons.push(`missing anchor "${route.anchor}" (${route.why})`);

  return { ...route, ok: reasons.length === 0, status, reasons };
}

// --- table helpers ----------------------------------------------------------
function pad(str, width) {
  str = String(str);
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}
function padStart(str, width) {
  str = String(str);
  return str.length >= width ? str : " ".repeat(width - str.length) + str;
}

async function main() {
  console.log("OrnScore route smoke gate (real gate; exits 1 on any failure)");
  console.log(`base=${BASE}  routes=${ROUTES.length}${ALL ? " (--all)" : " (core 7)"}`);
  console.log("");

  const results = [];
  for (const route of ROUTES) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await checkRoute(route));
  }

  // If the very first request could not connect at all, the server is likely down.
  const anyUnreachable = results.some((r) => r.unreachable);

  // table
  const header = `${pad("route", 22)}${padStart("status", 8)}${pad("  ", 2)}${pad("result", 8)}`;
  console.log(header);
  console.log("-".repeat(header.length));
  for (const r of results) {
    const statusCell = r.unreachable ? "ERR" : r.status;
    const resultCell = r.ok ? "OK" : "FAIL";
    console.log(`${pad(r.path, 22)}${padStart(statusCell, 8)}${pad("  ", 2)}${pad(resultCell, 8)}`);
  }
  console.log("");

  // failure detail
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.log("Failures:");
    for (const r of failed) {
      for (const reason of r.reasons) console.log(`  FAIL ${r.path}: ${reason}`);
    }
    console.log("");
  }

  if (anyUnreachable) {
    console.log(`Could not reach one or more routes -- is the local prod server running at ${BASE}?`);
    console.log("Hint: npm run build && npx next start -p <port>   (then re-run with --base http://localhost:<port>)");
  }

  const passed = results.length - failed.length;
  console.log(`Summary: ${passed}/${results.length} routes OK.`);

  if (failed.length) {
    console.log("SMOKE GATE FAILED.");
    process.exit(1);
  }
  console.log("SMOKE GATE PASSED.");
  process.exit(0);
}

main();
