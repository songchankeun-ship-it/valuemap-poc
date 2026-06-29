import { notFound } from "next/navigation";
import { LivePrice } from "@/components/LivePrice";
import { getStockByTicker } from "@/lib/mockData";
import { AiAnalysisCard } from "@/components/AiAnalysisCard";
import { StockDisclosures } from "@/components/StockDisclosures";
import { AddToCompareButton } from "@/components/AddToCompareButton";
import { AddToWatchlistButton } from "@/components/AddToWatchlistButton";
import { RecentViewTracker } from "@/components/RecentViewTracker";
import { ShareButton } from "@/components/ShareButton";
import { ScoreHistoryChart } from "@/components/ScoreHistoryChart";
import { StockEventTimeline } from "@/components/StockEventTimeline";
import { getScoreHistory } from "@/lib/scoreHistory";
import { StockPriceChart } from "@/components/StockPriceChart";
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
import { classifyConclusion } from "@/lib/conclusion";
import { ScoreBasisBreakdown } from "@/components/stock/ScoreBasisBreakdown";
import { buildScoreBasis } from "@/lib/scoreBasis";
import {
  StockBreadcrumb,
  MetricsSectionHeader,
  RiskDetailCard,
  DataBasisCard,
  SectorValueCard,
  FinancialsSection,
  DataWarningsBanner,
} from "@/components/stock/StockDetailIntro";

export const revalidate = 3600;

// 138개 종목 페이지를 빌드 시 전부 정적 생성 → 배포마다 전체 갱신(구버전 캐시 잔존 방지).
export function generateStaticParams() {
  return realStockPool.map((s) => ({ ticker: s.ticker }));
}

interface PageProps { params: Promise<{ ticker: string }>; }

export async function generateMetadata({ params }: PageProps) {
  const { ticker } = await params;
  const s = getStockByTicker(ticker);
  if (!s) return { title: "종목을 찾을 수 없습니다" };
  const composite = Math.round(compositeOf(s));
  const title = `${s.name} (${ticker}) 분석 — 오른스코어`;
  const description = `${s.name} 종합 점수 ${composite}/100 — 모멘텀 ${Math.round(s.momentum)} · 거래활성도 ${Math.round(s.flow)} · 밸류 ${Math.round(s.value)} · 변동성조정 ${Math.round(s.vol)}. PER ${s.per.toFixed(1)} · PBR ${s.pbr.toFixed(2)}.`;
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
  };
}

interface ReasonV2 {
  strengths: { metric: string; score: number }[];
  cautions: { metric: string; score: number }[];
  interpretation: string;
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

export default async function StockDetailPage({ params }: PageProps) {
  const { ticker } = await params;
  const s = getStockByTicker(ticker);
  if (!s) notFound();
  const composite = Math.round(compositeOf(s));
  const reason = composeReasonV2(s.momentum, s.flow, s.value, s.vol);
  const [scoreHistory, priceHistory] = await Promise.all([
    getScoreHistory(ticker, 30),
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
  const mySector = sectorOf(s.themes);
  const sectorPeers = realStockPool.filter((p) => sectorOf(p.themes) === mySector);
  const sectorRank = sectorPeers.filter((p) => Math.round(compositeOf(p)) > composite).length + 1;
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
  const heroStrengths = reason.strengths.map((x) => x.metric);
  const heroWarnings: string[] = reason.cautions.map((x) => x.metric + " 약함");
  if (surge3m !== null && surge3m >= 80) heroWarnings.push("최근 3개월 급등 — 급등 사유 확인 필요");
  else if (surge3m !== null && surge3m >= 50) heroWarnings.push("최근 상승폭 큼 — 급등 사유 확인");
  const riskAlert: HeroRiskAlert | null =
    surge3m !== null && surge3m >= 80
      ? { level: "high", label: "변동성 확대", text: `최근 63거래일(약 3개월) +${Math.round(surge3m)}%. 최근 상승폭이 커 변동성이 확대될 수 있습니다. 급등 원인과 지속 가능성을 확인하세요.` }
      : surge3m !== null && surge3m >= 50
      ? { level: "warn", label: "상승폭 확대", text: `최근 63거래일(약 3개월) +${Math.round(surge3m)}%. 최근 상승폭이 커 변동성이 확대될 수 있습니다. 급등 원인과 지속 가능성을 확인하세요.` }
      : null;

  // 구조화 데이터 (JSON-LD) — 구글 검색 결과 풍부한 표시
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${s.name} (${ticker}) 종합 분석 — 점수 ${composite}/100`,
        description: `${s.name} 모멘텀 ${Math.round(s.momentum)} · 거래활성도 ${Math.round(s.flow)} · 밸류 ${Math.round(s.value)} · 변동성조정 ${Math.round(s.vol)}. PER ${s.per.toFixed(1)}, PBR ${s.pbr.toFixed(2)}, ROE ${s.roe.toFixed(1)}%.`,
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
        datePublished: new Date().toISOString(),
        dateModified: new Date().toISOString(),
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
        poolN={poolN}
        sectorRank={sectorRank}
        sectorCount={sectorCount}
        completeness={completeness}
        metricsVersion={dataStatus.metricsVersionLabel}
        suspect={suspect}
        conclusion={conclusion}
        strengths={heroStrengths}
        warnings={heroWarnings}
        riskAlert={riskAlert}
      />

      <StockTabs
        tabs={[
          {
            id: "summary",
            labelKey: "summary",
            content: (
              <>
      {/* 주가 차트 (가격 데이터 있을 때만) */}
      {priceHistory && priceHistory.points.length >= 2 ? (
        <StockPriceChart ticker={s.ticker} name={s.name} points={priceHistory.points} />
      ) : null}

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

      {/* 데이터 기준 (설계서 12.2) */}
      <DataBasisCard
        priceAsOf={globalAsOf}
        priceLagAsOf={priceLagAsOf}
        poolN={poolN}
        scoreDate={globalAsOf}
        formulaVersion={dataStatus.metricsVersionLabel}
      />

      {/* 초보자 해석 — 점수 → 행동 가이드 번역 */}
      <BeginnerReading s={{
        momentum: s.momentum,
        flow: s.flow,
        value: s.value,
        vol: s.vol,
        per: s.per,
        pbr: s.pbr,
        roe: s.roe,
      }} />

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
      <section><StockDisclosures ticker={s.ticker} /></section>              </>
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
      <section><StockEventTimeline ticker={s.ticker} scores={scoreHistory} /></section>

      <section><AiAnalysisCard ticker={s.ticker} name={s.name} /></section>
              </>
            ),
          },
        ]}
      />

    </div>
  );
}
