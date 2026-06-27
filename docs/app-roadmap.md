# 오른스코어 앱 로드맵 (PWA → 네이티브 배포)

> 작성: Task 72 (2026-06-27, Claude). 목적은 "마케팅 랜딩"이 아니라 **설치 가능한 앱 준비도(app-readiness)** 의
> 현재 상태를 정직하게 기록하고, 스토어 배포까지의 가장 안전한 경로와 그 전제(계정·에셋·법무)를 명시하는 것.
> 톤 규칙은 전 화면과 동일: 투자 추천 아님 / 데이터 신선도 고지 유지 / 스토어 출시 미확정은 미확정으로만 표기.

---

## 1. 현재 PWA/앱 지원 감사 (audit)

| 항목 | 상태 | 증거 / 비고 |
|---|---|---|
| Web App Manifest | ✔ | `src/app/manifest.ts` (Next-native, `/manifest.webmanifest`로 서빙). `id`·`name`·`short_name`·`description`·`start_url`·`scope`·`display:standalone`·`dir`·`categories:["finance"]`·테마/배경색·`lang`·`orientation`·`shortcuts`(오늘/종목 찾기/공시 신호) — Task 72에서 무에셋 필드 보강 |
| 오프라인 안내 페이지 | ✔ | `src/app/offline/page.tsx` — 네트워크 필요 안내 + 홈 화면 추가 힌트(iOS/Android). 정적 페이지라 SW 없이도 동작 |
| Service Worker | ✗ (의도적 미등록) | 등록 안 함. 사유는 §4 참조. 오프라인 자동 fallback·푸시·백그라운드 동기화는 SW 도입 전까지 불가 |
| 아이콘 에셋 | ✔ (Task 74) | `src/app/icon.svg`(벡터) + **PNG 192/512**·**512 maskable**(안전영역 패딩)·**apple-touch-icon 180**. `scripts/generate-icons.mjs`(Node 표준 라이브러리만, 외부 의존 0)가 브랜드 마크에서 생성. manifest는 SVG(`sizes:"any"` 폴백)+PNG 192/512(`purpose:"any"`)+512 maskable, apple-touch는 layout metadata로 연결 |
| 모바일 내비게이션 | ✔ | `src/components/MobileBottomNav.tsx` — 하단 5셀(오늘·종목 찾기·공시 신호·관심·더보기), `display:standalone`에서도 동작 |
| 반응형 로그인/온보딩 | ✔ | `/login` 모바일 가드(Task 70·73). 390px 소스 점검은 기존 QA 스윕(#38) 수준, 실 브라우저 게이트는 운영자(⑤) |
| 설치성(installability) 차단 요소 | ✔ (Task 74) | manifest·HTTPS·standalone 충족 + **PNG 192/512(purpose any)·512 maskable** 추가로 Android Chrome "앱 설치" 프롬프트 요건 충족, **apple-touch-icon 180** 추가로 iOS "홈 화면에 추가" 아이콘 품질 확보. 남은 설치성 변수는 에셋이 아니라 standalone 런타임(§5 OAuth 복귀) |
| 설치 프롬프트 UX | ✔ (Task 75) | `src/components/PwaInstallHelper.tsx`(클라이언트) — `/about` 설치 섹션에 연결. **3-상태 정직 분기**: (a) standalone 감지(`display-mode: standalone` \|\| `navigator.standalone`) 시 "이미 앱으로 실행 중" 안내(설치 권유 0), (b) 브라우저가 `beforeinstallprompt` 제공 시에만 **실제 "앱 설치" 버튼**(`prompt()`→`userChoice`, `min-h-[44px]`), (c) 그 외(iOS Safari 등)에는 수동 추가 단계만. `appinstalled` 리스너로 설치 직후 상태 전환. SSR 기본은 (c) 수동 단계라 비지원 환경도 안전. 신규 npm 0·SW 0·스토어 주장 0 |

**설치성 판정**: PWA로 **설치 가능**하며(standalone 실행·바로가기 동작), Task 74에서 **PNG 192/512·maskable·apple-touch-icon 에셋을 추가·연결해 아이콘 품질/설치 배너가 1급(installable)으로 올라갔다.** 이 에셋은 `scripts/generate-icons.mjs`로 코드 생성하므로 더 이상 운영자 보강 대기 항목이 아니다(브랜드 변경 시 재생성).

---

## 2. 네이티브 앱 경로 (안전 순서)

권장 순서는 **PWA 우선 → Android TWA → iOS(홈 화면 추가 지금 / App Store 래퍼 나중) → Capacitor(레포가 네이티브 빌드 도구를 받아들일 때만)**.

### 2-1. PWA 우선 (지금 — 추가 비용/계정 0)
- 현재 경로. 사용자는 ornscore.com 접속 후 "홈 화면에 추가"로 앱처럼 사용.
- **장점**: 별도 빌드·심사·스토어 계정 불필요. 배포는 기존 Vercel 그대로. 한 코드베이스.
- **단점**: 스토어 노출 없음(검색·랭킹·리뷰 부재). iOS는 푸시 알림 제약(웹 푸시는 iOS 16.4+ 홈 화면 추가 상태에서만). 설치 전환율이 스토어보다 낮음.
- **다음 액션**: 아이콘 에셋(Task 74)·설치 프롬프트 UX(Task 75, `/about` `PwaInstallHelper`)는 완료(§1). 남은 PWA 품질/설치 변수는 실기기 standalone OAuth 복귀(§5)뿐.

### 2-2. Android TWA (다음 — 가장 적은 추가 작업으로 Play 스토어 등재)
- TWA(Trusted Web Activity) = 기존 PWA를 안드로이드 앱 셸로 감싸 Play 스토어에 올리는 방식. 별도 UI 코드 없음.
- **도구**: Bubblewrap CLI(또는 PWABuilder). 레포 본체에 네이티브 코드를 넣지 않고 별도 빌드 산출물로 생성 가능.
- **필요 계정/비용**: **Google Play Console — 1회 $25**(개발자 등록).
- **필수 작업**: `assetlinks.json`(Digital Asset Links)을 `public/.well-known/assetlinks.json`으로 서빙해 도메인-앱 서명 연결(주소창 숨김). 서명 키 지문 필요.
- **장점**: Play 스토어 등재. 웹과 100% 동일 코드(URL 그대로 로드). 업데이트는 웹 배포로 즉시 반영.
- **단점**: Play 정책 심사. assetlinks 서명 관리. iOS는 미해결.

### 2-3. iOS (지금: 홈 화면 추가 / 나중: App Store 래퍼)
- **지금**: iOS Safari "공유 → 홈 화면에 추가"로 standalone 실행. 추가 비용 0. apple-touch-icon PNG 보강 시 아이콘 품질 개선.
- **나중(App Store)**: PWA를 그대로 App Store에 올릴 수 없음 → WKWebView 래퍼(예: PWABuilder iOS 패키지) 또는 §2-4 Capacitor가 필요.
- **필요 계정/비용**: **Apple Developer Program — 연 $99**. Mac + Xcode 빌드 환경. 네이티브 서명·심사.
- **주의**: Apple은 "단순 웹 래퍼"를 반려하는 사례가 있어, 네이티브 가치(푸시·오프라인·딥링크 등)를 갖춰야 통과 가능성이 높다. → 래퍼 전 §5 앱 기능 준비 선행 권장.

### 2-4. Capacitor (조건부 — 레포가 네이티브 빌드 도구를 받아들일 때만)
- 오늘 기준 **레포에 네이티브 빌드 구조가 없고, 이 작업 범위에서 도입하지 않는다.** 새 npm 의존·lock 변동·`ios/`·`android/` 디렉터리·CI 빌드 파이프라인을 수반하므로 명시적 제품 결정 후 별도 착수.
- 도입 시 이점: iOS·Android 단일 코드로 네이티브 플러그인(푸시·생체인증·딥링크) 접근. WebView로 기존 Next 앱 로드 가능.
- 비용: 빌드 도구 유지보수·양 스토어 계정($25 + $99/yr)·서명·심사 전부 포함.

### 경로 비교 요약

| 경로 | 추가 비용 | 코드 변경 | 스토어 노출 | 비고 |
|---|---|---|---|---|
| PWA 홈 화면 추가 | 0 | 거의 없음(아이콘만) | 없음 | 지금 동작 |
| Android TWA | Play $25(1회) | 셸 빌드+assetlinks | Play | 가장 적은 추가 작업 |
| iOS 홈 화면 추가 | 0 | apple-touch-icon | 없음 | 지금 동작 |
| iOS App Store 래퍼 | Apple $99/yr | WKWebView 래퍼 | App Store | 네이티브 가치 필요 |
| Capacitor | $25 + $99/yr | 네이티브 구조 도입 | 양 스토어 | 레포 미수용(범위 외) |

---

## 3. 운영자 보강 항목 (에셋·계정)

이 작업(Task 72)에서 코드로 끝낼 수 없는, 사람이 준비해야 할 산출물.

- [x] **PNG 아이콘** `public/icon-192.png`, `public/icon-512.png` — Task 74에서 `scripts/generate-icons.mjs`로 생성, `manifest.ts` icons(`purpose:"any"`)에 연결 완료.
- [x] **maskable 아이콘** `public/icon-512-maskable.png` — Task 74. 안전영역 10% 패딩(마크가 내부 80%), `manifest.ts`에 `purpose:"maskable"`로 연결 완료.
- [x] **apple-touch-icon** `public/apple-touch-icon.png` (180×180) — Task 74. `src/app/layout.tsx` metadata.icons.apple로 연결(`<link rel="apple-touch-icon">` 방출 확인).
- [ ] **(TWA 시)** Google Play Console 개발자 등록 $25 + `public/.well-known/assetlinks.json` + 서명 키 지문. **(Task 77)** 안전한 예시 파일 `docs/templates/assetlinks.example.json`(자리표시자만·서빙 안 함) 추가 — 실 서명 지문이 생긴 뒤에만 `public/.well-known/assetlinks.json`으로 배치. 결정 트리·반려 리스크는 `docs/app-packaging-readiness.md`.
- [ ] **(App Store 시)** Apple Developer Program $99/yr + Mac/Xcode 빌드 환경 + 래퍼 패키징.

> 코드 쪽 메모(완료): Task 74에서 `src/app/manifest.ts` `icons`에 192/512/maskable을 추가하고 `apple-touch-icon`은 `src/app/layout.tsx` metadata.icons.apple로 연결했다. 에셋은 `node scripts/generate-icons.mjs`로 재생성, `node scripts/check-icons.mjs`로 PNG 시그니처·정확 치수(192/512/512/180)를 검증한다(외부 npm 의존 0). 브랜드 마크가 바뀌면 두 스크립트를 다시 실행.

---

## 4. 결정: 이번 패스에서 Service Worker 미등록

**이번 작업에서 service worker를 등록하지 않는다.** 사유:

- 오른스코어의 핵심은 **점수·시세·공시의 신선도**다. SW가 데이터 JSON을 캐시하면 사용자가 **오래된 점수/시세**를 보면서도 화면의 "데이터 기준일" 고지와 모순되는 상태가 생긴다 → 데이터 신뢰 게이트(전역 `dataStatus`·신뢰 배지)와 정면 충돌.
- SW는 배포 시 **stale 캐시 레이스**(이미 PROGRESS.md에 기록된 stale prod CSS 400 류 사고)를 키운다. 자산 해시가 바뀌어도 구 SW가 구 자산을 잡고 있으면 흰 화면/400이 난다.
- 따라서 오프라인 대응은 **정적 `/offline` 안내 페이지**로만 충족하고, 자동 캐싱은 도입하지 않는다.

**안전한 미래 옵션(도입 시 권장 형태)**: 만약 SW를 넣는다면 **navigation-only network-first** — 앱 셸(HTML/CSS/JS)만 캐시하고 **데이터 JSON(`/data/*.json`·점수·공시 API)은 절대 캐시하지 않으며**, 네트워크 실패 시에만 `/offline`로 폴백. 데이터는 항상 네트워크에서 최신을 받는다. (push 알림이 필요해지면 그때 별도 검토.)

---

## 5. 앱 기능별 인증/준비도 (스토어 전 점검 필요)

standalone(홈 화면 추가/래퍼) 실행 시 웹과 다르게 동작할 수 있어, 스토어 작업 **전에** 검증해야 하는 항목.

| 기능 | 준비도 | standalone에서 점검할 것 |
|---|---|---|
| Kakao/Google OAuth | △ 점검 필요 | OAuth는 외부 브라우저/시스템 웹뷰로 튕겼다가 standalone 창으로 **되돌아오지 못할 수 있음**(콜백이 Safari/Chrome 탭에서 끝나 앱 컨텍스트 상실). 콜백 redirect가 `scope:"/"` 안으로 복귀하는지 실기기 확인 필요. **코드 측 가드(Task 76)**: `next`는 `safeInternalPath`로 내부 경로만 허용(open-redirect 차단), `code` 없는 콜백은 `auth_callback_no_code` 친절 안내로 분기. 실기기 복귀 동작은 §5-1 절차로 확인 |
| Naver 로그인 | 준비 중(Task 73) | `/login`에 "네이버 (준비 중)" 비활성만 노출. 운영자 콘솔 설정 전까지 standalone에서도 동일하게 비활성 |
| 알림 설정 | △ | `settings/notifications`는 UI/미리보기 골격(Task 45). iOS 웹 푸시는 16.4+ 홈 화면 추가 상태에서만, SW 필요 → 현재 미지원. 네이티브 푸시는 래퍼/Capacitor 단계 |
| 관심 종목 동기화(watchlist) | △ | 로그인 기반 동기화가 standalone 세션에서 유지되는지(쿠키/스토리지 격리) 확인. 비로그인은 로컬 저장 |
| 오프라인 동작 | ✔(안내만) | `/offline` 정적 안내. 데이터 캐시는 §4대로 의도적으로 없음 |
| 딥링크 | ✔(스코프) | manifest `scope:"/"`로 모든 내부 경로가 standalone 안에서 열림. TWA/래퍼 단계에서 `https://ornscore.com/...` → 앱 인텐트 매핑(assetlinks/Universal Links) 추가 필요 |

**우선순위**: 스토어 배포 전 **OAuth standalone 복귀**가 가장 큰 리스크(로그인 깨지면 핵심 기능 불가). 그 다음 푸시(SW/네이티브 의존). watchlist 동기화·딥링크는 그 뒤.

### 5-1. 실기기 standalone 로그인/복귀 QA 절차 (Task 76)

standalone(홈 화면 추가/래퍼) 창에서 로그인 후 **앱 컨텍스트로 정확히 복귀**하는지, 그리고 외부 URL이 복귀 대상으로 새어들지 않는지를 실기기에서 점검한다. 코드 측 가드는 `safeInternalPath`(`src/lib/auth/returnPath.ts`)가 `/login`·`/auth/callback`의 `next`를 내부 경로로만 제한해 마련해 두었다. 아래는 운영자/실기기 확인 단계.

1. **standalone 실행**: 홈 화면에 추가한 아이콘으로 앱을 연다(주소창 없는 standalone 창). `/`·`/stocks`가 앱 창 안에서 열리는지 확인.
2. **Kakao 복귀**: 로그인 → 카카오 → 동의 후 **`scope:"/"` 내부(앱 창)로 복귀**하는지. 외부 브라우저 탭에 머물러 앱 창으로 못 돌아오면 §5 최대 리스크 발현 → 콜백 보강 큐로 기록.
3. **Google 복귀**: 동일하게 구글 동의 후 앱 창 복귀 확인(콘솔 토글 전이면 빨간 박스 친절 안내가 뜨는지).
4. **이메일 매직링크 복귀**: 메일의 링크를 standalone에서 열었을 때 `/auth/callback`을 거쳐 로그인되고 원래 목적지로 도착하는지(`welcome=1` 토스트).
5. **code 없는 콜백(앱 복귀 실패)**: `/auth/callback`이 `code` 없이 호출되면 `/login?error=auth_callback_no_code`로 떨어지며 **"앱에서 로그인 후 돌아오지 못했어요…"** 친절 안내가 보이는지(원문 제공자 메시지 미노출).
6. **Naver 비활성 상태**: standalone에서도 `/login`의 "네이버 (준비 중)"이 **클릭 불가**(`aria-disabled`, 인증 호출 0)로만 보이는지.
7. **watchlist 복귀 왕복**: `/login?next=/watchlist` 로그인 → 로그인 후 **watchlist로 정확히 복귀**하는지. AccountButtons/MobileNav의 로그인 진입점도 현재 페이지를 `next`로 보존하는지 확인.
8. **negative(open-redirect 방지)**: `/login?next=//evil.com`, `/login?next=https://evil.com`, `/auth/callback?next=//evil.com` 모두 **외부로 가지 않고 `/`(내부)로** 떨어지는지. 정상 동작이면 외부 도메인으로 절대 redirect 되지 않는다.

> 위 절차는 §5의 정직성/톤 규칙을 유지하며 스토어 출시를 약속하지 않는다. 코드 가드(내부 경로 제한·친절 오류)는 적용 완료, 실기기 복귀 동작 자체는 운영자 게이트로 남는다.

---

## 6. 다음 구체적 액션(권장 순서)

> **(Task 77 추가)** 패키징 결정을 채팅 기록 없이 바로 고를 수 있게 **`docs/app-packaging-readiness.md`** 신설 — 결정 트리(PWA-only→TWA→iOS 홈/래퍼→Capacitor, 각 "다음 인간 결정·전제"), 경로별 필요 에셋·계정 비용·QA 게이트·반려 리스크 표, **실기기 사전 점검 체크리스트**(설치 아이콘·standalone 내비·로그인 복귀(§5-1 절차 참조)·watchlist·알림 설정·오프라인·법적 고지), 안전한 **`docs/templates/assetlinks.example.json`**(자리표시자·서빙 안 함). 실 서명 지문·스토어 계정·실기기 QA는 여전히 운영자 게이트(미확정은 미확정으로만).

1. ~~운영자: §3 PNG/maskable/apple-touch-icon 에셋 제작 → 코드에 연결~~ **(Task 74 완료 — `scripts/generate-icons.mjs`로 생성·연결·검증)**.
2. ~~설치 프롬프트 UX(`beforeinstallprompt` 실제 버튼 + standalone 감지 + 수동 안내)~~ **(Task 75 완료 — `src/components/PwaInstallHelper.tsx`, `/about` 연결)**.
3. **(다음 구체 단계)** 실기기에서 standalone 실행 + **OAuth 복귀**(§5 최대 리스크) 검증 → §5-1 절차 사용. 코드 측 복귀 경로 가드(내부 경로 제한·`auth_callback_no_code` 친절 안내)는 **Task 76 완료**. 깨지면 콜백 처리 추가 보강(별도 큐). 같은 실기기 세션에서 Android Chrome `beforeinstallprompt` 버튼·iOS 수동 추가 흐름도 1회 육안 확인.
4. 제품 결정: TWA(Play) vs iOS 래퍼 중 어느 스토어를 먼저 갈지 결정 → 해당 계정($25 / $99) 준비.
5. (선택) navigation-only network-first SW 검토 — 데이터 JSON 비캐시 원칙 고정 시에만.

> 본 문서는 스토어 출시를 약속하지 않는다. 모든 공개 문구는 "홈 화면에 추가/설치" PWA 표현만 사용하며, App Store·Play 스토어 출시 여부는 실제 스토어 작업 착수 전까지 "미확정"으로만 표기한다.
