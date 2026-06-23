// signalDetailsShared.ts 단위 assertion — toEok / matchRow / joinClause.
// 실행: npx tsx scripts/test_signal_details.ts (실패 시 비정상 종료, 성공 시 PASS 1줄).
// 공시 enrich 5종이 공유하는 순수 헬퍼의 경계 동작을 고정한다(동작 회귀 가드).
import { toEok, matchRow, joinClause } from "../src/lib/signalDetailsShared";

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

// --- toEok: 원 → 억원 반올림 ---
eq("toEok 0", toEok(0), 0);
eq("toEok 1억 정확", toEok(1e8), 1);
eq("toEok 반올림 내림(1.4억→1)", toEok(1.4e8), 1);
eq("toEok 반올림 경계(1.5억→2)", toEok(1.5e8), 2);
eq("toEok 반올림 올림(1.6억→2)", toEok(1.6e8), 2);
eq("toEok 1억 미만 내림(0.4억→0)", toEok(4e7), 0);
eq("toEok 1억 미만 올림(0.5억→1)", toEok(5e7), 1);
eq("toEok 대형(1234.6억→1235)", toEok(12346e7), 1235);
eq("toEok 음수(손실 정정, -1.5억→-1)", toEok(-1.5e8), -1); // Math.round(-1.5)=-1 (toward +∞)

// --- matchRow: rcept_no 일치 → 폴백 rows[0] → 빈 배열 undefined ---
type Row = { rcept_no?: string; tag: string };
const rows: Row[] = [
  { rcept_no: "A", tag: "first" },
  { rcept_no: "B", tag: "second" },
];
eq("matchRow 정확 일치", matchRow(rows, "B"), { rcept_no: "B", tag: "second" });
eq("matchRow 첫 행 일치", matchRow(rows, "A"), { rcept_no: "A", tag: "first" });
eq("matchRow 미일치 → rows[0] 폴백", matchRow(rows, "ZZZ"), { rcept_no: "A", tag: "first" });
eq("matchRow undefined rceptNo → rows[0] 폴백", matchRow(rows, undefined), { rcept_no: "A", tag: "first" });
check("matchRow 빈 배열 → undefined", matchRow([] as Row[], "A") === undefined);

// --- joinClause: 선두 구분자 + ` · ` join, 비면 빈 문자열 ---
eq("joinClause 빈 배열 → 빈 문자열", joinClause([]), "");
eq("joinClause 단일", joinClause(["X"]), " · X");
eq("joinClause 다중", joinClause(["X", "Y"]), " · X · Y");
eq("joinClause 3개", joinClause(["X", "Y", "Z"]), " · X · Y · Z");
// 형제 빌더와 바이트 동일성: 인라인 패턴과 결과가 같아야 한다.
const parts = ["취득예정 1,000주", "취득금액 5억원"];
eq("joinClause 인라인 패턴 동일", joinClause(parts), ` · ${parts.join(" · ")}`);

if (failed > 0) {
  console.error(`\n${failed} assertion(s) FAILED`);
  process.exit(1);
}
console.log("PASS: signalDetailsShared 단위 assertion 전부 통과 (toEok/matchRow/joinClause)");
