"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { homeHeroCopy } from "@/lib/i18n";

export interface HomeMarketPulseData {
  totalCount: number;
  strongCount: number;
  activitySurgeCount: number;
  upCount: number;
}

export function HomeMarketPulse({ data }: { data: HomeMarketPulseData }) {
  const { locale } = useLanguage();
  const t = homeHeroCopy[locale].pulse;
  const items = [
    { label: t.coverage, value: data.totalCount },
    { label: t.up, value: data.upCount, tone: "text-[var(--up)]" },
    { label: t.activity, value: data.activitySurgeCount, tone: "text-[var(--research-accent)]" },
    { label: t.strong, value: data.strongCount },
  ];

  return (
    <section className="border-b border-[var(--research-line)] bg-[var(--research-tint)]" aria-label={t.ariaLabel}>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 px-3 py-2 sm:grid-cols-4 sm:px-4 sm:py-3">
        {items.map(({ label, value, tone }) => (
          <div key={label} className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 border-l border-[var(--research-line)] pl-2 text-[12px] sm:pl-3">
            <dt className="break-keep text-[var(--muted)]">{label}</dt>
            <dd className={`whitespace-nowrap text-base font-bold tabular-nums ${tone ?? "text-[var(--foreground)]"}`}>
              {value}<span className="ml-0.5 text-[10px] font-medium text-[var(--muted)]">{t.unit}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
