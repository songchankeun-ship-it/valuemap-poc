"use client";

import Link from "next/link";
import { Target, FileSearch, LineChart } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { homeCopy } from "@/lib/copy/home";

interface FeatureCardsProps {
  strongCount: number;
  signalCount: number;
}

// 핵심 기능 3개 카드(설계서 §6.5) — 오늘의 후보 / 공시 신호 / 백테스트.
// 각 카드가 '무엇을 해주는지'를 3초 안에 이해되게: 한 줄 설명 + 작은 숫자/배지 + 이동.
export function FeatureCards({ strongCount, signalCount }: FeatureCardsProps) {
  const { locale } = useLanguage();
  const t = homeCopy[locale];
  const f = t.features;
  const stock = t.countStock;
  const cases = t.countCase;
  const cards = [
    {
      icon: Target,
      tone: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
      title: f.cards.today.title,
      body: f.cards.today.body,
      stat: `${f.cards.today.statPrefix}${strongCount}${stock}`,
      cta: f.cards.today.cta,
      href: "#today-candidates",
    },
    {
      icon: FileSearch,
      tone: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40",
      title: f.cards.signal.title,
      body: f.cards.signal.body,
      stat: `${f.cards.signal.statPrefix}${signalCount}${cases}`,
      cta: f.cards.signal.cta,
      href: "/disclosures",
    },
    {
      icon: LineChart,
      tone: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
      title: f.cards.backtest.title,
      body: f.cards.backtest.body,
      stat: f.cards.backtest.stat,
      cta: f.cards.backtest.cta,
      href: "/backtest",
    },
  ];

  return (
    <section>
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{f.heading}</h2>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{f.sub}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {cards.map(({ icon: Icon, tone, title, body, stat, cta, href }) => (
          <Link
            key={title}
            prefetch={false}
            href={href}
            className="group flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-sm transition"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={"w-8 h-8 rounded-md flex items-center justify-center shrink-0 " + tone}>
                <Icon className="w-4 h-4" strokeWidth={1.9} />
              </div>
              <span className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">{title}</span>
            </div>
            <p className="text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400 flex-1">{body}</p>
            <div className="flex items-center justify-between gap-2 mt-3">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 tabular-nums">{stat}</span>
              <span className="text-[12px] font-medium text-blue-700 dark:text-blue-400 group-hover:underline whitespace-nowrap">{cta} →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
