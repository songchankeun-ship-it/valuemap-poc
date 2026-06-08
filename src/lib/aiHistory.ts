"use client";

import { createClient } from "@/lib/supabase/client";

export interface AnalysisOutput {
  oneLineSummary: string;
  scoreInterpretation: string;
  financialContext: string;
  themeContext: string;
  disclosureInsight: string;
  positives: string[];
  risks: string[];
  finalScore: number;
  finalNote: string;
}

export type AnalysisSource = "live" | "cache" | "sample";

export interface AnalysisRecord {
  id: string;
  ticker: string;
  tickerName: string | null;
  analysis: AnalysisOutput;
  model: string | null;
  source: AnalysisSource | null;
  costKRW: number | null;
  createdAt: string;
}

async function getUserId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function saveAnalysis(params: {
  ticker: string;
  tickerName?: string;
  analysis: AnalysisOutput;
  model?: string;
  source?: AnalysisSource;
  costKRW?: number;
}): Promise<{ ok: boolean; id?: string }> {
  const userId = await getUserId();
  if (!userId) return { ok: false };

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ai_analyses")
      .insert({
        user_id: userId,
        ticker: params.ticker,
        ticker_name: params.tickerName ?? null,
        analysis: params.analysis,
        model: params.model ?? null,
        source: params.source ?? null,
        cost_krw: params.costKRW ?? null,
      })
      .select("id")
      .single();
    if (error) {
      console.error("saveAnalysis error:", error);
      return { ok: false };
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ai-analyses-changed"));
    }
    return { ok: true, id: data?.id };
  } catch (e) {
    console.error("saveAnalysis failed:", e);
    return { ok: false };
  }
}

export async function getAnalysisHistory(limit = 50): Promise<AnalysisRecord[]> {
  const userId = await getUserId();
  if (!userId) return [];

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ai_analyses")
      .select("id, ticker, ticker_name, analysis, model, source, cost_krw, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id as string,
      ticker: r.ticker as string,
      tickerName: r.ticker_name as string | null,
      analysis: r.analysis as AnalysisOutput,
      model: r.model as string | null,
      source: r.source as AnalysisSource | null,
      costKRW: r.cost_krw as number | null,
      createdAt: r.created_at as string,
    }));
  } catch {
    return [];
  }
}

export async function deleteAnalysis(id: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  try {
    const supabase = createClient();
    await supabase
      .from("ai_analyses")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ai-analyses-changed"));
    }
  } catch (e) {
    console.error("deleteAnalysis failed:", e);
  }
}
