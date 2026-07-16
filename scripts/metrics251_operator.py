#!/usr/bin/env python3
# Metrics 2.5.1 일일 shadow 워크플로 운영자(operator) 상태 명령·보고서 (Slice P)
#   — 순수·결정적·읽기 전용·표준 라이브러리 전용. 공개 라우트/화면에 연결하지 않는다(로컬/비공개 지향).
#
# 목적(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D02(5일 AND 게이트),
#      §M251-D07(원자적·불변 승격), §M251-D08(운영경보/공개설명 상태 분리), §M251-D10(비공개 자산),
#      §7 Gate 4, §8 데이터 계약, §9 실패/롤백, 원안 티켓 ORN-2508, 작업 지시):
#   * 매 거래일 shadow 워크플로를 운영하는 사람이 "지금 무엇을 해야 하는가"를 한눈에 보도록,
#     기존 계약 층(Slice M preflight · D 엔진 · E 자격 · F 저장소 · K 롤아웃 게이트)을 **읽기 전용으로
#     조립**해 단일 운영자 상태로 요약한다. 아무것도 게시/계산 저장하지 않는다(run 은 Slice N 소유).
#   * 정확히 하나의 대상 시장일(--request)에 대해 다음 8개 상태 중 하나를 결정적으로 판정한다:
#       READY            — preflight/자격 통과 + 해당 시장일 승격 run 없음 → 안전하게 게시 가능.
#       ALREADY_RECORDED — 바이트 동일 스냅샷이 이미 승격됨(멱등) → 이 날은 기록 완료.
#       MISSING_INPUT    — preflight 가 필수 입력/설정 결측·형식오류로 차단.
#       STALE_SOURCE     — preflight 가 소스 기준일 stale/불일치/미래·해시 pin 불일치로 차단.
#       CONFLICT         — 같은 시장일에 다른(충돌) 스냅샷이 이미 승격됨(불변 위치 — 덮어쓰기 금지).
#       PARTIAL_RUN      — 해당 시장일에 미봉인/손상된 run 흔적이 있음(정리 후 재실행 필요).
#       QA_FAILED        — preflight 통과·엔진 계산되나 내재적 자격 QA 게이트가 실패.
#       GATE_PENDING     — 이 날은 처리됐으나 5거래일 연속 창이 아직 미완료(증거 축적 중).
#   * 대상 시장일이 없으면(--request 미지정) 저장소+롤아웃 게이트만 읽어 워크플로 수준 상태
#     (기본 GATE_PENDING)를 보고한다.
#   * 각 상태에 대해 **안전한 다음 조치(next actions)** 를 결정적 텍스트로 제시한다.
#
# 반드시 지키는 규칙(설계서 §4 변경 불가 원칙 · §M251-D10 · 작업 지시):
#   * 읽기 전용: 승격/pointer 교체/스냅샷 저장을 하지 않는다(그건 Slice N run 의 책임).
#   * 벽시계 시각(datetime.now()/time.time()/date.today() 등)·난수·네트워크 금지 — 출력은
#     저장소·요청·캘린더 입력에서만 결정적으로 파생.
#   * public/ 데이터를 읽거나 쓰지 않는다. shadow 저장소 루트가 public/ 밑이면 즉시 실패(§M251-D10).
#   * 결측을 50/평균으로 채우지 않는다. 게이트 판정은 Slice K 를 단일 출처로 재사용한다(합성 금지).
#   * 보호되지 않은 웹 라우트를 추가하지 않는다 — 보고서는 로컬 stdout/JSON/Markdown 이다.
#
# Windows 콘솔 안전(한글): cp949 같은 비-UTF-8 콘솔에서도 한글·상태 기호(✅⏳❌)가 깨지지 않도록
#   enable_utf8_console() 이 stdout/stderr 를 UTF-8 로 재구성한다(이미 UTF-8 이면 무변경).
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

import metrics251_run as run                # noqa: E402  (Slice N 조립 헬퍼 재사용: scan/qa_gate/derive)
import metrics251_preflight as pf           # noqa: E402  (Slice M preflight 계약·사유 코드)
import metrics251_engine as eng             # noqa: E402  (Slice D 순수 엔진 — 후보 정체성)
import metrics251_eligibility as elig       # noqa: E402  (Slice E 자격/품질/모집단)
import metrics251_snapshot_store as store   # noqa: E402  (Slice F 저장소·assert_private_root)
import metrics251_rollout_gate as rg        # noqa: E402  (Slice K 게이트 — 단일 출처)
from metrics251_compare import FixtureTradingCalendar  # noqa: E402  (Slice G 거래일 캘린더)
from metrics251_config import canonical_bytes          # noqa: E402  (결정성 canonical 해시)

ENGINE_VERSION = eng.ENGINE_VERSION
MIN_CONSECUTIVE_RUNS = rg.MIN_CONSECUTIVE_RUNS

# ---------------------------------------------------------------------------
# 운영자 상태(안정, 기계판독 enum).
# ---------------------------------------------------------------------------
STATE_READY = "READY"
STATE_ALREADY_RECORDED = "ALREADY_RECORDED"
STATE_MISSING_INPUT = "MISSING_INPUT"
STATE_STALE_SOURCE = "STALE_SOURCE"
STATE_CONFLICT = "CONFLICT"
STATE_PARTIAL_RUN = "PARTIAL_RUN"
STATE_QA_FAILED = "QA_FAILED"
STATE_GATE_PENDING = "GATE_PENDING"

ALL_STATES = (
    STATE_READY, STATE_ALREADY_RECORDED, STATE_MISSING_INPUT, STATE_STALE_SOURCE,
    STATE_CONFLICT, STATE_PARTIAL_RUN, STATE_QA_FAILED, STATE_GATE_PENDING,
)

# 상태 기호(비-cp949 문자를 의도적으로 포함 — 콘솔 인코딩 회귀의 실제 대상).
STATE_EMOJI = {
    STATE_READY: "✅",
    STATE_ALREADY_RECORDED: "📼",
    STATE_MISSING_INPUT: "❌",
    STATE_STALE_SOURCE: "⚠️",
    STATE_CONFLICT: "⛔",
    STATE_PARTIAL_RUN: "🧩",
    STATE_QA_FAILED: "❌",
    STATE_GATE_PENDING: "⏳",
}

# CONFLICT 시 노출하는 사유 코드(Slice N 과 동일 어휘 재사용).
CONFLICT_REASON = run.SAME_DATE_CONFLICT

# ---------------------------------------------------------------------------
# preflight 사유 코드 → 운영자 버킷. DUPLICATE_MARKET_DATE 는 저장소 스캔이 세분 판정하므로 제외.
#   stale-source 버킷: 소스 기준일/해시 pin 이 어긋나거나 오래된 경우.
#   그 외 차단 사유(형식/캘린더/필수입력/레이아웃/내부오류)는 모두 missing-input 버킷.
# ---------------------------------------------------------------------------
_STALE_SOURCE_REASONS = frozenset({
    pf.SOURCE_DATE_STALE, pf.SOURCE_DATE_MISMATCH, pf.SOURCE_DATE_FUTURE, pf.SOURCE_DATE_MALFORMED,
    pf.ENGINE_VERSION_MISMATCH, pf.CONFIG_HASH_MISMATCH, pf.INPUT_HASH_MISMATCH,
    pf.MARKET_DATE_EXPECTATION_MISMATCH,
})


def _bucket_preflight(reasons):
    """preflight 사유를 (blocking, missing, stale) 로 나눈다. DUPLICATE_MARKET_DATE 는 무시."""
    blocking = [r for r in (reasons or []) if r != pf.DUPLICATE_MARKET_DATE]
    stale = sorted({r for r in blocking if r in _STALE_SOURCE_REASONS})
    missing = sorted({r for r in blocking if r not in _STALE_SOURCE_REASONS})
    return sorted(set(blocking)), missing, stale


# ---------------------------------------------------------------------------
# Windows 콘솔 안전(한글) — cp949 등 비-UTF-8 stdout/stderr 를 UTF-8 로 재구성한다.
#   이미 UTF-8 이면 건드리지 않는다. reconfigure 미지원 스트림(테스트 래핑/리다이렉트 일부)은 조용히 건너뛴다.
#   출력은 부작용 없이 인코딩만 바꾼다(결정성·순수성 무관).
# ---------------------------------------------------------------------------
def enable_utf8_console():
    """stdout/stderr 인코딩이 UTF-8 이 아니면 UTF-8 로 재구성한다(한글·상태 기호 깨짐 방지)."""
    for name in ("stdout", "stderr"):
        stream = getattr(sys, name, None)
        if stream is None:
            continue
        enc = (getattr(stream, "encoding", None) or "").lower().replace("-", "")
        if enc == "utf8":
            continue  # 이미 UTF-8 — 무변경.
        reconfigure = getattr(stream, "reconfigure", None)
        if callable(reconfigure):
            try:
                reconfigure(encoding="utf-8", errors="backslashreplace")
            except (ValueError, OSError, LookupError):
                pass  # 재구성 불가(래핑/리다이렉트) — fail soft, 계산에는 영향 없음.


# ---------------------------------------------------------------------------
# 대상 시장일 판정 결과(typed).
# ---------------------------------------------------------------------------
@dataclass
class DayResult:
    marketDate: Optional[str]
    state: str                                    # 8개 운영자 상태 중 하나(일 단위)
    reasons: list = field(default_factory=list)   # 정렬된 안정 사유(READY/ALREADY_RECORDED 는 빈 리스트)
    preflightOk: Optional[bool] = None
    preflightReasons: list = field(default_factory=list)
    candidateId: Optional[str] = None
    existing: Optional[dict] = None               # 저장소 내 같은 시장일 run 요약(있을 때만)

    def to_dict(self):
        return {
            "marketDate": self.marketDate,
            "state": self.state,
            "reasons": self.reasons,
            "preflightOk": self.preflightOk,
            "preflightReasons": self.preflightReasons,
            "candidateId": self.candidateId,
            "existing": self.existing,
        }


def classify_target_day(request, *, calendar=None, root=None):
    """정확히 하나의 대상 시장일을 8개 상태 중 하나로 판정한다(순수·읽기 전용·fail closed)."""
    request = dict(request or {})
    market_date = request.get("marketDate")

    # ---- 저장소 스캔(읽기 전용) — 같은 시장일의 승격 run 존재/무결성. ----
    try:
        same_date = run.scan_market_date(root, market_date) if (root and market_date) else []
    except Exception:  # noqa: BLE001  (읽기 실패는 스캔 없음으로 취급 — preflight 레이아웃 검사가 정확히 잡음)
        same_date = []
    partial = [r for r in same_date if not r["ok"]]
    sealed = [r for r in same_date if r["ok"]]

    # ---- preflight(Slice M, 순수) — 차단 사유 버킷. ----
    try:
        promoted = pf.promoted_market_dates(root) if root else []
    except Exception:  # noqa: BLE001  (루트 없음/공개 경로 — 레이아웃 검사가 거절)
        promoted = []
    pre = pf.preflight_market_day(request, calendar, promoted)
    _blocking, missing_reasons, stale_reasons = _bucket_preflight(pre.reasons)

    # ---- 후보 스냅샷 정체성(Slice D, 순수) — recorded vs conflict 판별용. ----
    candidate_id = None
    candidate_bytes = None
    engine_null = None
    engine_req = {"config": request.get("config"), "marketDate": market_date,
                  "sourceDates": request.get("sourceDates"), "stocks": request.get("stocks")}
    try:
        eres = eng.compute_snapshot(eng.EngineRequest.from_dict(engine_req))
        if eres.snapshot is not None:
            candidate_id = f"{market_date}__{run.derive_run_id(eres.snapshot.to_dict())}"
            candidate_bytes = eres.snapshot.canonical_bytes()
        else:
            engine_null = sorted(set(eres.nullReasons))
    except Exception as e:  # noqa: BLE001  (fail closed — 후보 정체성 없음으로 취급)
        engine_null = [repr(e)]

    # ---- 우선순위 판정(가장 차단적인 것 먼저 — fail closed). ----
    if partial:
        # 미봉인/손상 run 흔적은 다른 무엇보다 먼저 정리해야 한다(재실행을 막는다).
        return DayResult(
            marketDate=market_date, state=STATE_PARTIAL_RUN,
            reasons=sorted({c for r in partial for c in r["reasons"]}),
            preflightOk=pre.ok, preflightReasons=pre.reasons, candidateId=candidate_id,
            existing={"kind": "partial", "ids": [r["snapshotId"] for r in partial]})

    if sealed:
        # 같은 시장일에 봉인된 승격 run 이 이미 있다 — 불변 위치. 후보와 바이트 동일이면 기록 완료.
        self_match = None
        if candidate_id is not None and candidate_bytes is not None:
            self_match = next(
                (r for r in sealed if r["snapshotId"] == candidate_id and r["bytes"] == candidate_bytes),
                None)
        if self_match is not None:
            return DayResult(
                marketDate=market_date, state=STATE_ALREADY_RECORDED, reasons=[],
                preflightOk=pre.ok, preflightReasons=pre.reasons, candidateId=candidate_id,
                existing={"kind": "recorded", "ids": [self_match["snapshotId"]]})
        # 후보가 다르거나(입력 변경) 정체성을 못 구함 → 불변 위치를 덮어쓰지 않도록 충돌로 경고(fail closed).
        return DayResult(
            marketDate=market_date, state=STATE_CONFLICT, reasons=[CONFLICT_REASON],
            preflightOk=pre.ok, preflightReasons=pre.reasons, candidateId=candidate_id,
            existing={"kind": "conflict", "ids": [r["snapshotId"] for r in sealed],
                      "candidateId": candidate_id})

    # 저장소에 흔적 없음 → preflight 버킷.
    if missing_reasons:
        return DayResult(marketDate=market_date, state=STATE_MISSING_INPUT, reasons=missing_reasons,
                         preflightOk=pre.ok, preflightReasons=pre.reasons, candidateId=candidate_id)
    if stale_reasons:
        return DayResult(marketDate=market_date, state=STATE_STALE_SOURCE, reasons=stale_reasons,
                         preflightOk=pre.ok, preflightReasons=pre.reasons, candidateId=candidate_id)
    if candidate_id is None:
        # 방어적: preflight 는 통과했는데 엔진이 스냅샷을 못 만든 경우(입력 결핍) → 입력 문제로 본다.
        return DayResult(marketDate=market_date, state=STATE_MISSING_INPUT,
                         reasons=(engine_null or ["ENGINE_NULL"]),
                         preflightOk=pre.ok, preflightReasons=pre.reasons, candidateId=candidate_id)

    # preflight·엔진 통과 → 내재적 자격 QA 게이트(Slice N qa_gate 재사용).
    qa = run.qa_gate(elig.evaluate(engine_req))
    if not qa["ok"]:
        return DayResult(marketDate=market_date, state=STATE_QA_FAILED, reasons=list(qa["blockers"]),
                         preflightOk=pre.ok, preflightReasons=pre.reasons, candidateId=candidate_id)

    return DayResult(marketDate=market_date, state=STATE_READY, reasons=[],
                     preflightOk=pre.ok, preflightReasons=pre.reasons, candidateId=candidate_id)


# ---------------------------------------------------------------------------
# 롤아웃 게이트(Slice K, 읽기 전용) — 워크플로 수준 상태의 단일 출처.
# ---------------------------------------------------------------------------
def gate_from_store(root, calendar):
    """비공개 저장소에서 5일 AND 게이트 보고서를 계산(Slice K 재사용). 승인 run <5 면 PENDING 보존."""
    try:
        runs = rg.run_evidence_from_store(root) if root else []
    except ValueError:
        raise  # public/ 루트 등 — 상위에서 fail closed 처리
    return rg.evaluate_rollout_gate(runs, calendar, generated_from="shadow-store")


# ---------------------------------------------------------------------------
# 운영자 상태 종합 — 일 단위 상태 + 게이트 → 하나의 operatorState(8개 중 하나).
# ---------------------------------------------------------------------------
def _operator_state(day, gate_status):
    """day(있으면) 와 게이트 상태에서 최종 operatorState 를 결정한다."""
    if day is None:
        # 상태 전용 모드: 워크플로 게이트를 보고한다. MET 이 아니면(현실 대부분) 증거 축적 중.
        return STATE_GATE_PENDING
    if day.state == STATE_ALREADY_RECORDED and gate_status != rg.GATE_MET:
        # 이 날은 기록 완료이나 5거래일 연속 창이 아직 미완료 → 워크플로는 대기 중.
        return STATE_GATE_PENDING
    return day.state


# ---------------------------------------------------------------------------
# 안전한 다음 조치(next actions) — 상태별 결정적 텍스트(벽시계/난수 없음).
# ---------------------------------------------------------------------------
def next_actions(operator_state, *, day=None, gate=None):
    g = gate or {}
    actual = g.get("actualRuns")
    trailing = g.get("trailingConsecutivePassingRuns")
    need = g.get("requiredConsecutiveRuns", MIN_CONSECUTIVE_RUNS)
    reasons = (day.reasons if day else []) or []
    rtxt = ", ".join(reasons)

    if operator_state == STATE_READY:
        return [
            "이 시장일은 게시 준비 완료입니다. `npm run run:metrics251 -- --request <req.json> "
            "--calendar <cal.json>` 로 원자적·멱등 shadow run 을 게시하세요.",
            "게시 후 `npm run ledger:metrics251` 로 증거 원장·롤아웃 게이트를 갱신하세요.",
        ]
    if operator_state == STATE_ALREADY_RECORDED:
        return [
            "이 시장일은 이미 바이트 동일 스냅샷으로 기록되었습니다(멱등) — 재게시할 것이 없습니다.",
            "다음 거래일로 진행하세요.",
        ]
    if operator_state == STATE_MISSING_INPUT:
        return [
            f"필수 입력/설정이 결측·오류입니다: {rtxt or '입력 확인 필요'}. 누락된 config/유니버스/"
            "시계열(prices·volumes)·거래일 캘린더를 공급하세요.",
            "`npm run preflight:metrics251 -- --request <req.json> --calendar <cal.json>` 로 재확인하세요.",
        ]
    if operator_state == STATE_STALE_SOURCE:
        return [
            f"소스 기준일/해시 pin 이 어긋납니다: {rtxt or '소스일 확인 필요'}. prices·volumes 를 "
            "해당 시장일 종가 기준으로 다시 추출하고 expected pin(해시)을 재파생하세요.",
            "갱신 후 `npm run preflight:metrics251` 로 재확인하세요(미래·stale 소스일은 게시 불가).",
        ]
    if operator_state == STATE_CONFLICT:
        ids = (day.existing or {}).get("ids") if day else None
        return [
            f"같은 시장일에 다른 스냅샷이 이미 승격되어 있습니다{(' (' + ', '.join(ids) + ')') if ids else ''}. "
            "불변 위치이므로 덮어쓰지 마세요(§M251-D07).",
            "입력·소스 기준일이 왜 달라졌는지 조사하세요. 재게시가 정당하면 별도 운영 결정으로 처리하세요.",
        ]
    if operator_state == STATE_PARTIAL_RUN:
        ids = (day.existing or {}).get("ids") if day else None
        return [
            f"미봉인/손상된 run 흔적이 있습니다{(' (' + ', '.join(ids) + ')') if ids else ''}. "
            f"사유: {rtxt or '무결성 검증 실패'}.",
            "해당 tmp/손상 run 디렉터리를 정리한 뒤 `npm run run:metrics251` 을 다시 실행하세요"
            "(승격은 원자적이라 부분 실패는 pointer 를 남기지 않습니다).",
        ]
    if operator_state == STATE_QA_FAILED:
        return [
            f"내재적 자격/품질 QA 게이트가 실패했습니다: {rtxt or 'QA blocker'}. "
            "알 수 없는 제외 사유·사유 없는 제외·일관성 위반을 데이터에서 시정하세요.",
            "시정 후 `npm run preflight:metrics251` → `npm run run:metrics251` 순으로 재실행하세요.",
        ]
    if operator_state == STATE_GATE_PENDING:
        base = [
            f"실제 거래일 shadow run 이 {actual if actual is not None else 0}개입니다"
            f"(후행 연속 {trailing if trailing is not None else 0}, 요구 {need}). "
            "증거를 합성하지 말고 매 거래일 run 을 계속 축적하세요.",
        ]
        if day is not None and day.state == STATE_ALREADY_RECORDED:
            base.insert(0, "이 시장일은 기록 완료입니다 — 다음 거래일로 진행하세요.")
        base.append("`npm run rollout:metrics251` 로 최신 5일 AND 게이트 판정을 확인하세요"
                    "(공개 전환은 Gate 6 별도 승인).")
        return base
    return ["알 수 없는 상태 — `npm run rollout:metrics251` 로 게이트를 확인하세요."]


# ---------------------------------------------------------------------------
# 보고서 조립(순수·결정적) — day(선택) + gate + operatorState + nextActions.
# ---------------------------------------------------------------------------
def build_report(request, *, calendar=None, root=None):
    """운영자 상태 보고서(dict). request 없으면 상태 전용(저장소+게이트) 모드."""
    has_target = bool(request and request.get("marketDate"))
    day = classify_target_day(request, calendar=calendar, root=root) if has_target else None

    gate_error = None
    try:
        gate_report = gate_from_store(root, calendar)
    except ValueError as e:
        gate_error = str(e)
        gate_report = rg.evaluate_rollout_gate([], calendar, generated_from="shadow-store")
    gate = gate_report["gate"]

    operator_state = _operator_state(day, gate["status"])
    actions = next_actions(operator_state, day=day, gate=gate)

    return {
        "meta": {
            "reportKind": "metrics-2.5.1-operator-status",
            "engineVersion": ENGINE_VERSION,
            "readOnly": True,
            "computesPublicScore": False,
            "mode": "day" if has_target else "status",
            "requiredConsecutiveRuns": gate.get("requiredConsecutiveRuns", MIN_CONSECUTIVE_RUNS),
            "note": "일일 shadow 운영자 상태 요약(읽기 전용). 공개 Metrics 2.4 정본은 불변이며 "
                    "이 보고서는 공개 전환 승인 근거가 아니라 로컬 운영 상태다(§7 Gate 6·§M251-D08).",
            "gateError": gate_error,
        },
        "operatorState": operator_state,
        "day": (day.to_dict() if day else None),
        "gate": {
            "status": gate["status"],
            "rolloutCandidate": gate["rolloutCandidate"],
            "actualRuns": gate["actualRuns"],
            "requiredConsecutiveRuns": gate["requiredConsecutiveRuns"],
            "trailingConsecutivePassingRuns": gate["trailingConsecutivePassingRuns"],
            "windowDates": gate["windowDates"],
            "blockingReasons": gate["blockingReasons"],
        },
        "nextActions": actions,
    }


def report_hash(report):
    """보고서의 결정적 canonical 해시(재실행 동일성 증거)."""
    return hashlib.sha256(canonical_bytes(report)).hexdigest()


# ---------------------------------------------------------------------------
# 렌더 — 콘솔 요약(간결) / Markdown(선택). 둘 다 결정적.
# ---------------------------------------------------------------------------
def render_console(report):
    m = report["meta"]
    st = report["operatorState"]
    emoji = STATE_EMOJI.get(st, "•")
    g = report["gate"]
    lines = []
    md_label = report["day"]["marketDate"] if report["day"] else "-"
    lines.append(f"metrics251_operator: mode={m['mode']} · marketDate={md_label} · "
                 f"상태={st} {emoji}")
    if report["day"]:
        d = report["day"]
        lines.append(f"  일 단위={d['state']} · preflight={'ok' if d['preflightOk'] else 'fail'}"
                     + (f" · 사유: {', '.join(d['reasons'])}" if d["reasons"] else ""))
    lines.append(f"  게이트={g['status']} · rolloutCandidate={str(g['rolloutCandidate']).lower()} · "
                 f"실제run {g['actualRuns']}/{g['requiredConsecutiveRuns']} · "
                 f"후행연속 {g['trailingConsecutivePassingRuns']}")
    if m.get("gateError"):
        lines.append(f"  ⚠️ 게이트 읽기 오류: {m['gateError']}")
    lines.append("  다음 조치:")
    for a in report["nextActions"]:
        lines.append(f"    - {a}")
    return "\n".join(lines)


def render_markdown(report):
    m = report["meta"]
    st = report["operatorState"]
    emoji = STATE_EMOJI.get(st, "•")
    g = report["gate"]
    L = []
    L.append("# Metrics 2.5.1 일일 shadow 운영자 상태 (Slice P)")
    L.append("")
    L.append("> 이 문서는 `scripts/metrics251_operator.py` 가 비공개 shadow 저장소·요청·캘린더에서 "
             "**결정적으로 재생성**합니다. 손으로 수정하지 마세요.")
    L.append("")
    L.append("**읽기 전용 로컬 운영 상태이며 공개 전환 승인이 아닙니다(§7 Gate 6).** 공개 Metrics 2.4 "
             "정본은 불변입니다.")
    L.append("")
    md_label = report["day"]["marketDate"] if report["day"] else "-"
    L.append(f"- 모드: `{m['mode']}` · 대상 시장일: `{md_label}` · 엔진: `{m['engineVersion']}`")
    L.append(f"- **운영자 상태: {st} {emoji}**")
    L.append("")
    if report["day"]:
        d = report["day"]
        L.append("## 1. 대상 시장일")
        L.append("")
        L.append(f"- 일 단위 상태: **{d['state']}** · preflight: "
                 f"{'통과 ✅' if d['preflightOk'] else '차단 ❌'}")
        if d["reasons"]:
            L.append(f"- 사유: {', '.join(f'`{r}`' for r in d['reasons'])}")
        if d.get("candidateId"):
            L.append(f"- 후보 snapshotId: `{d['candidateId']}`")
        if d.get("existing"):
            ex = d["existing"]
            L.append(f"- 저장소 흔적: `{ex.get('kind')}` — {', '.join(ex.get('ids') or []) or '-'}")
        L.append("")
    L.append("## 2. 롤아웃 게이트(5일 AND · §M251-D02)")
    L.append("")
    gate_label = {rg.GATE_MET: "MET ✅", rg.GATE_NOT_MET: "NOT_MET ❌",
                  rg.GATE_PENDING: "PENDING ⏳"}.get(g["status"], g["status"])
    L.append(f"- 상태: **{gate_label}** · rolloutCandidate: **{str(g['rolloutCandidate']).lower()}**")
    L.append(f"- 실제 run: **{g['actualRuns']}** / 요구 {g['requiredConsecutiveRuns']} · "
             f"후행 연속 통과: **{g['trailingConsecutivePassingRuns']}**")
    if g["blockingReasons"]:
        L.append(f"- 차단 사유: {', '.join(f'`{c}`' for c in g['blockingReasons'])}")
    if m.get("gateError"):
        L.append(f"- ⚠️ 게이트 읽기 오류: {m['gateError']}")
    L.append("")
    L.append("## 3. 안전한 다음 조치")
    L.append("")
    for a in report["nextActions"]:
        L.append(f"- {a}")
    L.append("")
    L.append(f"보고서 canonical SHA-256: `{report_hash(report)}`")
    L.append("")
    return "\n".join(L)


# ---------------------------------------------------------------------------
# CLI — 대상 시장일 요청(선택) + 저장소 → 운영자 상태 요약(읽기 전용, 파일 기본 미기록).
# ---------------------------------------------------------------------------
def _load_json(path):
    with open(path, encoding="utf-8-sig") as f:
        return json.load(f)


def _load_calendar(path):
    if not path:
        return None
    with open(path, encoding="utf-8") as f:
        return FixtureTradingCalendar.from_fixture(json.load(f))


def _prepare_request(args):
    """요청 JSON 을 로드하고, run.py 와 동일하게 config·expected·레이아웃을 채운다(읽기 전용)."""
    if not args.request:
        return None
    req = _load_json(args.request)
    if not req.get("config") and args.config:
        req["config"] = _load_json(args.config)
    root = args.root or req.get("shadowRoot") or store.DEFAULT_SHADOW_ROOT
    req["shadowRoot"] = root
    if not req.get("outputLocation"):
        req["outputLocation"] = os.path.join(root, store.RUNS_SUBDIR, "run")
    if not req.get("expected"):
        req["expected"] = run.derive_expected(
            req.get("config"), req.get("marketDate"), req.get("sourceDates"), req.get("stocks"))
    return req


def main(argv=None):
    enable_utf8_console()  # 인자 파싱(및 --help) 전에 콘솔을 UTF-8 로 — cp949 에서도 한글·기호 안전.
    ap = argparse.ArgumentParser(
        description="Metrics 2.5.1 일일 shadow 운영자 상태 명령·보고서 (Slice P, read-only, deterministic).",
        epilog="상태 범례: READY ✅ · ALREADY_RECORDED 📼 · MISSING_INPUT ❌ · STALE_SOURCE ⚠️ · "
               "CONFLICT ⛔ · PARTIAL_RUN 🧩 · QA_FAILED ❌ · GATE_PENDING ⏳. "
               "이 명령은 게시/계산 저장을 하지 않습니다(run 은 run:metrics251 소유).",
        formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--request", default=None,
                    help="대상 시장일 요청 JSON(marketDate/sourceDates/stocks[, expected, config]). "
                         "생략하면 저장소+게이트만 보는 상태 전용 모드.")
    ap.add_argument("--config", default=None, help="엔진 config JSON(요청에 config 없으면 주입)")
    ap.add_argument("--calendar", default=None, help="거래일 캘린더 fixture(JSON) — 연속성/거래일 판정용")
    ap.add_argument("--root", default=store.DEFAULT_SHADOW_ROOT, help="비공개 shadow 저장소 루트")
    ap.add_argument("--json", action="store_true", help="결정적 JSON 을 stdout 으로")
    ap.add_argument("--md-out", default=None,
                    help="Markdown 상태 보고서를 이 경로에 기록(선택). 미지정이면 파일 미기록(읽기 전용).")
    args = ap.parse_args(argv)

    request = _prepare_request(args)
    calendar = _load_calendar(args.calendar)
    report = build_report(request, calendar=calendar, root=args.root)

    if args.md_out:
        md = render_markdown(report)
        with open(args.md_out, "w", encoding="utf-8", newline="\n") as fp:
            fp.write(md if md.endswith("\n") else md + "\n")

    if args.json:
        print(json.dumps(report, ensure_ascii=False, sort_keys=True, indent=2))
    else:
        print(render_console(report))

    # 종료 코드: 안전하게 진행 가능(READY/ALREADY_RECORDED/GATE_PENDING)=0, 운영자 조치 필요=2.
    ok_states = {STATE_READY, STATE_ALREADY_RECORDED, STATE_GATE_PENDING}
    return 0 if report["operatorState"] in ok_states else 2


if __name__ == "__main__":
    raise SystemExit(main())
