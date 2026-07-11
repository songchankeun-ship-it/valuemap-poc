"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { homeCopy } from "@/lib/copy/home";
import { typeMetaOf } from "@/lib/disclosureType";

export interface DisclosureSignalVM {
  rceptNo: string;
  signalType: string;
  signalLabel: string;
  corpName: string;
  reportNm: string;
  dateLabel: string;
  inUniv: boolean;
  code: string;
  dartUrl: string;
}

// 오늘 먼저 볼 공시 신호 카드 — 호재/악재 판단이 아니라 '무엇을 확인할지'를 보여준다.
export function DisclosureSignalCard({ s }: { s: DisclosureSignalVM }) {
  const { locale } = useLanguage();
  const t = homeCopy[locale].disclosure;
  const checkPoint = t.checkByLabel[s.signalLabel] ?? t.check[s.signalType] ?? t.check.default;
  const meta = typeMetaOf(s.signalType);
  const Icon = meta.Icon;
  return (
    <div className="flex flex-col rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className={"inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-medium " + meta.badgeBg + " " + meta.badgeText + " " + meta.badgeBorder}>
          <Icon className="w-3 h-3" strokeWidth={1.8} aria-hidden="true" />
          {s.signalLabel} · {t.autoClassified}
        </span>
        {!s.inUniv ? <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{t.outOfUniverse}</span> : null}
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums ml-auto">{s.dateLabel}</span>
      </div>
      <div className="flex items-baseline gap-1.5 min-w-0">
        <div className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">{s.corpName}</div>
        {s.code ? <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0">{s.code}</span> : null}
      </div>
      <p className="text-[12px] text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-snug">{s.reportNm}</p>

      <div className="mt-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800 px-3 py-2.5">
        <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-0.5">{t.checkLabel}</div>
        <p className="text-[11px] leading-snug text-zinc-700 dark:text-zinc-300">{checkPoint}</p>
      </div>

      <div className="flex items-center gap-2 mt-3">
        {s.inUniv ? (
          <Link prefetch={false} href={"/stock/" + s.code} className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1 text-center px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[12px] font-medium text-zinc-900 dark:text-zinc-100 hover:border-blue-400 dark:hover:border-blue-700 transition">
            {t.viewStock}
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
          </Link>
        ) : null}
        <a href={s.dartUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1 text-center px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[12px] font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 transition">
          {t.dartOriginal}
          <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
