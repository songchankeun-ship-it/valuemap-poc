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
import { fmtMarketCap, fmtWon } from "@/lib/format";
import { StockSearchBox } from "@/components/StockSearchBox";
import { FOCUS_RING } from "@/components/ui/controlStyles";
import { BarChart3, CheckCircle2 } from "lucide-react";

interface RecommendedSet {
  label: string;
  tickers: string[];
  names: string[];
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

export function CompareClient({ stockMap, top5 = [], recommendedSets = [], exampleSets = [] }: { stockMap: Record<string, CompareStock>; top5?: Array<{ ticker: string; name: string }>; recommendedSets?: RecommendedSet[]; exampleSets?: RecommendedSet[] }) {
  const [tickers, setTickers] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
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

    function reload() {
      getCompareList().then((list) => {
        if (active) setTickers(list);
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

    setMounted(true);
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
        const codes = shared.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 4);
        if (codes.length) {
          (async () => {
            for (const code of codes) {
              await addToCompare(code);
            }
            if (active) reload();
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
  }, []);

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

  if (!mounted) return null;

  const stocks = tickers
    .map((t) => stockMap[t])
    .filter((s): s is CompareStock => Boolean(s));

  // 빠른 추가 후보 — 이미 담은 종목은 제외. 두 화면(빈 상태·결과)에서 공용으로 쓴다.
  const watchlistAddable = watchlist.filter((w) => !tickers.includes(w.ticker));
  // 최근 본 종목 — 이미 담은 종목은 제외. 실제 방문 기록이 1개 이상일 때만 노출(빈/가짜 칩 없음)
  const recentAddable = recentViews.filter((r) => !tickers.includes(r.ticker));
  const top5Addable = top5.filter((s) => !tickers.includes(s.ticker));

  // 원클릭 관심 종목 비교 — 관심 3종목이 있으면 우선 진입점으로 제공.
  // "오늘 후보 3개 비교"는 아래 예시 세트 버튼으로 옮겨(버튼 중복 방지) 여기서는 다루지 않는다.
  // 이미 담은 종목을 뺀 담을 수 있는 수가 2개 미만이면(눌러도 비교 불가) 버튼을 숨긴다.
  const quickCompareWatchlist = watchlist.slice(0, 3).map((w) => w.ticker).filter((t) => !tickers.includes(t));
  const quickCompare =
    watchlist.length >= 3 && quickCompareWatchlist.length >= 2
      ? { tickers: quickCompareWatchlist, label: "내 관심 3종목 비교하기" }
      : null;

  // 예시 "오늘 후보 3개 비교" — 오늘 Top 후보 상위 3종. 담을 수 있는 종목이 2개 이상일 때만 노출한다.
  const exampleTodayTickers = top5.slice(0, 3).map((s) => s.ticker);
  const showExampleToday = exampleTodayTickers.filter((t) => !tickers.includes(t)).length >= 2;

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
              최근 공시 신호는 관심 종목과 공시 화면에서 이어서 확인할 수 있어요.
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

          {/* 예시로 바로 비교 체험 — 클릭 한 번으로 2~4종목이 채워지는 예시 세트 + 관심 원클릭(비자문) */}
          {exampleSets.length > 0 || showExampleToday || quickCompare ? (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">예시로 바로 비교를 체험해 보세요</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">클릭 한 번이면 2~4개 종목이 채워져요. 무엇을 나란히 보는지 바로 확인해요.</p>
                </div>
                {countIndicator}
              </div>
              {exampleSets.length > 0 || showExampleToday ? (
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
                  {showExampleToday ? (
                    <button
                      type="button"
                      onClick={() => { void addSet(exampleTodayTickers); }}
                      className={`flex items-center justify-between gap-2 w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition ${FOCUS_RING}`}
                    >
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">오늘 후보 3개 비교</span>
                      <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500 shrink-0">{Math.min(3, exampleTodayTickers.length)}종목 →</span>
                    </button>
                  ) : null}
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

          {/* 3) 빠른 추가 — 최근 본 / 오늘 Top 5 / 관심 종목을 가벼운 그룹 섹션으로(카드 중첩 제거) */}
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

            {/* 오늘 Top 5 */}
            {top5.length > 0 ? (
              <div>
                <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">오늘 Top 5</div>
                <div className="flex flex-wrap gap-1.5">
                  {top5.map((s) => (
                    <button
                      key={s.ticker}
                      type="button"
                      onClick={() => { void tryAdd(s.ticker); }}
                      disabled={tickers.includes(s.ticker)}
                      className={`text-xs px-3 py-1.5 min-h-[44px] rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-zinc-200 ${FOCUS_RING}`}
                    >
                      {tickers.includes(s.ticker) ? "✓ " : "+ "}{s.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

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
                  {isUp ? "▲" : isDown ? "▼" : "—"} {Math.abs(s.changePct).toFixed(2)}%
                </div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">시총 {fmtMarketCap(s.marketCap)}</div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{sectorOf(s.themes)}</div>
              </Link>
            </div>
          );
        })}
      </ScrollX>
      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 -mt-1 break-keep">각 카드의 업종은 오른스코어 내부 분류 기준이며 공식 KRX 업종과 다를 수 있습니다.</p>

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
                        <div className="flex items-baseline justify-between mb-0.5">
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{s.name}</span>
                          <span className={`text-xs font-bold tabular-nums ${isMax ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300"}`}>{Math.round(v)}</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
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
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase pb-2 sticky left-0 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800">항목</th>
                {stocks.map((s) => (
                  <th key={s.ticker} className="text-right text-[11px] font-medium text-zinc-500 dark:text-zinc-400 pb-2 px-2 whitespace-nowrap">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FUND_ROWS.map(({ key, label, suffix, better }) => {
                const vals = stocks.map((s) => s[key]);
                const best = better === "low" ? Math.min(...vals.filter((v) => v > 0)) : Math.max(...vals);
                return (
                  <tr key={key} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                    <td className="py-2.5 text-zinc-600 dark:text-zinc-400 sticky left-0 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800">{label}</td>
                    {stocks.map((s) => {
                      const v = s[key];
                      const isBest = v === best && stocks.length > 1;
                      return (
                        <td key={s.ticker} className={`py-2.5 px-2 text-right tabular-nums whitespace-nowrap ${isBest ? "text-emerald-700 dark:text-emerald-400 font-semibold" : "text-zinc-700 dark:text-zinc-300"}`}>
                          {v > 0 ? v.toFixed(2) : "-"}<span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-0.5">{suffix}</span>
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
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase pb-2 sticky left-0 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800">기간</th>
                {stocks.map((s) => (
                  <th key={s.ticker} className="text-right text-[11px] font-medium text-zinc-500 dark:text-zinc-400 pb-2 px-2 whitespace-nowrap">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {([["r1m", "1개월"], ["r3m", "3개월"], ["r6m", "6개월"]] as const).map(([k, label]) => {
                const nums = stocks.map((s) => s.returns?.[k]).filter((v): v is number => typeof v === "number");
                const best = nums.length > 0 ? Math.max(...nums) : undefined;
                return (
                  <tr key={k} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                    <td className="py-2.5 text-zinc-600 dark:text-zinc-400 sticky left-0 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800">{label}</td>
                    {stocks.map((s) => {
                      const v = s.returns?.[k];
                      const has = typeof v === "number";
                      const isBest = has && v === best && stocks.length > 1;
                      return (
                        <td key={s.ticker} className={"py-2.5 px-2 text-right tabular-nums whitespace-nowrap " + (isBest ? "font-semibold " : "") + (has ? (v >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400") : "text-zinc-400")}>
                          {has ? (v >= 0 ? "+" : "") + v.toFixed(0) + "%" : "—"}
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
