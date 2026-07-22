export function LivePrice({
  fallbackPrice,
  fallbackChangePct,
  asOf,
}: {
  fallbackPrice: number;
  fallbackChangePct: number;
  asOf?: string | null;
}) {
  const pct = fallbackChangePct;
  const direction = pct > 0 ? "▲" : pct < 0 ? "▼" : "-";

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className="text-2xl md:text-3xl font-black tabular-nums text-zinc-950 dark:text-zinc-50">
        {Math.round(fallbackPrice).toLocaleString()}
        <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-0.5">원</span>
      </span>
      <span
        className={
          "text-base font-bold tabular-nums " +
          (pct >= 0
            ? "text-red-600 dark:text-red-400"
            : "text-blue-600 dark:text-blue-400")
        }
      >
        {direction} {Math.abs(pct).toFixed(2)}%
      </span>
      <span className="text-[10px] text-zinc-600 dark:text-zinc-300 tabular-nums">
        {asOf ? `· ${asOf} 공개 데이터 종가` : "· 공개 데이터 종가"}
      </span>
    </div>
  );
}
