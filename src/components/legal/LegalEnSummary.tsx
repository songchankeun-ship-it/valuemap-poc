"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { legalEnSummaryCopy } from "@/lib/copy/legal";

/**
 * 법률 페이지(/terms · /privacy) 상단의 영어 요약 블록.
 * locale === "en"일 때만 렌더링하며, ko에서는 null을 반환해 한국어 본문만 보이게 한다.
 * 정식 영어 법률 번역이 아니라 요약 + "정식 영어 번역 보류" 고지임을 분명히 한다.
 */
export function LegalEnSummary({ surface }: { surface: "terms" | "privacy" }) {
  const { locale } = useLanguage();
  if (locale !== "en") return null;

  const t = legalEnSummaryCopy.en;
  const section = surface === "terms" ? t.terms : t.privacy;

  return (
    <section className="not-prose mb-8 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20 p-4 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
          EN
        </span>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {section.title}
        </span>
      </div>

      <p className="text-[13px]">{section.intro}</p>

      {surface === "privacy" ? (
        <div className="mt-3 space-y-3">
          <div>
            <div className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
              {t.privacy.processorsTitle}
            </div>
            <p className="text-[13px] mt-1">{t.privacy.processorsDesc}</p>
          </div>
          <div>
            <div className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
              {t.privacy.crossBorderTitle}
            </div>
            <p className="text-[13px] mt-1">{t.privacy.crossBorderDesc}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        <div className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          {surface === "terms" ? "Sections" : "Sections"}
        </div>
        <ul className="list-disc list-inside space-y-0.5 ml-1 text-[13px]">
          {section.headings.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </div>

      <p className="mt-3 rounded-md border border-amber-300/70 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 px-3 py-2 text-[12px] text-amber-800 dark:text-amber-300">
        {t.pendingNote}
      </p>
    </section>
  );
}
