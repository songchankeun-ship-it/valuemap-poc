import { dataMetadata } from "@/lib/realStocks";
import { dataStatus } from "@/lib/dataStatus";
import { MetricsGuideContent } from "@/components/guide/MetricsGuideContent";
import { metricKeywords, stockDiscoveryKeywords, uniqueKeywords } from "@/lib/seoKeywords";
import { metricsGuideCopy } from "@/lib/copy/metricsGuide";

const guideDescription =
  "PER·PBR·ROE 뜻과 주식 지표 보는 법, 오른스코어 자체 지표 4종의 계산 기준을 투명하게 공개합니다.";

export const metadata = {
  title: "PER PBR ROE 지표 가이드 — 오른스코어",
  description: guideDescription,
  keywords: uniqueKeywords(metricKeywords, stockDiscoveryKeywords),
  openGraph: {
    title: "PER PBR ROE 지표 가이드 — 오른스코어",
    description: guideDescription,
    url: "/guide/metrics",
    siteName: "오른스코어",
    locale: "ko_KR",
    type: "website",
    // 공용 정적 공유 카드를 명시해 미리보기 이미지를 유지.
    images: ["/social/ornscore-og-1200x630.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PER PBR ROE 지표 가이드 — 오른스코어",
    description: guideDescription,
  },
  alternates: { canonical: "/guide/metrics" },
};

export default function GuidePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: metricsGuideCopy.ko.seoFaq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <MetricsGuideContent
        count={dataMetadata.count}
        metricsVersionLabel={dataStatus.metricsVersionLabel}
        metricsEffectiveDate={dataStatus.metricsEffectiveDate}
      />
    </>
  );
}
