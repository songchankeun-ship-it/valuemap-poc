# 오른스코어 모바일 리스팅 준비 팩 (로컬 전용)

작성일: 2026-07-03 (Task 145, Claude)
갱신: 2026-07-11 — 리스팅 카피의 지표명을 현 사이트 용어(추세·거래활성도·밸류·위험조정)로 동기화. 문서 전용, 소스·동작 무변경.

> **로컬 전용 안내.** 이 문서는 미래 모바일 앱 스토어 등록을 **검토·준비하기 쉽게** 정리한 리뷰/준비 계층이다.
> **제출·업로드·계정/결제/로그인 제공자/원격 설정을 전혀 건드리지 않는다.** 외부 서비스 액션 0.
> 스토어에 실제로 붙일 **정식 초안(canonical draft)** 은 여전히 [`docs/app-store-submission-pack.md`](./app-store-submission-pack.md) 가 원본이다.
> 이 문서는 그 초안을 복사하지 않고 **링크**로 참조하며, 리뷰용 감사표 + 정제 카피 + 메타데이터 갭 표 + 오너 다음 단계만 담는다.

관련 문서: [`docs/app-store-submission-pack.md`](./app-store-submission-pack.md) · [`docs/app-packaging-readiness.md`](./app-packaging-readiness.md) · [`docs/ornscore-android-twa-owner-checklist.md`](./ornscore-android-twa-owner-checklist.md) · [`docs/app-roadmap.md`](./app-roadmap.md)

---

## 1. 현재 표면 감사 (review)

각 항목은 실제 소스의 `file:line` 근거를 단다. 이 섹션에서는 **아무것도 편집하지 않았다**.

| 항목 | 현재 값 | 근거 (`file:line`) |
| --- | --- | --- |
| 앱 이름(짧은) | 오른스코어 | `src/app/manifest.ts:14` (`short_name`) · `src/app/layout.tsx:54` (`appleWebApp.title`) |
| 앱 이름(긴) | 오른스코어 — 한국 주식 탐색 도구 | `src/app/manifest.ts:13` (`name`) · `src/app/layout.tsx:16` (`title.default`) |
| 태그라인/짧은 설명 | 138개 종목의 자체 지표 4종 · PER · PBR · ROE · DART 공시 신호를 한 화면에서. | `src/app/manifest.ts:15` (`description`) · `src/app/layout.tsx:19-20` (`description`) |
| 스토어 짧은 설명(초안) | 한국 주식 후보를 점수·공시·재무 지표로 빠르게 좁히는 탐색 도구 | `docs/app-store-submission-pack.md:41` |
| 개인정보처리방침 링크 | `https://ornscore.com/privacy` | 페이지 실재 `src/app/privacy/page.tsx` · 참조 `docs/app-store-submission-pack.md:24` |
| 이용약관 링크 | `https://ornscore.com/terms` | 페이지 실재 `src/app/terms/page.tsx` · 참조 `docs/app-store-submission-pack.md:25` |
| 문의(mailto) | `contact@ornscore.com` | `docs/app-store-submission-pack.md:26` |
| 모바일 우선 가치 제안 | 설치형(standalone) 세로 화면에서 오늘 살펴볼 종목을 한 화면에 좁혀 보는 탐색 도구 | `src/app/manifest.ts:18` (`display:"standalone"`), `:24` (`orientation:"portrait"`), `:25-29` (`shortcuts` 오늘/종목/공시) · `src/app/layout.tsx:51-55` (`appleWebApp`), `:62-70` (`viewport`/`themeColor`) |

**요약 판단:** 이름·태그라인·support/privacy 링크·모바일 우선 표면(standalone·portrait·shortcuts·apple-touch·appleWebApp·viewport·theme-color)은 모두 코드에 존재하고 정합하다. 갭은 전부 **에셋 의존(스크린샷/공유 이미지)** 이며 코드 결함이 아니다(§3 참조).

---

## 2. 정제된 한국어 리스팅 카피

> 아래 카피는 [`app-store-submission-pack.md`](./app-store-submission-pack.md) 의 정식 초안과 **일관**되게 정리한 리뷰용 버전이다.
> **확정 가격·Pro/Premium 가격·자동갱신 구독 문구를 넣지 않는다**(현재 무료 결제 없음, `app-store-submission-pack.md:31`).

### 2.1 짧은 요약 (short summary)

한국 주식 후보를 점수·공시·재무 지표로 빠르게 좁혀 보는 데이터 탐색 도구. 투자 추천 아님.

### 2.2 긴 설명 (longer description)

오른스코어는 한국 개인 투자자가 오늘 어떤 종목부터 살펴볼지 빠르게 좁힐 수 있도록 돕는 데이터 기반 주식 탐색 도구입니다.

추세, 거래활성도, 밸류, 위험조정 네 가지 자체 지표와 PER, PBR, ROE, 배당수익률, DART 공시 신호를 한 화면에서 함께 볼 수 있습니다. 종목 상세에서는 점수 근거, 데이터 품질, 공시 원문 링크, 업종 비교, 관심 종목 저장을 확인할 수 있습니다.

모바일에서는 홈 화면에 설치해 주소창 없는 세로 화면(standalone)으로 실행할 수 있고, 오늘·종목 찾기·공시 신호 바로가기로 자주 보는 화면에 곧장 진입할 수 있습니다.

모든 점수와 신호는 공개 데이터와 자체 산식에 따른 참고 정보이며, 최종 투자 판단과 책임은 사용자 본인에게 있습니다.

### 2.3 기능 불릿 (feature bullets)

- 오늘의 후보 종목과 시장 브리핑
- 종목 탐색, 필터, 비교
- 종목별 점수 근거와 초보자 해석
- DART 공시 신호와 원문 링크
- 관심 종목 저장과 로그인 기반 동기화
- 데이터 기준일, 산식 버전, 데이터 한계 공개
- 홈 화면 설치(standalone) · 세로 화면 · 오늘/종목/공시 바로가기

### 2.4 안전 고지 (safety disclaimer)

오른스코어는 투자 추천, 매수·매도 권유, 투자자문, 거래 체결 기능을 제공하지 않습니다. 모든 점수와 공시 신호는 공개 데이터(KRX·DART·Naver Finance 등)와 자체 산식에 따른 **참고 정보**이며, 수익을 보장하지 않습니다. 데이터 기준일과 한계는 서비스 내에 고지하며, **최종 투자 판단과 그 책임은 사용자 본인에게 있습니다.**

### 2.5 스크린샷 체크리스트 (screenshot checklist)

- [ ] 홈 `/` — 오늘의 후보와 데이터 기준일
- [ ] 탐색 `/stocks` — 종목 탐색/필터
- [ ] 상세 `/stock/005930` — 점수 근거·데이터 품질
- [ ] 공시 `/disclosures` — 공시 신호
- [ ] 비교 `/compare` — 종목 비교 시작 화면
- [ ] 관심 `/watchlist` — 관심 종목
- [ ] 소개 `/about` — 앱처럼 설치하기·서비스 성격

캡처 규칙(스토어 지침 `app-store-submission-pack.md:135-141` 정합):
- 모바일 **세로(portrait) · 설치형 standalone/TWA** 화면으로 캡처(주소창 보이는 브라우저 캡처 지양).
- 텍스트가 잘리지 않는 세로 화면.
- **수익 보장처럼 보이는 문구 금지**(“원금 보장”, “확정 수익률” 등).
- 실제 스토어 출시가 확정되기 전에는 **App Store/Play Store 배지를 공개 이미지에 넣지 않는다.**

### 2.6 오너 전용 다음 단계 (owner-only next steps)

이 단계들은 **외부 계정/에셋/제출**이 필요해 이 로컬 작업 범위 밖(⑤ 오너/디자인, ④ 운영 게이트)이다.

1. 실기기에서 PWA 설치 후 standalone 화면으로 §2.5 스크린샷 7종 캡처(모바일 세로).
2. OG/Twitter 공유 카드 이미지 1장 제작 후 배포 결정(현재 자산 없음 — §3).
3. Play Console/App Store Connect 등록 초안을 `app-store-submission-pack.md` 문구로 최종 다듬기.
4. Android TWA 서명 SHA-256·패키지명 확정은 `ornscore-android-twa-owner-checklist.md` 빈칸 시트로 진행.
5. Data safety / App Privacy 답변을 실제 수집 항목·외부 처리자 기준으로 재확인(`app-store-submission-pack.md:74-84,123-133`).

---

## 3. PWA / 모바일 메타데이터 로컬 감사표

각 필드의 현재 상태와 **로컬 전용 갭**을 표시한다. 에셋 의존 갭은 코드 수정이 아니라 **⑤ 오너/디자인 게이트**로 명시한다.

| 필드 | 상태 | 근거 / 비고 |
| --- | --- | --- |
| manifest `id` | ✅ 있음 | `src/app/manifest.ts:12` (`"/"`) |
| manifest `name` / `short_name` | ✅ 있음 | `src/app/manifest.ts:13-14` |
| manifest `description` | ✅ 있음 | `src/app/manifest.ts:15` |
| manifest `display: standalone` | ✅ 있음 | `src/app/manifest.ts:18` |
| manifest `orientation: portrait` | ✅ 있음 | `src/app/manifest.ts:24` |
| manifest `shortcuts` (오늘/종목/공시) | ✅ 있음 | `src/app/manifest.ts:25-29` |
| manifest `icons` (svg + 192/512/512-maskable) | ✅ 4종 | `src/app/manifest.ts:30-55` |
| `apple-touch-icon` (180px) | ✅ 있음 | `src/app/layout.tsx:46` |
| `appleWebApp` (capable·statusBar·title) | ✅ 있음 | `src/app/layout.tsx:51-55` |
| `viewport` (device-width·viewportFit cover) | ✅ 있음 | `src/app/layout.tsx:62-65` |
| `themeColor` (다크/라이트) | ✅ 있음 | `src/app/layout.tsx:66-69` · manifest `theme_color` `:22` |
| `openGraph` (title/description/url/siteName/locale/type) | ✅ 있음 | `src/app/layout.tsx:21-28` |
| `twitter` (`summary_large_image`) | ✅ 있음 | `src/app/layout.tsx:29-33` |
| OG/Twitter **공유 이미지 에셋** | ⚠️ 없음 | ⑤ 오너/디자인. `twitter.card:"summary_large_image"`이나 `images` 미지정·`public/`에 공유 카드 없음. 대표 이미지 1장 제작이 필요한 **에셋 갭**(코드 결함 아님). |
| manifest `screenshots[]` | ⚠️ 없음 | ⑤ 오너/디자인. PWA 리치 설치 UI용 스크린샷 배열 미지정. §2.5 캡처가 선행되어야 채울 수 있음. |
| 캡처된 모바일 스크린샷 | ⚠️ 없음 | ⑤ 오너. 실기기 standalone 캡처 필요. |

**모든 ⚠️ 갭은 에셋 선행이 필요**하므로, 지금 코드로 안전하게 닫을 수 없다. §4 결정 참조.

---

## 4. 메타데이터 수정 결정

**결정: 문서화 전용(documentation-only). 이번 Task에서 소스 코드는 변경하지 않는다.**

근거:
- 남은 갭(OG/Twitter 공유 이미지, manifest `screenshots[]`, 캡처 스크린샷)은 **전부 새 에셋 제작이 선행**되어야 한다. 에셋 없이 필드만 추가하면 깨진 참조가 되어 안전하지 않다.
- 코드로 존재하는 메타데이터 필드는 이미 정합하며(§1·§3), **자명하게 안전한 무에셋·무동작변경 추가 항목이 없다.**
- 따라서 Planner 계획 6단계 기준(“의심스러우면 갭 표에 기록하고 소스는 그대로”)에 따라 **소스 미변경**으로 확정, 갭은 §3 표에 ⑤ 게이트로 기록.

영향: 문서 전용 경로이므로 **런타임/UI 영향 0**(모바일·데스크톱 `<head>` 무변경). 만약 향후 오너가 에셋을 준비해 `screenshots[]`/OG 이미지를 붙이면 그때 `manifest.ts`/`layout.tsx` `<head>` 만 영향받고, 390px·데스크톱 육안 재검은 그 시점의 ⑤ 게이트로 남는다.

---

## 5. 검증 (docs 전용)

- `npx tsc --noEmit` — 0 errors (소스 무변경, 기존과 동일 기대).
- `python scripts/verify_metrics.py` — 138/0/금칙 0/Metrics 2.4 불변 기대.
- `npm run app:check` — 패키징/아이콘 게이트 통과 기대(assetlinks WAIT는 기존 오너 게이트).
- 인코딩 게이트: 변경 문서 U+FFFD(치환문자) 0 · 스캐폴딩 마커 0 · 한국어 정상 렌더.

명령 출력은 커밋 메시지/핸드오프(Task 145)에 기록한다.

---

## 하드 제약 준수 확인

- ✅ 로컬 파일만. 제출·업로드·외부 서비스 액션 0.
- ✅ 계정 설정·민감 config·결제·로그인 제공자·원격 서비스 무변경.
- ✅ 앱 소스 무변경(문서 전용). 스토어 정식 초안 원본은 `app-store-submission-pack.md` 유지.
