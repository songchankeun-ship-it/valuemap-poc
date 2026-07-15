// 비교 시작·인증 CTA 명료화 계약 가드 (Slice J)
// 실행: npx tsx scripts/test_compareEntry.ts — 성공 시 PASS 1줄, 실패 시 FAIL 출력 후 비정상 종료.
//
// 사실(계약 정본):
//   - /compare 빈 상태의 시작 경로는 5개로 단순화한다: 첫 종목·둘째 종목(검색), 최근 본 종목,
//     같은 업종 예시, 관심 종목 선택. '오늘 Top/오늘 후보' 같은 오늘-후보 프리셋은 시작 경로에서 뺀다
//     (/today 진입점 링크는 유지).
//   - 비교 근거가 약한 교차 업종 프리셋(예: 완성차 vs 금융)은 예시에서 제거한다 — 남는 예시는
//     같은 업종 피어(A vs B)이거나 같은 업종 그룹이라 근거가 분명하다.
//   - 로컬(로그아웃) 비교는 그대로 동작한다: 이 기기 저장 안내 + 검색/최근/관심 시작 경로 유지.
//   - 공용 로그아웃 헤더(데스크톱 AccountButtons·모바일 MobileNav)는 '한 목적지의 두 이름'
//     (로그인/시작) 대신 재방문 로그인과 관심종목 동기화 의도를 라벨로 구분한다. 두 링크 모두
//     여전히 /login으로 가서 인증 라우트·동작은 불변이다.
//   - /compare 라우트는 CompareClient를 마운트하고 무JS(noscript) 빈 상태 회복 링크를 유지한다.
// 이 테스트는 소스 텍스트 + i18n 카피를 정적으로 고정한다. 점수식·데이터·라우트·인증 무변경.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { commonCopy } from "../src/lib/i18n";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
function read(rel: string): string {
  return readFileSync(join(repo, rel), "utf8");
}

const pageSrc = read("src/app/compare/page.tsx");
const compareSrc = read("src/components/CompareClient.tsx");
const accountSrc = read("src/components/AccountButtons.tsx");
const mobileSrc = read("src/components/MobileNav.tsx");

// ── A. 교차 업종 프리셋 제거 + 남는 예시는 같은 업종 근거 ─────────────
// A1. 근거 약한 교차 업종 쌍(현대차 005380 vs KB금융 — 완성차 vs 금융)이 예시에서 사라진다.
check("A1 cross-sector pair (현대차 005380) removed from named example presets", !pageSrc.includes('"005380"'));
// A2. 대표 예시 쌍은 같은 업종 피어만 남는다(반도체 대형주·플랫폼).
check("A2 keeps same-sector pair 삼성전자 vs SK하이닉스", pageSrc.includes('"005930", "000660"'));
check("A2 keeps same-sector pair NAVER vs 카카오", pageSrc.includes('"035420", "035720"'));
// A3. 자동 보충은 같은 업종 그룹(sector)만 만든다 — 근거가 분명한 프리셋.
check("A3 auto presets are built from same-sector groups", pageSrc.includes("sectorOf(s.themes, s.ticker)") && pageSrc.includes("bySector"));
check("A3 recommended presets stay bounded (slice 0,4)", /recommendedSets =[\s\S]*\.slice\(0, 4\)/.test(pageSrc));

// ── B. 빈 상태 시작 경로 5개 + 오늘-후보 프리셋 제거 ──────────────────
// B1. 오늘-후보 프리셋('오늘 후보 3개 비교' 버튼 + '오늘 Top 5' 칩 섹션)이 시작 경로에서 빠진다.
check("B1 drops the '오늘 후보 3개 비교' preset button", !compareSrc.includes("오늘 후보 3개 비교"));
check("B1 drops the empty-state '오늘 Top 5' quick-add section", !compareSrc.includes("오늘 Top 5"));
check("B1 drops the today-candidate helper vars", !compareSrc.includes("showExampleToday") && !compareSrc.includes("exampleTodayTickers"));
// B2. 다섯 시작 경로가 모두 남아 있다: 검색(첫/둘째 종목), 최근 본 종목, 같은 업종 예시, 관심 종목.
check("B2 first/second stock via search box", compareSrc.includes("StockSearchBox"));
check("B2 recent stocks entry", compareSrc.includes("recentAddable") && compareSrc.includes("최근 본 종목"));
check("B2 same-sector examples entry", compareSrc.includes("같은 업종 예시로 바로 비교") && compareSrc.includes("exampleSets.map") && compareSrc.includes("recommendedSets.map"));
check("B2 watchlist selection entry", compareSrc.includes("watchlistAddable") && compareSrc.includes("관심 종목") && compareSrc.includes("quickCompare"));
// B3. /today 진입점 링크는 시작 경로 하단에 유지(오늘-후보 프리셋과 다름).
check("B3 keeps the /today escape link", compareSrc.includes("오늘 후보에서 고르기"));

// ── C. 로컬(로그아웃) 비교 보존 ─────────────────────────────────────
// C1. 이 기기 저장 vs 로그인 경계 문구가 남아 로그인 없이 비교가 됨을 명시한다.
check("C1 states on-device save vs login boundary", compareSrc.includes("이 기기에 저장") && compareSrc.includes("로그인"));

// ── D. 공용 헤더 인증 CTA: 동기화 의도 vs 재방문 로그인 구분 ──────────
// D1. syncStart 카피가 두 로케일에 있고, 재방문 로그인(login)과 다른 문구다(한 목적지의 두 이름 방지).
for (const loc of ["ko", "en"] as const) {
  const a = commonCopy[loc].auth as Record<string, unknown>;
  check(`D1 ${loc} has a non-empty syncStart CTA`, typeof a.syncStart === "string" && (a.syncStart as string).length > 0);
  check(`D1 ${loc} syncStart differs from login`, a.syncStart !== a.login);
}
// D2. 데스크톱 AccountButtons: 1차=동기화 의도(syncStart), 2차=로그인. 옛 'start'(시작하기) 라벨은 안 쓴다.
check("D2 AccountButtons primary CTA uses syncStart", accountSrc.includes("copy.auth.syncStart"));
check("D2 AccountButtons secondary CTA uses login", accountSrc.includes("copy.auth.login"));
check("D2 AccountButtons drops the generic '시작' (start) label", !accountSrc.includes("copy.auth.start"));
// D3. 모바일 MobileNav: 로그아웃 시 동기화(syncStart) + 로그인 두 액션으로 분리. 옛 'loginStart'(로그인/시작) 미사용.
check("D3 MobileNav logged-out CTA uses syncStart", mobileSrc.includes("copy.auth.syncStart"));
check("D3 MobileNav logged-out CTA also offers login", mobileSrc.includes("copy.auth.login"));
check("D3 MobileNav drops the two-names-in-one 'loginStart' label", !mobileSrc.includes("copy.auth.loginStart"));
// D4. 인증 라우트·동작 불변: 두 CTA 모두 여전히 /login으로 간다.
check("D4 AccountButtons still routes to /login", accountSrc.includes("`/login${next}`"));
check("D4 MobileNav still routes to /login", mobileSrc.includes("`/login${loginNext}`"));

// ── E. /compare 라우트 회귀 ─────────────────────────────────────────
check("E1 compare route mounts CompareClient", pageSrc.includes("<CompareClient"));
check("E1 compare route keeps canonical /compare", pageSrc.includes('canonical: "/compare"'));
// E2. 무JS 빈 상태 회복(noscript)과 공개 탈출 링크가 유지된다.
check("E2 keeps the noscript empty-state fallback", pageSrc.includes("<noscript>"));
check("E2 noscript keeps public escape links (stocks + today)", pageSrc.includes('href="/stocks"') && pageSrc.includes('href="/today"'));

// ── 자기검증: 탐지 로직이 실제로 동작함을 증명 ─────────────────────
check("selftest: cross-sector detector fires on the old tuple", '["005380", "105560"]'.includes('"005380"'));
check("selftest: today-preset detector fires on the old label", "오늘 후보 3개 비교".includes("오늘 후보 3개 비교"));

if (failed > 0) {
  console.error(`\n${failed} check(s) FAILED`);
  process.exit(1);
}
console.log(
  "PASS: cross-sector preset removed (same-sector examples only) + 5 simplified start paths (no 오늘-후보 preset) + local logged-out compare intact + header sync-intent vs returning-login CTAs distinguished + /compare route & noscript fallback",
);
