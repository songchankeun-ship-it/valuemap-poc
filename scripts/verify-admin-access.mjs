// Owner-only /admin route guard verification for OrnScore (release gate).
//
// The automated, repo-local proof that the known /admin routes are NOT publicly
// readable when logged out. Every /admin page calls requireAdminAccess() (see
// src/lib/adminAccess.ts), which redirect()s an unauthenticated visitor to
// /login?next=<route> BEFORE any admin-only content is rendered. This gate
// fetches each admin route against an ALREADY-RUNNING server WITHOUT any auth
// cookie and asserts that logged-out contract holds:
//   (a) the response is a login redirect (3xx whose Location points at /login
//       with the correct ?next=<route>), NOT a 200 that would mean the page
//       rendered admin content to an anonymous visitor,
//   (b) it is NOT a 500 / runtime error (a broken guard that errors is still a
//       regression — the route must degrade to a clean login redirect),
//   (c) NONE of the critical runtime-failure markers appear in the body,
//   (d) the route's admin-only content marker (its authorized-view heading) does
//       NOT leak into the logged-out response body — a belt-and-suspenders check
//       that bites even if the redirect status were ever softened.
//
// It DELIBERATELY does not, and can not, prove the AUTHORIZED side: that an
// allow-listed operator sees the dashboard and a logged-in non-admin is refused.
// That needs a real Supabase session + OAuth round-trip and remains an OWNER
// GATE (a live browser + real consoles + ADMIN_EMAILS/ORNSCORE_ADMIN_EMAILS env).
// This gate only proves the repo-local property that must hold regardless of env:
// anonymous traffic can never read an admin page.
//
// Privacy: this script sends NO cookies and PRINTS NO private values. It never
// reads env secrets and never echoes HTML bodies — only the route path, HTTP
// status, redirect target, OK/FAIL, and generic reason strings.
//
// Like verify:routes / verify:login-preflight this is a REAL gate: it prints a
// per-route table and exits 1 on any failure or if the base server is
// unreachable; exits 0 when all pass. It only measures an already-running
// server; it never starts or stops one (protects the always-on AI Center
// listener on :4310).
//
// Usage:
//   npm run build
//   npx next start -p 4465            # a dedicated high port (NOT 3000 / NOT 4310)
//   npm run verify:admin-access -- --base http://localhost:4465
//   # env form (flag wins over env):
//   VERIFY_BASE_URL=http://localhost:4465 node scripts/verify-admin-access.mjs
//   # deliberate negative self-check (prove the gate can FAIL): point it at a
//   # PUBLIC route, which returns 200 and no login redirect, so every assert bites:
//   node scripts/verify-admin-access.mjs --base http://localhost:4465 --routes /about

// --- args -------------------------------------------------------------------
function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i !== -1 && i + 1 < process.argv.length) return process.argv[i + 1];
  return fallback;
}

const BASE = (argValue("--base", process.env.VERIFY_BASE_URL) || "http://localhost:4465").replace(/\/+$/, "");

// --- critical markers (shared contract with smoke-check/verify-routes) -------
const CRITICAL_MARKERS = [
  "Application error",
  "Hydration failed",
  "Cannot read properties",
  "ReferenceError:",
  "Unhandled",
  "Minified React error",
];

// --- routes -----------------------------------------------------------------
// The known owner-only /admin routes. Each carries the admin-only content marker
// that renders ONLY for an authorized operator (its authorized-view heading);
// none of these may appear in the logged-out response body. Keep this list in
// sync with src/app/admin/**/page.tsx (each calls requireAdminAccess(path)).
const DEFAULT_ROUTES = [
  { path: "/admin", leakMarker: "운영 홈" },
  { path: "/admin/status", leakMarker: "데이터 상태판 (관리자)" },
  { path: "/admin/traffic", leakMarker: "트래픽·이벤트 개요" },
  { path: "/admin/users", leakMarker: "가입자 운영 현황" },
];

// --routes /a,/b overrides the list (used for the negative self-check). Routes
// supplied this way carry no leakMarker, so only the redirect assertions bite.
function resolveRoutes() {
  const override = argValue("--routes", null);
  if (!override) return DEFAULT_ROUTES;
  return override
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({ path: p.startsWith("/") ? p : `/${p}`, leakMarker: null }));
}

const ROUTES = resolveRoutes();

// --- fetch + assert ---------------------------------------------------------
// A logged-out admin route must answer with a redirect to the login page,
// preserving ?next=<route> so the operator returns after signing in.
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

async function checkRoute(route) {
  const url = `${BASE}${route.path}`;
  let res;
  let body;
  try {
    // NO cookies, NO auth header: emulate an anonymous visitor. redirect:manual
    // so we can inspect the redirect status + Location instead of following it.
    // connection:close so no keep-alive socket/timer lingers into teardown — the
    // redirect responses here otherwise trip a libuv UV_HANDLE_CLOSING abort on
    // Windows when the process exits (which would corrupt the exit code the
    // verify:local orchestrator reads via spawnSync).
    res = await fetch(url, {
      redirect: "manual",
      headers: { "cache-control": "no-cache", pragma: "no-cache", expires: "0", connection: "close" },
    });
    body = await res.text();
  } catch (err) {
    return {
      ...route,
      ok: false,
      unreachable: true,
      status: "ERR",
      location: "",
      reasons: [`request failed: ${String(err && err.message ? err.message : err)}`],
    };
  }

  const reasons = [];
  const status = res.status;
  const location = res.headers.get("location") || "";

  // (a) must be a login redirect, never a 200 (which would mean admin content
  // was served to an anonymous visitor), and never a 5xx (broken guard).
  if (status === 200) {
    reasons.push(`status 200 -- admin route is PUBLICLY READABLE when logged out (guard missing?)`);
  } else if (status >= 500) {
    reasons.push(`status ${status} -- guard errored instead of redirecting to /login`);
  } else if (!REDIRECT_STATUSES.has(status)) {
    reasons.push(`status ${status} (expected a 3xx login redirect)`);
  }

  // (b) redirect target must be the login page, preserving ?next=<route>.
  if (REDIRECT_STATUSES.has(status)) {
    // Location may be absolute or relative; compare on pathname + query.
    let loc = location;
    try {
      loc = new URL(location, BASE).pathname + new URL(location, BASE).search;
    } catch {
      /* keep raw location for the assertion below */
    }
    if (!loc.startsWith("/login")) {
      reasons.push(`redirect target "${loc}" is not /login`);
    }
    const expectedNext = `next=${encodeURIComponent(route.path)}`;
    if (!loc.includes(expectedNext)) {
      reasons.push(`redirect missing "${expectedNext}" (return-to-route not preserved)`);
    }
  }

  // (c) no critical runtime markers in the body.
  const critHits = CRITICAL_MARKERS.filter((m) => body.includes(m));
  if (critHits.length) reasons.push(`critical marker(s): ${critHits.join(", ")}`);

  // (d) admin-only content must not leak into the logged-out body.
  if (route.leakMarker && body.includes(route.leakMarker)) {
    reasons.push(`admin content leaked: "${route.leakMarker}" present in logged-out response`);
  }

  return { ...route, ok: reasons.length === 0, status, location, reasons };
}

// --- table helpers (mirror verify-routes / verify-login-preflight) ----------
function pad(str, width) {
  str = String(str);
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}
function padStart(str, width) {
  str = String(str);
  return str.length >= width ? str : " ".repeat(width - str.length) + str;
}

async function main() {
  console.log("OrnScore owner-only /admin guard verification (real gate; exits 1 on any failure)");
  console.log(`base=${BASE}  routes=${ROUTES.length}  (logged-out: each must redirect to /login)`);
  console.log("NOTE: the AUTHORIZED side (allow-listed operator sees dashboard) remains an OWNER gate.");
  console.log("");

  const results = [];
  for (const route of ROUTES) {
    // eslint-disable-next-line no-await-in-loop -- one shared server; run serially
    results.push(await checkRoute(route));
  }

  const anyUnreachable = results.some((r) => r.unreachable);

  const header = `${pad("route", 18)}${padStart("status", 8)}${pad("  ", 2)}${pad("redirect", 30)}${pad("result", 8)}`;
  console.log(header);
  console.log("-".repeat(header.length));
  for (const r of results) {
    let redirectCell = "";
    if (REDIRECT_STATUSES.has(r.status)) {
      try {
        redirectCell = new URL(r.location, BASE).pathname + new URL(r.location, BASE).search;
      } catch {
        redirectCell = r.location;
      }
    }
    const resultCell = r.ok ? "OK" : "FAIL";
    console.log(`${pad(r.path, 18)}${padStart(r.status, 8)}${pad("  ", 2)}${pad(redirectCell, 30)}${pad(resultCell, 8)}`);
  }
  console.log("");

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.log("Failures:");
    for (const r of failed) {
      for (const reason of r.reasons) console.log(`  FAIL ${r.path}: ${reason}`);
    }
    console.log("");
  }

  if (anyUnreachable) {
    console.log(`Could not reach one or more routes -- is a server running at ${BASE}?`);
    console.log("Hint: npm run build && npx next start -p <port>   (then re-run with --base http://localhost:<port>)");
  }

  const passed = results.length - failed.length;
  console.log(`Summary: ${passed}/${results.length} admin routes correctly gated (logged-out).`);

  if (failed.length) {
    console.log("ADMIN ACCESS VERIFICATION FAILED.");
    // Set exitCode and return rather than force-exiting: lets the event loop
    // drain any in-flight socket cleanly (no libuv teardown abort on Windows)
    // while still surfacing the non-zero code to spawnSync / the shell.
    process.exitCode = 1;
    return;
  }
  console.log("ADMIN ACCESS VERIFICATION PASSED.");
  process.exitCode = 0;
}

main();
