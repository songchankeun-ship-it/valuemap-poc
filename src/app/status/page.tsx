import Link from "next/link";
import { realStockPool, dataMetadata, formatBizDateLong, isDataStale } from "@/lib/realStocks";
import { dataStatus, metricsChangelogPath } from "@/lib/dataStatus";
import { DataStatusBadge } from "@/components/trust/badges";
import { ReportDataIssue } from "@/components/status/ReportDataIssue";
import { getAlertedTickers } from "@/lib/marketAlert";

export const metadata = {
  title: "데이터 상태 — 오른스코어",
  description: "오른스코어 데이터 파이프라인의 신선도와 소스 상태를 보여주는 운영 상태 페이지.",
};

export const revalidate = 600;

// asOfBusinessDate(YYYYMMDD) 기준 경과일 계산
function daysSince(yyyymmdd: string | undefined): number | null {
  if (!yyyymmdd || !/^\d{8}$/.test(yyyymmdd)) return null;
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));
  const then = new Date(y, m - 1, d).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
}

function Dot({ tone }: { tone: "ok" | "warn" | "off" }) {
  const c =
    tone === "ok"
      ? "bg-emerald-500"
      : tone === "warn"
        ? "bg-amber-500"
        : "bg-zinc-400 dark:bg-zinc-600";
  return <span className={"inline-block w-2 h-2 rounded-full " + c} />;
}

export default async function StatusPage() {
  const priceAge = daysSince(dataMetadata.asOfBusinessDate);
  // 헤더·푸터와 동일한 기준(2영업일 이상 경과)으로 지연 판정 — 화면 간 신선도 표기 일치.
  const priceStale = isDataStale(dataMetadata.asOfBusinessDate);
  const alertedCount = (await getAlertedTickers()).size;
  const sc = dataStatus.selfCheck;

  const sources: { name: string; detail: string; tone: "ok" | "warn" | "off" }[] = [
    { name: "가격·지표 (FinanceDataReader)", detail: "GitHub Actions 매일 평일 자동 갱신", tone: priceStale ? "warn" : "ok" },
    { name: "현재가 (네이버 지연 시세)", detail: "페이지 열 때 실시간 조회 (참고용)", tone: "ok" },
    { name: "공시 (DART)", detail: "라이브 조회 (DART_API_KEY 필요)", tone: "ok" },
    { name: "KRX 시장경보", detail: alertedCount > 0 ? `활성 ${alertedCount}종목` : "보류 — 무료 공식 소스 없음(인프라만 준비)", tone: alertedCount > 0 ? "ok" : "off" },
    { name: "점수 변화 (Supabase daily_scores)", detail: "장 마감 후 cron 저장", tone: "ok" },
  ];

  // 모바일에서 길어진 상태판을 빠르게 훑도록 상단 앵커 목록 제공(JS 없는 in-page 링크).
  const toc: { href: string; label: string }[] = [
    { href: "#snapshot", label: "스냅샷" },
    { href: "#domains", label: "종류별 상태" },
    { href: "#limits", label: "알려진 제한" },
    { href: "#selfcheck", label: "자동 점검" },
    { href: "#sources", label: "데이터 소스" },
    { href: "#report", label: "오류 신고" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-3 md:px-4 py-6 md:py-10 space-y-6">
      <header className="space-y-1">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">← 홈으로</Link>
        <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">데이터 상태</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">파이프라인 신선도와 데이터 소스 상태를 투명하게 공개합니다.</p>
      </header>

      {/* 인페이지 목차 — 모바일에서 긴 상태판 빠르게 이동 */}
      <nav className="flex flex-wrap gap-x-2 gap-y-1.5 text-[11px]">
        {toc.map((t) => (
          <a
            key={t.href}
            href={t.href}
            className="inline-flex items-center px-2 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500"
          >
            {t.label}
          </a>
        ))}
      </nav>

      {/* 스냅샷 */}
      <section id="snapshot" className="scroll-mt-20 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">현재 데이터 스냅샷</div>
          <span className={"text-[11px] px-2 py-0.5 rounded-full font-medium " + (priceStale ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300")}>
            {priceStale ? "갱신 지연 가능" : "정상"}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-zinc-400 dark:text-zinc-500">가격 기준일</div>
            <div className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">{formatBizDateLong(dataMetadata.asOfBusinessDate)}{priceAge !== null ? ` (${priceAge}일 전)` : ""}</div>
          </div>
          <div>
            <div className="text-zinc-400 dark:text-zinc-500">점수 계산 시각</div>
            <div className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">{dataMetadata.generatedAt?.slice(0, 16).replace("T", " ") ?? "—"}</div>
          </div>
          <div>
            <div className="text-zinc-400 dark:text-zinc-500">산식 버전</div>
            <div className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">{dataStatus.metricsVersionLabel}</div>
          </div>
          <div>
            <div className="text-zinc-400 dark:text-zinc-500">분석 대상</div>
            <div className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">{realStockPool.length}종목</div>
          </div>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
          가격·점수는 마지막 배치 기준이고, 공시는 페이지를 열 때 DART에서 라이브 조회합니다. 산식 버전은 코드 기대값({sc.expectedMetricsVersion})과{" "}
          {sc.metricsVersionMatch
            ? <span className="text-emerald-700 dark:text-emerald-400 font-medium">일치합니다</span>
            : <span className="text-amber-700 dark:text-amber-400 font-medium">불일치 — 점검이 필요합니다</span>}
          .
        </p>
      </section>

      {/* 데이터 종류별 상태 — 가격/재무/공시/산식 분리 (전역 dataStatus 단일 소스 재사용) */}
      <section id="domains" className="scroll-mt-20">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">데이터 종류별 상태</div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
          {dataStatus.domainStatuses.map((dm) => (
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
          산식이 바뀌면{" "}
          <Link href={metricsChangelogPath} className="text-blue-700 dark:text-blue-400 hover:underline">산식 변경 이력</Link>
          에 기록합니다.
        </p>
      </section>

      {/* 알려진 제한 — 이미 문서화된 사실만 모아 단일 소스에서 렌더 */}
      <section id="limits" className="scroll-mt-20">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">알려진 제한</div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
          {dataStatus.knownLimits.map((lim) => (
            <div key={lim.title} className="px-4 py-3">
              <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{lim.title}</div>
              <div className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed break-words">{lim.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 최근 자동 점검 요약 — 앱 내부 실측 값(검증 보류·결측·산식 일치) */}
      <section id="selfcheck" className="scroll-mt-20">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">최근 자동 점검 요약</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500">검증 보류 종목</div>
            <div className="text-lg font-bold tabular-nums text-zinc-800 dark:text-zinc-200">{sc.suspectCount}<span className="text-xs font-medium text-zinc-400 dark:text-zinc-500"> / {sc.universeCount}</span></div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Top·오늘 후보에서 제외</div>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500">PER·PBR 결측</div>
            <div className="text-lg font-bold tabular-nums text-zinc-800 dark:text-zinc-200">{sc.missingFinancialsCount}<span className="text-xs font-medium text-zinc-400 dark:text-zinc-500"> / {sc.universeCount}</span></div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">밸류 해석 신뢰도 낮음</div>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500">산식 버전 일치</div>
            <div className={"text-lg font-bold tabular-nums " + (sc.metricsVersionMatch ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>{sc.metricsVersionMatch ? "일치" : "불일치"}</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{dataStatus.metricsVersionLabel} 기준</div>
          </div>
        </div>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 leading-relaxed">
          이 수치는 현재 빌드에 포함된 데이터 풀에서 즉시 계산한 값입니다. 점검 이력 보관·관리자 대시보드·수동 재수집은 후속 과제입니다(현재는 배포 시점 스냅샷).
        </p>
      </section>

      {/* 데이터 소스 상태 */}
      <section id="sources" className="scroll-mt-20">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">데이터 소스</div>
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
        데이터는 매주 평일 장 마감 후 클라우드(GitHub Actions)에서 자동 갱신됩니다. 갱신 실패 시 직전 정상 데이터가 유지되며, 새 데이터는 자동 검증(정합성·브랜드)을 통과한 경우에만 반영됩니다. 모든 점수·순위는 종가 기준이며 투자 추천이 아닙니다.
      </p>

      <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-700 dark:text-blue-400 border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <Link href="/guide/metrics" className="hover:underline">지표 계산 방식 보기 →</Link>
        <Link href={metricsChangelogPath} className="hover:underline">산식 변경 이력 →</Link>
      </nav>
    </div>
  );
}
