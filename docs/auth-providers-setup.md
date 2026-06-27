# 소셜 로그인 제공자 설정 체크리스트 (운영자용)

오른스코어는 Supabase Auth를 통해 소셜 로그인을 처리한다. 앱 코드는 제공자
설정(single source)을 `src/lib/auth/providers.ts`에서 관리하고, `/login` 버튼과
약관·개인정보 문구가 이 목록에서 파생된다.

> ⚠️ **비밀값(시크릿)은 절대 이 저장소에 커밋하지 않는다.** 아래는 전부 자리표시자다.
> 실제 Client ID/Secret/Key는 Supabase 대시보드와 각 제공자 콘솔에만 입력한다.

## 현재 상태 요약

| 제공자 | 패키지 지원 | 앱 노출(`enabled`) | 운영자 콘솔 작업 |
|---|---|---|---|
| Kakao | ✅ | ✅ (운영 중) | 완료 (이미 연결됨) |
| Google | ✅ | ✅ | ✅ 완료 — 2026-06-28 운영자 콘솔 설정 + 실로그인 확인 |
| Apple | ✅ (타입 지원) | ❌ (의도적 비활성) | 보류 — Apple Developer Program 가입 후 결정 |
| Naver | ❌ (네이티브 미지원) | ⏳ "준비 중"(비활성 노출) | 아래 "Naver" 섹션의 (A)/(B) 중 하나 선행 필요 |

`enabled` 플래그를 켜기 전이라도 버튼이 보이는 제공자는, Supabase 콘솔 토글이
꺼져 있으면 클릭 시 `provider is not enabled` 오류가 난다. 이 오류는 사용자에게
한국어 안내("현재 이 로그인 방식은 준비 중이에요...")로 graceful 처리되므로,
콘솔 설정 전이라도 앱이 깨지지 않는다. **다만 정식 노출 전에는 아래 콘솔 작업을
완료해 실제로 동작하게 만들어야 한다.**

## 공통 (모든 제공자)

1. Supabase 대시보드 → **Authentication → Providers** 진입.
2. **Redirect URL** 등록 (Supabase가 발급하는 콜백 + 앱 콜백):
   - 운영: `https://ornscore.com/auth/callback`
   - 로컬: `http://localhost:3000/auth/callback`
   - Supabase가 안내하는 제공자용 콜백: `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
3. 각 제공자 콘솔에서 발급한 **Client ID / Client Secret**을 Supabase Provider 설정에 입력.
4. 제공자 토글을 **Enabled**로 전환 후 저장.

## Kakao (이미 연결됨 — 참고용)

- Kakao Developers → 내 애플리케이션 → 카카오 로그인 활성화.
- Redirect URI에 위 공통 콜백 등록.
- REST API 키 = `<KAKAO_REST_API_KEY>`, Client Secret = `<KAKAO_CLIENT_SECRET>`.
- 동의 항목: 닉네임/프로필(선택), 카카오계정 이메일(선택).

## Google

> 상태: **완료(2026-06-28)**. 운영자가 Google Cloud OAuth Client와 Supabase Google Provider 설정을 마치고,
> `https://ornscore.com/login`에서 실제 Google 로그인 왕복이 정상 동작함을 확인했다.

1. [Google Cloud Console](https://console.cloud.google.com/) → 프로젝트 생성/선택.
2. **APIs & Services → OAuth consent screen** 구성 (앱 이름·지원 이메일·도메인).
3. **APIs & Services → Credentials → Create OAuth client ID** → Application type: **Web application**.
   - Authorized redirect URI: `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
4. 발급된 값:
   - Client ID = `<GOOGLE_CLIENT_ID>`
   - Client Secret = `<GOOGLE_CLIENT_SECRET>`
5. Supabase → Authentication → Providers → **Google**에 위 값 입력 후 Enabled.
6. 확인: `/login`에서 "구글로 시작하기" 클릭 → 구글 동의 화면 → `/auth/callback?next=...` 복귀.

## Apple (의도적 보류 — 결정 기록)

**현재 앱에서 비활성(`enabled: false`)이다.** 사유:

- Apple Sign In은 **Apple Developer Program 유료 가입($99/년)**과 Service ID·Key 발급이
  선행돼야 한다.
- 오른스코어는 현재 웹(한국 주식) 중심이며 iOS/macOS 네이티브 앱이 없어 Apple
  로그인의 실효 수요가 낮다 (Apple 로그인은 주로 iOS/macOS 사용자층에서 가치가 크다).
- 구현 자체는 `src/lib/auth/providers.ts`에 완비돼 있다. iOS 앱 출시 등 수요가 생기면
  아래 절차 후 `enabled: true` 한 줄로 활성화된다.

활성화 절차(필요 시):

1. Apple Developer Program 가입.
2. Certificates, Identifiers & Profiles → **Identifiers**에서 App ID + **Services ID**(`<APPLE_SERVICES_ID>`) 생성.
3. **Keys**에서 Sign in with Apple용 Key 생성 → `<APPLE_KEY_ID>`, 다운로드한 `.p8` 비공개 키 보관.
4. Team ID = `<APPLE_TEAM_ID>`. Return URL에 Supabase 콜백 등록.
5. Supabase → Authentication → Providers → **Apple**에 Services ID·Team ID·Key ID·Secret(JWT) 입력 후 Enabled.
6. `src/lib/auth/providers.ts`의 apple 항목 `enabled: false` → `true`로 변경, 약관/개인정보 문구에 Apple 추가.

## Naver (현재 "준비 중" 비활성 노출 — 가짜로 만들지 않음)

- 설치된 `@supabase/auth-js`(2.107.0)의 `Provider` 유니온에 **`naver`가 없다.**
  즉 `signInWithOAuth({ provider: "naver" })`는 타입·런타임 모두 불가.
- **현재 앱 동작(Task 73)**: `/login`에 **"네이버 (준비 중)" 비활성 항목**만 노출한다.
  - `src/lib/auth/providers.ts`의 `PLANNED_PROVIDERS`(id=`"naver"`)에서 파생된다.
    이 id는 **의도적으로 `OAuthProviderId`(=`kakao|google|apple`)가 아니므로**
    `signInWithOAuth`에 넘기면 tsc가 막는다 → **가짜 세션 경로가 컴파일 단계에서 차단**된다.
  - 버튼이 아니라 `aria-disabled`·`cursor-not-allowed` `<div>`로 렌더되며 **onClick·인증 호출이 없다.**
  - `leadCopy`(상단 안내 문구)는 활성 제공자만으로 파생되므로 **네이버를 "사용 가능"으로 광고하지 않는다.**
  - 약관·개인정보의 활성 데이터 처리자 목록(카카오·구글)에도 **네이버를 넣지 않는다**
    (실제 데이터를 받지 않으므로). 진짜로 동작하게 만든 뒤에 처리자로 추가한다.
- **실제 로그인을 켜려면 둘 중 한 경로의 운영자 설정이 선행돼야 한다:**

### (A) 앱 자체 OAuth 라우트 (App-owned route)

네이버 로그인 API를 직접 호출하는 서버 라우트를 구현하는 경로. 운영자/개발자가 함께 준비할 것:

1. **네이버 Developers 앱 등록** — <https://developers.naver.com/> → 애플리케이션 등록 →
   "네이버 로그인" 사용 API 추가. 서비스 URL과 **Callback URL** 등록:
   - 운영: `https://ornscore.com/auth/naver/callback`
   - 로컬: `http://localhost:3000/auth/naver/callback`
   (실제 라우트 경로는 구현 시 확정. 위는 권장 예시.)
2. **운영자 전용 시크릿(소스/클라이언트에 절대 노출 금지)** — Supabase/Vercel **환경변수에만** 입력:
   - `NAVER_CLIENT_ID`
   - `NAVER_CLIENT_SECRET`
   (이 저장소·번들에 하드코딩 금지. 서버 라우트에서만 `process.env`로 읽는다.)
3. **서버 라우트 2개 구현(설계 필요)**:
   - `start` 라우트: `state`(CSRF 방지 난수)+nonce 생성 → HttpOnly 쿠키에 저장 →
     사용자가 가려던 곳을 보존하는 `next`를 `state`에 함께 묶고 네이버 인가 URL로 redirect.
   - `callback` 라우트: 돌아온 `state`를 쿠키와 **대조 검증**(불일치면 거부) → 인가 코드를
     `NAVER_CLIENT_SECRET`으로 토큰 교환 → 네이버 프로필 조회.
4. **세션 발급(핵심 선결 과제)**: 네이버 프로필만으로는 Supabase 세션이 생기지 않는다.
   네이버 사용자를 Supabase 사용자에 연결해 **실제 세션을 발급**하는 설계가 필요하다
   (예: 서버에서 service-role 키로 사용자 조회/생성 후 세션/매직링크 발급).
   이 세션 발급 설계가 끝나기 전에는 **로그인을 활성화하지 않는다.** 검증된 `next`로만 복귀시킨다.

### (B) Supabase 커스텀 OIDC/SAML (`custom:*`)

- Supabase **Pro/Enterprise 플랜**에서 제공되는 **Custom Provider(OIDC/SAML)** 콘솔 구성으로
  네이버를 OIDC 제공자로 연결하는 경로. 플랜 업그레이드(유료)와 콘솔 설정이 선행된다.
- 플랜·콘솔 구성이 끝나면 앱 측은 `signInWithSSO`/커스텀 provider 흐름으로 연결한다
  (현재 `@supabase/auth-js` 2.107.0 네이티브 `signInWithOAuth({provider:"naver"})`로는 불가).

> **결론:** (A) 또는 (B) 중 한 경로의 **운영자 측 설정(네이버 콘솔 자격증명 및/또는 Supabase 플랜)이
> 완료되기 전까지 네이버는 "준비 중" 비활성 상태로 유지**하며, 어떤 가짜 세션도 만들지 않는다.
> 본 작업 범위(신규 npm 의존성·유료 서비스 금지)에서는 (A)의 세션 발급 설계·(B)의 플랜 모두
> 범위 밖이므로, 운영자 설정이 준비되면 별도 작업으로 진행한다.

## Phone / SMS 로그인 (보류)

- Supabase는 SMS OTP를 지원하지만, **외부 SMS 게이트웨이(Twilio 등) 연동과 비용**이
  필요하고 현재 구성돼 있지 않다.
- 저위험·무비용 경로가 없으므로 **보류**. 현재 매직링크/소셜 로그인으로 충분.

## 점검 (콘솔 설정 후)

- `/login`에서 활성 제공자 버튼이 모두 보이는지.
- 각 버튼 클릭 시 제공자 동의 화면으로 이동 → 로그인 후 `/auth/callback?next=<원래 목적지>`로 복귀하는지.
- 콘솔 토글 OFF 상태에서 클릭 시 빨간 박스에 "현재 이 로그인 방식은 준비 중이에요..."가 뜨는지.
- `/privacy`·`/terms`의 소셜 로그인 제공자 표기가 실제 노출 버튼과 일치하는지(활성=카카오·구글).
- `/login`의 **"네이버 (준비 중)" 항목이 비활성**(클릭 불가·인증 호출 없음)으로만 보이는지.
