"use client";

import Link from "next/link";
import { ScoreTooltip } from "@/components/ScoreTooltip";
import { scoreColorOf } from "@/lib/scoreColor";
import { useLanguage } from "@/components/LanguageProvider";
import { scoreBasisCopy, stockDetailCopy } from "@/lib/copy/stockDetail";
import type { Locale } from "@/lib/i18n";
import type { ScoreBasis, BasisPart } from "@/lib/scoreBasis";

/**
 * 종합 점수 근거 보기(설계서 2 §5.1~5.2).
 * 종합점수 = 4지표 동일 가중(각 25%) 평균임을 명시하고, 지표별로
 *  - 점수(0~100) + 구간색 막대
 *  - 종합 기여 ≈ N점(가중 25%)
 *  - 전체 상대순위 + 상위/하위 %
 *  - 점수를 만든 실데이터 근거(factor 칩) — 없으면 결측 안내(중립 회색)
 *  - 강점/주의 한 줄(metricReadings 단일 소스 재사용)
 * 를 보여준다. 순수 HTML/Tailwind — 신규 npm 0, 반응형(390px) 가드.
 */
export function ScoreBasisBreakdown({ basis }: { basis: ScoreBasis }) {
  const { locale } = useLanguage();
  const t = scoreBasisCopy[locale];
  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <strong className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.title}</strong>
        <ScoreTooltip kind="composite" size="md" />
      </div>

      <p className="text-xs md:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
        {t.introBefore} <strong className="tabular-nums">{basis.composite}{t.introPoint}</strong> {t.introMid}{" "}
        <strong>{t.introWeight}</strong>{t.introAfter}
      </p>

      {/* 점수 ≠ 순위 — 카드 내 1곳에만 명시(과잉 반복 금지) */}
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug bg-zinc-50 dark:bg-zinc-800/50 rounded-md px-2.5 py-2 break-words">
        <span className="font-semibold text-zinc-600 dark:text-zinc-300">{t.scoreVsRankBold}</span> {t.scoreVsRankRest}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {basis.parts.map((p) => (
          <BasisRow key={p.kind} part={p} locale={locale} />
        ))}
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2.5">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug break-words">
          {t.footerBefore} <strong className="text-zinc-600 dark:text-zinc-300">{t.footerBold}</strong>{t.footerMid}{" "}
          <Link href="/guide/metrics" className="text-blue-700 dark:text-blue-400 underline">{t.footerLink}</Link>{t.footerAfter}
        </p>
      </div>
    </section>
  );
}

function BasisRow({ part, locale }: { part: BasisPart; locale: Locale }) {
  const t = scoreBasisCopy[locale];
  const label = stockDetailCopy[locale].metricLabels[part.kind];
  const v = part.score;
  const c = scoreColorOf(v);
  const r = part.reading;
  const cautionTag = r.tone === "caution";
  const isTop = part.topPct <= 50;

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {label}
          <ScoreTooltip kind={part.kind} />
        </span>
        <span className={"text-[10px] font-medium shrink-0 " + c.text}>{c.label}</span>
      </div>

      {/* 점수(0~100) */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-[10px] text-zinc-600 dark:text-zinc-300">{t.scoreLabel}</span>
        <span className={"text-2xl font-bold leading-none tabular-nums " + c.text}>{v}</span>
        <span className="text-[11px] text-zinc-600 dark:text-zinc-300 tabular-nums">/ 100</span>
      </div>

      <div className={"relative h-1.5 w-full rounded-full overflow-hidden " + c.barTrack} aria-hidden="true">
        <div className={"absolute inset-y-0 left-0 rounded-full " + c.barFill} style={{ width: `${v}%` }} />
      </div>

      {/* 종합 기여 + 상대순위 */}
      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums leading-snug">
        {t.contributionPrefix} <strong className="text-zinc-700 dark:text-zinc-300">{part.contributionPts}{t.contributionPoint}</strong> <span className="text-zinc-600 dark:text-zinc-300">{t.weightPrefix} {part.weightPct}{t.weightSuffix}</span>
      </div>
      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums leading-snug">
        {t.rankPrefix} <strong className="text-zinc-700 dark:text-zinc-300">{part.rank}</strong> / {part.total}{t.rankSuffix}
        <span className="text-zinc-600 dark:text-zinc-300"> · {isTop ? `${t.topPctPrefix} ${part.topPct}%` : `${t.bottomPctPrefix} ${100 - part.topPct}%`}</span>
      </div>

      {/* 점수를 만든 실데이터 근거 칩 — 없으면 결측 안내(중립 회색) */}
      {part.factors.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {part.factors.map((f) => (
            <span
              key={f.label}
              className="inline-flex items-baseline gap-1 rounded-md bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 px-1.5 py-1 text-[10px] text-zinc-600 dark:text-zinc-300 min-w-0 break-words"
            >
              <span className="text-zinc-600 dark:text-zinc-300">{f.label}</span>
              <span className="font-semibold tabular-nums">{f.value}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-zinc-600 dark:text-zinc-300 leading-snug break-words">{part.missingNote}</p>
      )}

      {part.extraNote ? (
        <p className="text-[10px] text-zinc-600 dark:text-zinc-300 leading-snug break-words">{part.extraNote}</p>
      ) : null}

      {/* 모멘텀 국면 — 1·3·6개월 부호 기반. 장·단기 방향이 어긋나는 국면(divergent)은
          한 줄 해석으로 뭉개지 않도록 별도 라벨+설명으로 대비를 그대로 노출한다. */}
      {part.kind === "momentum" && part.regime && part.regime.key !== "unavailable" ? (
        (() => {
          const rg = t.momentumRegime.labels[part.regime.key];
          const divergent = part.regime.divergent;
          return (
            <div
              className={
                "rounded-md px-2 py-1.5 border text-[10px] leading-snug break-words " +
                (divergent
                  ? "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50")
              }
            >
              <span
                className={
                  "font-semibold " +
                  (divergent ? "text-amber-700 dark:text-amber-300" : "text-zinc-600 dark:text-zinc-300")
                }
              >
                {t.momentumRegime.prefix} · {rg.label}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400"> — {rg.note}</span>
              <span className="mt-1 block text-[9px] text-zinc-600 dark:text-zinc-300">{t.momentumRegime.caption}</span>
            </div>
          );
        })()
      ) : null}

      {/* 강점/주의 — metricReadings 단일 소스 */}
      <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-snug break-words">
        <span className="font-semibold text-zinc-500 dark:text-zinc-400">{t.interpretLabel}</span> {r.meaning}
      </p>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug flex gap-1 break-words">
        <span className={"shrink-0 font-semibold " + (cautionTag ? "text-amber-700 dark:text-amber-300" : "text-blue-600 dark:text-blue-400")}>
          {cautionTag ? t.cautionTag : t.confirmTag}
        </span>
        <span>{r.action}</span>
      </p>
    </div>
  );
}
