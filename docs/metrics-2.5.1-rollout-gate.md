# Metrics 2.5.1 shadow 운영 보고서 · 롤아웃 게이트 (Slice K)

> 이 문서는 `scripts/metrics251_rollout_gate.py` 가 비공개 shadow 저장소(또는 fixture)에서 **결정적으로 재생성**합니다. 손으로 수정하지 마세요.

**로컬 준비 상태 요약이며 공개 전환 승인이 아닙니다(§7 Gate 6).** 공개 Metrics 2.4 정본은 불변입니다. 롤아웃 후보는 §M251-D02 의 5일 AND 게이트를 만족할 때만 true 입니다.

- 엔진 버전: `2.5.1` · 생성 출처: `shadow-store` · 요구 연속일: **5**
- 거래일 캘린더: 미제공 — 연속성 확정 불가(모든 run CALENDAR_UNCOVERED)

## 0. 게이트 판정

- **상태: PENDING ⏳** · rolloutCandidate: **false**
- 실제 run: **0** (요구 5) · 후행 연속 통과: **0** · 최대 연속: 0
- 창 4-zero 조건: 미해결P0=0 ✅ · 소스일불일치=0 ✅ · 미지제외사유=0 ✅ · 공개경로누출=0 ✅
- 차단 사유: `INSUFFICIENT_REAL_RUNS`

> 실제 shadow run 이 5개 미만입니다. 증거를 합성하지 않고 **PENDING** 으로 둡니다(작업 지시: report pending rather than synthesizing evidence).

## 1. 연속성

- 관측 시장일: 0개
- 연속성 끊김: 없음

## 2. 집계

- 통과 run: 0 · 실패 run: 0

## 3. 실행별 요약

_기록된 shadow run 이 없습니다._

보고서 canonical SHA-256: `2dee648a5636bb8ed8863c02d61011a9a7242adea7a2b2364552e6f267e5537f`
