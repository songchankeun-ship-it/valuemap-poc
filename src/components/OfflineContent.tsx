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
        <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-500 leading-relaxed">
          {t.addNote}
        </p>
      </div>

      <div className="mt-6 flex gap-2 justify-center flex-wrap">
        <button
          type="button"
          onClick={() => {
            // 재연결 후 현재 화면을 다시 불러온다. SSR/무window 환경에선 안전하게 무시.
            if (typeof window !== "undefined") window.location.reload();
          }}
          className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium"
        >
          {t.retryButton}
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-medium"
        >
          {t.homeButton}
        </Link>
      </div>
    </div>
  );
}
