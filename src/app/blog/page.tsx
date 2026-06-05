// /blog — 블로그 목록 (콘텐츠 SEO 허브)
import Link from "next/link";
import { listPosts } from "@/lib/blog";

export const metadata = {
  title: "밸류맵 블로그 — 테마주, 감이 아니라 지표로",
  description: "주달과 다른 톤. 자체 지표 4종, 백테스트 검증, 글로벌 동행 분석. 매주 새 글.",
};

export default async function BlogIndex() {
  const posts = await listPosts();

  return (
    <div className="space-y-4">
      <nav className="text-xs text-gray-500 flex items-center gap-1">
        <Link href="/">홈</Link>
        <span>›</span>
        <span className="text-gray-900">블로그</span>
      </nav>

      <header>
        <h1 className="text-2xl font-medium mb-1">블로그</h1>
        <p className="text-sm text-gray-500">
          매주 2편. 자체 지표 4종 분석 · 백테스트 검증 · 정직한 회의 · 글로벌 동행.
        </p>
      </header>

      <div className="grid gap-3">
        {posts.length === 0 && (
          <p className="text-sm text-gray-500">
            아직 발행된 글이 없습니다. content/blog/ 디렉토리에 .md 파일을 추가하세요.
          </p>
        )}
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-brand-500 hover:shadow-sm transition"
          >
            <div className="text-[11px] text-gray-500 mb-1">{p.publishedAt} · {p.channel ?? "블로그"}</div>
            <h2 className="text-base font-medium mb-1">{p.title}</h2>
            {p.targetKeywords && p.targetKeywords.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2">
                {p.targetKeywords.slice(0, 4).map((k) => (
                  <span key={k} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {k}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>

      <section className="border border-gray-200 rounded-lg p-4 bg-gray-50 mt-6">
        <div className="text-sm font-medium mb-1">새 글 알림 받기</div>
        <p className="text-xs text-gray-500 mb-3">
          매주 일요일 발행 글 요약을 이메일로 받아보세요.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="이메일 주소"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm"
          />
          <button className="px-4 py-2 bg-brand-600 text-white rounded-md text-sm font-medium">
            구독
          </button>
        </div>
      </section>
    </div>
  );
}
