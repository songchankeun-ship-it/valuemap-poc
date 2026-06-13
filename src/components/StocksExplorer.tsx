"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Stock {
  ticker: string;
  name: string;
  currentPrice: number;
  changePct: number;
  marketCap: number;
  per: number;
  pbr: number;
  roe: number;
  dividendYield: number;
  eps: number;
  market: string;
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

type SortKey =
  | "compositeScore"
  | "momentum"
  | "flow"
  | "value"
  | "vol"
  | "per"
  | "pbr"
  | "roe"
  | "dividendYield"
  | "marketCap";
type SortDir = "desc" | "asc";
type CapBucket = "all" | "large" | "mid" | "small";
type MarketFilter = "all" | "KOSPI" | "KOSDAQ";

// 시가총액 구간 (원). 대형 5조+, 중형 1~5조, 소형 1조 미만
const CAP_LARGE = 5_000_000_000_000;
const CAP_MID = 1_000_000_000_000;

function inCapBucket(cap: number, bucket: CapBucket): boolean {
  if (bucket === "all") return true;
  if (bucket === "large") return cap >= CAP_LARGE;
  if (bucket === "mid") return cap >= CAP_MID && cap < CAP_LARGE;
  if (bucket === "small") return cap > 0 && cap < CAP_MID;
  return true;
}

function formatCap(cap: number): string {
  if (cap <= 0) return "-";
  const jo = cap / 1_000_000_000_000;
  if (jo >= 1) return jo.toFixed(1) + "조";
  const eok = cap / 100_000_000;
  return Math.round(eok).toLocaleString() + "억";
}

interface PresetConfig {
  perMin?: number;
  perMax?: number;
  pbrMin?: number;
  pbrMax?: number;
  minComposite?: number;
  roeMin?: number;
  divYieldMin?: number;
  capBucket?: CapBucket;
  excludeLoss?: boolean;
  market?: MarketFilter;
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

// 질문형 프리셋 — 자연어 질문 그대로 클릭
const QUESTION_PRESETS: Preset[] = [
  { id: "q-cheap-active", label: "싸고 거래 늘었나?", desc: "PER 15 이하 · 적자 제외 · 자금흐름 높은순", config: { perMax: 15, excludeLoss: true, sortKey: "flow", sortDir: "desc" } },
  { id: "q-good-earner", label: "돈 잘 버는 회사?", desc: "ROE 15%+ · 적자 제외", config: { roeMin: 15, excludeLoss: true, sortKey: "roe", sortDir: "desc" } },
  { id: "q-dividend", label: "배당 주는 우량주?", desc: "배당 2%+ · ROE 8%+", config: { divYieldMin: 2, roeMin: 8, excludeLoss: true, sortKey: "dividendYield", sortDir: "desc" } },
  { id: "q-bigcap-stable", label: "대형주 안정형?", desc: "대형주 · 위험대비 우수", config: { capBucket: "large", sortKey: "vol", sortDir: "desc" } },
  { id: "q-small-value", label: "숨은 소형 저평가?", desc: "소형주 · PBR 1.0 이하 · 적자 제외", config: { capBucket: "small", pbrMax: 1.0, excludeLoss: true, sortKey: "value", sortDir: "desc" } },
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
  const [roeMin, setRoeMin] = useState(0);
  const [divYieldMin, setDivYieldMin] = useState(0);
  const [capBucket, setCapBucket] = useState<CapBucket>("all");
  const [market, setMarket] = useState<MarketFilter>("all");
  const [excludeLoss, setExcludeLoss] = useState(false);
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
    setRoeMin(p.config.roeMin ?? 0);
    setDivYieldMin(p.config.divYieldMin ?? 0);
    setCapBucket(p.config.capBucket ?? "all");
    setMarket(p.config.market ?? "all");
    setExcludeLoss(p.config.excludeLoss ?? false);
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
      if (market !== "all" && s.market !== market) return false;
      if (!inCapBucket(s.marketCap, capBucket)) return false;
      if ((s.compositeScore || 0) < minComposite) return false;
      if (s.per > 0 && (s.per < perMin || s.per > perMax)) return false;
      if (s.pbr > 0 && (s.pbr < pbrMin || s.pbr > pbrMax)) return false;
      if (roeMin > 0 && s.roe < roeMin) return false;
      if (divYieldMin > 0 && s.dividendYield < divYieldMin) return false;
      if (excludeLoss && !(s.eps > 0)) return false;
      if (selectedThemes.size > 0) {
        if (!s.themes.some((t) => selectedThemes.has(t))) return false;
      }
      return true;
    });
  }, [stocks, query, market, capBucket, minComposite, perMin, perMax, pbrMin, pbrMax, roeMin, divYieldMin, excludeLoss, selectedThemes]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = 0;
      let bv = 0;
      if (sortKey === "compositeScore") { av = a.compositeScore || 0; bv = b.compositeScore || 0; }
      else if (sortKey === "momentum") { av = a.momentum; bv = b.momentum; }
      else if (sortKey === "flow") { av = a.flow; bv = b.flow; }
      else if (sortKey === "value") { av = a.value; bv = b.value; }
      else if (sortKey === "vol") { av = a.vol; bv = b.vol; }
      else if (sortKey === "per") { av = a.per; bv = b.per; }
      else if (sortKey === "pbr") { av = a.pbr; bv = b.pbr; }
      else if (sortKey === "roe") { av = a.roe; bv = b.roe; }
      else if (sortKey === "dividendYield") { av = a.dividendYield; bv = b.dividendYield; }
      else if (sortKey === "marketCap") { av = a.marketCap; bv = b.marketCap; }
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [filtered, sortKey, sortDir]);

  const activeFilterCount =
    (minComposite > 0 ? 1 : 0) +
    (perMin > 0 || perMax < 200 ? 1 : 0) +
    (pbrMin > 0 || pbrMax < 30 ? 1 : 0) +
    (roeMin > 0 ? 1 : 0) +
    (divYieldMin > 0 ? 1 : 0) +
    (capBucket !== "all" ? 1 : 0) +
    (market !== "all" ? 1 : 0) +
    (excludeLoss ? 1 : 0) +
    selectedThemes.size;

  function resetFilters() {
    setMinComposite(0);
    setPerMin(0);
    setPerMax(200);
    setPbrMin(0);
    setPbrMax(30);
    setRoeMin(0);
    setDivYieldMin(0);
    setCapBucket("all");
    setMarket("all");
    setExcludeLoss(false);
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

  const CAP_OPTIONS: { id: CapBucket; label: string }[] = [
    { id: "all", label: "전체" },
    { id: "large", label: "대형 5조+" },
    { id: "mid", label: "중형 1~5조" },
    { id: "small", label: "소형 1조-" },
  ];
  const MARKET_OPTIONS: { id: MarketFilter; label: string }[] = [
    { id: "all", label: "전체" },
    { id: "KOSPI", label: "코스피" },
    { id: "KOSDAQ", label: "코스닥" },
  ];

  function FilterPanel() {
    return (
      <div className="space-y-5">
        <div>
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-2">시장</label>
          <div className="grid grid-cols-3 gap-1.5">
            {MARKET_OPTIONS.map((o) => (
              <button key={o.id} type="button" onClick={() => { setActivePreset(null); setMarket(o.id); }}
                className={"text-xs px-2 py-1.5 rounded border transition " + (market === o.id ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-blue-400")}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-2">시가총액</label>
          <div className="grid grid-cols-2 gap-1.5">
            {CAP_OPTIONS.map((o) => (
              <button key={o.id} type="button" onClick={() => { setActivePreset(null); setCapBucket(o.id); }}
                className={"text-xs px-2 py-1.5 rounded border transition " + (capBucket === o.id ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-blue-400")}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
            최소 종합점수: <span className="tabular-nums">{minComposite}</span>
          </label>
          <input type="range" min={0} max={100} step={5} value={minComposite} onChange={(e) => { setActivePreset(null); setMinComposite(Number(e.target.value)); }} className="w-full" />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
            최소 ROE: <span className="tabular-nums">{roeMin}%</span>
          </label>
          <input type="range" min={0} max={30} step={1} value={roeMin} onChange={(e) => { setActivePreset(null); setRoeMin(Number(e.target.value)); }} className="w-full" />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
            최소 배당수익률: <span className="tabular-nums">{divYieldMin.toFixed(1)}%</span>
          </label>
          <input type="range" min={0} max={6} step={0.5} value={divYieldMin} onChange={(e) => { setActivePreset(null); setDivYieldMin(Number(e.target.value)); }} className="w-full" />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-2">PER 범위: <span className="tabular-nums">{perMin} - {perMax}</span></label>
          <div className="flex gap-2">
            <input type="number" value={perMin} onChange={(e) => { setActivePreset(null); setPerMin(Number(e.target.value)); }} className="w-1/2 px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded" min={0} />
            <input type="number" value={perMax} onChange={(e) => { setActivePreset(null); setPerMax(Number(e.target.value)); }} className="w-1/2 px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded" min={0} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-2">PBR 범위: <span className="tabular-nums">{pbrMin.toFixed(1)} - {pbrMax.toFixed(1)}</span></label>
          <div className="flex gap-2">
            <input type="number" value={pbrMin} step={0.1} onChange={(e) => { setActivePreset(null); setPbrMin(Number(e.target.value)); }} className="w-1/2 px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded" min={0} />
            <input type="number" value={pbrMax} step={0.1} onChange={(e) => { setActivePreset(null); setPbrMax(Number(e.target.value)); }} className="w-1/2 px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded" min={0} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
          <input type="checkbox" checked={excludeLoss} onChange={(e) => { setActivePreset(null); setExcludeLoss(e.target.checked); }} className="rounded" />
          적자 기업 제외 <span className="text-zinc-400 font-normal">(EPS &gt; 0)</span>
        </label>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">테마 <span className="text-zinc-400 tabular-nums">({selectedThemes.size}개 선택)</span></label>
            {selectedThemes.size > 0 ? (
              <button type="button" onClick={() => setSelectedThemes(new Set())} className="text-[10px] text-blue-700 hover:underline">선택 초기화</button>
            ) : null}
          </div>
          <input type="search" placeholder="테마 검색..." value={themeQuery} onChange={(e) => setThemeQuery(e.target.value)} className="w-full mb-2 px-2 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded focus:outline-none focus:border-blue-500" />
          {!themeQuery && !showAllThemes ? (<div className="text-[10px] text-zinc-500 mb-1.5">인기 테마 {popularThemes.length}개</div>) : null}
          <div className="max-h-44 overflow-y-auto space-y-0.5 border border-zinc-200 dark:border-zinc-700 rounded p-2 bg-white dark:bg-zinc-900">
            {visibleThemes.length === 0 ? (<div className="text-[11px] text-zinc-400 text-center py-3">일치하는 테마가 없습니다</div>) : (
              visibleThemes.map((t) => (
                <label key={t} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 px-1 py-0.5 rounded">
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
        <button type="button" onClick={resetFilters} className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">필터 전체 초기화</button>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-lg md:text-xl font-semibold text-zinc-900 dark:text-zinc-100">종목 탐색</h1>
        <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">{sorted.length}개 / {stocks.length}개 종목</span>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">빠른 프리셋</span>
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
                  : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-blue-400 hover:text-blue-700")}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mt-3 mb-2">질문형 프리셋</div>
        <div className="flex gap-1.5 flex-wrap">
          {QUESTION_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              title={p.desc}
              className={"text-xs px-3 py-1.5 rounded-full border transition " +
                (activePreset === p.id
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white dark:bg-zinc-800 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800 hover:border-violet-400")}
            >
              {p.label}
            </button>
          ))}
        </div>
        {activePreset ? (
          <div className="text-[10px] text-zinc-500 mt-2">
            적용 중: <strong className="text-zinc-700 dark:text-zinc-300">{[...PRESETS, ...QUESTION_PRESETS].find(p => p.id === activePreset)?.desc}</strong>
          </div>
        ) : null}
      </div>

      <div className="flex gap-2 flex-wrap">
        <input type="search" placeholder="종목명 · 티커" value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        <select value={sortKey + "-" + sortDir} onChange={(e) => { setActivePreset(null); const [k, d] = e.target.value.split("-"); setSortKey(k as SortKey); setSortDir(d as SortDir); }} className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900">
          <option value="compositeScore-desc">종합점수 높은순</option>
          <option value="momentum-desc">모멘텀 높은순</option>
          <option value="value-desc">밸류 높은순</option>
          <option value="vol-desc">변동성조정 높은순</option>
          <option value="roe-desc">ROE 높은순</option>
          <option value="dividendYield-desc">배당수익률 높은순</option>
          <option value="marketCap-desc">시가총액 큰순</option>
          <option value="per-asc">PER 낮은순</option>
          <option value="pbr-asc">PBR 낮은순</option>
        </select>
        <button type="button" onClick={() => setDrawerOpen(true)} className="lg:hidden px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          필터
          {activeFilterCount > 0 ? (
            <span className="ml-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-blue-600 text-white font-medium tabular-nums">{activeFilterCount}</span>
          ) : null}
        </button>
      </div>

      {activeFilterCount > 0 ? (
        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <span>필터 {activeFilterCount}개 적용 중 ·</span>
          <button type="button" onClick={resetFilters} className="text-blue-700 hover:underline">초기화</button>
        </div>
      ) : null}

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-md px-3 py-2 text-[10px] text-blue-800 dark:text-blue-300 flex items-center justify-between md:hidden">
        <span><strong>M</strong>=추세 · <strong>F</strong>=거래 · <strong>V</strong>=저평가 · <strong>Vo</strong>=위험대비</span>
        <Link href="/guide/metrics" className="text-blue-700 dark:text-blue-400 underline shrink-0 ml-2">자세히</Link>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="hidden lg:block bg-zinc-50/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 h-fit sticky top-24">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">필터</h3>
          <FilterPanel />
        </aside>

        <div className="space-y-2">
          {sorted.length === 0 ? (
            <div className="text-sm text-zinc-500 text-center py-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">조건에 맞는 종목이 없습니다.</div>
          ) : (
            sorted.slice(0, 100).map((s) => (
              <Link key={s.ticker} href={"/stock/" + s.ticker} className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{s.name}</span>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0 font-mono">{s.ticker}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">{s.market}</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{s.currentPrice.toLocaleString()}원</span>
                      <span className={"text-[11px] tabular-nums " + (s.changePct >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400")}>
                        {s.changePct >= 0 ? "▲" : "▼"} {Math.abs(s.changePct).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums flex-wrap">
                      <span>시총 {formatCap(s.marketCap)}</span>
                      <span>PER {s.per > 0 ? s.per.toFixed(1) : "-"}</span>
                      <span>PBR {s.pbr > 0 ? s.pbr.toFixed(2) : "-"}</span>
                      <span>ROE {s.roe > 0 ? s.roe.toFixed(1) + "%" : "-"}</span>
                      {s.dividendYield > 0 ? <span>배당 {s.dividendYield.toFixed(1)}%</span> : null}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-baseline gap-1 justify-end mb-2">
                      <span className="text-lg font-bold text-blue-700 dark:text-blue-400 tabular-nums">{s.compositeScore || 0}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">/100</span>
                    </div>
                    <div className="flex gap-1 justify-end text-[10px] flex-wrap">
                      <span title="모멘텀(추세)" className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded tabular-nums cursor-help">M{s.momentum}</span>
                      <span title="자금흐름(거래)" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded tabular-nums cursor-help">F{s.flow}</span>
                      <span title="밸류(저평가)" className="bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 px-1.5 py-0.5 rounded tabular-nums cursor-help">V{s.value}</span>
                      <span title="변동성조정(위험대비)" className="bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded tabular-nums cursor-help">Vo{s.vol}</span>
                    </div>
                  </div>
                </div>
                {(() => {
                  const insights: { label: string; tone: string }[] = [];
                  if (s.momentum >= 70) insights.push({ label: "추세 강함", tone: "bg-blue-50 text-blue-700 border-blue-200" });
                  if (s.flow >= 70) insights.push({ label: "거래 활발", tone: "bg-green-50 text-green-700 border-green-200" });
                  if (s.value >= 70) insights.push({ label: "저평가 가능", tone: "bg-cyan-50 text-cyan-700 border-cyan-200" });
                  if (s.vol >= 70) insights.push({ label: "위험 대비 양호", tone: "bg-orange-50 text-orange-700 border-orange-200" });
                  if (s.momentum < 40 && s.flow < 40) insights.push({ label: "약세 흐름", tone: "bg-zinc-50 text-zinc-600 border-zinc-200" });
                  return insights.length > 0 ? (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {insights.slice(0, 2).map((i) => (
                        <span key={i.label} className={"text-[10px] px-1.5 py-0.5 rounded border font-medium " + i.tone}>
                          {i.label}
                        </span>
                      ))}
                    </div>
                  ) : null;
                })()}
                {s.themes.length > 0 ? (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {s.themes.slice(0, 3).map((t) => (<span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{t}</span>))}
                    {s.themes.length > 3 ? (<span className="text-[10px] text-zinc-400 dark:text-zinc-500">+{s.themes.length - 3}</span>) : null}
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
          <div className="lg:hidden fixed inset-y-0 right-0 w-[340px] max-w-[90vw] bg-white dark:bg-zinc-950 z-50 shadow-2xl flex flex-col">
            <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">필터</h3>
              <button type="button" onClick={() => setDrawerOpen(false)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4"><FilterPanel /></div>
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0 grid grid-cols-2 gap-2">
              <button type="button" onClick={resetFilters} className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800">초기화</button>
              <button type="button" onClick={() => setDrawerOpen(false)} className="px-3 py-2 text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded hover:bg-zinc-800">{sorted.length}개 보기</button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
