# 오른스코어 Android assetlinks 운영자 키트 (SHA-256 → 생성 → 검증)

> 작성: Task 218 (2026-07-06, Claude). 목적은 **운영자가 실제 Android 서명 지문(SHA-256)을 얻어
> `assetlinks.json`을 만들고 `app:check`를 통과시키기까지**의 한 장짜리 실행 순서다.
> 결정 트리·비용·반려 리스크·스토어 문구는 **다른 문서에 있으므로 여기서 중복하지 않고 가리킨다.**
>
> 관련 문서(가리키기만):
> - 입력값 빈칸 시트(패키지명·지문·스크린샷·문구 상태) → `docs/ornscore-android-twa-owner-checklist.md` §3
> - 결정 트리·경로별 비용·QA 게이트·반려 리스크 → `docs/app-packaging-readiness.md` (§3에 assetlinks 배치 개요)
> - 배포 전 금지·생성기 명령 → `docs/app-packaging-final-checklist.md`
> - 스토어 등록 문구·개인정보 답변 초안 → `docs/app-store-submission-pack.md`
>
> 톤 규칙(전 문서 공통): **투자 추천 아님 / 데이터 신선도 고지 유지 / 스토어 출시 미확정은 "미확정"으로만 표기.**
> 이 키트를 실행한다고 스토어 출시가 확정되는 것은 아니다. 실제 제출·계정 결제·서명 키 관리는 **운영자 게이트**로 남는다.

---

## 왜 지금 `app:check`가 `WAIT`인가

`npm run app:check`는 로컬 준비 파일을 모두 통과시키되, **마지막 한 줄만 `WAIT`**로 남긴다:

```
WAIT public/.well-known/assetlinks.json not generated yet; needs real Android package + SHA-256 fingerprint
app packaging check passed (1 external gate waiting)
```

이 `WAIT`은 **버그가 아니라 의도된 외부 게이트**다. `assetlinks.json`의 지문은 **운영자만 얻을 수 있는 실제 서명 키 값**이라, 그 값이 손에 들어오기 전에는 파일을 만들지 않는다(가짜 지문을 커밋하면 TWA 도메인 검증이 실패해 오히려 주소창이 노출된다). 이 키트를 끝내면 `WAIT`이 사라지고 `passed (0 external gates waiting)`가 된다.

---

## 1단계 — 실제 SHA-256 지문 얻기

**assetlinks에 들어가는 값은 "앱 서명 키(app-signing key)"의 SHA-256 지문**이다. 아래 세 경로 중 상황에 맞는 하나를 쓴다.

### (a) Play App Signing 사용 시 (권장·기본 경로)

Google이 앱 서명 키를 관리하는 경우, Play Console에서 직접 지문을 복사한다.

1. Play Console → **앱 선택**
2. 좌측 **테스트 및 출시(Test and release)** → **설정(Setup)** → **앱 무결성(App integrity)**
3. **앱 서명(App signing)** 섹션
4. **앱 서명 키 인증서(App signing key certificate)** 의 **SHA-256 인증서 지문**을 복사

> ⚠️ 반드시 **앱 서명 키(app-signing key)** 의 지문을 쓴다. 같은 화면의 **업로드 키(upload key)** 지문이 아니다.
> 업로드 키를 넣으면 도메인 검증이 실패해 앱에서 주소창이 그대로 보인다. 헷갈리면 두 값을 모두 메모해두되 assetlinks에는 **앱 서명 키** 값만 넣는다.

### (b) 로컬 keystore를 직접 관리하는 경우

자체 서명 키(.keystore/.jks)를 가지고 있으면 `keytool`로 지문을 출력한다:

```powershell
keytool -list -v -keystore <키스토어 경로> -alias <별칭>
```

출력에서 **`SHA256:`** 로 시작하는 줄의 값을 읽는다(예: `SHA256: AA:BB:CC:...:FF`). `SHA1:`이 아니라 **`SHA256:`** 줄이다. `keytool`은 JDK에 포함돼 있다.

### (c) Bubblewrap / PWABuilder 사용 시

TWA 셸을 Bubblewrap이나 PWABuilder로 만들면, 도구가 서명 과정에서 **동일한 SHA-256 지문을 함께 출력**해준다. 그 값을 그대로 써도 된다(단, 최종적으로 Play가 재서명한다면 (a)의 **Play 앱 서명 키** 값이 최종 기준이다).

---

## 2단계 — 값 정규화(normalize)

생성기가 받는 형식은 **콜론으로 구분된 32개의 16진수 바이트, 대문자**다.

- 총 **32덩어리**(`XX:XX:...:XX`), 각 덩어리는 16진수 2자리.
- **`SHA256:` 접두어 제거**, 앞뒤·중간 **공백 제거**.
- 소문자로 복사됐다면 대문자로 바꾼다(생성기가 자동 대문자화하지만, 눈으로도 맞춰두면 혼동이 없다).

예(형식 예시일 뿐 실값 아님): `AA:BB:CC:DD:EE:FF:00:11:...:99` (콜론 포함 총 32바이트).

---

## 3단계 — assetlinks 생성

먼저 `--dry-run`으로 **파일을 쓰지 않고** 결과 JSON을 미리 본다:

```powershell
npm run app:assetlinks -- --package com.ornscore.app --fingerprint "<실제 SHA-256>" --dry-run
```

출력 JSON이 맞으면(패키지명·지문이 의도대로) `--dry-run` 없이 실제로 생성한다:

```powershell
npm run app:assetlinks -- --package com.ornscore.app --fingerprint "<실제 SHA-256>"
```

- 이때 `public/.well-known/assetlinks.json`이 **실값으로 처음 생성**된다.
- 패키지명은 잠금 기본값 `com.ornscore.app`을 쓴다(다른 값으로 확정했다면 그 값). 패키지명 근거: `docs/ornscore-android-twa-owner-checklist.md` §2.

---

## 4단계 — 검증

### 로컬 게이트

```powershell
npm run app:check
```

- 통과 시 마지막 줄이 `app packaging check passed (0 external gates waiting)`로 바뀐다(유일한 `WAIT` 소멸).
- `FAIL`이 나면 지문 형식(32바이트 콜론 구분) 또는 패키지명을 다시 확인한다.

### 배포 후 운영자 확인(외부·운영자 게이트)

1. 배포 후 `https://ornscore.com/.well-known/assetlinks.json` 이 **200**으로 응답하고, 내용이 방금 생성한 JSON과 **일치**하는지 확인.
2. TWA 빌드에서 앱을 실행했을 때 **주소창이 숨겨지는지**(도메인 검증 통과) 확인.
3. 실기기 standalone 사전 점검은 `docs/app-packaging-readiness.md` §4 절차를 그대로 사용.

---

## 자리표시자 vs 실값 판별 (커밋 전 안전장치)

아래 중 하나라도 해당하면 **그건 실값이 아니다 — 절대 커밋하지 않는다.**

- 지문이 `REPLACE_WITH_REAL_SHA256_FINGERPRINT` 이다 → 예시 템플릿의 자리표시자.
- 지문이 `AB:AB:...:AB` 같은 반복 더미다 → `app:check`가 생성기를 시험할 때 쓰는 가짜 값(32바이트 형식만 맞춘 것).
- 패키지명이 `com.example.ornscore` 이다 → 예시 템플릿의 자리표시자(실 패키지는 `com.ornscore.app`).

**실 지문은 오직 Play Console의 앱 서명 키(app-signing key) 또는 실제 서명 keystore에 대한 `keytool` 출력에서만 나온다.** 그 실값이 손에 들어오기 전까지는 `public/.well-known/assetlinks.json`을 **만들지도, 커밋하지도 않는다.** 예시 파일(`docs/templates/assetlinks.example.json`)은 서빙되지 않는 자리표시자 전용이며 건드리지 않는다.

> 🔒 위 판별 규칙은 이제 **문서로만 남지 않고 코드로 강제된다.** 공통 검증 모듈 `scripts/lib/assetlinks.mjs`가
> 세 판별을 담당하고, 두 곳에서 이를 쓴다:
> - **생성기**(`app:assetlinks`)는 자리표시자·형식오류·**반복 단일바이트 더미(`AB:AB:…` 등)** 지문을 `--dry-run` 포함 **어떤 경우에도 파일로 쓰지 않고 거부**한다.
> - **게이트**(`app:check`)는 커밋된 `public/.well-known/assetlinks.json`이 있으면 단순 문자열이 아니라 **구조·패키지명·지문**을 검사해, 형식만 맞춘 가짜 값(반복 바이트·자리표시자 패키지)도 `FAIL`로 잡는다.
>
> 즉, 실 서명 지문 없이 만든 어떤 assetlinks도 **로컬 게이트를 통과하지 못한다.** 다만 이 자동 검증은 "명백한 가짜"만 걸러내며, 임의의 형식적합 지문이 **실제 서명 인증서인지까지 증명하지는 못한다**(그건 운영자가 Play Console 값으로 대조). 그래서 실값 배치는 여전히 운영자 게이트로 남는다.

---

## 한 걸음 요약 (handoff)

운영자가 **실제 앱 서명 키 SHA-256 지문**을 확보하면:

1. 지문을 위 2단계 형식으로 정규화한다.
2. `npm run app:assetlinks -- --package com.ornscore.app --fingerprint "<실제 SHA-256>"` (먼저 `--dry-run`으로 미리보기).
3. `npm run app:check` → `0 external gates waiting` 확인.
4. 배포 후 `https://ornscore.com/.well-known/assetlinks.json` 200·내용 일치·주소창 숨김 확인.

이것이 Android TWA로 넘어가기 위한 **남은 유일한 실값 게이트**다.
