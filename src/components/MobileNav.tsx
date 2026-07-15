"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Search, Megaphone, FlaskConical, BookOpen, Heart, Menu, X, LogOut, GitCompare, Info, CreditCard, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { safeInternalPath } from "@/lib/auth/returnPath";
import type { NavKey } from "@/lib/i18n";
import { useLanguage } from "./LanguageProvider";
import { ThemeToggle } from "./ThemeToggle";

const ITEMS = [
  // 1차 메뉴 — 핵심 기능
  { href: "/today", Icon: CalendarDays, key: "today", group: "" },
  { href: "/stocks", Icon: Search, key: "stocks", group: "" },
  { href: "/watchlist", Icon: Heart, key: "watchlist", group: "" },
  { href: "/disclosures", Icon: Megaphone, key: "disclosures", group: "" },
  // 더보기 — 보조 기능
  { href: "/compare", Icon: GitCompare, key: "compare", group: "more" },
  { href: "/backtest", Icon: FlaskConical, key: "backtest", group: "more" },
  { href: "/pricing", Icon: CreditCard, key: "pricing", group: "more" },
  { href: "/guide/metrics", Icon: BookOpen, key: "metricsGuide", group: "more" },
  { href: "/about", Icon: Info, key: "about", group: "more" },
] satisfies Array<{ href: string; Icon: LucideIcon; key: NavKey; group: "" | "more" }>;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileNav({ userEmail }: { userEmail: string | null }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { copy } = useLanguage();
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // 드로어/백드롭을 document.body 로 포털해 헤더의 backdrop-blur(고정요소 컨테이닝 블록)
  // 밖으로 빼낸다. SSR 에서는 마운트 전이라 오버레이를 렌더하지 않는다(하이드레이션 안전).
  useEffect(() => { setMounted(true); }, []);

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

  // 드로어 열릴 때 포커스를 닫기 버튼으로 이동하고, 닫힐 때 메뉴 열기 버튼으로
  // 되돌린다(키보드/스크린리더 사용자가 맥락을 잃지 않도록).
  // 최초 마운트(open=false)에서는 포커스를 건드리지 않는다.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      // 포털 렌더 직후 포커스가 걸리도록 다음 프레임에서 실행
      const id = requestAnimationFrame(() => closeButtonRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      openButtonRef.current?.focus();
    }
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
        ref={openButtonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={copy.chrome.openMenu}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-300"
      >
        <Menu className="w-5 h-5" strokeWidth={2} />
      </button>

      {open && mounted ? createPortal(
        <>
          <div
            onClick={() => setOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/70 z-[60] backdrop-blur-sm"
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={copy.brand}
            className="lg:hidden fixed inset-y-0 left-0 w-[min(340px,calc(100vw-48px))] bg-white dark:bg-zinc-950 z-[61] shadow-2xl flex flex-col border-r-2 border-zinc-900/10 dark:border-zinc-100/10"
          >
            <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 28 28" fill="none" aria-hidden="true"><circle cx="13" cy="15" r="7" stroke="white" strokeWidth="2.4"/><path d="M8 19L20 8" stroke="white" strokeWidth="2.4" strokeLinecap="round"/></svg></span>
                <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{copy.brand}</span>
              </Link>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={copy.chrome.closeMenu}
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <nav aria-label={copy.chrome.drawerNavLabel} className="flex-1 p-3 space-y-1 overflow-y-auto">
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
                      aria-current={active ? "page" : undefined}
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
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{copy.chrome.theme}</span>
                <div className="flex items-center gap-2 shrink-0">
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
                // 두 링크는 같은 /login으로 가지만 의도를 구분한다(Slice J): 1차=관심종목 동기화 시작, 2차=재방문 로그인.
                // '로그인 / 시작' 한 목적지의 두 이름 대신 동기화 의도와 재방문 로그인을 시각·라벨로 분리.
                <div className="space-y-1.5">
                  <Link
                    href={`/login${loginNext}`}
                    onClick={() => setOpen(false)}
                    className="block w-full px-3 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-sm font-medium text-center hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
                  >
                    {copy.auth.syncStart}
                  </Link>
                  <Link
                    href={`/login${loginNext}`}
                    onClick={() => setOpen(false)}
                    className="block w-full px-3 py-2 text-zinc-600 dark:text-zinc-400 rounded-md text-sm text-center hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
                  >
                    {copy.auth.login}
                  </Link>
                </div>
              )}
            </div>

            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed shrink-0">
              {copy.chrome.explorationNotice}
            </div>
          </div>
        </>,
        document.body
      ) : null}
    </>
  );
}
