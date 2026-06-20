import Link from "next/link";
import { realStockPool, dataMetadata, formatBizDateLong, isDataStale } from "@/lib/realStocks";
import { getRecentSignals } from "@/lib/recentSignals";
import { ScoreTooltip } from "@/components/ScoreTooltip";
import { getScoreChangesBatch, getMetricChangesBatch } from "@/lib/scoreHistory";
import { getLatestStoredInsight } from "@/lib/ai-insight";
import { isSuspect } from "@/lib/dataQuality";
import { compositeOf } from "@/lib/score";
import { StockTabs } from "@/components/StockTabs";

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

const SIGNAL_TONE: Record<string, string> = {
  treasury_buy: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
  insider_buy: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  correction: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900",
  single_contract: "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900",
  capital_raise: "bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-900",
};

function formatDateKST(): string {
  const now = new Date();
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  }).format(now);
}

/** Composite Top — 4지표 중 강한 것 위주 */
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

/** Value Top — PER/PBR/ROE 조합 한 줄 */
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

/** Momentum Top — 1·3·6개월 수익률 조합 한 줄 */
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

  const validStocks = realStockPool.filter(s => s.compositeScore !== undefined);
  const topComposite = [...validStocks].filter((s) => !isSuspect(s)).sort((a, b) => compositeOf(b) - compositeOf(a)).slice(0, 5);
  const overallRankOf = (x: { momentum: number; flow: number; value: number; vol: number }) =>
    realStockPool.filter((p) => Math.round(compositeOf(p)) > Math.round(compositeOf(x))).length + 1;
  const topValue = [...validStocks].filter(s => !isSuspect(s) && s.value > 0 && s.per > 0).sort((a, b) => b.value - a.value).slice(0, 5);
  const topMomentum = [...validStocks].filter(s => !isSuspect(s) && s.momentum > 0 && s.returns).sort((a, b) => b.momentum - a.momentum).slice(0, 5);

  const validPers = realStockPool.filter(s => s.per > 0 && s.per < 150).map(s => s.per);
  const medianPer = median(validPers);
  const validPbrs = realStockPool.filter(s => s.pbr > 0 && s.pbr < 30).map(s => s.pbr);
  const medianPbr = median(validPbrs);

  // 오늘의 브리핑 통계 (스냅샷 기반)
  const upCount = realStockPool.filter((s) => s.changePct > 0).length;
  const downCount = realStockPool.filter((s) => s.changePct < 0).length;
  const flatCount = realStockPool.length - upCount - downCount;
  const strongCount = realStockPool.filter((s) => compositeOf(s) >= 80).length;
  const flowSurgeCount = realStockPool.filter((s) => s.flow >= 70).length;
  const breadthPct = realStockPool.length ? Math.round((upCount / realStockPool.length) * 100) : 0;
  // 외부 데이터(Supabase/DART)는 4초 타임아웃 + 병렬 — 느리거나 실패해도 빈 값으로 폴백
  const tickers = realStockPool.map((s) => s.ticker);
  const [recentSig, scoreDeltas, metricChanges, aiInsight] = await Promise.all([
    withTimeout(getRecentSignals(7), 4000, { days: 7, totalDisclosures: 0, signalCount: 0, signals: [] } as Awaited<ReturnType<typeof getRecentSignals>>),
    withTimeout(getScoreChangesBatch(tickers), 4000, {} as Record<string, number>),
    withTimeout(getMetricChangesBatch(tickers), 4000, {} as Awaited<ReturnType<typeof getMetricChangesBatch>>),
    withTimeout(getLatestStoredInsight(), 4000, null as Awaited<ReturnType<typeof getLatestStoredInsight>>),
  ]);
  const briefingSignalCount = (recentSig.signals ?? []).length;
  const universeTickers = new Set(realStockPool.map((x) => x.ticker));
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
  // 후보 이탈: 어제 종합 80+ → 오늘 80 미만 (신규 진입의 역)
  const dropouts = hasDeltas
    ? realStockPool
        .filter((s) => compositeOf(s) < 80 && scoreDeltas[s.ticker] !== undefined && compositeOf(s) - scoreDeltas[s.ticker] >= 80)
        .sort((a, b) => (scoreDeltas[a.ticker] || 0) - (scoreDeltas[b.ticker] || 0))
        .slice(0, 6)
    : [];
  // 전일 대비 순위 변화: 어제 점수(=오늘−변화량)로 어제 순위 복원해 비교
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
    <div className="space-y-4 md:space-y-6">
      <header className="border-b border-zinc-200 dark:border-zinc-800 pb-3 md:pb-4">
        <div className="text-[10px] md:text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">오늘</div>
        <h1 className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{today}</h1>
        <p className="text-[11px] md:text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 md:mt-2 flex items-center flex-wrap gap-x-1.5 gap-y-0.5">
          <span className="inline-flex items-center gap-1">
            <span className={"w-1.5 h-1.5 rounded-full " + (dataStale ? "bg-amber-500" : "bg-green-500")} />
            <span>데이터 기준 <strong className="text-zinc-700 dark:text-zinc-300 tabular-nums">{dataAsOf}</strong></span>
          </span>
          <span className="text-zinc-400 dark:text-zinc-500">·</span>
          <span>종목 <strong className="text-zinc-700 dark:text-zinc-300 tabular-nums">{realStockPool.length}개</strong></span>
        </p>
        {isClosed ? (
          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">오늘은 휴장일입니다 — 가장 최근 거래일 <strong className="tabular-nums">{dataAsOf}</strong> 장마감 데이터를 보여드립니다.</p>
        ) : null}
        {dataStale ? (
          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">자동 갱신이 지연되어 <strong>마지막 정상 데이터</strong>를 보여드립니다 — 최신이 아닐 수 있어요.</p>
        ) : null}
      </header>

      <section className="grid grid-cols-3 gap-2">
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2.5 md:p-3">
          <div className="text-[9px] md:text-[10px] text-blue-700 dark:text-blue-400 font-semibold uppercase tracking-wider mb-1">분석 종목</div>
          <div className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{realStockPool.length}</div>
          <div className="text-[9px] md:text-[10px] text-blue-700/70 dark:text-blue-400/70 mt-0.5">실데이터</div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2.5 md:p-3">
          <div className="text-[9px] md:text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider mb-1">PER 중앙값</div>
          <div className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{medianPer.toFixed(1)}배</div>
          <div className="text-[9px] md:text-[10px] text-emerald-700/70 dark:text-emerald-400/70 mt-0.5">극단값 제외</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2.5 md:p-3">
          <div className="text-[9px] md:text-[10px] text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wider mb-1">PBR 중앙값</div>
          <div className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{medianPbr.toFixed(2)}배</div>
          <div className="text-[9px] md:text-[10px] text-amber-700/70 dark:text-amber-400/70 mt-0.5">극단값 제외</div>
        </div>
      </section>

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

      <StockTabs
        tabs={[
          {
            id: "composite",
            label: "종합",
            content: (
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-5">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">오늘 추가 확인 후보</h2>
            <ScoreTooltip kind="composite" />
          </div>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">종합점수 상위 5</span>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">여러 지표에서 상대적으로 강점이 확인된 종목 — 탐색 우선순위 높음 (검증 보류 종목 제외)</p>
        <ul className="space-y-1">
          {topComposite.map((s, i) => (
            <li key={s.ticker}>
              <Link
                prefetch={false} href={"/stock/" + s.ticker}
                className="flex items-start justify-between gap-3 py-2.5 px-2 -mx-2 rounded-md min-h-[56px] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition active:bg-zinc-100 dark:active:bg-zinc-800"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums pt-0.5 shrink-0 whitespace-nowrap">{realStockPool.length}중 {topComposite.filter((x) => overallRankOf(x) === overallRankOf(s)).length > 1 ? "공동 " : ""}{overallRankOf(s)}위</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{s.name}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0 font-mono">{s.ticker}</span>
                      {(s.returns?.r3m ?? 0) >= 80 ? <span className="text-[9px] px-1 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium shrink-0">🔺3개월 +{Math.round(s.returns?.r3m ?? 0)}%</span> : null}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                      💡 {compositeReason(s)}
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 shrink-0 pt-0.5">
                  <span className="text-base font-bold text-blue-700 dark:text-blue-400 tabular-nums">{Math.round(compositeOf(s))}</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">/100</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

      </section>
            ),
          },
          {
            id: "value",
            label: "저평가",
            content: (
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-5">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">밸류에이션 기준 확인 후보</h2>
            <ScoreTooltip kind="value" />
          </div>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">밸류</span>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">PER · PBR이 풀에서 가장 낮음 — 이유 있는 저평가일 수도 있으니 원문 확인 권장</p>
        <ul className="space-y-1">
          {topValue.map((s, i) => {
            const perRatio = medianPer > 0 ? (s.per / medianPer) : null;
            return (
              <li key={s.ticker}>
                <Link
                  prefetch={false} href={"/stock/" + s.ticker}
                  className="flex items-start justify-between gap-3 py-2.5 px-2 -mx-2 rounded-md min-h-[56px] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition active:bg-zinc-100 dark:active:bg-zinc-800"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 w-4 text-center pt-0.5 shrink-0">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{s.name}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0 font-mono">{s.ticker}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                        💡 {valueReason(s, medianPer, medianPbr)}
                      </div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 flex items-center gap-2 flex-wrap tabular-nums">
                        <span>PER {s.per.toFixed(1)}</span>
                        <span>PBR {s.pbr.toFixed(2)}</span>
                        {perRatio !== null && perRatio < 0.6 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">풀 중앙값의 {Math.round(perRatio * 100)}%</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <span className="text-base font-bold text-cyan-700 dark:text-cyan-400 tabular-nums shrink-0 pt-0.5">{s.value}</span>
                </Link>
              </li>
            );
          })}
        </ul>

      </section>
            ),
          },
          {
            id: "momentum",
            label: "추세",
            content: (
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-5">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">최근 가격 흐름 강한 후보</h2>
            <ScoreTooltip kind="momentum" />
          </div>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">추세</span>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">최근 1·3·6개월 가중평균 수익률 — 고점 추격 위험 함께 의미</p>
        <ul className="space-y-1">
          {topMomentum.map((s, i) => {
            const r1m = s.returns?.r1m;
            const r3m = s.returns?.r3m;
            const r6m = s.returns?.r6m;
            return (
              <li key={s.ticker}>
                <Link
                  prefetch={false} href={"/stock/" + s.ticker}
                  className="flex items-start justify-between gap-3 py-2.5 px-2 -mx-2 rounded-md min-h-[56px] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition active:bg-zinc-100 dark:active:bg-zinc-800"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 w-4 text-center pt-0.5 shrink-0">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{s.name}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0 font-mono">{s.ticker}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                        💡 {momentumReason(s.returns)}
                      </div>
                      <div className="text-[10px] mt-0.5 flex items-center gap-2 flex-wrap">
                        {r1m !== undefined ? (
                          <span className={"tabular-nums " + (r1m >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                            1M {r1m >= 0 ? "+" : ""}{r1m.toFixed(1)}%
                          </span>
                        ) : null}
                        {r3m !== undefined ? (
                          <span className={"tabular-nums " + (r3m >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                            3M {r3m >= 0 ? "+" : ""}{r3m.toFixed(1)}%
                          </span>
                        ) : null}
                        {r6m !== undefined ? (
                          <span className={"tabular-nums " + (r6m >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                            6M {r6m >= 0 ? "+" : ""}{r6m.toFixed(1)}%
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <span className="text-base font-bold text-blue-700 dark:text-blue-400 tabular-nums shrink-0 pt-0.5">{s.momentum}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
            ),
          },
        ]}
      />


      {(() => {
        const allSignals = (recentSig.signals as unknown as Signal[]) ?? [];
        // 종목별 최강 신호 1개씩만 → strength 높은 순 Top 3
        const byStock = new Map<string, Signal>();
        for (const s of allSignals) {
          const code = s.disclosure?.stock_code;
          if (!code) continue;
          const cur = byStock.get(code);
          if (!cur || s.strength > cur.strength) byStock.set(code, s);
        }
        const top3 = Array.from(byStock.values())
          .sort((a, b) => b.strength - a.strength)
          .slice(0, 3);

        return (
          <section className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3 md:p-5">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-300">오늘 먼저 볼 공시 신호</h2>
              <Link href="/disclosures" className="text-xs text-amber-700 dark:text-amber-400 hover:underline">전체 보기 →</Link>
            </div>

            {top3.length > 0 ? (
              <ul className="space-y-2 mb-3">
                {top3.map((s, i) => (
                  <li key={s.disclosure.rcept_no}>
                    <Link
                      href={universeTickers.has(s.disclosure.stock_code) ? "/stock/" + s.disclosure.stock_code : `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${s.disclosure.rcept_no}`}
                      target={universeTickers.has(s.disclosure.stock_code) ? undefined : "_blank"}
                      rel={universeTickers.has(s.disclosure.stock_code) ? undefined : "noopener noreferrer"}
                      className="block bg-white/70 dark:bg-zinc-900/70 rounded-md p-3 border border-amber-100 dark:border-amber-900 hover:bg-white dark:hover:bg-zinc-900 hover:border-amber-300 transition active:bg-amber-50 dark:active:bg-amber-950/30 min-h-[68px]"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 mt-0.5 shrink-0 w-3.5 text-center">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className={"text-[10px] px-1.5 py-0.5 rounded border font-medium " + (SIGNAL_TONE[s.signalType] || "bg-zinc-50 text-zinc-700 border-zinc-200")}>
                              {s.signalLabel}
                            </span>
                            <span className="text-[10px] text-amber-700/70 dark:text-amber-400/70">유형 자동분류</span>
                            {!universeTickers.has(s.disclosure.stock_code) ? <span className="text-[10px] text-zinc-400 dark:text-zinc-500">· 분석 대상 외 · DART ↗</span> : null}
                          </div>
                          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {s.disclosure.corp_name}
                          </div>
                          <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2">{s.disclosure.report_nm}</div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            <p className="text-[11px] text-amber-900 dark:text-amber-300/90 leading-relaxed">
              최근 90일 DART 공시 중 <strong>자기주식 취득 · 임원·주요주주 보유 변동 · 정정공시 · 단일판매 계약 · 유상증자/CB</strong>를 분류해 오늘 확인할 신호를 선정합니다. 숫자는 '분류 신뢰도'(보고서 종류를 맞게 분류했다는 확신)이며 호재/악재 점수가 아닙니다. 임원·주요주주 보유 변동은 매수·매도·스톡옵션 등 방향을 본문에서 확인하세요.
            </p>
          </section>
        );
      })()}

      <section className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed border-t border-zinc-200 dark:border-zinc-800 pt-3">
        본 페이지는 KRX 일별 종가(FinanceDataReader), Naver Finance 재무 지표, DART 공시 실데이터를 기반으로 자동 생성됩니다. 영업일 마감 후 자동 갱신. 본 도구는 투자 추천이 아니라 탐색 우선순위를 제시하는 분석 도구입니다.
      </section>
    </div>
  );
}