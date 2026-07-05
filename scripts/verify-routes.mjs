// Cache-busted public-route verification for OrnScore.
//
// The automated form of the manual "site refresh cache-busted route" checklist
// (docs/ornscore-route-smoke-checklist.md and the release handoff §4). It fetches
// each representative public route against an ALREADY-RUNNING server — local prod
// preview OR an owner-provided deployed URL — with cache-busting so a stale CDN /
// browser copy cannot mask a regression, and asserts the CURRENT expected visible
// state per route:
//   (a) HTTP status matches (default 200),
//   (b) NONE of the critical runtime-failure markers appear,
//   (c) required content is present (data date, free-beta framing, page anchors),
//   (d) stale copy is ABSENT (no paid-plan-first "요금제"/plan-table framing),
//   (e) no public KO/EN toggle (no hreflang / lang="en" / LanguageSwitcher; SSR
//       document routes SHOULD carry lang="ko").
//
// The expected data date is derived from the LOCAL data source (public/data/stocks.json,
// mirroring src/lib/realStocks.ts deriveBusinessDate) so the check never depends on
// memory. This means the helper stays green only while the target's rendered data
// date matches local stocks.json — exactly the property we want when re-checking a
// fresh deploy against the same release data.
//
// Like smoke:check this is a REAL gate: it prints a per-route OK/FAIL table and
// exits 1 on any failure or if the base server is unreachable; exits 0 when all pass.
// It only measures an already-running server; it never starts or stops one.
//
// Usage:
//   npm run build
//   npx next start -p 4461            # a dedicated port (NOT 3000 / NOT AI Center 4310)
//   npm run verify:routes -- --base http://localhost:4461
//   # or point it at a fresh deploy later (post-redeploy cache-bust re-check):
//   npm run verify:routes -- --base https://<deployed-url>
//   # env form (flag wins over env):
//   VERIFY_BASE_URL=http://localhost:4461 node scripts/verify-routes.mjs
//   # override the local data source used to derive the expected date:
//   npm run verify:routes -- --base http://localhost:4461 --data ./public/data/stocks.json

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// --- args -------------------------------------------------------------------
function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i !== -1 && i + 1 < process.argv.length) return process.argv[i + 1];
  return fallback;
}

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const BASE = (argValue("--base", process.env.VERIFY_BASE_URL) || "http://localhost:4461").replace(/\/+$/, "");
const DATA_PATH = resolve(REPO_ROOT, argValue("--data", "public/data/stocks.json"));

// --- expected data date (derived from LOCAL data, mirrors realStocks.ts) -----
// asOfBusinessDate(YYYYMMDD | ISO) or generatedAt(ISO) -> YYYYMMDD, then YYYY.MM.DD.
function deriveBusinessDate(asOf, gen) {
  if (asOf && /^\d{8}$/.test(asOf)) return asOf;
  if (asOf && asOf.length >= 10 && asOf[4] === "-" && asOf[7] === "-") {
    return asOf.slice(0, 4) + asOf.slice(5, 7) + asOf.slice(8, 10);
  }
  if (gen) {
    const d = new Date(gen);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const da = String(d.getDate()).padStart(2, "0");
      return `${y}${m}${da}`;
    }
  }
  return undefined;
}

function expectedDisplayDate() {
  let raw;
  try {
    raw = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  } catch (err) {
    console.error(`Cannot read data source ${DATA_PATH}: ${String(err && err.message ? err.message : err)}`);
    process.exit(1);
  }
  const yyyymmdd = deriveBusinessDate(raw.asOfBusinessDate, raw.generatedAt);
  if (!yyyymmdd || !/^\d{8}$/.test(yyyymmdd)) {
    console.error(
      `Cannot derive expected data date from ${DATA_PATH} ` +
        `(asOfBusinessDate=${raw.asOfBusinessDate ?? "-"}, generatedAt=${raw.generatedAt ?? "-"}).`,
    );
    process.exit(1);
  }
  return `${yyyymmdd.slice(0, 4)}.${yyyymmdd.slice(4, 6)}.${yyyymmdd.slice(6, 8)}`;
}

const EXPECTED_DATE = expectedDisplayDate();

// --- critical markers (shared contract with smoke-check) --------------------
const CRITICAL_MARKERS = [
  "Application error",
  "Hydration failed",
  "Cannot read properties",
  "ReferenceError:",
  "Unhandled",
  "Minified React error",
];

// KO/EN toggle markers: none of these may appear in the SSR document HTML. The
// public v1 is Korean-only (DEFAULT_LOCALE="ko"); an EN toggle would surface as an
// hreflang alternate, an en <html lang>, or a LanguageSwitcher control.
const TOGGLE_MARKERS = ["hreflang", 'lang="en"', "LanguageSwitcher"];

// --- routes -----------------------------------------------------------------
// The six representative public routes from the task scope = the automated form of
// the release-handoff §4 cache-busted checklist. Each states the CURRENT expected
// visible state; a stale date/copy or a resurrected paid-first framing flips it FAIL.
//   expectDate     : derived YYYY.MM.DD must be present (staleness guard).
//   mustContain    : positive content anchors that prove the route rendered itself.
//   mustNotContain : stale copy that must be gone (paid-plan-first framing).
//   noToggle       : default true — the KO/EN-toggle assertion runs on every route.
const ROUTES = [
  {
    path: "/",
    expectDate: true,
    mustContain: [
      { text: "베타", why: "home carries the free-beta framing" },
      { text: "138", why: "home hero shows the 138-stock universe count" },
    ],
  },
  {
    path: "/status",
    expectDate: true,
    mustContain: [{ text: "상태", why: "status page renders its data/system state" }],
  },
  {
    path: "/about",
    mustContain: [
      { text: "베타", why: "about carries the free-beta framing" },
      { text: "서비스 소개", why: "about renders its '서비스 소개' hero" },
    ],
  },
  {
    path: "/pricing",
    mustContain: [
      { text: "무료 베타", why: "pricing leads with the free-beta badge" },
      { text: "지금은 무료 베타예요", why: "pricing headline is the free-beta line" },
    ],
    mustNotContain: [
      { text: "요금제", why: "paid-plan page title must not resurface on the free-beta page" },
      { text: "기능 비교", why: "paid plan-comparison table must not resurface (paid-first framing)" },
    ],
  },
  {
    path: "/stocks",
    mustContain: [
      { text: "종목", why: "explorer renders stock/preset content" },
      { text: "138", why: "explorer states the 138-stock universe" },
    ],
  },
  {
    path: "/stock/005930",
    mustContain: [
      { text: "삼성전자", why: "detail renders the requested stock (005930) name" },
      { text: "상위", why: "detail shows the percentile / rank ('상위 X%') block" },
    ],
  },
];

// --- fetch + assert ---------------------------------------------------------
function cacheBust(path) {
  // Append a unique version token; handle routes that already carry a query.
  const sep = path.includes("?") ? "&" : "?";
  // Date.now() is fine here (a run-time helper, not a resumable workflow script).
  return `${BASE}${path}${sep}v=${Date.now()}`;
}

async function checkRoute(route) {
  const url = cacheBust(route.path);
  let res;
  let body;
  try {
    res = await fetch(url, {
      redirect: "manual",
      headers: {
        "cache-control": "no-cache",
        pragma: "no-cache",
        expires: "0",
      },
    });
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

  // (a) status
  const status = res.status;
  const expectStatus = route.expectStatus ?? 200;
  if (status !== expectStatus) reasons.push(`status ${status} (expected ${expectStatus})`);

  // (b) no critical runtime markers
  const hits = CRITICAL_MARKERS.filter((m) => body.includes(m));
  if (hits.length) reasons.push(`critical marker(s): ${hits.join(", ")}`);

  // (c) expected data date present (staleness guard)
  if (route.expectDate && !body.includes(EXPECTED_DATE)) {
    reasons.push(`missing expected data date "${EXPECTED_DATE}" (stale or wrong data source?)`);
  }

  // (c) positive content anchors
  for (const anchor of route.mustContain ?? []) {
    if (!body.includes(anchor.text)) reasons.push(`missing "${anchor.text}" (${anchor.why})`);
  }

  // (d) stale copy absent
  for (const anti of route.mustNotContain ?? []) {
    if (body.includes(anti.text)) reasons.push(`stale copy present "${anti.text}" (${anti.why})`);
  }

  // (e) no KO/EN toggle
  if (route.noToggle !== false) {
    const toggleHits = TOGGLE_MARKERS.filter((m) => body.includes(m));
    if (toggleHits.length) reasons.push(`KO/EN toggle marker(s): ${toggleHits.join(", ")}`);
    // SSR document routes should declare Korean.
    if (!body.includes('lang="ko"')) reasons.push(`missing lang="ko" (expected Korean-only SSR document)`);
  }

  return { ...route, ok: reasons.length === 0, status, reasons };
}

// --- table helpers (mirror smoke-check) -------------------------------------
function pad(str, width) {
  str = String(str);
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}
function padStart(str, width) {
  str = String(str);
  return str.length >= width ? str : " ".repeat(width - str.length) + str;
}

async function main() {
  console.log("OrnScore cache-busted route verification (real gate; exits 1 on any failure)");
  console.log(`base=${BASE}  routes=${ROUTES.length}  expectedDate=${EXPECTED_DATE}  data=${DATA_PATH}`);
  console.log("");

  const results = [];
  for (const route of ROUTES) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await checkRoute(route));
  }

  const anyUnreachable = results.some((r) => r.unreachable);

  const header = `${pad("route", 22)}${padStart("status", 8)}${pad("  ", 2)}${pad("result", 8)}`;
  console.log(header);
  console.log("-".repeat(header.length));
  for (const r of results) {
    const statusCell = r.unreachable ? "ERR" : r.status;
    const resultCell = r.ok ? "OK" : "FAIL";
    console.log(`${pad(r.path, 22)}${padStart(statusCell, 8)}${pad("  ", 2)}${pad(resultCell, 8)}`);
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
  console.log(`Summary: ${passed}/${results.length} routes OK.  (expected data date ${EXPECTED_DATE})`);

  if (failed.length) {
    console.log("ROUTE VERIFICATION FAILED.");
    process.exit(1);
  }
  console.log("ROUTE VERIFICATION PASSED.");
  process.exit(0);
}

main();
