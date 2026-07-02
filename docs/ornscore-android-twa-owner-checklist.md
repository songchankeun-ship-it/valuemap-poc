# 오른스코어 Android TWA — 운영자 정보 수집(intake) 체크리스트

> 작성: Task 128 (2026-07-02, Claude). 목적은 **다음 한 걸음(Android TWA Play 등재)에 필요한 실제 값만
> 운영자가 채워 넣게 하는 짧은 빈칸 시트**다. 결정 트리·비용·반려 리스크·스토어 문구 초안은
> 이미 다른 문서에 있으므로 **여기서 중복하지 않고 가리킨다.** 아래를 채워 AI에게 돌려주면,
> AI가 `assetlinks.json` 생성 → `app:check` 통과까지 이어서 처리한다.
>
> 관련 문서(중복 작성 회피, 여기서는 가리키기만):
> - 결정 트리·경로별 비용·QA 게이트·반려 리스크·실기기 사전 점검 → `docs/app-packaging-readiness.md`
> - 스토어 등록 문구·개인정보(Data safety/App Privacy) 답변·스크린샷·리뷰 노트 초안 → `docs/app-store-submission-pack.md`
> - AI가 끝낸 것 vs 운영자만 할 수 있는 것 분리표 → `docs/ornscore-owner-final-checklist.md`
> - 실기기 standalone OAuth 복귀 8단계 절차 → `docs/app-roadmap.md` §5-1
>
> 톤 규칙(전 문서 공통): **투자 추천 아님 / 데이터 신선도 고지 유지 / 스토어 출시 미확정은 "미확정"으로만 표기.**
> 이 시트를 채운다고 스토어 출시가 확정되는 것은 아니다. 실제 제출·계정 결제·서명 키 관리는 **운영자 게이트**로 남는다.

---

## 이 문서에서 다루는 것 / 다루지 않는 것

- **다룬다**: Play 등재 다음 단계에 AI가 필요로 하는 6개 입력값을 운영자가 채우는 빈칸.
- **다루지 않는다**: 실제 스토어 제출, Play/Apple 계정 결제, 서명 키 생성, `public/.well-known/assetlinks.json`의 실값 배치.
  이 넷은 실제 package id와 SHA-256 지문이 확보되기 전까지 **손대지 않는다.**

---

## 1. Play Console 계정 준비도

- [ ] Google Play Console 개발자 계정 생성 완료?  → **Y / N**: ______
- [ ] $25 1회 등록비 결제 완료?  → **Y / N**: ______
- [ ] 계정 유형:  → **개인(individual) / 조직(organization)**: ______
- [ ] 신원/조직 인증(verification) 상태:  → ______________________
- 메모: ______________________________________________

## 2. 패키지명(package id) 확정

- 기본값(잠금): `com.ornscore.app`
- [ ] 이 기본값을 그대로 쓴다?  → **Y / N**: ______
- [ ] 다르게 쓴다면 최종 package id:  → `____________________`
- 주의: **한 번 출시하면 package id는 사실상 영구**다(변경하려면 새 앱으로 재등록). Play Console 앱 생성 **직전**에 최종 확인할 것.

## 3. 서명 인증서 SHA-256 지문 (assetlinks 핵심)

> Play App Signing(구글이 앱 서명 키 관리)을 켜면 **assetlinks에 넣어야 하는 값은 "앱 서명 키(app-signing key)"의 지문**이다(업로드 키 지문이 아님).
> 두 값 모두 Play Console → 설정 → 앱 무결성(App integrity) / 앱 서명에서 확인된다. 아래 둘 다 적어두면 혼동을 막는다.
> 형식은 **콜론으로 구분된 32개의 16진수 바이트**(예: `AA:BB:...:99`, 총 32덩어리)여야 생성기가 받는다.

- [ ] Play App Signing 사용?  → **Y(권장·기본) / N**: ______
- 앱 서명 키(app-signing key) SHA-256  ← **assetlinks에 들어갈 값**:
  `________________________________________________________________`
- 업로드 키(upload key) SHA-256 (참고용, assetlinks에는 미사용):
  `________________________________________________________________`
- 메모(어디서 복사했는지 등): ______________________________________

## 4. 스크린샷

- 요구: Play 휴대폰 스크린샷 **2~8장**, 최소 변 **320px 이상**, 비율 **16:9 또는 9:16**(세로 권장).
- [ ] 설치된 standalone/TWA 화면(주소창 없는 상태)에서 캡처?  → **Y / N**: ______  (브라우저 주소창이 보이는 캡처는 지양)
- 캡처 후보 화면은 `docs/app-store-submission-pack.md`의 "스크린샷 후보" 목록과 "스크린샷 제작 지침"을 따른다(문구·금칙어 포함).
- [ ] 캡처 완료 장수:  → ______ 장
- 메모: ______________________________________________

## 5. 스토어 등록 문구 상태

> 초안은 `docs/app-store-submission-pack.md`에 있다(앱 이름·짧은/전체 설명·리뷰 메모·Data safety). 아래는 그 초안이 **Play 제출용 최종본으로 확정됐는지**만 확인한다.

- [ ] 앱 이름 최종 확정?  → **Y / N**: ______
- [ ] 짧은 설명 / 전체 설명 최종 확정?  → **Y / N**: ______
- [ ] 심사 리뷰 메모(로그인 필요 기능 안내·테스트 계정) 확정?  → **Y / N**: ______
- [ ] Data safety 답변을 `/privacy` 위탁 처리 표와 재대조 완료?  → **Y / N**: ______
- 수정이 필요하면 원문서(`app-store-submission-pack.md`)에서 고치고 여기엔 상태만 표기.

## 6. OAuth 콜백 점검

> TWA는 **동일한 웹 오리진(`https://ornscore.com`)을 그대로 재사용**한다. 따라서 **새 콜백 URL은 필요하지 않은 것이 정상**이다(기존 프로덕션 오리진이 이미 커버). 아래는 그 전제를 확인만 한다.

- [ ] Kakao 리다이렉트/콜백 URL이 `https://ornscore.com` 오리진을 이미 커버?  → **Y / N**: ______
- [ ] Google OAuth 승인 리다이렉트 URI가 프로덕션 오리진 커버?  → **Y / N**: ______
- [ ] Naver(`custom:naver`) 콜백이 프로덕션 오리진 커버?  → **Y / N**: ______
- [ ] Supabase Auth redirect/callback 설정이 프로덕션 오리진 커버?  → **Y / N**: ______
- [ ] 실기기 standalone에서 OAuth 복귀 1회 검증 완료?(절차: `docs/app-roadmap.md` §5-1 1~8단계)  → **Y / N**: ______
- 콘솔 설정 위치는 `docs/auth-providers-setup.md` 참조. 새 URL을 추가했다면 무엇을 추가했는지 메모: ______________________

---

## 채운 뒤 — AI에게 돌려줄 다음 동작 (handoff-back)

운영자가 **package id + 실제 앱 서명 키 SHA-256 지문**을 위 3번에 채워 돌려주면, 다음 AI가 실행한다:

```powershell
npm run app:assetlinks -- --package <package id> --fingerprint "<SHA-256>"
npm run app:check
```

- `app:assetlinks`가 `public/.well-known/assetlinks.json`을 실값으로 생성하고, `app:check`의 유일한 `WAIT`(assetlinks 미생성)가 사라져 전부 통과하면 배포 준비가 된 것.
- 그 전까지 `public/.well-known/assetlinks.json`은 **생성하지 않는다**(자리표시자/가짜 지문 배치 금지). 이것이 남은 유일한 운영자 게이트다.
