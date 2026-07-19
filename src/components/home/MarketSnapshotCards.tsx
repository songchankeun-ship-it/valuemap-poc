"use client";

import Link from "next/link";
import { Database, Award, Activity, FileText } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { homeCopy } from "@/lib/copy/home";

interface MarketSnapshotCardsProps {
  totalCount: number;
  strongCount: number;
  volumeSpikeCount: number;
  signalCount: number;
}

// 오늘의 시장 스냅샷 — 4개 카드(데스크톱 4열, 모바일 2열).
export function MarketSnapshotCards({ totalCount, strongCount, volumeSpikeCount, signalCount }: MarketSnapshotCardsProps) {
  const { locale } = useLanguage();
  const t = homeCopy[locale];
  const s = t.snapshot;
  const stock = t.countStock;
  const cases = t.countCase;
  const cards = [
    { icon: Database, tone: "text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800", title: s.cards.total.title, value: `${totalCount}${stock}`, sub: s.cards.total.sub, href: "/stocks" },
    { icon: Award, tone: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40", title: s.cards.strong.title, value: `${strongCount}${stock}`, sub: s.cards.strong.sub, href: "/stocks" },
    { icon: Activity, tone: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40", title: s.cards.spike.title, value: `${volumeSpikeCount}${stock}`, sub: s.cards.spike.sub, href: "/stocks" },
    { icon: FileText, tone: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40", title: s.cards.signal.title, value: `${signalCount}${cases}`, sub: s.cards.signal.sub, href: "/disclosures" },
  ];
  return (
    <section>
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{s.heading}</h2>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{s.sub}</span>
      </div>
      <div className="grid grid-cols-2 border-y border-zinc-200 dark:border-zinc-800 lg:grid-cols-4">
        {cards.map(({ icon: Icon, tone, title, value, sub, href }, index) => (
          <Link
            key={title}
            prefetch={false}
            href={href}
            className={
              "ui-interactive-card block p-3 hover:bg-white dark:hover:bg-zinc-900 md:p-4 " +
              (index < 2 ? "border-b border-zinc-200 dark:border-zinc-800 lg:border-b-0 " : "") +
              (index % 2 === 0 ? "border-r border-zinc-200 dark:border-zinc-800 lg:border-r-0 " : "") +
              (index > 0 ? "lg:border-l lg:border-zinc-200 lg:dark:border-zinc-800" : "")
            }
          >
            <div className="mb-2 flex items-center gap-1.5">
              <Icon className={"h-3.5 w-3.5 " + tone.split(" ").slice(0, 2).join(" ")} strokeWidth={1.9} />
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">{title}</div>
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums mt-1 leading-none">{value}</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 leading-tight">{sub}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
