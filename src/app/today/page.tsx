import Link from "next/link";
import { realStockPool, dataMetadata, formatBizDateLong, isDataStale } from "@/lib/realStocks";
import { getRecentSignals } from "@/lib/recentSignals";
import { getScoreChangesBatch, getMetricChangesBatch } from "@/lib/scoreHistory";
import { getLatestStoredInsight } from "@/lib/ai-insight";
import { isSuspect } from "@/lib/dataQuality";
import { compositeOf } from "@/lib/score";
import { sectorOf } from "@/lib/sector";
import { fmtWon } from "@/lib/format";
import { volumeSpikeCount, VOLUME_SPIKE_RATIO, VOLUME_SPIKE_FLOW } from "@/lib/homeSnapshot";
import { TodayStatusBar } from "@/components/today/TodayStatusBar";
import { MarketSnapshotCards } from "@/components/home/MarketSnapshotCards";
import { TodayTopSection } from "@/components/today/TodayTopSection";
import type { StockCandidate } from "@/components/home/StockCandidateCard";
import { SignalSection } from "@/components/today/SignalSection";
import type { SignalStockVM } from "@/components/today/SignalStockCard";

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

function formatDateKST(): string {
  const now = new Date();
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  }).format(now);
}

/** 4지표 중 강한 것 위주 한 줄 — 종합 상위 섹션 신호 문구. */
function compositeReason(s: { momentum: number; flow: number; value: number; vol: number }): string {
  const items = [
    { label: "추세", v: s.momentum },
    { label: "거래활성도", v: s.flow },
    { label: "밸류", v: s.value },
    { label: "위험조정", v: s.vol },
  ];
  const strong = items.filter((x) => x.v >= 70).sort((a, b) => b.v - a.v);
  if (strong.length >= 2) {
    return `${strong[0].label} ${Math.round(strong[0].v)} + ${strong[1].label} ${Math.round(strong[1].v)} 강세`;
  }
  if (strong.length === 1) {
    return `${strong[0].label} ${Math.round(strong[0].v)} 단독 강세`;
  }
  const top = [...items].sort((a, b) => b.v - a.v)[0];
  return `${top.label} ${Math.round(top.v)} (네 지표 모두 중립권)`;
}

/** Value 섹션 — PER/PBR/ROE 조합 한 줄. */
function valueReason(s: { per: number; pbr: number; roe: number }, medianPer: number, medianPbr: number): string {
  const tags: string[] = [];
  if (medianPer > 0 && s.per > 0 && s.per < medianPer * 0.6) tags.push("저PER");
  if (medianPbr > 0 && s.pbr > 0 && s.pbr < medianPbr * 0.6) tags.push("저PBR");
  if (s.roe >= 10) tags.push("ROE " + s.roe.toFixed(0) + "%");
  if (tags.length === 0) {
    return `PER ${s.per.toFixed(1)} · PBR ${s.pbr.toFixed(2)}`;
  }
  return tags.join(" + ");
}

/** Momentum 섹션 — 1·3·6개월 수익률 조합 한 줄. */
function momentumReason(returns?: { r1m?: number; r3m?: number; r6m?: number }): string {
  const r1 = returns?.r1m;
  const r3 = returns?.r3m;
  const r6 = returns?.r6m;
  if (r1 !== undefined && r3 !== undefined && r6 !== undefined) {
    const allUp = r1 > 0 && r3 > 0 && r6 > 0;
    if (allUp) return `1·3·6개월 모두 상승 (6M ${r6 >= 0 ? "+" : ""}${r6.toFixed(0)}%)`;
    if (r1 > 0 && r1 > r3) return `최근 1개월 급반등 (+${r1.toFixed(0)}%)`;
  }
  if (r6 !== undefined) return `6개월 ${r6 >= 0 ? "+" : ""}${r6.toFixed(0)}% 흐름`;
  return "최근 가격 흐름 강함";
}

// 4지표 중 강한 2개를 "라벨 점수" 칩으로 — 강점 근거를 함께 표시(홈과 동일 규칙).
function strongMetrics(s: { momentum: number; flow: number; value: number; vol: number }): string[] {
  const items = [
    { label: "추세", v: s.momentum },
    { label: "거래활성도", v: s.flow },
    { label: "밸류", v: s.value },
    { label: "위험조정", v: s.vol },
  ];
  return items
    .sort((a, b) => b.v - a.v)
    .slice(0, 2)
    .map((x) => x.label + " " + Math.round(x.v));
}

// 탐색 언어 기반 주의 문구 — '추천'이 아니라 '확인 필요'를 안내(홈과 동일).
function riskNote(s: { value: number; vol: number }, r3m: number | null): string {
  if (r3m !== null && r3m >= 80) return "최근 상승폭이 커서 진입 전 급등 사유 확인 필요";
  if (s.vol < 45) return "변동성이 큰 편이라 진입 시점과 비중 분할 검토 필요";
  if (s.value < 40) return "밸류 지표가 낮아 고평가 여부 원문 재무 확인 필요";
  return "점수 근거가 된 지표와 원문 공시·재무를 함께 확인 필요";
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

export const metadata = {
  title: "오늘 — 오른스코어",
  description: "오늘 자체 알고리즘이 발견한 종목들",
};

export const revalidate = 3600;

export default async function TodayPage() {
  const today = formatDateKST();
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

  // ── 오늘의 Top 3 후보 카드 뷰모델 (홈 StockCandidateCard 재사용) ──
  const top3Candidates: StockCandidate[] = top3.map((s, i) => {
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
      metrics: strongMetrics(s),
      m: {
        momentum: Math.round(s.momentum),
        flow: Math.round(s.flow),
        value: Math.round(s.value),
        vol: Math.round(s.vol),
      },
      riskNote: riskNote(s, r3m),
      highReturn: r3m !== null && r3m >= 80,
    };
  });

  // ── 신호별 섹션 뷰모델 빌더 ──
  const toVM = (s: (typeof validStocks)[number], note: string, caution = false): SignalStockVM => ({
    name: s.name,
    ticker: s.ticker,
    sector: sectorOf(s.themes),
    priceLabel: fmtWon(s.currentPrice),
    changePct: s.changePct,
    score: Math.round(compositeOf(s)),
    note,
    caution,
  });

  const compositeVMs = compositeRest.map((s) => toVM(s, compositeReason(s)));
  const volumeVMs = volumeSpikeStocks.map((s) => toVM(s, `거래활성도 ${Math.round(s.flow)} · 거래 관심 증가`));
  const valueVMs = topValue.map((s) => toVM(s, valueReason(s, medianPer, medianPbr)));
  const momentumVMs = topMomentum.map((s) => toVM(s, momentumReason(s.returns)));
  const overheatedVMs = overheated.map((s) =>
    toVM(s, `최근 3개월 +${Math.round(s.returns?.r3m ?? 0)}% · 단기 과열 여부 확인 필요`, true),
  );

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
  const disclosureVMs: SignalStockVM[] = Array.from(disclosureByStock.values())
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 6)
    .map((sig) => {
      const st = stockByTicker.get(sig.disclosure.stock_code);
      if (!st) return null;
      return toVM(st, `${sig.signalLabel} · 공시 원문 확인 권장`);
    })
    .filter((x): x is SignalStockVM => x !== null);

  // ── 최근 장마감 변화(전일 대비) 계산 ──
  const hasDeltas = Object.keys(scoreDeltas).length > 0;
  const newEntrants = hasDeltas
    ? realStockPool
        .filter((s) => compositeOf(s) >= 80 && scoreDeltas[s.ticker] !== undefined && compositeOf(s) - scoreDeltas[s.ticker] < 80)
        .sort((a, b) => (scoreDeltas[b.ticker] || 0) - (scoreDeltas[a.ticker] || 0))
        .slice(0, 6)
    : [];
  const bigMovers = hasDeltas
    ? realStockPool
        .filter((s) => Math.abs(scoreDeltas[s.ticker] ?? 0) >= 8)
        .sort((a, b) => Math.abs(scoreDeltas[b.ticker]) - Math.abs(scoreDeltas[a.ticker]))
        .slice(0, 6)
    : [];
  const dropouts = hasDeltas
    ? realStockPool
        .filter((s) => compositeOf(s) < 80 && scoreDeltas[s.ticker] !== undefined && compositeOf(s) - scoreDeltas[s.ticker] >= 80)
        .sort((a, b) => (scoreDeltas[a.ticker] || 0) - (scoreDeltas[b.ticker] || 0))
        .slice(0, 6)
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
  const rankRisers = hasDeltas
    ? realStockPool
        .map((s) => ({ s, change: rankIn(yesterComp, yesterComp[s.ticker]) - rankIn(todayComp, todayComp[s.ticker]) }))
        .filter((x) => x.change >= 5)
        .sort((a, b) => b.change - a.change)
        .slice(0, 6)
    : [];

  return (
    <div className="space-y-5 md:space-y-7">
      <header className="border-b border-zinc-200 dark:border-zinc-800 pb-3 md:pb-4">
        <div className="text-[10px] md:text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">오늘</div>
        <h1 className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{today}</h1>
        <p className="text-[11px] md:text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 md:mt-2">
          오늘 먼저 살펴볼 종목과 신호를 점수로 정리한 탐색 대시보드입니다.
        </p>
        {isClosed ? (
          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1.5">오늘은 휴장일입니다 — 가장 최근 거래일 <strong className="tabular-nums">{dataAsOf}</strong> 장마감 데이터를 보여드립니다.</p>
        ) : null}
        {dataStale ? (
          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1.5">자동 갱신이 지연되어 <strong>마지막 정상 데이터</strong>를 보여드립니다 — 최신이 아닐 수 있어요.</p>
        ) : null}
      </header>

      {/* 1. 데이터 상태 바 (페이지 최상단 — 설계서 §16.4) */}
      <TodayStatusBar />

      {/* 2. 시장 요약 KPI 카드 4개 (홈 스냅샷 카드 재사용 — 시각 톤 통일) */}
      <MarketSnapshotCards
        totalCount={dataMetadata.count}
        strongCount={strongCount}
        volumeSpikeCount={spikeCount}
        signalCount={signalCount}
      />

      {/* 3. 오늘의 Top 3 큰 카드 */}
      <TodayTopSection candidates={top3Candidates} />

      {/* 4. 신호별 종목 섹션 */}
      <section className="space-y-5 md:space-y-6">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">신호별 종목</h2>
          <Link prefetch={false} href="/stocks" className="text-[12px] font-medium text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap">
            전체 탐색 →
          </Link>
        </div>

        <SignalSection
          title="종합 점수 상위"
          caption="여러 지표에서 강점이 확인된 후보 (Top 3 다음 순위)"
          items={compositeVMs}
          footnote="점수는 같은 분석 풀 안의 상대 위치이며 미래 수익률을 의미하지 않습니다."
        />
        <SignalSection
          title="거래활성도 급증"
          caption="평소보다 거래대금·관심이 늘어난 종목 (파생 추정)"
          items={volumeVMs}
          footnote="거래 관심 증가는 단기 테마성일 수 있어 지속성은 원문·차트로 확인하세요."
        />
        <SignalSection
          title="밸류 매력"
          caption="같은 풀에서 PER·PBR이 낮은 편 — 이유 있는 저평가일 수 있음"
          items={valueVMs}
          footnote="싸 보이는 데는 이유가 있을 수 있으니 실적·재무를 함께 확인하세요."
        />
        <SignalSection
          title="추세 강함"
          caption="최근 1·3·6개월 가격 흐름이 상대적으로 강한 종목"
          items={momentumVMs}
          footnote="단기 급등 후 변동성이 커질 수 있어 고점 추격 위험을 함께 확인하세요."
        />
        <SignalSection
          title="과열 주의"
          caption="최근 단기 상승폭이 큰 종목 — 진입 전 급등 사유 확인 필요"
          items={overheatedVMs}
          footnote="상승폭이 크다고 매수 신호가 아니며, 급등 사유와 차익실현 위험을 살펴보세요."
        />
        <SignalSection
          title="최근 공시 있음"
          caption="최근 DART 공시 신호가 분류된 분석 대상 종목"
          items={disclosureVMs}
          footnote="공시 분류는 호재/악재 판단이 아니라 확인할 신호이며, 실제 영향은 원문에서 확인하세요."
        />
      </section>

      {/* 오늘의 브리핑 (보조 레이어) */}
      <section className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-3 md:p-4">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className="text-sm">📋</span>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">오늘의 브리핑</h2>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 tabular-nums">{dataAsOf} 기준</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-white/70 dark:bg-zinc-900/50 rounded-md p-2">
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">최근 거래일 등락 ({realStockPool.length}종목)</div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">상승 {upCount} <span className="text-[10px] font-normal text-zinc-400">/ 하락 {downCount} / 보합 {flatCount}</span></div>
          </div>
          <div className="bg-white/70 dark:bg-zinc-900/50 rounded-md p-2">
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">종합 80+ 종목</div>
            <div className="text-sm font-bold text-blue-700 dark:text-blue-400 tabular-nums">{strongCount}개</div>
          </div>
          <div className="bg-white/70 dark:bg-zinc-900/50 rounded-md p-2">
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">거래활성도 급증</div>
            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{flowSurgeCount}개</div>
          </div>
          <div className="bg-white/70 dark:bg-zinc-900/50 rounded-md p-2">
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">공시 신호</div>
            <div className="text-sm font-bold text-amber-700 dark:text-amber-400 tabular-nums">{briefingSignalCount}건</div>
          </div>
        </div>
        {aiInsight ? (
          <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-900/50">
            <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">{aiInsight.insight.headline}</div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{aiInsight.insight.summary}</p>
            {aiInsight.insight.watchPoints && aiInsight.insight.watchPoints.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {aiInsight.insight.watchPoints.map((w, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/70 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400">👁 {w}</span>
                ))}
              </div>
            ) : null}
            <div className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1">AI 테마 요약 · {aiInsight.dateKst} · 투자 추천 아님</div>
          </div>
        ) : null}
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">최근 거래일 상승 비율 {breadthPct}% · 영업일 장마감 후 갱신.</p>
      </section>

      {hasDeltas && (newEntrants.length > 0 || dropouts.length > 0 || rankRisers.length > 0 || bigMovers.length > 0) ? (
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-sm">🔔</span>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">최근 장마감 변화</h2>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">전 거래일 대비</span>
          </div>
          {newEntrants.length > 0 ? (
            <div className="mb-3">
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">🆕 오늘 종합 80+ 신규 진입</div>
              <div className="flex flex-wrap gap-1.5">
                {newEntrants.map((s) => (
                  <Link key={s.ticker} prefetch={false} href={"/stock/" + s.ticker} className="text-xs px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:border-emerald-400 transition">
                    {s.name} <span className="tabular-nums">{Math.round(compositeOf(s))} (▲{Math.round(scoreDeltas[s.ticker])})</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {dropouts.length > 0 ? (
            <div className="mb-3">
              <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 mb-1.5">↘ 오늘 종합 80+ 이탈</div>
              <div className="flex flex-wrap gap-1.5">
                {dropouts.map((s) => (
                  <Link key={s.ticker} prefetch={false} href={"/stock/" + s.ticker} className="text-xs px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:border-blue-400 transition">
                    {s.name} <span className="tabular-nums">{Math.round(compositeOf(s))} (▼{Math.abs(Math.round(scoreDeltas[s.ticker]))})</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {rankRisers.length > 0 ? (
            <div className="mb-3">
              <div className="text-[11px] font-semibold text-red-700 dark:text-red-400 mb-1.5">↑ 전일 대비 순위 상승 (5단계+)</div>
              <div className="flex flex-wrap gap-1.5">
                {rankRisers.map(({ s, change }) => (
                  <Link key={s.ticker} prefetch={false} href={"/stock/" + s.ticker} className="text-xs px-2.5 py-1 rounded-full border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:border-red-400 transition">
                    {s.name} <span className="tabular-nums">▲{change}단계</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {bigMovers.length > 0 ? (
            <div>
              <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">📊 점수 급변 종목</div>
              <div className="flex flex-wrap gap-1.5">
                {bigMovers.map((s) => {
                  const d = scoreDeltas[s.ticker];
                  const up = d >= 0;
                  const mc = metricChanges[s.ticker];
                  const fmtd = (v: number) => (v >= 0 ? "+" : "") + Math.round(v);
                  const cause = mc ? `추세 ${fmtd(mc.momentum)} · 거래활성도 ${fmtd(mc.flow)} · 밸류 ${fmtd(mc.value)} · 위험조정 ${fmtd(mc.vol)}` : undefined;
                  return (
                    <Link key={s.ticker} prefetch={false} href={"/stock/" + s.ticker} title={cause} className={"text-xs px-2.5 py-1 rounded-full border transition " + (up ? "border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900" : "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900")}>
                      {s.name} <span className="tabular-nums">{up ? "▲" : "▼"}{Math.abs(Math.round(d))}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-3">관심 종목으로 등록하면 이런 변화를 이메일로 받을 수 있어요 (설정 &gt; 알림).</p>
        </section>
      ) : null}

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-5">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm">✅</span>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">후보를 볼 때 체크리스트</h2>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">아래 후보는 매수 추천이 아니라 직접 확인할 우선순위입니다. 종목을 열기 전에 스스로 점검해 보세요.</p>
        <ul className="space-y-1.5 text-[12px] text-zinc-600 dark:text-zinc-300">
          <li className="flex gap-2"><span className="text-blue-500 dark:text-blue-400 shrink-0 tabular-nums">1.</span><span>종목 상세와 <strong className="text-zinc-800 dark:text-zinc-100">DART 원문 공시</strong>를 직접 확인했나요?</span></li>
          <li className="flex gap-2"><span className="text-blue-500 dark:text-blue-400 shrink-0 tabular-nums">2.</span><span>최근 단기 급등 여부와 <strong className="text-zinc-800 dark:text-zinc-100">고점 추격 위험</strong>을 살펴봤나요?</span></li>
          <li className="flex gap-2"><span className="text-blue-500 dark:text-blue-400 shrink-0 tabular-nums">3.</span><span>저평가(저PER·저PBR)라면 <strong className="text-zinc-800 dark:text-zinc-100">그럴 만한 이유</strong>가 있는지 점검했나요?</span></li>
          <li className="flex gap-2"><span className="text-blue-500 dark:text-blue-400 shrink-0 tabular-nums">4.</span><span>종합점수는 등급이 아니라 <strong className="text-zinc-800 dark:text-zinc-100">탐색 우선순위</strong>일 뿐임을 기억했나요?</span></li>
          <li className="flex gap-2"><span className="text-blue-500 dark:text-blue-400 shrink-0 tabular-nums">5.</span><span>분산과 비중은 <strong className="text-zinc-800 dark:text-zinc-100">스스로</strong> 결정했나요?</span></li>
        </ul>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-3">이 체크리스트는 학습용 안내이며 특정 종목의 매수·매도를 권하지 않습니다.</p>
      </section>

      <section className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed border-t border-zinc-200 dark:border-zinc-800 pt-3">
        본 페이지는 KRX 일별 종가(FinanceDataReader), Naver Finance 재무 지표, DART 공시 실데이터를 기반으로 자동 생성됩니다. 영업일 마감 후 자동 갱신. 본 도구는 투자 추천이 아니라 탐색 우선순위를 제시하는 분석 도구입니다.
      </section>
    </div>
  );
}
