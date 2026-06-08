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

function formatDataAsOf(iso?: string): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const y = kst.getUTCFullYear();
    const mo = String(kst.getUTCMonth() + 1).padStart(2, "0");
    const da = String(kst.getUTCDate()).padStart(2, "0");
    const ho = String(kst.getUTCHours()).padStart(2, "0");
    const mi = String(kst.getUTCMinutes()).padStart(2, "0");
    return y + "." + mo + "." + da + " " + ho + ":" + mi;
  } catch {
    return "-";
  }
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
  const dataAsOf = formatDataAsOf(dataMetadata.generatedAt);
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

      <div className="bg-zinc-50 border-b border-zinc-200">
        <div className="px-3 md:px-4 py-1.5 flex items-center justify-between gap-2 text-[10px] md:text-[11px] text-zinc-600">
          <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
            <span className="truncate">
              <strong className="text-zinc-900 tabular-nums">{dataAsOf}</strong> KST <span className="hidden sm:inline">· 최근 거래일 마감</span>
            </span>
          </div>
          <span className="text-zinc-500 hidden md:inline whitespace-nowrap">KRX · Naver · yfinance · DART</span>
        </div>
      </div>

      <WelcomeToast />
    </>
  );
}
