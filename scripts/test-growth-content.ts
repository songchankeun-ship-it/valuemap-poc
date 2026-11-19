import assert from "node:assert/strict";
import stocks from "../public/data/stocks.json";
import { currentGrowthPacket } from "../src/lib/currentGrowthPacket";
import { readGrowthPacketEvidence } from "../src/lib/growthAggregateReport";
import { projectGrowthEvent } from "../src/lib/growthAggregate";
import { buildGrowthContent, PACKET_FORMATS, PROHIBITED_DRAFT_LANGUAGE } from "../src/lib/growthPacket";
import { growthPacketDecision } from "../src/lib/growthPacketDecision";
import { campaignSourceOf, classifyRoute } from "../src/lib/routeAnalytics";
import { activitySurge } from "../src/lib/homeSnapshot";
import { realStockPool } from "../src/lib/realStocks";
import { getSeoTopic } from "../src/lib/seoTopics";
import { comparisonPairBySlug, CURATED_COMPARISON_PAIRS } from "../src/lib/seoContract";

async function main() {
  const packet = currentGrowthPacket();
  assert.deepEqual(packet, currentGrowthPacket());
  assert.equal(packet.asOfBusinessDate.replaceAll("-", ""), stocks.asOfBusinessDate);
  assert.equal(packet.metricsVersion, stocks.metricsVersion);
  assert.equal(packet.universeCount, 138);
  assert.equal(packet.drafts.length, 6);
  assert.equal(new Set(packet.drafts.map((draft) => draft.id)).size, 6);
  assert.equal(new Set(packet.drafts.map((draft) => draft.text.split("\n")[1])).size, 6);

  const today = activitySurge(realStockPool).items.slice(0, 6);
  const screen = getSeoTopic("low-per-stocks")!.stockSelector();
  for (const format of PACKET_FORMATS) {
    const drafts = packet.drafts.filter((draft) => draft.format === format.id);
    assert.equal(drafts.length, 2);
    for (const draft of drafts) {
      const [date, finding, limitation, check, link, ...rest] = draft.text.split("\n");
      assert.equal(date, `${packet.asOfBusinessDate} 데이터 기준`);
      assert.ok(finding && limitation && check.includes("확인"));
      assert.equal(link, draft.url);
      assert.equal(rest.length, 0);
      assert.equal((draft.text.match(/https:\/\//g) ?? []).length, 1);
      assert.ok(!PROHIBITED_DRAFT_LANGUAGE.test(draft.text), draft.text);
      const url = new URL(link);
      assert.equal(url.origin, "https://ornscore.com");
      assert.equal(url.hash, "");
      assert.deepEqual([...url.searchParams], [["ref", "threads"]]);
      assert.equal(campaignSourceOf(url.searchParams), "threads");
      const props = classifyRoute(url.pathname, url.search)!;
      assert.deepEqual(projectGrowthEvent(url.pathname, "route_view_public", props), {
        event: "route_view_public", campaign: "threads", routeKind: format.routeKind,
      });
      if (format.id === "neutral-comparison") {
        const pair = comparisonPairBySlug(url.pathname.split("/").at(-1)!)!;
        const names = [pair.a, pair.b].map((ticker) => stocks.stocks.find((stock) => stock.ticker === ticker)!);
        const scoreKeys = { 추세: "momentum", 거래활성도: "flow", 밸류: "value", 위험조정: "volScore" } as const;
        const label = finding.split(" ")[0] as keyof typeof scoreKeys;
        assert.ok(names.every((stock) => finding.includes(`${stock.name} ${Math.round(stock[scoreKeys[label]])}점`)));
      } else if (format.id === "screen-and-check") {
        assert.equal(url.pathname, "/topics/low-per-stocks");
        assert.ok(screen.some((stock) => finding.includes(`${stock.name}의 PER은 ${stock.per.toFixed(1)}배, ROE는 ${stock.roe.toFixed(1)}%`)));
      } else {
        assert.equal(url.pathname, "/today");
        assert.match(check, /확인한 뒤, 다시 볼 후보를 관심종목에 저장해 보세요\./);
        assert.equal(draft.action, "검토한 거래량 후보를 관심종목에 저장하기");
        assert.ok(today.some((stock) => finding.includes(`${stock.name}의`) && finding.includes(`${stock.flowStats?.ratio?.toFixed(2)}배`)));
      }
    }
  }

  const activityTickers = today.map(({ ticker }) => ticker);
  const [candidate, belowSurge] = activityTickers;
  for (const { usable, candidates, expectedRatioCount } of [
    { usable: false, candidates: [], expectedRatioCount: 0 },
    { usable: false, candidates: activityTickers, expectedRatioCount: 1 },
    { usable: true, candidates: activityTickers, expectedRatioCount: 2 },
  ]) {
    const sparseSnapshot = {
      ...stocks,
      stocks: stocks.stocks.map((stock) => ({
        ...stock,
        flowStats: { ratio: usable && stock.ticker === candidate ? 1.75 :
          candidates.length && stock.ticker === belowSurge ? 0.8 : null },
      })),
    };
    const sparse = buildGrowthContent(sparseSnapshot, CURATED_COMPARISON_PAIRS, candidates);
    assert.deepEqual(sparse, buildGrowthContent(sparseSnapshot, CURATED_COMPARISON_PAIRS, candidates));
    assert.equal(sparse.drafts.length, 6);
    assert.equal(sparse.coverage.activityStocks, Number(usable));
    const [first, second] = sparse.drafts.filter(({ format }) => format === "activity-change");
    assert.equal(first.text.split("\n")[1], usable
      ? `${today[0].name}의 최근 5거래일 평균 거래량은 20거래일 평균의 1.75배입니다.`
      : `오늘 화면의 거래량 급증 후보 ${candidates.length}종목 중 거래량 증가를 비율로 확인할 수 있는 종목은 0개입니다.`);
    assert.equal(second.text.split("\n")[1], `전체 138종목 중 5거래일과 20거래일 평균 거래량의 비율이 기록된 종목은 ${expectedRatioCount}개입니다.`);
    for (const draft of [first, second]) {
      const lines = draft.text.split("\n");
      assert.equal(lines.length, 5);
      assert.equal(lines[0], `${packet.asOfBusinessDate} 데이터 기준`);
      assert.ok(lines[2]);
      assert.match(lines[3], /확인한 뒤, 다시 볼 후보를 관심종목에 저장해 보세요\./);
      assert.equal(lines[4], "https://ornscore.com/today?ref=threads");
      assert.doesNotMatch(draft.text, PROHIBITED_DRAFT_LANGUAGE);
    }
  }
  for (const phrase of ["상승 전망", "목표 주가", "지금 당장", "매수", "매도", "최고"]) {
    assert.match(phrase, PROHIBITED_DRAFT_LANGUAGE);
  }

  const operator = "/admin/growth-packet";
  assert.equal(classifyRoute(operator, "?ref=threads"), null);
  assert.equal(projectGrowthEvent(operator, "route_view_public", { campaign: "threads", routeKind: "today" }), null);
  assert.equal(projectGrowthEvent(operator, "watchlist_toggle", { campaign: "threads" }), null);
  const now = new Date("2026-11-18T15:01:00Z");
  const noWrite = async () => assert.fail("Operator report must not write");
  assert.deepEqual(PACKET_FORMATS.map(({ downstreamEvent }) => downstreamEvent), [
    "compare_curated_interactive_open", "topic_stock_open", "watchlist_toggle",
  ]);
  const ready = await readGrowthPacketEvidence({
    increment: noWrite,
    async read(from, through) {
      assert.equal(from, "2026-11-06");
      assert.equal(through, "2026-11-19");
      return [
        { day: from, event: "route_view_public", campaign: "threads", routeKind: "today", count: 2 },
        { day: from, event: "route_view_public", campaign: "threads", routeKind: "compare_pair", count: 1 },
        { day: through, event: "topic_stock_open", campaign: "threads", routeKind: "none", count: 5 },
        { day: through, event: "watchlist_toggle", campaign: "share", routeKind: "none", count: 6 },
        { day: through, event: "route_view_public", campaign: "threads", routeKind: "stock_detail", count: 1 },
        { day: through, event: "compare_curated_interactive_open", campaign: "threads", routeKind: "none", count: 3 },
        { day: through, event: "route_view_public", campaign: "share", routeKind: "topic", count: 8 },
      ];
    },
  }, now);
  assert.deepEqual(ready, {
    status: "ready", from: "2026-11-06", through: "2026-11-19",
    entries: { "neutral-comparison": 1, "screen-and-check": 0, "activity-change": 2 },
    downstream: { "neutral-comparison": 3, "screen-and-check": 5, "activity-change": 0 },
  });
  assert.equal((await readGrowthPacketEvidence(undefined, now)).status, "not_configured");
  assert.equal((await readGrowthPacketEvidence({ increment: noWrite, read: async () => null }, now)).status, "unavailable");
  assert.equal(growthPacketDecision(2, undefined), "측정 확인 대기");
  assert.equal(growthPacketDecision(1, 0), "관찰");
  assert.equal(growthPacketDecision(2, 0), "중단");
  assert.equal(growthPacketDecision(2, undefined, ready.downstream["neutral-comparison"]), "측정 확인 대기");
  for (const [format, expected] of [
    ["neutral-comparison", "확대"], ["screen-and-check", "중단"], ["activity-change", "관찰"],
  ] as const) {
    assert.equal(growthPacketDecision(2, ready.entries[format], ready.downstream[format]), expected);
  }

  for (const { id, downstreamEvent } of PACKET_FORMATS) {
    const downstream = projectGrowthEvent("/today", downstreamEvent, { campaign: "threads", query: "private" });
    assert.deepEqual(downstream, { event: downstreamEvent, campaign: "threads", routeKind: "none" });
    const evidence = await readGrowthPacketEvidence({
      increment: noWrite,
      read: async (day) => [
        ...PACKET_FORMATS.map((format) => ({
          day, event: "route_view_public", campaign: "threads", routeKind: format.routeKind, count: 1,
        })),
        { day, ...downstream, count: 1 },
      ],
    }, now);
    assert.equal(evidence.status, "ready");
    if (evidence.status !== "ready") assert.fail("Missing packet evidence");
    for (const format of PACKET_FORMATS) {
      assert.equal(evidence.entries[format.id], 1);
      assert.equal(evidence.downstream[format.id], format.id === id ? 1 : 0);
      assert.equal(
        growthPacketDecision(1, evidence.entries[format.id], evidence.downstream[format.id]),
        format.id === id ? "확대" : "관찰",
      );
    }
  }
  console.log("PASS growth packet: snapshot evidence, six drafts, canonical links, bounded aggregate and decision rules");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
