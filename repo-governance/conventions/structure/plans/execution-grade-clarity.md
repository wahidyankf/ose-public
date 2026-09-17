---
description: Defines the outcome-section and granular-checkbox detail required for execution without extra context or duplicated Gherkin.
when_to_use: Use when writing or reviewing a delivery.md checkbox for execution-grade clarity.
---

# Execution-Grade Clarity (HARD RULE)

Plans are executed by execution-grade agents. Every outcome section and action checkbox MUST be
unambiguous to a junior engineer fresh from bootcamp with no professional work experience and no
repository or stack context, chat, or tribal knowledge.

**Each checkbox MUST contain all of the following that apply:**

- **Exact path(s)**, or the maximum-detail target: parent, naming pattern, and sibling reference.
- **Verbatim command(s)** when a command is involved.
- Section-level **Input, Outcome, and Proof**, plus the applicable acceptance-criterion reference.
- Exactly one independently verifiable action per checkbox, including its prerequisites, expected
  observation, failure handling, and evidence destination. Never write only “implement”, “set up”,
  or “configure”.
- Separate RED, GREEN, and REFACTOR checkboxes for every code behaviour slice, each with its exact
  test/source path, symbol, copyable command, and expected failure/pass state.

## Counted Claims Carry the Command That Produced Them

A plan that says "only one line names this path", "just three call sites", or any other bounded
count MUST record the command that produced the number and the number itself. A count is a factual
premise, and plans use counts to justify delivery-unit boundaries — so a wrong one does not merely
mislead a reader, it mis-cuts the delivery. Write `grep -rn '<pattern>' <paths> | wc -l` and its
output beside the claim; an executor can then re-run it and see the premise still holds.

## Controlled Runbook-Reference Exception

Use a same-document, uniquely named runbook packet only for a finite cross-repository lifecycle
procedure where literal row repetition would duplicate one maintained procedure or disclose private
detail. Its finite binding to the checkbox ID or phase MUST state why the packet is needed, record
sources, copyable commands, its admitted public path or private-safe target, and the pass/fail
record. It cannot refer generically elsewhere, invent records at execution, change an existing merge
gate, or evade file-touch, scope, or acceptance requirements.

**Enforcement disposition — unenforced by decision:** contextual `plan-checker` review records the
binding and violations; no scanner or exception list is introduced. This limits drift and preserves
human readability without adding maintenance burden.

- **Canonical Gherkin references**: Name the acceptance-criterion/scenario ID or exact title and
  link its canonical PRD or `specs/**` home. Do not copy the full Gherkin into `delivery.md`.
  A cohesive outcome section may cover multiple scenarios only when they share one observable outcome and
  proof boundary; list each reference. See
  [Gherkin-Tagged Delivery Steps](../../../development/workflow/test-driven-development/gherkin-tagged-delivery-steps.md#gherkin-tagged-delivery-steps).

**HARD RULE**: `plan-checker` admits violations of this rule to the ledger. The gate's repair pass rewrites offending items with maximum detail.

**Bad**:

```markdown
- [ ] Add caching
```

**Good**:

```markdown
- [ ] Edit `apps/ose-www/src/server/trpc.ts`: wrap the public router with
      `unstable_cache(..., { revalidate: 300 })`. Verify by running
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ose-www:test:quick`
      — all tests pass.
```

**Acceptance Criteria**: All user stories in `prd.md` must include testable acceptance criteria using
Gherkin format. See [Acceptance Criteria Convention](../../../development/infra/acceptance-criteria.md)
for complete details. Deterministic gates own Gherkin mechanics; semantic plan review checks that
the referenced behaviour, outcome, and proof are complete and consistent.
