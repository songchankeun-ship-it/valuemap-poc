// 큐레이션 비교 랜딩(/compare/[pair]) 검증기 — Slice C (정적·유한).
// 실행: npx tsx scripts/test_comparisonPages.ts — 성공 시 PASS 1줄, 실패 시 FAIL 후 비정상 종료.
//
// src/lib/comparison.ts(콘텐츠 레지스트리)와 라우트/사이트맵 소스가 계획서의 Slice C
// 계약을 지키는지 고정한다:
//   · 허용목록 7쌍만 해석·정적 생성·색인. 임의/역순 슬러그는 해석되지 않는다(대체 canonical 없음).
//   · 라우트는 dynamicParams=false 로 미허용 슬러그를 404 처리한다.
//   · 제목·설명 메타데이터는 안정적(self-canonical)이며 변동값(가격·점수·재무)을 담지 않는다.
//   · 지표 차이는 중립(높다/낮다)으로만 서술한다("더 좋다/나쁘다/우수/추천" 금지).
//   · breadcrumb JSON-LD·종목 링크·인터랙티브 비교 경로가 존재한다.
//   · sitemap 에는 큐레이션 7쌍만 등재된다.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  CURATED_COMPARISON_PAIRS,
  curatedComparisonPaths,
  isCuratedComparisonPair,
} from "../src/lib/seoContract";
import {
  resolveComparison,
  comparisonMetadata,
  comparisonBreadcrumbJsonLd,
  comparisonStaticParams,
  curatedPairsForTicker,
  curatedComparisonCards,
} from "../src/lib/comparison";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
function read(rel: string): string {
  return readFileSync(join(repo, rel), "utf8");
}

const EXPECTED_SLUGS = [
  "005930-vs-000660",
  "032830-vs-085620",
  "000990-vs-042700",
  "247540-vs-066970",
  "055550-vs-105560",
  "105560-vs-086790",
  "006400-vs-373220",
];

// ── 1. 정확히 7쌍이 해석되고 둘 다 실데이터 종목이다 ──────────────────
check("1 exactly seven curated pairs", CURATED_COMPARISON_PAIRS.length === 7);
check(
  "1 static params equal the approved allowlist",
  JSON.stringify(comparisonStaticParams().map((p) => p.pair).sort()) ===
    JSON.stringify([...EXPECTED_SLUGS].sort()),
);
for (const slug of EXPECTED_SLUGS) {
  const r = resolveComparison(slug);
  check(`1 resolve ${slug} → both real stocks`, !!r && !!r.a.ticker && !!r.b.ticker && r.a.ticker !== r.b.ticker);
  check(`1 resolve ${slug} → 10 metric rows`, !!r && r.metrics.length === 10);
  check(`1 resolve ${slug} → interactive href carries both tickers`, !!r && r.interactiveHref.includes(slug.split("-vs-")[0]) && r.interactiveHref.includes(slug.split("-vs-")[1]) && r.interactiveHref.startsWith("/compare?stocks="));
}

// ── 2. 임의/역순 슬러그는 해석되지 않는다(대체 canonical 방지) ─────────
check("2 arbitrary slug not resolved", resolveComparison("005930-vs-035420") === null);
check("2 reverse-order slug not resolved", resolveComparison("000660-vs-005930") === null);
check("2 unknown-format slug not resolved", resolveComparison("foo-vs-bar") === null);
check("2 self pair not resolved", resolveComparison("005930-vs-005930") === null);
check("2 predicate rejects reverse-order", !isCuratedComparisonPair("000660-vs-005930"));
check("2 metadata null for arbitrary slug", comparisonMetadata("005930-vs-035420") === null);

// ── 3. 라우트 소스 계약: dynamicParams=false + generateStaticParams=허용목록 ──
const routeSrc = read("src/app/compare/[pair]/page.tsx");
check("3 route sets dynamicParams=false", /export\s+const\s+dynamicParams\s*=\s*false/.test(routeSrc));
check("3 route generateStaticParams uses comparisonStaticParams", /generateStaticParams[\s\S]*comparisonStaticParams\(\)/.test(routeSrc));
check("3 route calls notFound on unresolved", routeSrc.includes("notFound()"));
check("3 route emits breadcrumb JSON-LD", routeSrc.includes("comparisonBreadcrumbJsonLd") && routeSrc.includes("application/ld+json"));
check("3 route links to interactive compare view", routeSrc.includes("interactiveHref"));
check("3 route links to both stock detail pages", routeSrc.includes("/stock/${data.a.ticker}") && routeSrc.includes("/stock/${data.b.ticker}"));

// ── 4. 안정적 메타데이터 — 변동값(가격·점수·재무) 없음 ─────────────────
const DIGITS = /\d/;
for (const slug of EXPECTED_SLUGS) {
  const meta = comparisonMetadata(slug)!;
  const r = resolveComparison(slug)!;
  check(`4 ${slug} self-canonical`, meta.canonical === `/compare/${slug}`);
  // 제목: 티커(6자리) 외에는 숫자가 없어야 한다(가격·점수·재무 배제).
  const titleSansTickers = meta.title.split(r.a.ticker).join("").split(r.b.ticker).join("");
  check(`4 ${slug} title has no volatile numbers`, !DIGITS.test(titleSansTickers));
  // 설명: 숫자 자체가 없어야 한다.
  check(`4 ${slug} description has no numbers`, !DIGITS.test(meta.description));
  // 안정성: 순수 함수라 두 번 호출해도 동일.
  check(`4 ${slug} metadata deterministic`, JSON.stringify(comparisonMetadata(slug)) === JSON.stringify(meta));
  // 실제 변동 지표값이 설명에 새어 들어가지 않았는지 직접 대조.
  // (제목은 위에서 티커 6자리 외 숫자 부재를 이미 증명 — 점수값이 티커 숫자열의 부분문자열이
  //  되는 우연 일치를 피하려 누출 검사는 숫자 없는 설명에만 적용한다.)
  const volatile = r.metrics.map((m) => m.a.display).concat(r.metrics.map((m) => m.b.display)).filter((d) => DIGITS.test(d));
  check(`4 ${slug} no volatile metric display leaks into description`, volatile.every((d) => !meta.description.includes(d)));
}

// ── 5. 중립 언어 — 지표 차이는 높다/낮다/동일/비교 불가만 ───────────────
const BANNED = ["더 좋", "더 나은", "더 나쁨", "우수", "열등", "최고", "최악", "추천", "매수", "매도", "better", "worse", "best"];
for (const slug of EXPECTED_SLUGS) {
  const r = resolveComparison(slug)!;
  for (const m of r.metrics) {
    const s = m.sentence;
    check(`5 ${slug}/${m.key} neutral (no better/worse vocabulary)`, BANNED.every((w) => !s.includes(w)));
    check(`5 ${slug}/${m.key} states higher/lower/equal/na`, /높습니다|동일합니다|비교할 수 없습니다/.test(s));
  }
  // 한계 문구가 "높다/낮다 ≠ 더 좋다/나쁘다"를 명시한다.
  check(`5 ${slug} limitations disclaim better/worse`, r.limitations.some((l) => l.includes("더 좋거나 나쁜")));
}

// ── 6. breadcrumb JSON-LD ─────────────────────────────────────────
for (const slug of EXPECTED_SLUGS) {
  const r = resolveComparison(slug)!;
  const jsonLd = comparisonBreadcrumbJsonLd(r) as any;
  check(`6 ${slug} BreadcrumbList type`, jsonLd["@type"] === "BreadcrumbList");
  const items = jsonLd.itemListElement as any[];
  check(`6 ${slug} 3 breadcrumb items`, Array.isArray(items) && items.length === 3);
  check(`6 ${slug} positions 1..3`, items.every((it, i) => it.position === i + 1));
  check(`6 ${slug} last item → canonical compare URL`, items[2].item === `https://ornscore.com/compare/${slug}`);
  check(`6 ${slug} middle item → /compare`, items[1].item === "https://ornscore.com/compare");
}

// ── 7. 종목 페이지·랜딩 서버 렌더 내부 링크 소스 ────────────────────────
check("7 curatedPairsForTicker: 105560 in two pairs", curatedPairsForTicker("105560").length === 2);
check("7 curatedPairsForTicker: 005930 in one pair", curatedPairsForTicker("005930").length === 1);
check("7 curatedPairsForTicker: non-listed ticker → none", curatedPairsForTicker("035720").length === 0);
check("7 curatedComparisonCards: seven cards, all real", curatedComparisonCards().length === 7 && curatedComparisonCards().every((c) => c.a.ticker && c.b.ticker));

const comparePageSrc = read("src/app/compare/page.tsx");
check("7 /compare renders curated comparison links", comparePageSrc.includes("curatedComparisonCards") && comparePageSrc.includes("/compare/${c.slug}"));
const stockPageSrc = read("src/app/stock/[ticker]/page.tsx");
check("7 stock page renders curated comparison links", stockPageSrc.includes("curatedPairsForTicker") && stockPageSrc.includes("/compare/${c.slug}"));

// ── 8. sitemap: 큐레이션 7쌍만 등재 ───────────────────────────────────
const paths = curatedComparisonPaths();
check("8 curatedComparisonPaths = seven /compare/<pair>", paths.length === 7 && paths.every((p) => /^\/compare\/\d{6}-vs-\d{6}$/.test(p)));
check(
  "8 sitemap paths equal allowlist",
  JSON.stringify([...paths].sort()) === JSON.stringify(EXPECTED_SLUGS.map((s) => `/compare/${s}`).sort()),
);
const sitemapSrc = read("src/app/sitemap.ts");
check("8 sitemap emits curated comparison block", sitemapSrc.includes("curatedComparisonPaths") && sitemapSrc.includes("comparePages"));
// sitemap 소스에 임의 /compare/ 하드코딩(정적 문자열)이 없어야 한다(정본은 허용목록 함수뿐).
check("8 sitemap has no hard-coded arbitrary compare pair", !/\/compare\/\d{6}-vs-\d{6}/.test(sitemapSrc));

// ── 9. 자기검증: 위 검사가 '항상 통과'가 아님 ──────────────────────────
check("selftest: banned-word scan is not vacuous", BANNED.some((w) => "이 종목이 더 좋다".includes(w)));
check("selftest: a real pair actually resolves", resolveComparison(EXPECTED_SLUGS[0]) !== null);

if (failed > 0) {
  console.error(`\n${failed} check(s) FAILED`);
  process.exit(1);
}
console.log(
  "PASS: curated /compare/[pair] landings (7-pair allowlist only · dynamicParams=false · stable price/score-free metadata · neutral higher/lower language · breadcrumb JSON-LD · stock/compare internal links · curated-only sitemap) — arbitrary and reverse-order pairs never resolve or index",
);
