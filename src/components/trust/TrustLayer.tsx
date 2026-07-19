"use client";

/**
 * 데이터 신뢰 레이어 인터랙티브 컴포넌트 (설계서 §5 / §9 / §11 / §20).
 * - DataSourceBadges: 출처 배지 + 클릭/포커스로 토글되는 상세(hover 전용 아님, aria 연결).
 * - DataTrustModal: "데이터 기준 보기" → 기준일·출처·산식·상태·제한·투자 고지 모달(ESC/닫기/백드롭).
 * - DataTrustBar: 위 요소 + 상태/기준일/산식 배지를 한 줄로 구성. 데스크톱 전체 / 모바일 압축.
 *
 * 서버 컴포넌트가 dataStatus를 직렬화 props로 주입한다(클라이언트가 stocks.json을 번들하지 않도록).
 */
import { useEffect, useId, useRef, useState } from "react";
import type { LocalizedDataStatus, DataStatusKind, DataSource } from "@/lib/dataStatus";
import type { Locale } from "@/lib/i18n";
import { useLanguage } from "@/components/LanguageProvider";
import { trustModalCopy } from "@/lib/copy/trust";
import { DataStatusBadge, AsOfDateBadge, MetricsVersionBadge } from "./badges";
import { trapTabKey } from "@/lib/focusTrap";

const TONE_RING: Record<DataStatusKind, string> = {
  normal: "border-emerald-200 dark:border-emerald-900",
  partial: "border-yellow-200 dark:border-yellow-900",
  delayed: "border-orange-200 dark:border-orange-900",
  limited: "border-slate-200 dark:border-slate-700",
  error: "border-red-200 dark:border-red-900",
};

/** 출처 배지 — 클릭/포커스로 사용 목적 상세 토글(hover 의존 금지, aria-describedby/expanded). */
export function DataSourceBadges({
  sources,
  className = "",
}: {
  sources: readonly DataSource[];
  className?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const baseId = useId();
  return (
    <div className={"flex flex-wrap items-start gap-1.5 " + className}>
      {sources.map((s) => {
        const isOpen = open === s.id;
        const descId = `${baseId}-${s.id}`;
        return (
          <span key={s.id} className="relative inline-flex">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-describedby={isOpen ? descId : undefined}
              onClick={() => setOpen(isOpen ? null : s.id)}
              onBlur={() => setOpen((cur) => (cur === s.id ? null : cur))}
              className="inline-flex min-h-8 items-center rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {s.label}
            </button>
            {isOpen ? (
              <span
                id={descId}
                role="tooltip"
                className="absolute top-full left-0 mt-1 z-50 w-max max-w-[220px] rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-[11px] leading-snug text-zinc-600 dark:text-zinc-300 shadow-sm"
              >
                <strong className="text-zinc-800 dark:text-zinc-100">{s.label}</strong> · {s.usage}
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

/** 모달 본문 섹션 헬퍼. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </div>
      <div className="text-[13px] text-zinc-700 dark:text-zinc-200 leading-relaxed">{children}</div>
    </div>
  );
}

/** 데이터 기준과 출처 모달 — 트리거 버튼 + 다이얼로그. */
export function DataTrustModal({
  status,
  triggerLabel,
  triggerClassName = "",
}: {
  status: LocalizedDataStatus;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const { locale } = useLanguage();
  const t = trustModalCopy[locale];
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      else trapTabKey(e, dialogRef.current);
    };
    document.addEventListener("keydown", onKey);
    // 닫힐 때(open: true→false) 또는 언마운트 시에만 트리거로 포커스 복귀.
    // 초기 마운트에서 실행되지 않으므로 페이지 로드 시 포커스를 가로채지 않음(키보드 접근 §20).
    return () => {
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={
          "inline-flex min-h-8 items-center rounded border border-zinc-300 dark:border-zinc-600 px-2 py-0.5 text-[11px] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 " +
          triggerClassName
        }
      >
        {triggerLabel ?? t.trigger}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 sticky top-0 bg-white dark:bg-zinc-900">
              <h2 id={titleId} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t.title}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.close}
                className="inline-flex h-11 w-11 items-center justify-center rounded text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="px-4 py-4 space-y-4">
              <Section title={t.secDate}>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">{t.priceBasis} </span>
                  <AsOfDateBadge label={status.globalAsOfLabel} suffix={t.marketClose} />
                </div>
              </Section>

              <Section title={t.secSources}>
                <ul className="space-y-1">
                  {status.sources.map((s) => (
                    <li key={s.id} className="flex gap-1.5">
                      <strong className="shrink-0 text-zinc-800 dark:text-zinc-100">{s.label}</strong>
                      <span className="text-zinc-500 dark:text-zinc-400">{s.usage}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title={t.secMetrics}>
                <MetricsVersionBadge label={status.metricsVersionLabel} />
                {status.metricsEffectiveDate ? (
                  <span className="ml-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {t.metricsApplied} {status.metricsEffectiveDate}
                  </span>
                ) : null}
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{t.metricsDesc}</div>
              </Section>

              <Section title={t.secStatus}>
                <DataStatusBadge tone={status.statusTone} label={status.statusLabel} />
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{status.statusMeaning}</div>
              </Section>

              <Section title={t.secLimits}>
                <ul className="space-y-1 text-[12px] text-zinc-600 dark:text-zinc-300">
                  <li>· {status.limits.disclosure}</li>
                  <li>· {status.limits.backtest}</li>
                </ul>
              </Section>

              <div className={"rounded-lg border bg-zinc-50/70 dark:bg-zinc-800/40 px-3 py-2 " + TONE_RING[status.statusTone]}>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-0.5">{t.secNotice}</div>
                <p className="text-[12px] text-zinc-600 dark:text-zinc-300 leading-relaxed">{status.notices.investment}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * 전역 데이터 신뢰 바.
 * 데스크톱: 기준일 · 상태 · 산식 + 출처 배지 + 상세 트리거.
 * 모바일(compact): "{기준일} 장마감 · {상태}" 1줄 + 상세 트리거.
 */
export function DataTrustBar({ status }: { status: LocalizedDataStatus }) {
  const { locale } = useLanguage();
  const t = trustModalCopy[locale];
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      {/* 데스크톱 */}
      <div className="hidden sm:flex items-center gap-1.5 min-w-0 text-zinc-600 dark:text-zinc-300">
        <AsOfDateBadge label={status.globalAsOfLabel} />
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        <DataStatusBadge tone={status.statusTone} label={status.statusLabel} />
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        <MetricsVersionBadge label={status.metricsVersionLabel} />
        <span className="hidden md:inline-flex ml-1">
          <DataSourceBadges sources={status.sources} />
        </span>
      </div>
      {/* 모바일 압축형 */}
      <div className="flex sm:hidden items-center gap-1.5 min-w-0 text-zinc-600 dark:text-zinc-300 truncate">
        <strong className="tabular-nums text-zinc-900 dark:text-zinc-100">{status.marketDateLabel}</strong>
        <span className="text-zinc-600 dark:text-zinc-300">{t.marketClose}</span>
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        <DataStatusBadge tone={status.statusTone} label={status.statusLabel} />
      </div>
      <DataTrustModal status={status} triggerClassName="shrink-0" />
    </div>
  );
}

/**
 * 로케일 인식 모달 래퍼 — 서버가 dataStatusByLocale(ko/en)를 직렬화 props로 주입하면
 * 현재 로케일에 맞는 status를 골라 DataTrustModal에 넘긴다(클라이언트가 stocks.json 미번들).
 */
export function LocalizedDataTrustModal({
  statusByLocale,
  triggerClassName = "",
}: {
  statusByLocale: Record<Locale, LocalizedDataStatus>;
  triggerClassName?: string;
}) {
  const { locale } = useLanguage();
  return <DataTrustModal status={statusByLocale[locale]} triggerClassName={triggerClassName} />;
}
