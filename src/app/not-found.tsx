import Link from "next/link";

export const metadata = {
  title: "페이지를 찾을 수 없습니다 — 밸류맵 스톡",
};

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto py-16 text-center space-y-5">
      <div className="text-6xl opacity-60">🔍</div>
      <h1 className="text-2xl font-bold text-zinc-900">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-zinc-600 leading-relaxed">
        존재하지 않거나 분석 풀(138개 종목)에 포함되지 않은 종목일 수 있어요.<br />
        URL을 다시 확인하거나 종목 탐색에서 검색해보세요.
      </p>
      <div className="flex gap-2 justify-center pt-3">
        <Link href="/stocks" className="px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 transition">
          종목 탐색
        </Link>
        <Link href="/" className="px-4 py-2 bg-white border border-zinc-300 rounded-md text-sm font-medium hover:border-zinc-400 transition">
          홈으로
        </Link>
      </div>
    </div>
  );
}