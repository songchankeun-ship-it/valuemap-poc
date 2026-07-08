import { DisclosureExplorer } from "@/components/DisclosureExplorer";
import { getRecentSignals } from "@/lib/recentSignals";
import { realStockPool } from "@/lib/realStocks";
import { DisclosuresIntroHeader, DisclosuresIntroNote } from "@/components/disclosures/DisclosuresIntro";

const disclosuresDescription =
  "최근 7일 중 DART 최신 수집 200건 내에서 5가지 시장 신호만 추출. 자기주식·임원·주요주주 보유변동·정정·대형계약·증자.";

export const metadata = {
  title: "공시 신호 — 오른스코어",
  description: disclosuresDescription,
  openGraph: {
    title: "공시 신호 — 오른스코어",
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
    title: "공시 신호 — 오른스코어",
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
