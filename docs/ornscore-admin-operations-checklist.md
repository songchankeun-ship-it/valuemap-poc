# 오른스코어 관리자 운영 체크리스트 (운영자 전용)

> 작성: 2026-07-14 (AI Center task 250, [codex]). 목적은 사이트 **운영자**가 채팅 기록 없이도
> "관리자 화면이 어떻게 보호되는가 / 무엇을 설정해야 하는가 / 시크릿을 노출하지 않고 접근을 어떻게 확인하는가 /
> 남은 건 무엇인가"를 한 화면에서 보게 하는 것.
> 이 문서는 **설정을 바꾸지 않는다** — 실제 환경변수 값·시크릿은 운영자가 Vercel 콘솔에서만 다룬다.
>
> 관련 문서(중복 재작성 회피, 여기서는 가리키기만):
> - 상태판 MVP 범위·후속 백로그·`data_reports` SQL → `docs/ornscore-admin-status-backlog.md`
> - 라우트 스모크/로컬 검증 진입점 → `docs/ornscore-route-smoke-checklist.md`
> - 소셜 로그인 콘솔 설정 → `docs/auth-providers-setup.md`
> - 출시 전 운영자 게이트 전체 → `docs/ornscore-owner-final-checklist.md` §B

---

## 1. 관리자 화면과 보호 방식

관리자 라우트는 3개이며, 모두 **검색 비노출(noindex)** + **로그인 세션 + 이메일 allowlist**로 보호된다.

| 라우트 | 파일 | 무엇을 보여주나 |
|---|---|---|
| `/admin` | `src/app/admin/page.tsx` | 운영 홈 — 데이터 기준일·산식 일치·가격 지연·상태 이력·배포 검증·외부 도구 링크 |
| `/admin/users` | `src/app/admin/users/page.tsx` | 가입자/로그인 활동·출시 대기 신청·저장 기능 사용량 (Supabase Auth + service role) |
| `/admin/status` | `src/app/admin/status/page.tsx` | 데이터 상태판 — 검증 보류·재무 결측·데이터 오류 신고(`data_reports`) |

보호는 **이중(defense-in-depth)** 이다:

1. **미들웨어 게이트** (`src/middleware.ts`) — 모든 `/admin`·`/admin/*` 요청에 먼저 적용.
   - 로그인 세션 없음 → `/login?next=<원래경로>`로 **307 리다이렉트**.
   - 로그인했지만 allowlist에 없는 이메일 → **403 Forbidden**(`x-robots-tag: noindex, nofollow`, `cache-control: private, no-store`).
   - 세션 판별은 Supabase 익명 키(`NEXT_PUBLIC_SUPABASE_ANON_KEY`) 쿠키로만 하고, service role 키는 미들웨어에서 쓰지 않는다.
2. **페이지 서버 가드** (`requireAdminAccess`, `src/lib/adminAccess.ts`) — 각 관리자 서버 컴포넌트가 다시 호출.
   - 이메일 없음 → 로그인으로 리다이렉트. allowlist 밖 → "접근 권한이 없습니다" 화면 렌더(데이터 조회 안 함).
   - 미들웨어가 우회되더라도 페이지가 스스로 한 번 더 막는다.

민감 데이터(가입자 목록·신고 내용)는 **서버에서만** service role로 읽고, 공개 화면이나 클라이언트 번들에는 목록도 키도 나가지 않는다(`createAdminClient()` 는 서버 전용).

---

## 2. 필요한 런타임 환경변수 (Vercel)

값은 **콘솔에서만** 설정하고, 코드·문서·로그에 실제 값을 넣지 않는다.

| 이름 | 역할 | 없으면 |
|---|---|---|
| `ADMIN_EMAILS` | 관리자 허용 이메일 목록(쉼표/공백 구분, 대소문자 무시). 별칭 `ORNSCORE_ADMIN_EMAILS` 도 인식. | 미설정 시 기본 allowlist `contact@ornscore.com` 하나만 허용(`FALLBACK_ADMIN_EMAILS`). |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL. 세션 판별과 service role 조회 양쪽에서 사용. | 미들웨어/페이지가 세션을 못 읽고, `/admin/users`·신고 목록이 env 오류 안내로 대체. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 미들웨어·서버가 로그인 세션 쿠키를 읽는 익명 키. | 로그인 세션 판별 불가 → 관리자 접근 자체가 막힘. |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 service role — 가입자·저장 기능·신고 목록을 RLS 우회로 조회. **절대 클라이언트/브라우저 노출 금지.** | `/admin/users`·신고 목록이 "service role 환경변수 설정 후 조회" 안내로 graceful 대체(페이지는 안 깨짐). |
| `ADMIN_ENABLED` | `1`일 때만 `/admin/status`가 `data_reports`(신고 개인정보) 목록을 조회. **페이지 접근 보호와는 별개.** | 미설정/`1`아님 → 신고 목록 비표시 안내만(접근 보호에는 영향 없음). |

> 참고: `NEXT_PUBLIC_*` 접두사 변수는 브라우저에 노출되는 것이 **정상**(공개용 익명 키·URL). 비밀은 `SUPABASE_SERVICE_ROLE_KEY` 뿐이며 이 값은 `NEXT_PUBLIC_` 접두사를 붙이지 않는다.

---

## 3. 시크릿을 노출하지 않고 접근을 확인하는 법

목표: 실제 키를 보지 않고 "허용 계정만 들어오고, 그 외에는 막힌다"만 확인.

1. **비로그인 차단**: 로그아웃 상태에서 `/admin`·`/admin/users`·`/admin/status` 접근 → 각각 `/login?next=...`로 리다이렉트되는지. (로컬 검증에서 `/admin/users`는 `307 → /login?next=%2Fadmin%2Fusers` 확인됨.)
2. **비허용 계정 차단**: allowlist에 없는 계정으로 로그인 후 접근 → 미들웨어 **403 Forbidden** 또는 "접근 권한이 없습니다" 화면. 이때 화면에 표시되는 것은 **로그인 이메일**뿐이고 어떤 키도 나오지 않는다.
3. **허용 계정 통과**: `ADMIN_EMAILS`에 넣은(또는 기본 `contact@ornscore.com`) 계정으로 로그인 후 세 화면이 정상 렌더되는지.
4. **키 비노출 확인**: 관리자 페이지의 **페이지 소스/네트워크 응답·클라이언트 번들**에 `service_role`·JWT·이메일 목록이 없는지. service role 조회는 서버에서 끝나고 결과 수치·목록만 HTML로 내려온다.
5. **콘솔에서 값 자체를 확인**하려면 Vercel 프로젝트 환경변수 화면에서 (값을 화면에 펼치지 않고) **존재 여부**만 본다. 값을 복사·붙여넣기하거나 로그로 출력하지 않는다.

> 실제 OAuth 왕복(카카오/구글/네이버/이메일 링크)까지 포함한 로그인 흐름 검증은 아래 §4 운영자 게이트로 남는다.

---

## 4. 여전히 운영자 게이트로 남는 항목

코드/로컬 검증으로 대신할 수 없어 운영자가 직접 처리한다(정본은 `ornscore-owner-final-checklist.md` §B).

- **Vercel 환경변수 실제 설정**: `ADMIN_EMAILS`에 운영 계정 명시, `SUPABASE_SERVICE_ROLE_KEY` 등록·회전은 운영자만.
- **실 OAuth 왕복 로그인**으로 허용/비허용 접근을 프로덕션에서 최종 확인(Playwright 미구성이라 자동화 불가).
- **Supabase 스키마/RLS/테이블**: `data_reports`·`waitlist`·저장 기능 테이블 생성·정책은 운영자 DB 작업(§ 백로그 SQL 참조).
- **신고 개인정보 노출 결정**: `ADMIN_ENABLED=1` 로 신고 목록(이메일 포함)을 켤지 여부는 운영자 개인정보 판단.
- **관리자 계정 관리**: allowlist 추가/제거, service role 키 회전·폐기.
- **익명 방문·페이지뷰 통계**: 현재 Vercel Analytics가 원본. 관리자 화면에 넣으려면 별도 이벤트 테이블/정책 설계 승인 필요(백로그).

---

## 5. 관련 문서

- `docs/ornscore-admin-status-backlog.md` — 상태판 MVP 범위·후속 인프라 백로그·`data_reports` SQL.
- `docs/ornscore-owner-final-checklist.md` — 출시 전 운영자 전용 게이트 전체(§B).
- `docs/auth-providers-setup.md` — 소셜 로그인 콘솔 설정.
- `docs/ornscore-route-smoke-checklist.md` — 로컬 라우트/로그인 SSR 검증 진입점(`npm run verify:local`).
