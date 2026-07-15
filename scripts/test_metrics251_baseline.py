#!/usr/bin/env python3
# Metrics 2.5.1 기준선 분석기(metrics251_baseline.py) 계약·결정성·stale 게이트 — Slice A.
#
# 강제하는 계약:
#   1. 결정성: 같은 스냅샷이면 JSON/Markdown 출력이 바이트 단위로 동일하다(벽시계 시각 미사용).
#   2. stale 방지: 커밋된 docs/metrics-2.5.1-baseline.{json,md} 가 최신 재생성본과 일치한다.
#   3. 읽기 전용/무-계산: 새 2.5 점수를 계산·게시하지 않고, 결측을 50/factor 평균으로 채우지 않는다.
#   4. 측정 baseline 회귀 가드: 후속 slice 가 사용할 핵심 수치를 고정한다
#      (현재 스냅샷: PER>0 137·PBR>0 137·밸류제외 1·순위후보 137·극단값 24/8/2/5).
#   5. 소스 계약: 현재 파이프라인의 fallback·중복 계산 경로가 모두 발견된다(누락 0).
#   6. 극단값은 경고로만 취급(양수를 invalid 로 분류하지 않는다).
#   7. 확립 불가 필드는 unavailable + 사유로 보고한다(임의 대체 금지).
#
# Usage: $env:PYTHONUTF8='1'; python scripts/test_metrics251_baseline.py   (실패 시 exit 1)
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import metrics251_baseline as mb  # noqa: E402

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


meta, stocks = mb.load_snapshot()
check(len(stocks) > 0, "분석할 종목이 없음(스냅샷 로드 실패)")
report = mb.build_report(meta, stocks)

# 1) 결정성 — build_report 를 두 번 돌려 직렬화 비교.
report2 = mb.build_report(*mb.load_snapshot())
s1 = json.dumps(report, ensure_ascii=False, sort_keys=True)
s2 = json.dumps(report2, ensure_ascii=False, sort_keys=True)
check(s1 == s2, "비결정적: 동일 스냅샷에서 build_report JSON 출력이 달라짐")
md1 = mb.render_markdown(report)
md2 = mb.render_markdown(report2)
check(md1 == md2, "비결정적: 동일 스냅샷에서 Markdown 출력이 달라짐")

# 1b) 벽시계 시각 미사용 — 소스에 datetime.now()/time.time() 이 없어야 한다.
src = open(os.path.join(HERE, "metrics251_baseline.py"), encoding="utf-8").read()
for banned in ("datetime.now(", "time.time(", "date.today(", "utcnow("):
    check(banned not in src, f"결정성 위반: 소스에 벽시계 호출 {banned!r} 존재")

# 2) stale 방지 — 커밋된 산출물이 최신 재생성본과 일치.
js_now = json.dumps(report, ensure_ascii=False, sort_keys=True, indent=2) + "\n"
if os.path.exists(mb.DEFAULT_JSON_OUT):
    on_disk = open(mb.DEFAULT_JSON_OUT, encoding="utf-8").read().replace("\r\n", "\n")
    check(on_disk == js_now,
          "docs/metrics-2.5.1-baseline.json 이 stale — `python scripts/metrics251_baseline.py` 재실행 필요")
else:
    check(False, "docs/metrics-2.5.1-baseline.json 이 없음 — 분석기 실행 필요")
if os.path.exists(mb.DEFAULT_MD_OUT):
    on_disk_md = open(mb.DEFAULT_MD_OUT, encoding="utf-8").read().replace("\r\n", "\n")
    check(on_disk_md == md1,
          "docs/metrics-2.5.1-baseline.md 가 stale — `python scripts/metrics251_baseline.py` 재실행 필요")
else:
    check(False, "docs/metrics-2.5.1-baseline.md 가 없음 — 분석기 실행 필요")

# 3) 읽기 전용/무-계산 계약.
mm = report["meta"]
check(mm.get("readOnly") is True, "meta.readOnly 가 True 가 아님")
check(mm.get("computesNewScore") is False, "meta.computesNewScore 가 False 가 아님")
check(mm.get("metricsVersion") == "2.4", f"공개 지표 버전이 2.4 가 아님: {mm.get('metricsVersion')!r}")
# 리포트는 새 2.5 점수를 계산·방출하지 않는다(기존 파이프라인 경로 '설명'은 허용).
for banned_key in ("newCompositeScore", "score251", "shadowScore", "recomputedComposite", "score2_5_1"):
    check(banned_key not in s1, f"리포트가 새 점수 키 {banned_key!r} 를 방출함 — 2.5 점수 계산 금지")
# 입력 SHA-256 이 실제 파일 바이트와 일치(입력 미수정 증거).
import hashlib  # noqa: E402
disk_sha = hashlib.sha256(open(mb.STOCKS_PATH, "rb").read()).hexdigest()
check(mm.get("inputSha256") == disk_sha, "inputSha256 가 실제 stocks.json 바이트와 불일치")

# 4) 측정 baseline 회귀 가드 — 후속 slice numeric gate 의 실제 기준선.
f = report["fundamentals"]
check(mm.get("universeCount") == 138, f"유니버스 138 아님: {mm.get('universeCount')}")
check(f["per"]["positive"] == 137, f"PER>0 137 아님: {f['per']['positive']}")
check(f["pbr"]["positive"] == 137, f"PBR>0 137 아님: {f['pbr']['positive']}")
check(f["bothPositive"] == 137, f"PER·PBR 모두 양수 137 아님: {f['bothPositive']}")
check(f["valueExcludedByPositivityRule"] == 1, f"밸류 제외 1 아님: {f['valueExcludedByPositivityRule']}")
check(f["per"]["missingTickers"] == ["088980"], f"PER 결측 티커 예상과 다름: {f['per']['missingTickers']}")
ev = report["extremeValues"]
check(ev["perGt100"]["count"] == 24, f"PER>100 24 아님: {ev['perGt100']['count']}")
check(ev["perGt500"]["count"] == 8, f"PER>500 8 아님: {ev['perGt500']['count']}")
check(ev["pbrGt20"]["count"] == 2, f"PBR>20 2 아님: {ev['pbrGt20']['count']}")
check(ev["absRoeGt100"]["count"] == 5, f"|ROE|>100 5 아님: {ev['absRoeGt100']['count']}")
r = report["rankingEligibility"]
check(r["candidateCount"] == 137, f"순위 후보 137 아님: {r['candidateCount']}")
check(r["excludedCount"] == 1, f"순위 제외 1 아님: {r['excludedCount']}")
check(r["bindingFactor"] == "value", f"binding factor 가 value 아님: {r['bindingFactor']}")
check(r["exclusionReasonCounts"].get("VALUE_MISSING_INPUT") == 1,
      f"제외 사유 VALUE_MISSING_INPUT=1 아님: {r['exclusionReasonCounts']}")
# valueNA fallback 노출.
vf = report["valueFallbackExposure"]
check(vf["valueNaCount"] == 1, f"valueNA 1 아님: {vf['valueNaCount']}")
check(vf["valueNaTickers"] == ["088980"], f"valueNA 티커 예상과 다름: {vf['valueNaTickers']}")

# 5) 소스 계약 — 현재 fallback·중복 계산 경로가 모두 발견(누락 0).
sc = report["sourceContractPaths"]
check(sc["missing"] == 0,
      f"소스 계약 검사 누락 {sc['missing']}건 — compute_metrics/metrics.ts/realStocks 변경으로 리터럴 이동 가능")
check(sc["duplicateCalculationPaths"] >= 5,
      f"TS 중복 계산 경로 {sc['duplicateCalculationPaths']} < 5 — 예상보다 적음")
check(sc["fallbackPaths"] >= 12,
      f"fallback 경로 {sc['fallbackPaths']} < 12 — 예상보다 적음")
# 설계서가 §4 에서 금지한 '밸류→factor 평균' 경로가 반드시 잡혀야 한다.
found_ids = {c["id"] for c in sc["checks"] if c["found"]}
check("py-value-factor-average" in found_ids,
      "밸류→factor 평균 fallback(py-value-factor-average) 이 감지되지 않음")
for c in sc["checks"]:
    if c["found"]:
        check(isinstance(c["line"], int) and c["line"] > 0, f"{c['id']} found 인데 줄 번호 없음")

# 6) 극단값은 경고로만 — 양수-이지만-높은 재무를 invalid/제외로 분류하지 않는다.
# 순위 제외는 오직 결측(MISSING_INPUT)/비양수 때문이어야 하고, QUALITY_WARNING 로 인한 제외는 없다.
for tk, reasons in r["exclusionReasons"].items():
    for reason in reasons:
        check("QUALITY" not in reason and "EXTREME" not in reason,
              f"{tk} 가 극단값(경고)으로 제외됨 — 양수를 invalid 로 분류하면 안 됨: {reason}")
# PER>500 최상위 종목(예: 293490)은 여전히 밸류 유효(제외 아님)여야 한다.
check("293490" not in set(r["excludedTickers"]),
      "극단 PER 종목 293490 이 순위에서 제외됨 — 양수 고평가를 조용히 invalid 로 처리하면 안 됨")

# 7) 확립 불가 필드 — unavailable + 사유.
uf = report["unavailableFields"]
check("sectorExclusionDistribution" in uf, "sectorExclusionDistribution unavailable 표기 누락")
check("pointInTimeHistory" in uf, "pointInTimeHistory unavailable 표기 누락")
for k, v in uf.items():
    check(v.get("available") is False, f"unavailableFields.{k}.available 이 False 아님")
    check(bool(v.get("reason")), f"unavailableFields.{k}.reason 이 비어 있음")

# 7b) 시장별 분포는 data permits — 존재하고, 업종은 unavailable.
md = report["marketExclusionDistribution"]
check(sum(md["totalsByMarket"].values()) == 138, "시장별 전체 합이 138 아님")
check("sector" not in json.dumps(md), "시장 분포에 sector 가 섞임(업종은 unavailable 이어야 함)")

if failures:
    print(f"[FAIL] metrics251_baseline 계약 검증 {len(failures)}건 실패:")
    for x in failures:
        print(f"  - {x}")
    sys.exit(1)

print(f"[PASS] metrics251_baseline 계약 검증 통과 "
      f"({mm['universeCount']}종목 · 스냅샷 {mm['snapshotAsOf']} · "
      f"PER>0 {f['per']['positive']}·밸류제외 {f['valueExcludedByPositivityRule']}·"
      f"순위후보 {r['candidateCount']}({r['coveragePct']}%)·"
      f"소스계약 fallback {sc['fallbackPaths']}/중복 {sc['duplicateCalculationPaths']} · "
      f"결정성+stale 통과).")
