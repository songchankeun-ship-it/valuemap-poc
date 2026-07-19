import { scoreColorOf } from "@/lib/scoreColor";

interface ScoreGaugeProps {
  /** 0~100 종합/지표 점수. */
  score: number;
  /** 원 지름(px). 기본 96. */
  size?: number;
  /** 링 두께(px). 기본 size에 비례. */
  stroke?: number;
  /** 점수 아래 구간 라벨 노출 여부. */
  showLabel?: boolean;
  /** "/ 100" 보조 표기 노출. */
  showOutOf?: boolean;
}

// 원형 점수 게이지 — 순수 SVG(클라이언트 훅 없음, 서버 렌더 가능).
// 점수가 화면의 주인공이 되도록 큰 숫자 + 구간색 링 + 한글 라벨을 함께 보여준다.
export function ScoreGauge({ score, size = 96, stroke, showLabel = true, showOutOf = false }: ScoreGaugeProps) {
  const v = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
  const c = scoreColorOf(v);
  const sw = stroke ?? Math.max(6, Math.round(size * 0.085));
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (v / 100) * circ;
  const numSize = Math.round(size * 0.34);

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`종합 점수 ${Math.round(v)}점, ${c.label}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={sw}
          stroke="currentColor"
          className={c.track}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={sw}
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          className={"ui-score-ring " + c.fill}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={"font-bold tabular-nums leading-none " + c.text}
          style={{ fontSize: numSize }}
        >
          {Math.round(v)}
        </span>
        {showOutOf ? (
          <span className="text-[10px] text-zinc-600 dark:text-zinc-300 leading-none mt-0.5">/ 100</span>
        ) : null}
        {showLabel ? (
          <span className={"text-[9px] font-medium leading-none mt-1 px-1 text-center " + c.text}>{c.label}</span>
        ) : null}
      </div>
    </div>
  );
}
