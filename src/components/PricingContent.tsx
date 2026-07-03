"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { pricingCopy } from "@/lib/copy/pricing";
import { FOCUS_RING } from "@/components/ui/controlStyles";

// 무료 베타 안내 페이지(/pricing). v1 결정(무료 베타)에 따라 공개 화면에서는
// Pro/Premium 비교·가격 미확정·전환 안내·waitlist를 노출하지 않는다.
// (플랜 데이터/카피 키와 WaitlistForm 컴포넌트는 내부/추후용으로 코드에 보존.)
export function PricingContent() {
  const { locale } = useLanguage();
  const t = pricingCopy[locale];
  const fb = t.freeBeta;

  return (
    <div className="max-w-2xl mx-auto px-3 md:px-4 space-y-6 py-8">
      <header className="text-center">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          {t.backHome}
        </Link>
        <div className="mt-3 flex justify-center">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sky-600 text-white">
            {fb.badge}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mt-3 text-zinc-900 dark:text-zinc-100">
          {fb.headline}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3 leading-relaxed max-w-xl mx-auto break-words">
          {fb.body}
        </p>
      </header>

      {/* 지금 무료로 쓸 수 있는 것 */}
      <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          {fb.includesTitle}
        </h2>
        <ul className="space-y-2">
          {fb.includes.map((f) => (
            <li key={f} className="text-sm text-zinc-700 dark:text-zinc-300 flex gap-2">
              <span className="shrink-0 text-emerald-600 dark:text-emerald-400">✓</span>
              <span className="break-words min-w-0">{f}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <Link
            href="/today"
            className={`flex items-center justify-center text-center px-4 py-2.5 min-h-[44px] rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition ${FOCUS_RING}`}
          >
            {fb.cta}
          </Link>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed break-words">
          {fb.noPaidNote}
        </p>
      </section>

      {/* §13.2 서비스 공통 고지 */}
      <section className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 text-xs text-amber-800 dark:text-amber-300 leading-relaxed break-words">
        {t.legalBody1}<strong>{t.legalStrong1}</strong>{t.legalBody2}<strong>{t.legalStrong2}</strong>{t.legalBody3}<strong>{t.legalStrong3}</strong>
      </section>
    </div>
  );
}
