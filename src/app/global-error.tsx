"use client";

import { useEffect } from "react";

// 최후의 에러 바운더리 — 루트 layout까지 대체하므로 자체 <html>/<body>를 렌더하고
// LanguageProvider/ThemeProvider·useLanguage에 의존하지 않는다(컨텍스트 없음).
// i18n 컨텍스트를 못 쓰므로 한국어 고정 안내(차분한 시스템 상태 문구, 금칙 표현 없음).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{ margin: 0 }}
        className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased"
      >
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-xl mx-auto py-16 text-center space-y-5">
            <div className="text-5xl opacity-70" aria-hidden="true">⚠️</div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              일시적인 문제가 발생했어요
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              데이터는 안전하며, 화면을 그리는 중 일시적인 오류가 발생했어요.<br />
              잠시 후 다시 시도하면 대부분 정상적으로 표시됩니다.
            </p>
            <div className="flex gap-2 justify-center pt-3 flex-wrap">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-md text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
              >
                다시 시도
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-md text-sm font-medium bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200"
              >
                홈으로
              </a>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              문제가 계속되면 잠시 후 다시 시도하거나 새로고침해주세요.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
