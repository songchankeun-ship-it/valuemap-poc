// 단일판매·공급계약 체결 — DART document.xml 본문 파싱 결과(public/data/contract-signals.json)로
// 단일계약 공시 신호에 실제 계약금액·직전매출 대비 비율을 사실 그대로 덧입힌다.
// 파일이 없으면 원본 그대로 반환(graceful no-op). 생성: scripts/fetch_contract_details.py
import type { SignalHit } from "./disclosure-signals";
import { loadSignalFile, matchRow, toEok, joinClause } from "./signalDetailsShared";

interface ContractRow {
  rcept_no?: string;
  amount?: number;       // 계약금액(원)
  salesRatio?: number | null;  // 직전(최근) 매출액 대비 비율(%)
  date?: string;
}

/** 계약금액·매출비율을 사실 그대로의 짧은 절로 만든다. 값 없으면 빈 문자열. */
function contractClause(row: ContractRow): string {
  const parts: string[] = [];
  if (typeof row.amount === "number" && Number.isFinite(row.amount) && row.amount > 0) {
    const eok = toEok(row.amount);
    if (eok > 0) parts.push(`계약금액 ${eok.toLocaleString()}억원`);
  }
  // 매출비율은 유한 양수일 때만(빈값·null 방어). 투자 판단 표현 없음 — 사실 비율만.
  if (typeof row.salesRatio === "number" && Number.isFinite(row.salesRatio) && row.salesRatio > 0) {
    const r = Math.round(row.salesRatio * 10) / 10;
    parts.push(`직전매출 대비 ${r}%`);
  }
  return joinClause(parts);
}

/** 단일계약 신호에 실제 계약금액·매출비율을 덧입힘. 데이터 없으면 원본 그대로. */
export function enrichContract(stockCode: string | undefined, signal: SignalHit | null): SignalHit | null {
  if (!signal || signal.signalType !== "single_contract" || !stockCode) return signal;
  const rows = loadSignalFile<ContractRow>("contract-signals.json")[stockCode];
  if (!rows || rows.length === 0) return signal;
  const match = matchRow(rows, signal.disclosure.rcept_no);
  if (!match) return signal;
  const clause = contractClause(match);
  if (!clause) return signal;
  // 기존 note(본문 확인 권장 안내)는 그대로 두고 사실 규모 절만 덧붙인다.
  return { ...signal, note: signal.note + clause };
}
