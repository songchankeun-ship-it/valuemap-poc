"use client";

import { useState, useEffect, type ReactNode } from "react";

export interface StockTab {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * 종목 상세 탭. 헤더·결론 요약은 탭 밖(항상 노출).
 * URL 해시(#disclosures 등)로 특정 탭 딥링크 — 초보자 해석의 '관련 공시 보기' 등에서 사용.
 */
export function StockTabs({ tabs }: { tabs: StockTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  useEffect(() => {
    const apply = () => {
      const h = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
      if (h && tabs.some((t) => t.id === h)) setActive(h);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [tabs]);

  function select(id: string) {
    setActive(id);
    if (typeof window !== "undefined") {
      try {
        history.replaceState(null, "", "#" + id);
      } catch {
        /* noop */
      }
    }
  }

  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 bg-[var(--background)] -mx-3 md:-mx-4 px-3 md:px-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => select(t.id)}
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
