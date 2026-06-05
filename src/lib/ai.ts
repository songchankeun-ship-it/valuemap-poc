// Anthropic Claude API 클라이언트 — JSON 응답 모드 강제, 비용 추적
// 사용 모델: claude-sonnet-4-6 (한 분석당 약 $0.03 = 40원)
//
// 키 발급: https://console.anthropic.com
// .env에 ANTHROPIC_API_KEY 추가하면 즉시 작동.
// 키 없으면 src/lib/aiSamples.ts 의 사전 생성 샘플로 폴백.

import {
  SYSTEM_PROMPT,
  buildUserMessage,
  validateOutput,
  type StockAnalysisInput,
  type StockAnalysisOutput,
} from "./prompts/stock-analysis";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

// 모델별 단가 (USD per 1M tokens) — 2026년 기준 추정. 실제 청구는 콘솔 확인.
const PRICING = {
  "claude-sonnet-4-6": { input: 3.00, output: 15.00 },
  "claude-haiku-4-5-20251001": { input: 0.80, output: 4.00 },
  "claude-opus-4-6": { input: 15.00, output: 75.00 },
} as const;

export interface AiAnalysisResult {
  analysis: StockAnalysisOutput;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  costKRW: number;
  source: "live" | "cache" | "sample";  // 출처 추적
}

/**
 * Claude API로 종목 분석 리포트 생성.
 * 키 없거나 호출 실패 시 throws — 호출자가 폴백 처리.
 */
export async function generateStockAnalysis(
  input: StockAnalysisInput
): Promise<AiAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 미설정. 사전 생성 샘플로 폴백하세요.");
  }

  const userMsg = buildUserMessage(input);

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMsg }],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Claude API ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const textContent = data.content?.[0]?.text;
  if (!textContent || typeof textContent !== "string") {
    throw new Error("Claude 응답에 텍스트가 없습니다.");
  }

  // JSON 추출 (마크다운 코드블록 가능성 처리)
  const jsonStart = textContent.indexOf("{");
  const jsonEnd = textContent.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < 0) {
    throw new Error("Claude 응답에서 JSON을 찾을 수 없습니다.");
  }
  const jsonStr = textContent.slice(jsonStart, jsonEnd + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`JSON 파싱 실패: ${(e as Error).message}`);
  }

  const analysis = validateOutput(parsed);

  // 비용 계산
  const usage = data.usage ?? { input_tokens: 0, output_tokens: 0 };
  const pricing = PRICING[MODEL] ?? PRICING["claude-sonnet-4-6"];
  const inputCost = (usage.input_tokens / 1_000_000) * pricing.input;
  const outputCost = (usage.output_tokens / 1_000_000) * pricing.output;
  const costUSD = inputCost + outputCost;
  const costKRW = costUSD * 1380;  // 대략 환율, 실시간이 아님

  return {
    analysis,
    model: MODEL,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    costUSD: Number(costUSD.toFixed(6)),
    costKRW: Number(costKRW.toFixed(2)),
    source: "live",
  };
}

/**
 * 종목 입력에서 캐시 키 생성. 같은 데이터면 같은 키.
 * 운영: 일별로 한 번 생성하므로 ticker+date면 충분.
 */
export function makeCacheKey(ticker: string, date?: string): string {
  const d = date ?? new Date().toISOString().slice(0, 10);
  return `ai-stock-${ticker}-${d}`;
}
