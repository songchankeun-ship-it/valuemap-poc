"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Search, Megaphone, FlaskConical, BookOpen, Heart, GitCompare, Info, CreditCard, type LucideIcon } from "lucide-react";
import type { NavKey } from "@/lib/i18n";
import { useLanguage } from "./LanguageProvider";

const ITEMS = [
  // 1차 메뉴 — 핵심 기능
  { href: "/today", Icon: CalendarDays, key: "today", group: "" },
  { href: "/stocks", Icon: Search, key: "stocks", group: "" },
  { href: "/disclosures", Icon: Megaphone, key: "disclosures", group: "" },
  { href: "/backtest", Icon: FlaskConical, key: "backtest", group: "" },
  // 더보기 — 보조 기능
  { href: "/watchlist", Icon: Heart, key: "watchlist", group: "more" },
  { href: "/compare", Icon: GitCompare, key: "compare", group: "more" },
  { href: "/pricing", Icon: CreditCard, key: "pricing", group: "more" },
  { href: "/guide/metrics", Icon: BookOpen, key: "metricsGuide", group: "more" },
  { href: "/about", Icon: Info, key: "about", group: "more" },
] satisfies Array<{ href: string; Icon: LucideIcon; key: NavKey; group: "" | "more" }>;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();
  const { copy } = useLanguage();
  // 인증·문서 레이아웃에서는 앱 사이드바 숨김 (디자인 설계서 §2, P0-6)
  const HIDE = ["/login", "/terms", "/privacy"];
  if (pathname && HIDE.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;
  // /login 페이지에서는 사이드바 숨김 (집중형 레이아웃)
  if (pathname === "/login") return null;

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
      <div className="sticky top-[5.5rem] px-3 py-4">
        <nav className="space-y-0.5">
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
                  prefetch={false} href={item.href}
                  className={
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition " +
                    (active
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800")
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                  <span className="flex-1">{copy.nav[item.key]}</span>
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="mt-8 px-3 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md">
          <div className="text-[10px] font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1">{copy.chrome.beta}</div>
          <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
            {copy.chrome.explorationNotice}
          </p>
        </div>
      </div>
    </aside>
  );
}
