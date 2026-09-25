---
description: "The rubric for routing a learning to its home."
when_to_use: "Use when triaging a captured learning."
---

# The Triage Rubric: Open-Ended, Principle-Based Routing

The rubric is deliberately **open-ended** — it names common destinations but does not exhaust the
space. Route each learning to whichever durable home **owns that kind of knowledge**. Each learning
resolves to **exactly one** home, or is discarded.

## Candidate Durable Homes (including but not limited to)

| Home                                           | Route a learning here when...                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repo-governance/` (rules / conventions / dev) | It is a **rule or standard** — something that should be required, forbidden, or standardized going forward.                                                                                                                                                                                                                                                                                                                   |
| `docs/` (Diátaxis)                             | It is a durable **fact, how-to, tutorial, or explanation** a future reader would search for.                                                                                                                                                                                                                                                                                                                                  |
| `.agents/agents/`                              | It changes **what a specific agent checks, makes, or fixes** — its instructions or behaviour.                                                                                                                                                                                                                                                                                                                                 |
| `.agents/skills/`                              | It is **procedural know-how** an agent should load on-demand to perform a task well.                                                                                                                                                                                                                                                                                                                                          |
| `apps/` and `libs/` **source code**            | It is an actual **bug fix, refactor, or new feature** — codebase behaviour itself must change.                                                                                                                                                                                                                                                                                                                                |
| **tests**                                      | It needs a **new regression test or added coverage** so the failure cannot recur unnoticed.                                                                                                                                                                                                                                                                                                                                   |
| `docs/explanation/post-mortems/`               | It is a **failure/incident** learning — route to a post-mortem (cross-reference; do not duplicate content). See the [Post-Mortem Convention](../../../conventions/structure/post-mortems.md).                                                                                                                                                                                                                                 |
| `plans/ideas/` (a two-pager idea brief)        | It is a **future-work idea** — richer than a one-liner. The only destination a run may file its own future work to; `plans/backlog/` is reached only via the promotion workflow's ripeness gate. Fold it into an existing two-pager if one already covers the same area (see the [Ideas Folder convention](../../../conventions/structure/plans/ideas-folder-overview-rationale-and-file-layout.md#ideas-folder-two-pagers)). |
| `discard — not generalizable`                  | It fails the litmus: the system would **not** catch this automatically next time even if routed. Log a one-line reason.                                                                                                                                                                                                                                                                                                       |

This list is not exhaustive. A learning may route to any durable surface that owns its kind of
knowledge — these are simply the homes that recur most often in this repository.

## The Litmus Test (capture vs. discard)

**Keep a learning only if, once routed, the system would catch this automatically next time.** If
nothing durable would change behaviour as a result of routing it, discard the learning with a one-line
reason. This is the deliberate guard against over-capture: a learning that cannot possibly change
future behaviour through any durable surface is noise, not knowledge.

Apply the litmus to every candidate entry before doing anything else with it — before sanitizing,
before picking a home. An entry that fails the litmus is discarded immediately; the safety gates below
apply only to entries that survive it.
