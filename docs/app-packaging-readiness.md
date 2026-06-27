# 오른스코어 앱 패키징 준비도 — 다음 사람의 결정 가이드

> 작성: Task 77 (2026-06-27, Claude). 목적은 "스토어 출시 발표"가 아니라, **다음 사람(운영자 또는 다음 에이전트)이
> 채팅 기록 없이도 앱 패키징의 다음 한 걸음을 고를 수 있게** 결정 트리·필요 산출물·실기기 점검을 한 곳에 모으는 것.
> 톤 규칙은 전 화면·전 문서와 동일: **투자 추천 아님 / 데이터 신선도 고지 유지 / 스토어 출시 미확정은 "미확정"으로만 표기.**
>
> 경로 비교표·SW 미등록 결정·앱 기능별 인증 준비도·실기기 OAuth 복귀 절차는 `docs/app-roadmap.md`에 이미 있으므로
> **여기서 중복하지 않고 가리킨다.** 폴더 구조/파일 트리도 app-roadmap §2를 본다. 이 문서는 **결정·산출물·게이트**에 집중.

---

## 1. 결정 트리 — 다음 사람이 고를 것

각 경로의 "다음 인간 결정"과 "전제(선결 조건)"만 적는다. 경로의 장단점 비교는 app-roadmap §2 / §2 경로 비교 요약표 참조.

```
지금 동작 ──▶ PWA-only (홈 화면에 추가)
                │
                │  스토어 노출이 필요한가? ──아니오──▶ 그대로 PWA 유지 (추가 비용/계정 0)
                │
                └─예─▶ 어느 스토어 먼저?
                          ├─ Android 우선 ─▶ Android TWA  (Play Console $25 1회 + assetlinks 서명 지문)
                          ├─ iOS 임시      ─▶ iOS 홈 화면 추가 (지금 동작, 비용 0)
                          └─ iOS 정식      ─▶ iOS App Store 래퍼 (Apple $99/년 + Mac/Xcode, "단순 웹 래퍼" 반려 리스크)

레포가 네이티브 빌드 도구(ios//android//새 npm/lock/CI)를 받아들이기로 제품 결정되면
   ──▶ Capacitor (양 스토어 단일 코드, 위 비용·서명·심사 전부 포함) — 그 전엔 범위 외
```

### 1-1. PWA-only (지금) — 기본값
- **상태**: 동작 중. 아이콘 에셋(Task 74)·설치 프롬프트 UX(Task 75)·standalone 로그인 복귀 가드(Task 76)까지 완료.
- **다음 인간 결정**: "스토어 노출이 지금 필요한가?" — 아니라면 **아무것도 하지 않는 것이 가장 안전한 선택**이다. 추가 비용·계정·심사 0.
- **전제**: 없음(이미 충족). 남은 품질 변수는 실기기 standalone OAuth 복귀(app-roadmap §5-1) 1회 검증뿐.

### 1-2. Android TWA (다음 후보) — 가장 적은 추가 작업으로 Play 등재
- **다음 인간 결정**: ① Play Console 개발자 등록($25 1회)을 진행할지, ② 첫 스토어를 Android로 할지 제품 결정.
- **전제(선결)**: **실제 서명 키**(업로드 키 또는 Play 앱 서명 키)의 **SHA-256 지문**이 있어야 `assetlinks.json`을 만들 수 있다. 지문이 없으면 도메인-앱 연결이 불가하고 주소창이 노출된다. → **서명 키 생성/관리가 선결.**
- **산출물**: Bubblewrap/PWABuilder로 만든 TWA 셸(레포 본체에 네이티브 코드 안 넣고 별도 빌드 산출물 가능) + `public/.well-known/assetlinks.json`(실 지문 들어간 뒤에만 — §3 참조).

### 1-3. iOS 홈 화면 추가 (지금) — 비용 0
- **다음 인간 결정**: 없음(이미 동작). apple-touch-icon(Task 74)으로 아이콘 품질 확보됨.
- **전제**: 없음. iOS Safari "공유 → 홈 화면에 추가"로 standalone 실행.

### 1-4. iOS App Store 래퍼 (나중)
- **다음 인간 결정**: ① Apple Developer Program 가입($99/년) 여부, ② Mac+Xcode 빌드 환경 확보 여부.
- **전제(선결)**: Apple은 **"단순 웹 래퍼"를 반려**하는 사례가 있어, 네이티브 가치(푸시·오프라인·딥링크 등)를 갖춰야 통과 가능성이 높다. → 래퍼 착수 전 app-roadmap §5 앱 기능 준비 선행 권장. WKWebView 래퍼(PWABuilder iOS) 또는 §1-5 Capacitor가 필요.

### 1-5. Capacitor (조건부 — 레포가 네이티브 빌드 도구를 받아들일 때만)
- **다음 인간 결정**: 레포에 `ios/`·`android/` 디렉터리, 새 npm 의존성, lock 변동, CI 빌드 파이프라인을 **도입하기로 제품 결정**할지. 이것이 핵심 게이트.
- **전제(선결)**: 위 네이티브 빌드 구조 수용 + 양 스토어 계정($25 + $99/년) + 서명·심사. **오늘 기준 레포는 이를 수용하지 않으며, 이 작업 범위에서도 도입하지 않는다.**

---

## 2. 경로별 필요 에셋·계정 비용·QA 게이트·반려 리스크

| 경로 | 필요 에셋/산출물 | 계정·비용 | QA 게이트(착수 전) | 반려/실패 리스크 |
|---|---|---|---|---|
| PWA-only | (완료) 아이콘 192/512/maskable/apple-touch | 0 | 실기기 standalone OAuth 복귀(§4·roadmap §5-1) | iOS 웹 푸시 제약(16.4+ 홈 화면 추가 상태만), 스토어 노출 없음 |
| Android TWA | TWA 셸(Bubblewrap/PWABuilder) + `assetlinks.json`(실 지문) | **Play Console $25(1회)** | assetlinks 검증(지문 일치)·standalone 전 기능 점검 | 서명 지문 불일치 시 주소창 노출, Play 정책 심사, 서명 키 분실 시 업데이트 불가 |
| iOS 홈 화면 추가 | (완료) apple-touch-icon 180 | 0 | 실기기 추가/실행 1회 | 푸시 제약, 스토어 노출 없음 |
| iOS App Store 래퍼 | WKWebView 래퍼 패키지 + 스크린샷/메타데이터 | **Apple Developer $99/년 + Mac+Xcode** | 네이티브 가치 점검(푸시·오프라인·딥링크) | **"단순 웹 래퍼" 반려**(가이드라인 4.2), 심사 지연 |
| Capacitor | `ios/`·`android/` 네이티브 구조 + 플러그인 + CI | $25 + $99/년 + 빌드 유지보수 | 양 스토어 심사 + 네이티브 빌드 CI | 위 양쪽 리스크 + 레포 복잡도/유지보수 비용 |

> **assetlinks 서명 지문 관리 주의**: `assetlinks.json`의 `sha256_cert_fingerprints`는 **실제 서명 키의 지문**이어야 한다.
> Play 앱 서명(Google이 키 관리)을 쓰면 Play Console이 알려주는 **앱 서명 키 지문**을 넣고, 자체 업로드 키도 함께 등록할 수 있다.
> 지문이 틀리면 TWA가 도메인 검증에 실패해 **주소창이 그대로 보인다(앱처럼 안 보임)**. 키를 분실하면 동일 앱 업데이트가 막힌다.

---

## 3. assetlinks 예시 파일 (서빙 안 함 — 실 지문 생긴 뒤에만 배치)

- 예시 파일: **`docs/templates/assetlinks.example.json`** (이 레포에 포함, **`public/.well-known` 밖**).
- 이 파일은 **예시일 뿐 서빙되지 않는다.** `package_name`·`sha256_cert_fingerprints`는 **명백한 자리표시자**(`com.example.ornscore` / `REPLACE_WITH_REAL_SHA256_FINGERPRINT`)라 그대로는 동작하지 않는다.
- **실제 파일은 `public/.well-known/assetlinks.json`에**, **실제 서명 키 지문이 생긴 뒤에만** 배치한다. 그 전엔 `public/.well-known/`을 만들지 않는다(가짜 서명값으로 도메인-앱 관계 파일을 두지 않는다 — app-roadmap §2-2 / §3 참조).
- 배치 절차(요약): Play Console 서명 키 SHA-256 지문 확보 → 예시의 자리표시자를 실 지문/실 패키지명으로 치환 → `public/.well-known/assetlinks.json`으로 복사 → 배포 후 `https://ornscore.com/.well-known/assetlinks.json` 200·내용 확인 → TWA 빌드에서 도메인 검증 통과(주소창 숨김) 확인.

---

## 4. 실기기(실제 휴대폰) 사전 점검 체크리스트

> **운영자/실기기 게이트**(Playwright 미구성). 어떤 패키징 단계(TWA 빌드·래퍼·스토어 제출)에 들어가기 **전에**, 실제 휴대폰에서 아래를 1회 확인한다.
> 로그인 복귀는 항목만 적고 절차는 **app-roadmap §5-1의 8단계 OAuth 복귀 절차**를 그대로 사용한다(여기서 재작성하지 않음).

- [ ] **설치 아이콘 품질**: 홈 화면 추가 후 아이콘이 깨지지 않고(여백/잘림 없음), maskable 안전영역이 Android 런처에서 정상으로 보이는지.
- [ ] **standalone 내비게이션**: 주소창 없는 standalone 창에서 `/`·`/stocks`·하단 5탭(MobileBottomNav)·내부 링크가 앱 창 안에서 열리는지(외부 브라우저로 튀지 않음).
- [ ] **로그인 복귀(login return)**: standalone 창에서 Kakao/Google/이메일 매직링크 로그인 후 **앱 컨텍스트로 정확히 복귀**하는지 → **절차는 app-roadmap §5-1 1~8단계**(code 없는 콜백 친절 안내·`next=//evil.com` 외부 미복귀 negative 포함) 사용.
- [ ] **관심 종목(watchlist)**: 로그인 세션이 standalone에서 유지되며 관심 종목 추가/동기화가 동작하는지. 비로그인 시 로컬 저장 동작도 확인.
- [ ] **알림 설정(notification settings)**: `settings/notifications`가 standalone에서 열리고 현재 골격/미리보기가 깨지지 않는지(실 푸시는 SW/네이티브 의존이라 현재 미지원 — app-roadmap §5).
- [ ] **오프라인 페이지**: 네트워크를 끊고 standalone에서 `/offline`(또는 네트워크 필요 안내)이 정상 노출되는지. 데이터 JSON은 의도적으로 캐시하지 않음(app-roadmap §4).
- [ ] **법적 고지 문구(legal copy)**: standalone에서도 `/about`·`/privacy`·`/terms`의 "투자 추천 아님"·데이터 신선도·스토어 미확정 고지가 동일하게 보이는지(데스크톱과 누락 차이 없음).

---

## 5. 이 작업(Task 77)에서 하지 않는 것

- **네이티브 빌드 도구 도입 안 함**: `ios/`·`android/` 디렉터리, Capacitor/RN, 새 npm 의존성, lock 변동, CI 빌드 파이프라인 0.
- **Service Worker 도입 안 함**: 데이터 신선도와 신뢰 배지 충돌 회피 결정 유지(app-roadmap §4).
- **공개 스토어 주장 안 함**: App Store/Play 출시 여부는 "미확정"으로만 표기. 공개 화면에 스토어 등재를 암시하는 문구 0.
- **실 서명값 안 넣음**: `public/.well-known/assetlinks.json` 생성 0. 예시 파일은 명백한 자리표시자만, 서빙되지 않음.
- **계정 결제·콘솔 설정 안 함**: Play $25 / Apple $99 결제, 서명 키 생성, 스토어 제출은 전부 **운영자 게이트**.
