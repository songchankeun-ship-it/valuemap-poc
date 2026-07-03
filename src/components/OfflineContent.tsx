"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { offlineCopy } from "@/lib/i18n";

// 오프라인/네트워크 필요 안내 본문(설계서 PART H §24). metadata는 서버 page.tsx에 남긴다.
// 기본(SSR) 로케일은 한국어라 무JS/헤드리스에서도 한국어로 렌더된다.
export function OfflineContent() {
  const { locale } = useLanguage();
  const t = offlineCopy[locale];
  return (
    <div className="max-w-md mx-auto px-3 md:px-4 py-10 text-center">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{t.title}</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{t.body}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">{t.hint}</p>

      <div className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-4 text-left">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{t.addTitle}</div>
        <p className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {t.addBodyBefore}<strong>{t.addBodyStrong}</strong>{t.addBodyAfter}
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center justify-center mt-6 min-h-[44px] px-5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium"
      >
        {t.homeButton}
      </Link>
    </div>
  );
}
