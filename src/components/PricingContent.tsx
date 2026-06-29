"use client";

import Link from "next/link";
import { WaitlistForm } from "@/components/WaitlistForm";
import { useLanguage } from "@/components/LanguageProvider";
import {
  pricingCopy,
  plansByLocale,
  compareRowsByLocale,
  type LocalizedPlan,
  type CellKind,
} from "@/lib/copy/pricing";

function PlanCard({
  plan,
  t,
}: {
  plan: LocalizedPlan;
  t: (typeof pricingCopy)["ko"] | (typeof pricingCopy)["en"];
}) {
  const planned = plan.status === "planned";
  const marker = plan.id === "free" ? "✓" : plan.id === "pro" ? "★" : "◆";
  const markerColor =
    plan.id === "free"
      ? "text-emerald-600 dark:text-emerald-400"
      : plan.id === "pro"
        ? "text-blue-600 dark:text-blue-400"
        : "text-violet-600 dark:text-violet-400";

  return (
    <section
      className={`relative bg-white dark:bg-zinc-900 rounded-xl p-5 min-w-0 ${
        plan.id === "pro"
          ? "border-2 border-blue-300 dark:border-blue-800"
          : plan.id === "premium"
            ? "border-2 border-violet-300 dark:border-violet-800"
            : "border border-zinc-200 dark:border-zinc-800"
      }`}
    >
      {planned && (
        <span
          className={`absolute -top-2.5 left-5 text-[10px] font-semibold px-2 py-0.5 rounded text-white ${
            plan.id === "pro" ? "bg-blue-600" : "bg-violet-600"
          }`}
        >
          {t.plannedBadge}
        </span>
      )}
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{plan.name}</h2>
        <span
          className={`text-sm font-bold shrink-0 ${
            plan.id === "free"
              ? "text-zinc-900 dark:text-zinc-100"
              : plan.id === "pro"
                ? "text-blue-700 dark:text-blue-400"
                : "text-violet-700 dark:text-violet-400"
          }`}
        >
          {plan.id === "free" ? plan.priceLabel : t.priceUndecided}
        </span>
      </div>
      {planned && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2 break-words leading-relaxed">
          {plan.priceLabel}
        </p>
      )}
      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 leading-relaxed break-words">
        {plan.valueLine}
      </p>
      <ul className="space-y-2">
        {plan.includes.map((f) => (
          <li key={f} className="text-sm text-zinc-700 dark:text-zinc-300 flex gap-2">
            <span className={`shrink-0 ${markerColor}`}>{marker}</span>
            <span className="break-words min-w-0">{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        {plan.id === "free" ? (
          <Link
            href="/today"
            className="block text-center px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            {t.freeCta}
          </Link>
        ) : (
          <>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 break-words">
              {t.waitlistPrompt}
            </p>
            <WaitlistForm source={`pricing-${plan.id}`} />
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 leading-relaxed break-words">
              {t.waitlistDataNote}
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function Cell({ kind, text }: { kind: CellKind; text?: string }) {
  if (kind === "yes") return <span className="text-emerald-600 dark:text-emerald-400">✓</span>;
  if (kind === "no") return <span className="text-zinc-400 dark:text-zinc-600">—</span>;
  return (
    <span
      className={`text-[11px] break-words ${
        kind === "planned"
          ? "text-amber-700 dark:text-amber-400"
          : kind === "betaFree"
            ? "text-sky-700 dark:text-sky-400"
            : "text-zinc-700 dark:text-zinc-300"
      }`}
    >
      {text}
    </span>
  );
}

export function PricingContent() {
  const { locale } = useLanguage();
  const t = pricingCopy[locale];
  const plans = plansByLocale(locale);
  const compareRows = compareRowsByLocale(locale);

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 space-y-6 py-8">
      <header className="text-center">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          {t.backHome}
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold mt-2 text-zinc-900 dark:text-zinc-100">{t.pageTitle}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed max-w-xl mx-auto break-words">
          {t.introLead1} <strong>{t.intro.free}</strong>{t.introLead2}{" "}
          <strong>{t.intro.proPremium}</strong>{t.introLead3}{" "}
          <strong className="text-amber-700 dark:text-amber-400">{t.intro.undecided}</strong>{t.introLead4}
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} t={t} />
        ))}
      </div>

      {/* 베타 무료 → 정식 출시 시 Pro 전환 안내 */}
      <section className="flex items-start gap-2.5 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/30 p-4">
        <span className="shrink-0 mt-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-600 text-white">{t.betaCard.badge}</span>
        <div className="text-xs text-sky-900 dark:text-sky-200 leading-relaxed break-words">
          <strong className="font-semibold">{t.betaCard.bodyStrong1}</strong> {t.betaCard.body2}{" "}
          <strong className="font-semibold">{t.betaCard.bodyStrong3}</strong>{t.betaCard.body4}{" "}
          <strong className="font-semibold text-amber-700 dark:text-amber-400">{t.betaCard.bodyStrong5}</strong>{t.betaCard.body6}
        </div>
      </section>

      {/* 기능 비교표 */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t.compare.title}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 break-words">
          ✓ {t.compare.legendYes} · — {t.compare.legendNo} · <span className="text-amber-700 dark:text-amber-400">{t.compare.legendPlanned}</span> {t.compare.legendPlannedNote} · <span className="text-sky-700 dark:text-sky-400">{t.compare.legendBeta}</span> {t.compare.legendBetaNote}
        </p>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
                <th className="text-left font-medium text-zinc-600 dark:text-zinc-400 px-3 py-2.5 break-words">{t.compare.colFeature}</th>
                <th className="text-center font-medium text-zinc-900 dark:text-zinc-100 px-2 py-2.5 w-16">{t.compare.colFree}</th>
                <th className="text-center font-medium text-blue-700 dark:text-blue-400 px-2 py-2.5 w-20">
                  Pro<span className="block text-[9px] font-normal text-zinc-400">{t.compare.colPlannedNote}</span>
                </th>
                <th className="text-center font-medium text-violet-700 dark:text-violet-400 px-2 py-2.5 w-20">
                  Premium<span className="block text-[9px] font-normal text-zinc-400">{t.compare.colPlannedNote}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row) => (
                <tr key={row.label} className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
                  <td className="px-3 py-2.5 text-zinc-700 dark:text-zinc-300 break-words">{row.label}</td>
                  <td className="px-2 py-2.5 text-center"><Cell kind={row.free.kind} text={row.free.text} /></td>
                  <td className="px-2 py-2.5 text-center"><Cell kind={row.pro.kind} text={row.pro.text} /></td>
                  <td className="px-2 py-2.5 text-center"><Cell kind={row.premium.kind} text={row.premium.text} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 break-words leading-relaxed">
          {t.compare.footer1}{" "}
          {t.compare.footer2a} <strong className="text-sky-700 dark:text-sky-400">{t.compare.footer2Strong}</strong>{t.compare.footer2b}
        </p>
      </section>

      {/* §13.2 서비스 공통 고지 */}
      <section className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 text-xs text-amber-800 dark:text-amber-300 leading-relaxed break-words">
        {t.legalBody1}<strong>{t.legalStrong1}</strong>{t.legalBody2}<strong>{t.legalStrong2}</strong>{t.legalBody3}<strong>{t.legalStrong3}</strong>
      </section>
    </div>
  );
}
