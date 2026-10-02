---
name: pr-review-synthesis-coordination
description: How pr-review-checker deduplicates, re-categorizes, reasonableness-filters, and tool-verifies the nine discipline specialists' raw findings, then posts exactly one consolidated GitHub review. Use when acting as the PR-review pipeline's coordinator/synthesis stage.
when_to_use: When acting as pr-review-checker — running the four coordination functions over raw findings, building the consolidated review header, posting via the GitHub Reviews API, or handling cross-cycle/human-dismissal state.
---

# PR Review Synthesis Coordination

## Overview

`pr-review-checker` never discovers findings itself. It consumes the nine specialists'
raw findings (or performs the single trivial-tier generalist pass itself, per DD-7) and is the
sole place a finding gets deduplicated, re-categorized, filtered for reasonableness, and
tool-verified before posting exactly ONE consolidated review.

## Reference Modules

- [four-coordination-functions.md](./reference/four-coordination-functions.md) — Deduplicate,
  Re-categorize (owns the architecture-versus-correctness boundary), Reasonableness-filter,
  Tool-verify, plus the DD-11 attribution-tracking requirement
- [consolidated-review-header.md](./reference/consolidated-review-header.md) — the
  fixed-shape review header template and the per-finding `Raised by` attribution line
- [finding-requirements.md](./reference/finding-requirements.md) —
  the finding requirements hard rules, CRITICAL-requires-reproduction, and the scope guard
- [scope-guard.md](./reference/scope-guard.md) — the scope test every surviving finding
  is measured against, and the two things it never suppresses
- [github-reviews-api-mechanics.md](./reference/github-reviews-api-mechanics.md) — posting
  mechanics (COMMENT-only constraint, SHA reuse), identity note, and untrusted-input handling
- [cross-cycle-and-external-verification.md](./reference/cross-cycle-and-external-verification.md) —
  full-PR re-review each cycle, human-dismissal respect, and when to delegate to `web-researcher`
- [machine-readable-audit-record.md](./reference/machine-readable-audit-record.md) — the stable
  post title, pass-local finding IDs, and the authenticated `ose-pr-review-pass:v1` record

## Core Principles

1. **A finding survives all four functions or it doesn't post** — never "as-is, just in case."
2. **This agent owns the architecture-versus-correctness re-categorization boundary** — the
   highest-risk of the tie-breaker outcomes; no specialist self-adjudicates its own verdict once
   reviewed here.
3. **Exactly ONE consolidated review per pass** — never one review per specialist or discipline.
   **Post it through the Reviews API as line-anchored inline threads, one per finding — NEVER
   `gh pr comment`.** A top-level comment cannot be anchored, replied to as a thread, or resolved,
   so the loop's thread-resolution query reads it as **no findings at all**. A review is a conversation
   with the author: you post the finding, the fixer replies on the same thread. Never write the
   disposition into your own comment.
4. **A `CRITICAL` finding needs reproduction, not just multi-specialist agreement.**

## Related Agents

`pr-review-scout` (upstream tier/context/dismissal-read), the nine `pr-review-*-checker`
lens specialists (raw-finding sources), `pr-review-fixer` (consumes the posted review),
`web-researcher`.
