"use client";

import { useState } from "react";
import { ChevronDown, Info, ExternalLink } from "lucide-react";
import type { SignalGuide } from "@/lib/signalGuide";
import { typeMetaOf } from "@/lib/disclosureType";

/**
 * 각 공시 신호 카드 하단에 펼쳐지는 '이 공시 이해하기' 가이드.
 * 호재/악재 단정 X, '확인 필요 신호' 로 분류.
 * 설계서 §10.6: 공시 타입 · 일반적 의미 · 확인 항목 · 원문 링크를 인라인 펼침으로 제공한다.
 */
export function SignalGuideExpand({
  guide,
  url,
  ariaLabel = "이 공시 이해하기",
  sourceAriaLabel = "DART 원문 보기",
}: {
  guide: SignalGuide;
  url?: string;
  ariaLabel?: string;
  sourceAriaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const meta = typeMetaOf(guide.type);
  const TypeIcon = meta.Icon;

  const toneStyles = {
    info: "bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400",
    watch: "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400",
    neutral: "bg-zinc-50/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400",
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={
          "inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-full text-xs font-medium border transition " +
          toneStyles[guide.tone]
        }
        aria-label={ariaLabel}
      >
        <Info className="w-3.5 h-3.5" />
        {open ? "접기" : "이 공시 이해하기"}
        <ChevronDown className={"w-3.5 h-3.5 transition-transform " + (open ? "rotate-180" : "")} />
      </button>

      {open ? (
        <div className="mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3.5 space-y-3">
          {/* 분류 + 한 줄 — 타입 색/아이콘 일관화(disclosureType 단일 소스) */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={"inline-flex items-center justify-center w-5 h-5 rounded shrink-0 " + meta.badgeBg + " " + meta.badgeText}>
                <TypeIcon className="w-3.5 h-3.5" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{guide.korean}</span>
              <span className={"text-[10px] px-1.5 py-0.5 rounded-full font-medium border " + meta.badgeBg + " " + meta.badgeText + " " + meta.badgeBorder}>
                {guide.category}
              </span>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {guide.oneLine}
            </p>
          </div>

          {/* 왜 중요한지 */}
          <div>
            <div className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">
              왜 확인해야 하는 신호인지
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {guide.whyMatters}
            </p>
          </div>

          {/* 확인할 3가지 */}
          <div>
            <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1.5">
              ✓ 확인할 3가지
            </div>
            <ol className="space-y-1">
              {guide.checkPoints.map((p, i) => (
                <li key={i} className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed flex gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">{i + 1}.</span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* 과거 패턴 */}
          <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700 rounded-md p-2.5">
            <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              📊 과거 일반적 패턴 (절대값 X)
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {guide.pastPattern}
            </p>
          </div>

          {/* 주의 */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-2.5">
            <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
              ⚠ 주의
            </div>
            <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
              {guide.cautionNote}
            </p>
          </div>

          {/* 원문 링크 — §10.6 모달 구성요소 */}
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={sourceAriaLabel}
              className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition"
            >
              DART 원문 보기 <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
            </a>
          ) : null}

          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed pt-1 border-t border-zinc-100 dark:border-zinc-800">
            ⚠ 이 가이드는 호재/악재 단정이 아닌 <strong>&apos;확인 필요 신호&apos;</strong> 분류입니다. 실제 의미는 회사·시기·맥락에 따라 다릅니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}
