# 오른스코어 앱 패키징 마감 체크리스트

마지막 갱신: 2026-06-28

## 현재 결론

- **PWA 홈 화면 설치는 코드상 마감 상태**다.
- Android Play Store는 **TWA가 1순위 후보**다. 단, 실제 `assetlinks.json`은 Android 패키지명과 서명 SHA-256 지문이 생긴 뒤에만 배포한다.
- iOS는 우선 **홈 화면 추가**로 운영하고, App Store 래퍼는 Apple Developer 계정과 Mac/Xcode 빌드 환경을 준비한 뒤 별도 결정한다.
- Service Worker는 아직 등록하지 않는다. 점수·시세·공시 데이터 신선도와 캐시 충돌을 피하기 위한 의도적 보류다.

## 코드 마감 상태

- `src/app/manifest.ts`: 앱 이름, 설명, `standalone`, `start_url`, `scope`, 192/512/maskable 아이콘, 바로가기 3개.
- `public/icon-192.png`, `public/icon-512.png`, `public/icon-512-maskable.png`, `public/apple-touch-icon.png`: 설치 아이콘 세트.
- `src/components/PwaInstallHelper.tsx`: 브라우저가 실제 설치 프롬프트를 제공할 때만 설치 버튼 노출.
- `src/app/offline/page.tsx`: 네트워크 필요 안내.
- `scripts/check-app-packaging.mjs`: 앱 패키징 로컬 게이트.
- `scripts/generate-assetlinks.mjs`: Android TWA용 `assetlinks.json` 생성기.
- `docs/app-store-submission-pack.md`: Play/App Store 등록 문구, 개인정보 답변, 스크린샷, 리뷰 노트 초안.

## 실행 명령

```powershell
npm run app:check
```

Android TWA로 가기로 결정하고 실제 패키지명/서명 지문이 준비되면:

```powershell
node scripts/generate-assetlinks.mjs --package com.ornscore.app --fingerprint "AA:BB:CC:...:FF"
npm run app:check
```

## 운영자가 직접 확인할 것

- 휴대폰에서 `https://ornscore.com` 접속 후 홈 화면에 추가.
- 홈 화면 아이콘으로 실행했을 때 주소창 없는 앱 모드로 열리는지 확인.
- 앱 모드에서 Google/Kakao/email 로그인 후 `/watchlist`로 정상 복귀하는지 확인.
- 관심 종목, 알림 설정, `/offline`, `/terms`, `/privacy`가 모바일 앱 모드에서 깨지지 않는지 확인.
- Android TWA를 진행할 경우 Play Console 개발자 등록, 패키지명 확정, 앱 서명 SHA-256 지문 확보.
- iOS App Store를 진행할 경우 Apple Developer Program, Mac/Xcode, 래퍼 방식 검토.
- 스토어 등록을 시작할 경우 `docs/app-store-submission-pack.md`의 초안을 실제 콘솔 입력값에 맞게 최종 검토.

## 배포 전 금지

- 자리표시자 `assetlinks.json`을 `public/.well-known/assetlinks.json`으로 배포하지 않는다.
- App Store/Play Store 출시가 확정되기 전 공개 화면에서 스토어 출시를 주장하지 않는다.
- 데이터 JSON을 무작정 Service Worker로 캐시하지 않는다.
