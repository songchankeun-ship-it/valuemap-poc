"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { safeInternalPath } from "@/lib/auth/returnPath";
import { useLanguage } from "./LanguageProvider";

export function AccountButtons() {
  const pathname = usePathname();
  const { copy } = useLanguage();
  // 현재 내부 위치를 로그인 후 복귀 목적지로 보존. 쿼리스트링도 가능하면 포함하되,
  // safeInternalPath 로 한 번 더 걸러 외부 URL 이 next 로 새어들지 않게 한다.
  // 쿼리스트링은 마운트 후에만 읽어 SSR/클라이언트 hydration href 불일치를 막는다
  // (예: ?lang=en 이 서버 렌더에는 없고 클라이언트에만 있어 mismatch 발생).
  const [search, setSearch] = useState("");
  useEffect(() => {
    setSearch(window.location.search);
  }, [pathname]);
  const onRedirectablePage = !!pathname && pathname !== "/" && pathname !== "/login";
  const dest = onRedirectablePage ? safeInternalPath(`${pathname}${search}`) : "/";
  const next = dest !== "/" ? `?next=${encodeURIComponent(dest)}` : "";

  return (
    <>
      <Link
        prefetch={false} href={`/login${next}`}
        data-analytics-event="auth_cta_click"
        data-analytics-source="header_login"
        data-analytics-has-next={dest !== "/" ? "true" : "false"}
        data-analytics-path={pathname ?? ""}
        className="hidden md:inline-flex items-center px-3 py-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition text-sm"
      >
        {copy.auth.login}
      </Link>
      <Link
        prefetch={false} href={`/login${next}`}
        data-analytics-event="auth_cta_click"
        data-analytics-source="header_start"
        data-analytics-has-next={dest !== "/" ? "true" : "false"}
        data-analytics-path={pathname ?? ""}
        className="hidden md:inline-flex items-center px-3 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition text-sm font-medium"
      >
        {copy.auth.start}
      </Link>
    </>
  );
}
