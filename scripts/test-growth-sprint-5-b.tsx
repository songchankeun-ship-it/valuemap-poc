import assert from "node:assert/strict";
import React from "react";
import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeHero } from "../src/components/home/HomeHero";
import { LanguageProvider } from "../src/components/LanguageProvider";
import { pickHomeCandidates } from "../src/lib/homeActivation";
import { sanitizeClickProps } from "../src/lib/clickAnalytics";
import { projectGrowthEvent } from "../src/lib/growthAggregate";
import { homeHeroCopy } from "../src/lib/i18n";

// tsx uses the classic JSX transform with the repository's jsx: preserve.
Object.assign(globalThis, { React });

const stock = (ticker: string, score: number) => ({
  ticker, momentum: score, flow: score, value: score, vol: score, per: 12, pbr: 2, roe: 10,
});
const excluded = [
  stock("../bad", 100),
  stock("000001", 100),
  { ...stock("000002", 99), per: 0.5 },
  stock("000003", 0),
  stock("000004", Infinity),
];
const lagged = new Set(["000001"]);
const pool = [...excluded, stock("000005", 74), stock("005930", 91), stock("000006", 91), stock("000007", 68)];
assert.deepEqual(pickHomeCandidates(pool, lagged).map((s) => s.ticker), ["005930", "000006", "000005"]);
assert.deepEqual(pickHomeCandidates(excluded, lagged), []);

const detailPreview = {
  ticker: "005930",
  name: "삼성전자",
  conclusion: "추세 지표가 강하고 나머지는 중립권이에요.",
  nextCheck: "최근 공시를 먼저 보세요.",
};
const unusedRouter = {} as AppRouterInstance; // SSR never calls navigation methods.

function render(preview: typeof detailPreview | null) {
  const html = renderToStaticMarkup(
    <AppRouterContext.Provider value={unusedRouter}>
      <LanguageProvider>
        <HomeHero
          dataAsOf="11.18"
          dataAsOfRaw="20261118"
          dataStale={false}
          detailPreview={preview}
          marketPulse={{ totalCount: 138, strongCount: 3, activitySurgeCount: 2, upCount: 1 }}
          searchStocks={[{ ticker: "035720", name: "카카오", themes: [] }]}
          searchThemes={[]}
        />
      </LanguageProvider>
    </AppRouterContext.Provider>,
  );
  const primary = html.match(/<a [^>]*class="ui-primary-action[^"]*"[^>]*>/)?.[0];
  assert.ok(primary);
  return { html, primary };
}

const { html, primary } = render(detailPreview);
assert.match(primary, /href="\/stock\/005930"/);
assert.match(html, /href="\/stock\/035720"/);
assert.match(html, /<button[^>]*>종목 직접 찾기<\/button>/);
assert.ok(html.includes(detailPreview.conclusion) && html.includes(detailPreview.nextCheck));
const event = primary.match(/data-analytics-event="([^"]+)"/)?.[1];
assert.equal(event, "home_candidate_open");
const props = Object.fromEntries(
  [...primary.matchAll(/data-analytics-(ticker|rank|slot)="([^"]+)"/g)].map(([, key, value]) => [key, value]),
);
assert.deepEqual(sanitizeClickProps(event, props), { ticker: "005930", rank: "1", slot: "hero" });
assert.deepEqual(projectGrowthEvent("/", event, { ...props, campaign: "threads" }), {
  event: "home_candidate_open", campaign: "threads", routeKind: "none",
});

const fallback = render(null);
assert.match(fallback.primary, /href="\/stocks"/);
assert.doesNotMatch(fallback.primary, /data-analytics-/);
assert.doesNotMatch(fallback.html, /한 줄 결론|다음 확인<\/strong>/);

const copy = homeHeroCopy.ko;
assert.equal(copy.primaryCta, "오늘 첫 종목 바로 보기");
assert.equal(copy.fallbackCta, "전체 종목 둘러보기");
for (const label of [copy.primaryCta, copy.fallbackCta, copy.secondaryCta, copy.previewConclusion, copy.previewNextCheck]) {
  assert.match(label, /^[가-힣 ]+$/);
  assert.doesNotMatch(label, /매수|매도|추천|예측|전망|수익률|확률/);
}
console.log("PASS Growth Sprint 5 B: candidate order and exclusions, rendered detail/fallback, aggregate mapping, and copy");
