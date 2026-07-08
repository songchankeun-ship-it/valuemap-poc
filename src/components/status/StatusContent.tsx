"use client";

import Link from "next/link";
import { DataStatusBadge } from "@/components/trust/badges";
import { ReportDataIssue } from "@/components/status/ReportDataIssue";
import { useLanguage } from "@/components/LanguageProvider";
import { statusCopy } from "@/lib/copy/status";
import type { LocalizedDataStatus } from "@/lib/dataStatus";
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
  selfCheck,
}: {
  dataStatusByLocale: Record<Locale, LocalizedDataStatus>;
  priceStale: boolean;
  priceAge: number | null;
  scoreTimeKst: string;
  scoreTimeUtc: string;
  alertedCount: number;
  metricsChangelogPath: string;
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
  const ds = dataStatusByLocale[locale];
  const sc = selfCheck;

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
    { href: "#sources", label: t.toc.sources },
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
          <span className={"text-[11px] px-2 py-0.5 rounded-full font-medium " + (priceStale ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300")}>
            {priceStale ? t.snapshotStale : t.snapshotOk}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-zinc-400 dark:text-zinc-500">{t.snapshotPriceDate}</div>
            <div className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">{ds.globalAsOfLabel}{priceAge !== null ? t.daysAgo(priceAge) : ""}</div>
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
          {t.snapshotNotePrefix}{sc.expectedMetricsVersion}{t.snapshotNoteMid}
          {sc.metricsVersionMatch
            ? <span className="text-emerald-700 dark:text-emerald-400 font-medium">{t.snapshotMatch}</span>
            : <span className="text-amber-700 dark:text-amber-400 font-medium">{t.snapshotMismatch}</span>}
          {t.snapshotNoteSuffix}
        </p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
          {t.dataCadenceNote}
        </p>
      </section>

      {/* 데이터 종류별 상태 — 가격/재무/공시/산식 분리 (전역 dataStatus 단일 소스 재사용) */}
      <section id="domains" className="scroll-mt-20">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{t.domainsHeading}</div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
          {ds.domainStatuses.map((dm) => (
            <div key={dm.key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 px-4 py-3">
              <div className="sm:w-24 shrink-0 text-sm font-medium text-zinc-800 dark:text-zinc-200">{dm.label}</div>
              <div className="flex-1 min-w-0">
                <DataStatusBadge tone={dm.status} label={dm.statusLabel} className="text-xs" />
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 break-words">{dm.detail} · {dm.meaning}</div>
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

      {/* 최근 자동 점검 요약 — 앱 내부 실측 값(검증 보류·결측·산식 일치) */}
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
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500">{t.selfcheckVersion}</div>
            <div className={"text-lg font-bold tabular-nums " + (sc.metricsVersionMatch ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>{sc.metricsVersionMatch ? t.selfcheckMatch : t.selfcheckMismatch}</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{t.selfcheckVersionNote(ds.metricsVersionLabel)}</div>
          </div>
        </div>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 leading-relaxed">
          {t.selfcheckFootnote}
        </p>
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
