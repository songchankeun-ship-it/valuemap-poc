"use client";

import { Activity, BarChart3, Database, ShieldCheck } from "lucide-react";
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
  const total = Math.max(1, data.totalCount);
  const items = [
    { Icon: Database, label: t.coverage, value: data.totalCount, ratio: 100, tone: "bg-zinc-500 dark:bg-zinc-400" },
    { Icon: ShieldCheck, label: t.strong, value: data.strongCount, ratio: (data.strongCount / total) * 100, tone: "bg-blue-600 dark:bg-blue-400" },
    { Icon: Activity, label: t.activity, value: data.activitySurgeCount, ratio: (data.activitySurgeCount / total) * 100, tone: "bg-emerald-600 dark:bg-emerald-400" },
    { Icon: BarChart3, label: t.up, value: data.upCount, ratio: (data.upCount / total) * 100, tone: "bg-red-500 dark:bg-red-400" },
  ];

  return (
    <section className="ui-market-pulse mt-5" aria-label={t.ariaLabel}>
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200/80 px-1 py-2 dark:border-zinc-800">
        <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">{t.title}</div>
        <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{t.caption}</div>
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-4">
        {items.map(({ Icon, label, value, ratio, tone }, index) => (
          <div
            key={label}
            className={
              "relative min-w-0 px-2.5 py-3 sm:px-3 " +
              (index < 2 ? "border-b border-zinc-200 dark:border-zinc-800 sm:border-b-0 " : "") +
              (index % 2 === 0 ? "border-r border-zinc-200 dark:border-zinc-800 sm:border-r-0 " : "") +
              (index > 0 ? "sm:border-l sm:border-zinc-200 sm:dark:border-zinc-800" : "")
            }
          >
            <dt className="flex items-center gap-1.5 truncate text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
              <span className="truncate">{label}</span>
            </dt>
            <dd className="mt-1 text-lg font-bold leading-none text-zinc-950 tabular-nums dark:text-zinc-50">
              {value}<span className="ml-0.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{t.unit}</span>
            </dd>
            <span className="mt-2 block h-0.5 overflow-hidden bg-zinc-200 dark:bg-zinc-800" aria-hidden="true">
              <span className={`block h-full ${tone}`} style={{ width: `${Math.max(3, Math.min(100, ratio))}%` }} />
            </span>
          </div>
        ))}
      </dl>
    </section>
  );
}
