"use client";

import { useEffect, useState } from "react";

interface Quote {
  price: number;
  changePct: number;
  marketStatus: string | null;
  tradedAt: string | null;
}

export function LivePrice({
  ticker,
  fallbackPrice,
  fallbackChangePct,
  asOf,
}: {
  ticker: string;
  fallbackPrice: number;
  fallbackChangePct: number;
  asOf?: string | null;
}) {
  const [q, setQ] = useState<Quote | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/quote/${ticker}`);
        const j = await res.json();
        if (active && j?.ok && typeof j.price === "number") {
          setQ({
            price: j.price,
            changePct: typeof j.changePct === "number" ? j.changePct : 0,
            marketStatus: j.marketStatus ?? null,
            tradedAt: j.tradedAt ?? null,
          });
        }
      } catch {
        /* 네트워크 실패 시 종가 fallback 유지 */
      }
    }
    load();
    const id = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [ticker]);

  const price = q ? q.price : fallbackPrice;
  const pct = q ? q.changePct : fallbackChangePct;
  const isLive = !!q;
  const open = q?.marketStatus === "OPEN";
  const timeLabel = q?.tradedAt ? q.tradedAt.slice(11, 16) : "";

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className="text-2xl md:text-3xl font-black tabular-nums text-zinc-950 dark:text-zinc-50">
        {Math.round(price).toLocaleString()}
        <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-0.5">원</span>
      </span>
      <span
        className={
          "text-base font-bold tabular-nums " +
          (pct >= 0
            ? "text-red-600 dark:text-red-400"
            : "text-blue-600 dark:text-blue-400")
        }
      >
        {pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
      </span>
      {isLive ? (
        <span
          className={
            "text-[10px] px-1.5 py-0.5 rounded tabular-nums " +
            (open
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300")
          }
        >
          {open ? "장중 참고시세" : "장마감"}
          {timeLabel ? " · " + timeLabel : ""}
        </span>
      ) : asOf ? (
        <span className="text-[10px] text-zinc-600 dark:text-zinc-300 tabular-nums">
          · {asOf} 종가
        </span>
      ) : null}
    </div>
  );
}
