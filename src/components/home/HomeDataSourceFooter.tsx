"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { homeCopy } from "@/lib/copy/home";

// 홈 하단 데이터 출처 + 정책 링크 — 서버 page.tsx에서 분리한 다국어 표시부.
export function HomeDataSourceFooter({ count, dataAsOf }: { count: number; dataAsOf: string }) {
  const { locale } = useLanguage();
  const t = homeCopy[locale].dataSource;
  return (
    <section className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed border-t border-zinc-200 dark:border-zinc-800 pt-4">
      <strong className="text-zinc-700 dark:text-zinc-300">{t.label}</strong> {t.bodyA}{count}{t.bodyMid}{dataAsOf}{t.bodyEnd}
      <div className="mt-3 flex items-center gap-3 text-zinc-400 dark:text-zinc-500">
        <Link href="/about" className="hover:text-zinc-700 dark:hover:text-zinc-300 underline">{t.about}</Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-zinc-700 dark:hover:text-zinc-300 underline">{t.terms}</Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-zinc-700 dark:hover:text-zinc-300 underline">{t.privacy}</Link>
      </div>
    </section>
  );
}
