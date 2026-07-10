// compareQuery.ts 단위 assertion — 공유 링크(?stocks=...) 파싱 상태 경계 고정(회귀 가드).
// 실행: npx tsx scripts/test_compare_query.ts (실패 시 비정상 종료, 성공 시 PASS 1줄).
//
// 소스 브리프의 비교 페이지 QA 케이스를 그대로 고정한다:
//   /compare                                  → 유효 0개(빈/시작 상태만)
//   /compare?stocks=004170,078930,055550       → 유효 3개(결과만)
//   /compare?stocks=004170                      → 유효 1개(1개 더 안내)
//   /compare?stocks=004170,INVALID              → 유효 1개 + invalid 경고
//   /compare?stocks=중복                         → dedupe
//   /compare?stocks=5개                          → 최대 4개 반영 + 초과 안내
import { COMPARE_QUERY_MAX, parseCompareQuery } from "../src/lib/compareQuery";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}
function eq(a: unknown[], b: unknown[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// 브리프 유효 코드 집합(실제 풀 존재를 흉내낸 판정자). 나머지는 모두 invalid로 처리된다.
const VALID = new Set(["004170", "078930", "055550", "000070", "005930"]);
const isValid = (code: string) => VALID.has(code);

// 상한이 브리프(최대 4개)와 일치하는지 먼저 고정.
check("COMPARE_QUERY_MAX === 4", COMPARE_QUERY_MAX === 4);

// A. base /compare — 파라미터 없음 → 전부 비어야 한다(빈/시작 상태만).
{
  const r = parseCompareQuery(undefined, isValid);
  check("base: no initial", r.initialTickers.length === 0);
  check("base: no invalid", r.invalidTickers.length === 0);
  check("base: no truncated", r.truncatedTickers.length === 0);
}
// 빈 문자열도 동일.
check("empty string → no tickers", parseCompareQuery("", isValid).initialTickers.length === 0);

// B. 유효 3개 → 결과만(빈 상태 없음).
{
  const r = parseCompareQuery("004170,078930,055550", isValid);
  check("3 valid: initial=[004170,078930,055550]", eq(r.initialTickers, ["004170", "078930", "055550"]));
  check("3 valid: no invalid", r.invalidTickers.length === 0);
  check("3 valid: no truncated", r.truncatedTickers.length === 0);
}

// C. 유효 1개 → 1개 선택 상태(결과 아님, 클라이언트가 '1개 더' 안내).
{
  const r = parseCompareQuery("004170", isValid);
  check("1 valid: initial=[004170]", eq(r.initialTickers, ["004170"]));
  check("1 valid: no invalid", r.invalidTickers.length === 0);
}

// D. 유효 1 + invalid → 유효만 살리고 invalid 경고.
{
  const r = parseCompareQuery("004170,INVALID", isValid);
  check("invalid mix: initial=[004170]", eq(r.initialTickers, ["004170"]));
  check("invalid mix: invalid=[INVALID]", eq(r.invalidTickers, ["INVALID"]));
}
// 형식은 6자리지만 풀에 없는 코드도 invalid.
{
  const r = parseCompareQuery("004170,999999", isValid);
  check("unknown 6-digit → invalid=[999999]", eq(r.invalidTickers, ["999999"]));
  check("unknown 6-digit → initial=[004170]", eq(r.initialTickers, ["004170"]));
}

// E. 중복 → dedupe(앞선 항목만).
{
  const r = parseCompareQuery("004170,004170,078930", isValid);
  check("dup: initial=[004170,078930]", eq(r.initialTickers, ["004170", "078930"]));
  check("dup: no truncated", r.truncatedTickers.length === 0);
}
// 공백/대소문자 정규화.
{
  const r = parseCompareQuery(" 004170 , 078930 ", isValid);
  check("trim: initial=[004170,078930]", eq(r.initialTickers, ["004170", "078930"]));
}

// F. 5개(유효) → 최대 4개 반영 + 초과 1개 truncated.
{
  const r = parseCompareQuery("004170,078930,055550,000070,005930", isValid);
  check("5 valid: initial has 4", r.initialTickers.length === COMPARE_QUERY_MAX);
  check("5 valid: initial=first 4", eq(r.initialTickers, ["004170", "078930", "055550", "000070"]));
  check("5 valid: truncated=[005930]", eq(r.truncatedTickers, ["005930"]));
}
// 초과 자리의 중복은 truncated에도 들어가지 않는다(먼저 dedupe).
{
  const r = parseCompareQuery("004170,078930,055550,000070,004170", isValid);
  check("5 with dup overflow: no truncated", r.truncatedTickers.length === 0);
  check("5 with dup overflow: initial has 4", r.initialTickers.length === 4);
}
// 배열 형태(searchParams가 문자열 배열일 때) → 첫 값만 사용.
{
  const r = parseCompareQuery(["004170,078930", "055550"], isValid);
  check("array param: uses first only", eq(r.initialTickers, ["004170", "078930"]));
}

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed.`);
  process.exit(1);
}
console.log("PASS: compareQuery parsing boundaries hold (base/3-valid/1-valid/invalid/dedupe/overflow).");
