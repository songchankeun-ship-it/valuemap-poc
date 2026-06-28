// 요금제(/pricing) 화면 카피 — ko/en. 플랜 이름(Free/Pro/Premium)은 그대로,
// 가격/날짜는 원형 유지. 금융 카피는 양 언어 모두 보수적·비자문(매수/매도/수익보장 금지).
// 플랜 표시 데이터(설명·기능목록·비교표)는 src/lib/pricing.ts(한국어 단일 출처)에서 파생하되,
// 영어는 여기서 동일 구조로 충실 번역하여 제공한다. 플랜 id/구조는 동일하게 유지.
import type { Locale } from "@/lib/i18n";
import {
  FREE_COMPARE_LIMIT,
  FREE_WATCHLIST_LIMIT,
  FREE_AI_LIMIT,
} from "@/lib/limits";
import { PLANS, COMPARE_ROWS, type CompareCell } from "@/lib/pricing";

export type PlanId = "free" | "pro" | "premium";

// 비교표 셀 스타일링용 종류 — 한/영 표시값이 달라도 스타일은 종류로 결정.
export type CellKind = "yes" | "no" | "planned" | "betaFree" | "limit";

export interface LocalizedPlan {
  id: PlanId;
  name: string;
  status: "active" | "planned";
  priceLabel: string;
  /** Free일 때 헤더에 노출할 확정 가격(₩0 등). planned는 "가격 미확정" 류 표기를 별도로. */
  priceConfirmed: boolean;
  valueLine: string;
  includes: string[];
}

export interface LocalizedCompareRow {
  label: string;
  free: { kind: CellKind; text?: string };
  pro: { kind: CellKind; text?: string };
  premium: { kind: CellKind; text?: string };
}

// 한국어 비교표 셀(CompareCell)을 스타일 종류 + 표시 텍스트로 변환.
function classifyKoCell(value: CompareCell): { kind: CellKind; text?: string } {
  if (value === true) return { kind: "yes" };
  if (value === false) return { kind: "no" };
  if (value === "준비 중") return { kind: "planned", text: value };
  if (value === "베타 무료") return { kind: "betaFree", text: value };
  return { kind: "limit", text: value };
}

// 영어 셀 텍스트 — 한국어 종류는 유지, 표시 문구만 영문화. 한도 숫자는 그대로.
function enCellText(value: CompareCell): { kind: CellKind; text?: string } {
  const ko = classifyKoCell(value);
  if (ko.kind === "planned") return { kind: "planned", text: "Coming soon" };
  if (ko.kind === "betaFree") return { kind: "betaFree", text: "Free in beta" };
  if (ko.kind === "limit") {
    // 한국어 한도 "5개" → 영어 "5"
    const num = String(value).replace(/개$/, "");
    return { kind: "limit", text: num };
  }
  return ko;
}

// ── 영어 플랜 데이터 (한국어 PLANS와 같은 사실에서 파생) ──────────────
const FREE_INCLUDES_EN = [
  "Today's candidates · Today's briefing",
  "Explore 138 stocks + question-style presets",
  "Stock detail (grade · chart · beginner reading · disclosures)",
  `${FREE_WATCHLIST_LIMIT} watchlist items · ${FREE_COMPARE_LIMIT} comparisons`,
  `${FREE_AI_LIMIT} AI analyses per month`,
  "Watchlist disclosure & saved-condition alerts (free during beta · becomes Pro at launch)",
];

const PRO_INCLUDES_EN = [
  "Watchlist disclosure & saved-condition alerts (Pro core)",
  "Score-shift & trading-activity surge alerts",
  "Unlimited watchlist + expanded saved filters",
  "Long-term score-change history · sector comparison",
  "Detailed backtest report · weekly summary report email",
  "More AI analyses than Free (exact volume shared at launch)",
];

const PREMIUM_INCLUDES_EN = [
  "Personalized dashboard",
  "Custom backtest conditions",
  "Post-disclosure price-reaction statistics",
  "CSV download",
  "Advanced filters · sector rankings",
  "Automated reports · multiple watch groups",
];

const PLAN_INCLUDES_EN: Record<PlanId, string[]> = {
  free: FREE_INCLUDES_EN,
  pro: PRO_INCLUDES_EN,
  premium: PREMIUM_INCLUDES_EN,
};

const PLAN_PRICE_LABEL_EN: Record<PlanId, string> = {
  // 가격/숫자는 원형 유지(₩0 / 9,900~14,900 / 29,000) — "확정 아님" 문구만 영문화.
  free: "₩0",
  pro: "Under review · pricing not finalized (est. ₩9,900–14,900/mo, not confirmed)",
  premium: "Under review · pricing not finalized (est. ~₩29,000/mo, not confirmed)",
};

const PLAN_VALUELINE_EN: Record<PlanId, string> = {
  free:
    "Experience the core value (exploration · basic scores · today's candidates · some disclosures) first, without paying.",
  pro:
    "Why Pro — a tool to save the time you spend searching, avoid missing changes in your watched stocks, and record and manage your analysis. It does not promise better returns or give buy/sell advice.",
  premium:
    "Why Premium — a set that supports deeper research, like a personalized dashboard, disclosure-reaction statistics, and CSV export (in preparation). Again, it provides data and tools, not buy/sell recommendations.",
};

const PLAN_NAME_EN: Record<PlanId, string> = {
  free: "Free",
  pro: "Pro",
  premium: "Premium",
};

// 화면용 플랜 배열 — locale에 따라 ko(원본) 또는 en(번역).
export function plansByLocale(locale: Locale): LocalizedPlan[] {
  return PLANS.map((plan) => {
    if (locale === "en") {
      return {
        id: plan.id,
        name: PLAN_NAME_EN[plan.id],
        status: plan.status,
        priceLabel: PLAN_PRICE_LABEL_EN[plan.id],
        priceConfirmed: plan.priceConfirmed,
        valueLine: PLAN_VALUELINE_EN[plan.id],
        includes: PLAN_INCLUDES_EN[plan.id],
      };
    }
    return {
      id: plan.id,
      name: plan.name,
      status: plan.status,
      priceLabel: plan.priceLabel,
      priceConfirmed: plan.priceConfirmed,
      valueLine: plan.valueLine,
      includes: plan.includes,
    };
  });
}

// 비교표 row 라벨 — 한국어 row.label → 영어. 순서/구조는 COMPARE_ROWS와 동일.
const COMPARE_LABEL_EN: Record<string, string> = {
  "종목 탐색 · 질문형 프리셋": "Stock exploration · question-style presets",
  "종목 상세(등급·차트·공시·점수 근거)":
    "Stock detail (grade · chart · disclosures · score basis)",
  "관심 종목": "Watchlist",
  "종목 비교": "Stock comparison",
  "관심 종목 공시 알림 · 저장 조건 알림":
    "Watchlist disclosure & saved-condition alerts",
  "점수 급변 · 거래활성도 알림": "Score-shift & trading-activity alerts",
  "장기 점수 변화 히스토리": "Long-term score-change history",
  "백테스트 상세 리포트 · 주간 요약 메일":
    "Detailed backtest report · weekly summary email",
  "개인화 대시보드": "Personalized dashboard",
  "백테스트 조건 커스터마이징": "Custom backtest conditions",
  "공시 후 주가 반응 통계": "Post-disclosure price-reaction statistics",
  "CSV 다운로드 · 고급 필터 · 업종 랭킹":
    "CSV download · advanced filters · sector ranking",
};

export function compareRowsByLocale(locale: Locale): LocalizedCompareRow[] {
  return COMPARE_ROWS.map((row) => {
    const label =
      locale === "en" ? COMPARE_LABEL_EN[row.label] ?? row.label : row.label;
    const cell = locale === "en" ? enCellText : classifyKoCell;
    return {
      label,
      free: cell(row.free),
      pro: cell(row.pro),
      premium: cell(row.premium),
    };
  });
}

export const pricingCopy = {
  ko: {
    backHome: "← 홈으로",
    pageTitle: "요금제",
    intro: {
      free: "무료",
      proPremium: "Pro·Premium은 출시 예정(준비 중)",
      undecided: "검토 중·미확정",
      // 조합: "탐색·기본 분석은 계속 {free}입니다. {proPremium}이며, 아래 가격은 모두 {undecided}입니다."
    },
    introLead1: "탐색·기본 분석은 계속",
    introLead2: "입니다.",
    introLead3: "이며, 아래 가격은 모두",
    introLead4: "입니다.",
    plannedBadge: "출시 예정 · 준비 중",
    priceUndecided: "가격 미확정",
    freeCta: "지금 무료로 시작하기 →",
    waitlistPrompt: "아직 준비 중이에요. 출시되면 가장 먼저 알려드릴게요.",
    betaCard: {
      badge: "베타 무료",
      bodyStrong1: "관심 종목 공시 알림 · 저장 조건 알림",
      body2: "은 지금은 베타 기간 동안 무료로 쓸 수 있어요. 이 알림 기능은",
      bodyStrong3: "정식 출시 시 Pro 기능으로 전환될 예정",
      body4: "입니다. 전환 시점과 가격은 아직",
      bodyStrong5: "미확정",
      body6: "이며, 변경 전 미리 공지합니다.",
    },
    compare: {
      title: "기능 비교",
      legendYes: "제공",
      legendNo: "미제공",
      legendPlanned: "준비 중",
      legendPlannedNote: "= 출시 예정(아직 이용·발송·과금 없음)",
      legendBeta: "베타 무료",
      legendBetaNote: "= 베타 기간 한시 무료",
      colFeature: "기능",
      colFree: "무료",
      colPlannedNote: "준비 중",
      footer1:
        "가격·정책은 검토 중이며 출시 전 확정·공지됩니다. 현재 Pro·Premium은 결제·발송이 연결돼 있지 않습니다.",
      footer2a: "관심 종목 공시·저장 조건 알림은 지금은",
      footer2Strong: "베타 기간 무료",
      footer2b:
        "로 체험할 수 있으며, 정식 출시 시 Pro 기능으로 전환될 예정입니다.",
    },
    legalStrong1: "투자 추천이 아닌 데이터 기반 탐색 도구",
    legalBody1:
      "오른스코어는 ",
    legalBody2: "입니다. 모든 점수와 신호는 종목을 더 빠르게 탐색하기 위한 ",
    legalStrong2: "참고 정보",
    legalBody3:
      "이며, 매수·매도 추천이 아닙니다. 유료(Pro·Premium) 기능도 개별 종목 매수·매도 조언이 아니라 정보·변화 알림·리서치 보조를 제공합니다. ",
    legalStrong3: "최종 투자 판단과 책임은 사용자 본인에게 있습니다.",
  },
  en: {
    backHome: "← Home",
    pageTitle: "Pricing",
    intro: {
      free: "free",
      proPremium: "Pro and Premium are coming soon (in preparation)",
      undecided: "under review · not finalized",
    },
    introLead1: "Exploration and basic analysis stay",
    introLead2: ".",
    introLead3: ", and all prices below are",
    introLead4: ".",
    plannedBadge: "Coming soon · in preparation",
    priceUndecided: "Pricing not finalized",
    freeCta: "Start free now →",
    waitlistPrompt: "Still in preparation. We'll let you know first when it launches.",
    betaCard: {
      badge: "Free in beta",
      bodyStrong1: "Watchlist disclosure & saved-condition alerts",
      body2: "are free to use during the beta period for now. These alerts are",
      bodyStrong3: "planned to become a Pro feature at full launch",
      body4: ". The transition timing and price are still",
      bodyStrong5: "not finalized",
      body6: ", and we'll announce any change in advance.",
    },
    compare: {
      title: "Feature comparison",
      legendYes: "included",
      legendNo: "not included",
      legendPlanned: "Coming soon",
      legendPlannedNote: "= planned (no use, sending, or billing yet)",
      legendBeta: "Free in beta",
      legendBetaNote: "= free for a limited time during beta",
      colFeature: "Feature",
      colFree: "Free",
      colPlannedNote: "Coming soon",
      footer1:
        "Pricing and policy are under review and will be finalized and announced before launch. Pro and Premium currently have no payment or sending connected.",
      footer2a: "Watchlist disclosure & saved-condition alerts are currently",
      footer2Strong: "free during beta",
      footer2b:
        ", and are planned to become a Pro feature at full launch.",
    },
    legalStrong1: "a data-based exploration tool, not investment advice",
    legalBody1: "OrnScore is ",
    legalBody2: ". Every score and signal is ",
    legalStrong2: "reference information",
    legalBody3:
      " to help you explore stocks faster, not a buy or sell recommendation. Paid (Pro · Premium) features also provide information, change alerts, and research support — not individual buy/sell advice. ",
    legalStrong3: "The final investment decision and responsibility rest with you.",
  },
} as const satisfies Record<Locale, unknown>;

export const waitlistCopy = {
  ko: {
    placeholder: "이메일 주소",
    submit: "출시 알림 받기",
    submitting: "등록 중...",
    doneNew: "등록 완료! 출시되면 가장 먼저 알려드릴게요.",
    doneAlready: "이미 등록돼 있어요. 출시되면 가장 먼저 알려드릴게요!",
    errorGeneric: "오류가 발생했어요.",
    errorNetwork: "네트워크 오류 — 잠시 후 다시 시도해주세요.",
  },
  en: {
    placeholder: "Email address",
    submit: "Get launch notice",
    submitting: "Submitting...",
    doneNew: "You're on the list! We'll let you know first when it launches.",
    doneAlready: "You're already on the list. We'll let you know first when it launches!",
    errorGeneric: "Something went wrong.",
    errorNetwork: "Network error — please try again in a moment.",
  },
} as const satisfies Record<Locale, unknown>;
