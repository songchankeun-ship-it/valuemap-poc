import { notFound } from "next/navigation";
import Link from "next/link";
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
import { ScoreTooltip } from "@/components/ScoreTooltip";
import { BeginnerReading } from "@/components/BeginnerReading";
import { getDataWarnings, dataCompleteness } from "@/lib/dataQuality";
import { MetricStrip } from "@/components/MetricStrip";
import { StockTabs } from "@/components/StockTabs";
import { sectorValueScore, sectorOf } from "@/lib/sector";
import { realStockPool, dataMetadata, formatBizDateLong } from "@/lib/realStocks";
import { dataStatus } from "@/lib/dataStatus";
import { compositeOf } from "@/lib/score";
import { StockConclusionHero, type HeroRiskAlert } from "@/components/stock/StockConclusionHero";
import { classifyConclusion } from "@/lib/conclusion";

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
  const topPctOf = (val: number, key: "momentum" | "flow" | "value" | "vol") => {
    const better = realStockPool.filter((p) => (key === "momentum" ? p.momentum : key === "flow" ? p.flow : key === "value" ? p.value : p.vol) > val).length;
    return Math.max(1, Math.round(((better + 1) / poolN) * 100));
  };
  const rankOf = (val: number, key: "momentum" | "flow" | "value" | "vol") =>
    realStockPool.filter((p) => (key === "momentum" ? p.momentum : key === "flow" ? p.flow : key === "value" ? p.value : p.vol) > val).length + 1;

  // ── 상단 결론 카드(StockConclusionHero) 입력값 ──────────────────────
  const suspect = dataWarnings.length > 0;
  const conclusion = classifyConclusion({ momentum: s.momentum, flow: s.flow, value: s.value, vol: s.vol, surge3m });
  const heroStrengths = reason.strengths.map((x) => x.metric);
  const heroWarnings: string[] = reason.cautions.map((x) => x.metric + " 약함");
  if (surge3m !== null && surge3m >= 80) heroWarnings.push("최근 3개월 급등 — 급등 사유 확인 필요");
  else if (surge3m !== null && surge3m >= 50) heroWarnings.push("최근 상승폭 큼 — 급등 사유 확인");
  const riskAlert: HeroRiskAlert | null =
    surge3m !== null && surge3m >= 80
      ? { level: "high", label: "급등 위험", text: `최근 63거래일(약 3개월) +${Math.round(surge3m)}%. 단기 과열·추격매수 주의, 급등 사유부터 확인하세요.` }
      : surge3m !== null && surge3m >= 50
      ? { level: "warn", label: "과열 주의", text: `최근 63거래일(약 3개월) +${Math.round(surge3m)}%. 추격매수보다 급등 사유 확인이 먼저입니다.` }
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

      <nav className="text-[11px] md:text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
        <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">홈</Link><span>›</span>
        <Link href="/stocks" className="hover:text-zinc-900 dark:hover:text-zinc-100">종목 탐색</Link><span>›</span>
        <span className="text-zinc-900 dark:text-zinc-100 truncate">{s.name}</span>
      </nav>

      <StockConclusionHero
        sector={mySector}
        name={s.name}
        ticker={s.ticker}
        asOfLabel={priceAsOf}
        priceSlot={<LivePrice ticker={s.ticker} fallbackPrice={displayPrice} fallbackChangePct={displayChangePct} asOf={priceAsOf} />}
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
            label: "요약",
            content: (
              <>
      {/* 주가 차트 (가격 데이터 있을 때만) */}
      {priceHistory && priceHistory.points.length >= 2 ? (
        <StockPriceChart ticker={s.ticker} name={s.name} points={priceHistory.points} />
      ) : null}

      {/* 자체 지표 4종 (시각 차트) */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">자체 지표 4종 <span className="text-[10px] font-normal text-zinc-400">전체 {poolN}종목 대비</span></div>
          <Link href="/guide/metrics" className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">지표 가이드 →</Link>
        </div>
        <MetricStrip axes={[
          { label: "추세", kind: "momentum", topPct: topPctOf(s.momentum, "momentum"), rank: rankOf(s.momentum, "momentum"), total: poolN, raw: s.momentum },
          { label: "거래활성도", kind: "flow", topPct: topPctOf(s.flow, "flow"), rank: rankOf(s.flow, "flow"), total: poolN, raw: s.flow },
          { label: "밸류", kind: "value", topPct: topPctOf(s.value, "value"), rank: rankOf(s.value, "value"), total: poolN, raw: s.value },
          { label: "위험조정", kind: "vol", topPct: topPctOf(s.vol, "vol"), rank: rankOf(s.vol, "vol"), total: poolN, raw: s.vol },
        ]} />
      </section>

      {/* 위험 상세 — 위험조정 점수와 별개로 실제 변동성·낙폭 (설계서 6.4) */}
      {vs && (vs.annualStd != null || vs.maxDrawdown != null) ? (
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">위험 상세 <span className="text-[10px] font-normal text-zinc-400">위험조정 점수와 별개</span></div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums">관측 {vs.days ?? 0}거래일 · 신뢰도 {(() => { const d = vs?.days ?? 0; return d >= 252 ? "정상" : d >= 200 ? "보통" : d >= 120 ? "낮음" : "부족"; })()}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-zinc-50 dark:bg-zinc-800/50 p-2">
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">연환산 변동성</div>
              <div className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{vs.annualStd != null ? vs.annualStd.toFixed(1) + "%" : "—"}</div>
            </div>
            <div className="rounded-md bg-zinc-50 dark:bg-zinc-800/50 p-2">
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">최대낙폭</div>
              <div className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">{vs.maxDrawdown != null ? vs.maxDrawdown.toFixed(1) + "%" : "—"}</div>
            </div>
            <div className="rounded-md bg-zinc-50 dark:bg-zinc-800/50 p-2">
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">최악의 하루</div>
              <div className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">{vs.worstDay != null ? vs.worstDay.toFixed(1) + "%" : "—"}</div>
            </div>
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">위험조정 점수가 높아도 절대 변동성이 낮거나 향후 하락 위험이 작다는 의미는 아닙니다.</p>
        </section>
      ) : null}

      {/* 데이터 기준 (설계서 12.2) */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-3">
        <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5">데이터 기준</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-zinc-500 dark:text-zinc-400 tabular-nums">
          <div>주가 <span className="text-zinc-700 dark:text-zinc-300">{priceAsOf ?? "—"} 장마감</span></div>
          <div>분석 대상 <span className="text-zinc-700 dark:text-zinc-300">{poolN}종목</span></div>
          <div>점수 계산 <span className="text-zinc-700 dark:text-zinc-300">{formatBizDateLong(dataMetadata.asOfBusinessDate)}</span></div>
          <div>산식 버전 <span className="text-zinc-700 dark:text-zinc-300">{dataStatus.metricsVersionLabel}</span></div>
        </div>
      </div>

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

      {sectorValue.score >= 0 ? (
        <div className="rounded-lg border border-cyan-200 dark:border-cyan-900 bg-cyan-50/60 dark:bg-cyan-950/20 p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] md:text-xs text-cyan-800 dark:text-cyan-300 font-semibold">업종 대비 밸류 · {sectorValue.sector}</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">같은 업종 {sectorValue.peers}개(본인 제외) 중 PER·PBR 상대 위치 (전체 풀 밸류 {Math.round(s.value)}점과 비교){sectorValue.peers < 10 ? " · ⚠ 표본 작아 신뢰도 낮음" : ""}</div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-lg font-bold tabular-nums text-cyan-700 dark:text-cyan-400">{sectorValue.score}</span>
            <span className="text-[10px] text-zinc-400">/100</span>
          </div>
        </div>
      ) : null}

      {sectorCount >= 2 ? (
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">같은 업종 비교 · {mySector}</div>
            <Link href={"/stocks?theme=" + encodeURIComponent(mySector)} className="text-[11px] text-blue-700 dark:text-blue-400 hover:underline">업종 전체 →</Link>
          </div>
          <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-xs min-w-[280px]">
            <thead>
              <tr className="text-[10px] text-zinc-400 dark:text-zinc-500 text-left">
                <th className="font-normal py-1">종목</th>
                <th className="font-normal py-1 text-right">종합</th>
                <th className="font-normal py-1 text-right">PER</th>
                <th className="font-normal py-1 text-right">등락</th>
              </tr>
            </thead>
            <tbody>
              {sectorTop.map((p) => {
                const isMe = p.ticker === s.ticker;
                return (
                  <tr key={p.ticker} className={"border-t border-zinc-100 dark:border-zinc-800 " + (isMe ? "bg-blue-50/60 dark:bg-blue-950/20" : "")}>
                    <td className="py-1.5 truncate max-w-[140px]">
                      {isMe ? (
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{p.name} <span className="text-[9px] text-blue-600 dark:text-blue-400">현재</span></span>
                      ) : (
                        <Link href={"/stock/" + p.ticker} className="text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400">{p.name}</Link>
                      )}
                    </td>
                    <td className="py-1.5 text-right tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">{Math.round(compositeOf(p))}</td>
                    <td className="py-1.5 text-right tabular-nums text-zinc-600 dark:text-zinc-400">{p.per > 0 ? p.per.toFixed(1) : "—"}</td>
                    <td className={"py-1.5 text-right tabular-nums " + (p.changePct >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400")}>{p.changePct >= 0 ? "+" : ""}{p.changePct.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">같은 업종 {sectorCount}곳(본인 포함) 중 종합점수 상위 {Math.min(6, sectorCount)}곳. 종합점수는 탐색 우선순위용 실험 지표입니다.</p>
        </section>
      ) : null}

              </>
            ),
          },
          {
            id: "financials",
            label: "재무",
            content: (
              <>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { l: "PER(최근 실적)", v: s.per > 0 ? s.per.toFixed(1) + "배" : "—" },
          { l: "PBR", v: s.pbr > 0 ? s.pbr.toFixed(2) + "배" : "—" },
          { l: "ROE", v: s.roe !== 0 ? s.roe.toFixed(1) + "%" : "—" },
          { l: "배당수익률", v: s.dividendYield > 0 ? s.dividendYield.toFixed(2) + "%" : "0%" },
        ].map((m) => (
          <div key={m.l} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2.5 md:p-3">
            <div className="text-[10px] md:text-[11px] text-zinc-500 dark:text-zinc-400 mb-0.5">{m.l}</div>
            <div className="text-base md:text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{m.v}</div>
          </div>
        ))}
      </section>

      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
        PER·PBR은 <strong>최근 실적(후행) 기준</strong>이며 현재가에 따라 매일 달라집니다. 향후 이익을 반영한 예상(Forward) PER과는 다릅니다. 적자(EPS 0 이하)·결측 종목은 밸류 점수를 임의값으로 채우지 않고 <strong>—</strong>로 표시합니다.
      </p>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
        <div className="text-sm font-semibold mb-2 text-zinc-900 dark:text-zinc-100">소속 테마 {s.themes.length}</div>
        <div className="flex gap-1.5 flex-wrap">
          {s.themes.map((t, i) => (
            <Link
              key={t}
              href={"/stocks?theme=" + encodeURIComponent(t)}
              className={"text-[11px] px-2 py-1 rounded-md font-medium hover:opacity-80 transition " + (i === 0 ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300")}
            >
              {t}
            </Link>
          ))}
        </div>
      </section>

              </>
            ),
          },
          {
            id: "disclosures",
            label: "공시",
            content: (
              <>
      <section><StockDisclosures ticker={s.ticker} /></section>              </>
            ),
          },
          {
            id: "basis",
            label: "점수 근거",
            content: (
              <>
      {dataWarnings.length > 0 ? (
        <section className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 md:p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm">⚠️</span>
            <strong className="text-xs md:text-sm font-semibold text-amber-900 dark:text-amber-200">데이터 점검 필요</strong>
          </div>
          <ul className="list-none pl-0 space-y-1">
            {dataWarnings.map((w, i) => (
              <li key={i} className="text-[11px] md:text-xs text-amber-800 dark:text-amber-300 leading-snug flex gap-1.5">
                <span className="shrink-0">·</span><span>{w}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 왜 이 점수? — 강조 카드 (피드백 반영) */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <strong className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">점수는 어떻게 나오나요?</strong>
          <ScoreTooltip kind="composite" size="md" />
        </div>
        <p className="text-xs md:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          종합 <strong className="tabular-nums">{composite}점</strong> = 추세·거래활성도·밸류·위험조정 4지표의 평균입니다. 각 지표 계산식은 <Link href="/guide/metrics" className="text-blue-700 dark:text-blue-400 underline">지표 가이드</Link>에서 볼 수 있어요. 매수·매도 추천이 아닌 탐색 우선순위입니다.
        </p>
      </section>

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
