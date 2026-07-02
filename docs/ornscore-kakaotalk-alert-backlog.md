# 오른스코어 카카오톡 알림 — 로컬 전용 제품 백로그 (Task 144)

> 작성: 2026-07-02 (AI Center Task 144, [claude]). 브랜치 `ai-center/task-144-ornscore-kakaotalk-alert-product-bac`.
> 목적: 오너의 "카카오톡 알림 선호"를 **외부 계정/민감 설정을 전혀 건드리지 않고** 지금 로컬에서 설계·구현할 수 있는 것과
> 나중에 오너만 할 수 있는 것으로 나눠, 단계적(스테이지) 백로그로 고정한다. 이 문서 하나로 다음 담당 AI가 착수 지점을 안다.
>
> 톤 규칙(전 문서 공통): 후보·탐색·확인·참고 정보 유지. **매수·매도 권유·가격 단정·수익 보장·압박성 카피 금지.**
> 교차 참고(중복 대신 링크):
> - 제품 방향 잠금(무료·한국어 전용·카카오톡 알림 로드맵) → `docs/ornscore-free-beta-v1-scope.md`
> - 로그인 카카오(라이브) 콘솔 절차 → `docs/auth-providers-setup.md`
> - 알림이 최신 200건 일반 피드에 의존하면 안 되는 설계 근거 → `docs/ornscore-beta-launch-checklist.md` (g)
> - 운영자 인테이크(빈칸 시트) 작성 스타일 참고 → `docs/ornscore-android-twa-owner-checklist.md`

---

## §0. 범위 & 가드레일 (Scope & Guardrails)

- **로컬 코드/문서만.** 이 백로그의 Stage 1~4는 전부 로컬에서 설계·구현 가능한 범위다. 실제 발송은 없다.
- **외부 서비스 설정 변경 없음.** 카카오 비즈니스 채널·발신프로필·알림톡 템플릿·대행사 콘솔·Vercel 환경변수는 **오너 게이트**(§4)로만 남긴다.
- **저장소에 비밀값 금지.** API 키·발신 키·채널 시크릿은 이 저장소에 커밋하지 않는다. 전부 자리표시자로만 문서화한다.
- **제3자 서비스 호출 금지.** 카카오/대행사 API를 이 작업에서 호출하지 않는다.
- **유료 약정 금지.** 알림톡은 **건당 과금**이라 발송 단가·대행사 계약은 오너의 사업 결정이다. 이 문서는 결정을 대신하지 않는다.

### 카카오 "로그인" ≠ 카카오 "알림톡" (혼동 방지)

| 구분 | 상태 | 근거 |
|---|---|---|
| **카카오 로그인(OAuth)** | ✅ **라이브** (이미 연결됨) | `docs/auth-providers-setup.md` "Kakao (이미 연결됨)". Supabase Auth provider. |
| **카카오톡 알림톡(메시지 발송)** | ❌ **미설정** (로드맵) | 비즈니스 채널·발신프로필·템플릿 승인·대행사·건당 과금 필요. 이 문서가 다루는 대상. |

→ 로그인 카카오가 동작한다고 알림톡 발송이 준비된 것은 **아니다**. 둘은 완전히 별개 인프라다. 카피·문서에서 이 둘을 섞지 않는다.

---

## §1. 공개 표면 감사 (Public-Surface Audit)

Task 144 시점 코드 기준. `file:line`은 감사 당시 위치(편집 시 재확인 필요). **✅ = 이미 카카오 로드맵 톤으로 정합 / 유지**, **☑ 소프트닝 = 이번 Task 144에서 이메일-우선 문구를 로드맵 톤으로 조정**, **🔧 = Stage 대상(로컬 설계/구현)**, **⛔ 오너 = 외부 게이트**.

| 표면 | 위치 (file:line) | 현재 상태 | 카카오 준비도 |
|---|---|---|---|
| 알림 종류 카탈로그(9종 단일 소스) | `src/lib/alertCatalog.ts:32-117` | 라이브 2종(`watchlist_disclosure`·`saved_filter_match`) + 미리보기 7종. status `live`/`preview`. | 🔧 Stage 2에서 `AlertEvent` 스키마의 `type` 소스로 재사용 |
| └ 저장 필터 알림 설명 | `src/lib/alertCatalog.ts:85` | "현재는 임시로 이메일 발송, 카카오톡 알림은 준비 중" | ✅ 이미 소프트닝됨(Task 113 후속) |
| 미리보기 토글 저장(무발송) | `src/lib/alertPrefs.ts:13,16,40-48` | `localStorage` `Record<string,boolean>`. 발송 파이프라인 미연결(의도적). | 🔧 **Stage 1 잔여**(Task 148에서 의도적 미변경) — `{type, channel}` 확장은 실발송 결정과 함께 착수. Task 148은 localStorage-only·무발송 상태를 그대로 유지(백엔드 미연결 확인) |
| 기능 플래그 | `src/lib/features.ts:5,7,9` | `watchlistDisclosureAlert`/`conditionAlert` active·free, `advancedAlerts` planned/pro | ✅ 내부 플래그(공개 약속 아님). **무변경** |
| 알림 채널 현황 | `src/components/notifications/NotificationChannels.tsx:13-19` | 이메일=live, 웹·텔레그램·**카카오 알림톡**·앱푸시=preparing(`:17`) | ✅ **Task 148 로컬 완료** — 카카오 행에 "우선 방향 준비 중 · 로그인 카카오(계정)와는 별개 · 아직 실제 발송 전" 보조 카피 1줄 추가(준비 중 배지·이메일 사용 중 상태 무변경) |
| 알림 종류 UI(라이브/미리보기 행·토글) | `src/components/notifications/AlertTypeCatalog.tsx:66-108` | 라이브="사용 중·이메일" 배지, 미리보기=준비 중+로컬 토글 | ✅ 정직 표시. 유지 |
| 알림 예시 카드(형식 미리보기) | `src/components/notifications/AlertExampleCards.tsx` | 실데이터 형식 예시 + "투자 추천 아님" 푸터(`:31`) | ✅ **Task 148 로컬 완료** — 이 형식/고지 패턴을 재사용해 `KakaoAlertPreview.tsx`(카카오 말풍선 정적 프리뷰) 신설, `settings/notifications`에 렌더. 무발송·`AlertExampleData` 재사용 |
| 인앱 알림 on/off | `src/components/NotificationToggle.tsx` · `src/lib/notifications.ts` | Supabase `notification_preferences.enabled` | ✅ 유지(발송 게이트) |
| 조건 알림 관리 | `src/components/ConditionAlertsManager.tsx:52` | "…새 종목이 들어오면 알려드려요. (현재는 이메일 발송, 카카오톡 알림 준비 중 · 영업일 1회 평가)" | ☑ 소프트닝(이번 Task 144) |
| 조건 알림 저장소 | `src/lib/conditionAlerts.ts` | Supabase `condition_alerts`(config·active·last_match) | 🔧 Stage 2 채널 선호 확장(설계만) |
| 저장 검색 config | `src/lib/savedSearches.ts:5-24` | `SavedSearchConfig`(필터 조건) | ✅ 유지(알림 조건 소스) |
| 관심 종목 저장소 | `src/lib/watchlist.ts` | Supabase `watchlists` + localStorage | ✅ 유지(공시 알림 대상 소스) |
| 알림 설정 페이지 | `src/app/settings/notifications/page.tsx:123-134` | 상단 배너: "이메일은 임시(베타) 채널 · 카카오톡 우선 방향 준비 중 · 로그인 매직링크는 별개" | ✅ 이미 카카오 로드맵 톤 |
| └ 라이브 컨트롤 카드 설명 | `src/app/settings/notifications/page.tsx:144` | "…신호가 발견되면 매일 한 번 이메일로 발송됩니다" | ✅ **유지** — 현재 라이브 채널(이메일)의 정확한 사실. 위 배너가 "임시/베타"로 이미 프레이밍. 카카오 라이브로 오해될 소지 없음 |
| 오늘 페이지 관심 힌트 | `src/lib/copy/today.ts:99,224` | "…알림으로 받을 수 있어요 (현재는 이메일 발송, 카카오톡 알림 준비 중…)" | ☑ 소프트닝(이번 Task 144, ko/en) |
| 종목 탐색 알림 확인/생성 문구 | `src/lib/copy/stocks.ts:52-53,334-335` | "…받을 수 있어요/알려드릴게요 (현재는 이메일 발송, 카카오톡 알림 준비 중)" | ☑ 소프트닝(이번 Task 144, ko/en) |
| 공시 알림 발송(백엔드) | `src/app/api/cron/notify/route.ts` | Resend 이메일. 관심 종목 공시 신호. | ✅ **폴백으로 유지**(§4 Stage 4). 무변경 |
| 조건 알림 발송(백엔드) | `src/app/api/cron/evaluate-alerts/route.ts` | Resend 이메일. 저장 조건 충족. | ✅ **폴백으로 유지**(§4 Stage 4). 무변경 |

범례: ✅ 정합/유지 · ☑ 이번 소프트닝 · 🔧 Stage 대상 · ⛔ 오너 게이트

---

## §2. 지금 로컬 가능 vs 나중 오너 전용 (Local-now vs Owner-later)

| 지금 로컬에서 설계/구현 가능 (발송 없음) | 반드시 오너 체크리스트로 남는 것 (외부·과금) |
|---|---|
| 채널 선호 opt-in UI 개념(§Stage 1) — `alertPrefs` 확장, 여전히 localStorage·무발송 | 카카오 비즈니스 채널 개설·발신프로필 등록(오너 카카오 계정) |
| `NotificationChannels` 카카오 행 상세 카피 | 알림톡 템플릿 사전 심사·승인(카카오 검수, 수일 소요) |
| 카카오 스타일 알림 카드 **인앱 프리뷰**(실발송 아님) | 대행사(Solapi·NHN Cloud 등) 선정·계약 |
| `AlertEvent` 스키마 설계 + 9종 카탈로그 매핑(§Stage 2) | API 키/발신 키를 Vercel 환경변수에 배치(저장소 금지) |
| 채널 선호 영속화 **설계**(Supabase 확장 노트만) | **건당 발송 단가 결정·유료 계약** (오너 사업 결정) |
| 한국어 비자문 알림톡 템플릿 문안 초안(§Stage 3) | 실제 발신 도메인/채널 검증·수신동의(오픈빌더/채널 추가) |
| 폴백 동작 설계(카카오 미연동/실패/옵트아웃 → 이메일 → 인앱)(§Stage 4) | 발송 성공률·재시도·수신거부 처리 운영(라이브 인프라) |

원칙: **로컬 작업은 "발송 직전까지"의 모든 것**(UI·스키마·문안·폴백 로직)을 준비하고, **실제 발송·과금·외부 계정**만 오너 게이트로 남긴다.

---

## §3. 단계별 백로그 (Staged Backlog)

각 Stage는 **로컬에서 완결**되며 실발송이 없다. Stage 5(오너 외부 설정)가 끝나기 전까지 어떤 카카오 메시지도 나가지 않는다.

### Stage 1 — 채널 선호 opt-in UI (로컬 UI/모델, 무발송)

> **진행 상태 (Task 148, 2026-07-03)**: item B(카카오 행 카피)·item C(카카오 인앱 프리뷰) **로컬 완료**. item A(`alertPrefs` `{type,channel}` 확장)는 실발송 결정과 함께 착수하도록 **의도적으로 남김** — Task 148은 `alertPrefs`를 localStorage-only·무발송 그대로 유지했다.
> **후속 정합 패스 (Task 148 continuation, 2026-07-03)**: `WatchlistClient.tsx` 저장한 필터 섹션에 **저장 필터 → 조건 충족 알림 다리** 1줄 추가(`/settings/notifications` 내부 링크·"지금은 이메일(임시·베타)·카카오톡 준비 중" 일관 프레이밍). 무발송·무네트워크·매매 문구 없음. 관심 종목↔알림 무료 경로가 상단 "내 현황" CTA에 이어 저장 필터 섹션에서도 연결된다.

- **채널 선호 개념 UI** 〔🔧 잔여〕: `src/lib/alertPrefs.ts`의 현재 `Record<string, boolean>`(type→on)을 **`{type, channel}` 형태**로 확장하는 개념을 도입한다. 예: `ornscore_alert_prefs`를 `Record<string, { inapp?: boolean; email?: boolean; kakao?: boolean }>`로. **여전히 localStorage·여전히 무발송**(외부로 나가는 메시지 0). `alertCatalog`의 `id`와 키를 계속 일치시켜 실발송 파이프라인 출시 시 그대로 이전. *(Task 148 미착수 — 스키마 확장은 실발송 라이브 결정과 묶어 진행.)*
- **`NotificationChannels` 카카오 행 상세 카피** 〔✅ Task 148 완료〕: `src/components/notifications/NotificationChannels.tsx` 카카오 행에 "준비 중" 배지 유지 + 라벨 아래 1줄 보조문 "카카오톡 알림을 우선 방향으로 준비 중 · 로그인 카카오(계정)와는 별개 · 아직 실제 발송 전이에요." 추가. 이메일 "사용 중" 상태·다른 채널 무변경.
- **카카오 스타일 인앱 프리뷰** 〔✅ Task 148 완료〕: `AlertExampleCards`의 형식을 참고해, 카카오 알림톡 말풍선 형태(발신 채널명·본문·웹링크 버튼)의 **정적 예시 카드**(`src/components/notifications/KakaoAlertPreview.tsx` 신설)를 설정 페이지에 추가. "예시" 태그 + "실제 발송된 메시지가 아닙니다" 고지 포함(`AlertExampleCards.tsx:31` 패턴 재사용). 본문은 서버가 구성한 `AlertExampleData`(공시 → 점수 급변 폴백) 재사용, 네트워크 요청 0, 웹링크 버튼은 앱 내부 `/stock/{ticker}` 이동만.
- **수용 기준** 〔✅ 충족〕: 토글/프리뷰 조작이 어떤 네트워크 요청도 만들지 않음(무발송 유지). localStorage 키는 `alertCatalog.id`와 정합. SSR 한국어 정상. 44px 터치 타깃·flex-wrap 유지(레이아웃 무변경).

### Stage 2 — 이벤트/모델 설계 (로컬, 무발송)

- **`AlertEvent` 스키마**(설계 확정, 발송 미연결):

  ```ts
  interface AlertEvent {
    id: string;            // 이벤트 고유 id
    type: string;          // = alertCatalog.ts 의 AlertType.id (9종 중 하나)
    ticker?: string;       // 종목 단위 이벤트면 종목코드
    title: string;         // 알림 제목(비자문)
    body: string;          // 본문(참고 정보 톤)
    deeplink: string;      // 웹 링크(예: https://www.ornscore.com/stock/{ticker})
    occurredAt: string;    // ISO 8601
    dedupeKey: string;     // 중복 발송 방지 키(예: `${type}:${ticker}:${rcept_no}`)
  }
  ```

- **9종 카탈로그 매핑**(`alertCatalog.ts`의 `id` → 이벤트 소스):

  | AlertType.id | 이벤트 소스(기존 코드) | dedupeKey 예 |
  |---|---|---|
  | `watchlist_disclosure` | `cron/notify`·`recentSignals` 공시 신호 | `disc:{ticker}:{rcept_no}` |
  | `saved_filter_match` | `cron/evaluate-alerts`·`matchesConfig` | `filter:{alertId}:{ticker}` |
  | `watchlist_score_surge` | `scoreHistory` 전일 대비 델타 | `score:{ticker}:{date}` |
  | `watchlist_flow_surge` | `flowStats.ratio` | `flow:{ticker}:{date}` |
  | `watchlist_overheat` | 변동성/과열 지표 | `heat:{ticker}:{date}` |
  | `score_enter_80` | `compositeOf` 80 진입 | `enter80:{ticker}:{date}` |
  | `disclosure_importance_80` | 공시 중요도(미구현 모델, ④) | `impt80:{rcept_no}` |
  | `sector_rank_change` | 업종 상대 순위 | `sector:{ticker}:{date}` |
  | `backtest_match` | 백테스트 조건(실험) | `bt:{strategy}:{ticker}` |

- **선호 영속화 설계(설계만)**: 채널 선호를 로그인 사용자에 대해 서버 영속화하려면 Supabase `notification_preferences`(현재 `enabled` 단일 컬럼)에 `channels jsonb` 확장 또는 `condition_alerts`에 채널 필드 추가가 필요하다. **이번 범위에서 스키마 마이그레이션은 하지 않는다**(설계 노트로만; 발송 라이브 결정과 함께 착수, ④).
- **수용 기준**: 스키마가 9종 전부를 표현. `dedupeKey`로 중복 발송 방지 가능. 기존 `cron/notify`·`evaluate-alerts`의 중복 방지(`notification_log`·`last_match`) 패턴과 정합. 코드 미연결(설계 문서 수준).

### Stage 3 — 메시지 카피(알림톡 템플릿 초안)

한국어·비자문 알림톡 스타일. `#{변수}` 치환자 + 웹링크 버튼. **후보·탐색·확인·참고** 톤만. **매수/매도·수익 보장·목표가·가격 단정 금지.** 아래는 **문안 초안**이며, 실제 발송 전 **오너가 카카오에 사전 등록·심사**해야 한다(Stage 5). 승인된 템플릿과 1:1로만 발송 가능.

- **관심 종목 공시 발생(`watchlist_disclosure`)**
  > [오른스코어] 관심 종목 새 공시
  > #{종목명}(#{종목코드})에 새 공시 신호가 감지됐어요: #{신호라벨}
  > 호재·악재를 단정하지 않는 참고 정보예요. DART 원문에서 규모·방향을 직접 확인하세요.
  > [버튼: 종목에서 확인 → #{딥링크}]

- **저장 필터 조건 충족(`saved_filter_match`)**
  > [오른스코어] 저장 조건에 새 종목
  > '#{조건명}' 조건에 새로 부합한 종목이 #{건수}곳 있어요.
  > 자체 지표는 탐색 우선순위용 참고값이며 매수 추천이 아닙니다.
  > [버튼: 목록 보기 → #{딥링크}]

- **관심 종목 종합 점수 급변(`watchlist_score_surge`)**
  > [오른스코어] 관심 종목 점수 변화
  > #{종목명} 종합 점수가 #{이전}→#{이후}로 움직였어요.
  > 점수는 탐색 우선순위용 참고 지표예요. 변화 사실만 알리고 매매를 권하지 않습니다.
  > [버튼: 근거 보기 → #{딥링크}]

- **관심 종목 거래활성도 급증(`watchlist_flow_surge`)**
  > [오른스코어] 관심 종목 거래활성도
  > #{종목명}의 최근 거래대금이 평소의 약 #{배수}배예요.
  > 관심이 몰린다는 참고 신호일 뿐, 상승/하락 방향을 뜻하지 않습니다.
  > [버튼: 종목에서 확인 → #{딥링크}]

- **공통 원칙**: 모든 템플릿에 "투자 추천이 아닌 데이터 기반 참고 정보" 취지 고지 1줄. 변수는 `#{}`로만. 나머지 5종(과열·80진입·공시중요도·업종순위·백테스트)도 동일 톤으로 착수 시 확장. **수신거부 안내 링크**(정보성 메시지 요건)를 오너 등록 단계에서 포함.
- **수용 기준**: 금칙어 게이트(§5) 통과 문구만. 각 템플릿이 대응 `AlertType`과 1:1. 웹링크는 `www.ornscore.com` 딥링크.

### Stage 4 — 폴백 동작 (Fallback)

발송 라이브 이후의 우선순위 사다리. **이메일은 "임시(베타) 폴백"이지 메인 경로가 아니다.**

1. **카카오 알림톡** (Stage 5 완료 후 라이브) — 1순위.
2. **카카오 미연동 / 발송 실패 / 사용자 옵트아웃** → 기존 **라이브 이메일 cron**으로 폴백. `cron/notify`·`cron/evaluate-alerts`는 **무변경 유지**(현재 라이브). 이메일은 베타 임시 폴백으로만 포지셔닝(설정 페이지 배너와 일관).
3. **이메일도 불가/미로그인** → **인앱 알림 센터**(미래, 미구현) 또는 무발송(현재 동작).

- **수용 기준**: 카카오 실패가 사용자에게 조용한 손실이 되지 않음(이메일 폴백). 옵트아웃(`notification_preferences.enabled=false`)은 모든 채널을 끔. **이메일 cron 로직·발송 문구 무변경**(이번 작업 코드 변경 없음).

---

## §4. 오너 전용 외부 설정 체크리스트 (Owner-only, 빈칸·값 없음)

> 스타일 참고: `docs/ornscore-android-twa-owner-checklist.md`(fill-in 빈칸 시트). **비밀값은 저장소에 절대 넣지 않는다** — 전부 자리표시자. 아래를 채워 AI에게 돌려주면 다음 단계(발송 파이프라인 코드)를 이어간다. **이 시트를 채운다고 발송이 확정되는 것은 아니다.**

이 문서에서 **다루지 않는 것**: 실제 채널 개설, 카카오/대행사 계정 결제, 템플릿 심사 제출, 실 API 키 배치, **건당 발송 단가·유료 계약 결정**. 이 다섯은 실제 채널·발신키 확보 전까지 **손대지 않는다**.

1. **카카오 비즈니스 채널** — 개설 완료? → **Y / N**: ______ / 채널 검색용 ID(공개): ______
2. **발신프로필(알림톡 발신 주체)** — 등록/승인 상태: ______________________
3. **알림톡 템플릿 심사** — Stage 3 초안 중 등록·승인된 템플릿 코드(변수 포함): ______________________ (승인 소요 수일)
4. **대행사 선정** — Solapi / NHN Cloud / 기타: ______ / 계약 상태: ______ (건당 과금 — **단가 결정은 오너**)
5. **API 키 배치(Vercel 환경변수, 저장소 금지)** — 예: `KAKAO_ALIMTALK_API_KEY`·`KAKAO_SENDER_KEY` 등 자리표시자만. Vercel에 넣었는가? → **Y / N**: ______ (⚠️ 저장소 커밋 금지)
6. **건당 발송 단가/예산 결정** — ⛔ **유료 · 오너 결정으로만 남김**(이 문서/코드는 약정하지 않음): ______________________
7. **정보성 메시지 요건** — 수신거부(옵트아웃) 링크·수신동의 근거 확인: ______________________

- 콘솔 위치·인증 흐름 참고: 로그인 카카오는 `docs/auth-providers-setup.md`. **단, 알림톡은 로그인 카카오와 별개 인프라**이므로 새 채널·발신프로필·대행사가 필요하다.
- handoff-back: 위 1~5를 채워 돌려주면, 다음 AI가 `AlertEvent`(Stage 2)→대행사 API 어댑터→폴백(Stage 4) 순으로 **발송 코드**를 붙인다. 실 키·단가·심사만 오너 게이트로 남는다.

---

## §5. 검증 & 수용 (Verification & Acceptance)

이 작업은 **문서 우선 + 소량 카피 소프트닝**이므로 게이트는 가볍되 완전하게.

- [ ] `npx tsc --noEmit` → 0 (카피 소프트닝은 문자열 값만 변경, 타입 무영향)
- [ ] `PYTHONUTF8=1 python scripts/verify_metrics.py` → 138종목·오류 0·금칙어 0·Metrics 2.4 (금칙 스캔 대상은 `src/**/*.{ts,tsx}` — 이번 카피 변경 포함)
- [ ] 카피 `.ts`/`.tsx` 변경분 있음 → `npm run build` 통과 + `/settings/notifications` 200·SSR 한국어·카카오 채널 행 존재
- [ ] 변경 소스 U+FFFD/모지바케 0 (한글 보존)
- [ ] 톤 게이트: 신규 문구에 매수·매도·수익 보장·목표가·가격 단정 0 (부정 고지 "추천이 아닙니다"는 허용)
- [ ] 스캐폴딩 마커(`AI_CENTER_`·TODO-scaffold) 신규/편집 파일에 0

**모바일/데스크톱 영향**: 문서 추가 = 0. 카피 소프트닝 = 기존 44px 터치 타깃·flex-wrap 레이아웃 안의 **텍스트만 길어짐**(줄바꿈 자동 래핑) → 레이아웃 변경 없음, **390px 불변**. 실 브라우저 픽셀 육안 게이트는 기존 정책대로 운영자 잔여(⑤).

**불변식 유지**: 무료 · 한국어 전용(공개) · 138종목 · AI 공개 숨김 · 비자문 · 유료/Pro 비홍보. 이메일 cron·`features.ts` 플래그·점수식·로그인 매직링크 문구 무변경.
