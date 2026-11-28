import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import { persistPublishedScoreRequest, SCORE_UNIVERSE_SIZE } from "@/lib/publishedScorePersistence";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  return persistPublishedScoreRequest(req, {
    secret: process.env.SCORE_PERSIST_SECRET,
    environment: process.env.VERCEL_ENV,
    deploymentSha: process.env.VERCEL_GIT_COMMIT_SHA,
    readSnapshot: () => readFile(join(process.cwd(), "public", "data", "stocks.json")),
    openStore: () => {
      const supabase = createAdminClient();
      return {
        upsert: async (rows) => {
          const { error } = await supabase.from("daily_scores")
            .upsert(rows, { onConflict: "ticker,business_date" })
            .abortSignal(AbortSignal.timeout(12000));
          if (error) throw error;
        },
        read: async (date) => {
          const { data, error } = await supabase.from("daily_scores")
            .select("ticker,business_date,composite,momentum,flow,value,vol")
            .eq("business_date", date)
            .limit(SCORE_UNIVERSE_SIZE + 1)
            .abortSignal(AbortSignal.timeout(12000));
          if (error) throw error;
          return data;
        },
      };
    },
  });
}
