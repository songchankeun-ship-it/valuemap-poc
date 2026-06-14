"use client";

import { useState, type ReactNode } from "react";

export interface StockTab {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * 종목 상세 탭. 헤더·결론 요약은 탭 밖(항상 노출),
 * 차트·재무·공시·점수근거는 탭으로 분리해 페이지 길이를 줄인다.
 */
export function StockTabs({ tabs }: { tabs: StockTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <div>
      <div className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 bg-[var(--background)] -mx-3 md:-mx-4 px-3 md:px-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={
              "shrink-0 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition " +
              (active === t.id
                ? "border-blue-600 text-zinc-900 dark:text-zinc-100"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="space-y-3 md:space-y-4 pt-3 md:pt-4">{current?.content}</div>
    </div>
  );
}
