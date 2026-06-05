"use client";

import { useEffect, useState } from "react";

interface SignalInfo {
  signalType: string;
  signalLabel: string;
  strength: number;
  note: string;
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
  source: "live" | "cache" | "sample" | string;
  note?: string;
}

const SIGNAL_STYLES: Record<string, { bg: string; text: string }> = {
  "자기주식 취득 결의": { bg: "bg-green-50", text: "text-green-700" },
  "임원·주요주주 매수": { bg: "bg-emerald-50", text: "text-emerald-700" },
  "정정공시": { bg: "bg-amber-50", text: "text-amber-700" },
  "단일판매·공급계약": { bg: "bg-blue-50", text: "text-blue-700" },
  "유상증자 발행": { bg: "bg-purple-50", text: "text-purple-700" },
  "전환사채 발행": { bg: "bg-purple-50", text: "text-purple-700" },
};

export function StockDisclosures({ ticker }: { ticker: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetch(`/api/disclosures/${ticker}?days=90&limit=20`)
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j.error) setError(j.error);
        else setData(j);
      })
      .catch((e) => alive && setError((e as Error).message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [ticker]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">DART 공시</span>
            <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <div className="space-y-1.5 flex-1">
                <div className={"h-3 bg-gray-200 rounded animate-pulse " + (i % 2 === 0 ? "w-3/4" : "w-2/3")} />
                <div className="h-2 w-1/4 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-3 italic">DART에서 최근 90일 공시 가져오는 중…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-medium text-gray-700 mb-2">DART 공시</div>
        <div className="text-sm text-rose-600">{error ?? "공시 데이터를 가져오지 못했습니다."}</div>
      </div>
    );
  }

  const signalEntries = Object.entries(data.signalsByType);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">DART 공시</span>
          <SourceBadge source={data.source} />
        </div>
        <span className="text-[11px] text-gray-500 tabular-nums">
          최근 90일 · {data.count}건 · 신호 {data.signalCount}건
        </span>
      </div>

      {data.count === 0 ? (
        <div className="text-sm text-gray-500 py-8 text-center">
          최근 90일간 공시가 없습니다.
        </div>
      ) : (
        <>
          {signalEntries.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-gray-100">
              {signalEntries.map(([label, count]) => {
                const style = SIGNAL_STYLES[label] ?? { bg: "bg-gray-100", text: "text-gray-700" };
                return (
                  <span
                    key={label}
                    className={"text-[11px] px-2 py-0.5 rounded " + style.bg + " " + style.text}
                  >
                    {label} {count}
                  </span>
                );
              })}
            </div>
          )}

          <div className="space-y-0">
            {data.disclosures.slice(0, 10).map((d) => (
              
                key={d.rcept_no}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-2 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-xs text-gray-800 truncate">{d.report_nm}</span>
                    {d.signal && (
                      <SignalBadge label={d.signal.signalLabel} strength={d.signal.strength} />
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 tabular-nums">
                    {d.rcept_dt.slice(0, 4)}-{d.rcept_dt.slice(4, 6)}-{d.rcept_dt.slice(6, 8)} · {d.flr_nm}
                  </div>
                </div>
                <span className="text-[10px] text-gray-300 shrink-0">↗</span>
              </a>
            ))}
          </div>
        </>
      )}

      {data.note && (
        <p className="text-[10px] text-gray-400 mt-3 italic">{data.note}</p>
      )}
    </div>
  );
}

function SignalBadge({ label, strength }: { label: string; strength: number }) {
  const style = SIGNAL_STYLES[label] ?? { bg: "bg-gray-100", text: "text-gray-700" };
  return (
    <span className={"text-[10px] px-1.5 py-0.5 rounded shrink-0 " + style.bg + " " + style.text}>
      {label} {strength}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  if (source === "live") return <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">Live</span>;
  if (source === "cache") return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">Cache</span>;
  if (source.startsWith("sample")) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">Preview</span>;
  return null;
}