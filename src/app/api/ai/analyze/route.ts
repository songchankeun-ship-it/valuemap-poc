// POST /api/ai/analyze — 종목 AI 분석 생성/조회
//
// 흐름:
// 1. ticker로 종목 더미 데이터 조회 (운영: DB)
// 2. ANTHROPIC_API_KEY 있으면 Claude 호출 (live)
// 3. 키 없거나 실패하면 public/ai-samples/{ticker}.json 폴백 (sample)
// 4. 24시간 캐시 (운영: DB의 ai_stock_reports 테이블)
//
// Rate limit: IP당 일일 10회 (운영: Redis 또는 DB)
// PoC는 메모리 LRU로 간단하게.

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { generateStockAnalysis, makeCacheKey } from "@/lib/ai";
import type { StockAnalysisInput } from "@/lib/prompts/stock-analysis";
import { getMockStockInputForAI } from "@/lib/mockData";

// PoC용 메모리 캐시 (운영: Redis or DB)
const memCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24시간

// PoC용 메모리 rate limit (운영: Redis)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_PER_DAY = 10;
const ONE_DAY_MS = 1000 * 60 * 60 * 24;

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimits.set(ip, { count: 1, resetAt: now + ONE_DAY_MS });
    return { allowed: true, remaining: RATE_LIMIT_PER_DAY - 1 };
  }
  if (entry.count >= RATE_LIMIT_PER_DAY) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_PER_DAY - entry.count };
}

async function loadSample(ticker: string) {
  try {
    const path = join(process.cwd(), "public", "ai-samples", `${ticker}.json`);
    const raw = await readFile(path, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ticker = String(body.ticker ?? "").trim();
  if (!ticker) {
    return NextResponse.json({ error: "ticker가 필요합니다." }, { status: 400 });
  }

  // Rate limit
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "일일 분석 요청 한도(10회)를 초과했습니다. 내일 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // Cache hit
  const cacheKey = makeCacheKey(ticker);
  const cached = memCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({
      ...(cached.data as object),
      source: "cache",
      rateLimitRemaining: limit.remaining,
    });
  }

  // 1) 종목 데이터 조회
  const input: StockAnalysisInput | null = getMockStockInputForAI(ticker);
  if (!input) {
    return NextResponse.json(
      { error: `종목 ${ticker}을(를) 찾을 수 없습니다.` },
      { status: 404 }
    );
  }

  // 2) Claude 호출 시도
  try {
    const result = await generateStockAnalysis(input);
    memCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json({ ...result, rateLimitRemaining: limit.remaining });
  } catch (err) {
    // 3) 폴백: 사전 생성 샘플
    const sample = await loadSample(ticker);
    if (sample) {
      const payload = {
        analysis: sample.analysis,
        model: sample.model ?? "sample",
        inputTokens: 0,
        outputTokens: 0,
        costUSD: 0,
        costKRW: 0,
        source: "sample" as const,
        generatedAt: sample.generatedAt,
        note: "Claude API 키 미설정 또는 호출 실패 — 사전 생성 샘플로 응답.",
      };
      memCache.set(cacheKey, { data: payload, expiresAt: Date.now() + CACHE_TTL_MS });
      return NextResponse.json({ ...payload, rateLimitRemaining: limit.remaining });
    }
    return NextResponse.json(
      { error: `분석 생성 실패 + 샘플 없음: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
