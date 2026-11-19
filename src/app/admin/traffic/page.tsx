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
  MessageSquare,
  Route,
  Search,
  Share2,
  ShieldCheck,
  Tag,
  UserPlus,
} from "lucide-react";
import { requireAdminAccess } from "@/lib/adminAccess";
import {
  SAMPLE_TRAFFIC_METRICS_FIXTURE,
  createFixtureTrafficMetricsProvider,
  type TrafficMetricWindow,
  type TrafficMetricsResult,
} from "@/lib/adminTrafficMetrics";
import { toTrafficDashboardState, toTrafficSummaryView } from "@/lib/adminTrafficView";
import { growthAggregateConfig } from "@/lib/growthAggregateConfig";
import { GROWTH_WINDOWS, readGrowthTraffic } from "@/lib/growthAggregateReport";
import { growthAggregateStore } from "@/lib/growthAggregateStore";

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
      { name: "route_view_public", meaning: "공개 라우트 1회 진입 — routeKind, 허용된 campaign, 공개 ticker/topic, hasQuery/hasFilters, compareCount만" },
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
      { name: "topic_compare_start", meaning: "주제 상위 후보 비교 시작 — topic, count" },
    ],
  },
  {
    key: "compare",
    title: "비교",
    desc: "비교 집합을 만들고 /compare로 이동하는 흐름.",
    Icon: GitCompare,
    events: [
      { name: "compare_toggle", meaning: "비교 추가/제거 — action, ticker, compact" },
      { name: "compare_curated_interactive_open", meaning: "큐레이션 비교에서 직접 비교 열기 — count" },
      { name: "compare_toast_open", meaning: "비교 토스트에서 /compare로 — ticker" },
      { name: "compare_tray_open", meaning: "플로팅 트레이에서 /compare 열기 — count" },
      { name: "compare_tray_reset", meaning: "비교 집합 비우기 — count" },
    ],
  },
  {
    key: "share",
    title: "공유·추천",
    desc: "종목·비교 공유와 ref=share 재유입. 공유 대상의 이름이나 자유문구는 보내지 않습니다.",
    Icon: Share2,
    events: [
      { name: "stock_share", meaning: "종목 상세 공유 — method, ticker" },
      { name: "compare_share", meaning: "비교 공유 — method, count, surface" },
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
      { name: "watchlist_routine_complete", meaning: "관심종목 점검 완료 — count, changed" },
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
      { name: "stock_recent_compare_open", meaning: "최근 본 두 종목 비교 제안 — ticker, peerTicker" },
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
  {
    key: "beta",
    title: "첫 20명 베타",
    desc: "초대 사용자의 시작·체험 단계·의견 제출 흐름. 자유 의견과 이메일은 분석으로 보내지 않습니다.",
    Icon: MessageSquare,
    events: [
      { name: "beta_start", meaning: "베타 시작 — source(invite/site)" },
      { name: "beta_task_open", meaning: "체험 단계 열기 — step, source" },
      { name: "beta_task_complete", meaning: "단계 완료 표시/취소 — step, action, completedSteps, source" },
      { name: "beta_feedback_submit", meaning: "의견 제출 시도 — rating, friction, completedSteps, source" },
      { name: "beta_feedback_result", meaning: "의견 저장 결과 — result, source" },
    ],
  },
];

const totalEventCount = EVENT_GROUPS.reduce((sum, group) => sum + group.events.length, 0);

// Human labels for the canonical funnel stages (keys come from FUNNEL_STAGE_DEFS).
const FUNNEL_STAGE_LABELS: Record<string, string> = {
  entry: "진입",
  discover_to_detail: "발견 → 상세",
  action_intent: "비교·관심 의도",
  account_intent: "계정 의도",
};
const GROWTH_OUTCOME_LABELS: Record<string, string> = {
  compare: "비교 행동",
  save: "관심 저장",
  return: "점검 재방문",
  share: "공유",
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
function fmtInt(n: number): string {
  return n.toLocaleString("en-US");
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

function TrafficDashboardWindow({
  window,
  result,
}: {
  window: TrafficMetricWindow;
  result: TrafficMetricsResult;
}) {
  const state = toTrafficDashboardState(result);
  return (
    <section aria-label={windowLabel(window)} data-traffic-state={state.status} className="mt-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <h3 className="text-sm font-semibold">{windowLabel(window)}</h3>
      {state.status === "ready" ? (
        <ReadyDashboard summary={state.summary} />
      ) : (
        <DashboardNotice
          tone={state.status === "error" ? "warn" : "neutral"}
          title={state.title}
          body={state.body}
          withLinks={state.status === "not_configured"}
        />
      )}
    </section>
  );
}

function ReadyDashboard({ summary }: { summary: Parameters<typeof toTrafficSummaryView>[0] }) {
  const view = toTrafficSummaryView(summary);
  const populated = view.routeViews.filter((rv) => rv.views > 0);
  const populatedCampaigns = view.campaignViews.filter((campaign) => campaign.views > 0);
  const populatedCampaignOutcomes = view.campaignOutcomes;
  const zeroCount = view.routeViews.length - populated.length;

  return (
    <div className="mt-3 space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <MiniCheck label="공개 라우트 진입 합계" value={`${fmtInt(view.entryCount)}회`} />
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">경로별 진입 (많은 순)</h4>
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

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">캠페인별 진입</h4>
          {populatedCampaigns.length > 0 ? (
            <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
              {populatedCampaigns.map((campaign) => (
                <li key={campaign.campaign} className="flex items-center justify-between gap-2 rounded-md border border-zinc-100 bg-zinc-50 px-2.5 py-1.5 dark:border-zinc-800/60 dark:bg-zinc-950/40">
                  <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-200">ref={campaign.campaign}</span>
                  <span className="tabular-nums text-xs font-semibold text-zinc-900 dark:text-zinc-100">{fmtInt(campaign.views)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">이 창에 캠페인 값이 붙은 진입이 없습니다.</p>
          )}
        </div>
        <div>
          <h4 className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">성장 루프 결과</h4>
          <dl className="grid grid-cols-2 gap-1.5">
            {view.growthOutcomes.map((outcome) => (
              <div key={outcome.key} className="rounded-md border border-zinc-100 bg-zinc-50 px-2.5 py-2 dark:border-zinc-800/60 dark:bg-zinc-950/40">
                <dt className="text-[11px] text-zinc-500 dark:text-zinc-400">{GROWTH_OUTCOME_LABELS[outcome.key] ?? outcome.key}</dt>
                <dd className="mt-0.5 tabular-nums text-sm font-semibold text-zinc-900 dark:text-zinc-100">{fmtInt(outcome.count)}회</dd>
              </div>
            ))}
          </dl>
          <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-500">비교·저장·점검·공유는 순서가 고정된 퍼널이 아니므로 각각 독립 건수로 읽습니다.</p>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">캠페인별 행동 건수</h4>
        {populatedCampaignOutcomes.length > 0 ? (
          <div
            role="region"
            aria-label="캠페인별 성장 행동 (가로 스크롤)"
            tabIndex={0}
            className="-mx-1 overflow-x-auto rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500"
          >
            <table className="min-w-[520px] w-full text-left text-xs">
              <caption className="sr-only">캠페인별 비교, 저장, 점검 재방문, 공유 이벤트 건수</caption>
              <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <tr>
                  <th scope="col" className="py-1.5 pr-3 font-medium">캠페인</th>
                  {view.growthOutcomes.map((outcome) => (
                    <th key={outcome.key} scope="col" className="py-1.5 pr-3 text-right font-medium">
                      {GROWTH_OUTCOME_LABELS[outcome.key] ?? outcome.key}
                    </th>
                  ))}
                  <th scope="col" className="py-1.5 text-right font-medium">합계</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700 dark:text-zinc-300">
                {populatedCampaignOutcomes.map((campaign) => (
                  <tr key={campaign.campaign} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <th scope="row" className="py-2 pr-3 font-mono text-[11px] font-medium">ref={campaign.campaign}</th>
                    {campaign.outcomes.map((outcome) => (
                      <td key={outcome.key} className="py-2 pr-3 text-right tabular-nums">{fmtInt(outcome.count)}</td>
                    ))}
                    <td className="py-2 text-right font-semibold tabular-nums">{fmtInt(campaign.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">이 창에는 캠페인에 귀속된 성장 행동이 없습니다.</p>
        )}
        <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-500">
          같은 탭의 허용된 ref 값을 사용합니다. 전체 행동 합계에는 캠페인 값이 없는 이벤트도 포함됩니다.
        </p>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">퍼널 단계별 건수</h4>
        <dl className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {view.stages.map((stage) => (
            <div key={stage.key} className="rounded-md bg-zinc-50 px-2.5 py-2 dark:bg-zinc-950/40">
              <dt className="text-xs">{stageLabel(stage.key)}</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums">{fmtInt(stage.count)}회</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

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

  const config = growthAggregateConfig();
  const usingFixture = !config && process.env.ADMIN_TRAFFIC_FIXTURE === "1" && !process.env.VERCEL;
  const fixture = usingFixture ? createFixtureTrafficMetricsProvider(SAMPLE_TRAFFIC_METRICS_FIXTURE) : null;
  const results = fixture
    ? await Promise.all((["24h", "72h"] as const).map(async (window) => ({
        window, result: await fixture.getSummary(window),
      })))
    : await readGrowthTraffic(config ? growthAggregateStore(config.databaseUrl) : undefined)
        .then((results) => GROWTH_WINDOWS.map((window) => ({ window, result: results[window] })));

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

      <section aria-label="일별 트래픽 집계" className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Gauge className="h-4 w-4" aria-hidden="true" />
          일별 트래픽 집계
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {usingFixture
            ? "로컬 검증용 예시 데이터입니다."
            : "한국 시간 기준 오늘을 포함합니다. 공개 페이지의 진입과 행동을 이벤트 건수로 집계합니다."}
        </p>
        {results.map(({ window, result }) => <TrafficDashboardWindow key={window} window={window} result={result} />)}
      </section>

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
            기존 수집 수치는 Vercel Analytics에서 확인
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
            <span className="font-medium text-zinc-800 dark:text-zinc-100">3. 비교·관심 의도</span> — <span className="font-mono">topic_compare_start</span> · <span className="font-mono">compare_toggle</span> · <span className="font-mono">watchlist_toggle</span>. 상세는 오는데 이게 0에 가까우면 다음 행동 유도 점검.
          </li>
          <li className="rounded-md border border-zinc-100 bg-zinc-50 p-2 dark:border-zinc-800/60 dark:bg-zinc-950/40">
            <span className="font-medium text-zinc-800 dark:text-zinc-100">4. 계정 의도</span> — <span className="font-mono">auth_cta_click</span>. 실제 가입은 <Link href="/admin/users" className="font-medium underline">가입자 운영 현황</Link>과 교차 확인.
          </li>
        </ol>
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          기간별 진입과 행동 건수를 함께 확인하세요. 일별 집계는 저장소 연결 후부터 누적됩니다. 리뷰 순서·건강/우려 신호 정본은 <span className="font-mono">docs/ornscore-launch-analytics-first-72h-playbook.md</span>.
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
          기존 방문·이벤트 수치는 Vercel Analytics에서, 로그인·가입 수치는 가입자 운영 현황에서 확인하세요.
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
