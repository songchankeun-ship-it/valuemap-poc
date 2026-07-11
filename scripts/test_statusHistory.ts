// statusHistory.ts 단위 assertion — 이력 로그 스캐폴드의 검증·병합·상한 로직 회귀 가드.
// 실행: npx tsx scripts/test_statusHistory.ts (실패 시 비정상 종료, 성공 시 PASS 1줄).
//
// 이 로그는 append-only이고 표시부가 직접 읽으므로, 검증(형식 오류 버림)·병합(같은 기준일 교체)·
// 상한(cap)·정렬(최신 먼저)이 조용히 틀어지면 사용자가 보는 이력이 오염된다. 그 경계를 고정한다.
import {
  coerceEntry,
  parseStatusHistory,
  mergeSnapshot,
  buildStatusSnapshotRecord,
  readStatusHistory,
  MAX_HISTORY_ENTRIES,
  type StatusHistoryEntry,
} from "../src/lib/statusHistory";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}

function entry(gen: string, asOf: string, extra: Partial<StatusHistoryEntry> = {}): StatusHistoryEntry {
  const e = coerceEntry({ generatedAt: gen, asOfBusinessDate: asOf, ...extra });
  if (!e) throw new Error(`fixture invalid: ${gen} ${asOf}`);
  return e;
}

// A. coerceEntry — 필수 필드/형식 검증.
{
  check("missing generatedAt → null", coerceEntry({ asOfBusinessDate: "20260710" }) === null);
  check("missing asOf → null", coerceEntry({ generatedAt: "2026-07-10T09:00:00Z" }) === null);
  check("bad asOf format → null", coerceEntry({ generatedAt: "x", asOfBusinessDate: "2026-07-10" }) === null);
  check("non-object → null", coerceEntry("nope") === null && coerceEntry(null) === null);
  const ok = coerceEntry({
    generatedAt: "2026-07-10T09:41:59Z",
    asOfBusinessDate: "20260709",
    metricsVersion: "2.4",
    universeCount: 138,
    suspectCount: 3,
  });
  check("valid entry coerced", ok !== null && ok.metricsVersion === "2.4" && ok.universeCount === 138);
  // 미기록 진단 수치 → null(지어내지 않음).
  check("missing diagnostics → null", ok !== null && ok.missingFinancialsCount === null && ok.priceLagCount === null);
  // 음수/NaN 카운트 → null.
  const bad = coerceEntry({ generatedAt: "g", asOfBusinessDate: "20260709", suspectCount: -1, universeCount: NaN });
  check("negative/NaN count → null", bad !== null && bad.suspectCount === null && bad.universeCount === null);
}

// B. parseStatusHistory — 형식 오류 버림 + 정렬 + 상한.
{
  check("invalid json → []", parseStatusHistory("{not json").length === 0);
  check("non-array/non-entries object → []", parseStatusHistory('{"foo":1}').length === 0);
  const mixed = JSON.stringify([
    { generatedAt: "2026-07-08T09:00:00Z", asOfBusinessDate: "20260707" },
    { bogus: true },
    { generatedAt: "2026-07-10T09:00:00Z", asOfBusinessDate: "20260709" },
    "garbage",
  ]);
  const parsed = parseStatusHistory(mixed);
  check("mixed array drops invalid (2 valid)", parsed.length === 2);
  check("sorted newest first", parsed[0].asOfBusinessDate === "20260709");
  // { entries: [...] } 래핑도 허용.
  const wrapped = parseStatusHistory('{"entries":[{"generatedAt":"2026-07-01T00:00:00Z","asOfBusinessDate":"20260630"}]}');
  check("entries-wrapped accepted", wrapped.length === 1);
}

// C. mergeSnapshot — append-only + 같은 기준일 교체 + 상한.
{
  const base = [entry("2026-07-08T09:00:00Z", "20260707"), entry("2026-07-09T09:00:00Z", "20260708")];
  // 새 기준일 append.
  const added = mergeSnapshot(base, entry("2026-07-10T09:00:00Z", "20260709"));
  check("new date appended", added.length === 3 && added[0].asOfBusinessDate === "20260709");
  // 같은 기준일 + 더 새로운 generatedAt → 교체(개수 그대로).
  const replaced = mergeSnapshot(base, entry("2026-07-09T19:00:00Z", "20260708", { suspectCount: 5 }));
  check("same date newer replaces (no growth)", replaced.length === 2);
  const target = replaced.find((e) => e.asOfBusinessDate === "20260708");
  check("replacement kept newer value", target?.suspectCount === 5 && target?.generatedAt === "2026-07-09T19:00:00Z");
  // 같은 기준일 + 더 오래된 generatedAt → 무시(기존 유지).
  const older = mergeSnapshot(base, entry("2026-07-09T01:00:00Z", "20260708", { suspectCount: 99 }));
  check("same date older ignored", older.length === 2 && older.find((e) => e.asOfBusinessDate === "20260708")?.suspectCount !== 99);
  // 상한: cap 초과 시 오래된 항목 잘림.
  let acc: StatusHistoryEntry[] = [];
  for (let i = 0; i < MAX_HISTORY_ENTRIES + 5; i++) {
    const d = String(20260101 + i); // 형식만 YYYYMMDD 유효하면 됨(정렬은 문자열 비교)
    acc = mergeSnapshot(acc, entry(`2026-07-10T${String(i % 24).padStart(2, "0")}:00:00Z`, d), MAX_HISTORY_ENTRIES);
  }
  check("cap enforced", acc.length === MAX_HISTORY_ENTRIES);
}

// D. buildStatusSnapshotRecord — 라이브 값 주입 → 레코드. 필수 없으면 null.
{
  check("build without required → null", buildStatusSnapshotRecord({ metricsVersion: "2.4" }) === null);
  const rec = buildStatusSnapshotRecord({
    generatedAt: "2026-07-10T09:41:59Z",
    asOfBusinessDate: "20260709",
    metricsVersion: "2.4",
    universeCount: 138,
    suspectCount: 3,
    missingFinancialsCount: 0,
    priceLagCount: 1,
  });
  check("build valid record", rec !== null && rec.priceLagCount === 1 && rec.suspectCount === 3);
  // 진단 미주입 → null(미기록), 필수만으로도 레코드 생성.
  const minimal = buildStatusSnapshotRecord({ generatedAt: "2026-07-10T00:00:00Z", asOfBusinessDate: "20260709" });
  check("minimal record, diagnostics null", minimal !== null && minimal.suspectCount === null);
}

// E. readStatusHistory — 없는 경로 → 빈 배열(graceful, 폴백 패턴).
{
  check("absent file → []", readStatusHistory("./__no_such_status_history__.json").length === 0);
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("PASS: statusHistory (coerce/parse/merge/build/read)");
