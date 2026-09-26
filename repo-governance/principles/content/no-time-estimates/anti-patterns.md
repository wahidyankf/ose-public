---
description: Common mistakes - effort-sized phases, forecast completion dates, unlabelled estimates, and over-applying the ban.
when_to_use: Use when auditing a plan or a review finding.
---

# Anti-Patterns

## Effort-Sized Phases

FAIL: **Problem**: Sizing plan phases by duration.

```markdown
## Phase 1: Schema (2 days)

## Phase 2: API (1 week)
```

**Why it's bad**:

- Turns a guess into a commitment
- Hides the real ordering reason behind a calendar
- Holds for no particular executor

## Forecast Completion Dates

FAIL: **Problem**: Stating when planned work will finish.

```markdown
Target completion: end of Q4
Ships by 2026-10-15
```

**Why it's bad**:

- Goes stale while the plan waits in `ideas/` or `backlog/`
- Pressures executors to rush a gate instead of passing it

## Unlabelled Estimates Outside Plans

FAIL: **Problem**: Stating an estimate as if it were a fact.

```markdown
Setup takes 20 minutes.
```

PASS: **Better**: `Estimated setup time: about 20 minutes.`

**Why it matters**: Without the label, a reader treats a guess as a measurement.

## Over-Applying the Ban

FAIL: **Problem**: Stripping a labelled estimate from a tutorial, status update, evidence file, or
`learnings.md`, or flagging a product duration such as a timeout or retention period in a plan.

**Why it's bad**:

- The ban covers plan documents only
- A timeout or retention period specifies behaviour; it is not an effort estimate
