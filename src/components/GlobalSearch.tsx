"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface SearchHit {
  type: "stock" | "theme";
  label: string;
  sub: string;
  href: string;
}

export function GlobalSearch({ allStocks, allThemes }: {
  allStocks: Array<{ name: string; ticker: string; themes: string[] }>;
  allThemes: string[];
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hits: SearchHit[] = (() => {
    if (!q.trim()) return [];
    const lower = q.trim().toLowerCase();
    const stockHits: SearchHit[] = allStocks
      .filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.ticker.includes(q.trim())
      )
      .slice(0, 5)
      .map((s) => ({
        type: "stock" as const,
        label: s.name,
        sub: s.ticker,
        href: `/stock/${s.ticker}`,
      }));
    const themeHits: SearchHit[] = allThemes
      .filter((t) => t.toLowerCase().includes(lower))
      .slice(0, 4)
      .map((t) => ({
        type: "theme" as const,
        label: t,
        sub: "테마",
        href: `/stocks?theme=${encodeURIComponent(t)}`,
      }));
    return [...stockHits, ...themeHits];
  })();

  function pick(idx: number) {
    const hit = hits[idx];
    if (hit) {
      router.push(hit.href);
      setOpen(false);
      setQ("");
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(hits.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(activeIdx);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative flex-1 max-w-md">
      <input
        type="text"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActiveIdx(0); }}
        onFocus={() => q && setOpen(true)}
        onKeyDown={onKey}
        placeholder="종목·테마 검색"
        className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:border-brand-500"
      />
      {open && hits.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-sm z-50 max-h-80 overflow-y-auto">
          {hits.map((h, i) => (
            <button
              key={`${h.type}-${h.href}`}
              onClick={() => pick(i)}
              onMouseEnter={() => setActiveIdx(i)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between border-b border-gray-50 last:border-0 ${
                i === activeIdx ? "bg-brand-50" : "hover:bg-gray-50"
              }`}
            >
              <div>
                <div className="font-medium text-gray-900">{h.label}</div>
                <div className="text-[10px] text-gray-400">{h.sub}</div>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                h.type === "stock" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
              }`}>
                {h.type === "stock" ? "종목" : "테마"}
              </span>
            </button>
          ))}
        </div>
      )}
      {open && q.trim() && hits.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md p-3 text-xs text-gray-400">
          검색 결과 없음
        </div>
      )}
    </div>
  );
}
