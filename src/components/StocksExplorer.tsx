"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MockStock } from "@/lib/mockData";
import { SORT_OPTIONS, type SortKey, composite } from "@/lib/mockStockPool";

interface Props {
  initialStocks: MockStock[];
  themes: string[];
}

export function StocksExplorer({ initialStocks, themes }: Props) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("compositeDesc");
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());
  const [minComposite, setMinComposite] = useState(0);
  const [perRange, setPerRange] = useState<[number, number]>([0, 100]);
  const [pbrRange, setPbrRange] = useState<[number, number]>([0, 20]);

  const filtered = useMemo(() => {
    let out = initialStocks;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.ticker.includes(search.trim()) ||
          s.themes.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (selectedThemes.size > 0) {
      out = out.filter((s) => s.themes.some((t) => selectedThemes.has(t)));
    }
    if (minComposite > 0) {
      out = out.filter((s) => composite(s) >= minComposite);
    }
    out = out.filter((s) => s.per >= perRange[0] && s.per <= perRange[1]);
    out = out.filter((s) => s.pbr >= pbrRange[0] && s.pbr <= pbrRange[1]);

    const sorter = SORT_OPTIONS.find((o) => o.key === sortKey)?.sorter;
    if (sorter) out = [...out].sort(sorter);
    return out;
  }, [initialStocks, search, sortKey, selectedThemes, minComposite, perRange, pbrRange]);

  function toggleTheme(t: string) {
    setSelectedThemes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  function resetFilters() {
    setSearch("");
    setSortKey("compositeDesc");
    setSelectedThemes(new Set());
    setMinComposite(0);
    setPerRange([0, 100]);
    setPbrRange([0, 20]);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
      {/* 사이드 필터 패널 */}
      <aside className="space-y-4">
        {/* 검색 */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <label className="text-[11px] text-gray-500 mb-1 block">검색</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="종목명·티커·테마"
            className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm"
          />
        </div>

        {/* 정렬 */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <label className="text-[11px] text-gray-500 mb-1 block">정렬</label>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* 종합점수 최소값 */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <label className="text-[11px] text-gray-500 mb-1 block flex justify-between">
            <span>종합점수 ≥</span>
            <span className="font-medium text-brand-600">{minComposite}</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minComposite}
            onChange={(e) => setMinComposite(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* PER 범위 */}
        <RangeFilter
          label="PER 범위"
          range={perRange}
          min={0}
          max={100}
          step={1}
          onChange={setPerRange}
        />

        {/* PBR 범위 */}
        <RangeFilter
          label="PBR 범위"
          range={pbrRange}
          min={0}
          max={20}
          step={0.5}
          onChange={setPbrRange}
        />

        {/* 테마 멀티 선택 */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex justify-between mb-2">
            <label className="text-[11px] text-gray-500">테마 ({selectedThemes.size}개 선택)</label>
            {selectedThemes.size > 0 && (
              <button
                onClick={() => setSelectedThemes(new Set())}
                className="text-[10px] text-brand-600"
              >
                초기화
              </button>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {themes.map((t) => (
              <label
                key={t}
                className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedThemes.has(t)}
                  onChange={() => toggleTheme(t)}
                />
                <span>{t}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={resetFilters}
          className="w-full py-2 text-xs text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50"
        >
          모든 필터 초기화
        </button>
      </aside>

      {/* 결과 테이블 */}
      <main>
        <div className="text-xs text-gray-500 mb-2">
          <strong className="text-gray-900">{filtered.length}</strong>개 종목 (전체 {initialStocks.length}개 중)
        </div>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-500">
                  <th className="text-left p-2 font-medium">종목</th>
                  <th className="text-right p-2 font-medium">현재가</th>
                  <th className="text-right p-2 font-medium">등락률</th>
                  <th className="text-right p-2 font-medium">PER</th>
                  <th className="text-right p-2 font-medium">PBR</th>
                  <th className="text-right p-2 font-medium">ROE</th>
                  <th className="text-right p-2 font-medium">밸류</th>
                  <th className="text-right p-2 font-medium">자금</th>
                  <th className="text-right p-2 font-medium">종합</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.ticker}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="p-2">
                      <Link
                        href={`/stock/${s.ticker}`}
                        className="hover:text-brand-600"
                      >
                        <div className="font-medium text-gray-900">{s.name}</div>
                        <div className="text-[10px] text-gray-400">{s.ticker}</div>
                      </Link>
                    </td>
                    <td className="text-right p-2 tabular-nums">{s.currentPrice.toLocaleString()}</td>
                    <td className={`text-right p-2 tabular-nums ${s.changePct >= 0 ? "text-success" : "text-danger"}`}>
                      {s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                    </td>
                    <td className="text-right p-2 tabular-nums">{s.per.toFixed(1)}</td>
                    <td className="text-right p-2 tabular-nums">{s.pbr.toFixed(2)}</td>
                    <td className="text-right p-2 tabular-nums">{s.roe.toFixed(1)}%</td>
                    <td className="text-right p-2 tabular-nums">
                      <ScoreCell score={s.value} />
                    </td>
                    <td className="text-right p-2 tabular-nums">
                      <ScoreCell score={s.flow} />
                    </td>
                    <td className="text-right p-2 tabular-nums">
                      <ScoreCell score={composite(s)} highlight />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-sm text-gray-400">
                      조건에 맞는 종목이 없습니다. 필터를 조정해보세요.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function ScoreCell({ score, highlight }: { score: number; highlight?: boolean }) {
  const tone =
    score >= 70 ? (highlight ? "text-brand-700 font-semibold" : "text-brand-600 font-medium")
    : score >= 50 ? "text-gray-700"
    : "text-gray-400";
  return <span className={tone}>{score}</span>;
}

function RangeFilter({
  label, range, min, max, step, onChange,
}: {
  label: string;
  range: [number, number];
  min: number; max: number; step: number;
  onChange: (r: [number, number]) => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <label className="text-[11px] text-gray-500 mb-1 flex justify-between">
        <span>{label}</span>
        <span className="font-medium">{range[0]} ~ {range[1]}</span>
      </label>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <input
          type="number"
          value={range[0]}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange([Number(e.target.value), range[1]])}
          className="px-2 py-1 border border-gray-200 rounded text-xs w-full"
        />
        <input
          type="number"
          value={range[1]}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange([range[0], Number(e.target.value)])}
          className="px-2 py-1 border border-gray-200 rounded text-xs w-full"
        />
      </div>
    </div>
  );
}
