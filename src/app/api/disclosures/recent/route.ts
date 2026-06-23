// GET /api/disclosures/recent?days=7
// 전체 시장 최근 N일 공시 + 5가지 신호만 추출.
// 공시 페이지(/disclosures)가 사용.

import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { listDisclosures } from "@/lib/dart";
import { detectSignals } from "@/lib/disclosure-signals";
import { enrichInsider } from "@/lib/insiderDetails";
import { enrichTreasury } from "@/lib/treasuryDetails";
import { enrichCapital } from "@/lib/capitalDetails";
import { enrichContract } from "@/lib/contractDetails";

const cache = new Map<string, { data: unknown; expiresAt: number }>();
const TTL_MS = 1000 * 60 * 30; // 30분

async function loadSample() {
  try {
    const path = join(process.cwd(), "public", "disclosure-samples", "recent-signals.json");
    const raw = await readFile(path, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = Math.min(30, Math.max(1, Number(url.searchParams.get("days")) || 7));

  const cacheKey = `recent-${days}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ ...(cached.data as object), source: "cache" });
  }

  const end = new Date();
  const bgn = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

  try {
    // 코스피 + 코스닥 각각 한 페이지씩만 (DART 한도 보호)
    const [kospi, kosdaq] = await Promise.all([
      listDisclosures({ bgnDe: fmt(bgn), endDe: fmt(end), corpCls: "Y", pageCount: 100 }),
      listDisclosures({ bgnDe: fmt(bgn), endDe: fmt(end), corpCls: "K", pageCount: 100 }),
    ]);

    const all = [...kospi.items, ...kosdaq.items];
    const signals = detectSignals(all).map((s) => {
      const e = enrichContract(s.disclosure.stock_code, enrichCapital(s.disclosure.stock_code, enrichTreasury(s.disclosure.stock_code, enrichInsider(s.disclosure.stock_code, s))))!;
      return {
        ...e,
        disclosure: {
          ...e.disclosure,
          url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${e.disclosure.rcept_no}`,
        },
      };
    });

    const payload = {
      days,
      totalDisclosures: all.length,
      signalCount: signals.length,
      signals: signals.slice(0, 50),
      source: "live" as const,
    };
    cache.set(cacheKey, { data: payload, expiresAt: Date.now() + TTL_MS });
    return NextResponse.json(payload);
  } catch (err) {
    const sample = await loadSample();
    if (sample) {
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
