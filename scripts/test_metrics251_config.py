#!/usr/bin/env python3
# Metrics 2.5.1 shadow 설정 경계 계약·canonical hash 게이트 — Slice B.
#
# 강제하는 계약(설계서 §M251-D01, §10 Slice B):
#   1. 스키마: 승인 config 가 표준 라이브러리 검증기로 스키마를 통과한다(오류 0).
#      스키마가 실제로 무언가를 막는다(추가 키·타입·enum 위반 주입 시 오류 발생).
#   2. 데이터 전용: config 에 실행 표현식 문자열이 없다. 표현식을 주입하면 가드가 잡는다.
#   3. canonical 결정성: 같은 config -> 바이트 단위로 같은 canonical 직렬화 + 같은 SHA-256.
#   4. 불변식 A(정규화): 공백/키 순서/숫자 표기(`0.30` vs `0.3`) 차이는 hash 를 바꾸지 않는다.
#   5. 불변식 B(민감도): 실제 파라미터 변경은 hash 를 바꾼다.
#   6. 생성물 최신성: 커밋된 canonical.json/lock.json 이 재생성본과 정확히 일치(stale/편집 게이트).
#   7. YAML 불변: 수신 draft YAML 바이트 해시가 decision-map 에 기록된 값과 일치(원문 미수정).
#   8. YAML 런타임 파서 없음 + 벽시계 미사용(결정성).
#   9. decision-map 추적성: 매핑의 configPath 가 실제 config 경로로 해석된다(dangling 없음).
#
# Usage: $env:PYTHONUTF8='1'; python scripts/test_metrics251_config.py   (실패 시 exit 1)
import copy
import hashlib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import metrics251_config as mc  # noqa: E402

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


config = mc._read_config()
schema = mc._read_schema()

# 1) 스키마 통과(오류 0).
errors = mc.validate_against_schema(config, schema)
check(errors == [], f"승인 config 가 스키마 위반: {errors[:5]}")
# 데이터 전용 가드 포함 전체 검증도 0.
check(mc.validate(config, schema) == [], "validate(config) 오류가 0 이 아님")

# 1b) 스키마가 실제로 막는다 — 추가 키/타입/enum/const 위반 주입.
bad_extra = copy.deepcopy(config)
bad_extra["unexpectedKey"] = 1
check(len(mc.validate_against_schema(bad_extra, schema)) >= 1, "additionalProperties=false 가 추가 키를 막지 못함")
bad_type = copy.deepcopy(config)
bad_type["rounding"]["storedScoreDecimals"] = "1"  # 정수여야 함
check(len(mc.validate_against_schema(bad_type, schema)) >= 1, "type 위반(문자열)을 스키마가 막지 못함")
bad_enum = copy.deepcopy(config)
bad_enum["rounding"]["mode"] = "ROUND_DOWN"
check(len(mc.validate_against_schema(bad_enum, schema)) >= 1, "enum 위반을 스키마가 막지 못함")
bad_const = copy.deepcopy(config)
bad_const["engineVersion"] = "2.4"
check(len(mc.validate_against_schema(bad_const, schema)) >= 1, "const(engineVersion) 위반을 스키마가 막지 못함")
bad_range = copy.deepcopy(config)
bad_range["composite"]["weights"]["momentum"] = 5  # maximum 1
check(len(mc.validate_against_schema(bad_range, schema)) >= 1, "maximum 위반을 스키마가 막지 못함")

# 2) 데이터 전용 — 현재 config 에 표현식 문자열 없음.
check(mc.find_expression_strings(config) == [], "config 에 실행 표현식 문자열이 존재")
# 표현식을 주입하면 가드가 잡는다(YAML 원안의 raw_formula 재유입 시뮬레이션).
injected = copy.deepcopy(config)
injected["metrics"]["momentum"]["rawFormula"] = "0.30*r21 + 0.40*r63 + 0.30*r126"
check(len(mc.find_expression_strings(injected)) >= 1, "주입한 산술 표현식을 가드가 잡지 못함")
injected2 = copy.deepcopy(config)
injected2["metrics"]["value"]["validity"]["per"] = "> 0"
check(len(mc.find_expression_strings(injected2)) >= 1, "주입한 비교 표현식('> 0')을 가드가 잡지 못함")
injected3 = copy.deepcopy(config)
injected3["metrics"]["value"]["componentScore2"] = "100 - percentile(per)"
check(len(mc.find_expression_strings(injected3)) >= 1, "주입한 함수 호출 표현식(percentile(...))을 가드가 잡지 못함")
# enum 식별자(괄호 없음)는 오탐이 아니어야 한다.
check(mc.find_expression_strings({"x": "universe_percentile"}) == [], "enum 식별자 universe_percentile 가 오탐됨")
check(mc.find_expression_strings({"x": "hundred_minus_percentile"}) == [], "enum 식별자 hundred_minus_percentile 가 오탐됨")

# 3) canonical 결정성 — 두 번 계산해 바이트/hash 동일.
b1 = mc.canonical_bytes(config)
b2 = mc.canonical_bytes(mc._read_config())
check(b1 == b2, "비결정적: canonical 바이트가 두 실행에서 다름")
H0 = hashlib.sha256(b1).hexdigest()
check(H0 == mc.config_hash(config), "config_hash 가 canonical 바이트 해시와 불일치")

# 4) 불변식 A — 공백/키 순서/숫자 표기 차이가 hash 를 바꾸지 않는다.
def _reverse_keys(node):
    if isinstance(node, dict):
        return {k: _reverse_keys(node[k]) for k in reversed(list(node.keys()))}
    if isinstance(node, list):
        return [_reverse_keys(x) for x in node]
    return node

reordered = _reverse_keys(config)
reformatted_text = json.dumps(reordered, ensure_ascii=False, indent=4)  # 키 역순 + 들여쓰기(다른 바이트)
raw_text = open(mc.CONFIG_PATH, encoding="utf-8-sig").read()
check(reformatted_text != raw_text, "재포맷 텍스트가 원본과 동일(테스트 전제 실패)")
reparsed = json.loads(reformatted_text)
check(mc.config_hash(reparsed) == H0, "공백/키 순서 변경이 configHash 를 바꿈(정규화 실패)")

# 4b) 숫자 표기 불변 — `0.30`/`0.0350000` 같은 동일-값 다른-표기가 hash 를 바꾸지 않는다.
num_variant_text = raw_text.replace("0.035", "0.0350000").replace("\"r3m\": 0.40", "\"r3m\": 0.4000")
check(num_variant_text != raw_text, "숫자 표기 변형 전제 실패(치환 미발생)")
check(mc.config_hash(json.loads(num_variant_text)) == H0, "동일-값 다른-표기 숫자가 configHash 를 바꿈")
# 단위 수준: `0.30` 과 `0.3` 은 같은 canonical 바이트.
check(mc.canonical_bytes(json.loads('{"w":0.30}')) == mc.canonical_bytes(json.loads('{"w":0.3}')),
      "0.30 과 0.3 의 canonical 바이트가 다름")

# 5) 불변식 B — 실제 파라미터 변경은 hash 를 바꾼다.
changed = copy.deepcopy(config)
changed["metrics"]["riskAdjusted"]["fixedAnnualHurdleRate"] = 0.04  # 0.035 -> 0.04
check(mc.config_hash(changed) != H0, "실제 파라미터 변경(hurdle 0.035->0.04)이 configHash 를 바꾸지 못함")
changed2 = copy.deepcopy(config)
changed2["metrics"]["momentum"]["weights"]["r1m"] = 0.31
check(mc.config_hash(changed2) != H0, "가중치 변경(0.30->0.31)이 configHash 를 바꾸지 못함")

# 6) 생성물 최신성 — 커밋된 canonical.json/lock.json 이 재생성본과 정확히 일치.
check(os.path.exists(mc.CANONICAL_PATH), "canonical.json 없음 — 생성기 실행 필요")
on_disk_canon = open(mc.CANONICAL_PATH, "rb").read()
check(on_disk_canon == b1, "canonical.json 이 stale/편집됨(바이트 불일치)")
check(b"\n" not in on_disk_canon and b"\r" not in on_disk_canon,
      "canonical.json 에 개행이 있음 — compact 한 줄이어야 함")
lock = mc.build_lock(config, b1)
check(os.path.exists(mc.LOCK_PATH), "lock.json 없음 — 생성기 실행 필요")
on_disk_lock = open(mc.LOCK_PATH, encoding="utf-8-sig").read().replace("\r\n", "\n")
check(on_disk_lock == mc.lock_text(lock), "lock.json 이 stale/편집됨")
check(lock["configHash"] == H0, "lock.configHash 가 configHash 와 불일치")
check(lock["canonicalByteLength"] == len(b1), "lock.canonicalByteLength 가 canonical 길이와 불일치")
# check() 통과.
ok, _msgs = mc.check()
check(ok is True, "mc.check() 가 통과로 보고하지 않음(생성물 최신성 게이트)")

# 7) YAML 불변 — decision-map 의 yaml sha256 이 실제 파일 바이트와 일치(원문 미수정 증거).
with open(mc.DECISION_MAP_PATH, encoding="utf-8-sig") as f:
    dmap = json.load(f)
yaml_rel = dmap["sourceYaml"]["path"]
yaml_path = os.path.join(ROOT, yaml_rel)
actual_yaml_sha = hashlib.sha256(open(yaml_path, "rb").read()).hexdigest()
check(dmap["sourceYaml"]["sha256"] == actual_yaml_sha,
      f"수신 YAML 이 변경됨 — decision-map sha256 {dmap['sourceYaml']['sha256'][:12]} != 실제 {actual_yaml_sha[:12]}")
check(dmap["sourceYaml"].get("immutable") is True, "decision-map 이 YAML 을 immutable 로 표기하지 않음")

# 8) YAML 런타임 파서 없음 + 벽시계 미사용.
# 주석에 '금지' 설명으로 등장하는 토큰과 실제 코드를 구분하기 위해 각 줄의 주석(#...)을 제거하고 검사한다.
# (이 모듈의 코드 문자열 리터럴에는 아래 토큰이 없으므로 주석 제거만으로 충분하다.)
mod_src = open(os.path.join(HERE, "metrics251_config.py"), encoding="utf-8").read()
code_only = "\n".join(line.split("#", 1)[0] for line in mod_src.splitlines())
for banned in ("import yaml", "from yaml", "yaml.load", "yaml.safe_load"):
    check(banned not in code_only, f"런타임 YAML 파서 감지: {banned!r}")
for banned in ("datetime.now(", "time.time(", "date.today(", "utcnow("):
    check(banned not in code_only, f"결정성 위반: 벽시계 호출 {banned!r}")

# 9) decision-map 추적성 — 매핑의 configPath 가 실제 config 경로로 해석된다.
def _resolve(node, dotted):
    cur = node
    for part in dotted.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return (False, None)
        cur = cur[part]
    return (True, cur)

mapped_paths = 0
for m in dmap["mappings"]:
    cp = m.get("configPath")
    if not cp or cp == "(none)":
        continue
    found, _ = _resolve(config, cp)
    check(found, f"decision-map configPath 가 config 에 없음(dangling): {cp}")
    mapped_paths += 1
check(mapped_paths >= 30, f"decision-map 매핑이 너무 적음: {mapped_paths}")
# 핵심 결정이 기록돼 있어야 한다.
for key in ("D01_no_yaml_runtime", "D06_naming", "expressions_to_data", "missing_policy"):
    check(key in dmap.get("decisions", {}), f"decision-map 결정 기록 누락: {key}")
# D06 rename 이 실제 config 에 반영(fixedAnnualHurdleRate 존재, risk_free_rate_annual 부재).
check("fixedAnnualHurdleRate" in config["metrics"]["riskAdjusted"], "fixedAnnualHurdleRate 누락(D06)")
check(config["metrics"]["riskAdjusted"]["fixedAnnualHurdleRate"] == 0.035, "hurdle 값이 0.035 아님")

if failures:
    print(f"[FAIL] metrics251_config 계약 검증 {len(failures)}건 실패:")
    for x in failures:
        print(f"  - {x}")
    sys.exit(1)

print(f"[PASS] metrics251_config 계약 검증 통과 "
      f"(configHash {H0[:12]}… · canonical {len(b1)}B · 매핑 {mapped_paths}개 · "
      f"스키마/데이터전용/정규화/민감도/최신성/YAML불변 통과).")
