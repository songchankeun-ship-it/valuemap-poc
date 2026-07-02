"use client";

import { useState } from "react";

interface Item { ticker: string; name: string }

/** 빈 화면 등에서 바로 검색→추가. onPick에 ticker 전달(직접 추가). */
export function StockSearchBox({
  stocks,
  onPick,
  placeholder = "종목명·티커 검색",
}: {
  stocks: Item[];
  onPick: (ticker: string) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const matches =
    query.length === 0
      ? []
      : stocks.filter((s) => s.name.toLowerCase().includes(query) || s.ticker.includes(query)).slice(0, 6);

  return (
    <div className="max-w-sm mx-auto text-left">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        aria-controls="stock-search-box-list"
        aria-expanded={matches.length > 0}
        className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
      />
      {matches.length > 0 ? (
        <ul
          id="stock-search-box-list"
          role="listbox"
          aria-label={placeholder}
          className="mt-1 border border-zinc-200 dark:border-zinc-800 rounded-md divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden"
        >
          {matches.map((s) => (
            <li key={s.ticker} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => {
                  onPick(s.ticker);
                  setQ("");
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
              >
                <span className="text-zinc-800 dark:text-zinc-200 truncate">{s.name}</span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 shrink-0 font-medium">+ 추가</span>
              </button>
            </li>
          ))}
        </ul>
      ) : query.length > 0 ? (
        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 px-1">검색 결과 없음</p>
      ) : null}
    </div>
  );
}
