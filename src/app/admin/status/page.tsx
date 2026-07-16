/**
 * 내부 운영용 데이터 상태판 (읽기 전용 MVP · 설계서 §10 / PART I [P2-1]).
 *
 * 공개 사용자 페이지(/status)는 그대로 두고, 운영자가 한눈에 볼 수 있는 최소 현황만 모은다.
 * - 자동 점검 요약(selfCheck): 검증보류 수·재무 결측 수·산식 버전 일치
 * - 검증보류(suspect) 종목 리스트 / PER·PBR·ROE 결측 종목 리스트 (stocks.json 풀에서 실측)
 * - data_reports 테이블이 있으면 최근 신고 목록(없거나 env 미설정이면 graceful 안내)
 *
 * 배치 실행 이력·수집 실패 로그·수동 재수집·신고 상태 워크플로는 후속(backlog 문서 참조).
 * 검색 노출 차단(noindex). ADMIN_ENABLED=1 일 때만 신고 목록을 조회한다(개인정보 보호).
 */
import Link from "next/link";
import { realStockPool } from "@/lib/realStocks";
import { isSuspect } from "@/lib/dataQuality";
import { dataStatus } from "@/lib/dataStatus";
import { requireAdminAccess } from "@/lib/adminAccess";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  classifySupabaseRead,
  resourceStateMeta,
  type ResourceState,
} from "@/lib/adminResourceState";

export const metadata = {
  title: "내부 데이터 상태판 — 오른스코어",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface DataReport {
  id: string;
  created_at: string;
  category: string;
  ticker: string | null;
  message: string;
  email: string | null;
  status: string;
}

// 신고 분류 코드 → 한글 라벨. 사용자 폼(reportFormCopy)과 동일 어휘로 맞춘다.
const REPORT_CATEGORY_LABELS: Record<string, string> = {
  price: "가격·거래량",
  financial: "재무(PER·PBR·ROE)",
  disclosure: "공시",
  score: "점수·순위",
  sector: "업종 분류",
  other: "기타",
};

// 신고 상태 코드 → 한글 라벨 + 뱃지 색. 상태 전이는 인앱 API가 없어 Supabase에서 직접 갱신한다(소유자 게이트).
const REPORT_STATUS_META: Record<string, { label: string; badge: string }> = {
  new: { label: "신규 접수", badge: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300" },
  reviewing: { label: "확인 중", badge: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300" },
  resolved: { label: "처리 완료", badge: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300" },
  dismissed: { label: "반려", badge: "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400" },
};

async function loadReports(): Promise<{ rows: DataReport[]; note: string; state: ResourceState }> {
  if (process.env.ADMIN_ENABLED !== "1") {
    return {
      rows: [],
      note: "ADMIN_ENABLED=1 설정 시 신고 목록을 표시합니다(개인정보 보호).",
      state: classifySupabaseRead({ disabled: true }),
    };
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("data_reports")
      .select("id, created_at, category, ticker, message, email, status")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      return {
        rows: [],
        note: "data_reports 테이블을 읽지 못했습니다(미생성 또는 권한). SQL은 라우트 주석 참조.",
        state: classifySupabaseRead({ failed: true }),
      };
    }
    const rows = (data as DataReport[]) ?? [];
    return { rows, note: "", state: classifySupabaseRead({ count: rows.length }) };
  } catch {
    return {
      rows: [],
      note: "Supabase env 미설정으로 신고 목록을 조회하지 못했습니다.",
      state: classifySupabaseRead({ capable: false }),
    };
  }
}

export default async function AdminStatusPage() {
  const admin = await requireAdminAccess("/admin/status");
  if (!admin.allowed) {
    return (
      <div className="max-w-2xl mx-auto px-3 md:px-4 py-10">
        <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-5">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-2">관리자 전용</p>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">접근 권한이 없습니다</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
            현재 로그인 계정 <span className="font-mono">{admin.email}</span> 은 관리자 허용 목록에 없습니다.
            운영자 계정으로 다시 로그인하거나, 배포 환경변수 <code>ADMIN_EMAILS</code>에 허용 이메일을 추가하세요.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/login?next=/admin/status" className="min-h-[44px] inline-flex items-center rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 text-sm font-medium text-white dark:text-zinc-900">
              다른 계정으로 로그인
            </Link>
            <Link href="/" className="min-h-[44px] inline-flex items-center rounded-md border border-zinc-300 dark:border-zinc-700 px-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">
              홈으로
            </Link>
          </div>
        </div>
      </div>
    );
  }
  const suspects = realStockPool.filter((s) => isSuspect(s));
  const missing = realStockPool.filter(
    (s) => !(typeof s.per === "number" && s.per > 0) || !(typeof s.pbr === "number" && s.pbr > 0),
  );
  const sc = dataStatus.selfCheck;
  const { rows: reports, note: reportNote, state: reportState } = await loadReports();

  // triage 정렬·집계 — 이미 조회한 rows에서만 파생(추가 조회·쓰기 없음).
  // 표는 미처리(new→reviewing) 먼저, 종료(resolved→dismissed) 뒤. 그룹 내 접수일 내림차순은
  // 쿼리 order(desc)가 안정 정렬로 보존된다(V8 Array.sort는 stable).
  const STATUS_TRIAGE_ORDER: Record<string, number> = { new: 0, reviewing: 1, resolved: 2, dismissed: 3 };
  const triagedReports = [...reports].sort(
    (a, b) => (STATUS_TRIAGE_ORDER[a.status] ?? 9) - (STATUS_TRIAGE_ORDER[b.status] ?? 9),
  );
  const statusCounts = reports.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const categoryCounts = reports.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + 1;
    return acc;
  }, {});
  const openReportCount = (statusCounts.new ?? 0) + (statusCounts.reviewing ?? 0);
  // 상태 뱃지는 4단계 고정 순서로 항상 노출(0건도) → 레이아웃 안정. 미지의 코드는 뒤에 덧붙임.
  const CANONICAL_STATUS_ORDER = ["new", "reviewing", "resolved", "dismissed"];
  const statusSummary = [
    ...CANONICAL_STATUS_ORDER,
    ...Object.keys(statusCounts).filter((s) => !CANONICAL_STATUS_ORDER.includes(s)),
  ];
  // 분류는 존재하는 것만, 사용자 폼과 동일한 어휘 순서로.
  const CANONICAL_CATEGORY_ORDER = ["price", "financial", "disclosure", "score", "sector", "other"];
  const categorySummary = [
    ...CANONICAL_CATEGORY_ORDER.filter((c) => categoryCounts[c]),
    ...Object.keys(categoryCounts).filter((c) => !CANONICAL_CATEGORY_ORDER.includes(c)),
  ];

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8 space-y-6">
      <header>
        <div className="inline-flex items-center gap-2 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-medium px-2 py-1 mb-2">내부 운영용 · 검색 비노출</div>
        <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">데이터 상태판 (관리자)</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          기준일 {dataStatus.globalAsOfLabel} · 산식 {dataStatus.metricsVersionLabel} · 공개 페이지는{" "}
          <Link href="/status" className="text-blue-600 dark:text-blue-400 underline">/status</Link>. 후속 항목은{" "}
          <code className="text-[10px]">docs/ornscore-admin-status-backlog.md</code> 참조.{" "}
          관찰성 체크리스트는{" "}
          <code className="text-[10px]">docs/ornscore-launch-observability-checklist.md</code>.
        </p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="분석 종목" value={`${sc.universeCount}`} />
        <Stat label="검증 보류" value={`${sc.suspectCount}`} tone={sc.suspectCount > 0 ? "warn" : "ok"} />
        <Stat label="재무 결측" value={`${sc.missingFinancialsCount}`} tone={sc.missingFinancialsCount > 0 ? "warn" : "ok"} />
        <Stat label="산식 일치" value={sc.metricsVersionMatch ? "OK" : "불일치"} tone={sc.metricsVersionMatch ? "ok" : "warn"} />
      </section>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 -mt-3">
        기대 산식 {sc.expectedMetricsVersion} · 실제 {sc.actualMetricsVersion ?? "—"} ·{" "}
        {sc.metricsVersionMatch ? "코드 기대값과 일치" : "코드 기대값과 불일치 — 점검 필요"}
      </p>

      {/* 파이프라인 구현 세부 — 공개 /status 에서 제거하고 이 보호 화면으로 이동(Slice C).
          사용자에게는 의미 없는 내부 운영 정보(워크플로·테이블·크론·코드 기대 버전)만 여기 모은다. */}
      <Panel title="파이프라인 구현 세부 (공개 비노출)" desc="공개 /status 에는 노출하지 않는 내부 운영 정보">
        <ul className="text-[12px] text-zinc-600 dark:text-zinc-300 space-y-1 leading-relaxed">
          <li>· 가격·점수 갱신: <code className="text-[10px]">GitHub Actions</code> 워크플로 — 매 영업일 장마감 후 자동 실행.</li>
          <li>· 점수 변화 저장: Supabase <code className="text-[10px]">daily_scores</code> 테이블 — 장마감 후 cron 저장.</li>
          <li>· 기대 산식 버전(코드 단일 기준): <code className="text-[10px]">{sc.expectedMetricsVersion}</code> · 실제 <code className="text-[10px]">{sc.actualMetricsVersion ?? "—"}</code>.</li>
          <li>· 데이터 오류 신고 저장: <code className="text-[10px]">data_reports</code> 테이블(<code className="text-[10px]">ADMIN_ENABLED=1</code> 시 표시).</li>
        </ul>
      </Panel>

      <Panel title={`검증 보류 종목 (${suspects.length})`} desc="PER·PBR·ROE 극단값 — 오늘 후보·Top에서 제외">
        {suspects.length === 0 ? (
          <Empty>검증 보류 종목이 없습니다.</Empty>
        ) : (
          <RowList caption="검증 보류 종목" rows={suspects.map((s) => ({ ticker: s.ticker, name: s.name, per: s.per, pbr: s.pbr, roe: s.roe }))} />
        )}
      </Panel>

      <Panel title={`PER·PBR 결측 종목 (${missing.length})`} desc="밸류 해석 신뢰도가 낮은 종목">
        {missing.length === 0 ? (
          <Empty>결측 종목이 없습니다.</Empty>
        ) : (
          <RowList caption="PER·PBR 결측 종목" rows={missing.map((s) => ({ ticker: s.ticker, name: s.name, per: s.per, pbr: s.pbr, roe: s.roe }))} />
        )}
      </Panel>

      <Panel title={`접수된 데이터 오류 신고 (${reports.length})`} desc="data_reports 최근 50건 · 미처리(신규·확인 중) 우선 정렬">
        <ResourceStateLine state={reportState} className="mb-3" />
        {reportNote ? (
          <Empty>{reportNote}</Empty>
        ) : reports.length === 0 ? (
          <Empty>접수된 신고가 없습니다.</Empty>
        ) : (
          <>
            <div className="mb-3 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={
                    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold " +
                    (openReportCount > 0
                      ? "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                      : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300")
                  }
                >
                  {openReportCount > 0 ? `미처리 ${openReportCount}건` : "미처리 없음"}
                </span>
                <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-600">·</span>
                {statusSummary.map((s) => (
                  <StatusCount key={s} status={s} count={statusCounts[s] ?? 0} />
                ))}
              </div>
              {categorySummary.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="font-medium">분류별</span>
                  {categorySummary.map((c) => (
                    <span key={c} className="whitespace-nowrap">
                      {REPORT_CATEGORY_LABELS[c] ?? c}{" "}
                      <span className="tabular-nums font-semibold text-zinc-700 dark:text-zinc-300">{categoryCounts[c]}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div
              role="region"
              aria-label="데이터 오류 신고 목록 (가로 스크롤)"
              tabIndex={0}
              className="-mx-1 overflow-x-auto rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500"
            >
            <table className="min-w-[560px] w-full text-left text-xs">
              <caption className="sr-only">접수된 데이터 오류 신고: 접수일, 분류, 종목, 내용, 상태</caption>
              <thead className="text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
                <tr>
                  <th className="py-1.5 pr-3 font-medium whitespace-nowrap">접수</th>
                  <th className="py-1.5 pr-3 font-medium whitespace-nowrap">분류</th>
                  <th className="py-1.5 pr-3 font-medium whitespace-nowrap">종목</th>
                  <th className="py-1.5 pr-3 font-medium">내용</th>
                  <th className="py-1.5 pr-0 font-medium whitespace-nowrap">상태</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700 dark:text-zinc-300 align-top">
                {triagedReports.map((r) => (
                  <tr
                    key={r.id}
                    className={
                      "border-b border-zinc-100 dark:border-zinc-800 " +
                      // 종료(처리완료·반려) 행은 흐리게 → 상단의 미처리 그룹이 시각적으로 도드라짐.
                      (r.status === "resolved" || r.status === "dismissed" ? "opacity-55" : "")
                    }
                  >
                    <td className="py-1.5 pr-3 whitespace-nowrap tabular-nums">{r.created_at?.slice(0, 10)}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap">{REPORT_CATEGORY_LABELS[r.category] ?? r.category}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap">{r.ticker ?? "—"}</td>
                    <td className="py-1.5 pr-3 break-words max-w-[260px]">{r.message}</td>
                    <td className="py-1.5 pr-0 whitespace-nowrap"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
        <div className="mt-3 border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">상태 단계</span>
            <StatusBadge status="new" />
            <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-600">→</span>
            <StatusBadge status="reviewing" />
            <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-600">→</span>
            <StatusBadge status="resolved" />
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
            <StatusBadge status="dismissed" />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            상태 변경은 아직 인앱 기능이 없어 Supabase <code className="text-[10px]">data_reports.status</code>에서 직접 갱신합니다(소유자 게이트).
            분류·전이 절차는 <code className="text-[10px]">docs/ornscore-admin-report-triage-workflow.md</code> 참조.
          </p>
        </div>
      </Panel>
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "ok" | "warn" | "neutral" }) {
  const toneCls =
    tone === "warn"
      ? "text-amber-700 dark:text-amber-400"
      : tone === "ok"
        ? "text-emerald-700 dark:text-emerald-400"
        : "text-zinc-900 dark:text-zinc-100";
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className={"text-lg font-bold tabular-nums " + toneCls}>{value}</div>
    </div>
  );
}

function Panel({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 md:p-4">
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">{desc}</div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-zinc-500 dark:text-zinc-400 py-2">{children}</p>;
}

// 운영자용 리소스 상태 배지 — 공유 분류기(adminResourceState)로 5개 상태를
// 구분해 표시한다. 값(행 내용·이메일·원문 오류)은 절대 노출하지 않고 상태 라벨/힌트만 보여준다.
function ResourceStateLine({ state, className = "" }: { state: ResourceState; className?: string }) {
  const meta = resourceStateMeta(state);
  const badgeCls =
    meta.tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
      : meta.tone === "warn"
        ? "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        : "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";
  return (
    <div className={"flex flex-wrap items-center gap-x-2 gap-y-1 " + className}>
      <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${badgeCls}`}>
        {meta.label}
      </span>
      <span className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">{meta.hint}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = REPORT_STATUS_META[status];
  const cls = meta?.badge ?? "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${cls}`}>
      {meta?.label ?? status}
    </span>
  );
}

// 상태별 집계 칩 — 뱃지 색은 StatusBadge와 동일 어휘. 0건은 흐리게 표시해 "없음"을 한눈에.
function StatusCount({ status, count }: { status: string; count: number }) {
  const meta = REPORT_STATUS_META[status];
  const cls = meta?.badge ?? "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${cls} ${count === 0 ? "opacity-45" : ""}`}>
      {meta?.label ?? status}
      <span className="tabular-nums font-semibold">{count}</span>
    </span>
  );
}

function RowList({ rows, caption }: { rows: { ticker: string; name: string; per: number; pbr: number; roe: number }[]; caption: string }) {
  return (
    <div
      role="region"
      aria-label={`${caption} (가로 스크롤)`}
      tabIndex={0}
      className="-mx-1 overflow-x-auto rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500"
    >
      <table className="min-w-[360px] w-full text-left text-xs">
        <caption className="sr-only">{caption}: 종목명, 코드, PER, PBR, ROE</caption>
        <thead className="text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
          <tr>
            <th className="py-1.5 pr-3 font-medium">종목</th>
            <th className="py-1.5 pr-3 font-medium whitespace-nowrap">코드</th>
            <th className="py-1.5 pr-3 font-medium text-right">PER</th>
            <th className="py-1.5 pr-3 font-medium text-right">PBR</th>
            <th className="py-1.5 pr-0 font-medium text-right">ROE</th>
          </tr>
        </thead>
        <tbody className="text-zinc-700 dark:text-zinc-300">
          {rows.map((r) => (
            <tr key={r.ticker} className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="py-1.5 pr-3">{r.name}</td>
              <td className="py-1.5 pr-3 whitespace-nowrap tabular-nums">{r.ticker}</td>
              <td className="py-1.5 pr-3 text-right tabular-nums">{r.per > 0 ? r.per.toFixed(1) : "—"}</td>
              <td className="py-1.5 pr-3 text-right tabular-nums">{r.pbr > 0 ? r.pbr.toFixed(2) : "—"}</td>
              <td className="py-1.5 pr-0 text-right tabular-nums">{typeof r.roe === "number" ? r.roe.toFixed(1) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
