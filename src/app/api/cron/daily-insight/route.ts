// GET /api/cron/daily-insight — Vercel Cron 진입점
// vercel.json:
// { "crons": [{ "path": "/api/cron/daily-insight", "schedule": "0 21 * * *" }] }
//
// CRON_SECRET 환경변수로 외부 호출 차단.

import { NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateThemeInsight } from "@/lib/ai-insight";
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

    // ⚠️ Vercel은 함수에서 public/에 쓰기 불가 — 운영은 외부 저장소(KV/S3) 필요
    // PoC는 파일 시스템 쓰기 시도, 실패해도 메모리 캐시 OK
    try {
      const dir = join(process.cwd(), "public", "daily-insights");
      await writeFile(join(dir, "latest.json"), JSON.stringify(payload, null, 2), "utf-8");
      await writeFile(join(dir, `${date}.json`), JSON.stringify(payload, null, 2), "utf-8");
    } catch {
      // Vercel 환경에서 fs 쓰기 실패는 정상. 운영 시 Vercel KV / Supabase로 교체.
    }

    return NextResponse.json({ ok: true, ...payload });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
