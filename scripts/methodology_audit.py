#!/usr/bin/env python3
# 방법론 감사 (Methodology audit) — 현재 스냅샷(public/data/stocks.json)의 지표 구조를
# 단면(cross-sectional)으로 분석한다. 성과 검증(백테스트)이 아니라, 등가중 종합 점수가
# 어떤 지표에 얼마나 좌우되는지·지표 간 상관·가중치 대안·단일지표 제거(ablation)를 본다.
#
# 중요 — 이 감사는 "현재 종합 점수를 검증"하지 않는다:
#   * 미래수익(forward-return)·거래비용·회전율·신뢰구간·업종중립·아웃오브샘플 증거는
#     단일 시점 스냅샷만으로 산출할 수 없으므로 절대 현재 데이터로 대체하지 않고
#     unavailable 로 명시한다(fail-closed).
#   * 상관·기여·ablation 은 모두 cross-sectional(단면)로 라벨링한다 = 시계열 성과가 아님.
#
# 결정성(deterministic): 입력 스냅샷이 같으면 출력 JSON/MD 도 바이트 단위로 동일하다.
# 벽시계 시각을 쓰지 않고, 스냅샷 메타(asOfBusinessDate·metricsVersion)만 기록한다.
# numpy 등 외부 의존성을 추가하지 않고 순수 파이썬으로 계산한다.
#
# Usage:
#   $env:PYTHONUTF8='1'; python scripts/methodology_audit.py            # docs/methodology-audit.md 재생성 + 요약 출력
#   python scripts/methodology_audit.py --json                          # 결정적 JSON 을 stdout 으로
#   python scripts/methodology_audit.py --out docs/methodology-audit.md # 경로 지정 재생성
import json
import os
import sys
import argparse

HERE = os.path.dirname(os.path.abspath(__file__))
STOCKS_PATH = os.path.join(HERE, "..", "public", "data", "stocks.json")
DEFAULT_OUT = os.path.join(HERE, "..", "docs", "methodology-audit.md")

# 등가중 종합 점수를 구성하는 4개 지표(= compute_metrics / verify_metrics 와 동일 정의).
METRICS = ["momentum", "flow", "value", "volScore"]
METRIC_LABELS_KO = {
    "momentum": "추세(모멘텀)",
    "flow": "거래활성도",
    "value": "밸류",
    "volScore": "변동성조정",
}

# 단면 스냅샷만으로는 만들 수 없는 성과 증거 — 절대 현재 데이터로 대체하지 않는다(fail-closed).
UNAVAILABLE_EVIDENCE = {
    "forwardReturn": "다음 구간 수익률 스냅샷이 없어 산출 불가. 현재 returns 를 미래수익으로 대체하지 않는다.",
    "transactionCost": "체결·수수료·슬리피지 모델과 매매 시점 데이터가 없어 산출 불가.",
    "turnover": "시점별 편입/편출(리밸런싱) 시계열이 없어 회전율 산출 불가.",
    "confidenceInterval": "반복·시점 표본이 없어 표준오차/신뢰구간 산출 불가.",
    "sectorNeutral": "업종중립 성과는 시점별 업종 수익률·노출이 필요해 단면으로 산출 불가.",
    "outOfSample": "학습/검증 분리를 위한 별도 시점(out-of-sample) 스냅샷이 없어 산출 불가.",
}


def _r(x, digits=6):
    """결정적 반올림 — float 표현 흔들림 방지."""
    return round(float(x), digits)


def load_snapshot(path=STOCKS_PATH):
    d = json.load(open(path, encoding="utf-8-sig"))
    stocks = d.get("stocks", [])
    rows = []
    excluded = 0
    for s in stocks:
        vals = {k: s.get(k) for k in METRICS}
        if any(not isinstance(v, (int, float)) for v in vals.values()):
            excluded += 1
            continue
        rows.append({"ticker": str(s.get("ticker")), **{k: float(vals[k]) for k in METRICS}})
    # 티커로 정렬해 입력 순서와 무관하게 결정적.
    rows.sort(key=lambda r: r["ticker"])
    meta = {
        "snapshotAsOf": d.get("asOfBusinessDate"),
        "metricsVersion": d.get("metricsVersion"),
        "source": d.get("source"),
        "universeCount": len(rows),
        "excludedIncomplete": excluded,
    }
    return meta, rows


def mean(xs):
    return sum(xs) / len(xs) if xs else 0.0


def pearson(xs, ys):
    n = len(xs)
    if n < 2:
        return 0.0
    mx, my = mean(xs), mean(ys)
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    dx = sum((x - mx) ** 2 for x in xs) ** 0.5
    dy = sum((y - my) ** 2 for y in ys) ** 0.5
    if dx == 0 or dy == 0:
        return 0.0
    return num / (dx * dy)


def rank_avg(xs):
    """평균 순위(동점 처리) — Spearman 용."""
    order = sorted(range(len(xs)), key=lambda i: xs[i])
    ranks = [0.0] * len(xs)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and xs[order[j + 1]] == xs[order[i]]:
            j += 1
        avg = (i + j) / 2.0 + 1.0  # 1-based 평균 순위
        for k in range(i, j + 1):
            ranks[order[k]] = avg
        i = j + 1
    return ranks


def spearman(xs, ys):
    return pearson(rank_avg(xs), rank_avg(ys))


def composite(row, weights):
    return sum(weights[k] * row[k] for k in METRICS)


def ranking(rows, weights):
    """가중치로 정렬한 티커 순서(내림차순). 동점은 티커 오름차순으로 결정적 처리."""
    scored = [(composite(r, weights), r["ticker"]) for r in rows]
    scored.sort(key=lambda t: (-t[0], t[1]))
    return [tk for _, tk in scored]


def top_overlap(rank_a, rank_b, n):
    a = set(rank_a[:n])
    b = set(rank_b[:n])
    inter = len(a & b)
    return {"n": n, "overlap": inter, "of": min(n, len(rank_a)), "jaccard": _r(inter / len(a | b)) if (a | b) else 0.0}


def spearman_of_rankings(rank_a, rank_b):
    """두 순위(티커 리스트)의 Spearman = 각 티커 순위 위치 간 상관."""
    pos_a = {tk: i for i, tk in enumerate(rank_a)}
    pos_b = {tk: i for i, tk in enumerate(rank_b)}
    tickers = sorted(pos_a.keys())
    return pearson([pos_a[t] for t in tickers], [pos_b[t] for t in tickers])


def build_report(meta, rows):
    cols = {k: [r[k] for r in rows] for k in METRICS}
    equal = {k: 1.0 for k in METRICS}
    base_rank = ranking(rows, equal)
    comp_vals = [composite(r, equal) for r in rows]
    top_n = min(20, len(rows))

    # 1) 상관행렬 (단면) — Pearson·Spearman.
    corr_p = {a: {b: _r(pearson(cols[a], cols[b])) for b in METRICS} for a in METRICS}
    corr_s = {a: {b: _r(spearman(cols[a], cols[b])) for b in METRICS} for a in METRICS}

    # 2) 기여도 — 등가중이라도 분산이 큰 지표가 순위를 더 좌우한다.
    def _variance(xs):
        mu = mean(xs)
        return sum((x - mu) ** 2 for x in xs) / len(xs)
    var = {k: _r(_variance(cols[k])) for k in METRICS}
    var_total = sum(var.values()) or 1.0
    variance_share = {k: _r(var[k] / var_total) for k in METRICS}
    corr_with_comp = {k: _r(pearson(cols[k], comp_vals)) for k in METRICS}

    # 3) 등가중 대안 — 한 지표에 2배 가중을 줬을 때 순위가 얼마나 바뀌나(등가중 선택의 민감도).
    alternatives = []
    for k in METRICS:
        w = {m: (2.0 if m == k else 1.0) for m in METRICS}
        alt_rank = ranking(rows, w)
        alternatives.append({
            "label": f"2x {k}",
            "weights": {m: _r(w[m]) for m in METRICS},
            "spearmanVsEqual": _r(spearman_of_rankings(base_rank, alt_rank)),
            "topOverlap": top_overlap(base_rank, alt_rank, top_n),
        })

    # 4) 단일지표 제거(ablation) — 한 지표를 빼고 3지표 등가중으로 재계산한 순위 변화.
    ablation = []
    for k in METRICS:
        w = {m: (0.0 if m == k else 1.0) for m in METRICS}
        abl_rank = ranking(rows, w)
        changed = sum(1 for i, tk in enumerate(base_rank) if abl_rank[i] != tk)
        ablation.append({
            "dropped": k,
            "spearmanVsFull": _r(spearman_of_rankings(base_rank, abl_rank)),
            "topOverlap": top_overlap(base_rank, abl_rank, top_n),
            "rankPositionsChanged": changed,
        })

    return {
        "meta": {
            **meta,
            "analysisType": "cross-sectional",
            "note": "단면(cross-sectional) 지표 구조 분석 — 현재 종합 점수의 성과 검증이 아님.",
            "metrics": METRICS,
            "compositeDefinition": "compositeScore = mean(momentum, flow, value, volScore) (등가중).",
            "topN": top_n,
        },
        "correlation": {"pearson": corr_p, "spearman": corr_s},
        "contribution": {"varianceShare": variance_share, "corrWithComposite": corr_with_comp},
        "equalWeightAlternatives": alternatives,
        "oneMetricAblation": ablation,
        "unavailableEvidence": {
            k: {"available": False, "substitutedWithCurrentData": False, "reason": v}
            for k, v in UNAVAILABLE_EVIDENCE.items()
        },
    }


def render_markdown(report):
    m = report["meta"]
    lines = []
    lines.append("# 방법론 감사 — 단면(cross-sectional) 지표 구조")
    lines.append("")
    lines.append("> 이 문서는 `scripts/methodology_audit.py` 가 현재 스냅샷에서 **결정적으로 재생성**합니다.")
    lines.append("> 손으로 수정하지 마세요. 스냅샷이 같으면 출력도 동일합니다.")
    lines.append("")
    lines.append("**이 감사는 현재 종합 점수를 검증하지 않습니다.** 단일 시점 스냅샷의 지표 구조"
                 "(상관·기여·가중 대안·단일지표 제거)를 볼 뿐, 성과(백테스트)가 아닙니다.")
    lines.append("")
    lines.append(f"- 스냅샷 기준일: `{m.get('snapshotAsOf')}` · 지표 버전: `{m.get('metricsVersion')}`")
    lines.append(f"- 분석 유니버스: {m.get('universeCount')}종목 (지표 결측 제외 {m.get('excludedIncomplete')}종목)")
    lines.append(f"- 종합 점수 정의: {m.get('compositeDefinition')}")
    lines.append(f"- 분석 유형: **{m.get('analysisType')}** (단면)")
    lines.append("")

    lines.append("## 1. 지표 간 상관 (Pearson)")
    lines.append("")
    header = "| 지표 | " + " | ".join(METRICS) + " |"
    lines.append(header)
    lines.append("|" + "---|" * (len(METRICS) + 1))
    for a in METRICS:
        row = [f"{report['correlation']['pearson'][a][b]:+.3f}" for b in METRICS]
        lines.append(f"| {a} | " + " | ".join(row) + " |")
    lines.append("")
    lines.append("(Spearman 순위상관은 JSON 출력 `correlation.spearman` 참조.)")
    lines.append("")

    lines.append("## 2. 종합 점수 기여도")
    lines.append("")
    lines.append("등가중이라도 분산이 큰 지표가 순위를 더 좌우합니다.")
    lines.append("")
    lines.append("| 지표 | 분산 비중 | 종합과의 상관 |")
    lines.append("|---|---|---|")
    for k in METRICS:
        vs = report["contribution"]["varianceShare"][k]
        cc = report["contribution"]["corrWithComposite"][k]
        lines.append(f"| {k} ({METRIC_LABELS_KO[k]}) | {vs:.3f} | {cc:+.3f} |")
    lines.append("")

    lines.append("## 3. 등가중 대안 (2배 가중 민감도)")
    lines.append("")
    lines.append(f"등가중 순위와, 한 지표에 2배 가중을 준 순위의 일치도 (상위 {m.get('topN')}종목 겹침).")
    lines.append("")
    lines.append("| 대안 | Spearman(vs 등가중) | 상위 겹침 |")
    lines.append("|---|---|---|")
    for alt in report["equalWeightAlternatives"]:
        ov = alt["topOverlap"]
        lines.append(f"| {alt['label']} | {alt['spearmanVsEqual']:+.3f} | {ov['overlap']}/{ov['of']} |")
    lines.append("")

    lines.append("## 4. 단일지표 제거 (ablation)")
    lines.append("")
    lines.append("한 지표를 빼고 3지표 등가중으로 재계산했을 때의 순위 변화.")
    lines.append("")
    lines.append("| 제거 지표 | Spearman(vs 전체) | 상위 겹침 | 순위 이동 종목 |")
    lines.append("|---|---|---|---|")
    for ab in report["oneMetricAblation"]:
        ov = ab["topOverlap"]
        lines.append(f"| {ab['dropped']} ({METRIC_LABELS_KO[ab['dropped']]}) | {ab['spearmanVsFull']:+.3f} | {ov['overlap']}/{ov['of']} | {ab['rankPositionsChanged']} |")
    lines.append("")

    lines.append("## 5. 산출 불가 증거 (present data 로 만들 수 없음)")
    lines.append("")
    lines.append("아래 값은 단일 시점 스냅샷만으로 산출할 수 없어 **표시하지 않으며, 현재 데이터로 대체하지 않습니다.**")
    lines.append("")
    lines.append("| 증거 | 상태 | 사유 |")
    lines.append("|---|---|---|")
    for k, v in report["unavailableEvidence"].items():
        lines.append(f"| {k} | unavailable | {v['reason']} |")
    lines.append("")
    return "\n".join(lines) + "\n"


def main(argv=None):
    ap = argparse.ArgumentParser(description="Cross-sectional methodology audit (deterministic).")
    ap.add_argument("--json", action="store_true", help="결정적 JSON 을 stdout 으로 출력")
    ap.add_argument("--out", default=DEFAULT_OUT, help="Markdown 리포트 출력 경로")
    ap.add_argument("--no-write", action="store_true", help="파일을 쓰지 않고 요약만 출력")
    args = ap.parse_args(argv)

    meta, rows = load_snapshot()
    if not rows:
        print("methodology_audit: 분석할 종목이 없습니다(지표 결측).", file=sys.stderr)
        return 1
    report = build_report(meta, rows)

    if args.json:
        # 결정적 직렬화 — 키 정렬 + 고정 구분자.
        print(json.dumps(report, ensure_ascii=False, sort_keys=True, indent=2))
        return 0

    md = render_markdown(report)
    if not args.no_write:
        with open(args.out, "w", encoding="utf-8", newline="\n") as f:
            f.write(md)
        print(f"methodology_audit: {os.path.relpath(args.out, os.path.join(HERE, '..'))} 재생성 완료 "
              f"({meta['universeCount']}종목, 스냅샷 {meta['snapshotAsOf']}).")
    else:
        sys.stdout.write(md)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
