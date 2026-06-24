// 점수 → 색상·라벨 단일 소스. 전 화면 점수 시각화(게이지·배지·막대·칩)가 같은 규칙을 쓰도록 한다.
// 색상만으로 의미를 전달하지 않도록 모든 구간에 한글 라벨을 함께 제공한다.
// 구간 기준(설계서 §5.4): 80↑ 강한 탐색 우선순위 / 60~79 확인 가치 / 40~59 중립 / 40↓ 우선순위 낮음.
// ⚠️ 점수 계산식이 아니라 '표시 색'만 정의한다. score.ts·grade.ts는 건드리지 않는다.

export type ScoreBand = "high" | "good" | "neutral" | "low";

export interface ScoreColor {
  band: ScoreBand;
  /** 한글 우선순위 라벨 — 색과 항상 함께 노출(색맹/대비 보조). */
  label: string;
  /** 텍스트 색(라이트+다크). SVG stroke="currentColor"에도 사용. */
  text: string;
  /** 옅은 배경(라이트+다크). */
  bg: string;
  /** 테두리(라이트+다크). */
  border: string;
  /** 배지(pill) 합성 클래스 — bg+text+border. */
  badge: string;
  /** 막대/게이지 진행색(라이트+다크) — text 클래스 기반, currentColor로 칠함. */
  fill: string;
  /** 트랙(미진행) 색 — 게이지·막대 공용. */
  track: string;
  /** 막대 진행색 — bg 클래스(라이트+다크). Tailwind 정적 스캔 대상이라 리터럴로 둔다. */
  barFill: string;
  /** 막대 트랙색 — bg 클래스(라이트+다크). */
  barTrack: string;
}

const TRACK = "text-zinc-200 dark:text-zinc-800";
// 막대(MetricBar)는 bg-* 클래스가 필요하다. text-*를 런타임 치환하면 Tailwind가
// 클래스를 못 잡아 색이 빠지므로, bg-* 리터럴을 단일 소스에 함께 둔다.
const BAR_TRACK = "bg-zinc-200 dark:bg-zinc-800";

export function scoreBand(score: number): ScoreBand {
  if (score >= 80) return "high";
  if (score >= 60) return "good";
  if (score >= 40) return "neutral";
  return "low";
}

const BANDS: Record<ScoreBand, ScoreColor> = {
  high: {
    band: "high",
    label: "강한 탐색 우선순위",
    text: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-900",
    badge: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
    fill: "text-blue-600 dark:text-blue-400",
    track: TRACK,
    barFill: "bg-blue-600 dark:bg-blue-400",
    barTrack: BAR_TRACK,
  },
  good: {
    band: "good",
    label: "확인 가치 있음",
    text: "text-sky-700 dark:text-sky-300",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200 dark:border-sky-900",
    badge: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900",
    fill: "text-sky-600 dark:text-sky-400",
    track: TRACK,
    barFill: "bg-sky-600 dark:bg-sky-400",
    barTrack: BAR_TRACK,
  },
  neutral: {
    band: "neutral",
    label: "중립",
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900",
    badge: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900",
    fill: "text-amber-500 dark:text-amber-500",
    track: TRACK,
    barFill: "bg-amber-500 dark:bg-amber-500",
    barTrack: BAR_TRACK,
  },
  low: {
    band: "low",
    label: "우선순위 낮음",
    text: "text-zinc-500 dark:text-zinc-400",
    bg: "bg-zinc-100 dark:bg-zinc-800/60",
    border: "border-zinc-200 dark:border-zinc-700",
    badge: "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
    fill: "text-zinc-400 dark:text-zinc-500",
    track: TRACK,
    barFill: "bg-zinc-400 dark:bg-zinc-500",
    barTrack: BAR_TRACK,
  },
};

/** 점수(0~100)에 대한 색/라벨 토큰. 비정상값은 low 처리. */
export function scoreColorOf(score: number): ScoreColor {
  const s = Number.isFinite(score) ? score : 0;
  return BANDS[scoreBand(s)];
}
