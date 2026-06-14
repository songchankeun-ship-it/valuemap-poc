import Link from "next/link";

export const metadata = {
  title: "블로그 (준비 중) — 오른스코어",
};

export default function BlogPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
      <Link href="/" className="text-xs text-gray-500 hover:text-gray-900">← 홈으로</Link>
      <div className="text-5xl opacity-50">📝</div>
      <h1 className="text-2xl font-bold text-zinc-900">블로그 (준비 중)</h1>
      <p className="text-sm text-zinc-600">
        시장 인사이트와 분석 글이 곧 게시됩니다.
      </p>
    </div>
  );
}