// scripts/generate-daily-insight.ts
// 매일 06:00 (한국시간) Vercel Cron 또는 GitHub Actions로 실행.
//
// 흐름:
// 1. 상위 5개 테마 선정 (composite score 또는 외국인 매수 상위)
// 2. Claude API로 인사이트 한 편 생성
// 3. public/daily-insights/{YYYY-MM-DD}.json 저장
// 4. public/daily-insights/latest.json 갱신
//
// 운영 시 이 스크립트를 Vercel Cron에 연결:
//   vercel.json:
//     { "crons": [{ "path": "/api/cron/daily-insight", "schedule": "0 21 * * *" }] }

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateThemeInsight } from "../src/lib/ai-insight";
import { mockTopNeglectedThemes, mockStocksInTheme } from "../src/lib/mockData";

function todayKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

async function main() {
  const date = todayKST();
  console.log(`[generate-daily-insight] ${date}`);

  const topThemes = mockTopNeglectedThemes.slice(0, 5);
  const themesInput = topThemes.map((t) => {
    const stocks = mockStocksInTheme[t.slug] ?? [];
    return {
      name: t.name,
      category: t.category,
      stockCount: t.stockCount,
      return1d: 0.3,        // 더미. 운영: 실제 일간 평균
      return5d: t.return1m / 4,
      momentum: t.momentum,
      flow: t.flow,
      value: t.value,
      vol: t.vol,
      composite: t.compositeScore,
      foreignNetSum: 2.85e10 * (t.flow / 80),
      pensionNetSum: 4.7e9 * (t.flow / 80),
      topStocks: stocks.slice(0, 3).map((s) => s.name),
    };
  });

  try {
    const result = await generateThemeInsight({
      themes: themesInput,
      dateKST: date,
    });

    const payload = {
      dateKST: date,
      source: result.source,
      model: result.model,
      cost: { krw: result.costKRW, inputTokens: result.inputTokens, outputTokens: result.outputTokens },
      insight: result.insight,
    };

    const dir = join(process.cwd(), "public", "daily-insights");
    await writeFile(join(dir, `${date}.json`), JSON.stringify(payload, null, 2), "utf-8");
    await writeFile(join(dir, "latest.json"), JSON.stringify(payload, null, 2), "utf-8");

    console.log(`✓ 인사이트 생성 완료 (비용 약 ${result.costKRW}원)`);
    console.log(`  헤드라인: ${result.insight.headline}`);
  } catch (err) {
    console.error(`✗ 생성 실패: ${(err as Error).message}`);
    console.log("  → public/daily-insights/latest.json (기존 샘플)을 유지합니다.");
    process.exit(1);
  }
}

main();
