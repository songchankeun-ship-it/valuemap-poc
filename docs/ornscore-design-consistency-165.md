# OrnScore 디자인 시스템 일관성 패스 (task 165)

시각적 소소한 불일치를 줄이기 위한 컴포넌트 일관성 정리. **재설계 아님** — 기존 다수 패턴을
표준(canon)으로 고정하고, 벗어난 소수를 맞춘다. 새 추상화는 중복이 명확한 곳(포커스 링)만 도입.

## Canon 표 (전부 저장소의 기존 다수 패턴)

| 요소 | 표준 클래스 | 근거 |
|---|---|---|
| 카드 | `rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900` | 앱 전반 지배적, 이미 일관 → 변경 없음 |
| 히어로/섹션 컨테이너 | `rounded-2xl` | HomeHero |
| 버튼/CTA | `rounded-lg` · `min-h-[44px]` · 아이콘 버튼 `gap-2` | StockDetailActionButtons(참조 구현) |
| 필/칩 | `rounded-full` | StocksExplorer, DisclosureExplorer 칩 |
| 배지 | `rounded-md` | 상태 배지 다수 |
| 버튼 포커스 링(밝은 배경) | `focus-visible:outline outline-2 outline-offset-2 outline-blue-500` | HomeHero·StockCandidateCard·SignalStockCard (4중 3) |
| 버튼 포커스 링(색상 배경) | `…outline-white` | HomeHero CTA |
| 입력 포커스 | `focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40` | StockSearchBox·GlobalSearch·StocksExplorer 검색 |
| 비활성(솔리드 버튼) | `disabled:opacity-60 disabled:cursor-not-allowed` | login·AiAnalysisCard·UserMenu 등 다수 |
| 비활성(아웃라인 버튼) | `disabled:opacity-50 disabled:cursor-not-allowed` | 관심/비교 토글 |
| 주 강조색 | 파랑(`blue-600`) | 앱 전반 |

공유 토큰: `src/components/ui/controlStyles.ts` — `FOCUS_RING`, `FOCUS_RING_ON_DARK`, `INPUT_FOCUS`
(리터럴 문자열, Tailwind 정적 스캔 안전).

## 발견된 불일치와 조치

- **포커스 링 부재(가장 큰 갭, 136파일 중 4파일만 보유)** → 주요 상호작용 컨트롤에 `FOCUS_RING` 추가.
  - 종목상세 CTA 3종: `AddToWatchlistButton`, `AddToCompareButton`, `ShareButton`
  - `WaitlistForm`(입력+제출), `StockTabs` 탭, `PricingContent` CTA
  - `DisclosureExplorer` 범위/카테고리 칩, `WatchlistClient` 뷰 토글·재시도
  - `CompareClient` 추가/제거 칩·주요 링크, `StocksExplorer` 뷰 모드 토글·프리셋/리셋
- **입력 포커스 불일치** → `WaitlistForm` 입력에 옅은 링 추가(입력 canon 정렬).
- **disabled 편차** → `CompareClient`의 `opacity-40` 아웃라인 outlier를 `opacity-50`로,
  관심/비교 토글에 `disabled:cursor-not-allowed` 보강. (지배적 `opacity-60` 솔리드 버튼은 유지.)

## 하지 않은 것 (범위 밖)

- 카드/배지 셸은 이미 일관 → 손대지 않음.
- Button/Card 컴포넌트 전면 추출 안 함(버튼이 링크·토글·아이콘 등 이질적, 추출 시 재설계 위험).
- 카피/데이터/제품 흐름/`public/data/*.json` 무변경.
