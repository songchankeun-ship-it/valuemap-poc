// SEO 검색 표면 계약 검증기(정적·적대적) — Slice A.
// 실행: npx tsx scripts/test_seoContract.ts — 성공 시 PASS 1줄, 실패 시 FAIL 후 비정상 종료.
//
// 이 검증기는 src/lib/seoContract.ts 의 단일 진실 소스를 두 방향으로 고정한다:
//   1) 실제 레지스트리(색인 패밀리 / canonical 소유권 / 7쌍 비교 허용목록 /
//      레거시 theme 마이그레이션 맵 / mock-backed 색인 제외)가 내부적으로 정합함.
//   2) 적대적(negative) 픽스처로 다음 4개 위반이 실제로 탐지됨을 증명한다:
//      중복 theme/topic 소유권 · 색인된 zero-real-match theme · 임의 비교 노출 · sitemap 드리프트.
// 렌더 페이지·점수식·데이터·라우트는 바꾸지 않는다(계약과 검증기만).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  STATIC_INDEXABLE_PATHS,
  INDEXABLE_ROUTE_FAMILIES,
  CURATED_COMPARISON_PAIRS,
  LEGACY_THEME_MIGRATION,
  MOCK_BACKED_INDEXING_EXCLUSIONS,
  isCuratedComparisonPair,
  comparisonPairBySlug,
  curatedComparisonPaths,
  realThemeMatchCount,
  defaultContractInput,
  verifySeoContract,
  type ContractViolation,
  type SeoContractInput,
} from "../src/lib/seoContract";

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

function codes(violations: ContractViolation[]): Set<string> {
  return new Set(violations.map((x) => x.code));
}

// sitemap.ts 정적 라우트 파싱 — `${SITE}/<리터럴>` 뒤가 백틱으로 끝나는 것만.
// 동적(예: `${SITE}/theme/${slug}`)은 리터럴 뒤에 `$` 가 오므로 제외한다.
function parseSitemapStaticPaths(src: string): string[] {
  const out = new Set<string>();
  for (const m of src.matchAll(/\$\{SITE\}\/([a-z0-9/-]*)(.)/g)) {
    const seg = m[1];
    const next = m[2];
    if (next === "$") continue; // 동적 세그먼트(뒤에 ${...})는 제외
    out.add("/" + seg.replace(/\/$/, ""));
  }
  // 루트("/")는 위 정규화로 "/" 가 되어 포함됨.
  return [...out];
}

// ── 0. 실제 계약은 위반이 없어야 한다(정합성). ──────────────────────
const sitemapSrc = read("src/app/sitemap.ts");
const sitemapStaticPaths = parseSitemapStaticPaths(sitemapSrc);
const base = defaultContractInput();
const realViolations = verifySeoContract({ ...base, sitemapStaticPaths });
check(
  `0 real contract has zero violations (${realViolations.map((x) => x.code).join(",") || "none"})`,
  realViolations.length === 0,
);

// ── 1. 색인 라우트 패밀리 + 정적 경로 레지스트리 ───────────────────
check("1 static indexable paths non-empty", STATIC_INDEXABLE_PATHS.length > 0);
check("1 route families cover stock/topic/compare-pair", (() => {
  const ids = new Set(INDEXABLE_ROUTE_FAMILIES.map((f) => f.id));
  return ids.has("stock") && ids.has("topic") && ids.has("compare-pair");
})());
// 레거시 "/theme/" 은 색인 패밀리가 아니다(은퇴 대상).
check("1 no /theme/ family is indexable", !INDEXABLE_ROUTE_FAMILIES.some((f) => f.prefix.startsWith("/theme")));

// ── 2. 큐레이션 비교 허용목록: 정확히 7쌍 + 예상 slug 집합 고정 ──────
const EXPECTED_PAIR_SLUGS = [
  "005930-vs-000660",
  "032830-vs-085620",
  "000990-vs-042700",
  "247540-vs-066970",
  "055550-vs-105560",
  "105560-vs-086790",
  "006400-vs-373220",
];
check("2 exactly seven curated pairs", CURATED_COMPARISON_PAIRS.length === 7);
check(
  "2 curated slugs equal the approved allowlist",
  JSON.stringify([...CURATED_COMPARISON_PAIRS.map((p) => p.slug)].sort()) ===
    JSON.stringify([...EXPECTED_PAIR_SLUGS].sort()),
);
// predicate: 허용된 것만 true, 임의/역순은 false.
for (const slug of EXPECTED_PAIR_SLUGS) check(`2 isCurated true for ${slug}`, isCuratedComparisonPair(slug));
check("2 arbitrary pair rejected", !isCuratedComparisonPair("005930-vs-035420"));
check("2 reverse-order pair rejected", !isCuratedComparisonPair("000660-vs-005930"));
check("2 comparisonPairBySlug resolves canonical", comparisonPairBySlug("005930-vs-000660")?.a === "005930");
check("2 curated sitemap paths are under /compare/", curatedComparisonPaths().every((p) => p.startsWith("/compare/")));

// ── 3. 레거시 theme 마이그레이션 맵 + mock-backed 제외 ─────────────
check("3 all five legacy themes have a disposition", (() => {
  const keys = Object.keys(LEGACY_THEME_MIGRATION);
  return ["battery", "semi-materials", "bio", "shipbuilding", "robot"].every((s) => keys.includes(s));
})());
check("3 robot is noindex (zero real match)", LEGACY_THEME_MIGRATION.robot.kind === "noindex");
check("3 robot has zero real matches", realThemeMatchCount("로봇") === 0);
check("3 robot is in mock-backed exclusions", MOCK_BACKED_INDEXING_EXCLUSIONS.includes("robot"));
check("3 battery redirects to an active real topic", (() => {
  const d = LEGACY_THEME_MIGRATION.battery;
  return d.kind === "redirect" && d.status === "active" && d.target === "battery-stocks";
})());
check("3 semi-materials redirects to semiconductor-stocks (active)", (() => {
  const d = LEGACY_THEME_MIGRATION["semi-materials"];
  return d.kind === "redirect" && d.status === "active" && d.target === "semiconductor-stocks";
})());
check("3 bio/shipbuilding are pending redirects (topics created later)", (() => {
  const b = LEGACY_THEME_MIGRATION.bio;
  const s = LEGACY_THEME_MIGRATION.shipbuilding;
  return b.kind === "redirect" && b.status === "pending" && s.kind === "redirect" && s.status === "pending";
})());
// pending 대상은 실데이터가 실제로 존재해 Slice B 에서 실 topic 이 될 수 있어야 한다.
check("3 bio has real data to back a future topic", realThemeMatchCount("바이오") > 0);
check("3 shipbuilding has real data to back a future topic", realThemeMatchCount("조선") > 0);

// ── 4. 적대적 픽스처: 4개 위반이 실제로 탐지되는지 ──────────────────
function mutate(patch: Partial<SeoContractInput>): ContractViolation[] {
  return verifySeoContract({ ...base, sitemapStaticPaths, ...patch });
}

// 4a. 중복 theme/topic 소유권 — battery theme 을 색인 대상으로 표시하면
//     그 의도(battery-stocks)를 topic 과 theme 이 동시에 소유 → OWNERSHIP_DUP.
check("4a duplicate theme/topic ownership detected", codes(mutate({ indexableThemeSlugs: ["battery"] })).has("OWNERSHIP_DUP"));

// 4b. 색인된 zero-real-match theme — robot 을 색인 대상으로 표시 → ZERO_REAL_MATCH.
check("4b indexable zero-real-match theme detected", codes(mutate({ indexableThemeSlugs: ["robot"] })).has("ZERO_REAL_MATCH"));
// robot 을 제외 목록에서 빼도 zero-real-match 가드가 걸린다.
check(
  "4b unguarded zero-real theme detected",
  codes(mutate({ exclusions: MOCK_BACKED_INDEXING_EXCLUSIONS.filter((s) => s !== "robot") })).has("ZERO_REAL_MATCH"),
);

// 4c. 임의 비교 노출 — 허용목록에 미검증 쌍/역순/유령 티커 주입 → PAIR_* 위반.
check("4c arbitrary pair exposure detected", (() => {
  const bad = [...CURATED_COMPARISON_PAIRS, { slug: "005930-vs-999999", a: "005930", b: "999999" }];
  return codes(mutate({ pairs: bad })).has("PAIR_UNKNOWN_TICKER");
})());
check("4c reverse-order alternate canonical detected", (() => {
  const rev = [...CURATED_COMPARISON_PAIRS, { slug: "000660-vs-005930", a: "000660", b: "005930" }];
  return codes(mutate({ pairs: rev })).has("PAIR_REVERSE");
})());

// 4d. sitemap 드리프트 — 계약에 없는 정적 경로가 sitemap 에 있거나 그 반대.
check("4d sitemap drift (extra emitted) detected", codes(mutate({ sitemapStaticPaths: [...sitemapStaticPaths, "/secret-landing"] })).has("SITEMAP_DRIFT"));
check("4d sitemap drift (missing emitted) detected", codes(mutate({ sitemapStaticPaths: sitemapStaticPaths.filter((p) => p !== "/pricing") })).has("SITEMAP_DRIFT"));

// 추가 적대: 마이그레이션 대상 소실 / 유령 항목도 잡힌다.
check("4e active target missing detected", codes(mutate({ topicExists: () => false })).has("MIGRATION_TARGET_MISSING"));

// ── 5. 자기검증: 위 검사가 '항상 통과'가 아님을 증명 ────────────────
check("selftest: base contract itself is clean", verifySeoContract(base).length === 0);
check("selftest: parser found the sitemap static routes", sitemapStaticPaths.includes("/") && sitemapStaticPaths.includes("/pricing"));

if (failed > 0) {
  console.error(`\n${failed} check(s) FAILED`);
  process.exit(1);
}
console.log(
  "PASS: SEO search-surface contract (indexable families + canonical ownership + 7-pair comparison allowlist + legacy-theme migration map + mock-backed exclusions) — verifier fails on duplicate ownership, indexable zero-real theme, arbitrary comparison exposure, and sitemap drift",
);
