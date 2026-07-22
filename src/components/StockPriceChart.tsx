"use client";

import { useMemo, useState } from "react";
import type { PricePoint } from "@/lib/priceHistory";
import {
  VOLUME_SPIKE_BASELINE,
  VOLUME_SPIKE_MULTIPLE,
  SURGE_3M_THRESHOLD_PCT,
  TRADING_DAYS_3M,
} from "@/lib/priceSummary";

type RangeKey = "1W" | "1M" | "3M" | "6M" | "1Y";

const RANGE_DAYS: Record<RangeKey, number> = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
};

const RANGE_LABEL: Record<RangeKey, string> = {
  "1W": "1주",
  "1M": "1개월",
  "3M": "3개월",
  "6M": "6개월",
  "1Y": "1년",
};

interface Props {
  ticker: string;
  name: string;
  points: PricePoint[];
}

type MarkerKind = "flow" | "drawdown" | "surge";

interface ChartMarker {
  idx: number; // filtered 내 인덱스
  kind: MarkerKind;
  label: string;
  detail: string;
  tone: string;
}

/** 시작~끝 인덱스로 표시 구간을 음영으로 강조하는 밴드(점 마커와 별도 레이어). */
interface ChartRegion {
  fromIdx: number;
  toIdx: number;
  kind: MarkerKind;
  label: string;
  detail: string;
  tone: string;
}

interface ChartOverlay {
  markers: ChartMarker[];
  regions: ChartRegion[];
}

const MARKER_META: Record<MarkerKind, { label: string; tone: string }> = {
  flow: { label: "거래량 급증", tone: "#f59e0b" },
  drawdown: { label: "고점 대비 낙폭 구간", tone: "#8b5cf6" },
  surge: { label: "3개월 급등(확인 유도)", tone: "#e11d48" },
};

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * 가격 시계열에서 파생 가능한 주요 지점·구간만 표시(비침습 오버레이 레이어).
 * - 새 데이터 수집·API 호출 없이 이미 받은 종가/거래량 배열에서만 계산 → 성능·요약 우선 흐름 유지.
 * - 점 마커: 거래량 급증(직전 20거래일 중앙값 대비 배수, 강도 상위 3개) · 낙폭 저점(1개).
 * - 구간 밴드: 고점→저점 낙폭 구간(음영) · 최근 약 3개월 급등 구간(임계 이상, 표시 범위에 3개월 이상 이력이 있을 때만).
 * - 임계·정의는 텍스트 요약(priceSummary.computeChartEvents)과 동일 상수를 공유해 차트와 텍스트가 어긋나지 않게 한다.
 * - 점수 변화·DART 공시 마커는 후속(별도 데이터 정합 필요) — 아직 차트에 데이터가 연결돼 있지 않아 지어내지 않는다(문서화됨).
 */
function computeMarkers(filtered: PricePoint[]): ChartOverlay {
  const markers: ChartMarker[] = [];
  const regions: ChartRegion[] = [];
  const n = filtered.length;
  if (n < 5) return { markers, regions };

  // (1) 거래량 급증 — 직전 VOLUME_SPIKE_BASELINE(20)거래일 중앙값 대비 VOLUME_SPIKE_MULTIPLE(3)배 이상
  const win = Math.min(VOLUME_SPIKE_BASELINE, n - 1);
  const flowCand: { idx: number; ratio: number }[] = [];
  for (let i = win; i < n; i++) {
    const base = median(
      filtered.slice(i - win, i).map((p) => p.v).filter((v) => Number.isFinite(v) && v > 0),
    );
    const v = filtered[i].v;
    if (base > 0 && Number.isFinite(v)) {
      const ratio = v / base;
      if (ratio >= VOLUME_SPIKE_MULTIPLE) flowCand.push({ idx: i, ratio });
    }
  }
  flowCand.sort((a, b) => b.ratio - a.ratio);
  for (const c of flowCand.slice(0, 3)) {
    markers.push({
      idx: c.idx,
      kind: "flow",
      label: MARKER_META.flow.label,
      detail: `거래량 급증 · 직전 ${win}거래일 중앙값의 ${c.ratio.toFixed(1)}배`,
      tone: MARKER_META.flow.tone,
    });
  }

  // (2) 고점 대비 최대 낙폭 — 고점→저점 구간 음영 + 저점 마커(−10% 이상일 때만)
  let peak = filtered[0].c;
  let peakIdx = 0;
  let worst = 0;
  let worstIdx = -1;
  let worstPeakIdx = 0;
  for (let i = 1; i < n; i++) {
    if (filtered[i].c > peak) {
      peak = filtered[i].c;
      peakIdx = i;
    }
    const dd = peak > 0 ? (filtered[i].c - peak) / peak : 0;
    if (dd < worst) {
      worst = dd;
      worstIdx = i;
      worstPeakIdx = peakIdx;
    }
  }
  if (worstIdx >= 0 && worst <= -0.1) {
    if (worstPeakIdx < worstIdx) {
      regions.push({
        fromIdx: worstPeakIdx,
        toIdx: worstIdx,
        kind: "drawdown",
        label: MARKER_META.drawdown.label,
        detail: `${filtered[worstPeakIdx].d} 고점 → ${filtered[worstIdx].d} 저점 · ${(worst * 100).toFixed(1)}% 하락 구간`,
        tone: MARKER_META.drawdown.tone,
      });
    }
    markers.push({
      idx: worstIdx,
      kind: "drawdown",
      label: MARKER_META.drawdown.label,
      detail: `기간 고점 대비 ${(worst * 100).toFixed(1)}% 낮은 지점`,
      tone: MARKER_META.drawdown.tone,
    });
  }

  // (3) 최근 약 3개월(63거래일) 급등 구간 — 표시 범위에 3개월 이상 이력이 있고 등락률 ≥ 임계일 때만.
  //     낙폭 구간과 달리 우측(최근) 구간을 밴드로 표시. 3개월 미만 표시 범위(예: 1주·1개월·3개월 토글)에서는
  //     baseline 산정 불가 → 자동으로 표시되지 않음(6개월·1년 토글에서 최근 3개월 구간만 강조).
  if (n - 1 >= TRADING_DAYS_3M) {
    const fromIdx = n - 1 - TRADING_DAYS_3M;
    const base = filtered[fromIdx].c;
    if (base > 0) {
      const pct = ((filtered[n - 1].c - base) / base) * 100;
      if (pct >= SURGE_3M_THRESHOLD_PCT) {
        regions.push({
          fromIdx,
          toIdx: n - 1,
          kind: "surge",
          label: MARKER_META.surge.label,
          detail: `최근 약 3개월 +${pct.toFixed(1)}% — 변동성 확대·급등 사유 원본 확인`,
          tone: MARKER_META.surge.tone,
        });
      }
    }
  }

  return { markers, regions };
}

/**
 * 가격 시계열 차트 (SVG).
 * - 1주/1개월/3개월/6개월/1년 토글
 * - 종가 라인 + 거래량 막대
 * - 다크모드 대응
 * - 마우스/터치 호버 시 가격/날짜 표시
 */
export function StockPriceChart({ ticker, name, points }: Props) {
  const [range, setRange] = useState<RangeKey>("3M");
  const [hover, setHover] = useState<number | null>(null);
  const [showMarkers, setShowMarkers] = useState(true);

  // 범위에 따라 점 필터
  const filtered = useMemo(() => {
    if (points.length === 0) return [];
    const days = RANGE_DAYS[range];
    // 마지막 N영업일 (영업일 ≈ 0.69 × 달력일이지만 일단 단순히)
    const lastBusinessDays = Math.round(days * 0.69);
    return points.slice(-Math.min(lastBusinessDays, points.length));
  }, [points, range]);

  // 표시 범위에서 파생한 주요 지점·구간(거래량 급증·낙폭 구간·3개월 급등). 데이터/API 추가 없음.
  const { markers, regions } = useMemo(() => computeMarkers(filtered), [filtered]);
  const hasOverlay = markers.length > 0 || regions.length > 0;
  const markerByIdx = useMemo(() => {
    const m = new Map<number, ChartMarker>();
    for (const mk of markers) m.set(mk.idx, mk);
    return m;
  }, [markers]);
  const legendKinds = useMemo(() => {
    const kinds = new Set<MarkerKind>();
    for (const mk of markers) kinds.add(mk.kind);
    for (const rg of regions) kinds.add(rg.kind);
    return [...kinds];
  }, [markers, regions]);

  if (filtered.length < 2) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 text-sm text-zinc-500 dark:text-zinc-400 text-center">
        차트 데이터가 부족합니다.
      </div>
    );
  }

  const closes = filtered.map((p) => p.c);
  const vols = filtered.map((p) => p.v);
  const minC = Math.min(...closes);
  const maxC = Math.max(...closes);
  const maxV = Math.max(...vols, 1);

  const first = closes[0];
  const last = closes[closes.length - 1];
  const change = last - first;
  const changePct = (change / first) * 100;
  const trendUp = change > 0;
  const trendDown = change < 0;

  // viewBox 사이즈
  const W = 800;
  const H_PRICE = 220;
  const H_VOLUME = 60;
  const H_GAP = 6;
  const H_TOTAL = H_PRICE + H_GAP + H_VOLUME;

  const stepX = W / Math.max(filtered.length - 1, 1);
  const priceRange = maxC - minC || 1;

  // 가격 라인 좌표
  const priceCoords = filtered.map((p, i) => {
    const x = i * stepX;
    const y = H_PRICE - ((p.c - minC) / priceRange) * H_PRICE;
    return { x, y, p };
  });
  const pricePath = priceCoords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${pricePath} L${(filtered.length - 1) * stepX},${H_PRICE} L0,${H_PRICE} Z`;

  // 색깔 (한국 관습 — 상승 빨강, 하락 파랑)
  const lineColor = trendUp ? "#ef4444" : trendDown ? "#3b82f6" : "#71717a";
  const fillColor = trendUp ? "rgba(239,68,68,0.08)" : trendDown ? "rgba(59,130,246,0.08)" : "rgba(113,113,122,0.08)";

  // 호버
  const hoverPoint = hover !== null ? priceCoords[hover] : null;
  const hoverP = hoverPoint?.p;
  const hoverRegion =
    hover !== null && showMarkers
      ? regions.find((r) => hover >= r.fromIdx && hover <= r.toIdx) ?? null
      : null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
      {/* 헤더 */}
      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
        <div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            주가 차트
          </div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 tabular-nums">
            {filtered[0].d} ~ {filtered[filtered.length - 1].d} · {filtered.length}거래일
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-xl md:text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
            {(hoverP?.c ?? last).toLocaleString()}
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400 ml-0.5">원</span>
          </div>
          <div
            className={
              "text-sm font-semibold tabular-nums " +
              (trendUp
                ? "text-red-600 dark:text-red-400"
                : trendDown
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 dark:text-zinc-400")
            }
          >
            {trendUp ? "▲" : trendDown ? "▼" : "—"} {Math.abs(change).toLocaleString()} ({changePct.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* 호버 정보 */}
      {hoverP ? (
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums mb-1">
          {hoverP.d} · 거래량 {hoverP.v.toLocaleString()}
          {hover !== null && showMarkers && markerByIdx.has(hover) ? (
            <span
              className="ml-1 font-medium"
              style={{ color: markerByIdx.get(hover)!.tone }}
            >
              · {markerByIdx.get(hover)!.detail}
            </span>
          ) : null}
          {hoverRegion ? (
            <span className="ml-1 font-medium" style={{ color: hoverRegion.tone }}>
              · {hoverRegion.detail}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-1">
          (마우스를 올리거나 차트를 길게 터치하면 날짜·가격 표시)
        </div>
      )}

      {/* 주요 지점·구간 범례 + 토글 (해당 오버레이가 있을 때만) */}
      {hasOverlay ? (
        <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap text-[10px] text-zinc-500 dark:text-zinc-400 mb-1.5">
          <span className="text-zinc-400 dark:text-zinc-500">주요 지점·구간</span>
          {showMarkers
            ? legendKinds.map((k) => (
                <span key={k} className="inline-flex items-center gap-1">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: MARKER_META[k].tone }}
                    aria-hidden="true"
                  />
                  {MARKER_META[k].label}
                </span>
              ))
            : <span className="text-zinc-400 dark:text-zinc-500">숨김</span>}
          <button
            type="button"
            onClick={() => setShowMarkers((v) => !v)}
            className="ml-auto min-h-[24px] px-2 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            aria-pressed={showMarkers}
          >
            {showMarkers ? "지점 숨기기" : "지점 보기"}
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap text-[10px] text-zinc-500 dark:text-zinc-400 tabular-nums mb-1.5">
        <span>기간 고가 <strong className="text-zinc-700 dark:text-zinc-300">{maxC.toLocaleString()}</strong></span>
        <span>저가 <strong className="text-zinc-700 dark:text-zinc-300">{minC.toLocaleString()}</strong></span>
        <span className={changePct >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}>기간 수익률 {changePct >= 0 ? "+" : ""}{changePct.toFixed(1)}%</span>
      </div>

      {/* 차트 */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H_TOTAL}`}
          width="100%"
          preserveAspectRatio="none"
          className="cursor-crosshair touch-none"
          style={{ height: "280px" }}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * W;
            const idx = Math.max(0, Math.min(filtered.length - 1, Math.round(x / stepX)));
            setHover(idx);
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((touch.clientX - rect.left) / rect.width) * W;
            const idx = Math.max(0, Math.min(filtered.length - 1, Math.round(x / stepX)));
            setHover(idx);
          }}
          onTouchEnd={() => setHover(null)}
        >
          {/* 가격 영역 가로 가이드선 */}
          {[0.25, 0.5, 0.75].map((r) => (
            <line
              key={r}
              x1="0"
              y1={H_PRICE * r}
              x2={W}
              y2={H_PRICE * r}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeDasharray="2,3"
              className="text-zinc-400"
            />
          ))}

          {/* 가격 영역 채우기 */}
          <path d={areaPath} fill={fillColor} />

          {/* 주요 구간 밴드(낙폭 구간·3개월 급등) — 라인 뒤에 옅은 음영으로. 데이터 추가 없음 */}
          {showMarkers
            ? regions.map((rg) => {
                const x1 = rg.fromIdx * stepX;
                const x2 = rg.toIdx * stepX;
                const w = Math.max(x2 - x1, 0.5);
                const active =
                  hover !== null && hover >= rg.fromIdx && hover <= rg.toIdx;
                return (
                  <g key={`region-${rg.kind}-${rg.fromIdx}-${rg.toIdx}`}>
                    <rect
                      x={x1.toFixed(1)}
                      y={0}
                      width={w.toFixed(1)}
                      height={H_PRICE}
                      fill={rg.tone}
                      fillOpacity={active ? 0.16 : 0.09}
                    />
                    {[x1, x2].map((bx, bi) => (
                      <line
                        key={bi}
                        x1={bx}
                        y1={0}
                        x2={bx}
                        y2={H_PRICE}
                        stroke={rg.tone}
                        strokeOpacity={active ? 0.5 : 0.28}
                        strokeWidth="1"
                        strokeDasharray="2,3"
                      />
                    ))}
                  </g>
                );
              })
            : null}

          {/* 가격 라인 */}
          <path
            d={pricePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 거래량 막대 */}
          {filtered.map((p, i) => {
            const barH = (p.v / maxV) * H_VOLUME;
            const x = i * stepX - (stepX * 0.4);
            const y = H_PRICE + H_GAP + (H_VOLUME - barH);
            return (
              <rect
                key={i}
                x={x.toFixed(1)}
                y={y.toFixed(1)}
                width={Math.max(stepX * 0.8, 0.5).toFixed(1)}
                height={barH.toFixed(1)}
                fill="currentColor"
                className="text-zinc-300 dark:text-zinc-700"
                fillOpacity="0.6"
              />
            );
          })}

          {/* 주요 지점 마커 레이어 — 파생 지점(거래량 급증·낙폭)만, 데이터 추가 없음 */}
          {showMarkers
            ? markers.map((mk) => {
                const pc = priceCoords[mk.idx];
                if (!pc) return null;
                const active = hover === mk.idx;
                return (
                  <g key={`${mk.kind}-${mk.idx}`}>
                    <line
                      x1={pc.x}
                      y1={0}
                      x2={pc.x}
                      y2={H_PRICE}
                      stroke={mk.tone}
                      strokeOpacity={active ? 0.4 : 0.18}
                      strokeWidth="1"
                      strokeDasharray="2,3"
                    />
                    <circle
                      cx={pc.x}
                      cy={pc.y}
                      r={active ? 5 : 3.5}
                      fill={mk.tone}
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })
            : null}

          {/* 호버 세로선 */}
          {hoverPoint ? (
            <>
              <line
                x1={hoverPoint.x}
                y1="0"
                x2={hoverPoint.x}
                y2={H_TOTAL}
                stroke="currentColor"
                strokeOpacity="0.3"
                strokeDasharray="2,2"
                className="text-zinc-500"
              />
              <circle
                cx={hoverPoint.x}
                cy={hoverPoint.y}
                r="4"
                fill={lineColor}
                stroke="white"
                strokeWidth="1.5"
              />
            </>
          ) : null}

          {/* 마지막 포인트 강조 */}
          <circle
            cx={priceCoords[priceCoords.length - 1].x}
            cy={priceCoords[priceCoords.length - 1].y}
            r="3"
            fill={lineColor}
          />
        </svg>

        {/* y축 레이블 (좌측) */}
        <div className="absolute top-0 left-0 text-[9px] text-zinc-400 dark:text-zinc-500 tabular-nums pointer-events-none">
          {maxC.toLocaleString()}
        </div>
        <div
          className="absolute left-0 text-[9px] text-zinc-400 dark:text-zinc-500 tabular-nums pointer-events-none"
          style={{ top: `${(H_PRICE / H_TOTAL) * 100 - 2}%` }}
        >
          {minC.toLocaleString()}
        </div>
        <div
          className="absolute right-0 text-[9px] text-zinc-500 dark:text-zinc-400 pointer-events-none"
          style={{ top: `${((H_PRICE + H_GAP) / H_TOTAL) * 100}%` }}
        >
          거래량
        </div>
      </div>

      {/* 범위 토글 */}
      <div className="flex gap-1 mt-3 justify-center">
        {(Object.keys(RANGE_LABEL) as RangeKey[]).map((key) => {
          const active = range === key;
          return (
            <button
              key={key}
              onClick={() => {
                setRange(key);
                setHover(null);
              }}
              className={
                "min-w-[44px] min-h-[44px] px-3 py-2 rounded-md text-xs font-medium transition " +
                (active
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:bg-zinc-300 dark:active:bg-zinc-600")
              }
            >
              {RANGE_LABEL[key]}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center mt-2">
        출처: Naver Finance 전달 · FinanceDataReader 수집 · 종가 기준 일별 데이터 · 권리 검토 중
        {hasOverlay ? " · 주요 지점·구간은 가격·거래량에서 자동 표시한 참고용 위치(호재·악재 판단 아님)" : ""}
      </p>
    </div>
  );
}
