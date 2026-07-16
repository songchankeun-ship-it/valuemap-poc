import Link from "next/link";
import {
  Activity,
  BarChart3,
  Bell,
  Bookmark,
  ExternalLink,
  Eye,
  FileWarning,
  Gauge,
  GitCompare,
  ListChecks,
  Route,
  Search,
  ShieldCheck,
  Tag,
  UserPlus,
} from "lucide-react";
import { requireAdminAccess } from "@/lib/adminAccess";
import {
  SAMPLE_TRAFFIC_METRICS_FIXTURE,
  createFixtureTrafficMetricsProvider,
  isTrafficMetricsReady,
  notConfiguredTrafficMetricsProvider,
  type TrafficMetricWindow,
  type TrafficMetricsProvider,
  type TrafficMetricsResult,
} from "@/lib/adminTrafficMetrics";
import {
  buildWindowComparison,
  toTrafficSummaryView,
  type TrafficSummaryView,
} from "@/lib/adminTrafficView";

export const metadata = {
  title: "트래픽·이벤트 개요 — 오른스코어",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Tone = "ok" | "warn" | "neutral";

interface EventGroup {
  key: string;
  title: string;
  desc: string;
  Icon: typeof Route;
  events: Array<{ name: string; meaning: string }>;
}

// 그룹 정본은 docs/ornscore-analytics-event-map-2026-07-12.md 이벤트 맵입니다.
// 새 이벤트를 추가하면 이 목록도 함께 갱신하세요(표시 전용, 외부 호출 없음).
const EVENT_GROUPS: EventGroup[] = [
  {
    key: "route",
    title: "라우트 진입",
    desc: "공개 페이지 방문 흐름. /admin 계열은 수집에서 제외됩니다.",
    Icon: Route,
    events: [
      { name: "route_view_public", meaning: "공개 라우트 1회 진입 — routeKind, 공개 ticker/topic, hasQuery/hasFilters, compareCount만" },
    ],
  },
  {
    key: "search",
    title: "검색 유입",
    desc: "전역 검색에서 종목·테마로 이어지는 흐름. 검색어 원문은 보내지 않습니다.",
    Icon: Search,
    events: [
      { name: "search_result_open", meaning: "자동완성 결과 클릭/엔터 — source, resultType, ticker, theme, queryLength" },
      { name: "search_view_all", meaning: "전체 보기로 /stocks?q= 확장 — source, queryLength, resultCount" },
      { name: "search_empty_open_stocks", meaning: "결과 없음에서 탐색기 열기 — source, queryLength, stockCount" },
    ],
  },
  {
    key: "topic",
    title: "주제·랜딩",
    desc: "검색 의도 랜딩(/topics)에서 종목·탐색기·저장필터로 이동.",
    Icon: Tag,
    events: [
      { name: "topic_link_click", meaning: "/stocks 주제 링크 진입 — source, topic" },
      { name: "topic_stock_open", meaning: "주제 페이지에서 종목 상세 열기 — topic, ticker" },
      { name: "topic_all_stocks_click", meaning: "주제에서 전체 탐색으로 — topic" },
      { name: "topic_saved_filter_start", meaning: "주제에서 저장 필터 만들기로 — topic, filtered" },
    ],
  },
  {
    key: "compare",
    title: "비교",
    desc: "비교 집합을 만들고 /compare로 이동하는 흐름.",
    Icon: GitCompare,
    events: [
      { name: "compare_toggle", meaning: "비교 추가/제거 — action, ticker, compact" },
      { name: "compare_toast_open", meaning: "비교 토스트에서 /compare로 — ticker" },
      { name: "compare_tray_open", meaning: "플로팅 트레이에서 /compare 열기 — count" },
      { name: "compare_tray_reset", meaning: "비교 집합 비우기 — count" },
    ],
  },
  {
    key: "watchlist",
    title: "관심 종목",
    desc: "관심 저장·복귀·로컬 메타 조작. 종목명·원문·라벨은 보내지 않습니다.",
    Icon: Bookmark,
    events: [
      { name: "watchlist_toggle", meaning: "관심 추가/제거/취소 — action, ticker, compact, loggedOut" },
      { name: "watchlist_detail_open", meaning: "저장된 종목에서 /watchlist 열기 — ticker" },
      { name: "watchlist_toast_open", meaning: "저장 토스트에서 /watchlist로 — ticker" },
      { name: "watchlist_login_cta", meaning: "로그아웃 상태 로그인 유도 — ticker" },
      { name: "watchlist_recent_stock_open", meaning: "최근 본 종목 다시 열기 — ticker, rank" },
      { name: "watchlist_recent_clear", meaning: "최근 본 기록 지우기 — count" },
      { name: "watchlist_recent_search_open", meaning: "최근 검색 칩으로 /stocks?q= 열기 — index, count" },
      { name: "watchlist_csv_export", meaning: "관심 목록 CSV 내보내기 — count, loggedIn, sort" },
      { name: "watchlist_meta_update", meaning: "로컬 그룹/메모 변경 — field, ticker, hasValue, loggedIn" },
      { name: "watchlist_group_filter_change", meaning: "그룹 필터 좁히기 — filter, count, loggedIn" },
    ],
  },
  {
    key: "saved_filter",
    title: "저장 필터",
    desc: "재사용 종목 필터 저장·복귀. 필터 이름·원문 쿼리는 보내지 않습니다.",
    Icon: ShieldCheck,
    events: [
      { name: "saved_filter_watchlist_open", meaning: "저장 필터로 /stocks 열기 — count, hasQuery, hasSector, themeCount" },
      { name: "saved_filter_watchlist_remove", meaning: "저장 필터 제거 — count, hasQuery, hasSector, themeCount" },
      { name: "saved_filter_watchlist_rename", meaning: "저장 필터 이름 변경 — count, hasQuery, hasSector, themeCount" },
      { name: "saved_filter_empty_recent_search_open", meaning: "빈 상태 최근검색 칩으로 — index, count" },
      { name: "saved_filter_empty_starter_open", meaning: "빈 상태 스타터 링크 — kind" },
      { name: "saved_filter_notification_settings_open", meaning: "저장필터 헤더에서 알림 설정 — count" },
      { name: "saved_filter_add_open", meaning: "저장필터 헤더에서 조건 추가 — count" },
    ],
  },
  {
    key: "stock_detail",
    title: "종목 상세 행동",
    desc: "상세 페이지의 근거 열람·체크리스트. 점수값·라벨·원문은 보내지 않습니다.",
    Icon: BarChart3,
    events: [
      { name: "stock_recent_change_basis_open", meaning: "변화 헤더에서 산식 근거 열기 — ticker, target" },
      { name: "stock_recent_change_card_open", meaning: "변화 요약 카드 열기 — ticker, kind, tone, target" },
      { name: "stock_recent_change_priority_open", meaning: "우선 근거 링크 따라가기 — ticker, kind, tone, target" },
      { name: "stock_checklist_next_open", meaning: "다음 체크리스트 단계 — ticker, step" },
      { name: "stock_checklist_routine_open", meaning: "체크리스트 완료 후 루틴 열기 — ticker" },
      { name: "stock_checklist_reset", meaning: "로컬 체크리스트 초기화 — ticker, done, total" },
    ],
  },
  {
    key: "auth_report",
    title: "계정·신고",
    desc: "로그인 진입과 데이터 신고 시도. 메시지·이메일 본문은 보내지 않습니다.",
    Icon: UserPlus,
    events: [
      { name: "auth_cta_click", meaning: "헤더 로그인/시작 링크 — source, hasNext, path" },
      { name: "report_data_issue_open", meaning: "데이터 신고 폼 열기 — ticker" },
      { name: "report_data_issue_submit", meaning: "신고 제출 시도 — category, ticker, hasEmail" },
      { name: "report_data_issue_result", meaning: "신고 결과 — result, category, ticker" },
    ],
  },
];

const totalEventCount = EVENT_GROUPS.reduce((sum, group) => sum + group.events.length, 0);

// --- numeric dashboard shell (built on the TrafficMetricsProvider contract) ---
// The shell binds to a provider and renders whatever it returns — truthfully.
// In production (and by default locally) the provider is the not_configured
// empty state, so the shell invents no numbers: the real anonymous figures live
// in the external Vercel Analytics dashboard until an owner wires a real Option-C
// adapter (vendor token + server route + retention). Fixture data is used ONLY
// for local loopback verification, behind an env gate that can never fire on
// Vercel — see selectTrafficMetricsProvider below.
const PRIMARY_WINDOW: TrafficMetricWindow = "24h";
const COMPARISON_WINDOW: TrafficMetricWindow = "72h";

// Human labels for the canonical funnel stages (keys come from FUNNEL_STAGE_DEFS).
const FUNNEL_STAGE_LABELS: Record<string, string> = {
  entry: "진입",
  discover_to_detail: "발견 → 상세",
  action_intent: "비교·관심 의도",
  account_intent: "계정 의도",
};
const WINDOW_LABELS: Record<TrafficMetricWindow, string> = {
  "24h": "최근 24시간",
  "72h": "최근 72시간",
  "7d": "최근 7일",
  "30d": "최근 30일",
};

function stageLabel(key: string): string {
  return FUNNEL_STAGE_LABELS[key] ?? key;
}
function windowLabel(window: TrafficMetricWindow): string {
  return WINDOW_LABELS[window] ?? window;
}
// A ratio → percent string; null (no basis to compute) renders as "—", never 0%.
function fmtPct(rate: number | null): string {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}
function fmtInt(n: number): string {
  return n.toLocaleString("en-US");
}

// Select the provider the shell binds to. Default: the not_configured empty
// state (no live call, no invented numbers) — the production and default-local
// reality. The deterministic sample fixture is opt-in ONLY for local loopback
// verification (ADMIN_TRAFFIC_FIXTURE=1) and is hard-gated off whenever VERCEL is
// set, so real deployments can never render fixture numbers.
function selectTrafficMetricsProvider(): { provider: TrafficMetricsProvider; usingFixture: boolean } {
  const fixtureRequested = process.env.ADMIN_TRAFFIC_FIXTURE === "1";
  const onVercel = Boolean(process.env.VERCEL);
  if (fixtureRequested && !onVercel) {
    return { provider: createFixtureTrafficMetricsProvider(SAMPLE_TRAFFIC_METRICS_FIXTURE), usingFixture: true };
  }
  return { provider: notConfiguredTrafficMetricsProvider, usingFixture: false };
}

function ToneDot({ tone }: { tone: Tone }) {
  const cls =
    tone === "ok"
      ? "bg-emerald-500"
      : tone === "warn"
        ? "bg-amber-500"
        : "bg-zinc-400 dark:bg-zinc-500";
  return <span aria-hidden="true" className={`mt-1 h-2 w-2 rounded-full ${cls}`} />;
}

function MiniCheck({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}

// The numeric dashboard shell. Renders the provider result truthfully across all
// four branches (ready / not_configured / unavailable / — plus the fixture label
// on ready). Every rendered number comes from the provider summary via the pure
// derivations in adminTrafficView; nothing is invented.
function TrafficDashboardShell({
  primary,
  comparison,
  usingFixture,
}: {
  primary: TrafficMetricsResult;
  comparison: TrafficMetricsResult;
  usingFixture: boolean;
}) {
  const ready = isTrafficMetricsReady(primary);
  const badge = ready
    ? usingFixture
      ? { tone: "warn" as Tone, text: "로컬 검증용 예시 데이터" }
      : { tone: "ok" as Tone, text: "실데이터 연동" }
    : primary.status === "unavailable"
      ? { tone: "warn" as Tone, text: "일시적으로 불러올 수 없음" }
      : { tone: "neutral" as Tone, text: "미연동 · 외부 대시보드" };
  const badgeCls =
    badge.tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
      : badge.tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
        : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";

  return (
    <section aria-label="트래픽 수치" className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-zinc-700 dark:text-zinc-300" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">트래픽 수치 (대시보드 셸)</h2>
        </div>
        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${badgeCls}`}>
          {badge.text}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        {windowLabel(PRIMARY_WINDOW)} 기준 · {windowLabel(COMPARISON_WINDOW)}와 퍼널 모양 비교. 수치는 연동된 제공자에서만 나오며, 없으면 아래처럼 빈 상태로 표시합니다(임의 값 없음).
      </p>

      {ready ? (
        <ReadyDashboard primary={primary.summary} comparison={comparison} usingFixture={usingFixture} />
      ) : primary.status === "unavailable" ? (
        <DashboardNotice
          tone="warn"
          title="지금은 트래픽 수치를 불러올 수 없습니다"
          body={primary.reason}
        />
      ) : (
        <DashboardNotice
          tone="neutral"
          title="아직 관리자 화면에 트래픽 수치가 연동되지 않았습니다"
          body={primary.reason}
          withLinks
        />
      )}
    </section>
  );
}

// The ready numeric view: totals, route buckets, funnel conversion ratios, and a
// compact cross-window comparison. All values come from the summaries.
function ReadyDashboard({
  primary,
  comparison,
  usingFixture,
}: {
  primary: Parameters<typeof toTrafficSummaryView>[0];
  comparison: TrafficMetricsResult;
  usingFixture: boolean;
}) {
  const view = toTrafficSummaryView(primary);
  const populated = view.routeViews.filter((rv) => rv.views > 0);
  const zeroCount = view.routeViews.length - populated.length;
  const comparisonView: TrafficSummaryView | null = isTrafficMetricsReady(comparison)
    ? toTrafficSummaryView(comparison.summary)
    : null;
  const comparisonRows = comparisonView ? buildWindowComparison(view, comparisonView).filter((r) => r.key !== "entry") : [];

  return (
    <div className="mt-3 space-y-4">
      {usingFixture && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          아래 수치는 <span className="font-semibold">로컬 검증용 예시 픽스처</span>입니다 — 실제 방문·이벤트가 아닙니다. 운영 배포에서는 절대 표시되지 않습니다.
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        <MiniCheck label="기준 창" value={windowLabel(view.window)} />
        <MiniCheck label="공개 라우트 진입 합계" value={`${fmtInt(view.totalRouteViews)}회`} />
        <MiniCheck label="퍼널 진입" value={`${fmtInt(view.entryCount)}회`} />
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">경로별 진입 (많은 순)</h3>
        {populated.length === 0 ? (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">이 창에 집계된 경로 진입이 없습니다.</p>
        ) : (
          <>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {populated.map((rv) => (
                <li key={rv.routeKind} className="flex items-center justify-between gap-2 rounded-md border border-zinc-100 bg-zinc-50 px-2.5 py-1.5 dark:border-zinc-800/60 dark:bg-zinc-950/40">
                  <span className="truncate font-mono text-[11px] text-zinc-700 dark:text-zinc-200">{rv.routeKind}</span>
                  <span className="shrink-0 tabular-nums text-xs font-semibold text-zinc-900 dark:text-zinc-100">{fmtInt(rv.views)}</span>
                </li>
              ))}
            </ul>
            {zeroCount > 0 && (
              <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">그 외 {zeroCount}개 경로는 이 창에서 0회.</p>
            )}
          </>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">런치 퍼널 전환율</h3>
        <div
          role="region"
          aria-label="런치 퍼널 전환율 (가로 스크롤)"
          tabIndex={0}
          className="-mx-1 overflow-x-auto rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500"
        >
          <table className="min-w-[420px] w-full text-left text-xs">
            <caption className="sr-only">런치 퍼널 전환율: 단계, 건수, 직전 단계 대비, 진입 대비</caption>
            <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              <tr>
                <th scope="col" className="py-1.5 pr-3 font-medium">단계</th>
                <th scope="col" className="py-1.5 pr-3 font-medium text-right">건수</th>
                <th scope="col" className="py-1.5 pr-3 font-medium text-right">직전 대비</th>
                <th scope="col" className="py-1.5 pr-0 font-medium text-right">진입 대비</th>
              </tr>
            </thead>
            <tbody className="text-zinc-700 dark:text-zinc-300">
              {view.stages.map((stage) => (
                <tr key={stage.key} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-1.5 pr-3">{stageLabel(stage.key)}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{fmtInt(stage.count)}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{stage.isEntry ? "—" : fmtPct(stage.stepRate)}</td>
                  <td className="py-1.5 pr-0 text-right tabular-nums">{stage.isEntry ? "기준" : fmtPct(stage.entryRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          창 비교 · 진입 대비 전환 ({windowLabel(view.window)} vs {windowLabel(COMPARISON_WINDOW)})
        </h3>
        {comparisonView && comparisonRows.length > 0 ? (
          <div
            role="region"
            aria-label="창 비교 전환율 (가로 스크롤)"
            tabIndex={0}
            className="-mx-1 overflow-x-auto rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500"
          >
            <table className="min-w-[420px] w-full text-left text-xs">
              <caption className="sr-only">창 비교: 단계별 진입 대비 전환율을 두 기간으로 나란히</caption>
              <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <tr>
                  <th scope="col" className="py-1.5 pr-3 font-medium">단계</th>
                  <th scope="col" className="py-1.5 pr-3 font-medium text-right">{windowLabel(view.window)}</th>
                  <th scope="col" className="py-1.5 pr-0 font-medium text-right">{windowLabel(COMPARISON_WINDOW)}</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700 dark:text-zinc-300">
                {comparisonRows.map((row) => (
                  <tr key={row.key} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-1.5 pr-3">{stageLabel(row.key)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{fmtPct(row.primaryRate)}</td>
                    <td className="py-1.5 pr-0 text-right tabular-nums">{fmtPct(row.comparisonRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {windowLabel(COMPARISON_WINDOW)} 창은 현재 불러올 수 없어 비교를 생략합니다
            {comparison.status !== "ready" ? ` (${comparison.reason})` : ""}.
          </p>
        )}
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          두 기간의 길이가 다르므로 총량이 아니라 <span className="font-medium">전환 비율(모양)</span>으로 읽습니다. 값이 없으면(분모 0) 임의 0% 대신 &quot;—&quot;로 둡니다.
        </p>
      </div>
    </div>
  );
}

// The empty / degraded state. `not_configured` (default, production reality) and
// `unavailable` (transient) both land here — an honest message, never fake data.
function DashboardNotice({
  tone,
  title,
  body,
  withLinks = false,
}: {
  tone: "warn" | "neutral";
  title: string;
  body: string;
  withLinks?: boolean;
}) {
  const cls =
    tone === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
      : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200";
  return (
    <div className={`mt-3 rounded-md border p-3 ${cls}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed opacity-90">{body}</p>
      {withLinks && (
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="https://vercel.com/analytics"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
          >
            Vercel Analytics
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          <Link
            href="/admin/users"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            가입자 운영 현황
          </Link>
        </div>
      )}
    </div>
  );
}

export default async function AdminTrafficPage() {
  const admin = await requireAdminAccess("/admin/traffic");
  if (!admin.allowed) {
    return (
      <div className="mx-auto max-w-2xl px-3 py-10 md:px-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="mb-2 text-xs font-medium text-amber-800 dark:text-amber-300">관리자 전용</p>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">접근 권한이 없습니다</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            현재 로그인 계정 <span className="font-mono">{admin.email}</span> 은 관리자 허용 목록에 없습니다.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/login?next=/admin/traffic" className="inline-flex min-h-[44px] items-center rounded-md bg-zinc-900 px-3 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
              다른 계정으로 로그인
            </Link>
            <Link href="/" className="inline-flex min-h-[44px] items-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
              홈으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const collecting = Boolean(process.env.VERCEL);

  // Numeric dashboard shell: bind to a provider and fetch the primary +
  // comparison windows. Both branches make ZERO network calls (not_configured
  // returns immediately; the fixture is offline/deterministic).
  const { provider, usingFixture } = selectTrafficMetricsProvider();
  const [primaryResult, comparisonResult] = await Promise.all([
    provider.getSummary(PRIMARY_WINDOW),
    provider.getSummary(COMPARISON_WINDOW),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 md:px-4 md:py-8">
      <header className="mb-5">
        <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
          내부 운영용 · 검색 비노출
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">트래픽·이벤트 개요</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              지금 무엇을 어떻게 수집하는지, 실제 수치는 어디서 보는지 한 화면에 정리했습니다.
            </p>
          </div>
          <Link href="/admin" className="inline-flex min-h-[44px] items-center self-start text-xs text-zinc-500 underline hover:text-zinc-700 md:min-h-0 dark:text-zinc-400 dark:hover:text-zinc-200">
            ← 운영 홈
          </Link>
        </div>
      </header>

      <TrafficDashboardShell
        primary={primaryResult}
        comparison={comparisonResult}
        usingFixture={usingFixture}
      />

      <section aria-label="수집 요약" className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start gap-2">
            <ToneDot tone={collecting ? "ok" : "neutral"} />
            <div className="min-w-0">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">수집 도구</p>
              <p className="mt-0.5 truncate text-lg font-bold text-zinc-950 dark:text-zinc-50">Vercel Analytics</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {collecting ? "운영 환경에서 익명 방문·이벤트 수집 중" : "로컬에서는 수집 비활성 (운영 배포 시 활성)"}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start gap-2">
            <ToneDot tone="ok" />
            <div className="min-w-0">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">진입 신호</p>
              <p className="mt-0.5 truncate text-lg font-bold text-zinc-950 dark:text-zinc-50">route_view_public</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            공개 라우트 1회 진입마다 전송 · /admin 계열 제외
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start gap-2">
            <ToneDot tone="ok" />
            <div className="min-w-0">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">추적 이벤트</p>
              <p className="mt-0.5 truncate text-lg font-bold tabular-nums text-zinc-950 dark:text-zinc-50">{totalEventCount}종</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {EVENT_GROUPS.length}개 그룹 · 아래에서 그룹별로 확인
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start gap-2">
            <ToneDot tone="warn" />
            <div className="min-w-0">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">실제 수치</p>
              <p className="mt-0.5 truncate text-lg font-bold text-zinc-950 dark:text-zinc-50">외부 대시보드</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            숫자는 관리자 화면이 아니라 Vercel Analytics에서 확인
          </p>
        </div>
      </section>

      <section aria-label="개인정보 안전 경계" className="mt-5 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-zinc-700 dark:text-zinc-300" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">무엇을 보내고, 무엇을 보내지 않나</h2>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
            <p className="font-medium">보냄 (익명·공개 식별자)</p>
            <p className="mt-1 opacity-90">routeKind, 공개 ticker/topic slug, hasQuery/hasFilters, compareCount, category 같은 고정 코드값.</p>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="font-medium">보내지 않음</p>
            <p className="mt-1 opacity-90">검색어 원문, 신고 메시지·이메일 본문, 이름/자유 입력, 전체 URL, 인증·계정 식별자.</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          로그인 활동(가입·최근 로그인)은 별도로 <Link href="/admin/users" className="font-medium underline">가입자 운영 현황</Link>에서 봅니다.
          운영 페이지(/admin 계열)는 공개 분석 수집에서 제외됩니다. 정본은 <span className="font-mono">docs/ornscore-analytics-event-map-2026-07-12.md</span>.
        </p>
      </section>

      <section aria-label="출시 후 리뷰 순서" className="mt-5 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-zinc-700 dark:text-zinc-300" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">출시 후 24–72시간: 무엇을 먼저 보나</h2>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          첫 리뷰의 목표는 방문 총량이 아니라 <span className="font-medium text-zinc-700 dark:text-zinc-200">퍼널 모양</span>입니다 — 발견에서 실제 행동으로 넘어가는지.
        </p>
        <ol className="mt-3 space-y-2 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">
          <li className="rounded-md border border-zinc-100 bg-zinc-50 p-2 dark:border-zinc-800/60 dark:bg-zinc-950/40">
            <span className="font-medium text-zinc-800 dark:text-zinc-100">1. 진입</span> — <span className="font-mono">route_view_public</span>이 뜨는지(생존 확인). 0이면 배포·환경부터 의심.
          </li>
          <li className="rounded-md border border-zinc-100 bg-zinc-50 p-2 dark:border-zinc-800/60 dark:bg-zinc-950/40">
            <span className="font-medium text-zinc-800 dark:text-zinc-100">2. 발견 → 상세</span> — <span className="font-mono">home_candidate_open</span> · <span className="font-mono">search_result_open</span> · <span className="font-mono">topic_stock_open</span>. 가장 중요한 전환 지점.
          </li>
          <li className="rounded-md border border-zinc-100 bg-zinc-50 p-2 dark:border-zinc-800/60 dark:bg-zinc-950/40">
            <span className="font-medium text-zinc-800 dark:text-zinc-100">3. 비교·관심 의도</span> — <span className="font-mono">compare_toggle</span> · <span className="font-mono">watchlist_toggle</span>. 상세는 오는데 이게 0에 가까우면 다음 행동 유도 점검.
          </li>
          <li className="rounded-md border border-zinc-100 bg-zinc-50 p-2 dark:border-zinc-800/60 dark:bg-zinc-950/40">
            <span className="font-medium text-zinc-800 dark:text-zinc-100">4. 계정 의도</span> — <span className="font-mono">auth_cta_click</span>. 실제 가입은 <Link href="/admin/users" className="font-medium underline">가입자 운영 현황</Link>과 교차 확인.
          </li>
        </ol>
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          절대 수치가 아니라 <span className="font-medium">비율·방향·전일 대비 변화</span>로 읽습니다(베타 초기 표본은 작음). 운영 영역 안의 직접 숫자 대시보드는 외부 API 토큰·저장 설정이 필요해 오너 게이트로 남습니다. 리뷰 순서·건강/우려 신호 정본은 <span className="font-mono">docs/ornscore-launch-analytics-first-72h-playbook.md</span>.
        </p>
      </section>

      <section aria-label="이벤트 그룹" className="mt-5 grid gap-2 md:grid-cols-2">
        {EVENT_GROUPS.map(({ key, title, desc, Icon, events }) => (
          <div key={key} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{title}</h3>
                  <span className="shrink-0 text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">{events.length}종</span>
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">{desc}</p>
              </div>
            </div>
            <ul className="mt-3 space-y-2">
              {events.map((event) => (
                <li key={event.name} className="rounded-md border border-zinc-100 bg-zinc-50 p-2 dark:border-zinc-800/60 dark:bg-zinc-950/40">
                  <p className="break-words font-mono text-[11px] font-medium text-zinc-800 dark:text-zinc-100">{event.name}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">{event.meaning}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section aria-label="실제 수치 보기" className="mt-5 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-zinc-700 dark:text-zinc-300" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">실제 수치는 여기서</h2>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <MiniCheck label="익명 방문·이벤트" value="Vercel Analytics 대시보드" />
          <MiniCheck label="로그인·가입 활동" value="/admin/users (Supabase Auth)" />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          이 화면은 외부 API를 호출하지 않습니다. 위 이벤트의 실제 집계 수치는 Vercel Analytics에서, 로그인·가입 수치는 가입자 운영 현황에서 확인하세요.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="https://vercel.com/analytics"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
          >
            Vercel Analytics
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          <Link
            href="/admin/users"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            가입자 운영 현황
          </Link>
        </div>
      </section>

      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
        <FileWarning className="h-3.5 w-3.5" aria-hidden="true" />
        이 목록은 표시 전용입니다. 이벤트를 추가·변경하면 이벤트 맵 문서와 이 페이지의 그룹을 함께 갱신하세요.
      </p>
    </div>
  );
}
