"use client";

import Link from "next/link";
import { DisclosureSignalCard, type DisclosureSignalVM } from "./DisclosureSignalCard";
import { useLanguage } from "@/components/LanguageProvider";
import { homeCopy } from "@/lib/copy/home";

// 오늘 먼저 볼 공시 신호 섹션 — 표시 정책·분류 신뢰도 고지 포함.
export function DisclosureSignalSection({ signals, universeCount }: { signals: DisclosureSignalVM[]; universeCount?: number }) {
  const { locale } = useLanguage();
  const t = homeCopy[locale].disclosure;
  if (signals.length === 0) {
    // 조용한 날에도 섹션이 소리 없이 사라지지 않도록 차분한 빈 상태 카드로 대체(제목 유지 + 전체 보기 링크).
    return (
      <section>
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t.heading}</h2>
          <Link prefetch={false} href="/disclosures" className="text-[12px] font-medium text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap">
            {t.viewAll}
          </Link>
        </div>
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {t.emptyLine}
        </div>
      </section>
    );
  }
  return (
    <section>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t.heading}</h2>
        <Link prefetch={false} href="/disclosures" className="text-[12px] font-medium text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap">
          {t.viewAll}
        </Link>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 leading-relaxed">
        {t.introA}<strong className="font-medium text-zinc-600 dark:text-zinc-300">{t.introStrong}</strong>{t.introB}
      </p>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed inline-flex items-start gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 px-2 py-1">
        <span className="font-medium text-zinc-600 dark:text-zinc-300 shrink-0">{t.policyLabel}</span>
        <span className="break-words">{t.policyA}<strong className="font-medium text-zinc-600 dark:text-zinc-300">{t.policyStrongPrefix}{universeCount ?? 138}{t.policyStrongSuffix}</strong>{t.policyB}<Link prefetch={false} href="/disclosures" className="text-blue-700 dark:text-blue-400 hover:underline">{t.policyLink}</Link>{t.policyC}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {signals.map((s) => (
          <DisclosureSignalCard key={s.rceptNo} s={s} />
        ))}
      </div>

      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
        {t.footer}
      </p>
    </section>
  );
}
