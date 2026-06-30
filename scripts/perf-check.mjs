// Lightweight performance guardrail for OrnScore.
//
// Times key routes against an ALREADY-RUNNING local prod server and prints the
// median TTFB / total-download per route, classified into budget categories.
// This script only measures; it never starts or stops a server. It always
// exits 0 (advisory only) because absolute numbers vary by PC/network -- what
// matters is the RELATIVE regression vs the baseline recorded in PROGRESS.md.
//
// Usage:
//   node scripts/perf-check.mjs --base http://localhost:4452 --samples 3
//   PERF_BASE_URL=http://localhost:4452 node scripts/perf-check.mjs
//   npm run perf:check -- --base http://localhost:4452

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
void ROOT; // kept for parity with sibling scripts; no filesystem access needed here

function OK(message) {
  console.log(`OK   ${message}`);
}
function WARN(message) {
  console.log(`WARN ${message}`);
}

// --- args -------------------------------------------------------------------
function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i !== -1 && i + 1 < process.argv.length) return process.argv[i + 1];
  return fallback;
}

const BASE = (argValue("--base", process.env.PERF_BASE_URL) || "http://localhost:4452").replace(/\/+$/, "");
const SAMPLES = Math.max(1, Number(argValue("--samples", "3")) || 3);

// --- route budgets ----------------------------------------------------------
// Category A -- control/fast routes: no request-time remote call. Soft budget
//   median TTFB <= 800ms (generous for a cold local prod server).
// Category B -- remote-data routes: a request-time Supabase round-trip
//   dominates. Soft budget median TTFB <= 9000ms. On a free-tier local->remote
//   connection this is mostly fixed connection/warm-up cost (an ENVIRONMENT
//   artifact, small in production); the task-119 timeout guard caps /stock/*
//   at ~4-4.5s.
const A_BUDGET_MS = 800;
const B_BUDGET_MS = 9000;

const ROUTES = [
  { path: "/", cat: "A" },
  { path: "/stocks", cat: "A" },
  { path: "/stock/034730", cat: "B" },
  { path: "/stock/032830", cat: "B" },
  { path: "/login", cat: "A" },
  { path: "/pricing", cat: "A" },
  { path: "/status", cat: "A" },
  { path: "/disclosures", cat: "A" },
  { path: "/backtest", cat: "A" },
  { path: "/watchlist", cat: "B" },
  { path: "/compare", cat: "A" },
];

// --- timing -----------------------------------------------------------------
function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

async function timeOnce(url) {
  const start = performance.now();
  let res;
  try {
    res = await fetch(url, { redirect: "manual", headers: { "cache-control": "no-cache" } });
  } catch (err) {
    return { ok: false, error: String(err && err.message ? err.message : err) };
  }
  const ttfb = performance.now() - start; // time to response headers
  // Drain the body so total reflects full download.
  try {
    await res.arrayBuffer();
  } catch {
    /* ignore body read errors for timing purposes */
  }
  const total = performance.now() - start;
  return { ok: true, status: res.status, ttfb, total };
}

async function timeRoute(route) {
  const url = `${BASE}${route.path}`;
  const ttfbs = [];
  const totals = [];
  let status = null;
  let error = null;
  for (let i = 0; i < SAMPLES; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const r = await timeOnce(url);
    if (!r.ok) {
      error = r.error;
      break;
    }
    status = r.status;
    ttfbs.push(r.ttfb);
    totals.push(r.total);
  }
  if (error) return { ...route, error };
  return {
    ...route,
    status,
    ttfb: median(ttfbs),
    total: median(totals),
  };
}

function pad(str, width) {
  str = String(str);
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}
function padStart(str, width) {
  str = String(str);
  return str.length >= width ? str : " ".repeat(width - str.length) + str;
}

async function main() {
  console.log("OrnScore performance guardrail (advisory; always exits 0)");
  console.log(`base=${BASE}  samples=${SAMPLES}`);
  console.log("");
  console.log("Three separate concerns this guardrail keeps distinct:");
  console.log("  1) client bundle size  -> read from `npm run build` route table (First Load JS); NOT measured here");
  console.log("  2) server TTFB         -> measured below (time to response headers)");
  console.log("  3) remote data latency -> the delta between Category-B and Category-A TTFB");
  console.log("");
  console.log("Relative regression matters most: compare each route against the baseline recorded");
  console.log("in PROGRESS.md. Flag any route whose median TTFB grows > 50% (or > 300ms on a");
  console.log("Category-A route) vs that baseline. Absolute numbers vary by PC/network.");
  console.log("");

  const results = [];
  for (const route of ROUTES) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await timeRoute(route));
  }

  // table
  const header = `${pad("route", 18)}${pad("cat", 5)}${padStart("status", 8)}${padStart("TTFBms", 10)}${padStart("totalms", 10)}`;
  console.log(header);
  console.log("-".repeat(header.length));
  let warns = 0;
  for (const r of results) {
    if (r.error) {
      console.log(`${pad(r.path, 18)}${pad(r.cat, 5)}${padStart("ERR", 8)}  ${r.error}`);
      warns += 1;
      continue;
    }
    console.log(
      `${pad(r.path, 18)}${pad(r.cat, 5)}${padStart(r.status, 8)}${padStart(Math.round(r.ttfb), 10)}${padStart(Math.round(r.total), 10)}`,
    );
  }
  console.log("");

  // advisory per route
  for (const r of results) {
    if (r.error) {
      WARN(`${r.path}: request failed (${r.error}) -- is the local prod server running at ${BASE}?`);
      continue;
    }
    const budget = r.cat === "A" ? A_BUDGET_MS : B_BUDGET_MS;
    const over = r.ttfb > budget;
    const line = `${r.path} [cat ${r.cat}] median TTFB ${Math.round(r.ttfb)}ms (soft budget ${budget}ms)`;
    if (over) {
      WARN(line + " -- OVER soft budget");
      warns += 1;
    } else {
      OK(line);
    }
  }
  console.log("");
  console.log("Note: Category-B routes (/stock/*, /watchlist) do a request-time Supabase round-trip.");
  console.log("On a free-tier local->remote connection that round-trip is mostly fixed connection/");
  console.log("warm-up cost (environment artifact; small in production). The task-119 timeout guard");
  console.log("caps /stock/* at ~4-4.5s. A Category-B median far above that, or a Category-A route");
  console.log("creeping up, is the real regression signal.");
  console.log("");

  // copy-pasteable baseline block
  console.log("Copy this block into PROGRESS.md to record the current baseline:");
  console.log("--------8<--------");
  const stamp = results
    .filter((r) => !r.error)
    .map((r) => `${r.path}=${Math.round(r.ttfb)}ms`)
    .join(" - ");
  console.log(`perf baseline (base=${BASE}, ${SAMPLES} samples, median TTFB): ${stamp}`);
  console.log("-------->8--------");
  console.log("");
  console.log(`done (${warns} advisory warning${warns === 1 ? "" : "s"}; non-blocking)`);
  process.exit(0);
}

main();
