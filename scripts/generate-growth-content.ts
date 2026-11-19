import { currentGrowthPacket } from "../src/lib/currentGrowthPacket";
import { PACKET_FORMATS } from "../src/lib/growthPacket";

const packet = currentGrowthPacket();
if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
} else {
  const lines = [
    "# ORNScore 성장 콘텐츠 초안",
    "",
    `데이터 기준 ${packet.asOfBusinessDate} · Metrics ${packet.metricsVersion} · ${packet.universeCount}종목`,
    `후보 범위 · 비교 ${packet.coverage.comparisonPairs}쌍 · PER ${packet.coverage.lowPerStocks}종목 · 오늘의 거래량 ${packet.coverage.activityStocks}종목`,
  ];
  for (const format of PACKET_FORMATS) {
    lines.push("", `## ${format.label}`);
    for (const draft of packet.drafts.filter((item) => item.format === format.id)) {
      lines.push("", draft.text, "", `확인할 행동 · ${draft.action}`);
    }
  }
  process.stdout.write(`${lines.join("\n")}\n`);
}
