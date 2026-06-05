import Link from "next/link";
import { realStockPool, dataMetadata } from "@/lib/realStocks";

function formatDateKST(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(now);
  return parts;
}

function formatDataAsOf(iso?: string): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  } catch { return "-"; }
}

export const metadata = {
  title: "오늘 — 밸류맵",
  description: "오늘 자체 알고리즘이 발견한 종목들 — 균형, 저평가, 모멘텀",
};

export const revalidate = 3600;

export default function TodayPage() {
  const today = formatDateKST();
  const dataAsOf = formatDataAsOf(dataMetadata.generatedAt);

  const validStocks = realStockPool.filter(s => s.compositeScore !== undefined);

  const topComposite = [...validStocks]
    .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0))
    .slice(0, 5);

  const topValue = [...validStocks]
    .filter(s => s.value > 0 && s.per > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const topMomentum = [...validStocks]
    .filter(s => s.momentum > 0 && s.returns)
    .sort((a, b) => b.momentum - a.momentum)
    .slice(0, 5);

  const valid = realStockPool.filter(s => s.per > 0);
  const avgPer = valid.length > 0
    ? valid.reduce((sum, s) => sum + s.per, 0) / valid.length
    : 0;
  const validPbr = realStockPool.filter(s => s.pbr > 0);
  const avgPbr = validPbr.length > 0
    ? validPbr.reduce((sum, s) => sum + s.pbr, 0) / validPbr.length
    : 0;

  return (
    <div className="space-y-6">
      <header className="border-b border-zinc-200 pb-4">
        <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">오늘</div>
        <h1 className="text-2xl font-bold text-zinc-900">{today}</h1>
        <p className="text-xs text-zinc-500 mt-2">
          데이터 기준 <strong className="text-zinc-700 tabular-nums">{dataAsOf}</strong> · 종목 {realStockPool.length}개 · KRX · Naver · DART
        </p>
      </header>

      <section className="grid grid-cols-3 gap-2">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-[10px] text-blue-700 font-semibold uppercase tracking-wider mb-1">분석 종목</div>
          <div className="text-2xl font-bold text-zinc-900 tabular-nums">{realStockPool.length}</div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3">
          <div className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider mb-1">평균 PER</div>
          <div className="text-2xl font-bold text-zinc-900 tabular-nums">{avgPer.toFixed(1)}x</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3">
          <div className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider mb-1">평균 PBR</div>
          <div className="text-2xl font-bold text-zinc-900 tabular-nums">{avgPbr.toFixed(2)}x</div>
        </div>
      </section>

      <section className="bg-white border border-zinc-200 rounded-lg p-5">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-sm font-semibold text-zinc-900">균형 잡힌 종목 Top 5</h2>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">composite</span>
        </div>
        <p className="text-xs text-zinc-600 mb-3">네 지표 모두 우호적 — 탐색 우선순위 높음</p>
        <ul className="space-y-0.5">
          {topComposite.map((s, i) => (
            <li key={s.ticker}>
              <Link href={"/stock/" + s.ticker} className="flex items-center justify-between gap-3 py-2 px-2 -mx-2 rounded hover:bg-zinc-50 transition">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] font-mono text-zinc-400 w-4 text-center">{i + 1}</span>
                  <span className="font-medium text-zinc-900 truncate">{s.name}</span>
                  <span className="text-[10px] text-zinc-400 tabular-nums shrink-0">{s.ticker}</span>
                </div>
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="text-sm font-bold text-blue-700 tabular-nums">{s.compositeScore}</span>
                  <span className="text-[10px] text-zinc-400">/100</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white border border-zinc-200 rounded-lg p-5">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-sm font-semibold text-zinc-900">상대적 저평가 Top 5</h2>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">value</span>
        </div>
        <p className="text-xs text-zinc-600 mb-3">PER · PBR이 풀에서 가장 낮음 — 단, 이유 있는 저평가일 수 있습니다</p>
        <ul className="space-y-0.5">
          {topValue.map((s, i) => (
            <li key={s.ticker}>
              <Link href={"/stock/" + s.ticker} className="flex items-center justify-between gap-3 py-2 px-2 -mx-2 rounded hover:bg-zinc-50 transition">
                <div className="flex items-center gap-3 min-w-0 flex-wrap">
                  <span className="text-[10px] font-mono text-zinc-400 w-4 text-center">{i + 1}</span>
                  <span className="font-medium text-zinc-900 truncate">{s.name}</span>
                  <span className="text-[10px] text-zinc-500 tabular-nums">PER {s.per.toFixed(1)}</span>
                  <span className="text-[10px] text-zinc-500 tabular-nums">PBR {s.pbr.toFixed(2)}</span>
                </div>
                <span className="text-sm font-bold text-cyan-700 tabular-nums shrink-0">{s.value}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white border border-zinc-200 rounded-lg p-5">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-sm font-semibold text-zinc-900">강세 추세 Top 5</h2>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">momentum</span>
        </div>
        <p className="text-xs text-zinc-600 mb-3">최근 1·3·6개월 가중평균 수익률 — 고점 추격 위험 함께 의미</p>
        <ul className="space-y-0.5">
          {topMomentum.map((s, i) => {
            const r6m = s.returns?.r6m;
            return (
              <li key={s.ticker}>
                <Link href={"/stock/" + s.ticker} className="flex items-center justify-between gap-3 py-2 px-2 -mx-2 rounded hover:bg-zinc-50 transition">
                  <div className="flex items-center gap-3 min-w-0 flex-wrap">
                    <span className="text-[10px] font-mono text-zinc-400 w-4 text-center">{i + 1}</span>
                    <span className="font-medium text-zinc-900 truncate">{s.name}</span>
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

      <section className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-5">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-sm font-semibold text-amber-900">오늘의 공시 신호</h2>
          <Link href="/disclosures" className="text-xs text-amber-700 hover:underline">전체 보기 →</Link>
        </div>
        <p className="text-xs text-amber-900 leading-relaxed">
          최근 90일 DART 공시 중 <strong>자기주식 취득 · 임원·주요주주 매수 · 정정공시 · 단일판매 계약 · 유상증자/CB</strong> 신호를 자동 분류합니다. 의미 있는 시장 신호만 추려 보여드려요.
        </p>
      </section>

      <section className="text-[10px] text-zinc-400 leading-relaxed border-t border-zinc-200 pt-3">
        본 페이지는 KRX 일별 종가(FinanceDataReader), Naver Finance 재무 지표, DART 공시 실데이터를 기반으로 자동 생성됩니다. 매일 영업일 마감 후 갱신. 본 도구는 투자 추천이 아니라 탐색 우선순위를 제시하는 분석 도구입니다.
      </section>
    </div>
  );
}