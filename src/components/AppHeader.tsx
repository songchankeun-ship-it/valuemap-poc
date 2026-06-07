import Link from "next/link";
import { dataMetadata, allThemes } from "@/lib/realStocks";
import { getAllStocks } from "@/lib/mockData";
import { MobileNav } from "./MobileNav";
import { GlobalSearch } from "./GlobalSearch";
import { CompareBadge } from "./CompareBadge";

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

export function AppHeader() {
  const dataAsOf = formatDataAsOf(dataMetadata.generatedAt);
  const stocks = getAllStocks().map((s) => ({
    ticker: s.ticker,
    name: s.name,
    themes: s.themes,
  }));
  const themes = allThemes();

  return (
    <>
      <header className="border-b border-zinc-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <MobileNav />
          <Link href="/" className="lg:flex hidden items-center gap-2 shrink-0 w-52">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">V</span>
            <span className="text-base font-semibold tracking-tight text-zinc-900">밸류맵</span>
          </Link>
          <Link href="/" className="lg:hidden flex items-center gap-2 shrink-0">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">V</span>
            <span className="text-base font-semibold tracking-tight text-zinc-900">밸류맵</span>
          </Link>

          <div className="flex-1 flex justify-center max-w-xl mx-auto">
            <GlobalSearch stocks={stocks} themes={themes} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CompareBadge />
            <span className="hidden md:inline text-[11px] text-zinc-500 tabular-nums">{dataMetadata.count}개 종목</span>
            <button type="button" className="hidden md:inline-block px-3 py-1.5 text-zinc-600 hover:text-zinc-900 transition text-sm">로그인</button>
            <button type="button" className="hidden md:inline-block px-3 py-1.5 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition text-sm font-medium">시작하기</button>
          </div>
        </div>
      </header>

      <div className="bg-zinc-50 border-b border-zinc-200">
        <div className="px-4 py-1.5 flex items-center justify-between gap-2 text-[11px] text-zinc-600">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
            <span className="truncate">
              데이터 기준 <strong className="text-zinc-900 tabular-nums">{dataAsOf}</strong> KST · 최근 거래일 마감 기준
            </span>
          </div>
          <span className="text-zinc-500 hidden md:inline whitespace-nowrap">KRX · Naver · yfinance · DART</span>
          <span className="text-zinc-500 md:hidden whitespace-nowrap">KRX · DART</span>
        </div>
      </div>
    </>
  );
}