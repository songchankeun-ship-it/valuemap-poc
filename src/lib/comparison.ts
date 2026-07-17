// 큐레이션 비교 콘텐츠 레지스트리 — Slice C.
//
// Slice A(seoContract.ts)가 승인한 정확히 7개의 비교 허용목록을 소비해, 안정적
// `/compare/[pair]` 랜딩 페이지가 렌더할 "해석된 비교(resolved comparison)"를 만든다.
// 여기서 만들어지는 것은 전부 실데이터(realStockPool)로 뒷받침되며, 임의/역순 쌍은
// 절대 해석되지 않는다(대체 canonical 방지). 페이지·메타데이터·JSON-LD·차이 문장은
// 모두 이 한 곳에서 파생되어 테스트가 페이지 없이도 계약을 고정할 수 있다.
//
// 중립성 계약: 지표 차이는 "높다/낮다/많다/적다"로만 서술한다. "더 좋다/나쁘다/우수"
// 같은 보편적 우열 표현은 쓰지 않는다(같은 수치라도 업종·시점·전략에 따라 해석이 다르다).
// 제목·설명 메타데이터에는 변동값(가격·점수·재무 수치)을 넣지 않는다 — 이름·티커·지표명만.
import { realStockPool, type RealStock } from "@/lib/realStocks";
import { sectorOf } from "@/lib/sector";
import { compositeOf } from "@/lib/score";
import {
  comparisonPairBySlug,
  isCuratedComparisonPair,
  CURATED_COMPARISON_PAIRS,
  type ComparisonPair,
} from "@/lib/seoContract";

export const SITE = "https://ornscore.com";

const byTicker = new Map(realStockPool.map((s) => [s.ticker, s]));

// ── 지표 값 표현 ────────────────────────────────────────────────
export interface MetricValue {
  /** 비교 가능한(유효한) 값인지. 결측(0·비유한)이면 false. */
  valid: boolean;
  raw: number;
  display: string;
}

export interface ComparisonMetric {
  key: string;
  label: string;
  /** 값의 의미를 알리는 중립 설명(우열 판단 아님). */
  hint: string;
  a: MetricValue;
  b: MetricValue;
  /** 수치가 더 높은 쪽. 결측 비교 불가면 "na", 동일하면 "tie". */
  higher: "a" | "b" | "tie" | "na";
  /** 중립(높다/낮다) 차이 문장. */
  sentence: string;
}

export interface ComparisonStock {
  ticker: string;
  name: string;
  sector: string;
}

export interface ResolvedComparison {
  slug: string;
  a: ComparisonStock;
  b: ComparisonStock;
  metrics: ComparisonMetric[];
  limitations: string[];
  /** 인터랙티브 비교 화면 경로(두 종목이 미리 담긴 상태). */
  interactiveHref: string;
}

function scoreValue(v: number): MetricValue {
  const valid = Number.isFinite(v);
  return { valid, raw: v, display: valid ? String(Math.round(v)) : "—" };
}

function ratioValue(v: number, digits: number, suffix: string): MetricValue {
  const valid = Number.isFinite(v) && v > 0;
  return { valid, raw: v, display: valid ? `${v.toFixed(digits)}${suffix}` : "—" };
}

function marketCapValue(v: number): MetricValue {
  const valid = Number.isFinite(v) && v > 0;
  if (!valid) return { valid: false, raw: v, display: "—" };
  const jo = v / 1_000_000_000_000;
  const display = jo >= 1 ? `${jo.toFixed(1)}조원` : `${Math.round(v / 100_000_000).toLocaleString("ko-KR")}억원`;
  return { valid: true, raw: v, display };
}

function higherSide(a: MetricValue, b: MetricValue): "a" | "b" | "tie" | "na" {
  if (!a.valid || !b.valid) return "na";
  if (a.raw === b.raw) return "tie";
  return a.raw > b.raw ? "a" : "b";
}

// 중립 차이 문장 — 오직 높다/낮다/동일/비교불가만 쓴다(보편적 우열 표현 금지).
function neutralSentence(
  label: string,
  a: MetricValue,
  b: MetricValue,
  higher: "a" | "b" | "tie" | "na",
  nameA: string,
  nameB: string,
): string {
  if (higher === "na") return `${label}은(는) 한쪽 값이 없어 비교할 수 없습니다.`;
  if (higher === "tie") return `${label}은(는) ${nameA}와(과) ${nameB}가 ${a.display}로 동일합니다.`;
  const hi = higher === "a" ? nameA : nameB;
  const lo = higher === "a" ? nameB : nameA;
  const hiV = higher === "a" ? a.display : b.display;
  const loV = higher === "a" ? b.display : a.display;
  return `${label}은(는) ${hi}(${hiV})가 ${lo}(${loV})보다 높습니다.`;
}

function metricRow(
  key: string,
  label: string,
  hint: string,
  a: MetricValue,
  b: MetricValue,
  nameA: string,
  nameB: string,
): ComparisonMetric {
  const higher = higherSide(a, b);
  return { key, label, hint, a, b, higher, sentence: neutralSentence(label, a, b, higher, nameA, nameB) };
}

function toComparisonStock(s: RealStock): ComparisonStock {
  return { ticker: s.ticker, name: s.name, sector: sectorOf(s.themes, s.ticker) };
}

// 두 종목의 지표를 나란히 만든 행 목록. 자체 지표 4종 + 종합 + 재무 + 시총.
function buildMetrics(sa: RealStock, sb: RealStock): ComparisonMetric[] {
  const n = { a: sa.name, b: sb.name };
  return [
    metricRow("composite", "종합 점수", "자체 지표 4종의 평균(0~100)", scoreValue(compositeOf(sa)), scoreValue(compositeOf(sb)), n.a, n.b),
    metricRow("momentum", "추세", "가격 추세 강도(0~100)", scoreValue(sa.momentum), scoreValue(sb.momentum), n.a, n.b),
    metricRow("flow", "거래활성도", "최근 거래량 활성도(0~100)", scoreValue(sa.flow), scoreValue(sb.flow), n.a, n.b),
    metricRow("value", "밸류", "이익·자산 대비 저평가 정도(0~100)", scoreValue(sa.value), scoreValue(sb.value), n.a, n.b),
    metricRow("vol", "위험조정", "변동성 대비 수익 안정성(0~100)", scoreValue(sa.vol), scoreValue(sb.vol), n.a, n.b),
    metricRow("per", "PER", "주가수익비율(배)", ratioValue(sa.per, 1, "배"), ratioValue(sb.per, 1, "배"), n.a, n.b),
    metricRow("pbr", "PBR", "주가순자산비율(배)", ratioValue(sa.pbr, 2, "배"), ratioValue(sb.pbr, 2, "배"), n.a, n.b),
    metricRow("roe", "ROE", "자기자본이익률(%)", ratioValue(sa.roe, 1, "%"), ratioValue(sb.roe, 1, "%"), n.a, n.b),
    metricRow("dividendYield", "배당수익률", "연 배당수익률(%)", ratioValue(sa.dividendYield, 1, "%"), ratioValue(sb.dividendYield, 1, "%"), n.a, n.b),
    metricRow("marketCap", "시가총액", "발행주식 × 현재가", marketCapValue(sa.marketCap), marketCapValue(sb.marketCap), n.a, n.b),
  ];
}

const LIMITATIONS: readonly string[] = [
  "비교는 두 종목을 나란히 보는 탐색 보조이며 매수·매도 추천이 아닙니다.",
  "지표가 높거나 낮다는 것이 곧 더 좋거나 나쁜 종목을 뜻하지 않습니다 — 업종·시점·투자 전략에 따라 해석이 달라집니다.",
  "가격·점수·재무 수치는 데이터 기준일 기준이며 시장 상황에 따라 바뀝니다.",
  "두 종목의 업종·사업 구조가 다르면 단순 수치 비교의 의미가 제한됩니다.",
];

/**
 * 슬러그를 해석해 렌더 가능한 비교 데이터를 만든다.
 * 큐레이션 허용목록(정순 7쌍)에 있고 두 종목이 모두 실데이터 풀에 있을 때만 반환한다.
 * 임의·역순 슬러그는 null(대체 canonical/색인 페이지가 되지 않는다).
 */
export function resolveComparison(slug: string): ResolvedComparison | null {
  if (!isCuratedComparisonPair(slug)) return null;
  const pair = comparisonPairBySlug(slug);
  if (!pair) return null;
  const sa = byTicker.get(pair.a);
  const sb = byTicker.get(pair.b);
  if (!sa || !sb) return null;
  return {
    slug,
    a: toComparisonStock(sa),
    b: toComparisonStock(sb),
    metrics: buildMetrics(sa, sb),
    limitations: [...LIMITATIONS],
    interactiveHref: `/compare?stocks=${pair.a},${pair.b}`,
  };
}

/** 정적 생성 대상 = 큐레이션 7쌍뿐. 라우트의 generateStaticParams 정본. */
export function comparisonStaticParams(): { pair: string }[] {
  return CURATED_COMPARISON_PAIRS.map((p) => ({ pair: p.slug }));
}

// ── 안정적(변동값 없는) 메타데이터 ────────────────────────────────
// 제목·설명은 오직 이름·티커·지표명에서만 파생한다. 가격·점수·재무 수치를 절대 넣지 않아
// 같은 두 종목이면 데이터가 갱신돼도 메타데이터가 바뀌지 않는다(안정 canonical).
export interface ComparisonMetadata {
  title: string;
  description: string;
  canonical: string;
  h1: string;
}

export function comparisonMetadata(slug: string): ComparisonMetadata | null {
  const r = resolveComparison(slug);
  if (!r) return null;
  const pairLabel = `${r.a.name} vs ${r.b.name}`;
  return {
    title: `${pairLabel} 비교 (${r.a.ticker}·${r.b.ticker}) — 오른스코어`,
    description: `${r.a.name}와(과) ${r.b.name}의 추세·거래활성도·밸류·위험조정 지표와 PER·PBR·ROE, 배당수익률, 시가총액을 중립적으로 나란히 비교합니다. 투자 추천이 아닌 종목 탐색 도구입니다.`,
    canonical: `/compare/${slug}`,
    h1: `${pairLabel} 비교`,
  };
}

/** 비교 페이지 breadcrumb JSON-LD(홈 › 종목 비교 › A vs B). */
export function comparisonBreadcrumbJsonLd(r: ResolvedComparison): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE },
      { "@type": "ListItem", position: 2, name: "종목 비교", item: `${SITE}/compare` },
      {
        "@type": "ListItem",
        position: 3,
        name: `${r.a.name} vs ${r.b.name} 비교`,
        item: `${SITE}/compare/${r.slug}`,
      },
    ],
  };
}

/** 특정 티커가 포함된 큐레이션 비교 쌍들(종목 페이지의 서버 렌더 내부 링크용). */
export function curatedPairsForTicker(ticker: string): { slug: string; other: ComparisonStock }[] {
  const out: { slug: string; other: ComparisonStock }[] = [];
  for (const p of CURATED_COMPARISON_PAIRS) {
    const otherTicker = p.a === ticker ? p.b : p.b === ticker ? p.a : null;
    if (!otherTicker) continue;
    const other = byTicker.get(otherTicker);
    if (!other) continue;
    out.push({ slug: p.slug, other: toComparisonStock(other) });
  }
  return out;
}

/** `/compare` 랜딩에 서버 렌더할 큐레이션 비교 카드 목록(전부 실데이터 뒷받침). */
export function curatedComparisonCards(): { slug: string; a: ComparisonStock; b: ComparisonStock }[] {
  const out: { slug: string; a: ComparisonStock; b: ComparisonStock }[] = [];
  for (const p of CURATED_COMPARISON_PAIRS as readonly ComparisonPair[]) {
    const sa = byTicker.get(p.a);
    const sb = byTicker.get(p.b);
    if (!sa || !sb) continue;
    out.push({ slug: p.slug, a: toComparisonStock(sa), b: toComparisonStock(sb) });
  }
  return out;
}
