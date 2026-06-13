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
  "자기주식 취득 결의": "bg-green-50 text-green-700",
  "임원·주요주주 보유 변동": "bg-emerald-50 text-emerald-700",
  "정정공시": "bg-amber-50 text-amber-700",
  "단일판매·공급계약": "bg-blue-50 text-blue-700",
  "유상증자 발행": "bg-purple-50 text-purple-700",
  "전환사채 발행": "bg-purple-50 text-purple-700",
};

function getBadgeClass(label: string): string {
  return SIGNAL_BG[label] || "bg-gray-100 text-gray-700";
}

function SourceBadge({ source }: { source: string }) {
  if (source === "live") return <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">Live</span>;
  if (source === "cache") return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">Cache</span>;
  if (source.startsWith("sample")) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 dark:text-zinc-400 font-medium">Preview</span>;
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
          최근 90일간 공시가 없습니다.
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
          <div>
            {items.map((d) => (
              <button
                key={d.rcept_no}
                type="button"
                onClick={() => openExternal(d.url)}
                className="w-full text-left flex items-start justify-between gap-2 py-3 min-h-[52px] border-b border-gray-50 dark:border-zinc-800 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-800/50 active:bg-gray-100 dark:active:bg-zinc-800 -mx-2 px-2 rounded transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-xs text-gray-800 dark:text-zinc-200 truncate">{d.report_nm}</span>
                    {d.signal ? (
                      <span className={"text-[10px] px-1.5 py-0.5 rounded shrink-0 " + getBadgeClass(d.signal.signalLabel)}>
                        {d.signal.signalLabel} · 신뢰도 {d.signal.strength}%
                      </span>
                    ) : null}
                    {d.signal?.direction ? (
                      <span className={"text-[10px] px-1.5 py-0.5 rounded shrink-0 " + (d.signal.direction === "긍정 가능" ? "bg-red-50 text-red-700" : d.signal.direction === "부정 가능" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700")}>
                        방향 {d.signal.direction}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[10px] text-gray-400 dark:text-zinc-500">
                    {d.rcept_dt.slice(0, 4)}-{d.rcept_dt.slice(4, 6)}-{d.rcept_dt.slice(6, 8)} {d.flr_nm}
                  </div>
                </div>
                <span className="text-[10px] text-gray-300 shrink-0">{"->"}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {data.note ? (
        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-3 italic">{data.note}</p>
      ) : null}
    </div>
  );
}