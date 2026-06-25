// 5가지 시장 신호 디텍터 — dart-signals 봇의 Python 로직을 TS로 포팅.
// 사이트에서 종목/공시 페이지의 배지·필터로 활용.

import type { Disclosure } from "./dart";

export type SignalType =
  | "treasury_buy"
  | "insider_buy"
  | "correction"
  | "single_contract"
  | "capital_raise";

export interface SignalHit {
  signalType: SignalType;
  signalLabel: string;
  disclosure: Disclosure;
  strength: number;       // 0~100 — '분류 신뢰도'(보고서 종류를 맞게 분류했다는 확신). 호재/악재 점수 아님.
  note: string;
  direction?: "긍정 가능" | "부정 가능" | "확인 필요";  // 방향(있을 때만)
}

// ---------- 정규식 ----------

const RE_TREASURY_BUY = /자기주식\s*취득/;
const RE_TREASURY_SELL = /자기주식\s*처분/;
const RE_INSIDER = /임원[ㆍ·, ]*주요주주/;
const RE_CORRECTION = /정정/;
const RE_PNL_KEYWORDS = /(매출액?|영업[손익이익]+|순?이익|손익|실적)/;
const RE_SINGLE_CONTRACT = /단일판매[ㆍ·, ]*공급계약체결/;
const RE_RIGHTS_ISSUE = /유상증자/;
const RE_CB = /전환사채[권]?\s*발행/;
const RE_BW = /신주인수권부사채[권]?\s*발행/;

// ---------- 디텍터들 ----------

function detectTreasuryBuy(d: Disclosure): SignalHit | null {
  if (RE_TREASURY_SELL.test(d.report_nm)) return null;
  if (!RE_TREASURY_BUY.test(d.report_nm)) return null;
  return {
    signalType: "treasury_buy",
    signalLabel: "자기주식 취득 결의",
    disclosure: d,
    strength: 80,
    note: "자기주식 취득 결의 — 취득 규모·소각 여부는 원문 확인 필요",
  };
}

function detectInsiderBuy(d: Disclosure): SignalHit | null {
  if (!RE_INSIDER.test(d.report_nm)) return null;
  const rm = (d.rm ?? "").toLowerCase();
  const nm = d.report_nm;
  // ⚠️ 소유상황보고서는 제목만으론 매수/매도를 알 수 없음. 단서가 명확할 때만 방향 추정.
  const buyHint = rm.includes("장내매수") || nm.includes("장내매수");
  const sellHint = rm.includes("장내매도") || nm.includes("장내매도") || nm.includes("처분");
  let direction: "긍정 가능" | "부정 가능" | "확인 필요" = "확인 필요";
  if (buyHint && !sellHint) direction = "긍정 가능";
  else if (sellHint && !buyHint) direction = "부정 가능";
  const known = direction !== "확인 필요";
  return {
    signalType: "insider_buy",
    signalLabel: "임원·주요주주 보유 변동",
    direction,
    disclosure: d,
    strength: known ? 80 : 50,
    note: direction === "긍정 가능"
      ? "장내매수 단서 발견 — 다만 주체·규모는 본문 확인 권장"
      : direction === "부정 가능"
      ? "장내매도/처분 단서 — 매수 신호 아님, 주의"
      : "소유 변동 보고서 — 매수·매도·스톡옵션·증여 등 사유는 본문 확인 필요",
  };
}

function detectCorrection(d: Disclosure): SignalHit | null {
  if (!RE_CORRECTION.test(d.report_nm)) return null;
  const isPnL = RE_PNL_KEYWORDS.test(d.report_nm);
  return {
    signalType: "correction",
    signalLabel: "정정공시",
    disclosure: d,
    strength: isPnL ? 75 : 45,
    note: isPnL ? "손익 관련 정정 → 강한 신호" : "일반 정정",
  };
}

function detectSingleContract(d: Disclosure): SignalHit | null {
  if (!RE_SINGLE_CONTRACT.test(d.report_nm)) return null;
  return {
    signalType: "single_contract",
    signalLabel: "단일판매·공급계약",
    disclosure: d,
    strength: 70,
    note: "계약금액·직전매출 비율은 본문 확인 권장",
  };
}

function detectCapitalRaise(d: Disclosure): SignalHit | null {
  const isRights = RE_RIGHTS_ISSUE.test(d.report_nm);
  const isCb = RE_CB.test(d.report_nm);
  const isBw = RE_BW.test(d.report_nm);
  if (!isRights && !isCb && !isBw) return null;
  const kind = isRights ? "유상증자" : isCb ? "전환사채" : "신주인수권부사채";
  return {
    signalType: "capital_raise",
    signalLabel: `${kind} 발행`,
    disclosure: d,
    strength: 65,
    note: "자금 사용 목적(시설 vs 운영) 확인 권장",
  };
}

const DETECTORS = [
  detectTreasuryBuy,
  detectInsiderBuy,
  detectCorrection,
  detectSingleContract,
  detectCapitalRaise,
];

/**
 * 공시 리스트에서 5가지 신호 추출. 한 공시가 여러 신호에 매칭되면 모두 보존.
 * 결과는 강도 내림차순 정렬.
 */
export function detectSignals(disclosures: Disclosure[]): SignalHit[] {
  const hits: SignalHit[] = [];
  for (const d of disclosures) {
    for (const det of DETECTORS) {
      const hit = det(d);
      if (hit) hits.push(hit);
    }
  }
  return hits.sort((a, b) => b.strength - a.strength);
}

/**
 * 한 공시의 첫 매칭 신호만 반환 (UI 배지용 — 중복 표시 방지).
 */
export function firstSignalOf(disclosure: Disclosure): SignalHit | null {
  for (const det of DETECTORS) {
    const hit = det(disclosure);
    if (hit) return hit;
  }
  return null;
}

/** 신호 종류별 색상 (UI 통일) */
export const SIGNAL_COLORS: Record<SignalType, { bg: string; text: string }> = {
  treasury_buy:    { bg: "bg-green-100",  text: "text-green-700" },
  insider_buy:     { bg: "bg-emerald-100", text: "text-emerald-700" },
  correction:      { bg: "bg-amber-100",  text: "text-amber-700" },
  single_contract: { bg: "bg-blue-100",   text: "text-blue-700" },
  capital_raise:   { bg: "bg-purple-100", text: "text-purple-700" },
};
