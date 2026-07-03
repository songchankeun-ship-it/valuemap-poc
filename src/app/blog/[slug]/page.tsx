import { notFound } from "next/navigation";

export const metadata = {
  title: "블로그 — 오른스코어",
  // 항상 404 되는 라우트 — 색인에서 제외한다.
  robots: { index: false, follow: true },
};

export default function BlogPostPage() {
  notFound();
}