// GET /api/disclosures/[ticker]?days=90&limit=20
// 종목별 최근 N일 공시 + 5가지 신호 자동 분류.
// DART 키 없으면 public/disclosure-samples/{ticker}.json 폴백.

import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { listDisclosuresByStock } from "@/lib/dart";
import { detectSignals, firstSignalOf, type SignalHit } from "@/lib/disclosure-signals";
import { enrichInsider } from "@/lib/insiderDetails";

// 메모리 캐시 (1시간)
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const TTL_MS = 1000 * 60 * 60;

async function loadSample(ticker: string) {
  try {
    const path = join(process.cwd(), "public", "disclosure-samples", `${ticker}.json`);
    const raw = await readFile(path, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const url = new URL(req.url);
  const days = Math.min(365, Math.max(7, Number(url.searchParams.get("days")) || 90));
  const limit = Math.min(100, Math.max(5, Number(url.searchParams.get("limit")) || 20));

  const cacheKey = `${ticker}-${days}-${limit}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ ...(cached.data as object), source: "cache" });
  }

  // DART 호출 시도
  try {
    const items = await listDisclosuresByStock(ticker, days, limit);
    if (items.length === 0) {
      // 비어 있으면 샘플로 폴백 시도
      const sample = await loadSample(ticker);
      if (sample) {
        return NextResponse.json({ ...sample, source: "sample-empty" });
      }
    }

    const signals = detectSignals(items);
    const withBadges = items.map((d) => ({
      ...d,
      url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${d.rcept_no}`,
      signal: enrichInsider(d.stock_code, firstSignalOf(d)),
    }));

    const payload = {
      ticker,
      count: items.length,
      lookbackDays: days,
      disclosures: withBadges,
      signalCount: signals.length,
      signalsByType: countByType(signals),
      source: "live" as const,
    };
    cache.set(cacheKey, { data: payload, expiresAt: Date.now() + TTL_MS });
    return NextResponse.json(payload);
  } catch (err) {
    // 폴백: 사전 생성 샘플
    const sample = await loadSample(ticker);
    if (sample) {
      cache.set(cacheKey, { data: { ...sample, source: "sample" }, expiresAt: Date.now() + TTL_MS });
      return NextResponse.json({
        ...sample,
        source: "sample",
        note: "DART 키 없음 또는 호출 실패 — 사전 생성 샘플로 응답.",
      });
    }
    return NextResponse.json(
      { error: `DART 호출 실패 + 샘플 없음: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

function countByType(signals: SignalHit[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of signals) {
    counts[s.signalLabel] = (counts[s.signalLabel] ?? 0) + 1;
  }
  return counts;
}
