"use client";

import { Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  readingsOf,
  getChecklistByPattern,
  type Reading,
  type StockShape,
} from "@/lib/metricReadings";
import { StockDetailActionButtons } from "@/components/stock/StockDetailActionButtons";
import { useLanguage } from "@/components/LanguageProvider";
import { beginnerReadingCopy } from "@/lib/copy/stockDetail";

/**
 * 점수를 초보자가 이해할 수 있는 한 줄 행동 가이드로 번역.
 * - "이 종목은 좋아? 나빠?" 가 아니라 "뭘 더 확인해야 해?" 에 답한다.
 * 해석/체크리스트 문구는 @/lib/metricReadings 단일 소스에서 가져온다(지표 카드와 공유).
 */

// 점수 → 공시 → 재무 순서로 '먼저 확인할 것'을 안내(설계서 §9.5). 투자 추천이 아니라 확인 순서.
const CONFIRM_HREFS = ["#basis", "#disclosures", "#financials"] as const;

function StepCard({ item, href, index }: { item: { step: string; detail: string }; href: string; index: number }) {
  return (
    <a
      href={href}
      className="block h-full rounded-lg border border-blue-100 dark:border-blue-950 bg-white dark:bg-zinc-900 p-3 shadow-sm hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 transition group"
    >
      <div className="mb-2">
        <span className="inline-flex items-center rounded-md bg-blue-600 px-2 py-1 text-[10px] font-bold tracking-wide text-white tabular-nums">
          STEP {index + 1}
        </span>
      </div>
      <div className="text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition">
        {item.step}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        {item.detail}
      </p>
    </a>
  );
}

export function BeginnerReading({ s }: { s: StockShape }) {
  const { locale } = useLanguage();
  const t = beginnerReadingCopy[locale];
  const readings: Reading[] = readingsOf(s);
  const checklist = getChecklistByPattern(s);

  const toneStyles: Record<Reading["tone"], string> = {
    good: "border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20",
    watch: "border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40",
    caution: "border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20",
  };

  const toneIcon: Record<Reading["tone"], React.ReactNode> = {
    good: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
    watch: <Lightbulb className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />,
    caution: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
  };

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center">
          <Lightbulb className="w-4 h-4" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-sm md:text-base font-semibold text-zinc-900 dark:text-zinc-100">{t.heading}</h2>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{t.subheading}</p>
        </div>
      </div>

      {/* 헤드라인 — 점수 패턴 요약 */}
      <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-md p-3 mb-3">
        <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5 uppercase tracking-wider">{t.currentLabel}</div>
        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">{checklist.headline}</div>
      </div>

      {/* 먼저 확인할 것 — 점수 → 공시 → 재무 STEP 카드(설계서 §9.5·§3 번호 중복 제거). ol 자동 번호 대신 STEP n 단일 표기 */}
      <div className="rounded-md border border-blue-100 dark:border-blue-950 bg-blue-50/40 dark:bg-blue-950/20 p-3 mb-3">
        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{t.firstCheckTitle} <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400">{t.firstCheckHint}</span></div>
        {/* 정적 텍스트/스크린리더에서 한 문단으로 붙지 않도록 ol > li 로 분리(설계서 §9.5 / 재검수 P2-2). 가시 번호는 STEP n 배지가 단일 소스 → list-none */}
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-2.5 list-none p-0 m-0">
          {t.steps.map((c, i) => (
            <li key={CONFIRM_HREFS[i]} className="h-full">
              <StepCard item={c} href={CONFIRM_HREFS[i]} index={i} />
            </li>
          ))}
        </ol>
      </div>

      {/* 이 종목에서 특히 — 점수 패턴별 추가 확인 항목 */}
      <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-md p-3 mb-3">
        <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{t.specialTitle}</div>
        <div className="space-y-1">
          {checklist.items.map((item, i) => (
            <div key={i} className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed flex gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0">·</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 다음으로 확인하기 — 초보자 해석 카드 안 직접 CTA (설계서 §9 / [P1-3]) */}
      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-3 mb-3">
        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{t.nextTitle}</div>
        <StockDetailActionButtons />
      </div>

      {/* 지표별 한 줄 해석 — 기본 접힘 */}
      <details className="mt-1">
        <summary className="text-xs text-blue-700 dark:text-blue-400 cursor-pointer select-none">{t.detailToggle}</summary>
        <div className="space-y-1.5 mt-2">
        {readings.map((r) => (
          <div
            key={r.label}
            className={"border rounded-md p-2.5 " + toneStyles[r.tone]}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{r.emoji}</span>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{r.label}</span>
              <span className="text-xs font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
                {Math.round(r.score)}
              </span>
              <span className="ml-auto">{toneIcon[r.tone]}</span>
            </div>
            <div className="text-[11px] text-zinc-700 dark:text-zinc-300 mb-0.5 leading-snug">
              <strong>{r.meaning}</strong>
            </div>
            <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
              → {r.action}
            </div>
          </div>
        ))}
        </div>
      </details>

      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 leading-relaxed">
        {t.disclaimer}
      </p>
    </section>
  );
}
