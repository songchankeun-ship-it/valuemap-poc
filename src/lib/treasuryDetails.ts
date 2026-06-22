// 자기주식 취득 결정 — DART tsstkAqDecsn 수집 결과(public/data/treasury-signals.json)로
// 자사주 매입 공시 신호에 실제 규모(취득예정 주식수·금액)를 사실 그대로 덧입힌다.
// 파일이 없으면 원본 그대로 반환(graceful no-op). 생성: scripts/fetch_treasury_details.py
import fs from "fs";
import path from "path";
import type { SignalHit } from "./disclosure-signals";

interface TreasuryRow {
  rcept_no?: string;
  acqCnt?: number;     // 취득예정 주식수(보통주)
  acqAmount?: number;  // 취득예정 금액(원)
  periodBgn?: string;
  periodEnd?: string;
  date?: string;
}

let cache: Record<string, TreasuryRow[]> | null = null;
let loaded = false;

function load(): Record<string, TreasuryRow[]> {
  if (loaded) return cache ?? {};
  loaded = true;
  try {
    const p = path.join(process.cwd(), "public", "data", "treasury-signals.json");
    if (fs.existsSync(p)) cache = JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    cache = null;
  }
  return cache ?? {};
}

/** 취득예정 주식수·금액을 사실 그대로의 짧은 절로 만든다. 값 없으면 빈 문자열. */
function treasuryClause(row: TreasuryRow): string {
  const parts: string[] = [];
  if (typeof row.acqCnt === "number" && Number.isFinite(row.acqCnt) && row.acqCnt > 0) {
    parts.push(`취득예정 ${row.acqCnt.toLocaleString()}주`);
  }
  if (typeof row.acqAmount === "number" && Number.isFinite(row.acqAmount) && row.acqAmount > 0) {
    const eok = Math.round(row.acqAmount / 1e8);
    if (eok > 0) parts.push(`취득금액 ${eok.toLocaleString()}억원`);
  }
  return parts.length ? ` · ${parts.join(" · ")}` : "";
}

/** 자기주식 취득 신호에 실제 규모를 덧입힘. 데이터 없으면 원본 그대로. */
export function enrichTreasury(stockCode: string | undefined, signal: SignalHit | null): SignalHit | null {
  if (!signal || signal.signalType !== "treasury_buy" || !stockCode) return signal;
  const rows = load()[stockCode];
  if (!rows || rows.length === 0) return signal;
  const match = rows.find((r) => r.rcept_no === signal.disclosure.rcept_no) ?? rows[0];
  const clause = treasuryClause(match);
  if (!clause) return signal;
  // 기존 note(회사 본인 매수 신호 설명)는 그대로 두고 사실 규모 절만 덧붙인다.
  return { ...signal, note: signal.note + clause };
}
