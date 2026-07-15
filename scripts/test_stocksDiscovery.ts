// 종목 발견 밀도·용어 계약 가드 (Slice I)
// 실행: npx tsx scripts/test_stocksDiscovery.ts — 성공 시 PASS 1줄, 실패 시 FAIL 출력 후 비정상 종료.
//
// 사실(계약 정본):
//   - PER≤200·PBR≤30 기본 필터는 '품질'을 재는 것이 아니라 극단값을 제외한다.
//     사용자 카피는 '기본 품질 필터'가 아니라 '극단값 제외'로 읽혀야 한다(ko/en).
//   - /stocks 첫 렌더는 결과를 20개로 제한하고, 필터·정렬을 유지한 채 유한한 '더 보기'로 잇는다.
//   - 검색창과 결과 수는 선택형 프리셋(질문형·빠른 프리셋)보다 위에 있다.
//   - 화면 상단 안내는 검색엔진식 키워드 나열이 아니라 사용자 질문이어야 한다.
//   - 모바일 상세 필터 바텀시트와 0건 결과 회복 동선은 유지된다.
// 이 테스트는 소스 텍스트 + i18n 카피를 정적으로 고정한다. 점수식·데이터·라우트 무변경.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { stocksCopy } from "../src/lib/copy/stocks";

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

const src = read("src/components/StocksExplorer.tsx");

// ── A. 극단값 제외 용어(오해 소지 '기본 품질 필터' 제거) ──────────────
// 사용자 노출 카피(문자열 + 함수 결과)를 실제로 만들어 금지어/필수어를 스캔한다.
const ko = stocksCopy.ko;
const en = stocksCopy.en;
const koQuality: string[] = [
  ko.qualityRowOn,
  ko.qualityRowOff,
  ko.qualityHeadline(10, 138).a,
  ko.themeQualityEmptyTitle("2차전지"),
  ko.themeQualityEmptyHint(3, 5),
  ko.themeQualityMore(2),
  ko.describeAll(120, 138),
  ko.backToDefaultToggle,
];
const enQuality: string[] = [
  en.qualityRowOn,
  en.qualityRowOff,
  en.qualityHeadline(10, 138).a,
  en.themeQualityEmptyTitle("Battery"),
  en.themeQualityEmptyHint(3, 5),
  en.themeQualityMore(2),
  en.describeAll(120, 138),
];
// A1. 오해 소지 라벨 '기본 품질 (필터)' / 'default quality filter'가 남지 않는다.
for (const s of koQuality) check(`A1 ko copy drops '기본 품질' ("${s}")`, !s.includes("기본 품질"));
for (const s of enQuality) check(`A1 en copy drops 'quality filter' ("${s}")`, !/quality filter/i.test(s));
// A2. 극단값 제외 개념이 실제로 노출된다(핵심 라벨 행).
check("A2 ko qualityRowOn names extreme-value exclusion", ko.qualityRowOn.includes("극단값 제외"));
check("A2 ko qualityRowOff names extreme-value exclusion", ko.qualityRowOff.includes("극단값 제외"));
check("A2 en qualityRowOn names extreme-value exclusion", /extreme-value exclusion/i.test(en.qualityRowOn));
check("A2 en qualityRowOff names extreme-value exclusion", /extreme-value exclusion/i.test(en.qualityRowOff));
// A3. 컴포넌트 소스 자체에도 옛 라벨 문구가 남지 않는다(주석 포함).
check("A3 component source drops '기본 품질' label", !src.includes("기본 품질"));

// ── B. 첫 표시 20개 + 유한 '더 보기' ───────────────────────────────
// B1. 첫 표시 상한이 20으로 명시된다.
check("B1 declares INITIAL_VISIBLE = 20", /const INITIAL_VISIBLE = 20\b/.test(src));
check("B1 declares a finite load step", /const LOAD_MORE_STEP = \d+/.test(src));
// B2. 결과(카드/표)는 고정 100이 아니라 visibleCount로 잘라 그린다.
check("B2 slices results by visibleCount", src.includes("slice(0, visibleCount)"));
check("B2 no fixed top-100 result cap remains", !src.includes("slice(0, 100)"));
// B3. 첫 렌더가 항상 20으로 제한되도록 정렬 변화 시 리셋한다.
check("B3 resets visible window on filter/sort change", src.includes("setVisibleCount(INITIAL_VISIBLE)") && /\}, \[sorted\]\);/.test(src));
// B4. 유한 '더 보기'는 남은 결과를 넘지 않게 증가(무한 스크롤 아님).
check("B4 show-more increments up to the matched total", src.includes("Math.min(sorted.length, v + LOAD_MORE_STEP)"));
check("B4 show-more uses the finite showMore label", src.includes("t.showMore(sorted.length - visibleCount)"));
// B5. showMore/showingCount 카피가 두 로케일 모두 존재한다(topCapNote는 제거).
for (const loc of ["ko", "en"] as const) {
  const c = stocksCopy[loc] as Record<string, unknown>;
  check(`B5 ${loc} has showMore()`, typeof c.showMore === "function");
  check(`B5 ${loc} has showingCount()`, typeof c.showingCount === "function");
  check(`B5 ${loc} drops obsolete topCapNote`, !("topCapNote" in c));
}

// ── C. 접근성: 계속 보기 액션 + 표시량 안내 ────────────────────────
// C1. '더 보기'는 실제 버튼이며 결과 영역을 aria-controls로 가리킨다.
check("C1 show-more is a real button controlling the results region", src.includes('aria-controls="stock-results"'));
// C2. 현재 표시량을 라이브 상태(status)로 스크린리더에 알린다.
check("C2 shown-count is announced via role=status/aria-live", src.includes('role="status"') && src.includes('aria-live="polite"') && src.includes("t.showingCount("));

// ── D. 검색·결과 수가 선택형 프리셋보다 위 ─────────────────────────
const iHeaderCount = src.indexOf("t.qualityHeadline(sorted.length, total)"); // 헤더 결과 수(검색창 위)
const iSearch = src.indexOf("t.searchPlaceholder");
const iQuestionPresets = src.indexOf("t.questionHeading");
const iQuickPresets = src.indexOf("t.quickPresetsLabel");
check("D0 anchors located", iHeaderCount >= 0 && iSearch >= 0 && iQuestionPresets >= 0 && iQuickPresets >= 0);
check("D1 result count sits above the search input", iHeaderCount < iSearch);
check("D2 search sits above the question presets", iSearch < iQuestionPresets);
check("D3 question presets sit above the quick presets", iQuestionPresets < iQuickPresets);

// ── E. 상단 안내 = 사용자 질문(검색엔진식 키워드 나열 제거) ──────────
check("E1 ko intro is a user question", ko.searchIntent.title.includes("?") || ko.searchIntent.title.includes("까요"));
check("E1 en intro is a user question", en.searchIntent.title.includes("?"));
// E2. 이전 키워드 스터핑 잔재가 없다.
check("E2 ko intro drops keyword stuffing", !ko.searchIntent.body.includes("스크리닝") && !ko.searchIntent.body.includes("PER/PBR/ROE 비교"));
check("E2 en intro drops keyword stuffing", !/screening/i.test(en.searchIntent.body) && !/PER\/PBR\/ROE comparison/i.test(en.searchIntent.body));

// ── F. 유지 계약: 모바일 필터 시트 + 0건 회복 동선 ─────────────────
// F1. 모바일 상세 필터 바텀시트(dialog)가 그대로 있다.
check("F1 keeps the mobile filter bottom sheet", src.includes('role="dialog"') && src.includes('aria-modal="true"') && src.includes('id="stocks-filter-sheet-title"') && src.includes("setDrawerOpen(true)"));
// F2. 0건 결과 회복(가장 강한 조건 완화 + 검색 실패 안내 + 초기화)이 유지된다.
check("F2 keeps zero-result recovery (relax + search hint + reset)", src.includes("strongestConstraint") && src.includes("t.relaxStrongest") && src.includes("t.emptySearchTitle") && src.includes("resetFilters"));

// ── 자기검증: 금지어 탐지가 실제로 동작함을 증명 ───────────────────
check("selftest: banned-label detector fires on the old wording", "기본 품질 필터: PER ≤ 200".includes("기본 품질"));
check("selftest: en banned-label detector fires on the old wording", /quality filter/i.test("Default quality filter: Off"));

if (failed > 0) {
  console.error(`\n${failed} check(s) FAILED`);
  process.exit(1);
}
console.log(
  "PASS: extreme-value exclusion label + 20-row first render + finite accessible show-more (aria-controls/status) + search/count above presets + user-question intro + mobile sheet & zero-result recovery intact",
);
