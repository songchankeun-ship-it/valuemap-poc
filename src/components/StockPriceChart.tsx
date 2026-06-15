"use client";

import { useMemo, useState } from "react";
import type { PricePoint } from "@/lib/priceHistory";

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

  // 범위에 따라 점 필터
  const filtered = useMemo(() => {
    if (points.length === 0) return [];
    const days = RANGE_DAYS[range];
    // 마지막 N영업일 (영업일 ≈ 0.69 × 달력일이지만 일단 단순히)
    const lastBusinessDays = Math.round(days * 0.69);
    return points.slice(-Math.min(lastBusinessDays, points.length));
  }, [points, range]);

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
        </div>
      ) : (
        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-1">
          (마우스를 올리거나 차트를 길게 터치하면 날짜·가격 표시)
        </div>
      )}

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
        출처: FinanceDataReader · 종가 기준 일별 데이터
      </p>
    </div>
  );
}
