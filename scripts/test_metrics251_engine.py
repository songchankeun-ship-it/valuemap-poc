#!/usr/bin/env python3
# Metrics 2.5.1 순수 shadow 엔진 계약·공식 경계·골든·바이트 결정성 게이트 — Slice D.
#
# 강제하는 계약(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §6, §7 Gate 1~2,
#   §10 Slice D):
#   A. 후보 원시 공식 경계: 모멘텀 21/63/126, 거래활성도 5/20 piecewise_linear, 밸류 PER/PBR
#      cheapness, 252 수익률 위험조정. 결측·이력부족·비양수·영분산은 None + 정확한 사유 코드.
#   B. 결측 미대체: 어떤 경로에서도 결측이 50/평균으로 채워지지 않는다.
#   C. top-level 실패: 빈 유니버스·엔진버전·시장기준일·소스기준일·중복티커 → snapshot None + 사유.
#   D. 종합 withhold: 네 factor 모두 유효할 때만 compositeScore/rankingEligible.
#   E. 골든 10종목 fixture: 커밋된 기대 스냅샷과 바이트 단위 일치.
#   F. 바이트 결정성: 같은 입력 반복 실행 동일 바이트 · 입력 순서 순열 무관(출력 ticker 정렬).
#   G. 순수성: 엔진 소스에 파일쓰기/네트워크/벽시계 흔적 없음. hurdle 은 config 명명 필드로만.
#
# Usage:
#   $env:PYTHONUTF8='1'; python scripts/test_metrics251_engine.py                 # 검증(실패 시 exit 1)
#   $env:PYTHONUTF8='1'; python scripts/test_metrics251_engine.py --update-golden # 골든 fixture 재생성
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import metrics251_engine as eng  # noqa: E402

CONFIG_PATH = os.path.join(ROOT, "config", "metrics", "2.5.1.json")
FIXTURE_DIR = os.path.join(HERE, "fixtures", "metrics251")
GOLDEN_INPUT_PATH = os.path.join(FIXTURE_DIR, "golden_input.json")
GOLDEN_SNAPSHOT_PATH = os.path.join(FIXTURE_DIR, "golden_snapshot.json")

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


def approx(a, b, tol=1e-9):
    return a is not None and b is not None and abs(a - b) <= tol


def load_config():
    with open(CONFIG_PATH, encoding="utf-8-sig") as f:
        return json.load(f)


CFG = load_config()


# ===========================================================================
# 결정적 합성 입력 헬퍼(Math.random 금지 — 파라미터로만 만든다).
# ===========================================================================
def linear_prices(base, step, n):
    return [float(base + i * step) for i in range(n)]


def const_list(value, n):
    return [float(value)] * n


def valid_stock(ticker, per, pbr, base=1000.0, step=1.0, nprices=260, nvol=25, volstep=None):
    prices = linear_prices(base, step, nprices)
    volumes = const_list(1000, nvol) if volstep is None else volstep
    return {"ticker": ticker, "prices": prices, "volumes": volumes, "per": per, "pbr": pbr}


def request(stocks, market_date="2026-07-15",
            source_dates=None):
    sd = source_dates or {"prices": "2026-07-14", "volumes": "2026-07-14",
                          "fundamentals": "2026-07-13"}
    return {"config": CFG, "marketDate": market_date, "sourceDates": sd, "stocks": stocks}


# ===========================================================================
# A. 후보 원시 공식 경계 — 내부 함수 직접 호출.
# ===========================================================================

# --- A1. 모멘텀 ---
# 상수 가격 → 모든 수익률 0 → raw 0(VALID). 결측 대체 아님.
raw, r = eng.momentum_raw(const_list(1000, 130), CFG)
check(r == eng.VALID and approx(raw, 0.0), f"모멘텀 상수가격 raw!=0/VALID: {raw},{r}")
# 최소 포인트(127) 경계.
check(eng.momentum_raw(const_list(1000, 127), CFG)[1] == eng.VALID, "모멘텀 127포인트가 VALID 아님")
check(eng.momentum_raw(const_list(1000, 126), CFG)[1] == eng.INSUFFICIENT_HISTORY,
      "모멘텀 126포인트가 INSUFFICIENT_HISTORY 아님")
check(eng.momentum_raw(None, CFG)[1] == eng.MISSING_INPUT, "모멘텀 None 이 MISSING_INPUT 아님")
check(eng.momentum_raw([], CFG)[1] == eng.MISSING_INPUT, "모멘텀 빈 리스트가 MISSING_INPUT 아님")
# 상승 시리즈 → raw 양수, 하락 → 음수(부호 정합).
check(eng.momentum_raw(linear_prices(1000, 5, 130), CFG)[0] > 0, "상승 시리즈 모멘텀이 양수 아님")
check(eng.momentum_raw(linear_prices(3000, -3, 130), CFG)[0] < 0, "하락 시리즈 모멘텀이 음수 아님")
# 알려진 값: 마지막=last, 각 lookback 기준가 동일 100 이면 raw = (w합)*(last/100-1) = 1*(last/100-1).
# 상수 100 뒤 마지막만 110 인 시리즈 대신, 정확 검증은 상수(=0)와 부호로 충분.

# --- A2. 거래활성도 비율 ---
check(approx(eng.activity_ratio(const_list(1000, 20), CFG)[0], 1.0), "상수 거래량 비율이 1.0 아님")
check(eng.activity_ratio(const_list(1000, 20), CFG)[1] == eng.VALID, "상수 거래량이 VALID 아님")
check(eng.activity_ratio(const_list(1000, 19), CFG)[1] == eng.INSUFFICIENT_HISTORY,
      "거래량 19개가 INSUFFICIENT_HISTORY 아님")
check(eng.activity_ratio(None, CFG)[1] == eng.MISSING_INPUT, "거래량 None 이 MISSING_INPUT 아님")
check(eng.activity_ratio(const_list(0, 20), CFG)[1] == eng.ZERO_VARIANCE,
      "20일 평균 0 이 ZERO_VARIANCE 아님")
# 알려진 비율: 앞 15개 1000, 뒤 5개 2000 → avg20=1250, avg5=2000 → 1.6.
vols = const_list(1000, 15) + const_list(2000, 5)
check(approx(eng.activity_ratio(vols, CFG)[0], 1.6), f"비율 1.6 오류: {eng.activity_ratio(vols, CFG)[0]}")

# --- A3. 거래활성도 piecewise_linear 점수 경계(config segments) ---
for ratio, want in [(0.49, 10.0), (0.5, 10.0), (0.75, 30.0), (1.0, 50.0),
                    (2.0, 75.0), (3.0, 100.0), (5.0, 100.0)]:
    got = eng.activity_score_from_ratio(ratio, CFG)
    check(approx(got, want), f"activity_score ratio {ratio} -> {got} 기대 {want}")
# 구간 경계 직전(연속성): 1.0- 는 50 에 근접, 3.0- 는 100 에 근접.
check(approx(eng.activity_score_from_ratio(0.999999, CFG), 49.99992, tol=1e-4),
      "0.999999 활성도 점수 연속성 오류")
check(approx(eng.activity_score_from_ratio(2.999999, CFG), 99.99998, tol=1e-4),
      "2.999999 활성도 점수 연속성 오류")
check(eng.activity_score_from_ratio(None, CFG) is None, "None ratio 점수가 None 아님")

# --- A4. 밸류 유효성 ---
check(eng.value_validity(10.0, 1.0) == (True, eng.VALID), "밸류 (10,1) 이 VALID 아님")
check(eng.value_validity(None, 1.0)[1] == eng.MISSING_INPUT, "밸류 per=None 이 MISSING_INPUT 아님")
check(eng.value_validity(10.0, None)[1] == eng.MISSING_INPUT, "밸류 pbr=None 이 MISSING_INPUT 아님")
check(eng.value_validity(-5.0, 1.0)[1] == eng.NON_POSITIVE_FUNDAMENTAL,
      "밸류 per<=0 이 NON_POSITIVE_FUNDAMENTAL 아님")
check(eng.value_validity(10.0, 0.0)[1] == eng.NON_POSITIVE_FUNDAMENTAL,
      "밸류 pbr=0 이 NON_POSITIVE_FUNDAMENTAL 아님")

# --- A5. 위험조정 ---
# 상수 가격 → 수익률 전부 0 → 분산 0 → ZERO_VARIANCE.
check(eng.risk_adjusted_raw(const_list(1000, 260), CFG)[1] == eng.ZERO_VARIANCE,
      "상수 가격 위험조정이 ZERO_VARIANCE 아님")
# 이력 경계: 253 가격(=252 수익률) VALID, 252 가격 INSUFFICIENT.
check(eng.risk_adjusted_raw(linear_prices(1000, 1, 253), CFG)[1] == eng.VALID,
      "위험조정 253가격이 VALID 아님")
check(eng.risk_adjusted_raw(linear_prices(1000, 1, 252), CFG)[1] == eng.INSUFFICIENT_HISTORY,
      "위험조정 252가격이 INSUFFICIENT_HISTORY 아님")
check(eng.risk_adjusted_raw(None, CFG)[1] == eng.MISSING_INPUT, "위험조정 None 이 MISSING_INPUT 아님")
# hurdle 이 config 명명 필드에서 온다: hurdle 을 크게 바꾸면 raw 가 달라져야 한다(음의 방향).
import copy  # noqa: E402
cfg_hi = copy.deepcopy(CFG)
cfg_hi["metrics"]["riskAdjusted"]["fixedAnnualHurdleRate"] = 0.50
base_raw = eng.risk_adjusted_raw(linear_prices(1000, 2, 260), CFG)[0]
hi_raw = eng.risk_adjusted_raw(linear_prices(1000, 2, 260), cfg_hi)[0]
check(base_raw is not None and hi_raw is not None and hi_raw < base_raw,
      "fixedAnnualHurdleRate 를 올렸는데 위험조정 raw 가 감소하지 않음(명명 필드 미사용 의심)")

# ===========================================================================
# A6. 밸류 cheapness 교차종목(percentile) — 2종목 정확값.
#   per=[10,20] → pct[25,75] → perScore[75,25]; pbr=[1,2] → 동일 → value[75,25].
# ===========================================================================
val_req = request([
    valid_stock("AAA", per=10.0, pbr=1.0),
    valid_stock("BBB", per=20.0, pbr=2.0),
])
val_res = eng.run_from_dict(val_req)
check(val_res.snapshot is not None, "밸류 교차종목 스냅샷이 None")
if val_res.snapshot:
    by_t = {s.ticker: s for s in val_res.snapshot.stocks}
    check(approx(by_t["AAA"].factors["value"].score, 75.0),
          f"AAA value!=75: {by_t['AAA'].factors['value'].score}")
    check(approx(by_t["BBB"].factors["value"].score, 25.0),
          f"BBB value!=25: {by_t['BBB'].factors['value'].score}")

# ===========================================================================
# B. 결측 미대체 + D. 종합 withhold — per=None 인 종목은 종합 보류, 다른 종목은 산출.
# ===========================================================================
wh_req = request([
    valid_stock("KEEP", per=10.0, pbr=1.0, step=2.0),
    valid_stock("DROP", per=None, pbr=1.0, step=1.0),
])
wh = eng.run_from_dict(wh_req).snapshot
check(wh is not None, "withhold 스냅샷 None")
if wh:
    m = {s.ticker: s for s in wh.stocks}
    check(m["DROP"].compositeScore is None, "결측 종목 종합점수가 None 아님(대체 금지)")
    check(m["DROP"].compositeScore != 50.0, "결측 종목이 50 으로 대체됨(금지)")
    check(m["DROP"].rankingEligible is False, "결측 종목이 rankingEligible True")
    check(m["DROP"].factors["value"].reason == eng.MISSING_INPUT, "결측 종목 밸류 사유가 MISSING_INPUT 아님")
    check(m["DROP"].factors["value"].score is None, "결측 종목 밸류 점수가 None 아님")
    # 다른 유효 종목의 종합은 산출됨(단, N=2 percentile 이므로 값 존재만 확인).
    check(m["KEEP"].compositeScore is not None, "유효 종목 종합점수가 None")

# ===========================================================================
# C. top-level 실패 → snapshot None + 사유 코드.
# ===========================================================================
# 빈 유니버스.
r_empty = eng.run_from_dict(request([]))
check(r_empty.snapshot is None and eng.RUN_EMPTY_UNIVERSE in r_empty.nullReasons,
      "빈 유니버스가 EMPTY_UNIVERSE 로 실패하지 않음")
# 엔진 버전 불일치.
cfg_bad = copy.deepcopy(CFG)
cfg_bad["engineVersion"] = "9.9.9"
r_ver = eng.compute_snapshot(eng.EngineRequest(
    config=cfg_bad, marketDate="2026-07-15",
    sourceDates={"prices": "2026-07-14", "volumes": "2026-07-14", "fundamentals": None},
    stocks=[eng.StockInput("X")]))
check(r_ver.snapshot is None and eng.RUN_ENGINE_VERSION_MISMATCH in r_ver.nullReasons,
      "엔진 버전 불일치가 실패하지 않음")
# 시장기준일 없음.
r_md = eng.run_from_dict(request([valid_stock("A", 10.0, 1.0)], market_date=None))
check(r_md.snapshot is None and eng.RUN_MARKET_DATE_MISSING in r_md.nullReasons,
      "시장기준일 없음이 실패하지 않음")
# 소스기준일(가격) 없음.
r_sd = eng.run_from_dict(request([valid_stock("A", 10.0, 1.0)],
                         source_dates={"prices": None, "volumes": "2026-07-14", "fundamentals": None}))
check(r_sd.snapshot is None and eng.RUN_SOURCE_DATE_MISSING in r_sd.nullReasons,
      "가격 소스기준일 없음이 실패하지 않음")
# 미래 소스기준일(marketDate 보다 뒤).
r_fut = eng.run_from_dict(request([valid_stock("A", 10.0, 1.0)],
                          source_dates={"prices": "2026-07-16", "volumes": "2026-07-14",
                                        "fundamentals": None}))
check(r_fut.snapshot is None and eng.RUN_SOURCE_DATE_MISMATCH in r_fut.nullReasons,
      "미래 소스기준일이 SOURCE_DATE_MISMATCH 로 실패하지 않음")
# 중복 티커.
r_dup = eng.run_from_dict(request([valid_stock("D", 10.0, 1.0), valid_stock("D", 20.0, 2.0)]))
check(r_dup.snapshot is None and eng.RUN_DUPLICATE_TICKER in r_dup.nullReasons,
      "중복 티커가 실패하지 않음")

# 재무 소스기준일 null → 밸류만 SOURCE_DATE_STALE(스냅샷은 성립).
r_fstale = eng.run_from_dict(request([valid_stock("A", 10.0, 1.0), valid_stock("B", 20.0, 2.0)],
                             source_dates={"prices": "2026-07-14", "volumes": "2026-07-14",
                                           "fundamentals": None}))
check(r_fstale.snapshot is not None, "재무 기준일 null 인데 스냅샷이 None")
if r_fstale.snapshot:
    s0 = r_fstale.snapshot.stocks[0]
    check(s0.factors["value"].reason == eng.SOURCE_DATE_STALE, "재무 기준일 null 밸류가 SOURCE_DATE_STALE 아님")
    check(s0.factors["value"].score is None and s0.compositeScore is None,
          "재무 기준일 null 인데 밸류/종합이 산출됨")

# ===========================================================================
# 골든 fixture 로드/생성.
# ===========================================================================
def build_golden_input():
    """결정적 10종목 골든 입력. 다양한 사유 코드·모집단·경계를 커버한다."""
    v25 = const_list(1000, 25)
    stocks = [
        # 1~5: 완전 유효(rankingEligible). 서로 다른 drift 로 모멘텀/위험조정 분산.
        {"ticker": "A_RISE", "prices": linear_prices(1000, 2, 260), "volumes": v25,
         "per": 10.0, "pbr": 1.0},
        {"ticker": "B_SURGE", "prices": linear_prices(1000, 1, 260),
         "volumes": const_list(1000, 15) + const_list(2000, 5), "per": 20.0, "pbr": 2.0},
        {"ticker": "C_FALL", "prices": linear_prices(3000, -3, 260),
         "volumes": const_list(1000, 15) + const_list(500, 5), "per": 5.0, "pbr": 0.5},
        {"ticker": "D_FLAT", "prices": linear_prices(1500, 1, 260), "volumes": const_list(800, 30),
         "per": 15.0, "pbr": 1.5},
        {"ticker": "E_RISE3", "prices": linear_prices(1200, 3, 255), "volumes": const_list(1200, 22),
         "per": 8.0, "pbr": 0.8},
        # 6: PER 결측 → 밸류 MISSING_INPUT → 종합 보류.
        {"ticker": "F_NOPER", "prices": linear_prices(1000, 1, 260), "volumes": v25,
         "per": None, "pbr": 1.0},
        # 7: PER 음수 → 밸류 NON_POSITIVE_FUNDAMENTAL.
        {"ticker": "G_NEGPER", "prices": linear_prices(1000, 1, 260), "volumes": v25,
         "per": -5.0, "pbr": 1.0},
        # 8: 가격 200개(<253) → 위험조정 INSUFFICIENT_HISTORY(모멘텀은 유효).
        {"ticker": "H_SHORT", "prices": linear_prices(1000, 1, 200), "volumes": v25,
         "per": 12.0, "pbr": 1.2},
        # 9: 거래량 10개(<20) → 거래활성도 INSUFFICIENT_HISTORY.
        {"ticker": "I_SHORTVOL", "prices": linear_prices(1000, 1, 260), "volumes": const_list(1000, 10),
         "per": 9.0, "pbr": 0.9},
        # 10: 상수 가격 → 위험조정 ZERO_VARIANCE, 모멘텀 raw 0(유효).
        {"ticker": "J_CONST", "prices": const_list(1000, 260), "volumes": v25,
         "per": 11.0, "pbr": 1.1},
    ]
    return {
        "marketDate": "2026-07-15",
        "sourceDates": {"prices": "2026-07-14", "volumes": "2026-07-14", "fundamentals": "2026-07-13"},
        "stocks": stocks,
    }


def golden_request_dict(golden_input):
    return {"config": CFG, "marketDate": golden_input["marketDate"],
            "sourceDates": golden_input["sourceDates"], "stocks": golden_input["stocks"]}


def run_golden(golden_input):
    res = eng.run_from_dict(golden_request_dict(golden_input))
    assert res.snapshot is not None, "골든 스냅샷이 None"
    return res.snapshot


def write_golden():
    os.makedirs(FIXTURE_DIR, exist_ok=True)
    gi = build_golden_input()
    with open(GOLDEN_INPUT_PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(gi, ensure_ascii=False, sort_keys=True, indent=2) + "\n")
    snap = run_golden(gi)
    with open(GOLDEN_SNAPSHOT_PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(snap.to_dict(), ensure_ascii=False, sort_keys=True, indent=2) + "\n")
    print(f"golden fixture 재생성: {os.path.relpath(GOLDEN_INPUT_PATH, ROOT)} + "
          f"{os.path.relpath(GOLDEN_SNAPSHOT_PATH, ROOT)}")


# ===========================================================================
# E. 골든 10종목 fixture — 커밋된 기대 스냅샷과 바이트 일치.
# ===========================================================================
def run_golden_checks():
    with open(GOLDEN_INPUT_PATH, encoding="utf-8") as f:
        gi = json.load(f)
    with open(GOLDEN_SNAPSHOT_PATH, encoding="utf-8") as f:
        expected = json.load(f)
    snap = run_golden(gi)
    got = snap.to_dict()
    check(got == expected, "골든 스냅샷이 커밋된 기대값과 불일치 — --update-golden 필요(의도된 변경일 때만)")

    # 골든 내용 스팟체크(공식이 실제로 작동하는지 — 프리즈된 값의 의미 확인).
    m = {s["ticker"]: s for s in got["stocks"]}
    check(len(got["stocks"]) == 10, "골든 종목 수가 10 아님")
    # rankingEligible = A~E(5).
    elig = sorted(t for t, s in m.items() if s["rankingEligible"])
    check(elig == ["A_RISE", "B_SURGE", "C_FALL", "D_FLAT", "E_RISE3"],
          f"rankingEligible 집합 오류: {elig}")
    check(got["rankingPopulation"]["count"] == 5, "rankingPopulation count!=5")
    # 사유 코드가 의도대로.
    check(m["F_NOPER"]["factors"]["value"]["reason"] == eng.MISSING_INPUT, "F_NOPER 밸류 사유 오류")
    check(m["G_NEGPER"]["factors"]["value"]["reason"] == eng.NON_POSITIVE_FUNDAMENTAL, "G_NEGPER 밸류 사유 오류")
    check(m["H_SHORT"]["factors"]["riskAdjusted"]["reason"] == eng.INSUFFICIENT_HISTORY, "H_SHORT 위험 사유 오류")
    check(m["I_SHORTVOL"]["factors"]["activity"]["reason"] == eng.INSUFFICIENT_HISTORY, "I_SHORTVOL 활성 사유 오류")
    check(m["J_CONST"]["factors"]["riskAdjusted"]["reason"] == eng.ZERO_VARIANCE, "J_CONST 위험 사유 오류")
    check(approx(m["J_CONST"]["factors"]["momentum"]["raw"], 0.0), "J_CONST 모멘텀 raw!=0")
    # 종합 보류 종목은 compositeScore None, 절대 50 아님.
    for t in ("F_NOPER", "G_NEGPER", "H_SHORT", "I_SHORTVOL", "J_CONST"):
        check(m[t]["compositeScore"] is None, f"{t} compositeScore 가 None 아님")
    # factor 모집단 카운트.
    fp = got["factorPopulations"]
    check(fp["momentum"]["count"] == 10, f"momentum 모집단!=10: {fp['momentum']['count']}")
    check(fp["activity"]["count"] == 9, f"activity 모집단!=9: {fp['activity']['count']}")
    check(fp["value"]["count"] == 8, f"value 모집단!=8: {fp['value']['count']}")
    check(fp["riskAdjusted"]["count"] == 8, f"riskAdjusted 모집단!=8: {fp['riskAdjusted']['count']}")

    return gi, got


# ===========================================================================
# F. 바이트 결정성 — 반복 실행 동일 · 입력 순열 무관.
# ===========================================================================
def run_determinism_checks(gi, got):
    b1 = eng.run_from_dict(golden_request_dict(gi)).snapshot.canonical_bytes()
    b2 = eng.run_from_dict(golden_request_dict(gi)).snapshot.canonical_bytes()
    check(b1 == b2, "같은 입력 반복 실행이 바이트 단위로 다름(비결정)")
    # 커밋된 골든 스냅샷의 canonical 바이트와도 일치.
    check(b1 == eng.canonical_bytes(got), "런타임 스냅샷 바이트가 골든 스냅샷 바이트와 불일치")

    # 입력 순서 순열 → 출력은 ticker 정렬이므로 동일 바이트.
    stocks = list(gi["stocks"])
    for step in (2, 3, 7):
        n = len(stocks)
        perm = [stocks[(i * step) % n] for i in range(n)] if _gcd(step, n) == 1 else list(reversed(stocks))
        gi_perm = {**gi, "stocks": perm}
        bp = eng.run_from_dict(golden_request_dict(gi_perm)).snapshot.canonical_bytes()
        check(bp == b1, f"입력 순열(step={step})이 다른 바이트를 생성(순서 의존)")


def _gcd(a, b):
    while b:
        a, b = b, a % b
    return a


# ===========================================================================
# G. 순수성 — 엔진 소스에 파일쓰기/네트워크/벽시계 없음. hurdle 명명 필드.
# ===========================================================================
def run_purity_checks():
    src = open(os.path.join(HERE, "metrics251_engine.py"), encoding="utf-8").read()
    code = "\n".join(line.split("#", 1)[0] for line in src.splitlines())
    for banned in ("open(", "write(", "urllib", "requests", "socket", "subprocess"):
        check(banned not in code, f"엔진에 부작용/네트워크 흔적: {banned!r}")
    for banned in ("datetime.now(", "time.time(", "date.today(", "utcnow(", "random("):
        check(banned not in code, f"엔진에 결정성 위반(벽시계/난수): {banned!r}")
    for banned in ("import compute_metrics", "from compute_metrics"):
        check(banned not in code, f"엔진이 공개 생성 경로 compute_metrics 에 의존: {banned!r}")
    # 3.5% 를 코드 상수로 박지 않고 config 명명 필드로만 읽는다.
    check("fixedAnnualHurdleRate" in code, "엔진이 fixedAnnualHurdleRate 명명 필드를 참조하지 않음")
    check("0.035" not in code, "엔진에 하드코딩된 0.035(무위험수익률처럼 박음) 발견 — config 필드로만 읽어야 함")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Metrics 2.5.1 shadow engine 계약/골든/결정성 게이트.")
    ap.add_argument("--update-golden", action="store_true", help="골든 fixture 재생성 후 종료")
    args = ap.parse_args(argv)

    if args.update_golden:
        write_golden()
        return 0

    if not os.path.exists(GOLDEN_INPUT_PATH) or not os.path.exists(GOLDEN_SNAPSHOT_PATH):
        print("[FAIL] 골든 fixture 없음 — 먼저 --update-golden 실행 필요.", file=sys.stderr)
        return 1

    gi, got = run_golden_checks()
    run_determinism_checks(gi, got)
    run_purity_checks()

    if failures:
        print(f"[FAIL] metrics251_engine 계약 검증 {len(failures)}건 실패:")
        for x in failures:
            print(f"  - {x}")
        return 1

    print("[PASS] metrics251_engine 계약 검증 통과 "
          "(공식 경계: 모멘텀21/63/126·활성도5/20 piecewise·밸류 PER/PBR·252 위험조정 · "
          "결측 미대체·종합 withhold · top-level 실패 사유 · 골든10종목 바이트일치 · "
          "반복/순열 결정성 · 순수성·hurdle 명명필드).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
