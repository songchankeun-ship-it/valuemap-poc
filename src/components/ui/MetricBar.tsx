import { scoreColorOf } from "@/lib/scoreColor";

interface MetricBarProps {
  /** 지표명. */
  label: string;
  /** 0~100 점수. */
  value: number;
  /** 라벨/값 글자 크기 살짝 키움. */
  size?: "sm" | "md";
}

// 지표 막대 — 0~100 가로 막대 + 지표명 + 점수. 점수 구간색을 막대에 적용.
// 색만으로 의미를 전달하지 않게 점수 숫자를 항상 함께 노출.
export function MetricBar({ label, value, size = "sm" }: MetricBarProps) {
  const v = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  const c = scoreColorOf(v);
  const text = size === "md" ? "text-[12px]" : "text-[11px]";
  // bg-* 리터럴 클래스를 scoreColor 단일 소스에서 그대로 쓴다(런타임 치환 금지 — Tailwind 정적 스캔).
  return (
    <div className="flex items-center gap-2">
      <span className={"w-16 shrink-0 text-zinc-500 dark:text-zinc-400 " + text}>{label}</span>
      <div className={"relative h-1.5 flex-1 rounded-full overflow-hidden " + c.barTrack} aria-hidden="true">
        <div
          className={"absolute inset-y-0 left-0 rounded-full " + c.barFill}
          style={{ width: `${v}%` }}
        />
      </div>
      <span className={"w-7 shrink-0 text-right font-semibold tabular-nums " + text + " " + c.text}>{Math.round(v)}</span>
    </div>
  );
}
