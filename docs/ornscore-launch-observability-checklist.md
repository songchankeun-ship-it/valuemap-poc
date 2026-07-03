# OrnScore 로컬 출시 관찰성 체크리스트 (오너용 참고)

> 무료 한국어 베타를 외부에 노출한 뒤, **오너가 로컬에서 혼자 돌려볼 수 있는** 관찰성(observability) 참고표.
> 4개 절만 담는다: **핵심 라우트 이름 · 모니터링할 사용자 액션(추후) · 헬스 신호 · 수동 리뷰 단계**.
> 성격: **읽기 전용 참고 문서**(앱 UI·점수식·데이터 무변경). 새 SDK·분석 파이프라인을 깔지 않는다 — 지금 코드에 이미 있는 표면만 가리킨다.
> 작성: 2026-07-04 (Task 191, Claude). 톤 규칙: 후보·탐색·확인·참고 정보 유지(매수·매도·추천 신규 표현 0).
> 교차 참고: [`docs/ornscore-route-smoke-checklist.md`](./ornscore-route-smoke-checklist.md) · [`docs/ornscore-admin-status-backlog.md`](./ornscore-admin-status-backlog.md) · [`docs/ornscore-beta-launch-checklist.md`](./ornscore-beta-launch-checklist.md) · [`docs/ornscore-post-release-qa-2026-07-02.md`](./ornscore-post-release-qa-2026-07-02.md)

---

## 1. 핵심 라우트 이름

노출 후 "이 경로가 뜨긴 하나"를 빠르게 확인할 때의 라우트 인벤토리. 각 라우트가 무엇을 증명하는지는 **스모크 체크리스트로 위임**(앵커·치명 마커는 중복 기재하지 않고 링크). → [`ornscore-route-smoke-checklist.md`](./ornscore-route-smoke-checklist.md)

### 공개 페이지 라우트

| 라우트 | 성격 | 스모크 커버 |
|---|---|---|
| `/` | 홈(유니버스 카운트·시장 스냅샷·오늘 후보) | 기본 7 |
| `/stocks` | 종목 탐색(검색·프리셋·필터) | 기본 7 |
| `/stock/[ticker]` | 종목 상세(결론 카드·상위 X%·순위) | 기본 7(`/stock/034730`) |
| `/today` | 오늘(기준일 스냅샷) | 기본 7 |
| `/disclosures` | 공시 신호(최신 200건 내) | 기본 7 |
| `/watchlist` | 관심 종목(비로그인 빈 상태) | 기본 7 |
| `/login` | 로그인(OAuth·매직링크 진입) | 기본 7 |
| `/compare` | 종목 비교 | `--all` |
| `/pricing` | 요금제 정보구조(가격 미확정) | `--all` |
| `/status` | **공개** 데이터 상태판 | `--all` |
| `/backtest` | 백테스트(실험 전략·면책) | `--all` |
| `/manifest.webmanifest` | PWA manifest(`manifest.ts`) | `--all` |

> 기본 스모크는 항상 유한한 7라우트, `--all` 플래그로 위 5개(과거 12라우트 패스 동등)를 덧붙인다.

### 내부 운영용 라우트 (검색 비노출)

| 라우트 | 성격 | 비고 |
|---|---|---|
| `/admin/status` | 내부 데이터 상태판(`robots: noindex`·`force-dynamic`) | selfCheck 요약·검증보류·결측·`data_reports` 최근 50건(`ADMIN_ENABLED=1` 시). 스모크·`--all` 미포함(의도적) |

### API · Cron 라우트

| 라우트 | 성격 | 관찰 포인트 |
|---|---|---|
| `POST /api/report-data-issue` | 데이터 오류 신고 저장(`data_reports` insert, graceful) | 접수 건수 → `/admin/status` |
| `POST /api/waitlist` | 출시 알림 대기 신청 | 전환(신청) 발생 여부 |
| `GET /api/quote/[ticker]` | 종목 시세 조회 | 실패율·응답 지연 |
| `GET /api/cron/save-scores` | 일별 점수 스냅샷 적재(Supabase) | cron 성공 여부 |
| `GET /api/cron/daily-insight` | 오늘의 브리핑/변화 생성 | cron 성공 여부 |
| `GET /api/cron/notify` | 관심 종목 공시 알림(이메일 골격) | cron 성공 여부 |
| `GET /api/cron/evaluate-alerts` | 조건/점수 급변 알림 평가(무발송 골격) | cron 성공 여부 |

> cron 라우트는 Vercel cron + `CRON_SECRET` 가드. **실 발송/영속 성공률 로그는 미점검(대기④)** — 3절·`beta-launch-checklist`(e) §15 참조.

---

## 2. 모니터링할 사용자 액션 (추후)

> **현재 텔레메트리 소스 = Vercel Analytics + Speed Insights** — 이미 `src/app/layout.tsx`에 `<Analytics />`·`<SpeedInsights />`로 배선됨(`@vercel/analytics`·`@vercel/speed-insights`). 페이지뷰·웹바이탈은 Vercel 대시보드에서 바로 본다. **아래 액션별 이벤트는 신규 SDK 없이** Vercel 대시보드의 경로별 트래픽으로 근사하고, 커스텀 이벤트가 정말 필요해질 때만 후속 결정(대기④, §15.5 로그).

| 액션 | 근사 신호(현재) | 코드 표면 |
|---|---|---|
| 검색·탐색 | `/stocks` 트래픽·체류 | `StocksExplorer.tsx`(검색·프리셋·필터) |
| 종목 상세 조회 | `/stock/[ticker]` 트래픽 + 로컬 `recentViews` | `recentViews.ts`·`RecentViewTracker`·`MyStocksSection`(재방문 큐) |
| 관심 종목 추가 | `/watchlist` 트래픽(추가는 로컬 저장) | `watchlist.ts`·`WatchlistClient.tsx`·`AddToWatchlistButton.tsx` |
| 로그인 / OAuth 왕복 | `/login` → `/auth/callback` 도달 | `src/lib/auth/providers.ts`(단일 출처): 카카오(운영 중)·구글(콘솔 토글 필요)·네이버(`custom:naver`, env 켜야 활성)·Apple(기본 비활성)·이메일 매직링크 |
| 데이터 오류 신고 | `POST /api/report-data-issue` 접수 건수 | `ReportDataIssueForm.tsx`·`/admin/status` 목록 |
| waitlist 전환 | `POST /api/waitlist` 신청 건수 | `/pricing` 출시 알림 CTA |

> 관심 종목 추가·최근 본 종목은 **로컬 저장(localStorage)** 이라 서버 이벤트가 없다 → 현재는 `/watchlist`·`/stock` 트래픽으로만 근사(정직한 한계). 서버 측 집계는 인증·영속 이벤트 결정(대기④)과 함께.

---

## 3. 헬스 신호

노출 후 "데이터가 정상인가"를 판단하는 신호. **대부분 이미 계산돼 화면에 있다** — 새 인프라 없이 아래를 눈으로 확인한다.

### 자동 점검 (selfCheck — 코드가 이미 산출)

`dataStatus.selfCheck` 단일 소스(`src/lib/dataStatus.ts`). `/status`(공개)·`/admin/status`(내부) 동일 값.

| 필드 | 의미 | 정상 기준 |
|---|---|---|
| `universeCount` | 분석 종목 수 | 138 |
| `suspectCount` | 검증 보류 종목 수(오늘·Top 제외) | 낮을수록 좋음(현재 15) |
| `missingFinancialsCount` | PER·PBR 결측 종목 수 | 낮을수록 좋음 |
| `metricsVersionMatch` | 산식 버전 일치(`expectedMetricsVersion` vs `actualMetricsVersion`) | `true`(기대 2.4 = 실제) |

### 데이터 신선도

| 신호 | 의미 | 근거 |
|---|---|---|
| `asOfBusinessDate` | 가격 기준 영업일(YYYYMMDD) | `dataMetadata.asOfBusinessDate` |
| `isDataStale(asOf)` | 기준일이 오래됐는지 판정 | `realStocks` 재사용 — 화면 간 동일 판정 |

> 가격이 지연되면 `dataStatus.domainStatuses`(price/financial/disclosure/metrics)가 `delayed`로 정직 표시된다(숨기지 않음).

### 운영 신호

| 신호 | 확인 위치 | 상태 |
|---|---|---|
| cron 성공 여부(수집·브리핑·알림 평가) | Vercel cron 로그 | 영속 성공률 로그는 **미점검(대기④)** — `beta-launch-checklist`(e) §15.1 |
| 데이터 오류 신고 접수 건수 | `/admin/status`(`data_reports` 최근 50건, `ADMIN_ENABLED=1`) | 접수 시 목록 표시, 부재 시 graceful 안내 |
| 공개판 vs 내부판 | `/status`(사용자용) · `/admin/status`(운영자용, noindex) | 두 판 모두 같은 `selfCheck` 소스 |

> §15.2 발송 성공률·§15.5 API 실패/전환 이벤트는 **라이브 인프라 필요(대기④)** — 헬스 신호로 넣지 않고 백로그로 남긴다(`ornscore-admin-status-backlog.md` §2).

---

## 4. 수동 리뷰 단계

노출 전/후 오너가 로컬에서 실행하는 순서. 게이트(실패 시 차단)와 권고(참고)를 구분한다.

### (a) 헤드리스 게이트 — 실패 시 차단

```bash
# 1) 빌드
npm run build

# 2) 전용 고포트로 로컬 prod 기동 (3000/4310 금지 — 가드레일 참고)
npx next start -p 4455

# 3) 다른 터미널에서 스모크 게이트 (라우트 하나라도 실패하면 exit 1)
npm run smoke:check -- --base http://localhost:4455
#   전체 12라우트: npm run smoke:check -- --all --base http://localhost:4455
```

- `smoke:check` = **진짜 게이트**(exit 1). 라우트별 HTTP 200 + 치명 마커 0 + 콘텐츠 앵커 검사 → 상세는 [`ornscore-route-smoke-checklist.md`](./ornscore-route-smoke-checklist.md).
- `npm run perf:check` = **권고**(항상 exit 0). 참고용 지표만.

### (b) 사람 육안 게이트 — 헤드리스가 못 잡음

헤드리스는 SSR HTML만 본다. 실 픽셀·실 OAuth는 아래로 커버(중복 기재 대신 링크):

- 데스크톱(≥1280px)/**390px 모바일 육안** 시각 게이트 → [`ornscore-post-release-qa-2026-07-02.md`](./ornscore-post-release-qa-2026-07-02.md) §7 (두 폭 체크리스트).
- **실기기 OAuth 왕복**(카카오/구글/네이버/이메일 매직링크 `/auth/callback`) → 같은 문서 §8·§6 운영자 확인 항목.
- Playwright 미구성 → 실 브라우저 픽셀/hydration 게이트는 로컬 미가용(운영자 승계).

### (c) 포트 가드레일 (AI Center 무중단)

- **포트 3000 / 4310 사용 금지.** 4310은 홈 PC AI Dev Center 대시보드(24시간 상시). 전용 고포트(예: 4455)를 쓴다.
- 종료 시 **내가 띄운 리스너 PID만** 정리: `netstat -ano | findstr :4455` → `taskkill /PID <pid> /F`.
- 정리 후 **AI Center 4310이 여전히 LISTENING인지 확인**.

---

## 완료 기준

- [x] 4개 필수 절 모두 존재: **핵심 라우트 이름 · 모니터링할 사용자 액션(추후) · 헬스 신호 · 수동 리뷰 단계**.
- [x] 나열된 모든 라우트가 실재(공개 12 + 내부 `/admin/status` + API/cron 7) — 스모크 체크리스트·`src/app` 라우트와 대조 확인.
- [x] 신규 SDK·분석 파이프라인 도입 0 — 현재 코드 표면(`layout.tsx` Analytics·`dataStatus.selfCheck`·`/admin/status`)만 가리킴.
- [x] 오너가 후속 질문 없이 **복사-실행 가능** — (4)의 명령이 그대로 돌아가고, 실패 게이트(smoke exit 1)와 육안 게이트가 분리됨.
