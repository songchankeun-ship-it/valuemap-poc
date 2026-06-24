"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { fmtMarketCap, fmtWon } from "@/lib/format";
import { listSavedSearches, addSavedSearch, removeSavedSearch, type SavedSearch, type SavedSearchConfig } from "@/lib/savedSearches";
import { addConditionAlert } from "@/lib/conditionAlerts";
import { DataStatusBadge } from "@/components/trust/badges";

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
  r3m?: number | null; // 최근 3개월 등락률 %
}

interface Props {
  stocks: Stock[];
  allThemes: string[];
  initialThemes?: string[];
  totalCount?: number;
  asOf?: string;
  metricsVersion?: string;
  dataStale?: boolean;
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
  label: string;
  desc: string;
  config: PresetConfig;
}

interface QuestionPreset extends Preset {
  symbol: string;   // 카드 심볼(아이콘 대용)
  explain: string;  // 현재 조건 요약 바의 자연어 설명(소문자 이어쓰기)
  caution?: string; // 위험 고지가 필요한 질문에만
}

// 빠른 프리셋 — 질문형보다 가볍고 빠른 보조 필터(칩). 단일 선택.
const PRESETS: Preset[] = [
  { id: "lowper", label: "저평가", desc: "PER 15 이하 · 밸류 정렬", config: { perMax: 15, sortKey: "value", sortDir: "desc" } },
  { id: "momentum", label: "추세 강세", desc: "추세 강한 종목 · 종합 60+", config: { minComposite: 60, sortKey: "momentum", sortDir: "desc" } },
  { id: "lowpbr", label: "저PBR", desc: "PBR 1.0 이하 · 밸류 정렬", config: { pbrMax: 1.0, sortKey: "value", sortDir: "desc" } },
  { id: "value-momentum", label: "밸류+추세", desc: "두 지표 모두 우호적 · 종합 70+", config: { minComposite: 70, sortKey: "compositeScore", sortDir: "desc" } },
  { id: "balanced", label: "균형 종목", desc: "종합 80+", config: { minComposite: 80, sortKey: "compositeScore", sortDir: "desc" } },
  { id: "roe", label: "ROE 우수", desc: "ROE 15%+ · ROE 정렬", config: { roeMin: 15, sortKey: "roe", sortDir: "desc" } },
  { id: "dividend", label: "배당 있음", desc: "배당 1%+ · 배당 정렬", config: { divYieldMin: 1, sortKey: "dividendYield", sortDir: "desc" } },
  { id: "bigcap", label: "대형주", desc: "대형 5조+ · 시총 정렬", config: { capBucket: "large", sortKey: "marketCap", sortDir: "desc" } },
  { id: "smallcap", label: "소형주", desc: "소형 1조- · 밸류 정렬", config: { capBucket: "small", sortKey: "value", sortDir: "desc" } },
  { id: "surge", label: "급등 위험", desc: "3개월 상승률 높은순 · 급등 사유 확인", config: { sortKey: "r3m", sortDir: "desc" } },
  { id: "active", label: "거래 급증", desc: "거래활성도 높은순", config: { sortKey: "flow", sortDir: "desc" } },
];

// 질문형 프리셋 — 자연어 질문 그대로 클릭. /stocks의 핵심 시작점.
const QUESTION_PRESETS: QuestionPreset[] = [
  { id: "q-cheap-active", symbol: "🔍", label: "싸고 거래 늘었나?", desc: "밸류가 낮고 최근 거래 관심이 늘어난 종목", explain: "밸류가 낮으면서 최근 거래 관심이 늘어난 종목을 찾습니다.", config: { perMax: 15, excludeLoss: true, sortKey: "flow", sortDir: "desc" } },
  { id: "q-good-earner", symbol: "💰", label: "돈 잘 버는 회사?", desc: "ROE가 높고 수익성이 확인되는 종목", explain: "ROE가 높고 수익성이 확인되는 종목을 찾습니다.", config: { roeMin: 15, excludeLoss: true, sortKey: "roe", sortDir: "desc" } },
  { id: "q-dividend", symbol: "🪙", label: "배당 주는 우량주?", desc: "배당이 있고 상대적으로 안정적인 종목", explain: "배당이 있고 상대적으로 안정적인 종목을 찾습니다.", config: { divYieldMin: 2, roeMin: 8, excludeLoss: true, sortKey: "dividendYield", sortDir: "desc" } },
  { id: "q-bigcap-stable", symbol: "🏛️", label: "대형주 안정형?", desc: "시가총액이 크고 위험조정이 양호한 종목", explain: "시가총액이 크고 위험조정 점수가 양호한 종목을 찾습니다.", config: { capBucket: "large", volMin: 60, sortKey: "vol", sortDir: "desc" } },
  { id: "q-small-value", symbol: "🌱", label: "숨은 소형 저평가?", desc: "작은 회사 중 밸류가 낮은 종목", explain: "시가총액이 작으면서 밸류가 낮은 종목을 찾습니다.", config: { capBucket: "small", pbrMax: 1.0, excludeLoss: true, sortKey: "value", sortDir: "desc" } },
  { id: "q-value-trend", symbol: "⚖️", label: "밸류 + 추세 동시?", desc: "밸류와 추세가 동시에 좋은 종목", explain: "밸류와 추세가 동시에 좋은 종목을 찾습니다.", config: { valueMin: 70, momentumMin: 70, volMin: 50, sortKey: "compositeScore", sortDir: "desc" } },
  { id: "q-strong-trend", symbol: "📈", label: "최근 흐름 강한 종목?", desc: "최근 가격 흐름이 강한 종목", explain: "최근 가격 흐름이 강한 종목을 찾습니다.", caution: "추세는 빠르게 식을 수 있어 급등 사유 확인이 필요합니다.", config: { momentumMin: 80, sortKey: "momentum", sortDir: "desc" } },
  { id: "q-surge-risk", symbol: "⚠️", label: "급등했지만 위험한 종목?", desc: "최근 급등해 추가 확인이 필요한 종목", explain: "최근 3개월 상승률이 큰, 추가 확인이 필요한 종목을 보여줍니다.", caution: "급등 후 변동성이 큰 구간이라 급등 사유 확인이 필요합니다.", config: { sortKey: "r3m", sortDir: "desc" } },
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
}

// 기본(비제약) 설정 — 기본 /stocks 화면과 동일(PER 200·PBR 30 상한만 적용).
const NEUTRAL: FilterConfig = {
  query: "", market: "all", capBucket: "all", minComposite: 0,
  perMin: 0, perMax: 200, pbrMin: 0, pbrMax: 30, roeMin: 0, divYieldMin: 0,
  momentumMin: 0, flowMin: 0, valueMin: 0, volMin: 0, excludeLoss: false, themes: [],
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
  return true;
}

const SORT_BADGE: Partial<Record<SortKey, string>> = {
  compositeScore: "종합점수순",
  momentum: "추세순",
  flow: "거래활성도순",
  value: "밸류순",
  vol: "위험조정순",
  roe: "ROE순",
  per: "PER 낮은순",
  pbr: "PBR 낮은순",
  dividendYield: "배당순",
  marketCap: "시총순",
  r3m: "3개월 상승률순",
};

// 프리셋 config에서 실제 적용되는 조건 배지를 도출(표시 문구가 진짜 동작과 일치).
function badgesFromConfig(c: PresetConfig): string[] {
  const b: string[] = [];
  if (c.minComposite) b.push(`종합 ${c.minComposite}+`);
  if (c.momentumMin) b.push(`추세 ${c.momentumMin}+`);
  if (c.flowMin) b.push(`거래활성도 ${c.flowMin}+`);
  if (c.valueMin) b.push(`밸류 ${c.valueMin}+`);
  if (c.volMin) b.push(`위험조정 ${c.volMin}+`);
  if (c.perMax != null && c.perMax < 200) b.push(`PER ${c.perMax}↓`);
  if (c.pbrMax != null && c.pbrMax < 30) b.push(`PBR ${c.pbrMax}↓`);
  if (c.roeMin) b.push(`ROE ${c.roeMin}%+`);
  if (c.divYieldMin) b.push(`배당 ${c.divYieldMin}%+`);
  if (c.capBucket === "large") b.push("대형주");
  if (c.capBucket === "mid") b.push("중형주");
  if (c.capBucket === "small") b.push("소형주");
  if (c.excludeLoss) b.push("적자 제외");
  const sb = SORT_BADGE[c.sortKey];
  if (sb) b.push(sb);
  return b;
}

export function StocksExplorer({ stocks, allThemes, initialThemes, totalCount, asOf, metricsVersion, dataStale }: Props) {
  const total = totalCount ?? stocks.length;
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
  const [momentumMin, setMomentumMin] = useState(0);
  const [flowMin, setFlowMin] = useState(0);
  const [valueMin, setValueMin] = useState(0);
  const [volMin, setVolMin] = useState(0);
  const [capBucket, setCapBucket] = useState<CapBucket>("all");
  const [market, setMarket] = useState<MarketFilter>("all");
  const [excludeLoss, setExcludeLoss] = useState(false);
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(() => new Set(initialThemes ?? []));
  const [themeQuery, setThemeQuery] = useState("");
  const [showAllThemes, setShowAllThemes] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    let alive = true;
    const load = () => { listSavedSearches().then((r) => { if (alive) setSavedSearches(r); }); };
    load();
    window.addEventListener("saved-searches-changed", load);
    return () => { alive = false; window.removeEventListener("saved-searches-changed", load); };
  }, []);

  function buildCurrentConfig(): SavedSearchConfig {
    return { query, sortKey, sortDir, minComposite, perMin, perMax, pbrMin, pbrMax, roeMin, divYieldMin, momentumMin, flowMin, valueMin, volMin, capBucket, market, excludeLoss, themes: [...selectedThemes] };
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
  }
  async function handleSaveSearch() {
    const name = (typeof window !== "undefined" ? window.prompt("이 검색 조건의 이름을 정해주세요 (예: 저PER 배당주)") : "")?.trim();
    if (!name) return;
    const ok = await addSavedSearch(name, buildCurrentConfig());
    if (ok) listSavedSearches().then(setSavedSearches);
  }
  async function handleRemoveSaved(id: string) {
    const ok = await removeSavedSearch(id);
    if (ok) setSavedSearches((prev) => prev.filter((sv) => sv.id !== id));
  }
  async function handleCreateAlert() {
    const name = (typeof window !== "undefined" ? window.prompt("알림 이름을 정해주세요 (예: 저PER 배당주 신규)") : "")?.trim();
    if (!name) return;
    const r = await addConditionAlert(name, buildCurrentConfig());
    if (r === "login") {
      if (typeof window !== "undefined" && window.confirm("조건 알림은 로그인 후 이메일로 받을 수 있어요. 로그인하러 갈까요?")) {
        window.location.href = "/login?next=/stocks";
      }
    } else if (r === "ok") {
      if (typeof window !== "undefined") window.alert("알림을 등록했어요. 조건에 새 종목이 들어오면 이메일로 알려드릴게요. (설정 > 알림에서 관리)");
    } else {
      if (typeof window !== "undefined") window.alert("등록에 실패했어요. 잠시 후 다시 시도해주세요.");
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

  const filtered = useMemo(() => {
    const c: FilterConfig = { query, market, capBucket, minComposite, perMin, perMax, pbrMin, pbrMax, roeMin, divYieldMin, momentumMin, flowMin, valueMin, volMin, excludeLoss, themes: [...selectedThemes] };
    return stocks.filter((s) => matchesConfig(s, c));
  }, [stocks, query, market, capBucket, minComposite, perMin, perMax, pbrMin, pbrMax, roeMin, divYieldMin, momentumMin, flowMin, valueMin, volMin, excludeLoss, selectedThemes]);

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
  const activeFilterCount = nonThemeFilterCount + themeFilterCount;
  const hasAnyCondition = activeFilterCount > 0 || !!query || !!activePreset;

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
    setThemeQuery("");
    setShowAllThemes(false);
    setActivePreset(null);
    setSortKey("compositeScore");
    setSortDir("desc");
  }

  // 현재 조건 요약 바의 초기화 — 실수 방지용 확인(설계서 §16).
  function handleResetWithConfirm() {
    if (!hasAnyCondition) return;
    if (typeof window !== "undefined" && !window.confirm("모든 조건을 초기화할까요?")) return;
    resetFilters();
  }

  function toggleTheme(t: string) {
    setActivePreset(null);
    const next = new Set(selectedThemes);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    setSelectedThemes(next);
  }

  // 현재 조건을 한 줄 자연어로 설명(설계서 §10 상태별).
  function describeConditions(): string {
    const qp = QUESTION_PRESETS.find((p) => p.id === activePreset);
    if (qp) return `"${qp.label}" 조건은 ${qp.explain}`;
    const cp = PRESETS.find((p) => p.id === activePreset);
    if (cp) return `빠른 프리셋 "${cp.label}" — ${cp.desc}.`;
    if (themeFilterCount > 0 && nonThemeFilterCount === 0 && !query) {
      return `${[...selectedThemes].join(", ")} 테마에 속한 종목 중 조건에 맞는 후보를 보고 있습니다.`;
    }
    if (nonThemeFilterCount > 0 || query) {
      return "사용자가 직접 설정한 PER, PBR, ROE, 시가총액 등 조건으로 후보를 좁혔습니다.";
    }
    return `전체 ${total}개 종목을 종합점수 기준으로 보고 있습니다.`;
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

  // 현재 적용된 필터를 사람이 읽을 수 있는 칩으로 — 각 칩의 ×는 해당 필터만 해제
  function clearPreset(fn: () => void) {
    setActivePreset(null);
    fn();
  }
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (market !== "all") activeChips.push({ key: "market", label: "시장 " + (MARKET_OPTIONS.find((o) => o.id === market)?.label ?? market), onRemove: () => clearPreset(() => setMarket("all")) });
  if (capBucket !== "all") activeChips.push({ key: "cap", label: "시총 " + (CAP_OPTIONS.find((o) => o.id === capBucket)?.label ?? capBucket), onRemove: () => clearPreset(() => setCapBucket("all")) });
  if (minComposite > 0) activeChips.push({ key: "composite", label: "종합 " + minComposite + "+", onRemove: () => clearPreset(() => setMinComposite(0)) });
  if (momentumMin > 0) activeChips.push({ key: "mom", label: "추세 " + momentumMin + "+", onRemove: () => clearPreset(() => setMomentumMin(0)) });
  if (flowMin > 0) activeChips.push({ key: "flow", label: "거래활성도 " + flowMin + "+", onRemove: () => clearPreset(() => setFlowMin(0)) });
  if (valueMin > 0) activeChips.push({ key: "val", label: "밸류 " + valueMin + "+", onRemove: () => clearPreset(() => setValueMin(0)) });
  if (volMin > 0) activeChips.push({ key: "vol", label: "위험조정 " + volMin + "+", onRemove: () => clearPreset(() => setVolMin(0)) });
  if (roeMin > 0) activeChips.push({ key: "roe", label: "ROE " + roeMin + "%+", onRemove: () => clearPreset(() => setRoeMin(0)) });
  if (divYieldMin > 0) activeChips.push({ key: "div", label: "배당 " + divYieldMin.toFixed(1) + "%+", onRemove: () => clearPreset(() => setDivYieldMin(0)) });
  if (perMin > 0 || perMax < 200) activeChips.push({ key: "per", label: "PER " + perMin + "~" + perMax, onRemove: () => clearPreset(() => { setPerMin(0); setPerMax(200); }) });
  if (pbrMin > 0 || pbrMax < 30) activeChips.push({ key: "pbr", label: "PBR " + pbrMin.toFixed(1) + "~" + pbrMax.toFixed(1), onRemove: () => clearPreset(() => { setPbrMin(0); setPbrMax(30); }) });
  if (excludeLoss) activeChips.push({ key: "loss", label: "적자 제외", onRemove: () => clearPreset(() => setExcludeLoss(false)) });
  for (const t of selectedThemes) activeChips.push({ key: "theme-" + t, label: "테마 " + t, onRemove: () => toggleTheme(t) });

  function ScoreSlider({ label, value, set }: { label: string; value: number; set: (n: number) => void }) {
    return (
      <div>
        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
          최소 {label}: <span className="tabular-nums">{value}</span>
        </label>
        <input type="range" min={0} max={100} step={5} value={value} onChange={(e) => { setActivePreset(null); set(Number(e.target.value)); }} className="w-full" />
      </div>
    );
  }

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
        <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">ORNSCORE 지표</div>
          <ScoreSlider label="종합점수" value={minComposite} set={setMinComposite} />
          <ScoreSlider label="추세" value={momentumMin} set={setMomentumMin} />
          <ScoreSlider label="거래활성도" value={flowMin} set={setFlowMin} />
          <ScoreSlider label="밸류" value={valueMin} set={setValueMin} />
          <ScoreSlider label="위험조정" value={volMin} set={setVolMin} />
        </div>
        <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">재무</div>
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
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
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
    <div className="space-y-4 md:space-y-5">
      {/* ── 페이지 헤더 ── */}
      <header className="space-y-2">
        <div className="flex items-baseline justify-between flex-wrap gap-x-3 gap-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">오늘 확인할 종목 찾기</h1>
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-400 tabular-nums">조건 충족 {sorted.length}개 <span className="text-zinc-400 dark:text-zinc-500 font-normal">/ 전체 {total}개</span></span>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">질문형 프리셋과 상세 필터로 {total}개 종목 중 먼저 볼 후보를 좁혀보세요.</p>
        <div className="flex items-center gap-2 flex-wrap text-[11px] text-zinc-500 dark:text-zinc-400">
          {asOf ? <span className="tabular-nums">{asOf} 장마감</span> : null}
          {metricsVersion ? <><span aria-hidden>·</span><span>Metrics {metricsVersion}</span></> : null}
          <span aria-hidden>·</span>
          <DataStatusBadge tone={dataStale ? "delayed" : "normal"} label={dataStale ? "갱신 지연" : "데이터 정상"} />
          <span aria-hidden>·</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">투자 추천 아님 · 탐색 도구</span>
        </div>
        {nonThemeFilterCount === 0 && themeFilterCount === 0 && !query && sorted.length < stocks.length ? (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">기본 화면은 PER 200·PBR 30 이하만 표시해요. 제외된 {stocks.length - sorted.length}개(고PER·고PBR 등)는 상세 필터에서 범위를 넓히면 포함됩니다.</p>
        ) : null}
      </header>

      {/* ── 질문형 프리셋 카드(핵심 시작점) ── */}
      <section>
        <h2 className="text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100">어떤 종목을 찾고 있나요?</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 mb-3">어려운 지표명을 몰라도 질문을 고르면 조건이 자동으로 적용됩니다.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {QUESTION_PRESETS.map((p) => {
            const selected = activePreset === p.id;
            const badges = badgesFromConfig(p.config);
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
                  <span aria-hidden className="text-lg leading-none mt-0.5">{p.symbol}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{p.label}</div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{p.desc}</p>
                  </div>
                  {selected ? <span aria-hidden className="shrink-0 text-blue-600 dark:text-blue-400 text-sm">✓</span> : null}
                </div>
                {badges.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {badges.map((b) => (
                      <span key={b} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 tabular-nums">{b}</span>
                    ))}
                  </div>
                ) : null}
                {p.caution ? (
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-1.5 leading-snug">⚠ {p.caution}</div>
                ) : null}
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 tabular-nums">예상 결과 <strong className="text-zinc-700 dark:text-zinc-200">{presetCounts[p.id] ?? 0}개</strong></div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 빠른 프리셋 칩(보조 필터) ── */}
      <section className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">빠른 프리셋</span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">한 번에 하나씩 적용</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {PRESETS.map((p) => {
            const selected = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={selected}
                onClick={() => togglePreset(p)}
                title={p.desc + " · 예상 " + (presetCounts[p.id] ?? 0) + "개"}
                className={"text-xs px-3 py-1.5 rounded-full border transition " +
                  (selected
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-blue-400 hover:text-blue-700")}
              >
                {p.label}
                {selected ? <span aria-hidden className="ml-1">✓</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 내 검색 조건(저장/알림) ── */}
      <section className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">내 검색 조건</span>
          <div className="flex gap-1.5">
            <button type="button" onClick={handleSaveSearch} className="text-[11px] px-2.5 py-1.5 rounded-full border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition">+ 현재 조건 저장</button>
            <button type="button" onClick={handleCreateAlert} className="text-[11px] px-2.5 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 transition">🔔 이 조건 알림</button>
          </div>
        </div>
        {savedSearches.length === 0 ? (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">자주 쓰는 필터 조합을 저장해 한 번에 불러올 수 있어요. 로그인하면 기기 간 동기화돼요.</p>
        ) : (
          <div className="flex gap-1.5 flex-wrap">
            {savedSearches.map((sv) => (
              <span key={sv.id} className="inline-flex items-center gap-1 text-xs pl-3 pr-1 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                <button type="button" onClick={() => applySavedConfig(sv.config)} className="text-zinc-700 dark:text-zinc-300 hover:text-blue-700 dark:hover:text-blue-400">{sv.name}</button>
                <button type="button" onClick={() => handleRemoveSaved(sv.id)} aria-label="삭제" className="w-4 h-4 flex items-center justify-center rounded-full text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-700">×</button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ── 검색 · 정렬 · 필터 열기 ── */}
      <div className="flex gap-2 flex-wrap">
        <input type="search" placeholder="종목명 · 티커" value={query} onChange={(e) => { setActivePreset(null); setQuery(e.target.value); }} className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        <select aria-label="정렬 기준" value={sortKey + "-" + sortDir} onChange={(e) => { setActivePreset(null); const [k, d] = e.target.value.split("-"); setSortKey(k as SortKey); setSortDir(d as SortDir); }} className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900">
          <optgroup label="ORNSCORE 점수">
            <option value="compositeScore-desc">종합점수 높은순</option>
            <option value="momentum-desc">추세 높은순</option>
            <option value="value-desc">밸류 높은순</option>
            <option value="vol-desc">위험조정 높은순</option>
            <option value="flow-desc">거래활성도 높은순</option>
          </optgroup>
          <optgroup label="재무 지표">
            <option value="roe-desc">ROE 높은순</option>
            <option value="per-asc">PER 낮은순</option>
            <option value="pbr-asc">PBR 낮은순</option>
            <option value="dividendYield-desc">배당수익률 높은순</option>
            <option value="marketCap-desc">시가총액 큰순</option>
          </optgroup>
          <optgroup label="움직임·위험">
            <option value="r3m-desc">3개월 상승률 높은순</option>
          </optgroup>
        </select>
        <button type="button" onClick={() => setDrawerOpen(true)} className="lg:hidden px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          상세 필터
          {nonThemeFilterCount + themeFilterCount > 0 ? (
            <span className="ml-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-blue-600 text-white font-medium tabular-nums">{activeFilterCount}</span>
          ) : null}
        </button>
        <button type="button" onClick={() => setShowAdvanced((v) => !v)} aria-expanded={showAdvanced} className="hidden lg:inline-flex px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          {showAdvanced ? "상세 필터 닫기 ▴" : "상세 필터 열기 ▾"}
          {activeFilterCount > 0 ? (
            <span className="ml-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-blue-600 text-white font-medium tabular-nums">{activeFilterCount}</span>
          ) : null}
        </button>
      </div>

      {/* ── 현재 적용 조건 요약 바(결과 바로 위, 항상 노출) ── */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">현재 조건</span>
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">조건 충족 {sorted.length} <span className="text-zinc-400 dark:text-zinc-500 font-normal">/ 전체 {total}</span></span>
            </div>
            {activeChips.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                {activeChips.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={c.onRemove}
                    aria-label={c.label + " 필터 제거"}
                    className="inline-flex items-center gap-1 text-[11px] pl-2.5 pr-1.5 py-1 rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition tabular-nums"
                  >
                    <span className="truncate max-w-[160px]">{c.label}</span>
                    <span aria-hidden className="w-3.5 h-3.5 flex items-center justify-center rounded-full text-blue-500 dark:text-blue-400">×</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-1.5">적용된 상세 필터 없음</div>
            )}
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug">{describeConditions()}</p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button type="button" onClick={handleSaveSearch} className="text-[11px] px-2.5 py-1.5 rounded-md border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition">조건 저장</button>
            <button type="button" onClick={handleCreateAlert} className="text-[11px] px-2.5 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 transition">이 조건 알림</button>
            <button type="button" onClick={handleResetWithConfirm} disabled={!hasAnyCondition} className={"text-[11px] px-2.5 py-1.5 rounded-md border transition " + (hasAnyCondition ? "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-rose-400 hover:text-rose-600" : "border-zinc-200 dark:border-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed")}>초기화</button>
          </div>
        </div>
      </section>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-md px-3 py-2 text-[10px] text-blue-800 dark:text-blue-300 flex items-center justify-between md:hidden">
        <span><strong>추</strong>=추세(모멘텀) · <strong>거</strong>=거래활성도 · <strong>저</strong>=저평가(밸류) · <strong>위</strong>=위험조정</span>
        <Link href="/guide/metrics" className="text-blue-700 dark:text-blue-400 underline shrink-0 ml-2">자세히</Link>
      </div>

      <div className={"grid gap-6 " + (showAdvanced ? "lg:grid-cols-[280px_1fr]" : "lg:grid-cols-1")}>
        {showAdvanced ? (
          <aside className="hidden lg:block bg-zinc-50/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 h-fit sticky top-24">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">상세 필터</h3>
            <FilterPanel />
          </aside>
        ) : null}

        <div className="space-y-2">
          {sorted.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4">
              <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">조건에 맞는 종목이 없습니다.</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">조건을 조금 완화하면 더 많은 후보를 확인할 수 있습니다.</p>
              <div className="flex gap-2 justify-center mt-4 flex-wrap">
                <button type="button" onClick={resetFilters} className="text-xs px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition min-h-[44px]">조건 완화하기</button>
                <button type="button" onClick={resetFilters} className="text-xs px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition min-h-[44px]">전체 종목 보기</button>
              </div>
            </div>
          ) : (
            sorted.slice(0, 100).map((s) => {
              const strengths: string[] = [];
              if (s.momentum >= 70) strengths.push("추세 강함");
              if (s.flow >= 70) strengths.push("거래 활발");
              if (s.value >= 70) strengths.push("저평가 가능");
              if (s.vol >= 70) strengths.push("위험 대비 양호");
              const warnings: string[] = [];
              if (s.momentum < 40) warnings.push("추세 약함");
              if (s.flow < 40) warnings.push("거래 부진");
              if (s.value < 40) warnings.push("밸류 부담");
              if (s.vol < 40) warnings.push("변동성 큼");
              if (s.changePct < 0) warnings.push("가격 하락 중");
              if (s.r3m != null && s.r3m >= 50) warnings.push("급등 주의");
              return (
                <Link key={s.ticker} prefetch={false} href={"/stock/" + s.ticker} className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{s.name}</span>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0 font-mono">{s.ticker}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">{s.market}</span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{fmtWon(s.currentPrice)}</span>
                        <span className={"text-[11px] tabular-nums " + (s.changePct >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400")}>
                          {s.changePct >= 0 ? "▲" : "▼"} {Math.abs(s.changePct).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums flex-wrap">
                        <span>시총 {fmtMarketCap(s.marketCap)}</span>
                        <span>PER {s.per > 0 ? s.per.toFixed(1) + "배" : "—"}</span>
                        <span>PBR {s.pbr > 0 ? s.pbr.toFixed(2) + "배" : "—"}</span>
                        <span>ROE {s.roe > 0 ? s.roe.toFixed(1) + "%" : "—"}</span>
                        {s.dividendYield > 0 ? <span>배당 {s.dividendYield.toFixed(1)}%</span> : null}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-baseline gap-1 justify-end mb-2">
                        <span className="text-lg font-bold text-blue-700 dark:text-blue-400 tabular-nums">{s.compositeScore || 0}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">/100</span>
                      </div>
                      <div className="flex gap-1 justify-end text-[10px] flex-wrap">
                        <span title="모멘텀(추세)" className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded tabular-nums cursor-help">추 {s.momentum}</span>
                        <span title="거래활성도(거래)" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded tabular-nums cursor-help">거 {s.flow}</span>
                        <span title="밸류(저평가)" className="bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 px-1.5 py-0.5 rounded tabular-nums cursor-help">저 {s.value}</span>
                        <span title="변동성조정(위험조정)" className="bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded tabular-nums cursor-help">위 {s.vol}</span>
                      </div>
                    </div>
                  </div>
                  {strengths.length > 0 || warnings.length > 0 ? (
                    <div className="flex flex-col gap-1 mt-2">
                      {strengths.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">✓ 강점</span>
                          {strengths.slice(0, 3).map((label) => (
                            <span key={label} className="text-[10px] px-1.5 py-0.5 rounded border font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900">{label}</span>
                          ))}
                        </div>
                      ) : null}
                      {warnings.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 shrink-0">⚠ 주의</span>
                          {warnings.slice(0, 3).map((label) => (
                            <span key={label} className="text-[10px] px-1.5 py-0.5 rounded border font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900">{label}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {s.themes.length > 0 ? (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {s.themes.slice(0, 3).map((t) => (<span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{t}</span>))}
                      {s.themes.length > 3 ? (<span className="text-[10px] text-zinc-400 dark:text-zinc-500">+{s.themes.length - 3}</span>) : null}
                    </div>
                  ) : null}
                </Link>
              );
            })
          )}
          {sorted.length > 100 ? (<div className="text-xs text-zinc-500 text-center py-3">조건 충족 {sorted.length}개 중 상위 100개 표시 · 조건을 좁히면 비교하기 쉬워요.</div>) : null}
        </div>
      </div>

      {drawerOpen ? (
        <>
          <div onClick={() => setDrawerOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-50" aria-hidden />
          <div className="lg:hidden fixed inset-y-0 right-0 w-[340px] max-w-[90vw] bg-white dark:bg-zinc-950 z-50 shadow-2xl flex flex-col">
            <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">상세 필터</h3>
              <button type="button" onClick={() => setDrawerOpen(false)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4"><FilterPanel /></div>
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0 grid grid-cols-2 gap-2">
              <button type="button" onClick={resetFilters} className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 min-h-[44px]">초기화</button>
              <button type="button" onClick={() => setDrawerOpen(false)} className="px-3 py-2 text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded hover:bg-zinc-800 min-h-[44px]">{sorted.length}개 보기</button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
