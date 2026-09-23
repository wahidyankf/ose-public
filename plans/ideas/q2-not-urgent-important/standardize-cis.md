# Standardize CIs

One-line summary: verify no CI standardization gap remains across the repos after the toolchain-parity
work, and close whatever it missed.

> Idea, added 2026-07-21 (original capture undated).

## Problem / context

CI configuration historically drifted between apps and between the three repos. The bulk of this was
absorbed by the standardize-repo-toolchain-parity mega-plan (executed across all three repos in
2026-06) and the lint-safety-parity plans. This two-pager tracks whatever CI standardization remains
**un-absorbed** by that work — it is a residual/verification idea, not a fresh greenfield one.
**Data point:** the parity work spanned all 3 repos and 7 workstreams (A–G); the residual divergence,
if any, is unmeasured until re-audited (no baseline).

## Why now

The parity work is recent enough that the residual (if any) is small and cheap to find now, before new
drift accumulates on top of a mostly-standardized baseline.

## Prior art / precedents

- **standardize-repo-toolchain-parity plan (done)** — the mega-plan (7 workstreams A–G) that absorbed
  the bulk of CI drift; this idea audits only its residual. toolchain-parity
- **lint-safety-parity plan (done)** — companion parity work also folded into the standardized baseline.
  lint-safety-parity
- **ci-checker** — the CI-standards validator agent that performs the residual audit. [ci-checker agent](../../../.claude/agents/general/ci-checker.md)

## Proposed direction (sketch)

- Audit current CI workflows across apps and repos against the parity baseline the toolchain-parity
  plan established.
- Close any remaining per-app or per-repo divergence it did not cover.

## Rough scope & non-goals

In scope: residual CI-workflow standardization not already handled by toolchain-parity.

Out of scope (for now): re-doing anything toolchain-parity already standardized; deploy-pipeline
redesign.

## Risks & open questions

- Is anything actually left after standardize-repo-toolchain-parity, or is this idea already
  discharged? (open — the audit is the first step, and "nothing remains" is a valid outcome that
  retires this idea)

## What success looks like + promotion signal

Success: CI is provably uniform across apps and repos, with no un-audited divergence. Promote to a
plan only if the audit finds a real residual gap; otherwise discard this idea as already-done.
