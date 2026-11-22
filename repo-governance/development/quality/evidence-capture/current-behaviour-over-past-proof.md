---
description: "Records an observation of current behaviour, with one substitution line, when past proof can no longer be produced or would only add complexity to rebuild."
when_to_use: "Use when a plan-execution check, quality gate, audit, or delivery checklist asks for a past run, baseline, record, or verdict that nobody kept."
---

# Current Behaviour Over Past Proof

Some checks ask for proof tied to a moment that has passed: a RED run nobody captured, a baseline from a worktree that
was removed, a notice that was never written down, a rules-propagation run that should have come before the edits, or a
reviewed head that was never recorded. That moment cannot be observed again, so any record made now only describes the
attempt to rebuild it.

## The Rule

When a plan-execution check, quality gate, audit, or delivery checklist asks for past proof that can no longer be
produced, or that would only add complexity to rebuild, do not reconstruct it. Observe current behaviour instead: run
the current suites on the current head, read the live state, or read the current files. Record that observation as
ordinary evidence under this convention, and add one line that names the missing past proof and why it is unavailable.

**Reason:** the criterion is about how the work behaves now, and current behaviour can always be observed. A rebuilt
record costs effort and adds no certainty, which goes against
[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md); a fresh observation keeps the
check honest, per [Deliberate Problem-Solving](../../../principles/general/deliberate-problem-solving.md).

## Boundaries

- The observation replaces evidence; it never waives it. It must establish the criterion by itself.
- A check that can still run today runs today. Only proof bound to a past moment is replaced.
- Proof a step requires at the time it runs, such as a RED run or a Phase 0 baseline, is still captured then. This rule
  covers only proof that was not kept.
- A check that proves a current property still runs, even when it repeats a past step. A new harness still needs its
  own red, per [The Red-Green-Refactor Cycle](../../workflow/test-driven-development/the-red-green-refactor-cycle.md#a-new-harness-needs-its-own-red).
- Never re-stage a past state, back-date a record, or present a new run as an old one.
- When the behaviour itself can no longer be observed, this rule does not apply: the item stays unresolved, and
  [Execution Check](../../../workflows/plan/plan-execution-check.md#archival-is-blocked-not-warned) keeps archival
  blocked.

## Observations

- **Followed:** the evidence holds the current command, revision, time, and result that establish the criterion, plus
  one substitution line naming the missing past proof.
- **Violated:** a past artefact is rebuilt or back-dated; a verdict blocks only because unrecoverable history is missing
  while current behaviour establishes the criterion; or a check that can still run is skipped by citing this rule.

## Enforcement

**Unenforced by decision.** Whether past proof is truly unrecoverable, and whether a current observation establishes the
criterion, are judgements no mechanical check can make. `plan-execution-checker` and reviewers judge them from the
evidence and its substitution line.
