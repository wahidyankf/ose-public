---
title: "Capstone"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 1
---

## The capstone: one real feature, verify-first

**Goal**: complete one real feature with an agent under a verify-first discipline -- a specified
prompt, tests as the tripwire, reviewed diffs, and a written record of what was trusted versus
verified -- landing a change fully understood by the human who accepted it, not just the agent that
generated it.

**Concepts exercised**: a specified prompt with constraints and acceptance criteria (co-05); a
tests-as-tripwire verification loop (co-13, co-14); a trust/verify decision log (co-17, co-24);
context management (co-04); catching and rejecting a wrong generation (co-15, co-16); small
reversible steps (co-12).

The feature itself is `parse_duration(s: str) -> int` -- a small, real, testable utility that
converts a compact duration string (`"1h30m"`) into a total whole-second count. It is deliberately
small: the point of this capstone is not the feature's complexity, it is that every single change
along the way -- including one genuinely wrong generation -- was run and reviewed before anything
built on top of it.

- **Step 1 -- [The prompt](./prompt.md)**: the goal, constraints, one example, seven acceptance
  criteria, and the failing tripwire test, captured failing before any implementation existed.
- **Step 2 -- [The session](./session/overview.md)**: three small, independently revertible steps --
  a first generation that is confidently, plausibly wrong; its rejection with a specific reason; the
  one-line fix; and a small behavior-preserving refactor -- every step run against the real test
  suite, never accepted on inspection alone.
- **Step 3 -- [The trust/verify log](./trust-verify-log.md)**: every change in the session mapped to
  an explicit trust-or-verify decision with a stated rationale, plus the final acceptance-criteria
  checklist.

**Acceptance criteria**: the feature passes its tests; every accepted change was verified before
being built on; the log justifies each trust/verify call; no unreviewed agent output reached the
final diff.

**Done bar**: runnable end-to-end -- `python3 -m pytest test_parse_duration.py -q` against
`learning/capstone/code/` reproduces the final `7 passed` transcript.

---

← Previous: [Advanced Examples](../advanced.md) &middot; Next: [Drilling](../../drilling/overview.md) →
