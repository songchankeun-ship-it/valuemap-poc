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
             "저평가 확정", "호재 확정", "악재 확정", "안전한 종목", "서비스)이"]
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
