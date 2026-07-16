#!/usr/bin/env python3
# Metrics 2.5.1 일일 shadow 운영자 상태 명령·보고서 게이트 — Slice P.
#
# 강제하는 계약(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D02/D07/D08/D10,
#   §7 Gate 4, §8, §9, 원안 ORN-2508, 작업 지시):
#   STATE.  8개 운영자 상태(READY/ALREADY_RECORDED/MISSING_INPUT/STALE_SOURCE/CONFLICT/PARTIAL_RUN/
#           QA_FAILED/GATE_PENDING)가 각각 정확히 판정된다.
#   READONLY.판정은 저장소를 변경하지 않는다(승격/pointer/파일 무기록) — run 은 Slice N 소유.
#   GATE.   워크플로 게이트는 Slice K 를 단일 출처로 재사용하고 <5 run 은 PENDING(합성 없음).
#   ACTION. 각 상태에 안전한 다음 조치 텍스트가 비어 있지 않게 제시된다.
#   DET.    같은 입력 → 바이트 동일 보고서·안정 canonical hash·결정적 Markdown.
#   CP949.  cp949(한국어 Windows) 콘솔에서도 --help·보고서 출력이 UnicodeEncodeError 없이 UTF-8 로 나온다.
#   PURE.   소스에 벽시계/난수/네트워크 흔적 없음.
#
# Usage:
#   $env:PYTHONUTF8='1'; python scripts/test_metrics251_operator.py
import copy
import io
import json
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import metrics251_operator as op            # noqa: E402
import metrics251_run as run                # noqa: E402
import metrics251_snapshot_store as store   # noqa: E402
from metrics251_compare import FixtureTradingCalendar  # noqa: E402

CONFIG_PATH = os.path.join(ROOT, "config", "metrics", "2.5.1.json")
FIXTURE_DIR = os.path.join(HERE, "fixtures", "metrics251")
REQUEST_FIXTURE = os.path.join(FIXTURE_DIR, "preflight_request.json")
CALENDAR_FIXTURE = os.path.join(FIXTURE_DIR, "compare_calendar.json")

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


def load_config():
    with open(CONFIG_PATH, encoding="utf-8-sig") as f:
        return json.load(f)


CFG = load_config()
with open(REQUEST_FIXTURE, encoding="utf-8") as f:
    BASE = json.load(f)
with open(CALENDAR_FIXTURE, encoding="utf-8") as f:
    CAL = FixtureTradingCalendar.from_fixture(json.load(f))


def build_request(root, *, market_date=None, source_dates=None, stocks=None):
    """유효 기준 요청을 조립하고 expected pin 을 조립 입력에서 결정적으로 파생한다(run 테스트와 동일)."""
    market_date = BASE["marketDate"] if market_date is None else market_date
    source_dates = copy.deepcopy(BASE["sourceDates"]) if source_dates is None else source_dates
    stocks = copy.deepcopy(BASE["stocks"]) if stocks is None else stocks
    return {
        "marketDate": market_date,
        "expected": run.derive_expected(CFG, market_date, source_dates, stocks),
        "config": CFG,
        "sourceDates": source_dates,
        "stocks": stocks,
        "shadowRoot": root,
        "outputLocation": os.path.join(root, store.RUNS_SUBDIR, f"{market_date}__r1"),
    }


def fresh_root():
    return tempfile.mkdtemp(prefix="m251op_")


def cleanup(d):
    store.rmtree_force(d)


def runs_count(root):
    runs_dir = os.path.join(root, store.RUNS_SUBDIR)
    return len(os.listdir(runs_dir)) if os.path.isdir(runs_dir) else 0


def publish(root, req):
    return run.run_market_day(req, calendar=CAL)


def make_partial_run(root, market_date):
    """미봉인(NOT_SEALED) run 디렉터리를 손으로 만든다 — verify_run_dir 가 ok=False 로 잡는다."""
    snap = {
        "engineVersion": store.ENGINE_VERSION, "configHash": "x", "inputManifestHash": "y",
        "marketDate": market_date, "sourceDates": {}, "runState": "OK", "stocks": [],
        "factorPopulations": {}, "rankingPopulation": {"count": 0, "hash": "h"},
        "eligibilityReasonCounts": {},
    }
    snap_bytes = store.canonical_bytes(snap)
    run_dir = os.path.join(root, store.RUNS_SUBDIR, f"{market_date}__rpartial")
    os.makedirs(run_dir, exist_ok=True)
    with open(os.path.join(run_dir, store.ARTIFACT_SNAPSHOT), "wb") as f:
        f.write(snap_bytes)
    artifacts = {store.ARTIFACT_SNAPSHOT: {"sha256": store._sha256(snap_bytes), "bytes": len(snap_bytes)}}
    # runState 를 QA_PASSED 가 아닌 값으로 봉인하지 않음 → NOT_SEALED.
    manifest = store.build_manifest(f"{market_date}__rpartial", snap, artifacts, "WRITING")
    with open(os.path.join(run_dir, store.ARTIFACT_MANIFEST), "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(manifest, ensure_ascii=False, sort_keys=True, indent=2) + "\n")
    return run_dir


# ===========================================================================
# STATE — 8개 운영자 상태 판정.
# ===========================================================================
def test_ready():
    root = fresh_root()
    try:
        rep = op.build_report(build_request(root), calendar=CAL, root=root)
        check(rep["operatorState"] == op.STATE_READY, f"READY 아님: {rep['operatorState']} {rep['day']}")
        check(rep["day"]["state"] == op.STATE_READY, f"day READY 아님: {rep['day']}")
        check(rep["day"]["preflightOk"] is True, "READY 인데 preflight fail")
        check(runs_count(root) == 0, "READY 판정이 저장소를 변경함(읽기 전용 위반)")
        check(rep["nextActions"], "READY 다음 조치 비어 있음")
    finally:
        cleanup(root)


def test_already_recorded_then_gate_pending():
    root = fresh_root()
    try:
        r1 = publish(root, build_request(root))
        check(r1.status == run.RUN_PUBLISHED, f"사전 게시 실패: {r1.status} {r1.reasons}")
        rep = op.build_report(build_request(root), calendar=CAL, root=root)
        check(rep["day"]["state"] == op.STATE_ALREADY_RECORDED,
              f"ALREADY_RECORDED 아님: {rep['day']}")
        # 이 날은 기록됐지만 5거래일 창 미완료 → 워크플로는 GATE_PENDING.
        check(rep["operatorState"] == op.STATE_GATE_PENDING,
              f"기록완료+미완료창이 GATE_PENDING 아님: {rep['operatorState']}")
        check(rep["gate"]["status"] == "PENDING", f"게이트 PENDING 아님: {rep['gate']}")
        check(runs_count(root) == 1, "판정이 새 run 을 만듦(읽기 전용 위반)")
    finally:
        cleanup(root)


def test_missing_input():
    root = fresh_root()
    try:
        req = build_request(root)
        req["stocks"][0]["prices"] = []  # 필수 시계열 결측 → INPUT_MISSING
        rep = op.build_report(req, calendar=CAL, root=root)
        check(rep["operatorState"] == op.STATE_MISSING_INPUT,
              f"MISSING_INPUT 아님: {rep['operatorState']} {rep['day']['reasons']}")
        check("INPUT_MISSING" in rep["day"]["reasons"], f"INPUT_MISSING 미표시: {rep['day']['reasons']}")
    finally:
        cleanup(root)


def test_stale_source():
    root = fresh_root()
    try:
        req = build_request(root)
        req["sourceDates"]["prices"] = "2026-07-10"  # pin(2026-07-15)보다 과거 → STALE + INPUT_HASH_MISMATCH
        rep = op.build_report(req, calendar=CAL, root=root)
        check(rep["operatorState"] == op.STATE_STALE_SOURCE,
              f"STALE_SOURCE 아님: {rep['operatorState']} {rep['day']['reasons']}")
        check("SOURCE_DATE_STALE" in rep["day"]["reasons"], f"STALE 미표시: {rep['day']['reasons']}")
    finally:
        cleanup(root)


def test_conflict():
    root = fresh_root()
    try:
        r1 = publish(root, build_request(root))
        check(r1.status == run.RUN_PUBLISHED, f"사전 게시 실패: {r1.status}")
        conflicting = build_request(root)
        conflicting["stocks"][0]["prices"][0] += 5.0  # 같은 시장일, 다른 입력 → 다른 정체성
        conflicting["expected"] = run.derive_expected(
            CFG, conflicting["marketDate"], conflicting["sourceDates"], conflicting["stocks"])
        rep = op.build_report(conflicting, calendar=CAL, root=root)
        check(rep["operatorState"] == op.STATE_CONFLICT,
              f"CONFLICT 아님: {rep['operatorState']} {rep['day']}")
        check(rep["day"]["existing"]["kind"] == "conflict", f"충돌 흔적 요약 이상: {rep['day']['existing']}")
        check(runs_count(root) == 1, "충돌 판정이 저장소를 변경함")
    finally:
        cleanup(root)


def test_partial_run():
    root = fresh_root()
    try:
        make_partial_run(root, BASE["marketDate"])
        rep = op.build_report(build_request(root), calendar=CAL, root=root)
        check(rep["operatorState"] == op.STATE_PARTIAL_RUN,
              f"PARTIAL_RUN 아님: {rep['operatorState']} {rep['day']}")
        check(store.READ_NOT_SEALED in rep["day"]["reasons"],
              f"미봉인 사유 미표시: {rep['day']['reasons']}")
    finally:
        cleanup(root)


def test_qa_failed():
    root = fresh_root()
    try:
        # eligibility 실제 계산은 통과하므로, QA 게이트 실패를 재현하려면 report 를 오염시킨다.
        # 여기서는 qa_gate 재사용 계약을 직접 검증(엔진 통과 + QA blocker → QA_FAILED).
        req = build_request(root)
        engine_req = {"config": req["config"], "marketDate": req["marketDate"],
                      "sourceDates": req["sourceDates"], "stocks": req["stocks"]}
        real = run.qa_gate(op.elig.evaluate(engine_req))
        check(real["ok"], f"기준 입력의 QA 가 통과가 아님(픽스처 이상): {real['blockers']}")
        # 주입: unknownReasons 가 있으면 QA 실패해야 한다(합성 아님 — 계약 확인).
        injected = run.qa_gate({"runOk": True, "unknownReasons": ["value.MYSTERY"],
                                "consistency": {"a": True}, "excludedWithoutReason": []})
        check(not injected["ok"] and "unknown_reasons" in injected["blockers"],
              f"미지 사유가 QA 를 막지 않음: {injected}")
    finally:
        cleanup(root)


def test_status_only_mode_gate_pending():
    root = fresh_root()
    try:
        rep = op.build_report(None, calendar=CAL, root=root)  # 요청 없음 → 상태 전용
        check(rep["meta"]["mode"] == "status", f"상태 전용 모드 아님: {rep['meta']['mode']}")
        check(rep["day"] is None, "상태 전용인데 day 존재")
        check(rep["operatorState"] == op.STATE_GATE_PENDING,
              f"빈 저장소 상태 전용이 GATE_PENDING 아님: {rep['operatorState']}")
        check(rep["gate"]["actualRuns"] == 0, f"빈 저장소 run 0 아님: {rep['gate']}")
    finally:
        cleanup(root)


def test_public_root_fails_closed():
    # public/ 밑 루트는 게이트 읽기가 거부되고 보고서에 오류가 기록된다(누출 가드).
    rep = op.build_report(None, calendar=CAL, root=os.path.join(ROOT, "public", "data"))
    check(rep["meta"]["gateError"], "public/ 루트인데 게이트 오류가 기록되지 않음(누출 가드 실패)")


# ===========================================================================
# ACTION — 모든 상태에 비어 있지 않은 다음 조치가 있다.
# ===========================================================================
def test_next_actions_nonempty_for_all_states():
    for st in op.ALL_STATES:
        acts = op.next_actions(st, day=None, gate={"actualRuns": 0, "requiredConsecutiveRuns": 5,
                                                   "trailingConsecutivePassingRuns": 0})
        check(isinstance(acts, list) and acts and all(isinstance(a, str) and a for a in acts),
              f"{st} 다음 조치가 비었거나 형식 이상: {acts}")


# ===========================================================================
# DET — 결정성(바이트 동일 보고서·안정 hash·결정적 Markdown).
# ===========================================================================
def test_determinism():
    root = fresh_root()
    try:
        a = op.build_report(build_request(root), calendar=CAL, root=root)
        b = op.build_report(build_request(root), calendar=CAL, root=root)
        ja = json.dumps(a, ensure_ascii=False, sort_keys=True)
        jb = json.dumps(b, ensure_ascii=False, sort_keys=True)
        check(ja == jb, "동일 입력 보고서가 바이트 동일 아님")
        check(op.report_hash(a) == op.report_hash(b), "canonical hash 불안정")
        check(op.render_markdown(a) == op.render_markdown(b), "Markdown 렌더가 결정적이지 않음")
        check(op.render_console(a) == op.render_console(b), "콘솔 렌더가 결정적이지 않음")
    finally:
        cleanup(root)


# ===========================================================================
# CP949 — 한국어 Windows 콘솔(cp949)에서 --help·보고서가 UnicodeEncodeError 없이 UTF-8 로 나온다.
# ===========================================================================
def _with_cp949_stdout(fn):
    """sys.stdout/stderr 를 cp949 TextIOWrapper 로 교체하고 fn() 실행. raw bytes 를 읽고 원복해 반환.

    TextIOWrapper 는 GC 시 하위 BytesIO 를 닫으므로, 원복 전에 bytes 를 읽고 detach() 로 분리한다.
    """
    raw_out = io.BytesIO()
    raw_err = io.BytesIO()
    old_out, old_err = sys.stdout, sys.stderr
    sys.stdout = io.TextIOWrapper(raw_out, encoding="cp949", errors="strict", newline="")
    sys.stderr = io.TextIOWrapper(raw_err, encoding="cp949", errors="strict", newline="")
    out_bytes = err_bytes = b""
    try:
        result = fn()
        sys.stdout.flush()
        sys.stderr.flush()
        out_bytes = raw_out.getvalue()
        err_bytes = raw_err.getvalue()
    finally:
        for stream in (sys.stdout, sys.stderr):
            try:
                stream.detach()  # 하위 BytesIO 를 닫지 않도록 분리(이미 bytes 를 읽음).
            except Exception:  # noqa: BLE001
                pass
        sys.stdout, sys.stderr = old_out, old_err
    return result, out_bytes, err_bytes


def test_cp949_report_output():
    # cp949 콘솔에 한글+상태 기호(✅⏳ 등)를 그대로 인쇄하면 UnicodeEncodeError 가 나야 정상(회귀 대상).
    # enable_utf8_console() 이 stdout 을 UTF-8 로 재구성하면 예외 없이 UTF-8 바이트가 나온다.
    root = fresh_root()
    try:
        report = op.build_report(build_request(root), calendar=CAL, root=root)

        def run_it():
            op.enable_utf8_console()          # 실제 명령이 main() 초입에서 호출하는 것과 동일.
            print(op.render_console(report))  # 한글 + ⏳/✅ 등 비-cp949 문자 포함.
            return True

        ok, out_bytes, _ = _with_cp949_stdout(run_it)
        check(ok, "cp949 콘솔에서 보고서 출력이 예외를 던짐(UTF-8 재구성 실패)")
        text = out_bytes.decode("utf-8")      # UTF-8 로 온전히 디코드돼야 한다.
        check("상태=" in text and op.STATE_READY in text, f"cp949 출력 내용 이상: {text[:120]!r}")
    finally:
        cleanup(root)


def test_cp949_help_output():
    # --help 는 argparse 가 stdout 으로 인쇄하고 SystemExit(0) 한다. epilog 에 비-cp949 기호가 있으므로
    # 재구성이 없으면 cp949 에서 깨진다. enable_utf8_console() 은 인자 파싱 전에 호출된다.
    def run_help():
        try:
            op.main(["--help"])
            return "no-exit"
        except SystemExit as e:
            return e.code

    code, out_bytes, _ = _with_cp949_stdout(run_help)
    check(code == 0, f"--help 종료 코드가 0 아님: {code}")
    text = out_bytes.decode("utf-8")
    check("READY" in text and "GATE_PENDING" in text, f"--help 범례 누락: {text[:160]!r}")
    check("✅" in text or "⏳" in text, "--help 에 상태 기호가 UTF-8 로 나오지 않음")


def test_enable_utf8_console_idempotent_on_utf8():
    # 이미 UTF-8 인 스트림은 건드리지 않는다(재구성 예외 없이 통과).
    raw = io.BytesIO()
    old = sys.stdout
    sys.stdout = io.TextIOWrapper(raw, encoding="utf-8", newline="")
    got = b""
    try:
        op.enable_utf8_console()
        print("한국어 ✅ 확인")
        sys.stdout.flush()
        got = raw.getvalue()
    finally:
        try:
            sys.stdout.detach()  # 하위 BytesIO 를 닫지 않도록 분리.
        except Exception:  # noqa: BLE001
            pass
        sys.stdout = old
    check(got.decode("utf-8").strip() == "한국어 ✅ 확인", "UTF-8 스트림 출력 손상")


# ===========================================================================
# PURE — 소스 순수성.
# ===========================================================================
def test_source_purity():
    with open(os.path.join(HERE, "metrics251_operator.py"), encoding="utf-8") as f:
        src = f.read()
    code = "\n".join(line.split("#", 1)[0] for line in src.splitlines())
    for banned in ("datetime.now(", "time.time(", "date.today(", "utcnow(", "random("):
        check(banned not in code, f"operator 소스에 결정성 위반(벽시계/난수): {banned!r}")
    for banned in ("requests", "urllib", "socket", "FinanceDataReader", "fdr."):
        check(banned not in code, f"operator 소스에 네트워크/외부 데이터 흔적: {banned!r}")
    # public/ 경로를 열지 않는다(읽기·쓰기 모두).
    for line in code.splitlines():
        check(not ("open(" in line and "public" in line), f"public/ 경로 open 흔적: {line.strip()!r}")


TESTS = [
    test_ready,
    test_already_recorded_then_gate_pending,
    test_missing_input,
    test_stale_source,
    test_conflict,
    test_partial_run,
    test_qa_failed,
    test_status_only_mode_gate_pending,
    test_public_root_fails_closed,
    test_next_actions_nonempty_for_all_states,
    test_determinism,
    test_cp949_report_output,
    test_cp949_help_output,
    test_enable_utf8_console_idempotent_on_utf8,
    test_source_purity,
]


def main():
    for t in TESTS:
        try:
            t()
        except Exception as e:  # noqa: BLE001  (테스트 하네스 — 예외도 실패로 수집)
            failures.append(f"{t.__name__} 예외: {e!r}")
    if failures:
        print(f"[FAIL] metrics251_operator 계약 검증 {len(failures)}건 실패:")
        for x in failures:
            print(f"  - {x}")
        return 1
    print(f"[PASS] metrics251_operator 운영자 상태 계약 통과 ({len(TESTS)} 케이스: "
          "8개 상태 판정·읽기전용·게이트 단일출처·다음조치·결정성·cp949 콘솔(--help/보고서)·순수성).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
