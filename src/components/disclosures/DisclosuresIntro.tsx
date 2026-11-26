"use client";

// 서버 페이지(src/app/disclosures/page.tsx)의 가시 한글 JSX를 옮겨온 클라이언트 인트로.
// 브레드크럼/헤더/수집 범위 안내/하단 DART 고지를 로케일에 맞게 표기한다.
// 서버 로직(getRecentSignals/revalidate/metadata)은 페이지에 그대로 둔다.

import Link from "next/link";
import { ChevronDown } from "lucide-react";
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

      <header className="research-screen-heading">
        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
          <h1>{t.title}</h1>
          <DataStatusBadge
            tone="limited"
            label={t.limitedBadge}
            className="research-filings-scope"
          />
        </div>
      </header>
    </>
  );
}

export function DisclosuresIntroNote() {
  const { locale } = useLanguage();
  const t = disclosuresIntroCopy[locale];
  return (
    <div className="research-filings-footnotes">
      <details>
        <summary><ChevronDown size={15} aria-hidden="true" />{t.collapseSummary}</summary>
        <p>{t.collapseBody}</p>
      </details>
      <details>
        <summary><ChevronDown size={15} aria-hidden="true" />{t.typeGuide.title}</summary>
        <ul>
          {t.typeGuide.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </details>
      <p>{t.bottomNote}</p>
    </div>
  );
}
