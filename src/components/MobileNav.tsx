"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Search, Megaphone, FlaskConical, BookOpen, Heart, Menu, X, LogOut, GitCompare, Bot, Info, CreditCard, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { safeInternalPath } from "@/lib/auth/returnPath";
import type { NavKey } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "./LanguageProvider";
import { ThemeToggle } from "./ThemeToggle";

const ITEMS = [
  // 1차 메뉴 — 핵심 기능
  { href: "/today", Icon: CalendarDays, key: "today", group: "" },
  { href: "/stocks", Icon: Search, key: "stocks", group: "" },
  { href: "/disclosures", Icon: Megaphone, key: "disclosures", group: "" },
  { href: "/backtest", Icon: FlaskConical, key: "backtest", group: "" },
  { href: "/pricing", Icon: CreditCard, key: "pricing", group: "" },
  // 더보기 — 보조 기능
  { href: "/watchlist", Icon: Heart, key: "watchlist", group: "more" },
  { href: "/compare", Icon: GitCompare, key: "compare", group: "more" },
  { href: "/history", Icon: Bot, key: "history", group: "more" },
  { href: "/guide/metrics", Icon: BookOpen, key: "metricsGuide", group: "more" },
  { href: "/about", Icon: Info, key: "about", group: "more" },
] satisfies Array<{ href: string; Icon: LucideIcon; key: NavKey; group: "" | "more" }>;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileNav({ userEmail }: { userEmail: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { copy } = useLanguage();

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

  // 현재 내부 위치를 로그인 후 복귀 목적지로 보존(쿼리 포함 가능). safeInternalPath 로
  // 한 번 더 걸러 외부 URL 이 next 로 새어들지 않게 한다.
  const onRedirectablePage = !!pathname && pathname !== "/" && pathname !== "/login";
  const loginSearch = typeof window !== "undefined" ? window.location.search : "";
  const loginDest = onRedirectablePage ? safeInternalPath(`${pathname}${loginSearch}`) : "/";
  const loginNext = loginDest !== "/" ? `?next=${encodeURIComponent(loginDest)}` : "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={copy.chrome.openMenu}
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
                <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{copy.brand}</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={copy.chrome.closeMenu}
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
                      <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3 pt-3 pb-1">{copy.nav.more}</div>
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
                      <span className="flex-1">{copy.nav[item.key]}</span>
                    </Link>
                  </div>
                );
              })}
            </nav>

            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{copy.chrome.theme}</span>
                <div className="flex items-center gap-2">
                  <LanguageSwitcher compact />
                  <ThemeToggle />
                </div>
              </div>

              {userEmail ? (
                <>
                  <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-md">
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{copy.auth.loggedIn}</div>
                    <div className="text-xs text-zinc-900 dark:text-zinc-100 font-medium truncate">{userEmail}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-sm font-medium transition"
                  >
                    <LogOut className="w-4 h-4" />
                    {copy.auth.logout}
                  </button>
                </>
              ) : (
                <Link
                  href={`/login${loginNext}`}
                  onClick={() => setOpen(false)}
                  className="block w-full px-3 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-sm font-medium text-center hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
                >
                  {copy.auth.loginStart}
                </Link>
              )}
            </div>

            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed shrink-0">
              {copy.chrome.explorationNotice}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
