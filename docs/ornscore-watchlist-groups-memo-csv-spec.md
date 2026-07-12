# 오른스코어(OrnScore) 관심 그룹 · 메모 · CSV — 문서 우선 설계서 (Task 221, 2026-07-06)

> **목적**: 릴리스 준비 노트(Task 215~220)가 정리된 지금, 다음 제품 베팅
> [`ornscore-next-product-bets-2026-07-03.md`](./ornscore-next-product-bets-2026-07-03.md) **#1(관심 종목 고도화 — 그룹·메모·CSV)** 을
> **구현 없이 설계서로 먼저** 확정한다. 이 문서가 다음 로컬 개발 큐의 첫 슬라이스(§6)를 지정한다.
> **성격**: **문서 전용 · 앱 소스/데이터/점수식/`direction`/`metricsVersion` 무변경**. 신규 기능·스캐폴드·npm 의존성·빌드 스텝 0.
> 기존 코드는 **링크·경로로만** 참조하고 재서술하지 않는다.

---

## §0. 불변식 · 로컬 우선/프라이버시 배너

**무료 한국어 베타 v1 불변식(전부 유지 · 이 기능이 깨서는 안 됨)**
- 138종목 탐색·데이터 도구 · **AI 숨김** · 유료 공개 프레이밍 0(확정가/Pro/요금제 비교 홍보 금지).
- **비자문 프레이밍**: `매수 · 매도 · 추천 · 수익 보장 · 목표가` 금칙어 **신규 도입 0**. 그룹명·메모·CSV 어떤 표면에서도 매매 신호로 읽히면 안 됨.
- `asOfBusinessDate 20260703`(표기 `2026.07.03`) · `metricsVersion 2.4` · KO 전용 · KO/EN 토글 숨김(EN 문자열은 보존).

**로컬 우선 / 프라이버시 배너(이 기능의 핵심 계약)**
- 비로그인 = **이 기기 `localStorage`에만 저장**(서버 전송 0). 로그인 = 기존 Supabase RLS 테이블에 사용자별 저장(본인만 접근).
- **메모는 서버로 강제 업로드하지 않는다**: 비로그인 사용자의 메모/그룹은 기기를 떠나지 않는다.
- **CSV는 클라이언트 `Blob` 다운로드만** — 파일이 기기를 떠나는 것은 **사용자 본인의 행위**이며 서버 업로드가 아니다(§5).
- 개인 식별정보(PII) 수집 유도 0 — 메모 필드는 "내 근거 메모"로 안내하되 민감정보 입력을 권하지 않는다(§5).

---

## §1. 현재 상태 감사 (소스 진실 · 재서술 아님)

| 영역 | 현 상태 | 경로 |
|---|---|---|
| 관심 종목 저장 | 추가/삭제·이 기기(`localStorage`)↔로그인(Supabase `watchlists`) 이중 저장·`ornscore_watchlist`+레거시 `valuemap_watchlist` 폴백·로그인 시 1회 마이그레이션·`watchlist-changed` CustomEvent | `src/lib/watchlist.ts` (`WatchlistItem = {ticker, addedAt}`) |
| 저장 필터 | `crypto.randomUUID` id·`items.slice(0, 30)` 30개 캡·Supabase `saved_searches`(config JSON)·`saved-searches-changed` 이벤트 — **그룹/메모가 재사용할 이중 저장 + id 패턴의 표준** | `src/lib/savedSearches.ts` |
| 최근 본 종목 | 읽기 전용·10개 캡·`viewedAt` 숫자 정규화 | `src/lib/recentViews.ts` |
| 관심 페이지 UI | 내 현황 요약·간단/분석 보기 토글·인라인 제거+5초 실행 취소·`if (!hydrated) return null` 하이드레이션 가드·`localStorage` try/catch·44px 탭타깃·`aria-live` | `src/components/WatchlistClient.tsx` · `src/app/watchlist/page.tsx` |
| CSV 유틸 | **없음**(`Grep`로 확인: `src/` 내 watchlist 대상 CSV/Blob/download 유틸 0). 이 설계의 신규 표면 | — |
| 정직 프레이밍 | "담기=별도 알림 없이 로컬 기록, 메일 알림은 이메일만 임시·베타" — Task 160에서 확립 | `WatchlistClient.tsx` 내 현황 카드 |

**결론**: 그룹·메모·CSV는 **기존 이중 저장 패턴(localStorage↔Supabase)** 을 그대로 확장하면 되고, 새로 만드는 건 (a) 그룹 스키마 (b) 메모 필드 (c) CSV 반출 유틸뿐이다.

---

## §2. 데이터 모델 (기존 이중 저장 패턴 재사용)

### §2.1 관심 그룹 (`watchlistGroups`)

`savedSearches.ts` 패턴을 그대로 복제한다(신규 개념 도입 최소화).

```
type WatchlistGroup = { id: string; name: string; createdAt: string };
```
- **localStorage 키**: `ornscore_watchlist_groups` (+ 레거시 폴백 불필요 — 신규 키라 마이그레이션 대상 없음).
- **id**: `crypto.randomUUID()`(폴백 `String(Date.now())`) — `savedSearches.ts:91` 동일.
- **캡**: 그룹 최대 **20개**(`slice(0, 20)`), 그룹명 **최대 40자**(입력 시 trim + 길이 컷). savedSearches 30 캡과 같은 방어 목적.
- **이벤트**: `watchlist-groups-changed` CustomEvent(기존 `*-changed` 규약).
- **Supabase(로그인)**: 신규 테이블 `watchlist_groups(id, user_id, name, created_at)` RLS = 본인만. **오너 게이트**: 실제 테이블/RLS 마이그레이션은 오너가 Supabase에서 적용(설계는 컬럼만 명시, DDL 실행 안 함).

### §2.2 관심 아이템의 그룹 배정 + 메모 (`WatchlistItem` 확장)

```
type WatchlistItem = {
  ticker: string;
  addedAt: string;
  groupId?: string;   // 미배정이면 undefined = "전체/미분류"
  note?: string;      // 자유 텍스트, 길이 캡
};
```
- **하위호환**: `groupId`/`note`는 optional. 기존 `readLocal()`의 관대한 파서(문자열/객체 혼재 허용)에 필드 2개만 추가 — 옛 데이터는 `undefined`로 안전 로드.
- **메모 길이 캡**: **최대 500자**(저장 시 `slice(0, 500)`). 과대 입력·저장소 압박 방지. 렌더는 `break-words`.
- **그룹 삭제 시**: 해당 그룹의 아이템은 삭제하지 않고 `groupId`만 해제(미분류로 복귀) — 데이터 손실 방지.
- **Supabase(로그인)**: `watchlists` 테이블에 `group_id uuid null`·`note text null` 컬럼 추가(오너 게이트). 읽기/쓰기 매핑은 기존 `getWatchlist`/`addToWatchlist` 확장.

### §2.3 저장소 안전
- SSR: 모든 리더는 `typeof window === "undefined"` 가드(기존 규약).
- 저장소 차단(시크릿/쿼터 초과): try/catch로 조용히 degrade — 기능은 세션 한정 동작, 크래시 0(`WatchlistClient.tsx:102` 패턴).

---

## §3. CSV 컬럼 계약 (반출 우선 = MVP 첫 슬라이스)

**반출 컬럼(고정 순서)**: `ticker, name, group, note, addedAt, compositeScore`

| 컬럼 | 출처 | 비고 |
|---|---|---|
| `ticker` | `WatchlistItem.ticker` | 6자리 코드 |
| `name` | `allStocks` 룩업(`WatchlistClient`가 이미 보유) | 없으면 ticker 폴백 |
| `group` | 그룹명(미분류면 빈칸) | id 아님·사람이 읽는 이름 |
| `note` | `WatchlistItem.note` | 개행/쉼표/따옴표 이스케이프(§5) |
| `addedAt` | `WatchlistItem.addedAt` | ISO 문자열 그대로(표시용) |
| `compositeScore` | `allStocks` 룩업 | **표시용 스냅샷** — "이 시점 종합점수"일 뿐, 매매 신호 아님 |

- **파일명**: `ornscore-watchlist-YYYYMMDD.csv`(날짜는 클라이언트 로컬). 헤더 행 한국어 병기 검토(`종목코드,종목명,그룹,메모,담은날짜,종합점수`) 또는 영문 키 — 구현 시 결정(Excel 한글 깨짐은 §5 BOM으로 해결).
- **비자문 제약**: CSV 어느 컬럼도 "추천/매수/목표가"류 파생 열을 추가하지 않는다. `compositeScore`는 앱에 이미 보이는 값의 스냅샷일 뿐이며, 헤더/문서에 "참고 정보 · 매매 신호 아님" 주석을 남긴다.

---

## §4. MVP / 후속 분리

### MVP (첫 릴리스 · 낮은 리스크)
1. **CSV 반출 전용**(§6 첫 슬라이스) — 클라이언트 `Blob` 다운로드, 현재 관심 목록을 §3 컬럼으로.
2. **인라인 그룹 배정** — 관심 아이템에서 그룹 선택/생성(드롭다운), `groupId` 세팅.
3. **메모 필드** — 아이템별 자유 텍스트(500자 캡), 인라인 편집·저장.

### 후속 (검증 후)
- **CSV 가져오기**(import) — 검증·중복 병합·악성 행 거부(반출보다 리스크 큼 → 반드시 후속).
- 그룹 **이름변경·순서변경·삭제** UI(삭제 시 §2.2대로 미분류 복귀).
- **크로스 디바이스 동기화** — Supabase 컬럼/테이블 마이그레이션(오너 게이트) + 로그인 시 그룹/메모 마이그레이션(`watchlist.ts:ensureMigrated` 확장).
- 그룹별 필터/접기·그룹 단위 CSV 반출.

---

## §5. 데이터/프라이버시 리스크 (구현이 반드시 지킬 것)

1. **파일 반출 = 사용자 행위, 서버 업로드 아님** — CSV는 `URL.createObjectURL(new Blob([...]))` + `a.download` 방식. 어떤 종점(endpoint)에도 POST 하지 않는다. 반출 UI 문구에 "이 기기에서 파일로 저장" 명시.
2. **Excel 한글 깨짐** — CSV 앞에 **UTF-8 BOM(`﻿`)** 을 붙여 Excel에서 한글·종목명이 깨지지 않게 한다.
3. **CSV 수식 인젝션 방역** — `=`, `+`, `-`, `@`, 탭/CR로 시작하는 셀 값(특히 `note`·`name`)은 앞에 작은따옴표(`'`) 프리픽스로 무력화. 쉼표/따옴표/개행 포함 값은 `"..."`로 감싸고 내부 `"`는 `""`로 이스케이프(RFC 4180).
4. **메모 PII 유도 0** — 플레이스홀더/도움말은 "왜 담았는지 내 근거 메모"처럼 중립. 주민번호·계좌·비밀번호 등 민감정보 입력을 유도·요구하지 않는다. 메모는 서버 강제 업로드 없음(비로그인=로컬 전용).
5. **저장소 차단·SSR 하이드레이션 graceful degrade** — 리더 SSR 가드 + try/catch(기존 규약). 하이드레이션 전 `null` 렌더로 불일치 방지(`WatchlistClient.tsx:208`).
6. **금칙어 리뷰** — CSV 헤더/파일명/그룹 기본값/메모 플레이스홀더/UI 라벨 등 **템플릿 문자열 전수**를 `매수·매도·추천·수익 보장·목표가` 금칙어로 리뷰(`verify_metrics.py` FORBIDDEN 게이트에 걸리지 않게). 그룹 기본 이름은 중립("기본"·"관심1" 등, 매매 함의 0).

---

## §6. 다음 개발 큐 — 첫 슬라이스 (릴리스 게이트 이후 착수)

**관심 종목 CSV 반출 전용 (Effort S · Risk 낮음)**

- **범위**: `src/lib/watchlistCsv.ts`(신규, 순수 함수 — §3 컬럼·§5 방역·BOM) + `WatchlistClient.tsx`에 "CSV로 내보내기" 버튼(관심 목록 존재 시만·44px·기존 `FOCUS_RING`). 그룹/메모 없이도 **현재 필드만으로 즉시 가치**(ticker·name·addedAt·compositeScore).
- **의존 없음**: 그룹/메모 스키마·Supabase 마이그레이션 **불필요**(그 컬럼은 빈칸으로 나감). 오너 게이트 0 — 개발 단독 완결.
- **왜 첫 슬라이스인가**: 데이터 모델 확장 없이 순수 클라이언트 유틸 하나 + 버튼 하나. 되돌리기 쉽고, §7 게이트를 그대로 통과. 그룹·메모는 이 유틸이 자리잡은 뒤 additive로 얹는다.

---

## §7. 검증 게이트 (구현 시 통과해야 함)

- `npx tsc --noEmit` = 0
- `PYTHONUTF8=1 python scripts/verify_metrics.py` = 138종목 · 오류 0 · **금칙 0** · Metrics 2.4
- `npm run build` = 0(SSG 유지)
- `npm run smoke:check -- --all`(고유 고포트 · `/watchlist` 포함) = 전부 OK
- `git diff --check` 클린 · 신규/편집 파일 **U+FFFD 0**
- **제약**: 클라이언트 전용(서버 전송 0) · **신규 npm 의존성 0** · **빌드 스텝 신규 0** · 44px 탭타깃 · 390px 모바일 안전(넘침 0)
- 반출 스모크: 실제 CSV를 Excel/시트에서 열어 한글·수식 인젝션 방역 육안 확인(오너/개발 로컬).

---

## §8. 교차 참조

- 다음 제품 베팅 숏리스트 **#1**: [`ornscore-next-product-bets-2026-07-03.md`](./ornscore-next-product-bets-2026-07-03.md) §1
- 스펙 커버리지 **§2 8.2**(관심 종목 그룹/메모/CSV): [`ornscore-spec-coverage.md`](./ornscore-spec-coverage.md)
- 리텐션 루프 정직 프레이밍 선례: **Task 160**(`WatchlistClient.tsx` 담기/제거 토스트·로컬 기록 프레이밍) · **Task 196**(재방문 큐·상대시각 유틸)
- 이중 저장 + id/캡/이벤트 표준: `src/lib/savedSearches.ts` · `src/lib/watchlist.ts`

---

*작성: 2026-07-06 (Task 221, Claude). 문서 전용 · 소스 무변경. 로컬 커밋만 · 구현 착수/푸시/배포·Supabase 마이그레이션은 오너.*

---

## 2026-07-13 Implementation Note - CSV MVP

- Implemented the first CSV-only slice in `src/lib/watchlistCsv.ts` and `/watchlist`.
- Current export columns are `ticker,name,group,note,addedAt,compositeScore`; `group` and `note` are intentionally blank until the separate group/memo UX and schema decisions are made.
- Export remains browser-local only through `Blob` download. It adds UTF-8 BOM, CSV escaping, and formula-injection defense.
- Still not implemented: CSV import, inline group editor, memo editor, Supabase schema/RLS migration, cross-device group/memo sync.
