# OrnScore 라우트 스모크 체크리스트 (`npm run smoke:check`)

로컬 QA를 기억에 덜 의존하고 빠르게 돌리기 위한 **헤드리스 라우트 스모크 게이트**. 이미 떠 있는 로컬 prod 서버에 대해 핵심 7개 라우트를 각 1회 요청하고, 라우트마다 3가지를 검사한다. `scripts/smoke-check.mjs`, 신규 의존성 0, 순수 Node ESM(`fetch`만 사용).

> `perf:check`(권고·항상 exit 0)와 다르게 이건 **진짜 게이트**: 하나라도 실패하면 `exit 1`.

---

## 실행 방법

```bash
# 1) 빌드
npm run build

# 2) 전용 포트로 로컬 prod 기동 (3000/4310 금지 — 아래 가드레일 참고)
npx next start -p 4455

# 3) 다른 터미널에서 스모크 게이트
npm run smoke:check -- --base http://localhost:4455
#   또는: SMOKE_BASE_URL=http://localhost:4455 node scripts/smoke-check.mjs
```

- `--base` 기본값 `http://localhost:4455`. 환경변수 `SMOKE_BASE_URL`로도 지정 가능(플래그가 우선).
- 서버에 못 붙으면 라우트 표에 `ERR`를 찍고 `"is the local prod server running at <base>?"` 힌트 후 `exit 1`.
- `--all` 플래그: 기본 7개에 **추가 공개 라우트 + 부정/폴백 검사 + 비로그인 플로우**를 덧붙인다. 공개 라우트는 과거 12라우트 패스(`/compare /pricing /status /backtest /manifest.webmanifest`)에 런칭 핵심 공개 페이지(`/about /guide/metrics /guide/metrics/changelog /universe /terms /privacy /theme/battery`)를 더한 것. **기본 실행은 항상 유한한 7라우트**로 유지 — `--all`은 부가 검사일 뿐 기본 게이트를 바꾸지 않는다.

---

## 검사 대상 7개 라우트 · 각 앵커가 증명하는 것

각 라우트를 1회 fetch한 뒤 (a) HTTP 200, (b) 치명 마커 0, (c) 아래 **콘텐츠 앵커 존재**를 검사한다. 앵커는 "셸/에러 페이지가 아니라 그 라우트가 자기 콘텐츠를 SSR로 실제 렌더했다"를 증명한다.

| 라우트 | 앵커 | 증명 |
|---|---|---|
| `/` | `138` | 홈 히어로가 138종목 유니버스 카운트를 렌더 |
| `/stocks` | `종목` | 탐색기가 종목/프리셋 콘텐츠 렌더 |
| `/stock/034730` | `상위` | 종목상세가 백분위/순위('상위 X%') 블록 렌더 |
| `/today` | `오늘` | 오늘 페이지가 기준일 스냅샷 헤딩 렌더 |
| `/disclosures` | `공시` | 공시 목록이 자기 콘텐츠 렌더 |
| `/watchlist` | `관심` | 비로그인 관심 페이지가 '관심 종목' 빈 상태 렌더 |
| `/login` | `카카오` | 로그인 페이지가 카카오 제공자 버튼 렌더 |

---

## `--all` 추가 검사 (부가·기본 게이트 불변)

`--all`에서만 아래 그룹을 덧붙인다. 각 라우트도 (a)상태 (b)치명 마커 0 (c)앵커 존재를 동일하게 검사한다. 상태는 라우트별 `expectStatus`(기본 200)로 판정하며, 폴백 라우트만 404를 기대한다.

### 추가 공개 라우트

| 라우트 | 앵커 | 증명 |
|---|---|---|
| `/compare` | `비교` | 비교 시작 화면 렌더 |
| `/pricing` | `베타` | 가격 페이지가 무료 베타 리드 렌더 |
| `/status` | `상태` | 데이터 상태 페이지 렌더 |
| `/backtest` | `백테스트` | 백테스트 페이지 렌더 |
| `/manifest.webmanifest` | `138` | 매니페스트 설명이 138종목 유니버스 언급 |
| `/about` | `서비스 소개` | 소개 페이지가 '서비스 소개' 히어로 헤딩 렌더 |
| `/guide/metrics` | `지표 가이드` | 지표 가이드가 '지표 가이드' 헤더 렌더(기본 ko SSR) |
| `/guide/metrics/changelog` | `산식 변경 이력` | 산식 변경 이력 페이지가 '산식 변경 이력' 헤딩 렌더 |
| `/universe` | `분석 대상` | 유니버스 페이지가 '분석 대상 종목' 헤딩 렌더 |
| `/terms` | `이용약관` | 이용약관 헤딩 렌더 |
| `/privacy` | `개인정보처리방침` | 개인정보처리방침 헤딩 렌더 |
| `/theme/battery` | `2차전지` | 실존 슬러그 `battery` 테마 상세가 '2차전지' 이름 렌더 |

### 부정/폴백 검사 (404·무효 티커)

잘못된 입력이 **500이나 빈 셸이 아니라 한국어 not-found 본문**으로 graceful degrade 하는지 확인한다(치명 마커 0 유지). 상태는 라우트별 `expectStatus`(기본 200)로 판정한다.

- **없는 경로**는 프레임워크에 매칭되는 라우트가 없어 **하드 404**(`expectStatus: 404`).
- **무효 티커**는 SSG `/stock/[ticker]` 라우트에 매칭되어 `notFound()`를 호출한다. Next 14는 `generateStaticParams` 라우트의 온디맨드 not-found 렌더를 **소프트 404**(본문은 not-found지만 HTTP 200)로 내려준다 — `000000/999999/ZZZZZZ`에서 200으로 안정 재현. 따라서 상태 대신 **본문 + 무크래시**를 검증한다.

| 라우트 | 기대 상태 | 앵커 | 증명 |
|---|---|---|---|
| `/__no_such_route__` | `404` | `찾을 수 없습니다` | 없는 경로가 하드 404 not-found 본문 렌더 |
| `/stock/000000` | `200`(소프트 404) | `찾을 수 없습니다` | 무효 티커가 `notFound()` → not-found 본문(200)으로 graceful degrade |

### 비로그인 플로우

인증이 필요한 페이지가 **비로그인 시 리다이렉트/에러가 아니라 안전한 200 상태**로 '로그인' CTA를 렌더하는지 확인한다(보호 라우트의 graceful degrade 증명).

| 라우트 | 앵커 | 증명 |
|---|---|---|
| `/history` | `로그인` | 비로그인 요약 기록이 '로그인' CTA 렌더(리다이렉트 없음) |
| `/settings/notifications` | `로그인` | 비로그인 알림 설정이 '로그인' CTA 렌더(리다이렉트 없음) |

---

## 치명 마커(하나라도 HTML에 있으면 FAIL)

```
Application error
Hydration failed
Cannot read properties
ReferenceError:
Unhandled
Minified React error
```

- **`suppressHydrationWarning` 주의:** 정상 React prop 문자열 `suppressHydrationWarning`은 마커 `Hydration failed`(정밀 문구)를 포함하지 않으므로 **오탐 아님**. 과거 QA에서 원시 `Hydration` grep이 홈에서 1건 잡던 것을 이 스크립트는 회피한다.

---

## 포트 가드레일 (AI Center 무중단)

- **포트 3000 / 4310 사용 금지.** 4310은 홈 PC AI Dev Center 대시보드(24시간 상시). 전용 고포트(예: 4455)를 쓴다.
- 종료 시 **내가 띄운 리스너 PID만** 정리: `netstat -ano | findstr :4455` → `taskkill /PID <pid> /F`.
- 정리 후 **AI Center 4310이 여전히 LISTENING인지 확인**.

---

## 헤드리스 스모크가 못 잡는 것 (사람 육안 게이트)

이 게이트는 SSR HTML만 본다. 실 브라우저 픽셀 렌더·OAuth 실 왕복은 아래 매뉴얼 체크리스트로 커버(중복 기재 대신 교차 링크):

- 데스크톱(≥1280px)/**390px 모바일 육안** 시각 게이트 → `docs/ornscore-post-release-qa-2026-07-02.md` §7 (11경로 두 폭 체크리스트).
- **실기기 OAuth 왕복**(카카오/구글/네이버/이메일 매직링크 `/auth/callback`) → 같은 문서 §8 운영자 잔여 항목.
- Playwright 미구성 상태라 실 픽셀/hydration 브라우저 게이트는 로컬 미가용(운영자 승계).
