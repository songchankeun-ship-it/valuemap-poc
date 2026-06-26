import Link from "next/link";

/**
 * 오프라인/네트워크 필요 안내 페이지 (설계서 PART H §24).
 * service worker가 등록되면 오프라인 fallback으로 쓸 수 있고, 등록 전에도 정적 안내로 동작한다.
 */
export const metadata = {
  title: "오프라인 — 오른스코어",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="max-w-md mx-auto px-3 md:px-4 py-10 text-center">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">네트워크가 필요해요</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        오른스코어의 점수·공시·재무 데이터는 최신 상태를 불러오기 위해 인터넷 연결이 필요합니다.
        연결을 확인한 뒤 다시 시도해주세요.
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
        일부 화면은 마지막으로 저장된 데이터가 잠시 보일 수 있으나, 실제 기준일·시세와 다를 수 있습니다.
      </p>

      <div className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-4 text-left">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">홈 화면에 추가</div>
        <p className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
          모바일 브라우저 메뉴에서 <strong>홈 화면에 추가</strong>(iOS: 공유 → 홈 화면에 추가 / Android: 메뉴 → 앱 설치)를
          선택하면 앱처럼 실행할 수 있어요.
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center justify-center mt-6 min-h-[44px] px-5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
