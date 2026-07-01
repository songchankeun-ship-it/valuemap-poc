# 오른스코어 스토어 제출 준비 패키지

마지막 갱신: 2026-07-01

## 목적

이 문서는 Play Store나 App Store로 넘어갈 때 바로 복사·검토할 수 있는 등록 자료 초안이다. 아직 스토어 출시를 확정하지 않는다. 현재 기준의 1순위는 PWA 운영, 다음 후보는 Android TWA다.

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
- 이용약관: `https://ornscore.com/terms`
- 문의: `songchankeun@gmail.com`
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

모멘텀, 거래활성도, 밸류, 변동성조정 네 가지 자체 지표와 PER, PBR, ROE, 배당수익률, DART 공시 신호를 한 화면에서 함께 볼 수 있습니다. 종목 상세에서는 점수 근거, 데이터 품질, 공시 링크, 업종 비교, 관심 종목 저장을 확인할 수 있습니다.

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

최종 제출 전 Play Console 질문 문항에 맞춰 운영자가 다시 확인해야 한다.

- 수집 데이터 후보: 이메일 주소, 이름/닉네임, 프로필 사진(소셜 제공자가 전달하는 경우), 소셜 로그인 식별자, 관심 종목, 비교 목록, 알림 설정, 접속 정보.
- 사용 목적: 계정 관리, 로그인, 관심 종목 동기화, 알림 발송, 서비스 품질 개선.
- 공유/위탁 후보: Supabase, Vercel, Resend, Kakao, Google, Naver. `https://ornscore.com/privacy`의 위탁 처리 표와 일치해야 한다.
- 결제 정보: 현재 앱 내 결제 없음.
- 광고/추적: 현재 광고성 추적 목적 없음으로 운영자가 확인.
- 삭제 요청: 회원 탈퇴/삭제 요청은 `songchankeun@gmail.com`으로 처리. Play Console이 공개 데이터 삭제 URL을 요구하면 `/privacy` 또는 별도 삭제 안내 URL을 추가한 뒤 제출한다.
- 주의: 공개 베타에서는 AI 분석 기능을 전면에 노출하지 않는다. AI 기능을 다시 공개하면 `privacy`와 Data safety/App Privacy 답변에 AI 처리 제공자와 보관 항목을 복구해야 한다.

## App Store 등록 초안

### 앱 이름

오른스코어

### 부제 후보

한국 주식 데이터 탐색 도구

### 설명

오른스코어는 한국 주식 후보를 여러 데이터 관점으로 빠르게 좁혀 보는 탐색 도구입니다.

모멘텀, 거래활성도, 밸류, 변동성조정 네 가지 자체 지표와 PER, PBR, ROE, 배당수익률, DART 공시 신호를 한 화면에서 제공합니다. 종목 상세에서는 점수 근거, 공시 원문, 업종 비교, 데이터 품질 상태를 함께 확인할 수 있습니다.

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

최종 제출 전 App Store Connect의 질문 문항에 맞춰 운영자가 다시 확인해야 한다.

- Contact Info: 이메일 주소, 이름/닉네임. 로그인·계정 식별·알림 발송 목적.
- User Content 또는 Other User Content 후보: 관심 종목, 비교 목록, 알림 설정. 사용자 계정 기능 제공 목적.
- Identifiers: 소셜 로그인 제공자 계정 식별자, Supabase 사용자 ID.
- Usage Data: 접속 정보와 익명 통계. 서비스 품질 개선 목적.
- Diagnostics 후보: IP, 브라우저 정보, 오류/접속 로그가 분석 제공자에 남을 수 있음.
- Tracking: 현재 광고 추적 목적 사용 없음으로 운영자가 확인.
- Third-party partners: Supabase, Vercel, Resend, Kakao, Google, Naver.

## 스크린샷 제작 지침

- 모바일 우선. 주소창이 보이는 브라우저 캡처보다 홈 화면 설치 후 standalone 또는 TWA 화면이 더 적합하다.
- 텍스트가 잘리지 않는 세로 화면으로 캡처한다.
- 금융 수익 보장처럼 보이는 문구를 넣지 않는다.
- 스크린샷 내 주요 문구는 “탐색”, “점수 근거”, “공시 신호”, “데이터 기준일”, “투자 추천 아님” 중심으로 둔다.
- 실제 스토어 출시가 확정되기 전에는 App Store/Play Store 배지를 공개 이미지에 넣지 않는다.

## 제출 전 리스크 점검

- iOS App Store 래퍼는 단순 웹 래퍼로 보일 경우 4.2 Minimum Functionality 리스크가 있다. iOS 정식 제출은 PWA 홈 화면 추가 운영 이후, 푸시·딥링크·오프라인 같은 네이티브 가치가 필요할 때 검토한다.
- Android TWA는 `assetlinks.json`의 패키지명·SHA-256 지문이 실제 앱 서명과 일치해야 주소창 없는 앱 경험이 된다.
- 로그인 기능 심사를 위해 테스트 계정 또는 리뷰용 접근 방법을 준비해야 한다.
- 개인정보/Data safety/App Privacy 답변은 실제 수집 항목과 외부 처리 제공자 변경 시 즉시 갱신해야 한다.
- 유료 결제가 붙기 전까지 스토어 설명에 Pro/Premium 가격이나 자동갱신 구독을 확정적으로 쓰지 않는다.

## 다음 액션

1. 운영자가 실기기 PWA 로그인 복귀를 확인한다.
2. Android TWA를 먼저 갈지 결정한다. 현재 권장 후보 패키지명은 `com.ornscore.app`이지만, Play Console 생성 전 운영자가 최종 확정한다.
3. Android 진행 시 Play Console 등록, 패키지명, SHA-256 지문을 확보한다.
4. 확보 후 `npm run app:assetlinks -- --package <패키지명> --fingerprint "<SHA-256>"`를 실행하고 `npm run app:check`를 통과시킨다.
5. 스크린샷 5~7장을 캡처하고 이 문서의 등록 초안을 최종 문구로 다듬는다.
