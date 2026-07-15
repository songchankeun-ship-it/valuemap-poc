#!/usr/bin/env python3
# Metrics 2.5.1 거래일 캘린더 어댑터 + 비교 capability 계약 게이트 — Slice G.
#
# 강제하는 계약(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D05, §10 Slice G):
#   CAL. 캘린더 어댑터(로컬 fixture): 거래일/주말/공휴일/범위밖 day_kind, 직전 거래일(공휴일 건너뜀),
#        범위 첫 거래일의 직전 거래일 없음. 외부 서비스/네트워크 없음.
#   RAW. 유니버스/모집단/config 가 바뀌어도 원시값(raw)은 engineVersion·소스계약·게시가 같으면 비교
#        가능하다(§M251-D05 헤드라인). engineVersion 이 바뀌면 raw 까지 차단.
#   FAC. factorScore[k] 는 metrics/config + 해당 factor 모집단 해시가 같아야 한다. 한 factor 모집단이
#        바뀌면 그 factor 만 차단하고 나머지 factor 원시/점수는 지우지 않는다(비-erasure).
#   CMP. compositeScore 는 metrics/config + 네 factor 점수 비교 가능이어야 한다(전파 차단).
#   RNK. rank 는 composite 비교 가능 + ranking universe 해시가 같아야 한다.
#   GATE. current 결측/미게시, previous 결측/미게시는 모든 층을 안정 코드로 차단한다.
#   PAIR. pairing(주말/공휴일/직전 거래일 없음/기대≠실제)이 유효하지 않으면 최종 비교를 숨기되
#         기대/실제 거래일과 사유 코드를 정확히 남긴다.
#   PURE. 소스에 벽시계/난수/네트워크 흔적이 없다.
#
# Usage:
#   $env:PYTHONUTF8='1'; python scripts/test_metrics251_compare.py
import copy
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import metrics251_compare as cmp  # noqa: E402

FIXDIR = os.path.join(HERE, "fixtures", "metrics251")
GOLDEN_SNAPSHOT_PATH = os.path.join(FIXDIR, "golden_snapshot.json")
CALENDAR_PATH = os.path.join(FIXDIR, "compare_calendar.json")

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


CALENDAR_FIXTURE = load_json(CALENDAR_PATH)
CAL = cmp.FixtureTradingCalendar.from_fixture(CALENDAR_FIXTURE)

# 메타데이터만 있는 스냅샷(비교 로직은 stocks 를 읽지 않는다). Slice D 골든 스냅샷의 해시를 재사용.
GOLDEN = load_json(GOLDEN_SNAPSHOT_PATH)
META_KEYS = ("engineVersion", "configHash", "marketDate", "sourceDates",
             "factorPopulations", "rankingPopulation")


def base_meta(market_date):
    """골든 스냅샷에서 비교에 필요한 메타만 뽑아 marketDate 를 지정한 스냅샷."""
    m = {k: copy.deepcopy(GOLDEN[k]) for k in META_KEYS}
    m["marketDate"] = market_date
    return m


CUR_DATE = "2026-07-15"   # Wed, 거래일. 직전 거래일 = 2026-07-14 (Tue).
PREV_DATE = "2026-07-14"


def current():
    return base_meta(CUR_DATE)


def previous():
    return base_meta(PREV_DATE)


# ===========================================================================
# CAL. 캘린더 어댑터.
# ===========================================================================
def test_calendar():
    # day_kind.
    check(CAL.day_kind("2026-07-15") == cmp.TRADING_DAY, "07-15(Wed) 가 거래일이 아님")
    check(CAL.day_kind("2026-07-18") == cmp.WEEKEND, "07-18(Sat) 가 WEEKEND 아님")
    check(CAL.day_kind("2026-07-19") == cmp.WEEKEND, "07-19(Sun) 가 WEEKEND 아님")
    check(CAL.day_kind("2026-07-16") == cmp.HOLIDAY, "07-16 공휴일이 HOLIDAY 아님")
    check(CAL.day_kind("2026-08-03") == cmp.OUT_OF_CALENDAR_RANGE, "범위 밖 날짜가 OUT_OF_RANGE 아님")
    check(CAL.day_kind("2026-06-30") == cmp.OUT_OF_CALENDAR_RANGE, "범위 이전 날짜가 OUT_OF_RANGE 아님")
    # is_trading_day.
    check(CAL.is_trading_day("2026-07-15") is True, "07-15 is_trading_day False")
    check(CAL.is_trading_day("2026-07-16") is False, "공휴일 is_trading_day True")
    check(CAL.is_trading_day("2026-07-18") is False, "주말 is_trading_day True")
    # previous_trading_day — 공휴일(07-16)을 건너뛴다.
    check(CAL.previous_trading_day("2026-07-15") == "2026-07-14", "07-15 직전 거래일!=07-14")
    check(CAL.previous_trading_day("2026-07-17") == "2026-07-15",
          "07-17(Fri) 직전 거래일이 공휴일(07-16)을 건너뛰지 않음")
    check(CAL.previous_trading_day("2026-07-20") == "2026-07-17",
          "07-20(Mon) 직전 거래일이 주말(07-18/19)을 건너뛰지 않음")
    # 범위 첫 거래일 → 직전 거래일 없음.
    first = CAL.trading_days()[0]
    check(CAL.previous_trading_day(first) is None, f"첫 거래일({first})의 직전 거래일이 None 아님")
    # from_range 결정성 — 07-16 공휴일 제외, 주말 제외.
    days = CAL.trading_days()
    check("2026-07-16" not in days, "공휴일이 거래일 목록에 있음")
    check("2026-07-18" not in days and "2026-07-19" not in days, "주말이 거래일 목록에 있음")
    check("2026-07-15" in days and "2026-07-17" in days, "평일 거래일 누락")


# ===========================================================================
# 구조적 capability 헬퍼 — evaluate 의 pairing 이 유효한 표준 짝(07-15 vs 07-14)으로 검사.
# ===========================================================================
def structural_of(cur_ref, prev_ref):
    return cmp.compare_snapshots(cur_ref, prev_ref)


def caps_of(res):
    return res["capabilities"]


# ===========================================================================
# 기준(identical): 같은 config/engine/모집단 → 모든 층 비교 가능.
# ===========================================================================
def test_identical_all_comparable():
    res = cmp.evaluate_comparison(current(), previous(), CAL)
    check(res["pairing"]["valid"] is True, f"기준 pairing 무효: {res['pairing']}")
    check(res["pairing"]["expectedPreviousMarketDate"] == PREV_DATE, "기준 기대 직전 거래일 오류")
    check(res["pairing"]["actualPreviousMarketDate"] == PREV_DATE, "기준 실제 직전 거래일 오류")
    c = res["capabilities"]
    check(c["raw"] is True, "기준 raw 비교불가")
    check(all(c["factorScore"].values()), f"기준 factorScore 비교불가: {c['factorScore']}")
    check(c["compositeScore"] is True, "기준 composite 비교불가")
    check(c["rank"] is True, "기준 rank 비교불가")


# ===========================================================================
# RAW/FAC/CMP/RNK. 유니버스·모집단 변경.
# ===========================================================================
def test_unchanged_config_changed_factor_population():
    """unchanged config + 한 factor 모집단만 변경 → 그 factor·composite·rank 만 차단, raw·타 factor 유지."""
    cur = current()
    cur["factorPopulations"]["value"]["hash"] = "changed_value_pop_hash"
    res = structural_of(cur, previous())
    c = caps_of(res)
    check(c["raw"] is True, "config 동일인데 raw 차단됨(원시값은 비교 가능해야)")
    check(c["factorScore"]["value"] is False, "value 모집단 변경인데 value factor 비교 가능")
    check(cmp.FACTOR_POPULATION_MISMATCH in res["reasons"]["factorScore"]["value"],
          "value 사유에 FACTOR_POPULATION_MISMATCH 없음")
    for k in ("momentum", "activity", "riskAdjusted"):
        check(c["factorScore"][k] is True, f"{k} 는 유지돼야 하는데 차단됨(erasure)")
    check(c["compositeScore"] is False, "한 factor 비교불가인데 composite 비교 가능")
    check(cmp.FACTOR_NOT_COMPARABLE in res["reasons"]["compositeScore"], "composite 사유 누락")
    check("value" in res["meta"]["notComparableFactors"], "notComparableFactors 에 value 없음")
    check(c["rank"] is False, "composite 비교불가인데 rank 비교 가능")
    check(cmp.COMPOSITE_NOT_COMPARABLE in res["reasons"]["rank"], "rank 전파 사유 누락")


def test_changed_ranking_universe_only():
    """factor 모집단은 동일하나 ranking universe 해시만 변경 → rank 만 차단, 나머지 유지."""
    cur = current()
    cur["rankingPopulation"]["hash"] = "changed_ranking_hash"
    res = structural_of(cur, previous())
    c = caps_of(res)
    check(c["raw"] is True, "raw 차단됨")
    check(all(c["factorScore"].values()), "factorScore 차단됨")
    check(c["compositeScore"] is True, "composite 차단됨")
    check(c["rank"] is False, "ranking universe 변경인데 rank 비교 가능")
    check(res["reasons"]["rank"] == [cmp.RANKING_UNIVERSE_MISMATCH],
          f"rank 사유가 RANKING_UNIVERSE_MISMATCH 단독이 아님: {res['reasons']['rank']}")


def test_ticker_entering_or_leaving():
    """유니버스 멤버십 변경(티커 진입/이탈) → 네 factor 모집단·ranking 모두 변경, 그러나 raw 는 비교 가능."""
    cur = current()
    for k in cmp.METRIC_KEYS:
        cur["factorPopulations"][k]["hash"] = f"universe_changed_{k}"
        cur["factorPopulations"][k]["count"] = cur["factorPopulations"][k]["count"] + 1
    cur["rankingPopulation"]["hash"] = "universe_changed_ranking"
    cur["rankingPopulation"]["count"] = cur["rankingPopulation"]["count"] + 1
    res = structural_of(cur, previous())
    c = caps_of(res)
    # 헤드라인(§M251-D05): 유니버스가 바뀌어도 원시값 비교는 가능.
    check(c["raw"] is True, "유니버스 변경인데 raw 비교불가(원시값은 비교 가능해야 함)")
    check(not any(c["factorScore"].values()), "유니버스 변경인데 어떤 factorScore 가 여전히 비교 가능")
    check(c["compositeScore"] is False, "유니버스 변경인데 composite 비교 가능")
    check(c["rank"] is False, "유니버스 변경인데 rank 비교 가능")
    for k in cmp.METRIC_KEYS:
        check(cmp.FACTOR_POPULATION_MISMATCH in res["reasons"]["factorScore"][k],
              f"{k} 사유에 FACTOR_POPULATION_MISMATCH 없음")


# ===========================================================================
# config / engine 변경.
# ===========================================================================
def test_changed_config():
    """config 변경(engine 동일) → factor/composite/rank 차단, raw 는 비교 가능(원시 정의 동일)."""
    cur = current()
    cur["configHash"] = "different_config_hash"
    res = structural_of(cur, previous())
    c = caps_of(res)
    check(c["raw"] is True, "config 변경으로 raw 가 차단됨(engine 동일이면 원시값 비교 가능해야)")
    check(not any(c["factorScore"].values()), "config 변경인데 factorScore 비교 가능")
    for k in cmp.METRIC_KEYS:
        check(cmp.CONFIG_MISMATCH in res["reasons"]["factorScore"][k], f"{k} 사유에 CONFIG_MISMATCH 없음")
    check(c["compositeScore"] is False, "config 변경인데 composite 비교 가능")
    check(cmp.CONFIG_MISMATCH in res["reasons"]["compositeScore"], "composite 사유에 CONFIG_MISMATCH 없음")
    check(c["rank"] is False, "config 변경인데 rank 비교 가능")


def test_changed_engine_version():
    """engine 버전 변경 → 원시 정의가 달라져 raw 포함 전 층 차단."""
    cur = current()
    cur["engineVersion"] = "2.5.2"
    res = structural_of(cur, previous())
    c = caps_of(res)
    check(c["raw"] is False, "engine 버전 변경인데 raw 비교 가능(원시 정의가 달라짐)")
    check(cmp.ENGINE_VERSION_MISMATCH in res["reasons"]["raw"], "raw 사유에 ENGINE_VERSION_MISMATCH 없음")
    check(not any(c["factorScore"].values()), "engine 변경인데 factorScore 비교 가능")
    for k in cmp.METRIC_KEYS:
        check(cmp.ENGINE_VERSION_MISMATCH in res["reasons"]["factorScore"][k],
              f"{k} 사유에 ENGINE_VERSION_MISMATCH 없음")
    check(c["compositeScore"] is False, "engine 변경인데 composite 비교 가능")
    check(c["rank"] is False, "engine 변경인데 rank 비교 가능")


# ===========================================================================
# 소스 계약 / raw 게시.
# ===========================================================================
def test_source_contract_incompatible():
    """sourceDates 키 계약이 다르면 raw 만 차단(다른 층은 config/모집단 동일이면 유지)."""
    cur = current()
    del cur["sourceDates"]["volumes"]  # 키 집합 상이.
    res = structural_of(cur, previous())
    c = caps_of(res)
    check(c["raw"] is False, "소스 계약 상이인데 raw 비교 가능")
    check(cmp.SOURCE_CONTRACT_INCOMPATIBLE in res["reasons"]["raw"], "raw 사유에 SOURCE_CONTRACT_INCOMPATIBLE 없음")
    # factor/composite/rank 는 소스 계약과 무관(모집단/config 동일) → 유지.
    check(all(c["factorScore"].values()), "소스 계약 상이가 factorScore 를 부당하게 차단")
    check(c["compositeScore"] is True and c["rank"] is True, "소스 계약 상이가 composite/rank 를 부당하게 차단")


def test_source_input_unpublished():
    """한쪽 prices/volumes 가 미게시(null)면 raw 차단(SOURCE_INPUT_UNPUBLISHED)."""
    cur = current()
    cur["sourceDates"]["prices"] = None
    res = structural_of(cur, previous())
    c = caps_of(res)
    check(c["raw"] is False, "prices 미게시인데 raw 비교 가능")
    check(cmp.SOURCE_INPUT_UNPUBLISHED in res["reasons"]["raw"], "raw 사유에 SOURCE_INPUT_UNPUBLISHED 없음")


# ===========================================================================
# GATE. 결측/미게시 스냅샷.
# ===========================================================================
def test_current_missing():
    res = cmp.evaluate_comparison(cmp.missing_ref(), previous(), CAL)
    c = res["capabilities"]
    check(c["raw"] is False and not any(c["factorScore"].values())
          and c["compositeScore"] is False and c["rank"] is False, "current 결측인데 어떤 층이 비교 가능")
    check(res["pairing"]["reason"] == cmp.CURRENT_SNAPSHOT_MISSING, "current 결측 pairing 사유 오류")
    check(cmp.CURRENT_SNAPSHOT_MISSING in res["structural"]["reasons"]["raw"], "구조적 사유에 결측 코드 없음")


def test_previous_missing():
    res = structural_of(current(), cmp.missing_ref())
    c = caps_of(res)
    check(not any([c["raw"], c["compositeScore"], c["rank"], *c["factorScore"].values()]),
          "previous 결측인데 어떤 층이 비교 가능")
    check(cmp.PREVIOUS_SNAPSHOT_MISSING in res["reasons"]["raw"], "previous 결측 사유 누락")


def test_current_unpublished():
    res = structural_of(cmp.unpublished_ref(current()), previous())
    c = caps_of(res)
    check(not any([c["raw"], c["compositeScore"], c["rank"], *c["factorScore"].values()]),
          "current 미게시인데 어떤 층이 비교 가능")
    check(cmp.CURRENT_UNPUBLISHED in res["reasons"]["raw"], "current 미게시 사유 누락")


def test_previous_unpublished():
    res = structural_of(current(), cmp.unpublished_ref(previous()))
    c = caps_of(res)
    check(not any([c["raw"], c["compositeScore"], c["rank"], *c["factorScore"].values()]),
          "previous 미게시인데 어떤 층이 비교 가능")
    check(cmp.PREVIOUS_UNPUBLISHED in res["reasons"]["raw"], "previous 미게시 사유 누락")


# ===========================================================================
# PAIR. 캘린더 pairing 이 최종 비교를 숨기는 경우(주말/공휴일/직전없음/기대≠실제).
# ===========================================================================
def _all_hidden(res):
    c = res["capabilities"]
    return (c["raw"] is False and c["compositeScore"] is False and c["rank"] is False
            and not any(c["factorScore"].values()))


def test_pairing_weekend():
    cur = base_meta("2026-07-18")  # Sat.
    res = cmp.evaluate_comparison(cur, previous(), CAL)
    check(res["pairing"]["reason"] == cmp.WEEKEND, "주말 pairing 사유가 WEEKEND 아님")
    check(res["pairing"]["valid"] is False, "주말 pairing 이 valid")
    check(_all_hidden(res), "주말인데 어떤 층이 노출됨")
    check(cmp.PAIRING_INVALID in res["reasons"]["raw"], "raw 사유에 PAIRING_INVALID 없음")
    check(cmp.WEEKEND in res["reasons"]["raw"], "raw 사유에 WEEKEND 없음")
    # 구조적으로는 여전히 비교 가능(숨긴 이유는 pairing 뿐임을 증명).
    check(res["structural"]["capabilities"]["raw"] is True, "구조적 raw 는 비교 가능해야(숨김은 pairing 사유)")


def test_pairing_holiday():
    cur = base_meta("2026-07-16")  # 공휴일.
    res = cmp.evaluate_comparison(cur, previous(), CAL)
    check(res["pairing"]["reason"] == cmp.HOLIDAY, "공휴일 pairing 사유가 HOLIDAY 아님")
    check(_all_hidden(res), "공휴일인데 어떤 층이 노출됨")


def test_pairing_no_previous_market_day():
    first = CAL.trading_days()[0]  # 범위 첫 거래일 → 직전 거래일 없음.
    cur = base_meta(first)
    res = cmp.evaluate_comparison(cur, previous(), CAL)
    check(res["pairing"]["reason"] == cmp.NO_PREVIOUS_MARKET_DAY, "직전거래일 없음 사유 오류")
    check(res["pairing"]["expectedPreviousMarketDate"] is None, "기대 직전거래일이 None 아님")
    check(_all_hidden(res), "직전 거래일 없음인데 어떤 층이 노출됨")


def test_pairing_previous_date_mismatch():
    """이전 스냅샷이 기대 직전 거래일과 다른 날짜(07-13) → 기대/실제 거래일을 남기고 숨긴다."""
    prev = base_meta("2026-07-13")  # Mon, 거래일이지만 기대(07-14)와 다름.
    res = cmp.evaluate_comparison(current(), prev, CAL)
    check(res["pairing"]["reason"] == cmp.PREVIOUS_MARKET_DATE_MISMATCH, "기대≠실제 사유 오류")
    check(res["pairing"]["expectedPreviousMarketDate"] == "2026-07-14", "기대 직전거래일 오류")
    check(res["pairing"]["actualPreviousMarketDate"] == "2026-07-13", "실제 직전거래일 오류")
    check(_all_hidden(res), "기대≠실제인데 어떤 층이 노출됨")


def test_pairing_out_of_range():
    cur = base_meta("2026-08-03")  # 범위 밖.
    res = cmp.evaluate_comparison(cur, previous(), CAL)
    check(res["pairing"]["reason"] == cmp.OUT_OF_CALENDAR_RANGE, "범위밖 pairing 사유 오류")
    check(_all_hidden(res), "범위 밖인데 어떤 층이 노출됨")


def test_valid_pairing_preserves_structural():
    """유효 pairing 에서는 최종 capabilities == 구조적 capabilities (유니버스 변경 raw 유지 확인)."""
    cur = current()
    for k in cmp.METRIC_KEYS:
        cur["factorPopulations"][k]["hash"] = f"u_{k}"
    cur["rankingPopulation"]["hash"] = "u_rank"
    res = cmp.evaluate_comparison(cur, previous(), CAL)
    check(res["pairing"]["valid"] is True, "유효해야 할 pairing 이 무효")
    check(res["capabilities"] == res["structural"]["capabilities"],
          "유효 pairing 에서 최종!=구조적 capabilities")
    check(res["capabilities"]["raw"] is True, "유효 pairing + 유니버스 변경에서 raw 가 숨겨짐")


# ===========================================================================
# 결정성 & 순수성.
# ===========================================================================
def test_determinism():
    r1 = cmp.evaluate_comparison(current(), previous(), CAL)
    r2 = cmp.evaluate_comparison(current(), previous(), CAL)
    check(json.dumps(r1, sort_keys=True) == json.dumps(r2, sort_keys=True),
          "같은 입력의 반복 평가 결과가 다름(비결정적)")


def test_source_purity():
    with open(os.path.join(HERE, "metrics251_compare.py"), encoding="utf-8") as f:
        src = f.read()
    # 주석을 제거한 실제 코드만 검사(엔진 테스트와 동일 방식).
    code = "\n".join(line.split("#", 1)[0] for line in src.splitlines())
    for banned in ("datetime.now(", "time.time(", "date.today(", "utcnow(", "random("):
        check(banned not in code, f"compare 소스에 결정성 위반(벽시계/난수): {banned!r}")
    for banned in ("requests", "urllib", "socket", "subprocess", "public/"):
        check(banned not in code, f"compare 소스에 네트워크/공개경로 흔적: {banned!r}")


TESTS = [
    test_calendar,
    test_identical_all_comparable,
    test_unchanged_config_changed_factor_population,
    test_changed_ranking_universe_only,
    test_ticker_entering_or_leaving,
    test_changed_config,
    test_changed_engine_version,
    test_source_contract_incompatible,
    test_source_input_unpublished,
    test_current_missing,
    test_previous_missing,
    test_current_unpublished,
    test_previous_unpublished,
    test_pairing_weekend,
    test_pairing_holiday,
    test_pairing_no_previous_market_day,
    test_pairing_previous_date_mismatch,
    test_pairing_out_of_range,
    test_valid_pairing_preserves_structural,
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
        print("FAIL — Slice G 비교 capability 게이트")
        for f in failures:
            print("  -", f)
        return 1
    print(f"PASS — Slice G 거래일 calendar adapter + 4층 비교 capability ({len(TESTS)} 케이스). "
          "raw 는 유니버스 변경에도 비교 가능, factor/composite/rank 는 모집단·config·engine·pairing 에 "
          "따라 안정 사유 코드로 숨김.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
