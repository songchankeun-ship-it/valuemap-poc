#!/usr/bin/env python3
# Metrics 2.5.1 shadow 설정 경계 + canonical hash (Slice B) — 데이터 전용, 실행 표현식 금지.
#
# 목적(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D01, §10 Slice B):
#   * 승인된 shadow 설정을 canonical JSON(config/metrics/2.5.1.json)으로만 소유한다.
#   * 수신 draft YAML 은 증거로 보존하고 런타임에서 파싱하지 않는다(YAML 파서 미도입).
#   * JSON Schema(config/metrics/2.5.1.schema.json)를 표준 라이브러리만으로 검증한다.
#   * config -> canonical serialization(정렬·숫자 표현·UTF-8 고정) -> SHA-256 configHash.
#   * 파생 기계 계약(canonical.json, lock.json)을 생성/검사하고, 손으로 수정하거나
#     stale 이면 실패시킨다.
#   * 설정은 데이터만 담는다. 산술/비교 표현식 문자열을 담지 않는다(엔진이 실행 의미 소유).
#
# 반드시 지키는 규칙:
#   * import yaml 금지(런타임 YAML 파서 없음).
#   * 벽시계 시각 금지(datetime.now()/time.time() 등) — 출력은 config 바이트에서만 파생, 결정적.
#   * public/ 또는 공개 API 에 아무것도 쓰지 않는다. config/ 는 공개 경로가 아니다.
#   * 결측을 50/factor 평균으로 채우는 값을 새로 만들지 않는다.
#
# Usage:
#   $env:PYTHONUTF8='1'; python scripts/metrics251_config.py            # 생성물 재생성 + 요약
#   python scripts/metrics251_config.py --check                         # 검증 + 생성물 최신성 게이트(stale/편집 시 exit 1)
#   python scripts/metrics251_config.py --print-hash                    # configHash 만 출력
import argparse
import hashlib
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CONFIG_DIR = os.path.join(ROOT, "config", "metrics")
CONFIG_PATH = os.path.join(CONFIG_DIR, "2.5.1.json")
SCHEMA_PATH = os.path.join(CONFIG_DIR, "2.5.1.schema.json")
DECISION_MAP_PATH = os.path.join(CONFIG_DIR, "2.5.1.decision-map.json")
CANONICAL_PATH = os.path.join(CONFIG_DIR, "2.5.1.canonical.json")
LOCK_PATH = os.path.join(CONFIG_DIR, "2.5.1.lock.json")

REL = lambda p: os.path.relpath(p, ROOT).replace(os.sep, "/")  # noqa: E731

# 설정은 데이터만 담는다(설계서 §M251-D01). 아래 토큰은 산술/비교/함수 호출 표현식의 징후이며,
# 어떤 문자열 값에도 등장하면 실행 표현식이 설정에 스며든 것으로 보고 실패시킨다.
# 수신 YAML 의 raw_formula / when / score / "> 0" 같은 표현식이 재유입되면 여기서 잡힌다.
# 주의: 연산자/괄호만 금지한다. 함수 호출은 여는 괄호로 표기되므로 `percentile(`/`sqrt(` 도 함께 잡힌다.
# `universe_percentile` 같은 enum 식별자는 괄호가 없어 통과한다(오탐 방지).
FORBIDDEN_EXPR_TOKENS = ["*", "/", "+", "(", ")", "<", ">", "sqrt(", "percentile("]


# ---------------------------------------------------------------------------
# 표준 라이브러리 JSON Schema 검증기 (사용하는 키워드 부분집합만 지원).
# 지원: type(단일/배열), const, enum, properties, required, additionalProperties(bool/schema),
#       items(단일 schema), minimum/maximum(포함), exclusiveMinimum/exclusiveMaximum,
#       minItems/maxItems, minLength/maxLength, pattern.
# ---------------------------------------------------------------------------
def _is_int(x):
    return isinstance(x, int) and not isinstance(x, bool)


def _is_num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def _type_ok(value, t):
    if t == "object":
        return isinstance(value, dict)
    if t == "array":
        return isinstance(value, list)
    if t == "string":
        return isinstance(value, str)
    if t == "integer":
        return _is_int(value)
    if t == "number":
        return _is_num(value)
    if t == "boolean":
        return isinstance(value, bool)
    if t == "null":
        return value is None
    return False


def _validate(value, schema, path, errors):
    # const
    if "const" in schema and value != schema["const"]:
        errors.append(f"{path}: const {schema['const']!r} 기대, {value!r} 받음")
    # enum
    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{path}: enum {schema['enum']!r} 에 없음: {value!r}")
    # type
    if "type" in schema:
        types = schema["type"]
        types = [types] if isinstance(types, str) else types
        if not any(_type_ok(value, t) for t in types):
            errors.append(f"{path}: type {types} 위반: {type(value).__name__}={value!r}")
            return  # 타입이 틀리면 하위 제약 검사는 의미 없음
    # number 제약
    if _is_num(value):
        if "minimum" in schema and value < schema["minimum"]:
            errors.append(f"{path}: {value} < minimum {schema['minimum']}")
        if "maximum" in schema and value > schema["maximum"]:
            errors.append(f"{path}: {value} > maximum {schema['maximum']}")
        if "exclusiveMinimum" in schema and value <= schema["exclusiveMinimum"]:
            errors.append(f"{path}: {value} <= exclusiveMinimum {schema['exclusiveMinimum']}")
        if "exclusiveMaximum" in schema and value >= schema["exclusiveMaximum"]:
            errors.append(f"{path}: {value} >= exclusiveMaximum {schema['exclusiveMaximum']}")
    # string 제약
    if isinstance(value, str):
        if "minLength" in schema and len(value) < schema["minLength"]:
            errors.append(f"{path}: 길이 {len(value)} < minLength {schema['minLength']}")
        if "maxLength" in schema and len(value) > schema["maxLength"]:
            errors.append(f"{path}: 길이 {len(value)} > maxLength {schema['maxLength']}")
        if "pattern" in schema and re.search(schema["pattern"], value) is None:
            errors.append(f"{path}: pattern {schema['pattern']!r} 불일치: {value!r}")
    # array 제약
    if isinstance(value, list):
        if "minItems" in schema and len(value) < schema["minItems"]:
            errors.append(f"{path}: 항목 {len(value)} < minItems {schema['minItems']}")
        if "maxItems" in schema and len(value) > schema["maxItems"]:
            errors.append(f"{path}: 항목 {len(value)} > maxItems {schema['maxItems']}")
        if "items" in schema:
            for i, item in enumerate(value):
                _validate(item, schema["items"], f"{path}[{i}]", errors)
    # object 제약
    if isinstance(value, dict):
        props = schema.get("properties", {})
        for req in schema.get("required", []):
            if req not in value:
                errors.append(f"{path}: 필수 키 누락 '{req}'")
        addl = schema.get("additionalProperties", True)
        for k, v in value.items():
            child_path = f"{path}.{k}" if path else k
            if k in props:
                _validate(v, props[k], child_path, errors)
            elif addl is False:
                errors.append(f"{path}: 허용되지 않은 추가 키 '{k}'")
            elif isinstance(addl, dict):
                _validate(v, addl, child_path, errors)


def validate_against_schema(config, schema):
    errors = []
    _validate(config, schema, "", errors)
    return errors


# ---------------------------------------------------------------------------
# 데이터 전용 가드 — 실행 표현식 문자열 금지.
# ---------------------------------------------------------------------------
def find_expression_strings(node, path=""):
    hits = []
    if isinstance(node, dict):
        for k, v in node.items():
            hits.extend(find_expression_strings(v, f"{path}.{k}" if path else k))
    elif isinstance(node, list):
        for i, v in enumerate(node):
            hits.extend(find_expression_strings(v, f"{path}[{i}]"))
    elif isinstance(node, str):
        bad = [tok for tok in FORBIDDEN_EXPR_TOKENS if tok in node]
        if bad:
            hits.append((path, node, bad))
    return hits


# ---------------------------------------------------------------------------
# Canonical serialization + hash.
#   canonical_bytes = 키 재귀 정렬 + 최소 구분자 + UTF-8. NaN/Infinity 금지.
#   숫자 표현 규칙: 정수는 정수로, 비정수는 파이썬 json 의 최단 왕복(repr) 표기로 직렬화.
#     => 입력의 공백/키 순서/`0.30` vs `0.3` 표기 차이는 정규화되어 사라진다(같은 값 -> 같은 바이트).
#   configHash = sha256(canonical_bytes). config/metrics/2.5.1.canonical.json 은 이 바이트를 그대로 담는다.
# ---------------------------------------------------------------------------
def canonical_bytes(config):
    return json.dumps(
        config,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    ).encode("utf-8")


def config_hash(config):
    return hashlib.sha256(canonical_bytes(config)).hexdigest()


def _read_config():
    with open(CONFIG_PATH, encoding="utf-8-sig") as f:
        return json.load(f)


def _read_schema():
    with open(SCHEMA_PATH, encoding="utf-8-sig") as f:
        return json.load(f)


def build_lock(config, cbytes):
    return {
        "algorithm": config.get("configHashAlgorithm", "sha256"),
        "canonicalByteLength": len(cbytes),
        "configHash": hashlib.sha256(cbytes).hexdigest(),
        "engineVersion": config.get("engineVersion"),
        "generator": REL(os.path.join(HERE, "metrics251_config.py")),
        "note": ("GENERATED. Do not edit by hand. Run `npm run config:metrics251` "
                 "(python scripts/metrics251_config.py) after editing config/metrics/2.5.1.json. "
                 "configHash = sha256 of config/metrics/2.5.1.canonical.json bytes "
                 "(compact, key-sorted, UTF-8)."),
        "source": REL(CONFIG_PATH),
    }


def lock_text(lock):
    # 결정적: 키 정렬 + indent 2 + LF + 후행 개행 1개.
    return json.dumps(lock, ensure_ascii=False, sort_keys=True, indent=2) + "\n"


def validate(config, schema):
    """스키마 + 데이터 전용 가드. 오류 문자열 리스트를 반환(비면 유효)."""
    errors = list(validate_against_schema(config, schema))
    for path, value, bad in find_expression_strings(config):
        errors.append(f"{path}: 실행 표현식 문자열 금지(데이터 전용) — {value!r} 에 {bad}")
    return errors


def generate(write=True):
    config = _read_config()
    schema = _read_schema()
    errors = validate(config, schema)
    if errors:
        return config, None, None, errors
    cbytes = canonical_bytes(config)
    lock = build_lock(config, cbytes)
    if write:
        # canonical.json 은 canonical 바이트 그대로(개행 없음 — compact JSON 은 개행을 포함하지 않음).
        with open(CANONICAL_PATH, "wb") as f:
            f.write(cbytes)
        with open(LOCK_PATH, "w", encoding="utf-8", newline="\n") as f:
            f.write(lock_text(lock))
    return config, cbytes, lock, []


def check():
    """검증 + 생성물 최신성 게이트. (ok, messages) 반환. ok=False 면 exit 1."""
    msgs = []
    config = _read_config()
    schema = _read_schema()
    errors = validate(config, schema)
    if errors:
        return False, ["설정 검증 실패:"] + [f"  - {e}" for e in errors]

    cbytes = canonical_bytes(config)
    lock = build_lock(config, cbytes)

    # 생성물 최신성 — canonical.json 바이트 정확히 일치.
    if not os.path.exists(CANONICAL_PATH):
        return False, [f"{REL(CANONICAL_PATH)} 없음 — 생성기 실행 필요(python scripts/metrics251_config.py)"]
    on_disk = open(CANONICAL_PATH, "rb").read()
    if on_disk != cbytes:
        return False, [f"{REL(CANONICAL_PATH)} 가 stale/편집됨 — 재생성 필요(생성물 직접 수정 금지)"]

    if not os.path.exists(LOCK_PATH):
        return False, [f"{REL(LOCK_PATH)} 없음 — 생성기 실행 필요"]
    on_disk_lock = open(LOCK_PATH, encoding="utf-8-sig").read().replace("\r\n", "\n")
    if on_disk_lock != lock_text(lock):
        return False, [f"{REL(LOCK_PATH)} 가 stale/편집됨 — 재생성 필요(생성물 직접 수정 금지)"]

    msgs.append(f"[PASS] metrics251_config 검증+최신성 통과 · engineVersion "
                f"{config.get('engineVersion')} · configHash {lock['configHash'][:12]}… "
                f"· canonical {lock['canonicalByteLength']}B")
    return True, msgs


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Metrics 2.5.1 shadow config boundary + canonical hash (data-only, deterministic).")
    ap.add_argument("--check", action="store_true",
                    help="검증 + 생성물 최신성 게이트만(파일 미기록). stale/편집/무효 시 exit 1")
    ap.add_argument("--print-hash", action="store_true", help="configHash 만 stdout 으로 출력")
    ap.add_argument("--no-write", action="store_true", help="검증만 하고 생성물을 쓰지 않음")
    args = ap.parse_args(argv)

    if args.print_hash:
        config = _read_config()
        errors = validate(config, _read_schema())
        if errors:
            print("metrics251_config: 설정 무효 — --check 로 확인", file=sys.stderr)
            return 1
        print(config_hash(config))
        return 0

    if args.check:
        ok, msgs = check()
        for m in msgs:
            print(m)
        return 0 if ok else 1

    # 기본: 생성물 재생성 + 요약.
    config, cbytes, lock, errors = generate(write=not args.no_write)
    if errors:
        print("metrics251_config: 설정 검증 실패:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1
    action = "검증(미기록)" if args.no_write else "재생성"
    print(f"metrics251_config: {action} 완료 · engineVersion {config.get('engineVersion')} · "
          f"configHash {lock['configHash'][:12]}… · canonical {lock['canonicalByteLength']}B · "
          f"{REL(CANONICAL_PATH)} + {REL(LOCK_PATH)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
