interface MetricChipProps {
  /** 지표명(추세·거래활성도·밸류·위험조정 등). */
  label: string;
  /** 표시값(점수/문구). */
  value: string | number;
  /** 강조 톤(강점 칩 등). 기본 중립. */
  tone?: "neutral" | "strong" | "muted";
}

const TONE: Record<NonNullable<MetricChipProps["tone"]>, string> = {
  neutral: "bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
  strong: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
  muted: "bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800",
};

// 지표 칩 — 지표명 + 값을 작은 pill로. 숫자는 tabular-nums로 가독성 유지.
export function MetricChip({ label, value, tone = "neutral" }: MetricChipProps) {
  return (
    <span className={"inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium " + TONE[tone]}>
      <span className="opacity-70">{label}</span>
      <span className="tabular-nums">{value}</span>
    </span>
  );
}
