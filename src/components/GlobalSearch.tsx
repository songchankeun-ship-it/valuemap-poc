"use client";

import { useState, useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { trackEvent } from "@/lib/clientAnalytics";
import { scoreColorOf } from "@/lib/scoreColor";

interface StockItem {
  ticker: string;
  name: string;
  themes: string[];
  compositeScore?: number;
}

interface SearchResult {
  type: "stock" | "theme";
  ticker?: string;
  name: string;
  themeHint?: string;
  compositeScore?: number;
}

interface Props {
  stocks: StockItem[];
  themes: string[];
  variant?: "header" | "hero";
}

export function GlobalSearch({ stocks, themes, variant = "header" }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { copy } = useLanguage();
  const isHero = variant === "hero";
  const inputClassName = isHero
    ? "w-full pl-12 pr-3 py-3.5 md:py-4 bg-white dark:bg-zinc-950 border border-blue-200 dark:border-blue-900 text-zinc-950 dark:text-zinc-100 rounded-lg text-[15px] md:text-base font-bold placeholder:text-zinc-500 dark:placeholder:text-zinc-500 shadow-sm shadow-blue-950/10 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition"
    : "w-full min-h-11 pl-10 pr-3 py-2 md:py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-950 dark:text-zinc-100 rounded-lg text-sm md:text-[15px] font-medium placeholder:text-zinc-500 dark:placeholder:text-zinc-500 shadow-sm shadow-zinc-900/5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition";
  const iconClassName = isHero
    ? "absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-600 dark:text-blue-400 pointer-events-none"
    : "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600 dark:text-blue-400 pointer-events-none";
  const panelClassName = isHero
    ? "absolute top-full mt-2 left-0 right-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50"
    : "absolute top-full mt-1 left-0 right-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg overflow-hidden z-50";
  const preferredExampleTickers = ["005930", "000660", "005380"];
  const emptyExamples = (() => {
    const picked = new Map<string, StockItem>();
    for (const ticker of preferredExampleTickers) {
      const stock = stocks.find((s) => s.ticker === ticker);
      if (stock) picked.set(stock.ticker, stock);
    }
    for (const stock of stocks) {
      if (picked.size >= 3) break;
      picked.set(stock.ticker, stock);
    }
    return Array.from(picked.values()).slice(0, 3);
  })();

  function scoreBadge(score?: number) {
    if (!Number.isFinite(score)) return null;
    const v = Math.round(score as number);
    const color = scoreColorOf(v);
    return (
      <span
        className={"shrink-0 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums whitespace-nowrap " + color.badge}
        aria-label={copy.search.scoreAria(v, color.label)}
        title={color.label}
      >
        {copy.search.scorePrefix} {v}
      </span>
    );
  }

  const results: SearchResult[] = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    // 종목: 관련도 점수로 정렬
    // 1) 이름 정확 일치 (0점) → 2) 이름이 q로 시작 (1점) → 3) 티커 정확 일치 (2점)
    // → 4) 티커 시작 (3점) → 5) 그 외 포함 (4점)
    // 같은 점수 내에서는 이름 짧은 순 (대표성)
    function rank(s: StockItem): number | null {
      const name = s.name.toLowerCase();
      const ticker = s.ticker;
      if (name === q) return 0;
      if (name.startsWith(q)) return 1;
      if (ticker === q) return 2;
      if (ticker.startsWith(q)) return 3;
      if (name.includes(q) || ticker.includes(q)) return 4;
      return null;
    }

    const stockResults = stocks
      .map((s) => ({ s, score: rank(s) }))
      .filter((x): x is { s: StockItem; score: number } => x.score !== null)
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return a.s.name.length - b.s.name.length;
      })
      .slice(0, 4)
      .map(({ s }) => ({
        type: "stock" as const,
        ticker: s.ticker,
        name: s.name,
        themeHint: s.themes[0],
        compositeScore: s.compositeScore,
      }));

    // 테마: 같은 패턴
    const themeResults = themes
      .map((t) => {
        const lower = t.toLowerCase();
        if (lower === q) return { t, score: 0 };
        if (lower.startsWith(q)) return { t, score: 1 };
        if (lower.includes(q)) return { t, score: 2 };
        return null;
      })
      .filter((x): x is { t: string; score: number } => x !== null)
      .sort((a, b) => a.score - b.score || a.t.length - b.t.length)
      .slice(0, 2)
      .map(({ t }) => ({ type: "theme" as const, name: t }));

    return [...stockResults, ...themeResults];
  })();

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function navigateToResult(result: SearchResult) {
    trackEvent("search_result_open", {
      source: variant,
      resultType: result.type,
      ticker: result.ticker,
      theme: result.type === "theme" ? result.name : undefined,
      queryLength: query.trim().length,
    });
    if (result.type === "stock" && result.ticker) {
      router.push("/stock/" + result.ticker);
    } else {
      router.push("/stocks?theme=" + encodeURIComponent(result.name));
    }
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function openExampleSearch(stock: StockItem) {
    trackEvent("search_empty_example_click", {
      source: variant,
      ticker: stock.ticker,
      queryLength: query.trim().length,
    });
    setQuery(stock.name);
    setOpen(true);
    setSelectedIndex(0);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Escape 는 결과가 없을 때(빈 상태 패널)도 패널을 닫아야 하므로 조기 반환보다 먼저 처리한다.
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      navigateToResult(results[selectedIndex]);
    }
  }

  return (
    <div ref={containerRef} data-search-variant={variant} className="w-full relative">
      <input
        ref={inputRef}
        type="search"
        placeholder={isHero ? copy.search.placeholderHero : copy.search.placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        role="combobox"
        aria-label={copy.search.placeholder}
        aria-expanded={open && results.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && results.length > 0 ? listboxId + "-opt-" + selectedIndex : undefined
        }
        suppressHydrationWarning
        className={inputClassName}
      />
      <Search
        className={iconClassName}
        strokeWidth={isHero ? 2.25 : 2}
        aria-hidden="true"
      />

      {open && query.trim() ? (
        <div className={panelClassName}>
          {results.length === 0 ? (
            <div className="px-3 py-3 text-xs text-zinc-500 dark:text-zinc-400 text-center">
              <p>{copy.search.empty}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
                {copy.search.emptyCoverageLine(stocks.length)}
              </p>
              {emptyExamples.length > 0 ? (
                <div className="mt-2">
                  <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                    {copy.search.emptyExamplesLabel}
                  </p>
                  <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
                    {emptyExamples.map((stock) => (
                      <button
                        key={stock.ticker}
                        type="button"
                        onClick={() => openExampleSearch(stock)}
                        className="min-h-8 max-w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-900 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                      >
                        <span className="block truncate">{stock.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  trackEvent("search_empty_open_stocks", {
                    source: variant,
                    queryLength: query.trim().length,
                    stockCount: stocks.length,
                  });
                  router.push("/stocks");
                  setQuery("");
                  setOpen(false);
                  inputRef.current?.blur();
                }}
                className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {copy.search.emptyCoverageCta}
              </button>
            </div>
          ) : (
            <ul id={listboxId} role="listbox" aria-label={copy.search.placeholder}>
              {results.map((result, i) => (
                <li
                  key={result.type === "stock" ? "s-" + result.ticker : "t-" + result.name}
                  id={listboxId + "-opt-" + i}
                  role="option"
                  aria-selected={i === selectedIndex}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => navigateToResult(result)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={
                      "w-full text-left px-3 py-2 flex items-center gap-2.5 transition " +
                      (i === selectedIndex ? "bg-blue-50 dark:bg-blue-950/40" : "hover:bg-zinc-50 dark:hover:bg-zinc-800")
                    }
                  >
                    {result.type === "stock" ? (
                      <>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono shrink-0 tabular-nums">
                          {result.ticker}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-zinc-900 dark:text-zinc-100 truncate">
                            {result.name}
                          </span>
                          {result.themeHint ? (
                            <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                              {result.themeHint}
                            </span>
                          ) : null}
                        </span>
                        {scoreBadge(result.compositeScore)}
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shrink-0">
                          {copy.search.theme}
                        </span>
                        <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate flex-1">
                          {result.name}
                        </span>
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {/* 자동완성은 상위 4개만 노출 → 부분 일치가 더 있을 수 있으므로 전체 결과를 목록(/stocks?q=)에서
              이어보게 하는 핸드오프. 검색 → 전체 목록 → 종목 상세 동선의 모호함을 줄인다.
              /stocks?q= 는 종목명·코드 부분일치로 거르므로, 종목 결과가 하나라도 있을 때만 노출한다
              (테마만 걸린 검색어는 목록에서 0건이 되어 오히려 혼란 — 테마 행이 이미 테마 목록으로 안내). */}
          {results.some((r) => r.type === "stock") ? (
            <button
              type="button"
              onClick={() => {
                trackEvent("search_view_all", {
                  source: variant,
                  queryLength: query.trim().length,
                  resultCount: results.filter((r) => r.type === "stock").length,
                });
                router.push("/stocks?q=" + encodeURIComponent(query.trim()));
                setQuery("");
                setOpen(false);
                inputRef.current?.blur();
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-400 border-t border-zinc-100 dark:border-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition truncate"
            >
              {copy.search.viewAllInList(query.trim())}
            </button>
          ) : null}
          <div className="px-3 py-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between">
            <span>{copy.search.help}</span>
            <span>{results.length}{copy.search.countSuffix}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
