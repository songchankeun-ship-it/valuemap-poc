"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface StockItem {
  ticker: string;
  name: string;
  themes: string[];
}

interface SearchResult {
  type: "stock" | "theme";
  ticker?: string;
  name: string;
  themeHint?: string;
}

interface Props {
  stocks: StockItem[];
  themes: string[];
}

export function GlobalSearch({ stocks, themes }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
    if (result.type === "stock" && result.ticker) {
      router.push("/stock/" + result.ticker);
    } else {
      router.push("/stocks?theme=" + encodeURIComponent(result.name));
    }
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
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
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className="w-full relative">
      <input
        ref={inputRef}
        type="search"
        placeholder="종목·테마 검색"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className="w-full pl-9 pr-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md text-sm placeholder:text-zinc-500 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition"
      />
      <svg
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
      >
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {open && query.trim() ? (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg overflow-hidden z-50">
          {results.length === 0 ? (
            <div className="px-3 py-3 text-xs text-zinc-500 dark:text-zinc-400 text-center">
              일치하는 종목이나 테마가 없습니다
            </div>
          ) : (
            <ul>
              {results.map((result, i) => (
                <li key={result.type === "stock" ? "s-" + result.ticker : "t-" + result.name}>
                  <button
                    type="button"
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
                        <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate flex-1">
                          {result.name}
                        </span>
                        {result.themeHint ? (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate shrink-0 max-w-[120px]">
                            {result.themeHint}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shrink-0">
                          테마
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
          <div className="px-3 py-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between">
            <span>↑↓ 이동 · Enter 선택 · Esc 닫기</span>
            <span>{results.length}건</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}