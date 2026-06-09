// GET /api/cron/save-scores — 매일 점수를 Supabase에 저장
// vercel.json: { "path": "/api/cron/save-scores", "schedule": "0 8 * * *" }  (UTC 08:00 = KST 17:00, 장 마감 후 1시간)

import { NextResponse } from "next/server";
import { realStockPool, dataMetadata } from "@/lib/realStocks";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

function toIsoDate(input?: string): string | null {
  if (!input) return null;
  // YYYYMMDD
  if (input.length === 8 && /^\d{8}$/.test(input)) {
    return `${input.slice(0, 4)}-${input.slice(4, 6)}-${input.slice(6, 8)}`;
  }
  // ISO (YYYY-MM-DD...)
  if (input.length >= 10 && input[4] === "-" && input[7] === "-") {
    return input.slice(0, 10);
  }
  return null;
}

export async function GET(req: Request) {
  // Cron 인증
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? "dev-only"}`;
  if (process.env.CRON_SECRET && auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // asOfBusinessDate가 없으면 generatedAt(ISO)에서 추출
    const businessDate = toIsoDate(dataMetadata.asOfBusinessDate) ?? toIsoDate(dataMetadata.generatedAt);
    if (!businessDate) {
      return NextResponse.json({ error: "No business date available" }, { status: 400 });
    }

    const records = realStockPool.map((s) => {
      const composite = s.compositeScore ?? Math.round((s.momentum + s.flow + s.value + s.vol) / 4);
      return {
        ticker: s.ticker,
        business_date: businessDate,
        momentum: s.momentum,
        flow: s.flow,
        value: s.value,
        vol: s.vol,
        composite,
      };
    });

    const supabase = createAdminClient();

    // 100개씩 batch upsert
    let saved = 0;
    for (let i = 0; i < records.length; i += 100) {
      const batch = records.slice(i, i + 100);
      const { error } = await supabase
        .from("daily_scores")
        .upsert(batch, { onConflict: "ticker,business_date" });
      if (error) {
        console.error("upsert error batch", i, error);
        continue;
      }
      saved += batch.length;
    }

    return NextResponse.json({
      success: true,
      businessDate,
      saved,
      total: records.length,
    });
  } catch (e) {
    console.error("save-scores error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
