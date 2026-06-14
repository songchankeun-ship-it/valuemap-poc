import { notFound } from "next/navigation";
import Link from "next/link";
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
import { gradeOf } from "@/lib/grade";
import { sectorValueScore, sectorOf } from "@/lib/sector";
import { realStockPool } from "@/lib/realStocks";
import { compositeOf } from "@/lib/score";

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
    { metric: "위험대비", score: vo },
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

function scoreTone(score: number): { text: string; bg: string; border: string; ring: string } {
  if (score >= 70) return {
    text: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900",
    ring: "ring-emerald-200 dark:ring-emerald-900",
  };
  if (score >= 50) return {
    text: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-900",
    ring: "ring-blue-200 dark:ring-blue-900",
  };
  return {
    text: "text-zinc-600 dark:text-zinc-400",
    bg: "bg-zinc-50 dark:bg-zinc-900",
    border: "border-zinc-200 dark:border-zinc-800",
    ring: "ring-zinc-200 dark:ring-zinc-800",
  };
}

export default async function StockDetailPage({ params }: PageProps) {
  const { ticker } = await params;
  const s = getStockByTicker(ticker);
  if (!s) notFound();
  const composite = Math.round(compositeOf(s));
  const reason = composeReasonV2(s.momentum, s.flow, s.value, s.vol);
  const tone = scoreTone(composite);
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
  const surgeRisk = surge3m !== null && surge3m >= 80;
  const grade = gradeOf(composite);
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

      <header className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg md:text-xl font-semibold text-zinc-900 dark:text-zinc-100">{s.name}</h1>
          <span className="text-[11px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md tabular-nums font-mono">{s.ticker}</span>
        </div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-xl md:text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{Math.round(displayPrice).toLocaleString()}<span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-0.5">원</span></span>
          <span className={"text-sm font-medium tabular-nums " + (displayChangePct >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400")}>
            {displayChangePct >= 0 ? "▲" : "▼"} {Math.abs(displayChangePct).toFixed(2)}%
          </span>
          {priceAsOf ? (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums">· {priceAsOf} 종가</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AddToWatchlistButton ticker={s.ticker} name={s.name} />
          <AddToCompareButton ticker={s.ticker} name={s.name} />
          <ShareButton name={s.name} ticker={s.ticker} />
        </div>
      </header>

      {/* 결론 헤드라인 — 등급·순위·강점/위험 먼저 (디자인 리뷰 P0) */}
      <section className={"rounded-lg border-2 " + (dataWarnings.length > 0 ? "border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20" : tone.border + " " + tone.bg) + " p-3 md:p-4"}>
        {surgeRisk ? (
          <div className="mb-2.5 flex items-start gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1.5 rounded-md border border-rose-200 dark:border-rose-900">
            <span aria-hidden="true">🔺</span>
            <span>급등 위험 — 최근 3개월 +{Math.round(surge3m as number)}%. 단기 과열·추격매수 주의, 급등 사유부터 확인하세요.</span>
          </div>
        ) : null}
        {dataWarnings.length > 0 ? (
          <div className="mb-2.5 flex items-start gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <span aria-hidden="true">⚠</span>
            <span>가격 데이터 검증 중 — 아래 등급·점수는 임시 계산값이며, 공식 후보·순위에서 제외됩니다.</span>
          </div>
        ) : null}
        <div className="flex items-start gap-3">
          <div className={"shrink-0 flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-xl ring-2 " + (dataWarnings.length > 0 ? "ring-zinc-300 dark:ring-zinc-700" : tone.ring) + " bg-white dark:bg-zinc-900"}>
            <div className={"text-xl md:text-2xl font-bold leading-none " + (dataWarnings.length > 0 ? "text-zinc-400 dark:text-zinc-500" : tone.text)}>{grade.grade}{dataWarnings.length > 0 ? <span className="text-amber-600 dark:text-amber-400"> ⚠</span> : null}</div>
            <div className="text-[8px] text-zinc-400 dark:text-zinc-500 mt-0.5 tabular-nums">{composite}/100</div>
            <div className="text-[7px] text-zinc-400 dark:text-zinc-500 leading-none uppercase tracking-wide">탐색등급</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm md:text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-snug mb-1.5">{dataWarnings.length > 0 ? "데이터 검증 중 · 임시등급 — " : ""}{reason.interpretation}</div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
              <span>분석 대상 {poolN}종목 중 <strong className="text-zinc-700 dark:text-zinc-300">{overallRank}</strong>위</span>
              <span>업종({mySector}) <strong className="text-zinc-700 dark:text-zinc-300">{sectorRank}</strong>/{sectorCount}위</span>
              <span>필수 데이터 항목 <strong className="text-zinc-700 dark:text-zinc-300">{completeness}%</strong> 충족</span>
              {s.per <= 0 ? <span className="text-rose-600 dark:text-rose-400 font-medium">적자·밸류 점수 제한</span> : null}
              {dataWarnings.length > 0 ? (
                <>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">값 검증 중</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">임시 점수 · 순위 참고용</span>
                </>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">값 검증 완료</span>
              )}
            </div>
            {(reason.strengths.length > 0 || reason.cautions.length > 0) ? (
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[11px]">
                {reason.strengths.length > 0 ? <span className="text-emerald-700 dark:text-emerald-400 font-medium">✓ 강점 {reason.strengths.map((x) => x.metric).join("·")}</span> : null}
                {reason.cautions.length > 0 ? <span className="text-amber-700 dark:text-amber-400 font-medium">⚠ 주의 {reason.cautions.map((x) => x.metric).join("·")}</span> : null}
              </div>
            ) : null}
          </div>
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">실험 지표 · 매수·매도 추천이 아닌 탐색 우선순위입니다.</p>
      </section>

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
          { label: "위험대비", kind: "vol", topPct: topPctOf(s.vol, "vol"), rank: rankOf(s.vol, "vol"), total: poolN, raw: s.vol },
        ]} />
      </section>

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
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">같은 업종 {sectorValue.peers}개 중 PER·PBR 상대 위치 (전체 풀 밸류 {Math.round(s.value)}점과 비교){sectorValue.peers < 10 ? " · ⚠ 표본 작아 신뢰도 낮음" : ""}</div>
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
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">같은 업종 {sectorCount}곳 중 종합점수 상위 {Math.min(6, sectorCount)}곳. 종합점수는 탐색 우선순위용 실험 지표입니다.</p>
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
          { l: "PER", v: s.per > 0 ? s.per.toFixed(1) + "배" : "—" },
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
          종합 <strong className="tabular-nums">{composite}점</strong> = 추세·거래활성도·밸류·위험대비 4지표의 평균입니다. 각 지표 계산식은 <Link href="/guide/metrics" className="text-blue-700 dark:text-blue-400 underline">지표 가이드</Link>에서 볼 수 있어요. 매수·매도 추천이 아닌 탐색 우선순위입니다.
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
