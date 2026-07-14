"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { homeCopy } from "@/lib/copy/home";

// 홈 하단 데이터 출처 + 비자문 고지 + 정책 링크 — 서버 page.tsx에서 분리한 다국어 표시부.
// 첫 방문 UX 대정리 Slice C: 큰 위험 고지 카드를 없애고 짧은 비자문 한 줄을 이 푸터로 통합한다.
export function HomeDataSourceFooter({ count, dataAsOf }: { count: number; dataAsOf: string }) {
  const { locale } = useLanguage();
  const t = homeCopy[locale].dataSource;
  return (
    <section className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed border-t border-zinc-200 dark:border-zinc-800 pt-4">
      <p className="text-zinc-600 dark:text-zinc-400">{t.notAdvice}</p>
      <p className="mt-2">
        <strong className="text-zinc-700 dark:text-zinc-300">{t.label}</strong> {t.bodyA}{count}{t.bodyMid}{dataAsOf}{t.bodyEnd}
      </p>
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
