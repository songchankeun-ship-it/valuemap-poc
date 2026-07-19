#!/usr/bin/env python3
# ORNScore 장마감 운영 자동화 배치 — Slice C 오케스트레이터 계약 + fault matrix 게이트.
#   (governing plan: docs/ornscore-market-close-automation-2026-07-19.md · Metrics 2.5.1 설계서 §M251-D02/D10.)
#
# 강제하는 계약(전부 오프라인·fixture·결정적 — 네트워크/벽시계/난수 없음):
#   PASS:  scheduled 해피패스 → PUBLISHED + inputs/run/원장/게이트 문서(전부 shadow) + gate PENDING.
#          멱등 재실행 → ALREADY_RECORDED(무 새 run).
#   WAIT:  주말/공휴일 · 현재 입력 결측 · 게시 유예(종료일 갈라짐) · stale 소스일 · 활성일 이전 · lock 보유.
#   FAIL:  합성 마커 · 공개 경로 누출 · 같은 날 변경 입력(conflict) · 유니버스 드리프트 · 손상 envelope ·
#          해시 불일치(방어) · explicit 요청 낡음.
#   불변식: 모든 산출물은 shadow 루트 아래 · 추적(docs/) 파일 무변경 · 게이트 MET 도 공개 승격 없음 ·
#          어댑터 WAIT/FAIL 버킷이 ALL_REASONS 를 정확히 분할 · 소스에 금칙 API 없음 · 결정성.
#
# Usage:
#   $env:PYTHONUTF8='1'; python scripts/test_metrics251_orchestrator.py
import copy
import datetime
import json
import os
import re
import shutil
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import metrics251_orchestrator as orch       # noqa: E402
import metrics251_market_input as mi         # noqa: E402
import metrics251_e2e_matrix as e2e          # noqa: E402
import metrics251_snapshot_store as store    # noqa: E402
from metrics251_compare import FixtureTradingCalendar  # noqa: E402

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


# ---------------------------------------------------------------------------
# 결정적 fixture — 138 종목 envelope(market_input 테스트와 동일 레이아웃). 벽시계 아님.
# ---------------------------------------------------------------------------
CONFIG = mi.load_config()
MIN_PRICES, MIN_VOLUMES = mi.required_history(CONFIG)
MARKET_DATE = "2026-07-16"                    # 목요일(거래일)
AS_OF = "20260716"
CALENDAR_DOC = {"range": {"start": "2026-01-01", "end": "2026-12-31"},
                "weekendWeekdays": [5, 6], "holidays": []}
CALENDAR = FixtureTradingCalendar.from_fixture(CALENDAR_DOC)


def _date_series(end_date, n):
    end = datetime.date.fromisoformat(end_date)
    return [(end - datetime.timedelta(days=(n - 1 - i))).isoformat() for i in range(n)]


def _tickers(count):
    return [f"{100000 + i:06d}" for i in range(count)]


def make_envelope(*, count=138, points=MIN_PRICES + 5, market_date=MARKET_DATE, as_of=AS_OF,
                  source="FDR + Naver + yfinance", per=12.5, pbr=1.4, extra_meta=None, per_ticker=None):
    meta = {"count": count, "asOfBusinessDate": as_of, "metricsVersion": "2.4",
            "source": source, "generatedAt": "2026-07-17T09:46:56"}
    if extra_meta:
        meta.update(extra_meta)
    stocks = []
    prices = {}
    for t in _tickers(count):
        stocks.append({"ticker": t, "name": f"종목{t}", "per": per, "pbr": pbr})
        dates = _date_series(market_date, points)
        prices[t] = [{"d": dates[i], "c": 100.0 + (i % 7), "v": 1000 + (i % 5)} for i in range(points)]
        if per_ticker:
            mut = per_ticker(t)
            if mut:
                if "stock" in mut:
                    stocks[-1].update(mut["stock"])
                if "points" in mut:
                    prices[t] = mut["points"]
                if "drop_price_file" in mut:
                    prices[t] = "__DROP__"
    return meta, stocks, prices


def write_envelope(dirpath, meta, stocks, prices, *, corrupt_stocks=False):
    os.makedirs(os.path.join(dirpath, "prices"), exist_ok=True)
    if corrupt_stocks:
        with open(os.path.join(dirpath, "stocks.json"), "w", encoding="utf-8") as f:
            f.write("{ this is not valid json ][")
    else:
        doc = dict(meta)
        doc["stocks"] = stocks
        with open(os.path.join(dirpath, "stocks.json"), "w", encoding="utf-8") as f:
            json.dump(doc, f, ensure_ascii=False)
    for t, pts in prices.items():
        if pts == "__DROP__":
            continue
        with open(os.path.join(dirpath, "prices", f"{t}.json"), "w", encoding="utf-8") as f:
            json.dump({"ticker": t, "points": pts}, f, ensure_ascii=False)


def _mktmp():
    return tempfile.mkdtemp(prefix="m251_orch_")


def _write_env_dir(**kw):
    d = _mktmp()
    meta, stocks, prices = make_envelope(**kw)
    write_envelope(d, meta, stocks, prices)
    return d


def _orchestrate(data_dir, shadow, *, mode="scheduled", market_date=None, activation_date=None,
                 calendar=CALENDAR, write_reports=True):
    env = mi.load_envelope(data_dir)
    return orch.orchestrate(envelope=env, calendar=calendar, calendar_doc=CALENDAR_DOC, cfg=CONFIG,
                            shadow_root=shadow, mode=mode, market_date=market_date,
                            activation_date=activation_date, write_reports=write_reports)


def _under(path, root):
    return os.path.commonpath([os.path.abspath(path), os.path.abspath(root)]) == os.path.abspath(root)


def _assert_all_under(result, root, label):
    for p in result.writtenPaths:
        check(_under(p, root), f"{label}: 산출물 {p} 가 shadow 루트 {root} 밖")


# ===========================================================================
# PASS — scheduled 해피패스 + 멱등.
# ===========================================================================
def test_scheduled_pass_published():
    d = _write_env_dir()
    shadow = _mktmp()
    try:
        res = _orchestrate(d, shadow)
        check(res.verdict == orch.VERDICT_PASS, f"해피패스 PASS 여야: {res.verdict}/{res.reasons}")
        check(orch.PASS_PUBLISHED in res.reasons, f"PUBLISHED: {res.reasons}")
        check(res.marketDate == MARKET_DATE, f"marketDate {res.marketDate}")
        # inputs/ + runs/ + 원장 + 게이트 문서 전부 shadow 아래.
        check(os.path.isfile(os.path.join(shadow, mi.INPUTS_SUBDIR, mi.ARTIFACT_REQUEST)), "inputs/request.json 기록")
        check(os.path.isdir(os.path.join(shadow, store.RUNS_SUBDIR)), "runs/ 생성")
        check(os.path.isfile(os.path.join(shadow, "ledger.json")), "ledger.json 기록")
        check(os.path.isfile(os.path.join(shadow, orch.REPORTS_SUBDIR, orch.GATE_JSON_NAME)), "게이트 문서 shadow")
        # 게이트는 실제 run 1개라 PENDING(합성 없음), MET 아님.
        check(res.gate and res.gate["status"] == "PENDING", f"게이트 PENDING: {res.gate}")
        check(res.gate["rolloutCandidate"] is False, "rolloutCandidate false")
        # 안전 명제: 공개 승격/외부 액션 없음.
        rd = res.to_dict()
        check(rd["publicPromotionTriggered"] is False and rd["externalActionTaken"] is False,
              "공개 승격/외부 액션 없음")
        _assert_all_under(res, shadow, "scheduled_pass")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        store.rmtree_force(shadow)


def test_idempotent_rerun_already_recorded():
    d = _write_env_dir()
    shadow = _mktmp()
    try:
        r1 = _orchestrate(d, shadow)
        check(r1.verdict == orch.VERDICT_PASS and orch.PASS_PUBLISHED in r1.reasons, "1회차 PUBLISHED")
        runs_dir = os.path.join(shadow, store.RUNS_SUBDIR)
        n1 = len(os.listdir(runs_dir))
        r2 = _orchestrate(d, shadow)
        check(r2.verdict == orch.VERDICT_PASS and orch.PASS_ALREADY_RECORDED in r2.reasons,
              f"2회차 ALREADY_RECORDED: {r2.verdict}/{r2.reasons}")
        n2 = len(os.listdir(runs_dir))
        check(n1 == n2, f"재실행이 새 run 을 만들지 않아야: {n1} != {n2}")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        store.rmtree_force(shadow)


# ===========================================================================
# WAIT — run 을 조작하지 않는 정당한 hold.
# ===========================================================================
def test_wait_weekend():
    d = _write_env_dir(market_date="2026-07-18", as_of="20260718")  # 토요일
    shadow = _mktmp()
    try:
        res = _orchestrate(d, shadow)
        check(res.verdict == orch.VERDICT_WAIT and orch.WAIT_NON_TRADING_DAY in res.reasons,
              f"주말 → WAIT/NON_TRADING_DAY: {res.verdict}/{res.reasons}")
        check(not os.path.isdir(os.path.join(shadow, store.RUNS_SUBDIR)), "WAIT → run 없음")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        store.rmtree_force(shadow)


def test_explicit_value_unavailable_passes():
    # A known factor-level absence remains in the universe but is not ranking eligible.
    miss = _tickers(138)[3]
    d = _mktmp()
    shadow = _mktmp()
    try:
        meta, stocks, prices = make_envelope(
            per_ticker=lambda t: {"stock": {"per": None, "pbr": None, "valueNA": True}} if t == miss else None)
        write_envelope(d, meta, stocks, prices)
        res = _orchestrate(d, shadow)
        check(res.verdict == orch.VERDICT_PASS and orch.PASS_PUBLISHED in res.reasons,
              f"explicit value unavailability must publish private shadow: {res.verdict}/{res.reasons}")
        check(res.gate and res.gate.get("actualRuns") == 1,
              f"private ledger must record the genuine date once: {res.gate}")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        store.rmtree_force(shadow)


def test_wait_missing_current_input():
    # Null fundamentals without the explicit valueNA contract remain a healthy hold.
    miss = _tickers(138)[3]
    d = _mktmp()
    shadow = _mktmp()
    try:
        meta, stocks, prices = make_envelope(
            per_ticker=lambda t: {"stock": {"per": None, "pbr": None}} if t == miss else None)
        write_envelope(d, meta, stocks, prices)
        res = _orchestrate(d, shadow)
        check(res.verdict == orch.VERDICT_WAIT and orch.WAIT_MISSING_CURRENT_INPUT in res.reasons,
              f"ambiguous PER/PBR absence must WAIT/MISSING_CURRENT_INPUT: {res.verdict}/{res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        store.rmtree_force(shadow)


def test_wait_publication_grace_ambiguous():
    odd = _tickers(138)[42]
    d = _mktmp()
    shadow = _mktmp()
    try:
        def mut(t):
            if t == odd:
                pts = [{"d": x, "c": 100.0, "v": 1000} for x in _date_series("2026-07-15", MIN_PRICES + 5)]
                return {"points": pts}
            return None
        meta, stocks, prices = make_envelope(per_ticker=mut)
        write_envelope(d, meta, stocks, prices)
        res = _orchestrate(d, shadow)
        check(res.verdict == orch.VERDICT_WAIT and orch.WAIT_PUBLICATION_GRACE in res.reasons,
              f"종료일 갈라짐 → WAIT/PUBLICATION_GRACE: {res.verdict}/{res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        store.rmtree_force(shadow)


def test_wait_stale_source():
    d = _write_env_dir(as_of="20260715")  # marketDate 보다 과거
    shadow = _mktmp()
    try:
        res = _orchestrate(d, shadow)
        check(res.verdict == orch.VERDICT_WAIT and orch.WAIT_PUBLICATION_GRACE in res.reasons,
              f"stale 소스일 → WAIT/PUBLICATION_GRACE: {res.verdict}/{res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        store.rmtree_force(shadow)


def test_wait_pre_activation():
    d = _write_env_dir()
    shadow = _mktmp()
    try:
        # 활성일이 marketDate 이상 → effectiveDate 자격 없음(WAIT).
        res = _orchestrate(d, shadow, activation_date="2026-07-16")
        check(res.verdict == orch.VERDICT_WAIT and orch.WAIT_PRE_ACTIVATION in res.reasons,
              f"활성일 이전 → WAIT/PRE_ACTIVATION: {res.verdict}/{res.reasons}")
        check(not os.path.isdir(os.path.join(shadow, store.RUNS_SUBDIR)), "WAIT → run 없음")
        # 활성일 이후면 통과.
        res2 = _orchestrate(d, shadow, activation_date="2026-07-15")
        check(res2.verdict == orch.VERDICT_PASS, f"활성일 이후 → PASS: {res2.verdict}/{res2.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        store.rmtree_force(shadow)


def test_wait_lock_held():
    d = _write_env_dir()
    shadow = _mktmp()
    try:
        # 겹침 lock 을 미리 만들어 둔다 → 획득 실패 → WAIT.
        locks_dir = os.path.join(shadow, orch.LOCKS_SUBDIR)
        os.makedirs(locks_dir, exist_ok=True)
        with open(os.path.join(locks_dir, orch.LOCK_NAME), "w", encoding="utf-8") as f:
            f.write("{}\n")
        res = _orchestrate(d, shadow)
        check(res.verdict == orch.VERDICT_WAIT and orch.WAIT_LOCK_HELD in res.reasons,
              f"lock 보유 → WAIT/LOCK_HELD: {res.verdict}/{res.reasons}")
        check(not os.path.isdir(os.path.join(shadow, store.RUNS_SUBDIR)), "WAIT → run 없음")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        store.rmtree_force(shadow)


# ===========================================================================
# FAIL — 멈춰야 하는 실제 결함(fail-closed).
# ===========================================================================
def test_fail_synthetic_marker():
    d = _mktmp()
    shadow = _mktmp()
    try:
        meta, stocks, prices = make_envelope()
        meta["provenance"] = {"syntheticTest": True, "marker": e2e.SYNTHETIC_MARKER}
        write_envelope(d, meta, stocks, prices)
        res = _orchestrate(d, shadow)
        check(res.verdict == orch.VERDICT_FAIL and orch.FAIL_SYNTHETIC_MARKER in res.reasons,
              f"합성 마커 → FAIL/SYNTHETIC_MARKER: {res.verdict}/{res.reasons}")
        check(not os.path.isdir(os.path.join(shadow, store.RUNS_SUBDIR)), "FAIL → run 없음")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        store.rmtree_force(shadow)


def test_fail_public_path_leak():
    d = _write_env_dir()
    try:
        bad_root = os.path.join(ROOT, "public", "data")
        env = mi.load_envelope(d)
        res = orch.orchestrate(envelope=env, calendar=CALENDAR, calendar_doc=CALENDAR_DOC, cfg=CONFIG,
                               shadow_root=bad_root, mode="scheduled")
        check(res.verdict == orch.VERDICT_FAIL and orch.FAIL_PUBLIC_PATH_LEAK in res.reasons,
              f"public 루트 → FAIL/PUBLIC_PATH_LEAK: {res.verdict}/{res.reasons}")
        leaked = os.path.join(ROOT, "public", "data", mi.INPUTS_SUBDIR)
        check(not os.path.exists(leaked), "public/data/inputs 누출 없음")
    finally:
        shutil.rmtree(d, ignore_errors=True)


def test_fail_same_date_conflict():
    d = _write_env_dir()
    shadow = _mktmp()
    d2 = _mktmp()
    try:
        r1 = _orchestrate(d, shadow)
        check(r1.verdict == orch.VERDICT_PASS, f"1회차 PASS: {r1.reasons}")
        # 같은 marketDate 인데 한 종목 가격을 바꾼 다른 envelope → 다른 snapshotId → conflict.
        bad = _tickers(138)[0]
        def mut(t):
            if t == bad:
                pts = [{"d": x, "c": 200.0 + (i % 3), "v": 2000} for i, x in enumerate(_date_series(MARKET_DATE, MIN_PRICES + 5))]
                return {"points": pts}
            return None
        meta, stocks, prices = make_envelope(per_ticker=mut)
        write_envelope(d2, meta, stocks, prices)
        r2 = _orchestrate(d2, shadow)
        check(r2.verdict == orch.VERDICT_FAIL and orch.FAIL_CONFLICT in r2.reasons,
              f"같은 날 변경 입력 → FAIL/SAME_DATE_CONFLICT: {r2.verdict}/{r2.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        shutil.rmtree(d2, ignore_errors=True)
        store.rmtree_force(shadow)


def test_fail_universe_drift():
    d = _write_env_dir(count=137)
    shadow = _mktmp()
    try:
        res = _orchestrate(d, shadow)
        check(res.verdict == orch.VERDICT_FAIL, f"유니버스 137 → FAIL: {res.verdict}/{res.reasons}")
        check(mi.UNIVERSE_COUNT_MISMATCH in res.reasons, f"UNIVERSE_COUNT_MISMATCH 노출: {res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        store.rmtree_force(shadow)


def test_fail_malformed_envelope():
    d = _mktmp()
    shadow = _mktmp()
    try:
        meta, stocks, prices = make_envelope()
        write_envelope(d, meta, stocks, prices, corrupt_stocks=True)
        res = _orchestrate(d, shadow)
        check(res.verdict == orch.VERDICT_FAIL and mi.ENVELOPE_MALFORMED in res.reasons,
              f"손상 envelope → FAIL/ENVELOPE_MALFORMED: {res.verdict}/{res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        store.rmtree_force(shadow)


# ===========================================================================
# explicit 모드.
# ===========================================================================
def test_explicit_match_pass():
    d = _write_env_dir()
    shadow = _mktmp()
    try:
        res = _orchestrate(d, shadow, mode="explicit", market_date=MARKET_DATE)
        check(res.verdict == orch.VERDICT_PASS, f"explicit 일치 → PASS: {res.verdict}/{res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        store.rmtree_force(shadow)


def test_explicit_not_fresh_wait():
    d = _write_env_dir()  # envelope proven=2026-07-16
    shadow = _mktmp()
    try:
        res = _orchestrate(d, shadow, mode="explicit", market_date="2026-07-17")  # 요청이 더 미래
        check(res.verdict == orch.VERDICT_WAIT and orch.WAIT_ALREADY_WAITING in res.reasons,
              f"proven<requested → WAIT/INPUT_NOT_FRESH: {res.verdict}/{res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        store.rmtree_force(shadow)


def test_explicit_request_stale_fail():
    d = _write_env_dir()  # proven=2026-07-16
    shadow = _mktmp()
    try:
        res = _orchestrate(d, shadow, mode="explicit", market_date="2026-07-15")  # 요청이 더 과거
        check(res.verdict == orch.VERDICT_FAIL and orch.FAIL_REQUEST_STALE in res.reasons,
              f"proven>requested → FAIL/REQUEST_STALE: {res.verdict}/{res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        store.rmtree_force(shadow)


# ===========================================================================
# 불변식 — 버킷 분할·추적 파일 무변경·결정성·순수성.
# ===========================================================================
def test_adapter_reason_partition():
    wait = set(orch.ADAPTER_WAIT_REASONS)
    fail = set(orch.ADAPTER_FAIL_REASONS)
    allr = set(mi.ALL_REASONS)
    check(wait | fail == allr, f"버킷 합집합이 ALL_REASONS 와 달라: {(wait | fail) ^ allr}")
    check(not (wait & fail), f"WAIT/FAIL 버킷 겹침: {wait & fail}")
    # hard 결함은 절대 WAIT 로 새지 않는다.
    for hard in (mi.SYNTHETIC_MARKER_PRESENT, mi.OUTPUT_NOT_PRIVATE, mi.OUTPUT_NOT_UNDER_INPUTS,
                 mi.ENVELOPE_MALFORMED, mi.UNIVERSE_COUNT_MISMATCH, mi.DUPLICATE_TICKER,
                 mi.CONFIG_MISSING, mi.CONFIG_ENGINE_MISMATCH, mi.SOURCE_DATE_FUTURE):
        check(hard in fail, f"hard 결함 {hard} 이 FAIL 버킷에 없음")


def test_no_tracked_files_dirtied():
    """모든 산출물은 shadow 루트 아래여야 하며 추적 docs/게이트 파일을 건드리지 않는다."""
    d = _write_env_dir()
    shadow = _mktmp()
    # 추적 게이트 문서의 기존 내용(있으면)을 스냅샷.
    tracked = [os.path.join(ROOT, "docs", "metrics-2.5.1-rollout-gate.json"),
               os.path.join(ROOT, "docs", "metrics-2.5.1-rollout-gate.md")]
    before = {p: (open(p, "rb").read() if os.path.exists(p) else None) for p in tracked}
    try:
        res = _orchestrate(d, shadow)
        check(res.verdict == orch.VERDICT_PASS, "해피패스 PASS")
        for p in res.writtenPaths:
            check(_under(p, shadow), f"산출물 {p} 가 shadow 밖")
        for p in tracked:
            after = open(p, "rb").read() if os.path.exists(p) else None
            check(after == before[p], f"추적 파일 {p} 가 변경됨(오염)")
        # shadow 루트는 docs/ 밖(게이트 문서가 추적 docs/ 로 새지 않음).
        check(not _under(shadow, os.path.join(ROOT, "docs")), "shadow 는 docs/ 밖")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        store.rmtree_force(shadow)


def test_determinism():
    d = _write_env_dir()
    s1 = _mktmp()
    s2 = _mktmp()
    try:
        r1 = _orchestrate(d, s1)
        r2 = _orchestrate(d, s2)
        # 경로(shadow 루트)만 다르고 판정/사유/게이트/해시는 동일해야 한다.
        check(r1.verdict == r2.verdict and r1.reasons == r2.reasons, "판정/사유 결정적")
        check(r1.marketDate == r2.marketDate, "marketDate 결정적")
        check(r1.phases.get("inputs", {}).get("assemblyHash") == r2.phases.get("inputs", {}).get("assemblyHash"),
              "assemblyHash 결정적")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        store.rmtree_force(s1)
        store.rmtree_force(s2)


def test_source_purity():
    """오케스트레이터 소스에 벽시계/난수/네트워크 API 가 없어야 한다."""
    raw = open(os.path.join(HERE, "metrics251_orchestrator.py"), encoding="utf-8").read()
    src = "\n".join(line.split("#", 1)[0] for line in raw.splitlines())
    forbidden = [
        r"datetime\.now", r"date\.today", r"time\.time\(", r"time\.monotonic",
        r"random\.", r"urllib", r"requests\.", r"http\.client", r"socket\.",
        r"\bfrom\s+urllib", r"\bimport\s+socket\b", r"\bimport\s+requests\b",
    ]
    for pat in forbidden:
        check(re.search(pat, src) is None, f"금칙 API 발견: {pat}")


def test_no_write_on_wait_or_fail_leaves_clean_root():
    """WAIT/FAIL 은 run/원장을 만들지 않는다(무-run 조작 증명)."""
    # FAIL(합성) 케이스에서 runs/ledger 미생성.
    d = _mktmp()
    shadow = _mktmp()
    try:
        meta, stocks, prices = make_envelope(source="synthetic sample fixture")
        write_envelope(d, meta, stocks, prices)
        res = _orchestrate(d, shadow)
        check(res.verdict == orch.VERDICT_FAIL, f"텍스트 합성 힌트 → FAIL: {res.verdict}/{res.reasons}")
        check(not os.path.exists(os.path.join(shadow, "ledger.json")), "FAIL → 원장 없음")
        check(not os.path.isdir(os.path.join(shadow, store.RUNS_SUBDIR)), "FAIL → run 없음")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        store.rmtree_force(shadow)


def main():
    tests = [
        test_scheduled_pass_published,
        test_idempotent_rerun_already_recorded,
        test_wait_weekend,
        test_explicit_value_unavailable_passes,
        test_wait_missing_current_input,
        test_wait_publication_grace_ambiguous,
        test_wait_stale_source,
        test_wait_pre_activation,
        test_wait_lock_held,
        test_fail_synthetic_marker,
        test_fail_public_path_leak,
        test_fail_same_date_conflict,
        test_fail_universe_drift,
        test_fail_malformed_envelope,
        test_explicit_match_pass,
        test_explicit_not_fresh_wait,
        test_explicit_request_stale_fail,
        test_adapter_reason_partition,
        test_no_tracked_files_dirtied,
        test_determinism,
        test_source_purity,
        test_no_write_on_wait_or_fail_leaves_clean_root,
    ]
    for t in tests:
        try:
            t()
        except Exception as e:  # noqa: BLE001  (테스트 하네스 — 예외도 실패로 수집)
            import traceback
            failures.append(f"{t.__name__} 예외: {e!r}\n{traceback.format_exc()}")

    if failures:
        print(f"[FAIL] metrics251_orchestrator 계약 검증 {len(failures)}건 실패:")
        for x in failures:
            print(f"  - {x}")
        return 1

    print(f"[PASS] metrics251_orchestrator 계약 검증 통과 ({len(tests)} 케이스: "
          "PASS(scheduled 해피패스+멱등)·WAIT(주말·입력결측·게시유예·stale·활성일이전·lock)·"
          "FAIL(합성·공개누출·같은날충돌·유니버스드리프트·손상)·explicit(일치/미신선/요청낡음)·"
          "버킷분할·추적파일무변경·결정성·순수성·WAIT/FAIL무-run).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
