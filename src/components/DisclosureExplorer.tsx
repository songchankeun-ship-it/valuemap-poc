"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface SignalHit {
  signalType: string;
  signalLabel: string;
  strength: number;
  note: string;
  disclosure: {
    corp_name: string;
    stock_code: string;
    report_nm: string;
    rcept_no: string;
    flr_nm: string;
    rcept_dt: string;
    rm?: string;
    url: string;
  };
}

interface ApiResponse {
  days: number;
  totalDisclosures: number;
  signalCount: number;
  signals: SignalHit[];
  source: string;
  note?: string;
}

const SIGNAL_TYPES = [
  { key: "treasury_buy",    label: "자기주식 취득" },
  { key: "insider_buy",     label: "내부자 매수" },
  { key: "correction",      label: "정정공시" },
  { key: "single_contract", label: "단일계약" },
  { key: "capital_raise",   label: "유증/CB" },
];

const STYLES: Record<string, { bg: string; text: string }> = {
  treasury_buy:    { bg: "bg-green-50",   text: "text-green-700" },
  insider_buy:     { bg: "bg-emerald-50", text: "text-emerald-700" },
  correction:      { bg: "bg-amber-50",   text: "text-amber-700" },
  single_contract: { bg: "bg-blue-50",    text: "text-blue-700" },
  capital_raise:   { bg: "bg-purple-50",  text: "text-purple-700" },
};

export function DisclosureExplorer() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [minStrength, setMinStrength] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/disclosures/recent?days=${days}`)
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j.error) setError(j.error);
        else setData(j);
      })
      .catch((e) => alive && setError((e as Error).message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [days]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.signals.filter((s) => {
      if (activeTypes.size > 0 && !activeTypes.has(s.signalType)) return false;
      if (s.strength < minStrength) return false;
      return true;
    });
  }, [data, activeTypes, minStrength]);

  const counts = useMemo(() => {
    if (!data) return {} as Record<string, number>;
    const c: Record<string, number> = {};
    for (const s of data.signals) c[s.signalType] = (c[s.signalType] ?? 0) + 1;
    return c;
  }, [data]);

  function toggleType(t: string) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {/* 컨트롤 */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">기간:</span>
            {[1, 3, 7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-2.5 py-1 rounded-md ${
                  days === d ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {d}일
              </button>
            ))}
          </div>
          {data && (
            <span className="text-[11px] text-gray-400">
              총 공시 {data.totalDisclosures} · 신호 {data.signalCount}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-gray-500 mr-1">신호 종류:</span>
          {SIGNAL_TYPES.map((t) => {
            const isActive = activeTypes.has(t.key);
            const style = STYLES[t.key];
            const count = counts[t.key] ?? 0;
            return (
              <button
                key={t.key}
                onClick={() => toggleType(t.key)}
                disabled={count === 0}
                className={`text-xs px-2 py-1 rounded-md ${
                  isActive ? `${style.bg} ${style.text} font-medium ring-1 ring-current` : "bg-gray-50 text-gray-600"
                } ${count === 0 ? "opacity-40 cursor-not-allowed" : "hover:opacity-80"}`}
              >
                {t.label} {count > 0 && `(${count})`}
              </button>
            );
          })}
          {activeTypes.size > 0 && (
            <button onClick={() => setActiveTypes(new Set())} className="text-[11px] text-brand-600 ml-2">
              초기화
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">최소 강도:</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minStrength}
            onChange={(e) => setMinStrength(Number(e.target.value))}
            className="flex-1"
          />
          <span className="font-medium text-brand-600 w-8 text-right">{minStrength}</span>
        </div>
      </div>

      {/* 결과 */}
      {loading && <div className="text-sm text-gray-500 p-4">불러오는 중…</div>}
      {error && <div className="text-sm text-red-600 p-4">{error}</div>}

      {data && !loading && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
            {filtered.length}건 표시 (전체 {data.signals.length} 중)
          </div>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              조건에 맞는 신호가 없습니다.
            </div>
          ) : (
            <ul>
              {filtered.map((s) => {
                const style = STYLES[s.signalType] ?? { bg: "bg-gray-100", text: "text-gray-700" };
                const d = s.disclosure;
                return (
                  <li
                    key={`${d.rcept_no}-${s.signalType}`}
                    className="flex items-start justify-between gap-3 px-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[11px] px-2 py-0.5 rounded ${style.bg} ${style.text} font-medium shrink-0`}>
                          {s.signalLabel} {s.strength}
                        </span>
                        <Link
                          href={`/stock/${d.stock_code}`}
                          className="text-sm font-medium text-gray-900 hover:text-brand-600 truncate"
                        >
                          {d.corp_name}
                        </Link>
                        <span className="text-[10px] text-gray-400">({d.stock_code})</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">{d.report_nm}</div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <span>{formatDate(d.rcept_dt)}</span>
                        <span>·</span>
                        <span>{d.flr_nm}</span>
                        {s.note && (
                          <>
                            <span>·</span>
                            <span className="italic">{s.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-brand-600 shrink-0 self-center"
                    >
                      원문 ↗
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {data?.note && <p className="text-[10px] text-gray-400 italic">{data.note}</p>}
    </div>
  );
}

function formatDate(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}
