"use client";

import { useEffect, useState } from "react";

interface SignalInfo {
  signalType: string;
  signalLabel: string;
  strength: number;
  note: string;
  direction?: "긍정 가능" | "부정 가능" | "확인 필요";
}

interface DisclosureItem {
  corp_name: string;
  report_nm: string;
  rcept_no: string;
  flr_nm: string;
  rcept_dt: string;
  url: string;
  signal: SignalInfo | null;
}

interface ApiResponse {
  ticker: string;
  count: number;
  disclosures: DisclosureItem[];
  signalCount: number;
  signalsByType: Record<string, number>;
  source: string;
  note?: string;
}

const SIGNAL_BG: Record<string, string> = {
  "자기주식 취득 결의": "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400",
  "임원·주요주주 보유 변동": "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
  "정정공시": "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
  "단일판매·공급계약": "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
  "유상증자 발행": "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400",
  "전환사채 발행": "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400",
};

function getBadgeClass(label: string): string {
  return SIGNAL_BG[label] || "bg-gray-100 text-gray-700";
}

function SourceBadge({ source }: { source: string }) {
  if (source === "live") return <span title="DART에서 실시간으로 가져온 공시" className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 font-medium">실시간</span>;
  if (source === "cache") return <span title="최근에 가져와 저장해 둔 공시" className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-medium">저장본</span>;
  if (source.startsWith("sample")) return <span title="실데이터 연결 전 보여주는 예시 표본" className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">예시 표본</span>;
  return null;
}

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function StockDisclosures({ ticker }: { ticker: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetch("/api/disclosures/" + ticker + "?days=90&limit=20")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j.error) setError(j.error);
        else setData(j);
      })
      .catch((e) => {
        if (alive) setError((e as Error).message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [ticker]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
        <div className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">DART 공시</div>
        <div className="space-y-2">
          <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
        <div className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">DART 공시</div>
        <div className="text-sm text-rose-600">{error || "공시 데이터를 가져오지 못했습니다."}</div>
      </div>
    );
  }

  const signalEntries = Object.entries(data.signalsByType);
  const items = data.disclosures.slice(0, 10);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">DART 공시</span>
          <SourceBadge source={data.source} />
        </div>
        <span className="text-[11px] text-gray-500 dark:text-zinc-400">
          최근 90일 {data.count}건 신호 {data.signalCount}건
        </span>
      </div>

      {data.count === 0 ? (
        <div className="text-sm text-gray-500 dark:text-zinc-400 py-8 text-center">
          <p>최근 90일간 접수된 DART 공시가 없습니다.</p>
          <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1.5 leading-relaxed">공시가 없다는 것은 호재도 악재도 아닙니다 — 단지 이 기간에 보고된 주요 공시가 없었다는 뜻이에요.</p>
        </div>
      ) : (
        <div>
          {signalEntries.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-gray-100 dark:border-zinc-800">
              {signalEntries.map((entry) => (
                <span
                  key={entry[0]}
                  className={"text-[11px] px-2 py-0.5 rounded " + getBadgeClass(entry[0])}
                >
                  {entry[0]} {entry[1]}
                </span>
              ))}
            </div>
          ) : null}
          <ol className="relative ml-1 border-l border-gray-200 dark:border-zinc-800">
            {items.map((d) => {
              const dir = d.signal?.direction;
              const dotColor = !d.signal
                ? "bg-gray-300 dark:bg-zinc-600"
                : dir === "긍정 가능"
                ? "bg-red-500"
                : dir === "부정 가능"
                ? "bg-blue-500"
                : "bg-amber-500";
              return (
                <li key={d.rcept_no} className="ml-4 pb-4 last:pb-0">
                  <span
                    className={"absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900 " + dotColor}
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    onClick={() => openExternal(d.url)}
                    className="w-full text-left -mx-2 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-zinc-800/50 active:bg-gray-100 dark:active:bg-zinc-800 transition"
                  >
                    <div className="text-[10px] text-gray-400 dark:text-zinc-500 mb-0.5 tabular-nums">
                      {d.rcept_dt.slice(0, 4)}-{d.rcept_dt.slice(4, 6)}-{d.rcept_dt.slice(6, 8)} · {d.flr_nm}
                    </div>
                    <div className="text-xs text-gray-800 dark:text-zinc-200">{d.report_nm}</div>
                    {d.signal ? (
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={"text-[10px] px-1.5 py-0.5 rounded " + getBadgeClass(d.signal.signalLabel)}>
                          {d.signal.signalLabel} · 유형 자동분류
                        </span>
                        {d.signal.direction ? (
                          <span className={"text-[10px] px-1.5 py-0.5 rounded " + (d.signal.direction === "긍정 가능" ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" : d.signal.direction === "부정 가능" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300")}>
                            방향 {d.signal.direction}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {data.note ? (
        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-3 italic">{data.note}</p>
      ) : null}
    </div>
  );
}