// 요금제(Free/Pro/Premium) 정보 단일 출처 — 모든 요금제 화면 문구가 여기서 파생되게.
// 실제 결제는 연결돼 있지 않다. Pro/Premium은 "준비 중(planned)"이며 가격은 전부 "미확정"이다.
// 절대 단일 확정 금액으로 보이게 쓰지 않는다(priceConfirmed=false 유지). 출시 전 법무·사업 확정·공지 대상.
import { FREE_COMPARE_LIMIT, FREE_WATCHLIST_LIMIT, FREE_AI_LIMIT } from "@/lib/limits";

export type PlanStatus = "active" | "planned";

export interface Plan {
  id: "free" | "pro" | "premium";
  name: string;
  status: PlanStatus;
  // 가격은 "검토 중 · 미확정" 형태로만 — 단일 확정 금액으로 보이지 않게.
  priceLabel: string;
  // 가격이 확정됐는지. 현재 전부 false(요금제 미확정).
  priceConfirmed: boolean;
  tagline: string;
  // §11 가치 한 줄 — "시간 절약·변화 알림·기록·리서치 보조" 프레이밍(수익률/매수·매도 표현 금지).
  valueLine: string;
  includes: string[];
}

// §11.2 / §19.1 Free — 실제 이용 가능. 한도는 limits.ts 단일 출처에서.
const FREE_INCLUDES = [
  "오늘의 후보 종목 · 오늘의 브리핑",
  "138개 종목 탐색 + 질문형 프리셋",
  "종목 상세(등급·차트·초보자 해석·공시)",
  `관심 종목 ${FREE_WATCHLIST_LIMIT}개 · 비교 ${FREE_COMPARE_LIMIT}개`,
  `AI 분석 월 ${FREE_AI_LIMIT}회`,
  "관심 종목 공시 알림 · 저장 조건 알림 (이메일)",
];

// §11.3 / §19.1 Pro — 준비 중(미발송/미과금). 가격 미확정.
const PRO_INCLUDES = [
  "관심 종목 무제한 + 점수 급변·거래활성도 알림",
  "저장 필터 + 저장 조건 결과 알림 (확장)",
  "장기 점수 변화 히스토리 · 업종 대비 비교",
  "백테스트 상세 리포트",
  "주간 요약 리포트 메일",
  "무료보다 많은 AI 분석 (구체 이용량은 출시 시 공개)",
];

// §11.4 / §19.1 Premium — 준비 중(미구현). 가격 미확정.
const PREMIUM_INCLUDES = [
  "개인화 대시보드",
  "백테스트 조건 커스터마이징",
  "공시 후 주가 반응 통계",
  "CSV 다운로드",
  "고급 필터 · 업종별 랭킹",
  "자동 리포트 · 다중 관심 그룹",
];

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "무료",
    status: "active",
    priceLabel: "₩0",
    priceConfirmed: true,
    tagline: "탐색 · 기본 지표 · 오늘 후보까지 무료로 충분히",
    valueLine:
      "결제 없이 핵심 가치(탐색·기본 점수·오늘 후보·공시 일부)를 먼저 경험할 수 있어요.",
    includes: FREE_INCLUDES,
  },
  {
    id: "pro",
    name: "Pro",
    status: "planned",
    // 단일 확정 금액 금지 — 범위 + "확정 아님" 명시.
    priceLabel: "검토 중 · 미확정 (예상 월 9,900~14,900원, 확정 아님)",
    priceConfirmed: false,
    tagline: "매번 직접 찾는 시간을 아끼고 변화를 놓치지 않도록 (준비 중)",
    valueLine:
      "왜 Pro인가 — 직접 찾아보는 시간을 아끼고, 관심 종목의 변화를 놓치지 않으며, 분석을 기록·관리하기 위한 도구예요. 수익률 향상이나 매수·매도 조언은 제공하지 않습니다.",
    includes: PRO_INCLUDES,
  },
  {
    id: "premium",
    name: "Premium",
    status: "planned",
    priceLabel: "검토 중 · 미확정 (예상 월 29,000원대, 확정 아님)",
    priceConfirmed: false,
    tagline: "리서치 보조를 더 깊게 — 대시보드·통계·내보내기 (준비 중)",
    valueLine:
      "왜 Premium인가 — 개인화 대시보드·공시 반응 통계·CSV 내보내기처럼 리서치를 더 깊게 보조하는 기능을 모은 구성(준비 중)이에요. 역시 매수·매도 추천이 아닌 데이터·도구 제공입니다.",
    includes: PREMIUM_INCLUDES,
  },
];

// Free/Pro/Premium 기능 비교표 — PLANS와 같은 사실에서 파생(과장 없이).
// cell: true=포함(✓) · false=미포함(—) · 문자열은 그대로 표시("준비 중"=출시 예정, "20개" 등 한도).
export type CompareCell = boolean | string;

export interface CompareRow {
  label: string;
  free: CompareCell;
  pro: CompareCell;
  premium: CompareCell;
}

export const COMPARE_ROWS: CompareRow[] = [
  { label: "종목 탐색 · 질문형 프리셋", free: true, pro: true, premium: true },
  { label: "종목 상세(등급·차트·공시·점수 근거)", free: true, pro: true, premium: true },
  { label: "관심 종목", free: `${FREE_WATCHLIST_LIMIT}개`, pro: "준비 중", premium: "준비 중" },
  { label: "종목 비교", free: `${FREE_COMPARE_LIMIT}개`, pro: "준비 중", premium: "준비 중" },
  { label: "관심 종목 공시 알림 · 저장 조건 알림", free: true, pro: true, premium: true },
  { label: "점수 급변 · 거래활성도 알림", free: false, pro: "준비 중", premium: "준비 중" },
  { label: "장기 점수 변화 히스토리", free: false, pro: "준비 중", premium: "준비 중" },
  { label: "백테스트 상세 리포트 · 주간 요약 메일", free: false, pro: "준비 중", premium: "준비 중" },
  { label: "개인화 대시보드", free: false, pro: false, premium: "준비 중" },
  { label: "백테스트 조건 커스터마이징", free: false, pro: false, premium: "준비 중" },
  { label: "공시 후 주가 반응 통계", free: false, pro: false, premium: "준비 중" },
  { label: "CSV 다운로드 · 고급 필터 · 업종 랭킹", free: false, pro: false, premium: "준비 중" },
];
