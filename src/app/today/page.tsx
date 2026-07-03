import { realStockPool, dataMetadata, formatBizDateLong, isDataStale } from "@/lib/realStocks";
import { getRecentSignals } from "@/lib/recentSignals";
import { getScoreChangesBatch, getMetricChangesBatch } from "@/lib/scoreHistory";
import { getLatestStoredInsight } from "@/lib/ai-insight";
import { isSuspect } from "@/lib/dataQuality";
import { compositeOf } from "@/lib/score";
import { sectorOf } from "@/lib/sector";
import { fmtWon } from "@/lib/format";
import { volumeSpikeCount, VOLUME_SPIKE_RATIO, VOLUME_SPIKE_FLOW } from "@/lib/homeSnapshot";
import { TodayContent } from "@/components/today/TodayContent";
import type {
  TodayStockRaw,
  TodayTopRaw,
  TodayDisclosureRaw,
  TodayChangeChip,
  TodayRankChip,
  TodayBigMoverChip,
} from "@/components/today/TodayContent";

interface SignalDisclosure {
  corp_name: string;
  stock_code: string;
  report_nm: string;
  rcept_no: string;
  rcept_dt: string;
  url: string;
}
interface Signal {
  signalType: string;
  signalLabel: string;
  strength: number;
  disclosure: SignalDisclosure;
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** External SSR data calls must never block render. Race each against a short
 *  timeout and fall back to empty so /today renders fast even if Supabase/DART
 *  is slow or unreachable (page degrades gracefully on empty data). */
async function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

const todayDescription =
  "오늘 자체 지표 상위·변동 종목과 DART 공시 신호를 한 화면에서 살펴보세요.";

export const metadata = {
  title: "오늘 — 오른스코어",
  description: todayDescription,
  openGraph: {
    title: "오늘 — 오른스코어",
    description: todayDescription,
    url: "/today",
    siteName: "오른스코어",
    locale: "ko_KR",
    type: "website",
    // 페이지별 openGraph 정의 시 루트 opengraph-image 상속이 끊기므로 공용 공유 카드를 유지.
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "오늘 — 오른스코어",
    description: todayDescription,
  },
  alternates: { canonical: "/today" },
};

export const revalidate = 3600;

export default async function TodayPage() {
  const kstDay = new Date(Date.now() + 9 * 3600 * 1000).getUTCDay(); // 0=일,6=토
  const isClosed = kstDay === 0 || kstDay === 6;
  const dataAsOf = formatBizDateLong(dataMetadata.asOfBusinessDate);
  const dataStale = isDataStale(dataMetadata.asOfBusinessDate);

  const validStocks = realStockPool.filter((s) => s.compositeScore !== undefined);
  const compositeSorted = [...validStocks].filter((s) => !isSuspect(s)).sort((a, b) => compositeOf(b) - compositeOf(a));
  const top3 = compositeSorted.slice(0, 3);
  const compositeRest = compositeSorted.slice(3, 9);
  const topValue = [...validStocks].filter((s) => !isSuspect(s) && s.value > 0 && s.per > 0).sort((a, b) => b.value - a.value).slice(0, 6);
  const topMomentum = [...validStocks].filter((s) => !isSuspect(s) && s.momentum > 0 && s.returns).sort((a, b) => b.momentum - a.momentum).slice(0, 6);
  const volumeSpikeStocks = [...validStocks]
    .filter((s) => {
      if (isSuspect(s)) return false;
      const r = s.flowStats?.ratio;
      if (typeof r === "number" && Number.isFinite(r)) return r >= VOLUME_SPIKE_RATIO;
      return s.flow >= VOLUME_SPIKE_FLOW;
    })
    .sort((a, b) => b.flow - a.flow)
    .slice(0, 6);
  const overheated = [...validStocks]
    .filter((s) => !isSuspect(s) && (s.returns?.r3m ?? 0) >= 80)
    .sort((a, b) => (b.returns?.r3m ?? 0) - (a.returns?.r3m ?? 0))
    .slice(0, 6);

  const validPers = realStockPool.filter((s) => s.per > 0 && s.per < 150).map((s) => s.per);
  const medianPer = median(validPers);
  const validPbrs = realStockPool.filter((s) => s.pbr > 0 && s.pbr < 30).map((s) => s.pbr);
  const medianPbr = median(validPbrs);

  // 오늘의 브리핑 통계 (스냅샷 기반)
  const upCount = realStockPool.filter((s) => s.changePct > 0).length;
  const downCount = realStockPool.filter((s) => s.changePct < 0).length;
  const flatCount = realStockPool.length - upCount - downCount;
  const strongCount = realStockPool.filter((s) => compositeOf(s) >= 80 && !isSuspect(s)).length;
  const flowSurgeCount = realStockPool.filter((s) => s.flow >= 70).length;
  const spikeCount = volumeSpikeCount(realStockPool);
  const breadthPct = realStockPool.length ? Math.round((upCount / realStockPool.length) * 100) : 0;

  // 외부 데이터(Supabase/DART)는 4초 타임아웃 + 병렬 — 느리거나 실패해도 빈 값으로 폴백
  const tickers = realStockPool.map((s) => s.ticker);
  const [recentSig, scoreDeltas, metricChanges, aiInsight] = await Promise.all([
    withTimeout(getRecentSignals(7), 4000, { days: 7, totalDisclosures: 0, signalCount: 0, signals: [] } as Awaited<ReturnType<typeof getRecentSignals>>),
    withTimeout(getScoreChangesBatch(tickers), 4000, {} as Record<string, number>),
    withTimeout(getMetricChangesBatch(tickers), 4000, {} as Awaited<ReturnType<typeof getMetricChangesBatch>>),
    withTimeout(getLatestStoredInsight(), 4000, null as Awaited<ReturnType<typeof getLatestStoredInsight>>),
  ]);
  const signalCount = recentSig.signalCount ?? (recentSig.signals?.length ?? 0);
  const briefingSignalCount = (recentSig.signals ?? []).length;
  const universeTickers = new Set(realStockPool.map((x) => x.ticker));

  // ── 신호별 섹션용 원시 데이터 빌더(현지화는 클라이언트에서) ──
  const toRaw = (s: (typeof validStocks)[number]): TodayStockRaw => ({
    name: s.name,
    ticker: s.ticker,
    sector: sectorOf(s.themes),
    priceLabel: fmtWon(s.currentPrice),
    changePct: s.changePct,
    score: Math.round(compositeOf(s)),
    momentum: s.momentum,
    flow: s.flow,
    value: s.value,
    vol: s.vol,
    per: s.per,
    pbr: s.pbr,
    roe: s.roe,
    returns: s.returns,
  });

  // ── 오늘의 Top 3 후보(카드 표시값 + note 빌더용 원시값) ──
  const top3Raw: TodayTopRaw[] = top3.map((s, i) => {
    const r3m = typeof s.returns?.r3m === "number" ? s.returns.r3m : null;
    return {
      rank: i + 1,
      name: s.name,
      ticker: s.ticker,
      sector: sectorOf(s.themes),
      priceLabel: fmtWon(s.currentPrice),
      changePct: s.changePct,
      r3m,
      score: Math.round(compositeOf(s)),
      m: {
        momentum: Math.round(s.momentum),
        flow: Math.round(s.flow),
        value: Math.round(s.value),
        vol: Math.round(s.vol),
      },
      value: s.value,
      vol: s.vol,
    };
  });

  const compositeData = compositeRest.map(toRaw);
  const volumeData = volumeSpikeStocks.map(toRaw);
  const valueData = topValue.map(toRaw);
  const momentumData = topMomentum.map(toRaw);
  const overheatedData = overheated.map(toRaw);

  // 최근 공시 있음 — 분석 대상(universe) 종목 중 최근 공시 신호가 잡힌 종목
  const allSignals = (recentSig.signals as unknown as Signal[]) ?? [];
  const stockByTicker = new Map(realStockPool.map((s) => [s.ticker, s]));
  const disclosureByStock = new Map<string, Signal>();
  for (const sig of allSignals) {
    const code = sig.disclosure?.stock_code;
    if (!code || !universeTickers.has(code)) continue;
    const cur = disclosureByStock.get(code);
    if (!cur || sig.strength > cur.strength) disclosureByStock.set(code, sig);
  }
  const disclosureData: TodayDisclosureRaw[] = Array.from(disclosureByStock.values())
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 6)
    .map((sig) => {
      const st = stockByTicker.get(sig.disclosure.stock_code);
      if (!st) return null;
      return { raw: toRaw(st), signalLabel: sig.signalLabel };
    })
    .filter((x): x is TodayDisclosureRaw => x !== null);

  // ── 최근 장마감 변화(전일 대비) 계산 ──
  const hasDeltas = Object.keys(scoreDeltas).length > 0;
  const newEntrants: TodayChangeChip[] = hasDeltas
    ? realStockPool
        .filter((s) => compositeOf(s) >= 80 && scoreDeltas[s.ticker] !== undefined && compositeOf(s) - scoreDeltas[s.ticker] < 80)
        .sort((a, b) => (scoreDeltas[b.ticker] || 0) - (scoreDeltas[a.ticker] || 0))
        .slice(0, 6)
        .map((s) => ({ name: s.name, ticker: s.ticker, composite: Math.round(compositeOf(s)), delta: scoreDeltas[s.ticker] }))
    : [];
  const dropouts: TodayChangeChip[] = hasDeltas
    ? realStockPool
        .filter((s) => compositeOf(s) < 80 && scoreDeltas[s.ticker] !== undefined && compositeOf(s) - scoreDeltas[s.ticker] >= 80)
        .sort((a, b) => (scoreDeltas[a.ticker] || 0) - (scoreDeltas[b.ticker] || 0))
        .slice(0, 6)
        .map((s) => ({ name: s.name, ticker: s.ticker, composite: Math.round(compositeOf(s)), delta: scoreDeltas[s.ticker] }))
    : [];
  const bigMovers: TodayBigMoverChip[] = hasDeltas
    ? realStockPool
        .filter((s) => Math.abs(scoreDeltas[s.ticker] ?? 0) >= 8)
        .sort((a, b) => Math.abs(scoreDeltas[b.ticker]) - Math.abs(scoreDeltas[a.ticker]))
        .slice(0, 6)
        .map((s) => {
          const mc = metricChanges[s.ticker];
          return {
            name: s.name,
            ticker: s.ticker,
            delta: scoreDeltas[s.ticker],
            metricChange: mc ? { momentum: mc.momentum, flow: mc.flow, value: mc.value, vol: mc.vol } : undefined,
          };
        })
    : [];
  const todayComp: Record<string, number> = {};
  const yesterComp: Record<string, number> = {};
  for (const s of realStockPool) {
    const t = Math.round(compositeOf(s));
    todayComp[s.ticker] = t;
    yesterComp[s.ticker] = t - Math.round(scoreDeltas[s.ticker] ?? 0);
  }
  const rankIn = (map: Record<string, number>, val: number) =>
    realStockPool.filter((p) => map[p.ticker] > val).length + 1;
  const rankRisers: TodayRankChip[] = hasDeltas
    ? realStockPool
        .map((s) => ({ s, change: rankIn(yesterComp, yesterComp[s.ticker]) - rankIn(todayComp, todayComp[s.ticker]) }))
        .filter((x) => x.change >= 5)
        .sort((a, b) => b.change - a.change)
        .slice(0, 6)
        .map(({ s, change }) => ({ name: s.name, ticker: s.ticker, change }))
    : [];

  return (
    <TodayContent
      isClosed={isClosed}
      dataAsOf={dataAsOf}
      dataStale={dataStale}
      totalCount={dataMetadata.count}
      strongCount={strongCount}
      spikeCount={spikeCount}
      signalCount={signalCount}
      top3={top3Raw}
      composite={compositeData}
      volume={volumeData}
      value={valueData}
      momentum={momentumData}
      overheated={overheatedData}
      disclosure={disclosureData}
      medianPer={medianPer}
      medianPbr={medianPbr}
      upCount={upCount}
      downCount={downCount}
      flatCount={flatCount}
      flowSurgeCount={flowSurgeCount}
      briefingSignalCount={briefingSignalCount}
      breadthPct={breadthPct}
      aiInsight={
        aiInsight
          ? {
              headline: aiInsight.insight.headline,
              summary: aiInsight.insight.summary,
              watchPoints: aiInsight.insight.watchPoints ?? [],
              dateKst: aiInsight.dateKst,
            }
          : null
      }
      hasDeltas={hasDeltas}
      newEntrants={newEntrants}
      dropouts={dropouts}
      rankRisers={rankRisers}
      bigMovers={bigMovers}
    />
  );
}
