// 증자·전환사채 발행 결정 — DART piicDecsn/cvbdIsDecsn 수집 결과(public/data/capital-signals.json)로
// 증자/CB 공시 신호에 실제 발행 규모(발행금액·자금용도)를 사실 그대로 덧입힌다.
// 파일이 없으면 원본 그대로 반환(graceful no-op). 생성: scripts/fetch_capital_details.py
import type { SignalHit } from "./disclosure-signals";
import { loadSignalFile, matchRow, toEok, joinClause } from "./signalDetailsShared";

interface CapitalRow {
  rcept_no?: string;
  kind?: string;       // "유상증자" | "전환사채"
  amount?: number;     // 발행/조달 규모(원)
  fundsUse?: string;   // 자금용도 카테고리(예 "시설", "운영", "시설·운영")
  periodBgn?: string;
  periodEnd?: string;
  date?: string;
}

/** 발행 규모·자금용도를 사실 그대로의 짧은 절로 만든다. 값 없으면 빈 문자열. */
function capitalClause(row: CapitalRow): string {
  const parts: string[] = [];
  if (typeof row.amount === "number" && Number.isFinite(row.amount) && row.amount > 0) {
    const eok = toEok(row.amount);
    if (eok > 0) parts.push(`발행규모 ${eok.toLocaleString()}억원`);
  }
  // 자금용도는 사실 분류 문자열일 때만(빈값·기호 방어). 투자 판단 표현 없음.
  const use = (row.fundsUse ?? "").trim();
  if (use && use !== "-") {
    parts.push(`자금용도 ${use}`);
  }
  return joinClause(parts);
}

/** 증자·CB 신호에 실제 발행 규모를 덧입힘. 데이터 없으면 원본 그대로. */
export function enrichCapital(stockCode: string | undefined, signal: SignalHit | null): SignalHit | null {
  if (!signal || signal.signalType !== "capital_raise" || !stockCode) return signal;
  const rows = loadSignalFile<CapitalRow>("capital-signals.json")[stockCode];
  if (!rows || rows.length === 0) return signal;
  const match = matchRow(rows, signal.disclosure.rcept_no);
  if (!match) return signal;
  const clause = capitalClause(match);
  if (!clause) return signal;
  // 기존 note(자금용도 확인 권장 안내)는 그대로 두고 사실 규모 절만 덧붙인다.
  return { ...signal, note: signal.note + clause };
}
