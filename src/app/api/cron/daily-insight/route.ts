// GET /api/cron/daily-insight — Vercel Cron 진입점
// vercel.json:
// { "crons": [{ "path": "/api/cron/daily-insight", "schedule": "0 21 * * *" }] }
//
// CRON_SECRET 환경변수로 외부 호출 차단.

import { NextResponse } from "next/server";
import { generateThemeInsight } from "@/lib/ai-insight";
import { createAdminClient } from "@/lib/supabase/admin";
import { mockTopNeglectedThemes, mockStocksInTheme } from "@/lib/mockData";

function todayKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  // Vercel Cron 인증
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? "dev-only"}`;
  if (process.env.CRON_SECRET && auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = todayKST();
  const topThemes = mockTopNeglectedThemes.slice(0, 5);

  const themesInput = topThemes.map((t) => {
    const stocks = mockStocksInTheme[t.slug] ?? [];
    return {
      name: t.name,
      category: t.category,
      stockCount: t.stockCount,
      return1d: 0.3,
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
    const result = await generateThemeInsight({ themes: themesInput, dateKST: date });
    const payload = {
      dateKST: date,
      source: result.source,
      model: result.model,
      cost: { krw: result.costKRW, inputTokens: result.inputTokens, outputTokens: result.outputTokens },
      insight: result.insight,
    };

    // Supabase daily_insights 영속화 (Vercel 함수는 fs 쓰기 불가)
    try {
      const supabase = createAdminClient();
      await supabase.from("daily_insights").upsert(
        { date_kst: date, insight: result.insight, source: result.source, model: result.model },
        { onConflict: "date_kst" },
      );
    } catch (e) {
      console.error("daily_insights 저장 실패:", e);
    }

    return NextResponse.json({ ok: true, ...payload });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
