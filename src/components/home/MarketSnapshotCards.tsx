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

// The market pulse totals share one readable rail.
export function MarketSnapshotCards({ totalCount, strongCount, volumeSpikeCount, signalCount }: MarketSnapshotCardsProps) {
  const { locale } = useLanguage();
  const t = homeCopy[locale];
  const s = t.snapshot;
  const stock = t.countStock;
  const cases = t.countCase;
  const cards = [
    { icon: Database, title: s.cards.total.title, value: `${totalCount}${stock}`, sub: s.cards.total.sub, href: "/stocks" },
    { icon: Award, title: s.cards.strong.title, value: `${strongCount}${stock}`, sub: s.cards.strong.sub, href: "/stocks" },
    { icon: Activity, title: s.cards.spike.title, value: `${volumeSpikeCount}${stock}`, sub: s.cards.spike.sub, href: "/stocks" },
    { icon: FileText, title: s.cards.signal.title, value: `${signalCount}${cases}`, sub: s.cards.signal.sub, href: "/disclosures" },
  ];
  return (
    <section aria-label={s.heading} className="research-market-kpis">
      {cards.map(({ icon: Icon, title, value, sub, href }) => (
        <Link key={title} prefetch={false} href={href} title={sub}>
          <span><Icon size={15} aria-hidden="true" />{title}</span>
          <strong>{value}</strong>
        </Link>
      ))}
    </section>
  );
}
