# 오른스코어 스토어 리스팅 · 스크린샷 맵 (로컬 전용) — 2026-07-14

> **로컬 전용 안내.** 이 문서는 Play Console 검증이 풀렸을 때 오너가 **한 장에서 시작**할 수 있도록,
> 흩어진 스토어 문서(카피·에셋·라우트·캡처 규칙)를 **한 맵으로 묶은 인덱스 계층**이다.
> **제출·업로드·계정/결제/주소/프로필/서명/assetlinks·Play Console 액션을 전혀 수행하지 않는다.** 외부 서비스 액션 0.
> 정식 카피 원본은 복사하지 않고 **링크**로 참조한다(문구 중복 = 드리프트 위험). 여기서 새로 더하는 것은
> **7개 라우트를 하나로 정합한 스크린샷 맵**과, 이 저장소의 **390px + 데스크톱 캡처 체크리스트**뿐이다.

작성: 2026-07-14 (Task 244, [codex]). **문서 전용** — 앱 소스/점수식/데이터/`metricsVersion` 무변경.

관련 문서(정식 원본 · 이 맵이 링크로 참조):
- 카피 정식 초안: [`app-store-submission-pack.md`](./app-store-submission-pack.md)
- Play 복사용 카피/선언: [`ornscore-play-console-action-pack-2026-07-13.md`](./ornscore-play-console-action-pack-2026-07-13.md) · [`google-play-listing-worksheet-2026-07-12.md`](./google-play-listing-worksheet-2026-07-12.md)
- 실제 캡처된 초안 에셋: [`ornscore-store-visual-assets-pack-2026-07-12.md`](./ornscore-store-visual-assets-pack-2026-07-12.md) · `docs/store-assets/2026-07-12/`
- 리뷰/준비 계층: [`ornscore-mobile-listing-prep-pack.md`](./ornscore-mobile-listing-prep-pack.md)
- 실기기 육안 런북: [`ornscore-real-device-390px-qa-2026-07-06.md`](./ornscore-real-device-390px-qa-2026-07-06.md)
- 라우트 스모크 앵커: [`ornscore-route-smoke-checklist.md`](./ornscore-route-smoke-checklist.md)

---

## 1. 리스팅 카피 (한눈에 · 정식 원본은 링크)

짧고 안정적인 값(앱 이름·짧은 설명)만 인라인으로 두고, 긴 설명은 **드리프트를 막기 위해** 복사하지 않고 원본을 가리킨다.
Play Console에 붙일 때는 항상 아래 원본 문서에서 복사한다.

| 필드 | 값 / 원본 | 한도·비고 |
| --- | --- | --- |
| 앱 이름(App name) | `오른스코어` | 5 / 30자. 코드 정합: `src/app/manifest.ts` `short_name`. |
| 짧은 설명(Short description) | `한국 주식 후보를 점수·공시·재무 지표로 빠르게 좁히는 탐색 도구` | 36 / 80자. 순위·수익·다운로드 CTA·키워드 스터핑 없음. |
| 긴 설명(Full description) | **원본에서 복사** → `ornscore-play-console-action-pack-2026-07-13.md` §Full Description (동일본 `google-play-listing-worksheet-2026-07-12.md`) | 약 455 / 4000자. 이 맵은 사본을 두지 않는다(4중 복사 방지). |
| 카테고리(Category) | `Finance` (앱, 게임 아님) | 태그 후보: stock market, investing, finance tools. |
| 카테고리 프레이밍 | 공개 시장 **참고 데이터 탐색 도구**. 거래·중개·로보어드바이스·대출·암호화폐·결제·지갑·포트폴리오 관리로 표현 금지. | 금융기능 선언 시 비자문 설명문 사용(action-pack §Financial). |

> **카피 드리프트 규칙:** 짧은 설명/앱 이름을 바꾸면 이 표와 action-pack·worksheet 세 곳을 함께 갱신한다.
> 긴 설명은 원본 1곳(action-pack)만 정본으로 유지한다.

---

## 2. 스크린샷 라우트 맵 (정합된 7종)

기존 문서가 6종(visual-pack, `/watchlist` 제외)과 7종(worksheet/prep-pack, `/watchlist` 포함)으로 갈렸다.
아래가 **정합된 단일 순서**다. Play 최소 요건은 2장, 권장 4장 이상 → **핵심 6종(1~5,7)** 을 기본 세트로,
`/watchlist`(6)는 로그아웃 시 빈 상태라 **선택**으로 둔다.

| 순서 | 라우트 / 상태 | 캡션(초안) | 대체텍스트(alt, ≤140자) | 초안 에셋 |
| --- | --- | --- | --- | --- |
| 1 | `/` | 오늘 볼 종목을 빠르게 좁히기 | Home screen showing ORNScore stock discovery summary and data date. | `store-assets/2026-07-12/google-play-draft/phone-01-home.jpg` |
| 2 | `/stocks` | 조건에 맞는 한국 주식 탐색 | Stock explorer with filters, topic links, and candidate rows. | `phone-02-stocks.jpg` |
| 3 | `/stock/005930` | 점수 근거와 데이터 품질 확인 | Samsung Electronics detail page with score rationale and data quality. | `phone-03-stock-detail.jpg` |
| 4 | `/disclosures` | DART 공시 신호를 한곳에서 | Disclosure signal screen with DART categories and recent filings. | `phone-04-disclosures.jpg` |
| 5 | `/compare` | 후보 종목을 나란히 비교 | Compare screen for reviewing selected stock candidates side by side. | `phone-05-compare.jpg` |
| 6 | `/watchlist` (선택) | 관심 종목을 매일 루틴으로 | Watchlist screen for saved stocks and daily review. | — (로그아웃 빈 상태. 리뷰어 계정 준비 후에만 권장) |
| 7 | `/status` | 데이터 기준일과 원본 확인 | Data status screen showing source freshness and verification links. | `phone-06-status.jpg` |

캡션·alt 규칙(스토어 지침 정합):
- 실제 앱 UI만. `수익 보장`·`원금 보장`·`확정 수익률`·`1위`·`TOP`·`무료`·`지금 다운로드` 문구 금지.
- 태그라인은 이미지 면적 20% 이하이거나 아예 생략(UI가 말하게 한다).
- 개인 이메일·테스트 계정 식별자·`/admin/status` 같은 관리자 화면 노출 금지.
- 리스팅이 실제 게시되기 전에는 App Store/Play Store 배지를 넣지 않는다.

> 초안 6종은 `540x960`로 캡처되어 Play 기본 형태 검사를 통과했다(visual-pack §Local Screenshot Validation).
> 업로드 전 **1080x1920 세로**의 설치형 standalone/TWA 재캡처를 권장한다(더 많은 Play 추천 노출 자격).

---

## 3. 390px + 데스크톱 캡처 체크리스트 (이 저장소가 새로 더하는 부분)

스토어 업로드 자산은 **모바일 세로**가 원칙이다. 데스크톱 캡처는 업로드용이 아니라,
리뷰어/PWA 설치 미리보기에서 레이아웃이 깨지지 않는지 확인하는 **QA 게이트**다.
390px는 이 저장소의 실기기 기준폭(`ornscore-real-device-390px-qa-2026-07-06.md`)과 정합시킨다.

### 3.1 모바일 세로 390×844 (스토어 후보 캡처 + 육안)

각 라우트에서 캡처 직전 확인:

- [ ] **가로 스크롤 0** — 390px에서 수평 오버플로 없음(캡처 폭에서 잘림/삐져나옴 금지).
- [ ] **히어로/핵심 문구 가독** — 스토어 썸네일 크기로 줄여도 첫 줄이 읽힌다.
- [ ] **스켈레톤 사라짐** — 로딩 스켈레톤이 없는 상태(특히 `/stock/005930`는 `skeletonCount=0` 확인 후 캡처).
- [ ] **주소창 없는 화면** — 설치형 standalone/TWA(브라우저 주소창 보이는 캡처 지양).
- [ ] **개인정보 0** — 로그인 이메일·프로필·알림 설정 개인값·관리자 배지 노출 없음(로그아웃 상태 권장).
- [ ] **금칙어 0** — 매수·매도·추천·수익 보장·목표가·확정가 문구 없음(불변식 배너, 390px 런북 §0).

라우트별 특히 볼 점:

| 라우트 | 390px에서 특히 확인 |
| --- | --- |
| `/` | 오늘의 후보·데이터 기준일 카드가 한 화면에 정리되어 보임. 히어로 커버리지 숫자 정상. |
| `/stocks` | 필터/프리셋 칩이 줄바꿈되며 가로 넘침 없음. 후보 행 텍스트 안 잘림. |
| `/stock/005930` | 상단 결론·등급·순위('상위 X%') 블록이 세로로 정돈. 점수 근거·데이터 품질 배지 렌더. |
| `/disclosures` | DART 카테고리·최근 공시 목록이 세로 카드로 정돈. 링크 잘림 없음. |
| `/compare` | 비교 시작/빈 상태 안내가 명확(추천쌍 예시가 있으면 잘림 없이). |
| `/watchlist` | 로그아웃 빈 상태의 예시 3종·CTA가 정돈(선택 캡처). |
| `/status` | 데이터 기준일·원본/신선도 표가 세로에서 안 넘침. |

### 3.2 데스크톱 ≥1280px (QA 전용 · 업로드 아님)

- [ ] 각 라우트를 데스크톱 폭에서 열어 **가로 오버플로/레이아웃 붕괴 없음** 확인(콘텐츠 최대폭·여백 정상).
- [ ] 헤더 그룹화·하단 내비가 데스크톱에서 정상 배치(모바일 하단시트와 충돌 없음).
- [ ] OG/공유 미리보기(`public/social/ornscore-og-1200x630.jpg`)가 의도한 카피로 렌더(순위/수익/무료/배지 문구 없음).
- [ ] 데스크톱 스크린샷은 **Play 폰 스크린샷으로 업로드하지 않는다**(세로 폰 자산만 업로드).

---

## 4. 오너 전용 게이트 (이 로컬 작업 범위 밖)

아래는 계정/에셋/제출이 필요해 로컬 범위 밖이다. 코드 결함이 아니라 **⑤ 오너/디자인 · Play Console** 게이트다.

1. 실기기에서 PWA 설치 → §2 라우트 6종(선택 7종)을 **1080x1920 세로**로 재캡처.
2. §2 스크린샷·피처 그래픽 초안을 오너/디자인이 최종 승인(또는 재제작).
3. Play Console 앱 생성·카테고리(Finance)·연락처/개인정보/데이터삭제 URL 입력(action-pack §Store Details).
4. App content·Data safety·금융기능 선언을 콘솔에서 수동 완료(코드/`/privacy`와 일치, 과소고지 금지).
5. Android 패키지명·**Play 앱서명 SHA-256** 확정 → `assetlinks.json` 생성은 실 지문 확보 후에만(action-pack §Send Back).
6. 리뷰어 로그인 경로가 필요하면 Play Console에서만 테스트 계정 제공(자격증명 저장소 커밋 금지).
7. `manifest.ts`의 `screenshots[]`는 **최종 공개 자산이 `public/store/screenshots/`에 놓인 뒤에만** 추가(현재는 깨진 참조 방지 위해 미추가, visual-pack §Manifest Screenshots Decision).

> **하지 않은 것:** Play Console 접근·제출·자산 업로드·서명/assetlinks·계정/결제/주소 작업·데이터/점수식/패키지 변경 0.
> 이 문서는 그중 무엇도 발생했다고 시사하지 않는다.

---

## 5. 검증 (docs 전용)

이 슬라이스는 문서 1개 신규(앱 소스/라우팅/데이터 무변경)이므로 최소 게이트만 해당한다.

- `npx tsc --noEmit` — 0 errors (소스 무변경).
- `$env:PYTHONUTF8='1'; python scripts\verify_metrics.py` — 138종목·오류0·금칙0·Metrics 불변 기대.
- `git diff --check` — 공백 오류 0.
- 인코딩 스캔 — 이 문서 U+FFFD(치환문자) 0 · 스캐폴딩 마커 0 · 한국어 정상.

UI/라우팅 변경이 없어 `npm run build` / `verify:local` / 390px·데스크톱 육안은 이 슬라이스의 게이트가 아니다
(위 §3 체크리스트는 오너가 실제 캡처할 때 쓰는 실행표이며, 캡처 자체는 ⑤ 오너 게이트).
