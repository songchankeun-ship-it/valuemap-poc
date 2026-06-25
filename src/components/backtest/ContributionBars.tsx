import Link from "next/link";

/**
 * 성과 기여 종목 Top / Bottom 막대 (설계서 §11.5).
 * pnl 부호로 수익 기여(양)·손실 기여(음)를 분리해 각각 가로 막대로.
 * 막대 길이는 그룹 내 최대 |pct| 기준 상대 비율. 수익=빨강·손실=파랑(한국식 등락 색).
 * % = 전략 총손익 대비 비중. 데이터 없으면 아무것도 렌더하지 않는다(날조 금지).
 */

interface Contributor {
  ticker: string;
  pnl: number;
  pct: number;
}

function BarRow({
  c,
  name,
  maxAbs,
  positive,
}: {
  c: Contributor;
  name: string;
  maxAbs: number;
  positive: boolean;
}) {
  const widthPct = maxAbs > 0 ? Math.max(4, (Math.abs(c.pct) / maxAbs) * 100) : 0;
  const barCls = positive ? "bg-red-400 dark:bg-red-500" : "bg-blue-400 dark:bg-blue-500";
  const valCls = positive ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400";
  return (
    <Link
      href={"/stock/" + c.ticker}
      prefetch={false}
      className="flex items-center gap-2 min-h-[36px] px-1 -mx-1 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition"
    >
      <span className="w-20 sm:w-24 shrink-0 text-xs text-zinc-800 dark:text-zinc-200 truncate">{name}</span>
      <span className="flex-1 h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
        <span className={"block h-full rounded " + barCls} style={{ width: widthPct + "%" }} />
      </span>
      <span className={"w-14 text-right shrink-0 text-xs font-semibold tabular-nums " + valCls}>
        {c.pct >= 0 ? "+" : ""}
        {c.pct}%
      </span>
    </Link>
  );
}

export function ContributionBars({
  contributors,
  names = {},
}: {
  contributors: Contributor[];
  names?: Record<string, string>;
}) {
  if (!contributors || contributors.length === 0) return null;

  const gains = contributors.filter((c) => c.pnl >= 0).sort((a, b) => b.pnl - a.pnl);
  const losses = contributors.filter((c) => c.pnl < 0).sort((a, b) => a.pnl - b.pnl);
  const maxGain = Math.max(0, ...gains.map((c) => Math.abs(c.pct)));
  const maxLoss = Math.max(0, ...losses.map((c) => Math.abs(c.pct)));

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1">성과 기여 종목</h3>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3">
        전체 기간 누적 손익에 기여한 종목. % = 전략 총손익 대비 비중. 이익·손실을 함께 봅니다.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {gains.length > 0 ? (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-sm bg-red-400 dark:bg-red-500 shrink-0" aria-hidden="true" />
              <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">수익 기여 상위</span>
            </div>
            <div className="space-y-0.5">
              {gains.map((c) => (
                <BarRow key={c.ticker} c={c} name={names[c.ticker] ?? c.ticker} maxAbs={maxGain} positive />
              ))}
            </div>
          </div>
        ) : null}
        {losses.length > 0 ? (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-sm bg-blue-400 dark:bg-blue-500 shrink-0" aria-hidden="true" />
              <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">손실 기여 상위</span>
            </div>
            <div className="space-y-0.5">
              {losses.map((c) => (
                <BarRow key={c.ticker} c={c} name={names[c.ticker] ?? c.ticker} maxAbs={maxLoss} positive={false} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
