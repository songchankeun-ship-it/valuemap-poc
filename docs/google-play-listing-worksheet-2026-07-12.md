# ORNScore Google Play Listing Worksheet - 2026-07-12

Scope: local-only Google Play listing preparation for ORNScore. This worksheet prepares copy, review notes, policy-declaration prompts, and screenshot/storyboard requirements. It does not create a Play Console app, submit declarations, upload assets, generate signing keys, publish `assetlinks.json`, deploy, push, or change remote/account state.

## Official Baseline Checked

Official Google Play references checked on 2026-07-12:

- Store listing setup: app name 30 characters, short description 80 characters, full description 4000 characters, category/tags, and public contact details.
  - https://support.google.com/googleplay/android-developer/answer/9859152
- Preview assets: app icon 512x512 PNG, feature graphic 1024x500, screenshots, and content guidance.
  - https://support.google.com/googleplay/android-developer/answer/9866151
- Data safety: every published app must complete the form; even apps that collect no data still need a privacy policy link.
  - https://support.google.com/googleplay/android-developer/answer/10787469
- App content declarations: privacy policy, ads, restricted access instructions, target audience, content rating, privacy/security practices, and news declaration.
  - https://support.google.com/googleplay/android-developer/answer/9859455
- Financial features declaration: all apps must complete it; apps with no financial features must certify that no financial features are offered.
  - https://support.google.com/googleplay/android-developer/answer/13849271
- Financial Services policy: apps containing or promoting financial products/services must comply with applicable regional rules and complete the relevant declaration.
  - https://support.google.com/googleplay/android-developer/answer/9876821

## Ready-To-Copy Store Listing Draft

### App Name

```text
오른스코어
```

Character count: 5 / 30.

### Short Description

```text
한국 주식 후보를 점수·공시·재무 지표로 빠르게 좁히는 탐색 도구
```

Character count: 36 / 80.

Rationale: states the core function without ranking claims, investment-advice claims, download CTAs, temporary promotion, or keyword stuffing.

### Full Description

```text
오른스코어는 한국 개인 투자자가 오늘 어떤 종목부터 살펴볼지 빠르게 좁힐 수 있도록 돕는 데이터 기반 주식 탐색 도구입니다.

추세, 거래활성도, 밸류, 위험조정 네 가지 자체 지표와 PER, PBR, ROE, 배당수익률, DART 공시 신호를 한 화면에서 함께 볼 수 있습니다. 종목 상세에서는 점수 근거, 데이터 품질, 공시 링크, 업종 비교, 관심 종목 저장을 확인할 수 있습니다.

주요 기능

- 오늘의 후보 종목과 시장 브리핑
- 종목 탐색, 필터, 비교
- 종목별 점수 근거와 초보자 해석
- DART 공시 신호와 원문 링크
- 관심 종목 저장과 로그인 기반 동기화
- 데이터 기준일, 산식 버전, 데이터 한계 공개

오른스코어는 투자 추천이나 매수·매도 권유를 제공하지 않습니다. 모든 점수와 신호는 공개 데이터와 자체 산식에 따른 참고 정보이며, 최종 투자 판단과 책임은 사용자 본인에게 있습니다.
```

Character count: approximately 455 / 4000.

### Category And Tags

- Category candidate: Finance.
- Tag candidates to choose inside Play Console, only if available: stock market, investing, finance tools, business, productivity.
- Do not describe the app as trading, brokerage, robo-advice, loan, crypto, payment, wallet, or portfolio-management software.

### Public Contact Details

- Developer email: `contact@ornscore.com`
- Website: `https://ornscore.com`
- Privacy policy: `https://ornscore.com/privacy`
- Account/data deletion URL: `https://ornscore.com/data-deletion`
- Terms: `https://ornscore.com/terms`
- Phone: leave blank unless the owner wants it publicly exposed.

## Review Notes Draft

```text
ORNScore is a Korean stock data exploration tool. It provides public-market reference data, score explanations, DART disclosure links, watchlist storage, and comparison views.

It does not provide investment advice, buy/sell recommendations, brokerage, trading execution, personal loans, payments, cryptocurrency wallets/exchanges, gambling, or paid in-app purchases.

Most public pages can be reviewed without logging in:
- https://ornscore.com/
- https://ornscore.com/stocks
- https://ornscore.com/stock/005930
- https://ornscore.com/disclosures
- https://ornscore.com/compare
- https://ornscore.com/status
- https://ornscore.com/privacy
- https://ornscore.com/terms

Some account features, such as synced watchlist data and notification settings, require sign-in. If Google reviewers require a logged-in test path, the owner will provide a dedicated reviewer account separately in Play Console. Do not store reviewer credentials in the repository.
```

## App Content Declaration Worksheet

These are console-answer prompts for the owner. Do not submit them automatically.

| Play Console area | Current ORNScore position | Owner action |
| --- | --- | --- |
| Privacy policy | Available at `https://ornscore.com/privacy`. | Enter the URL. |
| Ads | No ad network or ad display in the current product. | Declare no ads unless this changes. |
| App access | Public pages are open; watchlist sync and notification settings require login. | Provide reviewer instructions or a test account if Play asks. |
| Target audience | Not made for children or families. Product is Korean stock-data exploration. | Likely choose adult/general audience, with legal review before final answer. |
| News app | Not a news app. | Declare no, unless editorial news publishing is later added. |
| Government / health / COVID / gambling / tobacco / crypto / loans | Not applicable in the current app. | Declare no for each matching section, unless a future feature changes this. |
| Financial features | No trading execution, portfolio management, financial advice, loans, payments, crypto wallet/exchange, insurance, or rewards. | Complete the declaration. If Play treats stock data exploration as a financial feature, use the safest truthful explanation and legal review. |
| Content rating | Finance/data exploration, no violence/adult content/user-generated public feed. | Complete questionnaire in Play Console. |
| Data safety | Data is collected for login, account features, analytics, hosting, and email notifications. | Mirror `/privacy`; do not under-disclose. |

## Data Safety Draft

This section is a worksheet, not a final legal filing. The final Play Console answer must match the current code, deployed configuration, SDKs, and `https://ornscore.com/privacy`.

### Likely Collected Data Types

| Data type | Examples in ORNScore | Purpose | Required or optional |
| --- | --- | --- | --- |
| Email address | Magic link email, social login email, notification email | Account management, authentication, notifications | Optional for public browsing; required for login features |
| Name / nickname | Social login profile when provider returns it | Account profile/authentication | Optional; only if social login is used |
| Profile photo | Google profile photo if returned by provider | Account profile/authentication | Optional; only if provider returns it |
| User IDs | Supabase user id, provider account id | Account management, authentication | Required for login features |
| App activity | watchlist, compare list, notification settings, non-identifying click events | App functionality, sync, service improvement | Optional for public browsing; required for saved account features |
| Diagnostics / logs | IP, browser/device metadata, hosting logs, error context | Security, operation, analytics, reliability | Required for service operation |

### Likely Not Collected

- Precise location.
- Contacts.
- SMS/call log.
- Photos/videos/files.
- Payment card or bank account data.
- Health data.
- Personal-loan data.
- Crypto wallet keys or trading credentials.

### Security / Deletion Notes

- Data is transmitted over HTTPS.
- Privacy policy and `https://ornscore.com/data-deletion` state deletion/contact requests go to `contact@ornscore.com`.
- If Play Console asks for the account/data deletion URL, use `https://ornscore.com/data-deletion`.

## Financial Features Declaration Notes

> 계정 유형(개인 vs 조직)은 이 금융 기능 선언과 **별개의 미결 정책 항목**이다. 어느 쪽으로도 확정하지 않으며, 근거·질의 템플릿·예/아니오 질문·결정 트리는 `docs/ornscore-google-play-account-type-decision-2026-07-19.md`를 본다.

ORNScore is finance-related in subject matter, but the current app is not a brokerage, loan, payment, crypto, insurance, or personalized financial-advice product.

Suggested owner wording if an explanation box is available:

```text
ORNScore provides public Korean stock reference data, screening signals, DART disclosure links, and watchlist/comparison tools for research prioritization. It does not execute trades, manage user portfolios, provide personalized financial advice, offer loans, process payments, sell insurance, or provide cryptocurrency wallet/exchange functionality.
```

Important: if Play Console forces a selection that treats stock research as a financial feature, choose the most truthful option and attach the non-advisory explanation above. Do not describe ORNScore as "portfolio management" unless holdings, balances, trade history, or performance tracking are actually added.

## Asset Inventory

### Available In Repository

| Asset | Current path | Status |
| --- | --- | --- |
| App icon 512 | `public/icon-512.png` | Available; file size is under 1024KB. |
| Launcher icon 192 | `public/icon-192.png` | Available. |
| Maskable icon | `public/icon-512-maskable.png` | Available. |
| Apple touch icon | `public/apple-touch-icon.png` | Available. |
| Feature graphic draft | `docs/store-assets/2026-07-12/google-play-feature-graphic/feature-graphic-google-play-1024x500.jpg` | Available as a local Google Play draft; owner/design review before upload. |

### Missing Before Store Submission

| Asset | Required / recommended shape | Proposed source |
| --- | --- | --- |
| Phone screenshots | Minimum 2; recommended 4+ at 1080x1920 portrait | Capture installed standalone/TWA-like mobile screens. |
| Screenshot alt text | Up to 140 characters each | Use the storyboard below. |
| Optional preview video | YouTube URL, public or unlisted, not private/age-restricted | Defer until real app install flow is stable. |

Local draft screenshot pack:

- `docs/ornscore-store-visual-assets-pack-2026-07-12.md`
- `docs/store-assets/2026-07-12/google-play-draft/`
- Six JPEG screenshots were captured from real local ORNScore UI and passed basic Google Play screenshot shape checks. They are local drafts; final high-resolution Android standalone/TWA captures are still recommended before upload.
- `docs/store-assets/2026-07-12/google-play-feature-graphic/feature-graphic-google-play-1024x500.jpg`
- The feature graphic draft was exported from actual ORNScore UI as JPEG/RGB at exactly `1024x500`; final owner/design review is still recommended before upload.

## Screenshot Storyboard

Use real app UI. Avoid stock-price promises, "best", "#1", "free", "top", "download now", or return-performance claims. Keep any added tagline under 20% of the image area, or skip taglines entirely and let the UI speak.

| Order | Route / state | Suggested caption | Alt text |
| --- | --- | --- | --- |
| 1 | `/` | 오늘 볼 종목을 빠르게 좁히기 | Home screen showing ORNScore stock discovery summary and data date. |
| 2 | `/stocks` | 조건에 맞는 한국 주식 탐색 | Stock explorer with filters, topic links, and candidate rows. |
| 3 | `/stock/005930` | 점수 근거와 데이터 품질 확인 | Samsung Electronics detail page with score rationale and data quality. |
| 4 | `/disclosures` | DART 공시 신호를 한곳에서 | Disclosure signal screen with DART categories and recent filings. |
| 5 | `/compare` | 후보 종목을 나란히 비교 | Compare screen for reviewing selected stock candidates side by side. |
| 6 | `/watchlist` | 관심 종목을 매일 루틴으로 | Watchlist screen for saved stocks and daily review. |
| 7 | `/status` | 데이터 기준일과 원본 확인 | Data status screen showing source freshness and verification links. |

Capture guidance:

- Prefer Android Chrome installed standalone mode or TWA build, not a desktop browser screenshot.
- Use portrait phone captures.
- Clean the notification bar before upload.
- Keep text legible at mobile store thumbnail size.
- Do not show personal emails, test account identifiers, or admin-only pages.
- Do not include Play Store badges before the app is actually available.

## Pre-Submission Checklist

- [ ] Confirm app name and short description still fit Play limits.
- [ ] Confirm public privacy policy and terms pages are live.
- [ ] Confirm contact email `contact@ornscore.com` receives mail.
- [x] Add a dedicated `/data-deletion` page for the Play Console account/data deletion URL.
- [x] Capture 6 local Google Play draft screenshots from real ORNScore UI.
- [x] Create a 1024x500 feature graphic draft from actual UI.
- [ ] Capture final high-resolution Android standalone/TWA screenshots for upload.
- [ ] Owner/design approve the feature graphic draft as final upload asset.
- [ ] Prepare reviewer test account only inside Play Console, not in the repo.
- [ ] Complete App content declarations manually.
- [ ] Complete Data safety manually and reconcile with `/privacy`.
- [ ] Complete Financial features declaration manually and include non-advisory explanation if needed.
- [ ] Obtain real Android package/signing SHA-256 and generate `assetlinks.json`.
- [ ] Re-run `npm run app:check` and confirm zero external waits after assetlinks is real.

## Next Local Automation Slice

Prepare final high-resolution Android standalone/TWA screenshots for upload and keep the current feature graphic draft under owner/design review. Do not upload assets or change Play Console without owner action.
