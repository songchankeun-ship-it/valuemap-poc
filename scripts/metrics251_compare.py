#!/usr/bin/env python3
# Metrics 2.5.1 거래일 캘린더 어댑터 + 비교 capability 계약 (Slice G) — 순수·결정적·표준 라이브러리 전용.
#
# 목적(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D05, §10 Slice G,
#      원안 티켓 ORN-2504):
#   * 로컬 KRX 거래일 calendar adapter 계약을 정의한다. 이 slice 는 외부 캘린더 서비스나
#     네트워크를 호출하지 않는다 — fixture(주말/공휴일/영업일 목록)만 사용한다.
#   * 단일 canCompare 대신 §M251-D05 의 4층 비교 capability 를 반환한다:
#       raw / factorScore(factor별) / compositeScore / rank.
#     각 층은 서로 다른 동일성을 요구한다(아래 표). 유니버스가 바뀌어도 원시값(raw)은
#     비교 가능할 수 있으며, 그때 영향받는 백분위(factor 점수)와 순위(rank)만 숨긴다.
#   * 안정적인 사유 코드(reason code)와 기대/실제 거래일(expected/actual dates)을 반환한다.
#
#   §M251-D05 비교 층별 요구 동일성:
#   | 비교        | 필요한 동일성                                              |
#   |-------------|------------------------------------------------------------|
#   | raw         | 원시 정의(engineVersion) · 소스 계약 · 두 날짜의 게시 상태 |
#   | factorScore | metrics/config(engineVersion+configHash) · 해당 factor 모집단 해시 |
#   | composite   | metrics/config · 네 factor 점수 비교 가능                  |
#   | rank        | 위 조건 · ranking universe 해시                            |
#
# 반드시 지키는 규칙(설계서 §4 변경 불가 원칙 · 작업 지시):
#   * 결측/비교불가를 임의 기본값으로 채우지 않는다 — 비교 불가면 False + 사유 코드.
#   * 벽시계 시각 금지(datetime.now()/time.time()/date.today() 등). 날짜 문자열(YYYY-MM-DD)의
#     요일 판정과 범위 열거는 명시적 fixture 입력에서만 파생되며 결정적이다.
#   * 외부 캘린더 서비스/네트워크 금지 — calendar 는 로컬 fixture 로만 구성한다.
#   * public/ 또는 공개 API 에 아무것도 쓰지 않는다. 공개 Metrics 2.4 산출물 미변경.
#   * factor 키는 엔진(Slice D)을 단일 출처로 재사용한다(중복 정의 금지).
from __future__ import annotations

import datetime
import os
import sys
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import metrics251_engine as eng  # noqa: E402  (Slice D 순수 엔진 — factor 키 단일 출처)

# factor(metric) 키 — 엔진과 동일 순서/집합. ("momentum","activity","value","riskAdjusted")
METRIC_KEYS = eng.FACTORS

# ---------------------------------------------------------------------------
# 안정적 사유 코드(reason codes). 문자열 값은 계약이므로 바꾸지 않는다.
# ---------------------------------------------------------------------------
# 긍정(비교 가능) 표식.
COMPARABLE = "COMPARABLE"

# 스냅샷 가용성·게시(publication) 게이트 — 어느 한 층도 성립할 수 없게 만든다.
CURRENT_SNAPSHOT_MISSING = "CURRENT_SNAPSHOT_MISSING"
PREVIOUS_SNAPSHOT_MISSING = "PREVIOUS_SNAPSHOT_MISSING"
CURRENT_UNPUBLISHED = "CURRENT_UNPUBLISHED"
PREVIOUS_UNPUBLISHED = "PREVIOUS_UNPUBLISHED"

# 구조적(structural) 비교 차단 사유.
ENGINE_VERSION_MISMATCH = "ENGINE_VERSION_MISMATCH"   # 원시 정의 상이 → raw 포함 전 층 차단
CONFIG_MISMATCH = "CONFIG_MISMATCH"                   # config 상이 → factor/composite/rank 차단
SOURCE_CONTRACT_INCOMPATIBLE = "SOURCE_CONTRACT_INCOMPATIBLE"  # sourceDates 키 계약 상이 → raw 차단
SOURCE_INPUT_UNPUBLISHED = "SOURCE_INPUT_UNPUBLISHED"          # 한쪽 prices/volumes 미게시 → raw 차단
FACTOR_POPULATION_MISMATCH = "FACTOR_POPULATION_MISMATCH"      # 해당 factor 모집단 해시 상이
RANKING_UNIVERSE_MISMATCH = "RANKING_UNIVERSE_MISMATCH"        # ranking universe 해시 상이 → rank 차단
FACTOR_NOT_COMPARABLE = "FACTOR_NOT_COMPARABLE"        # ≥1 factor 점수 비교불가 → composite 전파 차단
COMPOSITE_NOT_COMPARABLE = "COMPOSITE_NOT_COMPARABLE"  # composite 비교불가 → rank 전파 차단

# 캘린더 pairing(거래일 짝짓기) 사유.
TRADING_DAY = "TRADING_DAY"
WEEKEND = "WEEKEND"
HOLIDAY = "HOLIDAY"
OUT_OF_CALENDAR_RANGE = "OUT_OF_CALENDAR_RANGE"
NO_PREVIOUS_MARKET_DAY = "NO_PREVIOUS_MARKET_DAY"
PREVIOUS_MARKET_DATE_MATCH = "PREVIOUS_MARKET_DATE_MATCH"
PREVIOUS_MARKET_DATE_MISMATCH = "PREVIOUS_MARKET_DATE_MISMATCH"
PAIRING_INVALID = "PAIRING_INVALID"   # pairing 이 유효하지 않아 최종 비교를 숨김


# ---------------------------------------------------------------------------
# 거래일 calendar adapter 계약(외부 서비스 금지 — 로컬 fixture 로만 구현).
# ---------------------------------------------------------------------------
def _parse(date_str):
    """'YYYY-MM-DD' → datetime.date. 벽시계 아님(입력 문자열에서만 파생)."""
    y, m, d = (int(p) for p in str(date_str).split("-"))
    return datetime.date(y, m, d)


class TradingCalendar(ABC):
    """거래일 캘린더 계약. 구현은 로컬 fixture 로만 만들며 네트워크/외부 서비스를 호출하지 않는다.

    모든 날짜는 'YYYY-MM-DD' 문자열이다(사전식 비교 = 날짜 비교). day_kind 는 안정적 사유 코드
    (TRADING_DAY/WEEKEND/HOLIDAY/OUT_OF_CALENDAR_RANGE)를 반환한다.
    """

    @abstractmethod
    def covers(self, date):
        """캘린더가 아는 범위 안의 날짜인가(범위 밖은 판정 불가)."""

    @abstractmethod
    def is_trading_day(self, date):
        """거래일이면 True."""

    @abstractmethod
    def day_kind(self, date):
        """TRADING_DAY / WEEKEND / HOLIDAY / OUT_OF_CALENDAR_RANGE 중 하나."""

    @abstractmethod
    def previous_trading_day(self, date):
        """date 직전(엄격히 이전)의 거래일. 없으면 None."""


class FixtureTradingCalendar(TradingCalendar):
    """명시적 거래일 목록(또는 범위+주말+공휴일)에서 만든 결정적 캘린더. 외부 의존 없음."""

    def __init__(self, trading_days, *, range_start=None, range_end=None,
                 weekend_weekdays=(5, 6), holidays=()):
        self._days = sorted({str(d) for d in trading_days})
        self._set = set(self._days)
        self._weekend = set(weekend_weekdays)
        self._holidays = {str(h) for h in holidays}
        self._start = str(range_start) if range_start else (self._days[0] if self._days else None)
        self._end = str(range_end) if range_end else (self._days[-1] if self._days else None)

    @classmethod
    def from_range(cls, start, end, *, weekend_weekdays=(5, 6), holidays=()):
        """[start,end] 구간의 평일에서 공휴일을 뺀 거래일 목록을 결정적으로 열거한다."""
        weekend = set(weekend_weekdays)
        hol = {str(h) for h in holidays}
        days = []
        cur = _parse(start)
        last = _parse(end)
        while cur <= last:
            iso = cur.isoformat()
            if cur.weekday() not in weekend and iso not in hol:
                days.append(iso)
            cur = cur + datetime.timedelta(days=1)
        return cls(days, range_start=str(start), range_end=str(end),
                   weekend_weekdays=weekend_weekdays, holidays=hol)

    @classmethod
    def from_fixture(cls, fixture):
        """compare_calendar.json 형태의 dict 에서 캘린더를 만든다."""
        rng = fixture["range"]
        return cls.from_range(
            rng["start"], rng["end"],
            weekend_weekdays=tuple(fixture.get("weekendWeekdays", (5, 6))),
            holidays=fixture.get("holidays", []))

    def covers(self, date):
        if self._start is None or self._end is None:
            return False
        return self._start <= str(date) <= self._end

    def is_trading_day(self, date):
        return str(date) in self._set

    def day_kind(self, date):
        date = str(date)
        if not self.covers(date):
            return OUT_OF_CALENDAR_RANGE
        if date in self._set:
            return TRADING_DAY
        if _parse(date).weekday() in self._weekend:
            return WEEKEND
        return HOLIDAY

    def previous_trading_day(self, date):
        date = str(date)
        prev = None
        for d in self._days:  # 오름차순
            if d < date:
                prev = d
            else:
                break
        return prev

    def trading_days(self):
        return list(self._days)


# ---------------------------------------------------------------------------
# 비교 입력 — 스냅샷 + 게시(publication) 상태. 게시 여부는 스냅샷 runState 가 아니라
# Slice F pointer/manifest 로 결정되므로(승격되어야 게시) 명시적 플래그로 분리한다.
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class SnapshotRef:
    snapshot: Optional[dict]
    published: bool = True


def published_ref(snapshot):
    return SnapshotRef(snapshot, True)


def unpublished_ref(snapshot):
    return SnapshotRef(snapshot, False)


def missing_ref():
    return SnapshotRef(None, False)


def _as_ref(x):
    if isinstance(x, SnapshotRef):
        return x
    if x is None:
        return SnapshotRef(None, False)
    if isinstance(x, dict) and "snapshot" in x and "engineVersion" not in x:
        # {"snapshot": {...}|None, "published": bool} 래퍼.
        return SnapshotRef(x.get("snapshot"), bool(x.get("published", True)))
    # 원시 스냅샷 dict — 기본 게시 상태로 간주(편의).
    return SnapshotRef(x, True)


# ---------------------------------------------------------------------------
# 구조적 비교 — 캘린더 pairing 과 무관하게 두 스냅샷의 층별 비교 가능성을 판정한다.
# ---------------------------------------------------------------------------
def _empty_reasons():
    return {"raw": [], "factorScore": {k: [] for k in METRIC_KEYS},
            "compositeScore": [], "rank": []}


def _blocked(codes):
    """게이트(가용성/게시) 실패 — 모든 층을 codes 로 차단한다."""
    codes = list(codes)
    return {
        "capabilities": {
            "raw": False,
            "factorScore": {k: False for k in METRIC_KEYS},
            "compositeScore": False,
            "rank": False,
        },
        "reasons": {
            "raw": list(codes),
            "factorScore": {k: list(codes) for k in METRIC_KEYS},
            "compositeScore": list(codes),
            "rank": list(codes),
        },
        "meta": {
            "gated": True,
            "gateReasons": list(codes),
            "engineVersionMatch": None,
            "configHashMatch": None,
            "factorPopulationMatch": {k: None for k in METRIC_KEYS},
            "rankingUniverseMatch": None,
            "notComparableFactors": list(METRIC_KEYS),
        },
    }


def _source_contract_reasons(a, b):
    """raw 비교를 위한 소스 계약 검사. 문제 사유 리스트(비면 통과)."""
    sa = a.get("sourceDates") or {}
    sb = b.get("sourceDates") or {}
    reasons = []
    if set(sa.keys()) != set(sb.keys()):
        reasons.append(SOURCE_CONTRACT_INCOMPATIBLE)
    # raw(가격·거래량 파생) 비교는 두 날짜 모두 prices·volumes 가 게시(비-null)여야 한다.
    if not (sa.get("prices") and sa.get("volumes")) or not (sb.get("prices") and sb.get("volumes")):
        reasons.append(SOURCE_INPUT_UNPUBLISHED)
    return reasons


def _factor_hash(snap, factor):
    return ((snap.get("factorPopulations") or {}).get(factor) or {}).get("hash")


def _ranking_hash(snap):
    return (snap.get("rankingPopulation") or {}).get("hash")


def compare_snapshots(current_ref, previous_ref):
    """두 스냅샷의 층별 비교 capability(구조적). 부작용 없음·결정적.

    반환: {"capabilities": {raw, factorScore{...}, compositeScore, rank},
           "reasons": {층별 안정 사유 코드 리스트},
           "meta": {동일성 상세}}.
    가용성/게시 게이트 실패 시 모든 층을 해당 게이트 코드로 차단한다.
    """
    cur = _as_ref(current_ref)
    prev = _as_ref(previous_ref)

    gate = []
    if cur.snapshot is None:
        gate.append(CURRENT_SNAPSHOT_MISSING)
    elif not cur.published:
        gate.append(CURRENT_UNPUBLISHED)
    if prev.snapshot is None:
        gate.append(PREVIOUS_SNAPSHOT_MISSING)
    elif not prev.published:
        gate.append(PREVIOUS_UNPUBLISHED)
    if gate:
        return _blocked(gate)

    a, b = cur.snapshot, prev.snapshot
    ev_ok = a.get("engineVersion") == b.get("engineVersion")
    cfg_ok = a.get("configHash") == b.get("configHash")

    reasons = _empty_reasons()

    # ---- raw: 원시 정의(engineVersion) + 소스 계약 + 게시(이미 게이트 통과) ----
    #   config 는 요구하지 않는다 — 유니버스/모집단/config 가 바뀌어도 원시값은 비교 가능할 수 있다
    #   (§M251-D05). 원시 정의(공식) 의미 변경은 §M251-D01 정책상 engineVersion 을 올려야 하므로
    #   engineVersion 동일성으로 원시 정의 동일성을 대리한다.
    raw_reasons = []
    if not ev_ok:
        raw_reasons.append(ENGINE_VERSION_MISMATCH)
    raw_reasons.extend(_source_contract_reasons(a, b))
    raw_ok = not raw_reasons
    reasons["raw"] = raw_reasons or [COMPARABLE]

    # ---- factorScore[k]: metrics/config + 해당 factor 모집단 해시 ----
    factor_ok = {}
    factor_pop_match = {}
    for k in METRIC_KEYS:
        fr = []
        if not ev_ok:
            fr.append(ENGINE_VERSION_MISMATCH)
        if not cfg_ok:
            fr.append(CONFIG_MISMATCH)
        pop_match = _factor_hash(a, k) == _factor_hash(b, k)
        factor_pop_match[k] = pop_match
        if not pop_match:
            fr.append(FACTOR_POPULATION_MISMATCH)
        factor_ok[k] = not fr
        reasons["factorScore"][k] = fr or [COMPARABLE]

    # ---- compositeScore: metrics/config + 네 factor 점수 비교 가능 ----
    not_comparable_factors = [k for k in METRIC_KEYS if not factor_ok[k]]
    comp = []
    if not ev_ok:
        comp.append(ENGINE_VERSION_MISMATCH)
    if not cfg_ok:
        comp.append(CONFIG_MISMATCH)
    if not_comparable_factors:
        comp.append(FACTOR_NOT_COMPARABLE)
    composite_ok = not comp
    reasons["compositeScore"] = comp or [COMPARABLE]

    # ---- rank: composite 비교 가능 + ranking universe 해시 ----
    ranking_match = _ranking_hash(a) == _ranking_hash(b)
    rk = []
    if not composite_ok:
        rk.append(COMPOSITE_NOT_COMPARABLE)
    if not ranking_match:
        rk.append(RANKING_UNIVERSE_MISMATCH)
    rank_ok = not rk
    reasons["rank"] = rk or [COMPARABLE]

    return {
        "capabilities": {
            "raw": raw_ok,
            "factorScore": factor_ok,
            "compositeScore": composite_ok,
            "rank": rank_ok,
        },
        "reasons": reasons,
        "meta": {
            "gated": False,
            "gateReasons": [],
            "engineVersionMatch": ev_ok,
            "configHashMatch": cfg_ok,
            "factorPopulationMatch": factor_pop_match,
            "rankingUniverseMatch": ranking_match,
            "notComparableFactors": not_comparable_factors,
        },
    }


# ---------------------------------------------------------------------------
# 캘린더 pairing — 현재 스냅샷의 거래일과 그 직전 거래일을 짝짓고, 제공된 이전 스냅샷이
# 그 직전 거래일과 일치하는지 검증한다. 기대/실제 거래일과 안정 사유 코드를 반환한다.
# ---------------------------------------------------------------------------
def pair(current_ref, previous_ref, calendar):
    """거래일 짝짓기 결과(dict). 부작용 없음·결정적.

    valid=True 는 현재 날짜가 거래일이고, 직전 거래일이 존재하며, 이전 스냅샷의 marketDate 가
    그 직전 거래일과 정확히 일치할 때만이다. 그 외에는 안정 사유 코드로 이유를 남긴다.
    """
    cur = _as_ref(current_ref)
    prev = _as_ref(previous_ref)
    cur_date = cur.snapshot.get("marketDate") if cur.snapshot else None
    prev_date = prev.snapshot.get("marketDate") if prev.snapshot else None

    if cur.snapshot is None or not cur_date:
        return {
            "currentMarketDate": cur_date,
            "currentDayKind": None,
            "expectedPreviousMarketDate": None,
            "actualPreviousMarketDate": prev_date,
            "reason": CURRENT_SNAPSHOT_MISSING,
            "valid": False,
        }

    kind = calendar.day_kind(cur_date)
    expected_prev = calendar.previous_trading_day(cur_date) if kind == TRADING_DAY else None

    if kind == WEEKEND:
        reason, valid = WEEKEND, False
    elif kind == HOLIDAY:
        reason, valid = HOLIDAY, False
    elif kind == OUT_OF_CALENDAR_RANGE:
        reason, valid = OUT_OF_CALENDAR_RANGE, False
    elif expected_prev is None:
        reason, valid = NO_PREVIOUS_MARKET_DAY, False
    elif prev.snapshot is None or not prev_date:
        reason, valid = PREVIOUS_SNAPSHOT_MISSING, False
    elif prev_date != expected_prev:
        reason, valid = PREVIOUS_MARKET_DATE_MISMATCH, False
    else:
        reason, valid = PREVIOUS_MARKET_DATE_MATCH, True

    return {
        "currentMarketDate": cur_date,
        "currentDayKind": kind,
        "expectedPreviousMarketDate": expected_prev,
        "actualPreviousMarketDate": prev_date,
        "reason": reason,
        "valid": valid,
    }


def evaluate_comparison(current_ref, previous_ref, calendar):
    """캘린더 pairing + 구조적 capability 를 결합한 최종 판정. 부작용 없음·결정적.

    - structural: pairing 과 무관한 순수 구조적 비교(compare_snapshots).
    - pairing: 거래일 짝짓기(기대/실제 거래일 + 사유).
    - capabilities/reasons: pairing 이 유효할 때만 structural 을 그대로 노출하고,
      유효하지 않으면 모든 층을 숨기되(False) 사유에 pairing 실패를 정확히 남긴다.
    """
    structural = compare_snapshots(current_ref, previous_ref)
    pairing = pair(current_ref, previous_ref, calendar)

    if pairing["valid"]:
        capabilities = structural["capabilities"]
        reasons = structural["reasons"]
    else:
        codes = [PAIRING_INVALID, pairing["reason"]]
        capabilities = {
            "raw": False,
            "factorScore": {k: False for k in METRIC_KEYS},
            "compositeScore": False,
            "rank": False,
        }
        reasons = {
            "raw": list(codes),
            "factorScore": {k: list(codes) for k in METRIC_KEYS},
            "compositeScore": list(codes),
            "rank": list(codes),
        }

    return {
        "pairing": pairing,
        "structural": structural,
        "capabilities": capabilities,
        "reasons": reasons,
    }


if __name__ == "__main__":
    print("metrics251_compare: Slice G 거래일 calendar adapter + 4층 비교 capability(순수).")
    print(f"  metricKeys={list(METRIC_KEYS)}")
    print("  import 후 FixtureTradingCalendar.from_fixture(...) 와 "
          "evaluate_comparison(cur, prev, calendar) 를 사용한다.")
