"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { notFoundCopy } from "@/lib/i18n";

// 404 폴백 본문. metadata는 서버 not-found.tsx에 남기고, 보이는 문구만 로케일 전환한다.
// 기본(SSR) 로케일은 한국어라 검색엔진/무JS 환경에서도 한국어로 렌더된다.
export function NotFoundContent() {
  const { locale } = useLanguage();
  const t = notFoundCopy[locale];
  return (
    <div className="max-w-xl mx-auto py-16 text-center space-y-5">
      <div className="text-6xl opacity-60" aria-hidden="true">🔍</div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t.title}</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {t.body1}<br />
        {t.body2}
      </p>
      <div className="flex gap-2 justify-center pt-3 flex-wrap">
        <Link
          href="/stocks"
          className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-md text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
        >
          {t.browseStocks}
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-md text-sm font-medium bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition"
        >
          {t.goHome}
        </Link>
      </div>
    </div>
  );
}
