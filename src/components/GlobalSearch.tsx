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
    const stockResults = stocks
      .filter((s) => s.name.toLowerCase().includes(q) || s.ticker.includes(q))
      .slice(0, 4)
      .map((s) => ({
        type: "stock" as const,
        ticker: s.ticker,
        name: s.name,
        themeHint: s.themes[0],
      }));
    const themeResults = themes
      .filter((t) => t.toLowerCase().includes(q))
      .slice(0, 2)
      .map((t) => ({ type: "theme" as const, name: t }));
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
        className="w-full pl-9 pr-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-md text-sm placeholder:text-zinc-500 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
      />
      <svg
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
      >
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {open && query.trim() ? (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-zinc-200 rounded-md shadow-lg overflow-hidden z-50">
          {results.length === 0 ? (
            <div className="px-3 py-3 text-xs text-zinc-500 text-center">
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
                      (i === selectedIndex ? "bg-blue-50" : "hover:bg-zinc-50")
                    }
                  >
                    {result.type === "stock" ? (
                      <>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-mono shrink-0 tabular-nums">
                          {result.ticker}
                        </span>
                        <span className="text-sm text-zinc-900 truncate flex-1">
                          {result.name}
                        </span>
                        {result.themeHint ? (
                          <span className="text-[10px] text-zinc-400 truncate shrink-0 max-w-[120px]">
                            {result.themeHint}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 shrink-0">
                          테마
                        </span>
                        <span className="text-sm text-zinc-900 truncate flex-1">
                          {result.name}
                        </span>
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="px-3 py-1.5 text-[10px] text-zinc-400 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
            <span>↑↓ 이동 · Enter 선택 · Esc 닫기</span>
            <span>{results.length}건</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}