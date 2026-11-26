import { DisclosureExplorer } from "@/components/DisclosureExplorer";
import { getRecentSignals } from "@/lib/recentSignals";
import { realStockPool } from "@/lib/realStocks";
import { DisclosuresIntroHeader, DisclosuresIntroNote } from "@/components/disclosures/DisclosuresIntro";
import { disclosureKeywords, uniqueKeywords } from "@/lib/seoKeywords";

const disclosuresTitle = "DART 공시: 자사주 취득·지분 변동·공급계약 — 오른스코어";
const disclosuresDescription =
  "자사주 취득, 임원·주요주주 지분 변동, 공급계약 등 공시를 유형별로 보고 DART 원문에서 확인할 항목을 살펴보세요. 코스피·코스닥 최신 수집 200건 내에서 제공합니다.";

export const metadata = {
  title: disclosuresTitle,
  description: disclosuresDescription,
  keywords: uniqueKeywords(disclosureKeywords),
  openGraph: {
    title: disclosuresTitle,
    description: disclosuresDescription,
    url: "/disclosures",
    siteName: "오른스코어",
    locale: "ko_KR",
    type: "website",
    // 공용 정적 공유 카드를 명시해 미리보기 이미지를 유지.
    images: ["/social/ornscore-og-1200x630.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: disclosuresTitle,
    description: disclosuresDescription,
  },
  alternates: { canonical: "/disclosures" },
};

export const revalidate = 1800;

export default async function DisclosuresPage() {
  const initial = await getRecentSignals(7);
  const universe = realStockPool.map((s) => s.ticker);
  return (
    <div className="space-y-4">
      <DisclosuresIntroHeader />

      <DisclosureExplorer initialData={initial} universe={universe} />

      <DisclosuresIntroNote />
    </div>
  );
}
