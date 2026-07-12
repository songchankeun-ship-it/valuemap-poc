"use client";

import { useState, useMemo, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, Bell, Check, Search, ShieldCheck, Sprout, TrendingUp, type LucideIcon } from "lucide-react";
import { fmtWon } from "@/lib/format";
import { listSavedSearches, addSavedSearch, removeSavedSearch, consumeQueuedSavedSearch, type SavedSearch, type SavedSearchConfig } from "@/lib/savedSearches";
import { getRecentViews, type RecentView } from "@/lib/recentViews";
import { addConditionAlert } from "@/lib/conditionAlerts";
import { DataStatusBadge, DataLagBadge } from "@/components/trust/badges";
import { StockResultsTable, deriveSignals } from "@/components/stocks/StockResultsTable";
import { useLanguage } from "@/components/LanguageProvider";
import { stocksCopy } from "@/lib/copy/stocks";
import type { Locale } from "@/lib/i18n";
import { FOCUS_RING, INPUT_FOCUS } from "@/components/ui/controlStyles";

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
  sector?: string;
  r3m?: number | null; // 최근 3개월 등락률 %
}

type ViewMode = "card" | "table";

interface Props {
  stocks: Stock[];
  allThemes: string[];
  initialThemes?: string[];
  initialSector?: string;
  initialQuery?: string;
  totalCount?: number;
  asOf?: string;
  metricsVersion?: string;
  dataStale?: boolean;
  /** 가격 기준일이 전역 기준일보다 과거인(최신 배치 미반영) 종목 티커 — '데이터 지연' 배지용. */
  laggedTickers?: string[];
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
  | "marketCap"
  | "r3m";
type SortDir = "desc" | "asc";
type CapBucket = "all" | "large" | "mid" | "small";
type MarketFilter = "all" | "KOSPI" | "KOSDAQ";

// 시가총액 구간 (원). 대형 5조+, 중형 1~5조, 소형 1조 미만
const CAP_LARGE = 5_000_000_000_000;
const CAP_MID = 1_000_000_000_000;

// 기본 품질 필터(PER≤200·PBR≤30)를 해제하고 전체 138개를 볼 때 PER/PBR 상한에 쓰는 '사실상 상한 없음' 값.
const NO_MAX = 999999;
const DEFAULT_PER_MAX = 200;
const DEFAULT_PBR_MAX = 30;
const RECENT_SEARCH_KEY = "ornscore_recent_stock_searches";

function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_SEARCH_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

function writeRecentSearches(items: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(items.slice(0, 6)));
  } catch {
    // localStorage가 막힌 환경에서는 최근 검색만 조용히 생략한다.
  }
}

function inCapBucket(cap: number, bucket: CapBucket): boolean {
  if (bucket === "all") return true;
  if (bucket === "large") return cap >= CAP_LARGE;
  if (bucket === "mid") return cap >= CAP_MID && cap < CAP_LARGE;
  if (bucket === "small") return cap > 0 && cap < CAP_MID;
  return true;
}

interface PresetConfig {
  perMin?: number;
  perMax?: number;
  pbrMin?: number;
  pbrMax?: number;
  minComposite?: number;
  roeMin?: number;
  divYieldMin?: number;
  momentumMin?: number;
  flowMin?: number;
  valueMin?: number;
  volMin?: number;
  capBucket?: CapBucket;
  excludeLoss?: boolean;
  market?: MarketFilter;
  sortKey: SortKey;
  sortDir: SortDir;
}

interface Preset {
  id: string;
  config: PresetConfig;
}

interface QuestionPreset extends Preset {
  Icon: LucideIcon;
}

// 빠른 프리셋 — 질문형보다 가볍고 빠른 보조 필터(칩). 단일 선택.
// 라벨/설명 문구는 stocksCopy.preset[id]에서 로케일별로 가져온다(여기엔 동작 config만).
const PRESETS: Preset[] = [
  { id: "lowper", config: { perMax: 15, sortKey: "value", sortDir: "desc" } },
  { id: "momentum", config: { minComposite: 60, sortKey: "momentum", sortDir: "desc" } },
  { id: "lowpbr", config: { pbrMax: 1.0, sortKey: "value", sortDir: "desc" } },
  { id: "value-momentum", config: { minComposite: 70, sortKey: "compositeScore", sortDir: "desc" } },
  { id: "balanced", config: { minComposite: 80, sortKey: "compositeScore", sortDir: "desc" } },
  { id: "roe", config: { roeMin: 15, sortKey: "roe", sortDir: "desc" } },
  { id: "dividend", config: { divYieldMin: 1, sortKey: "dividendYield", sortDir: "desc" } },
  { id: "bigcap", config: { capBucket: "large", sortKey: "marketCap", sortDir: "desc" } },
  { id: "smallcap", config: { capBucket: "small", sortKey: "value", sortDir: "desc" } },
  { id: "surge", config: { sortKey: "r3m", sortDir: "desc" } },
  { id: "active", config: { sortKey: "flow", sortDir: "desc" } },
];

// 질문형 프리셋 — 자연어 질문 그대로 클릭. /stocks의 핵심 시작점.
// 라벨/설명/고지 문구는 stocksCopy.qPreset[id]에서 로케일별로 가져온다.
const QUESTION_PRESETS: QuestionPreset[] = [
  { id: "q-cheap-active", Icon: Search, config: { valueMin: 70, excludeLoss: true, sortKey: "value", sortDir: "desc" } },
  { id: "q-active-interest", Icon: Activity, config: { flowMin: 70, sortKey: "flow", sortDir: "desc" } },
  { id: "q-strong-trend", Icon: TrendingUp, config: { momentumMin: 75, sortKey: "momentum", sortDir: "desc" } },
  { id: "q-dividend-stable", Icon: ShieldCheck, config: { divYieldMin: 1, valueMin: 50, volMin: 55, excludeLoss: true, sortKey: "vol", sortDir: "desc" } },
  { id: "q-small-value", Icon: Sprout, config: { capBucket: "small", valueMin: 50, excludeLoss: true, sortKey: "value", sortDir: "desc" } },
];

// ── 순수 필터 로직: 상태(state)와 분리해 '예상 결과 수' 계산에 재사용 ──
interface FilterConfig {
  query: string;
  market: MarketFilter;
  capBucket: CapBucket;
  minComposite: number;
  perMin: number;
  perMax: number;
  pbrMin: number;
  pbrMax: number;
  roeMin: number;
  divYieldMin: number;
  momentumMin: number;
  flowMin: number;
  valueMin: number;
  volMin: number;
  excludeLoss: boolean;
  themes: string[];
  sector: string;
}

// 기본(비제약) 설정 — 기본 /stocks 화면과 동일(PER 200·PBR 30 상한만 적용).
const NEUTRAL: FilterConfig = {
  query: "", market: "all", capBucket: "all", minComposite: 0,
  perMin: 0, perMax: 200, pbrMin: 0, pbrMax: 30, roeMin: 0, divYieldMin: 0,
  momentumMin: 0, flowMin: 0, valueMin: 0, volMin: 0, excludeLoss: false, themes: [], sector: "",
};

function presetToConfig(p: PresetConfig): FilterConfig {
  return {
    query: "",
    market: p.market ?? "all",
    capBucket: p.capBucket ?? "all",
    minComposite: p.minComposite ?? 0,
    perMin: p.perMin ?? 0,
    perMax: p.perMax ?? 200,
    pbrMin: p.pbrMin ?? 0,
    pbrMax: p.pbrMax ?? 30,
    roeMin: p.roeMin ?? 0,
    divYieldMin: p.divYieldMin ?? 0,
    momentumMin: p.momentumMin ?? 0,
    flowMin: p.flowMin ?? 0,
    valueMin: p.valueMin ?? 0,
    volMin: p.volMin ?? 0,
    excludeLoss: p.excludeLoss ?? false,
    themes: [],
    sector: "",
  };
}

// 단일 종목이 조건을 충족하는지 — 기존 filtered useMemo와 동일 의미(새 min은 0이면 비제약).
function matchesConfig(s: Stock, c: FilterConfig): boolean {
  if (c.query) {
    const q = c.query.toLowerCase();
    if (!s.name.toLowerCase().includes(q) && !s.ticker.includes(q)) return false;
  }
  if (c.market !== "all" && s.market !== c.market) return false;
  if (!inCapBucket(s.marketCap, c.capBucket)) return false;
  if ((s.compositeScore || 0) < c.minComposite) return false;
  if (s.per > 0 && (s.per < c.perMin || s.per > c.perMax)) return false;
  if (s.pbr > 0 && (s.pbr < c.pbrMin || s.pbr > c.pbrMax)) return false;
  if (c.roeMin > 0 && s.roe < c.roeMin) return false;
  if (c.divYieldMin > 0 && s.dividendYield < c.divYieldMin) return false;
  if (c.momentumMin > 0 && s.momentum < c.momentumMin) return false;
  if (c.flowMin > 0 && s.flow < c.flowMin) return false;
  if (c.valueMin > 0 && s.value < c.valueMin) return false;
  if (c.volMin > 0 && s.vol < c.volMin) return false;
  if (c.excludeLoss && !(s.eps > 0)) return false;
  if (c.themes.length > 0 && !s.themes.some((t) => c.themes.includes(t))) return false;
  if (c.sector && s.sector !== c.sector) return false;
  return true;
}

function defaultQualityReasonKeys(s: Stock): Array<"per" | "pbr"> {
  const reasons: Array<"per" | "pbr"> = [];
  if (s.per > DEFAULT_PER_MAX) reasons.push("per");
  if (s.pbr > DEFAULT_PBR_MAX) reasons.push("pbr");
  return reasons;
}

function formatMetricNumber(value: number, locale: Locale, maximumFractionDigits: number): string {
  return value.toLocaleString(locale === "ko" ? "ko-KR" : "en-US", { maximumFractionDigits });
}

type StocksCopyT = (typeof stocksCopy)[Locale];

// 프리셋 config에서 실제 적용되는 조건 배지를 도출(표시 문구가 진짜 동작과 일치).
// 라벨은 로케일 copy(t)에서 가져온다.
function badgesFromConfig(c: PresetConfig, t: StocksCopyT): string[] {
  const b: string[] = [];
  if (c.minComposite) b.push(t.badge.composite(c.minComposite));
  if (c.momentumMin) b.push(t.badge.momentum(c.momentumMin));
  if (c.flowMin) b.push(t.badge.flow(c.flowMin));
  if (c.valueMin) b.push(t.badge.value(c.valueMin));
  if (c.volMin) b.push(t.badge.vol(c.volMin));
  if (c.perMax != null && c.perMax < 200) b.push(t.badge.perMax(c.perMax));
  if (c.pbrMax != null && c.pbrMax < 30) b.push(t.badge.pbrMax(c.pbrMax));
  if (c.roeMin) b.push(t.badge.roe(c.roeMin));
  if (c.divYieldMin) b.push(t.badge.div(c.divYieldMin));
  if (c.capBucket === "large") b.push(t.badge.large);
  if (c.capBucket === "mid") b.push(t.badge.mid);
  if (c.capBucket === "small") b.push(t.badge.small);
  if (c.excludeLoss) b.push(t.badge.excludeLoss);
  const sb = t.sortBadge[c.sortKey as keyof typeof t.sortBadge];
  if (sb) b.push(sb);
  return b;
}

export function StocksExplorer({ stocks, allThemes, initialThemes, initialSector, initialQuery, totalCount, asOf, metricsVersion, dataStale, laggedTickers = [] }: Props) {
  const laggedSet = useMemo(() => new Set(laggedTickers), [laggedTickers]);
  const { locale } = useLanguage();
  const t = stocksCopy[locale];
  const total = totalCount ?? stocks.length;
  const [query, setQuery] = useState(initialQuery ?? "");
  const [sortKey, setSortKey] = useState<SortKey>("compositeScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [minComposite, setMinComposite] = useState(0);
  const [perMin, setPerMin] = useState(0);
  const [perMax, setPerMax] = useState(200);
  const [pbrMin, setPbrMin] = useState(0);
  const [pbrMax, setPbrMax] = useState(30);
  const [roeMin, setRoeMin] = useState(0);
  const [divYieldMin, setDivYieldMin] = useState(0);
  const [momentumMin, setMomentumMin] = useState(0);
  const [flowMin, setFlowMin] = useState(0);
  const [valueMin, setValueMin] = useState(0);
  const [volMin, setVolMin] = useState(0);
  const [capBucket, setCapBucket] = useState<CapBucket>("all");
  const [market, setMarket] = useState<MarketFilter>("all");
  const [excludeLoss, setExcludeLoss] = useState(false);
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(() => new Set(initialThemes ?? []));
  const [selectedSector, setSelectedSector] = useState(initialSector ?? "");
  const [themeQuery, setThemeQuery] = useState("");
  const [showAllThemes, setShowAllThemes] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showQuickPresets, setShowQuickPresets] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [alertFormOpen, setAlertFormOpen] = useState(false);
  const [alertName, setAlertName] = useState("");
  const [alertStatus, setAlertStatus] = useState<"login" | "ok" | "error" | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentViews, setRecentViews] = useState<RecentView[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  useEffect(() => {
    let alive = true;
    const load = () => { listSavedSearches().then((r) => { if (alive) setSavedSearches(r); }); };
    load();
    window.addEventListener("saved-searches-changed", load);
    return () => { alive = false; window.removeEventListener("saved-searches-changed", load); };
  }, []);

  useEffect(() => {
    setRecentSearches(readRecentSearches());
  }, []);

  useEffect(() => {
    const load = () => setRecentViews(getRecentViews());
    load();
    window.addEventListener("recent-views-changed", load);
    return () => window.removeEventListener("recent-views-changed", load);
  }, []);

  // 보기 방식(카드형/표형)을 localStorage에 보존 — 새로고침해도 유지. 기본은 카드형.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("stocks-view-mode");
      if (saved === "card" || saved === "table") setViewMode(saved);
    } catch { /* localStorage 비가용 시 기본 카드형 */ }
  }, []);
  function changeViewMode(m: ViewMode) {
    setViewMode(m);
    try { window.localStorage.setItem("stocks-view-mode", m); } catch { /* no-op */ }
  }

  function buildCurrentConfig(): SavedSearchConfig {
    return { query, sortKey, sortDir, minComposite, perMin, perMax, pbrMin, pbrMax, roeMin, divYieldMin, momentumMin, flowMin, valueMin, volMin, capBucket, market, excludeLoss, themes: [...selectedThemes], sector: selectedSector || undefined };
  }
  function applySavedConfig(c: SavedSearchConfig) {
    setActivePreset(null);
    setQuery(c.query ?? "");
    setSortKey((c.sortKey as SortKey) ?? "compositeScore");
    setSortDir((c.sortDir as SortDir) ?? "desc");
    setMinComposite(c.minComposite ?? 0);
    setPerMin(c.perMin ?? 0);
    setPerMax(c.perMax ?? 200);
    setPbrMin(c.pbrMin ?? 0);
    setPbrMax(c.pbrMax ?? 30);
    setRoeMin(c.roeMin ?? 0);
    setDivYieldMin(c.divYieldMin ?? 0);
    setMomentumMin(c.momentumMin ?? 0);
    setFlowMin(c.flowMin ?? 0);
    setValueMin(c.valueMin ?? 0);
    setVolMin(c.volMin ?? 0);
    setCapBucket((c.capBucket as CapBucket) ?? "all");
    setMarket((c.market as MarketFilter) ?? "all");
    setExcludeLoss(c.excludeLoss ?? false);
    setSelectedThemes(new Set(c.themes ?? []));
    setSelectedSector(c.sector ?? "");
  }
  useEffect(() => {
    const queued = consumeQueuedSavedSearch();
    if (!queued) return;
    applySavedConfig(queued.config);
  }, []);
  function rememberRecentSearch(raw: string) {
    const value = raw.trim();
    if (value.length < 2) return;
    const next = [value, ...recentSearches.filter((q) => q.toLowerCase() !== value.toLowerCase())].slice(0, 6);
    setRecentSearches(next);
    writeRecentSearches(next);
  }
  function suggestedSavedSearchName(): string {
    const term = query.trim();
    if (term) return term.length > 24 ? term.slice(0, 24) : term;
    if (selectedSector) return selectedSector;
    const firstTheme = [...selectedThemes][0];
    if (firstTheme) return firstTheme;
    if (minComposite > 0) return `${t.metric.composite} ${minComposite}+`;
    return t.defaultSavedName;
  }
  function suggestedAlertName(): string {
    const base = suggestedSavedSearchName();
    return base === t.defaultSavedName ? t.defaultAlertName : `${base} ${t.alertNameSuffix}`;
  }
  function openSaveSearchForm() {
    setSaveSearchName((prev) => prev.trim() || suggestedSavedSearchName());
    setSaveSearchOpen(true);
    window.setTimeout(() => document.getElementById("stocks-save-search-name")?.focus(), 0);
  }
  function openAlertForm() {
    setAlertName((prev) => prev.trim() || suggestedAlertName());
    setAlertStatus(null);
    setAlertFormOpen(true);
    window.setTimeout(() => document.getElementById("stocks-alert-name")?.focus(), 0);
  }
  async function submitSaveSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const name = saveSearchName.trim();
    if (!name) return;
    const ok = await addSavedSearch(name, buildCurrentConfig());
    if (ok) {
      setSaveSearchOpen(false);
      setSaveSearchName("");
      listSavedSearches().then(setSavedSearches);
    }
  }
  async function handleRemoveSaved(id: string) {
    const ok = await removeSavedSearch(id);
    if (ok) setSavedSearches((prev) => prev.filter((sv) => sv.id !== id));
  }
  async function submitConditionAlert(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const name = alertName.trim();
    if (!name) return;
    const r = await addConditionAlert(name, buildCurrentConfig());
    if (r === "login") {
      setAlertStatus("login");
    } else if (r === "ok") {
      setAlertStatus("ok");
      setAlertFormOpen(false);
      setAlertName("");
    } else {
      setAlertStatus("error");
    }
  }

  function applyPreset(p: Preset) {
    setActivePreset(p.id);
    setPerMin(p.config.perMin ?? 0);
    setPerMax(p.config.perMax ?? 200);
    setPbrMin(p.config.pbrMin ?? 0);
    setPbrMax(p.config.pbrMax ?? 30);
    setMinComposite(p.config.minComposite ?? 0);
    setRoeMin(p.config.roeMin ?? 0);
    setDivYieldMin(p.config.divYieldMin ?? 0);
    setMomentumMin(p.config.momentumMin ?? 0);
    setFlowMin(p.config.flowMin ?? 0);
    setValueMin(p.config.valueMin ?? 0);
    setVolMin(p.config.volMin ?? 0);
    setCapBucket(p.config.capBucket ?? "all");
    setMarket(p.config.market ?? "all");
    setExcludeLoss(p.config.excludeLoss ?? false);
    setSortKey(p.config.sortKey);
    setSortDir(p.config.sortDir);
    setQuery("");
    setSelectedThemes(new Set());
    setSelectedSector("");
    setThemeQuery("");
    setShowAllThemes(false);
  }

  // 질문 카드/칩 클릭: 이미 선택된 것을 다시 누르면 전체 초기화(해제).
  function togglePreset(p: Preset) {
    if (activePreset === p.id) resetFilters();
    else applyPreset(p);
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

  const sectorOptions = useMemo(() => {
    return Array.from(new Set(stocks.map((s) => s.sector).filter((s): s is string => !!s))).sort((a, b) => a.localeCompare(b, "ko"));
  }, [stocks]);

  const filtered = useMemo(() => {
    const c: FilterConfig = { query, market, capBucket, minComposite, perMin, perMax, pbrMin, pbrMax, roeMin, divYieldMin, momentumMin, flowMin, valueMin, volMin, excludeLoss, themes: [...selectedThemes], sector: selectedSector };
    return stocks.filter((s) => matchesConfig(s, c));
  }, [stocks, query, market, capBucket, minComposite, perMin, perMax, pbrMin, pbrMax, roeMin, divYieldMin, momentumMin, flowMin, valueMin, volMin, excludeLoss, selectedThemes, selectedSector]);

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
      else if (sortKey === "r3m") { av = a.r3m ?? -Infinity; bv = b.r3m ?? -Infinity; }
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [filtered, sortKey, sortDir]);

  const recentViewLinks = useMemo(() => recentViews.slice(0, 4), [recentViews]);

  const popularEntryStocks = useMemo(() => {
    return [...stocks]
      .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0))
      .slice(0, 4);
  }, [stocks]);

  const selectedThemeLabels = useMemo(() => Array.from(selectedThemes), [selectedThemes]);
  const selectedThemeSummary = useMemo(() => {
    if (selectedThemeLabels.length === 0) return locale === "ko" ? "선택한 테마" : "Selected theme";
    if (selectedThemeLabels.length <= 2) return selectedThemeLabels.join(locale === "ko" ? "·" : ", ");
    const rest = selectedThemeLabels.length - 2;
    return locale === "ko"
      ? `${selectedThemeLabels.slice(0, 2).join("·")} 외 ${rest}개`
      : `${selectedThemeLabels.slice(0, 2).join(", ")} +${rest}`;
  }, [locale, selectedThemeLabels]);
  const themeScopedStocks = useMemo(() => {
    if (selectedThemeLabels.length === 0) return [];
    return stocks.filter((s) => s.themes.some((theme) => selectedThemeLabels.includes(theme)));
  }, [stocks, selectedThemeLabels]);
  const qualityExcludedThemeStocks = useMemo(() => {
    return themeScopedStocks.filter((s) => defaultQualityReasonKeys(s).length > 0);
  }, [themeScopedStocks]);

  // 각 프리셋의 '예상 결과 수' — 다른 활성 필터와 무관하게 전체 풀에 대해 독립 계산
  // (count-vs-full-pool 의미: 카드 숫자는 "그 프리셋만 적용했을 때 몇 개"를 뜻함).
  const presetCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of [...QUESTION_PRESETS, ...PRESETS]) {
      const c = presetToConfig(p.config);
      let n = 0;
      for (const s of stocks) if (matchesConfig(s, c)) n += 1;
      m[p.id] = n;
    }
    return m;
  }, [stocks]);

  const themeFilterCount = selectedThemes.size;
  const sectorFilterCount = selectedSector ? 1 : 0;
  const nonThemeFilterCount =
    (minComposite > 0 ? 1 : 0) +
    (perMin > 0 || perMax < 200 ? 1 : 0) +
    (pbrMin > 0 || pbrMax < 30 ? 1 : 0) +
    (roeMin > 0 ? 1 : 0) +
    (divYieldMin > 0 ? 1 : 0) +
    (momentumMin > 0 ? 1 : 0) +
    (flowMin > 0 ? 1 : 0) +
    (valueMin > 0 ? 1 : 0) +
    (volMin > 0 ? 1 : 0) +
    (capBucket !== "all" ? 1 : 0) +
    (market !== "all" ? 1 : 0) +
    (excludeLoss ? 1 : 0);
  const activeFilterCount = nonThemeFilterCount + themeFilterCount + sectorFilterCount;
  const hasAnyCondition = activeFilterCount > 0 || !!query || !!activePreset;

  // 기본 품질 필터(PER≤200·PBR≤30) 적용 여부 — 해제하면 전체 138개가 보인다.
  const qualityFilterOn = perMax <= 200 && pbrMax <= 30;
  // 프리셋·검색·상세 필터가 전혀 없는 '순수 기본 탐색' 상태(기본 123개 또는 전체 138개 보기).
  // 이 상태에서만 헤더에 기본 품질 헤드라인과 전체/기본 보기 토글을 노출한다.
  const pureBrowse = nonThemeFilterCount === 0 && themeFilterCount === 0 && sectorFilterCount === 0 && !query && !activePreset;
  const themeOnlyZero =
    sorted.length === 0 &&
    themeFilterCount > 0 &&
    sectorFilterCount === 0 &&
    nonThemeFilterCount === 0 &&
    !query &&
    !activePreset;
  const showThemeQualityEmpty =
    themeOnlyZero &&
    qualityFilterOn &&
    themeScopedStocks.length > 0 &&
    qualityExcludedThemeStocks.length === themeScopedStocks.length;
  const showThemeNoMatchEmpty = themeOnlyZero && themeScopedStocks.length === 0;

  // 기본 품질 필터 해제 → 전체 138개 보기(PER/PBR 상한 제거).
  function viewAllStocks() {
    setActivePreset(null);
    setPerMax(NO_MAX);
    setPbrMax(NO_MAX);
  }
  // 전체 보기 → 기본 품질 필터(PER≤200·PBR≤30)로 복귀.
  function backToDefaultView() {
    setActivePreset(null);
    setPerMax(200);
    setPbrMax(30);
  }

  // 현재 정렬 상태를 사람이 읽는 라벨로(현재 조건 블록 '정렬' 행). 매핑에 없으면 종합점수 기본값.
  function sortOptionLabel(): string {
    const map: Record<string, string> = {
      "compositeScore-desc": t.sortOpt.compositeDesc,
      "momentum-desc": t.sortOpt.momentumDesc,
      "value-desc": t.sortOpt.valueDesc,
      "vol-desc": t.sortOpt.volDesc,
      "flow-desc": t.sortOpt.flowDesc,
      "roe-desc": t.sortOpt.roeDesc,
      "per-asc": t.sortOpt.perAsc,
      "pbr-asc": t.sortOpt.pbrAsc,
      "dividendYield-desc": t.sortOpt.divDesc,
      "marketCap-desc": t.sortOpt.capDesc,
      "r3m-desc": t.sortOpt.r3mDesc,
    };
    return map[sortKey + "-" + sortDir] ?? t.sortOpt.compositeDesc;
  }

  function resetFilters() {
    setMinComposite(0);
    setPerMin(0);
    setPerMax(200);
    setPbrMin(0);
    setPbrMax(30);
    setRoeMin(0);
    setDivYieldMin(0);
    setMomentumMin(0);
    setFlowMin(0);
    setValueMin(0);
    setVolMin(0);
    setCapBucket("all");
    setMarket("all");
    setExcludeLoss(false);
    setQuery("");
    setSelectedThemes(new Set());
    setSelectedSector("");
    setThemeQuery("");
    setShowAllThemes(false);
    setActivePreset(null);
    setSortKey("compositeScore");
    setSortDir("desc");
  }

  function openDefaultStocks() {
    resetFilters();
  }

  // 현재 조건 요약 바의 초기화 — 실수 방지용 확인(설계서 §16).
  function handleResetWithConfirm() {
    if (!hasAnyCondition) return;
    if (typeof window !== "undefined" && !window.confirm(t.confirmReset)) return;
    resetFilters();
  }

  function toggleTheme(t: string) {
    setActivePreset(null);
    const next = new Set(selectedThemes);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    setSelectedThemes(next);
  }

  function qualityReasonLabels(s: Stock): string[] {
    return defaultQualityReasonKeys(s).map((reason) => {
      if (reason === "per") return t.themeQualityPerReason(formatMetricNumber(s.per, locale, 1));
      return t.themeQualityPbrReason(formatMetricNumber(s.pbr, locale, 2));
    });
  }

  // 현재 조건을 한 줄 자연어로 설명(설계서 §10 상태별).
  function describeConditions(): string {
    const qp = QUESTION_PRESETS.find((p) => p.id === activePreset);
    if (qp) { const c = t.qPreset[qp.id]; return t.describeQuestion(c.label, c.explain); }
    const cp = PRESETS.find((p) => p.id === activePreset);
    if (cp) { const c = t.preset[cp.id]; return t.describeQuick(c.label, c.desc); }
    if (sectorFilterCount > 0 && themeFilterCount === 0 && nonThemeFilterCount === 0 && !query) {
      return t.describeSector(selectedSector);
    }
    if (themeFilterCount > 0 && sectorFilterCount === 0 && nonThemeFilterCount === 0 && !query) {
      return t.describeTheme([...selectedThemes].join(", "));
    }
    if (nonThemeFilterCount > 0 || themeFilterCount > 0 || sectorFilterCount > 0 || query) {
      return t.describeManual;
    }
    return t.describeAll(sorted.length, total);
  }

  // 결과 0건일 때 가장 강한(=binding) 단일 조건을 골라 그 조건만 완화할 수 있게 한다(설계서 §20.5).
  // strength는 표시·랭킹용 휴리스틱일 뿐 점수 계산과 무관하다.
  function strongestConstraint(): { label: string; relax: () => void } | null {
    const cons: { label: string; strength: number; relax: () => void }[] = [];
    if (minComposite > 0) cons.push({ label: t.cons.composite(minComposite), strength: minComposite, relax: () => clearPreset(() => setMinComposite(0)) });
    if (momentumMin > 0) cons.push({ label: t.cons.momentum(momentumMin), strength: momentumMin, relax: () => clearPreset(() => setMomentumMin(0)) });
    if (flowMin > 0) cons.push({ label: t.cons.flow(flowMin), strength: flowMin, relax: () => clearPreset(() => setFlowMin(0)) });
    if (valueMin > 0) cons.push({ label: t.cons.value(valueMin), strength: valueMin, relax: () => clearPreset(() => setValueMin(0)) });
    if (volMin > 0) cons.push({ label: t.cons.vol(volMin), strength: volMin, relax: () => clearPreset(() => setVolMin(0)) });
    if (perMax < 200) cons.push({ label: t.cons.perMax(perMax), strength: 100 - Math.min(100, perMax), relax: () => clearPreset(() => setPerMax(200)) });
    if (pbrMax < 30) cons.push({ label: t.cons.pbrMax(pbrMax.toFixed(1)), strength: 100 - Math.min(100, pbrMax * 3), relax: () => clearPreset(() => setPbrMax(30)) });
    if (roeMin > 0) cons.push({ label: t.cons.roe(roeMin), strength: roeMin * 3, relax: () => clearPreset(() => setRoeMin(0)) });
    if (divYieldMin > 0) cons.push({ label: t.cons.div(divYieldMin.toFixed(1)), strength: divYieldMin * 15, relax: () => clearPreset(() => setDivYieldMin(0)) });
    if (selectedSector) cons.push({ label: t.cons.sector(selectedSector), strength: 60, relax: () => clearPreset(() => setSelectedSector("")) });
    if (selectedThemes.size > 0) cons.push({ label: t.cons.themes(selectedThemes.size), strength: 55, relax: () => clearPreset(() => setSelectedThemes(new Set())) });
    if (capBucket !== "all") cons.push({ label: t.cons.cap, strength: 45, relax: () => clearPreset(() => setCapBucket("all")) });
    if (excludeLoss) cons.push({ label: t.cons.excludeLoss, strength: 30, relax: () => clearPreset(() => setExcludeLoss(false)) });
    if (market !== "all") cons.push({ label: t.cons.market, strength: 25, relax: () => clearPreset(() => setMarket("all")) });
    if (cons.length === 0) return null;
    cons.sort((a, b) => b.strength - a.strength);
    return { label: cons[0].label, relax: cons[0].relax };
  }

  // 카드형 결과 목록 — 모바일/데스크톱 공용. 신호 칩은 표형과 동일한 deriveSignals 사용.
  function renderCards() {
    return sorted.slice(0, 100).map((s) => {
      const { strengths, warnings } = deriveSignals(s, t.signal);
      const lagged = laggedSet.has(s.ticker);
      return (
        <Link key={s.ticker} prefetch={false} href={"/stock/" + s.ticker} className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{s.name}</span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0 font-mono">{s.ticker}</span>
                {lagged ? <DataLagBadge label={t.dataLag.badge} title={t.dataLag.tooltip} /> : null}
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">{s.market}</span>
                {s.sector ? <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">· {s.sector}</span> : null}
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{fmtWon(s.currentPrice)}</span>
                <span className={"text-[11px] tabular-nums " + (s.changePct >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400")}>
                  {s.changePct >= 0 ? "▲" : "▼"} {Math.abs(s.changePct).toFixed(2)}%
                </span>
                {s.dividendYield > 0 ? <span className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">{t.chip.div}{s.dividendYield.toFixed(1)}%</span> : null}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-2xl font-bold text-blue-700 dark:text-blue-400 tabular-nums leading-none">{s.compositeScore || 0}</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">/100</span>
              </div>
              <div className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">{t.table.composite}</div>
            </div>
          </div>
          {/* 카드형(초보자용): 원점수·재무 나열 대신 '왜 후보인지(강점)·먼저 확인할 점(주의)'를 전면에. 세부 지표·재무 스캔은 표형이 담당. */}
          {strengths.length > 0 || warnings.length > 0 ? (
            <div className="flex flex-col gap-1.5 mt-2.5">
              {strengths.length > 0 ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 shrink-0 md:min-w-[2.75rem]"><Check aria-hidden size={11} strokeWidth={2.5} />{t.card.strength}</span>
                  {strengths.slice(0, 3).map((label) => (
                    <span key={label} className="text-[10px] px-1.5 py-0.5 rounded border font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900">{label}</span>
                  ))}
                </div>
              ) : null}
              {warnings.length > 0 ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 shrink-0 md:min-w-[2.75rem]"><AlertTriangle aria-hidden size={11} strokeWidth={2.5} />{t.card.warning}</span>
                  {warnings.slice(0, 3).map((label) => (
                    <span key={label} className="text-[10px] px-1.5 py-0.5 rounded border font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900">{label}</span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-2.5 text-[11px] text-zinc-400 dark:text-zinc-500">{t.card.neutral}</div>
          )}
          {s.themes.length > 0 ? (
            <div className="flex gap-1 flex-wrap mt-2">
              {s.themes.slice(0, 3).map((t) => (<span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{t}</span>))}
              {s.themes.length > 3 ? (<span className="text-[10px] text-zinc-400 dark:text-zinc-500">+{s.themes.length - 3}</span>) : null}
            </div>
          ) : null}
        </Link>
      );
    });
  }

  const CAP_OPTIONS: { id: CapBucket; label: string }[] = [
    { id: "all", label: t.capOpt.all },
    { id: "large", label: t.capOpt.large },
    { id: "mid", label: t.capOpt.mid },
    { id: "small", label: t.capOpt.small },
  ];
  const MARKET_OPTIONS: { id: MarketFilter; label: string }[] = [
    { id: "all", label: t.marketOpt.all },
    { id: "KOSPI", label: t.marketOpt.KOSPI },
    { id: "KOSDAQ", label: t.marketOpt.KOSDAQ },
  ];

  // 현재 적용된 필터를 사람이 읽을 수 있는 칩으로 — 각 칩의 ×는 해당 필터만 해제
  function clearPreset(fn: () => void) {
    setActivePreset(null);
    fn();
  }
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (market !== "all") activeChips.push({ key: "market", label: t.chip.market + (MARKET_OPTIONS.find((o) => o.id === market)?.label ?? market), onRemove: () => clearPreset(() => setMarket("all")) });
  if (capBucket !== "all") activeChips.push({ key: "cap", label: t.chip.cap + (CAP_OPTIONS.find((o) => o.id === capBucket)?.label ?? capBucket), onRemove: () => clearPreset(() => setCapBucket("all")) });
  if (minComposite > 0) activeChips.push({ key: "composite", label: t.chip.composite + minComposite + "+", onRemove: () => clearPreset(() => setMinComposite(0)) });
  if (momentumMin > 0) activeChips.push({ key: "mom", label: t.chip.mom + momentumMin + "+", onRemove: () => clearPreset(() => setMomentumMin(0)) });
  if (flowMin > 0) activeChips.push({ key: "flow", label: t.chip.flow + flowMin + "+", onRemove: () => clearPreset(() => setFlowMin(0)) });
  if (valueMin > 0) activeChips.push({ key: "val", label: t.chip.val + valueMin + "+", onRemove: () => clearPreset(() => setValueMin(0)) });
  if (volMin > 0) activeChips.push({ key: "vol", label: t.chip.vol + volMin + "+", onRemove: () => clearPreset(() => setVolMin(0)) });
  if (roeMin > 0) activeChips.push({ key: "roe", label: t.chip.roe + roeMin + "%+", onRemove: () => clearPreset(() => setRoeMin(0)) });
  if (divYieldMin > 0) activeChips.push({ key: "div", label: t.chip.div + divYieldMin.toFixed(1) + "%+", onRemove: () => clearPreset(() => setDivYieldMin(0)) });
  if (perMin > 0 || perMax < 200) activeChips.push({ key: "per", label: "PER " + perMin + "~" + perMax, onRemove: () => clearPreset(() => { setPerMin(0); setPerMax(200); }) });
  if (pbrMin > 0 || pbrMax < 30) activeChips.push({ key: "pbr", label: "PBR " + pbrMin.toFixed(1) + "~" + pbrMax.toFixed(1), onRemove: () => clearPreset(() => { setPbrMin(0); setPbrMax(30); }) });
  if (excludeLoss) activeChips.push({ key: "loss", label: t.chip.loss, onRemove: () => clearPreset(() => setExcludeLoss(false)) });
  if (selectedSector) activeChips.push({ key: "sector", label: t.chip.sector + selectedSector, onRemove: () => clearPreset(() => setSelectedSector("")) });
  for (const th of selectedThemes) activeChips.push({ key: "theme-" + th, label: t.chip.theme + th, onRemove: () => toggleTheme(th) });

  function ScoreSlider({ label, value, set }: { label: string; value: number; set: (n: number) => void }) {
    return (
      <div>
        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
          {t.minLabel(label)}: <span className="tabular-nums">{value}</span>
        </label>
        <input type="range" min={0} max={100} step={5} value={value} onChange={(e) => { setActivePreset(null); set(Number(e.target.value)); }} className="w-full" />
      </div>
    );
  }

  function FilterPanel() {
    return (
      <div className="space-y-5">
        {/* 필터 조절 중 실시간 예상 결과 수 — 스크롤해도 상단 고정(데스크톱 사이드바·모바일 드로어 공용) */}
        <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-1 px-4 pt-3 pb-2 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
            {t.filterLiveCount(sorted.length, total).a}
            <span className="text-zinc-400 dark:text-zinc-500 font-normal">{t.filterLiveCount(sorted.length, total).b}</span>
          </span>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-2">{t.labelMarket}</label>
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
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-2">{t.labelMarketCap}</label>
          <div className="grid grid-cols-2 gap-1.5">
            {CAP_OPTIONS.map((o) => (
              <button key={o.id} type="button" onClick={() => { setActivePreset(null); setCapBucket(o.id); }}
                className={"text-xs px-2 py-1.5 rounded border transition " + (capBucket === o.id ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-blue-400")}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t.sectionMetrics}</div>
          <ScoreSlider label={t.metric.composite} value={minComposite} set={setMinComposite} />
          <ScoreSlider label={t.metric.momentum} value={momentumMin} set={setMomentumMin} />
          <ScoreSlider label={t.metric.flow} value={flowMin} set={setFlowMin} />
          <ScoreSlider label={t.metric.value} value={valueMin} set={setValueMin} />
          <ScoreSlider label={t.metric.vol} value={volMin} set={setVolMin} />
        </div>
        <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t.sectionFinance}</div>
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
              {t.minRoe}: <span className="tabular-nums">{roeMin}%</span>
            </label>
            <input type="range" min={0} max={30} step={1} value={roeMin} onChange={(e) => { setActivePreset(null); setRoeMin(Number(e.target.value)); }} className="w-full" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
              {t.minDivYield}: <span className="tabular-nums">{divYieldMin.toFixed(1)}%</span>
            </label>
            <input type="range" min={0} max={6} step={0.5} value={divYieldMin} onChange={(e) => { setActivePreset(null); setDivYieldMin(Number(e.target.value)); }} className="w-full" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-2">{t.perRange}: <span className="tabular-nums">{perMin} - {perMax === NO_MAX ? t.noMaxPlaceholder : perMax}</span></label>
            <div className="flex gap-2">
              <input type="number" value={perMin} onChange={(e) => { setActivePreset(null); setPerMin(Number(e.target.value)); }} className="w-1/2 px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded" min={0} />
              <input type="number" value={perMax === NO_MAX ? "" : perMax} placeholder={t.noMaxPlaceholder} onChange={(e) => { setActivePreset(null); setPerMax(Number(e.target.value)); }} className="w-1/2 px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded" min={0} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-2">{t.pbrRange}: <span className="tabular-nums">{pbrMin.toFixed(1)} - {pbrMax === NO_MAX ? t.noMaxPlaceholder : pbrMax.toFixed(1)}</span></label>
            <div className="flex gap-2">
              <input type="number" value={pbrMin} step={0.1} onChange={(e) => { setActivePreset(null); setPbrMin(Number(e.target.value)); }} className="w-1/2 px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded" min={0} />
              <input type="number" value={pbrMax === NO_MAX ? "" : pbrMax} step={0.1} placeholder={t.noMaxPlaceholder} onChange={(e) => { setActivePreset(null); setPbrMax(Number(e.target.value)); }} className="w-1/2 px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded" min={0} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={excludeLoss} onChange={(e) => { setActivePreset(null); setExcludeLoss(e.target.checked); }} className="rounded" />
            {t.excludeLossLabel} <span className="text-zinc-400 font-normal">{t.excludeLossHint}</span>
          </label>
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{t.sectorLabel}</label>
            {selectedSector ? (
              <button type="button" onClick={() => setSelectedSector("")} className="text-[10px] text-blue-700 hover:underline">{t.sectorClear}</button>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {sectorOptions.map((sector) => (
              <button
                key={sector}
                type="button"
                aria-pressed={selectedSector === sector}
                onClick={() => { setActivePreset(null); setSelectedSector(selectedSector === sector ? "" : sector); }}
                className={"min-h-[36px] rounded border px-2 py-1.5 text-left text-[11px] leading-snug transition " + (selectedSector === sector ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-200 bg-white text-zinc-700 hover:border-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300")}
              >
                {sector}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-zinc-400 dark:text-zinc-500">{t.sectorHint}</p>
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{t.themeLabel} <span className="text-zinc-400 tabular-nums">{t.themeSelected(selectedThemes.size)}</span></label>
            {selectedThemes.size > 0 ? (
              <button type="button" onClick={() => setSelectedThemes(new Set())} className="text-[10px] text-blue-700 hover:underline">{t.themeClear}</button>
            ) : null}
          </div>
          <input type="search" placeholder={t.themeSearchPlaceholder} value={themeQuery} onChange={(e) => setThemeQuery(e.target.value)} className={`w-full mb-2 px-2 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded ${INPUT_FOCUS}`} />
          {!themeQuery && !showAllThemes ? (<div className="text-[10px] text-zinc-500 mb-1.5">{t.popularThemes(popularThemes.length)}</div>) : null}
          <div className="max-h-44 overflow-y-auto space-y-0.5 border border-zinc-200 dark:border-zinc-700 rounded p-2 bg-white dark:bg-zinc-900">
            {visibleThemes.length === 0 ? (<div className="text-[11px] text-zinc-400 text-center py-3">{t.noTheme}</div>) : (
              visibleThemes.map((th) => (
                <label key={th} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 px-1 py-0.5 rounded">
                  <input type="checkbox" checked={selectedThemes.has(th)} onChange={() => toggleTheme(th)} className="rounded shrink-0" />
                  <span className="truncate">{th}</span>
                </label>
              ))
            )}
          </div>
          {!themeQuery && !showAllThemes && allThemes.length > popularThemes.length ? (
            <button type="button" onClick={() => setShowAllThemes(true)} className="mt-2 text-[11px] text-blue-700 hover:underline">{t.showAllThemes(allThemes.length)}</button>
          ) : null}
          {showAllThemes ? (
            <button type="button" onClick={() => setShowAllThemes(false)} className="mt-2 text-[11px] text-blue-700 hover:underline">{t.showPopularThemes}</button>
          ) : null}
        </div>
        <button type="button" onClick={resetFilters} className={`w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition ${FOCUS_RING}`}>{t.resetAllFilters}</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      {/* ── 페이지 헤더 ── */}
      <header className="space-y-2">
        <div className="flex items-baseline justify-between flex-wrap gap-x-3 gap-y-1.5">
          <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t.headerTitle}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            {pureBrowse && qualityFilterOn ? (
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-400 tabular-nums">{t.qualityHeadline(sorted.length, total).a}<span className="text-zinc-400 dark:text-zinc-500 font-normal">{t.qualityHeadline(sorted.length, total).b}</span></span>
            ) : (
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-400 tabular-nums">{t.matchCount(sorted.length, total).a}<span className="text-zinc-400 dark:text-zinc-500 font-normal">{t.matchCount(sorted.length, total).b}</span></span>
            )}
            {pureBrowse ? (
              <button
                type="button"
                onClick={qualityFilterOn ? viewAllStocks : backToDefaultView}
                className={`text-[11px] px-2.5 py-1 rounded-full border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition whitespace-nowrap ${FOCUS_RING}`}
              >
                {qualityFilterOn ? t.viewAllToggle(total) : t.backToDefaultToggle}
              </button>
            ) : null}
          </div>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.headerDesc(total)}</p>
        <section aria-label={t.searchIntent.title} className="border-l-2 border-blue-200 dark:border-blue-900 pl-3 py-1">
          <h2 className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">{t.searchIntent.title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{t.searchIntent.body}</p>
        </section>
        <div className="flex items-center gap-2 flex-wrap text-[11px] text-zinc-500 dark:text-zinc-400">
          {asOf ? <span className="tabular-nums">{asOf} {t.marketCloseSuffix}</span> : null}
          {metricsVersion ? <><span aria-hidden>·</span><span>{t.metricsPrefix} {metricsVersion}</span></> : null}
          <span aria-hidden>·</span>
          <DataStatusBadge tone={dataStale ? "delayed" : "normal"} label={dataStale ? t.dataStaleLabel : t.dataNormalLabel} />
          <span aria-hidden>·</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">{t.notAdvice}</span>
          <span aria-hidden>·</span>
          {/* 무JS·키보드·스크린리더가 긴 필터 UI를 건너뛰고 종목 목록으로 바로 이동(인페이지 앵커라 JS 없이도 동작) */}
          <a href="#stock-results" className={`inline-flex items-center px-1.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition ${FOCUS_RING}`}>{t.skipToList}</a>
        </div>
        {nonThemeFilterCount === 0 && themeFilterCount === 0 && sectorFilterCount === 0 && !query && sorted.length < stocks.length ? (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{t.baseScreenNote(stocks.length - sorted.length)}</p>
        ) : null}
        {showThemeQualityEmpty ? (
          <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-amber-900 dark:text-amber-200 break-words">{t.themeQualityEmptyTitle(selectedThemeSummary)}</div>
                <p className="mt-0.5 text-[11px] leading-snug text-amber-800 dark:text-amber-300">{t.themeQualityEmptyHint(qualityExcludedThemeStocks.length, themeScopedStocks.length)}</p>
              </div>
              <button type="button" onClick={viewAllStocks} className={`inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700 ${FOCUS_RING}`}>
                {t.themeQualityAction}
              </button>
            </div>
          </div>
        ) : showThemeNoMatchEmpty ? (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 break-words">{t.themeNoMatchTitle(selectedThemeSummary)}</div>
                <p className="mt-0.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">{t.themeNoMatchHint}</p>
              </div>
              <Link href="/stocks" onClick={openDefaultStocks} className={`inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700 ${FOCUS_RING}`}>
                {t.themeNoMatchAction}
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      {/* ── 검색 먼저(첫 화면 단순화: 검색창 → 질문형 프리셋 → 상세 필터 순) ── */}
      <div className="relative">
        <Search aria-hidden size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
        <input
          type="search"
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(e) => { setActivePreset(null); setQuery(e.target.value); }}
          onBlur={(e) => rememberRecentSearch(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === "Enter") rememberRecentSearch(e.currentTarget.value); }}
          suppressHydrationWarning
          className="w-full pl-10 pr-3 py-3 min-h-[44px] text-sm md:text-base border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
        />
      </div>

      <section aria-label={t.entry.label} className="-mt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 px-0.5">
          <Link
            href="/watchlist"
            className={`shrink-0 inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:border-blue-400 dark:hover:border-blue-600 transition ${FOCUS_RING}`}
          >
            {t.entry.watchlist}
          </Link>
          {recentSearches.slice(0, 3).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => { setActivePreset(null); setQuery(q); }}
              className={`shrink-0 inline-flex min-h-[36px] max-w-[12rem] items-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:border-blue-300 dark:hover:border-blue-700 transition ${FOCUS_RING}`}
            >
              <span className="truncate">{t.entry.recentSearchPrefix}{q}</span>
            </button>
          ))}
          {recentViewLinks.map((s) => (
            <Link
              key={"recent-" + s.ticker}
              href={"/stock/" + s.ticker}
              prefetch={false}
              className={`shrink-0 inline-flex min-h-[36px] max-w-[12rem] items-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:border-blue-300 dark:hover:border-blue-700 transition ${FOCUS_RING}`}
            >
              <span className="truncate">{t.entry.recentViewedPrefix}{s.name}</span>
            </Link>
          ))}
          {popularEntryStocks.map((s) => (
            <Link
              key={"popular-" + s.ticker}
              href={"/stock/" + s.ticker}
              prefetch={false}
              className={`shrink-0 inline-flex min-h-[36px] max-w-[12rem] items-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:border-blue-300 dark:hover:border-blue-700 transition ${FOCUS_RING}`}
            >
              <span className="truncate">{t.entry.popularPrefix}{s.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 질문형 프리셋 카드(핵심 시작점) ── */}
      <section>
        <h2 className="text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t.questionHeading}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 mb-3 leading-snug">{t.questionDesc}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {QUESTION_PRESETS.map((p) => {
            const selected = activePreset === p.id;
            const badges = badgesFromConfig(p.config, t);
            const qc = t.qPreset[p.id];
            const Icon = p.Icon;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={selected}
                onClick={() => togglePreset(p)}
                className={"text-left rounded-xl border p-3 transition min-h-[44px] " +
                  (selected
                    ? "border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-500/40 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm")}
              >
                <div className="flex items-start gap-2">
                  <span aria-hidden className={"mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full " + (selected ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300")}>
                    <Icon size={15} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{qc.label}</div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{qc.desc}</p>
                  </div>
                  {selected ? <Check aria-hidden size={16} strokeWidth={2.5} className="shrink-0 text-blue-600 dark:text-blue-400" /> : null}
                </div>
                {badges.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {badges.map((b) => (
                      <span key={b} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 tabular-nums">{b}</span>
                    ))}
                  </div>
                ) : null}
                {qc.caution ? (
                  <div className="flex items-start gap-1 text-[10px] text-amber-700 dark:text-amber-400 mt-1.5 leading-snug"><AlertTriangle aria-hidden size={11} strokeWidth={2.5} className="mt-px shrink-0" /><span>{qc.caution}</span></div>
                ) : null}
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 tabular-nums">{t.expectedResults(presetCounts[p.id] ?? 0).a}<strong className="text-zinc-700 dark:text-zinc-200">{t.expectedResults(presetCounts[p.id] ?? 0).b}</strong></div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 빠른 프리셋 칩(보조 필터) — 기본 접힘, 필요할 때만 펼치는 보조 도구 ── */}
      <section className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
        <button
          type="button"
          onClick={() => setShowQuickPresets((v) => !v)}
          aria-expanded={showQuickPresets}
          className="w-full flex items-center justify-between gap-2 text-left"
        >
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t.quickPresetsLabel} <span className="font-normal normal-case text-zinc-400 dark:text-zinc-500">{t.quickPresetsHint}</span></span>
          <span className="shrink-0 text-[10px] text-zinc-400 dark:text-zinc-500">{showQuickPresets ? t.collapse : t.expand}</span>
        </button>
        {showQuickPresets ? (
          <div className="flex gap-1.5 flex-wrap mt-2.5">
            {PRESETS.map((p) => {
              const selected = activePreset === p.id;
              const pc = t.preset[p.id];
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => togglePreset(p)}
                  title={t.quickTitle(pc.desc, presetCounts[p.id] ?? 0)}
                  className={"text-xs px-3 py-1.5 rounded-full border transition " +
                    (selected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-blue-400 hover:text-blue-700")}
                >
                  {pc.label}
                  {selected ? <Check aria-hidden size={12} strokeWidth={2.5} className="inline-block ml-1 align-middle" /> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      {/* ── 내 검색 조건(저장/알림) ── */}
      <section className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t.mySearchLabel}</span>
          <div className="flex gap-1.5">
            <button type="button" onClick={openSaveSearchForm} className="text-[11px] px-2.5 py-1.5 rounded-full border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition">{t.saveCurrent}</button>
            <button type="button" onClick={openAlertForm} className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 transition"><Bell aria-hidden size={12} strokeWidth={2} />{t.alertThis}</button>
          </div>
        </div>
        {saveSearchOpen ? (
          <form onSubmit={submitSaveSearch} className="mb-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="stocks-save-search-name"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              aria-label={t.saveNameAria}
              placeholder={t.saveNamePlaceholder}
              className={`min-h-[44px] flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 ${INPUT_FOCUS}`}
            />
            <div className="flex gap-1.5">
              <button type="submit" className={`min-h-[44px] flex-1 sm:flex-none px-3 rounded-md bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition ${FOCUS_RING}`}>{t.saveNameSubmit}</button>
              <button type="button" onClick={() => setSaveSearchOpen(false)} className={`min-h-[44px] flex-1 sm:flex-none px-3 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 transition ${FOCUS_RING}`}>{t.saveNameCancel}</button>
            </div>
          </form>
        ) : null}
        {alertFormOpen ? (
          <form onSubmit={submitConditionAlert} className="mb-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="stocks-alert-name"
              value={alertName}
              onChange={(e) => setAlertName(e.target.value)}
              aria-label={t.alertNameAria}
              placeholder={t.alertNamePlaceholder}
              className={`min-h-[44px] flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 ${INPUT_FOCUS}`}
            />
            <div className="flex gap-1.5">
              <button type="submit" className={`min-h-[44px] flex-1 sm:flex-none px-3 rounded-md bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition ${FOCUS_RING}`}>{t.alertNameSubmit}</button>
              <button type="button" onClick={() => { setAlertFormOpen(false); setAlertStatus(null); }} className={`min-h-[44px] flex-1 sm:flex-none px-3 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 transition ${FOCUS_RING}`}>{t.alertNameCancel}</button>
            </div>
          </form>
        ) : null}
        {alertStatus ? (
          <div
            role="status"
            className={
              "mb-2 rounded-md border px-3 py-2 text-xs leading-snug " +
              (alertStatus === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                : alertStatus === "login"
                  ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"
                  : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300")
            }
          >
            {alertStatus === "ok" ? t.alertCreated : alertStatus === "login" ? (
              <>
                {t.alertLoginRequired}{" "}
                <Link href="/login?next=/stocks" className="font-semibold underline underline-offset-2">{t.alertLoginCta}</Link>
              </>
            ) : t.alertFailed}
          </div>
        ) : null}
        {savedSearches.length === 0 ? (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{t.savedEmpty}</p>
        ) : (
          <div className="flex gap-1.5 flex-wrap">
            {savedSearches.map((sv) => (
              <span key={sv.id} className="inline-flex items-center gap-1 text-xs pl-3 pr-1 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                <button type="button" onClick={() => applySavedConfig(sv.config)} className="text-zinc-700 dark:text-zinc-300 hover:text-blue-700 dark:hover:text-blue-400">{sv.name}</button>
                <button type="button" onClick={() => handleRemoveSaved(sv.id)} aria-label={t.removeSaved} className="w-4 h-4 flex items-center justify-center rounded-full text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-700">×</button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ── 정렬 · 필터 열기(검색창은 첫 화면 상단으로 이동) ── */}
      <div className="flex gap-2 flex-wrap">
        <select aria-label={t.sortAria} value={sortKey + "-" + sortDir} onChange={(e) => { setActivePreset(null); const [k, d] = e.target.value.split("-"); setSortKey(k as SortKey); setSortDir(d as SortDir); }} className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900">
          <optgroup label={t.sortGroupScore}>
            <option value="compositeScore-desc">{t.sortOpt.compositeDesc}</option>
            <option value="momentum-desc">{t.sortOpt.momentumDesc}</option>
            <option value="value-desc">{t.sortOpt.valueDesc}</option>
            <option value="vol-desc">{t.sortOpt.volDesc}</option>
            <option value="flow-desc">{t.sortOpt.flowDesc}</option>
          </optgroup>
          <optgroup label={t.sortGroupFinance}>
            <option value="roe-desc">{t.sortOpt.roeDesc}</option>
            <option value="per-asc">{t.sortOpt.perAsc}</option>
            <option value="pbr-asc">{t.sortOpt.pbrAsc}</option>
            <option value="dividendYield-desc">{t.sortOpt.divDesc}</option>
            <option value="marketCap-desc">{t.sortOpt.capDesc}</option>
          </optgroup>
          <optgroup label={t.sortGroupMove}>
            <option value="r3m-desc">{t.sortOpt.r3mDesc}</option>
          </optgroup>
        </select>
        <button type="button" onClick={() => setDrawerOpen(true)} aria-label={t.openFilterAria} className="lg:hidden px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <span>{t.filterShort}</span>
          {activeFilterCount > 0 ? (
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-blue-600 text-white font-medium tabular-nums" aria-label={t.appliedFilterAria(activeFilterCount)}>{activeFilterCount}</span>
          ) : null}
        </button>
        <button type="button" onClick={() => setShowAdvanced((v) => !v)} aria-expanded={showAdvanced} className="hidden lg:inline-flex px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <span>{showAdvanced ? t.closeFilter : t.openFilter}</span>
          {activeFilterCount > 0 ? (
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-blue-600 text-white font-medium tabular-nums" aria-label={t.appliedFilterAria(activeFilterCount)}>{activeFilterCount}</span>
          ) : null}
        </button>
        {/* 보기 방식 전환(데스크톱 전용) — 모바일은 카드형 고정 */}
        <div role="group" aria-label={t.viewModeAria} className="hidden lg:inline-flex items-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
          {([
            { id: "card", label: t.viewCard, hint: t.viewCardHint },
            { id: "table", label: t.viewTable, hint: t.viewTableHint },
          ] as { id: ViewMode; label: string; hint: string }[]).map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={viewMode === o.id}
              title={o.hint}
              aria-label={o.label + " — " + o.hint}
              onClick={() => changeViewMode(o.id)}
              className={"px-3 py-2 text-sm transition " + (viewMode === o.id ? "bg-blue-600 text-white" : "text-zinc-600 dark:text-zinc-300 hover:text-blue-700 dark:hover:text-blue-400")}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 현재 적용 조건 요약 바(결과 바로 위, 항상 노출) ── */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t.currentCond}</span>
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">{t.matchCountShort(sorted.length, total).a}<span className="text-zinc-400 dark:text-zinc-500 font-normal">{t.matchCountShort(sorted.length, total).b}</span></span>
            </div>
            <div className="flex flex-col gap-1 text-[11px] mb-1.5">
              {/* (a) 기본 품질 필터 행 — 사용자 상세 필터와 명확히 분리 */}
              <div className="text-zinc-500 dark:text-zinc-400">{qualityFilterOn ? t.qualityRowOn : t.qualityRowOff}</div>
              {/* (b) 상세 필터 행 — 칩이 있으면 칩, 없으면 '없음' */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-zinc-500 dark:text-zinc-400 shrink-0">{t.detailRowLabel}:</span>
                {activeChips.length > 0 ? (
                  activeChips.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={c.onRemove}
                      aria-label={t.removeFilterAria(c.label)}
                      className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition tabular-nums"
                    >
                      <span className="truncate max-w-[160px]">{c.label}</span>
                      <span aria-hidden className="w-3.5 h-3.5 flex items-center justify-center rounded-full text-blue-500 dark:text-blue-400">×</span>
                    </button>
                  ))
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-500">{t.detailRowNone}</span>
                )}
              </div>
              {/* (c) 정렬 행 */}
              <div className="text-zinc-500 dark:text-zinc-400">{t.sortRowLabel}: <span className="text-zinc-600 dark:text-zinc-300">{sortOptionLabel()}</span></div>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug">{describeConditions()}</p>
          </div>
          <div className="flex gap-1.5 shrink-0 flex-wrap">
            <button type="button" onClick={openSaveSearchForm} className="text-[11px] px-2.5 py-1.5 rounded-md border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition whitespace-nowrap">{t.saveCond}</button>
            <button type="button" onClick={openAlertForm} className="text-[11px] px-2.5 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 transition whitespace-nowrap">{t.alertCondShort}</button>
            <button type="button" onClick={handleResetWithConfirm} disabled={!hasAnyCondition} className={"text-[11px] px-2.5 py-1.5 rounded-md border transition whitespace-nowrap " + (hasAnyCondition ? "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-rose-400 hover:text-rose-600" : "border-zinc-200 dark:border-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed")}>{t.reset}</button>
          </div>
        </div>
      </section>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-md px-3 py-2 text-[10px] text-blue-800 dark:text-blue-300 flex items-center justify-between md:hidden">
        <span><strong>{t.legend.momentumFull}</strong> · <strong>{t.legend.flowFull}</strong> · <strong>{t.legend.valueFull}</strong> · <strong>{t.legend.volFull}</strong></span>
        <Link href="/guide/metrics" className="text-blue-700 dark:text-blue-400 underline shrink-0 ml-2">{t.legendMore}</Link>
      </div>

      <div className={"grid gap-6 " + (showAdvanced ? "lg:grid-cols-[280px_1fr]" : "lg:grid-cols-1")}>
        {showAdvanced ? (
          <aside className="hidden lg:block bg-zinc-50/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 h-fit sticky top-24">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{t.filterDetailTitle}</h3>
            <FilterPanel />
          </aside>
        ) : null}

        <section id="stock-results" aria-label={t.resultsRegionLabel} className="space-y-2 scroll-mt-20">
          {/* 결과 목록 제목 — 무JS/스크린리더가 필터 UI 다음에 '종목 목록' 시작을 바로 인지 + '138종목 내' 범위 재고지 */}
          {sorted.length > 0 ? (
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">{t.resultsHeading(sorted.length, total)}</h2>
              {/* 현재 보기의 역할 한 줄 안내(데스크톱 전용) — 카드=초보자용, 표=숙련자용. 튜토리얼 벽 없이 compact. */}
              <span className="hidden lg:block text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0 truncate">{viewMode === "table" ? t.viewTableHint : t.viewCardHint}</span>
            </div>
          ) : null}
          {sorted.length === 0 ? (() => {
            const sc = strongestConstraint();
            // 필터 제약은 없는데 검색어만 있어 0건 → 검색 실패로 안내(철자 확인·검색어 지우기)
            const searchOnly = !sc && !!query.trim();
            const themeQualityPreview = qualityExcludedThemeStocks.slice(0, 4);
            return (
              <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4">
                <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 break-words">
                  {showThemeQualityEmpty
                    ? t.themeQualityEmptyTitle(selectedThemeSummary)
                    : showThemeNoMatchEmpty
                      ? t.themeNoMatchTitle(selectedThemeSummary)
                      : searchOnly
                        ? t.emptySearchTitle(query.trim())
                        : t.emptyTitle}
                </div>
                {showThemeQualityEmpty ? (
                  <div className="mx-auto mt-2 max-w-2xl text-left">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
                      {t.themeQualityEmptyHint(qualityExcludedThemeStocks.length, themeScopedStocks.length)}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {themeQualityPreview.map((s) => {
                        const reasons = qualityReasonLabels(s);
                        return (
                          <li key={s.ticker} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 px-3 py-2.5">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <Link href={"/stock/" + s.ticker} prefetch={false} className="min-w-0 text-sm font-medium text-zinc-800 dark:text-zinc-100 hover:text-blue-700 dark:hover:text-blue-400">
                                <span className="break-words">{s.name}</span>
                                <span className="ml-1 text-[11px] font-mono text-zinc-400 dark:text-zinc-500 tabular-nums">{s.ticker}</span>
                              </Link>
                              <span className="shrink-0 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">{t.themeQualityReasonTitle}</span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {reasons.map((reason) => (
                                <span key={reason} className="rounded-full border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 text-[10px] text-amber-800 dark:text-amber-300 tabular-nums">
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    {qualityExcludedThemeStocks.length > themeQualityPreview.length ? (
                      <p className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500">{t.themeQualityMore(qualityExcludedThemeStocks.length - themeQualityPreview.length)}</p>
                    ) : null}
                    <p className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500">{t.themeQualityCaveat}</p>
                  </div>
                ) : showThemeNoMatchEmpty ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">{t.themeNoMatchHint}</p>
                ) : sc ? (() => {
                  const es = t.emptyStrong(sc.label);
                  return (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">{es.pre}<strong className="text-zinc-700 dark:text-zinc-200">{es.label}</strong>{es.post}<br className="hidden sm:block" />{es.line2}</p>
                  );
                })() : searchOnly ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">{t.emptySearchHint}</p>
                ) : (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">{t.emptyLoose}</p>
                )}
                <div className="flex gap-2 justify-center mt-4 flex-wrap">
                  {showThemeQualityEmpty ? (
                    <button type="button" onClick={viewAllStocks} className={`text-xs px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition min-h-[44px] ${FOCUS_RING}`}>{t.themeQualityAction}</button>
                  ) : null}
                  {showThemeNoMatchEmpty ? (
                    <Link href="/stocks" onClick={openDefaultStocks} className={`inline-flex items-center justify-center text-xs px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition min-h-[44px] ${FOCUS_RING}`}>{t.themeNoMatchAction}</Link>
                  ) : null}
                  {sc && !showThemeQualityEmpty && !showThemeNoMatchEmpty ? (
                    <button type="button" onClick={sc.relax} className={`text-xs px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition min-h-[44px] ${FOCUS_RING}`}>{t.relaxStrongest}</button>
                  ) : null}
                  {searchOnly ? (
                    <button type="button" onClick={() => setQuery("")} className={`text-xs px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition min-h-[44px] ${FOCUS_RING}`}>{t.clearSearch}</button>
                  ) : null}
                  <button type="button" onClick={resetFilters} className={`text-xs px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition min-h-[44px] ${FOCUS_RING}`}>{t.backToDefaultReset}</button>
                </div>
              </div>
            );
          })() : viewMode === "table" ? (
            <>
              {/* 표형: 데스크톱은 점수 히트맵 테이블, 모바일(<lg)은 카드형 유지 */}
              <div className="hidden lg:block"><StockResultsTable rows={sorted.slice(0, 100)} laggedTickers={laggedTickers} /></div>
              <div className="lg:hidden space-y-2">{renderCards()}</div>
            </>
          ) : (
            renderCards()
          )}
          {sorted.length > 100 ? (<div className="text-xs text-zinc-500 text-center py-3">{t.topCapNote(sorted.length, total)}</div>) : null}
        </section>
      </div>

      {drawerOpen ? (
        <>
          <div onClick={() => setDrawerOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-50" aria-hidden />
          <div role="dialog" aria-modal="true" aria-labelledby="stocks-filter-sheet-title" className="lg:hidden fixed inset-x-0 bottom-0 max-h-[88svh] bg-white dark:bg-zinc-950 z-50 rounded-t-2xl shadow-2xl flex flex-col">
            <div className="px-4 pt-3 pb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" aria-hidden />
              <div className="flex items-center justify-between">
                <h3 id="stocks-filter-sheet-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.filterDetailTitle}</h3>
                <button type="button" aria-label={t.closeFilter} onClick={() => setDrawerOpen(false)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4"><FilterPanel /></div>
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0 grid grid-cols-2 gap-2">
              <button type="button" onClick={resetFilters} className={`px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 min-h-[44px] ${FOCUS_RING}`}>{t.reset}</button>
              <button type="button" onClick={() => setDrawerOpen(false)} className={`px-3 py-2 text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded hover:bg-zinc-800 min-h-[44px] ${FOCUS_RING}`}>{t.closeDrawerView(sorted.length)}</button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
