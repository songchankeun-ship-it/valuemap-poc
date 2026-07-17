// Finite offline self-test for the SEO release gate (Slice E of
// docs/ornscore-seo-authority-plan-2026-07-18.md).
// Run: npx tsx scripts/test_seoRelease.ts — PASS on success, non-zero exit on failure.
//
// Two parts, both deterministic and offline:
//   PART A — pure fixtures. Drives every exported evaluator with positive AND negative
//     fixture HTML, and proves the gate demonstrably FAILS on the five named faults:
//       1. stale (or missing) deployment SHA
//       2. duplicate canonical ownership
//       3. mock-backed indexing
//       4. arbitrary/reverse pair exposure
//       5. volatile metadata in title/description
//     The contract faults reuse verifySeoContract() (the same function the gate calls).
//   PART B — a TASK-OWNED loopback mock HTTP server on 127.0.0.1. Runs the COMPLETE
//     decision (runSeoRelease) end-to-end against a full positive scenario (→ released),
//     a stale-marker scenario (→ fail), and a missing-SHA run (→ fail); then STOPS the
//     server and proves a fresh run fails closed (robots unreachable). No live service
//     is touched; the mock is started and stopped by this test.

import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { AddressInfo } from "node:net";

import {
  runSeoRelease,
  evalContract,
  evalSitemapContractDrift,
  evalTopic,
  evalCuratedComparison,
  evalExcludedComparison,
  evalThemeNoindex,
  evalRedirect,
  decideMarker,
  decideRelease,
  volatileHits,
  isNoindex,
  canonicalHref,
  jsonLdTypes,
  bodyLinks,
  extractTitle,
  type CheckResult,
  type CanaryReportLike,
} from "./verify-seo-release";
import {
  verifySeoContract,
  defaultContractInput,
  CURATED_COMPARISON_PAIRS,
  curatedComparisonPaths,
  indexableTopicSlugs,
  legacyThemeRedirects,
  MOCK_BACKED_INDEXING_EXCLUSIONS,
} from "@/lib/seoContract";
import { comparisonMetadata } from "@/lib/comparison";
// Reuse the same expected-state + lastmod helpers the gate reuses, so the mock's
// sitemap lastmod and the canary's expected date/version stay consistent with the gate.
import { buildExpected } from "./verify-route-canary.mjs";
import { expectedLastmodIso } from "./verify-public-seo.mjs";

const SITE = "https://ornscore.com";
const DATA_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "data", "stocks.json");
const SHA = "abcdef1234567890abcdef1234567890abcdef12";
const SHA7 = SHA.slice(0, 7);

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}

// ===========================================================================
// PART A — pure fixtures
// ===========================================================================

// --- fixture HTML builders --------------------------------------------------
function head(parts: { title?: string; canonical?: string; noindex?: boolean; description?: string }): string {
  const bits: string[] = [];
  if (parts.title !== undefined) bits.push(`<title>${parts.title}</title>`);
  if (parts.canonical) bits.push(`<link rel="canonical" href="${parts.canonical}"/>`);
  if (parts.noindex) bits.push(`<meta name="robots" content="noindex, follow"/>`);
  if (parts.description !== undefined) bits.push(`<meta name="description" content="${parts.description}"/>`);
  return `<head>${bits.join("")}</head>`;
}
function jsonLd(obj: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;
}
function link(href: string): string {
  return `<a href="${href}">x</a>`;
}

// good topic fixture
function topicHtml(slug: string, opts: { noindex?: boolean; canonical?: string; collection?: boolean; stockLink?: boolean; description?: string } = {}): string {
  return (
    "<html>" +
    head({
      title: `주제 ${slug} | 오른스코어`,
      canonical: opts.canonical ?? `${SITE}/topics/${slug}`,
      noindex: opts.noindex,
      description: opts.description ?? "실데이터 기반 종목 탐색 화면입니다.",
    }) +
    "<body>" +
    (opts.collection === false ? "" : jsonLd({ "@context": "https://schema.org", "@type": "CollectionPage", name: slug })) +
    (opts.stockLink === false ? "" : link(`/stock/005930`)) +
    "</body></html>"
  );
}

// curated comparison fixture (defaults to the stable, correct page)
function compareHtml(slug: string, a: string, b: string, meta: { title: string; description: string }, opts: { noindex?: boolean; canonical?: string; breadcrumb?: boolean; title?: string; description?: string; links?: boolean } = {}): string {
  return (
    "<html>" +
    head({
      title: opts.title ?? meta.title,
      canonical: opts.canonical ?? `${SITE}/compare/${slug}`,
      noindex: opts.noindex,
      description: opts.description ?? meta.description,
    }) +
    "<body>" +
    (opts.breadcrumb === false ? "" : jsonLd({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [] })) +
    (opts.links === false ? "" : link(`/stock/${a}`) + link(`/stock/${b}`) + link(`/compare?stocks=${a},${b}`)) +
    "</body></html>"
  );
}

// excluded (arbitrary/reverse) fixture — correct behavior is noindex + no self-canonical
function excludedHtml(slug: string, opts: { noindex?: boolean; selfCanonical?: boolean } = {}): string {
  return (
    "<html>" +
    head({
      title: "비교를 찾을 수 없습니다 — 오른스코어",
      canonical: opts.selfCanonical ? `${SITE}/compare/${slug}` : undefined,
      noindex: opts.noindex ?? true,
    }) +
    "<body>not found</body></html>"
  );
}

// mock-only theme fixture — correct is noindex, no self-canonical, empty state
function themeRobotHtml(slug: string, opts: { noindex?: boolean; selfCanonical?: boolean } = {}): string {
  return (
    "<html>" +
    head({
      title: "로봇 관련주 테마 종목 — 오른스코어",
      canonical: opts.selfCanonical ? `${SITE}/theme/${slug}` : undefined,
      noindex: opts.noindex ?? true,
    }) +
    "<body>실제 커버리지가 확보될 때까지 이 테마는 검색 색인 대상이 아닙니다.</body></html>"
  );
}

// --- topic evaluator --------------------------------------------------------
{
  const slug = "undervalued-stocks";
  check("A/topic: good topic passes", evalTopic(topicHtml(slug), slug, 200).length === 0);
  check("A/topic: noindex real topic fails", evalTopic(topicHtml(slug, { noindex: true }), slug, 200).some((r) => /noindex/.test(r)));
  check("A/topic: wrong canonical fails", evalTopic(topicHtml(slug, { canonical: `${SITE}/topics/other` }), slug, 200).some((r) => /canonical/.test(r)));
  check("A/topic: missing CollectionPage fails", evalTopic(topicHtml(slug, { collection: false }), slug, 200).some((r) => /CollectionPage/.test(r)));
  check("A/topic: no stock link fails", evalTopic(topicHtml(slug, { stockLink: false }), slug, 200).some((r) => /stock/.test(r)));
  check("A/topic: non-200 fails", evalTopic(topicHtml(slug), slug, 404).some((r) => /status/.test(r)));
  check("A/topic: volatile description fails", evalTopic(topicHtml(slug, { description: "현재가 72,000원 기준" }), slug, 200).some((r) => /volatile/.test(r)));
}

// --- curated comparison evaluator ------------------------------------------
{
  const p = CURATED_COMPARISON_PAIRS[0];
  const meta = comparisonMetadata(p.slug)!;
  const expected = { title: meta.title, description: meta.description, a: p.a, b: p.b, interactive: `/compare?stocks=${p.a},${p.b}` };
  check("A/compare: good curated page passes", evalCuratedComparison(compareHtml(p.slug, p.a, p.b, meta), p.slug, 200, expected).length === 0);
  check("A/compare: noindex fails", evalCuratedComparison(compareHtml(p.slug, p.a, p.b, meta, { noindex: true }), p.slug, 200, expected).some((r) => /noindex/.test(r)));
  check("A/compare: missing breadcrumb fails", evalCuratedComparison(compareHtml(p.slug, p.a, p.b, meta, { breadcrumb: false }), p.slug, 200, expected).some((r) => /BreadcrumbList/.test(r)));
  check("A/compare: missing stock/interactive links fails", evalCuratedComparison(compareHtml(p.slug, p.a, p.b, meta, { links: false }), p.slug, 200, expected).some((r) => /link/.test(r)));
  check("A/compare: wrong canonical fails", evalCuratedComparison(compareHtml(p.slug, p.a, p.b, meta, { canonical: `${SITE}/compare/other` }), p.slug, 200, expected).some((r) => /canonical/.test(r)));
  // FAULT 5 — volatile metadata: a title carrying a price/score is a drift AND a volatile hit.
  const volatileTitle = `${meta.title} 87점 72,000원`;
  const volRes = evalCuratedComparison(compareHtml(p.slug, p.a, p.b, meta, { title: volatileTitle }), p.slug, 200, expected);
  check("A/compare: FAULT volatile metadata detected", volRes.some((r) => /volatile/.test(r)) && volRes.some((r) => /title/.test(r)));
}

// --- excluded (arbitrary/reverse) evaluator (FAULT 4, behavioral) ----------
{
  const slug = "005930-vs-035420";
  check("A/excluded: correct noindex non-self-canonical passes", evalExcludedComparison(excludedHtml(slug), slug, 200).length === 0);
  check("A/excluded: FAULT indexable arbitrary pair detected", evalExcludedComparison(excludedHtml(slug, { noindex: false }), slug, 200).some((r) => /noindex/i.test(r)));
  check("A/excluded: FAULT self-canonical arbitrary pair detected", evalExcludedComparison(excludedHtml(slug, { selfCanonical: true }), slug, 200).some((r) => /canonical/.test(r)));
}

// --- mock-only theme evaluator (FAULT 3, behavioral) -----------------------
{
  const slug = "robot";
  check("A/theme: correct noindex robot theme passes", evalThemeNoindex(themeRobotHtml(slug), slug, 200).length === 0);
  check("A/theme: FAULT mock-backed indexable theme detected", evalThemeNoindex(themeRobotHtml(slug, { noindex: false }), slug, 200).some((r) => /noindex/.test(r)));
  check("A/theme: FAULT self-canonical mock theme detected", evalThemeNoindex(themeRobotHtml(slug, { selfCanonical: true }), slug, 200).some((r) => /canonical/.test(r)));
}

// --- redirect evaluator -----------------------------------------------------
{
  const to = "/topics/battery-stocks";
  check("A/redirect: good permanent redirect passes", evalRedirect([{ status: 308, location: `${SITE}${to}` }], to).length === 0);
  check("A/redirect: temporary redirect fails", evalRedirect([{ status: 302, location: `${SITE}${to}` }], to).some((r) => /301\/308|status/.test(r)));
  check("A/redirect: wrong target fails", evalRedirect([{ status: 308, location: `${SITE}/topics/other` }], to).some((r) => /!= expected/.test(r)));
  check("A/redirect: no redirect fails", evalRedirect([], to).some((r) => /no redirect/.test(r)));
}

// --- volatile-metadata scanner (FAULT 5, unit) -----------------------------
check("A/volatile: price detected", volatileHits("현재가 72,000원").length > 0);
check("A/volatile: score detected", volatileHits("종합 87점").length > 0);
check("A/volatile: multiple detected", volatileHits("PER 12.3배").length > 0);
check("A/volatile: percent detected", volatileHits("ROE 15.2%").length > 0);
check("A/volatile: stable ticker text is clean", volatileHits("삼성전자 vs SK하이닉스 비교 (005930·000660) — 오른스코어").length === 0);
check("A/volatile: real curated descriptions are all clean", CURATED_COMPARISON_PAIRS.every((p) => volatileHits(comparisonMetadata(p.slug)!.description).length === 0));

// --- deployment-marker decision (FAULT 1) ----------------------------------
function canarySummary(byClass: Record<string, number>, failedN: number): CanaryReportLike {
  return { summary: { total: 6, ok: 6 - failedN, failed: failedN, byClass }, routes: [] };
}
check("A/marker: FAULT missing SHA fails (not a warning)", decideMarker({ shaProvided: false, canary: null }).ok === false);
check("A/marker: FAULT missing SHA reason mentions --sha", /--sha|expected deployment SHA/.test(decideMarker({ shaProvided: false, canary: null }).reason));
check(
  "A/marker: FAULT stale marker fails",
  (() => {
    const d = decideMarker({ shaProvided: true, canary: canarySummary({ stale_marker: 1 }, 1) });
    return d.ok === false && /stale/i.test(d.reason);
  })(),
);
check("A/marker: marker absent fails", (() => {
  const c: CanaryReportLike = { summary: { total: 6, ok: 5, failed: 1, byClass: { content: 1 } }, routes: [{ path: "/", class: "content", failures: [{ class: "content", message: 'footer build marker absent (expected "abcdef1")' }] }] };
  const d = decideMarker({ shaProvided: true, canary: c });
  return d.ok === false && /absent/i.test(d.reason);
})());
check("A/marker: clean match passes", decideMarker({ shaProvided: true, canary: canarySummary({}, 0) }).ok === true);

// --- contract faults (FAULTS 2,3,4 at the registry level; reuse verifySeoContract) ---
const base = defaultContractInput();
const sitemapStatic = [...base.staticIndexablePaths];
function mutate(patch: Partial<typeof base>): Set<string> {
  return new Set(verifySeoContract({ ...base, sitemapStaticPaths: sitemapStatic, ...patch }).map((v) => v.code));
}
check("A/contract: real contract is clean (gate check passes)", evalContract(sitemapStatic).length === 0);
// FAULT 2 — duplicate canonical ownership (battery theme indexed alongside its topic).
check("A/contract: FAULT duplicate ownership detected", mutate({ indexableThemeSlugs: ["battery"] }).has("OWNERSHIP_DUP"));
// FAULT 3 — mock-backed indexing (robot dropped from the exclusion list → indexable zero-real theme).
check("A/contract: FAULT mock-backed indexing detected", mutate({ exclusions: MOCK_BACKED_INDEXING_EXCLUSIONS.filter((s) => s !== "robot") }).has("ZERO_REAL_MATCH"));
check("A/contract: FAULT indexed zero-real theme detected", mutate({ indexableThemeSlugs: ["robot"] }).has("ZERO_REAL_MATCH"));
// FAULT 4 — arbitrary pair exposure (unknown ticker) and reverse-order alternate canonical.
check("A/contract: FAULT arbitrary pair detected", mutate({ pairs: [...CURATED_COMPARISON_PAIRS, { slug: "005930-vs-999999", a: "005930", b: "999999" }] }).has("PAIR_UNKNOWN_TICKER"));
check("A/contract: FAULT reverse-order pair detected", mutate({ pairs: [...CURATED_COMPARISON_PAIRS, { slug: "000660-vs-005930", a: "000660", b: "005930" }] }).has("PAIR_REVERSE"));

// --- sitemap ⇄ contract drift ----------------------------------------------
{
  const good = [...curatedComparisonPaths(), ...indexableTopicSlugs().map((s) => `/topics/${s}`), "/", "/stocks"];
  check("A/drift: consistent sitemap passes", evalSitemapContractDrift(good).length === 0);
  check("A/drift: missing curated pair detected", evalSitemapContractDrift(good.filter((p) => p !== curatedComparisonPaths()[0])).some((r) => /missing from sitemap/.test(r)));
  check("A/drift: legacy /theme leak detected", evalSitemapContractDrift([...good, "/theme/battery"]).some((r) => /retired legacy theme/.test(r)));
  check("A/drift: missing topic detected", evalSitemapContractDrift(good.filter((p) => p !== `/topics/${indexableTopicSlugs()[0]}`)).some((r) => /real topic/.test(r)));
}

// --- decideRelease ----------------------------------------------------------
check("A/release: all-ok releases", decideRelease([{ label: "x", ok: true, reasons: [] }]) === true);
check("A/release: any-fail blocks", decideRelease([{ label: "x", ok: true, reasons: [] }, { label: "y", ok: false, reasons: ["bad"] }]) === false);
check("A/release: empty blocks", decideRelease([]) === false);

// ===========================================================================
// PART B — loopback mock end-to-end (task-owned server, started+stopped here)
// ===========================================================================

interface Scenario {
  staleMarker?: boolean;
}

// A full, positive public surface for the REAL slugs/pairs/routes the gate probes,
// derived from the same sources the gate imports so they always agree.
function buildResponder(scenario: Scenario) {
  const expected = buildExpected(DATA_PATH, SHA7) as { dataDate: string; metricsVersionLabel: string | null };
  const marker = scenario.staleMarker ? "deadbee" : SHA7;
  const lastmod = expectedLastmodIso() as string; // real data date; equals the gate's expectation

  const footer = `<footer><span title="코드 ${marker}">데이터 ${expected.dataDate} 장마감</span> · ${expected.metricsVersionLabel ?? "Metrics -"} · 데이터 상태</footer>`;

  function fullPage(path: string, title: string): string {
    // A canary-satisfying page: title + self-canonical + visible date + metrics version + footer marker.
    return (
      "<html>" +
      head({ title, canonical: `${SITE}${path === "/" ? "/" : path}` }) +
      `<body><main>${expected.dataDate} 기준 · ${expected.metricsVersionLabel ?? "Metrics -"}</main>${footer}</body></html>`
    );
  }

  function robots(): string {
    return [
      "User-Agent: *",
      "Allow: /",
      "Disallow: /api/",
      "Disallow: /auth/",
      "Disallow: /login",
      "Disallow: /settings/",
      "Disallow: /watchlist",
      "Disallow: /history",
      `Host: ${SITE}`,
      `Sitemap: ${SITE}/sitemap.xml`,
      "",
    ].join("\n");
  }

  function sitemap(): string {
    const paths = [
      "/", "/today", "/stocks", "/compare", "/disclosures", "/backtest", "/guide/metrics",
      "/pricing", "/about", "/terms", "/privacy", "/data-deletion",
      ...indexableTopicSlugs().map((s) => `/topics/${s}`),
      ...curatedComparisonPaths(),
      "/stock/005930",
    ];
    const urls = paths
      .map((p) => `<url><loc>${SITE}${p === "/" ? "/" : p}</loc><lastmod>${lastmod}</lastmod></url>`)
      .join("");
    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  }

  const curatedSlugs = new Set(CURATED_COMPARISON_PAIRS.map((p) => p.slug));
  const redirectMap = new Map(legacyThemeRedirects().map((r) => [r.from, r.to]));

  return function respond(pathname: string): { status: number; headers: Record<string, string>; body: string } {
    const H = (ct: string): Record<string, string> => ({ "content-type": ct, connection: "close" });

    if (pathname === "/robots.txt") return { status: 200, headers: H("text/plain"), body: robots() };
    if (pathname === "/sitemap.xml") return { status: 200, headers: H("application/xml"), body: sitemap() };

    // Legacy theme permanent redirects.
    if (redirectMap.has(pathname)) {
      return { status: 308, headers: { location: `${SITE}${redirectMap.get(pathname)}`, connection: "close" }, body: "" };
    }
    // Mock-only theme (robot): noindex, no self-canonical, empty state.
    if (pathname.startsWith("/theme/")) {
      return { status: 200, headers: H("text/html"), body: themeRobotHtml(pathname.slice("/theme/".length)) };
    }

    // Topic landings.
    if (pathname.startsWith("/topics/")) {
      const slug = pathname.slice("/topics/".length);
      return { status: 200, headers: H("text/html"), body: topicHtml(slug) };
    }

    // Comparison landings: curated → stable page; else → noindex non-self-canonical.
    if (pathname.startsWith("/compare/")) {
      const slug = pathname.slice("/compare/".length);
      if (curatedSlugs.has(slug)) {
        const p = CURATED_COMPARISON_PAIRS.find((x) => x.slug === slug)!;
        const meta = comparisonMetadata(slug)!;
        return { status: 200, headers: H("text/html"), body: compareHtml(slug, p.a, p.b, meta) };
      }
      return { status: 200, headers: H("text/html"), body: excludedHtml(slug) };
    }

    // Canary routes + any other page: a full canary-satisfying page.
    const titles: Record<string, string> = {
      "/": "오른스코어 — 한국 주식 탐색 도구",
      "/status": "데이터 상태 — 오른스코어",
      "/about": "소개 — 오른스코어",
      "/pricing": "요금 — 오른스코어",
      "/stocks": "종목 탐색 — 오른스코어",
    };
    return { status: 200, headers: H("text/html"), body: fullPage(pathname, titles[pathname] ?? `${pathname} — 오른스코어`) };
  };
}

function startMock(scenario: Scenario): Promise<{ server: Server; base: string }> {
  const responder = buildResponder(scenario);
  const server = createServer((req, res) => {
    let pathname = "/";
    try {
      pathname = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
    } catch {
      pathname = "/";
    }
    const { status, headers, body } = responder(pathname);
    res.writeHead(status, headers);
    res.end(body);
  });
  return new Promise((resolveP) => {
    server.listen(0, "127.0.0.1", () => {
      const port = (server.address() as AddressInfo).port;
      resolveP({ server, base: `http://127.0.0.1:${port}` });
    });
  });
}

function stopMock(server: Server): Promise<void> {
  return new Promise((resolveP) => server.close(() => resolveP()));
}

function summarize(checks: CheckResult[]): string {
  return checks.filter((c) => !c.ok).map((c) => c.label).join(" | ") || "(all ok)";
}

async function partB(): Promise<void> {
  // (B1) positive scenario → the complete decision releases.
  {
    const { server, base } = await startMock({});
    try {
      const r = await runSeoRelease({ base, sha: SHA, dataPath: DATA_PATH });
      check(`B1: positive scenario releases (failing: ${summarize(r.checks)})`, r.released === true);
      check("B1: positive scenario every check ok", r.checks.every((c) => c.ok));
      check("B1: positive scenario ran the marker canary", r.canary !== null && r.canary.summary.failed === 0);
    } finally {
      await stopMock(server);
    }
  }

  // (B2) stale-marker scenario → fails on the deployment-marker check.
  {
    const { server, base } = await startMock({ staleMarker: true });
    try {
      const r = await runSeoRelease({ base, sha: SHA, dataPath: DATA_PATH });
      check("B2: stale marker blocks release", r.released === false);
      const markerCheck = r.checks.find((c) => /deployment-marker SHA match/.test(c.label));
      check("B2: stale marker fails the deployment-marker check", !!markerCheck && !markerCheck.ok && markerCheck.reasons.some((x) => /stale/i.test(x)));
    } finally {
      await stopMock(server);
    }
  }

  // (B3) missing SHA against a healthy server → still blocks (publication proof missing).
  {
    const { server, base } = await startMock({});
    try {
      const r = await runSeoRelease({ base, sha: "", dataPath: DATA_PATH });
      check("B3: missing SHA blocks release", r.released === false);
      const markerCheck = r.checks.find((c) => /deployment-marker SHA match/.test(c.label));
      check("B3: missing SHA fails the marker check as a hard failure", !!markerCheck && !markerCheck.ok);
      // Every non-marker check should still pass on the healthy server (fault is isolated).
      const nonMarkerFails = r.checks.filter((c) => c.ok === false && !/deployment-marker/.test(c.label));
      check(`B3: only the marker check fails (others: ${nonMarkerFails.map((c) => c.label).join(",") || "none"})`, nonMarkerFails.length === 0);
    } finally {
      await stopMock(server);
    }
  }

  // (B4) after the server is stopped, a fresh run fails closed (robots unreachable).
  {
    const { server, base } = await startMock({});
    await stopMock(server);
    const r = await runSeoRelease({ base, sha: SHA, dataPath: DATA_PATH });
    check("B4: stopped server → not released (fails closed)", r.released === false);
    check("B4: stopped server → robots/sitemap unreachable", r.robotsOk === false || r.sitemapOk === false);
  }
}

// ===========================================================================
async function run(): Promise<void> {
  // Guard: this test reads the real dataset; if it is unreadable the test is invalid.
  check("dataset readable", (() => {
    try {
      return readFileSync(DATA_PATH, "utf8").length > 0;
    } catch {
      return false;
    }
  })());

  // Sanity: the pure HTML helpers behave (non-vacuous self-checks).
  check("selftest: isNoindex true on noindex fixture", isNoindex('<head><meta name="robots" content="noindex, follow"/></head>'));
  check("selftest: isNoindex false without meta", !isNoindex("<head><title>x</title></head>"));
  check("selftest: canonicalHref extracts", canonicalHref(`<head><link rel="canonical" href="${SITE}/x"/></head>`) === `${SITE}/x`);
  check("selftest: jsonLdTypes finds nested types", jsonLdTypes(jsonLd({ "@type": "BreadcrumbList" })).includes("BreadcrumbList"));
  check("selftest: bodyLinks extracts hrefs", bodyLinks(link("/stock/005930")).includes("/stock/005930"));
  check("selftest: extractTitle", extractTitle("<head><title>Hello</title></head>") === "Hello");

  await partB();

  if (failed > 0) {
    console.error(`\n${failed} check(s) FAILED`);
    process.exit(1);
  }
  console.log(
    "PASS: SEO release gate — reuses verifySeoContract + route/marker helpers to cover robots, sitemap, topic authority, retired themes, curated comparisons, metadata stability, JSON-LD, noindex, internal links, and deployment-marker SHA; demonstrably fails on stale/missing SHA, duplicate canonical ownership, mock-backed indexing, arbitrary/reverse pair exposure, and volatile metadata; full positive/negative loopback runs pass and the task-owned mock is stopped.",
  );
}

run();
