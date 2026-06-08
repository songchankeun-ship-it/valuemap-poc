"use client";

import { useState, useEffect } from "react";

interface DisclosureItem {
  corp_name: string;
  corp_code?: string;
  stock_code?: string;
  report_nm: string;
  rcept_no: string;
  flr_nm: string;
  rcept_dt: string;
  url: string;
  rm?: string;
}

interface DisclosureSignal {
  signalType: string;
  signalLabel: string;
  disclosure: DisclosureItem;
  strength: number;
  note: string;
}

interface ApiResponse {
  days: number;
  totalDisclosures: number;
  signalCount: number;
  signals: DisclosureSignal[];
}

interface GroupedSignal {
  key: string;
  corp_name: string;
  stock_code?: string;
  signalLabel: string;
  signalType: string;
  strength: number;
  representative: DisclosureSignal;
  count: number;
  hasRevision: boolean;
  rcept_dt_latest: string;
}

const SIGNAL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "자기주식 취득 결의": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  "임원·주요주주 매수": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "정정공시": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "단일판매·공급계약": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "유상증자 발행": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  "전환사채 발행": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
};

const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  "자기주식 취득 결의": "주주환원 관련 이벤트로 분류됨. 원문과 시세 반응 확인 권장.",
  "임원·주요주주 매수": "내부자 동향. 매수/매도 구분은 본문 확인 필요.",
  "정정공시": "기존 공시 정정. 변경 사유와 내용은 원문 확인 권장.",
  "단일판매·공급계약": "계약 규모와 직전 매출 비율은 본문 확인 권장.",
  "유상증자 발행": "자금 사용 목적(시설 vs 운영)에 따라 영향 다름.",
  "전환사채 발행": "전환가/만기/규모는 본문 확인 필요.",
};

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function goToStock(code: string) {
  window.location.href = "/stock/" + code;
}

function groupSignals(signals: DisclosureSignal[]): GroupedSignal[] {
  const groups = new Map<string, GroupedSignal>();
  for (const sig of signals) {
    const key = sig.disclosure.corp_name + "_" + sig.signalType;
    const isRevision = sig.disclosure.report_nm.includes("기재정정") || sig.disclosure.report_nm.includes("정정");
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        corp_name: sig.disclosure.corp_name,
        stock_code: sig.disclosure.stock_code,
        signalLabel: sig.signalLabel,
        signalType: sig.signalType,
        strength: sig.strength,
        representative: sig,
        count: 1,
        hasRevision: isRevision,
        rcept_dt_latest: sig.disclosure.rcept_dt,
      });
    } else {
      const g = groups.get(key)!;
      g.count++;
      if (isRevision) g.hasRevision = true;
      if (sig.disclosure.rcept_dt > g.rcept_dt_latest) {
        g.rcept_dt_latest = sig.disclosure.rcept_dt;
        g.representative = sig;
      }
    }
  }
  return Array.from(groups.values()).sort((a, b) => b.rcept_dt_latest.localeCompare(a.rcept_dt_latest));
}

export function DisclosureExplorer() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(3);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetch("/api/disclosures/recent?days=" + days)
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

  if (loading) {
    return (
      <div>
        <div className="text-xs text-zinc-500 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>최근 {days}일 DART 공시를 불러오고 있습니다...</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-lg p-4">
              <div className="h-4 w-1/3 bg-zinc-200 rounded mb-2 animate-pulse" />
              <div className="h-3 w-1/4 bg-zinc-100 rounded mb-2 animate-pulse" />
              <div className="h-3 w-2/3 bg-zinc-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-sm text-rose-700">
        공시 데이터를 가져오지 못했습니다: {error || "알 수 없는 에러"}
      </div>
    );
  }

  const grouped = groupSignals(data.signals);
  const filtered = filterType === "all" ? grouped : grouped.filter((g) => g.signalType === filterType);
  const signalCounts = grouped.reduce<Record<string, number>>((acc, g) => {
    acc[g.signalType] = (acc[g.signalType] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <header className="bg-white border border-zinc-200 rounded-lg p-3 md:p-4">
        <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-zinc-900">공시 신호</h2>
          <div className="text-xs text-zinc-500 tabular-nums">
            최근 {days}일 · 총 {data.totalDisclosures}건 · 신호 {data.signalCount}건 · 그룹 {grouped.length}건
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-3">
          {[3, 7, 14, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={"px-3 py-1 text-xs rounded-md border transition " +
                (days === d
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400")}
            >
              {d}일
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={"text-[11px] px-2.5 py-1 rounded-full border transition " +
              (filterType === "all"
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400")}
          >
            전체 {grouped.length}
          </button>
          {Object.entries(signalCounts).map(([type, count]) => {
            const rep = grouped.find((g) => g.signalType === type);
            if (!rep) return null;
            const style = SIGNAL_STYLES[rep.signalLabel] || { bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-300" };
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={"text-[11px] px-2.5 py-1 rounded-full border transition " +
                  (filterType === type
                    ? style.bg + " " + style.text + " " + style.border + " font-semibold"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400")}
              >
                {rep.signalLabel} {count}
              </button>
            );
          })}
        </div>
      </header>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-sm text-zinc-500 text-center py-12">해당 신호가 없습니다.</div>
        ) : (
          filtered.map((g) => {
            const style = SIGNAL_STYLES[g.signalLabel] || { bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-300" };
            const desc = SIGNAL_DESCRIPTIONS[g.signalLabel] || "원문과 시세 반응 함께 확인 권장.";
            const dt = g.rcept_dt_latest;
            const date = dt.length >= 8 ? dt.slice(0, 4) + "." + dt.slice(4, 6) + "." + dt.slice(6, 8) : dt;
            return (
              <div key={g.key} className={"bg-white border rounded-lg p-3 md:p-4 transition hover:border-zinc-300 " + style.border + "/50"}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={"text-[10px] px-2 py-0.5 rounded font-medium " + style.bg + " " + style.text}>
                        {g.signalLabel} {g.strength}
                      </span>
                      {g.count > 1 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">
                          {g.hasRevision ? "정정 포함 " : ""}{g.count}건
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-medium text-zinc-900">{g.corp_name}</span>
                      {g.stock_code ? (
                        <span className="text-[11px] text-zinc-400 tabular-nums">{g.stock_code}</span>
                      ) : null}
                      <span className="text-[11px] text-zinc-400 tabular-nums">{date}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-600 mb-2 leading-relaxed">{desc}</p>
                <div className="flex items-center gap-3 text-[11px]">
                  <button
                    type="button"
                    onClick={() => openExternal(g.representative.disclosure.url)}
                    className="text-blue-700 hover:underline"
                  >
                    원문 보기 ↗
                  </button>
                  {g.stock_code ? (
                    <button
                      type="button"
                      onClick={() => goToStock(g.stock_code!)}
                      className="text-zinc-500 hover:text-zinc-900"
                    >
                      종목 상세 →
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}