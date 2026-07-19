"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";

type AppFooterProps = {
  globalAsOfLabel: string;
  metricsVersionLabel: string;
  dataStale: boolean;
  commitSha?: string;
};

export function AppFooter({
  globalAsOfLabel,
  metricsVersionLabel,
  dataStale,
  commitSha,
}: AppFooterProps) {
  const { copy } = useLanguage();

  return (
    <footer className="max-w-5xl mx-auto px-3 md:px-4 pb-10 pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-600 dark:text-zinc-300">
      <span className="tabular-nums" title={commitSha ? `${copy.footer.code} ${commitSha}` : undefined}>
        {copy.footer.dataPrefix} {globalAsOfLabel} {copy.footer.marketClose}
      </span>
      <span>·</span>
      <span>
        {copy.footer.metricsPrefix} {metricsVersionLabel}
      </span>
      <span>·</span>
      <Link
        href="/status"
        className={
          (dataStale
            ? "text-amber-700 dark:text-amber-300"
            : "text-emerald-700 dark:text-emerald-300") + " inline-flex min-h-8 items-center hover:underline"
        }
      >
        {copy.footer.dataStatus} {dataStale ? copy.footer.dataStale : copy.footer.dataNormal}
      </Link>
      <span>·</span>
      <span>{copy.footer.disclaimer}</span>
      <span>·</span>
      <Link href="/about" className="inline-flex min-h-8 items-center hover:text-zinc-900 dark:hover:text-white underline">
        {copy.footer.about}
      </Link>
      <Link href="/pricing" className="inline-flex min-h-8 items-center hover:text-zinc-900 dark:hover:text-white underline">
        {copy.footer.pricing}
      </Link>
      <Link href="/terms" className="inline-flex min-h-8 items-center hover:text-zinc-900 dark:hover:text-white underline">
        {copy.footer.terms}
      </Link>
      <Link href="/privacy" className="inline-flex min-h-8 items-center hover:text-zinc-900 dark:hover:text-white underline">
        {copy.footer.privacy}
      </Link>
      <Link href="/data-deletion" className="inline-flex min-h-8 items-center hover:text-zinc-900 dark:hover:text-white underline">
        {copy.footer.dataDeletion}
      </Link>
      <Link href="/status#report" className="inline-flex min-h-8 items-center hover:text-zinc-900 dark:hover:text-white underline">
        {copy.footer.report}
      </Link>
    </footer>
  );
}
