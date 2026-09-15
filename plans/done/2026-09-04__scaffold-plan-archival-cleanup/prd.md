# Product Requirements — Scaffold Plan-Archival Cleanup Steps

## Product Overview

The product is the plan-authoring template and the checker that reads its output. After this plan,
an author who knows nothing about branch cleanup still produces a plan that plans for it.

## Personas

**The plan author.** Writes `delivery.md` from the template. Knows the plan's subject, not the
repository's git-hygiene conventions. Emits whatever the template scaffolds and little more.

**The plan checker.** Validates an authored plan before execution against 21 numbered rules. Cannot
flag an omission no rule describes.

**The plan executor.** Works the checklist. Opens `plan-execution` when the checklist tells it to,
which for cleanup it currently does not.

**The reviewer.** Reads the PR diff, which contains `delivery.md` and not the workflow shards.

## User Stories

**US-1** — As a plan author, the archival template gives me the worktree-removal and branch-cleanup
steps, so I do not have to know the convention to comply with it.

**US-2** — As a plan checker, I flag a plan whose archival section omits either step, so the omission
is caught before execution rather than after.

**US-3** — As a plan fixer, I have a recipe that adds the missing steps, so a flagged plan is
repairable without hand-authoring.

**US-4** — As a reviewer, I can confirm from `delivery.md` alone that cleanup was planned.

**US-5** — As a maintainer of both repositories, the same scaffolding exists in each.

## Acceptance Criteria

### AC-1: The template scaffolds both steps (US-1)

```gherkin
Scenario: A plan authored from the template includes cleanup
  Given the plan-archival authoring template has been updated
  When a new plan's archival section is authored from it
  Then that section contains a worktree-removal step for each worktree the plan provisioned
  And it contains a branch-cleanup step routing to the canonical branch-cleanup convention
  And it contains a step consuming the plan's Delivery Branch Inventory classification
```

### AC-2: The checker catches the omission, in both directions (US-2)

```gherkin
Scenario Outline: plan-checker evaluates an archival section
  Given a plan whose archival section is <state>
  When plan-checker validates it
  Then the result is <verdict>

  Examples:
    | state                                        | verdict     |
    | missing both cleanup steps                   | a finding   |
    | missing only the branch-cleanup step         | a finding   |
    | carrying both cleanup steps                  | no finding  |
    | declaring a main mode that provisions none   | no finding  |
```

### AC-3: The fixer repairs a flagged plan (US-3)

```gherkin
Scenario: plan-fixer adds the missing cleanup steps
  Given plan-checker produced an archival-cleanup finding for a plan
  When plan-fixer applies its recipe for that finding
  Then the plan's archival section gains the missing steps in the template's wording
  And re-running plan-checker on that plan produces no archival-cleanup finding
```

### AC-4: Live plans are not broken by the new check (US-2)

```gherkin
Scenario: The new check is evaluated against existing plans before landing
  Given the new check exists and every plan under plans/in-progress and plans/backlog is enumerated
  When the check runs against each of them
  Then every resulting finding is either fixed in this delivery or explicitly recorded with its reason
  And no plan is left carrying an unaddressed finding introduced by this change
```

### AC-5: Both repositories carry the same scaffolding (US-5)

```gherkin
Scenario: The scaffolding is present in both repositories
  Given the change has landed in ose-public and private-sibling
  When each repository's plan-archival template and plan-checker rule surface are read
  Then both scaffold the same two steps and both carry the same presence check
  And each repository's Skill mirrors match their sources
```

## Product Scope

**In**

- `.claude/skills/plan-creating-project-plans/reference/plan-archival.md` — the template steps.
- The `plan-validating-quality` rule surface — one presence check, placed per `tech-docs.md`.
- The `plan-applying-fixes` recipe surface — one repair recipe.
- Regenerated non-vendored Skill mirrors under `.agents/skills/`.
- The equivalent surfaces in the private sibling.
- One `rules-propagation` run per repository.

**Out**

- `branch-cleanup.md` and its `patch-equivalent-branch-cleanup.md` sibling.
- `plan-execution` finalization, which already states the obligation.
- `plans/done/` archived plans.
- Any executable gate beyond `plan-checker` itself.

## Product Risks

| Risk                                                                          | Severity | Mitigation                                                                                              |
| ----------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| The check is written one-directional and passes everything                    | High     | AC-2 is a Scenario Outline with both a firing and a non-firing row; verify both before landing.         |
| Main-mode plans provision no worktree and get a false finding                 | Medium   | The `declaring a main mode` row in AC-2 makes that case a required non-finding.                         |
| Template wording duplicates the procedure and drifts from `branch-cleanup.md` | Medium   | The template links out for the procedure and states only the plan-specific classification and ordering. |
| Existing in-progress plans start failing validation                           | Medium   | AC-4 requires enumerating them before landing, not discovering it afterwards.                           |
