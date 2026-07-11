"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { stockDetailCopy } from "@/lib/copy/stockDetail";
import { FOCUS_RING } from "@/components/ui/controlStyles";

type TabLabelKey = keyof (typeof stockDetailCopy)["ko"]["tabs"];

export interface StockTab {
  id: string;
  /** 정적 라벨(하위 호환). labelKey가 있으면 무시된다. */
  label?: string;
  /** 다국어 라벨 키 — stockDetailCopy.tabs에서 현지화. */
  labelKey?: TabLabelKey;
  content: ReactNode;
}

/**
 * 종목 상세 탭. 헤더·결론 요약은 탭 밖(항상 노출).
 * URL 해시(#disclosures 등)로 특정 탭 딥링크 — 초보자 해석의 '관련 공시 보기' 등에서 사용.
 * 접근성: WAI-ARIA Tabs 패턴(roving tabindex + ←/→/Home/End). 탭 목록은 role="tablist",
 * 활성 탭만 Tab 순서에 두고 좌우 화살표로 탭 사이를 이동한다. 시각/레이아웃은 무변경.
 */
export function StockTabs({ tabs }: { tabs: StockTab[] }) {
  const { locale } = useLanguage();
  const tabCopy = stockDetailCopy[locale].tabs;
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

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

  // ←/→ 로 탭 이동(자동 활성화), Home/End 로 처음/끝 탭. 이동 시 포커스도 함께 옮긴다.
  function onKeyDown(e: React.KeyboardEvent, index: number) {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const t = tabs[next];
    if (!t) return;
    select(t.id);
    tabRefs.current[next]?.focus();
  }

  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div
        role="tablist"
        aria-label={locale === "ko" ? "종목 상세 탭" : "Stock detail tabs"}
        aria-orientation="horizontal"
        className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 bg-[var(--background)] -mx-3 md:-mx-4 px-3 md:px-4"
      >
        {tabs.map((t, i) => {
          const selected = active === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={"tab-" + t.id}
              aria-selected={selected}
              aria-controls={"tabpanel-" + t.id}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={
                "shrink-0 px-3 py-3 sm:py-2.5 text-sm font-medium border-b-2 -mb-px transition " + FOCUS_RING + " " +
                (selected
                  ? "border-blue-600 text-zinc-900 dark:text-zinc-100"
                  : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200")
              }
            >
              {t.labelKey ? tabCopy[t.labelKey] : t.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={current ? "tabpanel-" + current.id : undefined}
        aria-labelledby={current ? "tab-" + current.id : undefined}
        tabIndex={0}
        className="space-y-3 md:space-y-4 pt-3 md:pt-4 focus:outline-none"
      >
        {current?.content}
      </div>
    </div>
  );
}
