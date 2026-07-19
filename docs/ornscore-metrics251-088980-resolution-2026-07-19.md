# Metrics 2.5.1 `088980` input resolution

Date: 2026-07-19
Scope: private Metrics 2.5.1 shadow input only
Public Metrics: unchanged at 2.4

## Finding

Ticker `088980` is Macquarie Korea Infrastructure Fund (MKIF). MKIF's official
investor information identifies it as a KRX-listed infrastructure fund, and the
local ORNScore envelope classifies it as `맥쿼리인프라` with themes `리츠` and
`고배당`. The current public record intentionally carries:

```json
{
  "ticker": "088980",
  "per": null,
  "pbr": null,
  "valueNA": true
}
```

Official reference checked 2026-07-19:
https://www.mkif.com/ko/investor-centre.html

This is not evidence that a replacement PER or PBR should be invented. It is an
explicit statement that ORNScore cannot calculate the value factor from the
current public inputs.

## Contract conflict

The Metrics 2.5.1 engine, eligibility report, measured baseline, and rollout
gate already define the safe behavior:

- retain all 138 identities;
- record `value.MISSING_INPUT` for the affected stock;
- preserve valid momentum, activity, and risk-adjusted factors;
- withhold that stock's composite score and rank eligibility;
- require at least 95% ranking coverage and zero unknown exclusion reasons.

The measured baseline is 137/138 ranking eligible, or 99.28%. The later market
input adapter accidentally required positive PER and PBR for every one of the
138 stocks, turning the explained factor exclusion into a permanent whole-day
hold. That adapter rule conflicted with the older normative contracts.

## Resolution

The adapter now accepts exactly two coherent states:

1. `per` and `pbr` are both finite and positive, with `valueNA` not true.
2. `per` and `pbr` keys both exist and are both `null`, with `valueNA: true`.

State 2 is preserved as null and delegated to the engine's existing
factor-level withholding behavior. The adapter still rejects the whole request
when keys are missing, only one value is null, `valueNA: true` contradicts
positive values, or either supplied value is non-positive/non-finite.

## Proof

- Public identity and Metrics 2.4 data are byte-unchanged.
- The adapter emits a deterministic 138-stock request with no substitution.
- The engine reports value and ranking populations of 137/138.
- `088980` keeps its other valid factor observations but has no composite score
  and is not ranking eligible.
- Ambiguous and contradictory fixtures emit no request.
- The no-write public-envelope run remains private and cannot promote Metrics
  2.5.1.

The live five-day window still begins only on the first eligible market date
after the operational activation date `2026-07-19`.
