# 오른스코어 스토어 제출 준비 패키지

마지막 갱신: 2026-07-12

## 목적

이 문서는 Play Store나 App Store로 넘어갈 때 바로 복사·검토할 수 있는 등록 자료 초안이다. 아직 스토어 출시를 공개 약속하지 않는다. 2026-07-01 제품 결정 기준으로 1차 스토어 경로는 **Android TWA**이며, iOS 정식 래퍼는 Android TWA와 실사용 피드백 이후 검토한다.

Google Play에 바로 입력할 필드별 워크시트는 `docs/google-play-listing-worksheet-2026-07-12.md`를 우선 본다. 스토어 시각 자산 캡처 초안과 남은 feature graphic/Apple/manifest 게이트는 `docs/ornscore-store-visual-assets-pack-2026-07-12.md`를 본다. 이 문서는 Play/App Store 공통 배경과 리스크 정리용으로 유지한다.

공식 참고(2026-07-01 재확인):

- [Google Play Console Help — preview assets](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en): feature graphic, screenshots, short description, videos.
- [Google Play Console Help — Data safety form](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en): 앱 개인정보·보안 관행 제출.
- [Google Play Console Help — prepare your app for review](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en): 개인정보처리방침과 리뷰 준비.
- [Apple App Store Connect Help — screenshots/app previews](https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots/).
- [Apple App Privacy details](https://developer.apple.com/app-store/app-privacy-details/) and [App Store Connect App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/).
- [Apple App Review](https://developer.apple.com/distribute/app-review/): 로그인 기능이 있으면 리뷰용 계정/설정 정보를 제공해야 한다.
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/): 특히 4.2 Minimum Functionality는 iOS 단순 웹 래퍼 리스크 확인용.

## 공통 서비스 사실

- 앱/서비스명: 오른스코어
- 긴 이름: 오른스코어 — 한국 주식 탐색 도구
- 웹 URL: `https://ornscore.com`
- 개인정보처리방침: `https://ornscore.com/privacy`
- 계정 및 데이터 삭제 요청: `https://ornscore.com/data-deletion`
- 이용약관: `https://ornscore.com/terms`
- 문의: `contact@ornscore.com` (현 라이브 사이트 전 페이지·`src/lib/dataStatus.ts`가 쓰는 대표 수신 주소). 리뷰에서 `support@ornscore.com`으로의 통일을 제안했으나, 저장소에 다른 대표 메일함 근거가 없으므로 오너가 새 메일함을 개설·리다이렉트하기 전까지 `contact@`를 그대로 유지한다.
- 카테고리 후보: Finance
- 로그인 방식: 이메일 매직링크, Kakao, Google, Naver.
- 서비스 성격: 한국 주식 데이터 탐색 도구. 투자 추천, 매수·매도 권유, 투자자문, 거래 체결 기능 없음.
- 데이터 출처: KRX, DART, Naver Finance, yfinance 등 공개 데이터. 데이터 기준일과 한계는 서비스 내 고지.
- 결제 상태: 현재 유료 결제 없음. 스토어 등록 문구에는 확정 가격·자동갱신 구독·Pro/Premium 가격을 쓰지 않는다.

## Google Play 등록 초안

### 앱 이름

오른스코어

### 짧은 설명

한국 주식 후보를 점수·공시·재무 지표로 빠르게 좁히는 탐색 도구

### 전체 설명

오른스코어는 한국 개인 투자자가 오늘 어떤 종목부터 살펴볼지 빠르게 좁힐 수 있도록 돕는 데이터 기반 주식 탐색 도구입니다.

추세, 거래활성도, 밸류, 위험조정 네 가지 자체 지표와 PER, PBR, ROE, 배당수익률, DART 공시 신호를 한 화면에서 함께 볼 수 있습니다. 종목 상세에서는 점수 근거, 데이터 품질, 공시 링크, 업종 비교, 관심 종목 저장을 확인할 수 있습니다.

주요 기능:

- 오늘의 후보 종목과 시장 브리핑
- 종목 탐색, 필터, 비교
- 종목별 점수 근거와 초보자 해석
- DART 공시 신호와 원문 링크
- 관심 종목 저장과 로그인 기반 동기화
- 데이터 기준일, 산식 버전, 데이터 한계 공개

오른스코어는 투자 추천이나 매수·매도 권유를 제공하지 않습니다. 모든 점수와 신호는 공개 데이터와 자체 산식에 따른 참고 정보이며, 최종 투자 판단과 책임은 사용자 본인에게 있습니다.

### 스크린샷 후보

- `https://ornscore.com/` — 오늘의 후보와 데이터 기준일
- `https://ornscore.com/stocks` — 종목 탐색/필터
- `https://ornscore.com/stock/005930` — 종목 상세, 점수 근거, 데이터 품질
- `https://ornscore.com/disclosures` — 공시 신호
- `https://ornscore.com/compare` — 종목 비교 시작 화면
- `https://ornscore.com/watchlist` — 관심 종목
- `https://ornscore.com/about` — 앱처럼 설치하기와 서비스 성격

### 심사 메모 초안

오른스코어는 한국 주식 공개 데이터를 탐색하는 도구이며, 투자 추천·거래·금융상품 판매를 제공하지 않습니다. 로그인 없이도 주요 탐색 화면을 볼 수 있고, 관심 종목 저장·동기화 등 일부 기능은 이메일 매직링크 또는 소셜 로그인이 필요합니다. 실제 결제 기능은 제공하지 않습니다.

### Google Play Data safety 초안

> **오너 전용(계정 콘솔 답변).** 아래 항목은 Play Console의 Data safety 질문 문항에 **오너가 직접** 답해야 하며, 에이전트가 대신 제출·확정하지 않는다. 실제 수집 항목·외부 처리자와 일치하는지 최종 제출 전 오너가 재확인한다.

- 수집 데이터 후보: 이메일 주소, 이름/닉네임, 프로필 사진(소셜 제공자가 전달하는 경우), 소셜 로그인 식별자, 관심 종목, 비교 목록, 알림 설정, 접속 정보.
- 사용 목적: 계정 관리, 로그인, 관심 종목 동기화, 알림 발송, 서비스 품질 개선.
- 공유/위탁 후보: Supabase, Vercel, Resend, Kakao, Google, Naver. `https://ornscore.com/privacy`의 위탁 처리 표와 일치해야 한다.
- 결제 정보: 현재 앱 내 결제 없음.
- 광고/추적: 현재 광고성 추적 목적 없음으로 운영자가 확인.
- 삭제 요청: 회원 탈퇴/삭제 요청은 `https://ornscore.com/data-deletion` 또는 `contact@ornscore.com`으로 처리. Play Console의 공개 데이터 삭제 URL에는 `https://ornscore.com/data-deletion`을 사용한다.
- 주의: 공개 베타에서는 AI 분석 기능을 전면에 노출하지 않는다. AI 기능을 다시 공개하면 `privacy`와 Data safety/App Privacy 답변에 AI 처리 제공자와 보관 항목을 복구해야 한다.

## App Store 등록 초안

### 앱 이름

오른스코어

### 부제 후보

한국 주식 데이터 탐색 도구

### 설명

오른스코어는 한국 주식 후보를 여러 데이터 관점으로 빠르게 좁혀 보는 탐색 도구입니다.

추세, 거래활성도, 밸류, 위험조정 네 가지 자체 지표와 PER, PBR, ROE, 배당수익률, DART 공시 신호를 한 화면에서 제공합니다. 종목 상세에서는 점수 근거, 공시 원문, 업종 비교, 데이터 품질 상태를 함께 확인할 수 있습니다.

주요 기능:

- 오늘의 후보 종목과 시장 브리핑
- 종목 탐색, 필터, 비교
- 종목 상세 점수 근거와 초보자 해석
- DART 공시 신호와 원문 링크
- 관심 종목 저장과 로그인 기반 동기화
- 데이터 기준일과 산식 버전 공개

오른스코어는 투자 추천, 매수·매도 권유, 투자자문, 거래 기능을 제공하지 않습니다. 모든 정보는 참고용이며, 최종 투자 판단과 책임은 사용자 본인에게 있습니다.

### 키워드 후보

주식,한국주식,공시,DART,PER,PBR,ROE,관심종목,종목분석,투자도구

### 리뷰 노트 초안

이 앱은 한국 주식 공개 데이터를 탐색하는 도구입니다. 매수·매도 추천, 투자자문, 거래 체결, 유료 결제 기능은 제공하지 않습니다.

로그인 없이도 홈, 종목 탐색, 종목 상세, 공시, 비교, 소개, 개인정보/약관 화면을 확인할 수 있습니다. 관심 종목 동기화 등 일부 기능은 이메일 매직링크 또는 소셜 로그인이 필요합니다. 리뷰 중 로그인이 필요한 경우 운영자가 별도 테스트 계정을 제공합니다.

### App Privacy 답변 초안

> **오너 전용(계정 콘솔 답변).** 아래 항목은 App Store Connect의 App Privacy 질문 문항에 **오너가 직접** 답해야 하며, 에이전트가 대신 제출·확정하지 않는다. 실제 수집 항목·외부 처리자와 일치하는지 최종 제출 전 오너가 재확인한다.

- Contact Info: 이메일 주소, 이름/닉네임. 로그인·계정 식별·알림 발송 목적.
- User Content 또는 Other User Content 후보: 관심 종목, 비교 목록, 알림 설정. 사용자 계정 기능 제공 목적.
- Identifiers: 소셜 로그인 제공자 계정 식별자, Supabase 사용자 ID.
- Usage Data: 접속 정보와 익명 통계. 서비스 품질 개선 목적.
- Diagnostics 후보: IP, 브라우저 정보, 오류/접속 로그가 분석 제공자에 남을 수 있음.
- Tracking: 현재 광고 추적 목적 사용 없음으로 운영자가 확인.
- Third-party partners: Supabase, Vercel, Resend, Kakao, Google, Naver.

## 스크린샷·에셋 지침 (오너/디자인 게이트)

> **오너/디자인 전용.** 아래 캡처·이미지 제작은 실기기·디자인 산출물이 필요한 오너/디자인 게이트이며, 로컬 코드 작업으로는 닫을 수 없다. 자산이 없다고 가짜 이미지를 만들어 채우지 않는다.

캡처 규칙:

- 모바일 우선. 주소창이 보이는 브라우저 캡처보다 홈 화면 설치 후 standalone 또는 TWA 화면이 더 적합하다.
- 텍스트가 잘리지 않는 세로(portrait) 화면으로 캡처한다.
- 금융 수익 보장처럼 보이는 문구를 넣지 않는다.
- 스크린샷 내 주요 문구는 “탐색”, “점수 근거”, “공시 신호”, “데이터 기준일”, “투자 추천 아님” 중심으로 둔다.
- 실제 스토어 출시가 확정되기 전에는 App Store/Play Store 배지를 공개 이미지에 넣지 않는다(현재 스토어 미출시).

현재 로컬 캡처 초안:

- `docs/ornscore-store-visual-assets-pack-2026-07-12.md`
- `docs/store-assets/2026-07-12/google-play-draft/`
- 6장 JPEG 초안은 Google Play 기본 스크린샷 형식/치수/용량 검사를 통과했다. 단, 고해상도 추천 노출 자격과 Apple App Store Connect 업로드용 최종 자산은 아니다.

스크린샷 캡처 체크리스트 (위 ‘스크린샷 후보’ URL 기준, 5~7장):

- [ ] `/` 홈 — 오늘의 후보와 데이터 기준일
- [ ] `/stocks` — 종목 탐색/필터
- [ ] `/stock/005930` — 종목 상세, 점수 근거, 데이터 품질
- [ ] `/disclosures` — 공시 신호
- [ ] `/compare` — 종목 비교 시작 화면
- [ ] `/watchlist` — 관심 종목(로그인 후)
- [ ] `/about` — 앱처럼 설치하기·서비스 성격

미확보 에셋 게이트 (현재 저장소에 자산 없음 — 제작 전까지 비워 둔다):

- [x] Google Play용 로컬 draft 모바일 스크린샷 6장 — 실제 UI 캡처 완료(`docs/store-assets/2026-07-12/google-play-draft/`).
- [ ] 최종 고해상도 Android standalone/TWA 스크린샷 — 실기기 또는 TWA 캡처 필요(오너).
- [ ] `src/app/manifest.ts`의 `screenshots[]` — 위 캡처가 선행되어야 채울 수 있음(오너/디자인). 캡처 없이 필드만 추가하면 깨진 참조가 되므로 지금은 넣지 않는다.
- [ ] OG/Twitter 공유 카드 이미지 — `public/`에 공유 이미지 없음, 대표 이미지 1장 제작 필요(오너/디자인). `twitter.card`가 `summary_large_image`이나 `images` 미지정 상태이며, 이미지 없이 필드만 추가하지 않는다.

## 제출 전 리스크 점검

- iOS App Store 래퍼는 단순 웹 래퍼로 보일 경우 4.2 Minimum Functionality 리스크가 있다. iOS 정식 제출은 Android TWA와 실사용 피드백 이후, 푸시·딥링크·오프라인 같은 네이티브 가치가 필요할 때 검토한다.
- Android TWA는 `assetlinks.json`의 패키지명·SHA-256 지문이 실제 앱 서명과 일치해야 주소창 없는 앱 경험이 된다.
- 로그인 기능 심사를 위해 테스트 계정 또는 리뷰용 접근 방법을 준비해야 한다.
- 개인정보/Data safety/App Privacy 답변은 실제 수집 항목과 외부 처리 제공자 변경 시 즉시 갱신해야 한다.
- 이 문서는 로컬 검토·초안용이다. 스토어 콘솔 제출·업로드·서명·계정 설정은 모두 오너 작업이며, 에이전트가 대신 수행하지 않는다.
- 유료 결제가 붙기 전까지 스토어 설명에 Pro/Premium 가격이나 자동갱신 구독을 확정적으로 쓰지 않는다.

## 다음 액션

1. 운영자가 실기기 PWA 로그인 복귀를 확인한다.
2. Android TWA 1차 진행 결정은 완료. 패키지명 기본값은 `com.ornscore.app`이며, Play Console 생성 직전 최종 확인한다.
3. Play Console 등록, 앱 생성, 서명 SHA-256 지문을 확보한다.
4. 확보 후 `npm run app:assetlinks -- --package com.ornscore.app --fingerprint "<SHA-256>"`를 실행하고 `npm run app:check`를 통과시킨다.
5. 스크린샷 5~7장을 캡처하고 이 문서의 등록 초안을 최종 문구로 다듬는다.
