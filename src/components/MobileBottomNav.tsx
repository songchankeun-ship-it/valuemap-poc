"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Search, Heart, Menu, X, GitCompare, Megaphone, FlaskConical, CreditCard, BookOpen, Info, type LucideIcon } from "lucide-react";
import type { NavKey } from "@/lib/i18n";
import { useLanguage } from "./LanguageProvider";

const PRIMARY = [
  { href: "/today", Icon: CalendarDays, key: "today" },
  { href: "/stocks", Icon: Search, key: "stocks" },
  { href: "/watchlist", Icon: Heart, key: "watchlist" },
  { href: "/disclosures", Icon: Megaphone, key: "disclosures" },
] satisfies Array<{ href: string; Icon: LucideIcon; key: NavKey }>;

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

  // 다른 메뉴(MobileNav·UserMenu)와 동일하게 Esc 로 더보기 시트를 닫는다(키보드 접근성).
  useEffect(() => {
    if (!moreOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [moreOpen]);
  const HIDE = ["/login", "/terms", "/privacy"];
  if (HIDE.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {moreOpen ? (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            role="menu"
            aria-label={copy.nav.more}
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
            <span className="max-w-full truncate px-0.5">{copy.nav[key]}</span>
          </Link>
        ))}
        <button
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
