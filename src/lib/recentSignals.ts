// 서버 사이드에서 최근 N일 공시 신호를 직접 추출 (SSR용).
// /api/disclosures/recent 와 동일 로직 — 페이지 서버 렌더에서 재사용.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { listDisclosures } from "./dart";
import { detectSignals } from "./disclosure-signals";
import { enrichInsider } from "./insiderDetails";
import type { ApiResponse } from "@/components/DisclosureExplorer";

async function loadSample(): Promise<ApiResponse | null> {
  try {
    const path = join(process.cwd(), "public", "disclosure-samples", "recent-signals.json");
    return JSON.parse(await readFile(path, "utf-8"));
  } catch {
    return null;
  }
}

export async function getRecentSignals(days = 7): Promise<ApiResponse> {
  const d = Math.min(30, Math.max(1, days || 7));
  const end = new Date();
  const bgn = new Date(end.getTime() - d * 24 * 60 * 60 * 1000);
  const fmt = (x: Date) => x.toISOString().slice(0, 10).replace(/-/g, "");
  try {
    const [kospi, kosdaq] = await Promise.all([
      listDisclosures({ bgnDe: fmt(bgn), endDe: fmt(end), corpCls: "Y", pageCount: 100 }),
      listDisclosures({ bgnDe: fmt(bgn), endDe: fmt(end), corpCls: "K", pageCount: 100 }),
    ]);
    const all = [...kospi.items, ...kosdaq.items];
    const signals = detectSignals(all).map((s) => {
      const e = enrichInsider(s.disclosure.stock_code, s)!;
      return { ...e, disclosure: { ...e.disclosure, url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${e.disclosure.rcept_no}` } };
    });
    return { days: d, totalDisclosures: all.length, signalCount: signals.length, signals: signals.slice(0, 50) as ApiResponse["signals"] };
  } catch {
    const sample = await loadSample();
    if (sample) return sample;
    return { days: d, totalDisclosures: 0, signalCount: 0, signals: [] };
  }
}
