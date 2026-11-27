"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { todayCopy } from "@/lib/copy/today";
import { candidateMetrics, type TodayCandidateEvidence } from "@/lib/todayCandidateEvidence";

export function TodayTopEvidence({ evidence }: { evidence: TodayCandidateEvidence }) {
  const { locale } = useLanguage();
  const { topEvidence: t, metric: labels } = todayCopy[locale];
  const { change, volume, next } = evidence;
  const digits = new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US", { maximumFractionDigits: 1 });
  const ratioDigits = new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US", { maximumFractionDigits: 2 });
  const signed = (value: number) => (value > 0 ? "+" : "") + digits.format(value);
  const unit = t.points;
  const dates = change.previousDate && change.asOf ? `${change.previousDate} → ${change.asOf}` : null;
  const checkText = t.next[next.kind];
  const linkClass = "research-link inline-flex min-h-9 items-center gap-1 text-sm break-keep";

  return (
    <div className="space-y-1.5">
      <div className="space-y-0.5">
        <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
          <span className="research-section-label">{t.scoreChange}</span>
          {dates && <span className="tabular-nums text-[var(--muted)]">{dates}</span>}
        </p>
        {change.kind === "compared" ? (
          <>
            <p className="text-sm tabular-nums">
              {digits.format(change.before)} → {digits.format(change.after)}{unit}
              {" · "}<strong>{change.delta === 0 ? t.unchanged : signed(change.delta) + unit}</strong>
            </p>
            <dl className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs tabular-nums">
              {candidateMetrics.map((key) => {
                const delta = change.metrics[key];
                return (
                  <div key={key} className="inline-flex items-baseline gap-1">
                    <dt className="text-[var(--muted)]">{labels[key]}</dt>
                    <dd>
                      {delta === undefined ? t.metricUnknown : key === change.leadingMetric ? (
                        <strong><span className="sr-only">{t.largestMove} </span>{signed(delta) + unit}</strong>
                      ) : signed(delta) + unit}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </>
        ) : (
          <p className="text-sm leading-snug text-[var(--muted)] break-keep">{t.missing[change.reason]}</p>
        )}
      </div>
      <p className="flex flex-wrap gap-x-2 text-xs leading-snug text-[var(--muted)] tabular-nums">
        {volume ? (
          <>
            <span>{t.avg5} {digits.format(volume.avg5)}{t.shares}</span>
            <span>{t.avg20} {digits.format(volume.avg20)}{t.shares}</span>
            <strong className="text-[var(--foreground)]">{ratioDigits.format(volume.ratio)}{t.times}</strong>
          </>
        ) : t.volumeUnavailable}
      </p>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="research-section-label">{t.nextLabel}</span>
        {next.kind === "filing" ? (
          <a href={next.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <span>{next.filingTitle ? `${checkText}: ${next.filingTitle}` : checkText}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </a>
        ) : (
          <Link href={next.href} prefetch={false} className={linkClass}>
            <span>{checkText}</span>
            <ArrowDownRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
