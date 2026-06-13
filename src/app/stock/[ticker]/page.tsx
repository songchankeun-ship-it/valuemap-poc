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
import { getScoreHistory } from "@/lib/scoreHistory";
import { StockPriceChart } from "@/components/StockPriceChart";
import { getPriceHistory } from "@/lib/priceHistory";
import { ScoreTooltip } from "@/components/ScoreTooltip";
import { BeginnerReading } from "@/components/BeginnerReading";
import { getDataWarnings, dataCompleteness } from "@/lib/dataQuality";
import { gradeOf } from "@/lib/grade";
import { sectorValueScore } from "@/lib/sector";
import { realStockPool } from "@/lib/realStocks";

export const revalidate = 3600;

interface PageProps { params: Promise<{ ticker: string }>; }

export async function generateMetadata({ params }: PageProps) {
  const { ticker } = await params;
  const s = getStockByTicker(ticker);
  if (!s) return { title: "종목을 찾을 수 없습니다" };
  const composite = Math.round((s.momentum + s.flow + s.value + s.vol) / 4);
  const title = `${s.name} (${ticker}) 분석 — 밸류맵`;
  const description = `${s.name} 종합 점수 ${composite}/100 — 모멘텀 ${Math.round(s.momentum)} · 거래활성도 ${Math.round(s.flow)} · 밸류 ${Math.round(s.value)} · 변동성조정 ${Math.round(s.vol)}. PER ${s.per.toFixed(1)} · PBR ${s.pbr.toFixed(2)}.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://valuemap.kr/stock/${ticker}`,
      siteName: "밸류맵",
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
    { metric: "모멘텀", score: m },
    { metric: "거래활성도", score: f },
    { metric: "밸류", score: v },
    { metric: "변동성조정", score: vo },
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
  const composite = Math.round((s.momentum + s.flow + s.value + s.vol) / 4);
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
  const grade = gradeOf(composite);
  const completeness = dataCompleteness(s, priceHistory);
  const sectorValue = sectorValueScore(s, realStockPool);

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
          name: "밸류맵",
          url: "https://valuemap.kr",
        },
        publisher: {
          "@type": "Organization",
          name: "밸류맵",
          url: "https://valuemap.kr",
        },
        datePublished: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        mainEntityOfPage: `https://valuemap.kr/stock/${ticker}`,
        about: {
          "@type": "Thing",
          name: `${s.name} (${ticker})`,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: "https://valuemap.kr" },
          { "@type": "ListItem", position: 2, name: "종목 탐색", item: "https://valuemap.kr/stocks" },
          { "@type": "ListItem", position: 3, name: `${s.name}`, item: `https://valuemap.kr/stock/${ticker}` },
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
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums">{priceAsOf} 종가</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AddToWatchlistButton ticker={s.ticker} name={s.name} />
          <AddToCompareButton ticker={s.ticker} name={s.name} />
          <ShareButton name={s.name} ticker={s.ticker} />
        </div>
      </header>

      {/* 주가 차트 (가격 데이터 있을 때만) */}
      {priceHistory && priceHistory.points.length >= 2 ? (
        <StockPriceChart ticker={s.ticker} name={s.name} points={priceHistory.points} />
      ) : null}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { l: "PER", v: s.per.toFixed(1) + "x" },
          { l: "PBR", v: s.pbr.toFixed(2) + "x" },
          { l: "ROE", v: s.roe.toFixed(1) + "%" },
          { l: "배당수익률", v: s.dividendYield.toFixed(2) + "%" },
        ].map((m) => (
          <div key={m.l} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2.5 md:p-3">
            <div className="text-[10px] md:text-[11px] text-zinc-500 dark:text-zinc-400 mb-0.5">{m.l}</div>
            <div className="text-base md:text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{m.v}</div>
          </div>
        ))}
      </section>

      {/* 자체 지표 4종 (시각 차트) */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">자체 지표 4종</div>
          <Link href="/guide/metrics" className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">지표 가이드 →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {([
            { l: "모멘텀", sc: s.momentum, c: "bg-blue-500", kind: "momentum" as const },
            { l: "거래활성도", sc: s.flow, c: "bg-emerald-500", kind: "flow" as const },
            { l: "밸류", sc: s.value, c: "bg-cyan-500", kind: "value" as const },
            { l: "변동성조정", sc: s.vol, c: "bg-orange-500", kind: "vol" as const },
          ]).map((x) => (
            <div key={x.l} className="-mx-1 px-1 py-1 rounded">
              <div className="text-[11px] md:text-xs text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <span>{x.l}</span>
                <ScoreTooltip kind={x.kind} />
              </div>
              <div className="text-base md:text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{x.sc.toFixed(0)}</div>
              <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-1">
                <div className={"h-full " + x.c} style={{ width: x.sc + "%" }} />
              </div>
            </div>
          ))}
        </div>
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

      {/* 왜 이 점수? — 강조 카드 (피드백 반영) */}
      <section className={"rounded-lg border-2 " + tone.border + " " + tone.bg + " p-4 md:p-5"}>
        <div className="flex items-start gap-4">
          {/* 큰 점수 */}
          <div className={"shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full ring-4 " + tone.ring + " bg-white dark:bg-zinc-900 flex flex-col items-center justify-center"}>
            <div className={"text-2xl md:text-3xl font-bold tabular-nums " + tone.text}>{composite}</div>
            <div className="text-[9px] text-zinc-500 dark:text-zinc-400">/100</div>
            <div className={"text-[11px] md:text-xs font-bold leading-none mt-0.5 " + tone.text}>{grade.grade}{dataWarnings.length > 0 ? " ⚠" : ""}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2 mb-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <strong className="text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100">왜 {composite}점인가요?</strong>
                <ScoreTooltip kind="composite" size="md" />
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider shrink-0">탐색 우선순위 · <span className="text-amber-600 dark:text-amber-400">실험</span>{dataWarnings.length > 0 ? <span className="text-amber-600 dark:text-amber-400"> · 검증 보류</span> : null}</span>
            </div>
            <div className="space-y-1.5">
              {reason.strengths.length > 0 ? (
                <div className="text-xs md:text-sm text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">✓ 강점</span>
                  <span className="tabular-nums">{reason.strengths.map(s => s.metric + " " + s.score).join(", ")}</span>
                </div>
              ) : null}
              {reason.cautions.length > 0 ? (
                <div className="text-xs md:text-sm text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
                  <span className="font-semibold text-amber-700 dark:text-amber-400 shrink-0">⚠ 주의</span>
                  <span className="tabular-nums">{reason.cautions.map(c => c.metric + " " + c.score).join(", ")}</span>
                </div>
              ) : null}
              <div className="text-xs md:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed pt-1.5 mt-1.5 border-t border-zinc-200/70 dark:border-zinc-700/70">
                <strong className="text-zinc-900 dark:text-zinc-100">요약:</strong> {reason.interpretation}
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 italic">
                * 실험 지표입니다 — 과거 성과(백테스트) 검증이 진행 중이라 점수는 참고용이며, 매수·매도 추천이 아닌 데이터 기반 탐색 우선순위입니다. <span className="not-italic font-medium">데이터 완성도 {completeness}%.</span>
              </p>
            </div>
          </div>
        </div>
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

      {scoreHistory.length > 0 ? (
        <section><ScoreHistoryChart history={scoreHistory} /></section>
      ) : null}

      <section><AiAnalysisCard ticker={s.ticker} name={s.name} /></section>
      <section><StockDisclosures ticker={s.ticker} /></section>
    </div>
  );
}
