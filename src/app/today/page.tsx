import Link from "next/link";
import { realStockPool, dataMetadata } from "@/lib/realStocks";
import recentSignalsRaw from "../../../public/disclosure-samples/recent-signals.json";
import { ScoreTooltip } from "@/components/ScoreTooltip";

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
  treasury_buy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  insider_buy: "bg-blue-50 text-blue-700 border-blue-200",
  correction: "bg-amber-50 text-amber-700 border-amber-200",
  single_contract: "bg-sky-50 text-sky-700 border-sky-200",
  capital_raise: "bg-pink-50 text-pink-700 border-pink-200",
};

function formatDateKST(): string {
  const now = new Date();
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  }).format(now);
}

/**
 * 헤더와 동일한 기준 사용 — asOfBusinessDate (YYYYMMDD).
 * 없으면 generatedAt(ISO)에서 추출.
 */
function formatDataAsOf(businessDate?: string, fallbackIso?: string): string {
  // YYYYMMDD 우선
  if (businessDate && /^\d{8}$/.test(businessDate)) {
    const y = businessDate.slice(0, 4);
    const mo = businessDate.slice(4, 6);
    const da = businessDate.slice(6, 8);
    const d = new Date(Number(y), Number(mo) - 1, Number(da));
    const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
    return `${y}.${mo}.${da} (${weekday})`;
  }
  // fallback ISO
  if (fallbackIso) {
    try {
      const d = new Date(fallbackIso);
      if (Number.isNaN(d.getTime())) return "데이터 준비 중";
      const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
      const y = kst.getUTCFullYear();
      const mo = String(kst.getUTCMonth() + 1).padStart(2, "0");
      const da = String(kst.getUTCDate()).padStart(2, "0");
      const weekday = ["일", "월", "화", "수", "목", "금", "토"][kst.getUTCDay()];
      return `${y}.${mo}.${da} (${weekday})`;
    } catch {}
  }
  return "데이터 준비 중";
}

/** Composite Top — 4지표 중 강한 것 위주 */
function compositeReason(s: { momentum: number; flow: number; value: number; vol: number }): string {
  const items = [
    { label: "모멘텀", v: s.momentum },
    { label: "자금흐름", v: s.flow },
    { label: "밸류", v: s.value },
    { label: "변동성조정", v: s.vol },
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

export const metadata = {
  title: "오늘 — 밸류맵",
  description: "오늘 자체 알고리즘이 발견한 종목들",
};

export const revalidate = 3600;

export default function TodayPage() {
  const today = formatDateKST();
  const dataAsOf = formatDataAsOf(dataMetadata.asOfBusinessDate, dataMetadata.generatedAt);

  const validStocks = realStockPool.filter(s => s.compositeScore !== undefined);
  const topComposite = [...validStocks].sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0)).slice(0, 5);
  const topValue = [...validStocks].filter(s => s.value > 0 && s.per > 0).sort((a, b) => b.value - a.value).slice(0, 5);
  const topMomentum = [...validStocks].filter(s => s.momentum > 0 && s.returns).sort((a, b) => b.momentum - a.momentum).slice(0, 5);

  const validPers = realStockPool.filter(s => s.per > 0 && s.per < 150).map(s => s.per);
  const medianPer = median(validPers);
  const validPbrs = realStockPool.filter(s => s.pbr > 0 && s.pbr < 30).map(s => s.pbr);
  const medianPbr = median(validPbrs);

  return (
    <div className="space-y-4 md:space-y-6">
      <header className="border-b border-zinc-200 dark:border-zinc-800 pb-3 md:pb-4">
        <div className="text-[10px] md:text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">오늘</div>
        <h1 className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{today}</h1>
        <p className="text-[11px] md:text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 md:mt-2 flex items-center flex-wrap gap-x-1.5 gap-y-0.5">
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>데이터 기준 <strong className="text-zinc-700 dark:text-zinc-300 tabular-nums">{dataAsOf}</strong></span>
          </span>
          <span className="text-zinc-400 dark:text-zinc-500">·</span>
          <span>종목 <strong className="text-zinc-700 dark:text-zinc-300 tabular-nums">{realStockPool.length}개</strong></span>
        </p>
      </header>

      <section className="grid grid-cols-3 gap-2">
        <div className="bg-blue-50 rounded-lg p-2.5 md:p-3">
          <div className="text-[9px] md:text-[10px] text-blue-700 font-semibold uppercase tracking-wider mb-1">분석 종목</div>
          <div className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{realStockPool.length}</div>
          <div className="text-[9px] md:text-[10px] text-blue-700/70 mt-0.5">실데이터</div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-2.5 md:p-3">
          <div className="text-[9px] md:text-[10px] text-emerald-700 font-semibold uppercase tracking-wider mb-1">PER 중앙값</div>
          <div className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{medianPer.toFixed(1)}x</div>
          <div className="text-[9px] md:text-[10px] text-emerald-700/70 mt-0.5">극단값 제외</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-2.5 md:p-3">
          <div className="text-[9px] md:text-[10px] text-amber-700 font-semibold uppercase tracking-wider mb-1">PBR 중앙값</div>
          <div className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{medianPbr.toFixed(2)}x</div>
          <div className="text-[9px] md:text-[10px] text-amber-700/70 mt-0.5">극단값 제외</div>
        </div>
      </section>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-5">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">오늘 추가 확인 후보</h2>
            <ScoreTooltip kind="composite" />
          </div>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">composite</span>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">네 지표 모두 우호적인 상태 — 탐색 우선순위 높음</p>
        <ul className="space-y-1">
          {topComposite.map((s, i) => (
            <li key={s.ticker}>
              <Link
                href={"/stock/" + s.ticker}
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
                      💡 {compositeReason(s)}
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 shrink-0 pt-0.5">
                  <span className="text-base font-bold text-blue-700 dark:text-blue-400 tabular-nums">{s.compositeScore}</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">/100</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-5">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">밸류에이션 기준 확인 후보</h2>
            <ScoreTooltip kind="value" />
          </div>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">value</span>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">PER · PBR이 풀에서 가장 낮음 — 이유 있는 저평가일 수도 있으니 원문 확인 권장</p>
        <ul className="space-y-1">
          {topValue.map((s, i) => {
            const perRatio = medianPer > 0 ? (s.per / medianPer) : null;
            return (
              <li key={s.ticker}>
                <Link
                  href={"/stock/" + s.ticker}
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

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-5">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">최근 가격 흐름 강한 후보</h2>
            <ScoreTooltip kind="momentum" />
          </div>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">momentum</span>
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
                  href={"/stock/" + s.ticker}
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

      {(() => {
        const allSignals = (recentSignalsRaw as { signals?: Signal[] }).signals ?? [];
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
          <section className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 md:p-5">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-semibold text-amber-900">오늘 먼저 볼 공시 신호</h2>
              <Link href="/disclosures" className="text-xs text-amber-700 hover:underline">전체 보기 →</Link>
            </div>

            {top3.length > 0 ? (
              <ul className="space-y-2 mb-3">
                {top3.map((s, i) => (
                  <li key={s.disclosure.rcept_no}>
                    <Link
                      href={"/stock/" + s.disclosure.stock_code}
                      className="block bg-white/70 dark:bg-zinc-900/70 rounded-md p-3 border border-amber-100 dark:border-amber-900 hover:bg-white dark:hover:bg-zinc-900 hover:border-amber-300 transition active:bg-amber-50 dark:active:bg-amber-950/30 min-h-[68px]"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 mt-0.5 shrink-0 w-3.5 text-center">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className={"text-[10px] px-1.5 py-0.5 rounded border font-medium " + (SIGNAL_TONE[s.signalType] || "bg-zinc-50 text-zinc-700 border-zinc-200")}>
                              {s.signalLabel}
                            </span>
                            <span className="text-[10px] text-amber-700/70 dark:text-amber-400/70 tabular-nums">강도 {s.strength}</span>
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

            <p className="text-[11px] text-amber-900 leading-relaxed">
              최근 90일 DART 공시 중 <strong>자기주식 취득 · 임원·주요주주 매수 · 정정공시 · 단일판매 계약 · 유상증자/CB</strong>를 분류합니다. 강도는 신호의 신뢰도이지 호재/악재 판단은 아닙니다.
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