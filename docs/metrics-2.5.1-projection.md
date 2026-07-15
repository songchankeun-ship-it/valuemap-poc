# Metrics 2.5.1 — 의미 상태·공개 후보 projection (Slice I)

> 상태: **로컬 shadow 계약**. 공개 적용 **미승인**. 공개 정본 **Metrics 2.4 유지**.
> 이 문서는 사람 설명용이며, 적합성 증거는 `scripts/test_metrics251_projection.py`(게이트)다
> (설계서 §M251-D09 — 문서 생성만으로 적합성을 주장하지 않는다).

설계 근거: `docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md` §M251-D06, §10 Slice I.
원안 티켓: ORN-2505(의미 상태), ORN-2506(거래활성도).

## 1. 무엇을 만들었나

저장된 후보 스냅샷(`metrics251_engine` 출력, `metrics251_snapshot_store` 봉인)을 입력으로,
안정적 **의미 enum + 문구(copy) key**를 붙인 언어 중립 projection DTO를 만든다.

- 모듈: `scripts/metrics251_projection.py` (순수·결정적·표준 라이브러리 전용)
- DTO 스키마: `config/metrics/2.5.1.projection.schema.json`
- 문구 레지스트리(한/영): `config/metrics/2.5.1.copy.json`
- 게이트: `scripts/test_metrics251_projection.py` (`npm run test:metrics251-projection`)

**입력은 저장된 raw/score/reason이다** — TypeScript/재계산 산식이 아니다. projection은
가격·거래량 배열을 받으면 거부하고, 점수를 다시 계산하지 않으며, 어떤 공개 라우트·컴포넌트에도
연결되지 않는다.

## 2. 기존 작업 재사용 감사(설계서 §10 Slice I "재사용 감사")

| 기존 자산 | 계약 일치? | 결론 |
|---|---|---|
| `src/lib/momentumRegime.ts` `MomentumRegimeKey`(strengthening/longUpShortDown/…) | **불일치** | 다-기간 regime은 1·3·6개월 개별 수익률(shortDir/midDir/longDir)이 필요. 저장 스냅샷은 단일 **블렌디드** 모멘텀 원시값만 담는다 → 재사용 불가. 단일 원시값의 **방향(UP/FLAT/DOWN)**만 정직히 표시하고, "다-기간 regime 아님"을 `denies`로 명시. flat 경계는 `config.semanticRules.directionFlatThresholdPct` 재사용. |
| `config.semanticRules.activityStates`(VERY_LOW…SURGE) | **일치** | Slice B가 이미 데이터로 둔 임계를 단일 출처로 재사용(비율 raw → state). |
| `config.semanticRules.riskEfficiencyBands`(LOW/NEUTRAL/HIGH) | **일치** | 저장된 백분위 점수 → band 재사용. |
| `config.metrics.riskAdjusted.fixedAnnualHurdleRate`(0.035) | **일치** | 3.5%는 이 명명 필드로만 읽는다(하드코딩·"최신 무위험수익률" 금지). |
| 공시 direction 언어(`disclosure-signals.ts` 긍정/부정/확인, 비-조언) | 범위 밖 | 저장 스냅샷에 공시가 없어 projection 대상 아님. 기존 비-조언 계약은 그대로 보존(중복·재작성 없음). |

새 임계를 창작하지 않았다. 새 한/영 공개 문구는 `src/lib/copy/*`를 중복하지 않고, shadow 후보
상태·명명·부인만 레지스트리에 담았다.

## 3. 명칭·부인(설계서 §M251-D06)

- **거래활성도 = 거래량 활동(volume activity)** · 5일/20일 거래량 비율.
  부인(구조적 `deniedMeanings` + 문구): 가격 방향, 매수·매도 주체, 유동성·자금유입·매수세를
  뜻하지 않는다.
- **위험조정 = 고정 기준수익률 3.5% 대비 과거 수익-변동성 효율.**
  `hurdleRate=0.035`는 config에서만 읽는다. 부인: 안전 아님, 향후 수익 보장 아님,
  최신·현재 무위험수익률 아님.
  - **band**(상대): 유니버스 백분위 점수 → LOW/NEUTRAL/HIGH.
  - **hurdleRelation**(절대): 저장 원시값 부호 → ABOVE/AT/BELOW. band와 hurdle은 별개다.

## 4. 의미 enum·문구 key 목록

| 도메인 | state enum | copyKey 접두사 |
|---|---|---|
| momentum 방향 | UP / FLAT / DOWN / UNAVAILABLE | `momentum.direction.*` |
| volumeActivity | VERY_LOW / DECREASED / NORMAL / INCREASED / SIGNIFICANT_INCREASE / SURGE / UNAVAILABLE | `volumeActivity.state.*` |
| value | PRESENT / UNAVAILABLE | `value.state.*` |
| riskEfficiency band | LOW / NEUTRAL / HIGH / UNAVAILABLE | `riskEfficiency.band.*` |
| riskEfficiency hurdle | ABOVE / AT / BELOW / UNAVAILABLE | `riskEfficiency.hurdle.*` |
| composite | ELIGIBLE / WITHHELD | `composite.state.*` |

모든 copyKey는 `config/metrics/2.5.1.copy.json`의 `stateCopy`에 한/영 문자열로 존재한다
(게이트가 강제: emit된 key 존재, ko/en 비어있지 않음·서로 다름, U+FFFD 0).

## 5. 골든 fixture(10종목) projection 결과 — 회귀 가드

`scripts/fixtures/metrics251/golden_snapshot.json` 저장 스냅샷 → projection:

| ticker | composite | momentum | volumeActivity | value | risk band / hurdle |
|---|---|---|---|---|---|
| A_RISE | ELIGIBLE | UP | NORMAL | PRESENT | NEUTRAL / ABOVE |
| B_SURGE | ELIGIBLE | UP | SIGNIFICANT_INCREASE | PRESENT | NEUTRAL / ABOVE |
| C_FALL | ELIGIBLE | DOWN | DECREASED | PRESENT | LOW / BELOW |
| D_FLAT | ELIGIBLE | UP | NORMAL | PRESENT | HIGH / ABOVE |
| E_RISE3 | ELIGIBLE | UP | NORMAL | PRESENT | **LOW / ABOVE** |
| F_NOPER | WITHHELD | UP | NORMAL | UNAVAILABLE | NEUTRAL / ABOVE |
| G_NEGPER | WITHHELD | UP | NORMAL | UNAVAILABLE | NEUTRAL / ABOVE |
| H_SHORT | WITHHELD | UP | NORMAL | PRESENT | UNAVAILABLE / UNAVAILABLE |
| I_SHORTVOL | WITHHELD | UP | UNAVAILABLE | PRESENT | NEUTRAL / ABOVE |
| J_CONST | WITHHELD | FLAT | NORMAL | PRESENT | UNAVAILABLE / UNAVAILABLE |

- **E_RISE3**(LOW band + ABOVE hurdle): 상대 백분위는 하위이나 저장 원시값은 양수 →
  band(상대)와 hurdle(절대)이 별개임을 보여주는 부호-안전 사례.
- **C_FALL**: 음수 모멘텀 원시값 → DOWN(절대 UP 아님) · 음수 위험 원시값 → BELOW.
- **F/G/H/I/J**: 결측 factor는 UNAVAILABLE + 사유 보존(50/평균/중립 대체 없음), 종합은 WITHHELD.

## 6. 불변식(무변경 증거)

`public/data`·`stocks.json`·Metrics 2.4 산출물·`metricsVersion 2.4`·유니버스 138·공개 라우트·
SEO·auth/Supabase/RLS·cron·의존성 무변경. projection은 `src/` 어디서도 import되지 않으며(Python),
`public/`·공개 API·공개 pointer를 만들지 않는다 → 런타임/공개/UI 계약 불변.

## 7. 이 slice가 하지 않은 것(경계)

- 공개 라우트·컴포넌트 연결(설계서 §10 Slice I 금지). TypeScript 계약 reader·재계산 차단 검사는
  **Slice J**.
- 실제 5일 연속 shadow 실행·5일 AND 게이트는 **Slice K**.
- 공개 전환은 어떤 것도 하지 않는다(설계서 §4, Gate 6 별도 승인).
