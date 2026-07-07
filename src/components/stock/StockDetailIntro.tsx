"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { stockDetailCopy, priceBasisLagCopy } from "@/lib/copy/stockDetail";

/**
 * 종목 상세 서버 페이지가 직접 그리던 한글 JSX 블록을 다국어로 옮긴 클라이언트 자식들.
 * 점수·순위·날짜 등 서버 계산값은 props로 받아 표시만 한다(계산/scoring 로직 무변경).
 */

// 빵부스러기 — 홈 › 종목 탐색 › {종목명}
export function StockBreadcrumb({ name }: { name: string }) {
  const { locale } = useLanguage();
  const t = stockDetailCopy[locale];
  return (
    <nav className="text-[11px] md:text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between gap-x-3 gap-y-1 flex-wrap">
      <span className="flex items-center gap-1 min-w-0">
        <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">{t.breadcrumbHome}</Link><span>›</span>
        <Link href="/stocks" className="hover:text-zinc-900 dark:hover:text-zinc-100">{t.breadcrumbStocks}</Link><span>›</span>
        <span className="text-zinc-900 dark:text-zinc-100 truncate">{name}</span>
      </span>
      <span className="flex items-center gap-3 shrink-0">
        <Link href="/today" className="inline-flex items-center min-h-[44px] hover:text-blue-700 dark:hover:text-blue-400 whitespace-nowrap">← {t.returnToday}</Link>
        <Link href="/watchlist" className="inline-flex items-center min-h-[44px] hover:text-blue-700 dark:hover:text-blue-400 whitespace-nowrap">{t.returnWatchlist}</Link>
      </span>
    </nav>
  );
}

// 탭 라벨 — 서버에서 id만 넘기고 라벨은 여기서 현지화.
export function useStockTabLabels() {
  const { locale } = useLanguage();
  return stockDetailCopy[locale].tabs;
}

// 자체 지표 4종 섹션 헤더(제목 + 풀 대비 + 지표 가이드 링크).
export function MetricsSectionHeader({ poolN }: { poolN: number }) {
  const { locale } = useLanguage();
  const t = stockDetailCopy[locale].metricsSection;
  return (
    <div className="mb-3">
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.title} <span className="text-[10px] font-normal text-zinc-400">{t.poolPrefix} {poolN} {t.poolSuffix}</span></div>
        <Link href="/guide/metrics" className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline shrink-0">{t.guideLink}</Link>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">{t.lead}</p>
    </div>
  );
}

// 지표 상세 접힘 래퍼 — 4지표 카드·위험 상세·업종 대비 밸류·같은 업종 비교를 기본 접힘으로 묶는다.
// 요약 탭 첫 화면은 초보자 해석(현재 해석)이 먼저 읽히게 하고, 상세는 '대표 신호 → 자세히 보기' 흐름으로 낮춘다.
// 표시/순서만 담당하며 점수·순위 계산은 서버에서 끝난 값(children)을 그대로 넘긴다.
export function MetricsDetailsSection({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  const t = stockDetailCopy[locale].metricsSection;
  return (
    <details className="group rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <summary className="flex min-h-[44px] cursor-pointer select-none items-center justify-between gap-3 rounded-lg px-3 py-3 md:px-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition list-none [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.detailsToggle}</span>
          <span className="mt-0.5 block text-[11px] font-normal leading-snug text-zinc-500 dark:text-zinc-400">{t.detailsHint}</span>
        </span>
      </summary>
      <div className="space-y-3 md:space-y-4 border-t border-zinc-200 dark:border-zinc-800 p-3 md:p-4">
        {children}
      </div>
    </details>
  );
}

// 위험 상세 카드 — 연환산 변동성·최대낙폭·최악의 하루(서버 계산값 props).
export function RiskDetailCard({
  days,
  annualStd,
  maxDrawdown,
  worstDay,
}: {
  days: number;
  annualStd: number | null;
  maxDrawdown: number | null;
  worstDay: number | null;
}) {
  const { locale } = useLanguage();
  const t = stockDetailCopy[locale].riskDetail;
  const reliability =
    days >= 252 ? t.reliabilityNormal : days >= 200 ? t.reliabilityModerate : days >= 120 ? t.reliabilityLow : t.reliabilityInsufficient;
  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.title} <span className="text-[10px] font-normal text-zinc-400">{t.subtitle}</span></div>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums">{t.observedPrefix} {days}{t.observedSuffix} · {t.reliabilityPrefix} {reliability}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-zinc-50 dark:bg-zinc-800/50 p-2">
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{t.annualVol}</div>
          <div className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{annualStd != null ? annualStd.toFixed(1) + "%" : "—"}</div>
        </div>
        <div className="rounded-md bg-zinc-50 dark:bg-zinc-800/50 p-2">
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{t.maxDrawdown}</div>
          <div className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">{maxDrawdown != null ? maxDrawdown.toFixed(1) + "%" : "—"}</div>
        </div>
        <div className="rounded-md bg-zinc-50 dark:bg-zinc-800/50 p-2">
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{t.worstDay}</div>
          <div className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">{worstDay != null ? worstDay.toFixed(1) + "%" : "—"}</div>
        </div>
      </div>
      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">{t.note}</p>
    </section>
  );
}

// 데이터 기준 4칸(주가·분석 대상·점수 계산·산식 버전).
// priceAsOf는 전역 스냅샷 기준일(정상). 종목 주가가 더 과거면 priceLagAsOf로 지연을 명시.
export function DataBasisCard({
  priceAsOf,
  priceLagAsOf,
  poolN,
  scoreDate,
  formulaVersion,
}: {
  priceAsOf: string | null;
  priceLagAsOf?: string | null;
  poolN: number;
  scoreDate: string;
  formulaVersion: string;
}) {
  const { locale } = useLanguage();
  const t = stockDetailCopy[locale].dataBasis;
  const lag = priceBasisLagCopy[locale];
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-3">
      <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5">{t.title}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-zinc-500 dark:text-zinc-400 tabular-nums">
        <div>{t.price} {priceLagAsOf ? (
          <span className="text-amber-600 dark:text-amber-400">{lag.servicePrefix} {priceAsOf ?? "—"} {lag.stockMid} {priceLagAsOf} {lag.stockSuffix}</span>
        ) : (
          <span className="text-zinc-700 dark:text-zinc-300">{priceAsOf ?? "—"} {t.marketClose}</span>
        )}</div>
        <div>{t.universe} <span className="text-zinc-700 dark:text-zinc-300">{poolN}{t.universeSuffix}</span></div>
        <div>{t.scoreCalc} <span className="text-zinc-700 dark:text-zinc-300">{scoreDate}</span></div>
        <div>{t.formulaVersion} <span className="text-zinc-700 dark:text-zinc-300">{formulaVersion}</span></div>
      </div>
    </div>
  );
}

// 업종 대비 밸류 — 표본 충분/부족/없음 3분기. 점수·peers는 서버 계산값.
export function SectorValueCard({
  hasScore,
  sectorName,
  peers,
  score,
  poolN,
  valueScore,
}: {
  hasScore: boolean;
  sectorName: string;
  peers: number;
  score: number;
  poolN: number;
  valueScore: number;
}) {
  const { locale } = useLanguage();
  const t = stockDetailCopy[locale].sectorValue;

  if (!hasScore) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-3">
        <div className="text-[11px] md:text-xs text-zinc-600 dark:text-zinc-300 font-semibold">{t.titlePrefix} {sectorName}</div>
        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{t.emptyBefore} {peers}{t.emptyMid} {poolN} {t.emptyAfter}</div>
      </div>
    );
  }

  const lowSample = peers < 10;
  return (
    <div className={"rounded-lg border p-3 flex items-center justify-between gap-3 " + (lowSample ? "border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40" : "border-cyan-200 dark:border-cyan-900 bg-cyan-50/60 dark:bg-cyan-950/20")}>
      <div className="min-w-0">
        <div className={"text-[11px] md:text-xs font-semibold " + (lowSample ? "text-zinc-600 dark:text-zinc-300" : "text-cyan-800 dark:text-cyan-300")}>{t.titlePrefix} {sectorName} <span className={"font-normal " + (lowSample ? "text-zinc-400 dark:text-zinc-500" : "text-cyan-700/70 dark:text-cyan-400/70")}>{t.diffNote}</span></div>
        <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{t.peerDescBefore} {peers}{t.peerDescMid} {poolN}{t.peerDescAfter}({Math.round(valueScore)}{t.peerDescPoint}</div>
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 break-keep">{t.bridgeNote}</div>
        {lowSample ? (
          <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400 mt-1">{t.lowSample}</div>
        ) : null}
      </div>
      <div className="text-right shrink-0">
        <span className={"font-bold tabular-nums " + (lowSample ? "text-base text-zinc-500 dark:text-zinc-400" : "text-lg text-cyan-700 dark:text-cyan-400")}>{score}</span>
        <span className="text-[10px] text-zinc-400">/100</span>
      </div>
    </div>
  );
}

// 재무 4지표 + 후행 PER/PBR 고지 + 소속 테마.
export function FinancialsSection({
  per,
  pbr,
  roe,
  dividendYield,
  themes,
}: {
  per: number;
  pbr: number;
  roe: number;
  dividendYield: number;
  themes: string[];
}) {
  const { locale } = useLanguage();
  const t = stockDetailCopy[locale].financials;
  const cells = [
    { l: t.per, v: per > 0 ? per.toFixed(1) + t.perUnit : "—" },
    { l: t.pbr, v: pbr > 0 ? pbr.toFixed(2) + t.pbrUnit : "—" },
    { l: t.roe, v: roe !== 0 ? roe.toFixed(1) + "%" : "—" },
    { l: t.dividendYield, v: dividendYield > 0 ? dividendYield.toFixed(2) + "%" : "0%" },
  ];
  return (
    <>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-2.5">
        {cells.map((m) => (
          <div key={m.l} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2.5 md:p-3">
            <div className="text-[10px] md:text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">{m.l}</div>
            <div className="text-base md:text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{m.v}</div>
          </div>
        ))}
      </section>

      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed">{t.note}</p>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
        <div className="text-sm font-semibold mb-2 text-zinc-900 dark:text-zinc-100">{t.themesPrefix} {themes.length}</div>
        <div className="flex gap-1.5 flex-wrap">
          {themes.map((tm, i) => (
            <Link
              key={tm}
              href={"/stocks?theme=" + encodeURIComponent(tm)}
              className={"text-[11px] px-2 py-1 rounded-md font-medium hover:opacity-80 transition " + (i === 0 ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300")}
            >
              {tm}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

// 점수 근거 탭 상단 — 데이터 점검 필요 경고(서버에서 경고 문자열 배열 주입).
export function DataWarningsBanner({ warnings }: { warnings: string[] }) {
  const { locale } = useLanguage();
  const t = stockDetailCopy[locale].basis;
  if (warnings.length === 0) return null;
  return (
    <section className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 md:p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-sm">⚠️</span>
        <strong className="text-xs md:text-sm font-semibold text-amber-900 dark:text-amber-200">{t.warnTitle}</strong>
      </div>
      <ul className="list-none pl-0 space-y-1">
        {warnings.map((w, i) => (
          <li key={i} className="text-[11px] md:text-xs text-amber-800 dark:text-amber-300 leading-snug flex gap-1.5">
            <span className="shrink-0">·</span><span>{w}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
