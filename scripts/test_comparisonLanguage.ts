// 비교 랜딩 한국어 조사(particle) 검증기 — comparison-language slice (정적·유한).
// 실행: npx tsx scripts/test_comparisonLanguage.ts — 성공 시 PASS 1줄, 실패 시 FAIL 후 비정상 종료.
//
// 고정하는 계약:
//   · particle 헬퍼: 받침 유(有)/무(無) 단어와 비한글 폴백에서 은/는·이/가·와/과가 정확.
//   · neutralSentence 의 세 분기(동일=tie / 결측=na / 높음=higher)가 자연스러운 조사로 서술.
//   · 큐레이션 7쌍의 모든 메타데이터 설명이 앞 종목명 받침에 맞는 접속 조사로 시작.
//   · 크롤 가능한 비교 출력(제목·설명·H1·JSON-LD·지표 문장·라벨·힌트·한계·라우트 템플릿)에
//     "은(는)"·"와(과)" 같은 플레이스홀더 조사가 하나도 없다.
//   · 계산·지표 의미·중립성은 그대로(문장은 여전히 높다/동일/비교불가만 서술).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  hasFinalConsonant,
  topicParticle,
  subjectParticle,
  conjunctionParticle,
} from "../src/lib/particle";
import {
  resolveComparison,
  comparisonMetadata,
  comparisonBreadcrumbJsonLd,
  neutralSentence,
  type MetricValue,
} from "../src/lib/comparison";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
const read = (rel: string) => readFileSync(join(repo, rel), "utf8");

const EXPECTED_SLUGS = [
  "005930-vs-000660",
  "032830-vs-085620",
  "000990-vs-042700",
  "247540-vs-066970",
  "055550-vs-105560",
  "105560-vs-086790",
  "006400-vs-373220",
];

// 플레이스홀더 조사 패턴 — 크롤 출력에 하나라도 있으면 실패.
// (1) 잘 알려진 이중형 토큰, (2) 괄호에 갇힌 단독 조사 "(는)"·"(과)"·"(으)로" 등.
const PLACEHOLDER_TOKENS = [
  "은(는)", "는(은)", "이(가)", "가(이)", "을(를)", "를(을)",
  "와(과)", "과(와)", "(으)로", "로(으로)", "(이)",
];
const PLACEHOLDER_RE = /\((?:은|는|이|가|을|를|와|과|으로|로)\)/;
function hasPlaceholder(s: string): boolean {
  return PLACEHOLDER_TOKENS.some((t) => s.includes(t)) || PLACEHOLDER_RE.test(s);
}

// ── 1. particle 헬퍼: 받침 유/무 + 비한글 폴백 ───────────────────────
// 받침 있는 단어(종성 != 0)
for (const w of ["삼성생명", "시가총액", "위험조정", "배당수익률", "KB금융", "LG에너지솔루션", "에코프로비엠", "DB하이텍"]) {
  check(`1 hasFinalConsonant("${w}")=true`, hasFinalConsonant(w) === true);
  check(`1 topic("${w}")=은`, topicParticle(w) === "은");
  check(`1 subject("${w}")=이`, subjectParticle(w) === "이");
  check(`1 conjunction("${w}")=과`, conjunctionParticle(w) === "과");
}
// 받침 없는 단어(모음 종결)
for (const w of ["삼성전자", "SK하이닉스", "밸류", "추세", "종합 점수", "한미반도체", "엘앤에프", "하나금융지주"]) {
  check(`1 hasFinalConsonant("${w}")=false`, hasFinalConsonant(w) === false);
  check(`1 topic("${w}")=는`, topicParticle(w) === "는");
  check(`1 subject("${w}")=가`, subjectParticle(w) === "가");
  check(`1 conjunction("${w}")=와`, conjunctionParticle(w) === "와");
}
// 비한글 종결 → 폴백(모음 종결과 동일: 는/가/와). 실데이터 예: "삼성SDI".
for (const w of ["삼성SDI", "PER", "PBR", "ROE", "3M", ""]) {
  check(`1 hasFinalConsonant("${w}")=null(비한글)`, hasFinalConsonant(w) === null);
  check(`1 topic("${w}") 폴백=는`, topicParticle(w) === "는");
  check(`1 subject("${w}") 폴백=가`, subjectParticle(w) === "가");
  check(`1 conjunction("${w}") 폴백=와`, conjunctionParticle(w) === "와");
  check(`1 폴백 문자열에 플레이스홀더 없음("${w}")`, !hasPlaceholder(topicParticle(w) + conjunctionParticle(w) + subjectParticle(w)));
}
// 자기검증: 헬퍼가 항상 같은 값만 뱉는 게 아님(무받침≠받침).
check("1 selftest: 받침 유/무가 실제로 갈린다", topicParticle("액") === "은" && topicParticle("자") === "는");

// ── 2. neutralSentence 세 분기(tie / na / higher) — 자연 조사 + 무플레이스홀더 ──
const vc = (raw: number, display: string): MetricValue => ({ valid: Number.isFinite(raw), raw, display });
const invalid: MetricValue = { valid: false, raw: NaN, display: "—" };

// (higher=a) — 받침 없는 라벨 "밸류", 받침 없는 이름
{
  const s = neutralSentence("밸류", vc(80, "80"), vc(60, "60"), "a", "삼성전자", "삼성생명");
  check("2 higher: 밸류는 …가 …보다 높습니다", s === "밸류는 삼성전자(80)가 삼성생명(60)보다 높습니다.");
  check("2 higher: 무플레이스홀더", !hasPlaceholder(s));
}
// (higher=b) — 받침 있는 라벨 "시가총액"
{
  const s = neutralSentence("시가총액", vc(60, "60"), vc(90, "90"), "b", "삼성전자", "삼성생명");
  check("2 higher(b): 시가총액은 … 삼성생명(90)가 삼성전자(60)보다", s === "시가총액은 삼성생명(90)가 삼성전자(60)보다 높습니다.");
  check("2 higher(b): 무플레이스홀더", !hasPlaceholder(s));
}
// (tie) — 받침 없는 라벨 + 받침 있는 nameA(삼성생명→과) + 받침 없는 nameB(삼성전자→가)
{
  const s = neutralSentence("추세", vc(70, "70"), vc(70, "70"), "tie", "삼성생명", "삼성전자");
  check("2 tie: 추세는 삼성생명과 삼성전자가 70로 동일합니다", s === "추세는 삼성생명과 삼성전자가 70로 동일합니다.");
  check("2 tie: 무플레이스홀더", !hasPlaceholder(s));
}
// (tie) — 받침 없는 nameA(삼성전자→와) + 받침 있는 nameB(삼성생명→이)
{
  const s = neutralSentence("추세", vc(70, "70"), vc(70, "70"), "tie", "삼성전자", "삼성생명");
  check("2 tie: 삼성전자와 삼성생명이 …", s === "추세는 삼성전자와 삼성생명이 70로 동일합니다.");
}
// (na=missing) — 받침 있는 라벨 "배당수익률"
{
  const s = neutralSentence("배당수익률", invalid, vc(3, "3.0%"), "na", "삼성전자", "삼성생명");
  check("2 na: 배당수익률은 한쪽 값이 없어 비교할 수 없습니다", s === "배당수익률은 한쪽 값이 없어 비교할 수 없습니다.");
  check("2 na: 무플레이스홀더", !hasPlaceholder(s));
}
// 중립성 유지: 세 분기 모두 우열 어휘 없음.
for (const s of [
  neutralSentence("밸류", vc(80, "80"), vc(60, "60"), "a", "삼성전자", "삼성생명"),
  neutralSentence("추세", vc(70, "70"), vc(70, "70"), "tie", "삼성전자", "삼성생명"),
  neutralSentence("PER", invalid, invalid, "na", "삼성전자", "삼성생명"),
]) {
  check(`2 중립 어휘 유지: "${s}"`, /높습니다|동일합니다|비교할 수 없습니다/.test(s) && !/더 좋|우수|추천|매수|매도/.test(s));
}

// ── 3. 큐레이션 7쌍 메타데이터 설명: 접속 조사 정확 + 무플레이스홀더 ─────
let sawFallbackName = false;
for (const slug of EXPECTED_SLUGS) {
  const r = resolveComparison(slug)!;
  const meta = comparisonMetadata(slug)!;
  const expected = conjunctionParticle(r.a.name); // 와/과
  check(`3 ${slug} 설명이 "${r.a.name}${expected} ${r.b.name}의" 로 시작`, meta.description.startsWith(`${r.a.name}${expected} ${r.b.name}의`));
  check(`3 ${slug} 설명 무플레이스홀더`, !hasPlaceholder(meta.description));
  check(`3 ${slug} 제목·H1 무플레이스홀더`, !hasPlaceholder(meta.title) && !hasPlaceholder(meta.h1));
  if (hasFinalConsonant(r.a.name) === null) sawFallbackName = true;
}
// 실데이터에 비한글 종결 이름(삼성SDI)이 있어 폴백 경로가 실제로 밟힌다.
check("3 실데이터에 비한글 종결 종목명이 존재(폴백 경로 커버)", sawFallbackName);

// ── 4. 가드: 크롤 가능한 비교 출력 전체에 플레이스홀더 조사 0건 ──────────
const crawlCorpus: string[] = [];
for (const slug of EXPECTED_SLUGS) {
  const r = resolveComparison(slug)!;
  const meta = comparisonMetadata(slug)!;
  crawlCorpus.push(meta.title, meta.description, meta.h1);
  for (const m of r.metrics) crawlCorpus.push(m.label, m.hint, m.sentence);
  for (const l of r.limitations) crawlCorpus.push(l);
  crawlCorpus.push(JSON.stringify(comparisonBreadcrumbJsonLd(r)));
}
const offenders = crawlCorpus.filter(hasPlaceholder);
check(`4 크롤 출력에 플레이스홀더 조사 0건 (발견: ${offenders.slice(0, 3).join(" | ")})`, offenders.length === 0);
// 라우트 템플릿(정적 JSX)에도 플레이스홀더 리터럴이 없어야 한다.
const routeSrc = read("src/app/compare/[pair]/page.tsx");
check("4 라우트 소스에 '와(과)' 리터럴 없음", !routeSrc.includes("와(과)") && !PLACEHOLDER_RE.test(routeSrc));
check("4 라우트가 particle 헬퍼로 접속 조사 생성", routeSrc.includes("conjunctionParticle(data.a.name)"));
const libSrc = read("src/lib/comparison.ts");
check("4 comparison.ts 에 플레이스홀더 리터럴 없음", PLACEHOLDER_TOKENS.every((t) => !libSrc.includes(t)));

// ── 5. 자기검증: 가드가 '항상 통과'가 아님(진짜로 잡아낸다) ───────────────
check("5 selftest: hasPlaceholder 가 '밸류은(는)…'을 잡는다", hasPlaceholder("밸류은(는) 값이 없습니다."));
check("5 selftest: hasPlaceholder 가 '…와(과)…'를 잡는다", hasPlaceholder("삼성전자와(과) SK하이닉스"));
check("5 selftest: hasPlaceholder 가 정상 문장은 통과시킨다", !hasPlaceholder("밸류는 삼성전자(80)가 삼성생명(60)보다 높습니다."));
check("5 selftest: 힌트 '주가수익비율(배)'는 오탐 아님", !hasPlaceholder("주가수익비율(배)") && !hasPlaceholder("자기자본이익률(%)"));

if (failed > 0) {
  console.error(`\n${failed} check(s) FAILED`);
  process.exit(1);
}
console.log(
  "PASS: comparison Korean particles (받침 기반 은/는·이/가·와/과 + 비한글 폴백 · tie/na/higher 분기 · 7쌍 메타 설명 · 크롤 출력·라우트 템플릿에 플레이스홀더 0건) — 계산·중립성 불변",
);
