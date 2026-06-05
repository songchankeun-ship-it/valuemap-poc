// /blog/[slug] — 블로그 글 상세
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, listPosts, markdownToHtml } from "@/lib/blog";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await listPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "글을 찾을 수 없습니다" };
  return {
    title: `${post.title} — 밸류맵`,
    description: post.description ?? post.bodyMarkdown.slice(0, 140),
    openGraph: {
      title: post.title,
      description: post.description ?? post.bodyMarkdown.slice(0, 140),
      type: "article",
      publishedTime: post.publishedAt,
    },
    keywords: post.targetKeywords,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const html = markdownToHtml(post.bodyMarkdown);

  // JSON-LD 구조화 데이터 (SEO)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: "밸류맵" },
    keywords: post.targetKeywords?.join(", "),
  };

  return (
    <article className="space-y-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-xs text-gray-500 flex items-center gap-1">
        <Link href="/">홈</Link>
        <span>›</span>
        <Link href="/blog">블로그</Link>
        <span>›</span>
        <span className="text-gray-900 truncate max-w-[300px]">{post.title}</span>
      </nav>

      <header className="border-b border-gray-200 pb-4 mb-4">
        <div className="text-xs text-gray-500 mb-2">
          {post.publishedAt} · {post.channel ?? "블로그"}
        </div>
        <h1 className="text-2xl font-semibold leading-tight mb-3">{post.title}</h1>
        {post.targetKeywords && post.targetKeywords.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {post.targetKeywords.map((k) => (
              <span key={k} className="text-[11px] px-2 py-0.5 bg-brand-50 text-brand-700 rounded-md">
                {k}
              </span>
            ))}
          </div>
        )}
      </header>

      <div
        className="text-[15px] text-gray-800"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <footer className="border-t border-gray-200 mt-8 pt-4">
        <div className="flex justify-between items-center mb-4">
          <Link
            href="/blog"
            className="text-sm text-gray-600 hover:text-brand-600"
          >
            ← 다른 글 보기
          </Link>
          <div className="flex gap-2 text-xs">
            <button className="px-3 py-1 border border-gray-200 rounded-md">
              X에 공유
            </button>
            <button className="px-3 py-1 border border-gray-200 rounded-md">
              링크 복사
            </button>
          </div>
        </div>
        <div className="bg-brand-50 rounded-lg p-4">
          <div className="text-sm font-medium text-brand-700 mb-1">
            매주 새 글, 이메일로 받기
          </div>
          <p className="text-xs text-brand-700 mb-3">
            테마주 분석·자체 지표 해설·백테스트 검증. 광고 없음.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="이메일 주소"
              className="flex-1 px-3 py-1.5 border border-brand-200 rounded-md text-sm bg-white"
            />
            <button className="px-3 py-1.5 bg-brand-600 text-white rounded-md text-sm font-medium">
              구독
            </button>
          </div>
        </div>
      </footer>
    </article>
  );
}
