#!/usr/bin/env python3
# Metrics 2.5.1 역사/차등 검증 하네스 게이트 — Slice H.
#
# 강제하는 계약(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D03, §7 Gate 3,
#      §10 Slice H):
#   REF.  2.4 참조 산식이 공개 정본 scripts/compute_metrics.py 를 충실히 재현한다(현재 유니버스
#         저장 근거 returns/flowStats/volStats 와 대조) — strawman 이 아닌 실제 2.4 를 비교 기준으로 쓴다.
#   RAW.  두 방식 모두 유효한 factor 는 동일 창에서 원시값이 수치적으로 동치다(신뢰성 핵심 주장).
#   CLS.  차등 분류가 다섯 버킷을 정확히 구분한다: AGREE / INTENDED_METHOD_CHANGE(백분위 방식·
#         최소 이력 임계·결측 정책) / DATA_QUALITY_FINDING / UNAVAILABLE_COMPARISON / P0_MISMATCH.
#   P0.   P0 탐지가 실제로 발화한다 — 양쪽 유효인데 원시값이 어긋나면 P0(회귀 가드가 살아있음).
#   PIT.  point-in-time 재무 가드 — 시점별 재무가 없으면 밸류·종합을 봉쇄하고(computed=False)
#         과거 성과를 산출·주장하지 않는다. 현재 재무를 과거로 복사하지 않는다(§M251-D03).
#   FIX.  결측 거래일·상장기간 부족(short listing)·동률(tie)·기업행동 의심·시점별 재무 부재 fixture.
#   DET.  같은 입력의 반복 평가/재실행 결과가 바이트 동일(결정적).
#   PURE. 소스에 벽시계/난수/네트워크 흔적이 없고, 공개 public/ 데이터에 쓰지 않는다(읽기 전용).
#   REAL. 로컬 최소 252 시장일 실데이터 재실행이 P0=0(clean) 이고 최소 시장일 요건을 만족한다.
#
# Usage:
#   $env:PYTHONUTF8='1'; python scripts/test_metrics251_replay.py
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import metrics251_replay as R  # noqa: E402
import metrics251_engine as eng  # noqa: E402
import metrics251_primitives as primitives  # noqa: E402

FIXDIR = os.path.join(HERE, "fixtures", "metrics251")
FIXTURES = json.load(open(os.path.join(FIXDIR, "replay_fixtures.json"), encoding="utf-8"))
CFG = R.load_config()

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


def _win(fix, idx=0):
    w = FIXTURES[fix]["stocks"][idx]["window"]
    return [p["c"] for p in w], [p["v"] for p in w]


# ===========================================================================
# REF. 2.4 참조 산식이 공개 정본을 재현한다(현재 유니버스 저장 근거와 대조).
# ===========================================================================
def test_reference_matches_stored_24():
    """clean fixture 는 합성이므로, 실 stocks.json 의 저장 근거로 2.4 참조 충실성을 대조한다."""
    stocks_path = os.path.join(ROOT, "public", "data", "stocks.json")
    with open(stocks_path, encoding="utf-8-sig") as f:
        stocks = json.load(f)["stocks"]
    checked = 0
    for s in stocks:
        tk = str(s.get("ticker"))
        pp = os.path.join(R.PRICES_DIR, f"{tk}.json")
        if not os.path.exists(pp):
            continue
        pts = R._read_price_points(tk)
        wnd = R.point_in_time_window(pts, pts[-1]["d"])  # 현재-날짜 창(2.4 load_prices 정합)
        prices = [p["c"] for p in wnd]
        vols = [p["v"] for p in wnd]
        # 거래활성도 ratio 는 저장 flowStats.ratio 와 일치해야 한다(2.4 참조 충실성).
        ratio, reason = R.ref24_activity_ratio(vols)
        stored_ratio = (s.get("flowStats") or {}).get("ratio")
        if reason == eng.VALID and isinstance(stored_ratio, (int, float)):
            check(abs(round(ratio, 2) - stored_ratio) <= 0.01,
                  f"{tk} 2.4 참조 ratio {round(ratio,2)} != 저장 flowStats.ratio {stored_ratio}")
            checked += 1
        # 위험조정 sharpe 도 저장 volStats.sharpe 와 일치.
        sharpe, sreason = R.ref24_risk_sharpe(prices)
        stored_sharpe = (s.get("volStats") or {}).get("sharpe")
        if sreason == eng.VALID and isinstance(stored_sharpe, (int, float)):
            check(abs(round(sharpe, 2) - stored_sharpe) <= 0.02,
                  f"{tk} 2.4 참조 sharpe {round(sharpe,2)} != 저장 volStats.sharpe {stored_sharpe}")
    check(checked >= 100, f"2.4 참조 대조 표본 부족: {checked}")


# ===========================================================================
# RAW. 두 방식 모두 유효한 factor 는 동일 창에서 원시값이 수치적으로 동치다.
# ===========================================================================
def test_raw_equivalence_clean():
    prices, vols = _win("clean", 0)
    rm, sm = R.ref24_momentum_raw(prices), eng.momentum_raw(prices, CFG)
    check(rm[1] == eng.VALID and sm[1] == eng.VALID, "clean 모멘텀 미유효")
    # 2.4 는 퍼센트, 2.5.1 은 분수 — /100 정규화 후 동치.
    check(R._close_enough(rm[0] / 100.0, sm[0]), f"모멘텀 원시값 불일치 {rm[0]/100.0} vs {sm[0]}")
    rr, sr = R.ref24_risk_sharpe(prices), eng.risk_adjusted_raw(prices, CFG)
    check(rr[1] == eng.VALID and sr[1] == eng.VALID, "clean 위험조정 미유효")
    check(R._close_enough(rr[0], sr[0]), f"위험조정 원시값 불일치 {rr[0]} vs {sr[0]}")
    ra, sa = R.ref24_activity_ratio(vols), eng.activity_ratio(vols, CFG)
    check(ra[1] == eng.VALID and sa[1] == eng.VALID, "clean 거래활성도 미유효")
    check(R._close_enough(ra[0], sa[0]), f"거래활성도 원시값 불일치 {ra[0]} vs {sa[0]}")


# ===========================================================================
# CLS. 다섯 버킷을 정확히 구분한다(분류기 직접 검사).
# ===========================================================================
def test_classify_buckets():
    V = eng.VALID
    # 양쪽 유효·원시 동일·점수 동일 → AGREE.
    check(R.classify_factor("m", 0.1, V, 50.0, 0.1, V, 50.0, []) == (R.CLS_AGREE, None), "AGREE 오분류")
    # 양쪽 유효·원시 동일·점수 상이 → INTENDED/PERCENTILE.
    check(R.classify_factor("m", 0.1, V, 40.0, 0.1, V, 60.0, []) == (R.CLS_INTENDED, R.METHOD_PERCENTILE),
          "INTENDED(PERCENTILE) 오분류")
    # 양쪽 유효·원시 상이 → P0.
    check(R.classify_factor("m", 0.10, V, 40.0, 0.20, V, 60.0, []) == (R.CLS_P0, None), "P0 오분류")
    # 한쪽만 유효(2.5.1 INSUFFICIENT) → INTENDED/MIN_HISTORY.
    check(R.classify_factor("m", 0.1, V, 40.0, None, eng.INSUFFICIENT_HISTORY, None, [])
          == (R.CLS_INTENDED, R.METHOD_MIN_HISTORY), "INTENDED(MIN_HISTORY) 오분류")
    # 한쪽만 유효·제외 사유가 MISSING_INPUT → DATA_QUALITY.
    check(R.classify_factor("m", 0.1, V, 40.0, None, eng.MISSING_INPUT, None, [])[0] == R.CLS_DATA_QUALITY,
          "DATA_QUALITY(MISSING_INPUT) 오분류")
    # 한쪽만 유효·창 데이터 문제(비양수 가격) → DATA_QUALITY.
    check(R.classify_factor("m", 0.1, V, 40.0, None, eng.INSUFFICIENT_HISTORY, None, [R.DQ_NON_POSITIVE_PRICE])[0]
          == R.CLS_DATA_QUALITY, "DATA_QUALITY(창 품질) 오분류")
    # 양쪽 무효·데이터 문제 없음 → UNAVAILABLE/BOTH_EXCLUDED.
    check(R.classify_factor("m", None, eng.INSUFFICIENT_HISTORY, None, None, eng.INSUFFICIENT_HISTORY, None, [])
          == (R.CLS_UNAVAILABLE, R.UN_BOTH_EXCLUDED), "UNAVAILABLE 오분류")
    # 양쪽 무효·데이터 문제 → DATA_QUALITY.
    check(R.classify_factor("m", None, eng.INSUFFICIENT_HISTORY, None, None, eng.INSUFFICIENT_HISTORY, None,
                            [R.DQ_ZERO_VOLUME_WINDOW])[0] == R.CLS_DATA_QUALITY, "양쪽무효 DATA_QUALITY 오분류")


# ===========================================================================
# P0. P0 탐지가 실제로 발화한다(회귀 가드 생존 증명).
# ===========================================================================
def test_p0_detector_fires():
    b, _ = R.classify_factor("risk", 1.234, eng.VALID, 70.0, 1.999, eng.VALID, 30.0, [])
    check(b == R.CLS_P0, "원시값 어긋난 양쪽-유효가 P0 로 잡히지 않음(회귀 가드 죽음)")
    # 반대로 동일 원시값은 절대 P0 가 아니다.
    b2, _ = R.classify_factor("risk", 1.234, eng.VALID, 70.0, 1.234 + 1e-12, eng.VALID, 30.0, [])
    check(b2 != R.CLS_P0, "동일 원시값(잡음)이 P0 로 오탐")


# ===========================================================================
# PIT. point-in-time 재무 가드 — 밸류·종합 봉쇄, 과거 성과 미산출.
# ===========================================================================
def test_point_in_time_guard():
    g = R.value_composite_guard(False)
    check(g["bucket"] == R.CLS_UNAVAILABLE and g["code"] == R.NO_POINT_IN_TIME_FUNDAMENTALS,
          "재무 부재 가드가 UNAVAILABLE/NO_POINT_IN_TIME_FUNDAMENTALS 아님")
    check(g["computed"] is False, "재무 부재인데 밸류·종합을 산출(computed=True)")
    # 시점별 재무가 '표시'돼도 이 하네스는 역사 밸류·종합 성과를 산출하지 않는다.
    g2 = R.value_composite_guard(True)
    check(g2["computed"] is False, "하네스가 역사 밸류·종합 성과를 산출함(성과 백테스트 금지 위반)")
    # noPointInTimeFundamental fixture 를 통과시켜도 밸류가 봉쇄된다.
    res = R.evaluate_date(FIXTURES["noPointInTimeFundamental"], CFG)
    st = res["stocks"][0]
    check(st["valueComparison"]["computed"] is False and st["compositeComparison"]["computed"] is False,
          "noPointInTimeFundamental fixture 에서 밸류·종합이 산출됨")
    # 결과 어디에도 산출된 밸류/종합 성과 필드가 없어야 한다(합성 금지).
    blob = json.dumps(res, ensure_ascii=False)
    for banned in ('"valueScore"', '"compositeScore"', '"historicalReturn"', '"performance"'):
        check(banned not in blob, f"역사 결과에 성과/밸류 산출 필드 유출: {banned}")


# ===========================================================================
# FIX. 다섯 필수 fixture 를 각각 행사한다.
# ===========================================================================
def test_fixture_missing_date():
    res = R.evaluate_date(FIXTURES["missingDate"], CFG)
    check(R.DQ_MISSING_TRADING_DATE in res["stocks"][0]["dataQuality"],
          "missingDate fixture 가 MISSING_TRADING_DATE 를 남기지 않음")


def test_fixture_short_listing():
    res = R.evaluate_date(FIXTURES["shortListing"], CFG)
    f = res["stocks"][0]["factors"]
    # 100 pts: 모멘텀 양쪽 제외(2.4>=130, 2.5.1>=127) → UNAVAILABLE.
    check(f["momentum"]["bucket"] == R.CLS_UNAVAILABLE, f"shortListing 모멘텀 {f['momentum']}")
    # 위험조정: 2.4>=60 유효 / 2.5.1>=253 제외 → INTENDED/MIN_HISTORY(문서화된 임계 차이).
    check(f["riskAdjusted"] == {"bucket": R.CLS_INTENDED, "code": R.METHOD_MIN_HISTORY},
          f"shortListing 위험조정 {f['riskAdjusted']}")


def test_fixture_tie():
    res = R.evaluate_date(FIXTURES["tie"], CFG)
    s0, s1 = res["stocks"]
    check(s0["factors"] == s1["factors"], "동률 두 종목의 분류가 다름")
    # 동률 → 2.5.1 average-rank 는 두 종목에 동일 점수(tie handling) 를 준다.
    prices0, _ = _win("tie", 0)
    prices1, _ = _win("tie", 1)
    raws = [eng.momentum_raw(prices0, CFG)[0], eng.momentum_raw(prices1, CFG)[0]]
    scores = primitives.percentile_scores(raws)
    check(scores[0] == scores[1] == primitives.SINGLE_VALUE_SCORE,
          f"동률 average-rank 점수가 동일(50)하지 않음: {scores}")
    # 그리고 원시값 동치는 유지(P0 아님).
    check(s0["factors"]["momentum"]["bucket"] == R.CLS_INTENDED, "동률 모멘텀이 INTENDED 아님")


def test_fixture_corporate_action():
    res = R.evaluate_date(FIXTURES["corporateAction"], CFG)
    check(R.DQ_CORPORATE_ACTION_SUSPECT in res["stocks"][0]["dataQuality"],
          "corporateAction fixture 가 CORPORATE_ACTION_SUSPECT 를 남기지 않음")


def test_fixture_no_pit_fundamental():
    # PIT 테스트에서 봉쇄를 검사했고, 여기서는 fixture 존재/구조를 확정한다.
    fx = FIXTURES["noPointInTimeFundamental"]
    check(fx["stocks"][0]["hasPointInTimeFundamentals"] is False, "no-PIT fixture 플래그 오류")
    check(fx["sourceDates"]["fundamentals"] is None, "no-PIT fixture 재무 기준일이 null 아님")


# ===========================================================================
# DET. 결정성(반복 평가/재실행 바이트 동일).
# ===========================================================================
def test_determinism_evaluate():
    a = R.evaluate_date(FIXTURES["clean"], CFG)
    b = R.evaluate_date(FIXTURES["clean"], CFG)
    check(json.dumps(a, sort_keys=True) == json.dumps(b, sort_keys=True), "evaluate_date 비결정적")


def test_determinism_replay_small():
    r1 = R.run_local_replay(CFG, num_dates=3, universe_limit=6)
    r2 = R.run_local_replay(CFG, num_dates=3, universe_limit=6)
    check(json.dumps(r1, sort_keys=True) == json.dumps(r2, sort_keys=True), "run_local_replay 비결정적")
    check(r1["verdict"]["p0Count"] == 0, "소규모 재실행에서 P0 발생")
    check(r1["meta"]["analyzedDates"] == 3, "분석 시장일 수 불일치")


# ===========================================================================
# REAL. 최소 252 시장일 실데이터 재실행이 clean.
# ===========================================================================
def test_real_252_clean():
    r = R.run_local_replay(CFG, num_dates=252)
    check(r["meta"]["analyzedDates"] >= 252, f"분석 시장일 {r['meta']['analyzedDates']} < 252")
    check(r["verdict"]["p0Count"] == 0, f"실데이터 P0 {r['verdict']['p0Count']}건")
    check(r["verdict"]["meetsMinimumDates"] is True, "최소 시장일 요건 미충족")
    # 원시값 동치가 대규모로 확인됨(신뢰성 회귀 증거).
    ra = r["rawAgreement"]
    check(ra["p0Pairs"] == 0 and ra["rawAgreePairs"] == ra["comparablePairs"],
          f"실데이터 원시값 동치 실패: {ra}")
    # 밸류·종합은 전 구간 봉쇄(과거 성과 미주장).
    check(r["pointInTimeGuard"]["computed"] is False, "실데이터 밸류·종합이 산출됨")


# ===========================================================================
# PURE. 소스 순수성 — 벽시계/난수/네트워크 흔적 없음, 공개 데이터 쓰기 없음.
# ===========================================================================
def test_source_purity():
    with open(os.path.join(HERE, "metrics251_replay.py"), encoding="utf-8") as f:
        src = f.read()
    code = "\n".join(line.split("#", 1)[0] for line in src.splitlines())
    for banned in ("datetime.now(", "time.time(", "date.today(", "utcnow(", "random("):
        check(banned not in code, f"replay 소스에 결정성 위반(벽시계/난수): {banned!r}")
    for banned in ("requests", "urllib", "socket", "subprocess", "FinanceDataReader", "fdr."):
        check(banned not in code, f"replay 소스에 네트워크/외부 데이터 흔적: {banned!r}")
    # 공개 데이터 경로는 읽기 전용 — public/ 경로에 쓰기 모드로 open 하지 않는다.
    check('"w"' not in code or "public" not in code.split('"w"')[0][-200:],
          "public/ 경로에 쓰기 흔적 의심")
    check(R.DEFAULT_JSON_OUT.replace("\\", "/").split("OrnScore/")[-1].startswith("docs/"),
          "JSON 출력이 docs/ 밖")
    check("public" in R.STOCKS_PATH and "public" in R.PRICES_DIR, "읽기 소스 경로 상수 예상과 다름")


TESTS = [
    test_reference_matches_stored_24,
    test_raw_equivalence_clean,
    test_classify_buckets,
    test_p0_detector_fires,
    test_point_in_time_guard,
    test_fixture_missing_date,
    test_fixture_short_listing,
    test_fixture_tie,
    test_fixture_corporate_action,
    test_fixture_no_pit_fundamental,
    test_determinism_evaluate,
    test_determinism_replay_small,
    test_real_252_clean,
    test_source_purity,
]


def main():
    for t in TESTS:
        try:
            t()
        except Exception as e:  # noqa: BLE001
            failures.append(f"{t.__name__} 예외: {e!r}")
    if failures:
        print("FAIL — Slice H 역사/차등 검증 하네스 게이트")
        for f in failures:
            print("  -", f)
        return 1
    print(f"PASS — Slice H 역사/차등 검증 하네스 ({len(TESTS)} 케이스). "
          "2.4 참조 충실성·원시값 동치·5버킷 분류·P0 탐지 발화·point-in-time 재무 봉쇄·"
          "결측/짧은상장/동률/기업행동/무-재무 fixture·결정성·순수성·실데이터 252일 clean(P0=0).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
