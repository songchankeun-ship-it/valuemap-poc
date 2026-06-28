import { dataMetadata } from "@/lib/realStocks";
import { dataStatus } from "@/lib/dataStatus";
import { MetricsGuideContent } from "@/components/guide/MetricsGuideContent";

export const metadata = {
  title: "지표 가이드 — 오른스코어",
  description: "자체 지표 4종이 어떻게 계산되고 어떻게 해석되는지 투명하게 공개합니다.",
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
