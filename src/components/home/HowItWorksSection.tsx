"use client";

import Link from "next/link";
import { ListChecks, BarChart3, FileSearch, CalendarCheck } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { homeCopy } from "@/lib/copy/home";

// 오른스코어 사용 방식 3단계 — 오늘 후보 확인 → 이유 확인 → 원문 검증.
export function HowItWorksSection() {
  const { locale } = useLanguage();
  const h = homeCopy[locale].howItWorks;
  const icons = [ListChecks, BarChart3, FileSearch, CalendarCheck];
  const steps = h.steps.map((s, i) => ({ icon: icons[i], step: `STEP ${i + 1}`, title: s.title, body: s.body }));
  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 md:p-6">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{h.heading}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{h.sub}</p>
        </div>
        <Link prefetch={false} href="/stocks" className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap">
          {h.start}
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map(({ icon: Icon, step, title, body }) => (
          <div key={step} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" strokeWidth={1.9} />
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500">{step}</span>
            </div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{title}</div>
            <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
