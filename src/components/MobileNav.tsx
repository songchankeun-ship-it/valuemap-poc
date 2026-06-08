"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Search, Megaphone, FlaskConical, BookOpen, Heart, Menu, X, LogOut, GitCompare, Bot } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ITEMS = [
  { href: "/today", Icon: CalendarDays, label: "오늘", soon: false },
  { href: "/stocks", Icon: Search, label: "종목 탐색", soon: false },
  { href: "/watchlist", Icon: Heart, label: "관심 종목", soon: false },
  { href: "/compare", Icon: GitCompare, label: "비교", soon: false },
  { href: "/history", Icon: Bot, label: "분석 기록", soon: false },
  { href: "/disclosures", Icon: Megaphone, label: "공시 신호", soon: false },
  { href: "/backtest", Icon: FlaskConical, label: "백테스트", soon: true },
  { href: "/guide/metrics", Icon: BookOpen, label: "지표 가이드", soon: false },
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

  // 현재 페이지를 next로 (홈/로그인 페이지는 제외)
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
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md hover:bg-zinc-100 transition text-zinc-700"
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
          <div className="lg:hidden fixed inset-y-0 left-0 w-[300px] max-w-[85vw] bg-white z-[61] shadow-2xl flex flex-col border-r-2 border-zinc-900/10">
            <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-200">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">V</span>
                <span className="text-base font-semibold text-zinc-900">밸류맵</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="메뉴 닫기"
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.Icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={
                      "flex items-center gap-3 px-3 py-3 rounded-md text-sm transition " +
                      (active
                        ? "bg-zinc-900 text-white font-medium"
                        : "text-zinc-700 hover:bg-zinc-100")
                    }
                  >
                    <Icon className="w-5 h-5 shrink-0" strokeWidth={1.8} />
                    <span className="flex-1">{item.label}</span>
                    {item.soon ? (
                      <span className={"text-[9px] px-1.5 py-0.5 rounded font-medium " + (active ? "bg-amber-300 text-amber-900" : "bg-amber-100 text-amber-700")}>
                        SOON
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="p-3 border-t border-zinc-200 space-y-2">
              {userEmail ? (
                <>
                  <div className="px-3 py-2 bg-zinc-50 rounded-md">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wide">로그인 됨</div>
                    <div className="text-xs text-zinc-900 font-medium truncate">{userEmail}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-zinc-700 hover:bg-zinc-100 rounded-md text-sm font-medium transition"
                  >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </button>
                </>
              ) : (
                <Link
                  href={`/login${loginNext}`}
                  onClick={() => setOpen(false)}
                  className="block w-full px-3 py-2.5 bg-zinc-900 text-white rounded-md text-sm font-medium text-center hover:bg-zinc-800 transition"
                >
                  로그인 / 시작하기
                </Link>
              )}
            </div>

            <div className="px-4 py-3 bg-amber-50 border-t border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              이 도구는 투자 추천이 아니라 <strong>탐색 우선순위</strong>를 정하는 분석 도구입니다.
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
