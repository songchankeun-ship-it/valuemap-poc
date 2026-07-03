"use client";

import { useEffect } from "react";
import { ErrorContent } from "@/components/ErrorContent";

// Next.js route-segment 에러 바운더리. 루트 layout 안에서 렌더되므로
// LanguageProvider/ThemeProvider 컨텍스트가 살아 있어 로케일·다크모드가 그대로 적용된다.
// (전체 layout이 무너진 최후 상황은 global-error.tsx가 담당한다.)
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 로컬 관측용. 프로덕션에선 Vercel 로그로 수집된다.
    console.error(error);
  }, [error]);

  return <ErrorContent reset={reset} />;
}
