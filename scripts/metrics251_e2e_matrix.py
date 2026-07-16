#!/usr/bin/env python3
# Metrics 2.5.1 end-to-end fault-matrix 하네스 (Slice Q) — 순수·결정적·표준 라이브러리 전용.
#   공개 라우트/화면·public/data·Metrics 2.4 런타임에 연결하지 않는다(로컬/비공개 지향).
#
# 목적(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D02(5일 AND 게이트),
#      §M251-D07(원자적·불변 승격), §M251-D10(비공개 자산), §7 Gate 4, §8 데이터 계약, §9 실패/롤백,
#      원안 티켓 ORN-2503/2508, 작업 지시):
#   * **preflight(Slice M) → run(Slice N: 엔진 D·자격 E·비교 G·저장소 F) → 롤아웃 게이트(Slice K)**
#     의 완전한 워크플로를 하나의 **유한한 fixture 기반 fault matrix** 로 종단(end-to-end) 실행한다.
#     각 시나리오는 기존 계약 층을 **재사용만** 한다 — 새 산식/게이트를 만들지 않는다.
#   * 다루는 시나리오(작업 지시 목록, 11종):
#       1. clean first run            — 깨끗한 첫 게시 → PUBLISHED
#       2. identical rerun            — 바이트 동일 재실행 → NOOP(멱등)
#       3. conflicting rerun          — 같은 시장일·다른 입력 → REJECTED(SAME_DATE_CONFLICT)
#       4. interrupted write          — manifest/pointer 전 중단 → REJECTED(PUBLISH_FAILED)·승인 pointer 없음
#       5. corrupt manifest           — 승격 후 manifest 변조 → reader DEGRADED·게이트 run 실패
#       6. source-date mismatch       — 소스 기준일 pin 어긋남 → PREFLIGHT_FAILED
#       7. unknown exclusion reason   — 알 수 없는 제외 사유 키 → 게이트 UNKNOWN_EXCLUSION_REASON
#       8. unresolved P0              — 미해결 P0 차등 → 게이트 UNRESOLVED_P0
#       9. invalid output location    — 출력 위치가 비공개 레이아웃 이탈 → PREFLIGHT_FAILED
#      10. missing-day continuity reset — 거래일 누락 → 게이트 연속성 초기화(NOT_MET)
#      11. five consecutive passing   — 5개 연속 통과 fixture 거래일 → 게이트 MET(합성 fixture 위에서만)
#   * **안전 명제(작업 지시 핵심)**: 이 matrix 가 만드는 **모든 fixture 산출물은 합성-테스트 마커를
#     싣는다.** 그리고 별도의 **genuine-run 게이트**(genuine_run_gate)가 그 마커를 실은 어떤 산출물도
#     거부한다. 즉 11번의 "MET" 처럼 완전 초록 경로를 fixture 위에서 시연하더라도, 이 합성 증거는
#     genuine-run 게이트에 의해 실제 거래일 shadow 증거로 세탁될 수 없다(§M251-D02: 5거래일을
#     조작하지 않는다). 실제 releaseReady 는 오직 마커 없는 실제 거래일 run 으로만 달성된다.
#
# 반드시 지키는 규칙(설계서 §4 변경 불가 원칙 · §M251-D10 · 작업 지시):
#   * 벽시계 시각(datetime.now()/time.time()/date.today() 등)·난수·네트워크 금지 — 관측·판정은
#     fixture·저장소 입력에서만 결정적으로 파생한다. 결측을 50/평균으로 채우지 않는다.
#   * public/ 데이터를 읽거나 쓰지 않는다. 저장소 산출물은 비공개(Git 비추적) 임시 shadow 루트에만
#     둔다(호출자가 공급). 공개 pointer/API/화면을 만들지 않는다.
#   * 게시/pointer 교체/스냅샷 저장은 Slice N run 의 원자적 publish 를 단일 출처로 재사용한다.
#   * 게이트 판정은 Slice K rollout_gate 를 단일 출처로 재사용한다(합성 판정 로직 없음).
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import stat
import sys
from dataclasses import dataclass, field

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import metrics251_run as run                # noqa: E402  (Slice N 조립 오케스트레이터 — 단일 출처)
import metrics251_preflight as pf           # noqa: E402  (Slice M preflight 사유 코드)
import metrics251_snapshot_store as store   # noqa: E402  (Slice F 저장소·verify/read/corrupt 관측)
import metrics251_rollout_gate as rg        # noqa: E402  (Slice K 게이트 — 단일 출처)
import metrics251_ledger as ledger          # noqa: E402  (Slice O 증거 원장 — 읽기 전용 체인 관측)
from metrics251_compare import FixtureTradingCalendar  # noqa: E402  (Slice G 거래일 캘린더)
from metrics251_config import canonical_bytes          # noqa: E402  (결정성 canonical 해시)

ENGINE_VERSION = run.ENGINE_VERSION

CONFIG_PATH = os.path.join(ROOT, "config", "metrics", "2.5.1.json")
FIXTURE_DIR = os.path.join(HERE, "fixtures", "metrics251")
REQUEST_FIXTURE = os.path.join(FIXTURE_DIR, "preflight_request.json")
CALENDAR_FIXTURE = os.path.join(FIXTURE_DIR, "compare_calendar.json")

# ---------------------------------------------------------------------------
# 합성-테스트 마커 + genuine-run 게이트(안전 명제의 두 축).
#   * 모든 fixture 산출물에 provenance 마커를 심는다.
#   * genuine-run 게이트는 마커를 실은 산출물을 거부한다 — 실제 run 은 마커가 없어야 통과한다.
# ---------------------------------------------------------------------------
SYNTHETIC_MARKER = "metrics251.synthetic-e2e-fixture.v1"
SYNTHETIC_PROVENANCE = {
    "syntheticTest": True,
    "marker": SYNTHETIC_MARKER,
    "note": "합성 end-to-end fault-matrix fixture — 실제 거래일 shadow run 이 아니며 genuine-run "
            "게이트가 거부한다(§M251-D02·D10). releaseReady 근거로 쓸 수 없다.",
}
# genuine-run 게이트가 합성 산출물을 만났을 때의 안정적 거절 사유.
GENUINE_REJECT_SYNTHETIC = "SYNTHETIC_TEST_ARTIFACT"


def stamp_synthetic(obj):
    """dict 산출물에 합성-테스트 provenance 마커를 심어 새 dict 로 돌려준다(원본 불변)."""
    out = copy.deepcopy(obj)
    if isinstance(out, dict):
        out["provenance"] = copy.deepcopy(SYNTHETIC_PROVENANCE)
    return out


def carries_synthetic_marker(obj):
    """산출물(중첩 dict/list) 어디에든 합성-테스트 마커가 있으면 True(재귀 스캔·순수)."""
    if isinstance(obj, dict):
        if obj.get("syntheticTest") is True or obj.get("marker") == SYNTHETIC_MARKER:
            return True
        return any(carries_synthetic_marker(v) for v in obj.values())
    if isinstance(obj, list):
        return any(carries_synthetic_marker(v) for v in obj)
    if isinstance(obj, str):
        return obj == SYNTHETIC_MARKER
    return False


def genuine_run_gate(artifact):
    """genuine-run 게이트: 합성-테스트 마커를 실은 산출물은 거부한다. (accepted, reasons).

    실제 거래일 shadow 증거는 마커가 없어야 통과한다. 이 게이트가 있으므로 이 matrix 의 어떤
    fixture(예: 11번 MET 경로)도 실제 5거래일 shadow 증거로 세탁될 수 없다(§M251-D02).
    """
    if carries_synthetic_marker(artifact):
        return False, [GENUINE_REJECT_SYNTHETIC]
    return True, []


# ---------------------------------------------------------------------------
# fixture 로딩(결정적 static — 벽시계/난수/네트워크 없음).
# ---------------------------------------------------------------------------
def load_config():
    with open(CONFIG_PATH, encoding="utf-8-sig") as f:
        return json.load(f)


def load_base_request():
    with open(REQUEST_FIXTURE, encoding="utf-8") as f:
        return json.load(f)


def load_calendar():
    with open(CALENDAR_FIXTURE, encoding="utf-8") as f:
        return FixtureTradingCalendar.from_fixture(json.load(f))


# ---------------------------------------------------------------------------
# 결과 타입(typed).
# ---------------------------------------------------------------------------
@dataclass
class ScenarioResult:
    scenario: str                                 # 안정적 시나리오 키
    track: str                                    # "store"(실 워크플로) | "gate"(실 게이트)
    observed: dict = field(default_factory=dict)  # 결정적 관측 사실(경로·임시명 미포함)
    artifacts: list = field(default_factory=list)  # 이 시나리오가 만든 합성 fixture 산출물(마커 포함)

    def to_dict(self):
        return {"scenario": self.scenario, "track": self.track,
                "observed": self.observed, "artifacts": self.artifacts}


# ---------------------------------------------------------------------------
# store 트랙 헬퍼 — 유효 기준 요청을 조립하고 합성 마커를 심는다(preflight/run 은 마커 키를 무시).
# ---------------------------------------------------------------------------
def build_request(root, cfg, base, *, market_date=None, source_dates=None, stocks=None,
                  output_location=None):
    """유효 run 요청을 조립하고 expected pin 을 조립 입력에서 결정적으로 파생한 뒤 마커를 심는다."""
    market_date = base["marketDate"] if market_date is None else market_date
    source_dates = copy.deepcopy(base["sourceDates"]) if source_dates is None else source_dates
    stocks = copy.deepcopy(base["stocks"]) if stocks is None else stocks
    req = {
        "marketDate": market_date,
        "expected": run.derive_expected(cfg, market_date, source_dates, stocks),
        "config": cfg,
        "sourceDates": source_dates,
        "stocks": stocks,
        "shadowRoot": root,
        "outputLocation": (output_location if output_location is not None
                           else os.path.join(root, store.RUNS_SUBDIR, f"{market_date}__r1")),
    }
    return stamp_synthetic(req)


def _runs_count(root):
    runs_dir = os.path.join(root, store.RUNS_SUBDIR)
    return len(os.listdir(runs_dir)) if os.path.isdir(runs_dir) else 0


def _store_gate_status(root, calendar):
    """비공개 저장소 → Slice K 게이트(읽기 전용). 저장소 run 은 차등 부재라 MET 불가(PENDING/NOT_MET)."""
    records = rg.run_evidence_from_store(root)
    report = rg.evaluate_rollout_gate(records, calendar, generated_from="shadow-store")
    return report["gate"]


# ===========================================================================
# 시나리오 1 — clean first run: 깨끗한 첫 게시 → PUBLISHED, pointer 설정, preflight→게이트 체인.
# ===========================================================================
def sc_clean_first_run(root, cfg, base, calendar):
    req = build_request(root, cfg, base)
    res = run.run_market_day(req, calendar=calendar)
    rc = store.read_current(root)
    gate = _store_gate_status(root, calendar)
    # 원장(읽기 전용)까지 체인 — 승인 run 1개는 게이트 PENDING 을 보존한다(증거 합성 없음).
    _led, summary = ledger.refresh_from_store(root, calendar=calendar, write=False, refresh_gate=True)
    return ScenarioResult(
        scenario="clean_first_run", track="store",
        observed={
            "status": res.status,
            "reasons": res.reasons,
            "readStatus": rc.status,
            "runsCount": _runs_count(root),
            "pointerToCandidate": bool(rc.pointer and rc.pointer.get("snapshotId") == res.snapshotId),
            "gateStatus": gate["status"],
            "gateActualRuns": gate["actualRuns"],
            "gateRolloutCandidate": gate["rolloutCandidate"],
            "ledgerAcceptedRuns": summary["acceptedRuns"],
        },
        artifacts=[req])


# ===========================================================================
# 시나리오 2 — identical rerun: 바이트 동일 재실행 → NOOP, 새 run 없음, pointer 무변경.
# ===========================================================================
def sc_identical_rerun(root, cfg, base, calendar):
    req1 = build_request(root, cfg, base)
    r1 = run.run_market_day(req1, calendar=calendar)
    pointer_after_1 = store._read_pointer_raw(root)
    req2 = build_request(root, cfg, base)
    r2 = run.run_market_day(req2, calendar=calendar)
    pointer_after_2 = store._read_pointer_raw(root)
    return ScenarioResult(
        scenario="identical_rerun", track="store",
        observed={
            "firstStatus": r1.status,
            "rerunStatus": r2.status,
            "sameSnapshotId": r1.snapshotId == r2.snapshotId,
            "runsCount": _runs_count(root),
            "pointerUnchanged": pointer_after_1 == pointer_after_2,
        },
        artifacts=[req1, req2])


# ===========================================================================
# 시나리오 3 — conflicting rerun: 같은 시장일·다른 입력 → REJECTED(SAME_DATE_CONFLICT), 불변 보존.
# ===========================================================================
def sc_conflicting_rerun(root, cfg, base, calendar):
    req1 = build_request(root, cfg, base)
    r1 = run.run_market_day(req1, calendar=calendar)
    pointer_before = store._read_pointer_raw(root)

    conflicting_stocks = copy.deepcopy(base["stocks"])
    conflicting_stocks[0]["prices"][0] = conflicting_stocks[0]["prices"][0] + 5.0
    req2 = build_request(root, cfg, base, stocks=conflicting_stocks)
    r2 = run.run_market_day(req2, calendar=calendar)
    return ScenarioResult(
        scenario="conflicting_rerun", track="store",
        observed={
            "firstStatus": r1.status,
            "conflictStatus": r2.status,
            "conflictReasons": r2.reasons,
            "differentCandidate": r1.snapshotId != r2.snapshotId,
            "runsCount": _runs_count(root),
            "pointerUnchanged": store._read_pointer_raw(root) == pointer_before,
        },
        artifacts=[req1, req2])


# ===========================================================================
# 시나리오 4 — interrupted write: manifest/pointer 전 중단 → REJECTED, 승인 pointer 없음(원자성).
# ===========================================================================
def sc_interrupted_write(root, cfg, base, calendar):
    # 두 중단 지점을 각각 fresh 하위 루트에서 관측한다(부분 실패 = 승인 pointer 무변경).
    observed = {}
    artifacts = []
    for fault in ("interrupt_before_manifest", "interrupt_before_pointer"):
        sub = os.path.join(root, fault)
        os.makedirs(sub, exist_ok=True)
        req = build_request(sub, cfg, base)
        artifacts.append(req)
        res = run.run_market_day(req, calendar=calendar, faults={fault})
        rc = store.read_current(sub)
        observed[fault] = {
            "status": res.status,
            "reasons": res.reasons,
            "readStatus": rc.status,          # 두 경우 모두 UNAVAILABLE(승인 pointer 없음)
            "runsCount": _runs_count(sub),    # before_manifest=0, before_pointer=1(고아, 미승인)
        }
    return ScenarioResult(scenario="interrupted_write", track="store",
                          observed=observed, artifacts=artifacts)


# ===========================================================================
# 시나리오 5 — corrupt manifest: 승격 후 manifest 변조 → reader DEGRADED·게이트 run 실패(무결성).
# ===========================================================================
def _corrupt_manifest(root, snapshot_id):
    """승격된 run 의 manifest core 필드를 변조한다(manifestHash 재계산 없이) — 무결성 위반 주입."""
    mp = os.path.join(root, store.RUNS_SUBDIR, snapshot_id, store.ARTIFACT_MANIFEST)
    os.chmod(mp, stat.S_IWRITE)  # 승격 run 은 읽기전용 — 변조를 위해 쓰기 비트 복구.
    with open(mp, encoding="utf-8") as f:
        manifest = json.load(f)
    manifest["metricsVersion"] = "9.9.9"  # core 필드 변조 → manifest_hash_of != 저장된 manifestHash.
    with open(mp, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(manifest, ensure_ascii=False, sort_keys=True, indent=2) + "\n")


def sc_corrupt_manifest(root, cfg, base, calendar):
    req = build_request(root, cfg, base)
    r1 = run.run_market_day(req, calendar=calendar)
    _corrupt_manifest(root, r1.snapshotId)
    rc = store.read_current(root)
    gate = _store_gate_status(root, calendar)
    run_findings = gate.get("blockingReasons", [])
    # 게이트 run 단위 실패 사유(무결성 손상)를 직접 관측.
    records = rg.run_evidence_from_store(root)
    findings = [rg.evaluate_run(rec, calendar) for rec in records]
    fail_reasons = sorted({c for f in findings for c in f.failReasons})
    return ScenarioResult(
        scenario="corrupt_manifest", track="store",
        observed={
            "publishStatus": r1.status,
            "readStatus": rc.status,              # DEGRADED(부분 데이터 금지)
            "readReasons": rc.reasons,            # MANIFEST_HASH_MISMATCH 포함
            "gateStatus": gate["status"],
            "runFailReasons": fail_reasons,       # MANIFEST_COMPROMISED/NOT_QA_PASSED 포함
            "gateBlocking": run_findings,
        },
        artifacts=[req])


# ===========================================================================
# 시나리오 6 — source-date mismatch: 소스 기준일 pin 어긋남 → PREFLIGHT_FAILED(계산 이전 거절).
# ===========================================================================
def sc_source_date_mismatch(root, cfg, base, calendar):
    req = build_request(root, cfg, base)
    # 실제 prices 소스일(==marketDate)은 두되 pin(expected)의 prices 를 과거로 바꾼다 →
    # actual > expected 이며 미래는 아님 → SOURCE_DATE_MISMATCH(설계서 §preflight).
    req["expected"]["sourceDates"]["prices"] = "2026-07-14"
    res = run.run_market_day(req, calendar=calendar)
    pre = res.phases.get("preflight", {})
    return ScenarioResult(
        scenario="source_date_mismatch", track="store",
        observed={
            "status": res.status,
            "reasons": res.reasons,
            "preflightReasons": pre.get("reasons", []),
            "hasSourceMismatch": pf.SOURCE_DATE_MISMATCH in pre.get("reasons", []),
            "runsCount": _runs_count(root),
        },
        artifacts=[req])


# ===========================================================================
# 시나리오 9 — invalid output location: 출력 위치가 비공개 레이아웃 이탈 → PREFLIGHT_FAILED.
#   (번호는 작업 지시 목록 순서를 따른다 — store 트랙끼리 묶는다.)
# ===========================================================================
def sc_invalid_output_location(root, cfg, base, calendar):
    # 출력 위치를 저장소 runs/ 밖(루트 직속 non-runs 경로)으로 지정 → OUTPUT_ESCAPES_SHADOW_ROOT.
    bad_output = os.path.join(root, "not-runs", "leaked")
    req = build_request(root, cfg, base, output_location=bad_output)
    res = run.run_market_day(req, calendar=calendar)
    pre = res.phases.get("preflight", {})
    return ScenarioResult(
        scenario="invalid_output_location", track="store",
        observed={
            "status": res.status,
            "reasons": res.reasons,
            "preflightReasons": pre.get("reasons", []),
            "hasLayoutViolation": pf.OUTPUT_ESCAPES_SHADOW_ROOT in pre.get("reasons", []),
            "runsCount": _runs_count(root),
            "badOutputCreated": os.path.exists(bad_output),  # 거절 시 경로를 만들지 않는다.
        },
        artifacts=[req])


# ---------------------------------------------------------------------------
# gate 트랙 헬퍼 — Slice K 형식의 합성 run 기록을 만든다(마커 포함). 게이트는 마커 키를 무시한다.
# ---------------------------------------------------------------------------
_CLEAN_FACTOR_POPULATIONS = {
    "momentum": {"count": 138, "hash": "mom-h"},
    "activity": {"count": 138, "hash": "act-h"},
    "value": {"count": 137, "hash": "val-h"},
    "riskAdjusted": {"count": 138, "hash": "risk-h"},
}


def _gate_record(market_date, *, unresolved_p0=0, eligibility=None, provenance_root=None):
    """Slice K rollout_gate 가 소비하는 정규화 run 기록 하나(합성·마커 포함)."""
    rec = {
        "marketDate": market_date,
        "snapshotId": f"{market_date}__r1",
        "manifestRunState": store.RUN_STATE_QA_PASSED,
        "manifestIntegrity": {"ok": True, "reasons": []},
        "engineVersion": ENGINE_VERSION,
        "configHash": "syn-cfg",
        "inputManifestHash": f"syn-in-{market_date}",
        "sourceDates": {"prices": market_date, "volumes": market_date, "fundamentals": None},
        "factorPopulations": copy.deepcopy(_CLEAN_FACTOR_POPULATIONS),
        "rankingPopulation": {"count": 137, "hash": "rk"},
        "eligibilityReasonCounts": dict(eligibility or {}),
        "universeSize": 138,
        "differential": {"available": True, "unresolvedP0": unresolved_p0},
        "provenanceRoot": provenance_root or f".metrics251-shadow/runs/{market_date}__r1",
    }
    return stamp_synthetic(rec)


def _gate_report(records, calendar):
    return rg.evaluate_rollout_gate(records, calendar, generated_from="fixture")


# ===========================================================================
# 시나리오 7 — unknown exclusion reason: 알 수 없는 제외 사유 키 → run UNKNOWN_EXCLUSION_REASON.
# ===========================================================================
def sc_unknown_exclusion_reason(calendar):
    rec = _gate_record("2026-07-06", eligibility={"momentum.WEIRD_UNKNOWN_CODE": 1})
    finding = rg.evaluate_run(rec, calendar)
    return ScenarioResult(
        scenario="unknown_exclusion_reason", track="gate",
        observed={
            "passesRunChecks": finding.passesRunChecks,
            "failReasons": finding.failReasons,
            "hasUnknownReason": rg.FAIL_UNKNOWN_EXCLUSION_REASON in finding.failReasons,
            "unknownKeys": finding.unknownExclusionReasons,
        },
        artifacts=[rec])


# ===========================================================================
# 시나리오 8 — unresolved P0: 미해결 P0 차등 → run UNRESOLVED_P0.
# ===========================================================================
def sc_unresolved_p0(calendar):
    rec = _gate_record("2026-07-06", unresolved_p0=1)
    finding = rg.evaluate_run(rec, calendar)
    return ScenarioResult(
        scenario="unresolved_p0", track="gate",
        observed={
            "passesRunChecks": finding.passesRunChecks,
            "failReasons": finding.failReasons,
            "hasUnresolvedP0": rg.FAIL_UNRESOLVED_P0 in finding.failReasons,
            "unresolvedP0": finding.unresolvedP0,
        },
        artifacts=[rec])


# ===========================================================================
# 시나리오 10 — missing-day continuity reset: 거래일 누락 → 후행 연속 초기화, NOT_MET.
# ===========================================================================
def sc_missing_day_continuity_reset(calendar):
    # 07-08 거래일을 건너뛴다 → 07-09 에서 연속성 끊김(후행 streak = 07-09,07-10 = 2).
    dates = ["2026-07-03", "2026-07-06", "2026-07-07", "2026-07-09", "2026-07-10"]
    records = [_gate_record(d) for d in dates]
    report = _gate_report(records, calendar)
    gate = report["gate"]
    return ScenarioResult(
        scenario="missing_day_continuity_reset", track="gate",
        observed={
            "status": gate["status"],
            "rolloutCandidate": gate["rolloutCandidate"],
            "actualRuns": gate["actualRuns"],
            "trailing": gate["trailingConsecutivePassingRuns"],
            "continuityBroken": rg.BLOCK_CONTINUITY_BROKEN in gate["blockingReasons"],
            "gaps": report["continuity"]["gaps"],
        },
        artifacts=records)


# ===========================================================================
# 시나리오 11 — five consecutive passing: 5개 연속 통과 fixture 거래일 → MET(합성 fixture 위에서만).
#   안전 명제: 이 MET 은 합성 fixture 이므로 genuine-run 게이트가 각 기록을 거부한다(세탁 불가).
# ===========================================================================
def sc_five_consecutive_passing(calendar):
    dates = ["2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10"]
    records = [_gate_record(d) for d in dates]
    report = _gate_report(records, calendar)
    gate = report["gate"]
    wz = gate["windowZeroConditions"]
    return ScenarioResult(
        scenario="five_consecutive_passing", track="gate",
        observed={
            "status": gate["status"],
            "rolloutCandidate": gate["rolloutCandidate"],
            "actualRuns": gate["actualRuns"],
            "trailing": gate["trailingConsecutivePassingRuns"],
            "windowDates": gate["windowDates"],
            "windowFourZero": wz,
            "fourZeroAllZero": all(v == 0 for v in wz.values()),
        },
        artifacts=records)


# ---------------------------------------------------------------------------
# 유한한 fault matrix — 11 시나리오를 순서대로 실행한다. store 트랙은 호출자가 공급한 fresh 루트.
# ---------------------------------------------------------------------------
STORE_SCENARIOS = (
    ("clean_first_run", sc_clean_first_run),
    ("identical_rerun", sc_identical_rerun),
    ("conflicting_rerun", sc_conflicting_rerun),
    ("interrupted_write", sc_interrupted_write),
    ("corrupt_manifest", sc_corrupt_manifest),
    ("source_date_mismatch", sc_source_date_mismatch),
    ("invalid_output_location", sc_invalid_output_location),
)

GATE_SCENARIOS = (
    ("unknown_exclusion_reason", sc_unknown_exclusion_reason),
    ("unresolved_p0", sc_unresolved_p0),
    ("missing_day_continuity_reset", sc_missing_day_continuity_reset),
    ("five_consecutive_passing", sc_five_consecutive_passing),
)


def run_matrix(root_factory, *, calendar=None, config=None, base=None):
    """유한한 end-to-end fault matrix 를 실행한다. (results, artifacts).

    root_factory(): store 트랙 시나리오마다 fresh 비공개 임시 루트를 돌려주는 callable(호출자 소유·정리).
    calendar/config/base: 미지정이면 fixture 에서 로드한다(결정적).
    """
    calendar = calendar if calendar is not None else load_calendar()
    config = config if config is not None else load_config()
    base = base if base is not None else load_base_request()

    results = []
    for _name, fn in STORE_SCENARIOS:
        root = root_factory()
        results.append(fn(root, config, base, calendar))
    for _name, fn in GATE_SCENARIOS:
        results.append(fn(calendar))

    all_artifacts = [a for r in results for a in r.artifacts]
    return results, all_artifacts


def matrix_hash(results):
    """관측 사실의 결정적 canonical 해시(재실행 동일성 증거 — 경로/임시명 미포함)."""
    payload = [{"scenario": r.scenario, "track": r.track, "observed": r.observed} for r in results]
    return hashlib.sha256(canonical_bytes(payload)).hexdigest()


# ---------------------------------------------------------------------------
# CLI — 임시 비공개 루트에서 matrix 를 실행하고 결정적 요약을 출력한다(파일 미기록·읽기 전용 지향).
# ---------------------------------------------------------------------------
def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Metrics 2.5.1 end-to-end fault-matrix 하네스 (Slice Q, deterministic). "
                    "모든 fixture 산출물은 합성-테스트 마커를 실으며 genuine-run 게이트가 거부한다.")
    ap.add_argument("--json", action="store_true", help="결정적 JSON 요약을 stdout 으로")
    args = ap.parse_args(argv)

    import tempfile  # CLI 편의(임시 루트) — 순수 계약 함수는 root 를 인자로만 받는다.
    created = []

    def factory():
        d = tempfile.mkdtemp(prefix="m251_e2e_synthetic_")
        created.append(d)
        return d

    try:
        results, artifacts = run_matrix(factory)
        # 안전 명제 확인(요약용): 모든 fixture 산출물이 마커를 싣고 genuine-run 게이트가 거부한다.
        all_marked = all(carries_synthetic_marker(a) for a in artifacts)
        all_rejected = all(not genuine_run_gate(a)[0] for a in artifacts)
        summary = {
            "meta": {
                "reportKind": "metrics-2.5.1-e2e-fault-matrix",
                "engineVersion": ENGINE_VERSION,
                "readOnly": True,
                "computesPublicScore": False,
                "syntheticMarker": SYNTHETIC_MARKER,
                "note": "합성 fault matrix — 공개 Metrics 2.4 정본 불변. 모든 산출물은 마커를 실으며 "
                        "genuine-run 게이트가 거부한다(§M251-D02: 5거래일 조작 금지·§7 Gate 6).",
            },
            "scenarios": [r.to_dict() for r in results],
            "artifactCount": len(artifacts),
            "allArtifactsMarked": all_marked,
            "allArtifactsRejectedByGenuineGate": all_rejected,
            "matrixHash": matrix_hash(results),
        }
        if args.json:
            print(json.dumps(summary, ensure_ascii=False, sort_keys=True, indent=2, default=str))
        else:
            print(f"metrics251_e2e_matrix: {len(results)} 시나리오 · 산출물 {len(artifacts)}개 · "
                  f"모두 마커={all_marked} · genuine-run 거부={all_rejected}")
            for r in results:
                print(f"  - [{r.track}] {r.scenario}")
            print(f"  matrixHash {matrix_hash(results)[:12]}…")
        return 0 if (all_marked and all_rejected) else 2
    finally:
        for d in created:
            store.rmtree_force(d)


if __name__ == "__main__":
    raise SystemExit(main())
