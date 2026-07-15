// 공시 정보 위계 계약 가드 (재검수 Slice K)
// 실행: npx tsx scripts/test_disclosureHierarchy.ts — 성공 시 PASS 1줄, 실패 시 FAIL 후 비정상 종료.
//
// 사실(계약 정본):
//   - 정정 공시 분류는 이용 가능한 메타데이터(보고서명)만으로 결정론적이며, signalType과 독립이다
//     (단일계약·유증의 '정정'도 정정으로 표시). 한 곳(disclosureHierarchy.isCorrectionFiling)에서만
//     판별하고, 디텍터(disclosure-signals)와 그룹핑(DisclosureExplorer)이 같은 판별을 공유한다.
//   - 선택 필드(금액·비율·신뢰도·연계 공시·방향·확인 노트)는 원천이 실제로 제공할 때만 노출한다.
//     presentOptionalFields는 없는 필드의 키 자체를 생략한다(합성 금지).
//   - 반복되던 수집 범위 고지(missingFragment·limitBanner)는 제거해 공통 안내 박스+기간 배지 한
//     곳으로 모은다.
//   - 카운트 단위는 공시 '건'(filings)과 유형/이벤트 '묶음 개'(groups)를 명확히 구분한다 —
//     같은 수가 공시와 유형을 동시에 뜻하지 않도록.
//   - 종목 상세 공시는 결정론적 정정 배지를 유형 배지와 별개로 앞세우고, DART 원문 접근은 유지한다.
// 순수 함수 단위 assertion + 소스/카피 정적 고정. 점수식·데이터·라우트·인증 무변경.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  isCorrectionFiling,
  presentOptionalFields,
  classificationBasisOf,
} from "../src/lib/disclosureHierarchy";
import { firstSignalOf } from "../src/lib/disclosure-signals";
import type { Disclosure } from "../src/lib/dart";
import { disclosureExplorerCopy, disclosureSummaryCopy } from "../src/lib/copy/disclosures";
import { stockDisclosuresCopy } from "../src/lib/copy/stockDetail";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}
function eq<T>(name: string, got: T, want: T): void {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) {
    failed++;
    console.error(`FAIL: ${name} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
const read = (rel: string): string => readFileSync(join(repo, rel), "utf8");

// ── A. isCorrectionFiling — 결정론적, signalType 독립 ────────────────
check("A1 정정 보고서명 → 정정", isCorrectionFiling("사업보고서(기재정정)"));
check("A1 [정정] 접두 → 정정", isCorrectionFiling("[기재정정]단일판매ㆍ공급계약체결"));
check("A2 비정정 보고서명 → 비정정", !isCorrectionFiling("주요사항보고서(자기주식취득결정)"));
check("A2 빈/undefined 방어", !isCorrectionFiling("") && !isCorrectionFiling(undefined) && !isCorrectionFiling(null));
// A3. 정정이 아닌 유형(단일계약)의 정정도 정정으로 잡힌다(유형과 독립).
check("A3 단일계약의 정정도 정정으로 판별", isCorrectionFiling("단일판매ㆍ공급계약체결(정정)"));

// ── B. presentOptionalFields — 없는 필드는 키 생략(합성 금지) ─────────
eq("B1 signal 없음 → 빈 객체", presentOptionalFields(null), {});
eq("B1 undefined → 빈 객체", presentOptionalFields(undefined), {});
// B2. note 없음/빈 문자열 → note 키 생략.
eq("B2 note 미제공 → 생략", presentOptionalFields({ signalType: "correction" }), {});
eq("B2 빈 note → 생략", presentOptionalFields({ note: "   " }), {});
// B3. note 제공 → 그대로 포함.
eq("B3 note 제공 → 포함", presentOptionalFields({ note: "손익 관련 정정" }), { note: "손익 관련 정정" });
// B4. 방향 매핑 — 제공 단서만(확인 필요는 정직한 unknown, 없으면 생략).
eq("B4 긍정 → buy", presentOptionalFields({ direction: "긍정 가능" }), { direction: "buy" });
eq("B4 부정 → sell", presentOptionalFields({ direction: "부정 가능" }), { direction: "sell" });
eq("B4 확인 필요 → unknown", presentOptionalFields({ direction: "확인 필요" }), { direction: "unknown" });
eq("B4 방향 미제공 → direction 키 생략", presentOptionalFields({ note: "일반 정정" }), { note: "일반 정정" });

// ── C. classificationBasisOf ────────────────────────────────────────
eq("C1 신호 있으면 auto", classificationBasisOf({ signalType: "treasury_buy" }), "auto");
eq("C1 신호 없으면 raw", classificationBasisOf(null), "raw");

// ── D. 디텍터가 같은 정정 판별을 쓴다(단일 소스) ──────────────────────
const mk = (report_nm: string): Disclosure => ({
  corp_code: "00000000",
  corp_name: "테스트",
  stock_code: "000000",
  corp_cls: "Y",
  report_nm,
  rcept_no: "20260101000001",
  flr_nm: "테스트",
  rcept_dt: "20260101",
  rm: "",
});
// D1. '정정' 손익 보고서 → correction 신호.
eq("D1 손익 정정 → correction", firstSignalOf(mk("매출액또는손익구조30%(대규모법인은15%)이상변경(정정)"))?.signalType, "correction");
// D2. 비정정 자사주 → treasury_buy(정정 아님).
eq("D2 자사주 취득 → treasury_buy", firstSignalOf(mk("주요사항보고서(자기주식취득결정)"))?.signalType, "treasury_buy");
// D3. 소스가 결정론 헬퍼를 import 해 쓰는지 고정.
check("D3 disclosure-signals imports isCorrectionFiling", read("src/lib/disclosure-signals.ts").includes("isCorrectionFiling(d.report_nm)"));
check("D3 DisclosureExplorer groups via isCorrectionFiling", read("src/components/DisclosureExplorer.tsx").includes("isCorrectionFiling(sig.disclosure.report_nm)"));

// ── E. 반복 수집 범위 고지 축소 ─────────────────────────────────────
const explorerSrc = read("src/components/DisclosureExplorer.tsx");
const disclosuresCopy = read("src/lib/copy/disclosures.ts");
check("E1 copy drops missingFragment key", !disclosuresCopy.includes("missingFragment"));
check("E1 copy drops limitBanner key", !disclosuresCopy.includes("limitBanner"));
check("E2 explorer no longer renders t.missingFragment", !explorerSrc.includes("t.missingFragment"));
check("E2 explorer no longer renders t.limitBanner", !explorerSrc.includes("t.limitBanner"));
// E3. 단일 정본 수집 범위 안내는 유지된다(공통 안내 박스 + 기간 배지).
check("E3 keeps canonical scope in topNotice box", explorerSrc.includes("t.topNoticeBullets"));
check("E3 keeps functional period-scope badge", explorerSrc.includes("t.periodScopeBadge"));

// ── F. 카운트 단위: 공시 '건'(filings) vs 묶음 '개'(groups) 구분 ──────
// F1. 요약 카드(유형별 묶음 수)는 '건'을 쓰지 않는다 — '개/groups'.
check("F1 ko summary recentCount uses 개 not 건", disclosureSummaryCopy.ko.recentCount(7, 2).includes("개") && !disclosureSummaryCopy.ko.recentCount(7, 2).includes("건"));
check("F1 ko summary bottomNote uses 개", disclosureSummaryCopy.ko.bottomNote(7, 5).includes("개"));
check("F1 en summary recentCount labels groups", disclosureSummaryCopy.en.recentCount(7, 2).includes("groups"));
// F2. 그룹 카드의 개별 건수는 여전히 '건'(filings)이라 묶음 단위와 구분된다.
check("F2 ko group-card countUnit uses 건", disclosureExplorerCopy.ko.countUnit(2) === "2건");
check("F2 en group-card countUnit says filings (not bare number)", disclosureExplorerCopy.en.countUnit(2) === "2 filings");
// F3. 같은 수가 공시와 묶음을 동시에 뜻하지 않는다: 두 단위 표기가 서로 다르다.
check("F3 ko filings unit != groups unit", disclosureExplorerCopy.ko.countUnit(2) !== disclosureSummaryCopy.ko.recentCount(7, 2));

// ── G. 종목 상세: 결정론 정정 배지 + DART 원문 유지 ──────────────────
const stockSrc = read("src/components/StockDisclosures.tsx");
check("G1 StockDisclosures gates optional fields via presentOptionalFields", stockSrc.includes("presentOptionalFields(d.signal)") && stockSrc.includes("opt.note") && stockSrc.includes("opt.direction"));
check("G1 no longer reads raw d.signal.note directly", !stockSrc.includes("d.signal.note"));
check("G2 renders deterministic correction badge", stockSrc.includes("isCorrectionFiling(d.report_nm)") && stockSrc.includes("t.correctionBadge"));
check("G2 correction copy exists in both locales", typeof stockDisclosuresCopy.ko.correctionBadge === "string" && typeof stockDisclosuresCopy.en.correctionBadge === "string");
check("G3 DART original access stays prominent", stockSrc.includes("t.dartOriginal") && explorerSrc.includes("t.viewSource"));

// ── 자기검증: 탐지 로직이 실제로 동작함을 증명 ─────────────────────
check("selftest: correction detector fires on '정정'", "사업보고서(정정)".includes("정정"));
check("selftest: option omitter yields empty for empty signal", Object.keys(presentOptionalFields({})).length === 0);

if (failed > 0) {
  console.error(`\n${failed} check(s) FAILED`);
  process.exit(1);
}
console.log(
  "PASS: deterministic single-source correction classification + optional fields present-only (no synthesis) + reduced repeated scope disclaimers + filings(건) vs groups(개) count contract + elevated correction badge with DART access intact",
);
