// 임원·주요주주 소유변동 — DART elestock 수집 결과(public/data/insider-signals.json)로
// 공시 신호의 실제 방향·규모를 덧입힌다. 파일이 없으면 원본(추정) 그대로 반환.
// 생성: scripts/fetch_insider_details.py (송님 DART 키로 실행)
import fs from "fs";
import path from "path";
import type { SignalHit } from "./disclosure-signals";

interface InsiderRow {
  rcept_no?: string;
  direction?: string; // "긍정 가능" | "부정 가능" | "확인 필요"
  changeCnt?: number;
  ofcps?: string;
  repror?: string;
}

let cache: Record<string, InsiderRow[]> | null = null;
let loaded = false;

function load(): Record<string, InsiderRow[]> {
  if (loaded) return cache ?? {};
  loaded = true;
  try {
    const p = path.join(process.cwd(), "public", "data", "insider-signals.json");
    if (fs.existsSync(p)) cache = JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    cache = null;
  }
  return cache ?? {};
}

/** 임원 보유변동 신호에 실제 방향·규모를 덧입힘. 데이터 없으면 원본 그대로. */
export function enrichInsider(stockCode: string | undefined, signal: SignalHit | null): SignalHit | null {
  if (!signal || signal.signalType !== "insider_buy" || !stockCode) return signal;
  const rows = load()[stockCode];
  if (!rows || rows.length === 0) return signal;
  const match = rows.find((r) => r.rcept_no === signal.disclosure.rcept_no) ?? rows[0];
  const dir = match.direction;
  if (dir !== "긍정 가능" && dir !== "부정 가능" && dir !== "확인 필요") return signal;
  const cnt = Math.abs(match.changeCnt ?? 0);
  const who = match.ofcps || match.repror || "보고자";
  return {
    ...signal,
    direction: dir,
    strength: dir === "확인 필요" ? 55 : 88,
    note:
      dir === "긍정 가능"
        ? `장내매수 확인 (${who}, +${cnt.toLocaleString()}주)`
        : dir === "부정 가능"
        ? `장내매도·감소 확인 (${who}, -${cnt.toLocaleString()}주)`
        : signal.note,
  };
}
