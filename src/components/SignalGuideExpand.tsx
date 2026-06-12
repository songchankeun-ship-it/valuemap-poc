"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import type { SignalGuide } from "@/lib/signalGuide";

/**
 * 각 공시 신호 카드 하단에 펼쳐지는 '이 공시 이해하기' 가이드.
 * 호재/악재 단정 X, '확인 필요 신호' 로 분류.
 */
export function SignalGuideExpand({ guide }: { guide: SignalGuide }) {
  const [open, setOpen] = useState(false);

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
          "inline-flex items-center gap-1.5 px-3 py-2 min-h-[36px] rounded-full text-xs font-medium border transition " +
          toneStyles[guide.tone]
        }
        aria-label="이 공시 이해하기"
      >
        <Info className="w-3.5 h-3.5" />
        {open ? "접기" : "이 공시 이해하기"}
        <ChevronDown className={"w-3.5 h-3.5 transition-transform " + (open ? "rotate-180" : "")} />
      </button>

      {open ? (
        <div className="mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3.5 space-y-3">
          {/* 분류 + 한 줄 */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{guide.emoji}</span>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{guide.korean}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
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
              왜 주목할 가치가 있는지
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

          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed pt-1 border-t border-zinc-100 dark:border-zinc-800">
            ⚠ 이 가이드는 호재/악재 단정이 아닌 <strong>'확인 필요 신호'</strong> 분류입니다. 실제 의미는 회사·시기·맥락에 따라 다릅니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}
