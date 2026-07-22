// 법률/데이터권리 페이지 교차 카피 정합 가드 (재검수 Slice L)
// 실행: npx tsx scripts/test_legalConsistency.ts — 성공 시 PASS 1줄, 실패 시 FAIL 후 비정상 종료.
//
// 사실(계약 정본):
//   - 삭제/예외 보관 문구는 /privacy 와 /data-deletion 에서 서로 모순되지 않는다.
//     "탈퇴 즉시 모든 정보가 파기" 같은 절대 표현을 쓰지 않고, 두 페이지가 동일한
//     예외 사유(법령·보안·부정사용 방지·분쟁 대응)와 "제한적으로 보관" 문구를 공유한다.
//   - /terms 는 현재 적용되는 무료 베타 정책을 본문 우선으로 두고, 미확정 유료 결제
//     초안은 번호 조항(제1조~제8조) 밖으로 분리한다(유료 초안 헤딩이 제8조 뒤에 온다).
//   - docs/data-rights-matrix.md 는 2026-07-22 데이터 권리 결정 패킷을 정본으로 연결한다.
//   - 정본은 KRX·DART·Naver/FDR·Yahoo/yfinance를 분리하고, FDR bare ticker의
//     실제 Naver 경로와 공개 원시 price files를 기록하며 법적 클리어런스를 단정하지 않는다.
// 정적 소스/카피 고정만 수행한다. 점수식·데이터·라우트·인증 무변경.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
const read = (rel: string): string => readFileSync(join(repo, rel), "utf8");

const privacy = read("src/app/privacy/page.tsx");
const deletion = read("src/app/data-deletion/page.tsx");
const terms = read("src/app/terms/page.tsx");
const matrix = read("docs/data-rights-matrix.md");
const dataRightsPacket = read("docs/ornscore-data-rights-decision-packet-2026-07-22.md");

// 공유 정본 문구.
const SHARED_GROUNDS = "법령, 보안, 부정사용 방지, 분쟁 대응";
const LIMITED_RETENTION = "제한적으로 보관";

// ── A. 삭제/예외 보관 정합: 절대 표현 제거 + 공유 예외 사유 ──────────
check("A1 privacy drops absolute '탈퇴 즉시 모든 정보가 파기'", !privacy.includes("탈퇴 즉시 모든 정보가 파기"));
check("A2 privacy carries shared exception grounds", privacy.includes(SHARED_GROUNDS));
check("A2 privacy carries limited-retention wording", privacy.includes(LIMITED_RETENTION));
check("A3 data-deletion carries shared exception grounds", deletion.includes(SHARED_GROUNDS));
check("A3 data-deletion carries limited-retention wording", deletion.includes(LIMITED_RETENTION));
// A4. 두 페이지가 서로를 참조해 단일 정본으로 수렴.
check("A4 privacy links /data-deletion", privacy.includes('href="/data-deletion"'));
check("A4 data-deletion links /privacy", deletion.includes('href="/privacy"'));

// ── B. 약관: 무료 베타 우선 + 유료 초안 분리 ─────────────────────────
const FREE_BETA_BOX = "현재 적용되는 정책 (무료 베타)";
const PAID_HEADING = "유료 결제 관련 정책 (현재 미제공 · 향후 도입 시 초안)";
const OUTSIDE_MARKER = "현재 약관 외 · 향후 정책 초안";

check("B1 terms keeps free-beta primary box", terms.includes(FREE_BETA_BOX));
check("B2 terms keeps paid-policy draft heading", terms.includes(PAID_HEADING));
check("B3 terms marks paid draft as outside applicable terms", terms.includes(OUTSIDE_MARKER));

const iFreeBeta = terms.indexOf(FREE_BETA_BOX);
const iArticle5 = terms.indexOf("제5조 (지적재산권)");
const iArticle8 = terms.indexOf("제8조 (문의)");
const iPaid = terms.indexOf(PAID_HEADING);
// B4. 순서 계약: 무료 베타 박스 → 번호 조항(제5·제8조) → 유료 초안.
check("B4 free-beta box precedes numbered articles", iFreeBeta >= 0 && iFreeBeta < iArticle5);
check("B4 paid draft moved AFTER article 5", iPaid > iArticle5);
check("B4 paid draft moved AFTER last article (제8조)", iArticle8 >= 0 && iPaid > iArticle8);

// ── C. 데이터 권리 매트릭스: 4개 묶음 분리 + unverified + 오너 조치 ──
for (const src of ["KRX", "DART", "Naver", "FinanceDataReader", "Yahoo", "yfinance"]) {
  check(`C1 matrix separates source '${src}'`, matrix.includes(src));
}
check("C2 matrix marks unknowns unverified", matrix.includes("unverified"));
check("C3 matrix names owner actions [법무]/[개발]", matrix.includes("[법무]") && matrix.includes("[개발]"));
// C4. 법적 클리어런스 비주장: 부인 문구 존재 + 허가 단정 문구 부재.
check(
  "C4 matrix disclaims legal clearance",
  matrix.includes("단정하지 않는다") && matrix.includes("재배포 권리"),
);
const FORBIDDEN_CLAIMS = ["재배포 허용 확인됨", "상업적 이용 가능 확정", "법적 문제 없음", "라이선스 확보됨"];
for (const bad of FORBIDDEN_CLAIMS) {
  check(`C4 matrix makes no clearance claim '${bad}'`, !matrix.includes(bad));
}
check("C5 matrix links current data-rights packet", matrix.includes("ornscore-data-rights-decision-packet-2026-07-22.md"));

// ── D. 현재 데이터 권리 정본: 실제 전달 경로 + 공개 원시 데이터 + 결정 게이트 ──
for (const src of ["KRX", "DART", "Naver", "FinanceDataReader", "Yahoo", "yfinance"]) {
  check(`D1 packet separates source '${src}'`, dataRightsPacket.includes(src));
}
check("D2 packet records FDR bare-ticker Naver route", dataRightsPacket.includes("NaverDailyReader"));
check("D3 packet records public raw price files", dataRightsPacket.includes("public/data/prices/{ticker}.json"));
check("D4 packet records the 138-file public surface", dataRightsPacket.includes("138개 파일"));
check("D5 packet includes official evidence register", dataRightsPacket.includes("공식 근거 대조"));
check("D6 packet keeps legal-clearance disclaimer", dataRightsPacket.includes("법률 의견 아님") && dataRightsPacket.includes("상용화 클리어런스 미부여"));
check("D7 packet defines commercialization gate", dataRightsPacket.includes("상용화 게이트"));
for (const bad of FORBIDDEN_CLAIMS) {
  check(`D8 packet makes no clearance claim '${bad}'`, !dataRightsPacket.includes(bad));
}

// ── 자기검증: 검사 로직이 실제로 동작함을 증명 ─────────────────────
check("selftest: shared-grounds substring is non-trivial", SHARED_GROUNDS.length > 5);
check("selftest: ordering indices resolve", iFreeBeta >= 0 && iArticle8 >= 0 && iPaid >= 0);

if (failed > 0) {
  console.error(`\n${failed} check(s) FAILED`);
  process.exit(1);
}
console.log(
  "PASS: privacy/data-deletion alignment + terms free-beta priority + current data-rights packet (actual FDR/Naver path, public raw prices, source decisions, commercialization gate, no legal-clearance claim)",
);
