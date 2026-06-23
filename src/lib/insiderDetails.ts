// 임원·주요주주 소유변동 — DART elestock 수집 결과(public/data/insider-signals.json)로
// 공시 신호의 실제 방향·규모를 덧입힌다. 파일이 없으면 원본(추정) 그대로 반환.
// 생성: scripts/fetch_insider_details.py (송님 DART 키로 실행)
import type { SignalHit } from "./disclosure-signals";
import { loadSignalFile, matchRow } from "./signalDetailsShared";

interface InsiderRow {
  rcept_no?: string;
  direction?: string; // "긍정 가능" | "부정 가능" | "확인 필요"
  changeCnt?: number;
  ownCnt?: number;    // 보고 후 보유 수량
  rate?: string;      // 보고 후 보유 비율(%)
  ofcps?: string;
  repror?: string;
}

/** 보고 후 보유 수량·비율을 사실 그대로의 짧은 절로 만든다. 값 없으면 빈 문자열. */
function holdingClause(row: InsiderRow): string {
  const parts: string[] = [];
  if (typeof row.ownCnt === "number" && row.ownCnt > 0) {
    parts.push(`보유 ${row.ownCnt.toLocaleString()}주`);
  }
  const rate = (row.rate ?? "").replace("%", "").trim();
  if (rate && rate !== "-" && Number.isFinite(Number(rate))) {
    parts.push(`비율 ${rate}%`);
  }
  return parts.length ? ` · ${parts.join(" · ")}` : "";
}

/** 임원 보유변동 신호에 실제 방향·규모를 덧입힘. 데이터 없으면 원본 그대로. */
export function enrichInsider(stockCode: string | undefined, signal: SignalHit | null): SignalHit | null {
  if (!signal || signal.signalType !== "insider_buy" || !stockCode) return signal;
  const rows = loadSignalFile<InsiderRow>("insider-signals.json")[stockCode];
  if (!rows || rows.length === 0) return signal;
  const match = matchRow(rows, signal.disclosure.rcept_no);
  if (!match) return signal;
  const dir = match.direction;
  if (dir !== "긍정 가능" && dir !== "부정 가능" && dir !== "확인 필요") return signal;
  const cnt = Math.abs(match.changeCnt ?? 0);
  const who = match.ofcps || match.repror || "보고자";
  // 방향 텍스트는 그대로 두고, 보유 수량·비율이 있을 때만 사실 절을 덧붙인다.
  const base =
    dir === "긍정 가능"
      ? `장내매수 확인 (${who}, +${cnt.toLocaleString()}주)`
      : dir === "부정 가능"
      ? `장내매도·감소 확인 (${who}, -${cnt.toLocaleString()}주)`
      : signal.note;
  return {
    ...signal,
    direction: dir,
    strength: dir === "확인 필요" ? 55 : 88,
    note: base + holdingClause(match),
  };
}
