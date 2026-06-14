"use client";

import { useEffect, useState } from "react";
import type { ScorePoint } from "@/lib/scoreHistory";

interface Disc {
  report_nm: string;
  rcept_dt: string; // YYYYMMDD
  url: string;
  flr_nm: string;
  signal: { signalLabel: string; direction?: string } | null;
}

interface TLEvent {
  date: string; // YYYY-MM-DD
  kind: "score" | "disclosure";
  title: string;
  sub?: string;
  url?: string;
  tone: string;
}

function fmtDate(yyyymmdd: string): string {
  if (yyyymmdd && yyyymmdd.length >= 8) return yyyymmdd.slice(0, 4) + "-" + yyyymmdd.slice(4, 6) + "-" + yyyymmdd.slice(6, 8);
  return yyyymmdd;
}

/** 공시 이벤트 + 점수 변화 이벤트를 시간순으로 합친 통합 타임라인. */
export function StockEventTimeline({ ticker, scores }: { ticker: string; scores: ScorePoint[] }) {
  const [discs, setDiscs] = useState<Disc[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/disclosures/" + ticker + "?days=90&limit=20")
      .then((r) => r.json())
      .then((j) => {
        if (alive && !j.error) setDiscs((j.disclosures as Disc[]) ?? []);
        else if (alive) setDiscs([]);
      })
      .catch(() => {
        if (alive) setDiscs([]);
      });
    return () => {
      alive = false;
    };
  }, [ticker]);

  const scoreEvents: TLEvent[] = [];
  for (let i = 1; i < scores.length; i++) {
    const a = Math.round(scores[i - 1].composite);
    const b = Math.round(scores[i].composite);
    if (a !== b) {
      scoreEvents.push({
        date: scores[i].date,
        kind: "score",
        title: "종합점수 " + a + " → " + b,
        sub: (b > a ? "▲ +" : "▼ ") + (b - a) + "점",
        tone: b >= a ? "bg-red-500" : "bg-blue-500",
      });
    }
  }

  const discEvents: TLEvent[] = (discs ?? []).map((d) => ({
    date: fmtDate(d.rcept_dt),
    kind: "disclosure" as const,
    title: d.report_nm,
    sub: d.signal ? d.signal.signalLabel + (d.signal.direction ? " · " + d.signal.direction : "") : d.flr_nm,
    url: d.url,
    tone: d.signal ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600",
  }));

  const events = [...scoreEvents, ...discEvents].sort((x, y) => (x.date < y.date ? 1 : -1)).slice(0, 24);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">공시·점수 통합 타임라인</div>
        <div className="text-[10px] text-zinc-500 dark:text-zinc-400">최근 90일</div>
      </div>
      {discs === null ? (
        <div className="space-y-2">
          <div className="h-3 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
      ) : events.length === 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center">최근 공시·점수 변화 기록이 없습니다.</p>
      ) : (
        <ol className="relative ml-1 border-l border-zinc-200 dark:border-zinc-800">
          {events.map((e, idx) => (
            <li key={idx} className="ml-4 pb-4 last:pb-0">
              <span className={"absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900 " + e.tone} aria-hidden="true" />
              {e.url ? (
                <a href={e.url} target="_blank" rel="noopener noreferrer" className="block -mx-2 px-2 py-1 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums">{e.date} · {e.kind === "score" ? "점수 변화" : "공시"}</div>
                  <div className="text-xs text-zinc-800 dark:text-zinc-200">{e.title}</div>
                  {e.sub ? <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{e.sub}</div> : null}
                </a>
              ) : (
                <div className="-mx-2 px-2 py-1">
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums">{e.date} · {e.kind === "score" ? "점수 변화" : "공시"}</div>
                  <div className="text-xs text-zinc-800 dark:text-zinc-200">{e.title}</div>
                  {e.sub ? <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{e.sub}</div> : null}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
