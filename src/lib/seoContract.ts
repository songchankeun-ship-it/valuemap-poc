// SEO 검색 표면 계약(정본) — Slice A.
//
// 이 파일은 "색인 가능한 URL 패밀리 / canonical 소유권 / 큐레이션 비교 허용목록 /
// 레거시 theme 마이그레이션 맵 / 모의(mock) 기반 색인 제외"의 단일 진실 소스다.
// 이후 슬라이스(B: theme 은퇴·bio/조선 topic, C: /compare/[pair], E: 릴리스 게이트)가
// 이 레지스트리를 소비한다. Slice A 는 레지스트리와 검증기만 추가하며 렌더 페이지는
// 바꾸지 않는다.
//
// 완성 기준: 모든 색인 URL 은 실데이터로 뒷받침되고, 검색 의도의 canonical 소유자가
// 정확히 하나이며, 임의(비허용) 비교 쌍이나 모의 데이터로 뒷받침된 theme 은 색인되지
// 않는다.
import { realStockPool } from "@/lib/realStocks";
import { seoTopics, getSeoTopic } from "@/lib/seoTopics";
import { mockTopNeglectedThemes } from "@/lib/mockData";

export const SITE = "https://ornscore.com";

// ── 1. 색인 가능한 정적 라우트 ─────────────────────────────────────
// src/app/sitemap.ts 의 정적 페이지 블록과 1:1 로 동기되어야 한다(드리프트 가드의 정본).
// 여기에서 조용히 빠지거나 sitemap 에만 추가되면 SITEMAP_DRIFT 로 실패한다.
export const STATIC_INDEXABLE_PATHS: readonly string[] = [
  "/",
  "/today",
  "/stocks",
  "/compare",
  "/disclosures",
  "/backtest",
  "/guide/metrics",
  "/pricing",
  "/about",
  "/terms",
  "/privacy",
  "/data-deletion",
];

// ── 2. 색인 가능한 동적 라우트 패밀리 ──────────────────────────────
// 각 패밀리는 실데이터 출처에서 URL 을 생성한다. 레거시 "/theme/" 은 은퇴 대상이므로
// 여기에 없다(색인 패밀리가 아니다).
export interface IndexableRouteFamily {
  id: string;
  prefix: string; // 경로 접두사 (예: "/stock/")
  source: string; // 실데이터 출처(문서화)
}

export const INDEXABLE_ROUTE_FAMILIES: readonly IndexableRouteFamily[] = [
  { id: "stock", prefix: "/stock/", source: "realStockPool" },
  { id: "topic", prefix: "/topics/", source: "seoTopics" },
  { id: "compare-pair", prefix: "/compare/", source: "CURATED_COMPARISON_PAIRS" },
];

// ── 3. 큐레이션 비교 허용목록(정확히 7쌍) ──────────────────────────
// 계획서에 명시된 순서가 canonical 이다. 역순·임의 조합은 대체 canonical 이 될 수 없다.
export interface ComparisonPair {
  slug: string; // `${a}-vs-${b}`
  a: string;
  b: string;
}

const RAW_PAIRS: readonly [string, string][] = [
  ["005930", "000660"],
  ["032830", "085620"],
  ["000990", "042700"],
  ["247540", "066970"],
  ["055550", "105560"],
  ["105560", "086790"],
  ["006400", "373220"],
];

export const CURATED_COMPARISON_PAIRS: readonly ComparisonPair[] = RAW_PAIRS.map(
  ([a, b]) => ({ slug: `${a}-vs-${b}`, a, b }),
);

const CURATED_SLUGS = new Set(CURATED_COMPARISON_PAIRS.map((p) => p.slug));

/** 허용목록에 있는 canonical 쌍인지. 역순·임의 조합은 false. */
export function isCuratedComparisonPair(slug: string): boolean {
  return CURATED_SLUGS.has(slug);
}

export function comparisonPairBySlug(slug: string): ComparisonPair | undefined {
  return CURATED_COMPARISON_PAIRS.find((p) => p.slug === slug);
}

/** 큐레이션 비교 페이지의 sitemap 경로(색인 대상은 이 목록뿐). */
export function curatedComparisonPaths(): string[] {
  return CURATED_COMPARISON_PAIRS.map((p) => `/compare/${p.slug}`);
}

// ── 4. 레거시 theme → 마이그레이션 / 은퇴 맵 ───────────────────────
// active: 대상 topic 이 이미 존재(실데이터 뒷받침). pending: Slice B 에서 topic 생성.
// noindex: 실데이터 커버리지가 없어 색인 금지(모의 종목을 공개 근거로 노출 금지).
export type ThemeDisposition =
  | { kind: "redirect"; target: string; status: "active" | "pending" }
  | { kind: "noindex"; reason: string };

export const LEGACY_THEME_MIGRATION: Record<string, ThemeDisposition> = {
  battery: { kind: "redirect", target: "battery-stocks", status: "active" },
  "semi-materials": { kind: "redirect", target: "semiconductor-stocks", status: "active" },
  bio: { kind: "redirect", target: "bio-stocks", status: "pending" },
  shipbuilding: { kind: "redirect", target: "shipbuilding-stocks", status: "pending" },
  robot: {
    kind: "noindex",
    reason: "실데이터 매칭 0건 — 실제 커버리지가 생길 때까지 색인 금지(모의 종목 노출 금지)",
  },
};

// ── 5. 모의(mock) 기반 색인 제외 ───────────────────────────────────
// 레거시 theme 페이지는 실데이터 매칭이 없으면 모의 종목으로 폴백한다. 따라서 어떤
// 레거시 theme 슬러그도 그 자체로 색인 대상이 되어선 안 된다(리다이렉트 또는 noindex).
export const MOCK_BACKED_INDEXING_EXCLUSIONS: readonly string[] =
  mockTopNeglectedThemes.map((t) => t.slug);

// ── 파생 헬퍼(레지스트리 소비자용) ─────────────────────────────────
/** theme 페이지의 실/모의 판정과 동일: 정확한 테마명 포함 종목 수. */
export function realThemeMatchCount(themeName: string): number {
  return realStockPool.filter((s) => s.themes.includes(themeName)).length;
}

export function legacyThemes(): { slug: string; name: string }[] {
  return mockTopNeglectedThemes.map((t) => ({ slug: t.slug, name: t.name }));
}

export function indexableTopicSlugs(): string[] {
  return seoTopics.map((t) => t.slug);
}

// ── 6. 계약 검증기(순수·주입 가능) ─────────────────────────────────
// 이후 Slice E(릴리스 게이트)가 재사용한다. 실 레지스트리를 기본값으로 쓰되, 어떤
// 필드든 교체해 적대적(negative) 픽스처를 넣을 수 있다.
export interface SeoContractInput {
  staticIndexablePaths: readonly string[];
  topicSlugs: string[];
  legacyThemes: { slug: string; name: string }[];
  migration: Record<string, ThemeDisposition>;
  exclusions: readonly string[];
  pairs: readonly ComparisonPair[];
  realTickers: Set<string>;
  realMatchCount: (themeName: string) => number;
  topicExists: (slug: string) => boolean;
  /** 계약이 현재 색인 대상으로 표시한 theme 슬러그(정상 종단 상태 = []). 픽스처 주입용. */
  indexableThemeSlugs?: string[];
  /** sitemap.ts 에서 파싱한 정적 경로. 제공되면 드리프트 검사가 실행된다. */
  sitemapStaticPaths?: string[];
}

export interface ContractViolation {
  code: string;
  detail: string;
}

const KEBAB_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PAIR_SLUG = /^\d{6}-vs-\d{6}$/;

export function defaultContractInput(): SeoContractInput {
  return {
    staticIndexablePaths: STATIC_INDEXABLE_PATHS,
    topicSlugs: indexableTopicSlugs(),
    legacyThemes: legacyThemes(),
    migration: LEGACY_THEME_MIGRATION,
    exclusions: MOCK_BACKED_INDEXING_EXCLUSIONS,
    pairs: CURATED_COMPARISON_PAIRS,
    realTickers: new Set(realStockPool.map((s) => s.ticker)),
    realMatchCount: realThemeMatchCount,
    topicExists: (slug) => getSeoTopic(slug) !== undefined,
    indexableThemeSlugs: [],
  };
}

export function verifySeoContract(input: SeoContractInput): ContractViolation[] {
  const v: ContractViolation[] = [];
  const add = (code: string, detail: string) => v.push({ code, detail });

  const themeName = new Map(input.legacyThemes.map((t) => [t.slug, t.name]));
  const indexableThemes = input.indexableThemeSlugs ?? [];

  // (a) canonical 소유권 — 하나의 검색 의도에 색인 소유자는 정확히 하나.
  const owners = new Map<string, string[]>();
  const claim = (intent: string, owner: string) => {
    const list = owners.get(intent) ?? [];
    list.push(owner);
    owners.set(intent, list);
  };
  for (const slug of input.topicSlugs) claim(slug, `topic:${slug}`);
  for (const slug of indexableThemes) {
    const disp = input.migration[slug];
    const intent = disp && disp.kind === "redirect" ? disp.target : `theme:${slug}`;
    claim(intent, `theme:${slug}`);
  }
  for (const [intent, list] of owners) {
    if (list.length > 1) {
      add("OWNERSHIP_DUP", `검색 의도 "${intent}" 을(를) 색인 소유자 ${list.length}개가 주장: ${list.join(", ")}`);
    }
  }

  // (b) 색인된 zero-real-match theme 금지.
  for (const slug of indexableThemes) {
    const name = themeName.get(slug) ?? slug;
    if (input.realMatchCount(name) === 0) {
      add("ZERO_REAL_MATCH", `theme "${slug}"(${name})가 색인 대상인데 실데이터 매칭 0건`);
    }
  }
  // 실매칭 0건 theme 은 반드시 제외 목록에 있어야 색인될 수 없다(로봇 등).
  for (const { slug, name } of input.legacyThemes) {
    if (input.realMatchCount(name) === 0 && !input.exclusions.includes(slug)) {
      add(
        "ZERO_REAL_MATCH",
        `theme "${slug}"(${name})가 실데이터 매칭 0건인데 mock-backed 제외 목록에 없음 — 색인 가능 상태`,
      );
    }
  }

  // (c) 레거시 theme 마이그레이션 맵 유효성.
  const legacySlugs = new Set(input.legacyThemes.map((t) => t.slug));
  for (const slug of legacySlugs) {
    if (!(slug in input.migration)) {
      add("MIGRATION_MISSING", `레거시 theme "${slug}" 의 마이그레이션 처리(disposition)가 없음`);
    }
  }
  for (const [slug, disp] of Object.entries(input.migration)) {
    if (!legacySlugs.has(slug)) {
      add("MIGRATION_PHANTOM", `마이그레이션 맵에 실재하지 않는 레거시 theme "${slug}"`);
      continue;
    }
    if (disp.kind === "redirect") {
      if (!KEBAB_SLUG.test(disp.target)) {
        add("MIGRATION_TARGET_BADFORMAT", `theme "${slug}" → 대상 slug "${disp.target}" 형식 오류`);
      }
      if (disp.status === "active" && !input.topicExists(disp.target)) {
        add("MIGRATION_TARGET_MISSING", `theme "${slug}" 의 active 대상 topic "${disp.target}" 이(가) 없음`);
      }
    } else if (!disp.reason.trim()) {
      add("MIGRATION_NOINDEX_REASON", `theme "${slug}" noindex 처리에 사유가 없음`);
    }
  }

  // (d) 큐레이션 비교 허용목록 — 임의/역순 노출 금지.
  const seenPair = new Set<string>();
  for (const p of input.pairs) {
    if (p.slug !== `${p.a}-vs-${p.b}`) {
      add("PAIR_SLUG_MISMATCH", `쌍 slug "${p.slug}" 이(가) ${p.a}/${p.b} 와 불일치`);
    }
    if (!PAIR_SLUG.test(p.slug)) add("PAIR_BADFORMAT", `쌍 slug "${p.slug}" 형식 오류(NNNNNN-vs-NNNNNN)`);
    if (p.a === p.b) add("PAIR_SELF", `쌍 "${p.slug}" 의 두 종목이 동일`);
    if (!input.realTickers.has(p.a)) add("PAIR_UNKNOWN_TICKER", `쌍 "${p.slug}" 의 티커 ${p.a} 이(가) 유니버스에 없음`);
    if (!input.realTickers.has(p.b)) add("PAIR_UNKNOWN_TICKER", `쌍 "${p.slug}" 의 티커 ${p.b} 이(가) 유니버스에 없음`);
    if (seenPair.has(p.slug)) add("PAIR_DUP", `중복된 쌍 slug "${p.slug}"`);
    seenPair.add(p.slug);
    const reverse = `${p.b}-vs-${p.a}`;
    if (seenPair.has(reverse)) add("PAIR_REVERSE", `역순 중복 쌍 "${p.slug}" / "${reverse}"`);
  }

  // (e) sitemap 드리프트 — 계약의 정적 경로 = sitemap.ts 정적 경로.
  if (input.sitemapStaticPaths) {
    const declared = new Set(input.staticIndexablePaths);
    const emitted = new Set(input.sitemapStaticPaths);
    for (const p of declared) {
      if (!emitted.has(p)) add("SITEMAP_DRIFT", `계약이 색인 정적 경로 "${p}" 을 선언했으나 sitemap.ts 에 없음`);
    }
    for (const p of emitted) {
      if (!declared.has(p)) add("SITEMAP_DRIFT", `sitemap.ts 가 정적 경로 "${p}" 을 방출했으나 계약에 없음`);
    }
  }

  return v;
}
