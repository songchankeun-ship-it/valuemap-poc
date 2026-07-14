import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  AlertTriangle,
  Bell,
  Bookmark,
  Clock3,
  Database,
  GitCompare,
  Mail,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { requireAdminAccess } from "@/lib/adminAccess";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "가입자 운영 현황 — 오른스코어",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const AUTH_SCAN_LIMIT = 500;

type Tone = "ok" | "warn" | "neutral";

interface AuthUserRow {
  id: string;
  email: string;
  createdAt: string | null;
  lastSignInAt: string | null;
  confirmedAt: string | null;
  providers: string;
}

interface WaitlistRow {
  email: string | null;
  source: string | null;
  created_at: string | null;
}

interface UsageMetric {
  key: string;
  label: string;
  detail: string;
  count: number | null;
  uniqueUsers: number | null;
  note: string;
  tone: Tone;
  Icon: typeof Bookmark;
}

interface UserOverview {
  users: AuthUserRow[];
  authNote: string;
  envError: string;
  waitlist: {
    count: number | null;
    rows: WaitlistRow[];
    note: string;
  };
  usage: UsageMetric[];
  fetchedAt: string;
}

const USAGE_TABLES = [
  {
    key: "watchlists",
    label: "관심 종목",
    detail: "로그인 사용자가 클라우드에 저장한 관심 항목",
    table: "watchlists",
    Icon: Bookmark,
  },
  {
    key: "compare_basket",
    label: "비교 바구니",
    detail: "로그인 사용자의 비교 저장 항목",
    table: "compare_basket",
    Icon: GitCompare,
  },
  {
    key: "saved_searches",
    label: "저장 필터",
    detail: "로그인 사용자가 저장한 탐색 조건",
    table: "saved_searches",
    Icon: Search,
  },
  {
    key: "notification_preferences",
    label: "알림 설정",
    detail: "알림 수신 설정을 저장한 계정",
    table: "notification_preferences",
    Icon: Bell,
  },
  {
    key: "condition_alerts",
    label: "조건 알림",
    detail: "조건 알림으로 저장한 필터",
    table: "condition_alerts",
    Icon: Clock3,
  },
] as const;

function formatKst(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16).replace("T", " ");
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())} ${pad(kst.getUTCHours())}:${pad(kst.getUTCMinutes())}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isRecent(iso?: string | null, days = 7): boolean {
  if (!iso) return false;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() - time <= days * 24 * 60 * 60 * 1000;
}

function normalizeAuthUser(user: User): AuthUserRow {
  const providers = new Set<string>();
  const provider = user.app_metadata?.provider;
  if (typeof provider === "string" && provider) providers.add(provider);
  for (const identity of user.identities ?? []) {
    if (identity.provider) providers.add(identity.provider);
  }
  return {
    id: user.id,
    email: user.email ?? "(email 없음)",
    createdAt: user.created_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
    confirmedAt: user.email_confirmed_at ?? user.confirmed_at ?? null,
    providers: providers.size > 0 ? Array.from(providers).join(", ") : "email",
  };
}

async function listAuthUsers(supabase: ReturnType<typeof createAdminClient>): Promise<{ rows: AuthUserRow[]; note: string }> {
  const users: User[] = [];
  let note = "";

  for (let page = 1; users.length < AUTH_SCAN_LIMIT; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return { rows: [], note: `Auth 사용자 목록을 읽지 못했습니다: ${error.message}` };
    const pageUsers = data?.users ?? [];
    users.push(...pageUsers);
    if (pageUsers.length < 100) break;
  }

  if (users.length >= AUTH_SCAN_LIMIT) {
    note = `최대 ${AUTH_SCAN_LIMIT}명까지만 조회했습니다. 전체 수가 더 많으면 Supabase Auth 콘솔에서 추가 확인이 필요합니다.`;
  }

  const rows = users
    .map(normalizeAuthUser)
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

  return { rows, note };
}

async function loadWaitlist(supabase: ReturnType<typeof createAdminClient>): Promise<UserOverview["waitlist"]> {
  const { data, count, error } = await supabase
    .from("waitlist")
    .select("email, source, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    return {
      count: null,
      rows: [],
      note: "waitlist 테이블을 읽지 못했습니다. 테이블 미생성, env 미설정, 권한을 확인하세요.",
    };
  }

  return {
    count: count ?? (data?.length ?? 0),
    rows: ((data ?? []) as WaitlistRow[]).filter(Boolean),
    note: "",
  };
}

async function loadUsageMetric(
  supabase: ReturnType<typeof createAdminClient>,
  spec: (typeof USAGE_TABLES)[number],
): Promise<UsageMetric> {
  const { data, count, error } = await supabase
    .from(spec.table)
    .select("user_id", { count: "exact" })
    .limit(1000);

  if (error) {
    return {
      key: spec.key,
      label: spec.label,
      detail: spec.detail,
      count: null,
      uniqueUsers: null,
      note: "테이블 미생성 또는 권한 확인 필요",
      tone: "warn",
      Icon: spec.Icon,
    };
  }

  const rows = ((data ?? []) as Array<{ user_id?: string | null }>).filter(Boolean);
  const uniqueUsers = new Set(rows.map((row) => row.user_id).filter(Boolean)).size;
  const total = count ?? rows.length;
  const sampled = total > rows.length;

  return {
    key: spec.key,
    label: spec.label,
    detail: spec.detail,
    count: total,
    uniqueUsers,
    note: sampled ? "고유 계정 수는 최대 1000건 샘플 기준" : "",
    tone: total > 0 ? "ok" : "neutral",
    Icon: spec.Icon,
  };
}

async function loadOverview(): Promise<UserOverview> {
  const emptyUsage = USAGE_TABLES.map((spec) => ({
    key: spec.key,
    label: spec.label,
    detail: spec.detail,
    count: null,
    uniqueUsers: null,
    note: "Supabase env 설정 후 조회",
    tone: "neutral" as Tone,
    Icon: spec.Icon,
  }));

  try {
    const supabase = createAdminClient();
    const [auth, waitlist, ...usage] = await Promise.all([
      listAuthUsers(supabase),
      loadWaitlist(supabase),
      ...USAGE_TABLES.map((spec) => loadUsageMetric(supabase, spec)),
    ]);

    return {
      users: auth.rows,
      authNote: auth.note,
      envError: "",
      waitlist,
      usage,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      users: [],
      authNote: "",
      envError: errorMessage(error),
      waitlist: {
        count: null,
        rows: [],
        note: "Supabase service role 환경변수 설정 후 조회됩니다.",
      },
      usage: emptyUsage,
      fetchedAt: new Date().toISOString(),
    };
  }
}

export default async function AdminUsersPage() {
  const admin = await requireAdminAccess("/admin/users");
  if (!admin.allowed) {
    return <ForbiddenAdmin email={admin.email} />;
  }

  const overview = await loadOverview();
  const recentSignups = overview.users.filter((user) => isRecent(user.createdAt)).length;
  const recentLogins = overview.users.filter((user) => isRecent(user.lastSignInAt)).length;
  const confirmedUsers = overview.users.filter((user) => user.confirmedAt).length;

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 md:px-4 md:py-8">
      <header className="mb-5">
        <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
          관리자 전용 · 검색 비노출
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">가입자 운영 현황</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Supabase Auth 가입자, 출시 대기 신청, 로그인 사용자 저장 기능 사용량을 한 화면에서 확인합니다.
            </p>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            조회 {formatKst(overview.fetchedAt)} KST
          </div>
        </div>
      </header>

      {overview.envError ? (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            운영 데이터를 읽으려면 서버 환경변수 <code>SUPABASE_SERVICE_ROLE_KEY</code>와{" "}
            <code>NEXT_PUBLIC_SUPABASE_URL</code>이 필요합니다. 현재 오류: {overview.envError}
          </p>
        </div>
      ) : null}

      <section aria-label="가입자 요약" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="조회된 가입자" value={`${overview.users.length}명`} detail={`${confirmedUsers}명 인증 완료`} tone={overview.users.length > 0 ? "ok" : "neutral"} Icon={Users} />
        <Stat label="최근 7일 가입" value={`${recentSignups}명`} detail="Auth created_at 기준" tone={recentSignups > 0 ? "ok" : "neutral"} Icon={UserCheck} />
        <Stat label="최근 7일 로그인" value={`${recentLogins}명`} detail="last_sign_in_at 기준" tone={recentLogins > 0 ? "ok" : "neutral"} Icon={Clock3} />
        <Stat label="출시 대기 신청" value={overview.waitlist.count === null ? "확인 필요" : `${overview.waitlist.count}건`} detail="waitlist 테이블 기준" tone={overview.waitlist.count && overview.waitlist.count > 0 ? "ok" : "neutral"} Icon={Mail} />
      </section>

      <section aria-label="운영 안내" className="mt-5 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-700 dark:text-zinc-300" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">보호 방식</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              이 화면은 `/admin` 미들웨어와 <code>ADMIN_EMAILS</code> 허용 목록으로 막고, 서버에서만 service role로 조회합니다.
              공개 화면이나 클라이언트 번들에는 가입자 목록과 service role 키가 노출되지 않습니다.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <Panel title="최근 가입자" desc={overview.authNote || `최대 ${AUTH_SCAN_LIMIT}명 조회 후 최근 가입 순으로 표시`}>
          {overview.users.length === 0 ? (
            <Empty>아직 조회된 가입자가 없거나 Supabase Auth Admin 조회가 필요합니다.</Empty>
          ) : (
            <div className="-mx-1 overflow-x-auto px-1">
              <table className="min-w-[680px] w-full text-left text-xs">
                <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  <tr>
                    <th className="py-1.5 pr-3 font-medium">이메일</th>
                    <th className="py-1.5 pr-3 font-medium whitespace-nowrap">가입</th>
                    <th className="py-1.5 pr-3 font-medium whitespace-nowrap">최근 로그인</th>
                    <th className="py-1.5 pr-3 font-medium whitespace-nowrap">인증</th>
                    <th className="py-1.5 pr-0 font-medium whitespace-nowrap">제공자</th>
                  </tr>
                </thead>
                <tbody className="align-top text-zinc-700 dark:text-zinc-300">
                  {overview.users.slice(0, 50).map((user) => (
                    <tr key={user.id} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="max-w-[260px] break-all py-2 pr-3 font-medium text-zinc-900 dark:text-zinc-100">{user.email}</td>
                      <td className="py-2 pr-3 whitespace-nowrap tabular-nums">{formatKst(user.createdAt)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap tabular-nums">{formatKst(user.lastSignInAt)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{user.confirmedAt ? "완료" : "대기"}</td>
                      <td className="py-2 pr-0 whitespace-nowrap">{user.providers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {overview.users.length > 50 ? (
                <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">표는 최근 50명만 표시합니다.</p>
              ) : null}
            </div>
          )}
        </Panel>

        <Panel title="출시 대기 신청" desc={overview.waitlist.note || "최근 12건 표시"}>
          {overview.waitlist.rows.length === 0 ? (
            <Empty>{overview.waitlist.note || "아직 대기 신청이 없습니다."}</Empty>
          ) : (
            <div className="space-y-2">
              {overview.waitlist.rows.map((row, index) => (
                <div key={`${row.email ?? "unknown"}-${row.created_at ?? index}`} className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                  <p className="break-all text-sm font-medium text-zinc-900 dark:text-zinc-100">{row.email ?? "email 없음"}</p>
                  <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    {formatKst(row.created_at)} · {row.source ?? "source 없음"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="앱 기능 사용 현황" desc="로그인 사용자 기준 저장 기능 테이블의 행 수와 고유 계정 수">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {overview.usage.map((metric) => (
            <UsageCard key={metric.key} metric={metric} />
          ))}
        </div>
      </Panel>

      <section aria-label="관련 운영 화면" className="mt-5 flex flex-wrap gap-2">
        <Link href="/admin" className="inline-flex min-h-[44px] items-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
          운영 홈
        </Link>
        <Link href="/admin/status" className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
          <Database className="h-4 w-4" aria-hidden="true" />
          데이터 상태판
        </Link>
      </section>
    </div>
  );
}

function ForbiddenAdmin({ email }: { email: string }) {
  return (
    <div className="mx-auto max-w-2xl px-3 py-10 md:px-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
        <p className="mb-2 text-xs font-medium text-amber-800 dark:text-amber-300">관리자 전용</p>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">접근 권한이 없습니다</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          현재 로그인 계정 <span className="font-mono">{email}</span> 은 관리자 허용 목록에 없습니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/login?next=/admin/users" className="inline-flex min-h-[44px] items-center rounded-md bg-zinc-900 px-3 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
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

function Stat({
  label,
  value,
  detail,
  tone,
  Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
  Icon: typeof Users;
}) {
  const toneClass =
    tone === "ok"
      ? "text-emerald-700 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-700 dark:text-amber-400"
        : "text-zinc-900 dark:text-zinc-100";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className={`mt-0.5 truncate text-lg font-bold tabular-nums ${toneClass}`}>{value}</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">{detail}</p>
    </div>
  );
}

function Panel({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 md:p-4">
      <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{title}</div>
      <div className="mb-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">{desc}</div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{children}</p>;
}

function UsageCard({ metric }: { metric: UsageMetric }) {
  const { Icon } = metric;
  const toneClass =
    metric.tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
      : metric.tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
        : "border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100";

  return (
    <div className={`rounded-md border p-3 ${toneClass}`}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-[11px] font-medium opacity-75">{metric.label}</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums">
            {metric.count === null ? "—" : metric.count}
          </p>
        </div>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed opacity-80">{metric.detail}</p>
      <p className="mt-2 text-[11px] leading-relaxed opacity-75">
        고유 계정 {metric.uniqueUsers === null ? "—" : `${metric.uniqueUsers}명`}
      </p>
      {metric.note ? <p className="mt-1 text-[11px] leading-relaxed opacity-70">{metric.note}</p> : null}
    </div>
  );
}
