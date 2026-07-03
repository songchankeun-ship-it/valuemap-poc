import { dataMetadata } from "@/lib/realStocks";
import { dataStatus } from "@/lib/dataStatus";
import { MetricsGuideContent } from "@/components/guide/MetricsGuideContent";

const guideDescription =
  "자체 지표 4종이 어떻게 계산되고 어떻게 해석되는지 투명하게 공개합니다.";

export const metadata = {
  title: "지표 가이드 — 오른스코어",
  description: guideDescription,
  openGraph: {
    title: "지표 가이드 — 오른스코어",
    description: guideDescription,
    url: "/guide/metrics",
    siteName: "오른스코어",
    locale: "ko_KR",
    type: "website",
    // 페이지별 openGraph 정의 시 루트 opengraph-image 상속이 끊기므로 공용 공유 카드를 유지.
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "지표 가이드 — 오른스코어",
    description: guideDescription,
  },
  alternates: { canonical: "/guide/metrics" },
};

export default function GuidePage() {
  return (
    <MetricsGuideContent
      count={dataMetadata.count}
      metricsVersionLabel={dataStatus.metricsVersionLabel}
      metricsEffectiveDate={dataStatus.metricsEffectiveDate}
    />
  );
}
