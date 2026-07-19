"use client";

import { DataStatusBadge, AsOfDateBadge, MetricsVersionBadge } from "@/components/trust/badges";
import { useLanguage } from "@/components/LanguageProvider";
import { todayStatusBarCopy } from "@/lib/copy/status";
import type { LocalizedDataStatus } from "@/lib/dataStatus";
import type { Locale } from "@/lib/i18n";

// 오늘 페이지 최상단 데이터 상태 바 (설계서 §7.2 / §16.4) — 클라이언트 표시부.
// 서버 래퍼가 넘긴 dataStatusByLocale에서 로케일을 골라 배지 라벨을 채우고,
// 필드 라벨/고정 문구는 statusCopy(번들에 stocks.json 미포함)에서 읽는다.
// 데스크톱은 가로 한 줄, 모바일(≤390px)은 자연 줄바꿈으로 압축된다.
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-zinc-600 dark:text-zinc-300">{label}</span>
      {children}
    </span>
  );
}

function Divider() {
  return <span className="hidden sm:inline text-zinc-500 dark:text-zinc-400" aria-hidden="true">·</span>;
}

export function TodayStatusBarContent({
  dataStatusByLocale,
}: {
  dataStatusByLocale: Record<Locale, LocalizedDataStatus>;
}) {
  const { locale } = useLanguage();
  const t = todayStatusBarCopy[locale];
  const ds = dataStatusByLocale[locale];

  return (
    <section
      aria-label={t.ariaLabel}
      className="ui-data-band px-1 py-2.5 md:px-2 md:py-3"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] md:text-xs">
        <Field label={t.dataStatus}>
          <DataStatusBadge tone={ds.statusTone} label={ds.statusLabel} className="font-semibold" />
        </Field>
        <Divider />
        <Field label={t.priceBasis}>
          <AsOfDateBadge label={ds.globalAsOfLabel} suffix={t.marketClose} />
        </Field>
        <Divider />
        <Field label={t.disclosureBasis}>
          <strong className="text-zinc-700 dark:text-zinc-300 font-medium">{t.recentUpdate}</strong>
        </Field>
        <Divider />
        <Field label={t.metricsVersion}>
          <MetricsVersionBadge label={ds.metricsVersionLabel} />
        </Field>
      </div>
    </section>
  );
}
