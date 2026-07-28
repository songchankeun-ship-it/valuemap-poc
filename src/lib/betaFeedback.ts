export const BETA_FRICTION_OPTIONS = [
  { value: "none", label: "막힘 없음" },
  { value: "start", label: "첫 화면" },
  { value: "search", label: "종목 검색" },
  { value: "detail", label: "점수·근거 이해" },
  { value: "watchlist", label: "관심 종목 저장" },
  { value: "login", label: "로그인" },
  { value: "other", label: "그 밖의 부분" },
] as const;

export type BetaFriction = (typeof BETA_FRICTION_OPTIONS)[number]["value"];

export type BetaFeedbackValue = {
  rating: number;
  friction: BetaFriction;
  comment: string;
  email: string | null;
  completedSteps: number;
};

export type BetaFeedbackParseResult =
  | { ok: true; value: BetaFeedbackValue }
  | { ok: false; error: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const FRICTION_VALUES = new Set<string>(BETA_FRICTION_OPTIONS.map((option) => option.value));

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function parseBetaFeedback(input: unknown): BetaFeedbackParseResult {
  const body = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const rating = Number(body.rating);
  const friction = text(body.friction, 32);
  const comment = text(body.comment, 1500);
  const email = text(body.email, 200).toLowerCase();
  const completedSteps = Number(body.completedSteps);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "유용성을 1점부터 5점 사이에서 선택해주세요." };
  }
  if (!FRICTION_VALUES.has(friction)) {
    return { ok: false, error: "가장 막혔던 구간을 선택해주세요." };
  }
  if (comment.length < 5) {
    return { ok: false, error: "의견을 5자 이상 적어주세요." };
  }
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, error: "이메일 형식을 확인해주세요." };
  }

  return {
    ok: true,
    value: {
      rating,
      friction: friction as BetaFriction,
      comment,
      email: email || null,
      completedSteps:
        Number.isInteger(completedSteps) && completedSteps >= 0
          ? Math.min(completedSteps, 3)
          : 0,
    },
  };
}

export function betaFrictionLabel(friction: BetaFriction): string {
  return BETA_FRICTION_OPTIONS.find((option) => option.value === friction)?.label ?? friction;
}

export function buildBetaFeedbackMessage(value: BetaFeedbackValue): string {
  return [
    "[창립 베타 피드백]",
    `유용성: ${value.rating}/5`,
    `가장 막힌 구간: ${betaFrictionLabel(value.friction)}`,
    `완료한 체험 단계: ${value.completedSteps}/3`,
    "",
    value.comment,
  ].join("\n");
}

export function buildBetaFeedbackMailto(value: BetaFeedbackValue): string {
  const subject = "[오른스코어 창립 베타] 사용 의견";
  const body = buildBetaFeedbackMessage(value);
  return `mailto:contact@ornscore.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
