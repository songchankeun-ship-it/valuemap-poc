import Link from "next/link";
import { Activity, AlertTriangle, BarChart3, CheckCircle2, Database, ExternalLink, FileSearch, ShieldCheck, Users } from "lucide-react";
import { dataMetadata } from "@/lib/realStocks";
import { dataStatus } from "@/lib/dataStatus";
import { requireAdminAccess } from "@/lib/adminAccess";
import { getPriceLagSummary } from "@/lib/priceLag";
import { readStatusHistory } from "@/lib/statusHistory";

export const metadata = {
  title: "운영 홈 — 오른스코어",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatGeneratedAt(iso?: string): string {
  if (!iso) return "기록 없음";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16).replace("T", " ");
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())} ${pad(kst.getUTCHours())}:${pad(kst.getUTCMinutes())} KST`;
}

function normalizeBaseUrl(value?: string): string {
  const raw = (value || "https://ornscore.com").replace(/\/+$/, "");
  return raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
}

function ToneDot({ tone }: { tone: "ok" | "warn" | "neutral" }) {
  const cls =
    tone === "ok"
      ? "bg-emerald-500"
      : tone === "warn"
        ? "bg-amber-500"
        : "bg-zinc-400 dark:bg-zinc-500";
  return <span aria-hidden="true" className={`mt-1 h-2 w-2 rounded-full ${cls}`} />;
}

export default async function AdminHomePage() {
  const admin = await requireAdminAccess("/admin");
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
            <Link href="/login?next=/admin" className="inline-flex min-h-[44px] items-center rounded-md bg-zinc-900 px-3 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
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

  const sc = dataStatus.selfCheck;
  const priceLag = getPriceLagSummary();
  const history = readStatusHistory();
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
  const vercelEnv = process.env.VERCEL_ENV ?? "local";
  const publicBaseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL,
  );
  const reportMode = process.env.ADMIN_ENABLED === "1" ? "신고 조회 켜짐" : "신고 조회 꺼짐";

  const health = [
    {
      label: "데이터 기준일",
      value: dataStatus.globalAsOfLabel,
      detail: dataStatus.dataStale ? "기준일 지연 가능성 확인" : "공개 화면 기준일과 동일",
      tone: dataStatus.dataStale ? "warn" : "ok",
    },
    {
      label: "산식 버전",
      value: dataStatus.metricsVersionLabel,
      detail: `기대 ${sc.expectedMetricsVersion} · 실제 ${sc.actualMetricsVersion ?? "—"}`,
      tone: sc.metricsVersionMatch ? "ok" : "warn",
    },
    {
      label: "가격 지연 종목",
      value: `${priceLag.count}개`,
      detail: priceLag.count > 0 ? "종목별 가격 기준일 확인 필요" : "전역 기준일과 일치",
      tone: priceLag.count > 0 ? "warn" : "ok",
    },
    {
      label: "상태 이력",
      value: `${history.length}건`,
      detail: history.length > 0 ? "append-only 로그 감지" : "아직 이력 로그 없음",
      tone: history.length > 0 ? "ok" : "neutral",
    },
  ] satisfies Array<{ label: string; value: string; detail: string; tone: "ok" | "warn" | "neutral" }>;

  const links = [
    { href: "/admin/users", title: "가입자 운영 현황", desc: "최근 가입, 대기 신청, 저장 기능 사용", Icon: Users },
    { href: "/admin/status", title: "데이터 상태판", desc: "검증 보류, 결측, 신고 목록", Icon: Database },
    { href: "/status", title: "공개 상태 페이지", desc: "사용자에게 보이는 기준일과 출처", Icon: ShieldCheck },
    { href: "/stocks", title: "종목 목록", desc: "검색 유입 첫 화면 점검", Icon: BarChart3 },
    { href: "/guide/metrics", title: "지표 가이드", desc: "PER/PBR/ROE 검색 유입 점검", Icon: FileSearch },
  ];

  const releaseLinks = [
    { href: `${publicBaseUrl}/`, label: "홈" },
    { href: `${publicBaseUrl}/stocks`, label: "종목" },
    { href: `${publicBaseUrl}/watchlist`, label: "관심" },
    { href: `${publicBaseUrl}/login`, label: "로그인" },
    { href: `${publicBaseUrl}/data-deletion`, label: "데이터 삭제" },
  ];

  const releaseGates = [
    {
      label: "자동 검증",
      value: "라우트 · SEO · 로그인 SSR",
      detail: "verify:local --no-perf로 공개 경로와 로그인 HTML 계약을 확인합니다.",
      tone: "ok",
    },
    {
      label: "사람 확인",
      value: "OAuth 실왕복",
      detail: "카카오 · 구글 · 네이버 · 이메일 링크는 실제 계정으로 마지막에 확인합니다.",
      tone: "warn",
    },
    {
      label: "소유자 승인",
      value: "외부 설정",
      detail: "스토어 · DNS · Search Console · Supabase schema/RLS · 이메일/계정 변경은 승인 후 진행합니다.",
      tone: "neutral",
    },
  ] satisfies Array<{ label: string; value: string; detail: string; tone: "ok" | "warn" | "neutral" }>;
  const liveVerifyCommand = `npm run verify:local -- --base ${publicBaseUrl} --no-perf`;

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 md:px-4 md:py-8">
      <header className="mb-5">
        <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
          내부 운영용 · 검색 비노출
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">운영 홈</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              공개 전후에 확인할 핵심 상태를 한 화면에 모았습니다.
            </p>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-mono">{vercelEnv}</span> · <span className="font-mono">{commitSha}</span>
          </div>
        </div>
      </header>

      <section aria-label="운영 핵심 상태" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {health.map((item) => (
          <div key={item.label} className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start gap-2">
              <ToneDot tone={item.tone} />
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{item.label}</p>
                <p className="mt-0.5 truncate text-lg font-bold tabular-nums text-zinc-950 dark:text-zinc-50">{item.value}</p>
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">{item.detail}</p>
          </div>
        ))}
      </section>

      <section aria-label="운영 진입점" className="mt-5 grid gap-2 md:grid-cols-2">
        {links.map(({ href, title, desc, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-[72px] items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-zinc-950 dark:text-zinc-50">{title}</span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">{desc}</span>
            </span>
            <span aria-hidden="true" className="text-zinc-400 transition group-hover:translate-x-0.5">›</span>
          </Link>
        ))}
      </section>

      <section aria-label="오늘의 운영 체크" className="mt-5 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-zinc-700 dark:text-zinc-300" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">오늘 확인</h2>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <MiniCheck label="점수 생성" value={formatGeneratedAt(dataMetadata.generatedAt)} />
          <MiniCheck label="신고 모드" value={reportMode} />
          <MiniCheck label="검증 보류" value={`${sc.suspectCount}개`} />
        </div>
        {priceLag.count > 0 ? (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              가격 기준일이 늦은 종목이 있습니다. 자세한 목록은 <Link href="/admin/status" className="font-medium underline">데이터 상태판</Link>에서 확인하세요.
            </p>
          </div>
        ) : (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-emerald-50 p-3 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>현재 운영 홈 기준으로 큰 데이터 경고는 없습니다.</p>
          </div>
        )}
      </section>

      <section aria-label="배포 검증" className="mt-5 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-zinc-700 dark:text-zinc-300" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">배포 검증</h2>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          <MiniCheck label="공개 기준" value={publicBaseUrl} />
          <MiniCheck label="배포 환경" value={vercelEnv} />
          <MiniCheck label="커밋" value={commitSha} />
          <MiniCheck label="수동 게이트" value="로그인 왕복" />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          로그인 SSR 검증은 로컬과 운영의 OAuth 제공자 상태 차이를 반영합니다. 실제 OAuth 왕복과 외부 콘솔 변경은 사람 확인 게이트로 남겨둡니다.
        </p>
        <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">운영 URL 게이트</p>
              <code className="mt-1 block break-words rounded-md bg-white px-2 py-1.5 font-mono text-[11px] text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                {liveVerifyCommand}
              </code>
            </div>
            <span className="inline-flex min-h-[32px] shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-2 text-[11px] font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
              자동 검증
            </span>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <MiniCheck label="자동 통과 기준" value="공개 라우트 · SEO · 로그인 SSR" />
            <MiniCheck label="남은 사람 확인" value="OAuth 왕복 · 외부 콘솔" />
          </div>
        </div>
        <div className="mt-3 grid gap-2 lg:grid-cols-3">
          {releaseGates.map((gate) => (
            <GateCard key={gate.label} {...gate} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {releaseLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
            >
              {link.label}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <section aria-label="외부 운영 도구" className="mt-5 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">외부 운영 도구</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="https://search.google.com/search-console?resource_id=sc-domain:ornscore.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
          >
            Search Console
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          <a
            href="https://ornscore.com/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
          >
            Sitemap
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
}

function GateCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "ok" | "warn" | "neutral";
}) {
  const toneClass =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
        : "border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100";

  return (
    <div className={`rounded-md border p-3 ${toneClass}`}>
      <div className="flex items-start gap-2">
        <ToneDot tone={tone} />
        <div className="min-w-0">
          <p className="text-[11px] font-medium opacity-75">{label}</p>
          <p className="mt-0.5 break-words text-sm font-semibold">{value}</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed opacity-75">{detail}</p>
    </div>
  );
}

function MiniCheck({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}
