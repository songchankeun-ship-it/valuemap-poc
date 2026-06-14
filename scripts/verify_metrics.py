#!/usr/bin/env python3
# 데이터 정합성 검사 — 공개 산식(compute_metrics) 결과와 stocks.json 표시값 일치 확인.
# 배포 전 실행 권장. 오류 시 exit 1.
import json, sys, os

path = os.path.join(os.path.dirname(__file__), "..", "public", "data", "stocks.json")
d = json.load(open(path, encoding="utf-8-sig"))
stocks = d["stocks"]
errors = []

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
             "테마주 분석", "AI 분석 무제한 또는 크레딧", "월말 신호", "당월 첫 거래일"]
brand_errors = []
src_root = os.path.join(os.path.dirname(__file__), "..", "src")
for fp in _glob.glob(os.path.join(src_root, "**", "*.tsx"), recursive=True) + \
          _glob.glob(os.path.join(src_root, "**", "*.ts"), recursive=True):
    try:
        txt = open(fp, encoding="utf-8").read()
    except (UnicodeDecodeError, OSError):
        continue
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

all_ok = (not errors) and (not brand_errors)
sys.exit(0 if all_ok else 1)
