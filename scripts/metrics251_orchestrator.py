#!/usr/bin/env python3
# ORNScore 장마감 운영 자동화 배치 — Slice C: 유한·멱등 단일 시장일 비공개 shadow 오케스트레이터.
#   (governing plan: docs/ornscore-market-close-automation-2026-07-19.md · Metrics 2.5.1 설계서
#    docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D02/D07/D10 · 운영 런북
#    docs/metrics-2.5.1-operations-runbook.md §6.)
#
# 목적:
#   * Slice B 실입력 어댑터(조립) → 운영자 READY 판정 → 원자적·멱등 run(PUBLISHED/NOOP) →
#     append-only 증거 원장(APPENDED/DUPLICATE) → 5일 AND 롤아웃 게이트(PENDING/MET) 를,
#     **정확히 하나의 시장일**에 대해 유한하게 **조립(compose)** 해 단일 명령으로 돌린다.
#   * 새 산식/게이트/저장 로직을 만들지 않는다 — 기존 계약 층(Slice B/M/N/O/K)만 순서대로 호출한다.
#   * **scheduled 모드**: 시장일을 운영자가 지정하지 않고, 어댑터가 증명한 **가장 최근의 완전한 공통
#     거래일**(모든 가격 시계열의 공통 종료일)만 고른다. 첫 비공개 effectiveDate 는 활성일(activation)
#     **이후** 처음으로 모든 genuine-input 게이트를 통과하는 거래일이다.
#   * 세 갈래 결정(PASS/WAIT/FAIL):
#       PASS — 이 시장일이 비공개 shadow 에 정확히 반영됨(이번 run 으로 PUBLISHED, 또는 이미 바이트
#              동일하게 기록됨=NOOP). 게이트 상태(PENDING/MET)는 보고만 한다.
#       WAIT — 깨진 것은 없으나 지금은 run 이 나올 수 없다: 주말/공휴일, 게시 유예(입력 미확정),
#              현재 입력 결측, 활성일 이전, 겹침 lock 보유. **run 을 조작하지 않고** 나중에 재시도.
#       FAIL — 멈춰야 하는 실제 결함: 충돌(같은 날 다른 입력), 부분 run, QA 실패, 합성 마커,
#              공개 경로 누출, config 결측/불일치, 해시 불일치, 내부 오류.
#     fail-closed: 어떤 hard 결함이든 어떤 WAIT 창보다 우선한다(§Slice A 규칙과 동일).
#
# 반드시 지키는 규칙(설계서 §4 · §M251-D02/D10 · 작업 지시):
#   * 벽시계 시각 금지(datetime.now()/time.time()/date.today())·난수 금지·네트워크 금지 — 출력은
#     입력(로컬 파일)·저장소 상태에서만 결정적으로 파생된다.
#   * 모든 산출물(보고서·lock·입력·run·pointer·원장·게이트 문서)은 **오직 `.metrics251-shadow` 아래**
#     에만 둔다. scheduled 실행은 추적(tracked) 파일을 절대 더럽히지 않는다(게이트 문서도 shadow 로).
#   * public/ 데이터·Metrics 2.4 런타임을 읽거나 쓰지 않는다. 저장소 루트가 public/ 밑이면 즉시 FAIL.
#   * **게이트 MET 은 절대 공개 승격/외부 액션을 촉발하지 않는다** — 상태를 보고만 한다(§7 Gate 6).
#   * 결측을 발명/forward-fill/추정으로 채우지 않는다 — 결측은 사유 코드 + 무-run.
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from dataclasses import dataclass, field
from typing import Optional

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import metrics251_market_input as mi         # noqa: E402  (Slice B 실입력 어댑터 — 단일 출처)
import metrics251_operator as operator       # noqa: E402  (Slice P 운영자 READY 판정 — 읽기 전용)
import metrics251_run as run                 # noqa: E402  (Slice N 원자적·멱등 run — 단일 출처)
import metrics251_ledger as ledger           # noqa: E402  (Slice O append-only 원장 — 단일 출처)
import metrics251_rollout_gate as rg         # noqa: E402  (Slice K 5일 AND 게이트 — 단일 출처)
import metrics251_snapshot_store as store    # noqa: E402  (Slice F 비공개 루트·원자적 쓰기)
from metrics251_compare import FixtureTradingCalendar  # noqa: E402  (Slice G 거래일 캘린더)
from metrics251_config import canonical_bytes          # noqa: E402  (결정성 canonical 해시)

ENGINE_VERSION = mi.ENGINE_VERSION
EXPECTED_UNIVERSE = mi.EXPECTED_UNIVERSE
DEFAULT_SHADOW_ROOT = store.DEFAULT_SHADOW_ROOT

# ---------------------------------------------------------------------------
# 비공개 shadow 하위 레이아웃(전부 .metrics251-shadow 아래 — .gitignore 제외).
# ---------------------------------------------------------------------------
LOCKS_SUBDIR = "locks"
REPORTS_SUBDIR = "reports"
LOCK_NAME = "orchestrator.lock"
REPORT_LATEST = "orchestrator-latest.json"
GATE_JSON_NAME = "rollout-gate.json"       # 게이트 문서도 shadow 로(추적 docs/ 오염 금지)
GATE_MD_NAME = "rollout-gate.md"

# ---------------------------------------------------------------------------
# 세 갈래 결정.
# ---------------------------------------------------------------------------
VERDICT_PASS = "PASS"
VERDICT_WAIT = "WAIT"
VERDICT_FAIL = "FAIL"

# 오케스트레이터 수준 사유 코드(어댑터/운영자/run/원장 사유와 구분되는 상위 판정).
WAIT_LOCK_HELD = "LOCK_HELD"                    # 겹침 lock 보유 — 다른 run 진행 중(나중에 재시도)
WAIT_NON_TRADING_DAY = "NON_TRADING_DAY"        # 주말/공휴일 — 오늘 게시 예정 없음
WAIT_PUBLICATION_GRACE = "PUBLICATION_GRACE"    # 입력 미확정(종료일 갈라짐/미해결) — 게시 유예
WAIT_MISSING_CURRENT_INPUT = "MISSING_CURRENT_INPUT"  # 현재 입력 결측(envelope/시계열/재무 미도착)
WAIT_PRE_ACTIVATION = "PRE_ACTIVATION"          # 증명된 시장일이 활성일 이전 — 아직 effectiveDate 없음
WAIT_ALREADY_WAITING = "INPUT_NOT_FRESH"        # explicit 모드: envelope 가 요청일보다 오래됨

PASS_PUBLISHED = "PUBLISHED"                    # 이번 run 으로 새 시장일 스냅샷 승격
PASS_ALREADY_RECORDED = "ALREADY_RECORDED"      # 바이트 동일 스냅샷이 이미 기록됨(멱등, 무-run)

FAIL_SYNTHETIC_MARKER = "SYNTHETIC_MARKER"      # 합성/테스트 마커 — 실입력 아님
FAIL_PUBLIC_PATH_LEAK = "PUBLIC_PATH_LEAK"      # 산출물이 public/ 밑 또는 inputs/ 밖
FAIL_CONFLICT = "SAME_DATE_CONFLICT"            # 같은 시장일에 다른(변경된) 입력
FAIL_PARTIAL_RUN = "PARTIAL_RUN"                # 미봉인/손상 run 흔적
FAIL_QA_FAILED = "QA_FAILED"                    # 내재적 자격/품질 QA 게이트 실패
FAIL_PREFLIGHT = "PREFLIGHT_FAILED"             # preflight 차단(계산 이전)
FAIL_STALE_SOURCE = "STALE_SOURCE"              # 소스 기준일/해시 pin 불일치(어댑터 통과 후 방어적)
FAIL_CONFIG = "CONFIG_INVALID"                  # config 결측/엔진 불일치
FAIL_HASH_MISMATCH = "HASH_MISMATCH"            # 어댑터 pin 과 run 파생 pin 불일치
FAIL_LEDGER_CONFLICT = "LEDGER_CONFLICT"        # 원장 항목 충돌(같은 날 내용 상이)
FAIL_REQUEST_STALE = "REQUEST_STALE"            # explicit 모드: envelope 가 요청일보다 최신(요청 낡음)
FAIL_MARKET_DATE_MISMATCH = "MARKET_DATE_MISMATCH"  # explicit 모드: 증명일 != 요청일(불명확)
FAIL_PUBLISH = "PUBLISH_FAILED"                 # store 원자적 승격 실패(중단/손상)
FAIL_INTERNAL = "INTERNAL_ERROR"                # 예상 못한 예외 — fail closed

# ---------------------------------------------------------------------------
# 어댑터 사유 → WAIT vs FAIL 버킷.
#   기본은 **fail-closed**(FAIL). WAIT 는 명시 allowlist 로만 — "지금은 게시가 나올 수 없는 정당한
#   상태"(주말/공휴일, 입력 미확정/미도착, 소스일 stale)만 담는다. 어떤 hard 결함(합성/누출/malformed/
#   유니버스 드리프트/config)도 WAIT 로 새지 않도록 명시 목록 밖은 전부 FAIL.
# ---------------------------------------------------------------------------
ADAPTER_WAIT_REASONS = frozenset({
    mi.ENVELOPE_MISSING,             # envelope 미도착 → 현재 입력 결측
    mi.PRICE_SERIES_MISSING,         # 일부 시계열 미도착 → 현재 입력 결측
    mi.INSUFFICIENT_PRICE_HISTORY,   # 이력 미충족(데이터 축적 중)
    mi.INSUFFICIENT_VOLUME_HISTORY,
    mi.FUNDAMENTAL_MISSING,          # 필수 PER/PBR 미증명(현 공개 envelope 실제 상태 — Slice B.4)
    mi.MARKET_DATE_UNRESOLVED,       # 시장일 미해결(입력 미확정)
    mi.MARKET_DATE_AMBIGUOUS,        # 종료일 갈라짐(게시 유예 — 데이터 landing 중)
    mi.MARKET_DATE_NOT_TRADING_DAY,  # 주말/공휴일
    mi.SOURCE_DATE_MISSING,          # asOfBusinessDate 미도착
    mi.SOURCE_DATE_STALE,            # 재무 소스일이 marketDate 보다 이전(아직 신선하지 않음)
    mi.SOURCE_DATE_MISMATCH,         # (stale 과 동반) 재무-시장일 불일치 — 미신선
})
# 나머지 어댑터 사유는 전부 fail-closed.
ADAPTER_FAIL_REASONS = frozenset(mi.ALL_REASONS) - ADAPTER_WAIT_REASONS

# WAIT 사유 → 오케스트레이터 WAIT 코드.
_ADAPTER_WAIT_CODE = {
    mi.ENVELOPE_MISSING: WAIT_MISSING_CURRENT_INPUT,
    mi.PRICE_SERIES_MISSING: WAIT_MISSING_CURRENT_INPUT,
    mi.INSUFFICIENT_PRICE_HISTORY: WAIT_MISSING_CURRENT_INPUT,
    mi.INSUFFICIENT_VOLUME_HISTORY: WAIT_MISSING_CURRENT_INPUT,
    mi.FUNDAMENTAL_MISSING: WAIT_MISSING_CURRENT_INPUT,
    mi.SOURCE_DATE_MISSING: WAIT_MISSING_CURRENT_INPUT,
    mi.MARKET_DATE_UNRESOLVED: WAIT_PUBLICATION_GRACE,
    mi.MARKET_DATE_AMBIGUOUS: WAIT_PUBLICATION_GRACE,
    mi.SOURCE_DATE_STALE: WAIT_PUBLICATION_GRACE,
    mi.SOURCE_DATE_MISMATCH: WAIT_PUBLICATION_GRACE,
    mi.MARKET_DATE_NOT_TRADING_DAY: WAIT_NON_TRADING_DAY,
}


@dataclass
class OrchestratorResult:
    verdict: str                                  # PASS | WAIT | FAIL
    reasons: list = field(default_factory=list)   # 정렬된 안정 상위 사유
    marketDate: Optional[str] = None
    mode: str = "scheduled"
    phases: dict = field(default_factory=dict)    # 층별 진단(어댑터/운영자/run/원장/게이트)
    gate: Optional[dict] = None                   # 게이트 요약(status/rolloutCandidate/…)
    writtenPaths: list = field(default_factory=list)
    detail: list = field(default_factory=list)

    def to_dict(self):
        return {
            "schema": "metrics251.orchestrator-report.v1",
            "verdict": self.verdict,
            "reasons": self.reasons,
            "marketDate": self.marketDate,
            "mode": self.mode,
            "engineVersion": ENGINE_VERSION,
            "universeExpected": EXPECTED_UNIVERSE,
            "phases": self.phases,
            "gate": self.gate,
            "writtenPaths": [os.path.relpath(p, ROOT) for p in self.writtenPaths],
            "detail": self.detail,
            # 안전 명제(항상 참): 게이트 MET 여부와 무관하게 공개 승격/외부 액션은 없다(§7 Gate 6).
            "publicPromotionTriggered": False,
            "externalActionTaken": False,
            "readOnlyPublicCanon": True,
            "note": "비공개 shadow 오케스트레이터(§Slice C). 공개 Metrics 2.4 정본은 불변이며 게이트 "
                    "MET 도 공개 전환을 촉발하지 않는다(Gate 6 소유자 승인은 별도).",
        }

    @property
    def exit_code(self):
        # PASS/WAIT = 0(정상 hold 포함), FAIL = 2(운영 중단 필요).
        return 0 if self.verdict in (VERDICT_PASS, VERDICT_WAIT) else 2


# ===========================================================================
# 겹침(overlap) lock — O_EXCL 원자적 생성. 보유 중이면 획득 실패(WAIT).
#   내용은 결정적(marketDate + 입력해시) — 벽시계/PID 를 쓰지 않는다.
# ===========================================================================
def acquire_lock(root, payload):
    """<root>/locks/orchestrator.lock 를 원자적으로 생성한다. (fd|None, path). 이미 있으면 (None, path)."""
    locks_dir = os.path.join(root, LOCKS_SUBDIR)
    os.makedirs(locks_dir, exist_ok=True)
    path = os.path.join(locks_dir, LOCK_NAME)
    try:
        fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        return None, path
    try:
        os.write(fd, (json.dumps(payload, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf-8"))
    finally:
        os.close(fd)
    return path, path


def release_lock(path):
    """lock 파일을 제거한다(없으면 무시)."""
    try:
        os.remove(path)
    except OSError:
        pass


# ===========================================================================
# 어댑터 결과 → WAIT/FAIL 판정(fail-closed 우선).
# ===========================================================================
# hard 어댑터 사유 → 오케스트레이터 상위 카테고리(명명된 것만 remap, 나머지는 원 사유 코드 유지).
_ADAPTER_FAIL_CODE = {
    mi.SYNTHETIC_MARKER_PRESENT: FAIL_SYNTHETIC_MARKER,
    mi.OUTPUT_NOT_PRIVATE: FAIL_PUBLIC_PATH_LEAK,
    mi.OUTPUT_NOT_UNDER_INPUTS: FAIL_PUBLIC_PATH_LEAK,
    mi.CONFIG_MISSING: FAIL_CONFIG,
    mi.CONFIG_ENGINE_MISMATCH: FAIL_CONFIG,
    mi.INTERNAL_ERROR: FAIL_INTERNAL,
}


def classify_adapter_failure(reasons):
    """어댑터 실패 사유 집합을 (verdict, codes) 로 분류. FAIL 이 WAIT 보다 우선한다."""
    rs = set(reasons or ())
    fail_hits = sorted(rs & ADAPTER_FAIL_REASONS)
    if fail_hits:
        # 명명된 상위 카테고리로 remap 하되(합성/누출/config/내부), 나머지 서술적 코드는 그대로 노출.
        codes = sorted({_ADAPTER_FAIL_CODE.get(r, r) for r in fail_hits})
        return VERDICT_FAIL, codes
    wait_hits = sorted(rs & ADAPTER_WAIT_REASONS)
    codes = sorted({_ADAPTER_WAIT_CODE[r] for r in wait_hits}) or [WAIT_MISSING_CURRENT_INPUT]
    return VERDICT_WAIT, codes


# ===========================================================================
# 운영자 상태 → 오케스트레이터 판정.
# ===========================================================================
_OPERATOR_FAIL_MAP = {
    operator.STATE_CONFLICT: FAIL_CONFLICT,
    operator.STATE_PARTIAL_RUN: FAIL_PARTIAL_RUN,
    operator.STATE_QA_FAILED: FAIL_QA_FAILED,
    operator.STATE_MISSING_INPUT: FAIL_PREFLIGHT,   # 어댑터 통과 후 preflight 결측 = 방어적 FAIL
    operator.STATE_STALE_SOURCE: FAIL_STALE_SOURCE,
}


# ===========================================================================
# run 결과 → 오케스트레이터 판정.
# ===========================================================================
_RUN_REJECT_MAP = {
    run.SAME_DATE_CONFLICT: FAIL_CONFLICT,
    run.PUBLISH_FAILED: FAIL_PUBLISH,
    run.ELIGIBILITY_FAILED: FAIL_QA_FAILED,
    run.PREFLIGHT_FAILED: FAIL_PREFLIGHT,
    run.ENGINE_NULL: FAIL_PREFLIGHT,
    run.INTERNAL_ERROR: FAIL_INTERNAL,
}


# ===========================================================================
# 조립 오케스트레이터(순수 판정 + 저장소 부작용은 shadow 로 한정).
# ===========================================================================
def orchestrate(*, envelope, calendar, calendar_doc, cfg, shadow_root, mode="scheduled",
                market_date=None, activation_date=None, write_reports=True):
    """정확히 하나의 시장일을 조립 실행한다. OrchestratorResult(결정적·fail-closed).

    envelope/calendar/cfg: Slice B 어댑터가 소비하는 입력. shadow_root: 비공개 루트(public/ 밑이면 FAIL).
    mode: "scheduled"(어댑터가 증명한 최신 공통 거래일만) | "explicit"(--market-date 지정).
    activation_date: 이 날짜 **이후** 거래일만 effectiveDate 자격(첫 비공개 effectiveDate 규칙).
    """
    phases = {}
    detail = []
    written = []
    lock_path = None

    # ---- 0) 비공개 루트 가드(public/ 밑이면 즉시 FAIL — 아무것도 쓰지 않는다). ----
    try:
        root = store.assert_private_root(shadow_root)
    except ValueError as e:
        return OrchestratorResult(verdict=VERDICT_FAIL, reasons=[FAIL_PUBLIC_PATH_LEAK],
                                  mode=mode, detail=[str(e)])
    inputs_dir, layout_reasons = mi.resolve_inputs_dir(root)
    if layout_reasons:
        return OrchestratorResult(verdict=VERDICT_FAIL, reasons=[FAIL_PUBLIC_PATH_LEAK],
                                  mode=mode, phases={"outputLayout": layout_reasons},
                                  detail=["inputs/ 레이아웃 위반: " + ", ".join(layout_reasons)])

    try:
        # ---- 1) 어댑터 조립(판정만 — 이 단계에서 marketDate 를 증명). ----
        assembly = mi.assemble(envelope, calendar, cfg, source_mode=mode)
        phases["adapter"] = {"ok": assembly.ok, "reasons": assembly.reasons,
                             "marketDate": assembly.marketDate, "checks": assembly.checks}
        proven_date = assembly.marketDate

        if not assembly.ok:
            verdict, codes = classify_adapter_failure(assembly.reasons)
            return OrchestratorResult(verdict=verdict, reasons=codes, marketDate=proven_date,
                                      mode=mode, phases=phases, detail=list(assembly.detail))

        # ---- 2) 모드별 시장일 확정 + 활성일(effectiveDate) 게이트. ----
        if mode == "explicit":
            if not market_date:
                return OrchestratorResult(verdict=VERDICT_FAIL, reasons=[FAIL_INTERNAL],
                                          mode=mode, phases=phases,
                                          detail=["explicit 모드는 market_date 가 필요합니다."])
            if proven_date < market_date:
                # envelope 가 요청일보다 오래됨 → 아직 신선하지 않음(hold).
                return OrchestratorResult(verdict=VERDICT_WAIT, reasons=[WAIT_ALREADY_WAITING],
                                          marketDate=proven_date, mode=mode, phases=phases,
                                          detail=[f"proven {proven_date} < requested {market_date}"])
            if proven_date > market_date:
                # envelope 가 요청일보다 최신 → 요청이 낡음(불명확) → fail-closed.
                return OrchestratorResult(verdict=VERDICT_FAIL, reasons=[FAIL_REQUEST_STALE],
                                          marketDate=proven_date, mode=mode, phases=phases,
                                          detail=[f"proven {proven_date} > requested {market_date}"])
        else:
            # scheduled: 어댑터가 증명한 최신 공통 거래일만 고른다(운영자 지정 금지).
            market_date = proven_date

        # 활성일 게이트: 첫 비공개 effectiveDate 는 activation **이후** 거래일이어야 한다.
        if activation_date and market_date <= activation_date:
            return OrchestratorResult(verdict=VERDICT_WAIT, reasons=[WAIT_PRE_ACTIVATION],
                                      marketDate=market_date, mode=mode, phases=phases,
                                      detail=[f"marketDate {market_date} <= activation {activation_date}"])

        # ---- 3) 겹침 lock 획득(shadow/locks). 보유 중이면 WAIT. ----
        lock_payload = {"marketDate": market_date, "assemblyHash": assembly.assemblyHash,
                        "configHash": assembly.expected.get("configHash"),
                        "inputManifestHash": assembly.expected.get("inputManifestHash")}
        lock_path, _p = acquire_lock(root, lock_payload)
        if lock_path is None:
            return OrchestratorResult(verdict=VERDICT_WAIT, reasons=[WAIT_LOCK_HELD],
                                      marketDate=market_date, mode=mode, phases=phases,
                                      detail=["겹침 lock 보유 중 — 다른 오케스트레이션 진행 중"])

        # ---- 4) 어댑터 산출물을 inputs/ 에 원자적으로 기록(shadow 한정). ----
        wrote = mi.assemble_and_write(envelope, calendar, cfg, root, calendar_doc, source_mode=mode)
        if not wrote.ok:
            # 방어적: 위 assemble() 는 통과했는데 write 경로에서 실패 → 레이아웃/누출 계열 → FAIL.
            verdict, codes = classify_adapter_failure(wrote.reasons)
            if mi.OUTPUT_NOT_PRIVATE in wrote.reasons or mi.OUTPUT_NOT_UNDER_INPUTS in wrote.reasons:
                verdict, codes = VERDICT_FAIL, [FAIL_PUBLIC_PATH_LEAK]
            return OrchestratorResult(verdict=verdict, reasons=codes, marketDate=market_date,
                                      mode=mode, phases=phases, detail=list(wrote.detail))
        written.extend(wrote.writtenPaths)
        phases["inputs"] = {"written": [os.path.relpath(p, ROOT) for p in wrote.writtenPaths],
                            "assemblyHash": wrote.assemblyHash}

        # ---- 5) run 요청 조립(어댑터가 pin 한 exact expected 를 그대로 소비 — 해시 재발명 없음). ----
        run_request = {
            "marketDate": market_date,
            "sourceDates": wrote.request["sourceDates"],
            "stocks": wrote.request["stocks"],
            "expected": wrote.request["expected"],
            "config": cfg,
            "shadowRoot": root,
            "outputLocation": os.path.join(root, store.RUNS_SUBDIR, "run"),
        }

        # 해시 일관성 교차검증: 어댑터 pin == run 파생 pin 이어야 한다(exact input/config hashes).
        run_expected = run.derive_expected(cfg, market_date, run_request["sourceDates"],
                                           run_request["stocks"])
        if (run_expected.get("configHash") != wrote.request["expected"].get("configHash")
                or run_expected.get("inputManifestHash") != wrote.request["expected"].get("inputManifestHash")):
            return OrchestratorResult(verdict=VERDICT_FAIL, reasons=[FAIL_HASH_MISMATCH],
                                      marketDate=market_date, mode=mode, phases=phases,
                                      writtenPaths=written,
                                      detail=["어댑터 pin 과 run 파생 pin 불일치"])

        # ---- 6) 운영자 READY 판정(읽기 전용) — run 전에 안전 확인. ----
        day = operator.classify_target_day(run_request, calendar=calendar, root=root)
        phases["operator"] = {"state": day.state, "reasons": day.reasons}
        if day.state == operator.STATE_ALREADY_RECORDED:
            # 이 날은 이미 바이트 동일하게 기록됨(멱등) → run 을 조작하지 않는다. 게이트만 보고.
            gate = _gate_summary(root, calendar, write_reports)
            return OrchestratorResult(verdict=VERDICT_PASS, reasons=[PASS_ALREADY_RECORDED],
                                      marketDate=market_date, mode=mode, phases=phases,
                                      gate=gate, writtenPaths=written)
        if day.state in _OPERATOR_FAIL_MAP:
            return OrchestratorResult(verdict=VERDICT_FAIL, reasons=[_OPERATOR_FAIL_MAP[day.state]],
                                      marketDate=market_date, mode=mode, phases=phases,
                                      writtenPaths=written, detail=list(day.reasons))
        # 이 지점에서 day.state 는 READY 여야 한다.
        if day.state != operator.STATE_READY:
            return OrchestratorResult(verdict=VERDICT_FAIL, reasons=[FAIL_INTERNAL],
                                      marketDate=market_date, mode=mode, phases=phases,
                                      writtenPaths=written,
                                      detail=[f"예상 못한 운영자 상태 {day.state}"])

        # ---- 7) 원자적·멱등 run(유일한 저장소 쓰기 — pointer 교체는 store 마지막 단계에서만). ----
        run_res = run.run_market_day(run_request, calendar=calendar)
        phases["run"] = {"status": run_res.status, "reasons": run_res.reasons,
                         "snapshotId": run_res.snapshotId}
        if run_res.status == run.RUN_REJECTED:
            code = FAIL_INTERNAL
            for r in run_res.reasons:
                if r in _RUN_REJECT_MAP:
                    code = _RUN_REJECT_MAP[r]
                    break
            return OrchestratorResult(verdict=VERDICT_FAIL, reasons=[code], marketDate=market_date,
                                      mode=mode, phases=phases, writtenPaths=written,
                                      detail=list(run_res.reasons))
        run_pass_code = PASS_PUBLISHED if run_res.status == run.RUN_PUBLISHED else PASS_ALREADY_RECORDED

        # ---- 8) append-only 증거 원장(shadow) + 게이트 문서 재생성(shadow 로 — 추적 docs/ 오염 금지). ----
        gate_json_out = os.path.join(root, REPORTS_SUBDIR, GATE_JSON_NAME)
        gate_md_out = os.path.join(root, REPORTS_SUBDIR, GATE_MD_NAME)
        os.makedirs(os.path.join(root, REPORTS_SUBDIR), exist_ok=True)
        _led, led_summary = ledger.refresh_from_store(
            root, calendar=calendar, write=write_reports, refresh_gate=write_reports,
            gate_json_out=gate_json_out, gate_md_out=gate_md_out)
        append_report = led_summary["append"]
        phases["ledger"] = {"appended": append_report["appended"],
                            "duplicates": append_report["duplicates"],
                            "conflicts": append_report["conflicts"],
                            "acceptedRuns": led_summary["acceptedRuns"]}
        if append_report["conflicts"]:
            return OrchestratorResult(verdict=VERDICT_FAIL, reasons=[FAIL_LEDGER_CONFLICT],
                                      marketDate=market_date, mode=mode, phases=phases,
                                      writtenPaths=written,
                                      detail=[f"원장 충돌: {append_report['conflicts']}"])
        if write_reports:
            written.extend([gate_json_out, gate_md_out])

        # ---- 9) 5일 AND 게이트 판정(PENDING/MET) — 보고만. MET 도 공개 승격 없음(§7 Gate 6). ----
        gate = led_summary["gate"] or _gate_summary(root, calendar, False)
        phases["gate"] = {"status": gate["status"], "rolloutCandidate": gate["rolloutCandidate"],
                          "actualRuns": gate["actualRuns"],
                          "trailingConsecutivePassingRuns": gate["trailingConsecutivePassingRuns"]}

        # 공개 경로 누출 방어: 게이트가 어떤 run 에서든 누출을 감지하면 fail-closed.
        if gate.get("windowZeroConditions", {}).get("publicPathLeakage", 0):
            return OrchestratorResult(verdict=VERDICT_FAIL, reasons=[FAIL_PUBLIC_PATH_LEAK],
                                      marketDate=market_date, mode=mode, phases=phases,
                                      gate=gate, writtenPaths=written)

        return OrchestratorResult(verdict=VERDICT_PASS, reasons=[run_pass_code],
                                  marketDate=market_date, mode=mode, phases=phases,
                                  gate=gate, writtenPaths=written)
    except Exception as e:  # noqa: BLE001  (fail closed — 예상 못한 예외도 통과시키지 않는다)
        return OrchestratorResult(verdict=VERDICT_FAIL, reasons=[FAIL_INTERNAL],
                                  marketDate=(market_date or None), mode=mode, phases=phases,
                                  writtenPaths=written, detail=[repr(e)])
    finally:
        if lock_path is not None:
            release_lock(lock_path)


def _gate_summary(root, calendar, write_reports):
    """비공개 저장소에서 5일 AND 게이트 요약을 계산(읽기 전용·Slice K 재사용)."""
    try:
        runs = rg.run_evidence_from_store(root)
    except ValueError:
        return rg.evaluate_rollout_gate([], calendar, generated_from="shadow-store")["gate"]
    return rg.evaluate_rollout_gate(runs, calendar, generated_from="shadow-store")["gate"]


def report_hash(result):
    """오케스트레이터 보고서의 결정적 canonical 해시(재실행 동일성 증거)."""
    return hashlib.sha256(canonical_bytes(result.to_dict())).hexdigest()


def write_report(root, result):
    """최신 보고서를 shadow/reports/orchestrator-latest.json 에 원자적으로 기록한다(추적 파일 아님)."""
    reports_dir = os.path.join(root, REPORTS_SUBDIR)
    os.makedirs(reports_dir, exist_ok=True)
    path = os.path.join(reports_dir, REPORT_LATEST)
    payload = dict(result.to_dict(), reportHash=report_hash(result))
    store._atomic_write_bytes(path, (json.dumps(payload, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf-8"))
    return path


# ===========================================================================
# CLI.
# ===========================================================================
def _load_calendar_doc(path):
    if not path:
        return None, None
    with open(path, encoding="utf-8") as f:
        doc = json.load(f)
    return FixtureTradingCalendar.from_fixture(doc), doc


def render_console(result):
    emoji = {VERDICT_PASS: "✅", VERDICT_WAIT: "⏳", VERDICT_FAIL: "❌"}.get(result.verdict, "•")
    lines = [f"metrics251_orchestrator: mode={result.mode} · marketDate={result.marketDate or '-'} · "
             f"{result.verdict} {emoji}"]
    if result.reasons:
        lines.append("  사유: " + ", ".join(result.reasons))
    if result.gate:
        g = result.gate
        lines.append(f"  게이트={g['status']} · rolloutCandidate={str(g['rolloutCandidate']).lower()} · "
                     f"실제run {g['actualRuns']} · 후행연속 {g['trailingConsecutivePassingRuns']}")
    if result.writtenPaths:
        lines.append("  기록(shadow): " + ", ".join(os.path.relpath(p, ROOT) for p in result.writtenPaths))
    lines.append("  공개 승격/외부 액션: 없음(게이트 MET 도 Gate 6 별도 승인 필요).")
    return "\n".join(lines)


def main(argv=None):
    operator.enable_utf8_console()  # cp949 콘솔에서도 한글·기호 안전(부작용 없음).
    ap = argparse.ArgumentParser(
        description="ORNScore Metrics 2.5.1 단일 시장일 비공개 shadow 오케스트레이터 "
                    "(Slice C, 유한·멱등·fail-closed·무네트워크). PASS/WAIT/FAIL 세 갈래.",
        epilog="게이트 MET 은 공개 승격을 촉발하지 않는다(§7 Gate 6). 모든 산출물은 .metrics251-shadow 아래.")
    ap.add_argument("--mode", choices=["scheduled", "explicit"], default="scheduled",
                    help="scheduled=어댑터가 증명한 최신 공통 거래일만 · explicit=--market-date 지정")
    ap.add_argument("--market-date", default=None, help="explicit 모드 대상 시장일(YYYY-MM-DD)")
    ap.add_argument("--activation-date", default=None,
                    help="이 날짜 이후 거래일만 effectiveDate 자격(첫 비공개 effectiveDate 규칙)")
    ap.add_argument("--source", choices=["public", "fixture"], default="public",
                    help="입력 출처(provenance). public=소유자 공개 envelope, fixture=명시적 로컬 fixture")
    ap.add_argument("--data-dir", default=None,
                    help="envelope 디렉터리(stocks.json + prices/). 미지정 시 public=public/data")
    ap.add_argument("--calendar", default=None, help="거래일 캘린더 fixture(JSON) — 필수(거래일 확정)")
    ap.add_argument("--config", default=None, help="Metrics 2.5.1 config(미지정 시 정본 config/metrics/2.5.1.json)")
    ap.add_argument("--root", default=None,
                    help=f"비공개 shadow 루트(기본 {os.path.relpath(DEFAULT_SHADOW_ROOT, ROOT)}).")
    ap.add_argument("--json", action="store_true", help="결정적 JSON 을 stdout 으로")
    ap.add_argument("--no-write", action="store_true", help="판정만 — inputs/run/원장/보고서 미기록")
    args = ap.parse_args(argv)

    if args.mode == "explicit" and not args.market_date:
        print("metrics251_orchestrator: explicit 모드는 --market-date 가 필요합니다.", file=sys.stderr)
        return 2
    if args.mode == "scheduled" and args.market_date:
        print("metrics251_orchestrator: scheduled 모드는 시장일을 지정할 수 없습니다(어댑터가 증명한 "
              "최신 공통 거래일만 사용).", file=sys.stderr)
        return 2

    data_dir = args.data_dir or (os.path.join(ROOT, "public", "data") if args.source == "public" else None)
    if not data_dir:
        print("metrics251_orchestrator: --data-dir 이 필요합니다(fixture 모드).", file=sys.stderr)
        return 2

    try:
        cfg = mi.load_config(args.config)
    except (OSError, ValueError) as e:
        print(f"metrics251_orchestrator: config 로드 실패 {e!r}", file=sys.stderr)
        return 2

    calendar, calendar_doc = (None, None)
    if args.calendar:
        try:
            calendar, calendar_doc = _load_calendar_doc(args.calendar)
        except (OSError, ValueError, KeyError) as e:
            print(f"metrics251_orchestrator: 캘린더 로드 실패 {e!r}", file=sys.stderr)
            return 2

    envelope = mi.load_envelope(data_dir)
    root = args.root or DEFAULT_SHADOW_ROOT

    result = orchestrate(
        envelope=envelope, calendar=calendar, calendar_doc=calendar_doc, cfg=cfg,
        shadow_root=root, mode=args.mode, market_date=args.market_date,
        activation_date=args.activation_date, write_reports=not args.no_write)

    if not args.no_write:
        try:
            real_root = store.assert_private_root(root)
            write_report(real_root, result)
        except (ValueError, OSError):
            pass  # 누출 가드로 이미 FAIL 처리됨 — 보고서 미기록.

    if args.json:
        print(json.dumps(dict(result.to_dict(), reportHash=report_hash(result)),
                         ensure_ascii=False, sort_keys=True, indent=2))
    else:
        print(render_console(result))
    return result.exit_code


if __name__ == "__main__":
    raise SystemExit(main())
