import { PricingContent } from "@/components/PricingContent";

const pricingDescription =
  "오른스코어는 현재 무료 베타 단계의 한국 주식 탐색·데이터 도구입니다. 유료 플랜은 지금 제공하지 않으며, 138개 종목 탐색·종합 점수·공시 신호 등을 무료로 쓸 수 있어요.";

export const metadata = {
  title: "무료 베타 안내 — 오른스코어",
  description: pricingDescription,
  openGraph: {
    title: "무료 베타 안내 — 오른스코어",
    description: pricingDescription,
    url: "/pricing",
    siteName: "오른스코어",
    locale: "ko_KR",
    type: "website",
    // 공용 정적 공유 카드를 명시해 미리보기 이미지를 유지.
    images: ["/social/ornscore-og-1200x630.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "무료 베타 안내 — 오른스코어",
    description: pricingDescription,
  },
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return <PricingContent />;
}
