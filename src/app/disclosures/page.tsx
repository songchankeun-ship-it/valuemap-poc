import { DisclosureExplorer } from "@/components/DisclosureExplorer";
import { getRecentSignals } from "@/lib/recentSignals";
import { realStockPool } from "@/lib/realStocks";
import { DisclosuresIntroHeader, DisclosuresIntroNote } from "@/components/disclosures/DisclosuresIntro";

export const metadata = {
  title: "공시 신호 — 오른스코어",
  description: "최근 7일 한국 상장사 공시에서 5가지 시장 신호만 추출. 자기주식·임원·주요주주 보유변동·정정·대형계약·증자.",
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
