import Link from "next/link";
import { dataMetadata, allThemes, formatBizDateLong, formatBizDateMobile, businessDaysSince, isDataStale } from "@/lib/realStocks";
import { getAllStocks } from "@/lib/mockData";
import { compositeOf } from "@/lib/score";
import { createClient } from "@/lib/supabase/server";
import { MobileNav } from "./MobileNav";
import { GlobalSearch } from "./GlobalSearch";
import { CompareBadge } from "./CompareBadge";
import { AccountButtons } from "./AccountButtons";
import { UserMenu } from "./UserMenu";
import { WelcomeToast } from "./WelcomeToast";
import { ThemeToggle } from "./ThemeToggle";
import { dataStatus, dataStatusByLocale } from "@/lib/dataStatus";
import { HeaderDataBar, HeaderStockCount } from "./HeaderDataBar";
import { BrandMark } from "./BrandMark";

function formatGeneratedAt(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    // KST 변환
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const now = new Date();
    const nowKst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const diffMs = nowKst.getTime() - kst.getTime();
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffHr < 1) return "방금 전";
    if (diffHr < 24) return `${diffHr}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;
    const mo = String(kst.getUTCMonth() + 1).padStart(2, "0");
    const da = String(kst.getUTCDate()).padStart(2, "0");
    return `${mo}.${da}`;
  } catch {
    return "";
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
  const businessDate = formatBizDateLong(dataMetadata.asOfBusinessDate);
  const businessDateShort = formatBizDateMobile(dataMetadata.asOfBusinessDate);
  const bizDaysSince = businessDaysSince(dataMetadata.asOfBusinessDate);
  const isStale = isDataStale(dataMetadata.asOfBusinessDate);

  const stocks = getAllStocks().map((s) => ({
    ticker: s.ticker,
    name: s.name,
    themes: s.themes,
    compositeScore: Math.round(compositeOf(s)),
  }));
  const themes = allThemes();
  const userEmail = await getUserEmail();

  return (
    <>
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
        <div className="px-3 md:px-4 py-2 md:py-2.5 flex items-center gap-2 md:gap-3">
          <MobileNav userEmail={userEmail} />
          <Link href="/" className="lg:flex hidden items-center gap-2 shrink-0 w-48">
            <BrandMark className="h-7 w-7" />
            <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">오른스코어</span>
          </Link>
          <Link href="/" className="lg:hidden flex min-h-11 min-w-11 items-center justify-center shrink-0 rounded-md" aria-label="홈">
            <BrandMark className="h-7 w-7" />
          </Link>

          <div className="flex-1 flex justify-center max-w-2xl xl:max-w-3xl mx-auto min-w-[9.5rem]">
            <GlobalSearch stocks={stocks} themes={themes} />
          </div>

          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <CompareBadge />
            <HeaderStockCount count={dataMetadata.count} />
            <div className="hidden md:block">
              <ThemeToggle compact />
            </div>
            {userEmail ? <UserMenu email={userEmail} /> : <AccountButtons />}
          </div>
        </div>
      </header>

      <HeaderDataBar
        businessDate={businessDate}
        businessDateShort={businessDateShort}
        businessDateRaw={dataMetadata.asOfBusinessDate ?? ""}
        bizDaysSince={bizDaysSince}
        isStale={isStale}
        hasData={businessDate !== "데이터 준비 중"}
        metricsVersionLabel={dataStatus.metricsVersionLabel}
        statusByLocale={dataStatusByLocale}
      />

      <WelcomeToast />
    </>
  );
}
