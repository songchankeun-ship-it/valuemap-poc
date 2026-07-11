# 오른스코어 앱/PWA/TWA 로컬 준비도 감사 — 2026-07-11

> 작성: Task 143 (2026-07-11, Claude). 목적은 **유지보수자(운영자 또는 다음 에이전트)가 이 문서 하나만 열어도
> "지금 무엇이 끝났고 / 무엇이 운영자만 할 수 있고 / 무엇이 아직 자동화 불가"인지** 바로 알 수 있게 하는 것.
> 이 슬라이스는 **표시·문서 전용**이다. 매니페스트/아이콘/스크립트 로직·점수 산식·수집 코드·`metricsVersion`은 무변경.
>
> 톤 규칙(전 문서 공통): **투자 추천 아님 / 데이터 신선도 고지 유지 / 스토어 출시 미확정은 "미확정"으로만 표기.**
> 이 감사가 통과했다고 스토어 출시가 확정되는 것은 아니다. 공개 화면에 Play/App Store 등재를 주장하지 않는다.

---

## 0. 한 줄 결론

- **PWA 홈 화면 설치는 로컬 코드상 준비 완료**(아이콘·매니페스트·설치 프롬프트·오프라인 안내·standalone 가드 전부 존재).
- **`npm run app:check`는 통과**하며, 남은 것은 **외부 게이트 1개**(`assetlinks.json`는 실제 Android 서명 지문이 생긴 뒤에만 생성) 뿐이다.
- **1차 스토어 경로 = Android TWA로 잠금.** iOS 정식 래퍼는 **운영자·Mac·Xcode 게이트**로 보류, 그 전까지 iOS는 홈 화면 추가 PWA로 운영.
- **Service Worker는 여전히 의도적으로 미등록.** 점수·시세·공시 데이터 신선도 배지와 캐시 충돌을 피하기 위한 결정 유지(`docs/app-roadmap.md` §4).

---

## 1. `npm run app:check` 현재 결과 (2026-07-11 실행)

```
all icons valid
OK   PWA icon dimensions and PNG signatures
OK   src/app/manifest.ts …            (한글 이름/short_name/standalone/start_url/scope/ko-KR/아이콘 3종/바로가기 3종)
OK   src/app/layout.tsx …             (apple-touch-icon·viewport·viewport-fit cover·theme-color·appleWebApp)
OK   src/components/AppHeader.tsx …   (safe-area-inset-top)
OK   src/components/PwaInstallHelper.tsx …  (beforeinstallprompt·appinstalled·standalone 감지·iOS fallback)
OK   src/app/offline/page.tsx / OfflineContent / i18n …  (오프라인 안내 로컬라이즈)
OK   (4개 소스 전부) no service worker registration       ← SW 미등록 의도 유지 확인
OK   assetlinks 생성기 --dry-run 유효 JSON·placeholder 거부·public/.well-known 미생성
OK   docs (submission-pack / readiness / roadmap / owner-checklist / assetlinks-kit) 정합
WAIT public/.well-known/assetlinks.json not generated yet; needs real Android package + SHA-256 fingerprint
app packaging check passed (1 external gate waiting)
```

- **판정**: `FAIL` 0 · `WAIT` 1 → 게이트 종료코드 0(통과). 유일한 `WAIT`은 **버그가 아니라 의도된 외부 게이트**다.
- 이 `WAIT`이 사라져 `passed (0 external gates waiting)`가 되려면 **운영자가 실제 서명 지문을 확보**해야 한다(§3-B).

---

## 2. ✅ 지금 준비 완료 (로컬·자동 검증 가능)

| 항목 | 상태 | 근거 파일 |
|---|---|---|
| PWA 매니페스트 | 완료 | `src/app/manifest.ts`(한글명·standalone·start_url `/`·scope `/`·ko-KR·바로가기 3종) |
| 설치 아이콘 세트 | 완료 | `public/icon-192.png`·`icon-512.png`·`icon-512-maskable.png`·`apple-touch-icon.png`(치수·PNG 시그니처 검증) |
| 설치 프롬프트 UX | 완료 | `src/components/PwaInstallHelper.tsx`(브라우저가 실제 프롬프트를 줄 때만 노출·iOS standalone fallback) |
| iOS 홈 화면 추가 | 완료(비용 0) | `apple-touch-icon.png`·`layout.tsx` `appleWebApp` standalone 설정 |
| 오프라인 안내 | 완료 | `src/app/offline/page.tsx`·`OfflineContent.tsx`·`src/lib/i18n.ts` |
| safe-area(노치) 대응 | 완료 | `layout.tsx` `viewportFit: "cover"` + `AppHeader.tsx` `pt-[env(safe-area-inset-top)]` |
| SW 미등록 유지 | 완료(의도적) | 4개 소스에 `serviceWorker.register` 0건(체크가 회귀 감시) |
| assetlinks 생성기 | 완료(대기 상태로 안전) | `scripts/generate-assetlinks.mjs`(placeholder 거부·`--dry-run`·자동 대문자화) |
| 로컬 게이트 스크립트 | 완료 | `scripts/check-app-packaging.mjs`(`npm run app:check`) |
| 스토어 제출 초안 문서 | 완료(콘솔 입력 전 초안) | `docs/app-store-submission-pack.md`·`docs/ornscore-mobile-listing-prep-pack.md` |

> 위 항목은 계정·서명 키·서버 없이 **로컬에서 반복 검증**된다. 회귀는 `npm run app:check`가 잡는다.

---

## 3. 🔒 운영자만 할 수 있는 것 (계정·결제·서명·콘솔 게이트)

로컬 자동화 밖. 아래는 **운영자(사람) 게이트**로 남으며, 이 작업 범위에서 시도하지 않는다.

### 3-A. 실기기 육안 점검 (Playwright 미구성)
- 실제 휴대폰에서 홈 화면 추가 → standalone 실행 → 아이콘 품질·주소창 숨김·하단 탭·OAuth 복귀·관심 종목·알림 골격·오프라인·법적 고지 확인.
- 절차 원본: `docs/app-packaging-readiness.md` §4, OAuth 복귀 8단계는 `docs/app-roadmap.md` §5-1.

### 3-B. Android TWA — 실 서명 지문 게이트 (`WAIT` 해소의 유일 경로)
1. Play Console 개발자 등록($25 1회) → 앱 생성 → 패키지명 `com.ornscore.app` 최종 확인.
2. **앱 서명 키(app-signing key)의 SHA-256 지문** 확보(Play App Signing 화면 또는 로컬 keystore `keytool`).
3. `npm run app:assetlinks -- --package com.ornscore.app --fingerprint "<실 SHA-256>"`(먼저 `--dry-run`).
4. `npm run app:check` → `0 external gates waiting` 확인 후 배포 → `https://ornscore.com/.well-known/assetlinks.json` 200·주소창 숨김 확인.
- 한 장 실행 순서: `docs/ornscore-android-assetlinks-owner-kit.md`. 입력값 빈칸 시트: `docs/ornscore-android-twa-owner-checklist.md`.

### 3-C. iOS App Store 래퍼 (보류 — Mac/Xcode/계정 게이트)
- Apple Developer($99/년) + Mac+Xcode 빌드 환경 + "단순 웹 래퍼" 반려 리스크(가이드라인 4.2) 대비 네이티브 가치 준비 필요.
- 그 전까지 iOS는 **홈 화면 추가 PWA로 운영**(현재 동작). 상세: `docs/app-packaging-readiness.md` §1-4.

### 3-D. 스토어 콘솔·결제·서명 키 관리
- Play $25 / Apple $99 결제, 서명 키 생성·보관, 스크린샷·스토어 문구 최종 입력, 심사 제출은 전부 운영자. 초안은 `docs/app-store-submission-pack.md`가 제공.

---

## 4. ⏳ 아직 자동화 불가 (외부 입력·제품 결정 대기)

| 게이트 | 왜 자동화 불가 | 해소 조건 |
|---|---|---|
| `public/.well-known/assetlinks.json` 생성 | 실 서명 지문은 **운영자만 얻는 외부 값**. 가짜 값 커밋 시 도메인 검증 실패로 주소창 노출 | 운영자가 §3-B 실 지문 확보 후 생성기 실행 |
| 실기기 standalone/OAuth 복귀 QA | Playwright 미구성 + 실 로그인 provider 왕복 필요 | 운영자 실기기 1회 점검(§3-A) |
| iOS 정식 래퍼 착수 | Mac/Xcode/Apple 계정 + 네이티브 가치 제품 결정 필요 | §3-C 전제 충족 후 별도 결정 |
| Capacitor(양 스토어 단일 코드) | `ios/`·`android/` 네이티브 구조·CI 도입은 **레포 제품 결정** 사항, 오늘 범위 밖 | 레포가 네이티브 빌드 도구 수용 결정 시 |
| Play/App Store "등재됨" 공개 문구 | 실제 출시 확정 전까지 **미확정** | 실제 스토어 승인·게시 이후에만 |

---

## 5. 이 감사에서 하지 않는 것 (범위 밖)

- **실 서명값 안 넣음**: `public/.well-known/assetlinks.json` 생성 0. 예시(`docs/templates/assetlinks.example.json`)는 서빙 안 되는 자리표시자 전용, 무변경.
- **Service Worker 도입 안 함**: 데이터 신선도·신뢰 배지 충돌 회피 결정 유지(`docs/app-roadmap.md` §4).
- **네이티브 빌드 도구 도입 안 함**: `ios/`·`android/`·Capacitor·새 npm 의존성·CI 0.
- **공개 스토어 주장 안 함**: 공개 화면에 Play/App Store 등재 암시 문구 0. 스토어 출시는 "미확정"으로만.
- **원격/계정/호스팅 무접촉**: remote push·콘솔 설정·결제·서명 키·시크릿 0.

---

## 6. 관련 문서 (더 깊게 볼 때)

- 결정 트리·경로별 비용·QA 게이트·반려 리스크 → `docs/app-packaging-readiness.md`
- 코드 마감 상태·실행 명령·배포 전 금지 → `docs/app-packaging-final-checklist.md`
- 경로 비교·SW 미등록 결정·앱 기능 준비도·OAuth 복귀 8단계 → `docs/app-roadmap.md`
- 스토어 등록 문구·개인정보 답변·스크린샷·리뷰 노트 초안 → `docs/app-store-submission-pack.md`·`docs/ornscore-mobile-listing-prep-pack.md`
- assetlinks 실행 순서(SHA-256→생성→검증) → `docs/ornscore-android-assetlinks-owner-kit.md`
- Android TWA 운영자 인테이크 체크리스트 → `docs/ornscore-android-twa-owner-checklist.md`
