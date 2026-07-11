"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { metricsGuideCopy } from "@/lib/copy/metricsGuide";

// 지표별 id(anchor)·색상 클래스는 표시 텍스트와 분리해 고정한다.
// (#momentum 등 앵커, Tailwind 정적 스캔 대상 색상 클래스는 절대 번역하지 않는다.)
const METRIC_META = [
  { key: "momentum", id: "momentum", color: "bg-blue-500" },
  { key: "flow", id: "flow", color: "bg-green-500" },
  { key: "value", id: "value", color: "bg-cyan-500" },
  { key: "vol", id: "vol", color: "bg-orange-500" },
] as const;

interface MetricsGuideContentProps {
  /** 서버에서 계산한 전체 풀 종목 수 (dataMetadata.count). */
  count: number;
  /** dataStatus.metricsVersionLabel — "Metrics 2.4" (번역 금지). */
  metricsVersionLabel: string;
  /** dataStatus.metricsEffectiveDate — "YYYY.MM.DD" 또는 undefined. */
  metricsEffectiveDate?: string;
}

export function MetricsGuideContent({
  count,
  metricsVersionLabel,
  metricsEffectiveDate,
}: MetricsGuideContentProps) {
  const { locale } = useLanguage();
  const t = metricsGuideCopy[locale];

  // 색상/앵커(META)와 표시 텍스트(copy)를 key로 결합.
  const metrics = METRIC_META.map((meta) => {
    const copy = t.metrics.find((m) => m.key === meta.key)!;
    return { ...meta, ...copy };
  });

  const reviewItems = t.reviewPoints.items(count);
  const commonItems = t.commonBasis.items(count);

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <header>
        <Link href="/" className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">{t.backHome}</Link>
        <h1 className="text-2xl font-bold mt-2 text-zinc-900 dark:text-zinc-100">{t.headerTitle}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
          {t.headerLead}
        </p>
      </header>

      <nav aria-label={t.navLabel} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 flex gap-2 flex-wrap text-xs">
        <span className="text-zinc-500 dark:text-zinc-400 font-medium">{t.navLabel}</span>
        <ul className="flex gap-2 flex-wrap list-none">
          {metrics.map((m) => (
            <li key={m.id}>
              <Link href={"#" + m.id} className="text-blue-700 dark:text-blue-400 hover:underline">{m.name}</Link>
            </li>
          ))}
          <li>
            <Link href="#faq" className="text-blue-700 dark:text-blue-400 hover:underline">{t.seoFaq.title}</Link>
          </li>
          <li>
            <Link href="#glossary" className="text-blue-700 dark:text-blue-400 hover:underline">{t.glossary.title}</Link>
          </li>
        </ul>
      </nav>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
        <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
          <strong>{t.notInvestmentAdvice.leadStrong}</strong> {t.notInvestmentAdvice.body(count)}
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 space-y-2">
        <h2 className="text-sm font-semibold text-blue-900 dark:text-blue-200">{t.reviewPoints.title}</h2>
        <ul className="list-none pl-0 space-y-1.5 text-xs text-blue-900/90 dark:text-blue-200/90 leading-relaxed">
          {reviewItems.map((item, i) => (
            <li key={i}>· {item}</li>
          ))}
        </ul>
      </div>

      {metrics.map((m, i) => (
        <section key={m.key} id={m.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-5 scroll-mt-24">
          <div className="flex items-center gap-3 mb-3">
            <span className={"w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold " + m.color}>
              {i + 1}
            </span>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{m.name}</h2>
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3 leading-relaxed">{m.desc}</p>

          <details className="bg-zinc-50 dark:bg-zinc-800/50 rounded-md p-3 mb-3">
            <summary className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide cursor-pointer select-none">{t.metricSection.calcSummary}</summary>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed mt-2">{m.calc}</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1.5 pt-1.5 border-t border-zinc-200 dark:border-zinc-700">{m.detail(count)}</p>
          </details>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-md p-3">
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">{t.metricSection.highTitle}</div>
              <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">{m.high}</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/20 rounded-md p-3">
              <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 mb-1">{t.metricSection.lowTitle}</div>
              <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">{m.low}</p>
            </div>
          </div>
        </section>
      ))}

      <section className="bg-zinc-900 text-white rounded-lg p-3 md:p-5">
        <h2 className="text-lg font-semibold mb-2">{t.composite.title}</h2>
        <p className="text-sm text-zinc-300 leading-relaxed mb-3">
          {t.composite.body}<strong className="text-white">{t.composite.bodyStrong}</strong>{t.composite.bodyTail}
        </p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {t.composite.note}<strong className="text-white">{t.composite.noteStrong}</strong>{t.composite.noteTail}
        </p>
      </section>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-5">
        <h2 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-zinc-100">{t.commonBasis.title}</h2>
        <ul className="list-none pl-0 space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {commonItems.map((item, i) => (
            <li key={i}>· {item}</li>
          ))}
          <li>· <strong className="text-zinc-900 dark:text-zinc-100">{t.commonBasis.versionPrefix}{metricsVersionLabel}</strong>{metricsEffectiveDate ? <span className="text-zinc-500 dark:text-zinc-400">{t.commonBasis.appliedPrefix}{metricsEffectiveDate}</span> : null}{t.commonBasis.samePolicy} <Link href="/guide/metrics/changelog" className="text-blue-700 dark:text-blue-400 hover:underline">{t.commonBasis.changelogLink}</Link></li>
          <li>· {t.commonBasis.codeIntro}<a href="https://github.com/songchankeun-ship-it/valuemap-poc/blob/main/scripts/compute_metrics.py" className="text-blue-700 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">compute_metrics.py</a>{t.commonBasis.codeGenerator}<a href="https://github.com/songchankeun-ship-it/valuemap-poc/blob/main/src/lib/metrics.ts" className="text-blue-700 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">metrics.ts</a>{t.commonBasis.codeReference}<strong>{t.composite.noteStrong}</strong>{t.commonBasis.codeNote}</li>
        </ul>
      </section>

      <section id="faq" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-5 scroll-mt-24">
        <h2 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-zinc-100">{t.seoFaq.title}</h2>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">{t.seoFaq.note}</p>
        <div className="space-y-2.5">
          {t.seoFaq.items.map((item) => (
            <details key={item.question} className="border-b border-zinc-200 dark:border-zinc-800 pb-2.5 last:border-b-0 last:pb-0">
              <summary className="cursor-pointer select-none text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.question}</summary>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="glossary" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-5 scroll-mt-24">
        <h2 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-zinc-100">{t.glossary.title}</h2>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">{t.glossary.note}</p>
        <dl className="space-y-2.5">
          {t.glossary.items.map((g) => (
            <div key={g.term} className="text-xs leading-relaxed sm:grid sm:grid-cols-[9rem_1fr] sm:gap-3">
              <dt className="font-semibold text-zinc-900 dark:text-zinc-100">{g.term}</dt>
              <dd className="text-zinc-600 dark:text-zinc-400 mt-0.5 sm:mt-0">{g.def}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <strong className="text-zinc-700 dark:text-zinc-300">{t.footer.sourcePrefix}</strong>{t.footer.body(count)}
      </section>
    </div>
  );
}
