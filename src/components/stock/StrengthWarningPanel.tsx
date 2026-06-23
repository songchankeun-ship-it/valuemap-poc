/**
 * 강점 / 주의 패널 — 좌우 2열(데스크톱)·세로 스택(모바일).
 * 강점은 블루/그린, 주의는 앰버/오렌지. 주의는 '확인 필요' 톤(공포·매도 언어 금지). 설계서 §6.4.
 */
export function StrengthWarningPanel({
  strengths,
  warnings,
}: {
  strengths: string[];
  warnings: string[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-1.5">강점</div>
        {strengths.length > 0 ? (
          <ul className="space-y-1">
            {strengths.map((s) => (
              <li key={s} className="flex items-start gap-1.5 text-xs text-emerald-800 dark:text-emerald-200 leading-snug">
                <span className="shrink-0" aria-hidden="true">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">뚜렷한 강점 지표가 없습니다.</p>
        )}
      </div>
      <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1.5">주의 · 확인 필요</div>
        {warnings.length > 0 ? (
          <ul className="space-y-1">
            {warnings.map((w) => (
              <li key={w} className="flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300 leading-snug">
                <span className="shrink-0" aria-hidden="true">⚠</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">특이 주의 신호 없음.</p>
        )}
      </div>
    </div>
  );
}
