# 오른스코어 안정화·고도화 PROGRESS

## 2026-07-07 · [codex] Sprint 3 종목 상세 대표 신호·최근 변화 정리
- **범위**: 첨부된 `ORNScore 디자인/UX 대공사 개발 지시서` 5장 종목 상세 첫 슬라이스. 점수식·데이터 조회·공시 수집 로직은 그대로 두고, 상단에서 사용자가 먼저 읽는 신호를 줄이고 최근 변화 요약을 추가.
- **상단 신호 축소**: `현재 이 종목은` 카드의 `좋은 점/확인할 점`은 각각 대표 1개만 먼저 노출하고, 추가 신호는 `외 n개는 지표 상세에서 확인`으로 낮춤. 대표 신호는 강점은 점수 높은 순, 확인 지표는 약한 점수 순으로 표시 전용 정렬.
- **점수 카드 개선**: `탐색 우선도` 카드의 점수 링을 줄이고, 카드 안에 `대표 강점`과 `먼저 볼 지표`를 추가해 기본 노출이 `종합점수 + 대표 강점 1개 + 대표 확인 지표 1개` 흐름이 되게 정리.
- **최근 변화 요약**: hero 아래에 `최근 변화` 섹션을 추가. 기존 `scoreHistory`/`priceHistory`에서 전일 대비 종합 점수, 거래활성도 변화, 3개월 수익률을 표시하고, 최근 공시는 `공시 탭`으로 연결. 원격 점수 이력이 비어도 `점수 이력 부족`으로 graceful하게 표시.
- **검증(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138종목/오류0/금칙0/Metrics 2.4 · `npm run build` 0(176 static pages) · local prod 4461 `verify:routes` 9/9 · `smoke:check --all` 23/23 · `git diff --check` clean(LF→CRLF 경고만) · 변경 파일 U+FFFD 0. 인앱 브라우저 확인: 390x844 `/stock/005930` 핵심 라벨 표시, recent card visible after scroll, horizontal overflow 없음, 콘솔 에러 0. 데스크톱 1280x900 핵심 라벨 표시, horizontal overflow 없음.
- **다음에 바로 실행할 작업**: Sprint 3 후속. 종목 상세의 `요약` 탭에서 주가 차트/4지표 상세/초보자 해석/데이터 기준/업종 비교의 순서를 설계서 5장 흐름에 맞춰 더 압축한다. 특히 4지표 상세 카드는 기본 접힘 또는 `대표 신호 → 상세 펼치기` 구조로 바꾸고, 공시/재무/비교 CTA가 실제 탭 이동과 더 잘 맞는지 확인.

## 2026-07-07 · [codex] Sprint 2 발견 화면 진입 흐름 정리
- **범위**: 첨부된 `ORNScore 디자인/UX 대공사 개발 지시서` 4장 `/stocks` 발견 화면. 데이터·점수식·후보 산출·공시 로직은 그대로 두고, 첫 진입 질문형 프리셋, 검색 하단 진입점, 모바일 상세 필터 동선만 정리. 브랜치 `codex/ornscore-sprint1-ia-home-20260707`.
- **질문형 프리셋**: 첫 화면 프리셋을 설계서 문구에 맞춰 5개로 압축: `싸 보이는 종목`, `최근 관심이 늘어난 종목`, `흐름이 강한 종목`, `배당/안정형 종목`, `숨은 소형주`. 카드 심볼은 텍스트 이모지 대신 `lucide-react` 아이콘으로 교체하고, 각 카드의 조건/예상 결과/주의 문구는 기존 필터 엔진에 그대로 연결.
- **검색 진입점**: 검색창 아래에 가로 스크롤 quick entry 칩을 추가. `관심종목` 바로가기, 최근 검색(localStorage, Enter/blur 시 저장), 최근 본 종목(`recentViews`), 대표 후보(종합점수 상위)를 한 줄에서 바로 열 수 있게 연결. 검색 결과·저장 조건·알림 로직은 기존 동작 유지.
- **모바일 필터**: 모바일 상세 필터를 오른쪽 드로어에서 하단 바텀시트로 변경. `role="dialog"`/`aria-modal`/타이틀 연결을 추가하고, 88svh 높이 제한+내부 스크롤+하단 `초기화/보기` 액션을 유지.
- **검증(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138종목/오류0/금칙0/Metrics 2.4 · `npm run app:check` 0(Android assetlinks 외부 WAIT 1 only) · `npm run build` 0(176 static pages) · local prod 4461 `verify:routes` 9/9 · `smoke:check --all` 23/23 · `git diff --check` clean(LF→CRLF 경고만) · 변경 파일 U+FFFD 0. 인앱 브라우저 확인: 390x844 `/stocks` 5개 질문/진입 칩 표시, horizontal overflow 없음, 필터 바텀시트 bottom-aligned/height OK/콘솔 에러 0. 1280x900 확인: 5개 프리셋 카드와 진입 칩 표시, horizontal overflow 없음.
- **다음에 바로 실행할 작업**: 설계서 5장으로 이동. `/stock/[ticker]` 종목 상세 상단을 `현재 해석 → 강점/주의 → 먼저 확인할 것 → 공시/재무/비교 CTA` 흐름으로 다시 점검하고, 점수 영역의 기본 노출을 종합+강점1+약점1 중심으로 줄이며 최근 변화/비교 유도 섹션을 설계서 기준으로 보강.

## 2026-07-07 · [codex] Sprint 1 IA + 홈 첫 화면 브리핑 정리
- **범위**: 첨부된 `ORNScore 디자인/UX 대공사 개발 지시서`의 Sprint 1/P0 첫 묶음. 데이터·점수식·후보 선정·공시 수집 로직은 그대로 두고 IA, 홈 첫 화면, 후보 카드, 데이터 상태 노출 강도만 정리. 브랜치 `codex/ornscore-sprint1-ia-home-20260707`.
- **IA 변경**: 모바일 하단 탭을 `오늘/발견/관심/공시/더보기` 순서로 고정. 데스크톱/모바일 드로어의 1차 메뉴도 `오늘/발견/관심/공시`로 줄이고, 비교·실험실(백테스트)·서비스 안내·도움말·서비스 소개는 더보기 그룹으로 이동. `/stocks` 사용자-facing 명칭은 `발견`으로 변경.
- **홈 변경**: 큰 소개형 히어로를 짧은 일일 브리핑으로 축소하고, 첫 섹션을 `오늘 먼저 볼 후보` 3개로 이동. 첫 방문 온보딩은 후보 뒤로 내림. 후보 카드는 가격/등락·종합 점수·한 줄 요약·강점 1개·먼저 확인할 것·체크포인트 2개·`종목 보기/관심/비교` CTA를 포함하되, 관심/비교는 compact 아이콘 버튼으로 줄여 모바일 390px 첫 화면에 1위 카드가 하단 탭 위까지 완전히 들어오게 조정.
- **데이터 상태**: 헤더 하단 데이터 상태 바를 작은 pill 형태로 축소하고 기존 상세 모달 접근은 유지. 홈 하단 기능 카드의 `백테스트` 노출도 `실험실` 톤으로 낮춤.
- **검증(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138종목/오류0/금칙0/Metrics 2.4 · `npm run app:check` 0(Android assetlinks 외부 WAIT 1 only) · `npm run build` 0(176 static pages) · `git diff --check` clean · local prod 4477 `verify:routes` 9/9 · `verify:login-preflight` 5/5 · `smoke:check --all` 23/23. 인앱 브라우저 390x844 확인: 하단 탭 `오늘/발견/관심/공시/더보기`, horizontal overflow 0, 1위 후보 카드 bottom 732 < bottom nav top 788. 데스크톱 1280x800 확인: 백테스트는 1차 메뉴에서 빠지고 `더보기 > 실험실`.
- **다음에 바로 실행할 작업**: Sprint 2로 넘어가 `/stocks` 발견 화면의 질문형 프리셋을 지시서 문구에 맞춰 강화하고, 상세 필터를 모바일 바텀시트 중심으로 정리. 가능하면 최근 검색/최근 본 종목 진입점도 함께 연결.

## 2026-07-06 · [codex] 디자인 토큰·컴포넌트 규칙 문서화
- **범위**: 디자인/UX 재검수 4~5장 및 `이번 주 안에 하면 좋은 작업` 6번. 런타임 UI 변경 없이 현재 코드의 색·타입·카드·버튼·배지·빈 상태 규칙을 문서로 고정. 소스 UI/데이터/점수식/copy source 무변경, 신규 npm 0.
- **산출물**: 신규 `docs/ornscore-design-tokens-component-rules-2026-07-06.md`. 현재 토큰 소스(`globals.css`, `tailwind.config.ts`, `controlStyles.ts`, `trust/badges.tsx`, `ScoreGauge`, `MetricChip`, `disclosureType`)를 명시하고, 색상 의미(상승/하락 색 제한, 공시 타입 중립색), 타입 스케일, radius/spacing, 카드 순서(종목 후보·상세 상단·공시·백테스트·빈 상태), CTA/입력/칩 규칙, 배지/카피 규칙, 추출 후보(`EmptyStatePanel`, `ActionButton`, `DataBasisInline`, `DisclosureCardShell`, `ScoreSummaryCard`)와 지연 후보를 정리.
- **크로스레퍼런스**: `docs/ornscore-spec-coverage.md`의 라이트/디자인 토큰 항목에 이번 문서 링크를 추가. 현재 운영 규칙은 완료로 고정하되 브랜드 리뉴얼/팔레트 전면 교체는 여전히 제품 결정(④)으로 남김.
- **게이트(문서 스케일, 전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138·오류0·금칙0·Metrics 2.4 · 신규/편집 문서 U+FFFD 0 · `git diff --check` 클린. 앱 소스 무변경이라 build/smoke 생략.
- **다음 액션**: 설계서의 "이번 주 안에 하면 좋은 작업" 1~6은 문서화까지 마감. 다음은 제품 큐에서 관심 종목 CSV 반출 전용 슬라이스(Task 221 §6) 또는 탐색 필터 감각화 마감 중 하나를 고르는 것이 자연스러움.

## 2026-07-06 · [codex] 빈 상태 화면 디자인 개선
- **범위**: 디자인/UX 재검수 3-6/3-7 다섯 번째 슬라이스. `/watchlist`와 `/compare`의 빈 상태를 첫 방문자가 다음 행동을 고르기 쉽게 정리. 관심/비교 저장 로직·점수·데이터·검색 컴포넌트 동작 무변경, 신규 npm 0.
- **변경**: 관심 종목 빈 상태를 `아직 담은 종목이 없어요.` 중심의 부드러운 문구로 바꾸고, `오늘 후보에서 담기`를 primary CTA, `종목 직접 찾기`를 secondary CTA로 재배치. 직접 검색은 `바로 검색해서 담기` 보조 행동으로 유지하고, 로그인/로컬 저장 안내는 카드 하단 supporting copy로 낮춤. `/watchlist` noscript fallback도 같은 문구/CTA 순서로 맞춤.
- **비교 UX**: `/compare` 헤더가 이제 종목 상세뿐 아니라 직접 검색으로도 시작할 수 있음을 말함. 비교 빈 상태는 검색 박스를 첫 행동으로 유지하되, 프레임을 가볍게 정리하고 `비교하면 이런 걸 볼 수 있어요` 미리보기(종합 점수 차이, 추세/밸류/위험조정 강점, PER/PBR/ROE, 수익률·테마)를 추가. 현재 결과 화면에 공시 비교 표는 없으므로 공시 신호는 `관심 종목과 공시 화면에서 이어서 확인`하는 보조 문구로 과장 없이 처리.
- **게이트(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138·오류0·금칙0·Metrics 2.4 · `npm run build` 0(176 static pages) · `git diff --check` 클린 · 변경 4파일 U+FFFD 0 · 로컬 prod `verify:routes -- --base http://localhost:4473` 9/9 OK · `smoke:check -- --base http://localhost:4473 --all` 23/23 OK. HTML 추출에서 `/watchlist` fallback의 `아직 담은 종목이 없어요/오늘 후보에서 담기/종목 직접 찾기`, `/compare` fallback의 `종합 점수 차이` 확인.
- **제한/다음 액션**: 인앱 브라우저 클라이언트 렌더 검증은 webview attach 타임아웃으로 완료하지 못함(Playwright 의존성은 설치하지 않음). 로컬 prod 4473 서버와 임시 로그는 정리 완료. 다음 슬라이스는 설계서의 `이번 주 안에 하면 좋은 작업` 흐름상 디자인 토큰/컴포넌트 규칙 문서화가 자연스러움.

## 2026-07-06 · [codex] 백테스트 상단 위험 요약 강화
- **범위**: 디자인/UX 재검수 3-5 네 번째 슬라이스. 백테스트 상단에서 `+34.1%`, `+346.1%` 같은 수익 숫자가 먼저 눈에 들어오는 문제를 줄이고, 성과 보장 아님·위험·벤치 비교를 KPI보다 먼저 읽히게 정리. 백테스트 데이터·계산·차트 무변경, 신규 npm 0.
- **변경**: `BacktestClient`에 활성 전략 기준 `먼저 읽기` 요약 카드를 추가해 `이 백테스트는 성과 보장이 아니에요` → `가격 기반 과거 시뮬레이션` → `수익 · 연복리 수익률(CAGR)` / `위험 · 최대낙폭(MDD)` / `비교 · 위험조정 Sharpe` 순서로 노출. 기존 KPI 라벨도 `CAGR (연복리)`에서 `연복리 수익률(CAGR)`, `MDD (최대낙폭)`에서 `최대낙폭(MDD)`, `Sharpe (위험조정)`에서 `위험조정 성과(Sharpe)`로 풀어 씀. 각 용어에는 짧은 `title` 설명을 붙임.
- **게이트(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138·오류0·금칙0·Metrics 2.4 · `npm run build` 0(176 static pages) · `git diff --check` 클린 · 로컬 prod `verify:routes -- --base http://localhost:4472` 9/9 OK · `smoke:check -- --base http://localhost:4472 --all` 23/23 OK. `/backtest` SSR 추출에서 `성과 보장이 아니에요`, `연복리 수익률(CAGR)`, `최대낙폭(MDD)`, `Sharpe는 벤치보다 낮음`, `미래 수익률을 검증한 결과가 아닙니다` 확인.
- **제한/다음 액션**: 인앱 브라우저 픽셀 스크린샷은 수행하지 않음. 다음 슬라이스는 설계서 순서상 빈 상태 화면 디자인 개선.

## 2026-07-06 · [codex] 공시 카드 시각 체계 정리
- **범위**: 디자인/UX 재검수 P1-1/5-3 세 번째 슬라이스. 홈 공시 신호, `/disclosures` 카드, 종목 상세 공시 탭의 공시 카드 언어를 `공시 유형/제출일/자동분류 → 회사명/공시명 → 확인 포인트 → DART 원문` 흐름에 맞춤. 공시 수집·분류·점수·데이터 무변경, 신규 npm 0.
- **변경**: `disclosureType`의 타입별 초록/보라/청록/주황/빨강 규칙을 중립 슬레이트 계열로 교체해 공시 유형이 호재/악재처럼 보이지 않게 조정. 홈 공시 카드는 공통 타입 메타/아이콘을 사용하고 `자동분류`·회사 코드·원문 아이콘을 노출. `/disclosures` 리스트는 공시명을 본문 앞쪽으로 올리고 확인 포인트를 항상 노출하며, 주의 문구는 중립 보조 정보로 낮춤. 종목 상세 공시 탭도 유형/날짜 → 공시명 → 확인 → `DART 원문` 순서로 재배치. 요약 5카드는 색 면적 대신 숫자 농도와 라벨로 구분.
- **게이트(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138·오류0·금칙0·Metrics 2.4 · `npm run build` 0(176 static pages) · `git diff --check` 클린 · 로컬 prod `verify:routes -- --base http://localhost:4471` 9/9 OK · `smoke:check -- --base http://localhost:4471 --all` 23/23 OK. HTML 추출에서 홈 공시 카드가 `자동분류/확인 포인트/DART 원문` 순서로 보이고, `/disclosures`에도 자동분류·확인·원문 흐름 및 `호재/악재` 문구 미노출 확인.
- **제한/다음 액션**: 인앱 브라우저 픽셀 스크린샷은 이번에도 수행하지 않음. 종목 상세 공시 탭은 클라이언트 지연 로딩이라 SSR 추출에는 전체 카드가 잡히지 않지만 컴포넌트 구조는 동일하게 정리. 다음 슬라이스는 설계서 순서상 백테스트 상단 위험 요약 강화.

## 2026-07-06 · [codex] 종목 상세 상단 요약 카드 리디자인
- **범위**: 디자인/UX 재검수 P1-1/3-3 두 번째 슬라이스. 종목 상세 상단에서 `현재 결론`을 주 카드로 올리고, `좋은 점`/`확인할 점`/`먼저 확인`을 한 카드 안에 묶음. 점수식·후보 선정·데이터·순위 계산 무변경, 신규 npm 0.
- **변경**: `StockConclusionHero`의 모바일/데스크톱 순서를 `종목명/가격 → 현재 결론/좋은 점/확인할 점 → 점수·순위 → 다음 확인`으로 변경. `ConclusionSummaryCard`에 강점/확인 목록을 통합하고, `PriorityScoreCard`는 76px 점수 링+전체/업종 순위+하단 `데이터 신뢰` 배지로 축소. 급등/상승폭 문구는 `riskAlert`와 `먼저 확인`에만 남겨 `확인할 점` 반복을 제거. 미사용 `StrengthWarningPanel`/전용 copy 삭제.
- **게이트(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138·오류0·금칙0·Metrics 2.4 · `npm run build` 0(176 static pages) · `git diff --check` 클린 · 로컬 prod `verify:routes -- --base http://localhost:4470` 9/9 OK · `smoke:check -- --base http://localhost:4470 --all` 23/23 OK. `/stock/005930` SSR 추출에서 `좋은 점=추세/위험조정`, `확인할 점=거래활성도 약함/밸류 약함`, `먼저 확인` 급등 문장, `데이터 신뢰` 배지 확인.
- **제한/다음 액션**: 인앱 브라우저 attach 문제로 픽셀 스크린샷 검증은 수행하지 못함. 다음 슬라이스는 설계서 순서상 공시 카드 시각 체계 정리가 자연스러움.

## 2026-07-06 · [codex] 홈 후보 카드 정보량 축소
- **범위**: 디자인/UX 재검수 P1-1/3-1의 첫 슬라이스. 홈 `오늘 추가 확인 후보` 카드에서 가격·일간 등락·3M 수익률·4지표 막대 상세를 제거하고, 홈에서는 `종목명/업종/티커 → 점수 링 → 강점 2개 → 먼저 확인할 것 1개 → 종목 보기`만 남김. 점수식·후보 선정·데이터·랭킹 로직 무변경, 신규 npm 0.
- **변경**: `src/components/home/StockCandidateCard.tsx`에서 `MetricBar` 상세 블록과 가격/등락/3M 라인을 제거, 점수 링을 84px→72px로 축소, 주의 라벨을 `먼저 확인할 것`으로 바꿔 카드 목적을 행동 중심으로 전환. `src/lib/copy/home.ts`의 후보 섹션 intro/rankCriteria를 짧은 해요체로 줄이고 `firstCheck` 카피 추가(ko/en).
- **게이트(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138·오류0·금칙0·Metrics 2.4 · `npm run build` 0(176 static pages) · `git diff --check` 클린 · 로컬 prod `verify:routes -- --base http://localhost:4469` 9/9 OK · `smoke:check -- --base http://localhost:4469 --all` 23/23 OK. SSR 섹션 추출에서 후보 카드가 `강점`/`먼저 확인할 것` 중심으로 렌더되고 `3M`은 미노출 확인.
- **제한/다음 액션**: 인앱 브라우저가 webview attach 타임아웃으로 두 번 실패해 픽셀 스크린샷 검증은 못 함(서버는 정리 완료). 다음 슬라이스는 종목 상세 상단 요약 카드 리디자인: 상단에 `현재 결론/좋은 점/확인할 점`을 더 강하게, 데이터 품질·Metrics 배지는 하단 신뢰 영역으로 낮추는 방향.

## 2026-07-06 · [codex] 디자인/UX 재검수 P0 visible-date 가드 + 로그인 혜택 정리
- **범위**: 외부 재검수 리포트 `C:\Users\dongy\OneDrive\바탕 화면\ornscore_design_ux_reaudit_2026-07-06.md` 기준으로 공개 배포 직후 P0/P1 초입을 확인. 브랜치 `codex/ornscore-design-ux-reaudit-p0-20260706`. 공개 visible text 기준 `/`, `/stocks`, `/stock/005930`, `/login?next=/watchlist`, `/watchlist`, `/compare`, `/status` 모두 `2026.07.03` 노출·`2026.06.30` 미노출·AI/Anthropic 미노출로 P0 날짜/AI 표면은 배포 후 해소 확인.
- **변경**: `scripts/verify-routes.mjs`를 보이는 텍스트 기준으로 강화(script/style/noscript 제거 후 검사). 대표 라우트를 6개에서 9개로 확장(`/login?next=/watchlist`, `/watchlist`, `/compare` 추가), `/stocks`·`/stock/005930`에도 기준일 필수화, visible `2026.06.30`/`2026-06-30`/`20260630` 및 `AI 분석`/`AI 분석 기록`/`Anthropic` 노출을 실패로 처리. 가격 히스토리 JSON 안의 과거 날짜가 visible 기준일 검사를 통과시키거나 오탐시키는 문제를 막음.
- **로그인 UX**: `src/lib/i18n.ts`와 `src/app/login/LoginContent.tsx`에서 로그인 혜택을 리포트 권장처럼 3개로 축소: 관심 종목 여러 기기 이어보기, 비교 목록 저장하기, 관심 종목 공시 알림 받기. `Bot` 아이콘/기록 보관 뉘앙스를 제거해 AI 숨김 정책과 정렬.
- **게이트(전부 통과)**: `npx tsc --noEmit` 0 · 공개 `npm run verify:routes -- --base https://ornscore.com` 9/9 OK · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138·오류0·금칙0·Metrics 2.4 · `npm run build` 0(176 static pages) · 로컬 prod `verify:routes -- --base http://localhost:4468` 9/9 OK · `verify:login-preflight -- --base http://localhost:4468` 5/5 OK · `smoke:check -- --base http://localhost:4468 --all` 23/23 OK · 로그인 HTML 직접 확인: 새 3혜택 true, `AI 분석 기록`/`AI 분석`/`Anthropic` false.
- **다음 액션**: 이번 리포트의 P1 본 작업은 홈 후보 카드 정보량 축소와 종목 상세 상단 요약 카드 리디자인이 1순위. 모바일 하단 네비는 이미 `오늘/종목찾기/공시/관심 + 더보기` 구조라 추가 변경 전 390px 실기기에서 밀도만 확인.

## 2026-07-06 · [codex] OrnScore main 배포 승인·pre-push 게이트
- **범위**: 사용자가 "일단 배포하자"로 main 반영/공개 배포를 명시 승인. 현재 배포 후보 브랜치 `ai-center/task-221-ornscore-watchlist-groups-memo-csv-s` 기준으로 `git fetch origin` 후 `origin/main...HEAD = 0 116`, `origin/main`이 HEAD의 조상임을 확인해 fast-forward 가능 상태로 판정.
- **pre-push 게이트(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138종목·오류0·금칙0·Metrics 2.4 · `npm run app:check` 0(실 Android `assetlinks.json`은 외부 지문 게이트로 WAIT 1) · `npm run build` 0(176 static pages) · 로컬 prod `smoke:check --all` 23/23 OK · `verify:routes -- --base http://localhost:4459` 6/6 OK · `verify:login-preflight -- --base http://localhost:4459` 5/5 OK · `perf:check` 0 advisory warnings.
- **직접 확인**: 390x844 브라우저에서 `/`, `/stocks`, `/stock/005930`, `/status`, `/pricing`, `/login?next=/watchlist`, `/watchlist` 가로 오버플로우 0·콘솔 에러 0·`베타 안내`/한국어 전용 상태 OK. 공개 `https://ornscore.com`의 6개 대표 라우트도 cache-busted `verify:routes` 통과(배포 전 기준).
- **남은 배포 후 확인**: main fast-forward 후 `origin/main` push, Vercel 반영 대기, 공개 `verify:routes`/로그인 상태 재확인. 공개 Android `/.well-known/assetlinks.json`은 404 상태라 Android 앱 링크는 배포와 별도 오너 SHA-256 지문 게이트.

## 2026-07-06 · [claude] Task 221 — OrnScore 관심 그룹·메모·CSV 문서 우선 설계서 + 다음 큐
- **범위**: 릴리스 준비 노트(Task 215~220) 이후 **다음 제품 베팅을 착수 전에 설계서로 확정** — 다음 제품 베팅 숏리스트 **#1(관심 종목 고도화: 그룹·메모·CSV)** 을 구현 없이 스펙화하고 릴리스 게이트 이후 착수할 **첫 로컬 슬라이스**를 지정. 브랜치 `ai-center/task-221-ornscore-watchlist-groups-memo-csv-s`. **문서 전용**·앱 소스/데이터/점수식/`direction`/`metricsVersion` 무변경·신규 npm 0·빌드 스텝 0·**신규 코드/스캐폴드 0**(설계만).
- **상류 판정(read-only, 병합 안 함)**: `git fetch origin` 후 `git rev-list --left-right --count origin/main...HEAD = 0 114`(HEAD 114 앞·0 뒤·상류 누락 0). codex 통합 라인 `codex/ornscore-main-data-integration-20260705`는 브랜치로 잔존하나 **더 이상 HEAD 아님**(Task 215~220으로 `38cbba4`까지 전진). 로컬 커밋만·미push·미배포.
- **소스 진실 확인**: `src/lib/watchlist.ts`(이중 저장 `localStorage`↔Supabase `watchlists`·`ornscore_watchlist`+레거시 폴백·`watchlist-changed` 이벤트·`WatchlistItem{ticker,addedAt}`)·`savedSearches.ts`(`crypto.randomUUID`·`slice(0,30)` 캡·`saved_searches` config JSON — 그룹/메모가 재사용할 표준)·`recentViews.ts`(10 캡)·`WatchlistClient.tsx`(하이드레이션 가드·실행취소·44px). `Grep`로 **CSV 유틸 부재 확인**.
- **산출물**: 신규 `docs/ornscore-watchlist-groups-memo-csv-spec.md` — §0 무료 KO 베타 불변식+로컬 우선/프라이버시 배너·§1 현 상태 감사·§2 데이터 모델(그룹 `{id,name}`+아이템 `groupId`·메모 500자·이중 저장/캡/이벤트 재사용)·§3 CSV 컬럼 계약(`ticker,name,group,note,addedAt,compositeScore`·표시용 스냅샷·비자문)·§4 MVP(반출 전용+인라인 그룹+메모)/후속(가져오기·rename·동기화) 분리·§5 프라이버시 리스크(클라이언트 Blob 다운로드만·UTF-8 BOM·CSV 수식 인젝션 방역·PII 유도 0·금칙어 리뷰)·§6 **첫 슬라이스=CSV 반출 전용(Effort S·오너 게이트 0)**·§7 검증 게이트·§8 교차참조.
- **크로스레퍼런스(append-only)**: `docs/ornscore-spec-coverage.md` §2 8.2 행에 Task 221 포인터 1줄 append(Task 160/196 스타일). 편집 `PROGRESS.md`·`docs/AI_HANDOFF.md`.
- **게이트(문서 스케일, 전부 통과)**: `npx tsc --noEmit` 0(앱 소스 무변경 재확인) · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138·오류0·금칙0·Metrics 2.4 · 신규/편집 `.md` U+FFFD 0 · `git diff --check` 클린. 문서 전용이라 build/smoke 생략(Task 215·219·220 관행) — 직전 초록 = 2026-07-06 codex smoke 23/23.
- **다음 액션(개발, 릴리스 게이트 이후)**: 설계서 **§6 첫 슬라이스 = 관심 종목 CSV 반출 전용**(`src/lib/watchlistCsv.ts` 순수 유틸 + `WatchlistClient` 내보내기 버튼·§5 방역·BOM)을 다음 로컬 task로 구현. 그룹/메모 스키마·Supabase 마이그레이션은 그 다음. push/deploy/Supabase DDL은 오너 몫.

## 2026-07-06 · [claude] Task 220 — OrnScore 사이트 새로고침 모니터링 + 롤백 노트
- **범위**: 릴리스 라인을 **되돌릴 수 있고(reversible) 관찰 가능하게(observable)** 만드는 첫 노트 — 오너가 외부 사이트를 새로고침한 **직후** 무엇을 즉시 확인하고, 언제 롤백하며, 무엇을 `PROGRESS.md`에 남길지를 한 문서에 고정. 브랜치 `ai-center/task-220-ornscore-release-rollback-and-monito`. **문서 전용**·앱 소스/데이터/점수식/`direction`/`metricsVersion` 무변경·신규 npm 의존성 0·빌드 스텝 0·**신규 스크립트 미추가**(과설계 회피 — 자동 관찰성은 기존 `verify:routes`+`smoke:check --all`로 충분).
- **상류 판정(read-only, 병합 안 함)**: `git fetch origin` 후 `git rev-list --left-right --count origin/main...HEAD = 0 112` → origin/main에 HEAD가 놓친 커밋 0(통합할 상류 없음)·HEAD 112 앞. codex 통합 라인 `codex/ornscore-main-data-integration-20260705`(tip `dbb24e0`)는 HEAD에 **포함되나**(`merge-base --is-ancestor` 참) 더 이상 HEAD 아님 — 이 브랜치가 Task 215~219로 `5784bb6`까지 전진. 로컬 커밋만·미push·미배포.
- **산출물**: 신규 `docs/ornscore-site-refresh-monitoring-rollback-2026-07-06.md` — §0 무료 베타 불변식 배너+상류 노트·§1 새로고침 직후 즉시 확인(§1.1 자동 `npm run verify:routes -- --base https://<owner-URL>` 6라우트[상태·로컬 파생 기준일 `2026.07.03`·무료 베타 프레이밍·stale `요금제`/`기능 비교` 부재·KO/EN 토글 부재, `exit 1`=멈춤→§2] · §1.2 자동 `npm run smoke:check -- --all --base …` 23라우트 · §1.3 수동 하드리로드 패스[상태/기준일·`/login` 진입 문맥·`/pricing` "지금은 무료 베타예요"·KO/EN 토글 부재] · §1.4 오너 제공 URL 슬롯 표)·§2 롤백 트리거→액션 표(치명마커/5xx/stale기준일/유료프레이밍재부상/KO-EN누출/로그인깨짐⇒롤백, 경미⇒모니터+기록)+안전 롤백 노트(Vercel promote 또는 `git revert -m 1 <merge-sha>` 후 재배포, `public/data/*`·점수식·`direction`·`metricsVersion` 무접촉, 오너 전용)·§3 PROGRESS 캡처 목록(verify:routes pass/fail+`expectedDate`·smoke `--all` 요약·데스크톱+390px 스크린샷 4×2·배포 URL+시각+배포ID/SHA·콘솔 에러·keep/roll-back 결정+revert SHA)·§4 남은 오너 승인(배포/새로고침·OAuth 왕복·URL 제공·promote/revert)·§5 신규 스크립트 미추가 근거.
- **크로스레퍼런스(append-only)**: `docs/ornscore-spec-coverage.md` §O(QA 체크리스트) 행에 Task 220 포인터 1줄 append.
- **게이트(문서 스케일, 전부 통과)**: `npx tsc --noEmit` 0(앱 소스 무변경 재확인) · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138종목·오류0·금칙0·Metrics 2.4 · 신규/편집 4파일 U+FFFD 0 · `git diff --check` 클린. 문서 전용이라 build/smoke/perf 생략(Task 215·219 docs-only 관행) — 직전 초록 = 2026-07-06 codex smoke 23/23 유효.
- **다음 액션(오너 게이트)**: 오너가 §4 승인(배포/새로고침·URL 제공)을 통과시킨 뒤 배포 URL로 §1.1→§1.2→§1.3을 돌려 초록 확인, `exit 1`·§2.1 트리거 시 §2.2 안전 절차(promote 또는 `git revert -m 1`)로 롤백 결정, 결과를 §3 목록대로 `PROGRESS.md`에 기록. push/deploy/promote/revert-배포·OAuth 왕복은 전부 오너.

## 2026-07-06 · [claude] Task 219 — OrnScore 실기기 390px 릴리스 QA 런북
- **범위**: 남은 실기기 390px 오너 게이트를 **묻지 않고 실행 가능**하게 — 무료 베타 공개 전 오너가 실 모바일(390×844)에서 혼자 통과시키는 라우트별 육안 체크리스트를 신설. 브랜치 `ai-center/task-219-ornscore-real-device-local-release-q`. **문서 전용**·앱 소스/데이터/점수식/`direction`/`metricsVersion` 무변경, 신규 npm 의존성 0, 빌드 스텝 0, **신규 브라우저/DOM 스크립트 추가 안 함**(과설계 회피 — SSR 자동검증은 기존 `smoke:check --all`+`verify:routes`가 커버).
- **상류 판정(read-only)**: `git fetch origin` 후 `git rev-list --left-right --count origin/main...HEAD = 0 110` → HEAD가 origin/main보다 110 앞·0 뒤(놓친 커밋 0). codex 통합 라인 `codex/ornscore-main-data-integration-20260705`는 브랜치로 잔존하나 HEAD 아님(Task 215~218로 전진). 로컬 커밋만·미push.
- **소스 진실 확인(문서 드리프트 방지)**: `StockTabs.tsx:53` 탭 바 `sticky top-0 z-10` · `AppHeader.tsx:65` 헤더 `sticky top-0 z-40` → 스크롤 시 탭 바 헤더 뒤 가려짐(occlusion) 재확인. `dataStatus.ts` 기준일 표기 `YYYY.MM.DD`(`20260703`→`2026.07.03`). `public/data/stocks.json` = `count 138 · asOfBusinessDate 20260703 · metricsVersion 2.4` 불변식 확인.
- **산출물**: 신규 `docs/ornscore-real-device-390px-qa-2026-07-06.md` — §0 무료 베타 불변식 배너(138·`2026.07.03`·KO 전용·AI 숨김·`/pricing` "지금은 무료 베타예요"·금칙어 0)·§1 자동 프리-패스(build→`npx next start -p 4464`→`smoke:check --all` 23/23→`verify:routes`, 초록 베이스라인부터 육안 시작)·§2 실기기 셋업(실 390px폰 또는 DevTools 390×844·다크/라이트·콘솔)·§3 **7라우트 표**(`/`·`/stocks`·`/stock/005930`·`/status`·`/pricing`·`/login?next=/watchlist`·`/watchlist`) 각 [기대 화면 한국어 앵커 / 모바일 레이아웃 리스크 / 합격·불합격 노트]·§3 고위험 `StockTabs.tsx:53` sticky occlusion **A(헤더높이+safe-area 오프셋)/B(sticky 제거) 오너 실기기 결정**·§4 완료 기준·§5 신규 스크립트 미추가 결정 근거·§6 교차 참조(post-release §7/§8·mobile-viewport-followup·local-release-handoff §5·launch-observability·route-smoke-checklist).
- **크로스레퍼런스(append-only)**: `docs/ornscore-spec-coverage.md` §O(QA 체크리스트) 행에 Task 219 포인터 1줄 append.
- **게이트(문서 스케일, 전부 통과)**: `npx tsc --noEmit` 0(앱 소스 무변경 재확인) · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138종목·오류0·금칙0·Metrics 2.4 · 신규/편집 3파일 U+FFFD 0 · `git diff --check` 클린. 문서 전용이라 build/smoke/perf 생략(레포 관행) — 직전 초록 게이트 = 2026-07-06 codex 라인 smoke 23/23 유효.
- **다음 액션(오너 게이트)**: 오너가 §1 자동 프리-패스를 먼저 돌려 초록 확인 → 신규 문서대로 390px 실기기 육안(7라우트·다크/라이트) 1회 → `/stock/005930`의 StockTabs sticky를 실기기에서 A/B 결정(후속 로컬 task로 반영 가능). push/deploy/외부 서비스는 전부 오너.

## 2026-07-06 · [claude] Task 218 — Android assetlinks 외부 WAIT → 오너 실행 체크리스트
- **범위**: `app:check`의 유일한 외부 `WAIT`(Android `assetlinks.json` 미생성)를 **가짜 라이브 파일 없이** 오너가 따라할 수 있는 한 장짜리 실행 키트로 전환. 브랜치 `ai-center/task-218-ornscore-android-assetlinks-owner-ch`. 앱 소스/데이터/점수식/카피 무변경, 신규 npm 의존성 0, 빌드 스텝 0. `public/.well-known/assetlinks.json` **생성 안 함**(실 지문 확보 전까지 오너 게이트 유지).
- **상류 판정(read-only)**: `git fetch origin` 후 `git rev-list --left-right --count origin/main...HEAD = 0 108` → origin/main에 HEAD가 놓친 커밋 0. codex 통합 라인 `codex/ornscore-main-data-integration-20260705`는 더 이상 HEAD 아님(Task 215~217로 전진). 로컬 커밋만·미push.
- **변경(신규 1 + 편집 5)**:
  - 신규 `docs/ornscore-android-assetlinks-owner-kit.md` — SHA-256 획득 3경로((a)Play Console 앱 무결성→앱 서명 키 지문[업로드 키 아님] (b)`keytool -list -v -keystore <경로> -alias <별칭>`의 `SHA256:` 줄 (c)Bubblewrap/PWABuilder) → 32바이트 콜론·대문자 정규화 → `npm run app:assetlinks -- --package com.ornscore.app --fingerprint "<실제>"`(`--dry-run` 먼저) → `app:check` `0 external gates waiting` → 배포 후 `https://ornscore.com/.well-known/assetlinks.json` 200·주소창 숨김. **자리표시자 vs 실값 가드** 섹션(`REPLACE_WITH_REAL_...`·더미 `AB:AB:...`·`com.example.ornscore`는 실값 아님).
  - 편집 `docs/ornscore-android-twa-owner-checklist.md` §3 + `docs/app-packaging-final-checklist.md` + `docs/app-packaging-readiness.md` §3 — 각 1줄로 키트를 "단계별 실행법"으로 상호 링크(`check-app-packaging.mjs`가 단언하는 기존 문자열 무변경).
  - 편집 `scripts/generate-assetlinks.mjs` — `fingerprint===REPLACE_WITH_REAL_SHA256_FINGERPRINT` 또는 `packageName===com.example.ornscore`일 때 키트를 가리키는 타깃 에러 + 비영(非零) 종료(기존 자리표시자 거부·`--dry-run` 유효 JSON 단언 유지).
  - 편집 `scripts/check-app-packaging.mjs` — 키트의 핵심 단계(`keytool -list -v`, 생성 명령)를 `includes`로 회귀 가드. WAIT 분기·pass 라인 무변경.
- **게이트(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138·오류0·금칙0·Metrics 2.4 · `npm run app:check` **여전히 통과·`1 external gate waiting`**(WAIT 문서화 유지) · `npm run build` 0 · 음성 확인: 자리표시자 패키지+더미 지문 → 새 타깃 에러·`exit 1`·파일 미생성 · `git diff --check` 클린 · 신규/편집 파일 U+FFFD 0. 앱 라우트 소스 무변경이라 smoke 생략(docs/scripts-only; 직전 Task 217 smoke 23/23 유효). 포트 무기동(4310 무접촉).
- **다음 액션(오너 게이트, 남은 유일한 실값 단계)**: 실제 앱 서명 키 SHA-256 확보 → `npm run app:assetlinks -- --package com.ornscore.app --fingerprint "<실제>"` → `npm run app:check`(`0 external gates waiting`) → 배포 후 라이브 assetlinks 200·TWA 주소창 숨김 확인. 상세는 `docs/ornscore-android-assetlinks-owner-kit.md`. push/deploy/콘솔은 전부 오너.

## 2026-07-06 · [claude] Task 217 — OAuth 로컬 프리플라이트 (제출 없음·콘솔 무접촉)
- **범위**: OAuth 릴리스 리스크 중 **레포 내부에서 판정 가능한 부분**만 자동화/문서화하고, **실제 로그인 왕복은 오너 게이트로 명확히 분리**. 실제 제공자 제출·계정 입력·계정 생성·외부 콘솔 변경 일절 없음. 브랜치 `ai-center/task-217-ornscore-oauth-local-preflight-no-ac`. 앱 소스/데이터/점수식/`direction`/auth 플로우 무변경, 신규 npm 의존성 0, 빌드 스텝 0.
- **상류 판정(read-only)**: `git fetch origin` 후 `git rev-list --left-right --count origin/main...HEAD = 0 106` → origin/main에 HEAD가 놓친 커밋 0(통합할 상류 없음). **통합 라인 주의**: codex 통합 브랜치 `codex/ornscore-main-data-integration-20260705`(tip `dbb24e0`)는 더 이상 HEAD가 아님 — 이 태스크 브랜치가 Task 215·216 커밋으로 그 위(`7d4e609`)까지 전진. 로컬 커밋만·미push.
- **감사(auth 표면, 불일치 0)**: `login/page.tsx`·`login/LoginContent.tsx`·`lib/auth/providers.ts`·`lib/auth/returnPath.ts`·`auth/callback/route.ts`·`i18n.ts loginCopy` 전수. (a) 라벨 드리프트 없음(UI는 i18n `loginCopy.providers[id]` 사용, providers.ts와 일치) (b) 활성/예정 id(`kakao`·`google`·`custom:naver`·`apple`) 전부 i18n 항목 + 브랜드 SVG 커버 (c) 콜백이 `safeInternalPath`로 `next` 정규화 + 성공 시 `welcome=1`, no-code→`auth_callback_no_code`·교환실패→`auth_callback_failed`를 friendly 한국어로 (d) **핵심 발견**: `/login`이 **Dynamic(`ƒ`) 라우트**라 `useSearchParams()`가 서버에서 해석 → 폼(버튼·문맥·에러) 전체가 SSR HTML에 렌더(스켈레톤 아님). 그래서 헤드리스 브라우저 없이 `fetch`만으로 게이트 가능. **수정 필요한 레포 내부 불일치 없음** → 코드 변경 없이 프리플라이트 아티팩트만 추가.
- **로컬 UI 상태 확인(제출 없음)**: `npx next start -p 4463`(고유 고포트, 3000/4310 아님)에서 `/login`·`?next=/watchlist`·`?next=/compare`·`?next=/stock/005930`·`?error=auth_callback_no_code&next=/watchlist` SSR HTML 검사. 카카오/구글 활성 버튼·네이버 `설정 필요` 비활성·이전 페이지 문맥(`관심 종목을…`/`비교 목록을…`)·contextFallback(`로그인하면 저장한…`)·friendly 한국어 에러(`앱에서 로그인 후 돌아오지 못했어요`)·raw 제공자 문구(`provider is not enabled`) **부재**·`lang="ko"`·KO/EN 토글 부재 전부 확인. 제공자 최종 제출은 클릭하지 않음.
- **변경(신규 2 + 편집 1)**:
  - 신규 `scripts/verify-login-preflight.mjs` — 순수 Node ESM(`fetch`만, 의존성 0). 5개 `/login` 상태에 대해 위 SSR-안정 단언(활성 버튼·`설정 필요`·상태별 문맥/에러 카피·raw 제공자 문구 부재·`lang="ko"`·토글 부재)을 검사, 실패·미접속 시 `exit 1`. **비공개 값 출력 0**(env 미열람·HTML 본문 미출력, 라우트/상태/사유만). `--login-path` 오버라이드로 음성 자체점검 지원.
  - 신규 `docs/ornscore-oauth-preflight-checklist.md` — 레포 내부 자동 체크(A1~A10) vs **오너 게이트(B1~B6: 실제 카카오/구글/네이버 왕복·매직링크 이메일·`/auth/callback` return-to-`next`+`welcome=1`)** 명시 분리. 클릭 후 인터랙티브 상태(`oauth_redirecting`·`sending/sent`·라이브 Supabase 에러)는 하이드레이션 이후라 오너 브라우저 패스 필요라고 못박음.
  - `package.json` — `"verify:login-preflight": "node scripts/verify-login-preflight.mjs"` 1줄.
- **게이트(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138·오류0·금칙0·Metrics 2.4 · `npm run build` 0 · `npm run smoke:check -- --base http://localhost:4463 --all` **23/23**(`/login`·`/watchlist` 포함) · `npm run verify:login-preflight -- --base http://localhost:4463` **5/5 OK·exit 0** · 음성 확인 `--login-path /about`(MSYS_NO_PATHCONV=1) → HTTP 200이나 콘텐츠 단언 전부 FAIL·**exit 1**(게이트가 실제로 실패 가능함 증명) · `git diff --check` 클린 · 신규/편집 파일 U+FFFD 0. 포트 안전: 4463 PID(23592)만 종료, AI Center 4310 LISTENING 유지.
- **오너가 수동으로 해야 할 것(OAuth 왕복 = 오너 게이트)**: (1) 실제 `/login` 카카오·구글 왕복 로그인, (2) 네이버는 Supabase Custom OAuth `custom:naver` + Naver Developers 설정 후 `NEXT_PUBLIC_ENABLE_NAVER_LOGIN=true`로 켠 뒤 왕복, (3) 매직링크 이메일 실제 수신, (4) `/auth/callback`이 `next`(예 `/watchlist`)로 `welcome=1`과 함께 복귀. 상세는 `docs/ornscore-oauth-preflight-checklist.md` §B. push/deploy/콘솔 변경은 전부 오너.
- **다음 액션(오너)**: 배포 스택에서 `npm run verify:login-preflight -- --base http://localhost:<port>`로 SSR 계약 재확인 후, 위 B1~B6 실브라우저 왕복 1회 통과하면 OAuth 릴리스 리스크 해소.

## 2026-07-06 · [claude] Task 216 — 캐시버스트 라우트 검증 헬퍼 (의존성 0)
- **범위**: 배포 후 수동으로 돌리던 "사이트 새로고침 캐시버스트 라우트 점검"(handoff §4)을 **기억에 의존하지 않는 재사용 로컬 헬퍼**로 자동화. 브랜치 `ai-center/task-216-ornscore-cache-busted-route-verifica`(codex 통합 라인 포함, tip 유지). 앱 소스/데이터/점수식/카피 무변경, 신규 npm 의존성 0, 빌드 스텝 추가 0.
- **상류 판정(read-only)**: `git fetch origin` 후 `git rev-list --left-right --count origin/main...HEAD = 0 104` → origin/main에 HEAD가 놓친 커밋 0(통합할 상류 없음). 캐리포워드 라인 그대로 이어감.
- **변경(신규 1 + 편집 4)**:
  - 신규 `scripts/verify-routes.mjs` — 순수 Node ESM(`node:fs`/`node:path`/`node:url` + 전역 `fetch`만). `--base <url>`(기본 `http://localhost:4461`, 환경변수 `VERIFY_BASE_URL`, 플래그 우선) + `--data <path>`(기본 레포 `public/data/stocks.json`). 기대 데이터 기준일을 **로컬 데이터에서 파생**(`realStocks.ts`의 `deriveBusinessDate` 미러 → `YYYY.MM.DD`, 파생 불가 시 즉시 실패). 요청마다 캐시버스트(`?v=<Date.now()>`, 기존 쿼리 처리) + `cache-control:no-cache`·`pragma:no-cache`·`expires:0`·`redirect:manual`. 6개 대표 공개 라우트(`/ /status /about /pricing /stocks /stock/005930`)에 대해 (a)상태 200 (b)치명 마커 0 (c)데이터 기준일·콘텐츠 앵커 존재 (d)stale 유료 카피(`요금제`/`기능 비교`) 부재 (e)KO/EN 토글 부재(`hreflang`/`lang="en"`/`LanguageSwitcher` 없음 + `lang="ko"` 존재)를 단언. 라우트별 OK/FAIL 표 + 실패 사유 출력, 하나라도 실패·서버 미접속 시 `exit 1`, 전부 통과 시 `exit 0`.
  - `package.json` — 관례(`smoke:check`/`perf:check`) 따라 `"verify:routes": "node scripts/verify-routes.mjs"` 1줄만 추가.
  - `docs/ornscore-route-smoke-checklist.md`·`docs/ornscore-local-release-handoff-2026-07-06.md` §4 — 이 헬퍼를 수동 체크리스트의 **자동화 형태**로 상호 링크.
- **게이트(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138·오류0·금칙0·Metrics 2.4 · `npm run build` 0 · 로컬 prod(`npx next start -p 4461`)에서 `npm run verify:routes -- --base http://localhost:4461` **6/6 OK**(expectedDate `2026.07.03`) · 음성 확인: `--data`에 잘못된 날짜(20250101) → `/`·`/status` FAIL·`exit 1`, 미접속 포트 → `exit 1` · 회귀 확인 `npm run smoke:check -- --base http://localhost:4461 --all` 23/23 OK · `git diff --check` 클린 · 신규/편집 파일 U+FFFD 0. 포트 안전: 4461 내 PID만 종료, AI Center 4310 LISTENING 유지.
- **다음 액션(오너)**: 오너가 이 브랜치로 main 반영·Vercel 재배포 후 `npm run verify:routes -- --base https://<배포-URL>`로 §4 캐시버스트 라우트를 라이브 CDN에 대해 재확인. 이 헬퍼는 **배포된 데이터 기준일이 로컬 `stocks.json`과 일치할 때만** 초록색(그래서 stale 배포를 잡음). push/deploy/외부 액션은 전부 오너.

## 2026-07-06 · [claude] Task 215 — OrnScore 로컬 릴리스 핸드오프 팩 (docs-only)
- **범위**: 현재 릴리스 통합 브랜치를 오너/다음 에이전트가 채팅 기록 없이 이어받아 배포까지 갈 수 있도록 로컬 핸드오프 팩을 작성. **문서 전용·앱 소스/데이터/점수식 무변경**. 외부 서비스 액션 미수행. 브랜치 `ai-center/task-215-ornscore-local-branch-sync-guard-and`.
- **상류 판정(read-only)**: `git fetch origin` 후 `git rev-list --left-right --count origin/main...HEAD = 0 102` → **origin/main에 HEAD가 놓친 커밋 0 = 지금 통합할 상류 데이터 없음**. `git merge-base --is-ancestor origin/main HEAD` 참(origin/main이 HEAD 조상). codex 통합 브랜치 `codex/ornscore-main-data-integration-20260705` tip == HEAD `dbb24e0`. 최신 데이터 커밋 `1ca2401`(2026-07-03 refresh). 향후 origin/main의 `public/data/*`-only daily 커밋은 안전한 병합 후보로만 기록(이 태스크에서 병합 안 함).
- **변경(문서 3파일)**: 신규 `docs/ornscore-local-release-handoff-2026-07-06.md`(무료 베타 v1 불변식 배너·프리핸드오프 체크리스트·브랜치 통합 권고·배포 후 캐시버스트 라우트 8개·오너 게이트 4개·롤백 노트·다음 액션 한 줄). `PROGRESS.md`/`docs/AI_HANDOFF.md` 이 항목. 근거는 재서술 대신 레포 내부 문서 링크(owner-review 07-04·local-release-evidence 07-03·route-smoke-checklist·PROGRESS/AI_HANDOFF).
- **불변식**: `public/data/*`(count 138·asOf 20260703·metricsVersion 2.4)·점수식·copy·cron/auth·`direction` 무변경. 앱 소스·스크립트 0줄.
- **게이트**: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138·오류0·금칙0·Metrics 2.4 · 신규/편집 `.md` U+FFFD 0 · `git diff --check` 클린. build/smoke/perf는 앱 소스 무변경이라 재실행 생략(Task 166·177·178·194 docs-only 관행; 직전 2026-07-06 codex QA 유효).
- **남은 소유자·다음 액션**: 오너가 실기기 390px·OAuth 왕복·Android `assetlinks.json` 실지문·법무/결제 4게이트 통과 후 이 브랜치로 main 반영·배포하고 캐시버스트 재확인. push/deploy/외부 액션은 전부 오너. 로컬 커밋만·미push.

## 2026-07-06 · [codex] OrnScore 릴리스 게이트·main 반영 전 최종 점검
- **범위**: `codex/ornscore-main-data-integration-20260705` 기준으로 main 반영 전 운영 QA 게이트를 실행. `git fetch origin` 후 `origin/main...HEAD = 0 101`로 main의 daily data 누락 없음 확인.
- **변경**: `scripts/check-app-packaging.mjs` 1곳 수정. Task 192에서 `/offline`이 서버 `page.tsx` + 클라이언트 `OfflineContent` + `offlineCopy` 구조로 분리됐는데, 패키징 체크가 여전히 `page.tsx` 안의 고정 문구를 찾아 거짓 실패를 내던 것을 현재 구조에 맞게 교정했다. 앱 런타임·데이터·점수식 무변경.
- **게이트(전부 통과)**: `npx tsc --noEmit` 0 · `python scripts/verify_metrics.py` 138종목·오류0·금칙0·Metrics 2.4 · `npm run app:check` 0(단, 실제 Android SHA-256 `assetlinks.json`은 외부 오너 게이트로 WAIT 1) · `npm run build` 0(176 static pages) · 로컬 prod `npm run smoke:check -- --base http://localhost:4458 --all` 23/23 OK · `npm run perf:check -- --base http://localhost:4458` 0 advisory warnings.
- **390px 브라우저 점검**: `/`, `/stocks`, `/stock/005930`, `/status`, `/pricing`, `/login`, `/watchlist`를 390x844 viewport에서 확인. 가로 오버플로우 없음, 콘솔 에러 없음, `베타 안내` 표시, `KO/EN` 토글 미노출. `/pricing`은 "지금은 무료 베타예요" 기준, `/login?next=/watchlist`는 이전 페이지 문맥·이메일 링크·카카오/구글/네이버 진입 버튼 렌더 확인(실제 OAuth 제출은 하지 않음).
- **운영 카피 확인**: `/`, `/status`, `/about`, `/pricing`, `/stocks`, `/stock/005930`, `/login`, `/watchlist` 모두 `2026.07.03`/`07.03(금)` 데이터 기준 표시. `/pricing` 및 주요 공개 라우트에서 stale `요금제` 문구 미노출.
- **perf baseline**: base=http://localhost:4458, 3 samples, median TTFB: `/`=42ms · `/stocks`=42ms · `/today`=41ms · `/stock/034730`=21ms · `/stock/032830`=24ms · `/login`=39ms · `/pricing`=47ms · `/status`=25ms · `/disclosures`=32ms · `/backtest`=48ms · `/watchlist`=58ms · `/compare`=60ms.
- **다음에 바로 실행할 작업**: 오너가 실제 기기 390px 육안, OAuth 왕복 로그인, Android `assetlinks.json` 실서명 지문, 법무/결제 게이트를 확인한다. 이 4개가 끝나면 이 브랜치로 main 반영·배포를 진행하고 배포 후 cache-busted 공개 라우트 재확인.

## 2026-07-05 · [codex] OrnScore main daily data 통합·운영 기준 검증
- **범위**: Task 194 최신 로컬 작업 브랜치 위에 `origin/main`의 daily data refresh 커밋 2개(`d901841`, `1ca2401`)를 병합해, 공개 main의 2026-07-03 데이터와 로컬의 UI/카피/QA 개선 99커밋을 한 브랜치에 통합. 브랜치 `codex/ornscore-main-data-integration-20260705`.
- **판단**: 앞선 공개 사이트 확인에서 날짜/네비가 낡아 보인 것은 cache-busted 직접 확인 기준으로 재현되지 않았고, 실제 꼬임은 “다운그레이드”가 아니라 `origin/main` daily refresh 2커밋과 로컬 개선 브랜치 99커밋이 서로 갈라진 상태였음. 이번 브랜치는 두 흐름을 충돌 없이 합쳤다.
- **변경**: merge commit으로 `public/data/*` 최신 장마감 데이터만 대량 반영. 앱 소스·카피·QA 스크립트 개선은 Task 194 계열 상태를 보존. 수동 코드 편집 없음.
- **게이트(전부 통과)**: `npx tsc --noEmit` 0 · `python scripts/verify_metrics.py` 138종목·오류0·금칙0·Metrics 2.4 · `npm run build` 0(176 static pages) · 로컬 prod `npm run smoke:check -- --base http://localhost:4457 --all` 23/23 OK · `/`, `/status`, `/about`, `/pricing`, `/stocks` 200 및 `2026.07.03`/`베타 안내` 표시, stale `요금제`/`KO EN` 미표시.
- **다음에 바로 실행할 작업**: main 반영·배포 전 오너가 390px 실기기/OAuth 왕복/법무·결제 게이트를 최종 확인한다. main 반영이 필요하면 이 통합 브랜치 기준으로 진행하고, 배포 후 같은 5개 공개 라우트를 cache-busted로 재확인한다.

## 2026-07-04 · [claude] Task 194 — OrnScore 오너 리뷰 패키지 178~198 + go/no-go (docs-only)
- **범위**: 오너가 배치 178~198을 한 번에 리뷰하도록 종합(무엇이 바뀌었나/수동 검증/남은 리스크/한국어 무료 베타 go/no-go). **문서 전용·앱 소스 무변경**. 근거는 전부 레포 내부. 앞선 두 패키지(144~165·167~176)는 링크로만 이어붙임. 브랜치 `ai-center/task-194-ornscore-owner-review-package-and-go`.
- **변경(문서 2파일)**:
  - `docs/ornscore-owner-review-2026-07-04.md`(신규) — §1 5테마 배치 요약 표(개인화[196]·탐색공시[195]·신뢰문구[189·197]·로그인모바일[192·198]·QA게이트메타[178·190·191·193], task별 성격 docs/source·한 줄·근거) · §2 9도메인 수동 검증 체크리스트(`local-release-evidence` (f)절 재사용, 신규 태스크로 갱신·검증 명령/앵커) · §3 3축 go/no-go(A·B 로컬 GO·C 오너 게이트, 비파괴 외부/베타 GO·스토어/결제 오너 뒤) · §4 ④/⑤ 게이트 링크(신규 리스크 발명 0).
  - `docs/ornscore-spec-coverage.md` — §O(QA) 행에 Task 194 포인터 1줄 append(owner-review 07-03·177 패턴 동일).
- **발견/판단**: 실제 작업 태스크는 178·189·190·191·192·193·195·196·197·198(179~188·194는 미사용 번호). 이 구간 실질 코드 교정은 196 `recentViews.viewedAt` 타입 버그·190 OG 상속 회귀 2건뿐 — 나머지는 카피/메타/문서/스모크·무결성 가드. 코드 결함 신규 발견 0(198의 `StockTabs` sticky는 기지의 owner⑤). 앞선 dated 스냅샷 문서는 무변경(churn 회피).
- **불변식**: `public/data/*`·점수식·`compositeScore`/지표 산식·copy·cron/auth·`direction`·`metricsVersion` 무변경. 앱 소스·스크립트 0줄 변경.
- **게이트**: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138·오류0·금칙0·Metrics 2.4 · 신규/편집 .md 2파일 U+FFFD 0 · `git status` 문서만 변경(소스 0). build/smoke는 직전 QA(Task 193 `--all` 23/23·build 0) 유효 — 문서 전용이라 재실행 생략(Task 166·177·178 docs-only 관행).
- **남은 소유자**: go/no-go C축(실기기 390px 육안·OAuth 왕복·`StockTabs` sticky 오프셋·결제/법무)은 운영자·법무 게이트. 로컬 커밋만·푸시/main 무변경(푸시는 오너).

## 2026-07-04 · [claude] Task 193 — OrnScore 로컬 스모크 커버리지 확장
- **범위**: 런칭 핵심 라우트·공통 사용자 플로우의 유지보수 가능한 로컬 스모크 커버리지 확장. 취약한 스냅샷 대신 작고 견고한 검사·비로그인 플로우 포함. OrnScore 레포 로컬 한정·additive·신규 의존성 0. 브랜치 `ai-center/task-193-ornscore-local-smoke-coverage-expans`.
- **변경**:
  - `scripts/smoke-check.mjs` — 라우트별 optional `expectStatus`(기본 200) 추가, 상태 단언을 `status !== (route.expectStatus ?? 200)`으로(하위호환: 기존 라우트 전부 암묵 200 유지). `--all` 세트 12→23 확장:
    - 추가 공개 라우트 7: `/about`(서비스 소개)·`/guide/metrics`(지표 가이드)·`/guide/metrics/changelog`(산식 변경 이력, 정적 `<h1>`)·`/universe`(분석 대상)·`/terms`(이용약관)·`/privacy`(개인정보처리방침)·`/theme/battery`(2차전지, `mockData` 실존 슬러그).
    - 부정/폴백 2: `/__no_such_route__`(하드 404·앵커 `찾을 수 없습니다`) + `/stock/000000`(SSG `notFound()`→200+not-found 본문 **소프트 404**, 상태 대신 본문+무크래시 검증).
    - 비로그인 플로우 2: `/history`·`/settings/notifications`(리다이렉트/에러 없이 200으로 `로그인` CTA 렌더).
  - `docs/ornscore-route-smoke-checklist.md` — `--all` 추가 검사 표 + "부정/폴백 검사(404·무효 티커)" + "비로그인 플로우" 서브섹션 추가(`expectStatus` 시맨틱·소프트 404 설명·기본 7 유한 유지 재확인).
- **발견(코드 결함 아님)**: 무효 티커는 SSG `generateStaticParams` 라우트의 온디맨드 `notFound()` 렌더라 Next 14가 HTTP 200+not-found 본문(소프트 404)으로 내려줌(`000000/999999/ZZZZZZ` 안정 재현). 진짜 404 상태는 `/__no_such_route__`가 커버.
- **불변식**: 앱 소스·점수식·`public/data/*`·cron·auth·`direction`·`metricsVersion` 무변경(스모크 스크립트+문서 전용).
- **게이트(전부 통과)**: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONIOENCODING=utf-8) 138·오류0·금칙0·Metrics 2.4 · `npm run build` 0 · 로컬 prod(포트 4456; 4455는 기존 리스너라 미점유) `smoke:check --all` 23/23 OK·기본 `smoke:check` 7/7 무변경 · 편집 소스/문서 U+FFFD 0. 포트 정리: 내가 띄운 4456 PID만 taskkill, AI Center 4310 LISTENING 유지.
- **남은 소유자**: 실 브라우저 픽셀/OAuth 왕복은 운영자 게이트(불변). 로컬 커밋만·푸시/main 무변경(푸시는 오너).

## 2026-07-04 · [claude] Task 196 — OrnScore 저장·최근 본 종목 재방문 큐 + 상대시각 유틸 통일
- **범위**: 두·세 번째 방문에서 저장·최근 본 종목이 유용하도록(모바일 우선) 리텐션 경로 강화. OrnScore 레포 로컬 한정·소규모 검증 가능한 변경. 브랜치 `ai-center/task-196-ornscore-saved-stock-and-recently-vi`.
- **변경**:
  - `src/lib/recentViews.ts` — `RecentView.viewedAt` 타입 `string`→`number` 교정(`RecentViewTracker`가 `Date.now()` 숫자로 기록하는 것과 일치, 기존 불일치 버그). `getRecentViews` 읽기 시 `viewedAt`을 숫자/레거시 ISO 문자열 모두 `number`(ms)로 정규화(`Number`→`Date.parse`)하고 `ticker`/`name` 문자열 아님·비유한값 항목 드롭. 레거시 키(`valuemap_recent_views`) 폴백·`slice(0,10)` 캡·쓰기 형식(`RecentViewTracker`) 무변경.
  - `src/lib/format.ts` — 공통 `fmtRelativeTime(input, {locale, absolute})` 추가(Invalid Date→`—` 방어, ko `방금 전`/`N분·시간·일 전`, en `just now`/`Nm·Nh·Nd ago`, 7일+ `toLocaleDateString` 폴백 `md`=월/일·`ymd`=연/월/일). 상대시각 표기를 한곳으로 통일.
  - `src/components/WatchlistClient.tsx`·`src/components/HistoryClient.tsx` — 각자의 로컬 `formatTime` 삭제하고 `fmtRelativeTime` 채택(Watchlist=`md`+`useLanguage` locale, History=`ymd` 기본 ko). ko 렌더 출력 바이트 동일(무회귀), en은 이제 현지화.
  - `src/components/home/MyStocksSection.tsx` — `Row`에 `viewedAt?` 추가하고 최근 본 소스 행에만 실어, 해당 서브라인을 업종 대신 `최근 본 · N분 전`으로 표시(관심 종목 행은 업종 그대로). 중립 톤(매수·매도·추천 문구 0)·`mounted` 하이드레이션 가드·저장소 예외 try/catch·44px 유지.
- **불변식**: 점수식·`public/data/*`·cron·auth·`direction`·`metricsVersion` 무변경. 데이터/점수 로직 손대지 않음(표시·타입만).
- **게이트(전부 통과)**: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONIOENCODING=utf-8) 138·오류0·금칙0·Metrics 2.4 · `npm run build` 0(138 SSG 유지) · `next start`+`smoke:check --all` 12/12 200(`/`·`/watchlist` 포함) · 편집 5 소스 한글 U+FFFD 0.
- **남은 소유자**: 390px 실기기 육안·EN 토글 실확인은 운영자 게이트. 로컬 커밋만·푸시/main 무변경(푸시는 오너).

## 2026-07-03 · [claude] Task 189 — OrnScore 한국어 우선 출시 카피 정리 패스
- **범위**: 무료 한국어 베타 공개 표면 감사(혼재 언어 UI·유휴 언어 컨트롤·지표 용어 드리프트·첫 방문자 문구) + 안전 소규모 카피 수정. 근거 `ornscore-free-beta-v1-scope.md` §3~4. 브랜치 `ai-center/task-189-ornscore-korean-first-launch-copy-cl`. 선행 크래시 런(157, codex)은 `AI_HANDOFF` 자동 헤더만 남김(부분 편집 0).
- **감사 산출물**: 신규 `docs/ornscore-korean-first-copy-cleanup-2026-07-03.md`. 결론 — §1 KO/EN 토글 이미 숨김(`LanguageSwitcher` import 0·`DEFAULT_LOCALE="ko"`·EN 데이터 보존→유지), §2 혼재 언어 진짜 누수 0(‘STEP n’=Task 60 의도 디자인 토큰), §3 드리프트 Fix-now 7건, §4 첫 방문자 문구 어색 0.
- **변경(Fix-now 7 = 캐논 라벨 추세·거래활성도·밸류·위험조정 정렬)**: `app/theme/[slug]/page.tsx` 레이더 라벨(모멘텀→추세·변동성→위험조정), `app/page.tsx` meta+OG desc, `app/stock/[ticker]/page.tsx` meta+Article desc, `lib/mockStockPool.ts` 내부 `SORT_OPTIONS.label`(실 노출 라벨은 `copy/stocks.ts` 이미 캐논). Keep: `keywords` SEO 배열·글로서리 브리지("추세 (모멘텀)")·`about`·`backtest` 전략 브리지·미사용 `ScoreTooltip`·AI 프롬프트·코드 주석.
- **불변식**: 점수식·`public/data/*`·cron·auth·`direction`·`metricsVersion`·반응형 클래스 무변경. 편집 파일에 en 키 twin 없음 → i18n 패리티 영향 0.
- **게이트**: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138·오류0·금칙0·Metrics 2.4 · `npm run build` 0(138 SSG) · `next start`+`smoke:check` 7/7 200 · 홈 SSR `LanguageSwitcher`/`hreflang`/`lang=en` 0·`html lang="ko"`·‘추세’ 렌더 확인 · 편집 4 소스 U+FFFD 0.
- **남은 소유자**: 390px 실기기 육안·EN 재개 결정은 운영자 게이트. 미사용 `ScoreTooltip` 정리는 별도 스코프(defer). 로컬 커밋만·푸시/main 무변경(푸시는 오너).

## 2026-07-03 · [claude] Task 178 — OrnScore 다음 제품 베팅 숏리스트 (docs-only)
- **범위**: 폴리시 웨이브(167~177) 이후 다음에 손댈 "한 단계 큰 방향"을 오너가 고르도록 숏리스트로 정리. **문서 전용·앱 소스/코드 무변경·스캐폴드 0**. 근거는 레포 내부 설계서 항목 링크만(재서술 없음). 브랜치 `ai-center/task-178-ornscore-next-product-bet-shortlist`.
- **산출물**: 신규 `docs/ornscore-next-product-bets-2026-07-03.md` — 6베팅을 (사용자 가치×차별성÷오너 게이트)로 랭크: ①관심 그룹/메모/CSV ②데이터 설명가능성(점수 근거 심화·공시 중요도·이벤트 스터디) ③공시 전체 기간 수집 파이프라인 ④커버리지 138→500 ⑤알림 라이브 발송 ⑥Android TWA 래퍼. 각 행=Effort(S/M/L)·Risk·오너 전용 의존(④/⑤+게이트)·**지금 가능한 ③ 첫 로컬 작업**(설계/표시 노트)·근거 링크. 추천=#1 관심 고도화+#2 점수 근거 심화. 근시일 ③ 큐(owner-review §3·spec §A) 대체 아님(참고 레이어).
- **크로스레퍼런스**: `ornscore-spec-coverage.md` 요약 포인터 1줄 · `AI_HANDOFF`/`PROGRESS` Task 178(append-only).
- **게이트**: `tsc --noEmit` exit 0 · `verify_metrics.py` 138종목·오류 0·금칙어 0·Metrics 2.4 · 신규/편집 마크다운 3파일 U+FFFD 0 · `git status` 문서만 변경(소스 0). build/smoke/perf 생략(앱 소스 무변경).
- **다음 소유자**: 베팅 착수는 제품/오너 결정. #5·#6은 오너 입력값(채널 계정·서명 지문·실기기) 선결. 로컬 커밋만·푸시 미수행·main 무변경.

## 2026-07-03 · [claude] Task 177 — OrnScore 로컬 릴리스 근거 팩
- **범위**: 오너가 "외부(전문가/베타) 피드백 노출 go/no-go"를 로컬 근거만으로 판단하도록 완료 자동화·점검 라우트·남은 리스크·오너 전용 결정을 한 문서에 종합. **문서 전용·앱 소스 무변경**. 근거는 전부 레포 내부 문서/커밋에서만 인용(이미 있는 내용은 재서술 대신 링크). 브랜치 `ai-center/task-177-ornscore-local-release-evidence-pack`.
- **산출물**: 신규 `docs/ornscore-local-release-evidence-2026-07-03.md` — (a) 판단 프레임(A 치명결함=GO/B 문구·불변식=GO/C 실기기·법무=오너 게이트), (b) 오너 리뷰 이후 자동화 167~176 요약 표(144~165는 `ornscore-owner-review-2026-07-03.md` 링크), (c) 스모크 7 + 수동 11 라우트 점검 링크, (d) 남은 리스크 ③/④/⑤ 7건(생존편향·KRX 업종·관리자판·알림 라이브·공시 전기간·커버리지·결제/법무), (e) 오너 최종 체크리스트 B절, (f) 9도메인(모바일·데스크톱·로그인·관심·비교·공시·종목상세·성능·재무문구) 로컬 릴리스 체크리스트, (g) 검증 명령 게이트/권고.
- **불변식**: `stocks.json`·점수식·`direction`·인증·알림 배선·`metricsVersion` 무변경. 앱 소스 diff 0(docs만).
- **게이트**: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138·오류0·금칙0·Metrics 2.4 · 신규/변경 문서 U+FFFD 0·금칙어 신규 0. `build`/`smoke`/`perf`는 앱 소스 무변경이라 불필요(직전 QA 결과 유효).
- **추적**: `ornscore-spec-coverage.md` §1 O.QA 행 + `AI_HANDOFF.md` Task 177. 로컬 커밋만·푸시/릴리스/외부 발행 미수행(푸시는 오너).

## 2026-07-03 · [claude] Task 176 — OrnScore 회복 탄력적 폴백 상태
- **범위**: 결측·지연·제한 데이터 상태를 의도적·신뢰감 있게. 하드 제약 — repo-local 코드만·소스 데이터/점수식 무변경·전면 리라이트 금지. CSS/카피/i18n 한정. 브랜치 `ai-center/task-176-ornscore-resilient-fallback-states-p`.
- **감사(대부분 keep-as-is)**: `DisclosureExplorer`(에러 AlertTriangle+rose·빈 Inbox+완화) · `StocksExplorer`(빈·검색0건) · `WatchlistClient`(로딩→빈·로그인동기화·noscript) · `CompareClient` 빈 · `AiAnalysisCard` 에러 · `ScoreHistoryChart` <10회 · `SectorComparison` 저표본 → 이미 의도적 프레이밍 → 무변경(churn·EN 패리티 리스크 회피). 애매/사고성 카피 미발견 → 문구 무변경.
- **변경**:
  - `src/app/not-found.tsx` 다크모드 판독성 버그 수정(전 색상 `dark:` 변형·버튼 44px) + i18n. `src/app/offline/page.tsx` i18n. 둘 다 `metadata`(서버 얇은 래퍼) + `"use client"` 자식(`NotFoundContent.tsx`·`OfflineContent.tsx`)으로 분리.
  - `src/lib/i18n.ts` — `notFoundCopy`·`offlineCopy`(ko/en, `satisfies Record<Locale,...>`) 추가. "오른스코어"·"138개 종목" 프레이밍·금칙어 0 보존.
  - `src/components/StockDisclosures.tsx` 에러 브랜치를 `DisclosureExplorer`와 시각 정렬(AlertTriangle+rose 카드+`t.loadError`/`t.loadRetry`). fetch/데이터 무변경·다시시도는 `reloadKey`만.
- **불변식**: `stocks.json`·점수식·`direction`/지표 산출·기존 카피 키·cron/auth·`metricsVersion` 무변경. diff는 className/markup/i18n 한정.
- **게이트**: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138·오류0·금칙0·Metrics 2.4 · `npm run build` 0(138 SSG·`/offline`) · 변경/신규 6파일 U+FFFD 0 · `next start` curl SSR `/offline`·`/nonexistent` 한국어 기본 렌더 · 청크에 EN+KO 문자열 동거(토글 렌더 확인).
- **남은 소유자**: 실 브라우저 다크모드 육안·EN 토글 실확인은 운영자 게이트. 로컬 커밋만·푸시 미수행·main 무변경.

## 2026-07-03 · [claude] Task 175 — 라우트 카피 일관성 & 용어집 커버리지
- **범위**: score/freshness/comparison/disclosure/watchlist/caution 용어를 앱 전반에서 일관되게. 하드 제약 — repo-local 코드/문서만·비즈니스 로직 무변경·카피 간결. 브랜치 `ai-center/task-175-ornscore-route-copy-consistency-and-`.
- **표준 용어**: 프로즈=`종합 점수` 정본, 공간 좁은 표 머리글·정렬·칩·배지는 컴팩트 `종합점수` 유지(표 래핑 회귀 방지·글로서리에 예외 명시). `관심 종목`·`데이터 기준일`·`비교`·`공시 신호`·`주의`. 전 용어 비자문(매수·매도 신호 아님).
- **변경 파일(카피 문자열만)**:
  - `src/lib/copy/metricsGuide.ts` — 신규 `glossary`(ko/en 키 패리티, 10항목) + 컴팩트 예외 note. 기존 프로즈 `종합점수`→`종합 점수`.
  - `src/components/guide/MetricsGuideContent.tsx` — `#glossary` 정의 리스트 섹션 + nav 점프 링크(신규 라우트 0).
  - `src/lib/copy/{home,today,stockDetail}.ts`·`dataStatus.ts`·`BacktestClient.tsx` — 완전한 문장 프로즈만 `종합점수`→`종합 점수`(칩/캡션/aria/표 범례/배지/코멘트/LLM 프롬프트는 컴팩트 유지).
  - `src/app/privacy/page.tsx` — 표시 문구 `관심종목`→`관심 종목`(2곳, 법적 의미·저장키 무변경).
- **의도적 미변경**: `alertCatalog.ts`의 `관심종목`=`AlertCategory` 식별자(표시 라벨은 이미 `관심 종목`으로 매핑)·`stocks.ts`(표/정렬/칩 컴팩트 존). `주의사항`은 src 라우트 카피에 부재.
- **게이트(전부 통과)**: `tsc --noEmit` 0(글로서리 ko/en 패리티) · `verify_metrics.py` 138·오류0·금칙0·Metrics 2.4 · `build` 0(138 SSG) · `smoke-check --all` 12/12 200 · `/guide/metrics`·`/privacy` 200(SSR 확인) · 변경 8파일 U+FFFD 0.
- **다음 소유자**: 실기기 390px 육안(용어집 줄바꿈)·EN 언어 토글 확인=운영자 게이트. 로컬 커밋만·푸시 미수행·main 무변경.

## 2026-07-03 · [claude] Task 173 — OrnScore 모바일 인터랙션 밀도 튜닝
- **범위**: 모바일(~390px)에서 헤더·카드·배지·필터·종목상세·비교·관심이 덜 답답하되 정보 밀도 유지. 하드 제약 — repo-local 코드만·컴포넌트 단위·리버서블·데이터/로직 무변경. 브랜치 `ai-center/task-173-ornscore-mobile-interaction-density-`.
- **방법**: 4개 병렬 감사 서브에이전트로 line:className 밀도 문제 매핑 → 실제 답답한 지점만 편집(섹션 헤더 gap 미세조정 등 마진 노이즈 제외).
- **변경 파일(7) — className 여백/래핑 유틸만**:
  - `StockTabs.tsx` 탭 버튼 `py-2.5`→`py-3 sm:py-2.5`(모바일 44px 탭타깃, FOCUS_RING 보존).
  - `stock/MetricInsightCards.tsx` 4지표 카드 그리드 `gap-2`→`gap-2.5 sm:gap-3`·카드 `p-3`→`p-3 sm:p-4`.
  - `stock/StockDetailActionButtons.tsx` 액션 버튼 그리드 `gap-2`→`gap-2 sm:gap-3`(min-h-44px 보존).
  - `WatchlistClient.tsx` 분석 뷰 지표 셀 `grid-cols-4 gap-1.5`→`grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-1.5`(모바일 2×2, 4지표 전부 유지).
  - `BeginnerReading.tsx` 지표 해석 카드 `p-2.5`→`p-3`.
  - `home/StockCandidateCard.tsx` 주의 박스 `px-2.5 py-2`→`px-3 py-2.5`.
  - `home/DisclosureSignalCard.tsx` 체크 박스 `px-2.5 py-2`→`px-3 py-2.5`.
- **감사 후 무변경(이미 적정)**: `StocksExplorer` FilterPanel(space-y-5 여유)·`CompareClient` quickAdd(flex-wrap+44px)·관심 세그먼트 토글(의도적 컴팩트)·`AppHeader`/`HeaderDataBar`(truncate 가드)·`MobileBottomNav`(고정 높이)·전역 배지(다표면 파급 보류).
- **불변식**: `public/data/*`·점수식/compare.ts/matchConfig.ts·copy/i18n·cron/notify·auth·metricsVersion 무변경. diff 전부 className/layout 한정·ko/en 문자열 무변경.
- **게이트(전부 통과)**: `tsc --noEmit` 0 · `npm run build` 0(138 SSG·라우트 표 불변) · `smoke-check.mjs` 7/7 200 · `git diff` 7파일 8+/8- 전부 스페이싱 유틸·한글 주석 mojibake 0.
- **다음 소유자**: 실기기/390px 육안 시각 게이트(Playwright 미구성=운영자). 로컬 커밋만·푸시 미수행·main 무변경.

## 2026-07-03 · [claude] Task 172 — 로그아웃→로그인 연속성 폴리시
- **범위**: 저장·관심 담기·계정 게이트 동작이 로그아웃 상태에서 로그인으로 넘어갈 때 끊기지 않고 자연스럽게 느껴지게. repo-local UI/카피만, **제공자 설정·비공개 설정·`redirectTo`·콜백 로직 무변경·신규 로그인 제공자 0**. `providers.ts`·`auth/callback/route.ts`·`returnPath.ts`는 READ-ONLY로 취급(무변경). 브랜치 `ai-center/task-172-ornscore-logged-out-to-logged-in-con`.
- **변경 파일(3 소스 + i18n)**:
  - `src/lib/i18n.ts` — `commonCopy.{ko,en}.auth.syncLocalNote` 신규(관심 종목이 이 기기에 저장돼 있고 로그인 시 다른 기기로 이어짐) + `loginCopy.{ko,en}.contextFallback` 신규(내부 경로에서 온 로그인 일반 안내: 저장 상태 유지·원래 화면 복귀). `as const satisfies Record<Locale, unknown>` 유지 → tsc가 양 로케일 완전성 강제.
  - `src/components/AddToWatchlistButton.tsx` — 클라이언트 전용 로그인 판별(`createClient().auth.getUser()`, 마운트 가드, 기본 `isLoggedOut=false`라 확인 전엔 아무것도 새로 렌더 안 함 → 정적 생성 종목 페이지에 서버 인증 안 끌어들임). **로그아웃 확인된 경우에만** '관심 종목 추가됨' 토스트에 조용한 2번째 줄("이 기기에 저장됨 · 로그인하면 다른 기기에서도 이어집니다" + `next`=현재 경로(`usePathname()`+`safeInternalPath`)로 로그인 링크) 추가. 기존 토스트 타이밍(추가 2.5s/제거 5s)·실행취소·`aria-live`·44px·flex-wrap 보존.
  - `src/components/WatchlistClient.tsx` — `!isLoggedIn && watchlist.length > 0`일 때 관심 종목 섹션 상단에 부드러운(닫기·압박 없는) 정보 배너: `authCopy.syncLocalNote` + `authCopy.syncCta`(`/login?next=/watchlist`). 빈 상태 `syncCta`(기존)·목록·실행취소·점수 델타 로직 무변경. flex-wrap/break-words로 390px 대응.
  - `src/app/login/page.tsx` — `contextMsg` 선택만 변경: 정확 매칭 컨텍스트가 없어도 `next !== "/"`면 `contextFallback` 사용(예: `/stock/…`에서 온 로그인). 제공자 렌더·`friendlyAuthError`·이메일/OAuth 핸들러·`redirectTo` 무변경.
- **게이트(전부 통과)**: `npx tsc --noEmit` 0(ko/en 키 패리티) · `PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py` 138종목·오류0·금칙어0·Metrics 2.4(매수/매도/추천/수익 보장 신규 도입 0) · `node scripts/smoke-check.mjs` 7/7 OK(로컬 prod 4455) · `/login`·`/login?next=/watchlist`·`/login?next=/stock/005930` 각 200. 신규 문구 U+FFFD/모지바케 0(grep 확인).
- **다음 소유자**: 실기기 육안(390px에서 토스트 2번째 줄·배너 줄바꿈, 로그아웃↔로그인 실제 왕복, EN 토글로 로그인 페이지·관심 배너 문구 확인)은 헤드리스 미수행 → 운영자 게이트. 로그인 페이지는 클라이언트 렌더(useSearchParams Suspense)라 curl SSR엔 스켈레톤만 → 문구는 청크 번들/육안으로 확인. 푸시/릴리스 미수행(task 브랜치 로컬 커밋만·푸시는 오너).

## 2026-07-03 · [claude] Task 169 — 업종·피어 맥락 명료화 패스
- **범위**: 종목 상세·비교 화면에서 "무엇을 무엇과 비교하는지"의 기준을 초보자가 오해하지 않게 라벨·빈 상태·설명 문구만 보강. **점수 산식·소스 데이터 무변경**(표시 버그 없음). repo-local·신규 의존성 0. 브랜치 `ai-center/task-169-ornscore-sector-and-peer-context-cla`.
- **`stockDetail.ts` 카피(ko·en 키 패리티)**: `sectorComparisonCopy.legend`를 배지/막대 요약에서 **열 순서 명시**("순위 · 종목 · 종합점수(막대) · PER · 등락%")로 교체 + `basisNote` 신규(같은 업종을 실험 지표 종합점수 순 정렬한 탐색 우선순위·매수/매도 신호 아님). `sectorValue.bridgeNote` 신규 — '업종 대비 밸류'(PER/PBR 위치)와 아래 '같은 업종 비교'(종합점수 순위)가 다른 기준임을 한 줄로 구분.
- **컴포넌트 렌더**: `SectorComparison.tsx` — 라벨형 legend를 flex-wrap+break-keep로, classNote 위에 basisNote 렌더(sectorCount≥2 분기). `StockDetailIntro.tsx` `SectorValueCard` — has-score 분기(정상·저표본 공통)에 bridgeNote 렌더(빈 분기는 유지). `CompareClient.tsx` — 자체 지표 4종 헤더 아래 비교 기준 캡션 + 기본 카드 하단 "업종=오른스코어 내부 분류·KRX와 다를 수 있음" 각주(classNote 문구 미러) + 추천 세트 중 " vs " 없는(동업종) 세트에 '같은 업종' 태그. `compare/page.tsx` — 헤더 서브카피에 비교 기준(자체 지표 4종+재무+수익률·탐색용) 명시.
- **게이트**: `npx tsc --noEmit` 0(ko/en satisfies 패리티) · `PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py` 138·오류0·금칙0·Metrics 2.4 · `npm run build` 성공(/compare·/stock/[ticker] 컴파일) · `git diff --stat` 5파일만(`sector.ts`·`score.ts`·`public/data/*` 무변경 확인). 390px overflow 방지 break-keep. 전 문구 중립(매수/매도/추천/목표가 0).
- **다음 소유자**: 실기기 390px 육안(두 업종 섹션 구분·태그 줄바꿈·EN 토글)은 헤드리스 미수행 → 운영자 게이트. 푸시/릴리스 미수행(task 브랜치 로컬 커밋만·푸시는 오너).

## 2026-07-03 · [claude] Task 166 — 오너 리뷰 패키지 (배치 144~165)
- **범위**: 최근 완료된 자동화 배치(Task 144~165)를 오너가 한 번에 리뷰하고 **다음 실제 제품 우선순위**를 고르기 쉽게 종합. **문서 전용·앱 소스 무변경**(신규 기능·리팩터 0). 근거는 전부 레포 내부(`docs/AI_HANDOFF.md`·`docs/ornscore-spec-coverage.md`·`PROGRESS.md`·커밋). 브랜치 `ai-center/task-166-ornscore-owner-review-package-after-`.
- **신규 `docs/ornscore-owner-review-2026-07-03.md`**: §1 이번 배치 요약 표(A 관심·알림·개인화 / B 탐색·비교·공시 / C 신뢰·재무 문구 / D 로그인·모바일·접근성 / E QA·성능·프로세스, 각 행 한 줄 변경+근거 문서) · §2 8도메인 오너 리뷰 체크리스트(UX·데이터 신뢰·모바일·로그인·관심·알림·성능·재무 문구, 각 항목 현재 상태+검증 명령/문서·운영자 잔여 명시) · §3 다음 로컬 제안(spec-coverage A절에서 이미 ③으로 태깅된 5건만: 필터 자연어 요약줄·압축 보기·5단계 신뢰 배지 라벨 정렬·산식 버전 빌드 게이트 CI·프리셋 예상 결과 수 카드 — 신규 투기 작업 0) · §4 운영자·법무 게이트(`ornscore-owner-final-checklist`·`app-packaging-readiness`·`legal-ai-commercial-readiness` 링크만·재서술 없음).
- **게이트**: `npx tsc --noEmit` 0(소스 무변경 증명·docs만) · `python scripts/verify_metrics.py` 138종목·오류 0·금칙어 0·Metrics 2.4(앱 소스 무변경 증명) · `git diff --check` 실 whitespace 0(전역 CRLF만) · 신규/변경 문서 U+FFFD 0·금칙어(매수/매도/추천/수익 보장/목표가) 0. `build`/`smoke:check`/`perf:check` 불필요(앱 소스·라우트·`<head>` 무변경, 모바일/데스크톱 런타임 영향 0).
- **추적**: `ornscore-spec-coverage.md` §1 O.QA 행 Task 166 포인터, `AI_HANDOFF.md` Manual Notes Task 166. 푸시/릴리스 미수행(task 브랜치 로컬 커밋만·푸시는 오너).

## 2026-07-03 · [claude] Task 164 — 라우트 스모크 체크리스트 자동화
- **범위**: 로컬 QA를 기억에 덜 의존하고 빠르게. repo-local only, 신규 의존성 0, 앱 소스·데이터·점수식 무변경. 브랜치 `ai-center/task-164-ornscore-route-level-smoke-checklist`.
- **신규 게이트 `scripts/smoke-check.mjs`**: 순수 Node ESM(`fetch`만, `node:*` 외 import 0, ASCII/영어 본문+한국어 앵커만). 이미 떠 있는 로컬 prod 서버에 핵심 7라우트(`/ /stocks /stock/034730 /today /disclosures /watchlist /login`)를 각 1회 fetch → (a) HTTP 200, (b) 치명 마커 0(`Application error`/`Hydration failed`(정밀 문구—`suppressHydrationWarning` 오탐 회피)/`Cannot read properties`/`ReferenceError:`/`Unhandled`/`Minified React error`), (c) 라우트별 콘텐츠 앵커 존재(`138`/`종목`/`상위`/`오늘`/`공시`/`관심`/`카카오`). `perf:check`(권고·항상 exit 0)와 달리 **진짜 게이트**: 실패 시 OK/FAIL 표+실패 상세+`exit 1`, 서버 미도달 시 `"is the local prod server running at <base>?"` 힌트. `--base`(기본 4455)·`SMOKE_BASE_URL` env, `--all`은 추가 공개 라우트(`/compare /pricing /status /backtest /manifest.webmanifest`) 덧붙여 과거 12라우트 패스 동등(기본은 유한 7라우트).
- **`package.json`**: `"smoke:check": "node scripts/smoke-check.mjs"` 1줄만 추가(dependencies/lock 무변경).
- **신규 문서 `docs/ornscore-route-smoke-checklist.md`**(한국어): 실행법(build→전용 포트 start→smoke:check), 7라우트·앵커 증명, 치명 마커·`suppressHydrationWarning` 캐비엇, 포트 4310 무중단 가드레일. 헤드리스가 못 잡는 390px/OAuth는 `ornscore-post-release-qa-2026-07-02.md` §7/§8 교차 링크(중복 미기재).
- **검증(end-to-end)**: `npx tsc --noEmit` 0 · `npm run build` 0(138 SSG·라우트 표 무변경) · 로컬 prod **4455**(리스너 PID 10096만 `taskkill`·**AI Center 4310(PID 32452) 무중단·종료 후 LISTENING 재확인**): 7/7 OK·exit 0, `--all` 12/12 OK, 잘못된 포트(4999)→7 FAIL·힌트·exit 1 확인. `git diff --check` 0(CRLF 경고만)·신규/변경 파일 U+FFFD 0. 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).

## 2026-07-03 · [claude] Task 163 — OrnScore 로딩·스켈레톤·느린상태 폴리시
- **범위**: 느린 순간이 "고장"이 아니라 "의도된 로딩"으로 느껴지게. repo-local UI만, 데이터 패칭 계약·점수식·`stocks.json`·제3자 서비스 무변경, 신규 npm 0. 브랜치 `ai-center/task-163-ornscore-loading-and-skeleton-state-`. **스코프 7영역**: 홈·종목탐색·종목상세·오늘·공시·관심·로그인.
- **라우트 SSR 스켈레톤 4종 신규**: `src/app/loading.tsx`(홈)·`stocks/loading.tsx`·`today/loading.tsx`·`disclosures/loading.tsx`. 각 실제 페이지 상단 스캐폴드(헤더+주요 카드/그리드/목록)를 모바일·`md:` 양쪽에서 흉내 → CLS 최소화. 순수 JSX(데이터/상태/import 0), `aria-busy`+한국어 `aria-label`. 기존 `stock/[ticker]/loading.tsx`·`watchlist/loading.tsx`와 합쳐 스코프 6영역 SSR 스켈레톤 표준화(공통 토큰 `animate-pulse`·zinc·다크 변형).
- **클라이언트 스켈레톤/재시도**: `StockDisclosures.tsx` — `reloadKey` 상태 추가(DisclosureExplorer 패턴), 에러 분기에 `RefreshCw` 아이콘 44px 다시시도 버튼(`loadRetry` 카피 ko `"다시 시도"`/en `"Retry"` 신규, fetch URL `?days=90&limit=20` 무변경). `HistoryClient.tsx`·`WatchlistClient.tsx` — 맨 텍스트 로딩을 실제 레이아웃(기록 카드 3장 / 내현황 카드+목록 4행) 흉내 스켈레톤으로 교체(기존 8s 타임아웃·`loadError` 재시도 분기·`getWatchlist`/`listSavedSearches` 호출 무변경). `login/page.tsx` — Suspense 폴백 `<div>Loading...</div>`를 텍스트리스 `LoginSkeleton`(동일 `max-w-md` 컨테이너, 로케일 안정 전 렌더라 i18n 회피)으로 교체.
- **일관성 폴리시**: `DisclosureExplorer.tsx` 스켈레톤 바에 누락 `dark:` 변형 추가(다른 스켈레톤과 다크 정합). `AiAnalysisCard.tsx` 실행 버튼 `btnRunning` 앞에 `Loader2 animate-spin` 스피너(로그인 버튼과 스피너 일관). 로직/API 무변경.
- **게이트(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138종목·오류 0·금칙어 0·Metrics 2.4 · `npm run build` 0(전 라우트 컴파일, 신규 4 `loading.tsx` Suspense 경계·로그인 스켈레톤 포함). 편집/신규 파일 금칙어(`매수/매도/추천/수익 보장/목표가`) 신규 도입 0(기존 부정형 면책 문구만). (`npm run lint`은 이 레포 ESLint 미설정 = 대화형 프롬프트, build가 검증.)
- **다음 소유자**: 실기기 네트워크 스로틀 육안(390px/데스크톱에서 각 스켈레톤 CLS·44px 탭타깃)은 헤드리스 환경 미수행 → 운영자 게이트. 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).

## 2026-07-03 · [claude] Task 161 — OrnScore 로그인 + 계정 신뢰 표면 폴리시
- **범위**: 로그인이 모바일/데스크톱에서 믿음직·이해하기 쉽게. repo-local UI/카피만, 제공자 콘솔/비공개 설정 무변경, 신규 로그인 제공자 0. 브랜치 `ai-center/task-161-ornscore-login-and-account-confidenc`. **5소스**: `i18n.ts`·`login/page.tsx`·`UserMenu.tsx`·`WelcomeToast.tsx`·`WatchlistClient.tsx`.
- **i18n 계정 카피(신규)**: `commonCopy.{ko,en}.auth`에 `accountMenu`·`menuWatchlist`·`menuCompare`·`menuNotifications`·`loggingOut`·`syncCta`·`welcomeToast{title,body,close}` 추가. `legalAnd` 값에 간격 내장(ko `"과 "`/en `" and "`)해 하나의 동의-문구 템플릿이 두 로케일 모두 자연스러운 조사·간격(한글 "이용약관과 개인정보처리방침에" 붙여쓰기)으로 렌더. `as const satisfies Record<Locale, unknown>` 유지 → tsc가 양 로케일 완전성 강제.
- **로그인 페이지**: 하드코딩 `locale === "ko" ? ... : ...` 2블록(동의·"광고성 메일 안 보냄")을 `copy.legal*`·`copy.noAds/noAdsSecond` 키로 단일화(약관/개인정보 `<Link>`·스타일 동일). OAuth·이메일 버튼에 `aria-busy`+`Loader2 animate-spin` 스피너(활성 버튼만), `disabled:opacity-60 disabled:cursor-not-allowed` 비활성 시각화, 이메일 버튼 44px min-h. 인증 호출/`redirectTo`/`friendlyAuthError`/`safeInternalPath`/`sent`·error 로직 무변경(표현만).
- **UserMenu**: `useLanguage()` 소비자화·전 문구 `auth.*` 키. `isLoggingOut` 상태 — `signOut()` 진행 중 로그아웃 disable+스피너+`loggingOut` 라벨(더블클릭 방지), `router.refresh()`·Esc/외부클릭·`role=menu/menuitem`·`aria-haspopup/expanded` 유지.
- **WelcomeToast**: `useLanguage()`+`welcomeToast` 카피(title/body/close aria-label). Suspense·5s 자동소멸·`history.replaceState` URL 정리 무변경.
- **WatchlistClient**: 로그아웃 상태 동기화 CTA를 `authCopy.syncCta` 키로 로케일화(나머지 컴포넌트는 한국어 하드코딩 유지 = EN i18n 잔여).
- **게이트**: `npx tsc --noEmit` 0 · `verify_metrics.py` 138종목 위반 0(cp949 콘솔 ✅ print 트레이스백만·검증 통과) · `npm run build` 0(138 SSG·전 라우트 `/login` 5.74kB) · EN/KO 신규 문구 클라이언트 청크 번들 확인. (`npm run lint`은 이 레포 ESLint 미설정 = 대화형 프롬프트·회귀 아님, build가 검증.) 금칙어(`매수/매도/추천/수익 보장`) 0.
- **다음 소유자**: WatchlistClient 전체 i18n·실기기 OAuth 왕복·390px/데스크톱 육안 게이트(운영자). 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).

## 2026-07-03 · [claude] Task 158 — OrnScore 비교 플로우 폴리시 (결과 화면 편집 가능화)
- **범위**: 비교(compare)가 종목 선택 전·후 모두 완성된 도구로 느껴지게. 광범위 리디자인·점수식·`stocks.json`·`compare.ts` API·제3자 서비스 무변경, 신규 npm 0. 브랜치 `ai-center/task-158-ornscore-compare-flow-useful-start-p`. **1소스 변경**: `src/components/CompareClient.tsx`.
- **결과 화면 바스켓 관리(신규)**: 기존엔 2개 이상이면 종목을 더 담을 방법이 결과 화면에 없었음 → 상단에 경량 "바스켓 관리" 섹션 추가. 슬롯 카운터(`{n}개 담음 · {남은}개 더 담을 수 있어요`) + 컴팩트 `StockSearchBox` + 최근/오늘Top5/관심을 합쳐 중복 제거한 빠른추가 칩(최대 6개). 4개(`COMPARE_MAX`) 도달 시 입력 숨김 + "하나를 빼면 다른 종목을 담을 수 있어요" 안내.
- **공통 담기 경로 `tryAdd`**: 빈 상태·결과 화면의 모든 담기(검색 onPick·최근·Top5·관심·빠른추가 칩)를 `tryAdd`로 라우팅 → 상한 초과 시 `"비교는 최대 4개까지 담을 수 있어요 — 하나를 빼고 추가하세요"`, 중복 시 `"이미 담은 종목이에요"` 3초 자동소멸 안내. `addSet`(추천 세트)도 루프 중 상한 감지 → `"최대 4개까지 담을 수 있어 일부만 추가됐어요"`.
- **실수 복구(되돌리기)**: `remove`가 방금 뺀 `{ticker,name}`을 5초간 보관 → 두 화면 공용 `feedbackRegion`(`aria-live="polite"`)에 "…을(를) 뺐어요 · **실행 취소**" 노출, 클릭 시 `addToCompare`로 복원. 결과 카드 × 버튼과 빈 상태 선택 칩 × 모두 적용.
- **파생 공용화**: `watchlistAddable`/`recentAddable`/`top5Addable`을 두 렌더 분기 이전으로 호이스트해 재사용. 타이머는 `useRef`로 보관·언마운트 시 해제. 문구는 매수/매도/추천 토큰 0(중립).
- **게이트(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138종목·오류 0·금칙어 0·Metrics 2.4 · `npm run build` 0(138페이지, `/compare` `ƒ`). 로컬 prod 3100에서 `/compare` 200·`/compare?stocks=005930,000660,000270` 200(자기 PID만 taskkill). (`npm run lint`은 이 레포에 ESLint 미설정으로 대화형 셋업 프롬프트 — 회귀 아님, build가 검증.)
- **다음 소유자**: 실기기 육안(390px에서 바스켓 관리 바 줄바꿈·되돌리기 문구 truncate). 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).

## 2026-07-03 · [claude] Task 154 — OrnScore 전문가 피드백 인테이크 루프 드라이런 (문서 전용)
- **범위**: `docs/ornscore-expert-feedback-intake-template.md`(Task 129) 루프를 한 번 돌려 **미래 피드백 한 편이 messy 중복 task 없이 P0/P1/P2로 변환됨**을 증명하는 문서/프로세스 패스. 앱 소스·점수식·`stocks.json`·인증/provider/env·라우트·의존성·외부 서비스 무변경, 신규 npm 0. 실 신규 broad 백로그 생성 없음. 브랜치 `ai-center/task-154-ornscore-expert-feedback-loop-dry-ru`(클린 시작).
- **신규 `docs/ornscore-expert-feedback-dry-run-2026-07-03.md`**: SAMPLE 리포트(기존 알려진 이슈 조립)로 §7 표 4행 완전 워크 — **거부(INV-5 목표가/매수후보)** · **P2 코드 task 방출 1건(공시 범위 문구, §5 6필드)** · **P1-VISUAL 운영자 버킷 라우팅** · **이미 완료 항목(STEP 번호 중복, Task 60/68) 중복 드롭**. 4경로 시연 + "증명/갭" 5줄.
- **템플릿 additive 개선(2편집)**: 발견 갭 = §7 표에 dedup·운영자 분리가 강제되지 않음 → `ornscore-expert-feedback-intake-template.md` §7 표에 **"이미 추적/완료?(spec-coverage 대조)"·"운영자 전용?"** 두 칸 추가(헤더+예시행+설명 1줄), §7-A에 방출 전 dedup·운영자 라우팅 규칙 2줄 추가. priority(§3/§7)·verification(§6/§7/§5)·safety(§2·§5-A·톤)는 이미 충분 → 무변경. 불변식 가드·톤 규칙 보존.
- **게이트**: `npx tsc --noEmit` 0(소스 무변경 증명 — docs만 변경) · `git diff --check` 실 whitespace 오류 0(전역 CRLF 노이즈만) · 신규/변경 문서 U+FFFD 0·한국어 정상. `build`/`app:check`/`perf:check` 불필요(앱 소스·라우트·`<head>` 무변경). 모바일/데스크톱 영향 0.
- **다음 소유자**: 방출 준비된 P2 공시 범위 문구 task는 별도 실행 결정. 실 릴리스·`main` 머지·외부 계정은 §8 운영자 게이트. 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).

## 2026-07-03 · [claude] Task 152 — OrnScore 성능 가드레일: perf-check에 /today 추가 + 베이스라인 기록
- **범위**: 반복 종목 탐색 속도를 지키는 **경량 로컬 가드레일** 보강. 점수식·`stocks.json`·제3자 서비스·라우트 코드 무변경, 신규 의존성 0. `scripts/perf-check.mjs` 라우트 목록에만 손댐(스레숄드/로직 무변경). 브랜치 `ai-center/task-152-ornscore-performance-budget-and-rout`.
- **변경(1소스)**: `scripts/perf-check.mjs` — `ROUTES`에 `{ path: "/today", cat: "B" }`를 `/stocks` 바로 뒤(홈→today→stocks→상세 내비 순서)에 추가. `/today`는 요청 시점 원격 4콜(`getRecentSignals`/`getScoreChangesBatch`/`getMetricChangesBatch`/`getLatestStoredInsight`, 각 4초 타임아웃 가드)을 하므로 `/stock/*`·`/watchlist`와 같은 **Category B(9000ms 소프트버짓)** — ISR 콜드 재생성 샘플의 오탐 방지. 하단 안내 노트의 Category-B 열거를 `(/stock/*, /today, /watchlist)`로 일치. 그 외 로직/버짓 무변경.
- **게이트(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py` 138종목·오류 0·금칙어 0·Metrics 2.4 · `npm run build` 0(**라우트 표 무변경** — 라우트 코드 무수정) · `npm run app:check` 통과(1 WAIT=assetlinks 기존 오너 게이트). 로컬 prod **4457**(리스너 PID 42872만 taskkill·**AI Center 4310 무중단**)에서 `perf:check --samples 3` → **12 라우트 전부 200·advisory 0·exit 0**, `/today` median TTFB 4052ms(9000ms 버짓 내, 오탐 없음).
- **베이스라인(이 PC·이 네트워크 기준; 절대 ms는 PC/네트워크마다 다르고 베이스라인 대비 상대 회귀만 의미)**:
  - `perf baseline (base=http://localhost:4457, 3 samples, median TTFB): /=67ms - /stocks=40ms - /today=4052ms - /stock/034730=20ms - /stock/032830=22ms - /login=47ms - /pricing=44ms - /status=21ms - /disclosures=47ms - /backtest=38ms - /watchlist=28ms - /compare=29ms`
- **다음 소유자**: 라우트 추가/원격콜 변경 시 `perf:check` 재실행해 이 블록 대비 상대 회귀(>50% 또는 Category-A >300ms) 확인. 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).

## 2026-07-03 · [claude] Task 150 — 모바일 레이아웃 회귀 스윕 (관심 종목 헤더 다크모드 대비 수정)
- **범위**: 모바일 폭(360/390/414px)에서 오버플로·잘린 컨트롤·비좁은 헤더·로그인/메뉴 상태를 훑어 컴포넌트 단위 소규모 수정만. 점수식·`stocks.json`·카피 문자열·언어 스위처(한국어 전용 베타 의도)·제3자 서비스 무변경, 신규 npm 0. 브랜치 `ai-center/task-150-ornscore-mobile-layout-regression-sw`.
- **전수 점검(정합 확인·무변경)**: 공용 크롬 — `AppHeader`(sticky+`env(safe-area-inset-top)`·검색 `flex-1 min-w-0`·우측 클러스터 `shrink-0`)·`HeaderDataBar`(좌 `truncate min-w-0`/우 `shrink-0`)·`MobileNav`(포털 드로어·`body` 스크롤 락·백드롭 z-[60]/드로어 z-[61]·푸터 테마행 `flex-wrap`)·`MobileBottomNav`(`grid-cols-5`+`env(safe-area-inset-bottom)`·라벨 `truncate`)·`ThemeToggle`. 페이지 — 홈(`HomeHero`/`MarketSnapshotCards`/`StockCandidateCard`/`DisclosureSignalCard` 전부 `flex-wrap`·`min-h-[44px]`·다크 정합)·`StocksExplorer`(칩·모드탭·필터 드로어 `max-w-[90vw]`·표 `lg`만·모바일 카드)·종목 상세(`StockHeader` CTA `[&>*]:flex-1`+`flex-wrap`·`StockDetailActionButtons` `grid-cols-1 min-[380px]:grid-cols-2`·`MetricInsightCards`·`StockTabs` `overflow-x-auto`)·`TodayContent`(칩 전부 `flex-wrap`)·`DisclosureExplorer`(기간/스코프/타입 세그먼트 `flex-wrap`·44px)·`WatchlistClient`(빈 상태·알림 CTA·리스트 `min-w-0 truncate`)·`login`(OAuth/이메일 `min-h-[44px]`·계획 제공자 pill). → 신규 오버플로/잘림 갭 0.
- **수정(1소스)**: `src/app/watchlist/page.tsx` 페이지 헤더 — `<h1>`/`<p>`가 `text-zinc-900`/`text-zinc-600`만 있고 `dark:` 미지정이라 다크모드에서 헤더 "관심 종목"+부제가 배경과 저대비로 사라짐(하위 `WatchlistClient`·타 전 페이지 헤더는 `dark:text-zinc-100`/`dark:text-zinc-400` 정합). → `dark:text-zinc-100`·`dark:text-zinc-400` 추가. 레이아웃/카피 무변경, 클래스만.
- **관찰(무변경·후속)**: `StockTabs` 탭바 `sticky top-0 z-10`은 전역 `sticky top-0 z-40` 헤더와 top:0 충돌 가능성(스크롤 시 탭바가 헤더 뒤로) — 정확한 헤더 높이(헤더행+데이터바, 가변) 없이 오프셋 하드코딩은 취약해 이번 스코프(소규모·회귀 방지)에서 의도적 미변경, 오너/후속 판단으로 남김.
- **게이트(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138종목·오류 0·금칙어 0·Metrics 2.4 · `npm run build` 0(라우트 표 무변경·`/watchlist` `ƒ` 168kB). 변경은 다크모드 대비 한정이라 데스크톱(`lg:`)·기존 라이트모드 무영향.
- **다음 소유자**: 실기기 육안(360/390/414px, 특히 종목 상세 탭 sticky·다크모드 관심 종목 헤더). 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).

## 2026-07-03 · [claude] Task 149 — 빈 상태·에러 카피 폴리시 (공시 재시도/도움말 + 모바일 여백)
- **범위**: 미완성처럼 보이는 화면 제거 + 복구 경로를 명확히. 광범위 리디자인·제3자 서비스·중량 의존성 무변경, 신규 npm 0. 불변식 유지. 브랜치 `ai-center/task-149-ornscore-empty-states-and-error-copy`.
- **공시(`DisclosureExplorer.tsx`)**: (1) 에러 블록을 원시 에러 문자열 노출 대신 **복구 카드**(경고 아이콘 + `errorTitle`/`errorHelp` + `min-h-[44px]` "다시 시도" 버튼)로 교체. `reloadKey` state로 fetch effect 재실행, 원문 에러는 `console.error`에만. (2) 빈 상태를 앱 공통 점선 카드 패턴(아이콘+중앙 정렬)으로 통일 + `scope==="universe"`로 비면 "전체 시장까지 넓혀 보기"(`setScope("all")`) 버튼 추가, 기존 필터 해제 버튼 유지. 버튼 컨테이너 `flex-wrap gap-2`.
- **카피(`src/lib/copy/disclosures.ts`, ko/en 동시)**: `errorTitle`·`errorHelp`·`errorRetry`·`emptyWidenScope` 신규 + `errorUnknown` 완곡화("일시적인 오류"). 비자문 톤(참고/확인) 유지, 매수/매도/추천 토큰 0.
- **`WatchlistClient.tsx`**: loadError 재시도 버튼 탭 타깃 44px로 상향 + 도움말 1줄 추가(일시적 문제·잠시 후 재시도). 다른 빈 상태(Compare<2·Watchlist empty/loading·login 에러·Stocks no-match)는 이미 `flex-wrap`/`min-h-[44px]` 정합 — 확인만, 무변경.
- **게이트(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py` 138종목·오류 0·금칙어 0·Metrics 2.4 · `npm run build` 0(라우트 표 무변경) · 신규 ko/en 카피 문자열이 `.next/static/chunks/app/disclosures/*` 번들에 존재 확인(클라 스위치라 curl 불가 → 청크 grep).
- **다음 소유자**: 실기기 육안(390px 에러 카드·빈 상태 줄바꿈)은 운영자 잔여. 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).

## 2026-07-03 · [claude] Task 148 — 관심 종목 + 알림 설정 로컬 UX 패스 (무발송 카카오 Stage 1)
- **범위**: 관심 종목↔알림을 하나의 **일관된 무료 기능 경로**로 느껴지게 하는 로컬 UX 패스. 제3자 서비스 호출 0·계정/민감 설정 변경 0·비밀값 저장 0. 점수식·`stocks.json`·`features.ts`·인증/provider·이메일 cron(`notify`·`evaluate-alerts`)·매직링크 문구·의존성 무변경, 신규 npm 0. 불변식(무료·한국어 전용·138종목·AI 공개 숨김·비자문·유료/Pro 비홍보) 유지. 브랜치 `ai-center/task-148-ornscore-watchlist-and-alert-prefere`(클린 시작).
- **코히런스 카피(§2)**: `WatchlistClient.tsx` 알림 CTA를 알림 *설정* 링크로 명확화("알림 설정 보기") + 하단 1줄 "관심 종목 공시·저장 필터 충족 알림은 지금 이메일로 동작해요(임시·베타). 카카오톡 알림은 준비 중이에요." → `settings/notifications` 상단 배너의 "지금 되는 것 vs 준비 중" 프레이밍과 일치. 기존 "매수·매도 추천이 아닙니다"/"참고 정보" 가드 전부 보존.
- **백로그 Stage 1 item B**: `NotificationChannels.tsx` 카카오 행에 "준비 중" 배지 유지 + 라벨 아래 보조 카피 1줄("카카오톡 알림을 우선 방향으로 준비 중 · 로그인 카카오(계정)와는 별개 · 아직 실제 발송 전이에요."). 이메일 "사용 중" 상태·가짜 ON 채널 없음. `<li>`를 flex-col로 재구성(44px·min-w-0 유지).
- **백로그 Stage 1 item C**: `KakaoAlertPreview.tsx`(신규) — 카카오 알림톡 말풍선 형태(발신 채널명·본문·웹링크 버튼) **정적 프리뷰**. 서버가 구성한 `AlertExampleData`(공시 → 점수 급변 폴백) 재사용, 네트워크 요청 0, 웹링크 버튼은 앱 내부 `/stock/{ticker}` 이동만. "예시" 태그 + "실제 발송된 메시지가 아닙니다 · 투자 추천이 아닌 참고 정보" 고지(`AlertExampleCards` 패턴 재사용). `settings/notifications`에 §4-1로 렌더. 44px·flex-wrap·390px 안전.
- **의도적 미변경**: `alertPrefs.ts`(`{type,channel}` 확장은 실발송 결정과 함께 착수) — localStorage-only·무발송·백엔드 미연결 그대로 유지. 카카오 알림톡 실발송·발신프로필·템플릿 심사·대행사·건당 과금은 여전히 오너 게이트(백로그 §4).
- **추적**: `docs/ornscore-kakaotalk-alert-backlog.md` §1(채널/예시 행 ✅ 로컬 완료·alertPrefs 행 잔여)·§3 Stage 1(진행 상태 블록 + item B/C 완료·item A 잔여) 갱신, `docs/ornscore-spec-coverage.md` §7에 Task 148 포인터. 본 항목·AI_HANDOFF.
- **게이트(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138종목·오류 0·금칙어 0·Metrics 2.4 · `npm run build` 0(138 SSG·라우트 표 무변경) · 변경/신규 소스 U+FFFD 0·스캐폴딩 마커 0 · 톤 게이트(신규 유저 카피에 매수·매도·수익 보장·목표가·가격 단정 0; 부정 고지·"매매를 권하지 않습니다"만). 로컬 prod 41482(리스너 PID 35552만 taskkill·**AI Center 4310 PID 26420 무중단**): `/watchlist`·`/settings/notifications` 200, SSR에 카카오 채널 보조 카피·"카카오톡 알림 미리보기"·"실제 발송된 메시지가 아닙니다" 렌더 확인(watchlist CTA는 `use client` hydrate 후 표시 — 기존 동작).
- **다음 소유자**: 실발송 결정 시 `alertPrefs` 채널맵 확장(Stage 1 item A) + `AlertEvent`(Stage 2)→대행사 어댑터→폴백(Stage 4). 오너 게이트(카카오 채널·발신프로필·템플릿·대행사·과금)는 백로그 §4 빈칸 시트. 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).

## 2026-07-02 · [claude] Task 144 — 카카오톡 알림 로컬 전용 제품 백로그 + 감사 + 이메일-우선 소프트닝
- **범위**: 오너의 카카오톡 알림 선호를 **외부 계정/민감 설정 무변경**으로 단계 백로그화. 카카오 채널/발신프로필/템플릿/대행사/env/시크릿/제3자 호출/유료 약정 **0**. 점수식·`stocks.json`·인증/provider·DB 스키마·라우트·의존성·이메일 cron 무변경, 신규 npm 0. 불변식(무료·한국어 전용·138종목·AI 공개 숨김·비자문·유료/Pro 비홍보) 유지. 브랜치 `ai-center/task-144-ornscore-kakaotalk-alert-product-bac`(클린 시작).
- **신규 — `docs/ornscore-kakaotalk-alert-backlog.md`**: §0 범위·가드레일(로컬만·비밀값 금지·제3자 호출 금지·유료 약정 금지 + 카카오 **로그인**(라이브)≠**알림톡**(미설정) 구분) · §1 공개 표면 감사(알림/이메일/관심종목/저장필터 표면 `file:line`·카카오 준비도, 이메일 cron=폴백 유지·이미 소프트닝된 부분 ✅) · §2 로컬 지금 가능 vs 오너 전용(외부·과금) · §3 Stage 1~4(채널선호 opt-in UI[`alertPrefs` `{type,channel}` 확장·여전히 localStorage 무발송]·`AlertEvent` 스키마[9종 카탈로그 매핑·dedupeKey]·한국어 비자문 알림톡 템플릿 초안[`#{변수}`+웹링크]·폴백[카카오→이메일 임시폴백→인앱]) · §4 오너 외부 설정 빈칸 시트(값 없음·건당 과금은 오너 결정으로만) · §5 검증. 방대 문서 중복 대신 `free-beta-v1-scope`·`auth-providers-setup`·`beta-launch-checklist`(g)·`android-twa-owner-checklist` 링크.
- **소프트닝(이메일-우선 잔여 문구, 톤만·로직 무변경, ko/en)**: `src/lib/copy/today.ts`(`watchHint`)·`src/lib/copy/stocks.ts`(`confirmAlertLogin`·`alertCreated`)·`src/components/ConditionAlertsManager.tsx`(조건 알림 설명) → "…알림으로 받을 수 있어요/알려드릴게요 (현재는 이메일 발송, 카카오톡 알림 준비 중)". `settings/notifications` 배너·`alertCatalog.ts:85`는 이미 카카오 로드맵 톤 → 무변경. 라이브 컨트롤 카드(`page.tsx:144` "이메일로 발송")는 현재 채널의 정확한 사실+배너가 임시/베타로 프레이밍 → 유지. `features.ts` 플래그·이메일 cron·매직링크 문구·점수식 무변경.
- **추적 갱신**: `docs/ornscore-spec-coverage.md` §7 알림 시스템·§5.4 점수 급변 알림 행에 Task 144 백로그 포인터 추가. PROGRESS·AI_HANDOFF 본 항목.
- **게이트(전부 통과)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py` 138종목·오류 0·금칙어 0·Metrics 2.4 · `npm run build` 0(라우트 표 무변경) · `/settings/notifications` 200·SSR 한국어·카카오 채널 행 존재 · 변경 소스 U+FFFD 0 · 스캐폴딩 마커 0 · 톤 게이트(매수·매도·수익 보장·목표가 0). 모바일/데스크톱: docs=영향 0, 카피=기존 44px/flex-wrap 내 텍스트만·390px 불변(실 픽셀 육안은 운영자 잔여⑤).
- **남음(오너 게이트·후속)**: 카카오 비즈니스 채널·발신프로필·알림톡 템플릿 심사·대행사 선정·API 키 Vercel 배치·**건당 과금 단가 결정**(전부 §4 빈칸 시트). 발송 파이프라인 코드는 시트 회신 후 다음 AI가 `AlertEvent`→대행사 어댑터→폴백 순 착수. 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).
- **범위**: 무료 한국어 베타(138종목) 출시 후 집중 QA에 **전환 퍼널 각도**(로그인 진입·`next` 복귀·제공자·데이터 신뢰/안전 문구)를 추가. 앱 코드 무수정 QA. 점수식·`stocks.json`·인증/provider/env·시크릿·DB·라우트·의존성 무변경, 신규 npm 0. 불변식(무료·한국어 전용·138종목·AI 공개 숨김·비자문·유료/Pro 비홍보) 유지. 브랜치 `ai-center/task-135-ornscore-free-launch-smoke-and-conve`(클린 시작·종료). Task 127 재기재 대신 참조.
- **게이트(전부 통과)**: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8, 138종목·0오류·금칙 0·Metrics 2.4) · `npm run build` 0(`/stock/[ticker]` `●` 138 SSG, 라우트 표 무변경) · `npm run app:check` 통과(1 WAIT=assetlinks 기존 운영자 게이트). 로컬 prod 4456(리스너 PID만 taskkill·**AI Center 4310/PID 26420 무중단**) `perf:check` 11라우트 200·advisory 0.
- **스모크**: 12 공개 경로(/ /today /stocks /stock/034730 /stock/032830 /watchlist /compare /login /disclosures /pricing /status /manifest.webmanifest) 12/12 200·치명 마커 0(원시 grep의 `Hydration` 1건은 `suppressHydrationWarning` 정상 prop, 정밀 재검 0).
- **불변식 재확인(INV-1..6)**: 138종목(홈·manifest)·비자문 고지(홈·상세·요금제)·EN 토글 숨김(AppHeader/MobileNav 렌더 0)·AI 공개 숨김(상세/내비 0)·요금제 무료 베타 리드(SSR ×7·byte 1483 vs Pro 26058·확정가 0)·요금제 내비 강등(3 내비 모두 MORE). 요금제 톤 조건부·비확정 유지.
- **전환 퍼널(신규 각도) 정상**: 헤더 `href="/login"`+"로그인"; 비로그인 `/watchlist` CTA `href="/login?next=%2Fwatchlist"`(복귀 next 보존)+혜택 문구+"관심 종목" 빈상태; `/login` 카카오·구글·네이버·이메일 매직링크("메일로 로그인 링크") 4종. 데이터 신뢰/안전 문구 grep(copy/*.ts·dataStatus·pricing): 수익·원금 보장/매수·매도 권유/"곧 유료·유료 확정" phrasing 0(매치는 전부 "추천이 아니다" 부정형).
- **결과**: 신규 코드 결함 0 → **앱 소스 무변경**(Task 127과 동일 결론). 산출물=`docs/ornscore-free-launch-conversion-qa-2026-07-02.md`+PROGRESS+AI_HANDOFF. 잔여=실기기 OAuth·데스크톱/390px 시각 게이트(P1 운영자)·assetlinks(운영자 외부 게이트). 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).

## 2026-07-02 · [claude] Task 128 — Android TWA 운영자 인테이크 체크리스트 + assetlinks 생성기 dry-run 가드
- **범위**: Android TWA Play 등재 **다음 한 걸음에 필요한 값만 운영자가 채우게 하는 짧은 빈칸 시트** 신설 + 오프라인 검증 스크립트 강화. 외부 계정/스토어 제출/실 서명값 **0**, `public/.well-known/assetlinks.json` 생성 **0**. 런타임/UI 소스 무변경(docs + 검증 스크립트 한정), 신규 npm 0. 불변식 유지. 브랜치 `ai-center/task-128-ornscore-android-twa-owner-checklist`(클린 시작).
- **신규**: `docs/ornscore-android-twa-owner-checklist.md` — 6개 항목(Play Console 계정 준비도·패키지명 확정·서명 SHA-256(앱 서명 키+업로드 키)·스크린샷·스토어 문구 상태·OAuth 콜백)을 fill-in 빈칸으로. 기존 방대 문서(readiness·submission-pack·owner-final-checklist·roadmap §5-1)는 중복 대신 링크. handoff-back 명령(`npm run app:assetlinks ... → app:check`) 포함.
- **스크립트 강화(`scripts/check-app-packaging.mjs`)**: `generate-assetlinks.mjs --dry-run`을 `spawnSync`로 실행해 유효 형식 지문 exit 0 + 파싱 JSON 단언, 자리표시자 지문 non-zero exit 단언, 실행 후 `public/.well-known` 미생성 재확인. 신규 인테이크 문서 존재 + 패키지명 `com.ornscore.app` + assetlinks 명령 문자열 드리프트 가드 2건 추가. 기존 WAIT 동작(실 assetlinks 미생성) 유지.
- **게이트(전부 통과)**: `npm run app:check` 통과(신규 5단언 OK, **여전히 1 WAIT**=assetlinks 미생성=기존 운영자 게이트) · `npx tsc --noEmit` 0 · `npm run build` 0(176 SSG·`/stock/[ticker]` `●` 138경로 189kB, 라우트 표 무변경). `public/.well-known/assetlinks.json` 전 과정 미생성 재확인.
- **남음(운영자 게이트)**: assetlinks 실값 생성·스토어 제출·Play Console 결제·서명 키 생성. 운영자가 package id + 실 SHA-256을 인테이크 시트에 채워 돌려주면 다음 AI가 이어감. 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).

## 2026-07-02 · [claude] Task 125 — 성능·신뢰성 패스 (`/watchlist` 타임아웃 가드 + 라우트 로딩 스켈레톤)
- **범위**: 무료 한국어 베타(138종목) 체감·로드 속도·신뢰성 개선. 점수식·`stocks.json`·인증/provider/env·DB 스키마·라우트 의미·`package.json` 의존성 무변경, 신규 npm 0. 불변식(무료·한국어 전용·138종목·AI 공개 숨김·비자문·유료/Pro 비홍보) 유지. 변경 3 소스(`src/app/watchlist/page.tsx`·`src/app/watchlist/loading.tsx` 신규·`src/app/stock/[ticker]/loading.tsx` 신규)+docs. 브랜치 `ai-center/task-125-ornscore-performance-and-reliability`(클린 시작).
- **신뢰성**: `watchlist/page.tsx`의 유일한 미가드 요청 시점 원격 호출(`getScoreChangesBatch`)을 `today`/`stock/[ticker]` 동형 `withTimeout(..., 4000, {} as Record<string, number>)`로 봉인 → 최악 TTFB 4초 캡·느리거나 실패 시 빈 델타 graceful degrade(목록 무영향). 정상/캐시 적중 시 미발화(동작 무변경).
- **체감 성능**: 요청 시점 원격 조회가 있는 2라우트에 순수 표시용 `loading.tsx` 신규(패칭·상태·의존성 0). 기존 스켈레톤 스타일(`animate-pulse`·zinc·다크) + 실 레이아웃 높이 미러링(CLS 최소화). `/today`는 ISR(`revalidate=3600`)+복잡 레이아웃이라 스켈레톤 의도적 미추가.
- **감사(6플로우)**: 홈·`/today`·`/stocks`·상세·`/compare`·`/login` 빈/오류/모바일 상태 Task 110/124에서 이미 견고 확인, 신규 갭 0 → 수정 없음. step-5 `/stock/[ticker]` 완전 정적화는 근거 탭 타이밍 변경 리스크로 연기(문서화).
- **게이트(전부 통과)**: `tsc --noEmit` 0 · `build` 0(라우트 표 무변경: `/stock/[ticker]` `●` SSG 138경로 189kB·`/watchlist` `ƒ` 168kB·`loading.tsx`=Suspense 경계) · `verify_metrics.py` 138종목·오류 0·Metrics 2.4·금칙 0 · `app:check` 통과(1 WAIT=assetlinks 기존 게이트) · `git diff --check` CRLF만 · 변경 3소스 U+FFFD 0.
- **런타임 perf**(로컬 prod 4455·`next start`·`perf:check` 3샘플 median TTFB): 11라우트 200·경고 0. **`/watchlist` total 7076ms(task-120 baseline)→4051ms**(4초 가드 캡), `/stock/034730`·`/stock/032830` ~4.08s(task-119 가드), Category-A 8종 29~54ms(회귀 없음). TTFB 열 전 라우트 29~51ms(스트리밍 SSR 셸).
- **perf baseline**(base=http://localhost:4455, 3 samples, median TTFB): /=51ms · /stocks=54ms · /stock/034730=43ms · /stock/032830=43ms · /login=29ms · /pricing=34ms · /status=45ms · /disclosures=46ms · /backtest=41ms · /watchlist=40ms · /compare=42ms (total: /watchlist=4051ms · /stock/034730=4081ms · /stock/032830=4068ms, 나머지 <65ms).
- **스모크**: 6플로우+watchlist(`/ /login /today /stocks /stock/034730 /compare /watchlist`) 전부 200·치명 마커 0·SSR 한국어 정상. 로컬 prod 4455 리스너(PID 38128)만 taskkill·**AI Center 4310 무중단(PID 26420 LISTENING 확인)**.
- **잔여 리스크(운영자/후속)**: 무료 티어 Supabase 콜드 커넥션 고정비(인프라/오너)·Playwright 시각 게이트 미구성(390px 육안 운영자)·실기기 OAuth 왕복(운영자)·step-5 정적화 연기·공시 전체 기간 수집/KRX 업종코드(큰 데이터). 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).

## 2026-07-02 · [claude] Task 124 — 무료 베타 출시 준비도 심층 QA + 공시 필터 빈 상태 복구 버튼
- **범위**: 무료 한국어 베타(138종목) 공개 표면 9개(홈·로그인·`/today`·`/stocks`·종목상세·비교·공시·모바일·빈/로딩/오류 상태) 심층 출시 준비도 QA. 불변식 유지 확인 + 실사용 갭 1건 안전 additive 수정. 점수식·`stocks.json`·인증/provider/env·DB 스키마·라우트·의존성 무변경, 신규 npm 0. 변경 2 소스(`src/lib/copy/disclosures.ts`·`src/components/DisclosureExplorer.tsx`)+docs. 브랜치 `ai-center/task-124-ornscore-free-beta-launch-readiness-`(클린 시작).
- **불변식 재검증(런타임+grep · 113~123 전환 완료 확인)**: `LanguageSwitcher` importer 0(미렌더)·홈 SSR `언어 전환/English` 0 → 한국어 전용. `AiAnalysisCard` 종목상세 미렌더(코드/API 보존, 진입점만 차단)·`/stock/034730` SSR `AI 분석 실행/Anthropic` 0. `/history` 내비 제거·`/pricing` 3개 내비 모두 "더보기(MORE)" 강등. 유료/Pro/Premium/구독/결제 = `pricing/terms/waitlist/features/auth`(내부) 한정·공개 누출 0. `/pricing` SSR "무료 베타" ×7·확정 가격 숫자 0.
- **발견/수정(P2)**: 공시 탐색 필터 빈 상태가 `filterType !== "all"`(유형 선택 후 scope 전환 등으로 0건)일 때 복구 경로 없음(`/stocks`·`/watchlist`는 이미 복구 버튼 제공) → `DisclosureExplorer` 빈 상태에 **필터 해제(전체 신호 보기) 버튼** additive 추가(`filterType !== "all"`일 때만; 전체 피드 0건은 기존 문구 유지). `copy/disclosures.ts` ko/en `emptyReset` 신설. `setFilterType("all")` 기존 "전체" 버튼과 동일 동작 재사용 — 필터/정렬/카운트/신호 로직 무변경.
- **게이트**: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8, 138종목 오류 0건·금칙어 0·Metrics 2.4) 0 · `npm run build` 0(176 SSG·48 라우트, 라우트 표 무변경) · `npm run app:check` 0(WAIT assetlinks 1건=기존 운영자 외부 게이트) · `git diff --check` clean · 변경 2 소스 U+FFFD 0. `emptyReset` Korean 문자열이 `disclosures/page-*.js` 클라 청크 컴파일 확인.
- **스모크(로컬 prod 4455·리스너 PID만 taskkill·AI Center 4310 PID 26420 무중단)**: 13개 라우트(/ /login /today /stocks /stock/034730 /stock/032830 /compare /disclosures /watchlist /pricing /about /status /backtest) 전부 200, 8개 주요 표면 치명 마커 0. `/status` 기준일 2026.07.01(일일 리프레시·status 정상)·Metrics 2.4 일관. `/compare` 빈 상태·`/disclosures` "최신 200건" 캡션 렌더.
- **결론/다음**: 120+ 태스크 누적으로 이미 강건화 → 신규 실버그 0(빈/로딩/오류·모바일 가드 견고), 유일 실개선 = 공시 빈 상태 복구 버튼. 잔여(운영자 대기⑤): 실기기 카카오·구글·네이버 OAuth 왕복 + standalone 콜백, 데스크톱/390px 실 브라우저 육안, Playwright 시각 게이트 구성. 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).

## 2026-07-01 · [codex] app packaging decision lock — Android TWA 우선 확정
- **제품 결정**: 오너와 함께 앱 1차 패키징 경로를 **Android TWA 우선**으로 확정. iOS는 당분간 홈 화면 추가 PWA로 유지하고, App Store 정식 래퍼는 Android TWA와 실사용 피드백 이후 검토한다. Capacitor/네이티브 구조 도입은 현재 범위 밖.
- **패키지명 기본값**: Android TWA package id는 `com.ornscore.app`을 기본값으로 잠금. 단, Play Console 앱 생성 직전 운영자가 최종 확인해야 하며, 실제 `assetlinks.json`은 서명 SHA-256 확보 전까지 생성하지 않는다.
- **문서 반영**: `docs/app-packaging-readiness.md`의 "권장 경로"를 "제품 결정 — Android TWA 우선"으로 변경, `docs/app-store-submission-pack.md` 다음 액션을 Android TWA 진행 플로우로 고정, `docs/ornscore-owner-final-checklist.md` 첫 스토어 결정 항목을 완료 처리, `docs/app-roadmap.md`에 결정문 추가.
- **자동 가드**: `scripts/check-app-packaging.mjs`가 Android TWA 우선 결정, iOS 정식 래퍼 보류, `com.ornscore.app` assetlinks 명령, 옛 "Android TWA를 먼저 갈지 결정"류 미결정 문구를 검증하도록 확장.
- **다음 오너 액션**: 실기기 standalone OAuth 복귀 확인 → Play Console 등록 → `com.ornscore.app` 최종 확인 → 앱 서명 SHA-256 확보 → `npm run app:assetlinks -- --package com.ornscore.app --fingerprint "<SHA-256>"` → `npm run app:check`.

## 2026-07-01 · [codex] app packaging prep — 스토어 제출 초안/검증 가드 최신화
- **범위/판단**: 웹 공개 베타가 안정화된 뒤 앱 패키징 준비를 재개. 기존 PWA/아이콘/설치 도우미/assetlinks 예시는 이미 준비돼 있어, 이번 작업은 **스토어 제출 초안과 자동 패키징 체크를 현재 제품 상태에 맞게 동기화**하는 데 집중. 앱 동작·manifest·아이콘·서비스워커 정책·인증 코드·데이터/점수식·결제는 변경하지 않음.
- **공식 기준 재확인**: Google Play Data safety/리뷰 준비, Apple App Store Connect 스크린샷/App Privacy/App Review 4.2 문서 링크를 `docs/app-store-submission-pack.md`에 2026-07-01 기준으로 명시. iOS 정식 래퍼는 단순 웹 래퍼 반려 리스크가 있어 PWA 실기기 QA → Android TWA 우선이 현재 추천 경로.
- **수정 1 — 스토어 제출 초안 정합화**: `docs/app-store-submission-pack.md`를 무료 베타·유료 결제 없음·AI 공개 비노출·Kakao/Google/Naver 로그인 활성 상태에 맞춤. `Naver는 준비 중`, AI 분석 기록, Anthropic 위탁 처리자 흔적을 제거하고, Data safety/App Privacy 후보 항목을 공개 `/privacy`와 일치시킴. Android TWA 패키지명 후보 `com.ornscore.app`도 다음 액션에 기록.
- **수정 2 — 결정 가이드/오너 체크리스트 최신화**: `docs/app-packaging-readiness.md`에 2026-07-01 현재 권장 경로(PWA 실기기 QA 후 Android TWA 우선)를 추가. `docs/ornscore-owner-final-checklist.md`에는 제출 초안 최신화 완료와 남은 운영자 게이트(실기기 OAuth, package id, SHA-256, Play Console)를 분리해 갱신.
- **수정 3 — 자동 가드 강화**: `scripts/check-app-packaging.mjs`가 manifest/아이콘/PWA만 보지 않고, 스토어 제출 초안의 로그인 제공자·무결제·위탁 처리자·패키지명 후보·낡은 Naver/AI/Anthropic 문구도 검증하도록 확장.
- **검증**: `npm run app:check` 0. 결과: PWA 아이콘/manifest/설치 도우미/오프라인 페이지/서비스워커 미등록/assetlinks 예시/스토어 제출 초안 전부 OK. `public/.well-known/assetlinks.json`은 실제 Android package id + 서명 SHA-256이 없으므로 `WAIT` 1건이 정상(지금 생성 금지).
- **다음 오너 게이트**: 실기기 standalone OAuth 복귀 확인 → Android TWA 진행 결정 → Play Console 등록 → 실제 package id·서명 SHA-256 확보 → `npm run app:assetlinks -- --package <패키지명> --fingerprint "<SHA-256>"` → 배포 후 `app:check`.

## 2026-07-01 · [codex] P0 flow feedback closeout — 공개 전 AI/날짜/관심종목 잔여 정리
- **입력**: `C:\Users\dongy\OneDrive\바탕 화면\ornscore_p0_flow_test_feedback_2026-07-01.md`. 공개 전 P0 실사용 플로우 재검수 결과를 현재 배포본과 대조.
- **재확인 결과**: 최신 공개 배포 기준 `/`, `/stocks`, `/disclosures`, `/watchlist`, `/compare`, `/pricing`, `/terms`, `/status`, `/login`, `/backtest`는 모두 `2026.06.30` 기준일을 노출. `/stock/034730`·`/stock/000660`의 `2026-06-29`는 가격/점수 히스토리 배열 안의 과거 날짜이고, 현재 종목 상세도 `2026.06.30` 기준일을 함께 노출하므로 기준일 혼재 P0는 최신 배포에서 재현되지 않음. `/privacy`의 `2026-06-29`는 정책 최종 갱신일이라 데이터 기준일이 아니며, 이번 정책 문구 변경으로 `2026-07-01`로 갱신.
- **수정 1 — 공개 AI 문구 숨김 강화**: 로그인 혜택의 `AI 분석 기록 보관` → `알림 설정과 기록 보관`; `/history` 직접 접근 화면의 `AI 분석 기록` → `요약 기록`; 개인정보처리방침의 AI 분석 기록/Anthropic 처리자/국외이전 행 제거. 내부 API·숨겨둔 stock-detail AI 카피는 삭제하지 않고 공개 진입점/공개 법무 표면만 낮춤.
- **수정 2 — 요금제 예상 가격/AI 흔적 완화**: `src/lib/pricing.ts`와 `src/lib/copy/pricing.ts`의 Free/Pro 포함 목록에서 AI 분석 한도 문구 제거, Pro/Premium 예상 가격 숫자(`9,900~14,900`, `29,000원대`)를 공개 파생 데이터에서 `검토 중 · 미확정`으로 축약. 공개 `/pricing`은 계속 무료 베타 단일 안내.
- **수정 3 — 관심종목 loading/empty 동시 노출 방지**: `WatchlistClient`에 hydration guard를 추가해 서버 HTML/no-JS 상태에서 클라이언트 loading 문구가 먼저 렌더되지 않게 함. JS 비활성 환경은 `<noscript>` empty fallback만 보이고, JS 활성 환경은 hydration 뒤 loading → error/empty/items 중 하나만 표시.
- **검증**: `git diff --check` 0(CRLF 경고만), `npx tsc --noEmit` 0, `npm run build` 0(176 static pages). 로컬 prod 4454에서 `/login`·`/privacy`·`/pricing`·`/watchlist`·`/history` 전부 200, 옛 AI 혜택/Anthropic/예상 가격/관심종목 loading SSR/옛 history AI 문구 0건.
- **오너 직접 확인 필요**: 카카오/구글/네이버 OAuth 실제 계정 테스트, 로그인 후 `/watchlist`·`/compare`·`/settings/notifications` 접근/저장, 모바일 카카오톡 인앱 브라우저 콜백은 개발자가 대신 완료할 수 없는 계정·콘솔 게이트.

## 2026-07-01 · [codex] launch-copy cleanup — 무료 베타 공개 배포 전 유료 문구 잔여 제거
- **범위/판단**: `main` 배포 후 공개 `ornscore.com` 핵심 라우트(`/`, `/stocks`, `/stock/034730`, `/login`, `/pricing`, `/status`, `/disclosures`, `/compare`, `/watchlist`)가 전부 HTTP 200임을 확인한 뒤, `/pricing` HTML 안에 남아 있던 `유료(Pro·Premium)` 법무 고지 1건을 무료 베타 v1 방향에 맞게 보수 수정. 점수식·`stocks.json`·인증/provider/env/결제·DB 스키마·라우트 구조 무변경, 신규 npm 0.
- **수정**: `src/lib/copy/pricing.ts` 공통 고지에서 “유료(Pro·Premium) 기능도 …”를 “현재 유료 기능은 제공하지 않으며, 향후 기능을 확장하더라도 정보 확인·변화 알림·리서치 보조 범위”로 변경. 영문 고지도 같은 의미로 정리. 공개 표면이 “무료 베타·현재 유료 기능 미제공·비자문 데이터 도구” 톤을 유지하도록 맞춤.
- **검증**: `git diff --check` 0(CRLF 경고만), `npx tsc --noEmit` 0, `npm run build` 0(176 static pages, `/pricing` 8.16kB), 소스 `/pricing` 관련 파일에서 `유료(Pro·Premium)`/`Paid (Pro · Premium)` 잔여 0. `main` push 후 공개 `/pricing` 잔여 문자열을 재확인한다. 출시 전 남은 오너 게이트는 실사용 로그인 재확인, 법무/데이터 소스 최종 판단, 앱스토어 제출 준비다.

## 2026-06-30 · [claude] task 120 — 성능 가드레일 (perf-check 타이밍 스크립트 + 예산/경고 임계 + 측정 체크리스트, 향후 회귀 방지)
- **범위/판단**: task 118(클라 번들)·task 119(서버 TTFB/원격 지연) 패스의 **성능 발견을 가드레일로 고정**해 앞으로의 작업이 핵심 페이지를 다시 느리게 만들지 않도록 하는 경량 도구·문서화. **점수식·`stocks.json`·인증/provider/env/결제·DB 스키마 무변경**, 신규 npm **0**(Node 내장만), 시각/동작/라우트 의미 무변경. 무료 베타·한국어 전용·138종목·비자문·AI 비홍보 불변식 유지. 변경 **4파일**(`scripts/perf-check.mjs` 신규·`package.json` 스크립트 1줄·PROGRESS·AI_HANDOFF).
- **세 가지 분리된 관심사**(가드레일이 항상 구분): (1) **클라이언트 번들 크기** — `npm run build` 라우트 표의 First Load JS(task 118: `/stock/[ticker]` 191→189kB, 최대 라우트). (2) **서버 TTFB** — 응답 헤더까지 시간(스크립트가 측정). (3) **원격 데이터 지연** — Category-B와 Category-A 라우트의 TTFB 차이(task 119: 종목상세의 요청 시점 Supabase `daily_scores` 왕복). 세 가지는 원인·해결책이 달라 별개로 추적.
- **신규 `scripts/perf-check.mjs`**(ESM·ASCII·Node 내장 `fetch`+`performance.now()`만, `check-app-packaging.mjs` 스타일 `OK/WARN`): **이미 떠 있는 로컬 prod 서버만 측정**(서버 자체 기동/종료 안 함). `--base <url>`(또는 `PERF_BASE_URL`, 기본 `http://localhost:4452`)·`--samples`(기본 3). 11개 핵심 라우트(`/`·`/stocks`·`/stock/034730`·`/stock/032830`·`/login`·`/pricing`·`/status`·`/disclosures`·`/backtest`·`/watchlist`·`/compare`)를 N샘플 측정해 **라우트별 median TTFB·총 다운로드**를 표로 출력. **항상 `exit 0`**(절대값은 PC/네트워크마다 달라 차단 금지). 마지막에 **복붙 가능한 baseline 블록** 출력.
- **예산/경고 임계(소프트·비차단)**: **Category A**(대조/빠름: `/`·`/stocks`·`/status`·`/pricing`·`/login`·`/disclosures`·`/backtest`·`/compare`) median TTFB **≤ 800ms** 초과 시 `WARN`. **Category B**(원격 데이터: `/stock/034730`·`/stock/032830`·`/watchlist`) median TTFB **≤ 9000ms** 초과 시 `WARN` — 무료 티어 Supabase 왕복(환경 고정비, 프로덕션선 작음)이 지배하며 **task-119 타임아웃 가드가 `/stock/*`를 ~4–4.5s로 캡**한다는 주석 포함. **절대값보다 상대 회귀가 핵심**: PROGRESS.md baseline 대비 **>50%(또는 Category-A 라우트 >300ms) 증가한 라우트를 의심**하라고 명시 출력.
- **`package.json`**: `scripts`에 `"perf:check": "node scripts/perf-check.mjs"` 1줄만 추가. `dependencies`/`devDependencies` **바이트 동일**(신규 의존성 0, `package-lock.json`/`node_modules` 무변경).
- **반복 가능한 측정 체크리스트**(스크립트 없이도 동작): ① `npm run build` → ② **4310 아닌 고유 고포트**로 로컬 prod 기동 `npx next start -p 4452` → ③ `node scripts/perf-check.mjs --base http://localhost:4452`(또는 `npm run perf:check -- --base http://localhost:4452`) → ④ 출력된 median 표를 **새 baseline으로 PROGRESS.md에 기록** → ⑤ **그 서버 리스너만** 종료(`netstat -ano | findstr :4452` → `taskkill /PID <pid> /F`) 후 **`netstat -ano | findstr :4310`이 여전히 `LISTENING`인지 확인**.
- **이번 실행 기록 baseline**(로컬 prod **4452**, `npx next start`, 3샘플 median TTFB): `/`=84ms · `/stocks`=72ms · `/stock/034730`=**4077ms** · `/stock/032830`=**4068ms** · `/login`=43ms · `/pricing`=42ms · `/status`=41ms · `/disclosures`=65ms · `/backtest`=54ms · `/watchlist`=**7076ms** · `/compare`=56ms. 전 라우트 200, Category-A 8종 모두 ≤800ms, Category-B 종목상세 2종 가드 상한 ~4.1s·`/watchlist` ~7.1s(task 118/119 수치와 정합). 경고 0(비차단).
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 SSG·`/stock/[ticker]` 189kB·라우트 표 무변경) · `git diff --check` 0(CRLF 노이즈만) · 변경 4파일 U+FFFD/모지바케 0(Korean intact)·신규 의존성 0(diff `package.json` = `scripts`에 `perf:check` 1줄뿐). 가드레일 **end-to-end 1회 실행 성공**(위 baseline). 로컬 prod **4452**(리스너 PID 28560만 `taskkill`·**AI Center 4310 무중단·종료 후 4310 LISTENING(PID 37328) 확인**).
- **오너용 요약**: ✅ 성능 가드레일 추가 — 향후 에이전트가 변경 전후 OrnScore 속도를 **일관되게 측정**(클라 번들·서버 TTFB·원격 데이터 지연 3관심사 분리), 소프트 예산/상대 회귀 신호로 무심결 둔화 방지. 점수식·데이터·인증·env·스키마·신규 npm 0. 외부 사이트(Vercel) 반영은 별도 오너 단계.

## 2026-06-30 · [claude] task 119 — 종목 상세 TTFB/서버 지연 안전 개선 (요청 시점 원격 Supabase 호출 타임아웃 가드 + 읽기 전용 캐시)
- **범위/판단**: task 118 후속. 118 은 종목상세 **클라 번들**을 줄였고, 이번 패스는 **서버 데이터 패칭·원격 Supabase 왕복 비용**에 집중. 시각/동작/데이터/점수식·`stocks.json`·인증/provider/env/결제·DB 스키마 무변경, 신규 npm 0. 무료 베타·한국어 전용·138종목·비자문·AI 비홍보 불변식 유지. 변경 **2파일**(`src/lib/scoreHistory.ts`·`src/app/stock/[ticker]/page.tsx`)+PROGRESS·AI_HANDOFF.
- **측정(로컬 prod 4441, curl, 3샘플 median TTFB)** — baseline: `/stock/034730` **7.12s**·`/stock/032830` **7.10s**·`/` 48ms·`/stocks` 51ms·`/status` 28ms. 대조 3종 빠르고 종목상세 2종만 ~7.1s.
- **근본 원인(실측)**: 종목상세의 **유일한 요청 시점 원격 호출 = `getScoreHistory`**(Supabase `daily_scores`); `getPriceHistory` 는 로컬 fs(61KB). 결정적 발견 — 라우트가 빌드 표엔 `●(SSG)` 지만 **실제로는 매 요청 동적 렌더**(prerender HTML 부재·응답 `no-store`). 원인 = **supabase-js no-store fetch 가 라우트를 동적 강등**(`cookies/headers/force-dynamic` 전무). 7s 자체는 **환경 아티팩트**(task 118: 단일·138배치 쿼리 동일 ~7080ms → 쿼리 실행이 아닌 로컬→원격 무료티어 Supabase 연결/웜업 고정비). 프로덕션(Vercel·동위치)에서는 작음.
- **적용 1 — 타임아웃 가드(검증된 안전 개선)** `page.tsx`: `today/page.tsx` 동형 로컬 `withTimeout` 추가, `Promise.all` 의 `getScoreHistory` 를 `withTimeout(getScoreHistory(ticker,30), 4000, [])` 로 감쌈. **로컬 `/stock/*` TTFB 7.1s→4.1s 캡**, 프로덕션(웜 <1s)에서는 미발화 → 동작 무변경. 점수 히스토리는 **기본 아닌 '근거' 탭** 보조 데이터라 타임아웃 시 차트/타임라인만 빈 상태 graceful degrade(결론·4지표·재무·공시 무영향).
- **적용 2 — 읽기 전용 캐시 래퍼** `scoreHistory.ts`: `daily_scores` 조회를 `unstable_cache`(키 `[score-history,ticker,days]`·`revalidate:3600`·tag)로 감쌈. **빈 폴백 비캐시**(내부 `fetchScoreHistory` 오류 시 throw → 정상·정당한 빈 결과만 캐시, 일시 오류 재시도; 외부 try/catch `[]`). 페이지 `revalidate=3600` 동일 신선도. **로컬 next start 동적 no-store 컨텍스트에선 우회되어 로컬 수치 무변화**(검증), **프로덕션 Vercel Data Cache 에선 revalidate 창 내 반복 조회 중복 제거**.
- **측정 after(동일 3샘플 median)**: `/stock/034730` **4.10s**·`/stock/032830` **4.07s**(가드 상한)·`/` 70ms·`/stocks` 78ms·`/status` 36ms(대조 무변동). 종목상세 200·SSR(ko) 4지표·결론 히어로·근거 탭 구조 렌더, 점수 히스토리 빈 상태여도 탭 정상. AI 종합 분석/분석 기록/LanguageSwitcher 0.
- **지연 귀속 결론**: **원격 Supabase 네트워크 왕복**(렌더 CPU·클라 번들 아님). 로컬 7s 는 무료티어 연결 고정비(환경). 라우트가 동적이라 요청당 호출이 발생하는 **구조적 부분**이 코드 사안.
- **후속(behavior change·정밀 계획)**: (1) **완전 정적화** — 점수 히스토리를 '근거' 탭 **클라 지연 패치**로 이행(`StockEventTimelineLazy` 와 동형) → 서버 원격 호출 제거·정적 프리렌더 복귀·모든 환경 요청당 왕복 제거(API/클라 추가라 별도 작업). (2) **`/watchlist` 138-배치 쿼리**(task 118 잔존) 동일 캐시/타임아웃/클라 이행. (3) **무료티어 콜드 연결 고정비**는 인프라/오너 결정(풀링·웜·엣지 캐시).
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(`/stock/[ticker]` 138 SSG·라우트 표 무변경) · `git diff --check` 0(LF→CRLF 경고만) · 변경 2파일 U+FFFD 0(Korean intact). 로컬 prod **4441**(`next start`, 리스너 PID 만 `taskkill`·**AI Center 4310 무중단·종료 후 4310 LISTENING(PID 37328) 확인**).
- **오너용 요약**: ✅ 종목상세 TTFB/서버 지연 안전 개선 — 원인 **원격 Supabase 왕복** 규명, 타임아웃 가드로 최악 TTFB **7.1s→4.1s 캡**(프로덕션 무변경)+읽기 전용 캐시 래퍼(프로덕션 Data Cache 중복 제거). 완전 정적화는 동작 변경이라 정밀 후속 문서화. 점수식·데이터·인증·env·스키마·신규 npm 0. 외부 사이트(Vercel) 반영은 별도 오너 단계.

## 2026-06-30 · [claude] task 116 — `ornscore_reaudit_2026-06-29.md` 잔여 스윕 (무료 베타 정리 이후 재검수 · 잔여 1건 보수 수정)
- **범위/판단**: 데스크톱 `ornscore_reaudit_2026-06-29.md`(P0 2 · P1 8 · P2 6 + 페이지별 메모)를 **현재 코드와 대조**하는 잔여 스윕. 이 파일은 task 113~115(무료 베타 전환)보다 **이전** 작성본 — 항목 대부분이 이미 task 99~102(원본 리뷰)·108~110(final_check 변형)에서 마감됨. 옛 권고 맹목 재실행 금지, **현행 앱에서 아직 참인 항목만** 소규모 저위험 패치. 표시/문구만(점수식·`stocks.json`·인증·cron·`features.ts`·manifest·라우트 무변경, 신규 npm 0, 매수/매도/추천 0). 변경 **1파일**(+PROGRESS·AI_HANDOFF).
- **유일 수정(아직 참이던 P0-1 잔재)** `src/lib/copy/stocks.ts` `topCapNote`(ko+en): `/stocks` 결과>100일 때(기본 123 포함) 푸터가 `"조건 충족 123개 중 상위 100개 표시…"`로 노출 → task 109가 헤드라인을 `"기본 품질 필터 적용 중: 123개 / 전체 138개"`/`"현재 표시"`로 중립화하며 폐기한 **"조건 충족" 프레이밍이 이 한 줄에만 잔존**(사용자 상세 조건이 없는 기본 화면인데 "조건 충족"이 사용자 조건 충족처럼 읽힘 — P0-1 원지적). 캐논 용어 `현재 표시`에 맞춰 ko `"현재 표시 대상 N개 중 상위 100개만 표시 · …"`, en `matches`→`results`로 통일. 카운트 로직·100개 캡·정렬 무변경.
- **이미 마감(현행 코드 재확인, 무변경)**:
  - **P0-1 `/stocks` 123/138 충돌**(task 99·109) — 헤드라인 `기본 품질 필터 적용 중: 123/138`·전체/기본 토글·현재 조건 3행(기본 품질≠사용자 상세)·`describeAll(shown<total)`. SSR에서 옛 충돌 `조건 충족 123 … 전체 138 보고 있습니다` 0(이번 잔재 1줄만 수정).
  - **P0-2 `/status` 시간대**(task 99) — `formatScoreTimes()`로 `… KST (장마감 후 배치)` + `원본 배치 … UTC` 노출(`copy/status.ts`·`StatusContent.tsx`).
  - **P1-1 `/terms` 내부 경로**(task 99) — `docs/legal-ai-commercial-readiness.md` src grep 0.
  - **P1-2 홈/공시 카운트 라벨**(task 100) — 홈 스냅샷 `DART · 최신 200건 내 · 신호 기준`, `/disclosures` `periodScopeBadge`(선택 기간 전체 아님 · 최신 200건 내).
  - **P1-3·P1-4 `/watchlist`·`/compare` 빈/실패 상태**(task 100·110) — 인터랙티브 빈 상태 + `<noscript>` fallback(`아직 관심 종목이 없습니다`·`비교할 종목이 아직 없습니다` + 종목 찾기/오늘 후보 CTA).
  - **P1-5 요금제 표**(task 114로 **무효화**) — `/pricing`은 무료 베타 안내 단일면. 공개 Pro/Premium 비교표·waitlist 0(SSR `기능 비교` ABSENT). 옛 권고(표 재구성)는 현 방향과 상충 → **재도입 금지, 현행 유지**.
  - **P1-6 홈 후보 순위 vs 상세 전체순위**(task 100·110) — 홈 `rankCriteria`(오늘 후보 목록 내 표시 순서 ≠ 전체 상대순위) + 상세 `priorityScoreCardCopy.scopeNote(n)`.
  - **P1-7 업종 카운트 본인 포함/제외**(task 102) — `copy/stockDetail.ts` 두 곳 모두 `곳(본인 포함)`로 통일, `본인 제외` src grep 0.
  - **P1-8 로그인 "1초 만에"**(task 101) — `빠르게 시작`, `1초 만에` src grep 0.
  - **P2-1 데이터 배지 붙음**(task 102) — `PriorityScoreCard.tsx` `DataStatusPill` 3종 + `sr-only " · "` 분리자.
  - **P2-2 STEP 붙음**(task 102) — `BeginnerReading.tsx` `<ol class="… list-none">` > `<li>` + STEP n 단일 배지.
  - **P2-3 공시 CTA/배지 붙음**(task 102) — `DisclosureExplorer.tsx` `notInUniverse` 배지를 액션 줄 밖 `mt-1.5` 별도 div로 분리.
  - **P2-4·P2-5 백테스트 히트맵 단위·생성일**(task 102·112) — 부제 `각 칸의 숫자는 그 달의 수익률(%)` + 셀 `title`/`aria-label`에 `%`, 상단 `백테스트 기준 … 생성 · 현재 데이터 …과 다름` 배지.
  - **P2-6 밸류 업종 미보정 경고**(task 102) — `stockDetail.ts` `valueNote` "밸류는 업종 보정 전 전체 풀 기준 · 금융·지주 구조적 고평가 주의".
- **남은 항목 = 오너/법무/사업 결정**(코드 수정 아님): 도메인 support@/privacy@ 이메일, 위탁사 정책 링크 추가분, SEO 메타/OG/구조화 데이터, 실기기 390px 모바일 육안(Playwright 미구성), 결제/환불/청약철회 약관 확정 — 모두 운영자 게이트. (이 reaudit 파일 범위 내 개발 수정은 잔재 1건으로 종료.)
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 SSG, 전 라우트) · `git diff --check` 0 · 변경 1파일 U+FFFD/모지바케 0(Korean intact). 로컬 prod **4427**(`next start`, 리스너 PID만 `taskkill`·**AI Center 4310 무중단·종료 후 4310 LISTENING(PID 37328) 확인**): 13라우트(`/`·`/stocks`·`/status`·`/terms`·`/watchlist`·`/compare`·`/pricing`·`/login`·`/disclosures`·`/backtest`·`/guide/metrics`·`/stock/034730`·`/stock/032830`) 전부 200. SSR(ko) 단언 14종 통과 — `/stocks` 신규 캡 문구 노출·옛 `조건 충족 123 … 상위 100` 0, 기본 품질 필터 헤드라인 노출 / `/status` KST / `/terms` 내부 경로 0 / `/pricing` 무료 베타·비교표 0 / `/login` 빠르게·1초 0 / 상세 본인 포함·본인 제외 0·AI 종합 분석 0 / `/watchlist`·`/compare` noscript 빈 상태 / 백테스트 % 단위.
- **오너용 요약**: ✅ `ornscore_reaudit_2026-06-29.md` 잔여 스윕 완료 — P0/P1/P2 **이미 마감 다수 재확인 + 아직 참이던 잔재 1건(`/stocks` 캡 문구 "조건 충족"→"현재 표시")만 보수 수정**. 현행 공개 앱은 무료 베타·한국어 전용·138종목·AI 비홍보·비자문 톤 유지. ⏳ 남은 건 오너/법무/사업(도메인 이메일·SEO·결제 약관·실기기 육안). 외부 사이트(Vercel) 반영은 별도 오너 단계.

## 2026-06-30 · [claude] task 115 — Free Beta v1 QA pass (공개 표면 정합 검증 + 18라우트 스모크 + 잔여 AI 진입점 1건 수정)
- **범위/판단**: task 114 공개 표면 정리 이후 **무료 베타 v1 범위 QA**(주로 검증). free beta·한국어 전용·138종목·유료 미제공·투자자문 아님·AI 숨김/비홍보·카카오 알림 로드맵·앱스토어 로드맵 한정·로그인=저장/동기화·약관/개인정보 비과장을 정적 스윕 + SSR(ko) 단언으로 확인. 확인된 **P0/P1 모순 1건만** 보수 수정(표시/내비만, 점수식·`stocks.json`·인증·cron·`features.ts`·manifest·라우트 삭제·신규 npm 0). 변경 **1파일**(+PROGRESS·AI_HANDOFF).
- **유일 수정(확인된 P1)** `src/components/UserMenu.tsx`: 로그인 시 헤더 계정 드롭다운에 `/history`(AI "분석 기록", `Bot` 아이콘) 링크가 **남아 있어** AI 진입점을 계속 홍보 — task 114가 3개 내비(`Sidebar`·`MobileNav`·`MobileBottomNav`)에서 제거한 것과 불일치(수용 기준 "AI 분석 숨김 또는 비홍보" 위반). task 114와 동일 패턴으로 **링크 + 미사용 `Bot` import 제거**(라우트 `/history`·페이지·`AiAnalysisCard`·`api/ai/*`·`lib/ai*`는 보존 — 직접 접근 가능, 홍보만 제거).
- **검증 통과(무변경 항목)**:
  - **AI 공개 숨김** — `AiAnalysisCard`는 자기 파일 + `copy/stockDetail.ts`에만 존재, `stock/[ticker]/page.tsx` 렌더/import 0. `/history`는 3개 내비 모두 부재(UserMenu만 잔존 → 수정).
  - **한국어 전용** — `LanguageSwitcher` 렌더 0(자기 파일만). `LanguageProvider` 기본 `DEFAULT_LOCALE`(명시 저장/`?lang=`만 내부 EN). `LegalEnSummary`는 `locale!=="en"`이면 `null` → **SSR(ko) `/terms`·`/privacy`에 영어 본문 0**(내부 EN 보존, 공개 비노출).
  - **유료 비포지셔닝** — `/pricing`(`PricingContent.tsx`)은 무료 베타 헤드라인 + 무료 포함목록 + §13.2 법무만. 공개 3-플랜 그리드·비교표·waitlist·"곧 유료/가격 미확정/Pro 전환" 0. 내비 라벨 `nav.pricing`="베타 안내", `/pricing`은 `more` 그룹.
  - **알림 카카오 로드맵 톤** — `settings/notifications`는 카카오톡=우선/준비 중(미발송), 이메일=임시(베타) 채널, 로그인 매직링크=계정용 별개로 분리.
  - **로그인 = 저장/동기화** — UserMenu·MobileNav·notifications 카피 모두 저장/동기화/개인화 프레이밍, 유료 전환 유도 0.
  - **약관/개인정보 비과장** — `/terms` 유료는 "출시 예정·초안·구속력 없음·현재 미제공"으로 보수 서술. `/privacy`의 Anthropic/AI 처리·국외이전 고지는 **유지 권장 안전장치**(계획대로 비모순). 영어/네이티브 앱 출시 약속 0, 이메일 알림은 사용자 설정 시에만(실제 제공 기능과 일치).
- **18라우트 스모크(로컬 prod 4423)**: `/`·`/today`·`/stocks`·`/stock/034730`·`/disclosures`·`/backtest`·`/compare`·`/pricing`·`/status`·`/privacy`·`/terms`·`/watchlist`·`/settings/notifications`·`/about`·`/universe`·`/history`·`/login`·`/guide/metrics` **전부 200**. SSR(ko) 단언 — `/pricing` "무료 베타" 노출·waitlist/Pro전환/가격미확정/Premium플랜 0 · `/stock/034730` "AI 종합 분석"/"분석 기록" 0 · 헤더 "베타 안내" 노출·LanguageSwitcher/`/history`/분석기록 0 · `/terms`·`/privacy` 영어 법무 본문 0·한국어 본문 노출. (UserMenu는 로그인 게이트라 SSR 미노출 — 소스+build+tsc로 검증.)
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 SSG, `/pricing`·`/history`·`/terms`·`/privacy` 라우트 잔존) · `git diff --check` 0 · 변경 1파일 U+FFFD/모지바케 0(Korean intact). 로컬 prod **4423**(`next start`, 리스너 PID 36920만 `taskkill`·**AI Center 4310 무중단·종료 후 4310 LISTENING(PID 37328) 확인**).
- **오너용 요약**: ✅ **무료 베타 리뷰 준비 완료** — 공개 표면(요금제→무료 베타 안내·AI 숨김/비홍보·한국어 전용·138종목·카카오 알림 로드맵·앱스토어 로드맵 한정·로그인=저장/동기화·약관/개인정보 비과장)에 P0/P1 공개 범위 모순 0(UserMenu 잔여 AI 진입점 1건 수정 완료). ⏳ **추후 오너/법무/사업 결정** — 카카오 알림 실발송, 앱스토어 제출, 수익화 활성화(결제/환불/청약철회·가격 확정), EN 토글 재개(코드/문자열/플래그 보존). 외부 사이트(Vercel) 반영은 별도 오너 단계.

## 2026-06-30 · [claude] task 114 — Free Beta v1 공개 표면 적용 (요금제→무료 베타 안내·AI/기록 진입점 숨김·한국어 전용·카카오 로드맵 알림)
- **범위/판단**: task 113 결정 문서(`docs/ornscore-free-beta-v1-scope.md` §3~§4)의 구현 체크리스트 (i)1~5 + 요금제 리워크를 **공개 앱 표면에 실제 적용**. 표시/내비/문구 + 클라 기본 로케일 1줄만(점수식·`stocks.json`·인증·cron·`features.ts`·`pricing.ts`/`PLANS`·EN i18n 데이터·manifest·앱 로드맵 문서 무변경, 신규 npm 0, 매수/매도/추천 0, 라우트 삭제 0). 변경 12파일(+PROGRESS·AI_HANDOFF).
- **(1) 요금제 → 무료 베타 안내**: `src/lib/copy/pricing.ts` ko/en에 `freeBeta` 키 신설(헤드라인 "지금은 무료 베타예요" + **유료 플랜은 현재 제공하지 않음** + 무료 포함 목록 6종 — **138종목 탐색·종합 점수·오늘 후보·공시 신호·종목 상세·관심/비교**, AI 불릿 제외 + `noPaidNote`). `src/components/PricingContent.tsx` 전면 재작성 — 공개 렌더는 **백홈·무료 베타 헤드라인/본문·무료 포함 목록·§13.2 법무 고지**만. **제거(공개)**: 3-플랜 그리드(`PlanCard`)·Pro/Premium 비교표·"정식 출시 시 Pro 전환" 베타카드·`priceUndecided`("가격 미확정")·`WaitlistForm`(가격 불확실/업그레이드/베타→유료 알람 프레이밍). 옛 `betaCard`/`compare`/플랜 키·`WaitlistForm` 컴포넌트·`plansByLocale`/`compareRowsByLocale`는 파일에 **보존(내부/추후)**. `src/app/pricing/page.tsx` 메타데이터 title "무료 베타 안내 — 오른스코어"·description 무료 베타 톤(무료/Pro/Premium·가격 문구 제거).
- **(2) 내비 강등/리라벨**: `i18n.ts` `nav.pricing` ko "요금제"→**"베타 안내"**(en "Beta info"), `footer.pricing` ko "요금"→"베타 안내"(en "Beta info"). 라우트 `/pricing` 유지(처닝 0). `Sidebar.tsx`·`MobileNav.tsx`에서 `/pricing`을 1차 그룹(`group:""`)→**"more" 그룹으로 이동**(`MobileBottomNav` MORE는 기존 유지).
- **(3) AI 공개 진입점 숨김(코드 보존)**: `src/app/stock/[ticker]/page.tsx`에서 `<AiAnalysisCard>` 렌더 + import 제거(컴포넌트·`api/ai/*`·`lib/ai*`·`history/page.tsx`는 보존). `/history`(AI 분석 기록) 내비 항목을 `Sidebar.tsx`·`MobileNav.tsx`·`MobileBottomNav.tsx`에서 제거(라우트·`nav.history` 키는 보존 — 직접 접근은 가능, 홍보만 제거). 미사용 `Bot` 아이콘 import 정리.
- **(4) 한국어 전용 공개**: `AppHeader.tsx`·`MobileNav.tsx`에서 `<LanguageSwitcher>` 렌더 + import 제거(컴포넌트·EN i18n 데이터 보존). `LanguageProvider.tsx` 기본 폴백 `preferredBrowserLocale()`→`DEFAULT_LOCALE`(브라우저 언어 무관 한국어 고정, 명시적 저장 pref/`?lang=`만 내부 EN 존중) + 미사용 helper 제거.
- **(5) 알림 카카오 로드맵 톤**: `src/app/settings/notifications/page.tsx` 상단 안내 블록 + 비로그인 카피를 (a) **로그인 매직링크 메일(계정용) ↔ 제품 알림 분리**, (b) 제품 알림 우선 방향 = **카카오톡 알림(준비 중·아직 미발송)**, 이메일은 임시(베타) 채널·장기 메인 아님으로 리프레이밍. `src/lib/alertCatalog.ts` `saved_filter_match` "이메일로 알려드려요" → "알려드려요(현재는 임시로 이메일 발송, 카카오톡 알림은 준비 중)". cron·`features.ts`·`NotificationChannels` 상태 데이터 무변경.
- **(6·7 검증·무변경)**: 138 유니버스 문구 일관(`dataStatus.ts:188` "전체 상장 종목이 **아닙니다**" 등) — "전체 상장 종목"/"all listed" 위반 0. 앱스토어 가짜 출시/제출 주장 0(`about` "출시 여부는 아직 정해지지 않았습니다"·`PwaInstallHelper` "스토어 출시 주장 0"). 영어 "준비 완료" 주장 0(`LegalEnSummary` "정식 영어 번역 보류" 보수 유지). 위반 문자열 없어 수정 0.
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 SSG, 전 라우트 — `/pricing` 8.12kB·`/history` 라우트 잔존) · `git diff --check` 0(CRLF 노이즈만) · 변경 12파일 U+FFFD/모지바케 0(Korean intact). 로컬 prod **4422**(`next start`, 리스너 PID 36716만 `taskkill`·**AI Center 4310 무중단·종료 후 4310 LISTENING(PID 37328) 확인**): 12라우트(`/`·`/pricing`·`/login`·`/settings/notifications`·`/watchlist`·`/history`·`/about`·`/status`·`/stocks`·`/stock/034730`·`/privacy`·`/terms`) 전부 200. SSR(ko) 단언 — `/pricing` "지금은 무료 베타예요"·"유료 플랜은 현재 제공하지 않" 노출, **기능 비교/가격 미확정/Pro 기능으로 전환/출시 알림 받기 0건**(Premium은 §13.2 법무 고지 1회만, 계획 지시대로 보존) · 헤더 `aria-label="언어"`(LanguageSwitcher) 0 · `/stock/034730` "AI 종합 분석" 0 · 내비 "베타 안내" 노출·1차 "요금제" 0·`href="/history"` 0.
- **남은 갭(후속·운영자)**: 카카오톡 알림 실발송(cron 카카오 알림톡 채널 확장)·앱스토어 제출·수익화 활성화(결제/환불/청약철회)·EN 토글 재개는 오너/제품 게이트(코드·EN 문자열·플랜 플래그 보존). §13.2 법무 고지의 "유료(Pro·Premium)" 언급은 비프로모션 보수 고지로 계획대로 유지. 외부 사이트(Vercel) 반영은 별도 오너 단계.

## 2026-06-30 · [claude] task 113 — Free Beta v1 제품 방향 잠금 (결정 기록 + 공개 표면 감사 + 구현 매핑, docs 전용)
- **범위/판단**: 추가 구현 전에 v1 방향을 **고정**하는 결정-잠금 작업. 오너 결정 인코딩: **무료 · 한국어 전용 · 138종목 · AI 분석 공개 숨김 · 카카오톡 알림 로드맵 · 앱스토어 추후 목표 · 수익화는 내부 미래 옵션**. **docs 전용 — `src/**` 무변경**(점수식·`stocks.json`·인증·manifest·PWA·i18n 무변경, 신규 npm 0, 매수/매도/추천 0). 신규 1문서 + PROGRESS/AI_HANDOFF.
- **신규 산출물**: `docs/ornscore-free-beta-v1-scope.md` — (1) 결정 요약(무료·내부 수익화·카카오 알림 우선/이메일 메인 아님·로그인 매직링크 허용·AI 공개 숨김 코드 보존·앱스토어 추후·EN 제외·138 유지·데이터 신뢰→탐색→모바일 우선), (2) 오너 결정 원문, (3) **공개 표면 감사 표**(요금제/AI/KO·EN/알림/앱스토어/138 각 영역 → 실제 `file:line` + 충돌 판정), (4) 구현 체크리스트 3분할(must-change 공개 UI / keep-internal / future roadmap), (5) 수용 기준 매핑.
- **감사 앵커(실측)**: 요금제 1차 내비 `Sidebar.tsx:15`·`MobileBottomNav.tsx:21`(강등 권장) / 베타 카피 `copy/pricing.ts:204,225`(이미 보수화·정합) / 플랜 플래그 `features.ts:5,7,9,11,13`(내부 유지) / AI 카드 `stock/[ticker]/page.tsx:400`+`AiAnalysisCard.tsx`(공개 제거·게이트) / `/history` 내비 `Sidebar.tsx:19`·`MobileBottomNav.tsx:20`(제거·게이트) / AI 코드 `api/ai/analyze`·`lib/ai*`·`history/page.tsx`(보존) / 알림 이메일 `alertCatalog.ts:85`·`settings/notifications/page.tsx:127-128`(카카오 로드맵 톤) / 언어 토글 `AppHeader.tsx:84`·`MobileNav.tsx`(숨김) / EN i18n `i18n.ts`(보존) / 앱·스토어 `app-roadmap.md`·`app-packaging-*`·`app-store-submission-pack.md`+`manifest.ts`(로드맵 유지·제출 없음) / 138 문구 `layout.tsx`·`page.tsx`·`pricing.ts:25`·`copy/pricing.ts:67` 등(정합·유지).
- **의도적 범위**: 공개 UI 실변경(내비 강등·AI 게이트·언어 토글 숨김·알림 문구)은 **다음 작업으로 명시 이연** — 본 task는 결정 잠금 + 매핑만(플래너 한정: tiny/safe 외 `src/**` 무변경). AI 코드·EN 문자열·요금제 플래그·수익화 문서는 삭제 없이 보존.
- **검증(docs 전용)**: `git diff --check` 0(CRLF 노이즈만) · 변경 파일(신규 scope 문서·PROGRESS·AI_HANDOFF) U+FFFD/모지바케 0(Korean intact). `src/**` 무변경이라 `tsc`/`build`/로컬 prod 스모크 불요. **AI Center 4310 무중단**(로컬 서버 미기동).
- **남은 갭(후속)**: 구현 체크리스트 (i) 5건(요금제 내비 강등·AI 카드 공개 제거/게이트·`/history` 내비 제거/게이트·KO/EN 토글 숨김·이메일 메인 알림 문구 톤 조정)이 다음 우선 후속. 카카오 알림 실발송·앱스토어 제출·수익화 활성화·EN 재개는 오너/제품 게이트.

## 2026-06-30 · [claude] task 112 — 최종 점검 QA 클로즈아웃 (P0/P1 재검증 + 잔여 P2 백테스트 히트맵 단위 명시)
- **범위**: `ornscore_reaudit_2026-06-29_final_check.md`(데스크톱) 전체를 클로즈아웃 관점에서 재검증. P0(task 108 기준일·109 필터)·P1(task 110 트러스트 카피) **회귀 없음 재확인** + 스펙이 콕 집은 잔여 P2 중 **유일하게 미충족이던 백테스트 히트맵 단위 명시 1건**만 보강. 표시/문구만(점수식·`stocks.json`·인증·manifest·PWA·정렬·`strength`/`direction` 무변경, 신규 npm 0, 매수/매도/추천 0). 변경 1파일.
- **P2 보강(`src/components/backtest/MonthlyHeatmap.tsx` 1파일)**: 히트맵 셀은 `(v*100).toFixed(0)`로 **숫자만**(예 `5`·`-3`) 표시되고 `title`/`aria-label`에만 `수익률 …%`가 있어, 텍스트 파싱·스캔 환경에서 각 칸이 월별 수익률(%)임이 시각적으로 드러나지 않던 갭(스펙 §2.3·§6.5·P2-1 작업표). 부제 문구에 `**각 칸의 숫자는 그 달의 수익률(%)**` 한 절 추가(기존 색상 범례·빈 칸 안내 보존). 셀 렌더·heatClass·색·값 무변경.
- **재검증(읽기 전용·무변경)**:
  - **P0-1 기준일** — `/`·`/stocks`·`/stock/034730`·`/watchlist`·`/about`·`/status` 전부 SSR `2026.06.29` 노출, 사용자 노출 stale `2026.06.26 (금) 장마감` 0건.
  - **P0-2 `/stocks` 123/138** — `기본 품질 필터 적용 중: 123개 / 전체 138개` 헤드라인·전체/기본 토글·3행 현재조건 노출, 구 충돌 문구(`전체 138개 종목을 종합점수 기준으로 보고 있습니다`) 0건.
  - **P1-1 `/watchlist`** — SSR에 `아직 관심 종목이 없습니다` 빈 상태(noscript fallback) 노출 — 로딩 텍스트 고착 아님.
  - **P1-4 공시 라벨** — `/disclosures` `분류 신뢰도` 노출·구 `신호 강도` 0건.
  - **P1-3 요금제 / P1-5 상태 톤** — `/pricing` `전환될 수 있` 노출, `/status` `단계적으로 공개할 예정입니다` 노출·구 내부 TODO 톤(`후속 과제입니다(현재는 배포 시점 스냅샷)`) 0건.
  - **P2 업종 표본(task 102 처리분)** — `/stock/034730` `본인 포함` 노출·`본인 제외` 0건(`stockDetail.ts` peerDescMid/sampleEnd ko+en 일관).
  - **P2 종목 상세 CTA 간격** — `StockDetailActionButtons.tsx` grid `grid-cols-1 min-[380px]:grid-cols-2 xl:grid-cols-4 gap-2` + 독립 `<a>`·`min-h-[44px]`·아이콘 — 텍스트 글루 없음(이미 task 91 충족).
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 SSG, 전 라우트) · `git diff --check` 0 · 변경 1파일 U+FFFD 0(Korean intact). 로컬 prod **4421**(리스너 PID 17776만 taskkill·**AI Center 4310 무중단·종료 후 4310 LISTENING(PID 37328) 확인**): 스모크 15라우트(`/`·`/stocks`·`/stock/034730`·`/watchlist`·`/about`·`/status`·`/disclosures`·`/backtest`·`/pricing`·`/compare`·`/history`·`/guide/metrics`·`/terms`·`/privacy`·`/login`) 전부 200, `/backtest` SSR에 `각 칸의 숫자는 그 달의 수익률` 노출.
- **남은 갭(후속·운영자)**: 390px 실 브라우저 육안(Playwright 미구성). 라이브러리 파생 문구 EN 로케일 한국어 잔여(기존). 스펙 P2-3 차트 접근성 텍스트 요약·P2-4 KO/EN 법무 전문 번역·유료화 전 결제/환불/청약철회·AI 분석 삭제 정책 보강은 운영자/제품 결정 게이트. `MonthlyHeatmap`은 한국어 전용(파일 기존 패턴) — EN 단위 절은 i18n 도입 시 후속.

## 2026-06-30 · [claude] task 110 repair — 데스크톱 Playwright 스크린샷 30s 타임아웃(자동화 브라우저에서 CDN 폰트 요청 생략)
- **블로커(게이트 FAIL)**: `PLAYWRIGHT DESKTOP ERROR: page.screenshot: Timeout 30000ms exceeded` — `fonts loaded` 직후 캡처가 멈춤. **Task 87과 동일 시그니처**(외부 jsdelivr Pretendard 웹폰트 의존).
- **근본원인**: task 110 P1 diff는 순수 카피/정적 JSX(애니메이션·fetch·외부 리소스 추가 0)라 무관. Task 87이 render-blocking `@import`를 비차단 JS 주입으로 바꿨지만, 그 인라인 스크립트는 여전히 **페이지 수명주기 중 jsdelivr CDN 요청을 발생**시킨다. 오프라인/헤드리스 QA 하니스에서 그 요청이 pending으로 멈춰 스크린샷 단계가 안정 상태에 도달하지 못함.
- **수정(`src/app/layout.tsx` 1줄·인라인 스크립트 가드)**: 폰트 주입 스크립트 시작에 `if(navigator.webdriver)return;` 추가 — 자동화 브라우저(Playwright는 `navigator.webdriver=true` 설정)에서는 CDN 폰트 요청 자체를 생략하고 시스템 한글 폰트 폴백(globals.css line 70 체인)으로 즉시 렌더. **실사용자(프로덕션)는 그대로 Pretendard 적용** — 비차단 media=print→all 승격 로직 보존. 데이터/점수/인증/manifest/PWA/i18n 무변경, 신규 npm 0.
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(176p 포함 전 라우트, BUILD_EXIT=0) · `git diff --check` 0 · `app:check` 통과(layout.tsx=app-shell이라 실행; assetlinks WAIT는 기존 외부 게이트) · layout.tsx U+FFFD 0·Korean intact. 로컬 prod **47311**(`next start` 리스너 PID 37484만 taskkill·**AI Center 4310 무중단**): `/`·`/watchlist`·`/pricing`·`/status`·`/disclosures`·`/stock/005930` 전부 200, 서빙 HTML에 `navigator.webdriver` 가드 존재·jsdelivr 스타일시트는 `<noscript>`(JS 환경 inert)에만 잔존(메인 플로우 render-blocking 0).
- **잔여(운영자)**: 영구 제거 원하면 Pretendard self-host(`next/font/local`, 폰트 바이너리 에셋 필요 — 발명 금지로 미진행). 정적 `<link rel=preconnect>`는 비차단·실패 무해라 유지.

## 2026-06-30 · [claude] task 110 — 최종 점검 P1 출시 전 신뢰 문구 마감 (관심 빈 상태 하드닝·홈/상세 순위 범위·요금제 베타·공시 강도→분류 신뢰도·상태 후속과제 톤)
- **범위**: `ornscore_reaudit_2026-06-29_final_check.md`(데스크톱) **§4 P1-1~P1-5**. P0 2건(task 108 기준일·task 109 필터 문구)은 이미 반영됨 — 본 작업은 P1 출시 폴리시(신뢰 카피)만. 표시/문구 + localStorage 방어 try/catch만(점수식·`stocks.json`·인증·manifest·PWA·`direction`/`strength` 데이터·정렬 무변경, 신규 npm 0, 매수/매도/추천 0). 변경 8파일.
- **P1-5 `/status` 후속과제 톤 완화** — `src/lib/copy/status.ts` `selfcheckFootnote`(ko line 68 + en) "점검 이력 보관·관리자 대시보드·수동 재수집은 후속 과제입니다(현재는 배포 시점 스냅샷)." → **"현재는 배포 시점 기준의 스냅샷 점검 결과를 제공하며, 점검 이력과 재수집 상태도 앞으로 단계적으로 공개할 예정입니다."**(en 동일 의미). 계산 시각/값 무변경 — 문자열 1쌍만.
- **P1-4 공시 `강도` → `분류 신뢰도/자동분류 확신도`** — `src/lib/signalGuide.ts:54` `insider_buy.cautionNote` 첫 사용자 노출어를 `'강도'` → `'분류 신뢰도(자동분류 확신도)'`로(호재 점수 아님·방향은 DART 원문 확인 안전 의미 보존). `src/lib/copy/disclosures.ts` `cautionFallbackByType.insider_buy`(ko line ~108 + en line ~173) 동일 리워딩 + "매수/매도 방향은 DART 원문에서 확인" 보강. `strength` 데이터·정렬·`direction` 로직 무변경.
- **P1-4 기간 버튼 옆 반복 배지** — `disclosureExplorerCopy`(ko+en)에 `periodScopeBadge`("선택 기간 전체 아님 · 최신 200건 내" / "Not the full period · within latest 200") 신설, `src/components/DisclosureExplorer.tsx`(~line 291) 3·7·14·30일 버튼 행 끝에 기존 `within200` 슬레이트 배지와 동일 스타일 small muted 배지로 렌더(390px `flex-wrap` 유지).
- **P1-2 종목 상세 상대순위 범위 캡션** — `priorityScoreCardCopy`(ko+en) `scopeNote(n)` 신설("전체 N종목 기준 상대순위 · 홈 후보 순위와 다를 수 있음"), `src/components/stock/PriorityScoreCard.tsx` 전체/업종 순위 줄 아래 동적 `poolN`(하드코딩 138 금지)으로 캡션 렌더. **홈 후보 배지("오늘 후보 순위 · 검증 보류 제외 기준")는 Task 100에서 이미 충족(`home.ts` `tag`·`rankCriteria`·`rankBadgeAria`) — 검증만, 추가 안 함.**
- **P1-3 요금제 베타→Pro 비확정 톤** — `src/lib/copy/pricing.ts` `betaCard`(ko+en) "정식 출시 시 Pro 기능으로 전환될 **예정**" → "전환될 **수 있습니다**"(en "planned to become" → "may become"), `compare.footer2b`(ko+en) "전환될 예정입니다" → "전환될 수 있고 전환 전 사전 안내합니다"(en "may become … with advance notice before any change"). 미확정 가격·사전 공지 조항 보존, 가격값 추가 0.
- **P1-1 `/watchlist` 빈 상태 + 저장소 방어** — `src/components/WatchlistClient.tsx` `view` 읽기(line ~104)·`changeView` 쓰기(~110)를 try/catch로 감싸 시크릿/저장소 차단 환경에서 graceful degrade(기본 simple 보기 유지). **인터랙티브 빈 상태는 이미 충족(검증만·재작업 0)**: `loading`→`watchlist.length===0` 분기 시 "아직 관심 종목이 없습니다" + 검색 + CTA(`/stocks`·`/today`) + 비로그인 시 로그인 동기화 CTA, 페이지 헤더가 브라우저 저장 vs 로그인 동기화 설명, `watchlist/page.tsx` `<noscript>` fallback(Task 100). `getWatchlist`는 기존 try/catch→`loadError` 재시도 분기 보존.
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 SSG, 전 라우트) · `git diff --check` 0 · 변경 8파일 U+FFFD/모지바케 0(Korean intact). `app:check` 생략(app-shell/PWA/auth/nav 무변경 — 카피 + 클라 try/catch만). 로컬 prod **4417**(리스너 PID 2496만 종료·**AI Center 4310 무중단·종료 후 4310 LISTENING(PID 37328) 확인**): `/`·`/watchlist`·`/disclosures`·`/pricing`·`/status`·`/stock/005930` 200. SSR(ko) 노출 — `/status` `단계적으로 공개할 예정입니다`(타깃 `후속 과제…스냅샷` 0건), `/pricing` `전환될 수 있습니다`·`전환될 수 있고 전환 전 사전 안내합니다`(구 `전환될 예정` 0건), `/disclosures` `선택 기간 전체 아님 · 최신 200건 내` 배지·`신호 강도` 0건·`분류 신뢰도` 노출, `/stock/005930` `홈 후보 순위와 다를 수 있음`, `/watchlist` 빈 상태 + 브라우저 저장 설명. EN은 클라 스위치라 빌드 청크에서 신규 키(`Not the full period`·`may become a Pro feature`·`progressively disclose check history`·`may differ from the home candidate order`·`auto-classification certainty`) 컴파일 확인.
- **의도적 범위 결정**: `/status`에 남은 `후속 과제` 2건(`dataStatus.ts:196` 백테스트 생존편향·`:206` KRX 공식 업종코드)은 **'알려진 제한' 섹션의 기술적 한계 고지**로, 스펙 P1-5가 콕 집은 자동점검 footnote(점검 이력/관리자 대시보드/수동 재수집)와 다른 맥락 — 플래너가 P1-5를 footnote 한 쌍으로 한정해 무변경 유지(운영자 추가 톤 조정 시 후속 가능).
- **남은 갭(후속·운영자)**: 390px 실 브라우저 육안(Playwright 미구성). 라이브러리 파생 문구 EN 로케일 한국어 잔여(기존). 최종 점검 P2(백테스트 히트맵 % 단위 강화·종목 상세 업종 표본 본인 포함/제외 — 일부 task 102서 처리)는 별도 후속.

## 2026-06-29 · [claude] task 109 — 최종 점검 P0-2 `/stocks` 123/138 필터 문구 충돌 정리 (기본 품질 필터 ≠ 사용자 상세 필터 명확화 + 전체/기본 보기 토글)
- **범위**: `ornscore_reaudit_2026-06-29_final_check.md`(데스크톱) **P0-2 종목 탐색 필터 문구 충돌**. "조건 충족 123/전체 138" + "기본 화면 PER200·PBR30" + "적용된 상세 필터 없음" + "전체 138개를 보고 있습니다"가 동시에 보여 사용자가 **123개를 보는지 138개를 보는지·기본 필터가 켜졌는지** 알기 어려웠던 문제를 해소. 표시/문구만(점수식·`stocks.json`·`matchConfig.ts`·`savedSearches.ts`·인증·manifest·PWA 무변경, 신규 npm 0, 매수/매도/추천 0). 변경 2파일.
- **실 카운트 확인(하드코딩 금지)**: `public/data/stocks.json` 138종목 중 `matchesConfig`(PER>200 또는 PBR>30 제외, 0=결측은 통과) 적용 시 **기본 123개 / 제외 15개**. 컴포넌트는 `sorted.length`(클라 계산)·`total=stocks.length`로 동적 표시 — 숫자 위조 0.
- **카피 `src/lib/copy/stocks.ts`(ko/en 동시)**: 신설 — `qualityHeadline(shown,total)`("기본 품질 필터 적용 중: 123개 / 전체 138개"), `viewAllToggle(total)`("전체 138개 보기")/`backToDefaultToggle`("기본 품질 보기"), 현재 조건 3행용 `qualityRowOn`("기본 품질 필터: PER ≤ 200, PBR ≤ 30")/`qualityRowOff`("…: 해제됨 (전체 보기)")·`detailRowLabel`("상세 필터")/`detailRowNone`("없음")·`sortRowLabel`("정렬"), `backToDefaultReset`("기본 화면으로 초기화"), `noMaxPlaceholder`("상한 없음"). 개정 — `baseScreenNote`("기본 화면은 PER 200 이하 · PBR 30 이하 종목만 표시합니다. 고PER·고PBR 등 제외 15개는 ‘전체 보기’를 선택하면 포함됩니다."), `describeAll(shown,total)` `shown<total` 분기를 **"현재 123개 종목을 종합점수 기준으로 보고 있습니다. 전체 138개를 보려면 기본 품질 필터를 해제하세요."**로 교체(기존 "전체 138개를 보고 있다" 충돌 제거). 기존 `noDetailFilter`·`viewAll`은 미삭제(다른 참조 보존).
- **컴포넌트 `src/components/StocksExplorer.tsx`**: 모듈 상수 `NO_MAX=999999`(전체 보기 시 PER/PBR 상한 제거값). 파생 `qualityFilterOn = perMax<=200 && pbrMax<=30`·`pureBrowse`(프리셋·검색·상세 필터 0). 핸들러 `viewAllStocks()`(perMax/pbrMax→NO_MAX)·`backToDefaultView()`(→200/30). `sortOptionLabel()`로 현재 정렬을 `t.sortOpt` 라벨로 매핑. **헤더**: `pureBrowse && qualityFilterOn`이면 count를 `qualityHeadline`로 표시 + `flex-wrap gap-2` 안에 토글 버튼(`qualityFilterOn`이면 `전체 138개 보기`→`viewAllStocks`, 아니면 `기본 품질 보기`→`backToDefaultView`)·`whitespace-nowrap`로 390px 글루 방지. **현재 조건 블록**: 단일 칩/`noDetailFilter` 줄을 **3행**(기본 품질 필터 / 상세 필터[칩 or "없음"] / 정렬)으로 교체. **FilterPanel** PER/PBR 상한 입력·라벨: `===NO_MAX`이면 빈값+`placeholder="상한 없음"`(라벨은 "상한 없음")으로 999999 노출 차단. **빈 상태** 보조 버튼 라벨 `viewAll`("전체 종목 보기")→`backToDefaultReset`("기본 화면으로 초기화")(reset은 기본 123 화면 복귀이므로 138 약속 오인 제거 — 138 경로는 상단 토글).
- **저장/알림 일관성**: `buildCurrentConfig`가 `perMax/pbrMax`를 그대로 직렬화 → "전체 보기"는 `NO_MAX`로 저장·왕복, 기본 보기는 200/30. `matchConfig.ts`·`evaluate-alerts` 크론 무변경(상한이 state에 인코딩되어 자동 일관). nonThemeFilterCount/activeChips는 `perMax<200`/`pbrMax<30` 기준 → NO_MAX는 **상세 필터로 집계 안 됨**(전체 보기 = 상세 필터 0, 칩 0 일관).
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 SSG, 전 라우트) · `git diff --check` 0 · 변경 2파일 U+FFFD/모지바케 0. `app:check` 생략(shell/nav/PWA/auth 무변경 — 표시 카피만). 로컬 prod **4399**(리스너 PID 37840만 종료·**AI Center 4310 무중단·종료 후 4310 LISTENING(PID 37328) 확인**): `/stocks` 200, SSR(ko) `기본 품질 필터 적용 중: 123개 / 전체 138개`·`전체 138개 보기` 토글·3행 블록(`기본 품질 필터: PER ≤ 200, PBR ≤ 30`·`상세 필터`·`정렬: 종합점수 높은순`)·하단 `현재 123개 …, 전체 138개를 보려면 기본 품질 필터를 해제하세요` 렌더, 구 충돌 문구(`전체 138개 종목을 종합점수`·`적용된 사용자 상세 필터 없음`) 0건. EN은 클라 스위치라 청크 grep으로 신규 키(`Default quality filter on`·`View all `·`Default view`·`turn off the default quality filter`·`No max`) 컴파일 확인.
- **남은 갭(후속·운영자)**: 390px 실 브라우저 육안은 Playwright 미구성 → 운영자 게이트(코드 가드만). 최종 점검 P1(관심 빈 상태·공시 강도 용어)·P2(히트맵 단위·업종 표본)는 별도 후속.

## 2026-06-29 · [claude] task 108 — 최종 점검 P0 데이터 기준일 페이지 일관성 (종목 상세 → 전역 스냅샷 통일)
- **범위**: `ornscore_reaudit_2026-06-29_final_check.md`(데스크톱) **P0-1 데이터 기준일 페이지별 불일치**. 종목 상세 헤더/데이터 기준 섹션이 전역 스냅샷(`dataMetadata.asOfBusinessDate`)과 다른 기준일·다른 포맷으로 노출되던 문제를 **A안(전역 스냅샷 단일 소스)**으로 통일. 표시/문구만(점수식·`stocks.json`·인증·manifest·PWA 무변경, 신규 npm 0, 매수/매도/추천 0). 변경 5파일.
- **감사(읽기 전용)**: 헤더 데이터바·푸터·`/stocks`(`asOf={formatBizDateLong(dataMetadata.asOfBusinessDate)}`)·`/status`·`/`·`/disclosures`·`/backtest`·`/pricing`·`/compare`·`/history`·`/guide/metrics`는 **이미 전역 스냅샷**을 읽어 `2026.06.29 (월) 장마감` 일치. `/about`·`/watchlist`는 자체 기준일을 렌더하지 않고 **공통 헤더/푸터를 상속**(검증만). grep(`lastPoint`·`points[`·`.d ??`·`getPriceHistory`·`asOf=`)으로 **유일 발산원 = `src/app/stock/[ticker]/page.tsx`의 `priceAsOf = lastPoint?.d`**(per-stock 가격 시계열의 마지막 거래일, raw `YYYY-MM-DD`)임을 확인.
- **근본 원인**: 종목 상세는 `priceAsOf`(예 `2026-06-29`, dash 포맷)를 hero `asOfLabel`·`LivePrice asOf`·`DataBasisCard priceAsOf`에 직접 넘겨 (1) 포맷이 전역 `2026.06.29 (월)`와 다르고 (2) 배포 캐시/데이터 시점차 시 종목별로 과거 날짜가 그대로 노출(감사 시점 `2026.06.26`)될 수 있었음. `scoreDate`만 `formatBizDateLong(asOfBusinessDate)`로 전역과 일치.
- **수정(A안 통일 + B안 방어 안내)** — `src/app/stock/[ticker]/page.tsx`: `globalAsOf = formatBizDateLong(dataMetadata.asOfBusinessDate)` 계산. `priceAsOf`를 `YYYYMMDD`로 정규화해 `dataMetadata.asOfBusinessDate`와 비교(`priceLagsGlobal`). **정상(같거나 최신)이면** hero `asOfLabel`·`DataBasisCard` 주가 행·`LivePrice asOf` 모두 `globalAsOf`(값+포맷 전역 일치). **종목 주가가 실제로 더 과거면** `priceLagAsOf`(정식 포맷)로 명시 안내(`전체 서비스 기준 {globalAsOf} 장마감 · 이 종목 주가 {priceLagAsOf} 기준(최신 배치 미반영)`), `LivePrice`는 종가가 실제로 찍힌 과거일을 표시해 라벨 정합. **현재 데이터는 138종목 가격 시계열 마지막 점이 모두 `2026-06-29` → 전 종목 정상 분기(전역 일치)**, 지연 안내는 미래 시점차 방어용.
- **카피** — `src/lib/copy/stockDetail.ts`에 `priceBasisLagCopy`(ko/en) 신설(servicePrefix·stockMid·stockSuffix 조각, 클라에서 두 날짜와 조합). `StockConclusionHero.tsx`→`StockHeader.tsx`에 `priceLagAsOf` prop 스레드(지연 시 amber 안내, 정상 시 기존 `{asOfLabel} 장마감 기준`). `StockDetailIntro.tsx` `DataBasisCard`에 `priceLagAsOf` prop 추가(지연 시 amber 안내, 정상 시 `{globalAsOf} 장마감`).
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 SSG, 전 라우트) · `git diff --check` 0 · 변경 5파일 U+FFFD 0. `app:check` 생략(layout/nav/shell/PWA/auth 무변경 — 표시 카피만). 로컬 prod **4399**(내 PID 34960만 종료·**AI Center 4310 무중단·종료 후 4310 LISTENING(PID 37328) 확인**): `/stock/034730·005930·000660`·`/stocks`·`/watchlist`·`/about`·`/status`·`/` 200. SSR(ko) 전 라우트 `2026.06.29 (월)` 일치, 사용자 노출 `2026.06.26` 0건(상세 HTML의 `2026-06-26`은 가격 차트 시계열 점·차트 x축 범위 `2026-03-30 ~ 2026-06-29`·JSON-LD `datePublished` ISO뿐 — 기준일 라벨 아님). 종목 상세 `LivePrice`=`2026.06.29 (월) 종가`·헤더=`2026.06.29 (월) 장마감 기준`. EN 지연 안내(`not yet in the latest batch`)·KO(`최신 배치 미반영`) 청크 컴파일 확인.
- **남은 갭(후속·운영자)**: ISR/배포 캐시 — 각 `revalidate` 라우트가 레이아웃 데이터바 기준일을 독립 캐시하므로, **데이터 갱신 후 전체 재배포가 stale 날짜를 flush하는 운영 단계**(코드 변경 아님). 시크릿/강력 새로고침 동일 표시는 재배포 후 운영자 확인. P0-2(`/stocks` 123/138 필터 문구)·P1(관심 빈 상태·공시 강도 용어)·P2(히트맵 단위·업종 표본)는 최종 점검의 별도 항목으로 후속.

## 2026-06-29 · [claude] task 102 — 재검수 P2 정적 텍스트·접근성·신뢰 문구 (배지 분리·STEP ol>li·업종 카운트·공시 CTA/배지·백테스트 단위/날짜·밸류 경고)
- **범위**: `ornscore_reaudit_2026-06-29.md`(데스크톱) **P2-1~P2-6**(§6) + §7.3/7.4/7.5/7.12. 카피/마크업/스타일만(점수식·`stocks.json`·인증·manifest·PWA 무변경, 신규 npm 0, 매수/매도/추천 0). 라우트: `/stock/034730`·`/stock/032830`·`/disclosures`·`/backtest`·`/guide/metrics`.
- **P2-1 데이터 배지 정적 분리** — `src/components/stock/PriorityScoreCard.tsx`: pill 3종(필수 데이터 N% · 이상값 점검 통과/검증보류 · Metrics 2.4) 사이에 `<span className="sr-only"> · </span>` 삽입. 화면은 기존 pill 간격 유지, 정적 textContent·스크린리더는 `필수 데이터 100% · 이상값 점검 통과 · Metrics 2.4`로 끊어 읽힘(`100%이상값` 글루 해소). role=list/listitem·tone·suspect 분기·whitespace-nowrap 보존.
- **P2-2 STEP ol>li 구조화** — `src/components/BeginnerReading.tsx`: STEP 컨테이너 `div.grid` → `<ol class="… list-none p-0 m-0">`, 각 `StepCard`를 `<li class="h-full">`로 래핑(key를 li로 이동). 가시 번호는 `STEP n` 배지 단일 소스(네이티브 마커 없음 → list-none). `<a href>`·CONFIRM_HREFS 순서·상세 텍스트 보존. 정적/스크린리더에서 STEP 1/2/3가 별개 리스트 항목으로 읽힘.
- **P2-3 공시 CTA/배지 DOM 분리** — `src/components/DisclosureExplorer.tsx`: `notInUniverse`("분석 대상 외 · DART 원문만") 배지를 `flex items-center gap-2 flex-wrap` 액션 행 **밖**으로 빼 버튼 줄 아래 별도 `<div className="mt-1.5 …">`로 이동 → `원문 보기` 액션과 DOM·시각·텍스트 추출 분리(`원문 보기 분석 대상 외…` 글루 해소). **수치 노출 점검**: 카드에 `strength`(분류 신뢰도) 숫자 미렌더 확인 + `signalGuide.ts:54` cautionNote가 이미 "이 신호의 '강도'는 호재 점수가 아니라 …'분류 신뢰도'"를 명시 → 추가 라벨 불필요(검증만).
- **P2-4/5 백테스트 단위·날짜·추천아님** — `src/components/BacktestClient.tsx`: 상단 KPI 그리드 위에 amber 배지 `백테스트 기준: {yyyy-mm-dd} 생성 · 현재 데이터 {siteDataAsOf}과 다름`(siteDataAsOf 없으면 생성일만, 신규 `formatGeneratedDate` deterministic). 마지막 리밸런싱 구성 예시 제목에 `현재 추천 아님` amber 배지 강조(기존 회색 캡션 유지). **히트맵 단위는 이미 충족(검증만)**: `MonthlyHeatmap.tsx` 셀 `title`+`aria-label`에 `fmtPct`(%) 포함(`2022년 1월 수익률 -23%`). 하단 3날짜 블록 무변경.
- **P2-6 밸류 업종 미보정 경고 강조** — `src/lib/copy/stockDetail.ts` `metricInsightCardsCopy.valueNote` ko/en 강화("주의: 밸류는 업종 보정 전 전체 풀 기준 · 금융·지주는 구조적으로 높게 나올 수 있음 — 업종 내 위치는 아래 '업종 대비 밸류' 참고"). `src/components/stock/MetricInsightCards.tsx` 밸류 노트 스타일 cyan → amber 박스(border+bg). 138 하드코딩 안 함("전체 풀 기준").
- **P1-7 업종 카운트 통일(본인 포함)** — `stockDetail.ts` `sectorValue.peerDescMid` ko "개(본인 제외) 중 …" → **"곳(본인 포함) 중 …"**, en "(excluding this stock)" → "(this stock included)". 근거: `sectorValueScore`의 `peers`는 `pool.filter(per>0&&pbr>0)`로 **본인을 포함**(score≥0 분기는 target per/pbr>0 보장) → 실제 계산과 일치하고 `SectorComparison`의 "본인 포함"과 통일. 스모크: SK(034730) 두 카드 모두 `7곳(본인 포함)`, 삼성생명(032830) 모두 `15곳(본인 포함)` — 숫자·표현 일치. **플래너 제안("현재 종목 제외")이 계산과 모순이라 정확성 우선으로 "본인 포함" 채택.**
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 SSG, 전 라우트) · `verify_metrics.py` 138종목 0오류·금칙어 0·Metrics 2.4 일치 · `git diff --check` 0(CRLF만) · 변경 6파일 U+FFFD 0. `app:check` 생략(PWA/auth/shell 무변경). 로컬 prod **47102**(내 PID 31520만 종료·AI Center 4310 무중단): 5개 라우트 200. SSR(ko) 노출 — sr-only ` · ` 분리자·`<ol list-none>` STEP·`곳(본인 포함) 중 PER·PBR`·`주의: 밸류는 업종 보정 전`·백테스트 상단 `백테스트 기준: 2026-06-14 생성 · …`·`현재 추천 아님` 배지. EN은 빌드 청크에서 `(this stock included)`·`before sector adjustment` 컴파일 확인(ko/en 패리티).
- **남은 갭(후속)**: P2-3 `notInUniverse` 카드 배지는 현재 SSR 샘플 데이터에 분석 대상 외 공시 카드가 없어 화면 미노출(구조만 분리 — 비유니버스 공시 데이터 유입 시 표시). 도메인 support@/privacy@ 이메일·SEO 메타/OG·모바일 실기기 육안은 운영자 게이트(범위 외).

## 2026-06-29 · [claude] task 101 — 재검수 P1/P2 상용 준비 페이지 문구 명료화 (요금제·로그인·히스토리·개인정보)
- **범위**: `ornscore_reaudit_2026-06-29.md`(데스크톱) **P1-5·P1-8·7.7·7.11·7.14**. 텍스트 카피 + 위탁사 처리방침 링크만(점수식·`stocks.json`·인증·manifest·PWA 무변경, 신규 npm 0, 매수/매도/추천 0).
- **P1-5 요금제 비교표 값 중심화** — `src/lib/pricing.ts` `COMPARE_ROWS`: 관심 종목 pro/premium → **`무제한 예정`**, 종목 비교 → **`확장 예정`**, 공시 알림 pro/premium `true`(✓) → **`포함 예정`**("준비 중" 반복/모호 ✓ 제거). free 한도(`5개`/`4개`/`베타 무료`)·점수 급변(free `—`/pro·premium 준비 중)·실제 준비-only 행 무변경. `src/lib/copy/pricing.ts`: `classifyKoCell`에 "…예정" 종료 셀 → `planned`(amber) 매핑, `enCellText`에 무제한/확장/포함 예정 → `Unlimited/Expanded/Included (planned)` 명시(EN 한국어 누출 차단). 범례(제공/미제공/준비 중/베타 무료) 모순 없음.
- **요금제 7.7 데이터 수집 고지** — `copy/pricing.ts` ko/en `waitlistDataNote` 추가 + `PricingContent.tsx` `<WaitlistForm>` 아래 muted `<p>` 렌더("입력 이메일은 출시 알림 발송 목적만 수집·보관, 출시 후/수신 거부 시 파기"). privacy §3 waitlist 정책과 정합.
- **P1-8 로그인 과장 완화** — `src/lib/i18n.ts` `loginCopy.ko.lead` "1초 만에 시작" → **"빠르게 시작"**. EN lead 이미 보수적(무변경). **소셜 실패 + 매직링크 fallback 카피는 이미 완비(검증만)**: `login/page.tsx` `friendlyAuthError`(noCode/callback/provider/rateLimit/invalidEmail/unknown) + 이메일 "보냈어요"·스팸함 힌트.
- **7.11 히스토리 저장 항목 명시** — `src/app/history/page.tsx` 비로그인 헤더 + 로그인 서브헤더 양쪽에 "저장 항목: 분석한 종목 · 질문 · AI 응답 · 작성 메모." (privacy §1/§3 정합, 과대 저장 주장 0).
- **7.14 privacy 위탁사 링크 + 날짜** — `src/app/privacy/page.tsx` §5 7개 위탁사(Supabase·Vercel·Resend·Anthropic·Kakao·Google·Naver)에 공식 처리방침 링크(`target=_blank rel=noopener noreferrer`). "최종 갱신: 2026년 6월" → **"2026-06-29"**. **도메인 이메일 발명 안 함** — `songchankeun@gmail.com` 유지, 도메인 이메일은 docs 미래 노트만(공개 약속 0).
- **이미 됨(재작업 안 함)**: P1-1 `/terms` 내부 경로(`docs/legal-ai-commercial-readiness.md`)는 Task 99에서 제거 — `src/**/*.tsx` grep 0건 재확인, terms 내용 무변경 → 갱신일 그대로.
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 SSG, 전 라우트) · `npm run app:check` 통과(외부 게이트 1: assetlinks 대기-기존) · `git diff --check` 0(CRLF 경고만) · 변경 파일 U+FFFD 0. 로컬 prod **4399**(내 PID 35952만 종료·**AI Center 4310 무중단·종료 후 4310 LISTENING 확인**): `/pricing`·`/login`·`/history`·`/privacy`·`/terms` 200. SSR(ko) 노출 — 요금제 `무제한/확장/포함 예정`·waitlist 고지, `/history` 저장 항목, `/login` `빠르게 시작`(`1초 만에` 0), `/privacy` 위탁사 링크+`2026-06-29`. EN은 빌드 청크에서 `Unlimited/Expanded/Included (planned)`·waitlist EN 컴파일 확인.
- **남은 갭(후속)**: 재검수 P1-7(상세 업종 카운트 본인 포함/제외 통일)·P2(배지 띄어쓰기·STEP `ol>li`·공시 CTA/배지 DOM 분리·백테스트 히트맵 단위/aria·밸류 업종 미보정 경고). 도메인 support@/privacy@ 이메일 미구성 — 운영자 결정 대기(docs 노트만).

## 2026-06-29 · [claude] task 100 — 재검수 P1 출시 전 UX (카운트 맥락·순위 기준·빈/실패 상태)
- **범위**: `ornscore_reaudit_2026-06-29.md`(데스크톱)의 **P1-2·P1-3·P1-4·P1-6** 4건. 카피 + `<noscript>` fallback만(점수식·`stocks.json`·인증·manifest·PWA 무변경, 신규 npm 0, 매수/매도/추천 0).
- **P1-2 홈 공시 카운트 맥락** — 기저 정합(50=최신 200건 내 raw 신호 / `/disclosures` 42=이벤트 묶음)은 Task 99 시기 정리됨. 홈 스냅샷 카드 맨숫자 오해 위험만 라벨로 해소: `src/lib/copy/home.ts` 스냅샷 signal `sub` ko "DART · 최신 200건 내"→**"DART · 최신 200건 내 · 신호 기준"**(en "… · signal basis"). 숫자 로직 무변경.
- **P1-6 홈 후보 순위 vs 상세 전체 상대순위** — 상세는 이미 양호. 홈만 카피 명료화: `home.ts` `topCandidate`에 `rankCriteria`(ko/en)·`rankBadgeAria(n)` 추가 → `TopCandidateSection.tsx` intro 아래 캡션 + `StockCandidateCard.tsx` 순위 배지 `title`/`aria-label`("오늘 후보 순위 N위"). 홈에 전체 풀 순위 숫자 계산은 추가 안 함(캡션으로 충분).
- **P1-3 `/watchlist` 정적/실패 fallback** — 인터랙티브 빈 상태는 이미 양호(검증·보존). 갭=SSR/no-JS 시 `loading`만 보여 "불러오는 중…" 고착. `src/app/watchlist/page.tsx`에 `<noscript>` 빈 상태(종목 찾기→`/stocks`·오늘 후보 보기→`/today`, 로그인 보조) 추가 + `WatchlistClient.tsx` `loading` 분기 보조 한 줄.
- **P1-4 `/compare` 빈 상태·CTA·한도** — 인터랙티브 빈 상태(in-page 검색·추천 세트·빠른추가·최소 2개·최대 4개)는 이미 충족(검증·보존). 갭=`!mounted` 시 `return null` → SSR/no-JS 빈 화면. `src/app/compare/page.tsx`에 `<noscript>` 빈 상태(한도 명시 + 종목 찾기·오늘 후보에서 고르기) 추가.
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 SSG, 전 라우트) · `git diff --check` 0(6파일) · U+FFFD 0. `app:check` 생략(PWA/auth/shell 무변경). 로컬 prod **47100**(내 PID만 종료·**AI Center 4310 무중단**): `/`·`/disclosures`·`/watchlist`·`/compare`·`/stock/034730` 200. SSR(ko) 신규 문구·noscript 블록 노출 확인. EN은 빌드 청크에서 신규 문자열 컴파일 확인.
- **남은 갭(후속)**: P1-5(요금제 표 값 중심)·P1-7(상세 업종 카운트 통일)·P1-8("1초" 과장)·P2(배지 띄어쓰기·백테스트 히트맵 단위/aria·STEP `ol>li`).

## 2026-06-29 · [claude] task 99 — 재검수 P0 신뢰 문구 3건 (stocks 카운트·status 시간대·terms 내부경로)
- **범위**: `ornscore_reaudit_2026-06-29.md`(데스크톱)의 **즉시 수정 P0 3건**만. P1/P2(공시 50/42 라벨·홈/상세 순위·관심/비교 빈 상태·요금제 표·업종 카운트·배지 띄어쓰기·백테스트 히트맵 등)는 후속.
- **P0-1 `/stocks` 카운트·필터 문구 충돌(안 A)** — `src/lib/copy/stocks.ts`(ko/en): `matchCount`·`matchCountShort` 라벨 "조건 충족"→**"현재 표시"**(en "match"→"Showing … / total"). `noDetailFilter` "적용된 상세 필터 없음"→**"적용된 사용자 상세 필터 없음"**(en "No user detail filters applied"). `describeAll(total)`→**`describeAll(shown,total)`** 분기: `shown<total`이면 **"기본 품질 필터(PER 200·PBR 30 이하)가 적용된 N개 종목을 종합점수 기준으로 보고 있습니다."**, `shown===total`이면 기존 "전체 N개 …" 유지. `StocksExplorer.tsx` line 481 호출만 `t.describeAll(sorted.length, total)`로 변경. 기본 화면(123/138)에서 "전체 138개를 보고 있다"는 충돌 제거. `baseScreenNote`(이미 PER/PBR 정확)·제외 사유는 무변경(검증보류 주장 추가 안 함 — 제외 수는 PER/PBR 기본 필터에서만 나옴).
- **P0-2 `/status`·데이터 바 점수 계산 시각 시간대** — `src/app/status/page.tsx`: `generatedAt`(GitHub Actions UTC naive ISO)을 `formatScoreTimes()`로 **KST(+9h)·UTC 두 표기** 산출(정규식 파싱 + `Date.UTC`+9h, 신규 의존성 0). props `generatedAt`→`scoreTimeKst`+`scoreTimeUtc`. `StatusContent.tsx`: 스냅샷 셀에 **`{scoreTimeKst} KST`** 우선 + 캡션 `(장마감 후 배치)` + 보조 muted `원본 배치 {scoreTimeUtc} UTC`. 스냅샷 노트 아래 carry-forward 문구 추가. `copy/status.ts`(ko/en): `scoreTimeBatchNote`·`scoreTimeUtcLabel`·`dataCadenceNote`("가격·점수 데이터는 한국거래소 영업일 장마감 후 갱신되며, 주말·휴장일에는 마지막 정상 영업일 데이터가 유지됩니다.") 추가. 검증: 10:44 UTC→19:44 KST(스펙 예시 일치).
- **P0-3 `/terms` 내부 문서 경로 노출 제거** — `src/app/terms/page.tsx`: `위 항목 추적: docs/legal-ai-commercial-readiness.md.` 절 삭제 → **"가격과 유료 정책은 현재 미확정이며, 유료 결제 오픈 전 약관과 결제 화면에 동일하게 확정 공지합니다(요금제 안내)."**로 교체. `/pricing` 링크 보존. src 전체에 해당 경로 잔여 0(docs/* 내부 참조는 무관).
- **금융 문구**: 보수적·비자문 유지(매수/매도/추천/수익보장 0). 신규 확정 유료 정책 주장 0.
- **검증**: `npx tsc --noEmit` 0 · `npm run build` 0(138 종목 SSG, 전 라우트) · `npm run app:check` 통과(외부 게이트 1: assetlinks 대기-기존, 텍스트 전용 변경이라 PWA/auth/shell 무관) · `git diff --check` 0(변경 6파일만) · 변경 파일 U+FFFD 0. 로컬 prod **3199**(내 PID만 종료·**AI Center 무중단**): `/`·`/stocks`·`/status`·`/terms`·`/stock/005930` 200. SSR(ko)에 "현재 표시"·"기본 품질 필터(PER 200·PBR 30 이하)가 적용된"·"적용된 사용자 상세 필터 없음" 노출, 구 "전체 138개 …보고 있습니다" 0건. `/status` KST·원본 배치·장마감 후 배치·carry-forward 노출. `/terms` `legal-ai-commercial-readiness` 0건. 언어 전환이 클라이언트라 EN은 빌드 청크에서 신규 문자열(`default quality filter: PER`·`No user detail filters applied`·`last business-day data is carried forward`·`after market-close batch`) 컴파일 확인.
- **남은 갭(후속)**: 재검수 P1(홈 공시 50/42 라벨 일치·홈↔상세 순위 기준 분리·`/watchlist`·`/compare` 빈 상태/실패 fallback·요금제 비교 표 값 중심·종목 상세 업종 카운트 본인 포함/제외 통일·데이터 품질 배지 띄어쓰기)·P2(STEP `ol>li`·공시 CTA/배지 DOM 분리·백테스트 히트맵 `%`/aria·밸류 업종 미보정 경고 강화).
- **다음**: 운영자/제품 — P1 빈 상태(관심/비교) 보강이 신뢰감 영향 큼(스펙 §10 최종판단 4순위). 그다음 홈/상세 순위 기준 분리 표기.

## 2026-06-28 · [claude] task 93 — 3차 QA P1 감사 + Pro 관심 종목 공시 수집 설계 노트
- **범위/판단**: `ORNSCORE_3rd_QA_improvement_spec.md` P0(상세·비교) 이후 **P1 명료성 항목(공시 필터·탐색 밀도·요금제 베타 고지·공시 200건 한계·AI 고지)**. 먼저 현황 전수 점검 → **5개 P1 모두 이미 배포됨 확인**(Task 60/61/62/66/89~94). 따라서 작동하는 컴포넌트 재작업 금지, 감사 + **유일한 신규 산출물 = P1-4(§10) 공시 수집 설계 노트**.
- **감사 결과(읽기 전용·무변경)**:
  - **P1-1 공시 필터 명료화** — `DisclosureExplorer.tsx` 범위 토글이 세그먼트 버튼 그룹(`role=group`·`aria-pressed`·선택 시 blue-600 채움+ring·카운트 배지) + 설명 한 줄(`scopeUniverseDesc`/`scopeAllDesc`) + "최신 200건 내" 배지. ko/en `copy/disclosures.ts` 양쪽 완비. ✅
  - **P1-2 탐색 첫 화면 밀도** — `StocksExplorer.tsx` 첫 화면 순서 = **검색 → 질문형 프리셋 카드(예상 결과 수) → 빠른 프리셋 칩(기본 접힘) → 정렬/상세 필터 drawer**. 유용한 필터 기능 보존. ✅
  - **P1-3 요금제 베타 무료 고지** — `PricingContent.tsx`+`copy/pricing.ts` sky `betaCard` 콜아웃: 베타 무료 알림 → **정식 출시 시 Pro 전환 예정 · 시점/가격 미확정 · 변경 전 미리 공지**. 확정 유료 가격 0("미확정"/"under review"). ✅
  - **P1-5 AI 분석 개인정보·비자문 고지** — `AiAnalysisCard.tsx`+`aiAnalysisCardCopy`: 실행 전 고지(데이터→Anthropic 미국·민감 개인정보 금지·참고용) + **필수 동의 체크박스로 실행 게이팅** + 결과 상단 면책 + 푸터/하단 "투자 추천 아님·최종 책임 본인". `privacy/page.tsx`(Anthropic 미국·국외이전 표·학습 미사용)와 정합. ko/en 완비. ✅
- **신규 산출물(P1-4 §10)**: `docs/ornscore-beta-launch-checklist.md` **(g) 공시 수집 범위 설계 노트** 추가 — (g-1) 현재 최신 200건 제한 정직 고지 표면 정리(`/disclosures`·홈·`/status`·종목 상세) / (g-2) **알림이 일반 200건 피드에 의존하면 안 되는 이유**(누락·커버리지 미보장·신뢰성) / (g-3) **권장 설계**(기존 `listDisclosuresByStock` 종목 단위 조회 재사용 + 영속 커서 `watched_disclosure_cursor` 델타 감지 + cron 배치/rate limit + 탐색 피드 분리 유지) / (g-4) 범위 경계(설계만, 파이프라인·스키마·cron = 대기④). `ornscore-spec-coverage.md` line 52(D §19.2)에 교차 참조 추가.
- **금융 문구**: 보수적·비자문 유지. 신규 금칙어 0(매수/매도/추천/수익보장). 확정 유료 정책 신규 주장 0.
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 종목 SSG, 전 라우트) · `git diff --check` 0 · 변경 문서(.md) U+FFFD 0. **소스 코드 무변경(문서 3종만)** → `app:check`·로컬 prod 스모크 불요(app-facing 소스 무변경).
- **남은 갭(후속)**: ④ 공시 전체 기간 수집 파이프라인 + 관심 종목 알림 라이브(g-3 설계 구현)·관리자 상태판·결제/법무 확정·실브라우저 390px 육안(운영자 Playwright 게이트).
- **다음**: 운영자/제품 — 알림 라이브 결정 시 (g-3) 설계대로 종목 단위 수집 + 영속 커서 착수, 또는 spec §19.2 전체 기간 수집 파이프라인.

## 2026-06-28 · [claude] task 94 — 모바일 드로어/로그인 레이아웃 수리 (헤더 backdrop-filter 컨테이닝 블록 탈출)
- **증상**: 모바일 햄버거 메뉴를 열면 드로어가 헤더 영역에 갇힌 좁은 좌측 패널처럼 보이고 백드롭이 페이지를 다 못 가려 데이터바·KO/EN·테마·로그인 카드가 드로어와 겹쳐 보임(운영자 스크린샷).
- **근본 원인**: `AppHeader`의 `<header>`가 `backdrop-blur-md`(=`backdrop-filter`)라 **고정 위치 자손의 컨테이닝 블록**이 됨 → 헤더 안에서 렌더되는 `MobileNav` 드로어/백드롭의 `fixed`가 뷰포트가 아니라 짧은 헤더 바 기준으로 잡혀 클리핑·겹침.
- **수정(`src/components/MobileNav.tsx` 1파일)**: 드로어+백드롭을 `createPortal(<>…</>, document.body)`로 헤더 밖 body 직속으로 포털 → 컨테이닝 블록 트랩 탈출. SSR 안전 `mounted` 가드로 마운트 전 미렌더. 드로어 폭 `w-[300px] max-w-[85vw]` → `w-[min(340px,calc(100vw-48px))]`(360–390px 우측 여백 48px 보장). 푸터 테마/언어 행 `flex-wrap gap-2`로 좁은 폭 줄바꿈. body 스크롤 락·Escape·라우트 변경 자동 닫기·`loginNext`·로그아웃·내부 스크롤(`flex-1 overflow-y-auto`) 전부 보존. `z-[60]/z-[61]`이 body 직속이라 헤더(z-40)·하단 탭(z-40) 위에 전역으로 뜸.
- **무변경(검증만)**: `LanguageSwitcher`·`ThemeToggle`(wrap 후 클리핑 없음), `/login`(포털 백드롭이 카드/소셜/이메일 폼 완전 덮음, 360px 오버플로 없음), `HeaderDataBar`/`MobileBottomNav`.
- **검증**: `npx tsc --noEmit` 0 · `npm run build` 0(138 종목 SSG) · `npm run app:check` 통과(외부 게이트 1: assetlinks 대기-기존) · `git diff --check` 0 · `MobileNav.tsx` U+FFFD 0. 로컬 prod **3500**(내 PID만 종료·**AI Center 4310 무중단**): `/login`·`/`·`/stocks`·`/stock/005380` 200, 클라 청크에 새 폭 토큰·`explorationNotice` 컴파일 확인.
- **남은 UI 리스크**: 실기기 390px 육안은 운영자 게이트(Playwright 미구성). 데드 코드 `MobileMenu.tsx`는 범위 밖 무변경(추후 정리 후보).
- **다음 구체 작업**: Task 93 — P1 공시/가격/AI 고지 정리.

## 2026-06-28 · [claude] task 92 — 3차 QA P0-B 비교 페이지 시작 화면 마감 (큐레이션 vs-쌍 추천 + 390px 디클러터)
- **범위**: `ORNSCORE_3rd_QA_improvement_spec.md` P0-B = `/compare` 빈 상태를 종목 2개 선택 전에도 "완성된 비교 시작 화면"으로. 검색·추천 세트·선택 칩 제거·최근/관심 추가·모바일(≈390px) 사용성.
- **현황 점검(재작업 안 함)**: 직전 작업으로 검색(`StockSearchBox`)·선택 칩(`aria-label` × 제거)·추천 세트·최근 본·오늘 Top5·관심·`/stocks` 탐색이 이미 구현돼 있음 확인 → spec이 콕 집은 두 갭만 보강.
- **수정 ① 추천 세트를 "A vs B" 동종 피어 쌍으로** (`src/app/compare/page.tsx`): 큐레이션 후보 4쌍(삼성전자005930↔SK하이닉스000660·삼성생명032830↔미래에셋생명085620·DB하이텍000990↔한미반도체042700·에코프로비엠247540↔엘앤에프066970)을 `byTicker`로 검증 — **두 종목 모두 존재 & `isSuspect` 아님**일 때만 `label:"A vs B"`로 노출. 에코프로비엠(PER≥300)·엘앤에프(ROE≥80) 둘 다 검증 보류 → 자동 제외(3쌍 생존). 기존 같은-업종 그룹은 **큐레이션이 커버한 업종(반도체·보험) dedup 제외** 후 보충, **총 4세트 슬라이스**. 결과 = 3 쌍 + `2차전지·소재` 1개.
- **수정 ② 390px 디클러터** (`src/components/CompareClient.tsx`, `stocks.length < 2` 시작 화면만): 히어로 축소(emoji `text-2xl`)·외곽 패딩 `p-6 md:p-10`→`p-4 md:p-8`·**최근 본/오늘 Top5/관심을 테두리 박스 3개 → 가벼운 라벨 그룹(`space-y-3.5`)으로** 통합해 6박스 적층 제거(검색만 강조 박스 유지). 추천 버튼은 label에 `" vs "` 있으면 names 서브타이틀 생략. 모든 어포던스·`min-h-[44px]` 터치타깃·`flex-wrap` 보존. `addToCompare`/`removeFromCompare`/`clearCompare`/`addSet`/결과 뷰 무변경.
- **금융 문구**: 보수적·비자문 유지(매수/매도/추천/수익보장 0).
- **검증**: `npx tsc --noEmit` 0 · `npm run build` 0(138 종목 SSG) · `python scripts/verify_metrics.py`(PYTHONUTF8) 138/0·금칙어 0·Metrics 2.4 · `npm run app:check` 통과(외부 게이트 1: assetlinks 대기-기존) · `git diff --check` 0 · 변경 파일 U+FFFD 0. 로컬 prod **3500**(내 PID만 종료·**AI Center 4310 무중단**): `/compare` 200, flight 페이로드에 큐레이션 라벨 3종 + 보충 `2차전지·소재` 확인, 검증 보류 쌍(에코프로비엠 vs 엘앤에프) 미노출 확인.
- **남은 갭(후속)**: (1) `/compare`는 한국어 전용 — 언어 전환이 이 페이지를 마운트하지 않아 i18n 미적용(EN 잔여, 스코프 밖). (2) 실브라우저 390px 육안은 운영자 게이트(Playwright 미구성). (3) 추천 쌍은 정적 큐레이션(suspect 자동 제외만 동적).
- **다음 구체 작업**: P1 — 공시 전체 시장/분석 대상 토글, 종목 탐색(`/stocks`) 첫 화면 밀도/우선순위 정리.

## 2026-06-28 · [claude] task 91 — 3차 QA P0-A 종목 상세 UI 마감 (CTA·STEP·배지 검증 + 잔여 행동 문구 중립화)
- **범위**: `ORNSCORE_3rd_QA_improvement_spec.md` PART A P0-A = 종목 상세 (1) CTA 버튼 붙음 (2) 초보자 STEP 가이드 붙음 (3) 데이터 품질 배지 붙음 (4) 남은 행동성 문구 제거. 비교 페이지(P0-4)·P1 이하는 범위 밖.
- **현황 점검 결과(재작업 안 함)**: (1)(2)(3)은 이미 분리 렌더링 구현됨을 코드·SSR로 확인 — `StockDetailActionButtons.tsx`(grid 1→2→4열, 독립 `<a>`, `min-h-[44px]`, gap, flex 스타일), `BeginnerReading.tsx`의 `StepCard`(grid 1→3열, STEP 라벨/제목/설명 분리 카드 3개), `PriorityScoreCard.tsx`의 `DataStatusPill`(flex-wrap, 독립 pill 3종: 필수 데이터 %·점검 통과/검증 보류·Metrics 2.4). spec 예시 글루(`공시 확인재무 보기`·`100%이상값`) 0건 확인.
- **수정(잔여 행동 문구 중립화)**: `src/lib/metricReadings.ts` 2줄. (a) 위험조정 <40 `"출렁임 감내 가능한 비중으로 접근 권장"` → `"변동 폭이 큰 구간 — 실제 일간 변동·최대낙폭과 본인 감내 범위를 함께 확인"` (행동 권유 "접근 권장"·"비중" 제거, 확인 톤). (b) 거래활성도 <40 `"… 회복 신호 기다리기"` → `"… 거래량 회복 신호가 나오는지 확인"`. spec §7 핵심 예시(`저가 매수일지 …`)는 이미 `"반등 근거와 추가 하락 위험을 함께 확인"`으로 선반영돼 있어 무변경. 점수식·`Reading` 타입·이모지·임계값 불변. 나머지 "매수/매도" 잔존은 전부 비자문 고지(`매수·매도 추천이 아닙니다`)·DART 사실 방향 라벨(장내매수/장내매도 단서)로 유지가 정답.
- **검증**: `npx tsc --noEmit` 0 · `npm run build` 0(138 종목 SSG) · `python scripts/verify_metrics.py`(PYTHONUTF8) 138/0·금칙어 0·Metrics 2.4 · `npm run app:check` 통과(외부 게이트 1: assetlinks 대기-기존) · `git diff --check` 0 · 변경 파일 U+FFFD 0. 로컬 prod **3500**(내 PID만 종료·**AI Center 4310 무중단**): `/stock/005380·005930·032830` 200, SSR에 글루 텍스트 0 / CTA 4 hrefs 분리 / STEP 3 카드 / 배지 3종(필수 데이터·점검 통과·Metrics 2.4) 분리 / 신규 중립 문구 컴파일 확인.
- **남은 갭(후속)**: P0-4 비교 페이지 빈 상태(검색·추천 세트·최근/관심 추가 UI) 미완 — 다음 작업 1순위. `metricReadings`·`conclusion`·`scoreBasis`·`signalGuide` 파생 문구는 EN에서도 한국어(i18n 잔여). 실브라우저 390px 모바일 육안은 운영자 게이트.
- **다음 구체 작업**: P0-4 비교 페이지 빈 상태를 "비교 시작 화면"으로 마감(종목 검색 + 추천 비교 세트 + 최근 본/관심 종목 추가, 칩 제거 가능, 2종목 전에도 완성도).

## 2026-06-28 · [claude] task 90 후속 수리 — 로그인 링크 hydration mismatch 해결
- **증상**: Playwright 품질게이트(데스크톱·모바일 모두) 실패 — `AccountButtons`의 로그인 `href`가 서버/클라이언트 불일치. 서버 `/login?next=%2Fstock%2F005380` vs 클라 `/login?next=%2Fstock%2F005380%3Flang%3Den`. 원인: 렌더 중 `window.location.search`를 직접 읽어 SSR엔 `?lang=en`이 없고 클라엔 있어 React hydration 경고 발생.
- **수정**: `src/components/AccountButtons.tsx` — 쿼리스트링을 렌더 중 읽지 않고 `useState("")`+`useEffect`(pathname 의존)로 **마운트 후에만** 채우도록 변경. 초기 렌더가 SSR과 동일(빈 search)해져 mismatch 제거. 복귀 목적지(next)에 쿼리는 hydration 후 정상 반영, 인증·동작 무변경.
- **검증**: `npx tsc --noEmit` 0 · `npm run build` 0 · `npm run app:check` 통과 · `git diff --check` 0 · 변경 파일 U+FFFD 0.

## 2026-06-28 · [claude] 영어 지원 QA + 홈 화면 다국어화 + 모바일 점검 (task 90)
- **목표**: task 89(영어 v2) 위 후속 QA·모바일 폴리시. task 89 결과를 먼저 점검하고 **재번역 대신 가장 영향 큰 갭**을 메움.
- **핵심 발견**: task 89는 `/stocks`·`/stock/[ticker]`·`/today`·`/disclosures`·`/pricing`·`/status`·`/guide/metrics`·`/terms`·`/privacy`를 충실히 영어화했고 모바일 하드닝(`break-words`·`min-w-0`·`flex-wrap`·`overflow-x-auto`·`min-h-[44px]`)도 이미 잘 돼 있었다. **가장 큰 잔여 갭 = 홈(/) 히어로 아래 전 구간이 영어 모드에서도 한국어**(시장 스냅샷·오늘 후보 카드·공시 신호 카드·핵심 기능·사용 방법·데이터 출처 푸터). 영어 사용자가 첫 화면에서 서비스를 이해하지 못하는 최대 임팩트 지점이라 이를 우선 처리.
- **반영(홈 다국어화)**: 신규 `src/lib/copy/home.ts`(ko/en 단일 출처: 지표 라벨 key→라벨, 후보 카드 강점/주의/risk 종류별 문장, 공시 카드 확인포인트 signalType별, 시장 스냅샷·핵심 기능·사용 방법·데이터 출처). 홈 서버 카드들을 `"use client"`+`useLanguage`로 전환: `MarketSnapshotCards`·`FeatureCards`·`HowItWorksSection`·`TopCandidateSection`·`StockCandidateCard`·`DisclosureSignalSection`·`DisclosureSignalCard`, 신규 `HomeDataSourceFooter`. `HomeHero`·`TodayContent`의 후보 칩도 신규 구조에 맞춤.
- **데이터/점수 무변경**: 서버 `page.tsx`는 점수·필터 그대로. 강점 칩은 `metrics: string[]`(한국어 "추세 96") → `StrongMetric[]`(key+값)로, 주의문구는 서버 문자열 → `riskKind`(원시 점수로 분기만, 문장은 클라 현지화)로 바꿔 `stocks.json`·점수식·`direction` 불변. 종목명·업종·공시 원문(corpName/reportNm/signalLabel)·숫자는 원형 유지(스코프상 시장·공시 데이터 한국어 허용).
- **금융 문구**: 양 언어 보수적·비자문 유지(매수/매도/추천/수익보장 0). risk 문구는 모두 "확인 필요/검토 필요 → check/review" 톤.
- **신뢰·법무**: `/terms`·`/privacy`는 task 89의 `LegalEnSummary`(EN 요약 + `LEGAL_EN_PENDING_NOTE` "full English legal translation is pending owner/legal review", 한국어 본문 정본 유지)가 정상 연결됨을 확인 — 추가 수정 불필요. `/`·`/pricing`은 EN에서 "data exploration tool, not investment advice"가 명확.
- **모바일**: task 89 컴포넌트가 이미 wrap/min-w-0/44px 터치타깃을 갖춰 신규 결함 없음. 홈 카드 전환 시 기존 반응형 클래스(grid 2열/4열·truncate·flex-wrap·min-h-[44px]) 그대로 보존. `/pricing` 긴 `priceLabel`은 카드 헤더 짧은 라벨 + 본문 `break-words`로 이미 안전.
- **검증**: `npx tsc --noEmit` 0 · `npm run build` 0(176p SSG) · `npm run app:check` 통과(기존 외부 게이트 1: assetlinks 대기) · `git diff --check` 0(CRLF만) · 변경/신규 12파일 U+FFFD 0. 로컬 prod **3500**(내 PID만 종료·**AI Center 4310 무중단**): 11개 라우트 200. KO SSR 홈은 한국어 기본 유지(회귀 0), EN 홈 카피(`Today's market snapshot`·`OrnScore core features`·`More candidates to check today`·`Data sources:` 등) 클라 청크 컴파일 확인. `/login` 카카오·구글·이메일+네이버"설정 필요" KO SSR 렌더 + EN(`Continue with ...`·`Setup needed`) 청크 컴파일(인증 동작 무변경).
- **남은 i18n 갭(후속)**: (1) 종목 상세 **라이브러리 파생 문구**가 EN에서도 한국어 — `@/lib/conclusion`·`composeReasonV2`(결론 type/요약/리스크), `metricReadings`·`scoreBasis`(지표 해석·점수 근거), `disclosureType`·`signalGuide`, AI 인사이트 LLM 출력. (2) 서버 `metadata`(title/description/OG) 한국어 고정 — 클라 전환 불가, `/en` 라우팅 시 처리. (3) `/terms`·`/privacy` **영어 요약만 — 전문 법무 번역은 운영자/법무 검토 잔여**. (4) 헤더 워드마크 "오른스코어" 브랜드 유지.
- **다음 구체 작업**: 종목 상세 라이브러리 파생 문구(conclusion·metricReadings·scoreBasis·disclosureType·signalGuide)를 로케일 인식으로 전환해 `/stock/[ticker]` 결론·근거까지 완전 영어화 → 이후 `/en` URL 라우팅 + `metadata`/OpenGraph 다국어화.

## 2026-06-28 · [claude] 영어 지원 v2 — 핵심 제품 화면 다국어화 (task 89)
- **목표**: v1(진입/로그인/내비) 위에서 해외 사용자가 첫 화면·로그인을 넘어 **실제로 서비스를 쓰도록** 핵심 화면을 영어로 확장. v1 토대(`src/lib/i18n.ts`·`LanguageProvider`·`useLanguage`)는 재사용하고, 클라이언트 전환 방식(쿠키/localStorage/`?lang=`) 유지. `/en` URL 라우팅·`metadata` 다국어화는 도입하지 않음(정적 생성 경로 불변).
- **번역 범위(반영 완료)**: `/stocks`(검색·필터·정렬·빈상태·비교/관심 CTA·신호 칩), `/stock/[ticker]`(결론카드·CTA·초보 단계·데이터 품질 배지·점수 근거·탭·AI 카드·공시), `/today`(섹션·Top3·브리핑·체크리스트·신호 카드 칩), `/disclosures`(필터·카드·신뢰 설명·수집 범위·DART 안내), `/pricing`(설명·베타→Pro·법적 고지·대기자 폼; 플랜명 Free/Pro/Premium 유지), `/status`(스냅샷·종류별 상태·알려진 제한·자동 점검·소스·오류 신고), `/guide/metrics`(지표 4종 설명·검토 포인트·종합·공통 기준), `/terms`·`/privacy`(영어 요약 토글 — 전문 번역은 미실시), 데이터 신뢰 레이어(헤더 데이터바·DataTrustModal·RiskNotice·TodayStatusBar).
- **아키텍처**: 화면별 카피는 `src/lib/copy/*.ts`에 `{ko,en} as const satisfies Record<Locale, unknown>` 단일 출처로 분리(공유 `i18n.ts` 충돌 회피, v1과 동일 패턴). 서버 컴포넌트(page.tsx 등)는 `metadata`/`generateStaticParams`/`revalidate`/점수·데이터 호출을 그대로 두고, 보이는 JSX 본문만 새 `"use client"` 콘텐츠 컴포넌트로 추출해 `useLanguage()`로 로케일 선택. 데이터 신뢰 문자열은 `dataStatus.ts`에 **가산적** 영어 레이어(`LocalizedDataStatus`·`dataStatusByLocale`·`localizedDataStatus(locale)`·`buildDataIssueMailto({locale})`)를 추가하고, 서버가 직렬화 props로 클라이언트에 전달해 `stocks.json`이 클라 번들에 들어가지 않게 함(기존 `AppHeader`→`LocalizedDataTrustModal` 선례 준수).
- **신규 카피 파일**: `src/lib/copy/`에 trust·stocks·stockDetail·today·disclosures·pricing·status·metricsGuide·legal. **신규 클라이언트 콘텐츠 컴포넌트**: HeaderDataBar·PricingContent·MetricsGuideContent·StatusContent·ReportDataIssueContent·RiskNoticeContent·TodayContent·TodayStatusBarContent·StockDetailIntro·DisclosuresIntro·LegalEnSummary.
- **금융 문구**: 양 언어 모두 보수적·비자문 유지(매수/매도/추천/수익 보장 표현 0). "탐색 우선순위→research priority", "투자 추천이 아닙니다→not investment advice" 톤 일치.
- **검증**: `npx tsc --noEmit` 0 · `npm run build` 0(전 라우트 + 종목 138p SSG) · `npm run app:check` 통과(외부 게이트 1건 대기-기존) · `git diff --check` 0(CRLF 경고만) · 변경/신규 .ts/.tsx U+FFFD 0. 로컬 prod 3517(내 PID 8330만 종료·**AI Center 4310 무중단**): 11개 라우트 200(`/ /login /stocks /stock/005380 /today /disclosures /pricing /status /guide/metrics /terms /privacy`), `?lang=en` 변형 200, 빌드 청크에 EN 카피(`research priority`·`Collected as of`·`Data basis & sources`·`pending owner/legal review`) 컴파일 확인.
- **남은 i18n 갭(후속)**: (1) 서버 `metadata`(페이지 `<title>`/설명)는 전 화면 한국어 — 클라 전환으로는 불가, `/en` 라우팅 시 처리. (2) **라이브러리 파생 문구가 EN에서도 한국어**: `@/lib/conclusion`·`composeReasonV2`(종목 결론/요약/리스크), `@/lib/metricReadings`·`@/lib/scoreBasis`(지표 해석·점수 근거 값), `@/lib/disclosureType`(공시 타입 라벨), `@/lib/signalGuide`(확인할 것·주의), 홈 `StockCandidateCard`·`MarketSnapshotCards` 지표 라벨, AI 인사이트 LLM 한국어 출력(오늘 브리핑). (3) `/terms`·`/privacy`는 **영어 요약만** — 전문 법무 번역은 운영자/법무 검토 잔여. (4) 헤더 워드마크 "오른스코어"는 브랜드로 한국어 유지. (5) `/en` URL·OpenGraph/`metadata` 다국어화 미도입.
- **다음 구체 작업**: 라이브러리 파생 문구(conclusion·metricReadings·scoreBasis·disclosureType·signalGuide) + 홈 `StockCandidateCard`/`MarketSnapshotCards`를 로케일 인식으로 전환해 종목 상세 결론·오늘 브리핑까지 완전 전환 → 이후 `/en` URL 라우팅 + `metadata`/OpenGraph 다국어화를 별도 작업으로.

## 2026-06-28 · [codex] 영어 지원 v1 — 핵심 진입/로그인/내비게이션 다국어화
- **추가**: 무의존성 i18n 기반(`src/lib/i18n.ts`)과 `LanguageProvider`/`LanguageSwitcher`를 추가했다. 브라우저 언어가 한국어가 아니면 영어로 자동 전환하고, 사용자가 KO/EN 토글을 누르면 localStorage·cookie·`html lang`에 반영한다.
- **반영 범위**: 홈 첫 화면 온보딩·히어로, 검색창, 데스크톱/모바일 내비게이션, 사이드바, 하단 탭, 로그인/소셜 버튼/이메일 로그인 안내, 비교 배지, 공통 footer를 한국어/영어로 전환한다. 종목명·시장 데이터는 한국 주식 원문을 유지한다.
- **검증**: `npx tsc --noEmit` 통과. 로컬 dev `http://127.0.0.1:3000/?lang=en`에서 영어 온보딩·히어로·검색·내비 확인, `/login?lang=en`에서 영어 로그인/Provider 버튼/이메일 안내 확인, `?lang=ko`에서 한국어 기본 UI 확인.
- **다음**: 종목 상세/오늘/공시/요금/약관·개인정보/데이터 신뢰 모달까지 페이지 단위 번역을 확장한다. SEO용 `/en` 라우팅과 `metadata`/OpenGraph 다국어화는 별도 후속으로 진행한다.

## 2026-06-28 · [codex] 네이버 로그인 실동작 확인 + 약관/개인정보 정합성 갱신
- **실동작 확인**: 운영자가 공개 사이트에서 네이버 로그인이 실제로 동작함을 확인. Supabase Custom OAuth2 provider `custom:naver` + Vercel `NEXT_PUBLIC_ENABLE_NAVER_LOGIN=true` 배포 조합이 정상 동작 상태가 됨.
- **공개 문구 정합성**: `src/app/privacy/page.tsx`와 `src/app/terms/page.tsx`의 소셜 로그인 제공자 표기를 카카오·구글·네이버로 갱신. 개인정보처리방침 위탁 처리에 Naver(대한민국, 네이버 계정 식별자·이메일)를 추가했고, 국외이전 표 설명은 Kakao/Naver 국내·Google 미국으로 정리.
- **운영 문서**: `docs/auth-providers-setup.md`, `docs/app-roadmap.md`, `docs/ornscore-owner-final-checklist.md`, `docs/AI_HANDOFF.md`를 네이버 실로그인 완료 상태로 갱신. 남은 게이트는 실기기 standalone 앱 컨텍스트에서 네이버/카카오/구글 OAuth 복귀 확인.
- **다음**: 실기기 홈 화면 추가/standalone에서 네이버·카카오·구글 로그인 후 앱 창 복귀와 watchlist 복귀를 확인한다.

## 2026-06-28 · [codex] 네이버 로그인 Custom OAuth2 준비 + 실기기 게이트 정리
- **코드 준비**: `src/lib/auth/providers.ts`에 Supabase Custom OAuth2 provider `custom:naver`를 추가하고, `NEXT_PUBLIC_ENABLE_NAVER_LOGIN=true`일 때만 활성 버튼으로 노출되도록 토글 처리. 기본값은 비활성이라 `/login`에는 "네이버 (설정 필요)"만 보이며 인증 호출은 없음.
- **로그인 UI**: `src/app/login/page.tsx`에 활성/비활성 네이버 아이콘 조건을 `custom:naver` 기준으로 정리하고, 미설정 provider 오류 문구를 카카오·구글·이메일 대체 경로로 안내하도록 보정.
- **문서**: `docs/auth-providers-setup.md`의 오래된 "Pro/직접 라우트만 가능" 판단을 현재 Supabase Custom OAuth/OIDC 문서 기준으로 갱신. 네이버 Developers + Supabase Custom OAuth2 provider + Vercel env 토글 + 실기기 OAuth 복귀 검증 절차를 명시.
- **운영자 게이트**: 네이버 UserInfo 응답은 `response.id`, `response.email` 중첩 구조라 Supabase Custom OAuth2 콘솔이 실제 사용자 정보로 정상 처리하는지 왕복 테스트가 필요. 실패 시 env를 끄고 앱 자체 Naver OAuth 어댑터 라우트를 별도 작업으로 검토.
- **다음**: 운영자가 네이버 Developers 앱과 Supabase Custom OAuth2 provider `custom:naver`를 설정한 뒤, `NEXT_PUBLIC_ENABLE_NAVER_LOGIN=true`로 재배포하고 실기기 standalone에서 네이버/카카오/구글 OAuth 복귀를 함께 확인.

## 2026-06-28 · [codex] 스토어 제출 준비 패키지 초안
- **추가**: `docs/app-store-submission-pack.md`에 Google Play/App Store 등록 설명 초안, 스크린샷 후보, 리뷰 노트, 개인정보 답변 초안, 심사 리스크를 정리.
- **근거**: 현재 공개 문구(`/about`, `/privacy`, `/terms`, `/pricing`)와 일치하도록 투자 추천 아님·결제 미제공·데이터 신선도·로그인 제공자 상태를 반영.
- **연결**: `docs/app-packaging-final-checklist.md`, `docs/ornscore-owner-final-checklist.md`에서 새 스토어 제출 패키지를 참조하도록 갱신.
- **다음 운영자 게이트**: 실기기 PWA 로그인 복귀 확인 후, Android TWA 우선 여부와 Play Console/패키지명/SHA-256 지문 확보 결정.

## 2026-06-28 · [codex] 앱 패키징 마감 게이트 추가
- **수정**: `src/app/manifest.ts`의 깨진 앱 이름/설명/바로가기 문구를 복구해 홈 화면 설치 이름이 `오른스코어`로 정상 노출되도록 수정.
- **추가**: `scripts/check-app-packaging.mjs`로 PWA manifest, 아이콘, 설치 도우미, 오프라인 안내, service worker 미등록, assetlinks 자리표시자 미배포를 한 번에 점검.
- **추가**: `scripts/generate-assetlinks.mjs`와 `npm run app:assetlinks`로 Android TWA 진행 시 실제 패키지명·SHA-256 지문을 받아 `public/.well-known/assetlinks.json`을 안전하게 생성할 수 있게 준비.
- **문서**: `docs/app-packaging-final-checklist.md`에 PWA/TWA/iOS 마감 상태, 실행 명령, 운영자 직접 확인 항목을 고정.
- **남은 운영자 게이트**: 실기기 PWA 설치·standalone 로그인 복귀 확인, Android TWA용 Play Console/패키지명/SHA-256 지문, iOS App Store 여부 결정.

## 2026-06-28 · [codex] Google 로그인 운영자 콘솔 설정 완료 기록
- **완료 확인**: 운영자가 Google Cloud OAuth Client + Supabase Authentication Provider 설정을 마치고, `https://ornscore.com/login`에서 Google 로그인 실동작을 직접 테스트해 정상 동작을 확인.
- **코드 변경 없음**: Task 70에서 이미 구현된 Google OAuth 버튼/콜백/약관·개인정보 문구가 그대로 사용됨. 이번 변경은 운영 상태 문서 갱신만.
- **업데이트**: `docs/auth-providers-setup.md`의 Google 상태를 "완료"로 갱신하고, `docs/AI_HANDOFF.md`에 외부 콘솔 설정 완료 메모 추가.
- **다음 직접 확인**: 실기기 PWA 설치·standalone 로그인 복귀 확인, 그리고 네이버 로그인을 실제로 붙일지(직접 OAuth 라우트 vs Supabase custom OIDC/Pro) 결정.

## 2026-06-27 · [claude] Task 87 (repair 2) — Pretendard 폰트 하이드레이션 불일치 제거 (Playwright 게이트 수복)
- **증상(품질 게이트)**: Playwright DESKTOP FAILED + MOBILE 스크린샷 타임아웃, 공통 경고 `Warning: Prop media did not match. Server: "all" Client: "print"` (`layout.tsx`의 `<head><link>`). 직전 repair(`cde711b`)가 Pretendard를 비차단 로드하려고 **SSR에 `<link media="print">`를 렌더 후 인라인 스크립트로 `media='all'` 승격**했는데, 이 DOM 변형이 React 하이드레이션 *전*에 일어나 서버 마크업(`print`)과 실제 DOM(`all`)이 어긋나 매 렌더 경고가 떴고, 게이트가 이를 실패로 처리.
- **원인/수정**: SSR이 스왑 대상 `<link>`를 *전혀 렌더하지 않도록* 변경 = 하이드레이션이 비교할 노드 자체를 제거(경고를 끄는 게 아니라 구조적으로 제거). `src/app/layout.tsx` `<head>`에서 `media="print"` 스타일시트 링크와 별도 승격 스크립트를 빼고, **인라인 스크립트가 `document.createElement('link')`로 `media='print'` 링크를 만든 뒤 `onload`에서 `media='all'`로 승격**하도록 교체. `preconnect`·`<noscript>` 폴백 유지. React가 렌더하지 않은 노드라 불일치 없음. 프로덕션은 그대로 Pretendard 적용, 오프라인/헤드리스는 시스템 한글 폰트 폴백으로 즉시 렌더. **`globals.css`·점수식·`stocks.json`·인증·manifest 무변경. 신규 npm 0.**
- **검증**: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목·오류 0·금칙어 0·**Metrics 2.4** · `npm run build` exit 0(SSG 138p). **로컬 prod 미리보기 3187**(내 PID 14092만 taskkill, **AI Center 4310 무중단**): 13개 라우트(`/ /login /about /offline /manifest.webmanifest /status /pricing /privacy /terms /stocks /stock/005380 /watchlist /settings/notifications`) **HTTP 200**. SSR `<head>` grep — `media="print"` 스타일시트 링크 **0건**, JS 주입 스크립트(`createElement('link')`) 존재 확인. `layout.tsx` U+FFFD 0.
- **다음**: 게이트 재실행으로 desktop/mobile 스크린샷 통과 확인. 기능/운영자 잔여는 Task 87 본 엔트리·`docs/ornscore-owner-final-checklist.md` 그대로.

## 2026-06-27 · [claude] Task 87 — 로컬 최종 상용 준비도 마감 (라우트 스모크 + 운영자 전용 체크리스트 + 핸드오프)
- **범위/결정**: Task 77 위 **로컬 전용 QA·문구·핸드오프 마감**. AI가 코드로 고칠 수 있는 로컬 갭과 운영자만 할 수 있는 폰/계정/법무 점검을 분리하는 것이 목표. branch `ai-center/task-87-ornscore-local-final-qa-closeout`, 시작·기준 HEAD `5d33e25`(=origin/main, 클린). **신규 npm 0 · 리셋/pull/머지/push 0 · env/시크릿 0 · `stocks.json`·점수식·`direction`·manifest·인증 config 무변경. 가짜 OAuth/세션 경로 0. 레포 밖 변경 0.**
- **정적 감사(읽기 전용) 결과 — 공개 문구 추가 수정 불필요**: `/about`·`PwaInstallHelper`·`manifest.ts`·`/pricing`·`/status`·`/privacy`·`/terms`·`/login`·`providers.ts` + docs(app-roadmap·app-packaging-readiness·auth-providers-setup) 전수 확인. (a) 스토어/앱 준비도 과대표현 0(`/about` "출시 여부 미확정", `/pricing` "미확정"), (b) PWA 설치 한계 충분 설명(인터넷 필요·`/offline`·3-상태 정직 분기), (c) 제공자 정합성 OK(`/login` 카카오·구글·이메일+네이버 "준비 중", Apple 미노출=`enabled:false` — `/privacy`·`/terms`·`auth-providers-setup.md`와 일치), (d) 베타→Pro·미확정 문구 존재. **매수/매도/수익보장 류 행동 문구 0.** → 문구 편집 0, 변경 없음을 증거와 함께 기록.
- **반영(신규 1 + 문서 3)**:
  - **[신규] `docs/ornscore-owner-final-checklist.md`** — §A AI가 끝낸 것(운영자 작업 아님), §B 운영자만 할 수 있는 일(B-1 실기기 QA 7항: 설치·아이콘 품질·standalone 내비·**OAuth 복귀**·watchlist 복귀·알림 설정·법적/소개 문구 / B-2 계정·패키징·서명: 첫 스토어 결정·package id·SHA-256 지문·계정 결제·네이버 / B-3 결제·법무: 결제 게이트·약관 확정·데이터 라이선스·최종 승인), §C 다음 한 걸음. 실기기 OAuth 복귀 절차는 app-roadmap §5-1, 패키징 사전 점검은 app-packaging-readiness §4로 cross-link(중복 0).
  - **`docs/app-roadmap.md`** §6 상단에 Task 87 신규 체크리스트 포인터 append. **`PROGRESS.md`**·**`docs/AI_HANDOFF.md`**(Manual Note) — 이 엔트리.
- **검증**: pre-edit `npx tsc --noEmit` exit 0 → post-edit `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목·오류 0·금칙어 0·**Metrics 2.4** · `npm run build` exit 0(SSG 138p+전 라우트) · 변경 문서 U+FFFD 0. **로컬 prod 미리보기 3370**(내 PID 35204만 종료, **AI Center 4310 무중단**): 14개 라우트(`/ /login /login?next=/watchlist /about /offline /manifest.webmanifest /status /pricing /privacy /terms /stocks /stock/005380 /watchlist /settings/notifications`) **HTTP 200**, `/auth/callback`(code 없음) **307→`/login?error=auth_callback_no_code`**, `/manifest.webmanifest` `application/manifest+json`. SSR 마커: `/login` 카카오·구글·네이버"준비 중"(Apple 미노출), `/pricing` 베타무료·Pro전환·미확정, `/about` 투자추천아님·스토어 미확정, `/`·`/status` Metrics 2.4 일치. 스테일 청크/ChunkLoadError 미발생(클린 빌드 후 start). 안전 복구법 메모: 발생 시 `.next` 삭제 후 재빌드(4310은 절대 종료 안 함).
- **게이트 한계 / 잔여(운영자)**: 실기기 폰 설치·아이콘 품질·standalone OAuth/watchlist 복귀·알림 설정·법적 문구 standalone 노출은 Playwright 미구성으로 **운영자 게이트**(checklist §B-1). 서명 지문/package id·Play$25/Apple$99 계정 결제·결제 게이트 연결·약관/데이터 법무 최종 승인은 **운영자/법무 게이트**(§B-2·§B-3).
- **다음**: 운영자 — checklist §C 순서: (1) 실기기 QA(특히 OAuth 복귀 app-roadmap §5-1) → 깨지면 콜백 보강 큐, (2) 첫 스토어 결정 → 서명 지문·package id 확보 시 예시 assetlinks 실값 치환·배치, (3) 결제·약관·데이터 법무 확정 후 결제 게이트 연결(별도 AI 작업 가능).


## 2026-06-27 · [claude] Task 77 — 앱 패키징 준비도 체크리스트 + 안전한 assetlinks 예시 (스토어 출시 미확정 유지)
- **범위/결정**: Task 76(standalone 로그인 복귀) 위 app-readiness 후속 = **다음 패키징 결정을 채팅 기록 없이 고를 수 있게 문서화**. 마케팅·스토어 발표 아님. branch `ai-center/task-77-ornscore-app-packaging-readiness-che`, 시작 HEAD `24cf1c6`(Task 76, 클린). **문서 전용 — `src/`·`stocks.json`·점수식·`direction`·인증·manifest 무변경. 신규 npm 0 · service worker 0 · 리셋/pull/머지/push 0 · env/시크릿 0 · `public/.well-known` 미생성(가짜 서명 관계 파일 0).**
- **반영(신규 2 + 문서 3)**:
  - **[신규] `docs/app-packaging-readiness.md`** — 플레인 한국어. (a) **결정 트리**: PWA-only(지금)→Android TWA→iOS 홈 화면 추가(지금)→iOS App Store 래퍼(나중)→Capacitor(레포가 네이티브 빌드 도구 수용 시만), 각 경로의 **다음 인간 결정·전제(선결)** 명시. (b) **경로별 필요 에셋·계정 비용·QA 게이트·반려 리스크 표**(Play $25 1회·Apple $99/년·Mac+Xcode·"단순 웹 래퍼" 반려·assetlinks 서명 지문 관리). (c) §4 **실기기 사전 점검 체크리스트**(설치 아이콘 품질·standalone 내비·로그인 복귀·watchlist·알림 설정·오프라인·법적 고지) — 로그인 복귀 절차는 app-roadmap §5-1 8단계로 cross-link(재작성 0), 전체를 운영자/실기기 게이트(Playwright 미구성)로 표기. (d) §5 "이 작업에서 하지 않는 것"(네이티브 도구·SW·공개 스토어 주장·실 서명값·계정 결제 0). 경로 비교표·SW 결정·인증 준비도는 app-roadmap로 포인터(중복 0).
  - **[신규] `docs/templates/assetlinks.example.json`** — `public/.well-known` **밖**. Digital Asset Links 배열 형태(`relation: delegate_permission/common.handle_all_urls`), `package_name:"com.example.ornscore"`·`sha256_cert_fingerprints:["REPLACE_WITH_REAL_SHA256_FINGERPRINT"]` = **명백한 자리표시자**(그대로는 비동작). 문서에 "예시·**서빙 안 함**, 실 서명 지문 생긴 뒤에만 `public/.well-known/assetlinks.json`으로 배치" 명시.
  - **`docs/app-roadmap.md`**(§3 TWA 항목에 Task 77 예시 파일 메모 + §6 상단 신규 문서 포인터)·**`docs/ornscore-spec-coverage.md`**(§8 H §24 [P2-7] PWA 행에 Task 77 노트 append, 스토어/계정/실 서명/실기기 QA 여전히 ④/⑤)·**`PROGRESS.md`**·**`docs/AI_HANDOFF.md`**(Manual Note) — 이 엔트리.
- **검증**: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목·오류 0·금칙어 0·**Metrics 2.4** · `npm run build` exit 0(SSG 138p+전 라우트) · 변경 4문서 U+FFFD 0. **문서 전용이라 `/about`+`/manifest.webmanifest` 스모크 불필요**(app-facing 소스 무변경) — AI Center 4310·미리보기 3000 무중단(임시 서버 미기동). `public/.well-known` 부재 재확인(가짜 관계 파일 0).
- **게이트 한계 / 잔여**: 실 서명 키 SHA-256 지문·Play/Apple 계정 결제·실기기 QA는 **운영자 게이트**. assetlinks 실파일은 실 지문 생긴 뒤에만 `public/.well-known/assetlinks.json`로 배치(그 전엔 디렉터리 미생성). 스토어 출시 여부는 "미확정" 표기 유지.
- **다음**: 운영자 — (1) 첫 스토어(TWA vs iOS) 제품 결정 → 해당 계정 준비, (2) 서명 키 지문 확보 시 예시→실 assetlinks 배치, (3) app-roadmap §5-1 + 본 문서 §4로 실기기 사전 점검. 큰 축은 여전히 ④ 결제·⑤ 법무.


## 2026-06-27 · [claude] Task 76 — standalone 앱 로그인 복귀 + 내부 딥링크 정규화 (open-redirect 가드)
- **범위/결정**: Task 75(설치 UX) 위 후속 = app/PWA 경로의 **로그인 복귀·내부 딥링크 견고화**(네이티브 래퍼 결정 전 선결). `/login`·`/auth/callback`의 `next`를 내부 경로로만 제한하는 **공유 정규화기**를 추가하고, 친절한 한국어 앱 복귀 오류를 보강. branch `ai-center/task-76-ornscore-standalone-auth-return-and-`, 시작 HEAD `9df4313`(Task 75, 클린). **신규 npm 0 · 가짜 로그인 성공 경로 0 · 리셋/pull/머지/push 0 · env/시크릿 0.** 점수식·`stocks.json`·`direction`·Supabase·제공자 config(`OAUTH_PROVIDERS`/`PLANNED_PROVIDERS`) 무변경. 네이버는 "준비 중" 비활성 유지, Apple `enabled:false` 유지, 카카오·구글·이메일 동작 불변.
- **반영(신규 1 + 코드 4 + 문서 3)**:
  - **[신규] `src/lib/auth/returnPath.ts`** — 의존성 0·ASCII-only `safeInternalPath(raw, fallback="/")`. 규칙: 빈값→fallback, 백슬래시→슬래시 정규화로 `\\`/`/\` 우회 일반화, 길이 ≤512, **제어문자/공백(코드포인트 ≤0x20 또는 0x7F) 거부**(`charCodeAt` 루프 — 리터럴 제어바이트 임베드 회피), `"://"` 포함 거부(스킴 차단), 반드시 `"/"` 하나로 시작(`//` 프로토콜-상대 거부). 내부 경로의 query/hash 보존. open-redirect 사유 헤더 주석.
  - **`src/app/auth/callback/route.ts`** — 인라인 `nextParam.startsWith("/")` 체크를 `safeInternalPath(...)`로 교체. 실패 경로를 **`code` 없음(앱/standalone 복귀 실패) = `auth_callback_no_code`** vs **교환 오류 = `auth_callback_failed`**로 분기. 두 경우 모두 검증된 `next`를 `/login?error=<code>&next=<safeNext>`로 보존(단 `next==="/"`면 미부착). 성공 경로(`welcome=1`)·`exchangeCodeForSession` 불변.
  - **`src/app/login/page.tsx`** — `safeInternalPath` import 후 `next = safeInternalPath(searchParams.get("next"))`로 교체 → 뒤로가기 `<Link href={next}>`·OAuth/이메일 `redirectTo` 모두 외부 URL 불가. `friendlyAuthError`에 `auth_callback_no_code` → "앱에서 로그인 후 돌아오지 못했어요. 다시 시도하거나 브라우저에서 로그인해 주세요." 매핑 추가(원문 제공자 문자열 미노출). 기존 매핑·핸들러·제공자 렌더 불변.
  - **`src/components/AccountButtons.tsx`·`src/components/MobileNav.tsx`** — 로그인 진입점의 `next`를 현재 내부 위치(`pathname` + 가능 시 `window.location.search`)에서 만들되 `safeInternalPath`로 한 번 더 통과시켜 내부 보장. `/`·`/login`에선 미부착(기존 동작 유지).
  - **하드코딩 내부 리터럴 진입점 무변경(확인만)**: `WatchlistClient.tsx:302`(→`/watchlist`)·`history/page.tsx:36`·`settings/notifications/page.tsx:165`·`StocksExplorer.tsx:326`(→`/stocks`) — 이미 안전한 내부 리터럴.
  - **`docs/app-roadmap.md`**(§5 OAuth 행에 코드 가드 명시 + 신규 **§5-1 실기기 standalone 로그인/복귀 QA 절차** 8단계 + §6 next 3 갱신)·**`PROGRESS.md`**·**`docs/AI_HANDOFF.md`**(Manual Note) — 이 엔트리.
- **검증**: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목·오류 0·금칙어 0·**Metrics 2.4** · `npm run build` exit 0(SSG 138p+전 라우트, `/login`·`/auth/callback` 포함) · 변경 6파일 U+FFFD 0·제어바이트 0. 로컬 prod 3352(내 PID 33624만 taskkill, 4310 무중단·3000 본래 미기동): `/login`·`/login?next=/watchlist`·`/watchlist`·`/history`·`/settings/notifications` **200**. **콜백 redirect 검증**: `/auth/callback`(code 없음) **307 → `/login?error=auth_callback_no_code`**, `/auth/callback?next=//evil.com` 및 `?next=https://evil.com` 모두 **외부 미복귀**(next 미부착, 내부로만), `/auth/callback?next=/watchlist` → **`&next=%2Fwatchlist` 보존**. `/login` 클라 번들에 친절 문구('돌아오지 못했어요') 컴파일 확인.
- **게이트 한계 / 잔여**: Playwright 미구성 → **실기기 standalone 실제 OAuth 복귀(Kakao/Google 앱 창 복귀)는 운영자 게이트**(§5-1 절차). 코드 측 가드(내부 경로 제한·`auth_callback_no_code` 친절 안내)는 완료 — 복귀 자체가 깨지면 콜백 추가 보강은 별도 큐. 네이버 실로그인은 여전히 운영자 콘솔 선결(Task 73).
- **다음**: 운영자 실기기에서 §5-1 8단계 1회 검증 → 깨지면 콜백 보강 큐. 큰 축은 ④ 결제·⑤ 법무.


## 2026-06-27 · [claude] Task 75 — PWA 설치 프롬프트 + standalone UX 폴리시 (정직한 설치 도우미)
- **범위/결정**: Task 74(아이콘 에셋) 위 app-readiness 후속 = **마케팅 랜딩 아님**, 실용 설치 UX. `/about` "앱처럼 설치하기" 섹션의 정적 수동 단계를 **클라이언트 설치 도우미**로 교체해 가짜 버튼 없이 브라우저가 제공할 때만 실제 설치를 제안. branch `ai-center/task-75-ornscore-pwa-install-prompt-and-stan`, 시작 HEAD `0cdc496`(Task 74, 클린). **신규 npm 0 · service worker/캐싱 0(§4 데이터 신선도 결정 유지) · manifest 아이콘 무변경 · 리셋/pull/머지/push 0 · env/시크릿 0.** 점수식·`stocks.json`·`direction`·인증 무변경. 공개 문구 PWA/홈 화면 추가만(App Store·Play 출시 주장 0).
- **반영(신규 1 + 코드 1 + 문서 3)**:
  - **[신규] `src/components/PwaInstallHelper.tsx`**(`"use client"`) — `window`/`navigator` 가드(SSR 안전). 로컬 최소 `BeforeInstallPromptEvent` 인터페이스(신규 타입 의존 0). 마운트 시 `beforeinstallprompt` 리스너가 `preventDefault()` 후 이벤트 보관, `appinstalled` 리스너로 설치 직후 상태 전환. standalone 감지 = `matchMedia('(display-mode: standalone)') || navigator.standalone`. **3-상태 상호배타 렌더**: (a) standalone → "이미 앱으로 실행 중" 보라 안내(설치 권유 0), (b) 프롬프트 보유 → 실제 "앱 설치" 버튼(violet-600·`min-h-[44px]`·full-width) `prompt()`→`userChoice` 후 이벤트 비움, (c) 그 외 → iOS(Safari 공유→홈 화면에 추가)/Android(Chrome 메뉴→앱 설치) 수동 단계. **SSR 기본 = (c)** 라 비지원 환경/서버 렌더도 정직한 폴백.
  - **`src/app/about/page.tsx`** — 설치 섹션의 정적 `<ul>` 수동 단계 블록을 `<PwaInstallHelper />`로 교체(+ import). 섹션 `<h2>`(앱처럼 설치하기)·인트로·네트워크 필요/스토어 미확정 각주(서버 렌더 정직 컨텍스트)·`Smartphone` 아이콘·카드 스타일 보존. 새 nav 탭/히어로 0.
  - **`docs/app-roadmap.md`**(§1 '설치 프롬프트 UX' 행 추가·§2-1 다음 액션·§6 next: 1·2 done, 다음 구체 단계=실기기 standalone OAuth 복귀 검증)·**`PROGRESS.md`**·**`docs/AI_HANDOFF.md`**(Manual Note) — 이 엔트리.
- **검증**: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목·오류 0·금칙어 0·**Metrics 2.4** · `npm run build` exit 0(SSG 138p+전 라우트, `/about` 포함) · 변경 .ts/.tsx U+FFFD 0. 로컬 prod 3346(내 PID 37740만 taskkill, 4310·3000 무중단): `/about` **200** SSR에 '앱처럼 설치하기'·'홈 화면에 추가'·'Android(Chrome)' 수동 폴백 렌더, `/manifest.webmanifest` **200 `application/manifest+json`**(불변), 클라 번들 `app/about/page-*.js`에 `beforeinstallprompt`·'이미 앱으로 실행 중' 컴파일 확인.
- **게이트 한계 / 잔여**: Playwright 미구성 → **390px 실 브라우저 육안·실제 `beforeinstallprompt`는 운영자 게이트**. 실 프롬프트는 설치 가능 origin + 지원 브라우저(Android Chrome)에서만 발화하므로 데스크톱/SSR은 수동 단계 폴백을 보임(정상, 버그 아님). 운영자: 390px에서 `/about` 설치 섹션 가로 오버플로 0·설치 컨트롤 사용성 1회 확인 권장.
- **다음**: 실기기 standalone 실행 + **OAuth 복귀**(§5 최대 리스크) 검증 → 깨지면 콜백 보강(별도 큐). 같은 세션에서 Android `beforeinstallprompt` 버튼·iOS 수동 흐름 육안. 큰 축은 여전히 ④ 결제·⑤ 법무.


## 2026-06-27 · [claude] Task 73 — 네이버 로그인 준비중 노출 + 운영자 설정 문서화 (네이티브 미지원)
- **범위/결정**: 네이버 로그인을 안전한 경로로만 진행. 설치된 `@supabase/auth-js` 2.107.0 `Provider` 유니온 재확인 = `apple|azure|...|google|kakao|...` → **`naver` 없음**(네이티브 OAuth 타입·런타임 불가). 진짜 세션을 안전하게 만들려면 운영자 측 설정(네이버 콘솔 자격증명 및/또는 Supabase Pro 플랜)이 선행돼야 함 → **가짜 로그인 성공 경로를 만들지 않고**, `/login`에 **"네이버 (준비 중)" 비활성 항목만 노출** + 운영자 설정 절차 문서화. branch `ai-center/task-73-ornscore-naver-login-safe-auth-follo`, 시작 HEAD `6954fb3`(클린). **리셋/pull/머지/push·신규 npm·빌드 단계 추가·env/시크릿 0**. 카카오·구글·이메일·`/auth/callback`·`signInWithOAuth`·`src/lib/supabase/*` 무변경. AI Center 4310·미리보기 3000 무중단(검증 prod 3331, 내가 띄운 PID 22092만 taskkill).
- **반영(코드 2 + 문서 3)**:
  - **`src/lib/auth/providers.ts`** — `OAuthProviderId`(=`kakao|google|apple`)·`OAUTH_PROVIDERS`·`enabledOAuthProviders()` **무변경**(네이버를 유니온에 넣지 않음). 신규 **`PLANNED_PROVIDERS`(`PlannedProviderConfig`, id=`"naver"`·label `네이버 (준비 중)`·note `준비 중`)** + `plannedProviders()` 추가. **`id`를 의도적으로 평범한 `string`(≠`OAuthProviderId`)으로 둬서** `signInWithOAuth({provider})`에 넘기면 tsc가 막음 → 가짜 세션 경로가 컴파일 단계에서 원천 차단. 기존 naver 블로커 주석에 PLANNED_PROVIDERS 렌더 안내 추가.
  - **`src/app/login/page.tsx`** — `plannedProviders()` import. 활성 버튼 아래에 `planned.map`으로 **비활성 `<div>`**(`aria-disabled`·`cursor-not-allowed`·`select-none`·네이버 SVG·"준비 중" 배지) 렌더 — **onClick·인증 호출 없음**. `handleOAuthLogin`/`handleSubmit`/`next` 보존/`friendlyAuthError`/카카오·구글 버튼·이메일 폼·`leadCopy`(enabled만 파생) **전부 무변경**.
  - **`docs/auth-providers-setup.md`** — 상태표 Naver 행 `⏳ "준비 중"(비활성 노출)`로 갱신 + Naver 섹션을 (A) 앱 자체 OAuth 라우트(운영자 전용 env `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET`은 Supabase/Vercel env에만·소스 금지, 네이버 Developers 앱+콜백 등록, `state`+nonce CSRF·`next` 보존 start/callback 라우트, **세션 발급 설계 선결**)·(B) Supabase 커스텀 OIDC/SAML(Pro/Enterprise + 콘솔)로 확장. 결론: 한 경로의 운영자 설정 완료 전까지 "준비 중" 유지·가짜 세션 0. 점검 항목에 네이버 비활성 확인 추가.
  - **`PROGRESS.md`·`docs/AI_HANDOFF.md`** — 이 엔트리.
- **약관/개인정보**: 네이버는 실제 데이터를 받지 않으므로 **활성 데이터 처리자 목록(카카오·구글)에 추가하지 않음**. 가짜 "네이버 로그인 가능" 주장 0(SSR grep 확인).
- **검증**: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목·오류 0·금칙어 0·**Metrics 2.4** · `npm run build` exit 0(`/login` 포함 전 라우트) · 변경 3파일 U+FFFD 0. 로컬 prod 3331 스모크: `/login`·`/login?next=/watchlist`·`/privacy`·`/terms` **200**, `/auth/callback`(code 없음) **307**(불변). `/login` SSR: 카카오·구글·이메일 + **"네이버 (준비 중)" 1건·`aria-disabled` 1건·naver 인증 URL 0건**. `/privacy`·`/terms` 네이버 활성 주장 0.
- **남은 운영자 설정(네이버 실동작 시)**: `docs/auth-providers-setup.md` Naver (A) 또는 (B) — (A) 네이버 Developers 앱+콜백 URL 등록·`NAVER_CLIENT_ID/SECRET`을 Supabase/Vercel env에만 입력·`state`/nonce CSRF + `next` 보존 라우트 + **service-role 세션 발급 설계**, 또는 (B) Supabase Pro/Enterprise 업그레이드 + 커스텀 OIDC 콘솔 구성. 둘 다 본 작업 범위 밖(신규 의존성·유료 금지) → 별도 작업.
- **다음**: 운영자가 (A)/(B) 중 결정·콘솔 설정 → 네이버 실 로그인 라우트 별도 작업. 그 전까지 "준비 중" 유지. Task 72는 앱 readiness 후속 계속.

## 2026-06-27 · [claude] Task 70 게이트 수리 — /login 이메일 input hydration 경고 제거
- **블로커(Playwright MOBILE FAIL)**: `Extra attributes from the server: ... style`가 `src/app/login/page.tsx`의 `LoginForm` 이메일 `<input>`에서 발생. 일부 브라우저/비밀번호 관리자 확장이 input 에 `style` 등을 주입 → SSR↔클라 hydration 불일치 경고(모바일 프로필·이메일 필드에서 특히 빈발). 소스에는 input style 없음.
- **수리(포커스 1파일)**: `src/app/login/page.tsx` 이메일 input 에 **`suppressHydrationWarning`** 추가(+ `autoComplete="email"`). 저장소 기존 관행과 동일 — `GlobalSearch.tsx:139`·`StocksExplorer.tsx:758` input 도 같은 처리. 로직·문구·next 보존·friendly 오류·제공자 config 모두 무변경.
- **검증**: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목·오류 0·금칙어 0·Metrics 2.4 · `npm run build` exit 0(`/login` 포함 전 라우트). 신규 npm 의존성·빌드 단계 변경 0. 점수식/`stocks.json`/계정 테이블 무변경.
- **다음**: 운영자 Supabase Google 토글 설정 → `/login` 구글 실동작 검증(아래 Task 70 본문과 동일).

## 2026-06-27 · [claude] OrnScore 로그인 제공자 확장 — 구글 추가·제공자 config화·friendly 오류·약관/개인정보 동기화 (Task 70, Claude)
- **범위**: 상용화 대비 인증(소셜 로그인) 확장. 기존 **카카오 OAuth + 이메일 매직링크 보존**, 로그인 후 `next` 복귀 동작 보존. branch `ai-center/task-70-ornscore-auth-provider-expansion-and`, 시작 HEAD `bbc5876`(클린) 위 — **리셋/pull/머지/push·신규 npm 의존성·빌드 단계 추가 0**. 점수식·`stocks.json`·`backtest-result.json`·`direction`·계정 데이터 테이블 무변경. AI Center 4310 무중단(검증 prod `127.0.0.1:3321`, 내가 띄운 PID 36724만 taskkill). 미리보기 3000은 이번 세션 미기동 상태 그대로.
- **제공자 가용성 확정(읽기 전용)**: 설치된 `@supabase/auth-js` 2.107.0 `Provider` 유니온 = `apple|azure|...|google|kakao|...` → **google ✅ · apple ✅(타입) · kakao ✅(운영 중) · naver ❌(유니온에 없음)**. 네이버는 커스텀 OIDC/SAML(Supabase Pro/Enterprise) 또는 직접 OAuth 라우트 필요 → 신규 의존성·유료 플랜 금지 범위상 **보류**(가짜 구현 안 함). SMS/Phone도 외부 게이트웨이·비용 필요 → 보류.
- **반영(코드 4파일 + 신규 2 + 문서 2)**:
  - **[신규] `src/lib/auth/providers.ts`** — OAuth 제공자 단일 출처(`OAUTH_PROVIDERS`: kakao/google/apple, 각 id·label·redirectingLabel·shortName·brandClasses·`enabled`). `enabledOAuthProviders()`로 노출 목록 파생. id 유니온 `OAuthProviderId`는 `signInWithOAuth({provider})`에 그대로 전달돼 패키지 `Provider`와 tsc 대조(잘못된 값은 호출부에서 차단). **Apple 의사결정 명시(주석)**: 타입 지원되나 Apple Developer Program 유료($99/년)+iOS/macOS 중심 수요라 **기본 `enabled:false`**, config는 완비 → 콘솔 토글+가입 후 한 줄로 활성화. naver 미추가(블로커 주석).
  - **[리팩터] `src/app/login/page.tsx`** — `handleKakaoLogin` 단일 핸들러 → **`handleOAuthLogin(provider)` 제네릭 1개**로 통합, `enabledOAuthProviders()` map으로 버튼 렌더(카카오 첫 순서·아이콘 유지·구글 SVG 추가). `kakao_redirecting` 상태 → `oauth_redirecting` + `redirectingProvider`로 일반화. `redirectTo=.../auth/callback?next=${encodeURIComponent(next)}`로 **next 보존 유지**(이메일 매직링크 emailRedirectTo도 동일). **friendly 오류**: `friendlyAuthError()`가 `?error=`(콜백 실패)·`provider is not enabled`/`validation_failed`(콘솔 토글 전)·rate limit·invalid email 등을 한국어로 변환(원문 영어 미노출). 초기 `searchParams.get("error")`도 friendly 표시. **리드 카피는 enabled 목록에서 파생**("카카오·구글로 1초 만에...") → 화면에 없는 방식 광고 0(naver 미노출). 약관/개인정보 동의 줄·"로그인하면 가능해요" 보존.
  - **[게이트 링크] `src/components/WatchlistClient.tsx:302`** — 관심 종목 동기화 CTA `href="/login"` → **`/login?next=/watchlist`**(복귀 목적지 보존). 나머지 게이트 진입점은 이미 next 보존 재확인: `history/page.tsx:36`·`StocksExplorer.tsx:326`(조건 알림·분석 기록 동선)·`settings/notifications/page.tsx:165`·`AccountButtons.tsx`(pathname 동적)·`MobileNav.tsx`(loginNext) — bare `/login`은 WatchlistClient 1건뿐이었음. compare 저장·AI 기록 동선은 이 공통 링크들로 합류.
  - **[약관/개인정보 동기화]** `src/app/privacy/page.tsx` — 수집항목 "소셜 로그인(카카오·구글)", 위탁사 **Google(미국)** 추가, 국외이전 표에 **Google 행** 추가(미국·구글 계정 식별자·이메일·이름·프로필), 캡션 "Kakao 국내·Google 미국 처리"로 정정, 보안조치 "매직링크/소셜 OAuth(카카오·구글)". `src/app/terms/page.tsx` — 현재정책·제3조 로그인 방식 "이메일 매직링크 또는 소셜 로그인(카카오·구글)". **Apple은 버튼 미노출이라 약관·개인정보에도 미기재**(노출과 문구 일치). naver 미기재.
  - **[신규 문서] `docs/auth-providers-setup.md`** — 운영자용 제공자 콘솔 설정 체크리스트(자리표시자만, **시크릿 0**): 공통(Supabase Providers 토글·redirect URL)·Kakao(참고)·Google(Google Cloud OAuth 클라이언트 절차+`<GOOGLE_CLIENT_ID>` 등)·Apple(보류 사유+활성화 절차)·Naver(차단 사유 명시)·SMS(보류)·점검 항목.
- **검증**: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목·오류 0·금칙어 0·**Metrics 2.4** · `npm run build` exit 0(SSG 138p+전 라우트, `/login` 포함) · 변경/신규 6파일 U+FFFD 0(한글 무손상). 로컬 prod 3321 스모크: `/login`·`/login?next=/watchlist`·`/login?error=auth_callback_failed`·`/watchlist`·`/history`·`/compare`·`/settings/notifications`·`/privacy`·`/terms` **HTTP 200**, `/auth/callback`(code 없음) **307**(→ `/login?error=auth_callback_failed`, 의도된 동작). SSR 마커: `/login`에 **카카오·구글 버튼 + 이메일** 렌더(Apple 미노출)·리드 "카카오·구글로 1초", `?error=`에 friendly 한국어, `/privacy`·`/terms`에 "소셜 로그인(카카오·구글)"·"소셜 로그인 제공자 — Google" 렌더. 클라 번들 `app/login/page-*.js`에 `/auth/callback?next=` 포함(OAuth 버튼 next 보존 컴파일 확인).
- **상태**: 카카오·구글·이메일 = 코드 완료(구글은 **운영자가 Supabase 콘솔 토글+Google Cloud OAuth 클라이언트 설정 시 실동작**, 그 전 클릭은 friendly 안내로 graceful). Apple = config 완비·기본 비활성(의사결정 명시). Naver/SMS = 블로커 문서화·보류.
- **남은 외부 설정(운영자)**: `docs/auth-providers-setup.md`대로 (1) Supabase → Auth → Providers에서 **Google 토글 ON + Client ID/Secret 입력**, redirect URL 등록 → `/login` 구글 실동작 확인. (2) Apple 필요 시 Developer Program 가입 후 `providers.ts` `enabled:true` + 약관/개인정보 Apple 추가. (3) Naver 수요 시 커스텀 OIDC/SAML or 직접 라우트(별도 작업).
- **게이트 한계**: Playwright 미구성 → 390px 실 브라우저 육안은 운영자 게이트(SSR+클래스 가드로 대체). 운영자: 데스크톱/390px로 `/login`(카카오 노랑·구글 흰 버튼 줄바꿈·이메일 폼)·`/privacy`(국외이전 표 Google 행 가로 스크롤) 1회 확인 권장. OAuth 실제 redirect는 콘솔 설정 후 운영자 확인.
- **다음**: 운영자 Supabase Google 토글 설정 → `/login` 구글 로그인 실동작 검증 → (선택) main 머지·외부 릴리스(운영자). 큰 축은 여전히 ④ 결제 연동·⑤ 데이터/약관 법무.

## 2026-06-27 - [codex] Task 69 4th QA main push/public smoke complete
- **Scope**: User approved release of Task 69 after the 4th QA automation run completed.
- **Push**: Fast-forwarded `main` from `d70f3de` to `83191b4` and pushed `origin/main`.
- **Public smoke**: Confirmed `https://ornscore.com/disclosures` renders `주의:` and the normalized contract caution copy containing `'계약 금액 = 이익'으로 단순 환산하지 마세요`. Confirmed `https://ornscore.com/` and `/today` render varied surge-caution wording such as `최근 상승폭이 매우 커서 급등 사유와 과열 여부 함께 확인 필요` and `단기 상승폭이 큰 편이라 급등 사유와 변동성 확인 필요`.
- **Stock detail smoke**: Confirmed `https://ornscore.com/stock/005380` renders the CTA labels, `STEP 1`, data badges including `필수 데이터 100 %`, `이상값 점검 통과`, and `Metrics 2.4`, with the glued strings absent from SSR checks.
- **Route smoke**: `/compare` and `/stocks` returned HTTP 200; `/stocks` did not expose the duplicate `펼치기 ▾접기 ▴` string.
- **Next**: Wait for the user's next visual review or continue the next QA/business-readiness batch.

## 2026-06-27 · [claude] OrnScore 4차 QA 컴포넌트 마감 — 공시 주의 구두점·홈 주의 문구 다양화·CTA/STEP/배지/비교 재검증 (Task 69, Claude)
- **범위**: 사용자 4차 QA 리포트(공개 사이트 재점검) 기준 P0-1~4·P1-1~3 마감. branch `ai-center/task-69-ornscore-4th-qa-component-polish-and`, 시작 HEAD `d70f3de`(클린) 위 — **리셋/pull/머지/push·신규 npm·빌드 단계 추가 0**. 점수식·`stocks.json`·`backtest-result.json`·`direction` 무변경(표시/문구만). AI Center 4310 무중단(검증 prod `127.0.0.1:3319`, 내가 띄운 PID 10484만 taskkill). 미리보기 3000은 이번 세션 미기동 상태 그대로. 투자 조언성·압박성 표현 신규 0.
- **시작 전 재검증(중복 구현 방지)**: 설계서·`docs/ornscore-spec-coverage.md`·Task 68 핸드오프상 P0-1~4는 직전 배포(`743873a`)에서 **이미 컴포넌트로 마감** → 소스+SSR로 재확인, 재구축 0.
  - **[P0-1] CTA 버튼** — `src/components/stock/StockDetailActionButtons.tsx` 공통 컴포넌트(grid 1/2/4열·`gap-2`·`min-h-[44px]`·테두리/배경/아이콘+라벨). 글루 `공시 확인재무 보기점수 근거업종 비교` SSR **0건**.
  - **[P0-2] STEP 가이드** — `src/components/BeginnerReading.tsx` `StepCard` 3카드 그리드(`grid-cols-1 md:grid-cols-3`·STEP n 단일 배지·제목/본문 분리). SSR에 `STEP 1`/`STEP 2`/`STEP 3` 카드 렌더, 글루 `STEP 1점수` 0.
  - **[P0-3] 데이터 품질 배지** — `src/components/stock/PriorityScoreCard.tsx` 독립 `DataStatusPill` 3종(`flex flex-wrap gap-2`). 정상=필수 데이터 N%/이상값 점검 통과/Metrics, 검증보류(suspect)=필수 데이터 N%/`이상값 점검 중 · 임시 점수`/`/100 ⚠`/Metrics 분기(69~76행). 글루 `필수 데이터 100%이상값 점검 통과 Metrics 2.4` SSR **0건**. suspect fixture가 SSR에 안 떠도 컴포넌트가 양쪽 상태를 분기 지원함을 소스로 확인.
  - **[P0-4] 비교 빈 상태** — `src/components/CompareClient.tsx` 검색·추천 비교 세트·최근 본·관심 종목 추가 UI 존재. `/compare` HTTP 200.
- **반영(코드 4파일, 문구·구두점만)**:
  - **[P1-2] 공시 카드 주의 구두점** — `src/components/DisclosureExplorer.tsx:452` 주의 라벨 `주의` → **`주의:`**(콜론). 라벨과 본문은 이미 별도 `<span>`(flex `gap-1.5`)라 시각적으로 분리 — 콜론 추가로 SSR 추출 글루 `주의'계약 금액 = 이익'`이 `주의: '계약 금액 = 이익'`으로 해소. `src/lib/signalGuide.ts:88` `single_contract.cautionNote`를 캐논 형태 **`'계약 금액 = 이익'으로 단순 환산하지 마세요. 마진·거래처 정보가 빠질 수 있습니다.`**로 정규화(`으로` 앞 공백·`단순 환산 금지` 변형 제거 → `DisclosureExplorer`의 `CAUTION_FALLBACK[single_contract]`와 동일 단일 문구). `SignalGuideExpand`(전체 cautionNote 표시)도 같은 캐논 문구로 일관.
  - **[P1-3] 홈/오늘 주의 문구 다양화** — `src/app/page.tsx`·`src/app/today/page.tsx` `riskNote`의 `r3m>=80` 단일 상수를 급등 정도·변동성 조건별 분기(>=150 "매우 커서 급등 사유와 과열 여부 함께 확인" / >=120 "단기 상승폭이 큰 편…급등 사유와 변동성 확인" / vol<45 "상승폭이 커진 데다 변동성도 높아 사유·시점 함께 검토" / else 기존 문구)로 교체. 모두 확인·검토 톤(매수/매도/목표가/긴급성 0). 두 파일 로직 동일(홈·오늘 일관). 점수·`direction` 무변경.
- **[P1-1] 펼치기/접기 중복** — `src/components/StocksExplorer.tsx:816` 단일 삼항(`showQuickPresets ? "접기 ▴" : "펼치기 ▾"`)으로 한 번에 한 라벨만 DOM 출력. 레포 전체 `펼치기`/`접기` grep = 전부 단일 라벨 조건 렌더(`group-open` 양쪽 노출 패턴 없음). **이미 충족 — 편집 0**.
- **검증**: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목·오류 0·금칙어 0·**Metrics 2.4** · `npm run build` exit 0(SSG 138p+전 라우트) · 변경 4파일 U+FFFD 0(한글 무손상). 로컬 prod 3319 8경로(`/ /today /stock/005380 /stock/032830 /stock/096770 /compare /stocks /disclosures`) **HTTP 200**. SSR 마커: 글루 `공시 확인재무 보기…`·`STEP 1점수`·`필수 데이터 100%이상값…`·`펼치기 ▾접기 ▴` **각 0건**, STEP 1/2/3 카드 렌더, `/disclosures` `주의:` 9회·구 `주의'계약…`/`단순 환산 금지` 0, 홈 후보 주의 문구 3종 분포(`6/2/2`)·오늘 3종(`2/2/2`)로 동일 문구 반복 해소.
- **상태**: [P0-1~4] 이미 마감·재검증 완료 · [P1-1] 이미 충족 · [P1-2][P1-3] 구현 완료.
- **게이트 한계 / 잔여 리스크**: Playwright 미구성 → **390px 실 브라우저 육안은 운영자 게이트**(SSR 마크업의 `flex-wrap`/`grid-cols-1`/`min-h-[44px]` 클래스 가드로 대체 점검, 픽셀 미보장). 운영자: 데스크톱/390px로 `/stock/005380`(CTA 4버튼·STEP 3카드·배지 3개)·`/compare`(빈 상태)·`/stocks` 1회 확인 권장. P0 글루는 본질적으로 SSR 텍스트 추출 아티팩트(노드는 분리·시각 분리됨) — 공개 배포는 운영자 최신화 후 동일 확인.
- **다음**: 운영자 390px 육안 게이트 → main 머지·외부 릴리스(별도 단계, 운영자). 이후 큰 축은 ④ 결제 연동·⑤ 데이터/약관 법무(coverage 문서 추적).

## 2026-06-27 - [codex] Task 68 3rd QA P0 main push/public smoke complete
- **Scope**: User approved release of Task 68 after the 3rd QA P0 automation run completed.
- **Push**: Fast-forwarded `main` from `d63149c` to `81c7922` and pushed `origin/main`.
- **Public smoke**: Confirmed `https://ornscore.com/theme/battery` shows the neutral `저평가 원인과 회복 근거` copy and no longer shows `매수 검토 구간`, `분할 매수 권장`, or `매수 매력 증대`. Confirmed `https://ornscore.com/stock/096770` shows `반등 근거와 추가 하락 위험` and no longer shows `저가 매수일지 추가 하락일지 판단 필요`.
- **Limit**: `/compare` returned HTTP 200, but the text markers used by the smoke script were not SSR-visible, so compare UX should still be visually checked in-browser if the next QA pass focuses on that page.
- **Next**: Wait for the user's next review; if no new feedback is provided, continue with 3rd QA P1 items from the spec.

## 2026-06-27 · [claude] OrnScore 3차 QA P0 마감 — 행동성 문구 중립화·CTA/STEP/배지/비교 재검증 (Task 68, Claude)
- **범위**: 사용자 제공 `ORNSCORE_3rd_QA_improvement_spec.md` PART A(P0-1~P0-5)·PART F 체크리스트를 기준으로 3차 QA P0를 마감. branch `ai-center/task-68-ornscore-3rd-qa-p0-polish-detail-ui-`, 시작 HEAD `d63149c`(클린) 위 — **리셋/pull/머지/push·신규 npm·빌드 단계 추가 0**. 점수식·`stocks.json`·`backtest-result.json`·`direction` 무변경(표시/문구만). AI Center 4310·미리보기 3000 무중단(검증 prod `127.0.0.1:3317`, 내가 띄운 PID 37232만 taskkill). 투자 조언성·압박성 표현 신규 0.
- **시작 전 재검증(중복 구현 방지)**: 설계서의 P0-1~4는 직전 codex 배포(`743873a` post-deploy 2nd QA P0)에서 **이미 컴포넌트로 마감**됨을 소스+SSR로 재확인 → 재구축 0.
  - **[P0-1] CTA 버튼** — `src/components/stock/StockDetailActionButtons.tsx` 공통 컴포넌트 존재(grid 1/2/4열·`gap-2`·`min-h-[44px]`·테두리/배경/라운드·아이콘+라벨). 종목 상세 SSR에 `공시 확인`·`업종 비교` 독립 렌더, 글루 문자열 `공시 확인재무 보기점수 근거업종 비교` **0건**.
  - **[P0-2] STEP 가이드** — `src/components/BeginnerReading.tsx` `StepCard` 3개 그리드(`grid-cols-1 md:grid-cols-3`·STEP n 단일 배지·제목/본문 분리). SSR에 `STEP` 카드 렌더, 한 줄 글루 0.
  - **[P0-3] 데이터 품질 배지** — `src/components/stock/PriorityScoreCard.tsx` 독립 `DataStatusPill` 3종(`flex flex-wrap gap-2`·`필수 데이터 N%`/`이상값 점검 통과`/`Metrics 2.4`). SSR에 `이상값 점검 통과` pill 렌더, 글루 문자열 `필수 데이터 100%이상값 점검 통과 Metrics 2.4` **0건**(React가 보간 텍스트를 별도 노드로 분리 = 글루 아님).
  - **[P0-4] 비교 빈 상태** — `src/components/CompareClient.tsx` 빈 상태에 종목 검색·추천 비교 세트·최근 본 종목·관심 종목 추가 UI + "비교할 종목을 선택하세요" 헤딩 모두 존재. `/compare` HTTP 200.
- **반영(코드 2파일, 문구만)**:
  - **[P0-5] 종목 상세 행동성 문구 제거** — `src/lib/metricReadings.ts:49` `readMomentum` 약세(40 미만) 구간 `"하락 추세일 수 있음 — 저가 매수일지 추가 하락일지 판단 필요"` → **`"하락 추세일 수 있음 — 반등 근거와 추가 하락 위험을 함께 확인"`**(설계서 §7.3 수정안 2). `metricReadings`는 `BeginnerReading`·`MetricInsightCards` 공유 단일 소스라 종목 상세 양쪽 동시 반영.
  - **[P0-5 일관성] 테마 페이지 행동성 문구 중립화** — `src/app/theme/[slug]/page.tsx`의 `evaluate()` 일반 설명 3줄에서 `매수 검토 구간`·`분할 매수 권장`·`추가 하락 시 매수 매력 증대` → `저평가 원인과 회복 근거를 함께 확인`·`급등 사유와 지속 가능성, 가격 부담을 함께 확인`·`추가 하락 요인과 반등 근거를 함께 확인`(확인·검토 톤). 종목 상세 밖이지만 "매수" 행동 단어 잔존이라 같이 정리. 고지 문구의 `매수·매도 추천이 아닙니다`는 보존(법적 고지·필수).
- **검증**: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목·오류 0·금칙어 0·**Metrics 2.4** · `npm run build` exit 0(SSG 138p+전 라우트) · 변경 2파일 U+FFFD 0(한글 무손상)·구 문구(`저가 매수일지`·`매수 검토`·`분할 매수`·`매수 매력`) 전수 grep **0건**. 로컬 prod 3317 6경로(`/stock/005380 /stock/032830 /compare /stocks /disclosures /theme`) — `/theme`는 Git Bash의 한글 슬러그 인코딩 아티팩트로 curl 404(라우트는 빌드·tsc 정상), 나머지 5경로 **HTTP 200·치명 마커 0**. SSR: 글루 CTA/배지 0·구 P0-5 문구 0.
- **5종 상태**: [P0-1][P0-2][P0-3][P0-4] **이미 마감(743873a)·재검증 완료**. [P0-5] **구현 완료**(종목 상세 + 테마 페이지 일관 정리).
- **게이트 한계 / 잔여 리스크**: Playwright 미구성 → **390px 실 브라우저 육안은 운영자 게이트**(curl+SSR grep+build로 대체). 운영자: 데스크톱/390px로 `/stock/005380`(CTA 4버튼 2열 줄바꿈·STEP 3카드·배지 3개 간격)·`/compare`(빈 상태 검색/추천/최근/관심) 1회 확인 권장. **설계서 전제(공개 사이트에 글루 잔존)는 직전 배포로 이미 해소된 상태** — 본 태스크는 P0-5 문구 마감 + P0-1~4 재검증이 실제 산출물.
- **다음**: 운영자 390px 육안 게이트 → main 머지·외부 릴리스(별도 단계, 운영자). 이후 큰 축은 ④ 결제 연동·⑤ 데이터/약관 법무 확정(coverage 문서 추적).

## 2026-06-27 - [codex] Task 66 P1 follow-up main push/public smoke complete
- **Scope**: User asked to push Task 66 before collecting new expert feedback.
- **Push**: Fast-forwarded `main` from `1ff744f` to `51a7875` and pushed `origin/main`.
- **Public smoke**: Confirmed Task 66 markers on `https://ornscore.com`: home display-policy/analyzed-universe wording, disclosure all-market/analyzed-only filters, pricing beta-free-to-Pro notice, terms current-policy/unfinalized billing copy, and privacy overseas-transfer mobile affordance wording.
- **Code changes**: No additional product code changes were made in this release step.
- **Next**: Wait for the user's next expert feedback/spec, then register or implement the next improvement batch.

## 2026-06-26 · [claude] OrnScore P1 follow-up (task 66) — 홈 공시 표시 정책·공시 범위 버튼·베타→Pro 안내·약관·개인정보 표 모바일 (Task 66, Claude)
- **범위**: codex P0(1~6) 완료 이후 사용자 리뷰의 **P1 후속 5종**을 작은 단위로 반영. branch `ai-center/task-66-ornscore-p1-follow-up-disclosures-pr`, 시작 HEAD `1ff744f`(클린) 위 — **리셋/pull/머지/push·신규 npm·빌드 단계 추가 0**. 점수식·`stocks.json`·`backtest-result.json`·`direction` 무변경(표시/문구만). AI Center 4310·미리보기 3000 무중단(검증 prod `127.0.0.1:3267`, 내 리스너 PID 36376만 taskkill). 투자 조언성·압박성 표현 신규 0.
- **반영(코드 5파일 + 문서 4)**:
  - **[1] 홈 공시 표시 정책 명시** — `src/components/home/DisclosureSignalSection.tsx`에 `universeCount` prop + "표시 정책" 한 줄 박스(홈은 분석 대상 {count}종목 공시만 우선 표시, 전체 시장은 공시 신호 페이지에서 범위 전환). `src/app/page.tsx`에서 `dataMetadata.count` 전달(홈 공시는 이미 universe 필터됨 — 정책을 명시적으로 노출). 호재/악재 프레이밍 0, 신뢰도는 분류 신뢰도만 유지.
  - **[2] 공시 범위 버튼 명확화** — `src/components/DisclosureExplorer.tsx` "전체 시장/분석 대상만" 알약→**세그먼트 버튼 그룹**(role=group·`min-h-[38px]`·선택 시 filled bg+shadow+ring·카운트 배지 대비 강화·`aria-pressed` 유지) + 하단 도움말 캡션("분석 대상만 = 점수 산출 대상 공시 · 전체 시장 = 분석 대상 외 포함 DART 전체"). 기본 `scope="all"` 보존, 필터·카운트 로직 무변경, flex-wrap로 390px 오버플로 가드.
  - **[3] 베타→Pro 전환 안내 노출** — `src/app/pricing/page.tsx` 카드 그리드와 비교표 사이에 **sky 톤 전용 콜아웃**(관심 종목 공시·저장 조건 알림은 베타 무료, 정식 출시 시 Pro 전환 예정, 시점·가격 미확정·사전 공지). `pricing.ts` 문구는 단일 출처 유지(신규 가격 확정 0).
  - **[4] 약관 정리** — `src/app/terms/page.tsx` 상단에 **현재(상용화 전) 확정 정책 박스**(유료 결제 미제공·전 기능 무료 / 매직링크·카카오 인증·비밀번호 미저장 / 공개 데이터 출처·비자문)만 안정 문구로 firm. 미확정 결제·환불·청약철회는 기존 "출시 전 확정 필요 항목(초안·미확정)" 블록 그대로 유지(해결 표시 안 함). `docs/legal-ai-commercial-readiness.md`에 F항 task-66 메모 추가(법무 검토 완료 아님·잔여 리스크 명시).
  - **[5] 개인정보 표 모바일 QA** — `src/app/privacy/page.tsx` §5-1 국외 이전 표는 이미 `overflow-x-auto min-w-[480px]`(7열) → 구조 무변경, **모바일 전용 스크롤 어포던스 1줄**("좌우로 밀어 전체 열…", `md:hidden`) 추가. 표 콘텐츠·열 수 무변경.
- **검증**: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목·오류 0·금칙어 0·Metrics 2.4 · `npm run build` exit 0(SSG 138p+전 라우트) · 변경 5파일 advisory/urgency grep 0. 로컬 prod 3267 6경로(`/ /disclosures /pricing /terms /privacy /stocks`) **HTTP 200·치명 마커 0**. SSR 마커 확인: `/` "표시 정책"·"분석 대상 138종목"·"공시 신호 페이지", `/disclosures` "표시 범위"·세그먼트 라벨·"점수를 산출하는 분석 대상" 캡션, `/pricing` "정식 출시 시 Pro 기능으로 전환될 예정"·"베타 무료", `/terms` "현재 적용되는 정책 (상용화 전)"·"비밀번호를 저장하지 않습니다"·"출시 전 확정 필요 항목", `/privacy` "좌우로 밀어 전체 열"·국외 이전 표.
- **5종 상태**: [1][2][3][5] **구현 완료**. [4] **부분** — 현재 사실(확정)만 안정화, 결제·환불 등은 **법무/사업 확정 필요로 계속 미확정 표기**(legal-ai-commercial-readiness.md F항에 잔여 리스크 문서화).
- **게이트 한계 / 잔여 리스크**: Playwright 미구성 → **390px 실 브라우저 육안은 운영자 게이트**(curl+SSR grep+build로 대체). 운영자: `/disclosures` 세그먼트 버튼 선택 상태(데스크톱/390px)·`/pricing` 콜아웃 줄바꿈·`/privacy` 표 가로 스크롤+힌트·`/terms` 정책 박스 1회 확인 권장. 약관 결제 조항 법무 확정·결제 게이트 미연결·가격 미확정은 그대로(④/⑤). 원격 갱신·main 머지·외부 릴리스 범위 외(운영자).
- **다음**: 운영자 390px 육안 게이트 → 외부 릴리스(별도 단계). 이후 ④ 결제 연동·⑤ 데이터/약관 법무 확정.

## 2026-06-26 - [codex] Post-deploy 2nd QA P0 polish complete
- **Scope**: Closed the user-reported post-deploy P0 items after the 2nd QA release: stock detail CTA spacing, beginner STEP cards, data status badge separation, removal of "chase-buy" wording, compare empty-state guidance, and stocks explorer duplicate toggle/filter text.
- **Changed**: Added `StockDetailActionButtons` as the shared stock-detail CTA component, converted beginner reading steps into three `StepCard` cards, separated data-status pills, rewrote the surge-risk copy to mention volatility and sustainability checks, upgraded `/compare` empty state with search/recommended/recent/watchlist entry points, and replaced the quick-preset/details filter duplicated labels with controlled single-state labels.
- **Verification**: `npx tsc --noEmit` passed, `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py` passed for 138 stocks with 0 errors and Metrics 2.4, and `npm run build` passed.
- **Browser smoke**: Local `127.0.0.1:3000`/`localhost:3000` checks confirmed `/stock/005380` has separated CTA buttons, 3 STEP cards, 3 data-status pills, and no forbidden "추격매수" text; `/compare` empty state shows search, recommended sets, recent-view, and watchlist UI; `/stocks` shows only one expand/collapse label and no duplicated detail-filter text.
- **Deploy/public smoke**: Pushed `origin/main` to `743873a`; Vercel production updated. Public browser smoke on `https://ornscore.com/stock/005380`, `/compare`, and `/stocks` confirmed the same P0 markers and no duplicate/glued text.
- **Next**: Continue with the P1 follow-up list from the user review: home disclosure prioritization, clearer disclosure market filters, stronger beta-free-to-Pro pricing messaging, final legal terms copy, and privacy table mobile QA.

## 2026-06-26 · [codex] 2차 QA main 반영·운영 배포 완료
- **배포 승인/범위**: 사용자 요청 "응 배포해줘"에 따라 Task 60~63의 ORNSCORE 2차 QA 개선 결과를 `main`에 반영하고 `origin/main`에 push했다.
- **원격 최신 데이터 보존**: push 직전 `origin/main`에 `e8222f1 chore(data): daily refresh 2026-06-26T10:44Z`가 먼저 올라와 있어, 이를 버리지 않고 2차 QA 브랜치에 병합한 뒤 `main`을 fast-forward했다.
- **검증**: 병합 후 `npx tsc --noEmit`, `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`, `npm run build` 모두 통과. Metrics 2.4 정합, 138종목 오류 0건, 금칙어 0건.
- **push**: `origin/main`이 `e8222f1`에서 `2efe523`으로 갱신됨. 강제 push 없음.
- **운영 확인**: `https://ornscore.com` 공개 사이트에서 `/pricing`, `/privacy`, `/offline`, `/backtest`, `/stock/005380`, `/status`가 HTTP 200이며 2차 QA 마커를 노출. `/manifest.webmanifest`도 HTTP 200 및 `application/manifest+json`으로 응답.
- **다음**: 사용자가 실제 화면을 보고 체감 피드백을 주면 그 내용을 다음 개선 큐로 등록한다. 남은 큰 축은 결제/구독 권한 연결, 데이터 소스 법무 확정, 관리자 인증/로그, service worker/아이콘 보강, 모바일 실브라우저 육안 QA.

## 2026-06-26 · [claude] 2차 QA 최종 검증 — 게이트 전수 통과·공개 전 릴리스 체크리스트 (Task 63, Claude)
- **목적**: 방금 등록된 ORNSCORE 2차 QA 작업(Task 60 P0 · Task 61 P1 · Task 62 P2)이 모두 완료·정리됐는지 최종 검증하고, **공개 주소(`https://ornscore.com/`) 최신화 전에 운영자가 확인할 마커**를 명확히 남긴다. branch `ai-center/task-63-ornscore-2-qa`, 시작·종료 HEAD `01df662`(Task 62 tip, 클린). **앱 소스 무수정** — 산출물은 검증 결과 + 이 릴리스 체크리스트(PROGRESS·AI_HANDOFF). 리셋/pull/머지/push·신규 npm·빌드 단계 추가 0. AI Center 4310·미리보기 3000 무중단(검증 prod `127.0.0.1:3256`, 내 리스너 node PID 23936만 taskkill).
- **완료 확인(읽기 전용 감사)**: `git log` 선형 히스토리에 2차 QA 3개 묶음 전부 존재 — Task 60(`e8e5a34`←`c3b6765`, PART A·I P0 5종), Task 61(`d6bf701`←`071f759`/`c321f2a`/`9908805`/`3f75d23`, PART B~E·I P1), Task 62(`01df662`←`56e1ee7`/`9f92756`/`3086863`/`09380a6`/`ea5ef24`, PART F~I P2). 시작 기준 `b2fad41`(codex 운영 배포 기록) 위에 P0→P1→P2가 선형으로 쌓임. `git status` 클린(미커밋/미추적 0). `docs/ornscore-spec-coverage.md` §8(2차 QA 설계서 표) PART A~I 전 행 ①(또는 ①/④/⑤ — 미연결 결제·가격 미확정·SW 스텁·법무 결론은 명시 백로그 사유 동반). 예상과 다른 미커밋 변경·누락 항목 0.
- **게이트 전수 통과**:
  - **Gate 1 `npx tsc --noEmit`** → exit 0.
  - **Gate 2 `verify_metrics.py`(PYTHONUTF8=1 PYTHONIOENCODING=utf-8)** → 검사 138종목·오류 0건·금칙어 0건·산식 버전 **Metrics 2.4** 일치, exit 0. 데이터 기준일 `stocks.json.asOfBusinessDate=20260625` → 표기 **2026.06.25**.
  - **Gate 3 `npm run build`** → exit 0. SSG `/stock/[ticker]` 138 페이지(`/stock/005930` 외 +135) + `/manifest.webmanifest`(○)·`/offline`(ƒ)·`/admin/status`(ƒ)·`/pricing`·`/status`·`/api/report-data-issue` 포함 전 라우트 정상 emit. 빌드 단계·청크 구조 변경 0.
  - **Gate 4 로컬 prod 3256 13경로 스모크** → `/ /today /stocks /compare /stock/005380 /stock/032830 /disclosures /backtest /status /pricing /terms /privacy /watchlist` 전부 **HTTP 200**, 치명 마커(Application error/TypeError/ReferenceError/cannot read/Unhandled) **0건**. SSR 마커 확인: `/`·`/status` "Metrics 2.4"+"2026.06.25", `/status` "종목 커버리지", `/pricing` 3티어("출시 예정"·"미확정"·"기능 비교"·"베타 무료"), `/privacy` 국외이전 `<table>` 1개("이전받는 자"·"거부 방법"), `/terms` "출시 전 확정 필요"·"청약철회", `/stock/005380` 업종 휴리스틱 캡션("내부 분류 기준"·"공식 KRX 업종과 다를"), 홈 하단 nav `grid-cols-5`, `/manifest.webmanifest`·`/offline` 200.
- **게이트 한계(운영자 수동 게이트)**: Playwright 미구성 → **데스크톱/390px 모바일 실 브라우저 가로 오버플로·콘솔 오류 자동 게이트는 부재**. 신규 npm/Playwright 추가는 범위 외 → **운영자 육안 1회 권장**(하단 5탭 오버플로 0·`/privacy` 표 가로 스크롤·AI 동의 체크박스 줄바꿈·`/stock/*` 업종 캡션·`/offline` 설치 힌트). **AI 분석 동의 체크박스는 `StockTabs` 비기본 탭 안 클라 렌더라 초기 SSR HTML 미노출**(tsc/build로 검증) → 운영자 탭 열어 확인.
- **공개 주소 최신화 전 준비 상태 / 운영자 확인 마커**(배포 후 `https://ornscore.com/`에서 동일 노출 확인):
  1. `/`·`/status`: 데이터 기준 **2026.06.25** · **Metrics 2.4** 동일 노출.
  2. `/pricing`: Free/Pro/Premium **3티어** + 가격 **"미확정"**(확정 단일 금액 0) + 알림=Pro 경계("베타 무료") + 기능 비교표 가로 스크롤.
  3. `/privacy`: 개인정보 **국외 이전 `<table>`**(Supabase 일본·Vercel/Resend/Anthropic 미국) 가로 스크롤.
  4. 모바일 하단 탭 **5탭**(오늘·종목 찾기·공시 신호·관심·더보기) + `/watchlist` 관심 승격.
  5. `/offline` + `/manifest.webmanifest` 응답(PWA 최소).
  6. `/stock/*` "요약" 외 탭(점수 근거 등)에서 **AI 분석 실행 전 동의 체크박스**(미동의 시 실행 disabled).
  7. `/stock/*` 업종 대비 밸류 캡션("오른스코어 내부 분류 기준 · 공식 KRX 업종과 다를 수 있습니다").
  8. `/terms` "출시 전 확정 필요 항목" 블록 + `/backtest` 단일 고지·KPI 위험 비교 줄.
- **실패/보류 항목**: 없음(4개 게이트 전부 통과). 보류는 전부 의도된 ④/⑤ 백로그(아래 잔여 리스크).
- **잔여 리스크(Task 62에서 이월, 공개 자체의 블로커 아님)**: ① 결제·구독 권한 게이트 미연결(④) — Pro/Premium은 정보구조·대기 신청만. ② 가격 전부 미확정(④/⑤) — 출시 전 법무·사업 확정·공지. ③ service worker 미등록(스텁)·512px 마스커블 PNG 아이콘 미보강(④). ④ 관리자 인증·배치 이력·수집 실패 로그·신고 워크플로 백로그(④). ⑤ 데이터 소스 상용 적법성 결론 [법무] 확인 필요(⑤). ⑥ Playwright 미구성 → 운영자 육안 모바일 게이트(⑤).
- **다음(범위 외·운영자)**: 운영자 데스크톱/390px 육안 게이트 → **`git push origin main`(FF) → Vercel 자동배포 → 위 8개 마커 공개 주소 확인**. Claude는 main 직접 push 안 함(CLAUDE.md 경계). 이후 ④ 결제 연동·SW/아이콘·관리자 인증/로그·⑤ 데이터 소스 법무 확정.

## 2026-06-26 · [claude] 2차 QA 설계서 PART F·G·H·I P2 마감 — 데이터 리스크·법무 고지·관리자 MVP·모바일/PWA (Task 62, Claude)
- 기준 설계서 `ORNSCORE_2nd_QA_improvement_spec.md` PART F(§18~19)·G(§20~22)·H(§23~24)·I [P2-1~P2-7]을 작은 단위로 반영. branch `ai-center/task-62-ornscore-2-qa-p2-ai-pwa`, 시작 HEAD `d6bf701`(Task 61 위, 클린) — **리셋/pull/머지/push·신규 npm·빌드 단계 추가 0**. 점수식·`stocks.json`·`backtest-result.json`·`direction`·`api/cron/notify`·`api/cron/evaluate-alerts` 무변경. AI Center 4310·미리보기 3000 무중단(검증 prod `127.0.0.1:3255`, 내 리스너 PID 6104만 taskkill). 투자 조언성 표현 신규 0(부정 고지만).
- **시작 전 상태 확인**: 플래너 라인번호 base `b2fad41` 기준 → Task 60/61 변경분과 어긋나 실제 코드 grep으로 현재 위치 재확인 후 반영. legal 문서 결제 체크리스트(A절)는 기구현 → 중복 작성 0(terms 블록에서 참조). 아이콘은 `src/app/icon.svg`(벡터) 하나뿐 → manifest는 SVG 재사용·512px PNG는 운영자 보강 권장으로 문서화.
- **반영(코드 8파일 + 문서 4파일)**:
  - **[P2-3/§18] `docs/data-source-commercial-risk.md`** — §18 컬럼 형식 요약표(KRX·DART·Naver·yfinance·FDR / 용도·상용 가능성·장애 가능성·대체 소스·조치) + "핵심 유료 기능 → 공식·안정 데이터 전환 로드맵"(재무 1순위·현재가 2순위·yfinance 3순위·KRX 4순위·업종 중기) 신설, 날짜 2026-06-26·task 62 갱신. 법적 결론은 **[법무] 확인 필요** 유지(적법성 단정 0).
  - **[P2-4/§19] `src/components/stock/SectorComparison.tsx`** — "업종 분류는 오른스코어 내부 분류 기준이며 공식 KRX 업종과 다를 수 있습니다" 캡션 추가(같은 업종 비교 탭에서 업종 대비 밸류 카드 바로 아래 노출). 산식 무변경. `stock/[ticker]/page.tsx`는 SectorComparison이 같은 탭에 인접해 중복 캡션 미추가.
  - **[P2-5/§21] `src/app/privacy/page.tsx`** — 국외 이전 `<ul>` → `<table>`(overflow-x-auto·min-w-[480px]: 이전받는 자/국가/이전 항목/이전 목적/이전 시점/보유기간/거부 방법, Supabase 일본·Vercel/Resend/Anthropic 미국 4행). Kakao 국내 주석·Anthropic 학습 미사용 보존.
  - **[P2-6/§22] `src/components/AiAnalysisCard.tsx`** — 실행 전 고지 문구 강화(선택 종목 데이터·입력 항목 Anthropic(미국) 전송·민감정보 금지·참고용 요약) + **필수 동의 체크박스**(`consented` 상태, 미동의 시 "AI 분석 실행" disabled·"동의 후 실행할 수 있어요"). 결과 하단 고지 2종 기존 유지. API/route/비용 경로 무변경. 44px 탭 타깃.
  - **[§20] `src/app/terms/page.tsx`** — 유료 서비스 섹션에 "출시 전 확정 필요 항목(초안·미확정)" 블록(결제수단·주기·자동갱신·해지 효력 시점·환불·7일 청약철회·디지털 콘텐츠 환불 제한·장애 보상·정산 방식 9항). 확정 가격 0, `legal-ai-commercial-readiness.md` 참조.
  - **[P2-2] 오류 신고 DB 저장 MVP** — 신규 `src/app/api/report-data-issue/route.ts`(POST·nodejs·`data_reports` insert·waitlist 동일 graceful·테이블 SQL 주석) + 신규 `src/components/status/ReportDataIssueForm.tsx`(인앱 폼) — `ReportDataIssue.tsx`에 임베드하되 **mailto 버튼 항상 fallback 유지**(env/테이블 부재 시 안 깨짐).
  - **[P2-1] 관리자 상태판 MVP** — 신규 `src/app/admin/status/page.tsx`(서버·noindex·force-dynamic): selfCheck 요약·검증보류 종목 리스트·PER·PBR 결측 리스트(stocks.json 실측) + `data_reports` 최근 50건(ADMIN_ENABLED=1 시·graceful). `/status` 무변경(공개 유지). 신규 `docs/ornscore-admin-status-backlog.md`(배치 이력·수집 실패 로그·수동 재수집·신고 워크플로·관리자 인증 백로그+데이터 구조 스케치).
  - **[P2-6/§23] `src/components/MobileBottomNav.tsx`** — `/watchlist`(관심) MORE→PRIMARY 승격(4 primary + 더보기), `grid-cols-4`→`grid-cols-5`. Heart 아이콘·active·HIDE 유지.
  - **[P2-7/§24] PWA** — 신규 `src/app/manifest.ts`(Next MetadataRoute: 오른스코어·short_name·standalone·다크 테마색·icon.svg 재사용) + 신규 `src/app/offline/page.tsx`(네트워크 필요 안내·"홈 화면에 추가" 힌트·noindex). **service worker는 캐싱/배포 충돌 회피로 미등록(문서 스텁)**, 512px PNG 마스커블 아이콘은 운영자 보강 권장.
- **검증**: `npx tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목·오류 0·금칙어 0·Metrics 2.4 · `npm run build` 0(SSG 138p + `/manifest.webmanifest`·`/offline`·`/admin/status` 포함 전 라우트). 로컬 prod 3255 10경로(`/status /terms /privacy /pricing /watchlist /stock/005380 /guide/metrics /admin/status /offline /manifest.webmanifest`) **HTTP 200·치명 마커 0**. SSR: privacy 국외이전 표(이전받는 자·거부 방법·회원탈퇴·AI 기능 미사용), terms 확정 필요 9항, admin 상태판(검증 보류 종목·내부 운영용), stock 업종 휴리스틱 캡션, offline 홈 화면 추가, manifest JSON 정상, nav `grid-cols-5`. 변경 파일 금칙어 grep=기존 부정 고지("수익 보장 [제공 안 함]")만·U+FFFD 0.
- **게이트 한계 / 잔여 리스크**: Playwright 미구성 → **운영자 데스크톱/390px 육안 게이트 권장**(하단 5탭 오버플로 0·privacy 표 가로 스크롤·AI 동의 체크박스 줄바꿈·`/stock/*` 업종 캡션·`/offline` 설치 힌트). **AI 동의 체크박스는 `StockTabs` 비기본 탭 안이라 초기 SSR HTML 미노출**(탭 활성 시 클라 렌더, tsc/build로 검증) → 운영자 탭 열어 확인. 결제·구독 게이트 미연결·가격 미확정(④/⑤) 유지. service worker 미등록(스텁)·512px 아이콘 미보강(④). 관리자 인증·배치 이력·수집 로그·신고 워크플로는 백로그(④). 데이터 소스 법적 결론 [법무] 확인 필요(⑤).
- **다음**: 운영자 육안 게이트 → 결제·구독 연동(④)·service worker·512px 아이콘(④)·관리자 인증/배치 로그(④)·데이터 소스 법무 확정(⑤). 원격 갱신·main 머지·외부 릴리스 범위 외(운영자).

## 2026-06-26 · [claude] 2차 QA 설계서 PART B~E·I P1 마감 — Free/Pro 경계·CTA·문구 중립화·공시 범위·백테스트 (Task 61, Claude)
- 기준 설계서 `ORNSCORE_2nd_QA_improvement_spec.md` PART B(§7~9)·C(§11~13)·D(§15)·E(§16~17)·I [P1-1~P1-5]를 작은 단위로 반영. branch `ai-center/task-61-ornscore-2-qa-p1-ux-cta`, 시작 HEAD `e8e5a34`(Task 60 위, 클린) — **리셋/pull/머지/push·신규 npm·빌드 단계 추가 0**. 점수식·`stocks.json`·`backtest-result.json`·`direction` 무변경(표시/문구/표시필터/한도값만). AI Center 4310·미리보기 3000 무중단(검증 prod `127.0.0.1:3254`, 내 리스너 PID 30844만 taskkill). 투자 조언성 표현 신규 0(부정 고지만).
- **시작 전 상태 확인(예상과 다른 점 기록)**: 플래너 라인번호는 base `b2fad41` 기준이라 Task 60 변경분과 어긋남 → 실제 코드 grep으로 현재 위치 확인 후 반영. **백테스트 §17(KPI 수익/위험 균형)·"구성 예시" 문구는 이미 #27/Task 60에서 충족** → 중복 구현 0, 위험 비교 한 줄만 강화. `FEATURES`(features.ts)는 어디서도 소비되지 않는 단일 출처 문서 → 필드 추가 안전. `FREE_WATCHLIST_LIMIT`/`FREE_AI_LIMIT`은 pricing 표시 전용(게이트 미사용) 확인 → 한도 축소는 표시 일관·동작 무변경.
- **반영(코드 14파일, 표시/문구/표시필터/한도값만)**:
  - **[P1-1/P1-2] Free/Pro/Premium 경계 재설계** — `src/lib/limits.ts` Free 한도 축소(`FREE_WATCHLIST_LIMIT` 20→5·`FREE_AI_LIMIT` 3→1). `src/lib/pricing.ts` Free 알림을 "관심 종목 공시 알림 · 저장 조건 알림 (베타 무료 체험 · 정식 출시 시 Pro)"로 정직 표기, Pro `includes` 맨 앞에 "관심 종목 공시 알림 · 저장 조건 알림 (Pro 핵심)" + "점수 급변·거래활성도 급증 알림" 핵심 가치 승격. `COMPARE_ROWS` 알림 행 free `true`→`"베타 무료"`(pro/premium ✓). `src/app/pricing/page.tsx` `Cell`에 "베타 무료"(sky 톤) 분기·범례·하단 정직 한 줄 추가.
  - **[P1-1/P1-2] 라이브 크론 보존** — `src/lib/features.ts` watchlistDisclosureAlert·conditionAlert에 `betaFree:true, plannedPlan:"pro"` 마커만 추가(status `active` 유지). **`api/cron/notify`·`api/cron/evaluate-alerts` 무변경**(발송 파이프라인 보존) — 라이브 동작과 모순 없게 "베타 무료 → 정식 Pro" 로드맵으로 표기.
  - **[P1-3] 종목 상세 초보자 카드 내부 CTA** — `src/components/BeginnerReading.tsx` 하단 "…버튼을 이용하세요" 안내문 → 카드 안 직접 `<NextActionButtons />`(공시 확인·재무 보기·점수 근거·업종 비교, `#disclosures/#financials/#basis/#summary`) "다음으로 확인하기" 블록으로 교체. STEP 카드·읽기 순서·모바일 2열 그리드(44px) 보존.
  - **[§11~13] 문구 중립화(표시 문자열만)** — `StocksExplorer.tsx` 프리셋 라벨 "급등했지만 위험한 종목?" → "최근 상승폭이 커진 종목". `guide/metrics/page.tsx` "고점 추격의 위험" → 변동성 프레이밍·"시장의 관심이 쏠리는 구간" → "이슈·뉴스·공시·수급 변화 여부 확인 필요". `metricReadings.ts`·`ScoreTooltip.tsx`(howToRead 2곳)·`today/page.tsx`(추세 footnote·체크리스트) "고점 추격"/"시장의 관심"/"관심이 모이는 중" → 중립·확인 포인트. 금칙어 신규 0.
  - **[P1-4 / §15] 공시 분석 대상/전체 시장 필터** — `src/components/DisclosureExplorer.tsx` "전체 시장 / 분석 대상만" 범위 토글(state `scope`, `universeSet` 필터, 기본 "전체 시장"=기존 동작 보존). 타입 필터·요약 카드·헤더 카운트 모두 `scoped` 기준 일관. **홈 정책 분리**: `src/app/page.tsx` `pickTopSignals`에 universe 인자 → 홈 "오늘 먼저 볼 공시 신호"는 분석 대상 종목만(표시필터, API/`direction` 무변경).
  - **[§16/§17] 백테스트 고지 중복·KPI 균형** — `backtest/BacktestRiskNotice.tsx` `{dataStatus.limits.backtest}` 뒤 중복 "현재 ORNSCORE 종합점수 검증 결과는 아닙니다." 제거(헤더 1회 + 한계 박스 1회로 단일화). `BacktestClient.tsx` KPI 수익/위험 그리드 바로 아래 캡션에 실제 비교 "이 전략 MDD -41.4%(벤치 -28.0%) · Sharpe 0.89(벤치 0.98)" 추가 → 수익률 직후 위험을 같은 비중으로(수치 산출 무변경).
- **검증**: `npx tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목·오류 0·금칙어 0·Metrics 2.4 · `npm run build` 0(SSG 138p+전 라우트) · 변경 14파일 금칙어 grep = 부정 고지 2건만(신규 아님)·U+FFFD 0. 로컬 prod 3254 10경로 **HTTP 200·치명 마커 0**. SSR: `/pricing` 베타 무료·정식 출시 시 Pro·Pro 핵심·관심 5개·AI 월 1회·가격 미확정 렌더; `/guide/metrics`·`/today` "고점 추격" 0; `/stocks` "급등했지만 위험" 0·신 라벨 렌더; `/backtest` "종합점수 검증 결과는 아닙니다" 1회·위험 비교 줄 렌더; `/disclosures` 범위 토글 렌더; `/stock/005380` "다음으로 확인하기" 1·STEP 1 유지·구 안내문 0.
- **잔여 리스크 / 게이트 한계**: Playwright 미구성 → 운영자 데스크톱/390px 육안 게이트 권장. **실 결제·구독 권한 게이트 미연결(④)·가격 전부 미확정(④/⑤)** 그대로 — 이번은 정보구조·정직 표기만. **무료 알림은 베타 동안 실제 발송됨**(크론 라이브) → "베타 무료 → 정식 Pro" 표기로 라이브 동작과 일치(실제 Pro 게이팅은 결제 연동 시). 공시 전체 기간 수집(§14 A안)·KRX 공식 업종(§19)·관리자 상태판(§10)·약관 표 형식(§21)·모바일 App-first/PWA(§23~24)는 ④/⑤ 별도 큐.
- **운영자 시각 점검 권장(390px+데스크톱)**: `/pricing` 3티어·알림=Pro 경계·미확정 가격·비교표 가로 스크롤; `/stocks` 첫 화면 밀도·재라벨 프리셋; `/stock/*` 카드 내 CTA 줄바꿈; `/disclosures` 범위 토글·오버플로 0; `/backtest` 단일 고지·KPI 위험 줄; 콘솔 0·가로 오버플로 0.
- **다음**: 운영자 육안 게이트 → 남은 P2(§10 관리자 상태판·§21 국외이전 표·§22 AI 고지 모달·§23~24 모바일 하단 탭/PWA)·④ 결제 연동. 원격 갱신·main 머지·외부 릴리스 범위 외(운영자).

## 2026-06-26 · [claude] 2차 QA 설계서 PART A·I P0 5종 마감 (Task 60, Claude)
- 기준 설계서 `ORNSCORE_2nd_QA_improvement_spec.md` PART A(P0)·PART I [P0-1~P0-5]를 작은 단위로 반영. branch `ai-center/task-60-ornscore-2-qa-p0`, 시작 HEAD `b2fad41`(클린) 위 — **리셋/pull/머지/push 없이** 로컬 수정·검증·커밋까지만. AI Center 4310[PID 11160]·미리보기 3000 무중단(검증 prod `127.0.0.1:3253`, 내 리스너 node PID 14504만 taskkill). 점수식·`stocks.json`·`backtest-result.json`·`direction` 무변경(표시/문구만), 신규 npm 0, 빌드 단계 추가 0, 투자 조언성 표현 신규 0(부정 고지 "추천이 아닙니다"만).
- **시작 전 상태 확인**: P0-2(비교 빈 상태)·P0-4 홈 스냅샷 공시 카드("DART · 최신 200건 내")는 **#36/#41에서 이미 완료** 확인 → 재구축 0, 실제 공백만 채움.
- **반영(코드 4파일, 표시/마크업/문구만)**:
  - **[P0-1] `src/components/BeginnerReading.tsx`** — "먼저 확인할 것" `<ol>/<li>`(자동 번호 + 내부 숫자 배지가 겹쳐 `1. 1` 중복)을 **STEP 카드**(`<a>` 카드 + `STEP n` 단일 배지)로 교체. 번호는 `STEP {i+1}` props 단일 출처(ol 자동 번호 제거), `CONFIRM_ORDER` 텍스트·href·`#basis`/`#disclosures`/`#financials` 앵커·읽기 순서 보존(스크린리더 순서 유지). 390px: `flex items-start`·`break-keep`·`min-w-0` 줄바꿈 가드.
  - **[P0-3] `src/components/BacktestClient.tsx`** — "마지막 리밸런싱 **보유** {n}종목" → "마지막 리밸런싱 **구성 예시** {n}종목"("보유" 제거). 캡션도 spec 권장문("과거 백테스트 규칙을 마지막 리밸런싱 시점에 적용했을 때의 구성 예시입니다 · 현재 확인 후보나 추천이 아닙니다.")으로 강화.
  - **[P0-4] `src/components/home/DisclosureSignalSection.tsx`** — 홈 "오늘 먼저 볼 공시 신호" 설명에 "**DART 최신 200건 내**" 기준 추가(스냅샷 카드와 일관). `MarketSnapshotCards.tsx`는 기존 "DART · 최신 200건 내" 유지(무변경).
  - **[P0-5] `src/components/StocksExplorer.tsx`** — 상세 필터 버튼(모바일/데스크톱)의 카운트 배지를 라벨에서 분리(`ml-0.5`→`ml-1.5` + 라벨 `<span>` 래핑 + `aria-label`)해 "▾1"로 안 읽히게. 모바일(`lg:hidden`)/데스크톱(`hidden lg:inline-flex`)은 브레이크포인트 배타라 동시 노출 없음. 빠른 프리셋 `펼치기 ▾`/`접기 ▴`는 `group-open` 토글로 단일 노출(기존). 필터 로직 무변경.
- **검증**: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목·오류 0·금칙어 0·Metrics 2.4 · `npm run build` exit 0(SSG 138 종목 + 전 라우트) · 변경 4파일 금칙어 grep 0(부정 고지만). 로컬 prod 3253 7경로(`/ /stocks /compare /stock/005380 /stock/032830 /backtest /disclosures`) **HTTP 200·치명 마커(Application error/TypeError/ReferenceError/cannot read/Unhandled) 0**. SSR 확인: `/stock/005380` STEP 1/2/3 렌더·`1. 1` 중복 0, `/backtest` "리밸런싱 보유" 0건·"마지막 리밸런싱 구성 예시" 렌더, `/` "DART 최신 200건 내"(섹션)·"DART · 최신 200건 내"(스냅샷) 양쪽 렌더.
- **잔여 리스크 / 게이트 한계**: Playwright 미구성 → 실 브라우저 데스크톱/390px 시각 게이트 부재 → **운영자 육안 1회 권장**(STEP 카드 줄바꿈·비교 빈 상태·탐색 필터 배지 간격·가로 오버플로 0·콘솔 0). PART B~H(무료/유료 경계·문구 중립화·공시 전체 기간·관리자 상태판·약관 표 형식·모바일 App-first/PWA)는 제품/데이터/법무 결정 동반(④/⑤) → 별도 큐.
- **다음**: P1 티켓([P1-1] Free/Pro/Premium 경계·[P1-2] 무료 알림 제한·[P1-3] 초보자 카드 CTA·[P1-5] 백테스트 KPI 균형) 중 표시 가능한 것부터. 원격 갱신·main 머지·외부 릴리스 범위 외(운영자).

## 2026-06-26 - [codex] OrnScore production push and public verification complete

- Follow-up to Task 55: Claude completed all local verification but stopped at direct `git push origin main` because the project boundary blocks Claude main pushes.
- Codex completed the user-approved release push: `origin/main` advanced from `a561e45` to `6b3fa96`.
- Vercel auto-deploy completed; public checks passed for `/`, `/today`, `/stocks`, `/stock/005380`, `/stock/032830`, `/pricing`, `/status`, and `/watchlist`.
- `/pricing` now exposes the new Premium tier; checked pages returned HTTP 200, Metrics 2.4, and no fatal markers.
- Remaining follow-up: expert feedback review, optional Playwright desktop/390px visual QA, and later cleanup of legacy mojibake notes in old handoff/progress sections.

## 2026-06-26 · [claude] OrnScore 최종 검증·배포 — #38~#48 main 반영 (Task 55, Claude)
- 작업: AI Dev Center 승인(2026-06-26 KST 메인 스레드 — "작업 종료 후 배포까지")에 따라 #42~#48(및 동일 선형 체인의 #38~#41) 완료 큐를 **origin/main에 반영하고 운영 배포**. 이 태스크 한정으로 원격 변경·운영 배포 승인. DB·env/키/시크릿·결제/인증 설정·히스토리 재작성·강제 푸시·일괄 삭제는 비승인.
- 완료 게이트 확인: AI_HANDOFF "Last AI Center Event = Task 48 completed" + #42~#48 각각 PROGRESS 엔트리·태스크 브랜치가 선형 체인 내 커밋을 가리킴 → 전부 completed·커밋됨. 실패/실행중/일시정지/미커밋 0.
- git 상태(읽기 전용 점검): branch `ai-center/task-55-ornscore-final-verification-and-prod`, 작업트리 클린. `origin/main`=`a561e45`(Task 37 머지)가 HEAD `85e48d9`(Task 48 tip)의 **조상 → fast-forward 가능**. `origin/main..HEAD` = #38~#48 커밋만(무관 커밋 0). 로컬 `main`=`dad6e3b`는 origin/main의 조상(클린 ff).
- 릴리스 검증(HEAD `85e48d9` + 이 릴리스노트 커밋):
  - `npx tsc --noEmit` exit 0
  - `PYTHONUTF8=1 verify_metrics.py` 138종목·오류 0·금칙어 0·Metrics 2.4 일치
  - `npm run build` exit 0(타입게이트·SSG 138 종목 페이지 + 전 라우트, 빌드 트레이스 정상)
  - 로컬 prod 3408 스모크 **19경로 전부 HTTP 200·치명 마커(Application error/Unhandled/TypeError/ReferenceError/cannot read) 0**: `/ /today /stocks /stock/005380 /stock/032830 /pricing /status /watchlist /disclosures /backtest /compare /privacy /terms /about /universe /history /login /guide/metrics /settings/notifications`. 내 리스너 PID 23860만 taskkill, 3000·4310 무중단.
  - 릴리스 표면 마커: 데이터 기준일 **2026.06.25**·**Metrics 2.4**(`/`·`/status` 동일) — 운영 배포 후 동일 값 노출 확인 대상.
- 배포 방식: origin/main이 HEAD의 조상 → **fast-forward 머지**(`git merge --ff-only`)로 #38~#48 완료 커밋만 반영. 머지 커밋·리베이스·리셋·강제 푸시 없음. `git push origin main`(force 아님).
- 운영 검증(`https://ornscore.com/`): 운영자 푸시 대기 — 로컬 `main`을 `4cac303`로 fast-forward 완료(검증 전부 통과). **Claude의 main 직접 push는 CLAUDE.md 경계("Claude는 main 직접 push 안 함")로 자동 모드 분류기가 차단** → 운영자가 PowerShell에서 `git push origin main` 실행 필요(또는 Bash 푸시 권한 부여). 푸시 시 origin/main `a561e45`→`4cac303` fast-forward(#38~#48 + 이 릴리스 노트), 머지 커밋·강제 푸시 없음. 푸시 후 Vercel 자동배포 트리거 → `https://ornscore.com/` 스모크(데이터기준 2026.06.25·Metrics 2.4) 확인 예정
- 잔여 리스크: (1) Playwright 미구성 → 실 브라우저 데스크톱/390px 시각 게이트 부재 → **운영자 육안 1회 권장**. (2) 결제·구독·알림 실 발송 미라이브(④). (3) 커버리지 138종목(전체 상장 아님·단계적 확대 예정). (4) 가격 전부 미확정(④/⑤·법무·사업). (5) Vercel 자동배포는 main push로 트리거 — 배포 완료/전파는 운영자 대시보드에서 최종 확인 권장.

## 2026-06-26 · [claude] OrnScore 독립 QA 리뷰 — 전 경로 QA 리포트·핸드오프 갱신 (Task 48, Claude)
- #38~#47 자동화가 끝난 베타 직전 상태를 **QA 전문가 관점(만든 사람 아님)**으로 점검. branch `ai-center/task-48-ornscore-qa`, 시작 HEAD `d3d92f6`(클린). **앱 소스 무수정** — 산출물은 QA 리포트 + 진행/핸드오프 기록. 리셋/pull/머지/push·신규 npm 0. AI Center 4310·미리보기 3000 무중단(검증 prod `127.0.0.1:3403`, 내 node PID 14648만 정리).
- **신규 문서** `docs/ornscore-qa-feedback.md`(주 산출물): Severity 분포(P0=0·P1=1·P2=2·P3=3·확인 완료 12) + 각 이슈 경로/재현/기대/실제/제안 + 운영자 육안 체크리스트(19경로·데스크톱+390px) + 열린 질문 6 + 잔여 리스크.
- **점검 결과 핵심**:
  - **P0 없음** — 19경로 HTTP 200·치명 마커 0, 투자 추천성 금칙어 0(매칭은 전부 부정 고지·프롬프트 금지문), 미확정 가격을 확정처럼 쓰는 곳 0, 공통 고지 8경로 전면 노출.
  - **데이터 기준 2026.06.25·Metrics 2.4가 `/ /today /stocks /backtest /status /stock/*` 전부 동일**(불일치 0). `/today`는 동적 렌더(ƒ)라 방문일 신선(staleness 버그 없음).
  - 모바일 위험 클래스 0: `<table>` 전부 `overflow-x-auto`·반응형 없는 ≥5열 고정 그리드 0·`whitespace-nowrap` 13건 전부 안전·질문 프리셋 카드(설명+조건 배지+예상 결과 수+주의)까지 완성(`StocksExplorer.tsx:762~`, 커버리지 "부분" 평가보다 완성도 높음).
  - **P1(출시 전 필수)**: Playwright 미구성 → 실 브라우저 자동 데스크톱/390px 시각 게이트 부재 → 운영자 육안 검수 필요(범위 외 npm 추가).
  - **P2**: (1) 공시 수집 범위 표기 표면별 상이(/status·/disclosures "최근 7일·200건" vs 종목 상세 "최근 90일") — 사실 오류 아님(다른 쿼리)·문구 통합 제안. (2) `/today` 방문일 vs 데이터 기준일 시각 위계 운영자 확인.
  - **P3**: `CLAUDE.md` 구 브랜드 "밸류맵 스톡" 잔존(앱은 "오른스코어"로 일관) · 설계서 ③ 부분 구현 항목(자연어 요약·압축 보기·바텀시트·산식 빌드 게이트, 이미 백로그 추적) · 공시 라이브 종료일 ≠ 가격 기준일(설계상 정상).
- **검증**: `npx tsc --noEmit` exit 0 · `npm run build` exit 0(172p) · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·Metrics 2.4 · 로컬 prod 3403 19경로 200·치명 마커 0 · 신규 문서 Korean/링크(5개 교차 문서 전부 존재) 정상. `git status` = 신규 문서·PROGRESS·AI_HANDOFF만(앱 소스 0).
- **다음**: 운영자 데스크톱/390px 육안 게이트(P1) → P2-1 공시 범위 문구 통합·P2-2 today 날짜 위계·P3-1 CLAUDE.md 브랜드 정정(모두 표시/문서 수정, 산식·데이터 무변경). 원격 갱신·main 머지·외부 릴리스·결제 연동 범위 외(운영자).

## 2026-06-26 · [claude] 상용화 고도화 2-E §10·§14·§15·§16·§18 베타 출시 체크리스트·커버리지 제한 노출·최종 QA (Task 47, Claude)
- 설계서 2(`ornscore_commercialization_upgrade_spec.md`) **§10 커버리지 확대·§14 관리자 기능·§15 기술 고도화·§16 로드맵·§18 MVP 범위**를 기준으로, 베타 수준에서 **사용자에게 보여도 되는 상태 vs 아직 준비 중인 상태**를 구분하고 남은 의사결정/개발 항목을 추적 가능하게 정리. branch `ai-center/task-47-ornscore-2-e-qa`, 시작 HEAD `eb2123c`(클린) 위. **리셋/pull/머지/push 없이** 로컬 수정·검증·커밋까지만. AI Center 4310·미리보기 3000 무중단(검증 prod `127.0.0.1:3402`, 내 node PID만 taskkill). 점수식·`stocks.json`·`direction` 무변경, 신규 npm 0, 투자 조언성 표현 신규 0.
- **신규 문서** `docs/ornscore-beta-launch-checklist.md`(주 산출물): (a) §16 로드맵 현재 위치(Phase 1 베타 안정화 마무리→Phase 2 Pro 진입 직전, 작업별 완료/진행/대기 + 코드 인용) (b) §18 MVP 필수 11항목 "베타 노출 가능 vs 준비 중"(8 노출 가능 / 3 준비 중=공시알림·점수알림·결제, #45/#46 인용) (c) §10 커버리지 단계(현재 138→1단계 KOSPI200·KOSDAQ150·ETF→2단계 상위 500→3단계 전체)+§10.4 주의사항+사용자 제한 안내 문구안 (d) §14 관리자 MVP(읽기 전용 현황) vs 후속(재수집·재계산·계정정지) (e) §15+§4.4 모니터링/로그 "현재 점검됨(selfCheck·verify_metrics 게이트) vs 미점검(수집 성공률·API 실패·발송률·전환 이벤트)" (f) 베타 공개 전 최종 확인 체크리스트(검증 게이트·잔여 리스크·운영자 확인).
- **앱 변경(표시 1줄)** `src/lib/dataStatus.ts` — `knownLimits` 맨 앞에 "종목 커버리지" 항목 추가(현재 분석 대상 138종목·전체 상장 종목 아님·KOSPI200·KOSDAQ150·주요 ETF부터 단계적 확대·품질 검증 끝난 종목만 순차 추가). `dataMetadata.count` 단일 참조, 기존 `/status` "알려진 제한" 리스트가 자동 렌더(신규 컴포넌트 0·산식/데이터/selfCheck 무변경·중립 톤).
- **추적 갱신**: `docs/ornscore-spec-coverage.md` §10·§14·§15·§16~18 행에 Task 47 + 체크리스트 교차참조(상태 ④ 유지).
- **검증**: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·Metrics 2.4 · `npm run build` exit 0(SSG 172p) · 변경 파일(`dataStatus.ts`·신규 문서) 금칙어 grep 0(부정 고지 "매수·매도 추천이 아닙니다"만 매치) · 로컬 prod 3402 14경로(`/ /today /stocks /stock/005380 /stock/032830 /disclosures /backtest /compare /pricing /status /settings/notifications /watchlist /terms /privacy`) 200·치명 마커 0 · `/status` SSR "종목 커버리지 — 현재 분석 대상은 138종목…" 렌더 확인. 검증 prod node PID만 taskkill, 4310·3000 무중단.
- **잔여 리스크**: (1) 결제·구독 권한 게이트 미연결(④). (2) 가격 미확정(④/⑤, 법무·사업). (3) 알림 실 발송 미라이브(④). (4) 관리자 상태판·오류 신고 영속 저장 미구현(④). (5) 커버리지 138종목(④, 단계적 확대+품질 표시). (6) Playwright 미구성 → 운영자 데스크톱/390px 육안 게이트 권장(⑤). (7) 데이터 소스·결제 약관 [법무] 확정(⑤).
- **다음**: §10 커버리지 1단계 확대(품질 표시 동반)·§14/§15 관리자 상태판+로그 시스템(④, 제품·개발 결정 후 분리 착수). `docs/ornscore-beta-launch-checklist.md`·`docs/ornscore-spec-coverage.md` 교차참조. 원격 갱신·main 머지·외부 릴리스 범위 외(운영자).

## 2026-06-26 · [claude] 상용화 고도화 2-D §11·§13·§19 무료/Pro/Premium 경계·미확정 가격 안전 정리 (Task 46, Claude)
- 설계서 2(`ornscore_commercialization_upgrade_spec.md`) **§11 유료화 구조·§13 법적 리스크 관리·§19 추천 요금제**를 기준으로, **실제 결제 연결 없이** 요금제 정보 구조·기능 경계·전환 CTA·고지 문구를 안전하게 정리. Free/Pro/Premium 구분이 과장되지 않게, 미확정 가격을 확정처럼 쓰지 않게. branch `ai-center/task-46-ornscore-2-d-pro-premium-ux`, 시작 HEAD `849b995`(클린) 위. **리셋/pull/머지/push 없이** 로컬 수정·검증·커밋까지만. AI Center 4310[PID 11160]·미리보기 3000 무중단(검증 prod `127.0.0.1:3401`, 내 node PID 8676만 taskkill). 점수식·`stocks.json`·`direction` 무변경, 신규 npm 0, 투자 조언성·압박성 표현 신규 0(§13.3 금지 UI/카피 신규 도입 0).
- **신규 파일**:
  - `src/lib/pricing.ts` — 요금제 단일 출처. `PLANS`(free=active·pro/premium=planned) 각 `{id,name,status,priceLabel,priceConfirmed,tagline,valueLine,includes[]}`. Free 한도는 `limits.ts`(`FREE_COMPARE/WATCHLIST/AI_LIMIT`) 재사용. **Pro/Premium `priceConfirmed:false` + priceLabel을 "검토 중 · 미확정 (예상 월 9,900~14,900원, 확정 아님)" / "…월 29,000원대, 확정 아님" 형태로만**(단일 확정 금액 노출 금지). `COMPARE_ROWS`(✓/—/"준비 중") 비교표 데이터.
- **변경**:
  - `src/lib/features.ts` — `premiumPlan:{status:"planned"}` + Premium 미구현 7항목(개인화 대시보드·백테스트 커스터마이징·공시 반응 통계·CSV·고급 필터·업종 랭킹·자동 리포트) `plan:"premium",status:"planned"` 태그. 기존 라이브 무료 알림 2종(watchlistDisclosureAlert·conditionAlert) 그대로 — Free/유료 경계 정직 유지.
  - `src/app/pricing/page.tsx` — 2티어→**3티어 카드**(Free active / Pro·Premium "출시 예정·준비 중" 배지+미확정 가격 라벨) + **Free/Pro/Premium 기능 비교표**(`overflow-x-auto`·`min-w-[420px]`·✓/—/준비 중, 390px 가드) + §11 "왜 Pro/Premium인가" 가치 한 줄(시간 절약·변화 알림·기록·리서치 보조 프레이밍, 수익률/매수·매도 표현 0). WaitlistForm은 planned 티어(Pro·Premium)에만. 하단 **§13.2 서비스 공통 고지**(투자 추천 아님·매수·매도 추천 아님·최종 책임 본인) + "가격·정책은 검토 중이며 출시 전 확정·공지됩니다" 1줄. `metadata.description`에 Premium 출시 예정 명시.
- **§13 검토**: CTA는 §13.4 권장 동사(출시 알림 받기·지금 무료로 시작·자세히 보기)만 — 결제/압박형 0. §13.3 금지 UI/카피(매수 버튼형 CTA·강력 추천 배지·급등 예상·수익 보장·지금 진입·목표가/손절가·AI 픽 강조·리딩방 알림) 신규 도입 0. `terms/page.tsx`는 가격 무표기("출시 예정·초안") 유지 — 변경 안 함(검증만).
- **검증**: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·Metrics 2.4 · `npm run build` exit 0(`/pricing` 1.15 kB) · 변경 3파일 금칙어 grep 0 · 로컬 prod 3401 `/pricing`·`/terms`·`/settings/notifications`·`/watchlist` 200·에러 마커 0. `/pricing` SSR: "출시 예정 · 준비 중" 배지·"검토 중 · 미확정"·"가격 미확정"·"기능 비교" 표·"준비 중" 셀·"최종 투자 판단과 책임은 사용자 본인"·"매수·매도 추천이 아닙니다" 렌더. `/terms` 가격 수치(9,900/14,900/29,000 등) 0건(가격 무표기 유지).
- **잔여 리스크**: (1) **실제 결제·구독 권한 게이트 미연결(④)** — Pro/Premium은 정보구조·대기 신청만, 발송/과금 없음. (2) **가격 전부 미확정(④/⑤)** — 출시 전 법무·사업 확정·공지 필요(범위 외). (3) Playwright 미구성 → 운영자 데스크톱/390px 육안 게이트 권장(`/pricing` 3카드·비교표 가로 스크롤·미확정 배지·오버플로 0·콘솔 0). (4) Premium 비교표는 현재 "준비 중"/"미포함" 경계만 — 실제 권한별 게이팅은 결제 라이브 시 구현(④).
- **다음**: §11·§15 결제/구독 연동·권한 게이트(④, 제품+사업 결정 후 분리 착수). `docs/ornscore-spec-coverage.md` §11·§13·§19 행 교차참조.

## 2026-06-26 · [claude] 상용화 고도화 2-C §7 알림 설정 UX·무해한 알림 MVP (Task 45, Claude)
- 설계서 2(`ornscore_commercialization_upgrade_spec.md`) **§7 알림 시스템(7.1 종류·7.2 채널·7.3 설정·7.4 예시)·§5.4 점수 급변·§6.5 공시 알림**을 **실제 발송/외부 채널 없이** 사용자가 "알림 종류와 설정 개념"을 이해하는 안전한 MVP로 구현. branch `ai-center/task-45-ornscore-2-c-ux-mvp`, 시작 HEAD `d110be6`(클린) 위. **리셋/pull/머지/push 없이** 로컬 수정·검증·커밋까지만. AI Center 4310·미리보기 3000 무중단(검증 prod `127.0.0.1:3399`, 내 node PID 9152만 taskkill). 점수식·`stocks.json`·`direction` 무변경, 신규 npm 0, 투자 조언성·압박성 표현 신규 0(후보·탐색·확인·참고 정보·매수·매도 추천 아님 유지).
- **신규 파일**:
  - `src/lib/alertCatalog.ts` — §7.1 필수 알림 9종 단일 소스(순수). 라이브 2종(관심종목 공시→`cron/notify`+`NotificationToggle`, 저장 필터 충족→`cron/evaluate-alerts`+조건 알림) + 미리보기 7종(점수 급변·거래활성도 급증·과열 주의·80점 진입·공시 중요도 80+·업종 순위·백테스트). 중립 설명·카테고리·연결점.
  - `src/lib/alertPrefs.ts` — 미리보기 종류 ON/OFF **localStorage 전용**(`ornscore_alert_prefs` + `alert-prefs-changed` CustomEvent). **의도적으로 어떤 발송도 트리거하지 않음**(실 파이프라인 출시 전까지 설정 체험만). savedSearches/recentViews 패턴 미러.
  - `src/components/notifications/AlertTypeCatalog.tsx`(client) — 카테고리별 묶음. 라이브=사용 중 배지+상단 실설정 링크, 미리보기=로컬 토글+"준비 중·아직 실제 발송 전" 안내. 390px 가드(flex-wrap·min-w-0·break-words·44px).
  - `src/components/notifications/AlertExampleCards.tsx`(순수) — §7.4 형식 예시 3종(공시=recent-signals.json 실신호 최강도, 점수 급변=`getScoreChangesBatch` 전일대비 실변화/없으면 형식 예시, 거래활성도=`flowStats.ratio` 실 최댓값). 각 카드 '예시' 태그 + "본 알림은 투자 추천이 아닌 데이터 기반 참고 정보입니다" 고지.
  - `src/components/notifications/NotificationChannels.tsx`(순수) — §7.2 채널 정직 표시(이메일=사용 중, 웹·텔레그램·카카오·앱푸시=준비 중·비활성, 가짜 ON 없음).
- **변경**: `src/app/settings/notifications/page.tsx` — `redirect('/login')` 제거 → 비로그인도 개념(카탈로그·예시·채널·고지) 열람, 실 발송 설정(이메일 토글·발송 주소)만 로그인 CTA 뒤로. 상단 MVP 상태 배너(이메일 2종만 발송, 나머지 준비 중). 순서: 상태 고지 → 실 발송 설정/로그인 CTA → 알림 종류 카탈로그 → 채널 → 예시 → "알림 받으려면". 예시 데이터는 서버사이드 계산. `src/components/WatchlistClient.tsx` — 내 현황에 `/settings/notifications` 중립 CTA(압박 문구 없음) 1줄 추가.
- **검증**: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·Metrics 2.4 · `npm run build` exit 0(`/settings/notifications` 6.48 kB·138p) · 로컬 prod 3399 `/settings/notifications`(비로그인)·`/watchlist` 200·치명 오류 0(`Hydration`은 Next 런타임 공통 문자열, 양 페이지 동일·실오류 아님)·SSR에 알림 종류/채널/예시 카피 렌더(준비 중 24·예시 12)·라이브 cron 2종(`notify`·`evaluate-alerts`) **byte 무변경**(git diff 0)·CTA·카탈로그 라벨 빌드 청크에 존재·금칙어 grep 0(부정문 고지 제외).
- **잔여 리스크**: (1) 미리보기 토글은 localStorage 한정·의도적 무발송 — 실 발송 시 종류별 Supabase 스키마+cron 신규 필요(④). (2) 웹/텔레그램/카카오/앱푸시 채널 미연결(④). (3) 점수 급변 예시는 daily_scores 미축적 환경에서 형식 예시로 폴백(예시 태그·고지 명시). (4) Playwright 미구성 → 운영자 데스크톱/390px 육안 게이트 권장(`/settings/notifications`·`/watchlist`).
- **다음**: §7 실 발송 라이브화(종류별 임계·스키마·cron) + 채널 확장은 운영/데이터 결정 후 분리 착수(④, 설계서 2 §10번 큐).

## 2026-06-26 · [claude] Task 44 리뷰 수정 — 저장 필터 충족 수 4지표 하위점수 누락 버그
- **증상(리뷰 FAIL)**: /watchlist "저장한 필터"의 "현재 조건 충족 N개"가 `matchConfig.ts`의 `matchesConfig`로 계산되는데, 이 함수와 `StockForMatch`가 저장 필터에 흔한 `momentumMin/flowMin/valueMin/volMin`(추세·거래활성도·밸류·위험조정 하위점수 하한)을 **무시** → 해당 조건이 걸린 필터는 충족 수가 최대 ~10배 과대 집계되고 옆에 표시되는 `describeConfig` 조건 문구("추세 70+" 등)와 모순.
- **원인**: `StockForMatch`에 4지표 하위점수 필드가 없었고 `matchesConfig`에 4개 분기가 빠짐. `SavedSearchConfig`·`StocksExplorer`의 `matchesConfig`(클라)에는 이미 존재.
- **수정(4파일, 표시/로직 정합만)**:
  - `src/lib/matchConfig.ts`: `StockForMatch`에 `momentum/flow/value/vol: number` 추가, `matchesConfig`에 `(c.xxxMin ?? 0) > 0 && s.xxx < (c.xxxMin ?? 0)` 4분기 추가(StocksExplorer 규칙과 동일, 0이면 비제약).
  - `src/app/watchlist/page.tsx`·`src/app/api/cron/evaluate-alerts/route.ts`: `realStockPool` → `StockForMatch` 매핑에 `momentum/flow/value/vol` 4필드 추가(두 곳 동일 매핑 유지). cron 조건 알림도 이제 같은 하위점수 하한을 정확히 평가.
- **검증**: `npx tsc --noEmit` exit 0 · `verify_metrics.py` 138종목 0오류/금칙어 0/Metrics 2.4 · `npm run build` exit 0(`/watchlist` 8.4 kB). 신규 npm 0, 점수 계산식·데이터 무변경, 투자 조언성 표현 신규 0.

## 2026-06-26 · 상용화 고도화 2-B §8 개인화 대시보드·저장 필터·관심종목 UX (Task 44, Claude)

### 목표
- 설계서 2(`ornscore_commercialization_upgrade_spec.md`) **§8 개인화 대시보드 고도화**(8.1 내 대시보드 위젯·8.2 관심 종목·8.3 저장 필터)와 **§12 리텐션 기능**을 기존 로컬 저장(localStorage/Supabase) 구조 안에서 **재방문 개인화 출발점**으로 끌어올림. 계정/서버 스키마가 필요한 큰 위젯은 무리하지 않고 명확한 빈 상태 + 후속 범위로 분리. branch `ai-center/task-44-ornscore-2-b-ux`. 시작 HEAD `45131a4`(작업트리 클린) 위에 쌓음 — **리셋/pull/머지/push 없이** 로컬 수정·검증·커밋까지만. AI Center 4310·미리보기 3000 무중단. 로컬 검증 prod `127.0.0.1:**3391**`(내 리스너 node PID 22016만 taskkill). 점수 계산식·`stocks.json`·`backtest-result.json`·`direction` **무변경**(표시 파생만), 신규 npm 0, 투자 조언성 표현 신규 생성 0(후보·탐색·확인·참고 정보·매수·매도 추천 아님 유지). **§8.3 저장 필터 자체·조건 알림은 #36에서 이미 구현 → 재구축 안 함**, /watchlist 화면에서 가치를 보이게만.

### 완료한 작업 (수정 2파일, 표시 파생·문구만)
- **`src/components/WatchlistClient.tsx`**:
  - **(현황 요약) "내 현황" strip 신설**(맨 위, §8.1 위젯 의도): 클라이언트에 이미 있는 3개 카운트(관심 종목 N · 최근 본 종목 N · 저장한 필터 N) + **관심 종목 변화 요약**(이미 전달받는 `tickerToDelta`에서 파생 — "점수 오른 종목 M · 내린 종목 K · 변동 없음 J", 중립 표현, 매수·매도/추천 문구 없음, "참고 정보이며 매수·매도 추천이 아닙니다" 캡션). **세 영역이 모두 비면** strip이 단일 "재방문 개인 출발점" 온보딩 1줄로 collapse. 390px 가드(`flex-wrap`·`min-w-[90px]`·`break-words`·`break-keep`·`tabular-nums`).
  - **(저장한 필터) 신규 섹션**: `listSavedSearches()` 구독(`saved-searches-changed`·`storage`), 각 저장 필터마다 `matchConfig.ts`의 `matchesConfig`로 `matchPool` 대비 **실시간 충족 수**("현재 조건 충족 N개", 참여/탐색 프레이밍) 계산 + 짧은 자연어 조건 요약(`describeConfig`). 행은 `/stocks`로 링크(전체 config 자동 적용은 기존 라우팅에 없어 후속으로 문서화). **빈 상태**는 저장 필터의 가치를 평이하게 설명("자주 쓰는 조건을 저장해 매번 다시 설정하지 않고 한 번에 불러와요. … 로그인하면 여러 기기에서 같은 필터를 씁니다.") + `/stocks` CTA.
  - **(정보 구조) 섹션 순서 재정렬**: 현황 요약 → 관심 종목 → **저장한 필터** → 최근 본 종목. 각 빈 상태가 다음 구체적 행동(종목 탐색/조건 만들기/종목 열기)을 명시. 기존 관심 종목 행·간단/분석 보기 토글·신호 배지·최근 본 종목 로직 보존.
- **`src/app/watchlist/page.tsx`**: 저장 필터 충족 수 계산용 `matchPool: StockForMatch[]`를 **알림 cron(`evaluate-alerts/route.ts`)과 동일한 매핑**으로 `realStockPool`에서 만들어 `WatchlistClient`에 전달(`per/pbr/roe/dividendYield/eps/score/marketCap/market/themes`). 기존 `allStocks`(경량 StockInfo)·신호·델타·로그인 분기 보존. 신규 데이터 소스 0(`getAllStocks`/`realStockPool`/`compositeOf` 재사용).
  - **계획 대비**: 플래너는 `getAllStocks()`에서 매치 필드를 뽑는다 했으나 `MockStock`에 `eps`/`market`이 없어 tsc 실패 → 그 두 필드를 가진 `RealStock`(`realStockPool`)로 매핑(cron과 동일). matchesConfig의 `excludeLoss`(eps)·`market` 분기가 정확히 동작.

### 테스트 결과
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·SSG 138p(`/watchlist` 8.29 kB), exit 0
- 변경 2파일 금지표현(강력 매수/급등 예상/목표가/손절가/진입 시점/매수 후보/AI 픽/수익 보장/따라 사기/오늘 살 종목 등) grep = 0(유일 매치는 부정문 고지 "매수·매도 추천이 **아닙니다**" 2곳).
- 로컬 prod(3391, 내 리스너 PID 22016만 taskkill·4310·3000 무중단): `/watchlist`·`/stocks` HTTP 200·에러 마커 0(유일 매치는 React `suppressHydrationWarning` 정상 prop). 새 섹션은 클라 렌더라 SSR HTML 대신 빌드 청크(`.next/static/chunks/app/watchlist/page-*.js`)에 신규 문자열 포함 확인("내 현황"·"저장한 필터"·"현재 조건 충족"·"관심 종목 변화"·"종목 탐색에서 조건 만들기"; 온보딩 문구는 "다시 방문했을 때 … 개인 출발점"으로 동등 표현).

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → 자동 DESKTOP/390px 게이트 로컬 미가용(curl+SSR grep+빌드 청크 grep+build 대체, 픽셀 단위 미보장). **운영자: http://127.0.0.1:3000 재빌드·재기동 후 데스크톱/390px로 `/watchlist` 확인 권장** — 현황 strip 카운트 3칸 줄바꿈·관심 변화 요약 줄바꿈·저장 필터 카드 충족 수/조건 요약·빈 상태(관심/저장/최근 각각)·가로 오버플로우 0·콘솔 0.

### 결정 / 잔여 리스크 / 다음(후속 범위 — 계정/서버 스키마 결정 필요, 이번 미구현)
- **§8.1 서버 백엔드 위젯**(관심종목 공시·알림 위젯·업종별 Top5·거래활성도 급증 위젯·오늘의 요약 리포트), **§8.2 관심종목 그룹 분류·CSV 다운로드**, **§8.4 분석 메모(종목별 개인 메모)**, **최근 본 종목 기기 간 동기화**는 계정/서버 스키마 결정이 필요해 **후속 범위**로 분리(`docs/ornscore-spec-coverage.md` §8 행 교차참조).
- **저장 필터 충족 수는 비로그인 시 클라/로컬 기준**(localStorage 저장 필터 × 현재 점수 풀). 저장 필터 행 클릭 시 **전체 config 자동 적용 라우팅은 미구현** — 현재는 `/stocks`로만 이동(StocksExplorer가 저장 목록을 직접 노출). URL 파라미터 기반 자동 적용은 후속.
- 원격 갱신·main 머지·외부 릴리스는 범위 밖(운영자).

---

## 2026-06-26 · 상용화 고도화 §5 점수 산출 근거·설명 레이어 강화 (Task 43, Claude)

### 목표
- 설계서 2(`ornscore_commercialization_upgrade_spec.md`) **§5 점수 산출 근거 고도화**(§5.1 종합 점수 근거 보기·§5.2 지표별 상세 설명) 중심. 사용자가 종목 상세에서 "왜 이 점수가 나왔는지"를 더 쉽게 이해하도록 **종합 점수 근거 레이어**를 추가. branch `ai-center/task-43-ornscore-2-a`. 시작 HEAD `993551c`(작업트리 클린) 위에 쌓음 — **리셋/pull/머지/push 없이** 로컬 수정·검증·커밋까지만. AI Center 4310[PID 11160]·미리보기 3000 무중단. 로컬 검증 prod `127.0.0.1:**3344**`(내 리스너 node PID 27972만 taskkill). 점수 계산식(`score.ts`/`metrics.ts`/`sector.ts`)·`stocks.json`·`backtest-result.json`·`direction` **무변경**(표시 파생만), 신규 npm 0, 투자 조언성 표현 신규 생성 0(후보·탐색·확인·참고 정보·매수·매도 추천 아님 유지).

### 완료한 작업 (신규 2파일 + 수정 4파일, 표시 파생·문구만)
- **신규 `src/lib/scoreBasis.ts`(순수 함수)**: 4지표 점수 + 실데이터(`returns`·`flowStats`·`per/pbr/roe`·`sectorValueScore`·`volStats`) → `{ composite, parts[] }` 근거 구조로 변환. 각 part = `{ label, kind, score, weightPct:25, contributionPts: round(score*0.25), rank, topPct, total, factors[], reading, missingNote?, extraNote? }`. 규칙: **추세** = `returns.r1m/r3m/r6m` 중 존재하는 값만 "+x.x%" factor(전무 시 missingNote); **거래활성도** = `flowStats.ratio`(5일/20일 평균 거래대금 비율) factor "x.xx배 · 거래 늘어남/비슷/줄어듦"(실데이터, 결측 시 missingNote); **밸류** = PER·PBR·ROE + 업종 상대(`sectorValue.score>=0`일 때만, 표본<4면 extraNote "추후 데이터 축적 후 제공"); **위험조정** = 연환산변동성·최대낙폭·Sharpe 중 존재하는 값만. 강점/주의 문구는 `metricReadings.ts`의 `Reading`(meaning/action/tone)을 **재사용**(중복 정의 0). composite는 `compositeOf`(4지표 단순평균) 재사용 — 계산식 무변경.
  - **계획 대비 개선**: 플래너는 거래활성도 원시 거래대금 필드 부재로 missingNote 처리를 가정했으나, `stocks.json`의 `flowStats.ratio`가 **138종목 전부 채워져 있고**(0.14~2.81) 점수 산식의 실제 입력(ScoreTooltip "5일 거래량 ÷ 20일 평균"과 일치)임을 확인 → **지어내지 않고 실데이터 ratio를 factor로 정직하게 노출**(missingNote는 결측 시 graceful 폴백으로 유지).
- **신규 `src/components/stock/ScoreBasisBreakdown.tsx`(서버)**: 상단 "종합 N점 = 추세·거래활성도·밸류·위험조정 4지표 동일 가중(각 25%) 평균" 설명 + **점수≠순위 1줄(카드 내 1곳만)** + 지표별 행(점수/100·`scoreColor.ts` 구간색 막대·"종합 기여 ≈ N점(가중 25%)"·전체 상대순위·상위/하위%·근거 factor 칩·강점/주의 1줄, factors 없으면 missingNote 중립 회색). 하단 고지("매수·매도 추천이 아닌 탐색 우선순위" + 지표 가이드 링크). 신규 npm 0(순수 HTML/Tailwind). 반응형: `grid-cols-1 sm:grid-cols-2`·`flex-wrap`·`tabular-nums`·`min-w-0`/`break-words`(390px 가드).
- **`src/app/stock/[ticker]/page.tsx`**: "점수 근거" 탭의 단순 "점수는 어떻게 나오나요?" 카드를 `ScoreBasisBreakdown`으로 **대체**. `buildScoreBasis`에 이미 계산된 `rankOf/topPctOf`·`sectorValue`·`s.returns`·`vs`(volStats)·`s.flowStats` 전달. `dataWarnings` 경고·`ScoreHistoryChart`·`StockEventTimeline`·`AiAnalysisCard` 보존. 미사용된 `ScoreTooltip` import 제거.
- **`src/lib/mockData.ts`**: `MockStock`에 `flowStats?`(returns·volStats와 동일하게 옵셔널) 타입 추가 — `s.flowStats` 타입 안전 접근용(런타임값은 `realStockPool`이 이미 제공).
- **`src/components/ScoreHistoryChart.tsx`(작업범위 3)**: 빈 상태 문구를 "점수 변화 이력은 매일 자동 기록되며 아직 데이터가 충분히 쌓이지 않았습니다 · 추후 축적 후 제공 · 10회 이상 모이면 추세 그래프"로 명확히 분리. 데이터 있는 경우 로직·산식 무변경(현재값=`currentScore` 권위값, 이전=재계산 유지).
- **`src/app/guide/metrics/page.tsx`**: "읽기 전 검토 포인트" 박스(재사용)에 **"종합점수 = 4지표 각 25% 동일 가중 평균"** 1항목 추가(한 지표만 높아도 종합은 중간대·점수 근거 보기 안내). 기존 점수≠순위·밸류 기준 항목 보존. 신규 자문 표현 0.

### 테스트 결과
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·SSG 138p(`/stock/[ticker]` 14.1 kB), exit 0
- 변경 6파일 금지표현(강력 매수/급등 예상/목표가/손절가/진입 시점/따라 사기/AI 픽/매수 후보/수익 보장/매수·매도 추천 등) grep = 0(유일 매치는 부정문 고지 "매수·매도 추천이 **아닌** 탐색 우선순위").
- 로컬 prod(3344, 내 리스너 PID 27972만 taskkill·4310[PID 11160]·3000 무중단): `/stock/005380`·`/stock/032830`·`/guide/metrics` HTTP 200·에러 마커(Application error/Hydration/TypeError/ReferenceError/cannot read/Unhandled) 0. SSR 렌더 확인: "종합 점수 근거 보기"·"4지표를 동일 가중(각 25%)"·"종합 기여 ≈"·1/3/6개월 수익률·"최근 5일/20일 평균 거래대금 0.88배 · 거래 줄어듦"(005380 실데이터)·연환산 변동성·"점수와 순위는 다릅니다"·"매수·매도 추천이 아닌 탐색 우선순위", 가이드 "4지표를 각각 25%씩 동일 가중". **데이터 결측/저표본 정직 표현 확인**: 030200(통신·피어<4)에 "업종 내 상대 밸류는 추후 데이터 축적 후 제공" 렌더.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → 실제 브라우저 자동 DESKTOP/390px 게이트 로컬 미가용(curl+SSR grep+build 대체, 픽셀 단위 미보장). **운영자: http://127.0.0.1:3000 재빌드·재기동 후 데스크톱/390px로 `/stock/*` 점수 근거 탭 확인 권장** — 근거 카드 2열↔1열·factor 칩 줄바꿈·기여/순위 줄·강점/주의·결측 안내(030200)·가로 오버플로우 0·콘솔 0.

### 결정 / 잔여 리스크 / 다음
- **§5.3 점수 변화 히스토리(시계열 축적)·§5.4 점수 급변 알림 라이브화는 ④ 후속**: cron 골격(`scoreHistory.ts`·`conditionAlerts.ts`) 존재하나 장기 시계열 데이터 축적·급변 사유 자동화·메일 발송 라이브는 운영 결정·데이터 필요. 이번엔 빈 상태/결측을 정직하게 분리 표시만.
- **거래활성도 원시 거래대금 절대값(원 단위)은 미노출**: `flowStats.recent5dAvg/recent20dAvg`의 단위가 데이터상 명확하지 않아 오해 방지 위해 단위-독립 ratio(배수)만 factor로 노출. 절대 거래대금 표기는 단위 확정 후 후속.
- 원격 갱신·main 머지·외부 릴리스는 범위 밖(운영자).

---

## 2026-06-26 · 설계서 전체 커버리지 감사 — 추적 문서·남은 백로그 우선순위 (Task 42, Claude)

### 목표
- 사용자가 준 **7개 설계서**(1차 안정화·상용화 고도화·데이터 신뢰 배지·디자인 개선·홈 개편·종목 상세 결론 카드·종목 탐색 필터)를 전수 정독하고, 현재 코드와 기존 큐 작업 #14~#41 결과를 대조해 **한 문서에서 추적**. branch `ai-center/task-42-ornscore`. 시작 HEAD `e9c3dad`(작업트리 클린) 위에 쌓음 — 리셋/pull/머지/push 없이 로컬 수정·검증·커밋까지만. AI Center 4310·미리보기 3000 무중단. **문서 작업이 주 목적** — 앱 UI 무변경(작은 오탈자 외). 점수 계산식·`stocks.json`·`backtest-result.json`·`direction` 무변경, 신규 npm 0, 투자 조언성 표현 신규 생성 0.

### 완료한 작업 (문서 1파일 신규)
- **신규 `docs/ornscore-spec-coverage.md`**: 7개 설계서 전 항목을 5개 상태(①완료됨 ②#38~#41 처리 ③남음·소 ④큰 제품 의사결정 ⑤사람/법무/사업)로 분류한 추적 표. 각 행에 코드 경로·작업 번호·근거 문서 인용. 소유자([개발]/[제품]/[법무·사업]) 표기. `ornscore-improvement-brief.md`·`data-source-commercial-risk.md`·`legal-ai-commercial-readiness.md`·`monetization-strategy.md` 교차링크.
- **설계서 원문 확보 발견**: 7개 .md 모두 데스크톱에 존재 → 이번에 전수 정독(과거 #33~#37의 "PART D~P 원문 미확보"는 당시 PDF만 있던 상태였음을 메모로 정정). 레포 내부엔 없어 커밋 대상 아님.
- **핵심 대조 결과**: 1차 안정화(설계서 1)·홈(5)·상세 결론 카드(6)·데이터 신뢰(3)·디자인 Phase 1~7(4)·탐색 필터(7) 핵심은 #14~#41에서 대부분 ① 완료 → 중복 구현 금지. 남은 고도화는 대부분 **설계서 2(상용화 고도화)** — 관리자 시스템·결제·알림 라이브·커버리지 확대·공시 전체 기간 파이프라인 등 큰 작업(④)과 법무 판단(⑤).
- **다음 큐 제안(③/④/⑤만)**: A절(③, 손 작음·체감 큼) 우선 — ①탐색 필터 감각화 마감(질문형 프리셋 카드화·조건 요약 자연어·예상 결과 수) ②데이터 신뢰 배지 마감(5단계 라벨·인라인 TrustBar) ③산식 버전 불일치 빌드 게이트 ④오류 신고 진입점 확대 ⑤로딩 스켈레톤 ⑥압축 보기·모바일 바텀시트. B절(④, 큰 결정) — 공시 전체 기간 수집·KRX 공식 업종코드·관리자 상태판+신고 저장소·점수 히스토리 라이브·생존편향·커버리지·Premium 결제. C절(⑤) — 데이터 소스 약관·결제 약관·실 브라우저 모바일 게이트.

### 테스트 결과
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·SSG 138p, exit 0
- 신규 문서 금지표현(매수 추천/강력 매수/급등 예상/목표가/손절가/진입 시점/AI 픽/따라 사기/수익 보장/매수 후보 등) grep = 0("매수·매도 추천 아님"은 부정문 고지).
- **로컬 서버 렌더 체크 생략**: 화면 변경 0(문서 1파일만) — 보조 포트 미기동(AI Center 4310·미리보기 3000 무중단).

### 결정 / 잔여 리스크 / 다음
- 문서 추적이 주 목적이라 앱 UI 무변경. 다음 자동화 큐는 커버리지 문서 A절(③) 권장.
- 7개 설계서 원문은 데스크톱 로컬에만 존재 — 레포 추적은 `ornscore-spec-coverage.md`가 대행. 원문을 레포에 보존할지는 운영자 결정.
- 원격 갱신·main 머지·외부 릴리스는 범위 밖(운영자).

---

## 2026-06-25 · 1차 상용화 안정화 후속 D — 비교 최근 본 종목·공시 범위 고지·업종 밸류 한계 표시 (Task 41, Claude)

### 목표
- ORNSCORE 1차 안정화 잔여 후속(작업범위 D). 신규 기능을 크게 늘리지 않고 **상용화 전 눈에 보이는 불안 요소·확인 공백**을 줄임 — (2) 비교 시작 화면 빈 느낌 보강, (3) 공시 안내가 전체 기간처럼 오해되지 않게 수집 범위·한계 명확화, (4) 업종 밸류는 동종 비교 충분할 때만 강하게, 부족하면 제한 안내. branch `ai-center/task-41-ornscore-1-d-ux`. 시작 HEAD `a18dad1`(= Task 33~40 위에 쌓인 상태), 작업트리 클린 확인 후 **리셋/pull/머지/push 없이** 로컬 수정·검증·커밋까지만. AI Center 4310[PID 6008]·미리보기 3000 무중단. 점수 계산식(`sectorValueScore` 등)·`stocks.json`·`backtest-result.json`·`direction` **무변경**, 신규 npm 0, 투자 조언성 표현 신규 생성 0(후보·탐색·확인·참고 정보·매수·매도 추천 아님 유지).

### 완료한 작업 (작업범위 D 2~5)
- **(2) 비교 시작 화면 — 실제 "최근 본 종목" 노출(가짜 데이터 없음)**: 신규 `src/lib/recentViews.ts` — `RecentViewTracker`가 기록한 `ornscore_recent_views`(레거시 `valuemap_recent_views` 폴백)를 SSR-safe하게 읽는 `getRecentViews()` 단일 소스 추출. `WatchlistClient.tsx`의 인라인 `readRecent()`를 이 리더로 교체(동작 바이트 동일, `RecentView` 타입도 공유). `CompareClient.tsx` 시작 화면(`stocks.length < 2`)에 **"최근 본 종목에서 추가"** 섹션을 첫 추가 경로로 신설 — `getRecentViews()` 로드→`stockMap`으로 이름 매핑(풀에 없는 종목 제외)→이미 담은 종목 제외→실제 기록이 1개 이상일 때만 렌더(가짜/플레이스홀더 칩 없음). `recent-views-changed`·`storage` 이벤트 구독으로 갱신. 칩은 기존 패턴(44px 터치, `+ {name}` → `addToCompare`). 섹션 순서: 최근 본 → 추천 세트 → 오늘 Top5 → 관심 → 검색 → 업종. `compare.ts`·관심 목록·점수 계산 무변경.
- **(3) 종목 상세 공시 수집 범위 고지** `src/components/StockDisclosures.tsx`: `?days=90&limit=20`으로 가져와 `slice(0,10)` 표시하면서 헤더는 "최근 90일 · 공시 N건 · 신호 N건"만 보였음 → **상시 노출 캡션** 추가("최근 90일 내 최신 공시 일부입니다(최대 20건 수집 · 10건 표시) · 전체 공시 이력이 아닙니다."). 중립·비-valence 톤, 빈 상태 안내 보존. API 라우트·`direction`·카운트 무변경.
- **(4) 업종 밸류 한계 가시화** `src/app/stock/[ticker]/page.tsx`(`sectorValue.score >= 0` 분기): 동종 비교 표본이 **10개 미만이면 강조(큰 cyan 숫자) 대신 중립 zinc 톤**으로 낮추고 **"표본 작음 · 참고만"** 캡션 노출 — 얇은 표본이 강해 보이지 않게. 표본 충분(peers ≥ 10)이면 기존 cyan 강조 유지. 임계/문구는 `dataStatus.knownLimits`("밸류 업종 기준")와 정렬. `sectorValueScore` 산식·`peers<4` "표본 부족" 분기(else, 미제공) 로직 무변경 — 표시/문구만.
- **(5) 큰 데이터 작업은 후속으로 분리**: 데이터 파이프라인 확장·새 수집 범위 시도 0. 아래 "결정/잔여 리스크"에 명시.

### 테스트 결과
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·SSG 138p(`/stock/[ticker]` 14.1 kB), exit 0
- 변경 5파일(recentViews.ts·CompareClient·WatchlistClient·StockDisclosures·stock/[ticker]/page) 금지표현(매수 추천/강력 매수/급등 예상/목표가/손절가/진입 시점/따라 사기/AI 픽/AI 추천/매수 후보/수익 보장 등) grep = 0.
- 로컬 prod(127.0.0.1:**3277**, 내 리스너 node PID 30636만 taskkill·AI Center 4310[PID 6008] 무중단·3000 운영자 미기동 상태 그대로): `/compare`·`/disclosures`·`/stock/005380`·`/stock/032830`·`/watchlist` HTTP 200·에러 마커(Application error/Hydration/TypeError/ReferenceError/cannot read/Unhandled) 0. SSR: **`/stock/005380`(자동차, 피어<10)에 "표본 작음 · 참고만" 중립 톤 렌더**, **`/stock/032830`(보험, 피어≥10)은 cyan 강조 유지**(두 분기 모두 확인). `/compare` 최근 본 종목·`/disclosures` 캡션은 클라이언트 렌더라 SSR HTML 대신 빌드 청크(`app/compare/page-*.js`·`app/stock/[ticker]/page-*.js`)에 신규 문자열 포함 확인.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → 실제 브라우저 자동 DESKTOP/390px 게이트 로컬 미가용(curl+SSR grep+빌드 청크 grep+build 대체, 픽셀 단위 미보장). `/compare` 시작 화면 본문·최근 본 종목 칩과 `/disclosures`·종목 상세 공시 캡션은 클라 렌더라 SSR HTML에 안 보임(소스+빌드 청크로 확인). **운영자: http://127.0.0.1:3000 재빌드·재기동 후 데스크톱/390px로 확인 권장** — `/compare` 시작 화면 최근 본 종목 칩(줄바꿈·44px·실제 기록 있을 때만 노출)·`/stock` 공시 범위 캡션·업종 밸류 저표본 중립 톤, 가로 오버플로우 0·콘솔 0.

### 결정 / 잔여 리스크 / 다음(후속 큰 데이터 작업 — 이번 작업 범위 밖, 미시도)
- **KRX 공식 업종코드 매핑**: 업종 밸류 피어 표본 확대(현재 테마 기반 휴리스틱이라 자동차 등 일부 업종은 피어<10으로 "참고만"). 공식 코드 연동 시 강조 표시 가능 종목이 늘어남.
- **공시 전체 기간 수집**: 현재 종목 상세는 최근 90일·최대 20건 수집/10건 표시, /disclosures는 최신 200건 상한. 전체 기간 DART 수집·저장은 별도 파이프라인 필요(후속).
- **최근 본 종목 기기 간 동기화**: 현재 localStorage 기반(기기/브라우저 로컬). 로그인 계정 기준 크로스 디바이스 동기화는 후속.
- 이번 작업에서 데이터 파이프라인 확장은 **시도하지 않음**(설계서 작업범위 D 5항 지침). 원격 갱신·main 머지·외부 릴리스는 범위 밖(운영자).

---

## 2026-06-25 · 1차 상용화 안정화 후속 C — /status 운영 상태판 보강(알려진 제한·자동 점검·오류 신고 단일화) (Task 40, Claude)

### 목표
- ORNSCORE 1차 안정화 잔여 후속(작업범위 C). 신규 기능 추가가 아니라 **상용화 전 운영자가 /status만 봐도 현재 데이터·산식·제한·오류 신고 흐름을 이해**할 수 있게 보강하고, **사용자 오류 신고 진입점을 더 명확히**. branch `ai-center/task-40-ornscore-1-c-mvp`. 공개 기준 HEAD `a561e45`(= Task 33~39 머지 상태) 위에 쌓음 — **리셋/pull/머지/push 없이** 로컬 수정·검증·커밋까지만(작업트리 클린). AI Center 4310·미리보기 3000 무중단. 점수 계산식·`stocks.json`·`backtest-result.json`·`direction` **무변경**, 신규 npm 0, 사실과 다른 확정 표현·투자 조언성 표현 신규 생성 0.

### 완료한 작업 (작업범위 C 1~5)
- **(단일 소스 확장) `src/lib/dataStatus.ts`**: 사실만 추가, 새 자문 문구 0.
  - `knownLimits: {title, detail}[]` — 이미 문서화된 제한 5종 정리(공시 최신 200건·백테스트 시뮬레이션/생존편향 미해결·밸류 업종 표본 부족 시 전체 풀 기준·업종 분류 KRX 공식코드 아닌 휴리스틱·검증 보류(suspect) Top 제외). 공시·백테스트 문구는 기존 `limits.disclosure`/`limits.backtest`를 모듈 상수(`LIMIT_DISCLOSURE`/`LIMIT_BACKTEST`)로 빼 **재사용**(중복 0).
  - `selfCheck` — `realStockPool`에서 **실측**(런타임 날조 없음): 검증 보류 종목 수(`isSuspect`), PER·PBR 결측 종목 수(`missingFinancials` 재사용), 산식 버전 일치 여부(`metricsVersion === EXPECTED_METRICS_VERSION`). "최근 자동 점검"이 앱 내부 실제 값을 반영.
  - `reportEmail`·`dataIssueReportFields`(종목·코드 / 항목 / 이상한 값·기대값 / 화면 URL / 연락 방법)·`buildDataIssueMailto({subject?, prefill})` 헬퍼 — 모든 신고 진입점이 같은 메일 주소·본문·기준일/산식 prefill을 공유. 본문은 실제 `\n` 줄바꿈.
- **(2) `src/app/status/page.tsx` 재구성**: 스냅샷에 "점수 계산 시각"·공시=라이브 조회 설명·**산식 버전 일치 여부 라인**(selfCheck) 추가. **알려진 제한** 섹션(knownLimits 렌더)·**최근 자동 점검 요약** 섹션(검증 보류 N·결측 N·산식 일치, 점검 이력 보관/관리자 대시보드/수동 재수집은 후속 과제 캡션) 신설. 기존 도메인별 상태·데이터 소스 보존.
- **(4) 오류 신고 흐름·진입점** 새 재사용 서버 컴포넌트 `src/components/status/ReportDataIssue.tsx`: 44px mailto 버튼 + **화면에 보이는 "신고 시 포함할 정보" 체크리스트**(메일 클라이언트 안 열어도 무엇을 적을지 보임). `/status#report` 단일 canonical 목적지. `/about` "데이터 오류" 문의를 `/status#report`로 안내, 푸터(`layout.tsx`)에 "오류 신고" 링크 추가.
- **(5) 모바일 가독성**: 길어진 /status 상단에 인페이지 목차(앵커 칩, JS 없음) 추가, 각 섹션 `scroll-mt-20`·`break-words`로 줄바꿈/넘침 가드. 기존 반응형 그리드(`grid-cols-2 md:grid-cols-*`)·44px 터치 유지.
- **(3) 후속 분리**: 별도 영속 저장 구조(오류 신고 DB·관리자 대시보드·수동 재수집 트리거)는 이번에 만들지 않고 화면 캡션 + PROGRESS·AI_HANDOFF에 후속 과제로 명시(설계서 §3.3-6/7·§45/46, `docs/legal-ai-commercial-readiness.md` 교차링크).

### 테스트 결과
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·SSG 138p·`/status` 프리렌더, exit 0
- 변경 5파일 금지표현(매수 추천/강력 매수/급등 예상/목표가/손절가/진입 시점/따라 사기/AI 픽/AI 추천/매수 후보/수익 보장 등) grep = 0.
- 로컬 prod(127.0.0.1:**3262**, 내 리스너 node PID 26360만 taskkill·AI Center 4310[PID 6008] 무중단·3000 운영자 미기동 상태 그대로): `/status`·`/about` HTTP 200·에러 마커(Application error/Hydration/TypeError/ReferenceError/cannot read) 0. SSR: `/status`에 "알려진 제한"·"최근 자동 점검 요약"·체크리스트(종목명·코드/이상한 값과 기대값/발견 화면 URL/연락 방법)·`id="report"`·검증 보류 종목·산식 버전 일치 렌더, mailto 본문 인코딩 줄바꿈(%0A) 확인. `/about`에 "데이터 상태 페이지의 오류 신고" 링크 렌더.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → 실제 브라우저 자동 DESKTOP/390px 게이트 로컬 미가용(curl+SSR grep+build 대체, 픽셀 단위 미보장). **운영자: http://127.0.0.1:3000 재빌드·재기동 후 데스크톱/390px로 `/status` 확인 권장** — 인페이지 목차 칩 줄바꿈·알려진 제한/자동 점검 카드 2열↔3열·오류 신고 체크리스트·44px 버튼·가로 오버플로우 0·콘솔 0.

### 결정 / 잔여 리스크 / 다음
- **오류 신고는 현재 메일 전용**(영속 저장 추가 안 함). **후속 분리**: 오류 신고 저장소 + 관리자 대시보드 + 수동 재수집 트리거(설계서 §3.3-6/7·§45/46). `selfCheck`는 배포 시점 스냅샷(점검 이력 보관 없음) — 시계열 보관도 후속.
- 원격 갱신·main 머지·외부 릴리스는 범위 밖(운영자).

---

## 2026-06-25 · 1차 상용화 안정화 후속 B — 데이터 소스 리스크 체크리스트(법무/개발 분리·갱신 경로 정리) (Task 39, Claude)

### 목표
- ORNSCORE 1차 안정화 잔여 후속(작업범위 B). 데이터 출처 관련 남은 리스크를 **한 문서에서 추적 가능**하게 정리하고, **최종 법무 판단 항목과 개발자 처리 항목을 분리**. 신규 기능·데이터 구조 변경 아님. branch `ai-center/task-39-ornscore-1-b`. 점수 계산식·`stocks.json`·`backtest-result.json`·`direction` **무변경**, 신규 npm 0, 사실과 다른 확정 표현 신규 생성 0.
- **시작 상태 메모**: HEAD는 공개 기준 `a561e45`(= Task 33~38 위에 쌓인 상태), 작업트리 클린 확인 후 **리셋/pull/머지/push 없이** 로컬 수정·검증·커밋까지만. AI Center 4310·미리보기 3000 무중단.

### 완료한 작업 (작업범위 B 1~5) — 문서 1파일만 수정
- **`docs/data-source-commercial-risk.md` 재구성**(코드/데이터 동작 무변경, 문서 편집만): 리드를 "초안 · 법적 결론 미확정"으로 유지하고 마지막 정리를 `2026-06-25 (AI Center task 39, 후속 B)`로 갱신. 설계서 작업범위 4항의 4개 절을 명시 라벨로 추가/재구성:
  - **(A) 현재 표시 데이터의 출처와 갱신 경로**: 사용자에게 보이는 데이터별로 (i) 표시 위치(`/status` `sources[]`·`DATA_SOURCES`·`domainStatuses`), (ii) 실제 생성·갱신 경로, (iii) 표기 정합성 확인 필요를 표로. 가격·지표 = FinanceDataReader(`daily-data.yml`→`fetch_prices.py`→`sync_prices_to_stocks.py`→`compute_metrics.py`→`verify_metrics.py` 게이트→봇 commit→Vercel), GitHub Actions cron `0 8 * * 1-5`(17:00 KST 평일)+수동 `workflow_dispatch`; 현재가 = 네이버 지연 시세 라이브; 공시 = DART Open API 라이브(샘플 폴백); 점수 변화 = Supabase cron.
  - **(B) 사람(법무) 검토 약관/라이선스**: KRX·DART·Naver·yfinance·FinanceDataReader별 법적 질문·공식 문서 위치를 적고 결론은 **확인 필요**, 소유자 **[법무] 판단**.
  - **(C) 대체 출처 후보와 전환 작업**: Naver·yfinance 우선으로 대체 후보·구체적 개발 작업(어느 스크립트·`DATA_SOURCES`·`domainStatuses` 수정·fallback·출처 표기), 소유자 **[개발]**.
  - **(D) 결제 전 고지/약관 확정 문구**: `legal-ai-commercial-readiness.md` 교차링크, 중복 없이 데이터 출처 한정 고지 후보만 **초안**(지연·참고용·제3자 출처·재배포 제한 가능), 출시 전 법무 확정.
- **추적 가능 체크리스트(설계서 §41 필수 조치)**: 출처별 약관 확인/상용 가능 여부/비공식 수집 의존도/fallback 구조/직전 정상 데이터 유지/관리자 수동 재수집/수집 실패 알림/소스 교체 가능 구조 — 각 항목에 **[법무]/[개발]** 소유자 + 상태(미착수/진행/확인 필요). 기존 "공통 조치 항목/미해결" 느슨한 절을 이 체크리스트로 대체.
- **코드↔표기 정합성 부록(후속 B 발견)**: 직전 표가 인용한 `scripts/run_real.py`는 **현재 저장소에 없음**; yfinance는 `fetch_prices.py`가 아니라 `fetch_stock_data.py`에 import; Naver 스크래핑은 `run_real.py`가 아니라 `fetch_stock_data.py`의 `fetch_naver()`(정규식 HTML 파싱, 일일 워크플로 미포함); `/status`("FinanceDataReader") vs `DATA_SOURCES`/`domainStatuses`("KRX") 명칭 불일치. **사실 오류 수준은 아니라 코드 미변경·확인 필요로 추적**.

### 화면 문구 (작업범위 B 5)
- **코드 변경 0**. `DATA_SOURCES`(KRX 등)·`/status`(FinanceDataReader)의 출처 명칭 차이는 *라벨 스타일* 불일치이며 *사실과 다른 진술*이 아님(FDR가 내부적으로 KRX 등을 끌어옴). 설계서 5항 지침대로 **코드 수정 대신 문서에 확인 필요로 기록**. 사실과 다른 확정 표현 신규 생성 0.

### 테스트 결과
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·SSG 통과, exit 0
- 변경 문서 금지표현 grep = 0(투자 조언성 표현 신규 생성 없음).
- **로컬 서버 렌더 체크 생략**: 화면 문구 변경이 없어(문서 1파일만 수정) 보조 포트 기동 불필요 — 시작하지 않음(AI Center 4310·미리보기 3000 무중단).

### 결정 / 잔여 리스크 / 다음
- **[법무 후속]** 출처별 약관 원문 대조(§B 결론 채우기)·Naver 비공식 수집 대체 결정·KRX 상용 시세 라이선스 비용/범위 — 최종 법무 판단 대기.
- **[개발 후속]** 앱 내 관리자 수동 재수집 트리거(현재 GitHub Actions `workflow_dispatch` 수동 버튼만)·워크플로 수집 실패 알림(현재 비-blocking)·출처 명칭 일원화(`/status`↔`DATA_SOURCES`).
- 원격 갱신·main 머지·외부 릴리스는 범위 밖(운영자).

---

## 2026-06-25 · 1차 상용화 안정화 후속 A — 데스크톱/390px 시각 QA 스윕 (Task 38, Claude)

### 목표
- ORNSCORE 1차 상용화 안정화 잔여 후속(작업범위 A). 신규 기능·데이터 구조 변경이 아니라 **1차 안정화(#33~#37) 이후 주요 화면을 실제 사용자 눈높이로 재확인**하고, 가로 넘침·버튼/배지 붙음·카드 붕괴·텍스트 겹침·콘솔/hydration 오류·링크 불가·투자 추천 오해 문구를 찾아 **작은 표시 수정으로 해결 가능한 것만** 고치는 것. branch `ai-center/task-38-ornscore-1-a-qa-ui`. 점수 계산식·`stocks.json`·`backtest-result.json`·`direction` 데이터 **무변경**, 신규 npm 0·빌드 단계 추가 0.
- **시작 상태 메모**: HEAD는 공개 기준 `a561e45`(= Task 33~37이 위에 쌓인 머지 상태), 작업트리 클린 확인 후 **리셋/pull/머지/push 없이** 로컬 QA만. 원격 갱신·공개 절차·브랜치 합치기는 범위 밖.

### 수행한 QA (작업범위 A 1~4)
- **검증 경로 12개 전수**: `/ /today /stocks /stock/005380 /stock/032830 /disclosures /backtest /compare /pricing /status /privacy /terms`. 두 상세 종목은 005380(현대차, composite 74.2)·032830(삼성생명, 82.8) — 둘 다 비-suspect 정상 경로.
- **렌더/콘솔 패스(curl+SSR grep)**: 12경로 전부 HTTP 200. SSR HTML에서 에러 마커(`Application error`/`Unhandled`/`Hydration failed`/`cannot read`/`TypeError`/`ReferenceError`) **0건**. 공통 마커(오른스코어·종합점수·백테스트·요금제·데이터 상태) 정상 노출. `/compare`는 `mounted` 게이트 클라 렌더라 본문은 flight 페이로드로 확인.
- **소스 인스펙션 패스(390px/데스크톱 레이아웃)**: Playwright 미구성이라 라우트별 page+핵심 컴포넌트를 읽어 알려진 390px 넘침·붙음 위험 지점을 점검 — `stock/StockHeader`(CTA 그룹), `PriorityScoreCard`(배지 pill), `stock/SectorComparison`(가로 막대 행), `DisclosureExplorer`(공시 카드 헤더/액션행), `today/page`(최근 변화 칩 4묶음), `status/page`(스냅샷·오류 신고), `pricing/page`(2티어 카드), `CompareClient`(ScrollX), 홈 `page`.
- **레이아웃 가드 전수 확인**: `<table>`은 전부 `overflow-x-auto` 래퍼 동반(미래퍼 0), 반응형 prefix 없는 밀집 고정 그리드(grid-cols ≥5) 0, 위험한 `whitespace-nowrap`(긴 한글 본문) 0(잔존 3건은 desktop-only AppHeader 출처표기·짧은 링크·ScoreBadge로 안전). CTA/배지/칩 행은 `flex-wrap`+`gap`+`break-words`+`min-w-0`로, 가로 스크롤 영역은 `overflow-x-auto md:overflow-visible`+`min-w-[…]`로 이미 가드됨.

### 결론 — 치명적 표시 오류 0, 코드 수정 없음
- 12경로 핵심 화면은 데스크톱/390px에서 가로 넘침·버튼/배지 붙음·카드 붕괴·텍스트 겹침·콘솔/hydration 오류·죽은 링크·새 투자 추천 오해 문구가 **발견되지 않음**. Task #33~#37에서 해당 화면들의 UI 기본기(번호 중복·CTA 그룹·배지 분리·점수≠순위·공시 카드 구조·메뉴 단순화·요금제 경계·법무 고지)를 이미 정리한 결과로, **작은 표시 수정으로 고칠 항목이 남아 있지 않아 코드 변경 0**. 없는 문제를 만들지 않기 위해 임의 수정은 하지 않음 — 이번 커밋은 QA 결과 문서화(이 항목·AI_HANDOFF).

### 테스트 결과 (전후 동일, 코드 무변경)
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·SSG 138p(`/stock/[ticker]` 14 kB·`/stocks` 14.2 kB), exit 0
- 로컬 prod(127.0.0.1:**3258**, 내 리스너 node PID 28512만 taskkill·AI Center 4310[PID 6008] 무중단·3000 운영자 미기동 상태 그대로): 검증 12경로 200·에러 마커 0.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → 실제 브라우저 자동 DESKTOP/390px MOBILE 게이트 로컬 미가용. curl+SSR grep+소스 인스펙션+build로 대체(소스 패스는 픽셀 단위 렌더를 보장하지 못함). **운영자: http://127.0.0.1:3000 재빌드·재기동 후 데스크톱/390px 브라우저로 12경로 육안 확인 권장** — 특히 `/today` 최근 변화 칩 줄바꿈·`/stock` 업종 비교 막대 가독성·`/stocks` 표형(데스크톱)↔카드형(모바일) 토글·`/disclosures` 공시 카드 액션행·`/compare` 시작 화면(클라 렌더)·요금제 2카드, 가로 오버플로우 0·콘솔 0 최종 확인.

### 잔여 리스크 / 다음(후속 과제로 남김 — 큰 항목)
- **실 브라우저 모바일 게이트 부재**: 소스 인스펙션은 클래스 가드만 확인 — 실제 폰트 메트릭·줄바꿈은 운영자 육안 게이트 필요(전 태스크 공통 한계).
- `/stocks` 11컬럼 점수 히트맵 표는 데스크톱 전용(`lg:block`)이라 태블릿 폭(768~1024px)에서 가로 스크롤 의존 — 의도된 동작이나 중간 폭 카드형 전환은 후속 검토 대상.
- `stock/SectorComparison` 행은 ≤360px(예: iPhone SE)에서 의도된 `overflow-x-auto` 가로 스크롤로 떨어짐 — 390px 이상은 무스크롤. 초협폭 2줄 레이아웃은 후속(현재 데이터/구조 변경 없이 불가, 범위 밖).
- 원격 갱신·main 머지·외부 릴리스는 범위 밖(운영자).

---

## 2026-06-25 · 1차 상용화 안정화 P2 — 데이터 소스 상용 리스크표·약관/개인정보/AI 고지 보강·관리자 QA 정리 (Task 37, Claude)

### 목표
- ORNSCORE 1차 상용화 안정화 P2(상용화 검토). 신규 기능이 아니라 **상용 이용 리스크 문서화·법무성 고지 보강·관리자 데이터 상태/오류 신고 가능 범위 점검·QA 최종 스윕**. branch `ai-center/task-37-ornscore-1-p2-ai-qa`. 점수 계산식·`stocks.json`·`backtest-result.json`·`direction` 데이터 **무변경**, 신규 npm 0·빌드 단계 추가 0.
- **시작 상태 메모**: HEAD는 기준 `533c6d2`가 아니라 `67defec`(= Task 33~36이 위에 쌓인 상태). 작업트리 클린 확인 후 **리셋하지 않고 그대로 이어서** 작업.
- **설계서 메모**: 외부 PDF PART L/M/N/O/P 원문은 레포에 없음 → 지어내지 않고 **작업지시 + `docs/ornscore-improvement-brief.md`** 기준으로만 작성. 법적 결론은 확정하지 않고 "검토 필요"로 표기.

### 완료한 작업 (작업범위 2~6)
- **(2) 데이터 소스 상용 이용 리스크 표** 신규 `docs/data-source-commercial-risk.md`: KRX·DART·Naver Finance·yfinance·FinanceDataReader 5소스를 **소스 / 현재 사용 위치(코드 경로) / 상용 리스크 / 공식 인터페이스 유무 / 대체·fallback 필요 / 조치 상태** 6열 표로 정리. 법적 결론 확정 금지 — 전 항목 "검토 필요"·"공식 인터페이스 확인"·"대체 검토"·"fallback 필요"로 실행 가능하게 표기. Naver(공식 API 부재 추정, 대체 우선순위 높음)·yfinance(비공식, fallback) 강조. "상용화 전 법무 검토 필요" 리드.
- **(3) 약관/개인정보/AI 고지 보강 항목** 신규 `docs/legal-ai-commercial-readiness.md`: (A) 약관 9항목(결제일·자동갱신·해지·환불·청약철회·결제 실패·요금제 변경·장애 보상·유료 기능 변경 가능성)을 **현재 상태 / 보강 문구 방향(초안) / 상용화 전 확정** 표로(결제 미라이브 명시). (B) 개인정보 국외 이전 **역할별 표**(인증/저장=Supabase 일본·호스팅=Vercel 미국·메일=Resend 미국·AI=Anthropic 미국·소셜=Kakao 국내). (C) AI 분석 고지 실행 전+결과 하단 문구안. 각 절 "초안 · 상용화 전 검토 필요" 리드.
- **(4) 화면 반영(비확정 초안)** 코드 4파일, 표시·고지 문구만:
  - `src/components/AiAnalysisCard.tsx`: **실행 전 고지 1줄** 버튼 위 추가("AI 분석은 입력 데이터를 Anthropic(미국)에 전달해 생성하는 참고 정보이며, 매수·매도 추천이 아닙니다."). 결과 하단 기존 고지 유지.
  - `src/app/privacy/page.tsx`: §5 위탁·§5-1 국외 이전 항목을 **역할 라벨**(인증·저장/호스팅/메일 발송/AI 처리/소셜 로그인 제공자)로 명시. §5-1에 역할별 이전 표(국가·항목·목적) 추가. 내용 보존, 거짓 확정 없음.
  - `src/app/terms/page.tsx`: **"유료 서비스 이용 (출시 예정 · 초안)"** 섹션 추가 — `/pricing` 링크, 결제주기/환불/청약철회/장애 보상은 상용화 전 확정 고지(amber 박스로 초안 명시, 구속력 있는 수치 없음).
  - 금칙어 목록 대조: 추가 문구는 부정문 고지("매수·매도 추천이 아닙니다")만 사용.
- **(5) 관리자 데이터 상태/오류 신고 점검** `src/app/status/page.tsx`: 기존 `domainStatuses`(가격/재무/공시/산식) 품질 항목은 이미 노출 중 → **"데이터 오류 신고" 섹션 추가**(종목·항목·기대값·화면 URL·데이터 기준일/산식 버전을 prefill한 mailto 링크, 44px 버튼). 전체 관리자 대시보드/오류 신고 관리 시스템은 **후속 과제로 명시**(가능 범위 vs 후속 과제 분리, 문서 링크).
- **(6) QA 최종 스윕**: 검증 라우트 전수 200·SSR 마커·금칙어 0 확인(아래). 남은 리스크 문서화.

### 테스트 결과
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·SSG 138p, `/status`·`/terms`·`/privacy` 프리렌더, exit 0
- 변경 4파일 + 신규 2문서 금지표현 grep = 0(terms 기존 §2 "수익 보장"은 "제공하지 않습니다" 부정문 고지로 보존, 이번 변경 아님).
- 로컬 prod(127.0.0.1:**3253**, 내 리스너 PID 7420만 taskkill·운영자 4310 무중단): 검증 라우트 `/ /status /pricing /guide/metrics /disclosures /backtest /terms /privacy` 전부 HTTP 200·에러 마커 0. SSR: `/status` "데이터 오류 신고하기", `/terms` "유료 서비스 이용 (출시 예정 · 초안)", `/privacy` "AI 처리 제공자" 렌더 확인.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → 자동 DESKTOP/MOBILE 게이트 로컬 미가용. curl+SSR grep+build 대체. 시작 시 포트 3000 미기동 상태(운영자 미실행) — 변경 안 함. **운영자: http://127.0.0.1:3000 재빌드·재기동 후 데스크톱/390px 체크 권장** — `/status` 오류 신고 버튼 44px·`/terms` 초안 박스·`/privacy` 역할 표 가로 오버플로우 0·콘솔 0.

### 결정 / 잔여 리스크 / 다음
- **설계서 PART L/M/N/O/P 원문 미확보** — 작업지시+brief 기준 문서화. 추출본 레포 반영 시 재대조.
- **결제 약관 미확정** — 결제(PG) 미라이브. 약관 9항목은 출시 전 법무 확정 필요(`docs/legal-ai-commercial-readiness.md` A항).
- **데이터 소스 법무 검토 미완** — `docs/data-source-commercial-risk.md`는 코드 사용 현황 기반 추정. 출처별 약관 원문 대조·Naver 대체·KRX 상용 라이선스는 미해결.
- **관리자 시스템** — 전체 데이터 상태판/오류 신고 관리 대시보드는 후속 과제(현재 메일 접수로 가능 범위 처리).
- 다음: 운영자 모바일 게이트, 결제 도입 시 약관 확정, 데이터 소스 약관 원문 검토, 외부 릴리스(범위 외).

---

## 2026-06-25 · 1차 상용화 안정화 P1-B — 비교 시작 화면·상단/모바일 메뉴 단순화·종목 탐색 검색 우선·요금제 경계 (Task 36, Claude)

### 목표
- ORNSCORE 1차 상용화 안정화 P1-B. 신규 기능이 아니라 **비교 빈 화면의 "시작 가능성"·메뉴 과밀 해소·탐색 첫 화면 단순화·무료/Pro 경계 명확화**. branch `ai-center/task-36-ornscore-1-p1-b`. 점수 계산식·`stocks.json`·`backtest-result.json`·`direction` 데이터 **무변경**, 신규 npm 0·빌드 단계 추가 0.
- **시작 상태 메모**: HEAD는 기준 `533c6d2`가 아니라 `b3070dd`(= Task 33~35가 위에 쌓인 상태) — P1-B는 그 위에 쌓으므로 **리셋하지 않고 그대로 이어서** 작업(작업트리 클린 확인).
- **설계서 메모**: 외부 PDF PART F/G/H/K 원문은 레포에 없음 → 지어내지 않고 **작업지시 2~5 + `docs/ornscore-improvement-brief.md`** 기준으로만 구현.

### 완료한 작업 (작업지시 2~5)
- **(2) 비교 시작 화면** `compare/page.tsx`+`CompareClient.tsx`:
  - 서버: `sectorOf(themes)`로 그룹핑해 **추천 비교 세트** 계산 — 검증 보류 제외·`compositeOf>0`인 종목을 업종별로 묶어 ≥2종목 업종만, 종합점수 상위 2~4종목, 피어 많은 업종 우선 상위 3세트(`recommendedSets` prop). 표본 부족 업종은 세트 생성 안 함(가짜 세트 금지). 기존 `top5`/`stockMap` 보존.
  - 클라: 게이트를 `stocks.length === 0`→**`< 2`**로 변경(1개 선택도 시작 화면 유지). 1개 선택 시 **제거 가능한 선택 칩 + "비교하려면 1개 더 선택하세요 (최소 2개 · 최대 4개)" 안내**. 추가 경로 5종 — **추천 비교 세트**(클릭 시 세트 전체를 순차 `addToCompare`로 담아 4개 상한 준수)·**오늘 Top 5**(이미 담긴 종목 ✓ 비활성)·**관심 종목에서 추가**(`getWatchlist()` 마운트 로드, `stockMap`으로 이름 매핑, 관심 종목 없으면 블록 생략)·**직접 검색**(StockSearchBox)·**같은 업종 탐색**(/stocks). 전 터치 타깃 ≥44/36px.
  - **최근 본 종목**은 저장소가 없어 가짜로 만들지 않고 후속 과제로 남김.
- **(3) 상단/모바일 메뉴 단순화** `Sidebar.tsx`+`MobileNav.tsx`+`MobileBottomNav.tsx`:
  - 데스크톱 1차 메뉴(ungrouped) = **오늘 · 종목 찾기 · 공시 신호 · 백테스트 · 요금제**, 나머지(관심 종목·비교·분석 기록·지표 가이드·서비스 소개)는 **"더보기"** 그룹으로 이동. 라우트/href·active 로직·`showGroup` 디바이더 무변경(재배열만).
  - 모바일 하단 네비 = **4셀 유지**(오늘·종목 찾기·공시 신호 + 더보기 버튼). 관심을 PRIMARY→MORE 시트로 이동. MORE 시트에 모든 라우트(관심·비교·백테스트·분석 기록·요금제·지표 가이드·서비스 소개) 도달 가능. 헤더 드로어 `MobileNav` ITEMS도 동일 1차/더보기 분리로 일치. `aria-label`·Esc/오버레이 닫기·포커스 보존.
- **(4) 종목 탐색 검색 우선** `StocksExplorer.tsx`(표시/레이아웃만): 첫 화면 순서를 **검색창(헤더 바로 아래, 돋보기 아이콘·큰 입력) → 질문형 프리셋 → (빠른 프리셋 `<details>` 기본 접힘) → 상세 필터(데스크톱 `showAdvanced` 기본 false·모바일 하단 드로어)**로 재배치. 기존 정렬/필터 행의 중복 검색 input 제거(검색은 상단 1곳으로). 활성 필터 칩 바·per-chip 제거·초기화는 그대로 도달 가능. `PRESETS`/`QUESTION_PRESETS`·`matchesConfig`·정렬·저장검색/알림·localStorage 뷰모드 핸들러 무변경.
- **(5) 요금제 경계 명확화** `pricing/page.tsx`: 무료 카드에 **"탐색·기본 지표·오늘 후보까지 무료로 충분 · 결제 없이 핵심 가치 경험"** 한 줄 추가. Pro 카드에 **"왜 Pro인가 — 시간 절약·변화 알림·기록 관리"** 한 줄 추가(수익률 향상/매수·매도 조언 비제공 캐비엇 포함). 한도 숫자는 `limits.ts` 단일 출처 유지. **Premium 티어는 정의되지 않아 2티어(무료/Pro) 유지** — 가짜 가격/기능 토글 만들지 않음. 기존 `WaitlistForm`·비자문 고지 블록 보존.
- **(작업지시 5/제한 화면)** `AddToCompareButton.tsx`: 4개 초과 토스트를 **"비교는 최대 4개까지 가능해요 — 하나를 빼고 추가하세요"**로 친절·비차단 문구화(`COMPARE_MAX` 정렬, 동작 무변경).

### 테스트 결과
- `npx tsc --noEmit`: exit 0 (전후)
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·SSG 138p, `/stocks` 14.1 kB, exit 0
- 변경 파일 금지표현(매수 추천/강력 매수/급등 예상/목표가/손절가/진입 시점/따라 사기/AI 픽/매수 후보/수익 보장 등) grep = 0.
- 로컬 prod(127.0.0.1:**3251**, 내 리스너 PID 15804만 taskkill·운영자 3000/4310 무중단): 검증 5라우트 `/ /today /stocks /compare /pricing` 전부 HTTP 200. SSR: 사이드바/네비 1차 순서(오늘·종목 찾기·공시 신호·백테스트·요금제)+"더보기"·"관심 종목", `/stocks` "종목명 · 코드로 바로 검색"(검색 우선)+질문형 프리셋+빠른 프리셋(접힘), `/pricing` "탐색 · 기본 지표 · 오늘 후보"·"무료로 충분히"·"왜 Pro인가", `/compare` 플라이트 페이로드에 `recommendedSets`(반도체·IT부품 등 실데이터 4종목) 전달 확인.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **`/compare` 시작 화면 본문은 클라이언트 렌더(`mounted` 게이트)라 SSR HTML에 안 보임 — 데이터는 flight 페이로드로 확인**. **운영자: http://127.0.0.1:3000 재빌드·재기동 후 데스크톱/390px 브라우저 체크 권장** — 비교 시작 화면(추천 세트/선택 칩/최소 2개 안내)·상단 메뉴 5개+더보기·모바일 하단 4셀+더보기 시트·`/stocks` 검색 우선·요금제 무료/Pro 경계, 가로 오버플로우 0·터치 44px·콘솔 0.

### 결정 / 잔여 리스크 / 다음
- **최근 본 종목** 저장소 부재 → 비교 추가 경로에서 제외(후속 과제, 가짜 동작 금지).
- **Premium 티어** 미정의 → 2티어 유지(무료/Pro). 정의되면 "출시 예정/검토 중" 컬럼으로 추가 가능.
- 외부 PDF PART F/G/H/K 원문 미확보 — 추출본 레포 반영 시 잔여 재대조. 다음: 운영자 모바일 게이트, 외부 릴리스(범위 외).

---

## 2026-06-25 · 1차 상용화 안정화 P1-A — 공시 확인포인트 문구·카드 주의 라인·기간 고지·백테스트 오해 방지 (Task 35, Claude)

### 목표
- ORNSCORE 1차 상용화 안정화 P1-A. 신규 기능이 아니라 **공시 신호 문구 리스크 제거·카드 구조 통일·수집 범위 고지·백테스트 오해 방지**. branch `ai-center/task-35-ornscore-1-p1-a`. 점수 계산식·데이터 생성·`backtest-result.json`·`direction` 데이터값 **무변경**, 신규 npm 0·빌드 단계 추가 0.
- **시작 상태 메모**: HEAD는 기준커밋 `533c6d2`가 아니라 `8966e63`(= Task 33 P0-A·Task 34 P0-B 4커밋이 533c6d2 위). P1-A는 그 위에 쌓으므로 **리셋하지 않고 그대로 이어서** 작업(작업트리 클린 확인).
- **설계서 메모**: PART D/E 원문(외부 PDF)은 레포에 없음 → 지어내지 않고 **작업지시 2~6 + `docs/ornscore-improvement-brief.md`(Disclosure Signals·Terminology 절)** 기준으로만 구현.

### 완료한 작업 (작업지시 2~6)
- **(2) 공시 문구 확인포인트화** `DisclosureExplorer.tsx`(`SIGNAL_DESCRIPTIONS`)·`disclosure-signals.ts`(treasury note): 자사주→"주주환원·주가 안정 관련 이벤트. 취득 규모·소각 여부 확인 필요." / 보유변동→"주요 주주·임원 지분 변화. 매수·매도 방향 원문 확인 필요." / 대형계약→"계약 규모의 매출 영향 확인 필요." / 유증·CB(3종)→"희석·자금조달 구조(용도·규모·가격) 확인 필요." / 정정→"기존 공시 내용 변경 확인 필요." **detector note의 "통상 단기·중기 호재 신호" → "자기주식 취득 결의 — 취득 규모·소각 여부는 원문 확인 필요"**(호재 단정 제거, /disclosures·/stock 양쪽 카드에 노출되는 소스).
- **(3) 방향 배지 valence 제거** `DisclosureExplorer.tsx`+`StockDisclosures.tsx`: "방향 긍정 가능(red)/부정 가능(blue)" → 사실 라벨 **"장내매수 단서"/"장내매도·처분 단서"/"방향 확인 필요"** + 중립 slate 배지(긍정/부정 valence·등락색 제거, §20.7 텍스트 동반). `direction` 데이터값 무변경, 표시만.
- **(4) 카드 구조 통일 + 주의 라인** `DisclosureExplorer.tsx`: 타입 배지→종목명→제출일→한 줄 요약→**확인할 것**(zinc)→**주의**(amber, 신규)→액션행(원문/종목/이 공시 이해하기). 주의 라인은 `signalGuide.cautionNote` 첫 문장(트림) 또는 타입별 폴백. 44px 터치·`flex-wrap`/`break-words`/`min-w-0` 보존.
- **(5) 수집 범위 고지 상시화·일치** `DisclosureExplorer.tsx`+`disclosures/page.tsx`: `totalDisclosures>=200` 조건부였던 "최신 200건" 배지·안내문을 **무조건 노출**로 변경 — "선택한 N일 전체 공시가 아니라, 코스피·코스닥 각 최신 100건(합 200건)에서 자동 추출한 신호입니다. 표시는 최대 50건." 페이지 `<details>` 요약도 같은 단일 문구로 미러링(헤더↔리스트 일치). `dataStatus` 미사용 import 제거.
- **(6) 홈↔공시 숫자 모순 제거** `recentSignals.ts`+`api/disclosures/recent/route.ts`: `signalCount`를 전체 탐지수가 아니라 **표시 가능한 신호수(slice 50)** 와 일치시킴 → 홈 KPI와 /disclosures가 같은 수를 보이고 항상 ≥ 이벤트 묶음. **샘플 폴백 데이터도 교정**: `public/disclosure-samples/recent-signals.json`(signalCount 12→9·호재 note 2건)·`005930.json`·`373220.json`(호재 note 1건) — DART 키 부재 시 폴백되는 정적 샘플에 잔존하던 구 호재 문구·과대 카운트 제거. `MarketSnapshotCards` 공시 카드 보조문구 "DART 자동 분류"→"DART · 최신 200건 내"(홈·today 공통).
- **(작업지시 6/백테스트) 오해 방지** `BacktestClient.tsx`+`backtest/page.tsx`+`BacktestRiskNotice.tsx`: h1 "백테스트"→**"실험 전략 백테스트"**, `BacktestRiskNotice`에 단일 소스 리드 고지 **"…현재 ORNSCORE 종합점수 검증 결과는 아닙니다."**(`dataStatus.limits.backtest` 재사용). 마지막 리밸런싱 보유 블록에 **"과거 시뮬레이션의 마지막 리밸런싱 구성 · 현재 확인 후보나 추천이 아닙니다."** 캡션. 세 날짜 분리 표기 — **데이터 기간(period) / 백테스트 생성일(generatedAt) / 사이트 현재 데이터 기준(dataStatus.globalAsOfLabel, 서버 prop `siteDataAsOf`)**. 준비중 fallback h1도 통일. 데이터·metrics 무변경.

### 테스트 결과
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·SSG 138p, `/disclosures` 11.3 kB, exit 0
- 변경 added 라인 금지표현(매수 추천/강력 매수/급등 예상/목표가/손절가/진입/따라 사기/AI 픽/매수 후보/호재 확정/악재 확정) grep = 0. 잔존 "호재"는 전부 **부정 캐비엇**("호재/악재 점수가 아니라/아닌" — brief 권장 표현 "호재/악재 점수가 아님")만.
- 로컬 prod(127.0.0.1:**3252**, 내 리스너 PID만 taskkill·운영자 4310 무중단): 검증 5라우트 `/disclosures /backtest / /today /stock/005380` 전부 HTTP 200·에러 마커 0. SSR: 공시 카드 타입배지/종목명/제출일/한줄요약/확인할 것/주의/이 공시 이해하기 전수 렌더, "최신 200건 내"·"전체 공시가 아니라"·"표시는 최대 50건" 상시 노출, **긍정/부정 valence 배지 0**(장내매수 단서·방향 중립), 백테스트 "실험 전략 백테스트"+"종합점수 검증 결과는 아닙니다"+3날짜 분리+리밸런싱 caveat, 홈 "공시 신호 9건"=/disclosures "신호 9건·이벤트 9개"(모순 해소), /stock/005930·373220 호재 0.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build로 대체. **운영자: http://127.0.0.1:3000 재빌드·재기동 후 데스크톱/390px 브라우저 체크 권장** — 공시 카드 주의 라인·액션행 44px·가로 오버플로우 0, 백테스트 KPI 수익/위험 2박스·3날짜 푸터·기간 고지 줄바꿈, 콘솔 오류 0.

### 결정 / 잔여 리스크 / 다음
- `direction` 데이터값(긍정 가능/부정 가능/확인 필요)은 무변경 — 표시 라벨만 사실(장내매수/매도 단서) 또는 "방향 확인 필요"로 중립화. 추후 enrichment가 실제 방향을 확정하면 그대로 사실 라벨로 승격 가능.
- `signalGuide.ts` `pastPattern`은 여전히 방향성 % 범위("+2~5%" 등)를 "(절대값 X)" 캡션과 함께 보유 — 카드 본문이 아니라 '이 공시 이해하기' 펼침 안에만 노출. 추가 완화는 후속 검토.
- 공시 신호 표시 상한 50건·수집 200건은 성능·비용 제약(상시 고지로 정직 표시). 시점별 전체 수집은 후속 과제.
- 외부 PDF PART D/E 원문 미확보 — 추출본 레포 반영 시 잔여 재대조. 다음: 운영자 모바일 게이트, 외부 릴리스(범위 외).

---

## 2026-06-25 · 1차 상용화 안정화 P0-B/P1 — 종목 상세 번호 중복·CTA 버튼 그룹·데이터 배지·점수/순위 분리·밸류 기준 (Task 34, Claude)

### 목표
- ORNSCORE 1차 상용화 안정화 P0-B/P1. 신규 기능이 아니라 **종목 상세 UI 기본기·표현 명확성**(번호 중복, 버튼 붙음, 배지 붙음, 점수≠순위, 밸류 업종 편향) 정리. branch `ai-center/task-34-ornscore-1-p0-b-ui`. 점수 계산식·데이터 생성 **무변경**, 신규 npm 0·빌드 단계 추가 0.
- **설계서 위치 메모**: 기준 PDF(`ORNSCORE 사이트 진단 및 개선 설계서.pdf`)·`ornscore_design_improvement_spec.md`는 저장소에 없음(레포 외부). PART C/I/J 원문 미확보 → 내용을 지어내지 않고 **작업지시 2~7 + `docs/ornscore-improvement-brief.md`(PDF 변환본)** 기준으로만 구현.
- **시작 상태 메모**: HEAD는 기준커밋 `533c6d2`가 아니라 `b3b4f6f`(= Task 33 P0-A 2커밋이 533c6d2 위에 올라간 상태). P0-B는 P0-A 위에 쌓는 것이므로 **리셋하지 않고 그대로 이어서** 작업(작업트리 클린 확인).

### 완료한 작업 (작업지시 2~7)
- **(2) 번호 중복 제거** `src/components/BeginnerReading.tsx`: 초보자 카드 하단의 중복 앵커 칩(📋 관련 공시 확인/💰 재무 보기/📊 점수 근거)을 제거 — 이 칩들은 위의 번호형 "먼저 확인할 것" ol(점수→공시→재무)·상단 히어로 "다음으로 확인할 것" 버튼과 같은 앵커를 3중 반복했음. 번호형 STEP 순서 목록 **1개만** 캐논으로 남기고, 칩 자리에는 "위 먼저 확인할 것 순서 또는 상단 버튼 이용" 안내 1줄로 대체. 종목 상세 `<ol>` = 1개(검증).
- **(3) CTA 버튼 그룹** `src/components/stock/StockHeader.tsx`: actionsSlot(관심/비교/공유) 컨테이너를 공통 버튼 그룹 스타일로 — 데스크톱은 우측 가로 배치+명확한 간격(`gap-2`), 모바일은 `w-full`로 한 줄 내려 `[&>*]:flex-1`로 균등 폭 줄바꿈(텍스트처럼 붙지 않게). 버튼 컴포넌트 로직·라벨 무변경(컨테이너/간격만). 기존 44px 터치 유지.
- **(4) 데이터 상태 배지 분리** `src/components/stock/PriorityScoreCard.tsx`: 붙어 있던 3개 평문 span → **독립 pill 배지** `[필수 데이터 100%]`(중립) `[이상값 점검 통과]`(emerald) 또는 `[이상값 점검 중·임시 점수]`(amber) `[Metrics 2.4]`(중립). `rounded-full`+테두리+`gap-1.5 flex-wrap`으로 모바일에서도 안 붙음. 정적 Tailwind 리터럴만(런타임 합성 0).
- **(5) 점수≠순위 분리** `MetricInsightCards.tsx`+`PriorityScoreCard.tsx`: 지표 카드에서 값을 **"점수 {v} / 100"**로 명시, 순위는 별도 줄 **"전체 상대순위 {rank} / {total}위 · 상위 X%"**로 분리(같은 숫자처럼 안 보이게), 해석 줄에 **"해석:"** 라벨 추가. PriorityScoreCard 순위 블록에 "상대순위(점수와 별개)" 캡션. 계산(topPctOf/rankOf/compositeOf) 무변경·표시 전용.
- **(6) 밸류 기준 명확화** `MetricInsightCards.tsx`+`src/app/stock/[ticker]/page.tsx`: 4지표 밸류 카드에 **"전체 풀 기준 점수 · 업종 내 상대 위치는 아래 업종 대비 밸류 참고"** 라벨. 종목 상세 cyan 박스는 "(위 밸류 점수와 기준 다름)" 명시. **업종 표본 부족(peers<4, sectorValueScore=-1)** 시 기존엔 박스를 그냥 숨겼으나 → **가짜 숫자 없이 "표본 부족으로 업종 내 상대 밸류 미제공, 전체 풀 기준임, 업종 보정은 후속 과제" 안내 박스**를 노출. `peers<10` 저신뢰 경고 보존.
- **(7) 지표 가이드 보강** `src/app/guide/metrics/page.tsx`: 상단 고지 박스 아래 **"읽기 전 검토 포인트"** 박스 추가 — (a) 점수(0~100 절대값) vs 상대순위(전체 풀 내 위치) 차이, (b) 밸류 점수가 전체 풀 분위라 업종 편향 가능(금융·지주사 상위 쏠림)·종목 상세 업종 대비 밸류는 별도·종합점수 미포함. 기존 line 122 공통기준 문구와 중복 없이 보강. 비자문 톤.

### 테스트 결과
- `npx tsc --noEmit`: exit 0 (전후)
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·SSG 138p, `/stock/[ticker]` 14 kB, exit 0
- 변경 6파일 금지표현(매수 추천/강력 매수/급등 예상/목표가/손절가/진입/따라 사기/AI 픽/매수 후보 등) grep = 0 (부정문 고지 "매수·매도 추천이 아닌"만 보존).
- 로컬 prod(127.0.0.1:**3251**, 내 리스너 PID 2140만 종료·운영자 3000/4310 무중단): 검증 5라우트 `/stock/005380 /stock/005930 /stocks /guide/metrics /status` 전부 HTTP 200, 에러 마커 0. SSR 확인: 종목 상세 `<ol>` 1개(번호 중복 0)·구 하단 칩 "관련 공시 확인" 0건·배지 `rounded-full`+"필수 데이터/이상값 점검 통과/Metrics 2.4"·"전체 상대순위"·"해석:"·"업종 대비 밸류"+"전체 풀 기준"·가이드 "읽기 전 검토 포인트"/"점수와 순위는 다릅니다"/"밸류 점수의 기준에 주의" 전수 렌더.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build로 대체. **운영자: http://127.0.0.1:3000 재빌드·재기동 후 데스크톱/390px 브라우저 체크 권장** — 종목 상세 상단 CTA 버튼 그룹(데스크톱 가로·390px 2열/줄바꿈 균등)·데이터 배지 3개 안 붙음·점수↔순위 구분 가독성·가로 오버플로우 0·콘솔 오류 0.

### 결정 / 잔여 리스크 / 다음
- (6) 업종 대비 밸류는 `sectorValueScore`가 PER·PBR 보유 동일업종 피어 **4개 이상**일 때만 점수 산출. 4개 미만이면 숫자 날조 대신 안내 박스 — 후속 과제: KRX 공식 업종코드 연동 시 표본 확대.
- 설계서 PART C/I/J 원문 미확보(레포 외부 PDF) — 추후 PDF 텍스트 추출본을 레포에 넣으면 잔여 항목 재대조 권장.
- 다음: 운영자 모바일 브라우저 게이트, 외부 릴리스(범위 외).

---

## 2026-06-25 · 1차 상용화 안정화 P0-A — 금지표현 교체·공통 고지 3줄·Metrics 2.4 단일출처 (Task 33, Claude)

### 목표
- ORNSCORE 1차 상용화 안정화 패치 P0-A. 신규 기능이 아니라 **신뢰도·문구 리스크·UI 기본기·검증 가능성** 강화. 설계서 PART A/B 기준. branch `ai-center/task-33-ornscore-1-p0-a-metrics`(시작 `533c6d2`, 클린·예상 일치). 점수 계산식·데이터 생성 **무변경**, 신규 npm 0·빌드 단계 추가 0.

### 완료한 작업
- **금지 표현(투자 조언처럼 보이는 표현) 교체** — 사용자 화면 문자열에서 제거. 부정문("…추천이 아니라/아닙니다", "…의미하지 않으며")은 고지로 보존:
  - `src/app/page.tsx` riskNote: "진입 전 급등 사유 확인"→"급등 사유 확인", "진입 시점과 비중 분할"→"비중·시점 분할".
  - `src/app/today/page.tsx` riskNote 동일 2건 + 과열 주의 caption "진입 전 급등 사유 확인"→"급등 사유 확인" + "🆕 신규 진입"→"🆕 신규 편입"(랭킹 편입 의미, '진입' 토큰 제거).
  - `src/components/ScoreTooltip.tsx`: "저평가 진입"→"저평가 국면".
  - `src/lib/metricReadings.ts`: "따라 사기 전, 급등 이유…"→"급등 이유…부터 확인하는 것이 우선", "지금이 진입 시점인지…"→"지금 살펴볼 시점인지 다음 분기를 기다릴지".
  - **보존(의도)**: `src/app/terms/page.tsx`("특정 종목·자산의 수익 보장"은 "제공하지 않습니다" 법적 고지 목록), `src/lib/metrics.ts`(코드 주석·비노출), 모든 부정문 고지.
  - 참고: "급등"(단독)·"추격매수 주의"는 금지 목록에 없고 위험 경고 톤이라 보존.
- **공통 고지 3줄을 홈 `RiskNotice`에 정확히 노출**(과잉 반복 회피 — 푸터 1줄 고지가 전역 페이지 커버):
  1. "오른스코어는 투자 추천이 아닌 데이터 기반 탐색 도구입니다."
  2. "모든 점수와 신호는 참고 정보이며, 매수·매도 추천이 아닙니다."
  3. "최종 투자 판단과 책임은 사용자 본인에게 있습니다."
  - 문구는 `src/lib/dataStatus.ts`의 `notices.disclaimer` 배열로 **단일 소스화**하고 `RiskNotice`가 이를 읽도록 연결(브랜드 토큰은 일관성 위해 "오른스코어" 유지).
- **Metrics 버전 표기 단일 소스 정리**: `src/app/universe/page.tsx` "산식 버전" 셀을 `dataMetadata.metricsVersion ?? "—"`(→"2.4") → `dataStatus.metricsVersionLabel`(→"Metrics 2.4")로 교체. 값은 동일, 전 화면 표기 포맷 통일.
- **검증 게이트 강화** `scripts/verify_metrics.py` FORBIDDEN에 다어절 금지 토큰 추가: 급등 예상·강력 매수·목표가·손절가·단기 급등주·무료 급등주·매수 후보·AI 픽·AI 추천·오늘 살 종목·따라 사기·진입 시점. **단독 "진입"·"매수 추천"은 제외**(정당한 부정문/단어 오탐 회피). 향후 회귀 차단.

### 테스트 결과
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0(신규 토큰 포함) · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·172라우트 프리렌더 통과, exit 0
- 로컬 prod(127.0.0.1:**3257**, 내 리스너 PID 21788만 종료·운영자 3000/4310 무중단): 검증 9라우트 + `/compare`·`/universe` 모두 HTTP 200, 서버 로그 에러 0. SSR 확인: `/`에 공통 고지 3줄 정확 렌더, Metrics 2.4가 `/ /today /stocks /status /guide/metrics /universe` 전수(2.3·"Metrics v" 0), 기준일 2026.06.24 `/ /today /status` 일치. 11라우트 HTML 금지 토큰(진입·따라 사기·급등 예상·강력 매수·목표가·손절가·매수 후보 등) grep = 0, "매수 추천"은 전부 부정문.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build로 대체. **운영자: http://127.0.0.1:3000 재빌드·재기동 후 데스크톱/390px 브라우저 체크 권장** — 가로 오버플로우 0·콘솔 오류 0·홈 고지 3줄 가독성.

### 결정 / 잔여 리스크 / 다음
- 가격 기준일 "갱신 지연(delayed)" 상태는 **의도된 정직 표시**(직전 영업일 기준) — 숨기지 않고 상태 문구로 노출 유지.
- 게이트는 단독 "진입"/"매수 추천"을 검사하지 않음(오탐 회피). 신규 사용자 문자열 작성 시 수기 주의 필요.
- 다음: P0-B(설계서 잔여), 운영자 모바일 게이트 확인, 외부 릴리스(범위 외).

---

## 2026-06-25 · 비주얼 리뉴얼 Phase 7 — /backtest KPI 수익/위험 분리·위험 안내 강화·월별 히트맵·MDD 차트·기여 Top/Bottom (Task 27, Claude)

### 목표
- 설계서 `ornscore_design_improvement_spec.md` **Phase 7(백테스트 페이지, §11.2~§11.5·§15·§20.7)**. `/backtest`를 평면 6카드에서 **수익/위험 분리 KPI + 강화된 위험 안내 + 월별 히트맵 + 낙폭(언더워터) 차트 + 기여 Top/Bottom 막대**로 리뉴얼. 점수 계산식·데이터 생성·`backtest-result.json` **무변경**, 비자문 톤(수익률만 강조 금지, `수익 보장`/`추천 전략`/`매수 신호` 금지), **신규 npm 패키지 0**(순수 CSS/SVG/HTML). branch `ai-center/task-27-ornscore-phase-7-kpi`(시작 `1ae9486`, 클린, `4f5b277` 라인 위).

### 완료한 작업
- **신규 `src/components/backtest/BacktestRiskNotice.tsx`**(서버): 위험·한계 안내 단일 소스. 과거 데이터 기반 시뮬레이션·**미래 수익 비보장**·**수수료·슬리피지·체결 지연·유동성 한계**·생존편향·미래참조 제거·지표 범위 한계를 항목으로 명시 + (옵션) 벤치마크/가정 줄. 실데이터·준비중 fallback 양쪽에서 재사용해 기존 상·하단 amber 문단 2개를 흡수(중복 제거).
- **신규 `src/components/backtest/MonthlyHeatmap.tsx`**: 연도(행)×월(01~12 열) 순수 CSS 그리드 히트맵. 그동안 미사용이던 `monthlyReturns`를 표면화. 셀 색은 정적 Tailwind 리터럴 9버킷(상승=red·하락=blue·0/미보유=zinc, 런타임 합성 0). `overflow-x-auto`+`min-w-[560px]`로 390px 가로 넘침 회피, `title`/`aria-label`에 연·월·% 노출.
- **신규 `src/components/backtest/DrawdownChart.tsx`**: `equityCurveMonthly.equity`의 직전 고점 대비 낙폭(언더워터)을 순수 SVG 면적으로. 최저점(최대낙폭) 월 표시·`maxDrawdown` 주석. EquityChart와 동일 viewBox+`w-full h-auto` 반응형, `role="img"`+`aria-label`. 하락=파랑.
- **신규 `src/components/backtest/ContributionBars.tsx`**(서버): `contributors`를 pnl 부호로 **수익 기여 상위 / 손실 기여 상위** 2그룹 가로 막대. 그룹 내 max |pct| 기준 길이, 수익=red·손실=blue, 각 행 `/stock/{ticker}` `prefetch={false}` 링크(`names[ticker]`+부호 pct%). 데이터 없으면 렌더 안 함(날조 금지).
- **변경 `src/components/BacktestClient.tsx`**: 평면 6카드 metricCards 제거 → **수익 그룹**(CAGR·총수익률 vs 벤치·누적 초과수익) / **위험 그룹**(MDD vs 벤치·Sharpe vs 벤치·승률) 2박스로 분리(`KpiCell`, 인라인 벤치 보조줄). 위험 그룹은 rose 테두리/배경+`ShieldAlert` 아이콘+"위험" 라벨로 색만으로 전달하지 않게(§20.7). 인라인 amber 문단 → `BacktestRiskNotice`. EquityChart 아래 `DrawdownChart`→`MonthlyHeatmap`→연도별 막대→`ContributionBars`+보유 칩 순. 전략 탭·composite 기본 보존, 기존 균형 경고문장 유지.
- **변경 `src/app/backtest/page.tsx`**: 준비중 fallback에 `BacktestRiskNotice` 추가(badges 아래).

### 결정 / 잔여
- MDD를 사이트 등락 색(상승=red) 과 혼동되지 않게 **위험 그룹 전체를 rose 톤+아이콘+라벨**로 분리(값 자체도 rose). 수익 그룹은 기존 등락 의미색(상승=red/하락=blue) 유지.
- 상·하단에 흩어져 있던 amber 주의 문단 2개를 단일 `BacktestRiskNotice`로 통합(중복 축소). `BacktestLimitBadges`는 그대로 상단 유지.
- 성과 기여는 전략별 `contributors`(상위 9종목 누적) 데이터만 제공 — 시점별 기여 시계열은 데이터가 없어 후속 과제로 남김(억지 생성 안 함).

### 테스트 결과
- `npx tsc --noEmit`: exit 0 (전후)
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트 통과, `/backtest` 7.24 kB, exit 0
- 로컬 prod(127.0.0.1:3255, 내 리스너 PID 15684만 종료·운영자 3000/4310 무중단): `/backtest`·`/today`·`/stocks`·`/stock/005380` 모두 HTTP 200, 에러 마커 0. `/backtest` SSR에 수익/위험 그룹·위험 안내(수수료·슬리피지·체결 지연·유동성·미래 수익 비보장)·월별 수익률 히트맵·낙폭(언더워터)·수익/손실 기여 상위·인라인 벤치(총수익률 +290.5%/MDD −28.0%/Sharpe 0.98) 전수 렌더. 신규/변경 파일 금칙어(수익 보장/추천 전략/매수 신호/급등 예상) grep = 0.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장** — 데스크톱/390px에서 KPI 수익·위험 2박스(1열↔2열)·히트맵 `overflow-x-auto` 가로 넘침 0·낙폭 차트 반응형·기여 막대 1열↔2열·콘솔 오류 0.

### 다음에 바로 실행할 작업
- 백테스트 생존편향 실해결(시점별 유니버스 재구성, 큰 작업) — 현재는 안내 문구. 전역 라이트 토큰(#F6F8FB) 미도입(범위 외).

---

## 2026-06-25 · 비주얼 리뉴얼 Phase 6 — /disclosures 공시 신호 카드 피드·타입 색/아이콘·이해하기 UX (Task 26, Claude)

### 목표
- 설계서 `ornscore_design_improvement_spec.md` **Phase 6(공시 신호 페이지, §10.2~§10.6·§15·§20.7)**. `/disclosures`를 테이블식 나열에서 **상단 카드형 요약 대시보드 + 이벤트 피드 카드**로 리뉴얼. 공시 분류 로직·API fallback·점수/데이터 생성 **무변경**, 비자문 톤(호재/악재 단정 금지), 신규 npm 패키지 0. branch `ai-center/task-26-ornscore-phase-6-ux`(시작 `8b2ac57`, 클린, `4f5b277` 라인 위).

### 완료한 작업
- **신규 단일 소스 `src/lib/disclosureType.ts`**: `signalType` → `{label, shortLabel, Icon(lucide), badgeBg/Text/Border, dot, cardBorder}` 매핑 + `DISCLOSURE_TYPE_ORDER`(자사주·보유변동·대형계약·손익정정·유증/CB) + `typeMetaOf()`. **설계서 §10.4 색**: 자사주=초록, 보유변동=보라, 대형계약=청록(teal), 손익정정=주황(amber), 유증/CB=빨강. 전부 **정적 Tailwind 리터럴**(런타임 색 합성 0 — purge 누락 회피). 색은 항상 텍스트 라벨·아이콘·도트와 함께(§20.7). 미분류는 중립 회색 폴백.
- **신규 `src/components/disclosures/DisclosureSummaryCards.tsx`**(presentational): 타입별 요약 카드 **항상 5개** 노출(`grid-cols-2`→`sm:3`→`lg:5`). 아이콘+타입 라벨(텍스트 배지)+묶음 수+캡션("최근 N일 · M건" / "이벤트 없음"). 0건은 muted 상태. 호재/악재 표현 없음.
- **`src/components/DisclosureExplorer.tsx` 리팩터**:
  - 타입별 묶음 수(`signalCounts`)·기간을 `<DisclosureSummaryCards>`로 전달, 필터 칩 위에 렌더.
  - 하드코딩 `SIGNAL_STYLES`(signalLabel 키)·`CANON_TYPES` 제거 → 필터 칩·카드 배지/테두리를 **`typeMetaOf(g.signalType)`**에서 읽음. 칩에 타입 도트 추가. 방향 배지(긍정 가능=red/부정 가능=blue/확인 필요=amber)·건수 배지 로직 보존.
  - 각 묶음을 **이벤트 카드**로 재구성: 좌측 4px 타입색 테두리 + 상단(타입 아이콘+텍스트 배지 "{label}·자동분류" / 방향 / N건) → 종목명·코드·제출일 → 한 줄 의미(`SIGNAL_DESCRIPTIONS`/note) → **구분된 "확인할 것" 라인**(가이드 checkPoints[0]) → 액션 행(원문 보기 ↗ / 종목 보기 → / 관심 / 이 공시 이해하기). 모든 터치 타깃 `min-h-[44px]`, `flex-wrap`·`min-w-0`·`break-words`로 390px 넘침 회피. 로딩 스켈레톤·에러 블록·빈 상태·SSR `initialData` fallback 보존.
- **`src/components/SignalGuideExpand.tsx`**: `url` prop 추가 → 펼침 내부에 **DART 원문 보기 링크**(§10.6 모달 구성요소: 공시 타입·일반적 의미(oneLine/whyMatters)·확인 항목(checkPoints)·원문 링크). 헤더 이모지를 `disclosureType` **타입 아이콘+색**으로 교체해 카드와 일관화. 트리거 버튼 `min-h-[44px]`로. 기존 중립 문구·고지 보존.

### 결정 / 잔여
- **"이 공시 이해하기" 결정**: 설계서 §10.6은 "긍정적/부정적으로 볼 수 있는 경우" 섹션을 예시하나, **자문 톤("좋은 신호"/매수/호재) 없이 깔끔히 분리하기 어려워 기존 인라인 펼침을 유지**(이미 일반적 의미·확인 항목·과거 패턴·주의·원문을 모두 노출). 호재/악재 단정 금지 지침 우선. 모달 대신 코드베이스에 이미 있는 **인라인 펼침** 방식 채택.
- 색 충돌: capital_raise(빨강)와 방향 배지 "긍정 가능"(빨강)은 별개 배지+다른 텍스트라 혼동 낮음(지침대로 방향 매핑 보존).
- `StockDisclosures.tsx`(종목 상세)의 `SIGNAL_BG`는 무변경 — 이번 retone은 `/disclosures` 한정(상세 회귀 0).

### 테스트 결과
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트 통과, `/disclosures` 11.1 kB, exit 0
- 로컬 prod(127.0.0.1:3253, 내 리스너 PID 2412만 종료·운영자 3000/4310 무중단): `/disclosures`·`/today`·`/stock/005380` 모두 HTTP 200. `/disclosures` SSR에 5개 요약 카드 라벨(자사주/보유 변동/대형 계약/손익 정정/유증/CB)·5색 토큰(green/purple/teal/amber/red 전수)·이벤트 마커(자동분류 9·이 공시 이해하기 10·원문 보기 9·확인할 것 5)·요약 캡션 렌더, 에러 마커 0. 신규/변경 4파일 금칙어 grep = 비자문 부정문("호재/악재 단정 없이"·"매수로 단정 금지")만.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장** — 데스크톱/390px에서 요약 카드 2열↔5열·타입 색 밴드·이벤트 카드 가로 넘침 0·"이 공시 이해하기" 펼침·터치 44px·콘솔 오류 0.

### 다음에 바로 실행할 작업
- Phase 7(백테스트 차트·손실 기여 막대). 전역 라이트 토큰(#F6F8FB) 미도입(범위 외).

---

## 2026-06-25 · 비주얼 리뉴얼 Phase 5 — /stock 상세 게이지·지표 카드·업종 비교 시각화 (Task 25, Claude)

### 목표
- 설계서 `ornscore_design_improvement_spec.md` **Phase 5(종목 상세 페이지, §9.2~§9.7·§14·§15)**. 이미 끝난 Task #15 결론 카드(`StockConclusionHero`)와 Task #23 디자인 톤 위에서 그 아래/주변 점수 해석·비교 시각화를 **강화**(결론 카드는 갈아엎지 않음). branch `ai-center/task-25-ornscore-phase-5`(시작 `5381720`, 클린). 점수 계산식·데이터 생성·JSON-LD·breadcrumb·`generateMetadata`/`generateStaticParams`·`StockTabs` 탭 id/순서·가격 동기화(`displayPrice`/`displayChangePct`)·`surge3m`/`riskAlert`·관심/비교/공유 슬롯 **무변경**, 비자문 톤, 신규 npm 패키지 0.

### 완료한 작업
- **Goal 1 · 탐색 우선도 게이지**: `src/components/stock/PriorityScoreCard.tsx`를 기존 `@/components/ui/ScoreGauge`(size 88·showLabel·showOutOf)로 점수를 주인공화. 전체/업종 순위·필수 데이터 %·이상값 점검·산식 버전 행 전부 보존. **suspect(이상값 점검 중)에는 게이지 대신 회색 숫자만** 노출(매수 게이지처럼 보이지 않게). props 시그니처 무변경 → `StockConclusionHero` 호출부 그대로.
- **Goal 2 · 4지표 카드**: 신규 `src/components/stock/MetricInsightCards.tsx`(서버, 훅 0). 카드마다 지표명+`ScoreTooltip`, 원점수·상위/하위 백분위, `scoreColorOf` 밴드 막대, 한 줄 해석, **확인/주의 태그**(tone=caution면 주황 "주의", 아니면 파랑 "확인"). 1열(모바일)→2열(sm↑). `MetricStrip` 섹션을 대체.
- **해석 문구 단일화**: `BeginnerReading.tsx`의 `readMomentum/readFlow/readValue/readVol`+`getChecklistByPattern`을 **신규 `src/lib/metricReadings.ts`로 추출**(문구 바이트 동일·순수 함수). 초보자 카드와 지표 카드가 같은 소스 사용. 점수 계산 무관, 표시 문구 출처만 이동.
- **Goal 3 · 초보자 카드 강화**: `BeginnerReading.tsx` 제목을 설계서대로 **"초보자는 이렇게 보세요"**로, 헤드라인(패턴) 아래 **순서형 "먼저 확인할 것"(점수→공시→재무, §9.5)** ol 추가(각 단계 `#basis`/`#disclosures`/`#financials` 앵커). 기존 패턴별 항목은 "이 종목에서 특히 볼 것"으로 유지, 매수·매도 추천 아님 고지·앵커 칩 보존.
- **Goal 4 · 업종 비교 시각화**: 신규 `src/components/stock/SectorComparison.tsx`(서버). 행마다 순위 배지·종목명(`/stock/{ticker}` `prefetch={false}`)·**가로 종합점수 막대(scoreColorOf 밴드색)**·PER/등락 보조·현재 종목 ring+bg+"현재" 태그. `overflow-x-auto`(min-w-280)로 390px 가로 넘침 회피. **표본 부족(sectorCount<2) 시 안내 빈 상태**. page.tsx의 기존 `<table>` 블록을 대체(점수는 page에서 1회 계산해 `sectorRows`로 전달, 재계산 없음). 업종 밸류 칩·"업종 전체 →" 링크 유지.
- **Goal 5 · 다음 액션 버튼**: `src/components/stock/NextActionButtons.tsx` 4개 앵커(공시 확인/재무 보기/점수 근거/업종 비교 → `#disclosures`/`#financials`/`#basis`/`#summary`) 라벨·아이콘 정돈, 44px 터치·2열(모바일)/4열(lg) 유지. 관심/비교 추가는 상단 헤더 실제 버튼이 담당 → 죽은 링크 날조 안 함.
- **page.tsx 와이어링**: `MetricStrip` import 제거(미사용)→`MetricInsightCards`/`SectorComparison` 추가, 지표 섹션·업종 `<table>` 대체. "지표 가이드 →" 링크·"전체 N종목 대비" 캡션 보존.

### 결정 / 잔여
- **suspect 게이지 회피**: 이상값 점검 중인 종목은 밴드색 게이지가 매수 신호처럼 보일 수 있어 회색 숫자(`/100`+⚠)로 유지 — Task #15 suspect 톤과 일관.
- **밸류 카드 해석**: `readValue`가 PER·PBR 문구를 쓰므로 `MetricInsightCards`의 밸류 항목에만 `per`/`pbr`을 넘김(다른 지표는 점수만). 계산 무관·표시 전용.
- `MetricStrip.tsx`는 더 이상 상세에서 쓰이지 않으나 컴포넌트 파일은 잔존(다른 화면 영향 없음, 삭제는 범위 외).

### 테스트 결과
- `npx tsc --noEmit`: exit 0 (전후 2회)
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트 통과, `/stock/[ticker]` 13.9 kB·138p SSG 프리렌더, exit 0
- 로컬 prod(127.0.0.1:3251, 시작 PID 15780만 종료·운영자 3000/4310 무중단): `/stock/005380`·`/stock/005930`·`/stocks`·`/today` 모두 HTTP 200. `/stock/005380` SSR에 탐색 우선도 게이지(aria "종합 점수")·자체 지표 4종(확인×2/주의×2)·"초보자는 이렇게 보세요"+"먼저 확인할 것"·"같은 업종 비교"+막대 범례 전수 렌더, 에러 마커 0. 신규/변경 파일 금칙어(추천/매수/매도/수익기대/급등예상/상승가능성) grep = 비자문 부정문("추천이 아닙니다")·기존 보존 문구만.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장** — 데스크톱/390px에서 게이지 가독성·지표 카드 1열↔2열·업종 비교 막대 `overflow-x-auto` 내 가로 넘침 0·다음 액션 44px 터치·콘솔 오류 0.

### 다음에 바로 실행할 작업
- Phase 6(공시 카드 피드·타입별 색/아이콘·해석 모달), Phase 7(백테스트 차트). 전역 라이트 토큰(#F6F8FB) 미도입(범위 외).

---

## 2026-06-25 · 비주얼 리뉴얼 Phase 4 — /stocks 점수 히트맵 표/카드 보기모드 (Task 24, Claude)

### 목표
- 설계서 `ornscore_design_improvement_spec.md` **Phase 4(종목 탐색 페이지, §8.5·§8.6·§15.5·§20.5)**. 이미 끝난 Task #16 질문형 프리셋/필터 위에 **2차 고도화** — 되돌리거나 중복 구현 안 함. branch `ai-center/task-24-ornscore-phase-4`(시작 `4f5b277`, 클린). 점수 계산식·데이터·필터 파라미터·저장검색/알림/테마 딥링크 **무변경**, 비자문 톤, 신규 npm 패키지 0.

### 완료한 작업
- 신규 `src/components/stocks/StockResultsTable.tsx`(presentational): 데스크톱 점수 히트맵 테이블. 11컬럼(종목명·업종·현재가·등락률·종합점수·추세·거래활성도·밸류·위험조정·신호·액션). 점수 5컬럼은 `scoreColorOf` 밴드(80↑ blue/60~79 sky/40~59 amber/<40 zinc) 그대로 칠한 `ScoreHeatCell` 배지(정적 Tailwind 리터럴, 런타임 합성 0). `overflow-x-auto`로 감쌈, 행/액션은 `/stock/{ticker}` `prefetch={false}` 링크, 등락률 색 카드와 동일(상승 red·하락 blue). `deriveSignals`(점수 파생 강점/주의) export.
- 변경 `src/components/StocksExplorer.tsx`:
  - 보기 방식 전환(카드형/표형) 세그먼트 컨트롤 추가 — **데스크톱 전용(`hidden lg:inline-flex`)**, 선택은 `localStorage("stocks-view-mode")`에 보존(기본 카드형, useEffect 복원).
  - 표형 선택 시 데스크톱은 `StockResultsTable`, 모바일(<lg)은 카드형 강제 유지(`lg:hidden`). 카드형/표형 모두 "상위 100개" footnote 공통.
  - 카드 신호 칩 인라인 도출을 표와 공유하는 `deriveSignals`로 통일(중복 제거). 카드 헤더에 업종 보조표기 추가.
  - 빈 상태(§20.5) 개선: `strongestConstraint()`로 가장 강한 단일 조건을 골라 "○○ 조건이 강해 결과가 없습니다" 명시 + **"가장 강한 조건 완화"**(그 조건만 해제·activePreset 클리어) / **"전체 종목 보기"**(초기화) 2버튼.
- 변경 `src/app/stocks/page.tsx`: 뷰모델에 `sector: sectorOf(s.themes)` 추가(홈/오늘 후보 카드와 동일 소스). `StocksExplorer` Stock 인터페이스에 `sector?: string`.

### 결정 / 잔여
- **공시/신호 컬럼**: 클라이언트 컴포넌트에서 종목별 공시 실데이터를 동기 접근할 수 없어 **"신호"로 라벨**하고 점수 파생 칩(추세 강함/거래 활발/과열·급등 주의 등)을 노출 — "공시 있음" 플래그 **날조 안 함**. 실 per-stock 공시 데이터셋이 페이지에 연결되면 그때 교체.
- 모바일은 테이블 미사용(설계서 §8.6·§15.1) — 표형을 골라도 <lg에서는 카드형. 토글 자체가 `hidden lg:inline-flex`라 모바일에서 표형 도달 불가. 모바일 약어 범례(추/거/저/위)·하단 바텀시트 필터 보존.
- `strongestConstraint` strength는 표시·랭킹용 휴리스틱(점수 계산 무관).

### 테스트 결과
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트 통과, `/stocks` 13.9 kB, exit 0
- 로컬 prod(127.0.0.1:3251, 시작 PID만 종료·운영자 3000/4310 무중단): `/stocks`·`/stocks?theme=반도체`(인코딩)·`/today`·`/stock/005930` 모두 HTTP 200. `/stocks` SSR에 카드형/표형 토글·정렬/컬럼 라벨 렌더, 에러 마커 0. 신규/변경 파일 금칙어(추천/매수후보/수익기대/급등예상/상승가능성/매도) grep 0.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장** — 데스크톱(≥1024px) 카드형↔표형 토글·표 점수 히트맵 색 밴드·가로 오버플로우 0, 390px 모바일은 표형 토글 미노출·카드형 유지·가로 오버플로우 0·콘솔 오류 0.

### 다음에 바로 실행할 작업
- Phase 5(`/stock` 상세 게이지 확장·업종 비교 시각화), Phase 6(공시 카드 피드·해석 모달), Phase 7(백테스트 차트). 실 per-stock 공시 데이터셋 연결 시 표 "신호" 컬럼 → "공시" 교체.

---

## 2026-06-25 · 비주얼 리뉴얼 Phase 3 — /today 대시보드화 (Task 23, Claude)

### 목표
- 설계서 `ornscore_design_improvement_spec.md` **Phase 3(오늘 페이지 리뉴얼, §7·§15.2·§16.4)**. `/today`를 정보 나열형에서 홈 리뉴얼과 같은 금융 대시보드 첫인상으로 끌어올림. 점수 계산식·데이터 생성·공시 분류 **무변경**, 비자문 톤, 신규 npm 패키지 0. branch `ai-center/task-23-ornscore-phase-3`(시작 `387f6b4`, 클린). 이미 끝난 홈(#21/#22)·필터(#16)·상세(#15)·신뢰 배지(#17/#18)는 **재사용**(중복 구현 안 함).

### 완료한 작업
- 신규 4파일 `src/components/today/`:
  - `TodayStatusBar.tsx` — 페이지 최상단 데이터 상태 바. 전역 `dataStatus` 단일 소스만 읽어 데이터 상태·주가 기준일·공시 기준·산식 버전을 한 줄로(데스크톱 가로 / ≤390px 줄바꿈). 신뢰 배지(DataStatusBadge·AsOfDateBadge·MetricsVersionBadge) 재사용.
  - `TodayTopSection.tsx` — 오늘의 Top 3 큰 카드. 홈 `StockCandidateCard` 재사용(게이지+4지표 막대+강점/주의+CTA), grid 1→sm:2→lg:3.
  - `SignalSection.tsx` — 신호별 섹션 컨테이너(제목·캡션·반응형 그리드·footnote·EmptyState). 데이터 없으면 억지로 채우지 않고 빈 상태 안내.
  - `SignalStockCard.tsx` — 컴팩트 종목 카드(ScoreGauge 56 + 이름/코드/업종/가격/등락 + 한 줄 신호 + 카드 전체 링크). 과열 주의는 caution amber 톤.
- 변경 `src/app/today/page.tsx`:
  - 추가: 최상단 상태 바, 시장 KPI 4카드(홈 `MarketSnapshotCards` 재사용 — 분석 종목/종합 80+/거래활성도 급증/공시 신호), Top3, 신호별 6섹션(종합 점수 상위·거래활성도 급증·밸류 매력·추세 강함·과열 주의·최근 공시 있음).
  - 대체(중복 제거): 기존 3 KPI(분석 종목/PER·PBR 중앙값) → 시장 KPI 4카드. `StockTabs`(종합/저평가/추세) → 신호별 6섹션. 하단 amber 공시 블록 → "최근 공시 있음" 섹션 흡수.
  - 보존: 오늘의 브리핑+AI 인사이트, 최근 장마감 변화, 체크리스트, 푸터 고지.

### 결정 / 잔여
- 이중 CTA(자세히 보기+비교 추가) → **단일 CTA**로 축소: `/compare`는 `?add=` 파라미터 미지원(localStorage 기반)이라 동작 안 하는 링크를 날조하지 않고 `자세히 보기`(/stock)만.
- KPI '거래활성도 급증'은 `homeSnapshot.volumeSpikeCount`(거래대금 5d/20d ratio≥1.5, 폴백 flow≥75) **파생 추정** — 캡션·footnote에 명시. 실 데이터 생기면 헬퍼만 교체.
- 모바일은 테이블 축소 대신 **카드 세로 스택**(grid-cols-1)으로 390px 오버플로우 구조적 회피(§7.5 가로 스냅 스크롤은 후속 옵션).

### 테스트 결과
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·172 pages, `/today` 854 B, exit 0
- 로컬 prod(127.0.0.1:3250, 운영자 3000/4310 무중단): `/today / /stocks /stock/005380` 모두 HTTP 200. `/today` SSR에 데이터 상태 바·KPI 4·Top3/신호 카드 게이지 34개(aria "종합 점수")·6섹션 제목 전수 렌더, 에러 마커 0. 금칙어 grep = 고지 부정문만.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장** — `/today` 360~390px 가로 오버플로우 0·상태 바 줄바꿈·KPI 2열·Top3 1열 스택·신호 카드 게이지·CTA 44px·콘솔 오류 0.

### 다음에 바로 실행할 작업
- Phase 4(`/stocks` 점수 히트맵 테이블), Phase 5(`/stock` 상세 게이지 확장), Phase 6(공시 카드 피드), Phase 7(백테스트 차트). 실 거래량 급증 데이터 소스로 `volumeSpikeCount` 교체.

---

## 2026-06-25 - 비주얼 리뉴얼 #21/#22 공개 반영 마무리 (Codex)

### 완료한 작업
- 최신 `origin/main`의 daily refresh 데이터 위에 Task #21/#22 홈 비주얼 리뉴얼 커밋만 cherry-pick해 배포 후보 브랜치 `codex/ornscore-visual-renewal-finish` 구성
- 데이터 파일 되돌림 없이 홈 Hero, ScoreGauge/ScoreBadge/MetricBar/MetricChip, 후보 카드 비주얼 개선을 main에 반영
- `origin/main`에 `0a621d7`, `a1f2a4e` 푸시 완료
- 로컬 3000 preview를 새 빌드 기준으로 재시작해 사용자가 바로 확인 가능하게 열어둠

### 테스트 결과
- `npx tsc --noEmit`: 성공
- `python scripts/verify_metrics.py`: 성공, 138종목 오류 0건, 금칙어 0건, Metrics 2.4 일치
- `npm run build`: 성공, 172 static pages 생성
- 로컬 smoke: `/`, `/stocks`, `/stock/005930`, `/guide/metrics` 모두 HTTP 200
- 브라우저 확인: desktop/mobile에서 deep-blue Hero, white CTA, 점수 게이지 6개 렌더링, 390px 모바일 가로 넘침 없음

### 현재 상태
- 로컬 preview: `http://127.0.0.1:3000/`, PID 9372
- 공개 배포: GitHub `main` 푸시 완료, Vercel/도메인 반영 대기 또는 확인 단계

### 다음에 바로 실행할 작업
- `https://ornscore.com/` 반영 여부 확인
- 남은 디자인 확장은 `/today`, `/stocks`, `/stock/[ticker]`로 점수 UI를 확장하는 별도 작업으로 진행

> 최종 설계서(33섹션) 기준 진행 추적. 세션이 끊겨도 이 파일로 이어간다.
> 규칙: 작은 단위 plan→실행→검증(구문/compile)→기록. 위험한 것만 사용자 확인.
> 검증 도구: `node /tmp/syntaxcheck.js`(TS 구문) · `python3 scripts/verify_metrics.py`(데이터+브랜드 게이트) · Vercel 빌드(최종 타입게이트).
> 제약: OneDrive 폴더 → python/bash로만 편집(Edit 도구 한글 깨짐). 대괄호 경로 git add는 `--literal-pathspecs`. push 전 `git pull`(봇이 매일 커밋).
> ※ 검증 메모(Task 20): 이 세션에서 Edit 도구가 한글/UTF-8/LF를 보존함을 확인(편집 후 `xxd` 바이트 검사, `git diff --stat`이 변경 줄만 표기·전체 reflow 없음). surgical Edit는 안전, 다만 신규 파일 대량 작성은 기존 python 방식 권장.

## 2026-06-24 · 홈 비주얼 임팩트 강화 1.5차 — 딥블루 Hero + 점수 주인공화 (Task 22, Claude)
- 목표: Task 21(`a70d4b3`, 클린) 위에서 홈 첫 화면이 "확실히 달라졌다"고 느낄 만큼 시각 임팩트·금융 대시보드감을 강화. 설계서 `ornscore_design_improvement_spec.md` §2.1·§2.2·§6·§23. 기존 ScoreGauge/ScoreBadge/MetricChip/MetricBar/scoreColor 기반 **유지·개선**. 점수 계산식·데이터 생성·공시 분류 **무변경**, 비자문 톤, 신규 패키지 0, `layout.tsx` `max-w-5xl` 셸 무변경. branch `ai-center/task-22-ornscore-1.5`.
- 변경 3파일:
  - `home/HomeHero.tsx`: 배경을 **딥블루 패널**(`from-blue-800 via-blue-900 to-slate-900`, 다크 `from-blue-950 …`)로 전환 — 마케팅 그라데이션/`bg-clip-text` 장식 제거하고 차분한 금융 SaaS 톤. 좌측 화이트 카피(강조어 `text-sky-300`), 우측은 딥블루 위 **흰 카드 '미리보기 화면'**(`shadow-xl`·`ring`·상단 구분선)로 시각 무게를 또렷이 분리. 1순위 **ScoreGauge 80→104px**(showLabel+showOutOf, 여백↑) 주인공화, 2~3순위 컴팩트 랭킹 행(업종 보조). 하단 **KPI strip**을 아이콘+큰 숫자로 재구성(설계서 §6.4 순서: 공시 신호/거래활성도 급증/종합 80↑). primary CTA = 흰 solid(`bg-white text-blue-800` dominant), secondary = 흰 outline, 둘 다 `min-h-[44px]`+`focus-visible`. 짧은 1줄 고지 유지(상세는 하단 RiskNotice).
  - `home/StockCandidateCard.tsx`: 위계 재정렬(종목명 16px bold → 업종·코드 → 가격 → **ScoreGauge 72→84px showLabel** 핵심화 → 4지표 막대(연한 패널로 묶음) → 강점/주의 → CTA). 강점=초록 ✓ 마커+칩, 주의=주황 ! 마커+박스로 스캔 용이하게 분리. 모바일 1열·44px 유지, page.tsx 비자문 텍스트 그대로.
  - `lib/scoreColor.ts`: `good`(60~79) 밴드가 라이트모드에서 가장 약해 `fill`/`barFill` sky-500 → **sky-600** 대비만 소폭 강화(4밴드 임계·라벨·다크변형 불변). 전 클래스 정적 리터럴 유지(런타임 합성 0 — task-21 회귀 가드).
- 검증: `npx tsc --noEmit` exit 0(전후) · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·산식 2.4, exit 0) · `npm run build`(타입게이트·138p, exit 0) · 빌드 CSS에 4밴드 라이트+다크 bg/text + 딥블루 프레임(`from-blue-800`·`from-blue-950`·`via-slate-950`·`bg-sky-600`·`bg-sky-400`) 전수 존재(task-21 클래스 누락 회귀 0) · 로컬 prod(127.0.0.1:**3200** — 3100은 직전 세션 stale 서버 점유 회피, 운영자 3000 무중단) `/ /stocks /stock/005930 /guide/metrics` 200·에러 0. 홈 SSR: 104px·84px 게이지·딥블루 프레임·흰 primary CTA·KPI 3종·aria 게이지 6·강점/주의 5/5 렌더. 변경 3파일+ui/ 금칙어 grep 0.
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR/CSS grep+build 대체. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장**(360~390px Hero 스택·104px 리드 게이지·후보 카드 비빽빽·KPI 줄바꿈·CTA 44px·밴드 색).
- 잔여 리스크/다음: (1) 직전 세션 leftover `next start`가 3100 점유(PID 21332) — 운영자 정리 가능. (2) 딥블루 Hero·새 게이지는 홈 한정 — `/today` KPI/Top3·`/stocks` 히트맵·`/stock` 상세 게이지 확장이 다음(설계서 §7·§8.5·§9.3). (3) 전역 라이트 토큰(#F6F8FB)·외부 공개 주소 미갱신(범위 외).

## 2026-06-24 · 비주얼 리뉴얼 1차 — 홈 Hero + 점수 UI 기초 (Task 21, Claude)
- 목표: 설계서 `ornscore_design_improvement_spec.md` Phase 1(디자인 시스템 기초) + Phase 2(홈 리뉴얼) 일부 적용. 첫 화면에서 "점수 기반 한국 주식 탐색 대시보드"라는 인상을 강화하고, 점수를 서비스 주인공으로 만든다. 점수 계산식·데이터 생성·공시 분류 로직 **무변경**, 비자문 톤 유지. branch `ai-center/task-21-ornscore-1-hero-ui` @ `3e7b13e`(클린)에서 시작. 미리보기는 **http://127.0.0.1:3000**, 외부 공개 주소 갱신은 이번 범위 아님.
- 신규 디자인 시스템(재사용 기반):
  - ⭐ `src/lib/scoreColor.ts`: 점수→색/라벨 단일 소스(설계서 §5.4). 4구간 `{band,label,text,bg,border,badge,fill,track}` — 80↑ `강한 탐색 우선순위`(blue)·60~79 `확인 가치 있음`(sky)·40~59 `중립`(amber)·40↓ `우선순위 낮음`(zinc). 색만으로 전달 안 하게 모든 구간 한글 라벨 동반, 라이트/다크 변형 유지. `score.ts`·`grade.ts` 무변경.
  - ⭐ `src/components/ui/` 신규 4종(전부 서버 컴포넌트, 클라 훅 없음): `ScoreGauge`(순수 SVG 원형 게이지, stroke=currentColor로 다크 대응, 큰 tabular-nums 점수+구간 라벨+`aria-label`), `ScoreBadge`(점수+라벨 pill), `MetricChip`(지표명+값 칩, neutral/strong/muted 톤), `MetricBar`(0~100 가로 막대, 구간색 `text-*`→`bg-*` /g 치환, 점수 숫자 동반).
- 홈 리뉴얼:
  - `home/HomeHero.tsx`: 메인 카피 `오늘 볼 한국 주식, 점수로 먼저 좁혀보세요.`(§6.3), CTA `오늘 후보 보기`(#today-candidates)·`지표 이해하기`(/guide/metrics). 우측을 ad-hoc 4-스탯 dl → **대시보드 미리보기 카드**로 교체: 1순위 큰 `ScoreGauge`+강점 칩, 2~3순위 `ScoreBadge` 컴팩트 행, 80↑/거래급증/공시 3-스탯 요약. 배경 톤 blue/cyan 그라데이션 → 차분한 slate/blue 금융 톤(다크 변형 보존). props에서 미사용 upCount/downCount 제거, `previewCandidates`(top3) 추가.
  - `home/StockCandidateCard.tsx`: 종합점수를 `ScoreGauge`(size 72)로 주인공화, 4지표를 `MetricBar` 4줄로 시각화, **강점**(emerald `MetricChip`) vs **주의**(amber 박스) 명확 분리. 종목 메타에 업종(`sectorOf`) 추가. 모바일 grid-cols-1 세로 스택·CTA `min-h-[44px]` 유지.
  - ⭐ `home/FeatureCards.tsx`: 핵심 기능 3개 카드(§6.5) — 오늘의 후보(종합 80↑ N개)·공시 신호(최근 N건)·백테스트(위험 지표 포함). **홈에 없던 백테스트 진입점** 추가. `page.tsx`에서 DisclosureSignalSection 다음에 배치.
  - `app/page.tsx`: 후보 뷰모델에 `sector`+`m{momentum,flow,value,vol}` 추가(기존 `compositeOf`/`isSuspect`/`pickTopStocks`·카운트 무변경), Hero에 top3 전달, FeatureCards 연결.
- 고지 완화: 첫 화면(above-the-fold)은 Hero 하단 1줄 차분한 고지(`투자 추천이 아닌 데이터 기반 탐색 도구`)만, 상세 고지 박스(`RiskNotice`)는 하단 신뢰 레이어로 유지(§17).
- 카피 안전: 신규 문자열 전부 비자문(탐색 우선순위·확인 가치·강점·주의·확인 필요). 추천/매수/매도/수익 보장 톤 0 — 새/수정 파일 grep 시 `투자 추천이 아닌`(고지 부정문) 1건만.
- 검증: `npx tsc --noEmit` exit 0(전후 2회) · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·산식 버전 0불일치, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0) · 로컬 prod(127.0.0.1:3100, 내 PID(20584)만 taskkill, 3000·4310 무중단) `/ /stocks /stock/005930 /guide/metrics /backtest /disclosures` 전부 200·에러 마커 0. SSR grep: 메인 카피·미리보기 헤더·게이지 `aria-label="종합 점수"` 6개·강점 5블록·`위험조정` 막대 26개·`<svg` 35개·핵심기능/백테스트 카드·band 라벨 24개 렌더 확인.
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: 재빌드→3000 재기동 후 AI Center 브라우저 체크 권장**(stale 청크 회피) — 360~390px에서 ScoreGauge 가독성·후보 카드 세로 스택·터치 44px·band 색(blue/sky/amber/zinc) 확인.
- 잔여 리스크/결정: (1) 신규 점수 컴포넌트는 **홈에만** 적용 — `/stocks` 테이블·`/stock` 상세는 기존 UI 유지(다음 작업으로 재사용 확장 보류). (2) 밝은 금융 톤과 기존 다크 모드 공존 — 새 컴포넌트는 다크 변형 유지하나 전역 라이트 토큰 전환(#F6F8FB)은 미적용(범위 외). (3) `MetricBar`의 `text-*`→`bg-*` /g 치환은 토큰 네이밍 규약 의존(scoreColor가 `text-` 접두사 보장). (4) 외부 공개 주소 미갱신(범위 외).
- 다음 추천 작업: (a) 점수 컴포넌트를 `/stocks` 테이블 히트맵·`/stock/[ticker]` 상세 게이지로 확장(설계서 §8.5·§9.3, Phase 4·5). (b) Phase 3 오늘 페이지(`/today`) KPI/Top3 카드 리뉴얼. (c) 전역 라이트 금융 토큰(#F6F8FB) 도입 검토. (d) Playwright 모바일 게이트 자동화.

## 2026-06-24 · 세부 디자인·UX 다듬기 — 모바일/배지/문구 일관화 (Task 20, Claude)
- 목표: 원본 요청대로 큰 개편 없이 OrnScore 최근 작업(Task 14~18)의 거칠음을 정리. 8개 점검 화면(`/ /stocks /stock/005930 /disclosures /backtest /status /guide/metrics /guide/metrics/changelog`)에서 모바일 터치/넘침·배지 톤·문구(데이터 기준/산식/제한) 드리프트·다음 단계 링크·중복 카피를 손봄. 점수/데이터 생성 로직·레이아웃 구조 무변경, 비자문 톤 유지. branch `ai-center/task-20-ornscore-qa` @ `980758c`(클린)에서 시작.
- **미리보기 기준**: 사용자 확인 화면은 **http://127.0.0.1:3000**, 리뷰 기준은 **이 브랜치(`ai-center/task-20-ornscore-qa`)**. 외부 공개 주소(valuemap.kr) 갱신·릴리스는 **이번 범위 아님**(다음 작업으로 남김). 로컬에서 `npm run build`로 `.next`를 재생성했으므로, 운영자가 3000 미리보기를 `next start`로 돌리고 있었다면 **재기동 권장**(stale 청크 400 회피, PROGRESS 하단 Repair 노트 참고).
- 변경 파일(10개, surgical Tailwind/문구만):
  - 데이터 드리프트(단일 소스화): `guide/metrics/page.tsx`(밸류 한계 설명 `전체 138개 종목 풀` → `${dataMetadata.count}`), `backtest/page.tsx`(사용 데이터/벤치마크 `138개 종목`·`138종목` 2곳 → `${realStockPool.length}`). 산식 버전/기준일 표기는 이미 전부 `dataStatus` 파생이라 무변경(verify_metrics 버전 게이트 0불일치 재확인).
  - 배지 톤 일관화: `StocksExplorer.tsx` 헤더 ad-hoc 상태 pill(amber/emerald 수동) → 공유 `DataStatusBadge`(`@/components/trust/badges`, 라벨도 앱 공통 `갱신 지연`/`데이터 정상`·delayed=orange). `DisclosureExplorer.tsx`의 ad-hoc amber `일부 결과 · 최신 200건` 배지·안내문 → **limited=slate**(차분, 경고색 아님)로 통일해 `/disclosures` 헤더 `제한 수집`(slate)과 톤 맞춤. `home/HomeHero.tsx` 상태 점/텍스트 amber·green → 앱 공통 orange(지연)·emerald(정상)로 색 통일.
  - 모바일 터치 타깃: `home/StockCandidateCard.tsx`(종목 보기 `min-h-[40px]`→`44px`), `home/DisclosureSignalCard.tsx`(종목 보기/DART 버튼 `min-h-[44px] inline-flex items-center` 추가), `DisclosureExplorer.tsx`(기간 칩 `py-1`→`py-1.5`), `StocksExplorer.tsx`(조건 저장/알림 칩 `py-1`→`py-1.5`). 조밀한 필터 칩 군집은 44px 강제 시 레이아웃 왜곡이라 중간값으로 개선.
  - 다음 단계 CTA: 막다른 사이드 화면에 1줄 nav 추가 — `/backtest`(준비중·실데이터 두 분기)·`/status`에 `지표 계산 방식 보기 → (/guide/metrics)` + (백테스트)`데이터 상태 확인 →`·(상태)`산식 변경 이력 →`. 메인 흐름(홈→/stocks→상세→가이드)은 이미 연결돼 무변경.
  - 중복 카피 정리: `stock/PriorityScoreCard.tsx`의 `매수·매도 추천이 아닌 탐색 우선순위입니다.` 1줄 제거 — 바로 아래 `StockConclusionHero` 하단 고지 박스가 동일 문구를 표기(같은 화면 100px 내 중복). 필수 고지 라인은 보존(히어로 박스에 유지).
- 카피 안전: 신규/변경 사용자 노출 문자열 비자문만(갱신 지연·데이터 정상·일부 결과·지표 계산 방식 보기·데이터 상태 확인 등). 추천/매수/매도/수익 보장 톤 0. verify_metrics 금칙어 게이트 0건.
- 검증: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·산식 버전 0불일치, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0, `/stocks` 12.2 kB·`/disclosures` 9.54 kB) · 로컬 prod(127.0.0.1:3100, 내 PID(10808)만 taskkill, 4310 AI Dev Center·3000 미리보기 무중단) 8개 점검 라우트 전부 200·에러 마커 0. SSR grep 확인: /backtest `138개 종목`+신규 nav, /status 신규 nav, /guide/metrics `전체 138개 종목 풀`, /stocks `갱신 지연`(현재 지연 상태)·`데이터 정상` 공유 배지, /disclosures `제한 수집` 렌더.
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 브라우저 게이트 로컬 미가용. curl+SSR grep+build로 대체. **운영자: AI Center 브라우저 체크(http://127.0.0.1:3000) 권장** — 360~390px에서 후보/공시 카드 버튼 44px·기간 칩 탭, /stocks·홈 상태 배지 색(주황/에메랄드)·/disclosures 제한 배지 slate, /backtest·/status 하단 nav 줄바꿈, 종목 상세 고지 1줄(중복 제거) 확인.
- 잔여 리스크/결정: (1) 조밀 필터 칩은 44px 미만(py-1.5≈30px) — 칩 군집 시각 보존 위해 의도적 중간값. (2) `/backtest`의 두 긴 주의 문단(상단 요약 + 하단 방법론)은 역할이 달라 보존, 일부 어구(편도 0.3%·슬리피지) 중복은 잔존 — 필수 고지 삭제 리스크 회피 우선. (3) 클라이언트 컴포넌트(StocksExplorer/DisclosureExplorer)는 번들 비대화 회피 위해 `dataStatus` 직접 import 대신 props/리터럴 유지(제한 문구 `최신 200건`은 의미 동일). (4) 외부 공개 주소(valuemap.kr) 미갱신 — 의도된 범위 외.
- 다음 추천 작업: (a) **외부 공개 주소 갱신/릴리스 절차**(이번 보류분) — main 머지·Vercel 배포 후 valuemap.kr 확인. (b) DisclosureExplorer/StocksExplorer 제한 문구를 서버 props로 주입해 완전 단일 소스화. (c) Playwright 도입 시 360/390px 모바일 게이트 자동화. (d) 설계서 §23 3차 OrnScore 본작업(데이터 상태 자동검증 강화·CI 산식 버전 단언·백테스트 생존편향 실해결) 재개.

## 2026-06-24 · 데이터 신뢰 레이어 Phase 2 — 공시/백테스트/상태/산식 이력 확장 (Task 18, Claude)
- 목표: 설계서 `ornscore_data_trust_badge_spec_v1.md` 2차/3차 범위(§10.4·§10.5·§12·§13·§17.1). Task 17의 전역 `dataStatus` 단일 소스를 공시 제한 배지·백테스트 한계 배지·`/status` 분리 상태·산식 변경 이력·빌드 타임 버전 단언까지 확장. 투자 추천/매수 유도 카피 0(비자문 톤 유지). branch `ai-center/task-18-ornscore-phase-2` @ `87b606c`(클린)에서 시작.
- 변경/신규 파일:
  - `src/lib/dataStatus.ts`: ⭐ `domainStatuses`(가격/재무/공시/산식 4종, 각 `{key,label,status,statusLabel,meaning,detail}`) 추가 + `dataStatus.domainStatuses`로 노출. **실판정**: 재무는 `realStockPool`에서 PER/PBR 결측(0/비숫자) 종목 비율 > 3%면 `partial` 아니면 `normal`(현재 결측 1/138=0.7% → `normal`, detail에 결측 종목수 표기), 가격은 전역 `status`(stale→`delayed`) 재사용, 공시는 항상 `limited`(최신 200건), 산식은 `metricsVersion` 메타 유무로 `normal`/`error`. `EXPECTED_METRICS_VERSION="2.4"`·`metricsChangelogPath="/guide/metrics/changelog"` 상수 export(스펙 예시 날짜 하드코딩 안 함).
  - `src/app/disclosures/page.tsx`: 헤더에 `제한 수집` `DataStatusBadge`(limited 톤) + 필터 근처 `<details>` 접근 가능 보조설명(`dataStatus.limits.disclosure` + 누락 가능성). 서버 렌더 유지, 모바일 wrap.
  - ⭐ `src/components/BacktestLimitBadges.tsx`: 한계 배지 4종(`아이디어 검증용·현재 종합점수 검증 아님·생존편향 가능·슬리피지 단순화`) 차분한 slate pill, flex-wrap(모바일 2×2). 성과/수익/추천 표현 없음. `/backtest`(준비중 분기)·`BacktestClient`(실데이터 분기 헤더) **양쪽**에 배치(기존 긴 주의 문구 보존).
  - `src/app/status/page.tsx`: 기존 스냅샷 그리드 아래 `데이터 종류별 상태` 섹션 신설 — `dataStatus.domainStatuses`를 4행으로 매핑(`DataStatusBadge` 색+단어, 모바일 1열 스택). 기존 데이터 소스 리스트 보존, 가격은 `갱신 지연` 정직 유지(2026.06.16 staleness 미은폐), `/guide/metrics/changelog` 링크 추가. 신선도 재계산 안 함(단일 소스).
  - ⭐ `src/app/guide/metrics/changelog/page.tsx`: 산식 변경 이력 스켈레톤(서버, metadata, `← 지표 가이드로`). 현재 `Metrics 2.4`·적용일(`dataStatus.metricsEffectiveDate`)·변경 요약·`현재 운영` 배지·향후 변경 기록 위치 안내. 버전/적용일 전부 `dataStatus`에서 파생(하드코딩 0).
  - `src/app/guide/metrics/page.tsx`: 산식 버전 줄에 `산식 변경 이력 보기` 상호 링크 추가.
  - `src/lib/metrics.ts`: **드리프트 수정** — 주석의 `Metrics v2.3`(2곳)을 `Metrics 2.4`로 교정. 가이드가 GitHub `metrics.ts`(참조 구현)를 링크하는데 데이터/푸터는 2.4·주석은 v2.3로 어긋나던 공개 불일치(스펙 이슈1 P0). 빌드 단언이 실제로 잡아냄.
  - `scripts/verify_metrics.py`: §17.1 산식 버전 일치 단언 추가 — (a) `stocks.json metricsVersion == "2.4"`(EXPECTED_METRICS_VERSION) 단언, (b) `src/` 전체에서 하드코딩 `Metrics x.y` 토큰이 2.4와 다르면 검출(`RE_METRICS_TOKEN`). 둘 다 exit-1 경로에 합류. 기존 composite/momentum/브랜드 게이트 무변경.
- 카피 안전: 신규/변경 사용자 노출 문자열 비자문만(제한 수집·최신 200건·아이디어 검증용·생존편향 가능·산식 변경 이력 등). verify_metrics 금칙어 게이트 0건.
- 검증: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·**산식 버전 일치 0건 불일치**, exit 0 — 단, 1차 실행에서 metrics.ts v2.3 드리프트 2건 검출→교정 후 통과) · `npm run build`(타입게이트·138p 프리렌더, `/guide/metrics/changelog` 신규 라우트 추가, exit 0) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /disclosures /backtest /status /guide/metrics /guide/metrics/changelog /stock/005930` 전부 200. SSR grep: /disclosures `제한 수집`+`수집 범위 안내`, /backtest 4배지 전수, /status `데이터 종류별 상태`+가격(갱신 지연)·재무(데이터 정상·결측 detail)·공시(제한 수집)·산식(데이터 정상)·`산식 변경 이력` 링크, /guide/metrics/changelog `Metrics 2.4`·`현재 운영`, /guide/metrics `산식 변경 이력 보기` 링크 모두 렌더.
- 잔여 리스크: (1) 백테스트 배지는 두 분기 모두 코드/타입 통과하나 런타임은 활성 분기(현재 실데이터 ready)만 렌더. (2) `metricsEffectiveDate`는 전용 필드 부재로 generatedAt 파생(Task 17부터 동일). (3) financial partial 임계 3% 고정값(현재 결측 0.7%라 normal) — 결측 급증 시 partial로 자동 전환. (4) 산식 버전 단언은 데이터 메타+소스 리터럴만 검사(동적 `metricsVersionLabel` 표기는 항상 일치).
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: AI Center 브라우저 체크(http://127.0.0.1:3000) 권장** — /disclosures 제한 배지·필터 details 펼침, /backtest 4배지 모바일 2×2 wrap, /status 도메인 행 모바일 1열 스택·가로 오버플로 없음, changelog 라우트.
- 다음 구체 OrnScore 태스크(설계서 §23 3차): (a) 데이터 상태 자동 검증 로직 강화(공시 200건 도달 시 limited 실판정·최근 오류 로그 요약), (b) 산식 버전 불일치 배포 차단을 CI(GitHub Actions)에도 연결, (c) 결측률/지연 상태 사용자 공개 범위 조정 + 관리자용 경고, (d) 백테스트 생존편향 실해결(시점별 유니버스 재구성).

## 2026-06-24 · Repair · Task 17 신뢰 모달 포커스 가로채기 수정 (WCAG 포커스 순서, Claude)
- Blocker(리뷰 FAIL): `DataTrustModal`의 포커스 복귀 effect가 **초기 마운트에서도 실행**되어 모든 페이지 로드 때마다 헤더 트리거("데이터 기준 보기")로 키보드 포커스를 가로챔. `open` 초기값이 `false`이므로 `useEffect(() => { if (!open) triggerRef.current?.focus?.() }, [open])`가 마운트 시 `!open === true`로 즉시 발화 → DataTrustBar가 헤더/레이아웃에 전역 배치돼 앱 전체 영향(WCAG 2.4.3 포커스 순서 위반).
- Fix(`src/components/trust/TrustLayer.tsx`): 별도 포커스-복귀 effect 제거하고 복귀 로직을 **open effect의 cleanup으로 이동**. cleanup은 open이 true→false로 바뀔 때(또는 언마운트 시)에만 실행되므로 초기 마운트에서는 절대 발화하지 않음. 열릴 때 닫기 버튼 포커스 / 닫힐 때 트리거 복귀 동작은 동일 보존. 제거된 `eslint-disable react-hooks/exhaustive-deps`도 불필요(통합 effect deps `[open]` 완전 — 나머지는 stable ref/setState).
- Passed: `npx tsc --noEmit` exit 0. 동작 분석: 마운트(open=false)→effect early-return, cleanup 미등록 → 포커스 미탈취 / open false→true→닫기버튼 포커스 / true→false→cleanup이 트리거 복귀. 기능·문구·레이아웃 무변경(effect 2개→1개 통합, 순수 동작 수정).
- 잔여: lint는 프로젝트 ESLint 비대화식 미구성(next lint 설정 프롬프트)로 미실행 — tsc가 유효 게이트. Playwright 미구성으로 AI Center 브라우저 게이트는 운영자 확인 권장(모달 열기/ESC, 출처 배지 클릭).
- 다음 구체 OrnScore 태스크(불변): Phase 2 — (a) `/disclosures` `제한 수집` 배지, (b) `/backtest` 한계 배지 4종, (c) `/status` 섹션 확장 + `/guide/metrics/changelog` 스켈레톤, (d) 빌드 타임 산식 버전 일치 단언 + partial/limited/error 상태 실판정.

## 2026-06-24 · 데이터 신뢰 레이어 1차 — 전역 DataStatus + 신뢰 배지/모달 (Task 17, Claude · 4단계/Phase 1)
- 목표: 설계서 `ornscore_data_trust_badge_spec_v1.md` 1차 범위(§23 1차 개발). 전 페이지에 흩어진 데이터 기준일·산식 버전·데이터 상태·출처·제한·투자 고지를 **단일 `dataStatus` 소스 + 재사용 신뢰 배지**로 통합. Task 14(홈)·15(종목 상세)·16(/stocks) 완료본 위에서 시작(branch `ai-center/task-17-ornscore-1` @ `5112c14`, 클린 확인).
- 신규 파일:
  - ⭐ `src/lib/dataStatus.ts` — 전역 신뢰 단일 소스. `dataMetadata`(stocks.json)에서 파생: `globalAsOfDate`(20260616)·`globalAsOfLabel`(formatBizDateLong)·`marketDateLabel`(모바일 압축)·`status`(isDataStale→normal/delayed, partial/limited/error는 타입·메타 예약)·`statusLabel`/`statusMeaning`/`statusTone`·`universeCount`(138)·`metricsVersion`(2.4)·`metricsVersionLabel`(**단일 표기 "Metrics 2.4"**)·`metricsEffectiveDate`(전용 필드 부재 → generatedAt 날짜 파생 "2026.06.16")·`sources`(KRX/Naver Finance/yfinance/DART 사용목적 §9)·`notices`(투자/점수 비자문 고지)·`limits`(공시 200건·백테스트). 스펙 예시 날짜 하드코딩 안 함(실값만).
  - ⭐ `src/components/trust/badges.tsx` — 순수 프레젠테이션 프리미티브: `DataStatusBadge`(● + 상태 단어, 색상 외 단어 항상 노출 §20)·`AsOfDateBadge`·`MetricsVersionBadge`. 상태 톤 5색(normal emerald / partial yellow / delayed orange / limited slate / error red).
  - ⭐ `src/components/trust/TrustLayer.tsx`("use client") — `DataSourceBadges`(출처 배지: 클릭/포커스 토글 상세, hover 의존 금지, aria-expanded/describedby)·`DataTrustModal`(트리거 버튼 "데이터 기준 보기" → 다이얼로그: 기준일·출처·산식·상태·제한·투자 고지, ESC/닫기/백드롭, 열릴 때 닫기 버튼 포커스·닫힐 때 트리거 복귀)·`DataTrustBar`(데스크톱 전체 / 모바일 압축 1줄 + 트리거). 서버가 `dataStatus`를 직렬화 props로 주입(클라이언트가 stocks.json 미번들).
- 통합(전 화면 단일 소스 참조):
  - `src/components/AppHeader.tsx`: 기존 서브바(둘째 줄) 우측에 `MetricsVersionBadge`(sm+) + `DataTrustModal` 트리거 추가. 기존 날짜/신선도 표시·KRX·Naver 텍스트·WelcomeToast 보존, 둘째 바 신설 안 함(`sm:hidden`/`hidden sm:inline` 반응형 유지).
  - `src/app/layout.tsx` 푸터: 날짜·산식·상태를 전부 `dataStatus`로 교체("데이터 {globalAsOfLabel} 장마감 · 산식 Metrics 2.4 · 데이터 상태 …"). realStocks 직접 import 제거.
  - `src/app/guide/metrics/page.tsx`: **`Metrics v{ver}` → `metricsVersionLabel`("Metrics 2.4")로 stray `v` 제거** + 적용일 표기. (스펙 §3.2/이슈1 P0 해소.)
  - `src/app/status/page.tsx` 스냅샷 산식 버전: `metricsVersionLabel`.
  - `src/components/stock/PriorityScoreCard.tsx` + `src/app/stock/[ticker]/page.tsx`: 점수 카드 칩·데이터 기준 블록 산식 버전을 `metricsVersionLabel`로 통일(칩의 "산식 " 중복 접두 제거 → "Metrics 2.4").
  - `/stocks`(StocksExplorer)는 이미 "Metrics {ver}" = "Metrics 2.4" 렌더 → 무변경(일치 확인).
- 카피 안전: 신규/변경 파일 비자문(기준일·출처·산식·상태·제한·non-advice)만. 금칙어 grep 0(추천 종목/매수 후보/상승 가능성/급등 예상 등). 투자 고지는 설계서 §21 지정 부정문만.
- 검증: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /stocks /stock/005930 /guide/metrics /status` 전부 200·에러 마커 0, **5라우트 모두 "Metrics 2.4" 노출·"Metrics v" 0건·as-of 2026.06.16 일치**, 헤더 "데이터 기준 보기" 트리거·출처 사용목적(PER·PBR·ROE·배당) SSR 렌더, 푸터 "산식 Metrics 2.4" 렌더.
- 중요 관찰: 실데이터가 기준일(20260616)로부터 6영업일 경과 → `dataStatus.status = "delayed"`("갱신 지연"). 따라서 헤더(amber)·푸터("갱신 지연 확인")·모달·`/status`("갱신 지연 가능")가 **모두 동일하게 지연 상태 정직 표기**(스펙 예시의 "정상"은 당일 데이터 가정). 상태 시스템이 의도대로 단일 소스에서 일관 동작함을 입증.
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: AI Center 브라우저 체크(http://127.0.0.1:3000) 권장** — 모달 클릭 열기/ESC·닫기, 출처 배지 클릭 툴팁, 모바일 압축 1줄·오버플로 없음(`/ /stocks /stock/005930 /guide/metrics /status`).
- 잔여 리스크: (1) status는 Phase-1에서 normal/delayed만 계산(partial/limited/error는 타입·메타만 예약, 정적). (2) metricsEffectiveDate는 전용 필드 부재로 generatedAt 날짜 파생(스펙 §8의 전용 적용일 필드 없음). (3) Nice-to-have 미착수(아래 다음 태스크).
- 다음 구체 OrnScore 태스크(설계서 §23 2차/3차 · Phase 2): (a) `/disclosures` 헤더 `제한 수집` 배지 + 기간 필터 툴팁, (b) `/backtest` 상단 한계 배지 4종(아이디어 검증용·현재 종합점수 검증 아님·생존편향 가능·슬리피지 단순화), (c) `/status` 섹션 확장(가격/재무/공시/산식 분리 상태) + `/guide/metrics/changelog` 스켈레톤, (d) 빌드 타임 산식 버전 일치 단언(§17.1) 및 partial/limited/error 상태 실판정(재무 결측률·공시 200건 도달).

## 2026-06-24 · 종목 탐색 필터 UI 1차 — 질문형 탐색 보드 (Task 16, Claude)
- 목표: 설계서 `ornscore_stock_filter_ui_spec_v1.md` 1차 범위(§24). `/stocks`를 '단순 필터/정렬 화면'에서 '질문형 주식 탐색 보드'로 개편 — 첫 화면 3초 안에 "질문을 누르면 오늘 확인할 종목이 자동으로 좁혀지는 화면" 가치 전달. 비자문 톤 유지(확인 후보/먼저 볼 종목/급등 사유 확인 톤, 추천·매수 언어 금지).
- 변경 파일:
  - `src/app/stocks/page.tsx`: `dataMetadata·formatBizDateLong·isDataStale` import, 종목별 `r3m`(returns.r3m) 추가, `StocksExplorer`에 `totalCount·asOf·metricsVersion·dataStale` props 전달. 계산은 전부 서버사이드 유지, plain props. `?theme=` 딥링크·`revalidate=3600`·`generateMetadata` 보존.
  - `src/lib/savedSearches.ts`: `SavedSearchConfig`에 `momentumMin/flowMin/valueMin/volMin?` 추가(저장/알림 config가 새 점수-min 필드 보존, jsonb 저장이라 마이그레이션 불필요).
  - `src/components/StocksExplorer.tsx`(대규모 개편, 전부 보존+추가):
    1) 헤더: 제목 `오늘 확인할 종목 찾기`·본문·`조건 충족 N / 전체 {total}`·`{asOf} 장마감 · Metrics {ver} · 데이터 정상/지연` 배지·상시 `투자 추천 아님 · 탐색 도구` 고지.
    2) 질문형 프리셋 8종을 **카드 UI**로 격상(섹션 `어떤 종목을 찾고 있나요?` + 보조문구, 데스크톱 3열/모바일 1열 스택). 카드 = 심볼·제목·설명·조건 배지(config에서 도출)·예상 결과 수(전체 풀 독립 계산)·선택 상태(`aria-pressed`·✓·블루). 기존 5종 config 보존 + 신규 3종(밸류+추세 동시 value70·momentum70·vol50 / 최근 흐름 강한 momentum80+주의 / 급등했지만 위험한 r3m desc+주의). 클릭=적용, 재클릭=해제(toggle).
    3) 빠른 프리셋 칩(보조)을 설계서 11종으로 확장(저평가/추세 강세/저PBR/밸류+추세/균형 종목/ROE 우수/배당 있음/대형주/소형주/급등 위험/거래 급증), 단일 선택·선택 강조(✓). 질문 카드와 시각 구분(칩 vs 카드).
    4) **현재 적용 조건 요약 바**(결과 바로 위, 상시): 조건 태그(activeChips 재사용)·`조건 충족 N / 전체 M`·자연어 설명(`describeConditions()` — 필터없음/테마/질문형/상세 4상태)·`조건 저장`/`이 조건 알림`/`초기화`(초기화는 §16대로 confirm). 기존 별도 칩 행은 요약 바로 통합(중복 제거).
    5) 정렬 `<optgroup>` 3그룹화(ORNSCORE 점수 5종+거래활성도 / 재무 5종 / 움직임·위험 r3m). 변동성·낙폭 정렬은 필드 미전달이라 다음 태스크로 명시.
    6) 결과 카드 = '탐색 후보 카드': insights 혼합 블록을 `✓ 강점`(emerald, 점수≥70)·`⚠ 주의`(amber, 점수<40·가격 하락 중·r3m≥50 급등 주의) 두 그룹으로 분리(색+아이콘+텍스트). 종목명/코드/시장/가격/등락/시총/종합·4지표/핵심 재무/테마·`/stock/{ticker}` Link prefetch=false 보존.
    7) 결과 없음 강화: 제목 `조건에 맞는 종목이 없습니다.`+본문+`조건 완화하기`/`전체 종목 보기`(둘 다 resetFilters).
    8) 상세 필터: 기본 접힘 유지(데스크톱 아코디언/모바일 바텀시트), ORNSCORE 지표 슬라이더(종합+추세/거래활성도/밸류/위험조정) 추가로 새 min 조정 가능. 기존 컨트롤 0 제거.
- 순수 로직 분리: `matchesConfig(stock, FilterConfig)`(기존 filtered와 동일 의미, 새 min은 0이면 비제약)·`presetToConfig`·`presetCounts`(전체 풀 독립 카운트, count-vs-full-pool 주석). 기본 `/stocks` 결과셋은 default config(PER 200·PBR 30 상한, 나머지 0)에서 기존과 동일.
- 카피 안전: 신규/변경 파일 금칙어 13종 grep 0(급등할 종목/사야 할 종목/추천 종목/매수 후보/상승 가능성/급등 예상/수익 기대/매수 적기/투자 매력도 등). 위험 질문(최근 흐름·급등 위험)은 `급등 사유 확인 필요` 톤만.
- 검증: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0, `/stocks` 11.8 kB) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /stocks /today /disclosures /stock/005930` 200·에러 마커 0, `/stocks` SSR에 신규 카피(제목·`어떤 종목을 찾고 있나요`·`현재 조건`·`투자 추천 아님`·`급등했지만 위험한 종목`·`밸류 + 추세 동시`·`강점`·`주의`·`ORNSCORE 점수` optgroup) 렌더. `?theme=2차전지`(URL 인코딩) 200·테마칩·테마 describe 문장 렌더(딥링크 보존).
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 브라우저 게이트 로컬 미가용. curl smoke + SSR grep + build로 대체. **운영자: AI Center 브라우저 체크(http://127.0.0.1:3000, `/stocks` 포함) 실행 권장** — 질문 카드 그리드·선택 상태·요약 바·강점/주의 분리·정렬 그룹·모바일 1열 스택·터치 타겟 확인.
- 잔여 리스크/결정: (1) `/stocks`는 클라 컴포넌트라 초기 상태는 SSR, 인터랙션은 CSR. (2) presetCounts는 '그 프리셋만 적용 시 N개'(현재 활성 필터와 무관) — 의미를 카드에 '예상 결과'로 표기. (3) 빠른 칩은 이번 패스 단일 선택(설계서 §9 다중 AND는 다음 태스크). (4) 변동성·낙폭 정렬은 필드 미전달로 보류.
- 다음 구체 OrnScore 태스크(설계서 §24 2차): (a) 탐색 모드 탭(질문/지표/직접) + 보기 방식(카드/표/압축) 추가, (b) 빠른 칩 다중 선택 AND + 칩 변경 시 실시간 예상 결과 수, (c) 결과 없음 자동 완화 제안(예: 밸류 80+→70+로 N개 추가), (d) 변동성·낙폭 정렬용 volStats 필드(annualStd·maxDrawdown)를 page.tsx에서 전달.

## 2026-06-24 · 종목 상세 결론 카드 1차 (Task 15, Claude)
- 목표: 설계서 `ornscore_stock_detail_conclusion_card_spec_v1.md` 1차 범위. 종목 상세 상단을 '정보 나열'에서 '결론 카드'로 개편 — 첫 화면 10초 안에 ①이 종목은 어떤 성격의 후보인가 ②왜 우선 확인 후보인가 ③다음에 무엇을 확인할까 에 답. 비자문 언어 유지(추천/미래가격 금지, 확인/우선/급등 사유 확인 톤).
- 신규 컴포넌트(전부 서버·순수 프레젠테이션, Write로 UTF-8/noBOM/LF 작성):
  - `src/components/stock/StockConclusionHero.tsx` — 상단 결론 카드 컴포저. 모바일 순서: 종목명/현재가 → 탐색 우선도 → 현재 결론 → 강점/주의 → 다음 확인 → 고지. 위험 경고(급등/과열)는 점수 카드와 분리된 별도 바.
  - `StockHeader.tsx`(업종 태그·종목명 최대·코드 + LivePrice/관심·비교·공유 슬롯 + 기준일 장마감 라벨), `PriorityScoreCard.tsx`(라벨 '탐색 우선도'·`N / 100`·전체/업종 순위·필수데이터%·이상값 점검·산식 버전·'매수·매도 추천이 아닌 탐색 우선순위' 고지·인디고+중립 팔레트), `ConclusionSummaryCard.tsx`(제목 '현재 결론'·유형+요약+주의점), `StrengthWarningPanel.tsx`(강점 emerald / 주의 amber, md 2열·모바일 스택, '확인 필요' 톤), `NextActionButtons.tsx`(공시로 이유 확인 #disclosures / 재무로 실적 확인 #financials / 점수 계산 근거 #basis / 업종 내 위치 보기 #summary, min-h-44px).
  - `src/lib/conclusion.ts` — `classifyConclusion({momentum,flow,value,vol,surge3m})` 순수 함수. 설계서 §6.3 표를 보수적 우선순위로 매핑(균형형/저평가+추세/시장 관심 급증/과열 주의/저평가 대기/단기 이슈 확인/변동성 주의). summary는 강점·약점만 기술(방향 예측 금지), riskNote는 확인 톤. 강점>=70·주의<50으로 페이지 기존 convention과 일치.
- `src/app/stock/[ticker]/page.tsx`: 기존 `<header>`+'결론 헤드라인' 섹션을 `<StockConclusionHero .../>`로 교체. 이미 계산된 값(composite·reason·ranks·completeness·surge3m·dataWarnings·mySector·priceAsOf·metricsVersion) 재사용. 강화 고지 2줄('매수·매도 추천이 아닌 탐색 우선순위'+'향후 수익률을 의미하지 않습니다') 노출. 죽은 코드 정리(scoreTone/tone/grade/gradeOf 제거 — 구 헤드라인 전용). RecentViewTracker·breadcrumb·JSON-LD·StockTabs(요약/재무/공시/점수 근거)·generateStaticParams·revalidate 전부 보존. isSuspect(dataWarnings) 임시 점수 회색+고지·Top제외 의미 보존.
- 설계 결정/잔여: (1) 업종 비교 전용 탭 부재 → '업종 내 위치 보기'는 같은 업종 비교 섹션이 든 요약 탭(#summary) 연결, 2차에서 전용 탭+스무스 스크롤. (2) Nice-to-have(레벨드 RiskAlertCard 완전분리·4지표 미니바·초보자 체크리스트 상단)는 광범위 리팩터 회피 위해 보류 — 단, 급등≥80/과열≥50 위험 바 + 강점/주의 패널로 '점수-위험 분리·강점/주의 시각 분리' 완료 기준은 충족, 초보자 체크리스트는 기존 BeginnerReading(요약 탭)에 존재.
- 카피 안전: 신규/변경 파일 금칙어 13종(지금 살 만한·상승 가능성·매수 적기·저점 기회·목표가·수익 예상·추천 종목·매수 후보·투자 매력도·급등 예상·수익 기대 등) grep 0.
- 검증: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0) · 로컬 prod(127.0.0.1:3100, 내 PID만 taskkill, 4310 AI Dev Center 무중단) `/ /today /stocks /disclosures /stock/005930` 200·에러 마커 0. 종목상세 SSR HTML에 탐색 우선도/현재 결론/강점/주의/4개 다음확인 버튼 라벨/2줄 고지 렌더, 히어로가 '자체 지표 4종' 차트보다 먼저(offset 20557 < 41128).
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 브라우저 게이트 로컬 미가용. curl smoke + SSR grep + build로 대체. **운영자: AI Center 브라우저 체크(http://127.0.0.1:3000, 종목 상세 라우트 포함) 실행 권장**.
- 위험/한계: 다음확인 앵커(#disclosures 등)는 StockTabs의 클라 hashchange로 탭 전환 — SSR엔 요약 탭만, 앵커 라벨은 빌드 청크/DOM에 존재. 업종 비교 전용 탭은 미구현(요약 탭 대체).
- 다음 구체 태스크(Phase 2, 설계서 §17 2차 개발): (a) 레벨드 RiskAlertCard 완전 분리(변동성·낙폭 단계), (b) 4지표 미니바 히어로 추가(요약 탭 MetricStrip 중복 없이 단일 소스), (c) 업종 비교 전용 탭 신설 + 다음확인 버튼 스무스 스크롤/탭 전환 인터랙션.

## 2026-06-24 · 홈 첫 화면 개편 1차 — 탐색 대시보드 (Task 14, Claude)
- 목표: 설계서 `ornscore_home_redesign_spec_v1.md` 1차 범위. 홈을 '서비스 소개'에서 '오늘의 투자 탐색 대시보드'로 전환. 첫 화면 3초 안에 "오늘 볼 종목을 138개에서 5개로 줄여주는 한국 주식 탐색 보드" 가치 전달. 비자문 언어 유지(추천 종목/매수 후보/상승 가능성/급등 예상/수익 기대 금지).
- 신규 컴포넌트(전부 서버 컴포넌트, 순수 프레젠테이션, python으로 UTF-8 작성 — OneDrive 한글깨짐 회피):
  - `src/components/home/HomeHero.tsx` — 메인/서브 카피(설계서 §15 그대로) + CTA 3종(`오늘의 후보 보기`#today-candidates 앵커 / `종목 직접 찾기`/stocks / `지표 계산 방식 보기`/guide/metrics) + 베타·기준일·정상/지연 pill + 우측 미니 대시보드(종합80+/거래활성도급증/공시신호/상승·하락).
  - `src/components/home/MarketSnapshotCards.tsx` — 4카드(분석종목·종합80+후보·거래활성도급증·공시신호), 데스크톱 4열/모바일 2열.
  - `src/components/home/TopCandidateSection.tsx` + `StockCandidateCard.tsx` — 상위 5 후보(순위·종목명·코드·현재가·3개월등락·종합/100·강점지표2개·주의문구·종목보기 CTA). 빈 데이터 graceful fallback.
  - `src/components/home/DisclosureSignalSection.tsx` + `DisclosureSignalCard.tsx` — 상위 3 공시(유형태그·종목·제목·날짜·확인포인트·종목보기/DART원문). 호재/악재 숫자 미표시 + 분류 신뢰도 고지.
  - `src/components/home/HowItWorksSection.tsx`(3단계) + `RiskNotice.tsx`(투자추천아님/과거데이터/사용자책임, 모바일에서도 항상 노출).
  - `src/lib/homeSnapshot.ts` — `volumeSpikeCount` 파생 헬퍼.
- `src/app/page.tsx` 재작성: 데이터 패칭·계산 전부 서버사이드 유지(단일 데이터 소스·SSR 경계). 뷰모델(candidates/signalVMs)을 서버에서 만들어 plain props로 전달. WelcomeOnboarding·metadata·`revalidate=3600`·푸터(데이터 출처/약관) 보존.
- 설계 결정(중요):
  1) **volumeSpikeCount는 파생 추정값**: 전용 데이터 없어 `flowStats.ratio>=1.5`(최근5일/20일 거래대금), ratio 결측 시 `flow>=75` 폴백. 상수·주석으로 교체 용이하게 격리. → Phase-2에서 실제 거래량 급증 소스로 교체.
  2) **공시 분류 신뢰도 숫자 미표시**: `strength`는 신호 유형별 하드코딩 상수(진짜 per-공시 분류 신뢰도 아님)라 숫자 날조 대신 고지 문구만 노출. note 필드(호재/악재 표현 섞임)는 렌더 안 하고 유형별 중립 '확인 포인트'로 대체.
  3) **콘텐츠 최대폭은 기존 셸 `max-w-5xl` 유지**(설계서 1180px는 앱 셸과 충돌 → 새 폭 강제 안 함). 기존 레이아웃 래퍼(`src/app/layout.tsx`) 그대로 사용.
  4) **스냅샷 카드 딥링크**: `/stocks`는 `?theme=`만 지원(점수80 필터·거래활성도 정렬 URL 파라미터 없음) → 일반 `/stocks`·`/disclosures`로 연결, 딥링크는 Phase-2 후속.
  5) strongCount는 후보 리스트와 동일한 `!isSuspect` 필터로 내부 일관(스냅샷↔후보 카운트 불일치 방지).
- 카피 안전: 신규 파일 금칙어 0(`추천 종목|매수 후보|상승 가능성|급등 예상|수익 기대|매수 기회|호재 확정|악재 확정|안전한 종목` grep 0). '매수 추천'은 설계서 지정 부정문("매수 추천이 아니라")에서만 등장.
- 검증: `npx tsc --noEmit` exit 0 · `python scripts/verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0) · 로컬 prod(127.0.0.1:3000, 내 PID만 종료) `/ /today /stocks /disclosures /stock/005930` 200·에러 마커 0, 홈 SSR에 신규 카피(`오늘 볼 종목`·`오늘의 시장 스냅샷`·`오늘 추가 확인 후보`·`분류 신뢰도`·`거래활성도 급증`·CTA 3종) 렌더, 후보 카드 5개·공시 카드 3개 확인.
- 게이트 한계: 이 저장소엔 Playwright 미구성 → AI Center DESKTOP/MOBILE 브라우저 게이트 로컬 미가용. curl smoke + SSR HTML 콘텐츠 grep으로 대체. **AI Center 브라우저 체크(http://127.0.0.1:3000) 운영자 실행 권장** — 히어로/4스냅샷/5후보/3공시(호재악재 미표시)/CTA/고지/모바일 가로 오버플로 확인.
- 위험/한계: (a) volumeSpikeCount는 프록시(실 거래량 급증 데이터 아님). (b) 공시 per-건 분류 신뢰도 실값 부재(고지로 대체). (c) 후보 강점지표는 4지표 상위2 단순 추출. (d) DART 원문/공시 enrich 수치는 운영자가 DART 키로 `fetch_*_details.py` 실행 시에만 노출(graceful no-op).
- 다음 구체 태스크(Phase 2): (a) 후보 카드 hover 인터랙션. (b) `/stocks`에 score80 필터·거래활성도 정렬 URL 파라미터 추가 후 스냅샷 카드 딥링크 연결. (c) 실제 거래량 급증 데이터 소스 → homeSnapshot 교체. (d) 데이터 상태 배지 전역 통일.

## 2026-06-24 · Pass 12 · 종목별 StockDisclosures 수집 기준 신선도 라벨 (Task 36, Claude)
- 목표: Pass 11이 /disclosures(시장 전체 explorer)에 붙인 '수집 기준 · {KST} · {출처}' 신선도 라벨을, Pass 11·Repair 패스가 '다음 로컬 태스크 (a)'로 carry해 온 대로 **종목 상세의 종목별 공시 카드(StockDisclosures)** 헤더에도 동일 적용. 사용자가 종목 상세에서 보는 공시 묶음이 언제·어디서(실시간/저장본/예시 표본) 수집됐는지 1줄로 표기. 투자 로직·점수·신호강도·분류 전부 무변경(순수 additive UI/payload).
- 변경 파일/내용:
  - `src/app/api/disclosures/[ticker]/route.ts`: live payload(`source:"live"`)에 `fetchedAt: new Date().toISOString()` 추가, catch의 sample 폴백 `NextResponse.json` 반환에도 `fetchedAt` 추가. cache 분기는 저장된 payload를 `...spread` 하므로 fetchedAt를 자동 carry(원수집 시각 보존). `detectSignals`·`enrichCorrection→…→enrichInsider` 합성 체인·scoring·count 전부 무변경. recent/route.ts(Pass 11에서 처리)와 동일 패턴.
  - `src/components/StockDisclosures.tsx`: `ApiResponse`에 `fetchedAt?: string` 추가, `sourceKo`(SourceBadge와 동일 매핑: 실시간/저장본/예시 표본)·`fmtKST`(명시 timeZone=Asia/Seoul, NaN/undefined 가드, SSR/CSR 일관) 헬퍼를 DisclosureExplorer와 바이트 동일하게 추가, 헤더 flex 바로 아래 `text-[11px] text-zinc-500 dark:text-zinc-400` muted 라벨 1줄(`-mt-2 mb-3 tabular-nums`). 시각·출처 둘 다 없으면 null 반환(graceful), 시각만 없으면 '수집 시각 미상'. 기존 SourceBadge는 그대로 유지(라벨과 배지 출처 키 일관).
- 카피 안전: 신규 사용자 노출 문자열은 `수집 기준` + 포맷된 숫자(KST 시각)뿐 — 매수/매도/추천/호재 판단어 없음. verify_metrics 금칙어 게이트 무충돌(0건 확인).
- 검증: `python scripts/verify_metrics.py`(PYTHONUTF8=1·PYTHONIOENCODING=utf-8) 통과(138종목 0오류 · compositeScore/모멘텀 백분위 정합 · 브랜드/금칙어 0, exit 0) / `npx tsc --noEmit` exit 0 / `npm run build` 성공(타입게이트 통과·종목 138p 프리렌더, exit 0) · 빌드 청크 grep: `수집 기준` 문자열이 신규로 `.next/static/chunks/app/stock/[ticker]/page-*.js`에 컴파일됨(기존 `app/disclosures/page-*.js`와 함께 2곳) / 로컬 prod 서버(127.0.0.1:3100, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단) `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0, `/api/disclosures/005930?days=90&limit=20` 200·error null·source=sample·**fetchedAt 존재**(신규 폴백 경로 확인)·count 4, `/api/disclosures/recent` 200·error null·source=sample·fetchedAt 존재·signalCount 12. StockDisclosures 라벨은 클라 useEffect fetch라 SSR HTML엔 미존재 → 청크 문자열 존재로 컴파일 확인.
- 게이트 한계: 이 저장소엔 Playwright config/스크립트가 없어(`playwright.config.*`·tests/·e2e/ 부재, package.json에 playwright 스크립트 없음) AI Center DESKTOP/MOBILE 브라우저 게이트는 로컬 미가용 — curl smoke로 /stock/[ticker] 200·에러 마커 0(하이드레이션/404 회귀 없음)으로 대체.
- Operator-only blocker(변동 없음): DART 키 필요 fetch 스크립트(`fetch_*_details.py` → `public/data/*-signals.json`)는 로컬 미실행 → enrich 수치·실제 source=live는 키 주입 후에만 노출(현재 graceful no-op·source=sample/cache). single_contract/correction의 `⚠️ operator-verify` 정규식(`RE_AMOUNT`/`RE_RATIO`/`RE_BEFORE`/`RE_AFTER`/`RE_FIELD`)은 실보고서 본문 대조 필요.
- Next two local tasks: (a) `src/lib/signalDetailsShared.ts`의 `toEok`/`matchRow`에 단위 수준 assertion(원→억원 반올림·빈 배열·rcept_no 매칭/폴백 경계) 추가 — Node/tsx 로컬 실행 또는 타입게이트로 검증. (b) 6개 `*Clause()` enrich 빌더가 공유하는 "parts 배열을 ` · `로 join" 패턴을 공통 빌더로 추출해 중복 축소 — 순수 리팩터, tsc/build로 검증.

## 2026-06-23 · Pass 10 공시 enrich 공통 util 추출 — 중복 축소 리팩터 (Task 33, Claude)
- 목표: Pass 9가 '다음 패스 (b)'로 남긴 "6개 enrichX lib의 lazy-load·rcept_no 매칭·원→억원 헬퍼를 단일 util로 통합해 중복 축소"를 해소. 동작·점수·신호·노출 문자열 전부 무변경(순수 내부 리팩터). 라우트 2종은 손대지 않음.
- 변경 파일/내용:
  - ⭐ `src/lib/signalDetailsShared.ts` 신설 — 5개 enrich lib이 각자 복붙하던 공통 3종을 한 곳으로: (a) `loadSignalFile<T>(filename)` — 모듈 단위 `Map<string, unknown>` 캐시로 같은 `public/data/*-signals.json`을 최대 1회만 `fs.existsSync`+try/catch로 읽고 없으면 graceful `{}` 반환(파일이 없는 경우도 캐시해 재시도 방지). (b) `matchRow<T extends {rcept_no?: string}>(rows, rceptNo)` = `rows.find(r=>r.rcept_no===rceptNo) ?? rows[0]`. (c) `toEok(won)` = `Math.round(won/1e8)`. enrichX 고유 로직(signalType 가드·note 문자열)은 util에 두지 않음.
  - `src/lib/{insider,treasury,capital,contract,correction}Details.ts` 5종 리팩터 — 각자 갖던 `let cache`/`let loaded`/`function load()`(15줄)와 `rows.find(...) ?? rows[0]`, `Math.round(x/1e8)`을 shared util 호출로 위임. 각 파일의 `import fs`/`import path` 제거(이제 shared가 담당). 각 `enrichX(...)` 시그니처·signalType 가드·strength/direction 처리·생성 note 문자열(`취득예정`/`발행규모`/`계약금액`/`직전매출 대비`/`정정 전 … → 정정 후`/`보유 …주·비율 …%`/`장내매수 확인`) **전부 바이트 동일**. `matchRow`가 `T | undefined`를 반환하므로(빈 배열 honest 타입) 각 lib에 절대 발화 안 되는 `if (!match) return signal;` 가드 1줄 추가(rows 비어있지 않음이 직전에 보장되어 런타임 무영향·출력 동일).
  - `src/app/api/disclosures/{[ticker],recent}/route.ts` — **무변경**(export된 `enrichX` 시그니처 그대로 소비).
- 카피 안전: 신규 사용자 노출 문자열 0(util 주석만 추가, note 문자열 무변경). verify_metrics 금칙어 게이트 무충돌.
- 검증: `python scripts/verify_metrics.py`(PYTHONIOENCODING=utf-8) 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(타입게이트 통과·6 lib 타입 통일 확인·종목 138p 프리렌더, exit 0 — 리팩터가 컴파일·타입 정합됨을 보증하는 1차 게이트) / 공유 서버 청크 `.next/server/chunks/7381.js`에 6종 포맷(`취득예정`·`발행규모`·`계약금액`·`정정 전`·`직전매출 대비`·`장내매수 확인`) 전부 잔존 확인 / 로컬 프로덕션 서버(127.0.0.1:3100, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0, `/api/disclosures/recent`(source=sample·error null·signalCount 12)·`/005930`(source=cache·error null·signalCount 3) 200 = shared 로더가 graceful no-op 경로를 보존함 확인(로컬에 *-signals.json 없음).
- 위험/한계: 순수 리팩터라 외부 동작 변화 없음. `*-signals.json` 미존재 시 enrich 미노출은 정상 graceful no-op(이전과 동일). 운영자 전용 잔여는 그대로: DART 키로 fetch 스크립트 실행해 `*-signals.json` 생성, 단일계약·정정의 `⚠️ operator-verify` 정규식 실보고서 대조.
- 다음 패스(2개·구체·로컬 검증 가능): (a) 공시 explorer 카드별 데이터 신선도(수집 기준일) 라벨 패스 — UI 전용, 빌드·렌더로 검증 가능. (b) 각 lib의 `*Clause()` 빌더가 공유하는 "parts를 ` · `로 join" 패턴을 공통화하거나, `toEok`/`matchRow`에 단위 수준 assertion 추가.

## 2026-06-23 · Pass 9 공시 핵심 숫자 — 정정(correction) 본문 정정 전/후 수치 (Task 31, Claude)
- 목표: Pass 8이 '다음 패스'로 남긴 '본문 XML 스캐폴드 패턴을 correction enrich로 확장'을 해소. 단일계약(Pass 8 contractDetails)과 동일한 §18.2 document.xml 본문 파싱 + graceful 앱 경로를 정정공시에 적용. 구조화 엔드포인트가 없는 마지막 비구조화 경로(단일계약·정정) 중 정정을 메움. 투자 로직·점수·신호 강도 전부 무변경, 사실 수치만.
- 변경 파일/내용:
  - ⭐ `src/lib/correctionDetails.ts` 신설 — `contractDetails.ts` 미러. `correction-signals.json` lazy try/catch 로드(없으면 `{}` → graceful no-op). `CorrectionRow {rcept_no, field?, before?, after?, date?}`. `correctionClause()`는 before·after가 모두 유한 숫자이고 억원 반올림 후 서로 다를 때만 ` · {항목명 }정정 전 X억원 → 정정 후 Y억원` 사실 절 생성(원→억원 형제 enrich와 동일 단위, 손실 정정 대비 부호 보존, null/NaN/하이픈 방어, 동일값이면 생략). `enrichCorrection(stockCode, signal)`는 `signal.signalType==="correction"` + 매칭 행(`rcept_no` 일치, 폴백 `rows[0]`)일 때만 `signal.note`에 절 덧붙임. `strength`·`direction`·점수·타입·다른 파일 무변경. `fs`/`path` import만.
  - ⭐ `scripts/fetch_correction_details.py` 신설 — `fetch_contract_details.py` 미러(운영 전용, 로컬 미실행). `load_key()`·`build_corp_map()`·`corp_code_map.json` 캐시 재사용, `RE_REPORT_NM=re.compile("정정")`, list.json으로 정정 보고서 rcept_no 수집 → `document.xml`(zip) 다운로드 → 태그 제거 평문화 → `RE_BEFORE`/`RE_AFTER`(정정 전/후 원 단위 수치, 콤마·음수 허용)·`RE_FIELD`(손익 항목명) 추출 → `public/data/correction-signals.json`(ticker → `[{rcept_no, field, before, after, date}]`). 전·후 값이 모두 있어야 행 생성(graceful skip). per-call `time.sleep(0.12)` 한도 보호. **본문 양식·정규식·zip 여부 전부 `⚠️ operator-verify`** — 정정공시는 정정사유만 서술하고 수치표가 없는 경우도 많아 실보고서 1~2건으로 확인 후 교정 필수.
  - `src/app/api/disclosures/{[ticker],recent}/route.ts` — `enrichCorrection`을 최외곽 래퍼로 추가(`enrichCorrection(code, enrichContract(code, enrichCapital(code, enrichTreasury(code, enrichInsider(code, sig)))))`). recent 라우트 `!` non-null 단언·ticker 라우트 인자 형태 각각 보존. UI/컴포넌트 편집 0건(`StockDisclosures.tsx`가 이미 `signal.note` 렌더).
- 카피 안전: 신규 문자열(`정정 전 X억원 → 정정 후 Y억원`·항목명)은 숫자·항목 사실만 — 매수/매도/추천/호재 판단어 없음. verify_metrics 금칙어 게이트 무충돌.
- 검증: `python scripts/verify_metrics.py`(PYTHONIOENCODING=utf-8) 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(타입게이트 통과·종목 138p 프리렌더, exit 0) / 공유 서버 청크 `.next/server/chunks/7381.js`에 신규 포맷(`정정 전 ${...}억원 → 정정 후`)이 형제 절(`계약금액`·`발행규모`·`취득예정`)과 함께 존재 확인 / 로컬 프로덕션 서버(127.0.0.1:3100, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0, `/api/disclosures/recent`(source=sample)·`/005930`(source=cache) 200·error null = graceful no-op 확인(로컬에 correction-signals.json 없음).
- 위험/한계: 정정 절은 `correction-signals.json` 생성 후에만 화면에 뜸. 로컬엔 DART 키·해당 파일이 없어 런타임 미노출 = 정상 graceful no-op(시각 검증은 server 청크 문자열 존재로 대체). 정정 본문은 양식 편차가 커 RE_BEFORE/RE_AFTER/RE_FIELD가 추정 단계 — 운영 키 실호출 검증 전엔 활성화 보류.
- 남은 블로커(운영자 전용): 송님이 DART 키로 `python scripts/fetch_correction_details.py` 실행 → `public/data/correction-signals.json` 생성 후, `⚠️ operator-verify` 정규식을 실제 정정보고서 1~2건 본문과 대조해 매핑만 교정. (구조화 엔드포인트 5종=임원·자기주식·유증·CB·BW는 enrich 경로 확보 완료, 비구조화 2종=단일계약·정정은 본문 스캐폴드 완료·정규식 운영 검증 대기.)
- 다음 패스(2개·구체·로컬 검증 가능): (a) 공시 explorer 카드별 데이터 신선도(수집 기준일) 라벨 패스 — UI 전용, 빌드·렌더로 검증 가능. (b) 6개 `enrichX` lib(insider·treasury·capital·contract·correction + 공통)의 lazy-load·원→억원 헬퍼를 단일 util로 통합해 중복 축소 — 리팩터, 타입게이트로 검증 가능.

## 2026-06-23 · Pass 8(Campaign 8) 공시 데이터 신뢰도 — BW 구조화 enrich + 단일계약 본문 XML 스캐폴드 (Task 29, Claude)
- 목표: Pass 7이 마감한 '구조화 엔드포인트 4종(임원·자기주식·유증·CB)' 위에, ① 같은 구조화 패턴으로 **신주인수권부사채(BW)** 한 종을 더 메우고(완전 구현·저위험), ② 남은 유일한 비구조화 경로인 **단일계약 본문(document.xml) 파싱**을 오프라인 스캐폴드+graceful 앱 경로로 착수. 투자 로직·점수·신호 강도 전부 무변경, 사실 숫자만.
- PRIMARY(완전 구현):
  - `src/lib/disclosure-signals.ts` — `RE_BW = /신주인수권부사채[권]?\s*발행/` 추가, `detectCapitalRaise`가 `isBw`도 수용(`kind = isRights ? "유상증자" : isCb ? "전환사채" : "신주인수권부사채"`). signalLabel은 `${kind} 발행`, strength 65 유지(다른 디텍터 무변경). RE_CB(`전환사채…`)와 RE_BW(`신주인수권부사채…`)는 서로 매칭 안 됨.
  - `scripts/fetch_capital_details.py` — `fetch_bw(key,corp,bgn,end)` 신설(`bwbdIsDecsn.json` 미러, 권면총액 `bd_fta`·자금목적 `fdpp_*` 동일 구조), 종목당 rows = 유증+CB+BW(호출 3회). `bd_fta`·행사기간(`ex_pd_bgd/edd`) 필드는 `⚠️ operator-verify` 주석. **로컬 실행 안 함**(키·원격호출 없음).
  - `src/lib/capitalDetails.ts` — 무변경. kind/amount/fundsUse에 대해 이미 일반적이라 BW 행(kind="신주인수권부사채")이 그대로 통과(재확인 완료).
  - UI 보라 배지: `StockDisclosures.tsx`(SIGNAL_BG)·`DisclosureExplorer.tsx`(SIGNAL_STYLES+SIGNAL_DESCRIPTIONS)에 `"신주인수권부사채 발행"` 보라 항목 추가(유증/CB와 동일 팔레트). 누락 시에도 zinc 폴백이라 graceful.
- SECONDARY(오프라인 스캐폴드 + 문서화된 블로커용 graceful 앱 경로):
  - ⭐ `scripts/fetch_contract_details.py` 신설 — 설계서 §18.2 본문 파싱 스캐폴드. list.json으로 '단일판매·공급계약' 보고서 rcept_no 수집 → `document.xml`(zip) 다운로드 → 태그 제거 평문화 → 정규식으로 계약금액(원)·직전매출 대비 비율(%) 추출 → `public/data/contract-signals.json`(ticker → `[{rcept_no, amount, salesRatio, date}]`). `load_key()`·`build_corp_map()`·`corp_code_map.json` 캐시 재사용. **본문 양식·정규식(RE_AMOUNT/RE_RATIO)·zip 여부는 전부 `⚠️ operator-verify`** — 실보고서로 확인 후 교정. **로컬 실행 안 함.**
  - ⭐ `src/lib/contractDetails.ts` 신설 — `capitalDetails.ts` 미러. `contract-signals.json` lazy try/catch 로드(없으면 `{}` → graceful no-op), `enrichContract(stockCode, signal)`는 `signalType==="single_contract"` + 매칭 행이 있을 때만 `· 계약금액 X억원 · 직전매출 대비 Y%` 사실 절 덧붙임(원→억원 반올림, salesRatio 유한 양수 가드, null/빈값 방어). 다른 파일·SignalHit 타입 무변경.
  - `src/app/api/disclosures/{[ticker],recent}/route.ts` — `enrichContract`를 최외곽 래퍼로 추가(`enrichContract(code, enrichCapital(code, enrichTreasury(code, enrichInsider(code, sig))))`). recent 라우트의 `!` non-null 단언 보존. UI 렌더 변경 0(note 한 줄 기존 렌더).
- 카피 안전: 신규 문자열(`신주인수권부사채 발행`·`계약금액 X억원`·`직전매출 대비 Y%`)은 숫자·기관/계약 사실만 — 매수/매도/추천/호재 판단어 없음. verify_metrics 금칙어 게이트 무충돌.
- 검증: `python scripts/verify_metrics.py`(PYTHONIOENCODING=utf-8) 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(타입게이트 통과·종목 138p 프리렌더) / 공유 서버 청크 `.next/server/chunks/5337.js`에 신규 포맷(`신주인수권부사채`·`계약금액`·`직전매출 대비`)이 Pass 7 `발행규모` 절과 함께 존재 확인(enrich는 서버 라우트 코드) / 로컬 프로덕션 서버(127.0.0.1:3000, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0, `/api/disclosures/recent`(source=sample)·`/005930`(source=cache) 200·error null = graceful no-op 확인(로컬에 capital/contract-signals.json 없음).
- 위험/한계: BW 절·계약 절은 각각 `capital-signals.json`(BW 포함)·`contract-signals.json` 생성 후에만 화면에 뜸. 로컬엔 DART 키·해당 파일이 없어 런타임 미노출 = 정상 graceful no-op(시각 검증은 server 청크 문자열 존재로 대체, sample에 가짜 수치 주입은 오인 위험이라 의도적으로 안 함). 단일계약 본문 파싱은 보고서 양식 편차가 커 정규식이 추정 단계 — 운영 키 실호출 검증 전엔 활성화 보류.
- 남은 블로커(정확화): 구조화 엔드포인트 5종(임원·자기주식·유증·CB·BW) enrich 경로 확보 완료. 단일계약은 본문 스캐폴드까지 깔렸고, 정정(correction) 본문(정정 전후 수치)은 아직 미착수.
- 다음 패스(2개·구체·로컬 검증 가능): (a) 본문 XML 스캐폴드 패턴을 correction(정정) enrich로 확장 — 정정 전후 수치 추출, contractDetails와 동일 graceful 패턴. (b) 공시 explorer 명료화 / 카드별 데이터 신선도(수집 기준일) 라벨 패스 — UI 전용, 로컬에서 빌드·렌더로 검증 가능.

## 2026-06-23 · Pass 7 공시 핵심 숫자 — 증자·전환사채 발행 규모 노출 (Task 27, Claude)
- 목표: Pass 6(treasury_buy)가 '다음 패스'로 남긴 capital_raise(증자·CB)를, 투자 로직 무변경으로 동일한 graceful 패턴으로 한 단계 더. 유상증자/전환사채는 자기주식취득·임원 소유보고와 함께 DART가 **본문 XML 없이 구조화 엔드포인트로 규모를 노출**하는 유형이라 가장 보수적인 다음 step.
- 구조화 엔드포인트 근거: 유상증자(`piicDecsn.json`)·전환사채(`cvbdIsDecsn.json`)는 주요사항보고서 구조화 정보(발행금액·자금조달 목적)를 제공. 단일계약(single_contract)·정정(correction)은 여전히 구조화 엔드포인트가 없어 §18.2 본문 XML 파싱 필요 — 이번 패스는 capital_raise만 한정.
- 변경 파일/내용:
  - ⭐ `scripts/fetch_capital_details.py` 신설 — `fetch_treasury_details.py` 미러. `load_key()`·`build_corp_map()`·`corp_code_map.json` 캐시 재사용, 종목당 `piicDecsn.json`+`cvbdIsDecsn.json` 2회 호출(기간 bgn_de/end_de 필수, 최근 365일) → `public/data/capital-signals.json`(ticker → `[{rcept_no, kind, amount, fundsUse, periodBgn, periodEnd, date}]`, kind∈유상증자/전환사채). **로컬 실행 안 함**(키 없음·원격 호출 없음). 필드명(CB 권면총액 `bd_fta`, 유상증자 자금목적 `fdpp_fclt`/`fdpp_op` 등)은 DART 문서 기준 추정 → "⚠️ operator-verify" 주석으로 운영 키 실호출 검증 요청.
  - ⭐ `src/lib/capitalDetails.ts` 신설 — `treasuryDetails.ts` 미러. `capital-signals.json` lazy-load(try/catch, 파일 없으면 `{}`), `enrichCapital(stockCode, signal)`는 `signal.signalType === "capital_raise"` + 매칭 행이 있을 때만 `capitalClause()`로 사실 절(` · 발행규모 X억원 · 자금용도 시설/운영`, 양수·유한수 가드, 원→억원 반올림, fundsUse는 빈값·`-` 방어한 사실 분류 문자열일 때만) 덧붙임. 없으면 원본 그대로. `strength`·`direction`·점수·신호 로직·다른 파일 무변경. `fs`/`path` import만(형제 lib과 동일).
  - `src/app/api/disclosures/{[ticker],recent}/route.ts` — 기존 합성에 `enrichCapital`을 최외곽으로 추가(`enrichCapital(code, enrichTreasury(code, enrichInsider(code, sig)))`). UI 편집 0건(`StockDisclosures.tsx`가 이미 `d.signal.note` 한 줄 렌더).
- 카피 안전: 새 문자열(`발행규모 X억원`·`자금용도 …`)은 숫자·사실 분류만 — 증자는 희석 요인이라 호재/악재 판단어를 일절 넣지 않고 규모·용도만 기술. verify_metrics 금칙어 18종(매수/매도/추천/호재 확정 등)과 무충돌, 투자 자문 표현 신규 유입 0.
- 검증: `python scripts/verify_metrics.py`(PYTHONIOENCODING=utf-8) 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(전 라우트 프리렌더, 종목 138p, 타입게이트 통과) / 빌드 산출물 공유 서버 청크 `.next/server/chunks/3162.js`에 신규 포맷(`발행규모`·`자금용도`)이 Pass 6 treasury 절(`취득예정`·`취득금액`)과 함께 존재 확인(enrich는 서버 라우트 코드라 공유 server 청크에 위치) / 로컬 프로덕션 서버(127.0.0.1:3000, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0, `/api/disclosures/recent`(source=sample)·`/005930`(source=cache) 200·error null = graceful no-op 확인.
- 위험/한계: 새 발행규모 절은 `capital-signals.json` 생성 후에만 화면에 뜸. 로컬엔 DART 키·해당 파일이 없어 런타임에서 절 미노출 = 정상 graceful no-op(시각 검증은 server 청크 문자열 존재로 대체, 데모 sample에 가짜 발행 수치 주입은 사용자 오인 위험이라 의도적으로 안 함). 필드 매핑(`bd_fta`·`fdpp_*`)은 operator-verify 상태 — **송님이 `python scripts/fetch_capital_details.py`(DART 키) 실행** 시 `piicDecsn`/`cvbdIsDecsn` 실응답으로 확인 후 필요 시 매핑만 교정.
- 남은 블로커(정확화): 이제 구조화 엔드포인트가 있는 공시 4종(임원 보유변동·자기주식취득·유상증자·전환사채)은 모두 graceful enrich 경로 확보. 남은 단일계약(계약금액·직전매출 비율)·정정 본문은 구조화 엔드포인트가 없어 여전히 §18.2 DART 보고서 본문(XML) 파싱 파이프라인 필요.
- 다음 패스(1개·구체): single_contract/correction을 위한 §18.2 본문 XML 파서 착수(현재 미구현·유일하게 남은 비구조화 공시 경로). DART `document.xml` 다운로드 → 계약금액·직전매출 비율 추출 스캐폴드부터.

## 2026-06-23 · Pass 6 공시 핵심 숫자 — 자기주식 취득 규모 노출 (Task 25, Claude)
- 목표: Pass 5가 '다음 패스'로 남긴 treasury/contract 핵심 숫자를, 투자 로직 무변경으로 임원 보유변동과 동일한 graceful 패턴으로 한 단계 더. 자기주식 취득은 임원 소유보고(elestock)와 함께 DART가 **본문 XML 없이 구조화 엔드포인트로 규모를 노출**하는 몇 안 되는 유형이라 가장 보수적인 다음 step으로 선택.
- 구조화 엔드포인트 근거: 단일계약(single_contract)·정정(correction)은 구조화 엔드포인트가 없어 여전히 §18.2 본문 XML 파싱이 필요하지만, 자기주식 취득(`tsstkAqDecsn.json`)·증자/CB(`piicDecsn.json`/`cvbdIsDecsn.json`)는 주요사항보고서 구조화 정보가 있음. 이번 패스는 그 중 treasury_buy 신호(`자기주식 취득`)만 한정.
- 변경 파일/내용:
  - ⭐ `scripts/fetch_treasury_details.py` 신설 — `fetch_insider_details.py` 미러. `load_key()`·`build_corp_map()`·`corp_code_map.json` 캐시 재사용, `tsstkAqDecsn.json`(기간 bgn_de/end_de 필수, 최근 365일) 호출 → `public/data/treasury-signals.json`(ticker → `[{rcept_no, acqCnt, acqAmount, periodBgn, periodEnd, date}]`). **로컬 실행 안 함**(키 없음·원격 호출 없음). 필드명(`aqpln_stk_ostk`·`aqpln_prc_ostk`)은 DART 문서 기준 추정 → "⚠️ operator-verify" 주석으로 운영 키 실호출 검증 요청.
  - ⭐ `src/lib/treasuryDetails.ts` 신설 — `insiderDetails.ts` 미러. `treasury-signals.json` lazy-load(try/catch, 파일 없으면 `{}`), `enrichTreasury(stockCode, signal)`는 `signal.signalType === "treasury_buy"` + 매칭 행이 있을 때만 `treasuryClause()`로 사실 절(` · 취득예정 N주 · 취득금액 X억원`, 양수·유한수 가드, 원→억원 반올림) 덧붙임. 없으면 원본 그대로. `strength`·점수·신호 로직·다른 파일 무변경. `fs`/`path` import만(형제 lib과 동일).
  - `src/app/api/disclosures/{[ticker],recent}/route.ts` — 기존 `enrichInsider` 호출을 `enrichTreasury(...)`로 합성(`enrichTreasury(code, enrichInsider(code, sig))`). UI 편집 0건(`StockDisclosures.tsx`가 이미 `d.signal.note` 한 줄 렌더).
- 카피 안전: 새 문자열(`취득예정 N주`·`취득금액 X억원`)은 숫자·사실만 — verify_metrics 금칙어 18종(매수/매도/추천/호재 확정 등)과 무충돌, 투자 자문 표현 신규 유입 0.
- 검증: `python scripts/verify_metrics.py`(PYTHONIOENCODING=utf-8) 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(전 라우트 프리렌더, 종목 138p, 타입게이트 통과) / 빌드 산출물 공유 서버 청크 `.next/server/chunks/2140.js`에 신규 포맷(`취득예정`·`취득금액`·`억원`)이 Pass 5 임원 절(`보유 `·`비율 `·`장내매수 확인`)과 함께 존재 확인(enrich는 서버 라우트 코드라 공유 server 청크에 위치) / 로컬 프로덕션 서버(127.0.0.1:3000, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0, `/api/disclosures/recent`·`/005930` 200(source=sample 폴백).
- 위험/한계: 새 취득 절은 `treasury-signals.json` 생성 후에만 화면에 뜸. 로컬엔 DART 키·해당 파일이 없어 런타임에서 절 미노출 = 정상 graceful no-op(시각 검증은 server 청크 문자열 존재로 대체, 데모 sample에 가짜 취득 수치 주입은 사용자 오인 위험이라 의도적으로 안 함). 필드 매핑은 operator-verify 상태 — **송님이 `python scripts/fetch_treasury_details.py`(DART 키) 실행 시** 실제 필드 확인 후 활성화.
- 남은 블로커(정확화): 단일계약 계약금액·직전매출 비율, 정정 본문은 구조화 엔드포인트가 없어 여전히 §18.2 DART 보고서 본문(XML) 파싱 파이프라인 필요. 증자·CB는 구조화 엔드포인트(`piicDecsn.json`/`cvbdIsDecsn.json`)가 있어 이번 패턴으로 확장 가능.
- 다음 패스(1개·구체): capital_raise 신호를 증자(`piicDecsn.json`)·CB(`cvbdIsDecsn.json`) 구조화 엔드포인트로 동일 graceful 패턴 확장(발행 규모·자금용도) **또는** single_contract/correction을 위한 §18.2 본문 XML 파서 착수.

## 2026-06-22 · Pass 5 공시 핵심 숫자(보유 수량·비율) 노출 (Task 23, Claude)
- 목표: 공시 카드 유용성을, 투자 로직 무변경으로 한 단계 더. 직전 패스들이 '다음 제안'으로 남긴 '공시 카드 DART 핵심 숫자 노출'을 **이미 수집 스크립트가 쓰고 있으나 앱이 읽지 않던** 임원 보유 수량·비율로 한정해 안전하게 해소.
- 조사 결과(데이터 형태 확인): `scripts/fetch_insider_details.py`가 elestock.json에서 `ownCnt`(보유 수량)·`rate`(보유 비율)를 이미 `insider-signals.json`에 기록 중. 그러나 `src/lib/insiderDetails.ts`의 `InsiderRow`는 이 두 필드를 읽지 않아 화면에 못 떴음. **신규 파싱·본문 XML 없이** 기존 구조화 데이터를 표시만 하면 됨 → 가장 보수적인 useful step.
- 변경 파일/내용(`src/lib/insiderDetails.ts` 단일):
  - `InsiderRow`에 `ownCnt?: number`·`rate?: string` 추가(스크립트가 이미 쓰는 필드).
  - `holdingClause()` 헬퍼 신설: 값이 있을 때만 `· 보유 N주 · 비율 X%` 사실 절 생성(보유수량 양수 + 비율 유한수치 가드, `%`/공백/`-` 방어). 값 없으면 빈 문자열(graceful).
  - `enrichInsider`의 방향 텍스트(`장내매수 확인 (보고자, +N주)` 등)는 그대로 두고 끝에 보유 절만 덧붙임. `strength`·신호 로직·점수·다른 파일 무변경. import·의존성·신규 props 0건(`StockDisclosures.tsx`가 이미 `d.signal.note`를 `text-[11px]` 한 줄로 렌더 → 데이터 있으면 자동 노출).
- 카피는 사실·비자문 유지: 새 문자열(`보유 N주`·`비율 X%`)은 verify_metrics 금칙어 18종과 무충돌, 투자 자문 표현 신규 유입 없음.
- 검증: `python scripts/verify_metrics.py`(UTF-8) 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(전 라우트 프리렌더, 종목 138p, 타입게이트 통과) / 빌드 산출물 `.next/server/app/api/disclosures/{[ticker],recent}/route.js`에 신규 포맷 문자열(`장내매수 확인`·`보유 `·`비율 `) 존재 확인(enrichInsider는 서버 라우트 코드라 client 청크 아닌 server 번들에 위치) / 로컬 프로덕션 서버(127.0.0.1:3000, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0.
- 위험/한계: 새 보유 절은 `insider-signals.json` 생성 후에만 화면에 뜸. 로컬엔 DART 키·해당 파일이 없어 API가 sample 폴백(`source: cache/sample`) → 임원 note는 휴리스틱 문자열만 보임(런타임에서 보유 절 미노출 = 정상 graceful no-op). 실제 노출은 **송님이 `python scripts/fetch_insider_details.py`(DART 키) 실행해 `public/data/insider-signals.json` 생성 시** 활성화. 시각 검증은 server 번들 문자열 존재로 대체(데모 sample에 가짜 보유수치 주입은 사용자 노출 '예시 표본' 오인 위험이라 의도적으로 안 함).
- 남은 블로커(정확화): 자기주식 취득/처분 수량·금액, 단일계약 계약금액·직전매출 비율, 증자·CB 규모, 정정 본문 등 **나머지 공시 핵심 숫자는 `list.json`에 없고 설계서 §18.2 DART 보고서 본문(XML) 파싱 파이프라인이 미구현이라 여전히 차단**. 임원 보유변동만 elestock 구조화 엔드포인트 덕에 본문 파싱 없이 가능했음.
- 다음 패스(1개·구체): §18.2 본문 파싱 파이프라인 구축 **또는** 유형별 구조화 엔드포인트 추가 수집(예: 자기주식 취득 수량용 `tsstk.json`)로 treasury/contract 핵심 숫자도 동일 graceful 패턴으로 노출.

## 2026-06-22 · Pass 4 공시·데이터 신뢰도 폴리시 (Task 21, Claude)
- 목표: 첫 사용자 관점에서 공시 카드의 팔레트 불일치·정보 부족·신선도 문구를 소폭 다듬어 신뢰감 보강. 투자 로직·산식 무변경, className/카피만. OneDrive 규칙대로 python(utf-8/LF) 편집.
- 직전 패스(Task 18)가 남긴 1순위 항목 '`StockDisclosures` `gray-*`→`zinc-*` 팔레트 통일 + 공시 note 노출' 해소.
- 변경 파일/내용(`src/components/StockDisclosures.tsx` 단일):
  - **팔레트 통일**: 잔존 `gray-*` 13곳 전부 앱 공통 `zinc-*`로 교체(border/text/hover/active/dot). 다크모드 갭 2곳 보강 — `getBadgeClass` 폴백 배지에 `dark:bg-zinc-800 dark:text-zinc-300`, 로딩 스켈레톤 4줄에 `dark:bg-zinc-800` 추가(이전엔 다크에서 흰 막대로 떴음). grep 결과 `gray-` 토큰 0건.
  - **DART 이해도**: 각 공시 카드 배지 행 아래에 이미 계산돼 있던 `d.signal.note`(예: `장내매수 확인 (보고자, +N주)`·`계약금액·직전매출 비율은 본문 확인 권장`)를 muted 한 줄(`text-[11px] text-zinc-500 dark:text-zinc-400`)로 노출. 새 파싱·props·import·의존성 없음(기존 enrich 결과 표시만).
  - **신선도 문구**: 헤더 `최근 90일 {count}건 신호 {signalCount}건` → `최근 90일 · 공시 {count}건 · 신호 {signalCount}건`(구분점으로 가독성만 개선). 빈 상태 중립 학습 문구는 그대로 유지.
- 카피는 학습용·비자문 유지(매수/매도/추천 신규 유입 없음). 노출되는 note 문자열 10종이 금칙어 18종과 충돌 없음 확인(모두 '확인 권장/필요' 중립 톤).
- 검증: `python scripts/verify_metrics.py` 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(전 라우트 프리렌더, 종목 138p) / 로컬 프로덕션 서버(127.0.0.1:3000, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0. 공시 카드는 client+fetch 게이트라 서버 HTML엔 없어 빌드 청크(`app/stock/[ticker]`)에서 신규 zinc 폴백 배지·note 서브라인 클래스·`유형 자동분류` 문자열 존재 확인.
- 위험/한계: 공시 카드는 client 렌더라 헤드리스 브라우저 없이 픽셀 확인 불가(빌드 청크 문자열·클래스 존재로 검증). note 노출은 enrich 데이터(insider-signals.json) 유무에 graceful — 없으면 휴리스틱 note, 있으면 실제 방향·규모.
- 다음 패스 제안(1개): 공시 카드 DART 본문 핵심 숫자(취득/처분 수량·금액·계약금액 비율) 추출 노출 — 설계서 §18.2, 현재 본문 파싱 미구현이라 블로킹.

## 2026-06-22 · Pass 3 daily-use clarity (Task 18, Claude)
- 목표: 첫 사용자 관점에서 여전히 미완성으로 느껴지는 라벨·빈 상태·신선도 표현을 소폭 보강. 기존 작업(워크트리 clean·stash 0) 보존, OneDrive 규칙대로 python(utf-8/LF)로만 편집.
- 점검 6개 화면(home/today/stocks/watchlist/compare/공시·상세): home·today·stocks·관심종목 빈상태·비교 빈상태·StocksExplorer는 이미 1~2차 패스로 명료화 완료 → 무변경. 신선도(홈 히어로 pill·/today 헤더·푸터)는 모두 `dataMetadata`+`isDataStale` 단일 출처 사용 확인. 사용자 노출 '밸류맵/ValueMap' 잔재 0건(grep).
- 변경 파일/카피:
  - `src/components/WatchlistClient.tsx` — '최근 본 종목' 빈 상태가 한 줄뿐이던 것을 가치 설명(방문 종목 자동 기록·다시 찾기 쉬움) + 최근 10개 한도 안내 + '종목 탐색하러 가기' CTA로 보강(디자인 설계서 §7 history 빈상태 🟡 해소).
  - `src/components/StockDisclosures.tsx` — ① 종목별 공시 빈 상태 '공시가 없습니다'에 "공시 없음은 호재도 악재도 아님" 중립 학습 문구 추가(비자문). ② 소스 배지 영어 Live/Cache/Preview → 한글 실시간/저장본/예시 표본 + 의미 title 툴팁 + 다크 변형(이전 '영어라벨 한글화' 기조 일치).
  - `src/components/CompareClient.tsx` — 비교 화면 다크모드 가독성: 지표 막대 값(text-zinc-900 → 다크 미지정으로 어두운 배경에 거의 안 보이던 것)·막대 트랙·재무 표 best/일반 셀·각주 초록 강조·테마 칩에 누락된 `dark:` 변형 추가(레이아웃·로직 무변경, className만).
- 카피는 학습용·균형·비자문 유지(매수/매도/추천 신규 유입 없음).
- 검증: `python scripts/verify_metrics.py` 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(전 라우트 프리렌더, 종목 138p) / 로컬 프로덕션 서버(127.0.0.1:3000, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /watchlist /compare /disclosures /stock/005930` 모두 200·에러 마커 0. 빈상태/배지는 client+localStorage·fetch 게이트라 서버 HTML엔 없어 빌드 청크에서 신규 문자열 존재 확인(watchlist·stock·compare 청크).
- 위험/한계: 빈 상태·소스 배지·다크 가독성은 client 렌더라 헤드리스 브라우저 없이 픽셀 확인 불가(빌드 청크 문자열·클래스 존재로 검증). StockDisclosures는 여전히 구식 `gray-*` 팔레트(나머지는 `zinc-*`) — 이번엔 범위 한정 위해 미통일.
- 다음 패스 제안(1개): StockDisclosures 전체 `gray-*`→`zinc-*` 팔레트 통일 + 공시 카드 DART 본문 핵심 숫자(취득/처분 수량·금액) 추출 노출.

## 2026-06-21 · AI Dev Center Pass 2 UI 명료화 (Task 14, Claude)
- 목표: P0 패스 이후 실사용 명료화. 기존 작업분(미커밋 3파일) 보존하며 점검·소폭 보강 후 검증·커밋.
- 종목탐색(StocksExplorer): ① 질문형 프리셋(자연어 클릭) — "싸고 거래 늘었나/돈 잘 버는 회사/배당 주는 우량주/대형주 안정형/숨은 소형 저평가" 5종, ② 적용 중 필터를 사람이 읽는 칩으로 노출(칩별 × = 해당 필터만 해제) + 전체 초기화, ③ 헤더에 "조건 충족 N개 / 전체 M개" 가시 카운트.
- 오늘(today): ① "후보를 볼 때 체크리스트" 섹션 신설(원문 확인·고점추격 위험·저평가 이유·점수는 우선순위일 뿐·분산은 스스로 — 비자문 고지 포함), ② 후보 카드별 한 줄 💡 이유 유지(종합/저평가/추세 각 reason 함수).
- 공시(DisclosureExplorer): 카드에 유형 자동분류·종목 식별·제출인(flr_nm)·핵심 note 노출 + 원문 보기 / 종목 상세 / 관심(분석 대상 종목 한정 낙관적 토글) 액션. 분석 대상 외 종목은 DART 원문만 안내.
- 카피는 학습용·비자문 유지(매수/매도/추천 신규 유입 없음).
- 검증: `python scripts/verify_metrics.py` 통과(138종목 오류 0 · 브랜드/금칙어 0) / `npm run build` 성공(전 라우트 프리렌더) / 로컬 프로덕션 서버(127.0.0.1:3000, 시작 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /stocks /today /disclosures /stock/005930` 모두 200·에러 마커 0·UI 마커(질문형 프리셋·체크리스트·💡·원문 보기·제출·관심·조건충족 카운트) 렌더 확인.
- 다음 패스 제안: /stocks 모바일 바텀시트 필터 칩 동기화, 비교 모바일 카드 패턴, 공시 카드 DART 본문 핵심 숫자 추출(취득/처분 수량·금액), 종목상세 결론-위험-근거 재배치.

## 2026-06-20 · AI Dev Center P0 브리프 검증 패스 (Claude)
- 워크트리의 진행분(브랜드 오른스코어 전환 + P0 작업)을 되돌리지 않고 그대로 보존하며 점검.
- P0-1 데이터 일관성: 헤더·푸터·홈·오늘·유니버스·종목상세·상태 모두 `dataMetadata`+`formatBizDate*`/`isDataStale` 단일 출처 사용 확인. 하드코딩 날짜·산식버전 없음(종목상세 주가 기준일만 종목별 가격시계열에서 도출 — 정상).
- P0-2 빈 상태: 관심종목("아직 관심 종목이 없습니다"+가치설명+3 CTA+검색+try/finally 8초 타임아웃), 비교("비교할 종목을 선택하세요"+최대 4개 명시+오늘 Top5/직접 검색/같은 업종 3진입) 소스 검증 완료 — 수정 필요한 갭 없음.
- P0-3/홈 히어로: "10개 이하로 줄이세요"+기준일 pill+"오늘 후보 5개 보기"/"내 조건으로 찾기"+Top5 미리보기+왜 오른스코어 3카드+가치 뒤 안전문구. 렌더 HTML에서 카피 노출 확인. 매수/매도/추천 문구 신규 유입 없음.
- 브랜드 잔재: 사용자 노출 "밸류맵/ValueMap" 0건(렌더 HTML). 잔존 `valuemap_*` localStorage 키·`valuemap:compare-updated` 이벤트명·guide/metrics GitHub URL은 마이그레이션/기능 유지 위해 의도적 보존.
- 빌드 게이트: `npm run build` 성공(전 라우트 프리렌더 OK).
- 브라우저/라우트 스모크: 프로덕션 서버(127.0.0.1:3000)에서 `/ /today /stocks /stock/005930 /watchlist /compare /disclosures /backtest /universe /status` 모두 200, 에러 마커 0, 클라이언트 컴포넌트 경계(관심·비교) SSR 정상.
- 미완/위험: 빈 상태는 client+localStorage 게이트라 헤드리스 브라우저 없이는 서버 HTML로 직접 확인 불가(소스로 검증함). P0-1은 단일 원자적 JSON 스냅샷 전제(배포당 일관) — 풀 DB는 별도 결정 필요.
- 다음 자동화 패스 제안: `/today` 카드별 한 줄 이유 추가 노출, `/stocks` 모바일 바텀시트 필터, 비교 모바일 카드 패턴(가로 테이블 의존 축소), 공시 카드 핵심값 추출.

## 2026-06-19 · AI Dev Center P0 브리프 1차 패스
- AI 센터 큐에 있던 `OrnScore PDF brief P0 automation pass` 기준으로 현재 작업분을 이어 점검.
- 데이터 기준일/산식 버전 공용 헬퍼(`realStocks.ts`) 사용 범위를 확인하고, 헤더·푸터·홈·오늘·유니버스·상태·종목상세의 기준 표기를 동일 출처로 정리된 상태로 검증.
- 관심종목 빈 상태: "아직 관심 종목이 없습니다" 문구, 점수 변화·공시 신호 가치 설명, 종목 탐색/오늘 후보/로그인 동기화 CTA 확인.
- 비교 빈 상태: "비교할 종목을 선택하세요" 문구, 오늘 Top 5/직접 검색/업종 탐색 진입 확인.
- 홈: 히어로를 "오늘 볼 후보를 10개 이하로 줄이세요" 방향으로 보강하고, 왜 오른스코어인가를 `종목 압축`·`산식 공개`·`공시 연결` 3카드로 정리.
- 빌드 검증: `npm run build` 성공.
- 브라우저 확인: `http://127.0.0.1:3000` 홈, `/watchlist`, `/compare`, `/stock/005930`에서 런타임 에러·콘솔 에러 없음 확인. HTTP 스모크는 `/`, `/today`, `/stocks`, `/stock/005930`, `/watchlist`, `/compare`, `/disclosures`, `/backtest` 모두 200.
- 남은 다음 패스: `/today` 카드별 한 줄 이유 강화, `/stocks` 모바일 필터 UX, 비교 모바일 테이블 의존 축소, 공시 카드 핵심값 추출.


## 🆕 라이브 리뷰(2026-06) P0/P1 — 실사용 발견 버그
- ✅ P0-02 공시카드 404 — 홈·오늘 공시카드가 분석대상外 종목도 /stock/로 연결 → DART 원문(외부)+배지로 분기
- ✅ P0-03 수익률 불일치 — 홈/오늘 r3m(FDR)≠차트(prices/json). compute_metrics가 prices/json 읽게 통일(최근253일) → r3m=차트 일치 + r1y 복구. **다음 Run에서 데이터 반영**
- ⬜ P0-01 www.ornscore.com 502 — Vercel에 www 도메인 추가 + apex 리다이렉트(너)
- ⬜ P0-04 알림 출시상태 페이지마다 다름 — feature flag 중앙화
- ✅ P1-02 산식버전 — metricsVersion "phase2-v2"→"2.4" 단일화 + 푸터/상세/universe/status 모두 dataMetadata.metricsVersion 읽음 (next Run 반영)
- ✅ P1-04 업종 분모 — "17개(본인 제외)"·"18곳(본인 포함)" 명시
- ✅ P1-06 V로고 — 헤더·모바일·이메일 전부 O로 + "오른스코어 스톡" 부제 제거
- ✅ P1-07 데이터상태 — 푸터 정적 "정상" → 가격 기준일 신선도 기반(5일+ 지연표시) + /status 링크
- ✅ P0-01 www 502 — Vercel www.ornscore.com 추가 + 308→apex (SSL 생성 중, 너 완료)
- ✅ P0-04 알림 상태 — lib/features.ts 중앙 config + 로그인 "출시예정"→"무료 이용가능"(공시알림 라이브) + 요금제 FREE에 공시알림 추가·PRO는 고급알림 구분
- ✅ P1-01 DART 문구 — "DART API 한도" → "오른스코어 내부 200건 분석 제한"으로 정확화
- ✅ P1-03 동점 순위 — 같은 점수면 "공동 N위" 표시(today 종합 Top)
- ✅ P1-05 빈상태 — 관심종목 무한로딩 차단(try/finally+8초 타임아웃)+에러상태+다시시도. 비교는 빈상태 degrade
- ✅ ORN-011 백테스트 위험 — "수익↑이지만 낙폭↑·위험조정↓" 요약 경고문 추가(벤치 대비 패턴 감지)
- ✅ §4.4 차트 안내 — "길게 터치" → "마우스 올리거나 길게 터치"(PC+모바일)
- ✅ §4.3 종목탐색 — 기본필터/제외 N개 안내 이미 존재
- ⬜ 남은 §4(대규모/데이터): 종목탐색 목록 SSR, 공시 핵심숫자 추출(DART본문), 홈 히어로 간소화, 종목상세 결론-위험-근거 재배치, AI기록 버전, 백테스트 재현설정 다운로드


## 🎨 디자인 설계서 P0 대조 (2026-06)
- ✅ 1 브랜드·로고 통일 (트렌드 O 마크 + 오른스코어)
- ✅ 2 산식버전 통일 (metricsVersion 2.4 단일)
- ✅ 4 데이터상태 칩/페이지 (/status + 푸터 신선도)
- ✅ 6 로그인·약관 사이드바 제거 (Sidebar+MobileBottomNav 경로 hide)
- ✅ 7 관심·비교 빈상태 개선 / ✅ 9 관심종목 무한로딩→에러상태
- ✅ 10 점수 색상 분리 (emerald/blue → 브랜드 인디고+중립, 상승빨강/하락파랑과 구분)
- 🟡 3 상단날짜 중복 / 5 반복고지 축소 / 7 history 빈상태 / 8 모바일 가로넘침 QA / 9 기타 스켈레톤 — 일부 잔여
- ⬜ P1/P2: 페이지 전면 재구성(메인·오늘·탐색·상세·공시), 레이아웃 분리(마케팅/앱/문서/인증), 모바일 바텀시트 — **대규모, 실제 화면 보며 페이지별 반복 필요**

마지막 업데이트: 2026-06-15 (세션: 금지문구·게이트·문자등급제거·신뢰도% + 로드맵)

---

## ✅ 완료 (배포됨 또는 푸시 대기)
- 6.3 거래일 표준 21/63/126/252 — compute_metrics(데이터단)
- 8.4/8.5 위험조정 **백분위화**(선형→백분위) — compute_metrics v2.4
- 8.7 결측 50점 제거(밸류 재가중 + valueNA) — compute_metrics
- 8.9 반올림: composite 원점수 + 화면 Math.round, 80임계값 원점수(compositeOf) 사용 — 모순 없음
- 9.1 문자등급 A+/A/B+ **완전 제거** → 점수 중심 + 상태어(최우선 확인/우선 확인/추가 관찰/일반/조건 낮음) — grade.ts + 종목상세
- 9.4 금지문구 제거(안정적으로 우상향·매수 기회 등) — guide/metrics
- 18.1 공시 "신뢰도 %" → "유형 자동분류"(today 카드·이메일)
- 23.1 라이선스 충돌 해소(오픈소스 표현 제거 + LICENSE 파일 + 약관 명확화)
- 16.1 관심종목 빈 상태 가치 문구
- 13.3 점수 변동 원인(지표별 +/-) — getMetricChangesBatch + today 급변칩 hover 원인
- 16.2 관심종목 전일대비 점수 델타(▲/▼) — watchlist 페이지 델타 fetch + 표시
- 5.3 분석 대상 공개 페이지(/universe) — 138종목 목록·선정기준·데이터기준일·한계 + about 링크
- 7(부분) PER '최근 실적(후행)' 명시 + 기준 안내 — 종목상세 재무탭
- 24 운영 상태 페이지(/status) — 스냅샷 신선도·데이터 소스 상태 + about/universe 링크
- 46 브리핑 Supabase 영속화 — daily-insight cron→daily_insights 테이블 upsert + getLatestStoredInsight + today 브리핑에 AI 요약 표시 (SQL: docs/sql/daily_insights.sql, 너가 실행)
- 9.3 급등 경고 '최근 63거래일(약 3개월)' 거래일 표기
- 11.1 "값 검증 완료" → "이상값 점검 통과"
- 15.3 위험 상세 패널(연환산변동성·최대낙폭·최악의하루·관측일수)
- 15.5 데이터 기준 박스(주가기준일·점수계산·산식버전·분석대상)
- 17.2 비교 공유 URL(/compare?stocks=) + 공유버튼
- 19.1 백테스트 시간순서 / 19.5 벤치마크 명칭 — 이미 준수
- 21 브랜드 오른스코어 통일 + 오타(오른스코어은→는)
- 21.3/26.4 빌드 금칙어 게이트(verify_metrics, 18개 문자열)
- 22 메타: 테마주 문구 제거
- 20.2 PLAN_LIMITS 단일소스(limits.ts)
- [보너스] 현재가 지연시세 라이브(네이버) / 24시간 데이터 자동화(GitHub Actions) / notify 라이브 DART

## 🟡 다음 (코드로 가능 · tsc 환경/awake 권장)
- 22.2 전 페이지 title "X | 오른스코어" 형식 통일 점검
- 11.2 데이터 품질 상태 패널 세분화(가격/재무/공시/경보/교차검증)

## 🟠 진행 중 (인프라 완성, 데이터 검증 대기)
- §10 KRX 시장경보 — **인프라 완성**(marketAlert.ts·market-alerts.json·fetch_market_alerts.py·Action). **데이터 소스 조사 결과(직접 확인)**: ① KRX 데이터포털 시장경보 화면=로그인 필요(무료 자동수집 불가) ② KRX 공식 Open API=시장경보 미제공(가격·기본정보 8종만). **→ 무료 공식 소스 없음.** 남은 옵션: 네이버 per-종목 스크래핑(불안정·샌드박스 테스트 불가, Action 반복검증 필요) 또는 유료. **현재 보류** — 인프라는 받을 준비 완료, 소스 확보 시 fetch_market_alerts만 교체하면 즉시 작동.

## 🔴 차단 (데이터소스·계정·아키텍처 결정 필요 — 단독 불가)
- 4 단일 스냅샷 **DB** 도입 — 현재 정적 JSON은 배포당 원자적이라 페이지불일치 이미 없음. 풀 DB는 과할 수 있음 → **결정 필요**
- 5 유니버스 **관리 테이블**(편입/제외 이력) — 데이터·정책 필요 (※ 공개 목록 페이지 /universe는 5.3 완료)
- 6.2 기업행위(수정주가) — corporate action 데이터 소스 필요(FDR adjustedClose 확인)
- 7 재무 **기준일·Forward PER·교차검증** — DART 재무/컨센서스 **데이터 소스** 필요(ORN-003). ※ PER 라벨/기준안내(표시단)는 부분 완료
- 18.2 공시 핵심 숫자 추출 — DART 본문 파싱 파이프라인
- 19.6 백테스트 시점별 유니버스·OOS·비용민감도 — 백테스트 엔진 확장 + 데이터
- 23.2 개인정보 국외이전 표 — 법무 콘텐츠(사용자 결정)
- 23.3 도메인 이메일(support@/privacy@/data@) — 메일 계정 생성(사용자)
- 24 운영 모니터링 — 공개 상태페이지(/status) 완료. ※ 배치 실패 알림·관리자 전용 상세는 추가 구축 필요
- 26.5/27 E2E·모바일 QA / 28 접근성 / 29 성능 — 실행환경·감사 작업

## 📌 운영자(송) 직접 작업
- Resend ornscore.com 도메인 Verify 확인(대기중)
- Supabase Auth Redirect URLs / Kakao Redirect URI에 ornscore.com 추가
- 위 🔴 항목들의 데이터소스/결정 제공

## 2026-06-16 · 페이지 디자인 재구성 (모바일 우선)
- 메인(page.tsx): 컴팩트 히어로 + '오늘의 데이터' 블록(통계3칸+Top5) 신설, /today와 역할 분리.
- 종목탐색(StocksExplorer): 프리셋·저장조건을 모바일 접이식 '빠른 탐색·저장된 조건'으로 묶어 검색·리스트 상단 배치(데스크탑 lg는 기존대로). 기능 무변경.
- 공시(DisclosureExplorer): 다크모드 버그 수정(카드 bg-white→dark, 기간·필터버튼·SIGNAL_STYLES 다크 변형).
- 오늘(today): 다크모드 버그 수정(통계3칸·SIGNAL_TONE·하단 공시 섹션).
- 종목상세: 이미 다크·모바일 완비 확인 → 무변경.
- 검증: 4파일 파싱 0에러 / 금칙어·한글깨짐 없음. 푸시 대상: page.tsx, StocksExplorer.tsx, DisclosureExplorer.tsx, today/page.tsx.

## 2026-06-16 (2) · 다크모드 전수 감사·수정
- 레포 전체 라이트전용 컬러배경(bg-*-50/from-*-50 dark: 누락) 스캔 → 전부 수정.
- guide/metrics: dark: 0개였음 → 페이지 전면 다크 적용(26곳).
- StockDisclosures·WatchlistClient: 신호색 맵 다크 변형.
- HistoryClient: 호재/리스크 패널 다크. DisclosureExplorer: 에러패널 다크.
- NotificationToggle: 토글 두 상태 다크. StocksExplorer: 카드 인사이트칩 5종 다크.
- 검증: 7파일 파싱 0에러 / 금칙어·한글깨짐 없음 / 최종 재스캔 잔여 0.

## 2026-06-16 (3) · 데이터 검증 + 모바일 QA
- 모멘텀 포화: live 데이터 max=99.3(포화 0개) → 이미 백분위 적용됨. 문제 없음, 재생성 안 함.
- ⚠ 운영 발견: compute_metrics.py=v2.4인데 live metricsVersion=phase2-v2. 데일리 Action이 v2.4를 아직 안 돌림(=v2.4 미push 추정). push 후 Action 돌면 푸터 "Metrics 2.4"로 정리됨.
- 모바일 320px 가로넘침 전수 스캔: 실위험 1건(theme/[slug] 6컬럼 테이블 래퍼 없음) → 가로스크롤 래퍼+min-w 추가.
- theme/[slug]: dark:0(완전 라이트)였음 → 다크모드 전면 + 레이더 SVG currentColor화 + breadcrumb 데드링크 /themes→/stocks.
- 참고: ThemeCard.tsx는 미사용(데드코드), /themes 페이지 없음 — 테마 클러스터 vestigial.

## 2026-06-16 (4) · 라우팅 감사 + /pricing 연결
- 내부 링크·라우팅 전수 감사: 404 데드링크 0건(정적·programmatic 모두). /themes는 이전 수정으로 해소.
- 고아 페이지 발견: /pricing(링크0), /blog·/blog/[slug](링크0). /blog는 WIP로 보류.
- /pricing: 전역 푸터(layout.tsx)에 '요금' 링크 조용히 추가 — 전 페이지 하단 노출.
- node_modules: .gitignore에 정상 포함 확인.


## 2026-06-24 · Pass 11 · 공시 explorer 수집 기준 신선도 라벨 (Task 33, Claude)
- What changed: 공시 신호 페이지(/disclosures)에 '수집 기준 · {KST 시각} · {출처}' 신선도 라벨 추가. 사용자가 보고 있는 공시 묶음이 언제·어디서(실시간/저장본/예시 표본) 수집됐는지 1줄로 표기.
  - `src/app/api/disclosures/recent/route.ts`: live payload에 `fetchedAt`(ISO) 추가, sample 분기에도 `fetchedAt` 추가. cache 분기는 저장된 payload의 fetchedAt를 그대로 carry(원수집 시각 보존). detectSignals·enrich 래퍼·점수·신호강도 무변경(순수 additive).
  - `src/lib/recentSignals.ts`(SSR twin): live·sample 반환에 `source`/`fetchedAt` 추가 → 초기 SSR 렌더에서도 라벨 즉시 노출.
  - `src/components/DisclosureExplorer.tsx`: `ApiResponse`에 `source?`/`fetchedAt?` 추가, `sourceKo`(StockDisclosures SourceBadge와 동일 매핑: 실시간/저장본/예시 표본)·`fmtKST`(명시 timeZone=Asia/Seoul, SSR/CSR 일관) 헬퍼, 헤더 count 줄 아래 `text-[11px] text-zinc-500` muted 라벨. 필드 없으면 graceful(둘 다 없으면 미출력, 시각만 없으면 '수집 시각 미상'). 라이트+다크 동일.
- What passed: `verify_metrics.py`(138종목 0오류·브랜드/금칙어 0, exit 0) · `npm run build`(타입게이트 통과·138p 프리렌더, exit 0, 신선도 라벨 문자열이 `app/disclosures/page` 클라이언트 청크에 컴파일됨) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /today /stocks /disclosures /stock/005930` 200·에러 0, `/disclosures` SSR HTML에 `수집 기준 · 2026. 06. 24. 00:07 · 예시 표본`(UTC 15:07→KST 정확 변환) 렌더, `/api/disclosures/recent` 200·error null·source=sample·fetchedAt 존재.
- Operator-only blocker(변동 없음): DART 키 필요 fetch 스크립트(`fetch_*_details.py` → `public/data/*-signals.json`)는 로컬 미실행. single_contract/correction의 `⚠️ operator-verify` 정규식(`RE_AMOUNT`/`RE_RATIO`/`RE_BEFORE`/`RE_AFTER`/`RE_FIELD`)은 실보고서 본문 대조 필요.
- Next two local tasks: (a) 동일 신선도 라벨을 종목별 `StockDisclosures` 헤더에도 적용 — `[ticker]` 라우트의 `fetchedAt`를 payload에 추가하고 컴포넌트 헤더에 동일 muted 라벨. (b) Pass 10 잔여 후보: `signalDetailsShared.ts`의 `toEok`/`matchRow` 단위 assertion 추가 또는 6개 lib의 `*Clause()` ` · `-join 빌더 공통화.

## 2026-06-24 · Repair · GlobalSearch hydration warning 제거 (Task 33 gate fix, Claude)
- Blocker: Playwright DESKTOP 품질게이트가 React hydration 경고로 실패 — "Extra attributes from the server: style" at input(GlobalSearch). AppHeader(Server)→GlobalSearch(client)의 검색 input이 SSR HTML과 클라 vdom 사이 style 속성 불일치(검색 input은 브라우저/확장 후처리로 hydration 전 속성이 주입되는 대표 케이스).
- What changed: `src/components/GlobalSearch.tsx` 검색 input에 `suppressHydrationWarning` 추가(Next.js 권장 처리). 순수 additive 1줄, 로직/스타일 무변경. 동일 컴포넌트를 재사용하는 MobileSearchButton 인스턴스도 동시 커버.
- What passed: `npx tsc --noEmit` exit 0(타입게이트 통과). lint는 ESLint 미구성(대화형 셋업)이라 tsc를 확립된 finite check로 사용.
- What remains: 게이트 재실행으로 Playwright DESKTOP 경고 소거 확인. Pass 11의 next-task(StockDisclosures 신선도 라벨, signalDetailsShared 단위 assertion)는 그대로 유효.
- Next two local tasks: (a) `[ticker]` route payload에 fetchedAt 추가 + StockDisclosures 헤더 신선도 라벨(Pass 11 carry). (b) GlobalSearch SSR/CSR 속성 일치 회귀 방지용 input 속성 스냅샷 메모를 docs에 남기기.


## Repair — Playwright 게이트 404(정적 청크) 수정: dev/prod distDir 분리 (2026-06-24, Claude)
- Blocker: Task 33 Playwright DESKTOP+MOBILE 게이트가 `_next/static/css/app/layout.css`·`chunks/main-app.js`·`app/layout.js`·`app/not-found.js`·`app-pages-internals.js` 404/ERR_ABORTED로 실패.
- Root cause: `npm run build`(prod, 타입게이트)와 게이트의 `next dev` 가 같은 `.next` 를 공유 → 손상. dev HTML은 unhashed 청크 경로를 참조하나 디스크엔 prod-hashed 산출물만 존재해 404. 실행 중 dev 서버에서 6개 중 5개 자산 404 재현.
- Fix: `next.config.mjs` phase 함수화 — dev(`PHASE_DEVELOPMENT_SERVER`)만 `distDir='.next-dev'`. prod는 기본 `.next`(Vercel 무영향), URL 불변. `.gitignore`에 `.next-dev/`.
- Passed: 재기동 dev에서 이전 404 자산 6종 전부 200 + 게이트 5라우트 200·자산 404 0건 · phase별 distDir 확인(dev=.next-dev/prod=undefined) · `tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0 exit 0.
- Next two local tasks: (a) `[ticker]` route payload에 fetchedAt 추가 + StockDisclosures 헤더 신선도 라벨(Pass 11 carry). (b) `signalDetailsShared.ts` `toEok`/`matchRow` 단위 assertion 추가.


## 2026-06-24 · Repair · Task 15 Playwright DESKTOP 게이트 수정: WelcomeOnboarding 프리페치 abort 제거 (Claude)
- Blocker: Task 15 Playwright DESKTOP 게이트가 `/stocks?_rsc=…`·`/today?_rsc=…`·`/settings/notifications?_rsc=…` 3건 모두 `net::ERR_ABORTED` 로 실패.
- Root cause: `_rsc=` 는 Next App Router 의 RSC 뷰포트 프리페치 요청(공유 토큰 1개 = 한 페이지 렌더의 프리페치 배치). 홈(`/`) 익명·신규 브라우저(게이트 조건)에서 `WelcomeOnboarding` 의 두 `<Link>`(Step·DesktopCard)가 `/today`·`/stocks`·`/settings/notifications` 를 동시에 뷰포트 프리페치 → `next dev` 온디맨드 컴파일(로그상 최초 ~21s)이 끝나기 전에 게이트가 다음 단계로 넘어가며 in-flight 프리페치가 취소 → ERR_ABORTED. (Sidebar·MobileBottomNav·home/* Link 들은 이미 `prefetch={false}` 라 무관 — WelcomeOnboarding 만 누락된 단일 출처, 특히 `/settings/notifications` 의 유일한 익명 홈 출처.)
- Fix: `src/components/WelcomeOnboarding.tsx` 의 `Step`·`DesktopCard` 두 `<Link>` 에 `prefetch={false}` 추가(저장소 기존 nav 컨벤션과 동일). 순수 additive 2줄 — 레이아웃·로직·문구 무변경. prod(Vercel 프리빌드)는 프리페치가 즉시 200이라 영향 없고, dev 게이트에서 abort 가능한 프리페치 자체가 사라짐.
- Passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0 exit 0 · `npm run build` 타입게이트·138p 프리렌더 exit 0 · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /today /stocks /stock/005930` 200, `/settings/notifications` 307(익명→로그인 정상 리다이렉트)·에러 0. 홈 익명 렌더의 trio 프리페치 출처가 0건임을 grep 으로 확인(home/* + Sidebar/MobileBottomNav 전부 prefetch={false}).
- Residual: Playwright 미구성으로 ERR_ABORTED 소거는 게이트 재실행으로 최종 확인 필요(정적 분석상 프리페치 속성 제거로 구조적 해소). Task 15 기능(결론 카드)은 무변경.
- Next concrete OrnScore step(변동 없음): Phase 2 — (a) 레벨드 RiskAlertCard 완전 분리, (b) 4지표 미니바 히어로 추가(단일 소스), (c) 업종 비교 전용 탭 + 다음확인 버튼 스무스 스크롤.


## 2026-06-24 · Repair · Task 15 Playwright 게이트 수정: 홈 stale prod chunk 400 제거 (Claude)
- Blocker: Playwright DESKTOP·MOBILE 둘 다 `400 http://127.0.0.1:3000/_next/static/chunks/app/page-dfb2719986a20cdc.js — net::ERR_ABORTED` 로 실패(홈 `/` 자체 페이지 청크).
- Root cause: 환경 staleness 레이스(코드 결함 아님). 포트 3000 의 `next start` 프로세스(PID 33580, 02:55 기동)가 **구 `.next` 빌드**를 메모리에 로드한 채 살아 있었고, 그 뒤(03:12) `npm run build` 가 `.next` 를 덮어써 홈 청크 해시가 `dfb2719986a20cdc`→`eb287862a9283bf0` 로 바뀜. 살아있는 서버는 여전히 구 해시(`dfb27…`)를 참조하는 HTML 을 내려보내는데 그 청크는 디스크에서 사라져 400. (live 서버에서 `curl /` → HTML 이 `app/page-dfb2719986a20cdc.js` 참조, 해당 청크 요청 → 400 으로 재현 확인. 신 청크 `eb287…` 는 BUILD_ID 불일치로 404 → 서버 전체가 stale.)
- Fix(환경 정리, 소스 무변경): (1) stale `next start`(PID 33580) `taskkill /F` 로 종료 → 3000 free. (2) `npm run clean`(.next 삭제) + `npm run build` 클린 재빌드로 디스크 자가정합. (3) 새 `next start -p 3000` 기동 → 서버가 신 빌드와 일치. Task 15 결론 카드 기능·WelcomeOnboarding 프리페치 수정 모두 무변경.
- Passed: `npx tsc --noEmit` exit 0 · `npm run build` 138p 프리렌더 exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0 · 새 서버(3000)에서 홈 HTML 이 디스크와 동일한 `app/page-eb287862a9283bf0.js` 참조, 그 청크 200 · `/ /today /stocks /disclosures /stock/005930` 200, `/settings/notifications` 307(익명 리다이렉트) · **홈과 `/stock/005930` 의 모든 `/_next/static/*` 참조 자산 전수 200(NON-200 0건)** — 게이트가 잡던 청크 abort 소거 확인.
- Residual / 운영 주의: 근본 원인은 게이트 워크플로가 prod 서버를 띄운 채 `.next` 를 재빌드하면 살아있는 서버의 청크 참조가 stale 해지는 것. 권장 시퀀스 = **build → start 순서 고정, 서버 가동 중 재빌드 금지, 게이트 재실행 전 3000 의 잔존 `next start` 선종료**(dev 는 이미 `.next-dev` 로 분리됨, 본 건은 prod `next start`+`build` 가 `.next` 공유 시 발생). Playwright 미구성이라 최종 소거는 게이트 재실행으로 확인.
- Next concrete OrnScore step(불변): Phase 2 — (a) 레벨드 RiskAlertCard 완전 분리, (b) 4지표 미니바 히어로(단일 소스), (c) 업종 비교 전용 탭 + 다음확인 버튼 스무스 스크롤.


## 2026-06-24 · Repair · Task 21 MetricBar 막대색 누락 수정: 런타임 클래스 합성 제거 (Claude)
- Blocker(TESTER FAIL): 정식 게이트(tsc·verify_metrics·build·HTTP 200)는 통과하나, `MetricBar` 가 `c.track`/`c.fill` 의 `text-*` 토큰을 런타임 `.replace(/text-/g,"bg-")` 로 막대 배경색을 합성 → Tailwind 정적 스캐너가 `bg-*` 리터럴을 못 잡아 빌드 CSS 에서 누락. 라이트모드 60~79(sky) 구간이 무색(홈 후보 카드), 다크모드는 대부분 구간 무색 → 점수 색 통일 목표 깨짐.
- Root cause: Tailwind v4 는 소스에 리터럴로 존재하는 클래스명만 생성한다. 게이지는 `text-*`(scoreColor.ts 에 리터럴 존재)에 SVG `currentColor` 라 정상이었으나, 막대 `bg-*` 변형은 소스 어디에도 리터럴이 없어 누락.
- Fix: `src/lib/scoreColor.ts` 의 `ScoreColor` 에 `barFill`·`barTrack`(bg-* 리터럴) 필드 추가 — 4구간 전부 라이트+다크 bg 리터럴 명시(high `bg-blue-600/400`, good `bg-sky-500/400`, neutral `bg-amber-500`, low `bg-zinc-400/500`, track `bg-zinc-200/800`). `MetricBar.tsx` 는 런타임 치환을 버리고 `c.barFill`/`c.barTrack` 를 그대로 사용. 단일 색 소스 원칙 유지, 점수 계산식/데이터/공시 로직 무변경.
- Passed: `npx tsc --noEmit` exit 0 · `npm run build` 138p 프리렌더 exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·산식 2.4 일치 · 빌드 CSS 에 8개 구간 bg 클래스 전수 존재(`bg-sky-500`/`bg-sky-400:is(.dark *)`/`bg-zinc-500:is(.dark *)` 등 다크변형 포함) · 로컬 prod(3100) `/ /stocks /stock/005930 /guide/metrics` 200 · 렌더된 홈 HTML 에 `bg-sky-500`/`bg-sky-400`(60~79 구간 막대) 실제 출력 확인.
- Residual: 없음(스타일 한정 수정). 향후 새 점수 시각화는 동일하게 scoreColor 의 리터럴 토큰을 쓰고 런타임 클래스 합성은 금지.


## 2026-06-25 · Repair · Task 24 Playwright 게이트 수정: /stocks stale prod chunk 400 (Claude)
- Blocker: Playwright DESKTOP·MOBILE 둘 다 `400 .../_next/static/css/e1593cd0a575ab11.css`·`400 .../_next/static/chunks/app/stocks/page-60397daaa5cf26e3.js — net::ERR_ABORTED` 로 실패.
- Root cause: 코드 결함 아님 — Task 15 때와 동일한 환경 staleness 레이스. 포트 3000 의 `next start` 프로세스(PID 27200, 부모 PID 11724 이미 종료된 고아 프로세스)가 **구 `.next` 빌드**를 메모리에 로드한 채 살아 있고, 그 뒤 `.next` 가 재빌드되어 청크 해시가 바뀜(css `e1593…`→`d1665…`, stocks `page-60397…`→`page-7d957…`). 살아있는 서버는 여전히 구 해시를 참조하는 HTML 을 내려보내는데 그 청크는 디스크에서 사라져 400. (live 3000 에서 `curl /stocks` → HTML 이 `e1593…css`·`page-60397…js` 참조 재현 확인. 구 css 요청 → 400, 신 css 요청 → BUILD_ID 불일치 404 → 서버 전체가 stale.)
- 진단·검증(소스 무변경): (1) `npx tsc --noEmit` 0 · `npm run build` exit 0(`/stocks` 13.9 kB·138p 프리렌더) → Task 24 Phase 4 코드 자체는 정상 빌드. (2) 빈 포트 3255 에 `next start`(내가 띄운 PID 19724) 로 **신 빌드 검증** → `/stocks` 200, 참조 css `d1665…` 200·js `page-7d957…` 200(NON-200 0건), 보기 모드 마커(`카드형`/`표형`/`종합점수`) SSR 렌더, `/ /today /stock/005930` 200, 런타임 에러 0. 검증 후 PID 19724 만 종료(3000·4310 무중단). (3) `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·산식 2.4.
- 복구 완료(Codex): 3000 의 고아 stale `next start` PID 27200 만 종료하고, 신 빌드로 포트 3000 을 PID 23992 로 재기동. 4310 은 중단하지 않음. `/stocks` 200, `카드형`/`표형`/`종합점수` SSR 마커 확인, 예전 stale 청크(`e1593cd0a575ab11.css`, `page-60397daaa5cf26e3.js`) 참조 없음. `/ /stocks /today /stock/005380 /compare /backtest` 모두 200. 코드/빌드/데이터 변경은 일절 불필요했으며, AI Center DB 는 Task 24 completed 로 정합화 후 Task 25부터 재개.
- 운영 권장(Task 15 잔여와 동일): prod `next start` 가동 중 `.next` 재빌드 금지, build→start 순서 고정, 게이트 재실행 전 3000 잔존 `next start` 선종료.


## 2026-06-25 · Repair · Task 25 Playwright 게이트: /stocks·/ stale prod CSS 400 (Claude)
- Blocker(QUALITY-GATE): Playwright DESKTOP·MOBILE 둘 다 `400 http://127.0.0.1:3000/_next/static/css/d1665e0e41509995.css — net::ERR_ABORTED` + `/?_rsc=...`·`/stocks?_rsc=...` ERR_ABORTED 로 실패.
- Root cause: 코드 결함 아님 — Task 15·24 와 동일한 환경 staleness 레이스가 재발. 포트 3000 의 `next start`(PID 23992) 는 **Task 24 복구 때 Codex 가 띄운 `d1665e0e…css` 빌드**를 메모리에 로드한 채 살아 있는데, Task 25(`b697386`) 가 커밋되고 `.next` 가 재빌드되며 CSS 해시가 `d1665e0e…`→`302c90d13f468b6d` 로 바뀜. 살아있는 PID 23992 는 여전히 구 해시(`d1665e0e…`)를 참조하는 HTML 을 내려보내는데 그 CSS 는 디스크에서 사라져 400(`_rsc` RSC 프리페치도 BUILD_ID 불일치로 abort). live 3000 에서 `curl /` → HTML 이 `d1665e0e…css` 참조 + 그 자산 요청 → 400, 신 CSS `302c90d…` 요청 → 404(서버 전체 stale) 로 재현 확인.
- 진단·검증(소스 무변경, 신 빌드 정상 입증): (1) `npx tsc --noEmit` exit 0. (2) `npm run build` exit 0 — Task 25 `/stock/[ticker]` 13.9 kB·138p SSG, 신 CSS `302c90d13f468b6d.css`. (3) `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·산식 2.4 일치. (4) 빈 포트 3251 에 `next start`(내가 띄운 PID 20368) 로 신 빌드 검증 → `/ /stocks /today /stock/005380 /stock/005930` 전부 200, 참조 CSS `302c90d…` 200(NON-200 0건, stale `d1665e0e…` 참조 없음), `/stock/005380` SSR 에 Task 25 마커(`종합 점수` 게이지·`초보자는 이렇게 보세요`·`먼저 확인할 것`·`같은 업종 비교`·`현재` 강조) 전수 렌더, 런타임 에러 마커 0. 검증 후 **내가 띄운 PID 20368 만 종료**(3000 PID 23992·4310 PID 24672 무중단 확인).
- 복구 완료(Codex): 3000 의 stale `next start` PID 23992 만 종료하고, 포트 3000 을 신 빌드로 PID 13444 로 재기동. 4310(PID 24672) 은 중단하지 않음. `/stock/005380` 200, Task 25 마커(`탐색 우선도`·`자체 지표 4종`·`초보자는 이렇게 보세요`·`같은 업종 비교`) SSR 렌더 확인, 참조 정적 asset 12개 전수 200(BadAssets 0). `/ /stocks /stock/005380 /stock/005930 /disclosures /backtest` 모두 200. AI Center DB 는 Task 25 completed 로 정합화 후 Task 26부터 재개.
- 운영 권장(Task 15·24 잔여와 동일·항구적): prod `next start` 가동 중 `.next` 재빌드 금지, build→start 순서 고정, 게이트 재실행 전 3000 잔존 `next start` 선종료.


## 2026-06-25 · Repair · Task 36 P1-B Playwright 게이트: /stocks 검색 input hydration 경고 (Claude)
- Blocker(QUALITY-GATE PLAYWRIGHT DESKTOP): `Warning: Extra attributes from the server: style at input ... at StocksExplorer` — /stocks SSR 후 hydration 시 검색 input 에 서버/클라이언트 속성 불일치 경고가 콘솔에 떠 게이트 실패.
- Root cause: Task 36 에서 종목명·코드 검색 input 을 컴포넌트 최상단(질문형 프리셋 위)으로 이동해, 페이지에서 SSR 시점에 가장 먼저 렌더되는 텍스트성 input 이 됨. 브라우저 자동완성/확장(또는 폼 자동채움)이 hydration 직전 이 첫 input 에 `style` 속성을 주입해 React 가 "Extra attributes from the server: style" 를 경고. 소스에는 `style` 속성이 없으며(grep 0건), 점수/필터 로직과 무관한 순수 표현 이슈.
- Fix: `src/components/StocksExplorer.tsx` 검색 input 에 `suppressHydrationWarning` 추가(Next.js 권장 처방). 동작·스타일·필터 로직 무변경. 상세 필터 안의 number/range/checkbox input 들은 showAdvanced/drawer 가 열려야 렌더돼 초기 SSR 대상이 아니므로 첫 검색 input 한 곳만 수정으로 충분.
- Passed: `npx tsc --noEmit` exit 0 · `npm run build` exit 0(/stocks 14.2 kB·138p 프리렌더, 라우트 전수 빌드). Korean 문구 무손상 확인(grep).
- Residual: 없음(속성 한정 수정). 향후 SSR 첫 렌더에 노출되는 폼 input 추가 시 확장 주입 대비 동일 처방 고려.
## 2026-06-27 - [codex] Task 70 auth provider expansion main push/public smoke complete
- **Scope**: User approved release of Task 70 after the auth provider expansion automation run completed.
- **Push**: Fast-forwarded `main` from `bbc5876` to `fa33165` and pushed `origin/main`.
- **Verification before push**: `npx tsc --noEmit`, `python scripts/verify_metrics.py` with UTF-8 env, and `npm run build` all passed.
- **Public smoke**: Confirmed `https://ornscore.com/login` is serving footer commit `fa33165`, renders two OAuth buttons (Kakao and Google), keeps Apple hidden by policy, and keeps the email magic-link button visible. Confirmed `/auth/callback` without a code redirects safely to `/login?error=auth_callback_failed`. Confirmed `/privacy` includes Google processor text.
- **Next**: Supabase/Google Cloud console setup is still required before a real Google OAuth round trip can succeed; follow `docs/auth-providers-setup.md`, then test the live Google login redirect/callback.

## 2026-06-27 · [claude] Task 72 — PWA 앱 준비도 (manifest 메타 + 설치 안내 + 앱 로드맵)
- **Scope**: 사용자가 네이버 로그인 후속 다음으로 "오른스코어도 앱이 되어야 한다" 요청. 마케팅이 아니라 설치 가능 앱(PWA) 준비도 + 네이티브 배포 안전 경로 문서화. 브랜치 `ai-center/task-72-...`(Task 73 `f728604` 이후 그대로 이어감, 리셋/pull/머지/push 0).
- **감사**: manifest ✔ / `/offline` ✔ / **service worker 미등록(의도적)** / 아이콘 SVG only(PNG·maskable·apple-touch 없음). 설치는 가능하나 아이콘 품질/설치 배너는 PNG 에셋 보강 시 1급.
- **변경(무에셋·무의존)**:
  - `src/app/manifest.ts` — `id:"/"`·`categories:["finance"]`·`dir:"ltr"`·`shortcuts`(오늘/종목 찾기/공시 신호) 추가. 색·아이콘·기존 필드 보존. 존재하지 않는 PNG 경로는 적지 않음(404 방지).
  - `src/app/about/page.tsx` — 비마케팅 "앱처럼 설치하기" 소형 섹션(iOS 공유→홈 화면에 추가 / Android 메뉴→앱 설치 + `/offline` 링크 + 네트워크 필요 고지 + **스토어 출시 미확정 명시**). 새 nav 탭·히어로 없음.
  - `docs/app-roadmap.md`(신규) — PWA 감사표·네이티브 경로(PWA→TWA(Play $25)→iOS(홈 추가 지금/App Store 래퍼 $99/yr)→Capacitor 범위 외)·운영자 에셋/계정 체크리스트·**SW 미등록 결정 + 사유(데이터 신선도 충돌)·미래 안전형(navigation-only network-first, 데이터 JSON 비캐시)**·앱 기능별 인증 준비도(OAuth standalone 복귀 리스크·Naver 준비 중·푸시·watchlist·딥링크).
- **검증**: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·Metrics 2.4 · `npm run build` exit 0(전 라우트). 빈 포트 3332 `next start`(내가 띄운 PID만 종료, 3000·4310 무중단)로 스모크: `/ /login /offline /manifest.webmanifest /status /about /stock/005380` 전부 200, manifest JSON에 신규 `id`·`categories`·`dir`·`shortcuts` 확인, about에 "앱처럼 설치하기"·"홈 화면에 추가" SSR 렌더. 변경 파일 U+FFFD 0.
- **남은 단계(운영자/제품)**: PNG 192/512·maskable·apple-touch-icon 에셋 제작→코드 연결 / TWA vs iOS 래퍼 결정 + 계정($25 / $99/yr) / 실기기 OAuth standalone 복귀 검증 / (선택) navigation-only SW. **공개 문구는 스토어 출시 미약속.**
- **Next**: 운영자가 PNG/maskable/apple-touch-icon 에셋 공급 + 첫 스토어(TWA/iOS) 결정.

## 2026-06-27 · [claude] Task 74 — PWA PNG 아이콘 에셋 (192/512/maskable/apple-touch) + 매니페스트/메타 연결
- **Scope**: Task 72(앱 준비도) 후속. 운영자 보강으로 남겨뒀던 PNG 아이콘 에셋을 코드로 생성·연결해 설치성을 1급으로 올림. 브랜치 `ai-center/task-74-ornscore-pwa-icon-assets-and-install`(Task 72 `abad23c` 위, 클린에서 시작). **신규 npm 0·service worker 0(데이터 신선도 결정 유지)·리셋/pull/머지/push 0·env 0.** 공개 문구는 PWA/홈 화면 추가만(App Store/Play 약속 0).
- **생성 방식(외부 의존 0)**: 신규 `scripts/generate-icons.mjs` — Node 표준 라이브러리(`fs`+`zlib`)만으로 `src/app/icon.svg` 브랜드 마크(#2563eb 라운드 사각 배경 + 흰 링 cx15 cy17 r7.5 + 대각선 M9 21→23 9, stroke 2.6)를 RGBA 버퍼에 직접 4x 슈퍼샘플링 안티에일리어스로 그리고, 유효 PNG(시그니처+IHDR+IDAT(deflateSync)+IEND, 청크별 CRC32)로 인코딩. 신규 `scripts/check-icons.mjs` — PNG 시그니처 + IHDR 폭/높이(빅엔디언 offset 16/20) 파싱으로 정확 치수 단언(불일치 시 exit 1).
- **에셋(정확 치수 검증 통과)**: `public/icon-192.png`(192x192, purpose any, 라운드 코너), `public/icon-512.png`(512x512, any), `public/icon-512-maskable.png`(512x512, maskable, 풀블리드 배경 + 마크 내부 80% 안전영역·10% 패딩), `public/apple-touch-icon.png`(180x180, 불투명 풀블리드 — iOS가 자체 마스크 적용).
- **연결(코드 2)**: `src/app/manifest.ts` — icons에 PNG 192/512(`purpose:"any"`)+512 maskable 추가, 기존 `/icon.svg`(`sizes:"any"`) 폴백 보존, 헤더 주석 갱신. `src/app/layout.tsx` — `metadata.icons`(icon: svg+192+512, apple: 180) 추가 → Next가 `<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">` 방출(public/ 에셋은 자동 추가 안 되므로 명시 필요). title/OG/twitter/robots/JSON-LD 무변경.
- **검증**: `npx tsc --noEmit` exit 0 · `check-icons.mjs` 4개 전부 OK(시그니처+정확 치수) · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·Metrics 2.4 · `npm run build` exit 0(`/manifest.webmanifest` 포함 전 라우트). 빈 포트 3340 prod 스모크(내가 띄운 PID만 taskkill, 4310 무중단·3000 본래 미기동): `/manifest.webmanifest` 200 `application/manifest+json` + icons JSON에 PNG 3종(192/512 any + 512 maskable) 노출, `icon-192/512/512-maskable/apple-touch-icon.png` 전부 200 `image/png`, `/`·`/about` 모두 `<link rel="apple-touch-icon" ... sizes="180x180">` 방출, `/about` "앱처럼 설치하기"·"홈 화면에 추가" 렌더. 변경 .ts/.tsx U+FFFD 0.
- **남은 단계(운영자/제품)**: 첫 스토어 결정(TWA(Play $25)+assetlinks vs iOS App Store 래퍼 $99/yr) · 실기기 standalone OAuth 복귀 검증(§5 최대 리스크) · (선택) navigation-only network-first SW(데이터 JSON 비캐시 원칙 고정 시). **공개 문구 스토어 출시 미약속 유지.**
- **Next**: 운영자 첫 스토어(TWA vs iOS) 결정 + 실기기 OAuth standalone 복귀 확인.


## 2026-06-27 · Repair · Task 87 Playwright 게이트: 데스크톱 스크린샷 30s 타임아웃 (Claude)
- Blocker(QUALITY-GATE PLAYWRIGHT DESKTOP): `page.screenshot: Timeout 30000ms exceeded` — call log 가 `waiting for fonts to load... / fonts loaded` 직후 캡처 단계에서 멈춤.
- Root cause: 코드 결함성 — `src/app/globals.css` 1행의 **render-blocking 외부 @import**(`https://cdn.jsdelivr.net/.../pretendard...min.css`). 헤드리스/오프라인 게이트 샌드박스에서 이 외부 CDN 요청이 실패가 아니라 *멈춤(hang)* 으로 잡혀 첫 페인트·폰트 로드가 끝나도 렌더러/네트워크가 안정 상태에 도달하지 못해 스크린샷 캡처가 30초까지 대기 후 타임아웃. (프로덕션에서도 외부 폰트 CDN 단일 의존은 상용 준비도/프라이버시 리스크.)
- Fix(무의존·무에셋·시각 폴백 안전): @import 를 제거하고 Pretendard 를 **비차단(non-blocking)** 으로 로드.
  - `src/app/globals.css` — 1행 외부 @import 삭제(사유 주석으로 대체). 기존 `html { font-family: 'Pretendard Variable', Pretendard, ...시스템 한글 폴백 }` 체인은 유지 → 폰트 미로드 시 Apple SD Gothic Neo / Noto Sans KR 등으로 정상 폴백.
  - `src/app/layout.tsx` `<head>` — `preconnect` + `<link rel="stylesheet" data-font="pretendard" media="print">`(media 가 screen 과 불일치라 첫 페인트를 막지 않음) + 인라인 스크립트가 로드 완료 시 `media='all'` 로 승격. JS 비활성용 `<noscript>` 폴백 링크 동봉. → 프로덕션은 Pretendard 를 그대로 받고, 오프라인/헤드리스는 즉시 폴백·외부요청 대기 없음 → 스크린샷 무지연.
- Passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·Metrics 2.4 · `npm run build` exit 0(전 라우트). 빈 포트 4399 prod 스모크(내가 띄운 PID 만 종료, 4310 무중단): 과제 13개 라우트(`/ /login /about /offline /manifest.webmanifest /status /pricing /privacy /terms /stocks /stock/005380 /watchlist /settings/notifications`) 전부 200. 홈 head 에 `data-font="pretendard"`·`media="print"` 링크 확인, **빌드 CSS 번들에 jsdelivr @import 0건**(재현 차단 입증).
- Residual: 없음(폰트 로드 방식 한정, 점수/데이터/인증/PWA 로직 무변경). 운영자 선택: 정확한 브랜드 폰트를 CDN 의존 없이 고정하려면 추후 Pretendard woff2 self-host(예: `next/font/local`) 로 승격 가능 — 현재 폴백 동작은 안전.


## 2026-06-29 · [claude] Task 103 — OrnScore 2026-06-29 재검수 최종 커버리지·회귀 QA
- **Scope**: 데스크톱 리포트 `ornscore_reaudit_2026-06-29.md`(접근 가능·전문 정독함)를 기준으로 Task #99~#102가 마감한 14개 검수 항목을 코드 대조 검증하고, 남은 소규모 안전 갭만 최소 패치. 외부 릴리스/푸시 0. 브랜치 `ai-center/task-103-ornscore-2026-06-29-re-audit-final-c`(클린 시작).
- **검증(이미 정확 — 재작성 0)**:
  - P0-1 `/stocks` 카운트/필터 문구 — `copy/stocks.ts` `matchCount`("현재 표시 N개 / 전체 M개")·`noDetailFilter`("적용된 사용자 상세 필터 없음")·"기본 품질 필터(PER 200·PBR 30 이하)가 적용된 N개" 분기 확인.
  - P0-2 `/status` 시간대 — `status/page.tsx` generatedAt → KST 우선 + 원본 UTC 병기, `copy/status.ts dataCadenceNote`(영업일 장마감 후·주말/휴장 carry-forward) 확인.
  - P1-1 `/terms` 내부 문서 경로 제거 — `grep "legal-ai-commercial-readiness" src/` 0건.
  - P1-2 홈 공시 수 맥락 — `copy/home.ts` signal sub "DART · 최신 200건 내 · 신호 기준".
  - P1-3/4 관심/비교 빈·실패 상태 — `watchlist/page.tsx`·`WatchlistClient.tsx` noscript 폴백, `CompareClient.tsx` 빈 상태(최소 2·최대 4 안내 + 검색 input + `/stocks` CTA + 관심 종목 링크).
  - P1-5 요금제 표 — `pricing.ts COMPARE_ROWS`(관심 5개/무제한 예정·비교 4개/확장 예정·셀별 준비 중) 값 중심 명확화.
  - P1-6 홈 후보 vs 전체 상대순위 — `copy/home.ts rankCriteria`·`rankBadgeAria`("오늘 후보 순위 N위") + `TopCandidateSection`.
  - P1-7 업종 카운트 — `copy/stockDetail.ts peerDescMid` "곳(본인 포함)"으로 통일.
  - P1-8 로그인 카피 — `i18n.ts` "1초" 제거·"빠르게 시작".
  - P2-1 데이터 배지 분리 — `PriorityScoreCard.tsx` sr-only ` · ` 구분자.
  - P2-2 STEP 시맨틱 — `BeginnerReading.tsx` `<ol>/<li>` + STEP n 단일 배지(list-none).
  - P2-3 공시 CTA/배지 — `DisclosureExplorer.tsx` 원문 보기 액션과 `notInUniverse` 배지 DOM 분리(버튼 줄 아래 별도 줄).
  - P2-4 백테스트 히트맵 단위 — `MonthlyHeatmap.tsx` `title`·`aria-label`에 `%` 포함(fmtPct).
  - P2-5 생성일 vs 현재 데이터 — `BacktestClient.tsx` 상단 amber 배지("백테스트 기준: … 생성 · 현재 데이터 …과 다름").
  - P2-6 밸류 업종 미보정 경고 — `copy/stockDetail.ts valueNote` amber 주의 문구.
- **패치(1줄, 카피만)**: `copy/status.ts:86 footerNote` "데이터는 **매주 평일** 장 마감 후" → "데이터는 **평일마다** 장 마감 후". 리포트 §7.6이 "매주 평일"을 어색하다고 지적("매일 평일"/"평일마다" 권장)했고, 같은 파일 line 46(dataCadenceNote)·line 73(source detail "매일 평일")은 이미 자연스러운 표현이라 footerNote만 누락 → 일관성 정렬. 산식·`stocks.json`·인증·매니페스트 무변경, 금칙어 신규 0.
- **게이트**: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·Metrics 2.4 · `npm run build` 0(138 SSG·전 라우트) · `git diff --check` 0. `app:check`는 앱셸/PWA 파일 무변경이라 생략(copy 모듈만 수정).
- **스모크**: 빈 포트 47103 `next start`(listening PID 16664만 종료, 4310 PID 37328 무중단) — 16개 라우트(`/ /stocks /status /terms /watchlist /compare /pricing /login /history /privacy /disclosures /backtest /guide/metrics /stock/034730 /stock/032830`) 전부 200, `/status` SSR에 "평일마다 장 마감 후"·KST·"영업일 장마감" 렌더·"매주 평일" 0건. 변경 파일 U+FFFD 0.
- **잔여 갭(리포트 권고 중 미반영 — 코드 범위 외)**: P2-3 샘플 데이터 가시성(전체 기간 공시 파이프라인=④), 도메인 기반 support/privacy 이메일(현재 개인 이메일만·발명 금지=⑤), EN 라이브러리/메타데이터 i18n 갭(언어 전환 클라 사이드라 curl로 EN 미검증 — SSR=ko·EN 문자열은 `.next/static/chunks` 컴파일 확인 필요), 390px 실기기 시각 게이트(Playwright 미구성=운영자).
- **다음 소유자 검토**: 운영자/제품 — 위 잔여 ④/⑤ 항목 + EN 토글 실브라우저 확인. 본 작업은 푸시/릴리스 미수행(로컬 커밋만).


## 2026-06-30 · Repair · Task 112 Playwright 스크린샷 30s 타임아웃(자동화 backdrop-filter 무력화) (Claude)
- **Blocker**: 게이트 `page.screenshot: Timeout 30000ms exceeded` (DESKTOP+MOBILE), `fonts loaded` 직후 캡처 행.
- **폰트 가설 기각**: 기존 `if(navigator.webdriver)return;` 가드로 Playwright에서 jsdelivr 요청 0건 → 폰트는 원인 아님. Task 87/110/112 폰트 수리가 모두 동일 시그니처로 재발한 이유.
- **실원인**: 모든 페이지 앱셸의 `sticky`/`fixed` `backdrop-filter`(헤더 `backdrop-blur-md`·하단바 `backdrop-blur`)가 헤드리스 크로뮴 캡처 시 재합성되어 행(hang). Playwright `animations:'disabled'`도 backdrop-filter는 못 끔.
- **Fix(`src/app/layout.tsx`)**: webdriver 가드 확장 — 자동화에서만 `<style>` 주입으로 `backdrop-filter/animation/transition` 무력화 후 `return`(CDN 폰트 생략 유지). 실사용자 시각 무변경, 데이터/점수/인증/PWA 무변경, 신규 deps 0.
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 SSG) · `git diff --check` clean · layout.tsx U+FFFD 0. 포트 47733 prod 스모크: 15개 라우트(/ /stocks /stock/034730 /watchlist /about /status /disclosures /backtest /pricing /compare /history /guide/metrics /terms /privacy /login) 전부 200, `/` HTML에 `backdrop-filter:none!important` 가드 확인(리스너 PID 35224만 종료, 4310 PID 37328 무중단).
- **잔여/다음 소유자**: 운영자 — (선택) backdrop-filter 전역 경량화 또는 Pretendard self-host. 푸시/릴리스 미수행(로컬 커밋만).


## 2026-06-30 · [claude] Task 118 — OrnScore 안전 1차 성능/속도 패스 (측정 + 종목 상세 지연 로딩)
- **Scope**: 무료 베타 공개 표면을 시각/동작/데이터/점수/인증/라우트 의미 무변경으로 유지하며 체감·로드 속도 1차 개선. 신규 npm 0, 점수식·stocks.json·인증/env/결제 무변경, AI 숨김·한국어 전용·138종목·비자문 불변식 유지. 변경 = 종목 상세 1개 라우트의 클라이언트 번들만(page.tsx 수정 + 지연 래퍼 3 신규). 브랜치 ai-center/task-118-ornscore-safe-performance-speed-pass(클린 시작).
- **Phase 1 baseline 라우트 표(First Load JS, 10개 과제 라우트)**: / 118kB · /stocks 183kB · /stock/[ticker] **191kB(페이지별 32kB·최대)** · /login 170kB · /pricing 102kB · /status 133kB · /disclosures 179kB · /backtest 128kB · /watchlist 168kB · /compare 167kB · 공유 87.2kB. 최대 페이지 청크 raw = app/stock/[ticker]/page.js 113,420 B.
- **Phase 1 TTFB(로컬 prod 4431, curl 3샘플 median)**: 8개 라우트 20~64ms. /stock/034730·/watchlist만 ~7,080ms — 둘 다 서버에서 Supabase daily_scores 조회(getScoreHistory·getScoreChangesBatch). 7초는 로컬→원격 Supabase 왕복 지연(환경 아티팩트): 프로덕션은 Supabase 동위치라 빠르고 /stock/[ticker]는 SSG라 프리렌더 서빙. 코드 결함 아님 → 데이터 패칭 변경은 동작 리스크라 follow-up 문서화.
- **Phase 2 적용(안전)**: 종목 상세 below-fold 클라 위젯 3종을 next/dynamic({ssr:false})로 지연 로딩(동일 높이 스켈레톤·CLS/SSR 텍스트 보존):
  - StockPriceChartLazy.tsx(신규) — 인터랙티브 SVG 가격 차트(hover/range).
  - StockDisclosuresLazy.tsx(신규) — 공시 탭(기본 탭 아님·클라 패칭).
  - StockEventTimelineLazy.tsx(신규) — 근거 탭(기본 탭 아님·클라 패칭).
  - stock/[ticker]/page.tsx — 위 3개 lazy 래퍼로 교체(props/문구/조건/데이터 동일).
  - ScoreHistoryChart 미변경(순수 서버 컴포넌트·클라 JS 0 → 지연 이득 없음). lucide-react optimizePackageImports는 Next 14.2 기본 포함이라 no-op(라우트 표 바이트 동일) → 되돌림(next.config.mjs 원본).
- **Phase 2 before→after**: /stock/[ticker] First Load 191kB→189kB, 페이지별 32kB→29.4kB. 나머지 9개 무변경(상세 라우트 한정 변경). raw 페이지 청크 113,420 B→94,650 B(−18.8KB, ~16.5%↓). 분리 지연 청크 3개 생성(차트 6,079B·공시 6,888B·타임라인 3,254B). TTFB는 변동 없음이 정상(서버 시간이라 클라 번들 축소 무관).
- **Gates**: tsc --noEmit 0 · npm run build 0(138 SSG·라우트 의미 무변경) · git diff --check 0 · 변경/신규 파일 U+FFFD 0. app:check 생략(셸/PWA/auth/nav 무변경).
- **Smoke(로컬 prod 4431, 리스너 PID만 taskkill·AI Center 4310 PID 37328 무중단 확인)**: 10개 과제 라우트 전부 200. /stock/034730 SSR(ko) — 추세/거래활성도/밸류/위험조정·결론 히어로 렌더, 차트 스켈레톤(aria-busy+"주가 차트")이 SSR HTML에 존재(CLS 가드), 불변식 유지(AI 종합 분석/분석 기록 0·LanguageSwitcher 0·138 노출).
- **Follow-up(동작 리스크라 미적용)**: (1) /watchlist 서버 Supabase 138-ticker 배치 쿼리 캐시/타임아웃/클라 이행 검토 (2) /stock getScoreHistory 타임아웃 가드 (3) GlobalSearch props themes 축소(검색 동작 의존이라 보류) (4) /compare·/disclosures 등 추가 below-fold 위젯 동일 패턴 지연.
- **다음 소유자**: 운영자/제품 — 외부 사이트(Vercel) 반영은 별도 단계. 푸시/릴리스 미수행(로컬 커밋만).


## 2026-07-02 · [claude] Task 127 — OrnScore 공개 사이트 릴리스 후 QA + 피드백 인테이크 준비
- **Scope**: 릴리스 후 공개 사이트 읽기 전용 QA 패스 + 피드백 인테이크 노트 작성. 앱 소스 무수정(코드 결함 0 → 안전한 1줄 수정 후보 없어 무변경). 외부 릴리스/푸시/스토어/결제/외부계정 변경 0. 브랜치 ai-center/task-127-ornscore-public-site-post-release-qa(클린 시작, HEAD 8b1ecc8).
- **산출물**: `docs/ornscore-post-release-qa-2026-07-02.md`(신규 — Task 48 `ornscore-qa-feedback.md` 미덮어씀). P0/P1/P2 분류 + 운영자 확인 항목 + 육안 체크리스트 + 다음 작업 제안.
- **점검 경로(로컬 prod 4455, SSR/에셋)**: `/ /today /stocks /stock/034730 /watchlist /compare /login /disclosures /pricing /status /manifest.webmanifest` → 11/11 HTTP 200, 치명 마커 0(Application error/Hydration/TypeError/ReferenceError/Cannot read/Unhandled).
- **무료 베타 불변식 6종 재확인(전부 유지)**: INV-1 138종목 명확(홈/og/manifest) · INV-2 비자문 고지(홈 "데이터 도구"·상세 "투자 추천 아님"·요금제 고지) · INV-3 한국어 전용(홈 SSR LanguageSwitcher/English/hreflang 0·AppHeader/MobileNav 렌더 0) · INV-4 AI 공개 숨김(상세 SSR "AI 분석 실행"/"Anthropic"/AiAnalysis 0·`src/app/stock/` AiAnalysisCard 사용 0·/history 내비 0) · INV-5 요금제 무료 베타·확정가(9,900/14,900/29,000) 0 · INV-6 요금제 내비 강등(Sidebar group:"more"·MobileBottomNav MORE 그룹). 로그인 진입 명확(헤더/watchlist "로그인" CTA, 제공자 카카오·구글·네이버·이메일).
- **PWA 신호(실사용 수준)**: viewport `viewport-fit=cover`·`maximum-scale` 없음 · theme-color 라이트/다크 2종 · apple-mobile-web-app-* 3종 · manifest display:standalone·lang ko-KR·138 description·shortcuts 3·icons 192/512/512-maskable · 아이콘 5개(192/512/512-maskable/apple-touch/manifest) 전부 200(404 0) · safe-area-inset top/bottom CSS 존재.
- **게이트**: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·Metrics 2.4 · `npm run build` 0(138 SSG·라우트 표 불변) · `app:check` 통과(assetlinks WAIT 1건 = 운영자 외부 게이트, 회귀 아님) · `perf:check`(base 4455) 11라우트 200·advisory 경고 0.
- **findings**: P0 0 · P1 1(실 브라우저 시각 게이트 부재 = Task 48 P1-VISUAL 승계, 운영자 육안) · P2 3(manifest 단일 theme_color 라이트 상단바 어둡게 · safe-area 좌우 미적용 가로/노치 · Category-B 라우트 로컬 ~4s Supabase 왕복 = 환경 아티팩트·회귀 아님).
- **스모크 정리**: 로컬 prod 리스너 PID 11636만 taskkill, AI Center 4310(PID 26420) 무중단 확인. 신규 노트 U+FFFD 0.
- **다음 소유자**: 운영자/제품 — 실기기 OAuth 왕복 + 데스크톱/390px 육안 게이트 + (선택) P2 폴리시. 잔여 커버리지(공시 파이프라인④/도메인 이메일⑤/EN i18n)는 spec-coverage 문서로 추적 유지. 푸시/릴리스 미수행(로컬 커밋만).

## 2026-07-02 · [claude] Task 129 — OrnScore 전문가/QA 피드백 배치 인테이크 템플릿 (docs-only)
- **Scope**: 미래 QA/전문가 리포트를 붙여넣으면 우선순위(P0/P1/P2)·카테고리·검증 게이트가 붙은 로컬 자동화 task 목록으로 바꾸는 재사용 템플릿 신설. 문서만 변경(신규 doc 1 + handoff/PROGRESS), 코드/런타임/UI 소스 무변경, 신규 npm 0. 불변식(무료·한국어 전용·138종목·AI 공개 숨김·비자문·유료/Pro 비홍보) 유지. 브랜치 ai-center/task-129-ornscore-expert-feedback-batch-intak.
- **산출물**: `docs/ornscore-expert-feedback-intake-template.md`(신규). 목적/사용법 + 톤 규칙 + 다룬다/다루지 않는다 + 참조 블록(중복 없이 링크) + 불변식 가드(rejection filter, scope creep 거절) + Severity 루브릭(Task 48/127 재사용) + 8-카테고리 분류표(소유 파일/게이트 매핑) + task 프롬프트 구조 + 거짓 승인 트리거 회피(나쁜예↔좋은예 3쌍) + fill-in 배치 인테이크 표 + 운영자 전용 외부 단계 버킷.
- **게이트**: 신규 doc + handoff + PROGRESS U+FFFD 0(Korean intact) · git status 문서 3개만 변경(소스 0) · `npx tsc --noEmit` 0(코드 무변경 재확인) · `git diff --check` CRLF 노이즈만. 런타임/UI 무영향.
- **다음 소유자**: 실제 리포트 유입 시 표를 채워 §4 가드 통과 항목만 task 방출, 불변식 위반·코드로 못 닫는 항목은 §8 운영자 버킷(실기기 OAuth·시각 게이트·assetlinks·스토어·결제·main push). 푸시/릴리스 미수행(로컬 커밋만).

## 2026-07-06 · [codex] OrnScore design/UX main 배포 완료
- **범위**: 사용자가 `일단 배포하자` 및 후속 승인으로 main 반영을 명시. design/UX 재검수 작업 7커밋과 최신 일일 데이터 갱신을 함께 운영 기준으로 배포.
- **브랜치/데이터**: `origin/main`의 daily refresh `0131651`을 design/UX 브랜치에 먼저 병합한 뒤, 검증된 HEAD `7e5b24f`를 `main`으로 fast-forward하고 `origin/main`에 push. 데이터 기준은 `asOfBusinessDate 20260706`, visible date `2026.07.06`, Metrics 2.4, 138 stocks.
- **로컬 pre-push 게이트**: `npx tsc --noEmit` 0, `PYTHONUTF8=1 python scripts/verify_metrics.py` 138 stocks/0 errors/0 forbidden-copy hits/Metrics 2.4, `npm run app:check` 0(Android assetlinks external WAIT 1 only), `npm run build` 0, `git diff --check` clean, local prod 4474 `verify:routes` 9/9, `smoke:check --all` 23/23, `verify:login-preflight` 5/5.
- **공개 배포 확인**: `https://ornscore.com`에서 cache-busted `verify:routes` 9/9 통과(expected date `2026.07.06`), public `smoke:check --all` 23/23 통과.
- **남은 외부 게이트**: Android `/.well-known/assetlinks.json`은 실제 Android package + SHA-256 fingerprint 확정 전까지 WAIT 상태. OAuth provider round-trip은 owner/live-service gate.
- **다음에 바로 실행할 작업**: 설계서 순서상 Task 221의 첫 구현 슬라이스인 관심종목 CSV export 전용 유틸(`src/lib/watchlistCsv.ts`)과 `WatchlistClient` 내보내기 버튼을 추가하고, BOM/CSV escaping/금칙어/로컬+Supabase watchlist 양쪽 기준을 검증.
## 2026-07-06 · [codex] 시각 체감형 리디자인 main 배포
- **배포**: 사용자가 화면 확인 후 "괜찮은거같다. 배포가자"로 승인. `codex/ornscore-visual-redesign-home-detail-20260706`의 `d1b0950`을 `main`으로 fast-forward하고 `origin/main`에 push.
- **공개 반영 확인**: Vercel/CDN 반영 대기 후 `https://ornscore.com` cache-busted HTML에서 새 home/stock-detail UI 마커 확인. 이후 public `verify:routes` 9/9(expected date `2026.07.06`) 및 public `smoke:check --all` 23/23 통과.
- **남은 외부 게이트**: Android `assetlinks.json` WAIT는 기존과 동일. 점수/데이터/후보 선정 로직 변경 없음.
- **다음에 바로 실행할 작업**: 추가 시각 개선을 계속하면 온보딩 박스, 시장 스냅샷, 하단 섹션까지 이번 톤으로 통일. 기능 작업으로 돌아가면 Task 221 관심종목 CSV export 첫 구현.

## 2026-07-06 · [codex] 시각 체감형 리디자인 1차
- **범위**: 사용자가 "디자인이 크게 변하지 않았다"고 피드백한 뒤, 홈 첫 화면과 종목 상세 상단을 실제로 눈에 띄게 바꾸는 1차 패스 진행. 데이터, 점수 산식, 후보 선정, 공시 로직은 변경하지 않음.
- **홈 변경**: `HomeHero`를 어두운 박스형 히어로에서 밝은 분석 보드 + 어두운 후보 미리보기 보드로 재구성. 제목/CTA/게이지/KPI 대비를 키우고 lucide 아이콘을 CTA/KPI에 적용. `TopCandidateSection`은 1위 후보를 큰 카드로, 나머지를 보조 레일로 나누고 `StockCandidateCard`에 `featured` 상태를 추가.
- **종목 상세 변경**: `StockConclusionHero`를 전체 폭 분석 보드로 변경하고, `StockHeader`, `LivePrice`, `ConclusionSummaryCard`, `PriorityScoreCard`의 타이포/카드 대비/점수 게이지 크기를 키움. 상단에서 종목명, 가격, 결론, 탐색 우선도, 순위가 더 크게 보이도록 조정.
- **디자인 규칙 반영**: 전역 `letter-spacing`을 0으로 맞춤. 새 CTA에는 lucide 아이콘을 사용했고, 데스크톱/모바일에서 가로 오버플로가 없도록 확인.
- **검증**: `npx tsc --noEmit` 0, `PYTHONUTF8=1 python scripts/verify_metrics.py` 138 stocks/0 errors/0 forbidden-copy hits/Metrics 2.4, `npm run app:check` 0(Android assetlinks WAIT 1 only), `npm run build` 0, `git diff --check` clean, local prod 4476 `verify:routes` 9/9, `smoke:check --all` 23/23. 인앱 브라우저 캡처로 desktop home/candidates, desktop stock detail, mobile 390px home/stock detail 확인: horizontal overflow 0, console error 0.
- **다음에 바로 실행할 작업**: 사용자가 OK하면 이 브랜치를 main에 배포. 추가 시각 개선을 더 한다면 온보딩 박스/시장 스냅샷/하단 섹션까지 같은 톤으로 정리해 첫 화면 전체 일관성을 맞춘다.
