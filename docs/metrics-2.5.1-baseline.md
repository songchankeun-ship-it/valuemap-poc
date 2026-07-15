# Metrics 2.5.1 기준선 영향 분석 (Slice A)

> 이 문서는 `scripts/metrics251_baseline.py` 가 공개 스냅샷에서 **결정적으로 재생성**합니다.
> 손으로 수정하지 마세요. 같은 스냅샷이면 JSON/Markdown 출력이 바이트 단위로 동일합니다.

**읽기 전용 기준선입니다.** 새 Metrics 2.5 점수를 계산하거나 게시하지 않고, 결측을 50 또는 다른 factor 평균으로 채우지 않습니다. 공개 Metrics 2.4 는 그대로 정본입니다.

- 스냅샷 기준일: `20260714` · 지표 버전: `2.4` · 소스: `FDR + Naver + yfinance`
- 유니버스: 138종목 (선언 count `138`)
- 입력 SHA-256: `dbe3fb1b23febb0d8635f8d04e700d2a6d144501225d55ffd570d7603245d463`
- 입력 파일: `public/data/stocks.json` (미수정)

## 1. PER / PBR 양수·결측·비양수

| 항목 | 양수(>0) | 결측 | 비양수(≤0) |
|---|---:|---:|---:|
| PER | 137 | 1 | 0 |
| PBR | 137 | 1 | 0 |

- PER·PBR 모두 양수: **137** / 138
- 양수 규칙(`per>0 AND pbr>0 (설계서 §3.3 / calc_value 조건과 동일).`)으로 밸류 제외: **1**
- PER 결측 티커: `088980`
- PBR 결측 티커: `088980`

## 2. valueNA / fallback 노출

- 현재 `valueNA=true` (밸류 결측을 factor 평균으로 재가중): **1**
  - 티커: `088980`
- realStocks 비-숫자 50-fallback 현재 트리거 수(factor별): momentum=0, activity=0, value=0, riskAdjusted=0
- compositeScore 50-fallback 현재 트리거 수: 0

> valueNA=true 는 현재 파이프라인이 밸류 결측을 나머지 factor 평균으로 재가중해 숫자로 저장했음을 뜻한다. 그래서 realStocks 의 비-숫자 50-fallback 은 현재 0 회 트리거되지만(파이썬이 미리 채움), 2.5.1 은 이런 대체를 금지한다.

## 3. factor 별 관측 availability

| factor | 저장 숫자 | 뒷받침 근거 | 근거 필드 |
|---|---:|---:|---|
| momentum (추세(모멘텀)) | 138 | 138 | `returns.r1m/r3m/r6m` |
| activity (거래활성도) | 138 | 138 | `flowStats.ratio` |
| value (밸류) | 138 | 137 | `per>0 AND pbr>0` |
| riskAdjusted (위험조정) | 138 | 138 | `volStats.sharpe` |

- 위험조정 관측 이력 ≥252 시장일: 138

> 파이썬 엔진이 결측을 미리 채우므로 '저장 숫자'는 진짜 유효성을 과대평가할 수 있습니다. 그래서 원시 근거(returns·ratio·sharpe·PER·PBR)도 함께 셉니다.

## 4. 순위 자격(rankingEligible) 후보 커버리지

- 네 factor 근거가 모두 유효한 교집합 후보: **137** / 138 (**99.28%**)
- 제외: **1** · binding factor: `value`
- 제외 티커: `088980`
- 제외 사유 카운트: `VALUE_MISSING_INPUT`=1

> 관측 근거 기반 후보. 실제 2.5.1 rankingEligible 은 shadow 엔진(Slice D/E)이 확정한다. 여기서는 새 점수를 계산하지 않는다.

## 5. 시장별 제외 분포 (data permits)

| 시장 | 전체 | 순위 후보 제외 |
|---|---:|---:|
| KOSDAQ | 16 | 0 |
| KOSDAQ GLOBAL | 14 | 0 |
| KOSPI | 108 | 1 |

## 6. 극단값 카운트·예시

설계서 §M251-D04 — 양수이지만 높은 값은 **경고(QUALITY_WARNING)**이며 제외가 아닙니다. 임의 상한으로 자르지 않고 소스 검증은 사람 검수(오너 게이트)로 남깁니다.

| 조건 | 종목 수 | 예시 티커 |
|---|---:|---|
| PER > 100 | 24 | `000150`(220.26), `003670`(968.71), `009420`(659.6), `010140`(155.7), `011170`(254.43), `020150`(172.76), `034020`(183.04), `035720`(306.86), `037560`(102.0), `066970`(180.38), `079160`(3441.0), `086520`(336.78), … (+12) |
| PER > 500 | 8 | `003670`(968.71), `009420`(659.6), `079160`(3441.0), `293490`(17124.0), `298380`(1547.0), `328130`(3830.0), `348370`(15519.0), `377300`(2624.66) |
| PBR > 20 | 2 | `196170`(35.24), `247540`(20.51) |
| 절대값 ROE > 100 | 5 | `066970`(201.94), `079160`(1122.71), `293490`(113.53), `298380`(116.18), `348370`(205.74) |

## 7. 현재 소스 계약 경로 (중복 계산 / fallback)

- 총 검사 21 · 발견 21 · 누락 0
- fallback 경로 16 · 중복 계산 경로 5

| id | 파일 | 종류 | 줄 | 설명 |
|---|---|---|---:|---|
| `py-composite-safe-avg` | `scripts/compute_metrics.py` | fallback | 172 | 종합점수를 safe_avg(default=50)로 계산 — 결측이 종합에 50 으로 스며드는 경로. |
| `py-flow-else-50` | `scripts/compute_metrics.py` | fallback | 134 | 거래활성도 계산 불가 시 50 대체. |
| `py-momentum-missing-50` | `scripts/compute_metrics.py` | fallback | 145 | 모멘텀 원시값 결측 시 백분위 대신 50.0 대체. |
| `py-safe-avg-default50` | `scripts/compute_metrics.py` | fallback | 100 | 종합 평균에서 결측 factor 를 50 으로 채우는 헬퍼(default=50). |
| `py-value-factor-average` | `scripts/compute_metrics.py` | fallback | 165 | 밸류 결측을 나머지 factor(추세·거래·위험조정) 평균으로 재가중(설계서 §4 금지 대상). |
| `py-vol-else-50` | `scripts/compute_metrics.py` | fallback | 129 | 위험조정 계산 불가 시 50 대체(백분위 재계산 전 임시). |
| `py-vol-missing-50` | `scripts/compute_metrics.py` | fallback | 155 | 샤프 원시값 결측 시 백분위 대신 50.0 대체. |
| `ts-duplicate-compositeScore` | `src/lib/metrics.ts` | duplicate-calculation | 121 | 종합점수를 TypeScript 에서 재계산(중복). |
| `ts-duplicate-flowScore` | `src/lib/metrics.ts` | duplicate-calculation | 66 | 거래활성도 점수를 TypeScript 에서 재계산(중복). |
| `ts-duplicate-momentumRaw` | `src/lib/metrics.ts` | duplicate-calculation | 44 | 모멘텀 원시값을 TypeScript 에서 재계산(파이썬 엔진과 중복). |
| `ts-duplicate-valueScore` | `src/lib/metrics.ts` | duplicate-calculation | 87 | 밸류 점수를 TypeScript 에서 재계산(중복). |
| `ts-duplicate-volScore` | `src/lib/metrics.ts` | duplicate-calculation | 100 | 위험조정 점수를 TypeScript 에서 재계산(중복). |
| `ts-metrics-flow-50` | `src/lib/metrics.ts` | fallback | 67 | 거래량 20일 미만이면 50 반환. |
| `ts-metrics-percentile-50` | `src/lib/metrics.ts` | fallback | 54 | 백분위 모집단이 비면 50 반환. |
| `ts-metrics-value-50` | `src/lib/metrics.ts` | fallback | 88 | 비양수 PER/PBR 또는 빈 모집단이면 밸류 50 반환(비양수를 중립 점수로 승격). |
| `ts-metrics-vol-60-50` | `src/lib/metrics.ts` | fallback | 102 | 종가 60개 미만이면 위험조정 50 반환. |
| `ts-realstocks-composite-50` | `src/lib/realStocks.ts` | fallback | 45 | 저장 compositeScore 가 없으면 50 대체. |
| `ts-realstocks-flow-50` | `src/lib/realStocks.ts` | fallback | 35 | 저장 flow 가 숫자가 아니면 50 대체. |
| `ts-realstocks-momentum-50` | `src/lib/realStocks.ts` | fallback | 34 | 저장 momentum 이 숫자가 아니면 50 대체. |
| `ts-realstocks-value-50` | `src/lib/realStocks.ts` | fallback | 36 | 저장 value 가 숫자가 아니면 50 대체. |
| `ts-realstocks-vol-50` | `src/lib/realStocks.ts` | fallback | 37 | 저장 volScore 가 숫자가 아니면 50 대체. |

> 리터럴 소스 계약 검사. found=false 는 해당 경로가 사라졌거나(개선) 파일이 바뀌었음을 뜻하며, 커밋된 리포트를 stale 로 만들어 재생성을 강제한다.

## 8. 확립 불가 필드 (unavailable)

아래 값은 단일 스냅샷만으로 확립할 수 없어 **표시하지 않으며, 현재 데이터로 대체하지 않습니다.**

| 필드 | 상태 | 사유 |
|---|---|---|
| sectorExclusionDistribution | unavailable | 업종(sector)은 src/lib/sector.ts 의 표시용 휴리스틱으로 themes 에서 파생되며 stocks.json 엔벨로프에 없다. 이 분석기에서 재현하면 계산 로직이 또 하나 생기므로(설계서 §M251-D01), 정식 sector 필드가 생기기 전까지 업종별 제외 분포는 unavailable. |
| pointInTimeHistory | unavailable | 지표별 252 시장일 재실행과 시점 일관 재무는 시점별 스냅샷이 필요하다(설계서 §M251-D03). 현재 단일 스냅샷으로는 확립 불가 — Slice H 하네스에서 다룬다. |

