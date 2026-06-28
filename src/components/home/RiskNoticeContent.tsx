"use client";

import { ShieldAlert } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { riskNoticeCopy } from "@/lib/copy/status";
import type { LocalizedDataStatus } from "@/lib/dataStatus";
import type { Locale } from "@/lib/i18n";

// 투자 추천 아님 · 탐색 도구 고지 — 클라이언트 표시부.
// 본문 3줄은 서버가 넘긴 dataStatusByLocale[locale].notices.disclaimer에서,
// 헤딩·3개 카드 제목은 riskNoticeCopy(번들에 stocks.json 미포함)에서 읽는다.
export function RiskNoticeContent({
  dataStatusByLocale,
}: {
  dataStatusByLocale: Record<Locale, LocalizedDataStatus>;
}) {
  const { locale } = useLanguage();
  const t = riskNoticeCopy[locale];
  const disclaimer = dataStatusByLocale[locale].notices.disclaimer;
  const items = t.titles.map((title, i) => ({ title, body: disclaimer[i] ?? "" }));

  return (
    <section className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-4 md:p-5">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" strokeWidth={2} />
        <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-300">{t.heading}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.title} className="rounded-lg bg-white/70 dark:bg-zinc-900/50 border border-amber-100 dark:border-amber-900/40 p-3">
            <div className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{it.title}</div>
            <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
