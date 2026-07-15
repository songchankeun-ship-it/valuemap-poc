# Metrics 2.5 source package

This directory preserves the two files from the developer handoff archive as
received. They are source evidence, not an approved production specification.

- Archive: `ornscore_developer_handoff_metrics_v2_5.zip`
- Received: 2026-07-15
- SHA-256: `A8150AE5D48F58458887240D38E7EF7C35F351210D93C28477B3D76DB22B2E7F`
- Entries:
  - `ornscore_metrics_v2_5_engineering_spec_2026-07-15.md`
  - `ornscore_metrics_spec_v2_5.yaml`

The supplied YAML declares `status: draft` and leaves
`effective_market_date` unset. Do not edit these two source files to represent
an ORNScore decision. Approved amendments and implementation gates live in
[`../ornscore-metrics-v2.5.1-amendment-2026-07-15.md`](../ornscore-metrics-v2.5.1-amendment-2026-07-15.md).

Until a separate owner-approved release decision is recorded:

- public Metrics 2.4 remains authoritative;
- Metrics 2.5.1 work is private, local, and shadow-only;
- no generated shadow artifact belongs under `public/`;
- no task may push, deploy, change a data-store schema or policy, or set the
  public effective market date.
