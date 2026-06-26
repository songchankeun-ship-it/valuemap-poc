// 기능 출시 상태 단일 출처 — 모든 페이지 문구가 여기 기준으로 일관되게.
// status: "active"(이용 가능) | "beta" | "planned"(출시 예정)
export const FEATURES = {
  // 관심 종목 공시 알림 — notify cron 가동 중, 무료(플랜 게이트 없음)
  watchlistDisclosureAlert: { status: "active", plan: "free" },
  // 저장 조건 알림 — evaluate-alerts cron
  conditionAlert: { status: "active", plan: "free" },
  // 점수 급변·고급 알림 / 데일리 브리핑 메일 등
  advancedAlerts: { status: "planned", plan: "pro" },
  // Pro 유료 요금제 — 준비 중(미과금)
  proPlan: { status: "planned" },
  // Premium 유료 요금제 — 준비 중(미정의·미과금)
  premiumPlan: { status: "planned" },
  // Premium 전용으로 분류된, 아직 만들어지지 않은 기능들(plan 경계만 표시 — 발송/과금 없음)
  personalDashboard: { status: "planned", plan: "premium" },
  backtestCustomConditions: { status: "planned", plan: "premium" },
  disclosureReactionStats: { status: "planned", plan: "premium" },
  csvDownload: { status: "planned", plan: "premium" },
  advancedFilters: { status: "planned", plan: "premium" },
  sectorRanking: { status: "planned", plan: "premium" },
  autoReport: { status: "planned", plan: "premium" },
} as const;

export type FeatureStatus = "active" | "beta" | "planned";
