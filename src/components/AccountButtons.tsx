"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { safeInternalPath } from "@/lib/auth/returnPath";
import { useLanguage } from "./LanguageProvider";

export function AccountButtons() {
  const pathname = usePathname();
  const { copy } = useLanguage();
  // 현재 내부 위치를 로그인 후 복귀 목적지로 보존. 쿼리스트링도 가능하면 포함하되,
  // safeInternalPath 로 한 번 더 걸러 외부 URL 이 next 로 새어들지 않게 한다.
  const onRedirectablePage = !!pathname && pathname !== "/" && pathname !== "/login";
  const search = typeof window !== "undefined" ? window.location.search : "";
  const dest = onRedirectablePage ? safeInternalPath(`${pathname}${search}`) : "/";
  const next = dest !== "/" ? `?next=${encodeURIComponent(dest)}` : "";

  return (
    <>
      <Link
        prefetch={false} href={`/login${next}`}
        className="hidden md:inline-flex items-center px-3 py-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition text-sm"
      >
        {copy.auth.login}
      </Link>
      <Link
        prefetch={false} href={`/login${next}`}
        className="hidden md:inline-flex items-center px-3 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition text-sm font-medium"
      >
        {copy.auth.start}
      </Link>
    </>
  );
}
