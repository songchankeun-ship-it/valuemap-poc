# 출시 후 24–72시간 분석 리뷰 플레이북 (오너용)

> 무료 한국어 베타를 외부에 노출한 직후, **오너가 첫 24–72시간 동안 무엇을 어디서 어떻게 볼지**를 한 장으로 정리한 참고 문서.
> 성격: **읽기 전용 참고**(앱 UI·점수식·데이터·수집 규칙 무변경). 새 SDK·분석 파이프라인을 깔지 않는다 — 지금 코드에 이미 있는 표면만 가리킨다.
> 작성: 2026-07-14 (Task 258 · 분석 운영 배치 D, [codex]). 톤 규칙: 후보·탐색·확인·참고 정보 유지(매수·매도·추천 신규 표현 0).
> 교차 참고: [`ornscore-analytics-event-map-2026-07-12.md`](./ornscore-analytics-event-map-2026-07-12.md) · [`ornscore-route-analytics-classification-2026-07-14.md`](./ornscore-route-analytics-classification-2026-07-14.md) · [`ornscore-launch-observability-checklist.md`](./ornscore-launch-observability-checklist.md) · [`ornscore-admin-traffic-telemetry-plan.md`](./ornscore-admin-traffic-telemetry-plan.md)

핵심 원칙: **첫 리뷰의 목표는 방문 총량이 아니라 퍼널 모양이다.** 발견(라우트 진입·검색)에서 실제 제품 행동(종목 상세·비교·관심·로그인 의도)으로 사람이 넘어가는지를 본다.

---

## 1. 어디서 보나 (3곳)

| 순서 | 표면 | 무엇을 보나 | 성격 |
|---|---|---|---|
| 1 | **Vercel Analytics 대시보드** | 익명 방문·이벤트 실제 수치(카운트·추이). 아래 §3의 이벤트 이름으로 필터. | 외부(오너 콘솔) |
| 2 | **`/admin/traffic`** (트래픽·이벤트 개요) | 지금 무엇을 어떻게 수집하는지, 이벤트 8그룹 정의, 프라이버시 경계, 이 플레이북 요약. | 내부 운영용(표시 전용) |
| 3 | **`/admin/users`** (가입자 운영 현황) | 로그인·가입 활동(익명 트래픽과 별개). KST 오늘/7일/30일 로그인, 대기 신청, 저장 기능 사용. | 내부 운영용(Supabase Auth) |

- 익명 방문·이벤트의 **실제 숫자는 관리자 화면이 아니라 Vercel Analytics**에서 본다. `/admin/traffic`은 "무엇을 재는지"를 설명하는 지도이지 숫자판이 아니다.
- **로그인 활동 ≠ 익명 방문.** 로그인·가입은 `/admin/users`, 익명 방문·클릭 퍼널은 Vercel Analytics에서 본다. 두 축을 섞지 않는다.
- `/admin` 계열 라우트는 공개 분석 수집에서 **제외**된다(운영자 트래픽이 방문 수치를 오염시키지 않음).

---

## 2. 언제 무엇을 (24 / 48 / 72시간)

| 시점 | 볼 것 | 판단 |
|---|---|---|
| **~24h** | 라우트 진입(`route_view_public`)이 뜨는지, 허용된 `campaign`별 유입이 구분되는지, 5xx/치명 없이 핵심 라우트가 살아있는지. | "수집이 실제로 되고 있나"의 생존 확인. 이벤트가 0이면 배포·환경(Vercel) 문제부터 의심. |
| **24–48h** | 발견 → 상세 전환. 홈/검색/주제에서 종목 상세로 넘어가는 비율의 **모양**. | 진입은 있는데 상세로 못 넘어가면 랜딩·검색 카피/도입부를 의심. |
| **48–72h** | 상세 이후 행동(비교·관심·근거 열람)과 로그인 의도. 재방문 신호. | 상세까지는 오는데 행동이 0에 가까우면 상세 페이지의 다음 행동 유도를 의심. |

> 절대 임계값을 외우려 하지 말 것. 베타 초기 표본은 작다. **비율·방향·전일 대비 변화**를 보고, 단일 수치의 절대 크기로 성패를 단정하지 않는다.

---

## 3. 먼저 볼 이벤트 (퍼널 순서)

정본 정의·프로퍼티는 이벤트 맵 문서 표에 있다. 여기서는 **첫 리뷰에서 볼 우선순위**만 순서대로 나열한다.

1. **진입 (top of funnel)** — `route_view_public`
   - 외부 공개 링크는 고정 `ref` 값을 사용하고, Vercel Analytics에서
     `campaign`별 진입과 `routeKind`를 함께 본다. 허용 목록과 링크 정본은
     `docs/ornscore-public-launch-kit-2026-07-29.md`에 있다.
   공개 라우트 1회 진입. `routeKind`로 어떤 종류의 페이지가 뜨는지 본다. 이게 0이면 그 아래는 볼 필요가 없다.
2. **발견 → 상세** — `home_candidate_open` · `search_result_open` · `topic_stock_open`
   홈 "오늘의 후보" 카드, 전역 검색 결과 클릭, 주제 페이지에서 종목 상세로 넘어가는 세 갈래. **가장 중요한 전환 지점.**
3. **탐색 폭 넓히기** — `search_view_all` · `topic_all_stocks_click` · `search_empty_open_stocks`
   자동완성·주제에서 탐색기로 확장. 검색 의도는 있는데 결과가 안 맞을 때의 신호도 포함.
4. **비교·관심 의도 (mid funnel)** — `compare_toggle` · `compare_tray_open` · `watchlist_toggle` · `watchlist_detail_open`
   사용자가 후보를 모으고 되돌아오려는 신호. 제품 가치에 도달했는지의 핵심 지표.
5. **계정 의도 (bottom)** — `auth_cta_click` · `watchlist_login_cta`
   로그인/시작 흐름 진입. 저장·알림 가치를 느껴 계정으로 넘어가려는 의도. 실제 가입 수치는 `/admin/users`와 교차 확인.
6. **데이터 신뢰 신호** — `report_data_issue_open` · `report_data_issue_submit` · `report_data_issue_result`
   신고가 늘면 특정 종목·지표 데이터 품질을 점검(신고 본문은 수집하지 않으므로 `/admin/status`의 `data_reports`로 실제 내용 확인).

---

## 4. 건강한 모양 vs 우려되는 모양

절대 수치가 아니라 **모양**으로 읽는다.

| 신호 | 건강함 (기대) | 우려됨 (점검) |
|---|---|---|
| 진입 대비 상세 전환 | 진입이 있으면 `*_stock_open` / `home_candidate_open`이 함께 붙는다 | 진입만 쌓이고 상세 전환이 거의 0 → 랜딩·검색 카피, 첫 화면 도입부 점검 |
| 검색 결과 적합성 | `search_result_open`이 `search_empty_open_stocks`보다 우세 | `search_empty_*`가 우세 → 검색 커버리지·동의어·자동완성 점검 |
| 상세 이후 행동 | 상세 방문에 비교·관심 토글이 붙는다 | 상세는 오는데 `compare_*`/`watchlist_*`가 0에 가까움 → 상세의 다음 행동 유도 점검 |
| 계정 의도 | `auth_cta_click`이 꾸준히 발생, `/admin/users` 가입과 방향 일치 | CTA 클릭은 있는데 가입이 안 붙음 → 로그인 화면·OAuth 왕복(오너 게이트) 점검 |
| 데이터 신고 | 낮게 유지 | 특정 `category`/`ticker`에 신고 급증 → 해당 데이터 우선 점검 |
| 운영 라우트 오염 | `/admin*`가 공개 수치에 안 잡힘 | 운영 라우트가 방문에 섞임 → 분류 헬퍼(`routeAnalytics.ts`) 회귀 의심 |

빠른 헬스: 핵심 라우트가 5xx 없이 살아있는지는 `npm run verify:local`(로컬) 또는 `npm run verify:local --base https://ornscore.com`(운영, 오너 실행)으로 확인. 라우트 인벤토리는 [`ornscore-launch-observability-checklist.md`](./ornscore-launch-observability-checklist.md).

---

## 5. 오너 게이트로 남는 것 (운영 영역 내 직접 숫자 대시보드)

현재 `/admin/traffic`은 **표시 전용 지도**다 — 무엇을 재는지 설명하고 외부 대시보드로 링크할 뿐, 운영 영역 안에서 이벤트 카운트를 직접 렌더하지 않는다. 운영 영역 안에서 **직접 숫자 대시보드**를 원한다면 다음은 오너 결정·설정이 필요한 별도 작업이다:

- **Vercel Analytics 데이터 접근.** 인앱 숫자판은 Vercel Analytics/Web Analytics API를 서버에서 호출해야 한다 → 액세스 토큰·프로젝트 식별자를 **저장 설정으로 추가**해야 하고, 이는 외부 계정·시크릿 변경이라 자동화 범위 밖(오너 게이트).
- **자체 이벤트 저장소.** 대안으로 이벤트를 자체 테이블에 적재하면 프라이버시·보존·동의 정책을 **먼저 설계**해야 한다(현재는 벤더 집계만 사용, 원문 미저장). 수집 규칙 변경이므로 오너 승인 선결. 배경은 [`ornscore-admin-traffic-telemetry-plan.md`](./ornscore-admin-traffic-telemetry-plan.md) §미래 대시보드 선택지.
- **실 브라우저·OAuth 왕복 검증.** 실제 계정으로 허용/비허용 접근, 390×844 육안·스크린리더 체감은 운영자 게이트(Playwright 미구성).

그때까지의 정본 흐름: **숫자는 Vercel Analytics + `/admin/users`, 지도는 `/admin/traffic`, 리뷰 순서는 이 문서.** 이 배치는 새 벤더·계정·외부 설정·수집 규칙을 추가하지 않는다.
