"use client";

import { useEffect, useRef, useState } from "react";
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
import { FOCUS_RING } from "@/components/ui/controlStyles";
import { BarChart3, CheckCircle2, ExternalLink, AlertTriangle } from "lucide-react";

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

// 공시 접수일(YYYYMMDD) → MM.DD 표기. 형식이 다르면 원본 그대로.
function fmtDiscDate(d: string): string {
  return /^\d{8}$/.test(d) ? `${d.slice(4, 6)}.${d.slice(6, 8)}` : d;
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
  vol: number;
  neglectScore: number;
  themes: string[];
  returns?: { r1m?: number; r3m?: number; r6m?: number };
}

const SCORE_KEYS: Array<{ key: "momentum" | "flow" | "value" | "vol"; label: string; color: string }> = [
  { key: "momentum", label: "추세",     color: "bg-brand-500" },
  { key: "flow",     label: "거래활성도",   color: "bg-blue-500" },
  { key: "value",    label: "밸류",       color: "bg-emerald-500" },
  { key: "vol",      label: "위험조정", color: "bg-purple-500" },
];

const FUND_ROWS: Array<{ key: "per" | "pbr" | "roe" | "dividendYield"; label: string; suffix: string; better: "low" | "high" }> = [
  { key: "per",           label: "PER",   suffix: "배",  better: "low" },
  { key: "pbr",           label: "PBR",   suffix: "배",  better: "low" },
  { key: "roe",           label: "ROE",   suffix: "%",   better: "high" },
  { key: "dividendYield", label: "배당", suffix: "%",   better: "high" },
];

const COMPARE_EMPTY_PREVIEW = [
  "종합 점수 차이",
  "추세/밸류/위험조정 강점 비교",
  "PER/PBR/ROE 차이",
  "수익률과 테마 차이",
  "최근 공시 신호·데이터 점검 포인트",
];

// 모바일에서 가로 스크롤 wrapper. 데스크톱에선 그냥 grid.
function ScrollX({
  count,
  cardWidthPx = 200,
  gap = 12,
  children,
  className = "",
}: {
  count: number;
  cardWidthPx?: number;
  gap?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const minWidth = count * cardWidthPx + (count - 1) * gap;
  return (
    <div className={`-mx-3 md:mx-0 px-3 md:px-0 overflow-x-auto md:overflow-visible ${className}`}>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${count}, minmax(${cardWidthPx}px, 1fr))`,
          gap: `${gap}px`,
          minWidth: count > 2 ? `${minWidth}px` : "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function CompareClient({
  stockMap,
  top5 = [],
  recommendedSets = [],
  exampleSets = [],
  disclosureByTicker = {},
  initialTickers = [],
}: {
  stockMap: Record<string, CompareStock>;
  top5?: Array<{ ticker: string; name: string }>;
  recommendedSets?: RecommendedSet[];
  exampleSets?: RecommendedSet[];
  disclosureByTicker?: Record<string, CompareDisclosure[]>;
  initialTickers?: string[];
}) {
  const [tickers, setTickers] = useState<string[]>(() =>
    initialTickers.filter((ticker) => Boolean(stockMap[ticker])).slice(0, COMPARE_MAX)
  );
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

    function reload(fallback = initialTickers) {
      getCompareList().then((list) => {
        if (!active) return;
        setTickers(list.length > 0 ? list : fallback.filter((ticker) => Boolean(stockMap[ticker])).slice(0, COMPARE_MAX));
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

    reload();
    loadRecent();

    // 관심 종목에서 추가 — 마운트 시 1회 로드(이름은 stockMap으로 매핑, 풀에 없으면 제외)
    getWatchlist().then((items) => {
      if (!active) return;
      const mapped = items
        .map((it) => ({ ticker: it.ticker, name: stockMap[it.ticker]?.name }))
        .filter((x): x is { ticker: string; name: string } => Boolean(x.name));
      setWatchlist(mapped);
    });

    // 공유 링크(?stocks=005930,000660)에서 비교 바스켓 시드.
    // addToCompare는 현재 로컬 바스켓을 읽고 쓰므로 병렬 호출하면 마지막 쓰기만 남을 수 있다.
    // 추천 세트 추가와 같이 순차 호출해 2~4개 시드가 안정적으로 채워지게 한다.
    try {
      const shared = new URLSearchParams(window.location.search).get("stocks");
      if (shared) {
        const codes = initialTickers.filter((ticker) => Boolean(stockMap[ticker])).slice(0, COMPARE_MAX);
        if (codes.length) {
          (async () => {
            for (const code of codes) {
              await addToCompare(code);
            }
            if (active) reload(codes);
          })().catch(() => {
            if (active) reload();
          });
        }
      }
    } catch {
      /* noop */
    }

    function onUpdate() {
      reload();
    }
    // 최근 본 종목이 바뀌거나(다른 탭/상세 방문) storage 이벤트가 오면 최근 목록도 갱신
    function onStorage() {
      reload();
      loadRecent();
    }
    window.addEventListener("compare-basket-changed", onUpdate);
    window.addEventListener("ornscore:compare-updated", onUpdate);
    window.addEventListener("valuemap:compare-updated", onUpdate);
    window.addEventListener("recent-views-changed", loadRecent);
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      window.removeEventListener("compare-basket-changed", onUpdate);
      window.removeEventListener("ornscore:compare-updated", onUpdate);
      window.removeEventListener("valuemap:compare-updated", onUpdate);
      window.removeEventListener("recent-views-changed", loadRecent);
      window.removeEventListener("storage", onStorage);
    };
  }, [initialTickers, stockMap]);

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
    await removeFromCompare(ticker);
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
    await addToCompare(target.ticker);
  }

  // 추천 세트 추가 — addToCompare가 매번 현재 목록을 읽으므로 순차 호출로 4개 상한을 지킨다.
  async function addSet(setTickers: string[]) {
    let hitMax = false;
    for (const t of setTickers) {
      const res = await addToCompare(t);
      if (!res.ok && res.reason === "max") {
        hitMax = true;
        break;
      }
    }
    if (hitMax) flashNotice(`최대 ${COMPARE_MAX}개까지 담을 수 있어 일부만 추가됐어요`);
  }

  async function clearAll() {
    if (!confirm("비교 목록을 모두 비울까요?")) return;
    setTickers([]);
    await clearCompare();
  }

  function shareLink() {
    const url = `${window.location.origin}/compare?stocks=${tickers.join(",")}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => alert("공유 링크가 복사됐어요"));
    } else {
      alert(url);
    }
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

  // 비교는 최소 2개부터 의미가 있으므로, 2개 미만이면 시작 화면을 보여준다.
  if (stocks.length < 2) {
    const selected = stocks[0]; // 0개 또는 1개
    return (
      <section className="py-2 md:py-4">
        <div className="max-w-2xl mx-auto text-center mb-5">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
            <BarChart3 className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <h2 className="text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">비교할 종목을 선택하세요</h2>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            <strong className="text-zinc-700 dark:text-zinc-300">최소 2개 · 최대 4개</strong>를 고르면 종합 점수 · PER/PBR/ROE · 수익률 · 위험을 나란히 비교합니다.
          </p>
          {/* 로컬 저장/로그인 경계(§10.1) — 비교는 로그인 없이 이 기기에서 그대로 되고, 로그인은 기록을 넓혀준다(기능 잠금 아님) */}
          <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-snug break-keep">
            비교 목록은 로그인 없이 이 기기에 저장돼요. 로그인하면 여러 기기에서 이어봅니다.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-5">
          {feedbackRegion ? <div>{feedbackRegion}</div> : null}

          {/* 1) 직접 검색하기 — 빈 상태의 첫 행동(유일하게 강조한 박스) */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20 p-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-1">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">종목명 또는 코드 검색</div>
              {countIndicator}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">검색 결과에서 최대 {COMPARE_MAX}개까지 담아 비교할 수 있어요.</p>
            <StockSearchBox stocks={Object.entries(stockMap).map(([ticker, st]) => ({ ticker, name: st.name }))} onPick={(t) => { void tryAdd(t); }} placeholder="예: 삼성전자, 005930" />
          </div>

          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">비교하면 이런 걸 볼 수 있어요</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {COMPARE_EMPTY_PREVIEW.map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300 leading-snug">
                  <CheckCircle2 className="mt-0.5 w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={1.8} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500 leading-snug">
              2개 이상 담으면 종목별 최근 공시 신호와 데이터 점검 포인트도 함께 정리해 드려요 — 방향·규모는 원문 확인이 필요합니다.
            </p>
          </div>

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
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">클릭 한 번이면 같은 업종 2~4개 종목이 채워져요. 무엇을 나란히 보는지 바로 확인해요.</p>
                </div>
                {countIndicator}
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
          <div className="pt-1 flex flex-col sm:flex-row gap-2">
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
      {/* Header bar */}
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>비교 중인 종목 <strong className="text-zinc-900 dark:text-zinc-100">{stocks.length}</strong>개</span>
        <div className="flex items-center gap-3">
          <button onClick={shareLink} className="text-blue-600 dark:text-blue-400 hover:underline">공유 링크 복사</button>
          <button onClick={clearAll} className="text-zinc-500 dark:text-zinc-400 hover:text-red-600 transition">모두 비우기</button>
        </div>
      </div>

      {/* 먼저 무엇을 비교하는지 — 표 이전에 이 묶음의 성격(업종·밸류 폭·공시·점검)을 한 줄로 프레이밍(비자문) */}
      <section className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20 p-3 md:p-3.5">
        <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 mb-1 uppercase tracking-wide">먼저 무엇을 비교하는지</div>
        <p className="text-xs md:text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed break-keep">
          {sameSector
            ? <>같은 업종(<strong>{compareSectors[0]}</strong>) {stocks.length}종을 같은 잣대로 나란히 점검해요.</>
            : <>업종이 다른 {stocks.length}종이에요 — PER·PBR 같은 밸류 지표는 업종 차이를 감안해 보세요.</>}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
            업종 {sameSector ? compareSectors[0] : `${compareSectors.length}종 혼합`}
          </span>
          {perRange ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 tabular-nums">
              PER {perRange.min.toFixed(1)}~{perRange.max.toFixed(1)}배
            </span>
          ) : null}
          {withDisclosures > 0 ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
              최근 공시 신호 {withDisclosures}종
            </span>
          ) : null}
          {flaggedCount > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-3 h-3" strokeWidth={2} /> 데이터 점검 권장 {flaggedCount}종
            </span>
          ) : null}
        </div>
      </section>

      {/* 바스켓 관리 — 결과 화면에서도 종목을 더 담거나 잘못 담은 종목을 되돌릴 수 있게 */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-3 md:p-3.5 space-y-2.5">
        {canAddMore ? (
          <>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              <strong className="text-zinc-800 dark:text-zinc-200">{stocks.length}개 담음</strong> · {COMPARE_MAX - stocks.length}개 더 담을 수 있어요
            </div>
            <div className="max-w-sm">
              <StockSearchBox
                stocks={Object.entries(stockMap).map(([ticker, st]) => ({ ticker, name: st.name }))}
                onPick={(t) => { void tryAdd(t); }}
                placeholder="종목 추가 — 예: 삼성전자, 005930"
              />
            </div>
            {quickAdd.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {quickAdd.map((q) => (
                  <button
                    key={q.ticker}
                    type="button"
                    onClick={() => { void tryAdd(q.ticker); }}
                    className="text-xs px-3 py-1.5 min-h-[44px] rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition"
                  >
                    + {q.name}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            최대 {COMPARE_MAX}개까지 담았어요 · 하나를 빼면 다른 종목을 담을 수 있어요
          </div>
        )}
        {feedbackRegion}
      </section>

      {stocks.length > 2 ? (
        <p className="md:hidden text-[11px] text-zinc-400 dark:text-zinc-500 -mt-2">← 가로로 스크롤하세요 →</p>
      ) : null}

      {/* 기본 정보 카드 */}
      <ScrollX count={stocks.length} cardWidthPx={200}>
        {stocks.map((s) => {
          const isUp = s.changePct > 0;
          const isDown = s.changePct < 0;
          const priceColor = isUp ? "text-red-600" : isDown ? "text-blue-600" : "text-zinc-500";
          return (
            <div key={s.ticker} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 md:p-4 shadow-soft relative">
              <button
                onClick={() => remove(s.ticker)}
                aria-label="비교에서 제거"
                className={`absolute top-1.5 right-1.5 p-1.5 rounded-md text-zinc-400 dark:text-zinc-500 hover:bg-red-50 hover:text-red-600 transition ${FOCUS_RING}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <Link href={`/stock/${s.ticker}`} className="block pr-6">
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mb-0.5">{s.ticker}</div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2 truncate">{s.name}</div>
                <div className="text-base md:text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{fmtWon(s.currentPrice)}</div>
                <div className={`text-xs font-medium tabular-nums ${priceColor}`}>
                  <span aria-hidden="true">{isUp ? "▲" : isDown ? "▼" : "—"} </span>
                  <span className="sr-only">{isUp ? "상승" : isDown ? "하락" : "보합"} </span>
                  {Math.abs(s.changePct).toFixed(2)}%
                </div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">시총 {fmtMarketCap(s.marketCap)}</div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{sectorOf(s.themes, s.ticker)}</div>
              </Link>
            </div>
          );
        })}
      </ScrollX>
      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 -mt-1 break-keep">각 카드의 업종은 오른스코어 내부 분류 기준이며 공식 KRX 업종과 다를 수 있습니다.</p>

      {/* 최근 공시 신호 · 데이터 점검 — 종목별 컨텍스트(표시 전용). 방향·규모는 원문 확인 필요, 매수·매도 판단 아님 */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 md:p-5 shadow-soft">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">최근 공시 신호 · 데이터 점검</h3>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-3 md:mb-4 break-keep">최근 14일 공시에서 추출한 신호와 이상값 점검이에요. 방향·규모·사유는 원문 확인이 필요하며, 매수·매도 판단이 아닙니다.</p>
        <ScrollX count={stocks.length} cardWidthPx={200}>
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
        </ScrollX>
      </section>

      {/* 자체 지표 비교 */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 md:p-5 shadow-soft">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">자체 지표 4종</h3>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-3 md:mb-4 break-keep">오른스코어의 실험 단계 탐색 우선순위 점수를 나란히 놓고 본 것이며, 매수·매도 추천이 아닙니다.</p>
        <div className="space-y-3">
          {SCORE_KEYS.map(({ key, label, color }) => {
            const max = Math.max(...stocks.map((s) => s[key]));
            return (
              <div key={key}>
                <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">{label}</div>
                <ScrollX count={stocks.length} cardWidthPx={120} gap={8}>
                  {stocks.map((s) => {
                    const v = s[key];
                    const pct = Math.max(0, Math.min(100, v));
                    const isMax = v === max && stocks.length > 1;
                    return (
                      <div key={s.ticker}>
                        <span className="sr-only">{s.name} {label} {Math.round(v)}점{isMax ? " · 가장 높음" : ""}</span>
                        <div className="flex items-baseline justify-between mb-0.5" aria-hidden="true">
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{s.name}</span>
                          <span className={`text-xs font-bold tabular-nums ${isMax ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300"}`}>{Math.round(v)}</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden" aria-hidden="true">
                          <div className={`h-full ${color} ${isMax ? "" : "opacity-70"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </ScrollX>
              </div>
            );
          })}
        </div>
      </section>

      {/* 재무 비교 표 — 가로 스크롤 */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 md:p-5 shadow-soft">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 md:mb-4">재무</h3>
        <div className="-mx-3 md:mx-0 px-3 md:px-0 overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: stocks.length > 2 ? `${100 + stocks.length * 80}px` : "auto" }}>
            <caption className="sr-only">비교 중인 종목별 재무 지표(PER·PBR·ROE·배당) 표</caption>
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th scope="col" className="text-left text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase pb-2 sticky left-0 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800">항목</th>
                {stocks.map((s) => (
                  <th key={s.ticker} scope="col" className="text-right text-[11px] font-medium text-zinc-500 dark:text-zinc-400 pb-2 px-2 whitespace-nowrap">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FUND_ROWS.map(({ key, label, suffix, better }) => {
                const vals = stocks.map((s) => s[key]);
                const best = better === "low" ? Math.min(...vals.filter((v) => v > 0)) : Math.max(...vals);
                return (
                  <tr key={key} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                    <th scope="row" className="py-2.5 text-left font-normal text-zinc-600 dark:text-zinc-400 sticky left-0 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800">{label}</th>
                    {stocks.map((s) => {
                      const v = s[key];
                      const isBest = v === best && stocks.length > 1;
                      return (
                        <td key={s.ticker} className={`py-2.5 px-2 text-right tabular-nums whitespace-nowrap ${isBest ? "text-emerald-700 dark:text-emerald-400 font-semibold" : "text-zinc-700 dark:text-zinc-300"}`}>
                          {v > 0 ? v.toFixed(2) : "-"}<span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-0.5">{suffix}</span>
                          {isBest ? <span className="sr-only"> · 가장 좋은 값</span> : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-3">* PER/PBR은 낮을수록, ROE/배당은 높을수록 좋음 — 가장 좋은 값을 <span className="text-emerald-700 dark:text-emerald-400 font-semibold">초록</span>으로 표시.</p>
      </section>

      {/* 수익률 비교 */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 md:p-5 shadow-soft">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 md:mb-4">수익률 <span className="text-[10px] font-normal text-zinc-400">(높을수록 강세)</span></h3>
        <div className="-mx-3 md:mx-0 px-3 md:px-0 overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: stocks.length > 2 ? `${100 + stocks.length * 80}px` : "auto" }}>
            <caption className="sr-only">비교 중인 종목별 기간(1·3·6개월) 수익률 표</caption>
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th scope="col" className="text-left text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase pb-2 sticky left-0 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800">기간</th>
                {stocks.map((s) => (
                  <th key={s.ticker} scope="col" className="text-right text-[11px] font-medium text-zinc-500 dark:text-zinc-400 pb-2 px-2 whitespace-nowrap">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {([["r1m", "1개월"], ["r3m", "3개월"], ["r6m", "6개월"]] as const).map(([k, label]) => {
                const nums = stocks.map((s) => s.returns?.[k]).filter((v): v is number => typeof v === "number");
                const best = nums.length > 0 ? Math.max(...nums) : undefined;
                return (
                  <tr key={k} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                    <th scope="row" className="py-2.5 text-left font-normal text-zinc-600 dark:text-zinc-400 sticky left-0 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800">{label}</th>
                    {stocks.map((s) => {
                      const v = s.returns?.[k];
                      const has = typeof v === "number";
                      const isBest = has && v === best && stocks.length > 1;
                      return (
                        <td key={s.ticker} className={"py-2.5 px-2 text-right tabular-nums whitespace-nowrap " + (isBest ? "font-semibold " : "") + (has ? (v >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400") : "text-zinc-400")}>
                          {has ? (v >= 0 ? "+" : "") + v.toFixed(0) + "%" : "—"}
                          {isBest ? <span className="sr-only"> · 가장 높음</span> : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 테마 비교 */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 md:p-5 shadow-soft">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 md:mb-4">테마</h3>
        <ScrollX count={stocks.length} cardWidthPx={140}>
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
        </ScrollX>
      </section>
    </div>
  );
}
