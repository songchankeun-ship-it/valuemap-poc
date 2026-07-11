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
import { redirect } from "next/navigation";
import { realStockPool } from "@/lib/realStocks";
import { isSuspect } from "@/lib/dataQuality";
import { dataStatus } from "@/lib/dataStatus";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

const FALLBACK_ADMIN_EMAILS = ["contact@ornscore.com"];

function adminEmailSet(): Set<string> {
  const configured = (process.env.ADMIN_EMAILS ?? process.env.ORNSCORE_ADMIN_EMAILS ?? "")
    .split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const emails = configured.length > 0 ? configured : FALLBACK_ADMIN_EMAILS;
  return new Set(emails.map((email) => email.toLowerCase()));
}

async function requireAdminAccess(): Promise<{ email: string; allowed: boolean }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.trim().toLowerCase();
  if (!email) {
    redirect(`/login?next=${encodeURIComponent("/admin/status")}`);
  }
  return { email, allowed: adminEmailSet().has(email) };
}

async function loadReports(): Promise<{ rows: DataReport[]; note: string }> {
  if (process.env.ADMIN_ENABLED !== "1") {
    return { rows: [], note: "ADMIN_ENABLED=1 설정 시 신고 목록을 표시합니다(개인정보 보호)." };
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("data_reports")
      .select("id, created_at, category, ticker, message, email, status")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      return { rows: [], note: "data_reports 테이블을 읽지 못했습니다(미생성 또는 권한). SQL은 라우트 주석 참조." };
    }
    return { rows: (data as DataReport[]) ?? [], note: "" };
  } catch {
    return { rows: [], note: "Supabase env 미설정으로 신고 목록을 조회하지 못했습니다." };
  }
}

export default async function AdminStatusPage() {
  const admin = await requireAdminAccess();
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
  const { rows: reports, note: reportNote } = await loadReports();

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
        기대 산식 {sc.expectedMetricsVersion} · 실제 {sc.actualMetricsVersion ?? "—"}
      </p>

      <Panel title={`검증 보류 종목 (${suspects.length})`} desc="PER·PBR·ROE 극단값 — 오늘 후보·Top에서 제외">
        {suspects.length === 0 ? (
          <Empty>검증 보류 종목이 없습니다.</Empty>
        ) : (
          <RowList rows={suspects.map((s) => ({ ticker: s.ticker, name: s.name, per: s.per, pbr: s.pbr, roe: s.roe }))} />
        )}
      </Panel>

      <Panel title={`PER·PBR 결측 종목 (${missing.length})`} desc="밸류 해석 신뢰도가 낮은 종목">
        {missing.length === 0 ? (
          <Empty>결측 종목이 없습니다.</Empty>
        ) : (
          <RowList rows={missing.map((s) => ({ ticker: s.ticker, name: s.name, per: s.per, pbr: s.pbr, roe: s.roe }))} />
        )}
      </Panel>

      <Panel title={`접수된 데이터 오류 신고 (${reports.length})`} desc="data_reports 최근 50건">
        {reportNote ? (
          <Empty>{reportNote}</Empty>
        ) : reports.length === 0 ? (
          <Empty>접수된 신고가 없습니다.</Empty>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="min-w-[560px] w-full text-left text-xs">
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
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-1.5 pr-3 whitespace-nowrap tabular-nums">{r.created_at?.slice(0, 10)}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap">{r.category}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap">{r.ticker ?? "—"}</td>
                    <td className="py-1.5 pr-3 break-words max-w-[260px]">{r.message}</td>
                    <td className="py-1.5 pr-0 whitespace-nowrap">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

function RowList({ rows }: { rows: { ticker: string; name: string; per: number; pbr: number; roe: number }[] }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="min-w-[360px] w-full text-left text-xs">
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
