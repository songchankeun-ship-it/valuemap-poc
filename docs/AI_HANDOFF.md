<!-- AI-DEV-CENTER:PROJECT-HANDOFF:v1:BEGIN -->
# AI Handoff

Last updated: 2026-06-22T03:44:08.561Z
Project: OrnScore
Path: C:\Users\dongy\OneDrive\바탕 화면\valuemap-poc

## Operating Agreement

- Treat this file as the shared memory between Codex, Claude, GPT, the home PC, and the work PC.
- Read this file before changing code, and update it before ending a meaningful work session.
- Keep project-specific rules in `CLAUDE.md` and `AGENTS.md` pointed back to this handoff.
- Do not revert user or other-agent changes unless the user explicitly asks.
- Prefer small verified progress, clear next steps, and reproducible checks.

## Cross-PC Workflow

- Home PC runs AI Dev Center as the 24-hour control dashboard.
- Work PC should pull/sync the project, read this handoff, work, then push/sync and update this handoff.
- When switching AI tools because of usage limits, the next AI should continue from this file instead of relying on chat history.

## Last AI Center Event

- Task: 21 - OrnScore Pass 4 disclosure & data-confidence polish
- Status: done (on branch ai-center/task-21-ornscore-pass-4-disclosure-and-data-)
- Agent: claude
- What changed: StockDisclosures.tsx only — gray-* palette unified to app-wide zinc-* (13 tokens, 0 left) with two dark-mode fixes (badge fallback + skeleton bars); per-card signal `note` surfaced as a muted sub-line (insider direction/size + body-check guidance, no new parsing); freshness header reworded `최근 90일 · 공시 N건 · 신호 N건`. className/copy only — no logic, props, imports, or deps. Non-advisory copy preserved.
- What passed: verify_metrics.py exit 0 (138 stocks, 0 errors, 0 forbidden); npm run build OK (all routes prerender, 138 stock pages); local prod smoke `/ /today /stocks /disclosures /stock/005930` all 200 / 0 error markers; new zinc+note strings confirmed in app/stock/[ticker] build chunk.
- Remaining risk: disclosure card is client+fetch rendered, so verified via build-chunk strings rather than headless pixels.
- Next task: extract DART body core numbers (acquired/disposed share count, contract amount vs prior revenue) into the disclosure card — design §18.2, blocked on body-text parsing (not yet implemented).

## Next Agent Checklist

1. Inspect the current worktree before assuming prior state is complete.
2. Read any project-specific docs linked from this file.
3. Continue the highest-priority user goal with focused edits.
4. Run the relevant finite checks.
5. Update this handoff with what changed, what passed, and what remains.

## Manual Notes

Add stable human notes below this managed block or in separate docs. The AI Dev Center will update only the managed block between the markers.
<!-- AI-DEV-CENTER:PROJECT-HANDOFF:v1:END -->
