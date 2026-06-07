"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Stock {
  ticker: string;
  name: string;
  currentPrice: number;
  changePct: number;
  per: number;
  pbr: number;
  roe: number;
  momentum: number;
  flow: number;
  value: number;
  vol: number;
  compositeScore?: number;
  themes: string[];
}

interface Props {
  stocks: Stock[];
  allThemes: string[];
}

type SortKey = "compositeScore" | "momentum" | "value" | "vol" | "per" | "pbr";
type SortDir = "desc" | "asc";

interface PresetConfig {
  perMin?: number;
  perMax?: number;
  pbrMin?: number;
  pbrMax?: number;
  minComposite?: number;
  sortKey: SortKey;
  sortDir: SortDir;
}

interface Preset {
  id: string;
  label: string;
  desc: string;
  config: PresetConfig;
}

const PRESETS: Preset[] = [
  { id: "lowper", label: "저평가 (저PER)", desc: "PER 15 이하 · 밸류 정렬", config: { perMax: 15, sortKey: "value", sortDir: "desc" } },
  { id: "momentum", label: "모멘텀 강세", desc: "추세 강한 종목 · 종합 60+", config: { minComposite: 60, sortKey: "momentum", sortDir: "desc" } },
  { id: "lowpbr", label: "저PBR", desc: "PBR 1.0 이하 · 밸류 정렬", config: { pbrMax: 1.0, sortKey: "value", sortDir: "desc" } },
  { id: "value-momentum", label: "밸류+모멘텀", desc: "두 지표 모두 우호적", config: { minComposite: 70, sortKey: "compositeScore", sortDir: "desc" } },
  { id: "balanced", label: "균형 종목", desc: "종합 80+", config: { minComposite: 80, sortKey: "compositeScore", sortDir: "desc" } },
];

export function StocksExplorer({ stocks, allThemes }: Props) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("compositeScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [minComposite, setMinComposite] = useState(0);
  const [perMin, setPerMin] = useState(0);
  const [perMax, setPerMax] = useState(200);
  const [pbrMin, setPbrMin] = useState(0);
  const [pbrMax, setPbrMax] = useState(30);
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());
  const [themeQuery, setThemeQuery] = useState("");
  const [showAllThemes, setShowAllThemes] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  function applyPreset(p: Preset) {
    setActivePreset(p.id);
    setPerMin(p.config.perMin ?? 0);
    setPerMax(p.config.perMax ?? 200);
    setPbrMin(p.config.pbrMin ?? 0);
    setPbrMax(p.config.pbrMax ?? 30);
    setMinComposite(p.config.minComposite ?? 0);
    setSortKey(p.config.sortKey);
    setSortDir(p.config.sortDir);
    setSelectedThemes(new Set());
    setThemeQuery("");
    setShowAllThemes(false);
  }

  const popularThemes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of stocks) {
      for (const t of s.themes) {
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
  }, [stocks]);

  const visibleThemes = useMemo(() => {
    if (themeQuery.trim()) {
      const q = themeQuery.toLowerCase();
      return allThemes.filter((t) => t.toLowerCase().includes(q));
    }
    if (showAllThemes) return allThemes;
    return popularThemes;
  }, [allThemes, themeQuery, showAllThemes, popularThemes]);

  const filtered = useMemo(() => {
    return stocks.filter((s) => {
      if (query) {
        const q = query.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.ticker.includes(q)) return false;
      }
      if ((s.compositeScore || 0) < minComposite) return false;
      if (s.per > 0 && (s.per < perMin || s.per > perMax)) return false;
      if (s.pbr > 0 && (s.pbr < pbrMin || s.pbr > pbrMax)) return false;
      if (selectedThemes.size > 0) {
        if (!s.themes.some((t) => selectedThemes.has(t))) return false;
      }
      return true;
    });
  }, [stocks, query, minComposite, perMin, perMax, pbrMin, pbrMax, selectedThemes]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = 0;
      let bv = 0;
      if (sortKey === "compositeScore") { av = a.compositeScore || 0; bv = b.compositeScore || 0; }
      else if (sortKey === "momentum") { av = a.momentum; bv = b.momentum; }
      else if (sortKey === "value") { av = a.value; bv = b.value; }
      else if (sortKey === "vol") { av = a.vol; bv = b.vol; }
      else if (sortKey === "per") { av = a.per; bv = b.per; }
      else if (sortKey === "pbr") { av = a.pbr; bv = b.pbr; }
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [filtered, sortKey, sortDir]);

  const activeFilterCount =
    (minComposite > 0 ? 1 : 0) +
    (perMin > 0 || perMax < 200 ? 1 : 0) +
    (pbrMin > 0 || pbrMax < 30 ? 1 : 0) +
    selectedThemes.size;

  function resetFilters() {
    setMinComposite(0);
    setPerMin(0);
    setPerMax(200);
    setPbrMin(0);
    setPbrMax(30);
    setSelectedThemes(new Set());
    setThemeQuery("");
    setShowAllThemes(false);
    setActivePreset(null);
    setSortKey("compositeScore");
    setSortDir("desc");
  }

  function toggleTheme(t: string) {
    setActivePreset(null);
    const next = new Set(selectedThemes);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    setSelectedThemes(next);
  }

  function FilterPanel() {
    return (
      <div className="space-y-5">
        <div>
          <label className="text-xs font-medium text-zinc-700 block mb-2">
            최소 종합점수: <span className="tabular-nums">{minComposite}</span>
          </label>
          <input type="range" min={0} max={100} step={5} value={minComposite} onChange={(e) => { setActivePreset(null); setMinComposite(Number(e.target.value)); }} className="w-full" />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700 block mb-2">PER 범위: <span className="tabular-nums">{perMin} - {perMax}</span></label>
          <div className="flex gap-2">
            <input type="number" value={perMin} onChange={(e) => { setActivePreset(null); setPerMin(Number(e.target.value)); }} className="w-1/2 px-2 py-1 text-xs border border-zinc-200 rounded" min={0} />
            <input type="number" value={perMax} onChange={(e) => { setActivePreset(null); setPerMax(Number(e.target.value)); }} className="w-1/2 px-2 py-1 text-xs border border-zinc-200 rounded" min={0} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700 block mb-2">PBR 범위: <span className="tabular-nums">{pbrMin.toFixed(1)} - {pbrMax.toFixed(1)}</span></label>
          <div className="flex gap-2">
            <input type="number" value={pbrMin} step={0.1} onChange={(e) => { setActivePreset(null); setPbrMin(Number(e.target.value)); }} className="w-1/2 px-2 py-1 text-xs border border-zinc-200 rounded" min={0} />
            <input type="number" value={pbrMax} step={0.1} onChange={(e) => { setActivePreset(null); setPbrMax(Number(e.target.value)); }} className="w-1/2 px-2 py-1 text-xs border border-zinc-200 rounded" min={0} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-zinc-700">테마 <span className="text-zinc-400 tabular-nums">({selectedThemes.size}개 선택)</span></label>
            {selectedThemes.size > 0 ? (
              <button type="button" onClick={() => setSelectedThemes(new Set())} className="text-[10px] text-blue-700 hover:underline">선택 초기화</button>
            ) : null}
          </div>
          <input type="search" placeholder="테마 검색..." value={themeQuery} onChange={(e) => setThemeQuery(e.target.value)} className="w-full mb-2 px-2 py-1.5 text-xs border border-zinc-200 rounded focus:outline-none focus:border-blue-500" />
          {!themeQuery && !showAllThemes ? (<div className="text-[10px] text-zinc-500 mb-1.5">인기 테마 {popularThemes.length}개</div>) : null}
          <div className="max-h-44 overflow-y-auto space-y-0.5 border border-zinc-200 rounded p-2 bg-white">
            {visibleThemes.length === 0 ? (<div className="text-[11px] text-zinc-400 text-center py-3">일치하는 테마가 없습니다</div>) : (
              visibleThemes.map((t) => (
                <label key={t} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-zinc-50 px-1 py-0.5 rounded">
                  <input type="checkbox" checked={selectedThemes.has(t)} onChange={() => toggleTheme(t)} className="rounded shrink-0" />
                  <span className="truncate">{t}</span>
                </label>
              ))
            )}
          </div>
          {!themeQuery && !showAllThemes && allThemes.length > popularThemes.length ? (
            <button type="button" onClick={() => setShowAllThemes(true)} className="mt-2 text-[11px] text-blue-700 hover:underline">전체 테마 보기 ({allThemes.length}개) →</button>
          ) : null}
          {showAllThemes ? (
            <button type="button" onClick={() => setShowAllThemes(false)} className="mt-2 text-[11px] text-blue-700 hover:underline">← 인기 테마만 보기</button>
          ) : null}
        </div>
        <button type="button" onClick={resetFilters} className="w-full px-3 py-2 text-xs border border-zinc-300 rounded hover:bg-zinc-50 transition">필터 전체 초기화</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold text-zinc-900">종목 탐색</h1>
        <span className="text-xs text-zinc-500 tabular-nums">{sorted.length}개 / {stocks.length}개 종목</span>
      </div>

      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider">빠른 프리셋</span>
          {activePreset ? (
            <button type="button" onClick={resetFilters} className="text-[10px] text-blue-700 hover:underline">초기화</button>
          ) : null}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              title={p.desc}
              className={"text-xs px-3 py-1.5 rounded-full border transition " +
                (activePreset === p.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-zinc-700 border-zinc-200 hover:border-blue-400 hover:text-blue-700")}
            >
              {p.label}
            </button>
          ))}
        </div>
        {activePreset ? (
          <div className="text-[10px] text-zinc-500 mt-2">
            적용 중: <strong className="text-zinc-700">{PRESETS.find(p => p.id === activePreset)?.desc}</strong>
          </div>
        ) : null}
      </div>

      <div className="flex gap-2 flex-wrap">
        <input type="search" placeholder="종목명 · 티커" value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        <select value={sortKey + "-" + sortDir} onChange={(e) => { setActivePreset(null); const [k, d] = e.target.value.split("-"); setSortKey(k as SortKey); setSortDir(d as SortDir); }} className="px-3 py-2 text-sm border border-zinc-200 rounded-md bg-white">
          <option value="compositeScore-desc">종합점수 높은순</option>
          <option value="momentum-desc">모멘텀 높은순</option>
          <option value="value-desc">밸류 높은순</option>
          <option value="vol-desc">변동성조정 높은순</option>
          <option value="per-asc">PER 낮은순</option>
          <option value="pbr-asc">PBR 낮은순</option>
        </select>
        <button type="button" onClick={() => setDrawerOpen(true)} className="lg:hidden px-3 py-2 text-sm border border-zinc-200 rounded-md bg-white flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          필터
          {activeFilterCount > 0 ? (
            <span className="ml-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-blue-600 text-white font-medium tabular-nums">{activeFilterCount}</span>
          ) : null}
        </button>
      </div>

      {activeFilterCount > 0 ? (
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <span>필터 {activeFilterCount}개 적용 중 ·</span>
          <button type="button" onClick={resetFilters} className="text-blue-700 hover:underline">초기화</button>
        </div>
      ) : null}

      <div className="bg-blue-50 border border-blue-100 rounded-md px-3 py-2 text-[10px] text-blue-800 flex items-center justify-between md:hidden">
        <span>지표 약어: <strong>M</strong>=모멘텀 · <strong>F</strong>=자금흐름 · <strong>V</strong>=밸류 · <strong>Vo</strong>=변동성조정</span>
        <Link href="/guide/metrics" className="text-blue-700 underline shrink-0 ml-2">자세히</Link>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="hidden lg:block bg-zinc-50/60 border border-zinc-200 rounded-lg p-4 h-fit sticky top-24">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">필터</h3>
          <FilterPanel />
        </aside>

        <div className="space-y-2">
          {sorted.length === 0 ? (
            <div className="text-sm text-zinc-500 text-center py-12 bg-white border border-zinc-200 rounded-lg">조건에 맞는 종목이 없습니다.</div>
          ) : (
            sorted.slice(0, 100).map((s) => (
              <Link key={s.ticker} href={"/stock/" + s.ticker} className="block bg-white border border-zinc-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-zinc-900 truncate">{s.name}</span>
                      <span className="text-[11px] text-zinc-400 tabular-nums shrink-0">{s.ticker}</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-semibold text-zinc-900 tabular-nums">{s.currentPrice.toLocaleString()}원</span>
                      <span className={"text-[11px] tabular-nums " + (s.changePct >= 0 ? "text-emerald-600" : "text-rose-600")}>
                        {s.changePct >= 0 ? "▲" : "▼"} {Math.abs(s.changePct).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 tabular-nums flex-wrap">
                      <span>PER {s.per > 0 ? s.per.toFixed(1) : "-"}</span>
                      <span>PBR {s.pbr > 0 ? s.pbr.toFixed(2) : "-"}</span>
                      <span>ROE {s.roe > 0 ? s.roe.toFixed(1) + "%" : "-"}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-baseline gap-1 justify-end mb-2">
                      <span className="text-lg font-bold text-blue-700 tabular-nums">{s.compositeScore || 0}</span>
                      <span className="text-[10px] text-zinc-400">/100</span>
                    </div>
                    <div className="flex gap-1 justify-end text-[10px] flex-wrap">
                      <span title="모멘텀" className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded tabular-nums cursor-help">M{s.momentum}</span>
                      <span title="자금흐름" className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded tabular-nums cursor-help">F{s.flow}</span>
                      <span title="밸류" className="bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded tabular-nums cursor-help">V{s.value}</span>
                      <span title="변동성조정" className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded tabular-nums cursor-help">Vo{s.vol}</span>
                    </div>
                  </div>
                </div>
                {s.themes.length > 0 ? (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {s.themes.slice(0, 3).map((t) => (<span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">{t}</span>))}
                    {s.themes.length > 3 ? (<span className="text-[10px] text-zinc-400">+{s.themes.length - 3}</span>) : null}
                  </div>
                ) : null}
              </Link>
            ))
          )}
          {sorted.length > 100 ? (<div className="text-xs text-zinc-500 text-center py-3">상위 100개만 표시. 필터를 좁혀주세요.</div>) : null}
        </div>
      </div>

      {drawerOpen ? (
        <>
          <div onClick={() => setDrawerOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-50" aria-hidden />
          <div className="lg:hidden fixed inset-y-0 right-0 w-[340px] max-w-[90vw] bg-white z-50 shadow-2xl flex flex-col">
            <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-200 shrink-0">
              <h3 className="text-sm font-semibold text-zinc-900">필터</h3>
              <button type="button" onClick={() => setDrawerOpen(false)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-100 text-zinc-500">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4"><FilterPanel /></div>
            <div className="p-3 border-t border-zinc-200 shrink-0 grid grid-cols-2 gap-2">
              <button type="button" onClick={resetFilters} className="px-3 py-2 text-sm border border-zinc-300 rounded hover:bg-zinc-50">초기화</button>
              <button type="button" onClick={() => setDrawerOpen(false)} className="px-3 py-2 text-sm bg-zinc-900 text-white rounded hover:bg-zinc-800">{sorted.length}개 보기</button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}