#!/usr/bin/env python3
# Metrics 2.5.1 dated-run preflight 계약 (Slice M) — 순수·결정적·표준 라이브러리 전용.
#
# 목적(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D02 5일 AND 게이트의
#      "실제 거래일 shadow run" 전제, §M251-D07 원자적 승격, §M251-D10 비공개 자산, §8 데이터 계약,
#      §9 실패/롤백, 원안 티켓 ORN-2503/2508):
#   * **하나의 명시적으로 날짜가 박힌 시장일 shadow run** 이 계산·게시되기 전에 통과해야 하는
#     preflight 게이트를 정의한다. 이 층은 아무것도 계산하지 않는다(엔진이 소유). 입력을 검증만 한다.
#   * 검증 항목(작업 지시):
#       1) 공급된 시장일(marketDate) — 형식·거래일·캘린더 커버·pin 일치.
#       2) 소스 기준일 일치 — prices/volumes/fundamentals 가 pin(expected)과 일치하고 미래가 아니며
#          stale(pin 보다 과거) 이 아님.
#       3) 입력/config/엔진 해시 — configHash·inputManifestHash·engineVersion 이 pin 과 바이트 일치.
#       4) 필수 입력 존재 — config·유니버스(stocks)·각 종목의 필수 시계열(prices/volumes).
#       5) 비공개 shadow 레이아웃 — 저장소 루트·출력 위치가 비공개(Git 비추적)이고 루트 하위(runs/)다.
#       6) public/data 배제 — 루트/출력이 공개 경로(public/) 밑으로 resolve 되면 즉시 실패.
#   * **fail closed**: 어떤 검사도 확정할 수 없거나 예외가 나면 통과시키지 않고 사유 코드를 남긴다.
#   * 안정적 기계판독 사유 코드를 정렬해 반환한다(결정적).
#
# 반드시 지키는 규칙(설계서 §4 변경 불가 원칙 · §M251-D10 · 작업 지시):
#   * 벽시계 시각 금지(datetime.now()/time.time()/date.today() 등)·난수 금지 — 출력은 입력에서만 파생.
#   * public/ 데이터를 읽거나 쓰지 않는다. 파일을 만들지 않는다(preflight 는 순수 판정만).
#   * 결측을 50/factor 평균으로 채우지 않는다 — preflight 는 존재/일치만 확인하고 계산은 하지 않는다.
#   * 이 층은 fixture·저장소 입력만 읽는다. 공개 산식·Metrics 2.4 런타임을 건드리지 않는다.
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, field
from typing import Optional

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import metrics251_engine as eng            # noqa: E402  (ENGINE_VERSION·EngineRequest·inputManifestHash)
import metrics251_snapshot_store as store   # noqa: E402  (레이아웃·assert_private_root·verify_run_dir)
from metrics251_config import config_hash   # noqa: E402  (canonical configHash 재사용)

ENGINE_VERSION = eng.ENGINE_VERSION

# marketDate/소스일은 YYYY-MM-DD 문자열이어야 한다(문자열 비교로 순서 판정 — 로케일/시간대 무관).
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

# 소스 기준일 중 필수(없으면 run 성립 불가). fundamentals 는 null 허용(밸류만 보류, §M251-D03).
REQUIRED_SOURCE_KEYS = ("prices", "volumes")
OPTIONAL_SOURCE_KEYS = ("fundamentals",)

# pin(expected) 계약에 반드시 있어야 하는 키.
_EXPECTED_REQUIRED = ("engineVersion", "configHash", "inputManifestHash", "marketDate", "sourceDates")

# ---------------------------------------------------------------------------
# 안정적 기계판독 사유 코드(정렬해 반환). 접두어 없이 도메인 그룹으로 묶는다.
# ---------------------------------------------------------------------------
# 1) 시장일.
MARKET_DATE_MISSING = "MARKET_DATE_MISSING"
MARKET_DATE_MALFORMED = "MARKET_DATE_MALFORMED"
MARKET_DATE_EXPECTATION_MISMATCH = "MARKET_DATE_EXPECTATION_MISMATCH"
CALENDAR_UNCOVERED = "CALENDAR_UNCOVERED"
MARKET_DATE_NOT_TRADING_DAY = "MARKET_DATE_NOT_TRADING_DAY"
DUPLICATE_MARKET_DATE = "DUPLICATE_MARKET_DATE"

# 2) 소스 기준일.
SOURCE_DATE_MISSING = "SOURCE_DATE_MISSING"
SOURCE_DATE_MALFORMED = "SOURCE_DATE_MALFORMED"
SOURCE_DATE_FUTURE = "SOURCE_DATE_FUTURE"
SOURCE_DATE_STALE = "SOURCE_DATE_STALE"
SOURCE_DATE_MISMATCH = "SOURCE_DATE_MISMATCH"

# 3) 해시 / 엔진 버전.
ENGINE_VERSION_MISMATCH = "ENGINE_VERSION_MISMATCH"
CONFIG_HASH_MISMATCH = "CONFIG_HASH_MISMATCH"
INPUT_HASH_MISMATCH = "INPUT_HASH_MISMATCH"

# 4) 필수 입력 존재.
EXPECTATION_INCOMPLETE = "EXPECTATION_INCOMPLETE"
CONFIG_MISSING = "CONFIG_MISSING"
UNIVERSE_EMPTY = "UNIVERSE_EMPTY"
INPUT_MISSING = "INPUT_MISSING"
DUPLICATE_TICKER = "DUPLICATE_TICKER"

# 5) 비공개 레이아웃 / public 배제.
SHADOW_ROOT_MISSING = "SHADOW_ROOT_MISSING"
SHADOW_ROOT_NOT_PRIVATE = "SHADOW_ROOT_NOT_PRIVATE"
OUTPUT_LOCATION_MISSING = "OUTPUT_LOCATION_MISSING"
OUTPUT_NOT_PRIVATE = "OUTPUT_NOT_PRIVATE"
OUTPUT_ESCAPES_SHADOW_ROOT = "OUTPUT_ESCAPES_SHADOW_ROOT"

# 6) 방어적 catch-all — 예상 못한 예외도 fail closed 로 흡수한다.
INTERNAL_ERROR = "INTERNAL_ERROR"

ALL_REASONS = frozenset({
    MARKET_DATE_MISSING, MARKET_DATE_MALFORMED, MARKET_DATE_EXPECTATION_MISMATCH,
    CALENDAR_UNCOVERED, MARKET_DATE_NOT_TRADING_DAY, DUPLICATE_MARKET_DATE,
    SOURCE_DATE_MISSING, SOURCE_DATE_MALFORMED, SOURCE_DATE_FUTURE, SOURCE_DATE_STALE,
    SOURCE_DATE_MISMATCH, ENGINE_VERSION_MISMATCH, CONFIG_HASH_MISMATCH, INPUT_HASH_MISMATCH,
    EXPECTATION_INCOMPLETE, CONFIG_MISSING, UNIVERSE_EMPTY, INPUT_MISSING, DUPLICATE_TICKER,
    SHADOW_ROOT_MISSING, SHADOW_ROOT_NOT_PRIVATE, OUTPUT_LOCATION_MISSING, OUTPUT_NOT_PRIVATE,
    OUTPUT_ESCAPES_SHADOW_ROOT, INTERNAL_ERROR,
})


# ---------------------------------------------------------------------------
# 결과 타입(typed).
# ---------------------------------------------------------------------------
@dataclass
class PreflightResult:
    ok: bool
    reasons: list = field(default_factory=list)   # 정렬된 안정 사유 코드(통과 시 빈 리스트)
    marketDate: Optional[str] = None
    checks: dict = field(default_factory=dict)     # 그룹별 통과/사유 요약(진단·결정적)
    detail: list = field(default_factory=list)     # 사람용 세부(해시 diff·오프너 티커 등)

    def to_dict(self):
        return {
            "ok": self.ok,
            "reasons": self.reasons,
            "marketDate": self.marketDate,
            "checks": self.checks,
            "detail": self.detail,
        }


@dataclass
class PreflightRequest:
    """하나의 명시적으로 날짜가 박힌 시장일 shadow run 의 preflight 입력.

    expected 는 이 run 의 계약을 고정하는 pin 이다: 어떤 marketDate·소스일·configHash·
    inputManifestHash·engineVersion 이어야 하는지 미리 선언한다. preflight 는 조립된 실제 입력이
    이 pin 을 바이트 단위로 재현하는지, 그리고 그 값들이 내부적으로 안전한지(유효 거래일·미래 아님·
    비공개 레이아웃)를 검증한다.
    """
    marketDate: Optional[str]
    expected: dict
    config: Optional[dict]
    sourceDates: dict
    stocks: list
    shadowRoot: Optional[str]
    outputLocation: Optional[str]

    @staticmethod
    def from_dict(d):
        return PreflightRequest(
            marketDate=d.get("marketDate"),
            expected=dict(d.get("expected") or {}),
            config=d.get("config"),
            sourceDates=dict(d.get("sourceDates") or {}),
            stocks=list(d.get("stocks") or []),
            shadowRoot=d.get("shadowRoot"),
            outputLocation=d.get("outputLocation"),
        )


# ---------------------------------------------------------------------------
# 비공개/공개 경로 판정 — store.assert_private_root 와 같은 규칙(예외 대신 bool, fail closed).
# ---------------------------------------------------------------------------
def _under_public(path):
    """path 가 public/ 밑으로 resolve 되면 True(공개 경로 누출 — 공개 데이터 디렉터리 포함)."""
    if not path:
        return False
    p_abs = os.path.abspath(path)
    public_abs = os.path.abspath(os.path.join(ROOT, "public"))
    try:
        common = os.path.commonpath([p_abs, public_abs])
    except ValueError:
        return False  # 다른 드라이브 등 — public 밑일 수 없음
    return common == public_abs


def _is_within(child, parent):
    """child 가 parent 와 같거나 그 하위면 True."""
    if not child or not parent:
        return False
    c_abs = os.path.abspath(child)
    p_abs = os.path.abspath(parent)
    try:
        return os.path.commonpath([c_abs, p_abs]) == p_abs
    except ValueError:
        return False


# ---------------------------------------------------------------------------
# 개별 검사 — 각 함수는 사유 코드 리스트(비면 통과)를 반환한다. 순수·부작용 없음.
# ---------------------------------------------------------------------------
def _valid_date(value):
    return isinstance(value, str) and bool(_DATE_RE.match(value))


def check_expectation_shape(expected):
    """pin(expected) 계약 자체가 필수 키를 갖췄는지. 없으면 이후 비교가 무의미하므로 fail closed."""
    if not isinstance(expected, dict):
        return [EXPECTATION_INCOMPLETE]
    missing = [k for k in _EXPECTED_REQUIRED if k not in expected]
    return [EXPECTATION_INCOMPLETE] if missing else []


def check_market_date(market_date, expected, calendar, promoted_market_dates):
    """시장일: 형식·pin 일치·캘린더 커버·거래일·중복(이미 승격된 날짜)."""
    reasons = []
    if not market_date:
        return [MARKET_DATE_MISSING]
    if not _valid_date(market_date):
        return [MARKET_DATE_MALFORMED]

    exp_md = (expected or {}).get("marketDate")
    if exp_md is not None and market_date != exp_md:
        reasons.append(MARKET_DATE_EXPECTATION_MISMATCH)

    # 거래일 여부 — 캘린더가 커버하지 못하면 확정 불가(합성하지 않고 fail closed).
    if calendar is None or not calendar.covers(market_date):
        reasons.append(CALENDAR_UNCOVERED)
    elif not calendar.is_trading_day(market_date):
        reasons.append(MARKET_DATE_NOT_TRADING_DAY)

    # 같은 시장일이 이미 비공개 저장소에 승격되어 있으면 재계산 금지(불변성·중복 방지).
    if market_date in set(promoted_market_dates or ()):
        reasons.append(DUPLICATE_MARKET_DATE)
    return reasons


def _classify_source_date(actual, expected_val, market_date):
    """단일 소스일을 분류한다. 사유 코드(또는 None=통과)."""
    if actual is None or (isinstance(actual, str) and not actual.strip()):
        return SOURCE_DATE_MISSING
    if not _valid_date(actual):
        return SOURCE_DATE_MALFORMED
    if market_date and actual > market_date:
        return SOURCE_DATE_FUTURE  # 미래 데이터는 불가능(설계서 §compute_snapshot 미래 소스일 = mismatch)
    if expected_val is not None and actual != expected_val:
        # pin 보다 과거면 stale(오래된 추출), 그 외(더 최신이지만 미래는 아님)는 일반 mismatch.
        return SOURCE_DATE_STALE if actual < expected_val else SOURCE_DATE_MISMATCH
    return None


def check_source_dates(source_dates, expected, market_date):
    """필수 소스일(prices/volumes)은 존재+일치, 선택 소스일(fundamentals)은 있으면 일치·미래 금지."""
    reasons = []
    detail = []
    sd = source_dates or {}
    exp_sd = (expected or {}).get("sourceDates") or {}

    for key in REQUIRED_SOURCE_KEYS:
        code = _classify_source_date(sd.get(key), exp_sd.get(key), market_date)
        if code is not None:
            reasons.append(code)
            detail.append(f"sourceDates.{key}={sd.get(key)!r} expected={exp_sd.get(key)!r} -> {code}")

    for key in OPTIONAL_SOURCE_KEYS:
        actual = sd.get(key)
        exp_val = exp_sd.get(key)
        # 둘 다 없으면 통과(밸류 보류는 엔진이 처리). 하나라도 있으면 분류한다.
        if actual is None and exp_val is None:
            continue
        code = _classify_source_date(actual, exp_val, market_date) if actual is not None else SOURCE_DATE_MISMATCH
        if code is not None:
            reasons.append(code)
            detail.append(f"sourceDates.{key}={actual!r} expected={exp_val!r} -> {code}")
    return reasons, detail


def check_required_inputs(config, stocks):
    """필수 입력 존재: config·유니버스·각 종목의 ticker+필수 시계열(prices/volumes)."""
    reasons = []
    detail = []
    if not isinstance(config, dict) or not config:
        reasons.append(CONFIG_MISSING)
    if not stocks:
        reasons.append(UNIVERSE_EMPTY)
        return reasons, detail  # 유니버스가 없으면 종목 단위 검사는 무의미.

    seen = set()
    dup = set()
    for i, s in enumerate(stocks):
        if not isinstance(s, dict):
            reasons.append(INPUT_MISSING)
            detail.append(f"stocks[{i}] 가 object 아님")
            continue
        ticker = s.get("ticker")
        if not ticker or not str(ticker).strip():
            reasons.append(INPUT_MISSING)
            detail.append(f"stocks[{i}] ticker 누락")
        else:
            if ticker in seen:
                dup.add(ticker)
            seen.add(ticker)
        # 필수 시계열: 없거나(None) 빈 리스트면 결측 입력.
        for key in ("prices", "volumes"):
            series = s.get(key)
            if not isinstance(series, list) or len(series) == 0:
                reasons.append(INPUT_MISSING)
                detail.append(f"stocks[{i}]({ticker}) {key} 시계열 결측")
    if dup:
        reasons.append(DUPLICATE_TICKER)
        detail.append(f"중복 ticker: {sorted(dup)}")
    return reasons, detail


def check_hashes(config, market_date, source_dates, stocks, expected):
    """엔진 버전·configHash·inputManifestHash 가 pin 과 바이트 일치하는지."""
    reasons = []
    detail = []
    exp = expected or {}

    # 엔진 버전 — config 의 engineVersion 은 이 엔진 버전이어야 하고 pin 과도 일치해야 한다.
    cfg_ev = config.get("engineVersion") if isinstance(config, dict) else None
    if cfg_ev != ENGINE_VERSION or (exp.get("engineVersion") not in (None, ENGINE_VERSION)):
        reasons.append(ENGINE_VERSION_MISMATCH)
        detail.append(f"engineVersion config={cfg_ev!r} expected={exp.get('engineVersion')!r} "
                      f"engine={ENGINE_VERSION!r}")

    # configHash — canonical 바이트 해시 vs pin.
    if isinstance(config, dict) and config:
        actual_cfg_hash = config_hash(config)
        if exp.get("configHash") is not None and actual_cfg_hash != exp.get("configHash"):
            reasons.append(CONFIG_HASH_MISMATCH)
            detail.append(f"configHash actual={actual_cfg_hash} expected={exp.get('configHash')}")

    # inputManifestHash — 엔진과 동일한 규칙으로 입력을 canonical 해시(계산 아님, 입력 고정만).
    try:
        req = eng.EngineRequest.from_dict({
            "config": config, "marketDate": market_date,
            "sourceDates": source_dates, "stocks": stocks})
        actual_input_hash = eng._input_manifest_hash(req, req.stocks)
    except Exception:  # noqa: BLE001  (입력이 파싱 불가면 해시 비교 생략 — 이미 다른 검사가 실패로 잡음)
        actual_input_hash = None
    if actual_input_hash is not None and exp.get("inputManifestHash") is not None \
            and actual_input_hash != exp.get("inputManifestHash"):
        reasons.append(INPUT_HASH_MISMATCH)
        detail.append(f"inputManifestHash actual={actual_input_hash} expected={exp.get('inputManifestHash')}")
    return reasons, detail


def check_shadow_layout(shadow_root, output_location):
    """비공개 레이아웃: 루트·출력이 public/ 밖이고, 출력이 루트의 runs/ 하위여야 한다."""
    reasons = []
    detail = []
    if not shadow_root:
        reasons.append(SHADOW_ROOT_MISSING)
    elif _under_public(shadow_root):
        reasons.append(SHADOW_ROOT_NOT_PRIVATE)
        detail.append(f"shadowRoot 가 public/ 밑: {shadow_root}")

    if not output_location:
        reasons.append(OUTPUT_LOCATION_MISSING)
        return reasons, detail

    if _under_public(output_location):
        reasons.append(OUTPUT_NOT_PRIVATE)
        detail.append(f"outputLocation 이 public/ 밑: {output_location}")

    # 출력은 저장소 루트의 runs/ 아래여야 한다(레이아웃 이탈 금지).
    if shadow_root and not _under_public(shadow_root):
        runs_dir = os.path.join(shadow_root, store.RUNS_SUBDIR)
        if not _is_within(output_location, runs_dir):
            reasons.append(OUTPUT_ESCAPES_SHADOW_ROOT)
            detail.append(f"outputLocation 이 {store.RUNS_SUBDIR}/ 하위 아님: {output_location}")
    return reasons, detail


# ---------------------------------------------------------------------------
# 순수 preflight 계약 — 모든 검사를 합쳐 결정적 PreflightResult 를 만든다. fail closed.
# ---------------------------------------------------------------------------
def preflight_market_day(preq, calendar=None, promoted_market_dates=()):
    """하나의 날짜 박힌 시장일 shadow run 이 계산·게시 전에 통과해야 하는 preflight 계약(순수)."""
    if isinstance(preq, dict):
        preq = PreflightRequest.from_dict(preq)
    reasons = []
    detail = []
    checks = {}

    try:
        exp_shape = check_expectation_shape(preq.expected)
        checks["expectation"] = _summ(exp_shape)
        reasons += exp_shape

        md = check_market_date(preq.marketDate, preq.expected, calendar, promoted_market_dates)
        checks["marketDate"] = _summ(md)
        reasons += md

        sd_reasons, sd_detail = check_source_dates(preq.sourceDates, preq.expected, preq.marketDate)
        checks["sourceDates"] = _summ(sd_reasons)
        reasons += sd_reasons
        detail += sd_detail

        ri_reasons, ri_detail = check_required_inputs(preq.config, preq.stocks)
        checks["requiredInputs"] = _summ(ri_reasons)
        reasons += ri_reasons
        detail += ri_detail

        h_reasons, h_detail = check_hashes(
            preq.config, preq.marketDate, preq.sourceDates, preq.stocks, preq.expected)
        checks["hashes"] = _summ(h_reasons)
        reasons += h_reasons
        detail += h_detail

        lay_reasons, lay_detail = check_shadow_layout(preq.shadowRoot, preq.outputLocation)
        checks["shadowLayout"] = _summ(lay_reasons)
        reasons += lay_reasons
        detail += lay_detail
    except Exception as e:  # noqa: BLE001  (fail closed — 예상 못한 예외도 통과시키지 않는다)
        reasons.append(INTERNAL_ERROR)
        detail.append(repr(e))

    reasons = sorted(set(reasons))
    return PreflightResult(
        ok=not reasons, reasons=reasons, marketDate=preq.marketDate,
        checks=checks, detail=detail)


def _summ(reasons):
    return {"ok": not reasons, "reasons": sorted(set(reasons))}


# ---------------------------------------------------------------------------
# 저장소에서 이미 승격된 시장일 집합을 읽는다(읽기 전용) — 중복 방지용.
# ---------------------------------------------------------------------------
def promoted_market_dates(root):
    """비공개 shadow 저장소에서 승격된 run 들의 marketDate 집합(정렬 리스트). 없으면 []."""
    root = store.assert_private_root(root)  # public/ 밑이면 즉시 실패(§M251-D10)
    runs_dir = os.path.join(root, store.RUNS_SUBDIR)
    if not os.path.isdir(runs_dir):
        return []
    dates = set()
    for sub in sorted(os.listdir(runs_dir)):
        run_dir = os.path.join(runs_dir, sub)
        if not os.path.isdir(run_dir):
            continue
        verified = store.verify_run_dir(run_dir)
        manifest = verified.manifest or {}
        md = manifest.get("marketDate")
        if not md and "__" in sub:
            md = sub.split("__", 1)[0]  # snapshotId = "<marketDate>__<runId>"
        if md:
            dates.add(str(md))
    return sorted(dates)


# ---------------------------------------------------------------------------
# CLI — fixture(또는 저장소) preflight 요청을 읽어 결정적 판정을 출력한다(파일 미기록·읽기 전용).
# ---------------------------------------------------------------------------
def _load_calendar(path):
    if not path:
        return None
    from metrics251_compare import FixtureTradingCalendar
    with open(path, encoding="utf-8") as f:
        return FixtureTradingCalendar.from_fixture(json.load(f))


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Metrics 2.5.1 dated-run preflight 계약 (Slice M, pure/deterministic, read-only).")
    ap.add_argument("--request", help="preflight 요청 JSON(전체: expected/config/sourceDates/stocks/레이아웃)")
    ap.add_argument("--calendar", default=None, help="거래일 캘린더 fixture(JSON)")
    ap.add_argument("--root", default=None,
                    help="비공개 shadow 저장소 루트 — 지정 시 중복 시장일을 읽어 반영")
    ap.add_argument("--json", action="store_true", help="결정적 JSON 판정을 stdout 으로")
    args = ap.parse_args(argv)

    if not args.request:
        print("metrics251_preflight: dated-run preflight 계약 (Slice M). "
              "import 후 preflight_market_day(request, calendar, promoted_market_dates) 사용.")
        print(f"  engineVersion={ENGINE_VERSION} · 사유 코드 {len(ALL_REASONS)}종 · fail closed")
        print(f"  기본 저장소 루트(비공개·Git 비추적)={os.path.relpath(store.DEFAULT_SHADOW_ROOT, ROOT)}")
        return 0

    with open(args.request, encoding="utf-8") as f:
        req = json.load(f)
    calendar = _load_calendar(args.calendar)
    promoted = promoted_market_dates(args.root) if args.root else req.get("promotedMarketDates", [])
    result = preflight_market_day(req, calendar, promoted)

    if args.json:
        print(json.dumps(result.to_dict(), ensure_ascii=False, sort_keys=True, indent=2))
    else:
        verdict = "PASS ✅" if result.ok else "FAIL ❌"
        print(f"metrics251_preflight: marketDate={result.marketDate} · {verdict}")
        if result.reasons:
            print("  사유: " + ", ".join(result.reasons))
    return 0 if result.ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
