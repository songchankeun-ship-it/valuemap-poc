#!/usr/bin/env python3
# ORNScore 장마감 운영 자동화 배치 — Slice B: fail-closed 시장일 입력 어댑터.
#   (governing plan: docs/ornscore-market-close-automation-2026-07-19.md · Metrics 2.5.1 설계서
#    docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §8 데이터 계약 · §M251-D02/§M251-D10,
#    운영 런북 docs/metrics-2.5.1-operations-runbook.md §6.1 준비 입력.)
#
# 목적:
#   * **정확히 하나의 진짜 시장일** Metrics 2.5.1 run 요청(request)과 거래일 캘린더를,
#     ORNScore 소유의 **공개 envelope 데이터**(public/data 의 stocks.json + prices/{ticker}.json)
#     또는 **명시적 로컬 fixture**(같은 레이아웃)에서 결정적으로 조립한다.
#   * 산출물은 **오직 비공개 `.metrics251-shadow/inputs/` 아래에만** 쓴다. public/·public 데이터·
#     Metrics 2.4 런타임·저장소 pointer 를 읽거나 쓰지 않는다.
#   * 이 어댑터는 preflight(Slice M)/run(Slice N) 의 **앞단**이다: 조립만 하고, run 은 하지 않는다.
#     조립된 request.json 은 그 뒤(소유자 승인·별도 작업)에서 run:metrics251 의 입력이 될 수 있다.
#
# fail-closed 계약 — 아래 중 하나라도 **증명 불가**면 정확한 사유 코드를 남기고 **promotable request 를
#   쓰지 않는다**(부분 산출물 금지). 절대 값을 발명/forward-fill/추정/암묵 대체하지 않는다:
#     1) 정확히 138개 유니크 ticker.
#     2) 정확·상호일관 소스일(prices == volumes == fundamentals == marketDate).
#     3) 충분한 실제 가격/거래량 이력(config 최소치 이상).
#     4) 필수 PER/PBR 입력(양수·유한).
#     5) 공통의 실제 거래일(캘린더가 커버하는 거래일) — 미래/stale 금지.
#     6) 합성/테스트 마커 없음(genuine-run 게이트 재사용).
#     7) 결정적 순서/해시(ticker 정렬·canonical 직렬화·pin 해시).
#     8) 미해결 입력 모호성 없음(가격 시계열 종료일 불일치 등).
#   출력 경로가 public/ 밑이거나 `.metrics251-shadow/inputs/` 밖이면 즉시 거절(무기록).
#
# 반드시 지키는 규칙(설계서 §4 · §M251-D10 · 작업 지시):
#   * 벽시계 시각 금지(datetime.now()/time.time()/date.today())·난수 금지·네트워크 금지 —
#     출력은 입력(로컬 파일)에서만 결정적으로 파생된다.
#   * 결측을 50/factor 평균/직전값으로 채우지 않는다 — 결측은 사유 코드 + 무기록.
#   * 공개 산식/데이터/타입을 읽기전용 호환성 확인 외에 건드리지 않는다.
#   * 계약 primitive(config/engine/preflight/store)를 재구현하지 않고 재사용한다.
from __future__ import annotations

import argparse
import json
import math
import os
import sys
from dataclasses import dataclass, field
from typing import Optional

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import metrics251_engine as eng              # noqa: E402  (ENGINE_VERSION·EngineRequest·_input_manifest_hash)
import metrics251_snapshot_store as store    # noqa: E402  (DEFAULT_SHADOW_ROOT·_under_public 계약)
import metrics251_e2e_matrix as e2e          # noqa: E402  (genuine-run 게이트·합성 마커 탐지 재사용)
from metrics251_config import CONFIG_PATH, canonical_bytes, config_hash  # noqa: E402

ENGINE_VERSION = eng.ENGINE_VERSION

# 비공개 입력 산출물이 놓이는 유일한 하위 디렉터리(§M251-D10, 작업 지시).
INPUTS_SUBDIR = "inputs"
DEFAULT_SHADOW_ROOT = store.DEFAULT_SHADOW_ROOT

# 유니버스 크기는 배치 전체에서 frozen(138).
EXPECTED_UNIVERSE = 138

# promotable 입력 산출물 이름(성공 시에만 기록).
ARTIFACT_REQUEST = "request.json"
ARTIFACT_CALENDAR = "calendar.json"
ARTIFACT_REPORT = "assembly-report.json"

# 소스 envelope 안에서 합성/테스트로 의심되는 provenance 문자열(대소문자 무시 부분일치).
# genuine-run 게이트(구조적 마커)와 별개로, 사람이 쓴 "source"/"note" 류 텍스트도 방어적으로 잡는다.
_SUSPECT_SOURCE_SUBSTRINGS = ("synthetic", "fixture", "mock", "sample", "dummy", "test", "fake", "placeholder")

# ---------------------------------------------------------------------------
# 안정적 기계판독 사유 코드(정렬해 반환). MISSING_INPUT / STALE_SOURCE 계열 + 구조 사유.
# ---------------------------------------------------------------------------
# envelope / 소스 로드.
ENVELOPE_MISSING = "ENVELOPE_MISSING"
ENVELOPE_MALFORMED = "ENVELOPE_MALFORMED"
SYNTHETIC_MARKER_PRESENT = "SYNTHETIC_MARKER_PRESENT"

# 유니버스.
UNIVERSE_COUNT_MISMATCH = "UNIVERSE_COUNT_MISMATCH"
DUPLICATE_TICKER = "DUPLICATE_TICKER"
TICKER_MISSING = "TICKER_MISSING"
PRICE_SERIES_MISSING = "PRICE_SERIES_MISSING"

# 이력 충분성.
INSUFFICIENT_PRICE_HISTORY = "INSUFFICIENT_PRICE_HISTORY"
INSUFFICIENT_VOLUME_HISTORY = "INSUFFICIENT_VOLUME_HISTORY"

# 숫자 위생.
PRICE_NON_POSITIVE = "PRICE_NON_POSITIVE"
VOLUME_NEGATIVE = "VOLUME_NEGATIVE"

# 필수 PER/PBR(MISSING_INPUT 계열).
FUNDAMENTAL_MISSING = "FUNDAMENTAL_MISSING"
FUNDAMENTAL_NON_POSITIVE = "FUNDAMENTAL_NON_POSITIVE"

# 날짜/거래일(STALE_SOURCE 계열 포함).
MARKET_DATE_UNRESOLVED = "MARKET_DATE_UNRESOLVED"
MARKET_DATE_AMBIGUOUS = "MARKET_DATE_AMBIGUOUS"
MARKET_DATE_MALFORMED = "MARKET_DATE_MALFORMED"
CALENDAR_MISSING = "CALENDAR_MISSING"
CALENDAR_UNCOVERED = "CALENDAR_UNCOVERED"
MARKET_DATE_NOT_TRADING_DAY = "MARKET_DATE_NOT_TRADING_DAY"
SOURCE_DATE_MISSING = "SOURCE_DATE_MISSING"
SOURCE_DATE_MALFORMED = "SOURCE_DATE_MALFORMED"
SOURCE_DATE_FUTURE = "SOURCE_DATE_FUTURE"
SOURCE_DATE_STALE = "SOURCE_DATE_STALE"
SOURCE_DATE_MISMATCH = "SOURCE_DATE_MISMATCH"

# config / 엔진.
CONFIG_MISSING = "CONFIG_MISSING"
CONFIG_ENGINE_MISMATCH = "CONFIG_ENGINE_MISMATCH"

# 출력 레이아웃(무기록 사유).
OUTPUT_NOT_PRIVATE = "OUTPUT_NOT_PRIVATE"
OUTPUT_NOT_UNDER_INPUTS = "OUTPUT_NOT_UNDER_INPUTS"

# 방어적 catch-all.
INTERNAL_ERROR = "INTERNAL_ERROR"

ALL_REASONS = frozenset({
    ENVELOPE_MISSING, ENVELOPE_MALFORMED, SYNTHETIC_MARKER_PRESENT,
    UNIVERSE_COUNT_MISMATCH, DUPLICATE_TICKER, TICKER_MISSING, PRICE_SERIES_MISSING,
    INSUFFICIENT_PRICE_HISTORY, INSUFFICIENT_VOLUME_HISTORY,
    PRICE_NON_POSITIVE, VOLUME_NEGATIVE,
    FUNDAMENTAL_MISSING, FUNDAMENTAL_NON_POSITIVE,
    MARKET_DATE_UNRESOLVED, MARKET_DATE_AMBIGUOUS, MARKET_DATE_MALFORMED,
    CALENDAR_MISSING, CALENDAR_UNCOVERED, MARKET_DATE_NOT_TRADING_DAY,
    SOURCE_DATE_MISSING, SOURCE_DATE_MALFORMED, SOURCE_DATE_FUTURE, SOURCE_DATE_STALE,
    SOURCE_DATE_MISMATCH, CONFIG_MISSING, CONFIG_ENGINE_MISMATCH,
    OUTPUT_NOT_PRIVATE, OUTPUT_NOT_UNDER_INPUTS, INTERNAL_ERROR,
})

# 무기록(출력 레이아웃) 사유 — 이 코드가 있으면 아무 파일도 쓰지 않는다(다른 사유와 무관).
_LAYOUT_REASONS = frozenset({OUTPUT_NOT_PRIVATE, OUTPUT_NOT_UNDER_INPUTS})


# ---------------------------------------------------------------------------
# 결과 타입(typed) — ok 일 때만 request/expected/writtenPaths 를 채운다.
# ---------------------------------------------------------------------------
@dataclass
class AssemblyResult:
    ok: bool
    reasons: list = field(default_factory=list)      # 정렬된 안정 사유(ok=True 면 빈 리스트)
    marketDate: Optional[str] = None
    checks: dict = field(default_factory=dict)        # 그룹별 요약(결정적 진단)
    detail: list = field(default_factory=list)        # 사람용 세부(정렬)
    sourceMode: Optional[str] = None
    request: Optional[dict] = None                    # 조립된 promotable request(ok 일 때만)
    expected: Optional[dict] = None                   # 결정적 pin(ok 일 때만)
    assemblyHash: Optional[str] = None                # sha256(canonical request)
    writtenPaths: list = field(default_factory=list)  # 실제 기록된 파일(무기록이면 빈 리스트)

    def to_dict(self, *, include_request=True):
        out = {
            "ok": self.ok,
            "reasons": self.reasons,
            "marketDate": self.marketDate,
            "sourceMode": self.sourceMode,
            "checks": self.checks,
            "detail": self.detail,
            "assemblyHash": self.assemblyHash,
            "expected": self.expected,
            "writtenPaths": self.writtenPaths,
            "universeExpected": EXPECTED_UNIVERSE,
            "engineVersion": ENGINE_VERSION,
        }
        if include_request:
            out["request"] = self.request
        return out


# ---------------------------------------------------------------------------
# 경로 판정 — store 규칙과 동일(예외 대신 bool, fail-closed).
# ---------------------------------------------------------------------------
def _under_public(path):
    if not path:
        return False
    p_abs = os.path.abspath(path)
    public_abs = os.path.abspath(os.path.join(ROOT, "public"))
    try:
        return os.path.commonpath([p_abs, public_abs]) == public_abs
    except ValueError:
        return False


def _is_within(child, parent):
    if not child or not parent:
        return False
    try:
        return os.path.commonpath([os.path.abspath(child), os.path.abspath(parent)]) == os.path.abspath(parent)
    except ValueError:
        return False


def resolve_inputs_dir(shadow_root):
    """`<shadow_root>/inputs` 를 반환하되, public/ 밑이거나 유효하지 않으면 사유 코드를 함께 준다.

    반환: (inputs_dir|None, reasons). inputs_dir 이 None 이면 아무 파일도 쓰지 않는다(fail-closed).
    """
    reasons = []
    if not shadow_root:
        return None, [OUTPUT_NOT_PRIVATE]
    if _under_public(shadow_root):
        return None, [OUTPUT_NOT_PRIVATE]
    inputs_dir = os.path.join(os.path.abspath(shadow_root), INPUTS_SUBDIR)
    if _under_public(inputs_dir):
        return None, [OUTPUT_NOT_PRIVATE]
    # 레이아웃 이탈 방지: 반드시 shadow_root 의 inputs/ 하위여야 한다.
    if not _is_within(inputs_dir, shadow_root) or os.path.basename(inputs_dir) != INPUTS_SUBDIR:
        return None, [OUTPUT_NOT_UNDER_INPUTS]
    return inputs_dir, reasons


# ---------------------------------------------------------------------------
# 숫자 위생.
# ---------------------------------------------------------------------------
def _finite_positive(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) and x > 0


def _finite_nonneg(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) and x >= 0


def _normalize_business_date(value):
    """'YYYYMMDD' 또는 'YYYY-MM-DD' → 'YYYY-MM-DD'. 판별 불가면 None(발명하지 않는다)."""
    if not isinstance(value, str):
        return None
    v = value.strip()
    if len(v) == 8 and v.isdigit():
        return f"{v[0:4]}-{v[4:6]}-{v[6:8]}"
    if len(v) == 10 and v[4] == "-" and v[7] == "-" and v[:4].isdigit() and v[5:7].isdigit() and v[8:10].isdigit():
        return v
    return None


# ---------------------------------------------------------------------------
# config 로드 + 이력 요구치 도출(하드코딩 금지 — config 에서 계산).
# ---------------------------------------------------------------------------
def load_config(path=None):
    p = path or CONFIG_PATH
    with open(p, encoding="utf-8-sig") as f:
        return json.load(f)


def required_history(cfg):
    """(min_prices, min_volumes) — 어떤 factor 도 이력 부족으로 null 되지 않을 최소 관측치."""
    m = cfg["metrics"]["momentum"]
    r = cfg["metrics"]["riskAdjusted"]
    a = cfg["metrics"]["activity"]
    mom_need = max(m["minimumPricePoints"], max(m["lookbacksTradingDays"].values()) + 1)
    risk_need = max(r["minimumPricePoints"], r["requiredDailyReturns"] + 1)
    min_prices = max(mom_need, risk_need)
    min_volumes = max(a["minimumVolumePoints"], a["denominatorTradingDays"])
    return min_prices, min_volumes


# ---------------------------------------------------------------------------
# envelope 로더 — 공개 데이터/ fixture 는 동일 레이아웃(디렉터리 안 stocks.json + prices/{ticker}.json).
#   네트워크 금지, 벽시계 금지, 순수 로컬 읽기.
# ---------------------------------------------------------------------------
def _read_json(path):
    with open(path, encoding="utf-8-sig") as f:
        return json.load(f)


@dataclass
class Envelope:
    meta: dict                 # stocks.json 상단 메타(count·asOfBusinessDate·metricsVersion 등)
    stocks: list               # stocks.json 의 stocks 배열(per/pbr 포함)
    prices: dict               # {ticker: [{"d","c","v"}...]} 과거→현재
    ok: bool = True
    reasons: list = field(default_factory=list)
    detail: list = field(default_factory=list)


def load_envelope(data_dir):
    """디렉터리에서 envelope 를 로드한다. 로드 자체가 실패하면 ok=False + 사유(무기록)."""
    stocks_path = os.path.join(data_dir, "stocks.json")
    if not os.path.isfile(stocks_path):
        return Envelope(meta={}, stocks=[], prices={}, ok=False,
                        reasons=[ENVELOPE_MISSING], detail=[f"stocks.json 없음: {stocks_path}"])
    try:
        doc = _read_json(stocks_path)
    except (OSError, ValueError) as e:
        return Envelope(meta={}, stocks=[], prices={}, ok=False,
                        reasons=[ENVELOPE_MALFORMED], detail=[f"stocks.json 파싱 실패: {e!r}"])
    if not isinstance(doc, dict) or not isinstance(doc.get("stocks"), list):
        return Envelope(meta={}, stocks=[], prices={}, ok=False,
                        reasons=[ENVELOPE_MALFORMED], detail=["stocks.json 최상위 shape 불일치(stocks 배열 없음)"])
    meta = {k: v for k, v in doc.items() if k != "stocks"}
    stocks = doc["stocks"]

    prices = {}
    detail = []
    reasons = []
    prices_dir = os.path.join(data_dir, "prices")
    for s in stocks:
        if not isinstance(s, dict):
            continue
        ticker = s.get("ticker")
        if not ticker:
            continue
        ppath = os.path.join(prices_dir, f"{ticker}.json")
        if not os.path.isfile(ppath):
            reasons.append(PRICE_SERIES_MISSING)
            detail.append(f"{ticker}: prices/{ticker}.json 없음")
            continue
        try:
            pj = _read_json(ppath)
        except (OSError, ValueError) as e:
            reasons.append(ENVELOPE_MALFORMED)
            detail.append(f"{ticker}: prices 파싱 실패 {e!r}")
            continue
        pts = pj.get("points") if isinstance(pj, dict) else None
        if not isinstance(pts, list):
            reasons.append(ENVELOPE_MALFORMED)
            detail.append(f"{ticker}: prices.points 배열 아님")
            continue
        prices[ticker] = pts
    return Envelope(meta=meta, stocks=stocks, prices=prices, ok=not reasons,
                    reasons=sorted(set(reasons)), detail=detail)


# ---------------------------------------------------------------------------
# 개별 검사 — 각 함수는 (reasons, detail) 를 반환한다. 순수·부작용 없음.
# ---------------------------------------------------------------------------
def check_synthetic(meta, stocks):
    """구조적 genuine-run 게이트 + 사람이 쓴 source/note 텍스트의 합성 마커를 방어적으로 거부한다."""
    reasons = []
    detail = []
    accepted, gate_reasons = e2e.genuine_run_gate({"meta": meta, "stocks": stocks})
    if not accepted:
        reasons.append(SYNTHETIC_MARKER_PRESENT)
        detail.append(f"genuine-run 게이트 거부: {gate_reasons}")
    # 텍스트 힌트(예: source='synthetic fixture').
    for key in ("source", "note", "provenance", "kind"):
        val = meta.get(key)
        if isinstance(val, str):
            low = val.lower()
            hit = [w for w in _SUSPECT_SOURCE_SUBSTRINGS if w in low]
            if hit:
                reasons.append(SYNTHETIC_MARKER_PRESENT)
                detail.append(f"meta.{key} 에 합성 힌트 {hit}: {val!r}")
    return sorted(set(reasons)), detail


def resolve_market_date(prices):
    """모든 가격 시계열의 마지막 관측일이 **하나의 공통 거래일**로 수렴하는지 판정한다.

    반환: (market_date|None, reasons, detail). 시계열이 종료일에서 갈라지면 모호(AMBIGUOUS).
    """
    reasons = []
    detail = []
    last_dates = {}
    for ticker, pts in prices.items():
        if not pts:
            reasons.append(MARKET_DATE_UNRESOLVED)
            detail.append(f"{ticker}: 빈 가격 시계열")
            continue
        last = pts[-1]
        d = last.get("d") if isinstance(last, dict) else None
        if not isinstance(d, str) or _normalize_business_date(d) is None:
            reasons.append(MARKET_DATE_MALFORMED)
            detail.append(f"{ticker}: 마지막 관측일 malformed {d!r}")
            continue
        last_dates.setdefault(_normalize_business_date(d), []).append(ticker)
    if reasons:
        return None, sorted(set(reasons)), detail
    if not last_dates:
        return None, [MARKET_DATE_UNRESOLVED], ["가격 시계열이 하나도 없음"]
    if len(last_dates) != 1:
        # 서로 다른 종료일 → 미해결 모호성(합성으로 정렬하지 않는다).
        summary = {k: len(v) for k, v in sorted(last_dates.items())}
        return None, [MARKET_DATE_AMBIGUOUS], [f"가격 종료일 불일치: {summary}"]
    return next(iter(last_dates)), [], []


def check_calendar(market_date, calendar):
    reasons = []
    detail = []
    if calendar is None:
        return [CALENDAR_MISSING], ["거래일 캘린더 미제공 — 거래일 확정 불가"]
    if not market_date:
        return [MARKET_DATE_UNRESOLVED], []
    if not calendar.covers(market_date):
        reasons.append(CALENDAR_UNCOVERED)
        detail.append(f"marketDate {market_date} 가 캘린더 범위 밖")
    elif not calendar.is_trading_day(market_date):
        reasons.append(MARKET_DATE_NOT_TRADING_DAY)
        detail.append(f"marketDate {market_date} 가 거래일 아님(주말/공휴일)")
    return reasons, detail


def resolve_source_dates(meta, market_date):
    """소스일을 envelope 에서 도출하고 정확·상호일관·미래/stale 아님을 검증한다.

    * prices/volumes 소스일 = 가격 시계열 공통 종료일(= market_date) — 같은 point 에서 c/v 를 함께 읽으므로 동일.
    * fundamentals 소스일 = meta.asOfBusinessDate(정규화). 반드시 존재하고 market_date 와 정확히 일치.
    반환: (source_dates|None, reasons, detail).
    """
    reasons = []
    detail = []
    if not market_date:
        return None, [MARKET_DATE_UNRESOLVED], []
    fundamentals = _normalize_business_date(meta.get("asOfBusinessDate"))
    if meta.get("asOfBusinessDate") is None:
        reasons.append(SOURCE_DATE_MISSING)
        detail.append("meta.asOfBusinessDate 없음(재무 소스일 증명 불가)")
    elif fundamentals is None:
        reasons.append(SOURCE_DATE_MALFORMED)
        detail.append(f"meta.asOfBusinessDate malformed: {meta.get('asOfBusinessDate')!r}")
    else:
        if fundamentals > market_date:
            reasons.append(SOURCE_DATE_FUTURE)
            detail.append(f"fundamentals {fundamentals} > marketDate {market_date}(미래)")
        elif fundamentals < market_date:
            reasons.append(SOURCE_DATE_STALE)
            detail.append(f"fundamentals {fundamentals} < marketDate {market_date}(stale)")
        # market_date 와 다르면(위 두 갈래) 상호 불일치이기도 하다 — 강한 fail-closed.
        if fundamentals != market_date:
            reasons.append(SOURCE_DATE_MISMATCH)
    if reasons:
        return None, sorted(set(reasons)), detail
    return {"prices": market_date, "volumes": market_date, "fundamentals": fundamentals}, [], []


def check_universe(stocks):
    """정확히 138개, 유니크 ticker, ticker 존재."""
    reasons = []
    detail = []
    tickers = []
    for i, s in enumerate(stocks):
        if not isinstance(s, dict):
            reasons.append(TICKER_MISSING)
            detail.append(f"stocks[{i}] object 아님")
            continue
        t = s.get("ticker")
        if not t or not str(t).strip():
            reasons.append(TICKER_MISSING)
            detail.append(f"stocks[{i}] ticker 누락")
        else:
            tickers.append(str(t))
    if len(set(tickers)) != len(tickers):
        seen = set()
        dup = sorted({t for t in tickers if (t in seen) or seen.add(t)})
        reasons.append(DUPLICATE_TICKER)
        detail.append(f"중복 ticker: {dup}")
    if len(stocks) != EXPECTED_UNIVERSE:
        reasons.append(UNIVERSE_COUNT_MISMATCH)
        detail.append(f"유니버스 {len(stocks)} != {EXPECTED_UNIVERSE}")
    return sorted(set(reasons)), detail


def build_stock_input(stock, points, min_prices, min_volumes):
    """한 종목의 조립 입력 {ticker, prices, volumes, per, pbr} + per-stock 사유.

    반환: (stock_dict|None, reasons, detail). reasons 가 있으면 stock_dict 는 None.
    """
    reasons = []
    detail = []
    ticker = str(stock.get("ticker"))

    closes = []
    volumes = []
    for pt in points:
        if not isinstance(pt, dict):
            reasons.append(ENVELOPE_MALFORMED)
            detail.append(f"{ticker}: point object 아님")
            return None, sorted(set(reasons)), detail
        closes.append(pt.get("c"))
        volumes.append(pt.get("v"))

    if len(closes) < min_prices:
        reasons.append(INSUFFICIENT_PRICE_HISTORY)
        detail.append(f"{ticker}: 가격 {len(closes)} < {min_prices}")
    if len(volumes) < min_volumes:
        reasons.append(INSUFFICIENT_VOLUME_HISTORY)
        detail.append(f"{ticker}: 거래량 {len(volumes)} < {min_volumes}")

    # 숫자 위생: 모든 종가는 유한 양수, 모든 거래량은 유한 비음수(발명/치환 없음).
    if any(not _finite_positive(c) for c in closes):
        reasons.append(PRICE_NON_POSITIVE)
        detail.append(f"{ticker}: 비유한/비양수 종가 존재")
    if any(not _finite_nonneg(v) for v in volumes):
        reasons.append(VOLUME_NEGATIVE)
        detail.append(f"{ticker}: 비유한/음수 거래량 존재")

    # 필수 PER/PBR — 없으면 MISSING_INPUT(합성/대체 금지). valueNA 플래그도 결측으로 본다.
    per = stock.get("per")
    pbr = stock.get("pbr")
    if stock.get("valueNA") is True or per is None or pbr is None:
        reasons.append(FUNDAMENTAL_MISSING)
        detail.append(f"{ticker}: per/pbr 결측(per={per!r} pbr={pbr!r} valueNA={stock.get('valueNA')!r})")
    elif not _finite_positive(per) or not _finite_positive(pbr):
        reasons.append(FUNDAMENTAL_NON_POSITIVE)
        detail.append(f"{ticker}: per/pbr 비양수/비유한(per={per!r} pbr={pbr!r})")

    if reasons:
        return None, sorted(set(reasons)), detail
    return ({"ticker": ticker, "prices": closes, "volumes": volumes,
             "per": per, "pbr": pbr}, [], detail)


# ---------------------------------------------------------------------------
# 순수 조립 계약 — 모든 검사를 합쳐 결정적 AssemblyResult 를 만든다. fail-closed.
#   (파일을 쓰지 않는다 — 기록은 assemble_and_write 가 담당.)
# ---------------------------------------------------------------------------
def assemble(envelope, calendar, cfg, *, source_mode="fixture"):
    """envelope + calendar + config 에서 하나의 시장일 request 를 순수 조립한다(무기록)."""
    reasons = []
    detail = []
    checks = {}
    market_date = None
    request = None
    expected = None
    assembly_hash = None

    try:
        if not isinstance(envelope, Envelope):
            return AssemblyResult(ok=False, reasons=[INTERNAL_ERROR], sourceMode=source_mode,
                                  detail=["envelope 타입 오류"])
        if not envelope.ok:
            return AssemblyResult(ok=False, reasons=sorted(set(envelope.reasons)),
                                  sourceMode=source_mode, detail=list(envelope.detail),
                                  checks={"envelope": _summ(envelope.reasons)})

        if not isinstance(cfg, dict) or not cfg:
            reasons.append(CONFIG_MISSING)
        elif cfg.get("engineVersion") != ENGINE_VERSION:
            reasons.append(CONFIG_ENGINE_MISMATCH)
            detail.append(f"config.engineVersion={cfg.get('engineVersion')!r} != {ENGINE_VERSION!r}")
        checks["config"] = _summ([r for r in reasons if r in (CONFIG_MISSING, CONFIG_ENGINE_MISMATCH)])
        if reasons:
            return AssemblyResult(ok=False, reasons=sorted(set(reasons)), sourceMode=source_mode,
                                  detail=detail, checks=checks)

        min_prices, min_volumes = required_history(cfg)

        syn_reasons, syn_detail = check_synthetic(envelope.meta, envelope.stocks)
        checks["synthetic"] = _summ(syn_reasons)
        reasons += syn_reasons
        detail += syn_detail

        uni_reasons, uni_detail = check_universe(envelope.stocks)
        checks["universe"] = _summ(uni_reasons)
        reasons += uni_reasons
        detail += uni_detail

        market_date, md_reasons, md_detail = resolve_market_date(envelope.prices)
        checks["marketDate"] = _summ(md_reasons)
        reasons += md_reasons
        detail += md_detail

        cal_reasons, cal_detail = check_calendar(market_date, calendar)
        checks["calendar"] = _summ(cal_reasons)
        reasons += cal_reasons
        detail += cal_detail

        source_dates, sd_reasons, sd_detail = resolve_source_dates(envelope.meta, market_date)
        checks["sourceDates"] = _summ(sd_reasons)
        reasons += sd_reasons
        detail += sd_detail

        # per-stock 조립 — 하나라도 실패하면 request 를 만들지 않는다(부분 산출물 금지).
        stock_inputs = []
        stock_reasons = []
        stock_detail = []
        for s in envelope.stocks:
            if not isinstance(s, dict):
                continue
            ticker = s.get("ticker")
            if not ticker:
                continue
            pts = envelope.prices.get(str(ticker))
            if pts is None:
                stock_reasons.append(PRICE_SERIES_MISSING)
                stock_detail.append(f"{ticker}: 가격 시계열 없음")
                continue
            si, sr, sdd = build_stock_input(s, pts, min_prices, min_volumes)
            stock_reasons += sr
            stock_detail += sdd
            if si is not None:
                stock_inputs.append(si)
        checks["stocks"] = _summ(stock_reasons)
        reasons += stock_reasons
        detail += stock_detail

        reasons = sorted(set(reasons))
        if reasons:
            return AssemblyResult(ok=False, reasons=reasons, marketDate=market_date,
                                  sourceMode=source_mode, checks=checks, detail=sorted(set(detail)))

        # ---- 전 검사 통과 → 결정적 조립(ticker 정렬, canonical) ----
        stock_inputs.sort(key=lambda x: x["ticker"])
        expected = _derive_expected(cfg, market_date, source_dates, stock_inputs)
        request = {
            "marketDate": market_date,
            "sourceDates": source_dates,
            "stocks": stock_inputs,
            "expected": expected,
        }
        assembly_hash = _sha256_hex(canonical_bytes(request))
        return AssemblyResult(
            ok=True, reasons=[], marketDate=market_date, sourceMode=source_mode,
            checks=checks, detail=sorted(set(detail)), request=request, expected=expected,
            assemblyHash=assembly_hash)
    except Exception as e:  # noqa: BLE001  (fail-closed — 예상 못한 예외도 통과시키지 않는다)
        return AssemblyResult(ok=False, reasons=[INTERNAL_ERROR], marketDate=market_date,
                              sourceMode=source_mode, checks=checks, detail=[repr(e)])


def _derive_expected(cfg, market_date, source_dates, stock_inputs):
    """조립 입력에서 preflight pin(expected)을 결정적으로 파생한다(run.derive_expected 와 동일 규칙)."""
    req = eng.EngineRequest.from_dict({
        "config": cfg, "marketDate": market_date,
        "sourceDates": source_dates, "stocks": stock_inputs})
    return {
        "engineVersion": ENGINE_VERSION,
        "configHash": config_hash(cfg),
        "inputManifestHash": eng._input_manifest_hash(req, req.stocks),
        "marketDate": market_date,
        "sourceDates": dict(source_dates),
    }


def _sha256_hex(data):
    import hashlib
    return hashlib.sha256(data).hexdigest()


def _summ(reasons):
    return {"ok": not reasons, "reasons": sorted(set(reasons))}


# ---------------------------------------------------------------------------
# 조립 + 기록 — ok 이고 출력 경로가 비공개 inputs 하위일 때에만 promotable 산출물을 쓴다.
# ---------------------------------------------------------------------------
def assemble_and_write(envelope, calendar, cfg, shadow_root, calendar_doc, *, source_mode="fixture"):
    """assemble() 후, 통과 시에만 `<shadow_root>/inputs/` 에 request/calendar/report 를 원자적으로 쓴다.

    출력 경로가 public/ 밑이거나 inputs/ 밖이면 조립 성공 여부와 무관하게 **무기록**으로 거절한다.
    """
    inputs_dir, layout_reasons = resolve_inputs_dir(shadow_root)
    result = assemble(envelope, calendar, cfg, source_mode=source_mode)

    if layout_reasons:
        # 출력 레이아웃 위반 — 무기록. 조립 사유가 있으면 합치고, 없어도 레이아웃 사유로 실패.
        merged = sorted(set(list(result.reasons) + list(layout_reasons)))
        result.ok = False
        result.reasons = merged
        result.request = None
        result.expected = None
        result.writtenPaths = []
        result.checks["outputLayout"] = _summ(layout_reasons)
        return result

    result.checks["outputLayout"] = _summ([])
    if not result.ok:
        return result  # 조립 실패 → 무기록.

    # ---- 통과 → 원자적 기록(request/calendar/report). ----
    os.makedirs(inputs_dir, exist_ok=True)
    written = []
    req_bytes = canonical_bytes(result.request) + b"\n"
    store._atomic_write_bytes(os.path.join(inputs_dir, ARTIFACT_REQUEST), req_bytes)
    written.append(os.path.join(inputs_dir, ARTIFACT_REQUEST))

    cal_bytes = canonical_bytes(calendar_doc) + b"\n"
    store._atomic_write_bytes(os.path.join(inputs_dir, ARTIFACT_CALENDAR), cal_bytes)
    written.append(os.path.join(inputs_dir, ARTIFACT_CALENDAR))

    report = {
        "schema": "metrics251.market-input.assembly-report.v1",
        "ok": True,
        "engineVersion": ENGINE_VERSION,
        "marketDate": result.marketDate,
        "sourceMode": source_mode,
        "sourceDates": result.request["sourceDates"],
        "universeCount": len(result.request["stocks"]),
        "universeExpected": EXPECTED_UNIVERSE,
        "expected": result.expected,
        "assemblyHash": result.assemblyHash,
        "checks": result.checks,
        "artifacts": [ARTIFACT_REQUEST, ARTIFACT_CALENDAR],
        "note": ("Slice B 입력 조립 산출물 — genuine shadow run 이 아니다. run:metrics251 은 소유자 "
                 "승인(Gate 6) 뒤 별도 작업으로만 실행한다."),
    }
    rep_bytes = canonical_bytes(report) + b"\n"
    store._atomic_write_bytes(os.path.join(inputs_dir, ARTIFACT_REPORT), rep_bytes)
    written.append(os.path.join(inputs_dir, ARTIFACT_REPORT))

    result.writtenPaths = written
    return result


# ---------------------------------------------------------------------------
# CLI.
# ---------------------------------------------------------------------------
def _load_calendar_doc(path):
    if not path:
        return None, None
    from metrics251_compare import FixtureTradingCalendar
    doc = _read_json(path)
    return FixtureTradingCalendar.from_fixture(doc), doc


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="ORNScore Metrics 2.5.1 시장일 입력 어댑터 (Slice B, fail-closed, 무네트워크·무-run).")
    ap.add_argument("--source", choices=["public", "fixture"], default="public",
                    help="입력 출처 라벨(provenance). public=소유자 공개 envelope, fixture=명시적 로컬 fixture")
    ap.add_argument("--data-dir", default=None,
                    help="envelope 디렉터리(stocks.json + prices/). 미지정 시 public=public/data")
    ap.add_argument("--calendar", default=None, help="거래일 캘린더 fixture(JSON) — 필수(거래일 확정)")
    ap.add_argument("--config", default=None, help="Metrics 2.5.1 config(미지정 시 정본 config/metrics/2.5.1.json)")
    ap.add_argument("--shadow-root", default=None,
                    help=f"비공개 shadow 루트(기본 {os.path.relpath(DEFAULT_SHADOW_ROOT, ROOT)}). 산출물은 그 아래 inputs/ 에만 쓴다")
    ap.add_argument("--write", action="store_true", help="통과 시 inputs/ 에 산출물을 기록(미지정 시 판정만·무기록)")
    ap.add_argument("--json", action="store_true", help="결정적 JSON 판정을 stdout 으로")
    args = ap.parse_args(argv)

    data_dir = args.data_dir or (os.path.join(ROOT, "public", "data") if args.source == "public" else None)
    if not data_dir:
        print("metrics251_market_input: --data-dir 이 필요합니다(fixture 모드).", file=sys.stderr)
        return 2

    try:
        cfg = load_config(args.config)
    except (OSError, ValueError) as e:
        print(f"metrics251_market_input: config 로드 실패 {e!r}", file=sys.stderr)
        return 2

    calendar, calendar_doc = (None, None)
    if args.calendar:
        try:
            calendar, calendar_doc = _load_calendar_doc(args.calendar)
        except (OSError, ValueError, KeyError) as e:
            print(f"metrics251_market_input: 캘린더 로드 실패 {e!r}", file=sys.stderr)
            return 2

    envelope = load_envelope(data_dir)
    shadow_root = args.shadow_root or DEFAULT_SHADOW_ROOT

    if args.write:
        result = assemble_and_write(envelope, calendar, cfg, shadow_root, calendar_doc,
                                    source_mode=args.source)
    else:
        result = assemble(envelope, calendar, cfg, source_mode=args.source)

    if args.json:
        # request 는 대용량이라 판정 출력에서는 제외하고, 핵심 요약만 낸다(결정적).
        print(json.dumps(result.to_dict(include_request=False), ensure_ascii=False,
                         sort_keys=True, indent=2))
    else:
        verdict = "OK ✅" if result.ok else "FAIL ❌"
        print(f"metrics251_market_input: source={result.sourceMode} · marketDate={result.marketDate} · {verdict}")
        if result.reasons:
            print("  사유: " + ", ".join(result.reasons))
        if result.writtenPaths:
            print("  기록: " + ", ".join(os.path.relpath(p, ROOT) for p in result.writtenPaths))
        elif result.ok and not args.write:
            print("  (판정만 — 기록하려면 --write)")
    return 0 if result.ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
