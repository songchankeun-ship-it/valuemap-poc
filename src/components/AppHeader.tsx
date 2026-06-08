import Link from "next/link";
import { dataMetadata, allThemes } from "@/lib/realStocks";
import { getAllStocks } from "@/lib/mockData";
import { createClient } from "@/lib/supabase/server";
import { MobileNav } from "./MobileNav";
import { GlobalSearch } from "./GlobalSearch";
import { CompareBadge } from "./CompareBadge";
import { AccountButtons } from "./AccountButtons";
import { UserMenu } from "./UserMenu";
import { WelcomeToast } from "./WelcomeToast";

function formatBusinessDate(dateStr?: string): string {
  if (!dateStr) return "-";
  // dateStr 형식: "YYYYMMDD"
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(dateStr);
  if (!m) return dateStr;
  const [, y, mo, da] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(da));
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${y}.${mo}.${da} (${weekday})`;
}

function formatGeneratedAt(iso?: string): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const mo = String(kst.getUTCMonth() + 1).padStart(2, "0");
    const da = String(kst.getUTCDate()).padStart(2, "0");
    const ho = String(kst.getUTCHours()).padStart(2, "0");
    const mi = String(kst.getUTCMinutes()).padStart(2, "0");
    return `${mo}.${da} ${ho}:${mi}`;
  } catch {
    return "-";
  }
}

/** 영업일 기준 며칠 전인지 계산 (주말 제외) */
function businessDaysSince(dateStr?: string): number | null {
  if (!dateStr) return null;
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const [, y, mo, da] = m;
  const dataDate = new Date(Number(y), Number(mo) - 1, Number(da));
  const now = new Date();
  // KST 기준 오늘 0시
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let days = 0;
  const cursor = new Date(dataDate);
  while (cursor < today) {
    cursor.setDate(cursor.getDate() + 1);
    const wd = cursor.getDay();
    if (wd !== 0 && wd !== 6) days += 1;
  }
  return days;
}

async function getUserEmail(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

export async function AppHeader() {
  const businessDate = formatBusinessDate(dataMetadata.asOfBusinessDate);
  const generatedAt = formatGeneratedAt(dataMetadata.generatedAt);
  const bizDaysSince = businessDaysSince(dataMetadata.asOfBusinessDate);
  // 영업일 2일 이상 지나면 stale 경고 (장 마감 후 갱신 지연 가능성)
  const isStale = bizDaysSince !== null && bizDaysSince >= 2;

  const stocks = getAllStocks().map((s) => ({
    ticker: s.ticker,
    name: s.name,
    themes: s.themes,
  }));
  const themes = allThemes();
  const userEmail = await getUserEmail();

  return (
    <>
      <header className="border-b border-zinc-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="px-3 md:px-4 py-2 md:py-2.5 flex items-center gap-2 md:gap-3">
          <MobileNav userEmail={userEmail} />
          <Link href="/" className="lg:flex hidden items-center gap-2 shrink-0 w-52">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">V</span>
            <span className="text-base font-semibold tracking-tight text-zinc-900">밸류맵</span>
          </Link>
          <Link href="/" className="lg:hidden flex items-center shrink-0" aria-label="홈">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">V</span>
          </Link>

          <div className="flex-1 flex justify-center max-w-xl mx-auto min-w-0">
            <GlobalSearch stocks={stocks} themes={themes} />
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <CompareBadge />
            <span className="hidden md:inline text-[11px] text-zinc-500 tabular-nums">{dataMetadata.count}개 종목</span>
            {userEmail ? <UserMenu email={userEmail} /> : <AccountButtons />}
          </div>
        </div>
      </header>

      <div className={isStale ? "bg-amber-50 border-b border-amber-200" : "bg-zinc-50 border-b border-zinc-200"}>
        <div className="px-3 md:px-4 py-1.5 flex items-center justify-between gap-2 text-[10px] md:text-[11px]">
          <div className={"flex items-center gap-1.5 md:gap-2 min-w-0 " + (isStale ? "text-amber-900" : "text-zinc-600")}>
            <span className={"w-1.5 h-1.5 rounded-full shrink-0 " + (isStale ? "bg-amber-500" : "bg-green-500")} />
            <span className="truncate">
              <span className="hidden sm:inline">최근 영업일 마감 </span>
              <strong className={isStale ? "text-amber-900 tabular-nums" : "text-zinc-900 tabular-nums"}>{businessDate}</strong>
              <span className="hidden sm:inline text-zinc-500"> · 갱신 {generatedAt}</span>
              {isStale ? <span className="ml-1.5 font-semibold">· {bizDaysSince}영업일 전 데이터</span> : null}
            </span>
          </div>
          <span className="text-zinc-500 hidden md:inline whitespace-nowrap">KRX · Naver · yfinance · DART</span>
        </div>
      </div>

      <WelcomeToast />
    </>
  );
}
