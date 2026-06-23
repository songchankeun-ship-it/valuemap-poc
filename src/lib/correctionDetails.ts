// 정정공시 — DART document.xml 본문 파싱 결과(public/data/correction-signals.json)로
// 정정 신호에 실제 '정정 전 → 정정 후' 핵심 수치를 사실 그대로 덧입힌다.
// 파일이 없으면 원본 그대로 반환(graceful no-op). 생성: scripts/fetch_correction_details.py
import fs from "fs";
import path from "path";
import type { SignalHit } from "./disclosure-signals";

interface CorrectionRow {
  rcept_no?: string;
  field?: string;        // 정정 항목명(예: 매출액·영업이익) — 있을 때만 접두
  before?: number;       // 정정 전 값(원)
  after?: number;        // 정정 후 값(원)
  date?: string;
}

let cache: Record<string, CorrectionRow[]> | null = null;
let loaded = false;

function load(): Record<string, CorrectionRow[]> {
  if (loaded) return cache ?? {};
  loaded = true;
  try {
    const p = path.join(process.cwd(), "public", "data", "correction-signals.json");
    if (fs.existsSync(p)) cache = JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    cache = null;
  }
  return cache ?? {};
}

/** 정정 전/후 수치를 사실 그대로의 짧은 절로 만든다. 값 없으면 빈 문자열. */
function correctionClause(row: CorrectionRow): string {
  // 정정 전·후가 모두 유한 숫자일 때만(빈값·null·NaN 방어). 부호는 보존(손실 정정 가능).
  const a = row.before;
  const b = row.after;
  if (typeof a !== "number" || !Number.isFinite(a)) return "";
  if (typeof b !== "number" || !Number.isFinite(b)) return "";
  // 원 -> 억원 반올림(형제 enrich와 동일 단위). 0억으로 동일하게 떨어지면 무의미하므로 생략.
  const aEok = Math.round(a / 1e8);
  const bEok = Math.round(b / 1e8);
  if (aEok === bEok) return "";
  // 항목명은 빈값·하이픈 방어 후 접두(있을 때만). 투자 판단 표현 없음 — 사실 수치만.
  const field = typeof row.field === "string" ? row.field.trim().replace(/^-+$/, "") : "";
  const prefix = field ? field + " " : "";
  return ` · ${prefix}정정 전 ${aEok.toLocaleString()}억원 → 정정 후 ${bEok.toLocaleString()}억원`;
}

/** 정정 신호에 실제 정정 전/후 수치를 덧입힘. 데이터 없으면 원본 그대로. */
export function enrichCorrection(stockCode: string | undefined, signal: SignalHit | null): SignalHit | null {
  if (!signal || signal.signalType !== "correction" || !stockCode) return signal;
  const rows = load()[stockCode];
  if (!rows || rows.length === 0) return signal;
  const match = rows.find((r) => r.rcept_no === signal.disclosure.rcept_no) ?? rows[0];
  const clause = correctionClause(match);
  if (!clause) return signal;
  // 기존 note(정정 안내)는 그대로 두고 사실 수치 절만 덧붙인다.
  return { ...signal, note: signal.note + clause };
}
