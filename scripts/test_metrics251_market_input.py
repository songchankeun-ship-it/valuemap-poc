#!/usr/bin/env python3
# ORNScore 장마감 운영 자동화 배치 — Slice B 입력 어댑터 계약 게이트.
#   (governing plan: docs/ornscore-market-close-automation-2026-07-19.md · Metrics 2.5.1 설계서 §8.)
#
# 강제하는 계약(전부 오프라인·fixture·결정적 — 네트워크/벽시계/난수 없음):
#   A. 해피패스: 138 유니크 종목·공통 거래일·정확 소스일·필수 PER/PBR·충분 이력 → OK,
#      inputs/ 에 request/calendar/report 기록, request 는 preflight/engine 가 실제로 수용.
#   B. corrupt: stocks.json 파손 → ENVELOPE_MALFORMED, 무기록.
#   C. partial: 가격파일 결측은 거부; 명시적 PER·PBR 결측은 factor-level 제외; 모호한 결측은 거부.
#   D. stale: asOfBusinessDate < marketDate → SOURCE_DATE_STALE(+MISMATCH), 무기록.
#   E. mixed-date: 가격 시계열 종료일 불일치 → MARKET_DATE_AMBIGUOUS, 무기록.
#   F. duplicate: 중복 ticker → DUPLICATE_TICKER, 무기록.
#   G. synthetic-marker: 합성/테스트 마커 → SYNTHETIC_MARKER_PRESENT, 무기록.
#   H. public-path-write: 출력이 public/ 밑 → OUTPUT_NOT_PRIVATE, 무기록(public/ 미변경).
#   I. 추가 fail-closed: 이력 부족·미래 소스일·거래일 아님·캘린더 결측·유니버스 수·비양수 PER/PBR·
#      비양수 종가·음수 거래량·config 엔진 불일치.
#   J. 안전 명제: 조립 output request 는 합성 마커를 싣지 않는다(genuine-run 게이트 통과).
#   K. 결정성·순수성: 2회 조립 바이트 동일·assemblyHash 동일 · 소스에 금칙 API 없음.
#
# Usage:
#   $env:PYTHONUTF8='1'; python scripts/test_metrics251_market_input.py
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

import metrics251_market_input as mi         # noqa: E402
import metrics251_engine as eng              # noqa: E402
import metrics251_preflight as pf            # noqa: E402
import metrics251_snapshot_store as store    # noqa: E402
import metrics251_e2e_matrix as e2e          # noqa: E402
from metrics251_compare import FixtureTradingCalendar  # noqa: E402

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


# ---------------------------------------------------------------------------
# 결정적 fixture 빌더 — 138 종목 envelope + prices/{ticker}.json 를 tempdir 에 만든다.
#   벽시계 아님: 날짜는 고정 marketDate 에서 역산(datetime 은 리터럴 입력에서만 파생).
# ---------------------------------------------------------------------------
CONFIG = mi.load_config()
MIN_PRICES, MIN_VOLUMES = mi.required_history(CONFIG)   # (253, 20)
MARKET_DATE = "2026-07-16"                              # 목요일(거래일)
AS_OF = "20260716"

CALENDAR_DOC = {"range": {"start": "2026-01-01", "end": "2026-12-31"},
                "weekendWeekdays": [5, 6], "holidays": []}
CALENDAR = FixtureTradingCalendar.from_fixture(CALENDAR_DOC)


def _date_series(end_date, n):
    """end_date 로 끝나는 n개의 오름차순 날짜 문자열(하루 간격, 결정적)."""
    end = datetime.date.fromisoformat(end_date)
    return [(end - datetime.timedelta(days=(n - 1 - i))).isoformat() for i in range(n)]


def _tickers(count):
    return [f"{100000 + i:06d}" for i in range(count)]


def make_envelope(*, count=138, points=MIN_PRICES + 5, market_date=MARKET_DATE, as_of=AS_OF,
                  source="FDR + Naver + yfinance", per=12.5, pbr=1.4, extra_meta=None,
                  per_ticker=None):
    """envelope dict 를 만든다(디스크에 쓰기 전 in-memory 표현).

    per_ticker(ticker)->dict 로 개별 종목/시계열을 변형할 수 있다(fault 주입).
    반환: (meta, stocks, prices) — write_envelope 로 디스크에 기록.
    """
    meta = {"count": count, "asOfBusinessDate": as_of, "metricsVersion": "2.4",
            "source": source, "generatedAt": "2026-07-17T09:46:56"}
    if extra_meta:
        meta.update(extra_meta)
    stocks = []
    prices = {}
    for t in _tickers(count):
        stocks.append({"ticker": t, "name": f"종목{t}", "per": per, "pbr": pbr})
        dates = _date_series(market_date, points)
        pts = [{"d": dates[i], "c": 100.0 + (i % 7), "v": 1000 + (i % 5)} for i in range(points)]
        prices[t] = pts
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
            json.dump({"ticker": t, "count": len(pts), "from": pts[0]["d"] if pts else None,
                       "to": pts[-1]["d"] if pts else None, "points": pts}, f, ensure_ascii=False)


def _mktmp():
    return tempfile.mkdtemp(prefix="m251_market_input_")


def _assemble_dir(dirpath, *, calendar=CALENDAR, source_mode="fixture"):
    env = mi.load_envelope(dirpath)
    return mi.assemble(env, calendar, CONFIG, source_mode=source_mode)


# ---------------------------------------------------------------------------
# A. 해피패스 + 기록 + preflight/engine 수용.
# ---------------------------------------------------------------------------
def test_happy_path_and_write():
    d = _mktmp()
    shadow = _mktmp()
    try:
        meta, stocks, prices = make_envelope()
        write_envelope(d, meta, stocks, prices)
        env = mi.load_envelope(d)
        res = mi.assemble_and_write(env, CALENDAR, CONFIG, shadow, CALENDAR_DOC, source_mode="fixture")
        check(res.ok, f"해피패스 ok 여야 함: {res.reasons}")
        check(res.marketDate == MARKET_DATE, f"marketDate {res.marketDate}")
        check(res.request is not None and len(res.request["stocks"]) == 138, "138 종목 request")
        # ticker 정렬(결정적 순서).
        tks = [s["ticker"] for s in res.request["stocks"]]
        check(tks == sorted(tks), "stocks 는 ticker 오름차순")
        # 소스일 상호일관.
        sd = res.request["sourceDates"]
        check(sd == {"prices": MARKET_DATE, "volumes": MARKET_DATE, "fundamentals": MARKET_DATE},
              f"소스일 상호일관: {sd}")
        # 기록된 파일 3개(request/calendar/report).
        inputs = os.path.join(shadow, mi.INPUTS_SUBDIR)
        for name in (mi.ARTIFACT_REQUEST, mi.ARTIFACT_CALENDAR, mi.ARTIFACT_REPORT):
            check(os.path.isfile(os.path.join(inputs, name)), f"{name} 기록됨")
        # request 는 preflight 를 통과해야 한다(config/shadowRoot/outputLocation 주입 = run CLI 방식).
        run_req = dict(res.request)
        run_req["config"] = CONFIG
        run_req["shadowRoot"] = shadow
        run_req["outputLocation"] = os.path.join(shadow, store.RUNS_SUBDIR, "run")
        pre = pf.preflight_market_day(run_req, CALENDAR, [])
        check(pre.ok, f"조립 request 가 preflight 통과해야 함: {pre.reasons}")
        # engine 이 실제로 스냅샷을 만든다(runnable 증명).
        eres = eng.compute_snapshot(eng.EngineRequest.from_dict(dict(res.request, config=CONFIG)))
        check(eres.snapshot is not None, f"engine 스냅샷 성립: {eres.nullReasons}")
        # 안전 명제: 조립된 output request 는 합성 마커를 싣지 않는다.
        check(not e2e.carries_synthetic_marker(res.request), "output request 는 합성 마커 없음")
        # report 의 assemblyHash == request canonical sha256.
        rep = json.load(open(os.path.join(inputs, mi.ARTIFACT_REPORT), encoding="utf-8"))
        check(rep["assemblyHash"] == res.assemblyHash, "report.assemblyHash 일치")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        shutil.rmtree(shadow, ignore_errors=True)


# ---------------------------------------------------------------------------
# B. corrupt.
# ---------------------------------------------------------------------------
def test_corrupt_envelope():
    d = _mktmp()
    try:
        meta, stocks, prices = make_envelope()
        write_envelope(d, meta, stocks, prices, corrupt_stocks=True)
        res = _assemble_dir(d)
        check(not res.ok and mi.ENVELOPE_MALFORMED in res.reasons,
              f"corrupt → ENVELOPE_MALFORMED: {res.reasons}")
        check(res.request is None, "corrupt → 무 request")
    finally:
        shutil.rmtree(d, ignore_errors=True)


# ---------------------------------------------------------------------------
# C. partial — 가격파일 결측 · 명시적/모호한 PER/PBR 결측.
# ---------------------------------------------------------------------------
def test_partial_missing_price_file():
    d = _mktmp()
    try:
        drop = _tickers(138)[7]
        meta, stocks, prices = make_envelope(
            per_ticker=lambda t: {"drop_price_file": True} if t == drop else None)
        write_envelope(d, meta, stocks, prices)
        res = _assemble_dir(d)
        check(not res.ok and mi.PRICE_SERIES_MISSING in res.reasons,
              f"가격파일 결측 → PRICE_SERIES_MISSING: {res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)


def test_explicit_missing_fundamentals_allowed():
    d = _mktmp()
    try:
        miss = _tickers(138)[3]
        meta, stocks, prices = make_envelope(
            per_ticker=lambda t: {"stock": {"per": None, "pbr": None, "valueNA": True}} if t == miss else None)
        write_envelope(d, meta, stocks, prices)
        res = _assemble_dir(d)
        check(res.ok, f"explicit value unavailability must assemble: {res.reasons}")
        request_stock = next((s for s in res.request["stocks"] if s["ticker"] == miss), None)
        check(request_stock is not None, "explicitly unavailable stock must remain in the 138-stock request")
        check(request_stock and request_stock["per"] is None and request_stock["pbr"] is None,
              "adapter must preserve null PER/PBR without substitution")

        eres = eng.compute_snapshot(eng.EngineRequest.from_dict(dict(res.request, config=CONFIG)))
        check(eres.snapshot is not None, f"engine must accept factor-level missing value: {eres.nullReasons}")
        if eres.snapshot is not None:
            result_stock = next((s for s in eres.snapshot.stocks if s.ticker == miss), None)
            check(result_stock is not None, "engine snapshot must retain explicitly unavailable stock")
            check(result_stock and result_stock.factors["value"].reason == eng.MISSING_INPUT,
                  "missing PER/PBR must withhold only the value factor")
            check(result_stock and result_stock.compositeScore is None and not result_stock.rankingEligible,
                  "missing value factor must withhold composite and rank eligibility")
            check(eres.snapshot.factorPopulations["value"]["count"] == 137,
                  "value population must be 137/138")
            check(eres.snapshot.rankingPopulation["count"] == 137,
                  "ranking population must be 137/138")
    finally:
        shutil.rmtree(d, ignore_errors=True)


def test_ambiguous_missing_fundamentals_rejected():
    cases = [
        {"per": None, "pbr": None},
        {"per": None, "pbr": 1.4, "valueNA": True},
        {"per": 12.5, "pbr": None, "valueNA": True},
        {"per": 12.5, "pbr": 1.4, "valueNA": True},
    ]
    for mutation in cases:
        d = _mktmp()
        try:
            miss = _tickers(138)[3]
            meta, stocks, prices = make_envelope(
                per_ticker=lambda t, mutation=mutation: {"stock": mutation} if t == miss else None)
            write_envelope(d, meta, stocks, prices)
            res = _assemble_dir(d)
            check(not res.ok and mi.FUNDAMENTAL_MISSING in res.reasons,
                  f"ambiguous fundamental state must fail closed ({mutation}): {res.reasons}")
            check(res.request is None, f"ambiguous fundamental state must emit no request: {mutation}")
        finally:
            shutil.rmtree(d, ignore_errors=True)


# ---------------------------------------------------------------------------
# D. stale 소스일.
# ---------------------------------------------------------------------------
def test_stale_source_date():
    d = _mktmp()
    try:
        meta, stocks, prices = make_envelope(as_of="20260715")  # marketDate 2026-07-16 보다 과거
        write_envelope(d, meta, stocks, prices)
        res = _assemble_dir(d)
        check(not res.ok and mi.SOURCE_DATE_STALE in res.reasons,
              f"stale → SOURCE_DATE_STALE: {res.reasons}")
        check(mi.SOURCE_DATE_MISMATCH in res.reasons, "stale 는 상호 불일치이기도")
    finally:
        shutil.rmtree(d, ignore_errors=True)


# ---------------------------------------------------------------------------
# E. mixed-date — 한 종목만 다른 종료일.
# ---------------------------------------------------------------------------
def test_mixed_last_date():
    d = _mktmp()
    try:
        odd = _tickers(138)[42]
        def mut(t):
            if t == odd:
                pts = [{"d": x, "c": 100.0, "v": 1000} for x in _date_series("2026-07-15", MIN_PRICES + 5)]
                return {"points": pts}
            return None
        meta, stocks, prices = make_envelope(per_ticker=mut)
        write_envelope(d, meta, stocks, prices)
        res = _assemble_dir(d)
        check(not res.ok and mi.MARKET_DATE_AMBIGUOUS in res.reasons,
              f"mixed-date → MARKET_DATE_AMBIGUOUS: {res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)


# ---------------------------------------------------------------------------
# F. duplicate ticker.
# ---------------------------------------------------------------------------
def test_duplicate_ticker():
    d = _mktmp()
    try:
        meta, stocks, prices = make_envelope()
        stocks[5]["ticker"] = stocks[4]["ticker"]  # 중복 유발(count 는 여전히 138)
        write_envelope(d, meta, stocks, prices)
        res = _assemble_dir(d)
        check(not res.ok and mi.DUPLICATE_TICKER in res.reasons,
              f"중복 → DUPLICATE_TICKER: {res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)


# ---------------------------------------------------------------------------
# G. synthetic-marker — 구조적 마커 · 텍스트 힌트.
# ---------------------------------------------------------------------------
def test_synthetic_structural_marker():
    d = _mktmp()
    try:
        meta, stocks, prices = make_envelope()
        meta["provenance"] = {"syntheticTest": True, "marker": e2e.SYNTHETIC_MARKER}
        write_envelope(d, meta, stocks, prices)
        res = _assemble_dir(d)
        check(not res.ok and mi.SYNTHETIC_MARKER_PRESENT in res.reasons,
              f"구조적 마커 → SYNTHETIC_MARKER_PRESENT: {res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)


def test_synthetic_text_hint():
    d = _mktmp()
    try:
        meta, stocks, prices = make_envelope(source="synthetic sample fixture")
        write_envelope(d, meta, stocks, prices)
        res = _assemble_dir(d)
        check(not res.ok and mi.SYNTHETIC_MARKER_PRESENT in res.reasons,
              f"텍스트 힌트 → SYNTHETIC_MARKER_PRESENT: {res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)


# ---------------------------------------------------------------------------
# H. public-path-write rejection — 무기록 + public/ 미변경.
# ---------------------------------------------------------------------------
def test_public_path_write_rejected():
    d = _mktmp()
    try:
        meta, stocks, prices = make_envelope()
        write_envelope(d, meta, stocks, prices)
        env = mi.load_envelope(d)
        bad_root = os.path.join(ROOT, "public", "data")
        res = mi.assemble_and_write(env, CALENDAR, CONFIG, bad_root, CALENDAR_DOC, source_mode="fixture")
        check(not res.ok and mi.OUTPUT_NOT_PRIVATE in res.reasons,
              f"public 출력 → OUTPUT_NOT_PRIVATE: {res.reasons}")
        check(res.writtenPaths == [], "public 출력 → 무기록")
        # public/ 아래에 inputs 산출물이 생기지 않았는지.
        leaked = os.path.join(ROOT, "public", "data", mi.INPUTS_SUBDIR)
        check(not os.path.exists(leaked), "public/data/inputs 누출 없음")
        # resolve_inputs_dir 도 직접 거절.
        rid, rr = mi.resolve_inputs_dir(bad_root)
        check(rid is None and mi.OUTPUT_NOT_PRIVATE in rr, "resolve_inputs_dir public 거절")
    finally:
        shutil.rmtree(d, ignore_errors=True)


# ---------------------------------------------------------------------------
# I. 추가 fail-closed 계열.
# ---------------------------------------------------------------------------
def test_insufficient_history():
    d = _mktmp()
    try:
        meta, stocks, prices = make_envelope(points=MIN_PRICES - 1)  # 가격 이력 부족
        write_envelope(d, meta, stocks, prices)
        res = _assemble_dir(d)
        check(not res.ok and mi.INSUFFICIENT_PRICE_HISTORY in res.reasons,
              f"이력 부족 → INSUFFICIENT_PRICE_HISTORY: {res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)


def test_future_source_date():
    d = _mktmp()
    try:
        meta, stocks, prices = make_envelope(as_of="20260717")  # marketDate 보다 미래
        write_envelope(d, meta, stocks, prices)
        res = _assemble_dir(d)
        check(not res.ok and mi.SOURCE_DATE_FUTURE in res.reasons,
              f"미래 소스일 → SOURCE_DATE_FUTURE: {res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)


def test_non_trading_day():
    d = _mktmp()
    try:
        # 2026-07-18 은 토요일 → 거래일 아님.
        meta, stocks, prices = make_envelope(market_date="2026-07-18", as_of="20260718")
        write_envelope(d, meta, stocks, prices)
        res = _assemble_dir(d)
        check(not res.ok and mi.MARKET_DATE_NOT_TRADING_DAY in res.reasons,
              f"주말 → MARKET_DATE_NOT_TRADING_DAY: {res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)


def test_calendar_missing():
    d = _mktmp()
    try:
        meta, stocks, prices = make_envelope()
        write_envelope(d, meta, stocks, prices)
        res = _assemble_dir(d, calendar=None)
        check(not res.ok and mi.CALENDAR_MISSING in res.reasons,
              f"캘린더 결측 → CALENDAR_MISSING: {res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)


def test_universe_count():
    d = _mktmp()
    try:
        meta, stocks, prices = make_envelope(count=137)
        write_envelope(d, meta, stocks, prices)
        res = _assemble_dir(d)
        check(not res.ok and mi.UNIVERSE_COUNT_MISMATCH in res.reasons,
              f"137 → UNIVERSE_COUNT_MISMATCH: {res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)


def test_non_positive_fundamental():
    d = _mktmp()
    try:
        bad = _tickers(138)[9]
        meta, stocks, prices = make_envelope(
            per_ticker=lambda t: {"stock": {"per": -1.0}} if t == bad else None)
        write_envelope(d, meta, stocks, prices)
        res = _assemble_dir(d)
        check(not res.ok and mi.FUNDAMENTAL_NON_POSITIVE in res.reasons,
              f"per<=0 → FUNDAMENTAL_NON_POSITIVE: {res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)


def test_non_positive_price_and_negative_volume():
    d = _mktmp()
    try:
        bad = _tickers(138)[11]
        def mut(t):
            if t == bad:
                pts = [{"d": x, "c": 100.0, "v": 1000} for x in _date_series(MARKET_DATE, MIN_PRICES + 5)]
                pts[0]["c"] = 0.0      # 비양수 종가
                pts[1]["v"] = -5       # 음수 거래량
                return {"points": pts}
            return None
        meta, stocks, prices = make_envelope(per_ticker=mut)
        write_envelope(d, meta, stocks, prices)
        res = _assemble_dir(d)
        check(not res.ok and mi.PRICE_NON_POSITIVE in res.reasons and mi.VOLUME_NEGATIVE in res.reasons,
              f"비양수 종가/음수 거래량 → PRICE_NON_POSITIVE+VOLUME_NEGATIVE: {res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)


def test_config_engine_mismatch():
    d = _mktmp()
    try:
        meta, stocks, prices = make_envelope()
        write_envelope(d, meta, stocks, prices)
        env = mi.load_envelope(d)
        bad_cfg = copy.deepcopy(CONFIG)
        bad_cfg["engineVersion"] = "9.9.9"
        res = mi.assemble(env, CALENDAR, bad_cfg, source_mode="fixture")
        check(not res.ok and mi.CONFIG_ENGINE_MISMATCH in res.reasons,
              f"엔진 불일치 → CONFIG_ENGINE_MISMATCH: {res.reasons}")
    finally:
        shutil.rmtree(d, ignore_errors=True)


# ---------------------------------------------------------------------------
# K. 결정성 + 순수성.
# ---------------------------------------------------------------------------
def test_determinism():
    d = _mktmp()
    try:
        meta, stocks, prices = make_envelope()
        write_envelope(d, meta, stocks, prices)
        r1 = _assemble_dir(d)
        r2 = _assemble_dir(d)
        check(r1.ok and r2.ok, "결정성 케이스는 통과해야")
        from metrics251_config import canonical_bytes
        check(canonical_bytes(r1.request) == canonical_bytes(r2.request), "2회 조립 request 바이트 동일")
        check(r1.assemblyHash == r2.assemblyHash, "assemblyHash 동일")
    finally:
        shutil.rmtree(d, ignore_errors=True)


def test_source_purity():
    """어댑터 소스에 벽시계/난수/네트워크 API 가 없어야 한다(결정성·오프라인 보장).

    주석(#…)에는 금지 API 를 '설명'하므로, 코드 라인만 남기고 주석을 제거한 뒤 스캔한다.
    """
    raw = open(os.path.join(HERE, "metrics251_market_input.py"), encoding="utf-8").read()
    src = "\n".join(line.split("#", 1)[0] for line in raw.splitlines())
    forbidden = [
        r"datetime\.now", r"date\.today", r"time\.time\(", r"time\.monotonic",
        r"random\.", r"urllib", r"requests\.", r"http\.client", r"socket\.",
        r"\bfrom\s+urllib", r"\bimport\s+socket\b", r"\bimport\s+requests\b",
    ]
    for pat in forbidden:
        check(re.search(pat, src) is None, f"금칙 API 발견: {pat}")


def test_no_write_on_failure():
    """--write 경로여도 실패면 inputs/ 아래 아무 파일도 만들지 않는다."""
    d = _mktmp()
    shadow = _mktmp()
    try:
        meta, stocks, prices = make_envelope(count=137)  # 실패 유발
        write_envelope(d, meta, stocks, prices)
        env = mi.load_envelope(d)
        res = mi.assemble_and_write(env, CALENDAR, CONFIG, shadow, CALENDAR_DOC, source_mode="fixture")
        check(not res.ok, "실패해야")
        check(res.writtenPaths == [], "실패 → 무기록")
        inputs = os.path.join(shadow, mi.INPUTS_SUBDIR)
        check(not os.path.exists(inputs), "실패 → inputs/ 디렉터리 미생성")
    finally:
        shutil.rmtree(d, ignore_errors=True)
        shutil.rmtree(shadow, ignore_errors=True)


def main():
    tests = [
        test_happy_path_and_write,
        test_corrupt_envelope,
        test_partial_missing_price_file,
        test_explicit_missing_fundamentals_allowed,
        test_ambiguous_missing_fundamentals_rejected,
        test_stale_source_date,
        test_mixed_last_date,
        test_duplicate_ticker,
        test_synthetic_structural_marker,
        test_synthetic_text_hint,
        test_public_path_write_rejected,
        test_insufficient_history,
        test_future_source_date,
        test_non_trading_day,
        test_calendar_missing,
        test_universe_count,
        test_non_positive_fundamental,
        test_non_positive_price_and_negative_volume,
        test_config_engine_mismatch,
        test_determinism,
        test_source_purity,
        test_no_write_on_failure,
    ]
    for t in tests:
        try:
            t()
        except Exception as e:  # noqa: BLE001  (테스트 하네스 — 예외도 실패로 수집)
            failures.append(f"{t.__name__} 예외: {e!r}")

    if failures:
        print(f"[FAIL] metrics251_market_input 계약 검증 {len(failures)}건 실패:")
        for x in failures:
            print(f"  - {x}")
        return 1

    print(f"[PASS] metrics251_market_input 계약 검증 통과 ({len(tests)} 케이스: "
          "해피패스+기록+preflight/engine수용·corrupt·partial(가격/재무)·stale·mixed-date·duplicate·"
          "synthetic(구조/텍스트)·public-path-write거절·이력부족·미래소스일·거래일아님·캘린더결측·"
          "유니버스수·비양수PER/PBR·비양수종가/음수거래량·config엔진불일치·결정성·순수성·실패시무기록).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
