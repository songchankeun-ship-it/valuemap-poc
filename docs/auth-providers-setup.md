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
| Naver | ✅ (`custom:naver`) / ❌ (네이티브 `naver`) | ✅ | ✅ 완료 — 2026-06-28 네이버 Developers + Supabase Custom OAuth2 + Vercel env + 실로그인 확인 |

`enabled` 플래그를 켜기 전이라도 버튼이 보이는 제공자는, Supabase 콘솔 토글이
꺼져 있으면 클릭 시 `provider is not enabled` 오류가 난다. 이 오류는 사용자에게
한국어 안내("현재 이 로그인 방식은 설정 중이에요...")로 graceful 처리되므로,
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

## Naver

`@supabase/auth-js`에는 네이티브 provider 이름 `naver`가 없지만, 현재 SDK 타입에는
`custom:${string}` provider가 포함되어 있다. 오른스코어는 **Supabase Custom OAuth2 provider
`custom:naver`** 로 네이버 로그인을 연결한다.

> 상태: **완료(2026-06-28)**. 운영자가 네이버 Developers 앱, Supabase Custom OAuth2 provider,
> Vercel `NEXT_PUBLIC_ENABLE_NAVER_LOGIN=true` 설정을 마쳤고, 공개 사이트에서 실제 네이버 로그인
> 왕복이 동작함을 확인했다.

### 설정 기록: Supabase Custom OAuth2 Provider

공식 Supabase Custom OAuth/OIDC Providers 문서 기준, Free plan 프로젝트도 custom provider 3개까지
추가할 수 있고, OAuth2 provider는 Authorization URL / Token URL / UserInfo URL을 수동 입력한다.

1. **네이버 Developers 앱 등록** — <https://developers.naver.com/> → 애플리케이션 등록 →
   "네이버 로그인" 사용 API 추가.
2. **Supabase Dashboard → Authentication → Providers → Custom OAuth Providers → New Provider**.
3. Provider identifier는 **`custom:naver`** 로 만든다.
4. Supabase 생성 화면의 read-only **Callback URL**을 복사한다.
5. 네이버 Developers 앱의 Callback URL에 위 Supabase Callback URL을 등록한다.
   - 운영 사이트의 최종 복귀는 앱 코드의 `redirectTo`가 담당한다:
     `https://ornscore.com/auth/callback?next=...`
   - 네이버 콘솔에는 앱 콜백이 아니라 **Supabase가 보여준 Callback URL**을 넣는다.
6. Supabase Custom OAuth2 설정값:
   - Client ID / Secret: 네이버 Developers에서 발급받은 값
   - Authorization URL: `https://nid.naver.com/oauth2.0/authorize`
   - Token URL: `https://nid.naver.com/oauth2.0/token`
   - UserInfo URL: `https://openapi.naver.com/v1/nid/me`
7. 이메일 제공 동의가 필요하다. 네이버 프로필 API는 `response.email`을 반환하므로,
   네이버 앱 권한에서 이메일 제공을 켜고 실제 동의 화면에 노출되는지 확인한다.
8. Supabase provider 저장/enable 후, Vercel 환경변수에
   `NEXT_PUBLIC_ENABLE_NAVER_LOGIN=true` 를 추가하고 재배포한다.
9. `/login`에서 "네이버로 시작하기" 클릭 → 네이버 동의 → `/auth/callback?next=...` 복귀 →
   사용자 세션 생성 여부를 확인한다.

### 검증 리스크

네이버 UserInfo 응답은 표준 OIDC처럼 `sub`/`email`이 최상위에 있는 형태가 아니라
`response.id`, `response.email`처럼 중첩되어 있다. Supabase Custom OAuth2 콘솔이 이 응답을
정상 사용자 정보로 처리하는지는 실제 저장/로그인 왕복으로 검증해야 한다.

- 현재 공개 웹 로그인 왕복은 성공 확인됨. 다만 홈 화면 추가/standalone 앱 컨텍스트에서 네이버 복귀는
  `docs/app-roadmap.md` §5-1 절차로 별도 실기기 확인이 필요하다.
- 실패 회귀가 발생하면: `NEXT_PUBLIC_ENABLE_NAVER_LOGIN`을 끄고 비활성 항목으로 되돌린 뒤,
  앱 자체 `/auth/naver/start` + `/auth/naver/callback` 어댑터 라우트 설계를 별도 작업으로 진행한다.

## Phone / SMS 로그인 (보류)

- Supabase는 SMS OTP를 지원하지만, **외부 SMS 게이트웨이(Twilio 등) 연동과 비용**이
  필요하고 현재 구성돼 있지 않다.
- 저위험·무비용 경로가 없으므로 **보류**. 현재 매직링크/소셜 로그인으로 충분.

## 점검 (콘솔 설정 후)

- `/login`에서 활성 제공자 버튼이 모두 보이는지.
- 각 버튼 클릭 시 제공자 동의 화면으로 이동 → 로그인 후 `/auth/callback?next=<원래 목적지>`로 복귀하는지.
- 콘솔 토글 OFF 상태에서 클릭 시 빨간 박스에 "현재 이 로그인 방식은 설정 중이에요..."가 뜨는지.
- `/privacy`·`/terms`의 소셜 로그인 제공자 표기가 실제 노출 버튼과 일치하는지(활성=카카오·구글·네이버).
- `NEXT_PUBLIC_ENABLE_NAVER_LOGIN`이 true인 배포에서 `/login`의 **"네이버로 시작하기" 버튼이 활성**으로 보이고, false인 배포에서는 "네이버 (설정 필요)" 비활성 항목만 보이는지.
