# ORNSCORE 모바일 뷰포트 후속 감사 (Task 198)

> 코어 모바일 뷰포트(360px·390px)에서 6개 라우트 + 공용 크롬을 다섯 결함 클래스 기준으로
> 소스 대조 감사한 결과. **설계서 1 §O QA 체크리스트**의 후속(⑤ 실기기 게이트 계열).
>
> 작성: 2026-07-04 (Task 198, Claude). **소스 무변경**(코드 회귀 0건 확인) · 문서 전용.
> 톤 규칙 유지: 후보·탐색·확인 프레이밍(매수/매도/추천 신규 표현 0). 점수식/데이터/`direction` 무변경.

## 감사 범위 · 방법

- **뷰포트**: 360px(최소 코어)·390px(대표). 다크/라이트 공통.
- **다섯 결함 클래스**: ① 헤더 겹침(header overlap) · ② 넘침(overflow) · ③ 밀집 컨트롤 그룹(cramped controls) · ④ 탭 타깃(≥44px) · ⑤ 레이아웃 점프(CLS).
- **방법**: 실기기 육안이 아니라 **소스 안티패턴 대조**(`min-w-[`·`overflow-x`·`whitespace-nowrap`·`grid-cols-N`·`py-1`/`py-1.5`·고정 px 폭 grep + 각 라우트 주 클라이언트 컴포넌트 정독). 실 브라우저 픽셀 육안은 여전히 **운영자 ⑤ 게이트**(Playwright 미구성).
- **게이트 기준선(편집 전=편집 후, 소스 무변경)**: `tsc` 0 · `verify_metrics` 138/0/0 · `build` exit 0(138 SSG) · `smoke:check --all` 12/12 · 6개 라우트 SSR 앵커 정상.

## 공용 크롬(모든 라우트에 렌더)

| 요소 | 결함 클래스 점검 | 상태 |
|---|---|---|
| `AppHeader.tsx` 헤더 행 | `gap-2`·`shrink-0`·`min-w-0`·중앙 검색 `flex-1 min-w-0`. 로그아웃 시 `AccountButtons`는 `hidden md:inline-flex`라 모바일 우측 클러스터 비대 없음(=`CompareBadge`+검색만) | keep-as-is |
| `AppHeader` sticky 계층 | `<header>` = `sticky top-0 z-40 pt-[env(safe-area-inset-top)]`. 홈 SSR에서 `sticky top-0 z-40` 확인 | keep-as-is |
| `HeaderDataBar.tsx` | 좌측 `truncate min-w-0`, 우측 클러스터 `shrink-0`. 360px에서 우측은 신뢰 모달 버튼만(배지·소스문자열은 `hidden md:`/`sm:`) → 겹침·넘침 없음 | keep-as-is |
| `MobileNav.tsx` 드로어 | `w-[min(340px,calc(100vw-48px))]`·`document.body` 포털(backdrop-blur 컨테이닝 회피)·`overflow-y-auto`·탭 타깃 `py-3`/`w-9 h-9` | keep-as-is |
| `MobileBottomNav.tsx` | 5셀 `grid-cols-5`, 라벨 `max-w-full truncate`, `h-[calc(3.5rem+safe-area)]`, `more` 시트 `grid-cols-3` | keep-as-is |
| `layout.tsx` `<main>` | `pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0`으로 하단 네비가 본문을 가리지 않음 + `min-w-0` | keep-as-is |

## 라우트별 결과

각 셀 = 해당 결함 클래스의 상태. **fixed**=수정 / **keep**=이미 정상(불필요 churn 회피) / **owner⑤**=실기기 결정 필요.

| 라우트 | ①헤더겹침 | ②넘침 | ③밀집컨트롤 | ④탭타깃 | ⑤레이아웃점프 |
|---|---|---|---|---|---|
| home (`page.tsx` + `home/*`) | keep | keep | keep | keep | keep |
| today (`today/page.tsx` + `today/*`) | keep | keep | keep | keep | keep |
| stocks (`StocksExplorer` + `stocks/StockResultsTable`) | keep | keep | keep | keep | keep |
| stock 상세 (`stock/[ticker]` + `StockTabs` + `stock/*`) | **owner⑤** | keep | keep | keep | keep |
| compare (`CompareClient`) | keep | keep | keep | keep | keep |
| login (`login/LoginContent`) | keep | keep | keep | keep | keep |

### home
- `MarketSnapshotCards` = `grid-cols-2 lg:grid-cols-4`(360px에서 2열, 넘침 없음). `HomeHero`·`FeatureCards`·`HowItWorks`·`DisclosureSignalSection` 다열 그리드는 전부 `grid-cols-1` 또는 소형 스탯 셀 기반.
- `MyStocksSection`: **⑤ 레이아웃 점프 관련 — keep-as-is(의도된 하이드레이션 안전 패턴)**. `!mounted → null`은 SSR/클라 첫 렌더 일치(불일치 회피)를 위한 것이고, 마운트 후 로딩 스켈레톤(`h-[52px]` 2칸)→콘텐츠로 전환. 초기 0→콘텐츠 미세 이동은 로컬 저장소 의존 개인화 위젯의 불가피한 특성으로, `MarketSnapshotCards`가 위에 먼저 렌더돼 상단 앵커가 흔들리지 않음. 소스 무변경.
- 스텝 배지/링크의 `whitespace-nowrap`은 전부 `shrink-0` 또는 `flex-wrap` 컨테이너 안이라 넘침 유발 없음.

### today
- `TodayStatusBar`·`오늘 확인 순서` 링크 = `min-h-[44px]`·`flex-wrap gap-2`. 신호 섹션 = `SignalSection`(`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
- `MarketSnapshotCards`/`grid-cols-2 sm:grid-cols-4` 브리핑 KPI = 360px 2열. 넘침·밀집 없음.

### stocks
- `StockResultsTable`: **넓은 표 → `overflow-x-auto` 래퍼 정상**(`border`+`rounded-lg`). 셀 `whitespace-nowrap`은 스크롤 컨테이너 내부라 의도된 가로 스크롤. 시그널 칩 `flex-wrap max-w-[180px]`.
- `StocksExplorer`: 검색 입력 `min-h-[44px]`, 프리셋 카드 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, 헤더 카운트/토글 행 `flex-wrap`.
- **필터 라이브카운트 바(`StocksExplorer:666`) `sticky top-0 z-10` = keep(정상 스코프)**: 모바일에선 `fixed inset-y-0 right-0` 드로어(`:1080`) 내부, 데스크톱에선 `sticky top-24` 사이드바 내부라 앱 헤더와 경합하지 않음. 마켓/시총 필터 `grid-cols-3`/`grid-cols-2`는 드로어(≈340px) 폭 안 소형 버튼.
- 저장검색 요약 바 칩(저장/알림/초기화, `:1015~1017`)은 `py-1.5`(≈28px)로 44px 미만이나, 주변 `text-[11px]` 밀집 보조 컨트롤과 정합하는 **의도된 컴팩트 패턴** → 44px 강제 시 인접 칩과 시각 불일치·churn 유발이라 keep-as-is.

### stock 상세 — ① 헤더 겹침: **owner⑤ (유일한 실질 발견)**
- **요소**: `src/components/StockTabs.tsx:53` 탭 바 `className="sticky top-0 z-10 ..."`.
- **결함**: 앱 `<header>`가 `sticky top-0 z-40`(항상 노출·상위 z). 상세 페이지 본문 흐름의 탭 바는 스크롤 시 동일 `top:0`에 고착되며 z-10 < z-40이라 **헤더 뒤로 가려짐(occlusion)**. 실무 영향은 "sticky가 조용히 no-op(일반 스크롤처럼 헤더 아래로 사라짐)"으로 저심각도이며 레이아웃 깨짐/콘텐츠 겹침/탭 타깃 문제는 아님. SSR에서 동일 페이지에 `sticky top-0 z-40`와 `sticky top-0 z-10` 공존을 확인함.
- **왜 지금 수정하지 않았나**: 올바른 수정은 헤더 높이만큼 `top` 오프셋을 주는 것(`top-[calc(<헤더높이>+env(safe-area-inset-top))]`)인데, 헤더 높이가 브레이크포인트(모바일/`md`/`lg`)와 `env(safe-area-inset-top)`(노치)에 따라 달라져 **정확한 픽셀 오프셋은 실기기에서만 검증 가능**(자동화 게이트/curl로는 sticky 스크롤 고착을 검증 불가). 검증 없이 매직 넘버를 넣으면 오히려 여백/미세 겹침으로 현재보다 나빠질 수 있어, 플랜의 "리스크 있는 강제 변경 대신 라우트/요소를 명시해 블로커로 표면화" 지침에 따라 **owner⑤ 게이트로 기록**.
- **권고(운영자·실기기)**: (a) 탭 바를 헤더 아래에 고착시키려면 헤더 실측 높이 기반 `top-[calc(…)]` 오프셋 + 안전영역 합산을, 또는 (b) sticky 자체를 제거해 일반 스크롤로 단순화. 둘 다 실기기 육안 후 결정 권장.
- 그 외 상세: `StockDetailActionButtons`(`grid-cols-1 min-[380px]:grid-cols-2 xl:grid-cols-4`·`min-h-[44px]`), `SectorComparison`(`overflow-x-auto`+`min-w-[280px]`), `MetricInsightCards` 상위% 막대 = keep.

### compare
- 재무/수익률/테마 비교 표: **`-mx-3 md:mx-0 px-3 … overflow-x-auto` + `sticky left-0`(불투명 `bg-white dark:bg-zinc-900`) 라벨 열**로 좁은 화면 가로 스크롤 처리 정상. 카드 스트립은 `ScrollX`(`overflow-x-auto md:overflow-visible`, count>2일 때만 `minWidth`).
- 되돌리기 토스트 `max-w-[180px] truncate`.

### login
- 소셜/이메일/제출 버튼 전부 `w-full … min-h-[44px]`. `LoginSkeleton`(Suspense 폴백)이 카드 높이를 흉내 내 **CLS 완화 이미 반영**. provider/benefit 행 넘침 없음.

## 변경 파일

**없음.** 여섯 라우트 + 공용 크롬 모두 다섯 결함 클래스에서 이미 정상(keep-as-is)이며, 유일한 실질 발견(StockTabs sticky occlusion)은 실기기 오프셋 결정이 필요한 **owner⑤** 항목이라 강제 수정하지 않음(불필요 className churn 회피). className/JSX 무변경 · 점수식/데이터/`direction`/`dataStatus`/카피 무변경.

## 게이트 결과(기준선 = 최종, 소스 무변경)

- `npx tsc --noEmit` → **0 errors**
- `python scripts/verify_metrics.py` → **검사 138종목 · 오류 0건**(브랜드 금칙 0·산식 2.4 정합) *(콘솔 `cp949` 이모지 인코딩 경고는 게이트 실패 아님; `PYTHONIOENCODING=utf-8`로 exit 0 확인)*
- `npm run build` → **exit 0**
- `npm run smoke:check -- --base http://localhost:4455 --all` → **12/12 OK**
- SSR 앵커: `/`(오른스코어)·`/today`·`/stocks`·`/stock/034730`·`/compare`·`/login` 각 양성 앵커 렌더 확인.

## 남은 게이트

- **실 브라우저 모바일 픽셀 육안(360/390px)** — Playwright 미구성 → **운영자 ⑤ 게이트**(설계서 1 §O·Task 38/40/41/154/166/177 공통 잔여).
- **StockTabs sticky 오프셋 결정** — 위 stock 상세 ① 참조. 실기기 후 (a) 오프셋 또는 (b) sticky 제거 결정.
