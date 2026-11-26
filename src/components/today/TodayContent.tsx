"use client";

import Link from "next/link";
import { Activity, ArrowRight, GitCompareArrows } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { todayCopy } from "@/lib/copy/today";
import { TodayStatusBar } from "@/components/today/TodayStatusBar";
import { MarketSnapshotCards } from "@/components/home/MarketSnapshotCards";
import { TodayTopSection } from "@/components/today/TodayTopSection";
import type { StockCandidate } from "@/components/home/StockCandidateCard";
import type { StrongMetric, RiskKind, MetricKey } from "@/lib/copy/home";
import { SignalSection } from "@/components/today/SignalSection";
import type { SignalStockVM } from "@/components/today/SignalStockCard";
import { type ComparisonBasis, comparisonBasisLabel } from "@/lib/scoreComparison";

/** 신호별 VM을 만들기 위해 서버에서 넘기는 종목 원시 데이터(점수·지표는 서버 계산값). */
export interface TodayStockRaw {
  name: string;
  ticker: string;
  sector: string;
  priceLabel: string;
  changePct: number;
  score: number;
  momentum: number;
  flow: number;
  value: number;
  vol: number;
  per: number;
  pbr: number;
  roe: number;
  returns?: { r1m?: number; r3m?: number; r6m?: number };
}

/** Top 3 후보 — 카드 표시값(서버 계산) + note 빌더용 원시값. */
export interface TodayTopRaw {
  rank: number;
  name: string;
  ticker: string;
  sector: string;
  priceLabel: string;
  changePct: number;
  r3m: number | null;
  score: number;
  m: { momentum: number; flow: number; value: number; vol: number };
  value: number;
  vol: number;
  /** "왜 후보인지" 근거 — 가장 강한 지표의 전체 풀 상대순위(서버 계산, 없으면 null). */
  lead: { key: MetricKey; rank: number; topPct: number } | null;
}

export interface TodayDisclosureRaw {
  raw: TodayStockRaw;
  signalLabel: string;
}

export interface TodayChangeChip {
  name: string;
  ticker: string;
  composite: number;
  delta: number;
}
export interface TodayRankChip {
  name: string;
  ticker: string;
  change: number;
}
export interface TodayBigMoverChip {
  name: string;
  ticker: string;
  delta: number;
  metricChange?: { momentum: number; flow: number; value: number; vol: number };
}

export interface TodayContentProps {
  isClosed: boolean;
  dataAsOf: string;
  dataStale: boolean;
  // KPI 카드
  totalCount: number;
  strongCount: number;
  /** 거래활성도 급증 종목 수 — 요약 KPI와 브리핑 숫자가 공유하는 단일 값(별도 재계산 금지). */
  activitySurgeCount: number;
  signalCount: number;
  // 섹션 데이터
  top3: TodayTopRaw[];
  composite: TodayStockRaw[];
  volume: TodayStockRaw[];
  value: TodayStockRaw[];
  momentum: TodayStockRaw[];
  overheated: TodayStockRaw[];
  disclosure: TodayDisclosureRaw[];
  medianPer: number;
  medianPbr: number;
  // 브리핑
  upCount: number;
  downCount: number;
  flatCount: number;
  briefingSignalCount: number;
  breadthPct: number;
  // 장마감 변화
  hasDeltas: boolean;
  /** 델타의 비교 기준(전 거래일 / N거래일 전 / 최근 저장 데이터 / 없음) — 카피가 "전일"이라 단정하지 않게 한다. */
  comparisonBasis: ComparisonBasis;
  newEntrants: TodayChangeChip[];
  dropouts: TodayChangeChip[];
  rankRisers: TodayRankChip[];
  bigMovers: TodayBigMoverChip[];
}

export function TodayContent(props: TodayContentProps) {
  const { locale } = useLanguage();
  const t = todayCopy[locale];
  const M = t.metric;
  const basisLang = locale === "en" ? "en" : "ko";
  // 델타의 실제 비교 기준 라벨(전 거래일 / N거래일 전 / 최근 저장 데이터). 카피가 "전일"이라 단정하지 않게 한다.
  const basisLabel = comparisonBasisLabel(props.comparisonBasis, basisLang);

  // 헤더 날짜 — 현재 KST 날짜를 로케일에 맞춰 표기(데이터 기준일 dataAsOf와는 별개).
  const today = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  const fmtSigned = (v: number) => (v >= 0 ? "+" : "") + Math.round(v);
  const fmtPct = (v: number) => (v >= 0 ? "+" : "") + v.toFixed(0) + "%";

  // ── 동적 신호 문구 빌더(copy의 locale 함수 사용) ──
  function compositeReason(s: TodayStockRaw): string {
    const items = [
      { label: M.momentum, v: s.momentum },
      { label: M.flow, v: s.flow },
      { label: M.value, v: s.value },
      { label: M.vol, v: s.vol },
    ];
    const strong = items.filter((x) => x.v >= 70).sort((a, b) => b.v - a.v);
    if (strong.length >= 2) {
      return t.reason.compositeDouble(strong[0].label, Math.round(strong[0].v), strong[1].label, Math.round(strong[1].v));
    }
    if (strong.length === 1) {
      return t.reason.compositeSingle(strong[0].label, Math.round(strong[0].v));
    }
    const top = [...items].sort((a, b) => b.v - a.v)[0];
    return t.reason.compositeNeutral(top.label, Math.round(top.v));
  }

  function valueReason(s: TodayStockRaw): string {
    const tags: string[] = [];
    if (props.medianPer > 0 && s.per > 0 && s.per < props.medianPer * 0.6) tags.push(t.reason.valueLowPer);
    if (props.medianPbr > 0 && s.pbr > 0 && s.pbr < props.medianPbr * 0.6) tags.push(t.reason.valueLowPbr);
    if (s.roe >= 10) tags.push(t.reason.valueRoe(s.roe.toFixed(0)));
    if (tags.length === 0) return t.reason.valueDefault(s.per.toFixed(1), s.pbr.toFixed(2));
    return tags.join(" + ");
  }

  function momentumReason(returns?: { r1m?: number; r3m?: number; r6m?: number }): string {
    const r1 = returns?.r1m;
    const r3 = returns?.r3m;
    const r6 = returns?.r6m;
    if (r1 !== undefined && r3 !== undefined && r6 !== undefined) {
      const allUp = r1 > 0 && r3 > 0 && r6 > 0;
      if (allUp) return t.reason.momAllUp(fmtPct(r6));
      if (r1 > 0 && r1 > r3) return t.reason.momRebound("+" + r1.toFixed(0) + "%");
    }
    if (r6 !== undefined) return t.reason.mom6m(fmtPct(r6));
    return t.reason.momFallback;
  }

  function strongMetrics(s: { momentum: number; flow: number; value: number; vol: number }): StrongMetric[] {
    const items: StrongMetric[] = [
      { key: "momentum", value: Math.round(s.momentum) },
      { key: "flow", value: Math.round(s.flow) },
      { key: "value", value: Math.round(s.value) },
      { key: "vol", value: Math.round(s.vol) },
    ];
    return items.sort((a, b) => b.value - a.value).slice(0, 2);
  }

  function riskKindOf(s: { value: number; vol: number }, r3m: number | null): RiskKind {
    if (r3m !== null && r3m >= 80) {
      if (r3m >= 150) return "surgeXl";
      if (r3m >= 120) return "surgeL";
      if (s.vol < 45) return "surgeVol";
      return "surge";
    }
    if (s.vol < 45) return "volHigh";
    if (s.value < 40) return "valueLow";
    return "default";
  }

  const toVM = (s: TodayStockRaw, note: string, caution = false): SignalStockVM => ({
    name: s.name,
    ticker: s.ticker,
    sector: s.sector,
    priceLabel: s.priceLabel,
    changePct: s.changePct,
    score: s.score,
    note,
    caution,
  });

  // ── Top 3 후보 카드 뷰모델 ──
  const top3Candidates: StockCandidate[] = props.top3.map((s) => ({
    rank: s.rank,
    name: s.name,
    ticker: s.ticker,
    sector: s.sector,
    priceLabel: s.priceLabel,
    changePct: s.changePct,
    r3m: s.r3m,
    score: s.score,
    metrics: strongMetrics(s.m),
    lead: s.lead,
    m: s.m,
    riskKind: riskKindOf({ value: s.value, vol: s.vol }, s.r3m),
    highReturn: s.r3m !== null && s.r3m >= 80,
  }));

  const compositeVMs = props.composite.map((s) => toVM(s, compositeReason(s)));
  const volumeVMs = props.volume.map((s) => toVM(s, t.reason.volumeNote(Math.round(s.flow))));
  const valueVMs = props.value.map((s) => toVM(s, valueReason(s)));
  const momentumVMs = props.momentum.map((s) => toVM(s, momentumReason(s.returns)));
  const overheatedVMs = props.overheated.map((s) =>
    toVM(s, t.reason.overheatedNote(Math.round(s.returns?.r3m ?? 0)), true),
  );
  const disclosureVMs = props.disclosure.map((d) => toVM(d.raw, t.reason.disclosureNote(d.signalLabel)));

  // 최근 변화(basis 기준) 실제 행이 하나라도 있는지(가짜 변화 금지 — 없으면 '현재 강점' 문구로 구분).
  const hasChangeRows =
    props.hasDeltas &&
    (props.newEntrants.length > 0 ||
      props.dropouts.length > 0 ||
      props.rankRisers.length > 0 ||
      props.bigMovers.length > 0);

  return (
    <div className="research-desk research-today space-y-5 md:space-y-6">
      {/* ── 구간 1 · 오늘 한 줄 요약(변화 중심) ── */}
      <header className="research-screen-heading">
        <p className="research-section-label tabular-nums">{today}</p>
        <h1>{t.briefingTitle}</h1>
        <p className="research-screen-deck">
          {props.hasDeltas ? t.summaryWithDeltas(basisLabel) : t.summaryNoDeltas}
        </p>
        {props.isClosed ? (
          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1.5">{t.closedNoticePrefix}<strong className="tabular-nums">{props.dataAsOf}</strong>{t.closedNoticeSuffix}</p>
        ) : null}
        {props.dataStale ? (
          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1.5">{t.stalePrefix}<strong>{t.staleBold}</strong>{t.staleSuffix}</p>
        ) : null}
      </header>

      <div>
        <section className="research-market-pulse" aria-labelledby="market-breadth-title">
          <div>
            <h2 id="market-breadth-title" className="flex items-center gap-2">
              <Activity size={17} aria-hidden="true" />
              {t.briefingMoveLabel(props.totalCount)}
            </h2>
            <p className="research-market-asof">{props.dataAsOf}{t.briefingAsOfSuffix}</p>
          </div>
          <div className="min-w-0">
            <div className="research-market-meter" aria-hidden="true">
              {[["up", props.upCount], ["down", props.downCount], ["flat", props.flatCount]].map(([tone, count]) => Number(count) > 0 ? (
                <span key={tone} data-tone={tone} style={{ flexGrow: Number(count) }} />
              ) : null)}
            </div>
            <p className="research-market-counts">
              <strong>{t.briefingUp(props.upCount)}</strong>
              <span>{t.briefingDownFlat(props.downCount, props.flatCount)}</span>
            </p>
            {/* Only published counts are shown here; no inferred daily commentary. */}
            <p className="research-market-asof">{t.breadthLine(props.breadthPct)}</p>
          </div>
        </section>
        <MarketSnapshotCards
          totalCount={props.totalCount}
          strongCount={props.strongCount}
          volumeSpikeCount={props.activitySurgeCount}
          signalCount={props.signalCount}
        />
      </div>

      {hasChangeRows ? (
        <section className="research-market-changes">
          <div className="research-band-heading">
            <GitCompareArrows className="research-section-label shrink-0" size={17} aria-hidden="true" />
            <h2>{t.changeTitle}</h2>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{basisLabel}</span>
          </div>
          <div className="research-change-grid">
            {props.newEntrants.length > 0 ? (
              <div className="mb-3">
                <div className="research-change-label">{t.newEntrants}</div>
                <div className="flex flex-wrap gap-1.5">
                  {props.newEntrants.map((s) => (
                    <Link key={s.ticker} prefetch={false} href={"/stock/" + s.ticker} className="research-change-link">
                      {s.name} <span className="tabular-nums">{s.composite} (▲{Math.round(s.delta)})</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
            {props.dropouts.length > 0 ? (
              <div className="mb-3">
                <div className="research-change-label">{t.dropouts}</div>
                <div className="flex flex-wrap gap-1.5">
                  {props.dropouts.map((s) => (
                    <Link key={s.ticker} prefetch={false} href={"/stock/" + s.ticker} className="research-change-link">
                      {s.name} <span className="tabular-nums">{s.composite} (▼{Math.abs(Math.round(s.delta))})</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
            {props.rankRisers.length > 0 ? (
              <div className="mb-3">
                <div className="research-change-label">{t.rankRisers(basisLabel)}</div>
                <div className="flex flex-wrap gap-1.5">
                  {props.rankRisers.map((s) => (
                    <Link key={s.ticker} prefetch={false} href={"/stock/" + s.ticker} className="research-change-link">
                      {s.name} <span className="tabular-nums">▲{s.change}{t.rankStepSuffix}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
            {props.bigMovers.length > 0 ? (
              <div>
                <div className="research-change-label">{t.bigMovers}</div>
                <div className="flex flex-wrap gap-1.5">
                  {props.bigMovers.map((s) => {
                    const up = s.delta >= 0;
                    const mc = s.metricChange;
                    const cause = mc ? `${M.momentum} ${fmtSigned(mc.momentum)} · ${M.flow} ${fmtSigned(mc.flow)} · ${M.value} ${fmtSigned(mc.value)} · ${M.vol} ${fmtSigned(mc.vol)}` : undefined;
                    return (
                      <Link key={s.ticker} prefetch={false} href={"/stock/" + s.ticker} title={cause} className="research-change-link">
                        {s.name} <span data-tone={up ? "up" : "down"} className="tabular-nums">{up ? "▲" : "▼"}{Math.abs(Math.round(s.delta))}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
          <p className="text-xs text-[var(--muted)]">{t.watchHint}</p>
        </section>
      ) : props.hasDeltas ? (
        <p className="text-xs text-[var(--muted)]">{t.noChangeNote(basisLabel)}</p>
      ) : null}

      <TodayTopSection candidates={top3Candidates} />

      {/* 현재 강점 기준 후보 목록 — 최근 변화가 아님을 캡션으로 구분 */}
      <section className="space-y-5 md:space-y-6">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t.signalsHeading}</h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{props.hasDeltas ? t.signalsStrengthNote : t.strengthFallbackNote}</p>
          </div>
          <Link prefetch={false} href="/stocks" className="research-link inline-flex min-h-11 items-center gap-1 text-xs">
            {t.exploreAll}<ArrowRight size={14} className="shrink-0" aria-hidden="true" />
          </Link>
        </div>

        <SignalSection title={t.sections.composite.title} caption={t.sections.composite.caption} items={compositeVMs} footnote={t.sections.composite.footnote} emptyText={t.sectionEmpty} />
        <SignalSection title={t.sections.volume.title} caption={t.sections.volume.caption} items={volumeVMs} footnote={t.sections.volume.footnote} emptyText={t.sectionEmpty} />
        <SignalSection title={t.sections.value.title} caption={t.sections.value.caption} items={valueVMs} footnote={t.sections.value.footnote} emptyText={t.sectionEmpty} />
        <SignalSection title={t.sections.momentum.title} caption={t.sections.momentum.caption} items={momentumVMs} footnote={t.sections.momentum.footnote} emptyText={t.sectionEmpty} />
        <SignalSection title={t.sections.overheated.title} caption={t.sections.overheated.caption} items={overheatedVMs} footnote={t.sections.overheated.footnote} emptyText={t.sectionEmpty} />
      </section>

      {/* ── 구간 3 · 관심종목 변화는 /today에 데이터 소스가 없어 의도적으로 생략(가짜 빈 카드 금지) ── */}

      {/* ── 구간 4 · 확인할 공시 신호 ── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t.disclosureHeading}</h2>
        <SignalSection title={t.sections.disclosure.title} caption={t.sections.disclosure.caption} items={disclosureVMs} footnote={t.sections.disclosure.footnote} emptyText={t.sectionEmpty} />
      </section>

      {/* ── 구간 5 · 데이터 기준/주의 사항 ── */}
      <TodayStatusBar />
      <section className="text-[10px] text-zinc-600 dark:text-zinc-300 leading-relaxed border-t border-zinc-200 dark:border-zinc-800 pt-3">
        {t.sourceNote}
      </section>
    </div>
  );
}
