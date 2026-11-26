"use client";

import Link from "next/link";
import { Database, Award, Activity, FileText } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { homeCopy } from "@/lib/copy/home";
import { todayCopy } from "@/lib/copy/today";
import type { TodayDisclosureSummary } from "@/lib/todayDisclosure";

interface MarketSnapshotCardsProps {
  totalCount: number;
  strongCount: number;
  volumeSpikeCount: number;
  disclosureSummary: TodayDisclosureSummary;
}

// The market pulse totals share one readable rail.
export function MarketSnapshotCards({ totalCount, strongCount, volumeSpikeCount, disclosureSummary }: MarketSnapshotCardsProps) {
  const { locale } = useLanguage();
  const t = homeCopy[locale];
  const s = t.snapshot;
  const stock = t.countStock;
  const cases = t.countCase;
  const briefing = todayCopy[locale];
  const { source, count } = disclosureSummary;
  const disclosureTitle = source === "live" ? s.cards.signal.title : briefing.disclosureSourceLabels[source];
  const disclosureValue = count === null ? briefing.disclosureCountUnavailable : `${count}${cases}`;
  const cards = [
    { icon: Database, title: s.cards.total.title, value: `${totalCount}${stock}`, sub: s.cards.total.sub, href: "/stocks" },
    { icon: Award, title: s.cards.strong.title, value: `${strongCount}${stock}`, sub: s.cards.strong.sub, href: "/stocks" },
    { icon: Activity, title: s.cards.spike.title, value: `${volumeSpikeCount}${stock}`, sub: s.cards.spike.sub, href: "/stocks" },
  ];
  return (
    <section aria-label={s.heading} className="research-market-kpis">
      {cards.map(({ icon: Icon, title, value, sub, href }) => (
        <Link key={title} prefetch={false} href={href} title={sub}>
          <span><Icon size={15} aria-hidden="true" />{title}</span>
          <strong>{value}</strong>
        </Link>
      ))}
      <Link href="/disclosures" prefetch={false} data-disclosure-source={source} title={source === "live" ? s.cards.signal.sub : briefing.disclosureNotes[source]}>
        <span><FileText size={15} aria-hidden="true" />{disclosureTitle}</span>
        <strong>{disclosureValue}</strong>
      </Link>
    </section>
  );
}
