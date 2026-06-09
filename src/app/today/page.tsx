import Link from "next/link";
import { realStockPool, dataMetadata } from "@/lib/realStocks";
import recentSignalsRaw from "../../../public/disclosure-samples/recent-signals.json";

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

function formatDataAsOf(iso?: string): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const y = kst.getUTCFullYear();
    const mo = String(kst.getUTCMonth() + 1).padStart(2, "0");
    const da = String(kst.getUTCDate()).padStart(2, "0");
    const ho = String(kst.getUTCHours()).padStart(2, "0");
    const mi = String(kst.getUTCMinutes()).padStart(2, "0");
    return y + "." + mo + "." + da + " " + ho + ":" + mi;
  } catch { return "-"; }
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
  const dataAsOf = formatDataAsOf(dataMetadata.generatedAt);

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
        <div className="text-[10px] md:text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">오늘</div>
        <h1 className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{today}</h1>
        <p className="text-[11px] md:text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 md:mt-2">
          <strong className="text-zinc-700 dark:text-zinc-300 tabular-nums">{dataAsOf}</strong> KST · 최근 거래일 마감 · 종목 {realStockPool.length}개
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
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">오늘 추가 확인 후보</h2>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">composite</span>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">네 지표 모두 우호적인 상태 — 탐색 우선순위 높음</p>
        <ul className="space-y-0.5">
          {topComposite.map((s, i) => (
            <li key={s.ticker}>
              <Link href={"/stock/" + s.ticker} className="flex items-center justify-between gap-3 py-2 px-2 -mx-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 w-4 text-center">{i + 1}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{s.name}</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0">{s.ticker}</span>
                </div>
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="text-sm font-bold text-blue-700 tabular-nums">{s.compositeScore}</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">/100</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-5">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">밸류에이션 기준 확인 후보</h2>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">value</span>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">PER · PBR이 풀에서 가장 낮음 — 이유 있는 저평가일 수도 있으니 원문 확인 권장</p>
        <ul className="space-y-0.5">
          {topValue.map((s, i) => (
            <li key={s.ticker}>
              <Link href={"/stock/" + s.ticker} className="flex items-center justify-between gap-3 py-2 px-2 -mx-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                <div className="flex items-center gap-3 min-w-0 flex-wrap">
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 w-4 text-center">{i + 1}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{s.name}</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 tabular-nums">PER {s.per.toFixed(1)}</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 tabular-nums">PBR {s.pbr.toFixed(2)}</span>
                </div>
                <span className="text-sm font-bold text-cyan-700 tabular-nums shrink-0">{s.value}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-5">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">최근 가격 흐름 강한 후보</h2>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">momentum</span>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">최근 1·3·6개월 가중평균 수익률 — 고점 추격 위험 함께 의미</p>
        <ul className="space-y-0.5">
          {topMomentum.map((s, i) => {
            const r6m = s.returns?.r6m;
            return (
              <li key={s.ticker}>
                <Link href={"/stock/" + s.ticker} className="flex items-center justify-between gap-3 py-2 px-2 -mx-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                  <div className="flex items-center gap-3 min-w-0 flex-wrap">
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 w-4 text-center">{i + 1}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{s.name}</span>
                    {r6m !== undefined ? (
                      <span className={"text-[10px] tabular-nums " + (r6m >= 0 ? "text-emerald-600" : "text-rose-600")}>
                        6M {r6m >= 0 ? "+" : ""}{r6m.toFixed(1)}%
                      </span>
                    ) : null}
                  </div>
                  <span className="text-sm font-bold text-blue-700 tabular-nums shrink-0">{s.momentum}</span>
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
                  <li key={s.disclosure.rcept_no} className="bg-white/70 rounded-md p-2.5 border border-amber-100">
                    <div className="flex items-start gap-2.5">
                      <span className="text-[10px] font-mono text-amber-700 mt-0.5 shrink-0 w-3.5 text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className={"text-[10px] px-1.5 py-0.5 rounded border font-medium " + (SIGNAL_TONE[s.signalType] || "bg-zinc-50 text-zinc-700 border-zinc-200")}>
                            {s.signalLabel}
                          </span>
                          <span className="text-[10px] text-amber-700/70 tabular-nums">강도 {s.strength}</span>
                        </div>
                        <Link
                          href={"/stock/" + s.disclosure.stock_code}
                          className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-700 truncate block"
                        >
                          {s.disclosure.corp_name}
                        </Link>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2">{s.disclosure.report_nm}</div>
                      </div>
                    </div>
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