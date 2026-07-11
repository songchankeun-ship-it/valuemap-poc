import { DisclosureExplorer } from "@/components/DisclosureExplorer";
import { getRecentSignals } from "@/lib/recentSignals";
import { realStockPool } from "@/lib/realStocks";
import { DisclosuresIntroHeader, DisclosuresIntroNote } from "@/components/disclosures/DisclosuresIntro";
import { disclosureKeywords, uniqueKeywords } from "@/lib/seoKeywords";

const disclosuresDescription =
  "DART 공시 분석을 위한 신호 페이지. 최신 수집 200건 내에서 자사주 취득, 자기주식 처분, 임원·주요주주 보유변동, 정정공시, 단일판매·공급계약, 전환사채·유상증자 공시를 유형별로 정리합니다.";

export const metadata = {
  title: "DART 공시 신호 분석 — 오른스코어",
  description: disclosuresDescription,
  keywords: uniqueKeywords(disclosureKeywords),
  openGraph: {
    title: "DART 공시 신호 분석 — 오른스코어",
    description: disclosuresDescription,
    url: "/disclosures",
    siteName: "오른스코어",
    locale: "ko_KR",
    type: "website",
    // 페이지별 openGraph 정의 시 루트 opengraph-image 상속이 끊기므로 공용 공유 카드를 유지.
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "DART 공시 신호 분석 — 오른스코어",
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
