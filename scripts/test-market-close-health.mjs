// Focused self-test for the market-close health verifier
// (scripts/verify-market-close-health.mjs, Slice A of
// docs/ornscore-market-close-automation-2026-07-19.md).
//
// It proves the three behaviours a market-aware, fail-closed probe must get right:
//   (1) the pure classifiers (temporal window, local-data invariants, overall
//       PASS/WAIT/FAIL precedence) are correct on every branch;
//   (2) end-to-end over HTTP, healthy state yields PASS/WAIT and EVERY hard-FAIL
//       family bites (fail-closed negative controls) — broken route, universe/metrics
//       drift (local + served), malformed data, auth-language regression, sitemap/
//       robots contract, explicit --expected-sha mismatch;
//   (3) the temporal boundary is real — the SAME stale-date fixture is WAIT inside the
//       post-close grace window and FAIL once enforcing (only the injected clock moves),
//       and a hard defect outranks a WAIT window.
//
// It is deterministic and NEVER touches a live service: it stands up a TASK-OWNED
// loopback mock HTTP server on 127.0.0.1 (ephemeral port), drives the verifier against
// it, and at the end STOPS the server and proves it is stopped.

import http from "node:http";
import {
  classifyTemporal,
  evaluateLocalData,
  classifyOverall,
  deriveExpectedForTemporal,
  runMarketCloseHealth,
  kstParts,
  EXPECTED_UNIVERSE,
  EXPECTED_METRICS,
  DEFAULT_HOLIDAYS_2026,
} from "./verify-market-close-health.mjs";
import { lastmodIsoFromData } from "./verify-public-seo.mjs";
import { looksLikeSecret } from "./verify-framework-baseline.mjs";

let failed = 0;
function check(name, cond) {
  if (cond) console.log(`  ok  ${name}`);
  else {
    failed++;
    console.error(`  FAIL ${name}`);
  }
}

// ---------------------------------------------------------------------------
// synthetic local datasets (never public/data)
// ---------------------------------------------------------------------------
const GOOD_DATA = Object.freeze({
  generatedAt: "2026-07-16T09:00:00",
  source: "test-fixture",
  count: EXPECTED_UNIVERSE,
  stocks: Array.from({ length: EXPECTED_UNIVERSE }, (_, i) => ({ ticker: String(100000 + i) })),
  metricsVersion: EXPECTED_METRICS,
  asOfBusinessDate: "20260716",
});
const DATA_UNIVERSE_DRIFT = { ...GOOD_DATA, count: 137, stocks: GOOD_DATA.stocks.slice(0, 137) };
const DATA_METRICS_DRIFT = { ...GOOD_DATA, metricsVersion: "2.5" };
const DATA_NODATE = { ...GOOD_DATA, asOfBusinessDate: undefined, generatedAt: "not-a-date" };
const GOOD_DATA_NEXT = Object.freeze({
  ...GOOD_DATA,
  generatedAt: "2026-07-17T09:00:00",
  asOfBusinessDate: "20260717",
});

// Injected instants (UTC) chosen so the KST wall-clock lands where we want.
const NOW_ENFORCE = new Date("2026-07-16T10:30:00Z"); // Thu 19:30 KST -> enforcing (past 19:00)
const NOW_GRACE = new Date("2026-07-16T08:30:00Z"); //   Thu 17:30 KST -> pre_publication (grace)
const NOW_WEEKEND = new Date("2026-07-18T03:00:00Z"); //  Sat 12:00 KST -> non_trading_day
const NOW_HOLIDAY = new Date("2026-08-17T03:00:00Z"); //  Mon 12:00 KST -> holiday (Liberation substitute)
const NOW_MONDAY_ENFORCE = new Date("2026-07-20T10:30:00Z"); // Mon 19:30 KST -> current trading date due
const NOW_FRIDAY_ENFORCE = new Date("2026-07-17T10:30:00Z"); // Fri 19:30 KST -> next fixture date due

const EXPECT_LASTMOD = lastmodIsoFromData(GOOD_DATA);

// ---------------------------------------------------------------------------
// task-owned loopback mock server (a single configurable server)
// ---------------------------------------------------------------------------
const MODE = { pages: "good", data: "good", sitemap: "good", robots: "good", login: "good" };

function pageOpts(variant) {
  switch (variant) {
    case "notitle": return { title: "" };
    case "nocanonical": return { canonical: false };
    case "no138": return { universe: "" };
    case "nometrics": return { metrics: "Metrics 9.9" };
    case "stale-date": return { date: "1999.01.01" };
    case "next-day": return { date: "2026.07.17" };
    case "marker-absent": return { marker: "" };
    default: return {};
  }
}
function contentPage({ title = "오른스코어", canonical = true, date = "2026.07.16", metrics = "Metrics 2.4", marker = "abc1234", universe = "138" } = {}) {
  const titleTag = title ? `<title>${title}</title>` : "";
  const canonicalTag = canonical ? `<link rel="canonical" href="https://ornscore.com/"/>` : "";
  const markerAttr = marker ? ` title="코드 ${marker}"` : "";
  const uni = universe ? `<p>${universe} 종목 유니버스</p>` : "";
  return (
    `<!doctype html><html lang="ko"><head>${titleTag}${canonicalTag}</head><body>` +
    `<main>${uni}<p>본문</p></main>` +
    `<footer><span${markerAttr}>데이터 ${date} (목) 장마감</span> · <span>산식 ${metrics}</span></footer>` +
    `</body></html>`
  );
}

function loginPage({ lang = "ko", toggle = false, providers = true } = {}) {
  const toggleMarkup = toggle ? `<a hreflang="en" href="/?lang=en">EN</a>` : "";
  const prov = providers ? `<button>카카오로 시작하기</button><button>구글로 시작하기</button>` : "";
  return `<!doctype html><html lang="${lang}"><head><title>로그인</title></head><body>${toggleMarkup}${prov}<p>홈으로</p></body></html>`;
}
function loginOpts(variant) {
  switch (variant) {
    case "en": return { lang: "en" };
    case "toggle": return { toggle: true };
    case "noprovider": return { providers: false };
    default: return {};
  }
}

const SITE = "https://ornscore.com";
const SITEMAP_PATHS = [
  "/", "/today", "/stocks", "/compare", "/disclosures", "/backtest", "/guide/metrics",
  "/pricing", "/about", "/terms", "/privacy", "/data-deletion",
  "/stock/005930", "/topics/undervalued-stocks", "/compare/005930-vs-000660",
];
function sitemapXml(variant) {
  const lm = lastmodIsoFromData(MODE.data === "next-day" ? GOOD_DATA_NEXT : GOOD_DATA);
  let list = SITEMAP_PATHS.slice();
  if (variant === "drop-required") list = list.filter((p) => p !== "/pricing");
  if (variant === "leak") list.push("/login");
  const urls = list
    .map((p) => `<url><loc>${SITE}${p === "/" ? "/" : p}</loc><lastmod>${lm}</lastmod></url>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}
function robotsTxt(variant) {
  const disallow = ["/api/", "/auth/", "/login", "/settings/", "/watchlist", "/history"];
  const dis = variant === "missing-disallow" ? disallow.filter((d) => d !== "/watchlist") : disallow;
  return ["User-agent: *", "Allow: /", ...dis.map((d) => `Disallow: ${d}`), "Host: ornscore.com", `Sitemap: ${SITE}/sitemap.xml`].join("\n");
}

function startMock() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    const p = url.pathname;
    const send = (body, status = 200, type = "text/html; charset=utf-8") => {
      res.writeHead(status, { "content-type": type });
      res.end(body);
    };
    if (p === "/data/stocks.json") {
      if (MODE.data === "404") return send("no", 404, "application/json");
      if (MODE.data === "malformed") return send("{", 200, "application/json");
      return send(JSON.stringify(MODE.data === "next-day" ? GOOD_DATA_NEXT : GOOD_DATA), 200, "application/json");
    }
    if (p === "/sitemap.xml") {
      if (MODE.sitemap === "404") return send("no", 404);
      return send(sitemapXml(MODE.sitemap), 200, "application/xml");
    }
    if (p === "/robots.txt") {
      if (MODE.robots === "404") return send("no", 404, "text/plain");
      return send(robotsTxt(MODE.robots), 200, "text/plain");
    }
    if (p === "/login") {
      if (MODE.login === "404") return send("no", 404);
      return send(loginPage(loginOpts(MODE.login)));
    }
    if (p === "/" || p === "/stocks" || p === "/stock/005930") {
      if (MODE.pages === "404") return send("no", 404);
      if (MODE.pages === "redirect") {
        res.writeHead(302, { location: "/elsewhere" });
        return res.end();
      }
      return send(contentPage(pageOpts(MODE.pages)));
    }
    return send("not found", 404);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}
function closeServer(server) {
  return new Promise((resolve) => server.close(() => resolve()));
}

// Drive one full verifier run with a scenario's mode overrides.
async function scenario(base, { mode = {}, now = NOW_ENFORCE, expectedSha = null, localData = GOOD_DATA, temporalConfig } = {}) {
  Object.assign(MODE, { pages: "good", data: "good", sitemap: "good", robots: "good", login: "good" }, mode);
  return runMarketCloseHealth({ base, expectedSha, now, localData, temporalConfig, counter: { requests: 0 } });
}

async function main() {
  // =========================================================================
  // §0  pure: temporal windows
  // =========================================================================
  check("§0a enforcing (Thu 19:30 KST)", classifyTemporal({ now: NOW_ENFORCE }).window === "enforcing");
  check("§0b pre_publication (Thu 17:30 KST, grace)", classifyTemporal({ now: NOW_GRACE }).window === "pre_publication" && classifyTemporal({ now: NOW_GRACE }).reason === "before_publication_deadline");
  check("§0c non_trading_day weekend (Sat)", (() => { const t = classifyTemporal({ now: NOW_WEEKEND }); return t.window === "non_trading_day" && t.reason === "weekend"; })());
  check("§0d non_trading_day holiday (listed)", (() => { const t = classifyTemporal({ now: NOW_HOLIDAY }); return t.window === "non_trading_day" && t.reason === "holiday"; })());
  check("§0e KST offset lands the wall clock", kstParts(NOW_ENFORCE).minutes === 19 * 60 + 30 && kstParts(NOW_ENFORCE).dateIso === "2026-07-16");
  check("§0f calendar override drops a holiday -> trading day", (() => { const t = classifyTemporal({ now: NOW_HOLIDAY, holidays: new Set() }); return t.isTradingDay === true && t.window !== "non_trading_day"; })());
  check("§0g grace/close override moves the deadline", classifyTemporal({ now: NOW_GRACE, closeMinutes: 0, graceMinutes: 0 }).window === "enforcing");
  check("§0h default holiday list is non-empty + ISO", DEFAULT_HOLIDAYS_2026.length > 0 && DEFAULT_HOLIDAYS_2026.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)));

  // =========================================================================
  // §1  pure: local-data invariants
  // =========================================================================
  check("§1a good data -> no findings", evaluateLocalData(GOOD_DATA).findings.length === 0);
  check("§1b universe drift -> universe_drift", evaluateLocalData(DATA_UNIVERSE_DRIFT).findings.some((f) => f.code === "universe_drift" && f.severity === "hard"));
  check("§1c metrics drift -> metrics_drift", evaluateLocalData(DATA_METRICS_DRIFT).findings.some((f) => f.code === "metrics_drift" && f.severity === "hard"));
  check("§1d null -> malformed_data", evaluateLocalData(null).findings.some((f) => f.code === "malformed_data"));
  check("§1e no derivable date -> malformed_data", evaluateLocalData(DATA_NODATE).findings.some((f) => f.code === "malformed_data"));
  check("§1f no stocks[] -> malformed_data", evaluateLocalData({ metricsVersion: "2.4", asOfBusinessDate: "20260716" }).findings.some((f) => f.code === "malformed_data"));

  // =========================================================================
  // §2  pure: overall precedence (fail-closed)
  // =========================================================================
  const hardF = [{ ok: false, severity: "hard", code: "broken_route" }];
  const freshF = [{ ok: false, severity: "freshness", code: "stale_publication" }];
  check("§2a hard outranks weekend WAIT -> FAIL", classifyOverall({ temporal: { window: "non_trading_day", reason: "weekend" }, findings: hardF }).verdict === "FAIL");
  check("§2b non_trading_day, clean -> WAIT", classifyOverall({ temporal: { window: "non_trading_day", reason: "weekend" }, findings: [] }).verdict === "WAIT");
  check("§2c grace + freshness -> WAIT", classifyOverall({ temporal: { window: "pre_publication", reason: "before_publication_deadline" }, findings: freshF }).verdict === "WAIT");
  check("§2d grace + clean -> PASS", classifyOverall({ temporal: { window: "pre_publication", reason: "before_publication_deadline" }, findings: [] }).verdict === "PASS");
  check("§2e enforcing + freshness -> FAIL", classifyOverall({ temporal: { window: "enforcing" }, findings: freshF }).verdict === "FAIL");
  check("§2f enforcing + clean -> PASS", classifyOverall({ temporal: { window: "enforcing" }, findings: [] }).verdict === "PASS");

  check("enforcing freshness ignores stale checkout date",
    deriveExpectedForTemporal(GOOD_DATA, classifyTemporal({ now: NOW_MONDAY_ENFORCE })).dataDate === "2026.07.20");

  const server = await startMock();
  const base = `http://127.0.0.1:${server.address().port}`;
  let serverStoppedProven = false;

  try {
    const staleCheckout = await scenario(base, { now: NOW_MONDAY_ENFORCE });
    check("enforcing uses current trading date, not stale checkout",
      staleCheckout.verdict === "FAIL" && staleCheckout.reason === "stale_publication" && staleCheckout.expected.dataDate === "2026.07.20");
    check("§pre EXPECT_LASTMOD derivable from fixture data", typeof EXPECT_LASTMOD === "string" && EXPECT_LASTMOD.length > 0);

    const advancedLive = await scenario(base, {
      mode: { pages: "next-day", data: "next-day" },
      now: NOW_FRIDAY_ENFORCE,
    });
    check("deployed data/sitemap may advance beyond a stale local checkout",
      advancedLive.verdict === "PASS" && advancedLive.expected.dataDate === "2026.07.17");

    // =======================================================================
    // §3  end-to-end PASS / WAIT (healthy)
    // =======================================================================
    {
      const pass = await scenario(base, { now: NOW_ENFORCE });
      check("§3a enforcing + all healthy -> PASS", pass.verdict === "PASS" && pass.reason === "fresh_confirmed" && pass.failures.length === 0);

      const passSha = await scenario(base, { now: NOW_ENFORCE, expectedSha: "abc1234" });
      check("§3b enforcing + matching marker -> PASS", passSha.verdict === "PASS" && passSha.observations.every((o) => o.marker === "match" || o.marker == null));

      const weekend = await scenario(base, { now: NOW_WEEKEND });
      check("§3c weekend + healthy -> WAIT/weekend", weekend.verdict === "WAIT" && weekend.reason === "weekend");

      const holiday = await scenario(base, { now: NOW_HOLIDAY });
      check("§3d holiday + healthy -> WAIT/holiday", holiday.verdict === "WAIT" && holiday.reason === "holiday");
    }

    // =======================================================================
    // §4  temporal boundary — SAME stale fixture, only the clock moves
    // =======================================================================
    {
      const waitStale = await scenario(base, { mode: { pages: "stale-date" }, now: NOW_GRACE });
      check("§4a stale date in grace -> WAIT (freshness deferred)", waitStale.verdict === "WAIT" && waitStale.reason === "before_publication_deadline" && waitStale.summary.freshness > 0);

      const failStale = await scenario(base, { mode: { pages: "stale-date" }, now: NOW_ENFORCE });
      check("§4b same stale date when enforcing -> FAIL/stale_publication", failStale.verdict === "FAIL" && failStale.reason === "stale_publication");
    }

    // =======================================================================
    // §5  --expected-sha marker logic
    // =======================================================================
    {
      const mismatch = await scenario(base, { now: NOW_ENFORCE, expectedSha: "deadbee" });
      check("§5a served marker present but != expected-sha -> FAIL/sha_mismatch", mismatch.verdict === "FAIL" && mismatch.reason === "sha_mismatch");

      const mismatchWeekend = await scenario(base, { now: NOW_WEEKEND, expectedSha: "deadbee" });
      check("§5b sha_mismatch outranks weekend WAIT -> FAIL", mismatchWeekend.verdict === "FAIL" && mismatchWeekend.reason === "sha_mismatch");

      const absentGrace = await scenario(base, { mode: { pages: "marker-absent" }, now: NOW_GRACE, expectedSha: "abc1234" });
      check("§5c marker absent + expected-sha in grace -> WAIT (deploy in flight)", absentGrace.verdict === "WAIT" && absentGrace.summary.freshness > 0);

      const absentEnforce = await scenario(base, { mode: { pages: "marker-absent" }, now: NOW_ENFORCE, expectedSha: "abc1234" });
      check("§5d marker absent + expected-sha enforcing -> FAIL/deploy_marker_absent", absentEnforce.verdict === "FAIL" && absentEnforce.reason === "deploy_marker_absent");
    }

    // =======================================================================
    // §6  fail-closed negative controls — every hard-FAIL family bites
    // =======================================================================
    {
      const broken = await scenario(base, { mode: { pages: "404" }, now: NOW_ENFORCE });
      check("§6a broken route (404) -> FAIL/broken_route", broken.verdict === "FAIL" && broken.reason === "broken_route");

      const redirect = await scenario(base, { mode: { pages: "redirect" }, now: NOW_ENFORCE });
      check("§6b unexpected redirect -> FAIL/broken_route", redirect.verdict === "FAIL" && redirect.reason === "broken_route");

      const noTitle = await scenario(base, { mode: { pages: "notitle" }, now: NOW_ENFORCE });
      check("§6c missing <title> -> FAIL/broken_route", noTitle.verdict === "FAIL" && noTitle.reason === "broken_route");

      const servedUniverse = await scenario(base, { mode: { pages: "no138" }, now: NOW_ENFORCE });
      check("§6d served universe missing -> FAIL/universe_drift", servedUniverse.verdict === "FAIL" && servedUniverse.reason === "universe_drift");

      const localUniverse = await scenario(base, { now: NOW_ENFORCE, localData: DATA_UNIVERSE_DRIFT });
      check("§6e local universe != 138 -> FAIL/universe_drift", localUniverse.verdict === "FAIL" && localUniverse.reason === "universe_drift");

      const servedMetrics = await scenario(base, { mode: { pages: "nometrics" }, now: NOW_ENFORCE });
      check("§6f served metrics label wrong -> FAIL/metrics_drift", servedMetrics.verdict === "FAIL" && servedMetrics.reason === "metrics_drift");

      const localMetrics = await scenario(base, { now: NOW_ENFORCE, localData: DATA_METRICS_DRIFT });
      check("§6g local metrics != 2.4 -> FAIL/metrics_drift", localMetrics.verdict === "FAIL" && localMetrics.reason === "metrics_drift");

      const malformed = await scenario(base, { now: NOW_ENFORCE, localData: null });
      check("§6h malformed local data -> FAIL/malformed_data", malformed.verdict === "FAIL" && malformed.reason === "malformed_data");

      const authEn = await scenario(base, { mode: { login: "en" }, now: NOW_ENFORCE });
      check("§6i login lang=en -> FAIL/auth_language_regression", authEn.verdict === "FAIL" && authEn.reason === "auth_language_regression");

      const authToggle = await scenario(base, { mode: { login: "toggle" }, now: NOW_ENFORCE });
      check("§6j login KO/EN toggle marker -> FAIL/auth_language_regression", authToggle.verdict === "FAIL" && authToggle.reason === "auth_language_regression");

      const smLeak = await scenario(base, { mode: { sitemap: "leak" }, now: NOW_ENFORCE });
      check("§6k sitemap leaks a private route -> FAIL/sitemap_contract", smLeak.verdict === "FAIL" && smLeak.failures.some((f) => f.code === "sitemap_contract"));

      const smDrop = await scenario(base, { mode: { sitemap: "drop-required" }, now: NOW_ENFORCE });
      check("§6l sitemap drops a required route -> FAIL/sitemap_contract", smDrop.verdict === "FAIL" && smDrop.failures.some((f) => f.code === "sitemap_contract"));

      const rbDrop = await scenario(base, { mode: { robots: "missing-disallow" }, now: NOW_ENFORCE });
      check("§6m robots missing a Disallow -> FAIL/robots_contract", rbDrop.verdict === "FAIL" && rbDrop.failures.some((f) => f.code === "robots_contract"));

      const loginDown = await scenario(base, { mode: { login: "404" }, now: NOW_ENFORCE });
      check("§6n /login unreachable -> FAIL/login_broken", loginDown.verdict === "FAIL" && loginDown.failures.some((f) => f.code === "login_broken"));
    }

    // =======================================================================
    // §7  evidence hygiene — deterministic, secret-free, no timestamp
    // =======================================================================
    {
      const a = await scenario(base, { now: NOW_ENFORCE, expectedSha: "abc1234" });
      const b = await scenario(base, { now: NOW_ENFORCE, expectedSha: "abc1234" });
      check("§7a two runs -> byte-identical evidence", JSON.stringify(a) === JSON.stringify(b));
      const json = JSON.stringify(a).replace(String(server.address().port), "");
      check("§7b evidence carries no 13-digit epoch timestamp", !/\b\d{13}\b/.test(json));
      check("§7c evidence is secret-free", !looksLikeSecret(JSON.stringify(a)));
      check("§7d secret detector is not vacuous (positive control)", looksLikeSecret("AKIAIOSFODNN7EXAMPLE"));
      check("§7e base userinfo is redacted", (await scenario(`http://user:pass@127.0.0.1:${server.address().port}`, { now: NOW_ENFORCE })).base.indexOf("pass") === -1);
    }
  } finally {
    // =======================================================================
    // §8  STOP the task-owned server and PROVE it is stopped
    // =======================================================================
    await closeServer(server);
    check("§8a mock server reports not listening after close", server.listening === false);
    const afterStop = await scenario(base, { now: NOW_ENFORCE });
    check("§8b a request to the stopped server now FAILs (broken_route)", afterStop.verdict === "FAIL" && afterStop.failures.some((f) => f.code === "broken_route"));
    serverStoppedProven = true;
  }

  console.log("");
  if (!serverStoppedProven) {
    console.error("MARKET-CLOSE-HEALTH SELF-TEST FAILED: could not prove the loopback server was stopped.");
    process.exit(1);
  }
  if (failed > 0) {
    console.error(`MARKET-CLOSE-HEALTH SELF-TEST FAILED (${failed} check${failed === 1 ? "" : "s"}).`);
    process.exit(1);
  }
  console.log("MARKET-CLOSE-HEALTH SELF-TEST PASSED. PASS/WAIT/FAIL model + every fail-closed control verified; task-owned loopback server stopped.");
  process.exit(0);
}

main().catch((err) => {
  console.error("MARKET-CLOSE-HEALTH SELF-TEST CRASHED:", err);
  process.exit(1);
});
