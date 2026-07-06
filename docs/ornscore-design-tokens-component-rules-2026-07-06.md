# OrnScore Design Tokens and Component Rules

> Source: 2026-07-06 design/UX reaudit, sections 4 and 5.
> Scope: documentation only. This file fixes the current product language for colors, type, cards, controls, badges, and extraction candidates. It does not change scoring, data, copy source files, or UI runtime behavior.

## 0. Product Principles

OrnScore is a work-focused finance tool, not a marketing site. Screens should feel calm, scan-friendly, and trustworthy even when the underlying data is dense.

- Lead with the user's next action, not with feature explanation.
- Put one main judgment in one card. If a card has two competing decisions, split or demote one.
- Show conclusion before raw detail: conclusion -> reason -> first check -> source.
- Keep investment-advice boundaries explicit but not noisy. Use "탐색", "확인", "참고 정보" language.
- Never use color as the only carrier of meaning. Every colored state needs a label, icon, or short text.

## 1. Current Token Sources

Canonical sources in the codebase:

- Global CSS variables: `src/app/globals.css`
- Tailwind extension tokens: `tailwind.config.ts`
- Control focus strings: `src/components/ui/controlStyles.ts`
- Data trust badges: `src/components/trust/badges.tsx`
- Score and metric primitives: `src/components/ui/ScoreGauge.tsx`, `src/components/ui/MetricChip.tsx`
- Disclosure type metadata: `src/lib/disclosureType.ts`

Use Tailwind literal classes for UI components. Runtime-composed color class names should be avoided because Tailwind static scanning can miss them.

## 2. Color Rules

### Base Surface

Use the existing zinc-based shell as the default app surface.

| Purpose | Light | Dark | Default Use |
|---|---|---|---|
| Page background | `--background` / `bg-zinc-50` family | `#0B0F14` / dark shell | App page background |
| Card surface | `bg-white` | `dark:bg-zinc-900` | Repeated cards, panels, tool surfaces |
| Soft surface | `bg-zinc-50/60` | `dark:bg-zinc-900/40` | Supporting callouts, grouped summaries |
| Border | `border-zinc-200` | `dark:border-zinc-800` | Default card border |
| Strong border | `border-zinc-300` | `dark:border-zinc-700` | Inputs, selected outlines, empty state borders |
| Primary text | `text-zinc-900` | `dark:text-zinc-100` | Main labels |
| Secondary text | `text-zinc-500/600` | `dark:text-zinc-400/300` | Supporting copy |

### Brand and Actions

- Primary app accent is blue. Prefer `blue-600`, `blue-700`, and the existing `brand` scale for active/focus states.
- Primary CTA on neutral surfaces may use `bg-zinc-900 dark:bg-zinc-100`, with the text inverted. This is the current high-confidence action pattern.
- Secondary CTA is outline on white/dark surface: `border-zinc-200 dark:border-zinc-700`.
- Use `FOCUS_RING`, `FOCUS_RING_ON_DARK`, and `INPUT_FOCUS` from `controlStyles.ts` instead of restating focus classes.

### Finance-Specific Semantics

Korean stock color convention is already encoded:

- Up/positive price movement: red (`text-red-600 dark:text-red-400`)
- Down/negative price movement: blue (`text-blue-600 dark:text-blue-400`)

Keep these colors limited to price movement, returns, and charts where the up/down meaning is explicit.

Do not use red/blue/green to imply that a disclosure type is good or bad. Disclosure categories should stay neutral slate/zinc. The meaning comes from the filing type label, check point, and DART source action.

### State Colors

| State | Use | Avoid |
|---|---|---|
| Emerald | Strength, completed checks, healthy status | Stock price up/down meaning |
| Amber | First-check, caution, delayed/partial data | Permanent alarm surfaces |
| Rose/Red | Error, high-risk warning, negative returns where explicit | Disclosure category labels |
| Blue | Brand action, info, selected controls, down price movement | Multiple unrelated meanings in the same card |
| Slate/Zinc | Disclosure type, neutral badges, metadata | Primary CTA |

## 3. Typography Rules

The report suggests larger marketing-scale type, but the current product is an operational tool. Use compact typography unless a page is a true hero.

| Role | Recommended Size | Weight | Notes |
|---|---:|---:|---|
| Page H1 | `text-xl` to `text-2xl` | 600-700 | Short page title |
| Landing hero H1 | `text-3xl` to `text-5xl` | 700 | Only for home hero |
| Section title | `text-base` to `text-lg` | 600-700 | Use with short supporting copy |
| Card title | `text-sm` to `text-base` | 600-700 | Avoid oversized headings inside cards |
| Body | `text-sm` or `text-[13px]` | 400-500 | Dense but readable |
| Caption | `text-[10px]` to `text-xs` | 400-500 | Data basis, limits, source notes |
| Numbers | any size | 600-700 | Always add `tabular-nums` |

Rules:

- Do not scale font size with viewport width.
- Keep letter spacing at default unless using a tiny uppercase label already present in the app.
- Use `break-words` or `break-keep` on dense Korean text where wrapping risk exists.
- Use `tabular-nums` for prices, dates, counts, ranks, scores, percentages, and versions.

## 4. Shape, Spacing, and Layout

### Radius

- Default cards: `rounded-lg`
- Prominent summary cards: `rounded-xl`
- Hero/landing containers only: `rounded-2xl`
- Badges: `rounded-md`
- Pills/chips: `rounded-full`

Avoid rounded card nesting. A page section should not be a floating card that contains more cards unless it is a genuine framed tool surface.

### Spacing

- Compact cards: `p-3 md:p-4`
- Summary/detail cards: `p-4 md:p-5`
- Empty states: `p-6 md:p-8`
- Grid gap: `gap-2` to `gap-4`
- Inline control gap: `gap-1.5` or `gap-2`
- Touch target minimum: `min-h-[44px]`; icon-only buttons should be at least `min-w-[44px] min-h-[44px]`

### Responsive Rules

- Use `grid-cols-1 sm:grid-cols-2 md:grid-cols-*` only when text can wrap cleanly.
- Wide tables and comparison grids must keep `overflow-x-auto`.
- Sticky elements need a real header offset decision. Avoid adding magic numbers without a 390px visual check.
- On mobile, prioritize: title -> conclusion -> one reason -> action. Defer dense rows.

## 5. Component Rules

### Stock Candidate Card

Use this order:

```text
[rank + name / sector + ticker]
[score gauge]
[strengths, max 2]
[first thing to check, max 1]
[stock detail CTA]
```

Rules:

- Home cards do not show price, daily change, 3M return, or four full metric bars.
- Strength chips should use `MetricChip` where possible.
- Risk/first-check copy should be amber or neutral, not red unless it is truly high-risk.

### Stock Detail Top Summary

Use this order:

```text
[stock identity + price + basis date]
[current conclusion]
[good points]
[check points]
[score/rank/trust]
[next actions]
```

Rules:

- The current conclusion owns the top area.
- Data trust, Metrics version, and quality badges belong below the conclusion, not above it.
- Repeated warning language should be collapsed into `먼저 확인` or one caution block.

### Disclosure Card

Use this order:

```text
[filing type / submitted date / auto classification]
[company name / filing title]
[check point]
[DART original/source action]
```

Rules:

- Use `typeMetaOf()` from `src/lib/disclosureType.ts`.
- Disclosure type colors stay neutral slate/zinc.
- Do not introduce `호재`, `악재`, bullish/bearish, buy/sell, or recommendation language.
- DART/source access must be visible when the card implies a filing.

### Backtest Risk Summary

Use this order:

```text
[read-first risk statement]
[return metric]
[drawdown metric]
[risk-adjusted comparison]
[source/limitation]
```

Rules:

- Put "성과 보장이 아님" before large return numbers.
- CAGR, MDD, and Sharpe labels should be expanded at least once on the page.
- Treat backtest holdings as historical composition examples, not current candidates.

### Empty State

Use this order:

```text
[human title]
[why this page matters]
[primary CTA]
[secondary CTA]
[optional search/add control]
[supporting login/local-storage note]
```

Rules:

- Empty states should offer a direct next action, not only explain why the page is empty.
- Login prompts are supporting copy unless the page cannot work without login.
- When using search inside an empty state, keep it below the primary route CTA unless direct search is the natural first action, as on `/compare`.

## 6. Buttons and Controls

### Primary CTA

Use for the main next step.

```text
inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px]
rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900
text-sm font-semibold transition
```

Add `FOCUS_RING` on neutral backgrounds. Use `FOCUS_RING_ON_DARK` only when the button itself is a strong colored surface and the outline needs to be white.

### Secondary CTA

Use outline styling.

```text
inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px]
rounded-lg border border-zinc-200 dark:border-zinc-700
bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100
text-sm font-medium transition
```

### Chips and Segmented Controls

- Use `rounded-full` for freeform chips.
- Use `rounded-md` inside segmented controls.
- Selected state should be visible through fill, border, and text, not color alone.
- Use `aria-pressed` for toggle buttons.

### Inputs

- Use `INPUT_FOCUS`.
- Search placeholders should be action-specific: `종목명 또는 코드 검색`, `관심 종목 검색해서 추가`.
- Avoid placeholder-only labels when the surrounding UI needs accessibility or clarity.

## 7. Badge Rules

### Data Trust and Basis

Use the primitives in `src/components/trust/badges.tsx`:

- `DataStatusBadge`
- `AsOfDateBadge`
- `MetricsVersionBadge`

Rules:

- Basis dates should be consistent across routes and use `tabular-nums`.
- Metrics version should be shown as `Metrics 2.4`, not custom variants.
- Data trust badges should not dominate the decision card.

### Strength, Caution, and Risk

- Strength: emerald + check icon/text.
- First-check/caution: amber + short label.
- High-risk/error: rose/red only when the state is genuinely urgent.
- Neutral metadata: zinc/slate.

Every badge needs text. Do not ship color-only dots unless there is adjacent text explaining them.

## 8. Copy Rules

- Default Korean style is 해요체.
- Button labels should be verbs or action phrases: `담기`, `확인하기`, `비교하기`, `종목 직접 찾기`.
- Avoid explaining internal implementation in visible UI.
- Avoid investment advice verbs except in the standard disclaimer phrase `매수·매도 추천이 아닙니다`.
- Use "공시 신호", "확인 포인트", "탐색 우선순위", "참고 정보" consistently.
- If a feature is not implemented, say "준비 중" or route to the implemented surface. Do not imply live behavior.

## 9. Extraction Candidates

Do not extract a component only because two class strings look similar. Extract when it removes real duplication or prevents policy drift.

Good next candidates:

| Candidate | Why | Likely Files |
|---|---|---|
| `EmptyStatePanel` | Watchlist, compare, disclosures, recent/history empty states share a pattern | `src/components/WatchlistClient.tsx`, `src/components/CompareClient.tsx`, `src/components/DisclosureExplorer.tsx` |
| `ActionButton` variants | Primary/secondary CTA classes repeat across pages | watchlist, compare, notification/settings, status |
| `DataBasisInline` | Date + market close + metrics version appears on many routes | header, status, stock detail, footer |
| `DisclosureCardShell` | Filing cards now have a stable hierarchy | home disclosure, `/disclosures`, stock detail disclosures |
| `ScoreSummaryCard` | Score/rank/trust layout appears in detail and comparison contexts | stock detail, compare |

Delay these:

- Full `Card` primitive: current cards have enough variants that premature extraction may create awkward props.
- Full `Button` primitive: links, buttons, toggles, and icon actions still have different semantics.
- Theme-level color overhaul: current zinc/blue system is stable enough; prioritize consistency over rebranding.

## 10. Review Checklist

Before merging UI work:

- Does every card have one primary decision?
- Does the first visible action match the user's likely next step?
- Are red/blue/green used only where their meaning is explicit?
- Are disclosures neutral and source-backed?
- Do all numeric values use `tabular-nums`?
- Are controls at least 44px tall?
- Does the 390px layout avoid clipped text and horizontal overflow?
- Is the login prompt supporting the task rather than pressuring the user?
- Are `FOCUS_RING` and `INPUT_FOCUS` used for new controls?
- Is any new phrase implying advice, performance guarantee, or live behavior that is not implemented?

Verification scale:

- Docs-only: `npx tsc --noEmit`, `PYTHONUTF8=1 python scripts/verify_metrics.py`, touched-file U+FFFD scan, `git diff --check`.
- UI code: add `npm run build`, local `verify:routes`, and `smoke:check --all`.
- Mobile-sensitive UI: add 390px browser or device visual check when the browser surface is available.
