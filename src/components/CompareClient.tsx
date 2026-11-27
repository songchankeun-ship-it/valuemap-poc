"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  getCompareList,
  addToCompare,
  removeFromCompare,
  clearCompare,
  COMPARE_MAX,
} from "@/lib/compare";
import { getWatchlist } from "@/lib/watchlist";
import { getRecentViews } from "@/lib/recentViews";
import { sectorOf } from "@/lib/sector";
import { getDataWarnings, isSuspect } from "@/lib/dataQuality";
import { fmtMarketCap, fmtWon } from "@/lib/format";
import { StockSearchBox } from "@/components/StockSearchBox";
import { EvidenceShareButton } from "@/components/EvidenceShareButton";
import { FOCUS_RING } from "@/components/ui/controlStyles";
import { compareSharePath } from "@/lib/growthShare";
import { appendLinkedSelection } from "@/lib/compareQuery";
import { financialEvidenceCopy, type ValuationBasis } from "@/lib/financialEvidence";
import { ArrowRight, CheckCircle2, ChevronDown, ExternalLink, AlertTriangle, Plus, Trash2, X } from "lucide-react";

interface RecommendedSet {
  label: string;
  tickers: string[];
  names: string[];
}

// 서버(compare/page.tsx)에서 최근 14일 공시 신호를 종목별로 추출해 전달. 표시 전용.
interface CompareDisclosure {
  label: string;
  type: string;
  direction?: string;
  date: string; // YYYYMMDD
  url: string;
}

// Keep the filing year visible when rendering a sample.
function fmtDiscDate(d: string): string {
  return /^\d{8}$/.test(d) ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}` : d;
}

interface CompareStock {
  ticker: string;
  name: string;
  currentPrice: number;
  changePct: number;
  marketCap: number;
  per: number;
  pbr: number;
  roe: number;
  dividendYield: number;
  momentum: number;
  flow: number;
  value: number;
  valuationBasis: ValuationBasis;
  priceDate: string | null;
  vol: number;
  neglectScore: number;
  compositeScore: number;
  themes: string[];
  returns?: { r1m?: number; r3m?: number; r6m?: number };
}

const SCORE_KEYS = [
  { key: "momentum", label: "추세" },
  { key: "flow", label: "거래활성도" },
  { key: "value", label: "밸류" },
  { key: "vol", label: "위험조정" },
] as const;

const FUND_ROWS: Array<{ key: "per" | "pbr" | "roe" | "dividendYield"; label: string; suffix: string }> = [
  { key: "per",           label: "PER",   suffix: "배" },
  { key: "pbr",           label: "PBR",   suffix: "배" },
  { key: "roe",           label: "ROE",   suffix: "%" },
  { key: "dividendYield", label: "배당", suffix: "%" },
];

function CompareColumns({ count, children }: { count: number; children: React.ReactNode }) {
  return <div className="research-compare-columns" style={{ "--compare-count": count } as CSSProperties} data-count={count}>{children}</div>;
}

function EvidenceMatrix({ stocks, remove }: { stocks: CompareStock[]; remove: (ticker: string) => void }) {
  const basis = financialEvidenceCopy.ko;
  return (
    <section className="research-comparison-block" aria-labelledby="compare-evidence-title">
      <div className="research-band-heading">
        <h2 id="compare-evidence-title">비교 결과</h2>
        <span className="text-xs text-[var(--muted)]">{stocks.length}종목</span>
      </div>
      <div className="research-compare-scroll" role="region" aria-label="종목별 비교표" tabIndex={0}>
        <table className="research-compare-matrix" data-count={stocks.length}>
          <caption className="sr-only">종가, 오른스코어 지표, 재무 및 기간 수익률</caption>
          <colgroup>
            <col className="research-compare-key" />
            {stocks.map((s) => <col key={s.ticker} />)}
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="research-matrix-label">항목</th>
              {stocks.map((s, index) => (
                <th key={s.ticker} scope="col" data-series={index}>
                  <div className="research-matrix-stock">
                    <Link href={`/stock/${s.ticker}`} className="research-matrix-stock-link">
                      <span className="research-matrix-ticker">{s.ticker}</span>
                      <strong>{s.name}</strong>
                    </Link>
                    <button type="button" onClick={() => remove(s.ticker)} aria-label={`${s.name} 비교에서 제거`} title="비교에서 제거">
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="research-matrix-label">종합점수</th>
              {stocks.map((s) => (
                <td key={s.ticker} className="research-matrix-score">
                  <strong>{s.compositeScore}</strong><small> / 100</small>
                  {s.valuationBasis === "three-factors" ? <small className="research-matrix-basis">{basis.threeFactors}</small> : null}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="research-matrix-label">종가</th>
              {stocks.map((s) => (
                <td key={s.ticker}>
                  <strong>{fmtWon(s.currentPrice)}</strong>
                  <span className="research-matrix-change" data-direction={s.changePct > 0 ? "up" : s.changePct < 0 ? "down" : "flat"}>
                    {s.changePct > 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                  </span>
                  <small className="research-matrix-basis">{s.priceDate ?? basis.unverifiedCloseDate}</small>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="research-matrix-label">업종·시총</th>
              {stocks.map((s) => (
                <td key={s.ticker} className="research-matrix-sector">
                  {sectorOf(s.themes, s.ticker)}<small>{fmtMarketCap(s.marketCap)}</small>
                </td>
              ))}
            </tr>
          </tbody>
          <tbody>
            <tr className="research-matrix-band"><th colSpan={stocks.length + 1} scope="rowgroup"><span>자체 지표 · 100점 기준</span></th></tr>
            {SCORE_KEYS.map(({ key, label }) => (
              <tr key={key}>
                <th scope="row" className="research-matrix-label">{label}</th>
                {stocks.map((s, index) => {
                  if (key === "value" && s.valuationBasis !== "measured") {
                    return <td key={s.ticker} data-series={index}><span className="research-matrix-basis">{basis.noValue}</span></td>;
                  }
                  const value = Math.max(0, Math.min(100, s[key]));
                  return (
                    <td key={s.ticker} data-series={index}>
                      <strong>{Math.round(s[key])}<span className="sr-only">점</span></strong>
                      <span className="research-matrix-bar" aria-hidden="true"><span style={{ width: `${value}%` }} /></span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tbody>
            <tr className="research-matrix-band"><th colSpan={stocks.length + 1} scope="rowgroup"><span>재무</span></th></tr>
            {FUND_ROWS.map(({ key, label, suffix }) => (
              <tr key={key}>
                <th scope="row" className="research-matrix-label">{label}</th>
                {stocks.map((s) => <td key={s.ticker}>{s[key] > 0 ? `${s[key].toFixed(2)}${suffix}` : "—"}</td>)}
              </tr>
            ))}
          </tbody>
          <tbody>
            <tr className="research-matrix-band"><th colSpan={stocks.length + 1} scope="rowgroup"><span>기간 수익률</span></th></tr>
            {([["r1m", "1개월"], ["r3m", "3개월"], ["r6m", "6개월"]] as const).map(([key, label]) => (
              <tr key={key}>
                <th scope="row" className="research-matrix-label">{label}</th>
                {stocks.map((s) => {
                  const value = s.returns?.[key];
                  return (
                    <td key={s.ticker} data-direction={typeof value !== "number" || value === 0 ? "flat" : value > 0 ? "up" : "down"}>
                      {typeof value === "number" ? `${value > 0 ? "+" : ""}${value.toFixed(0)}%` : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="research-matrix-note">{basis.priceSource}</p>
      <p className="research-matrix-note">{basis.financialPeriod} · {basis.financialSources}</p>
      <p className="research-matrix-note">오른스코어 내부 업종 분류 기준 · 지표는 탐색용이며 매수·매도 추천이 아닙니다. 위험조정 점수는 안전도를 뜻하지 않습니다.</p>
    </section>
  );
}

export function CompareClient({
  stockMap,
  priceBasisDate,
  top5 = [],
  recommendedSets = [],
  exampleSets = [],
  disclosureByTicker = {},
  showSampleDisclosures = false,
  linkedTickers,
}: {
  stockMap: Record<string, CompareStock>;
  priceBasisDate: string;
  top5?: Array<{ ticker: string; name: string }>;
  recommendedSets?: RecommendedSet[];
  exampleSets?: RecommendedSet[];
  disclosureByTicker?: Record<string, CompareDisclosure[]>;
  showSampleDisclosures?: boolean;
  linkedTickers?: string[];
}) {
  const isLinkedCompare = linkedTickers !== undefined;
  // The route key resets this selection when a different comparison link is opened.
  const [tickers, setTickers] = useState<string[]>(() => linkedTickers ?? []);
  const [watchlist, setWatchlist] = useState<Array<{ ticker: string; name: string }>>([]);
  const [recentViews, setRecentViews] = useState<Array<{ ticker: string; name: string }>>([]);
  // 담기/빼기 피드백 — 최대 초과, 이미 담음 등 안내(3초 자동 소멸)
  const [notice, setNotice] = useState<string>("");
  // 마지막으로 뺀 종목 — 실수로 뺀 경우 되돌리기(5초 자동 소멸)
  const [undoStock, setUndoStock] = useState<{ ticker: string; name: string } | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    function reloadBasket() {
      if (isLinkedCompare) return;
      getCompareList().then((list) => {
        if (active) setTickers(list.filter((ticker) => Boolean(stockMap[ticker])).slice(0, COMPARE_MAX));
      });
    }

    // 최근 본 종목 — RecentViewTracker가 기록한 실제 방문 기록만 읽는다(이름은 stockMap으로 매핑, 풀에 없으면 제외, 가짜 항목 없음)
    function loadRecent() {
      if (!active) return;
      const mapped = getRecentViews()
        .map((r) => ({ ticker: r.ticker, name: stockMap[r.ticker]?.name }))
        .filter((x): x is { ticker: string; name: string } => Boolean(x.name));
      setRecentViews(mapped);
    }

    reloadBasket();
    loadRecent();

    // 관심 종목에서 추가 — 마운트 시 1회 로드(이름은 stockMap으로 매핑, 풀에 없으면 제외)
    getWatchlist().then((items) => {
      if (!active) return;
      const mapped = items
        .map((it) => ({ ticker: it.ticker, name: stockMap[it.ticker]?.name }))
        .filter((x): x is { ticker: string; name: string } => Boolean(x.name));
      setWatchlist(mapped);
    });

    function onStorage() {
      reloadBasket();
      loadRecent();
    }

    if (!isLinkedCompare) {
      window.addEventListener("compare-basket-changed", reloadBasket);
      window.addEventListener("ornscore:compare-updated", reloadBasket);
      window.addEventListener("valuemap:compare-updated", reloadBasket);
    }
    window.addEventListener("recent-views-changed", loadRecent);
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      window.removeEventListener("compare-basket-changed", reloadBasket);
      window.removeEventListener("ornscore:compare-updated", reloadBasket);
      window.removeEventListener("valuemap:compare-updated", reloadBasket);
      window.removeEventListener("recent-views-changed", loadRecent);
      window.removeEventListener("storage", onStorage);
    };
  }, [isLinkedCompare, stockMap]);

  // 타이머 정리 — 언마운트 시 대기 중인 자동 소멸 타이머를 해제
  useEffect(() => {
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  function flashNotice(msg: string) {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 3000);
  }

  // 모든 담기 동작의 공통 경로 — 상한 초과/중복이면 조용히 안내만 띄운다.
  async function tryAdd(ticker: string) {
    if (isLinkedCompare) {
      if (tickers.includes(ticker)) flashNotice("이미 담은 종목이에요");
      else if (tickers.length >= COMPARE_MAX) flashNotice(`비교는 최대 ${COMPARE_MAX}개까지 담을 수 있어요 — 하나를 빼고 추가하세요`);
      else setTickers((current) => appendLinkedSelection(current, [ticker]));
      return;
    }
    const res = await addToCompare(ticker);
    if (!res.ok && res.reason === "max") {
      flashNotice(`비교는 최대 ${COMPARE_MAX}개까지 담을 수 있어요 — 하나를 빼고 추가하세요`);
    } else if (res.ok && res.reason === "already") {
      flashNotice("이미 담은 종목이에요");
    }
  }

  async function remove(ticker: string) {
    const name = stockMap[ticker]?.name ?? ticker;
    setTickers((prev) => prev.filter((t) => t !== ticker));
    if (!isLinkedCompare) await removeFromCompare(ticker);
    // 방금 뺀 종목을 되돌릴 수 있게 잠시 보관
    setUndoStock({ ticker, name });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoStock(null), 5000);
  }

  async function undoRemove() {
    const target = undoStock;
    if (!target) return;
    setUndoStock(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    await tryAdd(target.ticker);
  }

  // 추천 세트 추가 — addToCompare가 매번 현재 목록을 읽으므로 순차 호출로 4개 상한을 지킨다.
  async function addSet(selection: string[]) {
    if (isLinkedCompare) {
      if (new Set([...tickers, ...selection]).size > COMPARE_MAX) {
        flashNotice(`최대 ${COMPARE_MAX}개까지 담을 수 있어 일부만 추가됐어요`);
      }
      setTickers((current) => appendLinkedSelection(current, selection));
      return;
    }
    let hitMax = false;
    for (const t of selection) {
      const res = await addToCompare(t);
      if (!res.ok && res.reason === "max") {
        hitMax = true;
        break;
      }
    }
    if (hitMax) flashNotice(`최대 ${COMPARE_MAX}개까지 담을 수 있어 일부만 추가됐어요`);
  }

  async function clearAll() {
    if (!confirm(isLinkedCompare ? "이 비교에 선택한 종목을 모두 비울까요?" : "비교 목록을 모두 비울까요?")) return;
    setTickers([]);
    if (!isLinkedCompare) await clearCompare();
  }

  const stocks = tickers
    .map((t) => stockMap[t])
    .filter((s): s is CompareStock => Boolean(s));

  // 빠른 추가 후보 — 이미 담은 종목은 제외. 두 화면(빈 상태·결과)에서 공용으로 쓴다.
  const watchlistAddable = watchlist.filter((w) => !tickers.includes(w.ticker));
  // 최근 본 종목 — 이미 담은 종목은 제외. 실제 방문 기록이 1개 이상일 때만 노출(빈/가짜 칩 없음)
  const recentAddable = recentViews.filter((r) => !tickers.includes(r.ticker));
  const top5Addable = top5.filter((s) => !tickers.includes(s.ticker));

  // 원클릭 관심 종목 비교 — 관심 3종목이 있으면 관심 선택 진입점으로 제공(Slice J의 5개 시작 경로 중 하나).
  // 이미 담은 종목을 뺀 담을 수 있는 수가 2개 미만이면(눌러도 비교 불가) 버튼을 숨긴다.
  const quickCompareWatchlist = watchlist.slice(0, 3).map((w) => w.ticker).filter((t) => !tickers.includes(t));
  const quickCompare =
    watchlist.length >= 3 && quickCompareWatchlist.length >= 2
      ? { tickers: quickCompareWatchlist, label: "내 관심 3종목 비교하기" }
      : null;

  // 선택 수 카운트 안내 — 검색창·예시 버튼 옆에 항상 보이게(0·1개에서도). 비자문 톤.
  const countIndicator = (
    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
      선택 <span className="font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">{tickers.length}/{COMPARE_MAX}</span> · 최소 2개 필요 · 최대 {COMPARE_MAX}개
    </p>
  );

  // 담기/빼기 피드백 영역 — 두 화면에서 동일하게 렌더(안내 + 되돌리기)
  const feedbackRegion =
    notice || undoStock ? (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" aria-live="polite">
        {undoStock ? (
          <span className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-300 min-w-0">
            <span className="truncate max-w-[180px]">{undoStock.name}을(를) 뺐어요</span>
            <button
              type="button"
              onClick={() => { void undoRemove(); }}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
            >
              실행 취소
            </button>
          </span>
        ) : null}
        {notice ? <span className="text-zinc-500 dark:text-zinc-400 truncate min-w-0">{notice}</span> : null}
      </div>
    ) : null;

  const linkedContext = isLinkedCompare ? (
    <div className="research-linked-compare">
      <p><strong>링크로 열린 비교</strong> · 이 화면에서 바꾼 종목은 저장된 비교함에 반영되지 않아요.</p>
      <Link href="/compare" className="research-link" prefetch={false}>
        저장된 비교함 보기 <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  ) : null;

  // 비교는 최소 2개부터 의미가 있으므로, 2개 미만이면 시작 화면을 보여준다.
  if (stocks.length < 2) {
    const selected = stocks[0]; // 0개 또는 1개
    return (
      <section className="research-compare-start space-y-4">
        <div className="research-comparison-toolbar">
          <div>
            <h2>비교할 종목</h2>
            {countIndicator}
          </div>
          <StockSearchBox stocks={Object.entries(stockMap).map(([ticker, st]) => ({ ticker, name: st.name }))} onPick={(t) => { void tryAdd(t); }} placeholder="예: 삼성전자, 005930" />
        </div>
        {linkedContext ?? <p className="research-matrix-note">비교 목록은 로그인 없이 이 기기에 저장돼요. 로그인하면 여러 기기에서 이어봅니다.</p>}
        <div className="space-y-4">
          {feedbackRegion}

          {/* 선택 칩 + 최소 2개 안내 — 1개 선택 시 */}
          {selected ? (
            <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-3">
              <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wide">선택한 종목</div>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 text-xs pl-3 pr-1.5 py-1 min-h-[36px] rounded-full border border-blue-300 dark:border-blue-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">
                  {selected.name}
                  <button
                    type="button"
                    onClick={() => remove(selected.ticker)}
                    aria-label={selected.name + " 비교에서 제거"}
                    className="w-5 h-5 flex items-center justify-center rounded-full text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    ×
                  </button>
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 font-medium">비교하려면 1개 더 선택하세요 (최소 2개 · 최대 4개)</p>
            </div>
          ) : null}

          {/* 같은 업종 예시로 바로 비교 체험 — 클릭 한 번으로 2~4종목(같은 업종 피어)이 채워지는 예시 세트 + 관심 원클릭(비자문).
              업종이 다른 교차 프리셋은 비교 근거가 약해 예시에서 다루지 않는다(Slice J). */}
          {exampleSets.length > 0 || quickCompare ? (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">같은 업종 예시로 바로 비교를 체험해 보세요</p>

                </div>
              </div>
              {exampleSets.length > 0 ? (
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {exampleSets.map((set) => (
                    <button
                      key={set.label}
                      type="button"
                      onClick={() => { void addSet(set.tickers); }}
                      className={`flex items-center justify-between gap-2 w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition ${FOCUS_RING}`}
                    >
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">{set.label}</span>
                      <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500 shrink-0">{set.tickers.length}종목 →</span>
                    </button>
                  ))}
                </div>
              ) : null}
              {quickCompare ? (
                <button
                  type="button"
                  onClick={() => { void addSet(quickCompare.tickers); }}
                  className={`inline-flex items-center justify-center gap-1 w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition ${FOCUS_RING}`}
                >
                  {quickCompare.label} →
                </button>
              ) : null}
            </div>
          ) : null}

          {/* 2) 추천 비교 세트 — "A vs B" 동종 피어 쌍/같은 업종 묶음을 한 번에 담기 */}
          {recommendedSets.length > 0 ? (
            <div>
              <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">추천 비교 세트</div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-2">바로 비교를 시작할 수 있는 동종·동업종 묶음이에요.</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {recommendedSets.map((set) => (
                  <button
                    key={set.label}
                    type="button"
                    onClick={() => { void addSet(set.tickers); }}
                    className={`w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition ${FOCUS_RING}`}
                  >
                    <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                      {set.label} <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500">{set.tickers.length}종목</span>
                      {!set.label.includes(" vs ") ? (
                        <span className="ml-1 align-middle text-[9px] font-medium px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">같은 업종</span>
                      ) : null}
                    </div>
                    {!set.label.includes(" vs ") ? (
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{set.names.join(" · ")}</div>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* 3) 빠른 추가 — 최근 본 / 관심 종목을 가벼운 그룹 섹션으로(카드 중첩 제거).
              '오늘 Top' 같은 오늘 후보 프리셋은 시작 경로를 좁히려 여기서 다루지 않는다(Slice J) — /today 진입점은 아래 링크로 유지. */}
          <div className="space-y-3.5">
            {/* 최근 본 종목 */}
            <div>
              <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">최근 본 종목</div>
              {recentAddable.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {recentAddable.map((r) => (
                    <button
                      key={r.ticker}
                      type="button"
                      onClick={() => { void tryAdd(r.ticker); }}
                      className={`text-xs px-3 py-1.5 min-h-[44px] rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition ${FOCUS_RING}`}
                    >
                      + {r.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">종목 상세를 열어본 뒤 다시 오면 여기서 바로 추가할 수 있어요.</p>
              )}
            </div>

            {/* 관심 종목 */}
            <div>
              <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">관심 종목</div>
              {watchlistAddable.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {watchlistAddable.map((w) => (
                    <button
                      key={w.ticker}
                      type="button"
                      onClick={() => { void tryAdd(w.ticker); }}
                      className={`text-xs px-3 py-1.5 min-h-[44px] rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition ${FOCUS_RING}`}
                    >
                      + {w.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">관심 종목을 담아두면 여기서 바로 비교에 추가할 수 있어요.</p>
                  <Link href="/watchlist" prefetch={false} className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline">관심 종목 보기</Link>
                </div>
              )}
            </div>
          </div>

          {/* 4) 종목 탐색 · 오늘 후보 진입점 (설계서 §8-2) — 검색이 막막할 때의 두 진입점 */}
          <div className="pt-1 flex flex-wrap gap-2">
            <Link href="/stocks" prefetch={false} className={`inline-flex items-center justify-center gap-1 px-4 py-2.5 min-h-[44px] rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition ${FOCUS_RING}`}>
              업종·테마로 종목 탐색 →
            </Link>
            <Link href="/today" prefetch={false} className={`inline-flex items-center justify-center gap-1 px-4 py-2.5 min-h-[44px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition ${FOCUS_RING}`}>
              오늘 후보에서 고르기 →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const canAddMore = stocks.length < COMPARE_MAX;

  // "먼저 무엇을 비교하는지" 프레임 — 표를 보기 전에 이 묶음의 성격을 한 줄로 짚어준다(비자문·사실).
  const compareSectors = Array.from(new Set(stocks.map((s) => sectorOf(s.themes, s.ticker))));
  const sameSector = compareSectors.length === 1;
  const perValues = stocks.map((s) => s.per).filter((v) => v > 0);
  const perRange = perValues.length >= 2 ? { min: Math.min(...perValues), max: Math.max(...perValues) } : null;
  const withDisclosures = stocks.filter((s) => (disclosureByTicker[s.ticker]?.length ?? 0) > 0).length;
  const flaggedCount = stocks.filter((s) => isSuspect(s) || getDataWarnings(s).length > 0).length;

  // 결과 화면 빠른 추가 후보 — 최근·Top5·관심을 합치고 중복 제거(칩 과다 방지 위해 6개까지)
  const quickAdd: Array<{ ticker: string; name: string }> = [];
  {
    const seen = new Set<string>(tickers);
    for (const item of [...recentAddable, ...top5Addable, ...watchlistAddable]) {
      if (seen.has(item.ticker)) continue;
      seen.add(item.ticker);
      quickAdd.push(item);
      if (quickAdd.length >= 6) break;
    }
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {linkedContext}
      <div className="research-comparison-toolbar">
        <div>
          <p className="research-section-label">비교 중인 종목 {stocks.length}/{COMPARE_MAX}</p>
          <p className="text-xs text-[var(--muted)]">{financialEvidenceCopy.ko.priceBasis} · {priceBasisDate}</p>
          <p className="text-xs text-[var(--muted)]">
            {sameSector ? compareSectors[0] : "업종 혼합 · PER·PBR은 업종 차이 고려"}
            {perRange ? ` · PER ${perRange.min.toFixed(1)}~${perRange.max.toFixed(1)}배` : ""}
          </p>
        </div>
        <div className="research-comparison-actions">
          <EvidenceShareButton
            path={compareSharePath(tickers)}
            title={`${stocks.map((stock) => stock.name).join(" vs ")} — 오른스코어 비교`}
            text="예측이나 추천 대신 같은 기준의 숫자와 다음 확인 순서를 나란히 비교해 보세요."
            analytics={{ kind: "compare", count: stocks.length, surface: "interactive" }}
            label="비교 공유"
            compact
          />
          <button type="button" onClick={clearAll} className="research-saved-tool" aria-label="모두 비우기" title="모두 비우기">
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="research-compare-add">
        {canAddMore ? (
          <details>
            <summary className="research-saved-tool"><Plus size={16} aria-hidden="true" />종목 추가<ChevronDown size={15} aria-hidden="true" /></summary>
            <div className="research-compare-add-options">
              <StockSearchBox
                stocks={Object.entries(stockMap).map(([ticker, st]) => ({ ticker, name: st.name }))}
                onPick={(t) => { void tryAdd(t); }}
                placeholder="종목 추가 — 예: 삼성전자, 005930"
              />
              {quickAdd.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {quickAdd.map((q) => (
                    <button key={q.ticker} type="button" onClick={() => { void tryAdd(q.ticker); }} className="research-saved-tool">
                      <Plus size={14} aria-hidden="true" />{q.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </details>
        ) : <p className="research-matrix-note">최대 {COMPARE_MAX}종목 선택됨</p>}
        {withDisclosures > 0 || flaggedCount > 0 ? (
          <a href="#compare-disclosures" className="research-saved-tool research-link">
            <AlertTriangle size={15} aria-hidden="true" />
            {[withDisclosures > 0 ? `${showSampleDisclosures ? "예시 공시" : "공시 신호"} ${withDisclosures}종` : "", flaggedCount > 0 ? `데이터 점검 ${flaggedCount}종` : ""].filter(Boolean).join(" · ")}
          </a>
        ) : null}
      </div>
      {feedbackRegion}

      <EvidenceMatrix stocks={stocks} remove={remove} />

      {/* 최근 공시 신호 · 데이터 점검 — 종목별 컨텍스트(표시 전용). 방향·규모는 원문 확인 필요, 매수·매도 판단 아님 */}
      <section id="compare-disclosures" className="research-comparison-block scroll-mt-24">
        <h2 className="text-base font-semibold mb-1">{showSampleDisclosures ? "예시 공시" : "최근 공시 신호"} · 데이터 점검</h2>
        <p className="research-matrix-note mb-3">
          {showSampleDisclosures ? "최신 공시를 불러오지 못해 예시 자료를 표시합니다." : "최근 14일 공시에서 추출한 신호입니다."} 방향·규모·사유는 원문을 확인하세요.
        </p>
        <CompareColumns count={stocks.length}>
          {stocks.map((s) => {
            const ds = disclosureByTicker[s.ticker] ?? [];
            const warns = getDataWarnings(s);
            const suspect = isSuspect(s);
            return (
              <div key={s.ticker} className="space-y-2 min-w-0">
                <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 truncate">{s.name}</div>
                {/* 최근 공시 신호 */}
                <div className="space-y-1.5">
                  {ds.length > 0 ? (
                    ds.map((d) => (
                      <a
                        key={d.url}
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/40 px-2 py-1.5 hover:border-blue-400 dark:hover:border-blue-600 transition ${FOCUS_RING}`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[11px] font-medium text-zinc-800 dark:text-zinc-100 truncate">{d.label}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={1.8} />
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                          <span className="tabular-nums">{fmtDiscDate(d.date)}</span>
                          {d.direction ? <span className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300">{d.direction}</span> : null}
                        </div>
                      </a>
                    ))
                  ) : (
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">최근 공시 신호 없음</p>
                  )}
                </div>
                {/* 데이터 점검 */}
                {suspect || warns.length > 0 ? (
                  <div className="space-y-1">
                    {warns.length > 0 ? (
                      warns.map((w) => (
                        <div key={w} className="flex items-start gap-1 text-[10px] leading-snug text-amber-700 dark:text-amber-300">
                          <AlertTriangle className="mt-0.5 w-3 h-3 shrink-0" strokeWidth={2} />
                          <span className="break-keep">{w}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="w-3 h-3 shrink-0" strokeWidth={2} />
                        <span>이상값 점검 중 — 값 해석에 주의</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 shrink-0" strokeWidth={2} />
                    <span>이상값 점검 통과</span>
                  </div>
                )}
              </div>
            );
          })}
        </CompareColumns>
      </section>

      {/* 테마 비교 */}
      <section className="research-comparison-block">
        <h2 className="text-base font-semibold mb-3 md:mb-4">테마</h2>
        <CompareColumns count={stocks.length}>
          {stocks.map((s) => (
            <div key={s.ticker}>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-2 truncate">{s.name}</div>
              <div className="flex flex-wrap gap-1">
                {s.themes.map((t) => (
                  <Link key={t} href={`/stocks?theme=${encodeURIComponent(t)}`} className="text-[10px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                    #{t}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </CompareColumns>
      </section>
    </div>
  );
}
