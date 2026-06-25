<!-- AI-DEV-CENTER:PROJECT-HANDOFF:v1:BEGIN -->
# AI Handoff

Last updated: 2026-06-25T04:55:37.050Z
Project: OrnScore
Path: C:\Users\dongy\OneDrive\바탕 화면\valuemap-poc

## Operating Agreement

- Treat this file as the shared memory between Codex, Claude, GPT, the home PC, and the work PC.
- Read this file before changing code, and update it before ending a meaningful work session.
- Keep project-specific rules in `CLAUDE.md` and `AGENTS.md` pointed back to this handoff.
- Do not revert user or other-agent changes unless the user explicitly asks.
- Prefer small verified progress, clear next steps, and reproducible checks.

## Cross-PC Workflow

- Home PC runs AI Dev Center as the 24-hour control dashboard.
- Work PC should pull/sync the project, read this handoff, work, then push/sync and update this handoff.
- When switching AI tools because of usage limits, the next AI should continue from this file instead of relying on chat history.

## Last AI Center Event

- Task: 27 - OrnScore 디자인 리뉴얼 Phase 7 — 백테스트 KPI/차트/위험 안내 강화
- Run: 32
- Status: completed
- Agent: claude
- Note: Development and all quality gates completed.

## Next Agent Checklist

1. Inspect the current worktree before assuming prior state is complete.
2. Read any project-specific docs linked from this file.
3. Continue the highest-priority user goal with focused edits.
4. Run the relevant finite checks.
5. Update this handoff with what changed, what passed, and what remains.

## Manual Notes

Add stable human notes below this managed block or in separate docs. The AI Dev Center will update only the managed block between the markers.
<!-- AI-DEV-CENTER:PROJECT-HANDOFF:v1:END -->

## Manual Notes

### Task 33 — OrnScore 1차 상용화 안정화 P0-A — 금지표현 교체·공통 고지 3줄·Metrics 2.4 단일출처 (2026-06-25, Claude)
- Preview/branch: 리뷰 기준 **branch `ai-center/task-33-ornscore-1-p0-a-metrics`**(시작 `533c6d2`, 클린·예상 일치). 로컬 검증은 prod `127.0.0.1:**3257**`(운영자 3000/4310 무중단, 내 리스너 PID 21788만 종료). main 머지·외부 릴리스는 범위 외(운영자).
- 목표: 1차 상용화 안정화(신뢰도·문구 리스크·UI 기본기·검증). 점수 계산식·데이터 생성 무변경, 신규 npm 0·빌드 단계 추가 0.
- What changed:
  - **금지 표현 교체**(부정문 고지는 보존): `page.tsx`/`today/page.tsx` riskNote의 "진입 전/진입 시점"→"급등 사유 확인"·"비중·시점 분할", today 과열 caption·"신규 진입"→"신규 편입", `ScoreTooltip.tsx` "저평가 진입"→"저평가 국면", `metricReadings.ts` "따라 사기"·"진입 시점" 문구 교체. `terms/page.tsx`("수익 보장"은 "제공하지 않습니다" 법적 고지)·`metrics.ts`(코드 주석) 보존.
  - **공통 고지 3줄** 홈 `RiskNotice`에 정확 노출(투자 추천 아님 / 점수·신호는 참고 정보·매수·매도 추천 아님 / 최종 판단·책임은 사용자). 문구는 `dataStatus.notices.disclaimer` 배열 **단일 소스**에서 읽음. 과잉 반복 회피(푸터 1줄 고지가 전역 커버).
  - **Metrics 버전 단일 표기**: `universe/page.tsx` 산식 버전 셀 → `dataStatus.metricsVersionLabel`("Metrics 2.4"). 전 화면 포맷 통일.
  - **게이트 강화**: `verify_metrics.py` FORBIDDEN에 다어절 금지 토큰 12종 추가(급등 예상·강력 매수·목표가·손절가·단기 급등주·무료 급등주·매수 후보·AI 픽·AI 추천·오늘 살 종목·따라 사기·진입 시점). 단독 "진입"/"매수 추천"은 오탐 회피로 제외.
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·Metrics 2.4, exit 0) · `npm run build`(172라우트, exit 0) · 로컬 prod(3257) 검증 9라우트+`/compare`·`/universe` 200·서버 로그 에러 0. SSR: `/` 고지 3줄 정확, Metrics 2.4 6라우트 전수(2.3·"Metrics v" 0), 기준일 2026.06.24 일치, 11라우트 HTML 금지 토큰 grep 0("매수 추천"은 전부 부정문).
- Gate note: Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. **운영자: 3000 재빌드·재기동 후 데스크톱/390px 브라우저 체크 권장**(가로 오버플로우·콘솔 오류·홈 고지 3줄).
- Residual / next: 가격 기준일 delayed 상태는 의도된 정직 표시(유지). 게이트는 단독 "진입"/"매수 추천" 미검사(오탐 회피) — 신규 문자열 수기 주의. 다음: P0-B(설계서 잔여), 운영자 모바일 게이트, 외부 릴리스(범위 외).

### Task 27 — OrnScore 비주얼 리뉴얼 Phase 7 — /backtest KPI 수익/위험 분리·위험 안내 강화·월별 히트맵·MDD 차트·기여 Top/Bottom (2026-06-25, Claude)
- Preview/branch: 리뷰 기준 **branch `ai-center/task-27-ornscore-phase-7-kpi`**(시작 `1ae9486`, 클린, `4f5b277` 라인 유지·되돌림 없음). 로컬 검증은 prod `127.0.0.1:**3255**`(운영자 3000/4310 무중단, 내 리스너 PID 15684만 종료). main 머지·배포는 운영자 범위.
- 목표: 설계서 `ornscore_design_improvement_spec.md` **Phase 7(§11.2~§11.5·§15·§20.7)**. `/backtest`를 평면 6카드 → **수익/위험 분리 KPI + 강화된 위험 안내 + 월별 히트맵 + 낙폭(언더워터) 차트 + 기여 Top/Bottom 막대**. 점수 계산식·데이터 생성·`backtest-result.json` **무변경**, 비자문 톤(수익률만 강조 금지·`수익 보장`/`추천 전략`/`매수 신호` 금지), **신규 npm 0**(순수 CSS/SVG/HTML).
- 신규 4파일 `src/components/backtest/`:
  - `BacktestRiskNotice.tsx`(서버): 위험·한계 안내 단일 소스. 과거 데이터 기반 시뮬레이션·**미래 수익 비보장**·**수수료·슬리피지·체결 지연·유동성 한계**·생존편향·미래참조 제거·지표범위 한계를 항목으로 명시 + (옵션) 벤치마크/가정 줄. `/backtest` 실데이터·준비중 양쪽 재사용(기존 상·하단 amber 문단 2개 흡수해 중복 제거).
  - `MonthlyHeatmap.tsx`: 연도(행)×월(01~12 열) 순수 CSS 그리드 히트맵. `monthlyReturns`(미사용) 표면화. 셀 색은 정적 Tailwind 리터럴 9버킷(상승=red·하락=blue·0/미보유=zinc). `overflow-x-auto`+`min-w-[560px]`로 390px 가로 넘침 회피, `title`/`aria-label`에 연·월·% 노출.
  - `DrawdownChart.tsx`: `equityCurveMonthly.equity` 직전 고점 대비 낙폭(언더워터) 순수 SVG 면적 차트. 최저점(최대낙폭) 월 표시·`maxDrawdown` 주석. EquityChart와 동일 viewBox+`w-full h-auto`, `role="img"`+`aria-label`. 하락=파랑.
  - `ContributionBars.tsx`(서버): `contributors`를 pnl 부호로 **수익 기여 상위/손실 기여 상위** 2그룹 가로 막대. 그룹 내 max |pct| 기준 길이, 수익=red·손실=blue, 각 행 `/stock/{ticker}` `prefetch={false}` 링크(`names`). 데이터 없으면 렌더 안 함(날조 금지).
- 변경 2파일:
  - `BacktestClient.tsx`: 평면 6카드 metricCards 제거 → **수익 그룹**(CAGR·총수익률 vs 벤치·누적 초과수익) / **위험 그룹**(MDD vs 벤치·Sharpe vs 벤치·승률) 2박스(`KpiCell`). 위험 그룹은 rose 테두리/배경+`ShieldAlert`+"위험" 라벨로 색만으로 전달 않게(§20.7). 인라인 amber 문단 → `BacktestRiskNotice`. EquityChart 아래 `DrawdownChart`→`MonthlyHeatmap`→연도별 막대→`ContributionBars`+보유 칩. 전략 탭·composite 기본 보존.
  - `src/app/backtest/page.tsx`: 준비중 fallback에 `BacktestRiskNotice` 추가(badges 아래).
- 결정: (1) MDD를 등락 색(상승=red) 혼동 없이 보이려고 **위험 그룹은 rose 톤+아이콘+라벨** 분리(값도 rose). 수익 그룹은 기존 등락 색 유지. (2) 상·하단 amber 중복 문단을 단일 `BacktestRiskNotice`로 통합. (3) 히트맵 색은 전부 정적 리터럴(런타임 합성 0).
- 통과: `npx tsc --noEmit` exit 0(전후) · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·Metrics 2.4, exit 0) · `npm run build`(타입게이트·`/backtest` 7.24 kB, exit 0) · 로컬 prod(3255) `/backtest`·`/today`·`/stocks`·`/stock/005380` 200, 에러 마커 0. `/backtest` SSR에 수익/위험 그룹·위험 안내(수수료·슬리피지·체결 지연·유동성·미래 수익 비보장)·월별 히트맵·낙폭(언더워터)·수익/손실 기여 상위·인라인 벤치(총수익률 +290.5%/MDD −28.0%/Sharpe 0.98) 렌더. 신규/변경 파일 금칙어 grep = 0.
- 게이트 한계: Playwright 미구성 → 자동 게이트 로컬 미가용. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장** — 데스크톱/390px에서 KPI 수익·위험 2박스(1열↔2열)·히트맵 `overflow-x-auto` 가로 넘침 0·낙폭 차트 반응형·기여 막대 1열↔2열·콘솔 오류 0.
- Residual / next: 백테스트 생존편향 실해결(시점별 유니버스 재구성) 열림(현재 안내 문구). 전역 라이트 토큰(#F6F8FB) 미도입(범위 외). 성과 기여는 전략별 9종목 누적만 — 시점별 기여 시계열은 데이터 없어 후속 과제.

### Task 26 — OrnScore 비주얼 리뉴얼 Phase 6 — /disclosures 공시 신호 카드 피드·타입 색/아이콘·이해하기 UX (2026-06-25, Claude)
- Preview/branch: 리뷰 기준 **branch `ai-center/task-26-ornscore-phase-6-ux`**(시작 `8b2ac57`, 클린, `4f5b277` 라인 유지·되돌림 없음). 로컬 검증은 prod `127.0.0.1:**3253**`(운영자 3000/4310 무중단, 내 리스너 PID 2412만 종료). main 머지·배포는 운영자 범위.
- 목표: 설계서 `ornscore_design_improvement_spec.md` **Phase 6(§10.2~§10.6·§15·§20.7)**. `/disclosures`를 테이블식 → **상단 카드형 요약 대시보드 + 이벤트 피드 카드**. 공시 분류 로직·API fallback·점수/데이터 생성 무변경, 비자문 톤(호재/악재 단정 금지), 신규 npm 0.
- 신규 2파일:
  - `src/lib/disclosureType.ts`: `signalType` → `{label, shortLabel, Icon(lucide), badgeBg/Text/Border, dot, cardBorder}` 단일 소스 + `DISCLOSURE_TYPE_ORDER` + `typeMetaOf()`. **색 매핑(§10.4)**: 자사주=green · 보유변동=purple · 대형계약=teal(청록) · 손익정정=amber(주황) · 유증/CB=red. 전부 정적 Tailwind 리터럴(런타임 합성 0). 색은 항상 텍스트 라벨/아이콘/도트 동반(§20.7). 미분류=중립 회색 폴백.
  - `src/components/disclosures/DisclosureSummaryCards.tsx`(presentational): 타입별 요약 카드 항상 5개(`grid-cols-2`→sm:3→lg:5), 아이콘+라벨+묶음 수+캡션, 0건 muted.
- 변경 2파일:
  - `DisclosureExplorer.tsx`: `SIGNAL_STYLES`/`CANON_TYPES` 제거 → 필터 칩·카드 배지/테두리를 `typeMetaOf(g.signalType)`로. 요약 카드 렌더(`signalCounts` 전달). 각 묶음을 이벤트 카드(좌측 타입색 테두리·아이콘 배지·종목/코드/제출일·한 줄 의미·구분된 "확인할 것" 라인·액션 행)로 재구성. 터치 44px·`flex-wrap`·`break-words`로 390px 넘침 회피. 로딩/에러/빈 상태/SSR initialData 보존.
  - `SignalGuideExpand.tsx`: `url` prop로 펼침 내부 DART 원문 링크 추가(§10.6), 헤더를 `disclosureType` 타입 아이콘/색으로 일관화, 트리거 44px.
- **색-토큰 결정**: capital_raise(빨강) vs 방향 배지 "긍정 가능"(빨강)은 별개 배지·다른 텍스트라 혼동 낮아 방향 매핑 보존. `StockDisclosures.tsx`(상세 `SIGNAL_BG`) 무변경 — retone은 `/disclosures` 한정(상세 회귀 0).
- **"이 공시 이해하기" 결정**: §10.6의 "긍정/부정적으로 볼 수 있는 경우" 섹션은 자문 톤("좋은 신호"/매수/호재) 없이 깔끔히 분리하기 어려워 **기존 인라인 펼침 유지**(이미 일반적 의미·확인 항목·과거 패턴·주의·원문 노출). 모달 대신 코드베이스 기존 인라인 펼침 채택.
- 통과: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·Metrics 2.4, exit 0) · `npm run build`(타입게이트·`/disclosures` 11.1 kB, exit 0) · 로컬 prod(3253) `/disclosures`·`/today`·`/stock/005380` 200, `/disclosures` SSR에 5 요약 카드 라벨·5색 토큰(green/purple/teal/amber/red)·이벤트 마커(자동분류·이 공시 이해하기·원문 보기·확인할 것)·캡션 렌더, 에러 마커 0, 신규/변경 파일 금칙어 grep = 비자문 부정문만.
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장**(요약 카드 2열↔5열·타입 색 밴드·이벤트 카드 가로 넘침 0·이해하기 펼침·터치 44px·콘솔 오류 0).
- Residual / next: Phase 7(백테스트 차트·손실 기여 막대). 전역 라이트 토큰(#F6F8FB) 미도입(범위 외).

### Task 25 — OrnScore 비주얼 리뉴얼 Phase 5 — /stock 상세 게이지·지표 카드·업종 비교 시각화 (2026-06-25, Claude)
- Preview/branch: 리뷰 기준 **branch `ai-center/task-25-ornscore-phase-5`**(시작 `5381720`, 클린). 로컬 검증은 prod `127.0.0.1:**3251**`(운영자 3000/4310 무중단, 시작 PID 15780만 종료). 외부 공개 주소·main 머지는 범위 외(운영자).
- 목표: 설계서 `ornscore_design_improvement_spec.md` **Phase 5(§9.2~§9.7·§14·§15)**. Task #15 결론 카드(`StockConclusionHero`)·#23 톤 위에서 그 아래/주변 점수 해석·비교 시각화 강화 — 결론 카드는 갈아엎지 않음. 점수 계산식·데이터 생성·JSON-LD·breadcrumb·`generateMetadata`/`generateStaticParams`·`StockTabs` 탭 id/순서·가격 동기화·`surge3m`/`riskAlert`·관심/비교/공유 슬롯 **무변경**, 비자문 톤, 신규 npm 패키지 0.
- 신규 3파일:
  - `src/lib/metricReadings.ts`: `BeginnerReading`의 `readMomentum/readFlow/readValue/readVol`+`getChecklistByPattern`+`readingsOf`를 추출(문구 바이트 동일·순수 함수). 초보자 카드·지표 카드 공유 단일 소스. 점수 계산 무관(표시 문구 출처만 이동).
  - `src/components/stock/MetricInsightCards.tsx`(서버, 훅 0): 4지표 카드. 지표명+`ScoreTooltip`, 원점수·상위/하위 백분위, `scoreColorOf` 밴드 막대, 한 줄 해석, 확인/주의 태그(caution=주황 "주의", 그 외 파랑 "확인"). grid 1열→sm:2열. 밸류 카드만 `per`/`pbr`을 받아 PER·PBR 문구 렌더.
  - `src/components/stock/SectorComparison.tsx`(서버): 업종 비교. 행마다 순위 배지·종목명(`/stock/{ticker}` `prefetch={false}`)·가로 종합점수 막대(밴드색)·PER/등락 보조·현재 종목 ring+bg+"현재" 태그. `overflow-x-auto`(min-w-280)로 390px 넘침 회피. sectorCount<2면 안내 빈 상태. 점수는 page.tsx에서 1회 계산해 `sectorRows`로 전달(재계산 없음).
- 변경 4파일:
  - `src/components/stock/PriorityScoreCard.tsx`: `ScoreGauge`(88·showLabel·showOutOf)로 점수 주인공화 + 전체/업종 순위·데이터 %·이상값 점검·산식 버전 보존. **suspect는 게이지 대신 회색 숫자**(매수 게이지 오인 방지). props 시그니처 무변경 → 호출부 무수정.
  - `src/components/BeginnerReading.tsx`: 제목 **"초보자는 이렇게 보세요"**, 헤드라인 아래 순서형 **"먼저 확인할 것"(점수→공시→재무, §9.5)** ol(앵커 `#basis`/`#disclosures`/`#financials`) 추가, 기존 패턴 항목은 "이 종목에서 특히 볼 것"로 유지, 고지·앵커 칩 보존. 해석/체크리스트는 `metricReadings.ts` 위임.
  - `src/components/stock/NextActionButtons.tsx`: 4앵커(공시 확인/재무 보기/점수 근거/업종 비교) 라벨·아이콘 정돈, 44px·2열/4열 유지. 관심/비교는 헤더 실버튼 담당 → 죽은 링크 날조 안 함.
  - `src/app/stock/[ticker]/page.tsx`: `MetricStrip` import 제거→`MetricInsightCards`/`SectorComparison` 추가, 지표 섹션·업종 `<table>` 대체, `sectorRows` 계산 추가. "지표 가이드 →"·"전체 N종목 대비" 보존.
- 결정/잔여: (1) suspect는 밴드색 게이지가 매수 신호처럼 보일 수 있어 회색 숫자 유지(#15 톤 일관). (2) `readValue`가 PER·PBR 문구를 쓰므로 밸류 카드만 per/pbr 전달. (3) `MetricStrip.tsx`는 상세 미사용이나 파일 잔존(타 화면 영향 0, 삭제 범위 외).
- 검증: `npx tsc --noEmit` exit 0(전후) · `PYTHONUTF8=1 verify_metrics.py`(138종목 0오류·금칙어 0·Metrics 2.4 일치, exit 0) · `npm run build`(타입게이트·138p SSG, `/stock/[ticker]` 13.9 kB, exit 0) · 로컬 prod(127.0.0.1:3251) `/stock/005380`·`/stock/005930`·`/stocks`·`/today` 200 · `/stock/005380` SSR에 탐색 우선도 게이지(aria "종합 점수")·자체 지표 4종(확인×2/주의×2)·"초보자는 이렇게 보세요"+"먼저 확인할 것"·"같은 업종 비교"+막대 범례 렌더, 에러 마커 0 · 신규/변경 파일 금칙어 grep = 비자문 부정문·기존 보존 문구만.
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장** — 데스크톱/390px 게이지 가독성·지표 카드 1열↔2열·업종 비교 막대 `overflow-x-auto` 가로 넘침 0·다음 액션 44px·콘솔 오류 0.
- Residual / next: Phase 6(공시 카드 피드·타입별 색/아이콘·해석 모달)·Phase 7(백테스트 차트)·전역 라이트 토큰(#F6F8FB, 범위 외).

### Task 25 (Gate Repair) — Playwright stale 3000 CSS 400 복구 (2026-06-25, Claude)
- 증상: AI Center 게이트 DESKTOP·MOBILE 둘 다 `400 .../_next/static/css/d1665e0e41509995.css`(+ `/`·`/stocks` `_rsc` ERR_ABORTED).
- 원인: 코드 결함 아님. 포트 3000 `next start`(PID 23992, Task 24 복구 때 Codex 가 `d1665e0e…` 빌드로 띄운 것)가 살아있는 채 Task 25(`b697386`) 재빌드로 CSS 해시가 `d1665e0e…`→`302c90d13f468b6d` 로 바뀌어 stale 400. Task 15·24 와 동일 staleness 레이스.
- 조치(소스 무변경): `.next` 클린 재빌드(`302c90d…`) → tsc 0·build 0·verify_metrics 0 → 빈 포트 3251(내 PID 20368)로 신 빌드 검증: `/ /stocks /today /stock/005380 /stock/005930` 200, 신 CSS 200(stale 참조 0), Task 25 마커 전수 SSR, 에러 0. 내 PID 20368 만 종료(3000/4310 무중단).
- 복구 완료(Codex): stale 3000 PID 23992만 종료하고 포트 3000을 PID 13444로 재기동. 4310(PID 24672)은 무중단. `/stock/005380` Phase 5 마커 4종 렌더, 정적 asset 12개 전수 200(BadAssets 0), `/ /stocks /stock/005380 /stock/005930 /disclosures /backtest` HTTP 200 확인. 상세는 PROGRESS.md 2026-06-25 Task 25 Repair 항목.

### Task 24 — OrnScore 비주얼 리뉴얼 Phase 4 — /stocks 점수 히트맵 표/카드 보기모드 (2026-06-25, Claude)
- Preview/branch: 리뷰 기준 **branch `ai-center/task-24-ornscore-phase-4`**(시작 `4f5b277`, 클린). 로컬 검증은 prod `127.0.0.1:**3251**`(운영자 3000/4310 무중단, 내 시작 PID만 종료). 외부 공개 주소 갱신·main 머지는 범위 외(운영자).
- 목표: 설계서 `ornscore_design_improvement_spec.md` **Phase 4(§8.5 데스크톱 점수 히트맵 테이블·§8.6 모바일 카드·§15.5 모바일 필터·§20.5 빈 상태)**. 이미 끝난 **Task #16 질문형 프리셋/필터 위에 2차 고도화** — 되돌리거나 중복 구현 안 함. 점수 계산식·데이터 생성·필터 파라미터·저장검색/알림/`?theme=` 딥링크 **무변경**, 비자문 톤, 신규 npm 패키지 0.
- 신규 1파일 `src/components/stocks/StockResultsTable.tsx`(presentational, 훅 0):
  - 데스크톱 점수 히트맵 테이블. **11컬럼**: 종목명·업종·현재가·등락률·종합점수·추세·거래활성도·밸류·위험조정·신호·액션. 점수 5컬럼은 `ScoreHeatCell`(내부)로 `scoreColorOf` 밴드(80↑ blue/60~79 sky/40~59 amber/<40 zinc) 배지 — `c.badge` 정적 리터럴만 사용해 Tailwind 스캔 누락 회피(런타임 합성 0). `<table>`을 `overflow-x-auto`로 감싸고, 종목명/액션은 `/stock/{ticker}` `prefetch={false}` 링크, 등락률 색 카드와 동일(상승 red·하락 blue), 숫자 tabular-nums.
  - `deriveSignals()` export — 점수 파생 강점/주의 칩(추세 강함/거래 활발/저평가 가능/위험 대비 양호 + 추세 약함/거래 부진/밸류 부담/변동성 큼/가격 하락 중/급등 주의). 카드와 표가 동일 로직 공유.
- 변경 `src/components/StocksExplorer.tsx`:
  - `viewMode`("card"|"table") state + `localStorage("stocks-view-mode")` 보존(useEffect 복원, 기본 카드형, try/catch graceful). 검색·정렬 행에 **데스크톱 전용(`hidden lg:inline-flex`)** 카드형/표형 세그먼트 컨트롤.
  - 결과 영역: `viewMode==="table"`이면 데스크톱(`hidden lg:block`)은 `StockResultsTable rows={sorted.slice(0,100)}`, 모바일(`lg:hidden`)은 카드형 강제. 카드/표 공통 "상위 100개" footnote.
  - 카드 인라인 신호 도출을 `deriveSignals`로 통일(중복 제거), 카드 map을 `renderCards()`로 추출(카드형/표형-모바일 공용). 카드 헤더에 `· {sector}` 보조표기.
  - 빈 상태(§20.5): `strongestConstraint()`가 활성 조건 중 가장 강한 1개(점수 min·PER/PBR 상한·ROE/배당·테마·시총·적자제외·시장)를 휴리스틱 strength로 골라 "○○ 조건이 강해 결과가 없습니다" 명시. 버튼 2개 — **가장 강한 조건 완화**(그 조건만 해제+activePreset 클리어) / **전체 종목 보기**(resetFilters). 비자문 톤.
- 변경 `src/app/stocks/page.tsx`: 뷰모델에 `sector: sectorOf(s.themes)` 추가(`@/lib/sector`, 홈 `StockCandidateCard`/`/today` 후보와 동일 소스). `Stock` 인터페이스에 `sector?: string`.
- 결정/잔여: (1) **공시/신호 컬럼은 "신호"로 라벨** — 클라 컴포넌트에서 종목별 공시 실데이터 동기 접근 불가라 "공시 있음" 플래그를 날조하지 않고 점수 파생 칩만 노출(설계 지침: 가짜 데이터 금지). 실 per-stock 공시 데이터셋 연결 시 "공시"로 교체. (2) 모바일은 테이블 미사용 — 표형 토글 자체가 `hidden lg:inline-flex`라 도달 불가, <lg는 항상 카드. (3) `strongestConstraint` strength는 표시·랭킹 휴리스틱(점수 계산 무관). (4) 저장검색/알림/`?theme=`/필터 파라미터 핸들러(`handleSaveSearch`/`handleCreateAlert`/`applySavedConfig`/`togglePreset`/`SavedSearchConfig`)는 전부 무변경.
- 검증: `npx tsc --noEmit` exit 0 · `PYTHONUTF8=1 verify_metrics.py`(138종목 0오류·금칙어 0·Metrics 2.4 일치, exit 0) · `npm run build`(타입게이트·`/stocks` 13.9 kB, exit 0) · 로컬 prod(127.0.0.1:3251, 내 PID만 종료) `/stocks`·`/stocks?theme=반도체`(인코딩)·`/today`·`/stock/005930` 200 · `/stocks` SSR에 카드형/표형 토글·정렬/컬럼 라벨 렌더·에러 마커 0 · 신규/변경 파일 금칙어(추천/매수후보/수익기대/급등예상/상승가능성/매도) grep 0.
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장** — 데스크톱(≥1024px) 카드형↔표형 토글 동작·표 점수 히트맵 색 밴드(blue/sky/amber/zinc)·가로 오버플로우 0, 390px 모바일은 표형 토글 미노출·카드형 유지·가로 오버플로우 0·콘솔 오류 0, localStorage 보기모드 새로고침 유지.
- Residual / next: (1) 실 per-stock 공시 데이터셋 연결 시 표 "신호" 컬럼 → "공시" 교체. (2) Phase 5(`/stock` 상세 게이지·업종 비교 시각화)·Phase 6(공시 카드 피드·해석 모달)·Phase 7(백테스트 차트)가 남은 설계서 단계. (3) 전역 라이트 토큰(#F6F8FB) 미도입(범위 외).

### Task 23 — OrnScore 비주얼 리뉴얼 Phase 3 — /today 대시보드화 (2026-06-25, Claude)
- Preview/branch: 리뷰 기준 **branch `ai-center/task-23-ornscore-phase-3`**(시작 `387f6b4`, 클린). 로컬 검증은 prod `127.0.0.1:**3250**`(운영자 3000/4310 무중단, 내 PID만 종료). 외부 공개 주소 갱신·main 머지는 범위 외(운영자).
- 목표: 설계서 `ornscore_design_improvement_spec.md` **Phase 3(§7·§15.2·§16.4)**. `/today`를 정보 나열형에서 홈 리뉴얼과 같은 수준의 금융 대시보드 첫인상으로. 점수 계산식·데이터 생성·공시 분류 **무변경**, 비자문 톤, 신규 npm 패키지 0, `layout.tsx max-w-5xl` 셸 무변경. 이미 끝난 홈 Hero/점수 UI(#21/#22)·필터(#16)·상세 결론(#15)·신뢰 배지(#17/#18) **중복 구현 안 함** — 전부 재사용.
- 신규 4파일 (`src/components/today/`):
  - `TodayStatusBar.tsx`(서버): 페이지 최상단 데이터 상태 바. 전역 `dataStatus` 단일 소스만 읽어 **데이터 상태(DataStatusBadge tone=statusTone)·주가 기준일(AsOfDateBadge globalAsOfLabel+장마감)·공시 기준(최근 업데이트)·산식 버전(MetricsVersionBadge metricsVersionLabel)**을 한 줄로. 데스크톱 가로 한 줄, ≤390px 자연 줄바꿈(divider는 `hidden sm:inline`). 두 번째 진실 소스 도입 안 함.
  - `TodayTopSection.tsx`(서버): 오늘의 Top 3 큰 카드. 홈 `StockCandidateCard` 재사용(게이지+4지표 MetricBar+강점/주의+CTA). grid `1→sm:2→lg:3`. "탐색 우선순위" 톤 카피.
  - `SignalSection.tsx`(서버): 신호별 섹션 컨테이너(제목·캡션·반응형 카드 그리드·footnote). 데이터 없으면 **EmptyState**("아직 해당하는 종목이 없습니다…") — 억지로 채우지 않음.
  - `SignalStockCard.tsx`(서버): 컴팩트 종목 카드(ScoreGauge size 56 + 이름/코드/업종/가격/등락 + 한 줄 신호 + 카드 전체 링크). 과열 주의는 `caution` amber 톤.
- 변경 1파일: `src/app/today/page.tsx`
  - **추가**: 최상단 `TodayStatusBar`, 시장 KPI 4카드(**홈 `MarketSnapshotCards` 재사용** — 분석 종목/종합 80+/거래활성도 급증/공시 신호), `TodayTopSection`(Top3), 신호별 6섹션(종합 점수 상위=compositeRest slice(3,9) / 거래활성도 급증=flowStats.ratio≥1.5 ∥ flow≥75 / 밸류 매력=topValue / 추세 강함=topMomentum / 과열 주의=r3m≥80 caution / 최근 공시 있음=recentSig를 universe 종목에 매핑).
  - **대체(중복 제거)**: 기존 3개 KPI 카드(분석 종목/PER 중앙값/PBR 중앙값) → 시장 KPI 4카드. `StockTabs`(종합/저평가/추세 리스트) → 신호별 6섹션. 하단 amber "오늘 먼저 볼 공시 신호" 블록 → "최근 공시 있음" 신호 섹션으로 흡수.
  - **보존**: 오늘의 브리핑+AI 인사이트, 최근 장마감 변화, 체크리스트, 푸터 고지(하위 신뢰 레이어). `compositeReason`/`valueReason`/`momentumReason`/`strongMetrics`/`riskNote`는 신호 문구·Top3 VM에 재사용.
- 결정/잔여: (1) **이중 CTA(자세히 보기+비교 추가)는 단일 CTA로 축소** — `/compare`는 `?add=` 파라미터를 받지 않고 localStorage("비교에 추가")로만 동작 → 동작 안 하는 링크를 날조하지 않고 `자세히 보기`(/stock) 단일 CTA만(설계 지침의 "없으면 생략" 따름). (2) KPI '거래활성도 급증'은 실 거래량 급증 데이터 부재로 `homeSnapshot.volumeSpikeCount`(거래대금 5d/20d ratio≥1.5, 폴백 flow≥75) **파생 추정** — 캡션·footnote에 명시. (3) 모바일은 테이블식 축소 대신 **카드 스택**(grid-cols-1) — 가로 스크롤 행 대신 세로 스택으로 390px 오버플로우 구조적 회피. (4) Top3 = compositeOf 상위 3(!isSuspect), 종합 상위 섹션은 4위 이후로 중복 최소화.
- 검증: `npx tsc --noEmit` exit 0 · `PYTHONUTF8=1 verify_metrics.py`(138종목 0오류·금칙어 0·Metrics 2.4 일치, exit 0) · `npm run build`(타입게이트·172p, `/today` 854 B, exit 0) · 로컬 prod(127.0.0.1:3250) `/today / /stocks /stock/005380` 200 · `/today` SSR에 상태 바(데이터 상태/주가 기준/산식 버전)·KPI 4·Top3+신호 카드 게이지 34개(aria "종합 점수")·6섹션 제목 전수 렌더·에러 마커 0. 변경/신규 파일 금칙어 grep = 비자문 부정문("매수 추천이 아니라"·"매수 신호가 아니며")만(고지 허용).
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build로 대체. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장** — `/today` 360~390px 가로 오버플로우 0·상태 바 줄바꿈·KPI 2열·Top3 1열 스택·신호 카드 게이지 가독성·CTA 44px·콘솔 오류 0.
- Residual / next: (1) `/today`·`/stocks`·`/stock` 외 전역 라이트 토큰(#F6F8FB) 미도입(범위 외). (2) 실 거래량 급증 데이터 소스 생기면 `homeSnapshot.volumeSpikeCount`만 교체. (3) 신호 섹션 모바일 가로 스냅 스크롤(§7.5 대안)은 현재 세로 스택 — 필요 시 후속. (4) Phase 4(종목 탐색 히트맵 테이블)·Phase 5(상세 게이지 확장)·Phase 6(공시 카드 피드)·Phase 7(백테스트 차트)가 남은 설계서 단계.

### Task 22 — OrnScore 홈 비주얼 임팩트 강화 (1.5차) (2026-06-24, Claude)
- Preview/branch: 사용자 확인 화면 **http://127.0.0.1:3000**, 리뷰 기준 **branch `ai-center/task-22-ornscore-1.5`**(시작 `a70d4b3` = Task 21, 클린). 외부 공개 주소 갱신·릴리스는 **이번 범위 아님**. 로컬 `npm run build`로 `.next` 재생성 — 운영자가 3000을 `next start`로 띄워뒀다면 **재기동 권장**(stale 청크 회피).
- 목표: Task 21 기반(ScoreGauge/ScoreBadge/MetricChip/MetricBar/scoreColor) 위에서 홈 첫 화면의 시각 임팩트·대시보드감을 **확실히** 강화. 설계서 §2.1·§2.2·§6·§23. 점수 계산식·데이터 생성·공시 분류 **무변경**, 비자문 톤 유지, 신규 npm 패키지 0, `layout.tsx` `max-w-5xl` 셸 무변경.
- What changed (3 files):
  - `home/HomeHero.tsx`: 배경을 차분한 slate/blue 그라데이션 → **딥블루 패널**(`from-blue-800 via-blue-900 to-slate-900`, 다크 `from-blue-950 …`)로 전환해 대비를 키움. 좌측 카피는 화이트 텍스트(강조어 `text-sky-300`로 bg-clip 장식 제거). 우측 미리보기는 딥블루 위 **흰 카드 '화면'**(shadow-xl·ring·상단 구분선)로 분리해 "실제 서비스 화면 축소" 느낌. 1순위 **ScoreGauge 80→104px**(showLabel+showOutOf, 주변 여백↑)로 주인공화, 2~3순위 컴팩트 랭킹 행(업종 보조표기 추가), 하단 **KPI strip**을 아이콘+큰 숫자로 재구성(설계서 순서 공시 신호/거래활성도 급증/종합 80↑). primary CTA = 흰 solid(`bg-white text-blue-800`, 딥블루 위 최대 대비·dominant), secondary = 흰 outline(`border-white/30`), 둘 다 `min-h-[44px]`+`focus-visible` 링. 짧은 1줄 고지 유지.
  - `home/StockCandidateCard.tsx`: 위계 재정렬(종목명↑ 16px bold → 업종·코드 → 가격 → **ScoreGauge 72→84px showLabel** → 4지표 막대(연한 패널로 묶음) → 강점/주의 → CTA). 강점=초록 ✓ 마커+칩, 주의=주황 ! 마커+박스로 **스캔 용이하게 분리**. CTA `font-semibold`+`focus-visible`. 모바일 1열 스택·44px 유지, riskNote/강점 텍스트는 page.tsx 비자문 그대로.
  - `lib/scoreColor.ts`: `good`(60~79) 밴드가 라이트모드에서 가장 약해 `fill`/`barFill`의 sky-500 → **sky-600**으로 대비만 소폭 강화(4밴드 임계·라벨·다크변형 불변). 모든 색 클래스 정적 리터럴 유지(런타임 합성 0).
- 카피 안전: 신규 문자열 비자문만(탐색 후보·검증 보류 제외·강점·주의 등). 변경 3파일+ui/ 금칙어 grep 0(`투자 추천이 아닌` 고지 부정문 제외).
- What passed: `npx tsc --noEmit` exit 0(전후 2회) · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·산식 2.4 0불일치, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0) · 빌드 CSS(`81f0b0e5135674d6.css`)에 4밴드 `bg-*/text-*` 라이트+다크(`bg-sky-600`·`bg-sky-400`·`bg-blue-600/400`·`amber-500`·`zinc-400/500`)+딥블루 프레임(`from-blue-800`·`from-blue-950`·`via-slate-950`) 전수 존재 → **task-21 런타임 클래스 누락 회귀 없음**. 로컬 prod(127.0.0.1:**3200** 신규 — 3100은 직전 세션 stale `next start` 점유 중이라 회피, 운영자 3000 무중단) `/ /stocks /stock/005930 /guide/metrics` 200·에러 0. 홈 SSR: 104px·84px 게이지, `from-blue-800` 프레임, `bg-white text-blue-800` primary CTA, KPI 3종, aria 게이지 6, 강점/주의 5/5 렌더. `/stocks`·`/stock/005930` 에러 0(상세는 자체 PriorityScoreCard라 새 게이지 미사용 — 무회귀).
- Gate note: Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+CSS grep+build로 대체. **운영자: 재빌드→3000 재기동 후 AI Center 브라우저 체크 권장** — 360~390px에서 Hero 세로 스택·104px 리드 게이지 가독성·후보 카드 비빽빽·KPI strip 줄바꿈·CTA 44px·밴드 색(blue/sky/amber/zinc).
- Residual / next: (1) 직전 세션 leftover `next start`가 3100 점유(PID 21332) — 운영자 정리 가능. (2) 새 점수 컴포넌트·딥블루 Hero는 여전히 **홈 한정** — `/today` KPI/Top3, `/stocks` 히트맵, `/stock` 상세 게이지 확장은 다음 작업(설계서 §7·§8.5·§9.3). (3) 전역 라이트 토큰(#F6F8FB) 미도입(범위 외). (4) 외부 공개 주소 미갱신(범위 외).

### Task 21 — OrnScore 비주얼 리뉴얼 1차 (홈 Hero + 점수 UI 기초) (2026-06-24, Claude)
- Preview/branch: 사용자 확인 화면 **http://127.0.0.1:3000**, 리뷰 기준 **branch `ai-center/task-21-ornscore-1-hero-ui`**(시작 `3e7b13e` 클린). 외부 공개 주소(valuemap.kr) 갱신·릴리스는 **이번 범위 아님**. 로컬 `npm run build`로 `.next` 재생성 — 운영자가 3000을 `next start`로 띄워뒀다면 **재기동 권장**(stale 청크 회피).
- 범위: 설계서 `ornscore_design_improvement_spec.md` Phase 1(디자인 시스템 기초) + Phase 2(홈 리뉴얼) 일부. 점수 계산식·데이터 생성·공시 분류 로직 **무변경**, 비자문 톤 유지.
- What changed:
  - 신규 디자인 시스템: ⭐`src/lib/scoreColor.ts`(점수→색/라벨 단일 소스, 4구간 §5.4, 색+한글라벨 동반, 다크 변형). ⭐`src/components/ui/` 4종 — `ScoreGauge`(순수 SVG 원형 게이지·`aria-label`)·`ScoreBadge`·`MetricChip`·`MetricBar`. 전부 서버 컴포넌트(클라 훅 0).
  - 홈: `home/HomeHero.tsx`(메인 카피 `오늘 볼 한국 주식, 점수로 먼저 좁혀보세요.`·CTA `오늘 후보 보기`/`지표 이해하기`·우측 **대시보드 미리보기 카드**=ScoreGauge+ScoreBadge+3스탯 요약·금융 톤 배경). `home/StockCandidateCard.tsx`(점수 게이지 주인공화·4지표 MetricBar·강점/주의 분리·업종 추가). ⭐`home/FeatureCards.tsx`(핵심 기능 3카드 오늘후보/공시신호/**백테스트 진입점 신규**). `app/page.tsx`(후보 VM에 sector+4지표 추가·Hero top3 전달·FeatureCards 연결, 기존 카운트/필터 무변경).
  - 고지: above-the-fold는 Hero 1줄 차분 고지만, 상세 `RiskNotice`는 하단 신뢰 레이어 유지(§17).
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·산식 버전 0불일치) · `npm run build`(타입게이트·138p 프리렌더 exit 0) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 3000·4310 무중단) `/ /stocks /stock/005930 /guide/metrics /backtest /disclosures` 전부 200·에러 0. SSR grep으로 신규 Hero 카피·미리보기·게이지(aria 6)·강점 5블록·band 라벨 렌더 확인.
- Browser check: Playwright 미구성 → DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자 AI Center 브라우저 체크 권장**(재빌드→3000 재기동 후) — 360~390px ScoreGauge 가독성·후보 카드 세로 스택·터치 44px·band 색(blue/sky/amber/zinc).
- Residual / next: (1) 신규 점수 컴포넌트는 **홈에만** 적용 — `/stocks`·`/stock` 상세 재사용 확장은 다음 작업. (2) 밝은 금융 톤·기존 다크 모드 공존(전역 라이트 토큰 #F6F8FB 미적용, 범위 외). (3) MetricBar의 `text-*`→`bg-*` 치환은 scoreColor 토큰 네이밍 규약 의존. (4) 외부 공개 주소 미갱신(범위 외). 다음: 점수 컴포넌트 /stocks 히트맵·/stock 상세 게이지 확장(§8.5·§9.3) → Phase 3 오늘 페이지.

### Task 20 — OrnScore 세부 디자인·UX 다듬기 (모바일/배지/문구 일관화) (2026-06-24, Claude)
- Preview/branch: 사용자 확인 화면 **http://127.0.0.1:3000**, 리뷰 기준 **branch `ai-center/task-20-ornscore-qa`**. 외부 공개 주소(valuemap.kr) 갱신·릴리스는 **이번 범위 아님**(다음 작업으로 명시 보류). 로컬 `npm run build`로 `.next` 재생성 — 운영자가 3000을 `next start`로 띄워뒀다면 **재기동 권장**(stale 청크 400 회피).
- What changed (10 files, surgical Tailwind/문구만, 점수·데이터 로직·레이아웃 구조 무변경):
  - 데이터 드리프트 제거: `guide/metrics/page.tsx`·`backtest/page.tsx`의 하드코딩 `138(개) 종목`을 `dataMetadata.count`/`realStockPool.length`로 단일 소스화(산식 버전/기준일은 이미 `dataStatus` 파생).
  - 배지 톤 통일: `StocksExplorer` 헤더 상태 pill → 공유 `DataStatusBadge`(라벨 `갱신 지연`/`데이터 정상`, delayed=orange). `DisclosureExplorer`의 ad-hoc amber `최신 200건` 배지/안내문 → **limited=slate**(경고색 아님)로 `/disclosures` `제한 수집`과 맞춤. `HomeHero` 상태 색 amber/green → 앱 공통 orange/emerald.
  - 모바일 터치 타깃: 홈 후보·공시 카드 주요 버튼 `min-h-[44px]`, 기간/저장·알림 칩 `py-1`→`py-1.5`(조밀 칩 군집은 왜곡 회피 위해 중간값).
  - 다음 단계 CTA: `/backtest`·`/status` 막다른 화면에 `지표 계산 방식 보기 →`/`데이터 상태 확인 →`/`산식 변경 이력 →` 1줄 nav.
  - 중복 카피 정리: 종목 상세 `PriorityScoreCard`의 `매수·매도 추천이 아닌 탐색 우선순위입니다.` 1줄 제거(바로 아래 히어로 고지 박스가 동일 문구 표기). 필수 고지 보존.
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·산식 버전 0불일치, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310·3000 무중단) 8개 점검 라우트 전부 200·에러 마커 0, SSR grep으로 변경 전수 렌더 확인.
- Browser check: Playwright 미구성 → DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자 AI Center 브라우저 체크(http://127.0.0.1:3000) 권장** — 360~390px 터치/넘침, 상태 배지 색(주황/에메랄드), /disclosures 제한 배지 slate, /backtest·/status 하단 nav, 종목 상세 고지 1줄.
- Residual / next: (1) 외부 공개 주소(valuemap.kr) 갱신·릴리스 절차 **보류 → 다음 작업**(main 머지·Vercel 배포). (2) 클라 컴포넌트 제한 문구는 번들 회피로 props/리터럴 유지(서버 props 주입 시 완전 단일 소스화 가능). (3) `/backtest` 두 주의 문단 중복 일부 잔존(필수 고지 삭제 리스크 회피). (4) Playwright 도입 시 모바일 게이트 자동화.

### Task 18 — OrnScore 데이터 신뢰 레이어 Phase 2 (공시/백테스트/상태/산식 이력) (2026-06-24, Claude)
- What changed: Task 17의 전역 `dataStatus` 단일 소스를 설계서 `ornscore_data_trust_badge_spec_v1.md` 2차/3차 범위로 확장(§10.4·§10.5·§12·§13·§17.1). 투자 추천/매수 유도 카피 0.
  - `src/lib/dataStatus.ts`: `domainStatuses`(가격/재무/공시/산식) + `EXPECTED_METRICS_VERSION="2.4"` + `metricsChangelogPath`. 재무는 `realStockPool` PER/PBR 결측률>3% 시 `partial`(현재 0.7%→normal), 가격=전역 delayed 재사용, 공시=limited, 산식=메타 유무로 normal/error.
  - `/disclosures`: `제한 수집` 배지 + 필터 근처 `<details>` 보조설명(최신 200건·누락 가능성).
  - `/backtest`: 신규 `BacktestLimitBadges`(아이디어 검증용·현재 종합점수 검증 아님·생존편향 가능·슬리피지 단순화) 4종을 준비중·실데이터 두 분기 모두에 배치, 모바일 2×2 wrap.
  - `/status`: `데이터 종류별 상태` 섹션(가격/재무/공시/산식 4행, `DataStatusBadge`) + `/guide/metrics/changelog` 링크. 가격 `갱신 지연` 정직 유지.
  - 신규 `/guide/metrics/changelog`: 산식 변경 이력 스켈레톤(현재 Metrics 2.4·적용일·변경 요약). `/guide/metrics`에 상호 링크.
  - `scripts/verify_metrics.py`: §17.1 산식 버전 일치 단언 — stocks.json metricsVersion=="2.4" + src/ 하드코딩 `Metrics x.y` 드리프트 검출. **1차 실행에서 `metrics.ts` 주석 `Metrics v2.3` 2건 드리프트 검출 → 2.4로 교정**(가이드가 GitHub로 링크하는 참조 구현이라 공개 불일치였음, 스펙 이슈1 P0).
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·산식 버전 0불일치, exit 0) · `npm run build`(타입게이트·138p 프리렌더·`/guide/metrics/changelog` 신규 라우트, exit 0) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /disclosures /backtest /status /guide/metrics /guide/metrics/changelog /stock/005930` 200, 신규 카피 전수 SSR 렌더(제한 수집·4배지·도메인 4상태·changelog Metrics 2.4·상호 링크).
- Gate note: Playwright 미구성 → AI Center DESKTOP/MOBILE 게이트 로컬 미가용. curl+SSR grep+build 대체. 운영자 AI Center 브라우저 체크 권장(제한 배지·details 펼침·백테스트 2×2 wrap·status 1열 스택·changelog 라우트).
- Next concrete OrnScore step (설계서 §23 3차): (a) 데이터 상태 자동 검증 강화(공시 200건 도달 limited 실판정·오류 로그 요약), (b) 산식 버전 단언을 CI(GitHub Actions)에도 연결, (c) 결측률/지연 공개 범위 + 관리자 경고, (d) 백테스트 생존편향 실해결.

### Task 25 (Pass 6) — 공시 핵심 숫자: 자기주식 취득 규모 (2026-06-23, Claude)
- What changed: 자사주 매입(`treasury_buy`) 공시 신호에 취득예정 주식수·금액(억원)을 사실 절로 덧붙이는 graceful enrich를 추가. Pass 5(임원 보유변동)와 동일 패턴.
  - 신설 `src/lib/treasuryDetails.ts`(`enrichTreasury`) + 신설 스캐폴드 `scripts/fetch_treasury_details.py`(DART `tsstkAqDecsn.json` → `public/data/treasury-signals.json`).
  - `src/app/api/disclosures/{[ticker],recent}/route.ts`에서 `enrichTreasury(code, enrichInsider(code, sig))`로 합성. UI 편집 없음.
- What passed: `verify_metrics.py`(138종목·금칙어 0, exit 0), `npm run build`(타입게이트·138 종목 프리렌더), 서버 청크에 신규 포맷 문자열 존재, 로컬 5라우트 200·에러 0.
- What remains / operator action:
  1) 실제 노출 활성화 → 송님이 DART 키로 `python scripts/fetch_treasury_details.py` 실행해 `public/data/treasury-signals.json` 생성(없으면 graceful no-op). 스크립트의 `tsstkAqDecsn` 필드명은 operator-verify 상태 — 실호출로 확인 후 필요 시 매핑만 교정.
  2) 다음 패스: 증자/CB를 `piicDecsn.json`/`cvbdIsDecsn.json` 구조화 엔드포인트로 동일 패턴 확장, 또는 single_contract/correction용 §18.2 본문 XML 파서 착수.

### Task 27 (Pass 7) — 공시 핵심 숫자: 증자·전환사채 발행 규모 (2026-06-23, Claude)
- What changed: 증자·CB(`capital_raise`) 공시 신호에 발행규모(억원)·자금용도 카테고리를 사실 절로 덧붙이는 graceful enrich 추가. Pass 5(임원 보유변동)·Pass 6(자기주식 취득)와 동일 패턴.
  - 신설 `src/lib/capitalDetails.ts`(`enrichCapital`) + 신설 스캐폴드 `scripts/fetch_capital_details.py`(DART `piicDecsn.json`+`cvbdIsDecsn.json` → `public/data/capital-signals.json`).
  - `src/app/api/disclosures/{[ticker],recent}/route.ts`에서 `enrichCapital(code, enrichTreasury(code, enrichInsider(code, sig)))`로 합성. UI 편집 없음.
- What passed: `verify_metrics.py`(138종목·금칙어 0, exit 0), `npm run build`(타입게이트·138 종목 프리렌더), 공유 서버 청크(`chunks/3162.js`)에 신규 포맷 문자열(`발행규모`·`자금용도`)이 Pass 6 절과 함께 존재, 로컬 5라우트 200·에러 0, 두 disclosure API 200·error null(source=sample/cache graceful no-op).
- What remains / operator action:
  1) 실제 노출 활성화 → 송님이 DART 키로 `python scripts/fetch_capital_details.py` 실행해 `public/data/capital-signals.json` 생성(없으면 graceful no-op). 스크립트의 `bd_fta`(CB 권면총액)·`fdpp_fclt`/`fdpp_op`(유상증자 자금목적) 필드명은 operator-verify 상태 — `piicDecsn`/`cvbdIsDecsn` 실호출로 확인 후 필요 시 매핑만 교정.
  2) 다음 패스(유일하게 남은 비구조화 경로): single_contract/correction용 §18.2 본문 XML 파서 착수 — DART `document.xml` 다운로드 → 계약금액·직전매출 비율 추출 스캐폴드. (구조화 엔드포인트가 있는 공시 4종=임원·자기주식·유상증자·CB는 이제 모두 enrich 경로 확보.)

### Task 29 (Campaign 8) — BW 구조화 enrich + 단일계약 본문 XML 스캐폴드 (2026-06-23, Claude)
- What changed:
  - PRIMARY: 신주인수권부사채(BW)를 capital_raise 패밀리에 추가. `src/lib/disclosure-signals.ts`에 `RE_BW` + `detectCapitalRaise`의 `isBw` 분기(kind="신주인수권부사채"), `scripts/fetch_capital_details.py`에 `fetch_bw`(`bwbdIsDecsn.json`, 종목당 유증+CB+BW 3회), UI 보라 배지 2곳(`StockDisclosures.tsx`·`DisclosureExplorer.tsx`). `capitalDetails.ts`는 일반적이라 무변경.
  - SECONDARY: 단일계약(single_contract) 본문 파싱 착수. 신설 `scripts/fetch_contract_details.py`(§18.2 `document.xml` 다운로드→계약금액·직전매출비율 추출 오프라인 스캐폴드) + 신설 `src/lib/contractDetails.ts`(`enrichContract`, contract-signals.json 없으면 graceful no-op). `enrichContract`를 두 disclosure 라우트의 최외곽 래퍼로 합성.
- Copy safety: 신규 문자열은 발행규모·계약금액(억원)·직전매출 대비 비율(%) 등 사실 숫자만 — 투자 자문/호재·악재 판단어 없음. verify_metrics 금칙어 게이트 무충돌.
- What passed: `verify_metrics.py`(138종목·금칙어 0, exit 0), `npm run build`(타입게이트·138종목 프리렌더), 서버 청크 `.next/server/chunks/5337.js`에 `신주인수권부사채`·`계약금액`·`직전매출 대비` 존재, 로컬 5라우트 200·에러 0, 두 disclosure API 200·error null(source=sample/cache graceful no-op).
- Operator-only checks (DART 키 필요, 로컬 미실행):
  1) `python scripts/fetch_capital_details.py` 실행 → `public/data/capital-signals.json`(BW 포함) 생성. `bwbdIsDecsn` 응답의 `bd_fta`(권면총액)·`fdpp_*`(자금목적)·행사기간(`ex_pd_bgd/edd`) 필드명 실호출 검증 후 필요 시 매핑만 교정.
  2) `python scripts/fetch_contract_details.py`(DART 키) 실행 → `public/data/contract-signals.json` 생성. **본문 양식 편차가 커 `RE_AMOUNT`/`RE_RATIO`·zip 여부가 추정값** — 실보고서 1~2건 본문을 눈으로 보고 정규식 교정 필수.
- Next two concrete local tasks:
  (a) 본문 XML 스캐폴드 패턴을 correction(정정) enrich로 확장 — 정정 전후 수치 추출, contractDetails와 동일 graceful 패턴.
  (b) 공시 explorer 명료화 / 카드별 데이터 신선도(수집 기준일) 라벨 패스 — UI 전용, 빌드·렌더로 로컬 검증 가능.

### Task 31 (Pass 9) — 공시 핵심 숫자: 정정(correction) 본문 정정 전/후 (2026-06-23, Claude)
- What changed: 정정공시(`correction`) 신호에 본문 정정 전/후 핵심 수치를 사실 절로 덧붙이는 graceful enrich + 오프라인 본문 파싱 스캐폴드 추가. Pass 8(단일계약 contractDetails)과 동일한 §18.2 document.xml 파싱 패턴을 정정으로 확장.
  - 신설 `src/lib/correctionDetails.ts`(`enrichCorrection` — `correction-signals.json` 없으면 graceful no-op, ` · 정정 전 X억원 → 정정 후 Y억원`, 부호 보존·동일값 생략·null/NaN 방어) + 신설 스캐폴드 `scripts/fetch_correction_details.py`(운영 전용·로컬 미실행: list.json 정정 보고서 → document.xml → `RE_BEFORE`/`RE_AFTER`/`RE_FIELD` 추출 → `public/data/correction-signals.json`).
  - `src/app/api/disclosures/{[ticker],recent}/route.ts`에서 `enrichCorrection`을 최외곽 래퍼로 합성. UI 편집 없음.
- What passed: `verify_metrics.py`(138종목·금칙어 0, exit 0), `npm run build`(타입게이트·138 종목 프리렌더, exit 0), 공유 서버 청크 `.next/server/chunks/7381.js`에 신규 포맷(`정정 전 …억원 → 정정 후`)이 형제 절(계약금액·발행규모·취득예정)과 함께 존재, 로컬 프로덕션(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) 5라우트 200·에러 0 + 두 disclosure API 200·error null(source=sample/cache graceful no-op, 로컬에 correction-signals.json 없음).
- Operator-only blocker (DART 키 필요): 송님이 `python scripts/fetch_correction_details.py` 실행 → `public/data/correction-signals.json` 생성 후, `⚠️ operator-verify` 정규식(`RE_BEFORE`/`RE_AFTER`/`RE_FIELD`·zip 여부)을 실제 정정보고서 1~2건 본문과 대조해 매핑만 교정. 정정공시는 수치표 없이 사유만 서술하는 경우도 많아 실호출 검증 필수.
- Next two concrete local tasks: (a) 공시 explorer 카드별 데이터 신선도(수집 기준일) 라벨 패스 [UI 전용, 빌드·렌더 검증]. (b) 6개 `enrichX` lib의 공통 lazy-load·원→억원 헬퍼를 단일 util로 통합해 중복 축소 [리팩터, 타입게이트 검증].


### Task 33 (Pass 10) — 공시 enrich 공통 util 추출(중복 축소) (2026-06-23, Claude)
- Pass 9의 '다음 패스 (b)' 해소. `src/lib/signalDetailsShared.ts` 신설(`loadSignalFile`/`matchRow`/`toEok`) → `insider/treasury/capital/contract/correctionDetails.ts` 5종이 각자 갖던 lazy-load·rcept_no 매칭·원→억원 헬퍼를 위임. enrichX 시그니처·note 문자열 전부 바이트 동일, 라우트 2종 무변경(순수 내부 리팩터).
- 통과: `python scripts/verify_metrics.py`(138종목 0오류·브랜드 0, exit 0) · `npm run build`(타입게이트 통과·138p 프리렌더, exit 0) · 로컬 prod(127.0.0.1:3100) `/ /today /stocks /disclosures /stock/005930` 200·에러 0, `/api/disclosures/recent`·`/005930` 200·error null(graceful no-op 보존) · 빌드 청크에 6종 포맷 문자열 잔존.
- 남은 블로커(운영자 전용): 송님이 DART 키로 fetch 스크립트 실행 → `public/data/*-signals.json` 생성, 단일계약·정정의 `⚠️ operator-verify` 정규식 실보고서 대조.
- 다음 로컬 패스 후보: (a) 공시 explorer 카드별 데이터 신선도(수집 기준일) 라벨 — UI 전용. (b) `*Clause()` join 패턴 공통화 또는 `toEok`/`matchRow` 단위 assertion.


### Task 33 (Pass 11) — 공시 explorer 수집 기준 신선도 라벨 (2026-06-24, Claude)
- Pass 9·10이 남긴 '다음 패스 (a) 공시 explorer 카드별 데이터 신선도(수집 기준일) 라벨' 해소. /disclosures 헤더에 `수집 기준 · {KST 시각} · {출처 한글}` muted 라벨 1줄 추가. 출처 한글은 StockDisclosures의 SourceBadge와 동일(실시간/저장본/예시 표본).
- 변경: `recent/route.ts`(live·sample 분기에 `fetchedAt` ISO 추가, cache는 원시각 carry), `recentSignals.ts`(SSR twin에 source/fetchedAt → 초기 렌더 라벨 노출), `DisclosureExplorer.tsx`(ApiResponse source?/fetchedAt? + sourceKo/fmtKST 헬퍼 + 헤더 라벨, graceful 가드). detectSignals·enrich 체인·점수·신호강도 무변경, UI 레이아웃/로직 변경 없음.
- 통과: `verify_metrics.py`(138종목 0오류·금칙어 0, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0, 라벨 문자열이 disclosures 클라이언트 청크에 컴파일) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) 5라우트 200·에러 0, `/disclosures` SSR에 라벨 렌더(KST 변환 정확), `/api/disclosures/recent` 200·error null·source=sample·fetchedAt 존재.
- 남은 블로커(운영자 전용, 변동 없음): DART 키로 `fetch_*_details.py` 실행 → `public/data/*-signals.json` 생성, single_contract/correction의 `⚠️ operator-verify` 정규식 실보고서 대조.
- 다음 로컬 패스 후보: (a) 동일 신선도 라벨을 종목별 `StockDisclosures` 헤더에 적용(`[ticker]` 라우트 payload에 `fetchedAt` 추가 후 컴포넌트 헤더). (b) `signalDetailsShared.ts`의 `toEok`/`matchRow` 단위 assertion 추가 또는 6개 lib `*Clause()` ` · `-join 빌더 공통화.


### Repair — GlobalSearch hydration 경고 게이트 수정 (2026-06-24, Claude)
- Blocker: Task 33 Playwright DESKTOP 게이트가 React hydration 경고로 실패 — "Extra attributes from the server: style" at input(GlobalSearch). AppHeader(Server)→GlobalSearch(client)의 검색 input이 SSR HTML과 클라 vdom 사이 style 속성 불일치(검색 input은 브라우저/확장이 hydration 전 속성을 주입하는 대표 케이스).
- 변경: `src/components/GlobalSearch.tsx` 검색 input에 `suppressHydrationWarning` 추가(Next.js 권장). 순수 additive 1줄, 로직/스타일 무변경. MobileSearchButton의 동일 컴포넌트 인스턴스도 동시 커버.
- 통과: `npx tsc --noEmit` exit 0 · `npm run build`(타입게이트·138p 프리렌더, exit 0). ESLint는 미구성(대화형 셋업)이라 tsc/build를 확립된 finite check로 사용.
- 다음 로컬 패스 후보: (a) `[ticker]` 라우트 payload에 `fetchedAt` 추가 + StockDisclosures 헤더 신선도 라벨(Pass 11 carry). (b) GlobalSearch SSR/CSR 속성 일치 회귀 방지용 input 속성 스냅샷 메모 작성.


### Repair — Playwright 게이트 404(정적 청크) 수정: dev/prod distDir 분리 (2026-06-24, Claude)
- Blocker: Task 33 Playwright DESKTOP/MOBILE 게이트가 `_next/static` 404로 실패 — `css/app/layout.css`·`chunks/main-app.js`·`app/layout.js`·`app/not-found.js`·`app-pages-internals.js` 가 모두 404/ERR_ABORTED.
- Root cause: `npm run build`(타입게이트, prod)와 AI Center 게이트의 `next dev` 가 같은 `.next` 디렉터리를 번갈아 써서 손상. dev 서버는 unhashed dev 청크 경로(`app/layout.js`, `css/app/layout.css`)를 참조하는 HTML을 내보내지만, 디스크엔 prod-hashed 산출물(`layout-d2f87b43….js`, `css/1ae751e8….css`)만 남아 실제 청크가 없어 404. (로컬 재현: 실행 중이던 dev 서버에서 6개 자산 중 5개 404 확인.)
- 변경: `next.config.mjs` 를 phase 함수로 전환 — `PHASE_DEVELOPMENT_SERVER` 일 때만 `distDir='.next-dev'` 로 분리. prod 빌드는 distDir undefined(기본 `.next`)라 Vercel 무영향. URL 경로(`/_next/...`)도 불변. `.gitignore` 에 `.next-dev/` 추가. NEXT_BUILD_CPUS 분기는 그대로 유지.
- What passed: 새 config로 재기동된 dev 서버에서 이전 404 자산 6종 전부 200, 게이트 5라우트(`/ /today /stocks /disclosures /stock/005930`) 200·자산 404 0건. `node`로 phase별 distDir 확인(dev=.next-dev, prod=undefined). `npx tsc --noEmit` exit 0. `verify_metrics.py`(PYTHONUTF8=1) 138종목·0오류·금칙어 0, exit 0.
- 효과: build↔dev 의 `.next` 충돌 경로가 구조적으로 제거됨(build=.next, dev=.next-dev). dev distDir 은 `next dev` 만 쓰므로 prod 산출물로 오염될 수 없음.
- 다음 로컬 패스 후보: (a) `[ticker]` 라우트 payload에 `fetchedAt` 추가 + StockDisclosures 헤더 신선도 라벨(Pass 11 carry). (b) `signalDetailsShared.ts`의 `toEok`/`matchRow` 단위 assertion 추가.


### Task 36 (Pass 12) — 종목별 StockDisclosures 수집 기준 신선도 라벨 (2026-06-24, Claude)
- What changed: Pass 11이 /disclosures explorer에 추가한 '수집 기준 · {KST} · {출처}' 신선도 라벨을 종목 상세의 종목별 공시 카드에도 동일 적용(Pass 11 carry-over (a) 해소).
  - `src/app/api/disclosures/[ticker]/route.ts`: live payload + sample 폴백 반환에 `fetchedAt: new Date().toISOString()` 추가. cache 분기는 저장 payload spread로 자동 carry. detectSignals·enrich 체인·scoring·count 무변경.
  - `src/components/StockDisclosures.tsx`: `ApiResponse.fetchedAt?` + `sourceKo`/`fmtKST`(DisclosureExplorer와 바이트 동일, timeZone=Asia/Seoul) 헬퍼 + 헤더 아래 muted 라벨 1줄. 둘 다 없으면 graceful null.
- What passed: `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0 exit 0) · `npx tsc --noEmit` exit 0 · `npm run build`(타입게이트·138p 프리렌더 exit 0, `수집 기준`이 `stock/[ticker]` 클라 청크에 신규 컴파일) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) 5라우트 200·에러 0, `/api/disclosures/005930` 200·error null·source=sample·**fetchedAt 존재**·count 4, `/api/disclosures/recent` 200·error null·fetchedAt 존재.
- Gate note: 이 저장소엔 Playwright config/스크립트 부재 → AI Center DESKTOP/MOBILE 게이트 로컬 미가용. curl smoke로 /stock/[ticker] 하이드레이션/404 회귀 없음 확인으로 대체.
- Operator-only blocker(변동 없음): DART 키로 `fetch_*_details.py` 실행 → `public/data/*-signals.json` 생성 전엔 enrich 수치·source=live 미노출(graceful no-op). single_contract/correction `⚠️ operator-verify` 정규식은 실보고서 대조 필요.
- Next two local tasks: (a) `signalDetailsShared.ts`의 `toEok`/`matchRow` 단위 assertion 추가. (b) 6개 `*Clause()` enrich 빌더의 ` · `-join 패턴 공통 빌더 추출.


### Task 14 — 홈 첫 화면 개편 1차 (탐색 대시보드) (2026-06-24, Claude)
- What changed: 홈(`src/app/page.tsx`)을 설계서 `ornscore_home_redesign_spec_v1.md` 1차 범위대로 '오늘의 투자 탐색 대시보드'로 개편. 신규 `src/components/home/*`(HomeHero·MarketSnapshotCards·TopCandidateSection/StockCandidateCard·DisclosureSignalSection/DisclosureSignalCard·HowItWorksSection·RiskNotice) + `src/lib/homeSnapshot.ts`(volumeSpikeCount 프록시). 데이터 계산은 page.tsx 서버사이드 단일 소스 유지, plain props 전달. WelcomeOnboarding·metadata·revalidate·푸터 보존.
- Decisions: (1) volumeSpikeCount = `flowStats.ratio>=1.5` 프록시(폴백 `flow>=75`), 교체 용이하게 격리. (2) 공시 분류 신뢰도 숫자 미표시(strength는 유형별 상수 — 날조 대신 고지 문구만). (3) 콘텐츠 폭은 기존 `max-w-5xl` 셸 유지(설계서 1180px는 셸과 충돌해 강제 안 함). (4) `/stocks` 딥링크는 `?theme=`만 지원 → 일반 링크, Phase-2 후속.
- Verified: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목·금칙어 0, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0) · 로컬 prod(127.0.0.1:3000) 5라우트 200·에러 0, 홈 SSR에 신규 카피·후보5·공시3 렌더. 금칙어(추천종목/매수후보/상승가능성/급등예상/수익기대) grep 0.
- Gate note: Playwright 미구성 → AI Center 브라우저 게이트 로컬 미가용. curl smoke + SSR grep 대체. **운영자: AI Center 브라우저 체크(http://127.0.0.1:3000) 실행 권장**(히어로/4스냅샷/5후보/3공시/CTA/고지/모바일 오버플로).
- Risks: volumeSpikeCount 프록시·공시 per-건 신뢰도 실값 부재(고지 대체)·enrich 수치는 DART 키 fetch 후 노출(graceful no-op).
- Next concrete task: Phase 2 — (a) 후보 카드 hover 인터랙션, (b) `/stocks` score80 필터·거래활성도 정렬 URL 파라미터 + 스냅샷 카드 딥링크, (c) 실 거래량 급증 데이터 소스로 homeSnapshot 교체.### Task 15 — OrnScore 종목 상세 결론 카드 1차 (Phase 1) (2026-06-24, Claude)
- What changed: 종목 상세(`src/app/stock/[ticker]/page.tsx`) 상단을 단순 정보 나열에서 '결론 카드'로 개편(설계서 `ornscore_stock_detail_conclusion_card_spec_v1.md` 1차 범위). 기존 `<header>`+'결론 헤드라인' 섹션을 신규 `StockConclusionHero`로 교체. breadcrumb·JSON-LD·StockTabs(요약/재무/공시/점수 근거)·generateStaticParams·revalidate 전부 보존.
  - 신규 `src/components/stock/*`: StockConclusionHero(컴포저) + StockHeader(업종태그·종목명·코드+가격/액션 슬롯) + PriorityScoreCard(탐색 우선도 N/100·전체/업종 순위·완성도·이상값·산식버전) + ConclusionSummaryCard(현재 결론 유형+요약+주의점) + StrengthWarningPanel(강점/주의 2열·모바일 스택) + NextActionButtons(공시/재무/점수근거/업종비교 앵커).
  - 신규 `src/lib/conclusion.ts`: `classifyConclusion()` — 4지표+급등률로 비자문 종목 유형/요약/주의점 생성(설계서 §6.3, 강점>=70·주의<50). LivePrice·관심/비교/공유 버튼은 슬롯으로 주입(클라 컴포넌트 보존). isSuspect(dataWarnings)→임시 점수 회색+고지·Top제외 의미 보존.
- Decisions/residual: (1) 업종 비교 전용 탭이 없어 '업종 내 위치 보기'는 같은 업종 비교 섹션이 든 요약 탭(#summary)으로 연결 — 2차에서 전용 탭+스무스 스크롤. (2) Nice-to-have(레벨드 RiskAlertCard 전체분리·4지표 미니바·초보자 체크리스트 상단)는 광범위 리팩터 회피 위해 보류 — 급등/과열 위험 바와 강점/주의 패널로 점수-위험 분리는 충족, 초보자 체크리스트는 기존 BeginnerReading(요약 탭)에 존재. (3) 위험 경고(급등≥80/과열≥50)는 점수 카드와 분리된 별도 바로 노출.
- Verified: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /today /stocks /disclosures /stock/005930` 200·에러 0, 종목상세 SSR HTML에 탐색 우선도/현재 결론/강점/주의/4개 다음확인 버튼/2줄 고지 렌더(차트보다 먼저). 신규/변경 파일 금칙어 13종 grep 0.
- Gate note: Playwright 미구성 → AI Center 브라우저 게이트 로컬 미가용. curl+SSR grep+build로 대체. **운영자: AI Center 브라우저 체크(http://127.0.0.1:3000) 실행 권장 — 종목 상세 라우트(`/stock/005930`) 포함**.
- Next concrete OrnScore step (Phase 2, 설계서 §17 2차 개발): (a) 레벨드 RiskAlertCard 완전 분리(변동성·낙폭 단계 포함), (b) 4지표 미니바를 히어로에 추가(요약 탭 MetricStrip 중복 없이 단일 소스), (c) 업종 비교 전용 탭 신설 + 다음확인 버튼 스무스 스크롤/탭 전환 인터랙션.


### Repair — Task 15 Playwright DESKTOP 게이트 수정: WelcomeOnboarding 프리페치 abort 제거 (2026-06-24, Claude)
- Blocker: Task 15 Playwright DESKTOP 게이트가 `/stocks?_rsc=…`·`/today?_rsc=…`·`/settings/notifications?_rsc=…` 3건 `net::ERR_ABORTED`.
- Root cause: `_rsc=`(공유 토큰)는 한 페이지 렌더의 RSC 뷰포트 프리페치 배치. 홈 익명·신규 브라우저에서 `WelcomeOnboarding` 의 두 `<Link>`(Step·DesktopCard)가 trio 를 동시 프리페치 → `next dev` 최초 온디맨드 컴파일(~21s)이 끝나기 전 게이트가 진행해 in-flight 프리페치 취소 → ERR_ABORTED. Sidebar·MobileBottomNav·home/* 는 이미 `prefetch={false}` 라 무관, WelcomeOnboarding 만 누락(`/settings/notifications` 의 유일한 익명 홈 출처).
- Fix: `src/components/WelcomeOnboarding.tsx` 의 `Step`·`DesktopCard` 두 `<Link>` 에 `prefetch={false}` 추가(기존 nav 컨벤션 동일, additive 2줄). prod 프리빌드 무영향, dev 게이트의 abort 가능 프리페치 제거.
- Passed: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0 · `npm run build` 138p 0 · 로컬 prod(3100) `/ /today /stocks /stock/005930` 200·`/settings/notifications` 307(익명 리다이렉트)·에러 0 · 홈 익명 trio 프리페치 출처 grep 0건.
- Residual: Playwright 미구성 → ERR_ABORTED 소거는 게이트 재실행으로 최종 확인. Task 15 기능 무변경.
- Next concrete OrnScore step(불변): Phase 2 — (a) 레벨드 RiskAlertCard 완전 분리, (b) 4지표 미니바 히어로(단일 소스), (c) 업종 비교 전용 탭 + 다음확인 스무스 스크롤.


### Repair — Task 15 Playwright 게이트 수정: 홈 stale prod chunk 400 제거 (2026-06-24, Claude)
- Blocker: Playwright DESKTOP·MOBILE 모두 `400 .../_next/static/chunks/app/page-dfb2719986a20cdc.js — net::ERR_ABORTED`(홈 페이지 청크).
- Root cause: 환경 staleness(코드 무결함). 3000 의 `next start`(02:55 기동)가 구 `.next` 를 로드한 채 생존 → 03:12 `npm run build` 가 `.next` 를 덮어써 홈 청크 해시 변경 → 생존 서버가 구 해시 참조 HTML 내려보냄 → 디스크에 없는 청크라 400. `curl` 로 재현·확인.
- Fix(소스 무변경, 환경 정리): stale 서버 `taskkill /F` → `npm run clean`+`npm run build` 클린 재빌드 → 새 `next start -p 3000` 기동(서버=빌드 정합).
- Verified: `tsc --noEmit` 0 · `npm run build` 138p 0 · `verify_metrics.py` 138종목 0오류·금칙어 0 · 새 서버 홈 HTML 이 디스크와 동일 `app/page-eb287862a9283bf0.js` 참조·200 · `/ /today /stocks /disclosures /stock/005930` 200 · `/settings/notifications` 307 · 홈·`/stock/005930` 의 모든 `/_next/static/*` 자산 전수 200.
- Residual: prod 서버 가동 중 `.next` 재빌드 시 stale 재발 가능. 게이트 권장 = build→start 고정, 서버 중 재빌드 금지, 재실행 전 3000 잔존 `next start` 선종료. (dev 는 `.next-dev` 분리로 무관.) Playwright 미구성 → 게이트 재실행으로 최종 확인.
- Next concrete OrnScore step(불변): Phase 2 — (a) 레벨드 RiskAlertCard 완전 분리, (b) 4지표 미니바 히어로(단일 소스), (c) 업종 비교 전용 탭 + 다음확인 스무스 스크롤.


### Task 17 Repair — 신뢰 모달 포커스 가로채기 수정 (WCAG 포커스 순서) (2026-06-24, Claude)
- Blocker(리뷰 FAIL): `DataTrustModal`의 포커스 복귀 effect가 초기 마운트에서도 실행되어 모든 페이지 로드 시 헤더 트리거("데이터 기준 보기")로 키보드 포커스를 가로챔. `open` 초기값 `false` → `useEffect(()=>{ if(!open) triggerRef.current?.focus() },[open])`가 마운트 시 발화. DataTrustBar가 헤더에 전역 배치돼 앱 전체 영향(WCAG 2.4.3).
- Fix(`src/components/trust/TrustLayer.tsx`): 별도 복귀 effect 제거, 복귀 로직을 open effect의 cleanup으로 이동(true→false 전환·언마운트에서만 실행, 초기 마운트 미발화). 열림 시 닫기 버튼 포커스/닫힘 시 트리거 복귀 동작 보존. effect 2개→1개.
- Passed: `npx tsc --noEmit` exit 0. 마운트(open=false)→early-return으로 포커스 미탈취 확인. 기능·문구·레이아웃 무변경.
- Gate note: Playwright 미구성 → 운영자 AI Center 브라우저 체크 권장(모달 열기/ESC, 출처 배지 클릭, 페이지 로드 시 헤더로 포커스 안 튀는지).

### Task 17 — OrnScore 데이터 신뢰 레이어 1차 (전역 DataStatus + 신뢰 배지/모달) (2026-06-24, Claude)
- What changed: 설계서 `ornscore_data_trust_badge_spec_v1.md` 1차 범위(§23 1차). 데이터 기준일·산식 버전·상태·출처·제한·투자 고지를 **단일 `dataStatus` 소스 + 재사용 신뢰 배지**로 통합. Task 14/15/16 완료본 위에서 시작(branch `ai-center/task-17-ornscore-1` @ `5112c14`, 클린).
  - 신규: `src/lib/dataStatus.ts`(전역 단일 소스, dataMetadata 파생 — asOf 20260616·metricsVersionLabel "Metrics 2.4"·count 138·sources·notices·limits·status normal/delayed). `src/components/trust/badges.tsx`(DataStatusBadge/AsOfDateBadge/MetricsVersionBadge, 5색 톤·색상 외 단어 항상 노출). `src/components/trust/TrustLayer.tsx`(client: DataSourceBadges 클릭/포커스 툴팁·DataTrustModal ESC/닫기/포커스 관리·DataTrustBar 데스크톱/모바일).
  - 통합: `AppHeader.tsx`(기존 서브바에 MetricsVersionBadge + "데이터 기준 보기" 모달 트리거, 둘째 바 신설 안 함)·`layout.tsx` 푸터·`guide/metrics/page.tsx`(**stray `Metrics v` → "Metrics 2.4"**)·`status/page.tsx`·`PriorityScoreCard.tsx`+`stock/[ticker]/page.tsx` 전부 `dataStatus` 참조. `/stocks`는 이미 일치(무변경).
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /stocks /stock/005930 /guide/metrics /status` 200·에러 0, 5라우트 모두 "Metrics 2.4"·"Metrics v" 0건·as-of 2026.06.16 일치, 헤더 트리거·출처 사용목적 SSR 렌더. 신규/변경 파일 금칙어 grep 0.
- Note: 실데이터가 기준일로부터 6영업일 경과 → status="delayed"("갱신 지연")가 헤더/푸터/모달/`/status`에 일관 정직 표기됨(스펙의 "정상" 예시는 당일 데이터 가정). 단일 소스 상태 시스템이 의도대로 동작.
- Gate note: Playwright 미구성 → AI Center DESKTOP/MOBILE 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: AI Center 브라우저 체크(http://127.0.0.1:3000) 권장** — 모달 클릭/ESC·닫기, 출처 배지 클릭 툴팁, 모바일 압축 1줄·오버플로 없음.
- Residual risks: (1) status Phase-1은 normal/delayed만 실계산(partial/limited/error 타입·메타 예약, 정적). (2) metricsEffectiveDate는 전용 필드 부재로 generatedAt 파생. (3) Nice-to-have(공시 제한 배지·백테스트 한계 배지·/status 확장·changelog·빌드 타임 버전 단언) 미착수.
- Next concrete OrnScore step (Phase 2): (a) `/disclosures` `제한 수집` 배지 + 기간 필터 툴팁, (b) `/backtest` 상단 한계 배지 4종, (c) `/status` 분리 상태 섹션 + `/guide/metrics/changelog` 스켈레톤, (d) 빌드 타임 산식 버전 일치 단언(§17.1) + partial/limited/error 실판정.

### Task 16 — OrnScore 종목 탐색 필터 UI 1차 (질문형 탐색 보드) (2026-06-24, Claude)
- What changed: 설계서 `ornscore_stock_filter_ui_spec_v1.md` 1차 범위로 `/stocks`를 '단순 필터/정렬'에서 '질문형 주식 탐색 보드'로 개편. Task 14(홈)·Task 15(종목 상세) 완료본 위에서 시작(branch `ai-center/task-16-ornscore-ui-1` @ `15a82c3`, 클린).
  - `src/app/stocks/page.tsx`: `dataMetadata·formatBizDateLong·isDataStale` import + 종목별 `r3m` + `totalCount·asOf·metricsVersion·dataStale` props. 서버사이드 계산·`?theme=`·`revalidate`·`generateMetadata` 보존.
  - `src/lib/savedSearches.ts`: `SavedSearchConfig`에 `momentumMin/flowMin/valueMin/volMin?` 추가(저장/알림 config가 새 점수-min 보존).
  - `src/components/StocksExplorer.tsx`: 헤더 카피·상시 고지·질문형 프리셋 8종 카드화(예상 결과 수·선택 상태·aria-pressed)·빠른 칩 11종(단일 선택)·현재 조건 요약 바(자연어 설명+조건 저장/알림/초기화)·정렬 optgroup 3그룹·결과 카드 강점/주의 분리(아이콘+텍스트)·결과 없음 강화·상세 필터 ORNSCORE 지표 슬라이더. 순수 `matchesConfig`/`presetCounts`(전체 풀 독립) 분리. 기존 기능(저장검색·알림·테마 딥링크·바텀시트·상세 필터) 전부 보존, 기본 결과셋 동일.
- Verified: `npx tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0 · `npm run build` 138p 0(`/stocks` 11.8 kB) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /stocks /today /disclosures /stock/005930` 200·에러 0, `/stocks` SSR 신규 카피 전수 렌더, `?theme=2차전지`(인코딩) 200·테마칩·테마 describe 문장. 신규/변경 파일 금칙어 13종 grep 0.
- Gate note: Playwright 미구성 → AI Center DESKTOP/MOBILE 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: AI Center 브라우저 체크(http://127.0.0.1:3000, `/stocks` 포함) 권장** — 질문 카드 그리드/선택/요약 바/강점·주의 분리/정렬 그룹/모바일 1열 스택/터치 타겟.
- Residual: (1) /stocks 클라 컴포넌트(초기 SSR·인터랙션 CSR). (2) presetCounts = 그 프리셋만 적용 시 N개(현재 활성 필터와 무관, '예상 결과'로 표기). (3) 빠른 칩 단일 선택(다중 AND 다음 태스크). (4) 변동성·낙폭 정렬 보류(필드 미전달).
- Next concrete OrnScore step: 설계서 §24 2차 — (a) 탐색 모드 탭(질문/지표/직접)+보기 방식(카드/표/압축), (b) 빠른 칩 다중 선택 AND + 칩 변경 시 실시간 예상 결과 수, (c) 결과 없음 자동 완화 제안, (d) 변동성·낙폭 정렬용 volStats(annualStd·maxDrawdown)를 page.tsx에서 전달.

### Task 21 — Repair: MetricBar 막대 색 누락 수정(런타임 Tailwind 클래스 합성 제거) (2026-06-24, Claude)
- Blocker(TESTER FAIL): 정식 게이트 전부 통과했으나 `MetricBar`가 `text-*` 토큰을 런타임 `.replace(/text-/g,"bg-")`로 막대색을 합성 → Tailwind 정적 스캔이 `bg-*` 리터럴을 못 잡아 빌드 CSS에서 누락. 라이트모드 60~79(sky) 무색(홈 후보 카드)·다크모드 대부분 구간 무색.
- Fix: `src/lib/scoreColor.ts` `ScoreColor`에 `barFill`·`barTrack`(bg-* 리터럴) 추가(4구간×라이트/다크 명시). `src/components/ui/MetricBar.tsx`는 런타임 치환 제거 → `c.barFill`/`c.barTrack` 직접 사용. 단일 색 소스 유지, 점수식/데이터/공시 로직 무변경.
- Passed: `tsc --noEmit` 0 · `npm run build` 138p 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·산식 2.4 · 빌드 CSS에 8개 구간 bg 클래스 전수 존재(다크 `:is(.dark *)` 변형 포함) · 로컬 prod(3100) `/ /stocks /stock/005930 /guide/metrics` 200 · 렌더 홈 HTML에 60~79 막대 `bg-sky-500`/`bg-sky-400` 실제 출력.
- Residual: 없음(스타일 한정). 향후 점수 시각화는 scoreColor 리터럴 토큰 사용, 런타임 클래스 합성 금지.

### Task 24 — Repair: /stocks Playwright 게이트 stale prod chunk 400 (2026-06-25, Claude)
- Blocker(게이트 FAIL): DESKTOP·MOBILE 둘 다 `400 .../static/css/e1593cd0a575ab11.css`·`400 .../chunks/app/stocks/page-60397daaa5cf26e3.js — ERR_ABORTED`.
- Root cause: 코드 결함 아님(Task 15 와 동일 환경 staleness). 3000 의 고아 `next start`(PID 27200, 부모 종료됨)가 구 `.next` 를 메모리 보유, 디스크 `.next` 는 재빌드로 청크 해시 변경(css `e1593→d1665`, stocks `page-60397→page-7d957`) → 서버가 내려주는 HTML 의 청크가 디스크에 없어 400.
- 검증(소스 무변경): `tsc` 0 · `npm run build` 0(`/stocks` 13.9 kB·138p) · `verify_metrics.py`(UTF8) 138종목 0오류·금칙어 0·산식 2.4 · 빈 포트 3255 신 빌드 검증 → `/stocks` 200·참조 css `d1665…`·js `page-7d957…` 전수 200·보기모드 마커(카드형/표형/종합점수) SSR 렌더·`/ /today /stock/005930` 200·에러 0(검증 PID 19724 만 종료, 3000·4310 무중단).
- Recovery completed by Codex: stopped only the stale 3000 `next start` PID 27200, restarted port 3000 as PID 23992, and verified `/stocks` 200 with no stale chunk references plus `카드형`/`표형`/`종합점수` markers. 4310 was not stopped.
- 재확인(2026-06-25 2차, Claude): 동일 근본원인 독립 재현. 3000 HTML 여전히 `e1593…css` 참조 → 그 정적파일 HTTP 400, 디스크는 `d1665…css`. 재빌드 시 **청크 해시 결정적**(css `d1665…`·stocks `page-7d957…` 동일 재현, BUILD_ID 만 `P8OEan1fVsQXP9mgHYcRo`→`P4JMdwoo5Sw79SCG2maMe` 갱신) → 3000 재시작만 하면 HTML·정적 정합 보장. 빈 포트 3252 신 `next start` 검증: `/stocks` 200·참조 css/js 전수 200·`tsc` 0·`build` 0(138p, `/stocks` 13.9 kB)·`verify_metrics`(UTF8) 138종목 0오류·금칙어 0·산식 2.4. 검증 PID 9800 만 종료, 3000·4310 무중단.
- Task 24 Phase 4(보기 모드/히트맵 표·조건 요약·빈상태) 기능 코드 무변경 — 환경 정리 완료, AI Center DB reconciled next.
