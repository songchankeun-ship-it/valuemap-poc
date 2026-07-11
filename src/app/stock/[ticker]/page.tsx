import { notFound } from "next/navigation";
import { LivePrice } from "@/components/LivePrice";
import { getStockByTicker } from "@/lib/mockData";
import { StockDisclosuresLazy } from "@/components/StockDisclosuresLazy";
import { AddToCompareButton } from "@/components/AddToCompareButton";
import { AddToWatchlistButton } from "@/components/AddToWatchlistButton";
import { RecentViewTracker } from "@/components/RecentViewTracker";
import { ShareButton } from "@/components/ShareButton";
import { ScoreHistoryChart } from "@/components/ScoreHistoryChart";
import { StockEventTimelineLazy } from "@/components/StockEventTimelineLazy";
import { getScoreHistory, type ScorePoint } from "@/lib/scoreHistory";
import { StockPriceChartLazy } from "@/components/StockPriceChartLazy";
import { StockPriceSummary } from "@/components/StockPriceSummary";
import { getPriceHistory } from "@/lib/priceHistory";
import { BeginnerReading } from "@/components/BeginnerReading";
import { getDataWarnings, dataCompleteness } from "@/lib/dataQuality";
import { MetricInsightCards } from "@/components/stock/MetricInsightCards";
import { SectorComparison } from "@/components/stock/SectorComparison";
import { StockTabs } from "@/components/StockTabs";
import { sectorValueScore, sectorOf } from "@/lib/sector";
import { realStockPool, dataMetadata, formatBizDateLong } from "@/lib/realStocks";
import { dataStatus } from "@/lib/dataStatus";
import { compositeOf } from "@/lib/score";
import { StockConclusionHero, type HeroRiskAlert } from "@/components/stock/StockConclusionHero";
import { CompareTray } from "@/components/stock/CompareTray";
import { StockChecklist } from "@/components/stock/StockChecklist";
import { classifyConclusion } from "@/lib/conclusion";
import { ScoreBasisBreakdown } from "@/components/stock/ScoreBasisBreakdown";
import { buildScoreBasis } from "@/lib/scoreBasis";
import {
  StockBreadcrumb,
  MetricsSectionHeader,
  MetricsDetailsSection,
  RiskDetailCard,
  DataBasisCard,
  SectorValueCard,
  FinancialsSection,
  DataWarningsBanner,
} from "@/components/stock/StockDetailIntro";

export const revalidate = 3600;

/** 서버 SSR 데이터 호출이 렌더를 막지 않도록 짧은 타임아웃과 경쟁시키고, 초과 시
 *  폴백으로 넘어간다(today/page.tsx 와 동일 패턴). 점수 히스토리는 기본 탭이 아닌
 *  '근거' 탭의 보조 데이터라, 원격 조회가 멈추면 차트/타임라인만 빈 상태로 graceful
 *  degrade 하고 결론·지표·재무·공시는 영향받지 않는다. 정상(특히 캐시 적중) 시에는
 *  타임아웃 한참 전에 반환되어 동작 무변경. */
async function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

// 138개 종목 페이지를 빌드 시 전부 정적 생성 → 배포마다 전체 갱신(구버전 캐시 잔존 방지).
export function generateStaticParams() {
  return realStockPool.map((s) => ({ ticker: s.ticker }));
}

interface PageProps { params: Promise<{ ticker: string }>; }

function stockSeoDescription(name: string, ticker: string): string {
  return `${name}(${ticker})의 추세·거래활성도·밸류·위험조정 지표와 재무, 공시, 데이터 기준일을 확인하세요. 투자 추천이 아닌 종목 탐색 도구입니다.`;
}

function stockStructuredDataDate(): string | undefined {
  if (dataMetadata.generatedAt) return dataMetadata.generatedAt;
  const d = dataMetadata.asOfBusinessDate;
  if (d && /^\d{8}$/.test(d)) {
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T00:00:00+09:00`;
  }
  return undefined;
}

export async function generateMetadata({ params }: PageProps) {
  const { ticker } = await params;
  const s = getStockByTicker(ticker);
  if (!s) return { title: "종목을 찾을 수 없습니다" };
  const title = `${s.name} (${ticker}) 분석 — 오른스코어`;
  const description = stockSeoDescription(s.name, ticker);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://ornscore.com/stock/${ticker}`,
      siteName: "오른스코어",
      locale: "ko_KR",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: { canonical: `/stock/${ticker}` },
  };
}

interface ReasonV2 {
  strengths: { metric: string; score: number }[];
  cautions: { metric: string; score: number }[];
  interpretation: string;
}

interface RecentChangeItem {
  label: string;
  value: string;
  hint: string;
  tone?: "good" | "bad" | "neutral";
  href?: string;
}

function composeReasonV2(m: number, f: number, v: number, vo: number): ReasonV2 {
  const metrics = [
    { metric: "추세", score: m },
    { metric: "거래활성도", score: f },
    { metric: "밸류", score: v },
    { metric: "위험조정", score: vo },
  ];
  const strengths = metrics.filter(x => x.score >= 70).map(x => ({ metric: x.metric, score: x.score }));
  const cautions = metrics.filter(x => x.score < 50).map(x => ({ metric: x.metric, score: x.score }));

  let interpretation = "";
  if (strengths.length === 0 && cautions.length === 0) {
    interpretation = "네 지표 모두 중간대 — 두드러진 신호 없음";
  } else if (strengths.length === 4) {
    interpretation = "네 지표 모두 우호적인 상태입니다. 시장 전반 변동성도 함께 고려 권장.";
  } else if (strengths.length > 0 && cautions.length === 0) {
    const sNames = strengths.map(s => s.metric).join("·");
    interpretation = sNames + " 지표가 우호적이고 나머지는 중립권입니다.";
  } else if (strengths.length > 0 && cautions.length > 0) {
    const sNames = strengths.map(s => s.metric).join("·");
    const cNames = cautions.map(c => c.metric).join("·");
    interpretation = sNames + " 지표는 강하지만 " + cNames + " 지표는 약한 상태입니다.";
  } else {
    interpretation = "전반적으로 중립~약세 흐름. 추가 분석 권장.";
  }
  return { strengths, cautions, interpretation };
}

function signedNumber(value: number | null, digits = 0): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const fixed = digits === 0 ? String(Math.round(value)) : value.toFixed(digits);
  return value > 0 ? "+" + fixed : fixed;
}

function signedPct(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return signedNumber(value, 1) + "%";
}

function toneOf(value: number | null, neutralBand = 0.5): "good" | "bad" | "neutral" {
  if (value === null || !Number.isFinite(value) || Math.abs(value) < neutralBand) return "neutral";
  return value > 0 ? "good" : "bad";
}

function RecentChangeSummary({ items }: { items: RecentChangeItem[] }) {
  const toneClass = {
    good: "text-emerald-700 dark:text-emerald-300",
    bad: "text-rose-700 dark:text-rose-300",
    neutral: "text-zinc-800 dark:text-zinc-200",
  } as const;
  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 md:p-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">최근 변화</h2>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">점수·거래활성도·가격 흐름을 먼저 확인할 수 있게 요약했어요.</p>
        </div>
        <a href="#basis" className="text-[11px] font-medium text-blue-700 dark:text-blue-400 hover:underline">변화 근거 보기</a>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {items.map((item) => {
          const body = (
            <>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{item.label}</div>
              <div className={"mt-0.5 text-lg font-bold tabular-nums " + toneClass[item.tone ?? "neutral"]}>{item.value}</div>
              <div className="mt-1 text-[10px] leading-snug text-zinc-500 dark:text-zinc-400">{item.hint}</div>
            </>
          );
          const className = "block h-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 px-3 py-2.5 hover:border-blue-300 dark:hover:border-blue-800 transition";
          return item.href ? (
            <a key={item.label} href={item.href} className={className}>{body}</a>
          ) : (
            <div key={item.label} className={className}>{body}</div>
          );
        })}
      </div>
    </section>
  );
}

export default async function StockDetailPage({ params }: PageProps) {
  const { ticker } = await params;
  const s = getStockByTicker(ticker);
  if (!s) notFound();
  const composite = Math.round(compositeOf(s));
  const reason = composeReasonV2(s.momentum, s.flow, s.value, s.vol);
  const [scoreHistory, priceHistory] = await Promise.all([
    // 유일한 요청 시점 원격 호출(Supabase daily_scores). 캐시 적중 시 즉시 반환되고,
    // 원격이 느리거나 멈추면 4초 후 빈 배열로 떨어져 렌더(및 빌드/ISR 재생성)가 막히지
    // 않게 가드한다. 프로덕션(동위치 Supabase)에서는 4초 한참 전에 반환되어 동작 무변경.
    withTimeout(getScoreHistory(ticker, 30), 4000, [] as ScorePoint[]),
    getPriceHistory(ticker),
  ]);

  // ★ 가격/날짜는 차트 데이터를 진실의 원천으로 → 헤더 가격과 차트가 항상 일치
  const lastPoint = priceHistory?.points?.[priceHistory.points.length - 1];
  const prevPoint = priceHistory?.points?.[priceHistory.points.length - 2];
  const displayPrice = lastPoint?.c ?? s.currentPrice;
  const displayChangePct = (lastPoint && prevPoint && prevPoint.c > 0)
    ? ((lastPoint.c - prevPoint.c) / prevPoint.c) * 100
    : s.changePct;
  const vs = s.volStats;
  const priceAsOf = lastPoint?.d ?? null;
  // ── 데이터 기준일 통일(설계서 P0-1 A안) ───────────────────────────────
  // 전 화면(헤더/푸터/홈/탐색/상태)이 읽는 전역 스냅샷 기준일을 종목 상세도 동일하게 사용한다.
  // 종목 주가의 마지막 거래일(priceAsOf)을 YYYYMMDD로 정규화해 전역 기준일과 비교 →
  //  - 같으면(정상): 전역 기준일을 그대로 노출해 값·포맷이 /status·헤더와 일치.
  //  - priceAsOf가 더 과거면(지연): 전역 기준일을 보여주되 종목 주가 기준이 더 과거임을 명시(B안 안내).
  const globalAsOf = formatBizDateLong(dataMetadata.asOfBusinessDate);
  const priceAsOfDigits = priceAsOf ? priceAsOf.replace(/-/g, "") : null;
  const priceLagsGlobal =
    !!priceAsOfDigits &&
    /^\d{8}$/.test(priceAsOfDigits) &&
    !!dataMetadata.asOfBusinessDate &&
    /^\d{8}$/.test(dataMetadata.asOfBusinessDate) &&
    priceAsOfDigits < dataMetadata.asOfBusinessDate;
  // 지연 시에만 종목 주가의 실제 기준일(과거)을 정식 포맷으로 표기. 정상이면 null.
  const priceLagAsOf =
    priceLagsGlobal && priceAsOfDigits ? formatBizDateLong(priceAsOfDigits) : null;
  // LivePrice 종가 라벨: 정상이면 전역 기준일, 지연이면 종가가 실제로 찍힌 과거 기준일.
  const livePriceAsOf = priceLagAsOf ?? globalAsOf;
  const dataWarnings = getDataWarnings(s, priceHistory);
  // 3개월(약 63거래일) 급등 위험 — 점수보다 먼저 노출
  let surge3m: number | null = null;
  {
    const pp = priceHistory?.points;
    if (pp && pp.length > 63) {
      const lastC = pp[pp.length - 1]?.c;
      const pastC = pp[pp.length - 1 - 63]?.c;
      if (lastC && pastC && pastC > 0) surge3m = ((lastC - pastC) / pastC) * 100;
    }
  }
  const completeness = dataCompleteness(s, priceHistory);
  const sectorValue = sectorValueScore(s, realStockPool);
  const poolN = realStockPool.length;
  const overallRank = realStockPool.filter((p) => Math.round(compositeOf(p)) > composite).length + 1;
  const overallTieCount = realStockPool.filter((p) => Math.round(compositeOf(p)) === composite).length;
  const mySector = sectorOf(s.themes, s.ticker);
  const sectorPeers = realStockPool.filter((p) => sectorOf(p.themes, p.ticker) === mySector);
  const sectorRank = sectorPeers.filter((p) => Math.round(compositeOf(p)) > composite).length + 1;
  const sectorTieCount = sectorPeers.filter((p) => Math.round(compositeOf(p)) === composite).length;
  const sectorCount = sectorPeers.length;
  const sectorSorted = [...sectorPeers].sort((a, b) => compositeOf(b) - compositeOf(a));
  const meInTop = sectorSorted.slice(0, 6).some((p) => p.ticker === s.ticker);
  const meRow = sectorPeers.find((p) => p.ticker === s.ticker);
  const sectorTop = meInTop || !meRow ? sectorSorted.slice(0, 6) : [...sectorSorted.slice(0, 5), meRow];
  // 업종 비교 시각화 행 — 종합점수는 여기서 1회 계산해 넘긴다(컴포넌트는 표시만).
  const sectorRows = sectorTop.map((p) => ({
    ticker: p.ticker,
    name: p.name,
    composite: Math.round(compositeOf(p)),
    per: p.per,
    changePct: p.changePct,
    rank: sectorSorted.findIndex((x) => x.ticker === p.ticker) + 1,
    isMe: p.ticker === s.ticker,
  }));
  const topPctOf = (val: number, key: "momentum" | "flow" | "value" | "vol") => {
    const better = realStockPool.filter((p) => (key === "momentum" ? p.momentum : key === "flow" ? p.flow : key === "value" ? p.value : p.vol) > val).length;
    return Math.max(1, Math.round(((better + 1) / poolN) * 100));
  };
  const rankOf = (val: number, key: "momentum" | "flow" | "value" | "vol") =>
    realStockPool.filter((p) => (key === "momentum" ? p.momentum : key === "flow" ? p.flow : key === "value" ? p.value : p.vol) > val).length + 1;

  // ── 종합 점수 근거(설계서 2 §5.1~5.2) — 표시 파생만, 점수 계산식 무변경 ──
  const scoreBasis = buildScoreBasis({
    momentum: s.momentum,
    flow: s.flow,
    value: s.value,
    vol: s.vol,
    per: s.per,
    pbr: s.pbr,
    roe: s.roe,
    total: poolN,
    returns: s.returns,
    volStats: vs,
    flowStats: s.flowStats,
    sectorValue,
    ranks: {
      momentum: { rank: rankOf(s.momentum, "momentum"), topPct: topPctOf(s.momentum, "momentum") },
      flow: { rank: rankOf(s.flow, "flow"), topPct: topPctOf(s.flow, "flow") },
      value: { rank: rankOf(s.value, "value"), topPct: topPctOf(s.value, "value") },
      vol: { rank: rankOf(s.vol, "vol"), topPct: topPctOf(s.vol, "vol") },
    },
  });

  // ── 상단 결론 카드(StockConclusionHero) 입력값 ──────────────────────
  const suspect = dataWarnings.length > 0;
  const conclusion = classifyConclusion({ momentum: s.momentum, flow: s.flow, value: s.value, vol: s.vol, surge3m });
  const metricSignals = [
    { metric: "추세", score: s.momentum },
    { metric: "거래활성도", score: s.flow },
    { metric: "밸류", score: s.value },
    { metric: "위험조정", score: s.vol },
  ];
  const sortedStrengths = [...reason.strengths].sort((a, b) => b.score - a.score);
  const sortedCautions = [...reason.cautions].sort((a, b) => a.score - b.score);
  const strongestMetric = [...metricSignals].sort((a, b) => b.score - a.score)[0]!;
  const weakestMetric = [...metricSignals].sort((a, b) => a.score - b.score)[0]!;
  const leadStrength = sortedStrengths[0] ?? strongestMetric;
  const leadCheck = sortedCautions[0] ?? weakestMetric;
  const leadStrengthSignal = { label: leadStrength.metric, score: leadStrength.score };
  const leadCheckSignal = { label: leadCheck.metric, score: leadCheck.score };
  const heroStrengths = sortedStrengths.map((x) => x.metric);
  const heroWarnings: string[] = sortedCautions.map((x) => x.metric + " 약함");
  const prevScorePoint = scoreHistory.length >= 2 ? scoreHistory[scoreHistory.length - 2] : null;
  const scoreDelta = prevScorePoint ? composite - Math.round(compositeOf(prevScorePoint)) : null;
  const flowDelta = prevScorePoint ? s.flow - prevScorePoint.flow : null;
  const recentChangeItems: RecentChangeItem[] = [
    {
      label: "종합 점수",
      value: signedNumber(scoreDelta),
      hint: prevScorePoint ? `${prevScorePoint.date.slice(5)} 대비` : "점수 이력 부족",
      tone: toneOf(scoreDelta),
    },
    {
      label: "거래활성도",
      value: signedNumber(flowDelta),
      hint: prevScorePoint ? "최근 관심 변화 확인" : "점수 이력 부족",
      tone: toneOf(flowDelta),
    },
    {
      label: "3개월 수익률",
      value: signedPct(surge3m),
      hint: surge3m === null ? "가격 이력 부족" : "상승폭이 크면 사유 확인",
      tone: toneOf(surge3m, 1),
    },
    {
      label: "최근 공시",
      value: "공시 탭",
      hint: "원문과 확인 포인트 보기",
      tone: "neutral",
      href: "#disclosures",
    },
  ];
  // 급등/상승폭 확대는 별도 riskAlert와 "먼저 확인" 문장으로 강조한다.
  // 확인할 점 목록에는 지표 약점만 남겨 상단 요약의 반복을 줄인다.
  const riskAlert: HeroRiskAlert | null =
    surge3m !== null && surge3m >= 80
      ? { level: "high", label: "변동성 확대", text: `최근 63거래일(약 3개월) +${Math.round(surge3m)}%. 최근 상승폭이 커 변동성이 확대될 수 있습니다. 급등 원인과 지속 가능성을 확인하세요.` }
      : surge3m !== null && surge3m >= 50
      ? { level: "warn", label: "상승폭 확대", text: `최근 63거래일(약 3개월) +${Math.round(surge3m)}%. 최근 상승폭이 커 변동성이 확대될 수 있습니다. 급등 원인과 지속 가능성을 확인하세요.` }
      : null;

  // 구조화 데이터 (JSON-LD) — 구글 검색 결과 풍부한 표시
  const structuredDataDate = stockStructuredDataDate();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${s.name} (${ticker}) 종목 분석 — 오른스코어`,
        description: stockSeoDescription(s.name, ticker),
        author: {
          "@type": "Organization",
          name: "오른스코어",
          url: "https://ornscore.com",
        },
        publisher: {
          "@type": "Organization",
          name: "오른스코어",
          url: "https://ornscore.com",
        },
        datePublished: structuredDataDate,
        dateModified: structuredDataDate,
        mainEntityOfPage: `https://ornscore.com/stock/${ticker}`,
        about: {
          "@type": "Thing",
          name: `${s.name} (${ticker})`,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: "https://ornscore.com" },
          { "@type": "ListItem", position: 2, name: "종목 탐색", item: "https://ornscore.com/stocks" },
          { "@type": "ListItem", position: 3, name: `${s.name}`, item: `https://ornscore.com/stock/${ticker}` },
        ],
      },
    ],
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecentViewTracker ticker={s.ticker} name={s.name} />

      <StockBreadcrumb name={s.name} />

      <StockConclusionHero
        sector={mySector}
        name={s.name}
        ticker={s.ticker}
        asOfLabel={globalAsOf}
        priceLagAsOf={priceLagAsOf}
        priceSlot={<LivePrice ticker={s.ticker} fallbackPrice={displayPrice} fallbackChangePct={displayChangePct} asOf={livePriceAsOf} />}
        actionsSlot={
          <>
            <AddToWatchlistButton ticker={s.ticker} name={s.name} />
            <AddToCompareButton ticker={s.ticker} name={s.name} />
            <ShareButton name={s.name} ticker={s.ticker} />
          </>
        }
        score={composite}
        overallRank={overallRank}
        overallTieCount={overallTieCount}
        poolN={poolN}
        sectorRank={sectorRank}
        sectorTieCount={sectorTieCount}
        sectorCount={sectorCount}
        completeness={completeness}
        metricsVersion={dataStatus.metricsVersionLabel}
        suspect={suspect}
        conclusion={conclusion}
        strengths={heroStrengths}
        warnings={heroWarnings}
        riskAlert={riskAlert}
        leadStrength={leadStrengthSignal}
        leadCheck={leadCheckSignal}
      />

      <RecentChangeSummary items={recentChangeItems} />

      <StockTabs
        tabs={[
          {
            id: "summary",
            labelKey: "summary",
            content: (
              <>
      {/* 주가 차트 (가격 데이터 있을 때만) */}
      {priceHistory && priceHistory.points.length >= 2 ? (
        <>
          <StockPriceChartLazy ticker={s.ticker} name={s.name} points={priceHistory.points} />
          {/* 차트는 ssr:false 지연 로드라 검색엔진·스크린리더·비JS에 빈 섹션으로 보인다.
              서버 렌더 텍스트 요약으로 차트 섹션이 비지 않게 보완(가격 시계열 파생 수치만). */}
          <StockPriceSummary name={s.name} points={priceHistory.points} />
        </>
      ) : null}

      {/* 초보자 해석 — 설계서 5-3/5-4: 요약 탭 첫 화면에서 '현재 해석 → 먼저 확인할 것'이 먼저 읽히게 차트 바로 뒤로 승격 */}
      <BeginnerReading s={{
        momentum: s.momentum,
        flow: s.flow,
        value: s.value,
        vol: s.vol,
        per: s.per,
        pbr: s.pbr,
        roe: s.roe,
      }} />

      {/* 확인 완료 체크리스트 — 직접 확인한 항목(공시·실적·밸류·업종 비교)을 이 기기에만 기록하는 재방문 장치.
          점수/데이터/공시 로직 무변경 · 로그인 동기화·알림 없음. 각 라벨은 해당 탭 해시로 이어진다. */}
      <StockChecklist ticker={s.ticker} name={s.name} />

      {/* 지표 상세·순위·산식 — 설계서 5-4: 기본 접힘, '대표 신호(히어로) → 자세히 보기' 흐름.
          4지표 카드·위험 상세·업종 대비 밸류·같은 업종 비교를 한 번에 펼친다(점수/순위 계산 무변경). */}
      <MetricsDetailsSection>
        {/* 자체 지표 4종 (점수 카드) */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
          <MetricsSectionHeader poolN={poolN} />
          <MetricInsightCards metrics={[
            { label: "추세", kind: "momentum", score: s.momentum, topPct: topPctOf(s.momentum, "momentum"), rank: rankOf(s.momentum, "momentum"), total: poolN },
            { label: "거래활성도", kind: "flow", score: s.flow, topPct: topPctOf(s.flow, "flow"), rank: rankOf(s.flow, "flow"), total: poolN },
            { label: "밸류", kind: "value", score: s.value, topPct: topPctOf(s.value, "value"), rank: rankOf(s.value, "value"), total: poolN, per: s.per, pbr: s.pbr },
            { label: "위험조정", kind: "vol", score: s.vol, topPct: topPctOf(s.vol, "vol"), rank: rankOf(s.vol, "vol"), total: poolN },
          ]} />
        </section>

        {/* 위험 상세 — 위험조정 점수와 별개로 실제 변동성·낙폭 (설계서 6.4) */}
        {vs && (vs.annualStd != null || vs.maxDrawdown != null) ? (
          <RiskDetailCard
            days={vs.days ?? 0}
            annualStd={vs.annualStd ?? null}
            maxDrawdown={vs.maxDrawdown ?? null}
            worstDay={vs.worstDay ?? null}
          />
        ) : null}

        {/* 업종 대비 밸류 — 점수 산식(sectorValueScore) 무변경. 표시/문구만 SectorValueCard에서 분기 */}
        <SectorValueCard
          hasScore={sectorValue.score >= 0}
          sectorName={sectorValue.sector}
          peers={sectorValue.peers}
          score={sectorValue.score}
          poolN={poolN}
          valueScore={s.value}
        />

        <SectorComparison rows={sectorRows} sector={mySector} sectorCount={sectorCount} />
      </MetricsDetailsSection>

      {/* 데이터 기준 (설계서 12.2) — 접힘 밖에 두어 기준일이 요약 탭 SSR 본문에 항상 남게 한다 */}
      <DataBasisCard
        priceAsOf={globalAsOf}
        priceLagAsOf={priceLagAsOf}
        poolN={poolN}
        scoreDate={globalAsOf}
        formulaVersion={dataStatus.metricsVersionLabel}
      />

              </>
            ),
          },
          {
            id: "financials",
            labelKey: "financials",
            content: (
              <FinancialsSection
                per={s.per}
                pbr={s.pbr}
                roe={s.roe}
                dividendYield={s.dividendYield}
                themes={s.themes}
              />
            ),
          },
          {
            id: "disclosures",
            labelKey: "disclosures",
            content: (
              <>
      <section><StockDisclosuresLazy ticker={s.ticker} /></section>              </>
            ),
          },
          {
            id: "basis",
            labelKey: "basis",
            content: (
              <>
      <DataWarningsBanner warnings={dataWarnings} />

      {/* 왜 이 점수? — 종합 점수 근거 보기(설계서 2 §5.1~5.2) */}
      <ScoreBasisBreakdown basis={scoreBasis} />

      {scoreHistory.length > 0 ? (
        <section><ScoreHistoryChart history={scoreHistory} currentScore={composite} /></section>
      ) : null}
      <section><StockEventTimelineLazy ticker={s.ticker} scores={scoreHistory} /></section>
              </>
            ),
          },
        ]}
      />

      {/* 설계서 5-8: 비교함에 종목이 담겨 있을 때만 뜨는 비교 유도 트레이. 담기 로직은 히어로의
          '비교 추가'가 소유하고, 이 트레이는 상태 반영 + /compare 이동만 담당(중복 CTA 방지). */}
      <CompareTray />
    </div>
  );
}
