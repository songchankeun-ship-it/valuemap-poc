import {
  BETA_FRICTION_OPTIONS,
  buildBetaFeedbackMailto,
  buildBetaFeedbackMessage,
  parseBetaFeedback,
} from "../src/lib/betaFeedback";

let failed = 0;
function check(name: string, condition: boolean) {
  if (!condition) {
    failed += 1;
    console.error(`FAIL: ${name}`);
  }
}

const valid = parseBetaFeedback({
  rating: 4,
  friction: "detail",
  comment: "점수 근거의 첫 문장이 조금 더 쉬우면 좋겠습니다.",
  email: " BETA@example.com ",
  completedSteps: 9,
});

check("valid feedback accepted", valid.ok);
if (valid.ok) {
  check("email normalized", valid.value.email === "beta@example.com");
  check("completed steps capped", valid.value.completedSteps === 3);
  const message = buildBetaFeedbackMessage(valid.value);
  check("message carries rating", message.includes("유용성: 4/5"));
  check("message carries friction label", message.includes("점수·근거 이해"));
  check("mailto uses contact address", buildBetaFeedbackMailto(valid.value).startsWith("mailto:contact@ornscore.com"));
}

for (const [name, input] of [
  ["rating below range", { rating: 0, friction: "none", comment: "충분한 의견" }],
  ["rating must be integer", { rating: 3.5, friction: "none", comment: "충분한 의견" }],
  ["unknown friction", { rating: 3, friction: "raw-value", comment: "충분한 의견" }],
  ["comment too short", { rating: 3, friction: "search", comment: "짧음" }],
  ["invalid email", { rating: 3, friction: "search", comment: "충분한 의견", email: "bad" }],
] as const) {
  check(`${name} rejected`, !parseBetaFeedback(input).ok);
}

check(
  "friction options unique",
  new Set(BETA_FRICTION_OPTIONS.map((option) => option.value)).size === BETA_FRICTION_OPTIONS.length,
);

if (failed > 0) {
  console.error(`beta-feedback tests FAILED (${failed})`);
  process.exit(1);
}

console.log("PASS beta-feedback: validation, normalization, message, and mail fallback");
