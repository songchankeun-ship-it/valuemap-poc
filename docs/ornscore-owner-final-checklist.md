# 오른스코어 상용 출시 — 운영자 전용 최종 체크리스트

> 작성: Task 87 (2026-06-27, Claude). 목적은 **AI가 코드로 끝낼 수 있는 일과, 사람(운영자)만 할 수 있는 일을
> 명확히 분리**해, 다음 사람이 채팅 기록 없이도 "남은 건 무엇이고 누가 해야 하는가"를 한 화면에서 보게 하는 것.
> 톤 규칙은 전 화면·전 문서와 동일: **투자 추천 아님 / 데이터 신선도 고지 유지 / 스토어 출시 미확정은 "미확정"으로만 표기.**
>
> 절차가 이미 다른 문서에 있는 항목은 **여기서 재작성하지 않고 가리킨다.**
> - 실기기 standalone 로그인/복귀 8단계 절차 → `docs/app-roadmap.md` §5-1
> - 패키징 경로 결정 트리·비용·반려 리스크·실기기 사전 점검표 → `docs/app-packaging-readiness.md`
> - 스토어 등록 문구·개인정보 답변·스크린샷·리뷰 노트 초안 → `docs/app-store-submission-pack.md`
> - 소셜 로그인 콘솔 설정 → `docs/auth-providers-setup.md`
> - 유료/약관 법무 확정 추적 → `docs/legal-ai-commercial-readiness.md`

---

## A. AI(자동화)가 이미 끝낸 것 — 운영자 작업 아님

이 항목들은 코드/문서로 완료되어 있고, 게이트(tsc·verify_metrics·build·라우트 스모크)로 검증된다. **다시 할 필요 없음.**

- [x] PWA manifest·아이콘(192/512/maskable/apple-touch)·설치 도우미 UX(`PwaInstallHelper`) — Task 72·74·75.
- [x] standalone 로그인 복귀 **코드 측 가드**(`safeInternalPath` open-redirect 차단, `code` 없는 콜백 친절 안내) — Task 76.
- [x] 로그인 제공자 정합성: `/login`(카카오·구글·네이버·이메일)이 `providers.ts`·`/privacy`·`/terms`·`auth-providers-setup.md`와 일치. 네이버는 `custom:naver`로 연결됐고 공개 웹 실로그인 왕복 확인 완료 — Task 70·73·87 + 2026-06-28 Codex 재정리/실동작 확인.
- [x] 상용 문구 보수성: `/pricing`(베타→Pro·가격 미확정), `/about`(스토어 미확정·투자 추천 아님), `/terms`·`/privacy`(현재 정책·국외이전 표) — Task 66·70 외, Task 87 재검증(매수/매도/수익보장 문구 0).
- [x] 패키징 결정 가이드·assetlinks 예시(자리표시자·서빙 안 함) — Task 77.
- [x] 스토어 등록 초안(Play/App Store 설명, 개인정보 답변, 스크린샷 후보, 리뷰 노트) — `docs/app-store-submission-pack.md`.
- [x] 앱 패키징 제출 초안 최신화(2026-07-01): 무료 베타·유료 결제 없음·AI 공개 비노출·Kakao/Google/Naver 로그인 활성 상태와 `privacy` 위탁 처리 표를 맞춤. `npm run app:check`가 이 문서 드리프트를 잡는다.
- [x] 앱 1차 패키징 경로 결정(2026-07-01): **Android TWA 우선**. iOS는 홈 화면 추가 PWA로 유지하고, App Store 정식 래퍼는 Android TWA와 실사용 피드백 이후 검토.

> Task 87 검증 결과: 위 화면 14개 라우트 HTTP 200, `/auth/callback`(code 없음) 307→`auth_callback_no_code`,
> manifest `application/manifest+json`, Metrics 2.4 일치, 금칙어 0. **상용 문구는 보수적이며 추가 수정 불필요로 확인.**

---

## B. 운영자만 할 수 있는 일 — 코드로 대신할 수 없음

AI는 이 항목들을 **만들 수 없다**(실기기·유료 계정·콘솔 시크릿·법무 판단·결제 연동이 필요). 출시 전 사람이 직접 처리한다.

### B-1. 실기기(실제 휴대폰) QA — Playwright 미구성이라 자동화 불가

| # | 점검 | 어디서 / 무엇을 | 깨지면 |
|---|---|---|---|
| 1 | **실기기 설치(install)** | iOS Safari "공유 → 홈 화면에 추가" / Android Chrome "앱 설치" 프롬프트로 실제 설치되는지 | 설치성 회귀 → app-packaging-readiness §4 |
| 2 | **아이콘 품질(icon quality)** | 홈 화면 아이콘 여백/잘림 없음, Android 런처에서 maskable 안전영역 정상 | 아이콘 재생성 `node scripts/generate-icons.mjs` |
| 3 | **standalone 내비게이션** | 주소창 없는 창에서 `/`·`/stocks`·하단 5탭·내부 링크가 **앱 창 안**에서 열림(외부 브라우저로 안 튐) | manifest `scope`/딥링크 보강 |
| 4 | **OAuth 복귀(login return)** | 카카오/구글/네이버/이메일 로그인 후 **앱 컨텍스트로 정확히 복귀** | → **절차: `docs/app-roadmap.md` §5-1 1~8단계** (최대 리스크) |
| 5 | **watchlist 복귀** | `/login?next=/watchlist` 로그인 → watchlist로 복귀, 세션 유지·동기화 동작 | → §5-1 7단계 |
| 6 | **알림 설정(notification settings)** | `/settings/notifications` standalone에서 열리고 골격 정상(실 푸시는 SW/네이티브 의존이라 현재 미지원이 정상) | app-roadmap §5 |
| 7 | **법적/소개 문구(legal·about copy)** | standalone에서도 `/about`·`/privacy`·`/terms`의 "투자 추천 아님"·데이터 신선도·스토어 미확정 고지가 데스크톱과 동일 노출 | 누락 시 해당 페이지 점검 |

> 1·2·3·6·7의 상세는 `docs/app-packaging-readiness.md` §4와 동일 항목이다(중복 작성 회피). 4·5는 §5-1 절차로 수행.

### B-2. 계정·패키징·서명 — 유료/콘솔 (운영자 결정 + 결제)

- [x] **첫 스토어 결정**: Android TWA 우선. iOS 정식 래퍼는 보류.
- [ ] **package id(패키지명)**: 기본값은 `com.ornscore.app`. Play Console 앱 생성 직전 운영자가 최종 확인한다. 현재 예시는 자리표시자 `com.example.ornscore` (`docs/templates/assetlinks.example.json`) — **실값으로 교체 필요**.
- [ ] **서명 SHA-256 지문(signing fingerprint)**: 실제 업로드/앱 서명 키의 SHA-256 지문 확보 → 예시의 `REPLACE_WITH_REAL_SHA256_FINGERPRINT` 교체 → **그 뒤에만** `public/.well-known/assetlinks.json`로 배치(그 전엔 생성 금지). 지문 불일치 시 TWA 주소창 노출, 키 분실 시 업데이트 불가.
- [ ] **개발자 계정 결제**: Google Play Console $25(1회) / Apple Developer $99(연) — 선택한 스토어에 맞춰.
- [x] **네이버 로그인 실동작**: 네이버 Developers 앱 + Supabase Custom OAuth2 provider `custom:naver` + Vercel `NEXT_PUBLIC_ENABLE_NAVER_LOGIN=true` + 공개 웹 로그인 왕복 확인 완료. 남은 것은 실기기 standalone OAuth 복귀 확인.

### B-3. 결제·법무 — 출시 전 확정 (사람/법무)

- [ ] **결제·구독 게이트 연결**: 현재 Pro·Premium은 결제·발송 미연결(`/pricing` 명시). 가격 확정 + 결제 연동은 별도 작업.
- [ ] **유료/약관 법무 확정**: 결제 수단·주기·자동갱신·해지 시점·환불·7일 청약철회·장애 보상 등 `/terms` 「출시 전 확정 필요 항목」 — 추적: `docs/legal-ai-commercial-readiness.md`.
- [ ] **데이터 소스 상용 라이선스 결론**: KRX·DART·Naver·yfinance 유료 전환 시 공식·안정 소스 — `docs/data-source-commercial-risk.md`.
- [ ] **법적/약관/개인정보 최종 승인**: 위 확정 후 운영자/법무가 최종 검토·승인(현재 문구는 보수적 초안·현재 정책 분리 상태).

---

## C. 다음 한 걸음 (권장 순서)

1. **운영자**: B-1 실기기 QA 1회 — 특히 #4 OAuth 복귀(app-roadmap §5-1). 깨지면 콜백 보강을 다음 AI 작업 큐로.
2. **운영자**: Android TWA 진행을 위해 Play Console 등록 → `com.ornscore.app` 최종 확인 → 서명 SHA-256 지문 확보 → 예시 assetlinks를 실값으로 치환·배치.
3. **운영자**: 스토어 등록을 시작하면 `docs/app-store-submission-pack.md`를 콘솔 입력값에 맞게 최종 검토하고 스크린샷을 캡처.
4. **운영자/법무**: B-3 결제·약관·데이터 법무 확정 → 그 뒤 결제 게이트 연결(별도 AI 작업 가능).

> 이 문서는 스토어 출시를 약속하지 않는다. 모든 공개 문구는 PWA "홈 화면에 추가/설치" 표현만 사용하며,
> App Store·Play 스토어 출시 여부는 실제 스토어 작업 착수 전까지 "미확정"으로만 표기한다.
