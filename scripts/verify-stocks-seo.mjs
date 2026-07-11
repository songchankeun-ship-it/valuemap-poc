// /stocks 필터 URL 과 /stock/[ticker] 메타 스니펫의 색인 동작 검증 게이트.
//
// generateMetadata({ searchParams }) 가 방출하는 <head> 의 robots meta 와 canonical link 를
// 실제 SSR HTML 에서 확인한다. verify-routes.mjs 는 visible text 만 보므로 head 메타를 못 잡는다 —
// 이 스크립트는 raw HTML 을 파싱해 다음 계약을 강제한다:
//   - 기본 /stocks 와 단일 업종/테마(결과 존재) 페이지는 색인 대상(noindex 아님) + 올바른 canonical.
//   - 0건 조합 / 자유 검색어(q) / 다축 조합 / 과다·미인식 파라미터 URL 은 noindex + canonical=/stocks.
//   - 종목 상세 description/OG/Twitter/JSON-LD 설명은 매일 바뀌는 점수·PER/PBR·수익률·옛 용어를
//     노출하지 않고, 안정적인 지표/재무/공시/데이터 기준일/비자문 프레이밍을 유지한다.
//   - 홈·발견(/stocks) head 메타(제목/설명/OG/Twitter/keywords)에 옛 지표명(모멘텀·변동성조정 등)이
//     되살아나지 않는다.
//   - 백테스트 페이지는 색인·발견은 유지하되(index/follow) robots nosnippet 을 유지해 과거 성과
//     숫자가 검색·AI 스니펫에 맥락 없이 노출되지 않는다.
// 이미 실행 중인 서버만 측정하며, 서버를 켜거나 끄지 않는다. 실패 시 exit 1.
//
// Usage:
//   npm run build
//   npx next start -p 4489
//   node scripts/verify-stocks-seo.mjs --base http://localhost:4489
//   # env form (flag wins over env):
//   VERIFY_BASE_URL=http://localhost:4489 node scripts/verify-stocks-seo.mjs

function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i !== -1 && i + 1 < process.argv.length) return process.argv[i + 1];
  return fallback;
}

const BASE = (argValue("--base", process.env.VERIFY_BASE_URL) || "http://localhost:4489").replace(/\/+$/, "");
const SITE = "https://ornscore.com";

// --- head parsing -----------------------------------------------------------
function headOf(html) {
  const m = html.match(/<head[\s\S]*?<\/head>/i);
  return m ? m[0] : html;
}

function decodeHtml(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function tagAttr(tag, attr) {
  const m = tag.match(new RegExp(`\\s${attr}=["']([^"']*)["']`, "i"));
  return m ? decodeHtml(m[1]) : null;
}

// robots meta content (Next emits <meta name="robots" content="noindex, follow"/>).
function robotsContent(html) {
  const head = headOf(html);
  const m = head.match(/<meta[^>]*name=["']robots["'][^>]*>/i);
  if (!m) return null;
  return (tagAttr(m[0], "content") ?? "").toLowerCase();
}

function isNoindex(html) {
  const c = robotsContent(html);
  return c != null && c.includes("noindex");
}

// canonical href (Next emits <link rel="canonical" href="https://ornscore.com/stocks"/>).
function canonicalHref(html) {
  const head = headOf(html);
  const m = head.match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
  if (!m) return null;
  return tagAttr(m[0], "href") ?? "";
}

function metaContent(html, key) {
  const target = key.toLowerCase();
  const tags = headOf(html).match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const id = (tagAttr(tag, "name") ?? tagAttr(tag, "property") ?? "").toLowerCase();
    if (id === target) return tagAttr(tag, "content") ?? "";
  }
  return null;
}

function collectJsonLdArticleDescriptions(node, out) {
  if (Array.isArray(node)) {
    for (const item of node) collectJsonLdArticleDescriptions(item, out);
    return;
  }
  if (!node || typeof node !== "object") return;
  const type = node["@type"];
  const types = Array.isArray(type) ? type : [type];
  if (types.includes("Article") && typeof node.description === "string") {
    out.push(node.description);
  }
  if (Array.isArray(node["@graph"])) collectJsonLdArticleDescriptions(node["@graph"], out);
}

function jsonLdArticleDescriptions(html) {
  const out = [];
  const scripts = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of scripts) {
    const raw = decodeHtml(match[1].trim());
    if (!raw) continue;
    try {
      collectJsonLdArticleDescriptions(JSON.parse(raw), out);
    } catch {
      // Ignore unrelated malformed JSON-LD; route-level checks below catch missing article descriptions.
    }
  }
  return out;
}

// --- expected cases ---------------------------------------------------------
// Each case asserts the intended robots + canonical for one /stocks URL. Values
// come straight from the acceptance checks: normal pages indexable, degenerate
// filter combinations conservative (noindex + canonical=/stocks).
// Real dataset values: "반도체" is a theme; sectorOf() emits the composite "반도체·IT부품".
const VALID_THEME = "반도체";
const VALID_SECTOR = "반도체·IT부품";

const CASES = [
  {
    label: "plain /stocks (baseline, must stay indexable)",
    path: "/stocks",
    expectIndexable: true,
    expectCanonical: `${SITE}/stocks`,
  },
  {
    label: "single valid sector (meaningful simple filter, indexable, self-canonical)",
    path: "/stocks?sector=" + encodeURIComponent(VALID_SECTOR),
    expectIndexable: true,
    expectCanonical: `${SITE}/stocks?sector=${encodeURIComponent(VALID_SECTOR)}`,
  },
  {
    label: "single valid theme (meaningful simple filter, indexable, self-canonical)",
    path: "/stocks?theme=" + encodeURIComponent(VALID_THEME),
    expectIndexable: true,
    expectCanonical: `${SITE}/stocks?theme=${encodeURIComponent(VALID_THEME)}`,
  },
  {
    label: "free-text search q (infinite URL space -> noindex, canonical=/stocks)",
    path: "/stocks?q=" + encodeURIComponent("삼성"),
    expectIndexable: false,
    expectCanonical: `${SITE}/stocks`,
  },
  {
    label: "zero-result theme (nonexistent -> noindex, canonical=/stocks)",
    path: "/stocks?theme=" + encodeURIComponent("존재하지않는테마xyz"),
    expectIndexable: false,
    expectCanonical: `${SITE}/stocks`,
  },
  {
    label: "multi-axis theme+q (2 filter dimensions -> noindex, canonical=/stocks)",
    path: "/stocks?theme=" + encodeURIComponent(VALID_THEME) + "&q=" + encodeURIComponent("삼성"),
    expectIndexable: false,
    expectCanonical: `${SITE}/stocks`,
  },
  {
    label: "valid sector + extra unknown params (over-parameterized -> noindex, canonical=/stocks)",
    path: "/stocks?sector=" + encodeURIComponent(VALID_SECTOR) + "&utm_source=ad&utm_medium=cpc",
    expectIndexable: false,
    expectCanonical: `${SITE}/stocks`,
  },
];

const STOCK_DETAIL_CASES = [
  {
    label: "stock detail meta description (Samsung Electronics)",
    path: "/stock/005930",
    expectCanonical: `${SITE}/stock/005930`,
  },
  {
    label: "stock detail meta description (lagged-stock regression sample)",
    path: "/stock/000070",
    expectCanonical: `${SITE}/stock/000070`,
  },
];

const REQUIRED_STOCK_META_TERMS = [
  "추세",
  "거래활성도",
  "밸류",
  "위험조정",
  "재무",
  "공시",
  "데이터 기준일",
  "투자 추천이 아닌",
  "탐색 도구",
];

const FORBIDDEN_STOCK_META_PATTERNS = [
  { label: "score fraction", re: /\b\d{1,3}\s*\/\s*100\b/ },
  { label: "metric score number", re: /(?:종합\s*점수|종합점수|추세|거래활성도|밸류|위험조정)\s*\d{1,3}(?:\.\d+)?(?:점)?/ },
  { label: "PER/PBR", re: /\bP(?:ER|BR)\b/i },
  { label: "return percentage", re: /[+-]?\d+(?:\.\d+)?\s*%|수익률|등락률/ },
  { label: "old Korean metric term", re: /모멘텀|변동성조정|변동성 조정/ },
  { label: "old English metric term", re: /\bmomentum\b|volatility-adjusted/i },
];

function stockMetaDescriptions(html) {
  const jsonLdDescriptions = jsonLdArticleDescriptions(html);
  return [
    { field: "meta description", value: metaContent(html, "description") },
    { field: "og:description", value: metaContent(html, "og:description") },
    { field: "twitter:description", value: metaContent(html, "twitter:description") },
    ...jsonLdDescriptions.map((value, i) => ({ field: `json-ld Article description #${i + 1}`, value })),
  ];
}

// General-page snippet guard: pages other than stock-detail (home, discover) legitimately
// mention PER/PBR/수익률 as feature copy, so the strict score/percentage patterns above do NOT
// apply — but the RENAMED-AWAY legacy metric names must never resurface in any head metadata
// (description/OG/Twitter/keywords/title). This catches regressions like a stray "모멘텀" keyword.
const OLD_TERM_META_PATTERNS = [
  { label: "old Korean metric term", re: /모멘텀|변동성조정|변동성 조정/ },
  { label: "old English metric term", re: /\bmomentum\b|volatility-adjusted/i },
];

const GENERAL_META_CASES = [
  { label: "homepage head metadata (no legacy metric terms)", path: "/" },
  { label: "discover /stocks head metadata (no legacy metric terms)", path: "/stocks" },
];

// Backtest emits strong past-performance numbers (CAGR/총수익률/기여 종목/리밸런싱 예시). If a
// search or AI preview crops those without the surrounding risk context they read as a "현재 추천".
// The page therefore stays index/follow (in-app research resource) but must carry robots nosnippet.
const NOSNIPPET_CASES = [
  { label: "backtest page keeps robots nosnippet + stays indexable", path: "/backtest" },
];

// Head-metadata text fields to sweep for legacy-term regressions on general pages.
function generalPageMetaValues(html) {
  return [
    { field: "title", value: (headOf(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? null) },
    { field: "meta description", value: metaContent(html, "description") },
    { field: "meta keywords", value: metaContent(html, "keywords") },
    { field: "og:title", value: metaContent(html, "og:title") },
    { field: "og:description", value: metaContent(html, "og:description") },
    { field: "twitter:title", value: metaContent(html, "twitter:title") },
    { field: "twitter:description", value: metaContent(html, "twitter:description") },
  ].map((d) => ({ ...d, value: d.value == null ? null : decodeHtml(d.value) }));
}

function validateGeneralPageMeta(html) {
  const reasons = [];
  const fields = generalPageMetaValues(html).filter((d) => typeof d.value === "string" && d.value.length > 0);
  for (const { field, value } of fields) {
    for (const { label, re } of OLD_TERM_META_PATTERNS) {
      if (re.test(value)) reasons.push(`${field} contains forbidden ${label}: "${value}"`);
    }
  }
  return reasons;
}

function validateStockDetailMeta(html) {
  const reasons = [];
  const descriptions = stockMetaDescriptions(html);
  if (!descriptions.some((d) => d.field.startsWith("json-ld Article description"))) {
    reasons.push("missing json-ld Article description");
  }
  const missingFields = descriptions.filter((d) => d.value == null);
  for (const d of missingFields) reasons.push(`missing ${d.field}`);

  const present = descriptions.filter((d) => typeof d.value === "string" && d.value.length > 0);
  const uniqueValues = new Set(present.map((d) => d.value));
  if (uniqueValues.size > 1) {
    reasons.push("description fields disagree; stock snippet policy must stay single-source");
  }

  for (const { field, value } of present) {
    for (const term of REQUIRED_STOCK_META_TERMS) {
      if (!value.includes(term)) reasons.push(`${field} missing required stable term "${term}"`);
    }
    for (const { label, re } of FORBIDDEN_STOCK_META_PATTERNS) {
      if (re.test(value)) reasons.push(`${field} contains forbidden ${label}: "${value}"`);
    }
  }

  return reasons;
}

async function fetchHtml(path) {
  // No query-string cache-buster here: the query string IS under test (an extra ?v=
  // token would itself count as an over-parameterized URL). Dynamic /stocks SSR renders
  // per-request, and no-cache headers cover any local caching.
  const res = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: { "cache-control": "no-cache", pragma: "no-cache", expires: "0" },
  });
  const body = await res.text();
  return { status: res.status, body };
}

async function main() {
  console.log("OrnScore stocks SEO verification (real gate; exits 1 on any failure)");
  console.log(
    `base=${BASE}  filter-cases=${CASES.length}  stock-detail-cases=${STOCK_DETAIL_CASES.length}` +
      `  general-meta-cases=${GENERAL_META_CASES.length}  nosnippet-cases=${NOSNIPPET_CASES.length}`,
  );
  console.log("");

  const results = [];
  for (const c of CASES) {
    // eslint-disable-next-line no-await-in-loop
    let status, body;
    try {
      // eslint-disable-next-line no-await-in-loop
      ({ status, body } = await fetchHtml(c.path));
    } catch (err) {
      results.push({ ...c, ok: false, unreachable: true, reasons: [`request failed: ${String(err?.message ?? err)}`] });
      continue;
    }
    const reasons = [];
    if (status !== 200) reasons.push(`status ${status} (expected 200)`);

    const noindex = isNoindex(body);
    if (c.expectIndexable && noindex) reasons.push(`unexpected noindex (robots="${robotsContent(body)}") — must stay indexable`);
    if (!c.expectIndexable && !noindex) reasons.push(`missing noindex (robots="${robotsContent(body)}") — degenerate URL must be noindex`);

    const canonical = canonicalHref(body);
    if (canonical !== c.expectCanonical) reasons.push(`canonical "${canonical}" (expected "${c.expectCanonical}")`);

    results.push({ ...c, ok: reasons.length === 0, status, reasons });
  }

  for (const c of STOCK_DETAIL_CASES) {
    // eslint-disable-next-line no-await-in-loop
    let status, body;
    try {
      // eslint-disable-next-line no-await-in-loop
      ({ status, body } = await fetchHtml(c.path));
    } catch (err) {
      results.push({ ...c, ok: false, unreachable: true, reasons: [`request failed: ${String(err?.message ?? err)}`] });
      continue;
    }

    const reasons = [];
    if (status !== 200) reasons.push(`status ${status} (expected 200)`);
    if (isNoindex(body)) reasons.push(`unexpected noindex (robots="${robotsContent(body)}") — stock detail must stay indexable`);

    const canonical = canonicalHref(body);
    if (canonical !== c.expectCanonical) reasons.push(`canonical "${canonical}" (expected "${c.expectCanonical}")`);
    reasons.push(...validateStockDetailMeta(body));

    results.push({ ...c, ok: reasons.length === 0, status, reasons });
  }

  for (const c of GENERAL_META_CASES) {
    // eslint-disable-next-line no-await-in-loop
    let status, body;
    try {
      // eslint-disable-next-line no-await-in-loop
      ({ status, body } = await fetchHtml(c.path));
    } catch (err) {
      results.push({ ...c, ok: false, unreachable: true, reasons: [`request failed: ${String(err?.message ?? err)}`] });
      continue;
    }
    const reasons = [];
    if (status !== 200) reasons.push(`status ${status} (expected 200)`);
    reasons.push(...validateGeneralPageMeta(body));
    results.push({ ...c, ok: reasons.length === 0, status, reasons });
  }

  for (const c of NOSNIPPET_CASES) {
    // eslint-disable-next-line no-await-in-loop
    let status, body;
    try {
      // eslint-disable-next-line no-await-in-loop
      ({ status, body } = await fetchHtml(c.path));
    } catch (err) {
      results.push({ ...c, ok: false, unreachable: true, reasons: [`request failed: ${String(err?.message ?? err)}`] });
      continue;
    }
    const reasons = [];
    if (status !== 200) reasons.push(`status ${status} (expected 200)`);
    const robots = robotsContent(body);
    if (robots == null || !robots.includes("nosnippet")) {
      reasons.push(`robots "${robots}" missing nosnippet — backtest performance numbers must stay out of snippets`);
    }
    if (isNoindex(body)) {
      reasons.push(`unexpected noindex (robots="${robots}") — backtest must stay index/follow (nosnippet only)`);
    }
    results.push({ ...c, ok: reasons.length === 0, status, reasons });
  }

  const anyUnreachable = results.some((r) => r.unreachable);
  for (const r of results) {
    console.log(`${r.ok ? "OK  " : "FAIL"}  ${r.label}`);
    if (!r.ok) for (const reason of r.reasons) console.log(`        ${reason}`);
  }
  console.log("");

  if (anyUnreachable) {
    console.log(`Could not reach one or more URLs -- is a server running at ${BASE}?`);
    console.log("Hint: npm run build && npx next start -p 4489   (then re-run with --base http://localhost:4489)");
  }

  const failed = results.filter((r) => !r.ok);
  const passed = results.length - failed.length;
  console.log(`Summary: ${passed}/${results.length} cases OK.`);
  if (failed.length) {
    console.log("STOCKS SEO VERIFICATION FAILED.");
    process.exit(1);
  }
  console.log("STOCKS SEO VERIFICATION PASSED.");
  process.exit(0);
}

main();
