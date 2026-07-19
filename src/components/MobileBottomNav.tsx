"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Search, Heart, Menu, X, GitCompare, Megaphone, FlaskConical, CreditCard, BookOpen, Info, type LucideIcon } from "lucide-react";
import type { NavKey, NavShortKey } from "@/lib/i18n";
import { useLanguage } from "./LanguageProvider";
import { getFocusableElements, trapTabKey } from "@/lib/focusTrap";

// 하단 바는 폭이 좁아 축약 라벨(navShort)을 쓴다. 데스크톱/드로어(Sidebar·MobileNav)는
// 같은 경로에 역할 라벨(nav)을 쓴다 — 설계서 §12.1/§12.2.
const PRIMARY = [
  { href: "/today", Icon: CalendarDays, key: "today" },
  { href: "/stocks", Icon: Search, key: "stocks" },
  { href: "/watchlist", Icon: Heart, key: "watchlist" },
  { href: "/disclosures", Icon: Megaphone, key: "disclosures" },
] satisfies Array<{ href: string; Icon: LucideIcon; key: NavShortKey }>;

const MORE = [
  { href: "/compare", Icon: GitCompare, key: "compare" },
  { href: "/backtest", Icon: FlaskConical, key: "backtest" },
  { href: "/pricing", Icon: CreditCard, key: "pricing" },
  { href: "/guide/metrics", Icon: BookOpen, key: "metricsGuide" },
  { href: "/about", Icon: Info, key: "about" },
] satisfies Array<{ href: string; Icon: LucideIcon; key: NavKey }>;

export function MobileBottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname() || "";
  const { copy } = useLanguage();
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // 다른 메뉴(MobileNav·UserMenu)와 동일하게 Esc 로 더보기 시트를 닫는다(키보드 접근성).
  useEffect(() => {
    if (!moreOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
      else trapTabKey(e, moreMenuRef.current);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  // 시트가 닫히면 포커스를 더보기 토글 버튼으로 되돌린다(MobileNav 와 동일 패턴).
  // 되돌리지 않으면 Esc·백드롭으로 닫을 때 포커스가 body 로 떨어져 키보드/스크린리더
  // 사용자가 맥락을 잃는다. 최초 마운트(moreOpen=false)에서는 포커스를 건드리지 않는다.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (moreOpen) {
      wasOpenRef.current = true;
      const id = requestAnimationFrame(() => getFocusableElements(moreMenuRef.current)[0]?.focus());
      return () => cancelAnimationFrame(id);
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      moreButtonRef.current?.focus();
    }
  }, [moreOpen]);
  const HIDE = ["/login", "/terms", "/privacy", "/data-deletion"];
  if (HIDE.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {moreOpen ? (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            ref={moreMenuRef}
            role="menu"
            aria-label={copy.nav.more}
            tabIndex={-1}
            className="absolute bottom-[calc(3.5rem_+_env(safe-area-inset-bottom))] inset-x-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 rounded-t-2xl p-3 grid grid-cols-3 gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {MORE.map(({ href, Icon, key }) => (
              <Link
                key={href}
                role="menuitem"
                prefetch={false} href={href}
                onClick={() => setMoreOpen(false)}
                className={"flex flex-col items-center gap-1 py-3 rounded-lg text-[11px] " + (active(href) ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-medium" : "text-zinc-600 dark:text-zinc-300")}
              >
                <Icon className="w-5 h-5" />
                <span className="px-1 text-center leading-tight">{copy.nav[key]}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <nav aria-label={copy.chrome.bottomNavLabel} className="lg:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-5 h-[calc(3.5rem_+_env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-t border-zinc-200 dark:border-zinc-800">
        {PRIMARY.map(({ href, Icon, key }) => (
          <Link
            key={href}
            prefetch={false} href={href}
            aria-current={active(href) ? "page" : undefined}
            className={"flex flex-col items-center justify-center gap-0.5 text-[10px] " + (active(href) ? "text-blue-700 dark:text-blue-400 font-medium" : "text-zinc-500 dark:text-zinc-400")}
          >
            <Icon className="w-5 h-5" />
            <span className="max-w-full truncate px-0.5">{copy.navShort[key]}</span>
          </Link>
        ))}
        <button
          ref={moreButtonRef}
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className={"flex flex-col items-center justify-center gap-0.5 text-[10px] " + (moreOpen ? "text-blue-700 dark:text-blue-400 font-medium" : "text-zinc-500 dark:text-zinc-400")}
          aria-label={copy.nav.more}
          aria-haspopup="menu"
          aria-expanded={moreOpen}
        >
          {moreOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span className="max-w-full truncate px-0.5">{copy.nav.more}</span>
        </button>
      </nav>
    </>
  );
}
