// One-shot READ-ONLY market-close health verifier for OrnScore.
//
// Slice A of the bounded market-close operations automation batch
// (docs/ornscore-market-close-automation-2026-07-19.md).
//
// WHY THIS EXISTS
// ---------------
// After the Korean market closes, the daily-data workflow refreshes public/data,
// commits it, and the hosting platform rebuilds and republishes. An operator (or an
// automation loop) needs ONE bounded command that answers, against a supplied public
// base URL, a single question with a MARKET-AWARE three-way verdict:
//   PASS  — the live surface is healthy AND freshness is satisfied.
//   WAIT  — nothing is broken, but fresh publication is not due / not confirmable yet:
//           a weekend/holiday (no publication expected), or the documented post-close
//           publication grace window (the build may still be deploying). Hold + re-run.
//   FAIL  — a real defect that must stop the cycle: a broken/unreachable route,
//           malformed data, universe drift (!= 138), Metrics drift (!= 2.4), an
//           auth-language regression, a broken SEO surface (sitemap/robots), or — when
//           the operator explicitly supplies --expected-sha — a served build-marker
//           that is PRESENT but different (an explicit SHA mismatch / stale build).
//
// Fail-closed is the rule: any hard defect outranks any WAIT window, and an
// unreachable/ambiguous state PAST the grace window is FAIL, never a silent PASS.
//
// REUSE (no duplicated business logic): it composes the already-shipped, exported
// contract primitives —
//   * verify-route-canary.mjs : fetchBounded, DEFAULT_BOUNDS, deriveBusinessDate,
//                               visibleText, hasNonEmptyTitle, hasCanonical,
//                               extractBuildMarker (the footer build-marker contract).
//   * verify-public-seo.mjs   : checkSitemap, checkRobots, checkCrossConsistency.
//   * verify-framework-baseline.mjs : looksLikeSecret (evidence secret-leak guard).
// The 138-stock universe and the "Metrics 2.4" public label are enforced as frozen
// constants against BOTH the local dataset and the served surface.
//
// SAFETY: GET-only, finite on every axis (per-request timeout, total wall-clock,
// redirect hops, response bytes, request count — inherited from DEFAULT_BOUNDS). It
// starts no server, leaves no listener, sends no cookies, submits no forms, and calls
// no live Search Console / provider API. A live GET smoke against https://ornscore.com
// is a finite read that changes no outside state. Emitted evidence is userinfo-redacted
// and secret-guarded.
//
// The pure classifiers (classifyTemporal / evaluateLocalData / classifyOverall) and the
// runners are exported for the focused self-test (scripts/test-market-close-health.mjs),
// which drives the HTTP path against a TASK-OWNED loopback mock — never a live service.
//
// USAGE
//   npm run verify:market-close-health -- --base http://localhost:4497
//   npm run verify:market-close-health -- --base https://ornscore.com --expected-sha <7-40 hex>
//   npm run verify:market-close-health -- --base <url> --now 2026-07-18T10:00:00Z   # weekend -> WAIT
//   npm run verify:market-close-health -- --base <url> --json
//   npm run verify:market-close-health -- --list          # print bounds + model, exit 0
//   VERIFY_BASE_URL=<url> VERIFY_EXPECT_SHA=<sha> node scripts/verify-market-close-health.mjs
//
// Exit code: 0 for PASS and for WAIT (a WAIT is a healthy "hold", not an error — it must
// not break an operator loop; branch on the JSON `verdict`/`reason`), 1 for a FAIL
// verdict, 2 for a usage/config error.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  fetchBounded,
  deriveBusinessDate,
  visibleText,
  hasNonEmptyTitle,
  hasCanonical,
  extractBuildMarker,
  DEFAULT_BOUNDS as HTTP_BOUNDS,
} from "./verify-route-canary.mjs";
import { checkSitemap, checkRobots, checkCrossConsistency } from "./verify-public-seo.mjs";
import { looksLikeSecret } from "./verify-framework-baseline.mjs";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// ---------------------------------------------------------------------------
// frozen public constants (the batch freeze — matched, never mutated)
// ---------------------------------------------------------------------------
export const EXPECTED_UNIVERSE = 138; // the 138-stock universe
export const EXPECTED_METRICS = "2.4"; // public Metrics 2.4 label

export const VERDICTS = Object.freeze(["PASS", "WAIT", "FAIL"]);

// ---------------------------------------------------------------------------
// temporal config — KST (fixed +09:00, no DST). Every value overridable/injectable.
//   closeMinutes : KRX market close (15:30 KST) as minutes-of-day.
//   graceMinutes : publication grace after close. close(15:30) + 210 -> 19:00 KST
//                  deadline, comfortably past the 17:00 KST `0 8 * * 1-5` cron plus
//                  build/deploy lead. Before the deadline => WAIT window.
// ---------------------------------------------------------------------------
export const DEFAULT_TEMPORAL = Object.freeze({
  closeMinutes: 15 * 60 + 30,
  graceMinutes: 210,
  kstOffsetMinutes: 9 * 60,
});

// Best-effort, OWNER-OVERRIDABLE 2026 KRX closures (ISO yyyy-mm-dd). Weekend
// detection (below) is the always-authoritative part and never depends on this list;
// an operator can replace it entirely with --calendar. Substitute holidays are
// included where a fixed-date holiday falls on a weekend.
export const DEFAULT_HOLIDAYS_2026 = Object.freeze([
  "2026-01-01", // New Year's Day
  "2026-02-16", "2026-02-17", "2026-02-18", // Seollal (Lunar New Year)
  "2026-03-01", "2026-03-02", // Independence Movement Day (+ substitute Mon)
  "2026-05-05", // Children's Day
  "2026-05-24", "2026-05-25", // Buddha's Birthday (+ substitute Mon)
  "2026-06-06", // Memorial Day
  "2026-08-15", "2026-08-17", // Liberation Day (+ substitute Mon)
  "2026-09-24", "2026-09-25", "2026-09-26", // Chuseok
  "2026-10-03", "2026-10-05", // National Foundation Day (+ substitute Mon)
  "2026-10-09", // Hangeul Day
  "2026-12-25", // Christmas
  "2026-12-31", // KRX year-end closure
]);

// Auth-language contract markers (Korean-only public v1) — the same constants the
// login preflight enforces. None of the toggle markers may appear; lang="ko" and the
// baseline provider buttons must be present.
const AUTH_TOGGLE_MARKERS = ["hreflang", 'lang="en"', "LanguageSwitcher"];
const AUTH_PROVIDER_MARKERS = ["카카오로 시작하기", "구글로 시작하기"]; // "카카오로 시작하기", "구글로 시작하기"

// Representative read-only health routes. Each states which checks apply.
//   title/canonical : structural (hard).
//   metrics         : served page must show the "Metrics 2.4" label (hard = drift).
//   universeText    : served page must show the "138" universe count (hard = drift).
//   date            : served visible data date must equal the expected (local) date;
//                     a mismatch is FRESHNESS (WAIT-eligible), not hard.
//   marker          : when --expected-sha is supplied, the footer build marker is
//                     checked (present+wrong => hard sha_mismatch; absent => freshness).
export const HEALTH_ROUTES = Object.freeze([
  { path: "/", title: true, canonical: true, date: true, metrics: true, marker: true, universeText: true },
  { path: "/stocks", title: true, date: true, metrics: true, marker: true, universeText: true },
  { path: "/stock/005930", title: true, date: true, marker: true },
]);

// ---------------------------------------------------------------------------
// pure: KST wall-clock parts from an absolute instant
// ---------------------------------------------------------------------------
function pad2(n) {
  return String(n).padStart(2, "0");
}

export function kstParts(now, offsetMinutes = DEFAULT_TEMPORAL.kstOffsetMinutes) {
  const shifted = new Date(now.getTime() + offsetMinutes * 60000);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth() + 1;
  const d = shifted.getUTCDate();
  const dow = shifted.getUTCDay(); // 0=Sun .. 6=Sat
  const minutes = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
  return { dateIso: `${y}-${pad2(m)}-${pad2(d)}`, dow, minutes };
}

// ---------------------------------------------------------------------------
// pure: temporal window classification (WAIT-eligibility from clock + calendar)
// ---------------------------------------------------------------------------
export function classifyTemporal({ now, holidays, closeMinutes, graceMinutes, kstOffsetMinutes } = {}) {
  const cfg = { ...DEFAULT_TEMPORAL };
  if (Number.isFinite(closeMinutes)) cfg.closeMinutes = closeMinutes;
  if (Number.isFinite(graceMinutes)) cfg.graceMinutes = graceMinutes;
  if (Number.isFinite(kstOffsetMinutes)) cfg.kstOffsetMinutes = kstOffsetMinutes;
  const holidaySet = holidays instanceof Set ? holidays : new Set(holidays || DEFAULT_HOLIDAYS_2026);

  const parts = kstParts(now, cfg.kstOffsetMinutes);
  const deadlineMinutes = cfg.closeMinutes + cfg.graceMinutes;
  const isWeekend = parts.dow === 0 || parts.dow === 6;
  const isHoliday = holidaySet.has(parts.dateIso);

  if (isWeekend || isHoliday) {
    return { window: "non_trading_day", reason: isWeekend ? "weekend" : "holiday", kst: parts, deadlineMinutes, isTradingDay: false };
  }
  if (parts.minutes < deadlineMinutes) {
    return { window: "pre_publication", reason: "before_publication_deadline", kst: parts, deadlineMinutes, isTradingDay: true };
  }
  return { window: "enforcing", reason: "past_publication_deadline", kst: parts, deadlineMinutes, isTradingDay: true };
}

// ---------------------------------------------------------------------------
// pure: local dataset invariants (malformed / universe drift / metrics drift)
// ---------------------------------------------------------------------------
export function evaluateLocalData(data) {
  const findings = [];
  const hard = (code, message) => findings.push({ dimension: "local_data", severity: "hard", ok: false, code, message });

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    hard("malformed_data", "local dataset is not a JSON object");
    return { findings, count: null, metricsVersion: null, businessDate: null };
  }
  const stocks = data.stocks;
  if (!Array.isArray(stocks)) {
    hard("malformed_data", "local dataset has no stocks[] array");
  } else if (stocks.length !== EXPECTED_UNIVERSE) {
    hard("universe_drift", `local universe ${stocks.length} != expected ${EXPECTED_UNIVERSE}`);
  }
  const version = data.metricsVersion == null ? "" : String(data.metricsVersion);
  if (version !== EXPECTED_METRICS) {
    hard("metrics_drift", `local metricsVersion "${version || "(none)"}" != expected "${EXPECTED_METRICS}"`);
  }
  const yyyymmdd = deriveBusinessDate(data.asOfBusinessDate, data.generatedAt);
  if (!yyyymmdd || !/^\d{8}$/.test(yyyymmdd)) {
    hard("malformed_data", `cannot derive business date (asOfBusinessDate=${data.asOfBusinessDate ?? "-"}, generatedAt=${data.generatedAt ?? "-"})`);
  }
  return {
    findings,
    count: Array.isArray(stocks) ? stocks.length : null,
    metricsVersion: version || null,
    businessDate: yyyymmdd && /^\d{8}$/.test(yyyymmdd) ? yyyymmdd : null,
  };
}

// Expected served state derived from the LOCAL dataset (mirrors buildExpected via the
// shared deriveBusinessDate primitive) — never from memory.
export function deriveExpected(data) {
  const yyyymmdd = deriveBusinessDate(data?.asOfBusinessDate, data?.generatedAt);
  const dataDate = yyyymmdd && /^\d{8}$/.test(yyyymmdd) ? `${yyyymmdd.slice(0, 4)}.${yyyymmdd.slice(4, 6)}.${yyyymmdd.slice(6, 8)}` : null;
  const v = data?.metricsVersion ?? null;
  return { dataDate, metricsVersionLabel: v ? `Metrics ${v}` : null };
}

// After the publication deadline, the expected date comes from the trading-day
// clock. A stale checkout must never validate the same stale date in production.
export function deriveExpectedForTemporal(data, temporal) {
  const expected = deriveExpected(data);
  if (temporal?.window === "enforcing" && temporal?.isTradingDay &&
      /^\d{4}-\d{2}-\d{2}$/.test(temporal?.kst?.dateIso ?? "")) {
    expected.dataDate = temporal.kst.dateIso.replaceAll("-", ".");
  }
  return expected;
}

// ---------------------------------------------------------------------------
// HTTP health checks (GET-only, bounded, read-only)
// ---------------------------------------------------------------------------
export async function runHealthChecks({ base, expected, expectedSha, bounds, counter, routes = HEALTH_ROUTES }) {
  const b = { ...HTTP_BOUNDS, ...(bounds || {}) };
  const c = counter || { requests: 0 };
  const findings = [];
  const observations = [];
  const expected7 = expectedSha ? String(expectedSha).toLowerCase().slice(0, 7) : null;

  // --- routes ---------------------------------------------------------------
  for (const route of routes) {
    // eslint-disable-next-line no-await-in-loop
    const resp = await fetchBounded(base + route.path, b, c);
    const dim = `route:${route.path}`;
    const push = (severity, code, message) => findings.push({ dimension: dim, severity, ok: false, code, message });

    if (resp.outcome === "timeout") {
      push("hard", "broken_route", "request timed out");
      observations.push({ path: route.path, status: null, note: "timeout" });
      continue;
    }
    if (resp.outcome === "dns_tls_http") {
      push("hard", "broken_route", `transport error: ${resp.message || "unreachable"}`);
      observations.push({ path: route.path, status: null, note: "unreachable" });
      continue;
    }
    if (resp.outcome === "content") {
      push("hard", "broken_route", resp.message || "structural fetch failure");
      observations.push({ path: route.path, status: resp.finalStatus ?? null, note: "content-error" });
      continue;
    }

    const status = resp.finalStatus ?? null;
    const hops = resp.hops ?? (resp.chain ? resp.chain.length : 0);
    let marker = null;

    if (resp.redirectBudgetExceeded) push("hard", "broken_route", "redirect budget exceeded");
    if (hops > 0) push("hard", "broken_route", `unexpected redirect(s): ${(resp.chain || []).map((x) => `${x.status}->${x.location}`).join(", ")}`);
    if (status !== 200) push("hard", "broken_route", `status ${status} (expected 200)`);
    if (resp.truncated) push("hard", "broken_route", "response exceeded size budget (truncated)");

    const twoxx = typeof status === "number" && status >= 200 && status < 300;
    if (twoxx && hops === 0 && !resp.truncated) {
      const body = resp.body || "";
      const visible = visibleText(body);
      if (route.title && !hasNonEmptyTitle(body)) push("hard", "broken_route", "missing non-empty <title>");
      if (route.canonical && !hasCanonical(body)) push("hard", "broken_route", 'missing <link rel="canonical">');
      if (route.metrics && expected.metricsVersionLabel && !visible.includes(expected.metricsVersionLabel)) push("hard", "metrics_drift", `served page missing "${expected.metricsVersionLabel}"`);
      if (route.universeText && !visible.includes(String(EXPECTED_UNIVERSE))) push("hard", "universe_drift", `served page missing universe count "${EXPECTED_UNIVERSE}"`);
      if (route.date && expected.dataDate && !visible.includes(expected.dataDate)) push("freshness", "stale_publication", `served data date != expected "${expected.dataDate}" (publication may be in flight)`);
      if (route.marker && expected7) {
        const found = extractBuildMarker(body);
        if (found === null) {
          marker = "absent";
          push("freshness", "deploy_marker_absent", `footer build marker absent (expected "${expected7}")`);
        } else if (found !== expected7) {
          marker = "mismatch";
          push("hard", "sha_mismatch", `footer marker "${found}" != expected "${expected7}" (stale/wrong build served)`);
        } else {
          marker = "match";
        }
      }
    }
    observations.push({ path: route.path, status, hops, marker });
  }

  // --- sitemap / robots crawl surface --------------------------------------
  const smResp = await fetchBounded(base + "/sitemap.xml", b, c);
  let sitemapPaths = [];
  if (smResp.outcome !== "ok") {
    findings.push({ dimension: "sitemap", severity: "hard", ok: false, code: "broken_route", message: `/sitemap.xml ${smResp.outcome}${smResp.message ? `: ${smResp.message}` : ""}` });
  } else {
    const sm = checkSitemap(smResp.finalStatus, smResp.body || "");
    sitemapPaths = sm.paths || [];
    for (const r of sm.reasons) findings.push({ dimension: "sitemap", severity: "hard", ok: false, code: "sitemap_contract", message: r });
  }

  const rbResp = await fetchBounded(base + "/robots.txt", b, c);
  let robotsDisallow = [];
  if (rbResp.outcome !== "ok") {
    findings.push({ dimension: "robots", severity: "hard", ok: false, code: "broken_route", message: `/robots.txt ${rbResp.outcome}${rbResp.message ? `: ${rbResp.message}` : ""}` });
  } else {
    const rb = checkRobots(rbResp.finalStatus, rbResp.body || "");
    robotsDisallow = rb.disallow || [];
    for (const r of rb.reasons) findings.push({ dimension: "robots", severity: "hard", ok: false, code: "robots_contract", message: r });
  }

  if (sitemapPaths.length && robotsDisallow.length) {
    for (const r of checkCrossConsistency(sitemapPaths, robotsDisallow)) {
      findings.push({ dimension: "seo_cross", severity: "hard", ok: false, code: "sitemap_contract", message: r });
    }
  }

  // --- auth-language (Korean-only /login) ----------------------------------
  const loginResp = await fetchBounded(base + "/login", b, c);
  if (loginResp.outcome !== "ok") {
    findings.push({ dimension: "auth_language", severity: "hard", ok: false, code: "login_broken", message: `/login ${loginResp.outcome}${loginResp.message ? `: ${loginResp.message}` : ""}` });
  } else {
    const body = loginResp.body || "";
    if (loginResp.finalStatus !== 200) findings.push({ dimension: "auth_language", severity: "hard", ok: false, code: "login_broken", message: `/login status ${loginResp.finalStatus} (expected 200)` });
    if (!body.includes('lang="ko"')) findings.push({ dimension: "auth_language", severity: "hard", ok: false, code: "auth_language_regression", message: 'missing lang="ko" on /login' });
    for (const m of AUTH_TOGGLE_MARKERS) {
      if (body.includes(m)) findings.push({ dimension: "auth_language", severity: "hard", ok: false, code: "auth_language_regression", message: `KO/EN toggle marker present: ${m}` });
    }
    for (const m of AUTH_PROVIDER_MARKERS) {
      if (!body.includes(m)) findings.push({ dimension: "auth_language", severity: "hard", ok: false, code: "login_broken", message: `missing baseline provider button "${m}"` });
    }
  }

  return { findings, observations };
}

// ---------------------------------------------------------------------------
// pure: overall PASS / WAIT / FAIL decision (fail-closed)
// ---------------------------------------------------------------------------
export function classifyOverall({ temporal, findings }) {
  const failures = findings.filter((f) => f && f.ok === false);
  const hard = failures.filter((f) => f.severity === "hard");
  const freshness = failures.filter((f) => f.severity === "freshness");
  const counts = { hard: hard.length, freshness: freshness.length };

  // 1. any hard defect outranks every window.
  if (hard.length) return { verdict: "FAIL", reason: hard[0].code, ...counts };

  // 2. non-trading day: nothing fresh is due — hold.
  if (temporal.window === "non_trading_day") return { verdict: "WAIT", reason: temporal.reason, ...counts };

  // 3. inside the post-close grace window: a not-yet-fresh signal is a hold, not a fail.
  if (temporal.window === "pre_publication") {
    if (freshness.length) return { verdict: "WAIT", reason: temporal.reason, ...counts };
    return { verdict: "PASS", reason: "fresh_confirmed", ...counts };
  }

  // 4. enforcing (past the deadline): staleness is now a real failure.
  if (freshness.length) return { verdict: "FAIL", reason: freshness[0].code, ...counts };
  return { verdict: "PASS", reason: "fresh_confirmed", ...counts };
}

// ---------------------------------------------------------------------------
// orchestrator
// ---------------------------------------------------------------------------
export async function runMarketCloseHealth({ base, expectedSha, now, temporalConfig, localData, bounds, counter, routes }) {
  const temporal = classifyTemporal({ now, ...(temporalConfig || {}) });
  const local = evaluateLocalData(localData);
  const expected = deriveExpectedForTemporal(localData, temporal);
  const health = await runHealthChecks({ base, expected, expectedSha, bounds, counter, routes });
  const findings = [...local.findings, ...health.findings];
  const overall = classifyOverall({ temporal, findings });
  return assembleReport({ overall, temporal, local, expected, health, findings, base, expectedSha });
}

function redactBase(base) {
  try {
    const u = new URL(base);
    u.username = "";
    u.password = "";
    return u.toString().replace(/\/+$/, "");
  } catch {
    return String(base);
  }
}

// Deterministic (no epoch-ms timestamp), userinfo-redacted evidence object.
function assembleReport({ overall, temporal, local, expected, health, findings, base, expectedSha }) {
  const expected7 = expectedSha ? String(expectedSha).toLowerCase().slice(0, 7) : null;
  return {
    reportKind: "market-close-health",
    verdict: overall.verdict,
    reason: overall.reason,
    ok: overall.verdict !== "FAIL",
    exitCode: overall.verdict === "FAIL" ? 1 : 0,
    base: redactBase(base),
    expectedSha: expected7,
    temporal: {
      window: temporal.window,
      reason: temporal.reason,
      isTradingDay: temporal.isTradingDay,
      kstDate: temporal.kst.dateIso,
      kstMinutes: temporal.kst.minutes,
      deadlineMinutes: temporal.deadlineMinutes,
    },
    expected: {
      universe: EXPECTED_UNIVERSE,
      metrics: EXPECTED_METRICS,
      dataDate: expected.dataDate,
      metricsVersionLabel: expected.metricsVersionLabel,
    },
    local: { count: local.count, metricsVersion: local.metricsVersion, businessDate: local.businessDate },
    observations: health.observations,
    failures: findings.filter((f) => f && f.ok === false),
    summary: { hard: overall.hard, freshness: overall.freshness },
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
function intArg(flag, fallback) {
  const raw = argValue(flag, undefined);
  if (raw === undefined) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}
function pad(str, width) {
  str = String(str);
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}

// Parse "HHMM" (e.g. "1530") into minutes-of-day, or null if malformed.
function parseHhmm(s) {
  const m = String(s).match(/^(\d{1,2}):?(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function loadCalendar(file) {
  const raw = readFileSync(file, "utf8");
  const parsed = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  const list = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.holidays) ? parsed.holidays : null;
  if (!list) throw new Error("calendar file must be a JSON array of ISO dates or { holidays: [...] }");
  const bad = list.filter((d) => !/^\d{4}-\d{2}-\d{2}$/.test(String(d)));
  if (bad.length) throw new Error(`calendar contains non-ISO date(s): ${bad.slice(0, 3).join(", ")}`);
  return new Set(list.map(String));
}

async function main() {
  if (hasFlag("--list")) {
    console.log("OrnScore market-close health verifier — bounded, read-only, GET-only.");
    console.log("\nVerdicts: PASS (exit 0) | WAIT (exit 0, healthy hold) | FAIL (exit 1).  Usage error: exit 2.");
    console.log("\nTemporal windows:");
    console.log("  non_trading_day  WAIT  (weekend | holiday)");
    console.log("  pre_publication  WAIT-eligible  (trading day, before publication deadline)");
    console.log("  enforcing        freshness must be live  (trading day, at/after deadline)");
    console.log("\nDefaults (KST, minutes-of-day):");
    console.log(`  close=${DEFAULT_TEMPORAL.closeMinutes} (15:30)  grace=${DEFAULT_TEMPORAL.graceMinutes}  deadline=${DEFAULT_TEMPORAL.closeMinutes + DEFAULT_TEMPORAL.graceMinutes} (19:00)`);
    console.log("\nHard-FAIL codes: broken_route, malformed_data, universe_drift, metrics_drift,");
    console.log("  auth_language_regression, login_broken, sitemap_contract, robots_contract, sha_mismatch.");
    console.log("Freshness (WAIT-eligible) codes: stale_publication, deploy_marker_absent.");
    console.log(`\nFrozen constants: universe=${EXPECTED_UNIVERSE}, metrics=${EXPECTED_METRICS}.`);
    console.log("HTTP bounds:");
    for (const [k, v] of Object.entries(HTTP_BOUNDS)) console.log(`  ${pad(k, 20)}${v}`);
    process.exit(0);
  }

  const usage = (msg) => {
    console.error(`FAIL(usage): ${msg}`);
    process.exit(2);
  };

  const rawBase = argValue("--base", process.env.VERIFY_BASE_URL);
  if (!rawBase) usage("no base URL. Pass --base http(s)://<host> or set VERIFY_BASE_URL.");
  let parsed;
  try {
    parsed = new URL(rawBase);
  } catch {
    return usage(`--base "${rawBase}" is not a valid URL.`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return usage(`--base must be http(s); got "${parsed.protocol}".`);
  const base = rawBase.replace(/\/+$/, "");

  const rawSha = (argValue("--expected-sha", process.env.VERIFY_EXPECT_SHA) || "").trim().toLowerCase();
  if (rawSha && !/^[0-9a-f]{7,40}$/.test(rawSha)) return usage(`--expected-sha "${rawSha}" is not a 7-40 char hex commit SHA.`);
  const expectedSha = rawSha || null;

  const rawNow = argValue("--now", undefined);
  let now;
  if (rawNow === undefined) {
    now = new Date(); // real clock — a run-time helper, not a resumable workflow script
  } else {
    now = new Date(rawNow);
    if (Number.isNaN(now.getTime())) return usage(`--now "${rawNow}" is not a parseable date/time.`);
  }

  const closeMinutes = argValue("--close-hhmm", undefined) !== undefined ? parseHhmm(argValue("--close-hhmm")) : undefined;
  if (argValue("--close-hhmm", undefined) !== undefined && closeMinutes === null) return usage(`--close-hhmm "${argValue("--close-hhmm")}" is not HHMM (e.g. 1530).`);
  const graceMinutes = intArg("--grace-min", undefined);

  let holidays;
  const calFile = argValue("--calendar", undefined);
  if (calFile !== undefined) {
    try {
      holidays = loadCalendar(resolve(REPO_ROOT, calFile));
    } catch (err) {
      return usage(`--calendar: ${String((err && err.message) || err)}`);
    }
  }

  const dataPath = resolve(REPO_ROOT, argValue("--data", "public/data/stocks.json"));
  let localData = null;
  try {
    let raw = readFileSync(dataPath, "utf8");
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    localData = JSON.parse(raw);
  } catch {
    localData = null; // evaluateLocalData will flag malformed_data (a FAIL, not a crash)
  }

  const asJson = hasFlag("--json");

  const report = await runMarketCloseHealth({
    base,
    expectedSha,
    now,
    temporalConfig: { holidays, closeMinutes, graceMinutes },
    localData,
  });

  // No credential-shaped value may survive into the emitted evidence.
  if (looksLikeSecret(JSON.stringify(report))) {
    console.error("FAIL(usage): emitted evidence contains a secret-looking value; refusing to print.");
    process.exit(2);
  }

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("OrnScore market-close health (one-shot, read-only, GET-only)");
    console.log(`base=${report.base}  sha=${report.expectedSha ?? "(not checked)"}  now(KST)=${report.temporal.kstDate} ${pad(Math.floor(report.temporal.kstMinutes / 60), 2)}:${pad(report.temporal.kstMinutes % 60, 2)}`);
    console.log(`window=${report.temporal.window} (${report.temporal.reason})  expectedDate=${report.expected.dataDate ?? "-"}  universe=${report.expected.universe}  metrics=${report.expected.metrics}`);
    console.log("");
    console.log(`${pad("route/dim", 22)}${pad("status", 8)}${pad("marker", 10)}note`);
    console.log("-".repeat(52));
    for (const o of report.observations) console.log(`${pad(o.path, 22)}${pad(o.status ?? "ERR", 8)}${pad(o.marker ?? "-", 10)}${o.note ?? ""}`);
    console.log("");
    if (report.failures.length) {
      console.log(`Findings (${report.summary.hard} hard, ${report.summary.freshness} freshness):`);
      for (const f of report.failures) console.log(`  [${f.severity}/${f.code}] ${f.dimension}: ${f.message}`);
      console.log("");
    }
    console.log(`VERDICT: ${report.verdict}  (reason=${report.reason})`);
  }

  // Set the exit code and RETURN rather than process.exit(): letting the event loop
  // drain lets undici tear down its sockets cleanly (a hard exit mid-teardown trips a
  // libuv handle assertion on Windows). No listener is held open, so the loop drains.
  process.exitCode = report.verdict === "FAIL" ? 1 : 0;
}

// Only run main when invoked directly (not when imported by the self-test).
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
