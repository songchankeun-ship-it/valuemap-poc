// 테마 인사이트 생성기 (Claude API)
// 매일 한 번 cron으로 실행되어 public/daily-insights/{YYYY-MM-DD}.json 저장.

import {
  THEME_INSIGHT_SYSTEM,
  buildThemeInsightMessage,
  validateThemeInsightOutput,
  type ThemeInsightInput,
  type ThemeInsightOutput,
} from "./prompts/theme-insight";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

export interface ThemeInsightResult {
  insight: ThemeInsightOutput;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costKRW: number;
  source: "live" | "sample";
}

export async function generateThemeInsight(input: ThemeInsightInput): Promise<ThemeInsightResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 미설정. 사전 생성 샘플로 폴백하세요.");
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: THEME_INSIGHT_SYSTEM,
      messages: [{ role: "user", content: buildThemeInsightMessage(input) }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Claude API ${res.status}: ${t}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (typeof text !== "string") throw new Error("응답에 텍스트가 없습니다.");

  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < 0) throw new Error("JSON을 찾을 수 없습니다.");
  const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  const insight = validateThemeInsightOutput(parsed);

  const usage = data.usage ?? { input_tokens: 0, output_tokens: 0 };
  const costUSD = (usage.input_tokens / 1_000_000) * 3 + (usage.output_tokens / 1_000_000) * 15;
  const costKRW = Number((costUSD * 1380).toFixed(2));

  return {
    insight,
    model: MODEL,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    costKRW,
    source: "live",
  };
}

import { createClient as createSbClient } from "@supabase/supabase-js";

/** Supabase daily_insights에서 최신 1건 조회(서버·익명키). 없으면 null. */
export async function getLatestStoredInsight(): Promise<{ dateKst: string; insight: ThemeInsightOutput } | null> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    const sb = createSbClient(url, key, { auth: { persistSession: false } });
    const { data } = await sb
      .from("daily_insights")
      .select("date_kst, insight")
      .order("date_kst", { ascending: false })
      .limit(1);
    if (data && data[0]) {
      return { dateKst: data[0].date_kst as string, insight: data[0].insight as ThemeInsightOutput };
    }
  } catch {
    /* 테이블 없거나 오류 → null */
  }
  return null;
}
