import { scoreColorOf } from "@/lib/scoreColor";

interface ScoreBadgeProps {
  score: number;
  /** 점수 숫자 노출(기본 true). false면 라벨만. */
  showScore?: boolean;
  /** 구간 라벨 노출(기본 true). */
  showLabel?: boolean;
  size?: "sm" | "md";
}

// 점수 배지 — 점수 + 구간 라벨을 한 pill로. 색만으로 의미를 전달하지 않게 라벨을 함께 노출.
export function ScoreBadge({ score, showScore = true, showLabel = true, size = "md" }: ScoreBadgeProps) {
  const v = Number.isFinite(score) ? Math.round(score) : 0;
  const c = scoreColorOf(v);
  const pad = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]";
  return (
    <span
      className={"inline-flex items-center gap-1 rounded-md border font-medium whitespace-nowrap " + pad + " " + c.badge}
    >
      {showScore ? <span className="tabular-nums font-bold">{v}</span> : null}
      {showLabel ? <span>{c.label}</span> : null}
    </span>
  );
}
