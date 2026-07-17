// One-shot READ-ONLY route canary for OrnScore (Slice B of the 2026-07-17 service
// continuity plan, docs/ornscore-service-continuity-2026-07-17.md).
//
// WHY THIS EXISTS
// ---------------
// The continuity batch hardens the routine data-refresh + publish pipeline. When a
// deploy is slow or a publish half-lands, an operator needs a bounded, evidence-
// emitting probe that answers one question against a supplied base URL: "is the
// live surface serving the CURRENT expected public state?" This CLI fetches a small
// bounded route set and asserts, per route:
//   * HTTP status (default 200),
//   * redirect behaviour (an unexpected redirect, or a redirect that does not point
//     where the route expects, fails),
//   * a non-empty <title>,
//   * a <link rel="canonical"> where the route requires one,
//   * the footer build marker (the 7-char commit SHA the footer surfaces) matches an
//     operator-supplied expected marker,
//   * the expected data date (derived from LOCAL public/data/stocks.json, mirroring
//     src/lib/realStocks.ts deriveBusinessDate — never from memory),
//   * the Metrics version label ("Metrics 2.4") the footer renders.
//
// It emits BOTH a stable human-readable table and (--json) a deterministic JSON
// evidence object, classifying every failure into exactly one of four families:
//   timeout        — the request (or its body) exceeded the per-request timeout, or
//                    the total-duration budget was already spent.
//   dns_tls_http   — the request never produced an HTTP response (DNS / TLS /
//                    connection / protocol error: ENOTFOUND, ECONNREFUSED, TLS, ...).
//   content        — an HTTP response arrived but a status / redirect / title /
//                    canonical / date / metrics-version / size / marker-absent
//                    expectation failed.
//   stale_marker   — the footer build marker is PRESENT but does not equal the
//                    expected marker (a stale build is still being served) — kept
//                    distinct from a missing marker so a stale publish is unambiguous.
//
// It is bounded on every axis a probe can run away on: per-request timeout, total
// wall-clock duration, redirect hops, response body bytes, and total request count.
//
// SAFETY: it issues only GET requests (it never mutates a remote resource), it never
// starts a server (protecting the always-on AI Center listener on :4310) and it never
// leaves a listener behind (it only makes outbound requests). It performs finite
// read-only HTTP only against the base URL the operator supplies.
//
// The pure evaluation helpers + runCanary are exported for the focused self-test
// (scripts/test-route-canary.mjs), which drives them against a task-owned loopback
// mock server — never a live service.
//
// USAGE
// -----
//   npm run verify:route-canary -- --base http://localhost:4461
//   npm run verify:route-canary -- --base https://<deployed-url> --marker <7-hex-sha>
//   npm run verify:route-canary -- --base http://localhost:4461 --json
//   npm run verify:route-canary -- --list        # print the route set + bounds, exit 0
//   VERIFY_BASE_URL=http://localhost:4461 VERIFY_EXPECT_MARKER=abc1234 node scripts/verify-route-canary.mjs
//
// Exit code: 1 on any route failure (any class) or a usage error; 0 when all routes OK.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Reuse the framework-baseline secret detector rather than re-implementing it, so
// the emitted evidence is held to the same no-credential-leak bar as every other
// continuity artifact. (Imported for its pure helper only; no side effects.)
import { looksLikeSecret } from "./verify-framework-baseline.mjs";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// ---------------------------------------------------------------------------
// bounds — every axis a probe could run away on is finite and explicit
// ---------------------------------------------------------------------------
export const DEFAULT_BOUNDS = Object.freeze({
  perRequestTimeoutMs: 8000, // per HTTP request (headers + body read) budget
  totalDurationMs: 60000, // whole-run wall-clock budget
  maxRedirects: 5, // hard transport cap on redirect hops per route
  maxResponseBytes: 3_000_000, // per-response body read cap (3 MB)
  maxRequests: 40, // hard cap on total HTTP requests across the run
});

// The four failure families this probe distinguishes.
export const FAILURE_CLASSES = Object.freeze(["timeout", "dns_tls_http", "content", "stale_marker"]);

// ---------------------------------------------------------------------------
// bounded route set — the representative public surface, each stating which
// expectations apply. Kept small (well under maxRequests) and read-only.
//   expectStatus       : final HTTP status (default 200).
//   expectRedirectTo   : this route SHOULD 3xx to this path (asserts the location).
//   maxRedirects       : allowed redirect hops before it counts as unexpected (0).
//   expectTitle        : a non-empty <title> must be present.
//   expectCanonical    : a <link rel="canonical"> must be present.
//   expectDate         : the derived data date (YYYY.MM.DD) must be visible.
//   expectMetricsVersion: the "Metrics <v>" label must be visible.
//   expectMarker       : the footer build marker must equal the expected marker
//                        (only enforced when an expected marker was supplied).
// ---------------------------------------------------------------------------
export const DEFAULT_ROUTES = Object.freeze([
  { path: "/", expectTitle: true, expectCanonical: true, expectDate: true, expectMetricsVersion: true, expectMarker: true },
  { path: "/status", expectTitle: true, expectDate: true, expectMarker: true },
  { path: "/about", expectTitle: true, expectMarker: true },
  { path: "/pricing", expectTitle: true, expectMarker: true },
  { path: "/stocks", expectTitle: true, expectDate: true, expectMetricsVersion: true, expectMarker: true },
  { path: "/stock/005930", expectTitle: true, expectDate: true, expectMarker: true },
]);

// ---------------------------------------------------------------------------
// expected-state derivation (from LOCAL data; mirrors verify-routes.mjs)
// ---------------------------------------------------------------------------
// asOfBusinessDate(YYYYMMDD | ISO) or generatedAt(ISO) -> YYYYMMDD.
export function deriveBusinessDate(asOf, gen) {
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

// Build the expected-state object from local stocks.json + an optional marker.
// Throws on unreadable/underivable data so a misconfigured run fails loudly.
export function buildExpected(dataPath, marker) {
  let raw = readFileSync(dataPath, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1); // stocks.json is utf-8-sig
  const data = JSON.parse(raw);
  const yyyymmdd = deriveBusinessDate(data.asOfBusinessDate, data.generatedAt);
  if (!yyyymmdd || !/^\d{8}$/.test(yyyymmdd)) {
    throw new Error(
      `cannot derive expected data date from ${dataPath} ` +
        `(asOfBusinessDate=${data.asOfBusinessDate ?? "-"}, generatedAt=${data.generatedAt ?? "-"})`,
    );
  }
  const version = data.metricsVersion ?? null;
  return {
    dataDate: `${yyyymmdd.slice(0, 4)}.${yyyymmdd.slice(4, 6)}.${yyyymmdd.slice(6, 8)}`,
    metricsVersionLabel: version ? `Metrics ${version}` : null,
    marker: marker ?? null,
  };
}

// ---------------------------------------------------------------------------
// pure content helpers (exported for the self-test)
// ---------------------------------------------------------------------------
export function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasNonEmptyTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return !!m && m[1].trim().length > 0;
}

export function hasCanonical(html) {
  return /<link\b[^>]*\brel=["']canonical["'][^>]*>/i.test(html);
}

// The footer surfaces the build marker as `title="코드 <7-hex>"` (KO) / "Code <sha>"
// (EN) — see src/components/AppFooter.tsx. Return the marker hex, or null if absent.
export function extractBuildMarker(html) {
  const m = html.match(/title="(?:코드|Code)\s+([0-9a-fA-F]{4,40})"/);
  return m ? m[1].toLowerCase() : null;
}

// Compare an actual redirect Location against an expected path (origin/query/trailing
// slash insensitive).
export function locationMatches(actual, expected) {
  const norm = (u) => {
    let p = String(u || "");
    try {
      p = new URL(u, "http://x").pathname; // resolves absolute or relative Location
    } catch {
      p = String(u || "").split("?")[0];
    }
    return p.replace(/\/+$/, "") || "/";
  };
  return norm(actual) === norm(expected);
}

// ---------------------------------------------------------------------------
// fetch-error classification: timeout vs the transport (DNS/TLS/HTTP) family
// ---------------------------------------------------------------------------
export function classifyFetchError(err) {
  if (err && (err.name === "AbortError" || err.name === "TimeoutError")) return "timeout";
  const code = String((err && (err.cause?.code || err.code)) || "");
  if (/TIMEOUT/i.test(code)) return "timeout";
  return "dns_tls_http";
}

// ---------------------------------------------------------------------------
// bounded reader: read at most maxBytes of the response body, then stop
// ---------------------------------------------------------------------------
async function readBounded(res, maxBytes) {
  if (!res.body) return { body: "", bytes: 0, truncated: false };
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  let truncated = false;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      truncated = true;
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      break;
    }
    chunks.push(Buffer.from(value));
  }
  return { body: Buffer.concat(chunks).toString("utf8"), bytes: received, truncated };
}

// ---------------------------------------------------------------------------
// bounded fetch: one route, redirects followed up to bounds.maxRedirects
// ---------------------------------------------------------------------------
export async function fetchBounded(rawUrl, bounds, counter) {
  let url = rawUrl;
  const chain = []; // [{ status, location }]
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (counter.requests >= bounds.maxRequests) {
      return { outcome: "content", requestBudgetExhausted: true, chain, message: `request budget ${bounds.maxRequests} exhausted` };
    }
    counter.requests += 1;

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), bounds.perRequestTimeoutMs);
    let res;
    try {
      res = await fetch(url, {
        method: "GET",
        redirect: "manual",
        signal: ac.signal,
        // `connection: close` prevents undici from parking a keep-alive socket that
        // would otherwise linger past the run (and, on Windows, trip a libuv handle
        // assertion if the process exits while it is still closing).
        headers: { "cache-control": "no-cache", pragma: "no-cache", connection: "close" },
      });
    } catch (err) {
      clearTimeout(timer);
      return { outcome: classifyFetchError(err), chain, message: String((err && err.message) || err) };
    }

    const status = res.status;
    const location = res.headers.get("location");
    if (status >= 300 && status < 400 && location) {
      chain.push({ status, location });
      try {
        await res.body?.cancel?.();
      } catch {
        /* ignore */
      }
      clearTimeout(timer);
      if (chain.length > bounds.maxRedirects) {
        return { outcome: "ok", finalStatus: status, chain, hops: chain.length, redirectBudgetExceeded: true, body: "", bytes: 0, truncated: false };
      }
      try {
        url = new URL(location, url).toString();
      } catch {
        return { outcome: "content", finalStatus: status, chain, hops: chain.length, message: `unparseable redirect Location: ${location}`, body: "", bytes: 0, truncated: false };
      }
      continue;
    }

    // Terminal response — read a bounded body (timer still armed to catch a slow body).
    try {
      const { body, bytes, truncated } = await readBounded(res, bounds.maxResponseBytes);
      clearTimeout(timer);
      return { outcome: "ok", finalStatus: status, chain, hops: chain.length, body, bytes, truncated };
    } catch (err) {
      clearTimeout(timer);
      return { outcome: classifyFetchError(err), chain, hops: chain.length, message: String((err && err.message) || err) };
    }
  }
}

// ---------------------------------------------------------------------------
// per-route evaluation: turn a fetched response into content/stale failures
// ---------------------------------------------------------------------------
export function evaluateResponse(route, resp, expected) {
  const failures = [];
  const content = (message) => failures.push({ class: "content", message });
  const stale = (message) => failures.push({ class: "stale_marker", message });

  if (resp.requestBudgetExhausted) {
    content(resp.message || "request budget exhausted");
    return { failures };
  }
  if (resp.redirectBudgetExceeded) {
    content(`redirect budget exceeded (> ${route.__maxHops ?? "max"} hops): ${resp.chain.map((c) => `${c.status}->${c.location}`).join(", ")}`);
    return { failures };
  }
  if (resp.message && resp.finalStatus === undefined) {
    // an unparseable-redirect / structural problem carrying a message but no status
    content(resp.message);
    return { failures };
  }

  const expectStatus = route.expectStatus ?? 200;
  const hops = resp.hops ?? (resp.chain ? resp.chain.length : 0);

  // (b) redirects
  if (route.expectRedirectTo) {
    const first = resp.chain && resp.chain[0];
    if (!first) content(`expected redirect to "${route.expectRedirectTo}" but got status ${resp.finalStatus} with no redirect`);
    else if (!locationMatches(first.location, route.expectRedirectTo)) content(`redirect to "${first.location}" != expected "${route.expectRedirectTo}"`);
  } else {
    const allowed = route.maxRedirects ?? 0;
    if (hops > allowed) content(`unexpected redirect(s): ${resp.chain.map((c) => `${c.status}->${c.location}`).join(", ")}`);
    // (a) final status (only meaningful for a non-redirecting route)
    if (resp.finalStatus !== expectStatus) content(`status ${resp.finalStatus} (expected ${expectStatus})`);
  }

  // (size) a truncated body means the response exceeded the byte budget
  if (resp.truncated) content("response body exceeded size budget (truncated)");

  // Content assertions only make sense on a successful, non-redirecting, fully-read
  // 2xx body. A redirecting route (expectRedirectTo) has no body to inspect.
  const twoxx = typeof resp.finalStatus === "number" && resp.finalStatus >= 200 && resp.finalStatus < 300;
  if (!route.expectRedirectTo && twoxx && !resp.truncated) {
    const body = resp.body || "";
    const visible = visibleText(body);

    if (route.expectTitle && !hasNonEmptyTitle(body)) content("missing non-empty <title>");
    if (route.expectCanonical && !hasCanonical(body)) content('missing <link rel="canonical">');
    if (route.expectDate && expected.dataDate && !visible.includes(expected.dataDate)) content(`missing expected data date "${expected.dataDate}" (stale or wrong data source?)`);
    if (route.expectMetricsVersion && expected.metricsVersionLabel && !visible.includes(expected.metricsVersionLabel)) content(`missing metrics version "${expected.metricsVersionLabel}"`);

    // (marker) only when an expected marker was supplied
    if (route.expectMarker && expected.marker) {
      const found = extractBuildMarker(body);
      if (found === null) content(`footer build marker absent (expected "${expected.marker}")`);
      else if (found !== expected.marker) stale(`footer build marker "${found}" != expected "${expected.marker}" (stale build still served)`);
    }
  }

  return { failures };
}

// ---------------------------------------------------------------------------
// run: probe every route in order, bounded on duration + request count
// ---------------------------------------------------------------------------
export async function runCanary({ base, routes, expected, bounds }) {
  const b = { ...DEFAULT_BOUNDS, ...(bounds || {}) };
  const counter = { requests: 0 };
  const start = Date.now();
  const results = [];

  for (const route of routes) {
    // total-duration guard: if the budget is already spent, skip the rest as timeouts.
    if (Date.now() - start > b.totalDurationMs) {
      results.push({ path: route.path, class: "timeout", status: null, hops: 0, bytes: 0, skipped: true, failures: [{ class: "timeout", message: `total duration budget ${b.totalDurationMs}ms exceeded before request` }] });
      continue;
    }
    // request-count guard.
    if (counter.requests >= b.maxRequests) {
      results.push({ path: route.path, class: "content", status: null, hops: 0, bytes: 0, skipped: true, failures: [{ class: "content", message: `request budget ${b.maxRequests} exhausted before request` }] });
      continue;
    }

    const url = base + route.path;
    const decorated = { ...route, __maxHops: b.maxRedirects };
    // eslint-disable-next-line no-await-in-loop
    const resp = await fetchBounded(url, b, counter);

    if (resp.outcome === "timeout" || resp.outcome === "dns_tls_http") {
      results.push({ path: route.path, class: resp.outcome, status: null, hops: resp.chain ? resp.chain.length : 0, bytes: 0, failures: [{ class: resp.outcome, message: resp.message }] });
      continue;
    }

    const { failures } = evaluateResponse(decorated, resp, expected);
    results.push({
      path: route.path,
      class: failures.length ? failures[0].class : "ok",
      status: resp.finalStatus ?? null,
      hops: resp.hops ?? 0,
      bytes: resp.bytes ?? 0,
      failures,
    });
  }

  const byClass = {};
  for (const c of FAILURE_CLASSES) byClass[c] = 0;
  let failed = 0;
  for (const r of results) {
    if (r.failures.length) failed += 1;
    for (const f of r.failures) byClass[f.class] = (byClass[f.class] || 0) + 1;
  }

  return {
    reportKind: "route-canary",
    base,
    bounds: b,
    expected: { dataDate: expected.dataDate ?? null, metricsVersionLabel: expected.metricsVersionLabel ?? null, marker: expected.marker ?? null },
    routes: results,
    summary: { total: results.length, ok: results.length - failed, failed, byClass },
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i !== -1 && i + 1 < process.argv.length) return process.argv[i + 1];
  return fallback;
}
function hasFlag(f) {
  return process.argv.includes(f);
}
function pad(str, width) {
  str = String(str);
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}

// Redact any userinfo (http://user:pass@host) from a base URL so credentials never
// reach the printed/JSON evidence.
function redactBase(base) {
  try {
    const u = new URL(base);
    u.username = "";
    u.password = "";
    return u.toString().replace(/\/+$/, "");
  } catch {
    return base;
  }
}

async function main() {
  if (hasFlag("--list")) {
    console.log("OrnScore route canary — bounded read-only route set:");
    for (const r of DEFAULT_ROUTES) {
      const checks = ["expectTitle", "expectCanonical", "expectDate", "expectMetricsVersion", "expectMarker"].filter((k) => r[k]).map((k) => k.replace("expect", "").toLowerCase());
      console.log(`  ${pad(r.path, 18)}status ${r.expectStatus ?? 200}  checks: ${checks.join(", ")}`);
    }
    console.log("\nBounds:");
    for (const [k, v] of Object.entries(DEFAULT_BOUNDS)) console.log(`  ${pad(k, 20)}${v}`);
    console.log(`\nFailure classes: ${FAILURE_CLASSES.join(", ")}`);
    process.exit(0);
  }

  const rawBase = argValue("--base", process.env.VERIFY_BASE_URL);
  if (!rawBase) {
    console.error("FAIL: no base URL. Pass --base http://localhost:<port> or set VERIFY_BASE_URL.");
    process.exit(1);
  }
  let parsed;
  try {
    parsed = new URL(rawBase);
  } catch {
    console.error(`FAIL: --base "${rawBase}" is not a valid URL.`);
    process.exit(1);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    console.error(`FAIL: --base must be http(s); got "${parsed.protocol}".`);
    process.exit(1);
  }
  const base = rawBase.replace(/\/+$/, "");
  const dataPath = resolve(REPO_ROOT, argValue("--data", "public/data/stocks.json"));
  const marker = (argValue("--marker", process.env.VERIFY_EXPECT_MARKER) || "").trim().toLowerCase() || null;
  if (marker && !/^[0-9a-f]{4,40}$/.test(marker)) {
    console.error(`FAIL: --marker "${marker}" is not a hex commit-sha prefix.`);
    process.exit(1);
  }
  const asJson = hasFlag("--json");

  let expected;
  try {
    expected = buildExpected(dataPath, marker);
  } catch (err) {
    console.error(`FAIL: ${String((err && err.message) || err)}`);
    process.exit(1);
  }

  const report = await runCanary({ base, routes: DEFAULT_ROUTES, expected });
  report.base = redactBase(report.base);

  // No credential-shaped value may survive into the emitted evidence.
  if (looksLikeSecret(JSON.stringify(report))) {
    console.error("FAIL: emitted evidence contains a secret-looking value; refusing to print.");
    process.exit(1);
  }

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("OrnScore route canary (one-shot, read-only; exits 1 on any failure)");
    console.log(`base=${report.base}  routes=${report.routes.length}  expectedDate=${expected.dataDate}  metrics=${expected.metricsVersionLabel ?? "-"}  marker=${expected.marker ?? "(not checked)"}`);
    console.log("");
    const header = `${pad("route", 20)}${pad("status", 8)}${pad("hops", 6)}${pad("class", 14)}result`;
    console.log(header);
    console.log("-".repeat(header.length));
    for (const r of report.routes) {
      console.log(`${pad(r.path, 20)}${pad(r.status ?? "ERR", 8)}${pad(r.hops, 6)}${pad(r.class, 14)}${r.failures.length ? "FAIL" : "OK"}`);
    }
    console.log("");
    const failedRoutes = report.routes.filter((r) => r.failures.length);
    if (failedRoutes.length) {
      console.log("Failures:");
      for (const r of failedRoutes) for (const f of r.failures) console.log(`  [${f.class}] ${r.path}: ${f.message}`);
      console.log("");
    }
    const s = report.summary;
    console.log(`Summary: ${s.ok}/${s.total} routes OK.  by-class: ${FAILURE_CLASSES.map((c) => `${c}=${s.byClass[c]}`).join(" ")}`);
  }

  // Set the exit code and RETURN rather than process.exit(): letting the event loop
  // drain lets undici tear down its sockets cleanly (a hard exit mid-teardown trips a
  // libuv handle assertion on Windows). No listener is held open, so the loop drains.
  if (report.summary.failed > 0) {
    if (!asJson) console.log("ROUTE CANARY FAILED.");
    process.exitCode = 1;
    return;
  }
  if (!asJson) console.log("ROUTE CANARY PASSED.");
  process.exitCode = 0;
}

// Only run main when invoked directly (not when imported by the self-test).
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
