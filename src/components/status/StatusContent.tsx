"use client";

import Link from "next/link";
import { ReportDataIssue } from "@/components/status/ReportDataIssue";
import { useLanguage } from "@/components/LanguageProvider";
import { statusCopy } from "@/lib/copy/status";
import { useMarketFreshness } from "@/components/trust/useMarketFreshness";
import { marketFreshnessCopy } from "@/lib/freshness";
import { buildStatusDimensions, type DimensionState } from "@/lib/statusDimensions";
import type { LocalizedDataStatus, VerificationSource } from "@/lib/dataStatus";
import type { StatusHistoryEntry } from "@/lib/statusHistory";
import type { Locale } from "@/lib/i18n";

type Tone = "ok" | "warn" | "off";

function Dot({ tone }: { tone: Tone }) {
  const c =
    tone === "ok"
      ? "bg-emerald-500"
      : tone === "warn"
        ? "bg-amber-500"
        : "bg-zinc-400 dark:bg-zinc-600";
  return <span className={"inline-block w-2 h-2 rounded-full " + c} />;
}

// 차원 상태 뱃지 — ok(정상)/limited(범위 제한)/attention(확인 필요). 색은 라벨과 항상 동반.
const DIMENSION_STATE_BADGE: Record<DimensionState, string> = {
  ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  limited: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  attention: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
};

function DimensionStateBadge({ state, label }: { state: DimensionState; label: string }) {
  return (
    <span className={"text-[11px] px-2 py-0.5 rounded-full font-medium " + DIMENSION_STATE_BADGE[state]}>
      {label}
    </span>
  );
}

/**
 * /status 본문 표시부 (클라이언트).
 * 서버가 넘긴 dataStatusByLocale(직렬화 가능)에서 로케일을 골라 도메인 상태·제한·자동 점검을 렌더하고,
 * 페이지 크롬(제목·섹션 헤딩·소스 행 이름·푸터·목차)은 statusCopy(번들에 stocks.json 미포함)에서 읽는다.
 * 소스 행의 톤(ok/warn/off)·priceAge·생성 시각·자동 점검 수치는 서버 계산값을 props로 받는다.
 */
export function StatusContent({
  dataStatusByLocale,
  priceStale,
  priceAge,
  scoreTimeKst,
  scoreTimeUtc,
  alertedCount,
  metricsChangelogPath,
  verificationSources,
  statusHistory,
  dimensionData,
  priceLag,
  selfCheck,
}: {
  dataStatusByLocale: Record<Locale, LocalizedDataStatus>;
  priceStale: boolean;
  priceAge: number | null;
  scoreTimeKst: string;
  scoreTimeUtc: string;
  alertedCount: number;
  metricsChangelogPath: string;
  verificationSources: VerificationSource[];
  statusHistory: StatusHistoryEntry[];
  dimensionData: {
    historyAsOfDates: string[];
    historyEntryCount: number;
    financialMissing: number;
    financialUniverse: number;
    financialOverThreshold: boolean;
    disclosureScope: { windowDays: number; maxFilings: number };
    coverage: { themedCount: number; flowCount: number; universe: number };
  };
  priceLag: {
    count: number;
    symbols: { ticker: string; name: string; priceDate: string; businessDaysBehind: number }[];
  };
  selfCheck: {
    suspectCount: number;
    missingFinancialsCount: number;
    universeCount: number;
    metricsVersionMatch: boolean;
    expectedMetricsVersion: string;
  };
}) {
  const { locale } = useLanguage();
  const t = statusCopy[locale];
  const f = marketFreshnessCopy[locale];
  const ds = dataStatusByLocale[locale];
  const sc = selfCheck;

  // YYYYMMDD → 2026.07.08 (표시 전용).
  const fmtYmd = (v: string) =>
    /^\d{8}$/.test(v) ? `${v.slice(0, 4)}.${v.slice(4, 6)}.${v.slice(6, 8)}` : v;
  const lagCount = priceLag.count;

  // 방문 시각 기준 신선도 — 전 거래일 종가만 있고 오늘 장마감 수집 전이면 "정상"으로만 보이지 않게 한다.
  // 파이프라인 지연(priceStale)이 우선, 그다음 오늘 마감 수집 대기(awaiting_close)를 경고로 노출.
  const freshness = useMarketFreshness(ds.globalAsOfDate);
  const awaitingClose = freshness?.state === "awaiting_close" && !priceStale;
  const snapshotWarn = priceStale || awaitingClose;
  const snapshotBadge = priceStale ? t.snapshotStale : awaitingClose ? f.awaitingBadge : t.snapshotOk;

  // 사용자 향 상태 6차원(Slice C) — 단일 초록 대신 차원별 명시적 날짜·상태(정상/제한/확인 필요).
  // 가격 신선도는 클라이언트 신선도 훅(awaitingClose)까지 반영해 조립한다. 이력 연속성은 Slice B basis 소비.
  const dimensions = buildStatusDimensions(
    {
      price: {
        asOfLabel: ds.globalAsOfLabel,
        stale: priceStale,
        awaitingClose,
        ageLabel: priceAge !== null ? t.daysAgo(priceAge) : "",
      },
      score: {
        computedLabel: scoreTimeKst,
        metricsVersionLabel: ds.metricsVersionLabel,
        generated: !!ds.metricsVersion && scoreTimeKst !== "—",
      },
      history: {
        asOfDates: dimensionData.historyAsOfDates,
        entryCount: dimensionData.historyEntryCount,
      },
      financial: {
        missing: dimensionData.financialMissing,
        universe: dimensionData.financialUniverse,
        overThreshold: dimensionData.financialOverThreshold,
      },
      disclosure: dimensionData.disclosureScope,
      themeFlow: {
        themedCount: dimensionData.coverage.themedCount,
        flowCount: dimensionData.coverage.flowCount,
        universe: dimensionData.coverage.universe,
      },
    },
    locale,
  );

  const sources: { name: string; detail: string; tone: Tone }[] = [
    { name: t.sources.price.name, detail: t.sources.price.detail, tone: priceStale ? "warn" : "ok" },
    { name: t.sources.quote.name, detail: t.sources.quote.detail, tone: "ok" },
    { name: t.sources.disclosure.name, detail: t.sources.disclosure.detail, tone: "ok" },
    {
      name: t.sources.alert.name,
      detail: alertedCount > 0 ? t.sources.alert.detailActive(alertedCount) : t.sources.alert.detailIdle,
      tone: alertedCount > 0 ? "ok" : "off",
    },
    { name: t.sources.scores.name, detail: t.sources.scores.detail, tone: "ok" },
  ];

  const toc: { href: string; label: string }[] = [
    { href: "#snapshot", label: t.toc.snapshot },
    { href: "#domains", label: t.toc.domains },
    { href: "#limits", label: t.toc.limits },
    { href: "#selfcheck", label: t.toc.selfcheck },
    { href: "#history", label: t.toc.history },
    { href: "#sources", label: t.toc.sources },
    { href: "#verify", label: t.toc.verify },
    { href: "#report", label: t.toc.report },
  ];

  return (
    <div className="max-w-3xl mx-auto px-3 md:px-4 py-6 md:py-10 space-y-6">
      <header className="space-y-1">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">{t.backHome}</Link>
        <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t.pageTitle}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.pageSubtitle}</p>
      </header>

      {/* 인페이지 목차 — 모바일에서 긴 상태판 빠르게 이동 */}
      <nav aria-label={t.toc.ariaLabel}>
        <ul className="flex flex-wrap gap-x-2 gap-y-1.5 text-[11px] list-none">
          {toc.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="inline-flex items-center px-2 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* 스냅샷 */}
      <section id="snapshot" className="scroll-mt-20 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{t.snapshotHeading}</div>
          <span className={"text-[11px] px-2 py-0.5 rounded-full font-medium " + (snapshotWarn ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300")}>
            {snapshotBadge}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-zinc-400 dark:text-zinc-500">{t.snapshotPriceDate}</div>
            <div className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">{ds.globalAsOfLabel}{priceAge !== null ? t.daysAgo(priceAge) : ""}</div>
            {awaitingClose ? (
              <div className="text-[10px] font-medium text-amber-700 dark:text-amber-400 mt-0.5">{f.awaitingNote}</div>
            ) : null}
          </div>
          <div>
            <div className="text-zinc-400 dark:text-zinc-500">{t.snapshotScoreTime}</div>
            <div className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200 break-words">{scoreTimeKst} KST</div>
            <div className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500">({t.scoreTimeBatchNote})</div>
            <div className="text-[10px] font-normal tabular-nums text-zinc-400 dark:text-zinc-500 break-words">{t.scoreTimeUtcLabel} {scoreTimeUtc} UTC</div>
          </div>
          <div>
            <div className="text-zinc-400 dark:text-zinc-500">{t.snapshotMetricsVersion}</div>
            <div className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">{ds.metricsVersionLabel}</div>
          </div>
          <div>
            <div className="text-zinc-400 dark:text-zinc-500">{t.snapshotUniverse}</div>
            <div className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">{t.stocksUnit(sc.universeCount)}</div>
          </div>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
          {t.snapshotNote}
        </p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
          {t.dataCadenceNote}
        </p>
        {/* 파이프라인 정상 ≠ 최신 시세 — 신뢰 분리 고지(항상 노출). awaiting_close면 오늘 마감 수집 대기 상세 추가. */}
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
          {f.pipelineVsLatest}
        </p>
        {awaitingClose ? (
          <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 mt-1.5 leading-relaxed">
            {f.awaitingDetail}
          </p>
        ) : null}
      </section>

      {/* 사용자 향 상태 6차원(Slice C) — 가격 신선도/점수 신선도/점수 이력 연속성/재무 완성도/공시 범위/테마·거래활성도.
          단일 초록 대신 차원별 명시적 날짜·상태(정상/범위 제한/확인 필요)를 노출한다. */}
      <section id="domains" className="scroll-mt-20">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{t.domainsHeading}</div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
          {dimensions.map((dm) => (
            <div key={dm.key} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 px-4 py-3">
              <div className="sm:w-32 shrink-0 text-sm font-medium text-zinc-800 dark:text-zinc-200">{dm.label}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <DimensionStateBadge state={dm.state} label={dm.stateLabel} />
                  {dm.asOf ? (
                    <span className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400 break-words">{dm.asOf}</span>
                  ) : null}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 break-words">{dm.detail}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
          {t.domainsChangelogPrefix}
          <Link href={metricsChangelogPath} className="text-blue-700 dark:text-blue-400 hover:underline">{t.domainsChangelogLink}</Link>
          {t.domainsChangelogSuffix}
        </p>
      </section>

      {/* 알려진 제한 — 이미 문서화된 사실만 모아 단일 소스에서 렌더 */}
      <section id="limits" className="scroll-mt-20">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{t.limitsHeading}</div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
          {ds.knownLimits.map((lim) => (
            <div key={lim.title} className="px-4 py-3">
              <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{lim.title}</div>
              <div className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed break-words">{lim.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 최근 자동 점검 요약 — 앱 내부 실측 값(검증 보류·결측·가격 지연). 산식 버전 일치 여부 대조는
          내부 구현 세부라 보호된 /admin/status 로 이동했다(공개 페이지 비노출). */}
      <section id="selfcheck" className="scroll-mt-20">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{t.selfcheckHeading}</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500">{t.selfcheckSuspect}</div>
            <div className="text-lg font-bold tabular-nums text-zinc-800 dark:text-zinc-200">{sc.suspectCount}<span className="text-xs font-medium text-zinc-400 dark:text-zinc-500"> / {sc.universeCount}</span></div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{t.selfcheckSuspectNote}</div>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500">{t.selfcheckMissing}</div>
            <div className="text-lg font-bold tabular-nums text-zinc-800 dark:text-zinc-200">{sc.missingFinancialsCount}<span className="text-xs font-medium text-zinc-400 dark:text-zinc-500"> / {sc.universeCount}</span></div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{t.selfcheckMissingNote}</div>
          </div>
          {/* 종목별 가격 기준일 불일치 — 전역 기준일보다 과거인 종목 수·이름. 0이면 회색, ≥1이면 amber. */}
          <div className={"rounded-lg border p-3 " + (lagCount > 0 ? "border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20" : "border-zinc-200 dark:border-zinc-800")}>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500">{t.selfcheckPriceLag}</div>
            <div className={"text-lg font-bold tabular-nums " + (lagCount > 0 ? "text-amber-700 dark:text-amber-400" : "text-zinc-800 dark:text-zinc-200")}>{lagCount}<span className="text-xs font-medium text-zinc-400 dark:text-zinc-500"> / {sc.universeCount}</span></div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{lagCount > 0 ? t.selfcheckPriceLagNote : t.selfcheckPriceLagNone}</div>
          </div>
        </div>
        {lagCount > 0 ? (
          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-2 leading-relaxed">
            <span className="font-medium">{t.selfcheckPriceLagNamesPrefix}</span>
            {priceLag.symbols.map((s) => t.selfcheckPriceLagSymbol(s.name, s.ticker, fmtYmd(s.priceDate))).join(", ")}
          </p>
        ) : null}
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 leading-relaxed">
          {t.selfcheckFootnote}
        </p>
      </section>

      {/* 데이터 상태 이력 — append-only 스냅샷 로그. 로그가 아직 없으면 가짜 과거를 그리지 않고
          "로깅 활성화 이후부터 쌓인다"는 안내만 노출한다(정직성). 로그가 쌓이면 보수적 표로 렌더. */}
      <section id="history" className="scroll-mt-20">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{t.historyHeading}</div>
        {statusHistory.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/30 px-4 py-4">
            <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.historyPendingTitle}</div>
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed break-words">{t.historyPendingBody}</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
            <table className="w-full min-w-[420px] text-xs border-collapse">
              <caption className="sr-only">{t.historyTableCaption}</caption>
              <thead>
                <tr className="text-left text-zinc-400 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                  <th scope="col" className="py-2 pr-3 font-medium">{t.historyColDate}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{t.historyColAsOf}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{t.historyColMetrics}</th>
                  <th scope="col" className="py-2 pr-3 font-medium tabular-nums">{t.historyColSuspect}</th>
                  <th scope="col" className="py-2 pr-0 font-medium tabular-nums">{t.historyColLag}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {statusHistory.map((h) => (
                  <tr key={h.generatedAt + h.asOfBusinessDate} className="text-zinc-700 dark:text-zinc-300">
                    <td className="py-2 pr-3 tabular-nums whitespace-nowrap">{h.generatedAt.slice(0, 10)}</td>
                    <td className="py-2 pr-3 tabular-nums whitespace-nowrap">{fmtYmd(h.asOfBusinessDate)}</td>
                    <td className="py-2 pr-3 tabular-nums whitespace-nowrap">{h.metricsVersion ?? "—"}</td>
                    <td className="py-2 pr-3 tabular-nums">{h.suspectCount ?? "—"}</td>
                    <td className="py-2 pr-0 tabular-nums">{h.priceLagCount ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 leading-relaxed">{t.historyFootnote}</p>
      </section>

      {/* 데이터 소스 상태 */}
      <section id="sources" className="scroll-mt-20">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{t.sourcesHeading}</div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
          {sources.map((s) => (
            <div key={s.name} className="flex items-center gap-3 px-4 py-3">
              <Dot tone={s.tone} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-zinc-800 dark:text-zinc-200 break-words">{s.name}</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 break-words">{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 원본 소스 직접 확인 — 사용자가 공식 원출처에서 수치를 직접 교차 확인하는 evidence 진입점.
          외부 링크는 새 탭(rel=noopener). URL은 서버가 dataStatus에서 단일 소스로 넘긴 verificationSources,
          이름·용도 문구는 로케일별 statusCopy에서 읽는다. 톤: 대조·확인용(비자문). */}
      <section id="verify" className="scroll-mt-20">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{t.verifyHeading}</div>
        <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-2 leading-relaxed break-words">{t.verifyIntro}</p>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
          {verificationSources.map((v) => (
            <a
              key={v.id}
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition min-h-[44px]"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-400 break-words">{t.verifySources[v.id].name} ↗</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 break-words">{t.verifySources[v.id].what}</div>
              </div>
            </a>
          ))}
        </div>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 leading-relaxed break-words">
          {t.verifyFormulaPrefix}
          <Link href="/guide/metrics" className="text-blue-700 dark:text-blue-400 hover:underline">{t.verifyFormulaLink}</Link>
          {t.verifyFormulaSuffix} · {t.verifyOutbound}
        </p>
      </section>

      {/* 데이터 오류 신고 — 단일 소스(dataStatus) 기반 진입점 */}
      <ReportDataIssue />

      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
        {t.footerNote}
      </p>

      <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-700 dark:text-blue-400 border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <Link href="/guide/metrics" className="hover:underline">{t.linkMetricsGuide}</Link>
        <Link href={metricsChangelogPath} className="hover:underline">{t.linkChangelog}</Link>
      </nav>
    </div>
  );
}
