"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { errorCopy } from "@/lib/i18n";

// 에러 바운더리 폴백 본문. 예외가 던져졌을 때만 렌더되며, 점수·데이터·방향 로직 없이
// 시스템 상태 안내만 한다(빈 화면 방지). 기본(SSR) 로케일은 한국어.
export function ErrorContent({ reset }: { reset: () => void }) {
  const { locale } = useLanguage();
  const t = errorCopy[locale];
  return (
    <div className="max-w-xl mx-auto py-16 text-center space-y-5">
      <div className="flex justify-center" aria-hidden="true">
        <AlertTriangle className="h-12 w-12 text-amber-500 dark:text-amber-400 opacity-80" />
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t.title}</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {t.body1}<br />
        {t.body2}
      </p>
      <div className="flex gap-2 justify-center pt-3 flex-wrap">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-md text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
        >
          {t.retry}
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-md text-sm font-medium bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition"
        >
          {t.goHome}
        </Link>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{t.persistHint}</p>
    </div>
  );
}
