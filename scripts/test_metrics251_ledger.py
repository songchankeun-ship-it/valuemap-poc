#!/usr/bin/env python3
# Metrics 2.5.1 append-only 증거 원장 + 게이트 재생성 게이트 — Slice O.
#
# 강제하는 계약(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D02/D07/D10,
#   §7 Gate 4, §8, §9, §10 Slice O, 원안 ORN-2503/2508, 작업 지시):
#   ACC.   원장은 QA_PASSED + 무결성 통과 run 에서만 파생한다(미봉인/손상 run 제외).
#   FIELDS.각 항목이 marketDate·evidenceHashes·coverage·exclusions·differential·fourZeroGate 를 담는다.
#   APPEND.append-only — 기존 항목은 보존, 새 시장일만 연쇄로 덧붙인다. 재실행은 중복(멱등)으로 무시.
#   CONFLICT.같은 시장일 다른 내용 → 충돌 거절(기존 불변 항목 보존·원장 미변경).
#   DIFF.  차등 count(신규/제외/순위자격/종합점수)와 비교 capability 가 직전 승인 스냅샷에서 정확히 나온다.
#   PEND.  승인 run <5 → 게이트 PENDING(합성 없음). ==5+ 이면 게이트 판정은 Slice K 를 재사용.
#   GATE.  명령이 기존 롤아웃 게이트 JSON·Markdown 을 저장소에서 재생성한다.
#   CHAIN. prevHash 연쇄·entryHash 재계산·sequence 연속성이 위변조를 잡는다.
#   DET.   같은 저장소 → 바이트 동일 원장(결정적)·ledgerHash 안정.
#   PURE.  소스에 벽시계/난수/네트워크/public 경로 쓰기 흔적 없음.
#
# Usage:
#   $env:PYTHONUTF8='1'; python scripts/test_metrics251_ledger.py
import copy
import json
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import metrics251_ledger as L               # noqa: E402
import metrics251_run as run                # noqa: E402
import metrics251_snapshot_store as store    # noqa: E402
import metrics251_rollout_gate as rg         # noqa: E402
from metrics251_compare import FixtureTradingCalendar  # noqa: E402

CONFIG_PATH = os.path.join(ROOT, "config", "metrics", "2.5.1.json")
FIXTURE_DIR = os.path.join(HERE, "fixtures", "metrics251")
REQUEST_FIXTURE = os.path.join(FIXTURE_DIR, "preflight_request.json")
CALENDAR_FIXTURE = os.path.join(FIXTURE_DIR, "compare_calendar.json")

# 5개 연속 실제 거래일(2026-07-16 은 공휴일이므로 제외). 캘린더 fixture 와 일치.
FIVE_DAYS = ["2026-07-08", "2026-07-09", "2026-07-10", "2026-07-13", "2026-07-14"]

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


with open(CONFIG_PATH, encoding="utf-8-sig") as f:
    CFG = json.load(f)
with open(REQUEST_FIXTURE, encoding="utf-8") as f:
    BASE = json.load(f)
with open(CALENDAR_FIXTURE, encoding="utf-8") as f:
    CAL = FixtureTradingCalendar.from_fixture(json.load(f))


def build_request(root, *, market_date, stocks=None):
    """유효 기준 run 요청. sourceDates 는 marketDate 에 맞춰 고정(fundamentals 는 이전 영업일)."""
    stocks = copy.deepcopy(BASE["stocks"]) if stocks is None else stocks
    source_dates = {"prices": market_date, "volumes": market_date, "fundamentals": "2026-07-06"}
    return {
        "marketDate": market_date,
        "expected": run.derive_expected(CFG, market_date, source_dates, stocks),
        "config": CFG,
        "sourceDates": source_dates,
        "stocks": stocks,
        "shadowRoot": root,
        "outputLocation": os.path.join(root, store.RUNS_SUBDIR, f"{market_date}__r"),
    }


def publish_days(root, dates, *, stocks_by_date=None):
    """지정 거래일들에 대해 shadow run 을 승격한다(오케스트레이터 재사용). 게시 상태를 반환."""
    stocks_by_date = stocks_by_date or {}
    results = {}
    for d in dates:
        req = build_request(root, market_date=d, stocks=stocks_by_date.get(d))
        res = run.run_market_day(req, calendar=CAL)
        results[d] = res
    return results


def fresh_root():
    return tempfile.mkdtemp(prefix="m251ledger_")


def cleanup(d):
    store.rmtree_force(d)


# ===========================================================================
# ACC/FIELDS. 원장은 QA_PASSED run 에서만 파생하고 필수 필드를 모두 담는다.
# ===========================================================================
def test_entries_from_qa_passed_with_fields():
    root = fresh_root()
    try:
        pub = publish_days(root, FIVE_DAYS[:3])
        check(all(r.status == run.RUN_PUBLISHED for r in pub.values()),
              f"기준 게시 실패: {[ (d, r.status) for d, r in pub.items() ]}")
        ledger, summary = L.refresh_from_store(root, calendar=CAL, refresh_gate=False)
        check(summary["acceptedRuns"] == 3, f"승인 run 3 아님: {summary['acceptedRuns']}")
        check([e["marketDate"] for e in ledger["entries"]] == FIVE_DAYS[:3],
              f"항목 시장일 순서 이상: {[e['marketDate'] for e in ledger['entries']]}")
        e = ledger["entries"][0]
        for key in ("marketDate", "evidenceHashes", "coverage", "exclusions",
                    "differential", "fourZeroGate", "entryHash"):
            check(key in e, f"항목에 필수 필드 누락: {key}")
        eh = e["evidenceHashes"]
        for key in ("configHash", "inputManifestHash", "manifestHash", "snapshotSha256"):
            check(eh.get(key), f"evidenceHashes.{key} 결측")
        fz = e["fourZeroGate"]
        for key in ("unresolvedP0", "sourceDateMismatch", "unknownExclusionReason", "publicPathLeakage"):
            check(key in fz, f"fourZeroGate.{key} 누락")
        # 정상 run 은 소스일불일치/미지사유/누출 0. unresolvedP0 은 합성 금지 → null.
        check(fz["sourceDateMismatch"] == 0 and fz["unknownExclusionReason"] == 0
              and fz["publicPathLeakage"] == 0, f"정상 run 4-zero 위반: {fz}")
        check(fz["unresolvedP0"] is None, "저장소에 차등 없음인데 unresolvedP0 이 합성됨(null 아님)")
        check(e["coverage"]["universeSize"] == len(BASE["stocks"]),
              f"universeSize 이상: {e['coverage']['universeSize']}")
    finally:
        cleanup(root)


# ===========================================================================
# ACC. 미봉인/손상 run 은 승인하지 않는다(QA_PASSED 무결성만).
# ===========================================================================
def test_unsealed_run_excluded():
    root = fresh_root()
    try:
        publish_days(root, FIVE_DAYS[:2])
        # 승격된 한 run 의 manifest 를 손상시켜 무결성 실패로 만든다(읽기전용 → 쓰기 비트 복구).
        runs_dir = os.path.join(root, store.RUNS_SUBDIR)
        victim = sorted(os.listdir(runs_dir))[0]
        mpath = os.path.join(runs_dir, victim, store.ARTIFACT_MANIFEST)
        import stat as _stat
        os.chmod(mpath, _stat.S_IWRITE)
        with open(mpath, "w", encoding="utf-8") as f:
            f.write('{"runState":"QA_PASSED","artifacts":{},"manifestHash":"deadbeef"}\n')
        ledger, summary = L.refresh_from_store(root, calendar=CAL, refresh_gate=False)
        check(summary["acceptedRuns"] == 1, f"손상 run 이 승인됨: {summary['acceptedRuns']}")
        check(victim.split("__", 1)[0] not in [e["marketDate"] for e in ledger["entries"]],
              "손상 run 의 시장일이 원장에 들어감")
    finally:
        cleanup(root)


# ===========================================================================
# APPEND. append-only — 재실행은 중복(멱등)이고 기존 항목을 보존한다.
# ===========================================================================
def test_append_only_idempotent():
    root = fresh_root()
    try:
        publish_days(root, FIVE_DAYS[:3])
        ledger1, sum1 = L.refresh_from_store(root, calendar=CAL, refresh_gate=False)
        check(sum1["append"]["appended"] == FIVE_DAYS[:3], f"1차 append 이상: {sum1['append']}")
        first_bytes = L._ledger_bytes(L.read_ledger(root))

        # 재실행: 새 run 없음 → 전부 중복, 원장 바이트 불변(append-only 보존).
        ledger2, sum2 = L.refresh_from_store(root, calendar=CAL, refresh_gate=False)
        check(sum2["append"]["appended"] == [], f"재실행이 새로 append: {sum2['append']}")
        check(sorted(sum2["append"]["duplicates"]) == FIVE_DAYS[:3],
              f"재실행 중복 목록 이상: {sum2['append']['duplicates']}")
        check(L._ledger_bytes(L.read_ledger(root)) == first_bytes, "재실행이 원장 바이트를 바꿈(append-only 위반)")

        # 두 거래일 추가 게시 후 refresh → 기존 3개 보존 + 2개만 append.
        publish_days(root, FIVE_DAYS[3:])
        ledger3, sum3 = L.refresh_from_store(root, calendar=CAL, refresh_gate=False)
        check(sum3["append"]["appended"] == FIVE_DAYS[3:], f"증분 append 이상: {sum3['append']}")
        check([e["marketDate"] for e in ledger3["entries"]] == FIVE_DAYS,
              f"최종 원장 시장일 이상: {[e['marketDate'] for e in ledger3['entries']]}")
        # 기존 3개 항목이 바이트 그대로 보존됐는지(entryHash 동일).
        for i in range(3):
            check(ledger3["entries"][i]["entryHash"] == ledger1["entries"][i]["entryHash"],
                  f"기존 항목 {i} 이 재작성됨(append-only 위반)")
    finally:
        cleanup(root)


# ===========================================================================
# CONFLICT. 같은 시장일 다른 내용 → 충돌 거절, 기존 항목·원장 보존.
# ===========================================================================
def test_conflict_rejected():
    root = fresh_root()
    try:
        publish_days(root, [FIVE_DAYS[0]])
        ledger1, _ = L.refresh_from_store(root, calendar=CAL, refresh_gate=False)
        before = L._ledger_bytes(L.read_ledger(root))

        # 같은 시장일에 대해 내용이 다른 후보를 인위적으로 만들고 병합만 수행(저장소 불변 위반 시나리오 시뮬).
        runs = L.accepted_runs_from_store(root)
        candidates = L.build_candidates(runs)
        conflicting = copy.deepcopy(candidates)
        conflicting[0]["evidenceHashes"]["manifestHash"] = "0" * 64
        conflicting[0]["entryHash"] = L.entry_hash(conflicting[0])  # 내용 상이 → entryHash 달라짐
        merged, report = L.merge_append(ledger1, conflicting)
        check(len(report["conflicts"]) == 1 and report["conflicts"][0]["marketDate"] == FIVE_DAYS[0],
              f"충돌이 보고되지 않음: {report}")
        check(report["appended"] == [] and report["duplicates"] == [], f"충돌인데 append/중복 발생: {report}")
        check(len(merged["entries"]) == 1, "충돌이 두 번째 항목을 만듦(불변 위반)")
        check(merged["entries"][0]["entryHash"] == ledger1["entries"][0]["entryHash"],
              "충돌이 기존 항목을 덮어씀")
        # 파일은 손대지 않았으므로 원장 바이트 불변.
        check(L._ledger_bytes(L.read_ledger(root)) == before, "충돌 시뮬이 원장 파일을 바꿈")
    finally:
        cleanup(root)


# ===========================================================================
# DIFF. 차등 count·capability 가 직전 승인 스냅샷에서 정확히 나온다.
# ===========================================================================
def test_differential_counts():
    root = fresh_root()
    try:
        # 1일차: 전체 유니버스. 2일차: 한 종목을 빼 제외(exited) 차등을 유도(count 는 실제 집합에서만).
        d1, d2 = FIVE_DAYS[0], FIVE_DAYS[1]
        full = copy.deepcopy(BASE["stocks"])
        shrunk = copy.deepcopy(BASE["stocks"])[:-1]  # 마지막 종목 제외 → exited 1
        publish_days(root, [d1], stocks_by_date={d1: full})
        publish_days(root, [d2], stocks_by_date={d2: shrunk})
        ledger, _ = L.refresh_from_store(root, calendar=CAL, refresh_gate=False)

        e1, e2 = ledger["entries"][0], ledger["entries"][1]
        # 첫 항목은 기준선이 없어 available=False.
        check(e1["differential"]["available"] is False, f"첫 항목 차등이 available: {e1['differential']}")
        d = e2["differential"]
        check(d["available"] is True and d["basisMarketDate"] == d1,
              f"2일차 차등 기준일 이상: {d}")
        check(d["exited"] == 1, f"제외 종목 1개 미탐지: {d}")
        check(d["entered"] == 0, f"신규 종목이 잘못 탐지됨: {d}")
        check(d["commonTickers"] == len(BASE["stocks"]) - 1, f"공통 종목 수 이상: {d}")
        # 원시 정의(engineVersion)·소스 계약 동일 → raw 비교 가능. 유니버스 변경 → rank 비교 불가.
        check(d["capability"]["raw"] is True, f"raw 비교 capability 이상: {d['capability']}")
        check(d["capability"]["rank"] is False, f"유니버스 변경인데 rank 비교 가능: {d['capability']}")
    finally:
        cleanup(root)


# ===========================================================================
# PEND/GATE. 승인 run <5 → 게이트 PENDING. 명령이 게이트 JSON·Markdown 을 재생성한다.
# ===========================================================================
def test_pending_and_gate_regenerated():
    root = fresh_root()
    try:
        publish_days(root, FIVE_DAYS[:4])  # 4개 < 5 → PENDING 보존
        gate_json = os.path.join(root, "gate.json")
        gate_md = os.path.join(root, "gate.md")
        ledger, summary = L.refresh_from_store(
            root, calendar=CAL, gate_json_out=gate_json, gate_md_out=gate_md)
        check(summary["gate"]["status"] == rg.GATE_PENDING,
              f"4 run 인데 PENDING 아님: {summary['gate']['status']}")
        check(summary["gate"]["rolloutCandidate"] is False, "PENDING 인데 rolloutCandidate=true")
        check(rg.BLOCK_INSUFFICIENT_REAL_RUNS in summary["gate"]["blockingReasons"],
              "INSUFFICIENT_REAL_RUNS 미표시")
        # 게이트 문서가 실제로 재생성됐다.
        check(os.path.exists(gate_json) and os.path.exists(gate_md), "게이트 문서 미재생성")
        gj = json.load(open(gate_json, encoding="utf-8"))
        check(gj["gate"]["status"] == rg.GATE_PENDING, "재생성 JSON 의 게이트 상태 불일치")
        check(gj["gate"]["actualRuns"] == 4, f"재생성 JSON actualRuns 이상: {gj['gate']['actualRuns']}")
    finally:
        cleanup(root)


# ===========================================================================
# CHAIN. prevHash 연쇄·entryHash·sequence 무결성이 위변조를 잡는다.
# ===========================================================================
def test_chain_integrity():
    root = fresh_root()
    try:
        publish_days(root, FIVE_DAYS)
        ledger, _ = L.refresh_from_store(root, calendar=CAL, refresh_gate=False)
        check(L.verify_chain(ledger) == [], f"정상 원장 체인 검증 실패: {L.verify_chain(ledger)}")
        # 첫 항목 prevHash 는 None, 이후는 직전 entryHash.
        check(ledger["entries"][0]["prevHash"] is None, "첫 항목 prevHash 가 None 아님")
        check(ledger["entries"][1]["prevHash"] == ledger["entries"][0]["entryHash"],
              "연쇄 prevHash 불일치")
        # 위변조: 한 항목의 커버리지를 조작 → entryHash 재계산에서 잡힌다.
        tampered = copy.deepcopy(ledger)
        tampered["entries"][2]["coverage"]["universeSize"] = 999
        probs = L.verify_chain(tampered)
        check(any("entryHash" in p for p in probs), f"위변조가 체인 검증에서 안 잡힘: {probs}")
    finally:
        cleanup(root)


# ===========================================================================
# DET. 같은 저장소 → 바이트 동일 원장(결정적)·ledgerHash 안정.
# ===========================================================================
def test_determinism():
    root_a = fresh_root()
    root_b = fresh_root()
    try:
        publish_days(root_a, FIVE_DAYS[:3])
        publish_days(root_b, FIVE_DAYS[:3])
        la, sa = L.refresh_from_store(root_a, calendar=CAL, refresh_gate=False)
        lb, sb = L.refresh_from_store(root_b, calendar=CAL, refresh_gate=False)
        # snapshotId 는 root 무관(정체성 파생) → entryHash·ledgerHash 동일.
        check([e["entryHash"] for e in la["entries"]] == [e["entryHash"] for e in lb["entries"]],
              "결정성: 두 저장소의 entryHash 다름")
        check(sa["ledgerHash"] == sb["ledgerHash"], "결정성: ledgerHash 다름")
    finally:
        cleanup(root_a)
        cleanup(root_b)


# ===========================================================================
# PURE. 소스에 벽시계/난수/네트워크/public 쓰기 흔적 없음.
# ===========================================================================
def test_source_purity():
    src = open(os.path.join(HERE, "metrics251_ledger.py"), encoding="utf-8").read()
    code = "\n".join(line.split("#", 1)[0] for line in src.splitlines())
    for banned in ("datetime.now(", "time.time(", "date.today(", "utcnow(", "random("):
        check(banned not in code, f"원장 모듈에 결정성 위반(벽시계/난수): {banned!r}")
    for banned in ("urllib", "requests", "socket"):
        check(banned not in code, f"원장 모듈에 네트워크 흔적: {banned!r}")
    check("public/data" not in code, "원장 코드가 public/data 경로를 직접 참조")


def main():
    tests = [
        test_entries_from_qa_passed_with_fields,
        test_unsealed_run_excluded,
        test_append_only_idempotent,
        test_conflict_rejected,
        test_differential_counts,
        test_pending_and_gate_regenerated,
        test_chain_integrity,
        test_determinism,
        test_source_purity,
    ]
    for t in tests:
        try:
            t()
        except Exception as e:  # noqa: BLE001  (테스트 하네스 — 예외도 실패로 수집)
            failures.append(f"{t.__name__} 예외: {e!r}")

    if failures:
        print(f"[FAIL] metrics251_ledger 계약 검증 {len(failures)}건 실패:")
        for x in failures:
            print(f"  - {x}")
        return 1

    print(f"[PASS] metrics251_ledger 계약 검증 통과 ({len(tests)} 케이스: "
          "QA_PASSED파생·미봉인제외·append-only멱등·충돌거절·차등count·PENDING보존+게이트재생성·"
          "체인무결성·결정성·순수성).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
