/**
 * 데이터 신뢰 배지 프리미티브 (설계서 §6 / §9 / §19).
 * 차분한 그레이/블루그레이 면, 얇은 테두리, 차콜 텍스트. 색상은 의미의 유일 수단이 아니며 항상 단어를 동반.
 * 전부 서버 컴포넌트로 동작 가능한 순수 프레젠테이션(상호작용은 trust-modal.tsx의 클라이언트가 담당).
 */
import type { DataStatusKind } from "@/lib/dataStatus";

/** 상태 토큰 → 점/텍스트 색상. error만 강한 경고 톤, limited는 그레이/블루(오류 아님). */
const TONE: Record<DataStatusKind, { dot: string; text: string; ring: string }> = {
  normal: {
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "border-emerald-200 dark:border-emerald-900",
  },
  partial: {
    dot: "bg-yellow-500",
    text: "text-yellow-700 dark:text-yellow-300",
    ring: "border-yellow-200 dark:border-yellow-900",
  },
  delayed: {
    dot: "bg-orange-500",
    text: "text-orange-700 dark:text-orange-300",
    ring: "border-orange-200 dark:border-orange-900",
  },
  limited: {
    dot: "bg-slate-400",
    text: "text-slate-600 dark:text-slate-300",
    ring: "border-slate-200 dark:border-slate-700",
  },
  error: {
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-300",
    ring: "border-red-200 dark:border-red-900",
  },
};

/** ● + 상태 단어. 색상에 더해 단어를 항상 노출(접근성 §20). */
export function DataStatusBadge({
  tone,
  label,
  className = "",
}: {
  tone: DataStatusKind;
  label: string;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <span
      className={"inline-flex items-center gap-1 tabular-nums whitespace-nowrap " + t.text + " " + className}
    >
      <span className={"w-1.5 h-1.5 rounded-full shrink-0 " + t.dot} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

/** 기준일 배지 — "2026.06.16 (화) 장마감". */
export function AsOfDateBadge({
  label,
  suffix = "장마감",
  className = "",
}: {
  label: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <span className={"inline-flex items-center gap-1 whitespace-nowrap " + className}>
      <strong className="tabular-nums text-zinc-900 dark:text-zinc-100 font-medium">{label}</strong>
      {suffix ? <span className="text-zinc-600 dark:text-zinc-300">{suffix}</span> : null}
    </span>
  );
}

/**
 * 종목별 가격 기준일 지연 배지 — "데이터 지연" 등.
 * 경고(amber)지만 오류가 아니므로 차분한 톤. 색상 외에 항상 단어를 동반(접근성 §20).
 * 목록/카드에서 지연 종목이 "최신"으로 오해되지 않게 하기 위한 작은 인라인 배지.
 */
export function DataLagBadge({
  label,
  title,
  className = "",
}: {
  label: string;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title ?? label}
      className={
        "inline-flex items-center gap-1 rounded border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-px text-[10px] font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap " +
        className
      }
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-500" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

/** 산식 버전 배지 — "Metrics 2.4" (단일 표기). */
export function MetricsVersionBadge({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={
        "inline-flex items-center rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-1.5 py-px text-zinc-600 dark:text-zinc-300 tabular-nums " +
        className
      }
    >
      {label}
    </span>
  );
}
