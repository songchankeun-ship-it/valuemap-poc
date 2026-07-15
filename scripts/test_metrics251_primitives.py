#!/usr/bin/env python3
# Metrics 2.5.1 shadow 원시 함수 계약·불변식 게이트 — Slice C.
#
# 강제하는 계약(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §6, §7 Gate 1, §10 Slice C):
#   A. average-rank 백분위: 순서 불변, 동률 동일, 단조, 0..100 범위, 결측 미대체.
#   B. Decimal ROUND_HALF_UP: .5 는 0 에서 먼 쪽(은행가 반올림 아님), 음수/경계/멱등.
#   C. 저장(소수 1자리) + 표시(정수) 반올림이 저장값 기준으로 동작.
#   D. 점수 클램프/검증: 범위 밖 클램프, None 은 유효한 결측으로 통과, 비유한값 거부.
#   E. 명시적 null 전파: 결측 하나면 결과 None. 종합점수는 네 factor 모두 유효할 때만 산출.
#      어떤 경우에도 결측이 50/평균으로 대체되지 않음.
#   F. 설정 정합성: 모듈 상수 == canonical config(config/metrics/2.5.1.json) 값.
#   G. 분리/결정성: compute_metrics 미의존, public/ 미기록, 벽시계 미사용.
#
# Usage: $env:PYTHONUTF8='1'; python scripts/test_metrics251_primitives.py   (실패 시 exit 1)
import json
import os
import sys
from decimal import Decimal

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import metrics251_primitives as mp  # noqa: E402

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


def approx(a, b, tol=1e-9):
    return a is not None and b is not None and abs(a - b) <= tol


# 결정적 순열 생성기(Math.random 금지 — 인덱스로만 섞는다).
def _permute(seq, step):
    n = len(seq)
    if n == 0:
        return list(seq)
    return [seq[(i * step) % n] for i in range(n)] if math_gcd(step, n) == 1 else list(reversed(seq))


def math_gcd(a, b):
    while b:
        a, b = b, a % b
    return a


# ===========================================================================
# A. average-rank 백분위.
# ===========================================================================

# A0. N=1 → 정확히 50 (SINGLE_VALUE_SCORE, 결측 대체 아님 — 유효 모집단 1개의 정상 백분위).
check(mp.percentile_scores([42.0]) == [50.0], f"N=1 백분위가 50 이 아님: {mp.percentile_scores([42.0])}")
check(mp.SINGLE_VALUE_SCORE == mp.percentile_from_average_rank(1.0, 1),
      "SINGLE_VALUE_SCORE 가 N=1 공식값과 불일치")

# A1. 빈 입력 → 빈 출력.
check(mp.percentile_scores([]) == [], "빈 입력이 빈 출력이 아님")
check(mp.average_ranks([]) == [], "average_ranks([]) 가 빈 리스트가 아님")

# A2. 전부 None → 전부 None(모집단 0, 대체 없음).
check(mp.percentile_scores([None, None, None]) == [None, None, None], "전부 None 이 전파되지 않음")

# A3. 명시적 null 전파 + 모집단 제외: [10,None,20] → N=2, 두 유효값만 25/75, None 유지.
res = mp.percentile_scores([10.0, None, 20.0])
check(res[1] is None, "결측이 None 으로 전파되지 않음")
check(approx(res[0], 25.0) and approx(res[2], 75.0),
      f"결측 제외 모집단(N=2) 백분위 오류: {res}")  # (1-0.5)/2=25, (2-0.5)/2=75
# 결측이 50 등 어떤 숫자로도 대체되지 않았음을 명시적으로 단언.
check(res[1] != 50.0 and not isinstance(res[1], (int, float)), "결측이 숫자로 대체됨(금지)")

# A4. 동률 동일 — [10,10,20] 의 두 10 은 같은 점수, 20 은 더 큼.
ties = mp.percentile_scores([10.0, 10.0, 20.0])
check(ties[0] == ties[1], f"동률 값의 점수가 다름: {ties}")
check(ties[2] > ties[0], "더 큰 값의 점수가 더 크지 않음")
# 평균 순위: 두 10 은 (1+2)/2=1.5 → (1.5-0.5)/3*100=33.33…, 20 은 3 → (3-0.5)/3*100=83.33…
check(approx(ties[0], 100.0 / 3.0) and approx(ties[2], 250.0 / 3.0), f"동률 평균순위 백분위 오류: {ties}")

# A5. 전부 동률 N개 → 모두 50(균형점). 단일값과 일관.
allsame = mp.percentile_scores([7.0, 7.0, 7.0, 7.0])
check(all(approx(x, 50.0) for x in allsame), f"전부 동률이 모두 50 이 아님: {allsame}")

# A6. 순서 불변(permuted/unsorted) — 값→점수 매핑이 순열과 무관.
base = [5.0, 1.0, 9.0, 3.0, 7.0, 5.0, 2.0]  # 동률(5.0 두 개) 포함
base_scores = mp.percentile_scores(base)
base_map = {}
for v, s in zip(base, base_scores):
    base_map.setdefault(v, s)
    check(approx(base_map[v], s), f"같은 값이 다른 점수(동률 불변 위반): {v}")
for step in (2, 3, 5, 6):  # 결정적 순열들
    perm = _permute(base, step)
    perm_scores = mp.percentile_scores(perm)
    for v, s in zip(perm, perm_scores):
        check(approx(base_map[v], s), f"순서 의존성 발견: step={step} 값 {v} 점수 {s} != {base_map[v]}")
# 역순도 확인.
rev = list(reversed(base))
rev_scores = mp.percentile_scores(rev)
for v, s in zip(rev, rev_scores):
    check(approx(base_map[v], s), f"역순 의존성: 값 {v}")

# A7. 단조 — 서로 다른 오름차순 값은 엄격 증가 점수.
mono_vals = [-10.0, -3.5, 0.0, 2.0, 11.0, 100.0, 293490.0]  # 음수/원시 극단 포함
mono = mp.percentile_scores(mono_vals)
for i in range(1, len(mono)):
    check(mono[i] > mono[i - 1], f"단조 위반: {mono[i-1]} !< {mono[i]} at {i}")

# A8. 0..100 범위 불변 — 여러 구성에서 모든 점수가 [0,100].
for vals in ([1.0], [1.0, 2.0], base, mono_vals, [0.0, 0.0, 1.0, 1.0, 1.0]):
    for s in mp.percentile_scores(vals):
        check(s is None or (mp.MIN_SCORE <= s <= mp.MAX_SCORE), f"범위 이탈: {s} in {vals}")

# A9. 경계값 — 최저=50/N, 최고=100-50/N (엄격 내부).
b = mp.percentile_scores([10.0, 20.0, 30.0, 40.0])  # N=4
check(approx(min(b), 50.0 / 4.0) and approx(max(b), 100.0 - 50.0 / 4.0), f"경계값 오류: {b}")
check(0.0 < min(b) and max(b) < 100.0, "경계값이 (0,100) 내부가 아님")

# A10. 음수/raw 값도 순위만 쓴다(부호 무관 단조) — 위 A7 에 포함, 추가로 전부 음수.
negs = mp.percentile_scores([-5.0, -1.0, -9.0])
check(approx(negs[2], 50.0 / 3.0) and approx(negs[0], 150.0 / 3.0), f"전부 음수 백분위 오류: {negs}")

# average_ranks 직접 — 동률/순서.
check(mp.average_ranks([20.0, 10.0, 10.0]) == [3.0, 1.5, 1.5], "average_ranks 동률 계산 오류")
check(mp.average_ranks([1.0, 2.0, 3.0]) == [1.0, 2.0, 3.0], "average_ranks 오름차순 오류")

# ===========================================================================
# B. Decimal ROUND_HALF_UP.
# ===========================================================================

# B1. .5 는 0 에서 먼 쪽(HALF_UP, 은행가 반올림 아님) — 정수 자리.
for x, want in [(0.5, 1), (1.5, 2), (2.5, 3), (3.5, 4), (4.5, 5)]:
    got = int(mp.round_half_up(x, 0))
    check(got == want, f"HALF_UP {x}->0dp: {got} 기대 {want} (은행가 반올림이면 {x}->오답)")
# HALF_EVEN(은행가)이면 2.5->2, 4.5->4 가 됐을 것 — 그 차이를 명시적으로 잡는다.
check(int(mp.round_half_up(2.5, 0)) == 3 and int(mp.round_half_up(4.5, 0)) == 5,
      "HALF_UP 이 은행가 반올림처럼 동작함")

# B2. 소수 1자리 — float 이진오차 없이(str 경유). 2.45->2.5, 0.25->0.3, 0.05->0.1.
for x, want in [(0.05, "0.1"), (0.15, "0.2"), (0.25, "0.3"), (2.45, "2.5"), (66.666, "66.7")]:
    got = mp.round_half_up(x, 1)
    check(got == Decimal(want), f"HALF_UP {x}->1dp: {got} 기대 {want}")

# B3. 음수 — 0 에서 먼 쪽.
for x, dp, want in [(-0.5, 0, "-1"), (-2.5, 0, "-3"), (-0.05, 1, "-0.1"), (-1.25, 1, "-1.3")]:
    got = mp.round_half_up(x, dp)
    check(got == Decimal(want), f"HALF_UP 음수 {x}->{dp}dp: {got} 기대 {want}")

# B4. 큰/raw 값 통과(무손실 자리).
check(mp.round_half_up(293490.123456, 1) == Decimal("293490.1"), "큰 값 반올림 오류")
check(mp.round_half_up(0, 1) == Decimal("0.0"), "0 반올림 오류")

# B5. 멱등 — 이미 1자리면 재반올림해도 불변.
once = mp.round_half_up(2.55, 1)  # 2.6
check(mp.round_half_up(once, 1) == once, "1자리 반올림이 멱등이 아님")

# B6. 비유한/비정수 decimals 거부.
for bad in (float("nan"), float("inf"), float("-inf")):
    try:
        mp.round_half_up(bad, 1)
        failures.append(f"비유한값 {bad} 이 예외를 던지지 않음")
    except ValueError:
        pass
try:
    mp.round_half_up(1.23, -1)
    failures.append("음수 decimals 가 예외를 던지지 않음")
except ValueError:
    pass

# ===========================================================================
# C. 저장(소수 1자리) + 표시(정수) 반올림.
# ===========================================================================

# C1. store_score → 소수 1자리 HALF_UP. None 전파.
check(mp.store_score(66.666) == 66.7, f"store_score 소수1자리 오류: {mp.store_score(66.666)}")
check(mp.store_score(2.55) == 2.6, "store_score 2.55->2.6(HALF_UP) 오류")
check(mp.store_score(None) is None, "store_score(None) 이 None 이 아님")
# 저장값이 정확히 1자리인지(Decimal 지수 -1) 단언.
check(mp.round_half_up(2.5, 1).as_tuple().exponent == -1, "저장 점수가 정확히 소수1자리가 아님")

# C2. display_integer 는 **저장된** 점수 기준(원시값 아님). None 전파.
check(mp.display_integer(2.5) == 3, "display_integer(2.5)!=3")
check(mp.display_integer(0.5) == 1, "display_integer(0.5)!=1")
check(mp.display_integer(49.5) == 50, "display_integer(49.5)!=50")
check(mp.display_integer(None) is None, "display_integer(None) 이 None 이 아님")

# C3. 두 단계(저장→표시) 경로가 config displayIntegerFromStoredScore 계약을 만족.
#     원시 2.46 → 저장 2.5 → 표시 3. (원시에서 바로 정수화하면 2 가 되어 달랐을 것을 명시.)
raw = 2.46
stored = mp.store_score(raw)
check(stored == 2.5, f"저장 단계 오류: {stored}")
check(mp.display_integer(stored) == 3, "저장→표시 정수 경로 오류")
check(int(mp.round_half_up(raw, 0)) == 2, "전제: 원시 직접 정수화는 2 여야 함(두 단계 차이 증명)")

# ===========================================================================
# D. 클램프 / 검증.
# ===========================================================================
check(mp.clamp_score(150.0) == 100.0, "상한 클램프 실패")
check(mp.clamp_score(-5.0) == 0.0, "하한 클램프 실패")
check(mp.clamp_score(50.0) == 50.0, "범위 내 값이 바뀜")
check(mp.clamp_score(None) is None, "clamp_score(None) 이 None 이 아님")
check(mp.clamp_score(0.0) == 0.0 and mp.clamp_score(100.0) == 100.0, "경계값 클램프가 값 변경")

check(mp.is_score_in_range(None) is True, "None 이 유효 결측으로 통과하지 않음")
check(mp.is_score_in_range(0.0) and mp.is_score_in_range(100.0), "경계 점수가 유효하지 않음")
check(not mp.is_score_in_range(100.1) and not mp.is_score_in_range(-0.1), "범위 밖 점수가 유효로 판정")
check(not mp.is_score_in_range(float("nan")), "NaN 이 유효로 판정")

# assert_score_valid — None/정상 통과, 범위밖/NaN 예외.
check(mp.assert_score_valid(None) is None, "assert_score_valid(None) 이 통과하지 않음")
check(mp.assert_score_valid(73.2) == 73.2, "assert_score_valid 정상값 반환 오류")
for bad in (150.0, -1.0, float("nan")):
    try:
        mp.assert_score_valid(bad)
        failures.append(f"assert_score_valid 가 {bad} 를 통과시킴")
    except ValueError:
        pass

# ===========================================================================
# E. 명시적 null 전파 결합기.
# ===========================================================================
check(approx(mp.mean_or_none([1.0, 2.0, 3.0]), 2.0), "mean_or_none 평균 오류")
check(mp.mean_or_none([1.0, None, 3.0]) is None, "mean_or_none 이 결측을 전파하지 않음")
check(mp.mean_or_none([]) is None, "mean_or_none([]) 이 None 이 아님")

check(approx(mp.weighted_mean_or_none([80.0, 40.0], [0.25, 0.75]), 50.0), "weighted_mean 계산 오류")
check(mp.weighted_mean_or_none([80.0, None], [0.5, 0.5]) is None, "weighted_mean 이 결측을 전파하지 않음")

# 종합점수 — 네 factor 모두 유효 → 가중평균(동일가중 0.25).
weights = {"momentum": 0.25, "activity": 0.25, "value": 0.25, "riskAdjusted": 0.25}
required = ["momentum", "activity", "value", "riskAdjusted"]
full = {"momentum": 60.0, "activity": 40.0, "value": 80.0, "riskAdjusted": 20.0}
check(approx(mp.composite_score(full, weights, required), 50.0), "종합점수(전부 유효) 오류")
# 필수 factor 하나라도 None → 보류(None). 절대 50/평균 대체 아님.
for miss in required:
    partial = dict(full)
    partial[miss] = None
    got = mp.composite_score(partial, weights, required)
    check(got is None, f"{miss} 결측인데 종합점수가 None 이 아님(대체 금지): {got}")
    check(got != 50.0, f"{miss} 결측이 50 으로 대체됨(금지)")
# 필수 키 부재(딕셔너리에 아예 없음)도 None.
check(mp.composite_score({"momentum": 60.0}, weights, required) is None, "키 부재 factor 가 보류되지 않음")

# ===========================================================================
# F. 설정 정합성 — 모듈 상수 == canonical config.
# ===========================================================================
with open(os.path.join(ROOT, "config", "metrics", "2.5.1.json"), encoding="utf-8-sig") as f:
    cfg = json.load(f)
rnd = cfg["rounding"]
pct = cfg["percentile"]
check(mp.STORED_SCORE_DECIMALS == rnd["storedScoreDecimals"], "STORED_SCORE_DECIMALS != config")
check(mp.ROUNDING_MODE == rnd["mode"], "ROUNDING_MODE != config")
check(rnd["mode"] == "ROUND_HALF_UP", "config rounding.mode 가 ROUND_HALF_UP 아님")
check(rnd["displayIntegerFromStoredScore"] is True, "config displayIntegerFromStoredScore 가 true 아님")
check(mp.PERCENTILE_METHOD == pct["method"] == pct["tieHandling"] == "average_rank",
      "PERCENTILE_METHOD/tieHandling 정합성 실패")
check(mp.SINGLE_VALUE_SCORE == pct["singleValueScore"], "SINGLE_VALUE_SCORE != config")
check(mp.MIN_SCORE == pct["minScore"] and mp.MAX_SCORE == pct["maxScore"], "MIN/MAX_SCORE != config")

# ===========================================================================
# G. 분리 / 결정성 — compute_metrics 미의존, public/ 미기록, 벽시계 미사용.
# ===========================================================================
mod_src = open(os.path.join(HERE, "metrics251_primitives.py"), encoding="utf-8").read()
code_only = "\n".join(line.split("#", 1)[0] for line in mod_src.splitlines())
for banned in ("import compute_metrics", "from compute_metrics", "compute_metrics"):
    check(banned not in code_only, f"공개 생성 경로 의존 감지: {banned!r} (Slice C 는 분리 유지)")
for banned in ("public/data", "public\\\\data", "open(", "write("):
    check(banned not in code_only, f"파일/공개경로 기록 흔적 감지: {banned!r} (원시 함수는 순수해야 함)")
for banned in ("datetime.now(", "time.time(", "date.today(", "utcnow(", "random("):
    check(banned not in code_only, f"결정성 위반: {banned!r}")

if failures:
    print(f"[FAIL] metrics251_primitives 계약 검증 {len(failures)}건 실패:")
    for x in failures:
        print(f"  - {x}")
    sys.exit(1)

print("[PASS] metrics251_primitives 계약 검증 통과 "
      "(average-rank 순서불변/동률/단조/0..100/결측전파 · HALF_UP .5→멀리/음수/멱등 · "
      "저장1자리+표시정수 · 클램프/검증 · null 전파(종합 보류) · config 정합성 · 분리/결정성).")
