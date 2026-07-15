# Metrics 2.5.1 역사/차등 검증 하네스 (Slice H)

> 이 문서는 `scripts/metrics251_replay.py` 가 로컬 가격 데이터에서 **결정적으로 재생성**합니다.
> 손으로 수정하지 마세요. 같은 데이터면 JSON/Markdown 출력이 바이트 단위로 동일합니다.

**신뢰성 회귀 증거입니다 — 투자성과 백테스트가 아닙니다.** 가격·거래량 의존 factor(모멘텀·거래활성도·위험조정)만 point-in-time 창으로 재실행해 2.4 정본 산식과 2.5.1 shadow 엔진의 차이를 분류합니다. 밸류·종합은 시점별 재무가 없어 봉쇄합니다(§M251-D03) — 현재 재무를 과거 날짜에 복사해 성과처럼 표현하지 않습니다.

- 엔진 버전: `2.5.1` · 분석 시장일: **252** (요청 252) · 유니버스: 138종목 · lookback 상한: 253
- 데이터셋 SHA-256(points 만): `7ae4b380540182546da733991ad1b42f7353c554b05e1661798b41b5d2111c2b`
- 목적: reliability-regression (determinism/boundary/stability), NOT investment-performance backtest

## 0. 판정

- **P0 불일치: 0건** — clean ✅
- 최소 시장일 충족(≥252 또는 가용 전량): 예

> P0 는 두 방식 모두 유효한데 **동일 창의 원시값**이 허용오차를 넘어 불일치하는 경우입니다(설명 불가한 신뢰성 결함). 백분위 방식·반올림·최소 이력 임계 같은 문서화된 차이는 P0 가 아니라 INTENDED_METHOD_CHANGE 입니다.

## 1. factor별 차등 분류

| factor | AGREE | INTENDED | DATA_QUALITY | UNAVAILABLE | P0 |
|---|---:|---:|---:|---:|---:|
| momentum | 0 | 34776 | 0 | 0 | 0 |
| activity | 34776 | 0 | 0 | 0 | 0 |
| riskAdjusted | 0 | 34776 | 0 | 0 | 0 |

- momentum INTENDED 세부: `PERCENTILE_METHOD`=34776
- riskAdjusted INTENDED 세부: `PERCENTILE_METHOD`=34776

## 2. 원시값 동치(신뢰성 핵심 주장)

- 비교 가능 쌍(양쪽 유효 + P0): **104328**
- 원시값 동치 확인 쌍: **104328** · P0(원시 불일치): **0**

> comparablePairs = 양쪽 유효(AGREE+INTENDED) + P0. 양쪽 유효인데 원시값이 허용오차를 넘으면 P0 로만 분류된다 — rawAgreePairs 는 원시 동치가 확인된 쌍.

## 3. 데이터 품질 발견(제외가 아니라 품질 관측 — §M251-D06)

- (없음)

## 4. point-in-time 재무 가드

- 밸류 비교: `UNAVAILABLE_COMPARISON` · 종합 비교: `UNAVAILABLE_COMPARISON` · 사유: `NO_POINT_IN_TIME_FUNDAMENTALS` · 산출: False
> 역사 밸류·종합 성과는 산출·주장하지 않는다. 현재-날짜 밸류 영향은 Slice A 기준선 소관.

## 5. P0 불일치 목록

- **P0 불일치 없음.** 2.5.1 엔진이 2.4 정본 factor 원시값을 재현하며, 점수 차이는 전부 문서화된 방법 차이·데이터 품질·비교 불가로 귀속됨.

