---
description: Explains the four-step promotion of a ripe two-pager into a full backlog/ plan, how execution learnings route into ideas/, and points to worked two-pager examples in the repo.
when_to_use: Use when promoting a two-pager to a backlog/ plan or routing a plan-execution learning into the ideas folder.
---

# Promoting a Two-Pager, Ideas as a Home for Learnings, and Worked Examples

## Promoting a Two-Pager to a Full Plan

Promotion is a **completeness gate, not a perfection gate**: an idea is ripe to promote when every
section holds a real answer — _including honest open questions_ — and the remaining open questions are
ones that genuinely need the full plan's deeper design/research to answer. "Not promoted yet" is a
distinct, legitimate state from "rejected" (timing and fit are separate axes from brief quality).

When a two-pager is ripe:

1. After literal user authorization to promote, create a new plan folder in `backlog/` with
   `[project-identifier]/` format (no date prefix) using the fixed mature-plan core and exactly one
   reader-led technical shape (see [Structure Decision](./structure-decision.md#structure-decision)).
2. **Run the deep prior-art study** — commission a [`web-researcher`](../../../development/agents/ai-agents.md)
   survey of precedents, standards, and existing solutions for the idea, and fold the findings into
   the plan's `brd.md` / `prd.md` as design input. The two-pager's _Prior art_ section was a
   lightweight starting point; at promotion the full plan can afford the real research.
3. Carry the two-pager's problem, scope, and open questions forward into the plan's `brd.md` / `prd.md`.
4. **Delete** the two-pager and remove its line from `plans/ideas/README.md` (the idea now lives as a
   plan).

[plan-planning](../../../workflows/plan/plan-planning.md) carries steps 1–3 with the two-pager as its input.
Confirm ripeness before it starts, and delete the two-pager only after the plan exists.

## Ideas as a Home for Execution Learnings

The [Knowledge Capture phase](./the-knowledge-capture-phase.md#the-knowledge-capture-phase-final-phase-before-archival) routes some
plan-execution learnings here: a **future-work idea** that is richer than a one-liner but not yet
plan-ready becomes a two-pager in `plans/ideas/` only with literal artifact authorization; otherwise
it is reported without plan authorization. The [Knowledge Capture Convention](../../../development/quality/knowledge-capture.md)'s
routing matrix names `plans/ideas/` as one of its candidate durable homes.

## Worked Examples

Two illustrative short-proposal artifacts already live in the repo's teaching content and are useful
models for the two-pager's shape: a Shape Up pitch
(`apps/ayokoding-www/content/en/learn/fundamentally-strong/software-engineer/software-product-engineering/learning/artifacts/ex-29-shape-up-pitch.md`)
and a product brief (`…/ex-30-full-product-brief-consistency.md`).
