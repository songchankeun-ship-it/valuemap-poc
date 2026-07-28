import assert from "node:assert/strict";
import { isNaverLoginEnabled } from "../src/lib/auth/providers";

const cases = [
  {
    name: "both gates missing",
    env: {},
    expected: false,
  },
  {
    name: "configuration only",
    env: { NEXT_PUBLIC_ENABLE_NAVER_LOGIN: "true" },
    expected: false,
  },
  {
    name: "review approval only",
    env: { NEXT_PUBLIC_NAVER_REVIEW_APPROVED: "true" },
    expected: false,
  },
  {
    name: "configuration and review approval",
    env: {
      NEXT_PUBLIC_ENABLE_NAVER_LOGIN: "true",
      NEXT_PUBLIC_NAVER_REVIEW_APPROVED: "true",
    },
    expected: true,
  },
] as const;

for (const testCase of cases) {
  assert.equal(isNaverLoginEnabled(testCase.env), testCase.expected, testCase.name);
}

console.log(`Naver review gate: ${cases.length}/${cases.length} checks passed`);
