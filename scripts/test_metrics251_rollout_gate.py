#!/usr/bin/env python3
# Metrics 2.5.1 shadow 운영 보고서 · 롤아웃 게이트 게이트 — Slice K.
#
# 강제하는 계약(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D02, §7 Gate 4,
#      §8 데이터 계약, §9 실패/롤백, §10 Slice K):
#   AND.   롤아웃 후보는 5개 연속 실제 거래일 QA_PASSED + 창 전체 (미해결P0·소스일불일치·미지제외사유·
#          공개누출) 4-zero 를 **동시에** 만족할 때만 true 다(OR 아님).
#   RESET. 하루라도 거래일이 빠지거나(연속성 끊김) run 이 실패하면 후행 연속 카운트가 초기화된다.
#   PEND.  실제 run 이 5개 미만이면 PENDING — 증거를 합성하지 않는다(clean 이어도 candidate=false).
#   RUNCHK.run 단위 실패 사유(소스일 미래/결측·factor SOURCE_DATE_MISMATCH·미지사유·공개누출·
#          차등결측·미봉인·비거래일)가 정확히 발화한다.
#   SUMM.  실행별 요약이 소스일·config/engine/input 해시·factor/ranking 커버리지·제외사유·차등·
#          manifest 무결성·연속성을 담는다.
#   LEAK.  공개 경로 누출 탐지(is_public_path)와 저장소 private 루트 강제가 살아있다.
#   STORE. 비어 있는 실제 shadow 저장소는 run 0개 → PENDING(합성 없음). private 루트만 읽는다.
#   DET.   같은 입력의 보고서/Markdown 이 바이트 동일(결정적)·canonical hash 안정.
#   PURE.  소스에 벽시계/난수/네트워크 흔적 없음·출력은 docs/·public/ 에 쓰지 않는다.
#
# Usage:
#   $env:PYTHONUTF8='1'; python scripts/test_metrics251_rollout_gate.py
import copy
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import metrics251_rollout_gate as G  # noqa: E402
from metrics251_compare import FixtureTradingCalendar  # noqa: E402

FIXDIR = os.path.join(HERE, "fixtures", "metrics251")
FIX = json.load(open(os.path.join(FIXDIR, "rollout_gate_fixtures.json"), encoding="utf-8"))
CAL = FixtureTradingCalendar.from_fixture(FIX["calendar"])
SCEN = FIX["scenarios"]

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


def _runs(name):
    return copy.deepcopy(SCEN[name]["runs"])


def _gate(name):
    return G.evaluate_rollout_gate(_runs(name), CAL)


# ===========================================================================
# AND. 5일 AND 게이트 — MET 은 5개 연속 + 4-zero 동시 만족일 때만.
# ===========================================================================
def test_met_scenario():
    r = _gate("met")
    g = r["gate"]
    check(g["status"] == G.GATE_MET, f"met status={g['status']}")
    check(g["rolloutCandidate"] is True, "met rolloutCandidate 이 true 아님")
    check(g["trailingConsecutivePassingRuns"] == 5, f"met trailing={g['trailingConsecutivePassingRuns']}")
    wz = g["windowZeroConditions"]
    check(all(v == 0 for v in wz.values()), f"met 창 4-zero 위반: {wz}")
    check(len(g["windowDates"]) == 5, f"met window {g['windowDates']}")
    check(r["aggregate"]["passingRuns"] == 5, "met passingRuns != 5")


def test_and_gate_not_or():
    """MET 인 met 시나리오에서 마지막 run 하나만 P0 를 넣으면 4-zero 가 깨져 MET 이 무너진다(AND)."""
    runs = _runs("met")
    runs[-1]["differential"]["unresolvedP0"] = 1  # 연속일은 5개지만 P0 로 창이 오염
    g = G.evaluate_rollout_gate(runs, CAL)["gate"]
    check(g["status"] != G.GATE_MET, "P0 가 있는데도 MET (OR 처럼 통과 — AND 위반)")
    check(g["rolloutCandidate"] is False, "P0 오염인데 rolloutCandidate=true")


# ===========================================================================
# RESET / RUNCHK — 연속성 끊김·실패 run 이 후행 연속을 초기화한다.
# ===========================================================================
def test_gap_resets():
    r = _gate("gap")
    g = r["gate"]
    check(g["status"] == G.GATE_NOT_MET, f"gap status={g['status']}")
    check(g["rolloutCandidate"] is False, "gap 인데 candidate=true")
    check(g["trailingConsecutivePassingRuns"] == 3, f"gap trailing={g['trailingConsecutivePassingRuns']}")
    check(len(r["continuity"]["gaps"]) >= 1, "gap 연속성 끊김이 보고되지 않음")
    check(G.BLOCK_CONTINUITY_BROKEN in g["blockingReasons"], "gap CONTINUITY_BROKEN 미표시")


def test_p0_reset():
    r = _gate("p0Reset")
    g = r["gate"]
    check(g["status"] == G.GATE_NOT_MET, f"p0Reset status={g['status']}")
    check(g["trailingConsecutivePassingRuns"] == 2, f"p0Reset trailing={g['trailingConsecutivePassingRuns']}")
    # 중간 P0 run 이 실패로 집계된다.
    check(r["aggregate"]["runFailReasonCounts"].get(G.FAIL_UNRESOLVED_P0) == 1,
          f"p0Reset UNRESOLVED_P0 집계 오류: {r['aggregate']['runFailReasonCounts']}")


# ===========================================================================
# PEND. 5개 미만 → PENDING, 합성 금지(clean 이어도 candidate=false).
# ===========================================================================
def test_pending_no_synthesis():
    r = _gate("pending")
    g = r["gate"]
    check(g["status"] == G.GATE_PENDING, f"pending status={g['status']}")
    check(g["rolloutCandidate"] is False, "pending 인데 candidate=true (증거 합성)")
    check(g["actualRuns"] == 3, f"pending actualRuns={g['actualRuns']}")
    check(G.BLOCK_INSUFFICIENT_REAL_RUNS in g["blockingReasons"], "pending INSUFFICIENT_REAL_RUNS 미표시")


# ===========================================================================
# RUNCHK. run 단위 실패 사유가 정확히 발화한다(단일-run fault fixtures).
# ===========================================================================
def _fail_reasons(name):
    finding = G.evaluate_run(_runs(name)[0], CAL)
    return finding.failReasons, finding.passesRunChecks


def test_fault_source_future():
    fr, ok = _fail_reasons("faultSourceFuture")
    check(not ok, "faultSourceFuture 가 통과함")
    check(G.FAIL_SOURCE_DATE_MISMATCH in fr, f"미래 소스일 미탐지: {fr}")


def test_fault_factor_source_mismatch():
    fr, ok = _fail_reasons("faultFactorSourceMismatch")
    check(not ok, "faultFactorSourceMismatch 가 통과함")
    check(G.FAIL_SOURCE_DATE_MISMATCH in fr, f"factor SOURCE_DATE_MISMATCH 미탐지: {fr}")
    # 수량 집계 확인.
    finding = G.evaluate_run(_runs("faultFactorSourceMismatch")[0], CAL)
    check(finding.sourceDateFindings["factorMismatch"] == 2,
          f"factorMismatch 집계 오류: {finding.sourceDateFindings}")


def test_fault_unknown_reason():
    fr, ok = _fail_reasons("faultUnknownReason")
    check(not ok, "faultUnknownReason 가 통과함")
    check(G.FAIL_UNKNOWN_EXCLUSION_REASON in fr, f"미지 제외 사유 미탐지: {fr}")


def test_fault_public_leak():
    fr, ok = _fail_reasons("faultPublicLeak")
    check(not ok, "faultPublicLeak 가 통과함")
    check(G.FAIL_PUBLIC_PATH_LEAK in fr, f"공개 경로 누출 미탐지: {fr}")


def test_fault_differential_missing():
    fr, ok = _fail_reasons("faultDifferentialMissing")
    check(not ok, "faultDifferentialMissing 가 통과함")
    check(G.FAIL_DIFFERENTIAL_MISSING in fr, f"차등 결측 미탐지: {fr}")
    # 차등이 없으면 절대 P0-clean 으로 합성하지 않는다.
    finding = G.evaluate_run(_runs("faultDifferentialMissing")[0], CAL)
    check(finding.unresolvedP0 is None, "차등 결측인데 unresolvedP0 가 합성됨")


def test_fault_not_sealed():
    fr, ok = _fail_reasons("faultNotSealed")
    check(not ok, "faultNotSealed 가 통과함")
    check(G.FAIL_NOT_QA_PASSED in fr and G.FAIL_MANIFEST_COMPROMISED in fr,
          f"미봉인/무결성 손상 미탐지: {fr}")


def test_fault_non_trading_day():
    fr, ok = _fail_reasons("faultNonTradingDay")
    check(not ok, "faultNonTradingDay 가 통과함")
    check(G.FAIL_NOT_TRADING_DAY in fr, f"비거래일 미탐지: {fr}")


def test_calendar_uncovered():
    """캘린더가 없으면 연속성 확정 불가 → 모든 run CALENDAR_UNCOVERED(합성 안 함)."""
    finding = G.evaluate_run(_runs("met")[0], None)
    check(G.FAIL_CALENDAR_UNCOVERED in finding.failReasons, "캘린더 미제공 시 CALENDAR_UNCOVERED 미발화")
    check(finding.isRealMarketDay is None, "캘린더 미제공인데 거래일 판정을 합성함")


# ===========================================================================
# SUMM. 실행별 요약이 핵심 필드를 담는다(소스일·해시·커버리지·제외·차등·무결성·연속성).
# ===========================================================================
def test_summary_fields():
    r = _gate("met")
    run0 = r["runs"][0]
    for key in ("sourceDates", "configHash", "inputManifestHash", "engineVersion",
                "factorCoverage", "rankingCoverage", "exclusionReasons",
                "differentialAvailable", "manifestIntact", "isRealMarketDay"):
        check(key in run0, f"실행별 요약에 {key} 누락")
    # 커버리지 pct 계산 정확: value count 137 / universe 138.
    fc = run0["factorCoverage"]["value"]
    check(fc["count"] == 137 and abs(fc["pct"] - round(137 / 138 * 100, 2)) < 1e-9,
          f"value 커버리지 오류: {fc}")
    check(run0["rankingCoverage"]["count"] == 137, "ranking 커버리지 count 오류")
    # 연속성 요약.
    check("orderedDates" in r["continuity"] and "gaps" in r["continuity"], "연속성 요약 누락")
    check(r["meta"]["requiredConsecutiveRuns"] == 5, "요구 연속일이 5 가 아님")


# ===========================================================================
# LEAK / STORE — 공개 경로 누출 가드와 private-only 저장소 읽기.
# ===========================================================================
def test_is_public_path():
    check(G.is_public_path(os.path.join(ROOT, "public", "data", "x")) is True, "public/ 경로를 누출로 안 봄")
    check(G.is_public_path(os.path.join(ROOT, ".metrics251-shadow", "runs", "x")) is False,
          "비공개 경로를 누출로 오판")
    check(G.is_public_path(None) is False, "None 경로 처리 오류")


def test_store_empty_pending(tmp_root=None):
    # 존재하지 않는 비공개 루트 → run 0 → PENDING(합성 없음).
    fake_root = os.path.join(ROOT, ".metrics251-shadow-nonexistent-slicek-test")
    recs = G.run_evidence_from_store(fake_root)
    check(recs == [], f"빈 저장소가 비어있지 않음: {recs}")
    g = G.evaluate_rollout_gate(recs, None, generated_from="shadow-store")["gate"]
    check(g["status"] == G.GATE_PENDING and g["actualRuns"] == 0,
          f"빈 저장소가 PENDING/0 이 아님: {g['status']}/{g['actualRuns']}")


def test_store_rejects_public_root():
    raised = False
    try:
        G.run_evidence_from_store(os.path.join(ROOT, "public", "data"))
    except ValueError:
        raised = True
    check(raised, "public/ 루트에서 shadow 읽기를 거부하지 않음(누출 가드 실패)")


# ===========================================================================
# DET. 결정성 — 같은 입력 → 바이트 동일 보고서/Markdown·안정 hash.
# ===========================================================================
def test_determinism():
    a = _gate("met")
    b = _gate("met")
    ja = json.dumps(a, ensure_ascii=False, sort_keys=True)
    jb = json.dumps(b, ensure_ascii=False, sort_keys=True)
    check(ja == jb, "동일 입력 보고서가 바이트 동일 아님")
    check(G.report_hash(a) == G.report_hash(b), "canonical hash 불안정")
    check(G.render_markdown(a) == G.render_markdown(b), "Markdown 렌더가 결정적이지 않음")
    # 입력 순서 불변: 셔플해도 같은 결과(정렬 계약).
    runs = _runs("met")
    shuffled = [runs[i] for i in (3, 0, 4, 1, 2)]
    c = G.evaluate_rollout_gate(shuffled, CAL)
    check(json.dumps(c, ensure_ascii=False, sort_keys=True) == ja,
          "입력 순서에 따라 결과가 달라짐(정렬 계약 위반)")


# ===========================================================================
# PURE. 소스 순수성.
# ===========================================================================
def test_source_purity():
    with open(os.path.join(HERE, "metrics251_rollout_gate.py"), encoding="utf-8") as f:
        src = f.read()
    code = "\n".join(line.split("#", 1)[0] for line in src.splitlines())
    for banned in ("datetime.now(", "time.time(", "date.today(", "utcnow(", "random("):
        check(banned not in code, f"rollout_gate 소스에 결정성 위반(벽시계/난수): {banned!r}")
    for banned in ("requests", "urllib", "socket", "FinanceDataReader", "fdr."):
        check(banned not in code, f"rollout_gate 소스에 네트워크/외부 데이터 흔적: {banned!r}")
    check(G.DEFAULT_JSON_OUT.replace("\\", "/").split("OrnScore/")[-1].startswith("docs/"),
          "JSON 출력이 docs/ 밖")
    check(G.DEFAULT_MD_OUT.replace("\\", "/").split("OrnScore/")[-1].startswith("docs/"),
          "Markdown 출력이 docs/ 밖")
    # public/ 경로를 열지 않는다(읽기·쓰기 모두) — open() 과 public 이 같은 줄에 없어야 한다.
    for line in code.splitlines():
        check(not ("open(" in line and "public" in line), f"public/ 경로 open 흔적: {line.strip()!r}")


TESTS = [
    test_met_scenario,
    test_and_gate_not_or,
    test_gap_resets,
    test_p0_reset,
    test_pending_no_synthesis,
    test_fault_source_future,
    test_fault_factor_source_mismatch,
    test_fault_unknown_reason,
    test_fault_public_leak,
    test_fault_differential_missing,
    test_fault_not_sealed,
    test_fault_non_trading_day,
    test_calendar_uncovered,
    test_summary_fields,
    test_is_public_path,
    test_store_empty_pending,
    test_store_rejects_public_root,
    test_determinism,
    test_source_purity,
]


def main():
    for t in TESTS:
        try:
            t()
        except Exception as e:  # noqa: BLE001
            failures.append(f"{t.__name__} 예외: {e!r}")
    if failures:
        print("FAIL — Slice K 롤아웃 게이트")
        for f in failures:
            print("  -", f)
        return 1
    print(f"PASS — Slice K shadow 운영 보고서·5일 AND 게이트 ({len(TESTS)} 케이스). "
          "AND 게이트(OR 아님)·연속성 초기화·PENDING 합성금지·run 단위 실패사유·실행별 요약·"
          "공개누출 가드·private-only 저장소·결정성·순수성.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
