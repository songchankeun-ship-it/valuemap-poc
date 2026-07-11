# ORNScore 앱모드·모바일 표면 QA (스토어 패키징 전 점검, 2026-07-11)

> 홈 화면(standalone/PWA)에서 실행하는 사용자가 실제로 닿는 표면을 **스토어 패키징 전에** 점검한 기록.
> 대상 7라우트: `/about` · `/offline` · `/login` · `/watchlist` · `/settings/notifications` · `/privacy` · `/terms`.
>
> 작성: 2026-07-11 (Task 146, Claude). 이 슬라이스는 **점검 + 검증 + 문서 + 스크립트 가드 1건 수정**.
> 앱 소스 카피/점수식/데이터/`direction`/`metricsVersion`/인증/알림 동작 무변경.
> 실기기 390px 육안 런북은 중복 없이 [`ornscore-real-device-390px-qa-2026-07-06.md`](./ornscore-real-device-390px-qa-2026-07-06.md)에 위임(홈·발견·상세·상태·가격·로그인·관심). 이 문서는 그 런북이 다루지 않는 **앱모드 전용 표면**(about/offline/notifications/privacy/terms)을 보강한다.

---

## 0. 결론

- **정직성 게이트(스토어 패키징 수용조건 #1) 통과**: 설치/도움말·오프라인·로그인 폴백 카피가 **스토어 출시를 단정하거나 미제공 푸시를 제공처럼** 말하는 곳 0.
- **모바일 오버플로 게이트(수용조건 #2) 통과**: 7라우트 SSR·구조 점검에서 **바디 가로 넘침 위험 0**. 유일하게 뷰포트보다 넓은 요소(개인정보 국외이전 표 `min-w-[480px]`)는 `overflow-x-auto` 컨테이너 + 모바일 스와이프 안내로 **컨테이너 내부에서만** 스크롤.
- **부수 수정(스토어 패키징 게이트 복구)**: 직전 Task 145가 `app-store-submission-pack.md`의 갱신일을 `2026-07-01`→`2026-07-11`로 올리면서 `check-app-packaging.mjs`의 freshness 가드 문자열을 함께 갱신하지 않아 `npm run app:check`가 **FAIL** 상태였다(Task 145는 문서 전용이라 app:check를 돌리지 않아 미검출). 가드 문자열을 `2026-07-11`로 맞춰 게이트를 초록으로 복구.

---

## 1. 앱모드 정직성 점검 (표면별 근거)

각 항목 = 무엇을 확인했나 / 근거 파일 / 판정.

### `/about` — 설치 도움말
- **PWA 설치만 안내, 스토어 출시 단정 0.** `src/app/about/page.tsx:129` — "앱 마켓(App Store·Play 스토어) 출시 여부는 아직 정해지지 않았습니다." 명시.
- **`PwaInstallHelper`**(`src/components/PwaInstallHelper.tsx`): `beforeinstallprompt`가 올 때만 실제 "앱 설치" 버튼 노출(가짜 버튼 0), 이미 standalone이면 재설치 권유 0, iOS 등 프롬프트 미제공 환경은 수동 추가 단계(공유→홈 화면에 추가 / 메뉴→앱 설치)만 안내. 스토어 주장 0.
- **판정: 통과.**

### `/offline` — 오프라인 안내
- **정적 안내 페이지**(서비스 워커 미등록, `grep serviceWorker` 0건 — 로드맵상 데이터 신선도 이유로 SW 의도적 보류). 스토어/푸시 문구 0.
- 카피(`src/lib/i18n.ts` `offlineCopy`)는 "네트워크 필요 → 연결 확인 후 재시도" + 홈 화면 추가 안내(iOS/Android)로 한정. `OfflineContent`(`src/components/OfflineContent.tsx`)에 `다시 시도`(현재 화면 reload)·`홈으로 돌아가기` 두 버튼 모두 `min-h-[44px]`.
- **한계(정직 고지)**: SW가 없으므로 `/offline`은 네트워크 실패 시 자동 폴백으로 뜨지 않고 `/about` 링크·직접 URL로만 도달한다. `다시 시도` reload는 향후 SW 등록 시의 폴백 재요청을 위한 설계(page.tsx 주석). 현재는 홈 버튼이 실질 복귀 경로. **행동/데이터 주장 변경은 이번 슬라이스 범위 밖이라 무편집**(로드맵 SW 결정과 충돌 회피).
- **판정: 통과.**

### `/login` — 앱모드 로그인 복귀 폴백
- **standalone 복귀 실패를 별도 코드로 구분·안내.** `src/app/auth/callback/route.ts`: 콜백에 `code` 없음(앱 창으로 콜백이 안 돌아온 전형적 standalone 실패) → `auth_callback_no_code`로 리다이렉트. `LoginContent.tsx:friendlyAuthError`가 이를 `errors.noCode`("앱에서 로그인 후 돌아오지 못했어요. 다시 시도하거나 브라우저에서 로그인해 주세요.")로 표시. 원문 제공자 메시지 미노출.
- `next`는 `safeInternalPath`로 내부 경로만 통과(오픈 리다이렉트 방지) → OAuth/매직링크 `redirectTo`·뒤로가기 링크가 모두 이 정규화 값에서 파생. 로그인 후 원 화면 복귀.
- 미설정 제공자(네이버 등)는 **비활성 표시만**(onClick·인증 호출 0, 가짜 성공 경로 0). 활성 제공자만 리드 카피에 노출.
- **판정: 통과.**

### `/settings/notifications` — 알림 진입점
- **푸시·카카오·웹·텔레그램 = "준비 중"(비활성), 이메일만 "사용 중".** `src/components/notifications/NotificationChannels.tsx`: `앱 푸시` status `preparing` + `opacity-80` + "준비 중" 배지. 상단 배너(page.tsx)도 "준비 중 항목은 켜둬도 메시지가 나가지 않아요" 명시.
- 비로그인 SSR 폴백이 "불러오는 중…"이 아니라 **로그인 CTA 카드 + 알림 종류/예시 둘러보기**로 서버 렌더(리뷰가 지적한 옛 "불러오는 중" 미완성 인상 해소 확인). 로그인 CTA `min-h-[44px]`.
- **판정: 통과.** (미제공 푸시를 제공처럼 말하는 곳 0.)

### `/watchlist` — 관심/알림 진입점
- 빈 상태·요약 카피가 **로컬 기록 vs 임시 이메일 알림 vs 준비 중 채널**을 분리해 정직 프레이밍(`WatchlistClient.tsx:455,832`): "담기 = 별도 알림 없이 로컬 기록 … 카카오톡·푸시 알림은 준비 중". 라이브 알림 암시 0.
- **판정: 통과.**

### `/privacy`, `/terms`
- **초안 느낌 문구 0.** `grep "확정 예정|법률 자문"` 0건(리뷰 P0 #3은 선행 태스크에서 이미 제거됨). 푸시/스토어/앱마켓 문구 0.
- **판정: 통과.**

---

## 2. 모바일 390×844 오버플로 점검 (SSR·구조)

로컬 prod(`npx next start -p 4472`)에서 7라우트 200 확인 후, 소스 구조로 가로 넘침 위험을 점검했다.

- **7라우트 HTTP 200** 전부 OK.
- **고정 폭/넓은 요소 스캔**: 인스코프 표면에서 뷰포트(390px)보다 넓을 수 있는 요소는 2곳뿐 —
  - `src/app/privacy/page.tsx:96` 국외이전 표 `min-w-[480px]` → **부모 `div`가 `overflow-x-auto -mx-3 px-3`**(line 95) + 모바일 전용 스와이프 안내(line 94). **바디가 아니라 표 컨테이너 안에서만** 좌우 스크롤 → 바디 넘침 0.
  - `src/components/notifications/KakaoAlertPreview.tsx:78` `w-[300px]`(카카오 말풍선 목업) → 390px 미만이라 안전.
- **알림 채널 그리드**: `grid-cols-1 sm:grid-cols-2` → 390px(`sm` 640px 미만)에서 1열 스택, 넘침 0.
- **뷰포트 메타**: `src/app/layout.tsx` `viewport.viewportFit:"cover"`(노치 `env(safe-area-inset-*)` 활성). `width=device-width`는 Next 기본.
- **판정: 바디 레벨 가로 넘침 위험 0.** 유일한 광폭 요소는 표준 `overflow-x-auto` 패턴으로 격리됨.

> **한계**: 위는 SSR HTML·소스 구조 기반 정적 점검이다. 실제 픽셀 렌더·다크/라이트 대비·스크롤 스티키 거동은 헤드리스로 판정 불가 → **오너 실기기 육안 게이트**(§4). 이 환경엔 Playwright/뷰포트 스냅샷 하니스가 없어(신규 dev 의존성 도입은 범위 밖) 자동 픽셀 검증은 수행하지 못했다.

---

## 3. 검증 게이트 (이 슬라이스, 전부 통과)

- `npx tsc --noEmit` → 0.
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py` → 138종목 / 오류 0 / 금칙 0 / Metrics 2.4.
- `git diff --check` → clean(CRLF만).
- `npm run app:check` → **PASS**(FAIL 0 · WAIT 1 = 의도된 assetlinks 외부 게이트). *가드 수정 전에는 `FAIL docs/app-store-submission-pack.md: missing current store submission pack date`였다.*
- `npm run build` → 0(138 SSG, 기존 경고 외 신규 0).
- `npm run smoke:check -- --base http://localhost:4472 --all` → 24/24 OK.
- `npm run verify:routes -- --base http://localhost:4472` → 9/9 OK(기대 기준일 `2026.07.10`).
- 종료 시 포트 4472 점유 PID만 정리(전체 Node 종료 안 함).

---

## 4. 남은 오너 전용(실기기) 게이트

자동/헤드리스로 판정 불가 → 오너가 실제 홈 화면 실행에서 1회 확인.

- **실기기 390px 육안**(다크+라이트) — 위 7표면 각 스크롤·대비·터치 타깃 44px. 특히 개인정보 국외이전 표의 좌우 스와이프 실동작.
- **standalone 설치→실행→로그인 왕복**: 홈 화면에 추가(iOS 공유→추가 / Android 메뉴→앱 설치) 후 앱 창에서 카카오/구글 OAuth 왕복 시 `auth_callback_no_code` 폴백이 실제로 뜨는지, 매직링크 이메일 경로가 앱 창으로 정상 복귀하는지(OAuth 왕복은 오너 콘솔 게이트).
- **오프라인 실거동**: 기내모드에서 이미 로드된 페이지 뒤로가기(bfcache) 거동, `/offline`을 직접 열었을 때 재시도/홈 버튼 동작.
- **Android TWA assetlinks**: 실 패키지 `com.ornscore.app` + SHA-256 지문 확보 후 `public/.well-known/assetlinks.json` 생성(현재 WAIT). — [`ornscore-android-assetlinks-owner-kit.md`](./ornscore-android-assetlinks-owner-kit.md).

---

## 5. 왜 앱 소스 카피를 안 고쳤나 (churn 회피 결정)

- 7표면의 설치/오프라인/로그인/알림/약관 카피는 **선행 태스크(126·144·145·148·192·197·103 등)에서 이미 정직 프레이밍으로 수렴**했고, 스토어 출시 단정·미제공 푸시 과장·초안 느낌 문구가 남아있지 않다(§1 근거). 이 상태에서 카피를 손대는 것은 불필요 churn이라 **무편집**.
- 실제로 고칠 값이 있던 곳은 앱 소스가 아니라 **패키징 게이트 스크립트의 stale 날짜 가드**였고, 그것만 수정했다(§0).
- 오프라인 `다시 시도`의 reload 의미(현재 SW 부재 시 약함)는 **향후 SW 폴백 설계 의도**라 로드맵 결정과 충돌하지 않도록 무편집으로 두고, §2·§4에 한계로 문서화했다.
