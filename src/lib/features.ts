// 기능 출시 상태 단일 출처 — 모든 페이지 문구가 여기 기준으로 일관되게.
// status: "active"(이용 가능) | "beta" | "planned"(출시 예정)
export const FEATURES = {
  // 관심 종목 공시 알림 — notify cron 가동 중, 무료(플랜 게이트 없음)
  watchlistDisclosureAlert: { status: "active", plan: "free" },
  // 저장 조건 알림 — evaluate-alerts cron
  conditionAlert: { status: "active", plan: "free" },
  // 점수 급변·고급 알림 / 데일리 브리핑 메일 등
  advancedAlerts: { status: "planned", plan: "pro" },
  // Pro 유료 요금제
  proPlan: { status: "planned" },
} as const;

export type FeatureStatus = "active" | "beta" | "planned";
