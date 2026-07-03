"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { commonCopy } from "@/lib/i18n";

function WelcomeToastInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { locale } = useLanguage();
  const copy = commonCopy[locale].auth.welcomeToast;
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get("welcome") !== "1") return;

    setShow(true);

    // URL 에서 welcome 파라미터 제거 (브라우저 히스토리 더럽히지 않게 replace)
    const params = new URLSearchParams(searchParams.toString());
    params.delete("welcome");
    const qs = params.toString();
    // 같은 라우트 쿼리 정리는 RSC 재요청(?_rsc=) 없이 — history API로 교체해 abort 방지
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);

    const timer = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(timer);
  }, [searchParams, pathname]);

  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] bg-white dark:bg-zinc-900 border border-emerald-200 rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 max-w-md w-[calc(100%-2rem)]">
      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{copy.title}</div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400">{copy.body}</div>
      </div>
      <button
        type="button"
        onClick={() => setShow(false)}
        className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 shrink-0"
        aria-label={copy.close}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function WelcomeToast() {
  return (
    <Suspense fallback={null}>
      <WelcomeToastInner />
    </Suspense>
  );
}
