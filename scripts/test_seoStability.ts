// 안정적 종목 SEO 메타 + 결정적 sitemap lastmod + 통제된 구 사명 별칭 계약 가드 (Slice H)
// 실행: npx tsx scripts/test_seoStability.ts — 성공 시 PASS 1줄, 실패 시 FAIL 출력 후 비정상 종료.
//
// 사실(계약 정본):
//   - 종목 상세 메타(title/description/canonical/OG)는 매일 바뀌는 가격·점수·수익률·PER/PBR 을
//     담지 않는다. 안정적인 사명·티커·분석 주제 카피와 티커 기반 canonical 만 쓴다.
//   - sitemap 의 lastModified 는 요청/빌드 시각(new Date())이 아니라 로컬 데이터셋에서
//     결정적으로 유도한다(generatedAt → asOfBusinessDate). 같은 데이터면 같은 sitemap.
//   - 개명 종목의 구 사명은 canonical 표시 이름을 대체하지 않고, JSON-LD alternateName 별칭
//     전용으로만 노출한다(stockAliases.ts). 별칭이 현재 사명과 같으면 stale — 금지.
// 이 테스트는 순수 별칭 계약 + 소스 계약을 정적으로 고정한다. 점수식·데이터·라우트 무변경.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { FORMER_NAME_ALIASES, formerNamesOf } from "../src/lib/stockAliases";
import { parseDatasetGeneratedAt } from "../src/lib/datasetTimestamp";

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

const sitemapSrc = read("src/app/sitemap.ts");
const pageSrc = read("src/app/stock/[ticker]/page.tsx");
const data = JSON.parse(read("public/data/stocks.json")) as {
  stocks: Array<{ ticker: string; name: string }>;
};
const nameByTicker = new Map<string, string>(data.stocks.map((s) => [s.ticker, s.name]));

// ── A. sitemap lastModified 결정성 ─────────────────────────────────
// 블록 주석(계약 설명에 "new Date()" 문구 포함)을 제외한 실제 코드에서만 스캔한다.
const sitemapCode = sitemapSrc.replace(/\/\*[\s\S]*?\*\//g, "");
// A1. 요청/빌드 시각(new Date() 인자 없음, Date.now())을 lastmod 에 쓰지 않는다.
check("A1 no argless new Date() in sitemap code", !/new\s+Date\s*\(\s*\)/.test(sitemapCode));
check("A1 no Date.now() in sitemap code", !/Date\.now\s*\(/.test(sitemapCode));
// A2. 결정적 값은 로컬 데이터셋(generatedAt → asOfBusinessDate)에서만 유도한다.
check("A2 uses deterministicLastModified helper", /function deterministicLastModified/.test(sitemapSrc));
check("A2 derives from generatedAt", sitemapSrc.includes("generatedAt"));
check("A2 falls back to asOfBusinessDate", sitemapSrc.includes("asOfBusinessDate"));
check("A2 sitemap uses timezone-stable dataset parser", sitemapSrc.includes("parseDatasetGeneratedAt(iso)"));
check(
  "A2 timezone-less generatedAt is interpreted as KST",
  parseDatasetGeneratedAt("2026-07-14T09:46:19.697282")?.toISOString() === "2026-07-14T00:46:19.697Z",
);
check(
  "A2 explicit UTC generatedAt remains UTC",
  parseDatasetGeneratedAt("2026-07-14T09:46:19.697Z")?.toISOString() === "2026-07-14T09:46:19.697Z",
);
check(
  "A2 explicit KST generatedAt matches timezone-less KST",
  parseDatasetGeneratedAt("2026-07-14T09:46:19.697+09:00")?.toISOString() === "2026-07-14T00:46:19.697Z",
);
check("A2 malformed generatedAt fails closed", parseDatasetGeneratedAt("2026-07-14 09:46:19") === undefined);
// A3. 의도 마커 — 결정적 계약임을 소스에 고정(회귀 시 리뷰 신호).
check("A3 documents deterministic contract", sitemapSrc.includes("결정적"));

// ── B. 통제된 구 사명 별칭 계약 ────────────────────────────────────
const aliasEntries = Object.entries(FORMER_NAME_ALIASES);
check("B0 alias registry non-empty", aliasEntries.length > 0);

const allAliases = new Set<string>();
for (const [ticker, formers] of aliasEntries) {
  // B1. 티커가 실제 유니버스(stocks.json)에 존재한다 — 유령 항목 금지.
  check(`B1 ${ticker} exists in universe`, nameByTicker.has(ticker));
  const current = nameByTicker.get(ticker);
  // B2. 별칭 목록은 비어있지 않고, 각 항목은 공백 아닌 문자열.
  check(`B2 ${ticker} has non-empty aliases`, Array.isArray(formers) && formers.length > 0);
  for (const f of formers) {
    check(`B2 ${ticker} alias "${f}" is non-empty string`, typeof f === "string" && f.trim().length > 0);
    // B3. 별칭이 현재 canonical 사명과 같으면 stale — 금지.
    check(`B3 ${ticker} alias "${f}" != current name`, current == null || f !== current);
    allAliases.add(f);
  }
  // B4. 항목 내 중복 별칭 없음.
  check(`B4 ${ticker} aliases unique`, new Set(formers).size === formers.length);
  // B5. formerNamesOf 헬퍼가 레지스트리와 일치.
  check(`B5 ${ticker} formerNamesOf matches`, JSON.stringify(formerNamesOf(ticker)) === JSON.stringify(formers));
}
// B6. 알 수 없는 티커 → 빈 배열(지어내지 않음).
check("B6 unknown ticker → []", formerNamesOf("000000").length === 0);
// B7. 어떤 종목의 현재 canonical 사명도 별칭 목록에 나타나지 않는다(별칭은 오직 과거 사명).
{
  let clash = false;
  for (const name of nameByTicker.values()) if (allAliases.has(name)) clash = true;
  check("B7 no current name used as an alias", !clash);
}

// ── C. 종목 상세 메타 안정성(소스 계약) ────────────────────────────
// generateMetadata 블록만 뽑아서 동적 가격·점수 식별자 유입을 정적으로 차단한다.
const metaStart = pageSrc.indexOf("export async function generateMetadata");
const metaEnd = pageSrc.indexOf("interface ReasonV2");
check("C0 generateMetadata block located", metaStart !== -1 && metaEnd !== -1 && metaEnd > metaStart);
const metaBlock = metaStart !== -1 && metaEnd > metaStart ? pageSrc.slice(metaStart, metaEnd) : "";

// C1. 제목은 안정적인 사명·티커만 사용.
check("C1 title uses stable name", metaBlock.includes("${s.name}"));
check("C1 title uses ticker", metaBlock.includes("(${ticker})"));
// C2. 설명은 안정적인 공용 헬퍼 사용.
check("C2 description via stable helper", metaBlock.includes("stockSeoDescription(s.name, ticker)"));
// C3. canonical 은 티커 기반 안정 URL.
check("C3 canonical is ticker-based", metaBlock.includes("canonical: `/stock/${ticker}`"));
// C4. 메타 블록에 매일 바뀌는 가격·점수·재무 필드 식별자가 없다.
const DYNAMIC_FIELDS = [
  "s.currentPrice",
  "s.changePct",
  "s.compositeScore",
  "s.momentum",
  "s.flow",
  "s.value",
  "s.vol",
  "s.per",
  "s.pbr",
  "s.roe",
  "s.eps",
  "s.beta",
  "s.peg",
  "s.marketCap",
  "s.dividendYield",
  "s.returns",
  "s.volStats",
  "s.flowStats",
];
for (const f of DYNAMIC_FIELDS) {
  check(`C4 meta block has no dynamic field ${f}`, !metaBlock.includes(f));
}

// C5. 공용 설명 헬퍼 본문에 점수 분수·퍼센트·PER/PBR·옛 지표명이 없다(안정 문구).
const helperStart = pageSrc.indexOf("function stockSeoDescription");
const helperBody = helperStart !== -1 ? pageSrc.slice(helperStart, pageSrc.indexOf("\n}", helperStart) + 2) : "";
check("C5 helper located", helperBody.length > 0);
const FORBIDDEN_HELPER = [
  { label: "score fraction", re: /\d{1,3}\s*\/\s*100/ },
  { label: "percent", re: /%|수익률|등락률/ },
  { label: "PER/PBR", re: /\bP(?:ER|BR)\b/i },
  { label: "old metric term", re: /모멘텀|변동성조정/ },
];
for (const { label, re } of FORBIDDEN_HELPER) {
  check(`C5 helper has no ${label}`, !re.test(helperBody));
}

// ── D. 구 사명 = 통제된 alternateName 별칭 전용(소스 배선) ──────────
check("D1 page imports formerNamesOf", pageSrc.includes('from "@/lib/stockAliases"'));
check("D1 page wires alternateName from aliases", pageSrc.includes("formerNamesOf(ticker)") && pageSrc.includes("alternateName"));
// D2. canonical headline/name/breadcrumb 은 현재 사명(s.name)만 사용 — 구 사명 대체 금지.
check("D2 JSON-LD headline uses current name", pageSrc.includes("headline: `${s.name}"));
check("D2 about entity uses current name", pageSrc.includes('name: `${s.name} (${ticker})`'));

if (failed > 0) {
  console.error(`\n${failed} check(s) FAILED`);
  process.exit(1);
}
console.log("PASS: stable stock SEO meta + deterministic sitemap lastmod + controlled former-name aliases");
