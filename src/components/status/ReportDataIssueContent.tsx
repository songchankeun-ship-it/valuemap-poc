"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { reportIssueCopy } from "@/lib/copy/status";
import { ReportDataIssueForm } from "./ReportDataIssueForm";
import type { DataIssueField } from "@/lib/dataStatus";
import type { Locale } from "@/lib/i18n";

/**
 * 데이터 오류 신고 진입점 — 클라이언트 표시부.
 * 서버 래퍼가 로케일별 mailto·신고 필드·기준일/산식 라벨을 props로 넘기고,
 * 여기서 useLanguage()로 로케일을 골라 렌더한다. 헤딩/안내 문구는 reportIssueCopy에서 읽는다.
 */
export function ReportDataIssueContent({
  mailtoByLocale,
  fieldsByLocale,
  asOfLabelByLocale,
  versionLabelByLocale,
  className = "",
}: {
  mailtoByLocale: Record<Locale, string>;
  fieldsByLocale: Record<Locale, DataIssueField[]>;
  asOfLabelByLocale: Record<Locale, string>;
  versionLabelByLocale: Record<Locale, string>;
  className?: string;
}) {
  const { locale } = useLanguage();
  const t = reportIssueCopy[locale];
  const mailto = mailtoByLocale[locale];
  const fields = fieldsByLocale[locale];
  const asOf = asOfLabelByLocale[locale];
  const version = versionLabelByLocale[locale];

  return (
    <section
      id="report"
      className={
        "scroll-mt-20 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-4 " +
        className
      }
    >
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{t.heading}</div>
      <p className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{t.intro}</p>

      <ul className="mt-3 space-y-1.5 text-[12px] text-zinc-700 dark:text-zinc-300">
        {fields.map((f) => (
          <li key={f.label} className="flex gap-2 min-w-0">
            <span className="text-zinc-400 dark:text-zinc-500 shrink-0" aria-hidden="true">•</span>
            <span className="min-w-0 break-words">
              <strong className="font-medium text-zinc-900 dark:text-zinc-100">{f.label}</strong>
              <span className="text-zinc-500 dark:text-zinc-400"> — {f.hint}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={mailto}
          className="inline-flex items-center min-h-[44px] px-4 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
        >
          {t.mailButton}
        </a>
        <ReportDataIssueForm asOfDate={asOf} metricsVersion={version} />
      </div>

      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 leading-relaxed">
        {t.autofillPrefix}{asOf}{t.autofillMid}{version}{t.autofillSuffix}{" "}
        {t.storeNotePrefix}<code className="text-[10px]">data_reports</code>{t.storeNoteMid}<code className="text-[10px]">/admin/status</code>{t.storeNoteSuffix}
      </p>
    </section>
  );
}
