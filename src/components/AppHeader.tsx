import Link from "next/link";
import { dataMetadata } from "@/lib/realStocks";
import { MobileNav } from "./MobileNav";

function formatKST(iso?: string): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).replace(/\.\s/g, "-").replace(/\.$/, "");
  } catch { return "-"; }
}

export function AppHeader() {
  const dataAsOf = formatKST(dataMetadata.generatedAt);
  return (
    <>
      <header className="border-b border-zinc-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <MobileNav />
          <Link href="/" className="lg:flex hidden items-center gap-2 shrink-0 w-52 lg:w-52">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">V</span>
            <span className="text-base font-semibold tracking-tight text-zinc-900">밸류맵</span>
          </Link>
          <Link href="/" className="lg:hidden flex items-center gap-2 shrink-0">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">V</span>
            <span className="text-base font-semibold tracking-tight text-zinc-900">밸류맵</span>
          </Link>

          <div className="flex-1 flex justify-center max-w-xl mx-auto">
            <div className="w-full relative">
              <input
                type="search"
                placeholder="종목명 · 티커 · 테마 검색 (준비 중)"
                disabled
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-md text-sm placeholder:text-zinc-400 cursor-not-allowed"
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-zinc-500 tabular-nums">{dataMetadata.count}개 종목</span>
            <button type="button" className="px-3 py-1.5 text-zinc-600 hover:text-zinc-900 transition text-sm">로그인</button>
            <button type="button" className="px-3 py-1.5 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition text-sm font-medium">시작하기</button>
          </div>
        </div>
      </header>

      <div className="bg-zinc-50 border-b border-zinc-200">
        <div className="px-4 py-1.5 flex items-center justify-between gap-2 text-[11px] text-zinc-600">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
            <span className="truncate">데이터 기준 <strong className="text-zinc-900 tabular-nums">{dataAsOf}</strong></span>
          </div>
          <span className="text-zinc-500 hidden md:inline whitespace-nowrap">KRX · Naver · yfinance · DART</span>
          <span className="text-zinc-500 md:hidden whitespace-nowrap">KRX · DART</span>
        </div>
      </div>
    </>
  );
}