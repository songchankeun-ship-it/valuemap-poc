#!/usr/bin/env python3
# 방법론 감사(methodology_audit.py) 계약 검증 게이트 — Slice M.
#
# 강제하는 계약:
#   1. 결정성: 같은 스냅샷이면 JSON 출력이 바이트 단위로 동일하다.
#   2. 단면 라벨: 상관·기여·ablation 이 cross-sectional 로 라벨링된다(성과/시계열이라 주장 금지).
#   3. 산출 불가 증거: forward-return·거래비용·회전율·신뢰구간·업종중립·아웃오브샘플이
#      모두 available=False + substitutedWithCurrentData=False 로 보고된다(fail-closed, 현재값 대체 금지).
#   4. 상관행렬 무결성: 대칭 + 대각선 1.0 + [-1,1] 범위.
#   5. ablation 은 지표를 정확히 하나만 제거한다(가중치 0 하나·나머지 1).
#   6. Markdown 리포트가 결정적으로 재생성되고 "검증 아님" 고지를 포함한다.
#
# Usage: $env:PYTHONUTF8='1'; python scripts/test_methodology_audit.py   (실패 시 exit 1)
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import methodology_audit as ma  # noqa: E402

METRICS = ma.METRICS
REQUIRED_UNAVAILABLE = {
    "forwardReturn", "transactionCost", "turnover",
    "confidenceInterval", "sectorNeutral", "outOfSample",
}

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


meta, rows = ma.load_snapshot()
check(len(rows) > 0, "분석할 종목이 없음(스냅샷 로드 실패)")
report = ma.build_report(meta, rows)

# 1) 결정성 — build_report 를 두 번 돌려 직렬화 비교.
report2 = ma.build_report(*ma.load_snapshot())
s1 = json.dumps(report, ensure_ascii=False, sort_keys=True)
s2 = json.dumps(report2, ensure_ascii=False, sort_keys=True)
check(s1 == s2, "비결정적: 동일 스냅샷에서 build_report 출력이 달라짐")

# 2) 단면 라벨.
check(report["meta"].get("analysisType") == "cross-sectional",
      f"analysisType 이 cross-sectional 이 아님: {report['meta'].get('analysisType')!r}")
check("성과 검증이 아님" in report["meta"].get("note", ""),
      "meta.note 에 '성과 검증이 아님' 고지가 없음")

# 3) 산출 불가 증거 — fail-closed.
ue = report.get("unavailableEvidence", {})
check(REQUIRED_UNAVAILABLE.issubset(set(ue.keys())),
      f"unavailableEvidence 누락: {REQUIRED_UNAVAILABLE - set(ue.keys())}")
for k, v in ue.items():
    check(v.get("available") is False, f"unavailableEvidence.{k}.available 이 False 가 아님")
    check(v.get("substitutedWithCurrentData") is False,
          f"unavailableEvidence.{k} 가 현재 데이터로 대체됨(substituted=True) — fail-closed 위반")
    check(bool(v.get("reason")), f"unavailableEvidence.{k}.reason 이 비어 있음")
# forward-return 은 어떤 수치도 방출하지 않아야 한다(현재 returns 대체 금지).
check("value" not in ue.get("forwardReturn", {}) and "score" not in ue.get("forwardReturn", {}),
      "forwardReturn 이 수치를 방출함 — 미래수익을 현재값으로 대체하면 안 됨")

# 4) 상관행렬 무결성.
for kind in ("pearson", "spearman"):
    mat = report["correlation"][kind]
    for a in METRICS:
        check(abs(mat[a][a] - 1.0) < 1e-9, f"{kind} 대각선 {a} != 1.0")
        for b in METRICS:
            check(-1.0 - 1e-9 <= mat[a][b] <= 1.0 + 1e-9, f"{kind} {a},{b} 범위 벗어남: {mat[a][b]}")
            check(abs(mat[a][b] - mat[b][a]) < 1e-9, f"{kind} 비대칭 {a},{b}")

# 5) ablation — 정확히 한 지표만 제거.
dropped_seen = set()
for ab in report["oneMetricAblation"]:
    dropped_seen.add(ab["dropped"])
    check(ab["dropped"] in METRICS, f"ablation dropped 가 지표가 아님: {ab['dropped']}")
    check(-1.0 - 1e-9 <= ab["spearmanVsFull"] <= 1.0 + 1e-9,
          f"ablation spearman 범위 벗어남: {ab['spearmanVsFull']}")
check(dropped_seen == set(METRICS), f"ablation 이 모든 지표를 다루지 않음: {dropped_seen}")

# 5a) 순위 동점 결정성 — 수학적으로 같은 0.1+0.2와 0.3이 마지막 float
# 비트 때문에 갈리지 않고 ticker 오름차순으로 결정돼야 한다(교차 OS/Python 계약).
near_tie_rows = [
    {"ticker": "000002", "momentum": 0.1, "flow": 0.2, "value": 0.0, "volScore": 0.0},
    {"ticker": "000001", "momentum": 0.3, "flow": 0.0, "value": 0.0, "volScore": 0.0},
]
check(ma.ranking(near_tie_rows, {k: 1.0 for k in METRICS}) == ["000001", "000002"],
      "부동소수점 근사 동점이 ticker 결정 규칙보다 우선함")

# 5b) 등가중 대안 — 각 대안 가중치는 하나만 2배, 나머지 1배.
for alt in report["equalWeightAlternatives"]:
    w = alt["weights"]
    doubled = [k for k in METRICS if abs(w[k] - 2.0) < 1e-9]
    ones = [k for k in METRICS if abs(w[k] - 1.0) < 1e-9]
    check(len(doubled) == 1 and len(ones) == len(METRICS) - 1,
          f"등가중 대안 가중치 형태 오류: {alt['label']} {w}")

# 6) Markdown 결정적 재생성 + 고지.
md1 = ma.render_markdown(report)
md2 = ma.render_markdown(ma.build_report(*ma.load_snapshot()))
check(md1 == md2, "Markdown 재생성이 비결정적")
check("현재 종합 점수를 검증하지 않습니다" in md1, "Markdown 에 '검증 아님' 고지가 없음")
for k in REQUIRED_UNAVAILABLE:
    check(k in md1, f"Markdown 산출 불가 표에 {k} 누락")

# 리포지토리에 커밋된 docs/methodology-audit.md 가 최신 재생성본과 일치하는지(stale 방지).
out_path = ma.DEFAULT_OUT
if os.path.exists(out_path):
    on_disk = open(out_path, encoding="utf-8").read()
    # 디스크 파일은 CRLF 일 수 있으므로 개행 정규화 후 비교.
    check(on_disk.replace("\r\n", "\n") == md1,
          "docs/methodology-audit.md 가 stale — `python scripts/methodology_audit.py` 재실행 필요")

if failures:
    print(f"[FAIL] methodology_audit 계약 검증 {len(failures)}건 실패:")
    for f in failures:
        print(f"  - {f}")
    sys.exit(1)

print(f"[PASS] methodology_audit 계약 검증 통과 "
      f"({meta['universeCount']}종목 · 스냅샷 {meta['snapshotAsOf']} · "
      f"단면 상관/기여/ablation + 산출불가 {len(REQUIRED_UNAVAILABLE)}종 fail-closed).")
