"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Search, Megaphone, FlaskConical, BookOpen, Heart, Menu, X, LogOut, GitCompare, Bot, Info, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "./ThemeToggle";

const ITEMS = [
  { href: "/today", Icon: CalendarDays, label: "오늘", group: "" },
  { href: "/stocks", Icon: Search, label: "종목 찾기", group: "" },
  { href: "/watchlist", Icon: Heart, label: "관심 종목", group: "" },
  { href: "/compare", Icon: GitCompare, label: "비교", group: "분석 도구" },
  { href: "/disclosures", Icon: Megaphone, label: "공시 신호", group: "분석 도구" },
  { href: "/backtest", Icon: FlaskConical, label: "백테스트", group: "분석 도구" },
  { href: "/history", Icon: Bot, label: "분석 기록", group: "분석 도구" },
  { href: "/pricing", Icon: CreditCard, label: "요금제", group: "도움말" },
  { href: "/guide/metrics", Icon: BookOpen, label: "지표 가이드", group: "도움말" },
  { href: "/about", Icon: Info, label: "서비스 소개", group: "도움말" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileNav({ userEmail }: { userEmail: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.refresh();
  }

  const loginNext =
    pathname && pathname !== "/" && pathname !== "/login"
      ? `?next=${encodeURIComponent(pathname)}`
      : "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-300"
      >
        <Menu className="w-5 h-5" strokeWidth={2} />
      </button>

      {open ? (
        <>
          <div
            onClick={() => setOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/70 z-[60] backdrop-blur-sm"
            aria-hidden
          />
          <div className="lg:hidden fixed inset-y-0 left-0 w-[300px] max-w-[85vw] bg-white dark:bg-zinc-950 z-[61] shadow-2xl flex flex-col border-r-2 border-zinc-900/10 dark:border-zinc-100/10">
            <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 28 28" fill="none" aria-hidden="true"><circle cx="13" cy="15" r="7" stroke="white" strokeWidth="2.4"/><path d="M8 19L20 8" stroke="white" strokeWidth="2.4" strokeLinecap="round"/></svg></span>
                <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">오른스코어</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="메뉴 닫기"
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {ITEMS.map((item, idx) => {
                const active = isActive(pathname, item.href);
                const Icon = item.Icon;
                const showGroup = item.group !== "" && item.group !== (ITEMS[idx - 1]?.group ?? "");
                return (
                  <div key={item.href}>
                    {showGroup ? (
                      <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3 pt-3 pb-1">{item.group}</div>
                    ) : null}
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={
                        "flex items-center gap-3 px-3 py-3 rounded-md text-sm transition " +
                        (active
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800")
                      }
                    >
                      <Icon className="w-5 h-5 shrink-0" strokeWidth={1.8} />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  </div>
                );
              })}
            </nav>

            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">테마</span>
                <ThemeToggle />
              </div>

              {userEmail ? (
                <>
                  <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-md">
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">로그인 됨</div>
                    <div className="text-xs text-zinc-900 dark:text-zinc-100 font-medium truncate">{userEmail}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-sm font-medium transition"
                  >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </button>
                </>
              ) : (
                <Link
                  href={`/login${loginNext}`}
                  onClick={() => setOpen(false)}
                  className="block w-full px-3 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-sm font-medium text-center hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
                >
                  로그인 / 시작하기
                </Link>
              )}
            </div>

            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed shrink-0">
              이 도구는 투자 추천이 아니라 <strong>탐색 우선순위</strong>를 정하는 분석 도구입니다.
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
