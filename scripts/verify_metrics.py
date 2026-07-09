#!/usr/bin/env python3
# 데이터 정합성 검사 — 공개 산식(compute_metrics) 결과와 stocks.json 표시값 일치 확인.
# 배포 전 실행 권장. 오류 시 exit 1.
import json, sys, os, re

# 산식 버전 단일 기준값 — src/lib/dataStatus.ts 의 EXPECTED_METRICS_VERSION 과 일치해야 함.
EXPECTED_METRICS_VERSION = "2.4"

path = os.path.join(os.path.dirname(__file__), "..", "public", "data", "stocks.json")
d = json.load(open(path, encoding="utf-8-sig"))
stocks = d["stocks"]
errors = []

# 산식 버전 일치 단언 (설계서 §17.1): stocks.json metricsVersion 이 기준값과 어긋나면 빌드 차단.
data_version = d.get("metricsVersion")
if data_version != EXPECTED_METRICS_VERSION:
    errors.append(
        f"metricsVersion {data_version!r} != 기준 {EXPECTED_METRICS_VERSION!r} "
        f"(stocks.json 재생성 또는 EXPECTED_METRICS_VERSION 갱신 필요)"
    )

for s in stocks:
    m, f, v, vo = s.get("momentum"), s.get("flow"), s.get("value"), s.get("volScore")
    if any(not isinstance(x, (int, float)) for x in (m, f, v, vo)):
        errors.append(f"{s.get('ticker')} 지표 결측")
        continue
    comp = (m + f + v + vo) / 4
    stored = s.get("compositeScore")
    # 저장 compositeScore는 소수1자리 캐시(앱은 원본 재계산값을 표시). 0.6 이내 차이는 반올림 잡음으로 허용,
    # 점 단위로 어긋나면(옛 지표로 계산된 stale 등) 실제 오류로 본다.
    if not isinstance(stored, (int, float)) or abs(stored - comp) > 0.6:
        errors.append(f"{s.get('ticker')} compositeScore {stored} vs 계산 {round(comp, 1)} (차이 {round(abs(stored - comp), 2)})")

# 모멘텀 백분위 범위 (선형 매핑 잔존 = max 100 포화)
ms = [s["momentum"] for s in stocks if isinstance(s.get("momentum"), (int, float))]
if ms and max(ms) > 99.6:
    errors.append(f"momentum max {max(ms)} > 99.6 — 백분위 아님(선형 잔존). compute_metrics 재실행 필요")

# ===== 유니버스 무결성 가드 (task 195) =====
# 중복 티커/종목명·필수 필드 결측은 순위·표시(/universe, /today)를 조용히 오염시키므로 배포 차단.
# 위 errors 목록에 합류시켜 기존 '오류 M건' 요약·단일 sys.exit 게이트가 그대로 커버한다.
from collections import Counter as _Counter
for tk, cnt in _Counter(s.get("ticker") for s in stocks).items():
    if cnt > 1:
        errors.append(f"티커 중복 {tk!r} — {cnt}건 (순위·링크 충돌)")
for nm, cnt in _Counter(s.get("name") for s in stocks).items():
    if cnt > 1:
        errors.append(f"종목명 중복 {nm!r} — {cnt}건")
for s in stocks:
    tk = s.get("ticker")
    if not s.get("name"):
        errors.append(f"{tk} name 결측")
    if not s.get("market"):
        errors.append(f"{tk} market 결측")
    th = s.get("themes")
    if not (isinstance(th, list) and len(th) > 0):
        errors.append(f"{tk} themes 결측(빈 배열/누락)")
    for fld in ("currentPrice", "marketCap"):
        v = s.get(fld)
        if not (isinstance(v, (int, float)) and v > 0):
            errors.append(f"{tk} {fld} 비정상({v})")

# 출시 전 신뢰 가드: seed/마스터 매핑 오류가 다시 들어오면 배포 차단.
by_ticker = {s.get("ticker"): s for s in stocks}
if by_ticker.get("000070", {}).get("name") != "삼양홀딩스":
    errors.append("000070은 삼양홀딩스 보통주여야 함 (종목명·코드 매핑 확인 필요)")
if "145995" in by_ticker:
    errors.append("145995는 삼양사우 우선주 코드로 확인됨 — 삼양홀딩스 보통주처럼 기본 분석 유니버스에 노출 금지")
EXCLUDED_NAME_RE = re.compile(r"(우$|우B$|우선주|스팩|ETF|ETN)")
for s in stocks:
    nm = s.get("name") or ""
    if EXCLUDED_NAME_RE.search(nm):
        errors.append(f"{s.get('ticker')} {nm}: 우선주/스팩/ETF/ETN 의심 종목은 별도 배지·규칙 전까지 제외 필요")

# seed_tickers.txt는 수집 유니버스의 수동 입력 원천이다. stocks.json에 포함된 종목은
# seed의 현재 공식명과 반드시 일치해야 한다. seed 자체의 KRX 공식명 검증은
# scripts/fetch_stock_data.py가 FDR KRX master를 조회해 배포 전 차단한다.
seed_path = os.path.join(os.path.dirname(__file__), "seed_tickers.txt")
seed_names = {}
if os.path.exists(seed_path):
    with open(seed_path, encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 2 and parts[0]:
                seed_names[parts[0]] = parts[1]
    for s in stocks:
        tk = s.get("ticker")
        expected_name = seed_names.get(tk)
        if expected_name and s.get("name") != expected_name:
            errors.append(f"{tk} name {s.get('name')!r} != seed_tickers {expected_name!r}")
else:
    errors.append("scripts/seed_tickers.txt 없음 — 유니버스 이름 기준 검증 불가")

print(f"검사 {len(stocks)}종목 · 오류 {len(errors)}건")
for e in errors[:25]:
    print("  ❌", e)
if not errors:
    print("  ✅ compositeScore·모멘텀 백분위 모두 정합")
# ===== 브랜드/문구 금칙어 게이트 (설계서 14.5) =====
# 배포 대상 src/ 에 아래 문자열이 있으면 빌드 실패 처리.
import glob as _glob
FORBIDDEN = ["밸류맵", "ValueMap", "valuemap.kr", "오른스코어은", "오른스코어 스톡",
             "테마주 분석", "AI 분석 무제한 또는 크레딧", "월말 신호", "당월 첫 거래일",
             "안정적으로 우상향", "큰 출렁임 없이", "매수 기회", "추천 종목",
             "저평가 확정", "호재 확정", "악재 확정", "안전한 종목", "서비스)이",
             # 투자 조언처럼 보이는 표현 (task 33 P0-A). 부정문("…이 아니라")에 안 걸리는
             # 다어절 토큰만 추가 — 단독 "진입"/"매수 추천"은 정당한 부정문/단어에 오탐.
             "급등 예상", "강력 매수", "목표가", "손절가", "단기 급등주", "무료 급등주",
             "매수 후보", "AI 픽", "AI 추천", "오늘 살 종목", "따라 사기", "진입 시점"]
brand_errors = []
metrics_errors = []
# 하드코딩된 산식 버전 표기가 기준값과 어긋나는지 감지(예: "Metrics 2.3", "Metrics v2.3").
# metricsVersionLabel 처럼 dataStatus 에서 파생하는 동적 표기는 리터럴이 없어 잡히지 않음.
RE_METRICS_TOKEN = re.compile(r"Metrics\s+v?(\d+\.\d+)")
src_root = os.path.join(os.path.dirname(__file__), "..", "src")
for fp in _glob.glob(os.path.join(src_root, "**", "*.tsx"), recursive=True) + \
          _glob.glob(os.path.join(src_root, "**", "*.ts"), recursive=True):
    try:
        txt = open(fp, encoding="utf-8").read()
    except (UnicodeDecodeError, OSError):
        continue
    for ver in RE_METRICS_TOKEN.findall(txt):
        if ver != EXPECTED_METRICS_VERSION:
            rel = os.path.relpath(fp, src_root)
            metrics_errors.append(f"{rel}: 하드코딩 'Metrics {ver}' != 기준 'Metrics {EXPECTED_METRICS_VERSION}'")
    for bad in FORBIDDEN:
        # github repo 식별자(valuemap-poc)는 예외 허용
        if bad == "valuemap.kr" and "valuemap.kr" not in txt:
            continue
        if bad in txt:
            if bad == "valuemap" and "valuemap-poc" in txt and txt.count("valuemap") == txt.count("valuemap-poc"):
                continue
            rel = os.path.relpath(fp, src_root)
            brand_errors.append(f"{rel}: 금칙어 '{bad}'")

print(f"브랜드 검사 · 금칙어 {len(brand_errors)}건")
for e in brand_errors[:25]:
    print("  ❌", e)
if not brand_errors:
    print("  ✅ 금칙 브랜드/문구 노출 없음")

print(f"산식 버전 검사 · 하드코딩 불일치 {len(metrics_errors)}건 (기준 Metrics {EXPECTED_METRICS_VERSION})")
for e in metrics_errors[:25]:
    print("  ❌", e)
if not metrics_errors:
    print(f"  ✅ 산식 버전 표기 일치 (Metrics {EXPECTED_METRICS_VERSION})")

all_ok = (not errors) and (not brand_errors) and (not metrics_errors)
sys.exit(0 if all_ok else 1)
