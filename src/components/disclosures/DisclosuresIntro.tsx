"use client";

// 서버 페이지(src/app/disclosures/page.tsx)의 가시 한글 JSX를 옮겨온 클라이언트 인트로.
// 브레드크럼/헤더/수집 범위 안내/하단 DART 고지를 로케일에 맞게 표기한다.
// 서버 로직(getRecentSignals/revalidate/metadata)은 페이지에 그대로 둔다.

import Link from "next/link";
import { DataStatusBadge } from "@/components/trust/badges";
import { useLanguage } from "@/components/LanguageProvider";
import { disclosuresIntroCopy } from "@/lib/copy/disclosures";

export function DisclosuresIntroHeader() {
  const { locale } = useLanguage();
  const t = disclosuresIntroCopy[locale];
  return (
    <>
      <nav className="text-xs text-gray-500 dark:text-zinc-400 flex items-center justify-between gap-x-3 gap-y-1 flex-wrap">
        <span className="flex items-center gap-1 min-w-0">
          <Link href="/" className="hover:text-gray-900 dark:hover:text-zinc-100">{t.breadcrumbHome}</Link>
          <span>›</span>
          <span className="text-gray-900 dark:text-zinc-100">{t.breadcrumbCurrent}</span>
        </span>
        <span className="flex items-center gap-3 shrink-0">
          <Link href="/today" className="inline-flex items-center min-h-[44px] hover:text-blue-700 dark:hover:text-blue-400 whitespace-nowrap">← {t.returnToday}</Link>
          <Link href="/watchlist" className="inline-flex items-center min-h-[44px] hover:text-blue-700 dark:hover:text-blue-400 whitespace-nowrap">{t.returnWatchlist}</Link>
        </span>
      </nav>

      <header>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="text-xl font-medium">{t.title}</h1>
          <DataStatusBadge
            tone="limited"
            label={t.limitedBadge}
            className="text-[11px] rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5"
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
          {t.desc}
        </p>
      </header>

      {/* 기간/공시 필터 근처 — 수집 제한 보조 설명 (접근 가능한 visible note) */}
      <details className="text-xs text-gray-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2">
        <summary className="cursor-pointer select-none font-medium text-gray-700 dark:text-zinc-200">
          {t.collapseSummary}
        </summary>
        <p className="mt-2 leading-relaxed text-gray-600 dark:text-zinc-400">
          {t.collapseBody}
        </p>
      </details>
    </>
  );
}

export function DisclosuresIntroNote() {
  const { locale } = useLanguage();
  const t = disclosuresIntroCopy[locale];
  return (
    <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed">
      {t.bottomNote}
    </p>
  );
}
