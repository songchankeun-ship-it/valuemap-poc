# ORNScore Google Play 개발자 계정 유형 결정 패킷 (Personal vs Organization) — 2026-07-19

> **문서 유형**: 정책 판단(policy decision) 패킷 · **문서 전용**. 이 문서는 Play Console 앱을 생성하지 않고, 선언을 제출하지 않으며, 계정 유형을 확정하지 않는다.
> **판단 대상**: 오른스코어(ORNScore)가 Google Play 개발자 계정을 **개인(Personal / 개인)** 으로 유지할 수 있는지, 아니면 **조직(Organization / 조직)** 계정이 의무인지.
> **결론을 미리 정하지 않는다**: 이 패킷은 개인 계정이 **승인된다/거절된다**고 단정하지 않는다. 명시적 정책 문구와 추론(inference)을 분리하고, Google로부터 **서면 확인**을 받기 위한 질의 템플릿·예/아니오 질문·결정 트리를 제공한다.

관련 문서(중복 회피, 가리키기만):

- Play 등재 필드 워크시트 → `docs/google-play-listing-worksheet-2026-07-12.md`
- 스토어 제출 배경/리스크 → `docs/app-store-submission-pack.md`
- TWA 운영자 intake(계정 유형 빈칸 포함) → `docs/ornscore-android-twa-owner-checklist.md`
- Play Console 1페이지 액션 시트 → `docs/ornscore-play-console-action-pack-2026-07-13.md`

---

## 0. 알려진 현재 상태 (Known state)

- **소유자 계정 상태**: 개인(Personal) 개발자 프로필이 선택됨 · 신원 인증(identity verification) **진행 중(pending)** · **앱 생성 아직 불가**.
- **제품 상태**: 아래 §1 참조. 오른스코어는 공개 한국 주식 참고 데이터·점수/스크리닝 신호·비교·DART 링크·관심목록 동기화를 제공한다. **거래 체결/잔고 보유/포트폴리오 관리/대출·결제·암호화폐·보험/개인 맞춤 자문은 제공하지 않는다.**

---

## 1. 사실 기반 제품 분류 (Factual product classification)

이 절은 **저장소 코드/문서로 확인 가능한 사실**만 담는다. 마케팅 표현이 아니다.

오른스코어가 **하는 것**:

- 공개 시장 참고 데이터 표시(한국 상장 종목 138개, KRX/DART/공개 재무).
- 자체 산식 4지표(추세·거래활성도·밸류·위험조정)와 PER/PBR/ROE/배당수익률 등 **점수·스크리닝 신호**.
- 종목 비교, 종목 상세, 점수 근거·데이터 품질 표시.
- **DART 공시 원문 링크**(외부 공식 공시로 연결).
- 로그인 기반 **관심목록 저장·동기화**, 알림 설정.
- 데이터 기준일·산식 버전·데이터 한계 **공개 고지**, "투자 추천 아님" 고지.

오른스코어가 **하지 않는 것**(제품 사실):

- 거래 체결(주문/매수/매도 실행) 없음.
- 현금·증권 **잔고 보유** 없음.
- **포트폴리오 관리**(보유/성과 추적) 없음.
- 대출·선지급·결제·송금 없음.
- 암호화폐 지갑/거래소 없음.
- 보험 판매 없음.
- **개인 맞춤(personalized) 투자 자문** 없음 — 모든 신호는 공개 데이터에 대한 참고 정보.
- 앱 내 유료 결제·구독 없음(현 시점).

> **1줄 요약**: 오른스코어는 **비거래(non-transactional)·비자문(non-advisory) 주식 리서치/스크리닝 도구**다. 주제(subject matter)는 금융이지만, 금융 상품을 **판매·중개·집행·관리**하지 않는다.

---

## 2. 명시적 정책 문구 (Explicit policy text — 출처 링크 포함)

> 아래는 **공식 Google Play 고객센터 페이지의 실제 문구**를 그대로 인용한 것이다(2026-07-19 확인). 해석/추론은 §3에서 분리한다.

### 2.1 개발자 계정 유형 — 어떤 앱이 반드시 조직 계정이어야 하는가

출처: **개발자 계정의 연락처 정보 요구사항** — https://support.google.com/googleplay/android-developer/answer/10840893?hl=ko

- 개인 계정 선택 기준(verbatim):
  > "개인 용도의 계정이라면 개인 계정을 선택합니다. 예를 들어 학생, 취미 개발자 또는 준전문가 개발자가 여기에 해당합니다."
- **조직 계정이 의무인 앱 범주(verbatim)** — 다음을 제공하면 조직 계정을 선택해야 한다:
  > "금융 상품 및 서비스(은행, 대출, 주식 거래, 투자 펀드, 암호화폐 소프트웨어 지갑, 암호화폐 거래소를 포함하되 이에 국한되지 않음)"
  > "건강 앱(예: 의료 앱 및 인간 대상 연구 앱)"
  > "VpnService 클래스를 사용하도록 승인된 앱"
  > "정부 앱(정부 기관에서 또는 정부 기관을 대신하여 개발한 앱 포함)"
- 공통 요구사항(verbatim):
  > "모든 Google Play 개발자 계정에는 확인된 연락처 정보(이메일 주소 및 전화번호)가 있어야 합니다."
  > (조직 계정) "조직 또는 비즈니스 계정의 담당자 이메일 주소에 일반 또는 개인 이메일 주소를 사용해서는 안 됩니다."

### 2.2 금융 기능 선언 (Financial features declaration)

출처: **Financial features declaration 정보** — https://support.google.com/googleplay/android-developer/answer/13849271?hl=ko

- 모든 앱은 금융 기능 선언을 완료해야 한다. **금융 기능이 없는 앱**은 다음을 선언한다(verbatim):
  > "앱에서 금융 기능을 제공하지 않음"
- 선언 시 선택 가능한 **금융 기능 범주(옵션) 전체 목록**:
  - **은행·대출**: Personal loan direct lender / Loan broker / Paycheck advance loan / Bank / Credit line / Salary advance / Micro-finance banking
  - **결제·송금**: Mobile payment and digital wallet / Money transfer and remittance service
  - **구매 약정**: Rewards, points, airline miles and other incentives / Buy now, pay later
  - **거래·펀드**: Cryptocurrency wallet / Cryptocurrency exchange / Tokenized digital asset (NFT) sales, trading, rewards / **Stock trading and portfolio management(주식 거래 및 포트폴리오 관리)** / Crowdfunding and equity crowdfunding
  - **지원 서비스**: Credit monitoring and reporting / Financial advice / Insurance / **Other**

### 2.3 세 번째 링크에 대한 정정 (Status correction)

- 과제 지시에 정책 근거로 함께 제시된 세 번째 URL — https://support.google.com/googleplay/android-developer/answer/13327111?hl=ko — 은 **금융 상품 정의 페이지가 아니다.** 2026-07-19 확인 시 실제 페이지 제목/주제는:
  > "Google Play의 앱 계정 삭제 요구사항 이해하기"
- 즉 이 페이지는 **앱 계정/사용자 데이터 삭제 요구사항**을 다루며(오른스코어의 `https://ornscore.com/data-deletion` 요구사항과 연관), **계정 유형(개인/조직) 판단의 근거로는 직접 사용할 수 없다.** 계정 유형 판단의 1차 근거는 §2.1(answer 10840893), 금융 기능 선언의 근거는 §2.2(answer 13849271)이다.

---

## 3. "금융 상품 및 서비스" 모호성 (The ambiguity — 추론, 명시 아님)

> 이 절은 **추론(inference)** 이다. 아래 어떤 것도 §2의 명시 문구가 직접 답하지 않는다.

- §2.1의 조직-의무 트리거는 **"금융 상품 및 서비스"** 이며, 괄호 목록은 **"…를 포함하되 이에 국한되지 않음"** 이라는 **개방형(open-ended)** 표현을 쓴다. 목록에 명시된 예시는 **은행, 대출, 주식 거래(주식 거래 = trading), 투자 펀드, 암호화폐 지갑/거래소**로, 모두 **거래·집행·자금 취급형** 활동이다.
- 오른스코어는 **주식 거래(trading)를 하지 않고 포트폴리오를 관리하지 않는다**(§1). 문구에 명시된 예시(주식 거래)에는 **문자 그대로 해당하지 않는다.**
- **그러나** "이에 국한되지 않음" 때문에, **비거래 주식 리서치/스크리닝 도구**가 계정 유형 목적상 "금융 상품 및 서비스"의 넓은 범위에 포함되는지는 **정책 문구가 명시적으로 답하지 않는다.** 이것이 핵심 모호성이다.
- 참고 비대칭: §2.2의 금융 기능 선언 범주에는 **"Stock trading and portfolio management"** 만 있고, **"주식 정보/스크리닝/참고 데이터"** 라는 별도 범주는 **없다.** 따라서 오른스코어에 문자 그대로 맞는 선언 범주는 없고, 남는 선택지는 (a) **"금융 기능 제공하지 않음"** 또는 (b) **"Other"** 이다 — 어느 쪽이 Google의 기대와 일치하는지는 **명시되어 있지 않다.**
- **결론(추론)**: 명시 문구만으로는 개인 계정이 허용되는지 단정할 수 없다. 개인↔조직은 **소유자·법무 판단 + Google 서면 확인**이 필요한 미결(open) 항목으로 남긴다.

---

## 4. Google에 보낼 질의 템플릿 (Inquiry templates)

> 목적: 계정 유형(개인/조직)에 대한 **서면(written) 확인**을 받는다. **개인정보·비공개 값은 넣지 않는다**(§6).

### 4.1 한국어 템플릿 (Korean)

```text
제목: 개발자 계정 유형 문의 — 비거래 주식 리서치 앱(개인 vs 조직)

안녕하세요. Google Play 개발자 계정 유형 판단에 대해 서면 확인을 요청드립니다.

[앱 개요]
저희 앱은 한국 상장 종목의 "공개 참고 데이터"만 제공하는 리서치/스크리닝 도구입니다.
- 제공: 공개 시장 데이터 표시, 자체 산식 점수·스크리닝 신호, 종목 비교, DART 공시 원문 링크, 관심목록 저장/동기화.
- 미제공: 거래 체결(주문/매수/매도), 잔고 보유, 포트폴리오 관리, 대출·결제·송금, 암호화폐 지갑/거래소, 보험, 개인 맞춤 투자 자문.
- 앱 내 유료 결제/구독 없음. 모든 정보에 "투자 추천 아님" 고지 표시.

[문의 근거]
"개발자 계정의 연락처 정보 요구사항"(answer 10840893) 문서는 "금융 상품 및 서비스(은행, 대출,
주식 거래, 투자 펀드, 암호화폐 지갑/거래소를 포함하되 이에 국한되지 않음)"에 대해 조직 계정을
요구합니다. 저희 앱은 거래를 집행하지 않고 포트폴리오를 관리하지 않는 "비거래·비자문" 리서치
도구이므로, 이 요건이 저희에게 적용되는지 명확하지 않습니다.

[요청]
아래 질문에 예/아니오로 서면 확인 부탁드립니다.
1. 위와 같은 "비거래·비자문" 주식 참고 데이터/스크리닝 앱이 계정 유형 목적상
   "금융 상품 및 서비스"에 해당합니까? (예/아니오)
2. 해당한다면 조직(Organization) 계정이 의무이고 개인(Personal) 계정은 사용할 수 없습니까? (예/아니오)
3. "금융 기능 선언"에서 거래·포트폴리오 관리를 하지 않는 저희 앱은
   "앱에서 금융 기능을 제공하지 않음"으로 선언하는 것이 맞습니까? (예/아니오)
4. 조직 계정이 필요하다면, 이미 선택된 개인 프로필을 조직으로 전환할 수 있습니까,
   아니면 새 조직 계정을 생성해야 합니까? (전환 가능/신규 생성 필요)

정확한 판단을 위해 공개 페이지 URL과 앱 설명을 첨부합니다(비공개 정보 없음).
감사합니다.
```

### 4.2 영어 템플릿 (English — matching)

```text
Subject: Developer account type question — non-transactional stock research app (Personal vs Organization)

Hello. We request a written confirmation regarding our Google Play developer account type.

[App summary]
Our app is a research/screening tool that only shows PUBLIC reference data for Korean listed stocks.
- Provides: public market data display, in-house scoring/screening signals, stock comparison,
  links to original DART disclosures, and watchlist save/sync.
- Does NOT provide: trade execution (orders/buy/sell), balance holding, portfolio management,
  loans/payments/remittance, crypto wallet/exchange, insurance, or personalized investment advice.
- No in-app purchase/subscription. Every view carries a "not investment advice" notice.

[Basis for the question]
The "Developer account contact information requirements" article (answer 10840893) requires an
Organization account for "financial products and services (including but not limited to banks,
loans, stock trading, investment funds, crypto wallets/exchanges)". Because our app neither
executes trades nor manages portfolios (it is non-transactional and non-advisory), it is unclear
whether this requirement applies to us.

[Request — please confirm in writing, yes/no]
1. Does a non-transactional, non-advisory stock reference-data/screening app like ours count as
   "financial products and services" for account-type purposes? (Yes/No)
2. If yes, is an Organization account mandatory and is a Personal account therefore not permitted? (Yes/No)
3. In the Financial features declaration, since we do not execute trades or manage portfolios,
   is it correct for us to declare "the app provides no financial features"? (Yes/No)
4. If an Organization account is required, can our already-selected Personal profile be converted
   to Organization, or must a new Organization account be created? (Convertible / Must create new)

We attach public page URLs and the app description for accuracy (no private information).
Thank you.
```

---

## 5. 서면 답변에 필요한 정확한 예/아니오 질문 (Exact yes/no questions)

Google로부터 받아야 할 **결정 가능한(decidable)** 문항. §4 템플릿과 1:1 대응한다.

1. **Q1** — 비거래·비자문 주식 참고데이터/스크리닝 앱이 계정 유형 목적상 "금융 상품 및 서비스"에 해당하는가? → **예 / 아니오**
2. **Q2** — (Q1이 예일 때) 조직 계정이 의무이며 개인 계정은 불가한가? → **예 / 아니오**
3. **Q3** — 거래·포트폴리오 관리를 하지 않는 이 앱은 금융 기능 선언에서 "금융 기능 제공하지 않음"으로 선언하는 것이 맞는가? → **예 / 아니오**
4. **Q4** — 조직 계정이 필요할 경우, 기존 개인 프로필을 조직으로 **전환 가능**한가(아니면 신규 생성 필요)? → **전환 가능 / 신규 생성 필요**

> Q1·Q2가 결정의 축이다. Q3은 금융 기능 선언 답안을 고정한다. Q4는 조직 경로일 때의 실행 비용(리드타임)을 정한다.

---

## 6. 안전한 첨부/증거 제안 (Safe attachments — 비공개 값 없음)

**첨부해도 되는 것**(모두 공개·비민감):

- 로그인 없이 열람 가능한 공개 페이지 URL:
  - `https://ornscore.com/`
  - `https://ornscore.com/stocks`
  - `https://ornscore.com/stock/005930`
  - `https://ornscore.com/disclosures`
  - `https://ornscore.com/compare`
  - `https://ornscore.com/status`
  - `https://ornscore.com/privacy`
  - `https://ornscore.com/terms`
  - `https://ornscore.com/data-deletion`
- §1의 비자문(non-advisory) 제품 설명(한/영) 문단.
- 공개 페이지 스크린샷 — **주문/매수·매도 버튼 없음, 잔고·포트폴리오 없음, 결제 없음**을 보여주는 화면. 촬영 시 알림바 정리, 개인·계정 식별자 제거.
- 앱 내 "투자 추천 아님" 고지 문구.

**절대 첨부하지 말 것**(비공개/민감):

- 심사용 리뷰어 계정 자격증명(저장소·문의에 넣지 않는다).
- 소유자 법적 이름·주소·전화번호·개인 Gmail 등 개인정보.
- DART API 키, Supabase 서비스 키, `CRON_SECRET`, 기타 시크릿.
- 앱 서명 SHA-256 지문, 최종 package id 등 서명/무결성 값.
- 미공개 관리자(admin) 페이지 캡처.

---

## 7. 결정 트리 (Decision tree — 두 가지 답변 경로)

Google의 서면 답변(Q1/Q2)에 따라 갈린다.

### 경로 A — "개인 계정 허용" (Q1=아니오, 또는 Q2=아니오)

의미: 오른스코어가 계정 유형 목적상 "금융 상품 및 서비스"에 해당하지 않음 → **개인(Personal) 계정 유지 가능.**

1. 현재 개인 프로필을 유지하고 **신원 인증 완료**를 진행한다.
2. 인증 완료 후 앱 생성으로 진행(다른 문서의 기존 절차 그대로).
3. 금융 기능 선언: Q3 답변대로 — 통상 **"금융 기능 제공하지 않음"**(거래·포트폴리오 없음). 설명 상자가 있으면 §2.2/기존 팩의 비자문 설명 사용.
4. `docs/ornscore-android-twa-owner-checklist.md` §1 계정 유형을 **개인**으로 채우고, **근거로 Google 서면 답변(날짜/케이스 번호)** 을 메모.
5. 이후 assetlinks/package/서명 단계는 변경 없음.

### 경로 B — "조직 계정 필요" (Q1=예 **그리고** Q2=예)

의미: 오른스코어가 "금융 상품 및 서비스"로 분류됨 → **조직(Organization) 계정 의무. 개인 계정 사용 불가.**

1. **개인 계정으로 앱을 생성하지 않는다.** 조직 경로가 확정되기 전까지 앱 생성은 보류(현재도 앱 생성 불가 상태).
2. 조직 계정 요건 확보:
   - **D-U-N-S 번호**(법인/사업자 식별), 조직 법적 명칭·주소·전화·웹사이트.
   - **담당자 이메일은 일반/개인 이메일 불가** → 조직 도메인 메일 필요(예: `contact@ornscore.com` 형태의 조직 메일함).
   - 이는 **리드타임**이 있는 소유자·법무 작업(D-U-N-S 발급 대기 등).
3. Q4 답변대로: 개인→조직 **전환 가능**이면 전환, **신규 생성 필요**면 새 조직 계정 생성(개인 계정 재사용 불가 가능성).
4. 스토어 문구·데이터 안전·금융 기능 선언 자체는 대체로 유지되나, **개발자 표시명/연락 정보가 조직 기준**으로 바뀐다 → 관련 공개 표기 재확인.
5. `docs/ornscore-android-twa-owner-checklist.md` §1 계정 유형을 **조직**으로 채우고 근거 메모.

### 답변이 모호하거나 확정적 서면이 없을 때 (fallback)

- 계정 유형을 **미결(UNRESOLVED)** 로 유지한다. **개인 계정으로 앱을 생성하지 않는다**(추후 강제 이전/게시 중단 리스크 회피).
- §4 템플릿을 더 좁혀(예: "trading을 하지 않는 read-only 리서치 앱" 강조) 재문의하고, 소유자·법무가 리스크 허용도를 결정한다.

---

## 8. 소유자 잔여 게이트 (Owner-only residuals)

이 패킷은 아래를 **하지 않는다**(소유자 게이트):

- Play Console 앱 생성·선언 제출·계정 유형 확정.
- 개인↔조직 전환/신규 생성, D-U-N-S 발급, 조직 메일함 개설.
- Google에 실제 문의 발송 및 서면 답변 수령.
- `assetlinks.json` 실값 생성(별도 서명 SHA-256 게이트 — 기존 문서 참조).

패킷의 역할은 **판단 근거 정리 + 서면 확인 획득 도구 제공**까지다. 서면 답변이 오면 §7 경로를 따라 문서를 갱신한다.

---

마지막 업데이트: 2026-07-19 (task 367 · [codex] · 문서 전용 정책 판단 패킷)
