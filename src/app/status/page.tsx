import Link from "next/link";
import { realStockPool, dataMetadata, formatBizDateLong, isDataStale } from "@/lib/realStocks";
import { dataStatus, metricsChangelogPath } from "@/lib/dataStatus";
import { DataStatusBadge } from "@/components/trust/badges";
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

  const sources: { name: string; detail: string; tone: "ok" | "warn" | "off" }[] = [
    { name: "가격·지표 (FinanceDataReader)", detail: "GitHub Actions 매일 평일 자동 갱신", tone: priceStale ? "warn" : "ok" },
    { name: "현재가 (네이버 지연 시세)", detail: "페이지 열 때 실시간 조회 (참고용)", tone: "ok" },
    { name: "공시 (DART)", detail: "라이브 조회 (DART_API_KEY 필요)", tone: "ok" },
    { name: "KRX 시장경보", detail: alertedCount > 0 ? `활성 ${alertedCount}종목` : "보류 — 무료 공식 소스 없음(인프라만 준비)", tone: alertedCount > 0 ? "ok" : "off" },
    { name: "점수 변화 (Supabase daily_scores)", detail: "장 마감 후 cron 저장", tone: "ok" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-3 md:px-4 py-6 md:py-10 space-y-6">
      <header className="space-y-1">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">← 홈으로</Link>
        <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">데이터 상태</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">파이프라인 신선도와 데이터 소스 상태를 투명하게 공개합니다.</p>
      </header>

      {/* 스냅샷 */}
      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-4">
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
            <div className="text-zinc-400 dark:text-zinc-500">점수 계산</div>
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
      </section>

      {/* 데이터 종류별 상태 — 가격/재무/공시/산식 분리 (전역 dataStatus 단일 소스 재사용) */}
      <section>
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">데이터 종류별 상태</div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
          {dataStatus.domainStatuses.map((dm) => (
            <div key={dm.key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 px-4 py-3">
              <div className="sm:w-24 shrink-0 text-sm font-medium text-zinc-800 dark:text-zinc-200">{dm.label}</div>
              <div className="flex-1 min-w-0">
                <DataStatusBadge tone={dm.status} label={dm.statusLabel} className="text-xs" />
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{dm.detail} · {dm.meaning}</div>
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

      {/* 데이터 소스 상태 */}
      <section>
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">데이터 소스</div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
          {sources.map((s) => (
            <div key={s.name} className="flex items-center gap-3 px-4 py-3">
              <Dot tone={s.tone} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-zinc-800 dark:text-zinc-200">{s.name}</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
        데이터는 매주 평일 장 마감 후 클라우드(GitHub Actions)에서 자동 갱신됩니다. 갱신 실패 시 직전 정상 데이터가 유지되며, 새 데이터는 자동 검증(정합성·브랜드)을 통과한 경우에만 반영됩니다. 모든 점수·순위는 종가 기준이며 투자 추천이 아닙니다.
      </p>
    </div>
  );
}
